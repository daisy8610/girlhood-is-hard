import { createClient } from "@supabase/supabase-js";

// 連線設定放在網站根目錄的 config.js，執行期用 window.SUPA_CFG 帶進來，
// 這樣不用重新打包就能換 Supabase 專案。
const CFG = (typeof window !== "undefined" && window.SUPA_CFG) || {};

export const supa = CFG.url && CFG.anonKey
  ? createClient(CFG.url, CFG.anonKey)
  : null;
