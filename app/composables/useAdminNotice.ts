import { watch, type Ref } from 'vue'
export type AdminNotice = { id:string; message:string; tone:'success'|'error' }
export function useAdminNotice() {
  const notice = useState<AdminNotice|null>('admin-notice',()=>null)
  const show = (message:string,tone:AdminNotice['tone']='success') => {
    if(message.trim()) notice.value={id:crypto.randomUUID(),message,tone}
  }
  const close = (id?:string) => { if(!id||notice.value?.id===id)notice.value=null }
  return {notice,show,close}
}
export function useAdminFeedback(message:Ref<string>,error?:Ref<string>) {
  const notices=useAdminNotice()
  watch(message,value=>{if(value)notices.show(value)})
  if(error)watch(error,value=>{if(value)notices.show(value,'error')})
}
