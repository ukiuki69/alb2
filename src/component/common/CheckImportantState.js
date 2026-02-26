import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, makeStyles } from '@material-ui/core';
import * as comMod from '../../commonModule';
import { getLocalStorage, setLocalStorage } from '../../modules/localStrageOprations';

// 定数定義
const CHECK_INTERVAL_SECONDS = 5; // チェック間隔（秒）
const RECENT_HID_AND_BID_NAME = 'recentHidAndBid';

const useStyles = makeStyles((theme) => ({
  content: {
    whiteSpace: 'pre-line',
    marginTop: theme.spacing(2),
  },
  instruction: {
    marginTop: theme.spacing(2),
    fontSize: '14px',
    color: theme.palette.text.secondary,
  },
  warning: {
    marginTop: theme.spacing(1),
    fontSize: '14px',
    color: theme.palette.error.main,
    fontWeight: 'bold',
  },
}));

const CheckImportantState = () => {
  const classes = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');
  const [checkInterval, setCheckInterval] = useState(null);
  const timerRef = useRef(null);

  // Redux stateから値を取得
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);

  // チェック処理
  const checkStateConsistency = () => {
    let hasChanges = false;
    let message = '';

    // hid, bidのチェック（localStorage）
    const recentHidAndBid = getLocalStorage(RECENT_HID_AND_BID_NAME) ?? [];
    if (recentHidAndBid.length > 0) {
      const latestHidBid = recentHidAndBid[0]; // 最新のhid,bid
      const [storedHid, storedBid] = latestHidBid.split(',');
      
      if (hid !== storedHid || bid !== storedBid) {
        hasChanges = true;
        message = '事業所選択に変更が認められました';
      }
    }

    // stdDateのチェック（cookie）
    const cookieStdDate = comMod.getCookeis('stdDate');
    if (cookieStdDate && stdDate !== cookieStdDate) {
      hasChanges = true;
      if (message) {
        message += '\n提供月選択に変更が認められました';
      } else {
        message = '提供月選択に変更が認められました';
      }
    }

    // 変更があった場合はダイアログを表示
    if (hasChanges) {
      if (!dialogOpen && !timerRef.current) {
        timerRef.current = setTimeout(() => {
          setDialogMessage(message);
          setDialogOpen(true);
          timerRef.current = null;
        }, 500);
      }
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // リロード処理
  const handleReload = () => {
    window.location.reload();
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  // コンポーネントマウント時にチェック開始
  useEffect(() => {
    // 初回チェック
    checkStateConsistency();

    // 定期的なチェックを開始
    const interval = setInterval(() => {
      checkStateConsistency();
    }, CHECK_INTERVAL_SECONDS * 1000);

    setCheckInterval(interval);

    // クリーンアップ
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [hid, bid, stdDate]);

  return (
    <Dialog
      open={dialogOpen}
      onClose={handleReload}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        状態変更の検出
      </DialogTitle>
      <DialogContent>
        <div className={classes.content}>
          {dialogMessage}
        </div>
        <div className={classes.instruction}>
          ページを再読み込みして最新の状態を反映してください。
        </div>
        <div className={classes.warning}>
          このまま作業を続けるとデータ破損の危険性が高いです。
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          キャンセル
        </Button>
        <Button onClick={handleReload} color="primary" variant="contained">
          OK（再読み込み）
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CheckImportantState;
