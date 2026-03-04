import React, {useEffect, useState} from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector, /*useSelector,*/ } from 'react-redux';
import { useHistory, useLocation, } from 'react-router-dom';
import * as Actions from './Actions'
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/MoveToInbox';
import MailIcon from '@material-ui/icons/Mail';
import MenuIcon from '@material-ui/icons/Menu';
import BugReportIcon from '@material-ui/icons/BugReport';
import CalendarTodayIcon from '@material-ui/icons/CalendarToday';
import MoodIcon from '@material-ui/icons/Mood';
import TuneIcon from '@material-ui/icons/Tune';
import DescriptionIcon from '@material-ui/icons/Description';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import SendIcon from '@material-ui/icons/Send';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import ReceiptIcon from '@material-ui/icons/Receipt';
import InfoIcon from '@material-ui/icons/Info';
import CloseIcon from '@material-ui/icons/Close';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faTwitter } from "@fortawesome/free-brands-svg-icons";
// import { faCalendar } from "@fortawesome/free-regular-svg-icons";
// import { faCoffee } from "@fortawesome/free-solid-svg-icons";
import { faCalendarAlt } from "@fortawesome/free-regular-svg-icons";
import { faPenSquare, faUserEdit } from '@fortawesome/free-solid-svg-icons';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';

import { Link } from 'react-router-dom';
import { InsertInvitationOutlined } from '@material-ui/icons';
import teal from '@material-ui/core/colors/teal';
import blue from '@material-ui/core/colors/blue';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import * as comMod from './commonModule'; 
import FilterVintageIcon from '@material-ui/icons/FilterVintage';
import { hidsForCustom } from './component/Custom/Custom';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import EventNoteIcon from '@material-ui/icons/EventNote';
import { Snackbar, useMediaQuery } from '@material-ui/core';
import { KeyListener } from './component/common/KeyListener';
import { grey, red, orange } from '@material-ui/core/colors';
import Tooltip from '@material-ui/core/Tooltip';
import AssignmentIcon from '@material-ui/icons/Assignment';
import AssessmentIcon from '@material-ui/icons/Assessment';
import ListAltIcon from '@material-ui/icons/ListAlt';
import NoteIcon from '@material-ui/icons/Note';
import AssistantIcon from '@material-ui/icons/Assistant';
import { seagull } from './modules/contants';
import Rev from './Rev';
import { usePlanExpiry } from './component/plan/usePlanExpiry';
import { useSideToolBarVisibility } from './modules/uiEvents';

const LIMIT500px_MENUITEMS = ["連絡帳", "予定実績登録", "日報", "設定", "支援計画"];

// fontAWESOMEアイコンのスタイル
const iconStyle = { padding: 0, fontSize: 22, marginRight: 8, marginLeft: 2,};

const useStyles = makeStyles({
  shortCutSnack: {
    '& .MuiSnackbarContent-root':{
      textAlign: 'center', color: '#333',
      background: grey[100],
      '& .MuiSnackbarContent-message': {margin:'0 auto'},
    },
  },
  shortCutSnackContent: {
    textAlign: 'center', color: '#333', background: grey[100],
    padding: '16px 24px', boxShadow: '0 2px 4px #666',
    borderRadius: 4, lineHeight: 1.6, fontSize: '.9rem',
    '& .test': {fontSize: '.7rem', color: blue[600]}
  },
  list: {
    width: 250,
    ' & .MuiList-padding': {
      paddingTop: 4,
      paddingBottom: 4,
    },
    ' & .MuiListItemText-root': {
      marginTop: 0,
      marginBottom: 0,
    },
  },
  fullList: {
    width: 'auto',
  },
  root:{
    width:40,
    ' & .MuiButton-text': {padding: 0,color: '#eee',},
    ' & .MuiButton-label': {display: 'block',},
    ' & .MuiButton-root': {minWidth: 40,},
  },
  devider:{marginTop: 8,marginBottom: 8,},
  sideToolBarRoot: {
    background: '#fff',
    overflow: 'hidden',
    zIndex: 900,
    position: 'fixed', 
    top: 92, 
    left: 0, 
    width: 61.25,
    borderBottomRightRadius: 4, borderTopRightRadius: 4,
    paddingBottom: 8, paddingTop: 8, 
    boxShadow: '0 0 0 0 transparent', // 初期値を設定
    // 幅とボックスシャドウのアニメーションを設定
    transition: 'width 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
    '&:hover': {
      width: 200,
      boxShadow: '0 2px 8px #999', // ホバー時のボックスシャドウ
      '& .MuiListItemText-root': {
        opacity: 1,
      }
    },
    '& .MuiList-root': {
      width: 196, padding: 2,
    },
    '& .MuiListItemText-root':{
      opacity: 0, // 通常時のリストの透明度
      color: '#333',
      transition: 'opacity 0.3s ease-in-out', // 透明度の変更にアニメーションを適用
    },
    '& .MuiListItemIcon-root': {
      minWidth: 'initial',
      color: teal[500],
      width: 32,
    },
    "@media (max-width:959px)": {
      display: 'none',
    },
  },
  disableHover: {
    '&:hover': {
      width: 61.25, // ホバー時の幅を元に戻す
      '& .MuiListItemText-root': {
        opacity: 0, // ホバー時のリストの透明度を元に戻す
      }
    }
  },
  itemsRoot: {
    ' & .MuiListItemIcon-root':{color:teal[500],},
  },
  betaBadge: {
    fontSize: '0.7rem',
    lineHeight: 1,
    color: '#ff9800',
    border: '1px solid #ff9800',
    borderRadius: 2,
    padding: '0 2px',
    paddingTop: .2,
    marginLeft: 4,
    verticalAlign: 'middle',
    display: 'inline-block',
    transform: 'scaleX(0.85)',
    letterSpacing: '-0.05em',
  },
});

const PlanMenuIcon = () => {
  const expiryData = usePlanExpiry();
  const cur  = expiryData.currentMonth.length;
  const next = expiryData.nextMonth.length;
  let color;
  if (cur  > 0) color = red[500];
  else if (next > 0) color = orange[500];

  const icon = (
    <FontAwesomeIcon icon={faUserEdit}
      style={{ ...iconStyle, ...(color ? { color } : {}) }} />
  );
  if (!cur && !next) return icon;
  return (
    <Tooltip placement="right" title={
      <div>
        {cur  > 0 && <div>当月期限 {cur}件</div>}
        {next > 0 && <div>翌月期限 {next}件</div>}
      </div>
    }>
      <span>{icon}</span>
    </Tooltip>
  );
};

const menuItemsNormal = [
  { 
    label: '利用者情報', link: '/users', icon: <MoodIcon /> ,p: 70, shortcut: 'u',
    id: 'menuitem-user', shortLabel: '利用者'
  },
  // { label: '予実績登録', link: '/schedule', icon: <CalendarTodayIcon /> },
  { 
    label: '予定実績登録', link: '/schedule', shortcut: 's',
    icon: <FontAwesomeIcon icon={faCalendarAlt} style={iconStyle} /> ,p: 60,
    id: 'menuitem-schedule', shortLabel: '予定実績'

  },
  { 
    label: '帳票', link: '/reports', icon: <DescriptionIcon /> ,p: 70, shortcut: 'r',
    id: 'menuitem-reports', shortLabel: '帳票'
  },
  { 
    label: '売上管理', link: '/proseed', icon: <TrendingUpIcon /> ,p: 90, shortcut: 'p',
    id: 'menuitem-proseed', shortLabel: '売上'
  },
  { 
    label: '日報', link: '/dailyreport' , shortcut: 'd',
    icon: <FontAwesomeIcon icon={faPenSquare} style={iconStyle} /> ,p:60,
    id: 'menuitem-proseed', shortLabel: '日報'
  },

  {
    label: '設定', link: '/setting', icon: <TuneIcon /> ,p: 90, shortcut: 'c',
    id: 'menuitem-setting', shortLabel: '設定'
  },
  {
    label: '請求処理', link: '/billing', icon: <SendIcon /> ,p: 90, shortcut: 'b',
    id: 'menuitem-billing', shortLabel: '請求'
  },
  { 
    label: '連絡帳', link: '/contactbook', icon: <MenuBookIcon /> ,p: 50, shortcut: 'o',
    id: 'menuitem-contactbook', shortLabel: '連絡帳'
  },
  {
    label: '支援計画', link: '/plan/manegement',p: 80, shortcut: 'l',
    icon: <PlanMenuIcon />,
    id: 'menuitem-plan', shortLabel: '計画',
    isBeta: true
  },
  { 
    label: 'シフト', link: '/workshift', icon: <EventNoteIcon /> ,p: 90, shortcut: 'f',
    // hidStr: 'LE5MMsTF,YhR67Piz,vFbM8PgT',
    id: 'menuitem-workshift', shortLabel: 'シフト'
  },
  {
    label: 'アカウント', link: '/account', icon: <AccountCircleIcon /> ,p: 90, shortcut: 'a',
    id: 'menuitem-account', shortLabel: 'アカウ…'
  },
  { 
    label: 'カスタム', link: '/custom', icon: <FilterVintageIcon/>, p: 60,
    hids: hidsForCustom,
    id: 'menuitem-custom', shortLabel: 'カス'
  },

  {
    label: 'テスト用', link: '/test', icon: <BugReportIcon /> ,p: 100, shortcut: 't',
    id: 'menuitem-test', shortLabel: 'テスト'
  },
];

const menuItemsSeagull = [
  { 
    label: '利用者情報', link: '/users', icon: <MoodIcon /> ,p: 70, shortcut: 'u',
    id: 'menuitem-user'
  },
  { 
    label: '支援計画', link: '/plan/assessment', icon: <AssessmentIcon /> ,p: 70, shortcut: 'k',
    id: 'menuitem-plan'
  },
  { 
    label: '帳票', link: '/reports/usersplan', icon: <DescriptionIcon /> ,p: 70, shortcut: 'r',
    id: 'menuitem-reports'
  },
  {
    label: 'テスト用', link: '/test', icon: <BugReportIcon /> ,p: 100, shortcut: 't',
    id: 'menuitem-test'
  },
];
export const menuItems = seagull? menuItemsSeagull: menuItemsNormal;

export const ShortCutNotice = ({msg, setMsg}) => {
  const [snack, setSnack] = useState({open: false, msg: ''});
  const classes = useStyles();
  useEffect(()=>{
    if (msg){
      setSnack({open: true, msg});
    }
    else{
      setSnack({open: false, msg: ''});
    }
  }, [msg]);
  const handleClose = () =>{
    setSnack({...snack, open: false, msg: ''});
    setMsg('');
  }
  const Children = () => {
    return (<>
      <div className={classes.shortCutSnackContent}>
        <div>{snack.msg}</div>
        {/* <div className='test'>キーボードメニュー操作はテスト実装中です</div> */}
      </div>
    </>)
  }
  return(
    <Snackbar
      className={classes.shortCutSnack}
      anchorOrigin={{ vertical: 'bottom', horizontal:'center'}}
      autoHideDuration={2000}
      open={snack.open}
      onClose={handleClose}
      // message={snack.msg}
      children={<Children/>}
      // key={new Date().getTime()}
    >
    </Snackbar>
  )
}

// メニュー用にキーリスナーを起動する
// ショートカットキーとlinkのセットを受け取る menuitemそのままでもok
// shortCutLinkSetにはやっぱラベルも必要
const MenuKeysListener = ({shortCutLinkSet, setDrowerOpen}) => {
  const [keyInfo, setKeyInfo] = useState({
    key: '', shift: false, ctrl: false, meta: false,
  });
  const [msg, setMsg] = useState('');
  const history = useHistory();
  useEffect(()=>{
    const {key, shift, ctrl, meta} = keyInfo;
    if (!shift && !ctrl && !meta){
      const t = shortCutLinkSet.find(e=>e.shortcut === key.toLowerCase());
      if (t && t.link){
        history.push(t.link);
        setDrowerOpen(false);
        setMsg(t.shortcut.toUpperCase() + ' ' + t.label);
      }
    }
    // 拡張キー設定によるショートカット
    if (shift && parseInt(comMod.getUisCookie(comMod.uisCookiePos.useExtraShortCutKey))){
      if (key.toLowerCase() === 'h'){
        history.push('/');
      }
      if (key.toLowerCase() == 'a'){
        history.push('/Account/ch')
      }
    }
  }, [keyInfo, history, ])
  return (<>
    <KeyListener setKeyInfo={setKeyInfo} />
    <ShortCutNotice msg={msg} setMsg={setMsg} />
  </>)
}

export const SideToolBar = () =>{
  const classes = useStyles();
  const hist = useHistory();
  const ref = useLocation().pathname;
  const dispatch = useDispatch();
  const account = useSelector(state=>state.account);
  const {hid} = account;
  const [permission, setPermission] = useState(0);
  const strageName = 'sideToolBarLastClicked';
  const sidebarVisible = useSideToolBarVisibility();
  // クリック後、ホバー状態を無効にする
  // const [disableHover, setDisableHover] = useState(false);
  const [isHoverDisabled, setIsHoverDisabled] = useState(true);

  const limit959px = useMediaQuery("(max-width:959px)");

  // ホバーを無効にする秒数
  const disableHoverTime = 3000;
  useEffect(()=>{
    setPermission(comMod.parsePermission(account)[0][0]);
  },[account]);
  
  useEffect(() => {
    const f = () => {
      const lastClickTime = localStorage.getItem(strageName);
      if (lastClickTime && (Date.now() - parseInt(lastClickTime) < disableHoverTime)) {
        setIsHoverDisabled(true);
      } else {
        setIsHoverDisabled(false);
      }
    }
    f();

    const interval = setInterval(() => {
      f();
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  const handleLogout = () => {
    dispatch(Actions.clearAcount());
  }
  const handleClick = (e, fMenuItems) => {
    const i = parseInt(e.currentTarget.getAttribute('index'));
    if (!fMenuItems[i].link) {
      return false;
    }
    localStorage.setItem(strageName, Date.now().toString());
    // setTimeout(() => {
    //   setDisableHover(false); // 2秒後にホバーを再度有効にする
    // }, disableHoverTime);

    hist.push(fMenuItems[i].link);
  }
  // パーミッションによる表示制限
  // hidによる制限追加 2023/01/04
  const fMenuItems = menuItems.filter(e=>e.p<=permission)
  .filter(e=>(!e.hidStr || e.hidStr.split(',').includes(hid)));
  const items = fMenuItems.map((e, i) => {
    if (e.hids && !e.hids.includes(hid)){
      return null;
    }
    return (
      <List key={i} /*title={menuItems[i].label}*/>
        <ListItem button index={i} onClick={(e) => handleClick(e, fMenuItems)} id={e.id}>
          <ListItemIcon>{e.icon}</ListItemIcon>
          <ListItemText>
            {e.label}
            {e.isBeta && <span className={classes.betaBadge}>BETA</span>}
            {' ' + e.shortcut.toLocaleUpperCase()}
          </ListItemText>
        </ListItem>
      </List>
    )
  });

  // 画面幅が960px未満（スマホ表示）の場合非表示
  if(limit959px) return null;

  // rootだとメニューは返さない
  // seagullは返す
  if (!seagull && ref === '/') return null;
  if (seagull) return null;

  // ダイアログ等の表示要求により非表示
  if (!sidebarVisible) return null;
  const hoverControleClass = isHoverDisabled ? classes.disableHover: '';
  return (
    <div className={`${classes.sideToolBarRoot} ${hoverControleClass} sideToolBar`}>
      {items}
      <List  title='ログアウト'>
        <ListItem button onClick={handleLogout} >
          <ListItemIcon><ExitToAppIcon /> </ListItemIcon>
          <ListItemText>
            ログアウト
          </ListItemText>
        </ListItem>
      </List>
    </div>
  )
}

export default function DrowerMenu() {
  const classes = useStyles();
  const limit500px = useMediaQuery("(max-width:500px)");
  const hist = useHistory();
  const dispatch = useDispatch();
  const [open, setopen] = useState(false);
  const account = useSelector(state=>state.account);
  const {hid} = account;
  const [permission, setPermission] = useState(0);
  useEffect(()=>{
    setPermission(comMod.parsePermission(account)[0][0]);
  },[account]);

  const handleLogout = () => {
    dispatch(Actions.clearAcount());
  }

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }

    setopen(open);
  };

  const handleClick = (e) =>{
    // e.preventdefault();
    const tmenu = menuItems.filter(e=>e.p<=permission);
    const i = parseInt(e.currentTarget.getAttribute('index'));
    if (!tmenu[i].link){
      return false;
    }
    hist.push(tmenu[i].link);
  }

  const ItemList = () => {
    const items = menuItems.filter(e=>e.p<=permission).map((e, i)=>{
      if (e.hids && !e.hids.includes(hid)){
        return null;
      }

      // スマホ表示用
      if(limit500px){
        if(!LIMIT500px_MENUITEMS.includes(e.label)) return null;
        if(e.label==="予定実績登録"){
          e.link = "/schedule/daily";
        }
        if(e.label === "設定"){
          e.link = "/setting/others";
        }
      }

      return(
        <List key = {i} className={classes.itemsRoot} >
          {/* <Link className='menuItem' to={e.link}> */}
            <ListItem button index={i} onClick={(e)=>handleClick(e)} id={e.id}>
              <ListItemIcon>{e.icon}</ListItemIcon>
              <ListItemText>
                {e.label}
                {e.isBeta && <span className={classes.betaBadge}>BETA</span>}
                {' ' + e.shortcut.toLocaleUpperCase()}
              </ListItemText>
            </ListItem>
          {/* </Link> */}
        </List>
      )
    });
    return(
      <div
        className={classes.list + ' drowerMenu'}
        role="presentation"
        onClick={toggleDrawer(false)}
        onKeyDown={toggleDrawer(false)}
      >
        <List  >
          <ListItem button >
            <ListItemIcon><CloseIcon color='secondary' /> </ListItemIcon>
            <ListItemText>
              メニューを閉じる
            </ListItemText>
          </ListItem>
        </List>
        {items}
        <Divider className={classes.devider} />
        <List  >
          <ListItem button onClick={handleLogout} >
            <ListItemIcon><ExitToAppIcon/> </ListItemIcon>
            <ListItemText>
              ログアウト
            </ListItemText>
          </ListItem>
        </List>
        <Divider className={classes.devider}/>
        <List>
          <ListItem >
            <ListItemIcon><InfoIcon /> </ListItemIcon>
            <ListItemText>
              <Rev />
            </ListItemText>
          </ListItem>
        </List>
      </div>
    )
  }
  const fMenuItems = menuItems.filter(e=>e.p<=permission)
  .filter(e=>(!e.hidStr || e.hidStr.split(',').includes(hid)));

  return (
    <div className={classes.root + ' drowerButton'} >
      <Button 
        onClick={toggleDrawer(true)}
      >
        <MenuIcon/>
      </Button>
      <Drawer anchor='left' open={open} onClose={toggleDrawer(false)}>
        <ItemList/>
      </Drawer>
      <MenuKeysListener shortCutLinkSet={fMenuItems} setDrowerOpen={setopen} />
    </div>
  );
}
