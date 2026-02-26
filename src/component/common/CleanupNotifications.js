import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core';
import { red, teal } from '@material-ui/core/colors';

const CleanupNotifications = () => {
  const [result, setResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const cleanupNotifications = () => {
    try {
      let cleaned = 0;
      let totalDeleted = 0;

      // *.Notifications パターンのキーを探す
      const notificationKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.endsWith('Notifications')) {
          notificationKeys.push(key);
        }
      }

      // 各Notificationsキーを処理
      notificationKeys.forEach(key => {
        try {
          const value = localStorage.getItem(key);
          const notifications = JSON.parse(value);

          if (Array.isArray(notifications) && notifications.length > 10) {
            // timestampでソート（新しい順）
            notifications.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            // 最新の10個のみを保持
            const kept = notifications.slice(0, 10);
            const deletedCount = notifications.length - 10;

            // 更新して保存
            localStorage.setItem(key, JSON.stringify(kept));
            cleaned++;
            totalDeleted += deletedCount;

            console.log(`Cleaned ${key}: kept 10, deleted ${deletedCount}`);
          }
        } catch (e) {
          console.warn(`Failed to process ${key}:`, e);
        }
      });

      setResult({
        success: true,
        message: `処理完了: ${cleaned}個のキーをクリーンアップしました。合計${totalDeleted}件の古い通知を削除しました。`,
        cleaned,
        totalDeleted
      });
      setDialogOpen(true);
    } catch (error) {
      setResult({
        success: false,
        message: `エラーが発生しました: ${error.message}`
      });
      setDialogOpen(true);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  return (
    <div style={{ margin: 8 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={cleanupNotifications}
      >
        古いNotificationsを削除（10件まで保持）
      </Button>

      <Dialog open={dialogOpen} onClose={handleClose}>
        <DialogTitle>
          {result?.success ? '✅ 処理完了' : '❌ エラー'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {result?.message}
          </DialogContentText>
          {result?.success && result.cleaned > 0 && (
            <div style={{ marginTop: 16, padding: 8, backgroundColor: teal[50] }}>
              <div>クリーンアップしたキー数: {result.cleaned}</div>
              <div>削除した通知数: {result.totalDeleted}</div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary" autoFocus>
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CleanupNotifications;
