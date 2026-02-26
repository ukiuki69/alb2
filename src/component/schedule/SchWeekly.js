import React, {useEffect, useRef, useState} from 'react';
import * as Actions from '../../Actions';
import { useSelector, useDispatch } from 'react-redux';
// import SchHeadNav from './SchHeadNav';
import SchEditDetailDialog from './SchEditDetailDialog';
import SchTableHead from './SchTableHead';
import * as comMod from '../../commonModule';
import { HOHOU } from '../../modules/contants';
import * as albcm from '../../albCommonModule';
import * as mui from '../common/materialUi';
import {LoadingSpinner, LoadErr, SetUisCookieChkBox, DisplayInfoOnPrint} from '../common/commonParts';
import SimpleModal from '../common/modal.sample';
import SchDailyDialog from './SchDailyDialog';
import { createMuiTheme, createStyles, makeStyles } from '@material-ui/core/styles';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import { common } from '@material-ui/core/colors';
import KeyboardArrowDownRoundedIcon from '@material-ui/icons/KeyboardArrowDownRounded';
import EditIcon from '@material-ui/icons/Edit';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import EachScheduleContent from './SchEachScheduleContent';
import red from '@material-ui/core/colors/red';
import pink from '@material-ui/core/colors/pink';
import purple from '@material-ui/core/colors/purple';
import indigo from '@material-ui/core/colors/indigo';
import cyan from '@material-ui/core/colors/cyan';
import orange from '@material-ui/core/colors/orange';
import brown from '@material-ui/core/colors/brown';
import green from '@material-ui/core/colors/green';
import deepPurple from '@material-ui/core/colors/deepPurple';
import grey from '@material-ui/core/colors/grey';
import amber from '@material-ui/core/colors/amber';
import teal from '@material-ui/core/colors/teal';
import lightGreen from '@material-ui/core/colors/lightGreen';
import { menu, extMenu } from './Sch2';
import { SchInitilizer } from "./SchInitilizer";
import { LinksTab } from '../common/commonParts';
import { OccupancyRate } from './SchHeadNav';
import SnackMsg from '../common/SnackMsg';
import { datacellFade, useStylesFade } from './SchTableBody2';

import {
  useParams,
  useHistory,
  useLocation,
} from 'react-router-dom';
import { Album, EditAttributes, Height, TrendingUp } from '@material-ui/icons';
import { faSleigh } from '@fortawesome/free-solid-svg-icons';
import SchLokedDisplay from '../common/SchLockedDisplay';
import { SetUisCookieSelect } from '../common/SetUisCookieSelect';
import SchDailyReportSyncer from './SchDailyReportSyncer';

const useStyles = makeStyles({
  transferRoot:{
    pageBreakInside: 'avoid',
    '& .start, .end' : {
      fontSize: '1.4rem',
      color: teal[700],
      padding: '8px 0 2px 0',
      textAlign: 'center',
      // backgroundColor: teal[50],
      background: 
        'linear-gradient(#fff 0%, #fff 70%, ' 
        + teal[50] + ' 70%, ' + teal[50] + ' 100%);'
    },
    '& .end' : {
      color: grey[700],
      background:
        'linear-gradient(#fff 0%, #fff 70%, '
        + grey[200] + ' 70%, ' + grey[200] + ' 100%);'
    },
    '& .place' : {
      fontSize: '.8rem',
      fontWeight: 600,
      // padding: '8px 0 2px 8px',
      // marginBottom: 4,
    },
    '& .transferUser' : {
      fontSize: '.8rem', color: grey[900],
      padding: '2px 0 2px 4px',display: 'flex',cursor:'pointer',
      '& .name':{
        flex: 1, paddingTop:2, 
      },
      '&:hover': {
        '& .icon':{opacity: 1, backgroundColor: '#fff',},
      },
      '& .age' :{
        marginLeft: '.5rem',width: '1.5rem',position:'relative',
        '& .icon':{
          position:'absolute',opacity: 0,top: -4,
          right: 0, color: teal[400],
          '& .MuiSvgIcon-root':{
            width:'1.5rem', fontSize:'1.2rem',
          }
        },
      }
    }
  },
  arrowIcon : {
    paddingTop:0,paddingBottom:12,textAlign: 'center',color: grey[300],
    '& .MuiSvgIcon-root': {fontSize: '3rem',}
  },
  didCount: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    paddingBottom: 8,
    '& .l': {fontSize: '.6rem', paddingTop: '.25rem'},
    '& .n': {
      fontSize: '1.0rem', padding: '0 4px', color: teal[800]
    },
    '& .a': {
      color: red[800]
    },
  },
  schPillar: {
    '& .oneTransfer':{
      paddingTop: 24, pageBreakInside: 'avoid',
      '@media print':{marginBottom: 48},
      '& .teachers': {
        fontSize: 12, padding: 4, 
        backgroundColor: grey[200],
      }
    },
  },
});

// クッキーの値を取得して表示の制限をかけるためのデータオブジェクトを作成する
export const NotDisplayItems = [
  { value: 0, label: "すべて表示" },
  { value: 1, label: "名前のみ" },
  { value: 2, label: "名前,時間" },
  { value: 3, label: "名前,時間,実費" },
  { value: 4, label: "名前,時間,実費,加算" },
  { value: 5, label: "名前,時間,送迎" },
  { value: 6, label: "名前,時間,送迎,実費" },
  { value: 8, label: "名前,実費,加算" },
];
export const getDispCont = (NotDisplayItem) => {
  let cookeiVal = null;
  if (NotDisplayItem === 'week'){
    cookeiVal = comMod.getUisCookie(comMod.uisCookiePos.displayContOnSchWeekly);
  }
  if (NotDisplayItem === 'reportsUsersCalendar'){
    cookeiVal = comMod.getUisCookie(comMod.uisCookiePos.displayContOnReportsUsersCalendar);
  }
  if (cookeiVal === '1'){
    return {
      hideTime: true, hideTranser: true, hideAcCost: true, hideAddic: true
    };
  }
  else if (cookeiVal === '2'){
    return {
      hideTranser: true, hideAcCost: true, hideAddic: true
    };
  }
  else if (cookeiVal === '3'){
    return {
      hideTranser: true, hideAddic: true
    };
  }
  else if (cookeiVal === '4'){
    return {
      hideTranser: true, 
    };
  }
  else if (cookeiVal === '5'){
    return {
      hideAcCost: true, hideAddic: true
    };
  }
  else if (cookeiVal === '6'){
    return {
      hideAddic: true
    };
  }
  else if (cookeiVal === '7'){
    return {
      hideAddic: true
    };
  }
  else return {};
}

// 利用者名の背景色-> 縦棒の色
const bkColors = [
  red[500], pink[500], purple[500], green[500],
  brown[400], orange[800], cyan[500], indigo[800],
  grey[600], deepPurple[300], amber[500], lightGreen[800],
];

const SpecifyStartDate = (props)=>{
  const dispatch = useDispatch();
  const {
    start, dispathcStart, dateList, schedule, setSchedule, sSch,
    ...other
  } = props;
  // 月初または月曜日を返す配列
  let j = 0;
  const points = dateList.filter((e, i)=> i === 0 || e.date.getDay() === 0);
  // console.log(points);
  const startPoints = points.map((e, i)=>{
    const dateFormat = (i === 0) ? 'YYYY年MM月DD日' : 'MM月DD日';
    return (
      <Button key={i} onClick={
        () => {
          dispathcStart(e.date);
          const t = {...sSch, ...schedule}
          t.timestamp = new Date().getTime();
          dispatch(Actions.setStore({schedule: t}));
        }
      }
        variant={e.date === start ? 'contained' : 'outlined'}
      >
        {comMod.formatDate(e.date, dateFormat)}
      </Button>
    )
  });
  return(<>
    <div className="weeklyButtonGrp">
      <ButtonGroup color="primary" >
        {startPoints}
      </ButtonGroup>
    </div>
  </>)
}
// ---- スケジュール配列を迎え時間順、送迎場所順にソートする
const schSortForTransefer = (dateSchArray) =>{
  let pickUpAry = []; // 迎え用の配列
  let sendAry = []; // 送り用の配列
  const a = [...dateSchArray];
  const b = [...dateSchArray];
  if (dateSchArray.length) {
    pickUpAry = a.sort((a, b) => {
      if (a.thisSchedule?.start < b.thisSchedule?.start) return -1;
      if (a.thisSchedule?.start > b.thisSchedule?.start) return 1;
      if (a.thisSchedule?.transfer?.[0] < b.thisSchedule?.transfer?.[0]) return -1;
      if (a.thisSchedule?.transfer?.[0] > b.thisSchedule?.transfer?.[0]) return 1;
    });
    sendAry = b.sort((a, b) => {
      if (a.thisSchedule.end < b.thisSchedule.end) return -1;
      if (a.thisSchedule.end > b.thisSchedule.end) return 1;
      if (a.thisSchedule?.transfer?.[1] < b.thisSchedule?.transfer?.[1]) return -1;
      if (a.thisSchedule?.transfer?.[1] > b.thisSchedule?.transfer?.[1]) return 1;
    });
    // pickUpAry.map(e => {
    //   console.log(e.thisSchedule.start, e.thisSchedule.transfer[0]);
    // })
  }
  return {pickUpAry, sendAry}
}
// 指定されている行き先をユニークにした配列を作る。
// 行き先別に色分けするため
const getUniqDest = (schedule) =>{
  const destSet = new Set();
  const keys = comMod.setOfUidDid(schedule);
  keys.map(e=>{
    destSet.add(schedule[e[0]][e[1]]?.transfer?.[0])
    destSet.add(schedule[e[0]][e[1]]?.transfer?.[1])
  });
  return Array.from(destSet);
}

// 指定されている行き先をユニークにした配列を作る。
// 行き先別に色分けするため
const getUniqDestVerGroupe = (schedule) =>{
  const groupes = Object.keys(schedule).flatMap(uidStr => (
    Object.keys(schedule[uidStr]).map(dDate => schedule[uidStr][dDate]?.groupe)
  )).filter(x => x);
  const uniqueGroupes = Array.from(new Set(groupes));
  return Array.from(uniqueGroupes);
}


const TitleOfPillar = (props) =>{
  const { start,schCounts, noUseNodisp, ...other } = props;
  const dateList = useSelector(state=>state.dateList);
  const days = makeDatasOfWeeks(dateList, start);
  const prms = useParams().prms;
  const classes = useStyles();

  // 休日平日などを示すクラス名
  // 該当月でない場合 classOfDayはundefinedが格納されている
  const titles = days.map((e, i)=>{
    let classOfDay = ['', 'schooloff', 'off'][e.holiday];
    const did = comMod.convDid(e.date);
    const didCount = schCounts.didCounts[did];
    classOfDay = (classOfDay !== undefined) ? classOfDay : 'outOfMonth';
    const cnt = didCount? didCount.schoolOffCnt + didCount.weekDayCnt: 0;
    const absCnt = didCount? didCount.absenceCnt: 0;
    const dayOfWeek = e.date.getDay();
    if (cnt || !noUseNodisp || dayOfWeek){
      return (
        <div className="schPillar title" key={i}>
          <div className={"date " + classOfDay} key={i}>
            {comMod.formatDate(e.date, 'MM月DD日 AA')}
          </div >
          <div className={classes.didCount}>
            <div className='l'>利用</div>
            <div className='n'>{cnt}</div>
            <div className='l'>欠席</div>
            <div className='n a'>{absCnt}</div>
          </div>
        </div>
      );
    }
    return null;
  });
  return(
    <div className='schPillarOuter title'>
      <DisplayInfoOnPrint style={{width: '100%'}}/>
      {titles}
    </div>
  )
}

const OnePillar = (props)=>{
  const classes = useStyles();
  const classesFade = useStylesFade();
  const {
    day, type, dialogOpen, setDialogOpen, 
    schedule, setSchedule, setSnack, schCounts, dispCont,
    isChangePerGroupe
  } = props;
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const classroom = useSelector(state => state.classroom);
  const users = useSelector(state=>state.users);
  // Scheduleから情報抽出するとソートが反映されないので
  // usersのstateから並び順にuidを取り出す
  // ついでに教室による絞り込み
  const sortedUsers = users
  .filter(e=>(
    albcm.isService(e, service) && albcm.isClassroom(e, classroom)
  ))
  .map(e=>"UID" + e.uid);

  // ユニークな送迎先の配列
  // 送迎先別に色分けするのに使う
  let uniqDest = getUniqDest(schedule);

  // user情報とscheduleを持つ配列にして返す
  const getSchedulesByDate = (did) =>{
    const rt = [];
    sortedUsers.map(e=>{
      const user = comMod.getUser(e, users);
      const isMtu = albcm.classroomCount(user) > 1;
      if (schedule[e] === undefined)  return false;
      Object.keys(schedule[e]).map(f=>{
        // mtuはスケジュールオブジェクト内部のclassroomを見に行き判定
        if (isMtu && classroom && classroom !== schedule[e][f].classroom){
          return false;
        }
        // 該当のオブジェクトを配列に追加
        if (f === did){
          const thisSchedule = schedule[e][f];
          rt.push({user, thisSchedule});
        }
      });
    });
    return rt;
  }
  const did = comMod.convDid(day.date);
  const dateSchArray = getSchedulesByDate(did);
  // ここから普通の週間予定
  const daySchedule = dateSchArray.map((e, i)=>{
    // 別単位の予定
    const thisCls = e.thisSchedule?.classroom;
    const otherCls = thisCls && classroom && classroom !== thisCls;
    if (otherCls) return null;
    const otherClsStyle = (otherCls)? {opacity: .3, cursor: 'auto'}: {};
    const oneSchItemStyle = {
      cursor: 'pointer', pageBreakInside: 'avoid', ...otherClsStyle
    }
    const handleClick = (ev) =>{
      const uid = comMod.convUID(e.user.uid).str;
      const thisUser = comMod.getUser(uid, users);
      if (!service && serviceItems.length > 1){
        setSnack({
          msg: 'サービス指定を行ってください。全表示では編集できません。', 
          severity: 'warning', id: new Date().getTime()
        });
        return false;
      }
      const locked = albcm.schLocked(
        schedule, users, thisUser, did, service, classroom
      )
      if (!classroom && albcm.classroomCount(thisUser) > 1){
        const id = new Date().getTime();
        setSnack({
          msg: 'この利用者は複数単位があるので編集できません。', 
          severity: 'warning', id
        });
        return false;
      }
      if (otherCls){
        const id = new Date().getTime();
        setSnack({
          msg: '別単位の予定なので編集できません。', 
          severity: 'warning', id
        });
        return false;

      }
      if (locked){
        const id = new Date().getTime();
        setSnack({msg: '予定・実績はロックされています。', severity: 'warning', id});
        return false;
      }
      datacellFade(ev.currentTarget, classesFade);
      // const p = { open: true, uid: uid, did };
      // comMod.setOpenSchEditDetailDialog(dispatch, p);
      const usch = schedule[uid];
      setDialogOpen({open: true, uid, did, usch, });

    }
    const ruStyle = albcm.recentUserStyle(e.user.uid);
    const sty = {
      borderLeft: '6px solid ' + 
        bkColors[parseInt(e.user.uid) % bkColors.length],
        ...ruStyle,
    }
    
    return (
      <div 
        key = {i} className='oneSchItem' 
        onClick={(ev)=>handleClick(ev)}
        style={oneSchItemStyle}
      >
        <div className='user' style={sty}>{e.user.name}</div>
        <EachScheduleContent 
          thisSchedule={e.thisSchedule} uid={e.user.uid} dispCont={dispCont}
          onWeekly
        />
      </div>
    )
  });
  // ---- ここまでが普通の週間予定
  // 送迎用のコードはここから
  // ---- スケジュール配列を迎え時間順、送迎場所順にソートする

  const DayTransferDetail = (props) =>{
    const classes = useStyles();
    const {ary, item} = props;
    let preTime = '';
    let prePlace = '';
    let newTime = false; // 新しい時刻として描画開始するフラグ
    let newPlace = false; // 新しい場所として描画開始するフラグ
    let placeNdx = (item === 'start')? 0: 1;  // transferから場所取得するindex
    const allState = useSelector(s=>s);
    const {service, serviceItems} = allState;
    // サービスが未指定で複数サービスが存在する場合、この画面では編集不可とする
    const editNotAllowed = !service && serviceItems.length > 1;
    
    const nodes = ary.map((e, i)=>{
      if (e.thisSchedule.absence) return false; // 欠席はここでは非表示
      if (e.thisSchedule.service === HOHOU) return;
      const thisTime = e.thisSchedule[item];
      const thisPlace = e.thisSchedule.transfer[placeNdx];
      if (preTime !== thisTime) { newTime = true; newPlace = true;}
      else if (prePlace !== thisPlace) { newTime = false; newPlace=true;}
      else {newTime = false; newPlace = false};
      preTime = thisTime;
      prePlace = thisPlace;
      const useResult = e.thisSchedule.useResult;
      // 利用実績があるときは時刻を非表示
      if (useResult) newTime = false
      if (useResult) newPlace = false
      // ユニーク配列のインデックスを調べて行き先別の色を特定する
      // 利用実績があるときはグレイ一択 -> 非表示
      const colorNdx = 
        uniqDest.findIndex(f => (f === thisPlace)) % bkColors.length;
      const destStyle = {
        borderBottom: '2px solid ' + bkColors[colorNdx],
        color: bkColors[colorNdx],
        fontSize: '1.2rem',
        marginBottom: 4,
        paddingLeft: 4
      };
      if (!thisPlace){
        destStyle.fontSize = '1rem';
        destStyle.borderBottom =  '2px solid ' + grey[400];
        destStyle.color = grey[400];
      }
      const handleUserClick = () =>{
        if (editNotAllowed){
          const id = new Date().getTime();
          setSnack({
            msg: 'サービス指定が全表示のときはこの画面から編集できません。', 
            severity: 'warning', id
          });
          return false;

        }
        if (useResult)  return false;
        if (!classroom && albcm.classroomCount(e.user) > 1){
          const id = new Date().getTime();
          setSnack({
            msg: 'この利用者は複数単位があるので編集できません。', 
            severity: 'warning', id
          });
          return false;
        }
  
        const uid = comMod.convUID(e.user.uid).str;
        const usch = schedule[uid];
        setDialogOpen({open: true, uid, did, usch, });
        // comMod.setOpenSchEditDetailDialog(dispatch, p);
      }
      const thisTimeStyles = {
        fontSize: thisPlace ?'0.8rem' :'0.7rem', 
        color: thisPlace ?bkColors[colorNdx] :grey[400],
        paddingLeft: 4,
      } //橋本追加 10/05
      const ruStyle = albcm.recentUserStyle(e.user.uid);
      const dispEditIcon = useResult !== true && !editNotAllowed;
      return (
        <div className={classes.transferRoot} key={i}>
          <div className='transferUser' onClick={handleUserClick}>
            <div className='name textEclips' style={ruStyle}>{e.user.name}</div>
            <div className='age'>
              {e.user.ageStr.replace('歳', '')}
              {dispEditIcon &&
                <div className='icon'><EditIcon/></div>
              }
            </div>
          </div>
        </div>
      );
    });
    return (<>{nodes}</>)
  }


  const { pickUpAry, sendAry } = schSortForTransefer(dateSchArray);

  const DayTransfer = (props) => {
    const {ary, item} = props;
    const groupAry = [];
    let placeNdx = (item === 'start')? 0: 1;  // transferから場所取得するindex
    const classroom = useSelector(e=>e.classroom);
    if(isChangePerGroupe){
      // （日報）クラス名別表示
      const organizedDt = ary.reduce((prevDt, e) => {
        const thisCls = e.thisSchedule?.classroom;
        const otherCls = thisCls && classroom !== thisCls;
        if (otherCls) return prevDt;
        if (e.thisSchedule.absence) return prevDt; // 欠席はここでは非表示
        const time = e.thisSchedule[item];
        const groupe = e.thisSchedule.groupe;
        const teachers = e.thisSchedule.teachers ?? [];
        if(!prevDt[groupe+time]) prevDt[groupe+time] = {thisGroupe: '', thisTime: '', thisTeachers: []};
        prevDt[groupe+time].thisGroupe = groupe;
        prevDt[groupe+time].thisTime = time;
        prevDt[groupe+time].thisTeachers = [...prevDt[groupe+time].thisTeachers, ...teachers];
        return prevDt;
      }, {});
      Object.values(organizedDt).forEach(dt => {
        dt.thisTeachers = [...new Set(dt.thisTeachers)]
        groupAry.push(dt);
      });
      groupAry.push({thisGroupe: '', thisTime: '', thisTeachers: []});
    }else{
      // 送迎別表示
      let preTime = '';
      let prePlace = '';
      let newTime = false; // 新しい時刻として描画開始するフラグ
      let newPlace = false; // 新しい場所として描画開始するフラグ
      ary.forEach(e=>{
        // 別クラスの予定は非表示にする
        const thisCls = e.thisSchedule?.classroom;
        const otherCls = thisCls && classroom && classroom !== thisCls;
        if (otherCls) return null;
        if (e.thisSchedule.absence) return false; // 欠席はここでは非表示
        const thisTime = e.thisSchedule[item];
        const thisPlace = e.thisSchedule?.transfer?.[placeNdx] || '';
        if (preTime !== thisTime) { newTime = true; newPlace = true;}
        else if (prePlace !== thisPlace) { newTime = false; newPlace=true;}
        else {newTime = false; newPlace = false};
        preTime = thisTime;
        prePlace = thisPlace;
        const useResult = e.thisSchedule.useResult;
        // 利用実績があるときは時刻を非表示
        // if (useResult) newTime = false
        // if (useResult) newPlace = false
        if (newPlace || newTime) groupAry.push({thisTime, thisPlace});
      });
      groupAry.push({thisPlace: '', thisTime: ''});
    }

    const nodes = groupAry.map((e, i)=>{
      if(isChangePerGroupe){
        const thisTime = e.thisTime;
        const thisGroupe = e.thisGroupe;
        const thisTeachers = e.thisTeachers;
        const fAry = ary.filter(f=>(
            e.thisTime === f.thisSchedule[item] && 
            e.thisGroupe === f.thisSchedule.groupe
        ));
        uniqDest = getUniqDestVerGroupe(schedule);
        const colorNdx = uniqDest.findIndex(
          f => (f === thisGroupe)
        ) % bkColors.length;
        const thisTimeStyles = {
          fontSize: thisGroupe ?'0.8rem' :'0.7rem', 
          color: thisGroupe ?bkColors[colorNdx] :grey[400],
          paddingLeft: 4, marginBottom: 4,
        } //橋本追加 10/05
        const destStyle = {
          borderBottom: '2px solid ' + bkColors[colorNdx],
          color: bkColors[colorNdx],
          fontSize: '1.2rem',
          marginBottom: 4,
          paddingLeft: 4
        };
        if (!thisGroupe){
          destStyle.fontSize = '1rem';
          destStyle.borderBottom =  '2px solid ' + grey[400];
          destStyle.color = grey[400];
        }
        if (fAry.length){
          return (
            <div className='oneTransfer' key={i}>
              <div >
                <div style={destStyle}>
                  <div>{thisTime}</div>
                </div>
                <div className='place' style={thisTimeStyles}>
                  {thisGroupe? thisGroupe: 'クラス設定なし'}
                </div>
              </div> 
              <DayTransferDetail ary={fAry} item={item} />
              {thisTeachers.length ?<div className='teachers'>{thisTeachers.join("・")}</div> :null}
            </div>
          )
        }
        else return null;
      }else{
        const thisTime = e.thisTime;
        const thisPlace = e.thisPlace;
        const fAry = ary.filter(f=>(
            (e.thisTime === f.thisSchedule?.[item] || '') && 
            (e.thisPlace === f.thisSchedule?.transfer?.[placeNdx] || '')
        ));
        const colorNdx = uniqDest.findIndex(
          f => (f === thisPlace)
        ) % bkColors.length;
        const thisTimeStyles = {
          fontSize: thisPlace ?'0.8rem' :'0.7rem', 
          color: thisPlace ?bkColors[colorNdx] :grey[400],
          paddingLeft: 4, marginBottom: 4,
        } //橋本追加 10/05
        const destStyle = {
          borderBottom: '2px solid ' + bkColors[colorNdx],
          color: bkColors[colorNdx],
          fontSize: '1.2rem',
          marginBottom: 4,
          paddingLeft: 4
        };
        if (!thisPlace){
          destStyle.fontSize = '1rem';
          destStyle.borderBottom =  '2px solid ' + grey[400];
          destStyle.color = grey[400];
        }
        if (fAry.length){
          return (
            <div className='oneTransfer' key={i}>
              <div >
                <div style={destStyle}>
                  <div>{thisTime}</div>
                </div>
                <div className='place' style={thisTimeStyles}>
                  {thisPlace? thisPlace: '送迎なし'}
                </div>
              </div> 
              <DayTransferDetail ary={fAry} item={item} />
            </div>
          )
        }
        else return null;
      }
    });
    return (<>{nodes}</>)
  }

  return(
    <div className={"schPillar " + classes.schPillar}>
      <div className="content">
        {type.type === 'pickup' && <>
          <DayTransfer ary={pickUpAry} item={'start'} />
        </>}
        {type.type === 'send' && !isChangePerGroupe &&<>
          {dateSchArray.length > 0 &&
            <div className={classes.arrowIcon}>
              <KeyboardArrowDownRoundedIcon />
            </div>
          }
          <DayTransfer ary={sendAry} item={'end'} />
        </>}
        {type.type === 'normal' &&
          // 条件付きレンダーは単一ノードにする必要がある
          <>{daySchedule}</> 
        }
      </div>
    </div>
  )
}
const SevenPillars = (props)=>{
  // startは月初か日曜日が与えられる。starの日付から7日を表示
  // startが1日の場合、前月の日付を持ってきて一週間にする
  // 月末の場合は次月の日付を持ってくる
  const {
    start, editOn, dialogOpen, setDialogOpen, 
    schedule, setSchedule, noUseNodisp, dispCont,
    isChangePerGroupe
  } = props;
  const dateList = useSelector(state=>state.dateList);
  const service = useSelector(state=>state.service);
  const users = useSelector(state=>state.users);
  const classroom = useSelector(state=>state.classroom);
  const days = makeDatasOfWeeks(dateList, start);
  const prms = useParams().prms;
  const [snack, setSnack] = useState({msg: '', severity: '', id: 0});
  const schInfo = comMod.getScheduleInfo(schedule, service, users, classroom);

  const Pillers = (type) =>{
    const nodes = days.map((e, i) => {
      // 該当日の利用数を見る
      const did = comMod.convDid(e.date);
      const dayOfWeek = e.date.getDay();
      const cntObj = comMod.fdp(schInfo, ['didCounts', did]);
      const cnt = (cntObj)? cntObj.schoolOffCnt + cntObj.weekDayCnt: 0;
      if (cnt || !noUseNodisp || dayOfWeek){
        return (
          <OnePillar 
            key={i} day={e} type={type} 
            dialogOpen={dialogOpen} setDialogOpen={setDialogOpen}
            schedule={schedule} setSchedule={setSchedule}
            setSnack={setSnack} dispCont={dispCont}
            isChangePerGroupe={isChangePerGroupe}
          />
        )
      }
      else return null;
    });
    return nodes;
  }
  return (<>
    {prms !== 'transfer' && 
      <div className="schPillarOuter week">
        <Pillers type='normal'/>
      </div>
    }
    {(prms === 'transfer') && <>
      <div className="schPillarOuter">
        <Pillers type='pickup' />
      </div>
      <div className="schPillarOuter">
        <Pillers type='send' />
      </div>

    </>}
    <SnackMsg {...snack} />

  </>);
}
// 一週間の日付配列を作成する
const makeDatasOfWeeks = (dateList, start) => {
  const dateDiff = (a, b) => (a - b) / (24 * 60 * 60 * 1000);
  const days = dateList.filter((e, i) => (
    e.date >= start && dateDiff(e.date, start) < 7
  ));
  // 月桃で先頭の曜日をチェック。日曜日になるまで日付を先頭に追加
  const thisWeekday = days[0].date.getDay();
  const fd = new Date(days[0].date.getTime());
  for (let i = 1; i <= thisWeekday; i++) {
    const addDate = new Date(fd.getFullYear(), fd.getMonth(), fd.getDate() - i);
    days.unshift({ date: addDate });
  }
  // 月末の想定。日付配列の長さが0以下なら追加する
  const daysLength = days.length;
  const ld = days[days.length - 1].date;
  for (let i = 1; i <= (7 - daysLength); i++) {
    const addDate = new Date(ld.getFullYear(), ld.getMonth(), ld.getDate() + i);
    days.push({ date: addDate });
  }
  // lengthを入れると所定以上の名朝は削除されるみたい
  days.length = 7;
  return days;
}

const MainSchWeekly = (props)=>{
  const dispatch = useDispatch();
  const allState = useSelector(state => state);
  const dateList = allState.dateList;
  const users = allState.users;
  const service = allState.service;
  const classroom = allState.classroom;
  const hid = allState.hid;
  const bid = allState.bid;
  const stdDate = allState.stdDate;
  const sSch = useSelector(state=>state.schedule);
  const scheduleLocked = allState.schedule.locked;
  const ref = useLocation().pathname;
  const isWeekly = ref.replace(/\/$/, '') === '/schedule/weekly'

  const [editOn, seteditOn] = useState(false);
  const [res, setRes] = useState({});
  const {snack, setSnack} = props
  const [noUseNodisp, setNoUseNoDips] = useState(
    comMod.getUisCookie(comMod.uisCookiePos.noUseDayNoDispOnWeeklyTransfer) !== "0"
  )
  // 送迎先別表示からクラス名（日報）別表示に変更
  const [isChangePerGroupe, setIsChangePerGroupe] = useState(
    comMod.getUisCookie(comMod.uisCookiePos.changePerTransferToPerGroupe) === "1"
  );
  // 表示抑制するためのデータオブジェクト
  const [dispCont, setDispCont] = useState(getDispCont('week'));
  // dispContを更新するためのスイッチ
  const [dispContSw, setDispContSw] = useState(null);

  // ダイアログ用のステイト。ユーザーオペレーションのフラグを入れる。
  const [dialogOpen, setDialogOpen] = useState({
    open: false, uid: '', did: '' , usch: {}, userOpe: false
  });
  // 処理対象ユーザーの絞り込み
  const tUsers = users.filter(e=>(
    albcm.isService(e, service) && albcm.isClassroom(e, classroom)
  )).map(e=>"UID" + e.uid);
  // ローカルstateのスケジュール
  const [schedule, setSchedule] = useState(()=>{
    const ret = {};
    tUsers.map(e=>{if(sSch[e]) ret[e] = sSch[e];});
    return ret;
  });

  const yearMonth = (date) => (
    date.getFullYear() + '-' + date.getMonth()
  )

  // const [start, setstart] = useState(dateList[0].date);
  let dlZero = dateList[0].date;
  const now = new Date();
  if (
    now.getFullYear() === dateList[0].date.getFullYear() 
    && now.getMonth() === dateList[0].date.getMonth()
  ){
    const weekdayNow = now.getDay();
    let n = now.getDate() - 1 - weekdayNow;
    if (n < 0) n = 0;
    dlZero = dateList[n].date;
    console.log(dlZero, 'dlZero')
  }

  
  let start = useSelector(state => state.controleMode.weeklyStart);
  // ローカルスケジュールの更新が行われないためstartを別途stateに保存する
  // const [sstart, setSstart] = useState(start);

  start = (start) ? start : dlZero;
  start = (yearMonth(start) === yearMonth(dlZero))? start: dlZero;
  const dispathcStart = (st) => {
    dispatch(Actions.setControleMode({ weeklyStart: st}));
  }
  const specifyStartDateProps = {
    start, dispathcStart, dateList, schedule, sSch, setSchedule
  }

  const firstRender = useRef(false);
  useEffect(()=>{
    setDispCont(getDispCont('week'));
  }, [dispContSw])

  useEffect(() => { // このeffectは初回レンダー時のみ呼ばれるeffect
    firstRender.current = true
  }, []);
  // dialogOpenの更新で発火。
  // dialog openはレンダリングに絡まないのでclean upはいちいち動かない？
  useEffect(()=>{
    // dialogが閉じていて何らかのスケジュールデータを持っているとき
    if (Object.keys(dialogOpen.usch).length && !dialogOpen.open){
      // ローカルstateのスケジュールを更新する
      const t = {...schedule}
      t[dialogOpen.uid] = {...dialogOpen.usch};
      setSchedule({...t});
      console.log('schedule updated.')
    }
  }, [dialogOpen]);
  // dialogOpenのuseeffectを受けてscheduleの更新で発火させる
  useEffect(()=>{
    let mounted = true;
    // Snack用のstateは上位モジュールで設定。上位モジュールではstaticにSnack
    // Componentを記述すること
    const f = async () => {
      const partOfSch = {[dialogOpen.uid]: schedule[dialogOpen.uid]};
      partOfSch.modDid = dialogOpen.did;
      const a = await albcm.sendPartOfScheduleCompt(
        {hid, bid, date:stdDate, partOfSch}, setRes, setSnack
      )
      console.log('schedule useeffect', a);
    }
    // 初回レンダー起動抑制
    if (firstRender.current){
      firstRender.current = false;
    }
    else{
      setTimeout(() => {
        if (mounted)  f();
      }, 100);
    }
    // クリーンナップの方が先に実行される
    return () => {
      mounted = false;
      // nodeの消失を確認してからdispatchを実行する
      setTimeout(()=>{
        if (!document.querySelector('#dggd98gh')){
          const t = {...sSch, ...schedule}
          t.timestamp = new Date().getTime();
          dispatch(Actions.setStore({schedule: t}));
        }
      }, 100)
    }
  }, [schedule]);
  
  const schCounts = comMod.getScheduleInfo(schedule, service, users, classroom);
  if (service === HOHOU){
    const style = {marginTop: 120, textAlign: 'center'}
    return (<>
      <LinksTab menu={menu} extMenu={extMenu} />
      <div style={style}>
        このページは{HOHOU}に対応していません。
      </div>
      <div id='dggd98gh' />

    </>)

  }
  return (
    <>
    <LinksTab menu={menu} extMenu={extMenu} />
    <div className="AppPage schWeekly fixed">
      <OccupancyRate localSch={schedule}/>
      <SpecifyStartDate {...specifyStartDateProps} />
      <TitleOfPillar start={start} schCounts={schCounts} noUseNodisp={noUseNodisp} />
    </div>
    <div className="AppPage schWeekly scroll">
      <SevenPillars 
        start={start} editOn={editOn} 
        dialogOpen={dialogOpen} setDialogOpen={setDialogOpen}
        schedule={schedule} setSchedule={setSchedule}
        noUseNodisp={noUseNodisp} dispCont={dispCont}
        isChangePerGroupe={isChangePerGroupe}
      />
      {/* <SchEditDetailDialog /> */}
      <SchEditDetailDialog 
        stateOpen={dialogOpen} setStateOpen={setDialogOpen}
      />
    </div>
    <div id='dggd98gh' />
    <SchInitilizer />
    <SetUisCookieChkBox 
      p={comMod.uisCookiePos.noUseDayNoDispOnWeeklyTransfer}
      label='利用のない日曜日を表示をしない。'
      setValue={setNoUseNoDips}
    />
    <SetUisCookieChkBox 
      p={comMod.uisCookiePos.changePerTransferToPerGroupe}
      label='送迎先別からクラス名別に切り替える'
      setValue={setIsChangePerGroupe}
    />
    {isWeekly &&
      <SetUisCookieSelect
        p={comMod.uisCookiePos.displayContOnSchWeekly}
        label='表示項目を選択' opt={NotDisplayItems}
        setState={setDispContSw}
      />
    }
    <div className='noprint' style={{height: 32}}></div>

    <SchLokedDisplay/>
    <SchDailyReportSyncer />
    </>
  )
}


const SchWeekly = ()=>{
  const allstate = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allstate);
  const [snack, setSnack] = useState({msg:'', severity: ''});
  const prms = useParams().prms;
//   if (loadingStatus.loaded) return (<>
//     <MainSchWeekly snack={snack} setSnack={setSnack} />
//     <SnackMsg {...snack} />
//   </>);
//   else if (loadingStatus.error) return (
//     <LoadErr loadStatus={loadingStatus} errorId={'E4921'} />
//   );
//   else return (<LoadingSpinner />);
// }
  return(<>
    {(loadingStatus.loaded && !loadingStatus.error) && <>
      <MainSchWeekly 
        snack={snack} setSnack={setSnack} 
      />
    </>}
    {loadingStatus.error && 
      <LoadErr loadStatus={loadingStatus} errorId={'E4921'} />
    }
    {!loadingStatus.loaded &&
      <LoadingSpinner />
    }
    <SnackMsg {...snack} />
  </>)
}
export default SchWeekly;