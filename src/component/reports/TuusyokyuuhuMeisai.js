import React, { useEffect, useState } from 'react';
import { makeStyles, ServerStyleSheets } from '@material-ui/core/styles';
import { connect, useDispatch, useSelector } from 'react-redux';
import * as comMod from '../../commonModule';
import * as albCM  from '../../albCommonModule';
import Button from '@material-ui/core/Button';
import {
  setBillInfoToSch, makeBiling, makeJugenkanri, 
  makeTeikyouJisseki, isYokohama, isKyoudaiJougen, getPriorityService
} from '../Billing/blMakeData';
import {
  proseedByUsersDt
} from '../Billing/Proseed'
import teal from '@material-ui/core/colors/teal';
import { serviceSyubetu } from '../Billing/BlCalcData';
import { SoudanShienTuusyokyuuhuMeisai } from './SoudanShien';

// 通所給付明細
// 国定形式の代理受領通知明細も兼ねる

const useStyles = makeStyles({
  gridRepotRoot:{
    width:'90%',
    maxWidth: 900,
    margin:'120px auto 0',
    '@media print':{
      width: '262mm',
      maxWidth: '262mm',
      margin:'15mm 0mm 10mm 20mm',
      margin: 0,
      breakAfter: 'always',
      '&:last':{
      breakAfter: 'auto',

      }
    },
    '& .title':{
      fontSize:'1.8rem',
      textAlign: 'center',
      padding: '8px 0 32px',
      '& .comment':{
        fontSize: '1.0rem',
        padding: 8,
      }
    },
    '& .vhcenter':{
      display:'flex',alignItems:'center',justifyContent:'center',
    },
    '& .cells':{
      borderRight: '1px #333 solid',
      borderBottom: '1px #333 solid',
      textAlign: 'center',
      fontSize: '1.0rem',
      padding: 2,
    },
    '& .small':{
      fontSize: '0.8rem',
      padding: 4,
    },
    '& .outerLine' : {
      borderTop: '2px #333 solid',
      borderLeft: '2px #333 solid',
      // borderRight: '1px #333 solid', // 右線は引かない。内部セルに任せる
      borderBottom: '1px #333 solid',
    },
    '& .bb' :{borderBottom: '2px #333 solid'}, // 下線太く
    '& .rb' :{borderRight: '2px #333 solid'}, // 右線太く
    '& .row1':{
      display:'flex',
      justifyContent:'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
      '& .col1':{
        width:'30%',
        display:'grid',
        gridTemplateColumns: '40% 1fr 1fr 1fr 1fr 1fr 1fr',
        gridAutoRows: '1fr',
      },
      '& .col2':{
        width:'22%',
        display:'grid',
        gridTemplateColumns:'20% 1fr 1fr 1fr 1fr 1fr 20%',
        // borderTop: '1px #333 solid',
        // borderleft: '1px #333 solid',
        padding: '1px 0 0 1px'
      },
      
    },
    '& .row2':{
      display:'flex',
      alignItems:'flex-end',
      justifyContent:'space-between',
      marginTop:0,
      '& .col1':{
        width:'45%',
        display:'grid',
        gridTemplateColumns:'6fr repeat(10, 1fr)',
        '& .name':{
          gridColumn:'2 / 12',
          fontSize: '1.0rem',
          display:'flex',alignItems:'center',justifyContent:'center',
        } ,
      },
      '& .col2':{
        width:'54%',
        display:'grid',
        gridTemplateColumns:'2ch 3fr repeat(10, 1fr)',
        '& .vheader':{ // 縦の見出し
          gridRow:'1 / 4',gridColumn: 1,
        } ,
        '& .jiheader': { // 事業所名見出し
          gridRow:'2 / 4', gridColumn: 2,
        },
        '& .jiname':{ // 事業所名
          gridColumn: '3/13',
        },
        '& .tkubunheader':{ // 地域区分ヘッダ
          gridColumn: '3/7',
        },
        '& .tkubun':{ // 地域区分
          gridColumn: '7/13',
        },
        '& .sshienHeader':{ // 就労支援ヘッダ
          gridColumn: '2/9',
        },
        '& .sshien':{ // 就労支援
          gridColumn: '9/13',
        },
      },
    },
    '& .row3': {
      width:'35%',
      display:'grid',
      gridTemplateColumns:'20ch repeat(5, 1fr)',
      marginTop: 24,
    },
    '& .row4': {
      display:'grid',
      gridTemplateColumns:
        '16ch 15ch repeat(11, 1fr) 12ch 1fr 12ch repeat(5,1fr)',
      marginTop: 24,
      '& .head':{gridRow:'1/3', gridColumn:1},
      '& .jinoHead': {gridColumn:'2/4'},
      '& .jiname': {gridColumn: '3/22'},
    },
    '& .row5': {
      display:'grid',
      gridTemplateColumns:
        '8ch 1fr 1fr 8ch 5ch repeat(9, 1fr) 8ch 5ch repeat(9, 1fr) ' + 
        '5ch 1fr 1fr 5ch 1fr 1fr',
      marginTop: 24,
      '& .head': {
        gridRow: '1/3',
      },
    },
    '& .row6': {
      display:'grid',
      gridTemplateColumns:
        '2ch 13fr repeat(6, 1fr) repeat(4, 1fr) 1fr 1fr repeat(5, 1fr) 6fr',
      marginTop: 24,
      // '& .head': {gridRow: '1/15',},
      '& .headSvcName':{gridColumn: '2',},
      '& .headSvcCode':{gridColumn: '3/9',},
      '& .headTanniSuu':{gridColumn: '9/13',},
      '& .headKaisuu':{gridColumn: '13/15',},
      '& .headSvcTannisuu':{gridColumn: '15/20',},
      '& .headTekiyou':{gridColumn: '20',},
      
    },
    '& .row7': {
      display: 'grid',
      gridTemplateColumns: '2ch 4fr 6fr repeat(30, 1fr)',
      marginTop: 24,
      '& .head': {gridRow: '1/15',},
      '& .rHead' : {gridColumn: '2/4'},
      '& .svcName1': {gridColumn: '6/10'},
      '& .svcName2': {gridColumn: '12/16'},
      '& .svcName3': {gridColumn: '18/22'},
      '& .svcName4': {gridColumn: '24/28'},
      '& .totalLabel': {gridColumn: '28/36', gridRow:'1/3'},
      '& .tankaLabel1': {gridColumn: '8/10'},
      '& .tankaLabel2': {gridColumn: '14/16'},
      '& .tankaLabel3': {gridColumn: '20/22'},
      '& .tankaLabel4': {gridColumn: '26/28'},
      '& .seikyuuHead': {gridRow: '12/14', gridColumn: '2'},
      '& .seikyuuDetail': {gridColumn: '3'},
    },
    '& .row8':{
      display:'flex',
      justifyContent:'space-between',
      alignItems: 'flex-end',
      marginTop: 24,
      '& .col1':{
        width: '58%',
        display:'grid',
        gridTemplateColumns: '12fr repeat(16, 1fr)',
        '& .head': {gridRow: '1/3', gridColumn:'1' },
        '& .colHead1': {gridColumn: '2/6'}, 
        '& .colHead2': {gridColumn: '6/8'}, 
        '& .colHead3': {gridColumn: '8/13'}, 
        '& .colHead4': {gridColumn: '13/18'}, 
      },
      '& .col2' : {
        width: '25%',
        display:'grid',
        gridTemplateColumns: '1fr 1fr 1.5fr 1fr 1fr 1.5fr',
      },
    },
    '& .sizem': {fontSize: '1.0rem',},
    '& .sizes': {fontSize: '.65rem',},
    '& .sizexs': {fontSize: '.50rem',},
    '& .tallPadding': {
      paddingTop: 8,
      paddingBottom: 8,
    },
    '& .heightInGrid': {height: 21.8,},
    '& .textLeft': {textAlign: 'left',},
  },
});
// 受け取った文字を一文字ずつdivで括って出力する
export const StrToDivs = (props) => {
  let {
    str, length, strPadding, right, className, styleo,
    bb, rb, // 下線太く、右線太く
  } = props;
  str = (str !== undefined)? str: '';
  strPadding = (strPadding)? strPadding: ' ';
  right = (right)? true: false;
  className = (className)? className: '';
  styleo = (styleo)? styleo: {};
  length = {length}? length: str.length;
  // 下線太くするクラス名追加
  className = (bb)? className + ' bb': className;
  if (right){
    str = strPadding.repeat(length) + str;
    str = str.slice(length * (-1));
  }
  else{
    str = str + strPadding.repeat(length);
    str = str.substr(0, length);
  }
  const rt = Array.from(str).map((e, i)=> {
    // 最終セルのみ右線太く
    const cls = ((i === (str.length - 1)) && rb)? className + ' rb': className;
    return (
      <div className={cls} style={styleo} key={i}>{e}</div>
    )
  })
  return rt
}
// 2021-01-01フォーマットから和暦などの日付情報を取り出す
const str2gdex = (s) =>{
  return comMod.getDateEx(s.split('-')[0], s.split('-')[1], s.split('-')[2]);
}

const fdp = (obj, path, notFound=null) => {
  return comMod.findDeepPath(obj, path, notFound=null);
}

export const TuusyokyuuhuMeisaiOne = (props) => {
  const classes = useStyles();
  const {
    thisBdt, com, service, account, thisUser, masterRec, preview
  } = props.props;
  const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
  let kdj = props.props.kdj;
  const schedule = useSelector(state=>state.schedule);
  const bname = com.bname;
  const jino = com.jino;
  // let tkubun = fdp(com, 'addiction.放課後等デイサービス.地域区分');
  // tkubun = tkubun ? tkubun: fdp(com, 'addiction.児童発達支援.地域区分');
  const svc = getPriorityService(thisUser.service);
  const tkubun = com?.addiction?.[svc]?.地域区分;
  const stdDate = useSelector(state=>state.stdDate);
  const gengou = str2gdex(stdDate).wr.l; // 元号
  const wry = str2gdex(stdDate).wr.y; // 和暦の年
  const month = str2gdex(stdDate).m;
  const cityNum = thisBdt.scityNo;
  const jCityNum = '';
  const hno = thisBdt.hno;
  const name = thisBdt.name;
  const hname = thisBdt.pname;
  const jougen = thisUser.priceLimit;
  const kanriJi = (thisBdt.jougenJi)? thisBdt.jougenJi: '';
  const kanriJiName = (account.jino === kanriJi)? account.bname: thisBdt.jougenJiName;
  const kanrikekka = thisBdt.kanriKekka;
  const kanrikkekkaGaku = (thisBdt.kanrikekkagaku)? thisBdt.kanrikekkagaku: 0;
  const startDate = thisUser.startDate;
  const endDate = thisUser.endDate;
  const useCount = thisBdt.countOfUse;
  const sSyubetsu = (thisBdt.service === '放課後等デイサービス')? "63" : "61";
  const itemTotal = thisBdt.itemTotal;
  const unitPrice = masterRec.unitPrice * 100;
  const tanniTotal = thisBdt.tanniTotal;
  const jichiJosei = thisBdt.jichiJosei;
  const ichiwari = Math.floor(thisBdt.userSanteiTotal * .1);
  const ketteigaku = (thisBdt.ketteigaku || !isNaN(thisBdt.ketteigaku))?
    thisBdt.ketteigaku: 0;
  let sd = startDate.split('-');
  // 横浜兄弟上限処理
  const yokohama = isYokohama(thisBdt.scityNo);
  const yokohamaKd = (
    yokohama && !thisBdt.kanriKekka && thisBdt.kanriType === '協力事業所'
  );
  if (yokohamaKd){
    thisBdt.priceLimitBk = thisBdt.priceLimit;
    // dt.priceLimit = 0;
    thisBdt.priceLimit = kanrikkekkaGaku;
    kdj = true; // 兄弟上限フラグも強制オン
  }
  //マルチサービス（保訪など）対応 橋本
  const multiService = thisUser.service.split(",").length >= 2;
  
  // 月額調整額
  // 同じコードがblMakedataにもあるので要注意
  let jougenGetsuTyousei = kdj? thisBdt.getsuTyousei: thisBdt.tyouseigaku
  jougenGetsuTyousei = (jougenGetsuTyousei === undefined && kdj)?
  thisBdt.kanrikekkagaku: jougenGetsuTyousei;
  jougenGetsuTyousei = jougenGetsuTyousei? jougenGetsuTyousei: 0;

  console.log(comMod.getDateEx(sd[0], sd[1], sd[2]));
  const Row1Col1 = () => {
    return(<>
      <div className='cells'>市町村番号</div>
      <StrToDivs str={cityNum} className='cells' length={6} rb />
      <div className='cells small'>助成自治体番号</div>
      <StrToDivs str={jCityNum} className='cells' length={6} rb />
    </>);
  }
  const Row1Col2 = () => {
    return (<>
      <div className='cells'>{gengou}</div>
      <StrToDivs 
        str={wry} length={2} className='cells' strPadding='0' right={true}
      />
      <div className='cells'>年</div>
      <StrToDivs 
        str={month} length={2} className='cells' 
        strPadding='0' right={true} 
      />
      <div className='cells rb'>月分</div>
    </>)
  }
  const Row2Col1 = () => {
    return (<>
      <div className='cells small'>受給者証番号</div>
      <StrToDivs str={hno} className='cells' length={10} rb />
      <div className='cells small'>支給決定保護者<br></br>氏名</div>
      <div className='cells name rb'>{hname}</div>
      <div className='cells small'>支給決定に係る<br></br>{(convJido ?'児童':'障害児')}氏名</div>
      <div className='cells name rb'>{name}</div>

    </>);
  } 
  const Row2Col2 = () => {
    return (<>
      <div className='cells vheader vhcenter small'>請求事業所</div>
      <div className='cells vhcenter small'>指定事業所番号</div>
      <StrToDivs str={jino} className='cells' rb/>
      <div className='jiheader cells vhcenter small '>
        事業所および<br></br>その事業所の<br></br>名称
      </div>
      <div className='jiname cells vhcenter sizem tallPadding rb'>{bname}</div>
      <div className='tkubunheader cells'>地域区分</div>
      <div className='tkubun cells rb'>{tkubun}</div>
      {/* <div className='sshienHeader cells'>就労継続支援A型事業者負担減免措置実施</div>
      <div className='sshien cells rb'></div> */}
    </>);
  }
  const Row3 = () => (<>
    <div className='cells'>利用者負担上限月額(1)</div>
    <StrToDivs str={jougen} className='cells' rb right={true} length={5} />
  </>);
  const Row4 = () => (<>
    <div className='cells head vhcenter'>利用者負担上限額<br></br>管理事業所</div>
    <div className='jinoHead cells'>指定事業所番号</div>
    <StrToDivs str={kanriJi} className='cells' length={10} />
    <div className='cells'>管理結果</div>
    <div className='cells'>{kanriJi? kanrikekka: ''}</div>
    <div className='cells'>管理結果額</div>
    <StrToDivs 
      str={kanriJi? kanrikkekkaGaku: ''} 
      className='cells' right rb length={5} 
    />
    <div className='cells'>事業所名称</div>
    <div className='cells jiname rb'>{kanriJiName}</div>
    
  </>)

  const getServiceKindNum = (serviceM) => {
    let result = "";
    switch(serviceM){
      case "児童発達支援":{
        result = "61";
        break
      }
      case "放課後等デイサービス": {
        result = "63";
        break
      }
      case "保育所等訪問支援": {
        result = "64";
        break
      }
    }
    return result;
  }

  const Row5 = () => {
    const rowMinLength = 2;
    let stwr = "";
    let edwr = "";
    const initContractInfo = {[thisUser.service]: {
      contractDate: thisUser.contractDate, contractEnd: thisUser.contractEnd,
      startDate: thisUser.startDate, volume: thisUser.volume
    }}
    const contractInfoPerService = multiService
      ?comMod.findDeepPath(thisUser, 'etc.multiSvc', initContractInfo)
      :initContractInfo;
    const nodes =  Object.keys(contractInfoPerService).map((service, i) => {
      const contractInfo = contractInfoPerService[service];
      const startDatePerService = contractInfo.startDate;
      //開始日付、終了日付の和暦を取得 空白の日付には空のオブジェクトを返す
      let o = str2gdex(startDatePerService);
      stwr = (startDatePerService.indexOf('0000') === 0)?
        {l: '', y: '', m: '', d:''}: {l: o.wr.l, y: o.wr.y, m: o.m, d:o.d};
      o = str2gdex(startDatePerService);
      edwr = (endDate.indexOf('0000') === 0)?
        {l: '', y: '', m: '', d:''}: {l: o.wr.l, y: o.wr.y, m: o.m, d:o.d};
      return(
        <>
        {i===0 &&<div className='cells head'>サービス<br></br>種別</div>}
        <StrToDivs str={getServiceKindNum(service)} className='cells' />
        <div className='cells sizes'>開始年月日</div>
        {/* ここから和暦の連続 */}
        <div className='cells'>{stwr.l}</div>
        <StrToDivs str={stwr.y} className='cells' right={true} length={2} />
        <div className='cells'>年</div>
        <StrToDivs str={stwr.m} className='cells' right={true} length={2} />
        <div className='cells'>月</div>
        <StrToDivs str={stwr.d} className='cells' right={true} length={2} />
        <div className='cells'>日</div>
        <div className='cells sizes'>終了年月日</div>
        <div className='cells'>{edwr.l}</div>
        <StrToDivs str={edwr.y} className='cells' right={true} length={2} />
        <div className='cells'>年</div>
        <StrToDivs str={edwr.m} className='cells' right={true} length={2} />
        <div className='cells'>月</div>
        <StrToDivs str={edwr.d} className='cells' right={true} length={2} />
        <div className='cells'>日</div>
        <div className='cells sizes'>利用日数</div>
        <StrToDivs str={useCount} className='cells' right={true} length={2} />
        <div className='cells sizes'>入院日数</div>
        <StrToDivs str='' className='cells' rb right={true} length={2} />
        </>
      );
    });
    while(nodes.length < rowMinLength){
      nodes.push((
        <>
        {/* 二行目同じ利用者で2つのサービスコードは想定しづらい とりま空白 */}
        <StrToDivs str='' className='cells' length={2} />
        <div className='cells sizes'>開始年月日</div>
        {/* ここから和暦の連続 */}
        <div className='cells'>{stwr.l}</div>
        <StrToDivs str='' className='cells' right={true} length={2} />
        <div className='cells'>年</div>
        <StrToDivs str='' className='cells' right={true} length={2} />
        <div className='cells'>月</div>
        <StrToDivs str='' className='cells' right={true} length={2} />
        <div className='cells'>日</div>
        <div className='cells sizes'>終了年月日</div>
        <div className='cells'>{edwr.l}</div>
        <StrToDivs str='' className='cells' right={true} length={2} />
        <div className='cells'>年</div>
        <StrToDivs str='' className='cells' right={true} length={2} />
        <div className='cells'>月</div>
        <StrToDivs str='' className='cells' right={true} length={2} />
        <div className='cells'>日</div>
        <div className='cells sizes'>利用日数</div>
        <StrToDivs str='' className='cells' right={true} length={2} />
        <div className='cells sizes'>入院日数</div>
        <StrToDivs str='' className='cells' rb right={true} length={2} />
        </>
      ))
    }
    return nodes;
  }
  const Row6 = () => {
    // 末尾の中黒を削除
    const delNkgr = (s) => {
      if ((typeof s) === 'string'){
        return (s.replace(/・$/, ''))
      }
      else{
        return '';
      }
    }
    // 順番がバラバラなのでソートしておくよ
    itemTotal.sort((a, b)=>(a.s > b.s)? 1: -1);
    // 表示用の配列の長さが規定になるまで空のオブジェクトを追加
    const minRowLength = 13;
    if (itemTotal.length < minRowLength){
      const len = minRowLength - itemTotal.length;
      const tmp = Array(len).fill({c:'',s:'',v:'',count:'',tanniNum:''});
      tmp.map(e=>{itemTotal.push(e)});
    }
    const detail = itemTotal.map((e, i)=>{
      const k = i * 10
      return(<>
        <div className='cells heightInGrid textLeft rb' key={k + 1}>
          {delNkgr(e.c)}
        </div>
        <StrToDivs key={k + 2} str={e.s} className='cells' rb length={6}/>
        <StrToDivs key={k + 3} str={e.v} className='cells' rb length={4} right/>
        <StrToDivs 
          key={k + 4} str={e.count} className='cells' rb length={2} right 
        />
        <StrToDivs 
          key={k + 5} str={e.tanniNum} className='cells' rb length={5} right 
        />
        <div className='cells rb' key={k + 6}></div>
      </>);
    });
    const rowLength = itemTotal.length < minRowLength ?minRowLength :itemTotal.length; //橋本追加 3/4
    return(<>
      <div className='cells head vhcenter rb' style={{gridRow: `1/${rowLength+2}`}}>
        給付費明細欄
      </div>
      <div className='cells headSvcName rb'>サービス内容</div>
      <div className='cells headSvcCode rb'>サービスコード</div>
      <div className='cells headTanniSuu rb'>単位数</div>
      <div className='cells headKaisuu rb'>回数</div>
      <div className='cells headSvcTannisuu rb'>サービス単位数</div>
      <div className='cells headTekiyou rb'>適用</div>
      {detail}
    </>)
  }

  const Row7 = () => {
    const colLength = 4;
    const initUserSanteiTotalSvc = {[thisBdt.service]: thisBdt.userSanteiTotal};
    const userSanteiTotalSvc = multiService
      ?comMod.findDeepPath(thisBdt, 'userSanteiTotalSvc', initUserSanteiTotalSvc)
      :initUserSanteiTotalSvc;
    let sumJougenGetsuTyousei = 0;
    const jougenGetsuTyouseiNodes = [...Array(colLength)].map((_,i) => {
      const service = Object.keys(userSanteiTotalSvc)[i];
      let jougenGetsuTyousei = "";
      if(service){
        jougenGetsuTyousei = kdj? thisBdt.getsuTyousei: thisBdt.tyouseigaku
        jougenGetsuTyousei = (jougenGetsuTyousei === undefined && kdj)?
        thisBdt.kanrikekkagaku: jougenGetsuTyousei;
        jougenGetsuTyousei = jougenGetsuTyousei? jougenGetsuTyousei: 0;
        sumJougenGetsuTyousei += jougenGetsuTyousei;
      }
      return(
        <StrToDivs 
          str={jougenGetsuTyousei} 
          className='cells' length={6} rb right 
        />
      )
    });
    const hutangaku2 = [...Array(colLength)].map((_,i) => {
      const service = Object.keys(userSanteiTotalSvc)[i];
      const ichiwari = service ?String(Math.floor(comMod.findDeepPath(
        thisBdt, `userSanteiTotalSvc.${service}`, thisBdt.userSanteiTotal
      )*.1)) :"";
      let ketteigaku="";
      if(ichiwari){
        const priceLimit = thisUser.priceLimit;
        ketteigaku = String(
          parseInt(ichiwari) < parseInt(priceLimit) ?ichiwari :priceLimit
        )
        if(thisBdt.musyouka) ketteigaku = String(0);
      }
      return(
        <StrToDivs str={ketteigaku} className='cells' length={6} rb right />
      )
    });

    let sumKetteigaku = 0;
    const ketteigakuNodes = [...Array(colLength)].map((_,i) => {
      const service = Object.keys(userSanteiTotalSvc)[i];
      const ichiwari = service ?String(Math.floor(comMod.findDeepPath(
        thisBdt, `userSanteiTotalSvc.${service}`, thisBdt.userSanteiTotal
      )*.1)) :"";
      let ketteigaku="";
      if(ichiwari){
        const priceLimit = thisUser.priceLimit;
        ketteigaku = String(
          parseInt(ichiwari) < parseInt(priceLimit) ?ichiwari :priceLimit
        )
        if(thisBdt.musyouka) ketteigaku = String(0);
        sumKetteigaku += parseInt(ketteigaku);
      }
      return(
        <StrToDivs str={ketteigaku} className='cells' length={6} rb bb right />
      )
    });

    return(<>
      <div className='cells head vhcenter rb'>請求明細集計</div>
      <div className='cells rHead rb'>サービス種類コード</div>
      {
        [...Array(colLength)].map((_,i) => {
          const service = Object.keys(userSanteiTotalSvc)[i];
          return(
            <>
            <StrToDivs str={getServiceKindNum(service)} className='cells' length={2} />
            <div className={`cells svcName${i+1} rb small`}>{service ?service :""}</div>
            </>
          )
        })
      }
      <div className='cells vhcenter totalLabel rb'>合計</div>

      <div className='cells rHead rb'>サービス利用日数</div>
      {
        [...Array(colLength)].map((_,i) => {
          const service = Object.keys(userSanteiTotalSvc)[i];
          const useCount = service ?String(comMod.findDeepPath(
            thisBdt, `countOfUseMulti.${service}`, thisBdt.countOfUse
          )) :"";
          return(
            <>
            <StrToDivs str={useCount} className='cells' length={2} right/>
            <div className={`svcName${i+1} cells textLeft rb`}>日</div>
            </>
          )
        })
      }

      <div className='cells rHead rb'>給付単位数</div>
      {
        [...Array(colLength)].map((_,i) => {
          const service = Object.keys(userSanteiTotalSvc)[i];
          const tanniTotal = service ?String(comMod.findDeepPath(
            thisBdt, `tanniTotalSvc.${service}`, thisBdt.tanniTotal
          )) :"";
          return(
            <StrToDivs str={tanniTotal} className='cells' right rb length={6} />
          )
        })
      }
      <StrToDivs str={tanniTotal} className='cells' right rb length={6} />

      <div className='cells rHead rb'>給付単位単価</div>
      {
        [...Array(colLength)].map((_,i) => {
          const service = Object.keys(userSanteiTotalSvc)[i];
          const unitPrice = service ?String(comMod.findDeepPath(
            masterRec, `unitPricies.${service}`, masterRec.unitPrice
          ))*100 :"";
          return(
            <>
            <StrToDivs str={unitPrice} className='cells' right length={4} />
            <div className={`cells tankaLabel${i+1} sizexs rb`}>円/単位</div>
            </>
          )
        })
      }
      <StrToDivs className='cells' right rb length={6} />

      <div className='cells rHead rb bb'>総費用額</div>
      {
        [...Array(colLength)].map((_,i) => {
          const service = Object.keys(userSanteiTotalSvc)[i];
          const userSanteiTotal = service ?String(comMod.findDeepPath(
            thisBdt, `userSanteiTotalSvc.${service}`, thisBdt.userSanteiTotal
          )) :"";
          return(
            <StrToDivs 
              str={userSanteiTotal} className='cells' bb rb right length={6} 
            />
          )
        })
      }
      <StrToDivs 
        str={thisBdt.userSanteiTotal} className='cells' bb rb right length={6} 
      />

      <div className='cells rHead rb'>1割相当額</div>
      {
        [...Array(colLength)].map((_,i) => {
          const service = Object.keys(userSanteiTotalSvc)[i];
          const ichiwari = service ?String(Math.floor(comMod.findDeepPath(
            thisBdt, `userSanteiTotalSvc.${service}`, thisBdt.userSanteiTotal
          )*.1)) :"";
          return(
            <StrToDivs str={ichiwari} className='cells' length={6} rb right />
          )
        })
      }
      <StrToDivs className='cells' right rb length={6} />

      <div className='cells rHead rb'>利用者負担額(2)</div>
      {/* {
        [...Array(colLength)].map((_,i) => {
          const service = Object.keys(userSanteiTotalSvc)[i];
          const ichiwari = service ?String(Math.floor(comMod.findDeepPath(
            thisBdt, `userSanteiTotalSvc.${service}`, thisBdt.userSanteiTotal
          )*.1)) :"";
          return(
            <StrToDivs str={ichiwari} className='cells' length={6} rb right />
          )
        })
      } */}
      {hutangaku2}
      <StrToDivs className='cells' right rb length={6} />

      <div className='cells rHead rb'>上限月額調整</div>
      {jougenGetsuTyouseiNodes}
      <StrToDivs 
        str={sumJougenGetsuTyousei} 
        className='cells' length={6} rb right 
      />

      <div className='cells rHead rb'>調整後利用者負担額</div>
      <StrToDivs className='cells' rb length={6} />
      <StrToDivs className='cells' rb length={6} />
      <StrToDivs className='cells' rb length={6} />
      <StrToDivs className='cells' rb length={6} />
      <StrToDivs className='cells' rb length={6} />

      <div className='cells rHead rb'>上限管理後利用者負担額</div>
      <StrToDivs 
        str={kanriJi? kanrikkekkaGaku: ''} className='cells' rb right length={6} 
      />
      <StrToDivs className='cells' rb length={6} />
      <StrToDivs className='cells' rb length={6} />
      <StrToDivs className='cells' rb length={6} />
      <StrToDivs 
        str={kanriJi? kanrikkekkaGaku: ''} className='cells' rb right length={6} 
      />

      <div className='cells rHead rb bb'>決定利用者負担額</div>
      {ketteigakuNodes}
      <StrToDivs 
        str={sumKetteigaku} className='cells' rb bb length={6} right 
      />

      <div className='cells vhcenter seikyuuHead bb'>請求額</div>

      <div className='cells seikyuuDetail rb'>給付費</div>
      {
        [...Array(colLength)].map((_,i) => {
          const service = Object.keys(userSanteiTotalSvc)[i];
          const ichiwari = service ?String(Math.floor(comMod.findDeepPath(
            thisBdt, `userSanteiTotalSvc.${service}`, thisBdt.userSanteiTotal
          )*.1)) :"";
          const userSanteiTotal = service ?String(comMod.findDeepPath(
            thisBdt, `userSanteiTotalSvc.${service}`, thisBdt.userSanteiTotal
          )) :"";
          let ketteigaku="";
          if(ichiwari){
            const priceLimit = thisUser.priceLimit;
            ketteigaku = String(
              parseInt(ichiwari) < parseInt(priceLimit) ?ichiwari :priceLimit
            )
            if(thisBdt.musyouka) ketteigaku = String(0);
          }
          const benefits = userSanteiTotal&&ketteigaku
            ?String(parseInt(userSanteiTotal) - parseInt(ketteigaku)) :"";
          return(
            <StrToDivs str={benefits} className='cells' length={6} rb right />
          )
        })
      }
      <StrToDivs 
        str={thisBdt.userSanteiTotal - ketteigaku}
        className='cells' length={6} right rb
      />

      <div className='cells rHead seikyuuDetail rb bb'>特別対策費</div>
      <StrToDivs className='cells' right rb bb length={6} />
      <StrToDivs className='cells' right rb bb length={6} />
      <StrToDivs className='cells' right rb bb length={6} />
      <StrToDivs className='cells' right rb bb length={6} />
      <StrToDivs className='cells' right rb bb length={6} />

      <div className='cells rHead rb'>自治体助成分請求額</div>
      <StrToDivs className='cells' right rb length={6} str={jichiJosei} />
      <StrToDivs className='cells' right rb length={6} />
      <StrToDivs className='cells' right rb length={6} />
      <StrToDivs className='cells' right rb length={6} />
      <StrToDivs className='cells' right rb length={6}  str={jichiJosei} />

    </>)
  }

  const Row8 = () => (<>
    <div className='col1 outerLine'>
      <div className='head cells vhcenter rb small'>特定入所{(convJido ?'児童':'障害児')}食費等給付費</div>
      <div className='colHead1 cells rb small'>算定日額</div>
      <div className='colHead2 cells rb small'>日数</div>
      <div className='colHead3 cells rb small'>市町村請求額</div>
      <div className='colHead4 cells rb small'>実質算定額</div>
      <StrToDivs className='cells heightInGrid' rb length={4} />
      <StrToDivs className='cells heightInGrid' rb length={2} />
      <StrToDivs className='cells heightInGrid' rb length={5} />
      <StrToDivs className='cells heightInGrid' rb length={5} />

    </div>
    <div className='col2 outerLine'>
      <StrToDivs str={1} right className='cells' length={2} />
      <div className='cells'>枚中</div>
      <StrToDivs str={1} right className='cells' length={2} />
      <div className='cells rb'>枚目</div>
    </div>
  </>);
  const Title = () => {
    // 受領通知日をストアから取得。未設定だったら基準日から二ヶ月後の12日設定
    const tDate = comMod.parseDate(stdDate).date.dt;
    const nDate = new Date(tDate.getFullYear(), tDate.getMonth() + 2, 15);
    const jtInit = comMod.formatDate(nDate, 'YYYY-MM-DD');
    // const jtDate =
    //   (comMod.findDeepPath(schedule, ['report', service, '代理受領通知日'])) ? 
    //   schedule.report[service].代理受領通知日 : jtInit;
    const jtDate = localStorage.getItem("reportsSettingDate")
      ?JSON.parse(localStorage.getItem("reportsSettingDate"))?.["代理受領通知日"] ?? jtInit
      :jtInit;

    const gengou = str2gdex(jtDate).wr.l; // 元号
    const wry = str2gdex(jtDate).wr.y; // 和暦の年
    const month = str2gdex(jtDate).m;
    const day = str2gdex(jtDate).d;
    
    const comment = `下記の通り代理で受領しましたので通知します。` +
      `(${gengou}${wry}年${month}月${day}日)`;

    if (preview === '通所給付費明細'){
      return(
        <div className='title'>{(convJido ?'児童':'障害児')}通所給付費・入所給付費等明細書</div>
      );
    }
    else if (preview === '代理受領通知'){
      return(
        <div className='title'>
          {(convJido ?'児童':'障害児')}通所給付費・代理受領通知書
          <div className='comment'>{comment}</div>
        </div>
      );
    }
  }

  
  return(<>
    <div className={classes.gridRepotRoot}>
      {/* <div className='title'>障害児通所給付費・入所給付費等明細書</div> */}
      <Title />
      <div className='row1'>
        <div className='col1 outerLine'>
          <Row1Col1/>
        </div>
        <div className='col2 outerLine'>
          <Row1Col2 />
        </div>
      </div>
      <div className='row2'>
        <div className='col1 outerLine'>
          <Row2Col1/>
        </div>
        <div className='col2 outerLine'>
          <Row2Col2/>
        </div>
      </div>
      <div className='row3 outerLine' key={0}><Row3/></div>
      <div className='row4 outerLine' key={1}><Row4/></div>
      <div className='row5 outerLine' key={2}><Row5/></div>
      <div className='row6 outerLine' key={30}><Row6/></div>
      <div className='row7 outerLine' key={4}><Row7/></div>
      <div className='row8' key={5}><Row8/></div>
    </div>
    <div className='pageBreak'></div>
  </>)
}

const TuusyokyuuhuMeisai = (props) => {
  const {userList, preview, selects, ...others} = props;
  const stdDate = useSelector(state => state.stdDate);
  const schedule = useSelector(state => state.schedule);
  const users = useSelector(state => state.users);
  const com = useSelector(state => state.com);
  const service = useSelector(state => state.service);
  const account = useSelector(state => state.account);
  const serviceItems = useSelector(state => state.serviceItems);
  const allState = useSelector(state=>state);
  const thisTitle = albCM.getReportTitle(allState, preview);
  let tkubun = fdp(com, `addiction.${service}.地域区分`);
  tkubun = tkubun ?tkubun :fdp(com, 'addiction.放課後等デイサービス.地域区分');
  tkubun = tkubun ? tkubun: fdp(com, 'addiction.児童発達支援.地域区分');

  return <SoudanShienTuusyokyuuhuMeisai />

  const nameList = ['通所給付費明細', '代理受領通知'];
  
  // リストにないプレビューが送られてきたら何もしないで終了
  if (nameList.indexOf(preview) < 0)  return null;
  if (preview === '代理受領通知' && selects[preview] !== "国の標準形式") return null;
  const bdprms = { stdDate, schedule, users, com, service, serviceItems };
  bdprms.calledBy = 'TuusyokyuuhuMeisai';
  // calledBy対応済み
  const { billingDt, masterRec } = setBillInfoToSch(bdprms);
  if (!tkubun){
    return (
      <div style={{marginTop: 150}}>
        地域区分が設定されていません。
      </div>
    )
  }
  billingDt.sort((a, b)=> a.sindex - b.sindex);
  const pages = billingDt.map((e, i)=>{
    const thisUser = comMod.getUser(e.UID, users);
    const kdj = isKyoudaiJougen(billingDt, users, e.UID, schedule);
    // ユーザーリストによるスキップ
    if (!userList.find(f => f.uid === thisUser.uid))  return null;
    if (!userList.find(f => f.uid === thisUser.uid).checked) return null;
    // サービスが含まれていないユーザーはスキップ
    if(!(service==="" || new RegExp(service).test(thisUser.service))) return null
    // 請求額なしはスキップ
    if (!e.tanniTotal) return null;
    else{
      const rpprmas = {
        thisBdt: e, com, service, account, thisUser, masterRec, preview,
        kdj,
      };
      return (
        <TuusyokyuuhuMeisaiOne props={rpprmas} key={i} />
      )  
    }
  });
  return pages;
}
export default TuusyokyuuhuMeisai;