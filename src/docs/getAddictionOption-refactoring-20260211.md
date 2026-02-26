# getAddictionOption リファクタリング記録

- 実施日: 2026-02-11
- 対象ファイル:
  - `src/component/common/AddictionFormPartsCommon.js`
  - `src/component/common/AddictionFormParts.js`

## 概要

`AddictionFormParts.js` 内の約70個のセレクトコンポーネントに散在していたインライン `opts` 定義を、`AddictionFormPartsCommon.js` の `getAddictionOption(nameJp, stdDate, service)` 関数に集約した。

## 変更統計

- AddictionFormParts.js: 382行削除
- AddictionFormPartsCommon.js: 288行追加（switch case拡張）
- ネット: 25行削減

## 適用外（今回のスコープ外）

| コンポーネント | nameJp | 除外理由 |
|:--|:--|:--|
| JikanKubun | 時間区分 | `props.offSchool` に依存（useState + useEffect） |
| EnchouShien2024 | 延長支援 | Redux state `com?.addiction?.[service]?.時間区分延長支援自動設定` に依存 |

## getAddictionOption に追加した case 一覧

### A. 固定配列（nameJpのみで決定）

| nameJp | opts形式 |
|:--|:--|
| 地域区分 | 文字列配列（一級地〜その他） |
| 障害児状態等区分 | 文字列配列（区分１の１〜区分２の２） |
| 共生型サービス | value/label（選択） |
| 福祉専門職員配置等加算 | 文字列配列（Ⅰ〜Ⅲ） |
| 児童指導員配置加算 | value/label（選択） |
| 看護職員加配加算 | 文字列配列（Ⅰ〜Ⅱ） |
| 開所時間減算 | 文字列配列（4時間未満、4時間以上6時間未満） |
| 医療連携体制加算 | 文字列配列（Ⅰ〜Ⅴ３）※既存 |
| 身体拘束廃止未実施減算 | value/label（選択） |
| 共生型サービス体制強化加算 | 文字列配列（3種） |
| 定員超過利用減算 | value/label（選択） |
| サービス提供職員欠如減算 | 文字列配列（二ヶ月まで、三ヶ月以上） |
| 児童発達支援管理責任者欠如減算 | 文字列配列（五ヶ月未満、五ヶ月以上） |
| 福祉・介護職員処遇改善特別加算 | value/label（選択） |
| 福祉・介護職員等ベースアップ等支援加算 | value/label（選択） |
| 延長支援加算 | 文字列配列（1時間未満〜2時間以上） |
| 特別支援加算 | value/label（選択） |
| 家庭連携加算 | 文字列配列（1時間未満、1時間以上） |
| 家族支援加算Ⅰ | 文字列配列（4種）※既存 |
| 家族支援加算Ⅱ | 文字列配列（2種）※既存 |
| 訪問支援特別加算 | 文字列配列（1時間未満の場合、1時間以上の場合） |
| 利用者負担上限額管理加算 | value/label（自動/設定/設定しない） |
| 自己評価結果等未公表減算 | value/label（選択） |
| 通所支援計画未作成減算 | 文字列配列（3ヶ月未満、3ヶ月以上） |
| 支援プログラム未公表減算 | value/label（選択） |
| 医療ケア児基本報酬区分 | value/label（未選択/3点以上/16点以上/32点以上） |
| 個別サポート加算２ | value/label（選択） |
| サービス提供時間区分 | 文字列配列（区分１、区分２） |
| 食事提供加算 | 文字列配列（Ⅰ、Ⅱ） |
| 栄養士配置加算 | 文字列配列（Ⅰ、Ⅱ） |
| 地方公共団体 | value/label（選択） |
| 就学区分 | value/label（区分Ⅰ、区分Ⅱ） |
| 児童発達支援センター | value/label（選択） |
| 重症心身型 | value/label（選択） |
| サービスごと単位 | value/label（選択） |
| 児童発達支援無償化 | value/label（選択） |
| 児童発達支援無償化自動設定 | value/label（選択） |
| 多子軽減措置 | 文字列配列（第二子軽減、第三子軽減） |
| 保育訪問 | 文字列配列（保訪、複数支援） |
| 訪問支援員特別加算 | value/label（選択） |
| 初回加算 | value/label（選択） |
| 特地加算 | value/label（選択） |
| 送迎加算Ⅰ一定条件 | value/label（選択） |
| 算定時間設定方法 | value/label（自動/半自動/手動） |
| 虐待防止措置未実施減算 | value/label（選択） |
| 業務継続計画未策定減算 | value/label（選択） |
| 情報公表未報告減算 | value/label（選択） |
| 中核機能強化加算 | value/label（Ⅰ/Ⅱ/Ⅲ） |
| 中核機能強化事業所加算 | value/label（選択） |
| 専門的支援体制加算 | value/label（選択） |
| 子育てサポート加算 | value/label（選択） |
| 専門的支援実施加算 | value/label（選択） |
| 視覚聴覚言語機能障害児支援加算 | value/label（選択） |
| 入浴支援加算 | value/label（選択） |
| 集中的支援加算 | value/label（選択） |
| 個別サポート加算３ | value/label（選択） |
| 事業所間連携加算 | value/label（Ⅰ/Ⅱ） |
| 自立サポート加算 | value/label（選択） |
| 通所自立支援加算 | value/label（片道/往復） |
| 強度行動障害児支援加算９０日以内 | value/label（選択） |
| 多職種連携支援加算 | value/label（選択） |
| ケアニーズ対応加算 | value/label（選択） |
| 訪問支援員特別加算24 | value/label（特別加算Ⅰ/Ⅱ） |
| 時間区分延長支援自動設定 | value/label（3種） |
| 個別サポートⅠ１設定 | value/label（2種） |
| 特別地域加算 | value/label（選択） |
| 医療的ケア児基本報酬 | value/label（選択） |
| 医療的ケア児延長支援 | value/label（選択） |
| 強度行動障害児支援加算無効化 | value/label（無効化） |
| 送迎加算設定 | value/label（9種） |

### B. stdDate / service 分岐あり

| nameJp | 分岐条件 | 概要 |
|:--|:--|:--|
| 基準該当 | service | HOUDAY→選択、JIHATSU→基準該当児発Ⅰ/Ⅱ |
| 児童指導員等加配加算 / （Ⅰ） | stdDate | 2024-04-01以降→5種、以前→3種 |
| 関係機関連携加算 | stdDate + service | HOHOU→選択、2024以降→4種、以前→2種 ※既存 |
| 事業所内相談支援加算 | stdDate | 2024以前→value/label形式、以降→文字列形式 |
| 強度行動障害児支援加算 | stdDate + service | 2024以前→選択、HOUDAY→2種、他→選択 |
| 保育・教育等移行支援加算 | stdDate | 2024以前→選択、以降→入所中/退所後 |
| 欠席時対応加算 | stdDate + service | 2024以降→選択、HOUDAY旧→2種、他→選択 |
| 人工内耳装用児支援加算 | service | HOUDAY→選択、JIHATSU→2種 |
| 特定処遇改善加算 | service | HOHOU以外→2種、HOHOU→選択 |
| 専門的支援加算 | service | HOUDAY→選択、他→2種 |
| 個別サポート加算１ | stdDate + service | 2024以前→選択、HOUDAY→3種、JIHATSU→選択 |
| 福祉・介護職員処遇改善加算 | stdDate + service | 最複雑。HOHOU/非HOHOU × 日付範囲で6パターン |

## 検証結果

### 検証1: nameJp重複チェック — PASS

- 家庭連携加算: KateiRenkeiNum（数値入力版、optsなし）とKateiRenkei（セレクト版）の2つ → 問題なし
- 事業所内相談支援加算: JigyousyoSoudan（pre-2024）とSoudanShien（全期間）の2つ → stdDateで出し分け対応済み

### 検証2: case網羅チェック — PASS

全コンポーネントのnameJpに対応するcaseがswitch内に存在することを確認。
除外対象の「時間区分」「延長支援」は意図的にcaseなし（default: 選択 が適用される）。

### 検証3: ShoguuKaizenロジック完全一致 — PASS

6つの配列定義（syoguuStd, syoguuStdHohou, syoguu5, syoguu5Hohou, syoguu20251001, syoguuBefore）の全要素と、全分岐条件（HOHOU/非HOHOU × 日付範囲4パターン）が原本と完全一致。

### 検証4: 変換漏れチェック — PASS

`const opts = [` のインライン定義残存は1件のみ（JikanKubun = スコープ外）。他はコメント行のみ。

### 検証5: 構文チェック — PASS

- ESLint: エラー0件
- 括弧バランス: 両ファイルとも `()`, `[]`, `{}` 全て完全バランス

### 検証6: 引数整合性チェック — PASS（軽微指摘4件）

全45箇所の getAddictionOption 呼び出しを検証。必要引数の欠落は0件。
不要引数の付与（無害）が4件:

| コンポーネント | 現在の呼び出し | 最適な呼び出し | 備考 |
|:--|:--|:--|:--|
| JigyousyoSoudan | (nameJp, stdDate, service) | (nameJp, stdDate) | serviceは関数内で未使用 |
| JinkouNaiji | (nameJp, stdDate, service) | (nameJp, '', service) | stdDateは関数内で未使用 |
| TokuteiSyoguu | (nameJp, stdDate, service) | (nameJp, '', service) | stdDateは関数内で未使用 |
| SenmonShien | (nameJp, stdDate, service) | (nameJp, '', service) | stdDateは関数内で未使用 |

全て関数内で無視されるため機能的影響なし。

### 検証7: JiShidouKaHai1 nameJp動的割り当て — PASS

コンポーネント内で `nameJp` が `stdDate` により動的に設定される:
- stdDate >= 2024-04-01 → '児童指導員等加配加算'
- stdDate < 2024-04-01 → '児童指導員等加配加算（Ⅰ）'

switch文で両方のcaseをfall-throughで処理。いずれのパスでも正しいoptsが返却されることを確認。

## 注意事項

- 事業所内相談支援加算の SoudanShien コンポーネントは、元々stdDateによらず常に文字列配列を使用していたため、`getAddictionOption(nameJp)` とstdDateを渡さない形にしている（JigyousyoSoudanは `getAddictionOption(nameJp, stdDate, service)` でvalue/label形式を返す）
- ShoguuKaizen（福祉・介護職員処遇改善加算）の最終else分岐に `[syoguu20251001, ...syoguuBefore]` というネスト配列を返す箇所がある。これは原本通りの移植だが、意図的な仕様かバグかは要確認
