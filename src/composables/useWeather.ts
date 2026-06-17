import { ref, computed, onUnmounted } from 'vue';

export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'windy' | 'haze';

export interface WeatherInfo {
  type: WeatherType;
  label: string;
  temperature: number;
  humidityDelta: number;
  pm25Delta: number;
  pm10Delta: number;
  windSpeedDelta: number;
}

const WEATHERS: Record<WeatherType, { label: string; baseTempRange: [number, number] }> = {
  sunny: { label: '晴', baseTempRange: [25, 36] },
  cloudy: { label: '多云', baseTempRange: [22, 30] },
  rainy: { label: '小雨', baseTempRange: [18, 25] },
  windy: { label: '大风', baseTempRange: [15, 25] },
  haze: { label: '雾霾', baseTempRange: [18, 28] },
};

const WEATHER_ORDER: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'windy', 'haze'];

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

const pickWeather = (): WeatherType => {
  const weights = [30, 25, 15, 15, 15];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < WEATHER_ORDER.length; i++) {
    r -= weights[i];
    if (r <= 0) return WEATHER_ORDER[i];
  }
  return 'sunny';
};

const generateWeather = (): WeatherInfo => {
  const type = pickWeather();
  const cfg = WEATHERS[type];
  const temperature = Number(randomRange(cfg.baseTempRange[0], cfg.baseTempRange[1]).toFixed(1));

  const base: WeatherInfo = {
    type,
    label: cfg.label,
    temperature,
    humidityDelta: 0,
    pm25Delta: 0,
    pm10Delta: 0,
    windSpeedDelta: 0,
  };

  switch (type) {
    case 'rainy':
      base.humidityDelta = 20;
      base.pm25Delta = -18;
      base.pm10Delta = -22;
      break;
    case 'windy':
      base.windSpeedDelta = 5;
      base.pm25Delta = -10;
      base.pm10Delta = -12;
      break;
    case 'haze':
      base.humidityDelta = 8;
      base.pm25Delta = 35;
      base.pm10Delta = 45;
      break;
    case 'cloudy':
      base.humidityDelta = 5;
      break;
    case 'sunny':
    default:
      base.humidityDelta = -3;
      break;
  }

  return base;
};

export const calcSuitabilityScore = (weather: WeatherInfo): number => {
  let score = 100;

  if (weather.type === 'rainy') score -= 20;
  if (weather.type === 'windy') score -= 30;
  if (weather.type === 'haze') score -= 15;
  if (weather.temperature > 35) score -= 15;
  if (weather.temperature < 0) score -= 20;

  return Math.max(0, Math.min(100, score));
};

export interface UseWeatherReturn {
  current: import('vue').ComputedRef<WeatherInfo>;
  suitabilityScore: import('vue').ComputedRef<number>;
  isSuitable: import('vue').ComputedRef<boolean>;
  suitabilityLevel: import('vue').ComputedRef<'excellent' | 'good' | 'moderate' | 'poor' | 'dangerous'>;
  forceUpdate: () => void;
  stop: () => void;
}

let weatherInstance: ReturnType<typeof createWeather> | null = null;

function createWeather(updateIntervalMs: number = 10 * 60 * 1000) {
  const current = ref<WeatherInfo>(generateWeather());
  let timer: number | null = null;

  const forceUpdate = () => {
    current.value = generateWeather();
  };

  const start = () => {
    if (timer) return;
    timer = window.setInterval(forceUpdate, updateIntervalMs);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const suitabilityScore = computed(() => calcSuitabilityScore(current.value));
  const isSuitable = computed(() => suitabilityScore.value >= 60);
  const suitabilityLevel = computed(() => {
    const s = suitabilityScore.value;
    if (s >= 90) return 'excellent' as const;
    if (s >= 75) return 'good' as const;
    if (s >= 60) return 'moderate' as const;
    if (s >= 40) return 'poor' as const;
    return 'dangerous' as const;
  });

  start();

  return {
    current,
    suitabilityScore,
    isSuitable,
    suitabilityLevel,
    forceUpdate,
    stop,
  };
}

export function useWeather(): UseWeatherReturn {
  if (!weatherInstance) {
    weatherInstance = createWeather();
  }

  onUnmounted(() => {
    weatherInstance = null;
  });

  return {
    current: computed(() => weatherInstance!.current.value),
    suitabilityScore: computed(() => weatherInstance!.suitabilityScore.value),
    isSuitable: computed(() => weatherInstance!.isSuitable.value),
    suitabilityLevel: computed(() => weatherInstance!.suitabilityLevel.value),
    forceUpdate: () => weatherInstance!.forceUpdate(),
    stop: () => weatherInstance!.stop(),
  };
}

export const _testing = {
  generateWeather,
  calcSuitabilityScore,
  pickWeather,
  createWeather,
};
