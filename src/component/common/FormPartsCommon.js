// フォームパーツの共用部分
// sizeは表示の大きさなどを指定する
// 今のところ、large、middleのみ。追加でsmall など。

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { connect, useDispatch, useSelector } from 'react-redux';
import * as mui from '../common/materialUi';
import * as comMod from '../../commonModule';
import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Checkbox from '@material-ui/core/Checkbox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import Favorite from '@material-ui/icons/Favorite';
import FavoriteBorder from '@material-ui/icons/FavoriteBorder';
import { common } from '@material-ui/core/colors';
import { Tune } from '@material-ui/icons';
import { red, grey } from '@material-ui/core/colors';
// import classes from '*.module.css';


export const useStyles = makeStyles((theme) => ({
  buttonStrong: {
    backgroundColor: red[800],
    color: grey[50],
    '&:hover': {backgroundColor: red[700]}
  },
  usersDialog: {
    ' & .MuiDialog-paperWidthSm': {
      maxWidth: 800,
    },
    ' & .MuiDialogContent-root' :{
      margin: 0,
      padding: 0,
      overflowX: 'hidden', // この設定がないと横スクロールバーが出ちゃう
    },
    '& .MuiDialogTitle-root' : {
      padding: 0,
    },
  },
  fcLarge: {
    width: 260,
    margin: theme.spacing(1),
    '& .MuiSelect-root': {
      width: '100%',
    },
    '& .MuiTextField-root': {
      width: '100%',
    },
  },
  // text field large数値入力
  tfLargeNum:{
    width: 260,
    margin: theme.spacing(1),
    '& .MuiTextField-root': {
      width: '10ch',
    },
    // この指定が機能していない
    '& .MuiInputBase-input':{
      textAlign:'left',
    }
  },
  fcMiddle: {
    width: 120,
    // margin: theme.spacing(1),
    '& .MuiSelect-root': {
      width: '100%',
    },
    '& .MuiTextField-root': {
      width: '100%',
    },
  },
  fcMiddleL: {
    width: 160,
    // margin: theme.spacing(1),
    '& .MuiSelect-root': {
      width: '100%',
    },
    '& .MuiTextField-root': {
      width: '100%',
    },
  },
  // チェックボックス用
  fcMiddleCK: {
    minWidth: 120,
    margin: theme.spacing(1),
    '& .MuiSelect-root': {
      width: '100%',
    },
    '& .MuiTextField-root': {
      width: '100%',
    },
  },
  // text field Middle数値入力
  tfMiddleNum: {
    width: 120,
    // margin: theme.spacing(1),
    '& .MuiTextField-root': {
      width: '100%',
    },
    // この指定が機能していない
    '& .MuiInputBase-input': {
      textAlign: 'left',
    }
  },
  tfSmallNum: {
    width: 80,
    // margin: theme.spacing(1),
    '& .MuiTextField-root': {
      width: '100%',
    },
    // この指定が機能していない
    '& .MuiInputBase-input': {
      textAlign: 'left',
    },
  },
  tfSmallTime: {
    width: 60,
    // margin: theme.spacing(1),
    '& .MuiTextField-root': {
      width: '100%',
    },
  },

  // text field Middle普通の入力
  tfMiddle: {
    width: 120,
    // margin: theme.spacing(1),
    '& .MuiTextField-root': {
      width: '100%',
    },
  },
  tfMiddleS: {
    width: 110,
    // margin: theme.spacing(1),
    '& .MuiTextField-root': {
      width: '100%',
    },
  },
  tfSmall: {
    width: 100,
    // margin: theme.spacing(1),
    '& .MuiTextField-root': {
      width: '100%',
    },
  },

  tfMiddleL: {
    width: 160,
    // margin: theme.spacing(1),
    '& .MuiTextField-root': {
      width: '100%',
    },
  },
  tfMiddleXL: {
    width: 200,
    // margin: theme.spacing(1),
    '& .MuiTextField-root': {
      width: '100%',
    },
    '& .MuiAutocomplete-root': {
      width: '100%',
    },

  },
  tfMiddleXXL: {
    width: 300,
    // margin: theme.spacing(1),
    '& .MuiTextField-root': {
      width: '100%',
    },
  },
  tfMiddle4XL: {
    width: 400,
    // margin: theme.spacing(1),
    '& .MuiTextField-root': {
      width: '100%',
    },
  },
  noticeDialog: { // この指定は意味をなしてない Typographyをdiv出力したい
    '& .MuiTypography-root': {
      paragraph: false,
      component:'div',
    },
  },
  checkedIcon: {
    '& .MuiSvgIcon-root': {
      width: '2rem',
      height: '2rem',
      opacity: .6,
    },
  },
}));

// props.sizeに応じて短縮語を返す
export const sw = (wd, size)=>{
  if (size !== 'large')
    return(comMod.shortWord(wd));
  else
    return(wd);
}

// サイズの選択肢 これを使ってusStyleで使う値を決める
// チェックボックスのlabelPlacementもこれを流用
export const selectStyle = (size, list) =>{
  const sizeList = ['large', 'middle', 'small', 'middleL'];
  return (list[sizeList.indexOf(size)]);
}


// 共用できるチェックボックス
// disabledがfalseと評価できる値のときはdisabled表示になる
export const ChkBoxGp = (props) => {
  const classes = useStyles();
  const size = props.size;
  const classList = ['fcLarge', 'fcMiddleCK'];
  const placementList = ['end', 'top'];
  const sizeList = ['medium', 'small'];
  const cls = selectStyle(props.size, classList);
  const placement = selectStyle(props.size, placementList);
  const chkSize = selectStyle(props.size, sizeList);
  return (
    <FormControlLabel className={classes[cls]} disabled={props.disabled}
      // labelPlacement={placement}
      control={
        <Checkbox
          checked={props.checked}
          onChange={e => props.onChange(e)}
          name={props.nameJp}
          size={chkSize}
        />
      }
      label={sw(props.nameJp, size)}
    />
  )
}
// 共有できるセレクトボックス
// disabledがfalseと評価できる値のときはdisabled表示になる
// dispHideをprops指定すると非表示の選択項目が表示される
// 2021-06-08 props.noLabelを追加。ラベル表示を抑制
// 2022/12/17　styleを追加　FormControlに適用 props.sizeを省略可能に
// 2022/12/20 disabled追加
export const SelectGp = (props) => {
  const classes = useStyles();
  const size = props.size? props.size: 'large';
  const name = (props.nameJp !== undefined)? props.nameJp : props.name;
  const label = (props.label !== undefined)? props.label : name;
  const noLabel = props.noLabel;
  const style = props.style? props.style: {};
  // 空白の選択肢に付与するラベル
  const nullLabel = (props.nullLabel) ? props.nullLabel : '未選択';
  // 空白表示を行うか
  const hidenull = (props.hidenull) ? props.hidenull : false;
  // ラベルをセレクトから分離して表示
  const labelOutside = props.labelOutside;

  const onBlur = (typeof props.onBlur === "function") ? props.onBlur : ()=>null;
  // sizeに応じたクラス名を求める
  const classList = ['fcLarge', 'fcMiddle', '', 'fcMiddleL'];
  const cls = (props.styleUse !== undefined)?
    props.styleUse : selectStyle(props.size, classList);

  
  const opts = Array.isArray(props.opts) ? props.opts.map((e, i) => {
    if (typeof e === 'string') {
      return (
        <option value={e} key={i}>{sw(e, size)}</option>
      );
    } else {
      const optClass = (e.class !== undefined) ? e.class : '';
      return (
        // <option value={e.value} className={optClass} key={i}>
        <option value={e.value} key={i}>
          {sw(e.label, size)}
        </option>
      );
    }
  }) : [];
  // undefined や nullを空白に返還
  const labelOutsideStyle = {
    width: 392, display: 'inline-block', paddingTop: 8, marginInlineEnd: 8,
  }
  
  return (<>
    {labelOutside &&
      <span style={labelOutsideStyle}>{label}</span>
    }
    <FormControl 
      className={classes[cls]} disabled={props.disabled}
      error={props.err} style={style}
    >
      {noLabel !== true &&
        <InputLabel shrink >
          {sw(label, size)}
        </InputLabel>
      }
      <Select
        name={name}
        native
        value={props.value || ''}
        // セレクトはエラーを受け取らないで良いでしょ->受け取る！
        error={props.err}
        helpertext={props.errMsg}
        onChange={e => props.onChange(e)}
        onBlur={e => onBlur(e)}
        disabled={props.disabled}
      >
        {/* // nullの選択肢を表示するかどうか */}
        {!hidenull && <option value="">{nullLabel}</option>}
        {opts}
        {(props.dispHide !== undefined) && 
          <option value="-1">非表示</option>
        }
      </Select>
      <FormHelperText>{props.errMsg}</FormHelperText>
    </FormControl>
  </>)
}
export const TextGP = (props) => {
  const classes = useStyles();
  const controleMode = useSelector(state=>state.controleMode);
  const selectInputAuto = comMod.getUisCookie(comMod.uisCookiePos.selectInputAuto);
  let {
    name, label, value, cls, onChange, onBlur, onFocus,
    err, errMsg, disabled, required, shrink, style
  } = props;
  const handeleFocus = (e) => {
    if (selectInputAuto){
      const node = e.currentTarget;
      node.select();
    }
    if ((typeof onFocus) === 'function'){
      onFocus(e);
    }
  }
  
  return (
    <div className={classes[cls]}>
      <TextField
        name={name}
        required={required}
        label={label}
        value={value ?? ''}
        onChange={(e) => onChange(e)}
        onFocus={(e)=>handeleFocus(e)}
        onBlur={e => onBlur(e)}
        error={err}
        placeholder={props.placeholder}
        helperText={errMsg}
        disabled={disabled}
        InputLabelProps={{shrink: shrink,}}
        style={style ?? {}}
        inputRef={props.inputRef}
      />
    </div>
  )
}
