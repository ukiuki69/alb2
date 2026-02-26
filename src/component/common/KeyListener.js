import React, { useEffect, useState } from 'react';
import { getUisCookie, uisCookiePos } from '../../commonModule';

// KeyListener コンポーネントは、キーボードイベントを監視し、
// 同時に押されたキーと特殊キー（Shift、Control）の状態を親コンポーネントに伝達します。
// setKeyInfo プロパティを通じて親コンポーネントから制御されるため、KeyListener 自体は状態を持たず、表示されません。

export const KeyListener = ({ setKeyInfo }) => {
  // キーボードショートカットの無効化
  const disabledKbShortCut = getUisCookie(uisCookiePos.kbShortCutDisabled) === '1';

  useEffect(() => {

    // キーボードイベントを処理する関数
    const handleKeyDown = (event) => {
      // キーボードショートカットの無効化
      if (disabledKbShortCut) return false;
      // フォームが開いているときは操作しない →変更
      // if (qslct('form')) return false;
      // 作業中断のエレメント検出
      if (document.querySelector('#noactivity')) return false;
      // 一時的な中断blockScreenのエレメント検出
      if (document.querySelector('#blockScreen')) return false;
      // formまたはその子要素がフォーカスを持ってるときは無効
      if (document.activeElement.closest('form')) return false;
      if (document.activeElement.tagName.toLocaleUpperCase() === 'INPUT') return false;
      if (document.activeElement.tagName.toLocaleUpperCase() === 'TEXTAREA') return false;
      if (document.activeElement.tagName.toLocaleUpperCase() === 'SELECT') return false;

        // マテリアルUIのselectがアクティブの場合
      if (document.activeElement.classList.contains("MuiSelect-select")) return false;
        // マテリアルUIのselectのアイテムリストがアクティブの場合
      if (document.activeElement.classList.contains("MuiListItem-root")) return false;
        // マテリアルUIダイアログがアクティブの場合
      if (document.activeElement.classList.contains("MuiDialog-container")) return false;
      const { key, shiftKey, ctrlKey, metaKey} = event;
      // console.log(
      //   `Key pressed: ${key}, Shift: ${shiftKey}, Control: ${ctrlKey}, Meta: ${metaKey}`
      // );
      setKeyInfo({
        key: key,
        shift: shiftKey,
        ctrl: ctrlKey,
        meta: metaKey,
      });
    };

    // キーボードイベントリスナーを追加
    window.addEventListener('keydown', handleKeyDown);

    // キーボードイベントリスナーをクリーンアップ
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setKeyInfo]);

  // コンポーネントは表示されません
  return null;
};


