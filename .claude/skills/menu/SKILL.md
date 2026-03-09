---
name: menu
description: 指示ファイルのメニューを表示・実行する。引数なしでメニュー表示、番号指定で対応するファイルの指示を実行。
---

## メニュー

| 番号 | 項目名 |
|------|--------|
| 1 | 通常指示 |
| 2 | 単純コミット |
| 3 | コミット・マージ・更新記録 |

`/menu <番号>` で対応する指示を実行します。例: `/menu 1`

---

## 実行

ARGUMENTS: $ARGUMENTS

$ARGUMENTS が空または未指定の場合は上記メニューを表示してユーザーの入力を待つ。

$ARGUMENTS が `1` の場合:
`/Users/yukih/react/albatrosshd/src/rules/command.md` を読み込み、ファイル冒頭から `----- 以下は過去ログなので無視してください -----` の行の直前までを「現在のタスク」として解釈し実行する。

$ARGUMENTS が `2` の場合:
`/Users/yukih/react/albatrosshd/src/rules/commitOneStep.md` を読み込み、記載の手順を実行する。

$ARGUMENTS が `3` の場合:
`/Users/yukih/react/albatrosshd/src/rules/commit.md` を読み込み、記載の手順を実行する。
