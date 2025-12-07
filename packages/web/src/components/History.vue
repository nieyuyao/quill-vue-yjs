<script lang="ts" setup>
import { ref } from 'vue'
import api from '../api'

const historiesVisible = ref(false)

const versionRecords = ref<Array<{
  docId: string
  version: number
  value: string
  user: { name: string }
  createTime: number
}>>([])

const fetchHistories = async () => {
  const res = await api.get('/getVersionList', {
    params: { docId: '1' }
   })
  historiesVisible.value = true
  versionRecords.value = res.data.versions
}

const recoveryVersion = async (version: number) => {
  await api.post('/recoveryVersion', {
    docId: '1',
    version
   })
}

</script>

<template>
  <div>
    <div class="history-records" @click="fetchHistories">历史记录</div>
    <teleport to="body">
      <div v-if="historiesVisible" class="histories">
        <div style="display: flex; justify-content: space-between;">
          <div>版本记录</div>
          <div @click="historiesVisible = false" style="cursor: pointer;">关闭</div>
        </div>
        <div class="versions">
          <div v-for="(record, i) in versionRecords" :key="i" class="version" @click="recoveryVersion(record.version)">
              <div>版本{{ record.version }}</div>
              <div style="display: flex; justify-content: space-between;">
                <span>{{ record.user.name }} </span>
                创建时间：<span>{{ record.createTime }}</span>
              </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style lang="scss" scoped>
.history-records {
  position: absolute;
  top: 10px;
  right: 24px;
  font-size: 14px;
  cursor: pointer;
  overflow-y: scroll;
}
.histories {
  position: fixed;
  top: 0;
  right: 0;
  padding: 8px 12px;
  width: 240px;
  height: 100vh;
  z-index: 100;
  box-shadow: 0 10px 16px 10px rgb(0 0 0 / 8%);
  border-left: 1px solid rgba(0, 0, 0, 0.2);
  background-color: #fff;
}
.version {
  display: flex;
  flex-direction: column;
  margin-top: 12px;
  font-size: 12px;
  height: 40px;
  cursor: pointer;
}

</style>
