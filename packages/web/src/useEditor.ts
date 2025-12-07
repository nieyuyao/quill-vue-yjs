import { onMounted, ref, shallowRef } from 'vue'
import Quill from 'quill'
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import * as Y from 'yjs'
import { QuillBinding } from 'y-quill'
import { WebsocketProvider } from 'y-websocket'
import QuillCursors from 'quill-cursors'
import { user } from './user'

const yDoc = new Y.Doc()

const wsProvider = new WebsocketProvider(import.meta.env.VITE_WS_URL, '1', yDoc)

Quill.register('modules/cursors', QuillCursors)

wsProvider.awareness.setLocalState({
  user,
})

wsProvider.ws?.addEventListener('message', (event) => {
  try {
    const data = JSON.parse(event.data)
    if (data.type === 'reload') {
      window.location.reload()
    }
  } catch (e) {
    console.log(e)
  }
})

export const useEditor = () => {
  const editorEl = ref<HTMLDivElement | null>(null)
  const editor = shallowRef<Quill>()

  const bindEditorTextChanged = () => {}

  onMounted(() => {
    if (!editorEl.value) {
      return
    }

    const yText = yDoc.getText('quill')

    editor.value = new Quill(editorEl.value, {
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
      theme: 'snow', // or 'bubble'
    })

    new QuillBinding(yText, editor.value, wsProvider.awareness)

    editor.value.on('text-change', bindEditorTextChanged)
  })

  return {
    editorEl,
  }
}
