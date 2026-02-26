import React, {useEffect,  useState} from 'react';
import * as Actions from '../../Actions';
import { useDispatch, useSelector } from 'react-redux';
import SchTableHead from './SchTableHead';
import SchTableBody2 from './SchTableBody2';
import * as comMod from '../../commonModule';
import { SnapberAlert, } from '../common/materialUi';
import {LoadingSpinner, LoadErr, StdErrorDisplay, DisplayInfoOnPrint, SetUisCookieChkBox} from '../common/commonParts';
import { makeStyles } from '@material-ui/core/styles';
import { useLocation, useHistory } from 'react-router-dom';
import {LinksTab} from '../common/commonParts';
import SchUserDispatcher from './SchUsersDispatcher';
import { blue, red } from '@material-ui/core/colors';
import { SchInitilizer } from "./SchInitilizer";
import { HOHOU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import { onRenderCallback, univApiCall } from '../../albCommonModule';
import { SchFab } from './SchFab';
import { judeeCpuPower } from '../../modules/judeeCpuPower';
import { SchSoudan } from './SchSoudan';
import SchReserveNotification from './SchReserveNotification';
import SchDailyReportSyncer from './SchDailyReportSyncer';
import { OccupancyRate } from './SchHeadNav';
import SingleServiceDispatcher from '../common/SingleServiceDispatcher';
import SchHohouDuplicateCheckAndDelete from './SchHohouDuplicateCheckAndDelete';
import { useAutoScrollToRecentUser } from '../common/useAutoScrollToRecentUser';
// サービスクラスルームがボタンで変更されたときにセットされるロカルストレージ
export const SERVICE_CHENGED_BY_BUTTON = 'SERVICE_CHENGED_BY_BUTTON';
export const CLASSROOM_CHENGED_BY_BUTTON = 'CLASSROOM_CHENGED_BY_BUTTON';
const useStyles = makeStyles({
  linktabRoot: {
    marginTop: 47,
    '& > .MuiButton-text': {
      // margin: theme.spacing(1),
      padding: 0,
    },
  },
  initializing: {
    position: 'fixed', bottom: '10vh', 
    width: '80vw', left: '10vw', background: blue[900],
    color: '#fff', textAlign: 'center', padding: 16,
  },
});
export const menu = [
  { link: "/schedule/", label: "月間", printTitle: '予定実績月間', print: true },
  { link: "/schedule/weekly/", label: "週間", printTitle: '予定実績週間',print: true },
  { link: "/schedule/weekly/transfer/", label: "時間ごと", printTitle: '予定実績時間ごと',print: true },
  { link: "/schedule/users/", label: "利用者別", printTitle: '予定実績利用者別',},
  { link: "/schedule/daily/", label: "一日" ,printTitle: '予定実績利用一日',},
  { link: "/schedule/dsetting/", label: "日別設定" },
  // { link: "/schedule/useresult/", label: "確定処理" , pastMonthOnly: true},
  { link: "/schedule/calender/", label: "休校・休日" },
  { link: "/schedule/list/kasan", label: "加算・実費一覧" , },
  { link: "/schedule/setting", setting: true },
]
export const extMenu = [
  { link: "/schedule/predictive/", label: "推定入力" , },
  { link: "/schedule/reserve/", label: "予約確認", permission: 100 },
]
export const soudanMenu = [
  { link: "/schedule/", label: "基本", printTitle: '予定実績', print: true },
  { link: "/schedule/cycle", label: "個別設定", printTitle: '予定実績', print: true },
]
// メニューに対してフィルタを作成する
export const makeSchMenuFilter = (stdDate) => {
  // 当月の1日を求める
  const d = new Date();
  const today = d.getDate();
  d.setDate(1);
  
  let f = null;
  const thisMonth = comMod.formatDate(d, 'YYYY-MM-DD');
  if (thisMonth <= stdDate){
    f = (e) => !e.pastMonthOnly
  }
  return f;
}

const ScheduleMain = (props) => {
  const [localFabSch, setLocalFabSch] = useState(0);
  const [hoveredCell, setHoveredCell] = useState(null); // セルのホバーを保持する
  const favSchProps = {localFabSch, setLocalFabSch};
  const allState = useSelector(state=>state);
  const dispatch = useDispatch();
  const {hid, bid, users, dateList, schedule, stdDate, service, serviceItems} = allState;
  const permission = comMod.parsePermission(allState.account)[0][0];
  const cpuPower = judeeCpuPower();

  // 最近操作したユーザーへの自動スクロール
  useAutoScrollToRecentUser('UID', 500, 'RT');

  // 日付別利用者数を出すためのstateを定義
  const tmpCountsOfUSe = {};
  const a = Array(dateList.length).fill(0);
  users.map(e=>{tmpCountsOfUSe['UID' + e.uid] = [...a];});
  const [countsOfUse, setCountsOfUse] = useState(tmpCountsOfUSe);
  // croneSchはレンダリングに影響させずにユーザーごとのSchを反映させる。最後に一度だけdispatchするため。
  const [croneSch, setCroneSch] = useState(JSON.parse(JSON.stringify(schedule)));
  const history = useHistory();
  const location = useLocation();

  // 日付別の操作を行う前にストアにdispatchする必要がある。そのためのフラグ
  // const [schStoreDispatch, setSchStoreDispatch] = useState(false);
  const tb2Props = {
    localFabSch, setLocalFabSch, countsOfUse, setCountsOfUse, croneSch, setCroneSch,
    hoveredCell, setHoveredCell, cpuPower
  }
  const menuFilter = makeSchMenuFilter(stdDate);

  // ルート離脱時と/schedule/xxxへの遷移時にスケジュールをdispatch
  useEffect(() => {
    const unlisten = history.listen((nextLocation) => {
      // /schedule から離脱した時
      const leavingSchedule = location.pathname.startsWith('/schedule')
        && !nextLocation.pathname.startsWith('/schedule');
      
      // /schedule/xxx に遷移した時（ただし /schedule/ は除外）
      const enteringScheduleSubPath = nextLocation.pathname.startsWith('/schedule/')
        && nextLocation.pathname !== '/schedule/'
        && nextLocation.pathname.length > '/schedule/'.length;
      
      if (leavingSchedule || enteringScheduleSubPath) {
        const t = { ...croneSch, timestamp: Date.now() };
        dispatch(Actions.setStore({ schedule: t }));
      }
    });
    return unlisten;
  }, [history, location.pathname, croneSch, dispatch]);

  // リロードやタブ遷移などページ非表示時にも念のため保存
  useEffect(() => {
    const onPageHide = () => {
      const t = { ...croneSch, timestamp: Date.now() };
      dispatch(Actions.setStore({ schedule: t }));
    };
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [croneSch, dispatch]);

  // デバッグ用
  // if(permission === 100){
  //   const reserveTab = menu.find(m => m.link === "/schedule/reserve/");
  //   reserveTab.hide = false;
  // }
  
  return (<>
    <LinksTab menu={menu} menuFilter={menuFilter} extMenu={extMenu} />
    <div className='AppPage schedule fixed'>
      <DisplayInfoOnPrint style={{width: '100%'}}/>
      {/* <Profiler id="SchTableHead" onRender={onRenderCallback}> */}
      <OccupancyRate localSch={croneSch} />
      <SchTableHead {...tb2Props}/>
      {/* </Profiler> */}
    </div>
    <div className='AppPage schedule scroll' id='scheduleMain'>
      {/* <Profiler id="SchTableBody" onRender={onRenderCallback}> */}

      <SchTableBody2 {...tb2Props} />
      {/* </Profiler> */}
      <SnapberAlert />
      <SchFab fabSch={localFabSch} setFabSch={setLocalFabSch}/> 
      {/* {permission < 100 &&
        <mui.FabSchedule {...favSchProps}/>
      } */}
    </div>
    {serviceItems.length > 1 && !serviceItems.includes(HOHOU) && <>
      
      <SetUisCookieChkBox
        style={{marginLeft: 80, width: 400}}
        p={comMod.uisCookiePos.allowDispAllOnScheduleMonthly}
        label='全てのサービスを表示可能にする'
        reload={true}
      />
      <div 
        className='noprint'
        style={{marginLeft: 120, fontSize: '.8rem', color: red[600], marginTop: -32, marginBottom: 32}}
      >
        全てのサービスを表示するとこの画面から予定実績の編集ができなくなります。
      </div>
    </>}
    <SchUserDispatcher croneSch={croneSch}/>  
    <SchInitilizer/>
    {/* <CallDispHintSchMonth /> */}
    <SchDailyReportSyncer />
    <SingleServiceDispatcher />
    <SchHohouDuplicateCheckAndDelete onlyWhenServiceIsHohou={true} />
    <SchReserveNotification schedule={croneSch} setSch={setCroneSch} />
  </>)

}

const Sch2 = () => {
  const allstate = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allstate);
  const com = useSelector(state=>state.com);
  const users = useSelector(state=>state.users);
  // サービス未設定の場合
  const sService = useSelector(state=>state.service);
  // service取得方法変更 単一サービスでstateのserviceが''で与えられることがある
  // Sch2ではusersが利用可能だが、特定のユーザーのserviceを取得するのは適切でないため
  // 空文字列の場合はserviceItemsから取得
  const serviceItems = useSelector(state=>state.serviceItems);
  const service = sService || (serviceItems.length > 0 ? serviceItems[0] : '');
  const comAdic = comMod.findDeepPath(com, ['addiction', service]);
  // 相談支援であることを示すフラグ
  const isSoudan = (service === KEIKAKU_SOUDAN || service === SYOUGAI_SOUDAN)
  
  // 基本設定項目の確認
  if (loadingStatus.loaded && !comAdic && service){
    console.log('E49412');
    return(
      <StdErrorDisplay 
        errorText = '請求設定項目が未設定です。'
        errorSubText = {`予定作成開始に必要な基本設定項目がありません。設定メニューの
        「請求・加算」から定員や地域区分などを設定して下さい。`}
        errorId = 'E49412'
      />
    )
  }
  else if (loadingStatus.loaded && !users.length){
    console.log('E49413');
    return(
      <StdErrorDisplay 
        errorText = '利用者が未登録です。'
        errorSubText = {`利用者の登録をしてから予定の登録を行って下さい。`}
        errorId = 'E49413'
      />
    )
  }
  else if (loadingStatus.loaded && !loadingStatus.error && isSoudan){
    return <SchSoudan/>
  }
  else if (loadingStatus.loaded && !loadingStatus.error){
    return(
      <ScheduleMain />
    )
  }
  else if (loadingStatus.error){
    return (
      <LoadErr loadStatus={loadingStatus} errorId={'E49418'} />
    )
  }
  else{
    return <LoadingSpinner/>
  }
}

export default Sch2;
