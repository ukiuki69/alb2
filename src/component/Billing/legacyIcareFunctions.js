// 2025-10-01以前のicare（医療的ケア）判定ロジック
// コミット e68309e5de39635840fc5aca0ddf2cda735adea8 時点の関数

import {
  houdySirvice, houdayKasan, jihatsuKasan, jihatsuService,
} from './BlCalcData2024';

// 以下の関数は blMakeData2024.js からimportする必要があります
// これらは現在も使用されている共通関数です
import { 
  getKeyStrOfServiceItems, 
  getMatchedCapacity, 
  kangoKahaiIsNull 
} from './blMakeData2024';
const houdayRootService = houdySirvice.filter(e=>!e.c.includes('・'));
const jihatuRootService = jihatsuService.filter(e=>!e.c.includes('・'));


// 2025-10-01以前のgetBaseItemHD
export const getBaseItemHD_before2510 = (addiction, offSchool, absence, user) => {
  const type = user.type;
  // 重症心身障害児として算定対象
  const isJuushin = addiction.重症心身型 === '1' && type === '重症心身障害児';
  const kijunGaitou = addiction.基準該当放 === '1';
  const kyouseiService = addiction.共生型サービス === '1';
  if (absence)  return null // 欠席の処理
  // 時間区分未設定は除外。重心はそのまま通す
  if (addiction.時間区分 === undefined && !isJuushin && !kyouseiService && !kijunGaitou) 
    return null;
  if (addiction.定員 === undefined) return null;
  const teiin = parseInt(addiction.定員);
  // 加算オブジェクトに対応した文字配列を取得する
  const keyStrs = getKeyStrOfServiceItems(addiction, offSchool);
  let lst;
  if (keyStrs.length){
    lst = [...houdySirvice];
  }
  else{
    lst = [...houdayRootService];
  }
  if (kyouseiService){
    lst = lst.filter(e=>e.c.includes('共生型'));
  }
  if (kijunGaitou){
    lst = lst.filter(e=>e.c.includes('基準該当'));
  }
  if (kyouseiService || kijunGaitou){
    lst = lst.filter(e=>e.d === parseInt(offSchool));
    // 末尾の・削除
    keyStrs.forEach((e, i)=>{keyStrs[i] = e.replace(/・$/, '')})
    keyStrs.map(keyStr=>{
      lst = lst.filter(f=>f.c.split('・').includes(keyStr));
    })
    return lst[0];
  }

  const usersIcare = user.icareType?.replace(/\D/g, '') ?? '';
  // 現時点ではこれらを最初に除外する
  lst = lst.filter(e=>!e.c.includes('共生型') && !e.c.includes('基準該当'));
  // 障害児タイプによる絞り込み
  lst = lst.filter(e=>{
    if (isJuushin){
      return e.trg === '重症心身障害児'
    }
    else return e.trg === '障害児'
  })
  // 医療的ケア児による絞り込み（旧ロジック）
  if (addiction.医療ケア児基本報酬区分 === usersIcare){
    lst = lst.filter(e=>
      (parseInt(addiction.医療ケア児基本報酬区分) === e.icare)
    )
  }
  else {
    lst = lst.filter(e=>!e.icare)

  }
  // 時間区分による絞り込み
  lst = lst.filter(e=>
    e.ku === parseInt(addiction.時間区分) || !e.ku
  )
  // 休日・平日 重心のみ存在する
  if (isJuushin){
    lst = lst.filter(e=>e.d === parseInt(offSchool))
  }
  const matchedCap = getMatchedCapacity(lst, teiin);
  lst = lst.filter(e=>e.cap === matchedCap);

  // 全てのキーオブジェクトに対して絞り込みを行う
  // getBaseItemHDの中黒「・」の扱いが不正だったので修正
  keyStrs.map(e => {
    lst = lst.filter(f => (f.c + '・').indexOf(e) > -1);
  });
  // 要素数のカウント最小値を取得
  const elmCnt = lst.map(e=>e.c.split('・').length);
  const elmCntMin = Math.min(...elmCnt);
  // 一番少ないやつを取得
  lst = lst.filter(e=>e.c.split('・').length === elmCntMin);
  // ここで基本1件になるはず
  return lst[0];
}

// 2025-10-01以前のgetBaseItemJH
export const getBaseItemJH_before2510 = (addiction, absence, user) => {
  if (absence)  return null;
  if (addiction.定員 === undefined) return null;
  const teiin = parseInt(addiction.定員);
  const type = user.type;
  const isJuushin = addiction.重症心身型 === '1' && type === '重症心身障害児';
  const kijunGaitou = addiction.基準該当;
  const kyouseiService = addiction.共生型サービス === '1';
  const notUseJiKubun = (isJuushin || kijunGaitou || kyouseiService);
  if (addiction.時間区分 === undefined && !notUseJiKubun) return null;
  const usersIcare = user.icareType?.replace(/\D/g, '') ?? '';
  let keyStrs = getKeyStrOfServiceItems(addiction, true);
  // 放デイと児発で表現が違うので訂正する
  const jhConv = [
    ['評減・', '評価減・'],
    ['開減１・', '開所減１・'],
    ['開減２・', '開所減２・'],
  ];
  keyStrs.forEach((e, i)=>{
    jhConv.forEach(f=>{
      if (e === f[0]){
        keyStrs[i] = f[1];
      }
    })
  })

  let lst;
  if (keyStrs.length){
    lst = [...jihatsuService]
  }
  else{
    lst = [...jihatuRootService]
  }
  if (kyouseiService){
    lst = lst.filter(e=>e.c.includes('共生型'));
  }
  if (kijunGaitou){
    lst = lst.filter(e=>e.c.includes(kijunGaitou));
  }

  if (kyouseiService || kijunGaitou){
    // 末尾の・削除
    keyStrs.forEach((e, i)=>{keyStrs[i] = e.replace(/・$/, '')})
    keyStrs.map(keyStr=>{
      lst = lst.filter(f=>f.c.split('・').includes(keyStr));
    })
    return lst[0];
  }
    
  // lst = [...jihatsuService];
  lst = lst.filter(e=>!e.c.includes('共生型') && !e.c.includes('基準該当'));
  // 現時点では除外する
  // 障害児タイプによる絞り込み
  if (addiction.重症心身型 === '1' && type === '重症心身障害児'){
    lst = lst.filter(e=>e.trg !== 'syo')
  }
  else {
    lst = lst.filter(e=>e.trg !== 'juu')
  }
  // 医療的ケア児による絞り込み（旧ロジック）
  if (addiction.医療ケア児基本報酬区分 === usersIcare){
    lst = lst.filter(e=>
      (parseInt(addiction.医療ケア児基本報酬区分) === e.icare)
    )
  }
  else {
    lst = lst.filter(e=>!e.icare)
  }
  // 児童発達支援センターによるフィルタ
  if (addiction.児童発達支援センター){
    lst = lst.filter(e=>e.fac === 'ce')
  }
  else {
    lst = lst.filter(e=>e.fac !== 'ce')
  }
  if (addiction.就学区分 && !isJuushin && !addiction.児童発達支援センター){
    lst = lst.filter(e=>e.pres === (addiction.就学区分 === '1'? 'mi': 'not'))
  }
  // 時間区分による絞り込み
  lst = lst.filter(e=>
    e.ku === parseInt(addiction.時間区分) || !e.ku
  )
  if (addiction.児童発達支援センター && type === '難聴児'){
    lst = lst.filter(e=>e.trg === 'nan')
  }
  else{
    lst = lst.filter(e=>e.trg !== 'nan')

  }
  const matchedCap = getMatchedCapacity(lst, teiin);
  lst = lst.filter(e=>e.cap === matchedCap);

  
  // keyStrsの末尾の・削除
  keyStrs.forEach((e, i)=>{keyStrs[i] = e.replace(/・$/, '')})

  keyStrs.forEach(e=>{
    lst = lst.filter(f => f.c.split('・').includes(e));
  });

  // 要素数のカウント最小値を取得
  const elmCnt = lst.map(e=>e.c.split('・').length);
  const elmCntMin = Math.min(...elmCnt);
  // 一番少ないやつを取得
  lst = lst.filter(e=>e.c.split('・').length === elmCntMin);
  
  return lst[0];
}

// 2025-10-01以前のgetKasanOneItemJH
export const getKasanOneItemJH_before2510 = (key, addiction, user) => {
  const value = addiction[key];
  const errObj = { err: 'item found err.', key, value };

  const tos = v => v? String(v): v;
  const shisetsuType = parseInt(addiction.重症心身型) ?? null;
  const typeName = {障害児: 'syo', 重症心身障害児: 'juu', 難聴児: 'nan'};
  const isCenter = addiction.児童発達支援センター === '1';
  const type = typeName[user.type] ?? 'syo';
  const icareType = user.icareType?.replace(/\D/g, '') ?? false;
  const teiin = addiction.定員;
  const isJuushin = type === 'juu' && shisetsuType;
  const pres = addiction.就学区分;
  const isEnchouShien = key === '延長支援';

  if (kangoKahaiIsNull(addiction, key, type)) return {};

  let lst = [...jihatsuKasan];
  // keyとvalueで絞り込み 
  lst = lst.filter(e=>e.name === key && tos(e.value) === tos(value));
  
  // センターか否か
  const facTarget = isCenter? 'ce': 'ji'
  lst = lst.filter(e=>!e?.opt?.fac || e?.opt?.fac === facTarget)
  // 施設タイプ 重心対応型か
  const existFtype = lst.find(e=>e?.opt?.ftype);
  if (existFtype && shisetsuType && isJuushin){
    lst = lst.filter(e=>tos(e?.opt?.ftype) === tos(shisetsuType));
  }
  // 延長支援のみ施設タイプのみでフィルタ
  else if (existFtype && shisetsuType && isEnchouShien){
    lst = lst.filter(e=>tos(e?.opt?.ftype) === tos(shisetsuType));
  }
  else if (existFtype){
    lst = lst.filter(e=>!e?.opt?.ftype)
  }
  // 障害児タイプ
  if (type === 'juu' && lst.find(e=>e?.opt?.trg === 'juu')){
    lst = lst.filter(e=>e?.opt?.trg === type);
  }
  // 難聴児を考慮
  else if (type === 'nan' && lst.find(e=>e?.opt?.trg === 'nan')){
    lst = lst.filter(e=>e?.opt?.trg === type);
  }
  else{
    // ここでは難聴児と障害児を同一視する
    let ttype = type === 'nan'? 'syo': type;
    // 重心がリストに見つからなかったらtypeは障害児にする
    if (!lst.find(e=>e?.opr?.trg === 'juu')){
      ttype = 'syo';
    }
    lst = lst.filter(e=>!e?.opt?.trg || e?.opt?.trg === ttype);
  }
  // 医療的ケア（旧ロジック）
  const existIcare = lst.find(e=>e?.opt?.icare);
  if (existIcare && icareType){
    lst = lst.filter(e => Number(e?.opt?.icare) <= Number(icareType));
  }
  else if (existIcare){
    lst = lst.filter(e=>!e?.opt?.icare);
  }
  // 未就学区分での絞り込み
  if (pres && lst.find(e=>tos(e?.opt?.pres) === tos(pres))){
    lst = lst.filter(e=>tos(e?.opt?.pres) === tos(pres));
  }
  // 定員による絞り込み 現在の定員以下のデータを探す場合と定員以上のデータを探す場合がある
  const existCap = lst.find(e=>e?.opt?.cap);
  if (existCap){
    const cap = getMatchedCapacity(lst, teiin)
    lst = lst.filter(e=>e?.opt?.cap === cap)
  }


  if (!lst.length) return errObj;
  return lst[0];


}

// 2025-10-01以前のgetKasanOneItem
export const getKasanOneItem_before2510 = (key, addiction, offSchool, user) => {
  const tos = v => v? String(v): v;
  if (addiction.欠席時対応加算) addiction.欠席時対応加算 = 1;

  const value = addiction[key];
  const errObj = { err: 'item found err.', key, value };
  const shisetsuType = parseInt(addiction.重症心身型) ?? null;
  const typeName = {障害児: 'syo', 重症心身障害児: 'juu', 難聴児: 'nan'}
  const type = typeName[user.type] ?? 'syo';
  const icareType = user.icareType?.replace(/\D/g, '') ?? false;
  const teiin = addiction.定員;
  const isJuushin = type === 'juu' && shisetsuType;
  const isEnchouShien = key === '延長支援';
  if (kangoKahaiIsNull(addiction, key, type)) return {};

  let lst = [...houdayKasan];
  // keyとvalueで絞り込み
  // kyeの末尾の_は削除する
  lst = lst.filter(e=>e.name === key.replace(/_+$/, '') && tos(e.value) === tos(value));
  // 施設タイプ
  const existFtype = lst.find(e=>e?.opt?.ftype);
  if (existFtype && shisetsuType && isJuushin){
    lst = lst.filter(e=>tos(e?.opt?.ftype) === tos(shisetsuType));
  }
  // 延長支援のみ施設タイプのみでフィルタ
  else if (existFtype && shisetsuType && isEnchouShien){
    lst = lst.filter(e=>tos(e?.opt?.ftype) === tos(shisetsuType));
  }
  else if (existFtype){
    lst = lst.filter(e=>!e?.opt?.ftype)
  }
  // 障害児タイプ
  if (type === 'juu' && lst.find(e=>e?.opt?.trg === 'juu')){
    lst = lst.filter(e=>e?.opt?.trg === type);
  }
  else{
    lst = lst.filter(e=>!e?.opt?.trg || e?.opt?.trg === type);
  }
  // 休日・平日
  lst = lst.filter(e=>e?.opt?.d === undefined || tos(e?.opt?.d) === tos(offSchool));
  // 医療的ケア（旧ロジック）
  const existIcare = lst.find(e=>e?.opt?.icare);
  if (existIcare && icareType){
    lst = lst.filter(e => Number(e?.opt?.icare) <= Number(icareType));
  }
  else if (existIcare){
    lst = lst.filter(e=>!e?.opt?.icare);
  }
  // 定員による絞り込み 現在の定員以下のデータを探す場合と定員以上のデータを探す場合がある
  const existCap = lst.find(e=>e?.opt?.cap);
  if (existCap){
    const cap = getMatchedCapacity(lst, teiin)
    lst = lst.filter(e=>e?.opt?.cap === cap)
  }
  
  if (!lst.length) return errObj;
  return lst[0];
}

