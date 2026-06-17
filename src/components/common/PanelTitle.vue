<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  icon?: string;
  extra?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  pinnable?: boolean;
  pinned?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  collapsible: false,
  collapsed: false,
  pinnable: false,
  pinned: false
});

const emit = defineEmits<{
  (e: 'toggle-collapse'): void;
  (e: 'toggle-pin'): void;
}>();

const handleCollapse = () => {
  if (props.collapsible) {
    emit('toggle-collapse');
  }
};

const handlePin = () => {
  if (props.pinnable) {
    emit('toggle-pin');
  }
};
</script>

<template>
  <div class="panel-title">
    <div class="title-left">
      <span class="title-decor"></span>
      <span class="title-text">{{ title }}</span>
    </div>
    <div class="title-right">
      <span v-if="extra" class="title-extra">{{ extra }}</span>
      <div class="title-actions">
        <button
          v-if="pinnable"
          class="action-btn pin-btn"
          :class="{ active: pinned }"
          @click="handlePin"
          :title="pinned ? '取消置顶' : '置顶面板'"
        >
          <svg v-if="pinned" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 17v5"></path>
            <path d="M9 3h6l-1 7 4 4H6l4-4-1-7z"></path>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 17v5"></path>
            <path d="M9 3h6l-1 7 4 4H6l4-4-1-7z"></path>
          </svg>
        </button>
        <button
          v-if="collapsible"
          class="action-btn collapse-btn"
          :class="{ collapsed }"
          @click="handleCollapse"
          :title="collapsed ? '展开面板' : '收折面板'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline v-if="collapsed" points="6 9 12 15 18 9"></polyline>
            <polyline v-else points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(0, 176, 255, 0.15);
  background: linear-gradient(90deg, rgba(0, 176, 255, 0.08) 0%, transparent 100%);
  flex-shrink: 0;
  user-select: none;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-decor {
  width: 4px;
  height: 18px;
  background: linear-gradient(180deg, #00B0FF 0%, #00E676 100%);
  border-radius: 2px;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #ECEFF1;
  letter-spacing: 1px;
}

.title-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-extra {
  font-size: 12px;
  color: #78909C;
}

.title-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 176, 255, 0.2);
  background: rgba(0, 176, 255, 0.05);
  color: #78909C;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  color: #00B0FF;
  border-color: rgba(0, 176, 255, 0.4);
  background: rgba(0, 176, 255, 0.1);
}

.action-btn.active {
  color: #00E676;
  border-color: rgba(0, 230, 118, 0.4);
  background: rgba(0, 230, 118, 0.1);
}

.collapse-btn.collapsed svg {
  transform: rotate(0deg);
}

.pin-btn.active {
  color: #00E676;
}
</style>
