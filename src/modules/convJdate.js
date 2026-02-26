export const convJdate = (ymd, mode) => {
  mode = (mode === undefined) ? 0 : mode;
  var parts = ymd.split('-');
  if (parts.length !== 3) {
    return '';
  }
  var y = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10);
  var d = parseInt(parts[2], 10);
  var date = new Date(y, m - 1, d);
  var eras = [
    { name: '令和', short: 'R', start: new Date(2019, 4, 1) },
    { name: '平成', short: 'H', start: new Date(1989, 0, 8) },
    { name: '昭和', short: 'S', start: new Date(1926, 11, 25) },
    { name: '大正', short: 'T', start: new Date(1912, 6, 30) },
    { name: '明治', short: 'M', start: new Date(1868, 0, 25) }
  ];
  var era = eras[eras.length - 1];
  for (var i = 0; i < eras.length; i++) {
    if (date >= eras[i].start) {
      era = eras[i];
      break;
    }
  }
  var eraYear = y - era.start.getFullYear() + 1;
  // モード別フォーマット
  if (mode === 0) {
    var ey0 = era.short + (eraYear < 10 ? '0' + eraYear : eraYear);
    var mm0 = (m < 10 ? '0' + m : m);
    var dd0 = (d < 10 ? '0' + d : d);
    return ey0 + '.' + mm0 + '.' + dd0;
  } else {
    var ey1 = era.name + eraYear + '年';
    var mm1 = (m < 10 ? '0' + m : m);
    var dd1 = (d < 10 ? '0' + d : d);
    return ey1 + mm1 + '月' + dd1 + '日';
  }
}
