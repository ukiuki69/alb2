import axios from 'axios';
import * as comMod from './commonModule';
import { setRecentUser } from './albCommonModule';
import { endPoint, univApiCall, uPrms } from './modules/api';
import { mergeUsersTimeTable } from './modules/mergeUsersTimeTable';
import { sortUsers } from './component/Setting/sortUtils';
import { fetchAllWithAuth } from './modules/thunks';

export const LIST_USERS_LOADING = 'LIST_USERS_LOADING';
export const LIST_USERS_DONE = 'LIST_USERS_DONE';
export const LIST_USERS_ERR = 'LIST_USERS_ERR';
export const FETCH_COM_LOADING = 'FETCH_COM_LOADING';
export const FETCH_COM_ERR = 'FETCH_COM_ERR';
export const FETCH_COM_DONE = 'FETCH_COM_DONE';
export const FETCH_CALENDER_LOADING = 'FETCH_CALENDER_LOADING';
export const FETCH_CALENDER_ERR = 'FETCH_CALENDER_ERR';
export const FETCH_CALENDER_DONE = 'FETCH_CALENDER_DONE';
export const SEND_CALENDER_LOADING = 'SEND_CALENDER_LOADING';
export const SEND_CALENDER_ERR = 'SEND_CALENDER_ERR';
export const SEND_CALENDER_DONE = 'SEND_CALENDER_DONE';
export const FETCH_SCHEDULE_LOADING = 'FETCH_SCHEDULE_LOADING';
export const FETCH_SCHEDULE_ERR = 'FETCH_SCHEDULE_ERR';
export const FETCH_SCHEDULE_DONE = 'FETCH_SCHEDULE_DONE';
export const SEND_SCHEDULE_LOADING = 'SEND_SCHEDULE_LOADING';
export const SEND_SCHEDULE_ERR = 'SEND_SCHEDULE_ERR';
export const SEND_SCHEDULE_DONE = 'SEND_SCHEDULE_DONE';
export const SEND_TRANSFER_LOADING = 'SEND_TRANSFER_LOADING';
export const SEND_TRANSFER_ERR = 'SEND_TRANSFER_ERR';
export const SEND_TRANSFER_DONE = 'SEND_TRANSFER_DONE';
export const SEND_TRANSFER_RESET = 'SEND_TRANSFER_RESET';
export const RESET_TRANSFER = 'RESET_TRANSFER';
export const FETCH_TRANSFER_LOADING = 'FETCH_TRANSFER_LOADING';
export const FETCH_TRANSFER_ERR = 'FETCH_TRANSFER_ERR';
export const FETCH_TRANSFER_DONE = 'FETCH_TRANSFER_DONE';
export const SORT_USERS = 'SORT_USERS';
const SKEY = "hjkeg5gd8h";

axios.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
// 廃止
// export const EDIT_SCHDULE = 'EDIT_SCHDULE';

export const UPDATE_USERS = 'UPDATE_USERS';

export const ADD_SCHDULE = 'ADD_SCHDULE';
export const REMOVE_SCHDULE = 'REMOVE_SCHDULE';
export const REPLACE_SCHDULE = 'REPLACE_SCHDULE';
export const DISPLAY_SCHEXROW = 'DISPLAY_SCHEXROW';
export const REMOVE_SCHEXROW = 'REMOVE_SCHEXROW';
export const SET_SCHEDULE = 'SET_SCHEDULE'; // ホントはこれだけで良いかも‥


export const CHANGE_SERVECE = 'CHANGE_SERVECE';
export const SET_DATE_LIST = 'SET_DATE_LIST';

export const SCHEDULE_WEEKLY_COPY = 'SCHEDULE_WEEKLY_COPY';

// 廃止->復活 reduserの中では使わないがあちこちで明示的に使えるように
export const MODE_ADD = 'MODE_ADD';
export const MODE_REMOVE = 'MODE_REMOVE';
export const MODE_REPLACE = 'MODE_REPLACE';

export const CAL_HOLIDAY_SET_MODE = "CAL_HOLIDAY_SET_MODE";
export const CAL_SET_HOLIDAY = "CAL_SET_HOLIDAY";
export const CAL_SET_HOLIDAY_ALL = "CAL_SET_HOLIDAY_ALL";
export const SCH_TIMESETCNT = "SCH_TIMESETCNT";
export const SCH_CHKBOX = "SCH_CHKBOX";
export const SCH_CHANGE_MODE = 'SCH_CHANGE_MODE';

export const OPEN_SNAPBAR = 'OPEN_SNAPBAR'; // 廃止予定
export const CLOSE_SNAPBAR = 'CLOSE_SNAPBAR'; // 廃止予定
export const SET_SNACK_MSG = 'SET_SNACK_MSG';

export const SCH_EDIT_MODAL = 'SCH_EDIT_MODAL'; //個別スケジュール編集用のモーダル制御

export const SET_STD_DATE = 'SET_STD_DATE';

export const SET_USE_RESULT = 'SET_USE_RESULT'; 

// ログイン関連
export const FETCH_ACOUNT_LOADING = 'FETCH_ACOUNT_LOADING';
export const FETCH_ACOUNT_DONE = 'FETCH_ACOUNT_DONE';
export const FETCH_ACOUNT_ERR = 'FETCH_ACOUNT_ERR';
export const CLEAR_ACOUNT = 'CLEAR_ACOUNT';
export const SET_ACOUNT = 'SET_ACOUNT';
// export const SET_HIDBID = 'SET_HIDBID';

// 認証
export const SEND_NEWKEY_LOADING = 'SEND_NEWKEY_LOADING';
export const SEND_NEWKEY_DONE = 'SEND_NEWKEY_DONE';
export const SEND_NEWKEY_ERR = 'SEND_NEWKEY_ERR';
export const REPLACE_KEY_LOADING = 'REPLACE_KEY_LOADING';
export const REPLACE_KEY_DONE = 'REPLACE_KEY_DONE';
export const REPLACE_KEY_ERR = 'REPLACE_KEY_ERR';


// export const CHANGE_USERS = 'CHANGE_USERS';
export const TEST = 'TEST';
export const CH_TEMPLATE_TEST = 'CH_TEMPLATE_TEST';

// 認証キーからアカウントを作成
export const MAKE_ACOUNT_BYKEY_LOADING = 'MAKE_ACOUNT_BYKEY_LOADING';
export const MAKE_ACOUNT_BYKEY_DONE = 'MAKE_ACOUNT_BYKEY_DONE';
export const MAKE_ACOUNT_BYKEY_ERR = 'MAKE_ACOUNT_BYKEY_ERR';

// 加算請求などの情報をセット
export const SET_ADDICTION_COM = 'SET_ADDICTION_COM';
export const SET_ADDICTION_USER = 'SET_ADDICTION_USER';
export const SET_ADDICTION_DAY = 'SET_ADDICTION_DAY';
export const SET_ADDICTION_USE = 'SET_ADDICTION_USE';
export const FETCH_ADDICTION_COM_LOADING = 'FETCH_ADDICTION_COM_LOADING';
export const FETCH_ADDICTION_COM_DONE = 'FETCH_ADDICTION_COM_DONE';
export const FETCH_ADDICTION_COM_ERR = 'FETCH_ADDICTION_COM_ERR';
export const SEND_ADDICTION_COM_LOADING = 'SEND_ADDICTION_COM_LOADING';
export const SEND_ADDICTION_COM_DONE = 'SEND_ADDICTION_COM_DONE';
export const SEND_ADDICTION_COM_ERR = 'SEND_ADDICTION_COM_ERR';

// 事業所情報送信
export const SEND_BRUNCH_LOADING = 'SEND_BRUNCH_LOADING';
export const SEND_BRUNCH_DONE = 'SEND_BRUNCH_DONE';
export const SEND_BRUNCH_ERR = 'SEND_BRUNCH_ERR';

// ユーザーテーブルのjsonの書き込み
export const SEND_USER_ETC_LOADING = 'SEND_USER_ETC_LOADING';
export const SEND_USER_ETC_DONE = 'SEND_USER_ETC_DONE';
export const SEND_USER_ETC_ERR = 'SEND_USER_ETC_ERR';

// ユーザーテーブル書き込み
export const UPDATE_USER_LOADING = 'UPDATE_USER_LOADING';
export const UPDATE_USER_DONE = 'UPDATE_USER_DONE';
export const UPDATE_USER_ERR = 'UPDATE_USER_ERR';

// 保険番号からuidをセット
export const SET_UID_FROM_HNO = 'SET_UID_FROM_HNO';

// ユーザーステイトの更新
export const EDIT_USERS = 'EDIT_USERS'; // userの追加と修正、削除
export const SET_USERS_ETC = 'SET_USERS_ETC';

// コントロールモード全般
export const SET_CONTROLE_MODE = 'SET_CONTROLE_MODE';

// Storeをリセット
export const RESET_STORE = 'RESET_STORE';

// 汎用 単純なStoreステイトセット
export const SET_STORE = 'SET_STORE';


export const testAction = () =>{
  return {
    type:TEST,
    payload:{
      hoge:'hoge',
      hage:'hage'
    }
  }
}


export const setDateList = (dateList) =>{
  return{
    type: SET_DATE_LIST,
    payload: dateList
  }
}

// ストア内のサービス種別を変更する
export const changeService = (service) =>{
  return {
    type:CHANGE_SERVECE,
    payload:service,
  }
}

// editScheduleに集約する->しない廃止する
// mode は constされている値を使う
// MODE_ADD, MODE_REMOVE, MODE_REPLACE
// export const editSchedule = (mode, uid, did, content) =>{
//   return {
//     type:EDIT_SCHDULE,
//     mode,
//     payload:{uid, did, content},
//   }
// }

// Scheduleのstateそのままを投げて入れ替え追加を行う
export const setSchedule = (content)=>{
  return{
    type: SET_SCHEDULE,
    payload: content,
  }
}

export const addSchedule = (uid, did, content) => {
  return {
    type: ADD_SCHDULE,
    payload: { uid, did, content },
  }
}

export const removeSchedule = (uid, did, content) => {
  return {
    type: REMOVE_SCHDULE,
    payload: { uid, did, content },
  }
}


export const replaceSchedule = (uid, did, content) => {
  return {
    type: REPLACE_SCHDULE,
    payload: { uid, did, content },
  }
}


export const displaySchExRow = (uid, did) =>{
  return {
    type:DISPLAY_SCHEXROW,
    payload: {uid, did},
  }
}
export const removeSchExRow = () => {
  return {
    type: REMOVE_SCHEXROW,
  }
}


export const calHolidaySetMode = (dt) =>{
  return{
    type:CAL_HOLIDAY_SET_MODE,
    payload:dt,
  }
}

// stateのdatesオブジェクトに休日を設定する
export const calSetHoliday = (date, holiday)=>{
  return{
    type:CAL_SET_HOLIDAY,
    payload:{date,holiday}
  }
}

// stateのdatesオブジェクトのholidayを一括変更する
// holiday -> 変更先 except -> 変更除外
export const calSetHolidayAll = (holiday, except) => {
  return {
    type: CAL_SET_HOLIDAY_ALL,
    payload: {holiday, except}
  }
}

// 該当するScheduleを月末までコピーする
// didは文字列なので一旦、日付オブジェクトに解釈し直してから
// didの配列にしてリデューサーにわたすのが良いかと。
// weekdaysには配列を渡す。getDay()で返される値を格納する。
// 配列に値が格納されている場合はその曜日ごとに生成する。
// 配列が空白の場合、新しいスケジュールは
// 7日ごとに生成する。
// dateListでコピー元コピー先の休業、休校を判断する。
// 休業日はコピーしない。休校日は休校日にだけコピーする
// 休業日はコピーしない。
// コピー元が平日のときは平日にだけ、休校日のときは休校日だけに
// コピーを行う
export const scheduleWeeklyCopy = (
  uid, did, schedule, weekDays=[], dateList
) =>{
  const stDate = new Date(
    parseInt(did.substr(1, 4)),
    parseInt(did.substr(5, 2)) - 1,
    parseInt(did.substr(7, 2)),
  );
  // 曜日配列が空白なら元の日付の曜日を入れる
  if (!weekDays.length) weekDays.push(stDate.getDay());
  // コピー元の休校休業のためにdateListの日付オブジェクトを取得
  const srcDate = dateList.find(e => e.date.getTime() === stDate.getTime());
  console.log('scheduleWeeklyCopy', srcDate);
  const dateAry = [];
  const thisMonth = stDate.getMonth();
  let d = new Date(stDate.getTime());
  
  // スケジュールをコピーするべき日付配列を作成
  dateList.map(e=>{
    // 元日付より前の日付は処理しない
    if (e.date < srcDate.date)  return false;
    // 元日付と休業などが違うっ場合は処理しない
    if (e.holiday !== srcDate.holiday)  return false;
    if (weekDays.indexOf(e.date.getDay()) > -1){
      dateAry.push(new Date(e.date.getTime()));
    }
  });
  const newSchedule = {};
  dateAry.map(e=>{
    const d = 'D' + comMod.formatDate(e, 'YYYYMMDD');
    newSchedule[d] = Object.assign({}, schedule);
  });
  return {
    type:SCHEDULE_WEEKLY_COPY,
    payload: { uid, schedule: newSchedule}
  };
}

// 該当するScheduleを月末までコピーする
// scheduleWeeklyCopyとほぼ同様だがスタート日を設けず
// 1日から月末までを処理する
// reducerは上記と同じものを使う予定
// holidayは原則1or0
export const scheduleMonthlySet = (
  uid, stdDate, schedule, weekDays, dateList, holiday
) => {
  const stDate = new Date(
    parseInt(stdDate.substr(0, 4)),
    parseInt(stdDate.substr(4, 2)) - 1,
    parseInt(stdDate.substr(6, 2)),
  );
  // コピー元の休校休業のためにdateListの日付オブジェクトを取得
  const dateAry = [];
  const thisMonth = stDate.getMonth();
  let d = new Date(stDate.getTime());

  // スケジュールをコピーするべき日付配列を作成
  dateList.map(e => {
    // 平日休校日などの区分が違う場合はコピーしない
    if (e.holiday !== holiday) return false;
    if (weekDays[e.date.getDay()]) {
      dateAry.push(new Date(e.date.getTime()));
    }
  });
  const newSchedule = {};
  dateAry.map(e => {
    const d = 'D' + comMod.formatDate(e, 'YYYYMMDD');
    newSchedule[d] = Object.assign({}, schedule);
  });
  return {
    type: SCHEDULE_WEEKLY_COPY,
    payload: { uid, schedule: newSchedule }
  };
}


// dbからユーザー情報を取得し、加工してdispatchするアクション
export const listUsers = (params, sendPrmsPlan) => {
  return async (dispatch) => {
    dispatch({ type: LIST_USERS_LOADING });

    try {
      // 1回目のaxiosコール
      const res = await axios.post(endPoint(), uPrms(params));
      const resUsers = comMod.formatUserList(res, params.date, 2, );

      // responseOneを使って必要な加工を行うなどの処理

      // 2回目のaxiosコール（1回目の結果を使って何かする場合）
      // ここでは示例としてresponseOne.dataを使っているが、実際には必要に応じて変更する
      const resTimetable = await axios.post(endPoint(), uPrms(sendPrmsPlan));
      // responseTwoを使って何か処理を行う

      // 1回目と2回目の結果を組み合わせる
      // const resComb = comMod.combineResponses(responseOne, responseTwo, params.date, 2);
      const resMerge = mergeUsersTimeTable(resUsers, resTimetable);

      // 組み合わせた結果を基にdispatch
      dispatch({
        type: resMerge.data.result ? LIST_USERS_DONE : LIST_USERS_ERR,
        payload: resUsers,
      });

    } catch (error) {
      dispatch({
        type: LIST_USERS_ERR,
        payload: error,
      });
    }
  };
};


// dbからアカウント取得
export const fetchAccount = (params)=>{
  return (dispatch) =>{
    dispatch({ type: FETCH_ACOUNT_LOADING });
    axios.post(endPoint(), uPrms(params))
    // axios.get(endPoint, { params })
    .then(res =>{
      dispatch({
        type:FETCH_ACOUNT_DONE,
        payload: res,
      })
    })
    .catch(res=>{
      dispatch({
        type:FETCH_ACOUNT_ERR,
        payload:res,
      })
    });
  }
}

// export const setHidBid = (params)=>{
//   // params {hid:'xxx', bid:'xxx'}
//   return {
//     type:SET_HIDBID,
//     payload:params,
//   }
// }

// acountListの要素から選択されたアカウントをセットする
// hid, bidを確定させる
export const setAcount = (acount)=>{
  return{type:SET_ACOUNT, payload:acount};
}

export const clearAcount = ()=>{
  comMod.setCookeis(SKEY, '');
  comMod.setCookeis("mail", '');
  return {type:CLEAR_ACOUNT}
}

// dbから法人情報の取得
export const fetchCom = (params)=>{
  return (dispatch) =>{
    dispatch({ type: FETCH_COM_LOADING });
    axios.post(endPoint(), uPrms(params))
    .then(res =>{
      dispatch({
        type:FETCH_COM_DONE,
        payload: res,
      })
    })
    .catch(res=>{
      dispatch({
        type:FETCH_COM_ERR,
        payload:res,
      })
    });
  }
}
// カレンダーの読み込み
export const fetchCalender = (params) => {
  return (dispatch) => {
    dispatch({ type: FETCH_CALENDER_LOADING });
    axios.post(endPoint(), uPrms(params))
    // axios.get(endPoint, {params} )
    .then(res => {
      dispatch({
        type: FETCH_CALENDER_DONE,
        payload: { 
          ...res, 
          date: params.date, 
          weekDayDefaultSet: params.weekDayDefaultSet,
        },
      })
    })
    .catch(res => {
      dispatch({
        type: FETCH_CALENDER_ERR,
        payload: res,
      })
    });
  }
}
// カレンダーの書き込み
export const sendCalender = (params) => {
  const now = new Date();
  const key = now.getTime();
  const urlPrms = comMod.makeUrlSearchParams(params);
  return (dispatch) => {
    dispatch({ type: SEND_CALENDER_LOADING });
    axios.post(endPoint(), urlPrms)
    // axios.get(endPoint, {params} )
    .then(res => {
      dispatch({
        type: SEND_CALENDER_DONE,
        payload: res,
      });
      if (!res.data.result){
        throw new Error (res);
      }
      if (!comMod.isEditElementOpen()){
        dispatch({
          type: SET_SNACK_MSG,
          payload: {
            text: '該当月のカレンダーを保存しました。',
            severity: '', key,
            time: new Date().getTime(),
          },
        });
      }
    })
    .catch(res => {
      dispatch({
        type: SEND_CALENDER_ERR,
        payload: res,
      })
      dispatch({
        type: SET_SNACK_MSG,
        payload: { 
          text: '該当月のカレンダー保存で問題が発生したようです。', 
          severity: 'error', key ,
          time: new Date().getTime(),
        },
      });
    });
  }
}
// 事業所加算情報など
export const fetchAddictionOfBrunch = (params) => {
  // params = {
  //   hid: 'LE5MMsTF',
  //   bid: 'p0CxjWNL',
  // }
  let type;
  params.a = 'fetchAddictionOfBrunch';
  return (dispatch) => {
    dispatch({ type: FETCH_ADDICTION_COM_LOADING });
    axios.post(endPoint(), uPrms(params))
    .then(res => {
      if (res.data.result) {
        type = FETCH_ADDICTION_COM_DONE;
      }
      else {
        type = FETCH_ADDICTION_COM_ERR;
      }
      dispatch({
        type,
        payload: res
      })
    })
    .catch(res => {
      dispatch({
        type: FETCH_CALENDER_ERR,
        payload: res,
      })
    });
  }
}
// 事業所加算項目の送信
export const sendAddictionOfBrunch = (params) => {
  // params = {
  //   hid: 'LE5MMsTF',
  //   bid: 'p0CxjWNL',
  //   addiction["aaa", "bbb"]
  // }
  const key = new Date().getTime();
  let type, snackBarText, snackBarSeverity;
  params.a = 'sendAddictionOfBrunch';

  return (dispatch) => {
    dispatch({ type: SEND_ADDICTION_COM_LOADING });
    axios.post(endPoint(), uPrms(params))
    .then(res => {
      if (res.data.result) {
        type = SEND_ADDICTION_COM_DONE;
        snackBarText = "設定項目を保存しました。";
        snackBarSeverity = "success";
      }
      else {
        type = SEND_ADDICTION_COM_ERR;
        snackBarText = "設定項目の保存で問題が発生したようです。";
        snackBarSeverity = "err";
        throw new Error(res);
      }
      dispatch({
        type,
        payload: res
      });
      if (!comMod.isEditElementOpen()) {
        dispatch({
          type: SET_SNACK_MSG,
          payload: {
            text: snackBarText,
            severity: snackBarSeverity,
            key,
            time: new Date().getTime(),
          },
        });
      }
    })
    .catch(res => {
      dispatch({
        type: SEND_CALENDER_ERR,
        payload: res,
      });
      dispatch({
        type: SET_SNACK_MSG,
        payload: {
          text: '該当月のカレンダー保存で問題が発生したようです。',
          severity: 'error', key,
          time: new Date().getTime(),
        },
      });
    });
  }
}


// スケジュールの読み込み
export const fetchSchedule = (params) => {
  return (dispatch) => {
    dispatch({ type: FETCH_SCHEDULE_LOADING });
    axios.post(endPoint(), uPrms(params))
    // axios.get(endPoint, {params} )
    .then(res => {
      res.stdDate = params.stdDate;
      dispatch({
        type: FETCH_SCHEDULE_DONE,
        payload: res,
      })
    })
    .catch(res => {
      dispatch({
        type: FETCH_SCHEDULE_ERR,
        payload: res,
      })
    });
  }
}

// スケジュールの書き込み
// スケジュールデータの日付に整合性があるかどうかチェックを追加する
export const sendSchedule = (params) => {
  const key = new Date().getTime();
  const urlPrms = comMod.makeUrlSearchParams(params);
  const {schedule, date} = params;
  return (dispatch) => {
    dispatch({ type: SEND_SCHEDULE_LOADING });
    axios.post(endPoint(), urlPrms)
    .then(res => {
      dispatch({
        type: SEND_SCHEDULE_DONE,
        payload: res,
      });
      if (!res.data.result) {
        throw new Error(res);
      }
      if (!comMod.isEditElementOpen()) {
        dispatch({
          type: SET_SNACK_MSG,
          payload: {
            text: '該当月のスケジュールを保存しました。',
            severity: '', key,
            time: new Date().getTime(),
          },
        });
      }

    })
    .catch(res => {
      dispatch({
        type: SEND_SCHEDULE_ERR,
        payload: res,
      })
      dispatch({
        type: SET_SNACK_MSG,
        payload: {
          text: '該当月のスケジュール保存で問題が発生したようです。',
          severity: 'error', key,
          time: new Date().getTime(),
        },
      });
    });
  }
}

// 伝送データのdb送信
export const sendTransfer = (params) => {
  const key = new Date().getTime();
  const urlPrms = comMod.makeUrlSearchParams(params);
  return (dispatch) => {
    dispatch({ type: SEND_TRANSFER_LOADING });
    axios.post(endPoint(), urlPrms)
    .then(res => {
      dispatch({
        type: SEND_TRANSFER_DONE,
        payload: res,
      });
      if (!res.data.result) {
        throw new Error(res);
      }
    })
    .catch(res => {
      dispatch({
        type: SEND_TRANSFER_ERR,
        payload: res,
      })
    });
  }
}
// 月の更新時などデータの登録状態をリセットする必要がある。
export const resetTransfer = ()=>{
  return({type: RESET_TRANSFER});
}

// 伝送データの送信確認
// 登録済みかどうかはreg
// 未送信はunsent
// 送信済みはsent
// ここではsentかunsentで良さそう
// reg,sent,unsentはオプションの有無のみを見る
export const fetchTransfer = (params) => {
  const urlPrms = comMod.makeUrlSearchParams(params);
  return (dispatch) => {
    dispatch({ 
      type: FETCH_TRANSFER_LOADING,
      payload: {displayLoading: params.displayLoading} 
    });

    axios.post(endPoint(), urlPrms)
    .then(res => {
      dispatch({
        type: FETCH_TRANSFER_DONE,
        payload: res,
      });
      if (!res.data.result) {
        throw new Error(res);
      }
    })
    .catch(res => {
      dispatch({
        type: FETCH_TRANSFER_ERR,
        payload: res,
      })
    });
  }
}



// 開始時間・終了時間設定用のエレメント表示設定
export const switchTimeSetterController = (name, value) =>{
  return {
    type:SCH_TIMESETCNT,
    payload:{name, value}
  }  
}
// ScheduleInputのチェックボックス表示設定
export const switchChkBox = (name, value) => {
  return {
    type: SCH_CHKBOX,
    payload: { name, value }
  }
}

// スケジュールの利用履歴フラグである useResultを変更する
export const setUseResult = (uid, did, value)=>{
  return {
    type:SET_USE_RESULT,
    payload: {uid, did, value}
  }
}

// スナックバー（通知）の表示
// export const setSnackMsg = (text, severity)=>{
//   const now = new Date();
//   const key = now.getTime();
//   return {
//     type:OPEN_SNAPBAR,
//     payload:{text, severity, key},
//   }
// }
// スナックバー閉じる
export const closeSnackbar = () =>{
  return {
    type: CLOSE_SNAPBAR,
  }
}

//スケジュール編集モード変更
export const schChangeMode = (mode) =>{
  return {
    type: SCH_CHANGE_MODE,
    payload:mode,
  }
}

// スケジュール個別編集用のモーダル制御
// operation = 0 曜日のチェックボックスを非表示
// 1 = 表示
export const schEditModal = (open, uid, did, operation, service)=>{
  return{
    type:SCH_EDIT_MODAL,
    payload: {open, uid, did, operation, service},
  }
}

export const setStdDate = (newStdDate)=>{
  return{
    type:SET_STD_DATE,
    payload:newStdDate,
  }
}

export const chTemplateTest = (content)=>{
  return {
    type:CH_TEMPLATE_TEST,
    payload:content,
  }
}


// 新しいキーを送信する
export const sendNewKey = (params) => {
  // a:'sendNewKey',
  // hid:'LE5MMsTF',
  // bid:'p0CxjWNL',
  // mail:'y.yoshimura@purestep.co.jp',
  // key:'gegege',
  params.a = 'sendNewKey';
  const key = new Date().getTime();
  const urlPrms = comMod.makeUrlSearchParams(params);
  return (dispatch) => {
    dispatch({ type: SEND_NEWKEY_LOADING });
    axios.post(endPoint(), urlPrms)
    .then(res => {
      if (!res.data.result) {
        throw new Error(res);
      }
      dispatch({
        type: SEND_NEWKEY_DONE,
        payload: res,
      });
      comMod.setCookeis(SKEY, res.data.key);
      comMod.setCookeis("mail", res.data.mail);
    })
    .catch(res => {
      dispatch({
        type: SEND_NEWKEY_ERR,
        payload: res,
      })
    });
  }
}
// キーの認証と新しいキーの取得
// prmsを省略するとクッキーから値を取得する
export const replaceKey = (params = {})=>{
  params.a = 'sertificatAndNew';
  if (params.mail === undefined)
    params.mail = comMod.getCookeis("mail");
  if (params[SKEY] === undefined)
    params.key = comMod.getCookeis(SKEY);
  
  const urlPrms = comMod.makeUrlSearchParams(params);
  return (dispatch) => {
    dispatch({ type: REPLACE_KEY_LOADING });
    axios.post(endPoint(), urlPrms)
    .then(res => {
      if (!res.data.result) {
        throw new Error(res);
      }
      dispatch({
        type: REPLACE_KEY_DONE,
        payload: res,
      });
      comMod.setCookeis(SKEY, res.key);
      comMod.setCookeis("mail", res.mail);
    })
    .catch(res => {
      dispatch({
        type: REPLACE_KEY_ERR,
        payload: res,
      })
    });
  }
}

// 認証キーからアカウントを作成する
// アクションをチェーンしてみる
export const makeAcountByKey = (mail, key, stdDate) =>{
  return (dispatch) => {
    // dispatch({ type: MAKE_ACOUNT_BYKEY_LOADING });
    let params = { mail, key , date: stdDate};
    if (params.mail === undefined)
      params.mail = comMod.getCookeis("mail");
    if (params[SKEY] === undefined)
      params.key = comMod.getCookeis(SKEY);
    if (stdDate === undefined){
      let thisDate = new Date();
      thisDate.setDate(1);
      const cookieDate = comMod.getCookeis('stdDate');
      if (cookieDate) stdDate = cookieDate;
      else  stdDate = comMod.formatDate(thisDate, 'YYYY-MM-DD');
      params.date = stdDate;
    }

    const ckey = params.key;  // Cookieの値を保持
    const cmail = params.mail;

    dispatch({
      type: SET_STD_DATE,
      payload: stdDate,
    });

    // ユーザー設定の読み込み
    const ui = 'ui';
    const ck = (comMod.getCookeis(ui))? comMod.getCookeis(ui): '{}';
    const cUiVals = JSON.parse(ck);
    const uiVals = {};
    Object.keys(cUiVals).map(e=>{
      uiVals[e] = (cUiVals[e] === '1')? true: false;
    });
    dispatch({
      type:SET_STORE,
      payload:{controleMode:{ui: uiVals}},
    });

    // fetchAllWithAuth に一本化（getAccountByKey の重複呼び出しを防ぐ）
    fetchAllWithAuth({
      stdDate,
      dispatch,
      mail: cmail,
      key: ckey,
    });
  }
}
// 事業所単位の加算などの情報
export const setAddictionSettingCom = (dt)=>{
  return({ type: SET_ADDICTION_COM, payload: dt});
}
// users.etcに出力
// contentはオブジェクトにすること
export const setUsersEtc = (uid, content)=>{
  return ({type:SET_USERS_ETC, payload:{uid, content}});
}

// 事業所情報の送信
// 同時にstate.comも更新しちゃう
export const sendBrunch = (params) => {
  params.a = 'sendBrunch';
  // params
  // hid, bid, bname, sbname, jino, kanri, postal, city, address, tel, fax
  // etc, addiction, date, fprefix
  const key = new Date().getTime();
  // if (params.etc && typeof params.etc === 'object') params.etc = JSON.stringify(params.etc);
  // if (params.addiction && typeof params.addiction === 'object') params.addiction = JSON.stringify(params.addiction);
  Object.keys(params).forEach(e=>{
    if (typeof params[e] === 'object') params[e] = JSON.stringify(params[e]);
  })
  let urlPrms = comMod.makeUrlSearchParams(params);
  return (dispatch) => {
    dispatch({ type: SEND_BRUNCH_LOADING });
    axios.post(endPoint(), urlPrms)
    .then(res => {
      dispatch({
        type: SEND_BRUNCH_DONE,
        payload: res,
      });
      if (!res.data.result) {
        console.log(res);
        throw new Error(res);
      }
      if (!comMod.isEditElementOpen()) {
        dispatch({
          type: SET_SNACK_MSG,
          payload: {
            text: '登録情報の更新を送信しました',
            severity: '', key,
            time: new Date().getTime(),
          },
        });
      }

    })
    .catch(res => {
      dispatch({
        type: SEND_BRUNCH_ERR,
        payload: res,
      })
      dispatch({
        type: SET_SNACK_MSG,
        payload: {
          text: '登録情報送信で問題が発生しました',
          severity: 'error', key,
          time: new Date().getTime(),
        },
      });
    });
  }
}

// ユーザーのjson部分書き込み
export const sendUsersEtc = (params) => {
  params.a = 'sendUserEtc';
  const key = new Date().getTime();
  let urlPrms = comMod.makeUrlSearchParams(params);
  return (dispatch) => {
    dispatch({ type: SEND_USER_ETC_LOADING });
    axios.post(endPoint(), urlPrms)
    .then(res => {
      dispatch({
        type: SEND_USER_ETC_DONE,
        payload: res,
      });
      if (res.data.resultfalse) {
        throw new Error(res);
      }
      if (!comMod.isEditElementOpen()) {
        dispatch({
          type: SET_SNACK_MSG,
          payload: {
            text: 'ユーザーの情報を更新しました。',
            severity: '', key,
            time: new Date().getTime(),
          },
        });
      }

    })
    .catch(res => {
      dispatch({
        type: SEND_USER_ETC_ERR,
        payload: res,
      })
      dispatch({
        type: SET_SNACK_MSG,
        payload: {
          text: 'ユーザーの情報更新で問題が発生したようです。',
          severity: 'error', key,
          time: new Date().getTime(),
        },
      });
    });
  }
}

// ユーザーの更新と追加、削除も -> 追加・修正はここでは使わない方向
// 送信した後、再読み込みを行う -> 再読み込みは行わない
export const updateUser = (params) => {
  const key = new Date().getTime();
  let urlPrms = comMod.makeUrlSearchParams(params);
  return (dispatch) => {
    dispatch({ type: UPDATE_USER_LOADING });
    return axios.post(endPoint(), urlPrms)
      .then(res => {
        dispatch({
          type: UPDATE_USER_DONE,
          payload: res,
        });
        if (!res.data.result) {
          throw new Error(res);
        }
        dispatch({
          type: SET_UID_FROM_HNO,
          payload: {
            uid: res.data.uid,
            hno: params.hno,
          }
        });
        if (!comMod.isEditElementOpen()) {
          dispatch({
            type: SET_SNACK_MSG,
            payload: {
              text: 'ユーザー情報を保存しました。',
              severity: '',
              time: new Date().getTime(),
            },
          });
        }
        return res; // Promiseの成功結果を返す
      })
      .catch(res => {
        dispatch({
          type: UPDATE_USER_ERR,
          payload: res,
        });
        dispatch({
          type: SET_SNACK_MSG,
          payload: {
            text: 'ユーザーの情報更新で問題が発生したようです。',
            severity: 'error', key,
            time: new Date().getTime(),
          },
        });
        throw res; // Promiseの失敗結果を返す
      });
  }
}
// ユーザーのステイト更新
// まるっと全部更新
export const updateUsersAll = (params) =>{
  return({
    type: UPDATE_USERS,
    payload: params,
  })
}

// コントロールモード全般
export const setControleMode = (params) =>{
  return({
    type: SET_CONTROLE_MODE,
    payload: params,
  })
}
// スナックバー制御
export const setSnackMsg = (text, severity, errorId = '')=>{
  return ({
    type: SET_SNACK_MSG,
    payload: {text, severity,errorId ,time: new Date().getTime()}
  })
}

// ユーザーの追加、修正、削除
// ストアの修正のみ行う。書き込み送信は別アクションで
// コール元でストアのユーザー配列を準備すること
// deleteのキーにTRUEを設定することにより削除実行する
// params {
  // userdatas, a:dbapiへのアクション, users:ストアのユーザー配列,[delete:true]
// }
export const editUser = (params) => {
  const users = params.users;
  // ユーザー情報のみ定義。不必要な要素は削除
  const thisUser = {...params};
  delete thisUser.users;
  delete thisUser.a;
  const uid = comMod.convUID(params.uid).num; // 数値のみ取り出し
  const ndx = users.findIndex(e=>parseInt(e.uid) === uid);
  // 削除の場合
  if (params.delete && ndx > 1){
    users.splice(ndx, 1);
  }
  else if (ndx > -1){ // 既存ユーザー
    users[ndx] = thisUser;
  }
  else if (!params.delete){ // 新規ユーザー
    users.push(thisUser);
  }
  return {
    type: EDIT_USERS,
    payload: users,
  }
}

// export const sortUsers = () => {
//   return {
//     type: SORT_USERS,
//   }
// }

// 汎用
export const setStore = (someData) => {
  return {
    type: SET_STORE,
    payload: someData,
  }
}

// Storeをリセット
export const resetStore = () => {
  return {
    type: RESET_STORE,
  }
}

// export const deleteUser = (prams) => {

// }

export const sortUsersAsync = () => {
  return (dispatch, getState) => {
    const state = getState();
    const sortedUsers = sortUsers(state.users, state.com?.ext?.selectedOrder ?? {});
    const indexset = sortedUsers.map(e => [e.uid, e.sindex]);
    const jindexset = JSON.stringify(indexset);
    const urlPrms = {
      hid: state.hid, bid: state.bid, indexset: jindexset, a: 'sendUsersIndex'
    };

    univApiCall(urlPrms, '', '', '')
      .then(res => {
        console.log('API call successful:', res);
        dispatch({ type: 'SET_STORE', payload: {users: sortedUsers} });
      })
      .catch(err => {
        console.error('API call failed:', err);
        // dispatch(Actions.setSnackMsg('ソートに失敗しました。', 'error'));
      });
  };
};

