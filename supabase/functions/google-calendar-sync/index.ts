// 前端呼叫這支，帶著使用者的登入 JWT（supabase.functions.invoke 會自動帶）。
// 用存好的 refresh_token 換一個新的 access_token，然後在使用者的主要日曆新增一筆全天事件。
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "unauthorized" }, 401);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

  const { data: tokenRow } = await supabase
    .from("google_calendar_tokens")
    .select("refresh_token")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (!tokenRow) {
    // 還沒連結 Google 日曆，靜默略過，不算錯誤
    return json({ ok: false, reason: "not_linked" });
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
    return json({ ok: false, reason: "refresh_failed", detail: refreshData });
  }

  let body;
  try { body = await req.json(); } catch { body = {}; }
  const { item, date, time, place, note } = body;
  if (!date) return json({ error: "missing_date" }, 400);

  // 有填時間就開一個帶時區的 1 小時行程，沒填時間維持全天事件
  const timeZone = "Asia/Taipei";
  let timeFields = { start: { date }, end: { date } };
  if (time) {
    const [y, mo, d] = date.split("-").map(Number);
    const [h, mi] = time.split(":").map(Number);
    const endMs = Date.UTC(y, mo - 1, d, h, mi) + 60 * 60 * 1000;
    const end = new Date(endMs);
    const pad = (n) => String(n).padStart(2, "0");
    const endStr = `${end.getUTCFullYear()}-${pad(end.getUTCMonth() + 1)}-${pad(end.getUTCDate())}T${pad(end.getUTCHours())}:${pad(end.getUTCMinutes())}:00`;
    timeFields = {
      start: { dateTime: `${date}T${time}:00`, timeZone },
      end: { dateTime: endStr, timeZone },
    };
  }

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
      ...timeFields,
    }),
  });
  const eventData = await eventRes.json();
  if (!eventRes.ok) {
    return json({ ok: false, reason: "calendar_insert_failed", detail: eventData });
  }

  return json({ ok: true, eventId: eventData.id });
});
