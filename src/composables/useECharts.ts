import { ref, onMounted, onUnmounted, watch, type Ref } from 'vue';
import * as echarts from 'echarts';

export function useECharts(
  chartRef: Ref<HTMLElement | null>,
  option: Ref<echarts.EChartsOption> | (() => echarts.EChartsOption)
) {
  const chartInstance = ref<echarts.ECharts | null>(null);
  let resizeObserver: ResizeObserver | null = null;
  let debounceTimer: number | null = null;

  const debounce = (fn: () => void, delay: number) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = window.setTimeout(fn, delay);
  };

  const initChart = () => {
    if (!chartRef.value) return;

    chartInstance.value = echarts.init(chartRef.value);
    const opt = typeof option === 'function' ? option() : option.value;
    chartInstance.value.setOption(opt);

    resizeObserver = new ResizeObserver(() => {
      debounce(() => {
        chartInstance.value?.resize();
      }, 100);
    });
    resizeObserver.observe(chartRef.value);
  };

  const updateChart = () => {
    if (!chartInstance.value) return;
    const opt = typeof option === 'function' ? option() : option.value;
    chartInstance.value.setOption(opt, true);
  };

  const resizeChart = () => {
    chartInstance.value?.resize();
  };

  onMounted(() => {
    initChart();
    window.addEventListener('resize', resizeChart);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', resizeChart);
    if (resizeObserver && chartRef.value) {
      resizeObserver.unobserve(chartRef.value);
    }
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    chartInstance.value?.dispose();
    chartInstance.value = null;
  });

  if (typeof option !== 'function') {
    watch(option, () => {
      updateChart();
    }, { deep: true });
  }

  return {
    chartInstance,
    updateChart,
    resizeChart
  };
}

export const statusColors = {
  normal: '#00E676',
  warning: '#FFD600',
  danger: '#FF1744'
};

export const chartTheme = {
  backgroundColor: 'transparent',
  textStyle: {
    color: '#B0BEC5',
    fontFamily: 'Noto Sans SC, sans-serif'
  },
  title: {
    textStyle: {
      color: '#ECEFF1'
    }
  },
  legend: {
    textStyle: {
      color: '#B0BEC5'
    }
  },
  tooltip: {
    backgroundColor: 'rgba(10, 22, 40, 0.9)',
    borderColor: '#00B0FF',
    borderWidth: 1,
    textStyle: {
      color: '#ECEFF1'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '15%',
    containLabel: true
  }
};
