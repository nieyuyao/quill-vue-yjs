<script lang="ts" setup>
import { ElInput } from 'element-plus'
import History from './History.vue'
import SaveVersion from './SaveVersion.vue'
</script>

<template>
  <div class="title">
    <ElInput style="width: 260px;" placeholder="请输入标题" />
    <div style="display: flex; align-items: center; gap: 12px;">
      <SaveVersion />
      <History />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title {
  display: flex;
  padding: 0 12px;
  justify-content: space-between;
  height: 40px;

  :deep(.el-input__wrapper) {
    border: none !important;
    background: none !important;
    box-shadow: none !important;
  }
}
</style>
