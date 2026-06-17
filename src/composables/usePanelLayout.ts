import { ref } from 'vue';

const STORAGE_KEY = 'smart-site-panel-layout';

export type PanelKey = 'gantt' | 'personnel' | 'crane' | 'env';

interface PanelLayoutState {
  colLeftRatio: number;
  leftRowRatio: number;
  rightRowRatio: number;
  collapsed: Record<PanelKey, boolean>;
  pinned: PanelKey | null;
}

const DEFAULT_STATE: PanelLayoutState = {
  colLeftRatio: 0.5,
  leftRowRatio: 0.5,
  rightRowRatio: 0.5,
  collapsed: {
    gantt: false,
    personnel: false,
    crane: false,
    env: false
  },
  pinned: null
};

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const loadState = (): PanelLayoutState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        colLeftRatio: clamp(parsed.colLeftRatio ?? 0.5, 0.2, 0.8),
        leftRowRatio: clamp(parsed.leftRowRatio ?? 0.5, 0.2, 0.8),
        rightRowRatio: clamp(parsed.rightRowRatio ?? 0.5, 0.2, 0.8),
        collapsed: { ...DEFAULT_STATE.collapsed, ...(parsed.collapsed || {}) },
        pinned: parsed.pinned ?? null
      };
    }
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_STATE };
};

const saveState = (state: PanelLayoutState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
};

export function usePanelLayout() {
  const state = loadState();

  const colLeftRatio = ref(state.colLeftRatio);
  const leftRowRatio = ref(state.leftRowRatio);
  const rightRowRatio = ref(state.rightRowRatio);
  const collapsed = ref<Record<PanelKey, boolean>>({ ...state.collapsed });
  const pinned = ref<PanelKey | null>(state.pinned);

  const persist = () => {
    saveState({
      colLeftRatio: colLeftRatio.value,
      leftRowRatio: leftRowRatio.value,
      rightRowRatio: rightRowRatio.value,
      collapsed: { ...collapsed.value },
      pinned: pinned.value
    });
  };

  const toggleCollapse = (key: PanelKey) => {
    collapsed.value[key] = !collapsed.value[key];
    persist();
  };

  const togglePin = (key: PanelKey) => {
    if (pinned.value === key) {
      pinned.value = null;
    } else {
      pinned.value = key;
    }
    persist();
  };

  const setColLeftRatio = (ratio: number) => {
    colLeftRatio.value = clamp(ratio, 0.2, 0.8);
    persist();
  };

  const setLeftRowRatio = (ratio: number) => {
    leftRowRatio.value = clamp(ratio, 0.2, 0.8);
    persist();
  };

  const setRightRowRatio = (ratio: number) => {
    rightRowRatio.value = clamp(ratio, 0.2, 0.8);
    persist();
  };

  const resetLayout = () => {
    colLeftRatio.value = 0.5;
    leftRowRatio.value = 0.5;
    rightRowRatio.value = 0.5;
    collapsed.value = { ...DEFAULT_STATE.collapsed };
    pinned.value = null;
    persist();
  };

  return {
    colLeftRatio,
    leftRowRatio,
    rightRowRatio,
    collapsed,
    pinned,
    toggleCollapse,
    togglePin,
    setColLeftRatio,
    setLeftRowRatio,
    setRightRowRatio,
    resetLayout
  };
}
