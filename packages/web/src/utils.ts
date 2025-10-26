import { faker } from '@faker-js/faker'
import randomColor from 'randomcolor'

import { CursorData } from './types'
import { Descendant } from 'slate'


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

export function addAlpha(hexColor: string, opacity: number): string {
  const normalized = Math.round(Math.min(Math.max(opacity, 0), 1) * 255)

  return hexColor + normalized.toString(16).toUpperCase()
}

export type Paragraph = {
  type: 'paragraph'
  children: Descendant[]
}

export type InlineCode = {
  type: 'inline-code'
  children: Descendant[]
}

export type HeadingOne = {
  type: 'heading-one'
  children: Descendant[]
}

export type HeadingTwo = {
  type: 'heading-two'
  children: Descendant[]
}

export type BlockQuote = {
  type: 'block-quote'
  children: Descendant[]
}

export type CustomElement = Paragraph | InlineCode | HeadingOne | HeadingTwo | BlockQuote
