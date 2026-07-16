// 前端呼叫這支，帶著使用者的登入 JWT（supabase.functions.invoke 會自動帶）。
// 用存好的 refresh_token 換一個新的 access_token，然後在使用者的主要日曆新增一筆全天事件。
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405 });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  }

  const { data: tokenRow } = await supabase
    .from("google_calendar_tokens")
    .select("refresh_token")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (!tokenRow) {
    // 還沒連結 Google 日曆，靜默略過，不算錯誤
    return new Response(JSON.stringify({ ok: false, reason: "not_linked" }), { status: 200 });
  }

  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokenRow.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const refreshData = await refreshRes.json();
  if (!refreshData.access_token) {
    return new Response(JSON.stringify({ ok: false, reason: "refresh_failed" }), { status: 200 });
  }

  let body;
  try { body = await req.json(); } catch { body = {}; }
  const { item, date, place, note } = body;
  if (!date) return new Response(JSON.stringify({ error: "missing_date" }), { status: 400 });

  const eventRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${refreshData.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: item || "（未命名計畫）",
      location: place || undefined,
      description: note || undefined,
      start: { date },
      end: { date },
    }),
  });
  const eventData = await eventRes.json();
  if (!eventRes.ok) {
    return new Response(JSON.stringify({ ok: false, reason: "calendar_insert_failed", detail: eventData }), { status: 200 });
  }

  return new Response(JSON.stringify({ ok: true, eventId: eventData.id }), { status: 200 });
});
