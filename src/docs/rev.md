# 変更履歴

過去の履歴は src/docs/oldlog.txt を参照してください。

---

<!-- 新しい履歴をここに追記してください -->

## rev.3433 2026/03/01
### 変更ファイル
- component/Users/utils/userEditSubmit.test.js
- component/Users/utils/__fixtures__/createParams.js
- component/Users/utils/__fixtures__/userFixtureHelpers.js
- .gitignore

### 主な変更内容
1. userEditSubmit のユニットテスト追加（submitUserEdit / kanriChk の正常系・エラー系・散らしテスト）
2. テスト用フィクスチャヘルパー（createParams / userFixtureHelpers）を新規作成
3. .gitignore に src/testData/ を追加（実データをバージョン管理から除外）

### 取り込まれたdev側の変更
- なし

## rev.3432 2026/02/27
### 変更ファイル
- component/reports/Sheets/PersonalSupportSheet.js
- component/reports/Sheets/MonitoringSheet.js
- component/reports/Sheets/PersonalSupportHohouSheet.js
- component/Users/UserEdit2026.js
- component/Users/UserEdit2026Parts.js
- component/schedule/SchUpperLimit.js

### 主な変更内容
1. 帳票署名欄（個別支援計画・モニタリング・方法論）のスペーサーを128px→64pxに縮小し児童発達支援管理責任者エリアを拡大
2. UserEdit2026の管理事業所・利用者別加算ボタン幅をminWidth:210pxで統一
3. HnoTextField: キーストロークごとに親onChangeを呼び出し3桁でロックされるバグを修正
4. SchUpperLimit: 独自上限管理助成額（dokujiHojo）入力フィールドを追加

### 取り込まれたdev側の変更
- なし
<!-- フォーマット例:

## rev.3432 YYYY/MM/DD
### 変更ファイル
- component/xxx.js

### 主な変更内容
1. xxx

### 取り込まれたdev側の変更
- なし

-->
