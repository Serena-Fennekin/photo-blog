import { defaultSiteCopy } from '#shared/notebook'
import type { SiteCopy } from '../../shared/types/notebook'
export const useSiteCopy = () => useFetch<SiteCopy>('/api/public/site-content', { key: 'site-copy', default: () => ({ ...defaultSiteCopy }) })
