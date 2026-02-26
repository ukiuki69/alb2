import { makeStyles } from '@material-ui/core';
import { red, yellow } from '@material-ui/core/colors';
import React, { useEffect, useState, useRef } from 'react';
import Rev, { rev,  } from '../../Rev';
import { univApiCall } from '../../albCommonModule';
import { seagull } from '../../modules/contants';
import SnackMsg from './SnackMsg';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography
} from '@material-ui/core';

const useStyles = makeStyles({
  updateLink: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff',
    fontSize: '.7rem',
    paddingLeft: 8,
    paddingTop: 4,
  },
  tobeUpdate: {
    color: yellow[200],
    // animation: `$bounce 3s infinite`,
    animation: `$blinkTwice 6s infinite ease-in-out`,
  },
  '@keyframes blinkTwice': {
    '0%, 90%, 100%': {
      opacity: 1, // 通常状態
    },
    '95%': {
      opacity: 0, // 非表示状態
    },
  },
  // bounceアニメーションを定義
  '@keyframes bounce': {
    '0%, 20%, 50%, 80%, 100%': {
      paddingTop: 4,
      transitionTimingFunction: 'ease-in-out',
    },
    '40%': {
      paddingTop: 0, // 上に跳ねる
      transitionTimingFunction: 'ease-out',
    },
    '60%': {
      paddingTop: 8, // 下に沈む
      transitionTimingFunction: 'ease-in',
    },
  },
});

const snt = (str) => {
  return str.replace(/[^A-Za-z0-9.]/g, ''); // アルファベット大文字小文字、数字、ピリオド以外を除去
};

// レビジョンを表示し更新があったら表示を行う。
const CheckUpdate = ({forceUpdate = false, mobileUpdate = false, hide = false}) => {
  const classes = useStyles();
  const [tobeUpdate, setTobeUpdate] = useState(false);
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [skipUpdateUntil, setSkipUpdateUntil] = useState(null);
  const intvl = 60 * 1000 * 5;
  const delay = 2000;
  // 複数のタイマーを管理するための ref を用意
  const timersRef = useRef([]);


  // スキップ状態をlocalStorageから読み込み
  useEffect(() => {
    const savedSkipUntil = localStorage.getItem('skipUpdateUntil');
    if (savedSkipUntil) {
      const skipTime = parseInt(savedSkipUntil);
      if (Date.now() < skipTime) {
        setSkipUpdateUntil(skipTime);
      } else {
        localStorage.removeItem('skipUpdateUntil');
      }
    }
  }, []);

  useEffect(() => {
    // localhostで動作しているときは強制更新を行わない
    // const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isLocalhost = false;
    if (forceUpdate && tobeUpdate && !isLocalhost) {
      setSnack({msg: 'アプリケーションを更新しています...', severity: 'info'});
      window.location.reload(true);
    }
  }, [forceUpdate, tobeUpdate]);

  // mobileUpdateがtrueでtobeUpdateがtrueの時にダイアログを表示
  useEffect(() => {
    if (mobileUpdate && tobeUpdate && !skipUpdateUntil) {
      setShowUpdateDialog(true);
    }
  }, [mobileUpdate, tobeUpdate, skipUpdateUntil]);

  useEffect(() => {
    let isMounted = true; // メモリリークを防ぐためのフラグ
    const checkVersion = async () => {
      // Promise 内で setTimeout のタイマー ID を保存
      await new Promise((resolve) => {
        const timerId = setTimeout(resolve, delay);
        timersRef.current.push(timerId);
      });

      const prms = {
        a: 'fetchAnyState', date: '0000-00-00', hid: '', bid: '', item: 'rev',
      };
      const res = await univApiCall(prms, '', '',);
      if (res.data.result) {
        const resultRev = String(res.data.dt[0].state);
        if (isMounted && snt(resultRev) > snt(rev)) {
          setTobeUpdate(true);
        }
      }
    };

    // 定期的にバージョンを確認
    const interval = setInterval(() => {
      checkVersion();
    }, intvl);
    
    checkVersion(); // 初回実行

    return () => {
      isMounted = false; // コンポーネントのアンマウント時にフラグを更新
      clearInterval(interval); // Intervalをクリアしてメモリリークを防ぐ
      // 未解決のタイマーがあればすべてクリアする
      timersRef.current.forEach((timerId) => clearTimeout(timerId));
      timersRef.current = [];
    };
  }, []);

  // 更新ダイアログのハンドラー
  const handleUpdateConfirm = () => {
    setShowUpdateDialog(false);
    setSnack({msg: 'アプリケーションを更新しています...', severity: 'info'});
    window.location.reload(true);
  };

  const handleUpdateSkip = () => {
    setShowUpdateDialog(false);
    // 60分後の時刻を設定
    const skipUntil = Date.now() + (60 * 60 * 1000);
    setSkipUpdateUntil(skipUntil);
    localStorage.setItem('skipUpdateUntil', skipUntil.toString());
    setSnack({msg: '60分間更新の確認を停止しました', severity: 'info'});
  };

  // hideがtrueの場合は何も表示しない
  if (hide) {
    return null;
  }

  if (!tobeUpdate || seagull) {
    return (
      <>
        <a className={classes.updateLink}>
          <Rev short />
        </a>
        <SnackMsg {...snack} />
        {/* モバイル更新ダイアログ */}
        <Dialog open={showUpdateDialog} onClose={() => setShowUpdateDialog(false)}>
          <DialogTitle>アプリケーションの更新</DialogTitle>
          <DialogContent>
            <Typography>
              新しいバージョンが利用可能です。今すぐ更新しますか？
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUpdateSkip} color="primary">
              いいえ（60分間停止）
            </Button>
            <Button onClick={handleUpdateConfirm} color="primary" variant="contained">
              はい
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  } else {
    return (
      <>
        <a
          className={`${classes.updateLink} ${classes.tobeUpdate}`}
          onClick={() => {
            setSnack({msg: 'アプリケーションを更新しています...', severity: 'info'});
            window.location.reload(true);
          }}
        >
          <span>アップデート</span>
        </a>
        <SnackMsg {...snack} />
        {/* モバイル更新ダイアログ */}
        <Dialog open={showUpdateDialog} onClose={() => setShowUpdateDialog(false)}>
          <DialogTitle>アプリケーションの更新</DialogTitle>
          <DialogContent>
            <Typography>
              新しいバージョンが利用可能です。今すぐ更新しますか？
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleUpdateSkip} color="primary">
              いいえ（60分間停止）
            </Button>
            <Button onClick={handleUpdateConfirm} color="primary" variant="contained">
              はい
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }
};

export default CheckUpdate;
