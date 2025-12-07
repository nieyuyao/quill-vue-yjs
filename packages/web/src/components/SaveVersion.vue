<script lang="ts" setup>
import api from '../api'
import { user } from '../user'

const publishVersion = async () => {
  const data = await api.post('/saveVersion', { docId: '1', user: { name: user.name } })
  console.log(data)
}
</script>

<template>
  <div class="publish" @click="publishVersion">保存为版本</div>
</template>

<style lang="scss" scoped>
.publish {
  position: absolute;
  top: 10px;
  right: 96px;
  font-size: 14px;
  cursor: pointer;
}
</style>
