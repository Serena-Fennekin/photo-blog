import { NotebookStore } from '../db/notebook-store'
import { getJournalStore } from '../db/journal-store'
let store: NotebookStore | undefined
export const getNotebookStore = () => store ??= new NotebookStore(getJournalStore().db)
