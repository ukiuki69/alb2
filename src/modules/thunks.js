import axios from 'axios';
import * as Actions from '../Actions';
import * as cmd from '../commonModule';
import { endPoint, univApiCall, sendCalender } from './api';

/**
 * Cookie認証：認証キーからアカウント取得 → キー更新 → データ取得
 */
export const fetchAllWithAuth = async (prms) => {
  const { dispatch, mail, key, stdDate: inputStdDate } = prms;
  
  // stdDateの決定
  let stdDate = inputStdDate;
  if (!stdDate) {
    let thisDate = new Date();
    thisDate.setDate(1);
    const cookieDate = cmd.getCookeis('stdDate');
    stdDate = cookieDate || cmd.formatDate(thisDate, 'YYYY-MM-DD');
  }
  
  // Cookie から値を取得
  const cmail = mail || cmd.getCookeis('mail');
  const ckey = key || cmd.getCookeis('SKEY');
  
  // stdDateをセット
  dispatch({ type: 'SET_STD_DATE', payload: stdDate });
  
  // ユーザー設定の読み込み
  const ui = 'ui';
  const ck = cmd.getCookeis(ui) || '{}';
  const cUiVals = JSON.parse(ck);
  const uiVals = {};
  Object.keys(cUiVals).forEach(e => {
    uiVals[e] = cUiVals[e] === '1';
  });
  dispatch({
    type: 'SET_STORE',
    payload: { controleMode: { ui: uiVals } },
  });
  
  // 1. アカウント取得
  try {
    const accountPrms = {
      a: 'getAccountByKey',
      mail: cmail,
      key: ckey,
      date: stdDate,
    };
    
    dispatch({ type: 'FETCH_ACOUNT_LOADING' });
    const accountRes = await univApiCall(accountPrms);
    
    if (!accountRes?.data?.result) {
      dispatch({ type: 'FETCH_ACOUNT_ERR', payload: accountRes });
      console.error('Account fetch failed');
      return;
    }
    
    dispatch({ type: 'FETCH_ACOUNT_DONE', payload: accountRes });
    
    // アカウントのセット
    const account = accountRes.data.dt[0];
    dispatch({ type: 'SET_ACOUNT', payload: account });
    
    // アカウントリストのセット
    const accountLst = accountRes.data.accountlist.dt;
    accountLst.forEach(_ => {
      delete _.passwd;
      delete _.skey;
      delete _.resetkey;
      delete _.resetkeyts;
    });
    dispatch({ type: 'SET_STORE', payload: { accountLst } });
    
    // 2. 認証キーの更新
    const authPrms = {
      a: 'sertificatAndNew',
      key: ckey,
      mail: cmail,
    };
    
    dispatch({ type: 'REPLACE_KEY_LOADING' });
    const authRes = await univApiCall(authPrms);
    
    if (authRes?.data?.result) {
      dispatch({ type: 'REPLACE_KEY_DONE', payload: authRes });
      cmd.setCookeis('SKEY', authRes.data.key);
      cmd.setCookeis('mail', authRes.data.mail);
    } else {
      dispatch({ type: 'REPLACE_KEY_ERR' });
      console.error('Auth key refresh failed');
      return;
    }
    
    // 3. データ取得
    fetchAll({
      stdDate,
      hid: account.hid,
      bid: account.bid,
      dispatch,
    });
    
  } catch (err) {
    dispatch({ type: 'FETCH_ACOUNT_ERR', payload: err });
    console.error('fetchAllWithAuth error:', err);
  }
};

/**
 * すべてロードする手続きをまとめる
 */
export const fetchAll = (prms) => {
  const { stdDate, hid, bid, weekDayDefaultSet, dispatch } = prms;
  let sendPrms = {};
  sendPrms = {
    a: 'companybrunchM', // company and branch
    hid: hid,
    bid: bid,
    date: stdDate,
  };
  // 法人情報の取得
  dispatch(Actions.fetchCom(sendPrms));

  // 伝送状態の更新
  sendPrms = {
    hid: hid,
    bid: bid,
    date: stdDate,
    reg: 1,
    a: 'listSent',
  };
  dispatch(Actions.fetchTransfer(sendPrms));
  // csv db登録のリセット
  dispatch(Actions.resetTransfer());

  // ユーザーリストの取得
  sendPrms = {
    a: 'lu', // リストユーザー指定
    hid,
    bid,
    date: stdDate,
  };
  // 計画支援時間の取得
  const sendPrmsPlan = {
    a: 'fetchUsersPlan',
    item: 'timetable',
    hid,
    bid,
    lastmonth: stdDate.slice(0, 7), // yyyy-mmのみ送信
  };
  dispatch(Actions.listUsers(sendPrms, sendPrmsPlan));
  // カレンダーの取得
  sendPrms = {
    date: stdDate,
    hid,
    bid,
    weekDayDefaultSet,
    a: 'fetchCalender',
  };
  dispatch(Actions.fetchCalender(sendPrms));
  // スケジュールの取得
  sendPrms = {
    date: stdDate,
    stdDate,
    hid,
    bid,
    a: 'fetchSchedule',
  };
  dispatch(Actions.fetchSchedule(sendPrms));
  // リセットするものをリセット
  dispatch(
    Actions.setStore({
      billingDt: '',
      masterRec: '',
      nextUsers: undefined,
      nextCom: undefined,
    })
  );
  // 追加しておく
  dispatch(Actions.setStdDate(stdDate));
};

/**
 * 月のセットを行う
 * stdDateに対して set = 1 で次月 -1 で前月、0で当月
 */
const getNewMonth = (stdDate, set) => {
  const m = new Date(stdDate.split('-')[0], stdDate.split('-')[1] - 1, 1);
  m.setMonth(m.getMonth() + set);
  return cmd.formatDate(m, 'YYYY-MM-DD');
};

export const setMonth = (prms) => {
  const { set, stdDate, hid, bid, weekDayDefaultSet, dispatch } = prms;
  const curMonth = cmd.formatDate(new Date(), 'YYYY-MM-01');
  const newStdDate = set === 0 ? curMonth : getNewMonth(stdDate, set);
  // 基準日の変更
  dispatch(Actions.setStdDate(newStdDate));
  const newPrms = { ...prms, stdDate: newStdDate };
  fetchAll(newPrms);
  // 初期化のリセット 2022/09/17 追加 SchInitilizerで使用する
  dispatch(Actions.setStore({ controleMode: { scheduleInitDone: null } }));
  // クッキーをセット
  cmd.setCookeis('stdDate', newStdDate);
};

/**
 * 月のセットを行う。
 * ダイレクトに新しいstdDateを指定する
 */
export const setMonthDirect = (prms) => {
  const { newStdDate, hid, bid, weekDayDefaultSet, dispatch } = prms;
  // 基準日の変更
  dispatch(Actions.setStdDate(newStdDate));
  const newPrms = { ...prms, stdDate: newStdDate };
  fetchAll(newPrms);
  // 初期化のリセット 2022/09/17 追加 SchInitilizerで使用する
  dispatch(Actions.setStore({ controleMode: { scheduleInitDone: null } }));
  // クッキーをセット
  cmd.setCookeis('stdDate', newStdDate);
};

/**
 * 新しい月のセットを行う スケジュールには空のデータを送る
 */
export const setNewMonth = async (prms) => {
  const { newStdDate, hid, bid, weekDayDefaultSet, dispatch, setSnack, com } = prms;
  const fSch = await univApiCall({ a: 'fetchSchedule', hid, bid, date: newStdDate });
  if ((fSch?.data?.dt || []).length === 0) {
    const initSch = JSON.stringify({ initMonth: cmd.formatDate(new Date()) });
    const sendPrms = { a: 'sendSchedule', date: newStdDate, hid, bid, schedule: initSch };
    await univApiCall(sendPrms, '', setSnack);
  }
  // 基準日の変更
  dispatch(Actions.setStdDate(newStdDate));
  // 初期化のリセット 2022/09/17 追加 SchInitilizerで使用する
  dispatch(Actions.setStore({ controleMode: { scheduleInitDone: null } }));
  const mStr = newStdDate.slice(0, 4) + '年' + newStdDate.slice(5, 7) + '月';
  // 新しいdateListを構成
  const pi = (v) => parseInt(v);
  const l = cmd.getDatesArrayOfMonth(pi(newStdDate.split('-')[0]), pi(newStdDate.split('-')[1]));
  // weekDayDefaultSetによる設定
  const dateList = l.map((e) => {
    const holiday = weekDayDefaultSet[e.getDay()];
    const r = { date: e, holiday }; // 0 休日 1 休校日 2 施設休日
    return r;
  });
  const p = { ...prms, dateList, com, stdDate: newStdDate, schedule: {} };
  await setCloseDayToCalender(p);

  dispatch(Actions.setSnackMsg(`${mStr}を追加しました。`, ''));
  // クッキーをセット
  cmd.setCookeis('stdDate', newStdDate);
};

/**
 * com.ext.closeDaySettingとcom.ext.nationalHolidaysから休業日を設定する
 */
export const setCloseDayToCalender = async (prms) => {
  const {
    com, hid, bid, stdDate, dateList, dispatch, schedule
  } = prms;
  const schCnt = Object.keys(schedule ?? {}).filter(e => e.match(/^UID\d+/)).reduce((v, uids) => {
    v += Object.keys(schedule[uids]).filter(e => e.match(/D2\d{7}/)).length;
    return v;
  }, 0);
  if (schCnt) return false;
  // 設定済カレンダー。初期化を行わない
  if (dateList[0]?.calenderEdited) return false;

  const closeDaySetting = com?.ext?.closeDaySetting ?? {};
  const nationalHolidays = com?.ext?.nationalHolidays ?? {};
  const newDtlist = dateList.map(e => {
    const wd = e.date.getDay();
    const ymd = cmd.formatDate(e.date, 'YYYY-MM-DD');
    let holiday = e.holiday;
    // 祭日
    if (nationalHolidays[ymd] && !closeDaySetting.nationalHoliday) {
      holiday = 1;
    }
    else if (nationalHolidays[ymd] && closeDaySetting.nationalHoliday) {
      holiday = 2;
    }
    else if (!nationalHolidays[ymd] && wd > 0 && wd < 6) {
      holiday = 0;
    }
    // 日曜日
    if (wd === 0 && closeDaySetting.sunday === false) {
      holiday = 1;
    }
    else if (wd === 0 && closeDaySetting.sunday === true) {
      holiday = 2;
    }
    // 土曜日
    if (wd === 6 && closeDaySetting.saturday === false) {
      holiday = 1;
    }
    else if (wd === 6 && closeDaySetting.saturday === true) {
      holiday = 2;
    }
    return ({ date: e.date, holiday })
  })
  const sendPrms = { hid, bid, date: stdDate, dateList: newDtlist };
  const res = await sendCalender(sendPrms);
  if (res?.data?.dt?.result === false) {
    if (dispatch) dispatch(Actions.setSnackMsg('カレンダー通信エラーが発生しました。', 'warning'))
  }
  if (dispatch) dispatch(Actions.setStore({ dateList: newDtlist }))
  return res;
}
