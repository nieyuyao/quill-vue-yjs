import { onMounted, ref, shallowRef } from 'vue'
import Quill from 'quill'
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import * as Y from 'yjs'
import { QuillBinding } from 'y-quill'
import { WebsocketProvider } from 'y-websocket'
import QuillCursors from 'quill-cursors'

const yDoc = new Y.Doc()

const wsProvider = new WebsocketProvider('wss://localhost:9000', 'my-roomname', yDoc)

Quill.register('modules/cursors', QuillCursors)


export const useEditor = () => {
  const editorEl = ref<HTMLElement>()
  const editor = shallowRef<Quill>()


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
  })

  return {
    editorEl,
  }
}
