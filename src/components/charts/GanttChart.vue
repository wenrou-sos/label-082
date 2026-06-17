<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import * as echarts from 'echarts';
import type { ProjectTask } from '@/types';

interface Props {
  tasks: ProjectTask[];
}

const props = defineProps<Props>();

const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;
let resizeObserver: ResizeObserver | null = null;
let rafId: number | null = null;

const statusColors = {
  normal: '#00E676',
  warning: '#FFD600',
  danger: '#FF1744'
};

const parseDate = (dateStr: string): number => {
  if (!dateStr) return 0;
  return new Date(dateStr).getTime();
};

const chartOption = computed(() => {
  const tasks = props.tasks;
  const allDates = tasks.flatMap(t => [t.planStart, t.planEnd, t.actualStart, t.actualEnd].filter(Boolean));
  const timestamps = allDates.map(d => parseDate(d));
  
  let minTime = Math.min(...timestamps);
  let maxTime = Math.max(...timestamps, Date.now());
  const padding = (maxTime - minTime) * 0.05;
  minTime -= padding;
  maxTime += padding;

  const yAxisData = tasks.map(t => t.name);

  const planData = tasks.map((t, index) => {
    const start = parseDate(t.planStart);
    const end = parseDate(t.planEnd);
    return {
      value: [start, end, index],
      itemStyle: {
        color: 'rgba(0, 176, 255, 0.25)',
        borderColor: '#00B0FF',
        borderWidth: 1,
        borderRadius: 2
      }
    };
  });

  const actualData = tasks.map((t, index) => {
    const start = parseDate(t.actualStart);
    if (!start || t.progress === 0) {
      return {
        value: [0, 0, index],
        itemStyle: { color: 'transparent' }
      };
    }

    let actualEnd: number;
    const hasActualEnd = t.actualEnd && parseDate(t.actualEnd) > 0;
    const isCompleted = t.progress >= 100;

    if (isCompleted && hasActualEnd) {
      actualEnd = parseDate(t.actualEnd);
    } else {
      const planDuration = parseDate(t.planEnd) - parseDate(t.planStart);
      actualEnd = start + planDuration * (t.progress / 100);
    }

    return {
      value: [start, actualEnd, index],
      itemStyle: {
        color: statusColors[t.status],
        borderRadius: 2,
        shadowBlur: 8,
        shadowColor: statusColors[t.status]
      }
    };
  });

  const today = Date.now();

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
        const dataIndex = params[0]?.dataIndex;
        if (dataIndex === undefined) return '';
        const task = tasks[dataIndex];
        return `
          <div style="font-weight:600;margin-bottom:8px;color:#00B0FF;font-size:13px">${task.name}</div>
          <div style="margin-bottom:4px;color:#B0BEC5">计划: <span style="color:#ECEFF1">${task.planStart} ~ ${task.planEnd}</span></div>
          <div style="margin-bottom:4px;color:#B0BEC5">实际: <span style="color:#ECEFF1">${task.actualStart || '未开始'} ~ ${task.actualEnd || '进行中'}</span></div>
          <div style="color:#B0BEC5">进度: <span style="color:${statusColors[task.status]};font-weight:600">${task.progress}%</span></div>
        `;
      }
    },
    legend: {
      data: ['计划工期', '实际进度'],
      textStyle: {
        color: '#B0BEC5',
        fontSize: 12
      },
      top: 8,
      right: 20,
      itemWidth: 18,
      itemHeight: 8,
      itemGap: 20
    },
    grid: {
      left: '12%',
      right: '5%',
      top: '18%',
      bottom: '12%'
    },
    xAxis: {
      type: 'time',
      min: minTime,
      max: maxTime,
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 176, 255, 0.25)'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#78909C',
        fontSize: 11,
        formatter: (value: number) => {
          const date = new Date(value);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 176, 255, 0.06)',
          type: 'dashed'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: yAxisData,
      inverse: true,
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#CFD8DC',
        fontSize: 12,
        margin: 12
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgba(0, 176, 255, 0.04)',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: '计划工期',
        type: 'custom',
        renderItem: (params: any, api: any) => {
          const categoryIndex = api.value(2);
          const start = api.coord([api.value(0), categoryIndex]);
          const end = api.coord([api.value(1), categoryIndex]);
          const barHeight = api.size([0, 1])[1] * 0.3;
          
          const rectShape = echarts.graphic.clipRectByRect(
            {
              x: start[0],
              y: start[1] - barHeight / 2 - barHeight * 0.55,
              width: Math.max(end[0] - start[0], 1),
              height: barHeight
            },
            {
              x: params.coordSys.x,
              y: params.coordSys.y,
              width: params.coordSys.width,
              height: params.coordSys.height
            }
          );
          
          return rectShape ? {
            type: 'rect',
            shape: rectShape,
            style: {
              fill: 'rgba(0, 176, 255, 0.2)',
              stroke: '#00B0FF',
              lineWidth: 1,
              lineDash: [3, 3]
            }
          } : null;
        },
        data: planData,
        z: 1
      },
      {
        name: '实际进度',
        type: 'custom',
        renderItem: (params: any, api: any) => {
          const categoryIndex = api.value(2);
          const start = api.coord([api.value(0), categoryIndex]);
          const end = api.coord([api.value(1), categoryIndex]);
          const barHeight = api.size([0, 1])[1] * 0.3;
          
          const dataIndex = params.dataIndex;
          const task = tasks[dataIndex];
          const color = task ? statusColors[task.status] : '#00E676';
          
          const rectShape = echarts.graphic.clipRectByRect(
            {
              x: start[0],
              y: start[1] - barHeight / 2 + barHeight * 0.55,
              width: Math.max(end[0] - start[0], 2),
              height: barHeight
            },
            {
              x: params.coordSys.x,
              y: params.coordSys.y,
              width: params.coordSys.width,
              height: params.coordSys.height
            }
          );
          
          return rectShape ? {
            type: 'rect',
            shape: rectShape,
            style: {
              fill: color,
              shadowBlur: 6,
              shadowColor: color
            }
          } : null;
        },
        data: actualData,
        z: 2
      },
      {
        name: '今日',
        type: 'line',
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            color: '#FF5252',
            width: 1.5,
            type: 'dashed'
          },
          label: {
            show: true,
            formatter: '今日',
            color: '#FF5252',
            fontSize: 11,
            position: 'insideEndTop',
            padding: [2, 6]
          },
          data: [
            { xAxis: today }
          ]
        },
        data: []
      }
    ]
  };
});

const initChart = () => {
  if (!chartRef.value) return;
  chartInstance = echarts.init(chartRef.value);
  chartInstance.setOption(chartOption.value);
};

const handleResize = () => {
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    if (chartInstance && chartRef.value && chartRef.value.clientWidth > 0 && chartRef.value.clientHeight > 0) {
      chartInstance.resize();
    }
  });
};

watch(() => props.tasks, () => {
  if (chartInstance) {
    chartInstance.setOption(chartOption.value, true);
  }
}, { deep: true });

onMounted(() => {
  initChart();
  window.addEventListener('resize', handleResize);
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartRef.value);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (resizeObserver && chartRef.value) {
    resizeObserver.unobserve(chartRef.value);
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  chartInstance?.dispose();
  chartInstance = null;
});
</script>

<template>
  <div class="gantt-chart">
    <div ref="chartRef" class="chart-container"></div>
    <div class="legend-status">
      <div class="legend-item">
        <span class="dot normal"></span>
        <span>正常</span>
      </div>
      <div class="legend-item">
        <span class="dot warning"></span>
        <span>滞后&lt;10%</span>
      </div>
      <div class="legend-item">
        <span class="dot danger"></span>
        <span>滞后&gt;10%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.gantt-chart {
  position: relative;
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: calc(100% - 30px);
}

.legend-status {
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 24px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #78909C;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.normal {
  background: #00E676;
  box-shadow: 0 0 6px #00E676;
}

.dot.warning {
  background: #FFD600;
  box-shadow: 0 0 6px #FFD600;
}

.dot.danger {
  background: #FF1744;
  box-shadow: 0 0 6px #FF1744;
}
</style>
