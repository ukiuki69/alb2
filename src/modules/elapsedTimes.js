// 文字列で与えられた二つの月の経過月数を求める
export const elapsedMonths = (start, end) => {
  // 日付フォーマットのチェック（YYYY-MM-DD）
  const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;

  // 開始日と終了日がフォーマットにマッチするか確認
  if (!dateFormatRegex.test(start) || !dateFormatRegex.test(end)) {
    return false;
  }

  // 年と月を分割して数値に変換
  const [startYear, startMonth] = start.split('-').map(Number);
  const [endYear, endMonth] = end.split('-').map(Number);

  // 経過月数を計算
  const elapsedMonths = (endYear - startYear) * 12 + (endMonth - startMonth);

  return elapsedMonths >= 0 ? elapsedMonths : false;
};

const roundToDynamicPrecision = (number, precisionValue) => {
  const precision = precisionValue.toString().includes('.') 
    ? precisionValue.toString().split('.')[1].length 
    : 0;

  return parseFloat(number.toFixed(precision));
};

// 使用例
// console.log(calculateElapsedMonths('2024-04-01', '2024-06-01')); // 2
// console.log(calculateElapsedMonths('2024-06-01', '2024-04-01')); // false（開始日が終了日より後）
// console.log(calculateElapsedMonths('2024-04-15', '2025-04-01')); // 12

// elapsedHours: 開始時間と終了時間から経過時間(時間単位)を計算します。
// start, end: 開始時間と終了時間を "HH:MM" 形式で指定。
// roundingMethod: 丸め処理の方法('round', 'ceil', 'floor', 'none')。
// roundingUnit: 丸め処理の単位（例: 0.5）
// minRoundingHours: 経過時間がこの時間以下の場合、minRoundingUnit を使用。
// minRoundingUnit: 経過時間が minRoundingHours 以下の場合の丸め単位。
// 使用例:
// console.log(elapsedHours('09:00', '11:00')); // 2
// console.log(elapsedHours('09:00', '11:15', 'round', 0.25)); // 2.25
// console.log(elapsedHours('11:00', '09:00')); // false（開始時間が終了時間より後）



export const elapsedHours = (
  start, end, roundingMethod = 'round', roundingUnit = 1.0, 
) => {
  // 時間フォーマットの検証用正規表現
  const timeFormatRegex = /^(2[0-3]|[01]?[0-9]):([0-5]?[0-9])$/;

  // 時間フォーマットのチェック
  if (!timeFormatRegex.test(start) || !timeFormatRegex.test(end)) {
    return false;
  }

  // 時間と分を分割し数値に変換
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  // 開始と終了時間を分に変換
  const startInMinutes = startHour * 60 + startMinute;
  const endInMinutes = endHour * 60 + endMinute;

  // 開始時間が終了時間より後か確認
  if (startInMinutes >= endInMinutes) {
    return false;
  }

  // 経過時間を計算（時間単位）
  let elapsedHours = (endInMinutes - startInMinutes) / 60;


  // 丸め処理の適用
  switch (roundingMethod) {
    case 'round':
      elapsedHours = Math.round(elapsedHours / roundingUnit) * roundingUnit;
      break;
    case 'ceil':
      elapsedHours = Math.ceil(elapsedHours / roundingUnit) * roundingUnit;
      break;
    case 'floor':
      elapsedHours = Math.floor(elapsedHours / roundingUnit) * roundingUnit;
      break;
    case 'none':
      // 丸め処理なし
      break;
    default:
      throw new Error('Invalid rounding method');
  }
  elapsedHours = roundToDynamicPrecision(elapsedHours, roundingUnit)
  return elapsedHours;
};

/**
 * elapsedMinutes: 開始時間と終了時間から経過時間(分単位)を計算します。
 * start, end: 開始時間と終了時間を "HH:MM" 形式で指定。
 * 返り値: 経過時間を分で返します。開始時間が終了時間より後の場合は false を返します。
 * 使用例:
 * console.log(elapsedMinutes('09:00', '11:00')); // 120
 * console.log(elapsedMinutes('09:00', '11:15')); // 135
 * console.log(elapsedMinutes('11:00', '09:00')); // false（開始時間が終了時間より後）
 */

export const elapsedMinutes = (start, end) => {
  const parseTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    const time = new Date();
    time.setHours(hours, minutes, 0, 0);
    return time;
  };

  const startTime = parseTime(start);
  const endTime = parseTime(end);

  if (!startTime || !endTime || endTime < startTime) {
    return false;
  }

  const duration = (endTime - startTime) / (1000 * 60); // 経過時間を分単位で計算
  return duration;
};
// 区分1 30-90
// 区分2 91-180
// 区分3 181-300
// 延長1 30-59
// 延長2 60-119
// 延長3 120-

export const getJikanKubunAndEnchou = (start, end, useKubun3 = false, useEnchou1 = false) => {
  const mins = elapsedMinutes(start, end,);
  let rt;
  if (mins === false)                 rt = {};
  else if (mins < 30)                 rt = {};
  else if (mins <= 90)                rt = {区分:1, str: '区分1'}
  else if (mins <= 180)               rt = {区分:2, str: '区分2'}
  else if (useKubun3 && useEnchou1){
    if (mins <= 180 + 29)             rt = {区分:2, str: '区分2'}
    else if (mins <= 180 + 59)        rt = {区分:2, 延長支援: 3, str: '区分2延長1'}
    else if (mins <= 180 + 119)       rt = {区分:2, 延長支援: 1, str: '区分2延長2'}
    else if (mins <= 300 + 29)        rt = {区分:3, str: '区分3'}
    else if (mins <= 300 + 59)        rt = {区分:3, 延長支援: 3, str: '区分3延長1'}
    else if (mins <= 300 + 119)       rt = {区分:3, 延長支援: 1, str: '区分3延長2'}
    else                              rt = {区分:3, 延長支援: 2, str: '区分3延長3'}
  }
  else if (!useKubun3 && useEnchou1){
    if (mins <= 180 + 29)             rt = {区分:2, str: '区分2'}
    else if (mins <= 180 + 59)        rt = {区分:2, 延長支援: 3, str: '区分2延長1'}
    else if (mins <= 180 + 119)       rt = {区分:2, 延長支援: 1, str: '区分2延長2'}
    else                              rt = {区分:2, 延長支援: 2, str: '区分2延長3'}
  }
  else if (useKubun3 && !useEnchou1){
    if (mins <= 300 + 59)             rt = {区分:3, str: '区分3'}
    else if (mins <= 300 + 119)       rt = {区分:3, 延長支援: 1, str: '区分3延長2'}
    else                              rt = {区分:3, 延長支援: 2, str: '区分3延長3'}
  }
  else if (!useKubun3 && !useEnchou1){
    if (mins <= 180 + 59)             rt = {区分:2, str: '区分2'}
    else if (mins <= 180 + 119)       rt = {区分:2, 延長支援: 1, str: '区分2延長2'}
    else                              rt = {区分:2, 延長支援: 2, str: '区分2延長3'}
  }
  let smin; 
  if (rt.区分 === 1) smin = Math.min(90, mins);
  if (rt.区分 === 2) smin = Math.min(180, mins);
  if (rt.区分 === 3) smin = Math.min(300, mins);
  const santeiHours = Math.round((smin * 100) / 60 / 100);
  const enchouMins = mins - smin;
  const hours = elapsedHours(start, end, 'round', .01)
  // console.log(rt, start, end, mins, enchouMins);
  return {...rt, mins, santeiHours, hours, enchouMins};
}

export const getSanteJikanFromKubun = (kubun, enchou = 0, margin = 0) => {
  let rt;
  if (kubun === 1) rt = .5;
  if (kubun === 2) rt = 1.5;
  if (kubun === 3) rt = 3;
  if (enchou === 3) rt += .5;
  if (enchou === 1) rt += 1;
  if (enchou === 2) rt += 2;
  if (kubun === 2 && margin === 0 && rt === 1.5) rt = 1.52;
  return rt + margin;
}

// 1日分の算定時間を求める
export const getSanteciJikanOneDay = (oneDayBdt,) => {
  const start = oneDayBdt.start;
  const end = oneDayBdt.end;
  if (!start || !end) return 0;
  const jikankubun = parseInt(oneDayBdt?.dAddiction?.時間区分 || 0);
  const enchou = parseInt(oneDayBdt?.dAddiction?.延長支援 || 0);
  const actualTime = elapsedHours(start, end, 'round', .01);
  const kubunTime = getSanteJikanFromKubun(jikankubun, enchou);
  return Math.max(actualTime || 0, kubunTime || 0);
}

// 延長支援を除く算定時間を求める
export const getSanteiOneDayWitoutEncho = (oneDayBdt) => {
  const start = oneDayBdt.start;
  const end = oneDayBdt.end;
  if (!start || !end) return 0;
  const actualMin = elapsedMinutes(start, end);
  const jikankubun = parseInt(oneDayBdt?.dAddiction?.時間区分 || 0);
  const kubunTimes = [[0, 0], [30, 90], [91, 180], [181, 300]];
  let kubunMins = 0;
  if (jikankubun === 1 && actualMin <= kubunTimes[1][0]) kubunMins = kubunTimes[1][0];
  else if (jikankubun === 1 && actualMin >= kubunTimes[1][1]) kubunMins = kubunTimes[1][1];
  else if (jikankubun === 2 && actualMin <= kubunTimes[2][0]) kubunMins = kubunTimes[2][0];
  else if (jikankubun === 2 && actualMin >= kubunTimes[2][1]) kubunMins = kubunTimes[2][1];
  else if (jikankubun === 3 && actualMin <= kubunTimes[3][0]) kubunMins = kubunTimes[3][0];
  else if (jikankubun === 3 && actualMin >= kubunTimes[3][1]) kubunMins = kubunTimes[3][1];
  else kubunMins = actualMin;
  
  return (kubunMins / 60).toFixed(2); 
}
