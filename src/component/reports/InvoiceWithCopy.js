import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useSelector } from 'react-redux';
import * as comMod from '../../commonModule';
import { setBillInfoToSch } from '../Billing/blMakeData';
import teal from '@material-ui/core/colors/teal';
import SetPrintTitle from '../common/SetPrintTitle';
import { ReportsSettingButton } from './ReportsSetting';

// 最小行数
const MIN_ROWLENGTH = 8;

/**
 * previewから適切な決まり文句を返す
 * @param {String} preview 
 * @returns {String}
 */
const getReportComment = (preview) => {
  if (preview.includes('請求')){
    return "下記の通りご請求申し上げます。ご確認いただけますようお願い申し上げます。";
  }else if (preview.includes('受領')){
    return "下記、正に受領致しました。";
  }else if (preview.includes('領収')){
    return "下記、正に領収しました。";
  }
  return "";
}

/**
 * 実費をソート
 * @param {Object} bDt 
 * @param {Object} com 
 * @param {Object} config 
 */
const acCostDetaiSort = (bDt, com, config) => {
  // 初期値の実費項目
  let acConstDef = comMod.findDeepPath(com, 'etc.actualCostList');
  acConstDef = acConstDef? acConstDef: config.actualCostList;
  if (!bDt.actualCostDetail) return false;
  if (!bDt.actualCostDetail.length) return false;
  bDt.actualCostDetail.sort((a, b)=>{
    if (acConstDef[a.name]) return -1;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
  });
}

const useStyles = makeStyles({
  page: {
    marginTop: '128px',
    marginBottom: '128px',
    '@media print': {
      margin: 0,
      '& .printMargin': {
        height: '108px',
      },
      '& .overMinLength': {
        pageBreakAfter: 'always',
      }
    }
  },
  invoiceHead:{
    maxHeight: '160px',
    display:'flex',
    justifyContent: 'space-between',
    '& .left' :{
      width: '40%',
    },
    '& .right' : {
      width:'40%',textAlign: 'right',
      '& > div': {textAlign: 'right'},
    },
    '& .center':{
      width: '20%',
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
      textAlign:'center',
      color: teal[900],
    },
    '& .date': {
      marginBottom: 8,
    },
  },
  comment: {
    marginTop: '-32px',
  },
  total: {
    fontSize: '1.2rem',
    padding: '8px 0 2px',
    borderBottom: '2px solid' + teal[600],
    display:'flex',
    justifyContent: 'space-between',
    width: '60%',
    marginTop:16,
  },
  invtbl:{
    width: '100%',
    marginTop:16,
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
    '& .total': {
      borderBottom: '2px solid' + teal[600],
      borderTop: '1px solid' + teal[600],
    },
  },
  reportsNotice: {
    marginTop: 16,
    minHeight: '48px',
    lineHeight: '1.5rem',
    whiteSpace: 'pre-wrap',
  },
  oneReport: {
    marginBottom: '64px',
    '@media print': {
      margin: 0,
      pageBreakInside: 'avoid',
      '&.original': {paddingBottom: '10mm'},
      '&.copy': {paddingTop: '10mm'},
      '&.overMinLength': {
        '&.original': {paddingTop: '60px'},
        '&.copy': {paddingTop: '60px'},
      }
    }
  },
  pages: {
    '& .onePage': {
      '&:not(:last-child)': {pageBreakAfter: 'always',},
    }
  }
});

const Page = (props) => {
  const users = useSelector(state => state.users);
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-");
  const com = useSelector(state => state.com);
  const classes = useStyles();
  const {bDt, preview, reportDateDt} = props
  const config = useSelector(state=>state.config);

  const displayDate = com?.ext?.reportsSetting?.invoice?.displayDate ?? com?.etc?.configReports?.invoice?.displayDate ?? true;
  const displayNotice = com?.ext?.reportsSetting?.invoice?.displayNotice ?? com?.etc?.configReports?.invoice?.displayNotice ?? true;
  // 帳票設定の請求書コメント
  const reportsNotice = com?.ext?.reportsSetting?.invoice?.notice ?? com?.etc?.reports?.invoice?.notice ?? "";
  // 帳票設定の受領・領収書コメント
  const reportsNotice2 = com?.ext?.reportsSetting?.invoice?.notice2 ?? com?.etc?.reports?.invoice?.notice2 ?? "";
  // 障害児を児童に変換するか？
  const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
  // 登録番号
  const tekiseiJino = !preview.includes("受領") ?(com?.etc?.tekiseiJino ?? "") :"";

  const thisUser = comMod.getUser(bDt.UID, users);
  const preview_list = [];
  if(preview === "請求書控え付き"){
    preview_list.push("請求書");
    preview_list.push("請求書控え");
  }else if(preview === "受領書控え付き"){
    preview_list.push("受領書");
    preview_list.push("受領書控え");
  }else if(preview === "領収書控え付き"){
    preview_list.push("領収書");
    preview_list.push("領収書控え");
  }

  // 実費ソート
  acCostDetaiSort(bDt, com, config);
  const actualCostDetail = bDt.actualCostDetail ?? [];
  const overMinLength = actualCostDetail.length >= MIN_ROWLENGTH-1;
  const rowLength = overMinLength ?actualCostDetail.length :MIN_ROWLENGTH-1;

  const invoiceWithCopyNodes =  preview_list.map(preview => {
    let title = preview.replace("控え", "（控）");

    const comment = getReportComment(preview);

    // 帳票日付設定関係
    const reportDateStr = reportDateDt["請求書受領書"] ?? `${stdYear}-${stdMonth}-15`;
    const [reportYear, reportMonth, reportDate] = reportDateStr.split("-");

    // 合計値計算と文字列変換    
    const grandTotal = (bDt?.actualCostDetail ?? []).reduce((prevTotal, dt) => {
      prevTotal += dt.price;
      return prevTotal;
    }, bDt.kanrikekkagaku - comMod.null2Zero(bDt.jichiJosei));
    const grandTotalStr = '￥' + comMod.formatNum(grandTotal, 1) + '-';

    const invoiceHead = (<>
      <div className={classes.invoiceHead}>
        <div className='left'>
          <div className='large'>{thisUser.pname} 様</div>
          <div>{thisUser.hno + ' ' + thisUser.name} 様</div>
          <div>{`${stdYear}年${stdMonth}月分`}</div>
        </div>
        <div className='center'>
          <div className='title'>{title}</div>
        </div>
        <div className='right'>
          <div className='date'>
            {displayDate!==false ?`${reportYear}年${reportMonth}月${reportDate}日` :"　　　　年　　月　　日"}
          </div>
          <div>{(com?.ext?.hname || com.hname)}</div>
          <div>{com.bname}</div>
          {tekiseiJino!=="" &&<div style={{marginBottom: 4}}>登録番号：{tekiseiJino}</div>}
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

    const tabeleAcRows = Array(rowLength).fill(null).map((_, i) => {
      const tdContent = (key) =>(
        (i < bDt.actualCostDetail.length)? 
          (isNaN(bDt.actualCostDetail[i][key])) ?
            bDt.actualCostDetail[i][key] : 
            comMod.formatNum(bDt.actualCostDetail[i][key], 1):''
      );
      return(
        <tr className='tblDetail' key={i}>
          <td className='num'>
            {
              (i < bDt.actualCostDetail.length) ? (i + 2) : " "
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
      const futangaku = bDt.kanrikekkagaku - comMod.null2Zero(bDt.jichiJosei);
      return(
        <tr className='tblDetail'>
          <td className='num'>1</td>
          <td>
            {thisUser.service.includes('放課後等デイサービス')
              ?(convJido ?'児童':'障害児')+'通所給付費利用者負担額'
              :(convJido ?'児童':'障害児')+'発達支援給付費利用者負担額'
            }
          </td>
          <td className='num'>{comMod.formatNum(futangaku, 1)}</td>
          <td className='num'>1</td>
          <td className='num'>{comMod.formatNum(futangaku, 1)}</td>
          <td className='notice'>{displayNotice ?"ご利用回数"+bDt.countOfUse+"回" :""}</td>
        </tr>
      )
    }

    const tableTotalRow = (
      <tr className='total'>
        <td></td>
        <td>合計</td>
        <td></td>
        <td></td>
        <td className='num'>{comMod.formatNum(grandTotal, 1)}</td>
        <td className='notice'>{tekiseiJino ?"（消費税非課税）" :""}</td>
      </tr>
    )

    return(
      <div
        className={`${classes.oneReport} ${overMinLength ?"overMinLength" :""} ${preview.includes("控") ?"copy" :"original"}`}
      >
        {invoiceHead}
        <table className={classes.invtbl}>
          <tbody>
          {tabelTitle}
          <TableJikofutanRow/>
          {tabeleAcRows}
          {tableTotalRow}
          </tbody>
        </table>
        <div className={classes.reportsNotice}>
          {(reportsNotice!=="" && title.includes("請求書")) &&comMod.brtoLf(reportsNotice)}
          {(reportsNotice!=="" && title.includes("受領書")) &&comMod.brtoLf(reportsNotice2)}
          {(reportsNotice!=="" && title.includes("領収書")) &&comMod.brtoLf(reportsNotice2)}
        </div>
      </div>
    )
  });

  return (
    <div className={`${classes.page} onePage`}>
      {!overMinLength &&<div className='printMargin' />}
      {invoiceWithCopyNodes[0]}
      {!overMinLength &&<div className='printMargin' />}
      {invoiceWithCopyNodes[1]}
    </div>
  )
}

const InvoiceWithCopy = (props) => {
  const classes = useStyles();
  const nameList = ['請求書控え付き', '受領書控え付き', '領収書控え付き'];
  const {userList, preview, reportDateDt} = props;
  const stdDate = useSelector(state => state.stdDate);
  const schedule = useSelector(state => state.schedule);
  const users = useSelector(state => state.users);
  const com = useSelector(state => state.com);
  const serviceItems = useSelector(state => state.serviceItems);
  const service = useSelector(state => state.service);

  // リストにないプレビューが送られてきたら何もしないで終了
  if (!nameList.includes(preview))  return null;

  // calledBy対応済み
  const billingParams = {stdDate, schedule, users, com, service, serviceItems, calledBy: 'invoicewithcopy'};
  const { billingDt } = setBillInfoToSch(billingParams);

  // 請求書帳票設定
  const doPrintBilling = com?.ext?.reportsSetting?.invoice?.doPrintBilling ?? com?.etc?.configReports?.invoice?.doPrintBilling ?? false;
  const doPrintSchedule = com?.ext?.reportsSetting?.invoice?.doPrintSchedule ?? com?.etc?.configReports?.invoice?.doPrintSchedule ?? false;

  const pages = users.filter(user => {
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
    const oneProps = {bDt, preview, reportDateDt};
    return(
      <Page {...oneProps} key={i}/>
    )
  });

  return(
    <>
    <div className={classes.pages}>{pages}</div>
    {!Boolean(pages.length) &&(
      <div style={{marginTop: '120px', lineHeight: '1.5rem', paddingLeft: '61.25px'}}>
        <div>表示対象がありません。</div>
        <div>請求額がない利用者を印刷する場合は<ReportsSettingButton settingItem="invoice" style={{display: 'inline-flex'}}/>から「請求額がない利用者も印刷」を設定してください。</div>
      </div>
    )}
    {/* <SetPrintTitle printTitle={preview} /> */}
    </>
  )
}
export default InvoiceWithCopy;