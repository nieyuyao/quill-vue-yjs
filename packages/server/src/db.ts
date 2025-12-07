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

const docIdNameCollection = 'yjs-doc-id-name'

const db = new MongodbPersistence(location!, transactionCollection)

const historyDb = new MongodbPersistence(location!, historyCollection)

const snapshotDb = new MongodbPersistence(location!, snapshotCollection)

const docLatestVersionDb = new MongodbPersistence(location!, docLatestVersionCollection)

const docIdNameDb = new MongodbPersistence(location!, docIdNameCollection)

export { db, snapshotDb, historyDb, docLatestVersionDb, docIdNameDb  }
