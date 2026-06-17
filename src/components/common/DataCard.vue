<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  value: string | number;
  unit?: string;
  status?: 'normal' | 'warning' | 'danger';
  icon?: string;
  trend?: 'up' | 'down';
}

const props = withDefaults(defineProps<Props>(), {
  status: 'normal',
  trend: undefined
});

const statusColor = computed(() => {
  const colors = {
    normal: '#00E676',
    warning: '#FFD600',
    danger: '#FF1744'
  };
  return colors[props.status];
});
</script>

<template>
  <div class="data-card">
    <div class="card-header">
      <span class="card-title">{{ title }}</span>
      <span v-if="trend" class="trend-icon" :class="trend">
        <svg v-if="trend === 'up'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    </div>
    <div class="card-body">
      <span class="card-value" :style="{ color: statusColor }">{{ value }}</span>
      <span v-if="unit" class="card-unit">{{ unit }}</span>
    </div>
    <div class="card-glow" :style="{ background: statusColor }"></div>
  </div>
</template>

<style scoped>
.data-card {
  position: relative;
  background: linear-gradient(135deg, rgba(0, 176, 255, 0.05) 0%, rgba(10, 22, 40, 0.8) 100%);
  border: 1px solid rgba(0, 176, 255, 0.2);
  border-radius: 8px;
  padding: 16px 20px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.data-card:hover {
  border-color: rgba(0, 176, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 176, 255, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.card-title {
  font-size: 13px;
  color: #90A4AE;
  font-weight: 400;
}

.trend-icon {
  display: flex;
  align-items: center;
}

.trend-icon.up {
  color: #00E676;
}

.trend-icon.down {
  color: #FF1744;
}

.card-body {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
  font-family: 'Orbitron', 'Noto Sans SC', monospace;
  text-shadow: 0 0 20px currentColor;
  line-height: 1.2;
}

.card-unit {
  font-size: 14px;
  color: #78909C;
}

.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  opacity: 0.6;
  filter: blur(2px);
}
</style>
