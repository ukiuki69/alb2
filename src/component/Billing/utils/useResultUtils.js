import * as comMod from '../../../commonModule';
import * as Actions from '../../../Actions';
import { isClassroom, sendPartOfSchedule, univApiCall, univApiCallJson } from '../../../albCommonModule';

export const fSetUseResult = async (p) => {
  const {
    dolock, ed, users, service, fetchedSch, sch,
    classroom, preMonth, bid, props, dateList, billingDt,
    masterRec, com, stdDate, account, setSnack, dispatch,
    st, hid,
  } = p;

  let value;
  if (dolock !== null) value = dolock;
  const d = value ? ed : st; // 設定日付。実績にするときは

  // 対象となるユーザーUIDxxx形式の配列
  // 2022/11/22　前月の処理を行うときは全ユーザーを対象にする
  const tUsers = preMonth
    ? users.map(e => 'UID' + e.uid)
    // 複数サービスの時の対応
    : users
      .filter(e => e.service.includes(service))
      .filter(e => isClassroom(e, classroom))
      .map(e => 'UID' + e.uid);

  let curSch;
  if (fetchedSch) {
    curSch = { ...fetchedSch.data.dt[0].schedule };
  } else {
    curSch = { ...sch };
  }

  const targetList = [];
  Object.keys(curSch).forEach(e => {
    // scheduleのキーでuidを探す
    if (e.indexOf('UID') !== 0) {
      return false;
    }
    // classroomとserviceで切り分けされた配列で該当ユーザーかどうかをチェック
    if (tUsers.indexOf(e) < 0) return false;
    // schedule.uidから更に掘って該当するスケジュールオブジェクトを特定する
    // 一括変更のオプションも読んでそのとおりに変更リストを追加する
    Object.keys(curSch[e]).filter(f => f.match(/^D[0-9]+/)).forEach(f => {
      const o = curSch[e][f];
      // 2023/02/01 変更 確定処理は無条件でロックする
      if (!preMonth && o.classroom && classroom && classroom !== o.classroom) return false;
      if (f <= d && value) targetList.push({ UID: e, did: f });
      if (f >= d && !value) targetList.push({ UID: e, did: f });
    });
  });

  // UIDごとに対象didをまとめ、変更のあるUIDのみ送信する
  const uidDidMap = {};
  targetList.forEach(e => {
    if (!uidDidMap[e.UID]) uidDidMap[e.UID] = [];
    uidDidMap[e.UID].push(e.did);
  });

  // 部分送信
  const partOfSch = {};
  if (preMonth) {
    partOfSch.locked = value;
  }
  Object.keys(uidDidMap).forEach(uid => {
    partOfSch[uid] = { ...curSch[uid] };
    uidDidMap[uid].forEach(did => {
      partOfSch[uid][did].useResult = value;
    });
  });

  // 送信不要（変更なし）の場合はここで終了
  if (!preMonth && Object.keys(uidDidMap).length === 0) return;

  const sendPrms = { hid, bid, date: stdDate, partOfSch };
  console.log('sendPrms', sendPrms);
  sendPartOfSchedule(sendPrms, 'setRes', setSnack);

  // ローカルのスケジュールに値セット
  const newSch = { ...curSch, ...partOfSch };
  if (typeof props.setSchedule === 'function') {
    props.setSchedule(newSch);
  }
  const sendDateList = dateList.map(e => (
    {
      dateStr: comMod.formatDate(e.date, 'YYYYMMDD'),
      dayOfWeek: e.date.getDay(),
      holiday: e.holiday,
    }
  ));

  // someStateに保管するパラメータ
  const somState = { billingDt, masterRec, com, dateList: sendDateList };
  // キープの日数を追加
  const sendBillingPrms = {
    date: stdDate, jino: account.jino, keep: 365 + 60, hid, bid,
    item: 'billingDt', state: JSON.stringify(somState),
    a: 'sendAnyState',
  };
  // サムステイトに送信 ->  anysateに変更
  // 送信サイズが大きくなるためJSON送信版を利用
  await univApiCallJson(sendBillingPrms, 'setRes', setSnack, '売上情報を送信しました。');
  // 確定処理の時は事業所情報を更新する
  if (value) {
    const sendBrunchPrms = { ...com, a: 'sendBrunch' };
    await univApiCall(sendBrunchPrms, 'setRes', setSnack, '事業所情報を更新しました。');
  }
  // dispatchも追加。scheduleをdispatchしている箇所が不明なので
  newSch.timestamp = new Date().getTime();
  dispatch(Actions.setStore({ schedule: newSch }));
};

