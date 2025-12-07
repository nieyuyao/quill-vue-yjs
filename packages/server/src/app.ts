import * as Y from 'yjs'
import { isEmpty } from 'lodash-es'
import { createEncoder, writeVarInt, toUint8Array } from 'lib0/encoding'
import Koa from 'koa'
import Router, { type RouterContext } from '@koa/router'
import cors from '@koa/cors'
import bodyParser from '@koa/bodyparser'
import { db as transactionDb, historyDb, docMetaDb } from './db'
import type { DocMetaVersionModel, DocVersionModel } from './model'
import { User, DocVersion, DocInfo } from '@quill-vue-yjs/common'
import { getDocName, createDocName, docConns } from './shared'
import { ErrorCodes } from './errors'

interface ResponseBody<T = unknown> {
  errno: number
  errmsg: string
  data: T
}

const setCtx = <T = any>(ctx: RouterContext, errno: number, errmsg: string, data?: T) => {
  ctx.status = 200
  ctx.body = {
    errno,
    data,
    errmsg,
  } satisfies ResponseBody
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
    if (ctx.body) {
      ctx.headers['content-type'] = 'application/json; charset=utf-8'
    }
  })

  router.get<{}, {}, ResponseBody<{ versions: DocVersion[]}>>('/getVersionList', async (ctx) => {
    const query = ctx.request.query as { docId: string }
    if (!query.docId) {
      setCtx(ctx, ErrorCodes.InvalidParams, 'Invalid params')
      return
    }
    try {
      const data = (await historyDb._transact(async (db) => {
        return await db.readAsCursor({
          docId: query.docId,
        })
      })) as DocVersionModel[]
      const versions: DocVersion[] = data.map((item) => {
        return {
          docId: item.docId,
          version: item.version,
          user: item.user,
          createTime: item.createTime,
          value: item.value.buffer.toString('base64'),
        }
      })
      setCtx<{ versions: DocVersion[]}>(ctx, ErrorCodes.Success, 'success', { versions })
    } catch (e) {
      console.error('Failed to get versions', e)
      setCtx(ctx, ErrorCodes.DatabaseException, 'Database exception')
    }
  })

  router.post('/recoveryVersion', async (ctx) => {
    const body = ctx.request.body as { docId: string; version: number }
    const { docId = '', version = 0 } = body
    if (!docId || version <= 0) {
      setCtx(ctx, ErrorCodes.InvalidParams, 'Invalid params')
      return
    }
    try {
      await docMetaDb._transact(async (db) => {
        const latestVersion = await db.get({ docId })
        if (version > latestVersion) {
          setCtx(ctx, ErrorCodes.InvalidVersion, 'Invalid version')
          return
        }
        const histories = await historyDb._transact(async (db) => {
          return await db.readAsCursor({
            docId,
          })
        })
        const history = histories.find((h) => h.version === version)
        if (!history) {
          setCtx(ctx, 10003, 'Version not found')
          return
        }
        const stateUpdate = history.value.buffer as Buffer
        const doc = new Y.Doc()
        Y.applyUpdate(doc, stateUpdate)
        const newDocName = await createDocName(docId)
        await transactionDb.storeUpdate(newDocName, stateUpdate)
        setCtx(ctx, ErrorCodes.Success, 'success')
        const encoder = createEncoder()
        writeVarInt(encoder, 21)
        docConns.get(docId)?.forEach((conn) => conn.send(toUint8Array(encoder)))
      })
    } catch (e) {
      setCtx(ctx, 10003, 'Invalid params')
      console.error('Failed to recovery version', e)
    }
  })

  router.post('/saveVersion', async (ctx) => {
    const reqBody = ctx.request.body as { docId: string; user: User }
    const docId = String(reqBody.docId || '')
    const user = reqBody.user
    if (!docId || isEmpty(user) || !user.name) {
      setCtx(ctx, ErrorCodes.InvalidParams, 'Invalid params')
      return
    }
    let docName = await getDocName(docId)
    if (!docName) {
      docName = await createDocName(docId)
    }
    try {
      let newVersion = 1
      await docMetaDb._transact(async (db) => {
        const data = (await db.get({
          docId,
        })) as DocMetaVersionModel | null
        if (!data) {
          db.put({
            docId,
            version: newVersion,
            title: '新建文档',
          })
        } else {
          await db.del({ docId })
          await db.put({
            docId,
            version: data.version + 1,
            title: data.title,
          })
        }
      })
      const currentYDoc = await transactionDb.getYDoc(docName)
      const stateUpdate = Y.encodeStateAsUpdate(currentYDoc)
      await historyDb._transact(async (db) => {
        const data: DocVersionModel = {
          docId,
          version: newVersion,
          value: Buffer.from(stateUpdate),
          user,
          createTime: +new Date(),
        }
        db.put(data)
      })
      setCtx(ctx, 0, 'success')
    } catch (e) {
      console.error('Failed to save version', e)
      setCtx(ctx, ErrorCodes.DatabaseException, 'Database exception')
    }
  })

  router.post('/updateTitle', async (ctx) => {
    const reqBody = ctx.request.body as { docId: string; title: string }
    const docId = String(reqBody.docId || '')
    const title = reqBody.title
    if (!docId || !title) {
      setCtx(ctx, ErrorCodes.InvalidParams, 'Invalid params')
      return
    }
    try {
      await docMetaDb._transact(async (db) => {
        const data = (await db.get({
          docId,
        })) as DocMetaVersionModel | null
        if (!data) {
          throw new Error('document is not exist')
        }
        await db.del({ docId })
        await db.put({
          ...data,
          title,
        })
      })
      setCtx(ctx, ErrorCodes.Success, 'success')
    } catch (e) {
      console.log('Filed to update title, doc id is ', docId)
      setCtx(ctx, ErrorCodes.DatabaseException, 'Database exception')
    }
  })

  router.get<{}, {}, ResponseBody<DocInfo>>('/getDocInfo', async (ctx) => {
    const query = ctx.request.query as { docId: string }
    if (!query.docId) {
      setCtx(ctx, ErrorCodes.InvalidParams, 'Invalid params')
      return
    }
    try {
      const data = await docMetaDb._transact(async (db) => {
        return await db.get({
          docId: query.docId,
        })
      }) as DocMetaVersionModel | null
      setCtx(ctx, ErrorCodes.Success, 'success', data ? data : {})
    } catch (e) {
      console.log('Filed to update title, doc id is ', query.docId)
      setCtx(ctx, ErrorCodes.DatabaseException, 'Database exception')
    }
  })

  app.use(router.routes())

  app.use((ctx) => {
    ctx.status = 404
    ctx.headers['content-type'] = 'text/plain'
    ctx.body = 'Not Found'
  })

  return app
}
