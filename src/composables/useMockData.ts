import { ref, onUnmounted } from 'vue';
import type { ProjectTask, PersonnelData, TowerCraneData, EnvData, AlarmRecord } from '@/types';

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

export function useMockData() {
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 30);

  const projectTasks = ref<ProjectTask[]>([
    {
      id: '1',
      name: '地基基础工程',
      planStart: formatDate(new Date(baseDate.getTime() + 0 * 86400000)),
      planEnd: formatDate(new Date(baseDate.getTime() + 20 * 86400000)),
      actualStart: formatDate(new Date(baseDate.getTime() + 1 * 86400000)),
      actualEnd: formatDate(new Date(baseDate.getTime() + 22 * 86400000)),
      progress: 100,
      status: 'warning'
    },
    {
      id: '2',
      name: '主体结构工程',
      planStart: formatDate(new Date(baseDate.getTime() + 15 * 86400000)),
      planEnd: formatDate(new Date(baseDate.getTime() + 60 * 86400000)),
      actualStart: formatDate(new Date(baseDate.getTime() + 18 * 86400000)),
      actualEnd: formatDate(new Date(baseDate.getTime() + 65 * 86400000)),
      progress: 68,
      status: 'warning'
    },
    {
      id: '3',
      name: '砌体工程',
      planStart: formatDate(new Date(baseDate.getTime() + 45 * 86400000)),
      planEnd: formatDate(new Date(baseDate.getTime() + 75 * 86400000)),
      actualStart: formatDate(new Date(baseDate.getTime() + 48 * 86400000)),
      actualEnd: '',
      progress: 45,
      status: 'normal'
    },
    {
      id: '4',
      name: '装饰装修工程',
      planStart: formatDate(new Date(baseDate.getTime() + 70 * 86400000)),
      planEnd: formatDate(new Date(baseDate.getTime() + 100 * 86400000)),
      actualStart: '',
      actualEnd: '',
      progress: 0,
      status: 'normal'
    },
    {
      id: '5',
      name: '屋面工程',
      planStart: formatDate(new Date(baseDate.getTime() + 65 * 86400000)),
      planEnd: formatDate(new Date(baseDate.getTime() + 80 * 86400000)),
      actualStart: formatDate(new Date(baseDate.getTime() + 68 * 86400000)),
      actualEnd: '',
      progress: 30,
      status: 'danger'
    },
    {
      id: '6',
      name: '给排水工程',
      planStart: formatDate(new Date(baseDate.getTime() + 50 * 86400000)),
      planEnd: formatDate(new Date(baseDate.getTime() + 85 * 86400000)),
      actualStart: formatDate(new Date(baseDate.getTime() + 52 * 86400000)),
      actualEnd: '',
      progress: 55,
      status: 'normal'
    },
    {
      id: '7',
      name: '电气工程',
      planStart: formatDate(new Date(baseDate.getTime() + 55 * 86400000)),
      planEnd: formatDate(new Date(baseDate.getTime() + 90 * 86400000)),
      actualStart: formatDate(new Date(baseDate.getTime() + 58 * 86400000)),
      actualEnd: '',
      progress: 40,
      status: 'normal'
    },
    {
      id: '8',
      name: '室外工程',
      planStart: formatDate(new Date(baseDate.getTime() + 90 * 86400000)),
      planEnd: formatDate(new Date(baseDate.getTime() + 110 * 86400000)),
      actualStart: '',
      actualEnd: '',
      progress: 0,
      status: 'normal'
    }
  ]);

  const personnelData = ref<PersonnelData>({
    total: 186,
    teams: [
      { team: '钢筋班', count: 45, area: '二标段', color: '#00B0FF' },
      { team: '木工班', count: 38, area: '一标段', color: '#00E676' },
      { team: '瓦工班', count: 52, area: '三标段', color: '#FFD600' },
      { team: '架子班', count: 28, area: '二标段', color: '#FF6D00' },
      { team: '水电班', count: 23, area: '一标段', color: '#AA00FF' }
    ],
    areas: [
      { name: '一标段', value: 68, x: 150, y: 200 },
      { name: '二标段', value: 82, x: 400, y: 150 },
      { name: '三标段', value: 56, x: 600, y: 220 },
      { name: '办公区', value: 12, x: 100, y: 350 },
      { name: '材料区', value: 8, x: 680, y: 350 }
    ],
    trend: []
  });

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
      status: 'warning',
      alarms: [
        {
          id: 'a1',
          time: '10:32:15',
          type: '吊重预警',
          level: 'warning',
          message: '吊重接近额定值92%',
          hasPhoto: true
        }
      ]
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
      status: 'danger',
      alarms: [
        {
          id: 'a2',
          time: '10:45:22',
          type: '风速超限',
          level: 'danger',
          message: '风速13.5m/s超过限值12m/s',
          hasPhoto: true
        },
        {
          id: 'a3',
          time: '10:46:08',
          type: '风速超限',
          level: 'danger',
          message: '风速持续超标，已自动减速',
          hasPhoto: false
        }
      ]
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

  let intervalId: number | null = null;

  const startSimulation = () => {
    intervalId = window.setInterval(() => {
      personnelData.value.teams = personnelData.value.teams.map(t => ({
        ...t,
        count: Math.max(20, Math.floor(t.count + randomRange(-3, 3)))
      }));
      personnelData.value.total = personnelData.value.teams.reduce((sum, t) => sum + t.count, 0);
      personnelData.value.areas = personnelData.value.areas.map(a => ({
        ...a,
        value: Math.max(5, Math.floor(a.value + randomRange(-5, 5)))
      }));

      towerCraneData.value = towerCraneData.value.map(tc => {
        const newLoad = Math.max(0, Math.min(tc.maxLoad, tc.load + randomRange(-1, 1)));
        const newWind = Math.max(0, tc.windSpeed + randomRange(-0.5, 0.5));
        const newAngle = (tc.angle + randomRange(-5, 5) + 360) % 360;
        const newHeight = Math.max(10, Math.min(80, tc.height + randomRange(-1, 1)));

        let status: 'normal' | 'warning' | 'danger' = 'normal';
        const loadRatio = newLoad / tc.maxLoad;
        const windRatio = newWind / tc.maxWindSpeed;

        if (windRatio > 1 || loadRatio > 0.95) {
          status = 'danger';
        } else if (windRatio > 0.85 || loadRatio > 0.8) {
          status = 'warning';
        }

        return {
          ...tc,
          load: Number(newLoad.toFixed(1)),
          windSpeed: Number(newWind.toFixed(1)),
          angle: Number(newAngle.toFixed(0)),
          height: Number(newHeight.toFixed(1)),
          status
        };
      });

      const newPm25 = Math.max(20, Math.min(150, envData.value.pm25 + randomRange(-8, 8)));
      const newPm10 = Math.max(30, Math.min(200, envData.value.pm10 + randomRange(-10, 10)));
      const newNoise = Math.max(40, Math.min(90, envData.value.noise + randomRange(-3, 3)));

      const sprinklerOn = newPm25 > 75 || newPm10 > 100;

      envData.value = {
        ...envData.value,
        pm25: Math.floor(newPm25),
        pm10: Math.floor(newPm10),
        noise: Math.floor(newNoise),
        temperature: Number((envData.value.temperature + randomRange(-0.2, 0.2)).toFixed(1)),
        humidity: Math.floor(Math.max(30, Math.min(90, envData.value.humidity + randomRange(-1, 1)))),
        sprinklerOn
      };

      const now = new Date();
      const lastTrend = envData.value.trend[envData.value.trend.length - 1];
      if (lastTrend && lastTrend.time !== formatTime(now).slice(0, 5) + ':00') {
        envData.value.trend.shift();
        envData.value.trend.push({
          time: formatTime(now).slice(0, 5) + ':00',
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
    currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${'日一二三四五六'[now.getDay()]}`;
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
