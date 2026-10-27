# PHOTO JOURNAL

以照片、组图和简短随笔为主的个人摄影日志。Nuxt + Vue + TypeScript，SQLite 持久化，支持公开瀑布流、EXIF 灯箱、三态主题、摄影转场和单管理员后台。

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 3000
```

打开 [网站](http://127.0.0.1:3000/) 或 [管理入口](http://127.0.0.1:3000/admin/login)。首次在本机进入后台可自行创建管理员。项目自带 Node 22，电脑全局 Node 20 无需更换。

后台支持批量上传、排序、组图封面、草稿预览、发布与撤回、分类和首页封面设置。原图私有，公开展示图经过缩放和元数据清理，浏览量按访客与照片24小时去重。当前为本地版本，OSS/CDN与生产部署按后续阶段接入。

完整操作、数据位置、备份和验证命令见 [本地开发说明](docs/local-development.md)。开发决策见 [实施计划](docs/superpowers/plans/2026-10-27-local-publishing.md)。
