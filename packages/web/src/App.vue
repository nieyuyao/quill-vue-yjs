<script lang="ts" setup>
import { useTemplateRef } from 'vue'
import { useEditor } from './useEditor'
import Title from './components/Title.vue'

const editorElRef = useTemplateRef('editor')

useEditor(editorElRef)
</script>

<template>
  <div>
    <Title />
    <div class="editor-wrap">
      <div ref="editor" id="editor" />
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
