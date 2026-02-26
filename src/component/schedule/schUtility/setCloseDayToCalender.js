import { formatDate } from "../../../commonModule";
import { sendCalender } from '../../../modules/api';
import * as Actions from "../../../Actions";

// com.ext.closeDaySettingとcom.ext.nationalHolidaysから休業日を設定する
export const setCloseDayToCalender = async (prms) => {
  const {
    com, hid, bid, stdDate, dateList, dispatch, schedule
  } = prms;
  const schCnt = Object.keys(schedule?? {}).filter(e=>e.match(/^UID\d+/)).reduce((v, uids)=>{
    v += Object.keys(schedule[uids]).filter(e=>e.match(/D2\d{7}/)).length;
    return v;
  }, 0);
  if (schCnt) return false;
  // 設定済カレンダー。初期化を行わない
  if (dateList[0]?.calenderEdited) return false;
  
  const closeDaySetting = com?.ext?.closeDaySetting ?? {};
  const nationalHolidays = com?.ext?.nationalHolidays ?? {};
  const newDtlist = dateList.map(e=>{
    const wd = e.date.getDay();
    const ymd = formatDate(e.date, 'YYYY-MM-DD');
    let holiday = e.holiday;
    // 祭日
    if (nationalHolidays[ymd] && !closeDaySetting.nationalHoliday){
      holiday = 1;
    }
    else if (nationalHolidays[ymd] && closeDaySetting.nationalHoliday){
      holiday = 2;
    }
    else if (!nationalHolidays[ymd] && wd > 0 && wd < 6){
      holiday = 0;
    }
    // 日曜日
    if (wd === 0 && closeDaySetting.sunday === false){
      holiday = 1;
    }
    else if (wd === 0 && closeDaySetting.sunday === true){
      holiday = 2;
    }
    // 土曜日
    if (wd === 6 && closeDaySetting.saturday === false){
      holiday = 1;
    }
    else if (wd === 6 && closeDaySetting.saturday === true){
      holiday = 2;
    }
    return ({date: e.date, holiday})
  })
  const sendPrms = {hid, bid, date: stdDate, dateList: newDtlist};
  const res = await sendCalender(sendPrms);
  if (res?.data?.dt?.result === false){
    if (dispatch) dispatch(Actions.setSnackMsg('カレンダー通信エラーが発生しました。', 'warning'))
  }
  if (dispatch) dispatch(Actions.setStore({dateList: newDtlist}))
  return res;
}

