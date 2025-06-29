# SIE平台 - 品牌AI能見度洞察

這是一個基於 React 的品牌分析平台，使用 Gemini AI API 來分析品牌在網路上的能見度和提及率。

## 功能特色

- 🔍 **熱門問題分析**: 自動識別行業中最常被詢問的問題
- 📊 **品牌提及率比較**: 分析品牌與競爭對手的網路提及次數
- ✅ **資訊正確度評估**: 比對AI回應與官方描述的覆蓋率
- 📈 **視覺化圖表**: 使用 Recharts 呈現分析結果
- 🏷️ **問題分類**: 自動將問題分類為不同類型（價格型、比較型等）

## 安裝與執行

### 前置需求
- Node.js 16+ 
- npm 或 yarn

### 安裝步驟

1. 安裝依賴套件：
```bash
npm install
```

2. 設定環境變數：
建立 `.env` 檔案並加入您的 Gemini API Key：
```
REACT_APP_GEMINI_API_KEY=your_api_key_here
```

3. 啟動開發伺服器：
```bash
npm start
```

4. 開啟瀏覽器訪問 `http://localhost:3000`

## 使用方式

1. 輸入行業類別（如：智慧型手機）
2. 輸入您的品牌名稱
3. 輸入競爭對手（以逗號分隔）
4. 輸入品牌官方標準描述
5. 點擊「開始分析」按鈕

## 技術架構

- **前端框架**: React 18
- **UI 套件**: Tailwind CSS
- **圖表庫**: Recharts
- **圖示**: Lucide React
- **AI API**: Google Gemini 2.0 Flash

## 專案結構

```
src/
├── App.jsx          # 主要應用組件
├── index.js         # 應用入口
└── index.css        # 全域樣式
```

## 注意事項

- 需要有效的 Gemini API Key 才能正常運作
- 分析結果基於 AI 預估，僅供參考
- 建議在生產環境中加強錯誤處理和安全性