import React, { useEffect, useState, useRef, Profiler, useMemo } from 'react';
import * as Actions from '../../Actions';
import { 
  connect, useDispatch, useSelector, 
  // ReactReduxContext  
} from 'react-redux';
import * as comMod from '../../commonModule';
import { HOHOU } from '../../modules/contants';
import * as albcm from '../../albCommonModule';
import SchEditDetailDialog from './SchEditDetailDialog';
import SchByUserDialog from './SchByUserDialog';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import { useLocation } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import {red, teal, blue, yellow, purple, pink} from '@material-ui/core/colors/';
import SnackMsg from '../common/SnackMsg';
import * as mui from '../common/materialUi'
import {Uaddiction} from '../common/commonParts';
import { didPtn } from '../../modules/contants';
import { isServiceEditAllowed } from '../../modules/serviceEditPermission';
import CheckIcon from '@material-ui/icons/Check';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { getLocalStorageItemWithTimeStamp, setLocalStorageItemWithTimeStamp } from '../../modules/localStrageOprations';
import { DispNameWithAttr } from '../Users/Users';
import { FAV_ADDREMOVE, FAV_ADDEDIT, FAV_REMOVE, FAV_PASTE } from './SchFab';
import { UserAttrInfo } from '../Users/UserAttrInfo';
import DoneIcon from '@material-ui/icons/Done';
import { LC2024 } from '../../modules/contants';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import ErrorIcon from '@material-ui/icons/Error';
import CloseIcon from '@material-ui/icons/Close';
import { DADDICTION_HOHOU } from '../Billing/BlCalcData2021';
import PauseIcon from '@material-ui/icons/Pause';
import { getUsersTimetable } from '../../modules/getUsersTimetable';
import { kessekiSvc } from '../Billing/blMakeData2024';
import { kessekiSvc as kessekiSvc2021 } from '../Billing/blMakeData2021';


export const cellHighlightLifeTime = 120 * 60; // 編集したセルを強調表示する時間

const useStyles = makeStyles({
  absIconRoot: {
    position: 'absolute', top: 2, color: red[900], width: '80%',
    '& .MuiSvgIcon-root':{
      width: '.85em'
    },
    '& .kasan': {color: blue[900]}
  },
  namerator: {
    width: 30,
  },
  useChecked: {
    position: 'absolute', top:2, left:2, 
    '& .MuiSvgIcon-root': {color:teal[600], fontSize: 16, opacity: .6}
  },
  rowTitle: {
    position: 'relative',
    '& .rowHover': {position: 'absolute', top:0, bottom:0, width:4, left: -2},
  },
  sendNoticeDisp: {
    position: 'absolute', top: 4, right: 4, padding: 2,
    // color: '#eee', backgroundColor: teal[600], 
    color: teal[600],
    transition: '.6s',
    fontSize: '.6rem',
    '& .MuiSvgIcon-root': {fontSize: '1.2rem'}
  },
  notJikanKubun: {
    '& .MuiSvgIcon-root': {fontSize: '1rem', color: '#e77052'}
  },
});
export const useStylesFade = makeStyles({
  dateCellFade: {
    animation: '$colorchangeKF 4s'
  },
  // dateCellFadeEnd : {
  //   '&.dateCell':{backgroundColor: yellow[100]},
  //   '&.dateCell.off':{backgroundColor: '#dfdab4'},
  //   '&.dateCell.schoolOff':{backgroundColor: '#ffe8b5'},
  //   '&.dateCell.mwfClass':{backgroundColor: '#f5efbc'},
  // },
  dateCellFadeEnd : {
    backgroundColor: yellow[100],
    '&.dateCell':{backgroundColor: yellow[100]},
    '&.dateCell.off':{backgroundColor: yellow[100]},
    '&.dateCell.schoolOff':{backgroundColor: yellow[100]},
    '&.dateCell.mwfClass':{backgroundColor: yellow[100]},
    '&.off .dateContent':{backgroundColor: yellow[100]},
    '&.schoolOff .dateContent':{backgroundColor: yellow[100]},
    '&.mwfClass .dateContent':{backgroundColor: yellow[100]},
    '&.hiliteMark': {backgroundColor: yellow[600]},
  },
  '@keyframes colorchangeKF': {
    '0%': {backgroundColor: yellow[500]},
    '100%': {backgroundColor: yellow[100]}
  }

})

// 管理タイプを表示
const KanriType = (props)=>{
  if (!props.kanri_type)  return '';
  else{
    const c = (props.kanri_type.substr(0, 1) === '管') ? '管':'協';
    const cn = (props.kanri_type.substr(0, 1) === '管') ? '' : 'kyo'
    return(
      <span className={"kanriType " + cn}>{c}</span>
    )
  }
}

// ユーザーごとの利用回数を求める
// 欠席加算などを取得したときは absence の後でも回数に入れるべき？
// serviceはユーザーのserviceカンマ含むことあり
// sService ステイトのサービス
// schは一人分のスケジュールデータ
export const countVisit = (sch, service, sService) => {
  if (!service) return {cnt: 0, other: 0};
  if (!sch) return {cnt: 0, other: 0};
  const svc = service.split(',');
  let cnt = 0, other = 0, transfer = 0;
  Object.keys(sch).map(e =>{
    const otherSvc = (svc.length > 1 && sch[e].service !== sService)
    // 保訪以外でサービスが一致しないものはカウントしない
    // if (otherSvc && sService !== HOHOU) return false;
    // if (otherSvc && sService === HOHOU){
      
    // }
    // 他サービスだったらカウントしない
    if (otherSvc) return false;
    if (e.indexOf('D') !== 0){
      return false;
    }
    if (!sch[e].absence){
      cnt++;
    }
    else if (comMod.findDeepPath(sch[e], 'dAddiction.欠席時対応加算')){
      other++;
    }
    else if (comMod.findDeepPath(sch[e], 'dAddiction.家庭連携加算')){
      other++;
    }
    else if (comMod.findDeepPath(sch[e], 'dAddiction.事業所内相談支援加算')){
      other++;
    }
    if (!sch[e].absence){
      // 送迎数のカウント。末尾先頭が*は除く
      transfer += (sch[e]?.transfer ?? []).filter(f=>f && !f.match(/(^\*)|(\*$)/)).length ?? 0;
    }
    
  });
  return {cnt, other, transfer};
}
// 複数サービスのvplumeを求める
// userobjとステイト上のserviceを引数とする
// -> ステイト上のサービスと言うか対象のサービスだこの場合
export const getVolume = (thisUser, sService, stdDate) => {
  if (!thisUser) return 0;
  if (!thisUser.service) return 0;
  const svc = thisUser.service.split(',');
  let volume;
  if (svc.length === 1) volume = thisUser.volume;
  else if (svc.includes(sService)){
    const v = comMod.fdp(thisUser, 'etc.multiSvc.' + sService + '.volume', 0);
    // countClass = count.cnt + count.other > v ? ' over' : '';
    volume = v;
  }
  else return 0;
  volume = parseInt(volume);
  // 規定の日数
  if (volume === 0){
    const year = stdDate.split('-')[0];
    const month = stdDate.split('-')[1];
    const thisMonthDays = new Date(year, month, 0).getDate();
    volume = thisMonthDays - 8;
  }
  return volume;
}


const RowTitle = (props) => {
  const classes = useStyles();
  const {
    thisUser, index, sch, setSch, setSnack, // userCh, setUserCh
    setUserOpe,
    hoveredCell,
    userAttr, setUserAttr,
    sendNotice, setSendNotice,
    service,

  } = props;
  const userService = thisUser.service;
  const sService = service;
  const count = countVisit(sch, userService, sService);
  const schedule = useSelector(state=>state.schedule);
  const stdDate = useSelector(state=>state.stdDate);
  const UID = 'UID' + thisUser.uid;
  const thisUserAddiction = comMod.findDeepPath(
    schedule, [sService, UID, 'addiction']
  );
  const ruStyle = albcm.recentUserStyle(UID);
  const fontSizeStyle = index >= 99? {fontSize: '.7rem'}: {};
  // 複数サービスユーザ対応のためにボリュームを取得する
  const thisVolume = getVolume(thisUser, sService, stdDate);
  let countClass = count.cnt > thisVolume ? ' over' : '';
  // let countClass = count.cnt + count.other > getVolume() ? ' over' : '';
  const hoverStyle = UID === hoveredCell?.UID ? {backgroundColor: teal[300]}: {};
  const style = {...ruStyle, ...fontSizeStyle, }
  useEffect(() => {
    if (sendNotice.done === true && sendNotice.result === true) {
      const timer = setTimeout(() => {
        setSendNotice({ done: false, result: null });
      }, 4000);
      // クリーンアップ関数を返すことで、コンポーネントがアンマウントされたときにタイマーをクリアします
      return () => {
        clearTimeout(timer);
      };
    }
  }, [sendNotice]);
  let sendNoticeStyle, sendNoticeContent;
  if (sendNotice.done && sendNotice.result){
    sendNoticeStyle = {opacity: .8, color: teal[600]};
  }
  else if (!sendNotice.done && sendNotice.result === null){
    sendNoticeStyle = {opacity: 0, color: teal[600]};
  }
  else if (sendNotice.done && sendNotice.result === false){
    sendNoticeStyle = {opacity: .8, color: red[600]};
  }
  const SendNoticeContent = () => {
    return (
      <div className={classes.sendNoticeDisp} style={sendNoticeStyle}>
        <CheckCircleIcon/>
      </div>

    )
  }
  return (<>
    <div 
      className={'wmin center rowTitle noBkColor ' + classes.rowTitle} 
      id={'UID' + thisUser.uid + 'RT'}
      style = {style}
    >
      <div className='rowHover' style={hoverStyle}></div>
      <div>{index + 1}</div>
      <div>
        <KanriType kanri_type={thisUser.kanri_type} />
      </div>
    </div>
    <div className='w15 scdRowUserTitle'
      // onClick={clickHandler}
      uid={'UID' + thisUser.uid}
      did={""}
      service={thisUser.service}
      operation={1}
      off={""}
    >
      <div className="name">
        {/* {thisUser.name} */}
        <DispNameWithAttr {...thisUser} userAttr={userAttr} setUserAttr={setUserAttr}/>
        {/* <KanriType kanri_type = {thisUser.kanri_type} /> */}
      </div>
      <div className='small rowInformation'>
        {thisUser.ageStr}
        <span className={'counter' + countClass}>
          <span className={'inNameVol namerator'}>
            {count.cnt}
            {count.other > 0 &&
              '+' + count.other
            }
          </span>
          /
          {/* <span className='inNameVol'>{thisUser.volume}</span> */}
          <span className='inNameVol'>{thisVolume}</span>
        </span>
        <span className="uaddiction">
          <Uaddiction {...thisUserAddiction} />
        </span>
      </div>
      <SendNoticeContent />
      <SchByUserDialog 
        uid={thisUser.uid} sch={sch} setSch={setSch} setSnack={setSnack}
        setUserOpe={setUserOpe}
        // userCh={userCh} setUserCh={setUserCh}
      />

    </div>

  </>)
}

// 利用実績のチェック
const UseChecked = (props) =>{
  const classes = useStyles();
  const dsch = (props.dsch)? props.dsch: {};
  if (dsch.useResult){
    return(<div className={classes.useChecked}><CheckIcon/></div>)
  }
  else{
    return null;
  }
}
// 日付セルの内側に描画するコンテンツ
const DateCellInner = React.memo((props) => {
  const classes = useStyles();
  const { dsch, did, otherClassroomItem, otherServiceItem, user, service } = props;

  // Redux状態を一度に取得
  const { stdDate, com } = useSelector(state => ({
    stdDate: state.stdDate,
    com: state.com,
  }));
  const sService = service;

  const iconClass = dsch.offSchool === 1 ? 'offSchool' : '';
  const transfer = albcm.countTransfer(dsch.transfer);
  const actualCost = dsch.actualCost ? Object.keys(dsch.actualCost).length : 0;

  // スタイルオブジェクトをuseMemoでメモ化
  const otherClassroomStyle = useMemo(() => (otherClassroomItem ? { opacity: 0.3 } : {}), [otherClassroomItem]);
  const otherServiceStyle = useMemo(() => (otherServiceItem ? { opacity: 0.3 } : {}), [otherServiceItem]);
  const otherItemStyle = useMemo(() => ({ ...otherClassroomStyle, ...otherServiceStyle }), [otherClassroomStyle, otherServiceStyle]);
  const absStyle = useMemo(() => (dsch.absence ? { opacity: 0 } : {}), [dsch.absence]);

  const currentService = dsch.service || sService;
  const type = user.type;
  const isJuushin = com.addiction[currentService]?.重症心身型 === '1' && type === '重症心身障害児';

  const kessekiCountAddiction = stdDate >= LC2024 ? kessekiSvc : kessekiSvc2021;
  // ダイアログ内に表示する加算数をレンダリングするコンポーネント
  const dAddictionKeys = Object.keys(dsch.dAddiction || {})
    .filter(key => key !== '時間区分')
    .filter(key => !(Number(dsch.dAddiction[key]) < 0));
  let dAddiction = dAddictionKeys;

  if (dsch.absence && dsch.reserve) {
    dAddiction = [];
  } else if (dsch.absence) {
    dAddiction = dAddiction.filter(key => kessekiCountAddiction.includes(key));
  }

  const DAddiction = () => {
    const hasOtherSvc = Object.keys(dsch.dAddiction || {}).some(e => e === '保育訪問');
    const hasOtherSvcStyle = hasOtherSvc ? { color: teal[400] } : {};

    const cnt = dAddiction.length;
    return (<>
      <i className={`fas fa-plus-circle fa-fw ${iconClass}`} style={hasOtherSvcStyle}></i>
      <span className="num" style={hasOtherSvcStyle}>{cnt}</span>
    </>)
  };

  // 通常のコンテンツをレンダリングするコンポーネント
  const Cnt = () => (
    <div key={did} style={otherItemStyle}>
      <div style={absStyle}>
        <i className={`fas fa-car fa-fw ${iconClass}`}></i>
        <span className="num">{transfer}</span>
      </div>
      <div style={absStyle}>
        <i className={`fas fa-yen-sign fa-fw ${iconClass}`}></i>
        <span className="num">{actualCost}</span>
      </div>
      <div>
        <DAddiction />
      </div>
    </div>
  );

  // 保訪用コンテンツをレンダリングするコンポーネント
  const HohouCnt = () => {
    const dAddiction = dsch.dAddiction
      ? Object.keys(dsch.dAddiction).filter(e => e !== '保育訪問').length
      : 0;
    const hohou = comMod.fdp(dsch, 'dAddiction.保育訪問');
    const sLetter = hohou ? hohou.slice(0, 1) : '？';
    const sLetterStyle = { padding: 4, fontWeight: 600, color: '#666' };

    return (
      <div key={did} style={otherItemStyle}>
        <div style={{ ...absStyle, ...sLetterStyle }}>
          {sLetter}
        </div>
        <div style={absStyle}>
          <i className={`fas fa-yen-sign fa-fw ${iconClass}`}></i>
          <span className="num">{actualCost}</span>
        </div>
        <div>
          <i className={`fas fa-plus-circle fa-fw ${iconClass}`}></i>
          <span className="num">{dAddiction}</span>
        </div>
      </div>
    );
  };

  if (!dsch || !Object.keys(dsch).length) return null;
  return currentService === HOHOU ? <HohouCnt /> : <Cnt />;
});




// 欠席表示を行う
const Absense = (props) =>{
  const classes = useStyles();
  const dsch = props;
  if (!dsch)  return null;
  // 欠席対応加算があるか
  const isKasan = (dsch.dAddiction)?
  Object.keys(dsch.dAddiction)
  .find(e=>e.indexOf('欠席時対応加算') > -1): null;
  const kasan = (isKasan)? 'kasan ': ''
  // const kasan = 'kasan';
  if (dsch.absence){
    return(
      // <div className={'dateCellAbsenceIcon ' + classes.absIconRoot}>
      <div className={classes.absIconRoot}>
        <div className={kasan}>
          {dsch.noUse === true &&
            <CloseIcon/>
          }
          {dsch.reserve === true && dsch.userReserve !== true &&
            <PauseIcon style={{color: blue[600]}}/>
          }
          {dsch.reserve === true && dsch.userReserve &&
            <PauseIcon style={{color: teal[600]}}/>
          }
          {dsch.noUse !== true && dsch.reserve !== true &&
            <NotInterestedIcon/>
          }
        </div>
      </div>
    )
  }
  else{
    return null;
  }
}

export const datacellFade = (node, classesFade) => {
  node.classList.remove(classesFade.dateCellFade);
  node.classList.add(classesFade.dateCellFadeEnd);
  setTimeout(() => {node.classList.add(classesFade.dateCellFade);}, 50);

} 

// それぞれの日付セル
const DateCellOne = (props) => {
  const classes = useStyles();
  const classesFade = useStylesFade();
  const {
    thisUser, sch, setSch, dateList, did, UID, date, localFabSch,
    dialogOpen, setDialogOpen, setSnack, setUserOpe,
    hoveredCell, setHoveredCell,cpuPower,
    updatedinfo, setUpdatedInfo,
    service, 
    // setCurrendDid
  } = props;
  const hid = useSelector(state=>state.hid);
  const bid = useSelector(state=>state.bid);
  const stdDate = useSelector(state=>state.stdDate);
  const classroom = useSelector(state=>state.classroom);
  const users = useSelector(state=>state.users);
  const schedule = useSelector(state=>state.schedule);
  const sService = useSelector(state=>state.service);

  const dsch = (sch[did])? {...sch[did]}: {}; // 該当日のスケジュールオブジェクト
  
  // 新規追加時のdid生成関数
  const getAddDid = (date) => {
    const baseDid = comMod.convDid(date);
    
    // 同じ日付の既存didを検索（ローカルのschから取得）
    const existingDids = Object.keys(sch || {})
      .filter(did => {
        const baseDate = did.substring(0, 9);
        return baseDate === baseDid && didPtn.test(did);
      });
    
    // デバッグログ（必要時のみ）
    console.log('getAddDid debug:', {
      baseDid,
      existingDids,
      service,
      currentDid: did,
      schKeys: Object.keys(sch || {}),
      schData: sch,
      thisUserUid: thisUser.uid,
      propsSchKeys: Object.keys(props.sch || {})
    });
    
    // 既存のdidがある場合
    if (existingDids.length > 0) {
      // Hなしのdidがある場合はH付きを追加
      if (existingDids.includes(baseDid)) {
        if (baseDid === 'D20250901') { // 特定の日付のみデバッグ
          console.log('Adding H suffix:', baseDid + 'H');
        }
        return baseDid + 'H';
      }
      // 既にH付きのdidがある場合はHなしを追加
      if (existingDids.includes(baseDid + 'H')) {
        if (baseDid === 'D20250901') { // 特定の日付のみデバッグ
          console.log('Adding without H:', baseDid);
        }
        return baseDid;
      }
    }
    
    // 既存のdidがない場合は、serviceに応じて適切なdidを返す
    const result = service === HOHOU ? baseDid + 'H' : baseDid;
    if (baseDid === 'D20250901') { // 特定の日付のみデバッグ
      console.log('New did (no existing):', result, 'service:', service, 'HOHOU:', HOHOU, 'comparison:', service === HOHOU);
    }
    return result;
  };
  
  // if (dsch.useResult){
  //   console.log(dsch, dsch.useResult, 'dsch');
  // }
  
  // 休業日、休校日を指定するクラス名
  const holidayClass = ['', 'schoolOff', 'off'][date.holiday];
  // 月水金が有効になるクラス
  const mwfClass = [1, 3, 5].indexOf(date.date.getDay()) >= 0 ? ' mwfClass' : '';
  // 日曜日が有効になるクラス
  const sunClass = date.date.getDay() === 0 ? ' sunClass' : '';

  // 欠席のときのクラス名
  const absenceClass = (dsch.absence) ? 'absensed' : '';
  // セルがホバーしたときの色を変える
  const hoverClass = [
    '', 'hoverAddRemove', 'hoverAddEdit', 'hoverAddRemove'
  ][localFabSch];
  // スケジュールテンプレートの取得
  const allState = useSelector(state=>state);
  // ユーザー送信API用
  const [res, setRes] = useState('');
  // 追加削除監視用
  const [watchAddRemove, setWatchAddRemove] = useState(false);
  // 利用実績フラグ
  const useResult = dsch.useResult;
  const isMtu = albcm.classroomCount(thisUser) > 1;
  // ダイアログの監視
  useEffect(()=>{
    // dialogOpenのstateを監視。変化があればschを更新
    // この処理必要なのか？？ 直接ダイアログにsch持っていっても良かったような
    const uidDidMatch = (dialogOpen.uid === UID && dialogOpen.did === did);
    const existUscch = Object.keys(dialogOpen.usch).length;

    if (existUscch && uidDidMatch /*&& !dialogOpen.open*/){
      setSch(dialogOpen.usch);
    }
  }, [dialogOpen]);

  // 追加削除の監視
  useEffect(()=>{
    const sendPrms = {
      hid, bid, date:stdDate, uid: UID, schedule: sch
    };
    if (watchAddRemove){
      setWatchAddRemove(false);      
    }
  }, [watchAddRemove]);
  // 編集可能かどうか確認する
  const checkEdit = () => {
    const thisClr = (sch[did])? sch[did].classroom: '';
    if (thisClr && thisClr !== classroom){
      const id = new Date().getTime();
      setSnack({
        msg: '別単位の予定なので編集できません。', 
        severity: 'warning', id
      });
      return false;
    }
    if (!isServiceEditAllowed(sch[did], service)) {
      const id = new Date().getTime();
      setSnack({
        msg: '別サービスの予定なので編集できません。', 
        severity: 'warning', id
      });
      return false;
    }
    return true;
  }
  // 追加削除を行う
  const addRemove = (scheduleTemplate) => {
    const t = {open: true, did, uid: UID, usch: sch};
    if (!checkEdit()) return false;
    const template = (date.holiday)
      ? {...scheduleTemplate.schoolOff, ...scheduleTemplate.timetable}
      : {...scheduleTemplate.weekday, ...scheduleTemplate.timetable};
    // templateにclassroomが付与されていることがある？？？
    delete template.classroom;
    if (isMtu){
      template.classroom = classroom;
    }
    
    // 現在のサービスに適したdidをチェック
    const baseDid = comMod.convDid(date.date);
    const expectedDid = service === HOHOU ? baseDid + 'H' : baseDid;
    const hasExpectedDid = sch && sch[expectedDid] && Object.keys(sch[expectedDid]).length;
    
    // 現在のサービスに適したdidにスケジュールが存在するかチェック
    if (hasExpectedDid){
      // 適したdidのスケジュールを削除
      if (did === 'D20250901') { // 特定のdidのみデバッグ
        console.log('Removing existing did:', expectedDid);
      }
      const t = {...sch};
      delete t[expectedDid];
      t.deleteDid = expectedDid;
      t.deleteUid = UID;
      setSch(t);
    }
    else{
      // 適したdidにスケジュールがないので追加
      const addDid = getAddDid(date.date);
      if (addDid === 'D20250901H') { // 特定のdidのみデバッグ
        console.log('Adding new did:', addDid, 'to existing sch:', Object.keys(sch));
      }
      const t = {...sch, modDid: addDid};
      // 変更されたdidを記述
      t[addDid] = {...template, };
      setSch(t);
    }
    albcm.setRecentUser(UID);
    setWatchAddRemove(true);
  }
  // 単純に削除のみ行う
  const remove = (ev) => {
    if (!checkEdit()) return false;
    if (Object.keys(dsch).length){
      // スケジュールが存在するので削除
      const t = {...sch};
      delete t[did];
      t.deleteDid = did;
      setSch(t);
      setCellMark(ev);
    }
  }
  // 詳細設定のダイアログを開く
  // スケジュールがないときは単純追加
  const addEdit = (scheduleTemplate) => {
    const t = {open: true, did, uid: UID, usch: {...sch, modDid: did}};
    if (!checkEdit()) return false;
    
    // 現在のサービスに適したdidをチェック
    const baseDid = comMod.convDid(date.date);
    const expectedDid = service === HOHOU ? baseDid + 'H' : baseDid;
    const hasExpectedDid = sch && sch[expectedDid] && Object.keys(sch[expectedDid]).length;
    
    // 適したdidにスケジュールがない場合は追加
    if (!hasExpectedDid){
      addRemove(scheduleTemplate);
      return true;
    }
    else{
      // 適したdidにスケジュールがある場合はダイアログを開く
      setSnack({msg: '', severity: '', id: new Date().getTime()});
    }
    setDialogOpen(t);
  }
  // スケジュールが存在するときにひな形をコピー
  const pasteSchedule = (scheduleTemplate) => {
    if (!checkEdit()) return false;
    if (comMod.convDid(new Date()) >= did){
      setSnack({
        msg: '過去の予定実績に対して雛形適用することは出来ません', 
        severity: 'warning', id: new Date().getTime()
      });
      return false;
    }
    
    // 現在のサービスに適したdidを使用
    const baseDid = comMod.convDid(date.date);
    const pasteDid = service === HOHOU ? baseDid + 'H' : baseDid;
    
    const template = (date.holiday)? 
    {...scheduleTemplate.schoolOff}: {...scheduleTemplate.weekday};
    delete template.classroom;
    if (isMtu){
      template.classroom = classroom;
    }
    const t = {...sch};
    t[pasteDid] = {...template};
    setSch(t);

    albcm.setRecentUser(UID);
    setWatchAddRemove(true);


  }
  const setCellMark = (ev) => {
    // クリックしたセルにアニメーション
    const node = ev.currentTarget;
    datacellFade(node, classesFade);
    // ハイライト表示用のlocalstrage値
    setLocalStorageItemWithTimeStamp(bid + node.id, true);

  }
  const clickHandler = (ev) => {
    // 計画支援時間取得を追加
    const template = albcm.getTemplate(allState, sch, UID);
    const timetable = getUsersTimetable(allState, UID, did);
    if (timetable) {
      timetable.holiday ? timetable.offSchool = 1 : timetable.offSchool = 0;
    }
    const scheduleTemplate = timetable 
      ? {
          ...template, 
          weekday:{...template.weekday, ...timetable}, 
          schoolOff:{...template.schoolOff, ...timetable}
        }
      : template;
    // sendPartOfData送信用
    // setCurrendDid(did);

    if (!localFabSch)  return false;
    const locked = albcm.schLocked(
      schedule, users, thisUser, did, service, classroom
    )
    if (!classroom && isMtu){
      const id = new Date().getTime();
      setSnack({
        msg: 'この利用者は複数単位があるので編集できません。', 
        severity: 'warning', id
      });
      return false;
    }
    if (locked){
      const id = new Date().getTime();
      setSnack({msg: '実績としてロックされています', severity: 'warning', id});
      return false;
    }
    else{
      setSnack({msg: '', severity: '', id: 0});
    }
    // addRemove();
    if (localFabSch === FAV_ADDEDIT){
      addEdit(scheduleTemplate);
      setCellMark(ev);
    }
    else if (localFabSch === FAV_ADDREMOVE){
      addRemove(scheduleTemplate);
      setCellMark(ev);
    }
    else if (localFabSch === FAV_REMOVE){
      remove(ev);
    }
    else if (localFabSch === FAV_PASTE){
      pasteSchedule(scheduleTemplate);
    }
    // ユーザによるオペレーションのスイッチをセット
    setUserOpe(true);
  }

  const UseResult = () => {
    if (useResult){
      return (
        // <div className={classes.useChecked} key={did}><CheckCircleIcon/></div>
        <div className='useChecked' key={did}></div>
      )
    }
    else{
      return null;
    }
  }
  // 別単位でのクラス設定
  const otherClassroomItem = 
  (classroom && dsch.classroom && dsch.classroom !== classroom)
  // 別サービスのアイテム
  const otherServiceItem = 
  (sService && dsch.service && dsch.service !== sService)
  // ハイライト表示を保持するためのlocalstrageを問い合わせしてハイライト表示用のクラス名を得る
  const getHeighLightClassName = () => {
    // const t = getLocalStorageItemWithTimeStamp(
    //   hid + props.UID + did, cellHighlightLifeTime
    // );
    const t = localStorage.getItem(bid + props.UID + did);
    return t? classesFade.dateCellFadeEnd + ' ': ''
  }
  const heighLightClassName = getHeighLightClassName();
  const curStyle = localFabSch? {cursor: 'pointer'}: {};
  const notDisplaySchMarker = comMod.getUisCookie(
    comMod.uisCookiePos.notDisplaySchMarker
  ) === '1';
  const handleMouseEnter = (UID, did) => {
    if (cpuPower && !notDisplaySchMarker){
      setHoveredCell({UID, did});
    }
  }
  const handleMouseLeave = () => {
    setHoveredCell(null);
  }
  return (
    <div
      uid={UID}
      did={did}
      className={
        hoverClass +
        ' dateCell w03 center small ' 
        + holidayClass + ' ' + mwfClass + ' ' + sunClass + ' ' + absenceClass
        + heighLightClassName
      }
      // style={cellStyleHover}
      id={props.UID + did}
      holiday={date.holiday}
      // service={props.service}
      // operation={0}
      onClick={ev=>clickHandler(ev)}
      // onClick={e=>clickHandler(e, open, setopen)}
      style={curStyle}
      onMouseEnter={()=>handleMouseEnter(UID, did)}
      onMouseLeave={handleMouseLeave}
    >
      <UseChecked {...dsch}/>
      <DateCellInner 
        dsch={dsch} did={did} 
        otherClassroomItem={otherClassroomItem}
        otherServiceItem={otherServiceItem}
        user={thisUser}
        service={service}
      />
      <Absense {...dsch}/>
      <UseResult />
    </div>
  )
} 
const DateCellOneMemo = React.memo(DateCellOne);

// 日付のセルのローダー
const DateCells = (props) => {
  const {
    thisUser, sch, setSch, dateList, UID, dialogOpen, setDialogOpen,
    localFabSch, setUserOpe, setSnack,
    hoveredCell, setHoveredCell,
    updatedinfo, setUpdatedInfo,
    service,
    // setCurrendDid,
  } = props;
  const ssch = useSelector(state=>state.schedule);
  const postLetter = (
    service === HOHOU || thisUser.service === HOHOU
  ) ? 'H' : '';
  
  // schの変更を監視して再レンダリングを促す
  const [, forceUpdate] = useState({});
  useEffect(() => {
    // schが変更されたときに強制的に再レンダリング
    forceUpdate({});
  }, [sch]);
  
  // didの取得ロジックを工夫する関数（表示用）
  // 要件: serviceがHOHOUのときはH付きを優先、それ以外はHなしを優先
  const getOptimizedDid = (date, uidStr) => {
    const baseDid = comMod.convDid(date);
    
    // schとsschの両方から既存didを検索（schを優先）
    const localDids = Object.keys(sch || {})
      .filter(did => {
        const baseDate = did.substring(0, 9);
        return baseDate === baseDid && didPtn.test(did);
      });
    
    const storeDids = Object.keys(ssch[uidStr] || {})
      .filter(did => {
        const baseDate = did.substring(0, 9);
        return baseDate === baseDid && didPtn.test(did);
      });
    
    // ローカルのschとRedux storeの統合（重複除去）
    const allDids = [...new Set([...localDids, ...storeDids])];
    
    // 既存のdidが見つかった場合
    if (allDids.length > 0) {
      // serviceがHOHOUの場合はH付きを優先
      if (service === HOHOU) {
        const hDid = baseDid + 'H';
        const noHDid = baseDid;
        // H付きがある場合はH付き、なければHなし
        return allDids.includes(hDid) ? hDid : noHDid;
      }
      // それ以外はHなしを優先
      else {
        const noHDid = baseDid;
        const hDid = baseDid + 'H';
        // Hなしがある場合はHなし、なければH付き
        return allDids.includes(noHDid) ? noHDid : hDid;
      }
    }
    
    // 既存のdidがない場合は、postLetter付きのdidを返す
    return baseDid + postLetter;
  };
  
  // 日付ごとに処理
  const days = dateList.map((e, i)=>{
    const did = getOptimizedDid(e.date, `UID${thisUser.uid}`);
    const dProps = {...props, did, date: e}
    return (
      <DateCellOneMemo {...dProps} key={i}/>
    )
  });
  return days;
}

const SchRow = (props) => {
  const {
    thisUser, index, localFabSch, setLocalFabSch, 
    countsOfUse, setCountsOfUse, 
    setSnack, 
    croneSch, setCroneSch,
    hoveredCell, setHoveredCell,
    userAttr, setUserAttr,
    service,

  } = props;
  // console.log(thisUser.name, thisUser.uid, 'SchRow');
  const ssch = useSelector(state=>state.schedule);
  const users = useSelector(state=>state.users);
  const dateList = useSelector(state=>state.dateList);
  const stdDate = useSelector(state=>state.stdDate);
  const hid = useSelector(state=>state.hid);
  const bid = useSelector(state=>state.bid);
  const sService = useSelector(state=>state.service);
  const classroom = useSelector(state=>state.classroom);
  const dispatch = useDispatch();
  // ユーザーによる操作があったかどうか。
  const [userOpe, setUserOpe] = useState(false);
  const schedule = ssch? ssch: {}; // スケジュールデータのnullの時は空白オブジェクト
  const UID = 'UID' + thisUser.uid;
  const [sch, setSch] = useState(schedule[UID]? schedule[UID]: {});
  // ユーザごとのスケジュールデータが変更されたかどうかのフラグ。
  const [schCh, setSchCh] = useState(false);
  // sendPartOfData対応用にDIDをステイト化
  // 廃止。partodSchに含める
  // const [currendDid, setCurrendDid] = useState(null);

  // schrow内で完結する通知用 DateCellssでsetされRowTitleで表示する
  // RowTitleで初期化するかも
  const [sendNotice, setSendNotice, ] = useState({done: false, result: null});
  // apiの変更に伴い変更情報を保持する
  const [updatedinfo, setUpdatedInfo] = useState({did: '', remove: false});
  // ユーザー情報が更新されたら値を格納。unmountでdispatch
  // const [userCh, setUserCh] = useState(null);
  const rowProps = {
    ...props, sch, setSch, UID, dateList, localFabSch,
    service, 
    schCh, setSchCh,
    setUserOpe,
    hoveredCell, setHoveredCell,
    sendNotice, setSendNotice, 
    updatedinfo, setUpdatedInfo, 
    // setCurrendDid,
  }
  const [res, setRes] = useState('');
  const userName = thisUser.name;
  // const path = useLocation().pathname;

  // countsOfUseの要素に該当するdidを特定するための文字列
  const keyBase = 'D' + stdDate.replace(/\-/g, '').slice(0, 6);

  // useRef使ってみるよ
  const firstRender = useRef(false);
  useEffect(() => { // このeffectは初回レンダー時のみ呼ばれるeffect
    firstRender.current = true
  }, []);
  // schの監視
  useEffect(()=>{
    // 利用数の更新
    const c = {...countsOfUse};
    c[UID].map((e, i)=>{
      const key = keyBase + comMod.zp(i + 1, 2);
      if (sch[key]){
        if (sch[key].absence) c[UID][i] = 0;
        else                  c[UID][i] = 1;
        // MTU対応
        if (classroom && sch[key].classroom && sch[key].classroom !== classroom)
          c[UID][i] = 0; 
        // 欠席時対応加算を確認
        // const kAddic = comMod.findDeepPath(sch[key], 'dAddiction.欠席時対応加算');
        // if (kAddic) c[UID][i] = 1;
        // 複数サービス対応
        // 保訪をカウントしないようにしたのでこの処理は不要
        // if (service && sch[key].service && sch[key].service !== service)
        //   c[UID][i] = 0;
        if (service === HOHOU && sch[key].service !== HOHOU)
          c[UID][i] = 0;
        // 保訪はカウントしない
        if (sch[key].service === HOHOU)
          c[UID][i] = 0;
        
        // if (i === 1){
        //   console.log(i , c[UID][i], UID);
        // }
      }
      else{
        c[UID][i] = 0;
      }
    });
    setCountsOfUse(c);
    // dbに送信 初回は送信しない！
    if (firstRender.current){
      firstRender.current = false;
    }
    else if (userOpe){ // ユーザの操作があったの時のみディスパッチを実行
      // uid配下のデータは削除しておく
      const modDid = sch.modDid || false;
      const deleteDid = sch.deleteDid || false;
      delete sch.modDid;
      delete sch.deleteDid;
      const sendPrms = {
        uid: UID, hid, bid, date: stdDate, 
        partOfSch: {
          [UID]: sch, modDid, deleteDid
        }
      }
      const f = async () => {
        // 送信モジュール変更 2023/05/11
        const msg = `${userName}さんの予定を送信しました。`
        // ホバーエフェクトを表示しているときはスナック表示をしない
        const notDispMarker = comMod.getUisCookie(comMod.uisCookiePos.notDisplaySchMarker) === '1'
        // const snackFanc = notDispMarker ? setSnack: '';
        const snackFanc = setSnack;
        const a = await albcm.sendPartOfScheduleCompt(
          sendPrms, setRes, snackFanc, msg, '', false, 
        );
        // 送信通知のセット
        setSendNotice({done: true, result: a?.data?.result ?? false});
        if (a?.data?.result === false){
          setSnack({severity: 'error', msg: '通信エラーが発生しました。'})
        }
      }
      f();
    }
    
    // Component破棄時にstoreにDispatch
    const t = {...croneSch};
    // schから不要なプロパティを除外してコピー
    const cleanSch = {...sch};
    delete cleanSch.deleteDid;
    delete cleanSch.deleteUid;
    delete cleanSch.modDid;
    t[UID] = cleanSch;
    if (userOpe){
        // console.log('schrow dispatch')
      // dispatch(Actions.setStore({schedule: t, }));
      setCroneSch(t);
    }
  
  },[sch]);

  return(
    <div className='scdRow flxRow'>
      <RowTitle {...rowProps} />
      <DateCells {...rowProps} />
    </div>
  )
}

const SchTableBody2 = (props) => {
  const dispatch = useDispatch();
  const users = useSelector(state=>state.users);
  const schedule = useSelector(state=>state.schedule);
  const sService = useSelector(state=>state.service);
  const classroom = useSelector(state => state.classroom);
  const comAdic = useSelector(state=>state.com.addiction);
  // service取得方法変更 単一サービスでstateのserviceが''で与えられることがある
  // SchTableBody2ではusersが利用可能だが、特定のユーザーのserviceを取得するのは適切でないため
  // 空文字列の場合はserviceItemsから取得
  const serviceItems = useSelector(state=>state.serviceItems);
  const service = sService || serviceItems[0];
  const pathname = useLocation().pathname;
  const hid = useSelector(state=>state.hid);
  const bid = useSelector(state=>state.bid);
  const [res, setRes] = useState(); 
  const [dialogOpen, setDialogOpen] = useState({
     open: false, uid: '', did: '' , usch: {}
  });
  const [userAttr, setUserAttr] = useState([]); // 医療的ケア、重身、当月で終了などの属性表示チェック用

  const [snack, setSnack] = useState({msg: '', severity: '', id: 0});
  // croneSchはレンダリングに影響させずにユーザーごとのSchを反映させる。最後に一度だけdispatchするため。
  // scheduleMain上位コンポーネントで定義し直し
  // const [croneSch, setCroneSch] = useState(JSON.parse(JSON.stringify(schedule)));
  const rProps = {
    ...props, dialogOpen, setDialogOpen, setSnack, // croneSch, setCroneSch// work, setWork
    userAttr, setUserAttr, service,
  };
  const {croneSch} = props;

  const serviceAsTanni = comAdic[service]? comAdic[service].サービスごと単位: null;
  const {countsOfUse, setCountsOfUse} = props;
  // サービスごと単位ではない場合、別サービスの回数をカウントする必要あり
  // なので対象レコードに予め書き込んでおく処理を追加した
  useEffect(()=>{
    if (!serviceAsTanni){
      const tUsers = users.filter(e=>albcm.isClassroom(e, classroom));
      const t = {...countsOfUse}
      tUsers.forEach(e=>{
        const k = 'UID' + e.uid;
        const user = comMod.getUser(e.uid, users);
        const hohouOnly = user.service === HOHOU;
        if (hohouOnly) return;
        if (t[k] && schedule[k]){
          Object.keys(schedule[k]).filter(f=>f.indexOf('D2') === 0).forEach(f=>{
            // didの下二桁（日付）-1がcountsOfUseのインデックスになる
            const ndx = parseInt(f.slice(7, 9)) - 1;
            if (schedule[k][f].absence) return false;
            // 保訪は別サービスでカウントしない 2023/03/28
            // 誤記訂正 2024/07/06
            // そもそも保訪はカウントしなくていいのでは？
            // if (service !== HOHOU && schedule[k][f].service === HOHOU) return false;
            if (schedule[k][f].service === HOHOU) return false;
            t[k][ndx]++;
          })
        }
      });
      setCountsOfUse(t);
    }
  }, []);
  // dispatchは親コンポーネント（Sch2）でルート離脱時のみに集約
  useEffect(() => {
    return () => {};
  }, [croneSch]);


  // デバッグ時には一行だけ表示させるなど。
  const r = 500;
  const rows = users
  // .filter(e=>e.service === service || service === '')
  .filter(e=>albcm.isService(e, sService))
  .filter(e=>albcm.isClassroom(e, classroom))
  .slice(0, r)
  .map((e, i) => {
  // const rows = users.slice(0, r).map((e, i) => {
    return (<SchRow 
      thisUser={e} key={i} index={i} {...rProps}
    />)
  });
  return (<>
    {rows}
    <SchEditDetailDialog 
      stateOpen={dialogOpen} setStateOpen={setDialogOpen}
      setSnack={setSnack}
    />
    <div style={{height: 24}} />
    <UserAttrInfo userAttr={userAttr}/>
    <SnackMsg {...snack} />
    <div id='ryh67cvwq'></div>
  </>);
}

export default SchTableBody2;

