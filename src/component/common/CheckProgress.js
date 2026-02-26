import React, { useEffect, useState } from 'react';
import * as Actions from '../../Actions';
import * as comMod from '../../commonModule';
import {formatNum, formatDate, getUser} from '../../commonModule';
import { useDispatch, useSelector, } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import EditIcon from '@material-ui/icons/Edit';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import Typography from '@material-ui/core/Typography';
import { UpperLimitKanri } from '../schedule/SchUpperLimit';
import {LinksTab} from '../common/commonParts';
import {
  setBillInfoToSch, 
} from '../Billing/blMakeData';
import teal from '@material-ui/core/colors/teal';
import blue from '@material-ui/core/colors/blue';
import red from '@material-ui/core/colors/red';
import grey from '@material-ui/core/colors/grey';
import { colors } from '@material-ui/core';
import { faThemeisle } from '@fortawesome/free-brands-svg-icons';
import { useLocation } from 'react-router-dom';
import { GetNextHist } from '../Users/Users';
import { faSleigh } from '@fortawesome/free-solid-svg-icons';
import { JIHATSU } from '../../modules/contants';


// 進行の確認を行う
// 当月の予定に全て実績フラグが経っているか。
// 上限管理がされているか
// 仮の保保険番号が残っていないか
// またこれらのチェックを行う関数も提供する

const useStyles = makeStyles({
  inlineRoot:{
    '& .checkResult':{
      display:'flex', justifyContent: 'center', 
      fontSize: '.8rem', margin: '8px 0',
    },
    '& .item':{display:'flex', justifyContent:'center', margin:'0 8px'},
    '& .item > div':{margin:'0 4px'},
    '& .result': {
      fontWeight:'bold',
      '& .OK': {color: teal[900], display: 'flex'},
      '& .NG': {color: red[900], display: 'flex'},
      '& .NODATA': {color: blue[900]},
      '& .CURRENT': {color: teal[900]},
      '& .PAST': {color: blue[900]},
      '& .kdCount':{
        display: 'inline-flex', fontWeight: 400, alignItems: 'end',
        margin: '0 4px',
        color: grey[800],
        '& >*': {margin: '0 1px'},
        '& .v': {fontSize: '.8rem'},
        '& .l': {fontSize: '.8rem'},
      },
    }
  },
  nextcom: {
    fontSize: '.8rem', color: red[800], fontWeight: 600,
    padding: 8, textAlign: 'center',
  }
});
// もともとはsetBillInfoToSchをコールしていたがステイトに格納されているものを
// 取得するように変更 2021/10/12
export const doCheckProgress = (prms) => {
  // const { stdDate, schedule, users, com, serviceItems, service, billingDt} = prms;
  const { schedule, users, billingDt, service, com} = prms;
  if (!Array.isArray(billingDt))  return {done: false};
  // スケジュールの確認
  const schChk = {result: true, cnt: 0};
  Object.keys(schedule).filter(e=>e.indexOf('UID') === 0).map(e=>{
    Object.keys(schedule[e]).filter(f=>f.indexOf('D') === 0).map(f=>{
      const thisSch = schedule[e][f];
      if (service && service !== thisSch.service) return false;
      if (!thisSch.useResult) schChk.result = false;
      schChk.cnt++;
    });
  });
  if (!schedule.locked){
    schChk.result = false;
  }
  // 上限管理の確認
  const jougenChk = {result: true, cnt: 0};
  billingDt.map(e=>{
    if (service && service !== e.service) return false;
    if (!e.kanriOk && e.kanriType && e.tanniTotal) jougenChk.result = false;
    jougenChk.cnt++;
  });
  // 保険番号の確認
  const hnoChk = {result: true, cnt: 0};
  users.map(e=>{
    if (service && service !== e.service) return false;
    if (e.hno.length != 10)  hnoChk.result = false;
    hnoChk.cnt++;
  });
  // 兄弟設定の確認
  const bros = users.filter(e=>parseInt(e.brosIndex)); // 兄弟設定のあるuser
  const first = users.filter(e=>parseInt(e.brosIndex) === 1); // 長兄
  let pairChkCnt = 0, pairChk = true;
  first.forEach(e=>{
    const v = bros.filter(f=>f.pname === e.pname && f.pphone === e.pphone);
    if (v.length > 1) pairChkCnt++;
    else pairChk = false;
  });
  bros.filter(e=>Number(e.brosIndex) > 1).forEach(e=>{
    const firstBros = bros.find(f=>f.pname === e.pname && f.pphone === e.pphone && parseInt(f.brosIndex) === 1);
    if (!firstBros) pairChk = false;
      
  });
  const uniqCheck = Array.from(new Set(
    bros.map(e=>e.brosIndex+e.pname+e.pphone)
  ));
  const musyouka = Number(com?.addiction?.[JIHATSU]?.児童発達支援無償化自動設定) === 1;
  const noJikohutan = bros
    .filter(e=>(e.priceLimit) === 0 || (musyouka && e.ageStr.match(/^[3-5]歳児/)))
    .map(e=>({name: e.name, ageStr: e.ageStr, priceLimit: e.priceLimit, uid: e.uid}))
  const kyBros = bros.filter(e => e.kanri_type === '協力事業所')
    .map(e=>({name: e.name, kanri_type: e.kanri_type, kanri: e?.etc?.管理事業所?.[0]?.name, uid: e.uid}))

  const uniqCheckResult = uniqCheck.length === bros.length;
  const  result = (noJikohutan.length > 0 || kyBros.length > 0 || pairChk === false || uniqCheckResult === false) ? false : true;
  const kdChk = {
    cnt: bros.length,
    uniqCheck: uniqCheckResult,
    pairChkCnt, pairChk,
    noJikohutan, kyBros,
    result,
  }
  // console.log(kdChk, 'kdChk');
  return {schChk, jougenChk, hnoChk, kdChk, done: true};
}

export const CheckProgress = (props) => {
  const classes = useStyles();
  const schedule = useSelector(state=>state.schedule);
  const users = useSelector(state=>state.users);
  const stdDate = useSelector(state=>state.stdDate);
  const com = useSelector(state=>state.com);
  const sService = useSelector(state=>state.service);
  const sBillingDt = useSelector(state=>state.billingDt);
  const billingDt = props.billingDt? props.billingDt: sBillingDt;
  const allState = useSelector(state=>state);
  const ref = useLocation().pathname;
  // サービスを無効化するパス
  const serviceDisablePath = ['/billing'];
  // サービスを無効化するパスに該当した場合、サービス指定取り消す。
  const service = (serviceDisablePath.indexOf(ref) >= 0)? '': sService;
  const comDate = com.date;
  const [chk, setChk] = useState({
    jougen:{result: false, cnt: 0},
    sch:{result: false, cnt: 0},
    hno:{result: false, cnt: 0},
    kdChk: {uniqCheck: false, cnt: 0, pairChk: false, pairChkCnt: 0},
  });
  useEffect(()=>{
    // const chkPrms = { 
    //   stdDate, schedule, users, com, service, serviceItems, allState, billingDt
    // };
    const chkPrms = { 
      schedule, users, billingDt, service, com
    };
    const chkResult = doCheckProgress(chkPrms);
    setChk({
      jougen: chkResult.jougenChk,
      sch: chkResult.schChk,
      hno: chkResult.hnoChk,
      kdChk: chkResult.kdChk,
    });  
  }, [service, billingDt]);
  const {loaded, error} = comMod.getLodingStatus(allState);
  if (!loaded || error){
    return null;
  }
  if (!Array.isArray(billingDt)) return null;

  const ChkDsp = (p) => {
    if (p.result && p.cnt){
      return (<div className='OK'>OK</div>)
    }
    else if (!p.result && p.cnt) {
      return (<div className='NG'>要確認</div>)
    }
    else {
      return (<div className='NODATA'>データなし</div>)
    }
  }
  // 兄弟チェック表示用
  const KdChkDsp = (p) => {
    if (!p.cnt) return null;
    const CntDsp = () => {
      return(<div className='kdCount'>
        <span className='v'>{p.cnt}</span>
        <span className='l'>人</span>
        <span className='v'>{p.pairChkCnt}</span>
        <span className='l'>組</span>
      </div>)
    }
    const KdWarnbgDsp = (p) => {
      if (!p.length) return null;
      return (<div className='kdCount'>{p.length}人</div>)
    }

    if (p.uniqCheck && p.pairChk){
      return (<div className='OK'>
        OK <CntDsp/>
      </div>)
    }
    else{
      return (<div className='NG'>
        要確認 <CntDsp/>
      </div>)
    }
  }
  // 事業所情報の更新月を表示する
  const DispUpdate = () => {
    if (stdDate === comDate){
      return (<div className='CURRENT'>{comDate.slice(0, 7)}</div>)
    }
    else{
      return (<div className='PAST'>{comDate.slice(0, 7)}</div>)

    }
  }
  
  const thisClass = classes.inlineRoot;
  const kdChkCnt = comMod.findDeepPath(chk, 'kdChk.cnt', 0); 
  return (
    <div className={thisClass}>
      <div className='checkResult'>
        <div className='item'>
          <div className='rhead'>確定処理</div>
          <div className='result'><ChkDsp {...chk.sch} /></div>
        </div>
        <div className='item'>
          <div className='rhead'>上限管理</div>
          <div className='result'><ChkDsp {...chk.jougen} /></div>
        </div>
        <div className='item'>
          <div className='rhead'>受給者証番号</div>
          <div className='result'><ChkDsp {...chk.hno} /></div>
        </div>
        {(kdChkCnt) > 0 &&
          <div className='item'>
            <div className='rhead'>兄弟設定</div>
            <div className='result'><KdChkDsp {...chk.kdChk} /></div>
          </div>
        }

        <div className='item'>
          <div className='rhead'>事業所更新</div>
          <div className='result'><DispUpdate/></div>
        </div>

      </div>
    </div>
  )
}

// 事業所の更新のみを表示するコンポーネント
export const CheckBrunchUpdate = (props) => {
  const classes = useStyles();
  const stdDate = useSelector(state=>state.stdDate);
  const com = useSelector(state=>state.com);
  const allState = useSelector(state=>state);
  const comDate = com.date;
  const {nextCom} = allState;
  const {loaded, error} = comMod.getLodingStatus(allState);
  if (!loaded || error){
    return null;
  }
  // 事業所情報の更新月を表示する
  const DispUpdate = () => {
    if (stdDate === comDate){
      return (<div className='CURRENT'>{comDate.slice(0, 7)}</div>)
    }
    else{
      return (<div className='PAST'>{comDate.slice(0, 7)}</div>)

    }
  }
  
  const thisClass = classes.inlineRoot;
  const NextCom = () => {
    if (!nextCom){
      return null;
    }
    else {
      return (
        <div className={classes.nextcom} >
          この変更は{nextCom.slice(0, 7)}以降に反映されません。
        </div>
      )
    }
  }
  return (
    <div className={thisClass}>
      <div className='checkResult'>
        <div className='item'>
          <div className='rhead'>事業所更新</div>
          <div className='result'><DispUpdate/></div>
        </div>
      </div>
      <NextCom />
      <GetNextHist />
    </div>
  )
};

export default CheckProgress;