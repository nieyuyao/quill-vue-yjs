import { MongodbPersistence } from 'y-mongodb'

const location = process.env.MONGODB_URI

// transaction collection
const transactionCollection = 'yjs-transactions'

// snapshot collection
const snapshotCollection = 'yjs-snapshots'

// version collection
const historyCollection = 'yjs-history'

// docLatestVersionCollection
const docLatestVersionCollection = 'yjs-doc-version'

const docIdCollection = 'yjs-doc-ids'

const db = new MongodbPersistence(location!, transactionCollection)

const historyDb = new MongodbPersistence(location!, historyCollection)

const snapshotDb = new MongodbPersistence(location!, snapshotCollection)

const docLatestVersionDb = new MongodbPersistence(location!, docLatestVersionCollection)

const docIdDb= new MongodbPersistence(location!, docIdCollection)

export { db, snapshotDb, historyDb, docLatestVersionDb, docIdDb  }
