import type { SiteCopy } from './types/notebook'
export const defaultSiteCopy: SiteCopy = {
  homeQuote: '有些片刻没有故事，\n只需要被安静地记录下来。', homeLinkLabel: '进入摄影集',
  aboutTitle: '关于我', aboutStatement: '把片刻留给照片，\n把下一程交给车轮。',
  aboutBody: '喜欢拍照，是想给日常留一个可以重返的入口。再看一张照片时，往往连那天的风、走过的路和当时的心情，也一起回来了。\n\n也喜欢骑行。在快门之外，沿着路继续向前，让新的风景成为下一次想记住的片刻。\n\n谢谢你来看这些照片，也读到这里。愿这些小小的记录，能陪你想起属于自己的某个当时。',
  authorName: '摄影日记', authorTagline: '在日常里停留，也向下一程出发。'
}
export const postTopics = { life: '生活片刻', photography: '摄影手记', cycling: '骑行路上', gear: '器材体验' } as const
