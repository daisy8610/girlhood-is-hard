import React from "react";
import { SectionTitle } from "./ui";

export function MoreMenu({ counts, go }) {
  const items = [
    { key: "notes", icon: "🩺", label: "筆記區", sub: `${counts.notes} 篇健康與保養筆記` },
    { key: "settings", icon: "⚙️", label: "設定", sub: "預算上限、備份還原、清空資料" },
  ];
  return (
    <div>
      <SectionTitle>更多</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((it) => (
          <button
            key={it.key} className="menu-item" onClick={() => go(it.key)}
            style={{
              display: "flex", alignItems: "center", gap: 14, textAlign: "left",
              background: "#FFF9F6", border: "1px solid #F3DCDF", borderRadius: 12, padding: "16px 16px", width: "100%",
            }}
          >
            <span style={{ fontSize: 24 }}>{it.icon}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 15, fontWeight: 600 }}>{it.label}</span>
              <span style={{ display: "block", fontSize: 12, color: "#A88690", marginTop: 2 }}>{it.sub}</span>
            </span>
            <span style={{ color: "#C9AEB6", fontSize: 16 }}>›</span>
          </button>
        ))}
      </div>
      <div style={{ textAlign: "center", fontSize: 11.5, color: "#A88690", marginTop: 22, lineHeight: 1.7 }}>
        資料只存在 Supabase，這個網頁不含任何資料副本。<br />記得偶爾到「設定」下載備份。
      </div>
    </div>
  );
}

export function SubPage({ title, back, children }) {
  return (
    <div>
      <button
        onClick={back}
        style={{ border: "none", background: "transparent", color: "#AD455E", fontSize: 13, fontWeight: 600, padding: "0 0 12px", display: "flex", alignItems: "center", gap: 4 }}
      >
        ‹ 更多
      </button>
      {children}
    </div>
  );
}
