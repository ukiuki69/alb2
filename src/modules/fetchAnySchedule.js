
/**
 * このモジュールは、指定された日付、hid、およびbidに基づいてスケジュールを取得するための関数を提供します。
 * `getAnySchedule` 関数は、指定されたパラメータを使用してスケジュールを取得し、結果を返します。
 * 
 * @param {Object} params - スケジュールを取得するためのパラメータ
 * @param {String} params.date - 取得するスケジュールの日付
 * @param {String} params.hid - 取得するスケジュールのhid
 * @param {String} params.bid - 取得するスケジュールのbid
 * @returns {Object|null} - スケジュールデータ、または取得に失敗した場合はnull
 */

import { univApiCall } from '../albCommonModule';

export const fetchAnySchedule = async ({date, hid, bid}) => {
  const params = {
    a: "fetchSchedule",date,hid,bid
  }
  const res = await univApiCall(params);
  if (!res?.data?.result) return null;
  return res?.data?.dt?.[0]?.schedule ?? null;
}