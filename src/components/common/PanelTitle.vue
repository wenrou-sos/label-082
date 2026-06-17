<script setup lang="ts">
interface Props {
  title: string;
  icon?: string;
  extra?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="panel-title">
    <div class="title-left">
      <span class="title-decor"></span>
      <span class="title-text">{{ title }}</span>
    </div>
    <div v-if="extra" class="title-extra">{{ extra }}</div>
  </div>
</template>

<style scoped>
.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(0, 176, 255, 0.15);
  background: linear-gradient(90deg, rgba(0, 176, 255, 0.08) 0%, transparent 100%);
}

.title-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-decor {
  width: 4px;
  height: 18px;
  background: linear-gradient(180deg, #00B0FF 0%, #00E676 100%);
  border-radius: 2px;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #ECEFF1;
  letter-spacing: 1px;
}

.title-extra {
  font-size: 12px;
  color: #78909C;
}
</style>
