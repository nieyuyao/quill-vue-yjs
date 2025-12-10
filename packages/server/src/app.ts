import * as Y from 'yjs'
import { isEmpty } from 'lodash-es'
import Koa, { Context } from 'koa'
import Router from '@koa/router'
import cors from '@koa/cors'
import bodyParser from '@koa/bodyparser'
import { db as transactionDb, historyDb, docMetaDb } from './db'
import type { DocMetaModel, HistorySnapshotModel } from './model'
import { User, DocVersion, DocInfo } from '@quill-vue-yjs/common'
import { persistedSharedDocs } from './shared'
import { ErrorCodes } from './errors'

interface ResponseBody<T = unknown> {
  errno: number
  errmsg: string
  data?: T
}

const setCtx = <T = any>(ctx: Context, errno: number, errmsg: string, data?: T) => {
  ctx.status = 200
  ctx.body = {
    errno,
    data: data ?? {},
    errmsg,
  } satisfies ResponseBody
}

const revertUpdate = (doc: Y.Doc, snapshot: Uint8Array, docId: string) => {
  doc.gc = false
  const snapshotDoc = Y.createDocFromSnapshot(doc, Y.decodeSnapshot(snapshot))
  const snapshotVector = Y.encodeStateVector(snapshotDoc)
  const currentVector = Y.encodeStateVector(doc)
  const changesSinceSnapshotUpdate = Y.encodeStateAsUpdate(doc, snapshotVector)
  const um = new Y.UndoManager(snapshotDoc.getText('default'))
  Y.applyUpdate(snapshotDoc, changesSinceSnapshotUpdate)
  um.undo()
  const revertChangesSinceSnapshotUpdate = Y.encodeStateAsUpdate(snapshotDoc, currentVector)
  const sharedDoc = persistedSharedDocs.get(docId)
  if (sharedDoc) {
    Y.applyUpdate(sharedDoc, revertChangesSinceSnapshotUpdate)
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
    const method = ctx.request.method.toLocaleLowerCase()
    const params = method === 'get' ? ctx.request.query : ctx.request.body
    if (!params.docId) {
      setCtx(ctx, ErrorCodes.InvalidParams, 'Invalid params')
      return
    }
    await next()
    if (ctx.body) {
      ctx.headers['content-type'] = 'application/json; charset=utf-8'
    }
  })

  router.get<{}, {}, ResponseBody<{ versions: DocVersion[]}>>('/getVersionList', async (ctx) => {
    const query = ctx.request.query as { docId: string }
    try {
      const histories = (await historyDb._transact(async (db) => {
        return await db.readAsCursor({
          docId: query.docId,
        })
      })) as HistorySnapshotModel[]
      const versions: DocVersion[] = histories.map((item) => {
        return {
          docId: item.docId,
          version: item.version,
          user: item.user,
          createTime: item.createTime,
          content: (item.content.buffer as unknown as Buffer).toString('base64'),
        }
      }).filter(({ version }) => version > 0).sort((a, b) => a.version > b.version ? -1 : 1)
      setCtx<{ versions: DocVersion[]}>(ctx, ErrorCodes.Success, 'success', { versions })
    } catch (e) {
      console.error('Failed to get versions', e)
      setCtx(ctx, ErrorCodes.DatabaseException, 'Database exception')
    }
  })

  router.post('/recoveryVersion', async (ctx) => {
    const body = ctx.request.body as { docId: string; version: number }
    const { docId = '', version = 0 } = body
    if (version <= 0) {
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
        }) as HistorySnapshotModel[]
        const history = histories.find((h) => h.version === version)
        if (!history) {
          setCtx(ctx, ErrorCodes.VersionNotFound, 'Version not found')
          return
        }
        const doc = await transactionDb.getYDoc(docId)
        const { snapshot } = history
        revertUpdate(doc, new Uint8Array((snapshot.buffer as unknown as Buffer)), docId)
        setCtx(ctx, ErrorCodes.Success, 'success')
      })
    } catch (e) {
      setCtx(ctx, ErrorCodes.RevertFailed, 'Invalid params')
      console.error('Failed to recovery version', e)
    }
  })

  router.post('/saveVersion', async (ctx) => {
    const reqBody = ctx.request.body as { docId: string; user: User }
    const docId = String(reqBody.docId || '')
    const user = reqBody.user
    if (isEmpty(user)) {
      setCtx(ctx, ErrorCodes.InvalidParams, 'Invalid params')
      return
    }
    try {
      let newVersion = 1
      await docMetaDb._transact(async (db) => {
        const data = (await db.get({
          docId,
        })) as DocMetaModel | null
        if (!data) {
          db.put({
            docId,
            currentVersion: newVersion,
            title: '新建文档',
            version: 1,
          })
        } else {
          newVersion = data.currentVersion + 1
          await db.del({ docId })
          await db.put({
            docId,
            currentVersion: newVersion,
            title: data.title,
            version: 1
          })
        }
      })
      const currentYDoc = await transactionDb.getYDoc(docId)
      const stateUpdate = Y.encodeStateAsUpdate(currentYDoc)
      const snapshot = Y.encodeSnapshot(Y.snapshot(currentYDoc))
      const result = await historyDb._transact(async (db) => {
        const data: HistorySnapshotModel = {
          docId,
          version: newVersion,
          // 快照的全量更新
          content: Buffer.from(stateUpdate),
          user,
          createTime: +new Date(),
          snapshot: Buffer.from(snapshot),
        }
        return db.put(data)
      })
      console.log(result)
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
    if (!title) {
      setCtx(ctx, ErrorCodes.InvalidParams, 'Invalid params')
      return
    }
    try {
      await docMetaDb._transact(async (db) => {
        const data = (await db.get({
          docId,
        })) as DocMetaModel | null
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
    const { docId } = query
    try {
      const data = await docMetaDb._transact(async (db) => {
        let doc: DocMetaModel =  await db.get({
          docId
        })
        if (!doc) {
          doc = {
            docId,
            currentVersion: 0,
            title: '新建文档',
            version: 1,
          }
          await db.put(doc)
        }
        return doc
      }) as DocMetaModel
      setCtx<DocInfo>(ctx, ErrorCodes.Success, 'success', { docId: query.docId, title: data.title })
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
