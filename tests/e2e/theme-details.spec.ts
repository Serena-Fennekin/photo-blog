import {expect,test} from '@playwright/test'

test('follows live system colours while the glass capsule stays on the selected preference',async({page})=>{
  await page.emulateMedia({colorScheme:'light'})
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true')
  const group=page.getByRole('group',{name:'颜色主题'}),capsule=group.locator('.theme-selector__indicator')
  const aligned=async(name:string)=>{
    const choice=group.getByRole('button',{name,exact:true})
    await expect(choice).toHaveAttribute('aria-pressed','true')
    await expect.poll(async()=>{
      const a=await choice.boundingBox(),b=await capsule.boundingBox()
      return a&&b?Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.width-b.width),Math.abs(a.height-b.height)):999
    }).toBeLessThan(1.5)
    expect(await choice.evaluate(node=>getComputedStyle(node).zIndex)).not.toBe('auto')
  }
  await group.getByRole('button',{name:'跟随系统',exact:true}).click();await aligned('跟随系统')
  await page.emulateMedia({colorScheme:'dark'})
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await aligned('跟随系统')
  await group.getByRole('button',{name:'浅色',exact:true}).click();await aligned('浅色')
  await page.emulateMedia({colorScheme:'light'});await page.emulateMedia({colorScheme:'dark'})
  await expect(page.locator('html')).toHaveAttribute('data-theme','light')
  await group.getByRole('button',{name:'跟随系统',exact:true}).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark')
  await page.setViewportSize({width:393,height:852})
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await aligned('跟随系统')
  await group.getByRole('button',{name:'深色',exact:true}).click();await aligned('深色')
  await page.setViewportSize({width:1412,height:1244});await aligned('深色')
})

test('keeps the theme usable when preference storage is denied',async({page})=>{
  await page.emulateMedia({colorScheme:'light'})
  // Inject at the journal boundary; development-only Vue tooling reads its own
  // storage during module initialization, before application code can recover.
  await page.addInitScript(()=>{
    const get=Storage.prototype.getItem,set=Storage.prototype.setItem
    Storage.prototype.getItem=function(key){if(key==='photo-journal-theme')throw new DOMException('Blocked','SecurityError');return get.call(this,key)}
    Storage.prototype.setItem=function(key,value){if(key==='photo-journal-theme')throw new DOMException('Blocked','SecurityError');return set.call(this,key,value)}
  })
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true')
  await expect(page.locator('html')).toHaveAttribute('data-theme','light')
  await page.evaluate(()=>{Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Blocked','SecurityError')}})})
  await page.getByRole('button',{name:'深色',exact:true}).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark')
  await page.getByRole('button',{name:'跟随系统',exact:true}).click()
  await page.emulateMedia({colorScheme:'dark'})
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark')
})

test('card hover keeps the same inset shadow without a dark outside band',async({page,isMobile})=>{
  test.skip(isMobile,'Hover is a pointer interaction.')
  await page.route('**/api/public/posts',route=>route.fulfill({json:{items:[{id:'card-shadow',title:'一小段日常',body:'停下来，看看沿途的风景。',topic:'life',topicLabel:'生活片刻',publishedAt:'2026-10-30T05:00:00Z',images:[],viewCount:0}],nextCursor:null}}))
  await page.route('**/api/public/posts/*/view',route=>route.fulfill({json:{total:1}}))
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-app-ready','true')
  await page.locator('.site-nav').getByRole('link',{name:'关于我',exact:true}).click()
  await expect(page.locator('.route-curtain')).toHaveAttribute('data-state','idle')
  const card=page.locator('.moment-card')
  await page.mouse.move(0,0)
  const before=await card.evaluate(node=>({shadow:getComputedStyle(node).boxShadow,fill:getComputedStyle(node).backgroundColor}))
  await card.hover();await page.waitForTimeout(450)
  const after=await card.evaluate(node=>({shadow:getComputedStyle(node).boxShadow,fill:getComputedStyle(node).backgroundColor}))
  expect(after).toEqual(before)
})

test('anchors the narrow admin capsule without relying on backdrop filters',async({page})=>{
  await page.setViewportSize({width:800,height:1000})
  await page.emulateMedia({contrast:'more'})
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-app-ready','true')
  // Exercise the real component and loaded admin styles without an account or
  // real content. Moving its DOM preserves its observer and preference wiring.
  await page.evaluate(()=>{
    const header=document.createElement('header');header.className='admin-header'
    header.style.cssText='position:fixed;inset:160px 0 auto;z-index:100'
    header.append(document.querySelector('.theme-selector')!)
    document.body.append(header)
  })
  const group=page.locator('.admin-header .theme-selector')
  expect(await group.evaluate(node=>getComputedStyle(node).backdropFilter)).toBe('none')
  const choice=group.getByRole('button',{name:'深色',exact:true});await choice.click()
  await expect.poll(async()=>{
    const a=await choice.boundingBox(),b=await group.locator('.theme-selector__indicator').boundingBox()
    return a&&b?Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y),Math.abs(a.width-b.width),Math.abs(a.height-b.height)):999
  },{timeout:3000}).toBeLessThan(1.5)
})
