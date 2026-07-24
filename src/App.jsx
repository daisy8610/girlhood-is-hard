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
import { BudgetTab } from "./components/BudgetTab";
import { QuotesTab } from "./components/QuotesTab";
import { NotesTab } from "./components/NotesTab";
import { MoreMenu, SubPage } from "./components/MoreMenu";
import { SettingsPage } from "./components/SettingsPage";

const DEFAULT_SETTINGS = { cap: 50000, strategy: "" };

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700;900&family=Noto+Sans+TC:wght@400;500;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
  * { box-sizing: border-box; }
  ::-webkit-scrollbar { width:8px; height:8px; }
  ::-webkit-scrollbar-thumb { background:#E8CFD2; border-radius:8px; }
  .mono { font-family:'IBM Plex Mono', monospace; }
  .serif { font-family:'Noto Serif TC', serif; }
  button { font-family: inherit; cursor:pointer; }
  input, select, textarea { font-family: inherit; }
  .row-hover:hover { background:#FFF9F6; }
  .iconbtn { border:none; background:transparent; color:#B896A0; font-size:13px; padding:4px 6px; border-radius:6px; }
  .iconbtn:hover { background:#FBE3E9; color:#AD455E; }
  .menu-item:active { background:#FBE3E9; }
  @keyframes printIn { from { opacity:0; transform: translateY(6px);} to {opacity:1; transform:none;} }
  @media (max-width: 640px) { .hide-sm { display: none; } }
`;

export default function App() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState("overview");
  const [moreView, setMoreView] = useState("menu");

  const [spending, setSpending] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [budget, setBudget] = useState([]);
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
      setSpending(d.spending); setQuotes(d.quotes); setBudget(d.budget);
      setNotes(d.notes); setVouchers(d.vouchers);
      setSettings({ cap: d.cap, strategy: d.strategy });
      setProviderCount(getProviderCount());

      const missing = [];
      if (d.spending.length === 0) missing.push("spending");
      if (d.quotes.length === 0) missing.push("quotes");
      if (d.budget.length === 0) missing.push("budget");
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
  const budgetH = mk("budget", setBudget);
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

  const budgetTotals = useMemo(() => {
    const planned = budget.reduce((s, r) => s + (r.budget || 0), 0);
    const completed = budget.filter((r) => r.status === "已完成");
    const done = completed.reduce((s, r) => s + (r.actual || r.budget || 0), 0);
    const doneBudget = completed.reduce((s, r) => s + (r.budget || 0), 0);
    return { planned, done, doneBudget, cap: settings.cap || 50000 };
  }, [budget, settings]);

  const backupPayload = () => ({ exportedAt: new Date().toISOString(), spending, quotes, budget, notes, vouchers });

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
      await bulkInsert("budget", payload.budget);
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

  async function convertToExpense({ main = "", sub = "", item, place = "", amount, note = "" }) {
    await spendH.add({
      date: new Date().toISOString().slice(0, 10),
      main, sub, item: item || "（未命名）", place, amount, note,
    });
  }

  function convertQuoteToExpense(q) {
    return convertToExpense({
      main: "醫美", sub: q.category, item: q.product || q.category, place: q.clinic, amount: q.price, note: q.note,
    });
  }

  function convertBudgetToExpense(b) {
    return convertToExpense({
      main: b.main, sub: b.bucket, item: b.item, place: b.place,
      amount: b.actual != null ? b.actual : b.budget, note: b.note,
    });
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

  async function syncBudgetToCalendar(r) {
    if (!googleLinked || !r.date) return;
    try {
      const { data, error } = await supa.functions.invoke("google-calendar-sync", {
        body: { item: r.item, date: r.date, place: r.place, note: r.note },
      });
      if (error) { flash("同步日曆失敗：" + (error.message || "")); return; }
      if (data && data.ok) flash("已同步到 Google 日曆");
      else if (data) flash("同步日曆失敗：" + (data.reason || "未知原因"));
    } catch (ex) { flash("同步日曆失敗：" + (ex.message || "")); }
  }

  async function addBudgetItem(r) {
    await budgetH.add(r);
    syncBudgetToCalendar(r);
  }

  async function saveStrategy(strategy) {
    setSettings((prev) => ({ ...prev, strategy }));
    try {
      const { data: u } = await supa.auth.getUser();
      const { error } = await supa.from("profiles").upsert({ id: u.user.id, annual_strategy: strategy });
      if (error) throw error;
      flash("已更新年度策略");
    } catch (ex) { flash("儲存失敗：" + (ex.message || "")); }
  }

  async function logout() { await supa.auth.signOut(); }

  // ---------- 畫面 ----------
  if (!supa) {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FBF3EE", fontFamily: "'Noto Sans TC',sans-serif", color: "#AD455E", padding: 24, textAlign: "center", lineHeight: 1.8 }}>
          還沒設定 Supabase 連線。<br />請打開網站資料夾裡的 config.js，填入你的 Project URL 和 anon key。
        </div>
      </>
    );
  }
  if (session === undefined) {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FBF3EE", fontFamily: "'Noto Serif TC',serif", color: "#B2607A" }}>存摺開啟中…</div>
      </>
    );
  }
  if (session === null) return (<><style>{GLOBAL_STYLES}</style><AuthScreen /></>);
  if (!ready) {
    return (
      <>
        <style>{GLOBAL_STYLES}</style>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FBF3EE", fontFamily: "'Noto Serif TC',serif", color: "#B2607A" }}>資料同步中…</div>
      </>
    );
  }

  const counts = { spending: spending.length, quotes: quotes.length, budget: budget.length, notes: notes.length, vouchers: vouchers.length };
  const NAV = [
    { key: "overview", label: "總覽", icon: "📔" },
    { key: "spending", label: "紀錄", icon: "🧾" },
    { key: "budget", label: "預算", icon: "🎯" },
    { key: "quotes", label: "詢價", icon: "💉" },
    { key: "more", label: "更多", icon: "☰" },
  ];

  function goTab(k) {
    setTab(k);
    if (k === "more") setMoreView("menu");
    try { window.scrollTo({ top: 0 }); } catch (e) {}
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7E9E3", color: "#2B2420", fontFamily: "'Noto Sans TC', sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>

      <div style={{
        maxWidth: 560, margin: "0 auto", minHeight: "100vh", background: "#FBF3EE",
        boxShadow: "0 0 40px rgba(90,60,50,0.12)", position: "relative",
        paddingBottom: "calc(76px + env(safe-area-inset-bottom, 0px))",
      }}>
        <div style={{
          background: "linear-gradient(135deg,#C25B72,#D9718A 70%)", color: "#FFF3F6",
          padding: "calc(14px + env(safe-area-inset-top, 0px)) 18px 12px", position: "sticky", top: 0, zIndex: 20,
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
        }}>
          <div>
            <span className="serif" style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>當女生好難</span>
            <span style={{ fontSize: 10, letterSpacing: 2, opacity: 0.8, marginLeft: 8, fontFamily: "'IBM Plex Mono',monospace" }}>PASSBOOK</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            {tab === "overview" ? "總覽" : tab === "spending" ? "消費紀錄" : tab === "budget" ? "預算計畫" : tab === "quotes" ? "詢價比較"
              : moreView === "notes" ? "筆記區" : moreView === "settings" ? "設定" : "更多"}
          </div>
        </div>

        <div style={{ padding: "16px 14px 24px" }}>
          {loadErr && (
            <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 8, background: "#D9718A14", border: "1px solid #D9718A55", color: "#AD455E", fontSize: 13, lineHeight: 1.7 }}>
              ⚠️ {loadErr}
              <button onClick={loadData} style={{ marginLeft: 8, border: "none", background: "none", color: "#AD455E", textDecoration: "underline", fontSize: 13 }}>重試</button>
              {/budget_plans|vouchers|annual_budget_cap|category|tags/.test(loadErr) && (
                <div style={{ marginTop: 6, fontSize: 12 }}>看起來 PATCH.sql 還沒跑完，請到 Supabase 的 SQL Editor 執行一次。</div>
              )}
            </div>
          )}
          {missingKinds.length > 0 && !seeding && (
            <div style={{ marginBottom: 14, padding: "14px 16px", borderRadius: 10, background: "#FFFCFA", border: "1px solid #F3DCDF", fontSize: 13.5, lineHeight: 1.7 }}>
              目前雲端還缺這些資料：<strong>{missingKinds.map((k) => BACKUP_LABELS[k]).join("、")}</strong>
              <div style={{ marginTop: 8, fontSize: 12.5, color: "#A88690" }}>
                請到 Supabase SQL Editor 執行一次性匯入腳本（不經過這個網頁），或到「更多 → 設定」用 JSON 備份匯入。
              </div>
            </div>
          )}
          {seeding && <div style={{ marginBottom: 14, fontSize: 13, color: "#B2607A" }}>資料寫入中，請稍等…</div>}

          {tab === "overview" && (
            <Overview totals={totals} budgetTotals={budgetTotals} spending={spending} budget={budget} vouchers={vouchers} voucherH={voucherH} />
          )}
          {tab === "spending" && <SpendingTab data={spending} h={spendH} />}
          {tab === "budget" && <BudgetTab data={budget} h={budgetH} strategy={settings.strategy} onConvert={convertBudgetToExpense} onAdd={addBudgetItem} />}
          {tab === "quotes" && <QuotesTab data={quotes} h={quoteH} onConvert={convertQuoteToExpense} />}
          {tab === "more" && moreView === "menu" && <MoreMenu counts={counts} go={setMoreView} />}
          {tab === "more" && moreView === "notes" && (
            <SubPage title="筆記區" back={() => setMoreView("menu")}><NotesTab data={notes} h={noteH} strategy={settings.strategy} saveStrategy={saveStrategy} /></SubPage>
          )}
          {tab === "more" && moreView === "settings" && (
            <SubPage title="設定" back={() => setMoreView("menu")}>
              <SettingsPage
                settings={settings} saveCap={saveCap} exportJSON={exportJSON} exportCSV={exportCSV}
                applyImport={applyImport} clearAllData={clearAllData_} counts={counts} providerCount={providerCount}
                userEmail={session.user && session.user.email} logout={logout}
                googleLinked={googleLinked} connectGoogleCalendar={connectGoogleCalendar} disconnectGoogleCalendar={disconnectGoogleCalendar}
              />
            </SubPage>
          )}
        </div>

        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 560, zIndex: 30,
          background: "#FFF9F6", borderTop: "1px solid #F3DCDF",
          boxShadow: "0 -4px 16px rgba(90,60,50,0.08)",
          display: "flex", padding: "6px 0 calc(8px + env(safe-area-inset-bottom, 0px))",
        }}>
          {NAV.map((n) => (
            <button
              key={n.key} onClick={() => goTab(n.key)}
              style={{
                flex: 1, border: "none", background: "transparent", padding: "6px 0 2px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                color: tab === n.key ? "#AD455E" : "#A88690",
              }}
            >
              <span style={{ fontSize: 20, filter: tab === n.key ? "none" : "grayscale(0.7) opacity(0.7)" }}>{n.icon}</span>
              <span style={{ fontSize: 11, fontWeight: tab === n.key ? 700 : 500 }}>{n.label}</span>
            </button>
          ))}
        </div>

        {toast && (
          <div style={{
            position: "fixed", bottom: "calc(86px + env(safe-area-inset-bottom, 0px))", left: "50%", transform: "translateX(-50%)",
            background: "#2B2420", color: "#FFF9F6", padding: "10px 20px", borderRadius: 20, fontSize: 13, maxWidth: "85%",
            animation: "printIn .2s ease-out", boxShadow: "0 6px 20px rgba(0,0,0,0.2)", zIndex: 50, textAlign: "center",
          }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
