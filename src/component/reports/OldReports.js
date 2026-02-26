import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector } from 'react-redux';
import * as Actions from '../../Actions.js';
import * as comMod from '../../commonModule.js';
import * as albCM from '../../albCommonModule'.js';
import Button from '@material-ui/core/Button';
import { setBillInfoToSch } from '../Billing/blMakeData.js';
import { proseedByUsersDt } from '../Billing/makeProseedDatas.js'
import { endPoint } from '../../albCommonModule'.js'
import axios from 'axios';
import UserSelectDialogWithButton from '../common/UserSelectDialogWithButton.js';
import { LoadingSpinner, LoadErr ,StdErrorDisplay } from '../common/commonParts.js';
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
import { red, teal } from '@material-ui/core/colors';
import AssignmentReturnedIcon from '@material-ui/icons/AssignmentReturned';
import GridOnIcon from '@material-ui/icons/GridOn';
import { KESSEKI_SVC_CODE } from "../Billing/BlCalcData.js";
import TokyoDairiTsuchi from './TokyoDairiTsuchi.js';
import InvoiceWithCopy from './InvoiceWithCopy.js';
import {LinksTab} from '../common/commonParts.js';
import Kyuhuhi from './Kyuhuhi.js';
import ScheduleListByUser from './ScheduleListByUser.js';
import { CalendarPerUsersSetting, ReportsRegisterButtons, ReportsSettingButton } from './ReportsSetting.js';
import UserContractReports from './UsersContractReport.js';
import { CheckBillingEtc } from '../Billing/CheckBillingEtc.js';
import { KobeJogenKanri } from './KobeJogenKanri.js';
import { KobeFutanIchiran } from './KobeFutanIchiran.js';
import { KyotoJogenKnari } from './NewKyotoJogenKanri.js';

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
  reportButtonSelected: {
    width: 160, height: 32, display:'flex', alignItems:'center',
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
  selectWrap: {paddingTop: 6, paddingLeft: 12,},
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
  }
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
    selectorOpt: ['標準', '利用なしも出力'],
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
    permission: 70,
  },
  {
    discription: '利用者一覧',
    name: 'userList',
    link: '', created: 0, creating: false, countCheck: false,
    permission: 90,
  },
];

const refactoringScheName = {
  '標準': 'refactoringSchedule', '利用のみ': 'rfSch1Line1', '開始時間のみ': 'rfSch1Line2',
  '利用と送迎': 'rfSch2Line1', '利用と開始 ': 'rfSch2Line2', '5行タイプ': 'rfSch5Line',
}
const uribyuserExcelName = {'標準': 'uribyuser1', '利用なしも出力': 'uribyuser2'}

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
  content.cname = com.hname;
  content.scname = com.shname;
  content.bname = com.bname;
  content.sbname = com.sbname;
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
    com.hname,
    com.bname,
    content.address1,
    content.address2,
    com.ctel,
  ];
  content.unitprice = masterRec.unitPrice;
  // 法人事業所
  content.combrunch = com.hname + ' ' + com.bname;
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
          if(dDate.slice(-2) !== ("0"+String(i+1)).slice(-2)) return false;
          if(!(service==="" || schedule[uid][dDate].service === service)) return false;
          if(schedule[uid][dDate]["absence"]){
            if(!schedule[uid][dDate]["dAddiction"]) absence_list.push("✕");
            else if(!schedule[uid][dDate]["dAddiction"]["欠席時対応加算"]) absence_list.push("✕");
            else absence_list.push("欠");
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
  if (dataLayout === 'uribyuser1' || dataLayout === 'uribyuser2'){
    users.sort((a, b) => (parseInt(a.sindex) - parseInt(b.sindex)));
    // const filtered_users = albCM.getFilteredUsers(users, service, classroom);
    const filtered_users = users.filter(uDt => {
      if(!albCM.isClassroom(uDt, classroom)) return false;
      else if(!(service==="" || new RegExp(service).test(uDt.service))) return false;
      return true;
    })
    const tmp = proseedByUsersDt(filtered_users, billingDt, service);
    let put_data = tmp;
    if(dataLayout === 'uribyuser2'){
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
    put_data.map((e, i)=>{
      const d = [
        i + 1,  // 項番
        e.pname, // 保護者
        e.userName, // ユーザー名
        e.tanni, // 単位数
        e.santei, //算定額
        e.userFutan, // ユーザー負担
        e.actualCost, // 実否
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
    content.hideEmpRows = 'data';
  }
  if (dataLayout === 'uriagedaityou'){
    let cnt = 1;
    billingDt.map((e, i)=>{
      // usersはフィルタされている値が来る。これで見つからない場合はスキップする
      const ui = comMod.getUser(e.UID, users);
      if (!Object.keys(ui).length)  return false;
      // 単位ゼロのデータもスキップ
      if(!(service==="" || new RegExp(service).test(ui.service))) return false;
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

// このコンポーネントでは代理受領通知の日付の利用者負担額一覧の日付を
// 設定する
// ->変更 ボタン押下でDispatchも行う。
const SetReportDate = (props) => {
  // itemは今のところ代理受領通知日、利用者負担額一覧発行日も追加予定
  const dispatch = useDispatch();
  const classes = useStyles();
  const stdDate = useSelector(state=>state.stdDate);
  const hid = useSelector(state=>state.hid);
  const bid = useSelector(state=>state.bid);
  const schedule = useSelector(state=>state.schedule);
  const service = useSelector(state=>state.service);
  const {formChange, setFormChange, item, setmsg, setseverity} = props;
  const tDate = comMod.parseDate(stdDate).date.dt;
  let nDate;
  if (item === '代理受領通知日'){
    // 代理受領通知日未設定時の初期値。基準日翌々月の１２日
    nDate = new Date(tDate.getFullYear(), tDate.getMonth() + 2, 12);
  }
  else if (item === '利用者負担額一覧表'){
    // 利用者負担額一覧未設定時の初期値。基準日翌月の１日
    nDate = new Date(tDate.getFullYear(), tDate.getMonth() + 1, 1);
  }
  // その他はとりあえず今日日付で
  else nDate = new Date();
  const jtInit = comMod.formatDate(nDate, 'YYYY-MM-DD');
  console.log(comMod.findDeepPath(schedule, ['report', service, item]))
  const jtDef =
    (comMod.findDeepPath(schedule, ['report', service, item])) ? 
    schedule.report[service][item] : jtInit;
  // Snackのパラメータ設定がバラバラなのでまとめておく
  const setSnack = (prms) => {
    const {msg, severity} = prms;
    setmsg(msg);
    setseverity(severity);
  }
  // 代理受領通知へのDispatchは別途ボタンイベントを設定する
  // setPreviewと一緒には出来ない！
  const handleClick = () => {
    const sch = {...schedule};
    // if (!sch[service]) sch[service] = {};
    // sch[service][item] = repotDate;
    const repotDate = document.querySelector(`#${item} [name=repotDate]`).value;
    if (!sch.report) sch.report = {};
    if (!sch.report[service])  sch.report[service] = {};
    sch.report[service][item] = repotDate;
    // dispatch(Actions.setStore({schedule: sch}));
    // 送信を行ったらフォーム変更フラグはリセットする
    setFormChange({...formChange, [item]: true});
    // comMod.setSchedleLastUpdate(dispatch, path); // 自動セーブ予約
    const partOfSch = {report: sch.report};
    const sentPrms = {hid, bid, date:stdDate, partOfSch};
    sch.timestamp = new Date().getTime();
    dispatch(Actions.setStore({schedule: sch}));
    albCM.sendPartOfSchedule(sentPrms, '', setSnack, '日付を登録しました。');
  }
  // フォームの更新検出用
  const handleChange = () => {
    setFormChange({...formChange, [item]: true});
  };
  const wrapperStyle = {paddingLeft: 0, paddingRight: 0}
  // const inputLabels = {
  //   代理受領通知日:'日付設定',
  //   利用者負担額一覧表:'日付設定'
  // };
  return (<>
    <form id={item} className={classes.setDateForm}
      onChange={handleChange}
    >
      <DateInput 
        name='repotDate' 
        // label={inputLabels[item]}
        label={'日付設定'}
        required
        def = {jtDef}
        wrapperStyle={wrapperStyle}
        cls='tfMiddle'
      />
      <Button 
        variant='contained'
        onClick={()=>{handleClick()}}
      >
        登録
      </Button>
    </form>
  </>)
}

// const SetTeikyoujissekiSetting = (props) => {
//   const {tkjSetting, setTkjSetting} = props;
//   const handleChange =(e)=>{
//     const target = e.currentTarget;
//     const value = target.value;
//     const t = {...tkjSetting};
//     t[target] = value;
//     setTkjSetting(t);
//   }
//   const handleClick = () => {
//     const tkjStr = tkjSetting.rows + ',' + tkjSetting.height;
//     comMod.setCookeis('tkjSetting', tkjStr);
//   }

//   return (<>
//     <TextGP
//       name='rows' label='行数'
//       value={tkjSetting.rows} 
//       cls='tfSmallTime'
//       onChange={(e) => handleChange(e)}
//     />
//     <TextGP
//       name='height' label='行高さ'
//       value={tkjSetting.height}
//       cls='tfSmallTime'
//       onChange={(e) => handleChange(e)}
//     />
//     <Button 
//       variant='contained'
//       onClick={()=>{handleClick()}}
//     >
//       登録
//     </Button>


//   </>)
// }

export const PrintButton = ({setPreview}) => {
  const classes = useStyles();
  // 印刷ボタン
  const handlePrintClick = () =>{
    window.print();
  }
  // 表示切り替えハンドラ
  const handleDispChangeClick = (ev) => {
    const name = ev.currentTarget.getAttribute('name');
    setPreview(name);
  }

  //11/07　橋本追加　style={{zIndex: 100}}
  return(
    <div className={classes.printCntRoot + ' noprint'} style={{zIndex: 100}}>
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
      </div>
    </div>
  )
}

const ReportsMain = () => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const stdDate = useSelector(state => state.stdDate);
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
  const tmpUserList = users
  // .filter(e=>classroom === '' || classroom === e.classroom)
  .filter(e=>albCM.isClassroom(e, classroom))
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
    '請求書・受領書選択': '請求書', '提供実績種別': '23行', '代理受領通知': '国の標準形式',
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


    const name = ev.currentTarget.getAttribute('name');
    // クリック元のnameに対応したテンプレート名のリスト
    const templateList = {
      uribyuser1: 'URI01_03.xlsx',  //橋本追加　変更前'URI01_01.xlsx'
      uribyuser2: 'URI01_03.xlsx',  //吉村変更 2023/05/24 02->03
      invoice_seikyuu: 'inv01.xlsx',
      invoice_juryou: 'inv01.xlsx',
      invoice_seikyuu_hikae: 'inv01.xlsx',
      invoice_juryou_hikae: 'inv01.xlsx',
      monthriyou: 'sch01-1.xlsx',
      uriagedaityou: 'uri02_01.xlsx',
      riyoukakunin: 'uri03.xlsx',
      userList: 'userlist-1.xlsx',  //橋本追加　変更前'userlist.xlsx'
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
  const nodesRender = nodes.filter(e=>e.permission<=permission)
  .map((e, i)=>{
    return(
      <div className='reportCntRow' key={i}>
        <div className='reportDisc' style={new_schedule_styles}>
          {e.discription}
          {e.selector
            ?<div className={classes.selectWrap}>
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

  // 納品請求書のプレビュークリック用
  const handlePreviewClick = (ev) =>{
    const name = ev.currentTarget.getAttribute('name');
    console.log(name)
    setPreview(selects[name]);
  }
  return(
    <div className='AppPage reports'>

      <div className={'navigation '} style={displaySw.navigetion}>
        {/* <CheckProgress inline /> */}
        {/* <div style={{padding:8}}>
          <RecalcButton hidePrint={1}/>
        </div> */}
        {(permission === 100  || stdDate >= '2023-08-01') &&
          <CheckBillingEtc billingDt={billingDt} />
        }
        {(stdDate < '2023-08-01') &&
          <CheckProgress inline />
        }

        <div style={{height: 16}}></div>
        {nodesRender}

        <div className='reportCntRow' >
          <div className='reportDisc' >
            請求書・受領書
            <div style={{paddingLeft: 12, paddingTop: 6}}>
              <SelectGp
                nameJp={'請求書・受領書選択'}
                value={selects['請求書・受領書選択']}
                // size='large'
                styleUse='tfMiddle'
                opts={[
                  '請求書', '請求書控え', '請求書控え付き', 
                  '受領書', '受領書控え', '受領書控え付き', 
                  '領収書', '領収書控え', '領収書控え付き'
                ]}
                onChange={(ev) => handleChange(ev)}
                hidenull
                noLabel
              />
            </div>
          </div>
          <div className='genButton'>
            <Button
              className={classes.reportButtonSelected}
              name={'請求書・受領書選択'}
              variant='contained'
              color='primary'
              onClick={handlePreviewClick}
            >
              印刷用ページへ
            </Button>
          </div>
          <div className='reportDateSet'>
            <SetReportDate 
              formChange={formChange} setFormChange={setFormChange}
              item='請求書受領書'
              setmsg={setmsg} setseverity={setseverity}
            />
          </div>
        </div>
        <div className='reportCntRow' style={{marginTop: -32, marginBottom: 16}}>
          <div className='reportDisc'></div>            
          <div className='genButton' style={{width: 160}}>
            <ReportsSettingButton settingItem="invoice"/>
          </div>
        </div>
        {permission >= PERMISSION_URIAGE && <>

          <div className='reportCntRow'>
            <div className='reportDisc'>通所給付費明細</div>
            <div className='genButton'>
              <Button
                className={classes.reportButton}
                variant='contained'
                color='primary'
                onClick={()=>{
                  setPreview('通所給付費明細');
                }}
              >
                印刷用ページへ
              </Button>
            </div>
          </div>

          <div className='reportCntRow'>
            <div className='reportDisc'>給付費請求書</div>
            <div className='genButton'>
              <Button
                className={classes.reportButton} variant='contained'
                color='primary'
                onClick={()=>{
                  setPreview('給付費請求書');
                }}
              >
                印刷用ページへ
              </Button>
            </div>
          </div>
          
          <div className='reportCntRow'>
            <div className='reportDisc'>
              代理受領通知
              <div className={classes.selectWrap}>
                <SelectGp
                  nameJp={'代理受領通知'}
                  value={selects['代理受領通知']}
                  styleUse='tfMiddleL'
                  opts={['国の標準形式', '東京都形式', '東京都形式控え付き']}
                  onChange={(ev) => handleChange(ev)}
                  hidenull
                  noLabel
                />
              </div>
            </div>
            <div className='genButton'>
              <Button className={classes.reportButtonSelected}
                name={'代理受領通知'}
                variant='contained'
                color='primary'
                onClick={()=>{
                  setPreview('代理受領通知');
                }}
              >
                印刷用ページへ
              </Button>
            </div>
            <div className='reportDateSet'>
              <SetReportDate 
                formChange={formChange} setFormChange={setFormChange}
                item='代理受領通知日'
                setmsg={setmsg} setseverity={setseverity}
              />
            </div>
          </div>          

          <div className='reportCntRow'>
            <div className='reportDisc'>
              上限管理結果票
              <div className={classes.selectWrap}>
                <SelectGp
                  nameJp={'上限管理結果票'}
                  value={selects['上限管理結果票']}
                  styleUse='tfMiddleL'
                  opts={['国の標準形式', '神戸市形式', '京都市形式']}
                  onChange={(ev) => handleChange(ev)}
                  hidenull
                  noLabel
                />
              </div>
            </div>
            <div className='genButton'>
              <Button
                className={classes.reportButton}
                variant='contained'
                color='primary'
                onClick={()=>{
                  setPreview('上限管理結果票');
                }}
              >
                印刷用ページへ
              </Button>
            </div>
            <div className='reportDateSet'>
              <SetReportDate 
                formChange={formChange} setFormChange={setFormChange}
                item='上限管理結果票'
                setmsg={setmsg} setseverity={setseverity}
              />
            </div>
          </div>

          <div className='reportCntRow' style={{marginTop: -32, marginBottom: 16}}>
            <div className='reportDisc'></div>            
            <div className='genButton' style={{width: 160}}>
              <ReportsSettingButton settingItem="jogenKanri"/>
            </div>
          </div>

          <div className='reportCntRow'>
            <div className='reportDisc'>
              利用者負担額一覧表
              <div className={classes.selectWrap}>
                <SelectGp
                  nameJp={'利用者負担額一覧表'}
                  value={selects['利用者負担額一覧表']}
                  styleUse='tfMiddleL'
                  opts={['国の標準形式', '神戸市形式']}
                  onChange={(ev) => handleChange(ev)}
                  hidenull
                  noLabel
                />
              </div>
            </div>
            <div className='genButton'>
              <Button className={classes.reportButtonSelected}
                variant='contained'
                color='primary'
                onClick={()=> setPreview('利用者負担額一覧表')}
              >
                印刷用ページへ
              </Button>
            </div>
            <div className='reportDateSet'>
              <SetReportDate 
                formChange={formChange} setFormChange={setFormChange}
                item='利用者負担額一覧表'
                setmsg={setmsg} setseverity={setseverity}
              />
            </div>
          </div>

          <div className='reportCntRow'>
            <div className='reportDisc'>
              提供実績記録票
              <div style={{paddingLeft: 12, paddingTop: 6}}>
                <SelectGp
                  nameJp={'提供実績種別'}
                  value={selects['提供実績種別']}
                  // size='large'
                  styleUse='tfMiddle'
                  opts={['23行', '27行', '白紙', '白紙（利用なし含む）']}
                  onChange={(ev) => handleChange(ev)}
                  hidenull
                  noLabel
                />
              </div>            
            </div>
            <div className='genButton'>
              <Button
                className={classes.reportButton}
                variant='contained'
                color='primary'
                onClick={()=>{
                  setPreview('提供実績記録票');
                }}
              >
                印刷用ページへ
              </Button>
            </div>
          </div>

          <div className='reportCntRow' style={{marginTop: -20, marginBottom: 16}}>
            <div className='reportDisc'></div>            
            <div className='genButton' style={{width: 160}}>
              <ReportsSettingButton settingItem="teikyouJisseki"/>
            </div>
          </div>

          <div className='reportCntRow'>
            <div className='reportDisc'>利用者別カレンダー</div>
            <div className='genButton'>
              <Button
                className={classes.reportButton} variant='contained'
                color='primary'
                onClick={()=>{
                  setPreview('利用者別スケジュール');
                }}
              >
                印刷用ページへ
              </Button>
            </div>
            <CalendarPerUsersSetting />
          </div>

          {/* 橋本追加　契約内容報告書関係 */}
          <div className='reportCntRow'>
            <div className='reportDisc'>契約内容報告書</div>
            <div className='genButton'>
              <Button
                className={classes.reportButton}
                variant='contained'
                color='primary'
                onClick={()=>{
                  setPreview('契約内容報告書');
                }}
              >
                印刷用ページへ
              </Button>
            </div>
          </div>
          <div className='reportCntRow' style={{marginTop: -8, marginBottom: 16}}>
            <div className='reportDisc'></div>            
            <div className='genButton' style={{width: 160}}>
              {/* <ReportsSettingButton settingItem="contractInfo"/> */}
              <ReportsRegisterButtons registerItem="contractInfo"/>
            </div>
          </div>

          <div className='reportCntRow'>
            <ReportsSettingButton settingItem="all"/>
          </div>
        
        </>}

        <div className={classes.dialogOpenButtonRoot}>
        <UserSelectDialogWithButton
          open={userSelectOpen} setOpen={setUserSelectOpen}
          userList={userList} setUserList={setUserList}
        >
          <div className='scheduleCount'>
            対象件数 <span>{scheduleCount}</span> 件
          </div>
        </UserSelectDialogWithButton>
      </div>
      <div className={'printPreview '} style={displaySw.preview}>
        <PrintButton setPreview={setPreview}/>
        {/* OR検索で全て表示 */}
        <ScheduleListByUser userList={userList} preview={preview}/>
        <Invoice userList={userList} preview={preview}/>
        <InvoiceWithCopy userList={userList} preview={preview}/>
        <TuusyokyuuhuMeisai userList={userList} preview={preview} selects={selects}/>
        <TokyoDairiTsuchi userList={userList} preview={preview} selects={selects} key={"tokyoDairiTsuchi"}/>
        <TeikyouJisseki userList={userList} preview={preview} selects={selects.提供実績種別}/>

        {/* 常に全表示 */}
        <ReportJougenKanri userList={userList} preview={preview} hidePersonalInfo={hidePersonalInfo} selects={selects}/>
        <KobeJogenKanri userList={userList} preview={preview} hidePersonalInfo={hidePersonalInfo} selects={selects}/>
        <KyotoJogenKnari userList={userList} preview={preview} hidePersonalInfo={hidePersonalInfo} selects={selects} />
        <KobeFutanIchiran userList={userList} preview={preview} hidePersonalInfo={hidePersonalInfo} selects={selects}/>
        <Kyuhuhi preview={preview} userList={userList}/>

        {/* その他 */}
        <UserContractReports userList={userList} preview={preview}/>
      </div>
      <SnackMsg msg={msg} severity={severity} setmsg={setmsg} />
      {/* <ServiceCountNotice /> */}

    </div>
  )
}

export const RepportsLinksTab = ({permission=null}) => {
  const menu = [
    { link: "/reports", label: "一般" },
  ];
  if(permission >= 90){
    menu.push({ link: "/reports/usagefee", label: "ご利用料金" });
  }

  return (<LinksTab menu={menu}/>)
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
      <RepportsLinksTab permission={permission}/>
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