import { expect, test } from '@playwright/test'

const post={id:'ui-sample',title:'路上的一页',body:'把沿途的片刻留在这里。',topic:'life',topicLabel:'生活片刻',images:[],publishedAt:'2026-10-30T05:00:00Z',viewCount:0}

test('shows a real pending gallery skeleton, illustrated empty state and recoverable error',async({page})=>{
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true')
  let release!:()=>void
  const gate=new Promise<void>(resolve=>{release=resolve})
  await page.route('**/api/public/gallery*',async route=>{await gate;await route.fulfill({json:{items:[],categories:[],nextCursor:null}})})
  await page.locator('.site-nav').getByRole('link',{name:'摄影集',exact:true}).click()
  await expect(page.locator('[data-skeleton="gallery"]')).toBeVisible()
  await expect(page.locator('.gallery-empty')).toHaveCount(0)
  release()
  await expect(page.locator('[data-skeleton="gallery"]')).toHaveCount(0)
  await expect(page.locator('.gallery-empty svg')).toBeVisible()
  await expect(page.locator('.gallery-empty').getByRole('link',{name:'看看近况'})).toHaveAttribute('href','/about')
  await page.unroute('**/api/public/gallery*')
  await page.route('**/api/public/gallery*',route=>route.fulfill({status:503,json:{statusMessage:'unavailable'}}))
  // Navigate on the client so browser interception sees the request.
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true')
  await page.locator('.site-nav').getByRole('link',{name:'摄影集',exact:true}).click()
  await expect(page.getByRole('button',{name:'重新加载照片'})).toBeVisible()
  await page.unroute('**/api/public/gallery*')
  await page.getByRole('button',{name:'重新加载照片'}).click()
  await expect(page.locator('.gallery-card').first()).toBeVisible()
})

test('reserves image space through delayed success and failure and renders category vectors',async({page,request})=>{
  const fixture=await(await request.get('/api/public/gallery')).json()
  const item={...fixture.items[0],image:{...fixture.items[0].image,src:'/ui-slow.svg',srcset:''}}
  let release!:()=>void
  const gate=new Promise<void>(resolve=>{release=resolve})
  await page.route('**/ui-slow.svg',async route=>{await gate;await route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900"><rect width="600" height="900" fill="#7a9d91"/></svg>'})})
  await page.route('**/api/public/gallery*',route=>route.fulfill({json:{items:[item],categories:[{slug:'cats',name:'猫猫🐱'}],nextCursor:null}}))
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true')
  await page.locator('.site-nav').getByRole('link',{name:'摄影集',exact:true}).click()
  const image=page.locator('.gallery-card .progressive-image')
  await expect(image).toHaveAttribute('data-image-state','loading')
  const before=await image.boundingBox()
  await expect(page.locator('[data-category="cats"] svg')).toBeVisible()
  expect(await page.locator('[data-category="cats"]').innerText()).toBe('猫猫')
  release()
  await expect(image).toHaveAttribute('data-image-state','ready')
  const after=await image.boundingBox()
  expect(Math.abs(before!.height-after!.height)).toBeLessThan(1)
  await page.route('**/ui-slow.svg',route=>route.abort())
  await page.locator('[data-category="cats"]').click()
  // Same asset may be cached; a distinct failing URL verifies the failure state.
  await page.unroute('**/api/public/gallery*')
  await page.route('**/api/public/gallery*',route=>route.fulfill({json:{items:[{...item,id:'failed-image',image:{...item.image,src:'/ui-failed.webp'}}],categories:[],nextCursor:null}}))
  await page.route('**/ui-failed.webp',route=>route.abort())
  await page.locator('[data-category="all"]').click()
  await expect(page.locator('.progressive-image')).toHaveAttribute('data-image-state','error')
  await expect(page.getByText('图片暂未加载',{exact:true})).toBeVisible()
})

test('keeps a pending feed out of the empty state and adds restrained card lift',async({page,isMobile})=>{
  let release!:()=>void
  const gate=new Promise<void>(resolve=>{release=resolve})
  await page.route('**/api/public/posts',async route=>{await gate;await route.fulfill({json:{items:[post],nextCursor:null}})})
  await page.route('**/api/public/posts/*/view',route=>route.fulfill({json:{total:1}}))
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true')
  await page.locator('.site-nav').getByRole('link',{name:'关于我',exact:true}).click()
  await expect(page.locator('[data-skeleton="feed"]')).toBeVisible()
  await expect(page.locator('.moments-empty')).toHaveCount(0)
  release()
  await expect(page.locator('.moment-card')).toBeVisible()
  await expect(page.locator('.route-curtain')).toHaveAttribute('data-state','idle')
  if(!isMobile){
    await page.mouse.move(0,0)
    const card=page.locator('.moment-card'),before=await card.boundingBox()
    await card.hover();await page.waitForTimeout(450)
    const after=await card.boundingBox()
    expect(before!.y-after!.y).toBeGreaterThan(1)
    expect(before!.y-after!.y).toBeLessThan(5)
  }
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('/')
  await expect(page.locator('[data-home-motion-root]')).toHaveAttribute('data-motion-mode','static')
  expect(await page.locator('#gallery-invitation-title').evaluate(node=>getComputedStyle(node).opacity)).toBe('1')
  expect(await page.locator('#gallery-invitation-title').evaluate(node=>node.getAnimations().filter(animation=>animation.playState==='running').length)).toBe(0)
})

test('ignores an older category page that finishes after switching filters',async({page,request})=>{
  const fixture=await(await request.get('/api/public/gallery')).json()
  const [initial,late,replacement]=fixture.items
  let release!:()=>void
  const gate=new Promise<void>(resolve=>{release=resolve})
  await page.route('**/api/public/gallery*',async route=>{
    const query=new URL(route.request().url()).searchParams
    if(query.get('cursor')){await gate;await route.fulfill({json:{items:[late],nextCursor:null,categories:fixture.categories}});return}
    await route.fulfill({json:{items:[query.get('category')?replacement:initial],nextCursor:query.get('category')?null:'delayed-page',categories:[{slug:'other',name:'另一个主题'}]}})
  })
  try{
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-app-ready','true')
    await page.locator('.site-nav').getByRole('link',{name:'摄影集',exact:true}).click()
    await page.getByRole('button',{name:'加载更多',exact:true}).click()
    await expect(page.locator('[data-skeleton="gallery"]')).toBeVisible()
    await page.locator('.gallery-heading').scrollIntoViewIfNeeded()
    await page.locator('[data-category="other"]').click()
    await expect(page.locator(`[data-photo-id="${replacement.id}"]`)).toBeVisible()
    const finished=page.waitForResponse(response=>response.url().includes('cursor=delayed-page'))
    release();await finished
    await page.waitForTimeout(150)
    await expect(page.locator(`[data-photo-id="${late.id}"]`)).toHaveCount(0)
    await expect(page.locator('.gallery-card')).toHaveCount(1)
  }finally{release()}
})
