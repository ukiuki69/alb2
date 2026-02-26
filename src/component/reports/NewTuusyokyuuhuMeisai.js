import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useSelector } from 'react-redux';
import * as comMod from '../../commonModule';
import {
  setBillInfoToSch, isKyoudaiJougen,
} from '../Billing/blMakeData';
import teal from '@material-ui/core/colors/teal';
import { LoadingSpinner } from '../common/commonParts';
import { SoudanShienTuusyokyuuhuMeisaiPage } from './SoudanShien';

// 通所給付明細
// 国定形式の代理受領通知明細も兼ねる

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

const useStyles = makeStyles({
  pages: {
    '& .onePage': {
      '&:not(:last-child)': {pageBreakAfter: 'always',}
    }
  },
  OnePage: {
    '@media print': {
      margin: '4px 0 0 0',
    },
    margin: '128px auto', 
    '& table': {
      border: '2px solid',
      '& tr': {
        '&:last-child': {
          '& td, th': {
            borderBottom: '1px solid'
          }
        },
        '& th, td': {
          textAlign: 'center',
          padding: 2,
          border: '1px solid', borderCollapse: 'collapse',
          height: 18
        },
        '& th': {
          fontSize: 16,
          fontWeight: 'normal'
        },
        '& td': {
          fontSize: 16,
        },
        '& .startDate, .endDate, .useCount, .hospitalCount': {
          fontSize: '0.6rem'
        },
        '& .wareki': {
          width: 32, fontSize: '0.8rem'
        },
        '& .application': {
          width: 160
        }
      }
    },
    '& .tables': {
      '& .group:not(:last-child)': {
        marginBottom: 24
      },
      '& .group': {
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }
    },
    '& .borderBold': {borderWidth: '2px'},
    '& .borderRightBold': {borderRight: '2px solid'},
    '& .borderBottomBold': {borderBottom: '2px solid'}
  },
  numberTd: {
    width: 20,
  },
  title: {
    textAlign: 'center', fontSize: '1.8rem',
    marginBottom: 32
  },
  authForm: {
    width: '90%', margin: '120px auto', maxWidth: 400,
    '& .text': {marginBottom: 12},
    '& .inputs': {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '12px 0',
      '& .yearInput': {
        width: 120,
      },
      '& .monthInput, .dateInput': {
        width: 80,
      },
      '& .dateParts': {
        marginLeft: 8, marginRight: 12 
      },
    },
    '& .errorText': {color: 'red', textAlign: 'end', marginBottom: 4},
    '& .sendButton': {
      textAlign: 'end',
      '& .button': {
        backgroundColor: teal[800], color: '#fff', fontWeight: 'bold',
      }
    },
  },
  serviceTypeTable: {

  },
  checkedButton: {
    '@media print': {
      display: 'none',
    },
    textAlign: 'center', marginBottom: 64,
  },
  closeButton: {
    '@media print': {
      display: 'none',
    },
    width: 900, margin: '64px auto 0',
    textAlign: 'end',
  }
});

const Title = (props) => {
  const {preview, com, stdDate, schedule, service, reportDateDt, specialStateDate} = props;
  const classes = useStyles();
  const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
  const tDate = comMod.parseDate(stdDate).date.dt;
  const nDate = new Date(tDate.getFullYear(), tDate.getMonth() + 2, 15);
  const jtInit = comMod.formatDate(nDate, 'YYYY-MM-DD');
  // const jtDate = reportDateDt?.['代理受領通知日'] ?? jtInit;
    // (comMod.findDeepPath(schedule, ['report', service, '代理受領通知日'])) ? 
    // schedule.report[service].代理受領通知日 : jtInit;
  let jtDate = localStorage.getItem("reportsSettingDate")
    ?JSON.parse(localStorage.getItem("reportsSettingDate"))?.["代理受領通知日"] ?? jtInit
    :jtInit;
  if(specialStateDate) jtDate = specialStateDate;
  const gengou = str2gdex(jtDate).wr.l; // 元号
  const wry = String(str2gdex(jtDate).wr.y).padStart(2, '0'); // 和暦の年
  const month = String(str2gdex(jtDate).m).padStart(2, '0');
  const day = String(str2gdex(jtDate).d).padStart(2, '0');

  if(preview === "通所給付費明細"){
    return(
      <div className={classes.title}>{(convJido ?'児童':'障害児')}通所給付費・入所給付費等明細書</div>
    )
  }
  if(preview === "代理受領通知"){
    const title = (() => {
      if(service === "計画相談支援") return "計画相談給付費・代理受領通知書";
      if(service === "障害児相談支援") return "障害児相談給付費・代理受領通知書";
      return `${convJido ?'児童':'障害児'}通所給付費・代理受領通知書`;
    })();
    return(
      <div className={`${classes.title} title`}>
        {title}
        <div className='subTitle' style={{fontSize: '1rem', padding: '8px 0'}}>{`下記の通り代理で受領しましたので通知します。(${gengou}${wry}年${month}月${day}日)`}</div>
      </div>
    )
  }
}

const NumberTds = (props) => {
  const classes = useStyles();
  const {number, maxNumberLength=1, cellWidth=20} = props;
  const numberStrs = (number || number===0) ?[...String(number)] :[];
  while(numberStrs.length < maxNumberLength){
    numberStrs.unshift("");
  };
  const result = numberStrs.map((str, i) => (
    <td key={"index"+i} className={classes.numberTd} style={{width: cellWidth}}>{str}</td>
  ));
  return result;
}

const CityNumberTable = (props) => {
  const classes = useStyles();
  const {bDt} = props;

  return(
    <table>
      <tbody>
        <tr><th>市町村番号</th><NumberTds number={bDt?.scityNo ?? ""} maxNumberLength={6} /></tr>
        <tr><th>助成自治体番号</th><NumberTds number={bDt?.joseiNo ?? ""} maxNumberLength={6} /></tr>
      </tbody>
    </table>
  )
}

const DateTable = (props) => {
  const classes = useStyles();
  const {stdDate} = props;
  const [year, month, date] = stdDate.split("-");
  const dateEx = comMod.getDateEx(year, month, date);
  const gengou = dateEx?.wr?.l ?? "";
  const wry = dateEx?.wr?.y ?String(dateEx.wr.y).padStart(2, '0') :"";

  return(
    <table>
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

const UserInfoTable = (props) => {
  const {bDt} = props;
  const com = useSelector(s=>s.com);
  const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
  const jStr = convJido? "児童": "障害児";

  return(
    <table style={{width: '40%'}}>
      <tbody>
        <tr>
          <th>受給者証番号</th>
          <NumberTds number={bDt?.hno ?? ""} maxNumberLength={10} />
        </tr>
        <tr>
          <th>支給決定保護者<br />氏名</th>
          <td colSpan={10}>{bDt?.pname ?? ""}</td>
        </tr>
        <tr>
          <th>支給決定に係る<br />{jStr}氏名</th>
          <td colSpan={10}>{bDt?.name ?? ""}</td>
        </tr>
      </tbody>
    </table>
  )
}

const JigyosyoInfoTable = (props) => {
  const {com, service} = props;

  let tkubun = com?.addiction?.[service]?.["地域区分"];
  tkubun = tkubun ?? com?.addiction?.["放課後等デイサービス"]?.["地域区分"];
  tkubun = tkubun ?? com?.addiction?.["児童発達支援"]?.["地域区分"];

  return(
    <table>
      <tbody>
        <tr>
          <th rowSpan={3} style={{width: 16, paddingTop: 4, paddingBottom: 4}}>請求事業所</th>
          <th style={{width: '10rem'}}>指定事業所番号</th>
          <NumberTds number={com?.jino ?? ""} maxNumberLength={10} cellWidth={32} />
        </tr>
        <tr>
          <th rowSpan={2}>事業所および<br />その事業所の名称</th>
          <td colSpan={10}>{com?.bname ?? ""}</td>
        </tr>
        <tr>
          <th colSpan={4}>地域区分</th>
          <td colSpan={6}>{tkubun}</td>
        </tr>
      </tbody>
    </table>
  )
}

const UpperLimitTable = (props) => {
  const {bDt} = props;

  return(
    <table>
      <tbody>
        <tr>
          <th style={{width: '10rem'}}>利用者負担上限額(1)</th>
          <NumberTds number={bDt?.adjustetUpperLimit ?? bDt?.upperlimit ?? ""} maxNumberLength={5} />
        </tr>
      </tbody>
    </table>
  )
}

const UpperLimitJigyosyoTable = (props) => {
  const {bDt, com} = props;
  const kanriJi = bDt?.jougenJi ?? '';
  const kanrikekka = bDt?.kanriKekka ?? "";
  const kanrikkekkaGaku = bDt?.kanrikekkagaku ?? "";
  const kanriJiName = com.jino === kanriJi ?com.bname :bDt?.jougenJiName ?? "";

  return(
    <table style={{width: '100%'}}>
      <tbody>
        <tr>
          <th rowSpan={2}>利用者負担上限額管理事業所</th>
          <th>指定事業所番号</th>
          <NumberTds number={kanriJi} maxNumberLength={10} />
          <th>管理結果</th>
          <NumberTds number={kanriJi ?kanrikekka :""} maxNumberLength={1} />
          <th>管理結果額</th>
          <NumberTds number={kanriJi ?kanrikkekkaGaku :""} maxNumberLength={5} />
        </tr>
        <tr>
          <th>事業所名称</th>
          <td colSpan={18}>{kanriJiName}</td>
        </tr>
      </tbody>
    </table>
  )
}

const str2gdex = (s) =>{
  return comMod.getDateEx(s.split('-')[0], s.split('-')[1], s.split('-')[2]);
}

const ServiceTypeTable = (props) => {
  const classes = useStyles();
  const {bDt, com, user} = props;

  const initContractInfo = {[user.service]: {
    contractDate: user.contractDate, contractEnd: user.contractEnd,
    startDate: user.startDate, volume: user.volume
  }}
  const contractInfoPerService = user.service.split(",").length >= 2
    ?(user?.etc?.multiSvc ?? initContractInfo)
    :initContractInfo;
  const nodes =  Array(2).fill(null).map((_, i) => {
    const service = Object.keys(contractInfoPerService)[i];
    let stwr = "";
    let edwr = "";
    if(service){
      const contractInfo = contractInfoPerService[service];
      const startDatePerService = contractInfo?.startDate;
      //開始日付、終了日付の和暦を取得 空白の日付には空のオブジェクトを返す
      let o = str2gdex(startDatePerService);
      stwr = (startDatePerService.indexOf('0000') === 0)?
        {l: '', y: '', m: '', d:''}: {l: o.wr.l, y: o.wr.y, m: o.m, d:o.d};
      o = str2gdex(startDatePerService);
      edwr = (user.endDate.indexOf('0000') === 0)?
        {l: '', y: '', m: '', d:''}: {l: o.wr.l, y: o.wr.y, m: o.m, d:o.d};
    }
    const serviceCode = service ?getServiceKindNum(service) :"";
    return(
      <tr key={"index"+i}>
        {i===0 &&<th rowSpan={2} style={{width: '7%'}}>サービス種別</th>}
        <NumberTds number={serviceCode} maxNumberLength={2} />
        <th className='startDate'>開始年月日</th>
        <td className='wareki'>{stwr?.l ?? ""}</td>
        <NumberTds number={stwr?.y ?String(stwr.y).padStart(2, '0') :""} maxNumberLength={2} />
        <td>年</td>
        <NumberTds number={stwr?.m ?String(stwr.m).padStart(2, '0') :""} maxNumberLength={2} />
        <td>月</td>
        <NumberTds number={stwr?.d ?String(stwr.d).padStart(2, '0') :""} maxNumberLength={2} />
        <td>日</td>
        <th className='endDate'>終了年月日</th>
        <td className='wareki'>{edwr?.l ?? ""}</td>
        <NumberTds number={edwr?.y ?String(edwr.y).padStart(2, '0') :""} maxNumberLength={2} />
        <td>年</td>
        <NumberTds number={edwr?.m ?String(edwr.m).padStart(2, '0') :""} maxNumberLength={2} />
        <td>月</td>
        <NumberTds number={edwr?.d ?String(edwr.d).padStart(2, '0') :""} maxNumberLength={2} />
        <td>日</td>
        <th className='useCount'>利用日数</th>
        <NumberTds number={service ?bDt?.countOfUse ?? "" :""} maxNumberLength={2} />
        <th className='hospitalCount'>入院日数</th>
        <NumberTds number={""} maxNumberLength={2} />
      </tr>
    )
  })

  return(
    <table style={{width: '100%'}} className={classes.serviceTypeTable}>
      <tbody>
        {nodes}
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

const KyuhuMeisaiTable = (props) => {
  const {bDt} = props;
  const itemTotal = bDt?.itemTotal ?? [];
  const minRowLength = 14;
  const overItemRow = itemTotal.length > minRowLength;
  while(itemTotal.length < minRowLength){ itemTotal.push({}); };
  const trs = itemTotal.map((item, i) => (
    <tr key={"index"+i}>
      <td style={{textAlign: 'start'}}>{deleteServiceNameDelimiter(item?.c ?? "")}</td>
      <NumberTds number={item?.s ?? ""} maxNumberLength={6} />
      <NumberTds number={item?.v ?? ""} maxNumberLength={4} />
      <NumberTds number={item?.count ?? ""} maxNumberLength={2} />
      <NumberTds number={item?.tanniNum ?? ""} maxNumberLength={5} />
      <td className='application'>{""}</td>
    </tr>
  ));

  return(
    <table style={{width: '100%'}}>
      <colgroup className='borderRightBold' />
      <colgroup className='borderRightBold' />
      <colgroup className='borderRightBold' span={6} />
      <colgroup className='borderRightBold' span={4} />
      <colgroup className='borderRightBold' span={2} />
      <colgroup className='borderRightBold' span={5} />
      <tbody>
        <tr>
          <th rowSpan={overItemRow ?itemTotal.length+1 :minRowLength+1} style={{width: 16}} className='borderRightBold'>給付費明細欄</th>
          <th>サービス内容</th>
          <th colSpan={6}>サービスコード</th>
          <th colSpan={4}>単位数</th>
          <th colSpan={2}>回数</th>
          <th colSpan={5}>サービス単位数</th>
          <th className='application'>適用</th>
        </tr>
        {trs}
      </tbody>
    </table>
  )
}

const BillingMeisaiTable = (props) => {
  const {bDt, masterRec, kyodaiJogen} = props;

  const userSanteiTotal = parseInt(bDt?.userSanteiTotal) || 0;
  const ketteigaku = parseInt(bDt?.ketteigaku) || 0;

  // 複数サービスに対応
  const userSanteiTotalSvc = bDt?.userSanteiTotalSvc ?? {[bDt.service]: bDt.userSanteiTotal};
  const ichiwariSvc = bDt?.ichiwariSvc ?? {[bDt.service]: bDt.ichiwari};
  const kanrikekkagakuSvc = bDt?.kanrikekkagakuSvc ?? {[bDt.service]: bDt.kanrikekkagaku};
  const tanniTotalSvc = bDt?.tanniTotalSvc ?? {[bDt.service]: bDt.tanniTotal};
  const countOfUseMulti = bDt?.countOfUseMulti ?? {[bDt.service]: bDt.countOfUse};
  // 利用サービス一覧
  const billingServiceItems = (bDt?.service ?? "").split(",");

  // 多子軽減がbillingDtから取得できないことがあるので利用者情報を確認
  const users = useSelector(s=>s.users);
  const user = comMod.getUser(bDt.UID, users);

  const userTashikeigen = (() => {
    if (user?.etc?.addiction?.多子軽減措置 === "第二子軽減") return 2;
    else if (user?.etc?.addiction?.多子軽減措置 === "第三子軽減") return 3;
    else return 0;
  })();

  // サービス種類コード
  const serviceKindCodeTds = Array(4).fill(null).map((_, i) => {
    const service = billingServiceItems[i];
    let serviceKindCode = "";
    if(service){
      serviceKindCode = getServiceKindNum(service);
    }
    return(
      <React.Fragment key={"index0"+i}>
        <NumberTds number={serviceKindCode ?? ""} maxNumberLength={2} />
        <td colSpan={4}>{service ?? ""}</td>
      </React.Fragment>
    )
  });

  // サービス利用日数欄
  const serviceUseCountTds = Array(4).fill(null).map((_, i) => {
    const service = billingServiceItems[i];
    let useCount = "";
    if(service){
      useCount = countOfUseMulti[service] ?? 0;
    }
    return(
      <React.Fragment key={"index1"+i}>
        <NumberTds number={useCount ?? ""} maxNumberLength={2} />
        <td colSpan={4} style={{textAlign: 'start'}}>日</td>
      </React.Fragment>
    )
  });

  // 給付単位数欄
  const kyuhuTanniTds = Array(4).fill(null).map((_, i) => {
    const service = billingServiceItems[i];
    let tanniTotal = "";
    if(service){
      tanniTotal = tanniTotalSvc[service] ?? 0;
    }
    return(<NumberTds key={"index2"+i} number={tanniTotal ?? ""} maxNumberLength={6} />)
  });

  // 給付単位単価欄
  const unitPriceTds = Array(4).fill(null).map((_, i) => {
    const service = billingServiceItems[i];
    let price = "";
    if(service){
      price = (masterRec?.unitPricies?.[service]*100 ?? masterRec?.unitPrice) ?? 0;
    }
    return(
      <React.Fragment key={"index3"+i}>
      <NumberTds number={price ?? ""} maxNumberLength={4} />
      <td colSpan={2} style={{fontSize: 10}}>円/単位</td>
      </React.Fragment>
    )
  });

  // 総費用額欄
  const santeiTotalTds = Array(4).fill(null).map((_, i) => {
    const service = billingServiceItems[i];
    let santeiTotal = "";
    if(service){
      santeiTotal = userSanteiTotalSvc[service] ?? 0;
    }
    return(<NumberTds key={"index4"+i} number={santeiTotal ?? ""} maxNumberLength={6} />)
  });

  // 1割相当額欄
  const ichiwariTds = Array(4).fill(null).map((_, i) => {
    const service = billingServiceItems[i];
    let ichiwari = "";
    if(service){
      const santeiTotal = userSanteiTotalSvc[service];
      ichiwari = Math.floor(santeiTotal * .1);
    }
    return(<NumberTds key={"index5"+i} number={ichiwari ?? ""} maxNumberLength={6} />)
  });

  // 多子軽減の利用者負担額(2)
  const ichiwari2Tds = Array(4).fill(null).map((_, i) => {
    const service = billingServiceItems[i];
    let ichiwari = "";
    if(service){
      ichiwari = ichiwariSvc[service] ?? 0;
    }
    if (bDt.musyouka) ichiwari = 0;
    return(<NumberTds key={"index5"+i} number={ichiwari ?? ""} maxNumberLength={6} />)
  });

  // 上限月額調整欄
  const jogenGetsuTyouseiTds = Array(4).fill(null).map((_, i) => {
    const service = billingServiceItems[i];
    let jougenGetsuTyousei = "";
    if (service) {
      jougenGetsuTyousei = (Math.min(Number(bDt.priceLimit), Number(ichiwariSvc[service]))) ?? 0;
    }
    if (bDt.musyouka) jougenGetsuTyousei = 0;
    return(<NumberTds key={"index7"+i} number={jougenGetsuTyousei ?? ""} maxNumberLength={6} />)
  });
  const sumJougenGetsuTyousei = Object.values(ichiwariSvc).reduce((prevSum, ichiwari) => {
    let fee = Math.min(Number(bDt.priceLimit), Number(ichiwari));
    if (bDt.musyouka) fee = 0; return prevSum = prevSum + fee;
  }, 0);

  // 調整後利用者負担額欄
  const tyouseiUserHutanTds = Array(4).fill(null).map((_, i) => {
    return(<NumberTds key={"index8"+i} number={""} maxNumberLength={6} />)
  });

  // 上限管理後利用者負担額欄　決定利用者負担額欄
  const jogenKanriKetteiGaku = Array(4).fill(null).map((_, i) => {
    const service = billingServiceItems[i];
    let ketteigaku = "";
    if (service){
      ketteigaku = kanrikekkagakuSvc[service] ?? 0;
    }
    return(<NumberTds key={"index9"+i} number={ketteigaku ?? ""} maxNumberLength={6} />)
  });
  const sumJogenKanriKetteiGaku = Object.values(kanrikekkagakuSvc).reduce((prevSum, ketteigaku) => {
    const fee = parseInt(ketteigaku) || 0;
    return prevSum = prevSum + fee;
  }, 0);

  // 給付費欄
  const kyuhuhiTds = Array(4).fill(null).map((_, i) => {
    const service = billingServiceItems[i];
    let benefits = "";
    if(service){
      const userSanteiTotal = parseInt(userSanteiTotalSvc[service]) || 0;
      const ketteigaku = parseInt(kanrikekkagakuSvc[service]) || 0;
      benefits = userSanteiTotal - ketteigaku;
    }
    return(
      <NumberTds key={"index11"+i} number={benefits ?? ""} maxNumberLength={6} />
    )
  })

  // 特別対策費欄
  const tokubetsuTaisakuhiTds = Array(4).fill(null).map((_, i) => {
    return(<NumberTds key={"index12"+i} number={""} maxNumberLength={6} />)
  })

  // 自治体助成分請求額欄
  const jichiJoseiTds = Array(4).fill(null).map((_, i) => {
    const jichiJosei = i === 0 ?bDt.jichiJosei :"";
    return(<NumberTds key={"index13"+i} number={jichiJosei ?? ""} maxNumberLength={6} />)
  })

  return(
    <table style={{width: '100%'}}>
      <colgroup className='borderRightBold' />
      <colgroup className='borderRightBold' span={2} />
      <colgroup className='borderRightBold' span={6} />
      <colgroup className='borderRightBold' span={6} />
      <colgroup className='borderRightBold' span={6} />
      <colgroup className='borderRightBold' span={6} />
      <tbody>
        <tr>
          <th rowSpan={14} style={{width: 16}}>請求明細集計</th>
          <th colSpan={2}>サービス種類コード</th>
          {serviceKindCodeTds}
          <th rowSpan={2} colSpan={6}>合計</th>
        </tr>
        <tr><th colSpan={2}>サービス利用日数</th>{serviceUseCountTds}</tr>
        <tr><th colSpan={2}>給付単位数</th>{kyuhuTanniTds}<NumberTds number={bDt.tanniTotal ?? ""} maxNumberLength={6} /></tr>
        <tr><th colSpan={2}>給付単位単価</th>{unitPriceTds}<NumberTds number={""} maxNumberLength={6} /></tr>
        <tr className='borderBottomBold'><th colSpan={2}>総費用額</th>{santeiTotalTds}<NumberTds number={bDt?.userSanteiTotal ?? ""} maxNumberLength={6} /></tr>
        <tr><th colSpan={2}>1割相当額</th>{ichiwariTds}<NumberTds number={""} maxNumberLength={6} /></tr>
        <tr><th colSpan={2}>利用者負担額(2)</th>{ichiwari2Tds}<NumberTds number={""} maxNumberLength={6} /></tr>
        <tr><th colSpan={2}>上限月額調整</th>{jogenGetsuTyouseiTds}<NumberTds number={sumJougenGetsuTyousei ?? ""} maxNumberLength={6} /></tr>
        <tr><th colSpan={2}>調整後利用者負担額</th>{tyouseiUserHutanTds}<NumberTds number={""} maxNumberLength={6} /></tr>
        <tr><th colSpan={2}>上限管理後利用者負担額</th>{jogenKanriKetteiGaku}<NumberTds number={sumJogenKanriKetteiGaku} maxNumberLength={6} /></tr>
        <tr className='borderBottomBold'><th colSpan={2}>決定利用者負担額</th>{jogenKanriKetteiGaku}<NumberTds number={sumJogenKanriKetteiGaku} maxNumberLength={6} /></tr>
        <tr><th rowSpan={2}>請求額</th><th>給付費</th>{kyuhuhiTds}<NumberTds number={userSanteiTotal - ketteigaku} maxNumberLength={6} /></tr>
        <tr className='borderBottomBold'><th>特別対策費</th>{tokubetsuTaisakuhiTds}<NumberTds number={""} maxNumberLength={6} /></tr>
        <tr><th colSpan={2}>自治体助成分請求額</th>{jichiJoseiTds}<NumberTds number={bDt.jichiJosei} maxNumberLength={6} /></tr>
      </tbody>
    </table>
  )
}

const TokuteiKyuhuhiTable = () => {

  return(
    <table>
      <colgroup className='borderRightBold' />
      <colgroup className='borderRightBold' span={4} />
      <colgroup className='borderRightBold' span={2} />
      <colgroup className='borderRightBold' span={5} />
      <colgroup className='borderRightBold' span={5} />
      <tbody>
        <tr>
          <th rowSpan={2} style={{width: '14rem'}}>特定入所障害児食費等給付費</th>
          <th colSpan={4}>算定日額</th>
          <th colSpan={2}>日数</th>
          <th colSpan={5}>市町村請求額</th>
          <th colSpan={5}>実費算定額</th>
        </tr>
        <tr>
          <NumberTds number={""} maxNumberLength={4} />
          <NumberTds number={""} maxNumberLength={2} />
          <NumberTds number={""} maxNumberLength={5} />
          <NumberTds number={""} maxNumberLength={5} />
        </tr>
      </tbody>
    </table>
  )
}

const PageInfoTable = () => {

  return(
    <table>
      <tbody>
        <tr>
          <NumberTds number={"1"} maxNumberLength={2} />
          <td>枚中</td>
          <NumberTds number={"1"} maxNumberLength={2} />
          <td>枚目</td>
        </tr>
      </tbody>
    </table>
  )
}

export const TuusyokyuuhuMeisaiOne = (props) => {
  const classes = useStyles();
  const {bDt, masterRec, com, user, stdDate, kyodaiJogen, service, preview, schedule, reportDateDt, specialStateDate} = props;
  
  const commonProps = {bDt, masterRec, com, user, kyodaiJogen, service};
  return(
    <div className={`${classes.OnePage} onePage`}>
      <Title preview={preview} com={com} stdDate={stdDate} schedule={schedule} service={service} reportDateDt={reportDateDt} specialStateDate={specialStateDate} />
      <div className='tables'>
        <div className='group'><CityNumberTable {...commonProps}/><DateTable stdDate={stdDate} {...commonProps}/></div>
        <div className='group' style={{alignItems: 'flex-end'}}><UserInfoTable {...commonProps}/><JigyosyoInfoTable {...commonProps}/></div>
        <div className='group'><UpperLimitTable {...commonProps}/></div>
        <div className='group'><UpperLimitJigyosyoTable  {...commonProps}/></div>
        <div className='group'><ServiceTypeTable  {...commonProps}/></div>
        <div className='group'><KyuhuMeisaiTable  {...commonProps}/></div>
        <div className='group'><BillingMeisaiTable  {...commonProps}/></div>
        <div className='group' style={{alignItems: 'flex-end'}}><TokuteiKyuhuhiTable  {...commonProps}/><PageInfoTable  {...commonProps}/></div>
      </div>
    </div>
  )
}

const Main = (props) => {
  const classes = useStyles();
  const {data, stdDate, service, users, schedule, userList, preview, serviceItems, reportDateDt} = props;
  const masterRec = data.masterRec;
  const com = data.com;
  const billingDts = JSON.parse(JSON.stringify(data.billingDt));
  billingDts.sort((a, b)=> (a.sindex - b.sindex));
  const pages = billingDts.map((bDt, i)=>{
    const uidStr = bDt.UID;
    const user = users.find(uDt => "UID"+uDt.uid === uidStr);
    if(!user) return null;
    // ユーザーリストによるスキップ
    if (!userList.find(f => "UID"+f.uid === uidStr))  return null;
    if (!userList.find(f => "UID"+f.uid === uidStr).checked) return null;
    // サービスが含まれていないユーザーはスキップ
    if(!(service==="" || new RegExp(service).test(user.service))) return null
    // 請求額なしはスキップ
    if (!bDt.tanniTotal) return null;
    const kyodaiJogen = isKyoudaiJougen(billingDts, users, uidStr, schedule);
    const pageProps = {bDt, masterRec, com, user, stdDate, kyodaiJogen, service, preview, schedule, reportDateDt}
    if(preview==="通所給付費明細" && (serviceItems[0]==="障害児相談支援" || serviceItems[0]==="計画相談支援")){
      return(
        <SoudanShienTuusyokyuuhuMeisaiPage key={`page${i+1}`} {...pageProps} title={serviceItems[0]} />
      )
    }
    return (
      <TuusyokyuuhuMeisaiOne key={`page${i+1}`} {...pageProps} />
    )  
  });

  return(
    <div className={classes.pages}>
      {pages}
    </div>
  )
}

const TuusyokyuuhuMeisai = (props) => {
  const {userList, preview, selects, reportDateDt, ...others} = props;
  const allState = useSelector(state => state);

  // return <SoudanShienTuusyokyuuhuMeisai />
  
  // リストにないプレビューが送られてきたら何もしないで終了
  const nameList = ['通所給付費明細', '代理受領通知'];
  if (nameList.indexOf(preview) < 0)  return null;

  // 代理受領通知で国の標準形式以外は無視
  if (preview === '代理受領通知' && selects[preview] !== "国の標準形式") return null;

  // ストアステートを全て抽出するまでロード画面
  const loadingStatus = comMod.getLodingStatus(allState);
  if(!loadingStatus.loaded) return(
    <>
    <LoadingSpinner />
    </>
  );

  const {stdDate, schedule, users, com, service, account, serviceItems} = allState;

  // 地域区分確認
  const chikikubun = com?.addiction?.[service]?.["地域区分"]
    ?? com?.addiction?.["放課後等デイサービス"]?.["地域区分"]
    ?? com?.addiction?.["児童発達支援"]?.["地域区分"];
  if (!chikikubun){
    return (
      <div style={{marginTop: 150}}>
        地域区分が設定されていません。
      </div>
    )
  }

  // billingDtなどを取得
  const billInfoToSchParams = { stdDate, schedule, users, com, service, serviceItems };
  billInfoToSchParams.calledBy = 'TuusyokyuuhuMeisai';
  const data = setBillInfoToSch(billInfoToSchParams);
  data.com = com;
  
  const mainProps = {data, stdDate, service, users, schedule, userList, preview, serviceItems, reportDateDt}
  return (<Main {...mainProps} />);
}
export default TuusyokyuuhuMeisai;