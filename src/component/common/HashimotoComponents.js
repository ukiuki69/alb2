import { Button, CircularProgress, Fade, FormControl, IconButton, InputLabel, makeStyles, MenuItem, Select, TextField, withStyles } from '@material-ui/core';
import { grey, red, teal } from '@material-ui/core/colors';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import axios from 'axios';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getTemplate, recentUserStyle, sendPartOfSchedule, sendPartOfScheduleCompt, setRecentUser } from '../../albCommonModule';
import { endPoint, univApiCall } from '../../modules/api';
import { getUisCookie, uisCookiePos, makeUrlSearchParams, convHankaku, formatDate } from '../../commonModule';
import { DAY_LIST, getDataType, getScheduleLockPerDDate, getScheduleUsagePerDDate } from '../../hashimotoCommonModules';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';

import CloseIcon from '@material-ui/icons/Close';
import PictureAsPdfIcon from '@material-ui/icons/PictureAsPdf';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import { useSelector } from 'react-redux';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import CheckIcon from '@material-ui/icons/Check';

// 関数
/**
 * 2ヶ月分参照
 * 指定したdidからみて次に予定があるDidを返す。ない場合はnullを返す。
 * @param {Number} uid 利用者ID
 * @param {String} currentDid 起点とするdid
 * @returns
 */
export const getNextSchedule = async(uid, currentDid, hid, bid, excludesAbsences=false) => {
  const didYear = parseInt(currentDid.slice(1, 5));
  const didMonth = parseInt(currentDid.slice(5, 7)) - 1;
  let didDate = parseInt(currentDid.slice(7, 9));
  const result = {did: null, schDt: {}};
  for(let i=0; i<2; i++){
    const fetchMonth =  didMonth + i;
    const stdDate = formatDate(new Date(didYear, fetchMonth, 1), 'YYYY-MM-DD');
    const params = {a: "fetchSchedule", hid, bid, date: stdDate};
    const res = await univApiCall(params);
    const schedule = res?.data?.dt?.[0]?.schedule;
    if(!checkValueType(schedule, 'Object')) break;
    const sch = schedule["UID"+uid];
    if(!checkValueType(sch, 'Object')) break;
    const lastDate = new Date(didYear, fetchMonth+1, 0).getDate();
    let nextDate = didDate + 1;
    while(nextDate <= lastDate){
      const nextDid = "D" + formatDate(new Date(didYear, fetchMonth, nextDate), 'YYYYMMDD');
      nextDate++;
      const schDt = sch[nextDid];
      if(!checkValueType(schDt, 'Object')) continue;
      if(schDt.noUse) continue;
      if(excludesAbsences && schDt.absence) continue;
      result.did = nextDid;
      result.schDt = schDt;
      break;
    }
    if(result.did) break;
    didDate = 0;
  }
  return result;
}

/**
 * エラーログを送信
 * AnyStateに保存し、itemで調べることになる。
 * itemはメールで通知する。
 * この処理自体に失敗した場合は、エラー内容をメールで送信する。
 * @param {String} hid 法人ID
 * @param {String} bid 事業所ID
 * @param {String} item 識別子
 * @param {Object} errorLog エラー内容などを格納
 */
export const sendErrorLog = async(hid, bid, item, errorLog) => {
  try{
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const sendAnyStateParams = {
      a: "sendAnyState",
      hid, bid, date, item,
      state: JSON.stringify(errorLog),
      keep: 7
    };
    const res = await axios.post(endPoint(), makeUrlSearchParams(sendAnyStateParams));
    if(!res?.data?.result) throw new Error("ErrorLog send Failed");
    // エラーコードをメール通知
    const sendHtmlMailParams = {
      a: 'sendHtmlMail',
      pmail: "albtross.error@gmail.com",
      title: `アルバロトスError ${item}`,
      content: `エラーコード: ${item}`
    };
    axios.post(endPoint(), makeUrlSearchParams(sendHtmlMailParams));
  }catch(error){
    try{
      // エラー内容をメール通知
      const sendHtmlMailParams = {
        a: 'sendHtmlMail',
        pmail: "albtross.error@gmail.com",
        title: `アルバロトスError ${item}`,
        content: (`
          <div>
            <div>hid: ${hid}</div>
            <div>bid: ${bid}</div>
            <div>error: ${JSON.stringify(errorLog)}</div>
          </div>
        `).replaceAll("\n", "")
      };
      axios.post(endPoint(), makeUrlSearchParams(sendHtmlMailParams));
    }catch(error){
      console.log(error);
    }
  }
}

/**
 * メール利用者か確認
 * 
 * @param {Object} user 利用者データ
 * @return {Boolean}
 */
export const checkMailUser = (user) => {
  // メールアドレス未設定
  if(!user.pmail) return false;
  return true;
}

/**
 * LINE利用者か確認
 * 
 * @param {Object} user 利用者データ
 * @param {Object} com 事象書データ
 * @return {Boolean}
 */
export const checkLineUser = (user, com) => {
  // 連絡帳設定でLINEが有効になっているか？
  if(!com?.ext?.settingContactBook?.line) return false;
  // Line認証済みか？
  if(!user?.ext?.line?.auth?.checked) return false;
  // LineIdが存在するか？
  if(!user?.ext?.line?.id) return false;
  return true;
}

//カスタムフック
export const useAlbFetchDt = (params={}, path=null, valueOnError=null, setSnack, defaultValue) => {
  const [data, setData] = useState(undefined);
  useEffect(() => {
    let unmounted = false;
    (async() => {
      const res = await axios.post(endPoint(), makeUrlSearchParams(params));
      if(!res?.data?.result){
        if(setSnack) setSnack({...{msg: 'データの取得に失敗しました。', severity: 'warning'}});
        return;
      }
      let resDt = res.data.dt[0];
      let pathList = [];
      const pathDtType = getDataType(path);
      if(pathDtType === 'string') pathList = path.split(".");
      else if(pathDtType === 'array') pathList = [...path];
      resDt = pathList.reduce((result, path) => {
        if(result === null || !result[path]) return null;
        return result[path];
      }, {...resDt});
      const resultRes = resDt ?resDt :defaultValue ?defaultValue :valueOnError;
      console.log("resultRes", resultRes)
      if(!unmounted){
        setData(resultRes);
        console.log("fetched useAlbFetchDt")
      }
    })();
    return () => { unmounted = true; };
  }, []);
  return [data, setData];
}

export const useFetchAlbDt = (params={}, pathList=[], resDtTypeIsArray=false, valueOnNoneDt, setSnack, defaultValue) => {
  const [data, setData] = useState(defaultValue);
  useEffect(() => {
    let unmounted = false;
    (async() => {
      const res = await axios.post(endPoint(), makeUrlSearchParams(params));
      if(!res?.data?.result){
        // APIコール失敗
        if(setSnack){
          setSnack({msg: 'データの取得に失敗しました。', severity: 'warning', id: new Date().getTime()});
        }
        return;
      }
      const fetchDt = resDtTypeIsArray ?res?.data?.dt :res?.data?.dt?.[0];
      const data = pathList.reduce((result, path) => { return result?.[path] }, fetchDt);
      if(!unmounted){
        setData(data ?? valueOnNoneDt);
      }
    })();
    return () => { unmounted = true; };
  }, []);

  return [data, setData];
}

/**
 * ステートが更新されるたびにローカルストレージに値を保存する。
 * @param {*} initialState ローカルストレージに値がない時に使われる初期値
 * @param {String} localStorageKey ローカルストレージのkey
 * @returns
 */
export const useLocalStorageState = (initialState, localStorageKey) => {
  const [state, setState] = useState(
    localStorage.getItem(localStorageKey)
      ?JSON.parse(localStorage.getItem(localStorageKey))
      :initialState
  );

  useEffect(() => {
    if(!localStorageKey) return;
    localStorage.setItem(localStorageKey, JSON.stringify(state));
  }, [state]);

  return [state, setState];
}

/**
 * ステートが更新されるたびにセッションストレージに値を保存する。
 * @param {*} initialState セッションストレージに値がない時に使われる初期値
 * @param {String} localStorageKey セッションストレージのkey
 * @returns
 */
export const useSessionStorageState = (initialState, sessionStorageKey) => {
  const [state, setState] = useState(() => {
    try{
      return sessionStorage.getItem(sessionStorageKey) 
        ?JSON.parse(sessionStorage.getItem(sessionStorageKey))
        :initialState
    }catch{
      return initialState;
    }
  });

  useEffect(() => {
    if(!sessionStorageKey) return;
    sessionStorage.setItem(sessionStorageKey, JSON.stringify(state));
  }, [state]);

  return [state, setState];
}

export const useMoveOnDragElement = (argPosition, onMove, rangeLimit={}) => {
  const {minX, maxX, minY, maxY} = rangeLimit;
  const [state, setState] = useState(null);

  const startDrag = useCallback((e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setState({
      originalPosition: {
        x: argPosition.x ?? e.clientX,
        y: argPosition.y ?? e.clientY
      },
      startCursor: {
        x: e.clientX,
        y: e.clientY
      }
    });
  }, [argPosition.x, argPosition.y]);

  const dragging = useCallback((e) => {
    if (state === null) return;
    let positionX = e.clientX;
    if(minX && positionX < minX) positionX = minX;
    if(maxX && positionX > maxX) positionX = maxX;
    let positionY = e.clientY;
    if(minY && positionY < minY) positionY = minY;
    if(maxY && positionY > maxY) positionY = maxY;
    onMove({
      x: state.originalPosition.x + positionX - state.startCursor.x,
      y: state.originalPosition.y + positionY - state.startCursor.y
    });
  }, [state, onMove, rangeLimit, minX, maxX, minY, maxY]);

  const endDrag = useCallback((e) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setState(null);
    if (state === null) return;
    let positionX = e.clientX;
    if(minX && positionX < minX) positionX = minX;
    if(maxX && positionX > maxX) positionX = maxX;
    let positionY = e.clientY;
    if(minY && positionY < minY) positionY = minY;
    if(maxY && positionY > maxY) positionY = maxY;
    onMove({
      x: state.originalPosition.x + positionX - state.startCursor.x,
      y: state.originalPosition.y + positionY - state.startCursor.y
    });
  }, [state, onMove, rangeLimit, minX, maxX, minY, maxY]);

  return {
    onPointerDown: startDrag,
    onPointerMove: dragging,
    onPointerUp: endDrag,
    dragging: state !== null
  };
};

export const useGetScheduleTemplate = (uid, did, service) => {
  const scheduleTemplate = useSelector(state => state.scheduleTemplate);
  const storeService = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const dateList = useSelector(state => state.dateList);
  const users = useSelector(state => state.users);
  const user = users.find(user => user.uid === uid);
  const userService = (user?.service ?? "").split(",")?.[0];

  const schService = service || storeService || userService || serviceItems[0];
  const didYear = parseInt(did.slice(1, 5));
  const didMonth = parseInt(did.slice(5, 7));
  const didDate = parseInt(did.slice(7, 9));
  const didDateObj = new Date(didYear, didMonth - 1, didDate);
  const offSchool = dateList.find(dateDt => dateDt.date.getTime() === didDateObj.getTime())?.offSchool;
  // 予定データがない場合は利用なしとして新規予定データを作成
  const templateSchDt = scheduleTemplate?.[schService]?.[offSchool ?"schoolOff" :"weekday"];

  return templateSchDt;
}

export const useDeleteSchDt = () => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);

  const deleteSchDt = async(uid, did, sch) => {
    try{
      const uidStr = "UID" + uid;
      const newSch = JSON.parse(JSON.stringify(sch));
      if(newSch[did]) delete newSch[did];
      const params = {
        hid, bid, date: stdDate,
        uid: uidStr,
        partOfSch: {[uidStr]: newSch, deleteDid: did}
      };
      const res = await sendPartOfScheduleCompt(params);
      if(!res?.data?.result){
        throw new Error("deleteSchDt failed");
      }
      return {result: true, newSch};
    }catch(error){
      console.error("deleteSchDt error", error);
      return {result: false, newSch: null};
    }
  }

  return deleteSchDt;
}

export const useGetClassroomList = () => {
  const users = useSelector(state => state.users);
  const classroomList = [...new Set(users.map(user => user.classroom).filter(classroom => classroom))];
  return classroomList;
}

const useStyles = makeStyles({
  calendar: {
    width: 'fit-content', backgroundColor: '#fff',
    '@media print':{display: 'none'},
    '& .header, .body': {
      fontSize: 12,
      '& .calendarRow': {
        display: 'flex',
        '& .cell': {
          width: 40, padding: 4, margin: 1, cursor: 'pointer',
          position: 'relative',
          '& .content': {
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          },
          '& .scheduleUsage': {
            display: 'flex', flexWrap: 'wrap', position: 'absolute', bottom: 0,
            '& .icon': {fontSize: 8, color: teal[200]},
          },
          '& .locked': {
            position: 'absolute', top: 0, left: 0,
            borderBottom: '10px solid transparent', borderLeft: '10px solid #00695C88'
          }
        }
      },
    },
    '& .header': {
      '& .calendarRow': {
        '& .cell': {
          height: 24,
          position: 'relative',
          backgroundColor: teal[800], color: '#eee'
        }
      },
    },
    '& .body': {
      '& .calendarRow': {
        '& .cell': {
          height: 40,
        }
      },
    },
  },
  addSchDailyByUserSelect: {
    position: 'relative',
    width: 280,
    '& .select': {width: 208},
    '& .addButton': {
      position: 'absolute', 
      '& .MuiSvgIcon-root': {fontSize: '2.4rem', },
    },
  },
  DraggableWindow: {
    position: 'fixed', top: 0, left: 0,
    '& .draggableWindowHeader': {
      position: 'relative',
      color: '#fff', fontSize: 14,
      padding: '12px 12px 10px 12px', backgroundColor: teal[800],
      borderRadius: '8px 8px 0 0',
    },
    '& .draggableWindowBody': {
      padding: '12px 12px 62px', backgroundColor: '#fff',
      border: `2px solid ${teal[800]}`, borderRadius: '0 0 8px 8px',
    },
    '& .actions': {
      height: 64,
      position: 'absolute', bottom: 0, left: 0,
      padding: 12
    },
    '& .closeButton': {
      position: 'absolute', top: 1, right: 2,
      padding: 6,
    }
  }
});

//コンポーネント
export const Calendar = (props) => {
  const classes = useStyles();
  const {allState={}, date, setDate, setDay, cellWidth=40, cellHeight=40 , style} = props;
  const {stdDate, dateList, schedule, users, service, classroom} = allState;
  const [selected, setSeleced] = useState((() => {
    if(date) return date;
    else if(!Object.keys(allState).length) return 1;
    const displayDateList = stdDate.split("-").map(strDate => parseInt(strDate));
    const now = new Date();
    return displayDateList[0] === now.getFullYear() && displayDateList[1] === now.getMonth()+1
      ?now.getDate() :1;
  })());

  if(!Object.keys(allState).length){
    console.log("CalendarConponentError: propsにallStateありません。");
    return null;
  }else if(!dateList.length){
    console.log("CalendarConponentError: allStateからdateListを取得できませんでした。");
    return null;
  }

  const scheduleUsagePerDDate = getScheduleUsagePerDDate(stdDate, schedule, users, service, classroom);
  const scheduleLockPerDDate = getScheduleLockPerDDate(stdDate, schedule, users, service, classroom);

  //曜日ごとに日付データを分別（２次元配列）
  const dateDtByDayList = dateList.reduce((result, dateDt) => {
    const day = dateDt.date.getDay();
    result[day].push(dateDt);
    return result;
  }, [...DAY_LIST.map(()=>[])]);

  //１ヶ月の中で一番多い曜日の日数を取得
  const maxLengthOfDay = dateDtByDayList.reduce((result, x) => (
    result<x.length ?x.length :result, 0
  ));

  //一番多い曜日の日数になるように配列を調整
  const calenderList = dateDtByDayList.map((x, index) => 
    x[0].date.getDate() > index+1
      ?x.length+1 < maxLengthOfDay ?[{}, ...x, {}] :[{}, ...x]
      :x.length < maxLengthOfDay ?[...x, {}] :x
  );

  //日付順に配列を整形
  const calenderjei = calenderList.reduce((result, x) => {
    x.forEach((y, index) => result[index].push(y))
    return result
  }, [...calenderList.map(()=>[])]);

  //カレンダーの曜日タイトル要素
  const headerNode = DAY_LIST.map((dayStr, i) => (
    <div className="cell" key={"headerCell"+i}>
      <div className="content">{dayStr}</div>
    </div>
  ));

  //メイン要素
  const calenderNodes = calenderjei.map((week, j) => {
    const one_week = week.map((dateDt, i) => {
      const newDate = dateDt.date;
      let year="", month="", date="", day="";
      if(newDate){
        year = newDate.getFullYear();
        month = newDate.getMonth();
        date = newDate.getDate();
        day = DAY_LIST[newDate.getDay()];
      }
      const handleClick = () => {
        if(props.handleClick) props.handleClick(date);
        if(setDate) setDate(date);
        if(setDay) setDay(day);
        setSeleced(date);
      };
      const holiday = dateDt.holiday ?dateDt.holiday :"";
      const holidayColor = (() => {
        if(holiday === 1) return "#f8e3cb";
        else if(holiday === 2) return "#cacad9";
        else return null;
      })();
      const selectedStyle = selected===date ?{border: `2px ${teal[500]} solid`} :{border: '2px solid transparent'};
      const cellStyle = {width: cellWidth, height: cellHeight, backgroundColor: holidayColor};
      const dDate = "D"+String(year)+String(month+1).padStart(2, "0")+String(date).padStart(2, "0");
      const usage = scheduleUsagePerDDate[dDate] ?scheduleUsagePerDDate[dDate] :0;
      const quotient = usage <= 15 ?Math.floor(usage / 5) :3;
      const division = usage <= 15 ?usage % 5 :0;
      const locked = scheduleLockPerDDate[dDate]; //スケジュールロックの状態をdid別に取得（scheduleのUID配下のdidに１つでもロックされた予定があればtrue）
      return(
        <div className='cell' style={{...cellStyle, ...selectedStyle}} key={"dateCell"+i} onClick={handleClick}>
          <div className="content">{date}</div>
          <div className='scheduleUsage'>
            {Array(quotient).fill("").map((_,i) => <FiberManualRecordIcon className='icon gray' key={i}/>)}
            {division !== 0 ?<RadioButtonUncheckedIcon className='icon'/> :null}
          </div>
          {locked &&<div className='locked'/>}
        </div>
      )
    })

    return(
      <div className='calendarRow' key={"weekRow"+j}>
        {one_week}
      </div>
    )
  });

  return(
    <div className={classes.calendar} style={style}>
      <div className='header'>
        <div className='calendarRow'>{headerNode}</div>
      </div>
      <div className='body'>
        {calenderNodes}
      </div>
    </div>
  )
}

export const AddSchDailyByUserSelect = (props) => {
  const classes = useStyles();
  const {
    allState, scheduleState, setScheduleState, dDate, setSnack,
    permissionLimit=false, permission=0,
    style={},
  } = props;
  const {users, dateList, hid, bid, stdDate, service, serviceItems, classroom} = allState;
  const isMultService = serviceItems.length > 1;
  const classroomList = useGetClassroomList();
  const isMultClassroom = classroomList.length > 1;
  const [selectedUidStr, setSelectedUidStr] = useState('');

  let userIndex = 0;
  const noneSchDailyUserNameMenuItems = Object.keys(scheduleState).reduce(
    (result, uidStr, i) => {
      if(!/^UID[0-9]+?$/.test(uidStr)) return result;
      const scheduleDt = scheduleState[uidStr];
      if(scheduleDt[dDate]) return result;
      const userDt = users.find(uDt => "UID"+uDt.uid === uidStr);
      if(userDt){
        if(
          !(service==="" || userDt.service===service) ||
          !(classroom==="" || userDt.classroom===classroom)
        ) return result;
        userIndex++;
        const recentStyle = recentUserStyle(userDt.uid);
        result.push(
          <MenuItem value={uidStr} key={i} style={recentStyle}>
            <span style={{marginRight: 8}}>{userIndex}</span>{userDt.name}
          </MenuItem>
        );
      }
      return result;
    }, []
  );

  const handleChange = (e) => {
    setSelectedUidStr(e.target.value);
  }

  const handleClick = () => {
    if(props.handleClick) props.handleClick(selectedUidStr);
    const newSchedule = JSON.parse(JSON.stringify(scheduleState));
    const usch = {...JSON.parse(JSON.stringify(newSchedule[selectedUidStr]))};
    const targetDateDt = dateList.find(dateDt => {
      const date = new Date(dateDt.date);
      const targetDDate = "D" +
        String(date.getFullYear()) +
        String(date.getMonth()+1).padStart(2, '0') +
        String(date.getDate()).padStart(2, '0');
      return targetDDate === dDate;
    });
    const holiday = targetDateDt ?targetDateDt.holiday :0;
    // getTemplateにdid追加しようと思ったがやっぱやめ
    const tempSchedule = getTemplate(allState, usch, selectedUidStr/*, dDate*/);
    usch[dDate] = holiday===1 ?tempSchedule.schoolOff :tempSchedule.weekday;
    // タイムスタンプ付与
    usch[dDate].timestamp = new Date().getTime();
    const params = {hid, bid, date: stdDate, partOfSch: {[selectedUidStr]: usch}};
    console.log("usch[dDate]", usch[dDate]);
    sendPartOfSchedule(params).then(res => {
      if(res.data.result){
        newSchedule[selectedUidStr] = {...usch};
        setRecentUser(selectedUidStr);
        setScheduleState({...newSchedule});
        setSelectedUidStr('');
        setSnack({...{msg: '予定を追加しました。', severity: '', id: new Date().getTime()}});
      }else{
        setSnack({...{msg: '予定追加に失敗しました。', severity: 'error', id: 0}});
      }
    });
  }

  const permissionLimitStyle = permission<70 || permissionLimit ?{display: 'none'} :{};

  const disabled = (isMultService && !service) || (isMultClassroom && !classroom) || props.disabled;
  return(
    <div
      className={classes.addSchDailyByUserSelect}
      style={{...permissionLimitStyle, ...style}}
      onClick={() => {
        if(disabled && setSnack){
          const msg = (isMultService && !service)
            ? "サービスを切り替えてください。"
            :(isMultClassroom && !classroom)
              ? "単位を切り替えてください。"
              :"追加できません。";
          setSnack({msg, severity: 'warning', id: new Date().getTime()});
          return;
        }
      }}
    >
      <FormControl
        variant='standard' className='select'
      >
        <InputLabel>追加する利用者</InputLabel>
        <Select
          value={selectedUidStr}
          onChange={handleChange}
          disabled={disabled}
        >
          <MenuItem value={''}>　</MenuItem>
          {noneSchDailyUserNameMenuItems}
        </Select>
      </FormControl>
      <IconButton
        disabled={selectedUidStr==='' || disabled}
        className='addButton'
        color='primary'
        onClick={handleClick}
      >
        <AddCircleOutlineIcon />
      </IconButton>
    </div>
  )
}

export const AlbHMuiTextField = (props) => {
  const classes = useStyles();
  const {
    id, label, placeholder, name, value, setValue, defaultValue,
    InputLabelProps, InputProps, inputProps,
    error, helperText, disabled,
    color, variant, style, width=null, size,
    multiline, maxRows, minRows, rows, rowsMax,
    onChange, onBlur, onFocus,
    autoCompleteParams,required,
  } = props;

  const handleChange = (e) => {
    if(setValue) setValue(e.target.value);
    if(onChange) onChange(e);
  }

  const handleBlur = (e) => {
    if(onBlur) onBlur(e); 
  }

  const handleFocus = (e) => {
    if(parseInt(getUisCookie(uisCookiePos.selectInputAuto))){
      e.target.select();
    }
    if(onFocus) onFocus(e);
  }

  const params = {
    id, label, placeholder, name, value, defaultValue,
    InputLabelProps, InputProps, inputProps,
    error, helperText, disabled,
    color, variant, size,
    multiline, maxRows, minRows, rows, rowsMax,
    ...autoCompleteParams,
    onChange: handleChange,
    onBlur: handleBlur,
    onFocus: handleFocus,
    required, // 追加 2025/08/20 吉村
  };

  return(
    <TextField
      {...params}
      style={{width, ...style}}
      className={`${classes.textField} ${props.className}`}
    />
  )
}

export const AlbHMuiTextField2 = withStyles({
  root: ({rootStyle}) => ({
    height: '70px',
    display: 'flex', alignItems: 'flex-satrt',
    '& .nami': {
      margin: '24px 12px 0 8px'
    },
    ...rootStyle
  })
})((props) => {
  const {
    classes,
    selectInputAuto=true, setValue,
    className, onChange, onFocus,
    ...textFieldProps
  } = props;

  const handleChange = (e) => {
    if(setValue) setValue(e.target.value);
    if(onChange) onChange(e);
  }

  const handleFocus = (e) => {
    if(selectInputAuto && parseInt(getUisCookie(uisCookiePos.selectInputAuto))) e.target.select();
    if(onFocus) onFocus(e);
  }

  return(
    <TextField
      className={`${classes.root} ${className || ""}`}
      onChange={handleChange} onFocus={handleFocus}
      {...textFieldProps}
    />
  )
});

export const AlbHButton = withStyles({
  root: ({rootStyle}) => ({
    width: '112px', alignSelf: 'baseline',
    position: 'relative',
    "@media (max-width:600px)": {
      fontSize: '12px',
      width: '88px',
      padding: '4px 10px'
    },
    ...rootStyle
  }),
  loadingProgress: ({loadingProgressStyle}) => ({
    position: 'absolute', top: '50%', left: '50%',
    marginTop: '-12px', marginLeft: '-12px',
    ...loadingProgressStyle
  }),
  loadingCompleted: ({loadingCompletedStyle}) => ({
    color: teal[800],
    position: 'absolute', top: '50%', left: '50%',
    marginTop: '-12px', marginLeft: '-12px',
    ...loadingCompletedStyle
  })
})((props) => {
  const {
    classes, children,
    label, loading=false,
    className, disabled,
    rootStyle, loadingProgress, loadingCompletedStyle,
    ...buttonProps
  } = props;
  const isFirstRendering = useRef(true);

  const [loadingCompleted, setLoadingCompleted] = useState(false);
  useEffect(() => {
    if(isFirstRendering.current){
      isFirstRendering.current = false;
      return;
    }
    if (loading === false) {
      setLoadingCompleted(true);
      const timer = setTimeout(() => {
        setLoadingCompleted(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  return(
    <Button
      className={`${classes.root} ${className || ""}`}
      disabled={disabled || loading || loadingCompleted}
      {...buttonProps}
    >
      {children || label}
      <Fade in={loading}>
        <CircularProgress size={24} className={classes.loadingProgress} />
      </Fade>
      <Fade in={loadingCompleted}>
        <CheckIcon className={classes.loadingCompleted} />
      </Fade>
    </Button>
  )
});

export const TimeInput = (props) => {
  const {textFieldProps={}, pairedStartTime="", pairedEndTime="", defaultValue="", minMins=0} = props;
  const [text, setText] = useState(textFieldProps.value ?? defaultValue);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const ptn = /^(0[0-9]|1[0-9]|2[0-3]|[0-9]):[0-5][0-9]$/;

  useEffect(() => {
    setText(textFieldProps.value);
  }, [textFieldProps.value])

  useEffect(() => {
    if(!text) return;
    let errMsg = ""
    if(ptn.test(text) && ptn.test(pairedStartTime)){
      if(text <= pairedStartTime) errMsg = '不正です。';
      const [startHours, startMinutes] = pairedStartTime.split(":");
      const startMins = parseInt(startHours || "0")*60 + parseInt(startMinutes || "0");
      const [endHours, endMinutes] = text.split(":");
      const endMins = parseInt(endHours || "0")*60 + parseInt(endMinutes || "0");
      if(endMins-startMins < minMins) errMsg = '不正です。';
    }
    if(ptn.test(text) && ptn.test(pairedEndTime)){
      if(text >= pairedEndTime) errMsg = '不正です。';
      const [startHours, startMinutes] = text.split(":");
      const startMins = parseInt(startHours || "0")*60 + parseInt(startMinutes || "0");
      const [endHours, endMinutes] = pairedEndTime.split(":");
      const endMins = parseInt(endHours || "0")*60 + parseInt(endMinutes || "0");
      if(endMins-startMins < minMins) errMsg = '不正です。';
    }
    if(errMsg){
      setErrorMessage(errMsg);
      setError(true);
    }else{
      setErrorMessage("");
      setError(false);
    }
  }, [text, pairedStartTime, pairedEndTime])

  const handleBlur = (e) => {
    let value = e.target.value;
    value = convHankaku(value);
    value = value.replaceAll(" ", "");
    // 値がないまたは空文字の場合、初期値を設定
    if(!value){
      setText("");
      if(props.handleBlur) props.handleBlur(value);
      setErrorMessage("");
      setError(false);
      return;
    }
    // 数字のみ場合、コロンを追加
    if(/^[0-9]{4}$/.test(value) && !value.includes(':')){
      value = value.slice(0, 2) + ":" + value.slice(2, 4);
    }
    // コロンが含まれている時は、ゼロパディング
    if(value.includes(':')){
      const [minutes, seconds] = value.split(":");
      value = minutes.padStart(2 , '0') + ":" + seconds.padStart(2, '0');
    }
    setText(value);
    if(props.setValue) props.setValue(value)

    let errMsg = "";
    if(!ptn.test(value)) errMsg = '不正です。';
    else if(pairedStartTime && value<=pairedStartTime) errMsg = '不正です。';
    else if(pairedEndTime && value>=pairedEndTime) errMsg = '不正です。';
    
    if(errMsg){
      setErrorMessage(errMsg);
      setError(true);
    }else{
      setErrorMessage("");
      setError(false);
    }

    if(props.handleBlur) props.handleBlur(value);
  }

  const albHMuiTextFieldProps = {
    value: text ?? "", setValue: setText, error, helperText: errorMessage,
    onBlur: handleBlur,
    disabled: props.disabled,
    ...textFieldProps,
  }
  return(
    <AlbHMuiTextField {...albHMuiTextFieldProps}/>
  )
}

/**
 * AlbHTimeInput コンポーネントは、時間入力用のカスタムテキストフィールドを提供します。
 * ユーザーが入力した時間を整形し、バリデーションを行います。
 * 日本語や全角数字にも対応しており、入力した時間を適切な形式に変換します。
 *
 * @param {Object} props - コンポーネントに渡されるプロパティ。
 * @param {string} [props.label="時間"] - テキストフィールドのラベル。デフォルトは「時間」。
 * @param {string} [props.defaultTime="00:00"] - 初期表示される時間値。デフォルトは空文字列。
 * @param {boolean} [props.hide=false] - コンポーネントを非表示にするかどうか。`true`の場合、テキストフィールドが隠れます。デフォルトは `false`。
 * @param {number} [props.width=80] - テキストフィールドの幅。デフォルトは80。
 * @param {string} [props.time] - 外部から渡される時間値。未指定の場合は `defaultTime` が使用されます。
 * @param {Function} [props.setTime] - 親コンポーネントに時間を渡すためのコールバック関数。時間が変更されるたびに呼び出されます。
 *
 * @returns {React.Element} 時間入力フィールドをレンダリングします。
 *
 * @example
 * <AlbHTimeInput 
 *   label="開始時間" 
 *   defaultTime="12:00" 
 *   hide={false} 
 *   width={100} 
 *   setTime={(time) => console.log("選択された時間:", time)} 
 * />
 */
export const AlbHTimeInput = (props) => {
  const {label, defaultTime="00:00", hide=false, width=80, maxTime, minTime, ...etcProps} = props;
  const [time, setTime] = useState(defaultTime);
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    if(!/^[\d\uFF10-\uFF19]*([:：][\d\uFF10-\uFF19]*)?$/.test(value)) return;
    if(!/^[\d\uFF10-\uFF19]{0,4}$/.test(value.replace(/[:：]/g, ""))) return;
    setTime(value);
    if(props.setTime) props.setTime(value);
  }

  const handleBlur = (e) => {
    const value = e.target.value;
    if(!value) return;
    const halfWidthValue = value.replace(/[\uFF10-\uFF19：]/g, function(char) {
      // 全角数字を半角数字に変換
      if (char >= '\uFF10' && char <= '\uFF19') {
        return String.fromCharCode(char.charCodeAt(0) - 0xFF10 + 0x30);
      }
      // 全角の「：」を半角の「:」に変換
      if (char === '：') {
        return ':';
      }
    });
    let padStartedValue = halfWidthValue;
    if(padStartedValue.includes(":")) padStartedValue = padStartedValue.padStart(5, '0');
    else padStartedValue = padStartedValue.padStart(4, '0');
    let [hours="", minutes=""] = padStartedValue.split(":");
    while(hours.length >= 3){
      minutes = hours.slice(-1) + minutes;
      hours = hours.slice(0, -1);
    }
    while(minutes.length >= 3){
      hours = hours + minutes.slice(0, 1);
      minutes = minutes.slice(1);
    }
    const adjustedValue = hours.padStart(2, "0") + ":" + minutes.padStart(2, "0");
    console.log(adjustedValue)
    setError(!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(adjustedValue));
    setTime(adjustedValue);
    if(props.setTime) props.setTime(adjustedValue);
    if((maxTime && adjustedValue > maxTime) || (minTime && adjustedValue < minTime)) setError(true);
  }

  return(
    <AlbHMuiTextField
      label={label}
      value={props.time ?? time}
      onChange={handleChange}
      onBlur={handleBlur}
      width={width}
      error={error}
      helperText={error ?"時刻が不正" :""}
      style={{...props.style, visibility: hide ?"hidden" :"visible"}}
      {...etcProps}
    />
  )
}

export const TimePickers = withStyles({
  root: ({rootStyle}) => ({
    height: '70px',
    display: 'flex', alignItems: 'flex-satrt',
    '& .nami': {
      margin: '24px 12px 0 8px'
    },
    ...rootStyle
  })
})((props) => {
  const {
    classes, rootName,
    startLabel="開始時間", endLabel="終了時間",
    startName="start", endName="end",
    defaultStart="10:00", defaultEnd="17:00",
    start, setStart, end, setEnd,
    ...textFieldProps
  } = props;
  return(
    <div className={classes.root} name={rootName}>
      <AlbHTimeInput
        name={startName} label={startLabel}
        defaultTime={defaultStart}
        time={start} setTime={setStart} maxTime={end}
        {...textFieldProps}
      />
      <div className='nami'>〜</div>
      <AlbHTimeInput
        name={endName} label={endLabel}
        defaultTime={defaultEnd}
        time={end} setTime={setEnd} minTime={start}
        {...textFieldProps}
      />
    </div>
  )
});


export const DraggableWindow = (props) => {
  const {
    defaultPositionX=0, defaultPositionY=0,
    headerTitle="ヘッダータイトル",
    open=false, onClose,
    actionsComponent
  } = props;
  const classes = useStyles();
  const [position, setPosition] = useState({x: defaultPositionX, y: defaultPositionY});
  const drag = useMoveOnDragElement(position, setPosition);

  const handleClose = (event) => {
    if(onClose) onClose();
  }

  return(
    <div
      className={classes.DraggableWindow}
      style={{
        display: open ?'block' :'none',
        ...props.style,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
    >
      <div
        onPointerDown={drag.onPointerDown}
        onPointerMove={drag.onPointerMove}
        onPointerUp={drag.onPointerUp}
      >
        <div className='draggableWindowHeader'>
          {headerTitle}
          <span style={{opacity: 0.25}}>（ドラッグ移動可能）</span>
        </div>
        <div
          className='draggableWindowBody'
        >
          {props.children}
        </div>
      </div>
      {actionsComponent &&<div className='actions'>
        {actionsComponent}
      </div>}
      <IconButton
        onClick={handleClose}
        className='closeButton'
      >
        <CloseIcon style={{color: '#fff'}} />
      </IconButton>
    </div>
  )
}


export const ToolTip = withStyles({
  root: ({placement, align, style={}}) => ({
    position: 'fixed',
    padding: '6px',
    backgroundColor: teal[800], borderRadius: '4px',
    fontSize: '10px', color: '#fff', textAlign: 'center',
    visibility: 'hidden', opacity: 0,
    zIndex: 999,
    '&.hover': {
      visibility: "visible", opacity: 1,
      marginTop: placement==="top" ?"-10px" :null,
      marginBottom: placement!=="top" ?"-10px" :null,
    },
    // '&::before': {
    //   content: '""',
    //   position: 'absolute',
    //   width: 0, height: 0,
    //   borderStyle: 'solid',
    //   borderWidth: placement === "top" ? '6px 6px 0 6px' : '0 6px 6px 6px',
    //   borderColor: placement === "top"
    //     ? `${teal[800]} transparent transparent transparent`
    //     : `transparent transparent ${teal[800]} transparent`,
    //   left: '50%',
    //   transform: 'translateX(-50%)',
    //   bottom: placement !== "top" ? '100%' : null,
    //   top: placement !== "top" ? null : '100%',
    // },
    ...style
  })
})((props) => {
  const {classes, text, placement, elementRef, align="center", style={}} = props;
  const toolTipRef = useRef(null);
  const [position, setPosition] = useState({x: null, y: null});
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    const toolTip = toolTipRef.current;

    if(!element || !toolTip) return;

    const handleMouseEnter = () => {
      setIsHovering(true);
      const rectA = element.getBoundingClientRect();
      const rectB = toolTip.getBoundingClientRect();
      let centerX = null;
      if(align === "start"){
        centerX = rectA.left;
      }else{
        centerX = rectA.left + rectA.width / 2 - rectB.width / 2;
      }
      const centerY = placement==="top" ?rectA.top - rectB.height :rectA.top + rectA.height;
      setPosition({ x: centerX, y: centerY});
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    // クリーンアップ処理
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [elementRef, toolTipRef]);

  return(
    <div
      ref={toolTipRef}
      className={`${classes.root} ${isHovering ?"hover" :""}`}
      style={{left: position.x, top: position.y}}
    >
      {Boolean(text) &&<div>{text}</div>}
      {props.children}
    </div>
  )
});


export const PdfCard = withStyles({
  root: ({rootStyle}) => ({
    width: 'fit-content',
    display: 'flex', alignItems: 'center',
    backgroundColor: grey[300], borderRadius: '8px',
    padding: '4px 8px',
    cursor: 'pointer',
    '&:hover': {backgroundColor: grey[400]},
    '& .fileName': {
      fontSize: '14px', lineHeight: '1.4rem',
      overflow: "hidden",
      textOverflow: "ellipsis",
      margin: '0 4px'
    },
    ...rootStyle
  })
})((props) => {
  const {classes, pdf, onDelete, url, noLabel=false, ...rootProps} = props;

  const handleClick = () => {
    if(pdf){
      const fileUrl = URL.createObjectURL(pdf);
      window.open(fileUrl, '_blank');
      return;
    }
    if(url){
      window.open(url, '_blank');
      return;
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation();
    if(onDelete) onDelete(e);
  }

  let name = "ファイル名";
  if(pdf) name = pdf.name;
  else if(url) name = url.split("/").at(-1);
  return(
    <div className={classes.root} onClick={handleClick} {...rootProps}>
      <PictureAsPdfIcon style={{color: grey[700], fontSize: 24}} />
      {!noLabel &&<div className='fileName'>{name}</div>}
      {Boolean(onDelete) &&(
        <IconButton onClick={handleDelete} style={{padding: '4px'}}>
          <HighlightOffIcon style={{color: red[600]}}/>
        </IconButton>
      )}
    </div>
  )
});

export const DotLoading = withStyles({
  root: {
    display: 'flex', alignItems: 'center',
    color: grey[500], fontWeight: 'bold', fontSize: '12px',
    '& > span': {
      width: '6px', height: '6px',
      margin: '0px 2px',
      borderRadius: '50%',
      backgroundColor: grey[500],
      animation: '$loading_anime 1s linear 0s infinite normal both',
      '&:nth-of-type(2)': {
        animationDelay: '0.2s',
      },
      '&:nth-of-type(3)': {
        animationDelay: '0.4s',
      }
    }
  },
  '@keyframes loading_anime': {
    '0%': {
      transform: 'scale(0)'
    },
    '25%': {
      transform: 'scale(1)'
    },
    '50%': {
      transform: 'scale(1)'
    },
    '75%': {
      transform: 'scale(1)'
    },
    '100%': {
      transform: 'scale(0)'
    }
  },
})((props) => {
  const {classes, text="", ...rootProps} = props;

  return(
    <div className={classes.root}>
      {text}
      <span />
      <span />
      <span />
    </div>
  )
});

export const safeJsonParse = (str, defaultValue=null) => {
  try{
    return JSON.parse(str);
  }catch(e){
    return defaultValue;
  }
}

export const sendMail = async(mailAddress, from="noreply", bcc="", replyto="", title="", content="", attachFile=[]) => {
  const params = {
    a: 'sendHtmlMail',
    pmail: mailAddress, bcc, replyto, from,
    title, content
  };
  if(checkValueType(attachFile, 'Array')) params.attachFile = JSON.stringify(attachFile);
  try{
    const res = await univApiCall(params);
    if(!res?.data?.result){
      console.log("メール送信失敗", res);
      return false;
    }
    return true;
  }catch(error){
    console.log("メール送信失敗", error);
    return false;
  }
}