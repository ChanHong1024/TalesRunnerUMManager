# Microsoft Store 上架指南

## 準備工作

### 1. 註冊 Microsoft Partner Center
- 去 https://partner.microsoft.com 註冊
- 個人帳號免費，公司帳號需要商業驗證

### 2. 建立 App Reservation
- Partner Center → Apps and games → New product → **MSIX or packaged app**
- 搵一個未被使用嘅 App 名稱
- 記低 **Package Identity Name**（例如 `Porygon.TalesRunnerUMTMapManager`）
- 記低 **Publisher ID**（例如 `CN=ABC123`）

### 3. 下載 MSIX Packaging Tool
```powershell
# 喺 Microsoft Store 安裝
# 或者用 winget
winget install Microsoft.MSIXPackagingTool
```

## 打包流程

### Step 1: Build MSI installer
```bash
npx tauri build --bundles msi
```

### Step 2: 用 MSIX Packaging Tool 轉換
1. 開啟 MSIX Packaging Tool
2. 選擇 **Application package**
3. 選擇 **Create package from MSI**
4. 選擇 `src-tauri/target/release/bundle/msi/Tales Runner UMT Map Manager_0.1.1_x64_en-US.msi`
5. 填入 Package information:
   - **Package name**: `Porygon.TalesRunnerUMTMapManager`（用 Partner Center 搵到嘅）
   - **Publisher**: `CN=XXXXXXX`（用 Partner Center 搵到嘅）
   - **Version**: `0.1.1.0`（MSIX 要 4 段版本號）
6. 儲存 `.msixbundle` 檔案

### Step 3: 上傳到 Partner Center
1. Partner Center → 你嘅 App → **Packages**
2. Upload `.msixbundle` 檔案
3. 填寫 Store listing（描述、截圖、分類）
4. 送出認證（1-3 個工作天）

## Store Listing 需要準備嘅嘢

| 項目 | 說明 |
|------|------|
| App 圖示 | 300x300 PNG (Store logo) |
| 截圖 | 至少 1 張，1366x768 或 1920x1080 |
| 描述 | 中英文各一份 |
| 隱私權政策 | 需要一個 URL（可以用 GitHub Pages） |
| 分類 | 建議：Games > Utilities 或 Developer tools |

## 注意事項

- MSIX 要求 4 段版本號（0.1.1.0）
- Publisher CN 必須同 Partner Center 一致
- 未簽署嘅 MSIX 可以 sideload 測試
- Store 會自動幫你簽署最終版本
