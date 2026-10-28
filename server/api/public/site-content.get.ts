import { getNotebookStore } from '../../utils/notebook'
export default defineEventHandler(event => {
  setHeader(event, 'Cache-Control', 'no-store')
  return getNotebookStore().getCopy()
})
