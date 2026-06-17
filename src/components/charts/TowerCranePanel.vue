<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import type { TowerCraneData } from '@/types';
import { useThresholdConfig } from '@/composables/useThresholdConfig';

interface Props {
  data: TowerCraneData[];
}

const props = defineProps<Props>();
const { config } = useThresholdConfig();

const gaugeRefs = ref<Record<string, HTMLElement | null>>({});
const gaugeInstances = ref<Record<string, echarts.ECharts | null>>({});
const isInitialized = ref(false);

const statusColors = {
  normal: '#00E676',
  warning: '#FFD600',
  danger: '#FF1744'
};

const computeParamStatus = (
  value: number,
  max: number,
  warningRatio: number,
  dangerRatio: number
): 'normal' | 'warning' | 'danger' => {
  const ratio = value / max;
  if (ratio > dangerRatio) return 'danger';
  if (ratio > warningRatio) return 'warning';
  return 'normal';
};

const createGaugeOption = (
  value: number,
  max: number,
  unit: string,
  status: 'normal' | 'warning' | 'danger'
) => {
  const color = statusColors[status];
  
  return {
    series: [
      {
        type: 'gauge',
        startAngle: 220,
        endAngle: -40,
        min: 0,
        max: max,
        splitNumber: 5,
        radius: '90%',
        progress: {
          show: true,
          width: 8,
          roundCap: true,
          itemStyle: {
            color: color,
            shadowBlur: 8,
            shadowColor: color
          }
        },
        axisLine: {
          lineStyle: {
            width: 8,
            color: [[1, 'rgba(0, 176, 255, 0.1)']]
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: true,
          length: 6,
          distance: -3,
          lineStyle: {
            color: 'rgba(0, 176, 255, 0.25)',
            width: 1
          }
        },
        axisLabel: {
          show: false
        },
        pointer: {
          show: true,
          length: '55%',
          width: 3,
          itemStyle: {
            color: color
          }
        },
        anchor: {
          show: true,
          size: 6,
          itemStyle: {
            color: color,
            borderColor: color,
            borderWidth: 2
          }
        },
        title: {
          show: false
        },
        detail: {
          valueAnimation: true,
          fontSize: 16,
          fontWeight: 700,
          color: color,
          offsetCenter: ['0%', '15%'],
          formatter: `{value}${unit}`,
          fontFamily: 'Orbitron, Noto Sans SC, monospace'
        },
        data: [{ value }]
      }
    ]
  };
};

const getCurrentKeys = () => {
  const keys: string[] = [];
  props.data.forEach(crane => {
    keys.push(`${crane.id}-load`, `${crane.id}-wind`, `${crane.id}-angle`);
  });
  return keys;
};

const disposeUnusedGauges = () => {
  const currentKeys = new Set(getCurrentKeys());
  Object.keys(gaugeInstances.value).forEach(key => {
    if (!currentKeys.has(key)) {
      gaugeInstances.value[key]?.dispose();
      delete gaugeInstances.value[key];
    }
  });
};

const initGauges = async () => {
  await nextTick();
  await nextTick();
  
  disposeUnusedGauges();
  
  props.data.forEach(crane => {
    const keys = [`${crane.id}-load`, `${crane.id}-wind`, `${crane.id}-angle`];
    
    keys.forEach(key => {
      const el = gaugeRefs.value[key];
      if (el && el.clientWidth > 0 && el.clientHeight > 0) {
        if (!gaugeInstances.value[key]) {
          gaugeInstances.value[key] = echarts.init(el);
        }
      }
    });
  });
  
  updateGauges();
  isInitialized.value = true;
};

const updateGauges = () => {
  props.data.forEach(crane => {
    const loadKey = `${crane.id}-load`;
    const windKey = `${crane.id}-wind`;
    const angleKey = `${crane.id}-angle`;

    const loadStatus = computeParamStatus(
      crane.load,
      crane.maxLoad,
      config.crane.load.warningRatio,
      config.crane.load.dangerRatio
    );

    if (gaugeInstances.value[loadKey]) {
      gaugeInstances.value[loadKey]?.setOption(
        createGaugeOption(crane.load, crane.maxLoad, 't', loadStatus),
        true
      );
    }

    const windStatus = computeParamStatus(
      crane.windSpeed,
      crane.maxWindSpeed,
      config.crane.wind.warningRatio,
      config.crane.wind.dangerRatio
    );

    if (gaugeInstances.value[windKey]) {
      gaugeInstances.value[windKey]?.setOption(
        createGaugeOption(crane.windSpeed, crane.maxWindSpeed, 'm/s', windStatus),
        true
      );
    }

    if (gaugeInstances.value[angleKey]) {
      gaugeInstances.value[angleKey]?.setOption(
        createGaugeOption(crane.angle, 360, '°', 'normal'),
        true
      );
    }
  });
};

watch(() => props.data, async (newData, oldData) => {
  if (!isInitialized.value) return;
  
  const oldIds = new Set((oldData || []).map(c => c.id));
  const newIds = new Set(newData.map(c => c.id));
  const idsChanged = oldIds.size !== newIds.size || 
    [...oldIds].some(id => !newIds.has(id)) || 
    [...newIds].some(id => !oldIds.has(id));
  
  if (idsChanged) {
    await initGauges();
  } else {
    updateGauges();
  }
}, { deep: true });

watch(
  () => [config.crane.load.warningRatio, config.crane.load.dangerRatio, config.crane.wind.warningRatio, config.crane.wind.dangerRatio],
  () => {
    if (isInitialized.value) {
      updateGauges();
    }
  },
  { deep: true }
);

const allAlarms = computed(() => {
  return props.data.flatMap(crane => 
    crane.alarms.map(alarm => ({
      ...alarm,
      craneName: crane.name
    }))
  ).sort((a, b) => b.time.localeCompare(a.time));
});

const handleResize = () => {
  Object.values(gaugeInstances.value).forEach(instance => {
    instance?.resize();
  });
};

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  setTimeout(() => {
    initGauges();
  }, 100);
  
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  Object.values(gaugeInstances.value).forEach(instance => {
    instance?.dispose();
  });
  gaugeInstances.value = {};
});
</script>

<template>
  <div class="tower-crane-panel">
    <div class="crane-list">
      <div
        v-for="crane in data"
        :key="crane.id"
        class="crane-card"
        :class="crane.status"
      >
        <div class="crane-header">
          <span class="crane-name">{{ crane.name }}</span>
          <span class="status-badge" :class="crane.status">
            <span class="status-dot"></span>
            {{ crane.status === 'normal' ? '正常运行' : crane.status === 'warning' ? '预警' : '报警' }}
          </span>
        </div>
        <div class="gauge-row">
          <div class="gauge-item">
            <div class="gauge-label">吊重</div>
            <div 
              :ref="el => { if (el) gaugeRefs[`${crane.id}-load`] = el as HTMLElement }" 
              class="gauge-chart"
            ></div>
          </div>
          <div class="gauge-item">
            <div class="gauge-label">风速</div>
            <div 
              :ref="el => { if (el) gaugeRefs[`${crane.id}-wind`] = el as HTMLElement }" 
              class="gauge-chart"
            ></div>
          </div>
          <div class="gauge-item">
            <div class="gauge-label">角度</div>
            <div 
              :ref="el => { if (el) gaugeRefs[`${crane.id}-angle`] = el as HTMLElement }" 
              class="gauge-chart"
            ></div>
          </div>
        </div>
        <div class="crane-info">
          <div class="info-item">
            <span class="info-label">起升高度</span>
            <span class="info-value">{{ crane.height }} m</span>
          </div>
          <div class="info-item">
            <span class="info-label">额定吊重</span>
            <span class="info-value">{{ crane.maxLoad }} t</span>
          </div>
        </div>
      </div>
    </div>
    <div class="alarm-list">
      <div class="alarm-title">
        <span>报警记录</span>
        <span class="alarm-count">{{ allAlarms.length }}</span>
      </div>
      <div class="alarm-scroll">
        <div
          v-for="alarm in allAlarms"
          :key="alarm.id"
          class="alarm-item"
          :class="alarm.level"
        >
          <div class="alarm-icon">
            <svg v-if="alarm.level === 'danger'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="alarm-content">
            <div class="alarm-header">
              <span class="alarm-type">{{ alarm.type }}</span>
              <span class="alarm-time">{{ alarm.time }}</span>
            </div>
            <div class="alarm-message">{{ alarm.craneName }} - {{ alarm.message }}</div>
          </div>
          <div v-if="alarm.hasPhoto" class="alarm-photo">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>
        </div>
        <div v-if="allAlarms.length === 0" class="no-alarm">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <span>暂无报警</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tower-crane-panel {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
}

.crane-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.crane-card {
  background: rgba(0, 176, 255, 0.03);
  border: 1px solid rgba(0, 176, 255, 0.15);
  border-radius: 8px;
  padding: 14px;
  transition: all 0.3s ease;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.crane-card.warning {
  border-color: rgba(255, 214, 0, 0.3);
  background: rgba(255, 214, 0, 0.03);
}

.crane-card.danger {
  border-color: rgba(255, 23, 68, 0.4);
  background: rgba(255, 23, 68, 0.05);
  animation: dangerPulse 2s infinite;
}

@keyframes dangerPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 23, 68, 0.2);
  }
  50% {
    box-shadow: 0 0 20px 5px rgba(255, 23, 68, 0.3);
  }
}

.crane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.crane-name {
  font-size: 14px;
  font-weight: 600;
  color: #ECEFF1;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.normal {
  background: rgba(0, 230, 118, 0.15);
  color: #00E676;
}

.status-badge.warning {
  background: rgba(255, 214, 0, 0.15);
  color: #FFD600;
}

.status-badge.danger {
  background: rgba(255, 23, 68, 0.15);
  color: #FF1744;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.gauge-row {
  display: flex;
  justify-content: space-around;
  flex: 1;
  min-height: 0;
}

.gauge-item {
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge-label {
  font-size: 12px;
  color: #90A4AE;
  margin-bottom: 4px;
  flex-shrink: 0;
}

.gauge-chart {
  width: 100%;
  flex: 1;
  min-height: 0;
}

.crane-info {
  display: flex;
  justify-content: space-around;
  padding-top: 8px;
  margin-top: 8px;
  border-top: 1px solid rgba(0, 176, 255, 0.1);
  flex-shrink: 0;
}

.info-item {
  text-align: center;
}

.info-label {
  display: block;
  font-size: 11px;
  color: #78909C;
  margin-bottom: 2px;
}

.info-value {
  font-size: 13px;
  color: #CFD8DC;
  font-weight: 500;
}

.alarm-list {
  width: 260px;
  background: rgba(0, 176, 255, 0.03);
  border: 1px solid rgba(0, 176, 255, 0.15);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.alarm-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 176, 255, 0.15);
  font-size: 14px;
  font-weight: 600;
  color: #ECEFF1;
  flex-shrink: 0;
}

.alarm-count {
  background: rgba(255, 23, 68, 0.2);
  color: #FF1744;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.alarm-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  min-height: 0;
}

.alarm-scroll::-webkit-scrollbar {
  width: 4px;
}

.alarm-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.alarm-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 176, 255, 0.3);
  border-radius: 2px;
}

.alarm-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  margin-bottom: 6px;
  background: rgba(255, 23, 68, 0.05);
  border-left: 3px solid #FF1744;
}

.alarm-item.warning {
  background: rgba(255, 214, 0, 0.05);
  border-left-color: #FFD600;
}

.alarm-item.danger {
  background: rgba(255, 23, 68, 0.08);
  border-left-color: #FF1744;
}

.alarm-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.alarm-item.danger .alarm-icon {
  color: #FF1744;
}

.alarm-item.warning .alarm-icon {
  color: #FFD600;
}

.alarm-content {
  flex: 1;
  min-width: 0;
}

.alarm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.alarm-type {
  font-size: 13px;
  font-weight: 600;
  color: #ECEFF1;
}

.alarm-time {
  font-size: 11px;
  color: #78909C;
  flex-shrink: 0;
}

.alarm-message {
  font-size: 12px;
  color: #90A4AE;
  line-height: 1.4;
}

.alarm-photo {
  flex-shrink: 0;
  color: #00B0FF;
  margin-top: 4px;
}

.no-alarm {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  color: #546E7A;
  font-size: 13px;
  padding: 40px 0;
}
</style>
