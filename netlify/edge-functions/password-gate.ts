import type { Config, Context } from "@netlify/edge-functions";

const COOKIE_NAME = "site_auth";
const LOGIN_PATH = "/_auth/login";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export default async (req: Request, context: Context) => {
  const password = Netlify.env.get("SITE_PASSWORD");
  if (!password) return context.next();

  const url = new URL(req.url);

  if (req.method === "POST" && url.pathname === LOGIN_PATH) {
    const form = await req.formData();
    const submitted = String(form.get("password") ?? "");
    const fromRaw = String(form.get("from") ?? "/");
    const from = fromRaw.startsWith("/") && !fromRaw.startsWith("//") ? fromRaw : "/";
    if (submitted === password) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: from,
          "Set-Cookie": `${COOKIE_NAME}=${encodeURIComponent(password)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`,
        },
      });
    }
    return loginPage(from, true);
  }

  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)site_auth=([^;]+)/);
  if (match && decodeURIComponent(match[1]) === password) {
    return context.next();
  }

  return loginPage(url.pathname + url.search, false);
};

function loginPage(from: string, error: boolean): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Password required</title>
<style>
  body { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background: #0b0b0c; color: #f5f5f5; display: grid; place-items: center; min-height: 100vh; margin: 0; }
  form { background: #18181b; padding: 1.75rem; border-radius: 12px; min-width: 300px; box-shadow: 0 10px 40px rgba(0,0,0,0.4); }
  h1 { margin: 0 0 1rem; font-size: 1.0625rem; font-weight: 600; }
  input[type=password] { width: 100%; box-sizing: border-box; padding: 0.625rem 0.75rem; border-radius: 8px; border: 1px solid #27272a; background: #0b0b0c; color: #f5f5f5; font-size: 1rem; }
  input[type=password]:focus { outline: 2px solid #71717a; outline-offset: 1px; }
  button { margin-top: 0.75rem; width: 100%; padding: 0.625rem; border-radius: 8px; border: 0; background: #f5f5f5; color: #0b0b0c; font-weight: 600; cursor: pointer; font-size: 0.9375rem; }
  .err { color: #f87171; font-size: 0.8125rem; margin-top: 0.625rem; }
</style>
</head>
<body>
<form method="POST" action="${LOGIN_PATH}">
  <h1>Enter password</h1>
  <input type="password" name="password" autofocus required autocomplete="current-password" />
  <input type="hidden" name="from" value="${escapeHtml(from)}" />
  <button type="submit">Continue</button>
  ${error ? '<div class="err">Wrong password.</div>' : ""}
</form>
</body>
</html>`;
  return new Response(html, {
    status: 401,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return c;
    }
  });
}

export const config: Config = {
  path: "/*",
};
