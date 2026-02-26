import React, { useState } from 'react';
import { TextField, makeStyles } from '@material-ui/core';
import { getUisCookie, uisCookiePos } from '../../commonModule';

const useStyles = makeStyles({
  textField: {}
});

export const YTextField = (props) => {
  const classes = useStyles();
  const {
    id, label, placeholder, name, value, setValue, defaultValue,
    InputLabelProps, InputProps, inputProps,
    error, helperText, disabled,
    color, variant, style, width=null, size,
    multiline, maxRows, minRows, rows, rowsMax,
    onChange, onBlur, onFocus,
    autoCompleteParams, required,
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
    required,
  };

  return(
    <TextField
      {...params}
      style={{width, ...style}}
      className={`${classes.textField} ${props.className || ''}`}
    />
  )
}

export const YTimeInput = (props) => {
  const {
    label, defaultTime="00:00", hide=false, width=80, maxTime, minTime,
    error: errorProp, helperText: helperTextProp,
    ...etcProps
  } = props;
  const [time, setTime] = useState(defaultTime);
  const [internalError, setInternalError] = useState(false);

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
      if (char >= '\uFF10' && char <= '\uFF19') {
        return String.fromCharCode(char.charCodeAt(0) - 0xFF10 + 0x30);
      }
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
    setInternalError(!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(adjustedValue));
    setTime(adjustedValue);
    if(props.setTime) props.setTime(adjustedValue);
    if((maxTime && adjustedValue > maxTime) || (minTime && adjustedValue < minTime)) setInternalError(true);
  }

  const finalError = (errorProp !== undefined) ? errorProp : internalError;
  const finalHelperText = (helperTextProp !== undefined) ? helperTextProp : (internalError ? "時刻が不正" : "");

  return(
    <YTextField
      label={label}
      value={props.time ?? time}
      onChange={handleChange}
      onBlur={handleBlur}
      width={width}
      error={finalError}
      helperText={finalHelperText}
      style={{...props.style, visibility: hide ?"hidden" :"visible"}}
      {...etcProps}
    />
  )
}


