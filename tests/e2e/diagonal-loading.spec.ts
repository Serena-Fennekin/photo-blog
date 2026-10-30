import {expect,test,type Locator} from '@playwright/test'

async function diagonalSheen(block:Locator){
  const travel=await block.evaluate(node=>{
    const animation=node.getAnimations({subtree:true}).find(item=>item instanceof CSSAnimation&&item.animationName.includes('sheen'))
    if(!animation)return null
    animation.pause();animation.currentTime=450
    const a=new DOMMatrix(getComputedStyle(node,'::after').transform)
    animation.currentTime=1200
    const b=new DOMMatrix(getComputedStyle(node,'::after').transform)
    return {dx:b.m41-a.m41,dy:b.m42-a.m42,gradient:getComputedStyle(node,'::after').backgroundImage}
  })
  expect(travel).not.toBeNull()
  expect(travel!.dx).toBeGreaterThan(0)
  expect(travel!.dy).toBeLessThan(0)
}

test('sweeps diagonally over genuinely pending skeletons and photos, then removes the sheen',async({page,request})=>{
  await page.emulateMedia({reducedMotion:'no-preference'})
  const fixture=await(await request.get('/api/public/gallery')).json()
  const item={...fixture.items[0],image:{...fixture.items[0].image,src:'/diagonal-pending.svg',srcset:''}}
  let releaseGallery!:()=>void,releaseImage!:()=>void
  const galleryGate=new Promise<void>(resolve=>{releaseGallery=resolve}),imageGate=new Promise<void>(resolve=>{releaseImage=resolve})
  await page.route('**/api/public/gallery*',async route=>{await galleryGate;await route.fulfill({json:{items:[item],categories:fixture.categories,nextCursor:null}})})
  await page.route('**/diagonal-pending.svg',async route=>{await imageGate;await route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#8ca79c"/></svg>'})})
  try {
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-app-ready','true')
  await page.locator('.site-nav').getByRole('link',{name:'摄影集',exact:true}).click()
  await expect(page.locator('[data-skeleton="gallery"]')).toBeVisible()
  await diagonalSheen(page.locator('.skeleton-photo').first())
  releaseGallery()
  const image=page.locator('.gallery-card .progressive-image').first()
  await expect(image).toHaveAttribute('data-image-state','loading')
  await diagonalSheen(image.locator('.image-placeholder'))
  releaseImage()
  await expect(image).toHaveAttribute('data-image-state','ready')
  await expect(image.locator('.image-placeholder')).toHaveCount(0)
  }finally{releaseGallery();releaseImage()}
})
