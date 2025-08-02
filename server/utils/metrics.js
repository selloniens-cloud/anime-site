// Заглушка для метрик в режиме разработки
const metrics = {
  videoRequests: {
    inc: (labels) => {
      console.log('Video request metric:', labels);
    }
  },
  videoErrors: {
    inc: (labels) => {
      console.log('Video error metric:', labels);
    }
  }
};

module.exports = {
  metrics
};