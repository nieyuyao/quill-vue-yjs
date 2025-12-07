import { type WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import { docIdNameDb } from './db'

export const docConns = new Map<string, WebSocket>()

export const createDocName = async (docId: string): Promise<string> => {
  const res = await docIdNameDb._transact(async (db) => {
    const value = await db.get({ docId })
    if (value) {
      await db.del({ docId })
    }
    const neweValue = {
      docId,
      docName: uuidv4()
    }
    await db.put(neweValue)
    return neweValue
  }) as { docId: string, docName: string }
  return res.docName
}

export const getDocName = async (docId) => {
  const res = await docIdNameDb._transact(async (db) => {
    return await db.get({ docId })
  }) as ({ docId: string, docName: string } | null)
  return res?.docName ?? ''
}
