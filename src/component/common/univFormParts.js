import React, { useState, useEffect } from 'react';
import { Checkbox, FormControlLabel, makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  checkBoxRoot: {}
}));

export const UnivCheckbox = (props) => {
  const { def, name, value, setValue, style, label, ...restProps } = props;
  const classes = useStyles();
  
  // 内部状態の管理 - valueが渡されない場合はdefを初期値として使用
  const [checked, setChecked] = useState(value !== undefined ? value : def || false);
  
  // 外部からvalueが変更された場合、内部状態を更新
  useEffect(() => {
    if (value !== undefined) {
      setChecked(value);
    }
  }, [value]);
  
  const handleChange = (event) => {
    const newValue = event.target.checked;
    
    // 内部状態の更新
    setChecked(newValue);
    
    // 外部状態の更新（setValueが提供されている場合）
    if (setValue) {
      setValue(newValue);
    }
  };
  
  // labelがない場合はnameを使用
  const displayLabel = label || name;
  
  return (
    <FormControlLabel
      control={
        <Checkbox
          checked={checked}
          onChange={handleChange}
          name={name}
          color="primary"
          {...restProps}
        />
      }
      label={displayLabel}
      style={{ ...style }}
      className={classes.checkBoxRoot}
    />
  );
};
