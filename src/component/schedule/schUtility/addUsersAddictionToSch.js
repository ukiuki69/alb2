import { findDeepPath, getUser } from "../../../commonModule";
import { getPriorityService } from "../../Billing/blMakeData";
import { sendPartOfSchedule, univApiCall } from '../../../albCommonModule';
import * as Actions from "../../../Actions";

// usersに記載されている加算情報をScheduleに転機する。
// Schedule側にすでに情報がある場合は処理を行わない。
// forthUpdateを追加。強制アップデート
export const addUsersAddictionToSch = async (prms) => {
  const {schedule, users, dispatch, forthUpdate, serviceItems, hid, bid, stdDate } = prms;
  // 利用者が未ロードなら何もしない（空UID送信を防ぐ）
  if (!users || !users.length) return;
  const sch = {...schedule};
  let dispatchFlg = false;
  const tusers = [...users];
  tusers.map(e=>{
    const UID = 'UID' + e.uid;
    let src = findDeepPath(e, 'etc.addiction');
    // 複数サービスの場合優先サービスに割当を行う。保訪では利用者別サービスがないため
    const svc = getPriorityService(e.service) ?? e.service;
    // ここが複数サービスに対応していない！
    const dsc = findDeepPath(sch, [svc, UID, 'addiction']);
    if (e?.etc?.multiSvc && Object.keys(e.etc.multiSvc).some(key => e.etc.multiSvc[key]?.addiction)){
      const multiSvc = e.etc.multiSvc;
      Object.keys(multiSvc).forEach(eachSvc=>{
        const multiSrc = multiSvc[eachSvc]?.addiction;
        const dsc = findDeepPath(sch, [eachSvc, UID, 'addiction']);
        if (!dsc || forthUpdate){
          dispatchFlg = true;
          if (!sch[eachSvc])        sch[eachSvc] = {};
          if (!sch[eachSvc][UID])   sch[eachSvc][UID] = {};
          sch[eachSvc][UID].addiction = multiSrc;
        }
      })
    }
    else{
      src = !src? {}: src;
      // scheduleに記載が無い場合
      if (!dsc || forthUpdate){
        dispatchFlg = true;
        if (!sch[svc])        sch[svc] = {};
        if (!sch[svc][UID])   sch[svc][UID] = {};
        sch[svc][UID].addiction = src;
      }

    }
  });
  const sendAndDispatch = async () =>{
    // usersに存在しないUIDを検索。見つかったら空白のオブジェクトに置き換える
    const deletedUsers = [];
    Object.keys(sch).filter(e=>e.match(/^UID[0-9]+/)).forEach(e=>{
      // user dataがない場合処理を行わない
      if (!users.length) return false;
      const u = getUser(e, users);
      if (!Object.keys(u).length){
        console.log(e, 'schedule data exist. user data not exist.');
        sch[e] = {};
        deletedUsers.push(e);
      }
    })
    const sendSchedule = {};
    // 送信スケジュールを加算項目のみにする
    Object.keys(sch).filter(e=>serviceItems.includes(e)).forEach(e=>{
      sendSchedule[e] = {...sch[e]};
    });
    // 送信スケジュールに削除されたユーザーを追加する
    deletedUsers.forEach(e=>{
      sendSchedule[e] = {...sch[e]};
    })
    // ルート直下の空オブジェクトは送らない（誤上書き防止）
    Object.keys(sendSchedule).forEach(uid=>{
      const val = sendSchedule[uid];
      const isEmptyObj = val && typeof val === 'object' && !Array.isArray(val) && !Object.keys(val).length;
      const isEmptyArr = Array.isArray(val) && val.length === 0;
      if (!val || isEmptyObj || isEmptyArr){
        delete sendSchedule[uid];
      }
    });
    // 送信対象が無ければ終了
    if (!Object.keys(sendSchedule).length) return;
    const sendPrms = {hid, bid, date: stdDate, partOfSch: sendSchedule};
    const r = await sendPartOfSchedule(sendPrms);
    const anyStatePrms = {
      date: stdDate, keep: 16, hid, bid,
      item: 'SchInitilizer', state:JSON.stringify({partOfSch: sendSchedule}),
      a: 'sendAnyState',
    }

    await univApiCall(anyStatePrms, 'E976209', '', );
    if (r.data && r.data.result){
      dispatch(Actions.setStore({
        schedule: sch,
        snackPack: {text: '利用者別加算の初期化を行いました。', severity: ''}
      }))
    }
    else{
      dispatch(Actions.setSnackMsg('利用者別加算の初期化が出来ませんでした。', 'warning'))
    }
  }
  if (dispatchFlg){
    await sendAndDispatch();
    
  }
}

