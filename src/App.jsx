import React, { useState, useEffect, useMemo } from "react";
import { supa } from "./lib/supabaseClient";
import { download, toCSV } from "./lib/format";
import { BACKUP_LABELS } from "./lib/backup";
import {
  fetchAll, insertOne, updateOne, deleteOne, bulkInsert, deleteAllData, getProviderCount,
} from "./lib/db";

import { AuthScreen } from "./components/AuthScreen";
import { Overview } from "./components/Overview";
import { SpendingTab } from "./components/SpendingTab";
import { QuotesTab } from "./components/QuotesTab";
import { NotesTab } from "./components/NotesTab";
import { SettingsPage } from "./components/SettingsPage";

const DEFAULT_SETTINGS = { cap: 50000 };

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700;900&family=Noto+Sans+TC:wght@300;400;500;700&family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
  :root {
    /* 字級：全站統一從這裡調整 */
    --fs-xs: 12px;  /* 日期、備註、小標籤 */
    --fs-sm: 13px;  /* 按鈕、次要文字 */
    --fs-md: 14px;  /* 一般內文、列表 */
    --fs-lg: 15px;  /* 金額、重點文字 */
    --fs-xl: 16px;  /* 輸入框、小標題 */
    --fs-2xl: 18px; /* 區塊標題 */
    --fs-3xl: 21px; /* 頁面標題、導覽圖示 */
    --fs-4xl: 26px; /* 大數字、登入頁標題 */
    /* 圓角 */
    --r-sm: 8px; --r-md: 12px; --r-lg: 16px;
    /* 主題色：全站統一從這裡調整 */
    --ed-bg: #fdfcfc; --ed-surface: #f5f3f1; --ed-ink: #000000;
    --ed-smoke: #777169; --ed-ash: #7d776f; --ed-stone: #ebe8e4;
  }
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width:8px; height:8px; }
  ::-webkit-scrollbar-thumb { background:var(--ed-stone); border-radius:8px; }
  .mono { font-family:'IBM Plex Mono', monospace; }
  .serif { font-family:'Noto Serif TC', serif; }
  .ed-sans { font-family:'Inter','Noto Sans TC',sans-serif; }
  button { font-family: inherit; cursor:pointer; }
  input, select, textarea { font-family: inherit; }
  .row-hover:hover { background:var(--ed-surface); }
  .iconbtn { border:none; background:transparent; color:var(--ed-ash); font-size:var(--fs-md); padding:4px 6px; border-radius:6px; }
  .iconbtn:hover { background:var(--ed-surface); color:var(--ed-ink); }
  input[type="date"], input[type="time"] { color-scheme: light; }
  input[type="date"]::-webkit-calendar-picker-indicator, input[type="time"]::-webkit-calendar-picker-indicator {
    cursor: pointer; border-radius: 6px; padding: 3px; margin-left: 4px;
  }
  input[type="date"]::-webkit-calendar-picker-indicator:hover, input[type="time"]::-webkit-calendar-picker-indicator:hover { background:var(--ed-surface); }
  @keyframes printIn { from { opacity:0; transform: translateY(6px);} to {opacity:1; transform:none;} }
  @media (max-width: 640px) { .hide-sm { display: none; } }

  /* ---- RWD 外殼：手機底部導覽 / 桌機側邊欄，正式版重繪時逐頁套用新視覺 ---- */
  .app-shell { max-width: 560px; margin: 0 auto; min-height: 100vh; position: relative; }
  .app-sidebar { display: none; }
  .app-bottom-nav { display: flex; }
  .hide-md-up { display: block; }
  @media (min-width: 900px) {
    .app-shell { max-width: 1120px; display: flex; align-items: flex-start; }
    .app-sidebar { display: flex; }
    .app-bottom-nav { display: none; }
    .app-main-col { flex: 1; min-width: 0; }
    .hide-md-up { display: none; }
    .content-col { max-width: 760px; margin: 0 auto; padding: 32px 24px !important; }
  }
`;

export default function App() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState("overview");

  const [spending, setSpending] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [notes, setNotes] = useState([]);
  const [vouchers, setVouchers] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [providerCount, setProviderCount] = useState(0);

  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState(null);
  const [toast, setToast] = useState(null);
  const [missingKinds, setMissingKinds] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);

  useEffect(() => {
    if (!supa) return;
    supa.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supa.auth.onAuthStateChange((_e, s) => setSession(s || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function loadData() {
    setReady(false); setLoadErr(null);
    try {
      const d = await fetchAll();
      setSpending(d.spending); setQuotes(d.quotes);
      setNotes(d.notes); setVouchers(d.vouchers);
      setSettings({ cap: d.cap });
      setProviderCount(getProviderCount());

      const missing = [];
      if (d.spending.length === 0) missing.push("spending");
      if (d.quotes.length === 0) missing.push("quotes");
      if (d.notes.length === 0) missing.push("notes");
      if (d.vouchers.length === 0) missing.push("vouchers");
      setMissingKinds(missing);
      setReady(true);
    } catch (ex) {
      setLoadErr(ex.message || "讀取資料失敗");
      setReady(true);
    }
  }

  useEffect(() => { if (session) loadData(); }, [session]);

  useEffect(() => {
    if (!session) return;
    supa.from("google_calendar_tokens").select("user_id").maybeSingle()
      .then(({ data }) => setGoogleLinked(!!data))
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("calendar");
    if (!status) return;
    if (status === "connected") { setGoogleLinked(true); flash("已連結 Google 日曆"); }
    else if (status === "error") flash("連結 Google 日曆失敗，請重試");
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  function flash(msg) { setToast(msg); setTimeout(() => setToast(null), 2600); }

  const mk = (kind, setter) => ({
    add: async (r) => {
      try {
        const saved = await insertOne(kind, r);
        setter((prev) => [saved, ...prev]);
        setProviderCount(getProviderCount());
        flash("已新增");
      } catch (ex) { flash("新增失敗：" + (ex.message || "")); }
    },
    update: async (id, patch) => {
      let merged;
      setter((prev) => prev.map((r) => {
        if (r.id !== id) return r;
        merged = { ...r, ...patch };
        return merged;
      }));
      try {
        await updateOne(kind, id, merged);
        setProviderCount(getProviderCount());
        flash("已更新");
      } catch (ex) { flash("更新失敗：" + (ex.message || "")); loadData(); }
    },
    del: async (id) => {
      setter((prev) => prev.filter((r) => r.id !== id));
      try { await deleteOne(kind, id); flash("已刪除"); }
      catch (ex) { flash("刪除失敗：" + (ex.message || "")); loadData(); }
    },
  });

  const spendH = mk("spending", setSpending);
  const quoteH = mk("quotes", setQuotes);
  const noteH = mk("notes", setNotes);
  const voucherH = mk("vouchers", setVouchers);

  const totals = useMemo(() => {
    const now = new Date();
    const ytdStart = new Date(now.getFullYear(), 0, 1);
    let ytd = 0, all = 0;
    const byMain = {};
    spending.forEach((r) => {
      const amt = r.amount || 0;
      all += amt;
      const d = r.date ? new Date(r.date) : null;
      if (d && d >= ytdStart) ytd += amt;
      if (r.main) byMain[r.main] = (byMain[r.main] || 0) + amt;
    });
    return { ytd, all, byMain };
  }, [spending]);

  const backupPayload = () => ({ exportedAt: new Date().toISOString(), spending, quotes, notes, vouchers });

  function exportJSON() {
    const ok = download("當女生好難-備份-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(backupPayload(), null, 2), "application/json");
    flash(ok ? "已下載 JSON 備份" : "下載失敗");
  }

  function exportCSV() {
    const csv = toCSV(spending, [
      { key: "date", label: "日期" }, { key: "main", label: "主分類" }, { key: "sub", label: "子分類" },
      { key: "item", label: "項目" }, { key: "place", label: "地點" }, { key: "amount", label: "金額" }, { key: "note", label: "備註" },
    ]);
    const ok = download("消費紀錄-" + new Date().toISOString().slice(0, 10) + ".csv", csv, "text/csv;charset=utf-8");
    flash(ok ? "已下載 CSV" : "下載失敗");
  }

  async function replaceAllWith(payload, msg) {
    setSeeding(true);
    try {
      await deleteAllData();
      await bulkInsert("spending", payload.spending);
      await bulkInsert("quotes", payload.quotes);
      await bulkInsert("notes", payload.notes);
      await bulkInsert("vouchers", payload.vouchers);
      await loadData();
      flash(msg);
    } catch (ex) {
      flash("操作失敗：" + (ex.message || ""));
      loadData();
    } finally { setSeeding(false); }
  }

  function applyImport(payload) {
    download("還原前自動備份-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(backupPayload(), null, 2), "application/json");
    replaceAllWith(payload, "已還原備份（還原前的資料也自動下載了一份）");
  }

  async function clearAllData_() {
    download("清空前自動備份-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(backupPayload(), null, 2), "application/json");
    setSeeding(true);
    try {
      await deleteAllData();
      await loadData();
      flash("已清空所有資料（清空前的資料也自動下載了一份）");
    } catch (ex) {
      flash("操作失敗：" + (ex.message || ""));
      loadData();
    } finally { setSeeding(false); }
  }

  async function saveCap(cap) {
    setSettings((prev) => ({ ...prev, cap }));
    try {
      const { data: u } = await supa.auth.getUser();
      const { error } = await supa.from("profiles").upsert({ id: u.user.id, annual_budget_cap: cap });
      if (error) throw error;
      flash("已更新預算上限");
    } catch (ex) { flash("儲存失敗：" + (ex.message || "")); }
  }

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

  async function addExpenseItem(r) {
    await spendH.add(r);
    if (r.syncCalendar) syncToCalendar(r);
  }

  async function logout() { await supa.auth.signOut(); }

  // ---------- 畫面 ----------
  if (!supa) {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <div className="ed-sans" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ed-bg)", color: "var(--ed-ink)", padding: 24, textAlign: "center", lineHeight: 1.8 }}>
          還沒設定 Supabase 連線。<br />請打開網站資料夾裡的 config.js，填入你的 Project URL 和 anon key。
        </div>
      </>
    );
  }
  if (session === undefined) {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <div className="serif" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ed-bg)", color: "var(--ed-smoke)" }}>存摺開啟中…</div>
      </>
    );
  }
  if (session === null) return (<><style>{GLOBAL_STYLES}</style><AuthScreen /></>);
  if (!ready) {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <div className="serif" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--ed-bg)", color: "var(--ed-smoke)" }}>資料同步中…</div>
      </>
    );
  }

  const counts = { spending: spending.length, quotes: quotes.length, notes: notes.length, vouchers: vouchers.length };
  const NAV = [
    { key: "overview", label: "總覽", icon: "📔" },
    { key: "spending", label: "紀錄", icon: "🧾" },
    { key: "quotes", label: "詢價", icon: "💉" },
    { key: "notes", label: "筆記", icon: "🩺" },
    { key: "settings", label: "設定", icon: "⚙️" },
  ];

  function goTab(k) {
    setTab(k);
    try { window.scrollTo({ top: 0 }); } catch (e) {}
  }

  const pageTitle = tab === "overview" ? "總覽" : tab === "spending" ? "消費紀錄" : tab === "quotes" ? "詢價比較"
    : tab === "notes" ? "筆記區" : "設定";

  return (
    <div className="ed-sans" style={{ minHeight: "100vh", background: "var(--ed-bg)", color: "var(--ed-ink)" }}>
      <style>{GLOBAL_STYLES}</style>

      <div className="app-shell" style={{ paddingBottom: "calc(76px + env(safe-area-inset-bottom, 0px))" }}>
        <nav className="app-sidebar" style={{
          flexDirection: "column", width: 220, flexShrink: 0, padding: "32px 16px",
          borderRight: "1px solid var(--ed-stone)", position: "sticky", top: 0, height: "100vh", gap: 4,
        }}>
          <div style={{ marginBottom: 28, paddingLeft: 4 }}>
            <div style={{ fontSize: "var(--fs-xs)", letterSpacing: 2, color: "var(--ed-ash)", fontFamily: "'IBM Plex Mono',monospace" }}>PASSBOOK</div>
            <div className="serif" style={{ fontSize: "var(--fs-3xl)", fontWeight: 700 }}>當女生好難</div>
          </div>
          {NAV.map((n) => (
            <button
              key={n.key} onClick={() => goTab(n.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10, textAlign: "left",
                border: "none", background: tab === n.key ? "var(--ed-surface)" : "transparent",
                borderRadius: 9999, padding: "9px 14px", fontSize: "var(--fs-lg)",
                fontWeight: tab === n.key ? 600 : 400, color: "var(--ed-ink)",
              }}
            >
              <span style={{ fontSize: "var(--fs-2xl)" }}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="app-main-col">
          <div style={{
            background: "var(--ed-bg)", color: "var(--ed-ink)", borderBottom: "1px solid var(--ed-stone)",
            padding: "calc(14px + env(safe-area-inset-top, 0px)) 18px 12px", position: "sticky", top: 0, zIndex: 20,
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
          }}>
            <div className="hide-md-up">
              <span className="serif" style={{ fontSize: "var(--fs-2xl)", fontWeight: 700, letterSpacing: 1 }}>當女生好難</span>
              <span style={{ fontSize: "var(--fs-xs)", letterSpacing: 2, opacity: 0.6, marginLeft: 8, fontFamily: "'IBM Plex Mono',monospace" }}>PASSBOOK</span>
            </div>
            <div style={{ fontSize: "var(--fs-md)", color: "var(--ed-smoke)" }}>{pageTitle}</div>
          </div>

        <div className="content-col" style={{ padding: "16px 14px 24px" }}>
          {loadErr && (
            <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: "var(--r-md)", background: "var(--ed-surface)", color: "var(--ed-ink)", fontSize: "var(--fs-md)", lineHeight: 1.7 }}>
              ⚠️ {loadErr}
              <button onClick={loadData} style={{ marginLeft: 8, border: "none", background: "none", color: "var(--ed-ink)", textDecoration: "underline", fontSize: "var(--fs-md)" }}>重試</button>
              {/vouchers|annual_budget_cap|category|tags/.test(loadErr) && (
                <div style={{ marginTop: 6, fontSize: "var(--fs-sm)" }}>看起來 PATCH.sql 還沒跑完，請到 Supabase 的 SQL Editor 執行一次。</div>
              )}
            </div>
          )}
          {missingKinds.length > 0 && !seeding && (
            <div style={{ marginBottom: 14, padding: "14px 16px", borderRadius: "var(--r-lg)", background: "#fff", border: "1px solid var(--ed-stone)", fontSize: "var(--fs-lg)", lineHeight: 1.7 }}>
              目前雲端還缺這些資料：<strong>{missingKinds.map((k) => BACKUP_LABELS[k]).join("、")}</strong>
              <div style={{ marginTop: 8, fontSize: "var(--fs-md)", color: "var(--ed-smoke)" }}>
                請到 Supabase SQL Editor 執行一次性匯入腳本（不經過這個網頁），或到「設定」用 JSON 備份匯入。
              </div>
            </div>
          )}
          {seeding && <div style={{ marginBottom: 14, fontSize: "var(--fs-md)", color: "var(--ed-smoke)" }}>資料寫入中，請稍等…</div>}

          {tab === "overview" && (
            <Overview totals={totals} cap={settings.cap} spending={spending} vouchers={vouchers} voucherH={voucherH} />
          )}
          {tab === "spending" && <SpendingTab data={spending} h={spendH} onAdd={addExpenseItem} />}
          {tab === "quotes" && <QuotesTab data={quotes} h={quoteH} />}
          {tab === "notes" && <NotesTab data={notes} h={noteH} />}
          {tab === "settings" && (
            <SettingsPage
              settings={settings} saveCap={saveCap} exportJSON={exportJSON} exportCSV={exportCSV}
              applyImport={applyImport} clearAllData={clearAllData_} counts={counts} providerCount={providerCount}
              userEmail={session.user && session.user.email} logout={logout}
              googleLinked={googleLinked} connectGoogleCalendar={connectGoogleCalendar} disconnectGoogleCalendar={disconnectGoogleCalendar}
            />
          )}
        </div>
        </div>

        <div className="app-bottom-nav" style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 560, zIndex: 30,
          background: "#fff", borderTop: "1px solid var(--ed-stone)",
          padding: "6px 0 calc(8px + env(safe-area-inset-bottom, 0px))",
        }}>
          {NAV.map((n) => (
            <button
              key={n.key} onClick={() => goTab(n.key)}
              style={{
                flex: 1, border: "none", background: "transparent", padding: "6px 0 2px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                color: tab === n.key ? "var(--ed-ink)" : "var(--ed-ash)",
              }}
            >
              <span style={{ fontSize: "var(--fs-3xl)", filter: tab === n.key ? "none" : "grayscale(1) opacity(0.6)" }}>{n.icon}</span>
              <span style={{ fontSize: "var(--fs-xs)", fontWeight: tab === n.key ? 600 : 400 }}>{n.label}</span>
            </button>
          ))}
        </div>

        {toast && (
          <div style={{
            position: "fixed", bottom: "calc(86px + env(safe-area-inset-bottom, 0px))", left: "50%", transform: "translateX(-50%)",
            background: "var(--ed-ink)", color: "#fff", padding: "10px 20px", borderRadius: 9999, fontSize: "var(--fs-md)", maxWidth: "85%",
            animation: "printIn .2s ease-out", zIndex: 50, textAlign: "center",
          }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
