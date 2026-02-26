import { zp } from './stringUtils';

/**
 * 数値操作に関連するユーティリティ
 */

// nullやundefinedを0にして返す
export const null2Zero = (v) => {
  if (v === undefined || v === null || isNaN(v)) return 0;
  return v;
};

// 数値のフォーマットを行う
export const formatNum = (n, c = 0, z = 0, dp = 0, nanDisp = false) => {
  n = String(n).replace(/,/g, ''); // あらかじめカンマを削除
  n = parseFloat(n);
  if (isNaN(n) && !nanDisp) return '';
  
  // 全体をtoFixedで四捨五入して整数部と小数部に分ける (繰り上がりを正しく扱うため)
  const rounded = n.toFixed(dp);
  const parts = rounded.split('.');
  let integerPart = parts[0];
  
  // カンマ付与
  if (c === 1) {
    integerPart = String(integerPart).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
  }
  
  // ゼロ埋め
  if (z > 0) {
    integerPart = zp(integerPart, z);
  }
  
  // 小数点以下の処理
  let result = integerPart;
  if (dp > 0) {
    result += '.' + parts[1];
  }
  return result;
};

// 定員から日毎の利用上限を求める
export const upperLimitOfUseByDay = (teiin) => {
  if (teiin <= 50) {
    return Math.floor(teiin * 1.5);
  } else {
    return Math.floor(teiin + (teiin - 50) * 0.25 + 25);
  }
};

