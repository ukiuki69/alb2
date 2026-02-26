import React, {useEffect, useState, useRef} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { convDid, formatDate, getDateEx, getLodingStatus, parsePermission } from '../../commonModule';
import { IconButton, Tooltip, makeStyles, Button } from '@material-ui/core';
import { red, yellow } from '@material-ui/core/colors';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import { useSchLocked } from '../../modules/useSchLocked';
import BlockScreen from './BlockScreen';
import SnackMsg from './SnackMsg';
import { setBillInfoToSch } from '../Billing/blMakeData';
import { LoadErr } from './commonParts';
import { univApiCall } from '../../albCommonModule';
import { fSetUseResult } from '../Billing/utils/useResultUtils';
import { YesNoDialog } from './GenericDialog';
import { useLocation } from 'react-router-dom';

const useStyles = makeStyles({
  customTooltip: {maxWidth: 300, fontSize: 12},
  buttonWithLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    // padding: '6px 8px',
    minWidth: 'auto',
    textTransform: 'none',
  },
});

const TARGET_ROOTPATH_LIST = ['users', 'schedule', 'setting', 'billing','dailyreport', 'proseed', 'reports'];

const Main = (props) => {
  const classes = useStyles();
  const schedule = useSelector(state => state.schedule);
  const stdDate = useSelector(state => state.stdDate);
  const users = useSelector(state => state.users);
  const com = useSelector(state => state.com);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const account = useSelector(state => state.account);
  const permission = parsePermission(account)[0][0];
  const classroom = useSelector(state => state.classroom);
  const dateList = useSelector(state => state.dateList);
  const dispatch = useDispatch();

  const [fetchedSch, setFetchedSch] = useState(null);
  const [dolock, setDolock] = useState(null);
  // ブロックスクリーン用
  const [delay, setDelay] = useState(0);
  const [snack, setSnack] = useState({});
  const [open, setOpen] = useState(false);

  const sch = {...schedule};
  const st = 'D' + stdDate.replace(/\-/g, ''); // 2022-04-01 -> D20220401;
  let ed;
  const edStdDate = getDateEx( // 当月の月末
    stdDate.split('-')[0], stdDate.split('-')[1], 0
  ).dt;
  if (edStdDate < new Date()) ed = convDid(edStdDate);
  else{
    let t = new Date();
    t.setHours(t.getHours() - 18);
    ed = convDid(t);
  }
  const schLocked = useSchLocked(ed);
  const schMonthlyLocked = schedule.locked;
  const fDate = new Date(new Date().setDate(1));
  const thisMonthStr = formatDate(fDate, 'YYYY-MM-DD');
  const preMonth = (thisMonthStr > stdDate);
  const prms = { stdDate, schedule: sch, users, com, service, serviceItems };
  prms.calledBy = 'SetUseResult';
  // レンダー毎の重い計算を避けるため、必要時まで遅延評価
  const billingInfoRef = useRef(null);

  useEffect(()=>{
    let isMounted = true;
    if (isMounted && fetchedSch){
      // 必要になったタイミングでのみ計算（ヘッダ常駐時の無限再計算防止）
      if (!billingInfoRef.current){
        billingInfoRef.current = setBillInfoToSch(prms);
      }
      const { billingDt, masterRec } = billingInfoRef.current;
      const p = {
        dolock,ed,preMonth,users,service,fetchedSch,sch,
        classroom,bid,props,dateList,billingDt,st,hid,
        masterRec,com,stdDate,account,setSnack,dispatch, 
      }
      fSetUseResult(p);
    }
    return (() => isMounted = false);
  }, [fetchedSch, dolock]);

  const handleIconClick = () => {
    // 権限チェックを先に行う
    if(schLocked && permission < 90 && schMonthlyLocked){
      setSnack({msg: '権限がありません。', severity: 'warning', id: new Date().getTime()});
      return;
    }
    setOpen(true);
  }

  const clickHandler = (value) => {
    setDelay(300); // ブロックスクリーン用
    setDolock(value);
    const sendPrms = {a: 'fetchSchedule', date: stdDate, hid, bid};
    univApiCall(
      sendPrms, 'E49993', setFetchedSch, setSnack, 'データの再読み込みを行いました。',
      'データの再読み込みでエラーが発生しました。'
    );
  }

  const syoriStr1 = preMonth ? 
    `${stdDate.split('-')[0]}年${stdDate.split('-')[1]}月の確定処理を行います` : 
    "予定を実績にします";
  const syoriStr2 = preMonth ? 
    `${stdDate.split('-')[0]}年${stdDate.split('-')[1]}月の確定を解除します` : 
    "予定実績を確定解除します";
  
  // Tooltipの文章を生成
  const getTooltipText = () => {
    if (schMonthlyLocked) {
      return "当月の予定実績は確定済みです。確定解除を行うにはマネージャー以上の権限が必要です。";
    }
    if (schLocked && !preMonth) {
      return "実績処理済みです。実績を解除します。";
    }
    if (!schLocked && !preMonth) {
      return "昨日までの予定を実績に変更します。";
    }
    if (!schLocked && preMonth) {
      return "当月の予定実績を確定します。";
    }
    return "予定実績の処理を行います。";
  };
  const yesnoDialogProps = {
    open, setOpen, handleConfirm: (() => clickHandler(schLocked ? false : true)),
    prms: {
      title: schMonthlyLocked ? "確定解除" : 
             schLocked && !preMonth ? "実績解除" :
             !schLocked && !preMonth ? "実績処理" :
             !schLocked && preMonth ? "確定処理" : "予定実績を確定",
             
      message: preMonth
        ? (
          `${schLocked ? syoriStr2 : syoriStr1}。\nよろしいですか？`
        )
        : (
          `${ed.slice(1, 5)}年${ed.slice(5, 7)}月${ed.slice(7, 9)}日までの${schLocked ? syoriStr2 : syoriStr1}。\n`
          + "よろしいですか？"
        )
    }
  };
  // labelがある場合はボタン、ない場合はアイコンのみを表示
  if (props.label) {
    return(
      <>
      {!schLocked &&(
        <Tooltip title={getTooltipText()} classes={{ tooltip: classes.customTooltip }}>
          <Button
            onClick={handleIconClick}
            className={classes.buttonWithLabel}
            variant="outlined"
            size="small"
          >
            <LockOpenIcon
              style={{color: '#eee', fontSize: '1.4rem', transform: 'translateY(-1px)'}}
            />
            {props.label}
          </Button>
        </Tooltip>
      )}
      {schLocked &&(
        <Tooltip title={getTooltipText()} classes={{ tooltip: classes.customTooltip }}>
          <Button
            onClick={handleIconClick}
            className={classes.buttonWithLabel}
            variant="outlined"
            size="small"
          >
            <LockIcon
              style={{
                color: schMonthlyLocked ? red[300] : yellow[300], 
                fontSize: '1.4rem', transform: 'translateY(-1px)'
              }}
            />
            {props.label}
          </Button>
        </Tooltip>
      )}
      <YesNoDialog {...yesnoDialogProps} />
      <BlockScreen delay={delay} message={'処理中です'} />
      <SnackMsg {...snack} />
      </>
    );
  }

  return(
    <>
    {!schLocked &&(
      <Tooltip title={getTooltipText()} classes={{ tooltip: classes.customTooltip }}>
        <IconButton style={{padding: 6}} onClick={handleIconClick}>
          <LockOpenIcon
            style={{color: '#eee', fontSize: '1.4rem', transform: 'translateY(-1px)'}}
          />
        </IconButton>
      </Tooltip>
    )}
    {schLocked &&(
      <Tooltip title={getTooltipText()} classes={{ tooltip: classes.customTooltip }}>
        <IconButton style={{padding: 6}} onClick={handleIconClick}>
          <LockIcon
            style={{
              color: schMonthlyLocked ? red[300] : yellow[300], 
              fontSize: '1.4rem', transform: 'translateY(-1px)'
            }}
          />
        </IconButton>
      </Tooltip>
    )}
    <YesNoDialog {...yesnoDialogProps} />
    <BlockScreen delay={delay} message={'処理中です'} />
    <SnackMsg {...snack} />
    </>
  )
}

const UseResultIconButton = (props) => {
  const pathname = useLocation().pathname;
  const rootPath = pathname.split('/')[1];
  const allstate = useSelector(state=>state);
  const loadingStatus = getLodingStatus(allstate);

  if(!TARGET_ROOTPATH_LIST.includes(rootPath)) return null;
  if(!loadingStatus.loaded) return null;
  if(loadingStatus.error) return(
    <LoadErr loadStatus={loadingStatus} errorId={'E4432'} />
  );
  return(
    <Main {...props} />
  )
}
export default UseResultIconButton;