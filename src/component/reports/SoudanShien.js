import React from 'react';
import { makeStyles } from "@material-ui/core"
import { getDateEx } from '../../commonModule';

const HNO_DIGITS = 10;
const JINO_DIGITS = 10;
const MAIN_TABLE_BODY_MAXROWS = 30;
const SERVICECODE_DIGITS = 6;
const TANNI_DIGITS = 4;
const COUNT_DIGITS = 2;
const SERVICETANNI_DIGITS = 5;

const useStyles = makeStyles({
  page: {
    margin: '128px auto',
    '& table': {
      border: '2px solid',
      '& th, td': {
        fontSize: 16, fontWeight: 'normal',
        textAlign: 'center',
        padding: 2,
        border: '1px solid', borderCollapse: 'collapse',
        height: 18
      },
      '& .thinColumn': {
        width: 16,
      }
    },
    '& .title': {textAlign: 'center', fontSize: '1.8rem', marginBottom: 16},
    '& .table': {
      '&:not(:last-child)': {
        marginBottom: 16
      }
    },
    '& .tableFlex': {display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'},
    '@media print': {
      margin: "4px 0 0 0",
      '&:not(:last-child)': {pageBreakAfter: 'always'},
    }
  },
  jigyosyoInfoTable: {
    '& .bnameTitle': {width: '8rem'}
  },
  mainTable: {
    width: '100%',
    '& .borderBold': {border: '2px solid'},
    '& .serviceContent': {
      width: '20rem',
    },
    '& td.serviceContent': {
      textAlign: 'start'
    }
  },
  indexTable: {
    marginLeft: 'auto'
  }
});

const NumberTds = (props) => {
  const classes = useStyles();
  const {number, maxNumberLength=1, cellWidth=20} = props;
  const numberStrs = (number || number===0) ?[...String(number)] :[];
  while(numberStrs.length < maxNumberLength){
    numberStrs.unshift("");
  };
  return numberStrs.map((str, i) => (
    <td
      key={"numberTds"+i}
      className={classes.numberTd}
      style={{width: cellWidth}}
    >
      {str}
    </td>
  ));
}

const CityNumberTable = ({user}) => {
  const classes = useStyles();

  return(
    <table className={classes.cityNumberTable}>
      <tbody>
        <tr>
          <th>都道府県等番号</th>
          <NumberTds number={user?.scity_no ?? ""} maxNumberLength={6} />
        </tr>
      </tbody>
    </table>
  )
}

const DateTable = ({stdDate}) => {
  const classes = useStyles();

  const [year, month, date] = stdDate.split("-");
  const dateEx = getDateEx(year, month, date);
  const gengou = dateEx?.wr?.l ?? "";
  const wry = dateEx?.wr?.y ?String(dateEx.wr.y).padStart(2, '0') :"";

  return(
    <table className={classes.dateTable}>
      <tbody>
        <tr>
          <td>{gengou}</td>
          <NumberTds number={wry} maxNumberLength={2} />
          <td>年</td>
          <NumberTds number={month} maxNumberLength={2} />
          <td>月分</td>
        </tr>
      </tbody>
    </table>
  )
}

const UserInfoTable = ({user}) => {
  const classes = useStyles();

  return(
    <table className={classes.userInfoTable}>
      <tbody>
        <tr>
          <th>受給者証番号</th>
          <NumberTds number={user?.hno ?? ""} maxNumberLength={HNO_DIGITS} />
        </tr>
        <tr>
          <th>支給決定障害者<br />氏名</th>
          <td colSpan={HNO_DIGITS}>{user?.name}</td>
        </tr>
      </tbody>
    </table>
  )
}

const deleteServiceNameDelimiter = (serviceName) => {
  if(serviceName && serviceName.endsWith("・")){
    return serviceName.slice(0, -1);
  }
  return serviceName
}

const JigyosyoInfoTable = ({com, service}) => {
  const classes = useStyles();

  const chikikubun = com?.addiction?.[service]?.["地域区分"]
    ?? com?.addiction?.["放課後等デイサービス"]?.["地域区分"]
    ?? com?.addiction?.["児童発達支援"]?.["地域区分"];

  return(
    <table className={classes.jigyosyoInfoTable}>
      <tbody>
        <tr>
          <th rowSpan={3} className='thinColumn'>請求事業所</th>
          <th>指定事業所番号</th>
          <NumberTds number={com?.jino ?? ""} maxNumberLength={JINO_DIGITS} cellWidth={32} />
        </tr>
        <tr>
          <th rowSpan={2} className='bnameTitle'>事業者及びその事業所の名称</th>
          <td colSpan={JINO_DIGITS}>{com?.bname ?? ""}</td>
        </tr>
        <tr>
          <th colSpan={3}>地域区分</th>
          <td colSpan={7}>{chikikubun ?? ""}</td>
        </tr>
      </tbody>
    </table>
  )
}

const MainTable = ({bDt}) => {
  const classes = useStyles();

  const itemTotal = bDt?.itemTotal ?? [];
  const rowLength = itemTotal.length > MAIN_TABLE_BODY_MAXROWS ?itemTotal.length :MAIN_TABLE_BODY_MAXROWS;
  const bodyTrs = Array(rowLength).fill(null).map((_, i) => {
    const item = itemTotal[i];
    return(
      <tr key={`mainTableBody${i+1}`}>
        <td className='serviceContent'>{deleteServiceNameDelimiter(item?.c ?? "")}</td>
        <NumberTds number={item?.s ?? ""} maxNumberLength={SERVICECODE_DIGITS}/>
        <NumberTds number={item?.v ?? ""} maxNumberLength={TANNI_DIGITS}/>
        <NumberTds number={item?.count ?? ""} maxNumberLength={COUNT_DIGITS}/>
        <NumberTds number={item?.tanniNum ?? ""} maxNumberLength={SERVICETANNI_DIGITS}/>
        <td></td>
      </tr>
    )
  });

  return(
    <table className={classes.mainTable}>
      <colgroup className='borderBold' />
      <colgroup className='borderBold' />
      <colgroup className='borderBold' span={SERVICECODE_DIGITS} />
      <colgroup className='borderBold' span={TANNI_DIGITS} />
      <colgroup className='borderBold' span={COUNT_DIGITS} />
      <colgroup className='borderBold' span={SERVICETANNI_DIGITS} />
      <colgroup className='borderBold' />
      <tbody>
        <tr>
          <th rowSpan={rowLength+1} className='thinColumn'>給付費明細欄</th>
          <th className='serviceContent'>サービス内容</th>
          <th colSpan={SERVICECODE_DIGITS}>サービスコード</th>
          <th colSpan={TANNI_DIGITS}>単位数</th>
          <th colSpan={COUNT_DIGITS}>回数</th>
          <th colSpan={SERVICETANNI_DIGITS}>サービス単位数</th>
          <th>摘要</th>
        </tr>
        {bodyTrs}
      </tbody>
    </table>
  )
}

const IndexTable = () => {
  const classes = useStyles();

  return(
    <table className={classes.indexTable}>
      <tr>
        <NumberTds number={"1"} maxNumberLength={2} />
        <td>枚中</td>
        <NumberTds number={"1"} maxNumberLength={2} />
        <td>枚目</td>
      </tr>
    </table>
  )
}

export const SoudanShienTuusyokyuuhuMeisaiPage = (props) => {
  const classes = useStyles();
  const {bDt, com, user, stdDate, service, title, reportDateDt} = props;

  return(
    <div className={classes.page}>
      <div className="title">{title}給付費明細書</div>
      <div className='table tableFlex'>
        <CityNumberTable user={user} />
        <DateTable stdDate={stdDate} />
      </div>
      <div className='table tableFlex'>
        <UserInfoTable user={user} />
        <JigyosyoInfoTable com={com} service={service} />
      </div>
      <div className='table'>
        <MainTable bDt={bDt} />
      </div>
      <div className='table'>
        <IndexTable />
      </div>
    </div>
  )
}