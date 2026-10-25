import { getContentRepository } from '../../repositories'
import { getHomePageModel } from '../../services/public-content-service'

export default defineEventHandler(() => getHomePageModel(getContentRepository()))
