import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { convUID, formatDate, getFormDatas, getLodingStatus, randomStr } from "../../commonModule";
import { LinksTab, LoadingSpinner } from "../common/commonParts";
import SnackMsg from "../common/SnackMsg";
import { KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import { recentUserStyle, sendPartOfSchedule, setRecentUser, univApiCall } from '../../albCommonModule';
import { sendErrorLog } from "../common/HashimotoComponents";
import { DispNameWithAttr } from "../Users/Users";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Fab, makeStyles } from "@material-ui/core";
import { blue, grey, red, teal } from "@material-ui/core/colors";
import { makeSchMenuFilter, soudanMenu } from "./Sch2";
import { checkValueType } from "../dailyReport/DailyReportCommon";
import EditIcon from '@material-ui/icons/Edit';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import { MonitorDate, UnivAddictionSoudan } from "../common/SoudanAddictionFormParts";
import { setStore } from "../../Actions";
import { ActualCostCheckBox } from '../common/StdFormParts';
import { FreeActualCost } from './SchEditDetailDialog';
import AddIcon from '@material-ui/icons/Add';

// APIコール最大回数
const MAX_RETRY = 5;
const BASICKASAN_LIST = ["サービス利用支援", "継続サービス利用支援"];

const fetchSchedule = async(hid, bid, stdDate) => {
  const params = {
    "a": "fetchSchedule",
    hid, bid, date: stdDate
  };
  for(let retry=0; retry<MAX_RETRY; retry++){
    try{
      const res = await univApiCall(params);
      if(!res?.data?.result){
        if(retry+1 < MAX_RETRY) continue;
        // 送信失敗
        const error = new Error("fetchContactsError");
        error.details = {apiParams: params, apiRes: res};
        throw error;
      }
      return res?.data?.dt?.[0]?.schedule ?? {};
    }catch(error){
      if(retry+1 < MAX_RETRY) continue;
      const errorCode = randomStr(8);
      sendErrorLog(hid, bid, `SCM${errorCode}`, error);
      throw error;
    }
  }
}

const sendUsersExt = async(hid, bid, uid, ext) => {
  const params = {
    "a": "sendUsersExt",
    hid, bid, uid, ext: JSON.stringify(ext)
  };
  for(let retry=0; retry<MAX_RETRY; retry++){
    try{
      const res = await univApiCall(params);
      if(!res?.data?.result){
        if(retry+1 < MAX_RETRY) continue;
        // 送信失敗
        const error = new Error("sendUsersExtError");
        error.details = {apiParams: params, apiRes: res};
        throw error;
      }
      return true;
    }catch(error){
      if(retry+1 < MAX_RETRY) continue;
      const errorCode = randomStr(8);
      sendErrorLog(hid, bid, `SUE${errorCode}`, error);
      throw error;
    }
  }
}

const getCycleStdDateList = (stdDate) => {
  const [stdYear, stdMonth] = stdDate.split("-");
  const stdDateList = Array(13).fill(null).map((_, i) => {
    const dateObj = new Date(parseInt(stdYear), (parseInt(stdMonth)-1)+(i-6), 1);
    return formatDate(dateObj, 'YYYY-MM-DD');
  })
  return stdDateList;
}


const checkBasicServiceProvision = (schDt) => {
  if(!checkValueType(schDt, 'Object')) return false;
  const dAddiction = schDt.dAddiction ?? {};
  return Object.keys(dAddiction).some(key => BASICKASAN_LIST.includes(key));
}

const getLastBasicServiceProvisionStdDate = (user, scheduleList, stdDateList) => {
  const uid = user.uid;
  const basicServiceProvisionStdDateList = stdDateList.filter((prevStdDate, i) => {
    const [prevStdYear, prevStdMonth] = prevStdDate.split("-");
    const schDt = scheduleList?.[i]?.["UID"+uid]?.[`D${prevStdYear}${prevStdMonth}01`];
    return checkBasicServiceProvision(schDt);
  });
  return basicServiceProvisionStdDateList.at(-1);
}

const ScheduleListContext = createContext([]);
const ModeContext = createContext("");
const DialogContext = createContext({});
const SnackContext = createContext({});

const useStyles = makeStyles({
  AppPage: {
    minWidth: 1080,
    paddingLeft: 61.25,
    margin: '83px 0',
  },
  CycleSchedule: {
    '& .row': {
      display: 'flex',
      borderBottom: '1px solid #ddd',
      '& .no': {
        minWidth: 48, maxWidth: 48,
        textAlign: 'center', padding: '8px 4px',
        backgroundColor: '#fff',
        borderLeft: '4px solid transparent'
      },
      '& .user': {
        minWidth: 160, maxWidth: 160,
        padding: 8,
        backgroundColor: '#fff'
      },
      '& .cell': {
        position: 'relative',
        flex: 1,
        minWidth: 64,
        padding: 8,
        textAlign: 'center',
        '&:nth-child(even)': {backgroundColor: '#fff'},
        '&:nth-child(odd)': {backgroundColor: grey[100]},
        '&.delete:hover': {
          backgroundColor: `${red[50]} !important`,
          cursor: 'pointer'
        },
        '&.addAndEdit:hover': {
          backgroundColor: `${teal[50]} !important`,
          cursor: 'pointer'
        },
        '& .disabledCover': {
          position: 'absolute', top: 0, right: 0,
          width: '100%', height: '100%',
          backgroundColor: grey[500],
          opacity: 0.5
        }
      }
    },
    '& .header': {
      borderColor: teal[800],
      position: 'sticky', top: 83,
      zIndex: 2,
      '& .cell': {
        borderTop: '4px solid transparent',
        '&.hovered': {
          borderColor: teal[300]
        }
      }
    },
    '& .body': {
      '& .row': {
        '&:hover .no': {
          borderColor: teal[300]
        }
      }
    }
  },
  Buttons: {
    position: 'fixed', bottom: 20, right: 20,
    '& .extendedIcon': {marginRight: 8},
    '& .button': {
      backgroundColor: '#888', color: '#eee',
      '&:not(:last-child)': {marginRight: 20},
      '&.clicked': {
        color: '#fff',
      },
      '&.clicked.addAndEdit': {backgroundColor: teal[800]},
      '&.clicked.addAndEditPlan': {backgroundColor: blue[700]},
      '&.clicked.delete': {backgroundColor: red[800]},
    },
  },
  AddAndEditDialog: {
    '& .dialogTitle': {
      textAlign: 'center', padding: '8px 0',
      '& .title': {fontSize: 16},
      '& .userInfo': {
        fontSize: '0.9rem',
        '& .name': {fontSize: '1.2rem', color: teal[800], marginInlineEnd: 8},
        '& .ageStr': {marginInlineStart: 16}
      }
    }
  }
});

const CycleScheduleHeader = (props) => {
  const stdDate = useSelector(state => state.stdDate);
  const stdDateList = getCycleStdDateList(stdDate);
  const {mode} = useContext(ModeContext);
  const {hoveredStdDate} = props;
  const cells = stdDateList.map((prevStdDate, i) => {
    const [prevStdYear, prevStdMonth] = prevStdDate.split("-");
    let disabled = false;
    if(mode==="addAndEdit" && prevStdDate!==stdDate) disabled = true;
    if(mode==="addAndEditPlan" && prevStdDate <= stdDate) disabled = true;
    if(mode==="delete" && prevStdDate < stdDate) disabled = true;
    return(
      <div
        className={`cell ${hoveredStdDate===prevStdDate ?"hovered" :""}`}
        key={`CycleScheduleHeaderCell${i}`}
      >
        <span style={{marginRight: 2}}>{prevStdYear.slice(-2)}</span>
        <span>{prevStdMonth}</span>
        {disabled &&<div className="disabledCover" />}
      </div>
    )
  })
  return(
    <div className="header">
      <div className="row">
        <div className="no">no</div>
        <div className="user">利用者名</div>
        {cells}
      </div>
    </div>
  )
}

const ScheduleCell = (props) => {
  const stdDate = useSelector(state => state.stdDate);
  const users = useSelector(state => state.users);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const {mode} = useContext(ModeContext);
  const {setDialogOpen, setDialogParams} = useContext(DialogContext);
  const {setSnack} = useContext(SnackContext);
  const {setScheduleList} = useContext(ScheduleListContext);
  const {schDt, thisStdDate, stdDateIndex, isEstMonitoring, uid, setHoveredStdDate, planDt, setUsersPlan} = props;
  const plan = checkValueType(planDt?.[thisStdDate], 'Object') ?planDt?.[thisStdDate] :null;
  const user = users.find(prevUser => prevUser.uid === uid);
  const dAddiction = checkValueType(schDt?.dAddiction, 'Object') ?schDt.dAddiction :{};
  const monitoringDate = dAddiction["モニタリング日"];
  const handleClick = async() => {
    if(mode === "addAndEditPlan"){
      if(thisStdDate <= stdDate) return;
      const newPlan = {...plan};
      if(!checkValueType(plan?.type, 'String') && isEstMonitoring){
        newPlan.type = "otherItem";
      }else if(!plan?.type){
        newPlan.type = "baseItem";
      }else if(plan?.type === "baseItem"){
        newPlan.type = "otherItem";
      }else if(plan?.type === "otherItem"){
        newPlan.type = "monitoringDate";
      }else if(plan?.type === "monitoringDate"){
        newPlan.type = "";
      }
      const userExt = user?.ext ?? {};
      userExt.soudanShienForecast = {...planDt, [thisStdDate]: newPlan};
      const resResult = await sendUsersExt(hid, bid, uid, userExt);
      if(resResult){
        setUsersPlan(prevUsersPlan => {
          const newUsersPlan = JSON.parse(JSON.stringify(prevUsersPlan));
          newUsersPlan["UID"+uid][thisStdDate] = newPlan;
          return newUsersPlan;
        });
      }else{
        setSnack({msg: "計画の更新に失敗しました。", severity: "warning", id: new Date().getTime()});
      }
      return;
    }
    if(mode === "addAndEdit"){
      if(thisStdDate !== stdDate) return;
      // 追加・編集用
      // 編集用ダイアログを開く
      setDialogParams({uid, thisStdDate, stdDateIndex});
      setRecentUser(uid);
      await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5秒待つ
      setDialogOpen(true);
      return;
    }
    if(mode === "delete"){
      // 削除用
      if(thisStdDate === stdDate){
        // 予定を削除
        if(!isEstMonitoring && !schDt) return;
        if(schDt && !monitoringDate) return;
        const [thisStdYaer, thisStdMonth] = thisStdDate.split("-");
        const did = `D${thisStdYaer}${thisStdMonth}01`;
        const partOfSch = {[convUID(uid).str]: {[did]: {dAddiction: {}}}};
        await sendPartOfSchedule({hid, bid, date: thisStdDate, partOfSch});
        setScheduleList(prevScheduleList => {
          prevScheduleList[stdDateIndex] = {...prevScheduleList[stdDateIndex], ...partOfSch};
          return [...prevScheduleList];
        });
        setSnack({msg: `${user.name}さんの利用を削除しました。`, severity: 'primary', id: new Date().getTime()});
        setRecentUser(uid);
        return;
      }
      if(thisStdDate > stdDate){
        // 計画を削除
        setUsersPlan(prevUsersPlan => {
          const newUsersPlan = JSON.parse(JSON.stringify(prevUsersPlan));
          if(!newUsersPlan["UID"+user.uid]) newUsersPlan["UID"+user.uid] = {};
          if(!newUsersPlan["UID"+user.uid]) newUsersPlan["UID"+user.uid] = {};
          newUsersPlan["UID"+user.uid][thisStdDate] = {type: ""};
          return newUsersPlan;
        });
      }
      return;
    }
  }
  // 基本サービスが加算されている予定か？
  const isBasic = checkBasicServiceProvision(schDt);
  // モニタリング日以外の加算がない予定か？
  const isNoAddiction = Object.keys(dAddiction).filter(key => key !== "モニタリング日").length === 0;
  let disabled = false;
  let modeClassName = "";
  if(mode==="addAndEdit"){
    if(thisStdDate===stdDate) modeClassName = "addAndEdit";
    if(thisStdDate!==stdDate) disabled = true;
  }
  if(mode==="addAndEditPlan"){
    if(thisStdDate > stdDate) modeClassName = "addAndEdit";
    if(thisStdDate <= stdDate) disabled = true;
  }
  if(mode==="delete"){
    if(thisStdDate >= stdDate) modeClassName = "delete";
    if(thisStdDate < stdDate) disabled = true;
  }
  return(
    <div
      className={`cell ${disabled ?"disabled" :""} ${modeClassName}`}
      onClick={handleClick}
      onMouseEnter={() => setHoveredStdDate(thisStdDate)}
      onMouseLeave={() => setHoveredStdDate(null)}
    >
      {(Boolean(monitoringDate) && isBasic && !isNoAddiction) &&(<span style={{color: teal[600]}}>●</span>)}
      {(Boolean(monitoringDate) && !isBasic && !isNoAddiction) &&(<span style={{color: blue[600]}}>▲</span>)}
      {(Boolean(monitoringDate) && isNoAddiction) &&(<span style={{color: grey[600]}}>▼</span>)}
      {Boolean(monitoringDate) &&(<span>{monitoringDate}</span>)}
      {(isEstMonitoring && !Boolean(schDt) && !checkValueType(plan?.type, 'String')) &&(<span style={{color: teal[600]}}>◯</span>)}
      {(!Boolean(monitoringDate) && plan?.type==="baseItem") &&<span style={{color: teal[600]}}>◯</span>}
      {(!Boolean(monitoringDate) && plan?.type==="otherItem") &&<span style={{color: blue[600]}}>△</span>}
      {(!Boolean(monitoringDate) && plan?.type==="monitoringDate") &&<span style={{color: grey[600]}}>▽</span>}
      {disabled &&<div className="disabledCover" />}
    </div>
  )
}

const UserScheduleRow = (props) => {
  const stdDate = useSelector(state => state.stdDate);
  const {scheduleList} = useContext(ScheduleListContext);
  const {mode} = useContext(ModeContext);
  const {user, no, setHoveredStdDate, planDt, setUsersPlan} = props;
  const stdDateList = getCycleStdDateList(stdDate);
  const lastBasicStdDate = getLastBasicServiceProvisionStdDate(user, scheduleList, stdDateList);
  const lastIndex = stdDateList.findIndex(prevStdDate => prevStdDate === lastBasicStdDate);

  const cells = stdDateList.map((prevStdDate, i) => {
    const [prevStdYear, prevStdMonth] = prevStdDate.split("-");
    const uid = user.uid;
    const schDt = scheduleList?.[i]?.["UID"+uid]?.[`D${prevStdYear}${prevStdMonth}01`];
    return(
      <ScheduleCell
        uid={user.uid}
        schDt={schDt}
        thisStdDate={prevStdDate} stdDateIndex={i}
        isEstMonitoring={lastIndex+1>0 && (lastIndex+6===i || lastIndex+12===i)}
        setHoveredStdDate={setHoveredStdDate}
        planDt={planDt} setUsersPlan={setUsersPlan}
      />
    )
  })
  const ruSt = recentUserStyle(user.uid);
  return(
    <div className="row">
      <div className={`no ${mode ?"hover" :""}`} style={ruSt}>{no}</div>
      <div className="user"><DispNameWithAttr {...user} /></div>
      {cells}
    </div>
  )
}

const CycleSchedule = () => {
  const users = useSelector(state => state.users);
  const classes = useStyles();
  const [hoveredStdDate, setHoveredStdDate] = useState(null);
  const initUsersPlan = users.reduce((prevUsersPlan, user) => {
    if(!user.uid) return prevUsersPlan;
    const uidStr = "UID" + user.uid;
    prevUsersPlan[uidStr] = user?.ext?.soudanShienForecast ?? {};
    return prevUsersPlan;
  }, {});
  const [usersPlan, setUsersPlan] = useState(initUsersPlan);

  const rows = users.sort((aUser, bUser) => {
    return aUser.sindex > bUser.sindex? 1: -1;
  }).map((user, i) => {
    const planDt = usersPlan["UID"+user.uid] ?? {};
    return(
      <UserScheduleRow
        key={`UserScheduleRow${user.uid}`}
        user={user} no={i+1} setHoveredStdDate={setHoveredStdDate}
        planDt={planDt} setUsersPlan={setUsersPlan}
      />
    )
  })

  return(
    <>
    <div className={classes.CycleSchedule}>
      <CycleScheduleHeader hoveredStdDate={hoveredStdDate} />
      <div className="body">{rows}</div>
    </div>
    <Dispatcher usersPlan={usersPlan} />
    </>
  )
}

const Buttons = (props) => {
  const classes = useStyles();
  const {mode, setMode} = useContext(ModeContext);

  return(
    <div className={classes.Buttons}>
      <Fab
        variant="extended" className={`delete button${mode==="delete" ?" clicked delete" :""}`}
        onClick={() => setMode(prevMode => prevMode!=="delete" ?"delete" :"")}
      >
        <DeleteForeverIcon className="extendedIcon" />
        削除
      </Fab>
      <Fab
        variant="extended" className={`addAndEditPlan button${mode==="addAndEditPlan" ?" clicked addAndEditPlan" :""}`}
        onClick={() => setMode(prevMode => prevMode!=="addAndEditPlan" ?"addAndEditPlan" :"")}
      >
        <AddIcon className="extendedIcon" />
        以降予定 追加・修正
      </Fab>
      <Fab
        variant="extended" className={`addAndEdit button${mode==="addAndEdit" ?" clicked addAndEdit" :""}`}
        onClick={() => setMode(prevMode => prevMode!=="addAndEdit" ?"addAndEdit" :"")}
      >
        <EditIcon className="extendedIcon" />
        当月 追加・修正
      </Fab>
    </div>
  )
}

const LC2024SoudanParts = (props) => {
  const {uid, thisStdDate, sch={}, freeACostOpen, setFreeAconstOpen} = props;
  if(!uid || !thisStdDate) return null;
  const [thisStdYear, thisStdMonth] = thisStdDate.split("-");
  const did = `D${thisStdYear}${thisStdMonth}01`;

  const keikakuMon = ['計画作成月', 'モニタリング月'];
  const eachPrms = [
    // 虐待防止措置未実施減算
    // 業務継続計画未策定減算
    // 情報公表未報告減算
    {nameJp: 'サービス利用支援', optPtn: 'normalWithGensan'},
    {nameJp: '継続サービス利用支援', optPtn: 'normalWithGensan'},
    // {nameJp: '特地加算', },
    {nameJp: '児童強化型利用支援地域生活支援拠点等機能強化加算', svcs: [SYOUGAI_SOUDAN], },
    {nameJp: '児童強化型継続支援地域生活支援拠点等機能強化加算', svcs: [SYOUGAI_SOUDAN], },
    {nameJp: '初回加算', },
    {nameJp: '主任相談支援専門員配置加算', optPtn: 'roman2', },
    {nameJp: '入院時情報連携加算', optPtn: 'roman2', },
    {nameJp: '退院退所加算', optPtn: 'num3',},
    {nameJp: '保育教育等移行支援加算（訪問）', svcs: [SYOUGAI_SOUDAN], },
    {nameJp: '保育教育等移行支援加算（会議参加）', svcs: [SYOUGAI_SOUDAN], },
    {nameJp: '保育教育等移行支援加算（情報提供）', svcs: [SYOUGAI_SOUDAN], },
    {nameJp: '機関等連携加算（面談）', optPtn: keikakuMon},
    {nameJp: '機関等連携加算（通院同行）', optPtn: 'num3',},
    {nameJp: '機関等連携加算（情報提供（病院等、それ以外））', },
    {nameJp: '集中支援加算（訪問）', },
    {nameJp: '集中支援加算（会議開催）', },
    {nameJp: '集中支援加算（会議参加）', },
    {nameJp: '集中支援加算（通院同行）', optPtn: 'num3',},
    {nameJp: '集中支援加算（情報提供（病院等、それ以外））', },
    {nameJp: '遠隔地訪問加算（初回加算）', },
    {nameJp: '遠隔地訪問加算（入院時情報連携加算Ⅰ）', },
    // この加算は障害と相談で選択肢が違う
    {nameJp: '遠隔地訪問加算（退院退所加算）', optPtn: 'num3', svcs: [KEIKAKU_SOUDAN]},
    {nameJp: '遠隔地訪問加算（退院退所加算）', svcs: [SYOUGAI_SOUDAN]},
    {nameJp: '遠隔地訪問加算（保育教育等移行支援加算・訪問）', svcs: [SYOUGAI_SOUDAN]},
    {nameJp: '遠隔地訪問加算（機関等連携加算・面談）', optPtn: keikakuMon},
    {nameJp: '遠隔地訪問加算（機関等連携加算・通院同行）', optPtn: 'num3',},
    {nameJp: '遠隔地訪問加算（集中支援加算・訪問）', },
    {nameJp: '遠隔地訪問加算（集中支援加算・通院同行）', optPtn: 'num3',},
    {nameJp: '担当者会議実施加算', },
    {nameJp: 'モニタリング加算', },
    {nameJp: '行動障害支援体制加算', optPtn: 'roman2', },
    {nameJp: '要医療児者支援体制加算', optPtn: 'roman2', },
    {nameJp: '精神障害者支援体制加算', optPtn: 'roman2', },
    {nameJp: '高次脳機能障害支援体制加算', optPtn: 'roman2', },
    {nameJp: 'ピアサポート体制加算', },
    {nameJp: '地域生活支援拠点等相談強化加算', },
    {nameJp: '地域体制強化共同支援加算', },
    {nameJp: '強化型利用支援地域生活支援拠点等機能強化加算', svcs: [KEIKAKU_SOUDAN]},
    {nameJp: '強化型継続支援地域生活支援拠点等機能強化加算', svcs: [KEIKAKU_SOUDAN]},
    {nameJp: '居宅介護支援事業所等連携加算（訪問）', svcs: [KEIKAKU_SOUDAN]},
    {nameJp: '居宅介護支援事業所等連携加算（会議参加）', svcs: [KEIKAKU_SOUDAN]},
    {nameJp: '居宅介護支援事業所等連携加算（情報提供）', svcs: [KEIKAKU_SOUDAN]},
    {nameJp: '遠隔地訪問加算（居宅介護支援事業所等連携加算・訪問）', svcs: [KEIKAKU_SOUDAN]},
  ];
  const elms = eachPrms.map((e, i)=>{
    const addStyle = {}
    if (i % 2 === 0) addStyle.backgroundColor = teal[50];
    else addStyle.backgroundColor = '#fff';
    return (
      <div style={{...addStyle}} key={i}>
        <UnivAddictionSoudan 
          uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}
          nameJp={e.nameJp} svcs={e.svcs} optPtn={e.optPtn}
        />
      </div>
    )
  })
  return (
    <>
    {elms}
    <div className='fpRow'>
      <MonitorDate  uid={uid} did={did} size='middleL' dLayer={3} schedule={sch}/>
    </div>
    <div className='fpRow'>
      <ActualCostCheckBox uid={convUID(uid).str} did={did} value={sch}/>
      <FreeActualCost 
        uid={convUID(uid).str} did={did} schedule={sch} 
        freeACostOpen={freeACostOpen} setFreeAconstOpen={setFreeAconstOpen}
      />
    </div>
    </>
  );
}

const AddAndEditDialog = (props) => {
  const users = useSelector(state => state.users);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const actualCostList = useSelector(state => state.config.actualCostList)
  const {setSnack} = useContext(SnackContext)
  const {scheduleList, setScheduleList} = useContext(ScheduleListContext);
  const classes = useStyles();
  const {onClose, dialogParams, ...dialogProps} = props;
  const {uid, thisStdDate, stdDateIndex} = dialogParams;
  const schedule = scheduleList[stdDateIndex];
  const user = users.find(prevUser => prevUser.uid === uid);
  const [freeACostOpen, setFreeAconstOpen] = useState({open:false, value:0});

  const handleCancel = () => {
    onClose();
  }

  const handleSubmit = async() => {
    const [thisStdYaer, thisStdMonth] = thisStdDate.split("-");
    const did = `D${thisStdYaer}${thisStdMonth}01`;
    const trg = schedule[convUID(uid).str];
    const tObj = checkValueType(trg, 'Object') ?trg :{[did]: {dAddiction: {}}}
    const select = document.querySelectorAll('#er5r677 select');
    const input = document.querySelectorAll('#er5r677 input');
    const fDatas = getFormDatas([select, input]);
    // 実費項目の処理
    Object.keys(fDatas.actualCost).map(e => {
      if (fDatas.actualCost[e]) {
        fDatas.actualCost[e] = actualCostList[e];
      }
      else {
        delete fDatas.actualCost[e];
      }
    });
    // 実費項目に自由項目を追加
    if (fDatas.freeACostName){
      fDatas.actualCost = {
        ...fDatas.actualCost, 
        [fDatas.freeACostName]: fDatas.freeACostValue
      }
      delete fDatas.freeACostName;
    }
    // 実費項目を作成
    tObj[did].actualCost = fDatas.actualCost;
    delete fDatas.actualCost;
    // did配下にdaddictionを作成
    tObj[did].dAddiction = {...fDatas};
    const partOfSch = {[convUID(uid).str]: tObj};
    await sendPartOfSchedule({hid, bid, date: thisStdDate, partOfSch});
    setScheduleList(prevScheduleList => {
      prevScheduleList[stdDateIndex] = {...prevScheduleList[stdDateIndex], ...partOfSch};
      return [...prevScheduleList];
    });
    setSnack({msg: `${user.name}さんの利用を書き込みしました。`, severity: 'primary', id: new Date().getTime()});
    setRecentUser(uid);
    onClose();
  }

  return(
    <Dialog
      className={classes.AddAndEditDialog}
      onClose={onClose}
      {...dialogProps}
    >
      <DialogTitle className="dialogTitle">
        <div className="title">計画・障害児相談支援利用設定</div>
        <div className="userInfo">
          <span className="name">{user?.name ?? "利用者"}</span>さま
          <span className="ageStr">{user?.ageStr}</span>
        </div>
      </DialogTitle>
      <DialogContent dividers>
        <form id="er5r677">
          <LC2024SoudanParts
            uid={uid} thisStdDate={thisStdDate}
            sch={schedule}
            freeACostOpen={freeACostOpen} setFreeAconstOpen={setFreeAconstOpen}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained" color="secondary"
          onClick={handleCancel}
        >
          キャンセル
        </Button>
        <Button
          variant="contained" color="primary"
          onClick={handleSubmit}
        >
          書き込み
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const Dispatcher = (props) => {
  const users = useSelector(state => state.users);
  const stdDate = useSelector(state => state.stdDate);
  const dispatch = useDispatch();
  const {scheduleList} = useContext(ScheduleListContext);
  const stdDateList = getCycleStdDateList(stdDate);
  const {usersPlan} = props;
  useEffect(()=>{
    return () =>{
      setTimeout(()=>{
        const closed = !document.querySelector(`#schDispatcher3740`);
        if (closed && stdDate){
          const targetIndex = stdDateList.indexOf(stdDate);
          const targetSchedule = scheduleList[targetIndex];
          targetSchedule.timestamp = new Date().getTime();

          const newUsers = users.map(user => {
            const newUser = JSON.parse(JSON.stringify(user));
            if(!checkValueType(newUser.ext, 'Object')) newUser.ext = {};
            const userPlanDt = usersPlan["UID"+user.uid] ?? {};
            newUser.ext.soudanShienForecast = userPlanDt;
            return newUser;
          });

          dispatch(setStore({schedule: targetSchedule, users: newUsers}));
        }
      }, 100)
    }
  }, [scheduleList, stdDate, stdDateList, users, usersPlan]);
  return (
    <div id="schDispatcher3740" style={{display: 'none'}} />
  )
}

const SoudanShienCycleManager = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {hid, bid, stdDate} = allState;
  const classes = useStyles();
  const [snack, setSnack] = useState({});
  const [scheduleList, setScheduleList] = useState(null);
  const [mode, setMode] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogParams, setDialogParams] = useState({});

  useEffect(() => {
    if(!loadingStatus.loaded) return;
    let isMounted = true;
    (async() => {
      try{
        const stdDateList = getCycleStdDateList(stdDate);
        const promises = stdDateList.map((prevStdDate, i) => {
          return fetchSchedule(hid, bid, prevStdDate);
        });
        const newScheduleList = await Promise.all(promises);
        if(isMounted) setScheduleList(newScheduleList);
      }catch(error){
        setSnack({msg: "データの取得に失敗しました。", severity:'error', errorId:'CNTBKC001'});
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [loadingStatus.loaded]);

  const menuFilter = makeSchMenuFilter(stdDate);

  if(!loadingStatus.loaded || !scheduleList) return(
    <>
    <LinksTab menu={soudanMenu} menuFilter={menuFilter} />
    <LoadingSpinner />
    <SnackMsg {...snack} />
    </>
  )

  return(
    <>
    <LinksTab menu={soudanMenu} menuFilter={menuFilter} />
    <ScheduleListContext.Provider value={{scheduleList, setScheduleList}}>
    <ModeContext.Provider value={{mode, setMode}}>
    <DialogContext.Provider value={{setDialogOpen, setDialogParams}}>
    <SnackContext.Provider value={{setSnack}}>
    <div className={classes.AppPage}>
      <CycleSchedule />
      <Buttons />
      <AddAndEditDialog
        open={dialogOpen} onClose={() => setDialogOpen(false)}
        dialogParams={dialogParams}
      />
    </div>
    </SnackContext.Provider>
    </DialogContext.Provider>
    </ModeContext.Provider>
    </ScheduleListContext.Provider>
    <SnackMsg {...snack} />
    </>
  )
}
export default SoudanShienCycleManager;