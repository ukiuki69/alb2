import { Button, Checkbox, makeStyles } from "@material-ui/core";
import React, {useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { teal } from "@material-ui/core/colors";
import { AlbHTimeInput } from "../../common/HashimotoComponents";
import { getFilteredUsers, setRecentUser, univApiCall } from '../../../albCommonModule';
import { setSnackMsg, setStore } from "../../../Actions";
import { LinksTab } from "../../common/commonParts";
import { usersMenu } from "../Users";
import { getDayStr } from "./UsersTimeTableEditOld";
import { getJikanKubunAndEnchou } from "../../../modules/elapsedTimes";
import SnackMsg from "../../common/SnackMsg";

const SIDEBAR_WIDTH = 61.25;

const useStyles = makeStyles({
  AppPage: {
    width: 'fit-content',
    margin: `${84+16}px auto 0`, padding: '0 16px',
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
    },
    '& .buttons': {
      textAlign: 'end',
      '& .button': {width: 112}
    },
    "@media (min-width: 1080px)": {
      // width: 544 + SIDEBAR_WIDTH + 16,
      width: 'fit-content',
      paddingLeft: SIDEBAR_WIDTH + 16,
    },
  },
  dateSettingForm: {
    height: 55,
    display: 'flex',
    '& .radio': {
      marginRight: 8,
    },
    // '& .settingDateInput': {
    //   paddingTop: 4,
    //   '& .dateInput': {width: 28}
    // },
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
      display: 'flex', alignItems: 'center',
      '& .checkbox': {minWidth: '36px', marginRight: '8px'},
      '& .day': {minWidth: '64px', textAlign: 'start', marginRight: '16px', flex: '1'},
      '& .holiday': {width: '42px', marginRight: '16px'},
      '& .time': {
        minWidth: '80px', marginRight: '16px',
        '&.start': {marginRight: '16px'}
      },
      '& .enchoTarget': {minWidth: '126px', marginRight: '16px'},
      '& .kubun': {minWidth: '80px', marginRight: '16px'},
      '& .delete': {minWidth: '40px'}
    },
    '& .header': {
      marginBottom: 12,
      borderBottom: `1px solid ${teal[800]}`,
      '& .row': {
        textAlign: 'center',
      }
    },
    '& .body': {
      '& .row': {
        '&:not(:last-child)': {
          marginBottom: 8,
        },
        '& .kubun': {textAlign: 'center'}
      }
    }
  }
});

const CancelButton = () => {
  const history = useHistory();
  const {uid} = useParams();

  const handleClick = () => {
    history.push(`/users/timetable/edit/${uid}/`);
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
  const dispatch = useDispatch();
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const {uid} = useParams();
  const {formRef} = props;
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const dateStr = query.get('dateStr');
  const days = query.get('days').split(",");
  const [snack, setSnack] = useState({});

  const handleClick = async() => {
    const form = formRef.current;
    if(!form) return;
    const planDts = users.find(prevUser => prevUser.uid === uid)?.timetable ?? [];
    const planDt = planDts.find(prevPlanDt => prevPlanDt.created === dateStr)?.content ?? {};
    const body = form.getElementsByClassName("body")[0];
    const row = body.getElementsByClassName("row")[0];
    const newPlanDt = JSON.parse(JSON.stringify(planDt));
    for(const day of days){
      if(!newPlanDt[day]) newPlanDt[day] = {};
      newPlanDt[day].holiday = displayService!=="児童発達支援" ?row.getElementsByClassName("holiday")[0].getElementsByTagName("input")[0].checked :true;
      newPlanDt[day].basisStart = row.getElementsByClassName("start")[0].getElementsByTagName("input")[0].value;
      newPlanDt[day].basisEnd = row.getElementsByClassName("end")[0].getElementsByTagName("input")[0].value;
      const enchoTargets = row.getElementsByClassName("enchoTarget")[0].getElementsByTagName("input");
      for(const elm of enchoTargets){
        if(elm.checked) newPlanDt[day].enchoTarget = elm.name;
      }
      newPlanDt[day].version = 2;
    }
    const sendParams = {
      a: "sendUsersPlan",
      hid, bid, uid, created: dateStr, item: "timetable",
      content: JSON.stringify(newPlanDt)
    };
    const sendUsersPlanRes = await univApiCall(sendParams, "UTT11", '', setSnack, '送信しました。');
    if(!sendUsersPlanRes?.data?.result) return;
    const newPlanDts = JSON.parse(JSON.stringify(planDts));
    const targetPlanDtIndex = newPlanDts.findIndex(dt => dt.created === dateStr);
    if(targetPlanDtIndex === -1) newPlanDts.push({created: dateStr, content: newPlanDt});
    else newPlanDts[targetPlanDtIndex] = {created: dateStr, content: newPlanDt};
    const newUsers = JSON.parse(JSON.stringify(users));
    const targetUserIndex = newUsers.findIndex(dt => dt.uid === uid);
    const user = newUsers[targetUserIndex];
    user.timetable = newPlanDts;
    setRecentUser("UID"+uid);
    dispatch(setStore({users: newUsers}));
    dispatch(setSnackMsg('更新しました。', '', ''));
    history.push(`/users/timetable/edit/${uid}/`);
  }

  return(
    <>
    <Button
      onClick={handleClick}
      variant="contained" color="primary"
      className="button"
      style={{marginLeft: '12px'}}
    >
      送信
    </Button>
    <SnackMsg {...snack} />
    </>
  )
}

const TimeTableFormRow = () => {
  const schedule = useSelector(state => state.schedule);
  const scheduleTemplate = useSelector(state => state.scheduleTemplate);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const users = useSelector(state => state.users);
  const {uid} = useParams();
  const user = users.find(prevUsers => prevUsers.uid === uid) ?? {};
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const dateStr = query.get('dateStr');
  const timetable = (user.timetable ?? []).find(dt => dt.created === dateStr)?.content ?? {};
  const days = query.get('days').split(",");
  const day = days.includes("holiday") ?"holiday" :days[0];
  const template = days.includes("holiday")
    ?schedule?.["UID"+uid]?.template?.schoolOff ?? scheduleTemplate?.[displayService]?.schoolOff ?? {}
    :schedule?.["UID"+uid]?.template?.weekday ?? scheduleTemplate?.[displayService]?.weekday ?? {};
  const [start, setStart] = useState(timetable[day]?.basisStart ?? template.start ?? "");
  const [end, setEnd] = useState(timetable[day]?.basisEnd ?? template.end ?? "");
  const [enchoTarget, setEnchoTarget] = useState(timetable[day]?.enchoTarget ?? "none");
  const [jikanKubun, setJikanKubun] = useState(0);
  const [enchouShien, setEnchouShien] = useState(0);
  const [holiday, setHoliday] = useState(days.includes("holiday"));

  useEffect(() => {
    if(!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)){
      setJikanKubun(0);
      setEnchouShien(0);
      return;
    }
    const [startHours, startMin] = start.split(":").map(Number);
    const [endHours, endMin] = end.split(":").map(Number);
    const mins = (endHours*60 + endMin) - (startHours*60 + startMin);
    if(mins <= 0) return;
    const useKubun3 = holiday || displayService==="児童発達支援";
    const kubun = getJikanKubunAndEnchou(start, end, useKubun3);
    setJikanKubun(kubun["区分"] ?? 0);
    let enchoMin = 0;
    switch(kubun["区分"]){
      case 1: {
        enchoMin = mins - 90;
        break;
      }
      case 2: {
        enchoMin = mins - 180;
        break;
      }
      case 3: {
        enchoMin = mins - 300;
        break;
      }
    }
    setEnchouShien(() => {
      if(60 <= enchoMin && enchoMin < 120) return 2;
      if(120 <= enchoMin) return 3;
      return 0;
    });
  }, [start, end, holiday]);

  useEffect(() => {
    if(enchouShien===0){
      setEnchoTarget("none");
    }else{
      if(enchoTarget==="none"){
        setEnchoTarget("after");
      }
    }
  }, [enchouShien])

  return(
    <div className="row">
      {displayService!=="児童発達支援" &&<div className="holiday">
        <Checkbox
          name="holiday" color="primary"
          checked={holiday}
          onChange={(e) => setHoliday(e.target.checked)} 
        />
      </div>}
      <div className="time start"><AlbHTimeInput time={start} setTime={setStart} maxTime={end} /></div>
      <div className="time end"><AlbHTimeInput time={end} setTime={setEnd} minTime={start} /></div>
      <div className="enchoTarget">
        <Checkbox
          name="none" color="primary"
          checked={enchoTarget==="none"}
          onChange={(e) => setEnchoTarget(e.target.name)}
          disabled={enchouShien!==0}
        />
        <Checkbox
          name="before" color="primary"
          checked={enchoTarget==="before"}
          onChange={(e) => setEnchoTarget(e.target.name)}
          disabled={enchouShien===0}
        />
        <Checkbox
          name="after" color="primary"
          checked={enchoTarget==="after"}
          onChange={(e) => setEnchoTarget(e.target.name)}
          disabled={enchouShien===0}
        />
      </div>
      <div className="kubun">{jikanKubun ?`区分${jikanKubun}` :""}</div>
      <div className="kubun">{enchouShien ?`延長${enchouShien}` :""}</div>
    </div>
  )
}

const MainForm = () => {
  const classes = useStyles();
  const formRef = useRef();
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  return(
    <div className={classes.timeTableForm} style={{marginTop: '8px'}}>
      <form ref={formRef}>
        <div className="header">
          <div className="row" style={{paddingBottom: '4px', alignItems: 'flex-end'}}>
            {displayService!=="児童発達支援" &&<div className="holiday">休日</div>}
            <div className="time start">開始時間</div>
            <div className="time end">終了時間</div>
            <div className="enchoTarget">
              <div style={{fontSize: '14px', marginBottom: '4px'}}>延長</div>
              <div style={{display: 'flex', fontSize: '16px'}}>
                <div style={{width: '42px'}}>なし</div>
                <div style={{width: '42px'}}>前</div>
                <div style={{width: '42px'}}>後</div>
              </div>
            </div>
            <div className="kubun">時間区分</div>
            <div className="kubun">延長支援</div>
          </div>
        </div>
        <div className="body">
          <TimeTableFormRow />
        </div>
        <div className="buttons" style={{marginTop: '8px'}}>
          <CancelButton />
          <SendButton formRef={formRef} />
        </div>
      </form>
    </div>
  )
}

const UsersTimeTableBatchEdit = () => {
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const {uid} = useParams();
  const history = useHistory();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const dateStr = query.get('dateStr');
  const days = query.get('days').split(",");
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service ?service :serviceItems[0];
  const classroom = useSelector(state => state.classroom);
  const filteredUsers = getFilteredUsers(users, displayService, classroom);
  const user = filteredUsers.find(dt => dt.uid === uid);

  if(!user || (displayService!=="放課後等デイサービス" && displayService!=="児童発達支援")){
    // 利用者がいない場合は、選択画面に戻す。
    history.push("/users/timetable/");
    return null;
  }

  return(
    <>
    <LinksTab menu={usersMenu} />
    <div className={classes.AppPage}>
      <div className="title">計画支援時間一括入力</div>
      <div className="name">{user.name}<span className="sama">さま</span></div>
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <div className="created">作成日<span className="dateStr">{dateStr}</span></div>
        <div className="days">{days.map(day => (<span className="day">{getDayStr(day)}</span>))}</div>
      </div>
      <MainForm />
    </div>
    </>
  )
}
export default UsersTimeTableBatchEdit;