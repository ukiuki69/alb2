import * as Actions from '../Actions';
import { typeOf } from './miscUtils';
import { didPtn, HOHOU } from './contants';
import { isClassroom } from './userUtils';

/**
 * Schedule最終更新時刻をセットする
 */
export const setScheduleLUPDATE = (dispatch) => {
  const p = { scheduleLUPDATE: new Date().getTime() };
  dispatch(Actions.setControleMode(p));
};

/**
 * 最終保存時刻をセットする
 */
export const setScheduleLSAVED = (dispatch) => {
  const p = { scheduleLSAVED: new Date().getTime() };
  dispatch(Actions.setControleMode(p));
};

/**
 * Schedule保存予約
 */
export const setSchedleLastUpdate = (dispatch, path) => {
  const p = {
    scheduleLastUpdate: Math.floor(new Date().getTime() / 1000),
    scheduleLastUpdatePath: path,
    saved: false,
  };
  dispatch(Actions.setControleMode(p));
};

/**
 * 保存済みフラグを立てる
 */
export const setScheduleSaved = (dispatch) => {
  const p = {
    saved: true,
  };
  dispatch(Actions.setControleMode(p));
};

/**
 * SchEditDetailDialogのオープン
 */
export const setOpenSchEditDetailDialog = (dispatch, prms) => {
  const p = { openSchEditDetailDialog: prms };
  dispatch(Actions.setControleMode(p));
};

/**
 * スケジュールを送信するための準備を行い送信を実行する
 */
export const callDisptchForSendSchedule = (params, formatDate) => {
  const { dateList, stdDate, schedule, hid, bid, dispatch } = params;
  let dateChk = true;
  const strStdDate = 'D' + stdDate.split('-')[0] + stdDate.split('-')[1];
  
  Object.keys(schedule)
    .filter((e) => e.indexOf('U') === 0)
    .map((e) => {
      Object.keys(schedule[e])
        .filter((f) => f.indexOf('D2') === 0)
        .map((f) => {
          if (f.indexOf(strStdDate) !== 0) dateChk = false;
        });
    });

  if (!dateChk) {
    dispatch(
      Actions.setSnackMsg('日付エラーが発生しました。保存をキャンセルします。', 'error')
    );
    setScheduleSaved(dispatch);
    return false;
  }

  const newList = dateList.map((e) => {
    return {
      date: formatDate(e.date, 'YYYY-MM-DD'),
      holiday: e.holiday,
    };
  });

  let prms = {
    hid,
    bid,
    date: stdDate,
    dateList: JSON.stringify(newList),
    a: 'sendCalender',
  };

  const listDate = newList[0].date;
  if (listDate === stdDate) {
    dispatch(Actions.sendCalender(prms));
  }

  prms = {
    hid,
    bid,
    date: stdDate,
    schedule: JSON.stringify(schedule),
    a: 'sendSchedule',
  };
  dispatch(Actions.sendSchedule(prms));
  setScheduleSaved(dispatch);
};

/**
 * スケジュールを受け取ってuidとdidのセットを返す
 */
export const setOfUidDid = (schedule, convUID, UID = '') => {
  if (UID) UID = convUID(UID).str;
  const uidptn = /^UID[0-9]/;

  if (UID) return Object.keys(schedule[UID]).filter((e) => e.match(didPtn));
  else {
    let rtn = [];
    Object.keys(schedule)
      .filter((e) => e.match(uidptn))
      .map((e) => {
        if (!schedule[e]) return false;
        Object.keys(schedule[e])
          .filter((f) => f.match(didPtn))
          .map((f) => {
            rtn.push([e, f]);
          });
      });
    return rtn;
  }
};

/**
 * スケジュールオブジェクトを受け取って統計情報を返す
 */
export const getScheduleInfo = (sch, svc, users, getUser, inService, findDeepPath, classroom = '') => {
  const tmpUids = Object.keys(sch).filter((e) => e.indexOf('UID') === 0);
  const uids = tmpUids
    .map((e) => {
      const uSvc = getUser(e, users).service;
      const svcChk = inService(uSvc, svc) || !svc;
      const thisUser = getUser(e, users);
      const classroomChk = isClassroom(thisUser, classroom);
      if (svcChk && classroomChk) return e;
    })
    .filter((e) => e);

  const didSet = new Set();
  uids.map((e) => {
    if (!sch[e]) return false;
    Object.keys(sch[e])
      .filter((f) => f.indexOf('D2' === 0))
      .map((f) => {
        didSet.add(f);
      });
  });
  const dids = Array.from(didSet);

  const uidCounts = {};
  uids.map((e) => {
    if (!sch[e]) return false;
    let absenceCnt = 0;
    let weekDayCnt = 0;
    let schoolOffCnt = 0;
    let useResultCnt = 0;
    let kessekiAdicCnt = 0;
    Object.keys(sch[e])
      .filter((f) => f.match(didPtn))
      .forEach((f) => {
        if (svc === HOHOU && sch[e][f].service !== HOHOU) return false;
        if (svc === HOHOU && sch[e][f].service === HOHOU) {
          weekDayCnt++;
          return false;
        }
        if (!svc && sch[e][f].service === HOHOU) return false;
        const absence = sch[e][f].absence;
        const noUse = sch[e][f].noUse;
        const reserve = sch[e][f].reserve;
        const o = sch[e][f];
        if (typeof o !== 'object') return false;
        if (classroom && o.classroom && o.classroom !== classroom) return false;
        if (absence && !noUse && !reserve) {
          absenceCnt++;
        }
        if (parseInt(o.offSchool) === 0 && !absence) weekDayCnt++;
        else if (parseInt(o.offSchool) === 1 && !absence) schoolOffCnt++;
        else if (o.offSchool === undefined && !absence) weekDayCnt++;
        if (o.useResult === true && !absence) useResultCnt++;
        if (findDeepPath(o, 'dAddiction.欠席時対応加算')) {
          kessekiAdicCnt++;
        }
      });
    uidCounts[e] = {
      absenceCnt,
      weekDayCnt,
      schoolOffCnt,
      count: weekDayCnt + schoolOffCnt,
      kessekiAdicCnt,
      useResultCnt,
    };
  });

  const didCounts = {};
  dids.map(
    (e) =>
      (didCounts[e] = {
        absenceCnt: 0,
        weekDayCnt: 0,
        schoolOffCnt: 0,
        useResultCnt: 0,
        kessekiAdicCnt: 0,
      })
  );
  uids.map((e) => {
    if (!sch[e]) return false;
    Object.keys(sch[e])
      .filter((f) => f.match(didPtn))
      .forEach((f) => {
        if (svc === HOHOU && sch[e][f].service !== HOHOU) return false;
        if (svc === HOHOU && sch[e][f].service === HOHOU) {
          didCounts[f].weekDayCnt++;
          return false;
        }
        const { absence, noUse, reserve } = sch[e][f];
        const o = sch[e][f];
        if (!svc && o.service === HOHOU) return false;
        if (classroom && o.classroom && o.classroom !== classroom) return false;
        if (svc && o.service !== svc) return false;
        if (absence && !noUse && !reserve) didCounts[f].absenceCnt++;
        if (o.offSchool === 0 && !absence) didCounts[f].weekDayCnt++;
        if (o.offSchool === 1 && !absence) didCounts[f].schoolOffCnt++;
        if (o.useResult === true && !absence) didCounts[f].useResultCnt++;
        if (findDeepPath(o, 'dAddiction.欠席時対応加算')) {
          didCounts[f].kessekiAdicCnt++;
        }
      });
  });
  return { uids, dids, uidCounts, didCounts };
};

/**
 * ユーザーごとのScheduleオブジェクトを受け取り利用数を返す
 */
export const getRiyouCountOfUser = (sch) => {
  const rt = { riyou: 0, kessekiKasan: 0, kesseki: 0 };
  if (!sch) return rt;
  Object.keys(sch)
    .filter((e) => e.match(didPtn))
    .forEach((e) => {
      let kessekiKasa = false;
      if (sch[e].dAddiction) {
        Object.keys(sch[e].dAddiction).map((f) => {
          if (f.indexOf('欠席時') > -1) kessekiKasa = true;
        });
      }

      if (sch[e].absence && kessekiKasa) rt.kessekiKasan++;
      else if (sch[e].absence && !kessekiKasa) rt.kesseki++;
      else rt.riyou++;
    });
  return rt;
};

/**
 * 送迎の集計を行う
 */
export const getTransferCount = (sch = {}) => {
  const isObject = (val) => {
    if (val !== null && typeOf(val) === 'object' && val.constructor === Object) return true;
    return false;
  };
  if (!isObject(sch)) return {};
  const result = {};
  const schDts = JSON.parse(JSON.stringify(sch));
  Object.keys(schDts).map((uid) => {
    if (!(isObject(schDts[uid]) && /^UID[0-9]+$/.test(uid))) return false;
    Object.keys(schDts[uid]).map((dDate) => {
      if (!(isObject(schDts[uid][dDate]) && /^D[0-9]+$/.test(dDate))) return false;
      if (!result[dDate]) result[dDate] = {};
      if (!result[dDate].pickup) result[dDate].pickup = { total: 0 };
      if (!result[dDate].send) result[dDate].send = { total: 0 };
      const data = schDts[uid][dDate];
      const transfer = data.transfer;
      if (!transfer) return false;
      const pickupKey = data.start + '-' + transfer[0];
      if (!transfer[0].match(/^\*|\*$/)) {
        if (!result[dDate].pickup[pickupKey]) result[dDate].pickup[pickupKey] = 1;
        else result[dDate].pickup[pickupKey] += 1;
        result[dDate].pickup.total += 1;
      } else {
        if (!result[dDate].pickup.outofCount) result[dDate].pickup.outofCount = { total: 0 };
        if (!result[dDate].pickup.outofCount[pickupKey]) result[dDate].pickup.outofCount[pickupKey] = 1;
        else result[dDate].pickup.outofCount[pickupKey] += 1;
        result[dDate].pickup.outofCount.total += 1;
      }
      const sendKey = data.end + '-' + transfer[1];
      if (!transfer[1].match(/^\*|\*$/)) {
        if (!result[dDate].send[sendKey]) result[dDate].send[sendKey] = 1;
        else result[dDate].send[sendKey] += 1;
        result[dDate].send.total += 1;
      } else {
        if (!result[dDate].send.outofCount) result[dDate].send.outofCount = { total: 0 };
        if (!result[dDate].send.outofCount[sendKey]) result[dDate].send.outofCount[sendKey] = 1;
        else result[dDate].send.outofCount[sendKey] += 1;
        result[dDate].send.outofCount.total += 1;
      }
    });
  });

  return result;
};

