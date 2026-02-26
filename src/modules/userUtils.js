import axios from 'axios';
import { endPoint, uPrms } from './api';
import * as Actions from '../Actions';

/**
 * uidよりusersのオブジェクトを返す
 */
export const getUser = (UID, users, nextUsers = '') => {
  if (!UID) return {};
  if (!Array.isArray(users)) return {};
  const uid = UID.replace(/[^0-9]/g, '');
  const user = users.filter((e) => {
    return e.uid === uid;
  });
  const next = Array.isArray(nextUsers) ? nextUsers.find((e) => e.uid === uid) : null;
  const ret = !user.length ? {} : user[0];
  if (next) ret.next = next.next;
  return !user.length ? {} : user[0];
};

/**
 * ユーザーリストのフォーマット
 */
export const formatUserList = (res, date, getAge) => {
  const year = date.split('-')[0];
  const month = date.split('-')[1];
  const days = new Date(year, month, 0).getDate();

  const newDt = res.data.dt.map((e) => {
    const ages = getAge(e.birthday, date, e.etc?.ageOffset);
    return {
      ...e,
      age: ages.age,
      ageStr: ages.flx,
      ageNdx: ages.ageNdx,
    };
  });
  newDt.forEach((e) => {
    if (e.volume === '0') {
      e.volume = days - 8;
      e.volumeStd = true;
    }
  });

  newDt.forEach((e) => {
    if (e.ext && typeof e.ext === 'string') {
      e.ext = JSON.parse(e.ext);
    } else if (!e.ext) {
      e.ext = {};
    }
    if (e.etc && typeof e.etc === 'string') {
      e.etc = JSON.parse(e.etc);
    } else if (!e.etc) {
      e.etc = {};
    }
  });

  newDt.filter((e) => e.type.includes(',')).forEach((e) => {
    const s = e.type;
    e.type = s.split(',')[0];
    e.icareType = s.split(',')[1];
  });

  return { ...res, data: { ...res.data, dt: newDt } };
};

/**
 * uidの処理を行う
 */
export const convUID = (v) => {
  let num;
  let err = false;
  if (!v) return { str: null, num: null };
  if (isNaN(v) && v.indexOf('UID') == 0) {
    num = v.replace(/[^0-9]/g, '');
    if (num) num = parseInt(num);
    else err = true;
  } else {
    if (!isNaN(v)) num = parseInt(v);
    else err = true;
  }
  if (!err) return { str: 'UID' + num, num };
  else return { str: null, num: null };
};

/**
 * 名前を伏字にする
 */
export const getHiddenName = (name, mask) => {
  if (!name || mask === '0') return name;
  const name1 = name.split(' ')[0];
  const name2 = name.split(' ')[1];
  if (!name2) return name;
  const c = '●';
  if (mask === '2') {
    let masked1 = c.repeat(name1.length - 1) + name1.slice(-1);
    let masked2 = c.repeat(name2.length - 1) + name2.slice(-1);
    masked1 = masked1.length === 1 ? c : masked1;
    masked2 = masked2.length === 1 ? c : masked2;
    return masked1 + ' ' + masked2;
  } else if (mask === '1') {
    const masked1 = name1.slice(0, -1) + c;
    const masked2 = name2.slice(0, -1) + c;
    return masked1 + ' ' + masked2;
  }
  return name;
};

/**
 * 兄弟を取得する
 */
export const getBrothers = (uid, users, self = false, checkBrothersIndex = true) => {
  const thisUser = getUser(uid, users);
  if (parseInt(thisUser.brosIndex) === 0 && checkBrothersIndex) return [];
  if (!thisUser) return [];
  if (!Object.keys(thisUser).length) return [];
  const pphone = thisUser.pphone;
  const pname = thisUser.pname;
  const brosIndex = thisUser.brosIndex;
  const bros = users.filter(
    (e) =>
      e.pphone === pphone &&
      e.pname === pname &&
      (parseInt(e.brosIndex) > 0 || !checkBrothersIndex) &&
      (e.brosIndex !== brosIndex || self)
  );
  return bros;
};

/**
 * 長兄を取得する
 */
export const getFirstBros = (uid, users) => {
  const thisUser = getUser(uid, users);
  if (!thisUser) return false;
  if (parseInt(thisUser.brosIndex) === 0) return false;
  if (parseInt(thisUser.brosIndex) === 1) return uid;
  const bros = getBrothers(uid, users);
  const firstBros = bros.find((e) => parseInt(getUser(e.uid, users).brosIndex) === 1);
  if (firstBros) return 'UID' + firstBros.uid;
  else return false;
};

/**
 * １ユーザーオブジェクトを受け取り所属するclassroomの数を検出する
 */
export const classroomCount = (thisUser) => {
  if (!thisUser) return 0;
  let userClr = '';

  if (Object.keys(thisUser).length && thisUser.classroom) {
    userClr = thisUser.classroom;
  }
  if (!userClr) return 0;
  else if (Array.isArray(userClr)) return userClr.length;
  else if (userClr.indexOf(',') > -1) return userClr.split(',').length;
  else return 1;
};

/**
 * MTU対応 ユーザーデータから類推しそのclassroomが該当するか否か
 */
export const isClassroom = (thisUser, classroom, uid, users) => {
  let classrooms;
  let userClr;
  if (!classroom) return 1;
  if (thisUser && Object.keys(thisUser).length && thisUser.classroom) {
    userClr = thisUser.classroom;
  } else {
    const u = getUser(uid, users);
    if (!u) return false;
    if (Object.keys(u).length && u.classroom) userClr = u.classroom;
    else return false;
  }
  if (Array.isArray(userClr)) classrooms = userClr;
  else if (userClr.indexOf(',') > -1) classrooms = userClr.split(',');
  else classrooms = [userClr];

  if (classrooms.indexOf(classroom) > -1) return 1;
  else return 0;
};

/**
 * users etcに複数のデータ書き込みを行う
 */
export const sendUserEtcMulti = async (
  params,
  setResponse,
  dispatch = null,
  msg = '',
  openSnack = true
) => {
  let response;
  const dispathValue = (v) => ({ controleMode: { registedParamsOfficesSend: v } });
  try {
    params.a = 'sendUserEtcMulti';
    const encoded = params.etcs.map((e) => {
      return { uid: e.uid, etc: JSON.stringify(e.etc) };
    });
    params.etcs = JSON.stringify(encoded);
    response = await axios.post(endPoint(), uPrms(params));
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (typeof setResponse === 'function') {
      setResponse(response);
    }
    if (typeof dispatch === 'function') {
      dispatch(Actions.setStore(dispathValue('done')));
      if (!msg) msg = '他事業所の登録情報を書き込みました。';
      if (openSnack) dispatch(Actions.setSnackMsg(msg, ''));
    }
    return response;
  } catch (e) {
    console.log(e);
    if (response) response.data = false;
    if (typeof setResponse === 'function') {
      setResponse(response);
    }
    if (typeof dispatch === 'function') {
      dispatch(Actions.setStore(dispathValue('error')));
      dispatch(Actions.setSnackMsg('他事業所の登録情報の書き込みエラーです。', 'error'));
    }
    return response;
  }
};

/**
 * 市区町村の情報を書き込む
 */
export const sendUsersCity = async (params, setResponse, dispatch) => {
  let response;
  const controleDispath = (v) => ({ controleMode: { sendUsersCity: v } });
  try {
    params.a = 'replaceUsersCity';
    response = await axios.post(endPoint(), uPrms(params));
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    setResponse(response);
    if (typeof dispatch === 'function') {
      dispatch(Actions.setStore(controleDispath('done')));
      dispatch(Actions.setSnackMsg('市区町村の情報を書き込みました。', ''));
    }
  } catch (e) {
    console.log(e);
    setResponse(response);
    if (typeof dispatch === 'function') {
      dispatch(Actions.setStore(controleDispath({ params, response })));
      dispatch(Actions.setSnackMsg('市区町村情報の書き込みエラーです。', 'error'));
    }
  }
};

