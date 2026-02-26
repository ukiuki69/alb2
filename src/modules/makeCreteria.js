import CryptoJS from 'crypto-js';
// import { permissionCheckTemporary } from './permissionCheck'; // 使用していないため削除
import { PERMISSION_DEVELOPER } from './contants';
import { getUisCookieInt, uisCookiePos } from './uiUtils';

export const packPrms = (prms) => {
  const criteriaKeys = ['hid', 'bid', 'uid', 'a', 'date'];
  const criteriaData = {};
  const useEncryption = getUisCookieInt(uisCookiePos.useEncryption);
  if (!useEncryption) return;
  let hasCriteria = false;
  criteriaKeys.forEach(key => {
    if (prms[key] !== undefined) {
      criteriaData[key] = prms[key];
      delete prms[key];
      hasCriteria = true;
    }
  });

  if (hasCriteria) {
    prms.criteria = makeCreteria(criteriaData);
  }
};

/**
 * データをAES-128-ECBで暗号化し、Base64文字列として返します。
 * キーは 'albatros' + YYYYMMDD (JST) をSHA-256でハッシュ化した値の先頭16バイトです。
 * 
 * @param {Object} data - 暗号化するオブジェクト
 * @returns {string} - 暗号化されたBase64文字列
 */
export const makeCreteria = (data) => {
  if (!data) return '';

  // JST (Asia/Tokyo) で YYYYMMDD を確実に取得
  const now = new Date();
  const jstDate = now.toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/[^0-9]/g, '');

  const keyStr = `albatros${jstDate}`;
  // SHA-256でハッシュ化し、その先頭16バイト（128ビット）をAES-128のキーとして使用
  const fullHash = CryptoJS.SHA256(keyStr);
  const key = CryptoJS.lib.WordArray.create(fullHash.words.slice(0, 4), 16);
  
  const dataStr = JSON.stringify(data);

  // AES-128-ECBで暗号化
  const encrypted = CryptoJS.AES.encrypt(dataStr, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });

  return encrypted.toString(); // Base64文字列を返す
};
