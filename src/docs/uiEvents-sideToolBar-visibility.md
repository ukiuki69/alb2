# SideToolBar 非表示制御ユーティリティ

- 作成日: 2026-02-25
- 対象ファイル: `src/modules/uiEvents.js`

## 背景・問題

アプリ内のダイアログ表示時に、左サイドバー（`SideToolBar`）が backdrop に隠れず手前に表示されてしまう問題が偏在している。

z-index の操作で解決しようとすると、`NoActivityDetector` をはじめとする他コンポーネントとの競合が発生し、連鎖的な問題を引き起こすため採用しない。

## 解決方針

ダイアログ側がカスタムイベントを dispatch し、SideToolBar 側がそれを受け取って自身を非表示にする。

- z-index 変更なし
- ポーリング（setInterval）なし
- React の useEffect で宣言的に管理

## 提供する API

```js
import { hideSideToolBar, showSideToolBar, useSideToolBarVisibility } from '../modules/uiEvents';
```

### `hideSideToolBar()`
SideToolBar を非表示にするよう要求する。ダイアログを開く直前に呼ぶ。

### `showSideToolBar()`
SideToolBar を再表示する。ダイアログを閉じた後に呼ぶ。

### `useSideToolBarVisibility(): boolean`
SideToolBar 側で使うフック。`false` のとき SideToolBar は `return null` する。

## ダイアログ側の使い方

```js
import { hideSideToolBar, showSideToolBar } from '../../modules/uiEvents';

// ダイアログ開閉 state を監視して hide/show を dispatch する
useEffect(() => {
  if (dialogOpen) {
    hideSideToolBar();
    return () => showSideToolBar(); // 閉じた時 or アンマウント時に自動で戻す
  }
}, [dialogOpen]);
```

`return () => showSideToolBar()` を書いておくことで：
- ダイアログを `onClose` で閉じた時
- ユーザーが別ページへ遷移した時（コンポーネントアンマウント）

のどちらでも SideToolBar が自動的に再表示される。

## SideToolBar 側（実装済み・変更不要）

`DrowerMenu.js` の `SideToolBar` コンポーネントに既に組み込み済み。

```js
const sidebarVisible = useSideToolBarVisibility();
// ...
if (!sidebarVisible) return null;
```

## 適用済みの箇所

| ファイル | ダイアログ |
|---------|-----------|
| `component/plan/PlanManegement.js` | 計画期限一覧ダイアログ |

## 新しいダイアログへの横展開手順

1. `import { hideSideToolBar, showSideToolBar } from '../../modules/uiEvents';` を追加
2. ダイアログ開閉の state（例: `someDialogOpen`）を監視する useEffect を追加：

```js
useEffect(() => {
  if (someDialogOpen) {
    hideSideToolBar();
    return () => showSideToolBar();
  }
}, [someDialogOpen]);
```

SideToolBar 側への変更は不要。
