import React, {useState, useEffect,useRef, } from 'react';
import * as Actions from '../../Actions';
import { useSelector, useDispatch } from 'react-redux';
// import SchHeadNav from './SchHeadNav';
import SchEditDetailDialog from './SchEditDetailDialog';
// import SchTableHead from './SchTableHead';
import * as comMod from '../../commonModule';
import { HOHOU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import * as albcm from '../../albCommonModule'
import * as mui from '../common/materialUi';
import {LoadingSpinner, LoadErr, SetUisCookieChkBox, EditUserButton, GoBackButton, DisplayInfoOnPrint} from '../common/commonParts';
import { makeStyles, createMuiTheme } from '@material-ui/core/styles';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import EachScheduleContent from './SchEachScheduleContent';
import { makeSchMenuFilter, menu, extMenu } from './Sch2';
import { SchInitilizer } from './SchInitilizer';
import { LinksTab } from '../common/commonParts';
import { useLocation, useParams, } from 'react-router-dom';
import SnackMsg from '../common/SnackMsg';
import { OccupancyRate } from './SchHeadNav';
import {SetUsersSchViewCookies} from '../common/StdFormParts'
import { grey, orange, teal, blue, red } from '@material-ui/core/colors';
import SchUserDispatcher from './SchUsersDispatcher';
import { getLocalStorage, setLocalStorage, setLocalStorageItemWithTimeStamp } from '../../modules/localStrageOprations';
import { DispNameWithAttr } from '../Users/Users';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { SchNoticeAndMemoList } from './SchNoticeAndMemoList';
import { SchNoticeAndMemoExplanation } from './SchNoticeAndMemoExplanation';
import { countVisit, getVolume } from './SchTableBody2';
import { FAV_ADDEDIT, FAV_ADDREMOVE, FAV_PASTE, FAV_REMOVE, SchFab } from './SchFab';
import { UserAttrInfo } from '../Users/UserAttrInfo';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { schAutoFill } from './schAutoFill';
import { CenterFocusStrong } from '@material-ui/icons';
import { Button } from '@material-ui/core';
import EventAvailableIcon from '@material-ui/icons/EventAvailable';
import { getUsersTimetable } from '../../modules/getUsersTimetable';
import SchDailyReportSyncer from './SchDailyReportSyncer';
import SchConvUserReserveToAttendButton from '../common/SchConvUserReserveToAttendButton';
import { isServiceEditAllowed } from '../../modules/serviceEditPermission';
import { didPtn } from '../../modules/contants';
import { useAutoScrollToRecentUser } from '../common/useAutoScrollToRecentUser';

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
  convUserReserveToAttendButtonWrap: {
    position: 'fixed', top: 200, right: 16,
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
  userSelectList: {
    width: 180, height:'calc(100vh - 160px)', overflowY:'scroll',
    position: 'fixed', top: 116,
    '& .oneUser': {
      display: 'flex', margin: '4px 4px', padding:'4px 0px', cursor: 'pointer',
      borderBottom: '1px solid #00000000', // 透明のボーダーを初期値にする
      position: 'relative',
      '& .no': {width: 16, textAlign: 'center', fontSize: '.8rem', paddingTop: 4},
      '& .name': {flex: 1, marginLeft: 12,}
    },
    '@media print': {display: 'none'},
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

  }
});

const SoudanSeikyuuExist = ({soudanSeikyuu}) => {
  const classes = useStyles();
  if (!soudanSeikyuu) return null;
  return (
    <div className={classes.soudanSeikyuuExist}>
      {soudanSeikyuu}
    </div>
  )
}

// ユーザーの選択をセレクトではなく柱でやる
export const SideSectionUserSelect = (props)=>{
  const {puid, suid, setSuid, userAttr, setUserAttr, sch, filterUids, allowAnyService} = props;
  const usersOrg = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const schedule = useSelector(s=>s.schedule);
  const classes = useStyles();
  // 相談支援か否か
  const isSoudan = [KEIKAKU_SOUDAN, SYOUGAI_SOUDAN].includes(service);
  // const lcUidKey = 'SideSectionUserSelectUID';

  // サービス内容でユーザーリストを絞り込み
  const users = usersOrg.filter(e=>{
    // サービスチェック
    if (!allowAnyService) {
      if (!service || !albcm.inService(e.service, service)) return false;
    }
    if (allowAnyService) {
      if (service && !albcm.inService(e.service, service)) return false;
    }

    // クラスルームチェック
    if (!albcm.isClassroom(e, classroom)) return false;

    // フィルターUIDチェック
    if (checkValueType(filterUids, "Array") && !filterUids.includes(e.uid)) return false;

    return true;
  });

  // 最近操作したユーザーへの自動スクロール
  useAutoScrollToRecentUser('user-row-');

  useEffect(() => {
    // suidが未指定なら先頭ユーザーに設定
    if (!suid && users[0]){
      setSuid(users[0].uid);
    };
  }, [suid, users]);

  // パラメータuidが指定されていたらnullを返す
  if (puid) return null;

  const usersElm = users.map((e, i)=>{
    // 最近ユーザーのスタイルとカレントユーザーのスタイルを両方取得して
    // カレントユーザースタイルを優先させる
    let st;
    // このユーザーのスケジュールがあるかどうか確認
    const uSch = sch?.['UID' + e.uid] || {};
    const firstDid = Object.keys(uSch).filter(e=>e.match(/^D2\d+/))[0];
    const soudanSeikyuu = (isSoudan && firstDid)
    ? (Object.keys(uSch[firstDid]?.dAddiction || {})).filter(e=>e !== 'モニタリング日').length : 0;
    if (e.uid === suid){
      st = {background: teal[50],borderBottom: '1px solid ' + teal[500]};
    }
    else {
      st = albcm.recentUserStyle(e.uid);
    }
    return (
      <div className='oneUser' id={'user-row-' + e.uid} onClick={()=>setSuid(e.uid)} style={st} key={i}>
        <div className='no'>{i + 1}</div>
        <div className='name'>
          {/* {e.name} */}
          <DispNameWithAttr {...e} userAttr={userAttr} setUserAttr={setUserAttr} />
          <SoudanSeikyuuExist soudanSeikyuu={soudanSeikyuu}/>
        </div>
      </div>
    )
  });

  return(<>
    <div className={classes.userSelectList}>
      {usersElm}
    </div>
  </>)
}

// 2021/09/03 縦型表示を追加してみる
const SevenDaysGrid = (props)=>{
  const classes = useStyles();
  const dateList = useSelector(state=>state.dateList);
  const {
    suid, sch, setSch, dialogOpen, setDialogOpen, setSnack, localFabSch,
    virtical, puid, dispCont, noAbbreviation
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
    if (!did) return;
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
    if (!isServiceEditAllowed(thisSchedule, service)) {
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
    // サービスに応じた期待did（HOHOUはH付き、その他はHなし）
    const baseDid = comMod.convDid(date);
    const expectedDid = service === HOHOU ? baseDid + 'H' : baseDid;
    const hasExpectedDid = !!(sch && sch[expectedDid] && Object.keys(sch[expectedDid] || {}).length);

    // 追加削除、追加修正で期待didが存在しない場合は追加
    if ((fabv === FAV_ADDEDIT || fabv === FAV_ADDREMOVE) && !hasExpectedDid) {
      // 計画支援時間を取得
      const uPlan = getUsersTimetable(allstate, suid, did) ?? {};
      thisSchedule = {...template[service][holidayStr], ...uPlan};
      if (isMTU){
        thisSchedule.classroom = classroom;
      }
      // 新規追加時は適切なdidを生成
      const addDid = getAddDid(date);
      const t = {...sch};
      setSch({...t, [addDid]:thisSchedule, modDid: addDid});
      albcm.setRecentUser(UID);
      setLocalStorageItemWithTimeStamp(bid + UID + addDid, true);

    }
    else if (fabv === FAV_PASTE){
      // 期待didがある場合は上書き、無い場合は追加didを作成して適用
      const pasteDid = hasExpectedDid ? expectedDid : getAddDid(date);
      const newSch = {...template[service][holidayStr]};
      newSch.classroom = classroom;
      const t = {...sch};
      setSch({...t, [pasteDid]: newSch});
      albcm.setRecentUser(UID);
      setLocalStorageItemWithTimeStamp(bid + UID + pasteDid, true);
    }
    // 追加削除モード
    else if (fabv === FAV_ADDREMOVE || fabv === FAV_REMOVE) {
      // 期待didが存在するならそれを削除。存在しないなら追加。
      if (hasExpectedDid){
        const t = {...sch};
        delete t[expectedDid];
        t.deleteDid = expectedDid;
        setSch(t);
        albcm.setRecentUser(UID);
        setLocalStorageItemWithTimeStamp(bid + UID + expectedDid, true);
      }
      else{
        // 期待didが無いので追加
        const uPlan = getUsersTimetable(allstate, suid, did) ?? {};
        thisSchedule = {...template[service][holidayStr], ...uPlan};
        if (isMTU){
          thisSchedule.classroom = classroom;
        }
        const addDid = getAddDid(date);
        const t = {...sch};
        setSch({...t, [addDid]: thisSchedule, modDid: addDid});
        albcm.setRecentUser(UID);
        setLocalStorageItemWithTimeStamp(bid + UID + addDid, true);
      }
    }
    // 追加修正モード
    else if (fabv === FAV_ADDEDIT) {
      if (hasExpectedDid){
        const t = {open: true, did: expectedDid, uid: UID, usch: sch};
        setDialogOpen(t);
        setLocalStorageItemWithTimeStamp(bid + UID + expectedDid, true);
      }
      else{
        // 無ければ追加
        const uPlan = getUsersTimetable(allstate, suid, did) ?? {};
        thisSchedule = {...template[service][holidayStr], ...uPlan};
        if (isMTU){
          thisSchedule.classroom = classroom;
        }
        const addDid = getAddDid(date);
        const t = {...sch};
        setSch({...t, [addDid]: thisSchedule, modDid: addDid});
        albcm.setRecentUser(UID);
        setLocalStorageItemWithTimeStamp(bid + UID + addDid, true);
      }
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
    
    // 既存のdidが見つかった場合
    if (localDids.length > 0) {
      // serviceがHOHOUの場合はH付きを優先
      if (service === HOHOU) {
        const hDid = baseDid + 'H';
        return localDids.includes(hDid) ? hDid : localDids[0];
      }
      // それ以外はHなしを優先
      else {
        return localDids.includes(baseDid) ? baseDid : localDids[0];
      }
    }
    
    // 既存のdidがない場合は、serviceに応じて適切なdidを返す
    const postLetter = (
      service === HOHOU || oneUser.service === HOHOU
    ) ? 'H' : '';
    return baseDid + postLetter;
  };
  
  // 新規追加時のdid生成関数
  const getAddDid = (date) => {
    const baseDid = comMod.convDid(date);
    
    // 同じ日付の既存didを検索（ローカルのschから取得）
    const existingDids = Object.keys(sch || {})
      .filter(did => {
        const baseDate = did.substring(0, 9);
        return baseDate === baseDid && didPtn.test(did);
      });
    
    // 既存のdidがある場合
    if (existingDids.length > 0) {
      // Hなしのdidがある場合はH付きを追加
      if (existingDids.includes(baseDid)) {
        return baseDid + 'H';
      }
      // 既にH付きのdidがある場合はHなしを追加
      if (existingDids.includes(baseDid + 'H')) {
        return baseDid;
      }
    }
    
    // 既存のdidがない場合は、serviceに応じて適切なdidを返す
    return service === HOHOU ? baseDid + 'H' : baseDid;
  };
  
  const OneWeek = (props)=>{
    const week = props.week.map((e, i)=>{
      const cls = ['', 'schoolOff', 'off'];// 学校休日休業日を示すクラスリスト
      const wdClass = (e !== '')? cls[e.holiday]:'';
      // 日付オブジェクトをdid形式に変換（最適化されたdid取得）
      const did = (e !== '') ? getOptimizedDid(e.date, `UID${suid}`) : ''
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
            <EachScheduleContent 
              thisSchedule={thisSchedule} UID={UID} did={did} noAbbreviation={noAbbreviation}
            />
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
      // 日付オブジェクトをdid形式に変換（最適化されたdid取得）
      const did = (e !== '') ? getOptimizedDid(e.date, `UID${suid}`) : '';
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
              thisSchedule={thisSchedule} virtical d={e} did={did} UID={UID} noAbbreviation={noAbbreviation}
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

const CountDisp = (props) => {
  const classes = useStyles();
  const {sch, suid} = props;
  const users = useSelector(state=>state.users);
  const stdDate = useSelector(s => s.stdDate);
  const sService = useSelector(state=>state.service);
  const thisUser = comMod.getUser(suid, users);
  const volume = getVolume(thisUser, sService, stdDate);
  const count = countVisit(sch, thisUser.service, sService);
  const overClass = count.cnt > volume? 'over': '';
  return (
    <div className={classes.countRoot}>
      <div className='comment'>利用+欠等+送迎/支給量</div>
      {/* <div className='s'>利用</div> */}
      <div className='inner'>
        <div className={'count ' + overClass}>{count.cnt}</div>
        <div className='s'>+</div>
        <div className='absence'>{count.other}</div>
        <div className='s'>+</div>
        <div className='n'>{count.transfer}</div>
        <div className='s'>/</div>
        <div className='n'>{volume}</div>
      </div>
    </div>
  )
}


const MainSchByUsers = (props)=>{
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const schedule = useSelector(state => state.schedule);
  const dateList = useSelector(state => state.dateList);
  const scheduleLocked = schedule.locked;
  const serviceItems = useSelector(state => state.serviceItems);
  const stdDate = useSelector(state => state.stdDate);
  // const {suid, setSuid, } = props;
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const account = useSelector(state => state.account);
  const permission = comMod.parsePermission(account)[0][0];
  const [userAttr, setUserAttr] = useState([]); // 医療的ケア、重身、当月で終了などの属性表示チェック用

  const dispatch = useDispatch();
  // ダイアログ制御用
  const [dialogOpen, setDialogOpen] = useState({
    open: false, uid: '', did: '' , usch: {}
  });

  // サービスが未設定なら設定する
  if (!service) {
    dispatch(Actions.changeService(serviceItems[0]));
  }
  // 対象となるユーザーのリスト
  const fusers = albcm.getFilteredUsers(users, service, classroom);
  // パラメータからuidを取得トライ
  const puid = useParams().p;
  // uid をlocal state化
  const [suid, setSuid] = useState(puid? puid: '');
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
  const [noAbbreviation, setNoAbbreviation] = useState(
    comMod.getUisCookie(comMod.uisCookiePos.userSchNoAbbreviation) !== '0'
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

  const susers = users.filter(e=>e.service === service);
  const pUser = comMod.getUser(puid, susers); // パラメータで指定されたユーザー
  const pUserExist = Object.keys(pUser).length;
  // const Uinfo = () => {
  //   const noUserstyle = {paddingTop: 60, textAlign:'center'};
  //   if (!puid){
  //     return null;
  //   }
  //   return(<>
  //     {pUserExist > 1 && <>
  //       <div className={classes.userInfo}>
  //         <div>{pUser.name} 様</div>
  //         <div>{pUser.ageStr}</div>
  //         <div>{pUser.belongs1}</div>
  //       </div>
  //     </>}
      
  //     {pUserExist === 0 && <>
  //       <div style={noUserstyle}>
  //         存在しないユーザーが指定されました。
  //       </div>
  //     </>}
  //   </>)
  // }
  const autoFill = () => {
    const UID = comMod.convUID(suid).str;
    albcm.setRecentUser(UID);
    const newSch = schAutoFill({schedule: sch, dateList, UID, bid, service, classroom});
    setSch(newSch);
  }

  const sdPrms = {
    suid, sch, setSch, dialogOpen, setDialogOpen, setSnack, localFabSch,
    virtical, puid, noAbbreviation
  };
  const occuWrapCalss = puid? classes.occuWrapP: classes.occuWrap;  
  const menuFilter = makeSchMenuFilter(stdDate);
  const displayAutoFill = (() => {
    const currentDate = new Date();
    const [year, month] = stdDate.split('-').map(Number);
    const stdDateObj = new Date(year, month - 1, 10); // 10日を基準にする
    return currentDate < stdDateObj;
  })();
  const noticeAndMemoProps = {schedule, uid: suid, virtical, sch};
  return(<>
    <LinksTab menu={menu} menuFilter={menuFilter} extMenu={extMenu} />
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
      <CountDisp {...sdPrms} />
      <div className={classes.editUserButtonWrap}>
        <EditUserButton uid={suid}/>
      </div>
      <SevenDaysGrid {...sdPrms} />
      <SchFab 
        fabSch={localFabSch} setFabSch={setLocalFabSch} displayAutoFill={displayAutoFill} 
        autoFillClicked={autoFill}
      /> 
      {/* {permission < 100 &&
        <mui.FabSchedule {...favSchProps}/>
      } */}

      <SchEditDetailDialog 
        stateOpen={dialogOpen} setStateOpen={setDialogOpen} setSch={setSch}
      />
      <SchNoticeAndMemoList {...noticeAndMemoProps}/>
      {/* <SchNoticeAndMemoExplanation {...noticeAndMemoProps}/> */}
      <div style={
        // {marginLeft:200, marginTop: 16, textAlign: 'center', }
        {width:'80%', maxWidth: 800, margin:'0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center'}
      }>
        <SetUisCookieChkBox 
          setValue={setVirtical} p={comMod.uisCookiePos.usersSchViewVirtical}
          label='縦型表示にする' style={{margin: 0, padding: 8, width: 400}}
        />
        <SetUisCookieChkBox 
          setValue={setNoAbbreviation} p={comMod.uisCookiePos.userSchNoAbbreviation}
          label='実費項目や加算項目の省略表示を行わない' style={{margin: 0, padding: 8, marginTop: -16, width: 400}}
        />
      </div>
      <div style={{width: 'calc(100% - 200px', marginLeft: 200, marginBottom: 80, "@media print": {display: 'none'}}}>
        <UserAttrInfo userAttr={userAttr} />
      </div>
      <div className={classes.convUserReserveToAttendButtonWrap}>
        <SchConvUserReserveToAttendButton uid={suid} />
      </div>
      {/* <div className={classes.autoFillwrap}>
        <Button
          onClick={autoFill}
          startIcon={<EventAvailableIcon/>}
          variant='outlined'
          color='secondary'
          size="large"
        >
          補完
        </Button>
      </div> */}
    </div>
    <div id={nodeId}></div>
    <SnackMsg {...snack} />
    <SchUserDispatcher croneSch={sch}/>
    <SchInitilizer/>
    <SchDailyReportSyncer />
  </>)
}

const SchByUsers2 = ()=>{
  const allstate = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allstate);
  // ------ 下位モジュールより
  // パラメータからuidを取得トライ
  const puid = useParams().p;
  const normalId = 'nomal-schbyuser2';
  const notNormalId = 'not-nomal-schbyuser2';

  if (loadingStatus.loaded){
    return(<>
      <MainSchByUsers />
      <div id={normalId}></div>
    </>)
  }
  else if (loadingStatus.error){
    return (<>
      <LoadErr loadStatus={loadingStatus} errorId={'E4941'} />
      <div id={notNormalId}></div>
    </>)
  }
  else{
    return(<>
     <LoadingSpinner/>
     <div id={notNormalId}></div>
    </>)
  }
}
export default SchByUsers2;