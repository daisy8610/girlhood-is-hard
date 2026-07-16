// Google 授權完成後導回這裡：用 code 換 refresh_token，存到 google_calendar_tokens，
// 再導回網站首頁並帶上 ?calendar=connected 或 ?calendar=error。
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const siteUrl = Deno.env.get("SITE_URL") || "";

  function back(status) {
    return Response.redirect(`${siteUrl}?calendar=${status}`, 302);
  }

  if (!code) return back("error");

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");
  if (!clientId || !clientSecret || !redirectUri) return back("error");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();
  // Google 只有第一次同意（或帶 prompt=consent）才會給 refresh_token
  if (!tokenData.refresh_token) return back("error");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const { data: userData, error: userErr } = await supabase.auth.getUser(state);
  if (userErr || !userData.user) return back("error");

  const { error: upsertErr } = await supabase
    .from("google_calendar_tokens")
    .upsert({ user_id: userData.user.id, refresh_token: tokenData.refresh_token, updated_at: new Date().toISOString() });
  if (upsertErr) return back("error");

  return back("connected");
});
