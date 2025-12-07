import { faker } from '@faker-js/faker'
import randomColor from 'randomcolor'
import type { CursorData } from './types'

export function randomCursorData(): CursorData {
  return {
    color: randomColor({
      luminosity: 'dark',
      alpha: 1,
      format: 'hex',
    }),
    user: {
      name: `${faker.person.firstName()} ${faker.person.lastName()}`,
    }
  }
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${month < 10 ? `0${month}` : month}-${day}`
}

export function formatTime(inputTime: number): string {
  const inputDate = new Date(inputTime)
  const diff = Date.now() - +inputDate
  if (diff <= 0) {
    return '刚刚'
  }
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (seconds < 60) {
    return `${seconds}秒前`
  }
  if (minutes < 60) {
    return `${minutes}分前`
  }
  if (hours < 24) {
    return `${hours}小时前`
  }
  if (days <= 7) {
    return `${days}天前`
  }
  return formatDate(inputDate)
}
