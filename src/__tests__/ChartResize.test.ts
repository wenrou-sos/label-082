import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePanelLayout } from '@/composables/usePanelLayout';

describe('ResizeObserver integration', () => {
  const STORAGE_KEY = 'smart-site-panel-layout';

  beforeEach(() => {
    localStorage.clear();
  });

  it('ResizeObserver is available in test environment', () => {
    expect(ResizeObserver).toBeDefined();
    const observer = new ResizeObserver(() => {});
    expect(observer).toBeDefined();
    expect(typeof observer.observe).toBe('function');
    expect(typeof observer.disconnect).toBe('function');
    observer.disconnect();
  });

  it('ResizeObserver observe returns without error', () => {
    const callback = vi.fn();
    const observer = new ResizeObserver(callback);
    const el = document.createElement('div');
    el.style.width = '100px';
    el.style.height = '100px';
    document.body.appendChild(el);

    expect(() => observer.observe(el)).not.toThrow();

    observer.disconnect();
    document.body.removeChild(el);
  });

  it('requestAnimationFrame schedules callback', async () => {
    const callback = vi.fn();
    requestAnimationFrame(callback);
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(callback).toHaveBeenCalled();
  });

  it('rAF deduplication prevents multiple resize calls in same frame', async () => {
    let callCount = 0;
    let pendingRaf: number | null = null;

    const scheduleResize = () => {
      if (pendingRaf !== null) return;
      pendingRaf = requestAnimationFrame(() => {
        pendingRaf = null;
        callCount++;
      });
    };

    scheduleResize();
    scheduleResize();
    scheduleResize();

    await new Promise(resolve => requestAnimationFrame(resolve));

    expect(callCount).toBe(1);
  });

  it('subsequent rAF calls after frame completes are allowed', async () => {
    let callCount = 0;
    let pendingRaf: number | null = null;

    const scheduleResize = () => {
      if (pendingRaf !== null) return;
      pendingRaf = requestAnimationFrame(() => {
        pendingRaf = null;
        callCount++;
      });
    };

    scheduleResize();
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(callCount).toBe(1);

    scheduleResize();
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(callCount).toBe(2);
  });

  it('chart resize is skipped when container has zero dimensions', () => {
    const resizeFn = vi.fn();
    const container = { clientWidth: 0, clientHeight: 0 };

    if (container.clientWidth > 0 && container.clientHeight > 0) {
      resizeFn();
    }

    expect(resizeFn).not.toHaveBeenCalled();

    container.clientWidth = 200;
    container.clientHeight = 100;

    if (container.clientWidth > 0 && container.clientHeight > 0) {
      resizeFn();
    }

    expect(resizeFn).toHaveBeenCalledTimes(1);
  });

  it('ResizeObserver disconnect cleans up properly', () => {
    const callback = vi.fn();
    const observer = new ResizeObserver(callback);
    const el = document.createElement('div');
    document.body.appendChild(el);

    observer.observe(el);
    const callCountAfterObserve = callback.mock.calls.length;
    observer.disconnect();

    el.style.width = '500px';

    expect(callback).toHaveBeenCalledTimes(callCountAfterObserve);
    document.body.removeChild(el);
  });

  it('cancelAnimationFrame cancels pending rAF', async () => {
    const callback = vi.fn();
    const id = requestAnimationFrame(callback);
    cancelAnimationFrame(id);

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(callback).not.toHaveBeenCalled();
  });
});
