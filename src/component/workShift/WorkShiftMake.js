import { Button, ButtonGroup, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, makeStyles } from '@material-ui/core';
import { blueGrey, brown, grey, orange, red, teal } from '@material-ui/core/colors';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getLodingStatus } from '../../commonModule';
import SnackMsg from '../common/SnackMsg';
import { DAY_LIST } from '../../hashimotoCommonModules';
import { LICENSE_LIST, WorkShiftNewCard, WorkShiftCard, useFetchAndSendWorkShift, WorkShiftLinksTab, WorkShiftControlModeChangeButton, WorkShiftEditDialog, WorkShiftSpecialCard, WORK_SHIFT_PUBLIC_HOLIDAY_DT, WORK_SHIFT_PAID_HOLIDAY_DT, useGetStaffs, WorkShiftMakeChangeButtons, WorkShiftWarning } from './WorkShiftCommon';
import { DraggableWindow, ToolTip, useLocalStorageState, useSessionStorageState } from '../common/HashimotoComponents';

import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ArrowLeftIcon from '@material-ui/icons/ArrowLeft';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import CreateIcon from '@material-ui/icons/Create';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { LoadingSpinner } from '../common/commonParts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from "@fortawesome/free-regular-svg-icons";
import { KeyListener } from '../common/KeyListener';

import './print.css';
import SetPrintTitle from '../common/SetPrintTitle';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { YesNoDialog } from '../common/GenericDialog';

const SIDEBAR_WIDTH = 61.25;
const SHIFT_CARD_WIDTH = 80;
const RECENTLY_SHIFTS_TIMES = 3;

const SnackContext = createContext({});
const WorkShiftContext = createContext({});
const ControlModeContext = createContext(null);
const SelectingShiftTemplateContext = createContext(null);
const ShiftEditDialogContext = createContext(null);
const RecentlyShiftsContext = createContext([]);

const useStyles = makeStyles({
  AppPage: {
    minWidth: 1080, width: 'fit-content',
    margin: `82px 16px 128px 0`,
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
      zoom: '0.8',
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
  WorkShiftTable: {
    width: '100%',
    '& *': {userSelect: 'none'},
    '& .row': {
      display: 'flex',
      '& .rowHeader': {
        width: 192+SIDEBAR_WIDTH+8, minWidth: 192+SIDEBAR_WIDTH+8,
        padding: `8px 8px 8px ${SIDEBAR_WIDTH+8}px`,
        borderRight: `2px solid ${grey[400]}`,
        borderBottom: `1px solid #ddd`,
        backgroundColor: '#fff',
        position: 'sticky', left: 0
      },
      '& .cell': {
        width: 88, minWidth: 88,
        padding: '8px 4px',
        borderBottom: `1px solid #ddd`,
        backgroundColor: '#fff'
      },
      '& .day1, .day3, .day5': { backgroundColor: grey[100]},
      '& .holiday0': {},
      '& .holiday1': {backgroundColor: "#fff1e2"},
      '& .holiday2': {backgroundColor: "#cacad9"},
    },
    '& .header': {
      position: 'sticky', top: 82,
      zIndex: 3,
      '& .dateListRows': {
        '& .row': {
          '& .rowHeader': {
            zIndex: 3,
            borderBottom: `2px solid ${grey[400]}`,
          },
          '& .cell': {
            textAlign: 'center',
            borderBottom: `2px solid ${grey[400]}`,
            paddingBottom: 0,
            '& .dateInfo': {
              display: 'flex', justifyContent: 'center',
              '&:hover': {
                color: teal[400], fontWeight: 'bold',
                cursor: 'pointer'
              }
            },
          },
        },
      },
      '& .licenseRows': {
        '& .row': {
          transition: "height 0.3s ease",
          '& .rowHeader': {
            fontSize: 14,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          },
          '& .cell': {
            display: 'flex', justifyContent: 'center', alignItems: 'center',
          },
          '&:last-child': {
            '& .rowHeader': {
              borderBottom: `2px solid ${grey[400]}`
            },
            '& .cell': {
              borderBottom: `2px solid ${grey[400]}`
            },
          }
        }
      },
    },
    '& .body': {
      '& .row': {
        breakInside: 'avoid',
        '& .rowHeader': {
          zIndex: 2,
          '& .licenses': {
            marginTop: '4px',
            fontSize: 12, color: teal[600],
            '& > div': {
              '&:not(:last-child)': {
                marginBottom: 4
              }
            }
          },
          '& .numOfWork': {
            position: 'absolute', bottom: '8px', right: '8px',
            fontSize: 12
          },
          '& .workCnt': {
            fontSize: '13px', marginTop: '4px',
            '& .cnt': {marginLeft: '4px'}
          },
          '& .menuButton': {
            position: 'absolute', right: 0, top: 0,
            height: '100%',
            padding: '8px',
            display: 'flex', alignItems: 'center',
            cursor: 'pointer',
            '& .menuIcon': {
              transition: '0.3s',
              color: grey[800],
              opacity: 0
            }
          },
          '&:hover': {
            '& .menuButton': {
              '& .menuIcon': {
                opacity: 1
              }
            },
          }
        },
        '& .cell': {
          '&.add': {
            '&:hover': {cursor: 'pointer'}
          },
          '& .shiftCards': {
            '& > div:not(:last-child)': { marginBottom: 4 }
          }
        }
      },
      '& .staffRows': {
        '& .row': {
          '& .cell': {
            minHeight: 54
          }
        }
      }
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
      '& .row': {
        '& .rowHeader': {
          width: 160+8, minWidth: 160+8,
          padding: `8px 4px !important`,
          position: 'block',
        },
        '& .cell': {
          width: "56px !important", minWidth: "56px !important",
        },
      },
      '& .header': {
        position: 'initial',
        '& .dateListRows': {
          '& .row': {
            '& .cell': {
              borderBottom: `2px solid ${grey[400]}`,
              paddingBottom: "8px !important",
              '& .dateInfo': {
                display: 'block !important'
              },
              '& .schInfoIcon': {
                display: 'none'
              }
            }
          },
        },
        '& .licenseRows': {
          '& .detailedOpenIcon': {display: 'none'}
        }
      }
    }
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
  SchInfoWindowContents: {
    '& .info': {
      display: 'flex', justifyContent: 'center',
      marginBottom: 12
    },
    '& .schUserTable': {
      '& .row': {
        display: 'flex',
        '& > div': {
          '&:nth-child(even)': {
            backgroundColor: grey[100]
          },
          '&:nth-child(odd)': {
            backgroundColor: '#fff'
          },
        },
        '& .name': {width: '8rem'},
        '& .time': {width: '4rem'},
        '& .transfer': {width: '6rem'}
      },
      '& .schUserTableHeader': {
        borderBottom: `1px solid ${teal[600]}`,
        '& .row': {
          '& > div': {
            padding: '6px 4px 4px'
          }
        }
      },
      '& .schUserTableBody': {
        maxHeight: 330,
        overflow: 'auto', overscrollBehavior: 'contain',
        '& .row': {
          borderBottom: `1px solid #ddd`,
          '& > div': {
            padding: '8px 4px'
          }
        }
      }
    }
  }
});

const SchInfoWindow = (props) => {
  const schedule = useSelector(state => state.schedule);
  const users = useSelector(state => state.users);
  const {open, setOpen, dateDt, positionX, positionY} = props;
  const classes = useStyles();
  const [sortMode, setSortMode] = useSessionStorageState("nomal", "WorkShiftSchInfoWindowSortMode");

  if(!open) return null;

  const year = dateDt.date.getFullYear();
  const month = dateDt.date.getMonth();
  const date = dateDt.date.getDate();
  const day = dateDt.date.getDay();

  const did = "D" + String(year) + String(month+1).padStart(2, '0') + String(date).padStart(2, '0');
  const targetUidStrs = Object.keys(schedule).filter(uidStr => {
    if(!/^UID\d+$/.test(uidStr)) return false;
    const user = users.find(u => "UID"+u.uid === uidStr);
    if(!user) return false;
    const sch = schedule[uidStr] ?? {};
    if(!sch[did]) return false;
    return true;
  }).sort((aUidStr, bUidStr) => {
    if(sortMode === "nomal"){
      const aUser = users.find(user => "UID"+user.uid === aUidStr);
      const bUser = users.find(user => "UID"+user.uid === bUidStr);
      return parseInt(aUser.sindex) - parseInt(bUser.sindex);
    }else if(sortMode === "start"){
      const aSchDt = schedule[aUidStr][did];
      const bSchDt = schedule[bUidStr][did];
      const aStart = aSchDt?.start ?? "00:00";
      const bStart = bSchDt?.start ?? "00:00";
      const [hours1, minutes1] = aStart.split(":").map(x => parseInt(x));
      const [hours2, minutes2] = bStart.split(":").map(x => parseInt(x));
      if (hours1 !== hours2) {
        return hours1 - hours2;
      } else if (minutes1 !== minutes2) {
        // 分が異なる場合も時刻でソート
        return minutes1 - minutes2;
      } else {
        // 時刻が同じ場合はkeyでソート
        return (aSchDt.groupe ?? "").localeCompare((bSchDt.groupe ?? ""));
      }
    }
  });
  const userInfos = targetUidStrs.map(uidStr => {
    const schDt = schedule[uidStr][did];
    const user = users.find(u => "UID"+u.uid === uidStr);
    return(
      <div className='row' style={{display: 'flex'}}>
        <div className='name'>{user.name ?? "氏名未登録"}</div>
        <div className='transfer'>{schDt.transfer[0]}</div>
        <div className='time'>{schDt.start}</div>
        <div className='time'>{schDt.end}</div>
        <div className='transfer'>{schDt.transfer[1]}</div>
      </div>
    )
  });

  const sortButtonGroupe = (
    <ButtonGroup>
      <Button
        color='primary'
        variant='outlined'
        onClick={() => setSortMode("nomal")}
        disabled={sortMode === "nomal"}
        className='sortButton'
      >
        標準
      </Button>
      <Button
        color='primary'
        variant='outlined'
        onClick={() => setSortMode("start")}
        disabled={sortMode === "start"}
        className='sortButton'
      >
        時間順
      </Button>
    </ButtonGroup>
  )

  return(
    <DraggableWindow
      defaultPositionX={positionX} defaultPositionY={positionY}
      open={open} onClose={() => setOpen(false)}
      headerTitle="予定確認" style={{zIndex: 3}}
      actionsComponent={sortButtonGroupe}
    >
      <div className={classes.SchInfoWindowContents}>
        <div className='info'>
          <div style={{marginRight: 16}}>{String(month+1).padStart(2, '0')}/{String(date).padStart(2, '0')}({DAY_LIST[day]})</div>
          <div>利用人数<span>{userInfos.length}人</span></div>
        </div>
        <div className='schUserTable'>
          <div className='schUserTableHeader'>
            <div className='row'>
              <div className='name'>名前</div>
              <div className='transfer'>迎え</div>
              <div className='time'>開始</div>
              <div className='time'>終了</div>
              <div className='transfer'>送り</div>
            </div>
          </div>
          <div className='schUserTableBody'>
            {userInfos}
          </div>
        </div>
      </div>
    </DraggableWindow>
  )
}

const DateInfo = (props) => {
  const history = useHistory();
  const dateRef = useRef(null);
  const {date, day} = props;

  const handleClickDate = useCallback((date) => {
    history.push(`/workshift/daily/${date}/`)
  }, [history]);

  return(
    <>
    <div ref={dateRef} className='dateInfo' onClick={() => handleClickDate(date)}>
      <div>{date}</div><div>({DAY_LIST[day]})</div>
    </div>
    <ToolTip
      text="日次へ" placement="bottom" elementRef={dateRef}
      style={{marginTop: '8px'}}
    />
    </>
  )
}

const SchInfoIconButton = (props) => {
  const schInfoRef = useRef(null);

  return(
    <div ref={schInfoRef}>
      <IconButton
        onClick={props.onClick}
        style={{padding: 8}}
        className='schInfoIcon'
      >
        <FontAwesomeIcon icon={faCalendarAlt} style={{color: teal[500], fontSize: 20}} />
      </IconButton>
      <ToolTip text="予定確認" placement="bottom" elementRef={schInfoRef}/>
    </div>
  )
}

const DateListHeader = (props) => {
  const {workShift} = props;
  const dateList = useSelector(state => state.dateList);
  const [schInfoWindowOpen, setSchInfoWindowOpen] = useState(false);
  const [dateDt, setDateDt] = useState(null);
  const [positionX, setPositionX] = useState(null);
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-");

  const handleClick = (event, thisDateDt) => {
    const clickPositionX = event.clientX;
    const innerWidth = window.innerWidth;
    if(clickPositionX <= innerWidth / 2){
      // 左側に表示
      setPositionX(clickPositionX+100);
    }else{
      // 右側に表示
      setPositionX(clickPositionX-476-96);
    }
    setDateDt(thisDateDt);
    setSchInfoWindowOpen(true);
  };

  const dateCells = dateList.map(thisDateDt => {
    const date = thisDateDt.date.getDate();
    const day = thisDateDt.date.getDay();
    const holiday = thisDateDt.holiday ?? "0";
    const did = `D${stdYear}${stdMonth}${String(date).padStart(2, '0')}`;
    return(
      <div
        key={`dateCell${date}`}
        className={`cell day${day} holiday${holiday}`}
      >
        <DateInfo date={date} day={day} />
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <SchInfoIconButton onClick={(event) => handleClick(event, thisDateDt)} />
          <WorkShiftWarning
            workShift={workShift} did={did} holiday={holiday}
            rootStyle={{marginTop: '3px'}}
          />
        </div>
      </div>
    )
  });

  return(
    <>
    <div className='row'>
      <div className='rowHeader'
        style={{
          display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
          paddingBottom: '4px'
        }}
      >
        <WorkShiftMakeChangeButtons />
      </div>
      {dateCells}
    </div>
    <SchInfoWindow
      open={schInfoWindowOpen} setOpen={setSchInfoWindowOpen}
      dateDt={dateDt}
      positionX={positionX} positionY={160}
    />
    </>
  )
}

const WorkShiftTableCell = (props) => {
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const {setSnack} = useContext(SnackContext)
  const {controlMode} = useContext(ControlModeContext);
  const {selectingShiftTemplate} = useContext(SelectingShiftTemplateContext);
  const {setShiftEditDialogParams} = useContext(ShiftEditDialogContext);
  const {setWorkShift} = useContext(WorkShiftContext);
  const {setRecentlyShifts} = useContext(RecentlyShiftsContext);
  const {staffShifts, did, staff, day, holiday} = props;
  const staffId = staff.id;
  const ref = useRef();

  const [userShifts, setUserShifts] = useState(staffShifts);
  useEffect(() => {
    setUserShifts(staffShifts);
  }, [staffShifts]);

  const handleClickShiftCard = (shift) => {
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

  const adjustedStaffShifts = userShifts.filter(prevShift => {
    if(prevShift.isAdding) return true;
    if(service && prevShift.service && prevShift.service !== service) return false;
    if(classroom && prevShift.classroom && prevShift.classroom !== classroom) return false;
    return true;
  }).sort((a, b) => {
    const timeAStart = new Date(`1970-01-01T${a.start}:00`);
    const timeBStart = new Date(`1970-01-01T${b.start}:00`);

    if (timeAStart < timeBStart) return -1;
    if (timeAStart > timeBStart) return 1;

    const timeAEnd = new Date(`1970-01-01T${a.end}:00`);
    const timeBEnd = new Date(`1970-01-01T${b.end}:00`);

    return timeAEnd - timeBEnd;
  });
  const shiftCards = adjustedStaffShifts.map((shift, i) => {
    if(shift.new) return(<WorkShiftNewCard key={`cellShiftNewCard${staffId}`} />);
    if(shift.absence) return(
      <WorkShiftSpecialCard
        key={`cellShiftAbsenceCard${staffId}`}
        label="欠勤" color={red["A700"]}
        editMode={controlMode === "edit"} deleteMode={controlMode === "delete"}
        onClick={(controlMode==="delete" || controlMode==="edit") ?(() => handleClickShiftCard(shift)) :null}
        style={{
          cursor: (controlMode==="delete" || controlMode==="edit") ?"pointer" :null
        }}
      />
    );
    if(shift.publicHoliday) return(
      <WorkShiftSpecialCard
        key={`cellShiftPublicHolidayCard${staffId}`}
        label="公休" color={blueGrey["600"]}
        editMode={controlMode === "edit"} deleteMode={controlMode === "delete"}
        onClick={(controlMode==="delete" || controlMode==="edit") ?(() => handleClickShiftCard(shift)) :null}
        style={{
          opacity: shift.isAdding ?0.5 :1,
          cursor: (controlMode==="delete" || controlMode==="edit") ?"pointer" :null
        }}
      />
    );
    if(shift.paidHoliday) return(
      <WorkShiftSpecialCard
        key={`cellShiftPaidHolidayCard${staffId}`}
        label="有給" color={brown["600"]}
        editMode={controlMode === "edit"} deleteMode={controlMode === "delete"}
        onClick={(controlMode==="delete" || controlMode==="edit") ?(() => handleClickShiftCard(shift)) :null}
        style={{
          opacity: shift.isAdding ?0.5 :1,
          cursor: (controlMode==="delete" || controlMode==="edit") ?"pointer" :null
        }}
      />
    )
    return (
      <WorkShiftCard
        key={`cellShiftCard${shift?.id ?? i}${staffId}`}
        label={shift?.label} color={shift?.color}
        start={shift?.start} end={shift?.end}
        memo={shift?.memo}
        editMode={controlMode === "edit"} deleteMode={controlMode === "delete"}
        onClick={(controlMode==="delete" || controlMode==="edit") ?(() => handleClickShiftCard(shift)) :null}
        style={{
          opacity: shift.isAdding ?0.5 :1,
          cursor: (controlMode==="delete" || controlMode==="edit") ?"pointer" :null
        }}
      />
    )
  });

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

  const controlModeClassName = controlMode==="add" || controlMode==="addTemplate" ?"add" :"";
  return(
    <>
    <div
      ref={ref}
      className={`cell day${day} holiday${holiday} ${controlModeClassName}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={(controlMode==="add" || controlMode==="addTemplate") ?handleClickCell :null}
    >
      <div className='shiftCards'>{shiftCards}</div>
    </div>
    </>
  )
}

const LicenseRow = (props) => {
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const com = useSelector(state => state.com);
  const staffs = useGetStaffs();
  const dateList = useSelector(state => state.dateList);
  const {license, workShift, detailedOpen, setDetailedOpen, rowStyle} = props;
  const detailedOpenRef = useRef(null);

  const cells = dateList.map(dateDt => {
    const year = dateDt.date.getFullYear();
    const month = dateDt.date.getMonth();
    const date = dateDt.date.getDate();
    const did = `D${String(year)}${String(month+1).padStart(2, '0')}${String(date).padStart(2, '0')}`;
    const cnt = (workShift?.[did] ?? []).filter(prevShift => {
      // サービスでフィルター
      if(service && prevShift.service && prevShift.service !== service) return false;
      // 単位でフィルター
      if(classroom && prevShift.classroom && prevShift.classroom !== classroom) return false;
      // 欠勤でフィルター
      if(prevShift.absence) return false;
      // 公休
      if(prevShift.publicHoliday) return false;
      // 有給
      if(prevShift.paidHoliday) return false;
      return true;
    }).reduce((prevCnt, shiftDt) => {
      if(license === "児童指導員勤務時間"){
        const staff = staffs.find(staff => staff.id === shiftDt.staffId);
        if(staff && (staff.license ?? []).includes("児童指導員")){
          const [startHours, startMins] = shiftDt.start.split(":").map(Number);
          const [endHours, endMins] = shiftDt.end.split(":").map(Number);
          const mins = (endHours*60 + endMins) - (startHours*60 + startMins);
          prevCnt += (mins / 60);
        }
      }else{
        const staffId = shiftDt.staffId;
        const staff = staffs.find(s => s.id === staffId) ?? {};
        if((staff.license ?? []).includes(license)) prevCnt++;
      }
      return prevCnt
    }, 0);
    return(
      <div
        key={`licenseCell${license}${date}`}
        className={`cell day${dateDt.date.getDay()} holiday${dateDt.holiday ?? "0"}`}
      >
        {cnt}
      </div>
    )
  })

  return(
    <div className='row' style={{...rowStyle}}>
      <div className='rowHeader'>
        {license}
        {license==="児童指導員勤務時間"
          &&<>
            <IconButton
              onClick={() => setDetailedOpen(prevDetaiedOpen => !prevDetaiedOpen)}
              style={{padding: 0, position: 'absolute', right: 8}}
              className='detailedOpenIcon'
              ref={detailedOpenRef}
            >
              {detailedOpen ?<RemoveIcon /> :<AddIcon />}
            </IconButton>
            <ToolTip text={detailedOpen ?"詳細非表示" :"詳細表示"} placement="bottom" elementRef={detailedOpenRef} />
          </>
        }
      </div>
      {cells}
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

const StaffShiftMiniMap = (props) => {
  const dateList = useSelector(state => state.dateList);
  const {staff, workShift} = props;

  const cells = dateList.map(dateDt => {
    const year = dateDt.date.getFullYear();
    const month = dateDt.date.getMonth();
    const date = dateDt.date.getDate();
    const did = `D${String(year)}${String(month+1).padStart(2, '0')}${String(date).padStart(2, '0')}`;
    const staffShifts = (workShift?.[did] ?? []).filter(prevShift => prevShift.staffId === staff.id);
    // 欠勤
    const isAbsence = staffShifts.some(shift => shift.absence ?? false);
    // 有給
    const isPaidHoliday = staffShifts.some(shift => shift.paidHoliday ?? false);
    // 公休
    const isPublicHoliday = staffShifts.some(shift => shift.publicHoliday ?? false);
    let backgroundColor = null;
    if(staffShifts.length >= 1){
      if(isAbsence) backgroundColor = red[200];
      else if(isPaidHoliday || isPublicHoliday) backgroundColor = orange[200];
      else backgroundColor = teal[200];
    }
    return(
      <div style={{
        width: `calc(100% / ${dateList.length})`, backgroundColor, 
        height: '4px', borderRadius: 2,
      }}/>
    )
  });

  return(
    <div style={{width: '100%', display: 'flex', marginTop: '4px'}}>{cells}</div>
  )
}

const StaffRow = (props) => {
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const classroom = useSelector(state => state.classroom);
  const dateList = useSelector(state => state.dateList);
  const {staff, workShift, setMenuProps} = props;

  const cells = dateList.map(dateDt => {
    const year = dateDt.date.getFullYear();
    const month = dateDt.date.getMonth();
    const date = dateDt.date.getDate();
    const did = `D${String(year)}${String(month+1).padStart(2, '0')}${String(date).padStart(2, '0')}`;
    const staffShifts = (workShift?.[did] ?? []).filter(prevShift => prevShift.staffId === staff.id);
    return(
      <WorkShiftTableCell
        key={`workShiftTableCell${staff.id}${date}`}
        staffShifts={staffShifts} did={did} staff={staff}
        day={dateDt.date.getDay()} holiday={dateDt.holiday ?? "0"}
      />
    )
  });

  const workCnt = dateList.reduce((cnt, dateDt) => {
    const year = dateDt.date.getFullYear();
    const month = dateDt.date.getMonth();
    const date = dateDt.date.getDate();
    const did = `D${String(year)}${String(month+1).padStart(2, '0')}${String(date).padStart(2, '0')}`;
    const staffShifts = (workShift?.[did] ?? []).filter(prevShift => {
      if(prevShift.staffId !== staff.id) return false;
      if(prevShift.service && displayService && prevShift.service !== displayService) return false;
      if(prevShift.classroom && classroom && prevShift.classroom !== classroom) return false;
      return true;
    });
    if(staffShifts.length) cnt++;
    return cnt;
  }, 0);

  const workMins = dateList.reduce((mins, dateDt) => {
    const year = dateDt.date.getFullYear();
    const month = dateDt.date.getMonth();
    const date = dateDt.date.getDate();
    const did = `D${String(year)}${String(month+1).padStart(2, '0')}${String(date).padStart(2, '0')}`;
    const staffShifts = (workShift?.[did] ?? []).filter(prevShift => {
      if(prevShift.staffId !== staff.id) return false;
      if(prevShift.service && displayService && prevShift.service !== displayService) return false;
      if(prevShift.classroom && classroom && prevShift.classroom !== classroom) return false;
      return true;
    });
    staffShifts.forEach(shift => {
      const [startHours, startMins] = (shift.start ?? "00:00").split(":").map(Number);
      const [endHours, endMins] = (shift.end ?? "00:00").split(":").map(Number);
      mins += (endHours*60 + endMins) - (startHours*60 + startMins)
    })
    return mins;
  }, 0);

  return (
    <div className="row">
      <div className="rowHeader">
        {staff.name}
        <span style={{ fontSize: "12px", marginLeft: "4px" }}>
          {workCnt}日
          <span style={{ marginRight: "2px" }}>/</span>
          {workMins / 60}H
        </span>
        {/* <div className='licenses'>{(staff.license ?? []).map(l => (<div key={l+staff.id}>{l}</div>))}</div> */}
        <div className="licenses">
          {(staff.license ?? []).map((l) => (
            <LicenseItem staff={staff} license={l} />
          ))}
        </div>
        {/* {!(staff.partTime ?? false) &&<div className='workCnt'>勤務日数<span className='cnt'>{workCnt}</span>日</div>}
        {(staff.partTime ?? false) &&<div className='workCnt'>勤務時間<span className='cnt'>{Math.floor(workMins/60)}時間{workMins%60}分</span></div>} */}
        <StaffShiftMiniMap staff={staff} workShift={workShift} />
        <div
          className="menuButton"
          onClick={() => setMenuProps({ open: true, staff })}
        >
          <MoreHorizIcon className="menuIcon" />
        </div>
      </div>
      {cells}
    </div>
  );
}

const StaffMenuDialog = (props) => {
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-");
  const {workShift, setWorkShift} = useContext(WorkShiftContext);
  const {open, staff={}, handleClose} = props;
  const [ynDialogOpen, setYNDialogOpen] = useState(false);

  const handleDeleteAllShift = () => {
    setWorkShift(prevWorkShift => {
      const newWorkShift = Object.entries(prevWorkShift).reduce((prevWorkShift, [did, shiftDts]) => {
        const newShiftDts = shiftDts.filter(shiftDt => shiftDt.staffId !== staff?.id);
        prevWorkShift[did] = newShiftDts;
        return prevWorkShift;
      }, {});
      return newWorkShift;
    });
    handleClose();
  }

  const shiftCnt = Object.values(workShift).reduce((prevShiftCnt, shiftDts) => {
    shiftDts.forEach(shiftDt => {
      if(shiftDt.staffId === staff?.id) prevShiftCnt++;
    });
    return prevShiftCnt;
  }, 0);
  const yesnoDialogProps = {
    open: ynDialogOpen, setOpen: setYNDialogOpen, handleConfirm: handleDeleteAllShift,
    prms: {
      title: `スタッフの勤務を全削除`,
      message: `${staff?.name ?? "該当スタッフ"}の${shiftCnt}件の勤務を削除します。`
    }
  };
  return(
    <>
    <Dialog onClose={handleClose} open={open}>
      <DialogTitle style={{padding: '8px 24px', textAlign: 'center', borderBottom: '1px solid #ddd', color: teal[800]}}>スタッフ別設定メニュー</DialogTitle>
      <div style={{textAlign: 'center', padding: '8px 24px'}}>
        <div style={{marginBottom: '8px'}}>
          <span style={{fontSize: '14px'}}>{stdYear}年{stdMonth}月</span>
          <span style={{fontSize: '20px'}}>{staff?.name ?? ""}</span>
        </div>
        <div className='licenses' style={{fontSize: '14px', color: teal[600]}}>
          {(staff?.license ?? []).map((l, i) => (<div style={(staff?.license ?? []).length!==i+1 ?{marginBottom: '4px'} :{}}>{l}</div>))}
        </div>
      </div>
      <List style={{padding: 0}}>
        {shiftCnt>0 &&<ListItem button onClick={() => setYNDialogOpen(true)}>
          <DeleteForeverIcon style={{marginRight: '16px', color: red["A700"]}}/>
          <ListItemText primary={"スタッフの勤務全削除"} />
        </ListItem>}
      </List>
      <DialogActions>
        <div style={{textAlign: 'center', width: '100%'}}>
          <Button
            color='secondary' variant='contained'
            onClick={handleClose}
          >
            閉じる
          </Button>
        </div>
      </DialogActions>
    </Dialog>
    <YesNoDialog {...yesnoDialogProps} />
    </>
  )
}

const WorkShiftTable = () => {
  const com = useSelector(state => state.com);
  const classes = useStyles();
  const {workShift, setWorkShift} = useContext(WorkShiftContext);
  const {setRecentlyShifts} = useContext(RecentlyShiftsContext);
  const [shiftEditDialogParams, setShiftEditDialogParams] = useState({open: false, shiftDt: {}, did: null, staffDt: {}});

  const [detailedOpen, setDetailedOpen] = useSessionStorageState(true, "WorkShiftTableDetailedOpen");
  const [menuProps, setMenuProps] = useState({open: false, staff: null});
  
  const displayLicense = com?.ext?.workShift?.setting?.displayLicense ?? {};
  const licenses = LICENSE_LIST.filter(license => displayLicense[license] ?? true);
  const licenseRows = licenses.map(license => (
    <LicenseRow
      key={`licenseRow${license}`}
      license={license} workShift={workShift}
      rowStyle={{height: detailedOpen ?"33px" :"0"}}
    />
  ));
  
  const staffs = useGetStaffs();
  const staffRows = staffs.map(staff => (
    <StaffRow key={`staffRow${staff.id}`} staff={staff} workShift={workShift} setMenuProps={setMenuProps} />
  ));


  return(
    <>
    <div className={classes.WorkShiftTable}>
      <div className='header'>
        <div className='dateListRows'><DateListHeader workShift={workShift} /></div>
        <div className='licenseRows'>
          {licenseRows}
          <LicenseRow license="児童指導員勤務時間" workShift={workShift} detailedOpen={detailedOpen} setDetailedOpen={setDetailedOpen} />
        </div>
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
    <StaffMenuDialog
      {...menuProps}
      handleClose={() => setMenuProps({open: false, staff: null})}
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

const WorkShiftMake = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
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

  if(!loadingStatus.loaded || !workShift) return(
    <>
    <WorkShiftLinksTab />
    <LoadingSpinner />
    </>
  );

  const {com, stdDate, service, classroom} = allState;
  const [stdYear, stdMonth] = stdDate.split("-");

  return(
    <>
    <WorkShiftLinksTab />
    <div className={classes.AppPage}>
      <div className='printInfo'>{com.bname} {stdYear}年{stdMonth}月 {service} {classroom}</div>
      <SnackContext.Provider value={{setSnack}}>
      <ControlModeContext.Provider value={{controlMode, setControlMode}}>
      <SelectingShiftTemplateContext.Provider value={{selectingShiftTemplate, setSelectingShiftTemplate}}>
      <WorkShiftContext.Provider value={{workShift, setWorkShift}}>
      <RecentlyShiftsContext.Provider value={{recentlyShifts, setRecentlyShifts}}>
        <WorkShiftTable />
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
    <SetPrintTitle printTitle="勤務（月次）" />
    </>
  )
}
export default WorkShiftMake