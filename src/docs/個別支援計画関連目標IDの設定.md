# 個別支援計画関連目標IDの設定

- 実施日: 2026-02-12
- 対象ファイル:
  - `src/component/plan/utility/groupRowIdUtils.js`
  - `src/component/plan/PlanPersonalSupport.js`
  - `src/component/plan/PlanPersonalSupportHohou.js`
  - `src/component/plan/PlanSenmonShien.js`

## 概要

`支援目標` グループの各行に対して、行ごとの識別子を安定的に付与する処理を追加した。  
入れ替え時に行番号のみ更新され、行固有IDは不変になるように設計している。

## ID仕様

- ID形式: `UID-created-開始日-lineNo-LineID`
- 日付形式: `created` / `開始日` は `yyyymmdd`
- 桁数:
  - `lineNo`: 2桁ゼロ埋め
  - `LineID`: 2桁ゼロ埋め

例:

- `u123-20260212-20260201-01-01`
- `u123-20260212-20260201-02-03`

## 行データに追加されるキー

- `ID`: 表示順を含む最終ID
- `LineNo`: 現在の並び順に応じた番号（可変）
- `LineID`: 行固有番号（不変）

## 振る舞い

### 1) 初回採番

- `LineID` が未設定の行は、既存行と重複しない最小の番号を採番する。
- `LineNo` は配列順で `01` から再採番する。
- 上記をもとに `ID` を組み立てる。

### 2) 行の入れ替え

- 行の順序変化に合わせて `LineNo` のみ再計算する。
- `LineID` は維持する。
- `ID` は新しい `LineNo` を反映して再生成される。

### 3) 行の追加・削除

- 追加時: 新規行に未使用 `LineID` を採番する。
- 削除時: 残行の `LineNo` を再計算し、`ID` を更新する。

### 4) 日付・UID変更

- `UID` / `作成日` / `開始日` が変わった場合、`ID` の先頭要素を再計算する。
- `LineID` は維持する。

## 実装ポイント

- 共通ヘルパー `syncGroupRowStableIds(...)` を `src/component/plan/utility/groupRowIdUtils.js` に配置。
- 日付変換は `src/modules/dateUtils.js` の `formatDate`（および `parseDate`）を利用。
- 各画面では以下の2段で適用:
  - 画面内 `useEffect` で `支援目標` のID状態を同期
  - `handleSubmit` 実行前に再同期して保存データを正規化

## 対象画面

- `PlanPersonalSupport`
- `PlanPersonalSupportHohou`
- `PlanSenmonShien`

## 注意事項

- 行データに `ID` / `LineNo` / `LineID` が追加されるため、帳票や外部連携で行オブジェクトを厳密比較している処理がある場合は差分として検知される可能性がある。
- `LineID` は2桁で保存するため、`99` を超える行数運用は別途仕様確認が必要。
