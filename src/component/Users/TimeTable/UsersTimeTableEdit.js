import { Button, Checkbox, IconButton, makeStyles } from "@material-ui/core";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { red, teal, orange, grey } from "@material-ui/core/colors";
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import { brtoLf, getLodingStatus, lfToBr } from "../../../commonModule";
import { UsersTimeTableAddButton, UsersTimeTableGoBackButton, UsersTimeTableInfos, UsersTimeTableVersionSwitch, UsersTimeTableDateChangeButton, UsersTimeTableDeleteButton, UsersTimeTableCreatedInput, UsersTimeTableCopyButton } from "./UsersTimeTableCommon";
import { AlbHMuiTextField, AlbHTimeInput } from "../../common/HashimotoComponents";
import { HOUDAY, JIHATSU } from '../../../modules/contants';
import { setRecentUser, univApiCall } from '../../../albCommonModule';
import { setSnackMsg, setStore } from "../../../Actions";
import { LoadingSpinner } from "../../common/commonParts";
import { getDayStr } from "./UsersTimeTableEditOld";
import { getJikanKubunAndEnchou } from "../../../modules/elapsedTimes";
import SnackMsg from "../../common/SnackMsg";
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import { PlanPrintButton } from "../../plan/planCommonPart";
import { checkValueType } from "../../dailyReport/DailyReportCommon";

const CHECKBOX_PADDING = 6;
const SELECTPAGE_PATH = "/users/timetable/";

const useStyles = makeStyles({
  AppPage: {
    width: '780px',
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
      display: 'flex',
      '& .checkbox': {minWidth: '36px', marginRight: '8px'},
      '& .day': {minWidth: '64px', textAlign: 'start', marginRight: '16px', paddingTop: '8px'},
      '& .holiday': {width: '42px', marginRight: '16px'},
      '& .time': {
        minWidth: '80px', marginRight: '16px',
        '&.start': {marginRight: '16px'}
      },
      '& .enchoTarget': {minWidth: '126px', marginRight: '16px'},
      '& .kubun': {minWidth: '80px', marginRight: '16px', paddingTop: '8px'},
      '& .delete': {minWidth: '40px'}
    },
    '& .header': {
      marginBottom: 12,
      borderBottom: `1px solid ${teal[800]}`,
      '& .holiday, .time': {
        padding: '8px 0',
      },
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
  },
  textField: {
    width: '100%',
    margin: '8px 0'
  },
});

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
  const data = planDt?.content?.[day] ?? {};
  const basisStart = data.basisStart ?? "";
  const basisEnd = data.basisEnd ?? "";
  const enchoTarget = data.enchoTarget ?? "none";
  const jikanKubun = data.jikanKubun ?? 0;
  const enchouShien = data.enchouShien ?? 0;
  const holiday = data.holiday ?? day==="holiday";

  useEffect(() => {
    const newDt = {...data};
    if(enchouShien === 0){
      newDt.enchoTarget = "none";
    }else if(enchoTarget==="none"){
      newDt.enchoTarget = "after";
    }
    setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: newDt, version: 2}}));
  }, [enchouShien, enchoTarget]);

  // 時間が変更されたら時間区分と延長支援を自動更新する。
  useEffect(() => {
    const newDt = {...data};
    if(!/^\d{2}:\d{2}$/.test(basisStart) || !/^\d{2}:\d{2}$/.test(basisEnd)){
      newDt.jikanKubun = 0;
      newDt.enchouShien = 0;
    }else{
      const [startHours, startMin] = basisStart.split(":").map(Number);
      const [endHours, endMin] = basisEnd.split(":").map(Number);
      const mins = (endHours*60 + endMin) - (startHours*60 + startMin);
      if(mins > 0){
        const useKubun3 = holiday || displayService==="児童発達支援";
        const kubun = getJikanKubunAndEnchou(basisStart, basisEnd, useKubun3);
        newDt.jikanKubun = kubun["区分"] ?? 0;
        newDt.enchouShien = (() => {
          const enchouMins = kubun.enchouMins;
          if(60 <= enchouMins && enchouMins < 120) return 2;
          if(120 <= enchouMins) return 3;
          return 0;
        })();
      }
    }
    setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: newDt, version: 2}}));
  }, [basisStart, basisEnd, holiday]);

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
      newDt.holiday = pastData?.holiday ?? day==="holiday";
      if(pastData?.enchoTarget) newDt.enchoTarget = pastData?.enchoTarget;
    }else{
      const template = day==="holiday"
        ?schedule?.["UID"+uid]?.template?.schoolOff ?? scheduleTemplate?.[displayService]?.schoolOff ?? {}
        :schedule?.["UID"+uid]?.template?.weekday ?? scheduleTemplate?.[displayService]?.weekday ?? {};
      newDt.basisStart = template.start ?? "";
      newDt.basisEnd = template.end ?? "";
      newDt.holiday = day==="holiday";
    }
    setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: newDt, version: 2}}));
  }

  // 曜日別で入力した値を削除する。
  const handleClear = () => {
    setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {}, version: 2}}));
  }

  const disabled = Object.values(checkedDt).some(x => x);
  const isInputed = basisStart || basisEnd;
  return(
    <div className="row" name={day}>
      <div className="checkbox">
        <Checkbox 
          color="primary"
          checked={checkedDt[day] ?? false}
          onChange={(e) => setCheckedDt(prevCehckedDt => ({...prevCehckedDt, [day]: e.target.checked}))}
          style={{padding: CHECKBOX_PADDING}}
        />
      </div>
      <div className="day">{dayStr}</div>
      {displayService!=="児童発達支援" &&<div className="holiday">
        <Checkbox
          name="holiday" color="primary"
          checked={holiday}
          onChange={(e) => setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {...prevPlanDt.content[day], holiday: e.target.checked, version: 2}}}))}
          disabled={disabled}
          style={{padding: CHECKBOX_PADDING}}
        />
      </div>}
      <div className="time start">
        <AlbHTimeInput
          time={basisStart}
          setTime={(val) => setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {...prevPlanDt.content[day], basisStart: val, version: 2}}}))}
          maxTime={basisEnd} disabled={disabled}
        />
      </div>
      <div className="time end">
        <AlbHTimeInput
          time={basisEnd}
          setTime={(val) => setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {...prevPlanDt.content[day], basisEnd: val, version: 2}}}))}
          minTime={basisStart} disabled={disabled}
        />
      </div>
      <div className="enchoTarget">
        <Checkbox
          name="none" color="primary"
          checked={enchoTarget==="none"}
          onChange={(e) => setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {...prevPlanDt.content[day], enchoTarget: e.target.name, version: 2}}}))}
          disabled={disabled || enchouShien!==0}
          style={{padding: CHECKBOX_PADDING, margin: '0 3px'}}
        />
        <Checkbox
          name="before" color="primary"
          checked={enchoTarget==="before"}
          onChange={(e) => setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {...prevPlanDt.content[day], enchoTarget: e.target.name, version: 2}}}))}
          disabled={disabled || enchouShien===0}
          style={{padding: CHECKBOX_PADDING, margin: '0 3px'}}
        />
        <Checkbox
          name="after" color="primary"
          checked={enchoTarget==="after"}
          onChange={(e) => setPlanDt(prevPlanDt => ({...prevPlanDt, content: {...prevPlanDt.content, [day]: {...prevPlanDt.content[day], enchoTarget: e.target.name, version: 2}}}))}
          disabled={disabled || enchouShien===0}
          style={{padding: CHECKBOX_PADDING, margin: '0 3px'}}
        />
      </div>
      <div className="kubun" style={{color: disabled ?grey[400] :""}}>{jikanKubun ?`区分${jikanKubun}` :""}</div>
      <div className="kubun" style={{color: disabled ?grey[400] :""}}>{enchouShien ?`延長${enchouShien}` :""}</div>
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
    history.push(`${prefix}/timetable/edit/batch/${uid}/?dateStr=${created}&days=${checkedDays.join(",")}`);
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
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
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
            {displayService!==JIHATSU &&<div className="holiday">休日</div>}
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

const UsersTimeTableEdit = () => {
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
        if(!checkValueType(targetPlanDt.content, "Object")) targetPlanDt.content = {};
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
        if(!checkValueType(latestPlanDt.content, "Object")) latestPlanDt.content = {};
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
export default UsersTimeTableEdit;