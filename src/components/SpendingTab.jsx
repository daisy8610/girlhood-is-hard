import React, { useState, useMemo } from "react";
import { fmt, MAIN_COLORS, MAIN_CATEGORIES } from "../lib/format";
import { useCategoryFilter } from "../lib/useCategoryFilter";
import { SectionTitle, AddButton, RecordForm, RowActions, SearchBox, CategoryChips } from "./ui";

// 依月份分組，新的月份在前；同月內依日期由新到舊；沒填日期的放最後一組
function groupByMonth(rows) {
  const groups = new Map();
  [...rows]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .forEach((r) => {
      const key = r.date ? r.date.slice(0, 7) : "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(r);
    });
  return [...groups.entries()].map(([key, list]) => ({
    key,
    label: key ? `${key.slice(0, 4)} 年 ${Number(key.slice(5, 7))} 月` : "未填日期",
    list,
    total: list.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
  }));
}

function uniqueValues(data, key) {
  return Array.from(new Set(data.map((r) => r[key]).filter(Boolean))).sort();
}

export function SpendingTab({ data, h, onAdd }) {
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
    { key: "time", label: "時間", type: "time" },
    { key: "main", label: "主分類", type: "select", options: MAIN_CATEGORIES, required: true },
    { key: "sub", label: "子分類", type: "text", suggestions: (v) => uniqueValues(v.main ? data.filter((r) => r.main === v.main) : data, "sub") },
    { key: "item", label: "項目名稱", type: "text", fallbackFn: (v) => [v.main, v.sub].filter(Boolean).join(" "), placeholder: "留空會自動帶入", required: true },
    { key: "place", label: "地點", type: "text", suggestions: uniqueValues(data, "place") },
    { key: "amount", label: "金額", type: "number", required: true },
    { key: "note", label: "備註", type: "text" },
    { key: "syncCalendar", label: "同步到 Google 日曆", type: "checkbox", default: false },
  ], [data]);

  return (
    <div>
      <SectionTitle sub={`共 ${data.length} 筆，顯示 ${filtered.length} 筆`}>消費紀錄</SectionTitle>
      {!adding && <AddButton onClick={() => { setCopyDraft(null); setAdding(true); }} label="新增消費紀錄" />}
      {adding && (
        <RecordForm fields={fields} initial={copyDraft} submitLabel="新增" onCancel={() => { setAdding(false); setCopyDraft(null); }}
          onSubmit={(r) => { onAdd(r); setAdding(false); setCopyDraft(null); }} />
      )}
      <SearchBox value={search} onChange={setSearch} placeholder="搜尋項目、地點、備註…" />
      <CategoryChips options={cats} value={filter} onChange={setFilter} />
      <div className="list">
        {groupByMonth(filtered).map((g) => (
          <React.Fragment key={g.key || "none"}>
            <div className="month-head">
              <span className="month-head__label">{g.label}</span>
              <span className="month-head__sum">{g.list.length} 筆・<span className="num">{fmt(g.total)}</span></span>
            </div>
        {g.list.map((r) =>
          editingId === r.id ? (
            <RecordForm key={r.id} fields={fields} initial={r} submitLabel="更新" onCancel={() => setEditingId(null)}
              onSubmit={(patch) => { h.update(r.id, patch); setEditingId(null); }} />
          ) : (
            <div key={r.id} className="row-hover list-row">
              <div className="list-row__main">
                <div className="list-row__title">
                  <span className="cat-dot" style={{ background: MAIN_COLORS[r.main] || "var(--ed-ash)" }} />
                  {r.item} <span className="list-row__extra">{r.sub ? `· ${r.sub}` : ""}</span>
                </div>
                <div className="list-row__meta">{r.date || "—"} · {r.place || "—"}{r.note ? ` · ${r.note}` : ""}</div>
              </div>
              <div className="list-row__side">
                <span className="num list-row__amount">{fmt(r.amount)}</span>
                <button className="iconbtn" title="複製這筆，帶入新增表單" onClick={() => copyRow(r)}>⧉</button>
                <RowActions onEdit={() => setEditingId(r.id)} onDelete={() => h.del(r.id)} />
              </div>
            </div>
          )
        )}
          </React.Fragment>
        ))}
        {filtered.length === 0 && <div className="list-empty">找不到符合的紀錄</div>}
      </div>
    </div>
  );
}
