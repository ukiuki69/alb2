import React, { useEffect, useState, useRef } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Dialog from '@material-ui/core/Dialog';
import AddBoxIcon from '@material-ui/icons/AddBox';
import * as comMod from '../../commonModule';
import * as albcm from '../../albCommonModule';
import { useDispatch, useSelector } from 'react-redux';
import * as mui from '../common/materialUi';
import * as Actions from '../../Actions';
import * as afp from '../common/AddictionFormParts';
import { makeStyles } from '@material-ui/core/styles';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import SchByUserMonthly from './SchByUserMonthly';
import { UpperLimitKanri } from './SchUpperLimit';
import { useHistory } from 'react-router-dom';
import red from '@material-ui/core/colors/red';
import MoodIcon from '@material-ui/icons/Mood';
import { didPtn } from '../../modules/contants';
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

import DateRangeIcon from '@material-ui/icons/DateRange';
import ScheduleIcon from '@material-ui/icons/Schedule';
import ListAltIcon from '@material-ui/icons/ListAlt';
import VerticalAlignTopIcon from '@material-ui/icons/VerticalAlignTop';
// import ClearAllIcon from '@material-ui/icons/ClearAll';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faCalendarPlus } from "@fortawesome/free-regular-svg-icons";
import { faYenSign } from "@fortawesome/free-solid-svg-icons";
import { useStyles } from '../common/FormPartsCommon';
import { SetTemplateAutoSave } from '../common/StdFormParts';
import ByUserAddictionNoDialog from './ByUserAddictionNoDialog';
// import { Schedule } from '@material-ui/icons';
{/* <i class="fas fa-yen-sign"></i> */}
// import { faTwitter } from "@fortawesome/free-brands-svg-icons";
// import { faCoffee } from "@fortawesome/free-solid-svg-icons";
const titles = [
  '利用者別設定メニュー',
  '利用者別月次日程入力',
  '利用者別加算設定',
  '開始終了時間一括入力',
  '利用者別一覧入力',
  '上限管理(管理事業所)',
  '上限管理(協力事業所)',
  '利用者の予定全削除',
];

const useLocalStyle = makeStyles({
  root :{
    '& .MuiDialog-paperWidthSm':{
      minWidth:100,
      maxWidth:700,
    },
    '& .formSubTitle':{
      alignItems: 'flex-end',
      paddingLeft: 8, paddingRight:8,
      '& .user':{
        fontSize: '1.2rem',
      }
    }
  },
  faIcon:{
    padding: 0, fontSize: 22, 
    width: 24, textAlign: 'center', display: 'inline-block',
    color:teal[500],
  },
  iconNormal :{
    color:teal[500],
    marginInlineEnd: '4px',
  },
  iconWarning :{
    color:red[400],
    marginInlineEnd: '4px',
  },
});

const MenuList = (props)=>{
  const hist = useHistory();
  // 2022/01/18 MTU対策
  const users = useSelector(state=>state.users);
  const classroom = useSelector(state=>state.classroom);
  const thisUser = comMod.getUser(props.uid, users);
  const isMtu = albcm.classroomCount(thisUser) > 1;
  const allState = useSelector(state=>state);
  const scheduleLocked = allState.schedule.locked;


  const localCls = useLocalStyle();
  const clickHandler = (n)=>{
    if(n === 4){
      hist.push(`/schedule/listinput/peruser/${thisUser.uid}/`);
      return;
    }
    props.setcontentNdx(n);
  }
  
  const {kanriType, thisUsersSchCnt, ...others} = props;  
  return(
    <>
      <List>
        {!(isMtu && !classroom) && !scheduleLocked && 
          <ListItem button className='listItem'
            onClick={() => clickHandler(1)}
            key={1}
          >
            <span className={localCls.iconNormal}>
              <DateRangeIcon />
            </span>
            <span className='text'>{titles[1]}</span>
          </ListItem>
        }
        <ListItem button className='listItem'
          onClick={() => clickHandler(2)}
          key={2}
        >
          <span className={localCls.faIcon} >
            <FontAwesomeIcon icon={faYenSign} />
          </span>

          <span className='text'>{titles[2]}</span>
        </ListItem>
        {/* {props.thisUsersSchCnt > 0 &&
          <ListItem button className='listItem'
            onClick={() => clickHandler(3)}
            key={3}
          >
            <span className={localCls.iconNormal}>
              <ScheduleIcon />
            </span>
            <span className='text'>{titles[3]}</span>
          </ListItem>
        } */}
        {props.thisUsersSchCnt > 0 && !scheduleLocked &&
          <ListItem button className='listItem'
            onClick={() => clickHandler(4)}
            key={4}
          >
            <span className={localCls.iconNormal}>
              <ListAltIcon />
            </span>
            <span className='text'>{titles[4]}</span>
          </ListItem>
        }

        {/* 別のURLにジャンプするここだけ処理が違う 
        タイトルも配列からは拾わない*/}
        <ListItem button className='listItem'
          onClick={() => {
            hist.push('/schedule/users/' + props.uid + '/')
          }}
          key={100}
        >
          <span className={localCls.iconNormal}>
            <PersonAddIcon />
          </span>

          <span className='text'>利用者別予定へ</span>
        </ListItem>
        {/* ここも配列は使わない */}
        <ListItem button className='listItem'
          onClick={() => {
            hist.push('/users/edit' + albcm.convUid(props.uid).n)
          }}
          key={101}
        >
          <span className={localCls.iconNormal}>
            <MoodIcon />
          </span>

          <span className='text'>利用者情報</span>
        </ListItem>


        {thisUsersSchCnt > 0 && ((isMtu && classroom) || (!isMtu)) && !scheduleLocked &&
          <ListItem button className='listItem'
            onClick={() => clickHandler(7)}
            key={7}
          >
            <span className={localCls.iconWarning}>
              <DeleteForeverIcon />
            </span>

            <span className='text'>{titles[7]}</span>
          </ListItem>
        }

      </List>
    </>
  )
}
// ダイアログを消す前にメニューリストが一瞬表示されてしまうのを防ぐ
const hideMenuList = () => {
  const target = document.querySelector('.schDialog');
  target.style.cssText = 'opacity:0;';
}


// ユーザーごとの加算設定
const ByUserAddiction =(props)=>{
  const {date, schedule, users, service, dispatch} = props.prms;
  const {
    sch, transfer, setTransfer, setSnack, /*userCh, setUserCh, */
    userAddiction, setUserAddiction
  } = props;
  const comAdic = useSelector(state => state.com.addiction);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const uid = props.uid;
  const UID = "UID" + uid;
  const thisUser = comMod.getUser(UID, users);
  const [res, setRes] = useState();

  // ユーザー情報の更新
  // この処理をsubmitでやるとComponentがdismountされる。
  // ここでやってもどうかなー -> だめ 
  // useEffect(()=>{
  //   return () => {
  //     // ユーザーの方にも登録。これを先にやっちゃうとschがscheduleに更新されない。
  //     dispatch(Actions.setUsersEtc(uid, userEtc));
  //     // db登録
  //     const prms = {
  //       hid, bid, uid, etc: JSON.stringify({...userEtc})
  //     }
  //     dispatch(Actions.sendUsersEtc(prms));
  //   }
  // })

  const handleSubmit = (e)=>{
    e.preventDefault();
    const did = comMod.convDid(date);
    // 値が必要なエレメントを用意しておく
    const inputs = document.querySelectorAll('#yuj78sb input');
    const selects = document.querySelectorAll('#yuj78sb select');
    // フォームの値を取得
    const userAddiction = comMod.getFormDatas([inputs, selects]);
    // usersにdispatch 既存のetc部分（json部分）にaddictionを追加
    // let userEtc = Object.assign({}, thisUser.etc);
    // userEtc = Object.assign({}, { addiction: userAddiction });
    // 利用者別月次項目への登録 local stateにセット
    const userEtc = {...thisUser.etc, addiction: userAddiction};
    const t = {...sch, ...userEtc};
    // 中間stateに情報格納。あとから上位stateにdispatchする。
    setTransfer({...t, close: true}); // クローズ用のフラグを付加する
    // const suPrms = {hid, bid, date: stdDate, uid: UID, schedule: t, }
    // comMod.sendUsersSchedule(suPrms, setRes, setSnack, thisUser.name);
  }
  const cancelSubmit = ()=>{
    console.log('cancelSubmit');
    props.close();
  }
  return (<>
    <form id = 'yuj78sb' className="addiction">
      {/* <afp.KobetsuSuport uid={UID} size='middle' dLayer={0} /> */}
      <afp.KobetsuSuport1 uid={UID} size='middle' dLayer={0} />
      <afp.KobetsuSuport2 uid={UID} size='middle' dLayer={0} />
      <afp.IryouCareJi uid={UID} size='middle' dLayer={0} />
      <afp.IryouRenkei uid={UID} size='middle' dLayer={0} />
      <afp.KankeiRenkei uid={UID} size='middle' dLayer={0} />
      <afp.KyoudoKoudou uid={UID} size='middle' dLayer={0} />
      {/* <afp.JougenKanri uid={UID} size='middle' dLayer={1} />g */}
    </form>
      <div className='buttonWrapper'>
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

const UserSchClear = (props) =>{
  const { 
    uid, thisUsersSchCnt, thisUsersSch, sch, setSch, close, 
    setSnack, ...others
  } = props;
  const users = useSelector(state=>state.users);
  const thisUser = comMod.getUser(uid, users);
  const userName = thisUser.name;
  const dispatch = useDispatch();
  const UID = comMod.convUID(uid).str;
  const usch = (sch)? sch: thisUsersSch;
  let uschCnt = Object.keys(usch).filter(e=>e.indexOf('D2') === 0).length;
  const hid = useSelector(state=>state.hid);
  const bid = useSelector(state=>state.bid);
  const classroom = useSelector(state=>state.classroom);
  const stdDate = useSelector(state=>state.stdDate);
  const isMtu = albcm.classroomCount(thisUser) > 1;
  // MTU対応 2022/01/18
  // MTUの場合のスケジュールをカウントする
  uschCnt = 0;
  const dids = Object.keys(usch).filter(e => e.match(didPtn));
  dids.forEach(e => {
    if ((!isMtu || usch[e].classroom === classroom) && !usch[e].useResult){
      uschCnt++
    }
  });

  const setRes = () => null;
  const handleSubmit = () =>{
    // 該当スケジュールから日付のキーを取り出す
    if (!dids.length) {
      return false;
    }
    else {
      if (sch){
        const t = {...sch};
        dids.map(e=>{
          if ((!isMtu || classroom === t[e].classroom) && !usch[e].useResult){
            delete t[e];
          }
        });
        // partofdataがコールされないようにする
        delete t.modDid;
        if (Object.keys(t).length === 0){
          t.deleted = new Date().toLocaleString('sv-SE').replace(' ', 'T');
        }
        setSch(t);
        const sendPrms = {
          uid: UID, hid, classroom, date: stdDate, schedule: t 
        }
        // comMod.sendUsersSchedule(sendPrms, setRes, setSnack, userName);
      }
      else {
        dids.map(did=>{
          dispatch(Actions.removeSchedule(UID, did, ''))
        });  
      }
    }
    albcm.setRecentUser(UID);
    close();
  }
  const cancelSubmit = () => {
    close();
  }
  
  const msg = uschCnt? 
  thisUser.name + 'さんの' + uschCnt + '件のスケジュールを削除します。':
  `${thisUser.name}さんの未確定のスケジュールがないので削除できません。`
  const style = {padding: '16px 16px'}
  return(<>
    <div style={style}>{msg}</div>
    <div className='buttonWrapper'>
      <mui.ButtonGP
        color='secondary'
        label='キャンセル'
        onClick={cancelSubmit}
      />
      {uschCnt > 0 &&
        <mui.ButtonGP
          color='primary'
          label='削除実行'
          type="submit"
          onClick={handleSubmit}
        />
      }
    </div>
  </>)
}

const SchDialog = (props)=> {
  const users = useSelector(state => state.users);
  const stdDate = useSelector(state=>state.stdDate);
  const thisUser = comMod.getUser(props.uid, users);
  const [contentNdx, setcontentNdx] = React.useState(0);
  const classes = useLocalStyle();
  const UID = 'UID' + props.uid;
  const {sch, setSch, transfer, setTransfer, setSnack} = props;
  const schedule = useSelector(state => state.schedule);
  const account = useSelector(state=>state.account);
  const permission = comMod.parsePermission(account)[0][0];
  const hist = useHistory();

  const closeHandler = ()=>{
    setcontentNdx(0);
    hideMenuList();
    props.closeThis();
  }
  // 該当ユーザーのスケジュールデータ数
  let thisUsersSchCnt = 0;
  const thisUsersSch = sch?sch: comMod.findDeepPath(schedule, UID);
  if (thisUsersSch){
    thisUsersSchCnt = Object.keys(thisUsersSch)
      .filter(e => e.indexOf('D2') === 0).length;
  }
  else{
    thisUsersSchCnt = 0;
  }
  // const thisUsersSch = Object.keys(schedule[UID])
  //   .filter(e=>e.indexOf('D2') === 0).length;

  if(contentNdx === 2){
    //利用者別加算設定へ
    const scrollTop = document.documentElement.scrollTop;
    sessionStorage.setItem("byUserAddictionNoDialogUid", props.uid);
    sessionStorage.setItem("byUserAddictionNoDialogScrollVal", String(scrollTop));
    sessionStorage.setItem("byUserAddictionNoDialogIdName", "scheduleMain");
    hist.push(`/schedule/userAddiction`);
  }

  const asStyle = {position: 'absolute', top: -6, left: 10}
  const asTextStyle = {fontSize: '.5rem'}
  return (
    <Dialog 
      onClose={()=>closeHandler()} 
      open={props.open}
      className={'schDialog ' + classes.root}
    >
      <div className='dialogTitle'>
        {titles[contentNdx]}
        {/* {permission === 100 && contentNdx === 1 &&
          <div style={asStyle}>
            <SetTemplateAutoSave/>
            <span style={asTextStyle}>↑permission100only</span>
          </div>
        } */}
      </div>
      <div className="formSubTitle">
        <div className="date">{
          stdDate.split('-')[0] + '年' + stdDate.split('-')[1] + '月'
        }</div>
        <div className="user">{thisUser.name.slice(0, 12)}</div>
        <div> 様</div>
        <div className="age">{thisUser.ageStr}</div>
        <div className="belongs">{thisUser.belongs1}</div>
      </div>
      {contentNdx === 0 &&
        <>
        <MenuList 
          {...props} setcontentNdx={setcontentNdx} 
          kanriType={thisUser.kanri_type}
          thisUsersSchCnt={thisUsersSchCnt}
          {...thisUsersSchCnt}
        />
        <div className="buttonWrapper center" >
          <mui.ButtonCancel size='small' onClick={() => closeHandler()} />
        </div>
        </>
      }
      
      {contentNdx === 1 &&
        <>
        <SchByUserMonthly 
          uid={props.uid} closeEvent={() => closeHandler()}
          sch={sch} setSch={setSch}
        />
        {/* <SchEditModalContent {...props} closeEvent={() => closeHandler()}/> */}
        </>
      }
      {/* { contentNdx === 2&&
        <ByUserAddiction 
          {...props} 
          taransfer={transfer} setTransfer={setTransfer} sch={sch}
          close={()=>closeHandler()}
        />
      } */}
      {/* 管理事業所として上限管理 */}
      {contentNdx === 5 &&
        <UpperLimitKanri uid={props.uid} close={() => closeHandler()} />
      }

      {/* 協力事業所として上限管理 */}
      {contentNdx === 6 &&
        <UpperLimitKanri 
          uid={props.uid} specifyType={1} 
        close={() => closeHandler()} 
        />
      }
      {contentNdx === 7 &&
        <UserSchClear 
          uid={props.uid} thisUsersSchCnt={thisUsersSchCnt} 
          sch={props.sch} setSch={props.setSch}
          setSnack={props.setSnack}
          
          close={() => closeHandler()} thisUsersSch={thisUsersSch}
        />
      }
    </Dialog>
  );
}


const SchByUserDialog = (props)=> {
  const dispatch = useDispatch();
  const date = props.date;
  const {sch, setSch, setUserOpe, setSnack /*userCh, setUserCh*/} = props;
  const schedule = useSelector(state=>state.schedule);
  const users = useSelector(state => state.users);
  const sService = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  
  // service取得方法変更 単一サービスでstateのserviceが''で与えられることがある
  const service = sService || (serviceItems.length > 0 ? serviceItems[0] : '');

  const prms = {date, schedule, users, service, dispatch};
  const [open, setOpen] = React.useState(false);
  // const [pos, setpos] = React.useState({});
  const handleClickOpen = (e) => {
    // serviceItemsが複数でredux stateのserviceが空文字列の場合はダイアログを開かない
    if (serviceItems.length > 1 && !sService) {
      return;
    }
    // setpos(e.currentTarget.getBoundingClientRect());
    setOpen(true);
    // ユーザによるオペレーションのスイッチをセット
    setUserOpe(true);
    // comMod.setSchedleLastUpdate(dispatch, false); //オートセーブ制御
    // ↑ここでコールすると何故かダイアログが開かない
  };

  const closeThis = () => {
    setOpen(false);
  };

  // ユーザー別の加算処理を保持するための中間state
  const [transfer, setTransfer] = useState(false);

  // 中間stateから情報を受け取りクリーンアップで情報更新を試みる
  // ユーザー情報の更新は上位Componentのクリーンアップに実装すべきか
  // ユーザーの情報もここで格納する
  useEffect(()=>{
    const t = sch;
    const u = transfer;
    const closeFlug = u.close; // トランスファーに記述されているフラグを検出
    // console.log('schDialog useEffect.')
    setSch({...t, ...u});
    // setUserCh({...u});
    if (closeFlug)  setOpen(false);
  }, [transfer]);

  // serviceItemsが複数でredux stateのserviceが空文字列の場合はホバー表示も停止
  const shouldShowMenu = !(serviceItems.length > 1 && !sService);

  return (
    <div>
      
      {shouldShowMenu && (
        <div className="SchUserContUnker" onClick={handleClickOpen}>
          <MoreHorizIcon />
        </div>
      )}

      <SchDialog 
        open={open} 
        closeThis={closeThis}
        prms={prms}  
        date={date}
        uid={props.uid}
        sch={props.sch}
        setSch={props.setSch}
        setSnack={setSnack}
        // userCh={props.userCh} setUserCh={props.setUserCh}
        transfer={transfer} setTransfer={setTransfer}
      />
    </div>
  );
}
export default SchByUserDialog;