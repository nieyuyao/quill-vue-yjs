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
    name: `${faker.person.firstName()} ${faker.person.lastName()}`,
  }
}
