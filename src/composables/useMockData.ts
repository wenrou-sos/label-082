import { ref, onUnmounted, watch } from 'vue';
import type {
  ProjectTask,
  PersonnelData,
  TowerCraneData,
  EnvData,
  AlarmRecord,
  StatusType,
  ThresholdConfig
} from '@/types';
import { useThresholdConfig } from './useThresholdConfig';

const generateId = () => Math.random().toString(36).substring(2, 9);

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatTime = (date: Date) => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const parseDate = (dateStr: string): number => {
  if (!dateStr) return 0;
  return new Date(dateStr).getTime();
};

const DAY_MS = 86400000;

const computeTaskStatus = (task: ProjectTask, cfg: ThresholdConfig['gantt']): StatusType => {
  if (task.progress <= 0) return 'normal';
  const now = Date.now();
  const planStart = parseDate(task.planStart);
  const planEnd = parseDate(task.planEnd);
  const planDuration = Math.max(1, planEnd - planStart);
  const actualStart = parseDate(task.actualStart) || planStart;

  let expectedProgress: number;
  if (task.progress >= 100) {
    const actualEnd = parseDate(task.actualEnd) || now;
    const actualDuration = actualEnd - actualStart;
    const lagDays = (actualDuration - planDuration) / DAY_MS;
    const lagPercent = (lagDays / planDuration) * 100 * DAY_MS;
    if (lagPercent > cfg.lagDangerPercent) return 'danger';
    if (lagPercent > cfg.lagWarningPercent) return 'warning';
    return 'normal';
  } else {
    const elapsed = now - planStart;
    expectedProgress = Math.max(0, Math.min(100, (elapsed / planDuration) * 100));
    const lagPercent = expectedProgress - task.progress;
    if (lagPercent > cfg.lagDangerPercent) return 'danger';
    if (lagPercent > cfg.lagWarningPercent) return 'warning';
    return 'normal';
  }
};

const computeCraneStatus = (
  tc: TowerCraneData,
  cfg: ThresholdConfig['crane']
): { status: StatusType; newAlarms: AlarmRecord[] } => {
  const loadRatio = tc.load / tc.maxLoad;
  const windRatio = tc.windSpeed / tc.maxWindSpeed;

  let status: StatusType = 'normal';
  const newAlarms: AlarmRecord[] = [...tc.alarms];
  const nowStr = formatTime(new Date()).slice(0, 8);

  if (windRatio > cfg.wind.dangerRatio || loadRatio > cfg.load.dangerRatio) {
    status = 'danger';
    if (windRatio > cfg.wind.dangerRatio) {
      const last = newAlarms[newAlarms.length - 1];
      if (!last || last.type !== '风速超限' || last.level !== 'danger') {
        newAlarms.push({
          id: generateId(),
          time: nowStr,
          type: '风速超限',
          level: 'danger',
          message: `${tc.name}-风速${tc.windSpeed.toFixed(1)}m/s超过限值${tc.maxWindSpeed}m/s`,
          hasPhoto: true
        });
      }
    }
  } else if (windRatio > cfg.wind.warningRatio || loadRatio > cfg.load.warningRatio) {
    status = 'warning';
    if (loadRatio > cfg.load.warningRatio) {
      const last = newAlarms[newAlarms.length - 1];
      if (!last || last.type !== '吊重预警' || last.level !== 'warning') {
        newAlarms.push({
          id: generateId(),
          time: nowStr,
          type: '吊重预警',
          level: 'warning',
          message: `${tc.name}-吊重接近额定值${Math.round(loadRatio * 100)}%`,
          hasPhoto: false
        });
      }
    }
  }

  while (newAlarms.length > 5) newAlarms.shift();

  return { status, newAlarms };
};

export function useMockData() {
  const { config } = useThresholdConfig();

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30);

  const projectTasks = ref<ProjectTask[]>([
    {
      id: '1',
      name: '地基基础工程',
      planStart: formatDate(new Date(baseDate.getTime() + 0 * DAY_MS)),
      planEnd: formatDate(new Date(baseDate.getTime() + 20 * DAY_MS)),
      actualStart: formatDate(new Date(baseDate.getTime() + 1 * DAY_MS)),
      actualEnd: formatDate(new Date(baseDate.getTime() + 22 * DAY_MS)),
      progress: 100,
      status: 'normal'
    },
    {
      id: '2',
      name: '主体结构工程',
      planStart: formatDate(new Date(baseDate.getTime() + 15 * DAY_MS)),
      planEnd: formatDate(new Date(baseDate.getTime() + 60 * DAY_MS)),
      actualStart: formatDate(new Date(baseDate.getTime() + 18 * DAY_MS)),
      actualEnd: formatDate(new Date(baseDate.getTime() + 65 * DAY_MS)),
      progress: 68,
      status: 'normal'
    },
    {
      id: '3',
      name: '砌体工程',
      planStart: formatDate(new Date(baseDate.getTime() + 45 * DAY_MS)),
      planEnd: formatDate(new Date(baseDate.getTime() + 75 * DAY_MS)),
      actualStart: formatDate(new Date(baseDate.getTime() + 48 * DAY_MS)),
      actualEnd: '',
      progress: 45,
      status: 'normal'
    },
    {
      id: '4',
      name: '装饰装修工程',
      planStart: formatDate(new Date(baseDate.getTime() + 70 * DAY_MS)),
      planEnd: formatDate(new Date(baseDate.getTime() + 100 * DAY_MS)),
      actualStart: '',
      actualEnd: '',
      progress: 0,
      status: 'normal'
    },
    {
      id: '5',
      name: '屋面工程',
      planStart: formatDate(new Date(baseDate.getTime() + 65 * DAY_MS)),
      planEnd: formatDate(new Date(baseDate.getTime() + 80 * DAY_MS)),
      actualStart: formatDate(new Date(baseDate.getTime() + 68 * DAY_MS)),
      actualEnd: '',
      progress: 30,
      status: 'normal'
    },
    {
      id: '6',
      name: '给排水工程',
      planStart: formatDate(new Date(baseDate.getTime() + 50 * DAY_MS)),
      planEnd: formatDate(new Date(baseDate.getTime() + 85 * DAY_MS)),
      actualStart: formatDate(new Date(baseDate.getTime() + 52 * DAY_MS)),
      actualEnd: '',
      progress: 55,
      status: 'normal'
    },
    {
      id: '7',
      name: '电气工程',
      planStart: formatDate(new Date(baseDate.getTime() + 55 * DAY_MS)),
      planEnd: formatDate(new Date(baseDate.getTime() + 90 * DAY_MS)),
      actualStart: formatDate(new Date(baseDate.getTime() + 58 * DAY_MS)),
      actualEnd: '',
      progress: 40,
      status: 'normal'
    },
    {
      id: '8',
      name: '室外工程',
      planStart: formatDate(new Date(baseDate.getTime() + 90 * DAY_MS)),
      planEnd: formatDate(new Date(baseDate.getTime() + 110 * DAY_MS)),
      actualStart: '',
      actualEnd: '',
      progress: 0,
      status: 'normal'
    }
  ]);

  const initialTeams = [
    { team: '钢筋班', count: 45, area: '二标段', color: '#00B0FF' },
    { team: '木工班', count: 38, area: '一标段', color: '#00E676' },
    { team: '瓦工班', count: 52, area: '三标段', color: '#FFD600' },
    { team: '架子班', count: 28, area: '二标段', color: '#FF6D00' },
    { team: '水电班', count: 23, area: '一标段', color: '#AA00FF' }
  ];
  const initialTotal = initialTeams.reduce((s, t) => s + t.count, 0);
  const initialAreaRatios = [0.35, 0.40, 0.17, 0.05, 0.03];

  const personnelData = ref<PersonnelData>({
    total: initialTotal,
    teams: initialTeams,
    areas: [
      { name: '一标段', value: Math.round(initialTotal * initialAreaRatios[0]), x: 150, y: 200 },
      { name: '二标段', value: Math.round(initialTotal * initialAreaRatios[1]), x: 400, y: 150 },
      { name: '三标段', value: Math.round(initialTotal * initialAreaRatios[2]), x: 600, y: 220 },
      { name: '办公区', value: Math.round(initialTotal * initialAreaRatios[3]), x: 100, y: 350 },
      { name: '材料区', value: Math.round(initialTotal * initialAreaRatios[4]), x: 680, y: 350 }
    ],
    trend: []
  });
  {
    const areaSum = personnelData.value.areas.reduce((s, a) => s + a.value, 0);
    const diff = initialTotal - areaSum;
    if (diff !== 0) {
      personnelData.value.areas[0].value += diff;
    }
  }

  const towerCraneData = ref<TowerCraneData[]>([
    {
      id: 'tc1',
      name: '1#塔吊',
      load: 6.8,
      maxLoad: 10,
      windSpeed: 8.5,
      maxWindSpeed: 12,
      angle: 145,
      height: 45,
      status: 'normal',
      alarms: []
    },
    {
      id: 'tc2',
      name: '2#塔吊',
      load: 9.2,
      maxLoad: 10,
      windSpeed: 7.2,
      maxWindSpeed: 12,
      angle: 210,
      height: 52,
      status: 'normal',
      alarms: []
    },
    {
      id: 'tc3',
      name: '3#塔吊',
      load: 4.5,
      maxLoad: 8,
      windSpeed: 13.5,
      maxWindSpeed: 12,
      angle: 75,
      height: 38,
      status: 'normal',
      alarms: []
    }
  ]);

  const envData = ref<EnvData>({
    pm25: 45,
    pm10: 78,
    noise: 62,
    temperature: 28,
    humidity: 65,
    sprinklerOn: false,
    trend: []
  });

  for (let i = 23; i >= 0; i--) {
    const time = new Date();
    time.setHours(time.getHours() - i);
    const h = String(time.getHours()).padStart(2, '0');
    personnelData.value.trend.push({
      time: `${h}:00`,
      value: Math.floor(randomRange(120, 200))
    });
    envData.value.trend.push({
      time: `${h}:00`,
      pm25: Math.floor(randomRange(30, 80)),
      pm10: Math.floor(randomRange(50, 120)),
      noise: Math.floor(randomRange(50, 75))
    });
  }

  const recalcAllStatuses = () => {
    projectTasks.value = projectTasks.value.map((t) => ({
      ...t,
      status: computeTaskStatus(t, config.gantt)
    }));
    towerCraneData.value = towerCraneData.value.map((tc) => {
      const { status, newAlarms } = computeCraneStatus(tc, config.crane);
      return { ...tc, status, alarms: newAlarms };
    });
    const sprinklerOn =
      envData.value.pm25 > config.env.sprinkler.pm25 ||
      envData.value.pm10 > config.env.sprinkler.pm10;
    envData.value = { ...envData.value, sprinklerOn };
  };

  recalcAllStatuses();
  const unwatchConfig = watch(
    () => [
      config.env.pm25,
      config.env.pm10,
      config.env.noise,
      config.env.sprinkler,
      config.crane,
      config.gantt
    ],
    () => {
      recalcAllStatuses();
    },
    { deep: true }
  );

  let intervalId: number | null = null;

  const startSimulation = () => {
    intervalId = window.setInterval(() => {
      personnelData.value.teams = personnelData.value.teams.map((t) => ({
        ...t,
        count: Math.max(20, Math.floor(t.count + randomRange(-3, 3)))
      }));
      personnelData.value.total = personnelData.value.teams.reduce((sum, t) => sum + t.count, 0);

      const rawAreas = personnelData.value.areas.map((a) => ({
        ...a,
        value: Math.max(5, Math.floor(a.value + randomRange(-5, 5)))
      }));
      const rawAreaSum = rawAreas.reduce((s, a) => s + a.value, 0);
      const targetTotal = personnelData.value.total;
      if (rawAreaSum > 0) {
        let accumulated = 0;
        for (let i = 0; i < rawAreas.length; i++) {
          if (i < rawAreas.length - 1) {
            const v = Math.round((rawAreas[i].value / rawAreaSum) * targetTotal);
            rawAreas[i].value = Math.max(1, v);
            accumulated += rawAreas[i].value;
          } else {
            rawAreas[i].value = Math.max(1, targetTotal - accumulated);
          }
        }
      }
      personnelData.value.areas = rawAreas;

      towerCraneData.value = towerCraneData.value.map((tc) => {
        const newLoad = Math.max(0, Math.min(tc.maxLoad, tc.load + randomRange(-1, 1)));
        const newWind = Math.max(0, tc.windSpeed + randomRange(-0.5, 0.5));
        const newAngle = (tc.angle + randomRange(-5, 5) + 360) % 360;
        const newHeight = Math.max(10, Math.min(80, tc.height + randomRange(-1, 1)));

        const updated: TowerCraneData = {
          ...tc,
          load: Number(newLoad.toFixed(1)),
          windSpeed: Number(newWind.toFixed(1)),
          angle: Number(newAngle.toFixed(0)),
          height: Number(newHeight.toFixed(1)),
          status: 'normal'
        };
        const { status, newAlarms } = computeCraneStatus(updated, config.crane);
        updated.status = status;
        updated.alarms = newAlarms;
        return updated;
      });

      const newPm25 = Math.max(20, Math.min(150, envData.value.pm25 + randomRange(-8, 8)));
      const newPm10 = Math.max(30, Math.min(200, envData.value.pm10 + randomRange(-10, 10)));
      const newNoise = Math.max(40, Math.min(90, envData.value.noise + randomRange(-3, 3)));

      const sprinklerOn =
        newPm25 > config.env.sprinkler.pm25 || newPm10 > config.env.sprinkler.pm10;

      envData.value = {
        ...envData.value,
        pm25: Math.floor(newPm25),
        pm10: Math.floor(newPm10),
        noise: Math.floor(newNoise),
        temperature: Number(
          (envData.value.temperature + randomRange(-0.2, 0.2)).toFixed(1)
        ),
        humidity: Math.floor(
          Math.max(30, Math.min(90, envData.value.humidity + randomRange(-1, 1)))
        ),
        sprinklerOn
      };

      const now = new Date();
      const lastTrend = envData.value.trend[envData.value.trend.length - 1];
      const currentHourStr = `${String(now.getHours()).padStart(2, '0')}:00`;
      if (lastTrend && lastTrend.time !== currentHourStr) {
        envData.value.trend.shift();
        envData.value.trend.push({
          time: currentHourStr,
          pm25: Math.floor(newPm25),
          pm10: Math.floor(newPm10),
          noise: Math.floor(newNoise)
        });
      }
    }, 3000);
  };

  const stopSimulation = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  onUnmounted(() => {
    stopSimulation();
    unwatchConfig();
  });

  return {
    projectTasks,
    personnelData,
    towerCraneData,
    envData,
    startSimulation,
    stopSimulation
  };
}

export function useCurrentTime() {
  const currentTime = ref('');
  const currentDate = ref('');
  let timer: number | null = null;

  const updateTime = () => {
    const now = new Date();
    currentTime.value = formatTime(now);
    currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${
      '日一二三四五六'[now.getDay()]
    }`;
  };

  const start = () => {
    updateTime();
    timer = window.setInterval(updateTime, 1000);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  onUnmounted(() => {
    stop();
  });

  return { currentTime, currentDate, start, stop };
}
