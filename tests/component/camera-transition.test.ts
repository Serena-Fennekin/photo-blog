// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import CameraTransition from '../../app/components/site/CameraTransition.vue'

it('keeps the camera artwork without loading text and follows router phases', async () => {
  const wrapper = mount(CameraTransition, { props: { phase: 'covering' } })
  expect(wrapper.find('.lens svg').exists()).toBe(true)
  expect(wrapper.text()).toBe('')
  expect(wrapper.find('.camera-message, .glyph').exists()).toBe(false)
  expect(wrapper.attributes('data-camera-phase')).toBe('covering')
  await wrapper.setProps({ phase: 'covered' })
  expect(wrapper.attributes('data-camera-phase')).toBe('covered')
  await wrapper.setProps({ phase: 'revealing' })
  expect(wrapper.attributes('data-camera-phase')).toBe('revealing')
})
