import React, { useEffect, useRef, useState } from 'react';
import { amber, blue, blueGrey, brown, cyan, deepOrange, deepPurple, green, grey, indigo, lightBlue, lightGreen, lime, orange, purple, red, teal, yellow } from '@material-ui/core/colors';
import { LinksTab } from '../common/commonParts';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { endPoint } from '../../modules/api';
import { brtoLf, lfToBr, makeUrlSearchParams } from '../../commonModule';
import { alpha, Button, ButtonGroup, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, withStyles } from '@material-ui/core';

import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import PaletteIcon from '@material-ui/icons/Palette';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots } from '@fortawesome/free-regular-svg-icons';
import { AlbHMuiTextField, AlbHTimeInput, ToolTip } from '../common/HashimotoComponents';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { DAY_LIST } from '../../hashimotoCommonModules';
import WarningIcon from '@material-ui/icons/Warning';
import { YesNoDialog } from '../common/GenericDialog';
import { sendBrunch } from '../../Actions';

// --constants

export const LICENSE_LIST = [
  "児童発達支援管理責任者", "理学療法士等", "看護師", "保育士",
  "送迎員", "児童指導員", "強度行動障害基礎", "強度行動障害実践",
];

export const WORK_SHIFT_COLORS = [
  red[700], deepOrange[700], orange[700], amber[700],
  yellow[700], lime[700], lightGreen[700], green[700],
  teal[700], cyan[700], lightBlue[700], blue[700],
  indigo[700], deepPurple[700], purple[700],
];

export const WORK_SHIFT_PUBLIC_HOLIDAY_DT = {
  publicHoliday: true, id: "publicHoliday",
  label: "公休", color: blueGrey[700]
}

export const WORK_SHIFT_PAID_HOLIDAY_DT = {
  paidHoliday: true, id: "paidHoliday",
  label: "有給", color: brown[700]
}

export const WORK_SHIFT_START_TIME = "08:00";
export const WORK_SHIFT_END_TIME = "19:00";

// constants--


// --hooks

/**
 * ワークシフトデータを取得し、更新されるたびにサーバーに送信する。
 */
export const useFetchAndSendWorkShift = () => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const [workShift, setWorkShift] = useState(null);
  useEffect(() => {
    // データを取得
    let isMounted = true;
    const params = {
      a: "fetchWorkshift",
      hid, bid, date: stdDate
    }
    axios.post(endPoint(), makeUrlSearchParams(params)).then(res => {
      if(res?.data?.result){
        const data = res.data?.dt?.[0]?.workshift ?? {};
        if(isMounted) setWorkShift(data);
      }
    }).catch(error => {
      // エラー処理
      console.log("fetchWorkshiftError", error);
    });

    return () => {
      isMounted = false
    }
  }, []);

  useEffect(() => {
    if(!workShift) return;
    const params = {
      a: "sendWorkshift",
      hid, bid, date: stdDate,
      workshift: JSON.stringify(workShift)
    }
    axios.post(endPoint(), makeUrlSearchParams(params)).then(res => {
      if(res?.data?.result){
        console.log("送信成功")
      }
    }).catch(error => {
      // エラー処理
      console.log("fetchWorkshiftError", error);
    });
  }, [workShift]);

  return [workShift, setWorkShift];
}

export const useGetStaffs = () => {
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const com = useSelector(state => state.com);
  const staffs = com?.etc?.workShift?.staffs ?? com?.ext?.workShift?.staffs ?? [];
  const filteredStaffs = staffs.filter(staff => {
    if(!(staff?.service?.[service] ?? true)) return false;
    if(!(staff?.classroom?.[classroom] ?? true)) return false;
    return true;
  });
  return filteredStaffs;
}

// hooks--


// --Components

export const WorkShiftLinksTab = () => {
  const menu = [
    { link: "/workshift/", label: "シフト作成", print: true },
    { link: "/workshift/daily/4/", label: "シフト作成（日次）", hide: true, print: true },
    { link: "/workshift/staffsetting/", label: "スタッフ設定" },
    { link: "/workshift/templatesetting/", label: "勤務パターン設定" },
    { link: "/workshift/setting/", label: "基本設定" }
  ];

  return (<LinksTab menu={menu}/>)
}

export const WorkShiftCard = withStyles({
  root: (props) => ({
    width: "80px", height: 'fit-content',
    fontSize: "10px", fontWeight: "600", textAlign: 'center', color: props.color || grey[400],
    backgroundColor: '#fff',
    border: `2px solid ${props.color || grey[400]}`, borderRadius: "4px", boxSizing: 'border-box',
    padding: "4px",
    opacity: props.opacity || 1,
    position: 'relative',
    '& .label': {marginBottom: "4px"},
    '& .time': {
      display: 'flex', justifyContent: 'center', alignItems: 'center',
    },
    '& .memoIcon': {
      fontSize: 12,
      position: 'absolute', top: 2, right: 2,
    },
    '& .mask': {
      position: 'absolute', top: 0, left: 0,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      width: '100%', height: '100%',
      opacity: 0,
      '&:hover': {
        opacity: 1,
        color: props.editMode ?teal[800] :props.deleteMode ?red[800] :null,
        backgroundColor: props.editMode ?alpha(teal[100], 0.5) :props.deleteMode ?alpha(red[100], 0.5) :null,
      }
    },
    '@media print': {
      width: "48px",
      '& .time': {
        display: 'block'
      },
    }
  })
})((props) => {
  const {label, start="??:??", end="??:??", memo="", editMode=false, deleteMode=false} = props;
  return(
    <div
      className={props.classes.root}
      onClick={props.onClick}
      style={{...props.style}}
    >
      <div className='label'>{label ?label :"パターンなし"}</div>
      <div className='time'>
        <div className='start'>{start}</div>
        <div className='nami'>~</div>
        <div className='end'>{end}</div>
      </div>
      {Boolean(memo) &&<div className='memoIcon'><FontAwesomeIcon icon={faCommentDots} /></div>}
      {editMode &&<div className='mask'><EditIcon className='icon' /></div>}
      {deleteMode &&<div className='mask'><DeleteForeverIcon className='icon' /></div>}
    </div>
  )
});

export const WorkShiftNewCard = withStyles({
  root: ({rootStyle}) => ({
    width: "80px", minWidth: '80px', height: "36px",
    fontSize: "10px", fontWeight: "600", textAlign: 'center', color: teal[600],
    backgroundColor: '#fff',
    border: `2px solid ${teal[600]}`, borderRadius: "4px", boxSizing: 'border-box',
    padding: "4px",
    opacity: 1,
    '&:hover': {
      cursor: 'pointer',
      opacity: 1
    },
    '@media print': {
      display: 'none'
    },
    ...rootStyle
  })
})((props) => {
  const {classes, onClick, rootStyle, ...restProps} = props;
  const elementRef = useRef(null);
  return(
    <div
      className={classes.root}
      onClick={onClick}
      ref={elementRef}
      {...restProps}
    >
      <AddIcon style={{color: teal[800]}} />
    </div>
  )
});

export const WorkShiftSpecialCard = withStyles({
  root: (props) => ({
    width: "80px", minWidth: '80px', minHeight: "36px",
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    fontSize: "12px", fontWeight: "600", color: '#fff',
    backgroundColor: props.color || blueGrey[700],
    border: `2px solid ${props.color || blueGrey[700]}`, borderRadius: "4px", boxSizing: 'border-box',
    padding: "4px",
    opacity: props.opacity || 1,
    position: 'relative',
    '& .mask': {
      position: 'absolute', top: 0, left: 0,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      width: '100%', height: '100%',
      opacity: 0,
      '&:hover': {
        opacity: 1,
        color: props.editMode ?teal[800] :props.deleteMode ?red[800] :null,
        backgroundColor: props.editMode ?alpha(teal[100], 0.5) :props.deleteMode ?alpha(red[100], 0.5) :null,
      }
    },
    '@media print': {
      width: "48px", minWidth: "48px"
    },
  })
})((props) => {
  const {classes, label="???", editMode=false, deleteMode=false} = props;
  return(
    <div
      className={classes.root}
      onClick={props.onClick}
      style={{...props.style}}
    >
      {label}
      {editMode &&<div className='mask'><EditIcon className='icon' /></div>}
      {deleteMode &&<div className='mask'><DeleteForeverIcon className='icon' /></div>}
    </div>
  )
});

export const WorkShiftControlModeChangeButton = withStyles({
  root: (props) => ({
    color: '#fff', backgroundColor: props.backgroundColor || grey[500],
    height: 48,
    borderRadius: 24,
    padding: '0 16px',
    '&:hover': {
      backgroundColor: props.backgroundColor || grey[500],
    }
  })
})((props) => {
  const {classes, label, thisControlMode, setControlMode, backgroundColor, ...buttonProps} = props;
  const handleClick = () => {
    setControlMode(prevControlMode => prevControlMode!==thisControlMode ?thisControlMode :null);
  }
  return(
    <Button
      variant="contained"
      onClick={handleClick}
      className={classes.root}
      {...buttonProps}
    >
      {label}
    </Button>
  )
});

export const WorkShiftNoBreaksCheckbox = withStyles({
  root: (props) => ({
    textAlign: 'center',
    marginRight: "8px", marginLeft: '-8px',
    '& .MuiFormControlLabel-label': {
      fontSize: '1rem', color: "rgba(0, 0, 0, 0.54)", fontWeight: 400,
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      lineHeight: 1,
      transform: "translate(0, 1.5px) scale(0.75)", transformOrigin: "top",
      letterSpacing: "0.00938em", 
    },
    '& .checkbox': {
      padding: 4
    }
  })
})((props) => {
  const {classes, name="noBreaks", checked, setChecked, ...checkboxProps} = props;

  const handleChange = (e) => {
    if(setChecked) setChecked(e.target.checked);
  }

  return(
    <FormControlLabel
      control={
        <Checkbox
          color="primary"
          checked={checked}
          onChange={handleChange}
          className="checkbox"
          name={name}
          {...checkboxProps}
        />
      }
      label="休憩なし" labelPlacement="top"
      className={classes.root}
    />
  )
});

export const WorkShiftBreakTimeInput = (props) => {
  const {defaultTime="60", width=80, hide=false, ...textFieldProps} = props;
  const [time, setTime] = useState(props.time ?? defaultTime);
  const [error, setError] = useState(false);

  const handleChange = (e) => {
    const value = e.target.value;
    if(!/^[\d\uFF10-\uFF19]{0,3}$/.test(value)) return;
    setTime(value);
    if(props.setTime) props.setTime(value);
  }

  const handleBlur = (e) => {
    let value = e.target.value;
    if(!value) value = "0";
    const halfWidthValue = value.replace(/[\uFF10-\uFF19]/g, function(char) {
      // 全角数字を半角数字に変換
      if (char >= '\uFF10' && char <= '\uFF19') {
        return String.fromCharCode(char.charCodeAt(0) - 0xFF10 + 0x30);
      }
    });
    const adjustedValue = String(parseInt(halfWidthValue));
    setError(!/^\d{1,3}$/.test(adjustedValue));
    setTime(adjustedValue);
    if(props.setTime) props.setTime(adjustedValue);
  }

  return(
    <AlbHMuiTextField
      label="休憩（分）"
      name="breakTime"
      value={time}
      onChange={handleChange}
      onBlur={handleBlur}
      width={width}
      error={error}
      helperText={error ?"時刻が不正" :""}
      style={{visibility: hide ?"hidden" :"visible"}}
      {...textFieldProps}
    />
  )
}

export const WorkShiftColorSelect = withStyles({
  root: {
    '& .MuiSelect-root.MuiSelect-select.MuiSelect-selectMenu.MuiInputBase-input.MuiInput-input': {
      paddingTop: 4, paddingBottom: 0
    },
    '& .menuItemIcon': {
      fontSize: 24
    }
  }
})((props) => {
  const {classes, defaultValue, colors=WORK_SHIFT_COLORS, ...selectProps} = props;

  const menuItems = colors.map(color => (
    <MenuItem key={`colorPallet${color}`} value={color}>
      <PaletteIcon className='menuItemIcon' style={{color}} />
    </MenuItem>
  ));

  return(
    <FormControl className={classes.root}>
      <InputLabel>色</InputLabel>
      <Select
        name="color"
        defaultValue={defaultValue ?? colors[0]}
        {...selectProps}
      >
        {menuItems}
      </Select>
    </FormControl>
  )
});

export const WorkShiftEditDialog = withStyles({
  root: {
    '& .title': {
      color: teal[800], textAlign: 'center',
      marginBottom: 8
    },
    '& .info': {
      display: 'flex', justifyContent: 'center'
    },
    '& .licenses': {
      fontSize: 16, textAlign: 'center'
    },
    '& .labelAndColor': {
      '& > *': {
        '&:not(:last-child)': {
          marginRight: 8
        }
      },
    },
    '& .times': {
      display: 'flex',
      '& > *': {
        '&:not(:last-child)': {
          marginRight: 8
        }
      },
    },
    '& form': {
      '& > div': {
        '&:not(:last-child)': {
          marginBottom: 16
        }
      }
    },
    '& .button': {
      width: 104
    },
    '& .absenceButton': {
      backgroundColor: red[600], color: '#fff',
      '&:hover': {backgroundColor: red[800]}
    },
    '& .noAbsenceButton': {
      backgroundColor: teal[800], color: '#fff',
      '&:hover': {backgroundColor: teal[900]}
    }
  }
})((props) => {
  const RECENTLY_SHIFTS_TIMES = 3;

  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const formRef = useRef(null);
  
  const {
    classes,
    dialogParams, setDialogParams,
    setWorkShift, setRecentlyShifts
  } = props;
  const {open, shiftDt, did, staffDt, userShifts} = dialogParams;

  const [noBreaks, setNoBreaks] = useState(shiftDt.noBreaks ?? false);
  const [timeError, setTimeError] = useState({start: false, end: false});

  const handleClose = () => {
    setDialogParams(prevDialogParams => ({...prevDialogParams, open: false}));
  }

  const handleAbsence = () => {
    if(!formRef.current) return;
    const inputs = formRef.current.getElementsByTagName("input");
    const textareas = formRef.current.getElementsByTagName("textarea");
    const newShiftDt = {
      ...shiftDt,
      id: shiftDt.id || crypto.randomUUID(),
      service, classroom,
      absence: !(shiftDt.absence || false)
    };
    for(const input of inputs){
      const name = input.name;
      if(!name) continue;
      const value = input.type === "checkbox" ?input.checked :input.value;
      newShiftDt[name] = value;
    }
    for(const textarea of textareas){
      const name = textarea.name;
      if(!name) continue;
      const value = textarea.value;
      newShiftDt[name] = lfToBr(value);
    }
    const isOverlappingStart = (userShifts ?? []).some(prevShift => {
      if(prevShift.isAdding) return false;
      if(prevShift.id === newShiftDt.id) return false;
      return prevShift.start <= newShiftDt.start && newShiftDt.start < prevShift.end;
    });
    const isOverlappingEnd = (userShifts ?? []).some(prevShift => {
      if(prevShift.isAdding) return false;
      if(prevShift.id === newShiftDt.id) return false;
      return prevShift.start < newShiftDt.end && newShiftDt.end <= prevShift.end;
    });
    if(isOverlappingStart || isOverlappingEnd){
      setTimeError({start: isOverlappingStart, end: isOverlappingEnd});
      return;
    }
    setTimeError({start: false, end: false});
    setWorkShift(prevWorkShift => {
      const newWorkShift = JSON.parse(JSON.stringify(prevWorkShift));
      if(!checkValueType(newWorkShift[did], 'Array')) newWorkShift[did] = [];
      const newShiftDts = newWorkShift[did];
      const targetIndex = newShiftDts.findIndex(s => s.id === shiftDt.id);
      if(targetIndex+1){
        // 削除処理
        newShiftDts.splice(targetIndex, 1);
      }
      newShiftDts.push({...newShiftDt, staffId: staffDt.id});
      return newWorkShift;
    });
    handleClose();
  }

  const handleSave = () => {
    if(!formRef.current) return;
    const inputs = formRef.current.getElementsByTagName("input");
    const textareas = formRef.current.getElementsByTagName("textarea");
    const newShiftDt = {
      ...shiftDt,
      id: shiftDt.id || crypto.randomUUID(),
      service, classroom
    };
    for(const input of inputs){
      const name = input.name;
      if(!name) continue;
      const value = input.type === "checkbox" ?input.checked :input.value;
      newShiftDt[name] = value;
    }
    for(const textarea of textareas){
      const name = textarea.name;
      if(!name) continue;
      const value = textarea.value;
      newShiftDt[name] = lfToBr(value);
    }
    const isOverlappingStart = (userShifts ?? []).some(prevShift => {
      if(prevShift.isAdding) return false;
      if(prevShift.id === newShiftDt.id) return false;
      return prevShift.start <= newShiftDt.start && newShiftDt.start < prevShift.end;
    });
    const isOverlappingEnd = (userShifts ?? []).some(prevShift => {
      if(prevShift.isAdding) return false;
      if(prevShift.id === newShiftDt.id) return false;
      return prevShift.start < newShiftDt.end && newShiftDt.end <= prevShift.end;
    });
    if(isOverlappingStart || isOverlappingEnd){
      setTimeError({start: isOverlappingStart, end: isOverlappingEnd});
      return;
    }
    setTimeError({start: false, end: false});
    setWorkShift(prevWorkShift => {
      const newWorkShift = JSON.parse(JSON.stringify(prevWorkShift));
      if(!checkValueType(newWorkShift[did], 'Array')) newWorkShift[did] = [];
      const newShiftDts = newWorkShift[did];
      const targetIndex = newShiftDts.findIndex(s => s.id === shiftDt.id);
      if(targetIndex+1){
        // 削除処理
        newShiftDts.splice(targetIndex, 1);
      }
      newShiftDts.push({...newShiftDt, staffId: staffDt.id});
      return newWorkShift;
    });
    setRecentlyShifts(prevRecentlyShifts => {
      if(shiftDt.absence) return prevRecentlyShifts;
      const newRecentlyShifts = JSON.parse(JSON.stringify(prevRecentlyShifts));
      const targetIndex = newRecentlyShifts.findIndex(shiftDt => shiftDt.id === newShiftDt.templateId);
      if(targetIndex + 1){
        // 既存のシフトデータがあるときは削除
        newRecentlyShifts.splice(targetIndex, 1);
      }
      if(!newShiftDt.templateId) newShiftDt.templateId = crypto.randomUUID();
      newRecentlyShifts.unshift(newShiftDt);
      return newRecentlyShifts.slice(0, RECENTLY_SHIFTS_TIMES);
    });
    handleClose();
  }

  const didYear = did ?parseInt(did.slice(1, 5)) :null;
  const didMonth = did ?parseInt(did.slice(5, 7)) - 1 :null;
  const didDate = did ?parseInt(did.slice(7, 9)) :null;
  const dateObj = did ?new Date(didYear, didMonth, didDate) :null;
  const month = did ?String(dateObj.getMonth()+1).padStart(2, '0') :null;
  const date = did ?String(dateObj.getDate()).padStart(2, '0') :null;
  const day = did ?dateObj.getDay() :null;

  const isSpecial = shiftDt.publicHoliday || shiftDt.paidHoliday;
  return(
    <Dialog className={classes.root} onClose={handleClose} open={open}>
      <DialogTitle>
        <div className='title'>シフト編集</div>
        <div className='info'>
          <div className='date'>{month}/{date}({DAY_LIST[day]})</div>
          <div className='staffName'>{staffDt.name ?? ""}</div>
        </div>
        {/* <div className='licenses'>
          {(staffDt.license ?? []).map(license => <div key={shiftDt.id + license}>{license}</div>)}
        </div> */}
      </DialogTitle>
      <DialogContent dividers>
        <form ref={formRef}>
          {!isSpecial &&<div className='labelAndColor'>
            <AlbHMuiTextField label="勤務パターン" name="label" defaultValue={shiftDt.label ?? ""} />
            <WorkShiftColorSelect defaultValue={shiftDt.color ?? grey[600]} colors={[grey[600], ...WORK_SHIFT_COLORS]} />
          </div>}
          {!isSpecial &&<div className='times'>
            <AlbHTimeInput label="始業時間" name="start" defaultTime={shiftDt.start ?? "10:00"} error={timeError.start} />
            <AlbHTimeInput label="就業時間" name="end" defaultTime={shiftDt.end ?? "19:00"} error={timeError.end} />
            <WorkShiftNoBreaksCheckbox checked={noBreaks} setChecked={setNoBreaks} />
            <WorkShiftBreakTimeInput defaultTime={shiftDt.breakTime ?? "60"} hide={noBreaks} />
          </div>}
          <div className='memo' style={{marginTop: !isSpecial ?24 :0}}>
            <AlbHMuiTextField
              label="メモ" name="memo"
              variant="outlined"
              defaultValue={brtoLf(shiftDt?.memo ?? "")}
              multiline
              rows={3} rowsMax={6}
              minRows={3} maxRows={6}
              width="100%"
              style={{minWidth: 320}}
            />
          </div>
        </form>
      </DialogContent>
      <DialogActions style={{flexDirection: 'column', alignItems: 'flex-end'}}>
        {(timeError.start || timeError.end) &&(
          <div
            style={{
              lineHeight: '1.5rem', color: red[600], fontSize: '0.9rem',
              marginBottom: '4px'
            }}
          >
            既存の予定と重なっています。
          </div>
        )}
        <div>
          {!isSpecial &&<Button
            variant='contained'
            onClick={handleAbsence}
            className={`${shiftDt.absence ?'noAbsenceButton' :'absenceButton'} button`}
          >
            {shiftDt.absence ?"出勤にする" :"欠勤にする"}
          </Button>}
          <Button
            variant='contained' color='secondary'
            onClick={handleClose}
            className='button'
            style={{marginLeft: '12px'}}
          >
            キャンセル
          </Button>
          <Button
            variant='contained' color='primary'
            onClick={handleSave}
            className='button'
            style={{marginLeft: '12px'}}
          >
            保存
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  )
});


export const WorkShiftMakeChangeButtons = withStyles({
  root: (props) => ({
    '& .button': {
      minWidth: '64px', lineHeight: '1rem',
      padding: '3px 16px',
    },
    '@media print': {
      display: 'none'
    }
  })
})((props) => {
  const history = useHistory();
  const location = useLocation();
  const {date} = useParams();
  const pathname = (() => {
    let result = location.pathname;
    if(result.at(-1) !== "/") result += "/";
    if(result.includes("daily")) result = "/workshift/daily/";
    return result;
  })();
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-");
  const {classes} = props;

  const handleClickMonthly = () => {
    sessionStorage.setItem(`workShiftDailyDate${stdYear}${stdMonth}`, String(date));
    history.push("/workshift/");
  }

  const handleClickDaily = () => {
    let date = sessionStorage.getItem(`workShiftDailyDate${stdYear}${stdMonth}`);
    if(!date){
      const now = new Date();
      const nowYear = String(now.getFullYear());
      const nowMonth = String(now.getMonth()+1).padStart(2, '0');
      if(nowYear === stdYear && nowMonth === stdMonth) date = now.getDate();
      else date = 1;
    }
    history.push(`/workshift/daily/${date}/`);
  }

  return(
    <ButtonGroup
      className={classes.root}
    >
      <Button
        color='primary'
        variant={pathname === "/workshift/" ?"contained" :"outlined"}
        onClick={handleClickMonthly}
        className='button'
        style={{
          backgroundColor: pathname === "/workshift/" ?teal[800] :null,
          color: pathname === "/workshift/" ?'#fff' :null
        }}
        disabled={pathname === "/workshift/"}
      >
        月次
      </Button>
      <Button
        color='primary'
        variant={pathname === "/workshift/daily/" ?"contained" :"outlined"}
        onClick={handleClickDaily}
        className='button'
        style={{
          backgroundColor: pathname === "/workshift/daily/" ?teal[800] :null,
          color: pathname ===  "/workshift/daily/" ?'#fff' :null
        }}
        disabled={pathname === "/workshift/daily/"}
      >
        日次
      </Button>
    </ButtonGroup>
  )
});


export const WorkShiftWarning = withStyles({
  root: ({rootStyle}) => ({
    '@media print': {
      display: 'none'
    },
    ...rootStyle
  })
})((props) => {
  const {classes, workShift, did, holiday} = props;
  const dispatch = useDispatch();
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const com = useSelector(state => state.com);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const [open, setOpen] = useState(false);
  const [warning, setWarning] = useState({
    // 総勤務時間がサービス提供時間の２倍に満たない場合
    workingHours: false,
    // 常勤の総勤務時間がサービス提供時間に満たない場合
    fullTime: false,
    // 加配加算がdAddicitionの加算と一致しない場合
    addiction: false
  });
  const warnignChecked = com?.etc?.workShift?.warnignChecked?.[did] ?? false;
  useEffect(() => {
    if(warnignChecked) return;
    const setting = com?.ext?.workShift?.setting ?? {};
    const serviceMins = (() => {
      const serviceHours = setting.serviceHours?.[displayService] ?? {};
      let start = null
      let end = null;
      if(displayService!=="児童発達支援" && holiday==1){
        start = serviceHours.holidayStart ?? WORK_SHIFT_START_TIME;
        end = serviceHours.holidayEnd ?? WORK_SHIFT_END_TIME;
      }else{
        start = serviceHours.start ?? WORK_SHIFT_START_TIME;
        end = serviceHours.end ?? WORK_SHIFT_END_TIME;
      }
      const [startHours, startMin] = start.split(":").map(Number);
      const [endHours, endMin] = end.split(":").map(Number);
      return ((endHours*60 + endMin) - (startHours*60 + startMin));
    })();
    const shifts = workShift?.[did] ?? [];
    const workingMins = shifts.reduce((prevMins, shift) => {
      const [startHours, startMin] = (shift.start ?? "00:00").split(":").map(Number);
      const [endHours, endMin] = (shift.end ?? "00:00").split(":").map(Number);
      prevMins += ((endHours*60 + endMin) - (startHours*60 + startMin));
      return prevMins;
    }, 0);

    const staffs = com?.etc?.workShift?.staffs ?? [];
    const fullTimeWorkingMins = shifts.filter(shift => {
      const staff = staffs.find(prevStaff => prevStaff.id === shift.staffId) ?? {};
      if(staff.partTime) return false;
      return true;
    }).reduce((prevMins, shift) => {
      const [startHours, startMin] = (shift.start ?? "00:00").split(":").map(Number);
      const [endHours, endMin] = (shift.end ?? "00:00").split(":").map(Number);
      prevMins += ((endHours*60 + endMin) - (startHours*60 + startMin));
      return prevMins;
    }, 0);

    const comAddiction = com?.addiction?.[displayService]?.["児童指導員等加配加算"];
    const addictionTargetMins = shifts.filter(shift => {
      const staff = staffs.find(prevStaff => prevStaff.id === shift.staffId) ?? {};
      if(staff["児童指導員等加配加算"] !== comAddiction) return false;
      return true;
    }).reduce((prevMins, shift) => {
      const [startHours, startMin] = (shift.start ?? "00:00").split(":").map(Number);
      const [endHours, endMin] = (shift.end ?? "00:00").split(":").map(Number);
      prevMins += ((endHours*60 + endMin) - (startHours*60 + startMin));
      return prevMins;
    }, 0);

    setWarning({
      workingHours: serviceMins*2 > workingMins,
      fullTime: serviceMins > fullTimeWorkingMins,
      addiction: addictionTargetMins!==0 && serviceMins > addictionTargetMins
    });
  }, [com, service, serviceItems, workShift, did, holiday]);

  if(holiday==2 || warnignChecked || Object.values(warning).every(x => x === false)) return null;

  const day = new Date(parseInt(did.slice(1, 5)), parseInt(did.slice(5, 7)), parseInt(did.slice(7, 9))).getDay();
  const handleConfirm = () => {
    const newComEtc = JSON.parse(JSON.stringify(checkValueType(com?.etc, 'Object') ?com.etc :{}));
    if(!newComEtc.workShift) newComEtc.workShift = {};
    if(!newComEtc.workShift.warnignChecked) newComEtc.workShift.warnignChecked = {};
    newComEtc.workShift.warnignChecked[did] = true;
    const params = {
      ...com, hid, bid, date: stdDate,
      addiction: com.addiction,
      etc: newComEtc,
    };
    dispatch(sendBrunch(params));
  }
  return(
    <>
    <div className={classes.root}>
      <IconButton
        onClick={() => setOpen(true)}
        style={{padding: '4px'}}
      >
        <WarningIcon style={{color: yellow[800], fontSize: '24px'}} />
      </IconButton>
    </div>
    <YesNoDialog
      open={open} setOpen={setOpen} handleConfirm={handleConfirm}
      prms={{
        title: `確認（${did.slice(5, 7)}月${did.slice(-2)}日${DAY_LIST[day]}曜日）`,
        confirmText: "問題なし", cancelText: "閉じる",
        message: (
          "シフト組みにいくつか問題がある可能性があります。\n"
          + "\n"
          + (warning.workingHours ?"・サービス提供時間に対して総勤務時間が少ない可能性があります。\n" :"")
          + (warning.fullTime ?"・常勤勤務時間がサービス提供時間を満たしていません。\n" :"")
          + (warning.addiction ?"・加算設定の児童指導員等加配加算とスタッフの児童指導員等加配加算が一致していません。\n" :"")
          + "\n"
          + "問題がない場合は「問題なし」を押してください。\n"
          + "今回の確認は表示されなくなります。"
        )
      }}
    />
    </>
  )
});

// Components--