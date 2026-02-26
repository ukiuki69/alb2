import React, { useEffect, useRef, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from "react-router-dom";
import * as Actions from '../../Actions.js';
import * as comMod from '../../commonModule.js';
import { HOHOU } from '../../modules/contants';
import * as albCM from '../../albCommonModule.js';
import Button from '@material-ui/core/Button';
import { setBillInfoToSch } from '../Billing/blMakeData.js';
import { proseedByUsersDt } from '../Billing/makeProseedDatas.js'
import { endPoint } from '../../modules/api';
import axios from 'axios';
import { LoadingSpinner,  LoadErr ,StdErrorDisplay } from '../common/commonParts.js';
import { RecalcButton } from '../Billing/RecalcButton.js';
import { didPtn } from '../../modules/contants';
import useInterval from 'use-interval';
import GroupIcon from '@material-ui/icons/Group';
import SnackMsg from '../common/SnackMsg.js';
import Invoice from './Invoice.js';
import TuusyokyuuhuMeisai from './NewTuusyokyuuhuMeisai.js';
// import TuusyokyuuhuMeisai from './TuusyokyuuhuMeisai';
import ReportJougenKanri from './JougenKanri.js';
import TeikyouJisseki from './TeikyouJisseki.js';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import PrintIcon from '@material-ui/icons/Print';
import CloseIcon from '@material-ui/icons/Close';
import { SelectGp } from '../common/FormPartsCommon.js'
import {DateInput} from '../common/StdFormParts.js';
import CheckProgress from '../common/CheckProgress.js';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import ServiceCountNotice from '../Billing/ServiceCountNotice.js';
import { blue, orange, red, teal, yellow } from '@material-ui/core/colors';
import AssignmentReturnedIcon from '@material-ui/icons/AssignmentReturned';
import GridOnIcon from '@material-ui/icons/GridOn';
import { KESSEKI_SVC_CODE } from "../Billing/BlCalcData.js";
import TokyoDairiTsuchi from './TokyoDairiTsuchi.js';
import InvoiceWithCopy from './InvoiceWithCopy.js';
import {LinksTab} from '../common/commonParts.js';
import Kyuhuhi from './Kyuhuhi.js';
import ScheduleListByUser from './ScheduleListByUser.js';
import { CalendarPerUsersSetting, ReportsSettingButton } from './ReportsSetting.js';
import UserContractReports from './UsersContractReport.js';
import { CheckBillingEtc } from '../Billing/CheckBillingEtc.js';
import { KobeJogenKanri } from './KobeJogenKanri.js';
import { KobeFutanIchiran } from './KobeFutanIchiran.js';
import { KyotoJogenKnari } from './NewKyotoJogenKanri.js';
import { ReportPrintButton } from './ReportPrintButton.js';
import { TeikyouJisseki2024 } from './TeikyouJisseki2024.js';
import { NotDispLowCh, useSuspendLowChange } from '../common/useSuspendLowChange.js';
import { TimeTableReports } from './TimeTableReports.js';
import { LC2024, seagull } from '../../modules/contants.js';
import { CALC2024,  } from '../../Rev.js';
import SetPrintTitle from '../common/SetPrintTitle.js';
import { LOCAL_STRAGE_PRINT_TITLE, setLS } from '../../modules/localStrageOprations.js';
import UserSelectDialogWithButton, { UserSelectDialog } from '../common/UserSelectDialogWithButton.js';
import { Assessment, AssessmentSheet } from './Assessment.js';
import { PersonalSupport, PersonalSupportSheet } from './PersonalSupport.js';
import { ConferenceNote, ServiceStaffMeeting } from './ConferenceNote.js';
import { Monitoring } from './Monitoring.js';
import { MonitoringHohou } from './MonitoringHohou.js';
import { MonitoringSenmon } from './MonitoringSenmon.js';
import EmailIcon from '@material-ui/icons/Email';
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';
import { AlbHMuiTextField, PdfCard, useLocalStorageState } from '../common/HashimotoComponents.js';
import { generatePdfBlob } from '../ContactBook/CntbkSendReports.js';
import { sendPdfs } from '../ContactBook/CntbkCommon.js';
import { checkValueType } from '../dailyReport/DailyReportCommon.js';
import CheckIcon from '@material-ui/icons/Check';
import CircularProgress from '@material-ui/core/CircularProgress';
import { forEach } from 'jszip';
import { useHistory, useLocation } from 'react-router-dom';
import { SenmonShien } from './SenmonShien.js';
import { PREV_PLANPAGE_SEARCH_SESSIONSTORAGE_KEY } from '../plan/planCommonPart.js';
import AddIcon from '@material-ui/icons/Add';
import { PrintSettingsButton } from './PrintSettings.js';

// const DOCSURL = "http://153.127.61.191/docs";
const DOCSURL = "https://rbatosdata.com/docs";
const ERASE_INTVL = 1 * 1000; // 消去確認用のループインターバル
const ERASE_ERT = 30 * 1000; // リンク消去する経過時間
// 売上関連レポートの発行権限
const PERMISSION_URIAGE = 90;
const PERMISSION_DEV = 100;

const useStyles = makeStyles({
  reportButton : {
    width: 160,
    height: 32,
  },
  dialogOpenButtonRoot:{
    position: 'fixed',
    top: 104,
    right: 16,
    '& .buttonText':{
      display: 'flex',
    },
    '& .buttonText soan':{
      display: 'block',
    },
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
  testDiv : {
    width: '60%',
    textAlign: 'center',
    margin: '0 auto',
    '& >a' : {
      display:'block',
      padding: 8,
      cursor: 'pointer',
    }
  },
  printCntRoot : {
    width : '80%',left: '10%',textAlign: 'center',margin: '0 auto',
    backgroundColor: '#ffffffcc',padding: 8,top: 96,position: 'fixed',
    // transform: 'translate(-50%, 0)',
    '& .MuiButtonBase-root' : {
      width: 200,margin : '0 8px',
      '& .MuiSvgIcon-root' : {marginInlineEnd: '8px',},
    },
    '& .subButtons' : {
      padding: 8,
      '& .MuiButtonBase-root': {width: 'auto',},
      textAlign: 'center',
    },
    '& .twoMonthsAgoWarning': {
      fontSize: '1.5rem', fontWeight: 'bold', color: orange[500],
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      pointerEvents: 'none', zIndex: 1000,
      backgroundColor: '#ffffffcc', padding: '16px 32px', borderRadius: 8,
      // border: `4px solid ${red["A700"]}`,
    }
  },
  setDateForm:{
    display:'flex',
    '& .MuiButtonBase-root':{
      height: 32,padding: 8,marginTop: 24,marginLeft:8,
    },
  },
  reportCreating:{
    display:'flex', justifyContent:'center',alignItems:'center',
    width: 160, height: 32, color:teal[400],
  },
  teikyoRadioForm: {
    '& .PrivateSwitchBase-root-106':{padding:'2px 9px'}
  },
  warningWrapper: {
    '@media print':{display: 'none'},
    position: 'fixed', top: 200, left: '50%', transform: 'translate(-50%, 0)',
    width: 500, padding: 16, borderRadius: 8,
    border: `3px ${red[600]} solid`, backgroundColor: '#fff',
    '& .msg': {
      lineHeight: '1.6rem', padding: '0 8px'
    },
    '& .userNameWrap': {
      display: 'flex', flexWrap: 'wrap',
      '& .userName': {margin: '12px 8px 0'}
    }
  },
  SendOtherOfficeMailDialog: {
    '& .explanation': {
      lineHeight: '24px',
      marginBottom: '16px'
    },
    '& .item': {
      margin: '16px 0',
      '& .info': {
        display: 'flex', flexWrap: 'wrap',
        '& .checkbox': {marginTop: '10px'},
        '& .jino, .bname': {marginTop: '24px'},
        '& .jino': {width: '112px', marginRight: '8px'},
        '& .bname': {minWidth: '160px', flex: 1,},
        '& .mailInput': {minWidth: '288px', flex: 1, padding: '0 14px'}
      },
      '& .sentHistory': {
        paddingLeft: '14px', marginBottom: '-16px',
        display: 'flex', alignItems: 'center',
        fontSize: '12.8px', color: blue[800]
      },
      '& .jinoSelectCheckbox': {
        '& .MuiSvgIcon-root': {fontSize: 24}
      }
    },
    '& .button': {width: '104px'}
  },
  buttonProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
});


// レポートを出力するボタンのリスト
// link: ダウンロードリンク格納用, 
// created: 作成時のタイムスタンプ, 
// countCheck: レポート作成前にデータ件数のカウントをチェックするかどうか
const nodesDef = [
  {
    discription: '利用者別売り上げ一覧',
    name: 'uribyuser1',
    selector: true,
    selectorOpt: ['標準', '利用なしも出力', '助成対応', '助成対応（利用なしも出力）'],
    link: '', created: 0, creating: false, countCheck: true,
    permission: 90, userCountLimit: 200,
  },
  {
    discription: '売上台帳',
    name: 'uriagedaityou',
    link: '', created: 0, creating: false, countCheck: true,
    permission: 90,
  },
  {
    discription: '月間予定表',
    name: 'refactoringSchedule',
    selector: true,
    selectorOpt: ['標準', '利用のみ', '開始時間のみ', '利用と送迎', '利用と開始 ', '5行タイプ'],
    link: '', created: 0, creating: false, countCheck: false,
    permission: 70,
  },
  // {
  //   discription: '月間予定表（旧）',
  //   name: 'monthriyou',
  //   link: '', created: 0, creating: false, countCheck: true,
  //   permission: 70, userCountLimit: 100,
  // },
  {
    discription: '利用確認表',
    name: 'riyoukakunin',
    selector: true,
    selectorOpt: ['標準', '実費明細'],
    link: '', created: 0, creating: false, countCheck: true,
    permission: 90,
  },
  {
    discription: '利用者一覧',
    name: 'userList',
    link: '', created: 0, creating: false, countCheck: false,
    permission: 80,
  },
];

const refactoringScheName = {
  '標準': 'refactoringSchedule', '利用のみ': 'rfSch1Line1', '開始時間のみ': 'rfSch1Line2',
  '利用と送迎': 'rfSch2Line1', '利用と開始 ': 'rfSch2Line2', '5行タイプ': 'rfSch5Line',
}
const uribyuserExcelName = {'標準': 'uribyuser1', '利用なしも出力': 'uribyuser2', '助成対応': 'uribyuser1dokuji', '助成対応（利用なしも出力）': 'uribyuser2dokuji'}

// 利用確認用のメインデータ領域（二次元配列）作成
// makeExcelReportDtが大きくなりすぎなので分割
const riyouKakunin = (prms) => {
  const {
    billingDt, masterRec, dateList, com, service, account, users=[], stdDate, 
    dataLayout, classroom, selects
  } = prms;
  // 実費の明細を出すかどうか
  const jippiMeisai = selects.利用確認表 === '実費明細';
  // 明細行の作成
  const makeDetail = (oneUser) => {
    const items = oneUser.itemTotal;
    // itemTotalから利用されているアイテムを抽出してソート
    // baseItemを先頭に持ってくる
    items.sort((a, b)=>{
      if (a.baseItem && !b.baseItem) return -1;
      if (!a.baseItem && b.baseItem) return 1;
      if (a.s > b.s) return 1;
      if (a.s < b.s) return -1;
    });
    // 利用されているdidの配列を作っておく
    const dids = Object.keys(oneUser).filter(e=>e.match(didPtn))
    // 利用されている実費項目の配列を得る
    const acItemsAry = dids.reduce((items, e)=> {
      items.push(...Object.keys(oneUser[e]?.actualCost ?? []));
      return items;
    }, []);
    // 実費項目配列をユニークにする
    const unqAcAtems = Array.from(new Set(acItemsAry));
    // console.log(unqAcAtems, 'unqAcAtems');
    // 加算項目を見出し（二列目）に持つ配列を作成
    // 一回あたり単位数、回数、単位数などを配置
    const len = 38;
    const row = Array(len).fill('');
    const rows = items.map(e=>{
      const r = [...row];
      r[1] = e.c; // サービス名
      r[2] = e.v; // 一回単位数
      r[len - 4] = e.count; // 回数
      r[len - 2] = parseInt(e.tanniNum);
      r[len - 1] = Math.round(e.tanniNum * masterRec.unitPrice);
      return (r); 
    });
    // 実費の行を追加
    const r = [...row];
    r[1] = "実費";
    r[len - 3] = oneUser.actualCost
    rows.push(r);
    if (jippiMeisai){
      // 実費明細を出力する場合、明細項目の行を作る
      unqAcAtems.forEach(item => {
        const r = [...row];
        r[1] = "　" + item;
        rows.push(r);
      });
    }
    // 実費のアイテムごとの合計を求める
    const AcItemsTotal = unqAcAtems.reduce((o, item)=>{
      const itemTotal = dids.reduce((v, did)=>{
        v += parseInt(oneUser[did]?.actualCost?.[item]) || 0;
        return v;
      }, 0)
      o[item] = itemTotal;
      return o;
    }, {})
    console.log(AcItemsTotal, 'AcItemsTotal');    
    // 開始と終了の行を追加
    const startRow = [...row];
    const endRow = [...row];
    startRow[1] = "開始";
    endRow[1] = "終了";
    rows.unshift(endRow);
    rows.unshift(startRow);

    const p = 3 - 1; // 1日のカラム位置 - 1
    // 請求データ日付オブジェクトを舐める
    dids.map(e=>{
      // 配列の日付セルの処理
      const o = oneUser[e];
      const d = parseInt(e.slice(7, 9)); // 日付を取得 D20211212 -> 12
      // 開始と終了の処理 値が入っていないことがあるっぽいのでフック
      rows[0][d + p] = o.start? o.start.replace(':', ''): '';
      rows[1][d + p] = o.end? o.end.replace(':', ''): '';
      // 実費の処理
      let v = 0;
      Object.keys(o.actualCost ?? {}).map(f=>{v += parseInt(o.actualCost[f]);});
      const jippiRow = rows.findIndex(e=>e[1] === "実費")
      rows[jippiRow ][d + p] = v;
      // 実費明細の処理
      if (jippiMeisai){
        unqAcAtems.forEach(item=>{
          const itemP = rows.findIndex(e=>e[1] === "　" + item);
          rows[itemP][d + p] = parseInt(o.actualCost?.[item]) ?? '';
          // 明細ごとの承継を処理
          rows[itemP][len - 3] = AcItemsTotal[item];          
        })

      }
      o.items.map(f=>{
        const n = f.c; // アイテム名
        const i = rows.findIndex(g=>g[1] === n); // アイテム名が含まれた行を特定
        if (f.syoguu) return false;
        // 配列の日付セルを特定する
        if (i >= 0 && d > 0){
          // 値が入っていたら加算する入っていなかったら1を入れる
          rows[i][d + p] = (rows[i][d + p])? rows[i][d + p] + 1: 1;
        };
      });
    });
    // 合計行の作成
    const userTotal = [...row];
    userTotal[1] = '利用者計';
    userTotal[len - 1] = oneUser.userSanteiTotal;
    rows.push(userTotal);
    rows.push(row);
    // サービス名称末尾の・を削除
    rows.map(e=>{e[1] = e[1].replace(/・$/, '');});
    // 行配列の末尾を削除。 条件付き書式が設定され見苦しいため。
    return rows;
  };
  // リターン値用のデータ
  const dt = [];
  const tmpBdt = billingDt.filter(e=>e.userSanteiTotal)
  // この状態でのユーザーズ配列はサービスとクラスルームで
  // フィルタされた配列になっている
  // なので請求データもこの配列に従ってフィルタをかける
  .filter(e=>{
    const nuid = e.UID.replace('UID', '');
    return users.some(f=>f.uid === nuid);
  })
  tmpBdt.map((e, i)=>{
    // ユーザヘッダ行の出力
    const s = '保護者 : ' + e.pname + '・ 受給者証番号 : ' + e.hno;
    dt.push([i + 1, e.name, s,]);
    // 明細行の出力
    const rows = makeDetail(e);
    dt.push(...rows);
  });
  dt.pop(); // 末尾の1行削除
  return dt;
}

// requestReportで送信するデータを作成する
// dataがあるデータは1シート形式で作成
// sheetsがあるデータは複数シートのブックとして作成するように
// サーバー側で処理を行う
const makeExcelReportDt = (prms) => {
  const {
    billingDt, masterRec, dateList, com, service, account, users, stdDate, 
    dataLayout, classroom, setmsg, setseverity, schedule, selects
  } = prms;
  // const {} = prms;
  // Python側で定義されているラベル
  // ONECELLARIAS = [
  //   'label', 'label0', 'label1', 'label2', 'label3',
  //   'date', 'datetime', 'cname', 'scname', 'bname', 'sbname',
  //   'month', 'username'
  // ]
  // billingDtにsindexを付与
  const fUsers = users
  .filter(e=>albCM.isClassroom(e, classroom))
  .filter(e=>(service === '' || new RegExp(service).test(e.service)));
  const sindexCount = new Set(fUsers.map(e=>e.sindex)).size;
  if (sindexCount !== fUsers.length){
    setmsg('ユーザーの並び順が不安定です。並び替えを実施して下さい。');
    setseverity('warning');
  }
  billingDt.forEach(e=>{
    const u = users.find(f=>f.uid === e.UID.replace('UID', ''));
    if (u)  e.sindex = u.sindex;
    else e.sindex = 999999;
  });
  billingDt.sort((a, b)=>(parseInt(a.sindex)<parseInt(b.sindex)? -1: 1))
  const content = {};
  const month = stdDate.substr(0, 4) + "年" + stdDate.substr(5, 2) + "月";
  content.date = comMod.formatDate(new Date(), 'YYYY年MM月DD日');
  content.datetime = comMod.formatDate(new Date(), 'YYYY年MM月DD日 hh時mm分');
  // 先頭や末尾の空白文字を削除。事業所名など
  content.cname = (com?.ext?.hname || com.hname).replace(/^\s+|\s+$/g, '');
  content.scname = com.shname.replace(/^\s+|\s+$/g, '');
  content.bname = com.bname.replace(/^\s+|\s+$/g, '');
  content.sbname = com.sbname.replace(/^\s+|\s+$/g, '');
  
  content.month = month;
  content.service = service;
  content.classroom = classroom;
  content.serviceclass = (service && classroom)
  ? service + ' / ' + classroom: service + classroom
  content.address1 = '〒' + com.postal + ' ' + com.city;
  content.address2 = com.address;
  content.username = account.lname + ' ' + account.fname;
  content.kanri = com.kanri;
  content.publisher = [
    (com?.ext?.hname || com.hname).replace(/^\s+|\s+$/g, ''),
    com.bname.replace(/^\s+|\s+$/g, ''),
    content.address1.replace(/^\s+|\s+$/g, ''),
    content.address2.replace(/^\s+|\s+$/g, ''),
    com.ctel.replace(/^\s+|\s+$/g, ''),
  ];
  content.unitprice = masterRec.unitPrice;
  // 法人事業所
  content.combrunch = (com?.ext?.hname || com.hname).replace(/^\s+|\s+$/g, '') + ' ' + com.bname.replace(/^\s+|\s+$/g, '');
  // 休日平日休校日を設定
  content.dateattr = dateList.map(e=>e.holiday);
  // 曜日を作成
  content.weekdays = dateList.map(e=>(
    ['日', '月', '火', '水', '木', '金', '土'][e.date.getDay()]
  ));
  // 単純に日付
  content.days = dateList.map(e=>e.date.getDate());

  const data = [];
  const sheets = [];
  // このフラグがある場合、多シートに出力せず一シートにすべてまとめる
  // テンプレートのname pageを見て縦に伸ばしていく。
  // 縦に伸ばすのはサーバー側のcgiでの仕事にする
  let intoOne = false;
  if(dataLayout==='refactoringSchedule' || dataLayout==='rfSch1Line1'
    || dataLayout==='rfSch1Line2'|| dataLayout==='rfSch2Line1' 
    || dataLayout==='rfSch2Line2'|| dataLayout==='rfSch5Line'){
    const datatest2 = [];
    let nop = 0;
    const cnfOR = com.etc.configOccupancyRate;  // 稼働率計算設定値
    content.dateCounter = dateList.map(e=>{
      if (e.holiday === 0)  return 1; // 平日はカウントするので常に1
      if (!cnfOR && e.holiday === 2) return 0; // 設定の初期値 休業日
      if (!cnfOR && e.holiday === 1)  return 1; // 設定の初期値 休校日
      if (cnfOR === '休業日を含めて稼働率計算' && e.holiday !== 2) return 1;
      if (cnfOR === '休業日を含めて稼働率計算' && e.holiday !== 1) return 1;
      if (cnfOR === '休業・休校を含めず稼働率計算' && e.holiday !== 2)
        return 0;
      if (cnfOR === '休業・休校を含めず稼働率計算' && e.holiday !== 1)
        return 0;
    });

    users.map((user, i) => {
      if(!(service==="" || new RegExp(service).test(user.service))) return false;
      const d = [
        i + 1,
        user.name,
        user.kana,
        user.hno,
        user.volume,
        user.ageStr,
        user.priceLimit,
        user.scity,
        user.scity_no,
        user.kanri_type,
        user.belongs1,
        user.belongs2,
      ]
      const pickup_list = [];
      const start_list = [];
      const transfer0_list = [];
      const end_list = [];
      const transfer1_list = [];
      const sent_list = [];
      const absence_list = [];
      const transfer_list = [];
      const uid = "UID"+user.uid;
      for(let i=0; i<31; i++){
        pickup_list.push(" ");
        sent_list.push(" ");
        let otherClassRoom = false;
        const triger = schedule[uid] ?Object.keys(schedule[uid]).some(dDate => {
          if(dDate.replace(/^D\d{6}(\d{2}).*$/, "$1") !== ("0"+String(i+1)).slice(-2)) return false;
          if(!(service==="" || schedule[uid][dDate].service === service)) return false;
          if(schedule[uid][dDate]["absence"]){
            if(!schedule[uid][dDate]["dAddiction"]) absence_list.push("✕");
            else if(!schedule[uid][dDate]["dAddiction"]["欠席時対応加算"]) absence_list.push("✕");
            else absence_list.push("欠");
          }else if (service === HOHOU && schedule[uid][dDate].service === HOHOU){
            if (schedule[uid][dDate].dAddiction?.保育訪問 === '保育訪問') absence_list.push('保');
            else if (schedule[uid][dDate].dAddiction?.保育訪問 === '複数支援') absence_list.push('複');
            else absence_list.push(' ');
          }else{
            if (classroom && schedule[uid][dDate].classroom && schedule[uid][dDate].classroom !== classroom){
              absence_list.push('△');
              otherClassRoom = true;
            }else if(schedule[uid][dDate]["offSchool"] == 0){
              absence_list.push("○");
            }else if(schedule[uid][dDate]["offSchool"] == 1){
              absence_list.push("◎");
            }else{
              absence_list.push(" ");
            }
          }
          if(schedule[uid][dDate]["absence"] || otherClassRoom){
            start_list.push(" ");
            transfer0_list.push(" ");
            end_list.push(" ");
            transfer1_list.push(" ");
            transfer_list.push(" ");
            return true
          }
          start_list.push(schedule[uid][dDate]["start"]);
          if(schedule[uid][dDate]["transfer"] && schedule[uid][dDate]["transfer"][0]){
            transfer0_list.push(schedule[uid][dDate]["transfer"][0]);
          }else{
            transfer0_list.push(" ");
          }
          end_list.push(schedule[uid][dDate]["end"]);
          if(schedule[uid][dDate]["transfer"] && schedule[uid][dDate]["transfer"][1]){
            transfer1_list.push(schedule[uid][dDate]["transfer"][1]);
          }else{
            transfer1_list.push(" ");
          }
          if(schedule[uid][dDate]["transfer"] && schedule[uid][dDate]["transfer"][1] && schedule[uid][dDate]["transfer"][0]){
            transfer_list.push("2");
          }else if(schedule[uid][dDate]["transfer"] && (schedule[uid][dDate]["transfer"][1] || schedule[uid][dDate]["transfer"][0])){
            transfer_list.push("1");
          }else{
            transfer_list.push("0");
          }
          return true
        }) :false;
        if(!triger){
          start_list.push(" ");
          transfer0_list.push(" ");
          end_list.push(" ");
          transfer1_list.push(" ");
          absence_list.push(" ");
          transfer_list.push(" ");
        }
      }
      datatest2.push([
        ...d, ...pickup_list ,...start_list, ...transfer0_list,
        ...end_list, ...transfer1_list, ...sent_list, ...absence_list,
        ...transfer_list
      ]);
      nop++;
    })
    let nol = 4;
    if(dataLayout === 'rfSch2Line1' || dataLayout === 'rfSch2Line2') nol = 2;
    else if(dataLayout === 'rfSch1Line1' || dataLayout === 'rfSch1Line2') nol = 1;
    else if(dataLayout === 'rfSch5Line') nol = 5;
    nop = nop * nol;
    console.log("nop", nop)
    let length = datatest2[0].length;
    const datatest3 = [];
    for(let index=0;index<nop;index++){
      if(datatest2[index]){
        const array = datatest2[index];
        array.unshift(1);
        datatest3.push(array);
      }else{
        const array = [1];
        while(length>0){
          array.push("")
          length--;
        }
        datatest3.push(array)
      }
    }
    sheets.push({datatest3});
    content.hideEmpRows = 'datatest3';
  }
  // if (dataLayout === 'uribyuser1' || dataLayout === 'uribyuser2'){
  if (dataLayout.includes('uribyuser1') || dataLayout.includes('uribyuser2')){
    users.sort((a, b) => (parseInt(a.sindex) - parseInt(b.sindex)));
    // const filtered_users = albCM.getFilteredUsers(users, service, classroom);
    const filtered_users = users.filter(uDt => {
      if(!albCM.isClassroom(uDt, classroom)) return false;
      else if(!(service==="" || new RegExp(service).test(uDt.service))) return false;
      return true;
    })
    const tmp = proseedByUsersDt(filtered_users, billingDt, service);
    console.log("利用者負担額", tmp)
    let put_data = tmp;
    // if(dataLayout === 'uribyuser2'){
    if(dataLayout.includes('uribyuser2')){
      put_data = filtered_users.map(userDt => {
        const tmp_data = tmp.find(dt => dt.UID === "UID"+userDt.uid);
        return tmp_data 
          ?tmp_data 
          :{
            pname: userDt.pname,
            userName: userDt.name,
            tanni: 0,
            santei: 0,
            userFutan: 0,
            jichiJosei: 0,
            actualCost: 0,
            kanriOk: false,
            kokuhoSeikyuu: 0,
            weekdayNum: 0,
            holidayNum: 0,
            sougeiCnt: 0,
            countOfUse: 0
          }
      })
    }
    if(dataLayout.includes("dokuji")){
      // 自治体独自補助対応
      put_data.map((e, i)=>{
        const d = [
          i + 1,  // 項番
          e.pname, // 保護者
          // e.userName, // ユーザー名
          e.name || e.userName, // ユーザー名
          e.tanni, // 単位数
          e.santei, //算定額
          e.userFutan, // 利用者負担
          e.jichiJosei ?parseInt(e.jichiJosei) :0, // 助成額
          e.actualCost, // 実費
          e.userFutan + e.actualCost - (e.jichiJosei ?parseInt(e.jichiJosei) :0), // 請求合計
          e.kanriOk ? '済み': '', // 上限管理済みかどうか
          e.kokuhoSeikyuu, // 国保連請求額
          e.santei + e.actualCost, // 売上 追加 2023/05/24
          e.weekdayNum, //橋本追加　平日利用回数
          e.holidayNum,  //橋本追加　休日利用
          e.sougeiCnt, // 送迎回数
          e.countOfUse, // 利用回数
        ];
        data.push(d);
      });
    }else{
      put_data.map((e, i)=>{
        const d = [
          i + 1,  // 項番
          e.pname, // 保護者
          // e.userName, // ユーザー名
          e.name || e.userName, // ユーザー名
          e.tanni, // 単位数
          e.santei, //算定額
          e.userFutan, // 利用者負担
          e.actualCost, // 実費
          e.userFutan + e.actualCost, // 請求合計
          e.kanriOk ? '済み': '', // 上限管理済みかどうか
          e.kokuhoSeikyuu, // 国保連請求額
          e.santei + e.actualCost, // 売上 追加 2023/05/24
          e.weekdayNum, //橋本追加　平日利用回数
          e.holidayNum,  //橋本追加　休日利用
          e.sougeiCnt, // 送迎回数
          e.countOfUse, // 利用回数
        ];
        data.push(d);
      });
    }
    content.hideEmpRows = 'data';
  }
  if (dataLayout === 'uriagedaityou'){
    let cnt = 1;
    billingDt.map((e, i)=>{
      // usersはフィルタされている値が来る。これで見つからない場合はスキップする
      const ui = comMod.getUser(e.UID, users);
      if (!Object.keys(ui).length)  return false;
      // if(!(service==="" || new RegExp(service).test(ui.service))) return false;
      if (!albCM.isClassroom(ui, classroom)) return false;
      if (!albCM.isService(ui, service)) return false;
      if (!e.tanniTotal)  return false;
      const uHead = Array(10).fill('');  // ユーザー見出しの行
      const uDetail = []  // 明細
      const uTotal = Array(11).fill('');  // 集計
      uHead[0] = cnt++;;
      uHead[1] = e.name;
      uHead[2] =  '保護者: ' + ui.pname + ' 受給者番号: ' + e.hno + ' '
      if (ui.belongs1 && ui.belongs2)
        uHead[2] += ui.belongs1 + ' / ' + ui.belongs2;
      else if (ui.belongs1 || ui.belongs2)
        uHead[2] += ui.belongs1 + ui.belongs2;
      // サービスごとの明細行
      e.itemTotal.map(f=>{
        const detail = Array(10).fill('');
        detail[2] = f.s;  // サービスコード
        detail[3] = comMod.deleteLast(f.c, '・');  // サービス名
        detail[4] = parseInt(f.v);  // サービス単位
        detail[5] = f.count; // 提供数
        detail[6] = f.tanniNum; // 単位数
        uDetail.push(detail);
      });
      // サービスの集計行
      const detailSubTotal = Array(10).fill('');
      detailSubTotal[3] = '単位計';
      detailSubTotal[6] = e.tanniTotal;
      uDetail.push(detailSubTotal);
      // 実費の明細
      e.actualCostDetail.map(f=>{
        const detail = Array(10).fill('');
        detail[2] = '実費';
        detail[3] = f.name;
        detail[4] = f.unitPrice;
        detail[5] = f.count;
        detail[6] = f.price;
        uDetail.push(detail);
      });
      // 実費の合計
      const detailSubTotalAc = Array(10).fill('');
      detailSubTotalAc[3] = '実費計';
      detailSubTotalAc[6] = e.actualCost;
      uDetail.push(detailSubTotalAc);
      // ユーザー合計
      uTotal[1] = '利用者計';
      uTotal[4] = '単位単価';
      uTotal[6] = masterRec.unitPrice;
      uTotal[7] = e.userSanteiTotal;
      uTotal[8] = (e.ketteigaku) ? e.ketteigaku : 0;
      uTotal[9] = e.actualCost;
      uTotal[10] = e.userSanteiTotal - ((e.ketteigaku) ? e.ketteigaku : 0);
      uTotal[11] = e.userSanteiTotal + e.actualCost;
      uTotal[12] = (e.kanriOk)? '済':'未';
      data.push(Array(11).fill('')); // 空行
      data.push(uHead);
      // data.push(uDetail);
      uDetail.map(f=>{data.push(f)});
      data.push(uTotal);
    });
    // console.log('data uriagedaityou', data);
    sheets.push({ sheetname: month });
    content.hideEmpRows = 'data';
  }
  // 請求書受領書と控え、datalayoutの文字の一部で判断する
  if (dataLayout.indexOf('invoice') > -1) {
    if (dataLayout.indexOf('seikyuu') > -1){
      content.label = '請求書';
      content.comment = '下記の通りご請求申し上げます。ご確認いただけますようお願い申し上げます。';
    }
    else if (dataLayout.indexOf('juryou') > -1) {
      content.label = '受領書'
      content.comment = '下記、正に受領致しました。';
    }
    if (dataLayout.indexOf('hikae') > 1) {
      content.label += '(控)'
    }
    // このフラグは動作速度がおそすぎるのでボツにする予定
    // intoOne = true; // 1シートにまとめるためのフラグ。試験的にONにする
    const tmp = proseedByUsersDt(users, billingDt);
    // console.log('proseedByUsersDt', tmp);
    tmp.map((e, i) => {
      const userDetail = comMod.getUser(e.UID, users);
      if(!(service==="" || new RegExp(service).test(userDetail.service))) return false;
      const detail = [[
        1, 
        '障害児通所給付費\\n利用者負担額',
        e.userFutan,
        1,
        e.userFutan,
        'ご利用回数' + e.countOfUse + '回',
      ]];
      e.actualCostDetail.map((f, j)=>{
        detail.push([
          j +2,
          f.name,
          f.unitPrice,
          f.count,
          f.price,
        ]);
      })
      const d = {
        sheetname: userDetail.name,
        pname: userDetail.pname + ' 様',
        hno_user: userDetail.hno + ' ' + userDetail.name + ' 様',
        detail,
      };
      sheets.push(d);
    });
  }
  // 月間予定
  if (dataLayout.indexOf('monthriyou') > -1){
    const lineHight = 4;  // 予定表上で位置ユーザーあたり何行で表示するか
    content.title = '利用予定表';
    const cnfOR = com.etc.configOccupancyRate;  // 稼働率計算設定値
    // 稼働日をカウントするための配列 
    content.dateCounter = dateList.map(e=>{
      if (e.holiday === 0)  return 1; // 平日はカウントするので常に1
      if (!cnfOR && e.holiday === 2) return 0; // 設定の初期値 休業日
      if (!cnfOR && e.holiday === 1)  return 1; // 設定の初期値 休校日
      if (cnfOR === '休業日を含めて稼働率計算' && e.holiday !== 2) return 1;
      if (cnfOR === '休業日を含めて稼働率計算' && e.holiday !== 1) return 1;
      if (cnfOR === '休業・休校を含めず稼働率計算' && e.holiday !== 2)
        return 0;
      if (cnfOR === '休業・休校を含めず稼働率計算' && e.holiday !== 1)
        return 0;
    });
    const t = users
    .sort((a, b)=>(parseInt(a.sindex) < parseInt(b.sindex)? -1: 1))
    const userinfo = t.map((e, i)=>{
      if(!(service==="" || new RegExp(service).test(e.service))) return false;
      return([
        i + 1, e.name, e.belongs1, e.belongs2, 
        e.ageStr, parseInt(e.volume), 
      ]);
    }).filter(x => x);
    // falseを排除してuserinfo作成
    content.userinfo = userinfo;
    // 定員
    content.teiin = com.addiction[service] ?parseInt(com.addiction[service].定員) :0;
    // 上限
    content.upperlimit = comMod.upperLimitOfUseByDay(content.teiin)
    // 余分な行削除の基準になるエリア名
    content.hideEmpRows = 'detail';
    
    // 各行の配列を定義
    const detail = [];
    billingDt.sort((a, b)=>(parseInt(a.sindex) < parseInt(b.index)? -1: 1));
    billingDt.map(e=>{
      // usersに定義されていないデータはスキップ
      if (!users.find(f=>e.UID === 'UID' + f.uid))  return false;
      const userDt = users.find(f=>e.UID === 'UID' + f.uid);
      if(!(service==="" || new RegExp(service).test(userDt.service))) return false;
      const useResult = Array(dateList.length).fill('');
      const transfer = Array(dateList.length).fill('');
      const start = Array(dateList.length).fill('');
      const pickup = Array(dateList.length).fill('');
      Object.keys(e).map(f=>{
        // 日付オブジェクトを扱う。キーの先頭がD2以外はスキップ
        if (f.indexOf('D2') !== 0)  return false;
        const thisDay = parseInt(f.slice(7, 9)) - 1; // DXXXXXXXXの末尾二桁が日付
        const isKesseki = e[f].items.find(g=>KESSEKI_SVC_CODE.indexOf(g.s) > -1);
        // 利用実績
        let otherClassRoom = false;
        if (e[f].absence && !isKesseki) useResult[thisDay] = '✕';
        else if (e[f].absence && isKesseki)  useResult[thisDay] = '欠';
        else if (classroom && e[f].classroom && e[f].classroom !== classroom){
          useResult[thisDay] = '△';
          otherClassRoom = true;
        }
        else if (e[f].offSchool === 0)  useResult[thisDay] = '○';
        else if (e[f].offSchool === 1)  useResult[thisDay] = '◎';
        // 欠席の時は送迎などを表示しない 2022/02/04
        // 別単位予定も表示しない
        if (!e[f].absence && !otherClassRoom && e[f].transfer){
          // 送迎
          transfer[thisDay] = e[f].transfer.filter(g=>g).length;
          // 開始
          start[thisDay] = (e[f].start)? e[f].start.replace(':', ''): '';
          // 迎え
          pickup[thisDay] = e[f].transfer[0];
        }
      });
      // detilに追加
      detail.push(useResult);
      detail.push(transfer);
      detail.push(start);
      detail.push(pickup);
    });
    sheets.push({detail, sheetname:month});
  }
  if (dataLayout === 'userList'){
    users.map((e, i)=>{
      if(!(service==="" || new RegExp(service).test(e.service))) return false;
      // const bank_info = e.etc.bank_info ? e?.etc?.bank_info :{};
      const bank_info = e.etc? e?.etc?.bank_info ?? {}: {};
      const d = [
        i + 1,
        e.name,
        e.kana,
        e.birthday,
        e.ageStr,
        comMod.shortWord(e.service),
        e.type,
        e.hno,
        e.classroom,
        parseInt(e.volume),
        parseInt(e.priceLimit),
        e.scity,
        e.scity_no,
        comMod.shortWord(e.kanri_type),
        e.startDate,
        e.contractDate,
        e.contractEnd,
        parseInt(e.lineNo),
        e.pname,
        e.pkana,
        parseInt(e.brosIndex),
        e.pmail,
        e.pphone,
        e.pphone1,
        e.belongs1,
        e.belongs2,
        e.postal,
        e.city,
        e.address,
        bank_info["口座番号"] ?bank_info["口座番号"] :"", //橋本追加
        bank_info["金融機関番号"] ?bank_info["金融機関番号"] :"", //橋本追加
        bank_info["店舗番号"] ?bank_info["店舗番号"] :"", //橋本追加
        bank_info["口座番号"] ?bank_info["預金種目"] :"", //橋本追加
        bank_info["口座名義人"] ?bank_info["口座名義人"] :"", //橋本追加
        bank_info["顧客コード"] ?bank_info["顧客コード"] :"", //橋本追加
      ];
      data.push(d);
    });
    content.hideEmpRows = 'data';
  }
  if (dataLayout === 'riyoukakunin'){
    const filteredUsers = users.filter(uDt => service==="" || new RegExp(service).test(uDt.service));
    const prms = {
      billingDt, masterRec, dateList, com, service, account, users: filteredUsers, stdDate, 
      dataLayout, classroom, selects
    }
    const v = riyouKakunin(prms);
    data.push(...v);
    content.hideEmpRows = 'data';
  }
  content.data = data;
  content.sheets = sheets;
  content.intoOne = intoOne;
  console.log('content', content)

  return content;
}

//各帳票の警告文を表示する。
//個人情報を隠すが機能しない時など
export const ReportWarningWrapper = (props) => {
  const classes = useStyles();
  const {userNames=[], warningMsg=""} = props;
  const userNameNodes = userNames.map(name => <div className='userName'>{name}</div>);

  if(!userNames.length) return null;
  return(
    <div className={classes.warningWrapper}>
      <div className='msg'>{warningMsg}</div>
      <div className='userNameWrap'>{userNameNodes}</div>
    </div>
  )
}

// ドキュメント出力用のデータをdbに投げて
// ドキュメントサーバに作成のリクエストする
// timeout設定仕込んだ
const requestReport = async (prms, name, setres) => {
  // prms = { hid, bid, stamp, template, dst, content, }
  let res = {};
  const axsObj = axios.create();
  axsObj.defaults.timeout = 30 * 1000;
  try{
    prms.a = 'sendDocument';
    res = await axsObj.post(endPoint(), comMod.uPrms(prms));
    if (!res.data.result){
      throw 'res';
    }
    prms.a = 'excelgen';
    res = await axsObj.post(endPoint(), comMod.uPrms(prms));
    if (!res.data.result) {
      throw 'res';
    }

    res.name = name;
    res.result = true;
    setres(res);
  }
  catch{
    // timeoutのときはresに何も入ってこない
    // そのときはtimeoutとして判断する。
    if (!Object.keys(res).length){
      res.timeout = true;
    }
    res.name = name;
    setres(res);
  }
}

const SendOtherOfficeMailDialog = (props) => {
  const com = useSelector(state => state.com);
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-");
  // const exDate = comMod.getDateEx(stdYear, stdMonth, "01");
  const classes = useStyles();
  const {officeDt, reportTitle, onClose, preview, ...dialogProps} = props;
  const [snack, setSnack] = useState({});
  const [targetJinoList, setTargetJinoList] = useState([]);
  const initMailDt = Object.entries(com?.ext?.otheroffice ?? {}).reduce((prevMailDt, [jino, dt]) => {
    prevMailDt[jino] = dt.mail;
    return prevMailDt;
  }, {});
  const [mailDt, setMailDt] = useState(initMailDt);
  const [sentHistory, setSentHistory] = useState({});
  const [submitStatus, setSubmitStatus] = useState("standby");
  const [replayToMail, setReplayToMail] = useLocalStorageState("", "SendOtherOfficeMailDialogReplayToMail");
  const [fromBname, setFromBname] = useLocalStorageState(com?.bname ?? "", "SendOtherOfficeMailDialogFromBname");
  const [fromStaffName, setFromStaffName] = useLocalStorageState("", "SendOtherOfficeMailDialogFromStaffName");
  const [replayToMailError, setReplayToMailError] = useState(false);
  const [mailError, setMailError] = useState({});
  const [isNotChecked, setIsNotChecked] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [messageOpenDt, setMessageOpenDt] = useState({});
  const [messageDt, setMessageDt] = useState({});
  const anyStateItem = `${preview}送信履歴`;

  useEffect(() => {
    if(!officeDt || !preview || !com) return;
    (async() => {
      try{
        const fetchAnyStateParams = {
          a: 'fetchAnyState',
          hid: com.hid, bid: com.bid, date: stdDate,
          item: anyStateItem,
        };
        const fetchAnyStateRes = await albCM.univApiCall(fetchAnyStateParams);
        if(!fetchAnyStateRes.data.result) throw new Error("fetchAnyStateError");
        console.log("fetchAnyState", fetchAnyStateRes)
        const state = fetchAnyStateRes.data?.dt?.[0]?.state;
        setSentHistory(checkValueType(state, 'Object') ?state :{});
      }catch(error){
        console.log(error)
      }
    })();
  }, [officeDt, preview, com]);

  useEffect(() => {
    if(submitStatus !== "complete") return;
    new Promise(resolve => {
      setTimeout(() => {
        resolve(true);
      }, 1000 * 2);
    }).then(() => {
      setSubmitStatus("standby");
      setSnack({msg: '送信完了', id: new Date().getTime()});
      setTargetJinoList([]);
    });
  }, [submitStatus]);

  useEffect(() => {
    if(submitStatus !== "loading") return;
    const handleSubmit = async() => {
      try{
        // 上限管理事業所のメールアドレスをcomに保存
        const newCom = JSON.parse(JSON.stringify(com));
        if(!checkValueType(newCom.ext, 'Object')) newCom.ext = {};
        const newComExt = newCom.ext;
        if(!newComExt.otheroffice) newComExt.otheroffice = {};
        const otheroffice = newComExt.otheroffice;
        Object.entries(mailDt).forEach(([jino, mail]) => {
          if(!otheroffice[jino]) otheroffice[jino] = {};
          otheroffice[jino].mail = mail;
        });
        const sendComExtParams = {
          a: "sendComExt",
          hid: com.hid, bid: com.bid,
          ext: JSON.stringify(newComExt)
        }
        const sendComExtRes = await albCM.univApiCall(sendComExtParams)
        if (!sendComExtRes?.data?.result) throw new Error("sendComExtError");

        // 帳票をPDF化
        document.documentElement.style.fontSize = '80%';
        const pdfUrlsPerJino = {};
        for(const jino of targetJinoList){
          const data = officeDt[jino];
          const pages = data.pages;
          const pdfs = [];
          for(const page of pages){
            const originMargin = page.style;
            page.style.margin = "32px auto 0";
            const blob = await generatePdfBlob(page, "test", 0);
            const filename = comMod.randomStr(32);
            const pdf = new File([blob], `${filename}.pdf`, { type: 'application/pdf' });
            pdfs.push(pdf);
            page.style = originMargin;
          }
          const pdfUrls = await sendPdfs(pdfs, "docs");
          if(!pdfUrls) throw new Error("sendPdfsError");
          pdfUrlsPerJino[jino] = pdfUrls;
        }
        document.documentElement.style.fontSize = '100%';

        // PDFをメール送信
        const newSentHistory = {...sentHistory};
        for(const [jino, pdfUrls] of Object.entries(pdfUrlsPerJino)){
          const mail = mailDt[jino];
          const message = messageDt[jino] ?? "";
          const messageContent = (
            "■ メッセージ<br />"
            + `${message.replace(/\n/g, "<br />")}<br />`
            + "<br />"
          )
          const apiParams = {
            a: 'sendHtmlMail',
            pmail: mail, bcc: replayToMail, replyto: replayToMail,
            from: "noreply",
            title: `【自動送信】${fromBname ?"【"+fromBname+"】" :""}${parseInt(stdMonth)}月分「${preview}」ダウンロードのご案内`,
            content: (
              `${officeDt?.[jino]?.bname ?? "送信先事業所名"}　御中<br />`
              + "<br />"
              + "本メールはアルバトロスより自動配信されています。<br />"
              + "ご返信いただいても対応できません。内容については下記「発行元事業所」へご連絡ください。<br />"
              + "<br />"
              + "---<br />"
              + "▼ ダウンロードリンク（有効期限：30日）<br />"
              + `${pdfUrls.reduce((prevStr, pdfUrl) => {
                prevStr += `${preview}：${encodeURI(pdfUrl)}<br />`;
                return prevStr;
              }, "")}`
              + "---<br />"
              + "<br />"
              + "■ 発行元事業所<br />"
              + `事業所名：${com?.bname ?? "事業所名"}<br />`
              + `${fromStaffName ?`担当者　：${fromStaffName}<br />` :""}`
              + `電話　　：${com?.tel ?? "電話番号"}<br />`
              + `メール　：${replayToMail}<br />`
              + "<br />"
              + "■ 送付先事業所<br />"
              + `${officeDt?.[jino]?.bname ?? "送信先事業所名"}<br />`
              + "<br />"
              + `${Boolean(message) ?messageContent :""}`
              + "ダウンロードした書類に相違やご不明点がございましたら、<br />"
              + "恐れ入りますが発行元事業所までご連絡くださいますようお願い申し上げます。<br />"
              + "<br />"
              + "---<br />"
              + "放課後等デイサービス・児童発達支援 請求支援システム<br />"
              + "アルバトロス  https://rbatos.com/"
            )
          };
          const sendHtmlMailRes = await axios.post(endPoint(), comMod.makeUrlSearchParams(apiParams));
          if(!sendHtmlMailRes.data.result) throw new Error("sendHtmlMailError");
          newSentHistory[jino] = {pdfUrls, timestamp: new Date().getTime()};
        }
        // 送信履歴を保存
        const sendAnyStateParams = {
          a: 'sendAnyState',
          hid: com.hid, bid: com.bid, date: stdDate, keep: 60,
          item: anyStateItem,
          state: JSON.stringify(newSentHistory)
        }
        const sendAnyStateRes = await albCM.univApiCall(sendAnyStateParams);
        if(!sendAnyStateRes.data.result) throw new Error("sendAnyStateError");
        setSentHistory(newSentHistory);
        setSubmitStatus("complete");
      }catch(error){
        // エラー処理
        const errorMessage = `${preview}メール送信に失敗しました。`
          + "インターネット接続を見直して再度実行して下さい。"
          + "再びこのメッセージが表示されるときは管理者またはサポートまでご連絡をお願いします。";
        setSnack({msg: errorMessage, severity:'error', errorId:'2R1161'})
      }
    }
    handleSubmit();
  }, [submitStatus]);

  const offices = Object.entries(officeDt).map(([jino, dt]) => {
    const mail = mailDt[jino] ?? "";
    const checkboxDisabled = !mail || !comMod.isMailAddress(mail);

    const handleChange = (e) => {
      if(targetJinoList.includes(jino)){
        // チェック済みの場合、メールアドレスを編集したらチェックを外す。
        const newTargetJinoList = targetJinoList.filter(prevJino => prevJino !== jino);
        setTargetJinoList(newTargetJinoList);
      }
      const newMailDt = JSON.parse(JSON.stringify(mailDt));
      newMailDt[jino] = e.target.value;
      setMailDt(newMailDt);
      if(!checkboxDisabled && mailError[jino]){
        setMailError(prevError => ({...prevError, [jino]: false}));
        setMailError({});
        if(errorMsg === "上限管理事業所のメールアドレスを入力してください。"){
          setErrorMsg("");
        }
      }
    }
    const handleSelectTargetJino = () => {
      if(isNotChecked){
        setIsNotChecked(false);
        if(errorMsg === "送信する上限管理事業所を選択してください。") setErrorMsg("")
      }
      let newTargetJinoList = null;
      if(targetJinoList.includes(jino)){
        newTargetJinoList = targetJinoList.filter(prevJino => prevJino !== jino);
      }else{
        newTargetJinoList = [...targetJinoList, jino];
      }
      setTargetJinoList(newTargetJinoList);
    }
    const handleDisabledCheckboxClick = () => {
      if(!checkboxDisabled && !mailError[jino]) return;
      setMailError(prevError => ({...prevError, [jino]: true}));
    }

    const sentTimestamp = sentHistory[jino]?.timestamp;
    const newDate = new Date(sentTimestamp);
    const year = newDate.getFullYear();
    const month = String(newDate.getMonth()+1).padStart(2, '0');
    const date = String(newDate.getDate()).padStart(2, '0');
    const hours = String(newDate.getHours()).padStart(2, '0');
    const minutes = String(newDate.getMinutes()).padStart(2, '0');
    const pdfUrls = sentHistory[jino]?.pdfUrls ?? [];
    return(
      <div className='item' key={`formItem${jino}`} style={{fontSize: 16}}>
        {Boolean(sentTimestamp) &&<div className='sentHistory'>
          <CheckIcon style={{fontSize: '16px', marginRight: 2}} />
          <span style={{marginRight: 4}}>送信済み</span>
          <span style={{marginRight: 2}}>{year}/{month}/{date}</span>
          <span>{hours}:{minutes}</span>
          <div style={{zoom: '0.8', marginLeft: '4px', display: 'flex'}}>
            {pdfUrls.map((pdfUrl, i) => (
              <div style={{marginRight: pdfUrls.length === i+1 ?0 :2}}>
                <PdfCard url={pdfUrl} noLabel />
              </div>
            ))}
          </div>
        </div>}
        <div className='info'>
          <div className='checkbox' onClick={handleDisabledCheckboxClick}>
            <Checkbox
              className='jinoSelectCheckbox'
              color='primary'
              checked={targetJinoList.includes(jino)}
              onChange={handleSelectTargetJino}
              disabled={checkboxDisabled}
              style={(isNotChecked && !checkboxDisabled) ?{color: red['A700']}: {}}
            />
          </div>
          <div className='jino'>{jino}</div>
          <div className='bname'>{dt.bname}</div>
          <div className='mailInput'>
            <AlbHMuiTextField
              value={mail}
              onChange={handleChange}
              label="メールアドレス"
              width="100%"
              error={mailError[jino] ?? false}
              helperText={(mailError[jino] ?? false) ?"入力してください。" :""}
              InputProps={{style: {fontSize: 16}}}
              InputLabelProps={{style: {fontSize: 16}}}
            />
          </div>
        </div>
        <div className='message'>
          {!messageOpenDt[jino] &&(
            <Button
              startIcon={<AddIcon />}
              onClick={() => setMessageOpenDt(prevDt => ({...prevDt, [jino]: true}))}
              style={{margin: 8}}
            >
              メッセージ追加
            </Button>
          )}
          {messageOpenDt[jino] &&(
            <AlbHMuiTextField
              value={messageDt?.[jino] ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                setMessageDt(prevDt => ({...prevDt, [jino]: val}))
              }}
              label="メッセージ"
              multiline minRows={2}
              width="100%"
              variant="outlined"
              style={{margin: 8}}
            />
          )}
        </div>
      </div>
    )
  });

  const handleChangeReplayToMail = (e) => {
    const newReplayToMail = e.target.value;
    if(newReplayToMail && comMod.isMailAddress(newReplayToMail)){
      setReplayToMailError(false);
      if(errorMsg === "返信・BCC用メールアドレスを入力してください。") setErrorMsg("");
    }
    setReplayToMail(e.target.value);
  }

  const handleErrorCheck = () => {
    if(Object.keys(officeDt).every(jino => !mailDt?.[jino] || !comMod.isMailAddress(mailDt?.[jino]))){
      // 全上限管理事業所メールアドレス未入力
      const newMailError = Object.keys(officeDt).reduce((prevError, jino) => {
        prevError[jino] = true;
        return prevError;
      }, {})
      setMailError(newMailError);
      setErrorMsg("上限管理事業所のメールアドレスを入力してください。");
      return;
    }
    if(!targetJinoList.length){
      // 上限管理事業所が未選択
      setIsNotChecked(true);
      setErrorMsg("送信する上限管理事業所を選択してください。");
      return;
    }
    if(!replayToMail){
      // 返信先/BCCメールアドレスが未入力
      setReplayToMailError(true);
      setErrorMsg("返信・BCC用メールアドレスを入力してください。");
      return;
    }
    setErrorMsg("");
    setSubmitStatus("loading");
  }

  return(
    <>
    <Dialog
      onClose={onClose}
      className={classes.SendOtherOfficeMailDialog}
      PaperProps={{style: {maxWidth: '680px'}}}
      fullWidth
      {...dialogProps}
    >
      <DialogTitle>
        <div style={{fontSize: 20}}>{preview} メール送信</div>
      </DialogTitle>
      <DialogContent dividers>
        <div className='explanation' style={{fontSize: 16}}>
          <p>送信する事業所を選択してください。<br />送信にはメールアドレスを入力する必要があります。</p>
        </div>
        <form>
          {offices}
          <div className='fromInfo' style={{marginTop: 48}}>
            <div>
              <AlbHMuiTextField
                label="発行元事業所名"
                value={fromBname}
                onChange={(e) => setFromBname(e.target.value)}
                helperText="発行元事業所名は件名に表示されます。"
                width="100%"
                InputProps={{style: {fontSize: 16}}}
                InputLabelProps={{style: {fontSize: 16}}}
              />
            </div>
            <div style={{marginTop: 8}}>
              <AlbHMuiTextField
                label="発行元担当者名"
                value={fromStaffName}
                onChange={(e) => setFromStaffName(e.target.value)}
                helperText="発行元担当者名は本文に表示されます。"
                width="100%"
                InputProps={{style: {fontSize: 16}}}
                InputLabelProps={{style: {fontSize: 16}}}
              />
            </div>
          </div>
        </form>
      </DialogContent>
      <DialogActions style={{padding: '8px 24px', flexDirection: 'column'}}>
        <div className='errorMsg' style={{width: '100%', margin: 0, textAlign: 'end', color: red["A700"]}}>{errorMsg}</div>
        {submitStatus==="loading" &&(
          <div style={{width: '100%', margin: 0, textAlign: 'end', color: yellow[900], fontSize: 16}}>
            送信中です。画面を閉じたり移動しないでください。
          </div>
        )}
        <div style={{width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', margin: 0}}>
          <div style={{flex: 1, marginRight: '24px'}}>
            <AlbHMuiTextField
              label="返信先/bcc メールアドレス"
              value={replayToMail}
              onChange={handleChangeReplayToMail}
              width="100%"
              error={replayToMailError}
              helperText={replayToMailError ?"入力してください。" :""}
              InputProps={{style: {fontSize: 16}}}
              InputLabelProps={{style: {fontSize: 16}}}
            />
          </div>
          <Button
            color='secondary' variant='contained'
            onClick={onClose}
            className='cancel button'
          >
            <span style={{fontSize: 14}}>キャンセル</span>
          </Button>
          <div style={{position: 'relative', marginLeft: 12}}>
            <Button
              color='primary' variant='contained'
              onClick={handleErrorCheck}
              className='submit button'
              disabled={submitStatus!=="standby"}
            >
              <span style={{fontSize: 14}}>
              {submitStatus==="standby" &&"送信"}
              {submitStatus==="loading" &&"送信中"}
              {submitStatus==="complete" &&"送信完了"}
              </span>
            </Button>
            {submitStatus==="loading" && <CircularProgress size={24} className={classes.buttonProgress} />}
            {submitStatus==="complete" && <CheckIcon style={{color: teal[800]}} size={24} className={classes.buttonProgress} />}
          </div>
        </div>
      </DialogActions>
    </Dialog>
    <SnackMsg {...snack} />
    </>
  )
}

export const PrintButton = (props) => {
  const location = useLocation();
  const history = useHistory();
  const com = useSelector(state => state.com);
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-");
  const classes = useStyles();
  const {preview, setPreview, isSendMail=false, reportsRef} = props;
  const [open, setOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [otherOfficeDt, setOtherOfficeDt] = useState({});

  // メール送信処理
  const handleMail = () => {
    const pages = reportsRef.current.getElementsByClassName("onePage");
    const newDt = {};
    const title = pages[0].getElementsByClassName("title")[0].textContent;
    setReportTitle(title);
    pages.forEach(page => {
      const jinoElms = page.getElementsByClassName("jinoInt");
      const bnames = page.getElementsByClassName("name");
      const officeDts = [];
      jinoElms.forEach((jinoElm, i) => {
        const jino = jinoElm.textContent;
        if(jino && officeDts.every(dt => dt.jino !== jino)){
          const bname = bnames[i].textContent;
          officeDts.push({jino, bname});
        }
      })
      officeDts.forEach(({jino, bname}, i) => {
        if(jino && jino !== com.jino){
          if(!newDt[jino]) newDt[jino] = {};
          if(!newDt[jino].pages) newDt[jino].pages = [];
          newDt[jino].pages.push(page);
          newDt[jino].bname = bname;
        }
      });
    });
    setOtherOfficeDt(newDt);
    setOpen(true);
  }
  // 印刷ボタン
  const handlePrintClick = () =>{
    window.print();
  }
  // 表示切り替えハンドラ
  const handleDispChangeClick = (ev) => {
    const search = location.search;
    const urlParams = new URLSearchParams(search);
    const item = urlParams.get("item");
    const uid = urlParams.get("uid");
    const previousSearch = sessionStorage.getItem(PREV_PLANPAGE_SEARCH_SESSIONSTORAGE_KEY) || "";
    sessionStorage.removeItem(PREV_PLANPAGE_SEARCH_SESSIONSTORAGE_KEY);
    let newUrlPath = "";
    if(item === "assessment"){
      // 印刷閉じる際にアセスメントに遷移
      newUrlPath = `/plan/assessment`;
    }else if(item === "personalSupportDraft" || item === "personalSupport"){
      // 印刷閉じる際に個別支援計画に遷移
      newUrlPath = `/plan/personalSupport`;
    }else if(item === "personalSupportHohouDraft" || item === "personalSupportHohou"){
      // 印刷閉じる際に個別支援計画に遷移
      newUrlPath = `/plan/personalSupportHohou`;
    }else if(item === "conferenceNote"){
      // 印刷閉じる際に担当者会議議事録に遷移
      newUrlPath = `/plan/conferencenote`;
    }else if(item === "monitoring"){
      // 印刷閉じる際にモニタリングに遷移
      newUrlPath = `/plan/monitoring`;
    }else if(item === "monitoringHohou"){
      // 印刷閉じる際にモニタリング（保訪）に遷移
      newUrlPath = `/plan/monitoringhohou`;
    }else if(item === "monitoringSenmon"){
      // 印刷閉じる際にモニタリング（専門）に遷移
      newUrlPath = `/plan/monitoringsenmon`;
    }else if(item === "senmonShien"){
      // 印刷閉じる際に専門支援計画に遷移
      newUrlPath = `/plan/senmonShien`;
    }else if(item === "timetable"){
      // 印刷閉じる際にモニタリングに遷移
      newUrlPath = `/users/timetable/edit/${uid}/`;
    }
    if(newUrlPath){
      newUrlPath += previousSearch ?previousSearch :"";
      history.push(newUrlPath);
    }
    const name = ev.currentTarget.getAttribute('name');
    setPreview(name);
    setLS(LOCAL_STRAGE_PRINT_TITLE, name);
  }

  const today = new Date();
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const stdDateObj = new Date(parseInt(stdYear), parseInt(stdMonth) - 1, 1);
  const isTwoMonthsAgo = today.getDate() >= 20 
    ? stdDateObj < currentMonthStart 
    : stdDateObj < previousMonthStart;
  const isTwoMonthsAgoPreviews = ["上限管理結果票", "利用者負担額一覧表"];
  return(
    <>
    <div className={classes.printCntRoot + ' noprint'} style={{zIndex: 100}}>
      {isSendMail &&<Button
        onClick={handleMail}
        variant='contained'
      >
        <EmailIcon />
        メール送信
      </Button>}
      <Button
        color='primary'
        onClick={()=>handlePrintClick()}
        variant='contained'
      >
        <PrintIcon/>
        印刷する
      </Button>
      <Button id='axry56'
        color='secondary'
        onClick={(ev)=>handleDispChangeClick(ev)}
        name=''
        variant='contained'
      >
        <CloseIcon/>
        印刷画面を終了する
      </Button>
      <div className='subButtons'>
        <Button
          variant='text'
        >
          <HelpOutlineIcon/>
          <a href="https://rbatos.com/lp/2022/07/19/howtobeautifulprint/" target="_blank">
            きれいに印刷するには？
          </a>            
        </Button>
        <PrintSettingsButton preview={preview} />
      </div>
      {(isTwoMonthsAgo && isTwoMonthsAgoPreviews.includes(preview)) &&(
        <div className='twoMonthsAgoWarning'>
          {parseInt(stdMonth)}月提供分です<br />
          <span style={{fontSize: '1rem', color: orange[500], fontWeight: 300}}>
            通常通り印刷は可能ですがご注意ください。
          </span>
        </div>
      )}
    </div>
    <SendOtherOfficeMailDialog
      officeDt={otherOfficeDt}
      reportTitle={reportTitle}
      open={open} onClose={() => setOpen(false)}
      preview={preview}
    />
    </>
  )
}

const ReportsMain = () => {
  const location = useLocation();
  const history = useHistory();
  const dispatch = useDispatch();
  const {filter} = useParams();
  const classes = useStyles();
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-");
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const schedule = useSelector(state => state.schedule);
  const users = useSelector(state => state.users);
  const com = useSelector(state => state.com);
  const serviceItems = useSelector(state => state.serviceItems);
  const classroom = useSelector(state => state.classroom);
  const service = useSelector(state => state.service);
  const account = useSelector(state => state.account);
  const dateList = useSelector(state=>state.dateList);
  const sBdt = useSelector(state=>state.billingDt);
  const notAllowBiilingDt = useSuspendLowChange();
  const displayService = service ?service :serviceItems[0];
  // 2024請求データが絡んだ帳票を無効
  const singular2024Disabled = stdDate>=LC2024 && CALC2024===false;
  // 2024年度版
  const teikyouJisseki2024Checked = com?.ext?.reportsSetting?.teikyouJisseki?.teikyouJisseki2024?.checked ?? com?.etc?.configReports?.teikyouJisseki?.teikyouJisseki2024?.checked ?? stdDate>=LC2024;
  // 当月20日以前は印刷ボタンを押せないようにする。
  const isPrevMonthOrLater = new Date() < new Date(stdYear, stdMonth-1, 20);


  const [reportDateDt, setReportDateDt] = useState(schedule?.report?.[displayService] ?? {});

  // PDFメール送信用
  const reportsRef = useRef(null);

  // const sBdt = null;
  const masterRec = useSelector(state=>state.masterRec);
  // スナックバー用
  const [msg, setmsg] = useState('');
  const [severity, setseverity] = useState('');
  // フォーム変更検出用
  const [formChange, setFormChange] = useState(
    {代理受領通知日: false, 利用者負担額一覧表: false}
  );
  // 個人情報マスク
  const hidepersonalinfo_init = comMod.getUisCookie(comMod.uisCookiePos.hidePersonalInfo);
  const [hidePersonalInfo, setHidePersonalInfo] = useState(hidepersonalinfo_init===null ?"2" :hidepersonalinfo_init);
  // ファイル名用
  let serviceE = service;
  if (service === '放課後等デイサービス') serviceE = 'HD';
  if (service === '児童発達支援') serviceE = 'JH';
  if (service === '保育所等訪問支援') serviceE = 'HH' //橋本追加 04/04
  if (serviceItems.length < 2) serviceE = '';
  // -- ファイル名に漢字が使えないのでURL変更を行って%の文字を取り除く
  const classroomE = encodeURI(classroom).replace(/%/g, '').slice(0, 12);
  let serviceClassE = (serviceE && classroomE)
  ? serviceE + '-' + classroomE: serviceE + classroomE;
  serviceClassE = (serviceClassE)? '-'+serviceClassE: '';

  // サービスアイテム制限は外す 2021/10/17
  // if (!service){
  //   dispatch(Actions.changeService(serviceItems[0]));
  // }
  // パーミッション
  const permission = comMod.parsePermission(account)[0][0];
  // ユーザー選択用のstateと初期値を設定
  const tmpUserList = albCM.getFilteredUsers(users, service, classroom)
  // .filter(e=>classroom === '' || classroom === e.classroom)
  // .filter(e=>albCM.isClassroom(e, classroom))
  // .filter(e=>service === '' || e.service === service)
  // .filter(e=>service === '' || new RegExp(service).test(e.service)) //橋本追加
  .map(e=>{
    return {uid: e.uid, checked: true}
  });
  const [userSelectOpen, setUserSelectOpen] = useState(false);
  const [userList, setUserList] = useState(tmpUserList)
  // 提供実績の行の高さと幅を指定する 0は初期値を利用する
  const tkjCookieVal = comMod.getCookeis('tkjSetting');
  const tkjInit = {
    rows: tkjCookieVal? parseInt(tkjCookieVal.split(',')[0]): 0,
    height: tkjCookieVal? parseFloat(tkjCookieVal.split(',')[0]): 0,
  }
  const [tkjSetting, setTkjSetting] = useState(tkjInit)

  const prms = { stdDate, schedule, users, com, service, serviceItems };
  const billingDt = [];
  // billingDtをusersの順番に並び替え
  if (sBdt){
    users.map(e=>{
      if (!sBdt.length) return false;
      const UID = 'UID' + e.uid;
      const thisDt = sBdt.find(f=>f.UID === UID);
      if (thisDt) billingDt.push(thisDt);
    })
  
  }
  // console.log('billingDt',billingDt, 'masterRec', masterRec)

  const [selects, setSelects] = useState({
    '請求書・受領書選択': '請求書', 
    '提供実績種別': '通常', 
    '代理受領通知': '国の標準形式',
    '月間予定表': '標準', '利用者別売り上げ一覧': '標準',
    '上限管理結果票': '国の標準形式', '利用者負担額一覧表': '国の標準形式',
    '利用確認表': '標準'
  });

  // ノードの描写を管理
  const [nodes, setnodes] = useState(nodesDef);
  // リクエストの結果を格納
  const [res, setres] = useState({result: true});
  // リンクの消去を管理
  const [erase, seterase] = useState('');
  // プレビュー表示 空白でoff 格納されている値で表示するプレビューを指定する
  const [preview, setPreview] = useState('');
  const [displaySw, setDisplaySw] = useState({
    navigetion: {display: 'block'},
    preview: {display: 'none'},
  });
  // タイトル変更用
  const allState = useSelector(state=>state);
  const thisTitle = albCM.getReportTitle(allState, preview);
  const defaultTitle = albCM.defaultTitle;

  const [planCreated, setPlanCreated] = useState(null);
  useEffect(() => {
    const search = location.search;
    const urlParams = new URLSearchParams(search)
    const item = urlParams.get("item");
    const created = urlParams.get("created");
    const uid = urlParams.get("uid");
    let newPreview = null;
    if(item === "assessment"){
      newPreview = "アセスメントシート";
    }else if(item === "personalSupportDraft"){
      newPreview = "個別支援計画(原案)";
    }else if(item === "personalSupport"){
      newPreview = "個別支援計画";
    }else if(item === "personalSupportHohouDraft"){
      newPreview = "個別支援計画原案（保訪）";
    }else if(item === "personalSupportHohou"){
      newPreview = "個別支援計画（保訪）";
    }else if(item === "conferenceNote"){
      newPreview = "担当者会議議事録";
    }else if(item === "monitoring"){
      newPreview = "モニタリング表";
    }else if(item === "monitoringHohou"){
      newPreview = "モニタリング表（保訪）";
    }else if(item === "monitoringSenmon"){
      newPreview = "モニタリング表（専門）";
    }else if(item === "senmonShien"){
      newPreview = "専門的支援実施計画";
    }else if(item === "timetable"){
      newPreview = "計画支援時間";
    }
    if(newPreview){
      setUserList(prevUserList => prevUserList.map(dt => {
        if(dt.uid === uid) return({checked: true, uid});
        return {checked: false, uid: dt.uid};
      }));
      setPlanCreated(created);
      setPreview(newPreview);
    }
  }, [location.search])

  // previewとナビゲーションの切り替え
  // ノードに渡すスタイルを書き換える
  // ここでdocument.titleも変更するよ
  useEffect(()=>{
    if (!preview){
      setDisplaySw({
        navigetion: { display: 'block' },
        preview: { display: 'none' },
      })
    }
    else{
      setDisplaySw({
        navigetion: { display: 'none' },
        preview: { display: 'block' },
      })
    }
    if (preview){
      document.title = thisTitle;
    }
    else{
      document.title = defaultTitle;
    }
    return () => {
      document.title = defaultTitle;
    }
  },[preview]);

  // ドキュメント作成用のapi結果を監視
  useEffect(()=>{
    // 配列になっているstateからデータ取得した要素のリンクを更新する
    console.log('res:', res);
    if (res.result){
      const tmp = [...nodes];
      const ndx = tmp.findIndex(e=>e.name === res.name);
      if (ndx > -1 && res.data.dstPath){
        const f = DOCSURL + res.data.dstPath
        tmp[ndx].link = f;
        tmp[ndx].created = new Date().getTime();
        tmp[ndx].creating = false;
      }
      setnodes(tmp);
    }
    // エラーのフック
    else if (!res.result){
      setseverity('warning');
      if (res.timeout){
        setmsg('帳票の作成に時間がかかりすぎています。')
      }
      else{
        setmsg('帳票の作成中にエラーが発生しました。');
      }
      const tmp = [...nodes];
      const ndx = tmp.findIndex(e=>e.name === res.name);
      if (ndx > -1){
        tmp[ndx].creating = false;
      }
      setnodes(tmp);

    }
    else{
      setseverity('');
      setmsg('');
    }
    console.log('inreport service', service);
  }, [res]);

  // リンク消去確認用のインターバル
  useInterval(()=>{
    nodes.map(e=>{
      if (!e.created) return false;
      // 経過時間が設定値を超えていたら消去するノードリストの名前を格納
      if (new Date().getTime() - e.created > ERASE_ERT){
        seterase(e.name);
      }    
    });
  }, ERASE_INTVL);
  // リンク消去の実行
  useEffect(()=>{
    const ndx = nodes.findIndex(e=>e.name === erase);
    const tmp = [...nodes];
    if (ndx > -1){
      tmp[ndx].link = '';
      tmp[ndx].created = 0;
      tmp[ndx].creating = false;
      setnodes(tmp);
      seterase('');
    };
  }, [erase]);
  const [userListlength, SetUserListlength] = useState(userList.length);
  const [scheduleCount, SetScheduleCount] = useState(0);
  // ユーザーリストのカウント
  useEffect(()=>{
    SetUserListlength(userList.filter(e=>e.checked === true).length);
    let cnt = 0;
    // チェックされたユーザーのスケジュール件数をカウント
    userList.filter(e => e.checked === true).map(f=>{
      const thisSch = schedule['UID' + f.uid];
      if (!thisSch)  return false;
      cnt += Object.keys(thisSch).filter(g=>g.indexOf('D2') === 0).length
    });
    SetScheduleCount(cnt);
  }, [userList]);
  // 離脱時にリンク消去。うまく動くかどうか。->動いているっぽい
  useEffect(()=>{
    return (()=>{
      const t = nodes;
      t.forEach(e=>{
        e.created = 0;
        e.link = '';
      });
      setnodes(t);
    });
  }, [])
  const handleClick = (ev) => {
    // ステイトとは別のbillingdtを用意する。中身が変わることがある？
    const p = { stdDate, schedule, users, com, service, serviceItems };
    p.calledBy = 'ReportsMain handleClick';

    const {
      billingDt: bdtTmp, masterRec: mrTmp, result, errDetail
    } = setBillInfoToSch(p);
    if (!result){
      dispatch(Actions.setSnackMsg(errDetail.description, 'error', 'B236219'));
    }
    // 法改正チェック用
    const lowChangeCehck = ['uribyuser1', 'uriagedaityou', 'riyoukakunin'];
    const name = ev.currentTarget.getAttribute('name');
    if (notAllowBiilingDt && lowChangeCehck.includes(name)){
      dispatch(Actions.setSnackMsg('法改正対応のため現在は利用できません。', 'warning'))
      return;
    }
    // クリック元のnameに対応したテンプレート名のリスト
    const templateList = {
      uribyuser1: 'URI01_03.xlsx',  //橋本追加　変更前'URI01_01.xlsx'
      uribyuser2: 'URI01_03.xlsx',  //吉村変更 2023/05/24 02->03
      uribyuser1dokuji: 'URI01_dokuji_03.xlsx',
      uribyuser2dokuji: 'URI01_dokuji_03.xlsx',
      invoice_seikyuu: 'inv01.xlsx',
      invoice_juryou: 'inv01.xlsx',
      invoice_seikyuu_hikae: 'inv01.xlsx',
      invoice_juryou_hikae: 'inv01.xlsx',
      monthriyou: 'sch01-1.xlsx',
      uriagedaityou: 'uri02_01.xlsx',
      riyoukakunin: 'uri03.xlsx',
      userList: 'userlist-3.xlsx',  //橋本追加　変更前'userlist.xlsx'
      errtest: 'errtest.xlsx',
      refactoringSchedule: 'sch02-2.xlsx',
      rfSch1Line1: 'sch-1line1.xlsx',
      rfSch1Line2: 'sch-1line2.xlsx',
      rfSch2Line1: 'sch-2line1.xlsx',
      rfSch2Line2: 'sch-2line2.xlsx',
      rfSch5Line: 'sch-5line.xlsx',
    }
    const dstNameList = {
      uribyuser1: 'uriage-riyousya',
      uribyuser2: 'uriage-riyousya_inc0',
      uribyuser1dokuji: 'uriage-riyousya',
      uribyuser2dokuji: 'uriage-riyousya_inc0',
      invoice_seikyuu: 'seikyuu',
      invoice_juryou: 'juryou',
      invoice_seikyuu_hikae: 'seikyuu-hikae',
      invoice_juryou_hikae: 'juryou-hikae',
      monthriyou: 'month-riyou',
      uriagedaityou: 'uriagedaityou',
      userList: 'userlist',
      riyoukakunin: 'riyoukakunin',
      errtest: 'errtest',
      refactoringSchedule: 'manth-riyou',
      rfSch1Line1: 'manth-riyou1',
      rfSch1Line2: 'manth-riyou2',
      rfSch2Line1: 'manth-riyou3',
      rfSch2Line2: 'manth-riyou4',
      rfSch5Line: 'manth-riyou5',
    }
    // 対象データ件数のチェック
    const thisNode = nodes.find(e=> e.name === name);
    if (thisNode.countCheck && !scheduleCount){
      setmsg('帳票対象データがありません');
      setseverity('warning');
      return false;
    }
    // 対象データがオーバーしている場合
    const userCountLimit = thisNode.userCountLimit;
    const currendCount = userList.filter(e=>e.checked === true).length;

    if (userCountLimit && userCountLimit < currendCount){
      setmsg(`${currendCount}人分の作成がリクエストされました。
      この帳票は${userCountLimit}人までしか作成できません。`);
      setseverity('warning');
      return false;
    }
    const template = templateList[name];
    const month = stdDate.replace(/\-/g, '').substr(0, 6);
    const dstFile = 
      com.fprefix + '-' + month + '-' + dstNameList[name] 
      + serviceClassE + '.xlsx';
    // フィルタ済みのユーザーリストを作成
    const tUsers = userList.filter(e=>e.checked === true);
    const fUsers = tUsers.map(e=>(
      users.filter(f=>parseInt(e.uid)=== parseInt(f.uid))[0]
    ));
    // クリック元のnameに対応したドキュメントのコンテントを作成する
    const makeExcelReportDt_prms = {
      billingDt: bdtTmp,
      masterRec: mrTmp,
      dateList: dateList,
      com: com,
      service: service,
      account: account,
      users: fUsers,
      stdDate: stdDate,
      dataLayout: name, // ここで 'name' は 'dataLayout' として渡されます。
      classroom: classroom,
      setmsg: setmsg,
      setseverity: setseverity,
      schedule: schedule,
      selects,
    };
    
    const content = makeExcelReportDt(makeExcelReportDt_prms);
    console.log('name', name, 'content', content, 'content');
    // 作成以外のボタンが押された場合
    if (!template) return false;
    const stamp = parseInt(new Date().getTime());
    const tmpDir = comMod.randomStr(20);
    const dst = '/' + tmpDir + '/' + dstFile;
    const prms = {
      hid, bid, stamp, template, dst, 
      content: JSON.stringify(content)
    };
    // 作成中に切り替え
    const t = [...nodes];
    const i = t.findIndex(e=>e.name===name);
    t[i].creating = true;
    setnodes(t);
    requestReport(prms, name, setres);
  }

  // sta selectsを更新する。レポートの種別を変更するために使う
  const handleChange = (ev) => {
    const name = ev.currentTarget.getAttribute('name');
    const value = ev.currentTarget.value;
    console.log(name, value)
    setSelects({...selects, [name]: value})
    if(name === "月間予定表" || name === "利用者別売り上げ一覧"){
      let excel_names = {};
      switch(name){
        case "月間予定表": {excel_names=refactoringScheName; break;}
        case "利用者別売り上げ一覧": {excel_names=uribyuserExcelName; break;}
      }
      const editedNodes = nodes;
      const edit_index = nodes.findIndex(x => x.discription === name);
      editedNodes[edit_index]["name"] = excel_names[value];
      editedNodes[edit_index]["link"] = '';
      setnodes([...editedNodes]);
    }
  }
  
  const new_schedule_styles = {height: '32px', padding: '0 0 0 8px'}
  // 2021/08/27 パーミッションによる制限の追加
  const filteredNodes = nodes.filter(e => {
    if(e.permission > permission) return false;
    if(e.discription === "月間予定表" && displayService === "障害児相談支援") return false;
    if(e.discription === "利用確認表" && displayService === "障害児相談支援") return false;
    if(filter){
      if(filter==="billing" && !(e.discription==="利用者別売り上げ一覧" || e.discription === "売上台帳" || e.discription === "利用確認表")) return false;
      if(filter==="jogenkanri") return false;
      if(filter==="schedule" && !(e.discription==="月間予定表")) return false;
      if(filter==="dearuser") return false;
      if(filter==="usersplan") return false;
      if(filter==="etc" && !(e.discription==="利用者一覧")) return false;
    }
    return true;
  });

  const nodesRender = filteredNodes.map((e, i) => {
    let isSingular2024 = false;
    switch(e.discription){
      case "利用者別売り上げ一覧": {
        isSingular2024 = true;
        break;
      }
      case "売上台帳": {
        isSingular2024 = true;
        break;
      }
      case "月間予定表": {
        isSingular2024 = false;
        break;
      }
      case "利用確認表": {
        isSingular2024 = true;
        break;
      }
      case "利用者一覧": {
        isSingular2024 = false;
        break;
      }
    }
    return (
      <div className='reportCntRow' key={i}>
        <div className='reportDisc' style={new_schedule_styles}>
          <span style={{width: 160}}>{e.discription}</span>
          {e.selector
            ?<div className={classes.selectWrap} style={{marginLeft: 12, marginTop: 6}}>
              <SelectGp
                nameJp={e.discription}
                value={selects[e.discription]}
                // size='large'
                styleUse='tfMiddle'
                opts={e.selectorOpt}
                onChange={(ev) => handleChange(ev)}
                hidenull
                noLabel
              />
            </div> :null
          }
        </div>
        <div className='genButton'>
          {e.link === '' && e.creating === false &&
            <Button
              className={classes.reportButton}
              color={'primary'}
              variant='contained'
              name={(e.name)}
              // addictionclass='buttonGp'
              onClick={e=>handleClick(e)}
              startIcon={<GridOnIcon />}
              disabled={isSingular2024 && singular2024Disabled}
            >
              作成
            </Button>
          }
          {e.link !== '' && e.creating === false &&
            <a href={e.link}>
              <Button
                className={classes.reportButton}
                label='ダウンロード'
                variant='contained'
                // addictionclass='buttonGp'
                color='secondary'
                name={e.name + '-dl'}
                startIcon={<AssignmentReturnedIcon/>}
              >
                ダウンロード
              </Button>
            </a>
          }
          {e.creating === true &&
            <div className={classes.reportCreating} >
              作成中
            </div>
          }
        </div>
      </div>
    )
  });

  const printButtonCommonProps = {
    selects, setSelects, setPreview,
    formChange, setFormChange, setmsg, setseverity,
    setReportDateDt, reportDateDt
  };
  const permissionPorps = {
    isFilterPermission: true, permission, permissionFilting: PERMISSION_URIAGE,
  }
  const invoiceProps = {
    label: "請求書・受領書",
    seletcName: "請求書・受領書選択", previewItem: selects["請求書・受領書選択"],
    reportDateItem: "請求書受領書", settingItem: 'invoice',
    opts: [
      '請求書', '請求書控え', '請求書控え付き', '請求書単位明細付',
      '受領書', '受領書控え', '受領書控え付き', 
      '領収書', '領収書控え', '領収書控え付き',
    ],
    filterParams: ["dearuser"],
    disabled: singular2024Disabled,
    ...printButtonCommonProps
  }
  const tsusyokyuhuProps = {
    label: "通所給付費明細",
    seletcName: "通所給付費明細", previewItem: "通所給付費明細",
    isFilterService: true, service: displayService, serviceFilterList: ["障害児相談支援"],
    filterParams: ["billing", "dearuser"],
    notAllowBiilingDt,
    disabled: singular2024Disabled,
    ...permissionPorps, ...printButtonCommonProps
  }
  const kyuhuhiProps = {
    label: "給付費請求書",
    seletcName: "給付費請求書", previewItem: "給付費請求書",
    filterParams: ["billing"],
    notAllowBiilingDt,
    disabled: singular2024Disabled,
    ...permissionPorps, ...printButtonCommonProps
  }
  const dairijuryoProps = {
    label: "代理受領通知",
    seletcName: "代理受領通知", previewItem: "代理受領通知",
    reportDateItem: "代理受領通知日",
    opts: ['国の標準形式', '東京都形式', '東京都形式控え付き'],
    filterParams: ["dearuser"],
    notAllowBiilingDt,
    disabled: singular2024Disabled,
    ...permissionPorps , ...printButtonCommonProps
  }
  const jogenKanriProps = {
    label: "上限管理結果票",
    seletcName: "上限管理結果票", previewItem: "上限管理結果票",
    reportDateItem: "上限管理結果票", settingItem: 'jogenKanri',
    opts: ['国の標準形式', '神戸市形式', '京都市形式'],
    filterParams: ["jogenkanri"],
    notAllowBiilingDt,
    disabled: singular2024Disabled || isPrevMonthOrLater,
    ...permissionPorps , ...printButtonCommonProps
  }
  const riyousyahutanProps = {
    label: "利用者負担額一覧表",
    seletcName: "利用者負担額一覧表", previewItem: "利用者負担額一覧表",
    reportDateItem: "利用者負担額一覧表",
    opts: ['国の標準形式', '神戸市形式'],
    isFilterService: true, service: displayService, serviceFilterList: ["障害児相談支援"],
    filterParams: ["jogenkanri"],
    notAllowBiilingDt,
    disabled: isPrevMonthOrLater,
    ...permissionPorps , ...printButtonCommonProps
  }
  const teikyoujissekiProps = {
    label: "提供実績記録票",
    seletcName: "提供実績種別", previewItem: "提供実績記録票",
    reportDateItem: "提供実績記録票",
    settingItem: 'teikyouJisseki',
    opts: teikyouJisseki2024Checked?
      ['通常','白紙', '白紙（利用なし含む）']:
      // ['通常','白紙', ]:
      ['23行', '23行【2024年版】', '27行', '白紙', '白紙【2024年版】', '白紙（利用なし含む）', '白紙（利用なし含む）【2024年版】'],
    isFilterService: true, service: displayService, serviceFilterList: ["障害児相談支援"],
    filterParams: ["schedule", "dearuser"],
    esignListPath: "/reports/teikyoujisseki/esignlist",
    ...permissionPorps , ...printButtonCommonProps,
    permissionFilting: 80
  }
  const riyousyabetsuCalendarProps = {
    label: "利用者別カレンダー",
    previewItem: "利用者別スケジュール",
    specialComponent: (<CalendarPerUsersSetting />),
    isFilterService: true, service: displayService, serviceFilterList: ["障害児相談支援"],
    filterParams: ["schedule"],
    ...permissionPorps , ...printButtonCommonProps,
    permissionFilting: 80
  }
  const keiyakunaiyouProps = {
    label: "契約内容報告書",
    reportDateItem: "契約内容報告書",
    settingItem: 'keiyakunaiyou',
    previewItem: "契約内容報告書", registerItem: "contractInfo",
    filterParams: ["etc"],
    ...permissionPorps , ...printButtonCommonProps
  }
  const timeTableReportsProps = {
    label: "計画支援時間",
    previewItem: "計画支援時間",
    reportDateItem: "計画支援時間",
    settingItem: 'timetable',
    filterParams: ["usersplan"],
    ...permissionPorps , ...printButtonCommonProps,
    permissionFilting: 80
  }
  const assessmentSheetReportsProps = {
    label: "アセスメントシート",
    previewItem: "アセスメントシート",
    filterParams: ["usersplan"],
    ...permissionPorps , ...printButtonCommonProps,
    permissionFilting: 90,
  }
  const personalSupportOriginal = {
    label: "個別支援計画原案（児発・放デイ）",
    previewItem: "個別支援計画原案（児発・放デイ）",
    filterParams: ["usersplan"],
    ...permissionPorps , ...printButtonCommonProps,
    permissionFilting: 90,
  }
  const personalSupport = {
    label: "個別支援計画（児発・放デイ）",
    previewItem: "個別支援計画（児発・放デイ）",
    filterParams: ["usersplan"],
    ...permissionPorps , ...printButtonCommonProps,
    permissionFilting: 90
  }
  const personalSupportHohoOriginal = {
    label: "個別支援計画原案（保訪）",
    previewItem: "個別支援計画原案（保訪）",
    filterParams: ["usersplan"],
    ...permissionPorps , ...printButtonCommonProps,
    permissionFilting: 90,
  }
  const personalSupportHoho = {
    label: "個別支援計画（保訪）",
    previewItem: "個別支援計画（保訪）",
    filterParams: ["usersplan"],
    ...permissionPorps , ...printButtonCommonProps,
    permissionFilting: 90,
  }
  const serviceStaffMeeting = {
    label: "担当者会議議事録",
    previewItem: "担当者会議議事録",
    filterParams: ["usersplan"],
    ...permissionPorps , ...printButtonCommonProps,
    permissionFilting: 90,
  }
  const monitoring = {
    label: "モニタリング表",
    previewItem: "モニタリング表",
    filterParams: ["usersplan"],
    ...permissionPorps , ...printButtonCommonProps,
    permissionFilting: 90,
  }
  const monitoringHohou = {
    label: "モニタリング表（保訪）",
    previewItem: "モニタリング表（保訪）",
    filterParams: ["usersplan"],
    ...permissionPorps , ...printButtonCommonProps,
    permissionFilting: 90,
  }
  const monitoringSenmon = {
    label: "モニタリング表（専門）",
    previewItem: "モニタリング表（専門）",
    filterParams: ["usersplan"],
    ...permissionPorps , ...printButtonCommonProps,
    permissionFilting: 90,
  }
  const senmonShienProps = {
    label: "専門的支援実施計画",
    previewItem: "専門的支援実施計画",
    filterParams: ["usersplan"],
    ...permissionPorps , ...printButtonCommonProps,
    permissionFilting: 90,
  }
  return(
    <div className='AppPage reports'>
      <NotDispLowCh />
      <div className={'navigation '} style={displaySw.navigetion}>
        {/* <CheckProgress inline /> */}
        {/* <div style={{padding:8}}>
          <RecalcButton hidePrint={1}/>
        </div> */}
        {(permission === 100 || stdDate >= '2023-08-01') &&<CheckBillingEtc billingDt={billingDt} />}
        {stdDate < '2023-08-01' &&<CheckProgress inline />}

        <div style={{height: 16}}></div>
        {nodesRender}

        {/* 帳票印刷ボタン群 */}
        {/* {notAllowBiilingDt && <div style={{height: 16}}></div>} */}
        <ReportPrintButton {...invoiceProps} />
        <ReportPrintButton {...tsusyokyuhuProps} />
        <ReportPrintButton {...kyuhuhiProps} />
        <ReportPrintButton {...dairijuryoProps} />
        <ReportPrintButton {...jogenKanriProps} />
        <ReportPrintButton {...riyousyahutanProps} />
        <ReportPrintButton {...teikyoujissekiProps} />
        <ReportPrintButton {...riyousyabetsuCalendarProps} />
        {/* 個別支援計画 */}
        <ReportPrintButton {...assessmentSheetReportsProps} />
        <ReportPrintButton {...personalSupportOriginal} />
        <ReportPrintButton {...personalSupport} />
        <ReportPrintButton {...personalSupportHohoOriginal} />
        <ReportPrintButton {...personalSupportHoho} />
        <ReportPrintButton {...timeTableReportsProps} />
        <ReportPrintButton {...serviceStaffMeeting} />
        <ReportPrintButton {...monitoring} />
        <ReportPrintButton {...monitoringHohou} />
        <ReportPrintButton {...monitoringSenmon} />
        <ReportPrintButton {...senmonShienProps} />
        {/* その他 */}
        <ReportPrintButton {...keiyakunaiyouProps} />
        {/* 帳票全体の設定 */}
        <div className='reportCntRow'>
          <ReportsSettingButton
            settingItem="all"
            permission={permission} permissionFilting={PERMISSION_URIAGE}
          />
        </div>

        <UserSelectDialogWithButton
          dispAll
          lsName="userlistReports"
          style={{top: 98}}
          open={userSelectOpen} setOpen={setUserSelectOpen}
          userList={userList} setUserList={setUserList}
        />
      </div>
      <div className={'printPreview '} style={displaySw.preview}>
        <PrintButton
          preview={preview} setPreview={setPreview}
          isSendMail={
            ["上限管理結果票", "利用者負担額一覧表"].includes(preview) && selects?.[preview]==="国の標準形式" 
            // && permission >= 100
          }
          reportsRef={reportsRef}
        />
        {/* OR検索で全て表示 */}
        <ScheduleListByUser userList={userList} preview={preview}/>
        <Invoice userList={userList} preview={preview} reportDateDt={reportDateDt} />
        <InvoiceWithCopy userList={userList} preview={preview} reportDateDt={reportDateDt} />
        <TuusyokyuuhuMeisai userList={userList} preview={preview} selects={selects} reportDateDt={reportDateDt} />
        <TokyoDairiTsuchi userList={userList} preview={preview} selects={selects} key={"tokyoDairiTsuchi"} reportDateDt={reportDateDt} />
        <TeikyouJisseki userList={userList} preview={preview} selects={selects.提供実績種別}/>
        <TeikyouJisseki2024 userList={userList} preview={preview} selects={selects.提供実績種別} reportDateDt={reportDateDt}/>

        {/* 全表示以外は表示しない */}
        <div ref={reportsRef}>
          <ReportJougenKanri userList={userList} preview={preview} hidePersonalInfo={hidePersonalInfo} selects={selects} reportDateDt={reportDateDt}/>
        </div>
        <KobeJogenKanri userList={userList} preview={preview} hidePersonalInfo={hidePersonalInfo} selects={selects} reportDateDt={reportDateDt}/>
        <KyotoJogenKnari userList={userList} preview={preview} hidePersonalInfo={hidePersonalInfo} selects={selects} reportDateDt={reportDateDt}/>
        <KobeFutanIchiran userList={userList} preview={preview} hidePersonalInfo={hidePersonalInfo} selects={selects} reportDateDt={reportDateDt}/>
        <Kyuhuhi preview={preview} userList={userList}/>

        {/* 個別支援計画関係 */}
        <Assessment userList={userList} preview={preview} created={planCreated} />
        <PersonalSupport userList={userList} preview={preview} created={planCreated} />
        <TimeTableReports userList={userList} preview={preview} reportDateDt={reportDateDt} />
        <ConferenceNote userList={userList} preview={preview} created={planCreated} />
        <Monitoring userList={userList} preview={preview} created={planCreated} />
        <MonitoringHohou userList={userList} preview={preview} created={planCreated} />
        <MonitoringSenmon userList={userList} preview={preview} created={planCreated} />
        <SenmonShien userList={userList} preview={preview} created={planCreated} />

        {/* その他 */}
        <UserContractReports userList={userList} preview={preview} reportDateDt={reportDateDt} />

      </div>
      <SnackMsg msg={msg} severity={severity} setmsg={setmsg} />
      {/* <ServiceCountNotice /> */}
    </div>
  )
}

export const RepportsLinksTab = () => {
  const account = useSelector(state => state.account);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const permission = comMod.parsePermission(account)[0][0];
  if (seagull) {
    return null;
  }
  const menu = [
    { link: "/reports/", label: "すべて" },
    { link: "/reports/billing", label: "売上・請求・明細" },
    { link: "/reports/jogenkanri/", label: "上限管理" },
    { link: "/reports/schedule/", label: "予定実績" },
    { link: "/reports/dearuser/", label: "利用者あて" },
    // { link: "/reports/usersplan/", label: "個別支援計画" },
    { link: "/reports/etc/", label: "その他" },
  ];
  // extMenuテスト用
  // const extMenu = [
  //   {option: "上限管理", link: "/reports/jogenkanri/"},
  //   {option: "予定実績", link: "/reports/schedule/"},
  // ];
  const filteredMenu = menu.filter(dt => {
    const displayService = service ?service :serviceItems[0];
    if(displayService==="障害児相談支援" && dt.label==="予定実績") return false;
    return true;
  })
  if(permission >= 90){
    filteredMenu.push({ link: "/reports/usagefee", label: "ご利用料金" });
  }

  // extMenuテスト用
  // return (<LinksTab menu={filteredMenu} extMenu={extMenu} />)
  return (<LinksTab menu={filteredMenu} />)
}

const Reports = () => {
  const allstate = useSelector(state=>state);
  const {com, service, serviceItems, account} = allstate;
  const loadingStatus = comMod.getLodingStatus(allstate);

  // 基本設定項目の確認
  const tService = service? service: serviceItems[0]
  const comAdic = comMod.findDeepPath(com, ['addiction', tService]);  
  if (loadingStatus.loaded && !comAdic){
    return(
      <StdErrorDisplay 
        errorText = '請求設定項目が未設定です。'
        errorSubText = {`帳票作成開始に必要な基本設定項目がありません。設定メニューの
        「請求・加算」から定員や地域区分などを設定して下さい。`}
        errorId = 'E49421'
      />
    )
  }
  const permission = comMod.parsePermission(account)[0][0];
  if (loadingStatus.loaded){
    return (
      <>
      <RepportsLinksTab />
      <ReportsMain />
      </>
    )
  }
  else if (loadingStatus.error){
    return (
      <LoadErr loadStatus={loadingStatus} errorId={'E4949'} />
    )
  }
  else{
    return <LoadingSpinner/>
  }
}
export default Reports;