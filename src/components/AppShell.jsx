import React from "react";

const NAV = [
  { key: "overview", label: "總覽", icon: "📔", title: "總覽" },
  { key: "spending", label: "紀錄", icon: "🧾", title: "消費紀錄" },
  { key: "quotes", label: "詢價", icon: "💉", title: "詢價比較" },
  { key: "notes", label: "筆記", icon: "🩺", title: "筆記區" },
  { key: "settings", label: "設定", icon: "⚙️", title: "設定" },
];

// 外框：桌機側邊欄、頁首、手機底部導覽、toast
export function AppShell({ tab, onTab, toast, children }) {
  function goTab(k) {
    onTab(k);
    try { window.scrollTo({ top: 0 }); } catch (e) {}
  }

  const pageTitle = (NAV.find((n) => n.key === tab) || NAV[NAV.length - 1]).title;

  return (
    <div className="ed-sans app">

      <div className="app-shell">
        <nav className="app-sidebar">
          <div className="app-sidebar__brand">
            <div className="brand-kicker">PASSBOOK</div>
            <div className="serif app-sidebar__title">當女生好難</div>
          </div>
          {NAV.map((n) => (
            <button key={n.key} onClick={() => goTab(n.key)} className={"side-nav-btn" + (tab === n.key ? " is-active" : "")}>
              <span className="side-nav-btn__icon">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="app-main-col">
          <div className="app-header">
            <div className="hide-md-up">
              <span className="serif app-header__title">當女生好難</span>
              <span className="app-header__kicker">PASSBOOK</span>
            </div>
            <div className="app-header__page">{pageTitle}</div>
          </div>

          <div className="content-col">
            {children}
          </div>
        </div>

        <div className="app-bottom-nav">
          {NAV.map((n) => (
            <button key={n.key} onClick={() => goTab(n.key)} className={"bottom-nav-btn" + (tab === n.key ? " is-active" : "")}>
              <span className="bottom-nav-btn__icon">{n.icon}</span>
              <span className="bottom-nav-btn__label">{n.label}</span>
            </button>
          ))}
        </div>

        {toast && (
          <div className="toast">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
