<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useMockData, useCurrentTime } from '@/composables/useMockData';
import PanelTitle from '@/components/common/PanelTitle.vue';
import GanttChart from '@/components/charts/GanttChart.vue';
import PersonnelMap from '@/components/charts/PersonnelMap.vue';
import TowerCranePanel from '@/components/charts/TowerCranePanel.vue';
import EnvMonitor from '@/components/charts/EnvMonitor.vue';

const { projectTasks, personnelData, towerCraneData, envData, startSimulation } = useMockData();
const { currentTime, currentDate, start: startTime } = useCurrentTime();

const alarmCount = computed(() => {
  return towerCraneData.value.reduce((sum, tc) => sum + tc.alarms.length, 0);
});

const dangerCount = computed(() => {
  return towerCraneData.value.filter(tc => tc.status === 'danger').length;
});

const warningCount = computed(() => {
  return towerCraneData.value.filter(tc => tc.status === 'warning').length;
});

onMounted(() => {
  startTime();
  startSimulation();
});
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-bg">
      <div class="bg-grid"></div>
      <div class="bg-glow glow-1"></div>
      <div class="bg-glow glow-2"></div>
    </div>
    
    <header class="dashboard-header">
      <div class="header-left">
        <div class="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21h18"></path>
            <path d="M5 21V7l8-4v18"></path>
            <path d="M19 21V11l-6-4"></path>
            <path d="M9 9h1"></path>
            <path d="M9 13h1"></path>
            <path d="M9 17h1"></path>
            <path d="M14 13h1"></path>
            <path d="M14 17h1"></path>
          </svg>
        </div>
        <div class="project-info">
          <h1 class="project-name">智慧工地可视化管控平台</h1>
          <p class="project-sub">XX项目 · 施工现场实时监控</p>
        </div>
      </div>
      
      <div class="header-center">
        <div class="time-display">
          <span class="time-value">{{ currentTime }}</span>
          <span class="date-value">{{ currentDate }}</span>
        </div>
      </div>
      
      <div class="header-right">
        <div class="weather-widget">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
          <span class="weather-text">晴 28°C</span>
        </div>
        
        <div class="alarm-widget" :class="{ 'has-alarm': alarmCount > 0 }">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 17v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-1"></path>
            <path d="M20 17V9a8 8 0 0 0-16 0v8"></path>
            <path d="M12 2v2"></path>
          </svg>
          <span class="alarm-count-badge" v-if="alarmCount > 0">{{ alarmCount }}</span>
        </div>
        
        <div class="status-summary">
          <div class="status-item danger">
            <span class="dot"></span>
            <span>{{ dangerCount }} 台异常</span>
          </div>
          <div class="status-item warning">
            <span class="dot"></span>
            <span>{{ warningCount }} 台预警</span>
          </div>
        </div>
      </div>
    </header>
    
    <main class="dashboard-main">
      <div class="main-grid">
        <div class="panel panel-gantt">
          <PanelTitle title="项目进度甘特图" icon="chart" extra="实时更新" />
          <div class="panel-content">
            <GanttChart :tasks="projectTasks" />
          </div>
        </div>
        
        <div class="panel panel-personnel">
          <PanelTitle title="施工人员定位" icon="users" extra="今日出勤" />
          <div class="panel-content">
            <PersonnelMap :data="personnelData" />
          </div>
        </div>
        
        <div class="panel panel-crane">
          <PanelTitle title="重大危险源监控" icon="alert-triangle" extra="塔吊监测" />
          <div class="panel-content">
            <TowerCranePanel :data="towerCraneData" />
          </div>
        </div>
        
        <div class="panel panel-env">
          <PanelTitle title="环境监测" icon="cloud" extra="实时数据" />
          <div class="panel-content">
            <EnvMonitor :data="envData" />
          </div>
        </div>
      </div>
    </main>
    
    <footer class="dashboard-footer">
      <div class="footer-left">
        <span>系统运行正常</span>
        <span class="status-dot"></span>
      </div>
      <div class="footer-right">
        <span>© 2024 智慧工地管控系统 v2.0</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.dashboard {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0A1628;
  color: #ECEFF1;
  display: flex;
  flex-direction: column;
}

.dashboard-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.bg-grid {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(0, 176, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 176, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
}

.glow-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(0, 176, 255, 0.3) 0%, transparent 70%);
  top: -200px;
  left: -100px;
}

.glow-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(0, 230, 118, 0.2) 0%, transparent 70%);
  bottom: -150px;
  right: -100px;
}

.dashboard-header {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  background: linear-gradient(180deg, rgba(0, 176, 255, 0.1) 0%, transparent 100%);
  border-bottom: 1px solid rgba(0, 176, 255, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #00B0FF 0%, #00E676 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 0 20px rgba(0, 176, 255, 0.4);
}

.project-name {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(90deg, #00B0FF, #00E676);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
}

.project-sub {
  font-size: 12px;
  color: #78909C;
  margin: 2px 0 0 0;
}

.header-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.time-display {
  text-align: center;
}

.time-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #00E676;
  font-family: 'Orbitron', 'Noto Sans SC', monospace;
  text-shadow: 0 0 20px rgba(0, 230, 118, 0.5);
  letter-spacing: 3px;
}

.date-value {
  display: block;
  font-size: 12px;
  color: #78909C;
  margin-top: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.weather-widget {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.2);
  border-radius: 20px;
  color: #FFB74D;
  font-size: 13px;
}

.alarm-widget {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(0, 176, 255, 0.1);
  border: 1px solid rgba(0, 176, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00B0FF;
  cursor: pointer;
  transition: all 0.3s ease;
}

.alarm-widget:hover {
  background: rgba(0, 176, 255, 0.2);
}

.alarm-widget.has-alarm {
  color: #FF1744;
  background: rgba(255, 23, 68, 0.1);
  border-color: rgba(255, 23, 68, 0.3);
  animation: alarmPulse 2s infinite;
}

@keyframes alarmPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(255, 23, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 15px 3px rgba(255, 23, 68, 0.3);
  }
}

.alarm-count-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  background: #FF1744;
  color: white;
  font-size: 11px;
  font-weight: 700;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

.status-summary {
  display: flex;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #90A4AE;
}

.status-item .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-item.danger .dot {
  background: #FF1744;
  box-shadow: 0 0 8px #FF1744;
}

.status-item.warning .dot {
  background: #FFD600;
  box-shadow: 0 0 8px #FFD600;
}

.dashboard-main {
  flex: 1;
  position: relative;
  z-index: 5;
  padding: 16px;
  overflow: hidden;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 16px;
  height: 100%;
}

.panel {
  background: linear-gradient(135deg, rgba(0, 176, 255, 0.04) 0%, rgba(10, 22, 40, 0.8) 100%);
  border: 1px solid rgba(0, 176, 255, 0.15);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  border-top: 2px solid #00B0FF;
  border-left: 2px solid #00B0FF;
  border-top-left-radius: 10px;
  pointer-events: none;
}

.panel::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  border-bottom: 2px solid #00B0FF;
  border-right: 2px solid #00B0FF;
  border-bottom-right-radius: 10px;
  pointer-events: none;
}

.panel-gantt {
  grid-column: 1 / 2;
  grid-row: 1 / 2;
}

.panel-personnel {
  grid-column: 2 / 3;
  grid-row: 1 / 2;
}

.panel-crane {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
}

.panel-env {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
}

.panel-content {
  flex: 1;
  overflow: hidden;
}

.dashboard-footer {
  position: relative;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 24px;
  border-top: 1px solid rgba(0, 176, 255, 0.1);
  background: rgba(10, 22, 40, 0.8);
  font-size: 12px;
  color: #546E7A;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00E676;
  box-shadow: 0 0 8px #00E676;
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
