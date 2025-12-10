declare namespace NodeJS {
  interface ProcessEnv {
    REDIS_PORT: number
    REDIS_ADDRESS: string
    PORT: number
    MONGODB_URI: string
  }
}
