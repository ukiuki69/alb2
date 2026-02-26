import { HOHOU, HOUDAY, JIHATSU } from '../../modules/contants';
import { isClassroom, isService } from '../../albCommonModule';
import { getLodingStatus, getUser } from "../../commonModule";
import { getPriorityService, kessekiSvc } from "./blMakeData";

// 契約期間のチェック
export const chkContractPeriod = (allState) => {
  const {users, schedule, stdDate} = allState;
  const ls = getLodingStatus(allState);
  if (!ls.loaded || ls.error){
    return [];
  } 
  const uidAry = Object.keys(schedule).filter(e=>e.match(/^UID[0-9]+/));
  const rtn = uidAry.reduce((v, uids) => {
    const user = getUser(uids, users);
    if (!Object.keys(user).length) return v;
    // 優先するサービスをチェック
    const psvc = user.service.includes(',')? getPriorityService(user.service): '';
    // 契約期間を取得 契約終了日未指定はは9でフィル
    const startDate = !psvc? (user.startDate || ''): (user.etc.multiSvc?.[psvc].startDate || '');
    let contractEnd = !psvc? (user.contractEnd || ''): (user.etc.multiSvc?.[psvc].contractEnd || '');;
    if (!contractEnd || contractEnd === '0000-00-00'){
      contractEnd = '99999999';
    }
    // 契約開始日と終了日をDID形式にする
    const startDid = 'D' + startDate.replace(/\-/g, '');
    const endDid = 'D' + contractEnd.replace(/\-/g, '');
    // 該当ユーザーが所有するdidを取得してソート
    const dids = Object.keys(schedule[uids] || {})
    .filter(e=>e.match(/^D2/))
    .sort((a, b) => (a < b? -1: 1));
    if (!dids.length) return v;
    // 契約日範囲内
    if (startDid < dids[0] && endDid > dids[dids.length - 1]){
      return v;
    };
    // 契約範囲外の内容を調べる
    dids.filter(e=>e < startDid || e > endDid).forEach(did=>{
      const sch = schedule[uids][did];
      // 欠席でなければ無条件でチェック対象
      if (!sch.absence){
        v.push({uid:uids, name: user.name, did, startDid, endDid});
      }
      // 欠席の場合は欠席対応サービスがあるかどうか確認
      else {
        kessekiSvc.forEach(svcName => {
          if (svcName in (sch.dAddiction || {})){
            v.push({uid:uids, name: user.name, did, startDid, endDid});
          }
        })
      }
    });
    return v;
  }, []);
  const contractDateChk = uidAry.reduce((v, e)=>{
    const user = getUser(e, users);
    if (!Object.keys(user).length) return v;
    
    // contractDateとstdDateを比較
    if (user.contractDate && stdDate) {
      // YYYY-MM-DD形式をYYYY-MM形式に変換して比較
      const contractYearMonth = user.contractDate.substring(0, 7); // YYYY-MM
      const stdYearMonth = stdDate.substring(0, 7); // YYYY-MM
      
      // contractDateがstdDateの年月を超える場合
      if (contractYearMonth > stdYearMonth) {
        v.push({
          uid: e,
          name: user.name,
          contractDate: user.contractDate,
          message: `契約日(${user.contractDate})を確認`
        });
      }
    }
    
    return v;
  }, []);
  return [...rtn, ...contractDateChk];
}

const getOneUser = (thisUser, schedule, com) => {
  const usersAddic = thisUser?.etc?.addiction ? thisUser?.etc?.addiction: {};
  const UID = 'UID' + thisUser.uid;
  const name = thisUser.name;
  const clsRoom = thisUser.classroom?.split(',')[0]
    ? thisUser.classroom.split(',')[0]: ''
  // 利用者別加算を取得
  const uAddicAry = Object.keys(usersAddic).reduce((v, e)=>{
    v.push({
      loc:'users', item: e, value: usersAddic[e], name, UID,
    });
    return v;
  }, []);
  // 利用者のサービスを取得 放デイまたは児発を優先。保訪は無視する
  const svc = getPriorityService(thisUser.service);
  // 事業所の加算を取得する
  // 複数サービスがあったらアラートになるメッセージ挿入処理が必要
  const comAddic = com?.addiction?.[svc]? com?.addiction?.[svc]: {};
  const cAddicAry = Object.keys(comAddic).reduce((v, e)=>{
    if (parseInt(comAddic[e]) === -1) return v;
    v.push({
      loc:'com', item: e, value: comAddic[e], name, UID,
    });
    return v;
  }, []);
  const clsAddic = 
    com?.addiction?.[svc]?.[clsRoom] ?com.addiction[svc][clsRoom] : {};
  const clsAddicAry = Object.keys(clsAddic).reduce((v, e)=>{
    v.push({
      loc:'clasroom', classroom: clsRoom, item: e, value: comAddic[e], name, UID,
    });
    return v;
  }, []);
  // 利用ごと加算
  const byUseAddicItems = [];
  Object.keys(schedule).filter(e=>e.match(/^UID[0-9]/)).forEach(e => {
    Object.keys(schedule[e]).filter(f=>f.match(/^D2[0-9]+/)).forEach(f=>{
      const o = schedule[e][f];
      const v = o.dAddiction;
      byUseAddicItems.push({...v});
    })
  });
  // 利用ごと加算でユニークな項目を取得
  const unqByUseAddicItems = Array.from(new Set(byUseAddicItems));
  const byUseArray = unqByUseAddicItems.reduce((v, e)=>{
    v.push({
      loc:'dAddiction', item: e, value: null, name, UID,
    });
    return v;
  }, []);
  // 全ての配列をマージ
  const allAry = [
    ...uAddicAry, ...cAddicAry, ...clsAddicAry, ...byUseArray
  ];
  // 加算項目のユニーク配列
  const items = Array.from(new Set(allAry.map(e=>e.item)));
  // 2つ以上ある項目を列挙
  const dupItems = items.reduce((v, e) =>{
    const t = allAry.filter(f=>f.item === e);
    if (t.length > 1){
      v.push(...t);
      return v;
    }
    else return v;
  }, [])
  return dupItems;
}
// 複数サービス、複数クラスがあるかどうかチェック
const multiAttrCheck = (thisUser) => {
  // 複数サービスの検出
  const svcs = thisUser.service?.split(',');
  const r = [];
  if (svcs?.length > 1){
    r.push({multiService: true})
  }
  // 複数単位の検出
  const clss = thisUser.classroom?.split(',');
  if (clss?.length > 1){
    r.push({multiClassroom: true})
  }
  return r;
}
// userとスケジュールの加算のアンマッチ
const checkUnmatch = (thisUser, schedule) => {
  const svc = getPriorityService(thisUser.service);
  const UID = 'UID' + thisUser.uid;
  const schAddic = schedule?.[svc]?.[UID]?.addiction ? schedule[svc][UID].addiction: {};
  const usersAddic = thisUser?.etc?.addiction ? thisUser?.etc?.addiction: {};
  const chkBySch = Object.keys(schAddic).reduce((v, e)=>{
    if (e.match(/^上限/)) return v;
    if (schAddic[e] !== usersAddic[e]) v.push(e);
    return v;
  }, []);
  const chkByUser = Object.keys(usersAddic).reduce((v, e)=>{
    if (schAddic[e] !== usersAddic[e])  v.push(e);
    return v;
  }, []);
  // 結果をユニークにする さらに上限額管理を外す
  const m = Array.from(new Set([...chkBySch, ...chkByUser]))
  .filter(e=>!e.includes('上限額管理'));
  return m.map(e=>({userSchUnmatch: true, item: e, name: thisUser.name}));
}
// 重複している加算を確認する
// 配列にして返す予定
export const checkDupAddiction = (allState) => {
  const {users, schedule, com, classroom, service} = allState;
  const ls = getLodingStatus(allState);
  if (!ls.loaded) return [];  
  if (ls.error) return [];
  // 加算状況重複チェック
  const duplicateCheck = users.reduce((v, e) => {
    // 加算重複チェック
    const t = getOneUser(e, schedule, com);
    // 複数単位・複数サービスのチェック
    // const u = multiAttrCheck(e);
    v['UID' + e.uid] = [...t, /*...u,*/ ];
    return v;
  }, {});
  // 加算アンマッチのチェック
  const unmatchCheck = users.reduce((v, e) => {
    // ユーザーとscheduleの照合確認
    v['UID' + e.uid] = checkUnmatch(e, schedule);
    return v;
  }, {});
  // 不必要な要素を削除
  Object.keys(duplicateCheck).forEach(e=>{
    if (!duplicateCheck[e]?.length) delete duplicateCheck[e];
  })
  Object.keys(unmatchCheck).forEach(e=>{
    if (!unmatchCheck[e]?.length) delete unmatchCheck[e];
  })
  Object.keys(duplicateCheck).forEach(e=>{
    const user = getUser(e, users);
    if (!isService(user, service)) delete duplicateCheck[e];
    if (!isClassroom(user, classroom)) delete duplicateCheck[e];
  })
  Object.keys(unmatchCheck).forEach(e=>{
    const user = getUser(e, users);
    if (!isService(user, service)) delete unmatchCheck[e];
    if (!isClassroom(user, classroom)) delete unmatchCheck[e];
  })
  return {duplicateCheck, unmatchCheck};
}
