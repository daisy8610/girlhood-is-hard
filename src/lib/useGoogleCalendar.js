import { useState, useEffect } from "react";
import { supa } from "./supabaseClient";

// Google 日曆：連結狀態、連結/解除、同步一筆消費紀錄
export function useGoogleCalendar({ session, flash }) {
  const [googleLinked, setGoogleLinked] = useState(false);

  useEffect(() => {
    if (!session) return;
    supa.from("google_calendar_tokens").select("user_id").maybeSingle()
      .then(({ data }) => setGoogleLinked(!!data))
      .catch(() => {});
  }, [session]);

  // 從 Google 授權頁導回來時，網址會帶 ?calendar=connected 或 error
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("calendar");
    if (!status) return;
    if (status === "connected") { setGoogleLinked(true); flash("已連結 Google 日曆"); }
    else if (status === "error") flash("連結 Google 日曆失敗，請重試");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  async function connectGoogleCalendar() {
    const { data } = await supa.auth.getSession();
    const token = data.session && data.session.access_token;
    if (!token) return;
    window.location.href = `${window.SUPA_CFG.url}/functions/v1/google-oauth-start?state=${encodeURIComponent(token)}`;
  }

  async function disconnectGoogleCalendar() {
    const { data: u } = await supa.auth.getUser();
    try {
      const { error } = await supa.from("google_calendar_tokens").delete().eq("user_id", u.user.id);
      if (error) throw error;
      setGoogleLinked(false);
      flash("已解除 Google 日曆連結");
    } catch (ex) { flash("解除失敗：" + (ex.message || "")); }
  }

  async function syncToCalendar(r) {
    if (!googleLinked || !r.date) return;
    try {
      const { data, error } = await supa.functions.invoke("google-calendar-sync", {
        body: { item: r.item, date: r.date, time: r.time, place: r.place, note: r.note, amount: r.amount },
      });
      if (error) { flash("同步日曆失敗：" + (error.message || "")); return; }
      if (data && data.ok) { flash("已同步到 Google 日曆"); return; }
      if (data && data.reason === "refresh_failed") {
        const { data: u } = await supa.auth.getUser();
        if (u.user) await supa.from("google_calendar_tokens").delete().eq("user_id", u.user.id);
        setGoogleLinked(false);
        flash("Google 日曆授權已過期，請重新連結");
        return;
      }
      if (data) flash("同步日曆失敗：" + (data.reason || "未知原因"));
    } catch (ex) { flash("同步日曆失敗：" + (ex.message || "")); }
  }

  return { googleLinked, connectGoogleCalendar, disconnectGoogleCalendar, syncToCalendar };
}
