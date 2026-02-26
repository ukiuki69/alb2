import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { makeStyles, ServerStyleSheets } from '@material-ui/core/styles';
import { connect, useDispatch, useSelector, useStore } from 'react-redux';
import * as mui from '../common/materialUi';
import * as afp from '../common/AddictionFormParts';
import * as sfp from '../common/StdFormParts';
import * as Actions from '../../Actions';
import * as comMod from '../../commonModule';
import * as albCM from '../../albCommonModule';
import Button from '@material-ui/core/Button';
import {
  setBillInfoToSch, makeBiling, makeJugenkanri, makeTeikyouJisseki
} from '../Billing/blMakeData';
import {
  proseedByUsersDt
} from '../Billing/Proseed'
import axios from 'axios';
import { LoadingSpinner, LoadErr } from '../common/commonParts';
import useInterval from 'use-interval';
import GroupIcon from '@material-ui/icons/Group';
import { FormatBold, FullscreenExit } from '@material-ui/icons';
import SnackMsg from '../common/SnackMsg';
import teal from '@material-ui/core/colors/teal';
import SetPrintTitle from '../common/SetPrintTitle';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { ReportsSettingButton } from './ReportsSetting';

const getBillingItemName = (itemDt) => {
  const itemName = itemDt.c;
  if(!checkValueType(itemName, "String")) return "";
  if(itemName.slice(-1) === "・") return itemName.slice(-1);
  return itemName;
}

const useStyles = makeStyles({
  invoiceHead:{
    display:'flex',
    marginTop: 60,
    '& .left' :{
      width: '40%',
    },
    '& .right' : {
      width: '60%', textAlign: 'right',
      '& > div': {textAlign: 'right'},
    },
    '& >div>div' : {
      padding: '4px 0',
    },
    '& .large' : {
      fontSize: '1.4rem',
      padding: '6px 0',
    },
    '& .tall': {
      padding: '6px 0',
    },
    '& .small': {
      padding: '2px 0',
      fontSize: '.8rem'
    },
    '& .title': {
      padding: '12px 0 6px',
      fontSize: '2.2rem',
      width: '75%',
      backgroundColor: teal[50],
      marginTop: 72,
      marginBottom: 4,
      textAlign:'center',
      color: teal[900],
    },
    '& .date': {
      marginBottom: 8,
    },
  },
  comment: {
    padding: '8px 0',
    marginTop: 48,
  },
  total: {
    fontSize: '1.2rem',
    padding: '8px 0 2px',
    // borderColor: teal[600],
    borderBottom: '2px solid' + teal[600],
    display:'flex',
    justifyContent: 'space-between',
    width: '60%',
    marginTop:24,
  },
  invtbl:{
    width: '100%',
    marginTop:24,
    '& td ' : {
      padding: '12px 8px 8px',
    },
    '& .notice':{
      minWidth: "120px"
    },
    '& td.num': {
      textAlign: 'right',
    },
    '& .title': {
      textAlign: 'center',
      borderBottom: '1px solid' + teal[600],
      borderTop: '1px solid' + teal[600],
    },
    '& .tblDetail': {
      height: 36,
    },
    '& .tblDetail:nth-of-type(even)': {
      backgroundColor: teal[50],
    },
    // '& tr:nth-of-type(odd)': {
    //   backgroundColor: teal[50],
    // },
    '& .total': {
      borderBottom: '2px solid' + teal[600],
      borderTop: '1px solid' + teal[600],
      // backgroundColor: teal[50],
    },
  },
  reportsNotice: {
    marginTop: '16px',
    lineHeight: '1.5rem',
    whiteSpace: 'pre-wrap',
  },
  UserBillingDetail: {
    fontSize: '14px', marginTop: '16px',
    '& .wMin': { width: "32px" },
    '& .w10': { width: "10%" },
    '& .w15': { width: "15%" },
    '& .w50': { width: "50%"},
    '& .wResidue': { width: "calc(55% - 32px)" },
    '& .left': { textAlign: "left", },
    '& .right': { textAlign: "right" },
    '& .center': { textAlign: "center", },
    '& .row': {
      display: 'flex',
      '& > div': {padding: "5px 4px"}
    },
    '& .header': {
      borderTop: `1px solid ${teal[600]}`,
      borderBottom: `1px solid ${teal[600]}`,
    },
    '& .body': {
      '& .row':{
        '&:nth-child(2n+1)': {backgroundColor: teal[50]},
        '&:last-child': {borderBottom: `2px solid ${teal[600]}`}
      }
    }
  }
});

const acCostDetaiSort = (thisBdt, com, config) => {
  // 初期値の実費項目
  let acConstDef = comMod.findDeepPath(com, 'etc.actualCostList');
  acConstDef = acConstDef? acConstDef: config.actualCostList;
  if (!thisBdt.actualCostDetail) return false;
  if (!thisBdt.actualCostDetail.length) return false;
  thisBdt.actualCostDetail.sort((a, b)=>{
    if (acConstDef[a.name]) return -1;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
  });

}

const UserBillingDetail = (props) => {
  const classes = useStyles();
  const {userBillingDt} = props;

  const itemTotal = userBillingDt.itemTotal ?? [];
  itemTotal.sort((a, b) => {
    if(a.baseItem && !b.baseItem) return -1;
    if (!a.baseItem && b.baseItem) return 1;
    return a.s < b.s ?-1 :1;
  });

  const bodyRows = itemTotal.filter(itemDt => {
    if(!itemDt) return false;
    if(!itemDt.tanniNum) return false;
    if(itemDt.tanniNum == 0) return false;
    return true;
  }).map((itemDt, index) => {
    const itemName = getBillingItemName(itemDt);
    return(
      <div className='row' key={itemDt.s}>
        <div className='wMin right'>{index+1}</div>
        <div className='w10'>{itemDt.s}</div>
        <div className='wResidue left'>{itemName}</div>
        <div className='w10 right'>{itemDt.v.toLocaleString()}</div>
        <div className='w10 right'>{itemDt.count.toLocaleString()}</div>
        <div className='w15 right'>{itemDt.tanniNum.toLocaleString()}</div>
      </div>
    )
  });

  const sumTanni = itemTotal.reduce((prevSumTanni, itemDt) => {
    prevSumTanni += (itemDt.tanniNum ?? 0);
    return prevSumTanni;
  }, 0);

  return(
    <div className={classes.UserBillingDetail}>
      <div className='header'>
        <div className='row'>
          <div className='wMin'>No</div>
          <div className='w10'>コード</div>
          <div className='wResidue'>サービス名</div>
          <div className='w10 center'>単位</div>
          <div className='w10 center'>数量</div>
          <div className='w15 center'>単位数</div>
        </div>
      </div>
      <div className='body'>
        {bodyRows}
        <div className='row'>
          <div className='wMin' />
          <div className='w10' />
          <div className='wResidue' />
          <div className='w10 center' />
          <div className='w10 center'>合計</div>
          <div className='w15 right'>{sumTanni.toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}

export const OnePageOfInvoice = (props) =>{
  const classes = useStyles();
  const {
    thisBdt, userList, users, stdDate, com, service, preview, reportDateDt, specialStateDate,
    specialRowLength,
    ...others
  } = props
  const rowLength = (() => {
    if(specialRowLength) return specialRowLength;
    if(preview.includes("単位明細付き")){
      const itemTotal = thisBdt.itemTotal ?? [];
      if(itemTotal.length > 25) return 4;
      if(itemTotal.length > 20) return 7;
      if(itemTotal.length > 15) return 9;
    }
    return 14;
  })();
  const config = useSelector(state=>state.config);
  const schedule = useSelector(state=>state.schedule);

  const displayDate = com?.ext?.reportsSetting?.invoice?.displayDate ?? com?.etc?.configReports?.invoice?.displayDate ?? true;
  const displayNotice = com?.ext?.reportsSetting?.invoice?.displayNotice ?? com?.etc?.configReports?.invoice?.displayNotice ?? true;
  const reports_notice = com?.ext?.reportsSetting?.invoice?.notice ?? com?.etc?.reports?.invoice?.notice ?? "";
  const reports_notice2 = com?.ext?.reportsSetting?.invoice?.notice2 ?? com?.etc?.reports?.invoice?.notice2 ?? "";
  const doPrintBilling = com?.ext?.reportsSetting?.invoice?.doPrintBilling ?? com?.etc?.configReports?.invoice?.doPrintBilling ?? false;
  const doPrintSchedule = com?.ext?.reportsSetting?.invoice?.doPrintSchedule ?? com?.etc?.configReports?.invoice?.doPrintSchedule ?? false;

  const thisUser = comMod.getUser(thisBdt.UID, users);
  let title = preview.replace("控え", "（控）").replace("単位明細付", "");
  let comment;
  if (title.indexOf('請求書') > -1){
    comment = '下記の通りご請求申し上げます。ご確認いただけますようお願い申し上げます。';
  }
  else if (title.indexOf('受領書') > -1){
    comment = '下記、正に受領致しました。';
  }
  else if (title.indexOf('領収書') > -1){
    comment = '下記、正に領収しました。'
  }

  // 帳票日付設定関係
  const [stdYear, stdMonth] = stdDate.split("-");
  const stateDate = reportDateDt?.["請求書受領書"] ?? `${stdYear}-${stdMonth}-15`;
  let invoiceDate = stateDate ?? `${stdYear}-${stdMonth}-15`;
  if(invoiceDate.includes("-")){
    const invoiceDateList = invoiceDate.split("-");
    invoiceDate = `${invoiceDateList[0]}年${invoiceDateList[1]}月${invoiceDateList[2]}日`;
  }
  invoiceDate = displayDate===false ?"　　　　年　　月　　日" :invoiceDate ;
  // propsで日付が渡された場合は強制的に日付を表示
  if(specialStateDate){
    invoiceDate = specialStateDate;
    if(invoiceDate.includes("-")){
      const invoiceDateList = invoiceDate.split("-");
      invoiceDate = `${invoiceDateList[0]}年${invoiceDateList[1]}月${invoiceDateList[2]}日`;
    }
  }

  const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
  const tekiseiJino = !/受領/.test(title) ?com?.etc?.tekiseiJino ?? "" :"";

  // 合計値計算と文字列変換
  let grandTotal = 0;
  thisBdt.actualCostDetail.map(e=>{grandTotal += e.price});
  grandTotal += thisBdt.kanrikekkagaku;
  grandTotal -= comMod.null2Zero(thisBdt.jichiJosei);
  // 「請求額がない利用者も印刷」設定がオフの時は、請求額がない場合表示しない。 
  if (!doPrintBilling && !grandTotal) return null;
  // 「利用なし利用者も印刷」設定がオフの時は、出欠席回数が0の時は表示しない。
  if (!grandTotal && !doPrintSchedule && !(thisBdt.countOfUse + thisBdt.countOfKesseki)) return null;
  const grandTotalStr = '￥' + comMod.formatNum(grandTotal, 1) + '-';
  const invoiceHead = (<>
    <div className={`${classes.invoiceHead} invoiceHead`}>
      <div className='left'>
        <div className='large'>{thisUser.pname} 様</div>
        <div>{thisUser.hno + ' ' + thisUser.name} 様</div>
        <div className='title'>{title}</div>
        <div>{stdDate.substr(0, 4) + '年' + stdDate.substr(5, 2) + '月分'}</div>
      </div>
      <div className='right'>
        <div className='date'>{invoiceDate}</div>
        <div>{(com?.ext?.hname || com.hname)}</div>
        <div>{com.bname}</div>
        {tekiseiJino ?<div style={{marginBottom: 4}}>登録番号：{tekiseiJino}</div> :null}
        <div className='small'>〒{com.postal} {com.city}</div>
        <div className='small'>{com.address}</div>
        <div>TEL:{com.tel}</div>
      </div>
    </div>
    <div className={classes.comment}>{comment}</div>
    <div className={classes.total}>
      <div className='str'>合計額</div>
      <div className='num'>{grandTotalStr}</div>
    </div>
  </>)
  const tabelTitle = (<>
    <tr className='title'>
      <td>項番</td>
      <td>項目</td>
      <td>単価</td>
      <td>数量</td>
      <td>金額</td>
      <td className='notice'>備考</td>
    </tr>
  </>);
  const acCostLength = thisBdt.actualCostDetail.length
  const rowArray = Array(rowLength<acCostLength ?acCostLength :rowLength).fill('');
  acCostDetaiSort(thisBdt, com, config);
  // 2022/02/09 自治体助成反映
  const tabeleAcRows = rowArray.map((e,i)=>{
    // const futangaku = 
    // thisBdt.kanrikekkagaku - comMod.null2Zero(thisBdt.jichiJosei);
    // // 自治体助成のあるなしで実費の表示業が変更になる。
    // const acRowNum = (futangaku)? 2: 1;
    const tdContent = (key) =>(
      (i < thisBdt.actualCostDetail.length)? 
        (isNaN(thisBdt.actualCostDetail[i][key])) ?
          thisBdt.actualCostDetail[i][key] : 
          comMod.formatNum(thisBdt.actualCostDetail[i][key], 1):''
    )
    return(
      <tr className='tblDetail' key={i}>
        <td className='num'>
          {
            (i < thisBdt.actualCostDetail.length) ? (i + 2) : " "
          }
        </td>
        <td>{tdContent('name')}</td>
        <td className='num'>{tdContent('unitPrice')}</td>
        <td className='num'>{tdContent('count')}</td>
        <td className='num'>{tdContent('price')}</td>
        <td className='notice'>{displayNotice ?"" :""}</td>
      </tr>
    )
  });
  const TableJikofutanRow = () => {
    const futangaku = 
    thisBdt.kanrikekkagaku - comMod.null2Zero(thisBdt.jichiJosei);
    // if (futangaku === 0) return null;
    return(
      <tr className='tblDetail'>
        <td className='num'>1</td>
        <td>
          {
            (thisUser.service.includes('放課後等デイサービス')) ?
            (convJido ?'児童':'障害児')+'通所給付費利用者負担額' : (convJido ?'児童':'障害児')+'発達支援給付費利用者負担額'
          }
        </td>
        <td className='num'>{comMod.formatNum(futangaku, 1)}</td>
        <td className='num'>1</td>
        <td className='num'>{comMod.formatNum(futangaku, 1)}</td>
        <td className='notice'>{displayNotice ?"ご利用回数"+thisBdt.countOfUse+"回" :""}</td>
      </tr>
    )
  }

  const tableTotalRow = (
    <tr className='total'>
      <td></td>
      <td style={{textAlign: 'center'}}>合計</td>
      <td></td>
      <td></td>
      <td className='num'>{comMod.formatNum(grandTotal, 1)}</td>
      <td className='notice'>{tekiseiJino ?"（消費税非課税）" :""}</td>
    </tr>

  )
  return(
    <div className='printPage'>
      {invoiceHead}
      <table className={classes.invtbl}>
        <tbody>
          {tabelTitle}
          <TableJikofutanRow/>
          {tabeleAcRows}
          {tableTotalRow}
        </tbody>
      </table>
      {preview.includes("単位明細付") &&<UserBillingDetail userBillingDt={thisBdt} />}
      <div className={classes.reportsNotice}>
        {(reports_notice && preview.includes("請求書")) ?comMod.brtoLf(reports_notice) :""}
        {(reports_notice2 && (preview.includes("受領書") || preview.includes("領収書"))) ?comMod.brtoLf(reports_notice2) :""}
      </div>
      <div className={'pageBreak'}></div>
    </div>
  )
}

export default (props) => {
  const nameList = ['請求書', '請求書控え', '請求書単位明細付', '受領書', '受領書控え', '領収書', '領収書控え'];
  const {userList, preview, reportDateDt, specialStateDate, ...others} = props;
  const dispatch = useDispatch();
  // const classes = useStyles();
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
  const dateList = useSelector(state => state.dateList);
  const allState = useSelector(state=>state);
  const prms = { stdDate, schedule, users, com, service, serviceItems };
  const thisTitle = albCM.getReportTitle(allState, preview);
  const displayService = service ?service :serviceItems[0];
  // リストにないプレビューが送られてきたら何もしないで終了
  if (nameList.indexOf(preview) < 0)  return null;
  prms.calledBy = 'Invoice';
  // calledBy対応済み
  const { billingDt } = setBillInfoToSch(prms);

  // 請求書帳票設定
  const doPrintBilling = com?.ext?.reportsSetting?.invoice?.doPrintBilling ?? com?.etc?.configReports?.invoice?.doPrintBilling ?? false;
  const doPrintSchedule = com?.ext?.reportsSetting?.invoice?.doPrintSchedule ?? com?.etc?.configReports?.invoice?.doPrintSchedule ?? false;

  const pagesOfInvoice = users.filter(user => {
    // ユーザーリストにないデータは場合は対象外
    if(!userList.find(f => f.uid === user.uid)) return false;
    // ユーザーリストでチェックにないデータは場合は対象外
    if(!userList.find(f => f.uid === user.uid).checked) return false;
    // サービスが含まれていないユーザーは場合は対象外
    if(service!=="" && !new RegExp(service).test(user.service)) return false;
    const bDt = billingDt.find(f => f.UID === `UID${user.uid}`);
    // 請求データがない場合は対象外
    if(!bDt) return false;
    const grandTotal = (bDt?.actualCostDetail ?? []).reduce((prevTotal, dt) => {
      prevTotal += dt.price;
      return prevTotal;
    }, bDt.kanrikekkagaku - comMod.null2Zero(bDt.jichiJosei));
    // 「請求額がない利用者も印刷」設定がオフの時は、請求額がない場合表示しない。 
    if(!doPrintBilling && !grandTotal) return false;
    // 請求額がないかつ「利用なし利用者も印刷」設定がオフの時は、出欠席回数が0の時は表示しない。
    if (!grandTotal && !doPrintSchedule && !(bDt.countOfUse + bDt.countOfKesseki)) return false;
    return true;
  }).sort((userA, userB) => {
    return userA.sindex - userB.sindex;
  }).map((user, i) => {
    const bDt = billingDt.find(f => f.UID === `UID${user.uid}`);
    const oneProps = {
      thisBdt: bDt, userList, users, stdDate, com, service, preview, reportDateDt, specialStateDate
    }
    return( 
      <OnePageOfInvoice {...oneProps} key={i}/>
    ) 
  });

  return(
    <>
    {pagesOfInvoice}
    {!Boolean(pagesOfInvoice.length) &&(
      <div style={{marginTop: '120px', lineHeight: '1.5rem', paddingLeft: '61.25px'}}>
        <div>表示対象がありません。</div>
        <div>請求額がない利用者を印刷する場合は<ReportsSettingButton settingItem="invoice" style={{display: 'inline-flex'}}/>から「請求額がない利用者も印刷」を設定してください。</div>
      </div>
    )}
    {/* <SetPrintTitle printTitle={preview} /> */}
    </>
  );
}