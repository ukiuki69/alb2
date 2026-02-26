/**
 * ネストされたオブジェクトや配列内の文字列から特殊文字を除去する関数
 * タブ文字、MS Wordからペーストされた特殊文字、制御文字などを除去します
 * @param {*} data - 変換対象のデータ（オブジェクト、配列、または基本型）
 * @returns {*} - 変換後のデータ
 */
export const cleanSpecialCharacters = (data) => {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return data
      // タブ文字を除去
      .replace(/\t/g, '')
      // MS Wordからペーストされた特殊文字を除去
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\u00A0/g, ' ') // ノンブレークスペース
      .replace(/\u200B/g, '') // ゼロ幅スペース
      .replace(/\u200C/g, '')
      .replace(/\u200D/g, '')
      .replace(/\uFEFF/g, '')
      // Excel/Google Sheets系の不可視区切り文字
      .replace(/[\u000B\u000C\u001C-\u001F]/g, '')
      // 全角スペース→半角スペース
      .replace(/\u3000/g, ' ')
      // Line Separator, Paragraph Separator → 改行
      .replace(/\u2028/g, '\n')
      .replace(/\u2029/g, '\n')
      // 制御文字（改行・キャリッジリターン以外）を除去
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // 連続する空白・改行を1つのスペースに
      .replace(/[ \u00A0\u3000]+/g, ' ')
      // 連続する改行を1つに
      // .replace(/\n{2,}/g, '\n')
      // 前後の空白・改行を除去
      .trim();
  }

  if (Array.isArray(data)) {
    return data.map(item => cleanSpecialCharacters(item));
  }

  if (typeof data === 'object') {
    const result = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = cleanSpecialCharacters(data[key]);
      }
    }
    return result;
  }

  return data;
};

/**
 * ネストされたオブジェクトや配列内の文字列からタブ文字のみを除去する関数
 * @param {*} data - 変換対象のデータ（オブジェクト、配列、または基本型）
 * @returns {*} - 変換後のデータ
 */
export const cleanTabCharacters = (data) => {
  // nullまたはundefinedの場合はそのまま返す
  if (data === null || data === undefined) {
    return data;
  }

  // 文字列の場合はタブ文字のみを除去して返す
  if (typeof data === 'string') {
    return data.replace(/\t/g, '');
  }

  // 配列の場合は各要素に対して再帰的に処理
  if (Array.isArray(data)) {
    return data.map(item => cleanTabCharacters(item));
  }

  // オブジェクトの場合は各プロパティに対して再帰的に処理
  if (typeof data === 'object') {
    const result = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = cleanTabCharacters(data[key]);
      }
    }
    return result;
  }

  // その他の型（数値、真偽値など）はそのまま返す
  return data;
};

/**
 * ネストされたオブジェクトや配列内の文字列からMS Wordの特殊文字のみを除去する関数
 * @param {*} data - 変換対象のデータ（オブジェクト、配列、または基本型）
 * @returns {*} - 変換後のデータ
 */
export const cleanMSWordCharacters = (data) => {
  // nullまたはundefinedの場合はそのまま返す
  if (data === null || data === undefined) {
    return data;
  }

  // 文字列の場合はMS Wordの特殊文字のみを除去して返す
  if (typeof data === 'string') {
    return data
      // MS Wordからペーストされた特殊文字を除去
      .replace(/[\u2018\u2019]/g, "'") // スマートクォート → 通常のクォート
      .replace(/[\u201C\u201D]/g, '"') // スマートダブルクォート → 通常のダブルクォート
      .replace(/[\u2013\u2014]/g, '-') // エンダッシュ・エムダッシュ → ハイフン
      .replace(/\u2026/g, '...') // 省略記号 → 3つのドット
      .replace(/\u00A0/g, ' ') // ノンブレークスペース → 通常のスペース
      .replace(/\u200B/g, '') // ゼロ幅スペースを除去
      .replace(/\u200C/g, '') // ゼロ幅非結合子を除去
      .replace(/\u200D/g, '') // ゼロ幅結合子を除去
      .replace(/\uFEFF/g, ''); // BOM（バイトオーダーマーク）を除去
  }

  // 配列の場合は各要素に対して再帰的に処理
  if (Array.isArray(data)) {
    return data.map(item => cleanMSWordCharacters(item));
  }

  // オブジェクトの場合は各プロパティに対して再帰的に処理
  if (typeof data === 'object') {
    const result = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = cleanMSWordCharacters(data[key]);
      }
    }
    return result;
  }

  // その他の型（数値、真偽値など）はそのまま返す
  return data;
};
