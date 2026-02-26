import { inService, convHankaku } from './stringUtils';
import { getAge, formatDate } from './dateUtils';
import { findDeepPath } from './miscUtils';
import { didPtn, HOHOU } from './contants';
import { isClassroom } from '../albCommonModule';

/**
 * Albatross 業務ロジックに関連するユーティリティ
 */

// uidの処理を行う
export const convUID = (v) => {
  if (!v) return { str: null, num: null };
  let num;
  let err = false;
  if (isNaN(v) && v.indexOf('UID') === 0) {
    const s = v.replace(/[^0-9]/g, '');
    if (s) num = parseInt(s);
    else err = true;
  } else {
    if (!isNaN(v)) num = parseInt(v);
    else err = true;
  }
  if (!err) return { str: 'UID' + num, num };
  return { str: null, num: null };
};

// uidよりusersのオブジェクトを返す
export const getUser = (UID, users, nextUsers = '') => {
  if (!UID || !Array.isArray(users)) return {};
  const uid = UID.replace(/[^0-9]/g, '');
  const user = users.find((e) => e.uid === uid);
  const next = Array.isArray(nextUsers) ? nextUsers.find((e) => e.uid === uid) : null;
  const ret = user ? { ...user } : {};
  if (next) ret.next = next.next;
  return ret;
};

// 兄弟を取得する
export const getBrothers = (uid, users, self = false, checkBrothersIndex = true) => {
  const thisUser = getUser(uid, users);
  if (!thisUser || (parseInt(thisUser.brosIndex) === 0 && checkBrothersIndex)) return [];
  const { pphone, pname, brosIndex } = thisUser;
  return users.filter((e) =>
    e.pphone === pphone &&
    e.pname === pname &&
    (parseInt(e.brosIndex) > 0 || !checkBrothersIndex) &&
    (e.brosIndex !== brosIndex || self)
  );
};

// 長兄を取得する
export const getFirstBros = (uid, users) => {
  const thisUser = getUser(uid, users);
  if (!thisUser || parseInt(thisUser.brosIndex) === 0) return false;
  if (parseInt(thisUser.brosIndex) === 1) return uid;
  const bros = getBrothers(uid, users);
  const firstBros = bros.find((e) => parseInt(getUser(e.uid, users).brosIndex) === 1);
  return firstBros ? 'UID' + firstBros.uid : false;
};

// 吉村 幸博 -> ●村 ●博
export const getHiddenName = (name, mask) => {
  if (!name || mask === '0') return name;
  const parts = name.split(' ');
  const name1 = parts[0];
  const name2 = parts[1];
  if (!name2) return name;
  const c = '●';
  if (mask === '2') {
    let m1 = c.repeat(name1.length - 1) + name1.slice(-1);
    let m2 = c.repeat(name2.length - 1) + name2.slice(-1);
    m1 = m1.length === 1 ? c : m1;
    m2 = m2.length === 1 ? c : m2;
    return m1 + ' ' + m2;
  } else if (mask === '1') {
    return name1.slice(0, -1) + c + ' ' + name2.slice(0, -1) + c;
  }
  return name;
};

// スケジュールオブジェクトを受け取って色々返す
export const getScheduleInfo = (sch, svc, users, classroom = '') => {
  const tmpUids = Object.keys(sch).filter((e) => e.indexOf('UID') === 0);
  const uids = tmpUids.filter((e) => {
    const user = getUser(e, users);
    const uSvc = user.service;
    const svcChk = inService(uSvc, svc) || !svc;
    const classroomChk = isClassroom(user, classroom);
    return svcChk && classroomChk;
  });

  const didSet = new Set();
  uids.forEach((e) => {
    if (!sch[e]) return;
    Object.keys(sch[e]).filter((f) => f.indexOf('D2') === 0).forEach((f) => didSet.add(f));
  });
  const dids = Array.from(didSet);

  const uidCounts = {};
  uids.forEach((e) => {
    if (!sch[e]) return;
    let absenceCnt = 0, weekDayCnt = 0, schoolOffCnt = 0, useResultCnt = 0, kessekiAdicCnt = 0;
    Object.keys(sch[e]).filter((f) => f.match(didPtn)).forEach((f) => {
      const o = sch[e][f];
      if (svc === HOHOU && o.service !== HOHOU) return;
      if (svc === HOHOU && o.service === HOHOU) { weekDayCnt++; return; }
      if (!svc && o.service === HOHOU) return;
      if (classroom && o.classroom && o.classroom !== classroom) return;
      
      if (o.absence && !o.noUse && !o.reserve) absenceCnt++;
      if (!o.absence) {
        if (parseInt(o.offSchool) === 1) schoolOffCnt++;
        else weekDayCnt++;
        if (o.useResult === true) useResultCnt++;
      }
      if (findDeepPath(o, 'dAddiction.欠席時対応加算')) kessekiAdicCnt++;
    });
    uidCounts[e] = { absenceCnt, weekDayCnt, schoolOffCnt, count: weekDayCnt + schoolOffCnt, kessekiAdicCnt, useResultCnt };
  });

  const didCounts = {};
  dids.forEach((e) => {
    didCounts[e] = { absenceCnt: 0, weekDayCnt: 0, schoolOffCnt: 0, useResultCnt: 0, kessekiAdicCnt: 0 };
  });
  uids.forEach((e) => {
    if (!sch[e]) return;
    Object.keys(sch[e]).filter((f) => f.match(didPtn)).forEach((f) => {
      const o = sch[e][f];
      if (svc === HOHOU && o.service !== HOHOU) return;
      if (svc === HOHOU && o.service === HOHOU) { didCounts[f].weekDayCnt++; return; }
      if (!svc && o.service === HOHOU) return;
      if (classroom && o.classroom && o.classroom !== classroom) return;
      if (svc && o.service !== svc) return;
      
      if (o.absence && !o.noUse && !o.reserve) didCounts[f].absenceCnt++;
      if (!o.absence) {
        if (parseInt(o.offSchool) === 1) didCounts[f].schoolOffCnt++;
        else didCounts[f].weekDayCnt++;
        if (o.useResult === true) didCounts[f].useResultCnt++;
      }
      if (findDeepPath(o, 'dAddiction.欠席時対応加算')) didCounts[f].kessekiAdicCnt++;
    });
  });

  return { uids, dids, uidCounts, didCounts };
};

// ユーザーごとのScheduleオブジェクトを受け取り利用数を返す
export const getRiyouCountOfUser = (sch) => {
  const rt = { riyou: 0, kessekiKasan: 0, kesseki: 0 };
  if (!sch) return rt;
  Object.keys(sch).filter((e) => e.match(didPtn)).forEach((e) => {
    let kessekiKasa = false;
    if (sch[e].dAddiction) {
      Object.keys(sch[e].dAddiction).forEach((f) => {
        if (f.indexOf('欠席時') > -1) kessekiKasa = true;
      });
    }
    if (sch[e].absence) {
      if (kessekiKasa) rt.kessekiKasan++;
      else rt.kesseki++;
    } else {
      rt.riyou++;
    }
  });
  return rt;
};

export const formatUserList = (res, date, sort = 0) => {
  const [year, month] = date.split('-');
  const days = new Date(year, month, 0).getDate();
  const newDt = res.data.dt.map((e) => {
    const ages = getAge(e.birthday, date, e.etc?.ageOffset);
    return { ...e, age: ages.age, ageStr: ages.flx, ageNdx: ages.ageNdx };
  });
  newDt.forEach((e) => {
    if (e.volume === '0') {
      e.volume = days - 8;
      e.volumeStd = true;
    }
    if (e.ext && typeof e.ext === 'string') e.ext = JSON.parse(e.ext);
    else if (!e.ext) e.ext = {};
    if (e.etc && typeof e.etc === 'string') e.etc = JSON.parse(e.etc);
    else if (!e.etc) e.etc = {};
    if (e.type?.includes(',')) {
      const parts = e.type.split(',');
      e.type = parts[0];
      e.icareType = parts[1];
    }
  });
  if (sort === 0) newDt.sort((a, b) => a.ageNdx - b.ageNdx);
  else if (sort === 1) newDt.sort((a, b) => (a.startDate < b.startDate ? -1 : 1));
  else if (sort === 2) newDt.sort((a, b) => parseInt(a.sindex) - parseInt(b.sindex));
  return { ...res, data: { ...res.data, dt: newDt } };
};

// スケジュールを受け取ってuidとdidのセットを返す
export const setOfUidDid = (schedule, UID = '') => {
  if (UID) UID = convUID(UID).str;
  const uidptn = /^UID[0-9]/;
  if (UID) return Object.keys(schedule[UID] || {}).filter((e) => e.match(didPtn));
  const rtn = [];
  Object.keys(schedule).filter((e) => e.match(uidptn)).forEach((e) => {
    if (!schedule[e]) return;
    Object.keys(schedule[e]).filter((f) => f.match(didPtn)).forEach((f) => rtn.push([e, f]));
  });
  return rtn;
};

// 全てのstateを受け取ってローディング状態を返す
export const getLodingStatus = (allstate) => {
  const { 
    sessionStatus, fetchSchedule, fetchCalenderStatus, userFtc, comFtc, 
    serviceItemsInit 
  } = allstate;
  const loaded = sessionStatus.done && fetchSchedule.done && fetchCalenderStatus.done && userFtc.done && comFtc.done && (serviceItemsInit || userFtc.done);
  const error = sessionStatus.err || fetchSchedule.err || fetchCalenderStatus.err || userFtc.err || comFtc.err;
  return {
    loaded, error, detail: {
      sessionDone: sessionStatus.done, scheduleDone: fetchSchedule.done, calenderDone: fetchCalenderStatus.done,
      userDone: userFtc.done, comDone: comFtc.done, serviceItemsInit
    }
  };
};

export const deleteLast = (s, l) => (s.slice(-1) === l ? s.slice(0, -1) : s);

/**
 * ブラウザの判定を行う
 * Chrome以外は不許可または警告対象とする
 */
export const getBrowserInfo = () => {
  const ua = window.navigator.userAgent.toLowerCase();
  let browser = '不明なブラウザ';
  let match = false;
  let error = false;
  let detect = true;

  if (ua.indexOf('msie') !== -1 || ua.indexOf('trident') !== -1) {
    browser = 'Internet Explorer';
    error = true;
  } else if (ua.indexOf('edge') !== -1 || ua.indexOf('edg/') !== -1) {
    browser = 'Microsoft Edge';
    error = true; // 今後不許可扱い
  } else if (ua.indexOf('opr/') !== -1 || ua.indexOf('opera') !== -1) {
    browser = 'Opera';
    error = true;
  } else if (ua.indexOf('chrome') !== -1 || ua.indexOf('crios') !== -1) {
    browser = 'Google Chrome';
    match = true;
  } else if (ua.indexOf('safari') !== -1) {
    browser = 'Safari';
    match = false;
  } else if (ua.indexOf('firefox') !== -1) {
    browser = 'Firefox';
    match = false;
  } else {
    detect = false;
  }

  return { browser, match, error, detect };
};

