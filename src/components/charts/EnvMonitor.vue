<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import type { EnvData } from '@/types';
import { useThresholdConfig } from '@/composables/useThresholdConfig';

interface Props {
  data: EnvData;
}

const props = defineProps<Props>();
const { config } = useThresholdConfig();

const trendChartRef = ref<HTMLElement | null>(null);
let trendChartInstance: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;
let rafId: number | null = null;

const getStatus = (value: number, threshold: { warning: number; danger: number }) => {
  if (value >= threshold.danger) return 'danger';
  if (value >= threshold.warning) return 'warning';
  return 'normal';
};

const pm25Status = computed(() => getStatus(props.data.pm25, config.env.pm25));
const pm10Status = computed(() => getStatus(props.data.pm10, config.env.pm10));
const noiseStatus = computed(() => getStatus(props.data.noise, config.env.noise));

const statusColors = {
  normal: '#00E676',
  warning: '#FFD600',
  danger: '#FF1744'
};

const trendOption = computed(() => {
  const trend = props.data.trend;
  
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: '#00B0FF',
      borderWidth: 1,
      textStyle: {
        color: '#ECEFF1',
        fontSize: 12
      },
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: 'rgba(0, 176, 255, 0.3)'
        }
      }
    },
    legend: {
      data: ['PM2.5', 'PM10', '噪声'],
      textStyle: {
        color: '#90A4AE',
        fontSize: 11
      },
      top: 5,
      right: 10,
      itemWidth: 14,
      itemHeight: 2
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '18%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trend.map(t => t.time),
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 176, 255, 0.2)'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#78909C',
        fontSize: 10
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'μg/m³',
        nameTextStyle: {
          color: '#78909C',
          fontSize: 10
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#78909C',
          fontSize: 10
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(0, 176, 255, 0.06)'
          }
        }
      },
      {
        type: 'value',
        name: 'dB',
        nameTextStyle: {
          color: '#78909C',
          fontSize: 10
        },
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#78909C',
          fontSize: 10
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: 'PM2.5',
        type: 'line',
        smooth: true,
        data: trend.map(t => t.pm25),
        lineStyle: {
          width: 2,
          color: '#00B0FF'
        },
        itemStyle: {
          color: '#00B0FF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 176, 255, 0.3)' },
            { offset: 1, color: 'rgba(0, 176, 255, 0)' }
          ])
        },
        symbol: 'circle',
        symbolSize: 4
      },
      {
        name: 'PM10',
        type: 'line',
        smooth: true,
        data: trend.map(t => t.pm10),
        lineStyle: {
          width: 2,
          color: '#FF9800'
        },
        itemStyle: {
          color: '#FF9800'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 152, 0, 0.3)' },
            { offset: 1, color: 'rgba(255, 152, 0, 0)' }
          ])
        },
        symbol: 'circle',
        symbolSize: 4
      },
      {
        name: '噪声',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: trend.map(t => t.noise),
        lineStyle: {
          width: 2,
          color: '#9C27B0'
        },
        itemStyle: {
          color: '#9C27B0'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(156, 39, 176, 0.3)' },
            { offset: 1, color: 'rgba(156, 39, 176, 0)' }
          ])
        },
        symbol: 'circle',
        symbolSize: 4
      }
    ]
  };
});

const initChart = () => {
  if (!trendChartRef.value) return;
  if (trendChartRef.value.clientWidth === 0 || trendChartRef.value.clientHeight === 0) {
    setTimeout(initChart, 50);
    return;
  }
  trendChartInstance = echarts.init(trendChartRef.value);
  trendChartInstance.setOption(trendOption.value);
};

watch(() => props.data.trend, () => {
  if (trendChartInstance) {
    trendChartInstance.setOption(trendOption.value, true);
  }
}, { deep: true });

const handleResize = () => {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    if (trendChartInstance && trendChartRef.value && trendChartRef.value.clientWidth > 0 && trendChartRef.value.clientHeight > 0) {
      trendChartInstance.resize();
    }
  });
};

onMounted(() => {
  setTimeout(() => {
    initChart();
  }, 50);
  window.addEventListener('resize', handleResize);
  if (trendChartRef.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(trendChartRef.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (resizeObserver && trendChartRef.value) {
    resizeObserver.unobserve(trendChartRef.value);
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  trendChartInstance?.dispose();
  trendChartInstance = null;
});
</script>

<template>
  <div class="env-monitor">
    <div class="env-data-cards">
      <div class="env-card" :class="pm25Status">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6m4.22-13.22l4.24 4.24M1.54 1.54l4.24 4.24M20.46 20.46l-4.24-4.24M1.54 20.46l4.24-4.24M1 12h6m6 0h6"></path>
          </svg>
        </div>
        <div class="card-info">
          <span class="card-label">PM2.5</span>
          <span class="card-value" :style="{ color: statusColors[pm25Status] }">
            {{ data.pm25 }}
            <span class="card-unit">μg/m³</span>
          </span>
        </div>
        <div class="status-indicator" :class="pm25Status"></div>
      </div>
      
      <div class="env-card" :class="pm10Status">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
            <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
            <line x1="6" y1="1" x2="6" y2="4"></line>
            <line x1="10" y1="1" x2="10" y2="4"></line>
            <line x1="14" y1="1" x2="14" y2="4"></line>
          </svg>
        </div>
        <div class="card-info">
          <span class="card-label">PM10</span>
          <span class="card-value" :style="{ color: statusColors[pm10Status] }">
            {{ data.pm10 }}
            <span class="card-unit">μg/m³</span>
          </span>
        </div>
        <div class="status-indicator" :class="pm10Status"></div>
      </div>
      
      <div class="env-card" :class="noiseStatus">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
        </div>
        <div class="card-info">
          <span class="card-label">噪声</span>
          <span class="card-value" :style="{ color: statusColors[noiseStatus] }">
            {{ data.noise }}
            <span class="card-unit">dB</span>
          </span>
        </div>
        <div class="status-indicator" :class="noiseStatus"></div>
      </div>
      
      <div class="env-card">
        <div class="card-icon temp">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"></path>
          </svg>
        </div>
        <div class="card-info">
          <span class="card-label">温度</span>
          <span class="card-value" style="color: #FF9800">
            {{ data.temperature }}
            <span class="card-unit">℃</span>
          </span>
        </div>
      </div>
      
      <div class="env-card">
        <div class="card-icon humidity">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
          </svg>
        </div>
        <div class="card-info">
          <span class="card-label">湿度</span>
          <span class="card-value" style="color: #03A9F4">
            {{ data.humidity }}
            <span class="card-unit">%</span>
          </span>
        </div>
      </div>
      
      <div class="env-card sprinkler" :class="{ active: data.sprinklerOn }">
        <div class="card-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M7 16.3a2 2 0 0 1-.76-2.77l3.82-6.62a2 2 0 0 1 2.76-.66h0a2 2 0 0 1 .66 2.77l-1.64 2.83"></path>
            <path d="M10.5 7.5 12 3"></path>
            <path d="M13.5 10h3.41"></path>
            <path d="M16.5 14.5 19 10"></path>
            <path d="M13 19.5h-2"></path>
            <path d="M5 15h2"></path>
            <path d="M3.5 21h10"></path>
            <path d="M15 21h2"></path>
          </svg>
        </div>
        <div class="card-info">
          <span class="card-label">喷淋系统</span>
          <span class="card-value" :style="{ color: data.sprinklerOn ? '#00E676' : '#78909C' }">
            {{ data.sprinklerOn ? '运行中' : '待机' }}
          </span>
        </div>
        <div v-if="data.sprinklerOn" class="sprinkler-animation">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
    
    <div class="env-trend">
      <div class="trend-title">24小时趋势</div>
      <div ref="trendChartRef" class="trend-chart"></div>
    </div>
  </div>
</template>

<style scoped>
.env-monitor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  gap: 16px;
}

.env-data-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.env-card {
  position: relative;
  background: rgba(0, 176, 255, 0.03);
  border: 1px solid rgba(0, 176, 255, 0.15);
  border-radius: 8px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.env-card.warning {
  border-color: rgba(255, 214, 0, 0.3);
  background: rgba(255, 214, 0, 0.03);
}

.env-card.danger {
  border-color: rgba(255, 23, 68, 0.4);
  background: rgba(255, 23, 68, 0.05);
  animation: dangerGlow 2s infinite;
}

@keyframes dangerGlow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 23, 68, 0.2);
  }
  50% {
    box-shadow: 0 0 15px 3px rgba(255, 23, 68, 0.3);
  }
}

.card-icon {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 176, 255, 0.1);
  color: #00B0FF;
}

.card-icon.temp {
  background: rgba(255, 152, 0, 0.1);
  color: #FF9800;
}

.card-icon.humidity {
  background: rgba(3, 169, 244, 0.1);
  color: #03A9F4;
}

.card-icon svg {
  width: 22px;
  height: 22px;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-label {
  display: block;
  font-size: 12px;
  color: #90A4AE;
  margin-bottom: 4px;
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  font-family: 'Orbitron', 'Noto Sans SC', monospace;
  text-shadow: 0 0 10px currentColor;
}

.card-unit {
  font-size: 12px;
  font-weight: 400;
  color: #78909C;
  margin-left: 3px;
  text-shadow: none;
}

.status-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 100%;
  opacity: 0.6;
}

.status-indicator.normal {
  background: #00E676;
}

.status-indicator.warning {
  background: #FFD600;
}

.status-indicator.danger {
  background: #FF1744;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.sprinkler.active .card-icon {
  background: rgba(0, 230, 118, 0.15);
  color: #00E676;
  animation: spray 1.5s ease-in-out infinite;
}

@keyframes spray {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.sprinkler-animation {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
}

.sprinkler-animation span {
  width: 3px;
  height: 8px;
  background: #00E676;
  border-radius: 2px;
  animation: drop 1s ease-in-out infinite;
  opacity: 0.6;
}

.sprinkler-animation span:nth-child(2) {
  animation-delay: 0.2s;
}

.sprinkler-animation span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes drop {
  0% {
    transform: translateY(0) scaleY(1);
    opacity: 0.6;
  }
  100% {
    transform: translateY(8px) scaleY(0.5);
    opacity: 0;
  }
}

.env-trend {
  flex: 1;
  background: rgba(0, 176, 255, 0.03);
  border: 1px solid rgba(0, 176, 255, 0.15);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.trend-title {
  position: absolute;
  top: 12px;
  left: 16px;
  font-size: 13px;
  color: #90A4AE;
  font-weight: 500;
  z-index: 10;
}

.trend-chart {
  width: 100%;
  height: 100%;
}
</style>
