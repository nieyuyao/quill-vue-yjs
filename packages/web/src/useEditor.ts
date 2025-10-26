import { onMounted, ref, shallowRef } from 'vue'
import Quill from 'quill'
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'


export const useEditor = () => {
  const editorEl = ref<HTMLElement>()
  const quill = shallowRef<Quill>()

  onMounted(() => {
    if (!editorEl.value) {
      return
    }
    quill.value = new Quill(editorEl.value, {
      modules: {
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
  })

  return {
    editorEl,
  }
}
