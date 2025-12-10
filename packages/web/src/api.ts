import axios, { AxiosResponse } from 'axios'

export type Response<T> = AxiosResponse<{
  errno: number
  errmsg: string
  data: T
}>

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_HOST
})

instance.interceptors.request.use((config) => {
  if (config.method === 'post' && config.data) {
    config.headers['Content-Type'] = 'application/json'
    config.data = JSON.stringify(config.data)
  }
  return config
})

export default instance
