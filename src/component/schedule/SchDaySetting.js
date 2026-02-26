import React, {useEffect, useState, } from 'react';
import * as Actions from '../../Actions';
import { useSelector, useDispatch } from 'react-redux';
// import SchHeadNav from './SchHeadNav';
import SchEditDetailDialog from './SchEditDetailDialog';
// import SchTableHead from './SchTableHead';
import * as comMod from '../../commonModule';
import * as mui from '../common/materialUi';
import {LoadingSpinner, LoadErr} from '../common/commonParts';
// import SimpleModal from '../common/modal.sample';
import SchDailyDialog, {SchDailyDialogPropsOpen} from './SchDailyDialog';
import { makeStyles, createMuiTheme } from '@material-ui/core/styles';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
// import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
// import { common } from '@material-ui/core/colors';
// import AccessTimeIcon from '@material-ui/icons/AccessTime';
// import DriveEtaIcon from '@material-ui/icons/DriveEta';
// import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
// import AddCircleIcon from '@material-ui/icons/AddCircle';
import EachScheduleContent from './SchEachScheduleContent';
// import SchSaveLater from './SchSaveLater';
import { makeSchMenuFilter, menu, extMenu } from './Sch2';
import SchAddictionByDayDisp, { getAddictionFingerprint } from './SchAddictionByDayDisp';
import { green, pink, purple, amber, deepPurple } from '@material-ui/core/colors';
import { SchInitilizer } from './SchInitilizer';
import { LinksTab } from '../common/commonParts';
import { useHistory, useLocation, useParams, } from 'react-router-dom';
import { ArrowForwardIosSharp, CallMissedSharp, TrendingUp } from '@material-ui/icons';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import teal from '@material-ui/core/colors/teal';
import blue from '@material-ui/core/colors/blue';
import orange from '@material-ui/core/colors/orange';
import red from '@material-ui/core/colors/red';
import CheckIcon from '@material-ui/icons/Check';
import SchUserSetting from './SchUserSetting';
import {OccupancyRate} from './SchHeadNav';
import { GetNextHist } from '../Users/Users';
import { Button, createTheme } from '@material-ui/core';
import { HOHOU } from '../../modules/contants';
import { univApiCall } from '../../albCommonModule';
import ClearIcon from '@material-ui/icons/Clear';
import SnackMsg from '../common/SnackMsg';
import SchAddictionBulkUpdate from './SchAddictionBulkUpdate';
import { yellow } from '@material-ui/core/colors';
import { setBillInfoToSch } from '../Billing/blMakeData';
import { setLocalStorage } from '../../modules/localStrageOprations';
import { SchDaySettingNDReturn, SchDaySettingNDTarget } from './SchDaySettingNoDialog';
import BlockScreen from '../common/BlockScreen';
import SchLokedDisplay from '../common/SchLockedDisplay';
import { useSchLocked } from '../../modules/useSchLocked';
import { UserAttrInfo } from '../Users/UserAttrInfo';
import SchDailyReportSyncer from './SchDailyReportSyncer';
import { fSetUseResult } from '../Billing/utils/useResultUtils';

const useStyles = makeStyles({
  userInfo:{
    display:'flex',
    justifyContent:'center',
    paddingTop: 48,
    paddingBottom: 24,
    '& >div': {
      margin: '0 8px',
    }
  },
  eachAddiction: {
    '& .eachItem': {
      paddingTop: 4, paddingBottom: 4,
    },
    '& .name':{
      paddingTop: 2, paddingBottom: 2,
      '& .MuiSvgIcon-root':{
        fontSize: '.6rem', color:teal[600],
      },
    },
    '& .val':{
      paddingTop: 2, paddingBottom: 2,
      '& .MuiSvgIcon-root':{
        fontSize: '.6rem',
      },
    },
  },
  monthWrap: {
    marginTop: 80, flex: 1,
    '& .day': {
      cursor:'pointer',
      position: 'relative',
      '& .content': {
        minHeight: 80,
        position: 'relative',
        '& .eachItem': {
          paddingTop: 4, paddingBottom: 4,
        },
        '& .name':{
          paddingTop: 2, paddingBottom: 2,
          '& .MuiSvgIcon-root':{
            fontSize: '.6rem', color:teal[600],
          },
        },
        '& .val':{
          paddingTop: 2, paddingBottom: 2,
          '& .MuiSvgIcon-root':{
            fontSize: '.6rem',
          },
        },
    
      },
      '& .checkIcon':{
        color: teal[600], position:'absolute',
        right: '1rem', top: 4,
        '& .MuiSvgIcon-root': {fontSize:'1.0rem'}
      },
    },
  
    '& .counts, .usage': {
      paddingTop: 4, paddingBottom: 4,
      fontSize: '.7rem', textAlign: 'center',
      '& span': {fontSize: '1.0rem'},
      '& .wd': {color: teal[800]},
      '& .os': {color: orange[900]},
      '& .ab': {color: red[800]},
      '& .ur': {color: blue[800]},
    },
  },
  userSettingWrap:{position:'relative'},
  occuRateWrap:{paddingTop: 30, width: '100%'},
  useResultButtons:{
    position: 'absolute', top:98, right:8, width: 128,
    '& a': {display: 'block', paddingBottom: 8},
    '& .MuiButton-root': {width: '100%'},
    '& .dateLabel': {
      fontSize: '.9rem', textAlign: 'center', paddingBottom: 4, paddingTop: 16,
      color: teal[800],
    },
    '& .preMonth .MuiButton-root': {backgroundColor: red[800], },
    '& .msg': {fontSize: '.8rem', color: red[800], padding: '8px 0'},
    '@media print':{display: 'none'},
    "@media (max-width:599px)": {display: 'none',},


  },
});
const theme = createTheme({
  palette: {
    primary: {
      light: '#009688',
      main: '#00695c',
      dark: '#004d40',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff7961',
      main: '#f44336',
      dark: '#ba000d',
      contrastText: '#000',
    },
  },
});


// ローカルのステイトでコントロールしていたがstoreにuidを書き込むようにする
const UserSlect = (props)=>{
  const dispatch = useDispatch();
  const usersOrg = useSelector(state => state.users);
  let service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const serviceItems = useSelector(state => state.serviceItems);
  const contMode = useSelector(state => state.controleMode);
  const cntUid = contMode.uid;
  const [thisUid, setthisUid] = useState(cntUid);
  // サービス内容でユーザーリストを絞り込み
  const users = usersOrg.filter(e=>(
    e.service === service &&
    (classroom === '' || e.classroom === classroom)
  ));
  // パラメータで設定されたuidをstoreにセット。
  // 見つからなかったらメッセージを作成する
  // let uidFound = false;
  // if (puid){
  //   if (users.find(e => parseInt(e.uid) === parseInt(puid))){
  //     dispatch(Actions.setControleMode({ ...contMode, uid: parseInt(puid) }));
  //     uidFound = true;
  //   }
  // }
  // else{
    // storeのuidが現在のユーザーリストになければユーザーリストの先頭をセット
    // パラメータでuidが指定されているときはこの処理はしない    
  if (!users.find(e => parseInt(e.uid) === comMod.convUID(thisUid).num)) {
    setthisUid(users[0].uid);
    dispatch(Actions.setControleMode({ ...contMode, uid: users[0].uid }));
  }
  // }

  // セレクトのオプションを作成
  const Options = ()=>{
    const opt = users.map((e, i)=>{
      return(
        <option key={i} value={e.uid}>{e.name + ' ' + e.ageStr}</option>
      )
    });
    return opt;
  }
  const selectClass = {
    margin: theme.spacing(1),
    minWidth: 120,
  }
  const handleChange = (e) =>{
    const val = e.currentTarget.value; 
    setthisUid(val);
    dispatch(Actions.setControleMode({...contMode, uid: val}));
  }
  return(<>
    <FormControl style={selectClass}>
      <InputLabel >{props.name}</InputLabel>
      <Select
        native
        value={thisUid}
        name={'ご利用者選択'}
        onChange={(e) => handleChange(e)}
      >
        <Options />
      </Select>
    </FormControl>
  </>)
}

export const EachAddiction = (props) => {
  const classes = useStyles();
  const {thisAdc, classroom } = props;
  const addiction = thisAdc? thisAdc: {};
  console.log(addiction, 'addiction');
  // デバッグ用：addictionの値を確認
  console.log('EachAddiction - addiction:', addiction, 'type:', typeof addiction);
  
  const eachAdic = addiction && typeof addiction === 'object' 
    ? Object.keys(addiction).map((e, i)=>{
        // 上限管理加算を非表示
        if (e === '利用者負担上限額管理加算') return null;
        if (e === '上限管理結果') return null;
        
        // デバッグ用：eの値を確認
        console.log('EachAddiction - e:', e, 'type:', typeof e);
        
        // eがオブジェクトの場合はスキップ
        if (typeof e === 'object') {
          console.log('EachAddiction - skipping object key:', e);
          return null;
        }
        
        return(<div className='eachItem' key={i}>
          <div className='name'>
            <FiberManualRecordIcon  />
            {(() => {
              console.log('EachAddiction - shortWord input:', e, 'type:', typeof e);
              
              // serviceが空文字の場合、オブジェクトのキーを表示
              if (!classroom && typeof e === 'string' && e.startsWith('{')) {
                try {
                  const obj = JSON.parse(e);
                  const keys = Object.keys(obj);
                  return keys.length > 0 ? comMod.shortWord(keys[0]) : e;
                } catch (error) {
                  return comMod.shortWord(e);
                }
              }
              
              const result = comMod.shortWord(e);
              console.log('EachAddiction - shortWord result:', result, 'type:', typeof result);
              return result;
            })()}
          </div>
          <div className='val'>
            <ArrowForwardIosIcon />
            {(() => {
              const value = addiction[e];
              let displayValue;
              
              if (classroom) {
                // classroomが有効な場合：オブジェクトのプロパティ値を表示
                displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
              } else {
                // classroomが空の場合：オブジェクトの値を表示
                if (typeof e === 'string' && e.startsWith('{')) {
                  try {
                    const obj = JSON.parse(e);
                    const keys = Object.keys(obj);
                    displayValue = keys.length > 0 ? obj[keys[0]] : value;
                  } catch (error) {
                    displayValue = value;
                  }
                } else {
                  displayValue = value;
                }
              }
              
              const shortValue = comMod.shortWord(displayValue);
              return parseInt(shortValue) === 1 ? '選択' : shortValue;
            })()}
          </div>
        </div>);
      }).filter(item => item !== null) // nullの項目を除外
    : [];
  return(
    <div className={classes.eachAddiction}>
      {eachAdic}
    </div>
  )
}

// 一日の情報を表示する。加算項目と利用回数。
const DaySettingContent = (props) => {
  const {did, schCounts, bgColor, ...others} = props;
  const dCount = schCounts.didCounts[did];
  
  return (<>
    {dCount !== undefined &&
      <div className='counts'>
        <span className='wd'>{dCount.weekDayCnt}</span>{' / '}
        <span className='os'>{dCount.schoolOffCnt}</span>{' / '}
        <span className='ab'>{dCount.absenceCnt}</span>{' / '}
        <span className='ur'>{dCount.useResultCnt}</span>
      </div>
    }
    <div className='daySetteingInner'>
      <SchAddictionByDayDisp did={did} calenderView={true} disableTooltip={true} bgColor={bgColor} />
    </div>
  </>);
}

const SevenDaysGrid = (props)=>{
  const classes = useStyles();
  const dispatch = useDispatch()
  const dateList = useSelector(state=>state.dateList);
  const path = useLocation().pathname;
  const {setDialogOpen, setDialogDate} = props;
  const schedule = useSelector(state=>state.schedule);
  const service = useSelector(state=>state.service);
  const classroom = useSelector(state=>state.classroom);
  const history = useHistory();

  // 該当ユーザーのみのスケジュールを取得
  // const schedule = useSelector(state => state.schedule['UID' + thisUser]);
  const users = useSelector(state => state.users);

  // フローティングアクションボタンの値取得
  // 0 何もしない 1 追加削除 2 追加修正
  // let cntMode = useSelector(state => state.controleMode.fabSchedule);
  // cntMode = (cntMode === undefined) ? 0 : parseInt(cntMode);

  const template = useSelector(state => state.scheduleTemplate);
  // 7曜グリッド作成
  const daysGrid = comMod.makeDaysGrid(dateList);
  // クリックハンドラ
  const clickHandler = (e)=>{
    const targetDid = e.currentTarget.getAttribute('did');
    // if (!targetDid) return false; // didがなければ何もしない。
    // const targetDate = comMod.convDid(targetDid);
    // setDialogOpen(true);
    // setDialogDate(targetDate);
    // did形式をYYYY-MM-DD形式に直す
    const d = targetDid.slice(1, 5) + '-' + targetDid.slice(5, 7) + '-' + targetDid.slice(7, 9);
    setLocalStorage(SchDaySettingNDTarget, d);
    setLocalStorage(SchDaySettingNDReturn, '/schedule/dsetting');
    history.push('/schedule/daysetting/')
    
  }
  const schCounts = comMod.getScheduleInfo(schedule, service, users, classroom);
  const didCounts = schCounts.didCounts;

  // 加算設定の組み合わせ（フィンガープリント）に基づいて背景色を決定
  const lightColors = [blue[50], green[50], orange[50], pink[50], deepPurple[50], amber[50]];
  const fingerprints = {};
  const didToFp = {};
  dateList.forEach(e => {
    const did = comMod.convDid(e.date);
    const rawData = schedule?.[service]?.[did];
    const fp = getAddictionFingerprint(rawData, classroom);
    didToFp[did] = fp;
    if (fp) fingerprints[fp] = (fingerprints[fp] || 0) + 1;
  });
  // 出現頻度順にソート（最も多いものを背景色なしにする）
  const sortedFp = Object.entries(fingerprints).sort((a, b) => b[1] - a[1]);
  const fpToColor = {};
  sortedFp.forEach(([fp, count], idx) => {
    fpToColor[fp] = idx === 0 ? 'transparent' : lightColors[(idx - 1) % lightColors.length];
  });

  const OneWeek = (props)=>{
    const week = props.week.map((e, i)=>{
      const cls = ['', 'schoolOff', 'off'];// 学校休日休業日を示すクラスリスト
      const wdClass = (e !== '')? cls[e.holiday]:'';
      // 日付オブジェクトをdid形式に変換
      const did = (e !== '') ? comMod.convDid(e.date):''
      const bgColor = fpToColor[didToFp[did]] || 'transparent';
      // 利用実績を示すチェックを表示
      const ResultOfUse = () => {
        const c = didCounts[did];
        const n = c? c.schoolOffCnt + c.weekDayCnt: null;
        const r = c? c.useResultCnt: null;
        // const s = {color: teal[600], '& .MuiSvgIcon-root': {fontSize:'.7rem'}}
        if (r && r === n){
          return (<div className='checkIcon'><CheckIcon/></div>);
          // return (<div style={s}><CheckIcon/></div>);
        }
        else{
          return null;
        }
      }
      return(
        <div className={'day '} key={i} 
          did = {did}
          onClick = {(e)=>clickHandler(e)}
        >
          {(e !== '') &&
            <div className={'dayLabel ' + wdClass}>
              {e.date.getDate()}
              <ResultOfUse />
            </div>
          }
          <div className='content'>
            <DaySettingContent did={did} schCounts={schCounts} bgColor={bgColor}/>
          </div>
        </div>
      );
    });
    return (<div className='week'>{week}</div>);
  }
  const weeks = daysGrid.map((e, i)=>{
    return (
      <OneWeek week={e} key={i} />
    );
  });
  return (
    <div className={'monthWrapper ' + classes.monthWrap}>
      <div className="month">
        <div className='week'>
          <div className='day weekLabel'>日</div>
          <div className='day weekLabel'>月</div>
          <div className='day weekLabel'>火</div>
          <div className='day weekLabel'>水</div>
          <div className='day weekLabel'>木</div>
          <div className='day weekLabel'>金</div>
          <div className='day weekLabel'>土</div>
        </div>
        {weeks}
      </div>
      <div className='usage'>
        <span className='wd'>平日利用</span>{' / '}
        <span className='os'>休日利用</span>{' / '}
        <span className='ab'>欠席</span>{' / '}
        <span className='ur'>利用実績</span>
      </div>
    </div>
  );
}


// 機能追加　2022-11-24
// スタッフ権限　月内のみ操作可能
// マネージャー以上　次月以降も操作可能
// 前月の操作を行おうとすると「確定にする」に変更になる
// scheduleにrockedを与えて全ての変更操作を排除するように他モジュールを調整する
export const SetUseResult = (props) => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const allState = useSelector(state=>state);
  const {
    hid, bid, stdDate, classroom, users, service, account,
    com, serviceItems, dateList
  } = allState;
  const scheduleLocked = allState.schedule.locked;
  const permission = comMod.parsePermission(account)[0][0];
  const [fetchedSch, setFetchedSch] = useState(null);
  const [dolock, setDolock] = useState(null);
  // ブロックスクリーン用
  const [delay, setDelay] = useState(0);
  
  // propsの終了日付は文字列で。2023-04-01 20230401 D20230401など
  let {
    schedule: sch, style, endDate, toggle,
    billingDt = null, masterRec = null,
  } = props;
  // ローカルscheduleを持たないパターン
  if (!sch) sch = {...allState.schedule};
  // propsから取得するスタイルがあれば
  if (!style) style = {};
  const [snack, setSnack] = useState({msg:'', severity:''})
  // 実績セット、リセットする日付をdid形式で
  const st = 'D' + stdDate.replace(/\-/g, ''); // 2022-04-01 -> D20220401;
  let ed;
  const edStdDate = comMod.getDateEx( // 当月の月末
    stdDate.split('-')[0], stdDate.split('-')[1], 0
  ).dt;
  if (edStdDate < new Date()) ed = comMod.convDid(edStdDate);
  else if (endDate){
    endDate = endDate.replace(/[^0-9]/g, '');
    ed = 'D' + endDate;
  }
  else{
    let t = new Date();
    t.setHours(t.getHours() - 18);
    ed = comMod.convDid(t);
  }

  // スケジュールロックの状態を取得
  const schLocked = useSchLocked(ed);
  const fDate = new Date(new Date().setDate(1));
  const thisMonthStr = comMod.formatDate(fDate, 'YYYY-MM-DD');
  const preMonth = (thisMonthStr > stdDate);
  const prms = { stdDate, schedule: sch, users, com, service, serviceItems };
  prms.calledBy = 'SetUseResult';
  // calledBy対応済み
  // let { billingDt, masterRec } = setBillInfoToSch(prms);
  if (!billingDt || !masterRec) {
    const generatedValues = setBillInfoToSch(prms);
    billingDt = billingDt || generatedValues.billingDt; // すでに存在する場合は props の値を優先
    masterRec = masterRec || generatedValues.masterRec;
  }
  useEffect(()=>{
    let isMounted = true;
    if (isMounted && fetchedSch && dolock !== null){
      const p = {
        dolock,ed,preMonth,users,service,fetchedSch,sch,
        classroom,bid,props,dateList,billingDt,st,hid,
        masterRec,com,stdDate,account,setSnack,dispatch, 
      }
      fSetUseResult(p);
    }
    return (() => isMounted = false);
  }, [fetchedSch, dolock])

  const clickHandler = (value) => {
    setDelay(300); // ブロックスクリーン用
    setDolock(value);
    const sendPrms = {a: 'fetchSchedule', date: stdDate, hid, bid};
    univApiCall(
      sendPrms, 'E49982', setFetchedSch, setSnack, 'データの再読み込みを行いました。',
      'データの再読み込みでエラーが発生しました。'
    );
  }

  // 今日の日付より先の指定をされたら無条件でnull
  if (ed > comMod.convDid(new Date())) return null;
  const thisMonth1st = comMod.formatDate(new Date(new Date().setDate(1)), 'YYYY-MM-DD');
  // トグルモードでは、先月の実績の確定は行わない
  if (toggle && thisMonth1st > stdDate) return null;
  const edStr = parseInt(ed.slice(5,7)) + '月' + parseInt(ed.slice(7,9)) + '日';
  const todayStr = comMod.formatDate(new Date(), 'YYYY-MM-DD');
  // 確定ボタンを無効にする条件。月内ならOK 月を超えたらマネージャー以外は操作不能
  const kakuteiButtonDisabled = scheduleLocked || (preMonth && permission < 90)
  const displayKaijo = !preMonth || permission >= 90;
  if (todayStr < stdDate) return null;
  if (ed.replace(/\D/g, '') > todayStr.replace(/\D/g, '')) return null;
  if (toggle){
    return (
      <div className={classes.useResultButtons} style={style}>
        <a>
          {schLocked === false && <>
            <div className='dateLabel'>{edStr}まで</div>
            <div className={preMonth && !kakuteiButtonDisabled ? 'preMonth': ''}>
              <Button
                variant='contained'
                color='primary'
                onClick={()=>clickHandler(true)}
                disabled = {kakuteiButtonDisabled}
                startIcon={<CheckIcon/>}
              >
                {preMonth?'確定にする': '実績にする'}
              </Button>
            </div>
            
          </>}
          {schLocked === true && <>
            <Button
              variant='contained'
              color='secondary'
              onClick={()=>clickHandler(false)}
              startIcon={<ClearIcon/>}
              disabled={!displayKaijo}
            >
              {preMonth?'確定を解除': '実績を解除'}
            </Button>

          </>}
        </a>
      </div>
    )
  }
  return (
    <div className={classes.useResultButtons} style={style}>
      <a>
        <div className='dateLabel'>{edStr}まで</div>
        <div className={preMonth && !kakuteiButtonDisabled ? 'preMonth': ''}>
          <Button
            variant='contained'
            color='primary'
            onClick={()=>clickHandler(true)}
            disabled = {kakuteiButtonDisabled}
            startIcon={<CheckIcon/>}
          >
            {preMonth?'確定にする': '実績にする'}
          </Button>
        </div>
      </a>
      {displayKaijo &&
        <a>
          <Button
            variant='contained'
            color='secondary'
            onClick={()=>clickHandler(false)}
            startIcon={<ClearIcon/>}
          >
            {preMonth?'確定を解除': '実績を解除'}
          </Button>
        </a>
      }
      {props.endDate && preMonth &&
        <div className='msg'>
          前月は日ごとの実績処理ではなく確定処理のみ実行可能です。
        </div>
      }
      <SnackMsg {...snack}/>
      <BlockScreen delay={delay} message={'処理中です'} />

    </div>
  )
}

const MainSchDaySetting = ()=>{
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const sSchedule = useSelector(state => state.schedule);
  const dateList = useSelector(state => state.dateList);
  const stdDate = useSelector(state => state.stdDate);

  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);

  
  const dispatch = useDispatch();
  // storeのスケジュールとは別にローカルステイとのスケジュールを設定
  const [schedule, setSchedule] = useState(sSchedule);
  // ダイアログ用のstate
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState(null);
  const [userAttr, setUserAttr] = useState([]);

  const dialogPrms = {
    dialogDate, setDialogDate, dialogOpen, setDialogOpen,
    schedule, setSchedule,
  };
  const gridPrms = {setDialogOpen, setDialogDate};
  const menuFilter = makeSchMenuFilter(stdDate);
  if (service === HOHOU){
    const style = {marginTop: 120, textAlign: 'center'}
    return (<>
      <LinksTab menu={menu} menuFilter={menuFilter} extMenu={extMenu}/>
      <div style={style}>
        このページは{HOHOU}に対応していません。
      </div>
    </>)
  }

  const userSettingPrms = {userAttr, setUserAttr}
  return(<>
    <LinksTab menu={menu} menuFilter={menuFilter} extMenu={extMenu}/>
    <div className="AppPage schByUsers flex">
      <div className={classes.occuRateWrap}>
        <OccupancyRate displayMode='wide' />
      </div>
      {/* <div className={classes.userSettingWrap}>
        <SchUserSetting {...userSettingPrms}/>
      </div> */}
      <SevenDaysGrid {...gridPrms} />
      <SchDailyDialogPropsOpen {...dialogPrms} />
    </div>
    <SetUseResult schedule={schedule} setSchedule={setSchedule} />
    <GetNextHist />
    <SchInitilizer />
    <SchLokedDisplay/>
    <SchDailyReportSyncer />
    <UserAttrInfo userAttr={userAttr}/>
  </>)
}


const SchDaySetting = ()=>{

  const allstate = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allstate);
  if (loadingStatus.loaded){
    return(
      <MainSchDaySetting />
    )
  }
  else if (loadingStatus.error){
    return (
      <LoadErr loadStatus={loadingStatus} errorId={'E4943'} />

    )
  }
  else{
    return <LoadingSpinner/>
  }

}
export default SchDaySetting;