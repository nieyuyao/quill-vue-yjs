import { User } from "@quill-vue-yjs/common"

export interface DocMetaModel {
  docId: string
  currentVersion: number
  title: string
  version: number,
}

export interface HistorySnapshotModel {
  docId: string,
  version: number,
  snapshot: Buffer
  content: Buffer
  user: User
  createTime: number
}
