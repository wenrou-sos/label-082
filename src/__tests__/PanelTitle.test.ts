import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PanelTitle from '@/components/common/PanelTitle.vue';

describe('PanelTitle', () => {
  const defaultProps = {
    title: '甘特图'
  };

  it('renders title text', () => {
    const wrapper = mount(PanelTitle, { props: defaultProps });
    expect(wrapper.text()).toContain('甘特图');
  });

  it('renders extra text when provided', () => {
    const wrapper = mount(PanelTitle, {
      props: { ...defaultProps, extra: '3项任务' }
    });
    expect(wrapper.text()).toContain('3项任务');
  });

  it('does not render extra span when extra is not provided', () => {
    const wrapper = mount(PanelTitle, { props: defaultProps });
    expect(wrapper.find('.title-extra').exists()).toBe(false);
  });

  describe('collapse button', () => {
    it('does not show collapse button when collapsible is false', () => {
      const wrapper = mount(PanelTitle, {
        props: { ...defaultProps, collapsible: false }
      });
      expect(wrapper.find('.collapse-btn').exists()).toBe(false);
    });

    it('shows collapse button when collapsible is true', () => {
      const wrapper = mount(PanelTitle, {
        props: { ...defaultProps, collapsible: true }
      });
      expect(wrapper.find('.collapse-btn').exists()).toBe(true);
    });

    it('emits toggle-collapse when collapse button is clicked', async () => {
      const wrapper = mount(PanelTitle, {
        props: { ...defaultProps, collapsible: true }
      });
      await wrapper.find('.collapse-btn').trigger('click');
      expect(wrapper.emitted('toggle-collapse')).toHaveLength(1);
    });

    it('applies collapsed class when collapsed is true', () => {
      const wrapper = mount(PanelTitle, {
        props: { ...defaultProps, collapsible: true, collapsed: true }
      });
      expect(wrapper.find('.collapse-btn').classes()).toContain('collapsed');
    });

    it('does not apply collapsed class when collapsed is false', () => {
      const wrapper = mount(PanelTitle, {
        props: { ...defaultProps, collapsible: true, collapsed: false }
      });
      expect(wrapper.find('.collapse-btn').classes()).not.toContain('collapsed');
    });

    it('shows correct title attribute based on collapsed state', () => {
      const collapsedWrapper = mount(PanelTitle, {
        props: { ...defaultProps, collapsible: true, collapsed: true }
      });
      expect(collapsedWrapper.find('.collapse-btn').attributes('title')).toBe('展开面板');

      const expandedWrapper = mount(PanelTitle, {
        props: { ...defaultProps, collapsible: true, collapsed: false }
      });
      expect(expandedWrapper.find('.collapse-btn').attributes('title')).toBe('收折面板');
    });
  });

  describe('pin button', () => {
    it('does not show pin button when pinnable is false', () => {
      const wrapper = mount(PanelTitle, {
        props: { ...defaultProps, pinnable: false }
      });
      expect(wrapper.find('.pin-btn').exists()).toBe(false);
    });

    it('shows pin button when pinnable is true', () => {
      const wrapper = mount(PanelTitle, {
        props: { ...defaultProps, pinnable: true }
      });
      expect(wrapper.find('.pin-btn').exists()).toBe(true);
    });

    it('emits toggle-pin when pin button is clicked', async () => {
      const wrapper = mount(PanelTitle, {
        props: { ...defaultProps, pinnable: true }
      });
      await wrapper.find('.pin-btn').trigger('click');
      expect(wrapper.emitted('toggle-pin')).toHaveLength(1);
    });

    it('applies active class when pinned is true', () => {
      const wrapper = mount(PanelTitle, {
        props: { ...defaultProps, pinnable: true, pinned: true }
      });
      expect(wrapper.find('.pin-btn').classes()).toContain('active');
    });

    it('does not apply active class when pinned is false', () => {
      const wrapper = mount(PanelTitle, {
        props: { ...defaultProps, pinnable: true, pinned: false }
      });
      expect(wrapper.find('.pin-btn').classes()).not.toContain('active');
    });

    it('shows correct title attribute based on pinned state', () => {
      const pinnedWrapper = mount(PanelTitle, {
        props: { ...defaultProps, pinnable: true, pinned: true }
      });
      expect(pinnedWrapper.find('.pin-btn').attributes('title')).toBe('取消置顶');

      const unpinnedWrapper = mount(PanelTitle, {
        props: { ...defaultProps, pinnable: true, pinned: false }
      });
      expect(unpinnedWrapper.find('.pin-btn').attributes('title')).toBe('置顶面板');
    });
  });

  describe('both buttons together', () => {
    it('shows both buttons when both collapsible and pinnable are true', () => {
      const wrapper = mount(PanelTitle, {
        props: { ...defaultProps, collapsible: true, pinnable: true }
      });
      expect(wrapper.find('.collapse-btn').exists()).toBe(true);
      expect(wrapper.find('.pin-btn').exists()).toBe(true);
    });

    it('clicking collapse does not trigger pin and vice versa', async () => {
      const wrapper = mount(PanelTitle, {
        props: { ...defaultProps, collapsible: true, pinnable: true }
      });
      await wrapper.find('.collapse-btn').trigger('click');
      expect(wrapper.emitted('toggle-collapse')).toHaveLength(1);
      expect(wrapper.emitted('toggle-pin')).toBeUndefined();

      await wrapper.find('.pin-btn').trigger('click');
      expect(wrapper.emitted('toggle-pin')).toHaveLength(1);
      expect(wrapper.emitted('toggle-collapse')).toHaveLength(1);
    });
  });
});
