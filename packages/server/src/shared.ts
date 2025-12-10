import type { WSSharedDoc } from '@y/websocket-server/utils'

export const persistedSharedDocs  = new Map<string, WSSharedDoc>()

export const persistSharedDocs= (docId, doc: WSSharedDoc) => {
  persistedSharedDocs.set(docId, doc)

  doc.on('destroy', () => {
    persistedSharedDocs.delete(docId)
  })
}
