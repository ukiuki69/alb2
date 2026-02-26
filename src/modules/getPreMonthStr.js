export const getPreviousMonth = (dateString) => {
  let date = new Date(dateString);

  date.setMonth(date.getMonth() - 1);
  date.setDate(1);

  let year = date.getFullYear();
  let month = date.getMonth() + 1;  // getMonthは0から11の値を返すため、1を加算
  let day = date.getDate();

  // 月と日が1桁の場合、頭に0をつけて2桁にする
  month = month < 10 ? '0' + month : month;
  day = day < 10 ? '0' + day : day;

  return `${year}-${month}-${day}`;
}
