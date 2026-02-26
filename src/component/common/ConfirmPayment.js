import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import { getLocalStorage, setLocalStorage } from '../../modules/localStrageOprations';
import { getLodingStatus } from '../../commonModule';
import { MailOutlined } from '@material-ui/icons';
import { red, teal } from '@material-ui/core/colors';
import * as Actions from '../../Actions';
import DeleteCompanyAndBranch from './deleteCompanyAndBranch';

const CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds
const localStorageKey = 'confirmPaymentLastDialogShow';

const useStyles = makeStyles((theme) => ({
  fullScreenElement: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99999,
    paddingTop: '20vh', paddingLeft: '20vw',
    '& .inner': {
      width: '60vw', backgroundColor: '#FFFFFFDD', color: red[600], padding: 16,
      lineHeight: 1.6,
    },
    '& .logOut': {marginTop: 16},
  },
  dialogWarning: {
    color: theme.palette.error.main,
  },
  dialogContent: {
    '& >p': {color: '#111'},
  },
  renrakuRoot: {
    marginTop: 8,
    '& .tel': {color: teal[800], padding: '8px 0 8px 6px'}
  },
}));

const ConfirmPayment = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  // `undefined` または `NaN` の場合は `0` として扱う
  const confirmPaymentRaw = useSelector((s) => s.com.confirmPayment);
  const allState = useSelector(s => s);
  const confirmPayment = isNaN(parseInt(confirmPaymentRaw, 10)) ? 0 : parseInt(confirmPaymentRaw, 10);
  const ls = getLodingStatus(allState);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleStateChange = () => {
      const lastShowTime = parseInt(localStorage.getItem(localStorageKey), 10);
      const now = Date.now();
      if (!ls.loaded) return;
      if (confirmPayment === 1 && (!lastShowTime || now - lastShowTime >= CHECK_INTERVAL)) {
        // 2秒待機してからダイアログを表示
        setTimeout(() => {
          setOpen(true);
        }, 2000); // 2000ミリ秒 = 2秒
      } else {
        setOpen(false);
      }
    };
  
    handleStateChange();
    // この効果は `confirmPayment` に依存します。
    // このコンポーネントは `confirmPayment` が変更されるたびに
    // 再描画されることを前提としています。
  }, [confirmPayment, ls.loaded]); // `ls.loaded` を依存配列に追加することも検討してください。
  
  const Renraku = () => (
    <div className={classes.renrakuRoot}>
      <div className='tel'>
        電話: 050-3187-8731
      </div>
      <div>
        <a href='mailto:info@rbatosmail.com'>
          <Button 
            startIcon={<MailOutlined/>}
            color='primary'
          >
            メールを送信
          </Button>
        </a>
      </div>
    </div>
  )

  return (
    <>
      {confirmPayment === 2 && (
        <div className={classes.fullScreenElement}>
            <div className='inner'>
              現在、ご利用いただけない状態です。<br></br>
              お支払いの確認が出来ていません。<br></br>
              口座振替のお客様で振替用紙のご返送いただいていない場合もこのメッセージが表示されることがあります。<br></br>
              振替用紙の再送をご希望の法人様はお気軽にお申し付け下さい。<br></br>
              行き違いの場合はご容赦下さい。<br></br>
              下記までご連絡をお願いいたします。<br></br>
              <Renraku />
              <div className='logOut'>
                <Button
                  variant='contained'
                  onClick={()=>{dispatch(Actions.clearAcount());}}
                >
                  ログアウト
                </Button>
                <DeleteCompanyAndBranch />
              </div>
            </div>
        </div>
      )}

      <Dialog
        className={classes.dialogRoot}
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" className={classes.dialogWarning}>
          {"お支払いをご確認下さい"}
        </DialogTitle>
        <DialogContent className={classes.dialogContent}>
          <DialogContentText id="alert-dialog-description" >
            お支払いの確認が出来ていません。<br></br>
            口座振替のお客様で振替用紙のご返送いただいていない場合もこのメッセージが表示されることがあります。<br></br>
            振替用紙の再送をご希望の法人様はお気軽にお申し付け下さい。<br></br>
            行き違いの場合はご容赦下さい。
            下記までご連絡をお願いいたします。<br></br>
            <Renraku />
          </DialogContentText>
        </DialogContent>
        {/* // DialogActions内のButtonコンポーネントのonClickイベントを修正 */}
        <DialogActions>
          <Button 
            onClick={() => {
              const now = Date.now();
              localStorage.setItem(localStorageKey, now.toString());
              setOpen(false);
            }} 
            color="primary" 
            autoFocus
          >
            OK
          </Button>
        </DialogActions>

      </Dialog>
    </>
  );
};

export default ConfirmPayment;
