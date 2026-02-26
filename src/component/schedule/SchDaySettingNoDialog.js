import React, { useEffect, useState, useRef } from 'react';
import { formatDate, getLodingStatus, getScheduleInfo, qslct, typeOf } from '../../commonModule';
import { useDispatch, useSelector } from 'react-redux';
import { GoBackButton, LoadErr, LoadingSpinner } from '../common/commonParts';
import { SetUseResult } from './SchDaySetting';
import { Button, colors, makeStyles } from '@material-ui/core';
import { schLocked, univApiCall } from '../../albCommonModule';
import SchByDateStartEndInput from './SchByDateStartEndInput';
import * as Actions from '../../Actions';
import { DairyAddiction } from './SchDailyDialog';
import { SchMultipleDateAddiction } from './SchMultipleDateAddiction';
import SnackMsg from '../common/SnackMsg';
import AccessTimeIcon from '@material-ui/icons/AccessTime';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faYenSign, faCalendarPlus } from '@fortawesome/free-solid-svg-icons';
import { grey, orange, red, teal } from '@material-ui/core/colors';
import { useHistory } from 'react-router';
import { getLocalStorage } from '../../modules/localStrageOprations';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import SchLokedDisplay from '../common/SchLockedDisplay';
export const SchDaySettingNDTarget = 'SchDaySettingNDTarget';
export const SchDaySettingNDReturn = 'SchDaySettingNDReturn';
export const DAYSETTING_START_END = 'START_END';
export const DAYSETTING_MENU = 'MENU';
export const DAYSETTING_ADDICTION = 'DAY_ADDICTION';
export const DAYSETTING_MULTIPLE_ADDICTION = 'MULTIPLE_ADDICTION';

const useStyles = makeStyles({
  cancellBtn: {
    marginTop: 24,
  },
  faIcon:{
    padding: 0, fontSize: 20, 
    width: 24, textAlign: 'center', display: 'inline-block',
    height: 24, marginTop: -12
  },
  menuTitle: {
    position: 'relative',
    '& .main': {
      padding: 4, textAlign: 'center', fontSize: '1.2rem',
      '& span': {fontSize: '1.2rem', color: teal[800]},
    },
    '& .sub': {
      display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
      borderBottom: '1px solid ' + teal[400],
      marginBottom: 16, padding: 4,
    },
    '& .buttonNext':{position: 'absolute',top: 0, right: 0,},
    '& .buttonPre':{position: 'absolute',top: 0, left: 0,},

  },

  daySettingRoot:{
    marginTop: 80, width: 708, marginLeft: 'calc((100vw - 708px) / 2 + 40px)',
    '& .buttonWrap': {
      width: '50%', marginLeft: '25%', marginTop: 20,
      '& .MuiButton-root': {width: '100%'}
    },
    '& .locked':{
      width: '50%', marginLeft: '25%', marginTop: 8, color: red[800], 
      fontSize: '.8rem',
    },
    '& .menuTitle': {
      '& .main': {
        padding: 4, textAlign: 'center', fontSize: '1.2rem',
        '& span': {fontSize: '1.2rem', color: teal[800]},
      },
      '& .sub': {
        display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
        borderBottom: '1px solid ' + teal[400],
        marginBottom: 24, padding: 4,
      },
    },
    '& .nouse': {
      textAlign: 'center', color: red[800], paddingTop: 20, fontSize: '1.2rem'
    }
  }
});
// yyyyy-mm-dd形式からDYYYYMMDD形式へ変換
const makeDid = (s) => ('D' + s.replace(/[^0-9]/g, ''))

// targetDateをprops化
export const SchDaySettingMenuTitle = (props) => {
  const classes = useStyles();
  const {title, targetDate, setTargetDate, style} = props;
  const dateList = useSelector(state => state.dateList);

  // const targetDate = localStorage.getItem(SchDaySettingNDTarget);
  const thisDate = parseInt(targetDate?.split('-')[2]);

  const l = 6;
  let startDate = (thisDate - l - 1) < 0? 0: (thisDate - l - 1);
  let endDate = (thisDate + l) > dateList.length? dateList.length: thisDate + l; 
  if (endDate - startDate < l * 2 + 1){
    if (startDate === 0){
      endDate = l * 2 + 1;
    }
    else {
      startDate = endDate - (l * 2 + 1)
    }
  }
  // ターゲット日付を変更する
  const handleDateClick = (d) => {
    const t = formatDate(d, 'YYYY-MM-DD');
    setTargetDate(t);
    localStorage.setItem(SchDaySettingNDTarget, t);
  }
  const handleClick = (ev, v) => {
    const d = new Date(targetDate);
    d.setDate(d.getDate() + v);
    const newTarget = formatDate(d, 'YYYY-MM-DD');
    setTargetDate(newTarget);
    localStorage.setItem(SchDaySettingNDTarget, newTarget);
  }


  // 今日を中心にした日にちを表示する
  const daysDisp = dateList.slice(startDate, endDate).map((e, i)=>{
    const style = {fontSize: '.8rem', marginLeft: 4, marginRight: 4, };
    if (typeof setTargetDate === 'function'){
      style.cursor= 'pointer';
    }

    if (e.date.getDate() === thisDate){
      style.color = teal[800];
      style.fontSize = '1.6rem';
    }
    else if (e.holiday === 1){
      style.color = orange[400];
    }
    else if (e.holiday === 2){
      style.color = grey[400];
    }
    // クリッカブルで無いとき
    if (typeof setTargetDate !== 'function' && e.date.getDate() !== thisDate){
      style.opacity = .4;
      style.fontSize = '.6rem';
    }
    const Nichi = () =>{
      const style = {fontSize: '.8rem', color: teal[800]}
      if (e.date.getDate() === thisDate){
        return <span style={style}>日</span>
      }
      else return null;
    }
    return (
      <div key={i} style={style}
        onClick = {(ev, date)=>handleDateClick(e.date)}
      >
        {e.date.getDate()}
        <Nichi/>
      </div>
    )
  })
  const isLastDayOfMonth = dateString => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const tomorrow = new Date(year, month - 1, day + 1);
    return tomorrow.getMonth() !== date.getMonth();
  }
  // 月末と月初を判定する 月末と月初は該当する日付移動ボタンを無効にする。
  const isFistDay = parseInt(targetDate?.split('-')[2] ?? 0) === 1;
  const isLastDay = (() => {
    const [year, month, day] = targetDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const tomorrow = new Date(year, month - 1, day + 1);
    return tomorrow.getMonth() !== date.getMonth();
  })();
  return(
    <div className={classes.menuTitle} style={style}>
      {(typeof setTargetDate) === 'function' && <>
        <div className='buttonNext'>
          <Button 
            onClick={(ev)=>handleClick(ev, 1)} disabled={isLastDay}
            endIcon={<ArrowForwardIosIcon/>}
            color='primary'
          >
            翌日
          </Button>
        </div>
        <div className='buttonPre'>
          <Button 
            onClick={(ev)=>handleClick(ev, -1)} disabled={isFistDay}
            startIcon={<ArrowBackIosIcon/>}
            color='primary'
          >
            前日
          </Button>
        </div>
      </>}

      <div className='main'>
        {title}
      </div>
      <div className='sub'>{daysDisp}</div>
    </div>
  )
}

const SchDaySettingNoDialogMain = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const [targetDate, setTargetDate] = useState(
    localStorage.getItem(SchDaySettingNDTarget)
  );
  const [mode, setMode] = useState([DAYSETTING_MENU]); // 表示モードの切替 ヒストリを保持する
  const [sch, setSch] = useState({}); // localのスケジュール
  const allState = useSelector(state=>state);
  const {hid, bid, stdDate, users, service, classroom, dateList} = allState;
  const sSchedule = allState.schedule;
  const [snack, setSnack] = useState({msg: '', severity: ''})
  const schInfo = getScheduleInfo(sSchedule, service, users, classroom);
  const thisDateCnt = schInfo.didCounts[makeDid(targetDate)];
  // modeの切り替え
  const chMode = (v) =>{
    const t = [...mode];
    t.unshift(v);
    setMode(t.slice(0, 3));
  }
  const fetchSch = async (hid, bid, date) => {
    const prms = {a: 'fetchSchedule', hid, bid, date};
    const r = await univApiCall(prms,'','',setSnack);
    if (r.data && r.data.result){
      setSch(r.data.dt[0].schedule);
    }
  }
  useEffect(()=>{
    // メニュー画面から入力画面に切り替わったらフェッチしたスケジュールを
    // localstateにセット
    const tobeFetch = () => {
      if (mode[0] === DAYSETTING_START_END && mode[1] === DAYSETTING_MENU){
        return true;
      }  
    else if (mode[0] === DAYSETTING_ADDICTION && mode[1] === DAYSETTING_MENU){
        return true;
      }
    else if (mode[0] === DAYSETTING_MULTIPLE_ADDICTION && mode[1] === DAYSETTING_MENU){
      return true;
    }
      else{
        return false;
      }
    }
    if (tobeFetch()){
      fetchSch(hid, bid, stdDate);
    }
  }, [mode]);

  useEffect(()=>{
    return () => {
      const t = {...sSchedule, ...sch};
      setTimeout(()=>{
        const closed = !qslct('#daySettingNoDialog3445');
        if (closed && Object.keys(t).length){
          t.timestamp = new Date().getTime();
          dispatch(Actions.setStore({schedule: t}));
        }
      }, 300)
    }
  }, [sch])

  // 利用数なしの判定方法変更 2023/09/29 吉村
  if (!thisDateCnt || (thisDateCnt.weekDayCnt + thisDateCnt.schoolOffCnt === 0)){
    return(<>
      <div className={classes.daySettingRoot}>
        <SchDaySettingMenuTitle 
          title={"日ごとの加算設定"} 
          targetDate={targetDate}
          setTargetDate={setTargetDate}
        />

        <div className='nouse'>
          利用がありません。
        </div>
      </div>
      <GoBackButton  posX={90} posY={0}/>
      <div id='daySettingNoDialog3445'></div>

    </>)
  }
  return(<>
    <div className={classes.daySettingRoot}>
      <MenuDisp 
        targetDate={targetDate} setTargetDate={setTargetDate}
        mode={mode} chMode={chMode}
      />
      <StartAndEndDisp 
        mode={mode} targetDate={targetDate}
        sch={sch} setSch={setSch} setSnack={setSnack} chMode={chMode}
      />
      <DairyAddictionDisp 
        mode={mode} targetDate={targetDate}
        sch={sch} setSch={setSch} setSnack={setSnack} chMode={chMode}
      />
      <MultipleDateAddictionDisp 
        mode={mode} targetDate={targetDate}
        sch={sch} setSch={setSch} setSnack={setSnack} chMode={chMode}
      />
    </div>
    <SnackMsg {...snack}/>
    <div id='daySettingNoDialog3445'></div>
    <SchLokedDisplay/>
  </>)

}

const CancelButton = () => {
  const classes = useStyles();
  const history = useHistory();
  // 戻り先をローカルストレージから取得
  const rt = getLocalStorage(SchDaySettingNDReturn);
  const handleClick = () => {
    if (rt) {
      history.push(rt)
    }
    else {
      history.goBack();
    }
  }
  return(
    <div className={classes.cancellBtn}>
      <Button
        variant='contained' color='secondary'
        onClick={()=>handleClick()}
      >
        キャンセル
      </Button>

    </div>
  )
}

const MenuDisp = (props) => {
  const {targetDate, setTargetDate, mode, chMode} = props;
  const classes = useStyles();
  const history = useHistory();
  const allState = useSelector(state=>state);
  const {users, service, classroom} = allState;
  const sSchedule = allState.schedule;

  if (mode[0] !== DAYSETTING_MENU) return null;
  const did = makeDid(targetDate);
  const locked = schLocked(sSchedule, users, '', did, service, classroom);
  const style = {position: 'static', width: '50%', marginLeft: '25%'}
  const goBackTarget = getLocalStorage(SchDaySettingNDReturn)
  ? getLocalStorage(SchDaySettingNDReturn): '/schedule';
  const menuTitlePrms = {
    title: "日付別設定メニュー",
    targetDate, setTargetDate
  }
  return(<>
    <SchDaySettingMenuTitle {...menuTitlePrms} targetDate={targetDate} />
    <SetUseResult endDate={targetDate} style={style} />
    <div className='buttonWrap'>
      <Button
        variant='contained' color='primary'
        // onClick={()=>chMode(DAYSETTING_START_END)}
        onClick={() => history.push(`/schedule/listinput/perdate/${targetDate.slice(-2)}/`)}
        disabled={locked}
        startIcon={<AccessTimeIcon/>}
      >
        日付別一覧入力
      </Button>
    </div>
    <div className='buttonWrap'>
      <Button
        variant='contained' color='primary'
        onClick={()=>chMode(DAYSETTING_ADDICTION)}
        disabled={locked}
        startIcon={
          <span className={classes.faIcon} >
            <FontAwesomeIcon icon={faYenSign} />
          </span>
        }
      >
        日ごとの加算設定
      </Button>
    </div>
    <div className='buttonWrap'>
      <Button
        variant='contained' color='primary'
        onClick={()=>chMode(DAYSETTING_MULTIPLE_ADDICTION)}
        disabled={locked}
        startIcon={
          <span className={classes.faIcon} >
            <FontAwesomeIcon icon={faCalendarPlus} />
          </span>
        }
      >
        複数日付加算設定
      </Button>
      <CancelButton/>
    </div>
    <GoBackButton posX={90} posY={0} url={goBackTarget}/>
  </>)
}

const StartAndEndDisp = (props) =>{
  const {mode, targetDate, sch, setSch, setSnack, chMode} = props;
  const prms = {
    schedule: sch, setSchedule: setSch, date: targetDate, setSnack, chMode,
    mode,
  }
  return (<>
    {mode[0] === DAYSETTING_START_END &&
      <SchDaySettingMenuTitle title={"開始終了時間一括入力"} targetDate={targetDate} />
    }
    <SchByDateStartEndInput {...prms}/>
  </>)
}

const DairyAddictionDisp = (props) => {
  const {mode, targetDate, sch, setSch, setSnack, chMode} = props;
  const prms = {
    schedule: sch, setSchedule: setSch, date: targetDate, setSnack, chMode,
    mode,
  }
  return (<>
    {mode[0] === DAYSETTING_ADDICTION &&
      <SchDaySettingMenuTitle title={"日ごとの加算設定"} targetDate={targetDate}/>
    }
    <DairyAddiction {...prms}/>
  </>)
}

const MultipleDateAddictionDisp = (props) => {
  const {mode, targetDate, sch, setSch, setSnack, chMode} = props;
  const prms = {
    schedule: sch, setSchedule: setSch, date: targetDate, setSnack, chMode,
    mode,
  }
  return (<>
    {mode[0] === DAYSETTING_MULTIPLE_ADDICTION &&
      <SchDaySettingMenuTitle title={"複数日付加算設定"} targetDate={targetDate}/>
    }
    {mode[0] === DAYSETTING_MULTIPLE_ADDICTION &&
      <SchMultipleDateAddiction {...prms}/>
    }
  </>)
}
// ダイアログなしの日毎のスケジュール編集。
// SchDaySettingNDTargetをローカルストレージから取得する
export const SchDaySettingNoDialog = () => {
  const allstate = useSelector(state=>state);
  const loadingStatus = getLodingStatus(allstate);
  if (loadingStatus.loaded){
    return(<>
      <SchDaySettingNoDialogMain/>
    </>)
  }
  else if (loadingStatus.error){
    return (<>
      <LoadErr loadStatus={loadingStatus} errorId={'E39981'} />
    </>)
  }
  else{
    return(<>
     <LoadingSpinner/>
    </>)
  }
}
export default SchDaySettingNoDialog;