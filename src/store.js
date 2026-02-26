import { AssignmentReturned } from "@material-ui/icons";
import { applyMiddleware, createStore } from "redux";
import { createLogger } from "redux-logger";
import thunk from 'redux-thunk';
import * as act from './Actions';
import { deleteOtherMonthInSchedule } from './albCommonModule';
import { univApiCall } from './modules/api';
import { HOHOU } from './modules/contants';
import * as comMod from './commonModule'
import { DailyReport } from "./component/dailyReport/DailyReport";
import { sortUsers } from "./component/Setting/sortUtils";

// フェッチの状態を表すテンプレート
const fetchStatus = {
  loading:false,
  done:false,
  err:false,
  result:null,
  errDetail:null,
}
const initialState = {
  // fetching: false,
  // fetched: false,
  // errmsg: null,
  // err: false,
  account:{}, // アカウント情報
  accountLst:[], // 最初にフェッチした情報が入る 複数ある場合があるから絞り込んで使う
  session:{}, // 認証に使う。メールアドレスとワンタイムキーが入る
  sessionStatus:{...fetchStatus},
  hid: '', // 法人ID
  bid: '', // 事業所id
  service: '', //放デイor児発
  classroom: '', // 教室 空白で未選択
  // serviceItems: ['放課後等デイサービス', '児童発達支援'],
  serviceItems: ['放課後等デイサービス',],
  serviceItemsInit: false,
  serviceShortHand:{
    放課後等デイサービス:'放デイ',
    児童発達支援: '児発',
  },
  typeItems: ['障害児', '重症心身障害児'],
  stdDate: '2020-07-01', // 契約基準日
  dateList: [],
  users: [],
  userFtc: { ...fetchStatus},
  sendTransferStatus: { ...fetchStatus },
  fetchTransferStatus:{...fetchStatus},
  sendUserEtcStatus: { ...fetchStatus },
  sendBrunchStatus: { ...fetchStatus },
  sendUserStatus:{...fetchStatus},
  com : {}, //法人と事業所
  comFtc: { ...fetchStatus },
  sendCalenderStatus: { ...fetchStatus },
  fetchCalenderStatus: { ...fetchStatus },
  fetchAccountStatus: { ...fetchStatus },
  sendScheduleStatus: { ...fetchStatus },
  // fetchAddictionComStatus: { ...fetchStatus },
  sendAddictionComStatus: { ...fetchStatus },
  fetchSchedule: { ...fetchStatus },
  schedule:{},
  controleMode: {// あちこちで使う予定。操作状態を保持する
    scheduleFormModal: {
      open: false,
      uid: '',
      did: '',
    },
    lastUpdate : 0, //最後に保存されたタイムスタンプ
  }, 
  schExRow:{uid:'', did:''}, // Schedule拡張行用
  scheduleTemplate: {
    放課後等デイサービス:{
      // 平日
      weekday:{
        start: '13:30',
        end: '17:00',
        offSchool: 0,
        transfer:['学校','自宅'],
        actualCost: { 'おやつ': 100 },
        service:'放課後等デイサービス',
        dAddiction:{時間区分: 2}, //日毎の加算
        useResult: false,
      },
      // 休日
      schoolOff: {
        start: '10:30',
        end: '17:00',
        offSchool: 1,
        transfer: ['自宅','自宅'],
        actualCost: { 'おやつ': 100 },
        service: '放課後等デイサービス',
        dAddiction: {時間区分: 3}, //日毎の加算
        useResult: false,
      }
    },
    児童発達支援: {
      // 平日
      weekday: {
        start: '10:30',
        end: '11:30',
        offSchool: 0,
        transfer: ['',''],
        actualCost: { 'おやつ': 100 },
        service: '児童発達支援',
        dAddiction: {時間区分: 1}, //日毎の加算
        useResult: false,
      },
      // 休日
      schoolOff: {
        start: '10:30',
        end: '11:30',
        offSchool: 1,
        transfer: ['', ''],
        actualCost: {'おやつ': 100},
        service: '児童発達支援',
        dAddiction: {時間区分: 1}, //日毎の加算
        useResult: false,
      }
    },
    保育所等訪問支援:{
      // 平日
      weekday: {
        actualCost: {},
        service: '保育所等訪問支援',
        dAddiction: {保育訪問:'保訪'}, //日毎の加算
        useResult: false,
      },
      // 休日
      schoolOff: {
        actualCost: {},
        service: '保育所等訪問支援',
        dAddiction: {保育訪問:'保訪'}, //日毎の加算
        useResult: false,
      }
    },
    計画相談支援:{
      weekday: {
        actualCost: {},
        dAddiction: {},
        useResult: false,
      },
    },
    障害児相談支援:{
      weekday: {
        actualCost: {},
        dAddiction: {},
        useResult: false,
      },
    },

  },
  snackBar: {
    open:false,
    text:'',
    severity:'',
    key:0,
  },
  snackPack: {
    time: 0, text: '', severity: '',
  },
  config: {
    timeSetStep:30, // 開始時間、終了時間などの設定感覚。分単位。
    timeSetLower: "09:00",// 開始時間、終了時間の範囲
    timeSetHigher: "18:00",
    weekDayDefaultSet: [   // デフォルト休業日休校日
      2, // 日曜日休業日
      0, 0,  0, 0, 0, //　平日
      1, // 土曜日休校日
    ],
    transferList:[
      '学校', '自宅', 
      // '南林間小学校', '鶴間小学校', 
      // '上草柳小学校', '深見小学校',
    ],
    actualCostList:{'おやつ':100 ,'教材費':200,'レク費': 300,},
    // 加算に対しては略称をキーに正式名称をvalueにする
    addctionHoudayByDate:{
      特支: '特別支援加算',
      家連: '家庭連携加算',
      医連: '医療連携加算',
      加配1: '児童指導員等加配加算(I)',
      加配2: '児童指導員等加配加算(II)',
      強行: '強度行動加算',
      児指: '児童指導員配置加算',
      福専: '福祉専門員配置加算',
    },
    addctionHoudayByMonth: {
      送迎重度:false,
      関係機関連携加算:false,
      事業所内相談支援加算:false,
      強度行動障害児支援加算:false,
      保育教育等移行支援加算:false,
    },
    addctionJihatsuByDate: {
      特支: '特別支援加算',
      家連: '家庭連携加算',
      医連: '医療連携加算',
      加配1: '児童指導員等加配加算(I)',
      加配2: '児童指導員等加配加算(II)',
      強行: '強度行動加算',
      児指: '児童指導員配置加算',
      福専: '福祉専門員配置加算',
    },
    addctionJihatsuByMonth: {
      送迎重度: false,
      関係機関連携加算: false,
      事業所内相談支援加算: false,
      強度行動障害児支援加算: false,
      保育教育等移行支援加算: false,
    },
  },
  dailyReportDefaultTemplate:{
    officeNotice: `【今日の目標】\n【今日の注意点】\n【今日の成果】`,
    userNotice: `【今日の目標】\n【今日の注意点】\n【ご家族様より】\n【ご家族様へ】\n【今日の成果】\n%日々の課題%`,
    userHohouNotice: `【時間】00:00〜00:00\n【今日の目標】\n【今日の注意点】\n【ご家族様より】\n【ご家族様へ】\n【今日の成果】\n%日々の課題%`,
    kesseki: `【いつ？】\n【誰から？】\n【連絡方法】メール・電話・LINE・あるふぁみ\n【連絡の内容】`,
    kazokuShien: `【%自動挿入%】\n【ご家族様】お母様・お父様・その他\n【時間】00:00〜00:00\n【内容】`,
    kosodate: `【時間】00:00〜00:00\n【ご家族様】お母様・お父様・その他`,
    kankeiKikan: `【連携先】\n【連携先ご担当】\n【%自動挿入%】\n【時間】00:00〜00:00\n【内容】`,
    iryouKasan: `【担当】\n【措置】\n【配置時間】\n【記事】`,
    jigyosyoKan: `【連携先】\n【連携先ご担当】\n【時間】00:00〜00:00\n【内容】`,
    senmonShien: `【担当・職種】 PT・OT・ST・\n【時間】00:00〜00:00\n【支援内容】`,
  }
};

const reducer = (state = initialState, action) => {
  let t;
  let u = {};
  let v;
  let w;
  // console.log('reducer called type', action.type, 'payloadKeys', Object.keys(action.payload || {}));
  if (action.type === act.SET_STORE && action.payload && Object.prototype.hasOwnProperty.call(action.payload, 'billingDt')){
    const len = Array.isArray(action.payload.billingDt) ? action.payload.billingDt.length : 'N/A';
    console.log('[SET_STORE billingDt] length:', len);
    // 詳細な追跡が必要ならスタックを出す
    // console.trace('[SET_STORE billingDt] trace');
  }
  switch (action.type) {
    case 'LIST_USERS_LOADING':
      t = Object.assign({}, fetchStatus);
      t.loading = true;
      return { ...state,  userFtc:t};
    case 'LIST_USERS_ERR':
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      return {
        ...state, 
        userFtc:t, 
      };
    case 'LIST_USERS_DONE':
      t = Object.assign({}, fetchStatus);
      t.done = true;
      t.result = action.payload.data.result;
      return {
        ...state,
        userFtc:t,
        users: action.payload.data.dt,
      };
    case 'FETCH_COM_LOADING':
      t = Object.assign({}, fetchStatus);
      t.loading = true;
      return { ...state, comFtc: t };
    case 'FETCH_COM_ERR':
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      return {
        ...state,
        comFtc: t,
      };
    case 'FETCH_COM_DONE':
      t = Object.assign({}, fetchStatus);
      t.done = true;
      t.result = action.payload.data.result;
      u = { ...(action.payload?.data?.dt?.[0] || {}) };;
      // json部分をパースする。
      u.addiction = u.addiction? u.addiction: '{}';
      u.etc = u.etc? u.etc: '{}';
      u.ext = u.ext? u.ext: '{}';
      u.ext = (u.ext !== "[object Object]")? u.ext: '{}';
      u.addiction = JSON.parse(u.addiction);
      u.etc = JSON.parse(u.etc);
      u.ext = JSON.parse(u.ext);
      u.cetc = u.cetc? JSON.parse(u.cetc): {};
      // u.etc = u.etc ? u.etc: {};  // nullだったら空白オブジェクトにする
      v = {...state.scheduleTemplate, ...u.etc.scheduleTemplate};
      delete v.classroom; // 2022/05/14追加
      // w = (u.etc.actualCostList) ? 
      //   u.etc.actualCostList : state.config.actualCostList;

      if (u.etc.actualCostList){
        w = { ...state.config, actualCostList: u.etc.actualCostList}
      }
      else{
        w = {...state.config}
      }
      if (u.etc.transferList) {
        w = { ...w, transferList: u.etc.transferList}
      }
      return {
        ...state,
        comFtc:Object.assign(t),
        com: u,
        scheduleTemplate: v,
        config: w,
      };
    case 'CHANGE_SERVECE':
      return {
        ...state,
        service: action.payload
      }
    case 'SET_DATE_LIST':
      t = {...state.controleMode, lastUpdate: new Date().getTime()}
      
      return {
        ...state,
        dateList:action.payload,
        controleMode: t,
        
      }

    case 'TEST':
      return{
        ...state,
        test:action.payload
      }
    case act.SET_SCHEDULE:
      u = { ...state.controleMode, lastUpdate: new Date().getTime() }
      return {
        ...state,
        schedule: action.payload,
        controleMode: u,
      }
    case act.REMOVE_SCHDULE:
      t = { ...state.schedule };
      delete t[action.payload.uid][action.payload.did];
      return {
        ...state,
        schedule: t,
      }
    
    case act.ADD_SCHDULE:
      t = { ...state.schedule };
      u = { ...state.controleMode, lastUpdate: new Date().getTime() }

      if (!(action.payload.uid in t)) {
        t[action.payload.uid] = {};
      }
      if (Array.isArray(action.payload.content)){
        t[action.payload.uid][action.payload.did] = [...action.payload.content];
      }
      else {
        t[action.payload.uid][action.payload.did] = {...action.payload.content};
      }
      return {
        ...state,
        schedule: t,
        controleMode: u,
      }
    // case act.REMOVE_SCHDULE:
    //   t = { ...state.schedule };
    //   u = { ...state.controleMode, lastUpdate: new Date().getTime() }

    //   delete t[action.payload.uid][action.payload.did];
    //   return {
    //     ...state,
    //     schedule: t,
    //     controleMode: u,
    //   }
    case act.REPLACE_SCHDULE:
      t = { ...state.schedule };
      u = { ...state.controleMode, lastUpdate: new Date().getTime() }
      t.timestamp = new Date().getTime();

      if (t[action.payload.uid]){
        delete t[action.payload.uid][action.payload.did];
      }
      else{
        t[action.payload.uid] = {};
      }
      t[action.payload.uid][action.payload.did] = { ...action.payload.content };
      return {
        ...state,
        schedule: t,
        controleMode: u,
      }

    // Scheduleの拡張行を表示する
    case act.DISPLAY_SCHEXROW:
      t = { uid: action.payload.uid, did: action.payload.did };
      return {
        ...state,
        schExRow: t,
      }
    case act.REMOVE_SCHEXROW:
      t = { uid: '', did: '' };
      return {
        ...state,
        schExRow: t,
      }
    case act.SCHEDULE_WEEKLY_COPY:
      t = {...state.schedule};
      u = { ...state.controleMode, lastUpdate: new Date().getTime() }

      if (t[action.payload.uid] === undefined){
        t[action.payload.uid] = {...action.payload.schedule};
      }
      else{
        t[action.payload.uid] = {
          ...t[action.payload.uid], 
          ...action.payload.schedule ,
        }
      }
      return{
        ...state,
        schedule: t,
        controleMode: u,
      }
    // 時刻設定用エレメントの表示制御
    case act.SCH_TIMESETCNT:
      t = { ...state.controleMode }
      // 設定の前に既存の要素を削除。valueにはstartとendが想定されるが両方ともtrueに設定させない。また、削除のときはvalueにnullなどを設定する
      delete t.displayTimeSetterCnt;
      t.displayTimeSetterCnt = {};
      t.displayTimeSetterCnt[action.payload.name] = action.payload.value;
      return{
        ...state,
        controleMode: t,
      }
    // 時刻設定用エレメントの表示制御
    case act.SCH_CHKBOX:
      t = { ...state.controleMode }
      // 設定の前に既存の要素を削除。valueにはstartとendが想定されるが両方ともtrueに設定させない。また、削除のときはvalueにnullなどを設定する
      delete t.diplayChkBoxForScdInpt;
      t.diplayChkBoxForScdInpt = {};
      t.diplayChkBoxForScdInpt[action.payload.name] = action.payload.value;
      return {
        ...state,
        controleMode: t,
      }
    case act.CAL_HOLIDAY_SET_MODE:
      t = {...state.controleMode}
      t.calHoliday = action.payload;
      return{
        ...state,
        controleMode: t,
      }
    case act.SCH_CHANGE_MODE:
      t = { ...state.controleMode }
      t.schEditMode = action.payload;
      return {
        ...state,
        controleMode: t,
      }
    case act.CAL_SET_HOLIDAY:
      t = [...state.dateList];
      u = { ...state.controleMode, lastUpdate: new Date().getTime() }

      let ndate = t.map(e=>{
        if (e.date === action.payload.date){
          return {...e, holiday:action.payload.holiday};
        }
        else{
          return e;
        }
      });
      return {...state, dateList:ndate, controleMode: u}
    case act.CAL_SET_HOLIDAY_ALL:
      t = state.dateList.concat();
      u = { ...state.controleMode, lastUpdate: new Date().getTime() }

      const ndate1 = t.map(e => {
        if (e.holiday !== action.payload.except)
          return { ...e, holiday: action.payload.holiday };
        else
          return e;
      });
      return { ...state, dateList: ndate1, controleMode:u }
    case act.OPEN_SNAPBAR:
      t = {...state.snackBar};
      t.open = true;
      t.text = action.payload.text;
      t.severity = action.payload.severity;
      t.key = action.payload.key;
      return {...state, snackBar: t};
    case act.CLOSE_SNAPBAR:
      t = { ...state.snackBar };
      t.open = false;
      // t.text = '';
      // t.severity = '';
      return { ...state, snackBar: t };
    case act.CH_TEMPLATE_TEST:
      t = {...state.scheduleTemplate};
      t.放課後等デイサービス.schoolOff = action.payload;
      return { ...state, scheduleTemplate: t}
    case act.SCH_EDIT_MODAL:
      t = {...state.controleMode};
      t.scheduleFormModal = action.payload;
      return { ...state, controleMode: t };

    case act.SEND_SCHEDULE_DONE:
      t = Object.assign({}, fetchStatus);
      t.done = true;
      t.result = action.payload.data.result;
      return {
        ...state,
        sendScheduleStatus: t,
      };
    case act.SEND_SCHEDULE_LOADING:
      t = Object.assign({}, fetchStatus);
      t.loading = true;
      return { ...state, sendScheduleStatus: t };
    case act.SEND_SCHEDULE_ERR:
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      return {
        ...state,
        sendScheduleStatus: t,
      };

    case act.FETCH_SCHEDULE_DONE:
      t = Object.assign({}, fetchStatus);
      t.done = true;
      t.result = action.payload.data.result;
      let tmpSch = (action.payload.data.dt.length) ?
        action.payload.data.dt[0].schedule : {};
      // 一時的に廃止する
      // deleteOtherMonthInSchedule(tmpSch, action.payload.stdDate)
      tmpSch = (tmpSch) ? tmpSch: {}; // APIの戻り値にnullが入ってくることがあるので
      return {
        ...state,
        fetchSchedule: t,
        schedule: tmpSch,
      };
    case act.FETCH_SCHEDULE_LOADING:
      t = Object.assign({}, fetchStatus);
      t.loading = true;
      return { ...state, fetchSchedule: t };
    case act.FETCH_SCHEDULE_ERR:
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      return {
        ...state,
        fetchSchedule: t,
      };


    case act.SEND_CALENDER_DONE:
      t = Object.assign({}, fetchStatus);
      t.done = true;
      t.result = action.payload.data.result;
      return {
        ...state,
        sendCalenderStatus: t,
      };
    case act.SEND_CALENDER_LOADING:
      t = Object.assign({}, fetchStatus);
      t.loading = true;
      return { ...state, sendCalenderStatus: t };
    case act.SEND_CALENDER_ERR:
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      return {
        ...state,
        sendCalenderStatus: t,
      };

    case act.FETCH_CALENDER_DONE:
      t = Object.assign({}, fetchStatus);
      t.done = true;
      t.result = action.payload.data.result;
      // 戻り値がないときは空の配列をセット
      // こういう処理をストアでやるのはいかんよな
      let tmp = (action.payload.data.dt.length)?
        action.payload.data.dt[0].dateList : [];
      
      // 文字列からdate オブジェクトに変換
      if (tmp instanceof Array === false) tmp = [];
      const cldAry = tmp.map(e => {
        const d = comMod.toDateApiDateStr(e.date);
        return ({ ...e, date: d });
      });
      // データがないときは新規作成。
      // この辺のコーディングが煩雑すぎ。
      let dateList = [];
      if (!cldAry.length){
        const stdDate = action.payload.date;
        dateList = comMod.getDatesArrayOfMonth(
          parseInt(stdDate.split('-')[0]),
          parseInt(stdDate.split('-')[1]),
        );
      }
      const newCld = dateList.map(e=>{
        const holiday = state.config.weekDayDefaultSet[e.getDay()];
        const r = { date: e, holiday };// 0 休日 1 休校日 2 施設休日
        return r;
      });
      const finalCld = (cldAry.length)? cldAry:newCld;
      return {
        ...state,
        fetchCalenderStatus: t,
        dateList: finalCld,
      };
    case act.FETCH_CALENDER_LOADING:
      t = Object.assign({}, fetchStatus);
      t.loading = true;
      return { ...state, fetchCalenderStatus: t };
    case act.FETCH_CALENDER_ERR:
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      return {
        ...state,
        fetchCalenderStatus: t,
      };
    
    case act.SEND_TRANSFER_DONE:
      t = Object.assign({}, fetchStatus);
      t.done = true;
      t.result = action.payload.data.result;
      return {
        ...state,
        sendTransferStatus: t,
      };
    case act.SEND_TRANSFER_LOADING:
      t = Object.assign({}, fetchStatus);
      t.loading = true;
      return { ...state, sendTransferStatus: t };
    case act.SEND_TRANSFER_ERR:
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      return {
        ...state,
        sendTransferStatus: t,
      };
    case act.RESET_TRANSFER:
      t = Object.assign({}, fetchStatus);
      return { ...state, sendTransferStatus: t };

    case act.FETCH_TRANSFER_DONE:
      t = Object.assign({}, state.fetchTransferStatus);
      t.done = true;
      t.result = action.payload.data.result;
      t.data = action.payload.data;
      return {
        ...state,
        fetchTransferStatus: t,
      };
    // このreducerはtimerでコールされる
    // すでにfetchが終わっているときにはloadingにしない
    // loadingのスピナーが表示されてうざい
    // fetchされてないときだけloadingにする
    // これで大丈夫？
    case act.FETCH_TRANSFER_LOADING:
      t = Object.assign({}, state.fetchTransferStatus);
      if (!t.done && action.payload.displayLoading)  t.loading = true;
      return { ...state, fetchTransferStatus: t };
    case act.FETCH_TRANSFER_ERR:
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      return {
        ...state,
        fetchTransferStatus: t,
      };
    case act.SET_STD_DATE:
      return{
        ...state,
        stdDate:action.payload,
      }
    case act.SET_USE_RESULT:
      t = Object.assign({}, state.schedule);
      u = { ...state.controleMode, lastUpdate: new Date().getTime() }

      t[action.payload.uid][action.payload.did].useResult = action.payload.value;
      return{
        ...state,
        schedule: t,
        controleMode: u,
      }

    case act.FETCH_ACOUNT_LOADING:
      t = Object.assign({}, fetchStatus);
      t.loading = true;
      return { ...state, fetchAccountStatus: t };
    case act.FETCH_ACOUNT_ERR:
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      return {
        ...state,
        fetchAccountStatus: t,
      };
    case act.FETCH_ACOUNT_DONE:
      t = Object.assign({}, fetchStatus);
      t.done = true;
      t.result = action.payload.data.result;
      // ログイン結果を記述する
      // ログインしていないときはundefinedになるはずなので要注意
      if (action.payload.data.dt.length){
        t.loginResult = true;
      }
      else {
        t.loginResult = false;
        t.attemptCount = action.payload.data.attempt_count;
      }
      return {
        ...state,
        fetchAccountStatus:Object.assign(t),
        accountLst: action.payload.data.dt,
      };
    case act.CLEAR_ACOUNT:
      
      t = Object.assign({}, fetchStatus);
      return{
        ...state,
        account: {},
        accountLst: [],
        fetchAccountStatus: t,
        session:{},
        sessionStatus: t,
        com: [],
        dateList: [],
        schedule: {},
      }
    // case act.SET_HIDBID:
    //   return{
    //     ...state,
    //     hid: action.payload.hid,
    //     bid: action.payload.bid,
    //   }
    case act.SET_ACOUNT:
      return{
        ...state,
        account: action.payload,
        hid: action.payload.hid,
        bid: action.payload.bid,
      }
    case act.SEND_NEWKEY_LOADING:
      t = Object.assign({}, fetchStatus);
      t.loading = true;
      return { ...state, sessionStatus: t };
    case act.SEND_NEWKEY_ERR:
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      u = {};
      return { ...state, sessionStatus: t ,session: u};
    case act.SEND_NEWKEY_DONE:
      t = Object.assign({}, fetchStatus);
      t.done = true;
      t.result = action.payload.data.result;
      t.data = action.payload.data;
      u = {};
      u.mail = action.payload.data.mail;      
      u.key = action.payload.data.key;
      return { ...state, sessionStatus: t , session:u};
    case act.REPLACE_KEY_LOADING:
      t = Object.assign({}, fetchStatus);
      t.loading = true;
      return { ...state, sessionStatus: t };
    case act.REPLACE_KEY_ERR:
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      u = {};
      return { ...state, sessionStatus: t ,session: u};
    case act.REPLACE_KEY_DONE:
      t = Object.assign({}, fetchStatus);
      t.done = true;
      t.result = action.payload.data.result;
      t.data = action.payload.data;
      u = {};
      u.mail = action.payload.data.mail;      
      u.key = action.payload.data.key;
      // console.log('reducer',u.key);
      return { ...state, sessionStatus: t , session:u};
    case act.SET_ADDICTION_COM:
      t = {...state.com, addiction:action.payload};
      return {...state, com: t};

    case act.SEND_ADDICTION_COM_DONE:
      t = Object.assign({}, fetchStatus);
      t.done = true;
      t.result = action.payload.data.result;
      return {
        ...state,
        sendAddictionComStatus: t,
      };
    case act.SEND_ADDICTION_COM_LOADING:
      t = Object.assign({}, fetchStatus);
      t.loading = true;
      return { ...state, sendAddictionComStatus: t };
    case act.SEND_ADDICTION_COM_ERR:
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      return {
        ...state,
        sendAddictionComStatus: t,
      };
    case act.SET_USERS_ETC:
      t = state.users.map(e=>{
        if (parseInt(e.uid) === parseInt(action.payload.uid)){
          if (e.etc !== undefined && typeof e.etc === "object"){
            u = Object.assign({}, e.etc);
          }
          else{
            u = new Object();
          }
          // u.addiction = action.payload.content;
          Object.assign(u, action.payload.content);
          return {...e, etc:u}
        }
        else{
          return e;
        }
      });
      return {...state, users: t};

    case act.SEND_USER_ETC_DONE:
      t = Object.assign({}, fetchStatus);
      t.done = true;
      t.result = action.payload.data.result;
      return {
        ...state,
        sendUserEtcStatus: t,
      };
    case act.SEND_USER_ETC_LOADING:
      t = Object.assign({}, fetchStatus);
      t.loading = true;
      return { ...state, sendUserEtcStatus: t };
    case act.SEND_USER_ETC_ERR:
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      return {
        ...state,
        sendUserEtcStatus: t,
      };

    case act.SEND_BRUNCH_DONE:
      t = Object.assign({}, fetchStatus);
      t.done = true;
      t.result = action.payload.data.result;
      u = Object.assign({}, state.com);
      // state.comも一緒に更新する
      u = {
        ...u,
        bname: action.payload.data.bname,
        sbname: action.payload.data.sbname,
        jino: action.payload.data.jino,
        kanri: action.payload.data.kanri,
        postal: action.payload.data.postal,
        city: action.payload.data.city,
        address: action.payload.data.address,
        tel: action.payload.data.tel,
        fax: action.payload.data.fax,
        fprefix: action.payload.data.fprefix,
        etc: JSON.parse(action.payload.data.etc),
      }
      return {
        ...state,
        sendBrunchStatus: t,
        com: u,
      };
    case act.SEND_BRUNCH_LOADING:
      t = Object.assign({}, fetchStatus);
      t.loading = true;
      return { ...state, sendBrunchStatus: t };
    case act.SEND_BRUNCH_ERR:
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      return {
        ...state,
        sendBrunchStatus: t,
      };

    case act.EDIT_USERS:
      console.log(action);
      return {
        ...state,
        users: action.payload,
      };
    case act.UPDATE_USER_DONE:
      t = Object.assign({}, fetchStatus);
      t.done = true;
      t.result = action.payload.data.result;
      return {
        ...state,
        sendUserStatus: t,
      };
    case act.UPDATE_USER_LOADING:
      t = Object.assign({}, fetchStatus);
      t.loading = true;
      return { ...state, sendUserStatus: t };
    case act.UPDATE_USER_ERR:
      t = Object.assign({}, fetchStatus);
      t.err = true;
      t.errDetail = action.payload;
      return {
        ...state,
        sendUserStatus: t,
      };
    case act.SET_CONTROLE_MODE:
      t = {...state.controleMode, ...action.payload};
      return {...state, controleMode: t};

    case act.SET_SNACK_MSG:
      t = {...state.snackPack, ...action.payload}
      return {...state, snackPack: t}

    case act.SET_UID_FROM_HNO:
      t = state.users;
      v = t.findIndex(e=>e.hno === action.payload.hno);
      if (v >= 0)  t[v].uid = action.payload.uid;
      return {...state, users: t};
    
    // 汎用 payloadにはキーもつけること
    case act.SET_STORE:
      return { ...state, ...action.payload}

    // 何もしないでStoreを更新する
    // 何かしら更新しないと更新にならないっぽいのでtimeを入れてる
    case act.RESET_STORE:
      return { ...state, time:new Date().getTime()};
    
    case act.UPDATE_USERS:
      t = [...action.payload]
      return { ...state, users: t };

    case act.SORT_USERS:
      const sortedUsers = sortUsers(state.users, state.com?.ext?.selectedOrder ?? {});
      const indexset = sortedUsers.map(e => {
        return [e.uid, e.sindex];
      });
      const jindexset = JSON.stringify(indexset);
      const urlPrms = {
        hid: state.hid, bid: state.bid, indexset: jindexset, a: 'sendUsersIndex'
      };
      univApiCall(urlPrms, '', '', '')
        .then(res => {
          // 成功時の処理
          console.log('API call successful:', res);
          return { ...state, users: sortedUsers };
        })
        .catch(err => {
          // エラー時の処理
          console.error('API call failed:', err);

          return {
            ...state, 
            snackPack: {
              text: 'ソートに失敗しました。', severity: 'error', key: new Date().getTime(), time: new Date().getTime()
            }
          };
        });
    default:
      console.log('unmatch action type.', action.type );
      return state;
  }
}
// const middleware = applyMiddleware(thunk, createLogger());
const middleware = applyMiddleware(thunk,);
const store = createStore(reducer, middleware);

export default store;
