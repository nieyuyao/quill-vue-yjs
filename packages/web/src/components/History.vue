<script lang="ts" setup>
import { ref } from 'vue'
import api from '../api'

const historiesVisible = ref(false)

const fetchHistories = async () => {
  const data = await api.get('/getVersionList')
  console.log(data)
  historiesVisible.value = true
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
</style>
