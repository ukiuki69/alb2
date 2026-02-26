import { JIHATSU } from './contants';
import { convDid, formatDate, getUser } from "../commonModule";
import { getJikanKubunAndEnchou } from "./elapsedTimes";

export const getUsersTimetable = (allState, uid, did) => {
  const { users, com, service, dateList } = allState;
  const user = getUser(uid, users);
  const { timetable } = user;

  if (!timetable) return false;
  // useUsersPlanAsTemplateがfalsyの場合、falseを返す
  const useUsersPlanAsTemplate = com?.ext?.useUsersPlanAsTemplate;
  if (!useUsersPlanAsTemplate) return false;
  const usersPlanFindOtherDay = com?.ext?.usersPlanFindOtherDay;

  const nationalHolidays = com?.ext?.nationalHolidays;

  // didから日付オブジェクトを取得
  let date = convDid(did);
  if (!date) return false;

  // dateがstringの場合、Dateオブジェクトに変換
  if (typeof date === 'string') {
    date = new Date(date);
  }

  // 日付をYYYY-MM-DD形式にフォーマット
  const formattedDate = formatDate(date, 'YYYY-MM-DD');

  // nationalHolidaysに含まれる場合、'holiday'を取得
  const isHoliday = nationalHolidays[formattedDate] ? true : false;
  // dateListの中で、dateと同じ日付のholidayを取得
  const dateListHoliday = dateList.find(item => item.date.getDate() === date.getDate())?.holiday;

  // 曜日を取得
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // didを超えない範囲で最新のデータを選択
  const selectedData = timetable
    .filter(item => item.created <= formatDate(date, 'YYYY-MM-DD'))
    .sort((a, b) => new Date(b.created) - new Date(a.created))[0];

  if (!selectedData) return false;

  // selectedData配下の各曜日のversionの値を確認
  const isVersionValid = Object.values(selectedData.content).some(dayData => dayData.version === 2);
  const contentVersion = selectedData.content.version;
  if (!isVersionValid && contentVersion !== 2) return false;

  // basisStartに値がない要素を削除
  selectedData.content = Object.fromEntries(
    Object.entries(selectedData.content).filter(([_, dayData]) => dayData.basisStart)
  );

  let result = null;
  // 処理追加
  // 該当する曜日のデータを返す
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  if (isHoliday && selectedData.content['holiday']) {
    const { basisStart, basisEnd, holiday } = selectedData.content['holiday'];
    result = { start: basisStart, end: basisEnd, holiday };
  } else if (dateListHoliday && weekdays.includes(dayOfWeek) && selectedData.content['holiday']) {
    const { basisStart, basisEnd, holiday } = selectedData.content['holiday'];
    result = { start: basisStart, end: basisEnd, holiday };
  } else if (selectedData.content[dayOfWeek]) {
    const { basisStart, basisEnd, holiday } = selectedData.content[dayOfWeek];
    result = { start: basisStart, end: basisEnd, holiday };
  } else if (usersPlanFindOtherDay) {
    const currentIndex = weekdays.indexOf(dayOfWeek);

    // 前後の曜日を探す
    for (let offset = 1; offset < weekdays.length; offset++) {
      const prevIndex = currentIndex - offset;
      const nextIndex = currentIndex + offset;

      if (prevIndex >= 0 && selectedData.content[weekdays[prevIndex]]) {
        const { basisStart, basisEnd, holiday } = selectedData.content[weekdays[prevIndex]];
        result = { start: basisStart, end: basisEnd, holiday };
        break;
      }

      if (nextIndex < weekdays.length && selectedData.content[weekdays[nextIndex]]) {
        const { basisStart, basisEnd, holiday } = selectedData.content[weekdays[nextIndex]];
        result = { start: basisStart, end: basisEnd, holiday };
        break;
      }
    }
  }

  if (!result) return false;

  const useKubun3 = service === JIHATSU || result.holiday;
  const jikankubun = getJikanKubunAndEnchou(result.start, result.end, useKubun3);
  result.dAddiction = {
    時間区分: jikankubun.区分, 
    延長支援: jikankubun.延長支援? jikankubun.延長支援: -1,
  };
  result.offSchool = result.holiday ? 1 : 0;
  return result;
}