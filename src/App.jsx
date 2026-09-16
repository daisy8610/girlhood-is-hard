import React, { useState, useEffect } from "react";
import { supa } from "./lib/supabaseClient";
import { BACKUP_LABELS } from "./lib/backup";
import { useAppData } from "./lib/useAppData";
import { useGoogleCalendar } from "./lib/useGoogleCalendar";

import { AppShell } from "./components/AppShell";
import { AuthScreen } from "./components/AuthScreen";
import { Overview } from "./components/Overview";
import { SpendingTab } from "./components/SpendingTab";
import { QuotesTab } from "./components/QuotesTab";
import { NotesTab } from "./components/NotesTab";
import { SettingsPage } from "./components/SettingsPage";

export default function App() {
  const [session, setSession] = useState(undefined);
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!supa) return;
    supa.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: sub } = supa.auth.onAuthStateChange((_e, s) => setSession(s || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  function flash(msg) { setToast(msg); setTimeout(() => setToast(null), 2600); }

  const d = useAppData({ session, flash });
  const cal = useGoogleCalendar({ session, flash });

  async function addExpenseItem(r) {
    await d.spendH.add(r);
    if (r.syncCalendar) cal.syncToCalendar(r);
  }

  async function logout() { await supa.auth.signOut(); }

  // ---------- 畫面 ----------
  if (!supa) {
    return (
      <>
        <div className="ed-sans fullscreen-msg fullscreen-msg--setup">
          還沒設定 Supabase 連線。<br />請打開網站資料夾裡的 config.js，填入你的 Project URL 和 anon key。
        </div>
      </>
    );
  }
  if (session === undefined) {
    return (
      <>
        <div className="serif fullscreen-msg">存摺開啟中…</div>
      </>
    );
  }
  if (session === null) return <AuthScreen />;
  if (!d.ready) {
    return (
      <>
        <div className="serif fullscreen-msg">資料同步中…</div>
      </>
    );
  }

  return (
    <AppShell tab={tab} onTab={setTab} toast={toast}>
      {d.loadErr && (
        <div className="notice">
          ⚠️ {d.loadErr}
          <button onClick={d.loadData} className="link-btn notice__retry">重試</button>
          {/vouchers|annual_budget_cap|category|tags/.test(d.loadErr) && (
            <div className="notice__hint">看起來 PATCH.sql 還沒跑完，請到 Supabase 的 SQL Editor 執行一次。</div>
          )}
        </div>
      )}
      {d.missingKinds.length > 0 && !d.seeding && (
        <div className="notice-card">
          目前雲端還缺這些資料：<strong>{d.missingKinds.map((k) => BACKUP_LABELS[k]).join("、")}</strong>
          <div className="notice-card__sub">
            請到 Supabase SQL Editor 執行一次性匯入腳本（不經過這個網頁），或到「設定」用 JSON 備份匯入。
          </div>
        </div>
      )}
      {d.seeding && <div className="seeding-msg">資料寫入中，請稍等…</div>}

      {tab === "overview" && (
        <Overview totals={d.totals} cap={d.settings.cap} spending={d.spending} vouchers={d.vouchers} voucherH={d.voucherH} />
      )}
      {tab === "spending" && <SpendingTab data={d.spending} h={d.spendH} onAdd={addExpenseItem} />}
      {tab === "quotes" && <QuotesTab data={d.quotes} h={d.quoteH} />}
      {tab === "notes" && <NotesTab data={d.notes} h={d.noteH} />}
      {tab === "settings" && (
        <SettingsPage
          settings={d.settings} saveCap={d.saveCap} exportJSON={d.exportJSON} exportCSV={d.exportCSV}
          applyImport={d.applyImport} clearAllData={d.clearAllData} counts={d.counts} providerCount={d.providerCount}
          userEmail={session.user && session.user.email} logout={logout}
          googleLinked={cal.googleLinked} connectGoogleCalendar={cal.connectGoogleCalendar} disconnectGoogleCalendar={cal.disconnectGoogleCalendar}
        />
      )}
    </AppShell>
  );
}
