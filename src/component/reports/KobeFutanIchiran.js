import React from 'react';
import { makeStyles } from "@material-ui/core"
import { useSelector } from "react-redux";
import { formatDate, formatNum, getDateEx, getHiddenName, getLodingStatus, parseDate } from "../../commonModule";
import { LoadingSpinner } from "../common/commonParts";
import { setBillInfoToSch } from '../Billing/blMakeData';
import { serviceSyubetu } from "../Billing/BlCalcData";
import { getOtherOffices } from '../Setting/RegistedParams';
import { DateTable, KOBE_REPORT_STYLES, ReportPageIndex } from './KobeJogenKanri';
import { ReportWarningWrapper } from './Reports';

const MAIN_TABLE_ROWS = 5

const useStyles = makeStyles({
  ...KOBE_REPORT_STYLES,
  providerAndDateTable: {
    '& .num': {
      textAlign: 'end',
      padding: '0px 8px !important'
    },
    '& .saki': {
      fontSize: 20,
    },
    '& .jigyousyoName': {
      height: '8rem', lineHeight: '8rem',
      textAlign: 'center'
    },
    '& .honorificTitle': {textAlign: 'end'}
  },
  jigyosyoInfoTable: {
    width: '60%'
  },
  mainTable: {
    width: '100%',
    '& th, td': {
      '&:not(.num)': {
        padding: '0px !important'
      }
    }
  }
})

const PrintDate = (props) => {
  const {stdDate, schedule, service, reportDateDt} = props;

  const tDate = parseDate(stdDate).date.dt;
  // const nDate = new Date(tDate.getFullYear(), tDate.getMonth() + 1, 15);
  const nDate = new Date();
  const jtInit = formatDate(nDate, 'YYYY-MM-DD');
  // const jtDate = schedule?.report?.[service]?.["利用者負担額一覧表"] ?? jtInit;
  // const jtDate = reportDateDt?.["利用者負担額一覧表"] ?? jtInit;
  const jtDate = localStorage.getItem("reportsSettingDate")
    ?JSON.parse(localStorage.getItem("reportsSettingDate"))?.["利用者負担額一覧表"] ?? jtInit
    :jtInit;
  const jtDateParts = jtDate.split("-");
  const dateEx = getDateEx(jtDateParts[0], jtDateParts[1], jtDateParts[2]);
  const wareki = dateEx.wr.l;
  const warekiYear = String(dateEx.wr.y).padStart(2, "0");
  const month = String(dateEx.m).padStart(2, "0");
  const date = String(dateEx.d).padStart(2, '0');
  const wrdate = `${wareki}${warekiYear}年${month}月${date}日`;

  return(<div style={{textAlign: 'end', marginBottom: 32}}>{wrdate}</div>)
}

const ProviderAndDateTable = (props) => {
  const classes = useStyles();
  const {jigyousyoName, stdDate} = props;
  
  return(
    <div className={classes.providerAndDateTable}>
      <div style={{marginBottom: 16}}>
        <div className='saki'>（提供先）</div>
        <div className='jigyousyoName'>{jigyousyoName}</div>
        <div className='honorificTitle'>様</div>
      </div>
      <div style={{marginBottom: 16}}>下記のとおり提供します。</div>
      <DateTable stdDate={stdDate} style={{margin: 0}} />
    </div>
  )
}

const JigyosyoInfoTable = (props) => {
  const classes = useStyles();
  const {com} = props;
  const jino = com?.jino ?? "";
  const city = com?.city ?? "";
  const address = com?.address ?? "";
  const tel = com?.tel ?? "";
  const bname = com?.bname ?? "";

  return(
    <table className={classes.jigyosyoInfoTable}>
      <tbody>
        <tr>
          <th rowSpan="4" style={{width: 16}}>事業者</th>
          <th style={{height: 16}}>指定事業所番号</th>
          <td style={{width: '70%'}}>{jino}</td>
        </tr>
        <tr>
          <th>住　所<br/>（所在地）</th>
          <td>{city}<br/>{address}</td>
        </tr>
        <tr>
          <th style={{height: 16}}>電話番号</th>
          <td>{tel}</td>
        </tr>
        <tr>
          <th>名称</th>
          <td>{bname}</td>
        </tr>
      </tbody>
    </table>
  )
}

const UserRowNode = (props) => {
  const {index, billingDt, hidePersonalInfo} = props;
  //項番
  const rowIndex = billingDt ?index+1 :"";
  //市町村番号
  const cityNum = billingDt?.scityNo ?? "";
  //負担上限月額（国）
  const upperLimit = billingDt?.priceLimit ?? "";
  //受給者証番号
  const hno = billingDt?.hno ?? "";
  //負担上限月額（市福祉部分）
  const kobeUpperLimit = billingDt?.dokujiJougen ?? "";
  //給付決定保護者等氏名
  const pname = getHiddenName(billingDt?.pname ?? "", hidePersonalInfo);
  //支給決定児童氏名
  const name = getHiddenName(billingDt?.name ?? "", hidePersonalInfo);
  //総費用額
  const totalAmount = billingDt?.userSanteiTotal ?? "";
  //利用者負担額
  const riyosyaHutan = (() => {
    if(!billingDt) return "";
    let hutan = 0;
    if(billingDt.tashikeigen === 2) hutan = Math.floor(totalAmount * 0.05);
    else if(billingDt.tashikeigen === 3) hutan = 0;
    else hutan = Math.floor(parseInt(totalAmount) * 0.1);
    return Math.min(hutan, (upperLimit || hutan), (kobeUpperLimit || hutan));
  })();
  const ichiwari = billingDt?.ichiwari ?? "";
  //提供サービス
  const serviceSyubetuList = billingDt?.serviceSyubetu ?? [];
  const serviceNodes = Array(4).fill(null).map((_, i) => {
    const syubetu = serviceSyubetuList[i] ?? "";
    const serviceName = syubetu ?serviceSyubetu[syubetu] :"";
    const addClassName = i+1===4 ?"boldBorderBottom" :""
    return(
      <>
      <td className={`lines2 ${addClassName}`} style={{width: '3%', fontSize: 14}}>{syubetu}</td>
      <td className={`lines2 ${addClassName}`} style={{width: '16%', fontSize: 14}}>{serviceName}</td>
      </>
    )
  });

  return(
    <>
    <tr>
      <th rowSpan="4" className='boldBorder' style={{width: '3%'}}>{rowIndex}</th>
      <th className='lines2' style={{width: '9%'}}>市町村番号</th>
      <td className='lines2'>{cityNum}</td>
      <th className='lines2' style={{width: '18%'}}>
        負担上限月額<br></br>（神戸市独自減免前）
      </th>
      <td className='lines2 num' style={{width: '18%'}}>{formatNum(upperLimit, 1)}</td>
      <th rowSpan="4" className='boldBorderBottom' style={{width: '9%'}}>提供サービス</th>
      {serviceNodes[0]}
    </tr>
    <tr>
      <th className='lines2'>受給者証番号</th>
      <td className='lines2'>{hno}</td>
      <th className='lines2'>
        負担上限月額<br></br>（神戸市独自減免後）
      </th>
      <td className='lines2 num'>{formatNum(kobeUpperLimit, 1)}</td>
      {serviceNodes[1]}
    </tr>
    <tr>
      <th className='lines2'>給付決定<br/>保護者等氏名</th>
      <td className='lines2'>{pname}</td>
      <th className='lines2'>総費用額</th>
      <td className='lines2 num'>{formatNum(totalAmount, 1)}</td>
      {serviceNodes[2]}
    </tr>
    <tr>
      <th className='lines2 boldBorderBottom'>支給決定<br/>児童氏名</th>
      <td className='lines2 boldBorderBottom'>{name}</td>
      <th className='lines2 boldBorderBottom'>利用者負担額（1割）</th>
      <td className='lines2 boldBorderBottom num'>{formatNum(ichiwari, 1)}</td>
      {serviceNodes[3]}
    </tr>
    </>
  )
}

const MainTable = (props) => {
  const classes = useStyles();
  const {jigyosyoUidStrs, billingDts, pageIndex, hidePersonalInfo} = props;

  const userRowNodes = Array(MAIN_TABLE_ROWS).fill(null).map((_, index) => {
    const uidStr = jigyosyoUidStrs[index+(MAIN_TABLE_ROWS*(pageIndex-1))];
    const billingDt = billingDts.find(bDt => bDt.UID === uidStr);
    const userRowProps = {index, billingDt, hidePersonalInfo};
    return(<UserRowNode key={`userRow${index+1}`} {...userRowProps} />)
  });

  return(
    <table className={classes.mainTable}>
      <thead>
        <tr>
          <th className='boldBorder'>項番</th>
          <th colSpan="7" className='boldBorder' style={{fontSize: 18, height: 28}}>
            支給決定利用者等欄
          </th>
        </tr>
      </thead>
      <tbody>{userRowNodes}</tbody>
    </table>
  )
}

const KobeFutanIchiranOnePage = (props) => {
  const classes = useStyles()
  const {
    jigyosyoUidStrs, billingDts, jigyousyoName, stdDate, com, schedule, service,
    pageIndex, maxPageIndex, hidePersonalInfo, reportDateDt
  } = props;

  const printDateProps = {stdDate, schedule, service, reportDateDt};
  const providerAndDateTableProps = {jigyousyoName, stdDate};
  const mainTableProps = {jigyosyoUidStrs, billingDts, pageIndex, maxPageIndex, hidePersonalInfo};
  const pageIndexProps = {pageIndex, maxPageIndex}
  return(
    <div className={classes.entireTable}>
      <div className='pageTitle'>利用者負担額一覧表票</div>
      <PrintDate {...printDateProps}/>
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 32}}>
        <ProviderAndDateTable {...providerAndDateTableProps} />
        <JigyosyoInfoTable com={com} />
      </div>
      <MainTable {...mainTableProps} />
      <ReportPageIndex {...pageIndexProps}/>
    </div>
  )
}

export const KobeFutanIchiran = (props) => {
  const classes = useStyles();
  const {userList, preview, hidePersonalInfo, selects, reportDateDt, ...others} = props;
  const allState = useSelector(state => state);
  if (!(preview==='利用者負担額一覧表' && selects[preview]==='神戸市形式')) return null;
  const loadingStatus = getLodingStatus(allState);
  if(!loadingStatus.loaded) return (<LoadingSpinner/>);
  const {com, users, schedule, stdDate, service, serviceItems} = allState;
  const billingParams = { calledBy: "KobeJogenKanri", stdDate, schedule, users, com, service, serviceItems };
  const { billingDt } = setBillInfoToSch(billingParams);
  const targetUsers = users.filter(user => userList.some(u => u.checked && u.uid===user.uid));
  const offices = getOtherOffices(users);
  const uidStrsPerKanriJigyousyo = targetUsers.reduce((result, user) => {
    if(user.kanri_type !== "協力事業所") return result;
    const bDt = billingDt.find(dt => dt.UID === "UID"+user.uid);
    const kanriJigyosyo = bDt?.["管理事業所"]?.[0] ?? user?.etc?.["管理事業所"]?.[0];
    if(!(kanriJigyosyo && Object.keys(kanriJigyosyo).length)) return result;
    const jino = kanriJigyosyo.no;
    if(!result[jino]) result[jino] = [];
    result[jino].push("UID"+user.uid);
    return result;
  }, {});
  const pageNodes = Object.keys(uidStrsPerKanriJigyousyo).flatMap((jino, i) => {
    const jigyosyoUidStrs = uidStrsPerKanriJigyousyo[jino];
    const jigyousyoDt = offices.find(officeDt => officeDt.no === jino);
    const jigyousyoName = jigyousyoDt?.lname ?jigyousyoDt?.lname :jigyousyoDt?.name ?? "";
    const maxPageIndex = jigyosyoUidStrs.length ?Math.ceil(jigyosyoUidStrs.length/MAIN_TABLE_ROWS) :1;
    let pageIndex = 0;
    const oneUserPageNodes = [];
    do{
      pageIndex++;
      const props = {
        jigyosyoUidStrs, billingDts: billingDt, jigyousyoName, stdDate, com, schedule, service,
        pageIndex, maxPageIndex, hidePersonalInfo, reportDateDt
      };
      oneUserPageNodes.push(<KobeFutanIchiranOnePage key={`page${i+1}-${pageIndex}`} {...props} />)
    }while(pageIndex < maxPageIndex);
    return oneUserPageNodes;
  })

  const warningUserNames = users.filter(user => {
    if(user.kanri_type === "協力事業所"){
      const kanriJigyosyoDt = user?.etc?.["管理事業所"]?.[0] ?? {};
      if(!(kanriJigyosyoDt.name && kanriJigyosyoDt.no)){
        if(user.name && !user.name.includes(" ")) return true;
      }
    }
    return false;
  }).map(user => user.name);;
  const warningKyoryokuUserNames = users.filter(user => {
    if(user.kanri_type === "協力事業所"){
      const kanriJigyosyoDt = user?.etc?.["管理事業所"]?.[0] ?? {};
      if(!(kanriJigyosyoDt.name && kanriJigyosyoDt.no)) return true;
    }
    return false;
  }).map(user => user.name);
  const warningMsg = warningKyoryokuUserNames.length
    ?"以下の利用者には管理事業所情報が登録されていません。"
    :"利用者名が正しく設定されていることを確認してください。\n以下の利用者には「個人情報を隠す」が機能していません。";
  return(
    <div className={classes.pages}>
      {pageNodes}
      <ReportWarningWrapper userNames={warningKyoryokuUserNames || warningUserNames} warningMsg={warningMsg} />
    </div>
  )
}