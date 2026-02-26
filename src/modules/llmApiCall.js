import axios from 'axios';
import { endPoint } from '../Rev';
import * as cmd from '../commonModule';
import { univApiCall } from '../albCommonModule';

// 開発環境フラグ（cookie endPoint に応じて自動判定）
export const isLLMDevMode = () => {
  try {
    const ep = cmd.getCookeis && cmd.getCookeis('endPoint');
    // api -> false（本番）、apixfg/apidev/それ以外 -> true（dev）
    if (ep === 'api') return false;
    return true;
  } catch (_) {
    // 取得不能時は dev を既定にする
    return true;
  }
};

// プロンプト暗号化の有効/無効（trueで暗号化して送信）
// クッキーの endPoint が 'api' のときのみ暗号化を有効化
export const isLLMPromptCryptEnabled = () => {
  try {
    const ep = cmd.getCookeis && cmd.getCookeis('endPoint');
    // apidev / apixfg のときは暗号化しない。その他（未設定含む）は暗号化する
    if (ep === 'apidev' || ep === 'apixfg') return false;
    return true;
  } catch (_) {
    // 取得不能時はデフォルトで暗号化を有効化
    return true;
  }
};

// AES-128-CBC で文字列を暗号化し、Base64で返す
const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// このモジュール内に保持する暗号化キー（必要に応じて変更してください）
export const LLM_PROMPT_CRYPT_KEY = 'F8Qk4d0h3Zp1V2m9Sx7uN5tCw3yL8aB4'; // 32文字のランダムASCII

const deriveKeyAndIvFromKey = async (keyStr) => {
  const enc = new TextEncoder();
  const keyBytesInput = enc.encode(keyStr);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyBytesInput);
  const hashBytes = new Uint8Array(hashBuffer);
  const keyBytes = hashBytes.slice(0, 16); // 128-bit key
  const iv = hashBytes.slice(16, 32);      // 128-bit IV
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-CBC' },
    false,
    ['encrypt']
  );
  return { key, iv };
};

const encryptPromptAES128 = async (plainText, keyStr) => {
  const enc = new TextEncoder();
  const { key, iv } = await deriveKeyAndIvFromKey(keyStr);
  const ptBytes = enc.encode(plainText);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, ptBytes);
  return arrayBufferToBase64(encrypted);
};

export const llmApiCall = async (
  prms, errorId, setRes='', setSnack='', msg = '', errMsg='', simple=false, cancelToken, 
) => {
  let response;
  const apiUrl = isLLMDevMode() 
    ? `https://houday.rbatos.com/api/llmapidev.php`
    : `https://houday.rbatos.com/api/llmapi.php`;

  const logMeta = {
    hid: prms?.hid,
    bid: prms?.bid,
    date: prms?.date,
    llmItem: (prms?.llmItem || 'llmApiCall').trim(),
  };

  try {
    // リクエストボディを構築
    const requestBody = {
      prompt: prms.prompt,
      systemrole: prms.systemrole
    };

    // max_tokensとtemperatureが指定されている場合は追加
    if (prms.max_tokens !== undefined) {
      requestBody.max_tokens = prms.max_tokens;
    }
    if (prms.temperature !== undefined) {
      requestBody.temperature = prms.temperature;
    }
    if (prms.model !== undefined) {
      requestBody.model = prms.model;
    }

    // 暗号化: デフォルトは暗号化し、暗号化しない場合のみ notcrypt を送信
    if (isLLMPromptCryptEnabled() === true) {
      requestBody.prompt = await encryptPromptAES128(requestBody.prompt ?? '', LLM_PROMPT_CRYPT_KEY);
      if (requestBody.systemrole !== undefined && requestBody.systemrole !== null) {
        requestBody.systemrole = await encryptPromptAES128(String(requestBody.systemrole), LLM_PROMPT_CRYPT_KEY);
      }
    } else {
      requestBody.notcrypt = true;
    }

    // POSTリクエストを作成（プロンプトをリクエストボディに含める）
    response = await axios.post(
      apiUrl,
      requestBody,
      {
        timeout: 180000, // LLMは処理に時間がかかる可能性があるため長めのタイムアウト
        ...(cancelToken ? { cancelToken: cancelToken.token } : {})
      }
    );

    // リクエストがキャンセルされた場合は関数を終了
    if (cancelToken && cancelToken.token.reason) return;

    // 200以外のステータスの場合はエラーを投げる
    if (response.status !== 200) throw response;
    
    if (!response.data) throw response;

    // setRes関数が提供されていれば結果を設定
    if ((typeof setRes) === 'function'){
      setRes(response);
    }
    
    // setSnack関数が提供されていれば通知を表示
    if ((typeof setSnack) === 'function'){
      const id = new Date().getTime();
      if (!msg) msg = 'LLM応答を受信しました。';
      setSnack({msg, id, severity: 'success'})
    }
    
    return(response);
  }
  catch(e){
    console.log(e);
    // リクエストがキャンセルされた場合はメッセージをログに記録し、関数を終了
    if (axios.isCancel(e)) {
      console.log("LLMリクエストがキャンセルされました", e.message);
      return;
    }

    // エラーをログに出力
    console.log(e);
    
    // レスポンスが存在しない場合は空のオブジェクトを作成
    if (!response) response = { data: false };
    
    // setRes関数が提供されていれば結果を設定
    if ((typeof setRes) === 'function'){
      setRes(response);
    }
    
    // setSnack関数が提供されていれば通知を表示
    if ((typeof setSnack) === 'function'){
      if (!errMsg) errMsg = 'LLM応答を受信できませんでした。'
      setSnack({msg: errMsg, severity:'error', errorId});
    }
    
    console.log('errorId', errorId);
    response.errorId = errorId;
    return(response);
  } finally {
    if (logMeta.hid && logMeta.bid && logMeta.llmItem) {
      sendLlmCalledLog(logMeta.hid, logMeta.bid, logMeta.date, logMeta.llmItem);
    }
  }
};

export const sendLlmCalledLog = async (hid, bid, date, llmItem) => {
  if (!hid || !bid || !llmItem) return;
  const recordDate = date || '0000-00-00';
  const monthKeySource = recordDate.slice(0, 7).replace('-', '');
  const monthKey = monthKeySource && monthKeySource.length === 6
    ? monthKeySource
    : new Date().toISOString().slice(0, 7).replace('-', '');

  const fetchPrms = {
    hid,
    bid,
    date: recordDate,
    item: 'llmCalled',
    a: 'fetchAnyState',
  };

  let existingState = {};
  try {
    const fetchRes = await univApiCall(fetchPrms, '', '', '', '', '', false);
    if (fetchRes?.data?.result && Array.isArray(fetchRes.data.dt) && fetchRes.data.dt.length > 0) {
      existingState = fetchRes.data.dt[0].state || {};
    }
  } catch (_) {}

  const rawItemState = existingState[llmItem];
  let itemState = {};
  if (rawItemState && typeof rawItemState === 'object') {
    itemState = { ...rawItemState };
  } else if (typeof rawItemState === 'string') {
    try { itemState = JSON.parse(rawItemState); } catch (_) { itemState = {}; }
  }

  const nextState = {
    ...existingState,
    [llmItem]: {
      ...itemState,
      [monthKey]: (Number(itemState[monthKey]) || 0) + 1,
    },
  };

  try {
    await univApiCall({
      hid,
      bid,
      date: recordDate,
      item: 'llmCalled',
      state: JSON.stringify(nextState),
      keep: 365,
      a: 'sendAnyState',
    }, '', '', '', '', '', false);
  } catch (_) {}
};
