import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  proseedByUsersDt
} from '../Billing/Proseed'
import { endPoint } from '../../Actions'
import axios from 'axios';
import { LoadingSpinner } from '../common/commonParts';
import useInterval from 'use-interval';
import GroupIcon from '@material-ui/icons/Group';
import { CenterFocusStrong, ColorizeSharp, FormatBold, FullscreenExit } from '@material-ui/icons';
import SnackMsg from '../common/SnackMsg';
import teal from '@material-ui/core/colors/teal';


const useStyles = makeStyles({
  gridRepotRoot:{
    width:'90%',
    maxWidth: 900,
    margin:'60px auto 0',
    '@media print':{
      width: '300mm',
      margin:'20mm 10mm 10mm 20mm'
    },
    '& .title':{
      fontSize:'1.4rem',
      textAlign: 'center',
      padding: '8px 0 16px',
    },
    '& .vhcenter':{
      display:'flex',alignItems:'center',justifyContent:'center',
    },
    '& .cells':{
      border: '1px #333 solid',
      textAlign: 'center',
      fontSize: '.8rem',
      margin: '-1px 0 0 -1px',
      padding: 3,

    },
    '& .row1':{
      display:'flex',
      justifyContent:'space-between',
      alignItems: 'flex-start',
      '& .col1':{
        width:'40%',
        display:'grid',
        gridTemplateColumns: '40% 1fr 1fr 1fr 1fr 1fr 1fr',
        gridAutoRows: '1fr',
        // borderTop: '1px #333 solid',
        // borderleft: '1px #333 solid',
        padding: '1px 0 0 1px'
      },
      '& .col2':{
        width:'30%',
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
          gridRow:'1 / 5',gridColumn: 1,
        } ,
        '& .jiheader': { // 事業所名見出し
          gridRow:'2 / 4', gridColumn: 2,
        },
        '& .jiname':{ // 事業所名
          gridColumn: '3/13',
        },
        '& .tkubunheader':{ // 地域区分ヘッダ
          gridColumn: '3/5',
        },
        '& .tkubun':{ // 地域区分
          gridColumn: '5/13',
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
      marginTop: 8,
    },
    '& .row4': {
      display:'grid',
      gridTemplateColumns:
        '20ch 15ch repeat(11, 1fr) 12ch 1fr 12ch repeat(5,1fr)',
      marginTop: 8,
      '& .head':{gridRow:'1/3', gridColumn:1},
      '& .jinoHead': {gridColumn:'2/4'},
      '& .jiname': {gridColumn: '3/22'},
    },
    '& .row5': {
      display:'grid',
      gridTemplateColumns:
        '8ch 1fr 1fr 8ch 5ch repeat(9, 1fr) 8ch 5ch repeat(9, 1fr) ' + 
        '5ch 1fr 1fr 5ch 1fr 1fr',
      marginTop: 8,
      '& .head': {
        gridRow: '1/3',
      },
    },
    '& .row6': {
      display:'grid',
      gridTemplateColumns:
        '2ch 10fr repeat(6, 1fr) repeat(4, 1fr) 1fr 1fr repeat(5, 1fr) 8fr',
      marginTop: 8,
      '& .head': {
        gridRow: '1/15',
      },
      '& .headSvcName':{
        gridColumn: '2',
      },

      '& .headSvcCode':{
        gridColumn: '3/9',
      },
      '& .headTanniSuu':{
        gridColumn: '9/13',
      },
      '& .headKaisuu':{
        gridColumn: '13/15',
      },
      '& .headSvcTannisuu':{
        gridColumn: '15/20',
      },
      '& .headTekiyou':{
        gridColumn: '20',
      },
      
    },
    
    
    '& .sizem': {
      fontSize: '1.0rem',
    },
    '& .sizes': {
      fontSize: '.65rem',
    },
    '& .tallPadding': {
      paddingTop: 8,
      paddingBottom: 8,
    },
    '& .heightInGrid': {
      height: 20,
    },
    '& .textLeft': {
      textAlign: 'left',
    },
  },
});
// 受け取った文字を一文字ずつdivで括って出力する
const StrToDivs = (props) => {
  let {
    str, length, strPadding, right, className, styleo, 
    cs, rs, // gridColumunStart gridRowStart
  } = props;
  strPadding = (strPadding)? strPadding: ' ';
  right = (right)? true: false;
  className = (className)? className: '';
  styleo = (styleo)? styleo: {};
  length = {length}? length: str.length;
  if (right){
    str = strPadding.repeat(length) + str;
    str = str.slice(length * (-1));
  }
  else{
    str = str + strPadding.repeat(length);
    str = str.substr(0, length);
  }
  const rt = Array.from(str).map((e, i)=>{
    styleo.gridRowStart = rs;
    styleo.gridColumnStart = cs + 1;
    return (
      <div className={className} style={styleo} key={i}>{e}</div>
    )
  });
  return (rt);
}
// 2021-01-01フォーマットから和暦などの日付情報を取り出す
const str2gdex = (s) =>{
  return comMod.getDateEx(s.split('-')[0], s.split('-')[1], s.split('-')[2]);
}

const itemTotal = [
  {
      "s": "631523",
      "v": 621,
      "c": "放デイ２４・有資格１０・",
      "count": 321,
      "tanniNum": 199341
  },
  {
      "s": "634046",
      "v": 155,
      "c": "放デイ児童指導員等加配加算Ⅰ２・７・",
      "name": "児童指導員等加配加算（Ⅰ）",
      "value": "児童指導員等",
      "opt": "児童指導員・平日・区分２の１・10人以下・",
      "limit": "",
      "syoguu": "",
      "count": 42,
      "tanniNum": 6510
  },
  {
      "s": "636240",
      "v": 54,
      "c": "放デイ送迎加算Ⅰ・",
      "name": "送迎加算",
      "value": "送迎加算Ⅰ",
      "opt": "",
      "limit": "",
      "syoguu": "",
      "count": 692,
      "tanniNum": 37368
  },
  {
      "s": "636611",
      "v": 114,
      "c": "放デイ処遇改善特別加算・",
      "name": "福祉・介護職員処遇改善特別加算",
      "value": "1",
      "opt": "",
      "limit": "once",
      "syoguu": "1",
      "count": 24,
      "tanniNum": 3132,
      "vbk": 1.1
  },
  {
      "s": "636621",
      "v": 839,
      "c": "放デイ処遇改善加算Ⅰ・",
      "name": "福祉・介護職員処遇改善加算",
      "value": "福祉・介護職員処遇改善加算Ⅰ",
      "opt": "",
      "limit": "once",
      "syoguu": "1",
      "count": 24,
      "tanniNum": 23075,
      "vbk": 8.1
  }
];

export const GridTest = () => {
  const classes = useStyles();
  const stdDate = useSelector(state=>state.stdDate);
  const com = useSelector(state=>state.com);
  const bname = com.bname;
  const jino = com.jino;
  const tkubun = com.addiction.放課後等デイサービス.地域区分;
  const reiwa = parseInt(stdDate.substr(0, 4) - 2018) + '';
  const month = stdDate.substr(5, 2);
  const cityNum = '123456';
  const jCityNum = '';
  const hno = '0123456789';
  const name = '坂本 美雨';
  const hname = '矢野 顕子';
  const jougen = 4600;
  const kanriJi = '1472583690';
  const kanriJiName = 'ほがらか放課後デイサービス';
  const kanrikekka = 1;
  const kanrikkekkaGaku = 0;
  const startDate = '2016-01-05';
  const endDate = '0000-00-00';
  const useCount = 12;
  const sSyubetsu = '63';
  let sd = startDate.split('-');
  console.log(comMod.getDateEx(sd[0], sd[1], sd[2]));
  const Row1Col1 = () => {
    return(<>
      <div className='cells'>市町村番号</div>
      <StrToDivs str={cityNum} className='cells' length={6} />
      <div className='cells'>助成自治体番号</div>
      <StrToDivs str={jCityNum} className='cells' length={6} />
    </>);
  }
  const Row1Col2 = () => {
    return (<>
      <div className='cells'>平成</div>
      <StrToDivs 
        str={reiwa} length={2} className='cells' strPadding='0' right={true}
      />
      <div className='cells'>年</div>
      <StrToDivs 
        str={month} length={2} className='cells' strPadding='0' right={true}
      />
      <div className='cells'>月分</div>
    </>)
  }
  const Row2Col1 = () => {
    return (<>
      <div className='cells'>受給者証番号</div>
      <StrToDivs str={hno} className='cells'/>
      <div className='cells'>支給決定保護者<br></br>氏名</div>
      <div className='cells name'>{hname}</div>
      <div className='cells'>支給決定に係る<br></br>障害児氏名</div>
      <div className='cells name'>{name}</div>

    </>);
  } 
  const Row2Col2 = () => {
    return (<>
      <div className='cells vheader vhcenter'>請求事業所</div>
      <div className='cells vhcenter'>指定事業所</div>
      <StrToDivs str={jino} className='cells'/>
      <div className='jiheader cells vhcenter'>
        事業所および<br></br>その事業所の<br></br>名称
      </div>
      <div className='jiname cells vhcenter sizem tallPadding'>{bname}</div>
      <div className='tkubunheader cells'>地域区分</div>
      <div className='tkubun cells'>{tkubun}</div>
      <div className='sshienHeader cells'>就労継続支援A型事業者負担減免措置実施</div>
      <div className='sshien cells'></div>
    </>);
  }
  const Row3 = () => (<>
    <dic className='cells'>利用者負担上限月額(1)</dic>
    <StrToDivs str={jougen} className='cells' right={true} length={5} />
  </>);
  const Row4 = () => (<>
    <div className='cells head vhcenter'>利用者負担上限額<br></br>管理事業所</div>
    <div className='jinoHead cells'>指定事業所番号</div>
    <StrToDivs str={kanriJi} className='cells' />
    <div className='cells'>管理結果</div>
    <div className='cells'>{kanrikekka}</div>
    <div className='cells'>管理結果額</div>
    <StrToDivs str={kanrikkekkaGaku} className='cells' right={true} length={5} />
    <div className='cells'>事業所名称</div>
    <div className='cells jiname'>{kanriJiName}</div>
    
  </>)
  const Row5 = () => {
    //開始日付、終了日付の和暦を取得 空白の日付には空のオブジェクトを返す
    let o = str2gdex(startDate);
    const stwr = (startDate.indexOf('0000') === 0)?
      {l: '', y: '', m: '', d:''}: {l: o.wr.l, y: o.wr.y, m: o.m, d:o.d};
    o = str2gdex(startDate);
    const edwr = (endDate.indexOf('0000') === 0)?
      {l: '', y: '', m: '', d:''}: {l: o.wr.l, y: o.wr.y, m: o.m, d:o.d};
    return (<>
      <div className='cells head'>サービス<br></br>種別</div>
      <StrToDivs str={sSyubetsu} className='cells' />
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
      <StrToDivs str='' className='cells' right={true} length={2} />

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
      <StrToDivs str='' className='cells' right={true} length={2} />


    </>)  
  }
  const Row6 = () => {
    // 末尾の中黒を削除
    const delNkgr = (s) => {
      return (s.replace(/・$/, ''))
    }
    // 表示用の配列の長さが規定になるまで空のオブジェクトを追加
    if (itemTotal.length < 13){
      const len = 13 - itemTotal.length;
      const tmp = Array(len).fill({c:'',s:'',v:'',count:'',tanniNum:''});
      tmp.map(e=>{itemTotal.push(e)});
    }
    const detail = itemTotal.map(e=>{
      return(<>
        <div className='cells heightInGrid textLeft'>{delNkgr(e.c)}</div>
        <StrToDivs str={e.s} className='cells' length={6}/>
        <StrToDivs str={e.v} className='cells' length={4} right/>
        <StrToDivs str={e.count} className='cells' length={2} right />
        <StrToDivs str={e.tanniNum} className='cells' length={5} right />
        <div className='cells'></div>
      </>);
    });
    return(<>
      <div className='cells head'>給付費明細欄</div>
      <div className='cells headSvcName'>サービス内容</div>
      <div className='cells headSvcCode'>サービスコード</div>
      <div className='cells headTanniSuu'>単位数</div>
      <div className='cells headKaisuu'>回数</div>
      <div className='cells headSvcTannisuu'>サービス単位数</div>
      <div className='cells headTekiyou'>適用</div>
      {detail}

    </>)
  }
  
  return(
    <div className={classes.gridRepotRoot}>
      <div className='title'>障害児通所給付費・入所給付費等明細書</div>
      <div className='row1'>
        <div className='col1'>
          <Row1Col1/>
        </div>
        <div className='col2'>
          <Row1Col2 />
        </div>
      </div>
      <div className='row2'>
        <div className='col1'>
          <Row2Col1/>
        </div>
        <div className='col2'>
          <Row2Col2/>
        </div>
      </div>
      <div className='row3'><Row3/></div>
      <div className='row4'><Row4/></div>
      <div className='row5'><Row5/></div>
      <div className='row6'><Row6/></div>

    </div>
  )
}
export default GridTest;