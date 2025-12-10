import { onMounted, ShallowRef, shallowRef } from 'vue'
import Quill from 'quill'
import * as Y from 'yjs'
import { QuillBinding } from 'y-quill'
import { IndexeddbPersistence } from 'y-indexeddb'
import { createDecoder, readVarUint } from 'lib0/decoding'
import { WebsocketProvider } from 'y-websocket'
import QuillCursors from 'quill-cursors'
import { cursorData } from './cursor'

const yDoc = new Y.Doc()

const roomName = '1'

const wsProvider = new WebsocketProvider(import.meta.env.VITE_WS_URL, roomName, yDoc)

Quill.register('modules/cursors', QuillCursors)

wsProvider.awareness.setLocalState(
  {
    color: cursorData.color,
    name: cursorData.user.name
  },
)

wsProvider.ws?.addEventListener('message', (event) => {
  try {
    const decoder = createDecoder(new Uint8Array(event.data))
    const messageType = readVarUint(decoder);
    if (messageType === 21) {
      window.location.reload()
    }
  } catch (e) {
    console.log(e)
  }
})

export const useEditor = (editorRef: ShallowRef<HTMLDivElement | null>) => {
  const editor = shallowRef<Quill>()

  const bindEditorTextChanged = () => {}

  onMounted(() => {
    if (!editorRef.value) {
      return
    }

    const yText = yDoc.getText('default')

    editor.value = new Quill(editorRef.value, {
      modules: {
        cursors: true,
        toolbar: {
          controls: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            ['image', 'code-block'],
          ]
        },
      },
      placeholder: '请输入',
      theme: 'snow',
    })

    new QuillBinding(yText, editor.value, wsProvider.awareness)

    const provider = new IndexeddbPersistence(roomName, yDoc)

    provider.on('synced', () => {
      console.log('content from the database is loaded')
    })

    editor.value.on('text-change', bindEditorTextChanged)
  })
}
