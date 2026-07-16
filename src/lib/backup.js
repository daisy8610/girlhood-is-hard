export const BACKUP_KEYS = ["spending", "quotes", "budget", "notes", "vouchers"];

export const BACKUP_LABELS = {
  spending: "消費紀錄",
  quotes: "詢價比較",
  budget: "預算計畫",
  notes: "筆記",
  vouchers: "儲值/堂數",
};

const EXPECTED_FIELDS = {
  spending: ["date", "item", "amount"],
  quotes: ["clinic", "price", "product"],
  budget: ["item", "budget", "status"],
  notes: ["title", "category"],
  vouchers: ["name", "value"],
};

// 只接受這個 App 自己匯出的備份格式，格式不符就拒絕匯入，避免資料亂掉。
export function validateBackup(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "檔案內容不是這個 App 的備份格式";
  }
  for (const k of BACKUP_KEYS) {
    if (!Array.isArray(payload[k])) {
      return `備份檔缺少「${BACKUP_LABELS[k]}」資料，可能不是這個 App 匯出的檔案`;
    }
  }
  for (const k of BACKUP_KEYS) {
    const arr = payload[k];
    if (arr.length > 0) {
      const row = arr[0];
      if (typeof row !== "object" || row === null) {
        return `「${BACKUP_LABELS[k]}」的資料列格式不正確`;
      }
      if (!EXPECTED_FIELDS[k].some((f) => f in row)) {
        return `「${BACKUP_LABELS[k]}」的欄位結構與本 App 不符，拒絕匯入以免資料亂掉`;
      }
    }
  }
  return null;
}
