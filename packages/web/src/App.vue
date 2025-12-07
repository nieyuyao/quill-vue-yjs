<script lang="ts" setup>
import { useEditor } from './useEditor'
import Title from './components/Title.vue'

const { editorEl } = useEditor()
</script>

<template>
  <div>
    <Title />
    <div class="editor-wrap">
      <div ref="editorEl" id="editor" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.editor-wrap {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 40px);

  #editor {
    flex: 1;
  }
}
</style>
