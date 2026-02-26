import React, { useState } from 'react';
import { Snackbar, IconButton, makeStyles } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { red } from '@material-ui/core/colors';
import { getBrowserInfo } from '../../modules/albUtils';

const useStyles = makeStyles((theme) => ({
  messageWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    fontSize: '1.2rem',
    color: red[500],
    textAlign: 'left',
  },
  action: {
    color: red[500],
    padding: 0,
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
}));

const BrowserWarning = () => {
  const classes = useStyles();

  const { match } = getBrowserInfo();
  // コンポーネント内のstate初期化
  const [open, setOpen] = useState(false);

  React.useEffect(() => {
    if (match) return;

    // レンダリング直後のちらつき防止のため1秒待機
    const timer = setTimeout(() => {
      const lastClosed = sessionStorage.getItem('browserWarningLastClosed');
      const now = Date.now();

      // 10分（600,000ミリ秒）経過しているか、または一度も閉じられていなければ表示
      if (!lastClosed || (now - parseInt(lastClosed)) > 10 * 60 * 1000) {
        setOpen(true);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [match]);

  const handleClose = (event, reason) => {
    // 画面外クリック(clickaway)などの通常のクローズでは抑制時間をセットしない
    setOpen(false);
  };

  const handleButtonClick = () => {
    // 閉じるボタンを明示的に押したときのみ、抑制時間を保存
    sessionStorage.setItem('browserWarningLastClosed', Date.now().toString());
    setOpen(false);
  };

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      open={open}
      onClose={handleClose}
      message={
        <div className={classes.messageWrapper}>
          <span className={classes.message}>
            推奨ブラウザはGoogle Chromeです。
          </span>
          <IconButton size="medium" aria-label="close" className={classes.action} onClick={handleButtonClick}>
            <CloseIcon fontSize="large" />
          </IconButton>
        </div>
      }
    />
  );  
};

export default BrowserWarning;
