// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { expect, it } from 'vitest'
import ProgressiveImage from '../../app/components/ui/ProgressiveImage.vue'

it('reserves a photo while loading, reveals it on load, and resets for a new source', async () => {
  const image=mount(ProgressiveImage,{props:{src:'/slow.webp',alt:'河边的猫',width:600,height:900}})
  expect(image.attributes('data-image-state')).toBe('loading')
  expect(image.get('img').attributes('width')).toBe('600')
  expect(image.get('img').attributes('height')).toBe('900')
  await image.get('img').trigger('load')
  expect(image.attributes('data-image-state')).toBe('ready')
  await image.setProps({src:'/other.webp'})
  expect(image.attributes('data-image-state')).toBe('loading')
})
it('shows an image fallback instead of an endless skeleton on failure',async()=>{
  const image=mount(ProgressiveImage,{props:{src:'/missing.webp',alt:'湖面',width:900,height:600}})
  await image.get('img').trigger('error')
  expect(image.attributes('data-image-state')).toBe('error')
  expect(image.text()).toContain('图片暂未加载')
})
