# Схема взаимодействия сервисов

## Общая архитектура взаимодействия

```mermaid
graph TB
    subgraph "Client Layer"
        Client[React Client<br/>:3000]
    end
    
    subgraph "Proxy Layer"
        Nginx[Nginx Reverse Proxy<br/>:80/443]
    end
    
    subgraph "Application Layer"
        NodeJS[Node.js Service<br/>:5000]
        Python[Python Service<br/>:8000]
    end
    
    subgraph "Data Layer"
        MongoDB[(MongoDB<br/>:27017)]
        Redis[(Redis<br/>:6379)]
    end
    
    subgraph "External APIs"
        AniLibriaAPI[AniLibria API<br/>api.anilibria.tv]
    end
    
    subgraph "Monitoring"
        Prometheus[Prometheus<br/>:9090]
        Grafana[Grafana<br/>:3001]
    end
    
    Client --> Nginx
    Nginx --> NodeJS
    Nginx --> Python
    
    NodeJS --> MongoDB
    NodeJS --> Redis
    Python --> MongoDB
    Python --> Redis
    Python --> AniLibriaAPI
    
    NodeJS <--> Python
    
    NodeJS --> Prometheus
    Python --> Prometheus
    Prometheus --> Grafana
```

## Детальная схема взаимодействия

### 1. Маршрутизация запросов через Nginx

```mermaid
sequenceDiagram
    participant C as Client
    participant N as Nginx
    participant NS as Node.js Service
    participant PS as Python Service
    
    Note over C,PS: Стандартный API запрос
    C->>N: GET /api/users/profile
    N->>NS: Proxy to Node.js
    NS-->>N: Response
    N-->>C: Response
    
    Note over C,PS: AniLibria API v2 запрос
    C->>N: GET /api/anilibria/v2/titles
    N->>PS: Proxy to Python
    PS-->>N: Response
    N-->>C: Response
    
    Note over C,PS: WebSocket соединение
    C->>N: WS /api/anilibria/v2/ws
    N->>PS: WebSocket Proxy
    PS-->>C: Real-time updates
```

### 2. Inter-Service Communication

```mermaid
sequenceDiagram
    participant NS as Node.js Service
    participant PS as Python Service
    participant R as Redis
    participant M as MongoDB
    participant API as AniLibria API
    
    Note over NS,API: Синхронизация данных
    NS->>PS: POST /internal/sync/title
    PS->>API: Get title data
    API-->>PS: Title data
    PS->>M: Update database
    PS->>R: Update cache
    PS-->>NS: Sync complete
    
    Note over NS,API: Уведомление о новых данных
    PS->>API: WebSocket connection
    API-->>PS: New episode event
    PS->>R: Publish event
    PS->>NS: POST /internal/notify
    NS->>R: Get subscribers
    NS-->>PS: Notification sent
```

### 3. Кеширование и синхронизация

```mermaid
graph LR
    subgraph "Cache Layers"
        L1[L1: In-Memory<br/>TTL: 5min]
        L2[L2: Redis<br/>TTL: 30min]
        L3[L3: MongoDB<br/>TTL: 24h]
    end
    
    subgraph "Data Sources"
        API[AniLibria API]
        WS[WebSocket Events]
    end
    
    Request[Client Request] --> L1
    L1 -->|Miss| L2
    L2 -->|Miss| L3
    L3 -->|Miss| API
    
    WS --> Invalidate[Cache Invalidation]
    Invalidate --> L1
    Invalidate --> L2
    Invalidate --> L3
```

## REST API взаимодействие

### Внутренние API endpoints

#### Node.js → Python Service

```http
# Синхронизация конкретного тайтла
POST /internal/sync/title
Authorization: Bearer internal_service_token
Content-Type: application/json

{
  "title_id": 9919,
  "force": false,
  "priority": "high"
}
```

```http
# Получение статистики Python сервиса
GET /internal/stats
Authorization: Bearer internal_service_token
```

```http
# Очистка кеша
DELETE /internal/cache/clear
Authorization: Bearer internal_service_token
Content-Type: application/json

{
  "pattern": "titles:*",
  "confirm": true
}
```

#### Python → Node.js Service

```http
# Уведомление о новых данных
POST /internal/anilibria/notify
Authorization: Bearer internal_service_token
Content-Type: application/json

{
  "type": "new_episode",
  "title_id": 9919,
  "episode": 18,
  "data": {
    "title": "Девочки-бабочки",
    "episode_name": "Финальная битва"
  },
  "timestamp": "2025-08-01T15:30:00Z"
}
```

```http
# Валидация JWT токена
POST /internal/auth/validate
Authorization: Bearer internal_service_token
Content-Type: application/json

{
  "token": "user_jwt_token_here"
}
```

```http
# Получение информации о пользователе
GET /internal/users/{user_id}
Authorization: Bearer internal_service_token
```

## WebSocket интеграция

### Архитектура WebSocket соединений

```mermaid
graph TB
    subgraph "Client Connections"
        C1[Client 1]
        C2[Client 2]
        C3[Client 3]
    end
    
    subgraph "WebSocket Servers"
        NSWS[Node.js Socket.io<br/>:5000/socket.io]
        PSWS[Python WebSocket<br/>:8000/ws]
    end
    
    subgraph "Message Broker"
        Redis[Redis Pub/Sub]
    end
    
    subgraph "External Events"
        AniWS[AniLibria WebSocket]
    end
    
    C1 --> NSWS
    C2 --> NSWS
    C3 --> PSWS
    
    NSWS <--> Redis
    PSWS <--> Redis
    
    AniWS --> PSWS
    PSWS --> Redis
```

### WebSocket Event Flow

```mermaid
sequenceDiagram
    participant API as AniLibria API
    participant PS as Python WebSocket
    participant R as Redis
    participant NS as Node.js Socket.io
    participant C1 as Client 1
    participant C2 as Client 2
    
    Note over API,C2: Новый эпизод выходит
    API->>PS: WebSocket: new_episode
    PS->>R: PUBLISH anilibria:new_episode
    
    Note over API,C2: Уведомление подписчиков
    R->>NS: SUBSCRIBE anilibria:new_episode
    R->>PS: SUBSCRIBE anilibria:new_episode
    
    PS->>C1: WebSocket: new_episode
    NS->>C2: Socket.io: new_episode
    
    Note over API,C2: Клиент подписывается на тайтл
    C1->>PS: subscribe_title: 9919
    PS->>R: SADD title:9919:subscribers client1
    
    Note over API,C2: Уведомление конкретного тайтла
    API->>PS: WebSocket: episode_update:9919
    PS->>R: GET title:9919:subscribers
    R-->>PS: [client1, client3]
    PS->>C1: WebSocket: episode_update
```

## Стратегия кеширования

### Многоуровневое кеширование

```python
class CacheStrategy:
    async def get_title(self, title_id: int):
        # L1: In-memory cache (fastest)
        if title_id in self.memory_cache:
            return self.memory_cache[title_id]
        
        # L2: Redis cache (fast)
        redis_key = f"anilibria:title:{title_id}"
        cached_data = await self.redis.get(redis_key)
        if cached_data:
            title = json.loads(cached_data)
            self.memory_cache[title_id] = title  # Populate L1
            return title
        
        # L3: Database cache (medium)
        db_title = await self.db.titles.find_one({"id": title_id})
        if db_title and not self._is_stale(db_title):
            await self.redis.setex(redis_key, 1800, json.dumps(db_title))
            self.memory_cache[title_id] = db_title
            return db_title
        
        # L4: External API (slowest)
        api_title = await self.anilibria_client.get_title(title_id)
        
        # Populate all cache levels
        await self.db.titles.replace_one(
            {"id": title_id}, 
            api_title, 
            upsert=True
        )
        await self.redis.setex(redis_key, 1800, json.dumps(api_title))
        self.memory_cache[title_id] = api_title
        
        return api_title
```

### Cache Invalidation Strategy

```mermaid
graph TD
    Event[New Episode Event] --> Invalidate{Invalidate Cache}
    
    Invalidate --> L1[Clear Memory Cache]
    Invalidate --> L2[Delete Redis Keys]
    Invalidate --> L3[Mark DB Stale]
    
    L1 --> Notify[Notify Other Instances]
    L2 --> Notify
    L3 --> Notify
    
    Notify --> Broadcast[Broadcast to Clients]
```

## Обработка ошибок и Fallback

### Circuit Breaker Pattern

```python
from circuit_breaker import CircuitBreaker

class AnilibriaService:
    def __init__(self):
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=5,
            recovery_timeout=30,
            expected_exception=requests.RequestException
        )
    
    @circuit_breaker
    async def get_title_from_api(self, title_id: int):
        # Call to external API
        return await self.anilibria_client.get_title(title_id)
    
    async def get_title_with_fallback(self, title_id: int):
        try:
            return await self.get_title_from_api(title_id)
        except CircuitBreakerOpenException:
            # Fallback to Node.js service
            return await self.nodejs_client.get_title(title_id)
        except Exception as e:
            # Fallback to cached data
            return await self.get_cached_title(title_id)
```

### Service Health Monitoring

```mermaid
graph TB
    subgraph "Health Checks"
        HC1[Python Service Health]
        HC2[Node.js Service Health]
        HC3[AniLibria API Health]
        HC4[Database Health]
        HC5[Redis Health]
    end
    
    subgraph "Load Balancer"
        LB[Nginx Load Balancer]
    end
    
    subgraph "Monitoring"
        Prometheus[Prometheus]
        Alerts[Alert Manager]
    end
    
    HC1 --> LB
    HC2 --> LB
    HC3 --> Prometheus
    HC4 --> Prometheus
    HC5 --> Prometheus
    
    Prometheus --> Alerts
    Alerts --> Notification[Slack/Email]
```

## Безопасность взаимодействия

### Service-to-Service Authentication

```python
# JWT для внутренних сервисов
INTERNAL_SERVICE_TOKEN = jwt.encode({
    "service": "python-anilibria",
    "permissions": ["read", "write", "notify"],
    "exp": datetime.utcnow() + timedelta(hours=24)
}, INTERNAL_JWT_SECRET)

# Middleware для валидации внутренних запросов
async def validate_internal_request(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(401, "Missing internal service token")
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, INTERNAL_JWT_SECRET, algorithms=["HS256"])
        if payload.get("service") not in ALLOWED_SERVICES:
            raise HTTPException(403, "Service not authorized")
        return payload
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid internal service token")
```

### Network Security

```yaml
# Docker network isolation
networks:
  anime-site-network:
    driver: bridge
    internal: false  # Allow external access through nginx
  
  internal-network:
    driver: bridge
    internal: true   # Internal service communication only

services:
  python-service:
    networks:
      - anime-site-network
      - internal-network
    
  nodejs-service:
    networks:
      - anime-site-network
      - internal-network
```

## Производительность и масштабирование

### Horizontal Scaling

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[Nginx Load Balancer]
    end
    
    subgraph "Python Service Instances"
        PS1[Python Service 1<br/>:8001]
        PS2[Python Service 2<br/>:8002]
        PS3[Python Service 3<br/>:8003]
    end
    
    subgraph "Node.js Service Instances"
        NS1[Node.js Service 1<br/>:5001]
        NS2[Node.js Service 2<br/>:5002]
    end
    
    subgraph "Shared Resources"
        Redis[(Redis Cluster)]
        MongoDB[(MongoDB Replica Set)]
    end
    
    LB --> PS1
    LB --> PS2
    LB --> PS3
    LB --> NS1
    LB --> NS2
    
    PS1 --> Redis
    PS2 --> Redis
    PS3 --> Redis
    NS1 --> Redis
    NS2 --> Redis
    
    PS1 --> MongoDB
    PS2 --> MongoDB
    PS3 --> MongoDB
    NS1 --> MongoDB
    NS2 --> MongoDB
```

### Connection Pooling

```python
# MongoDB connection pool
motor_client = AsyncIOMotorClient(
    MONGODB_URI,
    maxPoolSize=50,
    minPoolSize=10,
    maxIdleTimeMS=30000,
    waitQueueTimeoutMS=5000
)

# Redis connection pool
redis_pool = aioredis.ConnectionPool.from_url(
    REDIS_URL,
    max_connections=20,
    retry_on_timeout=True
)

# HTTP client with connection pooling
http_client = httpx.AsyncClient(
    limits=httpx.Limits(
        max_keepalive_connections=20,
        max_connections=100
    ),
    timeout=httpx.Timeout(30.0)
)
```

## Мониторинг взаимодействия

### Distributed Tracing

```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Настройка трассировки
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

jaeger_exporter = JaegerExporter(
    agent_host_name="jaeger",
    agent_port=6831,
)

span_processor = BatchSpanProcessor(jaeger_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

# Использование в коде
async def get_title_with_tracing(title_id: int):
    with tracer.start_as_current_span("get_title") as span:
        span.set_attribute("title_id", title_id)
        
        with tracer.start_as_current_span("cache_lookup"):
            cached_title = await get_from_cache(title_id)
        
        if not cached_title:
            with tracer.start_as_current_span("api_call"):
                title = await fetch_from_api(title_id)
        
        return title
```

### Metrics Collection

```python
# Custom metrics для взаимодействия сервисов
INTER_SERVICE_REQUESTS = Counter(
    'inter_service_requests_total',
    'Total inter-service requests',
    ['source_service', 'target_service', 'endpoint', 'status']
)

INTER_SERVICE_DURATION = Histogram(
    'inter_service_request_duration_seconds',
    'Inter-service request duration',
    ['source_service', 'target_service', 'endpoint']
)

# Middleware для сбора метрик
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    INTER_SERVICE_DURATION.labels(
        source_service="python",
        target_service="nodejs",
        endpoint=request.url.path
    ).observe(duration)
    
    INTER_SERVICE_REQUESTS.labels(
        source_service="python",
        target_service="nodejs",
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    return response
```

Эта схема обеспечивает надежное, масштабируемое и безопасное взаимодействие между сервисами с полным мониторингом и возможностью горизонтального масштабирования.