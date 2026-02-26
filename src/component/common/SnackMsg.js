import React, {useState, useEffect, } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector, ReactReduxContext } from 'react-redux';
import * as Actions from '../../Actions';
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
      backgroundColor:teal[900]
    },
    '@media print':{display: 'none'},

  },
  snackWarning: {
    ' & .MuiSnackbar-root .MuiPaper-root': {
      backgroundColor: lime[900]
    },
    '@media print':{display: 'none'},

  },
  snackSuccess: {
    ' & .MuiSnackbar-root .MuiPaper-root': {
      backgroundColor: blue[900]
    },
    '@media print':{display: 'none'},
    
  },
  snackError: {
    ' & .MuiSnackbar-root .MuiPaper-root': {
      backgroundColor: red[800]
    },
    
  },
  errDialog: {
    padding: 16, backgroundColor: deepOrange[900], color:'#fff',
    lineHeight: 1.4,
    '& .inner': {paddingTop: 4, paddingBottom: 4},
    '& .buttonWrap': {textAlign: 'center', paddingTop: 4, paddingBottom: 4},
    '& .imgWrap': {textAlign: 'center'},
    '& .errId': {
      color: teal[100], fontSize:'1.2rem', fontWeight: 600, //padding: '0 4px',
    },
  },
}));
// propsにvirticalとholizontalを追加
export default function SnackMsg(props) {
  const [open, setOpen] = useState(false);
  const [msg, setmsg] = useState('');
  const [lastMsg, setLastMsg] = useState(''); // 追加: 最後のメッセージを記録
  const [severity, setseverity] = useState('');
  const [errorId, setErrorId] = useState('');

  const storeState = useSelector(state => state.snackPack);
  const snackState = (props.storeStateOpen)? storeState: {};
  const handleClose = (event, reason) => {
    if (props.setmsg){
      props.setmsg('');
    }
    setOpen(false);
    setLastMsg(''); // 追加: メッセージが閉じられたときにlastMsgをリセット
    if (reason === 'clickaway') {
      return;
    }
  };
  // propsによる表示
  useEffect(() => {
    if (props.msg && props.msg !== lastMsg){ // 追加: 最後のメッセージと比較
      setOpen(true);
      setmsg(props.msg);
      setseverity(props.severity);
      setErrorId(props.errorId);
      setLastMsg(props.msg); // 追加: 最後のメッセージを更新
    }
    else{
      handleClose();
    }
  }, [props.msg, props.id]);
  // dispatchによる表示
  useEffect(() => {
    const delay = 300; // 300ミリ秒の遅延
  
    const timer = setTimeout(() => {
      const justnow = new Date().getTime();
      const timeAllowed = 3000;
      if ((justnow - snackState.time) < timeAllowed && snackState.text !== lastMsg) {
        setOpen(true);
        setmsg(snackState.text);
        setseverity(snackState.severity);
        setErrorId(snackState.errorId);
        setLastMsg(snackState.text);
      }
    }, delay);
  
    // クリーンアップ関数を追加して、タイマーをクリアします
    return () => {
      clearTimeout(timer);
    };
  }, [snackState]);
  
  const anch = {vertical: 'bottom',horizontal: 'left',}
  if (props.hasOwnProperty('vertical')) anch.vertical = props.vertical;
  if (props.hasOwnProperty('horizontal')) anch.horizontal = props.horizontal;
  const classes = useStyles();
  let snackClass;
  if (severity === 'success') snackClass = classes.snackSuccess;
  else if (severity === 'warning') snackClass = classes.snackWarning;
  else if (severity === 'error') snackClass = classes.snackError;
  else snackClass = classes.snackNormal;
  const SnackDisp = () => (
    <div className={snackClass}>
      {/* <Button onClick={handleClick}>Open simple snackbar</Button> */}
      <Snackbar
        anchorOrigin={anch}
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message={msg}
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
          <img src={`${window.location.origin}/img/errlogo.svg`} 
            width="60px" alt="logo" 
          />
        </div>

        <div className='inner'>エラーが発生しました。</div>
        {(errorId !== undefined && errorId !== '') &&
          <div className='errId'>{errorId}</div>
        }
        <div className='inner'>{msg}</div>
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
  )
  if (severity === 'error'){
    return (<>
      <DialogDisp />
      <div className='snackDummy'></div>
    </>)
  }
  else{
    return (<>
      <SnackDisp />
      <div className='snackDummy'></div>
    </>)
  }
}
