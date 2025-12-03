<script lang="ts" setup>
import api from '../api'

const publishVersion = async () => {
  const data = await api.get('/saveVersion')
  console.log(data)
}
</script>

<template>
  <div class="publish" @click="publishVersion">发布版本</div>
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
