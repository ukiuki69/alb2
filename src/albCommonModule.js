// commmonModuleが肥大化しているので。
// アルバトロスでしか使わないモジュールはこちらに移す方向

// すべてのimportを最上部に配置（ESLint import/first ルール対応）
import Cookies from 'js-cookie';
import axios from 'axios';
import { TrendingUp } from '@material-ui/icons';
import { faBullseye, faSleigh } from '@fortawesome/free-solid-svg-icons';
import { yellow } from '@material-ui/core/colors';
import { seagull, didPtn, HOUDAY, JIHATSU, HOHOU } from './modules/contants';
import { getJikanKubunAndEnchou } from './modules/elapsedTimes';
import { getLS, LOCAL_STRAGE_PRINT_TITLE, setLS } from './modules/localStrageOprations';
import { cleanSpecialCharacters } from './modules/cleanSpecialCharacters';
import { processDeepLfToBr } from './modules/newlineConv';
import { isClassroom, classroomCount } from './modules/userUtils';
import * as cmd from './commonModule';
import { packPrms } from './modules/makeCreteria';

export { isClassroom, classroomCount };
// import { makeCreteria, packPrms } from './modules/makeCreteria'; // 循環依存のため削除
export { 
  endPoint, univApiCall, univApiCallJson, simpleApiCall, fsConCnvExcel, 
  sendUsersSchedule, sendPartOfSchedule, sendPartOfScheduleCompt, 
  sendCalender, sendUser, genFKdatas, sendSomeState, fetchSomeState, 
  fetchDbname, getNextHist, getMinMaxOfMonnth, deleteSchedule, fetchAccountsByBid 
} from './modules/api';

const CancelToken = axios.CancelToken;

// 定数の再エクスポートは循環依存を引き起こすため削除
// 各ファイルで直接 modules/contants からインポートしてください
// export { 
//   HOUDAY, JIHATSU, HOHOU, KANRI_JIGYOUSYO, KYOURYOKU_JIGYOUSYO, 
//   KEIKAKU_SOUDAN, SYOUGAI_SOUDAN 
// } from './modules/albConstants';

export const defaultTitle = seagull?'療育支援 AIつばさ': 'Albatross 放課後デイ業務支援';

// 複数サービス対応用　サービスが該当するかどうか
export const inService = (svcsWithComma, svc) => cmd.inService(svcsWithComma, svc);

// 配列化された請求データを確認する
// サービスコードを検索したときのエラーを検出する
export const chekBillingDt = (bdt) => {
  const rtn = {result:true, done:false, detail:[]};
  const a = cmd.typeOf(bdt);
  if (cmd.typeOf(bdt) !== 'array') return {result:false, done:false, detail:[]};
  bdt.map(e=>{
    rtn.done = true;
    const itemTotal = e.itemTotal;
    if (!Array.isArray(itemTotal)) return false;
    // エラー検出
    itemTotal.filter(f=>f.err).map(f=>{
      rtn.result = false;
      rtn.detail.push({
        name: e.name,
        content: f,
      });
    });
  });
  return rtn;
}

// ドキュメントタイトルなどの文字列に使う用
export const getReportTitle = (allState, str='') => {
  const prefix = (allState.com.fprefix)? allState.com.fprefix + '-': '';
  const month = allState.stdDate.slice(0, 7).replace('-', '');
  const service = allState.service;
  const classroom = allState.classroom;
  const svc = cmd.shortWord(service);
  const cls = cmd.shortWord(classroom);
  let attrStr = '';
  const localStarageTitle = getLS(LOCAL_STRAGE_PRINT_TITLE);
  if (localStarageTitle) str = localStarageTitle;
  // 両方指定がある、またはいずれか指定がある
  if (service || classroom) attrStr = '[' + svc + cls + ']';
  if (service && classroom) attrStr = '[' + svc + ' ' + cls + ']';
  const rt = prefix + month + attrStr + ' ' + str;
  return rt;
}

// serviceとclassroomでユーザーの絞り込みを行う 
// 複数サービスに対応
export const getFilteredUsers = (users, service, classroom) => {
  if (!Array.isArray(users)) return [];
  const ret = users.filter(e=>{
    if (!e || typeof e !== 'object') return false;
    const userService = typeof e.service === 'string' ? e.service : '';
    const chkService = (service === '' || userService.includes(service))? true: false;
    const chkClassroom = (isClassroom(e, classroom))?true: false;
    return (chkService && chkClassroom);
  });
  return ret;
};

// 同じdid,classroom,serviceを持つスケジュールで一個でもロックがあったら
// ロック済みのスケジュールとして判断する
// 該当するスケジュールオブジェクトが一個もない場合は全スケジュールを見て
// すべてロック済みならロックする
export const schLocked = (
  schedule, users, thisUser, did, service, classroom
) => {
  let exist = 0;
  let rt = false;
  // 該当日スケジュール舐める
  Object.keys(schedule).filter(e=>e.match(/^UID[0-9]*/)).map(e=>{
    if (!schedule[e]) return false;
    Object.keys(schedule[e]).filter(f=>f.match(/^D2[0-9]*/))
    .filter(f=>f>=did).map(f=>{
    // Object.keys(schedule[e]).filter(f=>f===did).map(f=>{
      // 日毎のスケジュールオブジェクト
      const o = schedule[e][f];
      const uClassroom = cmd.getUser(e, users).classroom; // ユーザー固有の単位
      const cClassroom = (o.classroom)? o.classroom: uClassroom;
      if (service !== '' && service !== o.service)  return false;
      if (classroom !== '' && cClassroom !== classroom) 
        return false;
      // if (classroom !== '' && o.classroom !== classroom) return false;
      exist = true;
      if (o.useResult){
        rt = true;
        console.log('schLocked', e, f);
      }
    })
  });
  if (!exist) rt = false;
  return rt;
}


// 利用されているclassroomの配列を得る
export const getClassrooms = (users) => {
  const u = [...users];
  const valTmp = [];
  u.map(e=>{
    const clr = e.classroom;
    if (!clr) return false;
    if (Array.isArray(clr)) valTmp.push(...clr);
    else if (clr.indexOf(',')) valTmp.push(...clr.split(','));
    else valTmp.push(clr);
  })
  const r = Array.from(new Set(valTmp));
  r.sort((a, b)=>(a < b)? -1: 1);
  return r;
}

// １ユーザーオブジェクトを受け取り所属するclassroomの数を検出する
// export const classroomCount = (thisUser) => { ... } // userUtilsへ移動

// 利用されているすべてのクラスルームを取得する
export const getAllClasrroms = (users) => {
  const clsSet = new Set(users.map(e=>e.classroom));
  return Array.from(clsSet);
}

// MTUが存在するかどうかを調べる
export const getExistMtu = (users) => {
  let svcByUserMax = 0;
  users.forEach(e => {
    const v = classroomCount(e);
    if (v > svcByUserMax) svcByUserMax = v;
  });
  return (svcByUserMax > 1)? true: false;
}

// 引数として与えられたオブジェクト内のネストされたオブジェクトをJSON文字列に変換します。
// 配列や非オブジェクトの値は、再帰的に処理されますが、変更されずにそのまま返されます。
// オブジェクトでない値が渡された場合は、その値をそのまま返します。
const stringifyNestedObjects = (obj) => {
  // objがオブジェクトでない、またはnullの場合、objをそのまま返す
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  // objが配列の場合、配列の各要素に対して再帰的にこの関数を適用
  if (Array.isArray(obj)) {
    return obj.map(item => stringifyNestedObjects(item));
  }

  // オブジェクトの各プロパティに対して処理を適用
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key];
    // 値がオブジェクト（nullや配列を除く）の場合、文字列に変換
    acc[key] = (typeof value === 'object' && value !== null && !Array.isArray(value))
      ? JSON.stringify(value)
      : stringifyNestedObjects(value); // ネストされたオブジェクトにも適用
    return acc;
  }, {});
};

// 違う月のデータを削除する
export const deleteOtherMonthInSchedule = (sch, stdDate) => {
  const didPtn = 'D' + stdDate.replace(/\-/g, '').slice(0, 6);
  Object.keys(sch).filter(e=>e.indexOf('UID') === 0).forEach(e=>{
    Object.keys(sch[e]).filter(f=>f.match(didPtn)).forEach(f=>{
      if (f.indexOf(didPtn) !== 0){
        delete sch[e][f];
        console.log(e, f, 'deleted');
      }
    })
  });
  return sch;
}

// UID999も999もまとめて解釈
export const convUid = (uid) => {
  uid = uid + '';
  const n = uid.replace('UID', '');
  const s = 'UID' + n;
  return {n, s};
}

// transferから加算のあるアイテムをカウントする
// ['学校'. '自宅'] => 2
// ['家族送り*'. '自宅'] => 1
// ['学校'. ''] => 1
export const countTransfer = (t) => {
  if (!Array.isArray(t)) return 0;
  const l = t.filter(e=> e && !e.match(/^\*|\*$/)).length;
  return l;
}

// テンプレートの位置が分かりづらいのでこの関数で取得
// ユーザーテンプレートを使うかどうか判断する
// didは結局使うのやめ
export const getTemplate = (allState, userSch={}, UID) => {
  // ストア初期値からテンプレートを取得
  let service = allState.service;
    // ステイトからユーザーテンプレートの設定値を取得
    // <option value="0">常に利用する</option>
    // <option value="-1">常に利用しない</option>
    // <option value="1">予定入力時のみ保存する</option>

  let userTemplateSetting = allState.com?.ext?.userTemplateSetting;
  userTemplateSetting = parseInt(userTemplateSetting);
  userTemplateSetting = userTemplateSetting? userTemplateSetting: 0;
  
  // ユーザーテンプレートを使うかどうかの判断。
  // didが与えられていないときuserTemplateSetting=1であればtrueになる
  const useUsersTemplate = userTemplateSetting === -1? false: true

  const serviceItems = allState.serviceItems;
  service = service? service: serviceItems[0];
  const storeTemplate = JSON.parse(JSON.stringify(allState.scheduleTemplate[service] ?? {}));
  if (service === HOHOU){
    if (!storeTemplate.weekday.dAddiction.保育訪問){
      storeTemplate.weekday.dAddiction.保育訪問 = '保訪';
    }
    if (!storeTemplate.schoolOff.dAddiction.保育訪問){
      storeTemplate.schoolOff.dAddiction.保育訪問 = '保訪';
    }
    return storeTemplate;
  }
  // ストア comからテンプレート取得
  const {com, users} = allState;
  const comTemplate = cmd.findDeepPath(
    com, ['etc', 'scheduleTemplate', service]
  );
  // usersからテンプレート取得
  const thisUser = cmd.getUser(UID, users);
  let userTemplate = cmd.fdp(thisUser, 'etc.template', {});
  const uTmplKey = Object.keys(userTemplate)[0]; // 未定義の場合はundefined
  // サービスが切り替わっていたら無視
  const inServiceUser = (
    uTmplKey && userTemplate[uTmplKey].service &&
    inService(thisUser.service, userTemplate[uTmplKey].service)
  );
  if (!inServiceUser){
    userTemplate = {};
  }
  let schTmplate = userSch? {...userSch.template}: undefined;
  const sTmplKey = schTmplate? Object.keys(schTmplate)[0]: null;
  const inServiceSch = (
    sTmplKey && schTmplate[sTmplKey].service &&
    inService(thisUser.service, schTmplate[sTmplKey].service)
  );
  if (!inServiceSch){
    schTmplate = {}
  }

  // 時間区分自動設定の取得
  const autoSetting = com?.addiction?.[service]?.時間区分延長支援自動設定;
  const jikankubunAuto = parseInt(autoSetting) >= 1;
  const enchouShienAuto = parseInt(autoSetting) >= 2;

  // テンプレートを設定
  const t1 = comTemplate? comTemplate: storeTemplate;
  // ユーザーテンプレートまたはスケジュール定義済みテンプレートを取得
  const t2 = {...userTemplate, ...schTmplate};
  // 利用するテンプレート
  const scheduleTemplate = (service === HOHOU || useUsersTemplate === false)
  ? {...t1}:  {...t1, ...t2};
  // 時間区分延長支援自動設定
  if (service !== HOHOU){
    Object.keys(scheduleTemplate).forEach(key=>{
      const tmplt = scheduleTemplate[key];
      if (!tmplt.start) return;
      if (!tmplt.dAddiction) tmplt.dAddiction = {};
      const useKubun3 = service === JIHATSU || tmplt.offSchool === 1;
      const t = getJikanKubunAndEnchou(tmplt.start, tmplt.end, useKubun3);
      if (jikankubunAuto && !tmplt.時間区分){
        tmplt.dAddiction.時間区分 = t.区分;
      }
      if (enchouShienAuto && !tmplt.延長支援){
        tmplt.dAddiction.延長支援 = t.延長支援;
      }
    })
  }
  // テンプレートにサービスが付与されていないことを想定
  const usersSvc = thisUser.service;
  const curSvc = (() => {
    if (!usersSvc) return allState.service;
    if (allState.service === HOHOU && usersSvc.includes(HOHOU)) return HOHOU;
    if (!allState.service && usersSvc.includes(HOHOU)) return HOHOU;
    if (usersSvc.includes(HOUDAY)){
      return HOUDAY;
    }
    else if (usersSvc.includes(JIHATSU)){
      return JIHATSU;
    }
    else return usersSvc;
  })();
  
  // 各テンプレートキーにserviceプロパティが存在しない場合は現在のサービス値を設定
  Object.keys(scheduleTemplate).forEach(key => {
    const template = scheduleTemplate[key];
    if (template && typeof template === 'object' && !template.service) {
      template.service = curSvc;
    }
  });
  
  console.log(scheduleTemplate, 'scheduleTemplate');
  return scheduleTemplate;
}

// 最近利用したユーザーを保存する
export const setRecentUser = (uid, len = 3) => {
  // if (!uid && !hno) return false;
  // if (!uid && hno){
  //   const u = users.find(e=>e.hno === hno);
  //   uid = u.uid;
  // }
  if (!uid) return false;
  uid = uid.replace(/[^0-9]/g, '');
  let ru = cmd.getCookeis('ru');
  ru = ru? ru.split(','): [];
  ru = ru.filter(e=>e !== uid);
  ru.unshift(uid);
  if (ru.length > len) ru.pop();
  ru = ru.join(',');
  cmd.setCookeis('ru', ru);
}
// 最近利用したユーザーかどうか
export const isRecentUser = (uid) => {
  if (!uid) return false;
  uid = uid.replace(/[^0-9]/g, '');
  let ru = cmd.getCookeis('ru');
  ru = ru? ru.split(','): [];
  return ru.indexOf(uid) + 1;
}
// 最近利用したユーザーを表示するためのスタイルを提供する
// mode0で背景色の変更
// 別途必要に応じて追加を行う
export const recentUserStyle = (uid, mode = 0) => {
  const r = isRecentUser(uid);
  const ci = [500, 200, 100]
  const c = yellow[ci[r - 1]]
  if (mode === 0 && r){
    return {backgroundColor: c};
  }
  else return {};
}

export const clearRecentUsers = () => {
  cmd.setCookeis('ru', '');
}

// スケジュールが存在するかどうか
export const hasSchedule = (uid, schedule) => {
  const UID = convUid(uid).s;
  const usersSch = schedule[UID];
  const schLen = Object.keys(usersSch).filter(e=>e.match(/^D2[0-9]{7}/)).length;
  return schLen;
}

// スケジュールが一個でもあればtrue
export const hasAnySchedule = (schedule) => {
  // トップレベルのキーが 'UIDxxx' 形式かチェック
  return Object.keys(schedule).some(uidKey => {
    // uidKeyが 'UID' + 任意の数字 形式か確認
    if (/^UID\d+$/.test(uidKey)) {
      const nestedObj = schedule[uidKey];
      // ネストされたキーが 'D2' + 7桁の数字 形式か確認
      return Object.keys(nestedObj).some(d2Key => /^D2\d{7}/.test(d2Key));
    }
    return false;
  });
};

// サービスに該当するか 複数サービス対応用
export const isService = (user, service, serviceWithComma='') => {
  const sstr = user?user.service: serviceWithComma;
  // if (!sstr) console.log(sstr, 'sstr', user?.name, 'user?.name')
  const uSvc = sstr? sstr.split(','): [];
  if (!service) return true;
  else if (uSvc.includes(service)) return true;
  else return false;

}

// selectInputAutoを制御する textfieldのonfocusに設定する
export const handleSelectInputAuto = (e) => {
  const sia = cmd.getUisCookie(cmd.uisCookiePos.selectInputAuto);
  if (sia){
    const node = e.currentTarget;
    node.select();
  }
}

// usersのソートを行う
export const usersSort = (u) => cmd.usersSort(u);

// scheduleからuidsの配列を得る
export const getUidsArray = sch => Object.keys(sch).filter(e=>e.match(/^UID\d+/));
// userごとのスケジュールからdidの配列を得る
export const getDidArray = uSch => Object.keys(uSch).filter(e=>e.match(didPtn));

export const onRenderCallback = (
  id, // 計測対象のコンポーネントのID
  phase, // "mount" または "update"
  actualDuration, // 描画にかかった時間（ミリ秒）
  baseDuration, // 最適化なしで描画にかかる理想的な時間
  startTime, // 描画開始時間
  commitTime, // 描画終了時間
  interactions // 現在のレンダーに含まれているやり取りのセット
) => {
  console.log(`ID: ${id} フェーズ: ${phase} render: ${actualDuration}`);
};
