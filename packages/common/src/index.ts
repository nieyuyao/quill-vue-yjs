export interface User {
  name: string
}

export interface DocVersion {
  docId: string
  version: number
  value: string
  user: User
  createTime: number
}

export interface DocInfo {
  docId: string
  title: string
}
