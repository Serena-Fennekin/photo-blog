const symbols: [RegExp,string,string][] = [
  [/🐱|😺|😸|😹|😻|😼|😽|🙀|😿|😾|🐈/u,'cat','猫'],
  [/🐶|🐕|🦮|🐩/u,'dog','小动物'],[/🚴|🚲|🚵/u,'bike','骑行'],
  [/🌿|🍃|🌱|🌳|🌲|🍂|🍁|☘/u,'leaf','草木'],[/🌸|🌷|🌹|🌺|🌻|🌼|🪷/u,'flower','花开'],
  [/🦐|🦞/u,'shrimp','水中生灵'],[/🐟|🐠|🐡/u,'fish','水中生灵'],
  [/🏞|⛰|🏔|🌄|🌅/u,'landscape','风景'],[/📷|📸|🎞/u,'camera','摄影']
]
const pictograph=/\p{Extended_Pictographic}/u
const segmenter=new Intl.Segmenter('zh-CN',{granularity:'grapheme'})
export function categoryPresentation(name:string):{text:string;icons:string[]} {
  const icons:string[]=[],words:string[]=[],names:string[]=[]
  for(const {segment} of segmenter.segment(name)) {
    if(!pictograph.test(segment)){words.push(segment);continue}
    const found=symbols.find(([pattern])=>pattern.test(segment))
    const icon=found?.[1]||'sparkles'
    if(!icons.includes(icon))icons.push(icon)
    names.push(found?.[2]||'随手记录')
  }
  return {text:words.join('').trim()||names[0]||name,icons:icons.slice(0,3)}
}
