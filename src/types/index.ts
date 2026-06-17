export interface ProjectTask {
  id: string;
  name: string;
  planStart: string;
  planEnd: string;
  actualStart: string;
  actualEnd: string;
  progress: number;
  status: 'normal' | 'warning' | 'danger';
}

export interface TeamPersonnel {
  team: string;
  count: number;
  area: string;
  color: string;
}

export interface AreaData {
  name: string;
  value: number;
  x: number;
  y: number;
}

export interface TimePoint {
  time: string;
  value: number;
}

export interface PersonnelData {
  total: number;
  teams: TeamPersonnel[];
  areas: AreaData[];
  trend: TimePoint[];
}

export interface AlarmRecord {
  id: string;
  time: string;
  type: string;
  level: 'warning' | 'danger';
  message: string;
  hasPhoto?: boolean;
}

export interface TowerCraneData {
  id: string;
  name: string;
  load: number;
  maxLoad: number;
  windSpeed: number;
  maxWindSpeed: number;
  angle: number;
  height: number;
  status: 'normal' | 'warning' | 'danger';
  alarms: AlarmRecord[];
}

export interface EnvTrendPoint {
  time: string;
  pm25: number;
  pm10: number;
  noise: number;
}

export interface EnvData {
  pm25: number;
  pm10: number;
  noise: number;
  temperature: number;
  humidity: number;
  sprinklerOn: boolean;
  trend: EnvTrendPoint[];
}

export type StatusType = 'normal' | 'warning' | 'danger';

export interface WarningDangerThreshold {
  warning: number;
  danger: number;
}

export interface RatioThreshold {
  warningRatio: number;
  dangerRatio: number;
}

export interface ThresholdConfig {
  env: {
    pm25: WarningDangerThreshold;
    pm10: WarningDangerThreshold;
    noise: WarningDangerThreshold;
    sprinkler: {
      pm25: number;
      pm10: number;
    };
  };
  crane: {
    load: RatioThreshold;
    wind: RatioThreshold;
  };
  gantt: {
    lagWarningPercent: number;
    lagDangerPercent: number;
  };
}
