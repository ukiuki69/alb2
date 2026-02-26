import axios from 'axios';
import Cookies from 'js-cookie';
import { cleanSpecialCharacters } from './cleanSpecialCharacters';
import { packPrms } from './makeCreteria';
import { getLS } from './localStrageOprations';
import { processDeepLfToBr } from './newlineConv';

// apixfg.php / apidev.php のパラメータ a と経過時間をコンソールに出力（デバッグ用）
// 止めたいときは false にする
const API_CHECK_DEBUG = 0; // 1: 出力する、0: 出力しない

const isTargetApi = (url) => url && (url.includes('apixfg.php') || url.includes('apidev.php'));

const getParamA = (data) => {
  if (data == null) return '';
  if (typeof data.get === 'function') return data.get('a') ?? '';
  if (typeof data === 'string') return new URLSearchParams(data).get('a') ?? '';
  return data?.a ?? '';
};

if (API_CHECK_DEBUG) {
  axios.interceptors.request.use(config => {
    if (isTargetApi(config.url)) {
      config._apiCheckStart = performance.now();
      config._apiCheckParamA = getParamA(config.data || config.params);
    }
    return config;
  });

  axios.interceptors.response.use(
    (response) => {
      if (response.config._apiCheckStart != null) {
        const elapsed = (performance.now() - response.config._apiCheckStart).toFixed(0);
        const paramA = response.config._apiCheckParamA ?? getParamA(response.config.data || response.config.params);
        console.log(`[API Check] a: ${paramA}  経過時間: ${elapsed}ms`);
      }
      return response;
    },
    (error) => {
      if (error.config?._apiCheckStart != null) {
        const elapsed = (performance.now() - error.config._apiCheckStart).toFixed(0);
        const paramA = error.config?._apiCheckParamA ?? getParamA(error.config?.data || error.config?.params);
        console.log(`[API Check] a: ${paramA}  経過時間: ${elapsed}ms (エラー)`);
      }
      return Promise.reject(error);
    }
  );
}

/**
 * APIエンドポイントを取得する
 */
export const endPoint = () => {
  const ep = Cookies.get('endPoint');
  const apiList = ['api', 'apixfg', 'apidev', 'apisandbox'];
  if (!ep) {
    return 'https://houday.rbatos.com/api/api.php';
  } else if (apiList.indexOf(ep) > -1) {
    return `https://houday.rbatos.com/api/${ep}.php`;
  } else {
    return 'https://houday.rbatos.com/api/api.php';
  }
};

/**
 * URLSearchParamsを作成する
 */
export const makeUrlSearchParams = (params) => {
  let rt = new URLSearchParams('');
  Object.keys(params).forEach(key => {
    rt.append(key, params[key]);
  });
  return rt;
};

/**
 * makeUrlSearchParamsのエイリアス
 */
export const uPrms = (params) => makeUrlSearchParams(params);

/**
 * 汎用APIコールモジュール
 */
export const univApiCall = async (
  prms, errorId, setRes = '', setSnack = '', msg = '', errMsg = '', simple = false, cancelToken
) => {
  let response;
  packPrms(prms);
  Object.keys(prms).forEach(key => {
    const value = prms[key];
    if (typeof value === 'object' && value !== null) {
      prms[key] = JSON.stringify(cleanSpecialCharacters(value));
      return;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const looksLikeJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));
      if (looksLikeJson) {
        try {
          const parsed = JSON.parse(value);
          prms[key] = JSON.stringify(cleanSpecialCharacters(parsed));
          return;
        } catch (_) {}
      }
      prms[key] = cleanSpecialCharacters(value);
      return;
    }
    prms[key] = value;
  });

  const startTime = performance.now();
  try {
    response = await axios.post(
      endPoint(),
      uPrms(prms),
      cancelToken 
      ? { cancelToken: cancelToken.token, timeout: 10000 }
      : { timeout: 10000 }
    );
    const endTime = performance.now();
    if (response) response.duration = endTime - startTime;

    if (cancelToken && cancelToken.token.reason) return;
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (!response.data.result) throw response;

    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      if (!msg) msg = '実行しました。';
      setSnack({ msg, id });
    }
    return response;
  } catch (e) {
    if (axios.isCancel(e)) {
      console.log("Request cancelled", e.message);
      return;
    }
    console.log(e);
    if (!response) response = { data: false };
    response.duration = performance.now() - startTime;
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = '実行できませんでした。';
      setSnack({ msg: errMsg, severity: 'error', errorId });
    }
    console.log('errorId', errorId);
    response.errorId = errorId;
    return response;
  }
};

/**
 * 汎用APIコールモジュール（JSON送信バージョン）
 */
export const univApiCallJson = async (
  prms, errorId, setRes = '', setSnack = '', msg = '', errMsg = '', simple = false, cancelToken
) => {
  let response;
  try {
    response = await axios.post(
      endPoint(),
      prms,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
        ...(cancelToken ? { cancelToken: cancelToken.token } : {})
      }
    );

    if (cancelToken && cancelToken.token.reason) return;
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (!response.data.result) throw response;

    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      if (!msg) msg = '実行しました。';
      setSnack({ msg, id });
    }
    return response;
  } catch (e) {
    if (axios.isCancel(e)) {
      console.log("Request cancelled", e.message);
      return;
    }
    console.log(e);
    if (!response) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = '実行できませんでした。';
      setSnack({ msg: errMsg, severity: 'error', errorId });
    }
    console.log('errorId', errorId);
    response.errorId = errorId;
    return response;
  }
};

/**
 * 単純にjsonやxmlを取ってくる用
 */
export const simpleApiCall = async (
  prms, errorId, setRes = '', setSnack = '', msg = '', errMsg = ''
) => {
  let response;
  try {
    response = await axios.post(endPoint(), uPrms(prms));
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (typeof response.data === 'string' && response.data.includes('file_get_contents')) throw response;
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      if (!msg) msg = '実行しました。';
      setSnack({ msg });
    }
    return response;
  } catch (e) {
    console.log(e);
    if (!response || !response.data) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = '実行できませんでした。';
      setSnack({ msg: errMsg, severity: 'error', errorId });
    }
    console.log('errorId', errorId);
    return response;
  }
};

/**
 * fsonのExcel変換をコールする
 */
export const fsConCnvExcel = async (
  prms, setRes = '', setSnack = '', msg = '', errMsg = ''
) => {
  let response;
  prms.a = 'fsConCnvExcel';
  try {
    response = await axios.post(endPoint(), uPrms(prms));
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (!response.data.result) throw response;
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      if (!msg) msg = '変換を実行しました。';
      setSnack({ msg });
    }
    return response;
  } catch (e) {
    console.log(e);
    if (!response || !response.data) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = '変換できませんでした。';
      setSnack({ msg: errMsg, severity: 'error', errorId: '3E5544' });
    }
    console.log('errorId', '3E5544');
    return response;
  }
};

/**
 * ユーザー別の予定書き込み
 */
export const sendUsersSchedule = async (
  prms, setRes = '', setSnack = '', userName = ''
) => {
  let response;
  prms.a = 'sendUsersSchedule';
  prms.schedule = JSON.stringify(prms.schedule).replace(/\\n/g, ' ');
  try {
    response = await axios.post(endPoint(), uPrms(prms));
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      const msg = userName ? 
        userName + 'さんの予定を送信しました。' : '利用者の予定を送信しました。';
      setSnack({ msg, id });
    }
    return response;
  } catch (e) {
    console.log(e);
    if (!response) response = { data: false };
    const errorId = '2E34435';
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const msg = userName ? 
        userName + 'さんの予定で送信エラーが発生しました。' : 
        '利用者の予定を送信エラーが発生しました。';
      setSnack({ msg, severity: 'error', errorId });
    }
    console.log('sendUsersScheduleErr', response);
    return response;
  }
};

/**
 * スケジュールの一部更新
 */
export const sendPartOfSchedule = async (
  prms, setRes = '', setSnack = '', msg = '', errMsg = '', normalSnack = false
) => {
  let response;
  prms.a = 'sendPartOfSchedule';
  
  if (prms?.partOfSch && typeof prms.partOfSch === 'object') {
    Object.keys(prms.partOfSch).forEach((key) => {
      const value = prms.partOfSch[key];
      const isEmptyObject = value
        && typeof value === 'object'
        && !Array.isArray(value)
        && Object.keys(value).length === 0;
      const isEmptyArray = Array.isArray(value) && value.length === 0;
      if (isEmptyObject || isEmptyArray) {
        delete prms.partOfSch[key];
      }
    });
  }

  prms.partOfSch = JSON.stringify(prms.partOfSch).replace(/\\n/g, ' ');
  try {
    response = await axios.post(endPoint(), uPrms(prms), { timeout: 10000 });
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (!response.data.result) throw response;
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function' && normalSnack) {
      const id = new Date().getTime();
      if (!msg) msg = '予定を更新しました。';
      setSnack({ msg, severity: '', id });
    }
    return response;
  } catch (e) {
    console.log(e);
    if (e.message === 'Network Error') {
      if (typeof setSnack === 'function') {
        errMsg = 'ネットワークエラーが発生しました。ネット接続を確認して再読み込みをしてからご利用ください。データの書き込みは無効になります。';
        setSnack({ msg: errMsg, severity: 'error', errorId: '2E3449' });
      }
    }
    if (!response) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = '予定を更新できませんでした。今月のスケジュールの初期化が完了していないとこのエラーが発生することがあります。一度スケジュールの画面を表示して初期化を完了して下さい。';
      setSnack({ msg: errMsg, severity: 'error', errorId: '2E3446' });
    }
    return response;
  }
};

const filterNestedData = (data, ptn1, ptn2) => {
  const filteredData = {};
  Object.keys(data).forEach(key1 => {
    if (ptn1.test(key1)) {
      const innerData = data[key1];
      const filteredInnerData = {};
      Object.keys(innerData).forEach(key2 => {
        if (ptn2.test(key2)) {
          filteredInnerData[key2] = innerData[key2];
        }
      });
      if (Object.keys(filteredInnerData).length > 0) {
        filteredData[key1] = filteredInnerData;
      }
    }
  });
  return filteredData;
};

const deleteNestedProperties = (obj, keysToDelete) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  for (const key in obj) {
    if (keysToDelete.includes(key)) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      deleteNestedProperties(obj[key], keysToDelete);
    }
  }
  return obj;
};

/**
 * 従来のパートオフスケジュールとの互換性を持たせるモジュール
 */
export const sendPartOfScheduleCompt = async (
  prms, setRes = '', setSnack = '', msg = '', errMsg = '', normalSnack = false
) => {
  const permission = Number(getLS('permission'));
  const permissionLimit = true;
  const did = permissionLimit ? prms.partOfSch?.modDid : false;
  const toDelete = permissionLimit ? prms.partOfSch?.deleteDid : false;
  const useNewApi = did && permissionLimit;
  const didRex = new RegExp(`^${did}`);
  const partOfSch = useNewApi
    ? filterNestedData(prms.partOfSch, /^UID[0-9]+/, didRex)
    : prms.partOfSch;
  
  let response;
  prms.a = useNewApi ? 'sendPartOfData' : 'sendPartOfSchedule';
  if (toDelete) {
    prms.a = 'deletePartOfData';
    const keyTodelete = [prms.uid, prms.partOfSch?.deleteDid];
    prms.keyToDelete = JSON.stringify(keyTodelete);
  }
  
  prms.partOfSch = deleteNestedProperties(prms.partOfSch, 'modDid');
  prms.partOfSch = deleteNestedProperties(prms.partOfSch, 'deleteDid');

  const cleanedPartOfSch = cleanSpecialCharacters(partOfSch);
  const sanitizedPartOfSch = processDeepLfToBr(cleanedPartOfSch, ' ');

  prms.table = 'ahdschedule';
  prms.column = 'schedule';
  if (useNewApi) {
    prms.partOfData = JSON.stringify(sanitizedPartOfSch).replace(/\\n/g, ' ');
    prms.partOfSch = '{}';
  } else {
    prms.partOfSch = JSON.stringify(sanitizedPartOfSch).replace(/\\n/g, ' ');
  }

  try {
    response = await axios.post(endPoint(), uPrms(prms), { timeout: 10000 });
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (!response.data.result) throw response;
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function' && normalSnack) {
      const id = new Date().getTime();
      if (!msg) msg = '予定を更新しました。';
      setSnack({ msg, severity: '', id });
    }
    return response;
  } catch (e) {
    console.log(e);
    if (e.message === 'Network Error') {
      if (typeof setSnack === 'function') {
        errMsg = 'ネットワークエラーが発生しました。ネット接続を確認して再読み込みをしてからご利用ください。データの書き込みは無効になります。';
        setSnack({ msg: errMsg, severity: 'error', errorId: '2E3449' });
      }
    }
    if (!response) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = '予定を更新できませんでした。今月のスケジュールの初期化が完了していないとこのエラーが発生することがあります。一度スケジュールの画面を表示して初期化を完了して下さい。';
      setSnack({ msg: errMsg, severity: 'error', errorId: '2E3446' });
    }
    return response;
  }
};

/**
 * カレンダーの送信
 */
export const sendCalender = async (
  prms, setRes = '', setSnack = '', msg = '', errMsg = ''
) => {
  let response;
  prms.a = 'sendCalender';
  
  // commonModule から formatDate をインポートできない（循環回避のため）ため、Date API を直接使うか
  // ここでは外部からフォーマット済みで渡されることを期待するか、簡易的な変換を行う
  // ひとまず albCommonModule からの移行を優先し、cmd.formatDate の代わりに簡易実装
  const formatDate = (date) => {
    if (typeof date === 'string') return date;
    const d = new Date(date);
    const y = d.getFullYear();
    const m = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${y}-${m}-${day}`;
  };

  const newList = prms.dateList.map(e => {
    return ({
      ...e, date: formatDate(e.date),
    });
  });
  
  const listDate = newList[0].date;
  if (listDate !== prms.date) {
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = 'カレンダーを送信できませんでした。';
      setSnack({ msg: errMsg, severity: 'error', errorId: '2C3398' });
    }
    return false;
  }
  
  prms.dateList = JSON.stringify(newList);
  try {
    response = await axios.post(endPoint(), uPrms(prms));
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (!response.data.result) throw response;
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      if (!msg) msg = 'カレンダーを送信しました。';
      setSnack({ msg });
    }
    return response;
  } catch (e) {
    console.log(e);
    if (!response) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = 'カレンダーを送信できませんでした。';
      setSnack({ msg: errMsg, severity: 'error', errorId: '2C3398' });
    }
    return response;
  }
};

/**
 * ユーザー情報の更新
 */
export const sendUser = async (
  prms, setRes = '', setSnack = '', msg = '', errMsg = ''
) => {
  let response;
  if (prms.icareType && !prms.type.includes(prms.icareType)) {
    prms.type += ',' + prms.icareType;
  }
  
  prms.a = 'sendUserWithEtc';
  Object.keys(prms).forEach(e => {
    if (typeof prms[e] === 'object') {
      prms[e] = JSON.stringify(prms[e]);
    }
  });
  try {
    response = await axios.post(endPoint(), uPrms(prms));
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (!response.data.result) throw response;
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      if (!msg) msg = `${prms.name}さんの情報を送信しました。`;
      setSnack({ msg });
    }
    return response;
  } catch (e) {
    console.log(e);
    if (!response) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = `${prms.name}さんの情報を送信出来ませんでした。`;
      setSnack({ msg: errMsg, severity: 'error', errorId: '2C3392' });
    }
    return response;
  }
};

/**
 * データオブジェクトをDBに送信
 */
export const genFKdatas = async (
  prms, setRes = '', setSnack = '', msg = '', errMsg = ''
) => {
  let response;
  prms.a = 'genFKdatas';
  try {
    response = await axios.post(endPoint(), uPrms(prms));
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (!response.data.fname) throw response;
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      if (!msg) msg = 'データを取得しました。';
      setSnack({ msg });
    }
    return response;
  } catch (e) {
    console.log(e);
    if (!response) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = 'データを取得できませんでした。';
      setSnack({ msg: errMsg, severity: 'error', errorId: '2E5567' });
    }
    return response;
  }
};

/**
 * 任意のステートをDBに送信
 */
export const sendSomeState = async (
  prms, setRes = '', setSnack = '', msg = '', errMsg = ''
) => {
  let response;
  prms.a = 'sendSomeState';
  if (prms.partOfSch) prms.partOfSch = JSON.stringify(prms.partOfSch);
  try {
    response = await axios.post(endPoint(), uPrms(prms));
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (!response.data.result) throw response;
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      if (!msg) msg = 'データを送信しました。';
      setSnack({ msg });
    }
    return response;
  } catch (e) {
    console.log(e);
    if (!response) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = 'データを送信できませんでした。';
      setSnack({ msg: errMsg, severity: 'error', errorId: '2E5543' });
    }
    return response;
  }
};

/**
 * dbに格納されているstateを取得
 */
export const fetchSomeState = async (
  prms, setRes = '', setSnack = '', msg = '', errMsg = ''
) => {
  let response;
  prms.a = 'fetchSomeState';
  try {
    response = await axios.post(endPoint(), uPrms(prms));
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (!response.data.result) throw response;
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      if (!msg) msg = 'データを受信しました。';
      setSnack({ msg });
    }
    return response;
  } catch (e) {
    console.log(e);
    if (!response) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = 'データを受信できませんでした。';
      setSnack({ msg: errMsg, severity: 'error', errorId: '2E5543' });
    }
    return response;
  }
};

/**
 * 接続されているdb名を取得
 */
export const fetchDbname = async (
  setRes = '', setSnack = '', msg = '', errMsg = ''
) => {
  let response;
  const prms = { a: 'getDbname' };
  try {
    response = await axios.post(endPoint(), uPrms(prms));
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    console.log('fetchDbname', response.data);
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      if (!msg) msg = 'データを受信しました。';
      setSnack({ msg });
    }
    return response;
  } catch (e) {
    console.log(e);
    if (!response) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = 'データを受信できませんでした。';
      setSnack({ msg: errMsg, severity: 'error', errorId: '2E5543' });
    }
    return response;
  }
};

/**
 * comとuserの次月以降の変更予定を取得する
 */
export const getNextHist = async (
  prms, setRes = '', setSnack = '', msg = '', errMsg = ''
) => {
  let response = {};
  let r;
  try {
    prms.a = 'fetchNextUserInfo';
    r = await axios.post(endPoint(), uPrms(prms));
    response.fetchNextUserInfo = r;
    if (r.status !== 200) throw response;
    if (!r.data) throw response;
    
    prms.a = 'fetchNextComInfo';
    r = await axios.post(endPoint(), uPrms(prms));
    response.fetchNextComInfo = r;
    if (r.status !== 200) throw response;
    if (!r.data) throw response;
    
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      if (!msg) msg = 'データを受信しました。';
      setSnack({ msg });
    }
    response.result = true;
    return response;
  } catch (e) {
    console.log(e);
    if (!response) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = 'データを受信できませんでした。';
      setSnack({ msg: errMsg, severity: 'error', errorId: '2E3398' });
    }
    return response;
  }
};

/**
 * 指定されたhid,bidの最大日付と最小日付を求める
 */
export const getMinMaxOfMonnth = async (
  prms, setRes = '', setSnack = '', msg = '', errMsg = ''
) => {
  let response;
  prms.a = 'getMinMaxOfMonnth';
  try {
    response = await axios.post(endPoint(), uPrms(prms));
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      if (!msg) msg = 'データを受信しました。';
      setSnack({ msg });
    }
    return response;
  } catch (e) {
    console.log(e);
    if (!response) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = 'データを受信できませんでした。';
      setSnack({ msg: errMsg, severity: 'error', errorId: '2E3398' });
    }
    return response;
  }
};

/**
 * スケジュールを削除する
 */
export const deleteSchedule = async (
  prms, setRes = '', setSnack = '', msg = '', errMsg = ''
) => {
  let response;
  prms.a = 'deleteSchedule';
  try {
    response = await axios.post(endPoint(), uPrms(prms));
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (!response.data.result) throw response;
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      if (!msg) msg = '当月のスケジュールを削除しました。';
      setSnack({ msg });
    }
    return response;
  } catch (e) {
    console.log(e);
    if (!response) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = '当月のスケジュールを削除できませんでした。';
      setSnack({ msg: errMsg, severity: 'error', errorId: '3E5546' });
    }
    return response;
  }
};

/**
 * アカウントリストを取得
 */
export const fetchAccountsByBid = async (
  prms, setRes = '', setSnack = '', msg = '', errMsg = ''
) => {
  let response;
  prms.a = 'fetchAccountsByBid';
  try {
    response = await axios.post(endPoint(), uPrms(prms));
    if (response.status !== 200) throw response;
    if (!response.data) throw response;
    if (!response.data.result) throw response;
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      const id = new Date().getTime();
      if (!msg) msg = '変換を実行しました。';
      setSnack({ msg });
    }
    return response;
  } catch (e) {
    console.log(e);
    if (!response) response = { data: false };
    if (typeof setRes === 'function') {
      setRes(response);
    }
    if (typeof setSnack === 'function') {
      if (!errMsg) errMsg = '変換できませんでした。';
      setSnack({ msg: errMsg, severity: 'error', errorId: '3E5543' });
    }
    return response;
  }
};
