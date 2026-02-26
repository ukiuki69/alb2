import React, { useEffect, useState, useRef } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Dialog from '@material-ui/core/Dialog';
import AddBoxIcon from '@material-ui/icons/AddBox';
import * as comMod from '../../commonModule'
import * as albcm from '../../albCommonModule'
import { useDispatch, useSelector } from 'react-redux';
import * as mui from '../common/materialUi';
import * as Actions from '../../Actions';
import * as afp from '../common/AddictionFormParts';
import { makeStyles } from '@material-ui/core/styles';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import SchByUserMonthly from './SchByUserMonthly';
import { UpperLimitKanri } from './SchUpperLimit';
import { useHistory, Link, useLocation } from 'react-router-dom';
import red from '@material-ui/core/colors/red';
// import pink from '@material-ui/core/colors/pink';
// import purple from '@material-ui/core/colors/purple';
// import indigo from '@material-ui/core/colors/indigo';
// import cyan from '@material-ui/core/colors/cyan';
// import orange from '@material-ui/core/colors/orange';
// import brown from '@material-ui/core/colors/brown';
// import green from '@material-ui/core/colors/green';
// import deepPurple from '@material-ui/core/colors/deepPurple';
// import grey from '@material-ui/core/colors/grey';
// import amber from '@material-ui/core/colors/amber';
import teal from '@material-ui/core/colors/teal';
// import lightGreen from '@material-ui/core/colors/lightGreen';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';


import DateRangeIcon from '@material-ui/icons/DateRange';
import ScheduleIcon from '@material-ui/icons/Schedule';
import ListAltIcon from '@material-ui/icons/ListAlt';
import VerticalAlignTopIcon from '@material-ui/icons/VerticalAlignTop';
// import ClearAllIcon from '@material-ui/icons/ClearAll';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import CloseIcon from '@material-ui/icons/Close';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faYenSign } from "@fortawesome/free-solid-svg-icons";
import DialogTitle from '@material-ui/core/DialogTitle';
import blue from '@material-ui/core/colors/blue';
import grey from '@material-ui/core/colors/grey';
import { StdErrorDisplay } from '../common/commonParts';
import SnackMsg from '../common/SnackMsg';
import { NextUserDisp } from '../Users/UserDialog';
import { TrendingUp } from '@material-ui/icons';


// import { useStyles } from '../common/FormPartsCommon';
// import { Schedule } from '@material-ui/icons';
{/* <i class="fas fa-yen-sign"></i> */}
// import { faTwitter } from "@fortawesome/free-brands-svg-icons";
// import { faCoffee } from "@fortawesome/free-solid-svg-icons";


const useStyles = makeStyles({
  dialogRoot: {
    '& .MuiDialog-paperWidthSm': {maxWidth: 700},
  },
  listItem: {
    paddingLeft: 40, paddingLeft: 40,
    '& .icon': {marginInlineEnd: 8,}
  },
  dialogTitleRoot:{
    padding: '8px 16px',
    '& h2': {
      display:'flex',alignItems:'flex-end',justifyContent:'center',
      flexWrap:'wrap',
    },
    '& .title': {
      width: '90%', textAlign: 'center', padding: 4, paddingBottom: 0,
      fontSize: '.8rem', color: teal[500],
    },
    '& .small': {fontSize: '.8rem', padding: 4},
    '& .large': {fontSize: '1.3rem', padding: 4, paddingBottom: 0},
  },
  cntRow: {display: 'flex', flexWrap:'wrap', padding:8, }
});


// ユーザーごとの加算設定
// schByUserDialogに定義されているものとは別Componentにする。
const ByUserAddictionUS =(props)=>{
  const dispatch = useDispatch();
  const classes = useStyles();
  const {uid, handleClose} = props;
  const comAdic = useSelector(state => state.com.addiction);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const service = useSelector(state => state.service);
  const users = useSelector(state => state.users);
  const nextUsers = useSelector(state => state.nextUsers);
  const schedule = useSelector(state => state.schedule);
  const controleMode = useSelector(state=>state.controleMode);

  const UID = "UID" + uid;
  const thisUser = comMod.getUser(UID, users, nextUsers);
  const [res, setRes] = useState();
  const [snack, setSnack] = useState({msg:'', severity:''})
  const path = useLocation().pathname;
  // 今月のみの書き込みを行う場合の指定、usersにdispatch、データ送信を行うか否か
  const [thisMonthOnly, setThisMonthOnly] = useState(false);

  const handleSubmit = (e)=>{
    e.preventDefault();
    // スクロールを取得しておく
    const dSettingUserAriaScrolltop = document.querySelector('#usersRootScrollCnt').scrollTop;
    // 値が必要なエレメントを用意しておく
    const inputs = document.querySelectorAll('#yuj78sb input');
    const selects = document.querySelectorAll('#yuj78sb select');
    // フォームの値を取得
    const userAddiction = comMod.getFormDatas([inputs, selects]);
    // チェックボックスの体を使わないので削除
    delete userAddiction.thisMonthOnly;
    // users 既存のetc部分（json部分）にaddictionを追加
    const userEtc = {...thisUser.etc, addiction: userAddiction};
    const tuser = [...users];
    const i = tuser.findIndex(e=>e.uid === uid);
    // このオブジェクトを後でストアにディスパッチする
    tuser[i] = {...thisUser, etc:userEtc}; // store dispatch用
    // ユーザー情報のdb登録
    if (!thisMonthOnly){
      // 新しいコード
      const newThisUser = {...thisUser, date:stdDate, etc:{...userEtc}}
      const f = async () => {
        const r = await albcm.sendUser(newThisUser, '', '');
        if (r.data.result){
          setSnack({msg:'ユーザー情報を更新しました', severity: ''})
        }
        else{
          setSnack({msg:'ユーザー情報を更新できませんでした', severity: 'error'})
        }
      }
      f();
      // 新しいコード ここまで
      // この下は削除予定
      // const uPrms = {
      //   hid, bid, uid, date:stdDate, etc: JSON.stringify({...userEtc})
      // }
      // dispatch(Actions.sendUsersEtc(uPrms));
    }
    // スケジュールデータのユーザー別加算項目を取得
    let t = comMod.findDeepPath(schedule, [service, UID]);
    t = t? t: {};
    const u = {...t, ...userAddiction};
    const s = {...schedule};
    if (!s.hasOwnProperty(service))      s[service] = {};
    if (!s[service].hasOwnProperty(UID)) s[service][UID] = {};
    s[service][UID] = {...s[service][UID], addiction: userAddiction};
    // スケジュールデータとユーザデータをまとめてディスパッチ
    const usd = (thisMonthOnly)? {}: {users: tuser};
    s.timestamp = new Date().getTime();
    dispatch(Actions.setStore({schedule:s, ...usd}));
    // スクロール量をストア内に記述
    const v = {...controleMode};
    v.dSettingUserAriaScrolltop = dSettingUserAriaScrolltop;
    dispatch(Actions.setStore({controleMode: v}));
    // 遅延書き込み予約を行う --> 2021/11/11 行わず分割書き込み
    // comMod.setSchedleLastUpdate(dispatch, path);
    const partOfSch = {[service]: {}};
    partOfSch[service] = {...s[service]};
    partOfSch[service][UID] = {...s[service][UID]};
    const sndPrms = {hid, bid, date:stdDate, partOfSch};
    albcm.sendPartOfSchedule(sndPrms, setRes, setSnack);
    

    handleClose();
  }
  const cancelSubmit = ()=>{
    console.log('cancelSubmit');
    handleClose();
  }
  const handleChange = () =>{
    if (thisMonthOnly)  setThisMonthOnly(false);
    else setThisMonthOnly(true);
  }
  const buttonWrapperStyle = {display: 'flex', justifyContent: 'flex-end'}
  return (<>
    <form id = 'yuj78sb' className="addiction">
      <div className={classes.cntRow}>
        <afp.KobetsuSuport1 uid={UID} size='middle' dLayer={1} />
        <afp.KobetsuSuport2 uid={UID} size='middle' dLayer={1} />
        <afp.IryouCareJi uid={UID} size='middle' dLayer={1} />
        <afp.IryouRenkei uid={UID} size='middle' dLayer={1} />
        <afp.KankeiRenkei uid={UID} size='middle' dLayer={1} />
        <afp.KyoudoKoudou uid={UID} size='middle' dLayer={1} />
        <afp.JinkouNaiji uid={UID} size='middle' dLayer={1} />
        <afp.ShokujiTeikyou uid={UID} size='middle' dLayer={1} />
        <afp.Musyouka uid={UID} size='middle' dLayer={1} />
        {/* <afp.JougenKanri uid={UID} size='middle' dLayer={1} /> */}
        <afp.FukushiSenmonHaichi uid={uid} size='middle' dLayer={1} />
        <afp.JiShidouKaHai1 uid={UID} size='middle' dLayer={1} />
        <afp.KangoKahai uid={UID} size='middle' dLayer={1} />
        <afp.SenmonShien uid={UID} size='middle' dLayer={1} />
        <afp.TashiKeigen uid={UID} size='middle' dLayer={1} />

      </div>
      <div className={classes.cntRow}>
        <FormControlLabel
          control={
            <Checkbox
              checked={thisMonthOnly}
              onChange={handleChange}
              name={'thisMonthOnly'}
              color="primary"
            />
          }
          label='新しい月にこの変更を反映させない'
        />
      </div>
    </form>
      <div className='buttonWrapper' style={buttonWrapperStyle}>
        <NextUserDisp thisUser={thisUser} />
        <mui.ButtonGP
          color='secondary'
          label='キャンセル'
          onClick={cancelSubmit}
        />
        <mui.ButtonGP
          color='primary'
          label='送信'
          type="submit"
          onClick={handleSubmit}
        />
      </div>
  </>)
}


const ThisDialogContent = (props) => {
  const {handleClose, uid, setSnack} = props;
  const dispatch = useDispatch();
  const hist = useHistory();
  const users = useSelector(state=>state.users);
  const thisUser = comMod.getUser(uid, users);
  const classes = useStyles();
  const stdDate = useSelector(state=>state.stdDate);
  const allState = useSelector(state=>state);
  const {controleMode} = allState;
  const scheduleLocked = allState.schedule.locked;

  const titles = [
    {
      text:'利用者別加算設定',
      icon:<FontAwesomeIcon icon={faYenSign} />, color:teal[500], pi: 7,
      ndx: 0, scheduleLocked: false, // scheduleロック時に表示するか
    },
    // {
    //   text:'上限管理（管理事業所）',icon:<VerticalAlignTopIcon/>, color:teal[500],
    //   kanri_type: '管理事業所',
    //   ndx: 1,
    // },
    // {
    //   text:'上限管理（協力事業所）',icon:<VerticalAlignTopIcon/>, color:teal[500],
    //   kanri_type: '協力事業所',
    //   ndx: 2,
    // },
    {
      text:'利用者別予定',icon:<PersonAddIcon/>, color:teal[500],ndx:3, scheduleLocked: true,
    },
    {
      text:'閉じる',icon:<CloseIcon/>, color:red[500],ndx:4, scheduleLocked: true,
      close: 'close',
    },
  ];
  const [menuIndex, setMenuIndex] = useState(-1);
  const handleClick = (ev) => {
    const i = ev.currentTarget.getAttribute('ndx');
    const close = ev.currentTarget.getAttribute('close');
    setMenuIndex(parseInt(i));
    // 利用者別予定へ
    if (parseInt(i) === 3){
      hist.push('/schedule/users/' + uid + '/')
    }else if(parseInt(i) === 0){
      // スクロールを取得しておく
      const dSettingUserAriaScrolltop = document.querySelector('#usersRootScrollCnt').scrollTop;
      // スクロール量をストア内に記述
      const v = {...controleMode};
      v.dSettingUserAriaScrolltop = dSettingUserAriaScrolltop;
      // dispatch(Actions.setStore({controleMode: v}))
      //利用者別加算設定へ
      sessionStorage.setItem("byUserAddictionNoDialogUid", uid);
      sessionStorage.setItem("byUserAddictionNoDialogScrollVal", String(dSettingUserAriaScrolltop));
      sessionStorage.setItem("byUserAddictionNoDialogIdName", "usersRootScrollCnt");
      hist.push(`/schedule/userAddiction`);
    }
    if (close) handleClose();
  }
  // useEffect(()=>{
  //   if (titles.length -1 === menuIndex){
  //     handleClose();
  //   }
  // }, [menuIndex]);
  const menuList = titles.map((e, i)=>{
    if (!e.scheduleLocked && scheduleLocked) return null;
    const iconStyle = {color: e.color};
    // font awesomeのアイコン幅調整
    if (e.pi){
      iconStyle.paddingInline = e.pi;
      iconStyle.paddingInline = e.pi;
    }
    // ユーザの管理タイプによって表示を制御する
    if (!e.kanri_type || e.kanri_type === thisUser.kanri_type){
      return(
        <ListItem 
          button key={i} className={classes.listItem} 
          onClick={(ev)=>handleClick(ev)} ndx={e.ndx} close={e.close}
        >
          <span className='icon' style={iconStyle}>{e.icon}</span>
          <span className='text'>{e.text}</span>
        </ListItem>
      )
    }
    else{
      return null;
    }
  });
  const dialogTitle = (menuIndex === -1 || !titles[menuIndex]) ? 
  '利用者別設定メニュー': titles[menuIndex].text;
  return (<>
    <DialogTitle className={classes.dialogTitleRoot}>
      <div className='title'>{dialogTitle}</div>
      <div className='small'>
        {stdDate.split('-')[0]}年{stdDate.split('-')[1]}月
      </div>
      <div className='large'>
        {thisUser.name}
      </div>
      <div className='small'>
        {thisUser.ageStr}
      </div>

    </DialogTitle>
    {menuIndex === -1 &&
      <List>{menuList}</List>
    }
    {menuIndex === 0 && !scheduleLocked &&
      <ByUserAddictionUS uid={uid} handleClose={handleClose} />
    }
    {(menuIndex === 1 && thisUser.kanri_type === '管理事業所') && 
      <UpperLimitKanri 
        uid={uid} close={handleClose} specifyType={0} setSnack={setSnack}
      />
    }
    {(menuIndex === 2 && thisUser.kanri_type === '協力事業所') &&
      <UpperLimitKanri 
        uid={uid} close={handleClose} specifyType={1} setSnack={setSnack}
      />
    }
  </>);
}


const SchUserSettingDialog = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {open, setOpen, uid ,} = props;
  const handleClose=()=>{setOpen(false)};
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const dcProps = {handleClose, uid, setSnack};
  // ダイアログがdispatch型のSnackを使っているためこちらでもsetSnackでdispatchする
  useEffect(()=>{
    return(()=>{
      const closed = !document.querySelector('#nodeExist7451');
      setTimeout(() => {
        if (closed && snack.msg){
          dispatch(Actions.setSnackMsg({snack}));
        }
      }, 200); // タイムアウト長め
    })
  }, [snack]);
  return (<>
    <Dialog 
      open={open} onClose={handleClose} 
      aria-labelledby="SchUserSettingDialog"
      className={classes.dialogRoot}
    >
      <ThisDialogContent {...dcProps}/>
    </Dialog>
    <div id='nodeExist7451' />
  </>)
}

export default SchUserSettingDialog;