import { convHankaku, zp } from './stringUtils';

/**
 * 日付操作に関連するユーティリティ
 */

// 対応した曜日を返す
export const getWd = (d) => {
  const a = [
    { s: 'Sun', l: 'Sunday', jp: '日', jpm: '(日)', jpl: '日曜日' },
    { s: 'Mon', l: 'Monday', jp: '月', jpm: '(月)', jpl: '月曜日' },
    { s: 'Tue', l: 'Tuesday', jp: '火', jpm: '(火)', jpl: '火曜日' },
    { s: 'Wed', l: 'Wednesday', jp: '水', jpm: '(水)', jpl: '水曜日' },
    { s: 'Thu', l: 'Thursday', jp: '木', jpm: '(木)', jpl: '木曜日' },
    { s: 'Fri', l: 'Friday', jp: '金', jpm: '(金)', jpl: '金曜日' },
    { s: 'Sut', l: 'Saturday', jp: '土', jpm: '(土)', jpl: '土曜日' },
  ];
  return a[d];
};

// apiでフェッチした日付が文字列のままなので変換する
export const toDateApiDateStr = (str) => {
  if (!str) return null;
  if (str.indexOf('T') > -1) str = str.split('T')[0];
  const parts = str.split('-');
  return new Date(
    parseInt(parts[0]),
    parseInt(parts[1]) - 1,
    parseInt(parts[2])
  );
};

export const getAge = (birthday, nDate = new Date(), ageOffset = 0) => {
  if (!birthday) return { age: 0, ageStr: '', schoolAge: '', schoolAgeNdx: -1, flx: '', ageNdx: -1 };
  
  const ymd = birthday.split('-');
  if (typeof nDate === 'string') {
    nDate = toDateApiDateStr(nDate);
  }
  const bDate = new Date(ymd[0], ymd[1] - 1, ymd[2]);

  let age = nDate.getFullYear() - bDate.getFullYear() - 1;
  if (nDate.getMonth() > bDate.getMonth()) age++;
  if (nDate.getMonth() === bDate.getMonth() && nDate.getDate() >= bDate.getDate()) age++;
  if (ageOffset) age += Number(ageOffset);

  const nDateStr =
    ('0' + (nDate.getMonth() + 1)).slice(-2) + ('0' + nDate.getDate()).slice(-2);

  const CUT = '0401';

  const schoolCut = nDateStr < CUT
    ? new Date(nDate.getFullYear() - 1, 3, 1)
    : new Date(nDate.getFullYear(), 3, 1);

  let schoolYears = schoolCut.getFullYear() - bDate.getFullYear() - 1;
  if (schoolCut.getMonth() > bDate.getMonth()) schoolYears++;
  if (schoolCut.getMonth() === bDate.getMonth() && schoolCut.getDate() >= bDate.getDate()) schoolYears++;
  if (ageOffset) schoolYears += Number(ageOffset);

  let schoolAgeCnt = schoolYears - 6;

  let schoolAge = '';
  if (schoolAgeCnt >= 0 && schoolAgeCnt <= 12) {
    schoolAge = [
      '小1', '小2', '小3', '小4', '小5', '小6',
      '中1', '中2', '中3', '高1', '高2', '高3',
    ][schoolAgeCnt];
  }

  const hdCut = nDateStr < CUT
    ? new Date(nDate.getFullYear() - 1, 3, 1)
    : new Date(nDate.getFullYear(), 3, 1);

  let HdAgeCnt = hdCut.getFullYear() - bDate.getFullYear() - 1;
  if (hdCut.getMonth() > bDate.getMonth()) HdAgeCnt++;
  if (hdCut.getMonth() === bDate.getMonth() && hdCut.getDate() >= bDate.getDate()) HdAgeCnt++;
  if (ageOffset) HdAgeCnt += Number(ageOffset);

  const hdAge = HdAgeCnt >= 0 && HdAgeCnt < 7 ? `${HdAgeCnt}歳児` : '';
  const ageNdx = HdAgeCnt;
  const ageStr = `${age}歳`;
  let flx = schoolAge || hdAge || ageStr;
  const schoolAgeNdx = schoolAge && schoolAgeCnt !== undefined ? schoolAgeCnt + 7 : -1;

  return { age, ageStr, schoolAge, schoolAgeNdx, flx, ageNdx };
};

export const formatDate = (date, fmt) => {
  if (typeof date !== 'object' || isNaN(date.getDate())) return '';
  if (!fmt) fmt = 'YYYY-MM-DD hh:mm:ss.SSS';
  fmt = fmt.replace(/YYYY/g, date.getFullYear());
  fmt = fmt.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
  fmt = fmt.replace(/DD/g, ('0' + date.getDate()).slice(-2));
  fmt = fmt.replace(/hh/g, ('0' + date.getHours()).slice(-2));
  fmt = fmt.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
  fmt = fmt.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
  fmt = fmt.replace(/AAA/, getWd(date.getDay()).jpl);
  fmt = fmt.replace(/AA/, getWd(date.getDay()).jpm);
  fmt = fmt.replace(/A/, getWd(date.getDay()).jp);

  if (fmt.match(/S/g)) {
    const milliSeconds = ('00' + date.getMilliseconds()).slice(-3);
    const length = fmt.match(/S/g).length;
    for (let i = 0; i < length; i++) fmt = fmt.replace(/S/, milliSeconds.substring(i, i + 1));
  }
  return fmt;
};

export const convDid = (did) => {
  if (typeof did === 'object') {
    try {
      return 'D' + formatDate(did, 'YYYYMMDD');
    } catch {
      return false;
    }
  } else if (typeof did === 'string') {
    try {
      return new Date(
        parseInt(did.substr(1, 4)),
        parseInt(did.substr(5, 2)) - 1,
        parseInt(did.substr(7, 2))
      );
    } catch {
      return false;
    }
  }
  return false;
};

export const getDateEx = (y, m, d) => {
  let tmpD = new Date();
  if (isNaN(y)) y = tmpD.getFullYear();
  if (isNaN(m)) m = tmpD.getMonth() + 1;
  if (isNaN(d)) d = tmpD.getDate();
  if (d === 0) m++;
  
  let date = new Date(y, m - 1, d);
  const meiji = new Date(1868, 8, 8);
  const taisyo = new Date(1912, 6, 30);
  const syouwa = new Date(1926, 11, 25);
  const heisei = new Date(1989, 0, 8);
  const reiwa = new Date(2019, 4, 1);
  
  let full, wr;
  let wry;
  if (date >= reiwa) {
    wry = date.getFullYear() - reiwa.getFullYear() + 1;
    full = wry === 1 ? '令和元年' : '令和' + wry + '年';
    wr = { s: 'R.', l: '令和', y: wry, full };
  } else if (date >= heisei) {
    wry = date.getFullYear() - heisei.getFullYear() + 1;
    full = wry === 1 ? '平成元年' : '平成' + wry + '年';
    wr = { s: 'H.', l: '平成', y: wry, full };
  } else if (date >= syouwa) {
    wry = date.getFullYear() - syouwa.getFullYear() + 1;
    full = wry === 1 ? '昭和元年' : '昭和' + wry + '年';
    wr = { s: 'S.', l: '昭和', y: wry, full };
  } else if (date >= taisyo) {
    wry = date.getFullYear() - taisyo.getFullYear() + 1;
    full = wry === 1 ? '大正元年' : '大正' + wry + '年';
    wr = { s: 'T.', l: '大正', y: wry, full };
  } else if (date >= meiji) {
    wry = date.getFullYear() - meiji.getFullYear() + 1;
    full = wry === 1 ? '明治元年' : '明治' + wry + '年';
    wr = { s: 'M.', l: '明治', y: wry, full };
  } else {
    wr = { s: 'unknown', l: 'unknown', y: 'unknown', full: 'unknown' };
  }
  
  y = date.getFullYear();
  d = date.getDate();
  m = date.getMonth() + 1;
  const wd = getWd(date.getDay());
  return { y, m, d, wd, wr, dt: date };
};

export const parseDate = (str) => {
  str = convHankaku(str);
  const thisYear = new Date().getFullYear() + '';
  let [yearOrg, month, day] = str.split(/[\.\-\/\s]/);
  if (!day) {
    day = month;
    month = yearOrg;
    yearOrg = thisYear;
  }
  if (!(yearOrg && month && day)) {
    str = str.replace(/[^0-9]/g, '');
    if (str.length === 4) str = thisYear + str;
    yearOrg = str.substr(0, 4);
    month = str.substr(4, 2);
    day = str.substr(6, 2);
  }
  if (!(yearOrg && month && day)) return { result: false };

  const year = yearOrg.toUpperCase();
  let yearN = year.replace(/[^0-9]/g, '');
  if (isNaN(yearN) || isNaN(month) || isNaN(day)) return { result: false };
  
  const yearL = year.substr(0, 1);
  if (yearL === 'S') yearN = parseInt(yearN) + 1925;
  if (yearL === 'H') yearN = parseInt(yearN) + 1988;
  if (yearL === 'R') yearN = parseInt(yearN) + 2018;
  
  const dateResult = getDateEx(yearN, month, day);
  return { result: true, date: dateResult };
};

export const getDatesArrayOfMonth = (year, month) => {
  const ret = [];
  const dd_obj = getDateEx(year, month, 1);
  let dd = dd_obj.dt;
  const ed = getDateEx(year, month, 0).dt;
  let y = dd.getFullYear();
  let m = dd.getMonth();
  let d = dd.getDate();
  do {
    const a = new Date(y, m, d++);
    ret.push(a);
    if (a >= ed) break;
  } while (true);
  return ret;
};

export const makeDaysGrid = (dateList) => {
  const monthGrid = [];
  const week = [];
  if (!dateList || !dateList.length) return monthGrid;
  dateList.forEach((e) => {
    week.push(e);
    if (e.date.getDay() === 6) {
      monthGrid.push([...week]);
      week.length = 0;
    }
  });
  if (week.length) monthGrid.push([...week]);
  while (monthGrid.length > 0 && monthGrid[0].length < 7) monthGrid[0].unshift('');
  if (monthGrid.length > 0) {
    const lastWeek = monthGrid[monthGrid.length - 1];
    while (lastWeek.length < 7) lastWeek.push('');
  }
  return monthGrid;
};

export const timePickerList = (start, end, step) => {
  let hh = parseInt(start.split(':')[0]);
  let mm = parseInt(start.split(':')[1]);
  const endH = parseInt(end.split(':')[0]);
  const endM = parseInt(end.split(':')[1]);
  const ret = [{ h: hh, m: mm, str: start }];
  
  const base60calc = (h, m, s) => {
    m += s;
    if (m >= 60) h++;
    m = m % 60;
    const str = zp(h, 2) + ':' + zp(m, 2);
    return { h, m, str };
  };
  
  while (hh < endH || (hh === endH && mm < endM)) {
    const r = base60calc(hh, mm, step);
    ret.push(r);
    hh = r.h;
    mm = r.m;
  }
  return ret;
};

