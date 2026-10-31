import {expect,test} from '@playwright/test'
test.use({actionTimeout:15000})
test('shows pending admin lists and restores saved editor copy after a delayed fetch',async({page})=>{
  test.setTimeout(90000)
  await page.goto('/admin/login')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true')
  await page.getByLabel('用户名',{exact:true}).fill('local-e2e-owner')
  await page.getByLabel('密码',{exact:true}).fill('Only-for-isolated-tests-2026!')
  await page.getByRole('button',{name:/创建账号并进入|^登录$/}).click()
  await expect(page.getByRole('heading',{name:'照片管理',exact:true})).toBeVisible()
  const saved=await(await page.request.get('/api/admin/site-content')).json()
  let release!:()=>void
  const gate=new Promise<void>(resolve=>{release=resolve})
  await page.route('**/api/admin/posts',async route=>{await gate;await route.fulfill({json:[]})})
  await page.getByRole('link',{name:'动态',exact:true}).click()
  await expect(page.locator('[data-skeleton="list"]')).toBeVisible()
  await expect(page.locator('[data-empty="note"]')).toHaveCount(0)
  release()
  await expect(page.locator('[data-empty="note"] .empty-illustration')).toBeVisible()
  await expect(page.getByRole('link',{name:'开始写一条',exact:true})).toBeVisible()
  let releaseCopy!:()=>void
  const copyGate=new Promise<void>(resolve=>{releaseCopy=resolve})
  await page.route('**/api/admin/site-content',async route=>{await copyGate;await route.fulfill({json:saved})})
  await page.getByRole('link',{name:'文案设置',exact:true}).click()
  await expect(page.locator('[data-skeleton="form"]')).toBeVisible()
  await expect(page.getByRole('button',{name:'保存网站文案',exact:true})).toHaveCount(0)
  releaseCopy()
  await expect(page.getByLabel('首页引言',{exact:true})).toHaveValue(saved.homeQuote)
  await expect(page.getByLabel('作者名称',{exact:true})).toHaveValue(saved.authorName)
  await expect(page.getByRole('button',{name:'保存网站文案',exact:true})).toBeEnabled()
  await page.unroute('**/api/admin/site-content')
  await page.route('**/api/admin/photos',route=>route.fulfill({status:503,json:{statusMessage:'temporary failure'}}))
  await page.getByRole('link',{name:'照片',exact:true}).click()
  await expect(page.getByRole('button',{name:'重新加载照片档案'})).toBeVisible()
  await expect(page.locator('.admin-empty')).toHaveCount(0)
  await page.unroute('**/api/admin/photos')
  await page.getByRole('button',{name:'重新加载照片档案'}).click()
  await expect(page.locator('[data-empty="error"]')).toHaveCount(0)
})

test('protects stored featured selections while settings are pending or failed',async({page})=>{
  test.setTimeout(90000)
  await page.goto('/admin/login')
  await expect(page.locator('html')).toHaveAttribute('data-app-ready','true')
  await page.getByLabel('用户名',{exact:true}).fill('local-e2e-owner')
  await page.getByLabel('密码',{exact:true}).fill('Only-for-isolated-tests-2026!')
  await page.getByRole('button',{name:/创建账号并进入|^登录$/}).click()
  await expect(page.getByRole('heading',{name:'照片管理',exact:true})).toBeVisible()
  let release!:()=>void,fail=true
  const gate=new Promise<void>(resolve=>{release=resolve}),writes:unknown[]=[]
  const saved={featuredPhotoIds:['remembered-photo'],photos:[{id:'remembered-photo',title:'已保存的照片',image:{src:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',width:600,height:900,alt:''}}]}
  await page.route('**/api/admin/settings',async route=>{
    if(route.request().method()==='PUT'){writes.push(route.request().postDataJSON());await route.fulfill({json:{}});return}
    await gate
    await route.fulfill(fail?{status:503,json:{statusMessage:'temporary failure'}}:{json:saved})
  })
  try{
    await page.getByRole('link',{name:'文案设置',exact:true}).click()
    await page.getByText('旧版精选设置（当前首页不展示）',{exact:true}).click()
    const save=page.getByRole('button',{name:'保存首页设置',exact:true})
    await expect(save).toBeDisabled()
    release()
    await expect(page.getByRole('button',{name:'重新加载精选设置',exact:true})).toBeVisible()
    await expect(save).toBeDisabled()
    await page.locator('form.admin-settings').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})))
    expect(writes).toHaveLength(0)
    fail=false
    await page.getByRole('button',{name:'重新加载精选设置',exact:true}).click()
    await expect(page.getByLabel('已保存的照片',{exact:true})).toBeChecked()
    await expect(save).toBeEnabled()
    await save.click()
    await expect.poll(()=>writes).toEqual([{featuredPhotoIds:['remembered-photo']}])
  }finally{release()}
})
