export interface User {
  name: string
}

export interface DocVersion {
  docId: string
  version: number
  content: string
  user: User
  createTime: number
}

export interface DocInfo {
  docId: string
  title: string
}
