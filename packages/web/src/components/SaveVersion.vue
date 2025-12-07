<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import api from '../api'
import { cursorData } from '../cursor'

const publishVersion = async () => {
  try {
    await api.post('/saveVersion', { docId: '1', user: cursorData.user })
    ElMessage({
      message: '保存成功',
      type: 'success'
    })
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <div class="publish" @click="publishVersion">保存为版本</div>
</template>

<style lang="scss" scoped>
.publish {
  font-size: 14px;
  cursor: pointer;
}
</style>
