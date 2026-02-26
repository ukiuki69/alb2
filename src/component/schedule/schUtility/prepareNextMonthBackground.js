import { univApiCall } from '../../../albCommonModule';
import { formatDate, getDatesArrayOfMonth } from "../../../commonModule";
import { setCloseDayToCalender } from "./setCloseDayToCalender";

// 翌月をバックグラウンドで作成する
// 既にデータが存在する場合は何もしない（破壊的変更を避ける）
export const prepareNextMonthBackground = async (prms) => {
  const { newStdDate, hid, bid, weekDayDefaultSet, com } = prms;
  
  // 1. 翌月のデータが既に存在するか厳密にチェック
  const fSch = await univApiCall({ a: 'fetchSchedule', hid, bid, date: newStdDate });
  
  // fetchが成功し、かつデータが空（length === 0）の場合のみ続行
  if (fSch && fSch.data && fSch.data.result && (fSch.data.dt || []).length === 0) {
    // 2. スケジュールの初期レコード作成 (initMonth)
    // これにより、次回チェック時は length > 0 になり二重作成を防げる
    const initSch = JSON.stringify({ initMonth: formatDate(new Date()) });
    const sendPrms = { a: 'sendSchedule', date: newStdDate, hid, bid, schedule: initSch };
    const sendRes = await univApiCall(sendPrms);
    
    if (!sendRes || !sendRes.data || !sendRes.data.result) {
      console.error('Failed to create next month schedule record.');
      return false;
    }

    // 3. カレンダーの初期化
    const pi = (v) => parseInt(v);
    const l = getDatesArrayOfMonth(
      pi(newStdDate.split('-')[0]), pi(newStdDate.split('-')[1])
    );
    const newDtlist = l.map(e => ({
      date: e,
      holiday: weekDayDefaultSet[e.getDay()]
    }));

    // setCloseDayToCalender は内部で sendCalender を呼び出し、dispatchがなければstore更新をスキップする
    await setCloseDayToCalender({ 
      com, hid, bid, stdDate: newStdDate, 
      dateList: newDtlist, schedule: {} 
    });
    
    return true;
  } else {
    // 既に存在するか、フェッチに失敗した場合は何もしない
    if (fSch && fSch.data && (fSch.data.dt || []).length > 0) {
      console.log('Next month already exists. Skipping background creation.');
      return 'already_exists';
    }
    return false;
  }
};

