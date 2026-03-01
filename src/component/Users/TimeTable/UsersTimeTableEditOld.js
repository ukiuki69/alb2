import { Button, Checkbox, IconButton, TextField, makeStyles } from "@material-ui/core";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { red, teal, orange, grey } from "@material-ui/core/colors";
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import { checkValueType } from "../../dailyReport/DailyReportCommon";
import { brtoLf, convHankaku, getLodingStatus, lfToBr } from "../../../commonModule";
import { UsersTimeTableAddButton, UsersTimeTableCopyButton, UsersTimeTableCreatedInput, UsersTimeTableDateChangeButton, UsersTimeTableDeleteButton, UsersTimeTableGoBackButton, UsersTimeTableInfos, UsersTimeTableVersionSwitch } from "./UsersTimeTableCommon";
import { AlbHMuiTextField, AlbHTimeInput } from "../../common/HashimotoComponents";
import { HOUDAY, JIHATSU } from '../../../modules/contants';
import { setRecentUser, univApiCall } from '../../../albCommonModule';
import { setSnackMsg, setStore } from "../../../Actions";
import { LoadingSpinner } from "../../common/commonParts";
import SnackMsg from "../../common/SnackMsg";
import { PlanPrintButton } from "../../plan/planCommonPart";
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';

const CHECKBOX_PADDING = 6;
const SELECTPAGE_PATH = "/users/timetable/";
export const TIME_ERROR_INITDT = {
  basis: false, basisStart: false, basisEnd: false,
  before: false, beforeStart: false, beforeEnd: false,
  after: false, afterStart: false, afterEnd: false
};

/**
 * 文字列の時間（hh:mm）を分に変換し整数値を返す
 * @param {String} timeStr 
 * @returns {Number}
 */
export const getMinutesFromTimeStr = (timeStr="00:00") => {
  const [hours, minutes] = timeStr.split(":").map(x => parseInt(x));
  return hours*60 + minutes;
}

export const initDayDy = (planDt, day, templateDt) => {
  if(!planDt[day]) planDt[day] = {};
  const dayDt = planDt[day];
  dayDt.basisStart = dayDt.basisStart ?? templateDt.start ?? "";
  dayDt.basisEnd = dayDt.basisEnd ??templateDt.end ?? "";
}

const changePlanDtValue = (planDt, day, dtKey, value) => {
  const newPlanDt = {...planDt};
  if(day){
    // 曜日データの書き換え
    if(!checkValueType(newPlanDt[day], "Object")) newPlanDt[day] = {};
    const dayDt = newPlanDt[day];
    dayDt[dtKey] = value;
  }else{
    // 延長理由や特記事項などの書き換え
    newPlanDt[dtKey] = value;
  }
  newPlanDt.version = 1;
  return newPlanDt;
}

export const getDayStr = (day) => {
  switch(day){
    case "monday": return "月";
    case "tuesday": return "火";
    case "wednesday": return "水";
    case "thursday": return "木";
    case "friday": return "金";
    case "saturday": return "土";
    case "holiday": return "日・祝日";
  }
}

const useStyles = makeStyles({
  AppPage: {
    width: '960px',
    margin: `${84+16}px auto 32px`, padding: '0 16px',
    '& .infos': {
      width: '100%',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    },
    '& .formOptions': {
      display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap',
      '& > *:not(:last-child)': {marginRight: 8},
    },
    '& .buttons': {
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      '& .button': {width: 112}
    }
  },
  dateSettingForm: {
    height: 55,
    display: 'flex',
    '& .radio': {
      marginRight: 8,
    },
    '& .settingDateInput': {
      width: 130, paddingTop: 4,
      '& .sFormaParts': {padding: 0}
    },
    '& .settingDateSelect': {
      paddingTop: 4,
    }
  },
  timeTableForm: {
    '& .row': {
      display: 'flex',
      '& .checkbox': {minWidth: '36px'},
      '& .day': {padding: 8,minWidth: '82px', textAlign: 'start'},
      '& .holiday': {width: '42px', marginRight: '16px'},
      '& .basis, .before, .after': {
        width: 176,
        display: 'flex', justifyContent: 'space-around',
        margin: '0 8px',
        '& .nami': {marginTop: 8},
      },
      '& .time': {
        minWidth: '80px',
      },
      // '& .kubun': {
      //   minWidth: '32px', maxWidth: '32px',
      //   paddingTop: 8, margin: '0 4px',
      //   textAlign: 'center',
      // },
      '& .kubun': {minWidth: '80px', marginRight: '16px', textAlign: 'center'},
      '& .delete': {minWidth: '40px'}
    },
    '& .header': {
      '& .basis, .before, .after, .kubun': {
        padding: '8px 0',
      },
      marginBottom: 12,
      borderBottom: `1px solid ${teal[800]}`,
    },
    '& .body': {
      '& .row': {
        '& .kubun': {
          padding: '8px 0',
        },
        '&:not(:last-child)': {
          marginBottom: 8,
        },
      }
    }
  },
  textField: {
    width: '100%',
    margin: '8px 0'
  },
});

export const PlanDtContext = createContext();
const TimeErrorContext = createContext();

const TimePickers = (props) => {
  const classes = useStyles();
  const {dtKey, day, checkedDt, content} = props;
  const {planDt, setPlanDt} = useContext(PlanDtContext);
  const {timeError, setTimeError} = useContext(TimeErrorContext);
  const isBulkInput = Object.values(checkedDt).some(checked => checked);

  const handleChange = (e) => {
    const value = convHankaku(e.target.value);
    if(!/^(\d{0,4}|\d{1,2}:\d{0,2})$/.test(value)) return;
    setPlanDt(prevPlanDt => changePlanDtValue(prevPlanDt, day, dtKey, value));
  }

  const handleBlur = (e) => {
    let error = false;
    let value = convHankaku(e.target.value);
    if(!value) return;
    if(!value.includes(":")){
      const valueLength = value.length;
      if(valueLength === 1){
        value = `${value}:00`;
      }else if(valueLength === 2) {
        value = value.slice(0, 1) + ":" + value.slice(-1);
      }else if(valueLength === 3) {
        value = value.slice(0, 1) + ":" + value.slice(-2);
      }else if(valueLength === 4){
        value = value.slice(0, 2) + ":" + value.slice(-2);
      }
    }
    const [hh, mm] = value.split(":").map(x => x ?parseInt(x) :0);
    value = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    if(!(0 <= hh && hh <= 23 && 0 <= mm && mm <= 59)){
      error = true;
    }
    const basisStart = planDt?.[day]?.basisStart;
    const beforeEnd = planDt?.[day]?.beforeEnd;
    const basisEnd = planDt?.[day]?.basisEnd;
    const afterStart = planDt?.[day]?.afterStart;
    setPlanDt(prevPlanDt => changePlanDtValue(prevPlanDt, day, dtKey, value));
    setTimeError(prevTimeError => changePlanDtValue(prevTimeError, day, dtKey, error));
    if(dtKey === "beforeStart" && !beforeEnd && basisStart){
      setPlanDt(prevPlanDt => changePlanDtValue(prevPlanDt, day, "beforeEnd", basisStart));
    }else if(dtKey === "afterEnd" && !afterStart && basisEnd){
      setPlanDt(prevPlanDt => changePlanDtValue(prevPlanDt, day, "afterStart", basisEnd));
    }
  }

  return(
    <AlbHMuiTextField
      value={planDt?.[day]?.[dtKey] ?? ""}
      onChange={handleChange}
      onBlur={handleBlur}
      className={classes.timePickers}
      disabled={isBulkInput || props.disabled}
      error={timeError[day][dtKey] || timeError[day][content]}
      style={{width: 60}}
    />
  )
}

export const StartEndTimeForm = (props) => {
  const {day, content, checkedDt} = props;
  const {planDt} = useContext(PlanDtContext);
  const {timeError, setTimeError} = useContext(TimeErrorContext);
  const start = planDt?.[day]?.[`${content}Start`];
  const end = planDt?.[day]?.[`${content}End`];

  useEffect(() => {
    if(!(start || end)){
      setTimeError(prevTimeError => changePlanDtValue(prevTimeError, day, content, false));
    }else if(/^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end)){
      const startMinutes = getMinutesFromTimeStr(start);
      const endMinutes = getMinutesFromTimeStr(end);
      let err = false;
      if(endMinutes - startMinutes <= 0){
        // 終了時刻が開始時刻よりも早い場合
        err = true;
      }
      setTimeError(prevTimeError => changePlanDtValue(prevTimeError, day, content, err));
    }
  }, [planDt]);

  const errorHoge = timeError?.[day]?.[content] || timeError?.[day]?.[content+"Start"] || timeError?.[day]?.[content+"End"];
  const commonProps = {day, checkedDt, content};
  const endTimeDisabled = content === "before";
  const startTimeDisabled = content === "after";
  return(
    <div className="times">
      <div className="startEndTime">
        <TimePickers dtKey={content+"Start"} maxTime={end} {...commonProps} disabled={startTimeDisabled} />
        <span className="nami">〜</span>
        <TimePickers dtKey={content+"End"} minTime={start} {...commonProps} disabled={endTimeDisabled} />
      </div>
      <div className="errorMessage">
        {errorHoge ?"時刻が不正です" :""}
      </div>
    </div>
  )
}

export const BasisKubun = (props) => {
  const {day, content} = props;
  const dayDt = content?.[day];

  const basisStart = dayDt?.basisStart ?? "00:00";
  const [sHour, sMin] = basisStart.split(":").map(x => parseInt(x));
  const startMin = sHour * 60 + sMin;

  const basisEnd = dayDt?.basisEnd ?? "00:00";
  const [eHour, eMin] = basisEnd.split(":").map(x => parseInt(x));
  const endMin = eHour * 60 + eMin;

  const kubunMin = endMin - startMin;

  // let kubun = null, kubunColor = null;
  // if(kubunMin < 30){
  //   kubun = "";
  // }else if(kubunMin <= 90){
  //   kubun = "区１";
  // }else if(kubunMin <= 180){
  //   kubun = "区２";
  // }else if(kubunMin <= 300){
  //   kubun = "区３";
  //   kubunColor = teal[500];
  // }else if(301 <= kubunMin){
  //   kubun = "区３";
  //   kubunColor = red[500];
  // }else{
  //   kubun = "";
  // }
  let kubun = null, kubunColor = null;
  if(kubunMin < 30){
    kubun = "";
  }else if(kubunMin <= 90){
    kubun = "区分1";
  }else if(kubunMin <= 180){
    kubun = "区分2";
  }else if(kubunMin <= 300){
    kubun = "区分3";
    kubunColor = teal[500];
  }else if(301 <= kubunMin){
    kubun = "区分3";
    kubunColor = red[500];
  }else{
    kubun = "";
  }

  const disabled = false
  return(
    // <div className="kubun" style={{color: kubunColor}}>
    //   {kubun}
    // </div>
    <div className="kubun" style={{color: disabled ?grey[400] :""}}>{kubun ?kubun :""}</div>
  )
}

export const EntyouKubun = (props) => {
  const {day, content} = props;
  const dayDt = content?.[day];

  if(!((dayDt?.beforeStart && dayDt?.beforeEnd) || (dayDt?.afterStart && dayDt?.afterEnd))) {
    return (<div className="kubun" />);
  }

  const beforeStart = dayDt?.beforeStart ?dayDt?.beforeStart :"00:00";
  const beforeEnd = dayDt?.beforeEnd ?dayDt?.beforeEnd :"00:00";
  const afterStart = dayDt?.afterStart ?dayDt?.afterStart :"00:00";
  const afterEnd = dayDt?.afterEnd ?dayDt?.afterEnd :"00:00";
  const [bSHour, bSMin] = beforeStart.split(":").map(x => parseInt(x));
  const beforeStartMin = bSHour * 60 + bSMin;
  const [bEHour, bEMin] = beforeEnd.split(":").map(x => parseInt(x));
  const beforeEndtMin = bEHour * 60 + bEMin;
  const beforeKubunMin = beforeEndtMin - beforeStartMin;
  const [aSHour, aSMin] = afterStart.split(":").map(x => parseInt(x));
  const afterStarttMin = aSHour * 60 + aSMin;
  const [aEHour, aEMin] = afterEnd.split(":").map(x => parseInt(x));
  const afterEndtMin = aEHour * 60 + aEMin;
  const afterKubunMin = afterEndtMin - afterStarttMin;
  const kubunMin = beforeKubunMin < afterKubunMin ?afterKubunMin :beforeKubunMin;

  let kubun = null, show = true;
  // if(kubunMin < 30){
  //   kubun = "";
  // }else if(kubunMin <= 59){
  //   kubun = "延１";
  //   show = false;
  // }else if(kubunMin <= 119){
  //   kubun = "延２";
  // }else if(120 <= kubunMin){
  //   kubun = "延３";
  // }
  if(kubunMin < 30){
    kubun = "";
  }else if(kubunMin <= 59){
    kubun = "延長1";
    show = false;
  }else if(kubunMin <= 119){
    kubun = "延長2";
  }else if(120 <= kubunMin){
    kubun = "延長3";
  }

  const disabled = false
  return(
    // <div className="kubun">
    //   {show ?kubun :""}
    // </div>
    <div className="kubun" style={{color: disabled ?grey[400] :""}}>{kubun&&show ?kubun :""}</div>
  )
}

const TimeTableFormRow = (props) => {
  const schedule = useSelector(state => state.schedule);
  const scheduleTemplate = useSelector(state => state.scheduleTemplate);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const {uid} = useParams();
  const {day, checkedDt, setCheckedDt, planDt, setPlanDt, planDts} = props;
  const created = planDt?.created ?? "";
  const dayStr = getDayStr(day);
  const data = planDt.content[day] ?? {};
  const basisStart = data.basisStart ?? "";
  const basisEnd = data.basisEnd ?? "";
  const beforeStart = data.beforeStart ?? "";
  const beforeEnd = data.beforeEnd ?? "";
  const afterStart = data.afterStart ?? "";
  const afterEnd = data.afterEnd ?? "";

  const handleChangeCheckbox = (e) => {
    const checked = e.target.checked;
    setCheckedDt(prevCheckDt => ({...prevCheckDt, [day]: checked}));
  }

  // 曜日別で新しく値を自動入力する。
  // 過去にデータがある場合はそれを使用
  // 過去にデータがない場合は予定位実績のテンプレートを使用
  const handleAddValue = () => {
    const newDt = {};
    const pastPlanDt = planDts.sort((a, b) => {
      return new Date(b.created) - new Date(a.created);
    }).find(prevPlanDt => {
      return prevPlanDt.created < created
    })?.content;
    if(pastPlanDt?.basisStart && pastPlanDt?.basisEnd){
      const pastData = pastPlanDt?.[day];
      newDt.basisStart = pastData?.basisStart ?? "";
      newDt.basisEnd = pastData?.basisEnd ?? "";
      newDt.beforeStart = pastData?.beforeStart ?? "";
      newDt.beforeEnd = pastData?.beforeEnd ?? "";
      newDt.afterStart = pastData?.afterStart ?? "";
      newDt.afterEnd = pastData?.afterEnd ?? "";
    }else{
      const template = day==="holiday"
        ?schedule?.["UID"+uid]?.template?.schoolOff ?? scheduleTemplate?.[displayService]?.schoolOff ?? {}
        :schedule?.["UID"+uid]?.template?.weekday ?? scheduleTemplate?.[displayService]?.weekday ?? {};
      newDt.basisStart = template.start ?? "";
      newDt.basisEnd = template.end ?? "";
    }
    setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: newDt, version: 1}}));
  }

  // 曜日別で入力した値を削除する。
  const handleClear = () => {
    setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {}, version: 1}}));
  }

  const disabled = Object.values(checkedDt).some(x => x);
  const isInputed = basisStart || basisEnd || beforeStart || beforeEnd || afterStart || afterEnd;
  return(
    <div className="row">
      <div className="checkbox">
        <Checkbox 
          checked={Boolean(checkedDt[day])}
          color="primary"
          onChange={handleChangeCheckbox}
          style={{padding: CHECKBOX_PADDING}}
        />
      </div>
      <div className="day">{dayStr}</div>
      <div className="basis">
        <div className="time start">
          <AlbHTimeInput
            time={basisStart}
            setTime={(val) => setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {...prevPlanDt.content[day], basisStart: val, version: 1}}}))}
            maxTime={basisEnd} disabled={disabled}
          />
        </div>
        <span className="nami">〜</span>
        <div className="time end">
          <AlbHTimeInput
            time={basisEnd}
            setTime={(val) => setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {...prevPlanDt.content[day], basisEnd: val, version: 1}}}))}
            minTime={basisStart} disabled={disabled}
          />
        </div>
      </div>
      {/* <BasisKubun day={day} content={planDt.content} /> */}
      <div className="before">
        <div className="time start">
          <AlbHTimeInput
            time={beforeStart}
            setTime={(val) => setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {...prevPlanDt.content[day], beforeStart: val, version: 1}}}))}
            maxTime={beforeEnd} disabled={disabled}
          />
        </div>
        <span className="nami">〜</span>
        <div className="time end">
          <AlbHTimeInput
            time={beforeEnd}
            setTime={(val) => setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {...prevPlanDt.content[day], beforeEnd: val, version: 1}}}))}
            minTime={beforeStart} maxTime={basisStart} disabled={disabled}
            onFocus={() => {
              if(basisStart && !beforeEnd){
                setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {...prevPlanDt.content[day], beforeEnd: basisStart, version: 1}}}));
              }
            }}
          />
        </div>
      </div>
      {/* <div className="kubun" /> */}
      <div className="after">
        <div className="time start">
          <AlbHTimeInput
            time={afterStart}
            setTime={(val) => setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {...prevPlanDt.content[day], afterStart: val, version: 1}}}))}
            minTime={basisEnd} maxTime={afterEnd} disabled={disabled}
            onFocus={() => {
              if(basisEnd && !afterStart){
                setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {...prevPlanDt.content[day], afterStart: basisEnd, version: 1}}}));
              }
            }}
          />
        </div>
        <span className="nami">〜</span>
        <div className="time end">  
          <AlbHTimeInput
            time={afterEnd}
            setTime={(val) => setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {...prevPlanDt.content[day], afterEnd: val, version: 1}}}))}
            minTime={afterStart} disabled={disabled}
          />
        </div>
      </div>
      <BasisKubun day={day} content={planDt.content} />
      <EntyouKubun day={day} content={planDt.content} />
      <div className="delete">
        {isInputed &&<IconButton
          onClick={handleClear}
          style={{padding: 8, height: 40}}
          disabled={disabled}
        >
          <DeleteForeverIcon style={{color: !disabled ?red["A700"] :null}}/>
        </IconButton>}
        {!isInputed &&<IconButton
          onClick={handleAddValue}
          style={{padding: 8, height: 40}}
          disabled={disabled}
        >
          <AddCircleOutlineIcon style={{color: !disabled ?teal[800] :null}}/>
        </IconButton>}
      </div>
    </div>
  )
}

const CancelButton = () => {
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const historyParam = searchParams.get("history");
  
  const handleClick = () => {
    history.push(historyParam === "plan" ?`/plan/manegement` :SELECTPAGE_PATH);
  }

  return(
    <Button
      onClick={handleClick}
      variant="contained" color="secondary"
      className="button"
    >
      キャンセル
    </Button>
  )
}

const BatchEditButton = (props) => {
  const history = useHistory();
  const location = useLocation();
  const {uid} = useParams();
  const {checkedDt, planDt} = props;
  const [snack, setSnack] = useState({});
  const isBulkInput = Object.values(checkedDt).some(checked => checked);
  const created = planDt?.created ?? "";

  const handleClick = () => {
    if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(created)){
      setSnack({msg: "作成日を入力してください。", severity: "warning", id: new Date().getTime()});
      return;
    }
    const checkedDays = Object.keys(checkedDt).filter(day => checkedDt[day]);
    const prefix = location.pathname.startsWith('/plan/') ? '/plan' : '/users';
    history.push(`${prefix}/timetable/old/edit/batch/${uid}/?dateStr=${created}&days=${checkedDays.join(",")}`);
  }

  return(
    <>
    <Button
      onClick={handleClick}
      variant="contained"
      className="button"
      disabled={!isBulkInput}
      style={{
        marginLeft: 12,
        backgroundColor: isBulkInput ?orange[800] :null,
        color: isBulkInput ?"#fff" :null,
      }}
    >
      一括入力
    </Button>
    <SnackMsg {...snack} />
    </>
  )
}

const SendButton = (props) => {
  const dispatch = useDispatch();
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const users = useSelector(state => state.users);
  const {uid} = useParams();
  const {checkedDt, planDt} = props;
  const created = planDt?.created ?? "";
  const [snack, setSnack] = useState({});

  const handleClick = async() => {
    try{
      if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(created)){
        setSnack({msg: "作成日を入力してください。", severity: "warning", id: new Date().getTime()});
        return;
      }
      const newPlanDt = JSON.parse(JSON.stringify(planDt));
      const newContent = newPlanDt.content;
      if(newContent.reason) newContent.reason = lfToBr(newContent.reason);
      if(newContent.note) newContent.note = lfToBr(newContent.note);
      const sendParams = {
        a: "sendUsersPlan",
        hid, bid, uid, item: "timetable",
        created,
        content: JSON.stringify(newContent)
      };
      const sendRes = await univApiCall(sendParams, "UTT01", '', setSnack);
      if(!sendRes?.data?.result){
        console.log("エラー")
        return;
      }
      const prevPlanDts = users.find(prevUser => prevUser.uid === uid)?.timetable ?? [];
      const newPlanDts = JSON.parse(JSON.stringify(prevPlanDts));
      const planDtIndex = newPlanDts.findIndex(prevPlanDt => prevPlanDt.created === created);
      if(planDtIndex === -1){
        newPlanDts.push(newPlanDt);
      }else{
        newPlanDts[planDtIndex] = newPlanDt;
      }
      newPlanDts.sort((a, b) => a.created <= b.created ?1 :-1);
      const newUsers = JSON.parse(JSON.stringify(users));
      const targetUserIndex = newUsers.findIndex(dt => dt.uid === uid);
      const user = newUsers[targetUserIndex];
      user.timetable = newPlanDts;
      setRecentUser("UID"+uid);
      dispatch(setStore({users: newUsers}));
      dispatch(setSnackMsg('更新しました。', '', ''));
    }catch(e){
      console.error(e);
    }
  }

  const isBulkInput = Object.values(checkedDt).some(checked => checked);
  return(
    <>
    <Button
      onClick={handleClick}
      variant="contained" color="primary"
      className="button"
      disabled={isBulkInput}
      style={{marginLeft: '12px'}}
    >
      送信
    </Button>
    <SnackMsg {...snack} />
    </>
  )
}

const MainForm = (props) => {
  const classes = useStyles();
  const formRef = useRef(null);
  const users = useSelector(state => state.users);
  const {uid} = useParams();
  const {planDt, setPlanDt, originPlanDt} = props;
  const [checkedDt, setCheckedDt] = useState({
    monday: false, tuesday: false, wednesday: false,
    thursday: false, friday: false, saturday: false,
    holiday: false
  });

  // 一括入力用チェックボックスを全選択・解除する処理
  const handleChangeCheckbox = (e) => {
    const checked = e.target.checked;
    setCheckedDt({
      monday: checked, tuesday: checked, wednesday: checked,
      thursday: checked, friday: checked, saturday: checked,
      holiday: checked
    });
  }

  const planDts = users.find(prevUser => prevUser.uid === uid)?.timetable ?? [];
  const rowProps = {checkedDt, setCheckedDt, planDt, setPlanDt, planDts};
  return(
    <div className={classes.timeTableForm}>
      <form ref={formRef}>
        <UsersTimeTableCreatedInput planDt={planDt} setPlanDt={setPlanDt} originCreated={originPlanDt.created} />
        <div className="header">
          <div className="row">
            <div className="checkbox">
              <Checkbox
                color="primary"
                checked={Object.values(checkedDt).every(checked => checked)}
                onChange={handleChangeCheckbox}
                style={{padding: '6px'}}
              />
            </div>
            <div className="day">曜日</div>
            <div className="time basis">提供時間</div>
            {/* <div className="kubun" /> */}
            <div className="time before">延長（支援前）</div>
            {/* <div className="kubun" /> */}
            <div className="time after">延長（支援後）</div>
            {/* <div className="kubun" /> */}
            <div className="kubun">時間区分</div>
            <div className="kubun">延長支援</div>
            <div className="delete" />
          </div>
        </div>
        <div className="body">
          <TimeTableFormRow day="monday" {...rowProps}/>
          <TimeTableFormRow day="tuesday" {...rowProps}/>
          <TimeTableFormRow day="wednesday" {...rowProps}/>
          <TimeTableFormRow day="thursday" {...rowProps}/>
          <TimeTableFormRow day="friday" {...rowProps}/>
          <TimeTableFormRow day="saturday" {...rowProps}/>
          <TimeTableFormRow day="holiday" {...rowProps}/>
          <div style={{padding: '8px 0 0 8px', color: red[600], fontSize: '.9rem'}}>
            この画面で登録された計画支援時間は予定実績のひな形として利用できません。
          </div>
          <div>
            <AlbHMuiTextField
              name="reason"
              label="延長を必要とする理由" variant="outlined"
              value={brtoLf(planDt?.content?.reason ?? "")}
              className={classes.textField}
              multiline
              minRows={2} rows={2}
              onChange={(e) => {
                const value = e.target.value;
                setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, reason: value}}));
              }}
            />
          </div>
          <div>
            <AlbHMuiTextField
              name="note"
              label="特記事項" variant="outlined"
              value={brtoLf(planDt?.content?.note ?? "")}
              className={classes.textField}
              multiline
              minRows={2} rows={2}
              onChange={(e) => {
                const value = e.target.value;
                setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, note: value}}));
              }}
            />
          </div>
        </div>
        <div className="buttons" style={{marginTop: '8px'}}>
          <CancelButton />
          <BatchEditButton checkedDt={checkedDt} planDt={planDt} />
          <SendButton checkedDt={checkedDt} planDt={planDt} originPlanDt={originPlanDt} />
        </div>
      </form>
    </div>
  )
}

const UsersTimeTableEditOld = () => {
  const history = useHistory();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urlParamCreated = searchParams.get("created");
  const historyParam = searchParams.get("history");
  const {uid} = useParams();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {users, service, serviceItems} = allState;
  const classes = useStyles();
  const [snack, setSnack] = useState({});
  const [originPlanDt, setOriginPlanDt] = useState({content: {}, created: null});
  const [planDt, setPlanDt] = useState({content: {}, created: null});
  useEffect(() => {
    // ロード完了後planDtの初期値をセットする。
    if(!loadingStatus.loaded) return;
    const planDts = users.find(prevUser => prevUser.uid === uid)?.timetable ?? [];
    if(urlParamCreated){
      const targetPlanDt = planDts.find(prevPlanDt => prevPlanDt.created === urlParamCreated);
      if(targetPlanDt){
        // URLパラメータにcreatedがある場合は、その日付のデータをセットする。
        if(!checkValueType(targetPlanDt?.content, "Object")) targetPlanDt.content = {};
        setPlanDt(targetPlanDt);
        setOriginPlanDt(targetPlanDt);
      }else{
        // その日付のデータがない場合は、新規作成する。
        setPlanDt({content: {}, created: urlParamCreated});
        setOriginPlanDt({content: {}, created: urlParamCreated});
      }
    }else{
      const latestPlanDt = planDts.sort((a, b) => a.created <= b.created ?1 :-1)[0];
      if(latestPlanDt){
        // 最新のデータをセットする。
        if(!checkValueType(latestPlanDt?.content, "Object")) latestPlanDt.content = {};
        setPlanDt(latestPlanDt);
        setOriginPlanDt(latestPlanDt);
      }else{
        // 最新のデータがない場合は、新規作成する。
        setPlanDt({content: {}, created: null});
        setOriginPlanDt({content: {}, created: null});
      }
    }
  }, [loadingStatus.loaded, urlParamCreated]);
  
  if(!loadingStatus.loaded) return(
    <>
    <LoadingSpinner />
    </>
  );

  const user = users.find(prevUser => prevUser.uid === uid);
  const displayService = service || serviceItems[0];
  if(!user || !(user?.service ?? "").includes(displayService) || (displayService!==HOUDAY && displayService!==JIHATSU)){
    // 利用者がいない場合は、選択画面に戻す。
    history.push(historyParam === "plan" ?`/plan/manegement` :SELECTPAGE_PATH);
    return null;
  }

  return(
    <>
    <div className={classes.AppPage}>
      <UsersTimeTableGoBackButton />
      <div className="infos">
        <UsersTimeTableInfos />
        <UsersTimeTableVersionSwitch setSnack={setSnack} />
      </div>
      <div className="formOptions">
        <UsersTimeTableAddButton setPlanDt={setPlanDt} setOriginPlanDt={setOriginPlanDt} />
        <UsersTimeTableDateChangeButton
          planDt={planDt} setPlanDt={setPlanDt}
          setSnack={setSnack}
        />
        <UsersTimeTableCopyButton
          planDt={planDt} setPlanDt={setPlanDt} 
          setSnack={setSnack}
        />
        <UsersTimeTableDeleteButton
          planDt={planDt} setPlanDt={setPlanDt}
          setSnack={setSnack}
        />
        <PlanPrintButton
          item="timetable"
          created={originPlanDt.created}
          uid={uid}
          originInputs={originPlanDt}
          inputs={planDt}
        />
      </div>
      <MainForm
        planDt={planDt} setPlanDt={setPlanDt}
        originPlanDt={originPlanDt}
      />
    </div>
    <SnackMsg {...snack} />
    </>
  )
}
export default UsersTimeTableEditOld;