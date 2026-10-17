// Next.js 16 で middleware.ts から proxy.ts に名前が変わった。今は全リクエストのログを出すだけ。
import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/T/, ' ').replace(/\..+/, '');
  console.log(`[${timestamp}] ${request.method} ${request.nextUrl.pathname}`);
  return NextResponse.next()
}

// ログを出力するパスを制限 (静的ファイルなどを除外したい場合に使用)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
