import React, { useEffect, useMemo, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import teal from '@material-ui/core/colors/teal';
import blue from '@material-ui/core/colors/blue';
import red from '@material-ui/core/colors/red';
import lime from '@material-ui/core/colors/lime';
import deepOrange from '@material-ui/core/colors/deepOrange';
import Dialog from '@material-ui/core/Dialog';

const useStyles = makeStyles((theme) => ({
  close: {
    padding: theme.spacing(0.5),
  },
  snackNormal: {
    ' & .MuiSnackbar-root .MuiPaper-root': {
      backgroundColor: teal[900]
    },
    '@media print': { display: 'none' },
  },
  snackWarning: {
    ' & .MuiSnackbar-root .MuiPaper-root': {
      backgroundColor: lime[900]
    },
    '@media print': { display: 'none' },
  },
  snackSuccess: {
    ' & .MuiSnackbar-root .MuiPaper-root': {
      backgroundColor: blue[900]
    },
    '@media print': { display: 'none' },
  },
  snackError: {
    ' & .MuiSnackbar-root .MuiPaper-root': {
      backgroundColor: red[800]
    },
  },
  errDialog: {
    padding: 16, backgroundColor: deepOrange[900], color: '#fff',
    lineHeight: 1.4,
    '& .inner': { paddingTop: 4, paddingBottom: 4 },
    '& .buttonWrap': { textAlign: 'center', paddingTop: 4, paddingBottom: 4 },
    '& .imgWrap': { textAlign: 'center' },
    '& .errId': {
      color: teal[100], fontSize: '1.2rem', fontWeight: 600,
    },
  },
}));

// 親から単一のstateで操作可能にするためのコンポーネント
// 期待props:
// - state: { msg: string, severity: 'success'|'warning'|'error'|'' , onErrorDialog?: boolean, errorId?: string }
//   もしくは互換: msg, severity, onErrorDialog, errorId を個別propsで指定
// - setState?: function もしくは onClose?: function でclose時にクリア処理を委譲
// - vertical/horizontal/autoHideDuration は任意（現行に合わせる）
export default function SnackMsgSingle(props) {
  const classes = useStyles();

  const value = useMemo(() => {
    if (props.state) return props.state;
    return {
      msg: props.msg || '',
      severity: props.severity || '',
      onErrorDialog: !!props.onErrorDialog,
      errorId: props.errorId || '',
    };
  }, [props.state, props.msg, props.severity, props.onErrorDialog, props.errorId]);

  const [open, setOpen] = useState(false);

  const autoHideDuration = props.autoHideDuration != null ? props.autoHideDuration : 6000;

  const anch = { vertical: 'bottom', horizontal: 'left' };
  if (props.hasOwnProperty('vertical')) anch.vertical = props.vertical;
  if (props.hasOwnProperty('horizontal')) anch.horizontal = props.horizontal;

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
    if (props.setState) {
      props.setState((prev) => ({ ...prev, msg: '' }));
    } else if (props.onClose) {
      props.onClose();
    }
  };

  // 同一メッセージでも確実に再表示できるよう、値変化毎にopenをトグル
  useEffect(() => {
    if (value && value.msg) {
      setOpen(false);
      const t = setTimeout(() => setOpen(true), 0);
      return () => clearTimeout(t);
    } else {
      setOpen(false);
    }
  }, [value]);

  let snackClass;
  if (value.severity === 'success') snackClass = classes.snackSuccess;
  else if (value.severity === 'warning') snackClass = classes.snackWarning;
  else if (value.severity === 'error') snackClass = classes.snackError;
  else snackClass = classes.snackNormal;

  const showDialog = !!value.onErrorDialog || value.severity === 'error';

  const SnackDisp = () => (
    <div className={snackClass}>
      <Snackbar
        anchorOrigin={anch}
        open={open}
        autoHideDuration={autoHideDuration}
        onClose={handleClose}
        message={value.msg}
        action={
          <>
            <IconButton
              size="small" aria-label="close" color="inherit" onClick={handleClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
      />
    </div>
  );

  const DialogDisp = () => (
    <Dialog onClose={handleClose} open={open}>
      <div className={classes.errDialog}>
        <div className='imgWrap'>
          <img src={`${window.location.origin}/img/errlogo.svg`} width="60px" alt="logo" />
        </div>
        <div className='inner'>エラーが発生しました。</div>
        {value.errorId ? (
          <div className='errId'>{value.errorId}</div>
        ) : null}
        <div className='inner'>{value.msg}</div>
        <div className='inner'>
          インターネット回線を確認しOKボタンを押してから再読み込みしてください。
          同じ操作で同じメッセージが表示されるようならサポートに連絡してください。
        </div>
        <div className='buttonWrap'>
          <a href='/'>
            <Button variant="contained">OK</Button>
          </a>
        </div>
      </div>
    </Dialog>
  );

  if (showDialog) {
    return (
      <>
        <DialogDisp />
        <div className='snackDummy'></div>
      </>
    );
  }

  return (
    <>
      <SnackDisp />
      <div className='snackDummy'></div>
    </>
  );
}


