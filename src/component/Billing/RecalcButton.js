import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Actions from '../../Actions';
import * as comMod from '../../commonModule';
// import * as albCM from '../../albCommonModule'; // commonParts.js had this but it's not used in RecalcButton
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import PrintIcon from '@material-ui/icons/Print';
import Backdrop from '@material-ui/core/Backdrop';
// import CircularProgress from '@material-ui/core/CircularProgress';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator } from "@fortawesome/free-solid-svg-icons";
import { setBillInfoToSch } from './blMakeData';
import { KeyListener } from '../common/KeyListener';
import { NotDispLowCh, useSuspendLowChange } from '../common/useSuspendLowChange';
// import { LoadingSpinner } from '../common/commonParts';

const useStyles = makeStyles({
  printCntRoot: {
    width: '80%',
    textAlign: 'center',
    margin: '0 auto',
    backgroundColor: '#ffffff66',
    padding: 8,
    top: 60,
    left: '10%',
    '& .MuiButtonBase-root': {
      width: 200,
      margin: '0 8px',
      '& .MuiSvgIcon-root': {
        marginInlineEnd: '8px',
      },
    },
    '& .subButtons': {
      padding: 8,
      '& .MuiButtonBase-root': {
        width: 'auto',
      },
    },
  },
  backdrop: {
    zIndex: 9999,
    color: '#666',
    backgroundColor: 'rgba(255, 255, 255, 0.7) !important',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    paddingBottom: '20vh',
  },
  loadingImg: {
    width: 32,
  },
});

// 再計算ボタンと印刷ボタンを提供
export const RecalcButton = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const stdDate = useSelector(state => state.stdDate);
  const schedule = useSelector(state => state.schedule);
  const users = useSelector(state => state.users);
  const com = useSelector(state => state.com); // 会社と事業所の情報
  const serviceSt = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const classroom = useSelector(state => state.classroom);
  const allState = useSelector(s => s);
  const keyInfoInit = { key: '', shift: false, ctrl: false, meta: false, }
  const [keyInfo, setKeyInfo] = useState(keyInfoInit);
  const [loading, setLoading] = useState(false);
  const NotAllowRecalc = useSuspendLowChange();

  const { hidePrint, setCheckBilling, useAdjustetUpperLimit = true } = props;
  // サービス未設定のときの設定を行う
  const service = (serviceSt) ? serviceSt : serviceItems[0];
  const billingDt = useSelector(state => state.billingDt);

  useEffect(() => {
    let isMounted = true;
    const chk = (
      !keyInfo.shift && !keyInfo.ctrl && !keyInfo.meta && isMounted
    )
    if ((keyInfo.key).toLowerCase() === 'q' && chk) {
      clickHandler();
      setKeyInfo(keyInfoInit);
    }
    return (() => {
      isMounted = false;
    })

  }, [keyInfo])

  const clickHandler = () => {
    setLoading(true);
    // 同期処理でメインスレッドがブロックされるため、
    // setTimeoutを使用して描画（バックドロップ表示）の時間を確保する
    setTimeout(() => {
      if ((typeof setCheckBilling) === 'function') {
        // 初期化に伴うレンダリングを禁止する。
        setCheckBilling({ result: false, done: false });
      }
      const prms = {
        stdDate, schedule, users, com, service, serviceItems, classroom, dispatch,
        useAdjustetUpperLimit,
      };
      prms.calledBy = 'RecalcButton';
      // calledBy対応済み
      const { billingDt: bdt, masterRec, result, errDetail } = setBillInfoToSch(prms);
      if (!result) {
        dispatch(Actions.setSnackMsg(errDetail.description, 'error', 'B236709'));
      }
      dispatch(Actions.setStore({ billingDt: bdt, masterRec }));
      setLoading(false);
    }, 100);
  }

  return (<>
    <div className={classes.printCntRoot + ' noprint'} >
      <Button
        onClick={clickHandler}
        variant='contained'
        disabled={NotAllowRecalc}
      >
        <FontAwesomeIcon icon={faCalculator} fontSize='large' style={{ marginRight: 8, marginTop: -2 }} />
        売上計算する Q
      </Button>
      <NotDispLowCh />
    </div>
    <Backdrop className={classes.backdrop} open={loading}>
      <img src="./img/loading3dRing.png" className={classes.loadingImg} alt="loading" />
      <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>売上計算中...</div>
    </Backdrop>
    {(billingDt && !hidePrint) &&
      <div className={classes.printCntRoot + ' noprint'}>
        <Button
          onClick={() => { window.print() }}
          variant='contained'
        >
          <PrintIcon />
          印刷する
        </Button>
      </div>
    }
    <KeyListener setKeyInfo={setKeyInfo} />
  </>)
}
