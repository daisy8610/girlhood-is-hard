import React, { useState, useMemo } from "react";
import { fmt } from "../lib/format";
import { SectionTitle, AddButton, RecordForm, RowActions, SearchBox, Chip } from "./ui";

const CATEGORIES = ["玻尿酸", "肉毒", "電音波", "膚質雷射", "除毛"];

const QUOTE_FIELDS = [
  { key: "date", label: "詢價日期", type: "date", default: new Date().toISOString().slice(0, 10) },
  { key: "clinic", label: "診所名稱", type: "text", required: true },
  { key: "category", label: "療程類別", type: "select", options: CATEGORIES },
  { key: "product", label: "品牌/產品", type: "text" },
  { key: "qty", label: "單位數量", type: "number" },
  { key: "price", label: "價格", type: "number", required: true },
  { key: "note", label: "備註", type: "text" },
];

const STALE_DAYS = 182; // 超過約 6 個月的報價淡化顯示

// 有填單位數量才算得出單位價
function unitPrice(r) {
  const qty = Number(r.qty), price = Number(r.price);
  return r.qty && qty > 0 && r.price != null && r.price !== "" ? price / qty : null;
}

function daysAgo(date) {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  if (isNaN(d)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((today - d) / 86400000);
}

function agoLabel(days) {
  if (days == null) return "";
  if (days <= 0) return "今天";
  if (days < 30) return `${days} 天前`;
  if (days < 365) return `${Math.floor(days / 30)} 個月前`;
  return `${Math.floor(days / 365)} 年前`;
}

const productKey = (r) => (r.category || "其他") + "|" + (r.product || "未標示");

function BestTag() {
  return (
    <span className="best-tag">最划算</span>
  );
}

function QuoteRow({ r, title, extra, best, editingId, setEditingId, h, onCopy }) {
  if (editingId === r.id) {
    return (
      <RecordForm fields={QUOTE_FIELDS} initial={r} submitLabel="更新" onCancel={() => setEditingId(null)}
        onSubmit={(patch) => { h.update(r.id, patch); setEditingId(null); }} />
    );
  }
  const days = daysAgo(r.date);
  const stale = days != null && days > STALE_DAYS;
  const up = unitPrice(r);
  return (
    <div className={"row-hover list-row" + (stale ? " is-stale" : "")}>
      <div className="list-row__main">
        <div className="list-row__title">{title}{extra && <span className="list-row__extra"> · {extra}</span>}{best && <BestTag />}</div>
        <div className="list-row__meta">
          {r.date || "—"}{days != null ? `（${agoLabel(days)}）` : ""}{r.qty ? ` · ${r.qty} 單位` : ""}{r.note ? ` · ${r.note}` : ""}
        </div>
      </div>
      <div className="list-row__side">
        <div className="list-row__prices">
          <div className="num list-row__amount">{fmt(r.price)}</div>
          {up != null && <div className="num list-row__sub-amount">{fmt(Math.round(up))}/單位</div>}
        </div>
        <button className="iconbtn" title="複製這筆，帶入新增表單" onClick={() => onCopy(r)}>⧉</button>
        <RowActions onEdit={() => setEditingId(r.id)} onDelete={() => h.del(r.id)} />
      </div>
    </div>
  );
}

export function QuotesTab({ data, h }) {
  const [view, setView] = useState("group");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("全部");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [copyDraft, setCopyDraft] = useState(null);

  function copyRow(r) {
    setEditingId(null);
    setCopyDraft({ ...r, date: new Date().toISOString().slice(0, 10) });
    setAdding(true);
  }

  // 同一產品至少兩筆近半年、有單位價的報價時，標出單位價最低的那筆
  const bestIds = useMemo(() => {
    const byProd = {};
    data.forEach((r) => {
      const up = unitPrice(r);
      const days = daysAgo(r.date);
      if (up == null || (days != null && days > STALE_DAYS)) return;
      (byProd[productKey(r)] = byProd[productKey(r)] || []).push([up, r.id]);
    });
    const ids = new Set();
    Object.values(byProd).forEach((list) => {
      if (list.length < 2) return;
      ids.add(list.reduce((a, b) => (b[0] < a[0] ? b : a))[1]);
    });
    return ids;
  }, [data]);

  const presentCats = CATEGORIES.filter((c) => data.some((r) => r.category === c));
  if (data.some((r) => !CATEGORIES.includes(r.category))) presentCats.push("其他");

  const q = search.trim().toLowerCase();
  const filtered = data.filter((r) =>
    (cat === "全部" || (r.category || "其他") === cat || (cat === "其他" && !CATEGORIES.includes(r.category))) &&
    (!q || [r.clinic, r.product, r.category, r.note].some((v) => v && String(v).toLowerCase().includes(q)))
  );

  const grouped = useMemo(() => {
    const byCat = {};
    filtered.forEach((r) => {
      const c = r.category || "其他";
      byCat[c] = byCat[c] || {};
      const prod = r.product || "未標示";
      byCat[c][prod] = byCat[c][prod] || [];
      byCat[c][prod].push(r);
    });
    // 有單位價的依單位價排前面，沒填數量的依總價排在後面
    const key = (r) => {
      const up = unitPrice(r);
      return up != null ? [0, up] : [1, r.price == null ? Infinity : Number(r.price)];
    };
    Object.values(byCat).forEach((prods) => Object.values(prods).forEach((list) => list.sort((a, b) => {
      const ka = key(a), kb = key(b);
      return ka[0] - kb[0] || ka[1] - kb[1];
    })));
    return byCat;
  }, [filtered]);

  const byClinic = useMemo(() => {
    const map = {};
    filtered.forEach((r) => { (map[r.clinic || "未標示"] = map[r.clinic || "未標示"] || []).push(r); });
    return Object.entries(map)
      .map(([clinic, list]) => {
        list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        return [clinic, list, list[0].date || ""];
      })
      .sort((a, b) => b[2].localeCompare(a[2]));
  }, [filtered]);

  const rowProps = { editingId, setEditingId, h, onCopy: copyRow };
  const empty = <div className="list-empty">找不到符合的紀錄</div>;

  return (
    <div>
      <SectionTitle sub="有填單位數量會自動算單位價，同一產品近半年最便宜的標「最划算」；超過半年的報價會變淡">詢價比較</SectionTitle>
      {!adding && <AddButton onClick={() => { setCopyDraft(null); setAdding(true); }} label="新增詢價紀錄" />}
      {adding && (
        <RecordForm fields={QUOTE_FIELDS} initial={copyDraft} submitLabel="新增" onCancel={() => { setAdding(false); setCopyDraft(null); }}
          onSubmit={(r) => { h.add(r); setAdding(false); setCopyDraft(null); }} />
      )}
      {presentCats.length > 0 && (
        <div className="chip-row quotes__cats">
          {["全部", ...presentCats].map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>
          ))}
        </div>
      )}
      <SearchBox value={search} onChange={setSearch} placeholder="搜尋診所、產品、備註…" />
      <div className="chip-row quotes__views">
        {[["group", "分組比價"], ["clinic", "依診所"], ["list", "依日期列表"]].map(([k, label]) => (
          <Chip key={k} active={view === k} onClick={() => setView(k)}>{label}</Chip>
        ))}
      </div>

      {view === "group" && (
        <div>
          {Object.entries(grouped).map(([c, prods]) => (
            <div key={c} className="quote-cat">
              <div className="title-font quote-cat__title">{c}</div>
              {Object.entries(prods).map(([prod, list]) => (
                <div key={prod} className="quote-prod">
                  <div className="quote-prod__title">
                    {prod} <span className="quote-prod__count">（{list.length} 筆）</span>
                  </div>
                  {list.map((r) => (
                    <QuoteRow key={r.id} r={r} title={r.clinic} best={bestIds.has(r.id)} {...rowProps} />
                  ))}
                </div>
              ))}
            </div>
          ))}
          {Object.keys(grouped).length === 0 && empty}
        </div>
      )}

      {view === "clinic" && (
        <div>
          {byClinic.map(([clinic, list, latest]) => (
            <div key={clinic} className="clinic-card">
              <div className="clinic-card__head">
                <div className="title-font clinic-card__name">{clinic}</div>
                <div className="clinic-card__info">
                  {list.length} 筆{latest ? ` · 最近詢價：${agoLabel(daysAgo(latest))}` : ""}
                </div>
              </div>
              {list.map((r) => (
                <QuoteRow key={r.id} r={r} title={r.product || "未標示"} extra={r.category} best={bestIds.has(r.id)} {...rowProps} />
              ))}
            </div>
          ))}
          {byClinic.length === 0 && empty}
        </div>
      )}

      {view === "list" && (
        <div className="list">
          {[...filtered].sort((a, b) => (b.date || "").localeCompare(a.date || "")).map((r) => (
            <QuoteRow key={r.id} r={r} title={r.product || "未標示"} extra={`${r.clinic} · ${r.category || "其他"}`} best={bestIds.has(r.id)} {...rowProps} />
          ))}
          {filtered.length === 0 && empty}
        </div>
      )}
    </div>
  );
}
