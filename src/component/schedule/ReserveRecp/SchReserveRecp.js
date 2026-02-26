import React, {useState, useEffect,useRef, } from 'react';
import * as Actions from '../../../Actions';
import { useSelector, useDispatch } from 'react-redux';
import SchEditDetailDialog from './../SchEditDetailDialog';
import * as comMod from '../../../commonModule';
import * as albcm from '../../../albCommonModule'
import {LoadingSpinner, LoadErr, SetUisCookieChkBox, EditUserButton, GoBackButton, DisplayInfoOnPrint} from '../../common/commonParts';
import { makeStyles } from '@material-ui/core/styles';
import EachScheduleContent from './../SchEachScheduleContent';
import { makeSchMenuFilter, menu, extMenu } from './../Sch2';
import { SchInitilizer } from './../SchInitilizer';
import { LinksTab } from '../../common/commonParts';
import { useHistory, useLocation, useParams, } from 'react-router-dom';
import SnackMsg from '../../common/SnackMsg';
import { OccupancyRate } from './../SchHeadNav';
import { grey, teal, blue, red, orange } from '@material-ui/core/colors';
import SchUserDispatcher from './../SchUsersDispatcher';
import { setLocalStorageItemWithTimeStamp } from '../../../modules/localStrageOprations';
import { DispNameWithAttr } from '../../Users/Users';
import { SchNoticeAndMemoList } from './../SchNoticeAndMemoList';
import { countVisit, getVolume } from './../SchTableBody2';
import { FAV_ADDEDIT, FAV_ADDREMOVE, FAV_NOOPE, FAV_PASTE, FAV_REMOVE, SchFab } from './../SchFab';
import { UserAttrInfo } from '../../Users/UserAttrInfo';
import { checkValueType } from '../../dailyReport/DailyReportCommon';
import { schAutoFill } from './../schAutoFill';
import { getUsersTimetable } from '../../../modules/getUsersTimetable';
import { SideSectionUserSelect } from '../SchByUser2';
import { initializeApp } from 'firebase/app';
import { collection, doc, getDocs, getFirestore, query, setDoc, where } from 'firebase/firestore';

import AccessTimeIcon from '@material-ui/icons/AccessTime';
import DriveEtaIcon from '@material-ui/icons/DriveEta';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import { Button, Fab } from '@material-ui/core';

import PersonIcon from '@material-ui/icons/Person';
import PeopleAltIcon from '@material-ui/icons/PeopleAlt';
import PauseIcon from '@material-ui/icons/Pause';
import { useSessionStorageState } from '../../common/HashimotoComponents';
import { YesNoDialog } from '../../common/GenericDialog';
import { SchReserveRecpDialog } from './SchReserveRecpDialog';
import SchDailyReportSyncer from '../SchDailyReportSyncer';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB-Lj2ECjCYup2FqFGCp2r61U9yD5u5luY",
  authDomain: "albatross-432004.firebaseapp.com",
  projectId: "albatross-432004",
  storageBucket: "albatross-432004.appspot.com",
  messagingSenderId: "238548710535",
  appId: "1:238548710535:web:ceb3a1b4513826ee2bb422"
};
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app, "reserves");

const useStyles = makeStyles({
  noticeAndMemoList: {
    marginTop: 16,
    width: 'calc(100% - 200px)', marginLeft: 200,
    '& .dateRow': {
      width: '90%', maxWidth: 800, margin: '0 auto',
      marginBottom: 8,
      '& .notice, .memo': {
        lineHeight: "1.5rem",
        display: 'flex', alignItems: 'center'
      },
      '& .notice': {color: teal[600]},
      '& .memo': {color: blue[600]}
    }
  },
 
  userInfo:{
    display:'flex', justifyContent:'center',
    paddingTop: 24, paddingBottom: 15,
    width: '100%',
    '& >div': {margin: '0 8px',}
  },
  occuWrap:{marginTop: 20, width: 'calc(100% - 200px)', marginLeft: 200},
  occuWrapP:{marginTop: 20, width: '100%'}, // パラメータでUIDが与えられている場合
  vDayWrap: {
    cursor:'pointer',
    // '&:nth-of-type(odd) .dateContent':{background: grey[100]},
    '& .mwfClass .dateContent': {background: grey[100]},
    '& .schoolOff .dateContent': {background: '#fff2e0'},
    '& .schoolOff.mwfClass .dateContent': {background: '#ffeaca'},
    '& .off .dateContent': {background: grey[300]},
    '&:hover .dateContent': {background: teal[50]},
    '&:hover .schoolOff.mwfClass .dateContent': {background: teal[50]},
  },
  editUserButtonWrap:{
    position: 'fixed', top: 148, right: 16,
  },
  countRoot: {
    position: 'fixed',
    top: 96, right: 16, width:128, background: '#FFFFFF90', zIndex: 200,
    '& .comment': {fontSize: '.7rem', textAlign: 'center'},
    '& .inner':{
      display:'flex', flexWrap: 'wrap', alignItems: 'end', 
      justifyContent: 'space-between',
      padding: 8,
      '& .count': {fontSize: '1.1rem', color: teal[900], fontWeight: 600},
      '& .absence': {color: blue[800]},
      '& .s': {fontSize: '.7rem', paddingBottom: 1},
      '& .over': {color: red[800]},
    },
  },
  monthWrapper: {
    marginTop: 16,
    width: 'calc(100% - 200px)', textAlign: 'center',
    marginLeft: 200,
  },
  monthWrapperP: {
    marginTop: 16, width: '100%', textAlign: 'center',
  },
  monthWrapperV: {width:'calc(100% - 200px)', marginLeft: 200 },
  monthWrapperVP: {width: '100%'},
  userNameHeadDisp: {
    // width: 'calc(100% - 200px)', marginLeft: 200,
    padding: 16, paddingTop: 32, textAlign: 'center', position: 'sticky', top:80,
    width: 400, margin: '0 Auto', background: '#FFFFFFCC', zIndex:99,
    '& span': {marginInlineStart: 8, marginInlineEnd: 8}
  },
  soudanSeikyuuExist: {
    position: 'absolute', right: 8, top: 4,
    width: 18, height: 18,
    display:'flex', alignItems: 'center', justifyContent: 'center',
    background: teal[500], color: '#fff',
    borderRadius: '50%', fontSize: '.7rem',
    boxShadow: '#aaa 0 2px 2px',
  },
  autoFillwrap: {
    // position: 'fixed',
    // bottom: 20,
    // marginLeft: 'calc((90vw - 800px) / 2)',
    // '@media (max-width: 1080px)': {
    //   marginLeft: 138,
    // },
    // // zIndex: 1000,
    position: 'fixed',
    bottom: 82, right: 20,

  },
  EachSchReserveContent: {
    padding: '4px',
    '& .status': {
      marginBottom: '4px'
    },
    '& .inner': {
      display:'flex', alignItems: 'center',
      '& .icon': {
        width: '40px', textAlign: 'center',
        fontSize: '1.1rem'
      },
      '& .value': {
        '& .transfer': {
          display: 'flex', alignItems: 'center',
          '& .period': {

          }
        },
        '& .notice': {}
      }
    }
  },
  SchFabWrapper: {
    '& > div': {
      right: '106px'
    },
    '& .floatingActionButtons': {
      zIndex: 300,
    }
  },
  ReserveContent: {
    padding: '4px 8px',
    '& .key': {fontSize: '10px', lineHeight: '10px', color: teal[800]},
    '& .value': {},
  }
});

const EachSchReserveContent = (props) => {
  const classes = useStyles();
  const {reserveDt, localFabSch} = props;
  const statusStr = (() => {
    switch(reserveDt.status){
      case "reserved": return "予約"
      case "accepted": return "取込済み"
      case "rejected": return "拒否"
    }
  })();
  const start = reserveDt.start;
  const end = reserveDt.end;
  const pickupLocation = reserveDt.pickupLocation;
  const dropoffLocation = reserveDt.dropoffLocation;
  const notice = reserveDt.notice;
  return(
    <div className={classes.EachSchReserveContent} style={{opacity: localFabSch!==FAV_NOOPE && localFabSch!==99 ?'0.3' :'1'}}>
      <div className='status'>{statusStr}</div>
      {(Boolean(start) || Boolean(end)) &&<div className="inner">
        <AccessTimeIcon className='icon' />
        <div className='value'>
          {Boolean(start) &&<div className="time">{start}</div>}
          {Boolean(end) &&<div className="time">{end}</div>}
        </div>
      </div>}
      {(Boolean(pickupLocation) || Boolean(dropoffLocation)) &&<div className="inner">
        <DriveEtaIcon className='icon' />
        <div className="value">
          <div className='transfer'>
            {Boolean(pickupLocation) &&<div className={'location'}>{pickupLocation}</div>}
            {Boolean(pickupLocation) && Boolean(dropoffLocation) &&<ArrowForwardIosIcon style={{fontSize: '12px'}}/>}
            {Boolean(dropoffLocation) &&<div className={'location'}>{dropoffLocation}</div>}
          </div>
        </div>
      </div>}
      {Boolean(notice) &&<div className="inner">
        <div className='icon'>※</div>
        <div className="value">
          <div className='notice'>備考あり</div>
        </div>
      </div>}
    </div>
  )
}

// 2021/09/03 縦型表示を追加してみる
const SevenDaysGrid = (props)=>{
  const classes = useStyles();
  const dateList = useSelector(state=>state.dateList);
  const {
    suid, sch, setSch, dialogOpen, setDialogOpen, setSnack, localFabSch,
    virtical, puid, dispCont,
    reserves, setReserveDialogParams
  } = props;
  // puidが存在するときはパラーメタによるuid指定
  const path = useLocation().pathname;
  // const template = useSelector(state => state.scheduleTemplate);
  const users = useSelector(state => state.users);
  const service = useSelector(state=>state.service);
  const classroom = useSelector(state=>state.classroom);
  const schedule = useSelector(state=>state.schedule);
  const allstate = useSelector(state=>state);
  const {bid, com} = allstate;
  const template = {[service]:albcm.getTemplate(allstate, sch, suid)};
  const UID = 'UID' + suid;
  // 7曜グリッド作成
  const daysGrid = comMod.makeDaysGrid(dateList);
  // クリックハンドラ
  const clickHandler = (e)=>{
    e.stopPropagation();
    e.preventDefault();
    const did = e.currentTarget.getAttribute('did');
    if(!did) return;
    const date = comMod.convDid(did); // did形式を日付オブジェクトに
    // 引数で受け取ったdatalist全体から該当日付の休日モードを取得
    const holiday = dateList.filter(
      f => f.date.getTime() === date.getTime()
    )[0].holiday;
    const holidayStr = ['weekday', 'schoolOff', 'schoolOff'][holiday];
    // 同じようにserviceを取得
    // const thisService = users.filter(f => f.uid === suid)[0].service;

    // 該当スケジュールの取得。見つからなければnull
    // schにnullが入ることがある 2023/03/30修正
    let thisSchedule = sch? sch[did]: null;
    
    const thisUser = comMod.getUser(suid, users);
    const isMTU = albcm.classroomCount(thisUser) > 1;

    // MTUの規制
    if (!classroom && albcm.classroomCount(thisUser) > 1){
      const id = new Date().getTime();
      setSnack({
        msg: 'この利用者は複数単位があるので編集できません。', 
        severity: 'warning', id
      });
      return false;
    }
    // なにもしない
    if (localFabSch === 0)  return false;

    // 予定予約関係
    if(localFabSch === 99){
      const reserve = reserves.find(r => r?.data?.did === did);
      if(!reserve) return;
      setReserveDialogParams({open: true, reserve});
      return;
    }
    
    // スケジュールロックを検出
    const locked = albcm.schLocked(
      schedule, users, thisUser, did, service, classroom
    )
    if (locked){
      const id = new Date().getTime();
      setSnack({msg: '予定・実績はロックされています。', severity: 'warning', id});
      return false;
    }

    // 別単位のスケジュールロック
    if (
      thisSchedule &&
      thisSchedule.classroom && classroom && 
      classroom !== thisSchedule.classroom &&
      localFabSch > 0
    ){
      const id = new Date().getTime();
      setSnack({
        msg: '別単位の予定なので編集できません。', 
        severity: 'warning', id
      });
      return false;
    }
    else{
      setSnack({msg: '', severity: '', id: new Date().getTime()})
    }

    // 別サービスのスケジュールロック
    if (thisSchedule && thisSchedule.service && thisSchedule.service !== service){
      const id = new Date().getTime();
      setSnack({
        msg: '別サービスの予定なので編集できません。', 
        severity: 'warning', id
      });
      return false;
    }

    const fabv= localFabSch;
    // 今日より先の予定実績かどうか
    const pastSch = did <= comMod.convDid(new Date());
    if (fabv === FAV_PASTE && pastSch){
      setSnack({
        msg: '今日以前の予定実績に対して雛形の適用を行うことは出来ません。', 
        severity: 'warning', id: new Date().getTime()
      });
      return false;

    }
    // 追加削除、追加削除モードでスケジュールが存在しない->追加
    if ((fabv === FAV_ADDEDIT || fabv === FAV_ADDREMOVE) && !thisSchedule) {
      // 計画支援時間を取得
      const uPlan = getUsersTimetable(allstate, suid, did) ?? {};
      thisSchedule = {...template[service][holidayStr], ...uPlan};
      if (isMTU){
        thisSchedule.classroom = classroom;
      }
      const t = {...sch};
      setSch({...t, [did]:thisSchedule, modDid: did});
      albcm.setRecentUser(UID);
      setLocalStorageItemWithTimeStamp(bid + UID + did, true);

    }
    else if (fabv === FAV_PASTE && thisSchedule){
      thisSchedule = {...template[service][holidayStr]};
      thisSchedule.classroom = classroom;
      const t = {...sch};
      setSch({...t, [did]:thisSchedule});
      albcm.setRecentUser(UID);
      setLocalStorageItemWithTimeStamp(bid + UID + did, true);
    }
    // 追加削除モードでスケジュールが存在する->削除
    else if ((fabv === FAV_ADDREMOVE || fabv === FAV_REMOVE) && thisSchedule) {
      const t = {...sch, deleteDid: did};
      delete t[did];
      setSch(t);
      albcm.setRecentUser(UID);
      setLocalStorageItemWithTimeStamp(bid + UID + did, true);
    }
    // 追加修正モードでスケジュールが存在する
    else if (fabv === FAV_ADDEDIT && thisSchedule) {
      const t = {open: true, did, uid: UID, usch: sch};
      setDialogOpen(t);
      setLocalStorageItemWithTimeStamp(bid + UID + did, true);
    }
  }
  // ダイアログオープンstateを監視してLOCALstateを更新
  useEffect(()=>{
    const existUscch = Object.keys(dialogOpen.usch).length;
    if (existUscch){
      setSch(dialogOpen.usch);
    }
  }, [dialogOpen]);

  // ゆーざーがみつからないばあいはnullを返す
  const susers = users.filter(e=>albcm.inService(e.service, service));
  const thisUser = (suid, susers);

  if (!Object.keys(thisUser).length)  return null;
  const oneUser = comMod.getUser(suid, thisUser);
  const OneWeek = (props)=>{
    const week = props.week.map((e, i)=>{
      const cls = ['', 'schoolOff', 'off'];// 学校休日休業日を示すクラスリスト
      const wdClass = (e !== '')? cls[e.holiday]:'';
      // 日付オブジェクトをdid形式に変換
      const did = (e !== '') ? comMod.convDid(e.date):''
      // この日のスケジュール
      let thisSchedule;
      // そもそもデータがない
      if (!sch)  thisSchedule = undefined;
      // 該当日のデータがない
      else if (Object.keys(sch).indexOf(did) === -1) 
        thisSchedule = undefined;
      else thisSchedule = sch[did];
      const otherClassroomStyle = 
      (
        thisSchedule &&
        thisSchedule && classroom && 
        thisSchedule.classroom && 
        thisSchedule.classroom !== classroom
      )?{opacity: .3}: {};

      const reserve = reserves.find(prevReserve => {
        const data = prevReserve.data;
        if(data?.did !== did) return false;
        return true;
      });

      return(
        <div className={'day ' } key={i} 
          did = {did}
          onClick = {(e)=>clickHandler(e)}
        >
          {(e !== '') &&
            <div className={'dayLabel ' + wdClass}>
              {e.date.getDate()}
            </div>
          }
          
          <div className='content' style={otherClassroomStyle}>
            {Boolean(thisSchedule) &&<div style={{opacity: localFabSch===99 || localFabSch===FAV_NOOPE ?'0.3' :'1'}}>
              <EachScheduleContent 
                thisSchedule={thisSchedule} UID={UID} did={did} 
              />
            </div>}
            {Boolean(reserve) &&<EachSchReserveContent reserveDt={reserve.data} localFabSch={localFabSch} />}
          </div>
        </div>
      );
    });
    return (<div className='week'>{week}</div>);
  }
  // 縦型表示
  const VrtDisp = (props) => {
    const {puid} = props;
    const classes = useStyles();
    const classroom = useSelector(e=>e.classroom);
    const days = dateList.map((e,i)=>{
      const cls = ['', 'schoolOff', 'off'];// 学校休日休業日を示すクラスリスト
      const wdClass = (e !== '')? ' ' + cls[e.holiday]:'';
      // 日付オブジェクトをdid形式に変換
      const did = (e !== '') ? comMod.convDid(e.date):'';
      // mon wed fri 月水金で有効になるクラス名
      const mwfClass = [1, 3, 5].indexOf(e.date.getDay()) >= 0 
      ? ' mwfClass' : '';
      // この日のスケジュール
      let thisSchedule;
      // そもそもデータがない
      if (!sch)  thisSchedule = undefined;
      // 該当日のデータがない
      else if (Object.keys(sch).indexOf(did) === -1) 
        thisSchedule = undefined;
      else thisSchedule = sch[did];
      const thisCls = thisSchedule?.classroom;
      const otherCls = thisCls && classroom && classroom !== thisCls;
      const otherClsStyle = otherCls? {opacity: .3}: {};
      return (
        <div className={classes.vDayWrap} 
          key={i} did = {did}
          onClick = {(e)=>clickHandler(e)}
          style = {otherClsStyle}
        >
          {/* <div className={'dayLabel ' + wdClass}>
            {e.date.getDate()}
          </div> */}
          <div className={'content ' + wdClass + mwfClass}>
            <EachScheduleContent 
              thisSchedule={thisSchedule} virtical d={e} did={did} UID={UID}
            />
          </div>
        </div>
      );
    });
    // パラメータからオープンする場合とそれ以外でクラス名を変更する
    const monthWrapperCls = puid? classes.monthWrapperVP: classes.monthWrapperV;
    return (
      <>
        <div className={monthWrapperCls}>
          <div className={classes.userNameHeadDisp}>
            <span>{oneUser.name} 様</span>
            <span>{oneUser.ageStr}</span>
          </div>
          {days}
        </div>
      </>
    )
  };
  const weeks = daysGrid.map((e, i)=>{
    return (
      <OneWeek week={e} key={i} />
    );
  });
  const GridDisp = (props) => {
    const {puid} = props;
    // パラメータからオープンする場合とそれ以外でクラス名を変更する
    const monthWrapperCls = puid? classes.monthWrapperP: classes.monthWrapper;
    return(
      <div className={'monthWrapper ' + monthWrapperCls}>
        <div className={classes.userNameHeadDisp}>
          <span>{oneUser.name} 様</span>
          <span>{oneUser.ageStr}</span>
        </div>
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
      </div>
    );
  };
  return (<>
    {virtical === false && <GridDisp puid={puid}/>}
    {virtical === true && <VrtDisp puid={puid}/>}
  </>);
}

const ReserveContent = (props) => {
  const classes = useStyles();
  const {contentKey, value} = props;

  return(
    <div className={classes.ReserveContent}>
      <div className='key'>{contentKey}</div>
      <div className='value'>{value}</div>
    </div>
  )
}

const ReserveBulkImportButton = (props) => {
  const dispatch = useDispatch();
  const scheduleTemplate = useSelector(state => state.scheduleTemplate);
  const dateList = useSelector(state => state.dateList);
  const users = useSelector(state => state.users);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const schedule = useSelector(state => state.schedule);
  const {reserves, uid} = props;
  const uidStr = "UID" + uid;
  const user = users.find(dt => dt.uid === uid);

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = async() => {
    const sendData = {[uidStr]: {}};
    try{
      const sch = sendData[uidStr];
      const newReserves = JSON.parse(JSON.stringify(reserves));
      const newSchedule = JSON.parse(JSON.stringify(schedule));
      newReserves.forEach(reserve => {
        const data = reserve.data;
        const did = data.did;
        const dateDt = dateList.find(dt => {
          const dateObj = new Date(dt.date);
          const year = dateObj.getFullYear(), month = dateObj.getMonth(), date = dateObj.getDate();
          const prevDid = `D${year}${String(month+1).padStart(2, '0')}${String(date).padStart(2, '0')}`;
          return did === prevDid;
        });
        const dateType = dateDt.holiday == 0 ?"weekday" :"schoolOff";
        const template = scheduleTemplate?.[user.service]?.[dateType] ?? {};
        const newSchDt = {...template, absence: true, reserve: true};
        if(data.start) newSchDt.start = data.start;
        if(data.end) newSchDt.end = data.end;
        if(data.pickupLocation) newSchDt.transfer[0] = data.pickupLocation;
        if(data.dropoffLocation) newSchDt.transfer[1] = data.dropoffLocation;
        sch[did] = newSchDt;
        data.status = "merged";

        // ステート更新
        if(!newSchedule[uidStr]) newSchedule[uidStr] = {};
        newSchedule[uidStr][did] = newSchDt;
      });
      const sendParams = {
        a: "sendPartOfData",
        table: "ahdschedule", column: "schedule",
        hid, bid, date: stdDate, partOfData: JSON.stringify(sendData)
      };
      const sendRes = await albcm.univApiCall(sendParams);
      if(sendRes?.data?.result){
        const promises = newReserves.map(reserve => new Promise((resolve) => {
          const docId = reserve.id;
          const data = reserve.data;
          setDoc(doc(db, user.hno, docId), data).then(res => {
            resolve(true);
          }).catch(error => {
            resolve(false);
          });
        }));
        const ress = await Promise.all(promises);
        if(ress.every(x => x)){
          // 送信成功
          dispatch(Actions.setStore({schedule: newSchedule}));
          console.log("送信成功")
        }else{
          console.log("送信失敗")
        }
      }
    }catch(error){
      console.log("予期せぬエラー");
    }
    
  }

  const adjustedReserves = reserves.filter(r => {
    if(!r?.data?.did) return false;
    return true;
  }).sort((a, b) => {
    const aDid = a?.data?.did;
    const aDateObj = new Date(parseInt(aDid.slice(1, 5)), parseInt(aDid.slice(5, 7))-1, parseInt(aDid.slice(7, 9)));
    const bDid = b?.data?.did;
    const bDateObj = new Date(parseInt(bDid.slice(1, 5)), parseInt(bDid.slice(5, 7))-1, parseInt(bDid.slice(7, 9)));
    return aDateObj.getTime() < bDateObj.getTime() ?-1 :1;
  }).map(r => {
    const did = r?.data?.did;
    const year = did.slice(1, 5), month = did.slice(5, 7), date = did.slice(7, 9);
    return {...r?.data, date: `${year}年${month}月${date}日`};
  });

  const yesnoDialogProps = {
    open: dialogOpen, setOpen: setDialogOpen, handleConfirm: handleClick,
    prms: {
      title: "一括予約取込",
      confirmText: '一括取込', cancelText: 'キャンセル',
      message: (
        <div>
          <div>{user?.name ?? "不明な利用者"}様の予約を取り込みます。</div>
          <div style={{marginBottom: '8px'}}>取り込む予約は以下の通りです。</div>
          {adjustedReserves.map((data, i) => (
            <div style={{marginBottom: adjustedReserves.length > i+1 ?'8px' :0}}>
              <div style={{fontSize: '18px', fontWeight: 'bold'}}>{data.date}</div>
              <div style={{display: 'flex', flexWrap: 'wrap'}}>
                {Boolean(data.start) &&<ReserveContent contentKey="開始時間" value={data.start} />}
                {Boolean(data.end) &&<ReserveContent contentKey="終了時間" value={data.end} />}
                {Boolean(data.pickupLocation) &&<ReserveContent contentKey="迎え場所" value={data.pickupLocation} />}
                {Boolean(data.dropoffLocation) &&<ReserveContent contentKey="送り場所" value={data.dropoffLocation} />}
                {Boolean(data.notice) &&<ReserveContent contentKey="備考" value={data.notice} />}
              </div>
            </div>
          ))}
        </div>
      )
    }
  }
  return(
    <>
    <div style={{margin: '8px 0'}}>
      <Button
        onClick={() => setDialogOpen(true)}
        variant='contained'
        startIcon={<PersonIcon />}
        disabled={reserves.length<1}
      >
        一括予約取込
      </Button>
    </div>
    <YesNoDialog {...yesnoDialogProps} />
    </>
  )
}

const ReserveBulkConfirmedButton  = (props) => {
  const dispatch = useDispatch();
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const schedule = useSelector(state => state.schedule);
  const users = useSelector(state => state.users);
  const {uid} = props;
  const uidStr = "UID" + uid;
  const sch = schedule?.[uidStr] ?? {};
  const user = users.find(prevUser => prevUser.uid === uid);

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleClick = async() => {
    try{
      const newSchedule = JSON.parse(JSON.stringify(schedule));
      if(!newSchedule[uidStr]) newSchedule[uidStr] = {};
      const sendData = Object.entries(newSchedule[uidStr]).reduce((prevSendData, [did, schDt]) => {
        if(!/^D\d{8}$/.test(did)) return prevSendData;
        if(!schDt.absence) return prevSendData;
        if(!schDt.reserve) return prevSendData;
        const timestamp = new Date().getTime();
        schDt.absence = false;
        schDt.reserve = false;
        schDt.timestamp = timestamp;
        schDt.reserveFixedTimestamp = timestamp;
        prevSendData[uidStr][did] = schDt;
        return prevSendData;
      }, {[uidStr]: {}});
      const sendParams = {
        a: "sendPartOfData",
        table: "ahdschedule", column: "schedule",
        hid, bid, date: stdDate, partOfData: JSON.stringify(sendData)
      };
      const sendRes = await albcm.univApiCall(sendParams);
      if(sendRes?.data?.result){
        console.log("送信成功");
        dispatch(Actions.setStore({schedule: newSchedule}));
      }else{
        console.log("送信失敗")
      }
    }catch(error){
      console.log("予期せぬエラー");
    }
  }

  const reserveDates = Object.entries(sch ?? {}).filter(([did, schDt]) => {
    if(!/^D\d{8}$/.test(did)) return false;
    if(!schDt.reserve) return false;
    return true;
  }).map(([did, schDt]) => {
    const year = did.slice(1, 5), month = did.slice(5, 7), date = did.slice(7, 9);
    return `・${year}年${month}月${date}日`;
  });
  const yesnoDialogProps = {
    open: dialogOpen, setOpen: setDialogOpen, handleConfirm: handleClick,
    prms: {
      title: "一括予定取込",
      confirmText: '一括取込', cancelText: 'キャンセル',
      message: (
        <div>
          <div>{user?.name ?? "不明な利用者"}様の予約を予定実績へ取り込みます。</div>
          <div>取り込む予約は以下の通りです。</div>
          {reserveDates.map(date => (
            <div>
              <div>{date}</div>
            </div>
          ))}
        </div>
      )
    }
  }

  const disabled = Object.values(sch).every(schDt => !schDt.reserve);
  return(
    <>
    <div style={{margin: '8px 0'}}>
      <Button
        onClick={() => setDialogOpen(true)}
        variant='contained'
        startIcon={<PersonIcon />}
        disabled={disabled}
      >
        一括予定取込
      </Button>
    </div>
    <YesNoDialog {...yesnoDialogProps} />
    </>
  )
}



const SchReserveConfButton = (props) => {
  const {fabSch, setFabSch, reserveDialogParams, setReserveDialogParams, uid} = props;

  const handleClose = () => {
    setReserveDialogParams({open: false, reserve: null});
  }

  return(
    <>
    <div style={{margin: '8px 0', zIndex: 300}}>
      <Fab
        variant="extended"
        onClick={()=>setFabSch(prevFabSch => prevFabSch!==99 ?99 :FAV_NOOPE)}
        style={{
          backgroundColor: fabSch===99 ?orange[600] :'#888',
          color: fabSch===99 ?'#fff' :'#eee'
        }}
      >
        予約確認
      </Fab>
    </div>
    <SchReserveRecpDialog
      open={reserveDialogParams.open}
      handleClose={handleClose}
      reserve={reserveDialogParams.reserve}
      uid={uid}
    />
    </>
  )
}

const MainSchByUsers = () =>{
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const schedule = useSelector(state => state.schedule);
  const dateList = useSelector(state => state.dateList);
  const scheduleLocked = schedule.locked;
  const serviceItems = useSelector(state => state.serviceItems);
  const stdDate = useSelector(state => state.stdDate);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const [userAttr, setUserAttr] = useState([]); // 医療的ケア、重身、当月で終了などの属性表示チェック用

  const dispatch = useDispatch();
  // ダイアログ制御用
  const [dialogOpen, setDialogOpen] = useState({
    open: false, uid: '', did: '' , usch: {}
  });

  const [reserveDialogParams, setReserveDialogParams] = useState({open: false, reserve: null});

  // サービスが未設定なら設定する
  if (!service) {
    dispatch(Actions.changeService(serviceItems[0]));
  }
  // 対象となるユーザーのリスト
  const fusers = albcm.getFilteredUsers(users, service, classroom);
  // パラメータからuidを取得トライ
  const puid = useParams().p;
  // uid をlocal state化
  const [suid, setSuid] = useSessionStorageState(puid? puid: '', "schReserveRecpUid");
  // ユーザーごとのスケジュール定義 初期状態であることを確認するためのフラグ格納
  const [sch, setSch] = useState({init: true});
  const [snack, setSnack] = useState({msg: '', severity: '', id: 0});
  const [res, setRes] = useState(null);
  const [localFabSch, setLocalFabSch] = useState(0);
  const [userInfo, setUserInfo] = useState({});
  // 縦型表示にするかどうか SetUsersSchViewCookiesで設定される
  const [virtical, setVirtical] = useState(
    comMod.getUisCookie(comMod.uisCookiePos.usersSchViewVirtical) !== '0'
  );
  const favSchProps = {localFabSch, setLocalFabSch};
  const nodeId = 'nodeX765' + service + classroom;
  const [allSch, setAllSch] = useState(()=>{
    const t = {};
    Object.keys(schedule).forEach(e=>{
      if (!comMod.getUser(e, fusers)) return false;
      t[e] = schedule[e];
    });
    return t;
  });
  // suidを保持するよ
  // const controleMode = useSelector(state=>state.controleMode);
  // useRef使ってみるよ
  const firstRender = useRef(false);
  // ユーザーごとのスケジュールを設定
  useEffect(()=>{
    let isMounted = true;
    if (suid && firstRender && isMounted){
      setSch(allSch['UID' + suid]);
      setUserInfo(comMod.getUser(suid, users));
      // スケジュールデータが最初に読み込まれたフラグ
      firstRender.current = true;
    }
    return ()=>{
      isMounted = false;
    }

  }, [suid]);


  // -------------------------------
  // 作り直すよ
  // -------------------------------
  useEffect(()=>{
    const uiLen = Object.keys(userInfo).length;
    const schLen = (sch)? Object.keys(sch).length: 0;
    const sendItem = async (v) =>{
      const UID = 'UID' + suid;
      const tSch = {[UID]: sch, modDid: sch.modDid, deleteDid: sch.deleteDid}
      delete sch.modDid; delete sch.deleteDid;
      const sendPrms = {
        bid, hid, date: stdDate, partOfSch: tSch, uid: UID,
      }
      // const sendPrms = {
      //   uid: UID, bid, hid, date: stdDate, schedule: sch 
      // }
      console.log(sch, 'send sch', scheduleLocked, 'scheduleLocked');
      if (!scheduleLocked && suid){
        // 送信モジュール変更 2023/05/11
        const msg = `${userInfo.name}さんの予定を送信しました。`
        await albcm.sendPartOfScheduleCompt(sendPrms, setRes, setSnack, msg);
        // await albcm.sendUsersSchedule(sendPrms, setRes, setSnack, userInfo.name);
      }
    }
    const dispatchItem = async (v) =>{
      const t = {...schedule};
      const s = {...allSch};
      Object.keys(s).forEach(e=>{
        t[e] = s[e]
      });
      t['UID' + suid] = sch;
      // スケジュールが初期値のままdispatchされることがあるのでそれを抑制
      const schInit = sch && Object.keys(sch)?.length === 1 && sch.init === true;
      if (sch !== undefined && !schInit){
        t.timestamp = new Date().getTime();
        dispatch(Actions.setStore({schedule: t}));  
      }
    }
    // なんでここでschLenを見ているのかわからんぞ 2022/07/21
    // if (!firstRender.current && schLen > 1){
    if (!firstRender.current){
      sendItem();
    }
    if (firstRender.current && uiLen){
      firstRender.current = false;
    }
    const s = {...allSch};
    s['UID' + suid] = sch;
    setAllSch(s);
    const checkAndDispatch = () => {
      setTimeout(()=>{
        const closed = !document.querySelector('#' + nodeId);
        // なんでここでスケジュールの長さを見ているのか意味不明
        // if (Object.keys(sch? sch: {}).length > 1 && closed){
        if (closed){
          console.log('checkAndDispatch');
          dispatchItem();
        }
      }, 100)
    }
    return () => {
      checkAndDispatch();
    }
  }, [sch, ])

  const [reserves, setReserves] = useState([]);
  useEffect(() => {
    if(!suid) return;
    setReserves([]);
    // ゆーざーがみつからないばあいはnullを返す
    const susers = users.filter(e=>albcm.inService(e.service, service));
    const thisUser = (suid, susers);
    if (!Object.keys(thisUser).length)  return;
    const user = comMod.getUser(suid, thisUser);
    const hno = user.hno;
    const q = query(
      collection(db, hno),
      where("hid", "==", hid),
      where("bid", "==", bid),
      where("stdDate", "==", stdDate),
      where("status", "==", "reserved")
    );
    getDocs(q).then(querySnapshot => {
      const newReserves = [];
      querySnapshot.forEach((doc) => {
        newReserves.push({id: doc.id, data: doc.data()});
      });
      setReserves(newReserves);
    }).catch(error => {
      // エラー処理
    });
  }, [users, service, suid]);

  const susers = users.filter(e=>e.service === service);
  const pUser = comMod.getUser(puid, susers); // パラメータで指定されたユーザー
  const pUserExist = Object.keys(pUser).length;
  const autoFill = () => {
    const UID = comMod.convUID(suid).str;
    albcm.setRecentUser(UID);
    const newSch = schAutoFill({schedule: sch, dateList, UID, bid, service, classroom});
    setSch(newSch);
  }

  const sdPrms = {
    suid, sch, setSch, dialogOpen, setDialogOpen, setSnack, localFabSch,
    virtical, puid,
    reserves, setReserveDialogParams,
  };
  const occuWrapCalss = puid? classes.occuWrapP: classes.occuWrap;  
  const displayAutoFill = (() => {
    const currentDate = new Date();
    const [year, month] = stdDate.split('-').map(Number);
    const stdDateObj = new Date(year, month - 1, 10); // 10日を基準にする
    return currentDate < stdDateObj;
  })();
  const noticeAndMemoProps = {schedule, uid: suid, virtical, sch};
  return(<>
    <LinksTab menu={menu} menuFilter={makeSchMenuFilter(stdDate)} extMenu={extMenu} />
    <DisplayInfoOnPrint style={{width: '100%'}}/>
    <div className="AppPage schByUsers">
      <div className={occuWrapCalss}>
        <OccupancyRate displayMode='wide' localSch={{['UID' + suid]:sch}} />
      </div>
      {puid !== undefined &&
        <GoBackButton posY={120} posX={120} />
      }
      <SideSectionUserSelect 
        puid={puid} suid={suid} setSuid={setSuid} 
        userAttr={userAttr} setUserAttr={setUserAttr}
      />
      <div className={classes.editUserButtonWrap}>
        <EditUserButton uid={suid}/>
        <ReserveBulkImportButton reserves={reserves} uid={suid} />
        <ReserveBulkConfirmedButton uid={suid} />
      </div>
      <div className={classes.SchFabWrapper}>
        <SchFab
          fabSch={localFabSch} setFabSch={setLocalFabSch} displayAutoFill={displayAutoFill} 
          autoFillClicked={autoFill}
        /> 
      </div>
      <SchEditDetailDialog 
        stateOpen={dialogOpen} setStateOpen={setDialogOpen} setSch={setSch}
      />
      <SevenDaysGrid {...sdPrms} />
      <SchNoticeAndMemoList {...noticeAndMemoProps}/>
      {/* <div style={
        {width:'80%', maxWidth: 800, margin:'0 auto', textAlign: 'center', }
      }>
        <SetUisCookieChkBox 
          setValue={setVirtical} p={comMod.uisCookiePos.usersSchViewVirtical}
          label='縦型表示にする' style={{textAlign: 'center'}}
        />
      </div> */}

      <div style={{width: 'calc(100% - 200px', marginLeft: 200, marginBottom: 80, "@media print": {display: 'none'}}}>
        <UserAttrInfo userAttr={userAttr} />
      </div>
      <div style={{position: 'fixed', bottom: 12, right: 16}}>
        <SchReserveConfButton
          fabSch={localFabSch} setFabSch={setLocalFabSch}
          reserveDialogParams={reserveDialogParams} setReserveDialogParams={setReserveDialogParams}
          uid={suid}
        />
      </div>
    </div>
    <div id={nodeId} />
    <SnackMsg {...snack} />
    <SchUserDispatcher croneSch={sch}/>
  </>)
}

const SchReserveRecp = ()=>{
  const history = useHistory();
  const allstate = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allstate);
  const normalId = 'nomal-schbyuser2';
  const notNormalId = 'not-nomal-schbyuser2';

  if(!loadingStatus.loaded) return(<>
    <LoadingSpinner/>
    <div id={notNormalId} />
  </>);
  if(loadingStatus.error) return(<>
    <LoadErr loadStatus={loadingStatus} errorId={'E4942'} />
    <div id={notNormalId} />
  </>);

  // デバッグ用
  const {account} = allstate;
  const permission = comMod.parsePermission(account)[0][0];
  if(permission !== 100){
    history.push("/schedule");
  }

  return(<>
    <MainSchByUsers />
    <div id={normalId} />
    <SchInitilizer />
    <SchDailyReportSyncer />
  </>);
}
export default SchReserveRecp;