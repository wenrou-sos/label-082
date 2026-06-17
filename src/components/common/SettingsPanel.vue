<script setup lang="ts">
import { computed, ref } from 'vue';
import { useThresholdConfig } from '@/composables/useThresholdConfig';
import type { ThresholdConfig } from '@/types';

defineOptions({ inheritAttrs: false });

interface Props {
  visible: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { config, resetConfig, defaultConfig } = useThresholdConfig();

type TabKey = 'env' | 'crane' | 'gantt';
const activeTab = ref<TabKey>('env');

const tabs: { key: TabKey; label: string; icon: string }[] = [
  { key: 'env', label: '环境监测', icon: '☁️' },
  { key: 'crane', label: '塔吊监控', icon: '🏗️' },
  { key: 'gantt', label: '进度甘特图', icon: '📊' }
];

interface FieldDef {
  key: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  get: (c: ThresholdConfig) => number;
  set: (c: ThresholdConfig, v: number) => void;
  hint?: string;
}

const envFields: FieldDef[] = [
  {
    key: 'pm25-warning',
    label: 'PM2.5 预警阈值',
    unit: 'μg/m³',
    min: 10, max: 200, step: 1,
    get: (c) => c.env.pm25.warning,
    set: (c, v) => (c.env.pm25.warning = Math.min(v, c.env.pm25.danger - 1)),
    hint: '超过此值显示黄色预警'
  },
  {
    key: 'pm25-danger',
    label: 'PM2.5 报警阈值',
    unit: 'μg/m³',
    min: 20, max: 300, step: 1,
    get: (c) => c.env.pm25.danger,
    set: (c, v) => (c.env.pm25.danger = Math.max(v, c.env.pm25.warning + 1)),
    hint: '超过此值显示红色报警'
  },
  {
    key: 'pm10-warning',
    label: 'PM10 预警阈值',
    unit: 'μg/m³',
    min: 20, max: 300, step: 1,
    get: (c) => c.env.pm10.warning,
    set: (c, v) => (c.env.pm10.warning = Math.min(v, c.env.pm10.danger - 1)),
    hint: '超过此值显示黄色预警'
  },
  {
    key: 'pm10-danger',
    label: 'PM10 报警阈值',
    unit: 'μg/m³',
    min: 30, max: 500, step: 1,
    get: (c) => c.env.pm10.danger,
    set: (c, v) => (c.env.pm10.danger = Math.max(v, c.env.pm10.warning + 1)),
    hint: '超过此值显示红色报警'
  },
  {
    key: 'noise-warning',
    label: '噪声预警阈值',
    unit: 'dB',
    min: 30, max: 100, step: 1,
    get: (c) => c.env.noise.warning,
    set: (c, v) => (c.env.noise.warning = Math.min(v, c.env.noise.danger - 1)),
    hint: '超过此值显示黄色预警'
  },
  {
    key: 'noise-danger',
    label: '噪声报警阈值',
    unit: 'dB',
    min: 40, max: 120, step: 1,
    get: (c) => c.env.noise.danger,
    set: (c, v) => (c.env.noise.danger = Math.max(v, c.env.noise.warning + 1)),
    hint: '超过此值显示红色报警'
  },
  {
    key: 'sprinkler-pm25',
    label: '喷淋触发 PM2.5',
    unit: 'μg/m³',
    min: 20, max: 300, step: 1,
    get: (c) => c.env.sprinkler.pm25,
    set: (c, v) => (c.env.sprinkler.pm25 = v),
    hint: '超过此值自动开启喷淋系统'
  },
  {
    key: 'sprinkler-pm10',
    label: '喷淋触发 PM10',
    unit: 'μg/m³',
    min: 30, max: 500, step: 1,
    get: (c) => c.env.sprinkler.pm10,
    set: (c, v) => (c.env.sprinkler.pm10 = v),
    hint: '超过此值自动开启喷淋系统'
  }
];

const craneFields: FieldDef[] = [
  {
    key: 'load-warning',
    label: '吊重预警占比',
    unit: '%',
    min: 30, max: 95, step: 1,
    get: (c) => Math.round(c.crane.load.warningRatio * 100),
    set: (c, v) => (c.crane.load.warningRatio = Math.min(v / 100, c.crane.load.dangerRatio - 0.01)),
    hint: '吊重 / 额定吊重 的预警比例'
  },
  {
    key: 'load-danger',
    label: '吊重报警占比',
    unit: '%',
    min: 50, max: 100, step: 1,
    get: (c) => Math.round(c.crane.load.dangerRatio * 100),
    set: (c, v) => (c.crane.load.dangerRatio = Math.max(v / 100, c.crane.load.warningRatio + 0.01)),
    hint: '吊重 / 额定吊重 的报警比例'
  },
  {
    key: 'wind-warning',
    label: '风速预警占比',
    unit: '%',
    min: 30, max: 99, step: 1,
    get: (c) => Math.round(c.crane.wind.warningRatio * 100),
    set: (c, v) => (c.crane.wind.warningRatio = Math.min(v / 100, c.crane.wind.dangerRatio - 0.01)),
    hint: '风速 / 最大允许风速 的预警比例'
  },
  {
    key: 'wind-danger',
    label: '风速报警占比',
    unit: '%',
    min: 50, max: 150, step: 1,
    get: (c) => Math.round(c.crane.wind.dangerRatio * 100),
    set: (c, v) => (c.crane.wind.dangerRatio = Math.max(v / 100, c.crane.wind.warningRatio + 0.01)),
    hint: '风速 / 最大允许风速 的报警比例（100% 即达到上限）'
  }
];

const ganttFields: FieldDef[] = [
  {
    key: 'lag-warning',
    label: '滞后预警阈值',
    unit: '%',
    min: 1, max: 50, step: 1,
    get: (c) => c.gantt.lagWarningPercent,
    set: (c, v) => (c.gantt.lagWarningPercent = Math.min(v, c.gantt.lagDangerPercent - 1)),
    hint: '实际进度落后于计划进度超过此值显示黄色'
  },
  {
    key: 'lag-danger',
    label: '滞后报警阈值',
    unit: '%',
    min: 2, max: 80, step: 1,
    get: (c) => c.gantt.lagDangerPercent,
    set: (c, v) => (c.gantt.lagDangerPercent = Math.max(v, c.gantt.lagWarningPercent + 1)),
    hint: '实际进度落后于计划进度超过此值显示红色'
  }
];

const fieldMap = { env: envFields, crane: craneFields, gantt: ganttFields };

const statusColor = (v: number, w: number, d: number) => {
  if (v >= d) return '#FF1744';
  if (v >= w) return '#FFD600';
  return '#00E676';
};

const setField = (f: FieldDef, val: number) => {
  f.set(config, val);
};

const isDefault = computed(() => {
  return JSON.stringify(config) === JSON.stringify(defaultConfig);
});
</script>

<template>
  <Teleport to="body">
    <Transition name="mask">
      <div v-if="visible" class="settings-mask" @click.self="emit('close')"></div>
    </Transition>
    <Transition name="panel">
      <aside v-if="visible" class="settings-panel">
        <header class="panel-header">
          <div class="title-group">
            <span class="icon">⚙️</span>
            <div>
              <h2>预警阈值设置</h2>
              <p>修改后自动保存，看板状态实时更新</p>
            </div>
          </div>
          <button class="close-btn" @click="emit('close')" aria-label="关闭">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <nav class="panel-tabs">
          <button
            v-for="t in tabs"
            :key="t.key"
            class="tab-btn"
            :class="{ active: activeTab === t.key }"
            @click="activeTab = t.key"
          >
            <span class="tab-icon">{{ t.icon }}</span>
            <span>{{ t.label }}</span>
          </button>
        </nav>

        <div class="panel-body">
          <div class="field-list">
            <div
              v-for="f in fieldMap[activeTab]"
              :key="f.key"
              class="field-item"
            >
              <div class="field-header">
                <label class="field-label">{{ f.label }}</label>
                <div
                  class="field-value"
                  :style="{ color: statusColor(f.get(config),
                    activeTab === 'crane' ? (f.key.includes('warning') ? 80 : 95) :
                    activeTab === 'gantt' ? 5 : 10,
                    activeTab === 'crane' ? (f.key.includes('warning') ? 95 : 100) :
                    activeTab === 'gantt' ? 10 : 20
                  ) }"
                >
                  {{ f.get(config) }}<small>{{ f.unit }}</small>
                </div>
              </div>

              <div class="slider-row">
                <input
                  type="range"
                  :min="f.min"
                  :max="f.max"
                  :step="f.step"
                  :value="f.get(config)"
                  @input="setField(f, Number(($event.target as HTMLInputElement).value))"
                  class="range-input"
                />
                <div class="range-meta">
                  <span>{{ f.min }}{{ f.unit }}</span>
                  <span>{{ f.max }}{{ f.unit }}</span>
                </div>
              </div>

              <div v-if="f.hint" class="field-hint">{{ f.hint }}</div>
            </div>
          </div>
        </div>

        <footer class="panel-footer">
          <div class="storage-info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            <span>已自动保存到本地</span>
            <span v-if="isDefault" class="default-badge">默认值</span>
          </div>
          <button class="reset-btn" @click="resetConfig">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
            恢复默认
          </button>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.settings-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 10, 25, 0.6);
  backdrop-filter: blur(4px);
  z-index: 999;
}

.settings-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: min(460px, 100vw);
  height: 100vh;
  background: linear-gradient(180deg, #0c1a30 0%, #0a1628 100%);
  border-left: 1px solid rgba(0, 176, 255, 0.2);
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  color: #ECEFF1;
}

.mask-enter-active, .mask-leave-active {
  transition: opacity 0.3s ease;
}
.mask-enter-from, .mask-leave-to {
  opacity: 0;
}

.panel-enter-active, .panel-leave-active {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
.panel-enter-from, .panel-leave-to {
  transform: translateX(100%);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 22px;
  border-bottom: 1px solid rgba(0, 176, 255, 0.12);
  background: linear-gradient(135deg, rgba(0, 176, 255, 0.08), transparent);
}
.title-group {
  display: flex;
  gap: 12px;
  align-items: center;
}
.title-group .icon {
  font-size: 28px;
  filter: drop-shadow(0 0 8px rgba(0, 176, 255, 0.4));
}
.title-group h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(90deg, #00B0FF, #00E676);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
}
.title-group p {
  margin: 3px 0 0 0;
  font-size: 12px;
  color: #78909C;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(0, 176, 255, 0.2);
  background: rgba(0, 176, 255, 0.06);
  color: #78909C;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}
.close-btn:hover {
  color: #FF5252;
  border-color: rgba(255, 82, 82, 0.3);
  background: rgba(255, 82, 82, 0.08);
}

.panel-tabs {
  display: flex;
  padding: 12px 14px 0 14px;
  gap: 6px;
  border-bottom: 1px solid rgba(0, 176, 255, 0.08);
}
.tab-btn {
  flex: 1;
  padding: 10px 8px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #78909C;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  transition: all 0.2s ease;
  border-radius: 6px 6px 0 0;
}
.tab-icon {
  font-size: 16px;
}
.tab-btn:hover {
  color: #B0BEC5;
  background: rgba(0, 176, 255, 0.04);
}
.tab-btn.active {
  color: #00B0FF;
  border-bottom-color: #00B0FF;
  background: rgba(0, 176, 255, 0.06);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 22px;
}
.panel-body::-webkit-scrollbar {
  width: 6px;
}
.panel-body::-webkit-scrollbar-thumb {
  background: rgba(0, 176, 255, 0.2);
  border-radius: 3px;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field-item {
  padding: 14px 16px;
  background: rgba(0, 176, 255, 0.04);
  border: 1px solid rgba(0, 176, 255, 0.1);
  border-radius: 10px;
  transition: all 0.2s ease;
}
.field-item:hover {
  border-color: rgba(0, 176, 255, 0.22);
  background: rgba(0, 176, 255, 0.07);
}

.field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #CFD8DC;
}
.field-value {
  font-size: 20px;
  font-weight: 700;
  font-family: 'Orbitron', 'Noto Sans SC', monospace;
}
.field-value small {
  font-size: 11px;
  font-weight: 500;
  margin-left: 3px;
  color: #78909C;
  font-family: 'Noto Sans SC', sans-serif;
}

.slider-row {
  margin-bottom: 6px;
}
.range-input {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(90deg, rgba(0, 230, 118, 0.25), rgba(255, 214, 0, 0.25), rgba(255, 23, 68, 0.25));
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}
.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00B0FF, #00E676);
  border: 2px solid #0A1628;
  box-shadow: 0 0 10px rgba(0, 176, 255, 0.5);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.range-input::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 0 16px rgba(0, 176, 255, 0.7);
}
.range-input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00B0FF, #00E676);
  border: 2px solid #0A1628;
  box-shadow: 0 0 10px rgba(0, 176, 255, 0.5);
  cursor: pointer;
}

.range-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 10px;
  color: #546E7A;
}

.field-hint {
  font-size: 11px;
  color: #607D8B;
  line-height: 1.5;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.2);
  border-left: 2px solid rgba(0, 176, 255, 0.3);
  border-radius: 0 4px 4px 0;
}

.panel-footer {
  padding: 14px 22px 18px 22px;
  border-top: 1px solid rgba(0, 176, 255, 0.12);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.25);
}
.storage-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #78909C;
}
.default-badge {
  padding: 2px 8px;
  background: rgba(0, 230, 118, 0.12);
  color: #00E676;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  margin-left: 4px;
}

.reset-btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 152, 0, 0.3);
  background: rgba(255, 152, 0, 0.08);
  color: #FFB74D;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}
.reset-btn:hover {
  background: rgba(255, 152, 0, 0.15);
  border-color: rgba(255, 152, 0, 0.5);
  box-shadow: 0 0 12px rgba(255, 152, 0, 0.15);
}
</style>
