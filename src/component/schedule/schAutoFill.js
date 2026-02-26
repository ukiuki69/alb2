import { setLSTS } from "../../modules/localStrageOprations";
import { didPtn } from '../../modules/contants';

export const schAutoFill = ({schedule, dateList, UID, bid, service, clasroom}) => {
  const newSchedule = { ...schedule }; // 既存データを上書きしないため新しいオブジェクトを作成
  const didLength = Object.keys(schedule || {}).filter(e => e.match(didPtn));
  if (!didLength) return schedule;

  dateList.forEach((dateObj, index) => {
    // 日本時間で解釈するため、UTCから+9時間を加算
    const localDate = new Date(new Date(dateObj.date).getTime() + 9 * 60 * 60 * 1000);
    const did = `D${localDate.toISOString().slice(0, 10).replace(/-/g, '')}`;

    // すでにデータが存在する場合はスキップ
    if (schedule[did]) return;

    const targetDay = localDate.getDay();
    const targetHoliday = dateObj.holiday;

    // 同じ曜日、同じholiday条件の候補を探す
    const candidates = dateList
      .map((otherDateObj, idx) => {
        const otherLocalDate = new Date(new Date(otherDateObj.date).getTime() + 9 * 60 * 60 * 1000);
        const otherKey = `D${otherLocalDate.toISOString().slice(0, 10).replace(/-/g, '')}`;

        return {
          key: otherKey,
          index: idx,
          day: otherLocalDate.getDay(),
          holiday: otherDateObj.holiday,
          schedule: schedule[otherKey],
        };
      })
      .filter(
        (entry) => {
          // サービスやクラスルームの条件を追加
          if (service && entry.schedule?.service && entry.schedule.service !== service) return false;
          if (clasroom && entry.schedule?.clasroom && entry.schedule.clasroom !== clasroom) return false;
          return (
            entry.schedule &&
            entry.day === targetDay &&
            entry.holiday === targetHoliday
          );
        }
      );

    // 候補を1週前 -> 2週前以降 -> 1週後の優先順位で探す
    const prevCandidates = candidates.filter((entry) => entry.index < index).reverse();
    const nextCandidates = candidates.filter((entry) => entry.index > index);

    const source =
      prevCandidates[0] ||
      prevCandidates[1] ||
      nextCandidates[0] ||
      null;

    // ソースが見つかった場合は値を複写
    if (source) {
      newSchedule[did] = { ...source.schedule };
      setLSTS(bid + UID + did, true);
    }
  });

  return newSchedule;
};
