import { Button, makeStyles } from '@material-ui/core';
import React from 'react';
import { useSelector,  } from 'react-redux';
import { formatDate, getDateEx } from '../../commonModule';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import { useHistory } from 'react-router';
import { checkValueType } from '../dailyReport/DailyReportCommon';

const useStyle = makeStyles({
  wholePage: {
    '&@media print': {marginTop: 0}
  },
  dialogOpenButtonRoot:{
    position: 'fixed',
    top: 104,
    right: 16,
    '& .buttonText':{
      display: 'flex',
    },
    '& .buttonText soan':{
      display: 'block',
    },
    '& .buttonText span:nth-of-type(1)' :{
      fontSize: '.6rem',
      margin: '.7rem 2px 0',
      marginLeft: '.6rem',
    },
    '& .buttonText span:nth-of-type(2)': {
      fontSize: '1.2rem',
      margin: '0 2px 0'
    },
    '& .buttonText span:nth-of-type(3)': {
      fontSize: '.6rem',
      margin: '.7rem 2px 0'
    },
    '& .scheduleCount' : {
      padding: 6,
      textAlign: 'center',
      '& span' :{
        color:'#00695c',
        fontWeight: 'bold',
      }
    },
  },
  userContractReports: {
    width: '80%',
    margin: '100px auto 200px auto',
    '& .cellText': {
      padding: 4,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
    }
  },
  ucrTitle: {
    '& .title': {
      textAlign: 'center',
      fontWeight: 'bold'
    },
    '& .date': {
      textAlign: 'end',
      margin: '16px 0',
      '& .notDisplay': {margin: '1rem'}
    },
    '& .addressInfo': {
      display: 'flex',
      justifyContent: 'space-between',
      margin: '32px 0',
      '& .destination': {
        border: '1px dotted',
        width: '48%', padding: 16,
        '& .cityAddress': {
          height: '80%'
        },
        '& .mayor': {
          // textAlign: 'center'
          alignItems: 'center', justifyContent:'center', display:'flex',
        }
      },
      '& .officeInfo': {
        textAlign: 'center',
        border: '1px solid',
        width: '48%',
        '& .jinoInfo': {
          display: 'flex',
          borderBottom: '1px solid',
          '& .subTitle': {
            width: '30%'
          },
          '& .jino': {
            width: '70%',
            display: 'flex',
            '& .jinoCell': {width: '10%', borderLeft: '1px solid'}
          }
        },
        '& .officeAddress': {
          display: 'flex',
          '& .comInfo':{width: '30%', flexDirection: 'column'},
          '& .comInfoVal': {
            width: '70%', borderLeft: '1px solid', flexDirection: 'column',
            alignItems: 'baseline', textAlign: 'start', justifyContent: 'start'
          },
          '& .daihyoName': {marginTop: 16, minHeight: '1.5rem'},
        }
      }
    },
    '& .msg': {margin: '32px 0'},
    '& .mark': {margin: '32px 0', textAlign: 'center'}
  },
  ucrMain: {
    '& .cellBorder': {border: '1px solid', marginLeft: -1, marginTop: -1},
    '& .subheadline': {textAlign: 'initial', marginBottom: 8},
    '& .userInfo': {
      textAlign: 'center', margin: '32px 0',
      '& .hnoInfo': {
        display: 'flex',
        '& .hno': {
          display: 'flex',
          '& .hnoCell': {width: '10%', borderTop: '1px solid', borderRight: '1px solid', marginTop: -1, marginRight: -0.1}
        }
      },
      '& .nameInfo': {
        display: 'flex',

      }
    },
    '& .contracts': {
      margin: '32px 0',
      '& .subTitle': {display: 'flex'}, '& .contract': {display: 'flex'},
      '& .preVol': {width: '10%'}, '& .service': {width: '12%'}, '& .preLineNo': {width: '15%'},
      '& .preContDate': {width: '23%'}, '& .preEndDate': {width: '20%'},
      '& .preUseCount': {width: '25%'}, '& .reason': {width: '40%'},
      '& .disabled': {backgroundColor: "#aaa"}
    },
    '& .contract': {
      '& .reason': {
        display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', border: '1px solid', marginLeft: -1, marginTop: -1,
        '& .reasonCell': {
          width: '100%', display: 'flex', alignItems: 'center',
          '& span': {margin: '0 0.5rem'},
        },
        '& .reasonCenterLine': {width: '100%', borderBottom: '1px solid'}
      }
    }
  }
});

const UCReportTitle = ({user}) => {
  const classes = useStyle();
  const com = useSelector(state => state.com);
  const jino = String(com.jino).padStart(10, '0');
  const jinoStrNode = [...jino].map((num, i) => <div key={`${jino}-${i}`} className='jinoCell cellText'>{num}</div>);
  
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const thisService = service ?service :serviceItems[0];

  const nDate = new Date();
  const jtInit = formatDate(nDate, 'YYYY-MM-DD');
  const jtDate = localStorage.getItem("reportsSettingDate")
    ?JSON.parse(localStorage.getItem("reportsSettingDate"))?.["契約内容報告書"] ?? jtInit
    :jtInit;
  const [year, month, date] = jtDate.split("-");
  const dateEx = getDateEx(year, month, date);
  const wareki = dateEx.wr.l;
  const warekiYear = String(dateEx.wr.y).padStart(2, "0");

  const displayMayor = com?.ext?.reportsSetting?.keiyakunaiyou?.displayMayor ?? com?.etc?.configReports?.keiyakunaiyou?.displayMayor ?? false;
  const displayDate = com?.ext?.reportsSetting?.keiyakunaiyou?.displayDate ?? com?.etc?.configReports?.keiyakunaiyou?.displayDate ?? false;
  
  return(
    <div className={classes.ucrTitle}>
      {!service.includes("相談支援") &&<div className='title'>（児童発達支援、医療型児童発達支援、放課後等デイサービス、保育所等訪問支援）<br/>契約内容（通所受給者証記載事項）報告書</div>}
      {service.includes("相談支援") &&<div className='title'>{thisService}　契約内容報告書</div>}
      <div className='date'>
        {displayDate &&<><span>{wareki}</span><span>{warekiYear}</span>年<span>{month}</span>月<span>{date}</span>日</>}
        {!displayDate &&<><span className='notDisplay'/><span className='notDisplay'/>年<span className='notDisplay'/>月<span className='notDisplay'/>日</>}
      </div>
      <div className='addressInfo'>
        <div className='destination'>
          {!displayMayor &&
            <div className='cityAddress'>
              <div className='postal'>〒</div>
            </div>
            }
          {displayMayor &&<div className='mayor'><div>{user.scity}長殿</div></div>}
        </div>
        <div className='officeInfo'>
          <div className='jinoInfo'>
            <div className='subTitle cellText'>事業所番号</div>
            <div className='jino'>{jinoStrNode}</div>
          </div>
          <div className='officeAddress'>
            <div className='subTitle comInfo cellText'>
              <div>事業者及びその事業所の名称</div>
              <div className='daihyoName'>代表者</div>
            </div>
            <div className='comInfoVal cellText'>
              <div style={{marginBottom: 4}}>{(com?.ext?.hname || com.hname).replace(/^\s+|\s+$/g, '')}</div>
              <div>{com.bname}</div>
              <div className='daihyoName'>
                {
                  `${(com?.ext?.daihyouyakusyoku || com?.daihyouyakusyoku)}
                   ${ (com?.ext?.daihyou || com?.daihyou)}`
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='msg'>下記のとおり当事業者との契約内容（通所受給者証記載事項）について報告します。</div>
      <div className='mark'>記</div>
    </div>
  )
}

const UCReport = ({user}) => {
  const classes = useStyle();
  const stdDate = useSelector(state => state.stdDate);
  const userContractInfos = user?.ext?.userContractInfo ?? {};
  const hno = String(user.hno).padStart(10, '0');
  const hnoStrNode = [...hno].map((num, i) => <div key={`${hno}-${i}`} className='hnoCell cellText'>{num}</div>);
  const rowNum = 4;
  const uciServiceList = Object.keys(userContractInfos).map(uciService => (
    typeof userContractInfos[uciService] === 'object'
      && userContractInfos[uciService].stdDate === stdDate
        ?uciService :false
  )).filter(x => x);
  const cBoxStyle = {fontSize: '16px'};
  const NewContracts = () => {
    const rowNode = [];
    const isMultiSvc = user.service.split(',').length > 1;
    const multiSvc = isMultiSvc ?user?.etc?.multiSvc ?? {} :{};
    for(let i=0;i<rowNum;i++){
      const service = uciServiceList[i] ?? "";
      const contractDt = multiSvc[service] ?? user;
      const userContractInfo = userContractInfos[service] ?? {};
      const select = userContractInfo.select;
      let preVol = "", preLineNo = "", preContDate = "", thisService = "";
      let cBoxNewIcon = <CheckBoxOutlineBlankIcon style={cBoxStyle}/>, cBoxChangeIcon = <CheckBoxOutlineBlankIcon style={cBoxStyle}/>;
      if(select==="新規" || select==="変更"){
        const lineNo = contractDt?.lineNo ?? "";
        preLineNo = String(lineNo);
        const volume = contractDt?.volume ?? "";
        preVol = String(volume)+"日";
        const contractDate = contractDt?.contractDate ?? "";
        const date_list = contractDate.split("-").map(x => parseInt(x));
        const date = getDateEx(date_list[0], date_list[1], date_list[2]);
        const wareki = date.wr.l;
        const wareki_year = String(date.wr.y).padStart(2, "0");
        const month = String(date.m).padStart(2, "0");
        const wareki_date = String(date.d).padStart(2, "0");
        preContDate = `${wareki}${wareki_year}年${month}月${wareki_date}日`;
        if(select==="新規") cBoxNewIcon = <CheckBoxIcon style={cBoxStyle}/>;
        else if(select==="変更") cBoxChangeIcon = <CheckBoxIcon style={cBoxStyle}/>
        thisService = service;
      }
      const isSodan = service.includes("相談支援");
      rowNode.push((
        <div key={`newContracts-${hno}-${i}`} className='contract'>
          <div className='preLineNo cellText cellBorder'>{preLineNo}</div>
          <div className='service cellText cellBorder'>{thisService}</div>
          <div className={`preVol cellText cellBorder ${isSodan ?"disabled" :""}`}>{!isSodan ?preVol==="0日" ?"原則の日数" :preVol :""}</div>
          <div className='preContDate cellText cellBorder'>{preContDate}</div>
          <div className='reason'>
            <div className='reasonCell'>{cBoxNewIcon}<span>１</span>新規契約</div>
            <div className='reasonCenterLine'></div>
            <div className='reasonCell'>{cBoxChangeIcon}<span>２</span>契約の変更</div>
          </div>
        </div>
      ))
    }
    return rowNode
  }
  const EndContracts = () => {
    const rowNode = [];
    const isMultiSvc = user.service.split(',').length > 1;
    const multiSvc = isMultiSvc ?user?.etc?.multiSvc ?? {} :{};
    for(let i=0;i<rowNum;i++){
      const service = uciServiceList[i] ?? "";
      const contractDt = multiSvc[service] ?? user;
      const userContractInfo = userContractInfos[service] ?? {};
      const select = userContractInfo.select;
      let preLineNo = "", preEndDate = "", preUseCount = "",
      cBoxEndIcon = <CheckBoxOutlineBlankIcon style={cBoxStyle}/>, cBoxChangeIcon = <CheckBoxOutlineBlankIcon style={cBoxStyle}/>;
      if(select==="終了" || select==="変更"){
        const lineNo = contractDt?.lineNo ?? "";
        preLineNo = select==="変更" ?String(userContractInfo.preLineNo) :lineNo;
        const date_list = (select==="変更" ?userContractInfo.preEndDate :contractDt.contractEnd).split("-");
        const date = getDateEx(date_list[0], date_list[1], date_list[2]);
        const wareki = date.wr.l;
        const wareki_year = String(date.wr.y).padStart(2, "0");
        const month = String(date.m).padStart(2, "0");
        const wareki_date = String(date.d).padStart(2, "0");
        preEndDate = `${wareki}${wareki_year}年${month}月${wareki_date}日`;
        preUseCount = userContractInfo.preUseCount ?String(userContractInfo.preUseCount)+"日" :"";
        if(select==="終了") cBoxEndIcon = <CheckBoxIcon style={cBoxStyle}/>;
        else if(select==="変更") cBoxChangeIcon = <CheckBoxIcon style={cBoxStyle}/>
      }
      const isSodan = service.includes("相談支援");
      rowNode.push((
        <div key={`endContracts-${hno}-${i}`} className='contract'>
          <div className='preLineNo cellText cellBorder'>{preLineNo}</div>
          <div className='preEndDate cellText cellBorder'>{preEndDate}</div>
          <div className={`preUseCount cellText cellBorder ${isSodan ?"disabled" :""}`}>{!isSodan ?preUseCount :""}</div>
          <div className='reason'>
            <div className='reasonCell'>{cBoxEndIcon}<span>１</span>契約の終了</div>
            <div className='reasonCenterLine'></div>
            <div className='reasonCell'>{cBoxChangeIcon}<span>２</span>契約の変更</div>
          </div>
        </div>
      ))
    }
    return rowNode
  }

  return(
    <div className={classes.ucrMain}>
      <div className='userInfo'>
        <div className='subheadline'>報告対象者</div>
        <div>
          <div className='hnoInfo'>
            <div className='cellText cellBorder' style={{width: '15%'}}>受給者証番号</div>
            <div className='hno' style={{width: '40%'}}>{hnoStrNode}</div>
          </div>
          <div className='nameInfo'>
            <div className='cellText cellBorder' style={{width: '15%'}}>通所給付決定保護者氏名</div>
            <div className='pName cellText cellBorder' style={{width: '40%'}}>{user.pname}</div>
            <div className='cellText cellBorder' style={{width: '20%'}}>給付決定に係る児童氏名</div>
            <div className='name cellText cellBorder' style={{width: '25%'}}>{user.name}</div>
          </div>
        </div>
      </div>
      <div className='contracts'>
        <div className='subheadline'>契約締結又は契約内容変更による契約支給量等の報告</div>
        <div>
          <div className='subTitle'>
            <div className='preLineNo cellText cellBorder'>受給者証の事業者記入欄の番号</div>
            <div className='service cellText cellBorder'>サービス内容</div>
            <div className='preVol cellText cellBorder'>契約支給量</div>
            <div className='preContDate cellText cellBorder'>契約日(又は契約支給量を変更した日)</div>
            <div className='reason cellText cellBorder'>理<span style={{marginRight: '4rem'}}/>由</div>
          </div>
          <NewContracts />
        </div>
      </div>
      <div className='contracts'>
        <div className='subheadline'>既契約の契約支給量によるサービス提供を終了した報告</div>
        <div>
          <div className='subTitle'>
            <div className='preLineNo cellText cellBorder'>提供を終了する事業者記入欄の番号</div>
            <div className='preEndDate cellText cellBorder'>提供終了日</div>
            <div className='preUseCount cellText cellBorder'>提供終了月中の終了日までの既提供</div>
            <div className='reason cellText cellBorder'>既契約の契約支給量でのサービス提供を<br />終了する理由</div>
          </div>
          <EndContracts />
        </div>
      </div>
    </div>
  )
}

const Sheet = ({user}) => {
  const classes = useStyle();
  const stdDate = useSelector(state => state.stdDate);

  const userContractInfos = user?.ext?.userContractInfo ?? {};
  const uciServiceList = Object.keys(userContractInfos).map(uciService => (
    typeof userContractInfos[uciService] === 'object'
      && userContractInfos[uciService].stdDate === stdDate
        ?uciService :false
  )).filter(x => x);
  const isTarget = uciServiceList.some(service => userContractInfos[service].select)
  if(!isTarget) return null;
  
  return(
    <div className={`${classes.userContractReports} printPage`}>
      <UCReportTitle user={user} />
      <UCReport user={user} />
      <div className='pageBreak' />
    </div>
  )
}

const UserContractReports = (props) => {
  const {userList, preview} = props;
  const classes = useStyle();
  const history = useHistory();
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const serviceItems =  useSelector(state => state.serviceItems);
  const stdDate = useSelector(state => state.stdDate);
  const displayService = service ?? serviceItems[0];

  if(preview!=="契約内容報告書") return null;

  const filteredUsers = users.filter(user => {
    // データの型がObject
    if(!checkValueType(user, 'Object')) return false;

    // 表示しているサービス
    if(!new RegExp(displayService).test(user.service)) return false;

    // userListで選択されているか
    const isTarget = userList.find(dt => dt.uid === user.uid);
    if(!isTarget?.checked) return false;

    // 契約内容データがあるか
    const contractDt = user?.ext?.userContractInfo;
    if(!checkValueType(contractDt, 'Object')) return false;

    // 契約内容データに今月分のデータがあるか
    const triger = Object.keys(contractDt).some(thisService => (
      checkValueType(contractDt[thisService], "Object")
        && contractDt[thisService].stdDate === stdDate
        && (new RegExp(displayService).test(thisService))
    ));
    if(!triger) return false;

    return true;
  });
  const sheets = filteredUsers.map((user) => (
    <Sheet key={`sheet${user.uid}`} user={user} />
  ));

  if(!sheets.length) return(
    <div style={{marginTop: 120, marginRight: 60, textAlign: 'center'}}>
      <div style={{marginBottom: 16}}>契約内容報告書を登録してください。</div>
      <Button
        variant="outlined"
        onClick={() => {
          history.push("/reports/setting/contractInfo/")
        }}
        color="primary"
      >
        登録画面へ
      </Button>
    </div>
  )
  return(<div className={classes.sheets}>{sheets}</div>);
}
export default UserContractReports