<script lang="ts" setup>
import { ref } from 'vue'
import { DocVersion } from '@quill-vue-yjs/common'
import { ElDrawer, ElEmpty, ElMessage } from 'element-plus'
import api from '../api'

const versionRecords = ref <Array<DocVersion>>([])

const drawerVisible = ref(false)
const loading = ref(false)

const fetchHistories = async () => {
  drawerVisible.value = true
  try {
    loading.value = true
    const res = await api.get('/getVersionList', {
      params: { docId: '1' },
    })
    versionRecords.value = res.data.data.versions
  } finally {
    loading.value = false
  }
}

const recoveryVersion = async (version: number) => {
  try {
    const res = await api.post('/recoveryVersion', {
      docId: '1',
      version,
    })
    if (res.data.errno === 0) {
      ElMessage({
        message: '恢复成功',
        type: 'success',
      })
    }
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <div>
    <div class="history-records" @click="fetchHistories">历史记录</div>
    <ElDrawer v-model="drawerVisible" title="版本记录" :size="280">
      <div v-loading="loading">
        <div v-if="versionRecords.length" class="versions">
          <div
            v-for="(record, i) in versionRecords"
            :key="i"
            class="version"
            @click="recoveryVersion(record.version)"
          >
            <div>版本{{ record.version }}</div>
            <div style="display: flex; justify-content: space-between">
              <span>{{ record.user.name }} </span>
              创建时间：<span>{{ record.createTime }}</span>
            </div>
          </div>
        </div>
        <ElEmpty v-else />
      </div>
    </ElDrawer>
  </div>
</template>

<style lang="scss" scoped>
.history-records {
  font-size: 14px;
  cursor: pointer;
  overflow-y: scroll;
}
.version {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
  font-size: 12px;
  height: 40px;
  cursor: pointer;
}

:deep(.el-drawer__header) {
  margin-bottom: 0;
}
</style>
