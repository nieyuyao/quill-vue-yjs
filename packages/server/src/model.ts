import { User } from "@quill-vue-yjs/common"

export interface DocMetaVersionModel {
  docId: string
  version: number
  title: string
}

export interface DocVersionModel {
  docId: string
  version: number,
  value: Buffer | { buffer: Buffer },
  user: User,
  createTime: number,
}

