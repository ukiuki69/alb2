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
import { AddToPhotosOutlined, CenterFocusStrong, ColorizeSharp, FormatBold, FullscreenExit, MicNone } from '@material-ui/icons';
import SnackMsg from '../common/SnackMsg';
import teal from '@material-ui/core/colors/teal';
import { serviceSyubetu } from '../Billing/BlCalcData';
import { red } from '@material-ui/core/colors';
import { ReportWarningWrapper } from './Reports';
import { getSvcNameByCd } from '../Billing/blMakeData2024';

// 通所給付明細
// 国定形式の代理受領通知明細も兼ねる

// サービス種別切替ボタンコンポーネント
export const ChangeServiceAll = () => {
  const dispatch = useDispatch();
  const handleChangeServiceAll = () => {
    dispatch(Actions.setStore({ service: '' }));
    // ローカルストレージもクリア
    localStorage.setItem('selectedService', '');
  };
  return (
    <div style={{ marginTop: 20 }}>
      <Button 
        variant="contained" 
        color="default"
        onClick={handleChangeServiceAll}
      >
        切替を行う
      </Button>
    </div>
  );
};

// クラスルーム切替ボタンコンポーネント
export const ChangeClassroomAll = () => {
  const dispatch = useDispatch();
  const handleChangeClassroomAll = () => {
    dispatch(Actions.setStore({ classroom: '' }));
    // ローカルストレージもクリア
    localStorage.setItem('selectedClassroom', '');
  };
  return (
    <div style={{ marginTop: 20 }}>
      <Button 
        variant="contained" 
        color="default"
        onClick={handleChangeClassroomAll}
      >
        切替を行う
      </Button>
    </div>
  );
};

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
    '& .vhcenter.small':{
      fontSize: '.8rem',
    },
    '& .cells':{
      // border: '1px #333 solid',
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
      '& > div': {
        borderRight: '1px #333 solid',
        borderBottom: '1px #333 solid',
        textAlign: 'center',
        fontSize: '1.0rem',
        padding: 2,
        minHeight: 18,
      },
      '& .bb' :{borderBottom: '2px #333 solid'}, // 下線太く
      '& .rb' :{borderRight: '2px #333 solid'}, // 右線太く      
    },
    '& .outerLine.small' : {
      '& > div': {
        fontSize: '.8rem',
        padding: 4,
        minHeight: 18,
      },
    },

    '& .row1':{
      display:'flex',
      justifyContent:'flex-end',
      alignItems: 'flex-start',
      '& .col1':{
        width:'24%',
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
      // marginTop: 24,
      '& .col1':{
        width:'45%',
        display:'grid',
        gridTemplateColumns:'6fr repeat(10, 1fr)',
        '& .filler': {
          gridColumn: '8/12',
        },
        '& .content' : {
          gridColumn: '2/12',
          '& .cntInner': {padding : 4, textAlign: 'center'},
        },
      },
      '& .col2':{
        width:'54%',
        display:'grid',
        gridTemplateColumns:'2ch 3fr repeat(10, 1fr)',
        '& .vheader':{ // 縦の見出し
          gridRow:'1 / 3',gridColumn: 1,
        },
        '& .content': {
          gridColumn: '3/13',
          fontSize: '1.0rem',
          // height: 80,
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
      marginTop: 24,
      '& .r1': {
        display:'flex',
        width: '40%',
        fontSize: '.8rem',
        '& .r1c1': {
          width:'85%',
          border:'#333 2px solid',
          borderBottom: 'none',
          borderRight: 'none',
          padding: 8,
          textAlign: 'center',
        },
        '& .r1c2': {
          width:'15%',
          border:'#333 2px solid',
          padding: 8,
          textAlign: 'center',
        },
      },
      '& .r2' : {
        marginTop: -2,
        border:'#333 2px solid',
        padding: '16px 10%',
        '& > div': { padding: 4, fontSize: '.8rem',},
      }
    },
    '& .row56': {
      display:'grid',
      gridTemplateColumns:
        '2ch 9fr repeat(30, 1fr) ',
      marginTop: 24,
      '& .vHead': {
        gridRow: '1/7',
        wordBreak:'break-word',
        lineHeight: '1.05rem',
      },
      '& .vHead2': {
        gridRow: '1/9',
        wordBreak:'break-word',
        lineHeight: '1.05rem',
      },
      '& .rHead': { gridColumnStart: 2,},
      '& .jiName' : {height: 120,},
      '& .total': { gridRow: '1/4' },
      '& .total2': { gridRow: '1/6' },
    },
    '& .sizem': {fontSize: '1.0rem',},
    '& .sizes': {fontSize: '.65rem',},
    '& .sizexs': {fontSize: '.50rem',},
    '& .outerLine .tallPadding': {
      paddingTop: 8,
      paddingBottom: 8,
    },
    '& .heightInGrid': {height: 20,},
    '& .textLeft': {textAlign: 'left',},
    '& .usersSig': {
      width: '50%',
      marginLeft: '50%',
      padding: 12,
      '& >div': {
        padding: 8,
      } ,
      '& .sig':{
        width: '90%',
        marginLeft: '10%',
        borderBottom: '#333 1px solid',
      }
    }
  },
  // 利用者負担額一覧用
  gridReportFtnRoot:{
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
      padding: '8px 0',
      '& .date':{
        fontSize: '1.0rem',
        padding: 8,
        textAlign:'right',
      }
    },
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
        padding: 4,
        minHeight: 18,
        fontSize: '1.05rem',
        minWidth: 22,
      },
      '& .bb' :{borderBottom: '2px #333 solid'}, // 下線太く
      '& .rb' :{borderRight: '2px #333 solid'}, // 右線太く      
    },
    '& .lineheigher': {lineHeight: '1.4rem'},
    '& .row1': {
      display: 'flex',
      fontSize: '.8rem',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      '& .col1': {
        width: '45%',
        '& > div': {
          margin: '4px 0',
        },
        '& .jiname': {
          display: 'flex',
          alignItems: 'flex-end',
          '& .name': {
            height: 120,
            fontSize: '1.0rem',
            flex: 1,
          },
          '& .dono': {
            width: '4ch',
            display: 'flex',
          }
        },
        '& .month':{
          display: 'grid',
          width: '30ch',
          gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1fr 1fr 2fr'
        }
      },
      '& .col2':{
        display: 'grid',
        gridTemplateColumns: '3ch 8fr repeat(10, 1fr)',
        width: '53%',
      },
      '& .vHead': { gridRow: '1/5',},
      '& .rHead': {gridColumnStart: 2, },
      '& .content' : {
        gridColumnStart: 3, gridColumn: '3/13', 
      },
      '& .tall': {minHeight: 80,},
    },
    '& .mainGrid': {
      marginTop: 24,
      display: 'grid',
      gridTemplateColumns: '3ch 3fr 6fr repeat(10, 1fr) 4fr repeat(6, 1fr)' + 
        '2fr fr fr 2fr',
      '& .cHead1' : {fontSize: '.5rem'},
      '& .cHead2' : {gridColumn: '2/26'},
      '& .vHead': { gridColumn: 1},
      '& .rHead1': {
        gridColumn: '2 / span 3', fontSize: '.8rem', 
        display:'flex', alignItems: 'center',
      },
      '& .rHead2': {
        gridColumn: '2 / span 2', fontSize: '.8rem',
        display:'flex', alignItems: 'center',
      },
      '& .mHead': {
        gridColumn : 15, fontSize: '.8rem',
        display:'flex', alignItems: 'center',
      },
      '& .name' : {
        gridColumn: '4 / span 11'
      },
      '& .serviceLabel': {gridColumn: 22, gridRow: 'span 3', fontSize: '.6rem'},
      '& .service': {
        gridColumn: 25, fontSize: '.4rem',
        display:'flex', alignItems: 'center',
      },
    }
  }
});
// 受け取った文字を一文字ずつdivで括って出力する
export const StrToDivs = (props) => {
  let {
    str, length, strPadding, right, className, styleo,
    bb, rb, // 下線太く、右線太く
    cs, rs, // gridColumunStart gridRowStart
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
    const st = {...styleo};
    if (cs) st.gridColumn = cs + i;
    if (rs) st.gridRow = rs;
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

export const ReportKanriKekkaOne = (props) => {
  const classes = useStyles();
  const {
    thisBdt, com, service, account, thisUser, masterRec, preview, billingDt,
    hidePersonalInfo, reportDateDt
  } = props.props;
  const schedule = useSelector(state=>state.schedule);
  const stdDate = useSelector(state=>state.stdDate);
  const users = useSelector(state => state.users);
  const kanriType = thisBdt.kanriType;
  const brosIndex = thisBdt.brosIndex;
  // 管理事業所ではなく長男長女でもない
  if (kanriType !== '管理事業所' && parseInt(brosIndex) !== 1) return null;
  // 管理事業所であっても兄弟管理の長男長女以外
  if (kanriType === '管理事業所' && parseInt(brosIndex) > 1)  return null;
  // 長男長女だが協力事業所
  if (kanriType === '協力事業所')  return null;

  const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
  const thisJino = com.jino;
  const bname = com.bname;
  const tkubun = com.addiction.放課後等デイサービス.地域区分;
  const gengou = str2gdex(stdDate).wr.l; // 元号
  const wry = str2gdex(stdDate).wr.y; // 和暦の年
  const month = str2gdex(stdDate).m;
  const jCityNum = '';
  const hno = thisBdt.hno;
  const name = thisBdt.name;
  const hname = thisBdt.pname;
  const jougen = thisUser.priceLimit;
  const kanriJi = (thisBdt.jougenJi)? thisBdt.jougenJi: '';
  const kanriJiName = thisBdt.jougenJiName;
  const kanrikekka = thisBdt.kanrikekka;
  const kanrikkekkaGaku = (thisBdt.kanrikkekkaGaku)? thisBdt.kanrikkekkaGaku: 0;
  const startDate = thisUser.startDate;
  const endDate = thisUser.endDate;
  const useCount = thisBdt.countOfUse;
  const sSyubetsu = (service === '放課後等デイサービス')? "63" : "61";
  const itemTotal = thisBdt.itemTotal;
  const unitPrice = masterRec.unitPrice * 100;
  const tanniTotal = thisBdt.tanniTotal;
  
  // 複数児童のフォーマットを使うかどうか
  const fukusuuJidou = thisBdt.brosJougen? true: false;
  
  // 管理結果の詳細
  let kDetail = [];
  // 協力事業所配列の処理
  const modKyji = (e) => {
    // const b = billingDt.find(f=>f.UID === e.UID);
    e.map(h=>{
      // h.hno = b.hno;
      // h.userName = b.name;
      // nameというキーは利用者名とかぶるので紛らわしい
      h.jiName = (h.lname)? h.lname: h.name;
      delete h.name; delete h.lname;
    });
  } 
  
  // // 兄弟情報を追加
  if (thisBdt.brosJougen){
    const t = thisBdt.brosJougen;
    kDetail.push(...t);
  }
  
  // 協力事業所情報を追加
  // kDetail.push((thisBdt.協力事業所)? [...thisBdt.協力事業所]: []);
  if (thisBdt.協力事業所){
    // 複数児童の場合は協力事業所配列の中の自社を入れない
    // 利用がない兄弟が表示されるのを抑制 2022/08/16 -> ここではしない
    const t = (fukusuuJidou)? 
      thisBdt.協力事業所.filter(e=>e.name!=='thisOffice')
      // .filter(e=>e.amount && e.kettei)
      : thisBdt.協力事業所;
    modKyji(t); // 協力事業所配列処理
    kDetail.push(...t);
  }

  // 兄弟情報に基づき兄弟の管理事業所を追加
  if (thisBdt.brosJougen){
    thisBdt.brosJougen.filter(e=>parseInt(e.brosIndex) !== 1).map(e=>{
      const b = billingDt.find(f=>f.UID === e.UID);
      if (b.協力事業所){
        // 利用がない兄弟が表示されるのを抑制 2022/08/16 -> ここではしない
        const t = b.協力事業所.filter(g=>g.name!=='thisOffice')
        // .filter(g=>g.amount && g.kettei);
        modKyji(t); // 協力事業所配列処理
        kDetail.push(...t);  
      }
    });
  }
  // const deletePoint = kDetail.map((e, i)=>{
  //   if (e.amount === 0 && e.kettei === 0 && e.jiname === "thisOffice") return i
  // }).filter(e=>e !== undefined);
  // deletePoint.forEach(e=>{kDetail.splice(e, 1)});
  // フィルタのロジック変更 2023/08/04 今までのは無効だった
  // 金額情報がなくてe.no=事業所番号が記載されていない自事業所のデータは出力しない
  kDetail = kDetail.filter(e=>(
    (e.amount + e.kettei + e.ichiwari > 0) || e.no
  ))
  // 協力事業所が9箇所記述できるようになっているので9件まで配列拡張する
  if (kDetail.length < 9){
    const tmp = Array(9 - kDetail.length).fill(
      {amount:'', name:'', ichiwari:'', kettei:'', lname: '', empty: true}
    );
    tmp.map(e=>{kDetail.push(e)});
  }
  if(kDetail.length >= 10){
    const tmp = Array(14 - kDetail.length).fill(
      {amount:'', name:'', ichiwari:'', kettei:'', lname: '', empty: true}
    );
    tmp.map(e=>{kDetail.push(e)});
  }
  // 合計覧表示のために合計値を配列の最後に追加する。
  const totalRec = {amount:0, name:0, ichiwari:0, kettei:0, tyouseiGaku:0, isTotalRow: true}
  kDetail.map(e=>{
    totalRec.amount += e.amount;
    totalRec.ichiwari += e.ichiwari;
    
    // 利用者負担額の単純合計を算出する
    // 表示ロジック(KyoJiInRow56)と同じ計算式を使用
    // Math.min(e.ichiwari, parseInt(thisUser.priceLimit))
    let calcTyouseiGaku = 0;
    if (!e.empty) {
       calcTyouseiGaku = Math.min(e.ichiwari, parseInt(thisUser.priceLimit));
    }
    
    totalRec.tyouseiGaku += calcTyouseiGaku;
    totalRec.kettei += e.kettei;
  });
  kDetail.push(totalRec);
  // 長兄がトップに来ないことがあるのでソートを追加
  kDetail.sort((a, b)=>(parseInt(a.brosIndex) < parseInt(b.brosIndex)? -1: 1));

  const ichiwari = Math.floor(thisBdt.userSanteiTotal * .1);
  const ketteigaku = (thisBdt.ketteigaku || !isNaN(thisBdt.ketteigaku))?
    thisBdt.ketteigaku: 0;
  let sd = startDate.split('-');
  const Row1 = () => {
    return (<>
      <div >{gengou}</div>
      <StrToDivs 
        str={wry} length={2}  strPadding='0' right={true}
      />
      <div >年</div>
      <StrToDivs 
        str={month} length={2}  
        strPadding='0' right={true} 
      />
      <div className='rb'>月分</div>
    </>)
  }
  const Row2Col1 = () => {
    // 複数児童を想定して保険証番号,名前の記述をComponent化する
    const DispMulti = (props) => {
      const {field, } = props;
      // brosJougeとbdtで利用者名のメンバー名が違うため
      const field1 = (field === 'name')? 'userName': field;
      const bj = Array.isArray(thisBdt.brosJougen)? thisBdt.brosJougen: [];
      const hnos = bj.map((e, i)=>{
        return(
          <div className='cntInner' key={i}>
            { 
              '(' + (i + 1) + ') ' + 
              comMod.getHiddenName(e[field1], hidePersonalInfo)
            }
          </div>
        )
      });
      if (fukusuuJidou){
        return (
          <div className='content rb'>
            {/* <div className='cntInner'>
              (1) {comMod.getHiddenName(thisBdt[field])}
            </div> */}
            {hnos}
          </div>
        )
      }
      else{
        if (field === 'hno'){
          return(
            <StrToDivs str={thisBdt.hno} length={10} rb />
          )  
        }
        else{
          return(
            <div className='rb content vhcenter'>
              {comMod.getHiddenName(name, hidePersonalInfo)}
            </div>
          )
        }
      }
    }
    return (<>
      <div className='vhcenter rb'>市町村番号</div>
      <StrToDivs str={thisBdt.scityNo} length={6} />
      <div className='filler rb'></div>
      <div className='vhcenter rb'>受給者証番号</div>
      {/* <StrToDivs str={thisBdt.hno} length={10} rb /> */}
      <DispMulti field={'hno'}/>
      <div className='vhcenter rb'>支給決定{convJido ?'利用者':'障害者等'}<br></br>氏名</div>
      <div className='rb content vhcenter'>
        {comMod.getHiddenName(hname, hidePersonalInfo)}
      </div>
      <div className='vhcenter rb'>支給決定に係る<br></br>{(convJido ?'児童':'障害児')}氏名</div>
      {/* <div className='rb content vhcenter'>
        {comMod.getHiddenName(name, true)}
      </div> */}
      <DispMulti field={'name'}/>

    </>);
  } 
  const Row2Col2 = () => {
    return (<>
      <div className='vheader vhcenter' style={{padding: '4px 2px'}}>管理事業者</div>
      <div className='vhcenter small'>指定事業所番号</div>
      <StrToDivs str={com.jino} length={10} rb />
      <div className='vhcenter tallPadding'>
        事業所及び<br></br>その事業所<br></br>の名称
      </div>
      <div className='vhcenter content rb '>{com.bname}</div>
    </>);
  }
  const Row3 = () => (<>
    <div className='cells'>利用者負担上限月額</div>
    <StrToDivs str={jougen} className='cells' rb right={true} length={5} />
  </>);
  const Row4 = () => (<>
    <div className='r1'>
      <div className='r1c1'>利用者上限負担管理結果</div>
      <div className='r1c2'>{thisBdt.kanriKekka}</div>
    </div>
    <div className='r2'>
      <div>1　管理事業所で利用者負担額を充当したため、他事業所の利用者負担は発生しない。</div>
      <div>2　利用者負担額の合算額が、負担上限月額以下のため、調整事務は行わない。</div>
      <div>3　利用者負担額の合算額が、負担上限月額を超過するため、下記のとおり調整した。</div>
    </div>
    
  </>)
  // 協力事業所を描画する。1ブロックずつ
  const KyoJiInRow56 = (props) => {
    const users = useSelector(state=>state.users);
    const p = props.p;
    const q = (p >= 5)?(p >= 10) ?p - 10 :p - 5: p;
    const clms = (q * 6) + 3;  // カラム位置
    if (p === undefined) return null;
    // grid位置をスタイルとして渡す
    const grs = (r) => ({
      gridRowStart:r, gridColumnStart: clms, gridColumnEnd: clms + 6
    });
    const e = kDetail[p];
    // const thisUser = comMod.getUser(e.UID, users);
    let jino = (e.no && e.no !== '0')? e.no: com.jino;
    jino = e.empty ? '': jino;
    // let jiname = (p === 0)? com.bname: (e.lname)? e.lname: e.name;
    let jiname = (e.jiName && e.jiName !== 'thisOffice')? e.jiName: com.bname;
    jiname = e.empty? '': jiname;
    const num = (e.name || e.userName)? (p + 1) : ''; // 項番。空のレコードのときは空白
    // 複数児童用と通常用でクラス名切り替え
    const totalClass = fukusuuJidou? 'total2': 'total';
    // 複数児童用と通常用で行のオフセット切り替え
    const ro = fukusuuJidou? 2: 0;
    // 兄弟上限の場合、調整額が入らないのでここで演算する 2022/03/08
    // let tyouseiGaku = e.tyouseiGaku
    // ? e.tyouseiGaku: Math.min(e.ichiwari, parseInt(thisUser.priceLimit));
    
    let tyouseiGaku;
    if (e.isTotalRow) {
      tyouseiGaku = e.tyouseiGaku;
    } else {
      tyouseiGaku = Math.min(e.ichiwari, parseInt(thisUser.priceLimit));
      if (e.empty) tyouseiGaku = '';
    }
    
    return(<>
      {p !== (kDetail.length - 1) && <>
        <div className='bb rb' style={grs(1)}>{num}</div>
        {fukusuuJidou === true && <>
          {/* 保険番号 */}
          <div className='rb' style={grs(2)}>{e.hno}</div>
          {/* 児童氏名 */}
          <div className='rb' style={grs(3)}>
            {comMod.getHiddenName(e.userName, hidePersonalInfo)}
          </div>
        </>}
        <div className='rb' style={grs(2 + ro)}>{jino}</div>
        <div style={{display: 'none'}} className='jinoInt'>{jino}</div>
        <div className='jiName vhcenter bb rb' style={grs(3 + ro)}>{jiname}</div>
        <div style={{display: 'none'}} className='name'>{jiname}</div>
      </>}
      {p === (kDetail.length - 1) && <>
        <div className={totalClass + ' bb rb vhcenter'} style={grs(1)}>合計</div>
      </>}
      <StrToDivs str={e.amount} rs={4 + ro} cs={clms} length={6} right rb />
      <StrToDivs str={
        // 記載を調整額で統一 2021/12/05 
        // e.jiName === 'thisOffice'? e.ichiwari: e.tyouseiGaku
        tyouseiGaku
      } rs={5 + ro} cs={clms} length={6} right rb bb/>
      <StrToDivs str={e.kettei} rs={6 + ro} cs={clms} length={6} right rb />
    </>);
  }
  const Row56 = (props) => {
    const p = props.p;
    const eachBrunch = [...Array(5).keys()].map((e, i)=>{
      return(
        <KyoJiInRow56 p = {p + i} key={i} />
      )
    });
    return (<>
      {fukusuuJidou === true && <>
        <div className='vHead2 rb vhcenter'>利用者負担額集計・調整欄</div>
      </>}
      {fukusuuJidou === false && <>
        <div className='vHead rb vhcenter'>利用者負担額集計・調整欄</div>
      </>}
      <div className='vhcenter rHead bb rb'>項番</div>
      {fukusuuJidou === true && <>
        <div className='vhcenter rHead rb'>受給者証番号</div>
        <div className='vhcenter rHead rb'>児童氏名</div>
      </>}
      <div className='vhcenter rHead rb'>事業所番号</div>
      <div className='vhcenter rHead bb rb'>事業所名称</div>
      <div className='vhcenter rHead rb'>総費用額</div>
      <div className='vhcenter rHead bb rb'>利用者負担額</div>
      <div className='vhcenter rHead rb'>管理結果後利用者負担額</div>
      {eachBrunch}
    </>)
  }

  const parentConfirmation = com?.ext?.reportsSetting?.jogenKanri?.parentConfirmation ?? com?.etc?.configReports?.jogenKanri?.parentConfirmation ?? true;
  const displayName = com?.ext?.reportsSetting?.jogenKanri?.displayName ?? com?.etc?.configReports?.jogenKanri?.displayName ?? false;
  const displayDate = com?.ext?.reportsSetting?.jogenKanri?.displayDate ?? com?.etc?.configReports?.jogenKanri?.displayDate ?? false;
  const displayInn = com?.ext?.reportsSetting?.displayInn ?? com?.etc?.configReports?.displayInn ?? true;
  // const stateDate = comMod.findDeepPath(schedule, ['report', thisUser.service, '上限管理結果票']);
  // const stateDate = reportDateDt?.["上限管理結果票"];
  const stateDate = localStorage.getItem("reportsSettingDate")
    ?JSON.parse(localStorage.getItem("reportsSettingDate"))?.["上限管理結果票"]
    :null;
  let jogenKanriDate = stateDate ?stateDate :comMod.formatDate(new Date(), 'YYYY-MM-DD');
  if(jogenKanriDate.includes("-")){
    const jogenKanriDateList = jogenKanriDate.split("-");
    const exDate = comMod.getDateEx(jogenKanriDateList[0], jogenKanriDateList[1], jogenKanriDateList[2]);
    jogenKanriDate = `${exDate.wr.l}${String(exDate.wr.y).padStart(2, "0")}年${String(exDate.m).padStart(2, '0')}月${String(exDate.d).padStart(2, '0')}日`;
  }
  jogenKanriDate = displayDate ?jogenKanriDate :"令和　　年　　月　　日";

  return(<>
    <div className={`${classes.gridRepotRoot} onePage`}>
      <div className='title'>
        {
          '利用者負担上限額管理結果票' + (fukusuuJidou?'（複数児童用）': '')
        }
      </div>
      <div className='row1'>
        <div className='col1 outerLine'><Row1/></div>
      </div>
      <div className='row2'>
        <div className='col1 outerLine'>
          <Row2Col1/>
        </div>
        <div className='col2 outerLine'>
          <Row2Col2/>
        </div>
      </div>
      <div className='row3 outerLine'><Row3/></div>
      <div className='row4'><Row4/></div>
      <div className='row56 outerLine'><Row56 p={0}/></div>
      <div className='row56 outerLine'><Row56 p={5}/></div>
      {kDetail.length > 10 &&<div className='row56 outerLine'><Row56 p={10}/></div>}
      {parentConfirmation &&<div className='usersSig'>
        <div>上記内容について確認しました。</div>
        <div>{jogenKanriDate}</div>
        <div className='sig' style={{display: 'flex', justifyContent: 'space-between'}}>
          <div>
            支給決定{convJido ?'利用者':'障害者'}等氏名
            <span style={{marginLeft: 8}}>{displayName ?hname :""}</span>
          </div>
          {displayInn &&<div>印</div>}
        </div>
      </div>}
    </div>
    <div className='pageBreak'></div>
  </>)
}

const ReportFutanIchiranOne = (props) => {
  const classes = useStyles();
  const stdDate = useSelector(state=>state.stdDate);
  const schedule = useSelector(state=>state.schedule);
  
  // thisKji はこのコンポーネントで処理を行う管理事業所
  const {
    thisKji, com, service, account, users, masterRec, hidePersonalInfo, reportDateDt
  } = props;
  const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
  console.log('管理事業所ごとの請求情報', thisKji);
  const Title = () => {
    // 受領通知日をストアから取得。未設定だったら基準日から1月後の1日設定
    const tDate = comMod.parseDate(stdDate).date.dt;
    // const nDate = new Date(tDate.getFullYear(), tDate.getMonth() + 1, 15);
    const nDate = new Date();
    const jtInit = comMod.formatDate(nDate, 'YYYY-MM-DD');
    // const jtDate = reportDateDt?.["利用者負担額一覧"] ?? jtInit;
    // const jtDate =
    //   (comMod.findDeepPath(schedule, ['report', service, '利用者負担額一覧'])) ? 
    //   schedule.report[service].利用者負担額一覧 : jtInit;
    const jtDate = localStorage.getItem("reportsSettingDate")
      ?JSON.parse(localStorage.getItem("reportsSettingDate"))?.["利用者負担額一覧表"] ?? jtInit
      :jtInit;

    const gengou = str2gdex(jtDate).wr.l; // 元号
    const wry = str2gdex(jtDate).wr.y; // 和暦の年
    const month = str2gdex(jtDate).m;
    const day = str2gdex(jtDate).d;
    const wrdate = `${gengou}${wry}年${month}月${day}日`;
    return (<>
      <div className='title'>
        利用者負担額一覧表
        <div className='date'>{wrdate}</div>
      
      </div>
    </>)
  }

  const Row1 = () => {
    const sDate = str2gdex(stdDate);
    return(<>
      <div className='row1'>
        <div className='col1'>
          <div>(提供先)</div>
          <div>上限管理事業者</div>
          <div className='jiname'>
            <div className='name vhcenter bname'>{thisKji.name}</div>
            <div className='dono'>殿</div>
            <div className='jinoInt' style={{display: 'none'}}>{thisKji.jino}</div>
          </div>
          <div>下記の通り提供します。</div>
          <div className='month outerLine'>
            <div>{sDate.wr.l}</div>
            <StrToDivs str={sDate.wr.y} length={2} right strPadding='0' />
            <div>年</div>
            <StrToDivs str={sDate.m} length={2} right strPadding='0' />
            <div className='rb'>月分</div>
          </div>
        </div>
        <div className='col2 outerLine'>
          <div className='vHead vhcenter'>事業者</div>
          <div className='rHead'>指定事業所番号</div>
          <StrToDivs str={com.jino} cs={3} length={10} rb />
          <div className='rHead lineheigher vhcenter'>
            住所<br></br>(所在地)
          </div>
          <div className='content vhcenter tall lineheigher rb'>
            {com.city}<br></br>{com.address}
          </div>
          <div className='rHead vhcenter'>電話番号</div>
          <div className='content vhcenter rb'>{com.tel}</div>
          <div className='rHead vhcenter'>名称</div>
          <div className='content vhcenter tall lineheigher rb'>{com.bname}</div>

        </div>
      </div>
    </>)
  }
  const MainGrid = () => {
    
    const DtRow = (thisBdt) => {
      const grStart = (r, v) =>({gridRowStart: r + v});
      const rowSpan = (r, s) => ({gridRow: `${r} / span ${s}`});
      const dtRowCnt = thisBdt.dtRowCnt;
      const rTop = dtRowCnt * 3 + 2; // この行のgridRowStart
      const thisUser = (comMod.getUser(thisBdt.UID, users))?
        comMod.getUser(thisBdt.UID, users): {};
      // ユーザー名 取得できない場合は空白
      // 保護者と利用者の名前を連結する。それぞれ親Componentのstate 
      // hidePersonalInfoによって氏名を伏せ字にする。
      const usersName = (thisBdt.UID)? 
        comMod.getHiddenName(thisUser.pname, hidePersonalInfo) + 
        ' (' + comMod.getHiddenName(thisUser.name, hidePersonalInfo) + ')' : '';
      const lineNo = (thisBdt.UID)? dtRowCnt + 1: '';
      // 兄弟上限の場合、出力する数字がないので作成する
      const ichiwari = Math.floor(parseInt(thisBdt.userSanteiTotal) * 0.1);
      const upperLimit = thisUser.priceLimit
      ? parseInt(thisUser.priceLimit): 0;
      // 多子軽減対策
      // let futan = 0;
      // if (thisBdt.tashikeigen === 2) futan = Math.floor(thisBdt.userSanteiTotal * 0.05);
      // else if (thisBdt.tashikeigen === 3) futan = 0;
      // else futan = ichiwari;
      // 一割相当額をthisBdtから取得する方法に変更
      let futan = (thisBdt.ichiwari || thisBdt.ichiwari===0) ?thisBdt.ichiwari :null
      futan = futan===null ?'' :Math.min(futan, upperLimit);

      return(<>
        <div className='vHead br bb vhcenter' style={rowSpan(rTop, 3)}>
          {lineNo}
        </div>
        <div className='rHead1' style={grStart(rTop, 0)}>市町村番号</div>
        <StrToDivs str={thisBdt.scityNo} rb length={10} rs={rTop + 0} cs={5} />
        <div className='rHead1' style={grStart(rTop, 1)}>受給者証番号</div>
        <StrToDivs str={thisBdt.hno} rb length={10} rs={rTop + 1} cs={5} />
        <div className='rHead2 bb ' style={grStart(rTop, 2)}>氏名</div>
        <div className='name bb rb' style={grStart(rTop, 2)}>
          {usersName}
        </div>
        <div className='mHead' style={grStart(rTop, 0)}>総費用額</div>
        <StrToDivs 
          str={thisBdt.userSanteiTotal} cs={16} rs={rTop} length={6} right 
        />
        <div className='mHead' style={grStart(rTop, 1)}>利用者負担額</div>
        <StrToDivs 
          str={futan} length={6} cs={16} rs={rTop + 1} right 
        />
        <div className='mHead bb' style={grStart(rTop, 2)}></div>
        <StrToDivs str={''} bb length={6} cs={16} rs={rTop + 2} right />
        <div className='serviceLabel bb vhcenter' style={rowSpan(rTop, 3)}>
          提供サービス
        </div>
        {Array(3).fill(null).map((_, i) => {
          const serviceSyubetu = thisBdt?.serviceSyubetu?.[i] ?? "";
          const serviceName = serviceSyubetu ?getSvcNameByCd(serviceSyubetu) :"";
          return(
            <>
            <StrToDivs str={serviceSyubetu} bb={i===2 ?true :false} rs={rTop+i} cs={23} length={2} />
            <div className={`service rb ${i===2 ?"bb" :""}`} style={rowSpan(rTop+i, 1)} >{serviceName}</div>
            </>
          )
        })}
      </>);
    }
    // 処理すべきthisKjiのキー
    const detailKey = Object.keys(thisKji).filter(e=>e.indexOf('UID') === 0);
    // 支給市区町村順にキーをソートしておく
    detailKey.sort((a, b)=>((thisKji[a].scityNo > thisKji[b].scityNo)? 1: -1))
    // 空行を含め10行記述する必要があるため配列長さを10まで伸ばす
    const filler = Array(10).fill('').slice(detailKey.length);
    filler.map(e=>detailKey.push(e));

    const rows = detailKey.map((e, i)=>{
      return(
        <DtRow {...thisKji[e]} key={i} dtRowCnt={i} />
      )
    });
    return(<>
      <div className='mainGrid outerLine'>
        <div className='cHead1 bb'>項番</div>
        <div className='cHead2 bb rb'>支給決定{convJido ?'利用者':'障害者'}等欄</div>
        {rows}
      </div>
    </>)
  }
  
  return (<>
    <div className={`${classes.gridReportFtnRoot} onePage`}>
      <Title />
      <Row1 />
      <MainGrid />
    </div>
    <div className='pageBreak'></div>
  </>)
}

const hoge = (
  <span>
    <input id="hoge" />
    <label>ラベル</label>
  </span>
)

  const getKyoudaiKyouryokuAmount = (e, billingDt, users, stdDate) => {
    let amount = 0;
    if (stdDate < '2025-11-01') return 0;
    const brothers = comMod.getBrothers(e.UID, users, true);
    brothers.forEach(bro => {
      const broDt = billingDt.find(dt => dt.UID === 'UID' + bro.uid);
      if (broDt && broDt.協力事業所) {
        broDt.協力事業所.forEach(kj => {
          if (kj.amount) amount += parseInt(kj.amount);
        });
      }
    });
    return amount;
  };

const ReportKanriKekka = (props) => {
  const {
    billingDt, com, service, account, users, masterRec, preview, userList,
    hidePersonalInfo, reportDateDt
  } = props.props;
  const warningUserNames = [];
  const stdDate = useSelector(state => state.stdDate);
  const pages = billingDt.map((e, i)=>{
    const thisUser = comMod.getUser(e.UID, users);
    if(!thisUser.name.includes(" ")) warningUserNames.push(thisUser.name);
    // ユーザーリストになかったらスキップ
    if (!userList.find(f => f.uid === thisUser.uid)) return null;
    // ユーザーリストによるスキップ
    if (!userList.find(f => f.uid === thisUser.uid).checked) return null;
    const kyoudaiKyouryokuAmount = getKyoudaiKyouryokuAmount(e, billingDt, users, stdDate);
    // 単位が全く無い場合はスキップ
    if (!(e.tanniTotal + kyoudaiKyouryokuAmount))  return false;
    else{
      const rpprmas = {
        thisBdt: e, com, service, account, thisUser, masterRec, preview,
        billingDt, hidePersonalInfo, reportDateDt
      };
      return (
        <ReportKanriKekkaOne props={rpprmas} key={i}/>
      )  
    }
  });
  const warningMsg = "利用者名が正しく設定されていることを確認してください。\n以下の利用者には「個人情報を隠す」が機能していません。";
  return (
    <>
    <ReportWarningWrapper userNames={warningUserNames} warningMsg={warningMsg}/>
    {pages}
    </>
  )
}

const ReportFutanIchiran = (props) => {
  const {
    ftnDt, com, service, account, users, masterRec, hidePersonalInfo, reportDateDt
  } = props;
  const warningUserNames = [];
  const kyouryokuWarningUserNames = users.reduce((result, uDt) => {
    if(uDt.kanri_type === "協力事業所"){
      const etc = uDt.etc ?uDt.etc :{};
      const kanriList = etc["管理事業所"] ?etc["管理事業所"] :[];
      if(!kanriList.some(dt => dt.name && dt.no)){
        result.push(uDt.name);
      }
    }
    return result;
  }, []);
  const pages = Object.keys(ftnDt).map((e, i)=>{
    Object.keys(ftnDt[e]).forEach(uidStr => {
      const thisUser = (comMod.getUser(uidStr, users)) ?comMod.getUser(uidStr, users) :{};
      if(thisUser.name && !thisUser.name.includes(" ")) warningUserNames.push(thisUser.name);
    })
    const prms={
      thisKji: ftnDt[e], com, service, account, users, masterRec, 
      hidePersonalInfo, reportDateDt
    }
    return (
      <ReportFutanIchiranOne {...prms} key={i}/>
    )
  });
  const warningMsg = kyouryokuWarningUserNames.length
    ?"以下の利用者には管理事業所情報が登録されていません。"
    :"利用者名が正しく設定されていることを確認してください。\n以下の利用者には「個人情報を隠す」が機能していません。"
  return(
    <>
    <ReportWarningWrapper userNames={kyouryokuWarningUserNames || warningUserNames} warningMsg={warningMsg} />
    {pages}
    </>
  )
}

const ReportJougenKanri = (props) => {
  const {userList, preview, hidePersonalInfo, selects, reportDateDt,  ...others} = props;
  const stdDate = useSelector(state => state.stdDate);
  const schedule = useSelector(state => state.schedule);
  const users = useSelector(state => state.users);
  const com = useSelector(state => state.com);
  const service = useSelector(state => state.service);
  const account = useSelector(state => state.account);
  const serviceItems = useSelector(state => state.serviceItems);
  const classroom = useSelector(state => state.classroom);
  const allState = useSelector(state=>state);
  const thisTitle = albCM.getReportTitle(allState, preview);

  const nameList = ['上限管理結果票', '利用者負担額一覧表'];

  // リストにないプレビューが送られてきたら何もしないで終了
  if (nameList.indexOf(preview) < 0)  return null;
  //上限管理結果票かつ国の標準形式の時以外は表示
  if(preview==="上限管理結果票" && selects[preview]!=="国の標準形式") return null;
  if(preview==="利用者負担額一覧表" && selects[preview]!=="国の標準形式") return null;
  // serviceが全表示以外の場合は表示しない
  if(serviceItems.length > 1 && service !== "") return(
    <div style={
      {
        marginTop: 100, textAlign: 'center', paddingRight: 64, color: red[800],
        fontWeight: 600, fontSize: '1.2rem',
      }}
    >
      サービス種別を全表示に切り替えて下さい
      <ChangeServiceAll />
    </div>
  )
  if (classroom){
    return (
      <div style={
        {
          marginTop: 100, textAlign: 'center', paddingRight: 64, color: red[800],
          fontWeight: 600, fontSize: '1.2rem',
        }}
      >
        単位設定を解除して下さい
        <ChangeClassroomAll />
      </div>
    )
  }
  const bdprms = { 
    stdDate, schedule, users, com, service, serviceItems, 
    useAdjustetUpperLimit: false,
  };
  bdprms.calledBy = 'ReportJougenKanri';
  // calledBy対応済み
  const { billingDt, masterRec } = setBillInfoToSch(bdprms);
  // 管理事業所番号をキーにしてbillingDtを再編成
  const ftnDt = {}; // 負担一覧用データ
  billingDt.map(e=>{
    // ユーザー選択ボックスにある該当ユーザーのアイテム
    const userlistItem = userList.find(f=>albCM.convUid(f.uid).s === e.UID);
    if (!userlistItem) return false;
    if (!userlistItem.checked) return false;
    if (e.jougenJi && e.kanriType === '協力事業所'){
      const key = e.jougenJi;
      const pre = (ftnDt[key])? ftnDt[key]: {};
      const f = {...e};
      ftnDt[key] = {...pre, [e.UID]:f}
      ftnDt[key].name = e.jougenJiName;
      ftnDt[key].jino = e.jougenJi;
    }
  });
  console.log('ftnDt', ftnDt);
  const futanIchiranPrams = {
    ftnDt, com, service, account, users, masterRec, hidePersonalInfo, schedule, reportDateDt
  };
  const jougenPrms = {
    billingDt, com, service, account, users, masterRec, preview, userList,
    hidePersonalInfo, reportDateDt
  };
  if (preview === '上限管理結果票'){
    return (
      <ReportKanriKekka props={jougenPrms} />
    )  
  }
  else if (preview === '利用者負担額一覧表'){
    return (
      <ReportFutanIchiran {...futanIchiranPrams} />
    )
  }
  else {
    return (
      <div style={{margin:120}}>表示するデータが見つかりませんでした。</div>
    )
  }
}
export default ReportJougenKanri;