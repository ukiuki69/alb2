# 変更履歴

過去の履歴は src/docs/oldlog.txt を参照してください。

---

<!-- 新しい履歴をここに追記してください -->

## rev.3444 2026/03/11
### 変更ファイル
- src/component/Users/UserHistNav.js（新規）
- src/component/Users/utils/userDiff.js（新規）
- src/component/Users/UserEdit2026.js
- src/component/plan/PlanMonitoring.js
- src/component/plan/PlanMonitoringHohou.js
- src/component/plan/PlanMonitoringSenmon.js
- src/component/plan/PlanPersonalSupport.js
- src/component/plan/PlanPersonalSupportHohou.js
- src/component/plan/PlanSenmonShien.js
- src/component/plan/PlanSetting.js

### 主な変更内容
1. UserHistNav 新規追加: 利用者の修正履歴を年月テキストで横並び表示するコンポーネント。最大7件を最新順で表示し現在レコードを青色ボルドで強調。クリックで前バージョンとの差分ダイアログ（利用者名 さん YYYY年MM月の変更点）を表示
2. userDiff 新規追加: 2つのユーザーオブジェクトを再帰的に比較するユーティリティ。etc 配下・片側 null でも再帰対応
3. UserEdit2026: UserHistNav を修正履歴欄に組み込み（thisUser.date を基準に強調表示）・将来日付の変更時に「以降にも反映するか」ダイアログを追加
4. PlanMonitoring: 電子サイン依頼チェックボックスを実施日直下に移動・signUrl を personalSupportContent からマージするよう修正
5. PlanMonitoringHohou: 電子サイン依頼チェックボックス・サイン画像表示を追加（isDev 条件）・signUrl を personalSupportContent から取得
6. PlanMonitoringSenmon / PlanPersonalSupport / PlanPersonalSupportHohou / PlanSenmonShien: signUrl が content 外に格納されている問題を修正し、originInputs のみにマージして inputs（保存用）には含めない形に統一
7. PlanSetting: isDev ガードをコメントアウトし全ユーザーがアクセス可能に

### 取り込まれたdev側の変更
- なし

## rev.3443 2026/03/10
### 変更ファイル
- src/component/Users/UserRegistrationMonthEditor.js（新規）
- src/component/Users/Users.js
- src/component/Users/UsersTransfer.js
- src/component/common/commonParts.js
- src/component/reports/Sheets/PersonalSupportHohouSheet.js
- src/App.js
- .gitignore

### 主な変更内容
1. UserRegistrationMonthEditor 新規追加: fetchUsersHist で次月以降に登録された利用者を取得し、「複写」または「登録変更」で当月付に移動するコンポーネント。sendUsersIndex で全利用者の sindex を一括更新。App.js にルート（/users/regmonth）登録
2. usersExtMenu に「利用者登録月変更」を追加、UsersTransfer のラベルを「他事業所からの利用者コピー」に修正
3. commonParts ExtMenu: ドロップダウン幅を auto + min-content に変更・MenuItem に nowrap 追加（長いラベルの折り返し防止）
4. PersonalSupportHohouSheet: 留意事項を支援目標ごとに表示（テーブル行・スマホカード両対応、記載がない場合は非表示）
5. .gitignore: json.json を除外

### 取り込まれたdev側の変更
- なし

## rev.3442 2026/03/09
### 変更ファイル
- src/component/Users/GradeAdvanceHandler.js

### 主な変更内容
1. GradeAdvanceHandlerInner: 動作条件をパーミッション90以上に制限（parsePermission でパーミッションを取得し、90未満の場合は null を返す）

### 取り込まれたdev側の変更
- なし

## rev.3441 2026/03/09
### 変更ファイル
- src/component/Billing/blMakeData2024.js
- src/component/Users/UserEdit2026.js
- src/component/Users/UserEdit2026Parts.js
- src/component/Users/hooks/useKanaInput.js（新規）
- src/component/Users/utils/upperLimitUtils.js（新規）
- src/component/Users/utils/userEditSubmit.js
- src/modules/addictionUtils.js

### 主な変更内容
1. blMakeData2024: kihongensan（基本減算）を syoguu（処遇改善加算）より前に処理するよう itemTotal をソートし、2回の syoguuKaizenAndSantei 呼び出し間での userSanteiTotal 不整合（ichiwari ≠ userSanteiTotal × 0.1）を解消（stdDate >= 2026-02-01 の場合のみ適用）
2. blMakeData2024: ソート比較関数を数値優先度ベースに修正（推移律を満たさない return 0 多用を解消、優先度: 0:tokuchi → 1:kihongensan → 2:その他 → 3:syoguu）
3. UserEdit2026 加算読み書きを ByUserAddictionNoDialog と統一: schedule（今月）を優先して読み込み、マルチサービス時に etc.addiction も更新するよう変更
4. カナ入力・上限管理ユーティリティをフック/ファイルに分割リファクタリング（useKanaInput → hooks/useKanaInput.js、上限管理 → upperLimitUtils.js）
5. useKanaInput: systemrole とプロンプト両方に「ひらがなのみ出力」を明示し、カタカナ混入問題を修正

### 取り込まれたdev側の変更
- なし

## rev.3440 2026/03/07
### 変更ファイル
- .gitignore
- package.json
- scripts/log-server.js（新規）
- src/App.js
- src/component/Users/GradeAdvanceHandler.js（新規）
- src/component/Users/UsersTransfer.js
- src/component/Users/Users.js
- src/component/Users/UserEdit2026Parts.js
- src/component/Users/utils/userEditValidation.js
- src/component/common/ConfirmPayment.js
- src/component/common/StdFormParts.js
- src/component/plan/PlanItemShared.js
- src/component/reports/Reports.js
- src/index.js

### 主な変更内容
1. 開発環境ログサーバー: index.js で console.log/warn/error をローカルサーバー(port 3099)に転送、`npm run dev` スクリプト追加
2. GradeAdvanceHandler 新規追加: 04-01時に児童発達支援→放課後等デイサービス切替ダイアログを表示するコンポーネント、App.js に登録
3. UsersTransfer: 「移管」→「コピー」へ文言変更、タイポ修正
4. 仮設定ボタン案内文言統一: UserEdit2026Parts / StdFormParts / userEditValidation のエラーメッセージを「仮設定はボタンで設定」に統一
5. ConfirmPayment: 電話番号更新
6. PlanItemShared: PlanItemBadge に showFullDate prop 追加
7. Reports.js: スマホSheetビュー表示時に padding 4px 追加

### 取り込まれたdev側の変更
- なし

## rev.3439 2026/03/07
### 変更ファイル
- src/DrowerMenu.js
- src/component/plan/PlanManegement.js
- src/component/plan/usePlanExpiry.js

### 主な変更内容
1. 計画期限アイコン修正: 期限切れ（overdue）書類がある場合もサイドバーアイコンが赤くなるよう修正・ツールチップに「期限切れ N件」追加
2. 計画期限ダイアログ改善: 利用者氏名16px・詳細13pxに拡大、右上に緑丸×閉じるボタン追加（50%はみ出し）
3. Warning修正: Button `color="error"`（MUI v4非対応）を削除、usePlanExpiry に isMounted ガード追加

### 取り込まれたdev側の変更（3438）
1. PlanManegement スマホ対応: 利用者一覧→書類一覧の2段階表示、*Sheet コンポーネントへ遷移
2. Reports.js スマホ対応: モバイル時に printPreview/printCntRoot 除去・Sheet のみ表示
3. UserEdit2026: 保存ボタン下マージン60px・加算設定/兄弟追加ボタン廃止・multiService初期値修正
4. UsersTransfer ソート修正: selectedOrder.order 設定あり→sortUsersAsync、なし→sindex最大値+10刻み付与
5. Sheets スマホ対応: PersonalSupport/Assessment/Monitoring/ConferenceNote/SenmonShien/PersonalSupportHohou 各Sheetにモバイル表示実装
6. DomainBadges 新規追加: 五領域バッジコンポーネントを共通化

## rev.3437 2026/03/03
### 変更ファイル
- component/Users/UserEdit2026.js
- component/Users/UserEdit2026Parts.js
- component/Users/Users.js
- component/Users/UsersTransfer.js
- component/Users/useGetUsersService.js
- component/Users/utils/userEditValidation.js
- component/common/ChangeServeceCrasroom.js
- component/common/StdFormParts.js
- component/reports/TeikyouJisseki2024.js
- src/rules/command.md

### 主な変更内容
1. 受給者証番号3桁手入力禁止: バリデーションを「エラー表示＋値クリア」に統一（UserEdit2026Parts / userEditValidation / StdFormParts）
2. UsersTransfer UI改善: 単一事業所時の「データなし」表示・ボタン配置変更・テーブルヘッダーマスク追加・accountState安全取得
3. Users.js: `ユーザー移管`を`usersExtMenu`として`usersMenu`から分離し`LinksTab`に`extMenu`で渡す
4. service null クラッシュ修正（useGetUsersService / ChangeServeceCrasroom）
5. 提供実績カウントロジック修正（TeikyouJisseki2024）: 欠席でも表示項目がある行を正しくカウント
6. UserEdit2026: 管理事業所・加算ボタンの minWidth 拡張・左揃えスタイル追加

### 取り込まれたdev側の変更
- なし

## rev.3436 2026/03/02
### 変更ファイル
- src/rules/command.md

### 主な変更内容
1. 障害調査メモ追記: ahduserレコード消失事象の調査内容を記録
2. UserEdit2026 / UserEditNoDialog での削除ガード調査指示を追記

### 取り込まれたdev側の変更
- なし

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
