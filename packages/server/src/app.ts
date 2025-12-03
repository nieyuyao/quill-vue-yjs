import Koa from 'koa'
import Router, { type RouterContext } from '@koa/router'
import cors from '@koa/cors'


export const createApp = () => {
  const router = new Router()
  const app = new Koa()

  app.use(cors({
    origin: 'https://localhost:5173',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }))

  router.get('/getVersionList', (ctx: RouterContext) => {
    ctx.status = 200
    ctx.headers['content-type'] = 'text/plain'
    ctx.body = 'okay'
  })

  router.post('/recoveryVersion', (ctx: RouterContext) => {
    ctx.status = 200
    ctx.headers['content-type'] = 'text/plain'
    ctx.body = 'okay'
  })

  router.get('/saveVersion', (ctx: RouterContext) => {
    ctx.status = 200
    ctx.headers['content-type'] = 'text/plain'
    ctx.body = 'okay'
  })

  app.use(router.routes())

  app.use((ctx) => {
    ctx.status = 404
    ctx.body = {
      error: 'Not Found',
      path: ctx.path,
    }
  })

  return app
}
