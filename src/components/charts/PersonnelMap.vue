<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import type { PersonnelData } from '@/types';

interface Props {
  data: PersonnelData;
}

const props = defineProps<Props>();

const mapChartRef = ref<HTMLElement | null>(null);
const barChartRef = ref<HTMLElement | null>(null);
let mapChartInstance: echarts.ECharts | null = null;
let barChartInstance: echarts.ECharts | null = null;

const teamColors: Record<string, string> = {
  '钢筋班': '#00B0FF',
  '木工班': '#00E676',
  '瓦工班': '#FFD600',
  '架子班': '#FF6D00',
  '水电班': '#AA00FF'
};

const mapOption = computed(() => {
  const areas = props.data.areas;
  
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(10, 22, 40, 0.95)',
      borderColor: '#00B0FF',
      borderWidth: 1,
      textStyle: {
        color: '#ECEFF1',
        fontSize: 12
      },
      formatter: (params: any) => {
        return `<div style="font-weight:600;color:#00B0FF;margin-bottom:4px">${params.name}</div>
                <div>人员数量: <span style="color:#00E676;font-weight:600">${params.value} 人</span></div>`;
      }
    },
    xAxis: {
      show: false,
      min: 0,
      max: 800
    },
    yAxis: {
      show: false,
      min: 0,
      max: 450,
      inverse: true
    },
    grid: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    },
    series: [
      {
        type: 'scatter',
        symbolSize: (val: number[]) => {
          const area = areas.find(a => a.x === val[0] && a.y === val[1]);
          return Math.max(30, (area?.value || 0) * 0.8);
        },
        data: areas.map(a => ({
          name: a.name,
          value: [a.x, a.y, a.value],
          itemStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.5, [
              { offset: 0, color: 'rgba(0, 230, 118, 0.8)' },
              { offset: 1, color: 'rgba(0, 230, 118, 0.1)' }
            ]),
            shadowBlur: 20,
            shadowColor: 'rgba(0, 230, 118, 0.5)'
          }
        })),
        label: {
          show: true,
          formatter: (params: any) => {
            return `${params.name}\n${params.data.value[2]}人`;
          },
          color: '#ECEFF1',
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 18
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 30,
            shadowColor: 'rgba(0, 230, 118, 0.8)'
          }
        }
      },
      {
        type: 'effectScatter',
        symbolSize: 8,
        data: areas.flatMap(area => {
          const points = [];
          for (let i = 0; i < Math.floor(area.value / 5); i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 20 + 10;
            points.push({
              value: [
                area.x + Math.cos(angle) * radius,
                area.y + Math.sin(angle) * radius,
                1
              ],
              itemStyle: {
                color: '#00E676'
              }
            });
          }
          return points;
        }),
        rippleEffect: {
          brushType: 'stroke',
          scale: 3
        }
      }
    ]
  };
});

const barOption = computed(() => {
  const teams = props.data.teams;
  
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
        type: 'shadow'
      },
      formatter: (params: any) => {
        const item = params[0];
        const team = teams[item.dataIndex];
        return `<div style="font-weight:600;color:${team.color};margin-bottom:4px">${team.team}</div>
                <div>出勤人数: <span style="color:#00E676;font-weight:600">${team.count} 人</span></div>
                <div>所在区域: ${team.area}</div>`;
      }
    },
    grid: {
      left: '3%',
      right: '10%',
      top: '5%',
      bottom: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#78909C',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 176, 255, 0.08)'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: teams.map(t => t.team),
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#CFD8DC',
        fontSize: 12
      }
    },
    series: [
      {
        type: 'bar',
        data: teams.map(t => ({
          value: t.count,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: t.color + '40' },
              { offset: 1, color: t.color }
            ]),
            borderRadius: [0, 4, 4, 0],
            shadowBlur: 10,
            shadowColor: t.color + '40'
          }
        })),
        barWidth: 14,
        label: {
          show: true,
          position: 'right',
          color: '#ECEFF1',
          fontSize: 12,
          fontWeight: 600,
          formatter: '{c} 人'
        }
      }
    ]
  };
});

let resizeHandler: (() => void) | null = null;

const initCharts = () => {
  if (!mapChartRef.value || !barChartRef.value) return;
  if (mapChartRef.value.clientWidth === 0 || barChartRef.value.clientWidth === 0) {
    setTimeout(initCharts, 50);
    return;
  }
  
  mapChartInstance = echarts.init(mapChartRef.value);
  mapChartInstance.setOption(mapOption.value);
  
  barChartInstance = echarts.init(barChartRef.value);
  barChartInstance.setOption(barOption.value);

  resizeHandler = () => {
    mapChartInstance?.resize();
    barChartInstance?.resize();
  };
  window.addEventListener('resize', resizeHandler);
};

watch(() => props.data, () => {
  if (mapChartInstance) {
    mapChartInstance.setOption(mapOption.value, true);
  }
  if (barChartInstance) {
    barChartInstance.setOption(barOption.value, true);
  }
}, { deep: true });

onMounted(() => {
  setTimeout(() => {
    initCharts();
  }, 50);
});

onUnmounted(() => {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
  }
  mapChartInstance?.dispose();
  barChartInstance?.dispose();
  mapChartInstance = null;
  barChartInstance = null;
});
</script>

<template>
  <div class="personnel-map">
    <div class="map-section">
      <div class="section-title">人员分布</div>
      <div ref="mapChartRef" class="map-chart"></div>
      <div class="total-badge">
        <span class="total-label">今日总出勤</span>
        <span class="total-value">{{ data.total }}</span>
        <span class="total-unit">人</span>
      </div>
    </div>
    <div class="bar-section">
      <div class="section-title">班组统计</div>
      <div ref="barChartRef" class="bar-chart"></div>
    </div>
  </div>
</template>

<style scoped>
.personnel-map {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
}

.map-section {
  flex: 1;
  position: relative;
  background: rgba(0, 176, 255, 0.03);
  border: 1px solid rgba(0, 176, 255, 0.15);
  border-radius: 8px;
  overflow: hidden;
}

.section-title {
  position: absolute;
  top: 12px;
  left: 16px;
  font-size: 13px;
  color: #90A4AE;
  font-weight: 500;
  z-index: 10;
}

.map-chart {
  width: 100%;
  height: 100%;
}

.total-badge {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: linear-gradient(135deg, rgba(0, 230, 118, 0.15) 0%, rgba(0, 176, 255, 0.15) 100%);
  border: 1px solid rgba(0, 230, 118, 0.3);
  border-radius: 8px;
  padding: 12px 20px;
  text-align: center;
}

.total-label {
  display: block;
  font-size: 12px;
  color: #90A4AE;
  margin-bottom: 4px;
}

.total-value {
  font-size: 32px;
  font-weight: 700;
  color: #00E676;
  font-family: 'Orbitron', 'Noto Sans SC', monospace;
  text-shadow: 0 0 15px rgba(0, 230, 118, 0.5);
}

.total-unit {
  font-size: 14px;
  color: #78909C;
  margin-left: 4px;
}

.bar-section {
  width: 38%;
  background: rgba(0, 176, 255, 0.03);
  border: 1px solid rgba(0, 176, 255, 0.15);
  border-radius: 8px;
  position: relative;
}

.bar-chart {
  width: 100%;
  height: 100%;
}
</style>
