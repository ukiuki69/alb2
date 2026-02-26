import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Checkbox, makeStyles } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import teal from '@material-ui/core/colors/teal';

import * as albCM from '../../albCommonModule';
import { PrintButton } from './Reports';
import { RepportsLinksTab } from './Reports';
import { endPoint } from '../../modules/api';
import { red } from '@material-ui/core/colors';
import { formatNum, parsePermission } from '../../commonModule';
import { UndeConstruction } from '../common/commonParts';

import usageFeeSvg from '../../img/usageFeeImg.svg';
import { UsageFeeTable } from './UsageFeeTable';

const DISPLAY_PERMISSION = 90;
const USAGE_DATE = 10;

const useStyles = makeStyles({
  printPage:{
    marginTop: "60px", pageBreakInside: 'avoid',
  },
  reportButton : {
    width: 160,
    height: 32,
  },
  ufbHead: {
    '& .header': {
      marginBottom: "32px",
      display: 'flex',
    },
    '& .left' :{
      width: '40%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    },
    '& .right' : {
      width: '60%',
      textAlign: 'right',
    },
    '& .small': {
      padding: '2px 0',
      fontSize: '.8rem'
    },
    '& .title': {
      padding: '12px 0',
      fontSize: '2.2rem',
      width: '75%',
      backgroundColor: teal[50],
      textAlign:'center',
      color: teal[900],
    },
    '& .address': {
      marginTop: "16px",
      marginBottom: "8px"
    },
    '& .logo': {
      marginTop: '16px',
      padding: '24px 0'
    },
    '& .ourHname':{
      paddingBottom: "4px",
    },
    '& .tjino': {
      paddingBottom: 4,
    },
    '& .tel':{
      paddingTop: "4px",
    },
    '& .total': {
      width: '60%', fontSize: '1.2rem',
      marginTop:24, padding: '8px 4px 2px',
      borderBottom: `2px solid ${teal[600]}`,
      display:'flex', justifyContent: 'space-between',
    }
  },
  ufbInvoiceTotal: {
    width: "100%",
    '& tr': {
      borderTop: `1px solid ${teal[600]}`,
      '& .title': {
        textAlign: 'center',
        '&:nth-child(1)': {width: '5rem'},
        '&:nth-child(3)': {width: '20%'},
      },
      '& .num': {
        textAlign: 'right',
        '&:nth-child(2)': {width: '15%'},
        '&:nth-child(4)': {width: '30%', paddingRight: '10%'},
      },
    },
    '& tr:last-child': {
      borderBottom: `2px solid ${teal[600]}`,
    },
    '& td': {
      padding: '12px 8px 8px',
    },
    '& .row': {
      display: 'flex', 
      borderTop: `1px solid ${teal[600]}`,
      padding: '0 10%',
      '&:last-child': {
        borderBottom: `2px solid ${teal[600]}`,
      },
      '& .col1, .col2': {
        display: 'flex', width: '50%',
        '& > div': {
          padding: '12px 8px 8px',
        },
        '& .title': {textAlign: 'center', width: '30%'},
        '& .num': {textAlign: 'right', width: '70%'}
      },
      '& .col1': {paddingRight: '5%'},
      '& .col2': {paddingLeft: '5%'},
    }
  },
  ufbTotal: {
    width: "100%",
    '& tr': {
      borderTop: `1px solid ${teal[600]}`,
      '&:last-child': {
        borderBottom: `2px solid ${teal[600]}`,
      }
    },
    '& td': {
      padding: '12px 8px 8px',
    },
    '& .title': {
      textAlign: 'center',
      width: '50%'
    },
    '& .num': {
      textAlign: 'right',
      width: '50%',
      paddingRight: '25%'
    },
  },
  usageFeeTable: {
    width: "100%",
    marginTop: "24px",
    '& .title': {
      textAlign: 'center',
      borderBottom: '1px solid' + teal[600],
      borderTop: '1px solid' + teal[600],
    },
    '& td ' : {
      padding: '12px 8px 8px',
    },
    '& .notice':{
      minWidth: "120px"
    },
    '& td.num': {
      textAlign: 'right',
    },
    '& td.center': {
      textAlign: 'center',
    },
    '& .tblDetail': {
      height: 36,
      '&:nth-of-type(even)':{
        backgroundColor: teal[50],
      }
    },
    '& .total_s': {
      borderTop: '1px solid' + teal[600],
    },
    '& .total_e':{
      borderTop: '1px solid' + teal[600],
      borderBottom: '2px solid' + teal[600]
    }
  }
})

const TAXRATE = 10;

const UsageFeeHeader = (props) => {
  const classes = useStyles();
  const {com, hname, printDate, invoiceSystemSupported, pass_dt} = props;
  const hid = useSelector(state=>state.hid);
  const total_fee = pass_dt.reduce((x, y) => x+=parseInt(y.fee), 0);
  const total_feetax = Math.round(total_fee/TAXRATE);
  const ceoDisplayHid = ['24CZG2ES'];
  const OUR_HNAME = "アルバトス株式会社";
  const OUR_TJINO = "T8010001213501";
  const OUR_POSTAL = "〒104-0061";
  const OUR_ADDRESS1 = "東京都中央区銀座1-22-11";
  const OUR_ADDRESS2 = "銀座大竹ビジデンス2F";
  const OUR_TEL = "050-3187-8731";
  const OUR_CEO = ceoDisplayHid.includes(hid) ? "吉村 幸博" : "";

  return(
    <div className={classes.ufbHead}>
      <div className='header'>
        <div className='left'>
          <div>
            <div className='address small'>
              <div>{com?.cpostal ?? ""}</div>
              <div>{com?.ccity ?? ""} {com?.caddress ?? ""}</div>
            </div>
            <div className='hname'>{hname} 御中</div>
          </div>
          <div className='title'>請求書</div>
        </div>
        <div className='right'>
          <div className='date'>{printDate}</div>
          <div className='logo'><img src={usageFeeSvg} alt="logo" width="320px" /></div>
          <div className='ourHname'>{OUR_HNAME}</div>
          {OUR_CEO && <div className='small'>代表取締役 {OUR_CEO}</div>}
          {invoiceSystemSupported &&<div className='tjino small'>登録番号：{OUR_TJINO}</div>}
          <div className='small'>{OUR_POSTAL} {OUR_ADDRESS1}</div>
          <div className='small'>{OUR_ADDRESS2}</div>
          <div className='tel small'>TEL: {OUR_TEL}</div>
        </div>
      </div>
      <div>下記の通りご請求致します。ご確認頂けますようお願い申しあげます。</div>
      <div className='total'>
        <div>合計</div>
        <div>{`￥${formatNum(total_fee+total_feetax, 1)}-`}</div>
      </div>
    </div>
  )
}

const TotalUsageFeeTable = (props) => {
  const classes = useStyles();
  const {pass_dt, invoiceSystemSupported} = props;

  const total_fee = pass_dt.reduce((x, y) => x+=parseInt(y.fee), 0);
  const total_feetax = Math.round(total_fee/TAXRATE);

  if(invoiceSystemSupported){
    return(
      <div className={classes.ufbInvoiceTotal}>
        <div className='row'>
          <div className='col1'>
            <div className='title'>合計</div>
            <div className='num'>{total_fee.toLocaleString()}</div>
          </div>
          <div className='col2'>
            <div className='title'>消費税</div>
            <div className='num'>{total_feetax.toLocaleString()}</div>
          </div>
        </div>
        <div className='row'>
          <div className='col1'>
            <div className='title'>10%対象</div>
            <div className='num'>{total_fee.toLocaleString()}</div>
          </div>
          <div className='col2'>
            <div className='title'>消費税</div>
            <div className='num'>{total_feetax.toLocaleString()}</div>
          </div>
        </div>
        <div className='row'>
          <div className='col1'>
            <div className='title'>税込請求額</div>
            <div className='num'>{(total_fee+total_feetax).toLocaleString()}</div>
          </div>
        </div>
      </div>
    )
  }else{
    return(
      <table className={classes.ufbTotal}>
        <tbody>
          <tr>
            <td className='title'>合計</td>
            <td className='num'>{total_fee.toLocaleString()}</td>
          </tr>
          <tr>
            <td className='title'>消費税額</td>
            <td className='num'>{total_feetax.toLocaleString()}</td>
          </tr>
          <tr>
            <td className='title'>税込み請求額</td>
            <td className='num'>{(total_fee+total_feetax).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    )
  }
}

const BankTransferNotice = () => {
  const stdDate = useSelector(state => state.stdDate);
  const [stdYear, stdMonth] = stdDate.split("-");
  const com = useSelector(state => state.com);
  const bankTransfer = com?.cetc?.bankTransfer ?? "";
  if(!/^9999\d+$/.test(bankTransfer)) return null;
  return(
    <div style={{marginTop: '16px'}}>
      <div style={{lineHeight: '2'}}>お振り込み先：楽天銀行 第三営業支店(253) 普通 7058989 アルバトス株式会社</div>
      <div style={{lineHeight: '2'}}>お支払い期限：{stdYear}年{stdMonth}月27日まで　お振込手数料は貴社にてご負担ください。</div>
    </div>
  )
}

const UsageFeeBody = (props) => {
  const classes = useStyles();
  const {preview, usageDate, printDate, hname, com={}, usageFeeDt, stdDate} = props;
  if(!(preview === "ご利用料金請求書" && usageFeeDt.length)) return null;

  const USAGEFEE_ROWLENGTH = 24;

  const yyyy = usageDate.split("-")[0];
  const mm = usageDate.split("-")[1];
  const itemName = `サービス利用料金${yyyy}年${mm}月分`;

  const stdDateParts = stdDate.split("-").map(d => parseInt(d));
  const invoiceSystemSupported = (
    new Date(2023, 8, 1).getTime() <= new Date(stdDateParts[0], stdDateParts[1]-1, stdDateParts[2]).getTime()
  )

  const tabelTitle = (
    <tr className='title'>
      <td>項番</td>
      <td>品目</td>
      <td>単価</td>
      <td>数量</td>
      <td>金額</td>
      <td className='notice'>備考</td>
    </tr>
  );
  const pass_dt = usageFeeDt.filter(x => x.bid !== "");
  const rowArray = Array(USAGEFEE_ROWLENGTH).fill("");
  const table_dt = rowArray.map((x, index) => {
    const fee = pass_dt[index] ?parseInt(pass_dt[index].fee).toLocaleString() :"";
    const quantity = pass_dt[index] ?1 :"";
    const sum_fee = pass_dt[index] ?(parseInt(pass_dt[index].fee)*quantity).toLocaleString() :"";
    return(
      <tr key={`tableDtRow${index+1}`} className='tblDetail'>
        <td className='num'>{pass_dt[index] ?index+1 :""}</td>
        <td>{pass_dt[index] ?itemName :""}</td>
        <td className='num'>{fee}</td>
        <td className='num'>{quantity}</td>
        <td className='num'>{sum_fee}</td>
        <td className='notice'>{pass_dt[index] ?pass_dt[index].bname :""}</td>
      </tr>
    )
  })

  const headerProps = {com, hname, printDate, invoiceSystemSupported, pass_dt}
  const totalProps = {pass_dt, invoiceSystemSupported}
  return(
    <div className={classes.printPage}>
      <UsageFeeHeader {...headerProps} />
      <table className={classes.usageFeeTable}>
        <tbody>
          {tabelTitle}
          {table_dt}
        </tbody>
      </table>
      <TotalUsageFeeTable {...totalProps} />
      <BankTransferNotice />
    </div>
  )
}

const UsageFeeBodies = (props) => {
  const {preview, usageDate, printDate, usageFeeDt, accountLst, com, stdDate} = props
  const body_parms = { preview, usageDate, printDate, stdDate };
  return Object.keys(usageFeeDt).map((hid, index) => {
    body_parms["com"] = com[hid] ?com :{};
    body_parms["hname"] = accountLst.reduce((result, accountDt) => {
      result = accountDt.hid === hid ?accountDt.hname :result;
      return result
    }, "");
    body_parms["usageFeeDt"] = usageFeeDt[hid];
    return <UsageFeeBody key={`usageFeeBodies${index+1}`} {...body_parms} />
  })
}

const UsageFee = () => {
  const classes = useStyles();
  const [displaySw, setDisplaySw] = useState({
    navigetion: {display: 'block'},
    preview: {display: 'none'},
  });
  const allState = useSelector(state=>state);
  const {stdDate, account, com, accountLst, service, serviceItems} = allState;
  const [preview, setPreview] = useState('');
  const [usageFeeDt, setUsageFeeDt] = useState({});
  const [showAll, setShowAll] = useState(false);
  const [disabled, setDisabled] = useState(true);
  const d_array = stdDate.split("-");
  const mm = d_array[1]==="12" ?"01" :("0"+String(parseInt(d_array[1])+1)).slice(-2);
  const yyyy = mm==="01" ?String(parseInt(d_array[0])+1) : d_array[0];
  const usage_date = `${yyyy}-${mm}-01`;
  const print_date = `${String(parseInt(d_array[0]))}/${("0"+String(parseInt(d_array[1]))).slice(-2)}/${USAGE_DATE}`
  const thisTitle = albCM.getReportTitle(allState, preview);
  const defaultTitle = albCM.defaultTitle;

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

  useEffect(() => {
    let unmounted = false;
    const makeUrlSearchParams = (params) => {
      let rt = new URLSearchParams('');
      Object.keys(params).forEach(key => {
        rt.append(key, params[key]);
      });
      return rt;
    }

    (async() => {
      const parms = {
        "a": "fetchUsageFee",
        "date": usage_date,
      }
      let hid_list = [];
      if(showAll) hid_list = accountLst.map(accountDt => accountDt["hid"]).filter((x,i,self) => self.indexOf(x)===i);
      else hid_list.push(account.hid);
      const result = {};
      for(const hid of hid_list){
        parms["hid"] = hid;
        const res = await axios.post(endPoint(), makeUrlSearchParams(parms))
        if(res.data.result) result[hid] = res.data.dt;
      }
      if(!unmounted){
        setUsageFeeDt(Object.keys(result).length ?{...result} :false);
      }
      if(!unmounted && Object.keys(result).length) setDisabled(false);
    })();

    return () => { unmounted = true; };
  }, [showAll])

  const permission = parsePermission(account)[0][0];
  const now = new Date();
  const print_time = new Date(parseInt(d_array[0]), parseInt(d_array[1])-1, USAGE_DATE);
  if(permission < DISPLAY_PERMISSION){
    return null;
  }else if(now.getTime() < print_time.getTime()){
    return(
      <>
      <RepportsLinksTab />
      <div className='AppPage reports'>
        <div className={'navigation '} style={displaySw.navigetion}>
          <div className='reportCntRow'>
            <div className='reportDisc' style={{flex: 'auto'}}>ご請求金額はただいま準備中です。通常毎月{USAGE_DATE}日に発行されます。</div>
          </div>
        </div>
      </div>
      </>
    )
  }else if(usageFeeDt===false){
    return(
      <>
      <RepportsLinksTab />
      <div className='AppPage reports'>
        <div className={'navigation '} style={displaySw.navigetion}>
          <div className='reportCntRow'>
            <div className='reportDisc' style={{flex: 'auto', color: red[500]}}>
              請求金額取得に失敗しました。再読み込みをしても改善されない場合は、お手数おかけしますがサポートまでご連絡ください。
            </div>
          </div>
        </div>
      </div>
      </>
    )
  }

  const usagefee_length = Object.keys(usageFeeDt).length
    ?Object.values(usageFeeDt).reduce((result, array) => result+array.filter(x => x.bid !== "").length, 0)
    :0;
  const usagefee_submsg = Object.keys(usageFeeDt).length
    ?usagefee_length
      ?<>次月分のご利用金額は当月にご請求させていただきます。<br />
        金額は{usagefee_length}
        事業所分で{
          Object.values(usageFeeDt).reduce((result,array) => result+array.filter(x => x.bid !== "").reduce((x, y) => x+=parseInt(y.fee), 0), 0).toLocaleString()
        }円（税別）になります。
      </>
      :"請求金額が未設定です。無料期間の場合は請求書が表示されない場合があります。ご不明な点がございましたらはサポートまでご連絡ください。"
    :null;
  
  const parms = {preview, usageDate: usage_date, printDate: print_date, usageFeeDt, accountLst, com, stdDate}
  return (
    <>
    <RepportsLinksTab />
    <div className='AppPage reports' style={{paddingLeft: 61.25}}>
      <div className={'navigation '} style={displaySw.navigetion}>
        <div className='reportCntRow'>
          <div className='reportDisc' style={{flex: '0 0 40%'}}>ご利用料金請求書</div>
          <div className='genButton'>
            <Button
              className={classes.reportButton}
              variant='contained'
              color='primary'
              disabled={disabled || !usagefee_length}
              onClick={()=>{
                setPreview('ご利用料金請求書');
              }}
            >
              印刷用ページへ
            </Button>
          </div>
        </div>
        {permission === 100 ?
          <div className='reportCntRow'>
            <div className='reportDisc' style={{flex: '0 0 40%'}} />
            <div className='genButton'>
              <label style={{
                marginLeft: 4, height: 16,
                display: 'flex', alignItems: 'center'
              }}>
                <span>全事業所表示</span>
                <Checkbox
                  checked={showAll}
                  onChange={e => {setShowAll(e.target.checked); setDisabled(true);}}
                />
              </label>
            </div>
          </div>
          :null
        }
        <div className='reportCntRow'>
          <div className='reportDisc' style={{paddingLeft: 10, flex: '0 0 70%'}}>{disabled?"読み込み中" :usagefee_submsg}</div>
        </div>
        <UsageFeeTable />
      </div>
      <div className={'printPreview '} style={displaySw.preview}>
        <PrintButton setPreview={setPreview}/>
        <UsageFeeBodies {...parms} />
      </div>
    </div>
    </>
  )
}
export default UsageFee;