import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware (edge): solo comprueba la PRESENCIA de la cookie de sesión.
// La validación real (firma + DB + must_change_password) ocurre en las
// rutas API y en el guard del cliente. No importamos lib/auth aquí porque
// usa pg/bcrypt (node-only).
const SESSION_COOKIE = "ks_session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl; // sin basePath
  const isPublic = pathname === "/login" || pathname.startsWith("/api/auth");
  const hasSession = req.cookies.has(SESSION_COOKIE);

  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (hasSession && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/alimentos";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js).*)",
  ],
};
