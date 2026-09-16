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
      <div className="passbook">
        <div className="passbook__grid">
          <div>
            <div className="passbook__label">今年累積支出</div>
            <div className="mono passbook__big">{fmt(totals.ytd)}</div>
          </div>
          <div>
            <div className="passbook__label">歷年總支出</div>
            <div className="mono passbook__big">{fmt(totals.all)}</div>
          </div>
          <div>
            <div className="passbook__label">年度預算上限</div>
            <div className="mono passbook__small">{fmt(cap)}</div>
          </div>
          <div>
            <div className="passbook__label">剩餘額度</div>
            <div className="mono passbook__small">{fmt(remaining)}</div>
          </div>
        </div>
        <div className="passbook__progress">
          <div className="bar-track bar-track--thin">
            <div className="bar-fill passbook__fill" style={{ width: pct + "%" }} />
          </div>
          <div className="mono passbook__caption">已花 {pct}% of {fmt(cap)}</div>
        </div>
      </div>

      <div className="main-cards">
        {sorted.map(([k, v]) => (
          <div key={k} className="main-card">
            <div className="main-card__head">
              <span className="main-card__dot" style={{ background: MAIN_COLORS[k] || "var(--ed-ash)" }} />
              <span className="main-card__name">{k}</span>
            </div>
            <div className="mono main-card__amount">{fmt(v)}</div>
          </div>
        ))}
      </div>

      <TrendChart spending={spending} />
      <SubcategoryRanking spending={spending} />
      <VouchersPanel data={vouchers} h={voucherH} />
    </div>
  );
}
