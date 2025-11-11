# SheetEasy

一個使用 Vite + React + TypeScript 建構的「快速看譜」練習工具，專注於高音譜號與低音譜號的音符辨識。玩家可以透過鍵盤快捷鍵快速作答，答錯的題目會自動記錄並提供錯題練習模式，協助建立屬於自己的錯題庫。

## 功能特色

- 🎵 即時產生含有高音或低音譜號的五線譜，並隨機放置一個音符。
- ⌨️ 以 Q / W / E / R 對應四個選項（A、B、C、D），按下空白鍵快速提交答案進入下一題。
- 📊 即時統計總答題數、答對數與正確率。
- ❌ 答錯時會醒目顯示正確答案，並自動加入錯題庫。
- 🔁 錯題練習模式支援以錯題出題，幫助針對弱項加強練習（資料儲存在瀏覽器的 Local Storage）。
- 🚀 透過 GitHub Actions 自動部署至 GitHub Pages。

## 開發指令

```bash
npm install
npm run dev # 啟動開發伺服器
npm run build # 建置生產版本
npm run preview # 預覽建置成果
```

## 鍵盤操作

- `Q / W / E / R`：選擇答案
- `Space`：提交答案並切換下一題

## 部署

專案預設使用 GitHub Actions 自動部署到 GitHub Pages。在儲存庫設定中，請將 Pages 的來源設定為「GitHub Actions」。
