// 法改正対応
// blmakedata2021と2024の切り替えを行う

import { useSelector } from "react-redux"
import { 
  setBillInfoToSch as setBillInfoToSch2021 ,
  makeBiling as makeBiling2021 ,
  makeJugenkanri  as makeJugenkanri2021 ,
  makeTeikyouJisseki as makeTeikyouJisseki2021,
  isKyoudaiJougen as isKyoudaiJougen2021,
  JOUGEN_KANRI as JOUGEN_KANRI2021,
} from './blMakeData2021';
import { 
  setBillInfoToSch as setBillInfoToSch2024 ,
  makeBiling as makeBiling2024 ,
  makeJugenkanri  as makeJugenkanri2024 ,
  makeTeikyouJisseki as makeTeikyouJisseki2024,
  isKyoudaiJougen  as isKyoudaiJougen2024,
  JOUGEN_KANRI as JOUGEN_KANRI2024,
} from './blMakeData2024';
import { HOHOU, HOUDAY, JIHATSU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from "../../modules/contants";
import { inService } from '../../albCommonModule';
import { typeOf } from "../../commonModule";


// const useGetStdDate = () => {
//   const stdDate = useSelector(s=>s.stdDate);
//   return stdDate;
// }

// 複数サービスの場合放デイ児発を返す関数
export const getPriorityService = (svcsWithComma) => {
  if (inService(svcsWithComma, HOUDAY)) return HOUDAY;
  if (inService(svcsWithComma, JIHATSU)) return JIHATSU;
  if (inService(svcsWithComma, HOHOU)) return HOHOU;
}

export const getJougekanriScvCd = (stdDate) => {
  if (stdDate >= '2021-04-01') return JOUGEN_KANRI2024;
  else return JOUGEN_KANRI2021;
}


// 欠席でも計上する加算等の名称
// 2023/10/05 関係機関連携加算を追加
export const kessekiSvc = [
  '欠席時対応加算', '事業所内相談支援加算', '家庭連携加算',
  '特定処遇改善加算', '福祉・介護職員処遇改善加算', '福祉・介護職員処遇改善特別加算',
  '福祉・介護職員等ベースアップ等支援加算','関係機関連携加算'
]

export const svcCnt = (svcsWithComma) => (svcsWithComma.split(',').length);

// サービスアイテムまたはコードからサービス名を得る
export const getSvcNameByCd = (cd) => {
  if (typeOf(cd) === 'object'){
    cd = cd.s;
  }
  cd = cd + ''; // intで入ってくることがある
  cd = cd.slice(0, 2);
  const svcs = [
    {s: '61', n: '児童発達支援', },
    {s: '63', n: '放課後等デイサービス', },
    {s: '64', n: '保育所等訪問支援', },
    {s: '55', n: SYOUGAI_SOUDAN},
    {s: '52', n: KEIKAKU_SOUDAN},
  ]
  const m = svcs.find(e=>e.s === cd);
  if (m) return m.n;
  else return '未定義のサービス'
}
// setBillInfoToSch as setBillInfoToSch2024 ,
export const setBillInfoToSch = (prms, userlist = []) => {
  const rt = (() => {
    if ((prms?.stdDate ?? '') >= '2024-04-01'){
      return setBillInfoToSch2024(prms, userlist);
    }
    else return setBillInfoToSch2021(prms, userlist);
  })();
  return rt;
}
// makeBiling as makeBiling2024 ,
export const makeBiling = (billingDt, allBillingDt, masterRec, schedule, users, userList, ) => {
  const stdDate = allBillingDt[0].stdDate;
  const rt = (() => {
    if ((stdDate ?? '') >= '2024-04-01'){
      return makeBiling2024(billingDt, allBillingDt, masterRec, schedule, users, userList);
    }
    else return makeBiling2021(billingDt, allBillingDt, masterRec, schedule, users, userList);
  })();
  return rt;
}
// makeJugenkanri  as makeJugenkanri2024 ,
export const makeJugenkanri = (prms) => {
  const {billingDt, masterRec, users, schedule, stdDate, manualJougenKubun} = prms;
  const rt = (() => {
    if ((stdDate ?? '') >= '2024-04-01'){
      return makeJugenkanri2024(prms);
    }
    else{
      return makeJugenkanri2021(billingDt, masterRec, manualJougenKubun, users, schedule);
    }
  })();
  return rt;
}

// makeTeikyouJisseki as makeTeikyouJisseki2024,
export const makeTeikyouJisseki = (billingDt, masterRec, stdDate) => {
  const rt = (() => {
    if ((stdDate ?? '') >= '2024-04-01'){
      return makeTeikyouJisseki2024(billingDt, masterRec);
    }
    else return makeTeikyouJisseki2021(billingDt, masterRec);
  })();
  return rt;
}
// isKyoudaiJougen  as isKyoudaiJougen2024,
export const isKyoudaiJougen = (billingDt, users, uid, schedule, jadge = false) => {
  const stdDate = billingDt[0].stdDate;
  const rt = (() => {
    if ((stdDate ?? '') >= '2024-04-01'){
      return isKyoudaiJougen2024(billingDt, users, uid, schedule, jadge);
    }
    else return isKyoudaiJougen2021(billingDt, users, uid, schedule, jadge);
  })();
  return rt;
}
