import store from '../../../store';
import { univApiCall } from '../../../albCommonModule';
import { setCloseDayToCalender } from './setCloseDayToCalender';
import { formatDate, toDateApiDateStr, getDatesArrayOfMonth } from '../../../commonModule';

export const addNextSch = async () => {
  const state = store.getState();
  const { hid, bid, stdDate, com } = state;
  const { weekDayDefaultSet } = state.config;

  const d = toDateApiDateStr(stdDate);
  d.setMonth(d.getMonth() + 1);
  const nextMonth = formatDate(d, 'YYYY-MM-DD');

  const initSch = {initMonth: formatDate(new Date())};
  const sendPrms = {a: 'createScheduleSafety', date: nextMonth, hid, bid, schedule: initSch}
  const res = await univApiCall(sendPrms, 'createScheduleSafety');
  
  if (res?.data?.created) {
    const pi = (v) => parseInt(v);
    const l = getDatesArrayOfMonth(
      pi(nextMonth.split('-')[0]),pi(nextMonth.split('-')[1])
    );
    const dateList = l.map(e=>{
      const holiday = weekDayDefaultSet[e.getDay()];
      const r = { date: e, holiday };
      return r;
    })
    
    const p = {
        com, hid, bid, stdDate: nextMonth, dateList, schedule: {}
    }
    const calenderRes = await setCloseDayToCalender(p);
    console.log('calenderRes', calenderRes);
    return {calenderRes, scheduleRes: res};

  }

  return {scheduleRes: res};
}

