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
- ⚙️ **設定**：年度預算上限、備份／還原（JSON）、清空資料、Google 日曆連結
- 📅 **Google 日曆同步**：連結後，新增「預算計畫」項目（有填日期）會自動在 Google 日曆建一筆全天事件

---

## 專案結構

```
├── index.html          網頁入口
├── app.js              打包後的執行檔（GitHub Pages 實際載入這個）
├── config.js            Supabase 連線設定（url + anon key）
├── manifest.json        PWA 設定，讓手機能「加到主畫面」
├── icon-*.png            App 圖示
├── package.json
├── supabase/
│   ├── config.toml       Edge Function 設定（哪幾支不驗證 JWT）
│   └── functions/
│       ├── google-oauth-start/      導向 Google 授權畫面
│       ├── google-oauth-callback/   收授權碼、換 token、存起來
│       └── google-calendar-sync/    實際呼叫 Calendar API 新增事件
└── src/                  原始碼
    ├── main.jsx          進入點
    ├── App.jsx           主要畫面邏輯、導覽列、狀態管理
    ├── lib/
    │   ├── supabaseClient.js   Supabase client 初始化
    │   ├── db.js               資料層：App 欄位 <-> 資料庫 schema 轉換、CRUD
    │   ├── format.js           格式化、下載、CSV 工具
    │   ├── backup.js           JSON 備份格式驗證
    │   └── markdown.jsx        筆記內文的輕量 markdown 渲染器
    └── components/
        ├── ui.jsx              共用小元件（Tag、表單、按鈕…）
        ├── AuthScreen.jsx      登入/註冊
        ├── Overview.jsx        總覽頁
        ├── TrendChart.jsx      趨勢圖表
        ├── VouchersPanel.jsx   儲值金／堂數面板
        ├── SpendingTab.jsx     消費紀錄
        ├── BudgetTab.jsx       預算計畫
        ├── QuotesTab.jsx       詢價比較
        ├── NotesTab.jsx        筆記區
        ├── MoreMenu.jsx        「更多」選單
        └── SettingsPage.jsx    設定頁
```

---

## 技術架構

- **前端**：React 18，esbuild 打包成單一 `app.js`
- **後端／資料庫**：[Supabase](https://supabase.com)（PostgreSQL + Auth + Edge Functions）
- **部署**：GitHub Pages（純靜態網站，這個 repo 本身）
- **Google 日曆整合**：Supabase Edge Functions 處理 OAuth 授權與 Calendar API 呼叫，
  Client ID/Secret 等敏感資訊存在 Supabase Function Secrets，不進 repo

資料表：`expenses`（消費）、`quotes`（詢價）、`budget_plans`（預算計畫）、
`notes`（筆記）、`vouchers`（儲值金堂數）、`providers`（店家／診所）、`profiles`（個人設定）、
`google_calendar_tokens`（Google 日曆授權，只有 Edge Function 用 service role 讀寫）。
全部啟用 Row Level Security，只有登入本人能讀寫自己的資料。

---

## 隱私

這個 repo 是 Public，但**不含任何個人資料**：
- 原始碼與打包後的 `app.js` 只是純粹的介面邏輯，不夾帶任何消費紀錄、筆記內容
- 所有實際資料只存在 Supabase 後台，受帳號登入與 Row Level Security 保護
- `config.js` 裡的 `anonKey` 設計上就是給前端公開使用的值，搭配 RLS 沒有安全疑慮

---

## 本機開發／更新

```bash
npm install       # 安裝依賴
npm run build     # 打包成 app.js
```

改完程式碼、`npm run build` 之後，把新的 `app.js` 連同改過的 `src/` 一起
commit、push 上去即可，GitHub Pages 會自動重新部署，網址不會變。

如果改到 `supabase/functions/` 底下的 Edge Function，前端的 push 不會自動部署它，
要另外手動跑（哪支改了就跑哪支）：

```bash
supabase functions deploy google-oauth-start
supabase functions deploy google-oauth-callback
supabase functions deploy google-calendar-sync
```

---

*個人專案，非公開服務。*
