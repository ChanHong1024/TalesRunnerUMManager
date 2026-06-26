# Microsoft Store 上架指南

## App 資訊

| 項目 | 值 |
|------|-----|
| Package Identity Name | `Porygon.TalesRunnerUMTMapManager` |
| Publisher | `CN=3D60E132-4ACB-4BCE-8A03-CAF332B16733` |
| Version | `0.1.1.0` |

## 打包流程

### 快速打包（推薦）
```bash
bash scripts/build-msix.sh
```

### 手動打包

#### Step 1: Build release exe
```bash
npx tauri build --bundles none
```

#### Step 2: 準備 staging 目錄
```
msix-staging/
├── AppxManifest.xml          (由 Package.appxmanifest 改名)
├── Tales Runner UMT Map Manager.exe
└── icons/
    ├── StoreLogo.png          (50×50)
    ├── Square44x44Logo.png    (44×44)
    ├── Square71x71Logo.png    (71×71)
    ├── Square150x150Logo.png  (150×150)
    ├── Wide310x150Logo.png    (310×150)
    └── SplashScreen.png       (620×300)
```

#### Step 3: 用 makeappx.exe 打包
```powershell
# 注意：要用 MSYS_NO_PATHCONV=1 或 PowerShell
& "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\makeappx.exe" pack /v /h SHA256 /d "msix-staging" /p "Tales.Runner.UMT.Map.Manager_0.1.1.0_x64.msix" /o
```

#### Step 4: 簽署（測試用）
```powershell
# 建立自簽名證書（只需要做一次）
New-SelfSignedCertificate -Type Custom -Subject 'CN=3D60E132-4ACB-4BCE-8A03-CAF332B16733' -KeyUsage DigitalSignature -FriendlyName 'Tales Runner UMT Map Manager' -CertStoreLocation 'Cert:\CurrentUser\My' -TextExtension @('2.5.29.37={text}1.3.6.1.5.5.7.3.3', '2.5.29.19={text}')

# 簽署 MSIX
& "C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64\signtool.exe" sign /fd SHA256 /sha1 <CERT_THUMBPRINT> "Tales.Runner.UMT.Map.Manager_0.1.1.0_x64.msix"
```

## 上傳到 Partner Center

1. 登入 https://partner.microsoft.com
2. 選擇你嘅 App → **Packages**
3. Upload `.msix` 檔案
4. 填寫 **Store listing**：
   - 描述（中英文）
   - 截圖（至少 1 張，1366×768 或 1920×1080）
   - 分類（建議 Games > Utilities）
   - 隱私權政策 URL：https://chanhong1024.github.io/TalesRunnerUMTManager/privacy-policy.html
5. 送出認證（1-3 個工作天）

## Store Listing 需要準備嘅嘢

| 項目 | 說明 |
|------|------|
| App 圖示 | ✅ 已有（StoreLogo.png 等） |
| 截圖 | ⏳ 需要截圖（1366×768） |
| 描述 | ⏳ 中英文各一份 |
| 隱私權政策 | ✅ https://chanhong1024.github.io/TalesRunnerUMTManager/privacy-policy.html |
| 分類 | 建議：Games > Utilities |

## 注意事項

- MSIX 要求 4 段版本號（`0.1.1.0`）
- Publisher CN 必須同 Partner Center 一致
- Sideload 測試前要先信任證書（certutil -addstore TrustedPeople cert.cer）
- Store 會自動幫你簽署最終版本，上傳時嘅簽署只係用嚟驗證身份
- 每次版本更新都要改 Package.appxmanifest 入面嘅 Version