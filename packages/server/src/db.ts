import { MongodbPersistence } from 'y-mongodb'

const location = process.env.MONGODB_URI

// transaction collection
const transactionCollection = 'yjs-transactions'

// version collection
const historyCollection = 'yjs-history'

// doc meta collection
const docMetaCollection = 'yjs-doc-meta'

const db = new MongodbPersistence(location!, transactionCollection)

const historyDb = new MongodbPersistence(location!, historyCollection)

const docMetaDb = new MongodbPersistence(location!, docMetaCollection)

export { db, historyDb, docMetaDb  }
