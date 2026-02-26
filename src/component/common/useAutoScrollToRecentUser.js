import { useRef, useEffect } from 'react';
import { getCookeis, getUisCookie, uisCookiePos } from '../../commonModule';

/**
 * 最近操作したユーザーに自動スクロールするカスタムフック
 * 
 * @param {string} idPrefix - 要素IDのプレフィックス（例: 'user-row-'）
 * @param {number} delay - スクロールまでの遅延時間(ms)（デフォルト: 500）
 * @param {string} idSuffix - 要素IDのサフィックス（例: 'RT'）
 * @param {any[]} deps - 再スクロールをトリガーする依存配列（例: [curMonth]）
 */
export const useAutoScrollToRecentUser = (idPrefix = 'user-row-', delay = 500, idSuffix = '', deps = []) => {
  const hasScrolled = useRef(false);

  useEffect(() => {
    // 設定で自動スクロールが無効化されているかチェック
    const isDisabled = getUisCookie(uisCookiePos.notAutoScrollOnProseed) === '1';
    if (isDisabled) return;

    // 初回マウント時、または sessionStorage に forceAutoScroll フラグがある場合に実行
    const isForceScroll = sessionStorage.getItem('forceAutoScroll') === '1';
    if (!isForceScroll && hasScrolled.current) return;

    const performScroll = () => {
      // バックドロップが表示されているかチェック (クラス名 'backdrop' で判定)
      const isBackdropVisible = !!document.querySelector('.backdrop');
      if (isBackdropVisible) {
        // バックドロップがある場合は、少し待ってから再試行
        setTimeout(performScroll, 200);
        return;
      }

      const ru = getCookeis('ru');
      if (!ru) return;

      const lastUid = ru.split(',')[0];
      if (!lastUid) return;

      const elementId = idPrefix + lastUid + idSuffix;
      const element = document.getElementById(elementId);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        hasScrolled.current = true;
        // フラグを消費
        sessionStorage.removeItem('forceAutoScroll');
      }
    };

    const timeoutId = setTimeout(performScroll, delay);

    return () => clearTimeout(timeoutId);
  }, [idPrefix, delay, idSuffix, ...deps]);
};
