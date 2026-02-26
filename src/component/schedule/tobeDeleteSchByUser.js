import React, {useState, } from 'react';
import * as Actions from '../../Actions';
import { useSelector, useDispatch } from 'react-redux';
// import SchHeadNav from './SchHeadNav';
import SchEditDetailDialog from './SchEditDetailDialog';
// import SchTableHead from './SchTableHead';
import * as comMod from '../../commonModule';
import * as mui from '../common/materialUi';
import {LoadingSpinner} from '../common/commonParts';
// import SimpleModal from '../common/modal.sample';
// import SchDailyDialog from './SchDailyDialog';
import { makeStyles, createMuiTheme } from '@material-ui/core/styles';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
// import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
// import { common } from '@material-ui/core/colors';
// import AccessTimeIcon from '@material-ui/icons/AccessTime';
// import DriveEtaIcon from '@material-ui/icons/DriveEta';
// import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
// import AddCircleIcon from '@material-ui/icons/AddCircle';
import EachScheduleContent from './SchEachScheduleContent';
// import SchSaveLater from './SchSaveLater';
import { menu, extMenu } from './Sch2';
import { LinksTab } from '../common/commonParts';
import { useLocation, useParams, } from 'react-router-dom';
import { OccupancyRate } from './SchHeadNav';

const useStyles = makeStyles({
  userInfo:{
    display:'flex',
    justifyContent:'center',
    paddingTop: 48,
    paddingBottom: 24,
    '& >div': {
      margin: '0 8px',
    }
  }
});
const theme = createMuiTheme({
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


// ローカルのステイトでコントロールしていたがstoreにuidを書き込むようにする
const UserSlect = (props)=>{
  const dispatch = useDispatch();
  const usersOrg = useSelector(state => state.users);
  let service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const serviceItems = useSelector(state => state.serviceItems);
  const contMode = useSelector(state => state.controleMode);
  const cntUid = contMode.uid;
  const [thisUid, setthisUid] = useState(cntUid);
  // サービス内容でユーザーリストを絞り込み
  const users = usersOrg.filter(e=>(
    e.service === service &&
    (classroom === '' || e.classroom === classroom)
  ));
  // パラメータで設定されたuidをstoreにセット。
  // 見つからなかったらメッセージを作成する
  // let uidFound = false;
  // if (puid){
  //   if (users.find(e => parseInt(e.uid) === parseInt(puid))){
  //     dispatch(Actions.setControleMode({ ...contMode, uid: parseInt(puid) }));
  //     uidFound = true;
  //   }
  // }
  // else{
    // storeのuidが現在のユーザーリストになければユーザーリストの先頭をセット
    // パラメータでuidが指定されているときはこの処理はしない    
  if (!users.find(e => parseInt(e.uid) === comMod.convUID(thisUid).num)) {
    setthisUid(users[0].uid);
    dispatch(Actions.setControleMode({ ...contMode, uid: users[0].uid }));
  }
  // }

  // セレクトのオプションを作成
  const Options = ()=>{
    const opt = users.map((e, i)=>{
      return(
        <option key={i} value={e.uid}>{e.name + ' ' + e.ageStr}</option>
      )
    });
    return opt;
  }
  const selectClass = {
    margin: theme.spacing(1),
    minWidth: 120,
  }
  const handleChange = (e) =>{
    const val = e.currentTarget.value; 
    setthisUid(val);
    dispatch(Actions.setControleMode({...contMode, uid: val}));
  }
  return(<>
    <FormControl style={selectClass}>
      <InputLabel >{props.name}</InputLabel>
      <Select
        native
        value={thisUid}
        name={'ご利用者選択'}
        onChange={(e) => handleChange(e)}
      >
        <Options />
      </Select>
    </FormControl>
  </>)
}

const SevenDaysGrid = (props)=>{
  const dispatch = useDispatch()
  const dateList = useSelector(state=>state.dateList);
  const thisUser = useSelector(state=>state.controleMode.uid);
  const path = useLocation().pathname;

  // 該当ユーザーのみのスケジュールを取得
  const schedule = useSelector(state => state.schedule['UID' + thisUser]);
  const users = useSelector(state => state.users);

  // フローティングアクションボタンの値取得
  // 0 何もしない 1 追加削除 2 追加修正
  let cntMode = useSelector(state => state.controleMode.fabSchedule);
  cntMode = (cntMode === undefined) ? 0 : parseInt(cntMode);

  const template = useSelector(state => state.scheduleTemplate);
  // 7曜グリッド作成
  const daysGrid = comMod.makeDaysGrid(dateList);
  // クリックハンドラ
  const clickHandler = (e)=>{
    e.stopPropagation();
    e.preventDefault();
    const did = e.currentTarget.getAttribute('did');
    const UID = 'UID' + thisUser;
    const date = comMod.convDid(did); // did形式を日付オブジェクトに
    // 引数で受け取ったdatalist全体から該当日付の休日モードを取得
    const holiday = dateList.filter(
      f => f.date.getTime() === date.getTime()
    )[0].holiday;
    const holidayStr = ['weekday', 'schoolOff', 'schoolOff'][holiday];
    // 同じようにserviceを取得
    const service = users.filter(f => f.uid === thisUser)[0].service;
    // 該当スケジュールの取得。見つからなければnull
    let thisSchedule = schedule[did];
    
    // なにもしない
    if (cntMode === 0)  return false;

    // 追加削除、追加削除モードでスケジュールが存在しない->追加
    if (cntMode > 0 && !thisSchedule) {
      // テンプレートからディープコピー
      thisSchedule = JSON.parse(JSON.stringify(template[service][holidayStr]));
      dispatch(Actions.addSchedule(UID, did, thisSchedule));
      comMod.setSchedleLastUpdate(dispatch, path);
    }
    // 追加削除モードでスケジュールが存在する->削除
    else if (cntMode === 1 && thisSchedule) {
      dispatch(Actions.removeSchedule(UID, did));
      comMod.setSchedleLastUpdate(dispatch, path);
    }
    // 追加修正モードでスケジュールが存在する
    else if (cntMode === 2 && thisSchedule) {
      comMod.setSchedleLastUpdate(dispatch, path);
      // storeに対してdispatchで開く方法
      const p = { open: true, uid: UID, did: did };
      comMod.setOpenSchEditDetailDialog(dispatch, p);
    }
  }
  const OneWeek = (props)=>{
    const week = props.week.map((e, i)=>{
      const cls = ['', 'schoolOff', 'off'];// 学校休日休業日を示すクラスリスト
      const wdClass = (e !== '')? cls[e.holiday]:'';
      // 日付オブジェクトをdid形式に変換
      const did = (e !== '') ? comMod.convDid(e.date):''
      // この日のスケジュール
      let thisSchedule;
      // そもそもデータがない
      if (!schedule)  thisSchedule = undefined;
      // 該当日のデータがない
      else if (Object.keys(schedule).indexOf(did) === -1) 
        thisSchedule = undefined;
      else thisSchedule = schedule[did];

      return(
        <div className={'day ' } key={i} 
          did = {did}
          onClick = {(e)=>clickHandler(e)}
        >
          {(e !== '') &&
            <div className={'dayLabel ' + wdClass}>
              {e.date.getDate()}
            </div>
          }
          <div className='content'>
            <EachScheduleContent thisSchedule={thisSchedule}/>
          </div>
        </div>
      );
    });
    return (<div className='week'>{week}</div>);
  }
  const weeks = daysGrid.map((e, i)=>{
    return (
      <OneWeek week={e} key={i} />
    );
  });
  return (
    <div className='monthWrapper'>
      <div className="month">
        <div className='week'>
          <div className='day weekLabel'>日</div>
          <div className='day weekLabel'>月</div>
          <div className='day weekLabel'>火</div>
          <div className='day weekLabel'>水</div>
          <div className='day weekLabel'>木</div>
          <div className='day weekLabel'>金</div>
          <div className='day weekLabel'>土</div>
        </div>
        {weeks}
      </div>
    </div>
  );
}

const MainSchByUsers = ()=>{
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const contMode = useSelector(state => state.controleMode);
  const dispatch = useDispatch();
  // サービスが未設定なら設定する
  if (!service) {
    dispatch(Actions.changeService(serviceItems[0]));
  }
  const susers = users.filter(e=>e.service === service);
  // パラメータからuidを取得トライ
  const puid = useParams().p;
  const puidExist = (puid) ? true : false;
  let puidFound = (puidExist) ?
    susers.findIndex(e=>(e.uid === puid)) > -1:
    false;
  if (puidExist && contMode.uid !== puid){
    dispatch(Actions.setControleMode({ ...contMode, uid: puid }));
  }
  const thisUser = comMod.getUser(puid, users);
  
  if (!puidExist){
    return(<>
      <LinksTab menu={menu} extMenu={extMenu} />
      <div className="AppPage schByUsers">
        <OccupancyRate displayMode='wide' />
        <UserSlect />
        <SevenDaysGrid />
        <mui.FabSchedule />
        <SchEditDetailDialog />
        <mui.SnapberAlert />
      </div>
    </>)
  }
  else if (puidFound){
    return(<>
      <LinksTab menu={menu} extMenu={extMenu} />
      <div className="AppPage schByUsers">
        <OccupancyRate displayMode='wide' />
        <div className={classes.userInfo}>
          <div>{thisUser.name} 様</div>
          <div>{thisUser.ageStr}</div>
          <div>{thisUser.belongs1}</div>
        </div>
        <SevenDaysGrid />
        <mui.FabSchedule />
        <SchEditDetailDialog />
        <mui.SnapberAlert />
      </div>
    </>)
  }
  else{
    const style = {paddingTop: 60, textAlign:'center'};
    return(<>
      <LinksTab menu={menu} extMenu={extMenu} />
      <div className="AppPage schByUsers">
        <div style={style}>
          存在しないユーザーが指定されました。
        </div>
      </div>
    </>)
  }
}

const ErrSchByUsers = ()=>{
  return(<div>error occured.</div>)
}

const SchByUsers = ()=>{
  const userFtc = useSelector(state => state.userFtc);
  const fetchCalenderStatus = useSelector(state => state.fetchCalenderStatus);
  // fetch状態の取得
  const done = (
    userFtc.done && fetchCalenderStatus.done
  );
  const errorOccured = (
    userFtc.err || fetchCalenderStatus.err
  );
  const loading = (
    userFtc.loading || fetchCalenderStatus.loading
  );

  if (done) return (<MainSchByUsers />);
  else if (loading) return (<LoadingSpinner />);
  else if (errorOccured) return (<ErrSchByUsers />);
  else return null;
}
export default SchByUsers;