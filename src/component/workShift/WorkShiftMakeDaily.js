import { alpha, Button, ButtonGroup, IconButton, makeStyles } from '@material-ui/core';
import { blue, blueGrey, brown, grey, red, teal } from '@material-ui/core/colors';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { brtoLf, getLodingStatus } from '../../commonModule';
import SnackMsg from '../common/SnackMsg';
import { DAY_LIST } from '../../hashimotoCommonModules';
import { LICENSE_LIST, WorkShiftNewCard, WorkShiftCard, useFetchAndSendWorkShift, WorkShiftLinksTab, WorkShiftControlModeChangeButton, WorkShiftEditDialog, WorkShiftSpecialCard, WORK_SHIFT_PUBLIC_HOLIDAY_DT, WORK_SHIFT_PAID_HOLIDAY_DT, useGetStaffs, WorkShiftMakeChangeButtons, WORK_SHIFT_START_TIME, WORK_SHIFT_END_TIME, WorkShiftWarning } from './WorkShiftCommon';
import { DraggableWindow, ToolTip, useLocalStorageState, useMoveOnDragElement, useSessionStorageState } from '../common/HashimotoComponents';

import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ArrowLeftIcon from '@material-ui/icons/ArrowLeft';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import CreateIcon from '@material-ui/icons/Create';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import RemoveIcon from '@material-ui/icons/Remove';
import FreeBreakfastIcon from '@material-ui/icons/FreeBreakfast';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NotInterestedIcon from '@material-ui/icons/NotInterested';

import { checkValueType } from '../dailyReport/DailyReportCommon';
import { LoadingSpinner } from '../common/commonParts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from "@fortawesome/free-regular-svg-icons";
import { KeyListener } from '../common/KeyListener';

import './print.css';
import SetPrintTitle from '../common/SetPrintTitle';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';

const SIDEBAR_WIDTH = 61.25;
const SHIFT_CARD_WIDTH = 80;
const RECENTLY_SHIFTS_TIMES = 3;

const USERSCHLIST_MINHEIGHT = 127;
const MASIC_MAXHEIGHT = 32 +  64 * 2;
const USERSCHLIST_MAXHEIGHT = 64 * 10 - 1;

const USER_SCH_ROW_MINHEIGHT = 36;

const useGetDid = () => {
  const {date} = useParams();
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-");
  return "D"+stdYear+stdMonth+String(date).padStart(2, '0');
}

const SnackContext = createContext({});
const WorkShiftContext = createContext({});
const ControlModeContext = createContext(null);
const SelectingShiftTemplateContext = createContext(null);
const ShiftEditDialogContext = createContext(null);
const RecentlyShiftsContext = createContext([]);

const useStyles = makeStyles({
  AppPage: {
    minWidth: 1080 - 16 - SIDEBAR_WIDTH,
    margin: `82px 16px 128px ${SIDEBAR_WIDTH}px`,
    '& .options': {
      width: `calc(100vw - ${SIDEBAR_WIDTH}px)`,
      marginLeft: SIDEBAR_WIDTH,
      position: 'fixed', bottom: 16, right: 16,
      display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
      zIndex: 777,
      '& > *:not(:last-child)': {marginRight: 12},
    },
    '& .printInfo': {
      display: 'none'
    },
    "@media (max-width: 1079px)": {
      marginLeft: 16
    },
    '@media print': {
      margin: 0, padding: 0,
      '& .options': {
        display: 'none'
      },
      '& .printInfo': {
        display: 'block',
        marginBottom: 16
      }
    },
  },
  MainTable: {
    width: '100%',
    '& *': {userSelect: 'none'},
    '& .row': {
      display: 'flex',
      '& .rowHeader': {
        width: 168, minWidth: 168,
        padding: '8px 8px',
        borderRight: `2px solid ${grey[400]}`,
        backgroundColor: '#fff',
        position: 'sticky', left: 0
      },
      '& .timeCols': {
        position: 'relative',
        width: 'calc(100% - 168px - 96px)',
        display: 'flex',
        '& .timeCol': {
          flex: 1,
          '&:nth-child(odd)': { backgroundColor: '#fff' },
          '&:nth-child(even)': { backgroundColor: grey[100] }
        }
      },
      '& .totalTime': {
        width: '96px', textAlign: 'center',
        borderLeft: `2px solid ${grey[400]}`,
        padding: '8px 4px',
        backgroundColor: '#fff',
      }
    },
    '& .header': {
      position: 'sticky', top: 82,
      zIndex: 3,
      '& .row': {
        '& .rowHeader': {
          zIndex: 3,
          borderBottom: `2px solid ${grey[400]}`,
        },
        '& .timeCols': {
          '& .timeCol': {
            borderBottom: `2px solid ${grey[400]}`,
            padding: '8px 0',
            textAlign: 'center',
          }
        },
        '& .totalTime': {
          borderBottom: `2px solid ${grey[400]}`,
        }
      },
      '& .userSchRows': {
        transition: "height 0.3s ease",
        maxHeight: `${USERSCHLIST_MAXHEIGHT}px`,
        overflowY: 'auto', overscrollBehavior: 'contain',
        position: 'relative',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        '& .scrollButton': {
          position: 'absolute', left: 0, right: 0,
          textAlign: 'center', zIndex: 2, margin: '4px 0'
        },
        '& .row': {
          '&:last-child': {
            '& .rowHeader': { borderBottom: 'none' },
            '& .timeCol': { borderBottom: 'none' },
            '& .totalTime': { borderBottom: 'none' }
          },
          '& .rowHeader': {
            borderBottom: `1px solid #ddd`,
          },
          '& .timeCols': {
            '& .timeCol': {
              padding: 0,
              display: 'flex',
              borderBottom: `1px solid #ddd`,
              '& .timeSeparator': {
                width: '25%', height: '100%',
                borderRight: '1px solid #ddd',
              }
            },
          },
          '& .totalTime': {
            borderBottom: `1px solid #ddd`,
          },
        },
      }
    },
    '& .body': {
      '& .row': {
        breakInside: 'avoid',
        '& .rowHeader': {
          zIndex: 2,
          borderBottom: `1px solid #ddd`,
          '& .licenses': {
            marginTop: 8,
            fontSize: 12, color: teal[600],
            '& > div': {
              '&:not(:last-child)': {
                marginBottom: 4
              }
            }
          },
          '& .workCnt': {
            fontSize: '14px', marginTop: '4px',
            '& .cnt': {marginLeft: '8px'}
          }
        },
        '& .timeCols': {
          '& .timeCol': {
            display: 'flex',
            borderBottom: `1px solid #ddd`,
            '& .timeSeparator': {
              width: '25%', height: '100%',
              borderRight: '1px solid #ddd',
            }
          },
        },
        '& .totalTime': {
          borderBottom: `1px solid #ddd`,
        },
      },
    },
    "@media (max-width: 1079px)": {
      '& .row': {
        '& .rowHeader': {
          width: 160+8, minWidth: 160+8,
          padding: `8px 4px 8px ${8}px`,
        },
      },
    },
    '@media print': {
      '& .header': {
        position: 'initial',
        '& .userSchRows': {
          maxHeight: 'none !important', height: 'auto !important',
        }
      },
      '& .detailedOpenIcon': {
        display: 'none'
      },
      '& .notPrint': {
        display: 'none'
      }
    }
  },
  UserSchBar: {
    minHeight: '26px',
    position: 'absolute', top: '4px',
    padding: '6px 8px',
    color: '#fff', fontSize: '14px',
    '& .times, .transfer': {
      display: 'flex', justifyContent: 'space-between'
    },
    '& .absence': {
      height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    '& .pickup, .dropoff': {
      width: '45%',
      overflow: 'hidden', textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontWeight: 'bold'
    },
    '& .pickup': {textAlign: 'start'},
    '& .dropoff': {textAlign: 'end'}
  },
  ShiftBar: {
    minHeight: 48,
    display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column',
    position: 'absolute', top: '8px',
    padding: '8px',
    color: '#fff', fontSize: '14px',
    '& .time': {
      position: 'absolute', top: '8px',
      '&.start': {left: '8px'},
      '&.end': {right: '8px'}
    },
    '& .label': {
      textAlign: 'center'
    },
    '& .memo': {
      textAlign: 'center'
    },
    '& .mask': {
      position: 'absolute', top: 0, left: 0,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      width: '100%', height: '100%',
      opacity: 0,
      '&:hover': {
        opacity: 1
      }
    },
  },
  TemplateTimeButtons: {
    width: '50%', maxWidth: "734px",
    border: `2px solid ${grey[400]}`, borderRadius: 8,
    backgroundColor: '#fff',
    position: "relative",
    padding: '0 56px',
    '& .scrollButton': {
      position: 'absolute', top: 0, bottom: 0,
      display: 'flex', alignItems: 'center',
      marginRight: 8, marginLeft: 8,
      '& .icon': {
        fontSize: "2.5rem", margin: -8
      }
    },
    '& .shiftTemplates': {
      overflow: 'auto', scrollbarWidth: 'thin', overscrollBehavior: 'contain',
      display: 'flex',
      padding: '8px 0',
      '& > div:not(:last-child)': {marginRight: 8},
      '& .separator': {
        borderLeft: `2px solid ${grey[400]}`,
      }
    }
  },
  DateSelector: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    '& .main': {
      display: 'flex', alignItems: 'flex-end', margin: '0 4px',
      fontSize: '14px', paddingBottom: '1px',
      '& .date': {
        width: '28px', marginBottom: '-1px',
        fontSize: '20px', textAlign: 'center',
      },
      '& .day.holiday1': { color: "#F98100" },
      '& .day.holiday2': { color: "#727272"},
    },
    '& .iconButton': {
      padding: 4
    },
    '@media print': {
      '& .iconButton': {
        display: 'none'
      },
    }
  }
});

const DateSelector = () => {
  const history = useHistory();
  const {date} = useParams();
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-");
  const dateList = useSelector(state => state.dateList);
  const classes = useStyles();

  const handleClickNextDate = () => {
    const nextDate = parseInt(date)+1
    const next = new Date(parseInt(stdYear), parseInt(stdMonth)-1, nextDate);
    const nextYear = String(next.getFullYear()), nextMonth = String(next.getMonth()+1).padStart(2, '0');
    if(stdYear===nextYear && stdMonth===nextMonth){
      history.push(`/workshift/daily/${nextDate}/`);
      return;
    }
  }

  const handleClickBeforeDate = () => {
    const beforeDate = parseInt(date)-1
    const before = new Date(parseInt(stdYear), parseInt(stdMonth)-1, beforeDate);
    const beforeYear = String(before.getFullYear()), beforeMonth = String(before.getMonth()+1).padStart(2, '0');
    if(stdYear===beforeYear && stdMonth===beforeMonth){
      history.push(`/workshift/daily/${beforeDate}/`);
      return;
    }
  }

  const dateDt = dateList.find(dateDt => dateDt.date.getDate() === parseInt(date));
  const day = dateDt.date.getDay();
  return(
    <div className={classes.DateSelector}>
      <IconButton
        className='iconButton'
        onClick={handleClickBeforeDate}
        disabled={dateList[0].date.getDate() === parseInt(date)}
      >
        <NavigateBeforeIcon />
      </IconButton>
      <div className='main'>
        <span className='date'>{date}</span>日
        (<span className={`day holiday${dateDt.holiday}`}>{DAY_LIST[day]}</span>)
      </div>
      <IconButton
        className='iconButton'
        onClick={handleClickNextDate}
        disabled={dateList.at(-1).date.getDate() === parseInt(date)}
      >
        <NavigateNextIcon />
      </IconButton>
    </div>
  )
}

const TimeListHeader = (props) => {
  const {did} = props;
  const {workShift} = useContext(WorkShiftContext);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const com = useSelector(state => state.com);
  const setting = com?.ext?.workShift?.setting ?? {};
  const businessHours = setting.businessHours?.[displayService] ?? {};
  const {date} = useParams();
  const dateList = useSelector(state => state.dateList);
  const dateDt = dateList.find(dateDt => dateDt.date.getDate() === parseInt(date)) ?? {};
  const holiday = dateDt.holiday;
  const startTime = parseInt(((displayService==="放課後等デイサービス" && holiday>=1 ?businessHours.holidayStart :businessHours.start) ?? WORK_SHIFT_START_TIME).split(":")[0]);
  const endTime = parseInt(((displayService==="放課後等デイサービス" && holiday>=1 ?businessHours.holidayEnd :businessHours.end) ?? WORK_SHIFT_END_TIME).split(":")[0]);
  const timeCols = Array(endTime-startTime+1).fill(null).map((_, i) => {
    return(
      <div className='timeCol' style={{display: 'flex', justifyContent: 'center', alignItems: 'flex-end'}}>
        {String(startTime+i).padStart(2, '0')}:00
      </div>
    )
  });

  return(
    <div className='row'>
      <div
        className='rowHeader'
        style={{ textAlign: 'center', paddingTop: '2px', paddingBottom: '4px' }}
      >
        <DateSelector />
        <WorkShiftMakeChangeButtons />
      </div>
      <div className='timeCols'>{timeCols}</div>
      <div className='totalTime' style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <WorkShiftWarning workShift={workShift} did={did} holiday={holiday} />
      </div>
    </div>
  )
}

const UserSchBar = (props) => {
  const classes = useStyles();
  const {schDt} = props;

  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const com = useSelector(state => state.com);
  const setting = com?.ext?.workShift?.setting ?? {};
  const businessHours = setting.businessHours?.[displayService] ?? {};
  const {date} = useParams();
  const dateList = useSelector(state => state.dateList);
  const dateDt = dateList.find(dateDt => dateDt.date.getDate() === parseInt(date)) ?? {};
  const startTime = parseInt(((displayService==="放課後等デイサービス" && dateDt.holiday>=1 ?businessHours.holidayStart :businessHours.start) ?? WORK_SHIFT_START_TIME).split(":")[0]);
  const endTime = parseInt(((displayService==="放課後等デイサービス" && dateDt.holiday>=1 ?businessHours.holidayEnd :businessHours.end) ?? WORK_SHIFT_END_TIME).split(":")[0]);

  const start = schDt?.start  ?? "00:00";
  const [startHours, startMinutes] = start.split(":").map(Number);
  const startMin = startHours*60 + startMinutes;
  const end = schDt?.end ?? "00:00";
  const [endHours, endMinutes] = end.split(":").map(Number);
  const endMin = endHours*60 + endMinutes;
  const shiftMin = endMin - startMin;
  const overallMin = (endTime - startTime + 1) * 60;
  const startPosition = startMin - startTime * 60;

  const absence = schDt.absence ?? false;
  const absenceColor = absence ?schDt?.dAddiction?.["欠席時対応加算"] ?blue[900] :red[900] :null;
  const backgroundColor = !absence ?grey[400] :null;
  return(
    <div
      className={`${classes.UserSchBar}`}
      style={{
        padding: absence ?"0px" :null,
        left: !absence ?`${startPosition / overallMin * 100}%` :'0%',
        width: !absence ?`${shiftMin / overallMin * 100}%` :'100%',
        backgroundColor,
        borderLeft: !absence && schDt.transfer[0] && !schDt.transfer[0].includes("*") ?`8px solid ${teal[300]}` :null,
        borderRight: !absence && schDt.transfer[1] && !schDt.transfer[1].includes("*") ?`8px solid ${teal[300]}` :null,
      }}
    >
      {!absence &&<>
        <div className='transfer'>
          <div className='pickup'>{(schDt.transfer[0] ?? "")}</div>
          <div className='dropoff'>{(schDt.transfer[1] ?? "")}</div>
        </div>
      </>}
      {absence &&<>
        {/* <div className='absence'>欠席</div> */}
        <div style={{textAlign: 'center'}}>
          <NotInterestedIcon style={{color: absenceColor, fontSize: '28px'}}/>
        </div>
      </>}
    </div>
  )
}

const UserSchRow = (props) => {
  const {user, schDt, rowStyle} = props;
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const com = useSelector(state => state.com);
  const setting = com?.ext?.workShift?.setting ?? {};
  const businessHours = setting.businessHours?.[displayService] ?? {};
  const {date} = useParams();
  const dateList = useSelector(state => state.dateList);
  const dateDt = dateList.find(dateDt => dateDt.date.getDate() === parseInt(date)) ?? {};
  const startTime = parseInt(((displayService==="放課後等デイサービス" && dateDt.holiday>=1 ?businessHours.holidayStart :businessHours.start) ?? WORK_SHIFT_START_TIME).split(":")[0]);
  const endTime = parseInt(((displayService==="放課後等デイサービス" && dateDt.holiday>=1 ?businessHours.holidayEnd :businessHours.end) ?? WORK_SHIFT_END_TIME).split(":")[0]);

  const timeCols = Array(endTime-startTime+1).fill(null).map(_ => {
    return(
      <div className='timeCol'>
        <div className='timeSeparator' />
        <div className='timeSeparator' />
        <div className='timeSeparator' />
        <div className='timeSeparator' />
      </div>
    )
  });

  const [startHours, startMinutes] = (schDt?.start ?? "00:00").split(":").map(Number);
  const startMin = startHours*60 + startMinutes;
  const [endHours, endMinutes] = (schDt?.end ?? "00:00").split(":").map(Number);
  const endMin = endHours*60 + endMinutes;
  const totalMin = schDt.absence ?0 :endMin - startMin;
  const totalhours = Math.floor(totalMin / 60);
  const totalMinutes = String(totalMin % 60).padStart(2, '0');
  return(
    <div className={`row ${props.className || ""}`} style={{...rowStyle}}>
      <div className='rowHeader'>
        {user.name ?? "名前未登録"}
      </div>
      <div className='timeCols'>
        {timeCols}
        <UserSchBar schDt={schDt} />
      </div>
      <div className='totalTime'>{totalhours}時間{totalMinutes}分</div>
    </div>
  )
}

const UserSchListHeader = () => {
  const users = useSelector(state => state.users);
  const schedule = useSelector(state => state.schedule);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const classes = useStyles();
  const did = useGetDid();

  const detailedOpenRef = useRef(null);
  const [detailedOpen, setDetailedOpen] = useSessionStorageState(true, "WorkShiftDailyUserSchDetailedOpen");

  Object.entries(schedule).forEach(([uidStr, sch]) => {
    console.log(sch?.[did])
  })
  const userSchRows = Object.entries(schedule).filter(([uidStr, sch]) => {
    const schDt = sch[did];
    if(!/^UID\d+$/.test(uidStr)) return false;
    if(!checkValueType(schDt, 'Object')) return false;
    if(service && schDt.service && service!==schDt.service) return false;
    if(classroom && schDt.classroom && classroom!==schDt.classroom) return false;
    const user = users.find(prevUser => "UID"+prevUser.uid === uidStr) ?? {};
    if(service && user.service && !user.service.includes(service)) return false;
    if(classroom && user.classroom && !user.classroom.includes(classroom)) return false;
    return true;
  }).sort((a, b) => {
    const aSchDt = a[1][did];
    const bSchDt = b[1][did];
    if(aSchDt?.absence && !bSchDt?.absence) return 1;
    if(!aSchDt?.absence && bSchDt?.absence) return -1;
    const aStart = aSchDt?.start ?? "00:00";
    const bSatrt = bSchDt?.start ?? "00:00";
    console.log("aStart", aStart, "bSatrt", bSatrt)
    const comparedStart = aStart.localeCompare(bSatrt);
    if(comparedStart !== 0) return comparedStart;
    const aUser = users.find(prevUser => "UID"+prevUser.uid === a[0]);
    const bUser = users.find(prevUser => "UID"+prevUser.uid === b[0]);
    return aUser.sindex - bUser.sindex;
  }).map(([uidStr, sch]) => {
    const user = users.find(prevUser => "UID"+prevUser.uid === uidStr) ?? {};
    const schDt = sch[did];
    return(
      <UserSchRow
        user={user} schDt={schDt}
        className={!detailedOpen ?'notPrint' :''}
        rowStyle={{
          minHeight: detailedOpen ?`${USER_SCH_ROW_MINHEIGHT}px` :'0',
          visibility: detailedOpen ?'visible' :'hidden'
        }}
      />
    )
  });

  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const com = useSelector(state => state.com);
  const setting = com?.ext?.workShift?.setting ?? {};
  const businessHours = setting.businessHours?.[displayService] ?? {};
  const {date} = useParams();
  const dateList = useSelector(state => state.dateList);
  const dateDt = dateList.find(dateDt => dateDt.date.getDate() === parseInt(date)) ?? {};
  const startTime = parseInt(((displayService==="放課後等デイサービス" && dateDt.holiday>=1 ?businessHours.holidayStart :businessHours.start) ?? WORK_SHIFT_START_TIME).split(":")[0]);
  const endTime = parseInt(((displayService==="放課後等デイサービス" && dateDt.holiday>=1 ?businessHours.holidayEnd :businessHours.end) ?? WORK_SHIFT_END_TIME).split(":")[0]);

  const timeCols = Array(endTime-startTime+1).fill(null).map((_, i) => {
    const startTargetMin = (startTime + i) * 60;
    const endTargetMin = (startTime + i + 1) * 60;
    const userCnt = Object.entries(schedule).filter(([uidStr, sch]) => {
      const schDt = sch[did];
      if(!/^UID\d+$/.test(uidStr)) return false;
      if(!checkValueType(schDt, 'Object')) return false;
      if(service && schDt.service && service!==schDt.service) return false;
      if(classroom && schDt.classroom && classroom!==schDt.classroom) return false;
      const user = users.find(prevUser => "UID"+prevUser.uid === uidStr) ?? {};
    if(service && user.service && service!==user.service) return false;
    if(classroom && user.classroom && classroom!==user.classroom) return false;
      return true;
    }).reduce((prevUserCnt, [uidStr, sch]) => {
      const schDt = sch[did];
      const start = schDt?.start ?? "00:00";
      const [startHours, startMinutes] = start.split(":").map(Number);
      const startMin = startHours*60 + startMinutes;
      const end = schDt.end ?? "00:00";
      const [endHours, endMinutes] = end.split(":").map(Number);
      const endMin = endHours*60 + endMinutes;
      if(startMin < endTargetMin && endMin > startTargetMin) prevUserCnt++;
      return prevUserCnt;
    }, 0);

    return(
      <div
        className='timeCol'
        style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          borderTop: detailedOpen ?`2px solid ${grey[400]}` :null,
          borderRight: `1px solid #ddd`
        }}
      >
        {userCnt}人
      </div>
    )
  });

  const userSchRowsRef = useRef(null);
  const [position, setPosition] = useState({y: null});
  const rangeLimitMaxY = userSchRows.length * USER_SCH_ROW_MINHEIGHT >= USERSCHLIST_MAXHEIGHT ?USERSCHLIST_MAXHEIGHT :userSchRows.length * USER_SCH_ROW_MINHEIGHT;
  const drag = useMoveOnDragElement(position, setPosition, {minY: USERSCHLIST_MINHEIGHT, maxY: rangeLimitMaxY+MASIC_MAXHEIGHT});
  useEffect(() => {
    const hoge = Object.entries(schedule).filter(([uidStr, sch]) => {
      const schDt = sch[did];
      if(!/^UID\d+$/.test(uidStr)) return false;
      if(!checkValueType(schDt, 'Object')) return false;
      if(service && schDt.service && service!==schDt.service) return false;
      if(classroom && schDt.classroom && classroom!==schDt.classroom) return false;
      const user = users.find(prevUser => "UID"+prevUser.uid === uidStr) ?? {};
    if(service && user.service && service!==user.service) return false;
    if(classroom && user.classroom && classroom!==user.classroom) return false;
      return true;
    });
    const initHeight = USER_SCH_ROW_MINHEIGHT * 5 - 1;
    const offsetHeight = hoge.length * USER_SCH_ROW_MINHEIGHT >= initHeight ?initHeight :hoge.length * USER_SCH_ROW_MINHEIGHT;
    if(offsetHeight > initHeight) setPosition({y: initHeight});
    else setPosition({y: offsetHeight});
  }, [did, schedule]);

  return(
    <>
    <div
      ref={userSchRowsRef}
      className="userSchRows"
      style={{
        height: detailedOpen ?position.y :0,
      }}
    >
      {/* <div className='scrollButton' style={{top: 0}}>
        <IconButton onClick={() => userSchRowsRef.current.scrollBy({ top: -64, behavior: 'smooth' })}><ExpandLessIcon /></IconButton>
      </div> */}
      {userSchRows}
      {/* <div className='scrollButton' style={{bottom: 0}}>
        <IconButton onClick={() => userSchRowsRef.current.scrollBy({ top: 64, behavior: 'smooth' })}><ExpandMoreIcon /></IconButton>
      </div> */}
    </div>
    <div
      className="row"
      style={{cursor: detailedOpen ?'row-resize' :'auto'}}
      onPointerDown={(e) => {drag.onPointerDown(e); userSchRowsRef.current.style.transition = 'none';}}
      onPointerMove={drag.onPointerMove}
      onPointerUp={(e) => {drag.onPointerUp(e); userSchRowsRef.current.style.transition = 'height 0.3s ease';}}
    >
      <div
        className='rowHeader'
        style={{
          display: 'flex', alignItems: 'center',
          borderTop: detailedOpen ?`2px solid ${grey[400]}` :'none',
        }}
      >
        利用者数
        <IconButton
          ref={detailedOpenRef}
          className='detailedOpenIcon'
          onPointerDown={(e) => {
            e.stopPropagation();
            setDetailedOpen(prevDetaiedOpen => !prevDetaiedOpen);
          }}
          style={{padding: '4px', position: 'absolute', right: '4px'}}
        >
          {detailedOpen ?<RemoveIcon /> :<AddIcon />}
        </IconButton>
        <ToolTip text={detailedOpen ?"利用者予定非表示" :"利用者予定表示"} placement="bottom" elementRef={detailedOpenRef} />
      </div>
      <div className='timeCols'>{timeCols}</div>
      <div className='totalTime' style={{borderTop: detailedOpen ?`2px solid ${grey[400]}` :'none'}} />
    </div>
    </>
  )
}

const ShiftBar = (props) => {
  const classes = useStyles();
  const ref = useRef(null);
  const {controlMode} = useContext(ControlModeContext);
  const {setShiftEditDialogParams} = useContext(ShiftEditDialogContext);
  const {setWorkShift} = useContext(WorkShiftContext);
  const did = useGetDid();
  const {shift, setTimeColsHeight, staff, userShifts} = props;

  useEffect(() => {
    if(!ref.current) return;
    const offsetHeight = ref.current.offsetHeight + 16;
    setTimeColsHeight(prevTimeColsHeight => {
      if(!prevTimeColsHeight) return offsetHeight;
      if(prevTimeColsHeight < offsetHeight) return offsetHeight;
      return prevTimeColsHeight;
    })
  }, [ref?.current, userShifts]);

  const handleClickShiftCard = () => {
    if(controlMode === "edit"){
      // 編集
      setShiftEditDialogParams({open: true, shiftDt: shift, did, staffDt: staff, userShifts});
    }else if(controlMode === "delete"){
      // 削除処理
      setWorkShift(prevWorkShift => {
        const newWorkShift = JSON.parse(JSON.stringify(prevWorkShift));
        const shifts = newWorkShift[did];
        const targetIndex = shifts.findIndex(s => s.id === shift.id);
        if(targetIndex + 1){
          // 既存のシフトデータがあるときは削除
          shifts.splice(targetIndex, 1);
        }
        return newWorkShift;
      });
    }
  }

  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const com = useSelector(state => state.com);
  const setting = com?.ext?.workShift?.setting ?? {};
  const businessHours = setting.businessHours?.[displayService] ?? {};
  const {date} = useParams();
  const dateList = useSelector(state => state.dateList);
  const dateDt = dateList.find(dateDt => dateDt.date.getDate() === parseInt(date)) ?? {};
  const startTime = parseInt(((displayService==="放課後等デイサービス" && dateDt.holiday>=1 ?businessHours.holidayStart :businessHours.start) ?? WORK_SHIFT_START_TIME).split(":")[0]);
  const endTime = parseInt(((displayService==="放課後等デイサービス" && dateDt.holiday>=1 ?businessHours.holidayEnd :businessHours.end) ?? WORK_SHIFT_END_TIME).split(":")[0]);

  const start = shift.start;
  const [startHours, startMinutes] = start.split(":").map(Number);
  const startMin = startHours*60 + startMinutes;
  const end = shift.end;
  const [endHours, endMinutes] = end.split(":").map(Number);
  const endMin = endHours*60 + endMinutes;
  const shiftMin = endMin - startMin;
  const overallMin = (endTime - startTime + 1) * 60;
  const startPosition = startMin - startTime * 60;

  const editMode = controlMode === "edit";
  const deleteMode = controlMode === "delete";
  const maskStyle = {
    color: editMode ?teal[800] :deleteMode ?red[800] :null,
    backgroundColor: editMode ?alpha(teal[100], 0.5) :deleteMode ?alpha(red[100], 0.5) :null,
  }

  if(shift.absence) return(
    <>
    <div
      className={`${classes.ShiftBar} shiftBar`}
      style={{
        left: `${startPosition / overallMin * 100}%`,
        width: `${shiftMin / overallMin * 100}%`,
        backgroundColor: red["A700"],
        opacity: shift.isAdding ?0.5 :1,
        cursor: (controlMode==="delete" || controlMode==="edit") ?"pointer" :null,
        flexDirection: 'column'
      }}
      ref={ref}
      onClick={handleClickShiftCard}
    >
      <div className='label'>欠勤</div>
      {(shiftMin >= 60*3 && Boolean(shift.memo)) &&<div className='memo' style={{marginTop: 4}}>{brtoLf(shift.memo || "")}</div>}
      {editMode &&<div className='mask' style={{...maskStyle}}><EditIcon className='icon' /></div>}
      {deleteMode &&<div className='mask' style={{...maskStyle}}><DeleteForeverIcon className='icon' /></div>}
    </div>
    {(shiftMin < 60*3 && Boolean(shift.memo)) &&(
      <ToolTip placement="bottom" elementRef={ref}>
        <div style={{fontSize: '14px', maxWidth: '160px'}}>
          <div style={{marginTop: 4}}>{brtoLf(shift.memo)}</div>
        </div>
      </ToolTip>
    )}
    </>
  );

  return(
    <>
    <div
      className={`${classes.ShiftBar} shiftBar`}
      style={{
        left: `${startPosition / overallMin * 100}%`,
        width: `${shiftMin / overallMin * 100}%`,
        backgroundColor: shift.color ?? grey[400],
        opacity: shift.isAdding ?0.5 :1,
        cursor: (controlMode==="delete" || controlMode==="edit") ?"pointer" :null
      }}
      ref={ref}
      onClick={handleClickShiftCard}
    >
      {shiftMin >= 60*3 &&<div className='start time'>{start}</div>}
      {shiftMin >= 60*3 &&<div className='end time'>{end}</div>}
      <div className='label'>
        {shift.label || "パターンなし"}
        {(shiftMin >= 60*3 && !Boolean(shift.noBreaks)) &&<div className='break' style={{marginTop: 4}}>休憩{String(shift.breakTime ?? 60)}分</div>}
        {(shiftMin >= 60*3 && Boolean(shift.noBreaks)) &&<div className='break' style={{marginTop: 4}}>休憩なし</div>}
      </div>
      {(shiftMin >= 60*3 && Boolean(shift.memo)) &&<div className='memo' style={{marginTop: 4}}>{brtoLf(shift.memo || "")}</div>}
      {editMode &&<div className='mask' style={{...maskStyle}}><EditIcon className='icon' /></div>}
      {deleteMode &&<div className='mask' style={{...maskStyle}}><DeleteForeverIcon className='icon' /></div>}
    </div>
    {shiftMin < 60*3 &&(
      <ToolTip placement="bottom" elementRef={ref}>
        <div style={{fontSize: '14px', maxWidth: '160px'}}>
          <div style={{marginBottom: 4}}>{shift.start}〜{shift.end}</div>
          <div>休憩{shift.noBreaks ?"なし": shift.breakTime+"分"}</div>
          {Boolean(shift.memo) &&<div style={{marginTop: 4}}>{brtoLf(shift.memo)}</div>}
        </div>
      </ToolTip>
    )}
    </>
  )
}

const ShiftSpecialBar = (props) => {
  const classes = useStyles();
  const {controlMode} = useContext(ControlModeContext);
  const ref = useRef(null);
  const {setShiftEditDialogParams} = useContext(ShiftEditDialogContext);
  const {setWorkShift} = useContext(WorkShiftContext);
  const did = useGetDid();
  const {shift, setTimeColsHeight, staff, userShifts} = props;

  useEffect(() => {
    if(!ref.current) return;
    const offsetHeight = ref.current.offsetHeight + 16;
    setTimeColsHeight(prevTimeColsHeight => {
      if(!prevTimeColsHeight) return offsetHeight;
      if(prevTimeColsHeight < offsetHeight) return offsetHeight;
      return prevTimeColsHeight;
    })
  }, [ref?.current, userShifts]);

  if(shift.new) return(
    <div
      className={`${classes.ShiftBar} shiftBar`}
      style={{
        top: 0, left: 0,
        width: '100%', height: '100%',
        backgroundColor: alpha(teal[100], 0.5),
        border: `2px solid ${teal[800]}`, boxSizing: 'border-box',
        textAlign: 'center',
        display: 'flex', justifyContent: 'center', alignItems: 'center'
      }}
    >
      {(shift.new ?? false) &&<AddIcon style={{color: teal[800]}}/>}
    </div>
  );

  const handleClickShiftCard = () => {
    if(controlMode === "edit"){
      // 編集
      setShiftEditDialogParams({open: true, shiftDt: shift, did, staffDt: staff});
    }else if(controlMode === "delete"){
      // 削除処理
      setWorkShift(prevWorkShift => {
        const newWorkShift = JSON.parse(JSON.stringify(prevWorkShift));
        const shifts = newWorkShift[did];
        const targetIndex = shifts.findIndex(s => s.id === shift.id);
        if(targetIndex + 1){
          // 既存のシフトデータがあるときは削除
          shifts.splice(targetIndex, 1);
        }
        return newWorkShift;
      });
    }
  }

  const editMode = controlMode === "edit";
  const deleteMode = controlMode === "delete";
  const maskStyle = {
    color: editMode ?teal[800] :deleteMode ?red[800] :null,
    backgroundColor: editMode ?alpha(teal[100], 0.5) :deleteMode ?alpha(red[100], 0.5) :null,
  }
  if(shift.paidHoliday || shift.publicHoliday) return(
    <div
      className={`${classes.ShiftBar} shiftBar`}
      style={{
        left: 0,
        width: '100%',
        backgroundColor: shift.color ?? grey[400],
        textAlign: 'center',
        cursor: (controlMode==="delete" || controlMode==="edit") ?"pointer" :null
      }}
      ref={ref}
      onClick={handleClickShiftCard}
    >
      {(shift.paidHoliday ?? false) &&"有給"}
      {(shift.publicHoliday ?? false) &&"公休"}
      {Boolean(shift.memo) &&<div style={{marginTop: '4px'}}>{brtoLf(shift.memo)}</div>}
      {editMode &&<div className='mask' style={{...maskStyle}}><EditIcon className='icon' /></div>}
      {deleteMode &&<div className='mask' style={{...maskStyle}}><DeleteForeverIcon className='icon' /></div>}
    </div>
  )
}

const LicenseItem = ({staff, license}) => {
  const licenseRef = useRef();
  return(
    <span ref={licenseRef}>
      <FiberManualRecordIcon key={license+staff.id} style={{color: teal[600], fontSize: '12px'}}/>
      <ToolTip text={license} placement="bottom" elementRef={licenseRef} align="start" />
    </span>
  )
}

const StaffRow = (props) => {
  const {staff, shiftDts, index} = props;
  const ref = useRef(null);
  const [timeColsHeight, setTimeColsHeight] = useState(null);

  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const {setSnack} = useContext(SnackContext)
  const {controlMode} = useContext(ControlModeContext);
  const {selectingShiftTemplate} = useContext(SelectingShiftTemplateContext);
  const {setShiftEditDialogParams} = useContext(ShiftEditDialogContext);
  const {setWorkShift} = useContext(WorkShiftContext);
  const {setRecentlyShifts} = useContext(RecentlyShiftsContext);
  const staffId = staff.id;
  const did = useGetDid();

  const [userShifts, setUserShifts] = useState(shiftDts);
  useEffect(() => {
    setUserShifts(shiftDts);
  }, [shiftDts]);


  useEffect(() => {
    if(!ref.current) return;
    const offsetHeight = ref.current.offsetHeight;
    setTimeColsHeight(prevTimeColsHeight => {
      if(!prevTimeColsHeight) return offsetHeight;
      if(prevTimeColsHeight < offsetHeight) return offsetHeight;
      return prevTimeColsHeight;
    })
  }, [ref.current]);

  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const com = useSelector(state => state.com);
  const setting = com?.ext?.workShift?.setting ?? {};
  const businessHours = setting.businessHours?.[displayService] ?? {};
  const {date} = useParams();
  const dateList = useSelector(state => state.dateList);
  const dateDt = dateList.find(dateDt => dateDt.date.getDate() === parseInt(date)) ?? {};
  const startTime = parseInt(((displayService==="放課後等デイサービス" && dateDt.holiday>=1 ?businessHours.holidayStart :businessHours.start) ?? WORK_SHIFT_START_TIME).split(":")[0]);
  const endTime = parseInt(((displayService==="放課後等デイサービス" && dateDt.holiday>=1 ?businessHours.holidayEnd :businessHours.end) ?? WORK_SHIFT_END_TIME).split(":")[0]);

  const timeCols = Array(endTime-startTime+1).fill(null).map(_ => {
    return(
      <div className='timeCol'>
        <div className='timeSeparator' />
        <div className='timeSeparator' />
        <div className='timeSeparator' />
        <div className='timeSeparator' />
      </div>
    )
  });

  const shiftBars = userShifts.filter(prevShift => {
    if(prevShift.isAdding) return true;
    if(service && prevShift.service && prevShift.service !== service) return false;
    if(classroom && prevShift.classroom && prevShift.classroom !== classroom) return false;
    return true;
  }).map(shift => {
    if(shift.new || shift.paidHoliday || shift.publicHoliday) return(
      <ShiftSpecialBar
        shift={shift} setTimeColsHeight={setTimeColsHeight} staff={staff}
        userShifts={userShifts}
      />
    );
    return(
      <ShiftBar
        shift={shift} setTimeColsHeight={setTimeColsHeight} staff={staff}
        userShifts={userShifts}
      />
    )
  })

  const handleMouseEnter = () => {
    if(controlMode === "addTemplate"){
      const isExisting = (userShifts ?? []).some(prevShift => prevShift.templateId === selectingShiftTemplate.id);
      const isSetted = userShifts.length > 0 && (selectingShiftTemplate.paidHoliday || selectingShiftTemplate.publicHoliday);
      const isSettedHoliday = (userShifts ?? []).some(prevShift => prevShift.paidHoliday || prevShift.publicHoliday);
      const isOverlapping = (userShifts ?? []).some(prevShift => (
        (prevShift.start < selectingShiftTemplate.end) && (selectingShiftTemplate.start < prevShift.end)
      ));
      if(isExisting || isSetted || isSettedHoliday || isOverlapping){
        ref.current.style.cursor = "not-allowed";
        return;
      }
      setUserShifts((prevUserShifts) => ([...prevUserShifts, {...selectingShiftTemplate, isAdding: true}]));
    }else if(controlMode === "add"){
      const isHoliday = (userShifts ?? []).some(prevShift => prevShift.paidHoliday || prevShift.publicHoliday);
      if(isHoliday){
        ref.current.style.cursor = "not-allowed";
        return;
      }
      ref.current.classList.add("add");
      ref.current.style.cursor = "pointer";
      setUserShifts((prevUserShifts) => ([...prevUserShifts, {new: true, isAdding: true}]));
    }
  }

  const handleMouseLeave = () => {
    if(controlMode === "addTemplate" || controlMode === "add"){
      ref.current.classList.remove('add');
      ref.current.style.cursor = "default";
      setUserShifts((prevUserShifts) => {
        const newUserShifts = JSON.parse(JSON.stringify(prevUserShifts));
        const deleteTargetIndex = newUserShifts.findIndex(shift => shift.isAdding);
        if(deleteTargetIndex + 1) newUserShifts.splice(deleteTargetIndex, 1);
        return newUserShifts;
      })
    }
  }

  const handleClickCell = () => {
    if(controlMode === "addTemplate"){
      // テンプレートで追加
      const isExisting = userShifts.some(prevShift => prevShift.templateId === selectingShiftTemplate.id);
      if(isExisting) {
        setSnack({msg: "設定済みです。", id: new Date().getTime()});
        return;
      }
      const isSetted = (selectingShiftTemplate.paidHoliday || selectingShiftTemplate.publicHoliday)
        && userShifts.some(prevShift => {
          if(prevShift.isAdding) return;
          return !prevShift.paidHoliday && !prevShift.publicHoliday
        });
      const isSettedHoliday = userShifts.some(prevShift => {
        if(prevShift.isAdding) return false;
        return prevShift.paidHoliday || prevShift.publicHoliday;
      });
      if(isSetted || isSettedHoliday){
        setSnack({msg: "既存の予定があるため設定できません。", id: new Date().getTime()});
        return;
      }
      const isOverlapping = (userShifts ?? []).some(prevShift => {
        if(prevShift.isAdding) return false;
        return (prevShift.start < selectingShiftTemplate.end) && (selectingShiftTemplate.start < prevShift.end)
      });
      if(isOverlapping){
        setSnack({msg: "時間が重なっているため設定できません。", id: new Date().getTime()});
        return;
      }
      setWorkShift(prevWorkShift => {
        const newShiftDt = JSON.parse(JSON.stringify(selectingShiftTemplate));
        newShiftDt.id = crypto.randomUUID();
        newShiftDt.staffId = staffId;
        newShiftDt.templateId = selectingShiftTemplate.id;
        newShiftDt.service = service;
        newShiftDt.classroom = classroom;
        const newWorkShift = JSON.parse(JSON.stringify(prevWorkShift));
        if(!checkValueType(newWorkShift[did], 'Array')) newWorkShift[did] = [];
        newWorkShift[did].push(newShiftDt);
        return newWorkShift;
      });
      setRecentlyShifts(prevRecentlyShifts => {
        const newRecentlyShifts = JSON.parse(JSON.stringify(prevRecentlyShifts));
        const targetIndex = newRecentlyShifts.findIndex(shiftDt => shiftDt.id === selectingShiftTemplate.id);
        if(targetIndex + 1){
          // 既存のシフトデータがあるときは削除
          newRecentlyShifts.splice(targetIndex, 1);
        }
        newRecentlyShifts.unshift(selectingShiftTemplate);
        return newRecentlyShifts.slice(0, RECENTLY_SHIFTS_TIMES);
      });
    }else if(controlMode === "add"){
      // 新規追加
      const isSettedHoliday = userShifts.some(prevShift => {
        if(prevShift.isAdding) return false;
        return prevShift.paidHoliday || prevShift.publicHoliday;
      });
      if(isSettedHoliday){
        setSnack({msg: "既存の予定があるため設定できません。", id: new Date().getTime()});
        return;
      }
      setShiftEditDialogParams({open: true, shiftDt: {}, did, staffDt: staff, userShifts});
    }
  }

  const totalMin =shiftDts.filter(shift => {
    if(shift.new) return false;
    if(shift.paidHoliday) return false;
    if(shift.publicHoliday) return false;
    return true;
  }).reduce((prevTotalMin, shift) => {
    const [startHours, startMinutes] = shift.start.split(":").map(Number);
    const startMin = startHours*60 + startMinutes;
    const [endHours, endMinutes] = shift.end.split(":").map(Number);
    const endMin = endHours*60 + endMinutes;
    prevTotalMin += endMin - startMin;
    return prevTotalMin;
  }, 0);
  const totalhours = Math.floor(totalMin / 60);
  const totalMinutes = String(totalMin % 60).padStart(2, '0');
  return(
    <div className='row'>
      <div className='rowHeader'>
        {staff.name}
        {/* <div className='licenses'>{(staff.license ?? []).map(l => (<div key={l+staff.id}>{l}</div>))}</div> */}
        {/* <div className='licenses'>{(staff.license ?? []).map(l => (<FiberManualRecordIcon key={l+staff.id} style={{color: teal[600], fontSize: '14px'}}/>))}</div> */}
        <div className='licenses'>{(staff.license ?? []).map(l => (<LicenseItem staff={staff} license={l} />))}</div>
      </div>
      <div
        ref={ref}
        className={`timeCols`}
        style={{height: timeColsHeight <= 64 ?64 :timeColsHeight}}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(controlMode==="add" || controlMode==="addTemplate") ?handleClickCell :null}
      >
        {timeCols}
        {shiftBars}
      </div>
      <div className='totalTime'>{totalhours}時間{totalMinutes}分</div>
    </div>
  )
}

const MainTable = () => {
  const classes = useStyles();
  const {workShift, setWorkShift} = useContext(WorkShiftContext);
  const {setRecentlyShifts} = useContext(RecentlyShiftsContext);
  const [shiftEditDialogParams, setShiftEditDialogParams] = useState({open: false, shiftDt: {}, did: null, staffDt: {}});
  const did = useGetDid();
  
  const staffs = useGetStaffs();
  const staffRows = staffs.map((staff, index) => {
    const shiftDts = (workShift?.[did] ?? []).filter(shift => shift.staffId === staff.id).sort((a, b) => {
      // 有給
      if (a.paidHoliday && !b.paidHoliday) return -1;
      if (!a.paidHoliday && b.paidHoliday) return 1;
      // 公休
      if (a.publicHoliday && !b.publicHoliday) return -1;
      if (!a.publicHoliday && b.publicHoliday) return 1;
      // 開始時間
      return a.start.localeCompare(b.start);
    });
    return(
      <StaffRow
        key={`staffRow${staff.id}`}
        staff={staff} shiftDts={shiftDts}
        index={index}
      />
    )
  });

  return(
    <>
    <div className={classes.MainTable}>
      <div className='header'>
        <TimeListHeader did={did} />
        <UserSchListHeader />
      </div>
      <div className='body'>
        <ShiftEditDialogContext.Provider value={{setShiftEditDialogParams}}>
          <div className='staffRows'>{staffRows}</div>
        </ShiftEditDialogContext.Provider>
      </div>
    </div>
    <WorkShiftEditDialog
      dialogParams={shiftEditDialogParams} setDialogParams={setShiftEditDialogParams}
      setWorkShift={setWorkShift} setRecentlyShifts={setRecentlyShifts}
    />
    </>
  )
}

const WorkShiftTemplateTimeButtons = () => {
  const history = useHistory();
  const com = useSelector(state => state.com);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const scrollRef = useRef(null);
  const classes = useStyles();
  const {controlMode, setControlMode} = useContext(ControlModeContext);
  const {selectingShiftTemplate, setSelectingShiftTemplate} = useContext(SelectingShiftTemplateContext);
  const {recentlyShifts} = useContext(RecentlyShiftsContext);
  const shiftTemplates = useMemo(() => (com?.ext?.workShift?.shiftTemplates ?? []), [com]);

  const handleClick = useCallback((shiftTemplate) => {
    if(controlMode !== "addTemplate" || shiftTemplate.id !== selectingShiftTemplate?.id || !selectingShiftTemplate){
      setControlMode("addTemplate");
      setSelectingShiftTemplate(shiftTemplate);
    }else{
      setControlMode(null);
      setSelectingShiftTemplate(null);
    }
  }, [controlMode, setControlMode, selectingShiftTemplate, setSelectingShiftTemplate])

  const recentlyShiftCards = recentlyShifts.filter((prevShift => {
    if(service && prevShift.service && prevShift.service !== service) return false;
    if(classroom && prevShift.classroom && prevShift.classroom !== classroom) return false;
    return true;
  })).map(shiftTemplate => {
    if(shiftTemplate.publicHoliday || shiftTemplate.paidHoliday) return(
      <WorkShiftSpecialCard
        key={`recentlyShiftTemplate${shiftTemplate.id}`}
        label={shiftTemplate.label} color={shiftTemplate.color}
        onClick={() => handleClick(shiftTemplate)}
        opacity={controlMode==="addTemplate" && shiftTemplate.id === selectingShiftTemplate?.id ?1 :0.5}
        style={{cursor: 'pointer'}}
      />
    );
    return(
      <WorkShiftCard
        key={`recentlyShiftTemplate${shiftTemplate.id}`}
        label={shiftTemplate.label} color={shiftTemplate.color}
        start={shiftTemplate.start} end={shiftTemplate.end}
        onClick={() => handleClick(shiftTemplate)}
        opacity={controlMode==="addTemplate" && shiftTemplate.id === selectingShiftTemplate?.id ?1 :0.5}
        style={{cursor: 'pointer'}}
      />
    );
  });

  const shiftCards = shiftTemplates.filter((prevShift => {
    if(service && prevShift.service && prevShift.service !== service) return false;
    if(classroom && prevShift.classroom && prevShift.classroom !== classroom) return false;
    return true;
  })).map(shiftTemplate => (
    <WorkShiftCard
      key={`shiftTemplate${shiftTemplate.id}`}
      label={shiftTemplate.label} color={shiftTemplate.color}
      start={shiftTemplate.start} end={shiftTemplate.end}
      onClick={() => handleClick(shiftTemplate)}
      opacity={controlMode==="addTemplate" && shiftTemplate.id === selectingShiftTemplate?.id ?1 :0.5}
      style={{cursor: 'pointer'}}
    />
  ));

  const handleLeftScroll = () => {
    if(!scrollRef.current) return;
    const scrollLeft = scrollRef?.current?.scrollLeft ?? 0;
    scrollRef.current.scrollTo({
      left: scrollLeft - SHIFT_CARD_WIDTH * 6,
      behavior: 'smooth'
    });
  }

  const handleRightScroll = () => {
    if(!scrollRef.current) return;
    const scrollLeft = scrollRef?.current?.scrollLeft ?? 0;
    scrollRef.current.scrollTo({
      left: scrollLeft + SHIFT_CARD_WIDTH * 6,
      behavior: 'smooth'
    });
  }

  return(
    <div className={classes.TemplateTimeButtons}>
      <div className='scrollButton' style={{left: 0}}>
        <IconButton
          onClick={handleLeftScroll}
          style={{padding: 8}}
        >
          <ArrowLeftIcon className='icon' />
        </IconButton>
      </div>
      <div className='shiftTemplates' ref={scrollRef}>
        {recentlyShiftCards}
        {(recentlyShiftCards.length >= 1) &&<div className='separator' />}
        {shiftCards}
        <WorkShiftNewCard
          onClick={() => history.push("/workshift/templatesetting/")}
          rootStyle={{opacity: 0.5}}
        />
        <div className='separator' />
        <WorkShiftSpecialCard
          label="有給" color={brown["700"]}
          onClick={() => handleClick({...WORK_SHIFT_PAID_HOLIDAY_DT})}
          opacity={controlMode==="addTemplate" && selectingShiftTemplate?.paidHoliday ?1 :0.5}
          style={{cursor: 'pointer'}}
        />
        <WorkShiftSpecialCard
          label="公休" color={blueGrey["700"]}
          onClick={() => handleClick({...WORK_SHIFT_PUBLIC_HOLIDAY_DT})}
          opacity={controlMode==="addTemplate" && selectingShiftTemplate?.publicHoliday ?1 :0.5}
          style={{cursor: 'pointer'}}
        />
      </div>
      <div className='scrollButton' style={{right: 0}}>
        <IconButton
          onClick={handleRightScroll}
          style={{padding: 8}}
        >
          <ArrowRightIcon className='icon' />
        </IconButton>
      </div>
    </div>
  )
}

const WorkShiftMakeDaily = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {date} = useParams();
  const classes = useStyles();
  const [snack, setSnack] = useState({});
  const [controlMode, setControlMode] = useState(null);
  const [selectingShiftTemplate, setSelectingShiftTemplate] = useState(null);
  const [workShift, setWorkShift] = useFetchAndSendWorkShift();
  const [recentlyShifts, setRecentlyShifts] = useLocalStorageState([], "recentlyShiftTemplates");

  const optionsRef = useRef(null);
  const [keyInfo, setKeyInfo] = useState({key: '', shift: false, ctrl: false, meta: false});
  useEffect(() => {
    if(!keyInfo.key || !optionsRef.current) return;
    const key = keyInfo.key.toLowerCase();
    const buttons = optionsRef.current.getElementsByTagName("button");
    // 編集
    if (key === 'w'){
      for(const button of buttons){
        if(button.name === "controlModeDelete") button.click();
      }
    }
    // 追加
    if (key === 'q'){
      for(const button of buttons){
        if(button.name === "controlModeAdd") button.click();
      }
    }
    // 削除
    if (key === 'e'){
      for(const button of buttons){
        if(button.name === "controlModeEdit") button.click();
      }
    }
  }, [keyInfo]);

  if(!loadingStatus.loaded) return(
    <>
    <WorkShiftLinksTab />
    <LoadingSpinner />
    </>
  );

  const {com, stdDate, serviceItems, service, classroom} = allState;
  const [stdYear, stdMonth] = stdDate.split("-");

  return(
    <>
    <WorkShiftLinksTab />
    <div className={classes.AppPage}>
      <div className='printInfo'>
        {com.bname} {stdYear}年{stdMonth}月{String(date).padStart(2, '0')}日 {serviceItems.length>=2 ?service :""} {classroom}
      </div>
      <SnackContext.Provider value={{setSnack}}>
      <ControlModeContext.Provider value={{controlMode, setControlMode}}>
      <SelectingShiftTemplateContext.Provider value={{selectingShiftTemplate, setSelectingShiftTemplate}}>
      <WorkShiftContext.Provider value={{workShift, setWorkShift}}>
      <RecentlyShiftsContext.Provider value={{recentlyShifts, setRecentlyShifts}}>
        <MainTable />
        <div className='options' ref={optionsRef}>
          <WorkShiftTemplateTimeButtons />
          <WorkShiftControlModeChangeButton
            label="削除" thisControlMode="delete" setControlMode={setControlMode}
            backgroundColor={controlMode==="delete" ?red[700] :null}
            startIcon={<DeleteForeverIcon />}
            endIcon={"W"}
            name="controlModeDelete"
          />
          <WorkShiftControlModeChangeButton
            label="追加" thisControlMode="add" setControlMode={setControlMode}
            backgroundColor={controlMode==="add" ?teal[800] :null}
            startIcon={<AddIcon />}
            endIcon={"Q"}
            name="controlModeAdd"
          />
          <WorkShiftControlModeChangeButton
            label="編集" thisControlMode="edit" setControlMode={setControlMode}
            backgroundColor={controlMode==="edit" ?teal[800] :null}
            startIcon={<CreateIcon />}
            endIcon={"E"}
            name="controlModeEdit"
          />
        </div>
      </RecentlyShiftsContext.Provider>
      </WorkShiftContext.Provider>
      </SelectingShiftTemplateContext.Provider>
      </ControlModeContext.Provider>
      </SnackContext.Provider>
    </div>
    <SnackMsg {...snack}/>
    <KeyListener setKeyInfo={setKeyInfo} />
    <SetPrintTitle printTitle={`勤務（日次）${String(date).padStart(2, '0')}日`} />
    </>
  )
}
export default WorkShiftMakeDaily