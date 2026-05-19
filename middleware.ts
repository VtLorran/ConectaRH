import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // 1. Tenta pegar o token nos cookies do navegador
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Permitir acesso público à rota de preenchimento admissional do candidato (/admissao/[id])
  const isCandidateAdmissionPage = pathname.startsWith("/admissao/") && pathname !== "/admissao";

  // 2. Se NÃO tiver token e NÃO estiver na página de login ou na de preenchimento de admissão, manda para o /login
  if (!token && pathname !== "/login" && !isCandidateAdmissionPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. Se JÁ tiver token e tentar acessar o /login, manda de volta para a Home
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Permite o acesso se estiver tudo correto
  return NextResponse.next();
}

// 4. Configuração de quais rotas o middleware vai fiscalizar
export const config = {
  matcher: [
    /*
     * Protege todas as rotas internas, ignorando arquivos públicos e APIs:
     * - api (rotas de autenticação)
     * - _next/static e _next/image (arquivos internos do framework)
     * - Imagens da sua pasta public (NovoLogin.png, conectaRH_horizontal.png, favicon.ico)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|NovoLogin.png|conectaRH_horizontal.png).*)",
  ],
};