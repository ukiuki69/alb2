/**
 * SideToolBar などUI要素の表示制御用カスタムイベントユーティリティ
 *
 * 使い方:
 *   - ダイアログを開く直前に hideSideToolBar() を呼ぶ
 *   - ダイアログを閉じたあとに showSideToolBar() を呼ぶ
 *   - SideToolBar 側は useSideToolBarVisibility() で表示制御
 *
 * 他のダイアログでも同じ問題が発生したら hideSideToolBar / showSideToolBar を追加するだけ。
 */
import { useState, useEffect } from 'react';

const SIDEBAR_VISIBILITY_EVENT = 'sideToolBarVisibility';

export const hideSideToolBar = () =>
  window.dispatchEvent(new CustomEvent(SIDEBAR_VISIBILITY_EVENT, { detail: false }));

export const showSideToolBar = () =>
  window.dispatchEvent(new CustomEvent(SIDEBAR_VISIBILITY_EVENT, { detail: true }));

export const useSideToolBarVisibility = () => {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const handler = (e) => setVisible(e.detail);
    window.addEventListener(SIDEBAR_VISIBILITY_EVENT, handler);
    return () => window.removeEventListener(SIDEBAR_VISIBILITY_EVENT, handler);
  }, []);
  return visible;
};
