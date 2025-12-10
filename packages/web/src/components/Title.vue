<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { ElInput, ElMessage } from 'element-plus'
import api, { type Response } from '../api'
import History from './History.vue'
import SaveVersion from './SaveVersion.vue'
import { DocInfo } from '@quill-vue-yjs/common'

const title = ref('')

const onChange = async (newTitle: string) => {
  const { data  } = await api.post<any, Response<{}>>('/updateTitle', { params: { docId: '1', title: newTitle }})
  if (!data.errno) {
    ElMessage({
        message: '更新成功',
        type: 'success',
      })
  }
}

onMounted(async () => {
  const { data } = await api.get<any, Response<DocInfo>>('/getDocInfo', {
    params: { docId: '1' }
  })
  title.value = data.data.title
})

</script>

<template>
  <div class="title">
    <ElInput style="width: 260px;" placeholder="请输入标题" v-model="title" @change="onChange" />
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
