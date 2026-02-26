import { checkValueType } from "../component/dailyReport/DailyReportCommon";

/**
 * API送信前に対応していない特殊文字を削除する処理
 * @param {String} text 
 * @returns 
 */
export const deleteEscapeCharacter = (text="") => {
  // 文字列以外はそのまま返す。
  if(!checkValueType(text, "String")) return text;
  // JSON文字列に変換
  const jsonString = JSON.stringify(text);

  // 対応していない特殊文字を削除
  const deletedEscapeCharacterJsonString = jsonString
    .replace(/\\t/g, "")  // タブ文字を削除
    .replace(/\\r/g, "")  // キャリッジリターン
    .replace(/\\b/g, "")  // バックスペース
    .replace(/\\f/g, "")  // 改ページ
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'") // スマートシングルクオートを普通のシングルクオートに
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"') // スマートダブルクオートを普通のダブルクオートに
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '*') // ブレットポイントをアスタリスクに
    .replace(/\u2013|\u2014/g, '-') // ダッシュをハイフンに
    .replace(/[\u202F\u205F\u3000\u00A0]/g, ' ') // 特殊な空白文字を普通の空白に
  
  // 文字列に戻す。
  try{
    const processedText = JSON.parse(deletedEscapeCharacterJsonString);
    return processedText;
  }catch{
    return text
  }
}