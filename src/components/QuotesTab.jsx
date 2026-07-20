import React, { useState, useMemo } from "react";
import { fmt } from "../lib/format";
import { SectionTitle, AddButton, RecordForm, RowActions, SearchBox } from "./ui";

const QUOTE_FIELDS = [
  { key: "date", label: "詢價日期", type: "date", default: new Date().toISOString().slice(0, 10) },
  { key: "clinic", label: "診所名稱", type: "text" },
  { key: "category", label: "療程類別", type: "select", options: ["玻尿酸", "肉毒", "電音波", "皮秒", "除毛", "複合療程"] },
  { key: "product", label: "品牌/產品", type: "text" },
  { key: "qty", label: "單位數量", type: "number" },
  { key: "price", label: "價格", type: "number" },
  { key: "note", label: "備註", type: "text" },
];

function QuoteRow({ r, editingId, setEditingId, h, onConvert }) {
  if (editingId === r.id) {
    return (
      <RecordForm fields={QUOTE_FIELDS} initial={r} submitLabel="更新" onCancel={() => setEditingId(null)}
        onSubmit={(patch) => { h.update(r.id, patch); setEditingId(null); }} />
    );
  }
  return (
    <div className="row-hover" style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "8px 4px", borderBottom: "1px dotted #F1E9E0", gap: 6,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5 }}>{r.clinic}</div>
        <div style={{ fontSize: 11, color: "#9a8d80", overflowWrap: "anywhere" }}>{r.date || "—"}{r.qty ? ` · ${r.qty} 單位` : ""}{r.note ? ` · ${r.note}` : ""}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <span className="mono" style={{ fontSize: 13.5, whiteSpace: "nowrap" }}>{fmt(r.price)}</span>
        <button className="iconbtn" title="轉為消費紀錄" onClick={() => onConvert(r)}>➜🧾</button>
        <RowActions onEdit={() => setEditingId(r.id)} onDelete={() => h.del(r.id)} />
      </div>
    </div>
  );
}

export function QuotesTab({ data, h, onConvert }) {
  const [view, setView] = useState("group");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const q = search.trim().toLowerCase();
  const filtered = data.filter((r) => !q || [r.clinic, r.product, r.category, r.note].some((v) => v && String(v).toLowerCase().includes(q)));

  const grouped = useMemo(() => {
    const byCat = {};
    filtered.forEach((r) => {
      const cat = r.category || "其他";
      byCat[cat] = byCat[cat] || {};
      const prod = r.product || "未標示";
      byCat[cat][prod] = byCat[cat][prod] || [];
      byCat[cat][prod].push(r);
    });
    Object.values(byCat).forEach((prods) => Object.values(prods).forEach((list) => list.sort((a, b) => (a.price || Infinity) - (b.price || Infinity))));
    return byCat;
  }, [filtered]);

  return (
    <div>
      <SectionTitle sub="同一產品跨診所比價，價格由低到高排序（注意單位數量可能不同）">詢價比較</SectionTitle>
      {!adding && <AddButton onClick={() => setAdding(true)} label="新增詢價紀錄" />}
      {adding && (
        <RecordForm fields={QUOTE_FIELDS} submitLabel="新增" onCancel={() => setAdding(false)}
          onSubmit={(r) => { h.add(r); setAdding(false); }} />
      )}
      <SearchBox value={search} onChange={setSearch} placeholder="搜尋診所、產品、備註…" />
      <div style={{ marginBottom: 12, display: "flex", gap: 6 }}>
        {[["group", "分組比價"], ["list", "依日期列表"]].map(([k, label]) => (
          <button
            key={k} onClick={() => setView(k)}
            style={{
              fontSize: 12, padding: "6px 13px", borderRadius: 20, border: "1px solid #EADFD4",
              background: view === k ? "#8a3b4d" : "transparent", color: view === k ? "#fff" : "#6b5f54",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "group" ? (
        <div>
          {Object.entries(grouped).map(([cat, prods]) => (
            <div key={cat} style={{ marginBottom: 18 }}>
              <div className="serif" style={{ fontSize: 15, fontWeight: 700, color: "#8a3b4d", borderBottom: "2px solid #EADFD4", paddingBottom: 4, marginBottom: 6 }}>{cat}</div>
              {Object.entries(prods).map(([prod, list]) => (
                <div key={prod} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "#6b5f54", margin: "6px 0 2px" }}>
                    {prod} <span style={{ fontWeight: 400, color: "#9a8d80" }}>（{list.length} 筆）</span>
                  </div>
                  {list.map((r) => (
                    <QuoteRow key={r.id} r={r} editingId={editingId} setEditingId={setEditingId} h={h} onConvert={onConvert} />
                  ))}
                </div>
              ))}
            </div>
          ))}
          {Object.keys(grouped).length === 0 && <div style={{ color: "#9a8d80", fontSize: 13, padding: 12 }}>找不到符合的紀錄</div>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[...filtered].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((r) => (
            <div key={r.id}>
              {editingId === r.id ? (
                <RecordForm fields={QUOTE_FIELDS} initial={r} submitLabel="更新" onCancel={() => setEditingId(null)}
                  onSubmit={(patch) => { h.update(r.id, patch); setEditingId(null); }} />
              ) : (
                <div className="row-hover" style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 4px", borderBottom: "1px dotted #EADFD4", gap: 6,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14 }}>{r.product} <span style={{ color: "#9a8d80", fontSize: 12 }}>· {r.clinic}</span></div>
                    <div style={{ fontSize: 11, color: "#9a8d80", overflowWrap: "anywhere" }}>
                      {r.date || "—"} · {r.category}{r.qty ? ` · ${r.qty} 單位` : ""}{r.note ? ` · ${r.note}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    <span className="mono" style={{ fontSize: 14, whiteSpace: "nowrap" }}>{fmt(r.price)}</span>
                    <button className="iconbtn" title="轉為消費紀錄" onClick={() => onConvert(r)}>➜🧾</button>
                    <RowActions onEdit={() => setEditingId(r.id)} onDelete={() => h.del(r.id)} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
