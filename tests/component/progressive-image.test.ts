// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { expect, it,vi,afterEach } from 'vitest'
import ProgressiveImage from '../../app/components/ui/ProgressiveImage.vue'
afterEach(()=>vi.restoreAllMocks())

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
it('recognizes a completed failure even when its error event preceded hydration',async()=>{
  vi.spyOn(HTMLImageElement.prototype,'complete','get').mockReturnValue(true)
  vi.spyOn(HTMLImageElement.prototype,'naturalWidth','get').mockReturnValue(0)
  const image=mount(ProgressiveImage,{props:{src:'/already-failed.webp',alt:'雨后的荷塘',width:900,height:600}})
  await image.vm.$nextTick()
  expect(image.attributes('data-image-state')).toBe('error')
  expect(image.text()).toContain('图片暂未加载')
})
it('reveals an image already decoded before hydration without waiting for another load event',async()=>{
  vi.spyOn(HTMLImageElement.prototype,'complete','get').mockReturnValue(true)
  vi.spyOn(HTMLImageElement.prototype,'naturalWidth','get').mockReturnValue(900)
  const image=mount(ProgressiveImage,{props:{src:'/already-decoded.webp',alt:'荷塘',width:900,height:600}})
  await image.vm.$nextTick()
  expect(image.attributes('data-image-state')).toBe('ready')
})
