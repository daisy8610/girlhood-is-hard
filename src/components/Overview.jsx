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
        background: "#fff", color: "var(--ed-ink)",
        border: "1px solid var(--ed-stone)", borderRadius: "var(--r-lg)", padding: "20px 20px 18px", marginBottom: 20,
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 10px" }}>
          <div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--ed-smoke)", fontWeight: 400 }}>今年累積支出</div>
            <div className="mono" style={{ fontSize: "var(--fs-4xl)", fontWeight: 500 }}>{fmt(totals.ytd)}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--ed-smoke)", fontWeight: 400 }}>歷年總支出</div>
            <div className="mono" style={{ fontSize: "var(--fs-4xl)", fontWeight: 500 }}>{fmt(totals.all)}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--ed-smoke)", fontWeight: 400 }}>年度預算上限</div>
            <div className="mono" style={{ fontSize: "var(--fs-2xl)", fontWeight: 500, color: "var(--ed-smoke)" }}>{fmt(cap)}</div>
          </div>
          <div>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--ed-smoke)", fontWeight: 400 }}>剩餘額度</div>
            <div className="mono" style={{ fontSize: "var(--fs-2xl)", fontWeight: 500, color: "var(--ed-smoke)" }}>{fmt(remaining)}</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 4, background: "var(--ed-stone)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: pct + "%", background: "var(--ed-ink)" }} />
          </div>
          <div style={{ fontSize: "var(--fs-xs)", color: "var(--ed-ash)", marginTop: 6, textAlign: "right" }} className="mono">已花 {pct}% of {fmt(cap)}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 24 }}>
        {sorted.map(([k, v]) => (
          <div key={k} style={{ border: "1px solid var(--ed-stone)", borderRadius: "var(--r-lg)", padding: 14, background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: "var(--r-sm)", background: MAIN_COLORS[k] || "var(--ed-ash)" }} />
              <span style={{ fontSize: "var(--fs-md)", color: "var(--ed-smoke)", fontWeight: 400 }}>{k}</span>
            </div>
            <div className="mono" style={{ fontSize: "var(--fs-2xl)", fontWeight: 500, marginTop: 6 }}>{fmt(v)}</div>
          </div>
        ))}
      </div>

      <TrendChart spending={spending} />
      <SubcategoryRanking spending={spending} />
      <VouchersPanel data={vouchers} h={voucherH} />
    </div>
  );
}
