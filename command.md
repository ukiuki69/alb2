# @PlanAssessmentに準拠した新しい入力コンポーネントの作成
## 概要
- inputDefinitionsに準拠して入力項目を作成します
- 基本的には @PlanAssessmentDetail.js のように作成します


## 注意点
- 配列入力を行う「支援目標」は1項目が1行に収まらないので複数行で記述する
- 新しいプロパティ multiline: true を追加する textfield をmultilineにする
- 新しいプロパティ checkboxは単一のチェックボックスを作成する
- 新しいプロパティ checkboxesは複数のチェックボックスを作成する
- checkboxesの場合は、[label]: {[souce0]: true, [souce1]: false} のように値を記述する

レンダリング部分やイベントのコードを見直してください
