import React, {useEffect, useState, useRef, useMemo, isValidElement} from 'react';
import { HashRouter, Route, Switch, useLocation, useHistory } from 'react-router-dom'
import { Link } from 'react-router-dom';
import { useDispatch, useSelector, } from 'react-redux';
import * as comMod from '../../commonModule';
import * as albcm from '../../albCommonModule';
import * as Actions from '../../Actions';
import * as thunks from '../../modules/thunks';
import * as mui from './materialUi';
import DrowerMenu, { SideToolBar } from '../../DrowerMenu';
import { blue, brown, grey, red, teal, yellow } from '@material-ui/core/colors';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, makeStyles, useMediaQuery, Tooltip } from '@material-ui/core';
import ReplayIcon from '@material-ui/icons/Replay';
import { useStyles } from './FormPartsCommon';
import { BrowserCheck, Saikouchiku, SendBillingToSomeState, SetUisCookieChkBox } from './commonParts';
import HelpSearch from './HelpSearch';
import HelpButton from './HelpButton';
import NoActivityDetector from './NoActivityDetector';
import BrowserWarning from './BrowserWarning';
import GetNationalHolidays from './GetNationalHolidays';
import { SetSoudanService } from './SetSoudanService';
import SchSelectMonth from '../schedule/SchSelectMonth';
import { UsersSindexInit } from '../Users/UsesSindexInit';
import ConfirmPayment from './ConfirmPayment';
import { Notifications } from '../Notification/Notification';
import { isUse } from '../Billing/blMakeData2021';
import { getLS, setLS } from '../../modules/localStrageOprations';
import { ChangeClassroomNew, ChangeServiceNew } from './ChangeServeceCrasroom';
import CheckUpdate from './CheckUpdate';
import { seagull } from '../../modules/contants';
import UseResultIconButton from './UseResultIconButton';
import CheckImportantState from './CheckImportantState';

const FETCH_DELAY_MS = 500; // 遅延時間（ミリ秒）

export const useGetHeaderHeight = () => {
  const isLimit500px = useMediaQuery("(max-width:500px)");
  const [headerHeight, setHeaderHeight] = useState(null);
  useEffect(() => {
    if(isLimit500px){
      setHeaderHeight(document.getElementById("limit500pxHeader")?.offsetHeight);
    }else{
      setHeaderHeight(null);
    }
  }, [isLimit500px]);
  return headerHeight;
}

const useStylesLocal = makeStyles({
  headBar: {
    minWidth: 375, alignItems: 'center',
    '& .leftSide': {width: 'fit-content'},
    '& .titleWrapper': {
      overflow: 'hidden', width: 18, margin: '6px auto 0 auto',
      position: 'absolute', left: '0', right: '0'
    },
  },
  fetchAllButton: {
    '& .MuiButton-root': {fontSize: '.7rem', marginLeft: 8},
    '& .MuiIconButton-root': {color: '#fff', padding: 6, marginLeft: 8},
    '& .MuiSvgIcon-root': {fontSize: '1.3rem'},
  },
  updateLink: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    color: '#fff', fontSize: '.7rem', paddingLeft: 8, paddingTop: 4,
  },
  monthNav: {
    '& a': {
      color: 'inherit', marginInlineStart: 24, marginInlineEnd: 24,
      "@media (max-width:500px)": {
        marginInlineStart: 4, marginInlineEnd: 4,
      },
    },
    '& .monthDisplay': {display: 'inline-flex', marginTop: 3},
    '& .small': {fontSize: '.6rem', paddingTop: '.8rem'},
    '& .middium': {padding: '.45rem .2rem 0'},
  },
  headerBarLimit500px: {
    zIndex: 2,
    position: 'fixed', top: 0,
    width: '100%', backgroundColor: teal[800],
    padding: '6px 6px 0',
    
    '& .contents': {
      display: 'flex',
      '&:not(:last-child)': {marginBottom: 6},
      '& .left': {width: "70%", display: 'flex'},
      '& .right': {width: "30%"}
    },
    '& .titleWrapper': {
      overflow: 'hidden', width: 18, margin: '6px auto 0',
      position: 'absolute', left: '0', right: '0'
    },
  },
  blankScreen: {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', paddingTop: 160, 
    background: '#fff', 
    zIndex: 1000,
    animation: '$blankScreenFadeOut 1s forwards 500ms', // 500ms後に開始、1秒間のアニメーション
  },
  '@keyframes blankScreenFadeOut': {
    '0%': {
      opacity: 1,
      width: '100vw',
      height: '100vh',
    },
    '95%': {
      opacity: 0,
      width: '100vw',
      height: '100vh',
    },
    '100%': {
      opacity: 0,
      width: 0,
      height: 0,
    }
  },
});

// 最低限の初期設置が行われているか確認
export const InitChecker = () => {
  const allstate = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allstate);
  const {users, com, hid, bid, schedule, stdDate, account} = allstate;
  const [res, setRes] = useState(null);
  const [notExistSch, setNotExistSch] = useState(false);
  const history = useHistory();
  const location = useLocation().pathname;
  const scheduleLength = Object.keys(schedule).length;
  const classes = useStylesLocal()
  const permission = comMod.parsePermission(account)[0][0];
  const style = {
    marginTop: 50, textAlign: 'center', background: '#fff', color: '#111',
    position: 'fixed', top: 0, left:0, width: '100vw', height: '100vh', paddingTop: 160, 
  }
  const allowList = [
    '/','/users/addnew','/upload/fscon', '/chep', '/test', '/Account/ch',
    '/account', '/contactbook/setting/'
  ]
  // スケジュール関連のURLの時は、スケジュールデータが存在するかどうかを確認する
  // 利用者関連のURLでも同様の措置を行う
  useEffect(()=>{
    let isMounted = true;
    const f = async () => {
      const prms = {hid, bid, a:'fetchScheduleAria'}
      await albcm.univApiCall(prms, '', setRes);
    };
    const isSch = location.includes('/schedule');
    const isUsers = location.includes('/users');
    const toBeAlert = isSch || isUsers;
    let timer = null;
    if (isMounted && !res && !scheduleLength && toBeAlert) {
      timer = setTimeout(() => {
        f();
      }, FETCH_DELAY_MS);
    }
    return (()=>{
      clearTimeout(timer);
      isMounted = false;
    });
  }, [location]);

  useEffect(() =>{
    if (res && !res?.data?.dt?.length){
      setNotExistSch(true);
    }
    else {
      setNotExistSch(false);
    }
  }, [res])

  
  if (!loadingStatus.loaded) return null;
  if (loadingStatus.error) return null;
  if (allowList.includes(location)) return null;
  if (notExistSch){
    return (
      <div style={style}>
        <div style={{
          padding: 8, paddingBottom: 24, color: red[800], lineHeight: 1.6,
          textAlign: 'justify',
          width: 480, margin: '0 auto',
        }}>
          月が存在しません。追加して下さい。<br></br>
          ご利用開始月より3ヶ月前から登録することをお勧めします。<br></br>
          返戻・過誤申請の予定があるときは一番古い月から登録してください。
        </div>
        <div>
          <SchSelectMonth/>
        </div>
        <div className={classes.blankScreen}></div>
      </div>
    )  
  }
  const monthStr = stdDate.slice(0, 4) + "年" + stdDate.slice(5, 7) + "月";
  if (!users.filter(e=>!e.delete).length){
    return (
      <div style={style}>
        <div style={{padding: 8, paddingBottom: 24, lineHeight: 1.6}}>
          利用者の登録がありません。最初に登録をお願いします。<br></br>
          ご利用開始月より3ヶ月前から登録することをお勧めします。<br></br>
          返戻・過誤申請の予定があるときは一番古い月から登録してください。<br></br>
          月の変更、追加をするには画面左上、{monthStr}と書いてあるところをクリックします。
        </div>
        <div>
          <Button
            onClick={()=>{history.push('/users/addnew?goback=/users/')}}
            variant='contained'
            color='primary'
          >
            利用者登録へ
          </Button>

        </div>
        {/* <div style={{marginTop: 64}}>
          <Button
            onClick={()=>{history.push('/upload/fscon')}}
            // variant='contained'
            color='primary'
            // color='secondary'
          >
            エクセルファイルアップロードへ
          </Button>
        </div> */}
        <div >
          <SetUisCookieChkBox
            style={{textAlign: 'center', fontSize: '.7rem', color: teal[800]}}
            p={comMod.uisCookiePos.useHohouService}
            label='保育訪問のサービスを追加可能にする'
          />

        </div>
        <div className={classes.blankScreen}></div>
        {permission >= 100 && (
          <div style={{marginTop: 64}}>
            <Button
              onClick={()=>{history.push('/contactbook/setting/')}}
              variant='contained'
              color='primary'
            >
              連絡帳設定へ
            </Button>
          </div>
        )}
      </div>
    )
  }
  return null;
}

// state serviceItemsの設定をusesから行う
// nullしか返さないComponent
// serviceItemsの 更新がある時だけディスパッチを行う
// 比較は配列の長さだけという雑なもの
// -> 2021-10-13 雑ではダメっぽい
const SetServiceItems = () => {
  const users = useSelector(state=>state.users);
  const userFtc = useSelector(state=>state.userFtc);
  const serviceItems = useSelector(state=>state.serviceItems);
  const serviceItemsInit = useSelector(state=>state.serviceItemsInit);
  const ref = useLocation().pathname;
  const dispatch = useDispatch();
  // 発火はuserFtcとrefで行う。usersで発火させると頻繁に動きすぎるため
  useEffect(()=>{
    const svcSet = new Set();
    if (userFtc.done){
      users.map(e=>{
        // 今日変更　カンマ区切りで複数サービス格納することがある
        if (e.service){
          e.service.split(',').forEach(f=>{
            svcSet.add(f);
          });
        }
        // svcSet.add(e.service)
      });
      // usersを検出できたら初期化済みフラグをセットする
      if (!serviceItemsInit){ // 初期化済みのときはなんどもやらない！ 2021/11/03
        dispatch(Actions.setStore({serviceItemsInit: true}))
      }
      const newItems = Array.from(svcSet);
      // 比較を厳密に行うようにした
      // これはいらなくなったんじゃないか 2024/11/11
      if (comMod.compareArrays(newItems, serviceItems).length){
        // 何もなかったら心配なので放デイ入れとく
        // if (!newItems.length) newItems.push('放課後等デイサービス');
        dispatch(Actions.setStore({serviceItems:newItems}));
        // サービスアイテムが変更になったらサービスを初期化
        dispatch(Actions.setStore({service:""}));
      }
    };
  },[userFtc]); // 依存配列を変更 refはいらんと思う
  return null;
}
// db名を取得する。db名にtestが含まれていたら表示を返す
const DbName = () =>{
  const allState = useSelector(state=>state);
  const ls = comMod.getLodingStatus(allState);
  const [dbName, setDbName] = useState(null);
  
  useEffect(()=>{
    let isMounted = true;
    
    // ローカルストレージの使用状況を調査（開発用）
    try {
      let totalSize = 0;
      const items = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        totalSize += size;
        
        // データ内容の解析
        let dateInfo = null;
        let structure = 'string';
        try {
          const parsed = JSON.parse(value);
          structure = Array.isArray(parsed) ? `array[${parsed.length}]` : 'object';
          
          // 日付フィールドを探す
          if (Array.isArray(parsed) && parsed.length > 0) {
            const first = parsed[0];
            if (first.date) dateInfo = first.date;
            if (first.timestamp) dateInfo = first.timestamp;
            if (first.createdAt) dateInfo = first.createdAt;
          } else if (typeof parsed === 'object' && parsed !== null) {
            dateInfo = parsed.date || parsed.timestamp || parsed.createdAt || parsed.updatedAt;
          }
        } catch (e) {
          // JSONでない場合はそのまま
        }
        
        items.push({ 
          key, 
          size, 
          sizeKB: (size / 1024).toFixed(2),
          structure,
          dateInfo,
          preview: value.substring(0, 100)
        });
      }
      
      // サイズが大きい順にソート
      items.sort((a, b) => b.size - a.size);
      
      // console.group('📊 LocalStorage Usage Analysis');
      // console.log(`Total items: ${localStorage.length}`);
      // console.log(`Total size: ${(totalSize / 1024).toFixed(2)} KB (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
      // console.log('\nTop 10 largest items:');
      // console.table(items.slice(0, 10).map(item => ({
      //   Key: item.key,
      //   'Size (KB)': item.sizeKB,
      //   Structure: item.structure,
      //   'Date Info': item.dateInfo || '-'
      // })));
      
      // 最大のアイテムの詳細を表示
      // if (items.length > 0) {
      //   const largest = items[0];
      //   console.group(`🔍 Largest Item Details: ${largest.key}`);
      //   console.log(`Size: ${largest.sizeKB} KB`);
      //   console.log(`Structure: ${largest.structure}`);
      //   console.log(`Date Info: ${largest.dateInfo || 'None'}`);
      //   console.log(`Preview (first 200 chars):`);
      //   console.log(largest.preview + (largest.preview.length < 200 ? '' : '...'));
      //   console.groupEnd();
      // }
      
      // console.groupEnd();
    } catch (error) {
      console.warn('Failed to analyze localStorage:', error);
    }
    
    // マウント直後：ローカルストレージからDB名を取得して即座に表示
    try {
      const cachedDbName = localStorage.getItem('albatross_dbname');
      if (cachedDbName && isMounted) {
        setDbName(cachedDbName);
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }
    
    // 3秒後に常にfetchを実行（最新のDB名を取得）
    if (ls.loaded) {
      const timer = setTimeout(() => {
        albcm.fetchDbname((response) => {
          if (isMounted) {
            // response.dataから実際のデータを取得
            const fetchedDbName = response?.data?.data || response?.data;
            setDbName(fetchedDbName);
            // ローカルストレージに保存（エラーハンドリング付き）
            try {
              localStorage.setItem('albatross_dbname', fetchedDbName);
            } catch (error) {
              console.warn('Failed to save to localStorage:', error);
              // QuotaExceededErrorの場合、古いデータを削除を試みる
              if (error.name === 'QuotaExceededError') {
                console.warn('localStorage quota exceeded');
              }
            }
          }
        });
      }, 3000);
      
      return () => {
        isMounted = false;
        clearTimeout(timer);
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [ls.loaded])
  
  const style = {padding: 8, paddingTop:12, color: red[200], fontSize: '.8rem'}
  
  // dbNameが取得できていて、testが含まれている場合のみ表示
  if (dbName && typeof dbName === 'string' && dbName.includes('test')){
    return (
      <div style={style}>TEST</div>
    )
  }
  if (dbName && typeof dbName === 'string' && dbName.includes('sandbox')){
    return (
      <div style={style}>SB</div>
    )
  }
  
  return null;
}

const FetchAllButton = () => {
  const dispatch = useDispatch();
  const classes = useStylesLocal();
  const hid = useSelector(state=>state.hid);
  const bid = useSelector(state=>state.bid);
  const stdDate = useSelector(state=>state.stdDate);
  const weekDayDefaultSet = 
  useSelector(state => state.config.weekDayDefaultSet);
  const clickHandler = () =>{
    thunks.fetchAll({stdDate, hid, bid, weekDayDefaultSet, dispatch})
  }
  return (
    <div className={classes.fetchAllButton}>
      {/* <Button
        variant="contained"
        color="primary"
        // startIcon={<ReplayIcon />}
        onClick={clickHandler}
      >
        <ReplayIcon/>
        再読込
      </Button> */}
      <IconButton onClick={clickHandler}><ReplayIcon/></IconButton>

    </div>
  )

}
// ヘッダ内の月のセレクタを廃止
// 月の表示とルートへのリンク提供のみの機能にする
// stdDateを他から参照しやすくするためローカルストレージに保存
// ついでにhid, bidも permissionも
const MonthDisp = () => {
  const classes = useStylesLocal();
  const allState = useSelector(state=>state);
  const ls = comMod.getLodingStatus(allState);
  const {stdDate, hid, bid, account} = allState;
  const history = useHistory();
  const permission = comMod.parsePermission(account)[0][0];
  
  const d = new Date();
  const today = d.getDate();
  d.setDate(1);
  const thisMonth = comMod.formatDate(d, 'YYYY-MM-DD');
  // 先月の文字列を得る
  const p = new Date(d.getTime());
  p.setMonth(p.getMonth() - 1);
  const lastMonth = comMod.formatDate(p, 'YYYY-MM-DD');
  let st; // 当月先月請求期間中などの状態を得る
  useEffect(()=>{
    setLS('stdDate', stdDate);
    setLS('hid', hid);
    setLS('bid', bid);
    setLS('permission', permission);
  }, [stdDate, hid, bid])
  
  if (stdDate === thisMonth){ // 当月で請求期間以外
    st = {color: "#eee"};
  }
  else if (stdDate === lastMonth && today <= 10){
    st = {color: yellow[300]};
  }
  else if (stdDate > thisMonth){ // 次月以降
    st = {color: blue[200]};
  }
  else{ // 前月以前
    st = {color: red[200]};
  }
  if (!ls.loaded) return (<span style={{width: 124}}></span>);

  
  return (<>
    <div className={classes.monthNav}>
      <a onClick={()=>history.push(`/`)}>
        <span className='monthDisplay' style = {st}>
          <div className='small'>{stdDate.split('-')[0]}年</div>
          <div className='middium'>{stdDate.split('-')[1]}</div>
          <div className='small'>月</div>
        </span>
      </a>
    </div>
  </>)

}

// // 直近のサービスとclassroomを保存する
// const ServiceClassroomKeeper = ({dispAll}) => {
//   const dispatch = useDispatch();
//   const allState = useSelector(s=>s);
//   const {service, classroom} = allState;
//   const sec = 3;
//   useEffect(() => {
//     // タイマーIDを保持する変数を定義
//     const timerId = setTimeout(() => {
//       if (service) setLS('curSvc', service);
//     }, sec * 1000); // 10秒 (10000ミリ秒) の遅延
  
//     // クリーンアップ関数でタイマーをクリア
//     return () => clearTimeout(timerId);
//   }, [service]);
  
//   useEffect(() => {
//     let isMounted = true; // クリーンアップ用フラグを追加

//     if (!dispAll && !service) {
//       const storedService = getLS('curSvc');
//       if (storedService && storedService !== service && isMounted) {
//         dispatch(Actions.setStore({ service: storedService }));
//       }
//     }

//     // コンポーネントがアンマウントされたときにフラグを false に設定
//     return () => {
//       isMounted = false;
//     };
//   }, [dispAll, service, dispatch]);  return null
// }

const Header = (props) => {
  const limit500px = useMediaQuery("(max-width:500px)");
  const dispatch = useDispatch();
  const classes = useStylesLocal();

  const ref = useLocation().pathname;
  const hist = useHistory();
  const account = useSelector(state=>state.account);
  const com = useSelector(state=>state.com);
  
  // ローカルストレージからDB名を取得（即座にチェック＋定期ポーリング）
  const [dbName, setDbName] = useState(null);
  
  useEffect(() => {
    // マウント時に即座にチェック
    try {
      const cachedDbName = localStorage.getItem('albatross_dbname');
      if (cachedDbName) {
        setDbName(cachedDbName);
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }
    
    // 5秒ごとに定期チェック（エンドポイント切り替え後の更新を素早く反映）
    const intervalTimer = setInterval(() => {
      try {
        const cachedDbName = localStorage.getItem('albatross_dbname');
        if (cachedDbName) {
          setDbName(cachedDbName);
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
      }
    }, 5000);
    
    return () => {
      clearInterval(intervalTimer);
    };
  }, []);
  
  const permission = comMod.parsePermission(account)[0][0];
  // サービス未指定を可能とするパスリストを列挙する
  // reportsは削除するべきじゃないの？ 2022/01/25 ->　様子見
  // const dispAllPath = ['/', '/proseed', '/reports', ];
  const dispAllPath = [
    '/', '/users', '/proseed', '/users/bankinfo', '/users/belongs',
    '/proseed/upperlimit', '/reports', '/users/bros', '/users/kanri',
    '/reports/setting/all', '/users/addnew',
    '/schedule/weekly/transfer','/schedule/weekly',
    '/reports/billing',
    '/reports/jogenkanri',
    '/reports/schedule',
    '/reports/dearuser',
    '/reports/etc',
    '/dailyreport/browse'
    
  ];
  const dispAllPtn = [/^\/users\/edit[0-9]+/];

  // オプションが設定されているケースや末尾に/が付与されているケースなどを考慮
  // const dispAll = dispAllPath.findIndex(_=>_ === ref) > -1;
  const dispAllByStr = dispAllPath.includes(ref.split('?')[0].replace(/\/$/, '')) || ref === '/';
  const dispaAllByPtn = () => {
    let r = false;
    let l = ref.split('?')[0];
    dispAllPtn.forEach(e=>{
      if (e.test(l)) r = true;
    });
    return r;
  }
  const dispAll = (dispAllByStr || dispaAllByPtn())? true: false
  // サービス指定不可とするパス
  const notDispSeirvicePath = [
    '/billing', '/Account/ch', '/Account/', '/schedule/userAddiction/', 
    '/schedule/userUpperLimit', 
    '/schedule/daysetting/schbydate',
    '/proseed/upperlimit',
    '/contactbook/edit/',
    '/workshift/staffsetting/',
  ];
  const notDispService = notDispSeirvicePath.some(path => ref.startsWith(path));
  // 教室指定不可とするパスを列挙
  const notDispClassRoomPath = [
    '/billing', '/billing/upperlimit', '/proseed/upperlimit',
    '/proseed/otherOfficeis',
    '/schedule/userAddiction/', '/schedule/userUpperLimit',
    '/contactbook/edit/',
    '/workshift/staffsetting/',
  ];
  const notDispClassRoom = notDispClassRoomPath.some(path => ref.startsWith(path));

  const allState = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allState);
  document.title = seagull? 'AIつばさ': 'アルバトロス放デイ児発';

  let hname = '', bname = '';
  if (props.props.comFtc.done && !props.props.comFtc.err){
    hname = props.props.com.hname;
    bname = props.props.com.bname;
  }
  let dispName = '';
  if (props.props.fetchAccountStatus.done 
    && !props.props.fetchAccountStatus.err) 
  {
    if(limit500px){
      dispName = (
        <div style={{textAlign: 'right'}}>
          <div style={{fontSize: 12, marginBottom: 2}}>{props.props.account.sbname}</div>
          <div style={{fontSize: 12}}>{props.props.account.lname}<span style={{marginLeft: 4}}>さん</span></div>
        </div>
      )
    }else{
      dispName = props.props.account.sbname + ' ' + props.props.account.lname;
    }
  }
  // 2021/08/27
  // パスワードログインのときしかスナック表示されなかったため追加
  // stateのアカウントが成立したら発火。
  // 通知したら通知済みのstateをdispatch
  useEffect(()=>{
    if (Object.keys(account).length && !account.noticeDone){
      const permissionName = comMod.getPermissionName(account);
      const text = 
        `${account.lname} ${account.fname}さんは${permissionName}です。`;
      const t = {...account, noticeDone: true};
      dispatch(Actions.setStore({account: t}));
      dispatch(Actions.setSnackMsg(text, ''));
    }
  }, [account])
  const accountClickHandler = () => {
    hist.push('/Account/ch');
  }
  const imgUrl = seagull? 'aitsubasa-eee.svg': 'logoa_eee.svg';
  const logoWidth = seagull? '110': '120';

  /*画面幅が500px以下画面（スマホ対応）*/
  if(limit500px){
    const isMultService = !notDispService;
    const isMultClassroom = !notDispClassRoom;
    return(
      <>
      <div id="limit500pxHeader" className={classes.headerBarLimit500px}>
        <div className='contents'>
          <div className='left'>
            <div style={{paddingTop: 4}}><DrowerMenu /></div>
            <MonthDisp />
            <DbName/>
            <div style={{marginLeft: 16}}><Notifications /></div>
          </div>
          <div className='titleWrapper'>
            <div className='title'>
              <a href = './'>
                <img 
                  src={`${window.location.origin}/img/${imgUrl}`} 
                  width={`${logoWidth}px`} alt="logo" />
              </a>
            </div>
          </div>
          <div className='right'>
            <a onClick={accountClickHandler} style={{color:'#fff'}}>{dispName}</a>
          </div>
        </div>
        <div className='contents' style={{justifyContent: 'center'}}>
          {/* {isMultService &&
            <mui.ChangeService dispAll={dispAll} loadingStatus={loadingStatus} style={{width: '50%', textAlign: 'center', height: 32, marginBottom: 6}} />
          }
          {isMultClassroom &&
            <mui.ChangeClassRoom loadingStatus={loadingStatus} style={{width: '50%', textAlign: 'center', height: 32, marginBottom: 6}} />
          } */}
          <ChangeServiceNew/>
          <ChangeClassroomNew/>
        </div>
      </div>
      <SendBillingToSomeState />
      <SetServiceItems />
      <InitChecker />
      {/* <Saikouchiku /> */}
      <CheckUpdate mobileUpdate={true} hide={true} />
      </>
    )
  }

  /*画面幅が501px以上画面*/
  const devStyel = (() => {
    if (permission === 100 && dbName) {
      if (dbName.includes('sandbox')) {
        return {background: grey[700]};
      } else if (!dbName.includes('test')) {
        return {background: brown[900]};
      }
    }
    return {};
  })();
  return (
    <>
    <div className='headBar' style={devStyel}>
      <div className='leftSide'>
        <DrowerMenu />
        <div className='titleWrapper'>
          <div className='title'>
            <a href = './'>
              <img 
                src={`${window.location.origin}/img/${imgUrl}`} 
                width={`${logoWidth}px`} alt="logo" />
            </a>
          </div>
        </div>
        {/* <a 
          className={classes.updateLink} 
          href={'/?rev=' + comMod.randomStr(12)}
        >
          <Rev short/>  
        </a> */}
        <CheckUpdate />
        {/* <SchIntervalSave /> */}
        <FetchAllButton/>
        <MonthDisp />
        {/* {notDispService === false &&
          <mui.ChangeService dispAll={dispAll} loadingStatus={loadingStatus} />
        } */}
        <ChangeServiceNew/>
        <ChangeClassroomNew/>

        {/* {notDispClassRoom === false &&
          <mui.ChangeClassRoom loadingStatus={loadingStatus}/>
        } */}
        <HelpSearch />
        <HelpButton />
        <Notifications />
        <UseResultIconButton />
        <DbName/>
        <SendBillingToSomeState />
      </div>
      <div>
        {/* <mui.ButtonSave color="primary" /> */}
      </div>
      <Tooltip title={
        <div style={{fontSize: '.8rem', lineHeight: 1.6, width: '400px'}}>
          <div>{hname}</div>
          <div>{bname}</div>
          <div>{account.lname + ' ' + account.fname} さん</div>
          <div>{account.mail}</div>
        </div>
      } arrow>
        <a onClick={accountClickHandler} style={{color:'#fff', cursor: 'pointer'}}>
          <div className='comWrapper' >
            {/* <div className='com'>{hname}</div>
            <div className='branch'>{bname}</div> */}
            <div>{dispName} さん</div>
          </div>
        </a>
      </Tooltip>
      <SetServiceItems />
      <InitChecker />
      {/* <Saikouchiku /> */}
      <NoActivityDetector/>
      <BrowserWarning/>
      <GetNationalHolidays/>
      <SetSoudanService/>
      <UsersSindexInit/>
      <SideToolBar />
      <ConfirmPayment />
      <CheckImportantState />
      {/* {permission === 100 && <ServiceClassroomKeeper dispAll={dispAll}/>} */}
      
    </div>
    </>
  )
}

export default Header;