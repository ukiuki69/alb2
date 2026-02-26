import React, { useEffect, useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { makeStyles, ServerStyleSheets } from '@material-ui/core/styles';
import { connect, useDispatch, useSelector } from 'react-redux';
import * as mui from '../common/materialUi';
import * as afp from '../common/AddictionFormParts';
import * as sfp from '../common/StdFormParts';
import * as Actions from '../../Actions';
import * as comMod from '../../commonModule';
import Button from '@material-ui/core/Button';
import {
  setBillInfoToSch, makeBiling, makeJugenkanri, makeTeikyouJisseki
} from '../Billing/blMakeData';
import {
  proseedByUsersDt
} from '../Billing/Proseed'
import axios from 'axios';
import { LoadingSpinner, LoadErr} from '../common/commonParts';
import useInterval from 'use-interval';
import GroupIcon from '@material-ui/icons/Group';
import { AddToPhotosOutlined, CenterFocusStrong, ColorizeSharp, FormatBold, FullscreenExit, MicNone, ScoreTwoTone, TrendingUp } from '@material-ui/icons';
import SnackMsg from '../common/SnackMsg';
import teal from '@material-ui/core/colors/teal';
import { serviceSyubetu } from '../Billing/BlCalcData';
import { HohouTeikyouJissekiOne } from './Hoikusyotouhoumonsien';
import { LC2024 } from '../../modules/contants';

// 通所給付明細
// 国定形式の代理受領通知明細も兼ねる

export const useStyles = makeStyles({
  // 利用者負担額一覧用
  reportTeikyou:{
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
    '& .large': {fontSize: '130%'},
    '& .names': {flexWrap: 'wrap'},
    '& .vhcenter':{
      display:'flex',alignItems:'center',justifyContent:'center',
    },
    '& .outerLine' : {
      borderTop: '2px #333 solid',
      borderLeft: '2px #333 solid',
      // borderRight: '1px #333 solid', // 右線は引かない。内部セルに任せる
      borderBottom: '1px #333 solid',
      '& > div': {
        borderRight: '1px #333 solid',
        borderBottom: '1px #333 solid',
        textAlign: 'center',
        fontSize: '.8rem',
        padding: 4,
        minHeight: 28,
      },
      '& .date':{
        fontSize: '.75rem',
        padding: '4px 2px',
      },
      '& .changeFontSize': {fontSize: '1rem'},
      '& .repoTj': {padding: '9px 4px', minHeight: 40},
      '& .repoTjTall': {padding: '9px 4px', minHeight: 48},
      '& .repoTjShort': {padding: '9px 4px', minHeight: 32},
      '& .bb' :{borderBottom: '2px #333 solid'}, // 下線太く
      '& .rb' :{borderRight: '2px #333 solid'}, // 右線太く
      '& .uDbl' : {borderTop: '1px #333 double'}, // 上二重線     
      '& .small' :{
        fontSize: '.7rem',
      },
      '& .xsmall' :{
        fontSize: '.5rem',
      },
    },
    '& .lineheigher': {lineHeight: '1.4rem'},
    '& .mainGrid':{
      display:'grid',
      //ここを修正
      // gridTemplateColumns:'3ch 3ch 3fr 2fr 3fr 3fr 1.5fr 1.5fr ' + 
      // '4fr 4fr 4fr 2.5fr 4.5fr 7fr',
      gridTemplateColumns:'3ch 3ch 3fr 2fr 3fr 3fr 1.5fr 1.5fr ' + 
      '4fr 4fr 4fr 4.5fr 7fr',
      // gridTemplateColumns:'3ch 3ch 3fr 2fr 3fr 3fr 1.5fr 1.5fr ' + 
      // '4fr 4fr 4fr 11.5fr',
      marginTop: 24,
      '& > div': {
        display:'flex',alignItems:'center',justifyContent:'center',
        lineHeight: '1.2rem',
      },
      '& .comment': {fontSize: '.7rem', lineHeight: 1.05, textAlign:'left'}
    },
    '& .mainGrid.jihatsu':{
      gridTemplateColumns:'3ch 3ch 3fr 3fr 3fr 1.5fr 1.5fr ' + 
      '4fr 4fr 4fr 4.5fr 7fr',
    },
    '& .lastRow': {
      width:'20%',
      marginLeft: '80%',
      marginTop: 24,
      display:'grid',
      gridTemplateColumns: '1fr 1.5fr 1fr 1.5fr',
      '& > div': {
        display:'flex',alignItems:'center',justifyContent:'center',
        lineHeight: '1.2rem',
      },

    }
  },
  title: {
    display:'grid',paddingTop: 4,gridTemplateColumns: '20% 60% 20%',
    fontSize: '1.2rem',textAlign: 'center',
    '& .date':{fontSize: '.8rem', textAlign: 'left',},
    '& .titleInner': {textAlign: 'center'},
  },
  headGrid: {
    display:'grid',
    gridTemplateColumns:'5fr repeat(10, 1fr) 6fr 17fr 5fr 1fr repeat(10, 1fr)',
    marginTop: 24,
    '& > div': {
      display:'flex',alignItems:'center',justifyContent:'center',
      lineHeight: '1.2rem',
    },
    '& .volume':{
      minHeight: 48,
    },
    '& .outerLine' : {
      borderTop: '2px #333 solid',
      borderLeft: '2px #333 solid',
      // borderRight: '1px #333 solid', // 右線は引かない。内部セルに任せる
      borderBottom: '1px #333 solid',
      '& > div': {
        borderRight: '1px #333 solid',
        borderBottom: '1px #333 solid',
        textAlign: 'center',
        fontSize: '.8rem',
        padding: 4,
        minHeight: 28,
      },
      '& .date':{
        fontSize: '.75rem',
        padding: '4px 2px',
      },
      '& .changeFontSize': {fontSize: '1rem'},
      '& .repoTj': {padding: '9px 4px', minHeight: 40},
      '& .repoTjTall': {padding: '9px 4px', minHeight: 48},
      '& .repoTjShort': {padding: '9px 4px', minHeight: 32},
      '& .bb' :{borderBottom: '2px #333 solid'}, // 下線太く
      '& .rb' :{borderRight: '2px #333 solid'}, // 右線太く
      '& .uDbl' : {borderTop: '1px #333 double'}, // 上二重線     
      '& .small' :{
        fontSize: '.7rem',
      },
      '& .xsmall' :{
        fontSize: '.5rem',
      },
    },
  },
});
// 受け取った文字を一文字ずつdivで括って出力する
export const StrToDivs = (props) => {
  let {
    str, length, strPadding, right, className, styleo,
    bb, rb, // 下線太く、右線太く
    cs, rs, // gridColumunStart gridRowStart
    re, // rowend 
  } = props;
  str = (str !== undefined)? str: '';
  strPadding = (strPadding)? strPadding: ' ';
  right = (right)? true: false;
  className = (className)? className: '';
  styleo = (styleo)? styleo: {};
  length = {length}? length: str.length;
  re = (re)? `span ${re}`: '';
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
    const st = {...styleo, };
    if (cs) st.gridColumn = cs + i;
    if (rs) st.gridRow = rs;
    if (re) st.gridRowEnd = re;
    return (
      <div className={cls} style={st} key={i}>{e}</div>
    )
  })
  return rt
}
// 2021-01-01フォーマットから和暦などの日付情報を取り出す
const str2gdex = (s) =>{
  return comMod.getDateEx(s.split('-')[0], s.split('-')[1], s.split('-')[2]);
}

//12,1,1,2
export const gp = (columnStart, columsSpan, rowStart, rowSpan) => ({
  gridColumn: `${columnStart} / span ${columsSpan}`,
  gridRow: `${rowStart} / span ${rowSpan}`,    
});

export const Title = ({stdDate, service}) => {
  const classes = useStyles();
  const gengou = str2gdex(stdDate).wr.l; // 元号
  const wry = str2gdex(stdDate).wr.y; // 和暦の年
  const month = str2gdex(stdDate).m;
  return(
    <div className={classes.title}>
      <div className='date'>{`${gengou}${wry}年${month}月分`}</div>
      {/* <div>放課後等デイサービス提供実績記録票</div> */}
      <div className='titleInner'>{service}提供実績記録票</div>
      <div></div>
    </div>
  )
}

export const HeadGrid = ({thisUser, com}) => {
  // const hnoStObj = {re: 'span 2'}
  const classes = useStyles();
  const convJido = comMod.findDeepPath(com, 'etc.configReports.convJido', false);
  return(
    <div className={`${classes.headGrid} outerLine`}>
      <div style={gp(1,1,1,2)}>受給者証<br></br>番号</div>
      <StrToDivs 
        str={thisUser.hno} 
        cs={2} rs={1} re={2} length={10}
      />
      <div style={gp(12,1,1,2)} className='small'>
        保護者氏名<br></br>{(convJido ?'児童':'障害児')}氏名
      </div>
      <div style={gp(13,1,1,2)} className='names'>
        {thisUser.pname}
        <div className='large' style={{width:'100%'}}>{thisUser.name}</div>
      </div>
      <div style={gp(14,2,1,1)}>事業所番号</div>
      <StrToDivs 
        str={thisUser.jino} cs={16} rs={1} length={10} rb
      />
      <div style={gp(1,1,3,1)} className='volume'>契約支給量</div>
      <div style={gp(1,13,3,1)}>{thisUser.volume}日</div>
      <div style={gp(14,1,2,2)}>事業者<br></br>事業所</div>
      <div style={gp(15,11,2,2)} className='rb'>{thisUser.bname}</div>
    </div>
  )
}

export const LastRow = () => (
  <div className='lastRow outerLine'>
    <div>1</div><div>枚中</div>
    <div>1</div><div>枚目</div>
  </div>
);

const ReportTeikyouJissekiOne = (props) => {
  const classes = useStyles();
  const {UID, selects, service, ...others} = props;
  const thisSch = useSelector(state=>state.schedule[UID]);
  const users = useSelector(state=>state.users);
  const thisUser = comMod.getUser(UID, users);
  const stdDate = useSelector(state=>state.stdDate);
  const dateList = useSelector(state=>state.dateList);
  const com = useSelector(state=>state.com);
  const isJihatsu = thisUser.service === '児童発達支援'; // 児童発達支援は提供形態を出力しない

  // サイン欄「印」表示設定
  const displayInn = com?.etc?.configReports?.displayInn ?? true;

  //橋本追加 01/31
  const teikyouJissekiOpt = comMod.findDeepPath(com, 'etc.configReports.teikyouJisseki', {});
  const teikyoRadioForm = teikyouJissekiOpt.displayAbsence ?teikyouJissekiOpt.displayAbsence :"0";
  const parentConfirmation = teikyouJissekiOpt.parentConfirmation ?teikyouJissekiOpt.parentConfirmation :{};
  const cellHeightChange = teikyouJissekiOpt.cellHeightChange ?teikyouJissekiOpt.cellHeightChange :false;
  const fontSizeChange = teikyouJissekiOpt.fontSizeChange ?teikyouJissekiOpt.fontSizeChange :false;

  // 該当ユーザーのスケジュールオブジェクトから日付キーを取り出す。
  const schDays = thisSch &&Object.keys(thisSch).filter(e=>{
    if(
      e.indexOf('D2') !== 0 ||
      (thisSch[e] && thisSch[e].service==='保育所等訪問支援') //橋本追加 3/7
    ) return false;
    if(
      thisSch[e].absence
      && teikyoRadioForm==="1"
      && (
        !thisSch[e].dAddiction
        || !thisSch[e].dAddiction["欠席時対応加算"]
      )
    ) return false
    return true
  });
  // 白紙用
  const workDays = dateList.filter(e=>e.holiday < 2).map(e=>{
    return comMod.convDid(e.date);
  });
  const days = (selects === '白紙' || selects === '白紙（利用なし含む）')? workDays: schDays;
  if (!days.length) return null; // 表示する日がなければ何も表示せずに終了
  // daysの長さを揃える
  let numOfLows;
  if (selects === '27行') numOfLows = 27;
  else if (selects === '23行') numOfLows = 23;
  const filler = Array(numOfLows).fill('z-filler');
  days.push(...filler.slice(days.length));
  days.sort((a, b)=>(a > b ? 1 : -1)); // 一応ソートしておく

  // カウント用オブジェクトキー定義
  const cntKey = thisSch && Object.keys(thisSch).filter(e=>e.indexOf('D2') === 0)
  // 送迎回数のカウント
  let sougeiCnt = 0;
  cntKey &&cntKey.map(e=>{
    if (!thisSch[e].absence){
      if (thisSch[e].transfer){
        if (thisSch[e].transfer[0])  sougeiCnt++;
        if (thisSch[e].transfer[1])  sougeiCnt++;
      }
    }
  });
  // 他加算カウント
  let kateiCnt = 0, houmonCnt = 0, iryouCnt = 0, soudanCnt = 0;
  cntKey &&cntKey.map(e=>{
    if (thisSch[e].dAddiction){
      if (thisSch[e].dAddiction.訪問支援特別加算 !== undefined)  houmonCnt++;
      if (thisSch[e].dAddiction.医療連携体制加算 !== undefined)  iryouCnt++;
      if (thisSch[e].dAddiction.家庭連携加算 !== undefined)  kateiCnt++;
      if (thisSch[e].dAddiction.事業所内相談支援加算 !== undefined)  soudanCnt++;
    }
  });

  // D2xxxMMDDのフォーマットから曜日文字列を返す
  const wdFromD = (s) =>{
    if (s.indexOf('D2') !== 0)  return '';
    const v = comMod.getDateEx(
      s.substr(1, 4), s.substr(5, 2), s.substr(7 ,2)
    );
    return (v.wd.jp);
  }

  // mainGridの1行を返す
  const MainGridRow = (props) => {
    const d = props.d;
    // スケジュールが存在しないときはエラーにならないようにダミーのオブジェクトを作成
    // 白紙出力のときもダミーオブジェクト
    // const thisDay = thisSch[d] && selects !== '白紙' 
    // ? thisSch[d] : {transfer:['','']};
    const thisDay = !(selects === '白紙' || selects === '白紙（利用なし含む）') && thisSch[d]
      ? thisSch[d] : {transfer:['','']};
    let kesseki = thisDay.absence && teikyoRadioForm!=="1" ? '欠' : '';
    const kessekiKasan = comMod.findDeepPath(thisDay, 'dAddiction.欠席時対応加算');
    if (kessekiKasan === '1' || kessekiKasan === "欠席時対応加算１"){
      kesseki = '欠席１'
    }
    else if (kessekiKasan === '2' || kessekiKasan === "欠席時対応加算２"){
      kesseki = '欠席２'
    }
    let sougeiPickup = thisDay.transfer[0] ? 1 : '';
    let sougeiSend = thisDay.transfer[1] ? 1 : '';
    const day = (d.indexOf('D2') === 0) ? parseInt(d.substr(7, 2)) : '';
    let keitai = thisDay.offSchool !== undefined? thisDay.offSchool + 1: '';
    // 欠席時の表示抑制
    const start = (thisDay.absence && kesseki !== '欠席２')? '' : thisDay.start;
    const end = (thisDay.absence && kesseki !== '欠席２')? '' : thisDay.end;
    sougeiPickup = (thisDay.absence && kesseki !== '欠席２')? '': sougeiPickup;
    sougeiSend = (thisDay.absence && kesseki !== '欠席２')? '': sougeiSend;
    keitai = (thisDay.absence && kesseki !== '欠席２')? '': keitai;
    let acTotal = 0;
    const tmpAc = thisDay.actualCost? thisDay.actualCost: {};
    Object.keys(tmpAc).map(_=>{
      if (parseInt(thisDay.actualCost[_]) > 0){
        acTotal += parseInt(thisDay.actualCost[_]);
      }
    });
    // 欠席時は実費表示抑制
    acTotal = (thisDay.absence)? 0: acTotal;
    const acTotalStr = acTotal? acTotal+'円': '';
    const jigyousyoSoudan = thisDay.事業所内相談支援加算? 1: '';
    const iryouRenkei = thisDay.医療連携体制加算?
    thisDay.医療連携体制加算.slice(8, 9): '';
    // 行の高さを変える
    let lCls;
    if(cellHeightChange) lCls = '';
    else if (selects === '23行') lCls = 'repoTjTall'; 
    else if (selects === '27行') lCls = 'repoTj'; 
    else if (selects === '白紙' || selects === '白紙（利用なし含む）') lCls = 'repoTjShort';
    if(fontSizeChange) lCls = `${lCls} changeFontSize`;
    return(<>
      <div className={'date ' + lCls}>{day}</div> {/* 日付 */}
      <div className={lCls}>{wdFromD(d)}</div>  {/* 曜日 */}
      <div className={lCls}>{kesseki}</div>  {/* 提供状況 */}
      {/* 提供形態 */}
      {isJihatsu !== true &&
        <div className={lCls}>{keitai}</div> 
      }
      <div className={lCls}>{start}</div>  {/* 開始時間 */}
      <div className={lCls}>{end}</div>  {/* 終了時間 */}
      <div className={lCls}>{sougeiPickup}</div>  {/* 送迎往 */}
      <div className={lCls}>{sougeiSend}</div>  {/* 送迎復 */}
      <div className={lCls}>{thisDay.家庭連携加算}</div>  {/* 家庭連携加算 */}
      <div className={lCls}>{jigyousyoSoudan}</div> 
      <div className={lCls}>{iryouRenkei}</div>
      {!parentConfirmation.confPerDate &&<div className={lCls}></div> } {/*確認印　ここを修正*/}
      <div className={'rb comment ' + lCls}>{thisDay.notice}</div>  {/* 備考 */}
    </>)
  }
  // フッター行
  const FooterRow = () => {
    const totalColmStyle = isJihatsu? {gridColumnEnd:'span 5'}: {gridColumnEnd:'span 6'} 
    if (selects === '白紙' || selects === '白紙（利用なし含む）'){
      return (<>
        <div className='uDbl' style={totalColmStyle}>合計</div>
        <div className='uDbl' style={{gridColumnEnd:'span 2'}}></div>
        <div className='uDbl' ></div>
        <div className='uDbl' ></div>
        <div className='uDbl' ></div>
        {!parentConfirmation.confPerDate &&<div className='uDbl' ></div>} {/*ここを修正*/}
        <div className='uDbl rb' ></div>
      </>)
    }
    return(<>
      <div className='uDbl' style={totalColmStyle}>合計</div>
      <div className='uDbl' style={{gridColumnEnd:'span 2'}}>{sougeiCnt}回</div>
      <div className='uDbl' >{kateiCnt}回</div>
      <div className='uDbl' >{soudanCnt}回</div>
      <div className='uDbl' >{iryouCnt}回</div>
      {!parentConfirmation.confPerDate &&<div className='uDbl' ></div> }{/*ここを修正*/}
      <div className='uDbl rb' ></div>
    </>);

  }

  const MainGrid = () => {
    const displayOtherUseDate = comMod.findDeepPath1(com, 'etc.configReports.teikyouJisseki.displayOtherUseDate', false);
    const adjustDays = (() => {
      if(!displayOtherUseDate) return days;
      const result = [];
      const stdDateList = stdDate.split("-");
      const lastDate = new Date(parseInt(stdDateList[0]), parseInt(stdDateList[1]), 0);
      for(let i=1;i <= lastDate.getDate(); i++){
        const dDate = "D" + stdDateList[0] + stdDateList[1] + String(i).padStart(2, "0");
        result.push(dDate);
      }
      return result;
    })();
    const dayNodes = adjustDays.map((e, i)=>(
      <MainGridRow d={e} key={i} />
    ));
    const jhClass = isJihatsu? 'jihatsu': '';
    const HdGridHead = () => (<>
      <div style={gp(1,1,1,3)} className='bb'>日付</div>
      <div style={gp(2,1,1,3)} className='bb'>曜日</div>
      <div style={gp(3,9,1,1)} >サービス提供実績</div>
      <div style={gp(3,1,2,2)} className='small bb'>サービス<br></br>提供状況</div>
      <div style={gp(4,1,2,2)} className='bb'>提供<br></br>形態</div>
      <div style={gp(5,1,2,2)} className='bb'>開始時間</div>
      <div style={gp(6,1,2,2)} className='bb'>終了時間</div>
      <div style={gp(7,2,2,1)} className='small'>送迎加算</div>
      <div style={gp(7,1,3,1)} className='bb'>往</div>
      <div style={gp(8,1,3,1)} className='bb'>復</div>
      <div style={gp(9,1,2,1)} className='xsmall'>家庭連携加算</div>
      {/* <div style={gp(10,1,2,1)} className='xsmall'>訪問支援特別加算</div> */}
      <div style={gp(9,1,3,1)} className='bb'>時間数</div>
      {/* <div style={gp(10,1,3,1)} className='bb'>時間数</div> */}
      <div style={gp(10,1,2,2)} className='small bb'>
        事業所内<br></br>相談支援加算
      </div>
      <div style={gp(11,1,2,2)} className='small bb'>
        医療連携<br></br>体制加算
      </div>
      {/* <div style={gp(12,1,1,3)} className='bb'>実費</div> */}
      {/*ここを修正*/}
      {!parentConfirmation.confPerDate &&<div style={gp(12,1,1,3)} className='bb'>保護者等<br/>確認欄</div>}
      <div style={parentConfirmation.confPerDate ?gp(12,1,1,3) :gp(13,1,1,3)} className='rb bb'>備考</div>
    </>)
    const JhGridHead = () => (<>
      <div style={gp(1,1,1,3)} className='bb'>日付</div>
      <div style={gp(2,1,1,3)} className='bb'>曜日</div>
      <div style={gp(3,8,1,1)} >サービス提供実績</div>
      <div style={gp(3,1,2,2)} className='small bb'>サービス<br></br>提供状況</div>
      <div style={gp(4,1,2,2)} className='bb'>開始時間</div>
      <div style={gp(5,1,2,2)} className='bb'>終了時間</div>
      <div style={gp(6,2,2,1)} className='small'>送迎加算</div>
      <div style={gp(6,1,3,1)} className='bb'>往</div>
      <div style={gp(7,1,3,1)} className='bb'>復</div>
      <div style={gp(8,1,2,1)} className='xsmall'>家庭連携加算</div>
      {/* <div style={gp(10,1,2,1)} className='xsmall'>訪問支援特別加算</div> */}
      <div style={gp(8,1,3,1)} className='bb'>時間数</div>
      {/* <div style={gp(10,1,3,1)} className='bb'>時間数</div> */}
      <div style={gp(9,1,2,2)} className='small bb'>
        事業所内<br></br>相談支援加算
      </div>
      <div style={gp(10,1,2,2)} className='small bb'>
        医療連携<br></br>体制加算
      </div>
      {/* <div style={gp(12,1,1,3)} className='bb'>実費</div> */}
      {/*ここを修正*/}
      {!parentConfirmation.confPerDate &&<div style={gp(11,1,1,3)} className='bb'>保護者等<br></br>確認欄</div>}
      <div style={parentConfirmation.confPerDate ?gp(11,1,1,3) :gp(12,1,1,3)} className='rb bb'>備考</div>
    </>)
    return(
      <div
        className={'mainGrid outerLine ' + jhClass}
        style={{gridTemplateColumns:
          parentConfirmation.confPerDate
            ?isJihatsu
              ?'3ch 3ch 3fr 3fr 3fr 1.5fr 1.5fr 4fr 4fr 4fr 11.5fr'
              :'3ch 3ch 3fr 2fr 3fr 3fr 1.5fr 1.5fr 4fr 4fr 4fr 11.5fr'
            :null
            
        }}
      >
        {isJihatsu !== true && <HdGridHead/>}
        {isJihatsu === true && <JhGridHead/>}
        {dayNodes}
        <FooterRow />
      </div>
    )
  }

  const ParentConfirmationRow = () => {
    if(!parentConfirmation.checked) return null;
    return(
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        margin: '8px 3%', 
      }}>
        <div style={{width: '50%'}}>
          <div><span style={{margin: '2rem'}}/>年<span style={{margin: '1rem'}}/>月<span style={{margin: '1rem'}}/>日</div>
          <div style={{marginTop: 4}}>上記の通り、{service}の提供を受けたことを確認します。</div>
        </div>
        <div>
          <div style={{display: 'inline-block', borderBottom: '1px solid', width: 360, paddingBottom: 2}}>
            <span style={{paddingRight: 16}}>名前</span>
            {parentConfirmation.bottomOfPage &&<span>{thisUser.pname}</span>}
          </div>
          {displayInn &&<span>印</span>}
        </div>
      </div>
    )
  }

  return(<>
    <div className={classes.reportTeikyou}>
      <Title stdDate={stdDate} service={service}/>
      <HeadGrid thisUser={thisUser} com={com}/>
      <MainGrid />
      <ParentConfirmationRow />
      <LastRow />
    </div>
    <div className='pageBreak'></div>
  </>)
}

const ReportTeikyouJisseki = (props) =>{
  const {userList, selects, ...others} = props;
  const schedule = useSelector(state=>state.schedule);
  const users = useSelector(state=>state.users);
  const mainService = useSelector(state=>state.service);

  const hist = useHistory();

  // スケジュールに定義されているUIDリスト
  const uidsInSch = Object.keys(schedule).filter(e=>e.indexOf('UID') === 0);
  // check が　trueのユーザーリストを求める
  const tmpUlst = userList.filter(e=>e.checked);
  // 白紙の時は予定入力がある利用者ではなくusersの利用者を使う
  const uidsFiltered = selects !== '白紙（利用なし含む）'
    ?uidsInSch.filter(e=>tmpUlst.find(f=>'UID' + f.uid === e))
    :tmpUlst.map(x => "UID"+x.uid);
  const handleLinkClick = () => {
    hist.push('/schedule');
  }
  // ユーザーリストの並び順にソート
  uidsFiltered.sort((a, b)=>(
    comMod.getUser(a, users).sindex - comMod.getUser(b, users).sindex
  ));
  // 表示するデータをカウント
  let dtCnt = 0;
  uidsFiltered.map(e=>{
    if(selects === "白紙（利用なし含む）") return;
    dtCnt += Object.keys(schedule[e]).filter(f=>f.indexOf('D2') > -1).length;  
  })
  // 白紙出力のときは強制的に表示する スケジュールが存在するかどうか確認
  if ((selects === '白紙' || selects === '白紙（利用なし含む）') && Object.keys(schedule).length){
    dtCnt = 1;
  }
  const pages = uidsFiltered.flatMap((e, i)=>{
    const userDt = users.find(uDt => "UID"+uDt.uid === e);
    if(!userDt) return null;
    // サービスが含まれていないユーザーはスキップ
    if(!(mainService==="" || new RegExp(mainService).test(userDt.service))) return null
    const serviceList = userDt.service.split(',');
    return serviceList.map(service => {
      if(mainService && service !== mainService) return null;
      if(service === '保育所等訪問支援') return(<HohouTeikyouJissekiOne selects={selects} uidStr={e} service={service}/>);
      else return(<ReportTeikyouJissekiOne selects={selects} UID={e} key={i} service={service}/>)
    });
  });
  if (dtCnt){
    return pages;
  }
  else{
    return(
      <div style={{margin:120,}}>
        表示するデータが見つかりませんでした。
        {(selects === '白紙' || selects === '白紙（利用なし含む）') &&
          <span>
            <a style={{color:teal[800]}} onClick={handleLinkClick}>
              こちらを
            </a>
            クリックしてから再度実行してみて下さい。
          </span>
        }
      </div>
    )
  }
}

const TeikyouJisseki = (props) => {
  const com = useSelector(state => state.com);
  const stdDate = useSelector(state => state.stdDate);
  const {userList, preview, selects, ...others} = props;
  // selects: 23行 or 27行
  const reportProps = {userList, selects}
  // リストにないプレビューが送られてきたら何もしないで終了
  const nameList = ['提供実績記録票', ];
  if (nameList.indexOf(preview) < 0)  return null;
  const teikyouJisseki2024Checked = com?.etc?.configReports?.teikyouJisseki?.teikyouJisseki2024?.checked ?? stdDate>=LC2024;
  if(teikyouJisseki2024Checked) return null;
  const displaySelects = ['23行', '27行', '白紙', '白紙（利用なし含む）'];
  if(!displaySelects.includes(selects))  return null;
  if (preview === '提供実績記録票'){
    return (
      <ReportTeikyouJisseki {...reportProps} />
    )  
  }
  else {
    return(
      <div style={{margin:120,}}>
        表示するデータが見つかりませんでした。
      </div>
    )
  }
}
export default TeikyouJisseki;