import React, { useState } from "react";
import { fmt, MAIN_COLORS } from "../lib/format";
import { SectionTitle, AddButton, RecordForm, RowActions } from "./ui";

const BUDGET_FIELDS = [
  { key: "date", label: "計劃日期", type: "date" },
  { key: "item", label: "項目名稱", type: "text" },
  { key: "main", label: "主分類", type: "select", options: ["醫美", "頭髮", "美容", "指甲"] },
  { key: "bucket", label: "預算分類", type: "select", options: ["必要項目", "彈性項目", "緊急預備"] },
  { key: "budget", label: "預算金額", type: "number" },
  { key: "actual", label: "實際金額", type: "number" },
  { key: "place", label: "地點", type: "text" },
  { key: "note", label: "備註", type: "text" },
];

function StrategyBlock() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: "1px solid #EADFD4", borderRadius: 10, marginBottom: 16, background: "#FEFBF8", overflow: "hidden" }}>
      <div onClick={() => setOpen((o) => !o)} style={{ padding: "12px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#8a3b4d" }}>📈 2026 年度目標與預算分配策略</div>
        <span style={{ fontSize: 12, color: "#9a8d80" }}>{open ? "收合 ▲" : "展開 ▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "4px 16px 16px", fontSize: 13.5, lineHeight: 1.8, borderTop: "1px dashed #EADFD4" }}>
          <p style={{ margin: "10px 0 4px" }}><strong>年度目標</strong>：預算上限 NT$ 50,000｜目標節省 42%（vs 2025 年）｜月均預算 NT$ 4,167</p>
          <p style={{ margin: "12px 0 4px" }}><strong>必要項目（62% = NT$ 31,194）</strong></p>
          <ul style={{ margin: "4px 0", paddingLeft: 20 }}>
            <li>🩸 醫美維護：NT$ 21,000 — 肉毒咀嚼肌 NT$ 7,000（每 6 個月）、玻尿酸補打 NT$ 14,000（視需要）、除毛 NT$ 0（還有堂數）</li>
            <li>✂️ 頭髮護理：NT$ 0（使用儲值金）— 剪髮 NT$ 640（每 3 個月）</li>
            <li>💅 基礎護理：NT$ 10,194 — 睫毛管理 NT$ 1,099（每 2 個月）、剪指甲 NT$ 300（每月）</li>
          </ul>
          <p style={{ margin: "12px 0 4px" }}><strong>彈性項目（38% = NT$ 18,806）</strong></p>
          <ul style={{ margin: "4px 0", paddingLeft: 20 }}>
            <li>🌟 進階保養：NT$ 18,806</li>
          </ul>
          <p style={{ margin: "12px 0 4px" }}><strong>定期檢視</strong>：每月 1 號檢視當月計劃｜15 號檢查執行與預約進度｜月底記錄支出並評估效果</p>
        </div>
      )}
    </div>
  );
}

export function BudgetTab({ data, h }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const sorted = [...data].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

  return (
    <div>
      <SectionTitle sub="勾選代表已完成；完成後也可以點編輯補上實際金額">2026 預算計畫</SectionTitle>
      <StrategyBlock />
      {!adding && <AddButton onClick={() => setAdding(true)} label="新增計畫項目" />}
      {adding && (
        <RecordForm fields={BUDGET_FIELDS} submitLabel="新增" onCancel={() => setAdding(false)}
          onSubmit={(r) => { h.add({ status: "計劃中", ...r }); setAdding(false); }} />
      )}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {sorted.map((r) =>
          editingId === r.id ? (
            <RecordForm key={r.id} fields={BUDGET_FIELDS} initial={r} submitLabel="更新" onCancel={() => setEditingId(null)}
              onSubmit={(patch) => { h.update(r.id, patch); setEditingId(null); }} />
          ) : (
            <div key={r.id} className="row-hover" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 4px", borderBottom: "1px dotted #EADFD4", gap: 6,
              opacity: r.status === "已完成" ? 0.55 : 1,
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                <input
                  type="checkbox" checked={r.status === "已完成"}
                  onChange={() => h.update(r.id, { status: r.status === "已完成" ? "計劃中" : "已完成" })}
                  style={{ width: 17, height: 17, accentColor: "#B5445B", flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, textDecoration: r.status === "已完成" ? "line-through" : "none" }}>{r.item}</div>
                  <div style={{ fontSize: 11, color: "#9a8d80", overflowWrap: "anywhere" }}>
                    <span style={{ color: MAIN_COLORS[r.main] || "#9a8d80" }}>{r.bucket}</span> · {r.date || "未定日期"} · {r.place || "—"}
                    {r.note ? ` · ${r.note}` : ""}{r.actual != null ? ` · 實際 ${fmt(r.actual)}` : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <span className="mono" style={{ fontSize: 14, whiteSpace: "nowrap" }}>{fmt(r.budget)}</span>
                <RowActions onEdit={() => setEditingId(r.id)} onDelete={() => h.del(r.id)} />
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
