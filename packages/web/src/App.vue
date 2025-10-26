<script lang="ts" setup>
import { useEditor } from './useEditor'

const { editorEl } = useEditor()
</script>

<template>
  <div class="editor-wrap">
    <div ref="editorEl" id="editor" />
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
