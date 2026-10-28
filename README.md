# PHOTO JOURNAL

以独立照片和简短随笔为主的个人摄影网站。Nuxt + Vue + TypeScript，SQLite 持久化，支持平级瀑布流、EXIF 灯箱、三态主题、摄影转场和单管理员后台。

```powershell
npm install
npm run dev
```

打开 [网站](http://127.0.0.1:3000/) 或 [管理入口](http://127.0.0.1:3000/admin/login)。首次在本机进入后台可自行创建管理员。项目自带 Node 22，电脑全局 Node 20 无需更换。

后台直接批量选图上传，每张照片独立编辑、分类、排序、发布与撤回，也支持多选批量操作。首页保留引言和摄影集入口，照片在摄影集中平级展示；相机转场的弧形幕布跟随当前主题。原图私有，展示图经过缩放和元数据清理，浏览量按访客与照片24小时去重。当前为本地版本，OSS/CDN与生产部署后续接入。

完整操作、迁移、备份和验证命令见 [本地开发说明](docs/local-development.md)。当前模型见 [独立照片规格](docs/superpowers/specs/2026-10-27-flat-photo-gallery-design.md) 与 [实施计划](docs/superpowers/plans/2026-10-27-flat-photo-gallery.md)。
