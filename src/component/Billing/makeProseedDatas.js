import * as albcm from '../../albCommonModule';
import {
  serviceSyubetu,
  SOUGEY_SVC_CODE, // 送迎サービスコード
} from './BlCalcData';

const normalizeNumericValue = (value) => {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    return Object.values(value).reduce(
      (sum, item) => sum + (Number(item) || 0),
      0
    );
  }
  return value;
};

// MTU用の実費を計算する
// actualCostDetail: Array(2)
// 0: {name: 'おやつ', count: 3, price: 300, unitPrice: 100, classroom: 'tako'}
// 1: {name: 'おやつ', count: 5, price: 500, unitPrice: 100, classroom: 'ika'}
export const actualCostMTU = (actualCostDetail, classroom) => {
  // 対象オブジェクトがMTU用かどうか。
  let isMTU = false;
  actualCostDetail.forEach(e=>{if (e.classroom) isMTU = true});
  if (classroom && isMTU){
    const v = actualCostDetail.filter(e=>e.classroom === classroom)
    .reduce((v, f)=>(v + f.price), 0);
    return v;
  }
  else{
    const v = actualCostDetail.reduce((v, f)=>(v + f.price), 0);
    return v;
  }
}

// ユーザー別売り上げを表示するための配列を作成する
// dataはここではbillingDt
export const proseedByUsersDt = (users, data, service, classroom, sortCities = false) => {
  let outa = []; // 出力用配列
  const existMtu = albcm.getExistMtu(users);
  // 市区町村ソートが設定されている場合、受給者証順にもソート実施
  const tUsers  = sortCities
    ? [...users].sort((a, b)=>{
      if (a.scity_no < b.scity_no) return -1;
      if (a.scity_no > b.scity_no) return 1;
      if (a.hno < b.hno) return -1;
      if (a.hno > b.hno) return 1;
    })
    : users;
  let preCityNo = null;
  outa = tUsers.map(e => {
    // console.log("test")
    // console.log(e)
    // サービスによるスキップ
    if (service && !albcm.inService(e.service, service)) return false;
    // 単位（教室）によるスキップ
    if (classroom && !albcm.isClassroom(e, classroom)) return false;
    // このユーザーの請求データ
    const thisBdt = data.find(f => e.hno === f.hno);
    // console.log(thisBdt)
    // console.log("/test")
    if (!thisBdt) return false; //請求データが無いときはfalseを返す
    // 2022/01/24 MTU対策

    let itemTotal;
    if (existMtu && classroom && thisBdt.clsItemTotal){
      itemTotal = thisBdt.clsItemTotal[classroom] || [];
    }
    else{
      itemTotal = thisBdt.itemTotal || [];
    }
    const isMtu = albcm.classroomCount(e) > 1;
    // サービスコードカウントオブジェクトより送迎に関するコードを抽出
    const sougei = ((itemTotal)?itemTotal:[]).filter(
      f => SOUGEY_SVC_CODE.indexOf(f.s) > -1
    )
    // 送迎回数を算出
    let sougeiCnt = 0;
    sougei.map(f => {
      sougeiCnt += f.count;
    });
    const userFutan = thisBdt.kanrikekkagaku ? thisBdt.kanrikekkagaku : 0;
    const addJustUSerFutan = thisBdt.adjustetUpperLimit 
    ? Math.min(userFutan, thisBdt.adjustetUpperLimit) : null;
    // const kokuhoSeikyuu = thisBdt.userSanteiTotal - userFutan;

    //橋本追加　平日休日利用回数取得
    const hashimoto_ddate = Object.keys(thisBdt).filter(x => /^D[0-9]{8}$/.test(x));
    const hashimoto_schedule = hashimoto_ddate.map(x => thisBdt[x]);
    let hashimoto_holiday = 0;
    let hashimoto_weekday = 0;
    hashimoto_schedule.forEach(x => {
      if(x["offSchool"] == 1 && !x["absence"]) hashimoto_holiday++;
      else if(x["offSchool"] == 0 && !x["absence"]) hashimoto_weekday++;
    })
    
    // 2022/01/24 MTU対策
    let tanniTotal, userSanteiTotal, actualCost, countOfUse;
    if (existMtu && classroom && thisBdt.clsItemTotal[classroom]){
      tanniTotal = thisBdt.clsTanniTotal[classroom];
      // clsUserSanteiTotalの中で0ではない値の数を数える
      const nonZeroCount = Object.values(thisBdt.clsUserSanteiTotal).filter(v => v !== 0).length;
      // 0ではない値が1つだけの場合はuserSanteiTotalを使用
      userSanteiTotal = nonZeroCount === 1 ? thisBdt.userSanteiTotal : thisBdt.clsUserSanteiTotal[classroom];
      actualCost = actualCostMTU(thisBdt.actualCostDetail, classroom);
      countOfUse = thisBdt.clsItemTotal[classroom]
      .filter(f => f.baseItem).reduce((v, f)=>(v + f.count), 0);
    }
    // 複数サービス対応用
    else if (service){
      countOfUse = thisBdt.countOfUseMulti
      ? thisBdt.countOfUseMulti[service]: thisBdt.countOfUse;
      tanniTotal = thisBdt.tanniTotalSvc
      ? thisBdt.tanniTotalSvc[service]: thisBdt.tanniTotal;
      userSanteiTotal = thisBdt.userSanteiTotalSvc
      ? thisBdt.userSanteiTotalSvc[service]: thisBdt.userSanteiTotal;
      actualCost = thisBdt.actualCost;
    }
    else{
      tanniTotal = thisBdt.tanniTotal;
      userSanteiTotal = thisBdt.userSanteiTotal;
      countOfUse = thisBdt.countOfUse;
      actualCost = thisBdt.actualCost;
    }
    tanniTotal = normalizeNumericValue(tanniTotal);
    userSanteiTotal = normalizeNumericValue(userSanteiTotal);
    countOfUse = normalizeNumericValue(countOfUse);
    actualCost = normalizeNumericValue(actualCost);
    const svcSyubetu = service? String(serviceSyubetu[service]): '';
    const syoguuItems = thisBdt.itemTotal.filter(
      f => f.method === 'syoguu' && f.s.startsWith(svcSyubetu)
    );
    const upList = new Set(syoguuItems.map(f => f.up)); // 単価のリスト
    const totalSyoguu = Array.from(upList).reduce((totals, up) => {
      const upItems = syoguuItems.filter(f => f.up === up);
      const upTaniTotal = upItems.reduce((v, f) => (v + f.tanniNum), 0);
      const upSantei = Math.round(upTaniTotal * up);
      totals.upTaniTotal += upTaniTotal;
      totals.upSanteiTotal += upSantei;
      return totals;
    }, { upTaniTotal: 0, upSanteiTotal: 0 });
    const totalSyoguuSantei = totalSyoguu.upSanteiTotal;
    const totalSyoguuTanni = totalSyoguu.upTaniTotal;
    // if (totalUpTani > 0){
    //   console.log(
    //     thisBdt.name, 
    //     totalSyoguuSantei, 'totalSyoguuSantei', upList, 'upList', totalUpTani, 'totalUpTani'
    //   );
    // }
    // if (thisBdt.countOfUseMulti && service){
    //   countOfUse = thisBdt.countOfUseMulti[service];
    // }
    // 実費のみ存在するケースあり
    if (!tanniTotal && !thisBdt.actualCost) return false;
    const isFirstCity = preCityNo !== e.scity_no;  // ここでフラグを決定
    // console.log('Current scity_no:', e.scity_no, 'Previous scity_no:', preCityNo, 'isFirstCity:', isFirstCity);
    preCityNo = e.scity_no;  // preCityNoをここで更新
    return ({
      ...e,
      firstCity:isFirstCity,
      tanni: tanniTotal,
      santei: userSanteiTotal,
      userFutan: addJustUSerFutan || userFutan,
      kokuhoSeikyuu: userSanteiTotal - userFutan,
      sougeiCnt,
      kanriOk: thisBdt.kanriOk,
      countOfUse: countOfUse,
      actualCost: actualCost,
      actualCostDetail: thisBdt.actualCostDetail,
      jichiJosei: thisBdt.jichiJosei,
      kanriKekka: thisBdt.kanriKekka,
      hno: thisBdt.hno,
      UID: thisBdt.UID,
      brosIndex: thisBdt.brosIndex,
      holidayNum: hashimoto_holiday ?hashimoto_holiday :0, //橋本追加
      weekdayNum: hashimoto_weekday ?hashimoto_weekday :0, //橋本追加
      totalSyoguuTanni, totalSyoguuSantei,
      itemTotal: thisBdt.itemTotal,
    });
  }).filter(e=>e);
  return outa;
}
