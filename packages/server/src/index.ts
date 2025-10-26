import type { IncomingMessage } from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import https from 'node:https'
import { WebSocketServer, type WebSocket } from 'ws'
import * as Y from 'yjs'
import { MongodbPersistence } from 'y-mongodb'
import * as utils from '@y/websocket-server/utils'
import type { WSSharedDoc } from '@y/websocket-server/utils'

const location = process.env.MONGODB_URI
const collection = 'yjs-transactions'
const db = new MongodbPersistence(location!, collection)

const port = process.env.PORT || 9000

const options = {
  key: fs.readFileSync(path.resolve(__dirname, '../server.key')),
  cert: fs.readFileSync(path.resolve(__dirname, '../server.crt')),
};

const server = https.createServer(options, (_, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' })
  response.end('okay')
})

const wss = new WebSocketServer({ noServer: true })

wss.on('connection', (conn: WebSocket, request: IncomingMessage) => {
  utils.setupWSConnection(conn, request)
})
server.on('upgrade', (request, socket, head) => {
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
   return new Promise<void>(resolve => {
      resolve()
    })
  },
  provider: undefined
})

server.listen(port)

console.log(`Listening to https://localhost:${port} }`)
