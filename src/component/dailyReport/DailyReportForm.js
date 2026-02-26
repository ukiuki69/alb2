import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useHistory, useParams } from "react-router-dom";
import { AlbHMuiTextField, safeJsonParse, useFetchAlbDt, useLocalStorageState, useSessionStorageState } from "../common/HashimotoComponents";
import axios from "axios";
import { HOHOU } from '../../modules/contants';
import { schLocked, setRecentUser } from '../../albCommonModule';
import { endPoint, univApiCall } from '../../modules/api';
import { brtoLf, convHankaku, formatDate, getLodingStatus, makeUrlSearchParams, randomStr } from "../../commonModule";
import { processDeepBrToLf } from "../../modules/newlineConv";
import { GoBackButton, LoadingSpinner } from "../common/commonParts";
import SnackMsg from "../common/SnackMsg";
import { Button, InputAdornment, makeStyles, useMediaQuery } from "@material-ui/core";
import { CntbkCancelButton, CntbkSendButton, fetchContacts } from "../ContactBook/CntbkCommon";
import { red, teal } from "@material-ui/core/colors";
import { DAY_LIST } from "../../hashimotoCommonModules";
import { 
  ActivitiesContentsField, ActivitiesProvider, CarFreeSolo, CarOptionsProvider, DailyReportTimeInput, 
  DailyReportTransferSelect, StaffFreeSolo, StaffOptionsProvider, SubStaffFormAddButton, 
  checkValueType, changeUserReportDtValue, DailyReportLinksTab 
} from "./DailyReportCommon";
import { BackHistoryButton } from "../ContactBook/ContbkUserEdit";
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import CloseIcon from '@material-ui/icons/Close';
import { useGetHeaderHeight } from "../common/Header";
import AddIcon from '@material-ui/icons/Add';
import { MINTRANSFERTIME_INIT } from "./DailyReportSetting";
import { GoalEvaluationForm } from "./GoalEvaluationForm";
import { initializeApp } from "firebase/app";
import { 
  collection, doc, getFirestore, setDoc, deleteDoc, onSnapshot, Timestamp, query, where 
} from 'firebase/firestore';

const SIDEBAR_WIDTH = 61.25;

const LOCATION_WIDTH = '10rem';
const CAR_WIDTH = '120px';
const NAME_WIDTH = '120px';
const STAFF_WIDTH = '120px';
const TIME_WIDTH = '64px';
const NOTICE_WIDTH = '100%';
const VITAL_WIDTH = '120px';
const ACTIVITY_WIDTH = '100%';

// 日報一括登録（複数人選択）時「迎え」タブを選択した場合の上書き項目
const SELECT_TAB_0_KEYS = ["pickupLocation", "pickupCar", "pickupStaff", "pickupSubStaff", "pickup", "start"];
// 日報一括登録（複数人選択）時「送り」タブを選択した場合の上書き項目
const SELECT_TAB_1_KEYS = ["end", "dropoff", "dropoffLocation", "dropoffCar", "dropoffStaff", "dropoffSubStaff"];
// 日報一括登録（複数人選択）時「活動」タブを選択した場合の上書き項目
const SELECT_TAB_2_KEYS = ["activities"];
const SELECT_TAB_3_KEYS = ["temperature", "bloods", "excretion", "spo2", "meal", "medication", "sleep"];

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB-Lj2ECjCYup2FqFGCp2r61U9yD5u5luY",
  authDomain: "albatross-432004.firebaseapp.com",
  projectId: "albatross-432004",
  storageBucket: "albatross-432004.appspot.com",
  messagingSenderId: "238548710535",
  appId: "1:238548710535:web:ceb3a1b4513826ee2bb422"
};

// stdDateとdateを使って「Dyyyymmdd」作成
const makeDDate = (stdDate, date) => {
  const yearStr = stdDate.slice(0, 4);
  const monthStr = stdDate.slice(5, 7);
  const dateStr = String(date).padStart(2, '0');
  return `D${yearStr}${monthStr}${dateStr}`;
}

// URLパラメータが適切かチェック
const checkUrlParams = (urlParams, stdDate) => {
  // 日付と対象uidが存在するか?
  if(!(urlParams.date && urlParams.uids && urlParams.formType)) return false;
  const date = Number(urlParams.date);
  // 日付が整数値か？
  if(!Number.isInteger(date)) return false;
  const year = Number(stdDate.split("-")[0]);
  const month = Number(stdDate.split("-")[1]);
  const thisDateObj = new Date(year, month-1, date);
  // 設定された日付に問題がないか？
  if(!(thisDateObj.getFullYear()===year && thisDateObj.getMonth()===month-1)) return false;
  // uidsに数字とカンマ以外の文字が入っていないか？
  if(!/^[0-9,]+$/.test(urlParams.uids)) return false;
  
  return true;
}

/**
 * 利用者からのメッセージをキャッチする。
 * @param {*} setMessages 
 * @param {*} uid 
 */
const useEditingCntOnSnapshot = (uids, editingId, setEditingCnt) => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);

  useEffect(() => {
    // ローカルストレージにロック無効化フラグがある場合は無視
    if(safeJsonParse(localStorage.getItem("DisableCntbkAndDailyReportLock"), false)) return;
    if(!editingId || !uids.length || !hid || !bid) return;
    const app = initializeApp(FIREBASE_CONFIG);
    const db = getFirestore(app, "dairyreport-editing");
    const unsubscribes = [];
    for(const uid of uids){
      const editingIdsCollection = collection(db, hid+bid, String(uid), "editingIds");
      const now = Timestamp.now();
      const q = query(editingIdsCollection, where("expireAt", ">", now));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newEditingCnt = snapshot.docs.reduce((prevCnt, doc) => {
          if(doc.id !== editingId) prevCnt++;
          return prevCnt;
        }, 0);
        setEditingCnt(newEditingCnt);
      }, (error) => {
        console.log(error);
      });
      unsubscribes.push(unsubscribe);
    }
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [uids.length, editingId, hid, bid]);
}

const useStyles = makeStyles({
  AppPage: {
    width: '95vw',
    margin: `${82+32}px auto`,
    "@media (min-width: 959px)": {
      maxWidth: 816 + SIDEBAR_WIDTH,
      paddingLeft: SIDEBAR_WIDTH,
    },
  },
  dailyReportMain: {
    '& .title': {
      textAlign: 'center', fontSize: 20, marginBottom: 16,
      padding: '8px',
      backgroundColor: teal[800], color: '#fff'
    },
    '& .userNames': {
      display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
      '& .name': {
        margin: '0 12px',
      }
    },
    '& .form': {
      marginBottom: 16,
      '& .formTitle': {
        padding: '4px 8px 2px',
        marginBottom: 16,
        backgroundColor: teal[50],
        borderBottom: `1px solid ${teal[800]}`,
        lineHeight: 1.5
      },
      '& .contents': {
        display: 'flex', flexWrap: 'wrap', rowGap: 8,
        '& > div': {
          marginRight: 8, marginLeft: 8,
        }
      }
    },
    '& .caution': {
      textAlign: 'end',
      '& > div': {marginBottom: '8px'}
    },
    '& .buttons': {
      textAlign: 'end',
      '& .sendButton': {marginLeft: 12}
    }
  },
  CntbkPasteButton: {
    marginLeft: 12,
    '@media (max-width:599px)': {
      padding: '4px 10px',
      fontSize: 12
    },
  }
});


const getAgeDetails = (birthday, stdDate, ageStr) => {
  // ageStrが「x歳児」の形式でなければ何も返さない
  if (!ageStr || !/^\d+歳児$/.test(ageStr)) return null;
  if (!birthday || !stdDate) return null;

  const [bYear, bMonth, bDay] = birthday.split('-').map(Number);
  const [sYear, sMonth, sDay] = stdDate.split('-').map(Number);

  // 日付が無効な場合は何も返さない
  if ([bYear, bMonth, bDay, sYear, sMonth, sDay].some(isNaN)) return null;

  let years = sYear - bYear;
  let months = sMonth - bMonth;
  const days = sDay - bDay;

  if (days < 0) {
    months--;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years}歳${months}ヶ月`;
}

const UserNames = (props) => {
  const {users, uids, sch} = props;
  const [open, setOpen] = useState(false);
  const stdDate = useSelector(state => state.stdDate);
  const absence = sch?.absence ?? false;
  const absenceKasan = sch?.dAddiction?.["欠席時対応加算"] === "1";
  const noUse = sch?.noUse ?? false;

  const iconStyle = {
    fontSize: 18,
    color: absenceKasan ?"rgb(13, 71, 161)" :"rgb(183, 28, 28)",
    marginLeft: 4, marginBottom: -2
  };
  const nameNodes = uids.map((uid, i) => {
    const user = users.find(uDt => uDt.uid === uid);
    const ageDetails = getAgeDetails(user.birthday, stdDate, user.ageStr);
    return(
      <div
        key={`userName${i+1}`} className="name"
        style={uids.length>=2 ?{lineHeight: '1.5rem'} :{display: 'flex', alignItems: "flex-end"}}
      >
        {user.name}
        <span style={{fontSize: 12, marginLeft: 2}}>様</span>
        <span style={{fontSize: 12, marginLeft: 8}}>{user.ageStr}</span>
        {ageDetails && <span style={{fontSize: 12, marginLeft: 4}}>({ageDetails})</span>}
        {uids.length<2 && absence && noUse &&<CloseIcon style={{...iconStyle}} />}
        {uids.length<2 && absence && !noUse &&<NotInterestedIcon style={{...iconStyle}} />}
      </div>
    )  
  });

  const otherNames = (() => {
    if(nameNodes.length <= 4) return null;
    const length = nameNodes.length - 4;
    const handleClick = () => {
      setOpen(true);
    }
    return(
      <div className="name" style={{width: '100%', textAlign: 'center'}} onClick={handleClick}>
        ...他{length}名
      </div>
    )
  })();

  return(
    <div className="userNames">
      {nameNodes.slice(0, 4)}
      {open ?nameNodes.slice(4) :otherNames}
    </div>
  )
}

const FormEditButton = (props) => {
  const {isEdit, setIsEdit, type} = props;
  const handleClick = () => {
    const newIsEdit = {};
    if(type === "pickup") newIsEdit.dropoff = false;
    else if(type === "dropoff") newIsEdit.pickup = false;
    newIsEdit[type] = true;
    setIsEdit(newIsEdit);
  }
  return(
    <Button
      variant="outlined"
      onClick={handleClick}
      style={{padding: '0 8px', marginTop: '-4px', marginLeft: '8px'}}
      disabled={isEdit[type]}
    >
      編集
    </Button>
  )
}

const PickupForm = (props) => {
  const {schDailyReportSetting, userReportDt, dDate, formType, uids, sch, isEdit, setIsEdit} = props;
  const formDt = userReportDt?.[dDate] ?? {};
  const [subStaffOpen, setSubStaffOpen] = useState(false);
  const allDisabled = sch?.absence;
  const transferDisabled = allDisabled || sch?.transfer?.[0] === "" || (uids.length>=2 && !isEdit.pickup);

  // 日報一括登録時「迎え」タブ以外の時は非表示
  if(uids.length>=2 && formType!=="transfer") return null;
  if(allDisabled) return null;
  const noneTranfer = (
    schDailyReportSetting.pickupLocation === false
    && schDailyReportSetting.pickupCar === false
    && schDailyReportSetting.pickupStaff === false
    && schDailyReportSetting.pickup === false
    && schDailyReportSetting.start === false
  );
  // 全て非表示設定の場合
  if(noneTranfer) return null;

  const pickupLocation = formDt.pickupLocation ?? "";
  const noPickup = !pickupLocation || pickupLocation.startsWith("*") || pickupLocation.endsWith("*");
  const commonProps = {...props}
  return(
    <div className="form">
      <div className="formTitle">
        迎え
        {uids.length>=2 &&<FormEditButton isEdit={isEdit} setIsEdit={setIsEdit} type="pickup" />}
      </div>
      <div className="contents">
        {schDailyReportSetting.pickup!==false &&<DailyReportTimeInput label="迎え" dtKey="pickup" width={TIME_WIDTH} defaultValue={formDt.pickup} pairedEndTime={!noPickup ?formDt.start :""} disabled={transferDisabled || noPickup} minMins={MINTRANSFERTIME_INIT} {...commonProps} />}
        {schDailyReportSetting.start!==false &&<DailyReportTimeInput label="開始" dtKey="start" width={TIME_WIDTH} defaultValue={formDt.start} pairedStartTime={!noPickup ?formDt.pickup :""} pairedEndTime={!noPickup ?formDt.end :""} disabled={allDisabled || (uids.length>=2 && !isEdit.pickup)} minMins={MINTRANSFERTIME_INIT} {...commonProps} />}
        {schDailyReportSetting.pickupLocation!==false &&<DailyReportTransferSelect label="場所" dtKey="pickupLocation" width={LOCATION_WIDTH} disabled={transferDisabled} {...commonProps} />}
        {schDailyReportSetting.pickupCar!==false &&<CarFreeSolo dtKey="pickupCar" width={CAR_WIDTH} disabled={transferDisabled || noPickup} {...commonProps} />}
        {schDailyReportSetting.pickupStaff!==false &&<StaffFreeSolo dtKey="pickupStaff" width={STAFF_WIDTH} disabled={transferDisabled || noPickup} {...commonProps} />}
        {schDailyReportSetting.pickupStaff!==false && (!subStaffOpen && !formDt.pickupSubStaff) &&<SubStaffFormAddButton disabled={transferDisabled || noPickup} setSubStaffOpen={setSubStaffOpen} />}
        {schDailyReportSetting.pickupStaff!==false && (subStaffOpen || formDt.pickupSubStaff) &&<StaffFreeSolo dtKey="pickupSubStaff" label="添乗者" width={STAFF_WIDTH} disabled={transferDisabled || noPickup} {...commonProps} />}
      </div>
    </div>
  )
}

const DropoffForm = (props) => {
  const {schDailyReportSetting, userReportDt, dDate, formType, uids, sch, isEdit, setIsEdit} = props;
  const formDt = userReportDt?.[dDate] ?? {};
  const [subStaffOpen, setSubStaffOpen] = useState(false);
  const allDisabled = sch?.absence ?? false;
  const transferDisabled = allDisabled || sch?.transfer?.[1] === "" || (uids.length>=2 && !isEdit.dropoff);

  // 日報一括登録時「送り」タブ以外の時は非表示
  if(uids.length>=2 && formType!=="transfer") return null;
  if(allDisabled) return null;
  const noneTranfer = (
    schDailyReportSetting.end === false
    && schDailyReportSetting.dropoff === false
    && schDailyReportSetting.dropoffLocation === false
    && schDailyReportSetting.dropoffCar === false
    && schDailyReportSetting.dropoffStaff === false
  );
  // 全て非表示設定の場合
  if(noneTranfer) return null;

  const dropoffLocation = formDt.dropoffLocation ?? "";
  const noDropoff = !dropoffLocation || dropoffLocation.startsWith("*") || dropoffLocation.endsWith("*");
  const commonProps = {...props}
  return(
    <div className="form">
      <div className="formTitle">
        送り
        {uids.length>=2 &&<FormEditButton isEdit={isEdit} setIsEdit={setIsEdit} type="dropoff" />}
      </div>
      <div className="contents">
        {schDailyReportSetting.end!==false &&<DailyReportTimeInput label="終了" dtKey="end" width={TIME_WIDTH} defaultValue={formDt.end} pairedStartTime={!noDropoff ?formDt.start :""} pairedEndTime={!noDropoff ?formDt.dropoff :""} disabled={allDisabled || (uids.length>=2 && !isEdit.dropoff)} {...commonProps} />}
        {schDailyReportSetting.dropoff!==false &&<DailyReportTimeInput label="送り" dtKey="dropoff" width={TIME_WIDTH} defaultValue={formDt.dropoff} pairedStartTime={!noDropoff ?formDt.end :""} disabled={transferDisabled || noDropoff} {...commonProps} />}
        {schDailyReportSetting.dropoffLocation!==false &&<DailyReportTransferSelect label="場所" dtKey="dropoffLocation" width={LOCATION_WIDTH} disabled={transferDisabled} {...commonProps} />}
        {schDailyReportSetting.dropoffCar!==false &&<CarFreeSolo dtKey="dropoffCar" width={CAR_WIDTH} disabled={transferDisabled || noDropoff} {...commonProps} />}
        {schDailyReportSetting.dropoffStaff!==false &&<StaffFreeSolo dtKey="dropoffStaff" width={STAFF_WIDTH} disabled={transferDisabled || noDropoff} {...commonProps} />}
        {schDailyReportSetting.dropoffStaff!==false && (!subStaffOpen && !formDt.dropoffSubStaff) &&<SubStaffFormAddButton setSubStaffOpen={setSubStaffOpen} disabled={transferDisabled || noDropoff} />}
        {schDailyReportSetting.dropoffStaff!==false && (subStaffOpen || formDt.dropoffSubStaff) &&<StaffFreeSolo dtKey="dropoffSubStaff" label="添乗者" width={STAFF_WIDTH} disabled={transferDisabled || noDropoff} {...commonProps} />}
      </div>
    </div>
  )
}

const exceptionVitalForm = (text, dtName, kind, reportDt) => {
  if(kind || kind===0){
    if(dtName === "bloods"){
      const origin = reportDt[dtName] ?[...reportDt[dtName]] :["", "", ""];
      origin[kind] = text;
      return origin;
    }else if(dtName === "sleep" && kind !== "sleeptime"){
      const origin = reportDt[dtName] ?reportDt.sleep.includes("-") ?reportDt.sleep.split("-") :null :null;
      if(origin && kind === "bedtime"){
        return `${text}-${origin[1]}`;
      }else if(origin && kind === "wakeuptime"){
        return `${origin[0]}-${text}`;
      }else if(!origin && kind === "bedtime"){
        return `${text}-`;
      }else if(!origin && kind === "wakeuptime"){
        return `-${text}`;
      }
    }
  }
  return text;
}

const VitalFormTextField = (props) => {
  const {
    userReportDt, setUserReportDt, dDate,
    dtName, kind="", val, label, placeholder, adronment="", width, errMsg="", disabled=false,
    varidate, disabledDt, setDisabledDt
  } = props;
  const reportDt = userReportDt?.[dDate] ?? {};
  const [inputError, setInputError] = useState(false);

  const handleChange = (e) => {
    const text = e.target.value;
    const value = exceptionVitalForm(text, dtName, kind, reportDt);
    const newUserReportDt = JSON.parse(JSON.stringify(userReportDt));
    if(!checkValueType(newUserReportDt[dDate], "Object")) newUserReportDt[dDate] = {};
    newUserReportDt[dDate][dtName] = value;
    setUserReportDt(newUserReportDt);
    if(text && varidate && !new RegExp(varidate).test(text)){
      setInputError(true);
      setDisabledDt({...disabledDt, [dtName+kind]: true});
    }else{
      setInputError(false);
      setDisabledDt({...disabledDt, [dtName+kind]: false});
    }
  }
  const handleBlur = (e) => {
    const han_text = convHankaku(e.target.value);
    const value = exceptionVitalForm(han_text, dtName, kind, reportDt);
    const newUserReportDt = JSON.parse(JSON.stringify(userReportDt));
    if(!checkValueType(newUserReportDt[dDate], "Object")) newUserReportDt[dDate] = {};
    newUserReportDt[dDate][dtName] = value;
    setUserReportDt(newUserReportDt);
    if(han_text && varidate && !new RegExp(varidate).test(han_text)){
      setInputError(true);
      setDisabledDt({...disabledDt, [dtName+kind]: true});
    }else{
      setInputError(false);
      setDisabledDt({...disabledDt, [dtName+kind]: false});
    }
  }

  return(
    <AlbHMuiTextField
      error={inputError}
      label={label}
      placeholder={placeholder}
      value={val}
      InputLabelProps={{ shrink: true }}
      InputProps={{
        endAdornment: <InputAdornment position="end">{adronment}</InputAdornment>,
      }}
      helperText={inputError ?errMsg :""}
      disabled={disabled}
      style={{margin: "8px 8px 8px 4px", width}}
      onChange={handleChange}
      onBlur={handleBlur}
    />
  )
}

const VitalForm = (props) => {
  const classes = useStyles();
  const {userReportDt, setUserReportDt, dDate, schDailyReportSetting, uids, sch, formType, disabledDt, setDisabledDt} = props;
  const reportDt = userReportDt?.[dDate] ?? {};
  const temperature_val = reportDt?.temperature ?? "";
  const maxBloodPressure_val = reportDt?.bloods?.[0] ?? "";
  const minBloodPressure_val = reportDt?.bloods?.[1] ?? "";
  const bloodPulse_val = reportDt?.bloods?.[2] ?? "";
  const excretion_val = reportDt?.excretion ?? "";
  const spo2_val = reportDt?.spo2 ?? "";
  const meal_val = reportDt?.meal ?? "";
  const medication_val = reportDt?.medication ?? "";
  let sleeptime_val = "", bedtime_val = "", wakeuptime_val = "";
  const sleep_val = reportDt?.sleep ?? "";
  if(sleep_val.includes("-")){
    bedtime_val = sleep_val.split("-")[0];
    wakeuptime_val = sleep_val.split("-")[1];
  }else{
    sleeptime_val = sleep_val;
  }

  // 日報一括登録時「バイタル」タブ以外の時は非表示
  if(uids.length>=2 && formType!=="vitals") return null;

  const temperature = {
    dtName: 'temperature', val: temperature_val, label: "体温", placeholder: "例：36.5", adronment: "℃", width: '8rem',
    varidate: "(^[1-9１-９][0-9０-９]\\.[0-9０-９]+$)|(^[1-9１-９][0-9０-９]$)", errMsg: "数字または小数点のみ"
  }
  const maxBloodPressure = {
    dtName: "bloods", kind: 0, val: maxBloodPressure_val, label: "最高血圧", placeholder: "例：120", adronment: "mmHg", width: '8rem',
    varidate: "^[1-9１-９][0-9０-９]{0,2}$", errMsg: "数字のみ"
  }
  const minBloodPressure = {
    dtName: "bloods", kind: 1, val: minBloodPressure_val, label: "最低血圧", placeholder: "例：80", adronment: "mmHg", width: '8rem',
    varidate: "^[1-9１-９][0-9０-９]{0,2}$", errMsg: "数字のみ"
  }
  const bloodPulse = {
    dtName: "bloods", kind: 2, val: bloodPulse_val, label: "脈拍", placeholder: "例：90", adronment: "回/分", width: '8rem',
    varidate: "^[1-9１-９][0-9０-９]{0,2}$", errMsg: "数字のみ"
  }
  const excretion = {
    dtName: "excretion", val: excretion_val, label: "排泄", placeholder: "例：大○回、小○回", width: '10rem',
  }
  const spo2 = {
    dtName: "spo2", val: spo2_val, label: "血中酸素濃度", placeholder: "例：96", adronment: "%", width: '8rem',
    varidate: "(^[1-9１-９][0-9０-９]{0,1}\\.[0-9０-９]+$)|(^[1-9１-９][0-9０-９]{0,2}$)", errMsg: "数字または小数点のみ"
  }
  const sleeptime = {
    dtName: "sleep", kind: "sleeptime", val: sleeptime_val, label: "睡眠時間", placeholder: "例：8.5", width: '8rem', adronment: "時間",
    varidate: "(^[1-9１-９][0-9０-９]{0,1}\\.[0-9０-９]+$)|(^[1-9１-９][0-9０-９]{0,2}$)", errMsg: "数字または小数点のみ"
  }
  const meal = {
    dtName: "meal", val: meal_val, label: "食事", placeholder: "例：全量・9割など", width: '10rem',
  }
  const medication = {
    dtName: "medication", val: medication_val, label: "服薬", placeholder: "例：リスパダール服用済", width: '15rem',
  }
  const bedtime = {
    dtName: "sleep", kind: "bedtime", val: bedtime_val, label: "就寝時間", placeholder: "例：22:00", width: '8rem',
    varidate: "^[1-2１-２]{0,1}[0-9０-９]:[0-5０-５][0-9０-９]$", errMsg: ":で分けた数字のみ"
  }
  const wakeuptime = {
    dtName: "sleep", kind: "wakeuptime", val: wakeuptime_val, label: "起床時間", placeholder: "例：7:00", width: '8rem',
    varidate: "^[1-2１-２]{0,1}[0-9０-９]:[0-5０-５][0-9０-９]$", errMsg: ":で分けた数字のみ"
  }
  const commonProps = {userReportDt, setUserReportDt, dDate, disabledDt, setDisabledDt};

  return(
    <div className="form">
       <div className="formTitle">バイタル</div>
       <div className="contents">
        {schDailyReportSetting.vital!==false &&<div>
          <VitalFormTextField {...{...temperature, ...commonProps}}/>
        </div>}
        {schDailyReportSetting.bloods!==false &&<div>
          <VitalFormTextField {...{...maxBloodPressure, ...commonProps}}/>
          <VitalFormTextField {...{...minBloodPressure, ...commonProps}}/>
          <VitalFormTextField {...{...bloodPulse, ...commonProps}}/>
        </div>}
        {schDailyReportSetting.excretion!==false &&<div>
          <VitalFormTextField {...{...excretion, ...commonProps}}/>
        </div>}
        {schDailyReportSetting.spo2!==false &&<div>
          <VitalFormTextField {...{...spo2, ...commonProps}}/>
        </div>}
        {schDailyReportSetting.meal!==false &&<div>
          <VitalFormTextField {...{...meal, ...commonProps}}/>
        </div>}
        {schDailyReportSetting.medication!==false &&<div>
          <VitalFormTextField {...{...medication, ...commonProps}}/>
        </div>}
        {(!schDailyReportSetting.sleep || schDailyReportSetting.sleep==="時間") &&<div>
          <VitalFormTextField {...{...sleeptime, ...commonProps}}/>
        </div>}
        {schDailyReportSetting.sleep==="就寝・起床" &&<div>
          <VitalFormTextField {...{...bedtime, ...commonProps}}/>
          <VitalFormTextField {...{...wakeuptime, ...commonProps}}/>
        </div>}
      </div>
    </div>
  )
}

const ActivityForm = (props) => {
  const service = useSelector(state => state.service);
  const {formType, uids, sch, hohouSch} = props;
  const commonProps = {...props}

  // 日報一括登録時「活動」タブ以外の時は非表示
  if(uids.length>=2 && formType!=="notice") return null;

  let absence = false;
  if(service){
    // サービス選択時
    if(service===HOHOU){
      if(hohouSch?.absence) absence = true;
    }else{
      if(sch?.absence) absence = true;
    }
  }else{
    // 全サービス選択時
    if(sch?.absence && hohouSch?.absence) absence = true;
  }
  const disabled = absence;
  if(disabled) return null;
  return(
    <div className="form">
      <div className="formTitle">活動</div>
      <div className="contents">
        <ActivitiesContentsField
          dtKey="activities"
          width={ACTIVITY_WIDTH}
          {...commonProps}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

const LogTemplateForm = (props) => {
  const com = useSelector(state => state.com);
  const {title, dtKey, uids, userReportDt, setUserReportDt, sch, hohouSch, dDate, planDts = [], hohouPlanDts = []} = props;
  const [nonHide, setNonHide] = useState(false);
  const [hiyariHattoOpen, setHiyariHattoOpen] = useState(false);

  // 日報一括登録時は非表示
  if(uids.length>=2) return null;

  const dAddiction = {...sch?.dAddiction, ...hohouSch?.dAddiction};
  switch(dtKey){
    case "kessekiNotice": {
      if(!dAddiction["欠席時対応加算"]) return null;
      break;
    }
    case "kazokuShienNotice": {
      if(!(dAddiction["家族支援加算Ⅰ"] || dAddiction["家族支援加算Ⅱ"])) return null;
      break;
    }
    case "kosodateNotice": {
      if(!dAddiction["子育てサポート加算"]) return null;
      break;
    }
    case "senmonShienNotice": {
      if(userReportDt?.[dDate]?.[dtKey]) break;
      if(!dAddiction["専門的支援実施加算"] && !nonHide) return(
        <Button
          onClick={() => setNonHide(true)}
          startIcon={<AddIcon />}
        >
          専門的支援実施加算の記録を入力する
        </Button>
      )
      break;
    }
    case "kankeiKikanNotice": {
      if(!dAddiction["関係機関連携加算"]) return null;
      break;
    }
    case "iryouKasanNotice": {
      if(!dAddiction["医療連携体制加算"]) return null;
      break;
    }
    case "jigyosyoKanNotice": {
      if(!dAddiction["事業所間連携加算"]) return null;
      break;
    }
    case "hiyariHatto": {
      if(userReportDt?.[dDate]?.[dtKey]) break;
      if(!hiyariHattoOpen) return(
        <div style={{marginTop: 16}}>
          <Button
            onClick={() => setHiyariHattoOpen(true)}
            startIcon={<AddIcon />}
          >
            ヒヤリハットを入力する
          </Button>
        </div>
      )
      break;
    }
  }

  const handleFocus = (e) => {
    const val = e.target.value;
    if(val) return;
    const templateDtKey = dtKey==="notice" ?"userNotice" :dtKey==="hohouNotice" ?"userHohouNotice" :dtKey.replace("Notice", "");
    let initValue = brtoLf(com?.ext?.dailyReportTemplate?.[templateDtKey] ?? "");
    const regexp = new RegExp("%.+%");
    if(regexp.test(initValue)){
      const valueList = initValue.split("\n");
      const targetIndex = valueList.findIndex(v => regexp.test(v));
      const targetText = valueList[targetIndex];
      if(templateDtKey === "userNotice" && targetText.includes("%日々の課題%")){
        const dailyAssignments = planDts.flatMap(dt => brtoLf(dt?.["日々の課題"] ?? "").split("\n")).filter(x => x);
        // 元の「【%.+%】」を削除して、その位置に日々の課題を挿入
        valueList.splice(targetIndex, 1, ...dailyAssignments);
      }else if(templateDtKey === "userHohouNotice" && targetText.includes("%日々の課題%")){
        const dailyAssignments = hohouPlanDts.flatMap(dt => brtoLf(dt?.["日々の課題"] ?? "").split("\n")).filter(x => x);
        // 元の「【%.+%】」を削除して、その位置に日々の課題を挿入
        valueList.splice(targetIndex, 1, ...dailyAssignments);
      }else if(dtKey === "kazokuShienNotice" && targetText.includes("%自動挿入%")){
        const kasanKey = dAddiction["家族支援加算Ⅰ"] ?"家族支援加算Ⅰ" :dAddiction["家族支援加算Ⅱ"] ?"家族支援加算Ⅱ" :"";
        const kasanValue = dAddiction["家族支援加算Ⅰ"] ?? dAddiction["家族支援加算Ⅱ"] ?? "";
        valueList[targetIndex] = targetText.replace(regexp, `${kasanKey}・${kasanValue}`);
      }else if(dtKey === "kankeiKikanNotice" && targetText.includes("%自動挿入%")){
        let insertText = "";
        if(dAddiction["関係機関連携加算"] === "1"){
          insertText = "個別支援計画の作成等";
        }else if(dAddiction["関係機関連携加算"] === "2"){
          insertText = "保育所や学校等との情報連携";
        }else if(dAddiction["関係機関連携加算"] === "3"){
          insertText = "児童相談所、医療機関等との情報連携";
        }else if(dAddiction["関係機関連携加算"] === "4"){
          insertText = "就学先・就職先に対する連絡調整及び相談援助";
        }
        valueList[targetIndex] = targetText.replace(regexp, `${insertText}`);
      }
      initValue = valueList.join("\n");
    }
    const newUserReportDt = changeUserReportDtValue(userReportDt, dDate, dtKey, initValue);
    setUserReportDt(newUserReportDt);
  }

  const handleChange = (e) => {
    const val = e.target.value;
    const newUserReportDt = changeUserReportDtValue(userReportDt, dDate, dtKey, val);
    setUserReportDt(newUserReportDt);
  }

  return(
    <div className="form">
      <div className="formTitle">{title}</div>
      <div className="contents">
        <AlbHMuiTextField
          name={dtKey}
          value={userReportDt?.[dDate]?.[dtKey] ?? ""}
          onFocus={handleFocus}
          onChange={handleChange}
          variant="outlined"
          multiline
          minRows="3"
          // maxRows="5"
          rows="3"
          // rowsMax="5"
          width="100%"
        />
      </div>
    </div>
  )
}

const CntbkPasteButton = (props) => {
  const classes = useStyles();
  const {formDt, setFormDt, contacts, uidStr, dDate, setSnack} = props;
  const cntbkDt = contacts?.[uidStr]?.[dDate] ?? {};

  const handleClick = () => {
    const notice = formDt?.[dDate]?.notice ?? "";
    const cntbkNotice = cntbkDt?.[2]?.content ?? "";
    const noticeContextList = notice ?brtoLf(notice).split("\n") : [];
    const cntbkNoticeContextList = cntbkNotice ?brtoLf(cntbkNotice).split("\n") : [];
    const matchCount = cntbkNoticeContextList.filter(line => noticeContextList.includes(line)).length;
    if (matchCount >= (cntbkNoticeContextList.length > 3 ?3 :cntbkNoticeContextList.length)){
      setSnack({msg: '同じ内容が検出されたため中断しました。', severity: 'warning', id: new Date().getTime()});
      return;
    }
    setFormDt(prevFormDt => ({...prevFormDt, [dDate]: {...prevFormDt[dDate], ["notice"]: notice ?`${notice}\n\n${cntbkNotice}` :cntbkNotice}}));
  }

  return(
    <Button
      className={classes.CntbkPasteButton}
      variant="contained"
      onClick={handleClick}
    >
      連絡帳からコピー
    </Button>
  )
}

const Main = (props) => {
  const history = useHistory();
  const classes = useStyles();
  const isLimit1080px = useMediaQuery("(max-width:1080px)");
  const {allState, dailyReportDt, dDate, uids, setSnack, formType, contacts} = props;
  const hohouDdate = dDate + "H";
  const {users, hid, bid, stdDate, schedule, com} = allState;
  const schDailyReportSetting = com?.ext?.schDailyReportSetting ?? {};
  const uidStr = "UID" + uids[0];
  const sch = schedule?.[uidStr]?.[dDate];
  const hohouSch = schedule?.[uidStr]?.[hohouDdate];
  const [formDt, setFormDt] = useState({});
  const year = dDate.slice(1, 5);
  const month = dDate.slice(5, 7);
  const date = dDate.slice(7, 9);
  const day = DAY_LIST[new Date(parseInt(year), parseInt(month)-1, parseInt(date)).getDay()];

  const [isEdit, setIsEdit] = useSessionStorageState({pickup: true, dropoff: false}, "dailyReportBulkInputTransfer");

  // バイタルエラー状態
  const [disabledDt, setDisabledDt] = useState({});
  const [planDts, setPlanDts] = useState([]);
  const [hohouPlanDts, setHohouPlanDts] = useState([]);

  const [editingId, setEditingId] = useLocalStorageState(null, "dairyReportEditingId");
  const [editingCnt, setEditingCnt] = useState(0);
  useEditingCntOnSnapshot(uids, editingId, setEditingCnt);
  useEffect(() => {
    if(!editingId || !uids.length || !hid || !bid) return;
    
    // データベースに編集者IDとタイムスタンプをセット・更新する
    const updateTimestamp = async () => {
      try {
        // ローカルストレージにロック無効化フラグがある場合は無視
        if(safeJsonParse(localStorage.getItem("DisableCntbkAndDailyReportLock"), false)) return;
        const app = initializeApp(FIREBASE_CONFIG);
        const db = getFirestore(app, "dairyreport-editing");
        for(const uid of uids){
          const editingIdsCollection = collection(db, hid+bid, String(uid), "editingIds");
          const docRef = doc(editingIdsCollection, editingId);
          const expireAt = Timestamp.fromDate(new Date(new Date().getTime() + 6 * 60 * 1000));
          const expireTimestamp = new Date().getTime() + 6 * 60 * 1000;
          setDoc(docRef, {timestamp: new Date().getTime(), expireAt, expireTimestamp}, {merge: true});
        }
      } catch (error) {
        console.error('Error updating timestamp:', error);
      }
    };
    
    updateTimestamp(); // 初回実行
    
    // 5分間隔で実行するタイマーを設定
    const timer = setInterval(updateTimestamp, 5 * 60 * 1000); // 5分 = 300,000ミリ秒
    
    // クリーンアップ関数
    return () => {
      if (timer) clearInterval(timer);
      setTimeout(async () => {
        const closed = !document.querySelector('#cntbkEditing');
        if (closed && editingId) {
          try {
            const app = initializeApp(FIREBASE_CONFIG);
            const db = getFirestore(app, "dairyreport-editing");
            for(const uid of uids){
              const editingIdsCollection = collection(db, hid+bid, String(uid), "editingIds");
              const docRef = doc(editingIdsCollection, editingId);
              deleteDoc(docRef);
            }
          } catch (error) {
            console.error('Error deleting editing document:', error);
          }
        }
      }, 300);
    };
  }, [editingId, uids.length, hid, bid]);

  useEffect(() => {
    // ロカールストレージにeditingIdがなければ作成
    if(!editingId){
      const newEditingId = randomStr(16) + String(new Date().getTime());
      setEditingId(newEditingId);
    }
  }, []);

  useEffect(() => {
    // フォームデータ初期値設定
    const letStartBePickup = schDailyReportSetting?.letStartBePickup ?? true;
    const newReportDt = JSON.parse(JSON.stringify(
      checkValueType(dailyReportDt?.[uidStr]?.[dDate], 'Object') ?dailyReportDt?.[uidStr]?.[dDate] :{}
    ));
    // （迎え）場所初期値　「値がない」かつ「送迎がある」時は送迎地を設定
    if(newReportDt.pickupLocation!=="" && !(newReportDt.pickupLocation ?? false)) newReportDt.pickupLocation = sch?.transfer?.[0];
    // （迎え）送迎時間初期値　「値がない」かつ「送迎がある」時は開始時間を設定
    if(!(newReportDt.pickup ?? false)) newReportDt.pickup = letStartBePickup && sch?.transfer?.[0] ?sch?.start : "";
    // （迎え）開始時間初期値　「値がない」かつ「送迎がない」時は開始時間を設定
    if(!(newReportDt.start ?? false)) newReportDt.start = letStartBePickup && sch?.transfer?.[0] ?"" :sch?.start;
    // （送り）終了時間初期値　「値がない」かつ「送迎がない」時は終了時間を設定
    if(!(newReportDt.end ?? false)) newReportDt.end = sch?.end ?? "";
    // （送り）送迎初期値　「値がない」かつ「送迎がある」時は終了時間を設定
    if(!(newReportDt.dropoff ?? false)) newReportDt.dropoff = "";
    // （送り）場所初期値　「値がない」かつ「送迎がある」時は送迎地を設定
    if(newReportDt.dropoffLocation!=="" && !(newReportDt.dropoffLocation ?? false)) newReportDt.dropoffLocation = sch?.transfer?.[1];
    // （活動）活動初期値　「値がない」時は空の配列を設定
    if(!(newReportDt.activities ?? false)) newReportDt.activities = [];
    setFormDt({[dDate]: newReportDt});
  }, []);

  useEffect(() => {
    if (!hid || !bid || uids.length !== 1) {
      setPlanDts([]);
      setHohouPlanDts([]);
      return;
    }
    const uid = uids[0];
    let mounted = true;
    const beforeDateObj = new Date();
    beforeDateObj.setDate(beforeDateObj.getDate() + 60);
    const before = formatDate(beforeDateObj, "YYYY-MM-DD");

    (async () => {
      const [res, hohouRes] = await Promise.all([
        univApiCall({
          a: "fetchUsersPlan",
          hid, bid, uid, before,
          item: "personalSupport", limit: 5
        }),
        univApiCall({
          a: "fetchUsersPlan",
          hid, bid, uid, before,
          item: "personalSupportHohou", limit: 5
        })
      ]);
      if (!mounted) return;

      const newPlanDts = (res?.data?.dt || [])
        .filter(dt => dt?.content?.content)
        .sort((a, b) => new Date(b.created) - new Date(a.created))
        .map(dt => dt?.content?.content);
      setPlanDts(newPlanDts);

      const newHohouPlanDts = (hohouRes?.data?.dt || [])
        .filter(dt => dt?.content?.content)
        .sort((a, b) => new Date(b.created) - new Date(a.created))
        .map(dt => dt?.content?.content);
      setHohouPlanDts(newHohouPlanDts);
    })();

    return () => {
      mounted = false;
    };
  }, [hid, bid, uids.join(",")]);

  const onlyHohouSch = Boolean(!sch && hohouSch);

  const handleClick = async() => {
    if(!onlyHohouSch){
      if(Object.keys(disabledDt).some(key => disabledDt[key])){
        setSnack({...{msg: '入力内容に誤りがあります。', severity: 'warning', id: new Date().getTime()}});
        return;
      }
    }
    let sendDt = null;
    const result = [];
    if(uids.length >= 2){
      // 日報一括登録時 選択タブの項目のみ上書き
      let keys = [];
      if(formType==="transfer"){
        if(isEdit.pickup) keys.push(...SELECT_TAB_0_KEYS);
        if(isEdit.dropoff) keys.push(...SELECT_TAB_1_KEYS);
      }
      else if(formType==="notice") keys = SELECT_TAB_2_KEYS;
      else if(formType === "vitals") keys = SELECT_TAB_3_KEYS;
      for(const uid of uids){
        const user = users.find(u => u.uid === uid);
        const uidStr = "UID" + uid;
        sendDt = JSON.parse(JSON.stringify(checkValueType(dailyReportDt[uidStr], 'Object') ?dailyReportDt[uidStr] :{}));
        keys.forEach(key => {
          if(!checkValueType(sendDt[dDate], 'Object')) sendDt[dDate] = {};
          sendDt[dDate][key] = formDt[dDate][key];
        });
        sendDt[dDate].name = user.name;
        sendDt[dDate].edited = true;
        sendDt[dDate].timestamp = new Date().getTime();
        const params = {
          "a": "sendPartOfDailyReportWith2Key",
          hid, bid, date: stdDate, key1: uidStr, key2: dDate,
          partOfRpt: JSON.stringify(sendDt[dDate])
        }
        const res = await axios.post(endPoint(), makeUrlSearchParams(params));
        result.push(res?.data?.result ?? false);
      }
    }else{
      // 通常　全ての値を上書き
      const user = users.find(u => u.uid === uids[0]);
      const uidStr = "UID" + uids[0];
      sendDt = JSON.parse(JSON.stringify(checkValueType(dailyReportDt[uidStr], 'Object') ?dailyReportDt[uidStr] :{}));
      sendDt[dDate] = formDt[dDate];
      sendDt[dDate].goalEvaluations = Array.isArray(formDt?.[dDate]?.goalEvaluations) ? formDt[dDate].goalEvaluations : [];
      sendDt[dDate].name = user.name;
      sendDt[dDate].edited = true;
      sendDt[dDate].timestamp = new Date().getTime();
      const params = {
        "a": "sendPartOfDailyReportWith2Key",
        hid, bid, date: stdDate, key1: uidStr, key2: dDate,
        partOfRpt: JSON.stringify(sendDt[dDate])
      }
      const res = await univApiCall(params, "", "", setSnack, "保存しました。", "保存に失敗しました。");
      result.push(res?.data?.result ?? false);
    }
    if(result.every(x => x)){
      uids.forEach(uid => setRecentUser(uid));
      setSnack({msg: '保存しました。'});
      history.push("/dailyreport/")
    }else{
      setSnack({msg: '保存に失敗しました。', severity: 'error', id: new Date().getTime()});
    }
  }

  const commonProps = {
    userReportDt: formDt, setUserReportDt: setFormDt, dDate, schDailyReportSetting, setSnack, formType, uids, sch,
    hohouSch, planDts, hohouPlanDts,
    isEdit, setIsEdit, disabledDt, setDisabledDt
  }
  const isAfter202511 = stdDate >= '2025-11-01';
  return(
    <div className={classes.dailyReportMain}>
      {isLimit1080px &&<BackHistoryButton />}
      <div className="title">{uids.length >= 2 ?"日報一括登録" :"日報登録"}</div>
      <div style={{textAlign: 'center', marginBottom: 8}}>
        {month}<span style={{fontSize: 12, margin: '0 2px'}}>/</span>
        {date}<span style={{marginLeft: 8}}>{day}曜日</span>
      </div>
      <UserNames users={users} uids={uids} sch={sch} />
      {(editingCnt>0 && uids.length===1) &&
        <div style={{textAlign: 'center', color: red['A700'], marginTop: 8, marginBottom: 8}}>
          他{editingCnt}名が編集中
        </div>
      }
      {(editingCnt>0 && uids.length>=2) &&
        <div style={{textAlign: 'center', color: red['A700'], marginTop: 8, marginBottom: 8}}>
          他スタッフが編集中
        </div>
      }
      <form style={{marginTop: 16}}>
        {!onlyHohouSch &&<PickupForm {...commonProps} />}
        {!onlyHohouSch &&<DropoffForm {...commonProps} />}
        <VitalForm {...commonProps} />
        {schDailyReportSetting.activities!==false &&
          <ActivityForm {...commonProps}
        />}
        {(schDailyReportSetting.notice!==false && (Boolean(sch) || Boolean(formDt?.[dDate]?.notice))) &&
          <LogTemplateForm key="notice" title="療育記録" dtKey="notice" {...commonProps}
        />}
        {(schDailyReportSetting.notice!==false && Boolean(hohouSch) && isAfter202511) &&
          <LogTemplateForm key="hohouNotice" title="保育訪問の記録" dtKey="hohouNotice" {...commonProps}
        />}
        <GoalEvaluationForm {...commonProps} date={stdDate}/>
        {schDailyReportSetting.notice!==false &&
          <LogTemplateForm key="kessekiNotice" title="欠席時対応加算の記録" dtKey="kessekiNotice" {...commonProps}
        />}
        {schDailyReportSetting.notice!==false &&
          <LogTemplateForm key="kazokuShienNotice" title="家族支援加算の記録" dtKey="kazokuShienNotice" {...commonProps}
        />}
        {schDailyReportSetting.notice!==false &&
          <LogTemplateForm key="kosodateNotice" title="子育てサポート加算の記録" dtKey="kosodateNotice" {...commonProps}
        />}
        {schDailyReportSetting.notice!==false &&
          <LogTemplateForm key="kankeiKikanNotice" title="関係機関連携加算の記録" dtKey="kankeiKikanNotice" {...commonProps}
        />}
        {schDailyReportSetting.notice!==false &&
          <LogTemplateForm key="iryouKasanNotice" title="医療連携体制加算の記録" dtKey="iryouKasanNotice" {...commonProps}
        />}
        {schDailyReportSetting.notice!==false &&
          <LogTemplateForm key="jigyosyoKanNotice" title="事業所間連携加算の記録" dtKey="jigyosyoKanNotice" {...commonProps}
        />}
        {schDailyReportSetting.notice!==false &&
          <LogTemplateForm key="senmonShienNotice" title="専門的支援実施加算の記録" dtKey="senmonShienNotice" {...commonProps}
        />}
        {schDailyReportSetting.notice!==false &&
          <LogTemplateForm key="hiyariHatto" title="ヒヤリハット" dtKey="hiyariHatto" {...commonProps}
        />}
        {(uids.length>=2 && formType==="transfer") &&<div className="caution" style={{textAlign: 'end'}}>
          {(Object.values(isEdit).every(x => !x)) &&<div>一括登録対象の編集ボタンを押してください。</div>}
          {isEdit.pickup &&<div>迎え項目が一括登録されます。</div>}
          {isEdit.dropoff &&<div>送り項目が一括登録されます。</div>}
        </div>}
        <div className="buttons">
          <CntbkCancelButton handleClick={() => history.push("/dailyreport/")} />
          <CntbkPasteButton
            formDt={formDt}
            setFormDt={setFormDt}
            contacts={contacts}
            uidStr={uidStr}
            dDate={dDate}
            setSnack={setSnack}
          />
          <CntbkSendButton
            label="保存" handleClick={handleClick}
            disabled={
              (uids.length>=2 && formType==="transfer" && Object.values(isEdit).every(x => !x))
              || Object.keys(disabledDt).some(key => disabledDt[key])
            }
          />
        </div>
      </form>
    </div>
  )
}

export const DailyReportForm = () => {
  const classes = useStyles();
  const headerHeight = useGetHeaderHeight();
  const history = useHistory();
  const urlParams = useParams();
  const isLimit1080px = useMediaQuery("(max-width:1080px)");
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {stdDate, hid, bid, schedule, users, service, classroom} = allState;
  const dDate = makeDDate(stdDate, urlParams.date);
  const uids = (urlParams.uids ?? "").split(",");
  const [snack, setSnack] = useState({});
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  const safeSetSnack = useCallback((nextSnack) => {
    if (!isMountedRef.current) return;
    setSnack(nextSnack);
  }, []);

  const [dailyReportDt] = useFetchAlbDt({"a": "fetchDailyReport", hid, bid, date: stdDate}, ["dailyreport"], false, {}, safeSetSnack);
  const lastMonthStdDate = (() => {
    const stdDateParts = stdDate.split("-").map(x => parseInt(x));
    const dateObj = new Date(stdDateParts[0], stdDateParts[1]-1-1, 1);
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2, '0')}-01`;
  })();
  const [lastMonthDailyReportDt] = useFetchAlbDt({"a": "fetchDailyReport", hid, bid, date: lastMonthStdDate}, ["dailyreport"], false, {}, safeSetSnack);

  const [contacts, setContacts] = useState({});
  useEffect(() => {
    if(!loadingStatus.loaded) return;
    let isMounted = true;
    fetchContacts(hid, bid, stdDate, null, dDate, safeSetSnack).then(newContacts => {
      if (isMounted) {
        setContacts(newContacts);
      }
    })
    return () => {
      isMounted = false;
    };
  }, [loadingStatus.loaded]);

  // ネストされたオブジェクトの改行処理を適用
  const processedDailyReportDt = useMemo(() => {
    return processDeepBrToLf(dailyReportDt);
  }, [dailyReportDt]);

  const processedLastMonthDailyReportDt = useMemo(() => {
    return processDeepBrToLf(lastMonthDailyReportDt);
  }, [lastMonthDailyReportDt]);

  useEffect(() => {
    if(schLocked(schedule, users, null, dDate, service, classroom)){
      history.push("/dailyreport/");
      return;
    }
  }, []);

  // ストアデータと日報データを取得するまで読み込み
  if(!(loadingStatus.loaded && dailyReportDt && lastMonthDailyReportDt)) return(<LoadingSpinner />);
  // urlパラメータが正しくなけらば前の画面に戻る。
  if(!checkUrlParams(urlParams, stdDate)){
    history.push("/dailyReport/");
    return null;
  }

  const mainProps = {allState, dailyReportDt: processedDailyReportDt, dDate, uids, setSnack: safeSetSnack, formType: urlParams.formType, contacts};
  const providerProps = {dailyReportDt: processedDailyReportDt, lastMonthDailyReportDt: processedLastMonthDailyReportDt};
  return(
    <>
    {!isLimit1080px &&<GoBackButton posX={90} posY={0} url="/dailyreport/" />}
    <DailyReportLinksTab />
    <div className={classes.AppPage} style={headerHeight ?{marginTop: headerHeight+32} :{}}>
      <CarOptionsProvider {...providerProps}>
        <StaffOptionsProvider {...providerProps}>
          <ActivitiesProvider {...providerProps}>
            <Main {...mainProps} />
          </ActivitiesProvider>
        </StaffOptionsProvider>
      </CarOptionsProvider>
    </div>
    <SnackMsg {...snack} />
    </>
  )
}