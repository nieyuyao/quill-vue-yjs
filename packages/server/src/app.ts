import * as Y from 'yjs'
import { isEmpty } from 'lodash-es'
import Koa from 'koa'
import Router, { type RouterContext } from '@koa/router'
import cors from '@koa/cors'
import bodyParser from '@koa/bodyparser'
import type { MongodbPersistence } from 'y-mongodb'
import { db as transactionDb, snapshotDb, historyDb, docLatestVersionDb, docIdDb } from './db'
import type { DocLatestVersionDocument, User } from './type'

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

  app.context.transactionDb = transactionDb

  app.context.snapshotDb = snapshotDb

  app.context.historyDb = historyDb

  app.context.docLatestVersionDb = docLatestVersionDb

  app.context.docIdDb = docIdDb

  app.use(
    cors({
      origin: 'https://localhost:5173',
      credentials: true,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
  )

  app.use(bodyParser())

  app.use((ctx, next) => {
    ctx.headers['content-type'] = 'application/json'
    next()
  })

  router.get('/getVersionList', async (ctx: RouterContext) => {
    const query = ctx.request.query as { docName: string }
    if (!query.docName) {
      sendException(ctx, 10000, 'Invalid params')
      return
    }
    try {
      const histories = await historyDb._transact(async (db) => {
        return await db.readAsCursor({
          docName: query.docName,
        })
      })
      ctx.status = 200
      const versions = histories.map((h) => {
        return {
          ...h,
          value: h.value.buffer.toString('base64')
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
    const body = ctx.request.body as { docName: string, version: number }
    const { docName = '', version = 0 } = body
    if (docName || version <= 0) {
      sendException(ctx, 10000, 'Invalid params')
      return
    }
    try {
      await docLatestVersionDb._transact(async (db) => {
        const latestVersion = await db.get({ docName: body.docName })
        if (version > latestVersion) {
          sendException(ctx, 10002, 'Invalid version')
          return
        }
        const histories = await historyDb._transact(async (db) => {
          return await db.readAsCursor({
            docName,
          })
        })
        const history = histories.find(h => h.version === version)
        if (!history) {
          sendException(ctx, 10003, 'Version not found')
          return
        }
        // StateUpdate
        const content = history.value as Buffer
        const doc = new Y.Doc()
        Y.applyUpdate(doc, content)
      })

    } catch (e) {
      console.error('Failed to recovery version', e)
    }
  })

  router.post('/saveVersion', async (ctx: RouterContext<any, AppContext>) => {
    const body = ctx.request.body as { docName: string; user: User }
    const docName = String(body.docName || '')
    const user = body.user
    if (!docName || isEmpty(user) || !user.name) {
      sendException(ctx, 10000, 'Invalid params')
      return
    }
    try {
      let newVersion = 1
      await docLatestVersionDb._transact(async (db) => {
        const document = (await db.get({
          docName,
        })) as DocLatestVersionDocument | null
        if (!document) {
          db.put({
            docName,
            version: newVersion,
          })
        } else {
          const latestVersion = document.version
          newVersion = latestVersion + 1
          db.put({
            docName,
            version: newVersion,
          })
        }
      })
      const currentYDoc = await transactionDb.getYDoc(docName)
      const stateUpdate = Y.encodeStateAsUpdate(currentYDoc)
      await historyDb._transact(async (db) => {
        db.put({
          docName,
          version: newVersion,
          value: Buffer.from(stateUpdate),
          user,
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
    ctx.body = {
      error: 'Not Found',
      path: ctx.path,
    }
  })

  return app
}
