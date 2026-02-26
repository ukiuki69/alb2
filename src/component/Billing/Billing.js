import React, { useEffect, useState } from 'react';
import * as mui from '../common/materialUi'
import * as Actions from '../../Actions';
import * as comMod from '../../commonModule';
import { useDispatch, useSelector, } from 'react-redux';
import { blue, common, grey, teal } from '@material-ui/core/colors';
import { LoadingSpinner, LoadErr, PermissionDenied, StdErrorDisplay, SendBillingToSomeState, SetUisCookieChkBox } from '../common/commonParts';
import CheckIcon from '@material-ui/icons/Check';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { 
  houdySirvice, houdayKasan, chiikiKubun, unitPrice,
  serviceSyubetu, ketteiScodeOld,
} from './BlCalcData';
import { keys } from '@material-ui/core/styles/createBreakpoints';
import { Business, FormatAlignJustifyOutlined } from '@material-ui/icons';
import { 
  setBillInfoToSch, makeBiling, makeJugenkanri, makeTeikyouJisseki
} from './blMakeData';
import { makeStyles } from '@material-ui/core/styles';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Button from '@material-ui/core/Button';
import { Link, useLocation } from 'react-router-dom';
import CheckProgress from '../common/CheckProgress';
import {JichiJoseiInfo, JihatsuMusyouInfo, ProseedUpperLimit, UpperLimitInner} from './Proseed';
import axios from 'axios';
import red from '@material-ui/core/colors/red';
import GroupIcon from '@material-ui/icons/Group';
import { faChalkboardTeacher, prefix } from '@fortawesome/free-solid-svg-icons';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import { selectStyle } from '../common/FormPartsCommon';
// import { endPoint } from '../../Rev';
import { KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import { convUid } from '../../albCommonModule';
import { endPoint, univApiCall } from '../../modules/api';
import ServiceCountNotice from './ServiceCountNotice';
import UserBilling from './UserBilling';
import { SetUseResult } from '../schedule/SchDaySetting';
import DisplayHint from '../common/DisplayHint';
import { DisplayHintGroups } from '../common/DisplayHintGroupes';
import { CheckBillingEtc } from './CheckBillingEtc';
import { NotDispLowCh, useSuspendLowChange } from '../common/useSuspendLowChange';
import StrongWarning from './StrongWarning';
import { getLS, getLSTS, removeLocalStorageItem, setLS, setLSTS } from '../../modules/localStrageOprations';
import pako from "pako";
import Encoding from 'encoding-japanese';
import UserSelectDialogWithButton, { UserSelectDialog } from '../common/UserSelectDialogWithButton';
import SchHohouDuplicateCheckAndDelete from '../schedule/SchHohouDuplicateCheckAndDelete';
import JSZip from 'jszip';
import Rev, { rev } from '../../Rev';
import { IconButton } from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import { LinksTab } from '../common/commonParts';
import { objectKeys } from 'encoding-japanese/src/util';
import { permissionCheckTemporary } from '../../modules/permissionCheck';

const CSVSURL = "https://rbatosdata.com/";

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightRegular,
  },
  linktabRoot: {
    marginTop: 47,
    '& > .MuiButton-text': {
      // margin: theme.spacing(1),
      padding: 0,
    },
  },
  dlBtn: {
    '& .MuiButton-root':{
      marginInlineStart:8,
      marginInlineEnd:8,
    },
  },
  dialogOpenButtonRoot:{
    position: 'fixed',
    top: 80, right: 20, width: 180, paddingTop: 10,
    '& .MuiButton-root': {width: '100%'},
    '& .buttonText':{display: 'flex',},
    '& .buttonText soan':{display: 'block',},
    '& .buttonText span:nth-of-type(1)' :{
      fontSize: '.6rem',
      margin: '.7rem 2px 0',
      marginLeft: '.6rem',
    },
    '& .buttonText span:nth-of-type(2)': {
      fontSize: '1.2rem',
      margin: '0 2px 0'
    },
    '& .buttonText span:nth-of-type(3)': {
      fontSize: '.6rem',
      margin: '.7rem 2px 0'
    },
    '& .scheduleCount' : {
      padding: 6,
      textAlign: 'center',
      '& span' :{
        color:'#00695c',
        fontWeight: 'bold',
      }
    },
  },
  infoWrapper: {width: '60%', margin: '24px auto 0'},
  // createCsv:{
  //   '& .MuiButtonBase-root' :{
  //     margin: 0,
  //     paddingRight: 16,
  //     paddingLeft: 16,
  //   },
  // },
  billingNotice: {
    marginTop: 16, color: blue[800],
    '& .small': {
      width:'50%', marginLeft: '25%', color: grey[800], fontSize: '.8rem',
      lineHeight:1.6, textAlign: 'justify', marginTop: 8,

    }
  }
}));

export const getBillingMenu = (account, com) => {
  const hideJichiJosei = (() => {
    // 開発者は常に表示
    // const isDev = permissionCheckTemporary(100, account);
    // com.etc.citiesに定率助成の設定があるか確認
    const hasTeiritsuJosei =
      com?.etc?.cities &&
      Array.isArray(com.etc.cities) &&
      com.etc.cities.some(city => city.teiritsuJosei === true);
    
    if (hasTeiritsuJosei) return false;
    
    return true;
  })();

  return [
    { link: "/billing", label: "請求送信" },
    { link: "/billing/rebilling", label: "再請求" , },
    { 
      link: "/billing/jichijoseiadjustment", 
      label: "自治体助成調整",
      hide: hideJichiJosei
    },
    { link: "/billing/userbilling", label: "口座振替・ファクタリング" },
    { link: "/proseed/upperlimit", label: "上限管理", print: true },
  ];
};

const uisCookieChkBoxStyle = {
  width: '60%', maxWidth: 500, margin: '0 auto', padding: 0,
}

export const BilUpperLimit = (props) =>{
  const allstate = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allstate);

  const BilUpperLimitMain = () => (
    <>
      <LinksTab menu={getBillingMenu(allstate.account, allstate.com)} />
      <UpperLimitInner style={{paddingTop: 0}} />
      {/* <div className="AppPage account">hoge</div> */}
    </>
  )

  if (loadingStatus.loaded){
    return (<BilUpperLimitMain />)
  }
  else if (loadingStatus.error){
    return (
      <LoadErr loadStatus={loadingStatus} errorId={'E4934'} />
    )
  }
  else{
    return <LoadingSpinner/>
  }

}

export const BilUserBilling = (props) =>{
  const allstate = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allstate);

  const BilUserBillingMain = () => (
    <>
      <LinksTab menu={getBillingMenu(allstate.account, allstate.com)} />
      <UserBilling/>
      {/* <div className="AppPage account">hoge</div> */}
    </>
  )

  if (loadingStatus.loaded){
    return (<BilUserBillingMain />)
  }
  else if (loadingStatus.error){
    return (
      <LoadErr loadStatus={loadingStatus} errorId={'E4934'} />
    )
  }
  else{
    return <LoadingSpinner/>
  }

}



// 請求処理を行うモジュール。
// 処理はmakeCsvで一括して行う。
// makeCsvからは
// 明細情報（請求）k121(122)
// サービス提供実績 k611
// 上限管理(k411)
// を作成するモジュールそれぞれコールする予定。
// 個別の作成モジュールはcsvに該当する配列を返す。
// 配列はjsonにしてdbに投げるようにする
// 親モジュールAccountからはuseStateで作成したステイトとset関数を
// 明細作成用モジュールに渡してそれぞれ状態管理を行うようにする。
// サーバーサイドの状態管理を行うためにfetch関連のディスパッチを作成して
// そちらもstateで状態管理を行うようにする。

// 送信の状態を監視するタイマーインターバル
const fetchTransferInterval = 1000 * 8;
const dummyProgressInterval = 800;
// 配列置換用文字列定義
const REC_CNT = 'REC_CNT';
const TOTAL_RECS = 'TOTAL_RECS';
const JINO = 'JINO';
const MONTH_USE = 'MONTH_USE';
const MONTH_APPLY = 'MONTH_APPLY';
const CITY = 'CITY';
const HNO = 'HNO';
// カラム位置
const CP_TR_SOUGEI_CNT = 36; // 送迎回数 35 カラム
// 以下はトータルレコードに挿入するべき値とカラム位置 今はまだ対応していない
// const KATEI_CNT = 'KATEI_CNT'; // 家庭連携加算 37
// const KATEI_CNT1 = 'KATEI_CNT1'; // 家庭連携加算算定回数 38
// const JIKATSU_CNT = 'JIKATSU_CNT';// 自活支援回数 53
// const HOUMON_CNT = 'HOUMON_CNT';// 訪問回数 54
// const KOUDOU_CNT = 'KOUDOU_CNT';// 行動障害回数 119
// const JUUDO_CNT = 'JUUDO_CNT';// 重度回数 123

// 配列から特定の文字列を検索して置換する
const elmRep = (a, str, value) =>{
  const ndx = a.indexOf(str);
  if (ndx === -1) return false;
  a[ndx] = value;
  return true;
}

const BlobDownload = ({ downloadLinks, toZip, setRes }) => {
  const handleDownloadAll = () => {
    downloadLinks.forEach(link => {
      const a = document.createElement('a');
      a.href = link.downloadUrl; // BlobのURL
      a.download = link.fileName; // ファイル名
      document.body.appendChild(a); // DOMに追加
      a.click(); // 自動クリック
      document.body.removeChild(a); // 使用後に削除
    });
  };

  return (
    <>
      {!toZip &&
        <Button
          color='secondary'
          variant='contained'
          onClick={handleDownloadAll}
        >
          一括ダウンロード
        </Button>
      }
      {downloadLinks.slice().reverse().map((link, i)=>(
        <a href={link.downloadUrl} download={link.fileName} key={i} style={{marginInlineStart: 16}}>
          <Button 
            variant='contained'
            color={link.zip?'secondary': 'default'}
          >
            {link.label}
          </Button>
        </a>
      ))}
      <IconButton
        style={{marginInlineStart: 16}}
        color='secondary'
        onClick={()=>setRes({resSend:{},resCsv:{}})}
      >
        <CancelIcon/>
      </IconButton>
    </>
  );
};


const sendAndMakeCsvApiCall = async (prms, transferData, setRes) => {
  let resSend, resCsv
  try{
    // dbに送信データをセット
    prms.a = 'sendTransferData';
    prms.dt = JSON.stringify((transferData));
    prms.date = prms.stdDate;
    resSend = await axios.post(endPoint(), comMod.uPrms(prms));
    if (resSend.status !== 200)  throw resSend;
    if (!resSend.data) throw resSend;
    delete prms.dt; // 無駄な送信を防ぐために削除
    // csvの作成
    prms.a = 'csvgen';
    prms.rnddir = comMod.randomStr(20, 0);
    prms.prefix = (prms.prefix)? prms.prefix.substr(0, 3): 'AAA';
    resCsv = await axios.post(endPoint(), comMod.uPrms(prms));
    if (resCsv.status !== 200)  throw resCsv;
    if (!resCsv.data) throw resCsv;
    // 終了フラグのセット
    resSend.done = true; resCsv.done = true;
    setRes({resSend, resCsv});
  }
  catch (e) {
    setRes({resSend, resCsv, e, error: true});
  }
}

const convertToCsvBlob = (data, fileName, label) => {
  const csvContent = data
    .map(row =>
      row.map(value => (value === undefined ? '""' : `"${value}"`)).join(',')
    )
    .join('\n');

  const unicodeArray = Encoding.stringToCode(csvContent + '\n');
  const encodedArray = Encoding.convert(unicodeArray, {
    to: 'SJIS',
    from: 'UNICODE',
  });

  const blob = new Blob([new Uint8Array(encodedArray)], { type: 'text/csv' });
  const downloadUrl = URL.createObjectURL(blob);
  return { blob, downloadUrl, fileName, label };
};

const processTransferDataToCsv = async (prefix, stdDate, transferData, setRes, toZip, useKanji, addDateTime) => {
  const month = stdDate.slice(2, 7).replace('-', '');
  const useBid = Number(comMod.getUisCookie(comMod.uisCookiePos.noPrefixUseBid));
  if (useBid && prefix === 'AAA') prefix = getLS('bid');
  const pm = prefix.toUpperCase().slice(0, 3) + month;

  const addRevNo = Number(comMod.getUisCookie(comMod.uisCookiePos.addRevNoToSendFineNmae));
  const revStr = addRevNo ? rev : '';
  const now = new Date();
  const dateTimeStr = addDateTime ? `-${String(now.getFullYear()).slice(2)}${('0' + (now.getMonth() + 1)).slice(-2)}${('0' + now.getDate()).slice(-2)}-${('0' + now.getHours()).slice(-2)}${('0' + now.getMinutes()).slice(-2)}` : '';

  const seikyuu = useKanji? '請求': 'SEIKYUU';
  const jougen = useKanji? '上限管理': 'JOUGEN';
  const teikyou = useKanji? '提供実績': 'TEIKYOU';
  try {
    const files = [
      { data: transferData.useResult, fileName: `${pm}${teikyou}${revStr}${dateTimeStr}.csv`, label: '提供実績' },
      { data: transferData.upperLimit, fileName: `${pm}${jougen}${revStr}${dateTimeStr}.csv`, label: '上限管理' },
      { data: transferData.billing, fileName: `${pm}${seikyuu}${revStr}${dateTimeStr}.csv`, label: '請求' },
    ].filter(file => file.data.length > 0);

    const fileBlobs = files.map(file =>
      convertToCsvBlob(file.data, file.fileName, file.label)
    );

    let downloadLinks = [];

    downloadLinks = fileBlobs.map(({ downloadUrl, fileName, label }) => ({
      downloadUrl,
      fileName,
      label,
    }));
    if (toZip) {
      const zip = new JSZip();
      fileBlobs.forEach(({ blob, fileName }) => {
        zip.file(fileName, blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      downloadLinks.push({
        downloadUrl: zipUrl,
        fileName: `${pm}全て${revStr}.zip`,
        label: '一括ダウンロード',
        zip: true,
      });
    }
    setRes({ downloadLinks });
  } catch (error) {
    console.error('Error during CSV processing:', error);
    setRes({ error: true, errorDetails: error });
  }
};


const sendAndMakeCsv = (prms, userList, manualJougenKubun, jougenKubun, blob = false, toZip = false, useKanji, addDateTime) => {
  const {stdDate, schedule, users, com, service, dispatch, setRes} = prms;
  prms.calledBy = 'sendAndMakeCsv';
  let { billingDt, masterRec, result, errDetail } = setBillInfoToSch(prms, userList);
  // 兄弟上限判定のためにここではbillingDtを全件取得する
  let { billingDt: allBillingDt, schTmp} = setBillInfoToSch(prms);
  // 利用なしのデータをここで削除
  billingDt = billingDt.filter(e=>e.tanniTotal);
  const jino = com.jino;
  const bid = com.bid;
  const hid = com.hid;
  // prefixに全角が入ったときの処理
  const prefix = (()=>{
    if (!com.fprefix)  return 'AAA';
    if (/[^\x00-\x7F]/.test(com.fprefix)) return 'AAA';
    return com.fprefix;
  })();
  console.log(prefix)
  const billing = makeBiling(
    billingDt, allBillingDt, masterRec, schedule, users, userList
  );
  const upperLimit = makeJugenkanri(
    {billingDt, masterRec, jougenKubun, manualJougenKubun, users, schedule, stdDate, allBillingDt}
  );
  const useResult = makeTeikyouJisseki(billingDt, masterRec, stdDate);
  const transferData = { 
    useResult, 
    upperLimit, billing, jino, bid, hid
  };
  const apiPrms = {hid, bid, stdDate,  prefix};
  // if (!result){
  //   dispatch(Actions.setSnackMsg(errDetail.description, 'error', 'B236711'));
  // }
  // dispatch(Actions.setStore({ billingDt, masterRec }));
  if (!blob){
    sendAndMakeCsvApiCall(apiPrms, transferData, setRes);
  }
  else{
    // blob作成
    processTransferDataToCsv(prefix, stdDate, transferData, setRes, toZip, useKanji, addDateTime)
  }
  
}

// 兄弟設定がされているかどうかのアラートを表示する。
// 現状、されているかどうかだけの表示
// props.brosはusersで兄弟設定がされている利用者の配列
const BrosInfo = (props) => {
  const {bros, ...othes} = props;
  const st = {
    width:'100%', textAlign:'center',padding:8,fontWeight:600,
    color: red[900],fontSize: '.8rem',
  }
  if (bros.length){
    return(
      <div style={st}>
        兄弟設定が行われている利用者の上限管理情報は国保連に送付するデータの作成は行われません。
      </div>
    )
  }
  else{
    return null;
  }
}

const Billing = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const stdDate = useSelector(state => state.stdDate);
  const schedule = useSelector(state => state.schedule);
  const users = useSelector(state => state.users);
  const com = useSelector(state => state.com); // 会社と事業所の情報
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const serviceItems = useSelector(state => state.serviceItems);
  const service = useSelector(state => state.service);
  const sendStatus = useSelector(state => state.sendTransferStatus);
  const allState = useSelector(state=>state);
  // const sBillingDt = useSelector(state=>state.billingDt);
  const billingDt = useSelector(state=>state.billingDt);
  const masterRec = useSelector(state=>state.masterRec);
  const account = useSelector(state=>state.account);
  const permission = comMod.parsePermission(account)[0][0];
  // 請求の存在するUIDのリスト
  // 受給者証番号が正常ではない場合は請求データを作成しない
  const billedUserIds = (Array.isArray(billingDt) ? billingDt : [])
    .filter(e=>e.tanniTotal && e.hno.length === 10)
    .map(e=>e.UID.replace(/\D/g, ""))
  const [dialogOpen, setDialogOpen] = useState('');
  const [userList, setUserList] = useState(
    // 受給者証番号が仮の利用者はcheckedをfalseにする
    // 国保連に請求しない利用者はcheckedをfalseにする
    users.filter(e => String(e.hno).length === 10 && !e?.etc?.sochiseikyuu).map(e => ({ 
      uid: e.uid, checked: true
    }))
  );
  const [toZip, setToZip] = useState(
    Number(comMod.getUisCookie(comMod.uisCookiePos.allDowmloadAsZip)) === 1
  )
  const [useKanji, setUseKanji] = useState(
    Number(comMod.getUisCookie(comMod.uisCookiePos.useKanjiToDownloadFile)) === 1
  )
  const [addDateTime, setAddDateTime] = useState(
    Number(comMod.getUisCookie(comMod.uisCookiePos.addDateTimeToFileName)) === 1
  )
  const [useOldMethod, setUseOldMethod] = useState(
    Number(comMod.getUisCookie(comMod.uisCookiePos.useOldMethodMakeDownloadFile)) === 1
  )

  const loadingStatus = comMod.getLodingStatus(allState);
  const tService = service? service: serviceItems[0];
  const comAdic = comMod.findDeepPath(com, ['addiction', tService]);  
  // 相談支援かどうかのフラグ
  const isSoudan = [SYOUGAI_SOUDAN, KEIKAKU_SOUDAN].includes(tService);
  // 法改正中の保留
  // const suspendLowChange = useSuspendLowChange();
  const scheduleLoked =  stdDate < '2024-07-01' ? true : schedule?.locked;
  // 次月以降で無いと処理をしない
  const stdDateObj = new Date(stdDate);
  const today = new Date();
  const targetDate = new Date(stdDateObj.getFullYear(), stdDateObj.getMonth() + 1, 1)
  const isNextMonthOrLater = today >= targetDate;
  const lsName = 'billingCurrent';

  // csv送信用のレスポンス
  const [res, setRes] = useState({resSend:{},resCsv:{}});
  const [csvUrl, setCsvUrl] = useState({});
  // 上限管理区分設定用
  const [manualJougenKubun, setManualJougenKubun] = useState(1);

  const [rebillingStates, setRebillingStates] = useState(false);
  const [jougenKubun, setJougenKubun] = useState(false);

  const [userSelectLsName, setUserSelectLsName] = useState('billing');

  useEffect(() => {
    if (rebillingStates && Object.keys(rebillingStates).length > 0) {
      setUserSelectLsName(false);
    } else {
      setUserSelectLsName('billing');
    }
  }, [rebillingStates]);

  const fetchRebillingState = async () => {
    const prms = {
      date: stdDate, hid, bid,
      item: 'rebilling', a: 'fetchAnyState',
    };
    const res = await univApiCall(prms, 'E976233');
    if (res?.data?.dt?.[0]?.state) {
      const { 
        rebillingStates: savedRebillingStates, jougenKubun: savedJougenKubun 
      } = res?.data?.dt?.[0]?.state;
      setRebillingStates(savedRebillingStates || {});
      setJougenKubun(savedJougenKubun || {});
    }
  };

  useEffect(() => {
    if (!rebillingStates) {
      fetchRebillingState();
    }
  }, [stdDate, hid, bid]);



    const thisMonth = stdDate.split('-')[0] + '年' + stdDate.split('-')[1] + '月';
  
  const str = thisMonth + 'のデータ伝送をリクエストします。よろしいですか？'

  // calledBy対応済み
  // const { billingDt, masterRec, result, errDetail } = loadingStatus.loaded
  // ? setBillInfoToSch(prms) : {billingDt: null, masterRec: null, result: null, errDetail: null}                                                               

  useEffect(() => {
    if (!loadingStatus.loaded) return;
    const ls = getLS(lsName);
    // 既に保持済みなら何もしない
    if (ls && billingDt) return;
    
    // prmsをuseEffect内で作成（依存配列の問題を避けるため）
    const prms = {
      stdDate, schedule, users, com, 
      service, 
      serviceItems,
      calledBy: 'Billing',
      dispatch, setRes,
    };
    
    const s = setBillInfoToSch(prms);
    // 同一内容ならdispatchしない（再レンダー連鎖防止）
    const sameBilling = JSON.stringify(s.billingDt) === JSON.stringify(billingDt);                                                                              
    const sameMaster = JSON.stringify(s.masterRec) === JSON.stringify(masterRec);                                                                               
    if (!sameBilling || !sameMaster) {
      dispatch(Actions.setStore({billingDt: s.billingDt, masterRec: s.masterRec}));                                                                             
    }
    if (!ls) setLS(lsName, true);
    return () => {
      setTimeout(()=>{
        const closed = !document.querySelector('#billingDtPageCurrent1123');
        if (closed){
          removeLocalStorageItem(lsName) 
        }
      }, 300)
    }
  }, [loadingStatus.loaded, stdDate]); // stdDateのみを依存配列に含める（月が変わったときに再計算）
  // rebillingStatesによりuserListを制御する
  useEffect(()=>{
    // rebillingStatesがnull/undefined/空オブジェクトのときは何もしない
    if (!rebillingStates || Object.keys(rebillingStates).length === 0) return;
    const newUserList = userList.map(e=>{
      const nUid = convUid(e.uid).n;
      const thisRebillingState = rebillingStates[nUid];
      if (thisRebillingState) {
        return {uid: e.uid, checked: true};
      }
      else {
        return {uid: e.uid, checked: false};
      }
    })
    setUserList(newUserList);
  }, [rebillingStates])
  // const clickHandler = ()=>{
  //   console.log('clicked');
  //   makeAndSend(prms);
  // }
  // csv作成のレスポンス監視
  useEffect(()=>{
    if (res.resCsv && res.resCsv.done && res.resCsv.status === 200){
      try{
        const csvDt = res.resCsv.data;
        const zipAddr = csvDt.zip.replace(csvDt.root, '');
        const upperLimitAddr = csvDt.upperLimit.replace(csvDt.root, '');
        const useResultAddr = csvDt.useResult.replace(csvDt.root, '');
        const billingAddr = csvDt.biling.replace(csvDt.root, '');
        setCsvUrl({
          zip: CSVSURL + zipAddr,
          upperLimit: CSVSURL + upperLimitAddr,
          useResult: CSVSURL + useResultAddr,
          billing: CSVSURL + billingAddr,
          useResultLen: csvDt.useResultLen,
          upperLimitLen: csvDt.upperLimitLen,
          bilingLen: csvDt.bilingLen,
          result: true,
        });
        // 30秒でリンク消失させる
        setTimeout(() => {
          setCsvUrl({});
        }, 30 * 1000);
      }
      catch(e){
        setCsvUrl({result: false,})
      }
    }
  },[res]);
  // userlistを監視。変更されたらcsvurlを破棄する
  useEffect(()=>{
    setCsvUrl({});
  },[userList]);

  // 基本設定項目の確認
  if (loadingStatus.loaded && !comAdic){
    return(
      <StdErrorDisplay 
        errorText = '請求設定項目が未設定です。'
        errorSubText = {
          `請求開始に必要な基本設定項目がありません。設定メニューの「請求・加算」から定員や地域区分などを設定して下さい。`
        }
        errorId = 'E49423'
      />
    )
  }
  

    // csv作成
  const callCsv = () => {
    // prmsを呼び出し時に作成（最新の値を使用）
    const prms = {
      stdDate, schedule, users, com, 
      service, 
      serviceItems,
      calledBy: 'Billing',
      dispatch, setRes,
    };
    sendAndMakeCsv(prms, userList, manualJougenKubun, jougenKubun, false, toZip, useKanji, addDateTime);
  }
  const callCsvBlob = () => {
    // prmsを呼び出し時に作成（最新の値を使用）
    const prms = {
      stdDate, schedule, users, com, 
      service, 
      serviceItems,
      calledBy: 'Billing',
      dispatch, setRes,
    };
    sendAndMakeCsv(prms, userList, manualJougenKubun, jougenKubun, true, toZip, useKanji, addDateTime);                                                                      
  }
  const jougenOptionsVal = [
    {name: '新規', value: 1},
    {name: '修正', value: 2},
    {name: '削除', value: 3},
  ];
  const jougenOptions = jougenOptionsVal.map(e=>{
    return(
      <option key={e.value} value={e.value}>{e.name}</option>
    );
  });


  // 手動上限管理区分のセレクター
  // 再請求設定データが存在するときは表示しない
  const ManualJougenKubunSelector = () => {
    if (jougenKubun && Object.keys(jougenKubun).length > 0) return null;
    return (
      <div style={{textAlign:'center'}}>
        <FormControl style={{margin: 8, minWidth: 150}}>
          <InputLabel >上限管理作成区分</InputLabel>
          <Select
            native
            value={manualJougenKubun}
            name={'manualJougenKubun'}
            onChange={(e) => handleChange(e)}
          >
            {jougenOptions}
          </Select>
        </FormControl>
      </div>
    )
  }

  const DisplayRebilling = () => {
    if (!rebillingStates || Object.keys(rebillingStates).length === 0) return null;
    return (
      <div style={{textAlign: 'center', color: teal[800]}}>
        {`${Object.keys(rebillingStates).length}件の再請求データを作成します。`}
        <Button
          onClick={()=>{
            setRebillingStates({});
            setJougenKubun({});
          }}
          style={{
            fontSize: '1.0rem',
            color: red[800],
          }}
        >
          リセット
        </Button>
      </div>
    )
  }


  const handleChange = (ev) => {
    const val = ev.currentTarget.value;
    setManualJougenKubun(val);
  };

  // 送付処理を行うかどうか。送付済みのときはボタン自体が表示されないはず。
  const TransferButtons = () => {
    const bros = users.filter(e=>e.brosIndex);
    console.log(csvUrl, 'csvUrl');
    const kyoudaiStr = (stdDate < '2025-04-01')? "送信する利用者がきょうだい児の場合、": "";
    const NotExistJougen = () => (
      <div className={classes.billingNotice}>
        送信する上限管理情報はありません。
        <div className='small'>
          {kyoudaiStr}当事業所が管理事業所の利用者の請求がない場合など、上限管理情報の送信は必要ありません。ここではファイルが作成されません。
        </div>
      </div>
    )

    const UserSelectedNotice = () => {
      // 選択されている利用者数で請求がある人数
      const userSelected = userList.filter(e=>e.checked).filter(e=>billedUserIds.includes(e.uid)).length;
      const allCount = userList.filter(e=>billedUserIds.includes(e.uid)).length;
      const style = userSelected < allCount? {color:red[800]}: {}
      return (
        <div className={classes.billingNotice} style={style}>
          {`請求件数${allCount}件中${userSelected}件のデータが作成対象です。`}
        </div>
      )
    }
    
    const infoCmpStyle = {fontSize: '1em', textAlign: 'center', paddingTop: 8};

    return(<>
      <LinksTab menu={getBillingMenu(account, com)} />
      <div id='billingDtPageCurrent1123'></div>
      <div style={{height: 80}}></div>
      {/* {(permission === 100  || stdDate >= '2023-08-01') &&
        <CheckBillingEtc billingDt={billingDt} />
      } */}
      {(stdDate < '2023-08-01') &&
        <CheckProgress inline billingDt={billingDt} />
      }
      <StrongWarning billingDt={billingDt} />
      {/* <CheckProgress inline /> */}
      {/* <BrosInfo bros={bros} /> */}
      <div className={classes.infoWrapper}>
        <JichiJoseiInfo style={infoCmpStyle} masterRec={masterRec} billingDt={billingDt}/>
        <JihatsuMusyouInfo style={infoCmpStyle} />
      </div>
      <div className="AppPage account">
        <div className={'billingPanel short ' + classes.createCsv}>
          {Object.keys(csvUrl).length === 0 && !res?.downloadLinks && (scheduleLoked || permission === 100) && <>
            <mui.ButtonGP
              color='primary'
              label='伝送データ作成'
              onClick={callCsvBlob}
            />
            <span style={{marginInlineStart: 16}}></span>
            {useOldMethod &&
              <mui.ButtonGP
                label='伝送データ作成・旧'
                onClick={callCsv}
              />
            }
            
          </>}
          
          {/* {Object.keys(csvUrl).length === 0 && !res?.downloadLinks && (scheduleLoked || permission === 100) && permission !== 100 &&
            <span style={{color: red[800], fontWeight: 600}}>一時的に請求処理を制限しています。制限解除は5月5日頃を予定しています。</span>
          } */}
          {scheduleLoked !== true && isNextMonthOrLater &&
            <span style={{color: red[800], fontWeight: 600}}>確定処理を行って下さい。</span>
          }
          {
            isNextMonthOrLater !== true &&            
            <span style={{color: red[800], fontWeight: 600}}>まだ請求できません。</span>
          }
          {(Object.keys(res?.downloadLinks || {}).length > 0) && <>
            <BlobDownload downloadLinks={res.downloadLinks} toZip={toZip} setRes={setRes}/>
            {(res?.downloadLinks && !res.downloadLinks.find(e=>e.label==='上限管理')) && 
              <NotExistJougen/>
            }
          </>}
          <UserSelectedNotice/>
          {(Object.keys(csvUrl).length > 0 && csvUrl.result) && <>
            <a href={csvUrl.zip} className={classes.dlBtn}>
              <mui.ButtonGP
                color='secondary'
                label='一括ダウンロード'
              />
            </a>
            <a href={csvUrl.billing} className={classes.dlBtn}>
              <mui.ButtonGP
                // color='secondary'
                label='請求'
              />
            </a>
            <a href={csvUrl.upperLimit} className={classes.dlBtn}>
              {(csvUrl.upperLimitLen) > 0 &&
                <mui.ButtonGP
                  // color='secondary'
                  label='上限管理'
                />
              }
            </a>
            {!isSoudan &&
              <a href={csvUrl.useResult} className={classes.dlBtn}>
                <mui.ButtonGP
                  // color='secondary'
                  label='提供実績'
                />
              </a>
            }
            {(csvUrl.upperLimitLen === 0) && 
              <NotExistJougen/>
            }
          </>}
          {}
          {(Object.keys(csvUrl).length > 0 && !csvUrl.result) &&
            <div>通信エラーが発生しています。通信状況を見直しして再度実行して下さい。
              何度も発生するようならサポートに連絡をお願いします。
            </div>
          }
        </div>
        {/* <SalesAccordion /> */}
        <ManualJougenKubunSelector />
        <DisplayRebilling />
        {/* <ServiceCountNotice /> */}
        {/* <CallDispHint/> */}
      </div>
      {(Object.keys(res?.downloadLinks || {}).length === 0) && <>
        <div>
          <SetUisCookieChkBox
            style={uisCookieChkBoxStyle}
            setValue={setToZip}
            p={comMod.uisCookiePos.allDowmloadAsZip}
            label='一括ダウンロードは圧縮フォルダとしてダウンロードする'
          />
          <SetUisCookieChkBox
            style={uisCookieChkBoxStyle}
            setValue={setUseKanji}
            p={comMod.uisCookiePos.useKanjiToDownloadFile}
            label='ダウンロードファイル名に漢字を使う'
          />
          <SetUisCookieChkBox
            style={uisCookieChkBoxStyle}
            setValue={setAddDateTime}
            p={comMod.uisCookiePos.addDateTimeToFileName}
            label='ファイル名に日時を追加する'
          />
          <SetUisCookieChkBox
            style={uisCookieChkBoxStyle}
            setValue={setUseOldMethod}
            p={comMod.uisCookiePos.useOldMethodMakeDownloadFile}
            label='古い方法でファイルを作成可能にする'
          />

        </div>
      </>}
    </>)
  }
  const TransferLoading = () =>(
    <div className="AppPage account">
      <div className="billingPanel">送信中です。</div>
    </div>
  )
  const TransferErr = () => (
    <div className="AppPage account">
      <div className="billingPanel">送信エラーが発生しています。</div>
    </div>
  )
  const setUseResultStyle = {width: 180, top: 136, right: 20}
  const userSelectProps = {
    userList, setUserList, dialogOpen, setDialogOpen, 
    style: {top: 84}, dispAll: true, 
    lsName: userSelectLsName,
  }
  if (permission < 90) return <PermissionDenied marginTop='120' />
  
  if (!loadingStatus.loaded)  return <LoadingSpinner/>
  else if (!sendStatus.done) return (<>
    {/* <UserSelectDialog
      open={dialogOpen} setOpen={setDialogOpen}
      userList={userList} setUserList={setUserList}
    /> */}
    <SetUseResult style={setUseResultStyle} billingDt={billingDt} masterRec={masterRec}/>
    <UserSelectDialogWithButton {...userSelectProps} />
    <TransferButtons />
    {permission === 100 && <>
      <SetUisCookieChkBox
        style={uisCookieChkBoxStyle}
        p={comMod.uisCookiePos.addRevNoToSendFineNmae}
        label='ファイル名にレビジョンを含める'
      />
      <SetUisCookieChkBox
        style={uisCookieChkBoxStyle}
        p={comMod.uisCookiePos.noPrefixUseBid}
        label='prefixが無いときはbidの一部を使用する'
      />
    </>}
    {/* <SetUisCookieChkBox
      style={{textAlign: 'center'}}
      p={comMod.uisCookiePos.allDowmloadAsZip}
      label='一括ダウンロードは圧縮フォルダとしてダウンロードする'
    /> */}
    <SchHohouDuplicateCheckAndDelete style={{ margin: '40px auto' }} />
  </>)
  else if (sendStatus.loading) return <TransferLoading />
  else if (sendStatus.done && !sendStatus.err) return (<>
    {/* <UserSelectDialog 
      open={dialogOpen} setOpen={setDialogOpen}
      userList={userList} setUserList={setUserList}
    /> */}
    <SetUseResult style={setUseResultStyle}/>
    <UserSelectDialogWithButton {...userSelectProps} />
    {/* <TransferDone /> */}
  </>)
  else if (sendStatus.done && sendStatus.err) return <TransferErr />
}

export default Billing;