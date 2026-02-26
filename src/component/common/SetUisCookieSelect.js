import { FormControl, FormHelperText, InputLabel, Select, makeStyles } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { getUisCookie, setUisCookie, shortWord } from '../../commonModule';

const useStyles = makeStyles({
  root: {
    width: '80%', margin: '16px auto', padding: 8, textAlign: 'justify',
    '@media print': {display: 'none'}, 
  },
  formControl: {
    margin: 8, minWidth: 120,

  },
  selectEmpty: {
    marginTop: 16,
  },
});

export const SetUisCookieSelect = (props) => {
  const classes = useStyles();
  // uisのポジションとラベル  
  const {
    p, label, style = {}, err, errMsg = '値が不正です', 
    disabled, opt, setState
  } = props; 
  const [value, setValue] = useState(getUisCookie(p));
  const opts = opt.map((e, i) => {
    if (typeof e === 'string'){
      return (
        <option value={e} key={i}>{shortWord(e)}</option>
      )
    }
    else{
      // const optClass = (e.class !== undefined) ? e.class: '';
      return(
        // <option value={e.value} className={optClass} key={i}>
        <option value={e.value} key={i}>
          {shortWord(e.label)}
        </option>
      )
    }
  });
  const handleChange = (ev) => {
    setValue(ev.target.value);
    setUisCookie(p, ev.target.value);
    if (typeof setState === 'function'){
      setState(ev.target.value)
    }
  }
  // undefined や nullを空白に返還
  return (
    <div className={classes.root}  style={style}>
      <FormControl
        className={classes.formControl}
        error={err} disabled={disabled}
      >
        <InputLabel shrink >{shortWord(label)}</InputLabel>
        <Select
          name={'SetUisCookieSelect'}
          native
          value={value}
          error={err}
          helpertext={errMsg}
          onChange={(ev)=>handleChange(ev)}
          disabled={disabled}
        >
          {opts}
        </Select>
        {/* <FormHelperText>{errMsg}</FormHelperText> */}
      </FormControl>

    </div>
  )
}