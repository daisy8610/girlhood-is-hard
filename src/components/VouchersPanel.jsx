import React, { useState } from "react";
import { fmt } from "../lib/format";
import { RecordForm, RowActions } from "./ui";

const VOUCHER_FIELDS = [
  { key: "name", label: "名稱", type: "text" },
  { key: "value", label: "剩餘數值", type: "number" },
  { key: "unit", label: "單位", type: "select", options: ["元", "堂", "次"] },
  { key: "updated", label: "更新日期", type: "date", default: new Date().toISOString().slice(0, 10) },
  { key: "note", label: "備註", type: "text" },
];

export function VouchersPanel({ data, h }) {
  const [editingId, setEditingId] = useState(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="vouchers">
      <div className="vouchers__head">
        <div className="panel-label">儲值金與剩餘堂數</div>
        {!adding && (
          <button className="iconbtn vouchers__add" onClick={() => setAdding(true)}>
            + 新增
          </button>
        )}
      </div>
      {adding && (
        <RecordForm fields={VOUCHER_FIELDS} submitLabel="新增" onCancel={() => setAdding(false)}
          onSubmit={(r) => { h.add(r); setAdding(false); }} />
      )}
      <div className="vouchers__grid">
        {data.map((r) =>
          editingId === r.id ? (
            <div key={r.id} className="vouchers__editing">
              <RecordForm fields={VOUCHER_FIELDS} initial={r} submitLabel="更新" onCancel={() => setEditingId(null)}
                onSubmit={(patch) => { h.update(r.id, patch); setEditingId(null); }} />
            </div>
          ) : (
            <div key={r.id} className="voucher">
              <div className="voucher__head">
                <div className="panel-label">{r.name}</div>
                <RowActions onEdit={() => setEditingId(r.id)} onDelete={() => h.del(r.id)} />
              </div>
              <div className="voucher__body">
                <div className="mono voucher__value">
                  {r.value == null ? "？" : r.unit === "元" ? fmt(r.value) : r.value}
                  {r.unit !== "元" && r.value != null && <span className="voucher__unit">{r.unit}</span>}
                </div>
                {r.value != null && r.value > 0 && r.unit !== "元" && (
                  <button
                    className="iconbtn voucher__use"
                    title="扣一次"
                    onClick={() => h.update(r.id, { value: r.value - 1, updated: new Date().toISOString().slice(0, 10) })}
                  >
                    − 用一次
                  </button>
                )}
              </div>
              <div className="voucher__meta">{r.updated || "—"}{r.note ? ` · ${r.note}` : ""}</div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
