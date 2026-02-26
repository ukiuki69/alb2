import React from 'react';
import { makeStyles } from "@material-ui/core"
import { useSelector } from "react-redux";
import { formatDate, getBrothers, getDateEx, getHiddenName, getLodingStatus, randomStr } from "../../commonModule";
import { LoadingSpinner } from "../common/commonParts";
import { setBillInfoToSch } from '../Billing/blMakeData';
import { checkValueType } from '../dailyReport/DailyReportCommon';

const NOMAL_COLS = 4;
const SIBLING_COLS = 16;
const JINO_COL_SPAN = 10;
const HNO_COL_SPAN = 10;
const AMOUNT_COL_SPAN = 6;
const TABEL_COLS = 6;
const KYOURYOKUJIGYOUSYO_MAX_COLS = 11;

const NOMAL_CELL_SIZE = 16;
const NOMAL_BORDER = '1px solid';
const BOLD_BORDER = "2px solid";

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
        className={`${marginedClassName} anyNumberElement`}
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
        className={`${marginedClassName} anyNumberElement`}
        style={{...style, ...addStyle}}
      />
    )
  }

  return nodes
}

const makeAmountPerJigyosyoNode = (bDt, com, i, dokujiJougen) => {
  const result = {};

  // 児童番号
  const hno = bDt.hno ?? "";
  result.hno = (<td colSpan={AMOUNT_COL_SPAN} key={`hno${i+1}`} className='boldBorder'>{String(hno)}</td>);
  // 事業所番号
  let jigyosyoNum = bDt?.no ?? "";
  if(jigyosyoNum === "0") jigyosyoNum = com?.jino ?? "";
  result.jigyosyoNum = (<td colSpan={AMOUNT_COL_SPAN} key={`jigyosyoNum${i+1}`} className='boldBorderRight'>{String(jigyosyoNum)}</td>);
  // 事業所名
  let jigyosyoName = bDt?.lname ?bDt.lname :bDt?.name ?? "";
  if(jigyosyoName === "thisOffice") jigyosyoName = com?.bname ?? "";
  result.jigyosyoName = (<td colSpan={AMOUNT_COL_SPAN} key={`jigyosyoName${i+1}`} className='boldBorderRight'>{String(jigyosyoName)}</td>);
  // 総費用額
  const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
  result.amount = makeAnyNumberOfElements({string: String(amount), elementsLength: 6, lastChildClassName: "boldBorderRight"});
  // （国基準）給付率に応じた利用者負担額
  let riyousyahutan = bDt.tyouseiGaku !== undefined ?bDt.tyouseiGaku :Math.min(bDt.ichiwari, parseInt(bDt.priceLimit));
  riyousyahutan = isNaN(riyousyahutan)? '': riyousyahutan;
  result.riyousyahutan = makeAnyNumberOfElements({string: String(riyousyahutan), elementsLength: 6, lastChildClassName: "boldBorderRight"});
  // 給付費負担額
  const kyuhuhi = amount===0 ?"0" :amount && (riyousyahutan===0 || riyousyahutan) ?amount - riyousyahutan :"";
  result.kyuhuhi = makeAnyNumberOfElements({string: String(kyuhuhi), elementsLength: 6, lastChildClassName: "boldBorderRight"});
  // （国基準）管理後利用者負担額
  const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";
  result.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(kanriRiyosyahutan), elementsLength: 6, className: "", lastChildClassName: "boldBorderRight"});
  // （市基準）食費等
  const kyotoKyuhuhi = "";
  result.kyotoKyuhuhi = makeAnyNumberOfElements({string: String(kyotoKyuhuhi), elementsLength: 6, lastChildClassName: "boldBorderRight"});
  // （市基準）管理後利用者負担額
  const kyotoKanriRiyosyahutan = !isNaN(parseInt(bDt?.dokujiHojo)) ?parseInt(bDt.kettei - bDt?.dokujiHojo) : "";
  result.kyotoKanriRiyosyahutan = makeAnyNumberOfElements({string: String(kyotoKanriRiyosyahutan), elementsLength: 6, className: "", lastChildClassName: "boldBorderRight"});

  return result;
}

const makeSumAmountPerJigyosyoNode = (allBillingDts, pageIndex, maxPageIndex, dokujiJougen) => {
  const totalingAmountDt = allBillingDts.reduce((prevDt, bDt) => {
    if(pageIndex !== maxPageIndex) return prevDt;
    //総費用額
    const amount = !isNaN(parseInt(bDt?.amount)) ?parseInt(bDt?.amount) : "";
    if(amount || amount===0) prevDt.amount = prevDt.amount ?prevDt.amount + amount :amount;
    //利用者負担額
    let riyousyahutan = bDt.tyouseiGaku !== undefined
    ? bDt.tyouseiGaku: Math.min(bDt.ichiwari, parseInt(bDt.priceLimit));
    riyousyahutan = isNaN(riyousyahutan)? '': riyousyahutan;
    if(riyousyahutan || riyousyahutan===0) prevDt.riyousyahutan = prevDt.riyousyahutan ?prevDt.riyousyahutan + riyousyahutan :riyousyahutan;
    //給付費
    const kyuhuhi = amount===0 ?"0" :amount && (riyousyahutan===0 || riyousyahutan) ?amount - riyousyahutan :"";
    if(kyuhuhi || kyuhuhi===0) prevDt.kyuhuhi = prevDt.kyuhuhi ?prevDt.kyuhuhi + parseInt(kyuhuhi) :kyuhuhi;
    //（管理結果）利用者負担額
    const kanriRiyosyahutan = !isNaN(parseInt(bDt?.kettei)) ?parseInt(bDt?.kettei) : "";
    if(kanriRiyosyahutan || kanriRiyosyahutan===0) prevDt.kanriRiyosyahutan = prevDt.kanriRiyosyahutan ?prevDt.kanriRiyosyahutan + kanriRiyosyahutan :kanriRiyosyahutan;
    //（管理結果）給付費
    const kyotoKyuhuhi = "";
    if(kyotoKyuhuhi || kyotoKyuhuhi===0) prevDt.kyotoKyuhuhi = prevDt.kyotoKyuhuhi ?prevDt.kyotoKyuhuhi + parseInt(kyotoKyuhuhi) :kyotoKyuhuhi;
    //（市基準）利用者負担額
    const kyotoKanriRiyosyahutan = !isNaN(parseInt(bDt?.dokujiHojo)) ?parseInt(bDt.kettei - bDt?.dokujiHojo) : "";
    if(kanriRiyosyahutan || kanriRiyosyahutan===0) prevDt.kyotoKanriRiyosyahutan = prevDt.kyotoKanriRiyosyahutan ?prevDt.kyotoKanriRiyosyahutan + kyotoKanriRiyosyahutan :kyotoKanriRiyosyahutan;
    return prevDt
  }, {amount: "", riyousyahutan: "", kyuhuhi: "", kanriRiyosyahutan: "", kyuhuhi: "", kyotoKanriRiyosyahutan: "", kyotoKyuhuhi: ""});
  const totalingNodes = {};
  // 総費用額
  totalingNodes.amount = makeAnyNumberOfElements({string: String(totalingAmountDt.amount), elementsLength: 6, lastChildClassName: ""});
  // 給付費負担額
  totalingNodes.riyousyahutan = makeAnyNumberOfElements({string: String(totalingAmountDt.riyousyahutan), elementsLength: 6, lastChildClassName: ""});
  // 給付率に応じた利用者負担額
  totalingNodes.kanriRiyosyahutan = makeAnyNumberOfElements({string: String(totalingAmountDt.kanriRiyosyahutan), elementsLength: 6, className: "", lastChildClassName: "boldBorderRight"});
  // （国基準）管理後利用者負担額
  totalingNodes.kyuhuhi = makeAnyNumberOfElements({string: String(totalingAmountDt.kyuhuhi), elementsLength: 6, lastChildClassName: "lines4"});
  // 食費等
  totalingNodes.kyotoKyuhuhi = makeAnyNumberOfElements({string: String(totalingAmountDt.kyotoKyuhuhi), elementsLength: 6, lastChildClassName: "lines4"});
  // （市基準）管理後利用者負担額
  totalingNodes.kyotoKanriRiyosyahutan = makeAnyNumberOfElements({string: String(totalingAmountDt.kyotoKanriRiyosyahutan), elementsLength: 6, className: "", lastChildClassName: "boldBorderRight"});

  return totalingNodes;
}

export const KOBE_REPORT_STYLES = {
  jogenKanriPage: {
    width: '100%', padding: 32,
    '&:not(:last-child)': {marginBottom: 256, pageBreakAfter: 'always',},
    '& .pageTitle': {textAlign: 'center', fontSize: 26, marginBottom: 32},
    '& table': {
      textAlign: 'center',
      border: BOLD_BORDER, borderCollapse: 'collapse',
      marginBottom: 16,
      '& th, td': {
        padding: '4px 8px',
        border: NOMAL_BORDER,
      },
      '& th': {
        fontWeight: 'initial', fontSize: '.8rem',
      },
      '& td': {
        width: 8,
        '& .num': {
          textAlign: 'right'
        },
      },
      '& .anyNumberElement': {
        padding: "0!important", minWidth: 20,
        height: 16
      },
      // '& .lines1': {height: NOMAL_CELL_SIZE},
      // '& .lines2': {height: NOMAL_CELL_SIZE * 2},
      // '& .lines3': {height: NOMAL_CELL_SIZE * 3},
      // '& .lines4': {height: NOMAL_CELL_SIZE * 4},
      // '& .lines5': {height: NOMAL_CELL_SIZE * 5},
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
    },
  },
  kanriKekkaTable: {
    border: 'none', width: '100%',
    '& .description': {
      '& td': {
        borderLeft: BOLD_BORDER, borderRight: BOLD_BORDER,
        borderTop: 'none', borderBottom: 'none'
      },
      '&:first-child td': {borderTop: BOLD_BORDER},
      '&:last-child td': {borderBottom: BOLD_BORDER}
    },
  },
  amountPerJigyosyoTable: {
    width: '100%',
    '& td': {
      // width: '12px!important',
      padding: "6px!important"
    },
    '& .tcol': {width: 16},
    '& .index': {height: 16},
    '& .jino': {height: 16},
    '& .jname': {minHeight: 64},
    '& .sumAmount, .userAmount, .hutangaku': {height: 16},
    '& .hutangaku': {
      fontSize: '0.7rem'
    },
  },
  amountTable: {
    '& .bname': {height: 80}
  },
  siblingUserInfoTable: {
    '& .name': {height: 48}
  },
  kobeAmountTable: {
    width: '100%',
    '& td': {
      // width: '12px!important',
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
  siblingAmountPerJigyosyoTable: {
    width: '100%',
    '& td': {
      padding: '6px !important'
    },
    '& .mainHeaderItem': {width: 16, padding: 0},
    '& .headerItem': {width: '6rem'},
    '& .bodyItem': {width: '6.5rem'},
  },
  reportPageIndex: {
    textAlign: 'end', marginTop: 64,
    '& .delimiter':{ margin: '0 4px' }
  }
}
const useStyles = makeStyles(KOBE_REPORT_STYLES);

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

const KyotoUserInfoTable = (props) => {
  const classes = useStyles();
  const {user, hidePersonalInfo} = props;

  return(
    <table className={classes.userInfoTable}>
      <tbody>
        <tr>
          <th className='lines1'>市町村番号</th>
          {makeAnyNumberOfElements({string: String(user.scity_no ?? ""), elementsLength: 6, key: "jino"})}
        </tr>
        <tr>
          <th className='noneBorderBottom'>支給決定保護者等<br />氏名</th>
          <td className='lines2' colSpan={HNO_COL_SPAN}>{getHiddenName(user.pname, hidePersonalInfo)}</td>
        </tr>
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
          <th className='lines1' style={{width: '7rem'}}>指定事業所番号</th>
          {jigyosyoNumNodes}
        </tr>
        <tr>
          <th>事業所及びその事業者の名称</th>
          <td colSpan={JINO_COL_SPAN}>{com.bname}</td>
        </tr>
      </tbody>
    </table>
  )
}

const SiblingUserInfoTable = ({siblingUsers, hidePersonalInfo}) => {
  const classes = useStyles();

  const siblingUser1 = siblingUsers[0] ?? {};
  const siblingUser2 = siblingUsers[1] ?? {};
  const siblingUser3 = siblingUsers[2] ?? {};
  const siblingUser4 = siblingUsers[3] ?? {};

  return(
    <table className={classes.siblingUserInfoTable}>
      <tbody>
        <tr>
          <th>受給者証番号</th>
          {makeAnyNumberOfElements({string: String(siblingUser1.hno ?? ""), elementsLength: 10, key: "hno1"})}
          <th>受給者証番号</th>
          {makeAnyNumberOfElements({string: String(siblingUser3.hno ?? ""), elementsLength: 10, key: "hno3"})}
        </tr>
        <tr>
          <th className='name'>支給決定に係る<br />児童氏名　①<br />（上限管理児童）</th>
          <td className='name' colSpan={HNO_COL_SPAN}>{getHiddenName(siblingUser1.name, hidePersonalInfo) ?? ""}</td>
          <th className='name'>支給決定に係る<br />児童氏名　③</th>
          <td className='name' colSpan={HNO_COL_SPAN}>{getHiddenName(siblingUser3.name, hidePersonalInfo) ?? ""}</td>
        </tr>
        <tr>
          <th>受給者証番号</th>
          {makeAnyNumberOfElements({string: String(siblingUser2.hno ?? ""), elementsLength: 10, key: "hno2"})}
          <th>受給者証番号</th>
          {makeAnyNumberOfElements({string: String(siblingUser4.hno ?? ""), elementsLength: 10, key: "hno4"})}
        </tr>
        <tr>
          <th className='name'>支給決定に係る<br />児童氏名　②</th>
          <td className='name' colSpan={HNO_COL_SPAN}>{getHiddenName(siblingUser2.name, hidePersonalInfo) ?? ""}</td>
          <th className='name'>支給決定に係る<br />児童氏名　④</th>
          <td className='name' colSpan={HNO_COL_SPAN}>{getHiddenName(siblingUser4.name, hidePersonalInfo) ?? ""}</td>
        </tr>
      </tbody>
    </table>
  )
}

const KyotoUpperLimitAmountTable = (props) => {
  const classes = useStyles();
  const {billingDt, user} = props;

  const upperLimit1 = String(billingDt?.upperlimit ?? "");
  const upperLimit1Nodes = makeAnyNumberOfElements({string: upperLimit1, elementsLength: 6, key: "upperLimit"})

  const upperLimit2 = String(user?.etc?.dokujiJougen ?? "");
  const upperLimit2Nodes = makeAnyNumberOfElements({string: upperLimit2, elementsLength: 6, key: "kobeUpperLimit"});

  return(
    <table className={classes.upperLimitTable}>
      <tbody>
        <tr>
          <th>利⽤者負担上限⽉額（国）①</th>
          {upperLimit1Nodes}
          <th>利⽤者負担上限⽉額（市）②</th>
          {upperLimit2Nodes}
        </tr>
      </tbody>
    </table>
  )
}

const KyotoKanriKekkaTable = (props) => {
  const classes = useStyles();
  const {billingDt} = props;

  const discriptionStyles = {
    textAlign: 'start', width: 616, margin: '0 auto'
  }
  const numStyles = {marginRight: 8}
  return(
    <table className={`${classes.kanriKekkaTable} noneBorder`}>
      <tbody>
        <tr>
          <th className='boldBorderTop boldBorderLeft'>利用者負担上限額管理結果（国）</th>
          <td className='boldBorderTop boldBorderRight' style={{width: 32}}>{billingDt?.kanriKekka ?? ""}</td>
          <th className='boldBorderTop boldBorderLeft'>利用者負担上限額管理結果（市）</th>
          <td className='boldBorderTop boldBorderRight' style={{width: 32}}>{billingDt?.dokujiJougenKekka ?? ""}</td>
          <td className='noneBorder' style={{width: '30%'}}/>
        </tr>
        <tr>
          <td colSpan='5'
            className='discription boldBorderTop boldBorderRight boldBorderLeft noneBorderBottom'
            style={{paddingTop: 24}}
          >
            <div style={discriptionStyles}>
              <span style={numStyles}>1</span>管理事業所で利用者負担額を充当したため、他事業所の利用者負担は発生しない。
            </div>
          </td>
        </tr>
        <tr>
          <td colSpan='5'
            className='discription boldBorderRight boldBorderLeft noneBorderTop noneBorderBottom'
          >
            <div style={discriptionStyles}>
              <span style={numStyles}>2</span>利用者負担額の合算額が、負担上限月額以下のため、調整事務は行わない。
            </div>
          </td>
        </tr>
        <tr>
          <td colSpan='5'
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

const AmountTable = (props) => {
  const classes = useStyles();
  const {billingDts, com, maxPageIndex, pageIndex, tableNo} = props;
  const dokujiJougen = billingDts[0].dokujiJougen;
  const allBillingDts = billingDts.flatMap(bDt => bDt["協力事業所"] ?? []);

  const nodes = Array(TABEL_COLS).fill(null).map((_, i) => {
    const thisColIndex = (i + 1) + ((tableNo - 1) * TABEL_COLS) + ((pageIndex - 1) * KYOURYOKUJIGYOUSYO_MAX_COLS);
    const bDt = allBillingDts[thisColIndex-1] ?? {};
    if(tableNo === 2 && thisColIndex % 11 === 1){
      return makeSumAmountPerJigyosyoNode(allBillingDts, pageIndex, maxPageIndex, dokujiJougen);
    }else{
      return makeAmountPerJigyosyoNode(bDt, com, i, dokujiJougen);
    }
  });

  return(
    <table className={classes.amountTable}>
      <tbody>
        <tr>
          <th rowSpan="10" className='overallHeader boldBorder' style={{writingMode: 'tb'}}>利用者負担額集計・調整欄</th>
          <th colSpan="2" className='index boldBorder'>項番</th>
          {nodes.map((_, i) => {
            const thisColIndex = (i + 1) + ((tableNo - 1) * TABEL_COLS) + ((pageIndex - 1) * KYOURYOKUJIGYOUSYO_MAX_COLS);
            if(tableNo === 2 && thisColIndex % 11 === 1){
              return (<th className='boldBorder' rowSpan="4" colSpan={AMOUNT_COL_SPAN} key={`sumCol${pageIndex}`}>合計</th>);
            }
            return (<th className='boldBorder' colSpan={AMOUNT_COL_SPAN} key={`colIndex${i+1}`}>{thisColIndex}</th>);
          })}
        </tr>
        <tr>
          <th colSpan="2" className='hno boldBorder'>児童番号</th>
          {nodes.map(node => node.hno ?? null)}
        </tr>
        <tr>
          <th colSpan="2" className='jino boldBorderRight'>事業所番号</th>
          {nodes.map(node => node.jigyosyoNum ?? null)}
        </tr>
        <tr>
          <th colSpan="2" className='bname boldBorderRight'>事業所名</th>
          {nodes.map(node => node.jigyosyoName ?? null)}
        </tr>
        <tr>
          <th colSpan="2" className='amount boldBorderRight'>総費用額</th>
          {nodes.map(node => node.amount)}
        </tr>
        <tr>
          <th colSpan="2" className='amount boldBorderRight'>給付費負担額</th>
          {nodes.map(node => node.kyuhuhi)}
        </tr>
        <tr>
          <th rowSpan="2" style={{writingMode: 'tb'}} className='boldBorderRight'>国基準</th>
          <th className='amount boldBorderRight' style={{overflow: 'hidden'}}>給付率に応じた利用者負担額</th>
          {nodes.map(node => node.riyousyahutan)}
        </tr>
        <tr>
          <th className='amount boldBorderRight'>管理後利用者負担額</th>
          {nodes.map(node => node.kanriRiyosyahutan)}
        </tr>
        <tr>
          <th rowSpan="2" style={{writingMode: 'tb'}} className='boldBorderRight'>市基準</th>
          <th className='amount boldBorderRight'>食費等</th>
          {nodes.map(node => node.kyotoKyuhuhi)}
        </tr>
        <tr>
          <th className='amount boldBorderRight'>管理後利用者負担額</th>
          {nodes.map(node => node.kyotoKanriRiyosyahutan)}
        </tr>
      </tbody>
    </table>
  )
}

const ConfirmationForm = (props) => {
  const classes = useStyles();
  const {user, siblingUsers,  com, schedule, style={}} = props;

  const displayName = com?.ext?.reportsSetting?.jogenKanri?.displayName ?? com?.etc?.configReports?.jogenKanri?.displayName ?? false;
  const displayDate = com?.ext?.reportsSetting?.jogenKanri?.displayDate ?? com?.etc?.configReports?.jogenKanri?.displayDate ?? false;
  // const stateDate = (
  //   schedule?.report?.thisUser?.service?.["上限管理結果票"] ?? formatDate(new Date(), 'YYYY-MM-DD')
  // );
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

export const ReportPageIndex = (props) => {
  const classes = useStyles();
  const {pageIndex, maxPageIndex} = props;
  
  return(
    <div className={classes.reportPageIndex}>
      {pageIndex}<span className='delimiter'>/</span>{maxPageIndex}
    </div>
  )
}

const JogenKanriPage = (props) => {
  const classes = useStyles();
  const {siblingUsers, com, stdDate, billingDts, schedule, hidePersonalInfo, maxPageIndex, pageIndex} = props;

  const userInfoTableProps = {user: siblingUsers[0], hidePersonalInfo};
  const officeInfoTableProps = {com};
  const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
  const dateTableProps = {stdDate};
  const upperLimit = {billingDt: billingDts[0], convJido, user: siblingUsers[0], com, maxPageIndex, pageIndex};
  const totalAmountTableProps = {billingDts, convJido, siblingUsers, com, maxPageIndex, pageIndex}
  const totalAmountTable1Props = {billingDts, convJido, siblingUsers, com, maxPageIndex, pageIndex, tableNo: 1}
  const totalAmountTable2Props = {billingDts, convJido, siblingUsers, com, maxPageIndex, pageIndex, tableNo: 2}
  const confirmationFormProps = {siblingUsers, com, schedule, style: {marginBottom: 0}}
  const multiChildrenStr = Number(siblingUsers[0].brosIndex) >= 1 ? "（複数児童用）": "";
  return(
    <div className={classes.jogenKanriPage}>
      <div className='pageTitle'>利用者負担上限額管理結果票（京都市様式）{multiChildrenStr}</div>
      <DateTable {...dateTableProps} />
      <div className='infoTables'>
        <KyotoUserInfoTable {...userInfoTableProps} />
        <OfficeInfoTable {...officeInfoTableProps} />
      </div>
      <SiblingUserInfoTable siblingUsers={siblingUsers} hidePersonalInfo={hidePersonalInfo} />
      <KyotoUpperLimitAmountTable {...upperLimit} />
      <KyotoKanriKekkaTable billingDt={billingDts[0]} />
      <AmountTable {...totalAmountTable1Props} />
      <AmountTable {...totalAmountTable2Props} />
      <ConfirmationForm {...confirmationFormProps} />
      <ReportPageIndex pageIndex={pageIndex} maxPageIndex={maxPageIndex}/>
    </div>
  )
}

export const KyotoJogenKnari = (props) => {
  const {userList, preview, hidePersonalInfo, selects} = props;
  const allState = useSelector(state => state);

  if (!(preview==='上限管理結果票' && selects[preview]==='京都市形式')) return null;
  if(!getLodingStatus(allState).loaded) return (<LoadingSpinner/>);

  const {com, users, schedule, stdDate, service, serviceItems} = allState;
  const billingParams = { calledBy: "KobeJogenKanri", stdDate, schedule, users, com, service, serviceItems };
  const { billingDt } = setBillInfoToSch(billingParams);
  // 選択された利用者のみ対象
  const targetUsers = users.filter(user => {
    if(!userList.find(u => u.uid===user.uid)?.checked) return false;
    const bDt = billingDt.find(dt => dt.UID === "UID"+user.uid);
    if(!(user.kanri_type === "管理事業所" || bDt.brosIndex > 0)) return false;
    // if(!(checkValueType(bDt["協力事業所"], "Array") && bDt["協力事業所"].length)) return false;
    return true;
  });
  // 京都独自上限管理結果
  billingDt.forEach(bdt=>{
    const kyLst = []; // 兄弟を含めた協力事業所のリストを作成
    // 対象外利用者
    if (bdt.brosIndex === 0 && bdt.kanri_type !== '管理事業所') return;
    if (Number(bdt.brosIndex) === 0){
      
    }
  });

  // 処理済みのuidを溜めて、判断に使用。
  const processedUids = [];
  // 兄弟ごとに利用者を配列で分ける
  const usersBySibling = targetUsers.reduce((prevUsersPerSibing, user) => {
    // 処理済みの場合は無視。
    if(processedUids.includes(user.uid)) return prevUsersPerSibing;
    // 兄弟を取得
    const siblingUsers = getBrothers(user.uid, users);
    if(siblingUsers.length){
      // 兄弟を処理済みにするため、uidを保存
      siblingUsers.forEach(siblingUser => processedUids.push(siblingUser.uid));
      siblingUsers.push(user);
      siblingUsers.sort((a, b) => parseInt(a.brosIndex) - parseInt(b.brosIndex));
      prevUsersPerSibing = [...prevUsersPerSibing, siblingUsers];
    }else{
      prevUsersPerSibing = [...prevUsersPerSibing, [user]];
    }
    processedUids.push(user.uid);
    return prevUsersPerSibing;
  }, []);
  const pageNodes = usersBySibling.flatMap((siblingUsers, index) => {
    const bDts = siblingUsers.map(siblingUser => JSON.parse(JSON.stringify((billingDt.find(bDt => bDt.UID === "UID"+siblingUser.uid) ?? {}))));
    let allKyouryokujigyousyo = bDts.flatMap(b => b?.["協力事業所"] ?? []);
    if(!allKyouryokujigyousyo.length){
      bDts.forEach(bDt => {
        const brosJougen = bDt.brosJougen ?? [];
        if(!bDt["協力事業所"]) bDt["協力事業所"] = [];
        brosJougen.forEach(dt => {
          const targetBillingDt = bDts.find(bDt => bDt.UID === dt.UID);
          dt.dokujiHojo = targetBillingDt?.jichiJosei ?? "";
          dt.priceLimit = targetBillingDt?.priceLimit ?? "0";
          dt.name = "thisOffice";
          dt.no = "0";
          bDt["協力事業所"].push(dt);
        });
        allKyouryokujigyousyo = [...allKyouryokujigyousyo, ...brosJougen];
      });
    }
    const maxPageIndex = allKyouryokujigyousyo.length ?Math.ceil(allKyouryokujigyousyo.length/KYOURYOKUJIGYOUSYO_MAX_COLS) :1;
    let pageIndex = 0;
    const oneUserPageNodes = [];
    do{
      pageIndex++;
      const onePageProps = {
        siblingUsers, com, schedule, stdDate, billingDts: bDts,
        hidePersonalInfo, maxPageIndex, pageIndex
      };
      oneUserPageNodes.push(
        <JogenKanriPage key={`jogenKanriPage${pageIndex}-${index+1}`} {...onePageProps} />
      );
    }while(pageIndex < maxPageIndex);
    return oneUserPageNodes;
  })

  return(
    <div>
      {pageNodes}
    </div>
  )
}