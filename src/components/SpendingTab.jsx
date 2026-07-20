import React, { useState, useMemo } from "react";
import { fmt, MAIN_COLORS } from "../lib/format";
import { useCategoryFilter } from "../lib/useCategoryFilter";
import { SectionTitle, AddButton, RecordForm, RowActions, SearchBox, CategoryChips } from "./ui";

function uniqueValues(data, key) {
  return Array.from(new Set(data.map((r) => r[key]).filter(Boolean))).sort();
}

export function SpendingTab({ data, h }) {
  const { filter, setFilter, search, setSearch, cats, filtered } = useCategoryFilter(data, {
    searchKeys: ["item", "place", "note", "sub", "main"],
  });
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [copyDraft, setCopyDraft] = useState(null);

  function copyRow(r) {
    setEditingId(null);
    setCopyDraft({ ...r, date: new Date().toISOString().slice(0, 10) });
    setAdding(true);
  }

  const fields = useMemo(() => [
    { key: "date", label: "日期", type: "date", default: new Date().toISOString().slice(0, 10) },
    { key: "main", label: "主分類", type: "select", options: ["醫美", "頭髮", "美容", "指甲"] },
    { key: "sub", label: "子分類", type: "text", suggestions: uniqueValues(data, "sub") },
    { key: "item", label: "項目名稱", type: "text", fallbackKey: "sub", placeholder: "留空會自動帶入子分類" },
    { key: "place", label: "地點", type: "text", suggestions: uniqueValues(data, "place") },
    { key: "amount", label: "金額", type: "number" },
    { key: "note", label: "備註", type: "text" },
  ], [data]);

  return (
    <div>
      <SectionTitle sub={`共 ${data.length} 筆，顯示 ${filtered.length} 筆`}>消費紀錄</SectionTitle>
      {!adding && <AddButton onClick={() => { setCopyDraft(null); setAdding(true); }} label="新增消費紀錄" />}
      {adding && (
        <RecordForm fields={fields} initial={copyDraft} submitLabel="新增" onCancel={() => { setAdding(false); setCopyDraft(null); }}
          onSubmit={(r) => { h.add(r); setAdding(false); setCopyDraft(null); }} />
      )}
      <SearchBox value={search} onChange={setSearch} placeholder="搜尋項目、地點、備註…" />
      <CategoryChips options={cats} value={filter} onChange={setFilter} />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {filtered.map((r) =>
          editingId === r.id ? (
            <RecordForm key={r.id} fields={fields} initial={r} submitLabel="更新" onCancel={() => setEditingId(null)}
              onSubmit={(patch) => { h.update(r.id, patch); setEditingId(null); }} />
          ) : (
            <div key={r.id} className="row-hover" style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 4px", borderBottom: "1px dotted #EADFD4", gap: 6,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14 }}>
                  <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 7, background: MAIN_COLORS[r.main] || "#999", marginRight: 6 }} />
                  {r.item} <span style={{ color: "#9a8d80", fontSize: 12 }}>{r.sub ? `· ${r.sub}` : ""}</span>
                </div>
                <div style={{ fontSize: 11, color: "#9a8d80", overflowWrap: "anywhere" }}>{r.date || "—"} · {r.place || "—"}{r.note ? ` · ${r.note}` : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <span className="mono" style={{ fontSize: 14, whiteSpace: "nowrap" }}>{fmt(r.amount)}</span>
                <button className="iconbtn" title="複製這筆，帶入新增表單" onClick={() => copyRow(r)}>⧉</button>
                <RowActions onEdit={() => setEditingId(r.id)} onDelete={() => h.del(r.id)} />
              </div>
            </div>
          )
        )}
        {filtered.length === 0 && <div style={{ color: "#9a8d80", fontSize: 13, padding: 12 }}>找不到符合的紀錄</div>}
      </div>
    </div>
  );
}
