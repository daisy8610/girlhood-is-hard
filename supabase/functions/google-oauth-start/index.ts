// 產生 Google OAuth 授權連結並導向過去。
// state 帶的是使用者當下的 Supabase access token，callback 會用它反查是哪個使用者。
Deno.serve((req) => {
  const url = new URL(req.url);
  const state = url.searchParams.get("state") || "";
  if (!state) {
    return new Response("缺少 state（登入狀態），請從設定頁點連結按鈕進來", { status: 400 });
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");
  if (!clientId || !redirectUri) {
    return new Response("Edge Function 尚未設定 GOOGLE_CLIENT_ID / GOOGLE_REDIRECT_URI", { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
    state,
  });

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, 302);
});
