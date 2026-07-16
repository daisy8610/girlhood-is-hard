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
  ::-webkit-scrollbar-thumb { background:#d8ccc2; border-radius:8px; }
  .mono { font-family:'IBM Plex Mono', monospace; }
  .serif { font-family:'Noto Serif TC', serif; }
  button { font-family: inherit; cursor:pointer; }
  input, select, textarea { font-family: inherit; }
  .row-hover:hover { background:#FBF7F2; }
  .iconbtn { border:none; background:transparent; color:#b3a294; font-size:13px; padding:4px 6px; border-radius:6px; }
  .iconbtn:hover { background:#F1E6DC; color:#8a3b4d; }
  .menu-item:active { background:#F1E6DC; }
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
      setter((prev) => prev.map((r) => { if (r.id === id) { merged = { ...r, ...patch }; return merged; } return r; }));
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

  const spendH = useMemo(() => mk("spending", setSpending), []);
  const quoteH = useMemo(() => mk("quotes", setQuotes), []);
  const budgetH = useMemo(() => mk("budget", setBudget), []);
  const noteH = useMemo(() => mk("notes", setNotes), []);
  const voucherH = useMemo(() => mk("vouchers", setVouchers), []);

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
    const done = budget.filter((r) => r.status === "已完成").reduce((s, r) => s + (r.actual || r.budget || 0), 0);
    return { planned, done, cap: settings.cap || 50000 };
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

  async function convertQuoteToExpense(q) {
    await spendH.add({
      date: new Date().toISOString().slice(0, 10),
      main: "醫美",
      sub: q.category || "",
      item: q.product || q.category || "（未命名）",
      place: q.clinic || "",
      amount: q.price,
      note: q.note || "",
    });
  }

  async function convertBudgetToExpense(b) {
    await spendH.add({
      date: new Date().toISOString().slice(0, 10),
      main: b.main || "",
      sub: b.bucket || "",
      item: b.item || "（未命名）",
      place: b.place || "",
      amount: b.actual != null ? b.actual : b.budget,
      note: b.note || "",
    });
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3ECE5", fontFamily: "'Noto Sans TC',sans-serif", color: "#8a3b4d", padding: 24, textAlign: "center", lineHeight: 1.8 }}>
        還沒設定 Supabase 連線。<br />請打開網站資料夾裡的 config.js，填入你的 Project URL 和 anon key。
      </div>
    );
  }
  if (session === undefined) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3ECE5", fontFamily: "'Noto Serif TC',serif", color: "#8a5a63" }}>存摺開啟中…</div>;
  }
  if (session === null) return <AuthScreen />;
  if (!ready) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F3ECE5", fontFamily: "'Noto Serif TC',serif", color: "#8a5a63" }}>資料同步中…</div>;
  }

  const counts = { spending: spending.length, quotes: quotes.length, budget: budget.length, notes: notes.length, vouchers: vouchers.length };
  const NAV = [
    { key: "overview", label: "總覽", icon: "📔" },
    { key: "spending", label: "紀錄", icon: "🧾" },
    { key: "budget", label: "預算", icon: "🎯" },
    { key: "more", label: "更多", icon: "☰" },
  ];

  function goTab(k) {
    setTab(k);
    if (k === "more") setMoreView("menu");
    try { window.scrollTo({ top: 0 }); } catch (e) {}
  }

  return (
    <div style={{ minHeight: "100vh", background: "#EAE0D6", color: "#2B2420", fontFamily: "'Noto Sans TC', sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>

      <div style={{
        maxWidth: 560, margin: "0 auto", minHeight: "100vh", background: "#F3ECE5",
        boxShadow: "0 0 40px rgba(90,60,50,0.12)", position: "relative",
        paddingBottom: "calc(76px + env(safe-area-inset-bottom, 0px))",
      }}>
        <div style={{
          background: "linear-gradient(135deg,#8a3b4d,#B5445B 70%)", color: "#FBEDEF",
          padding: "14px 18px 12px", position: "sticky", top: 0, zIndex: 20,
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
        }}>
          <div>
            <span className="serif" style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>當女生好難</span>
            <span style={{ fontSize: 10, letterSpacing: 2, opacity: 0.8, marginLeft: 8, fontFamily: "'IBM Plex Mono',monospace" }}>PASSBOOK</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            {tab === "overview" ? "總覽" : tab === "spending" ? "消費紀錄" : tab === "budget" ? "預算計畫"
              : moreView === "quotes" ? "詢價比較" : moreView === "notes" ? "筆記區" : moreView === "settings" ? "設定" : "更多"}
          </div>
        </div>

        <div style={{ padding: "16px 14px 24px" }}>
          {loadErr && (
            <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 8, background: "#B5445B14", border: "1px solid #B5445B55", color: "#8a3b4d", fontSize: 13, lineHeight: 1.7 }}>
              ⚠️ {loadErr}
              <button onClick={loadData} style={{ marginLeft: 8, border: "none", background: "none", color: "#8a3b4d", textDecoration: "underline", fontSize: 13 }}>重試</button>
              {/budget_plans|vouchers|annual_budget_cap|category|tags/.test(loadErr) && (
                <div style={{ marginTop: 6, fontSize: 12 }}>看起來 PATCH.sql 還沒跑完，請到 Supabase 的 SQL Editor 執行一次。</div>
              )}
            </div>
          )}
          {missingKinds.length > 0 && !seeding && (
            <div style={{ marginBottom: 14, padding: "14px 16px", borderRadius: 10, background: "#FEFBF8", border: "1px solid #EADFD4", fontSize: 13.5, lineHeight: 1.7 }}>
              目前雲端還缺這些資料：<strong>{missingKinds.map((k) => BACKUP_LABELS[k]).join("、")}</strong>
              <div style={{ marginTop: 8, fontSize: 12.5, color: "#9a8d80" }}>
                請到 Supabase SQL Editor 執行一次性匯入腳本（不經過這個網頁），或到「更多 → 設定」用 JSON 備份匯入。
              </div>
            </div>
          )}
          {seeding && <div style={{ marginBottom: 14, fontSize: 13, color: "#8a5a63" }}>資料寫入中，請稍等…</div>}

          {tab === "overview" && (
            <Overview totals={totals} budgetTotals={budgetTotals} spending={spending} budget={budget} vouchers={vouchers} voucherH={voucherH} />
          )}
          {tab === "spending" && <SpendingTab data={spending} h={spendH} />}
          {tab === "budget" && <BudgetTab data={budget} h={budgetH} strategy={settings.strategy} saveStrategy={saveStrategy} onConvert={convertBudgetToExpense} />}
          {tab === "more" && moreView === "menu" && <MoreMenu counts={counts} go={setMoreView} />}
          {tab === "more" && moreView === "quotes" && (
            <SubPage title="詢價比較" back={() => setMoreView("menu")}><QuotesTab data={quotes} h={quoteH} onConvert={convertQuoteToExpense} /></SubPage>
          )}
          {tab === "more" && moreView === "notes" && (
            <SubPage title="筆記區" back={() => setMoreView("menu")}><NotesTab data={notes} h={noteH} /></SubPage>
          )}
          {tab === "more" && moreView === "settings" && (
            <SubPage title="設定" back={() => setMoreView("menu")}>
              <SettingsPage
                settings={settings} saveCap={saveCap} exportJSON={exportJSON} exportCSV={exportCSV}
                applyImport={applyImport} clearAllData={clearAllData_} counts={counts} providerCount={providerCount}
                userEmail={session.user && session.user.email} logout={logout}
              />
            </SubPage>
          )}
        </div>

        <div style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 560, zIndex: 30,
          background: "#FBF7F2", borderTop: "1px solid #EADFD4",
          boxShadow: "0 -4px 16px rgba(90,60,50,0.08)",
          display: "flex", padding: "6px 0 calc(8px + env(safe-area-inset-bottom, 0px))",
        }}>
          {NAV.map((n) => (
            <button
              key={n.key} onClick={() => goTab(n.key)}
              style={{
                flex: 1, border: "none", background: "transparent", padding: "6px 0 2px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                color: tab === n.key ? "#8a3b4d" : "#9a8d80",
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
            background: "#2B2420", color: "#FBF7F2", padding: "10px 20px", borderRadius: 20, fontSize: 13, maxWidth: "85%",
            animation: "printIn .2s ease-out", boxShadow: "0 6px 20px rgba(0,0,0,0.2)", zIndex: 50, textAlign: "center",
          }}>
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
