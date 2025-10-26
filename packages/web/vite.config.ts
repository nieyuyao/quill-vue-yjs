import path from 'node:path'
import fs from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
	plugins: [
		vue({}),
	],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, './web.key')),
      cert: fs.readFileSync(path.resolve(__dirname, './web.crt'))
    },
    open: true
  }
})
