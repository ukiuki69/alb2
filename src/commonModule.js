// 汎用関数にするのをまとめてみる
import { sendPartOfSchedule, endPoint, univApiCall, uPrms, makeUrlSearchParams } from './modules/api';
import { HOHOU, didPtn } from './modules/contants';
import * as strUtils from './modules/stringUtils';
import * as cookieUtils from './modules/cookies';
import * as dateUtils from './modules/dateUtils';
import * as numUtils from './modules/numberUtils';
import * as formUtils from './modules/formUtils';
import * as telUtils from './modules/telUtils';
import * as handleDeepPath from './modules/handleDeepPath';
import * as parsePermissionUtils from './modules/parsePermission';
import * as newlineConv from './modules/newlineConv';
import * as uiUtils from './modules/uiUtils';
import * as miscUtils from './modules/miscUtils';
import * as userUtils from './modules/userUtils';
import * as scheduleUtils from './modules/scheduleUtils';

// 再エクスポート
export { uPrms, makeUrlSearchParams };
export const {
  zp, spfill, zen2han, randomStr, makePassWd, convHankaku,
  convKanaToHira, convHiraToKata, convHiraToKataAndChk, convKanaToHiraAndChk,
  shortWord, deleteLast, inService
} = strUtils;
export const { setCookeis, getCookeis, removeCookieAll } = cookieUtils;
export const {
  toDateApiDateStr, getAge, getWd, formatDate, convDid,
  getDateEx, parseDate, getDatesArrayOfMonth, makeDaysGrid, timePickerList
} = dateUtils;
export const { null2Zero, formatNum, upperLimitOfUseByDay } = numUtils;
export const { getFormDatas, checkRequireFilled, isMailAddress, getInputInfo } = formUtils;
export const { formatTelNum } = telUtils;
export const { findDeepPath, findDeepPath1, fdp, findDeepPathN, fdpn, setDeepPath, sdp } = handleDeepPath;
export const { parsePermission } = parsePermissionUtils;
export const { lfToBr, brtoLf, processDeepBrToLf, processDeepLfToBr } = newlineConv;
export const {
  isEditElementOpen, uisCookiePos, setUisCookie, getUisCookie, getUisCookieInt,
  getLodingStatus, locationPrams, toClipboard, isCmmdOrCtrl, qslct, qslcta
} = uiUtils;
export const {
  typeOf, removeFromObj, objToArray, objToArrayIgnoreKey, objToArrayWithKey,
  compareArrays, asyncSleep
} = miscUtils;
export const {
  getUser, convUID, getHiddenName, getBrothers, getFirstBros,
  sendUserEtcMulti, sendUsersCity, isClassroom, classroomCount
} = userUtils;
export const {
  setScheduleLUPDATE, setScheduleLSAVED, setSchedleLastUpdate, setScheduleSaved,
  setOpenSchEditDetailDialog, getRiyouCountOfUser, getTransferCount
} = scheduleUtils;

// 互換性のためのエイリアスや残存定数
export const PERMISSION_NAMES = [
  { value: 100, name: 'デベロッパー', comment: '開発用のアカウントです。' },
  {
    value: 95,
    name: 'マスターアカウント',
    comment: 'すべての操作、アカウント管理が出来ます。',
  },
  { value: 90, name: 'マネージャー', comment: 'すべての操作が可能です。' },
  { value: 80, name: 'スタッフ', comment: '予定の編集一部帳票の発行などが行なえます。' },
  { value: 60, name: 'フロアスタッフ', comment: '連絡帳の記入、予定の編集などが行なえます。' },
  { value: 50, name: '連絡帳スタッフ', comment: '連絡帳のみ行なえます。' },
];

// 内部で他関数を使用している関数のラップ
export const wrapGetAge = (birthday, date, offset) => getAge(birthday, date, offset);

export const usersSort = (u) => {
  if (!Array.isArray(u)) return u;
  u.sort((a, b) => parseInt(a.sindex) - parseInt(b.sindex));
  return u;
};

export const wrapFormatUserList = (res, date, sort = 0) => {
  const formatted = userUtils.formatUserList(res, date, getAge);
  const newDt = formatted.data.dt;
  // ソート処理は commonModule に残すか、userUtils に移動するか検討
  if (sort === 0) {
    newDt.sort((a, b) => {
      if (a.ageNdx < b.ageNdx) return -1;
      if (a.ageNdx > b.ageNdx) return 1;
      return 0;
    });
  } else if (sort === 1) {
    newDt.sort((a, b) => {
      if (a.startDate < b.startDate) return -1;
      if (a.startDate > b.startDate) return 1;
      return 0;
    });
  } else if (sort === 2) {
    newDt.sort((a, b) => parseInt(a.sindex) - parseInt(b.sindex));
  }
  return { ...formatted, data: { ...formatted.data, dt: newDt } };
};

export const wrapCallDisptchForSendSchedule = (params) => {
  return scheduleUtils.callDisptchForSendSchedule(params, formatDate);
};

export const wrapSetOfUidDid = (schedule, UID = '') => {
  return scheduleUtils.setOfUidDid(schedule, convUID, UID);
};

export const wrapGetScheduleInfo = (sch, svc, users, classroom = '') => {
  return scheduleUtils.getScheduleInfo(sch, svc, users, getUser, inService, findDeepPath, classroom);
};

export const getPermissionName = (account) => {
  return parsePermissionUtils.getPermissionName(account, PERMISSION_NAMES);
};

// パスワードチェック (stringUtils に移動しても良いが、一旦ここに配置)
const passWdPtn = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!-/:-@[-`{-~])[!-~]*$/;
export const chkPasword = (passWd, minLen = 8, maxLen = 20) => {
  if (passWd.length <= minLen || passWd.length >= maxLen) {
    return { result: false, msg: `${minLen}文字以上${maxLen}文字以内でお願いします。` };
  }
  if (!passWd.match(/^[\x20-\x7E]+$/)) {
    return { result: false, msg: '漢字、ひらがな、カタカナなどは使えません。' };
  }
  if (passWd.match(/\s/)) {
    return { result: false, msg: 'スペースなどの空白文字を含むことは出来ません。' };
  }
  if (!passWd.match(passWdPtn)) {
    return { result: false, msg: 'アルファベット大文字小文字と数字と記号を含む必要があります。' };
  }
  return { result: true, msg: '安全なパスワードです。' };
};

// 元々の export をラップしたものに差し替え
export {
  wrapFormatUserList as formatUserList,
  wrapCallDisptchForSendSchedule as callDisptchForSendSchedule,
  wrapSetOfUidDid as setOfUidDid,
  wrapGetScheduleInfo as getScheduleInfo,
};
