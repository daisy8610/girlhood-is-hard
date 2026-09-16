import React from "react";
import { fmt, MAIN_COLORS } from "../lib/format";
import { TrendChart } from "./TrendChart";
import { SubcategoryRanking } from "./SubcategoryRanking";
import { VouchersPanel } from "./VouchersPanel";

export function Overview({ totals, cap, spending, vouchers, voucherH }) {
  const sorted = Object.entries(totals.byMain).sort((a, b) => b[1] - a[1]);
  const pct = Math.min(100, Math.round((totals.ytd / cap) * 100));
  const remaining = cap - totals.ytd;

  return (
    <div className="ed-sans">
      {/* 存摺卡片 */}
      <div style={{
        background: "#fff", color: "#000",
        border: "1px solid #EBE8E4", borderRadius: 20, padding: "20px 20px 18px", marginBottom: 20,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 10px" }}>
          <div>
            <div style={{ fontSize: 11, color: "#777169", fontWeight: 300 }}>今年累積支出</div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 500 }}>{fmt(totals.ytd)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#777169", fontWeight: 300 }}>歷年總支出</div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 500 }}>{fmt(totals.all)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#777169", fontWeight: 300 }}>年度預算上限</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: "#777169" }}>{fmt(cap)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#777169", fontWeight: 300 }}>剩餘額度</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 500, color: "#777169" }}>{fmt(remaining)}</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 4, background: "#EBE8E4", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ height: "100%", width: pct + "%", background: "#000" }} />
          </div>
          <div style={{ fontSize: 10.5, color: "#A59F97", marginTop: 6, textAlign: "right" }} className="mono">已花 {pct}% of {fmt(cap)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 24 }}>
        {sorted.map(([k, v]) => (
          <div key={k} style={{ border: "1px solid #EBE8E4", borderRadius: 14, padding: 14, background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: 8, background: MAIN_COLORS[k] || "#999" }} />
              <span style={{ fontSize: 12.5, color: "#777169", fontWeight: 300 }}>{k}</span>
            </div>
            <div className="mono" style={{ fontSize: 18, fontWeight: 500, marginTop: 6 }}>{fmt(v)}</div>
          </div>
        ))}
      </div>

      <TrendChart spending={spending} />
      <SubcategoryRanking spending={spending} />
      <VouchersPanel data={vouchers} h={voucherH} />
    </div>
  );
}
