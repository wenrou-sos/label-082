import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePanelLayout } from '@/composables/usePanelLayout';

const STORAGE_KEY = 'smart-site-panel-layout';

describe('usePanelLayout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('returns default values when localStorage is empty', () => {
      const layout = usePanelLayout();
      expect(layout.colLeftRatio.value).toBe(0.5);
      expect(layout.leftRowRatio.value).toBe(0.5);
      expect(layout.rightRowRatio.value).toBe(0.5);
      expect(layout.pinned.value).toBeNull();
      expect(layout.collapsed.value.gantt).toBe(false);
      expect(layout.collapsed.value.personnel).toBe(false);
      expect(layout.collapsed.value.crane).toBe(false);
      expect(layout.collapsed.value.env).toBe(false);
    });

    it('loads saved state from localStorage', () => {
      const saved = {
        colLeftRatio: 0.7,
        leftRowRatio: 0.6,
        rightRowRatio: 0.4,
        collapsed: { gantt: true, personnel: false, crane: true, env: false },
        pinned: 'crane'
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      const layout = usePanelLayout();
      expect(layout.colLeftRatio.value).toBe(0.7);
      expect(layout.leftRowRatio.value).toBe(0.6);
      expect(layout.rightRowRatio.value).toBe(0.4);
      expect(layout.collapsed.value.gantt).toBe(true);
      expect(layout.collapsed.value.crane).toBe(true);
      expect(layout.pinned.value).toBe('crane');
    });

    it('clamps out-of-range ratios from localStorage', () => {
      const saved = {
        colLeftRatio: 0.1,
        leftRowRatio: 0.9,
        rightRowRatio: 1.5,
        collapsed: { gantt: false, personnel: false, crane: false, env: false },
        pinned: null
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

      const layout = usePanelLayout();
      expect(layout.colLeftRatio.value).toBe(0.2);
      expect(layout.leftRowRatio.value).toBe(0.8);
      expect(layout.rightRowRatio.value).toBe(0.8);
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEY, '{invalid json');
      const layout = usePanelLayout();
      expect(layout.colLeftRatio.value).toBe(0.5);
    });
  });

  describe('setColLeftRatio', () => {
    it('sets ratio within valid range', () => {
      const layout = usePanelLayout();
      layout.setColLeftRatio(0.65);
      expect(layout.colLeftRatio.value).toBe(0.65);
    });

    it('clamps ratio to minimum 0.2', () => {
      const layout = usePanelLayout();
      layout.setColLeftRatio(0.1);
      expect(layout.colLeftRatio.value).toBe(0.2);
    });

    it('clamps ratio to maximum 0.8', () => {
      const layout = usePanelLayout();
      layout.setColLeftRatio(0.95);
      expect(layout.colLeftRatio.value).toBe(0.8);
    });

    it('persists to localStorage', () => {
      const layout = usePanelLayout();
      layout.setColLeftRatio(0.65);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.colLeftRatio).toBe(0.65);
    });
  });

  describe('setLeftRowRatio / setRightRowRatio', () => {
    it('sets left row ratio and persists', () => {
      const layout = usePanelLayout();
      layout.setLeftRowRatio(0.7);
      expect(layout.leftRowRatio.value).toBe(0.7);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.leftRowRatio).toBe(0.7);
    });

    it('sets right row ratio and persists', () => {
      const layout = usePanelLayout();
      layout.setRightRowRatio(0.3);
      expect(layout.rightRowRatio.value).toBe(0.3);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.rightRowRatio).toBe(0.3);
    });

    it('clamps left row ratio', () => {
      const layout = usePanelLayout();
      layout.setLeftRowRatio(0);
      expect(layout.leftRowRatio.value).toBe(0.2);
    });

    it('clamps right row ratio', () => {
      const layout = usePanelLayout();
      layout.setRightRowRatio(1);
      expect(layout.rightRowRatio.value).toBe(0.8);
    });
  });

  describe('toggleCollapse', () => {
    it('toggles a panel from not collapsed to collapsed', () => {
      const layout = usePanelLayout();
      expect(layout.collapsed.value.gantt).toBe(false);
      layout.toggleCollapse('gantt');
      expect(layout.collapsed.value.gantt).toBe(true);
    });

    it('toggles a panel back from collapsed', () => {
      const layout = usePanelLayout();
      layout.toggleCollapse('gantt');
      layout.toggleCollapse('gantt');
      expect(layout.collapsed.value.gantt).toBe(false);
    });

    it('persists collapse state to localStorage', () => {
      const layout = usePanelLayout();
      layout.toggleCollapse('env');
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.collapsed.env).toBe(true);
    });

    it('independent toggle for each panel', () => {
      const layout = usePanelLayout();
      layout.toggleCollapse('gantt');
      layout.toggleCollapse('crane');
      expect(layout.collapsed.value.gantt).toBe(true);
      expect(layout.collapsed.value.crane).toBe(true);
      expect(layout.collapsed.value.personnel).toBe(false);
      expect(layout.collapsed.value.env).toBe(false);
    });
  });

  describe('togglePin', () => {
    it('pins a panel', () => {
      const layout = usePanelLayout();
      layout.togglePin('personnel');
      expect(layout.pinned.value).toBe('personnel');
    });

    it('unpins the same panel', () => {
      const layout = usePanelLayout();
      layout.togglePin('personnel');
      layout.togglePin('personnel');
      expect(layout.pinned.value).toBeNull();
    });

    it('switches pin to a different panel', () => {
      const layout = usePanelLayout();
      layout.togglePin('gantt');
      layout.togglePin('env');
      expect(layout.pinned.value).toBe('env');
    });

    it('persists pin state to localStorage', () => {
      const layout = usePanelLayout();
      layout.togglePin('crane');
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.pinned).toBe('crane');
    });
  });

  describe('resetLayout', () => {
    it('resets all state to defaults', () => {
      const layout = usePanelLayout();
      layout.setColLeftRatio(0.7);
      layout.setLeftRowRatio(0.6);
      layout.setRightRowRatio(0.3);
      layout.toggleCollapse('gantt');
      layout.togglePin('personnel');

      layout.resetLayout();

      expect(layout.colLeftRatio.value).toBe(0.5);
      expect(layout.leftRowRatio.value).toBe(0.5);
      expect(layout.rightRowRatio.value).toBe(0.5);
      expect(layout.collapsed.value.gantt).toBe(false);
      expect(layout.pinned.value).toBeNull();
    });

    it('persists reset state to localStorage', () => {
      const layout = usePanelLayout();
      layout.setColLeftRatio(0.7);
      layout.resetLayout();
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.colLeftRatio).toBe(0.5);
    });
  });
});
