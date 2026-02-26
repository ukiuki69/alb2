import { useSelector } from "react-redux";
import { getLS } from "../../../modules/localStrageOprations";
import { formatDate } from "../../../commonModule";
import { hasAnySchedule } from '../../../albCommonModule';

// 先月かどうかを判定
const isLastMonth = (stdDateStr) => {
  const date = new Date(stdDateStr);
  const today = new Date();

  // 現在の年と月
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 月は0から始まる (0 = 1月, 1 = 2月, ..., 11 = 12月)

  // 先月の年と月を計算
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // 対象の日付が先月かどうかを判定
  return date.getFullYear() === lastMonthYear && date.getMonth() === lastMonth;
};

// 更新すべきかどうか判定
export const useTobeInit = (schInitName) => {
  const allState = useSelector(state=>state);
  const {schedule, stdDate} = allState;
  const schInitDone = getLS(schInitName)? getLS(schInitName): {};
  const curMonth = formatDate(new Date(), 'YYYY-MM') + '-01';
  const curDate = formatDate(new Date(), 'YYYY-MM-DD');
  let rt = false;
  // 初期化済みの日付
  const curInit = (schInitDone && schInitDone[stdDate])? schInitDone[stdDate]: '0'
  const d = new Date().getDate();
  // if (!schedule.locked && curMonth === stdDate && d <= 25){
  if (!schedule.locked && curMonth === stdDate){
    rt = true;
  }
  else if (curMonth < stdDate){
    rt = true;
  }
  else{
    // 予定実績がない場合、翌月10日までは初期化を行う
    // 2024/11/03追加
    const lastMonth = isLastMonth(stdDate);
    const notHasAnySch = !hasAnySchedule(schedule);
    const before10 = new Date().getDate() <= 10;
    if (lastMonth && notHasAnySch && before10){
      rt = true;
    }
    else rt = false;
  }

  if (rt && curInit >= curDate) rt = false;
  return rt;
}

