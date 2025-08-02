import asyncio
import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import aiohttp
import aioredis
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from prometheus_client import start_http_server
from anicli_api import AnimeGo
import json

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Метрики Prometheus
REQUEST_COUNT = Counter('anidlapi_requests_total', 'Total requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('anidlapi_request_duration_seconds', 'Request duration')
VIDEO_REQUESTS = Counter('anidlapi_video_requests_total', 'Total video requests', ['anime_id'])
ERROR_COUNT = Counter('anidlapi_errors_total', 'Total errors', ['error_type'])

# Инициализация rate limiter
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="AnidLapi Service", version="1.0.0")

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Добавление middleware для rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Кэш в памяти с TTL
class TTLCache:
    def __init__(self, ttl: int = 3600):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl
    
    def get(self, key: str) -> Optional[Any]:
        if key in self.cache:
            if time.time() - self.cache[key]['timestamp'] < self.ttl:
                return self.cache[key]['data']
            else:
                del self.cache[key]
        return None
    
    def set(self, key: str, value: Any):
        self.cache[key] = {
            'data': value,
            'timestamp': time.time()
        }
    
    def clear_expired(self):
        current_time = time.time()
        expired_keys = [
            key for key, item in self.cache.items()
            if current_time - item['timestamp'] >= self.ttl
        ]
        for key in expired_keys:
            del self.cache[key]

# Глобальный кэш
cache = TTLCache(ttl=3600)

# Fallback Anilibria API клиент
class AnilibriaFallback:
    def __init__(self):
        self.base_url = "https://api.anilibria.tv/v3"
    
    async def get_episode_video(self, anime_id: int, episode: int) -> Optional[str]:
        try:
            async with aiohttp.ClientSession() as session:
                # Получаем информацию об аниме
                async with session.get(f"{self.base_url}/title?id={anime_id}") as response:
                    if response.status == 200:
                        data = await response.json()
                        if 'player' in data and 'list' in data['player']:
                            episodes = data['player']['list']
                            if str(episode) in episodes:
                                episode_data = episodes[str(episode)]
                                if 'hls' in episode_data:
                                    return f"https://cache.libria.fun{episode_data['hls']['fhd']}"
        except Exception as e:
            logger.error(f"Anilibria fallback error: {e}")
        return None
    
    async def get_episode_qualities(self, anime_id: int, episode: int) -> Optional[Dict]:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/title?id={anime_id}") as response:
                    if response.status == 200:
                        data = await response.json()
                        if 'player' in data and 'list' in data['player']:
                            episodes = data['player']['list']
                            if str(episode) in episodes:
                                episode_data = episodes[str(episode)]
                                if 'hls' in episode_data:
                                    return {
                                        "fhd": episode_data['hls'].get('fhd'),
                                        "hd": episode_data['hls'].get('hd'),
                                        "sd": episode_data['hls'].get('sd')
                                    }
        except Exception as e:
            logger.error(f"Anilibria fallback qualities error: {e}")
        return None

anilibria_fallback = AnilibriaFallback()

# Middleware для метрик
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    # Записываем метрики
    duration = time.time() - start_time
    REQUEST_DURATION.observe(duration)
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    return response

@app.get("/video")
@limiter.limit("100/minute")
async def get_video(
    request: Request,
    anime_id: int = Query(..., alias="anime_id"),
    episode: int = Query(...)
):
    """Получение видео-потока для указанного аниме и эпизода"""
    cache_key = f"video_{anime_id}_{episode}"
    
    try:
        # Проверяем кэш
        cached_url = cache.get(cache_key)
        if cached_url:
            logger.info(f"Cache hit for video {anime_id}:{episode}")
        else:
            # Пытаемся получить через основной API
            client = AnimeGo()
            try:
                video_url = client.get_episode_video(anime_id, episode)
                if video_url:
                    cache.set(cache_key, video_url)
                    cached_url = video_url
                    logger.info(f"Got video URL from AnimeGo for {anime_id}:{episode}")
                else:
                    raise Exception("No video URL from AnimeGo")
            except Exception as e:
                logger.warning(f"AnimeGo failed for {anime_id}:{episode}: {e}")
                # Fallback на Anilibria
                fallback_url = await anilibria_fallback.get_episode_video(anime_id, episode)
                if fallback_url:
                    cache.set(cache_key, fallback_url)
                    cached_url = fallback_url
                    logger.info(f"Got video URL from Anilibria fallback for {anime_id}:{episode}")
                else:
                    ERROR_COUNT.labels(error_type="no_video_source").inc()
                    raise HTTPException(status_code=404, detail="Video not found")
        
        # Записываем метрику запроса видео
        VIDEO_REQUESTS.labels(anime_id=str(anime_id)).inc()
        
        # Проксируем видео-поток асинхронно
        async with aiohttp.ClientSession() as session:
            async with session.get(cached_url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }) as video_response:
                if video_response.status == 200:
                    content_type = video_response.headers.get('Content-Type', 'video/mp4')
                    
                    async def generate():
                        async for chunk in video_response.content.iter_chunked(1024*1024):
                            yield chunk
                    
                    return StreamingResponse(
                        generate(),
                        media_type=content_type,
                        headers={
                            'Accept-Ranges': 'bytes',
                            'Cache-Control': 'public, max-age=3600'
                        }
                    )
                else:
                    ERROR_COUNT.labels(error_type="video_stream_error").inc()
                    raise HTTPException(status_code=video_response.status, detail="Failed to stream video")
                    
    except HTTPException:
        raise
    except Exception as e:
        ERROR_COUNT.labels(error_type="general_error").inc()
        logger.error(f"Error in get_video: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/qualities")
@limiter.limit("100/minute")
async def get_qualities(
    request: Request,
    anime_id: int = Query(..., alias="anime_id"),
    episode: int = Query(...)
):
    """Получение доступных качеств для указанного аниме и эпизода"""
    cache_key = f"qualities_{anime_id}_{episode}"
    
    try:
        # Проверяем кэш
        cached_qualities = cache.get(cache_key)
        if cached_qualities:
            logger.info(f"Cache hit for qualities {anime_id}:{episode}")
            return {"qualities": cached_qualities}
        
        # Пытаемся получить через основной API
        client = AnimeGo()
        try:
            qualities = client.get_episode_qualities(anime_id, episode)
            if qualities:
                cache.set(cache_key, qualities)
                logger.info(f"Got qualities from AnimeGo for {anime_id}:{episode}")
                return {"qualities": qualities}
            else:
                raise Exception("No qualities from AnimeGo")
        except Exception as e:
            logger.warning(f"AnimeGo qualities failed for {anime_id}:{episode}: {e}")
            # Fallback на Anilibria
            fallback_qualities = await anilibria_fallback.get_episode_qualities(anime_id, episode)
            if fallback_qualities:
                cache.set(cache_key, fallback_qualities)
                logger.info(f"Got qualities from Anilibria fallback for {anime_id}:{episode}")
                return {"qualities": fallback_qualities}
            else:
                ERROR_COUNT.labels(error_type="no_qualities_source").inc()
                raise HTTPException(status_code=404, detail="Qualities not found")
                
    except HTTPException:
        raise
    except Exception as e:
        ERROR_COUNT.labels(error_type="general_error").inc()
        logger.error(f"Error in get_qualities: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    """Проверка состояния сервиса"""
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "cache_size": len(cache.cache),
        "version": "1.0.0"
    }

@app.get("/metrics")
def get_metrics():
    """Эндпоинт для метрик Prometheus"""
    return generate_latest()

@app.get("/cache/stats")
def cache_stats():
    """Статистика кэша"""
    cache.clear_expired()
    return {
        "cache_size": len(cache.cache),
        "ttl_seconds": cache.ttl,
        "keys": list(cache.cache.keys())
    }

@app.delete("/cache/clear")
def clear_cache():
    """Очистка кэша"""
    cache.cache.clear()
    return {"message": "Cache cleared successfully"}

# Запуск сервера метрик Prometheus на отдельном порту
def start_metrics_server():
    try:
        start_http_server(8001)
        logger.info("Prometheus metrics server started on port 8001")
    except Exception as e:
        logger.error(f"Failed to start metrics server: {e}")

# Периодическая очистка кэша
async def cache_cleanup_task():
    while True:
        await asyncio.sleep(300)  # Каждые 5 минут
        cache.clear_expired()
        logger.info(f"Cache cleanup completed. Current size: {len(cache.cache)}")

@app.on_event("startup")
async def startup_event():
    """Инициализация при запуске"""
    logger.info("Starting AnidLapi Service...")
    start_metrics_server()
    # Запускаем задачу очистки кэша
    asyncio.create_task(cache_cleanup_task())
    logger.info("AnidLapi Service started successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Очистка при завершении"""
    logger.info("Shutting down AnidLapi Service...")
    cache.cache.clear()
    logger.info("AnidLapi Service shutdown completed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "anidLapi_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )