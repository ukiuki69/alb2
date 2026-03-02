# 変更履歴

過去の履歴は src/docs/oldlog.txt を参照してください。

---

<!-- 新しい履歴をここに追記してください -->

## rev.3435 2026/03/02
### 変更ファイル
- component/plan/planMakePrompt.js
- component/plan/planLlmUtils.js（新規）
- component/plan/planLlmUtils.test.js（新規）
- component/plan/planPromptBuilders.js（新規）
- component/plan/planPromptBuilders.test.js（新規）
- component/plan/PlanConferenceNote.js
- component/plan/PlanMonitoring.js
- component/plan/PlanPersonalSupport.js
- component/plan/PlanPersonalSupportHohou.js
- component/plan/PlanSenmonShien.js
- component/Users/TimeTable/UsersTimeTable.js
- component/Users/UsersTransfer.js（新規）
- component/Users/Users.js
- component/schedule/SchUpperLimit.js
- modules/permissionCheck.js
- App.js

### 主な変更内容
1. planMakePrompt リファクタリング: 重複ロジックを planLlmUtils / planPromptBuilders に抽出しユニットテスト追加
2. Plan各フォーム（ConferenceNote / Monitoring / PersonalSupport / PersonalSupportHohou）に未保存変更の離脱警告ダイアログを追加
3. PlanMonitoring・UsersTimeTable に電子サイン表示（開発者限定）を追加
4. permissionCheck: `permissionIsDev` 関数追加・`contants.PERMISSION_DEVELOPER` 参照修正
5. UsersTransfer: 他事業所からのユーザー移管機能を新規実装（ルート・メニュー登録、開発者権限）
6. SchUpperLimit: `cities.find(...)?.dokujiJougen` optional chaining でクラッシュ修正

### 取り込まれたdev側の変更
- なし

## rev.3434 2026/03/01
### 変更ファイル
- component/Users/TimeTable/UsersTimeTable.js
- component/Users/TimeTable/UsersTimeTableEdit.js
- component/Users/TimeTable/UsersTimeTableEditOld.js
- component/Users/TimeTable/UsersTimeTableBatchEdit.js
- component/Users/TimeTable/UsersTimeTableBatchEditOld.js
- component/Users/TimeTable/UsersTimeTableCommon.js
- component/plan/PlanSetting.js

### 主な変更内容
1. 計画支援時間: /plan/timetable 起点の遷移で /users/timetable/ に戻ってしまう問題を修正（全 TimeTable ファイルのパスをプレフィックス動的生成に変更）
2. 計画支援時間の編集・一括編集画面から LinksTab を非表示
3. 送信後のページ遷移を削除（送信後は画面に留まる）
4. PlanSetting: チェックボックス間に checkBoxWrap による余白を追加

### 取り込まれたdev側の変更
- なし

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
