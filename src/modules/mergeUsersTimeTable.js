// api luの結果とfetchUsersPlanの結果でtimetableをusersに記載を行う
export const mergeUsersTimeTable = (resUsers, resTimetable) => {
  const users = [...resUsers.data.dt ?? []];
  const timetable = resTimetable.data.dt;
  // 通信結果をresUsersにまとめる
  resUsers.data.reslt = (resUsers.data.result && resTimetable.data.result);
  // timetableをusersに書き込む
  timetable.forEach(item => {
    const ndx = users.findIndex(e=>e.uid === item.uid);
    const user = users[ndx];
    if (!user) return;
    if (!user.timetable) user.timetable = [];
    user.timetable.push({created: item.created, content: item.content})
  });
  resUsers.data.dt = users;
  return resUsers;
}