// 前月との比較を行う

import { isClassroom, isService, univApiCall } from '../../albCommonModule';
import { getLodingStatus, getUser, typeOf } from "../../commonModule";
import { getPreviousMonth } from "../../modules/getPreMonthStr";
// 利用者ごとの加算設定状況を確認
const compareUsers = (users, preUsers) => {
  const rUsers = users.reduce((v, oneUser) => {
    // 現在のユーザーの加算情報
    const addic = oneUser?.etc?.addiction ? oneUser.etc.addiction : {};
    const uid = oneUser.uid;
    // 前月のユーザーの加算情報
    const pOneUser = preUsers.find((e) => e.uid === uid);
    if (!pOneUser) return v; // 前月にユーザー情報がない場合はチェック対象外
    const preAddic = pOneUser?.etc?.addiction ? pOneUser.etc.addiction : {};
    // 加算で利用されているユニークキーを取得
    const k = [];
    k.push(...Object.keys(addic));
    k.push(...Object.keys(preAddic));
    const addicKeys = Array.from(new Set(k));
    // 違いがある加算項目を取得
    const diffAddic = addicKeys.reduce((w, key) => {
      if (addic[key] !== preAddic[key]) {
        w.push({ [key]: { pre: preAddic[key], current: addic[key] } });
      }
      return w;
    }, []);
    if (diffAddic.length) {
      v["UID" + uid] = diffAddic;
    }
    return v;
  }, {});
  return rUsers;
};
// オブジェクトの違いを確認
const diffObjects = (obj1, obj2) => {
  let diff = {};
  for (let key in obj1) {
    if (!obj2.hasOwnProperty(key)) {
      diff[key] = { state: "deleted", value: obj1[key] };
    } else if (
      typeof obj1[key] === "object" &&
      obj1[key] !== null &&
      !Array.isArray(obj1[key])
    ) {
      let deepDiff = diffObjects(obj1[key], obj2[key]);
      if (Object.keys(deepDiff).length > 0) {
        diff[key] = { state: "modified", value: deepDiff };
      }
    } else if (obj1[key] !== obj2[key]) {
      diff[key] = { state: "modified", value: obj1[key] };
    }
  }
  for (let key in obj2) {
    if (!obj1.hasOwnProperty(key)) {
      diff[key] = { state: "added", value: obj2[key] };
    }
  }
  return diff;
};

export const compareLastMonth = async (allState) => {
  const {users, schedule, com, stdDate, service, classroom} = allState;
  const ls = getLodingStatus(allState);
  if (!ls.loaded) return {};  
  if (ls.error) return {};

  const preMonth = getPreviousMonth(stdDate);
  const hid = com.hid;
  const bid = com.bid;
  const prms = { hid, bid, date: preMonth };
  prms.a = "companybrunchM";
  const resPreCom = await univApiCall(prms);
  if (!resPreCom?.data?.result) {
    return {result: false}
  }
  const preCom = resPreCom.data.dt[0];
  preCom.addiction = JSON.parse(preCom.addiction);
  prms.a = "lu";
  const resPreUsers = await univApiCall(prms);
  if (!resPreUsers?.data?.result){
    return {result: false}
  }
  const preUsers = resPreUsers.data.dt;
  const cUsers = compareUsers(users, preUsers);
  Object.keys(cUsers).forEach(e=>{
    const user = getUser(e, users);
    if (!isClassroom(user, classroom)) delete cUsers[e];
    if (!isService(user, service)) delete cUsers[e];
  })
  // console.log(cUsers, "cUsers");
  const cCom = diffObjects(preCom?.addiction, com?.addiction);
  // console.log(cCom, "cCom");
  return {compareUsers: cUsers, compareCom: cCom, result: true};
};
