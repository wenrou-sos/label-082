import { reactive, watch } from 'vue';
import type { ThresholdConfig } from '@/types';

const STORAGE_KEY = 'smart-site-threshold-config';

const defaultConfig: ThresholdConfig = {
  env: {
    pm25: { warning: 50, danger: 75 },
    pm10: { warning: 80, danger: 100 },
    noise: { warning: 65, danger: 75 },
    sprinkler: { pm25: 75, pm10: 100 }
  },
  crane: {
    load: { warningRatio: 0.8, dangerRatio: 0.95 },
    wind: { warningRatio: 0.85, dangerRatio: 1.0 }
  },
  gantt: {
    lagWarningPercent: 10,
    lagDangerPercent: 10
  }
};

const loadConfig = (): ThresholdConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(defaultConfig));
    const parsed = JSON.parse(raw);
    return {
      env: {
        pm25: { ...defaultConfig.env.pm25, ...(parsed.env?.pm25 || {}) },
        pm10: { ...defaultConfig.env.pm10, ...(parsed.env?.pm10 || {}) },
        noise: { ...defaultConfig.env.noise, ...(parsed.env?.noise || {}) },
        sprinkler: { ...defaultConfig.env.sprinkler, ...(parsed.env?.sprinkler || {}) }
      },
      crane: {
        load: { ...defaultConfig.crane.load, ...(parsed.crane?.load || {}) },
        wind: { ...defaultConfig.crane.wind, ...(parsed.crane?.wind || {}) }
      },
      gantt: {
        ...defaultConfig.gantt,
        ...(parsed.gantt || {})
      }
    };
  } catch {
    return JSON.parse(JSON.stringify(defaultConfig));
  }
};

let globalConfig: ThresholdConfig | null = null;
let initialized = false;

export function useThresholdConfig() {
  if (!initialized) {
    globalConfig = reactive(loadConfig());
    initialized = true;

    watch(
      globalConfig,
      (val) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
        } catch {
          /* ignore storage errors */
        }
      },
      { deep: true }
    );
  }

  const config = globalConfig as ThresholdConfig;

  const resetConfig = () => {
    Object.assign(config, JSON.parse(JSON.stringify(defaultConfig)));
  };

  const getDefaultConfig = (): ThresholdConfig => JSON.parse(JSON.stringify(defaultConfig));

  return {
    config,
    resetConfig,
    defaultConfig: getDefaultConfig()
  };
}
