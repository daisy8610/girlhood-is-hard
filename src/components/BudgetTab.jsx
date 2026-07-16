import React, { useState } from "react";
import { fmt, MAIN_COLORS } from "../lib/format";
import { renderMD } from "../lib/markdown";
import { SectionTitle, AddButton, RecordForm, RowActions, SearchBox } from "./ui";

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

function StrategyBlock({ content, onSave }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content || "");
  const year = new Date().getFullYear();

  function startEdit(e) {
    e.stopPropagation();
    setDraft(content || "");
    setEditing(true);
    setOpen(true);
  }
  function save() {
    onSave(draft);
    setEditing(false);
  }

  return (
    <div style={{ border: "1px solid #EADFD4", borderRadius: 10, marginBottom: 16, background: "#FEFBF8", overflow: "hidden" }}>
      <div onClick={() => setOpen((o) => !o)} style={{ padding: "12px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#8a3b4d" }}>📈 {year} 年度目標與預算分配策略</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!editing && <button className="iconbtn" onClick={startEdit}>編輯</button>}
          <span style={{ fontSize: 12, color: "#9a8d80" }}>{open ? "收合 ▲" : "展開 ▼"}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: "4px 16px 16px", fontSize: 13.5, lineHeight: 1.8, borderTop: "1px dashed #EADFD4" }}>
          {editing ? (
            <div>
              <textarea
                value={draft} onChange={(e) => setDraft(e.target.value)} rows={10}
                placeholder="支援簡單 markdown：## 標題、- 清單、**粗體**、| 表格 |"
                style={{ width: "100%", border: "1px solid #EADFD4", borderRadius: 8, padding: 10, fontSize: 13.5, fontFamily: "inherit", resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={save} style={{ border: "none", background: "#B5445B", color: "#FBEDEF", borderRadius: 6, padding: "6px 14px", fontSize: 13 }}>儲存</button>
                <button onClick={() => setEditing(false)} style={{ border: "1px solid #EADFD4", background: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13 }}>取消</button>
              </div>
            </div>
          ) : content ? renderMD(content) : (
            <div style={{ color: "#9a8d80" }}>還沒有內容，點右上「編輯」開始寫今年的目標與分配策略。</div>
          )}
        </div>
      )}
    </div>
  );
}

export function BudgetTab({ data, h, strategy, saveStrategy, onConvert, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("全部");
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState(null);

  function toggleDone(r) {
    const done = r.status !== "已完成";
    h.update(r.id, { status: done ? "已完成" : "計劃中" });
    setConfirmId(done ? r.id : null);
  }
  const sorted = [...data].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

  const cats = ["全部", ...Array.from(new Set(data.map((r) => r.main).filter(Boolean)))];
  const q = search.trim().toLowerCase();
  const filtered = sorted.filter(
    (r) =>
      (filter === "全部" || r.main === filter) &&
      (!q || [r.item, r.place, r.note, r.bucket, r.main].some((v) => v && String(v).toLowerCase().includes(q)))
  );

  return (
    <div>
      <SectionTitle sub={`勾選代表已完成；共 ${data.length} 筆，顯示 ${filtered.length} 筆`}>{new Date().getFullYear()} 預算計畫</SectionTitle>
      <StrategyBlock content={strategy} onSave={saveStrategy} />
      {!adding && <AddButton onClick={() => setAdding(true)} label="新增計畫項目" />}
      {adding && (
        <RecordForm fields={BUDGET_FIELDS} submitLabel="新增" onCancel={() => setAdding(false)}
          onSubmit={(r) => { onAdd({ status: "計劃中", ...r }); setAdding(false); }} />
      )}
      <SearchBox value={search} onChange={setSearch} placeholder="搜尋項目、地點、備註…" />
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {cats.map((c) => (
          <button
            key={c} onClick={() => setFilter(c)}
            style={{
              padding: "6px 13px", borderRadius: 20, fontSize: 12, border: "1px solid #EADFD4",
              background: filter === c ? "#8a3b4d" : "transparent", color: filter === c ? "#fff" : "#6b5f54",
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {filtered.map((r) =>
          editingId === r.id ? (
            <RecordForm key={r.id} fields={BUDGET_FIELDS} initial={r} submitLabel="更新" onCancel={() => setEditingId(null)}
              onSubmit={(patch) => { h.update(r.id, patch); setEditingId(null); }} />
          ) : (
            <div key={r.id}>
              <div className="row-hover" style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 4px", borderBottom: "1px dotted #EADFD4", gap: 6,
                opacity: r.status === "已完成" ? 0.55 : 1,
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                  <input
                    type="checkbox" checked={r.status === "已完成"}
                    onChange={() => toggleDone(r)}
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
              {confirmId === r.id && (
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 10px", margin: "0 0 4px", borderRadius: 8, background: "#FEFBF8",
                  border: "1px dashed #EADFD4", fontSize: 12.5, color: "#6b5f54",
                }}>
                  <span>已完成！要新增一筆消費紀錄嗎？</span>
                  <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => { onConvert(r); setConfirmId(null); }}
                      style={{ border: "none", background: "#B5445B", color: "#FBEDEF", borderRadius: 6, padding: "4px 10px", fontSize: 12 }}
                    >
                      新增
                    </button>
                    <button
                      onClick={() => setConfirmId(null)}
                      style={{ border: "1px solid #EADFD4", background: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12 }}
                    >
                      不用了
                    </button>
                  </span>
                </div>
              )}
            </div>
          )
        )}
        {filtered.length === 0 && <div style={{ color: "#9a8d80", fontSize: 13, padding: 12 }}>找不到符合的計畫項目</div>}
      </div>
    </div>
  );
}
