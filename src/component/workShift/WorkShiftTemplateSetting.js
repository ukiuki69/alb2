import { Button, ButtonGroup, Checkbox, FormControl, IconButton, InputLabel, makeStyles, MenuItem, Select } from '@material-ui/core';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { WORK_SHIFT_COLORS, WorkShiftLinksTab } from './WorkShiftCommon';
import SnackMsg from '../common/SnackMsg';
import { useDispatch, useSelector } from 'react-redux';
import { getLodingStatus } from '../../commonModule';
import { AlbHMuiTextField } from '../common/HashimotoComponents';
import { teal } from '@material-ui/core/colors';

import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import { LoadingSpinner } from '../common/commonParts';

import PaletteIcon from '@material-ui/icons/Palette';
import { setSnackMsg, setStore } from '../../Actions';
import { univApiCall } from '../../albCommonModule';
import { checkValueType } from '../dailyReport/DailyReportCommon';

const SIDEBAR_WIDTH = 61.25;
const NAME_WIDTH = 160;
const TIME_WIDTH = 80;
const SHIFT_TEMPLATE = {
  label: "勤務パターン", color: WORK_SHIFT_COLORS[0],
  start: "10:00", end: "19:00", breakTime: "60",
  id: String(new Date().getTime()) + String(parseInt(Math.random()*100000))
};
const TIME_PATTERN = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

const makeShiftTemplate = (index=0, service, classroom) => {
  const newShiftTemplate = JSON.parse(JSON.stringify(SHIFT_TEMPLATE));
  // ラベル
  newShiftTemplate.label = index > 0 ?`勤務パターン${index}` :"勤務パターン";
  // 色
  const initColorIndex = index < WORK_SHIFT_COLORS.length ?index :index - WORK_SHIFT_COLORS.length;
  newShiftTemplate.color = WORK_SHIFT_COLORS[initColorIndex];
  // ID
  newShiftTemplate.id = String(new Date().getTime()) + String(parseInt(Math.random()*100000));
  newShiftTemplate.service = service;
  newShiftTemplate.classroom = classroom;
  return newShiftTemplate;
}

const SnackContext = createContext({});

const useStyles = makeStyles({
  AppPage: {
    minWidth: 1080,
    paddingLeft: SIDEBAR_WIDTH,
    margin: `${82+32}px 16px 0 0`,
  },
  MainForm: {
    width: 'fit-content', margin: '0 auto',
  },
  FormRow: {
    display: 'flex', marginBottom: 32,
    '& > div': {
      '&:not(:last-child)': {
        marginRight: 16
      }
    }
  },
  ColorSelect: {
    '& .MuiSelect-root.MuiSelect-select.MuiSelect-selectMenu.MuiInputBase-input.MuiInput-input': {
      paddingTop: 4, paddingBottom: 0
    }
  },
  BreakCheckbox: {
    textAlign: 'center',
    '& .label': {
      fontSize: '1rem', color: "rgba(0, 0, 0, 0.54)", fontWeight: 400,
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      transform: "translate(0, 1.5px) scale(0.75)", transformOrigin: "top",
      letterSpacing: "0.00938em", 
    }
  }
});

const FormRowMoveButton = (props) => {
  const {filteredShiftTemplates, index, shiftTemplate, setShiftTemplates} = props;

  const handleClick = (e) => {
    const action = e.currentTarget.name;
    setShiftTemplates(prevShiftTemplates => {
      const newShiftTemplates = JSON.parse(JSON.stringify(prevShiftTemplates));
      const targetIndex = newShiftTemplates.findIndex(prevShiftTemplate => prevShiftTemplate.id === shiftTemplate.id);
      const splicedShiftTemplate = newShiftTemplates.splice(targetIndex, 1);
      let moveIndex = targetIndex;
      if(action === "up"){
        moveIndex--;
      }else if(action === "down"){
        moveIndex++;
      }
      return [...newShiftTemplates.slice(0, moveIndex), ...splicedShiftTemplate,  ...newShiftTemplates.slice(moveIndex)];
    });
  }

  const iconStyle = {fontSize: 16};
  return(
    <div style={{paddingTop: 8, marginRight: 16}}>
      <ButtonGroup orientation="vertical">
        <Button
          variant="outlined" size="small" onClick={handleClick}
          name="up" disabled={index===0}
        >
          <ArrowUpwardIcon style={{...iconStyle}} />
        </Button>
        <Button
          variant="outlined" size="small" onClick={handleClick}
          name="down" disabled={index+1===filteredShiftTemplates.length}
        >
          <ArrowDownwardIcon style={{...iconStyle}} />
        </Button>
      </ButtonGroup>
    </div>
  )
}

const TemplateLabelTextField = (props) => {
  const {shiftTemplate, setShiftTemplates} = props;
  const [text, setText] = useState(shiftTemplate.label ?? "");

  useEffect(() => {
    setText(shiftTemplate.label);
  }, [shiftTemplate]);

  const handleChange = (e) => {
    const value = e.target.value;
    setText(value);
  }

  const handleBlur = (e) => {
    const key = e.currentTarget.name;
    setShiftTemplates(prevShiftTemplates => {
      const newShiftTemplates = JSON.parse(JSON.stringify(prevShiftTemplates));
      const targetIndex = newShiftTemplates.findIndex(prevShiftTemplate => prevShiftTemplate.id === shiftTemplate.id);
      const newShiftTemplate = newShiftTemplates[targetIndex];
      newShiftTemplate[key] = e.target.value;
      return newShiftTemplates;
    });
  }

  return(
    <AlbHMuiTextField
      label="勤務パターン"
      value={text}
      onChange={handleChange} onBlur={handleBlur}
      width={NAME_WIDTH}
      name="label"
      required
    />
  )
}

const WorkShiftTimeTextField = (props) => {
  const {shiftTemplate, setShiftTemplates, timeKey, label, hide=false} = props;
  const [text, setText] = useState(shiftTemplate[timeKey] ?? "");
  const [error, setError] = useState(false);

  useEffect(() => {
    setText(shiftTemplate[timeKey]);
    setError(shiftTemplate[timeKey] && !TIME_PATTERN.test(shiftTemplate[timeKey]));
  }, [shiftTemplate]);

  const handleChange = (e) => {
    const value = e.target.value;
    if(!/^[\d\uFF10-\uFF19]*([:：][\d\uFF10-\uFF19]*)?$/.test(value)) return;
    if(!/^[\d\uFF10-\uFF19]{0,4}$/.test(value.replace(/[:：]/g, ""))) return;
    setText(value);
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
    setError(!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(adjustedValue));
    setText(adjustedValue);
    setShiftTemplates(prevShiftTemplates => {
      const newShiftTemplates = JSON.parse(JSON.stringify(prevShiftTemplates));
      const targetIndex = newShiftTemplates.findIndex(prevShiftTemplate => prevShiftTemplate.id === shiftTemplate.id);
      const newShiftTemplate = newShiftTemplates[targetIndex];
      newShiftTemplate[timeKey] = adjustedValue;
      return newShiftTemplates;
    });
  }

  return(
    <AlbHMuiTextField
      label={label}
      value={text}
      onChange={handleChange}
      onBlur={handleBlur}
      width={TIME_WIDTH}
      error={error}
      helperText={error ?"時刻が不正" :""}
      style={{visibility: hide ?"hidden" :"visible"}}
    />
  )
}

const BreakTimeInput = (props) => {
  const {index, shiftTemplate, setShiftTemplates, width=80, hide=false, ...textFieldProps} = props;
  const [time, setTime] = useState(shiftTemplate.breakTime ?? "60");
  const [error, setError] = useState(false);

  useEffect(() => {
    setTime(shiftTemplate.breakTime);
    setError(shiftTemplate.breakTime && !/^\d{1,3}$/.test(shiftTemplate.breakTime));
  }, [shiftTemplate]);

  const handleChange = (e) => {
    const value = e.target.value;
    if(!/^[\d\uFF10-\uFF19]{0,3}$/.test(value)) return;
    setTime(value);
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
    setShiftTemplates(prevShiftTemplates => {
      const newShiftTemplates = JSON.parse(JSON.stringify(prevShiftTemplates));
      const targetIndex = newShiftTemplates.findIndex(prevShiftTemplate => prevShiftTemplate.id === shiftTemplate.id);
      const newShiftTemplate = newShiftTemplates[targetIndex];
      newShiftTemplate.breakTime = adjustedValue;
      return newShiftTemplates;
    });
  }

  return(
    <AlbHMuiTextField
      label="休憩（分）"
      value={time}
      onChange={handleChange}
      onBlur={handleBlur}
      width={width}
      error={error}
      helperText={error ?"値が不正" :""}
      style={{visibility: hide ?"hidden" :"visible"}}
      {...textFieldProps}
    />
  )
}


const BreakCheckbox = (props) => {
  const classes = useStyles();
  const {shiftTemplate, setShiftTemplates} = props;
  const [checked, setChecked] = useState(shiftTemplate.noBreaks ?? false);

  useEffect(() => {
    setChecked(shiftTemplate.noBreaks ?? false);
  }, [shiftTemplate]);

  const handleChange = (e) => {
    setChecked(e.target.checked);
    setShiftTemplates(prevShiftTemplates => {
      const newShiftTemplates = JSON.parse(JSON.stringify(prevShiftTemplates));
      const targetIndex = newShiftTemplates.findIndex(prevShiftTemplate => prevShiftTemplate.id === shiftTemplate.id);
      const newShiftTemplate = newShiftTemplates[targetIndex];
      newShiftTemplate.noBreaks = e.target.checked;
      return newShiftTemplates;
    });
  }

  return(
    <div className={classes.BreakCheckbox} style={{marginRight: "8px", marginLeft: '-8px'}}>
      <div className='label'>休憩なし</div>
      <Checkbox
        color="primary"
        checked={checked}
        onChange={handleChange}
        style={{padding: 4}}
      />
    </div>
  )
}

const ColorSelect = (props) => {
  const classes = useStyles();
  const {shiftTemplate, index, setShiftTemplates} = props;
  const initColorIndex = index < WORK_SHIFT_COLORS.length ?index :index - WORK_SHIFT_COLORS.length;
  const [value, setValue] = useState(shiftTemplate.color ?? WORK_SHIFT_COLORS[initColorIndex]);

  useEffect(() => {
    setValue(shiftTemplate.color ?? WORK_SHIFT_COLORS[initColorIndex]);
  }, [shiftTemplate]);

  const handleChange = (e) => {
    const color = e.target.value;
    setValue(color);
    setShiftTemplates(prevShiftTemplates => {
      const newShiftTemplates = JSON.parse(JSON.stringify(prevShiftTemplates));
      const targetIndex = newShiftTemplates.findIndex(prevShiftTemplate => prevShiftTemplate.id === shiftTemplate.id);
      const newShiftTemplate = newShiftTemplates[targetIndex];
      newShiftTemplate.color = color;
      return newShiftTemplates;
    });
  }

  const menuItems = WORK_SHIFT_COLORS.map((color) => (
    <MenuItem key={`colorPalette${color}${shiftTemplate.id}`} value={color}>
      <PaletteIcon style={{color, fontSize: 24}} />
    </MenuItem>
  ));

  return(
    <FormControl className={classes.ColorSelect}>
      <InputLabel>色</InputLabel>
      <Select
        value={value}
        onChange={handleChange}
      >
        {menuItems}
      </Select>
    </FormControl>
  )
}

const FormRowDeleteButton = (props) => {
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const {shiftTemplate, setShiftTemplates} = props;

  const handleDelete = () => {
    setShiftTemplates((prevShiftTemplates) => {
      const newShiftTemplates = JSON.parse(JSON.stringify(prevShiftTemplates));
      const targetIndex = newShiftTemplates.findIndex(prevShiftTemplate => prevShiftTemplate.id === shiftTemplate.id);
      newShiftTemplates.splice(targetIndex, 1);
      if(newShiftTemplates.length === 0){
        newShiftTemplates.push(makeShiftTemplate(0, service, classroom));
      }
      return newShiftTemplates;
    });
  }

  return(
    <div style={{paddingTop: 11}}>
      <Button
        variant='contained'
        onClick={handleDelete}
      >
        削除
      </Button>
    </div>
  )
}

const AddFormRowButton = (props) => {
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const {setShiftTemplates} = props;

  const handleClick = () => {
    // スタッフデータに新データを追加
    setShiftTemplates((prevShiftTemplate) => {
      const newTemplateIndex = prevShiftTemplate.length;
      const newShiftTemplate = makeShiftTemplate(newTemplateIndex, service, classroom);
      return [...prevShiftTemplate, newShiftTemplate];
    });
  }

  return(
    <div style={{textAlign: 'center'}}>
      <IconButton
        onClick={handleClick}
      >
        <AddCircleOutlineIcon
          style={{color: teal[800]}}
          fontSize="large"
        />
      </IconButton>
    </div>
  )
}

const Buttons = (props) => {
  const dispatch = useDispatch();
  const com = useSelector(state => state.com);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const {setSnack} = useContext(SnackContext);
  const {shiftTemplates, setShiftTemplates} = props;

  const handleSubmit = async() => {
    const nonError = !shiftTemplates.every(shiftTemplate => {
      if(!TIME_PATTERN.test(shiftTemplate.satrt)) return false;
      if(!TIME_PATTERN.test(shiftTemplate.end)) return false;
      if(!TIME_PATTERN.test(shiftTemplate.breakStart)) return false;
      if(!TIME_PATTERN.test(shiftTemplate.breakEnd)) return false;
      return true;
    });
    if(!nonError){
      // 時間入力エラーがある場合
      setSnack({msg: "時刻が不正です。", severity: 'warning', id: new Date().getTime()});
      return;
    }
    const sendDt = JSON.parse(JSON.stringify(shiftTemplates));
    const comExt = JSON.parse(JSON.stringify(checkValueType(com?.ext, "Object") ?com.ext :{}));
    if(!checkValueType(comExt.workShift, "Object")) comExt.workShift = {};
    const comWorkShift = comExt.workShift;
    comWorkShift.shiftTemplates = sendDt;
    const params = {
      a: "sendComExt", hid, bid,
      ext: JSON.stringify(comExt)
    }
    const res = await univApiCall(params);
    if(res?.data?.result){
      dispatch(setStore({com: {...com, ext: comExt}}));
      dispatch(setSnackMsg("保存しました。"));
    }else{
      setSnack({msg: "保存に失敗しました。", severity: 'warning'})
    }
  }

  const handleCancel = () => {
    setShiftTemplates(com?.ext?.workShift?.shiftTemplates ?? [makeShiftTemplate(0, service, classroom)]);
  }

  const buttonStyle = {width: 104}
  return(
    <div className='buttons' style={{textAlign: 'end'}}>
      <Button
        color='secondary'
        variant='contained'
        onClick={handleCancel}
        style={{...buttonStyle, marginRight: 12}}
      >
        キャンセル
      </Button>
      <Button
        color='primary'
        variant='contained'
        onClick={handleSubmit}
        style={{...buttonStyle}}
      >
        保存
      </Button>
    </div>
  )
}

const MainForm = () => {
  const com = useSelector(state => state.com);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const classes = useStyles();
  const [shiftTemplates, setShiftTemplates] = useState(com?.ext?.workShift?.shiftTemplates ?? [makeShiftTemplate(0, service, classroom)]);

  const filteredShiftTemplates = shiftTemplates.filter(shiftTemplate => {
    if(service && shiftTemplate.service && shiftTemplate.service !== service) return false;
    if(classroom && shiftTemplate.classroom && shiftTemplate.classroom !== classroom) return false;
    return true;
  });
  const formRows = filteredShiftTemplates.map((shiftTemplate, i) => {
    const formRowCommonPorps = {index: i, shiftTemplate, shiftTemplates, setShiftTemplates};
    return(
      <div className={`${classes.FormRow} formRow`} key={`FormRow${i}`}>
        <FormRowMoveButton filteredShiftTemplates={filteredShiftTemplates} {...formRowCommonPorps} />
        <TemplateLabelTextField {...formRowCommonPorps}/>
        <WorkShiftTimeTextField timeKey="start" label="始業時間" {...formRowCommonPorps} />
        <WorkShiftTimeTextField timeKey="end" label="就業時間" {...formRowCommonPorps} />
        <BreakCheckbox {...formRowCommonPorps} />
        <BreakTimeInput hide={shiftTemplate.noBreaks ?? false} {...formRowCommonPorps} />
        <ColorSelect {...formRowCommonPorps} />
        <FormRowDeleteButton {...formRowCommonPorps} />
      </div>
    )
  });

  const commonProps = {shiftTemplates, setShiftTemplates};
  return(
    <div className={classes.MainForm}>
      <form>
        <div className='formRows'>{formRows}</div>
        <AddFormRowButton {...commonProps} />
        <Buttons {...commonProps} />
      </form>
    </div>
  )
}

const WorkShiftTemplateSetting = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const classes = useStyles();
  const [snack, setSnack] = useState({});

  if(!loadingStatus.loaded) return(
    <>
    <WorkShiftLinksTab />
    <LoadingSpinner />
    </>
  )

  return(
    <>
    <WorkShiftLinksTab />
    <div className={classes.AppPage}>
      <SnackContext.Provider value={{setSnack}}>
        <MainForm />
      </SnackContext.Provider>
    </div>
    <SnackMsg {...snack} />
    </>
  )
}
export default WorkShiftTemplateSetting