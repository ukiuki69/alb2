import { getMinMaxOfMonnth } from '../../albCommonModule';

// stdDate を引数に取り、調整後の newStdDate を返す関数を定義
export async function getAdjustedStdDate({stdDate, hid, bid, setSnack}) {
  // 移動先の最大月と最小月を取得
  const minMaxRt = await getMinMaxOfMonnth({ hid, bid }, '', setSnack);
  const cldLst = (minMaxRt?.data?.rtCalenderList?.dt ?? []).map(e => e.date ?? '');
  const schLst = (minMaxRt?.data?.rtScheduleList?.dt ?? []).map(e => e.date ?? '');
  
  // 事業所変更時の新しい stdDate の取得（カレンダーとスケジュール双方に存在するか確認）
  let originalStdDate = stdDate;
  let newStdDate = stdDate;
  
  if (!(cldLst.includes(stdDate) && schLst.includes(stdDate))) {
    // 両方に含まれている日付の配列を作成
    const commonDates = cldLst.filter(date => schLst.includes(date));
    if (commonDates.length > 0) {
      // originalStdDate に最も近い日付を求める
      newStdDate = commonDates.reduce((closest, current) => {
        const currentDiff = Math.abs(new Date(current).getTime() - new Date(originalStdDate).getTime());
        const closestDiff = Math.abs(new Date(closest).getTime() - new Date(originalStdDate).getTime());
        return currentDiff < closestDiff ? current : closest;
      }, commonDates[0]);
    }
  }
  return newStdDate;
}