import React, { useEffect, useState , useRef} from 'react';
import * as Actions from '../../Actions';
import { connect, useDispatch, useSelector } from 'react-redux';
import { Snackbar } from '@material-ui/core';
import { makeStyles, createStyles, Theme} from '@material-ui/core/styles';
import { Alert } from '@material-ui/lab';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import SwapVertIcon from '@material-ui/icons/SwapVert';
import ExposureIcon from '@material-ui/icons/Exposure';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ClearIcon from '@material-ui/icons/Clear';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import FavoriteIcon from '@material-ui/icons/Favorite';
import NavigationIcon from '@material-ui/icons/Navigation';
import SaveIcon from '@material-ui/icons/Save';
import CheckIcon from '@material-ui/icons/Check';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';
import FormLabel from '@material-ui/core/FormLabel';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import Select from '@material-ui/core/Select';

import FormGroup from '@material-ui/core/FormGroup';
import Checkbox from '@material-ui/core/Checkbox';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import SaveAltIcon from '@material-ui/icons/SaveAlt';

import * as comMod from '../../commonModule';
import * as albCM from '../../albCommonModule';
import * as thunks from '../../modules/thunks';

import { createTheme } from '@material-ui/core/styles';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import teal from '@material-ui/core/colors/teal';
import blue from '@material-ui/core/colors/blue';
import red from '@material-ui/core/colors/red';
import lime from '@material-ui/core/colors/lime';
import { useHistory, useLocation, useParams } from 'react-router';
import { faSleigh } from '@fortawesome/free-solid-svg-icons';
import { faXing } from '@fortawesome/free-brands-svg-icons';
import { grey } from '@material-ui/core/colors';
import { RepeatRounded } from '@material-ui/icons';
import { getSchInitName } from '../schedule/schUtility/getSchInitName';
import { useTobeInit } from '../schedule/schUtility/useTobeInit';
import { getLS, removeLocalStorageItem, setLS } from '../../modules/localStrageOprations';
import { SERVICE_CHENGED_BY_BUTTON } from '../schedule/Sch2';
import { KeyListener } from './KeyListener';
import SchLokedDisplay from './SchLockedDisplay';
import { ServiceItems } from './StdFormParts';
import { Menu } from '@material-ui/core';


const theme = createTheme({
  palette: {
    primary: {
      light: '#009688',
      main: '#00695c',
      dark: '#004d40',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff7961',
      main: '#f44336',
      dark: '#ba000d',
      contrastText: '#000',
    },
  },
});

// import classes from '*.module.css';

// マテリアルUIを使ったcomponentはreactのclassではなく
// 単純関数で作成するのが正解らしい（今の所の知見
// これらのcomponentはここでまとめて
// import {xxx,xxx} from 'materialUi'
// ってして使う

const useStyle = makeStyles((theme) =>({
  snackErr: {
    backgroundColor: '#433',
    color: 'rgb(250, 179, 174)'
  },
  snackWarning: {
    backgroundColor: '#443',
    color: 'rgb(255, 213, 153)'
  },
  snackInfo: {
    backgroundColor: '#334',
    color: 'rgb(166, 213, 250)'
  },
  snackSuccess: {
    backgroundColor: '#343',
    color: 'rgb(183, 223, 185)'
  },
  fab1:{
    backgroundColor:'#333',
  },
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: 200,
  },
  buttonOk: {
    paddingRight: 55,
    paddingLeft: 55,
  },
  buttonCancel: {
    background: 'linear-gradient(45deg, #433 30%, #333 90%)',
    color: 'rgb(255 225 222)',
    border: 0,
    borderRadius: 3,
    boxShadow: '0 3px 5px 2px rgba(100, 100, 100, .3)',
    height: 30,
    padding: '0 30px',
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  formControlChkBox:{
    margin: theme.spacing(0),
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  fabAdd :{
    backgroundColor: 'rgb(29, 102, 28)', 
    color: '#fff'
  },
  fabEditOff: {
    transition:'.6s',
    backgroundColor: 'rgb(212, 56, 85)',
    opacity:.6,
    color: '#fff'
  },
  fabEditOn: {
    transition: '.6s',
    backgroundColor: 'rgb(212, 56, 85)',
    opacity: 1,
    color: '#fff'
  },
  extendedIcon: {
    marginRight: 8,
  },

  intervalSaveBtn: {
    padding: '4px 6px',
    borderRadius: '2px',
    minWidth: 'auto',
    '& .MuiButton-label': {
      fontSize: '8px',
      padding: '2px 3px 0px 4px'
    }
  },

  saveButtonRoot: {
    '& > *': {
      margin: '0 4px 0 4px',
    },
    '& .MuiButton-label ': {
      fontSize: '80%',
    }
  },
  headButtonRoot: {
    '& > *': {
      margin: '1px 4px 0 4px',
    },
    '& .MuiButton-label ': {
      fontSize: '80%',
    }
  },
  ButtonNotSaved: {
    '& > *': {
      margin: '0 4px 0 4px',
    },
    '& .MuiButton-label ': {
      fontSize: '80%',
    },
    '& .MuiButton-contained ':{
      backgroundColor:lime[900],
    },
    '& .MuiButton-contained:hover ': {
      backgroundColor: lime[800],
    }

  },
  monthNavBtn : {minWidth: 32,color: '#eee',},
  monthNavBtnHidden : {minWidth: 32,color: '#eee',opacity: .2},
  formCntSelectClass : {
    margin: 0,
    width: 160, 
    marginTop: 1.5,
    '& .MuiInputBase-root':{
      fontSize: '.7rem',
      color: '#333',
      backgroundColor: '#e0e0e0',
      paddingLeft: 6,
      // borderRadius: 4,
    },
    '& .MuiInputBase-input': {
      padding: '9.5px 0'
    }
  },
  textSelectClass:{
    fontSize: '.7rem',
    paddingTop: 13,
  },
  backDrop: {
    position: 'fixed', top: 0, left: 0, zIndex: 999, 
    width: '100vw', height: '100vh',
    background: '#ffffff44', 
    background: '#000000ff', 
  },
  fabAnimationStart: {opacity:0, transition: 'all 600ms 600ms ease'},
  fabAnimationEnd: {opacity:1},
  initializing: {
    position: 'fixed', bottom: 24, right: 24, background: blue[800],
    padding: '16px 32px', borderRadius: 2, 
    boxShadow: '0 8px 32px #888', color: '#fff',
  }

}));

export const RadioStd = (props)=>{
  // const classes = useStyle();
  console.log('RadioStd', props);
  const RadioItems = ()=>{
    const rtn = props.items.map((e,i)=>{
      return(
        <FormControlLabel
          key={i}
          value={e.value}
          control={<Radio color="primary" />}
          label={e.label}
          labelPlacement={props.labelPlacement}
        />
      )
    });
    return (rtn);
  }
  return(
    <RadioGroup
      value={props.value}
      name={props.name}
      onChange={(e) => props.onChange(e)}
      row aria-label="position"
    >
      <RadioItems/>
    </RadioGroup>
  )
}


export const SelectTime = (props)=>{
  // 開始時間、終了時間の選択肢を表示する
  const OptionOfTimes = (props) => {
    const timelst = comMod.timePickerList(
      props.listStart, props.listEnd, props.step
    );
    const options = timelst.map((e, i) => {
      return (
        <option key={i} value={e.str}>{e.str}</option>
      )
    });
    return options;
  }
  const classes = useStyle();
  return(
    <>
      <FormControl className={classes.formControl}>
      <InputLabel >{props.label}</InputLabel>
        <Select
          // labelId="etui87-label"
          // id="etui87"
          native
          value={props.time}
          name={props.name}
          onChange={(e)=>props.onChange(e)}
        >
          <OptionOfTimes {...props}/>
        </Select>
      </FormControl>
    </>
  )
}

export const SelectStd = (props)=>{
  const classes = useStyle();
  const Options = (props) => {
    const options = props.options.map((e, i) => {
      return (
        <option key={i} value={e.value}>{e.label}</option>
      )
    });
    return options;
  }
  return (
    <>
      <FormControl className={classes.formControl}>
        <InputLabel >{props.label}</InputLabel>
        <Select
          native
          value={props.value}
          name={props.name}
          onChange={(e) => props.onChange(e)}
        >
          <Options {...props} />
        </Select>
      </FormControl>
    </>
  )

}

export const SnapberAlert = ()=>{
  const snackBar = useSelector(state=>state.snackBar);
  const classes = useStyle();
  const dispatch = useDispatch();
  const closeThis = ()=>{
    dispatch(Actions.closeSnackbar())
  };
  // seventyによる色の書き換えがわからないためIF文で切り替える
  const SnackInside = () => {
    if (snackBar.severity === 'error') {
      return (
        <Alert severity="error" className={classes.snackErr}>
          {snackBar.text}
        </Alert>
      )
    }
    else if (snackBar.severity === 'warning') {
      return (
        <Alert severity="warning" className={classes.snackWarning}>
          {snackBar.text}
        </Alert>
      )
    }
    else if (snackBar.severity === 'info') {
      return (
        <Alert severity="info" className={classes.snackInfo}>
          {snackBar.text}
        </Alert>
      )
    }
    else {
      return (
        <Alert severity="success" className={classes.snackSuccess}>
          {snackBar.text}
        </Alert>
      )

    }
  }
  return (
    <div className={classes.root}>
      <Snackbar
        open={snackBar.open}
        autoHideDuration={6000} onClose={closeThis}
        key={snackBar.key}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <SnackInside/>
      </Snackbar>
    </div>
  )
}

// フローティングアクションボタン
// まずは追加と修正
// イベントはpropsからもらってくるようにする
export const FabAddEdit = (props)=>{
  const classes = useStyle();
  const { 
    clickHandler, editOn, swapOn, hideSwap, hideAdd, setUserSortOpen, ...other
  } = props;
  const allState = useSelector(state=>state);
  const {com} = allState;
  const selectedOrder = com?.ext?.selectedOrder;
  const scheduleLocked = allState.schedule.locked;
  const [anchorEl, setAnchorEl] = useState(null);
  const history = useHistory();
  const [keyInfo, setKeyInfo] = useState({
    key: '', shift: false, ctrl: false, meta: false,
  });


  const editBtnStyle = (editOn)?
    { backgroundColor: '#00695c', color: '#fff'}:
    { backgroundColor: '#888', color: '#fff' };
  const addBtnStyle = { backgroundColor: '#c62828', color: '#fff' };
  const swapBtnStyle = (swapOn)?
    { backgroundColor: '#827717', color: '#fff' , padding:'24px 16px'} :
    { backgroundColor: '#888', color: '#fff', padding: '24px 16px'};
  
  useEffect(()=>{
    let isMounted = true;
    // if (keyInfo.shift) return false;
    // if (keyInfo.ctrl) return false;
    // if (keyInfo.meta) return false;

    const chk = (
      !keyInfo.shift && !keyInfo.ctrl && !keyInfo.meta && isMounted
    )

    if ((keyInfo.key).toLowerCase() === 'w' && chk){
      clickHandler('', 'add');
    }
    if ((keyInfo.key).toLowerCase() === 'e' && chk){
      clickHandler('', 'edit');
    }
    if ((keyInfo.key).toLowerCase() === 'q' && chk){
      clickHandler('', 'quit');
    }
    return (()=>{
      isMounted = false;
    })
    
  }, [keyInfo])

    const handleFabClick = (e) => {
    if (!selectedOrder?.order) {
      setAnchorEl(e.currentTarget);
    } else {
      handleSortOrderClick(e);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSortOrderClick = () => {
    history.push('/setting/sortorder');
  };

  if (scheduleLocked){
    return (
      <SchLokedDisplay/>
    )
  }

  return (
    <div className="floatingActionButtons">
      {!hideAdd &&
        <Fab 
          onClick={e => clickHandler(e)}
          style={addBtnStyle}
          variant="extended" 
          aria-label="add" name="add"
        >
          <AddIcon className={classes.extendedIcon} />
          追加 W
        </Fab>
      }
      {!hideSwap && <>
        <Menu
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
        >
          <MenuItem name="swap" onClick={(e) => { setUserSortOpen(true); handleMenuClose(); }}>
            手動で設定する
          </MenuItem>
          <MenuItem onClick={handleSortOrderClick}>
            常に一定の並び順を設定する
          </MenuItem>
        </Menu>

        <Fab 
          onClick={handleFabClick}
          variant="extended" style={swapBtnStyle}
          name="swap"
        >
          <SwapVertIcon className={classes.extendedIcon} />
          並び替え
        </Fab>
        </>}
      <Fab 
        onClick={e => clickHandler(e)}
        style={editBtnStyle} 
        variant="extended" 
        aria-label="edit" name="edit"
      >
      <EditIcon className={classes.extendedIcon} />
        修正 E
      </Fab>
      <KeyListener setKeyInfo={setKeyInfo} />
    </div>
  )
}

export const AddictionConfirming = () => {
  const classes = useStyle();
  return(
    <div className={classes.initializing}>加算設定の確認中</div>
  )
}

// Schedule用fab
// 追加削除と追加修正モードを提供する
// buttonmode = 0 両方オフ、1=追加削除、2=追加修正
// 自分でuseSelectorして自分でdispatchする方向で
// イベントはそれだけ。あとは利用するモジュールがステイトを読み取って判断
// 20210622 localのstateにも対応 propsでlocal stateが与えられたらそっちを優先
export const FabSchedule = (props)=>{
  const {localFabSch, setLocalFabSch} = props;
  const localCnt = localFabSch !== undefined; // これがtrueならlocal mode
  const classes = useStyle();
  const dispatch = useDispatch();
  const storeDef = useSelector(state=>state.controleMode.fabSchedule);
  const allState = useSelector(state=>state);
  const scheduleLocked = allState.schedule.locked;
  const {hid, bid} = allState;
  const def = (localCnt)? localFabSch: storeDef;
  const [thisMode, setthisMode] = useState((!def)? 0: def);
  const addRemove = (thisMode === 1) ? true : false;
  const addEdit = (thisMode === 2) ? true : false;
  const addRemoveStyle = (addRemove) ?
    { backgroundColor: '#C62828', color: '#fff' } :
    { backgroundColor: '#888', color: '#fff' };
  const addEditStyle = (addEdit) ?
    { backgroundColor: '#00695c', color: '#fff' } :
    { backgroundColor: '#888', color: '#fff' };
  
  const keyInfoInit = {key: '', shift: false, ctrl: false, meta: false,}
  const [keyInfo, setKeyInfo] = useState(keyInfoInit);
  
  // 表示条件の追加。SchInitilizerに定義されているカスタムフックを利用する
  const schInitName = getSchInitName(hid, bid);
  const tobeInit = useTobeInit(schInitName);

  // 値を設定したらディスパッチする
  const clickHandler = (v) =>{
    v = (v === thisMode) ? 0: v;
    setthisMode(v);
    const p = { fabSchedule: v };
    setLocalFabSch(v);
  }
  const [aniClass, setAniClass] = useState(classes.fabAnimationStart);
  const [schInitilizing, setSchInitilizing] = useState(true);

  useEffect(()=>{
    let isMounted = true;
    const chk = (
      !keyInfo.shift && !keyInfo.ctrl && !keyInfo.meta && isMounted
    )
    if ((keyInfo.key).toLowerCase() === 'w' && chk){
      clickHandler(1);
      setKeyInfo(keyInfoInit);
    }
    if ((keyInfo.key).toLowerCase() === 'e' && chk){
      clickHandler(2);
      setKeyInfo(keyInfoInit);
    }
    return (()=>{
      isMounted = false;
    })
    
  }, [keyInfo])

  useEffect(()=>{
    let isMounted = true;
    const f = async () => {
      setTimeout(()=>{
        setAniClass(classes.fabAnimationEnd);
        setSchInitilizing(false);
      }, 2000)
    }
    if (isMounted){
      f();
    }
    return (()=>{
      isMounted = false;
    })
  }, [])

  if (scheduleLocked){
    return (
      <SchLokedDisplay/>
    )
  }
  return (
    <>
    {schInitilizing === true && tobeInit &&
      <>
      <AddictionConfirming />
      <div style={{display: 'none'}} id='floatingActionButtonsExist'></div>
      </>
    }
    <div className={"floatingActionButtons " + aniClass}>
      <Fab variant="extended" style={addRemoveStyle}
        onClick={()=>clickHandler(1)}
      >
        <ExposureIcon className={classes.extendedIcon} />
        追加・削除 W
      </Fab>
      <Fab variant="extended" style={addEditStyle}
        onClick={() => clickHandler(2)}
      >
        <EditIcon className={classes.extendedIcon} />
        追加・修正 E
      </Fab>
      <div style={{display: 'none'}} id='floatingActionButtonsExist'></div>
    </div>
    <KeyListener setKeyInfo={setKeyInfo}/>
    </>
  );
}

// --------------------------使ってない。削除予定。
// Scheduleで追加削除モードと修正モードを切り替える用
// イベントはフックを使う
// export const RadioScheduleEdit = ()=>{
//   const dispatch = useDispatch();
//   const dispatchThis = (v) =>{
//     dispatch(Actions.schChangeMode(v));
//   }
//   const handleChange = (e) =>{
//     seteditmode(e.currentTarget.value);
//     dispatchThis(e.currentTarget.value);
//   }
//   let def = useSelector(state => state.controleMode.schEditMode);
//   // let def = props.controleMode.schEditMode;
//   def = (def === undefined) ? "0" : def;
//   const [editmode, seteditmode] = React.useState(def);
//   const buttonSaveStyle = {
//     padding:'19px 8px',
//     borderRadius: '50%',
//   }
//   return (
//     <div className="floatingRadioButtons">
//       <FormControl component="fieldset">
//         {/* <FormLabel component="legend">labelPlacement</FormLabel> */}
//         <RadioGroup 
//           onChange={handleChange}
//           row aria-label="position" 
//           name="sheduleMode" 
//           value={editmode}
//           style={{
//             backgroundColor:'#333', 
//             color:'#eee',
//             padding:'6px',
//             borderRadius:'2px',
//             boxShadow:'0 2px 2px',
//             fontSize:'.5rem',
//           }}
//         >
//           <FormControlLabel
//             value="0"
//             control={<Radio style={{padding:'4px'}} color="primary" />}
//             label="追加・削除"
//             labelPlacement="bottom"
//           />
//           <FormControlLabel
//             value="1"
//             control={<Radio style={{padding:'4px'}} color="primary" />}
//             label="修正"
//             labelPlacement="bottom"
//           />
//         </RadioGroup>
//       </FormControl>
//       <div className='buttonWrapper floating'>
//         <ButtonSave color='primary' style={buttonSaveStyle}/>
//       </div>
//     </div>
//   );
// }

export const TimePickers = (props) =>{
  const classes = useStyle();
  return (
    <form className={classes.container} nodisabledate>
      <TextField
        id="time"
        label="Alarm clock"
        type="time"
        defaultValue={props.default}
        className={classes.textField}
        InputLabelProps={{
          shrink: true,
        }}
        inputProps={{
          // step: 300, // 5 min
          step: '15min',
        }}
      />
    </form>
  );
}

// チェックボックス
// props内の配列より作成する
// 想定している配列
// checkBoxFromArray = [
//   {neme:'actualCost', label:'おやつ', amount:100, detail:'hogehoge'}
// ]
// detailは後から追加するつもり。チップヘルプ的に使う
export const checkBoxFromArray = (props)=>{
  const chkbox = props.lst.map((e, i) => {
    const classes = useStyle();
    return (
      <FormControlLabel key={i} className={classes.formControlChkBox}
        control={
          <Checkbox 
            style={{ width: '20px', height: '20px' }}
            icon={<CheckBoxOutlineBlankIcon style={{ fontSize: '20px' }} />}
            checkedIcon={<CheckBoxIcon style={{ fontSize: '20px' }} />}

            onChange={(e) => props.onChange(e)}
            name={props.item}
            value={e[0]}
            amount={e[1]}
            checked={e[0] in props.already}
            color={props.color}
          />
        }
        label={e[0]}
      />
    )
  });
  return (chkbox);
}
// 上記のcheckBoxFromArrayと同じ機能
// [
//   {name: actualCost,checked:true,value:'おやつ',amount:100},
//   ...
// ]
// amountは数字以外のものが入ることもあり
// イベントは持たないようにする。formイベントで一括管理
export const checkBoxGroupe = (props) =>{
  // propsはオブジェクトになっているので配列に治す。
  // mapメソッドが必要なため
  const chkBoxArray = [];
  Object.keys(props.array).forEach(e=>{
    chkBoxArray.push(props.array[e]);
  });
  const chkbox = chkBoxArray.map((e, i)=> {
    const classes = useStyle();
    return (
      <FormControlLabel key={i} className={classes.formControlChkBox}
        control={
          <Checkbox
            style={{ width: '20px', height: '20px' }}
            icon={<CheckBoxOutlineBlankIcon style={{ fontSize: '20px' }} />}
            checkedIcon={<CheckBoxIcon style={{ fontSize: '20px' }} />}

            onChange={(e) => props.onChange(e)}
            name={e.name}
            value={e.value}
            amount={e.amount}
            checked={e.checked}
            color={props.color}
          />
        }
        label={e.value}
      />
    )
  });
  return (chkbox);

}

// 汎用ボタン
export const ButtonGP = (props)=>{
  const cn = (props.addictionclass === undefined) ? '' : props.addictionclass;
  const st = (props.addictionStyle === undefined) ? {} : props.addictionStyle;  
  const key = new Date().getTime();

  return (
    <Button
      key={key}
      variant="contained"
      className={cn}
      style={{st}}
      name={props.name}
      color={(props.color===undefined)?'default':props.color}
      disabled={props.disabled}
      onClick={props.onClick}
      id={props.id}
    >
      {props.label}
    </Button>
  );

}

/* okボタン */
export const ButtonOK = (props)=>{
  const classes = useStyle();
  const type = (props.type === undefined)?'button':'submit';
  return (
    <Button 
      variant="contained" 
      className={classes.buttonOk} 
      color="primary"
      type={type}
      onClick={props.onClick}
    >
      <CheckIcon/>
      送信
    </Button>
  );
}

export const ButtonCancel = (props) => {
  const classes = useStyle();
  const size = (props.size) ? props.size :'medium';
  return (
    <Button 
      variant="contained"
      // className={classes.buttonCancel}
      color="secondary"
      size={size}
      onClick={props.onClick}
    >
      <ClearIcon />
      キャンセル
    </Button>
  );
}

export const ButtonWeeklyCopy = (props)=>{
  return(
    <Button variant="contained" color="default" onClick={()=>props.onClick()}>
      <ArrowForwardIcon/>
    </Button>
  )
}

// --------------------------使ってない。削除予定。
// いまのところカレンダーのサーバ送信を行っている
// フックを使っている。
// dateListの書き込みなど。
// スケジュールの書き込みを対応する予定
// export const ButtonSave = (props)=>{
//   const classes = useStyle();
//   const dispatch = useDispatch();
//   const dateList = useSelector(state => state.dateList);
//   const hid = useSelector(state => state.hid);
//   const bid = useSelector(state => state.bid);
//   const stdDate = useSelector(state => state.stdDate);
//   const schedule = useSelector(state => state.schedule);
//   const btnCalss = (props.className)?classes[props.className]:'';
//   const variant = props.variant ? props.variant : 'contained';
//   const size = props.size ? props.size : 'medium';
//   const label = props.label ? props.label : '';
//   // // 日付オブジェクトをjsonにすると時差で日付がずれる！
//   // // ので一旦文字列に変換
//   // const newList = dateList.map(e=>{
//   //   return({
//   //     date:comMod.formatDate(e.date, 'YYYY-MM-DD'),
//   //     holiday: e.holiday,
//   //   });
//   // });
//   const clickHandler =()=>{
//     const prms = { dateList, stdDate, schedule, hid, bid, dispatch };
//     comMod.callDisptchForSendSchedule(prms);
//   }

//   return(
//     <Button 
//       variant={variant} color={props.color}
//       size={size}
//       className={btnCalss}
//       onClick={clickHandler}
//     >
//       <CloudUploadIcon/>
//       {label}
//     </Button>
//   )
// }
// 状態によって表示を変えるsaveボタン
// save済みの場合は何もしない
// 2021/08/10 保存済みの場合でも矯正送信可能。
// export const SaveButtonWithSate = () => {
//   const classes = useStyle();
//   const dispatch = useDispatch();
//   const dateList = useSelector(state => state.dateList);
//   const hid = useSelector(state => state.hid);
//   const bid = useSelector(state => state.bid);
//   const stdDate = useSelector(state => state.stdDate);
//   const schedule = useSelector(state => state.schedule);
//   const cntMd = useSelector(state => state.controleMode);
//   const saved = (cntMd.saved !== undefined) ? cntMd.saved : true;

//   const clickHandler = () => {
//     const prms = { dateList, stdDate, schedule, hid, bid, dispatch };
//     comMod.callDisptchForSendSchedule(prms);
//   }
//   return (<>
//       {saved &&
//         <div className={classes.saveButtonRoot} >
//           <Button
//             variant="contained"
//             color="primary"
//             startIcon={<CheckIcon />}
//             onClick={clickHandler}
            
//           >
//             保存済み
//           </Button>
//         </div>
//       }
//       {!saved &&
//         <div className={classes.ButtonNotSaved} >
//           <Button
//             variant="contained"
//             // color={lime[900]}
//             startIcon={<SaveIcon />}
//             onClick={clickHandler}
//           >
//             保存待ち
//           </Button>
//         </div>
//       }
//   </>)
// }


export const ButtonLoad = (props) => {
  return (
    <Button variant="contained" onClick={props.onClick}>
      <CloudDownloadIcon />
    </Button>
  )
}


// stateのstdDateを更新するため、次月、前月などを示す文字列を返す
// setの分、月をオフセットする
const getNewMonth = (stdDate, set)=>{
  const m = new Date(
    stdDate.split('-')[0], stdDate.split('-')[1] - 1,1
  );
  m.setMonth(m.getMonth() + set);
  return (comMod.formatDate(m ,'YYYY-MM-DD'));
}

// export const ButtonNextMonth = (props) => {
//   const stdDate = useSelector(state=>state.stdDate);
//   return (
//     <Button 
//       variant="contained" 
//       onClick={(e) => props.onClick(e)}
//     >
//       <NavigateNextIcon />
//     </Button>
//   )
// }

export const ButtonBeforeMonth = (props) => {
  return (
    <Button
      variant="contained"
      onClick={(e) => props.onClick(e)}
    >
      <NavigateBeforeIcon /> 
    </Button>
  )
}
export const MonthButtons = () => {
  const classes = useStyle();
  const stdDate = useSelector(state => state.stdDate);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const allState = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allState);
  const weekDayDefaultSet = 
    useSelector(state => state.config.weekDayDefaultSet);
  const dispatch = useDispatch();
  // ここでなぜかuseParamsが機能しないのでuseLocationを使って最終の/後の文字列を取得する
  // const prms = useParams().p;
  // const v = useParams();
  const loc = useLocation().pathname.replace(/\/$/, '');
  const lastLoc = loc.split('/')[loc.split('/').length - 1]
  const history = useHistory();
  // prmsにこれらの文字が含まれていたらbrowserbackを発生させる
  const tobeGoback = ['edit', 'append'];
  const [loadingDeley, setLoadingDeley] = useState(false);
  const goback = tobeGoback.find(e=>(lastLoc ? lastLoc: '').includes(e));
  console.log(loc, lastLoc, 'loc');
  const handleClick = (set) => {
    const prms = {set, stdDate, hid, bid, weekDayDefaultSet, dispatch, };
    thunks.setMonth(prms);
    // 修正画面などは戻るボタンを発生させる。
    // if (goback) history.goBack();
  }
  const gotoRoot = () =>{
    if (loc) history.push('/');
  }
  useEffect(()=>{
    let isMounted = true;

    if (loadingStatus.loaded && isMounted){
      setTimeout(()=>{setLoadingDeley(true)}, 1000)
    }
    if (!loadingStatus.loaded && isMounted) setLoadingDeley(false); 
    return (()=>{
      isMounted = false;
    });
  }, [loadingStatus])
  const NavBtn = (props) => {
    if (!loc && !loadingDeley){
      return (
        <Button className={classes.monthNavBtnHidden}>
          {props.icon}
        </Button>
      )
    }
    else if (!loc){
      return (
        <Button className={classes.monthNavBtn}
          onClick={props.onClick}
        >
          {props.icon}
        </Button>
      )
    }
    else return <span style={{marginInlineEnd: 24}}></span>;
  }
  const monthDisplayStyle = (loc)? {marginTop: 3}: {};
  return (<>
      <div className='monthNav'>
        <NavBtn 
          onClick={()=>handleClick(-1)}
          icon={<NavigateBeforeIcon />}
        />
        <a onClick={gotoRoot} style={{color: 'inherit'}}>
          <span className='monthDisplay' style = {monthDisplayStyle}>
            <div className='small'>{stdDate.split('-')[0]}年</div>
            <div className='medium'>{stdDate.split('-')[1]}</div>
            <div className='small'>月</div>
          </span>
        </a>
        <NavBtn
          onClick={()=>handleClick(1)}
          icon={<NavigateNextIcon />}
        />
      </div>
    {/* {!loadingStatus.loaded &&
      <div className={classes.backDrop}>
      </div>
    } */}
  </>)
}



// サービスの変更を行う。cookieからデフォルトのサービスを取得する
// 一項目めのみ空白文字、サービス指定なしが許可される
// 書き換え中
// export const ChangeServiceBk = (props) => {
//   const classes = useStyle();
//   const dispatch = useDispatch();
//   const {dispAll, loadingStatus, ...rest} = props;
//   const service = useSelector(state => state.service);
//   const serviceItems = useSelector(state => state.serviceItems);
//   const serviceShortHand = useSelector(state => state.serviceShortHand);
//   const account = useSelector(state => state.account);
//   // サービスの限定条件を取得
//   const permission = comMod.parsePermission(account);
//   // console.log(permission, 'permission')
//   let servicePermissyon;
//   if (!permission.length < 2)       servicePermissyon = '';
//   else if (!permission[1].length)  servicePermissyon = '';
//   else servicePermissyon = permission[1][0]
//   let defService;
//   if (!servicePermissyon){
//     defService = comMod.getCookeis('defService');
//     defService = defService ? defService: '';
//   }
//   else{
//     defService = servicePermissyon;
//   }
//   // defService = (defService)? defService: serviceItems[0];
//   if (!defService && dispAll) defService = '';
//   else if (!defService) defService = serviceItems[0];
//   const loadComlete = (loadingStatus.loaded && !loadingStatus.error);

//   // dispAllがfalseでservice指定がない場合、強制的に指定される。
//   let selectList = serviceItems.map(_=>{
//     return {label: serviceShortHand[_], service: _};
//   });
//   // servicePermissyonが設定されている場合、選択肢を削除
//   selectList = selectList.filter(e=>(
//     (!servicePermissyon || e.service === servicePermissyon)
//   ));

//   // 全てを表示するかどうか
//   if (dispAll)  selectList.unshift({label:'全て', service: ''});
//   // 全表示を許可されていないのにサービス指定がない場合。サービスを強制的に指定する
//   // このとき教室もリセットする -> リセットはしない。設定はchangeClassroomで行う
//   // 2021/11/22 ローディングの状態監視追加
//   useEffect(()=>{
//     if (loadComlete){
//       if (!dispAll && service === ''){
//         // const target = serviceItems[0];
//         const target = (defService)? defService: serviceItems[0];
//         // dispatch(Actions.setStore({service: target, classroom: ''}));
//         dispatch(Actions.setStore({service: target, }));
//       }
//       else if (service !== defService){
//         dispatch(Actions.setStore({service: defService, }));
//       }
//     }
//   }, [loadingStatus]);
//   // 現在のカレントインデックス
//   let currentNdx = selectList.findIndex(_ => _.service === service);
//   currentNdx = (currentNdx === -1) ? 0 : currentNdx;
//   // const [currentNdx, setCurrentNdx] = useState(preCurrent);
//   // カレントサービスを示す selectListのインデックス
//   const handleClick = () => {
//     const nextCurrent = 
//     (selectList.length - 1 === currentNdx) ? 0 : currentNdx + 1;
//     // 教室のリセットを追加 -> 削除
//     defService = selectList[nextCurrent].service;
//     dispatch(Actions.setStore({
//       service: selectList[nextCurrent].service, 
//       // classroom: ''
//     }));
//     comMod.setCookeis('defService', defService);
//   }
//   // サービスが一つ以下しか存在しない場合は何も表示しない
//   if (serviceItems.length <= 1) return null;
//   return (
//     <div className={classes.headButtonRoot}>
//       <Button
//         variant='contained'
//         onClick={handleClick}
//       >
//         {selectList[currentNdx].label}
//       </Button>
//     </div>
//   )
// }
// const fetchAndDispatchSchedule = async (hid, bid, stdDate, dispatch) =>{
//   const p = {
//     date: stdDate,hid,bid,a: 'fetchSchedule',
//   }
//   const r = await albCM.univApiCall(p);
//   console.log(r);
//   if (r.data && r.data.result){
//     const s = r.data.dt[0].schedule;
//     setTimeout(()=>{
//       dispatch(Actions.setStore(s));
//     }, 300)
//   }
//   else{
//     dispatch(Actions.setSnackMsg(
//       'スケジュールの読み込みに問題が発生しています。',
//       'warning'
//     ));
//   }

// }  
// changeServiceとChangeClassRoomでfetchallするローケーションを定義
// includesで判断される
const fetchAllPathForChangeSvcCls = [
  '/schedule/','/schedule/dsetting/','/schedule/weekly/',
  '/schedule/weekly/transfer/','/schedule/users/',
  '/schedule/daily/','/schedule/useresult/',
  '/schedule/predictive/',
  '/schedule','/schedule/dsetting','/schedule/weekly',
  '/schedule/weekly/transfer','/schedule/users',
  '/schedule/daily','/schedule/useresult',
  '/schedule/predictive',
];

export const ChangeService = (props) => {
  const classes = useStyle();
  const {loadingStatus, dispAll} = props;
  const dispatch = useDispatch();
  const allState = useSelector(state => state);
  const weekDayDefaultSet = allState.config.weekDayDefaultSet;
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const users = useSelector(state => state.users);
  const account = useSelector(state => state.account);
  const permissionDenied = useSelector(state => state.permissionDenied);
  const loc = useLocation().pathname;
  const {hid, bid, stdDate} = allState;

  // const [operated, setOperated] = useState(false);
  // classroomの限定条件を取得
  let permission = comMod.parsePermission(account)[1][0];
  permission = (permission)? permission: '';
  // ユーザーからserviceを取得
  const valSet = new Set();
  // 複数格納サービス対応
  users.forEach(e=>{
    if (e.service){
      e.service.split(',').forEach(f=>{valSet.add(f)});
    }
  })
  // パーミッションが設定されている場合、他の選択肢を排除した配列を作る
  const vals = Array.from(valSet)
  .filter(e=>permission === '' || e === permission);
  const valsCount = Array.from(valSet).length;
  const loadComlete = (loadingStatus.loaded && !loadingStatus.error);
  const cookieRaw = comMod.getCookeis('defService');
  let cookie = cookieRaw? cookieRaw.split(',')[0]: '';
  // let cookie2nd = cookieRaw? cookieRaw.split(',')[1]: '';
  const cookieExist = (cookie === '')
  ? true: Array.from(valSet).find(e=>e===cookie);
  const permissionExist = (permission === '')
  ? true: Array.from(valSet).find(e=>e===permission);
  // クッキーにundefinedが入っていたら削除
  // cookie = cookie === 'undefined'? '': cookie;
  // cookie2nd = cookie2nd === 'undefined'? '': cookie2nd;
  useEffect(()=>{
    const uLength = users.length;
    const f = () => {
      if (loadComlete && uLength){
        // パーミッションによる設定
        if (permission && service !== permission){
          if (permission !== service){
            dispatch(Actions.setStore({service: permission}))
          }
        }
        // Cookieによる設定 パーミッションが未設定のみ
        else if (cookie && service !== cookie && !permission){
          if (permission !== cookie){
            dispatch(Actions.setStore({service: cookie}))
          }
        }
        else if (cookie && service !== cookie && !dispAll){
          dispatch(Actions.setStore({service: cookie}))
        }
        // Cookieなし permission無し
        else if (serviceItems.length && !permission && !cookie && !dispAll){
          if (serviceItems[0] !== service){
            dispatch(Actions.setStore({service: serviceItems[0]}))
          }
        }
        if (!cookieExist){
          dispatch(Actions.setStore({service: ''}));
          comMod.setCookeis('defService', ',');
          dispatch(Actions.setSnackMsg(
            '保存されているサービスが存在しないため設定をリセットしました。',
            'warning'
          ));
        }
        if (!permissionExist && !permissionDenied){
          dispatch(Actions.setStore({permissionDenied: true}))
          dispatch(Actions.setSnackMsg(
            '設定されている権限による操作ができません。ブラウザを閉じて管理者に連絡して下さい。',
            'error', 'E3E7666'
          ));
        }
      }
    }
    setTimeout(() => {
      f();
    }, 100)
    
  }, [loc, users. serviceItems]);
  // ボタンの表示がトグルするリストを作成
  let lst = [];
  vals.map(e=>{
    lst.push({label:comMod.shortWord(e), value:e});
  });
  if (dispAll){
    lst.unshift({label:'全表示', value: ''});
  }

  // 現在のstore stateが示す教室の設定インデックス
  let curNdx = lst.findIndex(e=>e.value === service);
  // Cookieは２つの値を保持すする。１つ目は未選択を含む値、２つ目は未選択を含まない値
  // 例 ,放課後等デイサービス or 放課後等デイサービス,放課後等デイサービス
  let service2nd = '';
  const handleClick = () => {
    const next = (lst.length - 1 === curNdx) ? 0 : curNdx + 1;
    const v = lst[next].value;
    dispatch(Actions.setStore({service: v}));
    comMod.setCookeis('defService', v, 30);
    if (fetchAllPathForChangeSvcCls.includes(loc)){
      thunks.fetchAll({stdDate, hid, bid, weekDayDefaultSet, dispatch});
    }
  }
  if (valsCount === 1) return null;
  if (!loadingStatus.loaded)  return null;
  if (!users.length) return null;

  // パーミッションが設定され結果がdispatchされる前は-1になる。その場合は非表示にする。
  if (curNdx < 0) return null;
  const labelStyle = (permission)? {color:teal[800],opacity:.6}: {};
  return (
    <div className={classes.headButtonRoot} style={{...props.style}}>
      <Button
        variant='contained'
        onClick={handleClick}
      >
        <span style={labelStyle}>{lst[curNdx].label}</span>
      </Button>
    </div>
  )
}


// 教室選択のボタン版
export const ChangeClassRoom = (props) => {
  const classes = useStyle();
  const {loadingStatus} = props;
  const dispatch = useDispatch();
  const classroom = useSelector(state => state.classroom);
  const users = useSelector(state => state.users);
  const account = useSelector(state => state.account);
  const permissionDenied = useSelector(state => state.permissionDenied);
  const allState = useSelector(state => state);
  const weekDayDefaultSet = allState.config.weekDayDefaultSet;
  const {hid, bid, stdDate} = allState;


  const loc = useLocation().pathname;

  // const [operated, setOperated] = useState(false);
  // classroomの限定条件を取得
  let permission = comMod.parsePermission(account)[1][1];
  permission = (permission)? permission: '';
  // パーミッションが指定されていたらその値を設定
  let def = (permission)? permission: '';
  // ユーザーからクラスルームを取得
  const valTmp = [];
  users.map(e=>{
    const clr = e.classroom;
    if (!clr) return false;
    if (Array.isArray(clr)) valTmp.push(...clr);
    else if (clr.indexOf(',')) valTmp.push(...clr.split(','));
    else valTmp.push(clr);
  })
  const valSet = new Set(valTmp);
  // パーミッションが設定されている場合、他の選択肢を排除した配列を作る
  const vals = Array.from(valSet)
  .filter(e=>permission === '' || e === permission + '');
  const valsCount = Array.from(valSet).length;
  const loadComlete = (loadingStatus.loaded && !loadingStatus.error);
  let cookie = comMod.getCookeis('defClass');
  cookie = cookie? cookie.split(',')[0]: '';
  // Cookieやパーミッションに設定されている値が存在するかどうか
  const cookieExist = (cookie === '')
  ? true: Array.from(valSet).find(e=>e===cookie);
  const permissionExist = (permission === '')
  ? true: Array.from(valSet).find(e=>e===permission + '');

  useEffect(()=>{
    const f = () => {
      if (users.length && loadComlete){
        if (permission && classroom !== permission){
          dispatch(Actions.setStore({classroom: permission + ''}))
        }
        else if (cookie && classroom !== cookie && !permission && cookieExist){
          dispatch(Actions.setStore({classroom: cookie + ''}))
        }
        if (!cookieExist){
          dispatch(Actions.setStore({classroom: ''}));
          comMod.setCookeis('defClass', '', 30);
          dispatch(Actions.setSnackMsg(
            '保存されている単位が存在しないため設定をリセットしました。',
            'warning'
          ));
        }
        if (!permissionExist && !permissionDenied){
          dispatch(Actions.setStore({permissionDenied: true}))
          dispatch(Actions.setSnackMsg(
            '設定されている権限による操作ができません。ブラウザを閉じて管理者に連絡して下さい。',
            'error', 'E3E7665'
          ));
        }
      }
    }
    setTimeout(() => {
      f();
    }, 100);
  }, [loc, users]);
  if (!loadingStatus.loaded)  return null;

  // ボタンの表示がトグルするリストを作成
  let lst = [];
  vals.map(e=>{
    if (e){
      lst.push({label:e, value:e});
    }
  });
  // パーミッションを見て全教室表示を追加
  if (permission === ''){
    lst.push({label:'全単位', value:''});
  }

  // 現在のstore stateが示す教室の設定インデックス
  let curNdx = lst.findIndex(e=>e.value === classroom);
  // Cookieは２つの値を保持すする。１つ目は未選択を含む値、２つ目は未選択を含まない値
  // 例 ,梅 or 梅,梅
  const handleClick = () => {
    const next = (lst.length - 1 === curNdx) ? 0 : curNdx + 1;
    const v = lst[next].value
    dispatch(Actions.setStore({classroom: v}));
    let toCookie;
    if (v)  toCookie = v + ',' + v;
    else{
      const t = comMod.getCookeis('defClass').split(',');
      t[0] = v;
      toCookie = t[0] + ',' + t[1];
    }
    comMod.setCookeis('defClass', toCookie, 30);
    // 必要なパスであればfetchAllを実行する
    if (fetchAllPathForChangeSvcCls.includes(loc)){
      thunks.fetchAll({stdDate, hid, bid, weekDayDefaultSet, dispatch});
    }
  }
  // 教室が未設定の場合は表示されない
  if (valsCount <= 1) return null;
  // パーミッションが設定され結果がdispatchされる前は-1になる。その場合は非表示にする。
  if (curNdx < 0) return null;
  const labelStyle = (permission)? {color:teal[800],opacity:.6}: {};
  return (
    <div className={classes.headButtonRoot}  style={{...props.style}}>
      <Button
        variant='contained'
        onClick={handleClick}
      >
        <span style={labelStyle}>{lst[curNdx].label}</span>
      </Button>
    </div>
  )
}


// 普通の通知
// エラーとかじゃないやつ
export const NoticeDialog = (props) => {
  // props = {title, content, initOpen}
  // const [open, setOpen] = React.useState(false);
  // const handleClickOpen = () => {
  //   setOpen(true);
  // };
  // useEffect(()=>{
  //   setOpen(props.initOpen);
  // })
  const handleClose = () => {
    props.setnoticeopen(false);
  };

  return (
    <div>
      {/* <Button variant="outlined" color="primary" onClick={handleClickOpen}>
        Open alert dialog
      </Button> */}
      <Dialog
        open={props.noticeopen}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{props.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
          <props.Content/>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleClose} color="primary" autoFocus
            variant='contained'
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
