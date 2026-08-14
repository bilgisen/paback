import { liteListHandler } from '../shared'

export async function GET(request: Request): Promise<Response> {
  return liteListHandler(request, 'blog')
}