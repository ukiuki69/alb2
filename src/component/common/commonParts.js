import React, { Profiler, useEffect, useRef, useState } from 'react';
import * as Actions from '../../Actions';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Collapse, List, ListItem, ListItemText, Menu, MenuItem, Radio, RadioGroup, 
  Snackbar, colors, useMediaQuery, Tooltip 
} from '@material-ui/core';
import * as comMod from '../../commonModule';
import * as albCM from '../../albCommonModule';
import * as thunks from '../../modules/thunks';
import { getBrowserInfo } from '../../modules/albUtils';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
// import { useStyles } from './FormPartsCommon';
import { makeStyles } from '@material-ui/core/styles';
import FormLabel from '@material-ui/core/FormLabel';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import MoodIcon from '@material-ui/icons/Mood';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';
import Button from '@material-ui/core/Button';
import teal from '@material-ui/core/colors/teal';
import blue from '@material-ui/core/colors/blue';
import red from '@material-ui/core/colors/red';
import { blueGrey, grey, indigo, lime, orange, yellow } from '@material-ui/core/colors';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faSleigh, faYenSign } from "@fortawesome/free-solid-svg-icons";
import { setBillInfoToSch, } from '../Billing/blMakeData';
import PrintIcon from '@material-ui/icons/Print';
import SnackMsg from './SnackMsg';
import CallMergeIcon from '@material-ui/icons/CallMerge';
import ShareIcon from '@material-ui/icons/Share';
import { ArrowBackIosRounded } from '@material-ui/icons';
import useInterval from 'use-interval';
import { KeyListener } from './KeyListener';
import { ShortCutNotice } from '../../DrowerMenu';
import { NotDispLowCh, useSuspendLowChange } from './useSuspendLowChange';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import SettingsIcon from '@material-ui/icons/Settings';

import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { useGetHeaderHeight } from './Header';
import { seagull } from '../../modules/contants';

const iconStyle = { padding: 0, fontSize: 18, marginRight: 8 };
const useStyles = makeStyles({
  faIcon:{
    padding: 0, fontSize: 20, 
    width: 24, textAlign: 'center', display: 'inline-block',
    height: 0, marginTop: -12
  },

  editUserRoot:{
    display: 'inline-block',
    '& .MuiButton-root': {backgroundColor: indigo[700], color:'#fff'},  
    '& .iconButton':{
      '& .MuiSvgIcon-root': {color: indigo[700]}
    },
    '& .MuiButton-root.textButtonStyle':{
      backgroundColor: '#fff', color:indigo[700],  
    }
  },
  goToUsersSch:{
    display: 'inline-block',
    '& .MuiButton-root': {backgroundColor: lime[900], color:'#fff'},  
  },
  cheeckBoxRoot: {
    padding: 8,
    paddingLeft: 16,
    maxHeight: '75vh',
    '& .MuiCheckbox-root': {
      padding: 4,
    },
  },
  userSelectDialog:{
    padding: 4,
    borderRadius: 2,
  },
  closeButton: {
    // position:'relative',
    // top: 0,
    // right: 0,
  },
  dialogTitle:{
    padding: 0,
    paddingLeft: 26,
  },
  scrollBody: {
    padding: '8px 8px 16px 0px',
  },
  linktabRoot: {
    position:'fixed',
    top: 47,
    width: '100vw',
    zIndex: 998,
    '& > .MuiButton-text': {
      // margin: theme.spacing(1),
      padding: 0,
    },
    '& .linkButton': {
      color: "#eceff1",padding: '6px 12px',margin: '0 8px'
    },
    '& .subMenus': {
      display: 'flex',
      position: 'absolute', left: '92.5%',
      top: '50%',
      transform: "translateY(-50%)",
    }
  },
  errDisplay:{
    marginTop: '20vh', color: teal[500],
    '& p': {padding: 8},
    '& .link' : {
      color: blue[500],
      '& a' : {color : red[500]},
    },
  },
  serviceSnack: {
    '& .MuiSnackbarContent-root':{
      marginTop: '35vh', textAlign: 'center', color: '#fff',
      background: teal[500],
      '& .MuiSnackbarContent-message': {margin:'0 auto'},
    },
  },
  serviceSnackHD: {
    '& .MuiSnackbarContent-root':{
      marginTop: '35vh', textAlign: 'center', color: '#fff',
      background: blue[500],
      '& .MuiSnackbarContent-message': {margin:'0 auto'},
    },
  },
  LoadErrRoot: {
    width: '80%', maxWidth: 600, margin: '60px auto',
    '& .detail': {
      wordBreak: 'break-all', fontSize: '.8rem', color: grey[500],
      padding: '8px 0', lineHeight: 1.6,
    },
    '& .errId': {paddingTop: 24, color:teal[700]},
    '& .imgWrap': {textAlign: 'center', padding: 24,},
    '& .mainMsg': {
      color: red[700], fontSize: '1.2rem', padding: '16px 0',
    },
    '& .subMsg': {
      '& > p': {
        padding: '8px 0',lineHeight: 1.4,
        '& > a': {fontSize: '1.4rem', color: teal[600], fontWeight: 600,},
      }
    }

  },
  stdErrDisp: {
    width: '80%', maxWidth: 600, margin: '60px auto',
    '& .detail': {
      wordBreak: 'break-all', color:grey[800], fontSize:'.9rem',
      padding: '4px 0', lineHeight: 1.6,
    },
    '& .detailHead': {
      padding: '16px 0 4px', fontSize:'.8rem',
      borderBottom: '1px solid ' + grey[200], color: grey[600],
    },
    '& .errId': {paddingTop: 24, color:teal[700]},
    '& .imgWrap': {textAlign: 'center', padding: 24,},
    '& .mainMsg': {
      color: red[700], fontSize: '1.2rem', padding: '16px 0',
    },
    '& .subMsg': {
      '& > p': {
        padding: '8px 0',lineHeight: 1.4,
        '& > a': {fontSize: '1.4rem', color: teal[600], fontWeight: 600,},
      }
    }

  },
  excahngeTotalizeButton:{
    '& .MuiSvgIcon-root': {
      transform: 'scale(1,-1)',
    },
  },
  goBackButton: {
    position: 'absolute', top: 0, left: -120,
    '& .MuiButton-root': {
      width:80, height:80, borderRadius: 40,
    },
    '& .MuiButton-label': {display: 'block'},
    '& .MuiButton-startIcon': {display: 'block', textAlign: 'center', marginLeft: 12}
  },
  setUisCookieChkBoxRoot: {
    width: '80%', margin: '16px auto', padding: 8, textAlign: 'justify',
    '@media print': {display: 'none'}, 
  },
  userLabelRoot:{
    display: 'inline-flex', alignItems: 'center',
    // '& >*': {},
    '& .num': {width: 32, textAlign: 'center'},
    '& .name': {maxWidth: 120, },
    '& .age': {marginInlineStart: 8},
  },
  oneUserInUserSelectDialog:{
    paddingLeft: 16,
  },
  LinksTabDropdownMenu: {
    position: 'sticky', zIndex: 998,
    backgroundColor: blueGrey[800], color: '#fff',
  },
  saikouchikuRoot: {
    background: grey[100], 
    width: '20vw', 
    padding: 8,
    fontSize: '.8rem', 
    position: 'fixed', 
    bottom: 8, 
    left: '40vw',
    color: '#333', 
    textAlign: 'center', 
    opacity: .8,
    border: '1px solid ' + grey[600], 
    borderRadius: 2,
    '@media print': {
      position: 'absolute',
      bottom: '20mm',
      left: '50%',
      transform: 'translateX(-50%)',
      opacity: 1,
      width: '40%',
      display: 'block !important',
      backgroundColor: '#f5f5f5',
      border: '1px solid #757575'
    }
  },
});
// サービスが変更されたときにスナック表示を行う
// serviceItemsが一つのときは表示されない
export const ServiceNotice = () => {
  const service = useSelector(state=>state.service);
  const serviceItems = useSelector(state=>state.serviceItems);
  const [snack, setSnack] = useState({open: false, msg: ''});
  const classes = useStyles();
  useEffect(()=>{
    setSnack({open: true, msg: service});
  }, [service]);
  const handleClose = () =>{
    setSnack({...snack, open: false});
  }
  const key = new Date().getTime();
  if (serviceItems.length === 1)  return null;
  const snackClass = (service==='放課後等デイサービス')
  ? classes.serviceSnack: classes.serviceSnackHD;
  return(
    <Snackbar
      className={snackClass}
      anchorOrigin={{ vertical: 'top', horizontal:'center'}}
      autoHideDuration={2000}
      open={snack.open}
      onClose={handleClose}
      message={snack.msg}
      key={key}
    />
  )
}

export const LoadingSpinner =()=>{
  return(
    <div className='loading'>
      <img src="./img/loading3dRing.png" />
      {/* <img src="./img/loading3dSq.png"/> */}
    </div>
    // <div class="spinner-box">
    //   <div class="leo-border-1">
    //     <div class="leo-core-1"></div>
    //   </div> 
    //   <div class="leo-border-2">
    //     <div class="leo-core-2"></div>
    //   </div> 
    // </div>
  )
}


// 日毎の加算の数をドットで表現
// maxdotの値で何ドットまでドット数で表示するか。
// maxdot以上ならドットxで表示する
// maxdot -1ならフォントサイズを小さくする
export const DAddictionContent = (props) => {
  const { did, maxdot, ...other } = props;
  const maxdot_ = (maxdot === undefined) ? 4 : maxdot;
  const schedule = useSelector(state => state.schedule);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  // 日毎の加算項目をカウント
  const addictionOfDay = () => {
    if (!schedule)  return {};
    if (!schedule?.[service]) return {};
    if (!schedule?.[service]?.[did]) return {};
    if (classroom) {
      return (schedule?.[service]?.[did]?.[classroom]) || {};
    } else {
      return (schedule?.[service]?.[did]) || {};
    }
    // return (Object.keys(schedule[service][did]).length);
  }
  
  const dAddiction = addictionOfDay();
  const keys = Object.keys(dAddiction);
  const c = keys.length;
  if (c >= maxdot_) return (
    <div className="dAddiction">
      <FiberManualRecordIcon fontSize='inherit' />{c}
    </div>
  );
  const a = new Array(c).fill(1);
  const b = a.map((e, i) => {
    return <FiberManualRecordIcon key={i} fontSize='inherit' />
  });
  let styleObj = {};
  // styleObj.fontSize = (c === maxdot_ - 2) ? '.5rem' : 'inherit';
  // styleObj.fontSize = (c === maxdot_ - 1) ? '.4rem' : 'inherit';
  if (c === maxdot_ - 2) styleObj = { fontSize: '.5rem' };
  if (c === maxdot_ - 1) styleObj = { fontSize: '.4rem' };

  // Tooltipの内容を生成
  const tooltipContent = keys.map(key => {
    const value = dAddiction[key];
    if (Number(value) === 1) {
      return key; // 値が1の場合はキーのみ表示
    } else {
      return `${key}: ${value}`; // それ以外はkey: valueで表示
    }
  }).join('\n');

  // 何もないときはTooltipを抑制
  if (keys.length === 0) {
    return (
      <div className="dAddiction" style={styleObj}>
        {b}
      </div>
    );
  }

  return (
    <Tooltip 
      title={
        <div style={{ whiteSpace: 'pre-line' }}>
          {tooltipContent}
        </div>
      }
      placement="top"
    >
      <div className="dAddiction" style={styleObj}>
        {b}
      </div>
    </Tooltip>
  )
}


// メニュー用にキーリスナーを起動する
// ショートカットキーとlinkのセットを受け取る menuitemそのままでもok
// shortCutLinkSetにはやっぱラベルも必要
const LinksTabKeysListener = ({shortCutLinkSet}) => {
  const [keyInfo, setKeyInfo] = useState({
    key: '', shift: false, ctrl: false, meta: false,
  });
  const [msg, setMsg] = useState('');
  const history = useHistory();
  useEffect(()=>{
    const {key, shift, ctrl, meta} = keyInfo;
    if (!shift && !ctrl && !meta && key){
      const t = shortCutLinkSet.find(e=>e.shortcut.toString() === key.toLowerCase());
      if (t && t.link){
        history.push(t.link);
        setMsg(t.shortcut .toString().toUpperCase() + ' ' + t.label);
      }
    }
  }, [keyInfo, history, ])
  return (<>
    <KeyListener setKeyInfo={setKeyInfo} />
    <ShortCutNotice msg={msg} setMsg={setMsg} />
  </>)
}

/**
 * 画面全体を印刷するためのアイコンボタン
 * LinksTabコンポーネントに渡すmenu（連想配列）のオブジェクトに「print: true」を渡すことで、
 * 渡されたリンク画面にプリントアイコンを表示。
 * @param {*} props 
 * @returns 
 */
const PrintIconButton = (props) => {
  const classes = useStyles();
  const params = useParams();
  const location = useLocation();
  const {menuItem={}, menu, extMenu, hide} = props;
  const allState = useSelector(state => state);
  
  useEffect(()=>{
    const tStr = menuItem.printTitle || menuItem.label;
    const thisTitle = albCM.getReportTitle(allState, tStr || "");
    const titleSet = () => document.title = thisTitle;
    const titleReset = () => document.title = albCM.defaultTitle;
    // reportsではこの機能を利用しない
    if (location.pathname.match(/^\/reports/)) return;
    window.addEventListener('beforeprint', titleSet);
    window.addEventListener('afterprint', titleReset);
    return (()=>{
      window.removeEventListener('beforeprint', titleSet);
      window.removeEventListener('afterprint', titleReset);
    })
  }, [menuItem]);
  
  const filteredPathname = location.pathname.split("/").reduce((prevFilteredPathname, path) => {
    if(!Object.values(params).some(x => x === path) && path) prevFilteredPathname += path + "/";
    return prevFilteredPathname;
  }, "/");
  // console.log("filteredPathname", filteredPathname)
  const isPrint = menu.find(m => new RegExp(filteredPathname).test(m.link))?.print ?? false;
  const hiddenStyle = !isPrint ?{visibility: 'hidden'} :{};
  const nonExtMenuStyle = !extMenu? {marginLeft: 38, }: {}
  if (hide) return null;
  return(
    <div
      className={classes.printIconButton}
      style={{...hiddenStyle, ...nonExtMenuStyle}}
    >
      <IconButton
        onClick={() => window.print()}
        style={{padding: 4}}
      >
        <PrintIcon style={{color: "#fff"}}/>
      </IconButton>
    </div>
  )
}

/**
 * リンクスタブのサブメニューアイコンボタン
 * LinksTabコンポーネントにextMenu（連想配列）を渡すことでメニューを表示
 * [{option: "メニュー１", link: "/xxx/yyy/"}, {option: "メニュー２", link: "/aaa/bbb/"}]
 * @param {*} props 
 * @returns 
 */
const ExtMenu = (props) => {
  const history = useHistory();
  const {extMenu=[]} = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [keyInfo, setKeyInfo] = useState({});
  const iconButtonRef = useRef();
  const account = useSelector(s=>s.account);
  const permission = comMod.parsePermission(account)[0][0];

  useEffect(() => {
    if(keyInfo.key === "M" && keyInfo.shift){
      iconButtonRef.current.click();
    }
  }, [keyInfo])

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (menuItem) => {
    const link = menuItem.link;
    if(link) history.push(link);
    setAnchorEl(null);
  };

  const hiddenStyle = !extMenu.length ?{visibility: 'hidden'} :{};
  return(
    <div style={{...hiddenStyle, marginLeft: 8}}>
      <IconButton
        aria-label="more"
        aria-controls="long-menu"
        aria-haspopup="true"
        onClick={handleClick}
        style={{padding: 4}}
        ref={iconButtonRef}
      >
        <MoreVertIcon style={{color: "#fff"}} />
      </IconButton>
      <Menu
        id="long-menu"
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          style: {
            width: '20ch',
          },
        }}
      >
        {extMenu
          .filter(menuItem => {
            // permissionが設定されている場合、現在のpermissionより小さい場合は表示しない
            if (menuItem.permission !== undefined && menuItem.permission !== null) {
              return permission >= Number(menuItem.permission);
            }
            return true;
          })
          .map((menuItem={}) => (
          <MenuItem key={menuItem.option || menuItem.label} onClick={() => handleClose(menuItem)}>
            {menuItem.option || menuItem.label}
          </MenuItem>
        ))}
      </Menu>
      <KeyListener setKeyInfo={setKeyInfo} />
    </div>
  )
}

/**
 * リンクスタブのメニューを表示
 * @param {*} props 
 * @returns 
 */
export const LinksTab = (props) => {
  const history = useHistory();
  const classes = useStyles();
  const pathname = useLocation().pathname;
  const account = useSelector(s=>s.account);
  const permission = comMod.parsePermission(account)[0][0];
  const [selectMenuItem, setSelectMenuItem] = useState({});

  // スマホ・タブレット表示の場合、ドロップダウンメニューに変更
  const isLimit500px = useMediaQuery("(max-width: 500px)");
  const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);
  const headerHeight = useGetHeaderHeight();

  useEffect(() => {
    const initMenuItem = props.menu.find(m => m?.link === pathname) ?? props.menu?.[0] ?? {};
    setSelectMenuItem({...initMenuItem});
  }, []);

  // idを作成するためにpathの最初の要素を取得
  const idBase = pathname?.split('/')[1]? pathname?.split('/')[1]: ''; 
  let menu;
  if (comMod.typeOf(props.menuFilter) === 'function'){
    menu = props.menu.filter(props.menuFilter);
  }else{
    menu = props.menu;
  }
  // 設定リンクを取得
  const settingLink = props.menu.find(item => item.setting 
    && (!item.permissionLower || permission >= Number(item.permissionLower)))?.link;

  // 設定リンクをメニューから削除
  menu = menu.filter(menuItem => menuItem.setting ? false : true);

  // ショートカットの設定。初期値は数値
  let shortcutCounter = 1;
  menu.forEach((e) => {
    if (e.hide) {
      e.shortcut = '';
    }
    else{
      e.shortcut = shortcutCounter++;
    }
  });

  const handleClick = (menuItem) => {
    const link = menuItem.link;
    setSelectMenuItem(menuItem);
    history.push(link);
  }

  // ドロップダウンメニュー（スマホ・タブレット表示に使う）
  if(isLimit500px){
    const filteredMenuItem = menu.filter(menuItem => {
      if (menuItem.permission && menuItem.permission > permission) return false;
      if (menuItem.hide) return false;
      if (menuItem.setting) return false;
      return true;
    });
    const selectedDropdownMenuItem = filteredMenuItem.find(menuItem => menuItem.link === pathname) ?? filteredMenuItem[0];
    const dropdownMenuItems = filteredMenuItem.filter(menuItem => menuItem.link !== pathname).map(menuItem => {
      return (
        <ListItem
          button
          key={menuItem.label}
          onClick={() => handleClick(menuItem)}
        >
          <ListItemText primary={menuItem.label} />
        </ListItem>
      )
    });

    return(
      <div className={classes.LinksTabDropdownMenu} style={{top: headerHeight}}>
        <List component="div" disablePadding>
          <ListItem button onClick={() => setDropdownMenuOpen(prev => !prev)}>
            <ListItemText primary={selectedDropdownMenuItem?.label ?? ''} />
            {dropdownMenuOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItem>
          <Collapse in={dropdownMenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {dropdownMenuItems}
            </List>
          </Collapse>
        </List>
      </div>
    )
  }

  // リンクスタブの各ボタンを定義
  const linkList = menu.map((menuItem, i) => {
    const selectedStyle = pathname === menuItem.link ?{backgroundColor: '#526d7a'} :{};
    if (menuItem.permission && menuItem.permission > permission) return null;
    if (menuItem.hide) return null;
    return (
      <Button
        key={menuItem.label} id={idBase + '-' + menuItem.shortcut}
        onClick={() => handleClick(menuItem)}
        className='linkButton'
        style={{...selectedStyle}}
      >
        {menuItem.shortcut + '.' + menuItem.label}
      </Button>
    )
  });

  // コンポーネント内で、クリックイベント用の関数を定義する
  const handleSettingClick = () => {
    console.log('設定アイコンがクリックされました');
    history.push(settingLink);
  };

  return (
    <>
    <div className={`linksTab ${classes.linktabRoot}`} style={{...props.style}}>
      {linkList}
      {settingLink && 
        <IconButton onClick={handleSettingClick} style={{padding: 0}}>
          <SettingsIcon style={{ color: '#eee' , }} />
        </IconButton>
      }
      <div className="subMenus">
        <PrintIconButton menuItem={selectMenuItem} menu={props.menu} extMenu={props.extMenu} />
        <ExtMenu extMenu={props.extMenu} />
      </div>
    </div>
    <LinksTabKeysListener shortCutLinkSet={menu}/>
    </>
  );
}

// エラー表示用
export const ErrorBoundaryDisplay = () => {
  // const classes = useStyles();
  return (
    <div className='errDisplay'>
      <p className='msg'>申し訳ありません。何か問題が発生しているようです。</p>
      <p className='link'><a href='/'>こちらを</a>クリックして同じ操作で同じエラーが発生する場合、管理者またはサポートに連絡して下さい。</p>
    </div>
  )
}

// ユーザーごとの加算をドットで表現
// 結局、オブジェクトのキーの長さをドットで返すだけのComponent
export const Uaddiction = (props)=>{
  if (!props) return null;
  // 表示しない加算項目
  const egnoreAddiction = ['上限管理結果', '利用者負担上限額管理加算']
  const l = Object.keys(props)
  .filter(e=>!egnoreAddiction.includes(e)).length;
  if (l > 6){
    return (
      <FiberManualRecordIcon fontSize='inherit' /> + l
    )
  }
  const c = Array(l).fill(0).map((e, i)=>{
    return(<FiberManualRecordIcon fontSize='inherit' key={i} />);
  });
  return c;
};

export const LoadErr = (props) => {
  const {loadStatus, errorId} = props; // lsはローディングステイタス
  const classes = useStyles();
  const stdDate = useSelector(state => state.stdDate);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const weekDayDefaultSet =
    useSelector(state => state.config.weekDayDefaultSet);
  const dispatch = useDispatch();
  const handleClick = () =>{
    const prms = {set: 0, stdDate, hid, bid, weekDayDefaultSet, dispatch, };
    thunks.setMonth(prms);

  }
  return(
    <div className={classes.LoadErrRoot}>
      <div className='imgWrap'>
        <img src={`${window.location.origin}/img/errlogoRed.svg`}
          width="120px" alt="logo"
        />
      </div>

      <div className='mainMsg'>読み込みエラーが発生しました。</div>
      <div className='subMsg'>
        <p>インターネット接続が不安定なのかも知れません。
          接続を確認してから<a href='/'>こちら</a>をクリックして下さい。</p>
        <p>
          インターネット接続が問題ないにも関わらず
          この画面が何度も表示されるときはサポートにご連絡をお願いします。
        </p>
        <p>
          利用開始前の月を表示しようとするとこのエラーが発生します。<br></br>
          <a onClick={handleClick}>こちら</a>をクリックして当月表示に切り替えて下さい。
        </p>
      </div>
      <div className='errId'>{errorId}</div>
      <div className='detail'>{JSON.stringify(loadStatus)}</div>
    </div>
  )
}
// 普通のエラー表示
export const StdErrorDisplay = (props) => {
  const {errorText, errorSubText, errorId, errorDetail} = props;
  const classes = useStyles();
  return (
    <div className={classes.stdErrDisp}>
      <div className='imgWrap'>
        <img src={`${window.location.origin}/img/errlogoRed.svg`}
          width="120px" alt="logo"
        />
      </div>
      <div className='mainMsg'>{errorText}</div>
      <div className='subMsg'>
        <p>
          インターネット接続が不安定なのかも知れません。
          接続を確認してから<a href='/'>こちら</a>をクリックして下さい。</p>
        <p>
          {errorSubText}
        </p>
      </div>
      <div className='errId'>{errorId}</div>
      <div className='detailHead'>エラー内容詳細</div>
      <div className='detail'>{errorDetail}</div>

    </div>
  )
}

// ブラウザチェックを行う
// chrome以外の場合は警告する
export const BrowserCheck = () => {
  const { browser, match, error, detect } = getBrowserInfo();

  const fontSize = {fontSize: '1.4rem'}
  const DispError = () => (
    <div style={{padding:8, color:red[900], ...fontSize}}>
      {browser}は非対応なのでご利用いただけません。
    </div>
  )
  const DispWarning = () => (
    <div style={{padding:8, color:blue[900], ...fontSize}}>
      お使いのブラウザは{browser}です。Google Chromeのご利用を推奨します。
    </div>
  )
  const NotDetect = () => (
    <div style={{padding:8, color:red[900], ...fontSize}}>
      お使いのブラウザを検出できませんでした。Google Chromeのご利用を推奨します。
    </div>
  )
  if (error){
    return (<DispError />)
  }
  else if (!match){
    return(<DispWarning />)
  }
  else if (!detect){
    return(<NotDetect/>)
  }
  else return null;

}

export const PermissionDenied = (props) => {
  const {marginTop} = props;
  const style = {marginTop: parseInt(marginTop)};
  style.textAlign = 'center';
  return (<>
    <div style={style}>
      このページを表示する権限がありません。
    </div>
    <GoBackButton posX={120} posY={10}/>
  </>)
}

// 汎用テーブルであるsomestateに売上情報を送信
// propsでdisplayButtonが指定されていたら
// ボタンを表示する
// 名前はToSomeStateだがanystateに送信する
export const SendBillingToSomeState = (props) => {
  const {
    displayButton,  // 送信ボタンを表示するか。表示しないときは自動送信
    sendAnyTime,    // 自動送信時毎回送信するかに,Cookieを見て一日一回送信に限定するか
  } = props;

  const allState = useSelector(state=>state);
  const [snack, setSnack] = useState({msg: '', severity: ''});
  // const {
  //   stdDate, schedule, users, com, serviceItems, account,
  //   hid, bid,
  // } = allState;

  const stdDate = useSelector(state=>state.stdDate);
  const schedule = useSelector(state=>state.schedule);
  const users = useSelector(state=>state.users);
  const com = useSelector(state=>state.com);
  const serviceItems = useSelector(state=>state.serviceItems);
  const account = useSelector(state=>state.account);
  const dateList = useSelector(state=>state.dateList);
  const hid = useSelector(state=>state.hid);
  const bid = useSelector(state=>state.bid);

  const ls = comMod.getLodingStatus(allState);
  const service = ''; // サービスは未指定で
  const sbid = bid.slice(-4) + stdDate.slice(5, 7); // bid下4桁と月を示す二桁
  const isSmallWidth = useMediaQuery('(max-width:600px)');
  const isSmallHeight = useMediaQuery('(max-height:600px)');
  const skipForSmallScreen = isSmallWidth || isSmallHeight;
  const cookieName = 'sentBdt';
  const thisCookie = comMod.getCookeis(cookieName)
  ?comMod.getCookeis(cookieName): '00000000';
  const cookieDate = thisCookie.slice(0, 8); // 日付部分
  const thisDate = comMod.formatDate(new Date(), 'YYYYMMDD');
  // 事業所番号の下四桁を探して送信済みかどうか 最初は日付が入っている。0以上で探す。
  const sentBid = thisCookie.indexOf(sbid) > 1;
  // Cookieの日付的に自動送信するべきか
  const judgeCookieDate = thisDate > cookieDate;
  // propsとcookieの値で自動送信するべきか
  const dataToBeSend = sendAnyTime || (judgeCookieDate || !sentBid);
  const permission = (ls.loaded && !ls.error)? comMod.parsePermission(account)[0][0]: 100;
  const sendIt = async () => {
    // 売上計算用パラメータ
    const prms = {stdDate, schedule, users, com, service, serviceItems};
    prms.calledBy = 'SendBillingToSomeState';

    let billingDt = [], masterRec ={};
    // サービスアイテムに対応した事業所加算情報があるか
    // stateの更新が間に合わないことがあるっぽい
    let existComAddic = true;
    serviceItems.forEach(e=>{
      if (!com.addiction[e])  existComAddic = false;
    })
    if (skipForSmallScreen) {
      return false;
    }
    if (ls.loaded && !ls.error && existComAddic){
      // calledBy対応済み
      const r = setBillInfoToSch(prms);
      billingDt = r.billingDt? [...r.billingDt]: [];
      masterRec = r.masterRec? {...r.masterRec}: {};
    }
    // 請求データなし
    if (!billingDt.length) return false;
    // billingDtを間引きする did以下を削除
    // 間引きやめる！
    // billingDt.forEach(e=>{
    //   // didの値を配列化
    //   const t = Object.keys(e).filter(f=>f.match(/^D2[0-9]{7}/));
    //   t.forEach(f=>{
    //     delete e[f];
    //   })
    // });
    // someStateに保管するパラメータ
    const sendDateList = dateList.map(e=>(
      {
        dateStr: comMod.formatDate(e.date, 'YYYYMMDD'),
        dayOfWeek: e.date.getDay(),
        holiday: e.holiday,
      }
    ))
    const somState = {billingDt, masterRec, com, dateList: sendDateList};

    // キープの日数を追加
    const sendPrms = {
      date: stdDate, jino: account.jino, keep: 365 + 120, hid, bid,
      item: 'billingDt', state:JSON.stringify(somState),
      a: 'sendAnyState',
    }
    if (!stdDate) return false; // stddateが設定されていないことがあるっぽい
    await albCM.univApiCallJson(
      sendPrms, '', setSnack, '売上情報を更新しました。'
    );
    const dateFormated = comMod.formatDate(new Date(), 'YYYYMMDD');
    let bidStr = thisCookie.slice(8); // Cookieのbids連結部分
    bidStr = bidStr + sbid + '';
    // 4事業所以上は保存しない
    if (bidStr.length > (sbid.length * 4))  bidStr = bidStr.slice(sbid.length);
    comMod.setCookeis(cookieName, dateFormated + bidStr);
  }

  // メモリリーク対策。こんな簡単でいいの？
  // 一旦は出なくなったけどまたワーニングが出るようになった。
  // -> しばらくは見てない これで良いのかも。
  useEffect(()=>{
    const ls = comMod.getLodingStatus(allState);
    let isMounted = true;
    const f = async () => {
      await sendIt();
    }
    const loadDone = ls.loaded && !ls.error;
    const notDevelopper = permission < 100; // デベロッパー権限は送信しない
    // 一度送ったら二度目以降は走らせない
    const alreadySent = comMod.getCookeis(cookieName)?.includes(sbid);
    if (skipForSmallScreen) return;
    if (loadDone && notDevelopper && !displayButton && dataToBeSend && !alreadySent && isMounted){
      f();
    }
    return (()=>{
      isMounted = false;
    });
  }, [/* run once after load */ allState.stdDate, allState.hid, allState.bid, skipForSmallScreen])


  if (skipForSmallScreen) return null;
  if (!ls.loaded) return null;
  if (ls.error) return null;
  return (
    <div>
      {displayButton === true &&
        <Button
          onClick={sendIt}
          color='secondary' variant='contained'
          startIcon={<ShareIcon/>}
        >
          売上の送信
        </Button>
      }
      <SnackMsg {...snack}/>
    </div>
  )
}

// わんぱく会CSV取り込み用の
// g formを起動する
export const WanpakuImportButton = () => {
  const allState = useSelector(state=>state);
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const ls = comMod.getLodingStatus(allState);
  const {account, stdDate, hid, bid} = allState;
  const sendPrms = {
    date: stdDate, jino: account.jino,
    item: 'wanpakuImport', state:JSON.stringify(account)
  }
  const handleClick = async () => {
    await albCM.sendSomeState(
      sendPrms, '', setSnack, '集計用パラメータを送信しました。'
    );
  }
  if (!ls.loaded) return false;
  if (ls.error) return false;
  const url
    = 'https://docs.google.com/forms/d/e/'
    + '1FAIpQLSeNXLVwZHxWLgco-DvcboCPhIBac1nsumxZVNZh74PAIwMI9Q/'
    + 'viewform?usp=pp_url&'
    + `entry.790061844=${account.jino}&entry.477714010=${stdDate}`;

  return (
    <div>
      <a href={url} target='_blank'>
        <Button
          onClick={handleClick}
          color='primary' variant='contained'
        >
          データ取り込み
        </Button>
      </a>
    </div>
  )
}


// 口座振替ファイルの集計を行うgoogleフォームで使用する情報の送信を行い
// g formを起動する
export const ExcahngeTotalizeButton = () => {
  const allState = useSelector(state=>state);
  const classes = useStyles();
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const ls = comMod.getLodingStatus(allState);
  const {account, stdDate, hid, bid} = allState;
  const sendPrms = {
    date: stdDate, jino: account.jino,
    item: 'excangeTotalize', state:JSON.stringify(account)
  }
  const handleClick = async () => {
    await albCM.sendSomeState(
      sendPrms, '', setSnack, '集計用パラメータを送信しました。'
    );
  }
  if (!ls.loaded) return false;
  if (ls.error) return false;
  const url
    = 'https://docs.google.com/forms/d/e/'
    + '1FAIpQLSeOEq9bgjn1fBhZv2xJXJI3JttmL7QkqTqK_kMKLKESl3RalA/'
    + 'viewform?usp=pp_url&'
    + `entry.1271751265=${account.jino}&entry.824786232=${stdDate}`;

  return (
    <div style={{marginRight: 32}}>
      <a href={url} target='_blank'>
        <Button
          className={classes.excahngeTotalizeButton}
          onClick={handleClick}
          color='primary' variant='contained'
          startIcon={<CallMergeIcon/>}
        >
          口座振替集計
        </Button>
        <div style={{fontSize: '0.7rem', color: teal[800], paddingTop: 8}}>
          外部ツールが起動します。
        </div>
      </a>
    </div>
  )
}
// 戻るボタン
// propsで与えられたurlに戻る
// urlがないときはブラウザバックを試みる
// ブラウザバックできないときはルートに戻る
// 親コンポーネントはposition relativeである必要がある
export const GoBackButton = (props) => {
  const {url, posX, posY, fnc, style} = props;
  const classes = useStyles();
  const history = useHistory();
  const handleClick = () => {
    if (typeof fnc === 'function'){
      fnc()
    }
    else if (url){
      history.push(url);
    }
    else{
      history.goBack()
    }
  }
  const st = (!isNaN(posX) && !isNaN(posY))? {top: posY, left: posX}: {};
  const st2 = {...st, ...style};
  return (
    <div className={classes.goBackButton} style={st2}>
      <Button
        onClick={handleClick} startIcon={<ArrowBackIosRounded/>}
        tabIndex={-1}
      >
        戻る
      </Button>
    </div>
  )
}

export const UndeConstruction = () => {
  const history = useHistory()
  return (
    <div style={{marginTop: 120, marginLeft: 120}}>
      この機能は近日公開予定です。
      <Button
        variant='contained' color='secondary'
        onClick={()=>{history.goBack()}}
      >
        戻る
      </Button>
    </div>
  )
}
// comMod.setUisCookieを使うためのチェックボックス
// styleを指定すると表示の調整ができる
export const SetUisCookieChkBox = (props) => {
  const {p, label, setValue, style, reload} = props; // uisのポジションとラベル
  const classes = useStyles();
  const [checked, setChecked] = useState(comMod.getUisCookie(p) === '1');
  const handleChange = (ev) => {
    const v = ev.target.checked;
    setChecked(v);
    comMod.setUisCookie(p, v? '1': '0');
    if (typeof setValue === 'function'){
      setValue(v);
    }
    if (reload) {
      window.location.reload();
    }
  }
  
  return (
    <div className={classes.setUisCookieChkBoxRoot} style={style? style: {}}>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onClick={ev=>handleChange(ev)}
            color="primary"
          />
        }
        label={label}
      />
    </div>
  )
}

export const SetUisCookieRadioButtons = (props) => {
  const {p, formLabel="", radioLabels=[], setState, helperTexts} = props;
  const [value, setValue] = useState(comMod.getUisCookie(p) ?? "0");

  useEffect(() => {
    if(!comMod.getUisCookie(p)){
      comMod.setUisCookie(p, "0");
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setValue(val);
    if(p){
      comMod.setUisCookie(p, val);
    }
    if(typeof setState === 'function'){
      setState(val);
    }
  }

  const radios = radioLabels.map((label, i) => {
    const radioButtonValue = String(i);
    return(
      <FormControlLabel value={radioButtonValue} control={<Radio />} label={label} />
    )
  })

  return(
    <FormControl disabled={props.disabled}>
      {formLabel ?<FormLabel>{formLabel}</FormLabel> :null}
      <RadioGroup value={value} onChange={handleChange}>
        {radios}
      </RadioGroup>
      {helperTexts ?helperTexts.map(helperText => <FormHelperText>{helperText}</FormHelperText>) :null}
    </FormControl>
  )
}

// 印刷時に表示する事業所名など
export const DisplayInfoOnPrint = (props) => {
  const allState = useSelector(state=>state);
  const {com, service, classroom, serviceItems, users, stdDate} = allState;
  const classrooms = albCM.getAllClasrroms(users);
  const serviceStr = (service && serviceItems.length > 1)? service: '';
  const classroomStr = (classroom && classrooms.length > 1)? classroom: '';
  const svcAndCls = (serviceStr && classroomStr)
  ? serviceStr + ' / ' + classroomStr: serviceStr + classroomStr;
  const ym = stdDate.slice(0, 4) + '年' + stdDate.slice(5, 7) + '月 ';
  let style = {padding: '8px 0', fontSize: '.8rem'};
  if (props.style) style = {...style, ...props.style}
  const fomatedDate = comMod.formatDate(new Date(), 'YYYY-MM-DD');
  return (
    <div className='printOnly' style={style}>
      {ym + com.hname + ' ' + com.bname + ' ' + svcAndCls + ' ' + fomatedDate}
    </div>
  )
}

// オンライン確認するためのコンポーネント
// 普段はnullを返す
export const CheckOnline = () => {
  const [res, setRes] = useState(true);
  const checkOnline = async (res) => {
    const date = new Date();
    const timestamp = date.getTime();
    try {
      const r = await fetch(`/exist.txt?${timestamp}`);
      setRes(r);
    } catch {
      setRes(false);
      return false;
    }
    return true;
  };
  useInterval(()=>{
    checkOnline();
  }, 10000);
  // useEffect(()=>{
  //   console.log('checkOnline', res);
  // }, [res])
  const style = {
    position: 'fixed', background: orange[900], color: '#eee',
    padding: 16, top: '20vh', width: '80vw', left: '10vw', 
    textAlign: 'center', boxShadow: '0 0 5px #aaa',
    opacity: .8,
  }
  // return (
  //   <div style={style}>インターネット接続を確認して下さい。 </div>
  // )

  if (res === true || res.status === 200){
    return null;
  }
  else{
    return (
      <div style={style}>インターネット接続を確認して下さい。 </div>
    )
  }
}

export const Saikouchiku = (props) => {
  const classes = useStyles();
  const ref = useLocation().pathname;
  let dispNum = 1;
  if (ref.includes('contactbook')) dispNum = 2;
  if (ref.includes('workshift')) dispNum = 2;
  // if (!seagull) return null;
  
  return (
    <div className={classes.saikouchikuRoot} id='saikouchiku'> 
      {/* {`R2 事業再構築 機 - ${dispNum}`} */}
      {`R2 事業再構築`}
      {/* {`R5 事業再構築`} */}
      <br></br>
      ※事業再構築補助金事業以外での使用禁止
    </div>
  )
}

// 印刷時専用の事業再構築表示コンポーネント
export const SaikouchikuPrintOnly = (props) => {
  // const ref = useLocation().pathname;
  const style = {
    position: 'fixed',
    bottom: '10mm',
    right: '10mm',
    fontSize: '0.8rem',
    textAlign: 'center',
    padding: '5px',
    border: '1px solid #000',
    background: '#fff',
    // display: 'none',
    // '@media print': {
    //   display: 'block'
    // }
  };
  
  if (!seagull) return null;
  
  return (
    <div className="printOnly" style={style} id='saikouchikuPrint'> 
      {`R5 事業再構築`}
      <br></br>
      ※事業再構築補助金事業以外での使用禁止
    </div>
  )
}

// htmlレベルの初期値を設定する
// 今のところタイトルの設定を行う
export const InitSetHtml = () => {
  if (!document.title) document.title = albCM.defaultTitle;
  return null;
}

// 利用者情報編集ボタン
// UserEditNoDialogを起動する
// labelに空白文字を指定するとボタンのみにする？
export const EditUserButton = (props) => {
  const classes = useStyles();
  const hist = useHistory();
  const {uid, label, variant} = props;
  const uidn = albCM.convUid(uid).n;
  const newLoc = '/users/edit' + uidn;
  const handleClick = () => {
    hist.push(newLoc);
  }
  const l = label === undefined ? '利用者情報': label;
  const v = variant === undefined ? 'contained' : variant;
  const textButtonStyle = v === 'text'? 'textButtonStyle': '';
  return (
    <div className={classes.editUserRoot}>
      {label === '' &&
        <IconButton
          className='iconButton'
          onClick={handleClick}
        >
          <MoodIcon/>
        </IconButton>
      }
      {label !== '' &&
        <Button
          className={textButtonStyle} // variantがテキストのときだけ有効になるスタイル
          variant={v}
          startIcon={<MoodIcon/>}
          onClick={handleClick}
        >
          {l}
        </Button>
      }

    </div>
  )
}


