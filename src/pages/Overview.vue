<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProjects, useCurrentTime } from '@/composables/useProjects';
import type { StatusType } from '@/types';

const router = useRouter();
const { projectSummaries, groupSummary, startSimulation, switchProject } = useProjects();
const { currentTime, currentDate, start: startTime } = useCurrentTime();

const statusColors: Record<StatusType, string> = {
  normal: '#00E676',
  warning: '#FFD600',
  danger: '#FF1744'
};

const statusLabels: Record<StatusType, string> = {
  normal: '正常',
  warning: '预警',
  danger: '报警'
};

const sortedProjects = computed(() => {
  const order: Record<StatusType, number> = { danger: 0, warning: 1, normal: 2 };
  return [...projectSummaries.value].sort((a, b) => {
    const diff = order[a.overallStatus] - order[b.overallStatus];
    if (diff !== 0) return diff;
    return b.activeDangerAlarms - a.activeDangerAlarms;
  });
});

const goToProject = (id: string) => {
  switchProject(id);
  router.push('/');
};

const formatArea = (val: number) => {
  if (val >= 10000) {
    return (val / 10000).toFixed(1) + ' 万㎡';
  }
  return val.toLocaleString() + ' ㎡';
};

onMounted(() => {
  startTime();
  startSimulation();
});
</script>

<template>
  <div class="overview-page">
    <div class="dashboard-bg">
      <div class="bg-grid"></div>
      <div class="bg-glow glow-1"></div>
      <div class="bg-glow glow-2"></div>
    </div>

    <header class="overview-header">
      <div class="header-left">
        <div class="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </div>
        <div class="title-group">
          <h1 class="main-title">集团总览</h1>
          <p class="sub-title">集团在建项目 · 全局实时监控</p>
        </div>
      </div>
      <div class="header-center">
        <div class="time-display">
          <span class="time-value">{{ currentTime }}</span>
          <span class="date-value">{{ currentDate }}</span>
        </div>
      </div>
      <div class="header-right">
        <button class="back-btn" @click="router.push('/')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>返回项目详情</span>
        </button>
      </div>
    </header>

    <main class="overview-main">
      <section class="stats-section">
        <div class="stat-card stat-area">
          <div class="stat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M3 21h18"></path>
              <path d="M5 21V7l8-4v18"></path>
              <path d="M19 21V11l-6-4"></path>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">总施工面积</div>
            <div class="stat-value">{{ formatArea(groupSummary.totalArea) }}</div>
            <div class="stat-foot">
              <span class="stat-projects">{{ groupSummary.projectCount }} 个在建项目</span>
            </div>
          </div>
          <div class="stat-decoration"></div>
        </div>

        <div class="stat-card stat-personnel">
          <div class="stat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">总出勤人数</div>
            <div class="stat-value">{{ groupSummary.totalPersonnel.toLocaleString() }} <small>人</small></div>
            <div class="stat-foot">
              <span>各项目人员在岗中</span>
            </div>
          </div>
          <div class="stat-decoration"></div>
        </div>

        <div class="stat-card stat-alarm">
          <div class="stat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">危险源告警</div>
            <div class="stat-value alarm-value">
              <span class="danger-count">{{ groupSummary.totalDangerAlarms }}</span>
              <span class="divider">/</span>
              <span class="warning-count">{{ groupSummary.totalWarningAlarms }}</span>
            </div>
            <div class="stat-foot">
              <span class="label-danger">危险</span>
              <span class="label-warning">预警</span>
            </div>
          </div>
          <div class="stat-decoration alarm-deco"></div>
        </div>

        <div class="stat-card stat-env">
          <div class="stat-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2a10 10 0 1 0 10 10"></path>
              <path d="M12 6v6l4 2"></path>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">环境达标率</div>
            <div class="stat-value">{{ groupSummary.avgCompliance }}%</div>
            <div class="stat-foot">
              <span>平均进度 {{ groupSummary.avgProgress }}%</span>
            </div>
          </div>
          <div class="stat-decoration env-deco"></div>
        </div>
      </section>

      <section class="table-section">
        <div class="section-header">
          <h2 class="section-title">项目清单</h2>
          <div class="section-meta">
            <span class="meta-item">
              <span class="dot dot-danger"></span>{{ projectSummaries.filter(p => p.overallStatus === 'danger').length }} 个报警
            </span>
            <span class="meta-item">
              <span class="dot dot-warning"></span>{{ projectSummaries.filter(p => p.overallStatus === 'warning').length }} 个预警
            </span>
            <span class="meta-item">
              <span class="dot dot-normal"></span>{{ projectSummaries.filter(p => p.overallStatus === 'normal').length }} 个正常
            </span>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="project-table">
            <thead>
              <tr>
                <th style="width: 60px;">状态</th>
                <th>项目名称</th>
                <th style="width: 160px;">所在位置</th>
                <th style="width: 110px;">施工面积</th>
                <th style="width: 100px;">出勤人数</th>
                <th style="width: 100px;">塔吊</th>
                <th style="width: 100px;">告警数</th>
                <th style="width: 110px;">环境达标</th>
                <th style="width: 150px;">项目进度</th>
                <th style="width: 100px;">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in sortedProjects"
                :key="p.info.id"
                class="project-row"
                :class="p.overallStatus"
                @click="goToProject(p.info.id)"
              >
                <td>
                  <span class="status-indicator" :class="p.overallStatus">
                    <span class="status-dot"></span>
                    {{ statusLabels[p.overallStatus] }}
                  </span>
                </td>
                <td>
                  <div class="project-name-cell">
                    <div class="name">{{ p.info.name }}</div>
                    <div class="dates">{{ p.info.startDate }} ~ {{ p.info.endDate }}</div>
                  </div>
                </td>
                <td class="text-secondary">{{ p.info.location }}</td>
                <td>{{ formatArea(p.info.totalArea) }}</td>
                <td class="num-cell">{{ p.totalPersonnel }} 人</td>
                <td class="num-cell">{{ p.totalTowerCranes }} 台</td>
                <td class="num-cell">
                  <span v-if="p.activeDangerAlarms > 0" class="badge-danger">{{ p.activeDangerAlarms }} 危</span>
                  <span v-if="p.activeWarningAlarms > 0" class="badge-warning">{{ p.activeWarningAlarms }} 预</span>
                  <span v-if="p.activeDangerAlarms === 0 && p.activeWarningAlarms === 0" class="badge-normal">无</span>
                </td>
                <td>
                  <span class="compliance-rate" :class="p.envComplianceRate >= 90 ? 'good' : p.envComplianceRate >= 70 ? 'mid' : 'bad'">
                    {{ p.envComplianceRate }}%
                  </span>
                </td>
                <td>
                  <div class="progress-cell">
                    <div class="progress-bar">
                      <div
                        class="progress-fill"
                        :style="{ width: p.projectProgress + '%', background: statusColors[p.overallStatus] }"
                      ></div>
                    </div>
                    <span class="progress-text">{{ p.projectProgress }}%</span>
                  </div>
                </td>
                <td>
                  <button class="view-btn" @click.stop="goToProject(p.info.id)">
                    查看详情
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <footer class="overview-footer">
      <div class="footer-left">
        <span>集团管控中心</span>
        <span class="status-dot"></span>
      </div>
      <div class="footer-right">
        <span>© 2024 智慧工地管控系统 v2.0</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.overview-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  color: #ECEFF1;
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
}

.dashboard-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: linear-gradient(135deg, #05101f 0%, #0a1628 50%, #0d1a30 100%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 176, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 176, 255, 0.04) 1px, transparent 1px);
  background-size: 40px 40px;
}

.bg-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(120px);
  opacity: 0.3;
  pointer-events: none;
}

.glow-1 {
  top: -200px;
  left: -100px;
  background: #00B0FF;
}

.glow-2 {
  bottom: -200px;
  right: -100px;
  background: #00E676;
}

.overview-header {
  position: relative;
  z-index: 10;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(10, 22, 40, 0.8);
  border-bottom: 1px solid rgba(0, 176, 255, 0.15);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(135deg, #00B0FF, #00E676);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 0 20px rgba(0, 176, 255, 0.4);
  flex-shrink: 0;
}

.title-group .main-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(90deg, #00B0FF, #00E676);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 2px;
}

.title-group .sub-title {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #78909C;
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
  font-size: 26px;
  font-weight: 700;
  color: #00B0FF;
  font-family: 'Orbitron', monospace;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(0, 176, 255, 0.4);
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
  gap: 12px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(0, 176, 255, 0.08);
  border: 1px solid rgba(0, 176, 255, 0.25);
  border-radius: 8px;
  color: #00B0FF;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.back-btn:hover {
  background: rgba(0, 176, 255, 0.15);
  border-color: rgba(0, 176, 255, 0.4);
  box-shadow: 0 0 12px rgba(0, 176, 255, 0.2);
}

.overview-main {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  position: relative;
  padding: 22px;
  background: rgba(0, 176, 255, 0.03);
  border: 1px solid rgba(0, 176, 255, 0.15);
  border-radius: 12px;
  display: flex;
  gap: 18px;
  align-items: center;
  overflow: hidden;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 176, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 176, 255, 0.08);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0, 176, 255, 0.2), rgba(0, 230, 118, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00B0FF;
  flex-shrink: 0;
}

.stat-personnel .stat-icon {
  background: linear-gradient(135deg, rgba(0, 230, 118, 0.2), rgba(0, 176, 255, 0.15));
  color: #00E676;
}

.stat-alarm .stat-icon {
  background: linear-gradient(135deg, rgba(255, 23, 68, 0.2), rgba(255, 214, 0, 0.15));
  color: #FF1744;
  animation: alarmPulse 2s infinite;
}

.stat-env .stat-icon {
  background: linear-gradient(135deg, rgba(255, 214, 0, 0.2), rgba(0, 230, 118, 0.15));
  color: #FFD600;
}

@keyframes alarmPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 23, 68, 0.3); }
  50% { box-shadow: 0 0 16px 4px rgba(255, 23, 68, 0.25); }
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #90A4AE;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #ECEFF1;
  font-family: 'Orbitron', monospace;
  letter-spacing: 1px;
}
.stat-value small {
  font-size: 13px;
  font-weight: 500;
  margin-left: 4px;
  color: #78909C;
  font-family: 'Noto Sans SC', sans-serif;
}

.alarm-value {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.alarm-value .danger-count {
  color: #FF1744;
  font-size: 28px;
}
.alarm-value .warning-count {
  color: #FFD600;
  font-size: 22px;
}
.alarm-value .divider {
  color: #455A64;
  font-size: 18px;
}

.stat-foot {
  margin-top: 6px;
  font-size: 11px;
  color: #78909C;
  display: flex;
  gap: 10px;
  align-items: center;
}

.label-danger {
  padding: 1px 8px;
  background: rgba(255, 23, 68, 0.15);
  color: #FF5252;
  border-radius: 10px;
}
.label-warning {
  padding: 1px 8px;
  background: rgba(255, 214, 0, 0.15);
  color: #FFD600;
  border-radius: 10px;
}

.stat-decoration {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 176, 255, 0.15), transparent 70%);
  pointer-events: none;
}
.alarm-deco {
  background: radial-gradient(circle, rgba(255, 23, 68, 0.18), transparent 70%);
}
.env-deco {
  background: radial-gradient(circle, rgba(0, 230, 118, 0.18), transparent 70%);
}

.table-section {
  background: rgba(0, 176, 255, 0.03);
  border: 1px solid rgba(0, 176, 255, 0.12);
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 176, 255, 0.1);
  background: rgba(0, 176, 255, 0.03);
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #ECEFF1;
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-title::before {
  content: '';
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg, #00B0FF, #00E676);
  border-radius: 2px;
}

.section-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #78909C;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot-danger { background: #FF1744; box-shadow: 0 0 6px #FF1744; }
.dot-warning { background: #FFD600; box-shadow: 0 0 6px #FFD600; }
.dot-normal { background: #00E676; box-shadow: 0 0 6px #00E676; }

.table-wrapper {
  overflow-x: auto;
}

.project-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.project-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #90A4AE;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(0, 176, 255, 0.1);
  font-size: 12px;
  letter-spacing: 0.5px;
}

.project-table td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 176, 255, 0.06);
  color: #CFD8DC;
}

.project-row {
  cursor: pointer;
  transition: all 0.2s ease;
}
.project-row:hover {
  background: rgba(0, 176, 255, 0.05);
}
.project-row:hover .view-btn {
  opacity: 1;
}

.project-row.danger {
  background: rgba(255, 23, 68, 0.03);
}
.project-row.danger:hover {
  background: rgba(255, 23, 68, 0.06);
}
.project-row.warning {
  background: rgba(255, 214, 0, 0.02);
}
.project-row.warning:hover {
  background: rgba(255, 214, 0, 0.05);
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
.status-indicator .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-indicator.normal {
  background: rgba(0, 230, 118, 0.12);
  color: #00E676;
}
.status-indicator.normal .status-dot {
  background: #00E676;
}
.status-indicator.warning {
  background: rgba(255, 214, 0, 0.12);
  color: #FFD600;
}
.status-indicator.warning .status-dot {
  background: #FFD600;
  animation: blink 1.5s infinite;
}
.status-indicator.danger {
  background: rgba(255, 23, 68, 0.12);
  color: #FF1744;
}
.status-indicator.danger .status-dot {
  background: #FF1744;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.project-name-cell .name {
  font-size: 13px;
  font-weight: 600;
  color: #ECEFF1;
  margin-bottom: 3px;
}
.project-name-cell .dates {
  font-size: 11px;
  color: #78909C;
}

.text-secondary {
  color: #90A4AE;
}

.num-cell {
  font-family: 'Orbitron', monospace;
  font-weight: 600;
}

.badge-danger, .badge-warning, .badge-normal {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  margin-right: 4px;
}
.badge-danger {
  background: rgba(255, 23, 68, 0.15);
  color: #FF5252;
}
.badge-warning {
  background: rgba(255, 214, 0, 0.15);
  color: #FFD600;
}
.badge-normal {
  background: rgba(0, 230, 118, 0.12);
  color: #00E676;
}

.compliance-rate {
  font-weight: 700;
  font-family: 'Orbitron', monospace;
}
.compliance-rate.good { color: #00E676; }
.compliance-rate.mid { color: #FFD600; }
.compliance-rate.bad { color: #FF5252; }

.progress-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
  box-shadow: 0 0 8px currentColor;
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  color: #B0BEC5;
  font-family: 'Orbitron', monospace;
  min-width: 36px;
  text-align: right;
}

.view-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  background: rgba(0, 176, 255, 0.1);
  border: 1px solid rgba(0, 176, 255, 0.25);
  border-radius: 6px;
  color: #00B0FF;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  opacity: 0.7;
  transition: all 0.2s ease;
}
.view-btn:hover {
  opacity: 1;
  background: rgba(0, 176, 255, 0.18);
  border-color: rgba(0, 176, 255, 0.5);
}

.overview-footer {
  position: relative;
  z-index: 1;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(0, 176, 255, 0.1);
  font-size: 11px;
  color: #546E7A;
  flex-shrink: 0;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-left .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00E676;
  box-shadow: 0 0 6px #00E676;
  animation: blink 2s infinite;
}
</style>
