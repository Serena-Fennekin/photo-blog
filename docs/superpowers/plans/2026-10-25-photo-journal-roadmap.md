# 摄影日志开发路线图

本路线图实现 [`2026-10-25-photo-journal-design.md`](../specs/2026-10-25-photo-journal-design.md)，按以下顺序执行：

1. [`公开站点计划`](./2026-10-25-photo-journal-public-site.md)
   - 产出可运行的 Nuxt 公开站点。
   - 使用稳定的 fixture 数据验证首页、摄影集、灯箱、组图详情、主题与动效。
   - 不依赖数据库、后台账号或云服务。
2. [`后台与数据计划`](./2026-10-25-photo-journal-admin-data.md)
   - 用 SQLite 替换 fixture repository。
   - 完成单管理员、组图发布、本地媒体处理、分类与封面设置、浏览量。
   - 不需要 OSS 凭据即可在本地完成完整内容生命周期。
3. [`OSS 与部署计划`](./2026-10-25-photo-journal-oss-deployment.md)
   - 接入杭州 OSS、图片处理和 CDN。
   - 完成 Docker/Caddy、备份恢复、监控、安全加固与生产验收。

每个阶段必须通过其 Phase Acceptance 后才能进入下一阶段。抛弃式原型 `prototype-photo-journal/` 在整个过程中保持只读参考，生产代码在仓库根目录新建。

当前工作目录尚未初始化 Git。执行计划前需征得用户同意后初始化仓库，以便按任务进行小步提交和回滚。
