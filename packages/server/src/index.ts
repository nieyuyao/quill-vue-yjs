import type { IncomingMessage } from 'node:http'
import { URL } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import https from 'node:https'
import { WebSocketServer, type WebSocket } from 'ws'
import * as Y from 'yjs'
import { MongodbPersistence } from 'y-mongodb'
import * as utils from '@y/websocket-server/utils'
import type { WSSharedDoc } from '@y/websocket-server/utils'
import { createApp } from './app'

const location = process.env.MONGODB_URI
const collection = 'yjs-transactions'

const db = new MongodbPersistence(location!, collection)

const port = process.env.PORT || 9000

const options = {
  key: fs.readFileSync(path.resolve(__dirname, '../server.key')),
  cert: fs.readFileSync(path.resolve(__dirname, '../server.crt')),
}

const app = createApp()

const server = https.createServer(options, app.callback())

const wss = new WebSocketServer({ noServer: true, perMessageDeflate: false })

wss.on('connection', (conn: WebSocket, request: IncomingMessage) => {
  const reqUrl = request.url || '/'
  const url = new URL(
    reqUrl.startsWith('https://') || reqUrl.startsWith('http://')
      ? reqUrl
      : `https://localhost${reqUrl}`
  )
  const docName = url.pathname.slice('/syncDoc/'.length)
  utils.setupWSConnection(conn, request, { docName, gc: true })
})

server.on('upgrade', (request, socket, head) => {
  const reqUrl = request.url || '/'
  const url = new URL(
    reqUrl.startsWith('https://') || reqUrl.startsWith('http://')
      ? reqUrl
      : `https://localhost${reqUrl}`
  )

  if (!url.pathname.startsWith('/syncDoc')) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy()
    return
  }

  const handleAuth = (conn: WebSocket, request: IncomingMessage) => {
    wss.emit('connection', conn, request)
  }
  wss.handleUpgrade(request, socket, head, handleAuth)
})

utils.setPersistence({
  bindState: async (docName: string, ydoc: WSSharedDoc) => {
    const persistedYdoc = await db.getYDoc(docName)
    const newUpdates = Y.encodeStateAsUpdate(ydoc)
    db.storeUpdate(docName, newUpdates)
    Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc))
    ydoc.on('update', async (update) => {
      db.storeUpdate(docName, update)
    })
  },
  writeState: function (_: string, __: utils.WSSharedDoc): Promise<any> {
    return new Promise<void>((resolve) => {
      resolve()
    })
  },
  provider: undefined,
})

server.listen(port)

console.log(`Listening to https://localhost:${port} }`)
