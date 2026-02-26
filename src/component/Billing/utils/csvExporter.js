/**
 * オブジェクト配列をCSV Blobに変換するユーティリティ
 */
import Encoding from 'encoding-japanese';

/**
 * オブジェクト配列からCSV文字列を生成する
 * @param {Array} data - オブジェクト配列
 * @param {Array} columns - 出力する列のキー配列（指定しない場合は最初のオブジェクトのキーを使用）
 * @param {Array} titles - 列タイトル配列（指定しない場合はcolumnsを使用）
 * @returns {string} CSV形式の文字列
 */
export const objectArrayToCsvString = (data, columns = null, titles = null) => {
  if (!data || !data.length) return '';

  // 列キーが指定されていない場合は最初のオブジェクトからキーを取得
  const columnKeys = columns || Object.keys(data[0]);
  
  // タイトル行の作成（titlesが指定されていればそれを使用、なければcolumnKeysを使用）
  const headerRow = (titles || columnKeys).map(title => `"${title}"`).join(',');
  
  // データ行の作成
  const dataRows = data.map(item => {
    return columnKeys.map(key => {
      const value = item[key];
      // null、undefined対応および文字列内のダブルクォートをエスケープ
      if (value === null || value === undefined) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });
  
  // ヘッダーとデータ行を結合して返す
  return [headerRow, ...dataRows].join('\n');
};

/**
 * オブジェクト配列からCSV Blobを生成する
 * @param {Array} data - オブジェクト配列
 * @param {Object} options - オプション
 * @param {Array} options.columns - 出力する列のキー配列
 * @param {Array} options.titles - 列タイトル配列
 * @param {string} options.fileName - ダウンロード時のファイル名
 * @param {boolean} options.useShiftJIS - Shift-JISエンコードを使用するかどうか
 * @returns {Object} ダウンロード用情報オブジェクト
 */
export const convertToCsvBlob = (data, options = {}) => {
  const { columns = null, titles = null, fileName = 'export.csv', useShiftJIS = false } = options;
  
  // データが空の場合は早期リターン
  if (!data || !data.length) {
    return { error: true, message: 'データが空です' };
  }
  
  try {
    // CSV文字列を生成
    const csvContent = objectArrayToCsvString(data, columns, titles);
    
    let blob;
    
    if (useShiftJIS) {
      // Shift-JISエンコーディングを使用
      const unicodeArray = Encoding.stringToCode(csvContent + '\n');
      const encodedArray = Encoding.convert(unicodeArray, {
        to: 'SJIS',
        from: 'UNICODE',
      });
      
      blob = new Blob([new Uint8Array(encodedArray)], { type: 'text/csv' });
    } else {
      // UTF-8エンコーディング（Excel対策としてBOMを付与）
      const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
      blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8' });
    }
    
    // ダウンロード用URLを生成
    const downloadUrl = URL.createObjectURL(blob);
    
    return {
      blob,
      downloadUrl,
      fileName,
      success: true
    };
  } catch (error) {
    console.error('CSV変換エラー:', error);
    return {
      error: true,
      message: error.message || 'CSV変換中にエラーが発生しました'
    };
  }
};

/**
 * CSVをダウンロードするための関数
 * @param {Array} data - オブジェクト配列
 * @param {Object} options - オプション
 */
export const downloadCsv = (data, options = {}) => {
  const result = convertToCsvBlob(data, options);
  
  if (result.error) {
    console.error(result.message);
    return result;
  }
  
  // ダウンロードリンクを作成して自動クリック
  const link = document.createElement('a');
  link.href = result.downloadUrl;
  link.download = result.fileName;
  document.body.appendChild(link);
  link.click();
  
  // 不要になったらリンクを削除
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(result.downloadUrl);
  }, 100);
  
  return result;
};