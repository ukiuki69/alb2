import { Button, IconButton, makeStyles } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { red, teal } from "@material-ui/core/colors";
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import { convHankaku } from "../../../commonModule";
import { getMinutesFromTimeStr } from "./UsersTimeTableCommon";
import { AlbHMuiTextField } from "../../common/HashimotoComponents";
import { getFilteredUsers, setRecentUser, univApiCall } from '../../../albCommonModule';
import { setSnackMsg, setStore } from "../../../Actions";
import { GoBackButton, LinksTab } from "../../common/commonParts";
import { usersMenu } from "../Users";
import SnackMsg from "../../common/SnackMsg";
import { getDayStr, TIME_ERROR_INITDT } from "./UsersTimeTableEditOld";

const SIDEBAR_WIDTH = 61.25;
const OUTLINE_PADDING = 16;

const getInitFormDt = (timetable=[], dateStr, days, sch, scheduleTemplate, displayService) => {
  const planDt = timetable.find(dt => dt.created === dateStr) ?? {};
  const day = days[0];
  const dayDt = planDt[day] ?? {};
  const templateDt = (() => {
    const weekdayTemplateDt = sch.template?.weekday ?? scheduleTemplate?.[displayService]?.weekday ?? {};
    const schoolOffTemplateDt = sch.template?.schoolOff ?? scheduleTemplate?.[displayService]?.schoolOff ?? {};
    switch(day){
      case "monday": return weekdayTemplateDt
      case "tuesday": return weekdayTemplateDt
      case "wednesday": return weekdayTemplateDt
      case "thursday": return weekdayTemplateDt
      case "friday": return weekdayTemplateDt
      case "saturday": return weekdayTemplateDt
      case "holiday": return schoolOffTemplateDt
    }
    return {};
  })();
  dayDt.basisStart = dayDt.basisStart ?? templateDt.start ?? "";
  dayDt.basisEnd = dayDt.basisEnd ??templateDt.end ?? "";
  return dayDt;
}

const useStyle = makeStyles({
  AppPage: {
    maxWidth: 860, minWidth: 730,
    paddingLeft: SIDEBAR_WIDTH + OUTLINE_PADDING, paddingRight: OUTLINE_PADDING,
    margin: `${84+16}px auto 0`,
    '& .title': {
      fontSize: 24, textAlign: 'center', marginBottom: 12
    },
    '& .name': {
      fontSize: 20, textAlign: 'center', marginBottom: 8,
      '& .sama': {fontSize: 14, marginLeft: 4}
    },
    '& .created': {
      textAlign: 'center',
      marginRight: 20, marginBottom: 8,
      '& .dateStr': {marginLeft: 12}
    },
    '& .days': {
      textAlign: 'center',
      '& .day': {
        '&:not(:last-child)': {marginRight: 12}
      }
    }
  },
  timeTableForm: {
    marginTop: 16,
    '& .row': {
      display: 'flex',
      '& .content': {
        width: 191+32+4,
        '&:not(:last-child)': {
          marginRight: 8,
          flex: 1
        },
        '&:last-child': {
          marginRight: 4
        }
      },
    },
    '& .header': {
      marginBottom: 12,
      borderBottom: `1px solid ${teal[800]}`,
      paddingBottom: 8,
      '& .row': {
        alignItems: 'center'
      }
    },
    '& .body': {
      '& .row': {
        '&:not(last-child)': {
          marginBottom: 8,
        },
        '& .day': {
          paddingTop: 10
        },
        '& .content': {
          display: 'flex',
          '& .times': {
            '& .startEndTime': {
              display: 'flex',
              '& .nami': {
                paddingTop: 8, margin: '0 8px'
              }
            },
            '& .errorMessage': {
              height: 12,
              fontSize: 12, color: red[600],
              marginTop: 4
            }
          },
          '& .kubun': {
            paddingTop: 8, marginLeft: 4
          }
        },
      }
    },
    '& .buttons': {textAlign: 'end'}
  }
});

const BatchEditTimePickers = (props) => {
  const classes = useStyle();
  const {formDt, setFormDt, dtKey, timeError, setTimeError, content} = props;

  const handleChange = (e) => {
    const value = convHankaku(e.target.value);
    if(!/^(\d{0,4}|\d{1,2}:\d{0,2})$/.test(value)) return;
    setFormDt(prevFormDt => ({...prevFormDt, [dtKey]: value}));
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
    if(!(0 <= hh && hh <= 23 && 0 <= mm && mm <= 59)) error = true;

    setFormDt(prevFormDt => ({...prevFormDt, [dtKey]: value}));
    setTimeError(prevTimeError => ({...prevTimeError, [dtKey]: error}));
    const basisStart = formDt?.basisStart;
    const beforeEnd = formDt?.beforeEnd;
    const basisEnd = formDt?.basisEnd;
    const afterStart = formDt?.afterStart;
    if(dtKey === "beforeStart" && !beforeEnd && basisStart){
      setFormDt(prevFormDt => ({...prevFormDt, beforeEnd: basisStart}));
    }else if(dtKey === "afterEnd" && !afterStart && basisEnd){
      setFormDt(prevFormDt => ({...prevFormDt, afterStart: basisEnd}));
    }
  }

  return(
    <AlbHMuiTextField
      value={formDt?.[dtKey] ?? ""}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={props.disabled}
      error={timeError[dtKey] || timeError[content]}
      className={classes.timePickers}
      style={{width: 60}}
    />
  )
}

const BatchEditStartEndTimeForm = (props) => {
  const {formDt, setFormDt, timeError, setTimeError, content} = props;
  const start = formDt?.[`${content}Start`];
  const end = formDt?.[`${content}End`];

  useEffect(() => {
    if(!(start || end)){
      setTimeError(prevTimeError => ({...prevTimeError, [content]: false}));
      return;
    }
    if(/^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end)){
      const startMinutes = getMinutesFromTimeStr(start);
      const endMinutes = getMinutesFromTimeStr(end);
      let error = false;
      if(endMinutes - startMinutes <= 0){
        // 終了時刻が開始時刻よりも早い場合
        error = true;
      }
      setTimeError(prevTimeError => ({...prevTimeError, [content]: error}));
      return;
    }
  }, [formDt]);

  const commonProps = {formDt, setFormDt, timeError, setTimeError, content};
  const endTimeDisabled = content === "before";
  const startTimeDisabled = content === "after";
  return(
    <div className="times">
      <div className="startEndTime">
        <BatchEditTimePickers dtKey={content+"Start"} maxTime={end} {...commonProps} disabled={startTimeDisabled} />
        <span className="nami">〜</span>
        <BatchEditTimePickers dtKey={content+"End"} minTime={start} {...commonProps} disabled={endTimeDisabled} />
      </div>
      <div className="errorMessage">
        {timeError?.[content] || timeError?.[content+"Start"] || timeError?.[content+"End"] ?"時刻が不正です" :""}
      </div>
    </div>
  )
}

export const BasisKubun = (props) => {
  const {formDt} = props;

  const basisStart = formDt?.basisStart ?? "00:00";
  const [sHour, sMin] = basisStart.split(":").map(x => parseInt(x));
  const startMin = sHour * 60 + sMin;

  const basisEnd = formDt?.basisEnd ?? "00:00";
  const [eHour, eMin] = basisEnd.split(":").map(x => parseInt(x));
  const endMin = eHour * 60 + eMin;

  const kubunMin = endMin - startMin;

  let kubun = null, kubunColor = null;
  if(kubunMin < 30){
    kubun = "";
  }else if(kubunMin <= 90){
    kubun = "区１";
  }else if(kubunMin <= 180){
    kubun = "区２";
  }
  else if(kubunMin <= 300){
    kubun = "区３";
    kubunColor = teal[500];
  }else if(301 <= kubunMin){
    kubun = "区３";
    kubunColor = red[500];
  }
  else{
    kubun = "";
  }

  return(
    <div className="kubun" style={{color: kubunColor, marginLeft: 4}}>
      {kubun}
    </div>
  )
}

export const EntyouKubun = (props) => {
  const {formDt} = props;

  if(!((formDt?.beforeStart && formDt?.beforeEnd) || (formDt?.afterStart && formDt?.afterEnd))) return null;

  const beforeStart = formDt?.beforeStart ?formDt?.beforeStart :"00:00";
  const beforeEnd = formDt?.beforeEnd ?formDt?.beforeEnd :"00:00";
  const afterStart = formDt?.afterStart ?formDt?.afterStart :"00:00";
  const afterEnd = formDt?.afterEnd ?formDt?.afterEnd :"00:00";
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
  if(kubunMin < 30){
    kubun = "";
  }else if(kubunMin <= 59){
    kubun = "延１";
    show = false;
  }else if(kubunMin <= 119){
    kubun = "延２";
  }else if(120 <= kubunMin){
    kubun = "延３";
  }

  return(
    <div className="kubun">
      {show ?kubun :""}
    </div>
  )
}

const DeleteIconButton = (props) => {
  const {setFormDt} = props;

  const handleDelete = () => {
    setFormDt({
      basisStart: "", basisEnd: "",
      beforeStart: "", beforeEnd: "",
      afterStart: "",  afterEnd: ""
    });
  }

  return(
    <IconButton
      onClick={handleDelete}
      style={{padding: 8, height: 40}}
    >
      <DeleteForeverIcon style={{color: red[600]}} />
    </IconButton>
  )
}

const CancelButton = () => {
  const history = useHistory();
  const {uid} = useParams();

  const handleClick = () => {
    history.push(`/users/timetable/old/edit/${uid}/`);
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

const SendButton = (props) => {
  const history = useHistory();
  const {uid} = useParams();
  const dispatch = useDispatch();
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const users = useSelector(state => state.users);
  const {formDt, settingDate, timeError, timetable, days} = props;
  const [snack, setSnack] = useState({});

  const handleClick = async() => {
    const planDt = timetable.find(dt => dt.created === settingDate)?.content ?? {};
    days.forEach(day => planDt[day] = formDt);
    const params = {
      a: "sendUsersPlan",
      hid, bid, uid, created: settingDate, item: "timetable",
      content: JSON.stringify(planDt)
    };
    for(let i=0; i<5; i++){
      try{
        const res = await univApiCall(params);
        if(res?.data?.result){
          const newPlanDt = {created: settingDate, content: planDt};
          const newPlanDts = [...timetable];
          const targetPlanDtIndex = newPlanDts.findIndex(dt => dt.created === settingDate);
          if(targetPlanDtIndex === -1) newPlanDts.push(newPlanDt);
          else newPlanDts[targetPlanDtIndex] = newPlanDt;
          const newUsers = [...users];
          const targetUserIndex = newUsers.findIndex(dt => dt.uid === uid);
          const user = newUsers[targetUserIndex];
          user.timetable = newPlanDts;
          setRecentUser("UID"+uid);
          dispatch(setStore({users: newUsers}));
          dispatch(setSnackMsg('更新しました。', '', ''));
          history.push(`/users/timetable/old/edit/${uid}/`);
          break;
        }
      }catch(error){
        if(i === 4){
          setSnack({msg: 'エラー'});
        }
      }
    }
  }

  const disabled = Object.values(timeError).some(x => Object.values(x).some(y => y));
  return(
    <>
    <Button
      onClick={handleClick}
      variant="contained" color="primary"
      className="button"
      style={{marginLeft: 12}}
      disabled={disabled}
    >
      送信
    </Button>
    <SnackMsg {...snack} />
    </>
  )
}

const MainForm = (props) => {
  const classes = useStyle();
  const {uid} = useParams();
  const schedule = useSelector(state => state.schedule);
  const sch = schedule["UID"+uid] ?? {};
  const scheduleTemplate = useSelector(state => state.scheduleTemplate);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service ?service :serviceItems[0];
  const {timetable, dateStr, days} = props;
  const [formDt, setFormDt] = useState(getInitFormDt(timetable, dateStr, days, sch, scheduleTemplate, displayService));
  const [timeError, setTimeError] = useState({...TIME_ERROR_INITDT});

  const commonProps = {formDt, setFormDt, timeError, setTimeError};
  const sendButtonProps = {formDt, settingDate: dateStr, timeError, timetable, days};
  return(
    <div className={classes.timeTableForm}>
      <div className="header">
        <div className="row">
          <div className="content">提供時間</div>
          <div className="content">延長（支援前）</div>
          <div className="content">延長（支援後）</div>
          <div style={{width: 40}} />
        </div>
      </div>
      <div className="body">
        <div className="row">
          <div className="content">
            <BatchEditStartEndTimeForm content="basis" {...commonProps} />
            <BasisKubun {...commonProps} />
          </div>
          <div className="content">
            <BatchEditStartEndTimeForm content="before" {...commonProps} />
            <div className="kubun" />
          </div>
          <div className="content">
            <BatchEditStartEndTimeForm content="after" {...commonProps} />
            <EntyouKubun {...commonProps} />
          </div>
          <DeleteIconButton setFormDt={setFormDt} />
        </div>
      </div>
      <div className="buttons">
        <CancelButton />
        <SendButton {...sendButtonProps} />
      </div>
    </div>
  )
}


const UsersTimeTableBatchEditOld = () => {
  const classes = useStyle();
  const history = useHistory();
  const location = useLocation();
  const {uid} = useParams();
  const query = new URLSearchParams(location.search);
  const dateStr = query.get('dateStr');
  const days = query.get('days').split(",");
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service ?service :serviceItems[0];
  const classroom = useSelector(state => state.classroom);
  const users = useSelector(state => state.users);
  const filteredUsers = getFilteredUsers(users, displayService, classroom);
  const user = filteredUsers.find(dt => dt.uid === uid) ?? {};
  const timetable = user.timetable ?? [];

  if(!user || !(displayService==="放課後等デイサービス" || displayService==="児童発達支援")){
    // 利用者がいない場合は、選択画面に戻す。
    history.push("/users/timetable/");
    return null;
  }

  const mainFormProps = {timetable, dateStr, days}
  return(
    <>
    <LinksTab menu={usersMenu} />
    <GoBackButton posX={90} posY={0} url={`/users/timetable/edit/${uid}/`}  />
    <div className={classes.AppPage}>
      <div className="title">計画支援時間一括入力</div>
      <div className="name">{user.name}<span className="sama">さま</span></div>
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <div className="created">作成日<span className="dateStr">{dateStr}</span></div>
        <div className="days">{days.map(day => (<span className="day">{getDayStr(day)}</span>))}</div>
      </div>
      <MainForm {...mainFormProps} />
    </div>
    </>
  )
}
export default UsersTimeTableBatchEditOld;