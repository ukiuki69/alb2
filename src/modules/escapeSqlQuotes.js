/**
 * シングルクォートエスケープ関数
 * シングルクォートを2つのシングルクォートにエスケープします
 * @param {*} data - エスケープ対象のデータ（オブジェクト、配列、または基本型）
 * @returns {*} - エスケープ後のデータ
 */
export const escapeSqlQuotes = (data) => {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return data.replace(/'/g, "''");
  }

  if (Array.isArray(data)) {
    return data.map(item => escapeSqlQuotes(item));
  }

  if (typeof data === 'object') {
    const result = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = escapeSqlQuotes(data[key]);
      }
    }
    return result;
  }

  return data;
};
