import React, { useState } from "react";
import { fmt, MAIN_COLORS } from "../lib/format";
import { renderMD } from "../lib/markdown";
import { useCategoryFilter } from "../lib/useCategoryFilter";
import { SectionTitle, AddButton, RecordForm, RowActions, SearchBox, CategoryChips } from "./ui";

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

function StrategyBlock({ content }) {
  const [open, setOpen] = useState(false);
  const year = new Date().getFullYear();

  return (
    <div style={{ border: "1px solid #F3DCDF", borderRadius: 10, marginBottom: 16, background: "#FFFCFA", overflow: "hidden" }}>
      <div onClick={() => setOpen((o) => !o)} style={{ padding: "12px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#AD455E" }}>📈 {year} 年度目標與預算分配策略</div>
        <span style={{ fontSize: 12, color: "#A88690" }}>{open ? "收合 ▲" : "展開 ▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "4px 16px 16px", fontSize: 13.5, lineHeight: 1.8, borderTop: "1px dashed #F3DCDF" }}>
          {content ? renderMD(content) : (
            <div style={{ color: "#A88690" }}>還沒有內容，到「更多 → 筆記區」編輯今年的目標與分配策略。</div>
          )}
        </div>
      )}
    </div>
  );
}

export function BudgetTab({ data, h, strategy, onConvert, onAdd }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  function toggleDone(r) {
    const done = r.status !== "已完成";
    h.update(r.id, { status: done ? "已完成" : "計劃中" });
    if (done) onConvert(r);
  }
  const sorted = [...data].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

  const { filter, setFilter, search, setSearch, cats, filtered } = useCategoryFilter(sorted, {
    searchKeys: ["item", "place", "note", "bucket", "main"],
  });

  return (
    <div>
      <SectionTitle sub={`勾選代表已完成；共 ${data.length} 筆，顯示 ${filtered.length} 筆`}>{new Date().getFullYear()} 預算計畫</SectionTitle>
      <StrategyBlock content={strategy} />
      {!adding && <AddButton onClick={() => setAdding(true)} label="新增計畫項目" />}
      {adding && (
        <RecordForm fields={BUDGET_FIELDS} submitLabel="新增" onCancel={() => setAdding(false)}
          onSubmit={(r) => { onAdd({ status: "計劃中", ...r }); setAdding(false); }} />
      )}
      <SearchBox value={search} onChange={setSearch} placeholder="搜尋項目、地點、備註…" />
      <CategoryChips options={cats} value={filter} onChange={setFilter} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {filtered.map((r) =>
          editingId === r.id ? (
            <RecordForm key={r.id} fields={BUDGET_FIELDS} initial={r} submitLabel="更新" onCancel={() => setEditingId(null)}
              onSubmit={(patch) => { h.update(r.id, patch); setEditingId(null); }} />
          ) : (
            <div key={r.id}>
              <div className="row-hover" style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 4px", borderBottom: "1px dotted #F3DCDF", gap: 6,
                opacity: r.status === "已完成" ? 0.55 : 1,
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                  <input
                    type="checkbox" checked={r.status === "已完成"}
                    onChange={() => toggleDone(r)}
                    style={{ width: 17, height: 17, accentColor: "#D9718A", flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, textDecoration: r.status === "已完成" ? "line-through" : "none" }}>{r.item}</div>
                    <div style={{ fontSize: 11, color: "#A88690", overflowWrap: "anywhere" }}>
                      <span style={{ color: MAIN_COLORS[r.main] || "#A88690" }}>{r.bucket}</span> · {r.date || "未定日期"} · {r.place || "—"}
                      {r.note ? ` · ${r.note}` : ""}{r.actual != null ? ` · 實際 ${fmt(r.actual)}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <span className="mono" style={{ fontSize: 14, whiteSpace: "nowrap" }}>{fmt(r.budget)}</span>
                  <RowActions onEdit={() => setEditingId(r.id)} onDelete={() => h.del(r.id)} />
                </div>
              </div>
            </div>
          )
        )}
        {filtered.length === 0 && <div style={{ color: "#A88690", fontSize: 13, padding: 12 }}>找不到符合的計畫項目</div>}
      </div>
    </div>
  );
}
