// 有効な時刻であるかどうかを確認する
const isValidTime = (hour, minute) => {
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}
// 2つの時刻の差を分数で返す
export const timeDifferenceInMinutes = (prms) => {
  if (!prms) return false;
  const {start, end} = prms;
  const [hour1, minute1] = start.split(':').map(Number);
  const [hour2, minute2] = end.split(':').map(Number);

  // 両方の時刻が有効であるかを確認
  if (!isValidTime(hour1, minute1) || !isValidTime(hour2, minute2)) {
    return false;
  }

  const totalMinutes1 = hour1 * 60 + minute1;
  const totalMinutes2 = hour2 * 60 + minute2;
  if (totalMinutes1 > totalMinutes2) return false;
  return totalMinutes2 - totalMinutes1;
};
