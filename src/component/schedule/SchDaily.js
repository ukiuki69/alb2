import { Button, Checkbox, FormControlLabel, makeStyles, Switch, TextField, useMediaQuery } from '@material-ui/core';
import { blue, grey, red, teal } from '@material-ui/core/colors';
import DriveEtaIcon from '@material-ui/icons/DriveEta';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { convHankaku, getLodingStatus, getUisCookie, parsePermission, setUisCookie, uisCookiePos } from '../../commonModule';
import { LinksTab, LoadingSpinner } from '../common/commonParts';
import { AddSchDailyByUserSelect, Calendar, useGetClassroomList } from '../common/HashimotoComponents';
import SchEditDetailDialog from './SchEditDetailDialog';
import SchAddictionByDayDisp from './SchAddictionByDayDisp';
import { setStore } from '../../Actions';
import { HOHOU } from '../../modules/contants';
import { getFilteredUsers, recentUserStyle, schLocked, sendPartOfSchedule, setRecentUser } from '../../albCommonModule';
import SnackMsg from '../common/SnackMsg';
import { isPrime } from '../../hashimotoCommonModules';
import { makeSchMenuFilter, menu, extMenu } from './Sch2';
import { SchInitilizer } from './SchInitilizer';
import { setLocalStorageItemWithTimeStamp } from '../../modules/localStrageOprations';
import { SetUseResult } from './SchDaySetting';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import { SchDaySettingNDTarget } from './SchDaySettingNoDialog';
import { KubunEnchoPillars } from './SchEachScheduleContent';
import { DisplayOnPrint } from '../common/DisplayPrint';
import SchDailyReportSyncer from './SchDailyReportSyncer';

const MAX_HOUR_COL = 9;  //（PC画面）時間ごとの縦線最大数
const LIMIT599_MAX_HOUR_COL = 3;  //（599px以下）時間ごとの縦線最大数
const PERMISSION_LIMIT = 70;

const useStyles = makeStyles({
  schDaily: {
    marginTop: 126,
    '& .mainContent': {
      width: 700, padding: '0 32px',
      marginLeft: 'calc((100vw - 310px - 700px - 90px) / 2 + 320px)',
      '@media print': {marginLeft: 'calc((100% - 700px) / 2)'},
      '& .scheduleInfo': {
        fontSize: '.8rem', marginBottom: 8,
        display: 'flex', justifyContent: 'center',
        '& > div': {margin: 4},
        '& .num': {fontSize: '1.4rem', marginInlineStart: 4, marginInlineEnd: 4},
        '& .primary': {color: teal[800], fontWeight: 300},
        '& .seccondary': {color: blue[800], fontWeight: 300},
      },
      '& .barTable': {
        position: 'relative', marginTop: 64,
        '& .barContents': {margin: '16px 0'},
        '& .verticalLinesPerHour': {
          width: '100%', height: '100%', position: 'absolute',
          display: 'flex',
          '& .line': {
            height: '100%', borderRight: `1px solid ${grey[300]}`, position: 'relative',
            '& .timeStr': {
              color: grey[500],
              position: 'absolute', top: -24, left: -24
            },
            '& .lastElm': {marginLeft: '100%'}
          }
        }
      },
      '& .options': {
        display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
      }
    },
    "@media (max-width:599px)": {
      '& .mainContent': {
        width: '100%', marginLeft: 0,
      },
    },
    '& .controles': {'@media print':{display: 'none'},},
    '@media print':{marginTop: 0},
  },
  '@keyframes jump': {
    '0%': {
      transform: 'translateY(0)',
      animationTimingFunction: 'cubic-bezier(0.1, 2.5, 0.6, 0.9)',
    },
    '5%': {
      transform: 'translateY(-4px)',
      animationTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
    '10%': {
      transform: 'translateY(0)',
      animationTimingFunction: 'cubic-bezier(0.1, 2.5, 0.6, 0.9)',
    },
    '100%': {
      transform: 'translateY(0)',
    },
  },
  dailyBar: {
    width: '100%', minHeight: 80, marginBottom: 16, cursor: 'pointer',
    position: 'relative',
    '& .textEllipsis': {
      display: "-webkit-box",
      "-webkit-line-clamp": "1",
      "-webkit-box-orient": "vertical",
      overflow: 'hidden',
    },
    '& .individualInfo': {
      width: '100%',
      position: 'absolute', top: 0, bottom: 0,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      '& .startTime, .endTime':{
        fontSize: '1.8rem',  opacity: .6, paddingRight: 6,
        fontWeight: 600, fontStyle: 'italic',
        textShadow: `1px 1px 2px #fff`,
        '@media (max-width:599px)': {fontSize: '1.2rem'}
      },
      '& .startTime': {color: teal[200],},
      '& .endTime': {color: blue[200],},
      '& .editTime': {
        color: red[300], animation: '$jump 2s infinite',
      },
      '& .userInfo': {
        '& .name': {
          display: 'flex', justifyContent: 'center',
          '& .nameInner': {
            padding: 4, position: 'relative',
            '& .underline': {position: 'absolute', bottom: 0, left: 0, height: 8, width: '100%'},
            '& .nameDeepInner': {position: 'relative', width: '100%', fontSize: '1.2rem'}
          },
        },
        textAlign: 'center',
        '& > div': {margin: '2px 0'},
      },
      '& .rowFlex': {
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.8rem',
        padding: 2,
        '& .MuiSvgIcon-root': {fontSize: '1.2rem'},
        '& .content': {
          '& .MuiSvgIcon-root': {fontSize: '.7rem'},
          marginLeft: 8,
          display: 'flex', alignItems: 'center',
          '& .numOfCosts': {marginLeft: -6},
          '& .sumCont': {marginLeft: 8},
        }
      },
    },
    '& .barGraph': {
      minHeight: 80, backgroundColor: teal[50],
    },
    "@media (max-width:599px)": {
      minHeight: 60,
      '& .barGraph': {minHeight: 60},
    }
  },
  sortUsersButton: {
    marginLeft: 400,
    "@media (max-width:599px)": {
      marginLeft: 0,
    }
  },
  sortScheduleBarButon: {
    textAlign: 'center',
    '@media print': {display: 'none'}
  },
  notCompServ: {marginTop: 126, textAlign: 'center'},
  deleteSwitch: {
    position: 'fixed', top: 680, left: 132, width: 310, 
    color: red[700],
    '& .MuiSwitch-switchBase': {color: red[700]},
    '& .MuiSwitch-colorSecondary.Mui-checked + .MuiSwitch-track ': {
      backgroundColor: red[200]
    }
  },
  delConf: {
    display: 'flex', alignItems: 'center', marginBottom: 16,
    justifyContent: 'center',
    '& .buttons': {
      marginLeft: 16,
      '& .cansel': {color: 'blue'},
      '& .delete': {color: 'red', marginLeft: 8}
    }
  },
  scheduleTimeEdit: {
    position: 'fixed', top: 432, left: 80, width: 310,
    display: 'flex', flexDirection: 'column',
    '@media print':{display: 'none'},
    '& .buttons': {
      margin: '32px auto',
      '& .button': {color: 'white', backgroundColor: 'rgb(136, 136, 136)'},
      '& .MuiButton-root': {width: 140},
      '& #startButton': {marginRight: 8}
    },
    '& .checkAndText':{
      margin: '8px auto',
      '& .checkbox': {margin: '0 0'},
      '& .textField': {width: 72},
      '& .timeButton': {
        margin: '0 8px', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
      },
      '& .timeStr': {
        fontSize: '0.75rem', color: 'rgba(0, 0, 0, 0.54)'
      }
    },
    "@media (max-width:599px)": {
      position: 'initial', 
      width: 'fit-content', padding: 8, margin: '32px auto',
      '& .checkbox': {margin: '4px 0 4px 10px'},
      '& .textField': {margin: '4px auto'},
    }
  },
  monthOffset: {
    color: teal[900], marginTop: 3,
    '& .MuiSvgIcon-root': {fontSize: 32, verticalAlign: 'bottom'},
    '& .doubbleIcon .MuiSvgIcon-root':{marginInlineStart: '-.8em'}
  },
});

const Dispatcher = ({schedule}) => {
  const dispatch = useDispatch();
  useEffect(()=>{
    return () =>{
      setTimeout(()=>{
        const closed = !document.querySelector('#schDaily1637');
        if (closed){
          schedule.timestamp = new Date().getTime();
          dispatch(setStore({schedule}));
        }
      }, 100)
    }
  }, [schedule])
  return (
    <div id='schDaily1637' style={{display: 'none'}}></div>
  )
}

const SortScheduleBarCheckbox = (props) => {
  const classes = useStyles();
  const {dtList, setDtList, sorted, setSorted} = props;

  useEffect(() => {
    const sortDtList = JSON.parse(JSON.stringify(dtList));
    if(sorted){
      sortDtList.sort((a, b) => {
        const aStartTimeList = a.scheduleDt.start.split(":");
        const bStartTImeList = b.scheduleDt.start.split(":");
        if(b.scheduleDt.absence) return -1;
        else if(a.scheduleDt.absence) return 1;
        if(
          aStartTimeList[0] < bStartTImeList[0] ||
          (aStartTimeList[0] === bStartTImeList[0] && aStartTimeList[1] < bStartTImeList[1])
        ) return -1;
        else return 1;
      })
    }else sortDtList.sort((a, b) => (a.sindex < b.sindex ?-1 :1));
    setDtList([...sortDtList]);
    setUisCookie(uisCookiePos.schDailySorted, sorted ?"1" :"0");
  }, [sorted]);

  return(
    <div className={classes.sortScheduleBarButon}>
      <FormControlLabel
        control={
          <Checkbox
            checked={sorted}
            onChange={e=>setSorted(e.target.checked)}
            name='verticalDisp'
            color="primary"
          />
        }
        label='開始時間順に表示'
      />
    </div>
  )
}

const DeleteBarSwitch = (props) => {
  const classes = useStyles();
  const {checked, setChecked, permissionLimit, disabled} = props;

  const handleChange = (e) => {
    setChecked(e.target.checked);
  }

  const permissionLimitStyle = permissionLimit ?{display: 'none'} :{};
  return(
    <div className={classes.deleteSwitch} style={permissionLimitStyle}>
      <FormControlLabel control={
        <Switch checked={checked} onChange={handleChange} disabled={disabled}/>
      } label="予定を削除"/>
    </div>
  )
}

const OneUserDailyScheduleBar = (props) => {
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const isMultService = serviceItems.length > 1;
  const classroom = useSelector(state => state.classroom);
  const classroomList = useGetClassroomList();
  const isMultClassroom = classroomList.length > 1;
  const classes = useStyles();
  const {
    scheduleDt, userDt,
    lengthPerOneMinutes, minHour, maxHour,
    limit599px, permissionLimit,
    setDialogOpen, uid, did, usch,
    sch, setSch, delMode,
    setSnack, hid, bid, stdDate,
    startButton, endButton, nowChecked, time, timeErr,
    disabled,
  } = props;
  const [delConf, setDelConf] = useState(false);
  const startTimeList = (scheduleDt?.start ?? "00:00").split(":").map(x => parseInt(x));
  const endTimeList = (scheduleDt?.end ?? "00:00").split(":").map(x => parseInt(x));
  const startPerMinuteConversion = startTimeList[0] * 60 +startTimeList[1];
  const endPerMinuteConversion = endTimeList[0] * 60 + endTimeList[1];
  const marginLeft = startPerMinuteConversion - minHour * 60;
  const barWidth = endPerMinuteConversion - startPerMinuteConversion;
  const marginRight = maxHour * 60 - endPerMinuteConversion;

  useEffect(() => {
    if(!delMode) setDelConf(false);
  }, [delMode])

  const handleClick = () => {
    // 複数サービス事業所では全表示時に編集できないようにする。
    if(isMultService && !service){
      setSnack({msg: "サービスを切り替えてください。", severity: 'warning', id: new Date().getTime()});
      return;
    }
    // 全単位表示時に複数サービス利用者の編集をできないようにする。
    if(isMultClassroom && !classroom){
      const isMultClassroomUser = (userDt.classroom || "").split(",").length > 1;
      if(isMultClassroomUser){
        setSnack({msg: "単位を切り替えてください。", severity: 'warning', id: new Date().getTime()});
        return;
      }
    }
    if(disabled){
      setSnack({msg: "予定・実績はロックされています。", severity: 'warning', id: new Date().getTime()});
      return;
    }
    setSnack({msg: "", severity: '', id: new Date().getTime()});

    if(startButton || endButton){
      const editKey = startButton ?"start" :endButton ?"end" :null;
      if(!editKey) return;
      const opposeKey = startButton ?"end" :endButton ?"start" :null;
      let targetTime = "";
      if(!timeErr){
        targetTime = time;
      }else{
        return;
      }
      const newScheduleDt = {...usch};
      const targetTimeList = targetTime.split(":").map(x => parseInt(x));
      const opposeTime = newScheduleDt[did][opposeKey];
      const opposeTimeList = opposeTime.split(":").map(x => parseInt(x));
      if(
        (editKey==="start" &&
          (
            (targetTimeList[0] > opposeTimeList[0]) ||
            (targetTimeList[0]===opposeTimeList[0] && targetTimeList[1] > opposeTimeList[1])
          )
        ) ||
        (editKey==="end" &&
          (
            (targetTimeList[0] < opposeTimeList[0]) ||
            (targetTimeList[0]===opposeTimeList[0] && targetTimeList[1] < opposeTimeList[1])
          )
        )
      ){
        let errorMsg = "";
        if(editKey==="start"){
          errorMsg = "開始時間は終了時間よりも遅い時刻を設定することはできません。";
        }else if(editKey==="end"){
          errorMsg = "終了時間は開始時間よりも早い時刻を設定することはできません。";
        }
        setSnack({msg: errorMsg, severity: 'warning'});
        return;
      }
      newScheduleDt[did][editKey] = targetTime;
      // タイムスタンプ付与
      newScheduleDt[did].timestamp = new Date().getTime();
      const params = { hid, bid, date: stdDate, partOfSch: {[uid]: newScheduleDt}};
      sendPartOfSchedule(params, "", setSnack).then(res => {
        if(res.data.result){
          setLocalStorageItemWithTimeStamp(hid+uid+did, true);
          setRecentUser(uid.replace("^UID", ""));
          setSch({...{...sch, [uid]: newScheduleDt}});
        }
      });
      return;
    }
    if(limit599px || permissionLimit) return;
    else if(delMode && !delConf){
      setDelConf(true);
    }else if(!delConf){
      const params = {open: true, uid, did, usch};
      setDialogOpen({...params});
    }
  }

  const deleteSchedule = () => {
    const newSchedule = JSON.parse(JSON.stringify(sch));
    delete newSchedule[uid][did];
    setSch({...newSchedule});
    sendPartOfSchedule({hid, bid, date: stdDate, partOfSch: newSchedule}, "", setSnack);
    setDelConf(false);
    setLocalStorageItemWithTimeStamp(hid+uid+did, true);
  }

  const actualCost = scheduleDt.actualCost ?scheduleDt.actualCost :{};
  const totalingActualCost = Object.keys(actualCost).reduce((result, key) => {
    const cost = parseInt(actualCost[key]);
    result.sumCost += cost;
    result.numOfCosts++;
    return result;
  }, {numOfCosts: 0, sumCost: 0});

  const dAddiction = scheduleDt.dAddiction ?scheduleDt.dAddiction :{};
  const absence = Boolean(scheduleDt.absence);
  const absenceIconColor = absence && dAddiction["欠席時対応加算"] ?blue[900] :red[900];

  const dailyBarStyle = {
    width: `${lengthPerOneMinutes*barWidth}%`,
    marginLeft: `${lengthPerOneMinutes*marginLeft}%`,
    marginRight: `${lengthPerOneMinutes*marginRight}%`,
    backgroundColor: delMode ?red[100] :(startButton || endButton) ?blue[50] :teal[50],
  }
  const ruStyle = recentUserStyle(userDt.uid);
  const permissionLimitStyle = permissionLimit || disabled ?{cursor: 'default'} :{};
  const transferRegExp = /(^\*)|(\*$)/;
  const transfer0Test = transferRegExp.test(scheduleDt.transfer[0]);
  const transfer1Test = transferRegExp.test(scheduleDt.transfer[1]);
  return(
    <>
    <div className={classes.dailyBar} style={{...permissionLimitStyle, ...delConf ?{marginBottom: 0} :{}}} onClick={handleClick}>
      <div className='individualInfo'>
        <div className={`startTime ${startButton ?"editTime" :""}`}>{absence ?"" :scheduleDt.start}</div>
        <div className='userInfo'>
          {absence &&<NotInterestedIcon style={{color: absenceIconColor}}/>}
          <div className='name textElipsis'>
            <div className='nameInner'>
              <div className='underline' style={ruStyle}></div>
              <div className='nameDeepInner'>{userDt.name}</div>
            </div>
          </div>
          {!absence &&<div className='transfer rowFlex'>
            <DriveEtaIcon />
            <div className='content'>
              <div
                className='textEllipsis'
                style={transfer0Test ?{opacity: '0.5'} :{}}
              >
                {scheduleDt.transfer[0]}
              </div>
              <ArrowForwardIosIcon />
              <div
                className='textEllipsis'
                style={transfer1Test ?{opacity: '0.5'} :{}}
              >
                {scheduleDt.transfer[1]}
              </div>
            </div>
          </div>}
          {!limit599px &&<div className='etc rowFlex'>
            {!absence &&<div className='actualCost rowFlex'>
              <div className='icon fa'>
                <i className="fas fa-yen-sign fa-fw "></i>
              </div>
              <div className='content'>
                <div className='numOfCosts'>{totalingActualCost.numOfCosts}件</div>
                <div className='sumCont'>{totalingActualCost.sumCost}円</div>
              </div>
            </div>}
            <div className='dAddiction rowFlex'>
              {Object.keys(dAddiction).map((kasanName, i) => {
                if(kasanName === "時間区分") return null;
                if(kasanName === "延長支援") return null;
                return(<div className='content textElipsis' key={i}>
                  <AddCircleIcon style={{fontSize: '1.2rem'}}/>
                  {kasanName}
                </div>)
              })}
              {!absence &&<KubunEnchoPillars schDt={scheduleDt} virtical />}
            </div>
          </div>}
        </div>
        <div className={`endTime ${endButton ?"editTime" :""}`}>{absence ?"" :scheduleDt.end}</div>
      </div>
      {!absence &&<div className='barGraph' style={dailyBarStyle}/>}
    </div>
    {delConf &&<div className={classes.delConf}>
      <div>この予定を削除しますか？</div>
      <div className='buttons'>
        <Button className='cansel' onClick={()=>setDelConf(false)}>キャンセル</Button>
        <Button className='delete' onClick={deleteSchedule}>削除</Button>
      </div>
    </div>}
    </>
  )
}

const checkTargetCalendarDate = (stdDate, calendarDate) => {
  const stdDateList = stdDate.split("-").map(x => parseInt(x));
  const thisDate = new Date(stdDateList[0], stdDateList[1]-1, parseInt(calendarDate));
  const todayDateObj = new Date();
  const yesterdayDateObj = new Date(
    todayDateObj.getFullYear(), todayDateObj.getMonth(), todayDateObj.getDate()-1
  );
  const today = todayDateObj.getFullYear() === thisDate.getFullYear()
    && todayDateObj.getMonth() === thisDate.getMonth()
    && todayDateObj.getDate() === thisDate.getDate()
  const yesterday = yesterdayDateObj.getFullYear() === thisDate.getFullYear()
  && yesterdayDateObj.getMonth() === thisDate.getMonth()
  && yesterdayDateObj.getDate() === thisDate.getDate()
  
  return today || yesterday
}

const ScheduleTimeEdit = (props) => {
  const classes = useStyles();
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const isMultService = serviceItems.length > 1;
  const classroom = useSelector(state => state.classroom);
  const classroomList = useGetClassroomList();
  const isMultClassroom = classroomList.length > 1;
  const {
    startButton, setStartButton, endButton, setEndButton,
    nowChecked, setNowChecked, time, setTime, timeErr, setTimeErr,
    disabled, stdDate, selectedDate, setSnack,
  } = props;

  const [errMsg, seterrMsg] = useState('');
  const enable = checkTargetCalendarDate(stdDate, selectedDate)
    && !(isMultService && !service)
    && !(isMultClassroom && !classroom);

  const clickActionField = () => {
    if(!checkTargetCalendarDate(stdDate, selectedDate)){
      setSnack({msg: "この機能は昨日・当日のみ利用可能です。", severity: 'warning', id: new Date().getTime()});
      return;
    }
    if(isMultService && !service){
      setSnack({msg: "サービスを切り替えてください。", severity: 'warning', id: new Date().getTime()});
      return;
    }
    if(isMultClassroom && !classroom){
      setSnack({msg: "単位を切り替えてください。", severity: 'warning', id: new Date().getTime()});
      return;
    }
  }

  const handleClick = (e) => {
    const id = e.currentTarget.id;
    setStartButton(id === "startButton" && !startButton);
    setEndButton(id === "endButton" && !endButton);
  }

  const handleBlur = (e) => {
    let val = convHankaku(e.currentTarget.value);
    // 正規表現のパターン定義
    const ptn = '^(0[0-9]|1[0-9]|2[0-3]|[0-9]):[0-5][0-9]$'
    // コロンの確認追加
    if (val.indexOf(':') === -1) {
      val = val.substr(0, val.length - 2) + ':' + val.substr(-2);
    }
    // 長さが短かったら0パディング
    val = (val.length < 5) ? '0' + val : val;
    setTime(val);
    if (val.search(ptn) === -1) {
      setTimeErr(true);
      seterrMsg('時刻が不正です。');
    }
    else if (!val) {
      setTimeErr(true);
      seterrMsg('入力必須です。');
    }
    else {
      setTimeErr(false);
      seterrMsg('');
    }
  }

  const clickTimeButton = (e) => {
    if(disabled || !enable) return;
    const hour = parseInt(time.split(":")[0]);
    const minutes = parseInt(time.split(":")[1]);
    const dateObj = new Date();
    dateObj.setHours(hour);
    dateObj.setMinutes(minutes);
    switch(e){
      case 'minus1hour': {
        dateObj.setHours(hour - 1);
        break;
      }
      case 'minus5minutes': {
        dateObj.setMinutes(minutes - 5);
        break;
      }
      case 'plus5minutes': {
        dateObj.setMinutes(minutes + 5);
        break;
      }
      case 'plus1hour': {
        dateObj.setHours(hour + 1);
        break;
      }
    }
    const newHour = String(dateObj.getHours()).padStart(2, '0');
    const newMinutes = String(dateObj.getMinutes()).padStart(2, '0');
    const newTime = `${newHour}:${newMinutes}`;
    setTime(newTime);
  }

  const buttonStyle = {backgroundColor: teal[800]};
  return(
    <div className={classes.scheduleTimeEdit} onClick={clickActionField}>
      <div className='buttons'>
        <Button
          variant='contained' className='button' id="startButton"
          style={startButton ?buttonStyle :{}}
          disabled={disabled || !enable}
          onClick={handleClick}
        >
          開始時間
        </Button>
        <Button
          variant='contained' className='button' id="endButton"
          disabled={disabled || !enable}
          style={endButton ?buttonStyle :{}} onClick={handleClick}
        >
          終了時間
        </Button>
      </div>
      <div className='checkAndText'>
        <div style={{display: 'flex', alignItems: 'flex-end'}}>
          <div
            className='timeButton'
            id='minus1hour' onClick={()=>clickTimeButton('minus1hour')}
            style={disabled||!enable ?{cursor: 'default'} :{}}
          >
            <div className='timeStr'>1時間</div>
            <div className={classes.monthOffset}>
              <KeyboardArrowLeftIcon/>
              <span className='doubbleIcon'>
                <KeyboardArrowLeftIcon/>
              </span>
            </div>
          </div>
          <div
            className='timeButton'
            id="minus5minutes" onClick={()=>clickTimeButton('minus5minutes')}
            style={{
              marginRight: 12,
              ...(disabled||!enable ?{cursor: 'default'} :{})
            }}
          >
            <div className='timeStr'>5分</div>
            <div className={classes.monthOffset}>
              <KeyboardArrowLeftIcon/>
            </div>
          </div>
          <TextField
            label="指定時間"
            disabled={disabled || !enable}
            error={timeErr}
            helperText={errMsg}
            className='textField'
            value={time}
            onChange={e => setTime(e.target.value)}
            onBlur={handleBlur}
          />
          <div
            className='timeButton'
            id='plus5minutes' onClick={()=>clickTimeButton('plus5minutes')}
            style={disabled||!enable ?{cursor: 'default'} :{}}
          >
            <div className='timeStr'>5分</div>
            <div className={classes.monthOffset}>
              <KeyboardArrowRightIcon/>
            </div>
          </div>
          <div
            className='timeButton'
            id='plus1hour' onClick={()=>clickTimeButton('plus1hour')}
            style={disabled||!enable ?{cursor: 'default'} :{}}
          >
            <div className='timeStr'>1時間</div>
            <div className={classes.monthOffset}>
              <KeyboardArrowRightIcon/>
              <span className='doubbleIcon'>
                <KeyboardArrowRightIcon/>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const getTargetSchedulePerUid = (sch, users, service, classroom, dDate) => {
  const filteredUsers = getFilteredUsers(users, service, classroom);
  const scheduleDt = Object.keys(sch).reduce((result, uidStr) => {
    if(!/^UID[0-9]+?$/.test(uidStr)) return result;
    const userDt = filteredUsers.find(uDt => "UID"+uDt.uid === uidStr);
    if(!userDt) return result;
    const schDt = sch[uidStr][dDate];
    if(!schDt) return result;
    if(schDt.service === HOHOU) return result;
    if(service && schDt.service !== service) return result;
    if(classroom && schDt.classroom && schDt.classroom !== classroom) return result;
    const data = {uidStr, scheduleDt: schDt, sindex: userDt.sindex}
    result.push(data);
    return result;
  }, []);
  return scheduleDt
}


/**
 * ステートの初期値として使用する日付を取得する関数。
 * 以下の手順で日付を取得します：
 * 1. ローカルストレージからデータを取得。
 * 2. データが存在し、8時間以内であればそのデータを使用。
 * 3. データが存在しないか、8時間以上経過している場合は、新しい日付を計算してローカルストレージに保存。
 * 
 * @returns {number} 初期日付
 */

export const setInitDate = (date) => {
  const now = new Date();
  localStorage.setItem('SchDailyInitDate', JSON.stringify({
    time: now.toISOString(),
    date: date
  }));
}


const getInitialDate = (displayDateList) => {
  const now = new Date();
  const storedData = localStorage.getItem('SchDailyInitDate');
  
  // ローカルストレージからデータを取得し、8時間以内であるか確認
  if (storedData) {
    const parsedData = JSON.parse(storedData);
    const lastStoredTime = new Date(parsedData.time);
    const diffInHours = (now - lastStoredTime) / (1000 * 60 * 60);
    if (diffInHours < 8) {
      return parsedData.date;
    }
  }

  // 新しい日付を計算し、ローカルストレージに保存
  const date = displayDateList[0] === now.getFullYear() && displayDateList[1] === now.getMonth() + 1
    ? now.getDate() : 1;

  setInitDate(date);
  return date;
};

const SchDaily = () => {
  const classes = useStyles();
  const limit599px = useMediaQuery("(max-width:599px)");
  const history = useHistory();
  const ref = useRef(true);
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {users, schedule, stdDate, hid, bid, service, classroom, account, dateList} = allState;
  const permission = parsePermission(account)[0][0];
  const permissionLimit = permission < PERMISSION_LIMIT;
  const displayDateList = stdDate.split("-").map(strDate => parseInt(strDate));
  const [sch, setSch] = useState(JSON.parse(JSON.stringify(schedule)));
  const [selectedDate, setSelecedDate] = useState(getInitialDate(displayDateList));
  const [sorted, setSorted] = useState(getUisCookie(uisCookiePos.schDailySorted)==="1");
  const [delMode, setDelMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState({
    open: false, uid: '', did: '' , usch: {}, userOpe: false
  });
  /*ScheduleTimeEditのprops*/
  const [startButton, setStartButton] = useState(false);
  const [endButton, setEndButton] = useState(false);
  const [nowChecked, setNowChecked] = useState(false);
  const [time, setTime] = useState((() => {
    const now = new Date();
    const hour = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${hour}:${minutes}`;
  })());
  const [timeErr, setTimeErr] = useState(false);

  const [snack, setSnack] = useState({});
  const dispalyMonth = String(displayDateList[1]).padStart(2, '0');
  const dispalyDate = String(selectedDate).padStart(2, '0');
  const dDate = "D" + String(displayDateList[0]) + dispalyMonth + dispalyDate;
  const [targetSchedulePerUid, setTargetSchedulePerUid] = useState([]);
  const [tempIndexList, setTempIndexList] = useState([]);

  useEffect(() => {
    const uidList = Object.keys(schedule).reduce((result, uidStr) => {
      if(/^UID[0-9]+?$/.test(uidStr)) result.push(uidStr);
      return result
    }, []);
    const indexList = uidList.sort((a, b) => {
      if(sorted){
        const aSchDt = schedule[a][dDate];
        const bSchDt = schedule[b][dDate];
        if(!bSchDt || bSchDt.absence) return -1;
        else if(!aSchDt || aSchDt.absence) return 1;
        if(aSchDt.service==="保育所等訪問支援" || bSchDt.service==="保育所等訪問支援") return 0;
        const aStartTimeList = aSchDt.start.split(":");
        const bStartTImeList = bSchDt.start.split(":");
        if(
          aStartTimeList[0] < bStartTImeList[0] ||
          (aStartTimeList[0] === bStartTImeList[0] && aStartTimeList[1] < bStartTImeList[1])
        ) return -1; else return 1;
      }else{
        const aUserDt = users.find(uDt => "UID"+uDt.uid === a);
        const bUserDt = users.find(uDt => "UID"+uDt.uid === b);
        if(!bUserDt) return -1;
        else if(!aUserDt) return 1;
        return aUserDt.sindex < bUserDt.sindex ?-1 :1
      }
    })
    setTempIndexList([...indexList]);
    const targetScheduleDt = getTargetSchedulePerUid(sch, users, service, classroom, dDate);
    targetScheduleDt.sort((a, b) => {
      return uidList.indexOf(a.uidStr) <= uidList.indexOf(b.uidStr) ?-1 :1
    });
    setTargetSchedulePerUid([...targetScheduleDt]);
    setSnack({});
    setStartButton(false);
    setEndButton(false);
    setInitDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (ref.current) return;
    const targetScheduleDt = getTargetSchedulePerUid(sch, users, service, classroom, dDate);
    targetScheduleDt.sort((a, b) => {
      return tempIndexList.indexOf(a.uidStr) <= tempIndexList.indexOf(b.uidStr) ?-1 :1
    });
    setTargetSchedulePerUid([...targetScheduleDt]);
  }, [sch]);

  useEffect(() => {
    if (ref.current) {
      ref.current = false;
      return;
    }
    if(
      JSON.stringify(sch[dialogOpen.uid])!==JSON.stringify(dialogOpen.usch) &&
      !dialogOpen.open && dialogOpen.uid && dialogOpen.did
    ){
      const params = {hid, bid, date: stdDate, partOfSch: {[dialogOpen.uid]: dialogOpen.usch}};
      sendPartOfSchedule(params, "", setSnack);
      const newScheduleDt = JSON.parse(JSON.stringify(sch));
      newScheduleDt[dialogOpen.uid] = dialogOpen.usch;
      setSch({...newScheduleDt});
    }
  }, [dialogOpen])

  if(!loadingStatus.loaded) return(<LoadingSpinner />);
  else if(service === "保育所等訪問支援") return(
    <div className={classes.notCompServ}>保育所等訪問支援には対応していません。</div>
  );

  const minHour = targetSchedulePerUid.reduce((result, dt) => {
    const scheduleDt = dt.scheduleDt;
    if(scheduleDt.absence) return result;
    const currentTime = scheduleDt?.start ?? "00:00";
    const currentTimeList = currentTime.split(":").map(t => parseInt(t));
    if(result > currentTimeList[0]) result = parseInt(currentTimeList[0]);
    return result;
  }, 24);
  const maxHour = targetSchedulePerUid.reduce((result, dt) => {
    const scheduleDt = dt.scheduleDt;
    if(scheduleDt.absence) return result;
    const currentTime = scheduleDt?.end ?? "00:00";
    const currentTimeList = currentTime.split(":").map(t => parseInt(t));
    if(result <= currentTimeList[0]){
      result = parseInt(currentTimeList[0]);
      if(currentTimeList[1] > 0) result += 1;
    }
    return result;
  }, 0);

  const prime = isPrime(maxHour-minHour > 0 ?maxHour-minHour :0);
  const maxHourCol = limit599px ?LIMIT599_MAX_HOUR_COL :MAX_HOUR_COL;

  let verticalLinesAllLen = maxHour-minHour > 0 ?maxHour-minHour :0;
  const denom = (() => {
    if(verticalLinesAllLen <= maxHourCol) return 1;
    else if(prime) verticalLinesAllLen += 1;
    for (let i=2; i<=verticalLinesAllLen; i++) {
      if (verticalLinesAllLen % i === 0 && verticalLinesAllLen / i <= maxHourCol) return i;
    }
    return 1
  })();
  const lineWidth = verticalLinesAllLen > 0 ?100 / Math.ceil(verticalLinesAllLen/denom) :0;
  const lengthPerOneMinutes = verticalLinesAllLen > 0 ?100 / (verticalLinesAllLen * 60) :0;
  let numOfUsers = 0;
  let numOfAbsenceUsers = 0;

  const scheduleLocked = schedule.locked
    ?true
    :schLocked(schedule, users, null, dDate, service, classroom) ?true :false;
  const allDisabled = scheduleLocked;

  const mainNodes = targetSchedulePerUid.map((dt, i) => {
    const userDt = users.find(uDt => "UID"+uDt.uid === dt.uidStr);
    if(!userDt) return null;
    if(dt.scheduleDt.absence) numOfAbsenceUsers++;
    else numOfUsers++;
    const usch = sch[dt.uidStr];
    const params = {
      scheduleDt: dt.scheduleDt, userDt,
      lengthPerOneMinutes, minHour, maxHour,
      limit599px, keyIndex: i, permissionLimit,
      setDialogOpen, uid: dt.uidStr, did: dDate, usch,
      sch, setSch, delMode,
      setSnack, hid, bid, stdDate,
      startButton, endButton, nowChecked, time, timeErr,
      disabled: allDisabled
    };
    return(<OneUserDailyScheduleBar key={"dailyBar"+i} {...params}/>);
  });

  const verticalLinesLen = Math.ceil(verticalLinesAllLen/denom);
  const verticalLinesPerTime = [];
  for(let i=0;i<verticalLinesLen;i++){
    const style = {width: `${lineWidth}%`, borderLeft: i===0 ?`1px solid ${grey[300]}` :null};
    verticalLinesPerTime.push(
      <div className="line" style={style} key={i}>
        <div className='timeStr'>{`${String(minHour+i*denom)}:00`}</div>
        {i === verticalLinesLen-1 &&
          <div className='timeStr lastElm'>{`${String(minHour+(i+1)*denom)}:00`}</div>
        }
      </div>
    );
  }

  const appPageLimit599pxStyle = limit599px ?{width: '100%', minWidth: 0, margin: 0} :{};
  const calendarStyle = limit599px ?{margin: '0 auto 48px'} :{position: 'fixed', top: 120, left: 80};
  const calendarProps = {allState, date: selectedDate, setDate: setSelecedDate, style: calendarStyle};
  const sortButtonProps = {
    dtList: targetSchedulePerUid, setDtList: setTargetSchedulePerUid, sorted, setSorted
  };
  const deleteSwitchProps = {checked: delMode, setChecked: setDelMode, permissionLimit, disabled: allDisabled};
  const addSchDailyByUserSelectStyle = limit599px
    ?{margin: '0 auto 48px'}
    :{position: 'fixed', top: 600, left: 132, width: 310, }; //textAlign: 'center' removed
  const addSchDailyByUserSelectProps = {
    allState, scheduleState: sch, setScheduleState: setSch, dDate, setSnack,
    permission, style: addSchDailyByUserSelectStyle, disabled: allDisabled
  }
  const scheduleTimeEditProps = {
    startButton, setStartButton, endButton, setEndButton,
    nowChecked, setNowChecked, time, setTime, timeErr, setTimeErr,
    disabled: allDisabled, stdDate, selectedDate, setSnack
  }
  return(
    <>
    <DisplayOnPrint />
    {!limit599px &&<LinksTab menu={menu} menuFilter={(stdDate)=>makeSchMenuFilter(stdDate)} extMenu={extMenu}/>}
    <div className='AppPage' style={appPageLimit599pxStyle}>
      <div className={classes.schDaily}>
        <Calendar {...calendarProps}/>
        <ScheduleTimeEdit {...scheduleTimeEditProps}/>
        <div className='mainContent'>
          <div className='scheduleInfo'>
            <div>
              <span className='num'>{dispalyMonth}</span>月
              <span className='num'>{dispalyDate}</span>日
            </div>
            <div>利用<span className='num primary'>{String(numOfUsers)}</span>人</div>
            <div>欠席<span className='num seccondary'>{String(numOfAbsenceUsers)}</span>人</div>
          </div>
          <SchAddictionByDayDisp did={dDate} />
          <div className='barTable'>
            <div className="verticalLinesPerHour">{verticalLinesPerTime}</div>
            <div className='barContents'>{mainNodes}</div>
          </div>
          {targetSchedulePerUid.length<=0 &&<div style={{textAlign: 'center', marginBottom: 32}}>利用者がいません</div>}
          <div className='options'>
            <SortScheduleBarCheckbox {...sortButtonProps}/>
            <div className='controles'>
              {!limit599px &&<AddSchDailyByUserSelect {...addSchDailyByUserSelectProps}/>}
              {!limit599px &&<DeleteBarSwitch {...deleteSwitchProps}/>}
              {!limit599px &&<Button
                variant="contained"
                style={{position: 'fixed', top: 750, left: 140}}
                onClick={() => history.push(`/schedule/listinput/perdate/${dispalyDate}/`)}
              >
                日付別一覧入力へ
              </Button>}
            </div>
          </div>
        </div>
      </div>
    </div>
    <SchEditDetailDialog stateOpen={dialogOpen} setStateOpen={setDialogOpen}/>
    <SetUseResult toggle endDate={dDate} />
    <SnackMsg {...snack}/>
    <Dispatcher schedule={sch}/>
    <SchInitilizer />
    <SchDailyReportSyncer />
    </>
  )
}
export default SchDaily;