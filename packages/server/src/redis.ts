import Redis from 'ioredis'

export const getRedisInstance = () => {
  const redis = new Redis(process.env.REDIS_PORT, process.env.REDIS_ADDRESS)
  return redis
}
