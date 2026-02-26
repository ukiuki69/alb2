import React, { useState, useEffect, useCallback, useRef } from 'react';
import {Button} from '@material-ui/core';

/**
 * ブラウザ通知用のカスタムフック
 * OSレベルでの通知を管理し、権限の要求、通知の送信、設定の管理を行う
 */
export const useNotification = () => {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPageActive, setIsPageActive] = useState(!document.hidden);
  const notificationRef = useRef(null);

  // ブラウザが通知をサポートしているかチェック
  useEffect(() => {
    const supported = 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
      setIsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // ページの可視性を監視
  useEffect(() => {
    const handleVisibilityChange = () => {
      const hidden = document.hidden;
      setIsPageActive(!hidden);
      console.log('ページ可視性変更:', hidden ? '非アクティブ' : 'アクティブ');
    };

    // 初期状態を設定
    setIsPageActive(!document.hidden);
    
    // イベントリスナーを追加
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 通知権限を要求
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      throw new Error('このブラウザは通知をサポートしていません');
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setIsEnabled(result === 'granted');
      return result;
    } catch (error) {
      console.error('通知権限の要求に失敗しました:', error);
      throw error;
    }
  }, [isSupported]);

  // 基本的な通知を送信
  const showNotification = useCallback((title, options = {}) => {
    if (!isEnabled) {
      console.error('通知権限が許可されていません');
      throw new Error('通知権限が許可されていません');
    }

    try {
      // 既存の通知を閉じる
      if (notificationRef.current) {
        notificationRef.current.close();
      }

      console.log("showNotification 開始", { title, options, isEnabled, permission });
      
      // アイコンなしで通知オプションを設定
      const safeOptions = {
        body: options.body || '',
        tag: options.tag || 'default',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        ...options
      };

      // アイコン関連のプロパティを明示的に削除
      delete safeOptions.icon;
      delete safeOptions.badge;
      delete safeOptions.image;

      console.log("通知オプション:", safeOptions);
      
      // 新しい通知を作成
      const notification = new Notification(title, safeOptions);

      console.log("通知オブジェクト作成成功:", notification);

      // 通知の参照を保存
      notificationRef.current = notification;

      // 通知のイベントリスナーを設定
      notification.onclick = (event) => {
        console.log("通知クリックイベント");
        event.preventDefault();
        window.focus();
        if (options.onClick) {
          options.onClick(event);
        }
        notification.close();
      };

      notification.onclose = () => {
        console.log("通知クローズイベント");
        if (options.onClose) {
          options.onClose();
        }
        notificationRef.current = null;
      };

      notification.onshow = () => {
        console.log("通知表示イベント");
        if (options.onShow) {
          options.onShow();
        }
      };

      notification.onerror = (error) => {
        console.error('通知エラー:', error);
        if (options.onError) {
          options.onError(error);
        }
      };

      return notification;
    } catch (error) {
      console.error('通知の送信に失敗しました:', error);
      throw error;
    }
  }, [isEnabled, permission]);

  // スマート通知（ページの状態に応じて表示方法を変更）
  const showSmartNotification = useCallback((title, options = {}) => {
    console.log('スマート通知開始:', { title, options, isPageActive, isEnabled });
    
    if (!isEnabled) {
      console.error('通知権限が許可されていません');
      throw new Error('通知権限が許可されていません');
    }

    if (isPageActive) {
      // ページがアクティブの場合はコンソールに表示
      console.log('📢 通知（ページアクティブ）:', title);
      console.log('📝 内容:', options.body || '内容なし');
      console.log('🏷️ タグ:', options.tag || 'default');
      
      // オプションで強制表示を許可
      if (options.forceShow) {
        console.log('強制表示オプションが有効です');
        return showNotification(title, options);
      }
      
      return null;
    } else {
      // ページが非アクティブの場合は通知を表示
      console.log('📢 通知（ページ非アクティブ）:', title);
      return showNotification(title, options);
    }
  }, [isEnabled, isPageActive, showNotification]);

  // 成功通知
  const showSuccessNotification = useCallback((title, message) => {
    console.log("showSuccessNotification 呼び出し:", { title, message });
    return showNotification(title, {
      body: message,
      tag: 'success',
      requireInteraction: false
    });
  }, [showNotification]);

  // スマート成功通知
  const showSmartSuccessNotification = useCallback((title, message, forceShow = false) => {
    console.log("showSmartSuccessNotification 呼び出し:", { title, message, forceShow });
    return showSmartNotification(title, {
      body: message,
      tag: 'success',
      requireInteraction: false,
      forceShow
    });
  }, [showSmartNotification]);

  // エラー通知
  const showErrorNotification = useCallback((title, message) => {
    console.log("showErrorNotification 呼び出し:", { title, message });
    return showNotification(title, {
      body: message,
      tag: 'error',
      requireInteraction: true
    });
  }, [showNotification]);

  // スマートエラー通知
  const showSmartErrorNotification = useCallback((title, message, forceShow = false) => {
    console.log("showSmartErrorNotification 呼び出し:", { title, message, forceShow });
    return showSmartNotification(title, {
      body: message,
      tag: 'error',
      requireInteraction: true,
      forceShow
    });
  }, [showSmartNotification]);

  // 警告通知
  const showWarningNotification = useCallback((title, message) => {
    console.log("showWarningNotification 呼び出し:", { title, message });
    return showNotification(title, {
      body: message,
      tag: 'warning',
      requireInteraction: false
    });
  }, [showNotification]);

  // スマート警告通知
  const showSmartWarningNotification = useCallback((title, message, forceShow = false) => {
    console.log("showSmartWarningNotification 呼び出し:", { title, message, forceShow });
    return showSmartNotification(title, {
      body: message,
      tag: 'warning',
      requireInteraction: false,
      forceShow
    });
  }, [showSmartNotification]);

  // 情報通知
  const showInfoNotification = useCallback((title, message) => {
    console.log("showInfoNotification 呼び出し:", { title, message });
    return showNotification(title, {
      body: message,
      tag: 'info',
      requireInteraction: false
    });
  }, [showNotification]);

  // スマート情報通知
  const showSmartInfoNotification = useCallback((title, message, forceShow = false) => {
    console.log("showSmartInfoNotification 呼び出し:", { title, message, forceShow });
    return showSmartNotification(title, {
      body: message,
      tag: 'info',
      requireInteraction: false,
      forceShow
    });
  }, [showSmartNotification]);

  // リマインダー通知（一定時間後に表示）
  const showReminderNotification = useCallback((title, message, delayMs = 5000) => {
    console.log("showReminderNotification 呼び出し:", { title, message, delayMs });
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const notification = showNotification(title, {
            body: message,
            tag: 'reminder',
            requireInteraction: true
          });
          resolve(notification);
        } catch (error) {
          console.error("リマインダー通知エラー:", error);
          resolve(null);
        }
      }, delayMs);
    });
  }, [showNotification]);

  // 定期的な通知
  const showPeriodicNotification = useCallback((title, message, intervalMs = 30000) => {
    console.log("showPeriodicNotification 呼び出し:", { title, message, intervalMs });
    const interval = setInterval(() => {
      try {
        showNotification(title, {
          body: message,
          tag: 'periodic',
          requireInteraction: false
        });
      } catch (error) {
        console.error('定期通知の送信に失敗しました:', error);
        clearInterval(interval);
      }
    }, intervalMs);

    // クリーンアップ関数を返す
    return () => clearInterval(interval);
  }, [showNotification]);

  // 通知を閉じる
  const closeNotification = useCallback(() => {
    if (notificationRef.current) {
      notificationRef.current.close();
      notificationRef.current = null;
    }
  }, []);

  // すべての通知を閉じる
  const closeAllNotifications = useCallback(() => {
    if ('close' in Notification) {
      Notification.close();
    }
    if (notificationRef.current) {
      notificationRef.current.close();
      notificationRef.current = null;
    }
  }, []);

  // 通知の設定を更新
  const updateNotification = useCallback((title, options = {}) => {
    if (notificationRef.current) {
      notificationRef.current.close();
    }
    return showNotification(title, options);
  }, [showNotification]);

  // 通知の状態をリセット
  const resetNotificationState = useCallback(() => {
    closeNotification();
    setPermission(Notification.permission);
    setIsEnabled(Notification.permission === 'granted');
  }, [closeNotification]);

  return {
    // 状態
    permission,
    isSupported,
    isEnabled,
    isPageActive,
    
    // 基本機能
    requestPermission,
    showNotification,
    showSmartNotification,
    
    // プリセット通知
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
    
    // スマートプリセット通知
    showSmartSuccessNotification,
    showSmartErrorNotification,
    showSmartWarningNotification,
    showSmartInfoNotification,
    
    // 特殊通知
    showReminderNotification,
    showPeriodicNotification,
    
    // 制御機能
    closeNotification,
    closeAllNotifications,
    updateNotification,
    resetNotificationState
  };
};

/**
 * 通知の使用例を示すコンポーネント
 */
export const NotificationExample = () => {
  const {
    permission,
    isSupported,
    isEnabled,
    isPageActive,
    requestPermission,
    showSuccessNotification,
    showErrorNotification,
    showWarningNotification,
    showInfoNotification,
    showReminderNotification,
  } = useNotification();

  const handleRequestPermission = async () => {
    try {
      await requestPermission();
    } catch (error) {
      console.error('権限要求エラー:', error);
    }
  };

  const handleTestNotification = (type) => {
    console.log(`通知テスト開始: ${type}`);
    console.log('現在の状態:', { isEnabled, permission, isSupported, isPageActive });
    
    try {
      switch (type) {
        case 'success':
          showSuccessNotification('成功', '処理が完了しました');
          break;
        case 'error':
          showErrorNotification('エラー', 'エラーが発生しました');
          break;
        case 'warning':
          showWarningNotification('警告', '注意が必要です');
          break;
        case 'info':
          showInfoNotification('情報', '新しい情報があります');
          break;
        case 'reminder':
          showReminderNotification('リマインダー', '3秒後に表示されました', 5000);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('通知テストエラー:', error);
    }
  };

  if (!isSupported) {
    return <div>このブラウザは通知をサポートしていません</div>;
  }

  if(!isEnabled) return(
    <div>
      <Button
        variant="outlined"
        color="primary"
        onClick={handleRequestPermission}
      >
        通知権限を要求
      </Button>
    </div>
  )

  return (
    <div>
      <Button
        variant="contained"
        color="primary"
        onClick={() => handleTestNotification('success')}
      >
        通知発行
      </Button>
    </div>
  );
};
export default useNotification;
