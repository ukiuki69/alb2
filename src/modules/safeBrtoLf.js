import { brtoLf } from '../commonModule';

/**
 * 安全なbrtoLf関数
 * null/undefined値や非文字列値を適切に処理し、エラー時にもフォールバック値を提供します
 * @param {*} value - 変換対象の値
 * @returns {string} - 変換後の文字列
 */
export const safeBrtoLf = (value) => {
  try {
    if (value === null || value === undefined) return '';
    if (typeof value !== 'string') return String(value);
    return brtoLf(value);
  } catch (error) {
    console.error('brtoLf処理エラー:', error, 'value:', value);
    return String(value || '');
  }
};
