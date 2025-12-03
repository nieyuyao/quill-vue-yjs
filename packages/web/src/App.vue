<script lang="ts" setup>
import { useEditor } from './useEditor'
import History from './components/History.vue';
import SaveVersion from './components/SaveVersion.vue'

const { editorEl } = useEditor()
</script>

<template>
  <div>
    <History />
    <SaveVersion />
    <div class="editor-wrap">
      <div ref="editorEl" id="editor" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.editor-wrap {
  display: flex;
  flex-direction: column;
  height: 100vh;

  #editor {
    flex: 1;
  }
}
</style>
