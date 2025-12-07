import * as Y from 'yjs'
import { isEmpty } from 'lodash-es'
import Koa from 'koa'
import Router, { type RouterContext } from '@koa/router'
import cors from '@koa/cors'
import bodyParser from '@koa/bodyparser'
import type { MongodbPersistence } from 'y-mongodb'
import { db as transactionDb, historyDb, docLatestVersionDb } from './db'
import type { DocLatestVersionDocument, User } from './type'
import { getDocName, createDocName, docConns } from './shared'

interface AppContext {
  db: MongodbPersistence
  snapshotDb: MongodbPersistence
  historyDb: MongodbPersistence
  docLatestVersionDb: MongodbPersistence
}

const sendException = (ctx: RouterContext, errno: number, errmsg: string) => {
  ctx.status = 200
  ctx.body = {
    errno,
    errmsg,
  }
}

export const createApp = () => {
  const router = new Router()
  const app = new Koa()

  app.use(
    cors({
      origin: 'https://localhost:5173',
      credentials: true,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
  )

  app.use(bodyParser())

  app.use(async (ctx, next) => {
    await next()
    if (ctx.body && !ctx.response.get('Content-Type')) {
      ctx.type = 'application/json'; // 确保错误也是JSON格式
      ctx.headers['content-type'] = 'application/json; charset=utf-8'
}
  })

  router.get('/getVersionList', async (ctx: RouterContext) => {
    const query = ctx.request.query as { docId: string }
    if (!query.docId) {
      sendException(ctx, 10000, 'Invalid params')
      return
    }
    try {
      const histories = await historyDb._transact(async (db) => {
        return await db.readAsCursor({
          docId: query.docId,
        })
      })
      ctx.status = 200
      const versions = histories.map((h) => {
        return {
          ...h,
          value: h.value.buffer.toString('base64'),
        }
      })
      ctx.body = {
        errno: 0,
        versions,
        errmsg: 'success',
      }
    } catch (e) {
      console.error('Failed to get versions', e)
      sendException(ctx, 10001, 'Exception')
    }
  })

  router.post('/recoveryVersion', async (ctx: RouterContext) => {
    const body = ctx.request.body as { docId: string; version: number }
    const { docId = '', version = 0 } = body
    if (!docId || version <= 0) {
      sendException(ctx, 10000, 'Invalid params')
      return
    }
    try {
      await docLatestVersionDb._transact(async (db) => {
        const latestVersion = await db.get({ docId })
        if (version > latestVersion) {
          sendException(ctx, 10002, 'Invalid version')
          return
        }
        const histories = await historyDb._transact(async (db) => {
          return await db.readAsCursor({
            docId,
          })
        })
        const history = histories.find((h) => h.version === version)
        if (!history) {
          sendException(ctx, 10003, 'Version not found')
          return
        }
        const stateUpdate = history.value.buffer as Buffer
        const doc = new Y.Doc()
        Y.applyUpdate(doc, stateUpdate)
        const newDocName = await createDocName(docId)
        await transactionDb.storeUpdate(newDocName, stateUpdate)
        docConns.get(docId)?.send(JSON.stringify({ type: 'reload' }))
      })
    } catch (e) {
      console.error('Failed to recovery version', e)
    }
  })

  router.post('/saveVersion', async (ctx: RouterContext<any, AppContext>) => {
    const body = ctx.request.body as { docId: string; user: User }
    const docId = String(body.docId || '')
    const user = body.user
    if (!docId || isEmpty(user) || !user.name) {
      sendException(ctx, 10000, 'Invalid params')
      return
    }
    let docName = await getDocName(docId)
    if (!docName) {
      docName = await createDocName(docId)
    }
    try {
      let newVersion = 1
      await docLatestVersionDb._transact(async (db) => {
        const document = (await db.get({
          docId,
        })) as DocLatestVersionDocument | null
        if (!document) {
          db.put({
            docId,
            version: newVersion,
          })
        } else {
          const latestVersion = document.version
          newVersion = latestVersion + 1
          db.put({
            docId,
            version: newVersion,
          })
        }
      })

      const currentYDoc = await transactionDb.getYDoc(docName)
      const stateUpdate = Y.encodeStateAsUpdate(currentYDoc)
      await historyDb._transact(async (db) => {
        db.put({
          docId,
          version: newVersion,
          value: Buffer.from(stateUpdate),
          user,
          createTime: +new Date()
        })
      })
      ctx.status = 200
      ctx.body = {
        errno: 0,
        errmsg: 'success',
      }
    } catch (e) {
      console.error('Failed to save version', e)
      sendException(ctx, 10001, 'Exception')
    }
  })

  app.use(router.routes())

  app.use((ctx) => {
    ctx.status = 404
    ctx.headers['content-type'] = 'text/plain';
    ctx.body = 'Not Found'
  })

  return app
}
