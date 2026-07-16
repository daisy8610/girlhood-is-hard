# 當女生好難 · 美容存摺

個人的美容／醫美消費與預算追蹤 App。手機加到主畫面後，使用起來就像一個原生 App。

🔗 **網址**：https://daisy8610.github.io/girlhood-is-hard/

---

## 這是什麼

一個記錄美容、醫美消費，順便管理預算和詢價比較的私人小工具。原本資料放在 Notion，
覺得 Notion 在手機上不夠直覺，所以做成獨立的網頁 App。

### 功能
- 📔 **總覽**：分類支出統計、近 12 個月趨勢圖、預算使用進度、儲值金與剩餘堂數
- 🧾 **消費紀錄**：搜尋、篩選、新增／編輯／刪除
- 🎯 **預算計畫**：逐項規劃、打勾標記完成、記錄實際花費
- 💉 **詢價比較**：同一產品跨診所比價，自動標示最低價
- 🩺 **筆記區**：保養／健康相關的長文筆記，支援簡單 markdown（表格、清單、粗體）
- ⚙️ **設定**：年度預算上限、備份／還原（JSON）、清空資料

---

## 技術架構

- **前端**：React（打包成單一 `app.js`，用 esbuild 建置），純手機優先的介面設計
- **後端／資料庫**：[Supabase](https://supabase.com)（PostgreSQL + Auth）
- **部署**：GitHub Pages（純靜態網站，這個 repo 本身）

資料表：`expenses`（消費）、`quotes`（詢價）、`budget_plans`（預算計畫）、
`notes`（筆記）、`vouchers`（儲值金堂數）、`providers`（店家／診所）、`profiles`（個人設定）。
全部啟用 Row Level Security，只有登入本人能讀寫自己的資料。

---

## 隱私

這個 repo 是 Public，但**不含任何個人資料**：
- 網頁程式碼（`app.js`）只是純粹的介面邏輯，不夾帶任何消費紀錄、筆記內容
- 所有實際資料只存在 Supabase 後台，受帳號登入與 Row Level Security 保護
- `config.js` 裡的 `anon key` 設計上就是給前端公開使用的值，搭配 RLS 沒有安全疑慮

---

## 本機開發／更新

原始碼在 `src/app.jsx`（如果有上傳到這個 repo 的話）。修改後重新打包：

```bash
npx esbuild src/app.jsx --bundle --minify --loader:.jsx=jsx \
  --define:process.env.NODE_ENV='"production"' --outfile=app.js
```

把打包好的 `app.js` 覆蓋上傳到這個 repo 即可，網址不會變、GitHub Pages 會自動重新部署。

---

*個人專案，非公開服務。*
