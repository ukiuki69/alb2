# planMakePrompt.js リファクタリング調査レポート

- 作成日: 2026-02-25
- 対象ファイル: `src/component/plan/planMakePrompt.js`（1,066行）

---

## 1. 現状の構造

### エクスポート関数（5つ）

| 関数名 | 行 | 用途 | 出力形式 |
|--------|-----|------|---------|
| `generateComprehensivePlan` | 10-442 | 個別支援計画の新規生成・修正 | `{長期目標, 短期目標, 支援方針, 支援目標[]}` → setInputs |
| `generateConferenceNoteFromAssessmentAndDraft` | 445-640 | アセスメント＋原案 → 会議議事録 | `{議事録, 修正, 課題}` → return のみ |
| `generateMonitoring` | 642-789 | モニタリング考察の生成 | `{長期目標, 短期目標, 本人の希望, ご家族の希望, 支援経過[]}` → setInputs |
| `generatePlanReviewProposal` | 791-917 | 計画見直し提案 | `{議事録, 修正, 課題}` → setInputs + return |
| `generateConferenceNoteFromMonitoringAndAssessment` | 919-1065 | モニタリング＋変更点 → 議事録 | `{議事録, 修正, 課題}` → setInputs + return |

### 各関数が持つ責務（問題の根源）

各関数が以下をすべて単独で担っている：

1. データ整形（入力をプロンプト用テキストに変換）
2. プロンプト文字列の構築（最大 ~130行のテンプレートリテラル）
3. LLM API 呼び出し（`llmApiCall`）
4. レスポンスのパース（`safeParse`）
5. UI 状態更新（`setInputs`, `setSnack`）

### プロンプト行数

| 関数 | プロンプト行数 |
|------|-------------|
| `generateComprehensivePlan` | 約130行（行228-360） |
| `generateConferenceNoteFromAssessmentAndDraft` | 約35行（行548-582） |
| `generateMonitoring` | 約45行（行680-723） |
| `generatePlanReviewProposal` | 約30行（行832-859） |
| `generateConferenceNoteFromMonitoringAndAssessment` | 約30行（行974-998） |

---

## 2. 重複コードの一覧

| 重複箇所 | 定義場所 | 件数 |
|----------|----------|------|
| `safeParse` | 関数2・3・4・5 の各関数内でローカル定義 | 4箇所 |
| `normalizeDomainLabel` | `generateComprehensivePlan` 内・`generateConferenceNoteFromAssessmentAndDraft` 内 | 2箇所 |
| 支援目標整形（`supportGoalsText` + `planSummary`の構築） | `generatePlanReviewProposal` と `generateConferenceNoteFromMonitoringAndAssessment` | 2箇所 |
| 「議事録・修正・課題」の反映ロジック | 関数 2・4・5 の末尾 | 3箇所 |
| `contentStr` 取得パターン（`res.data.response \|\| res.data.content`） | 全5関数 | 5箇所 |

---

## 3. 呼び出し側の不統一

呼び出しファイル：
- `PlanPersonalSupport.js`
- `PlanPersonalSupportHohou.js`
- `PlanMonitoring.js`
- `PlanConferenceNote.js`

### 不統一点①：`await` の有無が混在（`generateComprehensivePlan`）

| ファイル | 行 | await |
|---------|-----|-------|
| PlanPersonalSupport.js | 1382 | なし |
| PlanPersonalSupportHohou.js | 1181 | なし |
| PlanPersonalSupportHohou.js | 203, 206 | あり |

### 不統一点②：`user` の渡し方が2系統

| 関数 | 渡し方 |
|------|--------|
| `generateComprehensivePlan` | `uid` + `users`（関数内で `getUser()` を呼ぶ） |
| `generateConferenceNoteFromAssessmentAndDraft` | `uid` + `users`（関数内で `getUser()` を呼ぶ） |
| `generateMonitoring` | `user`（呼び出し側で解決済みのオブジェクト） |
| `generatePlanReviewProposal` | `user`（呼び出し側で解決済みのオブジェクト） |
| `generateConferenceNoteFromMonitoringAndAssessment` | `user`（呼び出し側で解決済みのオブジェクト） |

### 不統一点③：`setInputs` の責務が関数によってバラバラ

| 関数 | setInputs の場所 | 戻り値 |
|------|----------------|--------|
| `generateComprehensivePlan` | 関数内 | なし |
| `generateMonitoring` | 関数内 | なし |
| `generatePlanReviewProposal` | 関数内 | あり（重複） |
| `generateConferenceNoteFromMonitoringAndAssessment` | 関数内 | あり（呼び出し側は未使用） |
| `generateConferenceNoteFromAssessmentAndDraft` | 呼び出し側（PlanConferenceNote.js） | あり |

### 不統一点④：未使用インポート

`PlanConferenceNote.js` が `generatePlanReviewProposal` をインポートしているが、実際には一度も呼ばれていない。

---

## 4. リファクタリング提案

### 提案するファイル構成

```
src/component/plan/
├── planMakePrompt.js         ← 大幅に簡潔化（プロンプト構築に特化）
├── planLlmUtils.js           ← 新規：LLM共通処理（parse・呼び出しラッパー）
└── planPromptBuilders.js     ← 新規：データ→テキスト変換（整形ユーティリティ）
```

### planLlmUtils.js（新規）

```js
// safeParse の共通化（現在4箇所に重複）
export const safeParseLlmJson = (text) => { ... };

// contentStr取得の共通化（現在5箇所に重複）
const extractContent = (res) => res?.data?.response || res?.data?.content || '';

// LLM呼び出し＋パースをひとまとめにしたラッパー
export const callLlmJson = async ({ prompt, max_tokens, model, hid, bid, date, llmItem, errorCode }, setSnack) => {
  const res = await llmApiCall(...);
  const contentStr = extractContent(res);
  if (!contentStr) return null;
  const obj = safeParseLlmJson(contentStr);
  if (!obj) { setSnack?.({ msg: 'LLM応答の解析に失敗しました', severity: 'error' }); return null; }
  return obj;
};
```

### planPromptBuilders.js（新規）

```js
export const normalizeDomainLabel = (label) => { ... };      // 現在2箇所に重複
export const buildSupportGoalsText = (personalSupport) => { ... }; // 現在2箇所に重複
export const buildPlanSummary = (personalSupport) => { ... };      // 現在2箇所に重複
export const groupByFiveDomains = (entries, inputDefinitions) => { ... };
export const formatLifeHistory = (assessment) => { ... };
export const buildFiveDomainChecks = (assessment) => { ... };
```

### 呼び出し規約の統一（呼び出し側で対応が必要）

| 項目 | 現状 | 統一後 |
|------|------|--------|
| `user` の解決 | 関数内 or 呼び出し側（混在） | 呼び出し側で `getUser()` して渡す |
| `await` | あり/なし（混在） | 常に `await` する |
| `setInputs` の責任 | 関数内 or 呼び出し側（混在） | 呼び出し側に統一 |
| 戻り値 | あり/なし（混在） | 常にパース済みオブジェクトを返す |

### 変更規模

| 変更 | 影響 |
|------|------|
| `planLlmUtils.js` 新規作成 | 破壊的変更なし（新ファイル） |
| `planPromptBuilders.js` 新規作成 | 破壊的変更なし（新ファイル） |
| `planMakePrompt.js` リファクタリング | エクスポートするAPI（関数名）は変更しない |
| 呼び出し側 4ファイル | 引数の統一・await 追加が必要 |

---

## 5. 実施順序（案）

1. **Step 1**：`planLlmUtils.js` を作成して `safeParse` と `callLlmJson` を抽出（最小リスク）
2. **Step 2**：`planPromptBuilders.js` を作成して整形ユーティリティを移動
3. **Step 3**：`planMakePrompt.js` を各関数ごとに整理（プロンプト構築に特化）
4. **Step 4**：呼び出し側 4ファイルの引数・await を統一
5. **Step 5**：`PlanConferenceNote.js` の未使用インポート（`generatePlanReviewProposal`）を削除
