import React from 'react';
import { makeStyles } from "@material-ui/core"
import { useSelector } from "react-redux";
import { formatDate, getBrothers, getDateEx, getHiddenName, getLodingStatus, randomStr } from "../../commonModule";
import { LoadingSpinner } from "../common/commonParts";
import { setBillInfoToSch } from '../Billing/blMakeData';

const NOMAL_COLS = 4;
const SIBLING_COLS = 9;

const NOMAL_CELL_SIZE = 16;
const NOMAL_BORDER = '1px solid';
const BOLD_BORDER = "2px solid";
export const KOBE_REPORT_STYLES = {
  entireTable: {
    width: '100%', padding: 32,
    '&:not(:last-child)': {marginBottom: 256, pageBreakAfter: 'always',},
    '& .pageTitle': {textAlign: 'center', fontSize: 26, marginBottom: 32},
    '& table': {
      textAlign: 'center',
      border: BOLD_BORDER, borderCollapse: 'collapse',
      '& th, td': {
        padding: 8,
        border: NOMAL_BORDER
      },
      '& th': {
        fontWeight: 'initial', fontSize: '.8rem',
      },
      '& td': {
        width: 8
      },
      '& .num': {
        textAlign: 'right'
      },
      '& .lines1': {height: NOMAL_CELL_SIZE},
      '& .lines2': {height: NOMAL_CELL_SIZE * 2},
      '& .lines3': {height: NOMAL_CELL_SIZE * 3},
      '& .lines4': {height: NOMAL_CELL_SIZE * 4},
      '& .lines5': {height: NOMAL_CELL_SIZE * 5},
    },
    '& .border': {border: NOMAL_BORDER},
    '& .borderTop': {borderTop: NOMAL_BORDER},
    '& .borderBottom': {borderBottom: NOMAL_BORDER},
    '& .borderRight': {borderRight: NOMAL_BORDER},
    '& .borderLeft': {borderLeft: NOMAL_BORDER},
    '& .boldBorder': {border: BOLD_BORDER},
    '& .boldBorderTop': {borderTop: BOLD_BORDER},
    '& .boldBorderBottom': {borderBottom: BOLD_BORDER},
    '& .boldBorderRight': {borderRight: BOLD_BORDER},
    '& .boldBorderLeft': {borderLeft: BOLD_BORDER},
    '& .noneBorder': {border: 'none'},
    '& .noneBorderTop': {borderTop: 'none'},
    '& .noneBorderBottom': {borderBottom: 'none'},
    '& .noneBorderRight': {borderRight: 'none'},
    '& .noneBorderLeft': {borderBottom: 'none'},
    '& .infoTables': {
      display: 'flex', justifyContent: 'space-between',
      marginBottom: 32
    },
  },
  kanriKekkaTable: {
    border: 'none', width: '100%', marginBottom: 32,
    '& .description': {
      '& td': {
        borderLeft: BOLD_BORDER, borderRight: BOLD_BORDER,
        borderTop: 'none', borderBottom: 'none'
      },
      '&:first-child td': {borderTop: BOLD_BORDER},
      '&:last-child td': {borderBottom: BOLD_BORDER}
    }
  },
  amountPerJigyosyoTable: {
    width: '100%',
    '& td': {
      width: '12px!important',
      padding: "6px!important"
    },
  },
  kobeAmountTable: {
    width: '100%', marginBottom: 128,
    '& td': {
      width: '12px!important',
      padding: "6px!important"
    },
  },
  confirmationForm: {
    width: '50%',
    margin: '0 0 0 auto',
    '&>div': {
      '&:not(:last-child)': {marginBottom: 16}
    },
    '& .year, .month, .date': {
      width: '2rem', textAlign: 'end'
    },
    '& .pname': {marginLeft: 16}
  },
  siblingUserInfoTable: {
    border: 'none'
  },
  siblingAmountPerJigyosyoTable: {
    width: '100%',
    '& td': {
      padding: '6px !important'
    },
    '& .mainHeaderItem': {width: 16, padding: 0},
    '& .headerItem': {width: '6rem'},
    '& .bodyItem': {width: '6.5rem'},
  }
}
const useStyles = makeStyles(KOBE_REPORT_STYLES);

export const makeAnyNumberOfElements = (argumentObj) => {
  const {
    string="", elementsLength=1, colSpan=1, rowSpan=1,
    className="", firstChildClassName="", lastChildClassName="",
    style={}, firstChildStyle={}, lastChildStyle={}, elementKey=null
  } = argumentObj;
  const key = elementKey ?elementKey :randomStr(6);
  const nodes = [...string].map((str, index) => {
    let addStyle = {};
    let marginedClassName = className;
    if(index === 0){
      addStyle = firstChildStyle;
      if(firstChildClassName) marginedClassName += " "+firstChildClassName;
    }
    if(index+1 === string.length){
      addStyle = lastChildStyle;
      if(lastChildClassName) marginedClassName += " "+lastChildClassName;
    }

    return(
      <td colSpan={colSpan} rowSpan={rowSpan} key={key+(index+1)}
        className={marginedClassName}
        style={{...style, ...addStyle}}
      >
        {str}
      </td>
    )
  });
  let keyIndex = 10;
  while(nodes.length < elementsLength){
    keyIndex++;
    let addStyle = {};
    let marginedClassName = className;
    if(nodes.length === 0){
      addStyle = lastChildStyle;
      if(lastChildClassName) marginedClassName += " "+lastChildClassName;
    }
    if(nodes.length+1 === elementsLength){
      addStyle = firstChildStyle;
      if(firstChildClassName) marginedClassName += " "+firstChildClassName;
    }

    nodes.unshift(
      <td colSpan={colSpan} rowSpan={rowSpan} key={key+keyIndex}
        className={marginedClassName}
        style={{...style, ...addStyle}}
      />
    )
  }

  return nodes
}

export const DateTable = (props) => {
  const classes = useStyles();
  const {stdDate, style={}} = props;
  const stdDateParts = stdDate.split("-").map(d => parseInt(d));
  const dateEx = getDateEx(stdDateParts[0], stdDateParts[1], 1);
  const wareki = dateEx.wr.l;
  const warekiYear = String(dateEx.wr.y).padStart(2, "0");
  const month = String(dateEx.m).padStart(2, "0");

  const numStyles = {width: NOMAL_CELL_SIZE}
  return(
    <table style={{margin: '0 0 32px auto', ...style}}>
      <tbody>
        <tr>
          <td className='lines1' style={{width: 32}}>{wareki}</td>
          <td className='lines1' style={numStyles}>{warekiYear[0]}</td>
          <td className='lines1' style={numStyles}>{warekiYear[1]}</td>
          <td className='lines1' style={numStyles}>年</td>
          <td className='lines1' style={numStyles}>{month[0]}</td>
          <td className='lines1' style={numStyles}>{month[1]}</td>
          <td className='lines1' style={{width: 32}} >月分</td>
        </tr>
      </tbody>
    </table>
  )
}

const UserInfoTable = (props) => {
  const classes = useStyles();
  const {user, hidePersonalInfo} = props;

  const cityNumNodes = [...user.scity_no].map((num, index) => (<td key={`cityNum${index+1}`} className='lines1'>{num}</td>));
  const hNumNodes = [...user.hno].map((num, index) => (<td key={`hNum${index+1}`} className='lines2'>{num}</td>));

  return(
    <table className={classes.userInfoTable}>
      <tbody>
        <tr>
          <th className='lines1'>市町村番号</th>
          {cityNumNodes}
        </tr>
        <tr>
          <th className='lines2'>受給者証番号</th>
          {hNumNodes}
        </tr>
        <tr>
          <th className='noneBorderBottom'>給付決定保護者等</th>
          <td className='lines2' rowSpan="2" colSpan="10">{getHiddenName(user.pname, hidePersonalInfo)}</td>
        </tr>
        <tr>
          <th className='noneBorderTop'>氏名</th>
        </tr>
        <tr>
          <th className='noneBorderBottom'>支給決定に係る児童</th>
          <td className='lines2' rowSpan="2" colSpan="10">{getHiddenName(user.name, hidePersonalInfo)}</td>
        </tr>
        <tr>
          <th className='noneBorderTop'>氏名</th>
        </tr>
      </tbody>
    </table>
  )
}

const SiblingUserInfoTable = (props) => {
  const classes = useStyles();
  const {siblingUsers, hidePersonalInfo, convJido} = props;

  const cityNum = siblingUsers.reduce((resutl, user) => {
    if(!resutl) return user.scity_no;
    return resutl === user.scity_no ?resutl :"問題発生";
  }, null);
  const cityNumNodes = makeAnyNumberOfElements({
    string: String(cityNum), elementsLength: 6, className: 'boldBorderTop', lastChildClassName: 'boldBorderRight'
  });
  const cityNumLength = cityNumNodes.length;
  const pname = siblingUsers.reduce((resutl, user) => {
    if(!resutl) return user.pname;
    return resutl === user.pname ?resutl :"問題発生";
  }, null);
  const userNodes = Array(4).fill(null).map((_, i) => {
    const user = siblingUsers[i] ?? {};
    //受給者番号
    const hno = user?.hno ?? "";
    //氏名
    const name = user?.name ?? "";
    //神戸独自補助上限金額
    const kobeUpperLimit = String(user?.etc?.dokujiJougen ?? "");
    
    const lastRowClassName = i+1 === 4 ?"boldBorderBottom" :"";
    const hogeStyle = {padding: '6px'}
    return(
      <tr>
        <th className={lastRowClassName} style={hogeStyle}>{i+1}</th>
        <td className={lastRowClassName} style={hogeStyle}>{hno}</td>
        <td className={lastRowClassName} colSpan={cityNumLength} style={hogeStyle}>{getHiddenName(name, hidePersonalInfo)}</td>
        <td className={`${lastRowClassName} boldBorderRight`} style={hogeStyle}>{kobeUpperLimit}</td>
      </tr>
    )
  });

  return(
    <table className={classes.siblingUserInfoTable} style={{border: 'none'}}>
      <tbody>
        <tr>
          <th colSpan="3" className='lines1 boldBorderTop boldBorderLeft'>
            市町村番号
          </th>
          {cityNumNodes}
          <td className='noneBorder' />
        </tr>
        <tr>
          <th colSpan="3" className='boldBorderLeft boldBorderBottom'>支給決定保護者氏名</th>
          <td colSpan={cityNumLength} className='boldBorderRight boldBorderBottom'>{getHiddenName(pname, hidePersonalInfo)}</td>
          <td className='noneBorder'/>
        </tr>
        <tr>
          <th rowSpan="6" className='boldBorderLeft boldBorderBottom' style={{width: 16}}>対象{convJido ?"児童" :"障害児"}</th>
          <th colSpan="2" rowSpan="2" style={{width: '8rem'}}>受給者証番号</th>
          <th colSpan={cityNumLength} rowSpan="2">{convJido ?"児童" :"障害児"}氏名</th>
          <th
            className='noneBorderBottom boldBorderTop boldBorderRight'
            style={{width: '8rem', paddingBottom: 2}}
          >
            利用者負担上限月額
          </th>
        </tr>
        <tr>
          <th className='noneBorderTop boldBorderRight' style={{paddingTop: 2}}>（神戸市/福祉部分）</th>
        </tr>
        {userNodes}
      </tbody>
    </table>
  )
}

const OfficeInfoTable = (props) => {
  const classes = useStyles();
  const {com} = props;

  const cellStyles = {width: NOMAL_CELL_SIZE}
  const jigyosyoNumNodes = [...com.jino].map((num, index) => (<td key={`jNum${index+1}`} className='lines1' style={cellStyles}>{num}</td>));

  return(
    <table>
      <tbody>
        <tr>
          <th className='lines1' rowSpan="2" style={{width: 18}}>管理事業所</th>
          <th className='lines1' style={{width: '7rem'}}>指定事業所番号</th>
          {jigyosyoNumNodes}
        </tr>
        <tr>
          <th>事業所及びその事業者の名称</th>
          <td colSpan="10">{com.bname}</td>
        </tr>
      </tbody>
    </table>
  )
}

const SiblingOfficeInfoTable = (props) => {
  const classes = useStyles();
  const {com} = props;

  return(
    <table>
      <tbody>
        <tr>
          <th className='lines1' rowSpan="2" style={{width: 18}}>管理事業所</th>
          <th className='lines1' style={{width: '7rem'}}>指定事業所番号</th>
          <td style={{width: '14rem'}}>{com.jino}</td>
        </tr>
        <tr>
          <th>事業所及びその事業者の名称</th>
          <td>{com.bname}</td>
        </tr>
      </tbody>
    </table>
  )
}

const UpperLimitAmountTable = (props) => {
  const classes = useStyles();
  const {billingDt, user} = props;

  const upperLimit = String(billingDt?.upperlimit ?? "");
  const upperLimitNodes = makeAnyNumberOfElements({string: upperLimit, elementsLength: 5, key: "upperLimit"})

  const kobeUpperLimit = String(user?.etc?.dokujiJougen ?? "");
  const kobeUpperLimitNodes = makeAnyNumberOfElements({string: kobeUpperLimit, elementsLength: 5, key: "kobeUpperLimit"});

  return(
    <table style={{marginBottom: 32}}>
      <tbody>
        <tr>
          <th>利用者負担上限月額</th>
          {upperLimitNodes}
          <th>利用者負担上限月額（神戸市/給付費部分）</th>
          {kobeUpperLimitNodes}
        </tr>
      </tbody>
    </table>
  )
}

const SiblingUpperLimitAmountTable = (props) => {
  const classes = useStyles();
  const {billingDts, siblingUsers} = props;

  const upperLimit = siblingUsers.reduce((result, user) => {
    const upperLimit = user.priceLimit;
    if(!result && upperLimit) result = upperLimit;
    if(result !== upperLimit) result = "問題発生";
    return result
  }, "");

  return(
    <table style={{marginBottom: 24}}>
      <tbody>
        <tr>
          <th style={{width: '11rem'}}>利用者負担上限月額</th>
          <td style={{width: '5rem'}}>{upperLimit}</td>
        </tr>
      </tbody>
    </table>
  )
}

const KanriKekkaTable = (props) => {
  const classes = useStyles();
  const {billingDt, style={}} = props;

  const tableStyles = {
    border: 'none', width: '100%', marginBottom: 32,
  }
  const discriptionStyles = {
    textAlign: 'start', width: 616, margin: '0 auto'
  }
  const numStyles = {marginRight: 8}
  return(
    <table className='noneBorder' style={{...tableStyles, ...style}}>
      <tbody>
        <tr>
          <th className='boldBorderTop boldBorderLeft'>利用者負担上限額管理結果</th>
          <td className='boldBorderTop boldBorderRight' style={{width: 32}}>{billingDt?.kanriKekka ?? ""}</td>
          <td className='noneBorder' style={{width: '65%'}}></td>
        </tr>
        <tr>
          <td colSpan='3'
            className='discription boldBorderTop boldBorderRight boldBorderLeft noneBorderBottom'
            style={{paddingTop: 24}}
          >
            <div style={discriptionStyles}>
              <span style={numStyles}>1</span>管理事業所で利用者負担額を充当したため、他事業所の利用者負担は発生しない。
            </div>
          </td>
        </tr>
        <tr>
          <td colSpan='3'
            className='discription boldBorderRight boldBorderLeft noneBorderTop noneBorderBottom'
          >
            <div style={discriptionStyles}>
              <span style={numStyles}>2</span>利用者負担額の合算額が、負担上限月額以下のため、調整事務は行わない。
            </div>
          </td>
        </tr>
        <tr>
          <td colSpan='3'
            className='discription boldBorderBottom boldBorderRight boldBorderLeft noneBorderTop'
            style={{paddingBottom: 24}}
          >
            <div style={discriptionStyles}>
              <span style={numStyles}>3</span>利用者負担額の合算額が、負担上限月額を超過するため、下記のとおり調整した。
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

const makeSiblingAmountPerJigyosyoNode = (bDt, userDt, com, i, hidePersonalInfo) => {
  const result = {};

  //受給者番号
  const hno = bDt.hno ?? "";
  result.hno = (<td key={`hno${i+1}`} className='boldBorderRight'>{String(hno)}</td>);
  //利用者名
  const userName = getHiddenName(bDt.userName ?? "", hidePersonalInfo);
  result.userName = (<td key={`userName${i+1}`} className='boldBorderRight'>{String(userName)}</td>);
  //事業所番号
  let jigyosyoNum = bDt?.no ?? "";
  if(jigyosyoNum === "0") jigyosyoNum = com?.jino ?? "";
  result.jigyosyoNum = (<td key={`jigyosyoNum${i+1}`} className='boldBorderRight'>{String(jigyosyoNum)}</td>);
  //事業所名
  let jigyosyoName = bDt?.lname ?bDt.lname :bDt?.name ?? "";
  if(jigyosyoName === "thisOffice") jigyosyoName = com?.bname ?? "";
  result.jigyosyoName = (<td key={`jigyosyoName${i+1}`} className='boldBorderRight'>{String(jigyosyoName)}</td>);
  //総費用額
  const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
  result.amount = (<td key={`amount${i+1}`} className='boldBorderRight num'>{amount.toLocaleString()}</td>);
  //利用者負担額
  let riyousyahutan = bDt.tyouseiGaku ?? Math.min(bDt.ichiwari, parseInt(userDt.priceLimit));
  riyousyahutan = isNaN(riyousyahutan)? '': riyousyahutan;
  result.riyousyahutan = (<td key={`riyousyahutan${i+1}`} className='boldBorderRight num'>{riyousyahutan.toLocaleString()}</td>);
  //給付費
  const kyuhuhi = amount===0 ?"0" :amount && (riyousyahutan===0 || riyousyahutan) ?amount - riyousyahutan :"";
  result.kyuhuhi = (<td key={`kyuhuhi${i+1}`} className='boldBorderRight num'>{kyuhuhi.toLocaleString()}</td>);
  //（管理結果）利用者負担額
  const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";
  result.kanriRiyosyahutan = (<td key={`kanriRiyosyahutan${i+1}`} className='boldBorderRight num'>{kanriRiyosyahutan.toLocaleString()}</td>);
  //（管理結果）給付費
  const kanriKyuhu = amount===0 ?"0" :amount && (kanriRiyosyahutan===0 || kanriRiyosyahutan) ?amount - kanriRiyosyahutan :"";
  result.kanriKyuhu = (<td key={`kanriKyuhu${i+1}`} className='boldBorderRight num'>{kanriKyuhu.toLocaleString()}</td>);
  //神戸独自補助
  const kobeHojo = !isNaN(parseInt(bDt?.dokujiHojo)) ?parseInt(bDt?.dokujiHojo) : "";
  result.kobeHojo = (<td key={`kobeHojo${i+1}`} className='boldBorderRight num'>{kobeHojo.toLocaleString()}</td>);
  //神戸利用者負担額
  const kobeRiyosyahutan = (kanriRiyosyahutan || kanriRiyosyahutan===0) && (kobeHojo===0 || kobeHojo) ?kanriRiyosyahutan===0 ?0 :kanriRiyosyahutan - kobeHojo :"";
  result.kobeRiyosyahutan = (<td key={`kobeRiyosyahutan${i+1}`} className='boldBorderRight num'>{kobeRiyosyahutan.toLocaleString()}</td>);

  return result;
}

const AmountPerJigyosyoTable1 = (props) => {
  const com = useSelector(state => state.com);
  const classes = useStyles();
  const {billingDt, user, pageIndex, hidePersonalInfo} = props;
  const allBillingDts = billingDt?.["協力事業所"] ?? [];
  const nodes = Array(5).fill(null).map((_, i) => {
    const bDt = allBillingDts[i+SIBLING_COLS*(pageIndex-1)] ?? {};
    return makeSiblingAmountPerJigyosyoNode(bDt, user, com, i, hidePersonalInfo);
  });

  return(
    <table className={classes.siblingAmountPerJigyosyoTable} style={{marginBottom: 16}}>
      <tbody>
        <tr>
          <th rowSpan="8" className='mainHeaderItem boldBorder' style={{writingMode: 'tb'}}>利用者負担額集計・調整欄（神戸市独自減免前）</th>
          <th className='headerItem boldBorder'>項番</th>
          <td className='bodyItem boldBorder'>1</td>
          <td className='bodyItem boldBorder'>2</td>
          <td className='bodyItem boldBorder'>3</td>
          <td className='bodyItem boldBorder'>4</td>
          <td className='bodyItem boldBorder'>5</td>
        </tr>
        <tr>
          <th className='boldBorderRight'>受給者番号</th>
          {nodes.map(node => node.hno)}
        </tr>
        <tr>
          <th className='boldBorderRight'>対象児氏名</th>
          {nodes.map(node => node.userName)}
        </tr>
        <tr>
          <th className='boldBorderRight'>事業所番号</th>
          {nodes.map(node => node.jigyosyoNum)}
        </tr>
        <tr>
          <th className='lines3 boldBorderRight'>事業所名称</th>
          {nodes.map(node => node.jigyosyoName)}
        </tr>
        <tr>
          <th className='boldBorderRight'>総費用額</th>
          {nodes.map(node => node.amount)}
        </tr>
        <tr>
          <th className='boldBorderRight'>利用者負担額</th>
          {nodes.map(node => node.riyousyahutan)}
        </tr>
        <tr>
          <th className='boldBorderRight'>上限管理後<br />利用者負担額</th>
          {nodes.map(node => node.kanriRiyosyahutan)}
        </tr>
        <tr>
          <th rowSpan="2" className='mainHeaderItem boldBorder' style={{writingMode: 'tb'}}>神戸市独自減免</th>
          <th className='boldBorderTop boldBorderRight'>神戸市独自減免</th>
          {nodes.map(node => node.kobeHojo)}
        </tr>
        <tr>
          <th className='boldBorderRight' style={{padding: '8px 0'}}>
            上限管理後利用者負担額<br />（神戸市/給付費部分）
          </th>
          {nodes.map(node => node.kobeRiyosyahutan)}
        </tr>
      </tbody>
    </table>
  )
}

const AmountPerJigyosyoTable2 = (props) => {
  const com = useSelector(state => state.com);
  const classes = useStyles();
  const {billingDt, user, maxPageIndex, pageIndex, hidePersonalInfo} = props;
  const allBillingDts = billingDt?.["協力事業所"] ?? [];
  const nodes = Array(4).fill(null).map((_, i) => {
    const bDt = allBillingDts[5+i+SIBLING_COLS*(pageIndex-1)] ?? {};
    return makeSiblingAmountPerJigyosyoNode(bDt, user, com, i, hidePersonalInfo);
  });
  const totalNode = allBillingDts.reduce((result, bDt, index) => {
    if(pageIndex !== maxPageIndex) return result;
    const userDt = user;
    //総費用額
    const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
    if(amount || amount===0) result.amount = result.amount ?result.amount + amount :amount;
    //利用者負担額
    let riyousyahutan = bDt.tyouseiGaku !== undefined
    ? bDt.tyouseiGaku: Math.min(bDt.ichiwari, parseInt(userDt.priceLimit));
    riyousyahutan = isNaN(riyousyahutan)? '': riyousyahutan;
    if(riyousyahutan || riyousyahutan===0) result.riyousyahutan = result.riyousyahutan ?result.riyousyahutan + riyousyahutan :riyousyahutan;
    //給付費
    const kyuhuhi = amount===0 ?"0" :amount && (riyousyahutan===0 || riyousyahutan) ?amount - riyousyahutan :"";
    if(kyuhuhi || kyuhuhi===0) result.kyuhuhi = result.kyuhuhi ?result.kyuhuhi + kyuhuhi :kyuhuhi;
    //（管理結果）利用者負担額
    const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";
    if(kanriRiyosyahutan || kanriRiyosyahutan===0) result.kanriRiyosyahutan = result.kanriRiyosyahutan ?result.kanriRiyosyahutan + kanriRiyosyahutan :kanriRiyosyahutan;
    //（管理結果）給付費
    const kanriKyuhu = amount===0 ?"0" :amount && (kanriRiyosyahutan===0 || kanriRiyosyahutan) ?amount - kanriRiyosyahutan :"";
    if(kanriKyuhu || kanriKyuhu===0) result.kanriKyuhu = result.kanriKyuhu ?result.kanriKyuhu + kanriKyuhu :kanriKyuhu;
    //神戸独自補助
    const kobeHojo = !isNaN(parseInt(bDt?.dokujiHojo)) ?parseInt(bDt?.dokujiHojo) : "";
    if(kobeHojo || kobeHojo===0) result.kobeHojo = result.kobeHojo ?result.kobeHojo + kobeHojo :kobeHojo;
    //神戸利用者負担額
    const kobeRiyosyahutan = (kanriRiyosyahutan || kanriRiyosyahutan===0) && (kobeHojo===0 || kobeHojo) ?kanriRiyosyahutan===0 ?0 :kanriRiyosyahutan - kobeHojo :"";
    if(kobeRiyosyahutan || kobeRiyosyahutan===0) result.kobeRiyosyahutan = result.kobeRiyosyahutan ?result.kobeRiyosyahutan + kobeRiyosyahutan :kobeRiyosyahutan;

    if(allBillingDts.length === index+1){
      //合計した値をnode化
      result.amount = (<td key={`amount${index+1}`} className='boldBorderRight num'>{result.amount.toLocaleString()}</td>);
      result.kyuhu = (<td key={`kyuhu${index+1}`} className='boldBorderRight num'>{result.kyuhuhi.toLocaleString()}</td>);
      result.riyousyahutan = (<td key={`riyousyahutan${index+1}`} className='boldBorderRight num'>{result.riyousyahutan.toLocaleString()}</td>);
      result.kanriRiyosyahutan = (<td key={`kanriRiyosyahutan${index+1}`} className='boldBorderRight num'>{result.kanriRiyosyahutan.toLocaleString()}</td>);
      result.kanriKyuhu = (<td key={`kanriKyuhu${index+1}`} className='boldBorderRight num'>{result.kanriKyuhu.toLocaleString()}</td>);
      result.kobeHojo = (<td key={`kobeHojo${index+1}`} className='boldBorderRight num'>{result.kobeHojo.toLocaleString()}</td>);
      result.kobeRiyosyahutan = (<td key={`kobeRiyosyahutan${index+1}`} className='boldBorderRight num'>{result.kobeRiyosyahutan.toLocaleString()}</td>);
    }
    
    return result;
  }, {amount: "", riyousyahutan: "", kyuhuhi: "", kanriRiyosyahutan: "", kanriKyuhu: "", kobeHojo: "", kobeRiyosyahutan: ""});
  if(!allBillingDts.length || pageIndex !== maxPageIndex){
    totalNode.amount = (<td key={`amount`} className='boldBorderRight' />);
    totalNode.kyuhu = (<td key={`kyuhu`} className='boldBorderRight' />);
    totalNode.riyousyahutan = (<td key={`riyousyahutan`} className='boldBorderRight' />);
    totalNode.kanriRiyosyahutan = (<td key={`kanriRiyosyahutan`} className='boldBorderRight' />);
    totalNode.kanriKyuhu = (<td key={`kanriKyuhu`} className='boldBorderRight' />);
    totalNode.kobeHojo = (<td key={`kobeHojo`} className='boldBorderRight' />);
    totalNode.kobeRiyosyahutan = (<td key={`kobeRiyosyahutan`} className='boldBorderRight' />);
  }

  return(
    <table className={classes.siblingAmountPerJigyosyoTable} style={{marginBottom: 24}}>
      <tbody>
        <tr>
          <th rowSpan="8" className='mainHeaderItem boldBorder' style={{writingMode: 'tb'}}>利用者負担額集計・調整欄（神戸市独自減免前）</th>
          <th className='headerItem boldBorder'>項番</th>
          <td className='bodyItem boldBorder'>6</td>
          <td className='bodyItem boldBorder'>7</td>
          <td className='bodyItem boldBorder'>8</td>
          <td className='bodyItem boldBorder'>9</td>
          <td rowSpan="5" className='bodyItem boldBorder'>合計</td>
        </tr>
        <tr>
          <th className='boldBorderRight'>受給者番号</th>
          {nodes.map(node => node.hno)}
        </tr>
        <tr>
          <th className='boldBorderRight'>対象児氏名</th>
          {nodes.map(node => node.userName)}
        </tr>
        <tr>
          <th className='boldBorderRight'>事業所番号</th>
          {nodes.map(node => node.jigyosyoNum)}
        </tr>
        <tr>
          <th className='lines3 boldBorderRight'>事業所名称</th>
          {nodes.map(node => node.jigyosyoName)}
        </tr>
        <tr>
          <th className='boldBorderRight'>総費用額</th>
          {nodes.map(node => node.amount)}
          {totalNode.amount}
        </tr>
        <tr>
          <th className='boldBorderRight'>利用者負担額</th>
          {nodes.map(node => node.riyousyahutan)}
          {totalNode.riyousyahutan}
        </tr>
        <tr>
          <th className='boldBorderRight'>上限管理後<br />利用者負担額</th>
          {nodes.map(node => node.kanriRiyosyahutan)}
          {totalNode.kanriRiyosyahutan}
        </tr>
        <tr>
          <th rowSpan="2" className='mainHeaderItem boldBorder' style={{writingMode: 'tb'}}>神戸市独自減免</th>
          <th className='boldBorderTop boldBorderRight'>神戸市独自減免</th>
          {nodes.map(node => node.kobeHojo)}
          {totalNode.kobeHojo}
        </tr>
        <tr>
          <th className='boldBorderRight' style={{padding: '8px 0'}}>
            上限管理後利用者負担額<br />（神戸市/給付費部分）
          </th>
          {nodes.map(node => node.kobeRiyosyahutan)}
          {totalNode.kobeRiyosyahutan}
        </tr>
      </tbody>
    </table>
  )
}

const summarizeSiblingBillingDts = (siblingBillingDts, siblingUsers) => {
  const result = [];
  const eldestSibling = siblingUsers.find(user => user.brosIndex==1);
  if(!eldestSibling) return false;
  const eldestSiblingBillingDt = siblingBillingDts.find(bDt => bDt.UID === "UID"+eldestSibling.uid);
  const brosJogen = eldestSiblingBillingDt?.brosJougen ?? [];
  brosJogen.sort((a, b) => a.brosIndex < b.brosIndex ?-1 :1);
  brosJogen.forEach(jDt => {
    const targetBillingDt = siblingBillingDts.find(bDt => bDt.UID === jDt.UID);
    jDt.dokujiHojo = targetBillingDt?.jichiJosei ?? "";
    jDt.name = "thisOffice";
    jDt.no = "0";
    result.push(jDt);
  });
  siblingBillingDts.sort((a, b) => a.brosIndex < b.brosIndex ?-1 :1);
  siblingBillingDts.forEach(bDt => {
    const kyouryokuJigyosyo = bDt["協力事業所"] ?? [];
    kyouryokuJigyosyo.forEach(jDt => {
      if(jDt.name !== "thisOffice"){
        result.push(jDt);
      }
    })
  })

  return result
}

const SiblingAmountPerJigyosyoTable1 = (props) => {
  const classes = useStyles();
  const {billingDts, siblingUsers, com, pageIndex, hidePersonalInfo} = props;
  const allBillingDts = summarizeSiblingBillingDts(billingDts, siblingUsers);
  const nodes = Array(5).fill(null).map((_, i) => {
    const bDt = allBillingDts[i+SIBLING_COLS*(pageIndex-1)] ?? {};
    const userDt = siblingUsers.find(user => user.hno === bDt.hno) ?? {};
    return makeSiblingAmountPerJigyosyoNode(bDt, userDt, com, i, hidePersonalInfo);
  });

  return(
    <table className={classes.siblingAmountPerJigyosyoTable} style={{marginBottom: 16}}>
      <tbody>
        <tr>
          <th rowSpan="8" className='mainHeaderItem boldBorder' style={{writingMode: 'tb'}}>利用者負担額集計・調整欄（神戸市独自減免前）</th>
          <th className='headerItem boldBorder'>項番</th>
          <td className='bodyItem boldBorder'>1</td>
          <td className='bodyItem boldBorder'>2</td>
          <td className='bodyItem boldBorder'>3</td>
          <td className='bodyItem boldBorder'>4</td>
          <td className='bodyItem boldBorder'>5</td>
        </tr>
        <tr>
          <th className='boldBorderRight'>受給者番号</th>
          {nodes.map(node => node.hno)}
        </tr>
        <tr>
          <th className='boldBorderRight'>対象児氏名</th>
          {nodes.map(node => node.userName)}
        </tr>
        <tr>
          <th className='boldBorderRight'>事業所番号</th>
          {nodes.map(node => node.jigyosyoNum)}
        </tr>
        <tr>
          <th className='lines3 boldBorderRight'>事業所名称</th>
          {nodes.map(node => node.jigyosyoName)}
        </tr>
        <tr>
          <th className='boldBorderRight'>総費用額</th>
          {nodes.map(node => node.amount)}
        </tr>
        <tr>
          <th className='boldBorderRight'>利用者負担額</th>
          {nodes.map(node => node.riyousyahutan)}
        </tr>
        <tr>
          <th className='boldBorderRight'>上限管理後<br />利用者負担額</th>
          {nodes.map(node => node.kanriRiyosyahutan)}
        </tr>
        <tr>
          <th rowSpan="2" className='mainHeaderItem boldBorder' style={{writingMode: 'tb'}}>神戸市独自減免</th>
          <th className='boldBorderTop boldBorderRight'>神戸市独自減免</th>
          {nodes.map(node => node.kobeHojo)}
        </tr>
        <tr>
          <th className='boldBorderRight' style={{padding: '8px 0'}}>
            上限管理後利用者負担額<br />（神戸市/給付費部分）
          </th>
          {nodes.map(node => node.kobeRiyosyahutan)}
        </tr>
      </tbody>
    </table>
  )
}

const SiblingAmountPerJigyosyoTable2 = (props) => {
  const classes = useStyles();
  const {billingDts, siblingUsers, com, maxPageIndex, pageIndex, hidePersonalInfo} = props;
  const allBillingDts = summarizeSiblingBillingDts(billingDts, siblingUsers);
  const nodes = Array(4).fill(null).map((_, i) => {
    const bDt = allBillingDts[5+i+SIBLING_COLS*(pageIndex-1)] ?? {};
    const userDt = siblingUsers.find(user => user.hno === bDt.hno) ?? {};
    return makeSiblingAmountPerJigyosyoNode(bDt, userDt, com, i, hidePersonalInfo);
  });
  const totalNode = allBillingDts.reduce((result, bDt, index) => {
    if(pageIndex !== maxPageIndex) return result;
    const userDt = siblingUsers.find(user => user.hno === bDt.hno) ?? {};
    //総費用額
    const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
    if(amount || amount===0) result.amount = result.amount ?result.amount + amount :amount;
    //利用者負担額
    let riyousyahutan = bDt.tyouseiGaku !== undefined
    ? bDt.tyouseiGaku: Math.min(bDt.ichiwari, parseInt(userDt.priceLimit));
    riyousyahutan = isNaN(riyousyahutan)? '': riyousyahutan;
    if(riyousyahutan || riyousyahutan===0) result.riyousyahutan = result.riyousyahutan ?result.riyousyahutan + riyousyahutan :riyousyahutan;
    //給付費
    const kyuhuhi = amount===0 ?"0" :amount && (riyousyahutan===0 || riyousyahutan) ?amount - riyousyahutan :"";
    if(kyuhuhi || kyuhuhi===0) result.kyuhuhi = result.kyuhuhi ?result.kyuhuhi + kyuhuhi :kyuhuhi;
    //（管理結果）利用者負担額
    const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";
    if(kanriRiyosyahutan || kanriRiyosyahutan===0) result.kanriRiyosyahutan = result.kanriRiyosyahutan ?result.kanriRiyosyahutan + kanriRiyosyahutan :kanriRiyosyahutan;
    //（管理結果）給付費
    const kanriKyuhu = amount===0 ?"0" :amount && (kanriRiyosyahutan===0 || kanriRiyosyahutan) ?amount - kanriRiyosyahutan :"";
    if(kanriKyuhu || kanriKyuhu===0) result.kanriKyuhu = result.kanriKyuhu ?result.kanriKyuhu + kanriKyuhu :kanriKyuhu;
    //神戸独自補助
    const kobeHojo = !isNaN(parseInt(bDt?.dokujiHojo)) ?parseInt(bDt?.dokujiHojo) : "";
    if(kobeHojo || kobeHojo===0) result.kobeHojo = result.kobeHojo ?result.kobeHojo + kobeHojo :kobeHojo;
    //神戸利用者負担額
    const kobeRiyosyahutan = (kanriRiyosyahutan || kanriRiyosyahutan===0) && (kobeHojo===0 || kobeHojo) ?kanriRiyosyahutan===0 ?0 :kanriRiyosyahutan - kobeHojo :"";
    if(kobeRiyosyahutan || kobeRiyosyahutan===0) result.kobeRiyosyahutan = result.kobeRiyosyahutan ?result.kobeRiyosyahutan + kobeRiyosyahutan :kobeRiyosyahutan;

    if(allBillingDts.length === index+1){
      //合計した値をnode化
      result.amount = (<td key={`amount${index+1}`} className='boldBorderRight num'>{result.amount.toLocaleString()}</td>);
      result.kyuhu = (<td key={`kyuhu${index+1}`} className='boldBorderRight num'>{result.kyuhuhi.toLocaleString()}</td>);
      result.riyousyahutan = (<td key={`riyousyahutan${index+1}`} className='boldBorderRight num'>{result.riyousyahutan.toLocaleString()}</td>);
      result.kanriRiyosyahutan = (<td key={`kanriRiyosyahutan${index+1}`} className='boldBorderRight num'>{result.kanriRiyosyahutan.toLocaleString()}</td>);
      result.kanriKyuhu = (<td key={`kanriKyuhu${index+1}`} className='boldBorderRight num'>{result.kanriKyuhu.toLocaleString()}</td>);
      result.kobeHojo = (<td key={`kobeHojo${index+1}`} className='boldBorderRight num'>{result.kobeHojo.toLocaleString()}</td>);
      result.kobeRiyosyahutan = (<td key={`kobeRiyosyahutan${index+1}`} className='boldBorderRight num'>{result.kobeRiyosyahutan.toLocaleString()}</td>);
    }
    
    return result;
  }, {amount: "", riyousyahutan: "", kyuhuhi: "", kanriRiyosyahutan: "", kanriKyuhu: "", kobeHojo: "", kobeRiyosyahutan: ""});
  if(pageIndex !== maxPageIndex){
    totalNode.amount = (<td key={`amount`} className='boldBorderRight' />);
    totalNode.kyuhu = (<td key={`kyuhu`} className='boldBorderRight' />);
    totalNode.riyousyahutan = (<td key={`riyousyahutan`} className='boldBorderRight' />);
    totalNode.kanriRiyosyahutan = (<td key={`kanriRiyosyahutan`} className='boldBorderRight' />);
    totalNode.kanriKyuhu = (<td key={`kanriKyuhu`} className='boldBorderRight' />);
    totalNode.kobeHojo = (<td key={`kobeHojo`} className='boldBorderRight' />);
    totalNode.kobeRiyosyahutan = (<td key={`kobeRiyosyahutan`} className='boldBorderRight' />);
  }

  return(
    <table className={classes.siblingAmountPerJigyosyoTable} style={{marginBottom: 24}}>
      <tbody>
        <tr>
          <th rowSpan="8" className='mainHeaderItem boldBorder' style={{writingMode: 'tb'}}>利用者負担額集計・調整欄（神戸市独自減免前）</th>
          <th className='headerItem boldBorder'>項番</th>
          <td className='bodyItem boldBorder'>6</td>
          <td className='bodyItem boldBorder'>7</td>
          <td className='bodyItem boldBorder'>8</td>
          <td className='bodyItem boldBorder'>9</td>
          <td rowSpan="5" className='bodyItem boldBorder'>合計</td>
        </tr>
        <tr>
          <th className='boldBorderRight'>受給者番号</th>
          {nodes.map(node => node.hno)}
        </tr>
        <tr>
          <th className='boldBorderRight'>対象児氏名</th>
          {nodes.map(node => node.userName)}
        </tr>
        <tr>
          <th className='boldBorderRight'>事業所番号</th>
          {nodes.map(node => node.jigyosyoNum)}
        </tr>
        <tr>
          <th className='lines3 boldBorderRight'>事業所名称</th>
          {nodes.map(node => node.jigyosyoName)}
        </tr>
        <tr>
          <th className='boldBorderRight'>総費用額</th>
          {nodes.map(node => node.amount)}
          {totalNode.amount}
        </tr>
        <tr>
          <th className='boldBorderRight'>利用者負担額</th>
          {nodes.map(node => node.riyousyahutan)}
          {totalNode.riyousyahutan}
        </tr>
        <tr>
          <th className='boldBorderRight'>上限管理後<br />利用者負担額</th>
          {nodes.map(node => node.kanriRiyosyahutan)}
          {totalNode.kanriRiyosyahutan}
        </tr>
        <tr>
          <th rowSpan="2" className='mainHeaderItem boldBorder' style={{writingMode: 'tb'}}>神戸市独自減免</th>
          <th className='boldBorderTop boldBorderRight'>神戸市独自減免</th>
          {nodes.map(node => node.kobeHojo)}
          {totalNode.kobeHojo}
        </tr>
        <tr>
          <th className='boldBorderRight' style={{padding: '8px 0'}}>
            上限管理後利用者負担額<br />（神戸市/給付費部分）
          </th>
          {nodes.map(node => node.kobeRiyosyahutan)}
          {totalNode.kobeRiyosyahutan}
        </tr>
      </tbody>
    </table>
  )
}

const ConfirmationForm = (props) => {
  const {user, siblingUsers,  com, schedule, style={}, reportDateDt} = props;
  const classes = useStyles();

  const displayName = com?.ext?.reportsSetting?.jogenKanri?.displayName ?? com?.etc?.configReports?.jogenKanri?.displayName ?? false;
  const displayDate = com?.ext?.reportsSetting?.jogenKanri?.displayDate ?? com?.etc?.configReports?.jogenKanri?.displayDate ?? false;
  // const stateDate = (
  //   schedule?.report?.thisUser?.service?.["上限管理結果票"] ?? formatDate(new Date(), 'YYYY-MM-DD')
  // );
  // const stateDate = reportDateDt?.["上限管理結果票"] ?? formatDate(new Date(), 'YYYY-MM-DD');
  const stateDate = localStorage.getItem("reportsSettingDate")
    ?JSON.parse(localStorage.getItem("reportsSettingDate"))?.["上限管理結果票"] ?? formatDate(new Date(), 'YYYY-MM-DD')
    :formatDate(new Date(), 'YYYY-MM-DD');
  const dateList = stateDate.split("-");
  const exDate = getDateEx(dateList[0], dateList[1], dateList[2]);
  const confWareki = exDate.wr.l;
  let confYear = "", confMonth = "", confDate = "";
  if(displayDate){
    confYear = String(exDate.wr.y).padStart(2, '0');
    confMonth = String(exDate.m).padStart(2, '0');
    confDate = String(exDate.d).padStart(2, '0');
  }

  const pname = user ?user.pname
    :siblingUsers.reduce((resutl, user) => {
      if(!resutl) return user.pname;
      return resutl === user.pname ?resutl :"問題発生";
    }, null);

  return(
    <div className={classes.confirmationForm} style={{...style}}>
      <div>上記内容について確認しました。</div>
      <div style={{display: 'flex'}}>
        <div>{confWareki}</div>
        <div className='year'>{confYear}</div>
        <div>年</div>
        <div className='month'>{confMonth}</div>
        <div>月</div>
        <div className='date'>{confDate}</div>
        <div>日</div>
      </div>
      <div>給付決定保護者等氏名<span className='pname'>{displayName ?pname :""}</span></div>
    </div>
  )
}

export const ReportPageIndex = ({pageIndex, maxPageIndex, addStyle={}}) => (
  <div style={{textAlign: 'end', marginTop: 64, ...addStyle}}>
    {pageIndex}<span style={{margin: '0 4px'}}>/</span>{maxPageIndex}
  </div>
)

const JogenKanriOnePage = (props) => {
  const classes = useStyles();
  const {
    user, com, stdDate, billingDt, schedule, hidePersonalInfo, maxPageIndex, pageIndex,
    reportDateDt
  } = props;
  const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
  const dateTableProps = {stdDate};
  const userInfoTableProps = {user, hidePersonalInfo};
  const officeInfoTableProps = {com};
  const totalAmountTableProps = {
    billingDt, convJido, user, com, maxPageIndex, pageIndex, style: {marginBottom: 24},
    hidePersonalInfo,
  }
  const confirmationFormProps = {user, com, schedule, reportDateDt}
  console.log("hogehogehoge", billingDt)
  return(
    <div className={classes.entireTable}>
      <div className='pageTitle'>
        利用者負担上限額管理結果票
      </div>
      <DateTable {...dateTableProps} />
      <div className='infoTables'>
        <UserInfoTable {...userInfoTableProps} />
        <OfficeInfoTable {...officeInfoTableProps} />
      </div>
      <UpperLimitAmountTable {...totalAmountTableProps} />
      <KanriKekkaTable {...totalAmountTableProps} />
      <AmountPerJigyosyoTable1 {...totalAmountTableProps} />
      <AmountPerJigyosyoTable2 {...totalAmountTableProps} />
      <ConfirmationForm {...confirmationFormProps} />
      <ReportPageIndex pageIndex={pageIndex} maxPageIndex={maxPageIndex}/>
    </div>
  )
}

const SiblingJogenKanriOnePage = (props) => {
  const classes = useStyles();
  const {
    siblingUsers, com, stdDate, billingDts, schedule, hidePersonalInfo, maxPageIndex, pageIndex, reportDateDt
  } = props;
  const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
  const dateTableProps = {stdDate, style: {marginBottom: 16}};
  const userInfoTableProps = {siblingUsers, hidePersonalInfo, convJido};
  const officeInfoTableProps = {com};
  const totalAmountTableProps = {billingDts, convJido, siblingUsers, com, maxPageIndex, pageIndex, style: {marginBottom: 24}}
  const confirmationFormProps = {siblingUsers, com, schedule, style: {marginBottom: 0}, reportDateDt}

  return(
    <div className={classes.entireTable}>
      <div style={{textAlign: 'center', fontSize: 26, marginBottom: 24}}>
        利用者負担上限額管理結果票（複数{convJido ?"児童" :"障害児"}用）
      </div>
      <DateTable {...dateTableProps} />
      <div className='infoTables' style={{marginBottom: 24}}>
        <SiblingUserInfoTable {...userInfoTableProps} />
        <SiblingOfficeInfoTable {...officeInfoTableProps} />
      </div>
      <SiblingUpperLimitAmountTable {...totalAmountTableProps} />
      <KanriKekkaTable {...totalAmountTableProps} />
      <SiblingAmountPerJigyosyoTable1 {...totalAmountTableProps} />
      <SiblingAmountPerJigyosyoTable2 {...totalAmountTableProps} />
      <ConfirmationForm {...confirmationFormProps} />
      <ReportPageIndex pageIndex={pageIndex} maxPageIndex={maxPageIndex} addStyle={{margin: 0}}/>
    </div>
  )
}

export const KobeJogenKanri = (props) => {
  const classes = useStyles();
  const {userList, preview, hidePersonalInfo, selects, reportDateDt, ...others} = props;
  const allState = useSelector(state => state);
  if (!(preview==='上限管理結果票' && selects[preview]==='神戸市形式')) return null;
  const loadingStatus = getLodingStatus(allState);
  if(!loadingStatus.loaded) return (<LoadingSpinner/>);
  const {com, users, schedule, stdDate, service, serviceItems} = allState;
  const billingParams = { calledBy: "KobeJogenKanri", stdDate, schedule, users, com, service, serviceItems };
  const { billingDt } = setBillInfoToSch(billingParams);
  const targetUsers = users.filter(user => userList.some(u => u.checked && u.uid===user.uid));
  const pageNodes = targetUsers.flatMap((user, index) => {
    if(user.kanri_type !== "管理事業所") return null;
    if(user.brosIndex > 1) return null;
    const bDt = billingDt.find(dt => dt.UID === "UID"+user.uid);
    if(!bDt["協力事業所"]) bDt["協力事業所"] = [];
    const kyouryokuJigyosyo = bDt["協力事業所"];
    const totalAmount = kyouryokuJigyosyo.reduce((result, dt) => result += isNaN(parseInt(dt.amount)) ?dt.amount :0, 0);
    if(!kyouryokuJigyosyo.length && bDt.userSanteiTotal===0) return null;
    if(totalAmount===0 && bDt.userSanteiTotal===0) return null;
    if(bDt.brosJougen){
      //複数児童対応
      const siblingUsers = getBrothers(user.uid, users);
      siblingUsers.unshift(user);
      const targetSiblingBDts = siblingUsers.map(u => {
        const b = billingDt.find(dt => dt.UID === "UID"+u.uid);
        return b?.["協力事業所"] ?b :null;
      }).filter(u => u);
      const siblingKyouryokuJigyosyo = targetSiblingBDts.flatMap(b => b?.["協力事業所"] ?? []);
      const maxPageIndex = siblingKyouryokuJigyosyo.length ?Math.ceil(siblingKyouryokuJigyosyo.length/SIBLING_COLS) :1;
      let pageIndex = 0;
      const oneUserPageNodes = [];
      do{
        pageIndex++;
        const onePageProps = {
          siblingUsers, com, schedule, stdDate, billingDts: targetSiblingBDts,
          hidePersonalInfo, maxPageIndex, pageIndex,
          reportDateDt
        };
        oneUserPageNodes.push(
          <SiblingJogenKanriOnePage key={`page${index+1}-${pageIndex}`} {...onePageProps} />
        );
      }while(pageIndex < maxPageIndex);
      return oneUserPageNodes;
    }else{
      const maxPageIndex = kyouryokuJigyosyo.length ?Math.ceil(kyouryokuJigyosyo.length/SIBLING_COLS) :1;
      let pageIndex = 0;
      const oneUserPageNodes = [];
      do{
        pageIndex++;
        const onePageProps = {
          user, com, schedule, stdDate, billingDt: bDt, hidePersonalInfo, maxPageIndex, pageIndex,
          reportDateDt
        };
        oneUserPageNodes.push(
          <JogenKanriOnePage key={`page${index+1}-${pageIndex}`} {...onePageProps} />
        );
      }while(pageIndex < maxPageIndex);
      return oneUserPageNodes;
    }
  })

  return(
    <div className={classes.pages}>
      {pageNodes}
    </div>
  )
}