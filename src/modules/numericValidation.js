import { convHankaku } from './stringUtils';
import { formatNum } from './numberUtils';

/**
 * 数値入力のバリデーションとフォーマット処理を行うユーティリティ
 * 
 * @param {string} inputValue - 入力された文字列
 * @param {object} config - バリデーション設定
 * @param {object} stateSetters - (任意) 状態更新関数 { setValue, setError, setErrorMsg }
 * @returns {object} { value, error, errorMsg }
 */
export const validateNumericInput = (inputValue, config = {}, stateSetters = {}) => {
  const { decimalPlace, required, lower, upper } = config;
  const { setValue, setError, setErrorMsg } = stateSetters;

  // 1. フォーマット処理 (半角化・小数点指定)
  let han = convHankaku(inputValue, true);
  if (decimalPlace) han = formatNum(han, 0, 0, decimalPlace);

  // 2. バリデーション
  let error = false;
  let errorMsg = '';
  const lower_ = (lower !== undefined && lower !== null) ? lower : 0;

  if (isNaN(han)) {
    error = true;
    errorMsg = '数値を入力';
  }
  else if (!han && required) {
    error = true;
    errorMsg = '入力必須';
  }
  else if (han < lower_) {
    error = true;
    errorMsg = '無効な数値';
  }
  else if (upper && han > upper) {
    error = true;
    errorMsg = '無効な数値';
  }

  // 3. (任意) 引数にセット関数が渡されている場合は実行
  if (typeof setValue === 'function') setValue(han);
  if (typeof setError === 'function') setError(error);
  if (typeof setErrorMsg === 'function') setErrorMsg(errorMsg);

  // 4. 結果をオブジェクトとして返す
  return {
    value: han,
    error,
    errorMsg
  };
};
