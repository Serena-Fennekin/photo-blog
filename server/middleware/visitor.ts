import { getVisitor } from '../auth/visitor'
export default defineEventHandler(event => {
  const path = event.path.split('?')[0]
  // Establish the browser identity in the document response before parallel card requests.
  if (event.method === 'GET' && ['/', '/about', '/gallery'].includes(path || '')) getVisitor(event)
})
