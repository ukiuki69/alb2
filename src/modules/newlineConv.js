/**
 * \nを<br>に変換する
 * @param {string} str - 変換対象の文字列
 * @returns {string} - 変換後の文字列
 */
export const lfToBr = (str) => {
  if (typeof str === 'string') {
    return str.replace(/(\\n|\n)/g, '<br>');
  }
  return str;
};

/**
 * <br>を\nに変換する
 * @param {string} str - 変換対象の文字列
 * @returns {string} - 変換後の文字列
 */
export const brtoLf = (str) => {
  if (typeof str === 'string') {
    return str.replace(/<br[\s/]*>/gi, '\n');
  }
  return str;
};

/**
 * ネストされたオブジェクトや配列内の文字列に含まれる<br>タグを改行文字(\n)に再帰的に変換します
 * @param {*} data - 変換対象のデータ（オブジェクト、配列、または基本型）
 * @returns {*} - 変換後のデータ
 */
export const processDeepBrToLf = (data) => {
  // nullまたはundefinedの場合はそのまま返す
  if (data === null || data === undefined) {
    return data;
  }

  // 文字列の場合は<br>を\nに変換して返す
  if (typeof data === 'string') {
    return data.replace(/<br\s*\/?>/gi, '\n');
  }

  // 配列の場合は各要素に対して再帰的に処理
  if (Array.isArray(data)) {
    return data.map(item => processDeepBrToLf(item));
  }

  // オブジェクトの場合は各プロパティに対して再帰的に処理
  if (typeof data === 'object') {
    const result = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = processDeepBrToLf(data[key]);
      }
    }
    return result;
  }

  // その他の型（数値、真偽値など）はそのまま返す
  return data;
};

/**
 * ネストされたオブジェクトや配列内の文字列に含まれる改行文字(\n, \r\n, \r)を指定文字列に再帰的に変換します
 * @param {*} data - 変換対象のデータ（オブジェクト、配列、または基本型）
 * @param {string} replaceStr - 改行文字を置き換える文字列（デフォルト: '<br>'）
 * @returns {*} - 変換後のデータ
 */
export const processDeepLfToBr = (data, replaceStr = '<br>') => {
  // nullまたはundefinedの場合はそのまま返す
  if (data === null || data === undefined) {
    return data;
  }

  // 文字列の場合は改行文字を指定文字列に変換して返す
  if (typeof data === 'string') {
    return data.replace(/\r\n/g, replaceStr).replace(/\n/g, replaceStr).replace(/\r/g, replaceStr);
  }

  // 配列の場合は各要素に対して再帰的に処理
  if (Array.isArray(data)) {
    return data.map(item => processDeepLfToBr(item, replaceStr));
  }

  // オブジェクトの場合は各プロパティに対して再帰的に処理
  if (typeof data === 'object') {
    const result = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = processDeepLfToBr(data[key], replaceStr);
      }
    }
    return result;
  }

  // その他の型（数値、真偽値など）はそのまま返す
  return data;
}; 