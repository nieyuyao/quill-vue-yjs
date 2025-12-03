import { Axios } from 'axios'

const instance = new Axios({
  baseURL: import.meta.env.VITE_API_HOST
})

export default instance
