import React, { useEffect, useState } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Dialog from '@material-ui/core/Dialog';
import AddBoxIcon from '@material-ui/icons/AddBox';
import IndeterminateCheckBoxIcon from '@material-ui/icons/IndeterminateCheckBox';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import * as comMod from '../../commonModule'
import * as albcm from '../../albCommonModule'
import { useDispatch, useSelector } from 'react-redux';
import { setUseResult } from '../../Actions';
import * as Actions from '../../Actions';
import * as mui from '../common/materialUi'
import * as afp from '../common/AddictionFormParts'; 
import CancelIcon from '@material-ui/icons/Cancel';
import PersonIcon from '@material-ui/icons/Person';
import Button from '@material-ui/core/Button';
import Avatar from '@material-ui/core/Avatar';
import AddIcon from '@material-ui/icons/Add';
import Typography from '@material-ui/core/Typography';
import { blue } from '@material-ui/core/colors';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import DialogTitle from '@material-ui/core/DialogTitle';
import SchByDateStartEndInput from './SchByDateStartEndInput';
import { useLocation } from 'react-router-dom';
import teal from '@material-ui/core/colors/teal';
import CheckIcon from '@material-ui/icons/Check';
import ScheduleIcon from '@material-ui/icons/Schedule';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSleigh, faYenSign } from "@fortawesome/free-solid-svg-icons";
import { useStyles } from '../common/FormPartsCommon';
import SnackMsg from '../common/SnackMsg';
import { faLess } from '@fortawesome/free-brands-svg-icons';
import { DAYSETTING_ADDICTION, DAYSETTING_MENU } from './SchDaySettingNoDialog';
import DateSelectionInMonth from './DateSelectionInMonth';
// import Checkbox from '@material-ui/core/Checkbox';
// import FormControlLabel from '@material-ui/core/FormControlLabel';
// import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
// import CloseIcon from '@material-ui/icons/Close';
// import { grey } from '@material-ui/core/colors';


const useStyle = makeStyles((theme) => ({
  root: {
    ' & .MuiDialog-paperWidthSm': {
      maxWidth:'initial'
    }
  },
  dAddictionForm: {
    display: 'flex', flexWrap: 'wrap', maxWidth: 800, padding: '8px 16px',
  }
}));

const useLocalStyles = makeStyles({
  faIcon:{
    padding: 0, fontSize: 22, 
    width: 24, textAlign: 'center', display: 'inline-block',
    color:teal[500],
  },
  listItem: {
    '& .MuiSvgIcon-root': {
      color: teal[500],
    }
  },
  hidden: {
    // opacity: 0,
    backgroundColor: 'transparent',
    position: 'absolute',
    height: 120,
    width: '14%',
    cursor:'pointer',
  },

});

// scheduleの実績、useResultを変更するdispatchをコールする
// bulk = 0 その日だけ
// bulk = -1 以前を含む
// bulk = 1 以降を含む
// 2021/11/12 classroom追加 --> 明日やる
const callDispatch = (
    prms, value, selectors ,bulk, classroom, setRes, setSnack
)=>{
  const {date, schedule, users, service, dispatch} = prms;
  const { dateList, hid, bid, stdDate } = selectors;
  const d = comMod.convDid(date); // 日付けKey値 dyyyyymmdd形式
  // 対象となるユーザーUIDxxx形式の配列
  const tUsers = users.filter(e=>e.service===service).map(e=>{
    if (!classroom || e.classroom === classroom){
      return 'UID' + e.uid;
    }
    else return false;
  }).filter(e=>e);

  const targetList = [];
  Object.keys(schedule).forEach(e =>{
    // scheduleのキーでuidを探す
    if (e.indexOf('UID') !== 0){
      return false;
    }
    // uidからサービスを特定。現在ののサービスと一致しているものを探す
    // tUsersで絞り込むため不要 --> 2021/11/13変更
    // if (comMod.getUser(e, users).service !== service){
    //   return false;
    // }
    
    // classroomとserviceで切り分けされた配列で該当ユーザーかどうかをチェック
    if (tUsers.indexOf(e) < 0)  return false;
    // schedule.uidから更に掘って該当するスケジュールオブジェクトを特定する
    // 一括変更のオプションも読んでそのとおりに変更リストを追加する
    Object.keys(schedule[e]).forEach(f=>{
      if (f === d)  targetList.push({UID:e, did: f});
      if (f < d && bulk === -1) targetList.push({ UID: e, did: f });
      if (f > d && bulk === 1) targetList.push({ UID: e, did: f });
    });
  });
  // --> 遅延書き込みはしない 2021/11/13
  // comMod.setSchedleLastUpdate(dispatch, path);

  // 部分送信
  const partOfSch = {};
  tUsers.map(e=>{partOfSch[e] = schedule[e];});
  const sendPrms = {hid, bid, date:stdDate, partOfSch}
  albcm.sendPartOfSchedule(sendPrms, setRes, setSnack);

  targetList.map(e=>{
    dispatch(setUseResult(e.UID, e.did, value))
  });
};

// ダイアログを消す前にメニューリストが一瞬表示されてしまうのを防ぐ
const hideMenuList = ()=>{
  const target = document.querySelector('.schDialog');
  target.style.cssText = 'opacity:0;';
}

const MenuList = (props) => {
  const localCls = useLocalStyles();
  const classroom = useSelector(state=>state.classroom);
  const clickHandler = (n) => {
    props.setcontentNdx(n);
  }
  return (
    <>
      <List className="daialogMenuList">
        <ListItem button className={'listItem ' + localCls.listItem}
          onClick={() => clickHandler(1)}
          key={2}
        >
          {/* <CheckIcon color={teal[500]} /> */}
          <CheckIcon  />
          <span className='text'>日時実績設定</span>
        </ListItem>
        {/* 2022/01/15 単位指定時は日時加算項目を表示しない */}
        {classroom === '' &&
          <ListItem button className={'listItem ' + localCls.listItem}
            onClick={() => clickHandler(2)}
            key={3}
          >
            {/* <AddBoxIcon color={teal[500]} /> */}
            <span className={localCls.faIcon} >
              <FontAwesomeIcon icon={faYenSign} />
            </span>

            <span className='text'>日時加算項目</span>
          </ListItem>
        }
        {/* 2022/01/16 ロック済みの予定は編集不可 */}
        {props.dayLocked === false &&
          <ListItem button className={'listItem ' + localCls.listItem}
            onClick={() => clickHandler(3)}
            key={4}
          >
            {/* <ScheduleIcon color={teal[500]} /> */}
            <ScheduleIcon />
            <span className='text'>開始終了時刻一括入力</span>
          </ListItem>
      
        }
      </List>
    </>
  )
}


// 利用実績の付加と削除
const UseResultControle = (props)=>{
  const dateList = useSelector(state => state.dateList);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const selectors = {dateList, hid, bid, stdDate}
  const path = useLocation().pathname;
  const {prms, classroom} = props;
  const [res, setRes] = useState({});
  const setSnack = props.setSnack;
  const {date, schedule, setSchedule, users, service, dispatch} = prms;
 
  const handleClick = (value, bulk = 0) => {
    const d = comMod.convDid(date); // 日付けKey値 dyyyyymmdd形式
      // 対象となるユーザーUIDxxx形式の配列
    const tUsers = users
    .filter(e=>e.service===service)
    .filter(e=>albcm.isClassroom(e, classroom))
    .map(e=>'UID' + e.uid);
    // .map(e=>{
    //   if (!classroom || e.classroom === classroom){
    //     return 'UID' + e.uid;
    //   }
    //   else return false;
    // }).filter(e=>e);

    const targetList = [];
    Object.keys(schedule).forEach(e =>{
      // scheduleのキーでuidを探す
      if (e.indexOf('UID') !== 0){
        return false;
      }
      
      // classroomとserviceで切り分けされた配列で該当ユーザーかどうかをチェック
      if (tUsers.indexOf(e) < 0)  return false;
      // schedule.uidから更に掘って該当するスケジュールオブジェクトを特定する
      // 一括変更のオプションも読んでそのとおりに変更リストを追加する
      Object.keys(schedule[e]).filter(f=>f.match(/^D[0-9]+/)).forEach(f=>{
        const o = schedule[e][f];
        if (o.classroom && classroom && classroom !== o.classroom) return false;
        if (f === d)  targetList.push({UID:e, did: f});
        if (f < d && bulk === -1) targetList.push({ UID: e, did: f });
        if (f > d && bulk === 1) targetList.push({ UID: e, did: f });
      });
    });
    // --> 遅延書き込みはしない 2021/11/13
    // comMod.setSchedleLastUpdate(dispatch, path);

    // 部分送信
    const partOfSch = {};
    tUsers.map(e=>{partOfSch[e] = {...schedule[e]}});
    targetList.map(e=>{
      partOfSch[e.UID][e.did].useResult = value;
    });
    const sendPrms = {hid, bid, date:stdDate, partOfSch}
    albcm.sendPartOfSchedule(sendPrms, setRes, setSnack);
    // ローカルのスケジュールに値セット
    setSchedule({...schedule, ...partOfSch});
    setTimeout(()=>{
      props.closehandler();
    }, [300]);
  };
  useEffect(()=>{
    console.log('UseResultControle res', res);
  },[res]);

  return(<>
    <List>
      <ListItem button className='listItem'
        // 実績のセット
        onClick={() => handleClick(true)} key='1'
      >
        <AddBoxIcon color='primary' />
        <span className='text'>実績にする</span>
      </ListItem>

      <ListItem button className='listItem'
        // 実績のセット
        onClick={() => handleClick(true, -1)} key='2'
      >
        <AddBoxIcon color='primary' />
        <span className='text'>この日まで実績</span>
      </ListItem>
      <ListItem button className='listItem'
        // 実績の取り消し
        onClick={() => handleClick(false)} key='3'
      >
        <IndeterminateCheckBoxIcon color='primary' />
        <span className='text'>実績を取り消す</span>
      </ListItem>
      <ListItem button className='listItem'
        // 実績の取り消し
        onClick={() => handleClick(false, 1)} key='4'
      >
        <IndeterminateCheckBoxIcon color='primary' />
        <span className='text'>この日より取り消す</span>
      </ListItem>
    </List>
  </>)
}



// 日毎の加算を行う
export const DairyAddiction = (props) =>{
  const {date, schedule, setSchedule, mode, chMode, setSnack} = props;
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const sService = useSelector(state => state.service);
  const dateList = useSelector(state => state.dateList);
  const account = useSelector(state => state.account);
  const classroom = useSelector(state => state.classroom);
  // service取得方法変更 単一サービスでstateのserviceが''で与えられることがある
  // SchDailyDialogではusersが利用可能だが、特定のユーザーのserviceを取得するのは適切でないため
  // 空文字列の場合はserviceItemsから取得
  const serviceItems = useSelector(state => state.serviceItems);
  const service = sService || (serviceItems.length > 0 ? serviceItems[0] : '');
  const permission = comMod.parsePermission(account)[0][0];
  const classes = useStyle()
  const did = (typeof date === 'object')
  ? 'D' + comMod.formatDate(date, 'YYYYMMDD')
  : 'D' + date.replace(/[^0-9]/g, '');
  
  // 選択された日付の状態管理
  const [selectedDates, setSelectedDates] = useState([]);

  const handleSubmit = (e) => {
    // 日毎の加算項目をdispatchする
    e.preventDefault();
    // 値が必要なエレメントを用意しておく
    const inputs = document.querySelectorAll('#e56fgth7 input');
    const selects = document.querySelectorAll('#e56fgth7 select');

    // フォームから値を取得
    const formsVal = comMod.getFormDatas([inputs, selects]);
    // スケジュールの該当部分
    const t = {...schedule};
    t[service] = t[service]? t[service]: {};
    
    // t[service][did]が配列の場合はオブジェクトに変換
    if (Array.isArray(t[service][did])) {
      t[service][did] = {};
    } else {
      t[service][did] = t[service][did]? t[service][did]:{};
    }
    
    // 日付設定の共通処理
    const applyFormDataToDate = (targetDid) => {
      if (!t[service][targetDid]) t[service][targetDid] = {};

      if (classroom && stdDate >= '2025-07-01') {
        // 教室（classroom）単位の更新
        if (Object.keys(formsVal).length === 0) {
          // 空の場合は教室データを削除
          delete t[service][targetDid][classroom];
        } else {
          // 値がある場合は教室データを設定（直上のデータや他の教室データは維持される）
          t[service][targetDid][classroom] = { ...formsVal };
        }
      } else {
        // did直下の更新（classroom指定なし、または古い日付）
        if (Object.keys(formsVal).length === 0) {
          // 空の場合はdid直下のデータを削除（教室データは維持）
          Object.keys(t[service][targetDid]).forEach(key => {
            if (typeof t[service][targetDid][key] !== 'object' || t[service][targetDid][key] === null || Array.isArray(t[service][targetDid][key])) {
              delete t[service][targetDid][key];
            }
          });
        } else {
          // 値がある場合は設定（既存の教室データは維持し、直下のデータのみ上書き）
          const classrooms = {};
          Object.keys(t[service][targetDid]).forEach(key => {
            if (typeof t[service][targetDid][key] === 'object' && t[service][targetDid][key] !== null && !Array.isArray(t[service][targetDid][key])) {
              classrooms[key] = t[service][targetDid][key];
            }
          });
          t[service][targetDid] = { ...formsVal, ...classrooms };
        }
      }

      // didオブジェクトが空になったら削除
      if (t[service][targetDid] && Object.keys(t[service][targetDid]).length === 0) {
        delete t[service][targetDid];
      }
    };
    
    // 現在日付の設定
    applyFormDataToDate(did);
        
    // 選択された日付にも同じ設定を適用
    selectedDates.forEach((selectedDate) => {
      // ISO文字列から日付部分を抽出してDYYYYMMDD形式に変換
      const dateOnly = selectedDate.split('T')[0];
      const selectedDid = 'D' + dateOnly.replace(/-/g, '');
      
      // t[service][selectedDid]が配列の場合はオブジェクトに変換
      if (Array.isArray(t[service][selectedDid])) {
        t[service][selectedDid] = {};
      } else {
        t[service][selectedDid] = t[service][selectedDid] || {};
      }
      
      // 選択された日付の設定
      applyFormDataToDate(selectedDid);
    });
    // dispatch(Actions.setStore({schedule: t}));
    // ローカルstateの更新
    setSchedule({...schedule, ...t});
    const partOfSch = {[service]: t[service]};
    // 差分の送信
    const sendPrms = {hid, bid, date: stdDate, partOfSch};
    albcm.sendPartOfSchedule(sendPrms, setSnack);
    if (typeof props.close === 'function'){
      setTimeout(() => {props.close()}, 300);
    }
    if (typeof chMode === 'function'){
      chMode(DAYSETTING_MENU);
    }

  }
  const cancelSubmit = ()=>{
    if (typeof props.close === 'function'){
      setTimeout(() => {props.close()}, 300);
    }
    if (typeof chMode === 'function'){
      chMode(DAYSETTING_MENU);
    }
  }
  // // 設定済み項目チェック
  // const comAdic = useSelector(state=>state.com.addiction);
  // const makedisabled = (obj, path) =>{
  //   const v = comMod.findDeepPath(obj, path);
  //   if (parseInt(v) === -1)  return -1;
  //   else return v;
  // }
  if (mode && mode[0] !== DAYSETTING_ADDICTION) return null;
  
  return(<>
    <form id='e56fgth7' className={"addiction " + classes.dAddictionForm}>
      <afp.JiShidouKaHai1 did={did} size='middleL' dLayer={2} schedule={schedule} />
      <afp.SenmonTaisei did={did} size='middleL' dLayer={2} schedule={schedule} />
      <afp.FukushiSenmonHaichi did={did} size='middleL' dLayer={2} schedule={schedule} />
      <afp.TeiinChouka did={did} size='middleL' dLayer={2} schedule={schedule} />
      <afp.SenmonShien did={did} size='middleL' dLayer={2} schedule={schedule} />
      <afp.EiyoushiHaichi did={did} size='middleL' dLayer={2} schedule={schedule} />
      <afp.ShokuinKetujo did={did} size='middleL' dLayer={2} schedule={schedule} />
      <afp.KaisyoGensan did={did} size='middleL' dLayer={2} schedule={schedule} />
      <afp.KobetsuSuport1Settei did={did} size='middleL' dLayer={2} schedule={schedule} />
      <afp.KyoudokoudouDisable did={did} size='middleL' dLayer={2} schedule={schedule} />
      {/* <afp.KangoKahai did={did} size='middle' dLayer={2} schedule={schedule} /> */}

    </form>
    
    <div style={{ 
      display: 'flex',justifyContent: 'center',alignItems: 'center',
      padding: '16px', 
    }}>
      <DateSelectionInMonth 
        date={date}
        dateList={dateList}
        selectedDates={selectedDates}
        onDateSelection={setSelectedDates}
      />
    </div>
    <div className='buttonWrapper'>
      <mui.ButtonGP
        color='secondary'
        label='キャンセル'
        onClick={cancelSubmit}
      />
      <mui.ButtonGP
        color='primary'
        label='書き込み'
        type="submit"
        onClick={handleSubmit}
      />
    </div>
  </>)

}

const SchDialog = (props) => {
  // props.prms = [date, schedule, users, service, dispatch];
  // bulk = 0 その日だけ
  // bulk = -1 以前を含む
  // bulk = 1 以降を含む
  const [contentNdx, setcontentNdx] = useState(0);
  const {schedule, setSchedule, users, service} = props.prms;
  const {date, setSnack} = props;
  const classroom = useSelector(s=>s.classroom);
  const dateList = useSelector(state => state.dateList);
  const classes = useStyle();
  const dispatch = useDispatch();
  const closehandler = () => {
    setcontentNdx(0);
    hideMenuList();
    props.closeThis();
  }
  const titles = [
    '日時設定メニュー',
    '日時利用実績設定',
    '日時加算設定',
    '開始終了時刻一括入力',
  ]
  // 該当日がロックされているかどうかを確認するためにスケジュール情報を取得
  const schCounts = comMod.getScheduleInfo(schedule, service, users, classroom);
  const did = comMod.convDid(date);
  const didCounts = schCounts.didCounts;
  const dayLockedf = () =>{
    const c = didCounts[did];
    const n = c? c.schoolOffCnt + c.weekDayCnt: null;
    const r = c? c.useResultCnt: null;
    return (r && r === n)? true: false;
  }
  const dayLocked = dayLockedf();


  // useEffect(()=>{
  //   return (()=>{
  //     console.log('SchDialog unmounted.');
  //     dispatch(Actions.setStore({schedule}));
  //   });
  // }, [schedule]);

  return (
    <Dialog 
      onClose={closehandler} 
      open={props.open}
      className={'schDialog ' + classes.root}
      // closehandler={()=>closehandler()}
    >
      <div className='dialogTitle'>
        {titles[contentNdx]}
      </div>
      <div className="date">
        {(!props.date)? '':comMod.formatDate(props.date, 'MM月DD日')}
      </div>
      {contentNdx === 0 && <>
        <MenuList 
          {...props} setcontentNdx={setcontentNdx} dayLocked={dayLocked} 
        />
        <div className="buttonWrapper center" >
          <mui.ButtonCancel size='small' onClick={() => closehandler()} />
        </div>
      </>}
      {contentNdx === 1 && <>
        <UseResultControle 
          prms={props.prms} classroom={classroom} closehandler={()=>closehandler()}
          setSnack={setSnack}
        />
        <div className="buttonWrapper center" >
          <mui.ButtonCancel size='small' onClick={() => closehandler()} />
        </div>

      </>}
      {contentNdx === 2 && <>
        <DairyAddiction prms={props.prms} closehandler={()=>closehandler()} />
      </>}
      {contentNdx === 3 && <>
        <SchByDateStartEndInput 
          date={props.date} 
          schedule={schedule} setSchedule={setSchedule} setSnack={setSnack}
          close={()=>closehandler()} 
        />
      </>}
    </Dialog>

  );
}

// propsからopenさせるタイプ
export const SchDailyDialogPropsOpen = (props) => {
  const dispatch = useDispatch();
  const classes = useLocalStyles();
  // ここでのスケジュールは上位モジュールで設定されたローカルstate
  const {dialogDate, dialogOpen, setDialogOpen, schedule, setSchedule} = props;
  const date = dialogDate;
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const prms = {date, schedule, users, service, dispatch, setSchedule};
  const [snack, setSnack] = useState({msg:'', severity: ''});
  // const closeThis = () => {
  //   setDialogOpen(false);
  // }
  const closehandler = () => {
    setDialogOpen(false);
    schedule.timestamp = new Date().getTime();
    dispatch(Actions.setStore({schedule}));
  }
  return (<>
    <SchDialog 
      open={dialogOpen}
      setOpen={setDialogOpen}
      // closeThis={()=>setDialogOpen(false)}
      closeThis={closehandler}
      // const [date, schedule, users, service, dispatch] = prms;
      prms={prms}  
      date={date}
      setSnack={setSnack}
      // pos={pos}
    />
    <SnackMsg {...snack} />
  </>)

}
