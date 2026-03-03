import { convHankaku, convKanaToHiraAndChk } from '../../../modules/stringUtils';
import { formatTelNum } from '../../../modules/telUtils';
import { isMailAddress } from '../../../modules/formUtils';
import { parseDate } from '../../../modules/dateUtils';
import { forbiddenPtn } from '../../common/StdFormParts';
import { zp } from '../../../modules/stringUtils';

// 名前バリデーション
// { value, error, helperText } を返す
export const validateName = (value, { required = false, isKana = false } = {}) => {
  if (value && value.match(forbiddenPtn)) {
    return { value, error: true, helperText: '利用できない文字' };
  }
  if (!value && required) {
    return { value, error: true, helperText: '入力必須項目です。' };
  }
  if (isKana && value) {
    const chk = convKanaToHiraAndChk(value);
    if (!chk.result) {
      return { value, error: true, helperText: 'かなを入力してください。' };
    }
    return { value: chk.str, error: false, helperText: '' };
  }
  return { value, error: false, helperText: '' };
};

// 日付バリデーション（和暦パース含む）
// limit: 'YYYY-MM-DD,YYYY-MM-DD' 形式の範囲指定
export const validateDate = (value, { required = false, limit, helperTextShort = false, emptyVal = '0000-00-00' } = {}) => {
  if (!value && !required) {
    return { value: emptyVal, error: false, helperText: '' };
  }
  const han = convHankaku(value);
  const r = parseDate(han);

  if (required && !r.result) {
    return { value: han, error: true, helperText: '日付が必要' };
  }
  if (required && !han) {
    return { value: han, error: true, helperText: '入力必須項目' };
  }
  if (!han && !required) {
    return { value: emptyVal, error: false, helperText: '' };
  }
  if (r.result) {
    // 0000-00-00入力対応
    if (r.date.y === 1899 && r.date.m === 11 && r.date.d === 30) {
      return { value: emptyVal, error: false, helperText: '' };
    }
    const d = r.date.y + '-' + zp(r.date.m, 2) + '-' + zp(r.date.d, 2);
    // 範囲チェック
    if (limit) {
      const limits = limit.split(',').map(x => x.replace(/([0-9]{4}-[0-9]{2}-[0-9]{2}).*/, '$1'));
      if (limits[0] && d < limits[0]) {
        return { value: d, error: true, helperText: '日付が正しくありません' };
      }
      if (limits[1] && d > limits[1]) {
        return { value: d, error: true, helperText: '日付が正しくありません' };
      }
    }
    const ht = helperTextShort
      ? r.date.wr.s + r.date.wr.y
      : '西暦' + r.date.y + '年 ' + r.date.wr.full;
    return { value: d, error: false, helperText: ht };
  }
  return { value: han, error: true, helperText: '日付が不正' };
};

// 受給者証番号バリデーション
// users: 全利用者配列, uid: 編集中のユーザーID, hnoList: 3桁HNOリスト
export const validateHno = (value, { users = [], uid } = {}) => {
  const han = convHankaku(value);
  // 重複確認
  let existHno = false;
  if (!uid) {
    existHno = users.some(f => f.hno === han);
  } else {
    const uidn = uid.replace(/[^0-9]/g, '');
    existHno = users.some(f => f.hno === han && f.uid !== uidn);
  }

  if (isNaN(han)) {
    return { value: han, error: true, helperText: '数値が必要です。' };
  }
  if (parseInt(han) === 0) {
    return { value: '', error: true, helperText: '不正な番号です' };
  }
  if (!han) {
    return { value: han, error: true, helperText: '仮登録します' };
  }
  if (han.length !== 10 && han.length !== 3) {
    return { value: han, error: true, helperText: '番号は10桁です。' };
  }
  // 3桁の手入力禁止（仮設定ボタン経由のみ許可）
  if (han.length === 3) {
    return { value: '', error: true, helperText: '3桁は仮設定ボタン' };
  }
  if (existHno) {
    return { value: han, error: true, helperText: '受給者証番号重複' };
  }
  return { value: han, error: false, helperText: '' };
};

// 市区町村番号バリデーション
export const validateScityNo = (value, { existNumbers = [] } = {}) => {
  const han = convHankaku(value);
  const isValidFormat = /^\d{6}$/.test(han);
  if (!isValidFormat) {
    return { value: han, error: true, helperText: '6桁の数字が必要です。' };
  }
  if (existNumbers.includes(han)) {
    return { value: han, error: true, helperText: '既存の番号です' };
  }
  return { value: han, error: false, helperText: '' };
};

// 電話番号バリデーション
export const validatePhone = (value, { required = false } = {}) => {
  const rt = formatTelNum(value);
  if (!value && required) {
    return { value, error: true, helperText: '入力必須項目です。' };
  }
  if (!value) {
    return { value, error: false, helperText: '' };
  }
  if (!rt.result) {
    return { value, error: true, helperText: '番号が不正です' };
  }
  return { value: rt.format, error: false, helperText: '' };
};

// メールアドレスバリデーション
export const validateMail = (value, { required = false } = {}) => {
  const han = convHankaku(value);
  if (!han && required) {
    return { value: han, error: true, helperText: '入力必須項目です。' };
  }
  if (!han) {
    return { value: han, error: false, helperText: '' };
  }
  if (!isMailAddress(han)) {
    return { value: han, error: true, helperText: 'メールアドレスが不正です' };
  }
  return { value: han, error: false, helperText: '' };
};

// 数値バリデーション（汎用）
export const validateNumeric = (value, { required = false, lower = 0, upper = 0, numMode = false } = {}) => {
  const han = convHankaku(value, numMode);
  if (isNaN(han)) {
    return { value: han, error: true, helperText: '数値を入力してください。' };
  }
  if (!han && required) {
    return { value: han, error: true, helperText: '入力必須項目です。' };
  }
  if (!han) {
    return { value: han, error: false, helperText: '' };
  }
  const n = parseFloat(han);
  if (n < lower) {
    return { value: han, error: true, helperText: '無効な数値です。' };
  }
  if (upper && n > upper) {
    return { value: han, error: true, helperText: '無効な数値です。' };
  }
  return { value: han, error: false, helperText: '' };
};

// 契約支給量バリデーション
export const validateVolume = (value) => {
  const han = convHankaku(value);
  if (isNaN(han)) {
    return { value: han, error: true, helperText: '数値を入力してください。' };
  }
  if (!han) {
    return { value: han, error: true, helperText: '入力必須項目です。' };
  }
  const n = parseInt(han);
  if (n < 0 || n > 31) {
    return { value: han, error: true, helperText: '無効な数値です。' };
  }
  if (n === 0) {
    return { value: han, error: false, helperText: '原則の日数' };
  }
  return { value: han, error: false, helperText: '0入力で原則の日数' };
};

// 上限額バリデーション
export const validatePriceLimit = (value) => {
  const han = convHankaku(value);
  if (isNaN(han)) {
    return { value: han, error: true, helperText: '数値を入力してください。' };
  }
  if (!han) {
    return { value: han, error: true, helperText: '入力必須項目です。' };
  }
  if (han === 0 || han > 100000) {
    return { value: han, error: true, helperText: '無効な数値です。' };
  }
  return { value: han, error: false, helperText: '' };
};

// 記入欄番号バリデーション
export const validateLineNo = (value, { required = true } = {}) => {
  const han = convHankaku(value);
  if (isNaN(han)) {
    return { value: han, error: true, helperText: '数値を入力してください。' };
  }
  if (!han && required) {
    return { value: han, error: true, helperText: '入力必須項目です。' };
  }
  if (!han) {
    return { value: han, error: false, helperText: '' };
  }
  if (parseInt(han) === 0 || han > 100000) {
    return { value: han, error: true, helperText: '無効な数値です。' };
  }
  return { value: han, error: false, helperText: '' };
};
