# Tales Runner UMT Map Manager

一個用於管理《跑 Online / Tales Runner》玩家自製地圖 (UMT) 的桌面應用程式。

**Developed by [Porygon](https://github.com/Porygon20)**

## 功能

- 📋 **地圖清單** — 從 Google Sheets 自動讀取地圖資料庫，顯示所有可用的 UMT 地圖
- 🔍 **搜尋與篩選** — 以關鍵字搜尋地圖，篩選已安裝 / 未安裝狀態
- 📥 **一鍵安裝** — 直接從 Google Drive 下載 `.upk` 地圖檔案並安裝到指定資料夾
- 🗑️ **安全移除** — 根據安裝記錄安全刪除地圖，不會影響其他檔案
- 📊 **可自訂欄位** — 自由選擇及調整表格中顯示的欄位（顯示名稱、地圖ID、分類、作者等）
- 🌐 **多語言** — 支援 English、繁體中文（香港/台灣）、한국어
- 🐛 **Debug Panel** — 內建除錯面板，即時顯示安裝進度及錯誤資訊

## 安裝

下載最新的安裝檔：

- **Windows**: `Tales Runner UMT Map Manager_x.x.x_x64-setup.exe` (NSIS) 或 `.msi`

## 使用方法

### 1. 啟動應用程式

安裝後開啟應用程式，會自動從 Google Sheets 載入地圖清單。

### 2. 瀏覽地圖

- 左側表格顯示所有可用地圖
- 使用頂部搜尋框以關鍵字篩選
- 使用 `全部` / `已安裝` / `未安裝` 按鈕篩選狀態
- 點擊地圖查看右側詳細資料面板

### 3. 安裝地圖

1. 找到想安裝的地圖
2. 點擊 `安裝` 按鈕
3. 程式會自動從 Google Drive 下載 `.upk` 檔案
4. 下載完成後自動複製到地圖資料夾
5. 底部 Debug Panel 會顯示即時進度

### 4. 移除地圖

1. 找到已安裝的地圖（狀態顯示「已安裝」）
2. 點擊 `移除` 按鈕
3. 確認後程式會安全刪除該地圖檔案

### 5. 設定

點擊右上角 `設定` 按鈕可調整：

| 設定 | 說明 |
|------|------|
| **安裝資料夾** | 地圖檔案存放位置，預設為 `Documents\跑Online\UMT` |
| **Google Sheets URL** | 地圖資料庫來源，預設為官方 Database for html 分頁 |
| **語言** | 介面語言選擇 |
| **顯示欄位** | 自訂表格中顯示的欄位及順序（▲▼ 調整順序，✕ 移除，+ 新增） |

## 技術架構

- **前端**: React + TypeScript + Vite
- **後端**: Rust (Tauri v2)
- **資料來源**: Google Sheets CSV Export
- **下載**: Google Drive direct download
- **安裝檔**: NSIS / MSI (Windows)

## 資料來源

地圖資料庫由以下成員共同建立及維護：

- **幻紫OAO** (Read: 왕지OAO / หว่างจี๋OAO / WaanJiOAO)
- **puihong62871**
- **TaiwanPro**

應用程式開發：**Porygon**

> ⚠️ 本應用程式不擁有地圖資料庫。地圖資料歸上述成員及各創作者所有。
> 使用者可於 **設定 → Google Sheets URL** 自行更改資料來源。

詳細資料來源文件：[Google Docs](https://docs.google.com/document/d/1A58tWn9h94VHtBmlC5YpmSG1ve42pg4zH4vHZghJiuk/edit?tab=t.0)

### 提交新地圖

想新增地圖到資料庫？請填寫此表單：

👉 [提交新地圖](https://docs.google.com/forms/d/e/1FAIpQLScLfPEDOoMfQj9bKD6E0JB-YNDS-HN2YCmUu323kz312acwFQ/viewform)

## 開發

```bash
# 安裝依賴
npm install

# 開發模式
npm run tauri dev

# 建置 Windows 安裝檔
npm run tauri build
```

## License

For personal and community use. Map data belongs to their respective creators.
