import { liteDetailHandler } from '../../shared'

type Params = { params: Promise<{ slug: string }> }

export async function GET(request: Request, { params }: Params): Promise<Response> {
  const { slug } = await params
  return liteDetailHandler(request, 'blog', slug)
}