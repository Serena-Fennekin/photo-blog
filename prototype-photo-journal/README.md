# 摄影日记本地原型

这是用于讨论界面方向的抛弃式原型，不是生产代码，也不连接真实 OSS 或数据库。

运行：

```powershell
python prototype-photo-journal/serve.py
```

然后访问 `http://127.0.0.1:4173/`。

- `?variant=A`：纵向索引
- `?variant=B`：时间章节
- `?variant=C`：接触印样
- 底部左右按钮或键盘左右方向键可切换方案。
- 点击“进入摄影集”查看瀑布流。
- 点击照片打开 EXIF 灯箱；点击数只在当前浏览器会话中模拟并去重。

