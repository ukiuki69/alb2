import { findDeepPath1, getScheduleInfo } from "./commonModule";

export const DAY_LIST = ["日", "月", "火", "水", "木", "金", "土" ];

/*素数判定*/
export const isPrime = (n) => {
  if(n===0) return false;
  for (let i=2; i*i<=n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

export const getDataType = (data) => {
  const toString = Object.prototype.toString;
  const type = toString.call(data).slice(8, -1).toLowerCase();
  return type;
}

export const getScheduleUsagePerDDate = (stdDate, schedule, users, service, classroom) => {
  const stdDateList = stdDate.split("-");
  const lastDate = new Date(parseInt(stdDateList[0]), parseInt(stdDateList[1]), 0);
  const scheduleCnts = getScheduleInfo(schedule, service, users, classroom);

  const result = {};
  for(let i=1;i <= lastDate.getDate(); i++){
    const dDate = "D" + stdDateList[0] + stdDateList[1] + String(i).padStart(2, "0");
    const dDateCntDt = scheduleCnts.didCounts[dDate];
    const usage =  dDateCntDt? dDateCntDt.schoolOffCnt + dDateCntDt.weekDayCnt :0;
    result[dDate] = usage;
  };

  return result;
}

export const getScheduleLockPerDDate = (stdDate, schedule, users, service, classroom) => {
  const allLoscked = schedule ?schedule.locked :false;
  const stdDateList = stdDate.split("-");
  const lastDate = new Date(parseInt(stdDateList[0]), parseInt(stdDateList[1]), 0);
  const filteredUsers = users.filter(uDt => (
    (service==="" || uDt.service === service) && (classroom==="" || uDt.classroom === classroom)
  ));
  const lockedLastDate = (() => {
    let result = null;
    for(let i=1;i <= lastDate.getDate(); i++){
      const dDate = "D" + stdDateList[0] + stdDateList[1] + String(i).padStart(2, "0");
      const locked = filteredUsers.some(uDt => findDeepPath1(schedule, `UID${uDt.uid}.${dDate}.useResult`, false));
      if(locked) result = i;
    }
    return result;
  })();
  const result = {};
  for(let i=1;i <= lastDate.getDate(); i++){
    if(!(allLoscked || i <= lockedLastDate)) continue;
    const dDate = "D" + stdDateList[0] + stdDateList[1] + String(i).padStart(2, "0");
    result[dDate] = true;
  };

  return result;
}