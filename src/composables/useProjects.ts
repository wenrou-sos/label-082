import { ref, computed, reactive, watch, onUnmounted } from 'vue';
import type {
  ProjectInfo,
  ProjectDataset,
  ProjectSummary,
  ProjectTask,
  PersonnelData,
  TowerCraneData,
  EnvData,
  StatusType,
  ThresholdConfig,
  EnvTrendPoint,
  TimePoint
} from '@/types';
import { useThresholdConfig } from './useThresholdConfig';

const PROJECT_STORAGE_KEY = 'smart-site-projects';
const CURRENT_PROJECT_KEY = 'smart-site-current-project';

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

const DAY_MS = 86400000;
const baseDate = new Date();
baseDate.setDate(baseDate.getDate() - 30);

const computeTaskStatus = (task: ProjectTask, cfg: ThresholdConfig['gantt']): StatusType => {
  if (task.progress <= 0) return 'normal';
  const now = Date.now();
  const planStart = new Date(task.planStart).getTime();
  const planEnd = new Date(task.planEnd).getTime();
  const planDuration = Math.max(1, planEnd - planStart);
  const actualStart = new Date(task.actualStart || task.planStart).getTime();

  if (task.progress >= 100) {
    const actualEnd = task.actualEnd ? new Date(task.actualEnd).getTime() : now;
    const actualDuration = actualEnd - actualStart;
    const lagPercent = ((actualDuration - planDuration) / planDuration) * 100;
    if (lagPercent > cfg.lagDangerPercent) return 'danger';
    if (lagPercent > cfg.lagWarningPercent) return 'warning';
    return 'normal';
  } else {
    const elapsed = now - planStart;
    const expectedProgress = Math.max(0, Math.min(100, (elapsed / planDuration) * 100));
    const lagPercent = expectedProgress - task.progress;
    if (lagPercent > cfg.lagDangerPercent) return 'danger';
    if (lagPercent > cfg.lagWarningPercent) return 'warning';
    return 'normal';
  }
};

const computeCraneStatus = (
  tc: TowerCraneData,
  cfg: ThresholdConfig['crane']
): { status: StatusType; alarms: typeof tc.alarms } => {
  const loadRatio = tc.load / tc.maxLoad;
  const windRatio = tc.windSpeed / tc.maxWindSpeed;

  let status: StatusType = 'normal';
  const newAlarms = [...tc.alarms];
  const nowStr = formatTime(new Date());

  if (windRatio > cfg.wind.dangerRatio || loadRatio > cfg.load.dangerRatio) {
    status = 'danger';
    if (windRatio > cfg.wind.dangerRatio) {
      const last = newAlarms[newAlarms.length - 1];
      if (!last || last.type !== '风速超限' || last.level !== 'danger' || last.time.slice(0, 5) !== nowStr.slice(0, 5)) {
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
      if (!last || last.type !== '吊重预警' || last.level !== 'warning' || last.time.slice(0, 5) !== nowStr.slice(0, 5)) {
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
  return { status, alarms: newAlarms };
};

const computeProjectStatus = (tasks: ProjectTask[], cranes: TowerCraneData[]): StatusType => {
  let hasWarning = false;
  for (const t of tasks) {
    if (t.status === 'danger') return 'danger';
    if (t.status === 'warning') hasWarning = true;
  }
  for (const c of cranes) {
    if (c.status === 'danger') return 'danger';
    if (c.status === 'warning') hasWarning = true;
  }
  return hasWarning ? 'warning' : 'normal';
};

const generateProjectTasks = (seed: number): ProjectTask[] => {
  const taskNames = [
    '地基基础工程', '主体结构工程', '砌体工程',
    '装饰装修工程', '屋面工程', '给排水工程',
    '电气工程', '室外工程'
  ];
  const offset = seed * 3;
  return taskNames.map((name, i) => {
    const startDays = i * 12 + offset;
    const duration = 18 + i * 4 + (seed % 3) * 5;
    const endDays = startDays + duration;
    const actualStartDays = startDays + (seed + i) % 4;
    const progress = Math.max(0, Math.min(100, Math.floor((60 - startDays + seed * 7 + i * 8))));

    return {
      id: `task-${seed}-${i}`,
      name,
      planStart: formatDate(new Date(baseDate.getTime() + startDays * DAY_MS)),
      planEnd: formatDate(new Date(baseDate.getTime() + endDays * DAY_MS)),
      actualStart: progress > 0 ? formatDate(new Date(baseDate.getTime() + actualStartDays * DAY_MS)) : '',
      actualEnd: progress >= 100 ? formatDate(new Date(baseDate.getTime() + (actualStartDays + duration + (seed % 4)) * DAY_MS)) : '',
      progress,
      status: 'normal' as StatusType
    };
  });
};

const generatePersonnel = (seed: number, scale: number): PersonnelData => {
  const teams = [
    { team: '钢筋班', count: Math.floor(40 + seed * 8), color: '#00B0FF', area: '二标段' },
    { team: '木工班', count: Math.floor(35 + seed * 6), color: '#00E676', area: '一标段' },
    { team: '瓦工班', count: Math.floor(48 + seed * 7), color: '#FFD600', area: '三标段' },
    { team: '架子班', count: Math.floor(24 + seed * 4), color: '#FF6D00', area: '二标段' },
    { team: '水电班', count: Math.floor(20 + seed * 5), color: '#AA00FF', area: '一标段' }
  ];
  const total = teams.reduce((s, t) => s + t.count, 0);
  const ratios = [0.33 + seed * 0.02, 0.38 - seed * 0.01, 0.19 + seed * 0.01, 0.06, 0.04];
  const areas = ratios.map((r, i) => ({
    name: ['一标段', '二标段', '三标段', '办公区', '材料区'][i],
    value: Math.round(total * r),
    x: [150, 400, 600, 100, 680][i],
    y: [200, 150, 220, 350, 350][i]
  }));
  const areaSum = areas.reduce((s, a) => s + a.value, 0);
  areas[0].value += total - areaSum;

  const trend: TimePoint[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date();
    d.setHours(d.getHours() - i);
    trend.push({
      time: `${String(d.getHours()).padStart(2, '0')}:00`,
      value: Math.floor(randomRange(120 + scale * 20, 200 + scale * 30))
    });
  }

  return { total, teams, areas, trend };
};

const generateTowerCranes = (seed: number): TowerCraneData[] => {
  const count = 2 + (seed % 3);
  const result: TowerCraneData[] = [];
  for (let i = 0; i < count; i++) {
    const maxLoad = 8 + (seed + i) % 2 * 2;
    const maxWind = 12;
    const load = Number((maxLoad * (0.3 + (seed + i) * 0.18)).toFixed(1));
    const wind = Number((maxWind * (0.4 + (seed + i + 1) * 0.22)).toFixed(1));
    result.push({
      id: `tc-${seed}-${i}`,
      name: `${i + 1}#塔吊`,
      load,
      maxLoad,
      windSpeed: wind,
      maxWindSpeed: maxWind,
      angle: Math.floor(randomRange(30, 330)),
      height: 35 + i * 8 + seed * 2,
      status: 'normal',
      alarms: []
    });
  }
  return result;
};

const generateEnvData = (seed: number): EnvData => {
  const basePm25 = 35 + seed * 12;
  const basePm10 = 60 + seed * 18;
  const baseNoise = 58 + seed * 4;
  const trend: EnvTrendPoint[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date();
    d.setHours(d.getHours() - i);
    trend.push({
      time: `${String(d.getHours()).padStart(2, '0')}:00`,
      pm25: Math.floor(randomRange(basePm25 - 10, basePm25 + 20)),
      pm10: Math.floor(randomRange(basePm10 - 15, basePm10 + 25)),
      noise: Math.floor(randomRange(baseNoise - 8, baseNoise + 6))
    });
  }
  return {
    pm25: Math.floor(basePm25 + randomRange(-5, 10)),
    pm10: Math.floor(basePm10 + randomRange(-8, 15)),
    noise: Math.floor(baseNoise + randomRange(-3, 4)),
    temperature: Number((25 + seed * 1.5 + randomRange(-1, 1)).toFixed(1)),
    humidity: Math.floor(55 + seed * 5 + randomRange(-3, 3)),
    sprinklerOn: false,
    trend
  };
};

const seedProjects: ProjectInfo[] = [
  {
    id: 'proj-01',
    name: '中央商务区T1塔楼',
    location: '上海市浦东新区',
    totalArea: 125000,
    startDate: formatDate(new Date(baseDate.getTime() + 0 * DAY_MS)),
    endDate: formatDate(new Date(baseDate.getTime() + 540 * DAY_MS)),
    progress: 62,
    status: 'normal'
  },
  {
    id: 'proj-02',
    name: '滨江华府二期',
    location: '杭州市滨江区',
    totalArea: 86000,
    startDate: formatDate(new Date(baseDate.getTime() + 20 * DAY_MS)),
    endDate: formatDate(new Date(baseDate.getTime() + 420 * DAY_MS)),
    progress: 45,
    status: 'normal'
  },
  {
    id: 'proj-03',
    name: '科技创新园A区',
    location: '南京市江宁区',
    totalArea: 168000,
    startDate: formatDate(new Date(baseDate.getTime() - 10 * DAY_MS)),
    endDate: formatDate(new Date(baseDate.getTime() + 600 * DAY_MS)),
    progress: 72,
    status: 'normal'
  },
  {
    id: 'proj-04',
    name: '生态谷住宅项目',
    location: '苏州市吴中区',
    totalArea: 95000,
    startDate: formatDate(new Date(baseDate.getTime() + 40 * DAY_MS)),
    endDate: formatDate(new Date(baseDate.getTime() + 480 * DAY_MS)),
    progress: 28,
    status: 'normal'
  }
];

export function useProjects() {
  const { config } = useThresholdConfig();

  const datasets = reactive<Record<string, ProjectDataset>>({});
  const currentProjectId = ref<string>('');
  const isSimulating = ref(false);

  const initProjectDataset = (info: ProjectInfo): ProjectDataset => {
    const seed = Number(info.id.split('-')[1]) || 1;
    const tasks = generateProjectTasks(seed).map(t => ({ ...t, status: computeTaskStatus(t, config.gantt) }));
    const towerCranes = generateTowerCranes(seed).map(tc => {
      const { status, alarms } = computeCraneStatus(tc, config.crane);
      return { ...tc, status, alarms };
    });
    const personnel = generatePersonnel(seed, info.totalArea / 100000);
    const env = { ...generateEnvData(seed) };
    env.sprinklerOn = env.pm25 > config.env.sprinkler.pm25 || env.pm10 > config.env.sprinkler.pm10;

    const overallStatus = computeProjectStatus(tasks, towerCranes);
    const updatedInfo = { ...info, status: overallStatus };

    return { info: updatedInfo, tasks, personnel, towerCranes, env };
  };

  const loadFromStorage = () => {
    try {
      const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
      if (!raw) return false;
      const stored = JSON.parse(raw) as Record<string, ProjectDataset>;
      seedProjects.forEach(info => {
        if (stored[info.id]) {
          datasets[info.id] = reactive(stored[info.id]);
        }
      });
      const cur = localStorage.getItem(CURRENT_PROJECT_KEY);
      if (cur && datasets[cur]) {
        currentProjectId.value = cur;
      }
      return Object.keys(datasets).length > 0;
    } catch {
      return false;
    }
  };

  const saveToStorage = () => {
    try {
      const plain: Record<string, ProjectDataset> = {};
      Object.keys(datasets).forEach(k => {
        plain[k] = JSON.parse(JSON.stringify(datasets[k]));
      });
      localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(plain));
      localStorage.setItem(CURRENT_PROJECT_KEY, currentProjectId.value);
    } catch {
      /* ignore */
    }
  };

  const initAllProjects = () => {
    if (loadFromStorage()) return;
    seedProjects.forEach(info => {
      datasets[info.id] = reactive(initProjectDataset(info));
    });
    currentProjectId.value = seedProjects[0].id;
    saveToStorage();
  };

  initAllProjects();

  const projectList = computed<ProjectInfo[]>(() => {
    return seedProjects.map(info => datasets[info.id]?.info || info);
  });

  const currentProject = computed<ProjectDataset | null>(() => {
    return datasets[currentProjectId.value] || null;
  });

  const switchProject = (id: string) => {
    if (datasets[id]) {
      currentProjectId.value = id;
      saveToStorage();
    }
  };

  const projectSummaries = computed<ProjectSummary[]>(() => {
    return seedProjects.map(info => {
      const ds = datasets[info.id];
      if (!ds) return {
        info,
        totalPersonnel: 0,
        totalTowerCranes: 0,
        activeDangerAlarms: 0,
        activeWarningAlarms: 0,
        envComplianceRate: 0,
        projectProgress: info.progress,
        overallStatus: info.status
      };

      const dangerAlarms = ds.towerCranes.reduce((s, tc) => s + tc.alarms.filter(a => a.level === 'danger').length, 0);
      const warningAlarms = ds.towerCranes.reduce((s, tc) => s + tc.alarms.filter(a => a.level === 'warning').length, 0);

      const envOk = ds.env.pm25 < config.env.pm25.danger &&
                    ds.env.pm10 < config.env.pm10.danger &&
                    ds.env.noise < config.env.noise.danger;
      const envComplianceRate = envOk ? 92 : 78;

      const progress = ds.tasks.length > 0
        ? Math.floor(ds.tasks.reduce((s, t) => s + t.progress, 0) / ds.tasks.length)
        : 0;

      return {
        info: ds.info,
        totalPersonnel: ds.personnel.total,
        totalTowerCranes: ds.towerCranes.length,
        activeDangerAlarms: dangerAlarms,
        activeWarningAlarms: warningAlarms,
        envComplianceRate,
        projectProgress: progress,
        overallStatus: ds.info.status
      };
    });
  });

  const groupSummary = computed(() => {
    const summaries = projectSummaries.value;
    const totalArea = summaries.reduce((s, p) => s + p.info.totalArea, 0);
    const totalPersonnel = summaries.reduce((s, p) => s + p.totalPersonnel, 0);
    const totalDangerAlarms = summaries.reduce((s, p) => s + p.activeDangerAlarms, 0);
    const totalWarningAlarms = summaries.reduce((s, p) => s + p.activeWarningAlarms, 0);
    const avgCompliance = summaries.length > 0
      ? Math.floor(summaries.reduce((s, p) => s + p.envComplianceRate, 0) / summaries.length)
      : 0;
    const avgProgress = summaries.length > 0
      ? Math.floor(summaries.reduce((s, p) => s + p.projectProgress, 0) / summaries.length)
      : 0;
    const overallStatus: StatusType = summaries.some(s => s.overallStatus === 'danger')
      ? 'danger'
      : summaries.some(s => s.overallStatus === 'warning')
        ? 'warning'
        : 'normal';

    return {
      projectCount: summaries.length,
      totalArea,
      totalPersonnel,
      totalDangerAlarms,
      totalWarningAlarms,
      avgCompliance,
      avgProgress,
      overallStatus
    };
  });

  let intervalId: number | null = null;

  const tickProject = (id: string) => {
    const ds = datasets[id];
    if (!ds) return;

    ds.personnel.teams = ds.personnel.teams.map(t => ({
      ...t,
      count: Math.max(15, Math.floor(t.count + randomRange(-2, 2)))
    }));
    ds.personnel.total = ds.personnel.teams.reduce((s, t) => s + t.count, 0);

    const rawAreas = ds.personnel.areas.map(a => ({
      ...a,
      value: Math.max(3, Math.floor(a.value + randomRange(-4, 4)))
    }));
    const rawSum = rawAreas.reduce((s, a) => s + a.value, 0);
    if (rawSum > 0) {
      let acc = 0;
      for (let i = 0; i < rawAreas.length; i++) {
        if (i < rawAreas.length - 1) {
          const v = Math.round((rawAreas[i].value / rawSum) * ds.personnel.total);
          rawAreas[i].value = Math.max(1, v);
          acc += rawAreas[i].value;
        } else {
          rawAreas[i].value = Math.max(1, ds.personnel.total - acc);
        }
      }
    }
    ds.personnel.areas = rawAreas;

    ds.towerCranes = ds.towerCranes.map(tc => {
      const newLoad = Number(Math.max(0, Math.min(tc.maxLoad, tc.load + randomRange(-0.8, 0.8))).toFixed(1));
      const newWind = Number(Math.max(0, tc.windSpeed + randomRange(-0.4, 0.4)).toFixed(1));
      const newAngle = Math.floor((tc.angle + randomRange(-4, 4) + 360) % 360);
      const newHeight = Number(Math.max(10, Math.min(80, tc.height + randomRange(-0.5, 0.5))).toFixed(1));

      const updated: TowerCraneData = { ...tc, load: newLoad, windSpeed: newWind, angle: newAngle, height: newHeight };
      const { status, alarms } = computeCraneStatus(updated, config.crane);
      updated.status = status;
      updated.alarms = alarms;
      return updated;
    });

    const newPm25 = Math.max(20, Math.min(150, ds.env.pm25 + randomRange(-6, 6)));
    const newPm10 = Math.max(30, Math.min(200, ds.env.pm10 + randomRange(-8, 8)));
    const newNoise = Math.max(40, Math.min(90, ds.env.noise + randomRange(-2, 2)));
    ds.env.pm25 = Math.floor(newPm25);
    ds.env.pm10 = Math.floor(newPm10);
    ds.env.noise = Math.floor(newNoise);
    ds.env.temperature = Number((ds.env.temperature + randomRange(-0.15, 0.15)).toFixed(1));
    ds.env.humidity = Math.floor(Math.max(30, Math.min(90, ds.env.humidity + randomRange(-1, 1))));
    ds.env.sprinklerOn = newPm25 > config.env.sprinkler.pm25 || newPm10 > config.env.sprinkler.pm10;

    const now = new Date();
    const lastTrend = ds.env.trend[ds.env.trend.length - 1];
    const currentHourStr = `${String(now.getHours()).padStart(2, '0')}:00`;
    if (lastTrend && lastTrend.time !== currentHourStr) {
      ds.env.trend.shift();
      ds.env.trend.push({
        time: currentHourStr,
        pm25: ds.env.pm25,
        pm10: ds.env.pm10,
        noise: ds.env.noise
      });
    }

    ds.tasks = ds.tasks.map(t => ({
      ...t,
      status: computeTaskStatus(t, config.gantt)
    }));

    ds.info.status = computeProjectStatus(ds.tasks, ds.towerCranes);
    ds.info.progress = ds.tasks.length > 0
      ? Math.floor(ds.tasks.reduce((s, t) => s + t.progress, 0) / ds.tasks.length)
      : 0;
  };

  const startSimulation = () => {
    if (intervalId) return;
    isSimulating.value = true;
    intervalId = window.setInterval(() => {
      Object.keys(datasets).forEach(id => tickProject(id));
      saveToStorage();
    }, 3000);
  };

  const stopSimulation = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    isSimulating.value = false;
  };

  const recalcAllStatuses = () => {
    Object.keys(datasets).forEach(id => {
      const ds = datasets[id];
      ds.tasks = ds.tasks.map(t => ({ ...t, status: computeTaskStatus(t, config.gantt) }));
      ds.towerCranes = ds.towerCranes.map(tc => {
        const { status, alarms } = computeCraneStatus(tc, config.crane);
        return { ...tc, status, alarms };
      });
      ds.info.status = computeProjectStatus(ds.tasks, ds.towerCranes);
      ds.env.sprinklerOn = ds.env.pm25 > config.env.sprinkler.pm25 || ds.env.pm10 > config.env.sprinkler.pm10;
    });
    saveToStorage();
  };

  const unwatchConfig = watch(
    () => [config.env, config.crane, config.gantt],
    () => recalcAllStatuses(),
    { deep: true }
  );

  onUnmounted(() => {
    stopSimulation();
    unwatchConfig();
  });

  return {
    projectList,
    currentProjectId,
    currentProject,
    projectSummaries,
    groupSummary,
    switchProject,
    startSimulation,
    stopSimulation,
    isSimulating
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
