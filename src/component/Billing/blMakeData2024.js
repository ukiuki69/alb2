  // 計算用のFunctionを提供する
import React, { useEffect, useRef, useState } from 'react';
import * as comMod from '../../commonModule';
import {
  houdySirvice, houdayKasan, chiikiKubun, unitPrice,
  serviceSyubetu, ketteiScode, 
  SOUGEY_SVC_CODE,
  // KATEI_SVC_CODE,
  KESSEKI_SVC_CODE, 
  // KESSEKI_SVC_CODE2,
  // IREN_SVC_CODE,
  // SOUDANSIEN_SVC_CODE,
  SYOKUJI_SVC_CODE,
  jihatsuKasan,
  serviceNameBase,serviceNameBaseHD, jihatsuService,
  hohouService, hohouKasan, SYOKAI_SVC_CODE, DADDICTION_HOHOU, KANKEIRENKEI_SVC_CODE, chiikiKubunAdult,
  KAZOKUSHIEN_SVC_CODE,
  JIGYOUSYO_RENKEI_SVC_CODE,
} from './BlCalcData2024';
import { didPtn, HOUDAY, JIHATSU, HOHOU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import * as amdcm from '../../albCommonModule';
import { inService } from '../../albCommonModule';
// import { 
//   keikakuSoudanAddiction, keikakuSoudanService, syougaiSoudanAddiction, syougaiSoudanService 
// } from './blCalcdataSoudan2024';
import { CALC2024 } from '../../Rev';
import { ExitToApp } from '@material-ui/icons';
import { keikakuSoudanService } from './calcDatas2024/keikakuSoudanService2024';
import { keikakuSoudanAddiction } from './calcDatas2024/keikakuSoudanAddiction2024';
import { syougaiSoudanService } from './calcDatas2024/syougaiSoudanService2024';
import { syougaiSoudanAddiction } from './calcDatas2024/syougaiSoudanAddiction2024';
import { elapsedHours, getSanteJikanFromKubun, getSanteciJikanOneDay } from '../../modules/elapsedTimes';
import { LC2024, manualJichiJosei } from '../../modules/contants';
import { forEach } from 'jszip';
import { getLS } from '../../modules/localStrageOprations';
import { noAuto } from '@fortawesome/fontawesome-svg-core';
import {
  getBaseItemHD_before2510,
  getBaseItemJH_before2510,
  getKasanOneItemJH_before2510,
  getKasanOneItem_before2510,
} from './legacyIcareFunctions';
// 兄弟上限の調整を自動で行う。開始月
export const kyoudaiAutoTyousei = '2022-08-01';
// 兄弟上限管理の計算方法変更日（pkanaとbrosIndexでソート開始）
export const kyoudaiJougen2511 = '2025-11-01';
export const kyoudaiJougen2601 = '2026-01-01';


const ptn = /^D[0-9]+[0-9]+/; // D20xxmmddを検索するためのパターン
const tokubetuItemSc = '63ZZ01'; // 令和３年９月３０日までの上乗せ分（放デイ）
const tokubetuItemScJH = '61ZZ01'; // 令和３年９月３０日までの上乗せ分（放デイ）
const soudanServiceName = [SYOUGAI_SOUDAN, KEIKAKU_SOUDAN];

// // 上限管理のオブジェクト。予め定義しておく
const JOUGEN_KANRI_HD = houdayKasan.filter(e => e.s === '635370')[0];
const JOUGEN_KANRI_JH = jihatsuKasan.filter(e => e.s === '615370')[0];
const JOUGEN_KANRI_HH = hohouKasan.filter(e => e.s === '645370')[0];
export const JOUGEN_KANRI = {
  '放課後等デイサービス': {...JOUGEN_KANRI_HD},
  '児童発達支援':{...JOUGEN_KANRI_JH},
  '保育所等訪問支援': {...JOUGEN_KANRI_HH}
}
// 上限管理加算のサービスコード
// const JOUGEN_KANRI_SVC_CODE = ['635370', '635370'];
// 医療連携体制加算絡みのサービスコードを返す
const iryouRenkei = () => {
  const r = [
    ...houdayKasan.filter(e=>e.name==='医療連携体制加算'),
    ...jihatsuKasan.filter(e=>e.name==='医療連携体制加算')
  ];
  const s = r.map(e=>e.s);
  return s;
}

const houdayRootService = houdySirvice.filter(e=>!e.c.includes('・'));
const jihatuRootService = jihatsuService.filter(e=>!e.c.includes('・'));

const yokohama5Digit = [
  '14100','14101','14102','14103','14104','14105','14106','14107',
  '14108','14109','14110','14111','14112','14113','14114','14115',
  '14116','14117','14118',
]
// 欠席でも計上する加算等の名称
// 2023/10/05 関係機関連携加算を追加
export const kessekiSvc = [
  '欠席時対応加算', '事業所内相談支援加算', '家庭連携加算',
  '特定処遇改善加算', '福祉・介護職員処遇改善加算', '福祉・介護職員処遇改善特別加算',
  '福祉・介護職員等ベースアップ等支援加算','関係機関連携加算','家族支援加算Ⅰ', '家族支援加算Ⅱ',
  '事業所間連携加算', '多職種連携支援加算',
]

// 送迎用のアイテムを準備
export const SOUGEI_ITEMS_HOUDAY = houdayKasan.filter(e=>e.name==='送迎加算設定');
export const SOUGEI_ITEMS_JIHATSU = jihatsuKasan.filter(e=>e.name==='送迎加算設定');



// 横浜市かどうか
// 20250401以降は無効
export const isYokohama = (scode) => {
  if (getLS('stdDate') >= '2025-04-01') return false;
  const v = yokohama5Digit.find(e=>e === scode.slice(0, 5));
  return v !== undefined;
}

// csv作成用 定義する文字列や置換用シンボル
const REC_NO = 'REC_NO';
const REC_CNT = 'REC_CNT';
const JI_NO = 'JI_NO';
const H_NO = 'H_NO'; // 被保険者番号
const JOSEIJICHITAI = 'HOSEIJICHITAI'; // 助成自治体番号
const TOTAL_AMOUNT = 'TOTAL_AMOUNT';  // 費用合計
const TOTAL_COUNT = 'TOTAL_COUNT'     // 件数合計
const TOTAL_BILLED = 'TOTAL_BILLED';  // 国保連請求
const TOTAL_BILLED1 = 'TOTAL_BILLED1';  // 総費用額 自治体請求を含む
const TOTAL_USER_BILLED = 'TOTAL_USER_BILLED';   // 利用者請求
const TOKUBETSU_TAISAKU = 0;   // K112_1 特別対策費
const TOTAL_TANNI = 'TOTAL_TANNI' // 単位数合計
const SRVC_AMOUNT = 'SRVC_AMOUNT';  // サービス毎費用合計
const SRVC_COUNT_TOTAL = 'SRVC_COUNT_TOTAL'     // サービス毎件数合計
const SRVC_BILLED = 'SRVC_BILLED';  // サービス毎国保連請求
const SRVC_USER_BILLED = 'SRVC_USER_BILLED';   // サービス毎利用者請求
const SRVC_TANNI_TOTAL = 'SRVC_TANNI_TOTAL' // サービス毎単位数合計
const SCITY_NO = 'SCITY_NO' // 市区町村番号
const START_DATE = 'START_DATE' // サービス開始日
const END_DATE = 'END_DATE' // サービス終了日
const S_SYUBETSU = 'S_SYUBETSU'; // サービス種別 放デイ63 自発61
const CNT_USED = 'CNT_USED' // ユーザーごとの利用回数
const SRVC_CODE = 'SRVC_CODE'; // サービスコード
const SRVC_TANNI = 'SRVC_TANNI'; // サービス毎の単位数
const SRVC_COUNT = 'SRVC_COUNT'; // サービス提供回数
const SRVC_SANTEI = 'SRVC_SANTEI'; // サービス算定額
// 地域コード
// const CHIKI_CODE = chiikiKubun[com.addiction[service].地域区分];
const CHIKI_CODE = 'CHIKI_CODE';
const JOUGEN = 'JOUGEN' // 上限額
const JOUGEN_JI = 'JOUGEN_JI' // 上限管理事業所
const JOUGEN_RES = 'JOUGEN_RES' // 上限管理結果額
const JOUGEN_GETSU_TYOUSEI = 'JOUGEN_GETSU_TYOUSEI'; // 上限管理結果額
const JOUGEN_KETTEI = 'JOUGEN_KETTEI'; // 上限決定額
const HONNIN_HNO = 'HONNIN_HNO'; // 兄弟のうち最初の利用者の被保険者番号
const HONNIN_NAME = 'HONNIN_NAME'; // 兄弟のうち最初の利用者の名前
const JOUGEN_TYOUSEIGO1 = 'JOUGEN_TYOUSEIGO1'; // 上限調整後金額
const JOUGEN_TYOUSEIGO = 'JOUGEN_TYOUSEIGO'; // 上限調整後金額 ネーミングが混乱中
const JOUGEN_KEKKA = 'JOUGEN_KEKKA' // 上限管理結果のフラグ
const USER_TANNI = 'USER_TANNI' // ユーザーごとの単位数
const NAME = 'NAME' // 利用者の名前半角カナ
const PNAME = 'PNAME' // 保護者の名前半角カナ
const SYUUKEI_BUNRUI = 1 // 集計分類番号 基本1だが重心で2になることも
const GETSUGAKU_TYOUSEI = 'GETSU_TY'; // 上限月額調整額 一割と上限を比較
 // 調整後利用者負担。福祉ソフトでは未設定 
const TYOUSEIGO_USER_BILLED = 'TYOUSEIGO_USER_BILLED';
const JOUGEN_USER_BILLED = 'J_USER_BIL'; // 上限額管理後利用者負担額を設定
const KETTEI_USER_BILLED = 'K_USER_BILLED'// 決定利用者負担額
const KETTEI_TOTAL_BILLED = 'K_TOTAL_BILLED' // 決定給付請求額
const KOUGAKU_KYUUFU = 'KOUGAKU_KYUUFU' // 高額障害児給付費
const TOKUBETSU_TAISAKU_K122 = 'TOKUBETSU_TAISAKU' // 特別対策費
const JICHITAI_JOSEI_SEIKYUU = 'JICHITAI_JOSEI_SEIKYUU' // 自治体助成請求額
const JICHITAI_JOSEI = 'JICHITAI_JOSEI' // 自治体助成分請求
const KETTEI_SRVC_CODE = 'KTTEI_SRVC_CODE' // 決定サービスコード
const KEIYAKU_VOL = 'KEIYAKU_VOL' // 契約量*100
const KEIYAKU_DATE = 'KEIYAKU_DATE' // 契約日
const KEIYAKU_END = 'KEIYAKU_END' // 契約終了日
const KINYUU_BANGOU = 'KINYUU_BANGOU' // 事業者記入欄番号 
const ICHIWARI1 = 'ICHIWARI1' // 一割相当額 よくわからない
const ICHIWARI2 = 'ICHIWARI2' // 一割相当額 よくわからない
const KYUUFU_TANKA = 'KYUUFU_TANKA' // 給付単価。サービス種別と級地で決まる 
const THIS_MONTH = 'THIS_MONTH';
const HEAD_SYUBETU = 'HEAD_SYUBETU'; // ヘッダレコードのレコード種別
// 上限管理ファイルで他事業所の請求額を含めて合算したもの
const ALL_AMOUNT = 'ALL_AMOUNT';
const ALL_RIYOUSHA_FUTAN = 'ALL_RIYOUSHA_FUTAN';
const ALL_KANRIKEKKAGO = 'ALL_KANRIKEKKAGO';
const RIYOUSYA_FUTAN = 'RIYOUSYA_FUTAN';
// 上限管理ファイルで他事業所の調整額=上限値と一割で金額が低い方を合計
const ALL_TYOUSEI = 'ALL_TYOUSEI';
// 上限管理ファイルで他事業所の利用者請求額を合算したもの
const ALL_JOUGEN = 'ALL_JOUGEN';
const KANRIKEKKAGO = 'KANRIKEKKAGO';
const SAKUSEI_KU = 'SAKUSEI_KU'; // 作成区分
const LINE_NO = 'LINE_NO'; // 項番
const KYO_JI = 'KYO_JI';
// 計画相談、障害児相談用
const MONITER_DATE = 'MONITER_DATE'; // モニタリング日
const SRVC_TEKIYOU = ''; // サービスコードごとの適用

// 事業所内相談支援
// const SOUDAN_SVC_CODE = ['636805',];


// レコードのテンプレート
const headRec = [ // ヘッダレコード
  1, REC_NO, 0, REC_CNT, HEAD_SYUBETU, 0, JI_NO, 0, 1, THIS_MONTH, 0
];

const jgKihonK411_1 = [ // 上限管理基本
  2, REC_NO, 'K411', '01', THIS_MONTH, SAKUSEI_KU, SCITY_NO, 
  JI_NO, H_NO, PNAME, NAME,
  JOUGEN, JOUGEN_KEKKA, ALL_AMOUNT, ALL_TYOUSEI, ALL_JOUGEN,
];

const jgMeisaiK411_2 = [ // 上限管理明細
  2, REC_NO, 'K411', '02', THIS_MONTH, SCITY_NO, JI_NO, H_NO, LINE_NO,
  KYO_JI, TOTAL_AMOUNT, JOUGEN_TYOUSEIGO, JOUGEN_KETTEI
]

const kihonK112_1 = [ // K112基本 市区町村ごと合計行
  2, REC_NO, 'K112', '01', THIS_MONTH, SCITY_NO, JI_NO, 
  TOTAL_BILLED1, // 請求金額 
  TOTAL_COUNT, // 件数
  TOTAL_TANNI, // 単位数
  TOTAL_AMOUNT, // 費用合計
  TOTAL_BILLED, // 給付費請求額
  TOKUBETSU_TAISAKU, // 特別対策費請求額
  TOTAL_USER_BILLED, // 利用者負担額
  JICHITAI_JOSEI, // 自治体助成額
  0, 0, 0, // 小計特定入所障害児障害児通所給付費 食費等給付費・ 高額 * 1
  // 以下は上記と同じ項目 *1がある場合は合算されるっぽい
  TOTAL_COUNT, TOTAL_TANNI, TOTAL_AMOUNT, TOTAL_BILLED, TOKUBETSU_TAISAKU,
  TOTAL_USER_BILLED, JICHITAI_JOSEI,
];
const meisaiK112_2 = [ // K112明細 サービス種別毎の明細。自発だと別レコード
  2, REC_NO, 'K112', '02', THIS_MONTH, SCITY_NO, JI_NO, 1, S_SYUBETSU,
  SRVC_COUNT_TOTAL, SRVC_TANNI_TOTAL, SRVC_AMOUNT, SRVC_BILLED, 0,
  SRVC_USER_BILLED, JICHITAI_JOSEI,
];
const kihonK122_1 = [ // k122基本レコード
  2, REC_NO, 'K122', '01', THIS_MONTH, SCITY_NO, JI_NO, H_NO, 
  JOSEIJICHITAI, // 助成自治体番号
  PNAME, NAME,
  CHIKI_CODE, '', JOUGEN, '', '', JOUGEN_JI, JOUGEN_KEKKA, JOUGEN_RES,
  '', '', USER_TANNI, TOTAL_AMOUNT, 
  JOUGEN_GETSU_TYOUSEI, // 上限月額調整額
  '', '', 
  JOUGEN_TYOUSEIGO1, //上限調整後金額  
  JOUGEN_TYOUSEIGO, // 上限調整後金額 -> 誤記だがそのまま使う。正解は上限管理後金額
  JOUGEN_KETTEI, // 上限決定後
  TOTAL_BILLED, // 給付費
  KOUGAKU_KYUUFU, 
  TOKUBETSU_TAISAKU_K122,
  JICHITAI_JOSEI_SEIKYUU,
  '','','','',
]
const nissuuK122_2 = [ // k122日数情報レコード
  2, REC_NO, 'K122', '02', THIS_MONTH, SCITY_NO, JI_NO, H_NO, S_SYUBETSU,
  START_DATE, END_DATE, CNT_USED, '', '', 
];

const serviceMeisaiK122_3 = [ // k122 明細レコード サービスコードを記載
  2, REC_NO, 'K122', '03', THIS_MONTH, SCITY_NO, JI_NO, H_NO, SRVC_CODE,
  SRVC_TANNI, SRVC_COUNT, SRVC_SANTEI, '', 
]

const syuukeiK122_4 = [
  2, REC_NO, 'K122', '04', THIS_MONTH, SCITY_NO, JI_NO, H_NO, S_SYUBETSU,
  SYUUKEI_BUNRUI,
  SRVC_COUNT, // サービス回数 
  USER_TANNI, // 単位数
  KYUUFU_TANKA, // 給付単価。サービス種別と級地で決まる 
  0, // 給付率 0固定
  TOTAL_BILLED, // 単位数✕給付単価
  ICHIWARI1, // 一割相当額
  ICHIWARI2, // 一割相当額、都道府県が絡んだり自発で多子だと変わる？
  GETSUGAKU_TYOUSEI, // 上限月額調整額 一割と上限を比較
  '', '', // 未設定項目＊２
  TYOUSEIGO_USER_BILLED, // 調整後利用者負担。複数サービスのときのみ出力されるっぽい
  JOUGEN_USER_BILLED, // 上限額管理後利用者負担額を設定
  KETTEI_USER_BILLED,// 決定利用者負担額
  KETTEI_TOTAL_BILLED, // 決定給付請求額
  KOUGAKU_KYUUFU,// 高額給付費
  TOKUBETSU_TAISAKU_K122, // 特別対策費
  JICHITAI_JOSEI, // 自治体助成
  '', '', '', '', '', '', '', '', 
]

const keiyakuK122_5 = [ // 契約情報レコード
  2, REC_NO, 'K122', '05', THIS_MONTH, SCITY_NO, JI_NO, H_NO,
  KETTEI_SRVC_CODE, // 決定サービスコード
  KEIYAKU_VOL, // 契約量*100
  KEIYAKU_DATE, // 契約日
  KEIYAKU_END, // 契約終了日
  KINYUU_BANGOU, // 事業者記入欄番号 
];
const endRecord = [
  3, REC_NO
]
// 計画相談請求基本 市区町村ごとに作成
const keikakuSoudanSeikyuuJ312_1 = [
  2, REC_NO, 'J312', '01', THIS_MONTH, SCITY_NO, JI_NO, 
  TOTAL_COUNT, // 市区町村ごとの利用者人数
  CHIKI_CODE, TOTAL_AMOUNT, KYUUFU_TANKA
];
// 計画相談請求明細 利用者ごとに作成
const keikakuSoudanSeikyuuJ312_2 = [
  2, REC_NO, 'J312', '02', THIS_MONTH, SCITY_NO, JI_NO, 
  LINE_NO, // 市区町村ごとの利用者通番
  H_NO, PNAME, NAME, 
  MONITER_DATE, // 提供月の1日を入力 ex.20230401
  '520000',
  TOTAL_TANNI, TOTAL_AMOUNT, KYUUFU_TANKA
];

// 計画相談サービス情報 サービスコードごとに作成
const keikakuSoudanSeikyuuJ312_3 = [
  2, REC_NO, 'J312', '03', THIS_MONTH, SCITY_NO, JI_NO, H_NO,
  SRVC_CODE, SRVC_TANNI, SRVC_COUNT, SRVC_TANNI_TOTAL, 
  SRVC_TEKIYOU // 特に何も出力しないみたい 最初から''を定義済み
];

// 障害児相談支援のレコード雛形は計画相談からコピーして使う
const syougaiSoudanSeikyuuK311_1 = [...keikakuSoudanSeikyuuJ312_1];
const syougaiSoudanSeikyuuK311_2 = [...keikakuSoudanSeikyuuJ312_2];
const syougaiSoudanSeikyuuK311_3 = [...keikakuSoudanSeikyuuJ312_3];
// 違うところだけ変更する
[syougaiSoudanSeikyuuK311_1,syougaiSoudanSeikyuuK311_2,syougaiSoudanSeikyuuK311_3].forEach(tmpl=>{
  tmpl.forEach((e, i, arr)=>{
    if (e === 'J312') arr[i] = 'K311';
    if (e === '520000') arr[i] = '550000';
  })
})

const zero2blank = (v) => (v === 0)? '': v;
const fdp = (obj, path, notfound=null) => comMod.findDeepPath(obj, path, notfound);

// サービスアイテムまたはコードからサービス名を得る
export const getSvcNameByCd = (cd) => {
  if (comMod.typeOf(cd) === 'object'){
    cd = cd.s;
  }
  cd = cd + ''; // intで入ってくることがある
  cd = cd.slice(0, 2);
  const svcs = [
    {s: '61', n: '児童発達支援', },
    {s: '63', n: '放課後等デイサービス', },
    {s: '64', n: '保育所等訪問支援', },
    {s: '55', n: SYOUGAI_SOUDAN},
    {s: '52', n: KEIKAKU_SOUDAN},
  ]
  const m = svcs.find(e=>e.s === cd);
  if (m) return m.n;
  else return '未定義のサービス'
}

// 決定サービスコードの取得
// 医療ケアと障害種別を考慮する。
// 2023/02/21複数サービス対応のためにサービスのみ別パラメータとして与える
// 2023/04/10
// 医療的ケア児の決定サービスコードは加算が発生しなくても変更になることがわかった。
// 新たにusersにicaretypeを付与してあるのでそこから確認を行う
// 強度行動支援も決定サービスコードが変わるらしい
const getKetteiSeriviceCode = (prms) => {
  const {uid, users, schedule, service} = prms;
  const userType = comMod.getUser(uid, users).type;
  let usersIcare = comMod.getUser(uid, users).icareType;
  usersIcare = usersIcare? usersIcare.replace(/[^0-9]/g, ''): 0;
  const uService = service;

  let selected = ketteiScode.filter(e=>e.service === uService);
  selected = selected.filter(e=>e.iCare === parseInt(usersIcare));
  selected = selected.filter(e=>e.type === userType);
  if (!selected.length){
    return ('000000')
  }
  else{
    return (selected[0].kettei);
  }
}
// 処遇改善と特別加算のサービスコードを取得する
const getSvcCdSyoguuTokubetu = () => {
  const a = houdayKasan.filter(e=>['kihongensan', 'syoguu'].includes(e.method)).map(e=>e.s);
  const b = jihatsuKasan.filter(e=>['kihongensan', 'syoguu'].includes(e.method)).map(e=>e.s);
  const c = hohouKasan.filter(e=>['kihongensan', 'syoguu'].includes(e.method)).map(e=>e.s);
  return [...a, ...b, ...c];
}

export const svcCnt = (svcsWithComma) => (svcsWithComma.split(',').length);
// 複数サービスの場合放デイ児発を返す関数
export const getPriorityService = (svcsWithComma) => {
  if (inService(svcsWithComma, HOUDAY)) return HOUDAY;
  if (inService(svcsWithComma, JIHATSU)) return JIHATSU;
  if (inService(svcsWithComma, HOHOU)) return HOHOU;
}


// 加算などのオブジェクトからサービスコードのキーになる文字列を配列にして返す
// 配列に格納される文字
// 放デイ
// 開減１,開減２,拘減,人欠,人欠２,責減,責減２,定超,評減,未計画,未計画２,有資格X
// 児発
// 評価減,開所減１,開所減２,未計画,未計画２,地公体,定超,人欠,人欠２,責減,責減２,
// 放デイと児発で微妙に表現が違う。
// 放デイの表現で統一して児発は後から内容を変更する
// こいつらが違う-> 評価減,開所減１,開所減２
export const getKeyStrOfServiceItems = (adc, offSchool) => {
  const rt = [];
  const targetKey = [
    '開所時間減算',
    '身体拘束廃止未実施減算',
    'サービス提供職員欠如減算',
    '児童発達支援管理責任者欠如減算',
    '定員超過利用減算',
    '自己評価結果等未公表減算',
    '通所支援計画未作成減算',
    '児童指導員配置加算',
    '地方公共団体',
    '訪問支援員特別加算',
    '支援プログラム未公表減算',
  ];
  const pi = (v) => {
    if (isNaN(v)) return "";
    else return parseInt(v);
  }
  Object.keys(adc).map(e => {
    if (targetKey.indexOf(e) === -1) return false;
    // 開所時間減算は休日利用だけ該当
    if (e === '開所時間減算' && adc[e] === '4時間未満' && offSchool)
      rt.push('開減１・');
    if (e === '開所時間減算' && adc[e] === '4時間以上6時間未満' && offSchool)
      rt.push('開減２・');
    // 2021削除
    // if (e === '身体拘束廃止未実施減算' && pi(adc[e]) === 1)
    //   rt.push('拘減・');
    if (e === 'サービス提供職員欠如減算' && adc[e] === '二ヶ月まで')
      rt.push('人欠・');
    if (e === 'サービス提供職員欠如減算' && adc[e] === '三ヶ月以上')
      rt.push('人欠２・');
    if (e === '児童発達支援管理責任者欠如減算' && adc[e] === '五ヶ月未満')
      rt.push('責欠・');
    if (e === '児童発達支援管理責任者欠如減算' && adc[e] === '五ヶ月以上')
      rt.push('責欠２・');
    if (e === '定員超過利用減算' && pi(adc[e]) === 1)
      rt.push('定超・');
      if (e === '自己評価結果等未公表減算' && pi(adc[e]) === 1)
      rt.push('評減・');
    if (e === '支援プログラム未公表減算' && pi(adc[e]) === 1)
      rt.push('支減・');
    if (e === '通所支援計画未作成減算' && adc[e] === '3ヶ月未満')
      rt.push('未計画・');
    if (e === '通所支援計画未作成減算' && adc[e] === '3ヶ月以上')
      rt.push('未計画２・');
    if (e === '地方公共団体' && pi(adc[e]) === 1)
      rt.push('地公体・');
    if (e === '訪問支援員特別加算' && pi(adc[e]) === 1){
      rt.push('専門職員')
    }
  });
  return rt;
}

// 医療的ケアを細雨要するかどうかを判定する。個別判定に対応するため。
const resolveTrueIcare = (addiction, usersIcare) => (
  (addiction.医療ケア児基本報酬区分 === usersIcare || (usersIcare && addiction.医療的ケア児基本報酬))
    ? usersIcare
    : false
);
const resolveTrueIcareEnchou = (addiction, usersIcare) => (
  (addiction.医療ケア児基本報酬区分 === usersIcare || (usersIcare && addiction.医療的ケア児延長支援))
    ? usersIcare
    : false
);


// 配列から特定の文字列を検索して置換する
// const elmRep = (a, str, value) => {
//   const ndx = a.indexOf(str);
//   if (ndx === -1) return false;
//   a[ndx] = value;
//   return true;
// }
// 要素が複数あったときにも対応
const elmRep = (a, str, value) => {
  while (true){
    let ndx = a.indexOf(str);
    if (ndx === -1) return false;
    a[ndx] = value;
  }
}

// *を除去するヘルパー関数（CSV出力用）
const removeAsterisk = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/\*/g, '');
}

// 配列の最後の配列から特定の文字を検索して置換する
const erl = (a, str, value) =>{
  // SCITY_NO, JOSEIJICHITAI, KYO_JI の場合は*を除去
  if (str === SCITY_NO || str === JOSEIJICHITAI || str === KYO_JI) {
    value = removeAsterisk(value);
  }
  elmRep(a[a.length - 1], str, value);
}

// 18歳以上の処理を行う
const convNameOver18 = (schTmp, users) => {
  Object.keys(schTmp).forEach(e=>{
    const u = comMod.getUser(e, users);
    const v = fdp(u, 'etc.over18'); // etcの設定値
    if ((u.age >= 18 && !v) || v === '本人'){
      const name = schTmp[e].name;
      const kana = schTmp[e].kana;
      schTmp[e].pkana = kana;
      schTmp[e].pname = name;
      schTmp[e].name = '';
      schTmp[e].kana = '';
      console.log(name, ' is over18.')
    }
  });
}

// サービスコード表のリストと施設の定員を受け取る
// リストに記載されている定員から適切な定員を求めて返す
export const getMatchedCapacity = (lst, teiin) => {
  // 定員のリストを求めて昇順にソートする
  const capLst = Array.from(
    new Set(lst.map(e => e.cap ? parseInt(e.cap) : parseInt(e?.opt?.cap) ?? 0))
  ).sort((a, b) => a - b);
  // teiin以上の定員の候補のみを取り出す
  const t = capLst.filter(e => e >= teiin);
  // tが空でなければ、teiin以上の最小の定員を返す。なければ、capLstの先頭を返す。
  const u = t.length ? Math.min(...t) : capLst[0];
  return u;
}

// 加算アイテムを特定するためのローダー
// pTypeはもともとのユーザーのタイプが与えられることを想定している。
// 施設のパラメータにより重心や難聴児を受け入れるか判断を行う
// kessekiSvcに定義されているオブジェクトは欠席時でも処理を行う
const getKasanItem = (prms) => {
  const {
    offSchool, absence, uService, thisService,
    user, uid, did, 
  } = prms;
  // console.log(user, uid, 'user, uid');

  // const getKasanItemPrms = {
  //   addiction: o.dAddiction,
  //   offSchool: o.offSchool,
  //   absence: o.absence,
  //   uService,
  //   thisService: o.service,
  //   user:thisUser, did: e,
  // }

  const addiction = {...prms.addiction}; // このオブジェクトは操作するのでコピーしておく
  const teiin = addiction.定員;
  const type = user?.type;
  
  let service;
  if (svcCnt(uService) === 1) service = uService;
  else if (thisService) service = thisService;
  else if (inService(uService, HOUDAY)) service = HOUDAY;
  else if (inService(uService, JIHATSU)) service = JIHATSU;
  else service = uService;

  const kasanNames = getKasanUniqName();
  const hohouKasanNames = Array.from(new Set(hohouKasan.map(e=>e.name)));
  const soudanKasanNames = getKasanUniqNameSoudan();
  const rt = [];
  // 加算としての保訪を指定したときにこのアイテムが邪魔になるので削除
  Object.keys(addiction).map(e => {
    // 欠席指定がある場合、欠席対応加算以外は無視する
    if (absence && kessekiSvc.indexOf(e) === -1)  return false;
    // 対象外の値は読み飛ばし
    if (kasanNames.indexOf(e.replace(/_+$/, '')) === -1) return false;
    if (e === '送迎加算Ⅰ一定条件') return false;
    let thisItem = {}
    let hohouKasanItem = false;
    // 強度行動障害児支援加算９０日以内の処理
    const k90 = '強度行動障害児支援加算９０日以内'
    if (e === k90 && addiction[e]){
      const v = addiction[e];
      if (v.match(/^\d{4}-\d{2}-\d{2}$/)){
        const curDate = comMod.formatDate(comMod.convDid(did), 'YYYY-MM-DD');
        if (curDate <= v) {
          addiction[e] = '1';
        }
        else{
          addiction[e] = '-1';
          return false; // 無効化されたので処理を中断
        }
      }
    }
    // 加算として保訪の基本サービスが設定されているときの処理
    if (service === '放課後等デイサービス'){
      // 保訪専用のアイテムをスキップ
      if (DADDICTION_HOHOU.includes(e)) return false;
      thisItem = getKasanOneItem(e, addiction, offSchool, user);
    }
    else if (service === '児童発達支援'){
      if (DADDICTION_HOHOU.includes(e)) return false;
      thisItem = getKasanOneItemJH(e, addiction, user);
    }
    else if (service === '保育所等訪問支援'){
      // 保訪の読み飛ばし
      if (!hohouKasanNames.includes(e)) return false;
      thisItem = getKasanOneItemHH(e, addiction, type);
    }
    else if (soudanServiceName.includes(service)){
      if (!soudanKasanNames.includes(e)) return false;
      thisItem = getKasanOneItemSoudan(e, addiction, service);
    }
    // if (thisUser.service.includes(HOHOU) && '保育訪問' in addiction){
    //   console.log('hohou as kasan');
    //   if (!hohouKasanNames.includes(e)) return false;
    //   if (!kasanWithhouhouAsService.includes(e)) return false;
    //   hohouKasanItem = getKasanOneItemHH(e, addiction, type);
    // }

    if (!thisItem || thisItem?.err){
      thisItem.userName = user?.name;
      thisItem.service = service;
      thisItem.uid = uid;
      console.log(thisItem, 'errItem');
    }
    // エラーではないがitem設定しないパターン（看護師加配で重身以外）を考慮
    if (thisItem && Object.keys(thisItem).length){
      rt.push(thisItem);
    }
    // 実際にここで設定されるのは初回加算のみ
    // if (hohouKasanItem) rt.push(hohouKasanItem);
  });
  return rt;
}



const getBaseItemHD = (addiction, offSchool, absence, user) => {
  // 2025-10-01以前は古いロジックを使用
  const stdDate = getLS('stdDate');
  if (stdDate && stdDate <= '2025-10-01') {
    return getBaseItemHD_before2510(addiction, offSchool, absence, user);
  }
  
  const type = user.type;
  // 重症心身障害児として算定対象
  const isJuushin = addiction.重症心身型 === '1' && type === '重症心身障害児';
  const kijunGaitou = addiction.基準該当放 === '1';
  const kyouseiService = addiction.共生型サービス === '1';
  if (absence)  return null // 欠席の処理
  // 時間区分未設定は除外。重心はそのまま通す
  if (addiction.時間区分 === undefined && !isJuushin && !kyouseiService && !kijunGaitou) 
    return null;
  if (addiction.定員 === undefined) return null;
  const teiin = parseInt(addiction.定員);
  // 加算オブジェクトに対応した文字配列を取得する
  const keyStrs = getKeyStrOfServiceItems(addiction, offSchool);
  let lst;
  if (keyStrs.length){
    lst = [...houdySirvice];
  }
  else{
    lst = [...houdayRootService];
  }
  if (kyouseiService){
    lst = lst.filter(e=>e.c.includes('共生型'));
  }
  if (kijunGaitou){
    lst = lst.filter(e=>e.c.includes('基準該当'));
  }
  if (kyouseiService || kijunGaitou){
    lst = lst.filter(e=>e.d === parseInt(offSchool));
    // 末尾の・削除
    keyStrs.forEach((e, i)=>{keyStrs[i] = e.replace(/・$/, '')})
    keyStrs.map(keyStr=>{
      lst = lst.filter(f=>f.c.split('・').includes(keyStr));
    })
    return lst[0];
  }

  const usersIcare = user.icareType?.replace(/\D/g, '') ?? '';
  const trueIcare = resolveTrueIcare(addiction, usersIcare);
  // 現時点ではこれらを最初に除外する
  lst = lst.filter(e=>!e.c.includes('共生型') && !e.c.includes('基準該当'));
  // 障害児タイプによる絞り込み
  lst = lst.filter(e=>{
    if (isJuushin){
      return e.trg === '重症心身障害児'
    }
    else return e.trg === '障害児'
  })
  // 医療的ケア児による絞り込み
  if (trueIcare){
    lst = lst.filter(e=>
      (parseInt(trueIcare) === e.icare)
    )
  }
  else {
    lst = lst.filter(e=>!e.icare)

  }
  // 時間区分による絞り込み
  lst = lst.filter(e=>
    e.ku === parseInt(addiction.時間区分) || !e.ku
  )
  // 休日・平日 重心のみ存在する
  if (isJuushin){
    lst = lst.filter(e=>e.d === parseInt(offSchool))
  }
  const matchedCap = getMatchedCapacity(lst, teiin);
  lst = lst.filter(e=>e.cap === matchedCap);

  // 全てのキーオブジェクトに対して絞り込みを行う
  // getBaseItemHDの中黒「・」の扱いが不正だったので修正
  keyStrs.map(e => {
    lst = lst.filter(f => (f.c + '・').indexOf(e) > -1);
  });
  // 要素数のカウント最小値を取得
  const elmCnt = lst.map(e=>e.c.split('・').length);
  const elmCntMin = Math.min(...elmCnt);
  // 一番少ないやつを取得
  lst = lst.filter(e=>e.c.split('・').length === elmCntMin);
  // ここで基本1件になるはず
  return lst[0];
}
const getBaseItemJH = (addiction, absence, user) => {
  // 2025-10-01以前は古いロジックを使用
  const stdDate = getLS('stdDate');
  if (stdDate && stdDate <= '2025-10-01') {
    return getBaseItemJH_before2510(addiction, absence, user);
  }
  
  if (absence)  return null;
  if (addiction.定員 === undefined) return null;
  const teiin = parseInt(addiction.定員);
  const type = user.type;
  const isJuushin = addiction.重症心身型 === '1' && type === '重症心身障害児';
  const kijunGaitou = addiction.基準該当;
  const kyouseiService = addiction.共生型サービス === '1';
  const notUseJiKubun = (isJuushin || kijunGaitou || kyouseiService);
  if (addiction.時間区分 === undefined && !notUseJiKubun) return null;
  const usersIcare = user.icareType?.replace(/\D/g, '') ?? '';
  const trueIcare = resolveTrueIcare(addiction, usersIcare);
  let keyStrs = getKeyStrOfServiceItems(addiction, true);
  // 放デイと児発で表現が違うので訂正する
  const jhConv = [
    ['評減・', '評価減・'],
    ['開減１・', '開所減１・'],
    ['開減２・', '開所減２・'],
  ];
  keyStrs.forEach((e, i)=>{
    jhConv.forEach(f=>{
      if (e === f[0]){
        keyStrs[i] = f[1];
      }
    })
  })

  let lst;
  if (keyStrs.length){
    lst = [...jihatsuService]
  }
  else{
    lst = [...jihatuRootService]
  }
  if (kyouseiService){
    lst = lst.filter(e=>e.c.includes('共生型'));
  }
  if (kijunGaitou){
    lst = lst.filter(e=>e.c.includes(kijunGaitou));
  }

  if (kyouseiService || kijunGaitou){
    // 末尾の・削除
    keyStrs.forEach((e, i)=>{keyStrs[i] = e.replace(/・$/, '')})
    keyStrs.map(keyStr=>{
      lst = lst.filter(f=>f.c.split('・').includes(keyStr));
    })
    return lst[0];
  }
    
  // lst = [...jihatsuService];
  lst = lst.filter(e=>!e.c.includes('共生型') && !e.c.includes('基準該当'));
  // 現時点では除外する
  // 障害児タイプによる絞り込み
  if (addiction.重症心身型 === '1' && type === '重症心身障害児'){
    lst = lst.filter(e=>e.trg !== 'syo')
  }
  else {
    lst = lst.filter(e=>e.trg !== 'juu')
  }
  // 医療的ケア児による絞り込み
  if (trueIcare){
    lst = lst.filter(e=>
      (parseInt(trueIcare) === e.icare)
    )
  }
  else {
    lst = lst.filter(e=>!e.icare)
  }
  // 児童発達支援センターによるフィルタ
  if (addiction.児童発達支援センター){
    lst = lst.filter(e=>e.fac === 'ce')
  }
  else {
    lst = lst.filter(e=>e.fac !== 'ce')
  }
  if (addiction.就学区分 && !isJuushin && !addiction.児童発達支援センター){
    lst = lst.filter(e=>e.pres === (addiction.就学区分 === '1'? 'mi': 'not'))
  }
  // 時間区分による絞り込み
  lst = lst.filter(e=>
    e.ku === parseInt(addiction.時間区分) || !e.ku
  )
  if (addiction.児童発達支援センター && type === '難聴児'){
    lst = lst.filter(e=>e.trg === 'nan')
  }
  else{
    lst = lst.filter(e=>e.trg !== 'nan')

  }
  const matchedCap = getMatchedCapacity(lst, teiin);
  lst = lst.filter(e=>e.cap === matchedCap);

  
  // keyStrsの末尾の・削除
  keyStrs.forEach((e, i)=>{keyStrs[i] = e.replace(/・$/, '')})

  keyStrs.forEach(e=>{
    lst = lst.filter(f => f.c.split('・').includes(e));
  });

  // 人欠・責任者欠があるかどうか
  // const jinketsuSekiketsu = keyStrs.filter(e=>e && e.match(/[人責]欠*/));
  // const tweekNb = [
  //   ['児発１５','児発１'],
  //   ['児発１６','児発２'],
  //   ['児発１７','児発３'],
  //   ['児発１８','児発４'],
  //   ['児発１９','児発５'],
  //   ['児発２０','児発６'],
  // ];

  // 要素数のカウント最小値を取得
  const elmCnt = lst.map(e=>e.c.split('・').length);
  const elmCntMin = Math.min(...elmCnt);
  // 一番少ないやつを取得
  lst = lst.filter(e=>e.c.split('・').length === elmCntMin);
  
  return lst[0];
}
// 保訪用基本アイテム取得
const getBaseItemHH = (addiction, absence) => {
  const nameBase = '保訪';
  if (absence)  return null // 欠席の処理
  const keyStrs = getKeyStrOfServiceItems(addiction, false);
  // keyStrsの末尾の・削除
  keyStrs.forEach((e, i)=>{keyStrs[i] = e.replace(/・$/, '')})
  // 保訪と放デイで表現が違うところ
  const hhConv = [
    ['未計画', '未計画１'],
    ['責欠', '責欠１'],
  ];
  keyStrs.forEach((e, i)=>{
    if (hhConv.find(f => f[0] === e)){
      keyStrs[i] = hhConv.find(f => f[0] === e)[1];
    }
  })
  // namebaseで絞り込み
  let thisService = hohouService.filter(e=>e.c.split('・').includes(nameBase));
  // addiction.保育訪問で絞り込み
  // 保育訪問の文字列が入っていることあり訂正を追加 2023/08/01
  const addicHohou = addiction.保育訪問 === '保育訪問'? '保訪': addiction.保育訪問;
  if (addicHohou){
    thisService = hohouService.filter(e=>e.c.split('・').includes(addicHohou));
  }

  // keyStrsで絞り込み
  keyStrs.forEach(e=>{
    thisService = thisService.filter(f => f.c.split('・').includes(e));
  });
  // 絞り込んだ内容を要素数が少ない順にソート　保訪・専門職員・未計画１など
  thisService.sort((a, b)=>(a.c.split('・').length - b.c.split('・').length));
  // 要素数が一番少ないサービスがビンゴ
  return thisService[0];
}

// 計画相談支援と障害児相談支援のbaseItemローダ
const getBaseItemSoudan = (addiction, service) => {
  const targetSvc = [KEIKAKU_SOUDAN, SYOUGAI_SOUDAN];
  if (!targetSvc.includes(service)) return [];
  const svcList = service === KEIKAKU_SOUDAN
  ? keikakuSoudanService: syougaiSoudanService;
  const baseNameLst = ['サービス利用支援', '継続サービス利用支援'];
  const opt = [
    '強化型支援Ⅰ','強化型支援Ⅱ','強化型支援Ⅲ','強化型支援Ⅳ','支援Ⅰ','支援Ⅱ',
    '居宅減算Ⅰ','居宅減算Ⅱ','予防減算',
  ]
  const TAISEI = '相談支援体制';
  const GENSAN = '介護保険重複減算';
  // 体制支援未指定の場合はデータ出力しない
  if (!Object.keys(addiction).includes(TAISEI)) return [];
  const rtnSvc = [];
  baseNameLst.forEach(name=>{
    let tSvcLst = [...svcList];
    if (Object.keys(addiction).includes(name)){
      tSvcLst = tSvcLst.filter(e=>e.name === name);
    }
    else return false;
    if (Number(addiction[name]) === 2){
      tSvcLst = tSvcLst.filter(e=>e.opt.split('・').includes('支援Ⅱ'));
    }
    if (tSvcLst.length === 1){
      rtnSvc.push(tSvcLst[0]);
      return;
    };
    // 支援体制による絞り込み。
    if (Object.keys(addiction).includes(TAISEI)){
      tSvcLst = tSvcLst.filter(e=>e.opt.split('・').includes(addiction[TAISEI]));
    }
    if (Object.keys(addiction).includes(GENSAN)){
      tSvcLst = tSvcLst.filter(e=>e.opt.split('・').includes(addiction[GENSAN]));
    }
    // 候補が２つある場合、・の数を数えて少ない方を採用
    tSvcLst.sort((a, b)=>(a.opt.split('・').length < b.opt.split('・').length? -1: 1));
    rtnSvc.push(tSvcLst[0]);
  })
  return rtnSvc;
}


// ベースアイテム所得用のローダ
// 放デイと児発で処理を切り替える
const getBaseItem = (addiction, offSchool, absence, uService, thisService, user) => {
  // サービスの特定
  // 複数サービスの場合はdidオブジェクトに含まれるサービスを優先して使う
  // 複数サービスでdid objにサービスが含まれていない場合は放デイか児発いずれかを使用する
  let service;
  if (svcCnt === 1) service = uService;
  else if (thisService) service = thisService;
  else if (inService(uService, HOUDAY)) service = HOUDAY;
  else if (inService(uService, JIHATSU)) service = JIHATSU;
  else service = uService;
  if (service === HOUDAY){
    return(
      getBaseItemHD(addiction, offSchool, absence, user)
    );
  }
  else if (service === JIHATSU){
    return(
      getBaseItemJH(addiction, absence, user)
    );
  }
  else if (service === HOHOU){
    return getBaseItemHH(addiction, absence);
  }
  else if ([KEIKAKU_SOUDAN, SYOUGAI_SOUDAN].includes(service)){
    return getBaseItemSoudan(addiction, service);
  }
  else return false;
}


// ベースアイテム所得用のローダ
// 放デイと児発で処理を切り替える
const getBaseItemHohouAsKasan = (
    addiction, offSchool, absence, uService, thisService, comAdicHH
) => {
  let service;
  if (uService && svcCnt(uService) === 1) service = uService;
  else if (thisService) service = thisService;
  else if (inService(uService, HOUDAY)) service = HOUDAY;
  else if (inService(uService, JIHATSU)) service = JIHATSU;
  // 加算として記述されている保訪を取得する用
  const hohouAsKasan = (
    (service === HOUDAY || service === JIHATSU) &&
    inService(uService, HOHOU) &&
    addiction?.保育訪問
  )

  if (hohouAsKasan){
    return getBaseItemHH({...comAdicHH, ...addiction}, absence);
  }
  else return false;
}


// 送迎を求める。児発
// dObj = 日付ごとのschTmpのオブジェクト
const getTrasferItemJH = (dObj, UID, users, addiction) => {
  const thisUser = comMod.getUser(UID, users);
  const type = thisUser.type; // 重症心身障害児、難聴など
  const absence = dObj.absence;
  const transfer = dObj.transfer;
  const juushinGata = dObj.dAddiction.重症心身型;
  const itteiJouken = parseInt(addiction.送迎加算Ⅰ一定条件) === 1;

  const rt = [];
  // 欠席や送迎なし
  if (!transfer) return rt;
  if (!transfer.length) return rt;
  if (absence) return rt;
  if (type === '重症心身障害児' && juushinGata){
    if (transfer[0]){
      rt.push(jihatsuKasan.find(e=>e.s==="616241"));
    }
    if (transfer[1]){
      rt.push(jihatsuKasan.find(e=>e.s==="616241"));
    }
  }
  else{
    if (transfer[0]){
      rt.push(jihatsuKasan.find(e=>e.s==="616240"));
    }
    if (transfer[1]){
      rt.push(jihatsuKasan.find(e=>e.s==="616240"));
    }
  }
  // 一定条件
  if (!juushinGata && itteiJouken){
    if (transfer[0]){
      rt.push(jihatsuKasan.find(e=>e.s==="616422"));
    }
    if (transfer[1]){
      rt.push(jihatsuKasan.find(e=>e.s==="616422"));
    }

  }
  return rt;
}
// 加算項目の送迎を求める
// 一定条件送迎加算を追加する
// const getTrasferItem = (transfer, absence, type, addiction) => {
//   const rt = [];
//   // オブジェクトがなかったり配列が空だったりしたら空白の配列を返す
//   if (!transfer) return rt;
//   if (!transfer.length) return rt;
//   // 欠席のときも空配列
//   if (absence) return rt;
//   const transferItemN = houdayKasan.find(e => e.s === '636240');
//   const transferItemJ = houdayKasan.find(e => e.s === '636241');
//   const transferItemItteiJ = houdayKasan.find(e => e.s === '636242');
//   // 一定条件があるか
//   const itteiJouken = parseInt(addiction.送迎加算Ⅰ一定条件) === 1;
//   // transferは配列で中身があれば送迎有りと判断。両方送迎なら二回アイテムを
//   // プッシュする
//   if (type !== "重症心身障害児") {
//     if (transfer[0]) rt.push(transferItemN);
//     if (transfer[1]) rt.push(transferItemN);
//   }
//   else {
//     if (transfer[0]) rt.push(transferItemJ);
//     if (transfer[1]) rt.push(transferItemJ);
//   }
//   // 一定条件のアイテムを追加
//   if (type !== "重症心身障害児" && itteiJouken){
//     if (transfer[0]) rt.push(transferItemItteiJ);
//     if (transfer[1]) rt.push(transferItemItteiJ);

//   }
//   return rt;
// }

const getTrasferItem = (transfer, absence, addiction, service, user, stdDate) => {
  const rt = [];
  // オブジェクトがなかったり配列が空だったりしたら空白の配列を返す
  if (!transfer) return rt;
  if (!transfer.length) return rt;
  // 欠席のときも空配列
  if (absence) return rt;
  // 送迎加算のリストを取得
  const items = [];
  if (service === HOUDAY){
    items.push(...SOUGEI_ITEMS_HOUDAY);
  }
  else if (service === JIHATSU){
    items.push(...SOUGEI_ITEMS_JIHATSU);
  }
  let wk = [...items];
  const icareType = user.icareType? user.icareType.replace(/\D/g, ''): null;
  const sougeisettei = addiction.送迎加算設定;
  // 送迎設定による絞り込み
  if (sougeisettei && sougeisettei !== '同一敷地内'){
    wk = wk.filter(e=>e.value === sougeisettei);
  }
  else {
    wk = wk.filter(e=>!e.value)
  } 
  if (wk.find(e=>e?.opt?.trg === 'juu') && user.type === '重症心身障害児'){
    wk = wk.filter(e=>e?.opt?.trg === 'juu');
  }
  else {
    wk = wk.filter(e=>!e?.opt?.trg);
  }

  if (wk.find(e=>e?.opt?.ftype === 1) && addiction.重症心身型 === '1'){
    wk = wk.filter(e=>e?.opt?.ftype === 1);
  }
  else {
    wk = wk.filter(e=>!e?.opt?.ftype);
  }

  if (wk.find(e=>e?.opt?.icare) && icareType){
    wk = wk.filter(e=>e?.opt?.icare === parseInt(icareType));
  }
  else{
    wk = wk.filter(e=>!e?.opt?.icare)
  }
  if (wk.length !== 1){
    // console.log(user.uid, user.name, 'user.uid, user.name');
    wk[0] = items[0];
  }
  // 送迎加算1の時は基本送迎加算と追加送迎加算が発生する
  const item = wk[0];
  // 見つかったアイテムが基本送迎加算ではない場合、一定条件を含む場合
  if (item.c.includes('送迎加算１') && item.c.includes('一定')){
    const baseSougei = items.find(e=>e.c.match(/送迎加算１$/)); // 基本送迎加算
    wk.push(baseSougei);
  }
  if (transfer[0]) rt.push(...wk);
  if (transfer[1]) rt.push(...wk);
  return rt;
}

// 明細作成用のScheduleオブジェクトを市区町村順でソートして配列化
const schTmpToArray = (src, userlist, stdDate) => {
  const scitySet = new Set(); // Uniqueな市区町村番号を作成する
  Object.keys(src).map(e => {
    if (!checkUidFromList(userlist, e)){
      return false;
    }
    scitySet.add(src[e].scityNo);
  });
  // セットを配列化してソート
  const scityArray = Array.from(scitySet);
  scityArray.sort((a, b) => (a - b));
  // ソートされた配列の順に新しいオブジェクトに値をCOPY
  const rt = [];
  scityArray.map(e => {
    Object.keys(src).map(f => {
      if (!checkUidFromList(userlist, f)){
        return false;
      }

      if (src[f].scityNo === e) {
        // 利用件数ゼロは削除する ---> 削除しないようにする 2021/09/06
        const count = src[f].countOfUse + src[f].countOfKesseki;
        // if (!count) return false;
        src[f]['UID'] = f; // キーだったuidをオブジェクトの中に入れる
        rt.push(src[f]);
      }
    })
  });
  rt.forEach(e=>e.stdDate = stdDate);
  return rt;
}

// 加算項目を特定するために加算オブジェクトのUniqueなキー値を得る
// houdayKasanから得られるnameを一致させてある
// そのUnique値を取得する
// 児発の名前も加えておく。
const getKasanUniqName = () => {
  const kasanSet = new Set();
  houdayKasan.map(e => {
    kasanSet.add(e.name);
  });
  jihatsuKasan.map(e=>{
    kasanSet.add(e.name);
  });
  hohouKasan.map(e=>{
    kasanSet.add(e.name);
  });
  keikakuSoudanAddiction.map(e=>{kasanSet.add(e.name)});
  syougaiSoudanAddiction.map(e=>{kasanSet.add(e.name)});
  const t = Array.from(kasanSet).filter(e=> e !== '送迎加算設定');
  return t;
};
const getKasanUniqNameSoudan = () => {
  return Array.from(new Set(
    [...syougaiSoudanAddiction, ...keikakuSoudanAddiction].map(e=>e.name)
  ))
}
// 延長加算を取得するモジュール
// ここまででフィルタリングされたkasan配列
const getEntyouKasan = (kasan, key, type) => {
  let r;
  if (key !== '延長支援加算') return kasan;
  if (type === '障害児') r = kasan.filter(e=>!e.opt.includes('重心'));
  else r = kasan.filter(e=>e.opt.includes('重心'));
  return r;
}

// 児発用加算アイテム取得
const getKasanOneItemJH = (key, addiction, user) => {
  // 2025-10-01以前は古いロジックを使用
  const stdDate = getLS('stdDate');
  if (stdDate && stdDate <= '2025-10-01') {
    return getKasanOneItemJH_before2510(key, addiction, user);
  }
  
  const value = addiction[key];
  const errObj = { err: 'item found err.', key, value };

  const tos = v => v? String(v): v;
  const shisetsuType = parseInt(addiction.重症心身型) ?? null;
  const typeName = {障害児: 'syo', 重症心身障害児: 'juu', 難聴児: 'nan'};
  const isCenter = addiction.児童発達支援センター === '1';
  const type = typeName[user.type] ?? 'syo';
  const icareType = user.icareType?.replace(/\D/g, '') ?? false;
  const teiin = addiction.定員;
  const isJuushin = type === 'juu' && shisetsuType;
  const pres = addiction.就学区分;
  const isEnchouShien = key === '延長支援';
  const trueIcare = resolveTrueIcareEnchou(addiction, icareType);

  if (kangoKahaiIsNull(addiction, key, type)) return {};

  let lst = [...jihatsuKasan];
  // keyとvalueで絞り込み 
  lst = lst.filter(e=>e.name === key && tos(e.value) === tos(value));
  
  // センターか否か
  const facTarget = isCenter? 'ce': 'ji'
  lst = lst.filter(e=>!e?.opt?.fac || e?.opt?.fac === facTarget)
  // 施設タイプ 重心対応型か
  const existFtype = lst.find(e=>e?.opt?.ftype);
  if (existFtype && shisetsuType && isJuushin){
    lst = lst.filter(e=>tos(e?.opt?.ftype) === tos(shisetsuType));
  }
  // 延長支援のみ施設タイプのみでフィルタ
  else if (existFtype && shisetsuType && isEnchouShien){
    lst = lst.filter(e=>tos(e?.opt?.ftype) === tos(shisetsuType));
  }
  else if (existFtype){
    lst = lst.filter(e=>!e?.opt?.ftype)
  }
  // 障害児タイプ
  if (type === 'juu' && lst.find(e=>e?.opt?.trg === 'juu')){
    lst = lst.filter(e=>e?.opt?.trg === type);
  }
  // 難聴児を考慮
  else if (type === 'nan' && lst.find(e=>e?.opt?.trg === 'nan')){
    lst = lst.filter(e=>e?.opt?.trg === type);
  }
  else{
    // ここでは難聴児と障害児を同一視する
    let ttype = type === 'nan'? 'syo': type;
    // 重心がリストに見つからなかったらtypeは障害児にする
    if (!lst.find(e=>e?.opr?.trg === 'juu')){
      ttype = 'syo';
    }
    lst = lst.filter(e=>!e?.opt?.trg || e?.opt?.trg === ttype);
  }
  // 医療的ケア
  const existIcare = lst.find(e=>e?.opt?.icare);
  if (existIcare && trueIcare && !isEnchouShien){
    lst = lst.filter(e => Number(e?.opt?.icare) <= Number(trueIcare));
  }
  else if (existIcare && trueIcare && isEnchouShien && !shisetsuType){
    lst = lst.filter(e => Number(e?.opt?.icare) <= Number(trueIcare));
  }
  // 重心型施設の延長支援は別ロジック
  else if (existIcare && isEnchouShien && shisetsuType && icareType){
    lst = lst.filter(e => e?.opt?.icare);
  }
  else if (existIcare && isEnchouShien && shisetsuType && !icareType){
    lst = lst.filter(e => !e?.opt?.icare);
  }
  else if (existIcare){
    lst = lst.filter(e=>!e?.opt?.icare);
  }
  // 未就学区分での絞り込み
  if (pres && lst.find(e=>tos(e?.opt?.pres) === tos(pres))){
    lst = lst.filter(e=>tos(e?.opt?.pres) === tos(pres));
  }
  // 定員による絞り込み 現在の定員以下のデータを探す場合と定員以上のデータを探す場合がある
  const existCap = lst.find(e=>e?.opt?.cap);
  if (existCap){
    const cap = getMatchedCapacity(lst, teiin)
    lst = lst.filter(e=>e?.opt?.cap === cap)
  }


  if (!lst.length) return errObj;
  return lst[0];


}

// 保訪用加算アイテム取得
const getKasanOneItemHH = (key, addiction, type) => {
  const tos = v => v? String(v): v;

  const value = addiction[key];
  // なぜか-1が入ってくるので空オブジェクトを送信
  if (Number(value) === -1) return {};
  const errObj = { err: 'item found err.', key, value };

  let kasan = hohouKasan.filter(e => (
    e.name === key && tos(e.value) === tos(value))
  );
  // // 延長支援加算 検出
  // kasan = getEntyouKasan(kasan, key, type);
  // これだけで特定できたらそのままリターン
  if (kasan.length === 1) return kasan[0];
  // この時点で見つからなければエラー
  if (!kasan.length) return errObj;
  // これで絞り込みできなければエラーにすべきかと
  if (kasan.length > 1)  return errObj;
  // 最初の要素がビンゴ
  return kasan[0];
}

// 相談支援用加算アイテム取得
const getKasanOneItemSoudan = (key, addiction, service) => {
  const tos = v => v? String(v): v;

  const value = addiction[key];
  const errObj = { err: 'item found err.', key, value };
  if (!soudanServiceName.includes(service)){
    return { err: 'service err.', key, value, service};
  }
  // 名前で絞り込み
  const kasanLst = service === KEIKAKU_SOUDAN? keikakuSoudanAddiction: syougaiSoudanAddiction;
  let tLst = kasanLst.filter(e=>e.name===key);
  // countがあったら値を代入
  if (tLst.find(e=>e.count !== undefined)){
    tLst.forEach((e, i)=>{
      if (tLst[i]?.count !== undefined) tLst[i].count = parseInt(value);
    })
  }
  // 無ければ値でフィルタ
  else {
    tLst = tLst.filter(e=> tos(e.value) === tos(value))
  }
  if (tLst.length === 1) return tLst[0];
  if (!tLst.length) return errObj;
  // オプションで絞り込み
  tLst = tLst.filter(e=>e.opt.split('・').includes(value));
  if (tLst.length === 1) return tLst[0];
  if (!tLst.length) return errObj;
  // ここでは必要ないけどオプションの少ないアイテムを選択する
  tLst.sort((a, b)=>(a.opt.split('・').length < b.opt.split('・').length)? -1: 1);
  return tLst[0];
}


// 看護加配が指定されていても重心以外はnullを返したい
export const kangoKahaiIsNull = (addiction, key, type) => {
  const shisetsuType = parseInt(addiction.重症心身型);
  if (key !== '看護職員加配加算') return false;
  if (shisetsuType && type !== 'juu') return true;
  else return false;
}
// これは放デイ用
const getKasanOneItem = (key, addiction, offSchool, user) => {
  // 2025-10-01以前は古いロジックを使用
  const stdDate = getLS('stdDate');
  if (stdDate && stdDate <= '2025-10-01') {
    return getKasanOneItem_before2510(key, addiction, offSchool, user);
  }
  
  const tos = v => v? String(v): v;
  if (addiction.欠席時対応加算) addiction.欠席時対応加算 = 1;

  const value = addiction[key];
  const errObj = { err: 'item found err.', key, value };
  const shisetsuType = parseInt(addiction.重症心身型) ?? null;
  const typeName = {障害児: 'syo', 重症心身障害児: 'juu', 難聴児: 'nan'}
  const type = typeName[user.type] ?? 'syo';
  const icareType = user.icareType?.replace(/\D/g, '') ?? false;
  const icareDaddiction = Number(addiction.医療ケア児基本報酬区分) || false;
  const teiin = addiction.定員;
  const isJuushin = type === 'juu' && shisetsuType;
  const isEnchouShien = key === '延長支援';
  const trueIcare = resolveTrueIcareEnchou(addiction, icareType);
  if (kangoKahaiIsNull(addiction, key, type)) return {};

  let lst = [...houdayKasan];
  // keyとvalueで絞り込み
  // kyeの末尾の_は削除する
  lst = lst.filter(e=>e.name === key.replace(/_+$/, '') && tos(e.value) === tos(value));
  // 施設タイプ
  const existFtype = lst.find(e=>e?.opt?.ftype);
  if (existFtype && shisetsuType && isJuushin){
    lst = lst.filter(e=>tos(e?.opt?.ftype) === tos(shisetsuType));
  }
  // 延長支援のみ施設タイプのみでフィルタ
  else if (existFtype && shisetsuType && isEnchouShien){
    lst = lst.filter(e=>tos(e?.opt?.ftype) === tos(shisetsuType));
  }
  else if (existFtype){
    lst = lst.filter(e=>!e?.opt?.ftype)
  }
  // 障害児タイプ
  if (type === 'juu' && lst.find(e=>e?.opt?.trg === 'juu')){
    lst = lst.filter(e=>e?.opt?.trg === type);
  }
  else{
    lst = lst.filter(e=>!e?.opt?.trg || e?.opt?.trg === type);
  }
  // 休日・平日
  lst = lst.filter(e=>e?.opt?.d === undefined || tos(e?.opt?.d) === tos(offSchool));
  // 医療的ケア
  const existIcare = lst.find(e=>e?.opt?.icare);
  if (existIcare && trueIcare && !isEnchouShien){
    lst = lst.filter(e => Number(e?.opt?.icare) <= Number(trueIcare));
  }
  else if (existIcare && trueIcare && isEnchouShien && !shisetsuType){
    lst = lst.filter(e => Number(e?.opt?.icare) <= Number(trueIcare));
  }
  // 重心型施設の延長支援は別ロジック
  else if (existIcare && isEnchouShien && shisetsuType && icareType){
    lst = lst.filter(e => e?.opt?.icare);
  }
  else if (existIcare && isEnchouShien && shisetsuType && !icareType){
    lst = lst.filter(e => !e?.opt?.icare);
  }
  else if (existIcare){
    lst = lst.filter(e=>!e?.opt?.icare);
  }
  // 定員による絞り込み 現在の定員以下のデータを探す場合と定員以上のデータを探す場合がある
  const existCap = lst.find(e=>e?.opt?.cap);
  if (existCap){
    const cap = getMatchedCapacity(lst, teiin)
    lst = lst.filter(e=>e?.opt?.cap === cap)
  }
  
  if (!lst.length) return errObj;
  return lst[0];
}


// 上限管理加算を判断して付与するべきなら上限管理加算アイテムを返す
// 手動の場合は無条件付与
const judgeJougenkanriKasan = (users, uid, schedule, schTmp, stdDate) => {
  const fdp = (o, k) => comMod.findDeepPath(o, k);
  const thisUser = comMod.getUser(uid, users);
  const s = thisUser.service;
  const kanriType = thisUser.kanri_type;
  const brosIndex = parseInt(thisUser.brosIndex);
  // 上限管理加算を算定すべきサービスを特定する
  const service = getPriorityService(s);
  if (kanriType !== '管理事業所' && parseInt(brosIndex) > 1) return false;
  // スケジュールオブジェクトから指定された上限額管理を取得する。
  // 長兄は手動による設定を見る
  const jSpecified = fdp(
    schedule, [service, uid, 'addiction', '利用者負担上限額管理加算']
  );
  // 手動でのoff
  if (jSpecified === 'off'){
    return false;
  }
  // 手動での強制設定
  else if (jSpecified === '手動'){
    return JOUGEN_KANRI[service];
  }
  // 兄弟上限かどうか
  const isKj = isKyoudaiJougen(schTmp, users, uid, schedule, true);
  // 管理事業所以外、兄弟以外はここで終了
  if (kanriType !== '管理事業所' && !isKj) return false;
  // 兄弟上限で長兄以外は終了
  if (brosIndex !== 1 && isKj) return false;
  // 利用があるか確認
  const uSch = schedule[uid];
  const uSchTmp = schTmp[uid]
  let cnt = 0;
  if (uSch){
    Object.keys(uSch).map(e=>{
      if (e.indexOf('D2') !== 0)  return false;
      if (e.absence && !fdp(e, 'dAddiction.欠席時対応加算'))  return false;
      cnt++;
    });
  }
  // 自分以外の兄弟のuid配列を得る
  const bros = comMod.getBrothers(uid, users, false).map(e=>'UID' + e.uid);
  // 自分以外の他社利用を調べる
  let brosAmount = 0;
  bros.forEach(e=>{
    const bSch = schedule[e];
    if (bSch){
      if (Array.isArray(bSch.協力事業所)){
        bSch.協力事業所.forEach(e=>{
          brosAmount += (e.amount)? parseInt(e.amount): 0;
        });
      }
    }
  })
  // 協力事業所の利用実績があるか確認
  let amount = 0;
  if (uSch){
    if (Array.isArray(uSch.協力事業所)){
      uSch.協力事業所.forEach(e=>{
        amount += (e.amount)? parseInt(e.amount): 0;
        // 0入力がされているときは上限管理加算算定対象になるのでインクリメントだけしておく
        // if (parseInt(e.amount) === 0) amount++;
        // 2024/08/21 変更 amountゼロは加算対象にしない
        if (stdDate < '2024-08-01' && parseInt(e.amount) === 0) amount++;
      });
    }
  }

  const kanriOk = uSchTmp.kanriOk;
  // 長兄で兄弟または自分の協力事業所の利用がある
  if (brosIndex === 1 && (brosAmount + amount) && isKj) return JOUGEN_KANRI[service];
  // 兄弟上限で長兄以外
  else if (brosIndex > 1 && isKj) return false;
  else if (brosIndex === 1 && isKj && !amount) return false;
  // else if (cnt || amount)  return JOUGEN_KANRI[service];
  else if ((cnt || amount) && stdDate < '2024-06-01')  return JOUGEN_KANRI[service];
  else if (amount && stdDate >= '2024-06-01')  return JOUGEN_KANRI[service];
  else if (amount && stdDate >= '2024-08-01')  return false;
  else return false;

}

// 計算用オブジェクトのitemsをユーザーごとに集計する
// クラスルーム別の売上も求められるようにする
const totalizeItems = (tmpSch, masterRec, users, schedule, stdDate, classroom = '')=>{
  // 欠席でも有効なサービスコード
  
  const kessekiSvc = [
    ...KESSEKI_SVC_CODE, 
    ...KANKEIRENKEI_SVC_CODE, ...KAZOKUSHIEN_SVC_CODE, 
    ...JIGYOUSYO_RENKEI_SVC_CODE,
    // ...SOUDANSIEN_SVC_CODE, 
  ];
  // 処遇と特別のサービスコード
  const syoguuTkbt = getSvcCdSyoguuTokubetu();
  kessekiSvc.push(...syoguuTkbt);

  Object.keys(tmpSch).map(e=>{
    const eachItem = [];  // itemを全部格納する配列
    const scodeSet = new Set(); // サービスコードのユニークな値を取得する
    // 上限管理加算を判断して加算
    const jougen = judgeJougenkanriKasan(users, e, schedule, tmpSch, stdDate);
    if (jougen){
      eachItem.push(jougen);
      scodeSet.add(jougen.s);
    }
    const thisUser = comMod.getUser(e, users);
    const isMtu = amdcm.classroomCount(thisUser) > 1;

    Object.keys(tmpSch[e]).map(f=>{
      if (!f.match(ptn))  return false; //日付オブジェクトではない
      const o = tmpSch[e][f];
      const thisCls = (o.classroom)? o.classroom: thisUser.classroom;
      // 単位判定 特定単位以外はスキップ
      // MTUはスケジュールオブジェクト内に該当単位を記述するルール。
      // これで特定できるはず
      if (classroom && classroom !== thisCls) return false;
      o.items.map(g=>{
        // キャンセルかどうか確認
        // キャンセルだったら特定のコード意外はスキップ
        if (!g){
          console.log(g, 'g');
          console.log(tmpSch[e].name, 'name');
        }
        if (o.absence && f && !f.startsWith('*') && kessekiSvc.indexOf(g.s) === -1)  return false;
        scodeSet.add(g.s);  // サービスコードを追加
        eachItem.push(g);
      });
    });
    // 配列化してソート
    const scodeArray = Array.from(scodeSet).sort((a, b) => (a - b));
    const itemTotal = scodeArray.map(f=>{
      const thisItem = eachItem.find(g=>g.s === f); // 該当アイテムを一個取得
      // 処遇改善、一回のみ場合は回数１で配列に追加
      if (thisItem?.method === 'syoguu' || thisItem.limit === 'once'){ 
        return ({...thisItem, count: 1});
      }
      // 0930特別加算
      else if (thisItem.tokubetsu){
        return ({...thisItem, count: 1});
      }
      // 特地加算 2024/11/21追加
      else if (thisItem.method){
        return ({...thisItem, count: 1});
      }
      else{
        // それ以外はitemは数を数える
        const items = eachItem.filter(g => g.s === f);
        let count = items.length;
        // eachItemがcountを保つ場合があるのでそれを加算する
        items.filter(item=>('count' in item)).forEach(item=>{
          const c = (parseInt(item.count) - 1) || 0;
          count += c;
        })
        return ({...thisItem, count})
      }
    });
    // baseItemのみの合計単位数
    let baseItemTotal = 0;
    itemTotal.filter(f=>f.baseItem)
      .map(f=>{baseItemTotal += f.count * f.v});
    // 記載されている特別加算のアイテムを取得
    let tokubetuNdx = itemTotal.findIndex(f=>f.s === tokubetuItemSc);
    // 放デイのアイテムが見つからない場合、児発のアイテムを取得をトライ
    tokubetuNdx = (tokubetuNdx === -1)?
    itemTotal.findIndex(f=>f.s === tokubetuItemScJH): tokubetuNdx;
    // 特別加算アイテムがあればベースアイテムのみで掛け率に応じて値設定
    if (tokubetuNdx > -1){
      itemTotal[tokubetuNdx].tanniNum = 
        Math.round(itemTotal[tokubetuNdx].v * 0.01 * baseItemTotal);
      itemTotal[tokubetuNdx].v = itemTotal[tokubetuNdx].tanniNum;
    }
    // 通常処理
    if (!classroom ){
      tmpSch[e].itemTotal = itemTotal;
    }
    // 単位別売上
    else{
      if (!tmpSch[e].clsItemTotal) tmpSch[e].clsItemTotal = {};
      tmpSch[e].clsItemTotal[classroom] = itemTotal;
    }
  });
}
// 処遇改善のモジュールを独立化
// userSanteiTotalもここで出している
const syoguuKaizenAndSantei = (tmpSch, masterRec, users, classroom = '', twice, stdDate) => {
  Object.keys(tmpSch).map(e=>{
    const thisUser = comMod.getUser(e, users);
    const isMtu = amdcm.classroomCount(thisUser) > 1;

    // ---------------------------------------- 処遇改善加算
    // 0930までの加算を含める
    // サービスごとの単位数と合計を求める
    // デプロイ環境でletでitemTotalを宣言するとエラー発生
    // constにしたら直った
    const itemTotal = (!classroom)? tmpSch[e].itemTotal: tmpSch[e].clsItemTotal[classroom];
    let tanniTotal = 0;
    if (!Array.isArray(itemTotal)) return false;
    itemTotal.map(f=>{
      // if (f.method !== 'syoguu'){
      if (!f.method){ // 2024/10/07変更
        f.tanniNum = f.v * f.count;
        tanniTotal += f.v * f.count;
      };
    });
    // ユーザーごとの単位数の合計を算定し処遇改善加算を求める
    // 特地加算を最初に処理する
    // 2026-02-01以降: kihongensan(基本減算)をsyoguu(処遇改善)より前に処理することで
    // 2回のsyoguuKaizenAndSantei呼び出し間のuserSanteiTotal不整合を防ぐ
    // 数値優先度で一貫した比較関数を使用（推移律を満たす）
    // 0:tokuchi → 1:kihongensan → 2:その他 → 3:syoguu
    if (stdDate >= '2026-02-01') {
      const methodPriority = (f) => {
        if (f.method === 'tokuchi') return 0;
        if (f.method === 'kihongensan') return 1;
        if (f.method === 'syoguu') return 3;
        return 2;
      };
      itemTotal.sort((a, b) => methodPriority(a) - methodPriority(b));
    } else {
      itemTotal.sort(e=>e.method === 'tokuchi'? -1: 1);
    }
    itemTotal.map(f => {
      // 特地加算を追加
      if (f.method === 'tokuchi' && !twice) {
        const syubetu = f.s.slice(0, 2);
        const baseItemTanniTotal = itemTotal
        .filter(item => item.baseItem && item.s && item.s.indexOf(syubetu) === 0)
        .reduce((v, item)=> (v + item.tanniNum), 0);
        f.tanniNum = Math.round(baseItemTanniTotal * (f.v / 100));
        f.v = f.tanniNum;
      }
      // 基本減算項目 2024/12/31
      // 特地加算と同じメソッドになるが...
      // 念のため分けておく
      if (f.method === 'kihongensan'  && !twice){
        const syubetu = f.s.slice(0, 2);
        const baseItemTanniTotal = itemTotal
        .filter(item => item.baseItem && item.s && item.s.indexOf(syubetu) === 0)
        .reduce((v, item)=> (v + item.tanniNum), 0);
        f.tanniNum = Math.round(baseItemTanniTotal * (Number(f.v) / 100));
        f.v = f.tanniNum;

      }
      if (f.method === 'syoguu') {
        // 退避済みの済みの値があればそっちを使う
        const val = f.vbk? f.vbk: f.v;
        const syubetu = f.s.slice(0, 2);
        // 処遇改善加算を計上するための単位合計を同一のサービスのみに限定する
        const tanniTotal = itemTotal
        .filter(g=>g.s && g.s.indexOf(syubetu) === 0 && g.method !== 'syoguu')
        .reduce((v, g) => (v + (g.tanniNum || 0)), 0);
        // 処遇改善加算の値が数値だったらそのまま乗算
        if (!isNaN(val)){
          f.tanniNum = Math.round(tanniTotal * (val / 100));
        }
        // 値が文字列なら乗数を二段階に分ける
        // 放デイ処遇改善加算4, 5
        else {
          const [v1, v2] = val.split('*');
          let t1 = Math.round(tanniTotal * (parseFloat(v1) / 100));
          f.tanniNum = Math.round(t1 * parseFloat(v2));
        }
        f.vbk = f.v;
        f.v = f.tanniNum; // 単位数をここに代入 縦計算整えるため
      };
    });
    // 単位合計を再計算
    // 処遇改善加算が複数あるため別ループにする
    tanniTotal = 0;
    itemTotal.map((f, i) =>{
      tanniTotal += f.tanniNum;
      const sn = getSvcNameByCd(f);
      const up = masterRec.unitPricies[sn];
      const santei = Math.floor((up * 100) * f.tanniNum / 100);
      itemTotal[i].up = up;
      itemTotal[i].santei = santei;
    })
    // ソートを追加
    itemTotal.sort((a, b)=>{
      if (a.baseItem && !b.baseItem) return -1;
      if (!a.baseItem && b.baseItem) return 1;
      // syoguuとtokuchiが設定されている要素は常に後ろに並べる
      const isAExtra = a.method === 'tokuchi' || a.method === 'syoguu';
      const isBExtra = b.method === 'tokuchi' || b.method === 'syoguu';
      if (isAExtra && !isBExtra) return 1;
      if (!isAExtra && isBExtra) return -1;

      // 両者ともsyoguuまたはtokuchiの場合、syoguuが先、tokuchiが後になるようにする
      if (a.method === 'syoguu' && b.method === 'tokuchi') return -1;
      if (a.method === 'tokuchi' && b.method === 'syoguu') return 1;
      if (a.s > b.s) return 1;
      if (a.s < b.s) return -1;
      return 0;
    });
    // itemtotalより利用しているサービス種別を調べる。['61', '64']などの配列を得る
    // if (itemTotal.length) console.log(itemTotal, e);
    const svcs = Array.from(new Set(
      itemTotal.filter(f=>f.s).map(f=>f.s.slice(0, 2)))
    );
    // ユーザーが複数サービス使っているか
    const mSvc = thisUser.service.split(',').length > 1;
    // 通常処理
    if (!classroom ){
      tmpSch[e].itemTotal = itemTotal;
      tmpSch[e].tanniTotal = tanniTotal;
      // 複数サービス対応
      if (mSvc){
        const tanniTotalSvc = {};
        const userSanteiTotalSvc = {};
        svcs.map(f=>{
          const n = getSvcNameByCd(f);
          const t = itemTotal.filter(g=>g.s && g.s.slice(0, 2) === f)
          .reduce((v, g) => (v + parseInt(g.tanniNum)), 0);
          tanniTotalSvc[n] = t;
          const up = masterRec.unitPricies[n];
          userSanteiTotalSvc[n] = Math.floor((up * 100) * t / 100);
        });
        tmpSch[e].userSanteiTotalSvc = userSanteiTotalSvc;
        tmpSch[e].tanniTotalSvc = tanniTotalSvc;
        const ust = Object.keys(userSanteiTotalSvc)
        .reduce((v, g) => (v + userSanteiTotalSvc[g]), 0);
        tmpSch[e].userSanteiTotal = ust;
      }
      else{
        // 単独サービスでもサービスを調べてサービスごとの単価を優先する
        let up = masterRec.unitPrice;
        const svn = getSvcNameByCd(svcs[0]);
        if (masterRec.unitPricies){
          up = masterRec.unitPricies[svn];
        }
        // 複数単位の場合、単位が無いとuserSanteiTotalがNaNになるのを回避
        if (!up && !tanniTotal) up = 0;
        tmpSch[e].userSanteiTotal = Math.floor((up*100) * tanniTotal/100);
      }
    }
    else{
      if (!tmpSch[e].clsItemTotal) tmpSch[e].clsItemTotal = {};
      if (!tmpSch[e].clsTanniTotal) tmpSch[e].clsTanniTotal = {};
      if (!tmpSch[e].clsUserSanteiTotal) tmpSch[e].clsUserSanteiTotal = {};
      tmpSch[e].clsItemTotal[classroom] = itemTotal;
      tmpSch[e].clsTanniTotal[classroom] = tanniTotal;
      // 単価のリストを作成する
      const priceis = Array.from(new Set(itemTotal.map(f=>f.up)));
      let cs = 0; // このclassroomの算定
      // 単価ごとに単位数を集計して単価をかけて算定を行う
      priceis.forEach(f=>{
        const tt = itemTotal.filter(g=>g.up===f).reduce((v, f)=>(v + f.tanniNum), 0);
        cs += Math.floor((f * 100) * tt / 100);
      });
      tmpSch[e].clsUserSanteiTotal[classroom] = 
      itemTotal.reduce((v, f) => (v + f.santei), 0);
      if (svcs.length > 1){
        const t = {}; // 単位合計
        const u = {}; // 算定合計
        svcs.forEach(f =>{
          const n = getSvcNameByCd(f);
          // 単位トータル
          const tt = itemTotal.filter(g=>g.s.slice(0, 2) === f)
          .reduce((v, g) => (v + parseInt(g.v) * g.count), 0);
          const up = masterRec.unitPricies[n];
          t[n] = tt;
          u[n] = Math.floor((up * 100) * tt / 100);
        })
        tmpSch[e].clsUserSanteiTotal[classroom] = u;
        tmpSch[e].clsTanniTotal[classroom] = t;
      }
    }
  })
}



// 上限管理するよ！！！
const makeUpperLimit = (dt, stdDate, serviceItems) =>{
  const soudanKasanNames = [SYOUGAI_SOUDAN, KEIKAKU_SOUDAN];
  const isSoudan = soudanKasanNames.some(e=>serviceItems.includes(e));
  
  // 管理事業所の場合の調整！
  const manegeThis = (udt, ichiwari) =>{
    if (!udt.協力事業所 && !udt.brosIndex)        return {result: false};
    if (!udt.協力事業所.length && !udt.brosIndex) return {result: false};
    let result = true;
    const haibun = udt.協力事業所[0].haibun;
    const jAry = udt.協力事業所;

    jAry.unshift({ name: 'thisOffice', amount: udt.userSanteiTotal, no: '0'});

    const priceLimit = udt.priceLimitBk? udt.priceLimitBk: udt.priceLimit;
    let lessPrice = parseInt(priceLimit);
    // 兄弟管理がある場合、割付自己負担額を兄弟管理結果学とする
    lessPrice = (udt.kdLessPrice !== undefined)
    ? udt.kdLessPrice: lessPrice;
    const kdTyousei = (udt.kdTyousei)? udt.kdTyousei: 0;
    // 先頭から自己負担額を割り振る
    jAry.map(e=>{
      e.amount = parseInt(e.amount);
      // 一件でも数値が入っていなかったら管理結果をfalseにする
      if (isNaN(e.amount))  result = false;
      // ichiwariは上位モジュールで作成
      //  --> 変更 一つ一つの事業所の一割相当額として再定義
      let thisIchi = Math.floor(e.amount * 0.1);
      if (e.name === 'thisOffice') thisIchi = ichiwari; // 上位モジュールで作成された一割相当額 複数サービス対応のため
      // 多子軽減対応
      thisIchi = (udt.tashikeigen === 2)? Math.floor(e.amount * 0.05): thisIchi;
      thisIchi = (udt.tashikeigen === 3)? 0: thisIchi;
      // 2024/01/15追加
      if (isSoudan) thisIchi = 0;
      let tyouseiGaku = (parseInt(priceLimit) < thisIchi)
        ? parseInt(priceLimit) : thisIchi;
      
      // 管理事業者以外は1割相当額を調整額に入れる？？ 福祉ソフトがそうしてる
      // if (e.name !== 'thisOffice'){
      //   tyouseiGaku = ichiwari;
      // }
      // 兄弟調整済みでthisofficeはここでは調整しない
      if (kdTyousei && e.name === 'thisOffice'){
        e.kettei = udt.ketteigaku;
      }
      else{
        e.kettei = (thisIchi > lessPrice) ? lessPrice : thisIchi;
        lessPrice -= e.kettei;
        if (udt.kdLessPrice)  udt.kdLessPrice -= e.kettei;
      }
      e.ichiwari = thisIchi;
      e.tyouseiGaku = tyouseiGaku;
    // lessPrice -= (e.kettei - kdTyousei); // 長男は二重に引かれるので調整
    });
    // 自己負担額が割り振られた事業所の数をカウントする
    const cnt = jAry.filter(e=>e.kettei).length;
    // ここに被保険者番号と利用者名が欲しくなったという…帳票作成時に使う
    jAry.map(e=>{e.hno = udt.hno; e.userName = udt.name; e.userKana = udt.kana});

    
    // 上限範囲内
    const inLimit = lessPrice > 0;
    // 配分した結果を取得
    const kanrikekkagaku = jAry.find(e => e.name === "thisOffice").kettei;
    // 利用者負担額が割り振られた（負担額がある事業所が2以上）なら
    // 上限管理が発生したとしてtrueを返す
    const rt = {
      shared: (cnt > 1), // 配分されたかどうか
      inLimit, // 上限範囲内だったかどうか
      kanrikekkagaku,
      result,
    }
    return rt;
    // scheduleにdispatch要検討
  }
 // それぞれの利用者を処理
  Object.keys(dt).map(e=>{
    addjustKdLessPrice(dt);
    const o = dt[e];
    // 利用実績がない利用者は処理しない
    // 欠席利用のみは処理続行するようにした。20210731
    // if (!(o.countOfUse + o.countOfKesseki))  return false;
    // if (!o.kanriType) return false; // 管理事業所協力事業所が設定されていない。
    let ichiwari = Math.floor(o.userSanteiTotal * .1); // 一割。ここは切捨
    const ichiwariSvc = {};
    // 2024/03/07追加 一割相当額はそれぞれのサービスの算定額一割の合計となる
    if (o.userSanteiTotalSvc && Object.keys(o.userSanteiTotalSvc).length) {
      ichiwari = 0;
      Object.keys(o.userSanteiTotalSvc).forEach(k=>{
        let ichiSvc = Math.floor(o.userSanteiTotalSvc[k] * .1); // サービスごとの一割相当額
        ichiSvc = o.tashikeigen === 2 ? Math.floor(o.userSanteiTotalSvc[k] * 0.05): ichiSvc;
        ichiSvc = o.tashikeigen === 3 ? 0: ichiSvc;
        ichiwari += ichiSvc;
        ichiwariSvc[k] = ichiSvc;
      });
    }
    else {
      ichiwari = o.tashikeigen === 2 ? Math.floor(o.userSanteiTotal * 0.05): ichiwari;
      ichiwari = o.tashikeigen === 3 ? 0: ichiwari;
    }
    if (isSoudan) ichiwari = 0;
    let upperlimit = parseInt(o.priceLimitBk? o.priceLimitBk: o.priceLimit);
    if (o.musyouka) upperlimit = 0;
    let tyouseigaku = Math.min(ichiwari, upperlimit); // 上限月額調整額
    // 兄弟調整の結果を反映
    if (o.kdTyousei !== undefined){
      tyouseigaku = Math.min(tyouseigaku, parseInt(o.kdTyousei));
    }
    let kanrikekkagaku = tyouseigaku; // 上限管理結果額 暫定
    let kanriKekka;
    // 兄弟調整があるときは管理結果を上書きしない
    if (o.kdTyousei !== undefined){
      kanriKekka = o.kanriKekka
    }
    else{
      kanriKekka = 0;
    }
    let kanriOk = false; // 上限管理がされているかどうかのフラグ
    // "1"管理事業所で利用者負担額を充当したため、他事業所では発生しない。
    // "2"利用者負担額の合計額が、負担上限月額以下のため、調整事務は行わない。
    // "3"利用者負担額の合計額が、負担上限月額を超過するため、調整した。 
    // 利用者負担上限額管理を行った場合のみ設定する。利用者負担上限額管理
    // が必要ない場合（例えば、利用者負担上限月額が 0 円の場合）は
    // 設定しない。 
    if (o.kanriType === '協力事業所'){
      if (o.管理事業所 === undefined || !o.管理事業所.length){
        // const kettei = o.管理事業所[0].kettei;
        // adjust2 = (tyouseigaku > adjust2)? adjust2 : tyouseigaku;
        // console.log(o.name + 'さんの上限管理情報がありません。');
        kanriOk = false;
      }
      else{
        kanriKekka = parseInt(o.管理事業所[0].kanriKekka);
        kanrikekkagaku = parseInt(o.管理事業所[0].kettei);
        // 「設定しない」を管理OKにする
        const notSet = o.管理事業所[0].kanriKekka === '設定しない'
        if ((kanriKekka > 0 || notSet) && kanrikekkagaku >= 0){
          kanriOk = true;
        }
      }
      kanrikekkagaku = Math.min(kanrikekkagaku, upperlimit);
    };

    // 協力事業所がない
    const noKyJi = (o.協力事業所 === undefined || !o.協力事業所.length);
    // 無償化の場合、基本何もしない
    if (o.musyouka){
      kanriOk = true;
    }
    else if (o.kanriType === '管理事業所' && noKyJi){
        // console.log(o.name + 'さんの上限管理情報がありません。');
        kanriOk = false;
    }
    else if (o.kanriType === '管理事業所' && !noKyJi) {
      kanriKekka = (ichiwari > upperlimit) ? 1 : 2;
      // この場合、結果は暫定。他事業所で調整があれば3に変更
      const manageRt = manegeThis(o, ichiwari);
      const {shared, inLimit, result ,kanrikekkagaku, ...others} = manageRt;
      // kanriKekka = (manageRt.shared) ? 3 : kanriKekka; // 配分されたなら3
      if (!shared && !inLimit)  kanriKekka = 1; // 管理事業所充当
      else if (shared && !inLimit)  kanriKekka = 3; // 調整を行った
      else kanriKekka = 2; // 上限範囲内 
      // kanrikekkagaku = manageRt.kanrikekkagaku;
      // 協力事業所情報がないとfalseが帰ってくる
      // また他事業所の数値が入っていな場合もfalseが帰ってくる
      // その場合、管理結果をfalseにする
      if (!manageRt.result){
        kanriKekka = 0;
        kanriOk = false;
      }
      else{
        kanriOk = true;
      }
    }
    o.kanriOk = kanriOk;
    o.kanriKekka = kanriKekka;
    o.tyouseigaku = tyouseigaku;
    o.kanrikekkagaku = kanrikekkagaku;
    o.ketteigaku = Math.min(kanrikekkagaku, tyouseigaku);
    o.ichiwari = ichiwari;
    // // 管理結果学をサービスごとに按分
    // if (isMultiSvc){
    //   if (kanrikekkaLess > tyouseigoUserBuild){
    //     kanrikekkagaku = tyouseigoUserBuild;
    //     kanrikekkaLess -= tyouseigoUserBuild;
    //   }
    //   else {
    //     kanrikekkagaku = kanrikekkaLess;
    //     kanrikekkaLess = 0;
    //   }
    // }
    const kanrikekkagakuSvc = {};
    if (Object.keys(ichiwariSvc).length){
      // ソートしておく 保訪のみ後にする
      const svcAry = Object.keys(ichiwariSvc).sort((a, b) => (
        a === HOHOU? 1: -1
      ))
      let kanrikekkaLess = kanrikekkagaku;
      svcAry.forEach(svc=>{
        const ty = Math.min(upperlimit, ichiwariSvc[svc]);
        if (kanrikekkaLess > ty){
          kanrikekkagakuSvc[svc] = ty;
          kanrikekkaLess -= ty;
        }
        else{
          kanrikekkagakuSvc[svc] = kanrikekkaLess;
          kanrikekkaLess = 0;
        }
      })
    }
    // データに一割相当額を追加
    if (Object.keys(ichiwariSvc).length){
      o.ichiwariSvc = ichiwariSvc;
    }
    if (Object.keys(kanrikekkagakuSvc).length){
      o.kanrikekkagakuSvc = kanrikekkagakuSvc;
    }
    
  });

}

// 市区町村、サービスごとに集計データを作成する
// k112の項目を埋めるために使用する
const totlizeCityAndService = (srcDt, masterRec, userlist) =>{
  // temSchを一旦deep copy
  const dt = JSON.parse(JSON.stringify(srcDt));
  // まずはUniqueな配列から
  const cityServiceSet = new Set();
  Object.keys(dt).map(e=>{
    if (!checkUidFromList(userlist, e)){
      return false;
    }
    const o = dt[e];
    const mSvc = comMod.typeOf(o.serviceSyubetu)  === 'array';
    // 単独サービスの場合
    if (!mSvc && o.tanniTotal){
      cityServiceSet.add(o.scityNo + ',' + o.serviceSyubetu);
    }
    if (mSvc){
      o.serviceSyubetu.forEach(f => {
        cityServiceSet.add(o.scityNo + ',' + f)
      })
    }
  });
  // 配列化ソート。これで文字列のソートが出来るっぽい
  const cityService = Array.from(cityServiceSet)
  .sort((a, b)=>((a < b)? 1: -1));
  // 集計して配列に加える
  const totalized = [];
  // ソートしてからループ回す 管理結果学の演算のため
  cityService.sort((a, b)=>((a < b)? -1: -1)).map(e=>{
    let adjust1 = 0;
    let adjust2 = 0;
    let kanrikekkagaku = 0;
    let countOfUse = 0;
    let tanniTotal = 0;
    let userSanteiTotal = 0;
    let countOfUsers = 0;
    let jichiJosei = 0;
    const scityNo = e.split(',')[0]; // カンマ区切りで格納されているので展開
    const sSyubetu = parseInt(e.split(',')[1]);
    // サービス種別ssが単一なら無条件にo2を返す。複数ならo1からsnを探して返す
    // o1が未定義ならo2を返す
    const sf = (ss, o1, o2, sn) => {
      if (ss.length === 1) return o2;
      else if (o1 && o1[sn]) return o1[sn];
      else return 0;
    }
    Object.keys(dt).map(key=>{
      if (!checkUidFromList(userlist, key)){
        return false;
      }
      const f = dt[key];
      if (!f.tanniTotal)  return false;
      if (f.scityNo !== scityNo) {
        return false;
      }
      // 複数サービスか否か
      const mSvc = comMod.typeOf(f.serviceSyubetu) === 'array';
      // billingDtのサービス種別を配列化
      const ssyubetA = mSvc? f.serviceSyubetu: [f.serviceSyubetu];
      // 非該当サービスならスキップ
      if (!ssyubetA.includes(sSyubetu)) return false;
      // サービス名を取得
      const svcName = serviceSyubetu[sSyubetu + ''];
      // 利用実績がなければスキップ
      // ここを変更。単位トータルでスキップしているので2021/09/22追加
      // if (!f.countOfUse)  return false;
      // countOfUse += mSvc? f.countOfUseMulti[svcName]: f.countOfUse;
      // tanniTotal += mSvc? f.tanniTotalSvc[svcName]: f.tanniTotal;
      // userSanteiTotal += mSvc? f.userSanteiTotalSvc[svcName]: f.userSanteiTotal;
      const tt = sf(ssyubetA, f.tanniTotalSvc, f.tanniTotal, svcName);
      countOfUse += sf(ssyubetA, f.countOfUseMulti, f.countOfUse, svcName);
      tanniTotal += sf(ssyubetA, f.tanniTotalSvc, f.tanniTotal, svcName);
      userSanteiTotal += sf(ssyubetA, f.userSanteiTotalSvc, f.userSanteiTotal, svcName);
      kanrikekkagaku += sf(ssyubetA, f.kanrikekkagakuSvc, f.kanrikekkagaku, svcName);
      jichiJosei += sf(ssyubetA, f.jichiJoseiSvc, Number(f.jichiJosei || 0), svcName);
      // dt[key].kanrikekkagaku = 0; // 一旦集計した値をリセット 二重に計上されるので
      // jichiJosei += (f.jichiJosei)? Number(f.jichiJosei): 0;
      if (isNaN(f.kanrikekkagaku)){
        console.log(f.kana + 'さんのに問題があります。')
      }
      countOfUsers++;
    });
    if (!tanniTotal) return false;
    totalized.push({
      scityNo: removeAsterisk(scityNo), serviceSyubetu: sSyubetu, adjust1, adjust2, countOfUse,
      tanniTotal, userSanteiTotal, kanrikekkagaku, countOfUsers,
      jichiJosei
    });
  });
  // ソート実施 文字列連結してマルチソートっぽく（文字数があってないと機能しないよ）
  totalized.sort((a, b)=>(
    a.scityNo+a.serviceSyubetu > a.scityNo+a.serviceSyubetu? 1: -1
  ));

  // マスターレコードに追加！
  masterRec.totalized = totalized;
}

// 2021法改正対応
// 従来はサービス名のベース（放デイ２４等）を事業所情報のみから取得できていたが
// 医療的ケア児が出てきたためユーザーごとにサービス名ベースを設定する必要が
// 出てきた。この関数でユーザーごとのサービス名ベースを設定する
// 医療ケア区分をusersから持ってくる必要がある場合がある。医療ケアありとなしでnameBaseが変わるため
const getServiceNameBase = (comAdic, schedule, users, UID, type, getUsersStateIcare = false) => {
  let ku = comAdic.サービス提供時間区分;
  const service = '放課後等デイサービス';
  const teiin = parseInt(comAdic.定員);
  const thisUser = comMod.getUser(UID, users);
  if (!inService(thisUser.service, HOUDAY))  return false;
  // ユーザーからではなくスケジュールから医療ケアの情報を取得
  const pathStr = service + '.' + UID + '.addiction.医療ケア児基本報酬区分';
  let usersIcare = comMod.findDeepPath(schedule, pathStr);
  // ユーザーズから持ってくる必要がある場合
  if (getUsersStateIcare){
    if (thisUser.icareType){
      usersIcare = thisUser.icareType.replace(/[^0-9]/g, '');
    }
  }
  // iryoucareはundefinedではなくnullにする->0にする->''にする
  let iryoucare = (usersIcare)? usersIcare: '';
  // ここは要変更。type重心だけではこの適用にはならない。->事業所設定追加2021/10/01
  // 重度障害児の場合は区分を空白にする
  ku = (type === '重症心身障害児')? '': ku;
  // 医療ケアも同様 type重心だけではこの適用にはならない。->事業所設定追加2021/10/01
  iryoucare = (type === '重症心身障害児')? '': iryoucare;
  // 区分と障害者・重心で絞って定員で特定
  let nameBase = serviceNameBase.filter(e => e.ku === ku);
  nameBase = nameBase.filter(e=>e.min <= teiin && e.max >= teiin);
  nameBase = nameBase.filter(
    e=>e.iryoucare === parseInt(iryoucare) || e.iryoucare === iryoucare
  );
  nameBase = nameBase.filter(e=>e.target === type);
  nameBase = nameBase[0];
  return nameBase;
}
// 児発用のサービスベース名取得
// 利用者の医療ケアを取得していなかった！ 2024/02/29
// const getServiceNameBaseJH = (comAdicJH, schedule, users, UID, type, getUsersStateIcare = false) => {
//   const teiinHd = (comAdicJH)? parseInt(comAdicJH.定員): 0;
//   const thisUser = comMod.getUser(UID, users);
//   if (!inService(thisUser.service, JIHATSU))  return false;

//   const fcl = () => {
//     const v = (comAdicJH)? parseInt(comAdicJH.児童発達支援センター): false;
//     // センターサービスコード特定用に直した
//     // if (v > 1)  return 'センター';
//     if (v >= 1)  return 'センター';
//     else return '事業所';
//   }
//   // フィルタで使用する就学区分を求める
//   const syuugaku = () => {
//     const v = (comAdicJH)? parseInt(comAdicJH.就学区分): '';
//     if (fcl() === 'センター') return '';
//     else if (v === 1) return '主に未就学児';
//     else return '主に未就学児以外';
//   };
//   const pathStr = '児童発達支援.' + UID + '.addiction.医療ケア児基本報酬区分';
//   // フィルタで使用する医療ケアを求める
//   // 重心は医療ケアがない
//   const usersIcare = () => {
//     if (getUsersStateIcare && type !== '重症心身障害児'){
//       const t = thisUser.icareType.replace(/[^0-9]/g, '');
//       if (!isNaN(t)) return parseInt(t);
//     }
//     let v = comMod.findDeepPath(schedule, pathStr);
//     if (isNaN(v)) v = 0;
//     v = parseInt(v);
//     if (!v) return 0;
//     else if (type !== '重症心身障害児') return v;
//     else return 0;
//   }

//   // 各条件に従って絞り込みを実施
//   let target = serviceNameBaseHD.filter(e=>(e.teiin >= teiinHd));
//   // 障害児以外は未就学区分を適用しないみたい 2022-07-15
//   if (type === "障害児"){
//     target = target.filter(e=>(e.syuugaku === syuugaku()));
//   }
//   target = target.filter(e=>(e.type === type));
//   target = target.filter(e=>(e.iCare === usersIcare()));
//   target = target.filter(e=>(e.fcl === fcl()));
//   // 絞り込まれたアイテムのうち定員が一番小さいのがビンゴ
//   target.sort((a, b)=>(a.teiin > b.teiin ? 1: -1));
//   if (!target.length){
//     console.log('getServiceNameBaseJH----', thisUser.name, target);
//   }
//   return target[0];

// }

// 兄弟調整の残高を常に兄弟間で一定にするためのモジュール
const addjustKdLessPrice = (dt) => {
  const firstUsers = Object.keys(dt)
  .filter(e=>parseInt(dt[e].brosIndex) === 1);
  firstUsers.map(e=>{
    const pname = dt[e].pname;
    const pphone = dt[e].pphone;
    const brosers = Object.keys(dt).filter(
      f=>dt[f].pname === pname && dt[f].pphone === pphone
      && parseInt(dt[f].brosIndex) > 0
    );
    let less = 999999;
    brosers.forEach(f=>{
      const priceLimit = parseInt(
        dt[f].priceLimitBk? dt[f].priceLimitBk: dt[f].priceLimit
      )
      if (dt[f].kdLessPrice < less){
        less = dt[f].kdLessPrice;
      }
      if (less > priceLimit) less = priceLimit;
      dt[f].kdLessPrice = less;
    })
  })

}

// schTmp を受けて兄弟調整を行う。
const makeBrosTyousei = (dt, jino, users, schedule, stdDate) => {
  // ------ 兄弟調整を行う
  // 長男長女のキー
  const firstUsers = Object.keys(dt)
  .filter(e=>parseInt(dt[e].brosIndex) === 1);
  // 長男長女から同じ親を持つ児童を探し兄弟調整額を設定する
  // 2024/01/15 相談支援を検出する
  const soudanServiceName = [SYOUGAI_SOUDAN, KEIKAKU_SOUDAN]
  firstUsers.map(e=>{
    // このユーザーのサービスを配列で取得する
    const svcs = comMod.getUser(e, users).service.split(',');
    let service;
    if (svcs.includes(HOUDAY)) service = HOUDAY;
    else if (svcs.includes(JIHATSU)) service = JIHATSU;
    else service = '';

    const isSoudan = soudanServiceName.some(x=>svcs.includes(x));

    // 手動上限管理を取得する 取得できたらtrue
    const jSpecified = fdp(
      schedule, [service, e, 'addiction', '利用者負担上限額管理加算']
    ) === '手動';
  
    if (!isKyoudaiJougen(dt, users, e, schedule) && !jSpecified){
      return false;
    }
    const pname = dt[e].pname;
    const pphone = dt[e].pphone;
    // 長男長女から上限値を取得
    let lessPrice = parseInt(
      dt[e].priceLimitBk? dt[e].priceLimitBk: dt[e].priceLimit
    );
    // 無償化の場合は強制的に0にする
    // if (dt[e].musyouka) lessPrice = 0;
    // // 多子軽減の3も0にする
    // if (dt[e].tashikeigen === 3) lessPrice = 0;
    // // 相談支援も0にする
    // if (isSoudan) lessPrice = 0;
    // 兄弟のキー配列を取得
    // brosindex 0 は無視する 2022/04/13
    const brosers = Object.keys(dt)
    .filter(
      f=>dt[f].pname === pname && dt[f].pphone === pphone 
      && parseInt(dt[f].brosIndex) > 0
      // && dt[f].userSanteiTotal > 0 // 算定がなくても兄弟として登録 2022/06/06
    );
    // 利用金額などで兄弟なしになる場合あり
    if (brosers.length < 2) return false;
    
    // 兄弟のキー配列をインデックス順にソート
    brosers.sort((a, b) => ((dt[a].brosIndex > dt[b].brosIndex) ? 1: -1));
    let kanriKekka;
    brosers.map((f, i)=>{
      const udt = dt[f];
      const amount = parseInt(udt.userSanteiTotal);
      let ichiwari = Math.floor(amount * 0.1);
      
      // userSanteiTotalSvcが存在する場合の処理を追加
      if (udt.userSanteiTotalSvc && Object.keys(udt.userSanteiTotalSvc).length) {
        ichiwari = 0;
        Object.keys(udt.userSanteiTotalSvc).forEach(k => {
          let ichiSvc = Math.floor(udt.userSanteiTotalSvc[k] * 0.1); // サービスごとの一割相当額
          ichiSvc = udt.tashikeigen === 2 ? Math.floor(udt.userSanteiTotalSvc[k] * 0.05) : ichiSvc;
          ichiSvc = udt.tashikeigen === 3 ? 0 : ichiSvc;
          ichiwari += ichiSvc;
        });
      } else {
        // 多子軽減対応
        ichiwari = udt.tashikeigen === 2 ? Math.floor(amount * 0.05) : ichiwari;
      }
      
      // 無償化判定をここに移動
      if (dt[e].musyouka) ichiwari = 0;
      if (dt[e].tashikeigen === 3) ichiwari = 0;
      if (isSoudan) ichiwari = 0;
      const kdTyousei = (lessPrice < ichiwari)
        ? lessPrice : ichiwari;
      // 配列トップで上限使う場合は1
      if (i === 0 && lessPrice < ichiwari)  kanriKekka = 1;
      // 配列最後で上限残額が残るようなら2
      if (i === brosers.length - 1 && lessPrice > ichiwari)   kanriKekka = 2;
      // 兄弟間で調整する場合は１にする？（福祉ソフトがそうしてる）
      if (i === brosers.length - 1 && lessPrice <= ichiwari)  kanriKekka = 1;
      // const kanriKekka = (lessPrice < ichiwari)? 1: 0;
      udt.kdTyousei = kdTyousei;
      if (kdTyousei === 0){
        udt.kanrikekkagaku = 0;
        udt.kanriOk = true;
      }
      lessPrice -= kdTyousei;
      dt[f].kanriKekka = kanriKekka;
      // 管理結果額決定額はここでは暫定。後ほど、他事業所との調整で上書きされる予定。
      dt[f].kanrikekkagaku = kdTyousei;
      dt[f].ketteigaku = kdTyousei;
      dt[f].kyoudaiJougen = true; // 兄弟上限実施されているフラグ
      dt[f].brosInfo = {};
      // 兄弟上限に必要な情報を格納（2025/04/19
      dt[f].brosInfo.firstBrosHno = dt[brosers[0]].hno;
      dt[f].brosInfo.firstBrosName = dt[brosers[0]].kana;
      dt[f].brosInfo.indexNo = i + 1;
    });
    // 兄弟調整の結果の残額を記述
    // 兄弟で共通の値となる
    brosers.map(f=>{dt[f].kdLessPrice = lessPrice;});
    // 兄弟の管理結果フラグを長男長女に合わせる
    // const brosKanrikekka = dt[brosers[0]].kanriKekka;
    brosers.map(f=>{
      dt[f].kanriKekka = kanriKekka;
      // 管理結果が 0 以外だったら上限管理事業所に自事業所を入れる
      // 自事業所を入れる条件追加。すでに管理事業所が設定されている場合は上書きしない
      if (kanriKekka && !dt[f].jougenJi) dt[f].jougenJi = jino;
    });
    
  });
  return dt;
}

// 兄弟絡みの上限管理を確定させ記録を行う
// 兄弟を含む上限管理はまず兄弟間での上限管理を行った上で事業所間の上限管理を経て決定される
// なので二つの上限管理を行った後に記録を行う。
// これなにをやってるか不明。いらないんじゃないの？ 2022/05/27
const makeBrosRecord = (bdt, users) => {
  Object.keys(bdt).filter(e=>parseInt(bdt[e].brosIndex) === 1).map(e=>{
    const cbdt = bdt[e];
    const bros = comMod.getBrothers(e, users, true);

    // console.log(bros, 'bros')
    // 格納すべき項目
    // {amount:'', name:'', ichiwari:'', kettei:'', lname: ''}
    const brosJougen = bros.map(f=>{
      const brosBdt = bdt['UID' + f.uid];
      // 1割は計算済の値が入ってきているのでここでは演算しない 2025/08/07
      // let ichiwari = Math.floor(brosBdt.userSanteiTotal * 0.1);
      // if (brosBdt.tashikeigen === 2) ichiwari = Math.floor(brosBdt.userSanteiTotal * 0.05);
      // if (brosBdt.tashikeigen === 3) ichiwari = 0;
      return({
        amount: brosBdt.userSanteiTotal,
        name: '', // ここには事業所名が入る。自社の場合は空白を返しておく
        lname: '', 
        jougen: cbdt.upperlimit,
        kettei: brosBdt.ketteigaku,
        hno: brosBdt.hno,
        UID: 'UID' + f.uid,
        userName: f.name,
        hno: f.hno,
        brosIndex: f.brosIndex,
        // 追加したよ 2025/08/07
        ichiwari: brosBdt.ichiwari,
        tyouseiGaku: brosBdt.tyouseigaku,
      })
    });
    cbdt.brosJougen = brosJougen;
  });
}

// 自治体助成を付与する
// 自治体独自の上限額に対応した2023/09/22
const makeJichitaiJosei = (schTmp, com, users) => {
  // 助成自治体の情報をcomから取得
  const cities = com.etc.cities;
  if (!cities) return null; // そもそも該当オブジェクトがない場合
  Object.keys(schTmp).map(e=>{
    const o = schTmp[e];
    const city = cities.find(f=>f.no === o.scityNo); // com記述該当自治体
    if (!city) return false; // 該当自治体なし
    // 自治体助成に決定学をそのまま記載。補助率等が出てきたら別途検討する
    // 決定額が0の場合は助成が発生しない 発生するときのみ自治体番号を記述する
    const user = comMod.getUser(e, users);
    // 利用者に設定されている独自上限
    let uDokujiJougen = parseInt(user?.etc?.dokujiJougen) ?? 0;
    const dokujiJougenZero = user?.etc?.dokujiJougenZero ?? false;
    const upperlimit = parseInt(user.priceLimit)
    if (city.josei && o.ketteigaku){
      o.jichiJosei = o.ketteigaku;
      o.joseiNo = city.joseiNo;
    }
    // 独自上限のときの自治体助成金
    else if (city.dokujiJougen && (uDokujiJougen || dokujiJougenZero)){
      // o.jichiJosei = Math.min(o.ketteigaku, (upperlimit - uDokujiJougen));
      if (dokujiJougenZero) uDokujiJougen = 0;
      o.jichiJosei = o.ketteigaku > uDokujiJougen? o.ketteigaku - uDokujiJougen: 0;
      o.joseiNo = city.joseiNo;
    }
    // 鹿児島対策。調整上限額がある場合は助成金を設定しない
    else if (city.teiritsuJosei && o.ketteigaku && !o.adjustetUpperLimit){
      const calculatedAmount = o.ketteigaku * (Number(city.teiritsuJoseiRate) / 100);
      const adjustedJichijosei = parseInt(o.adjustedJichijosei);
      switch(city.teiritsuJoseiRound) {
        case 'round':
          o.jichiJosei = Math.round(calculatedAmount);
          break;
        case 'ceil':
          o.jichiJosei = Math.ceil(calculatedAmount);
          break;
        case 'floor':
        default:
          o.jichiJosei = Math.floor(calculatedAmount);
          break;
      }
      // 手動の値がある場合は計算値を上書き
      if (adjustedJichijosei){
        o.jichiJosei = adjustedJichijosei;
      }
      o.joseiNo = city.joseiNo;
    }
    // 協力事業所の場合は、上限管理のレコードから自治体助成金を取得する
    // これは 独自上限によって設定された自治体助成金よりも優先される
    if (city.dokujiJougen && schTmp[e].管理事業所){
      const kAry = Array.isArray(schTmp[e].管理事業所)? schTmp[e].管理事業所: [{}];
      const dokujiHojo = parseInt(kAry[0]?.dokujiHojo ?? 0);
      if (dokujiHojo){
        o.jichiJosei = dokujiHojo;
        o.joseiNo = city.joseiNo;
      }
    }
  });
}

// 自治体独自の上限額を外事業所と配分する
const makeDokujiJougenHaibun = (schTmp, com, users) => {
  // 助成自治体の情報をcomから取得
  const cities = com.etc.cities;
  if (!cities) return null; // そもそも該当オブジェクトがない場合
  Object.keys(schTmp).map(e=>{
    const o = schTmp[e];
    const city = cities.find(f=>f.no === o.scityNo); // com記述該当自治体
    if (!city) return false; // 該当自治体なし
    const user = comMod.getUser(e, users);
    if (user.kanri_type !== "管理事業所") return false;
    const kyList = o.協力事業所 ?? [];
    // 利用者に設定されている独自上限
    const uDokujiJougen = parseInt(user?.etc?.dokujiJougen) ?? 0;
    if (!uDokujiJougen) return false;
    // 利用者の自治助成額
    const uJichiJosei = parseInt(o.jichiJosei);
    // 自己負担額の引当残高
    let les = uDokujiJougen;
    kyList.forEach(ji=>{
      const kettei = parseInt(ji.kettei)
      const uFutan = Math.min(les, kettei);
      // 利用者負担より独自上限額を求める
      ji.dokujiHojo = kettei - uFutan;
      // 独自上限に基づく理鶯舎負担額引当額を更新
      les -= uFutan;
    });
    // 独自補助金に反映させる
    if (kyList.length){
      o.jichiJosei = kyList[0].dokujiHojo;
    }
    // 自事業所と他事業所の補助金額を取得
    const jijiHojo = kyList.filter(f=>f.name === 'thisOffice').reduce((v, elm)=>(
      v += elm.dokujiHojo
    ), 0);
    const otherHojo = kyList.filter(f=>f.name !== 'thisOffice').reduce((v, elm)=>(
      v += elm.dokujiHojo
    ), 0);
    // 独自の上限管理結果を設定
    if (jijiHojo === uDokujiJougen) schTmp[e].dokujiJougenKekka = 1;
    if (jijiHojo + otherHojo === uDokujiJougen) schTmp[e].dokujiJougenKekka = 2;
    if (jijiHojo + otherHojo < uDokujiJougen) schTmp[e].dokujiJougenKekka = 3;
    
    // 自治体助成ナンバーの設定。金額がないときは番号を入れない
    // if (o.jichiJosei) o.joseiNo = city.joseiNo;
    // else o.joseiNo = '';

  });

}
// 独自上限の兄弟調整を行う
const mekeDokujiJougenKyoudaiHaibun = (schTmp, com, users) => {
  // 助成自治体の情報をcomから取得
  const cities = com.etc.cities;
  if (!cities) return null; // そもそも該当オブジェクトがない場合
  // 長兄のuidをUIDxxx形式で得る 請求データが存在していて独自上限が存在する利用者
  const firstBros = users.reduce((v, user) =>{
    if (!Object.keys(schTmp).includes('UID' + user.uid)) return v;
    if (parseInt(user.brosIndex) !== 1) return v;
    const uDokujiJougen = parseInt(user?.etc?.dokujiJougen) ?? 0;
    if (!uDokujiJougen) return v;
    v.push('UID' + user.uid);
    return v;
  }, []);
  // 該当する長兄を処理
  firstBros.forEach(uid=>{
    // 兄弟を取得
    const bros = comMod.getBrothers(uid, users, true);
    // 兄弟の並び順を長兄から
    bros.sort((a, b) => (parseInt(a.brosIndex) < parseInt(b.brosIndex)? -1: 1))
    // 独自上限額の取得
    const user = comMod.getUser(uid, users);
    const uDokujiJougen = parseInt(user?.etc?.dokujiJougen) ?? 0;
    // 自治体の取得
    const city = cities.find(f=>f.no === user.scity_no); // com記述該当自治体
    // 利用者負担の残額を設定
    let less = uDokujiJougen;
    const brosKyLst = [];
    bros.forEach(bUser => {
      const o = schTmp['UID' + bUser.uid];
      const kyList = o.協力事業所 ?? [];
      o.jichiJosei = (less < o.ketteigaku)? o.ketteigaku - less: 0;
      less = less -  o.ketteigaku + o.jichiJosei;
      kyList.filter(e=>e.name !== 'thisOffice').forEach(ji=>{
        ji.dokujiHojo = (less < ji.kettei)? ji.kettei - less: 0;
        less = less -  ji.kettei + ji.dokujiHojo;
      });
      // 独自補助金に反映させる
      if (kyList.length){
        kyList[0].dokujiHojo = o.jichiJosei;
      }
      brosKyLst.push(...kyList)
      // 自治体助成ナンバーの設定。金額がないときは番号を入れない
      // if (o.jichiJosei) o.joseiNo = city.joseiNo;
      // else o.joseiNo = '';
    });
    // 自事業所と他事業所の補助金額を取得
    const jijiHojo = brosKyLst.filter(e=>e.name === 'thisOffice').reduce((v, e)=>(
      v += e.dokujiHojo
    ), 0);
    const otherHojo = brosKyLst.filter(e=>e.name !== 'thisOffice').reduce((v, e)=>(
      v += e.dokujiHojo
    ), 0);
    // 独自の上限管理結果を設定
    if (jijiHojo === uDokujiJougen) schTmp[uid].dokujiJougenKekka = 1;
    if (jijiHojo + otherHojo === uDokujiJougen) schTmp[uid].dokujiJougenKekka = 2;
    if (jijiHojo + otherHojo < uDokujiJougen) schTmp[uid].dokujiJougenKekka = 3;
    
  });

}

// 手動設定された自治助成金
const makeManualJichiJosei = (schTmp, schedule) => {
  const o = schedule?.[manualJichiJosei];
  Object.keys(o || {}).forEach(uids => {
    if (schTmp[uids]){
      schTmp[uids].jichiJosei = o[uids];
    }
  })
}

// 自体助成金による自治体助成番号の調整を行う。助成金がある場合は記述を行い
// 助成金がない場合は記述を外す
const justfyJoseiNo = (schTmp, com, users) => {
  // 助成自治体の情報をcomから取得
  const cities = com.etc.cities;
  if (!cities) return null; // そもそも該当オブジェクトがない場合
  Object.keys(schTmp).filter(e=>e.match(/^UID\d/)).forEach(uid=>{
    const o = schTmp[uid];
    const user = comMod.getUser(uid, users);
    const city = cities.find(f=>f.no === user.scity_no); // com記述該当自治体
    if (o.jichiJosei) o.joseiNo = city.joseiNo;
    else o.joseiNo = '';
  })  

}
// 自治体助成金をサービスごとに按分する
const justifyJouseigaku = (schTmp, com, users) => {
  Object.keys(schTmp).filter(e=>e.match(/^UID\d/)).forEach(uid=>{
    const o = schTmp[uid];
    if (!o.jichiJosei) return;
    let jichiJosei = Number(o.jichiJosei);
    if (o.kanrikekkagakuSvc && jichiJosei){
      o.jichiJoseiSvc = {};
      Object.keys(o.kanrikekkagakuSvc).forEach(svc=>{
        const kanrikakka = o.kanrikekkagakuSvc[svc];
        o.jichiJoseiSvc[svc] = (() => {
          if (kanrikakka <= jichiJosei){
            jichiJosei -= kanrikakka;
            return kanrikakka;
          }
          else {
            const t = jichiJosei;
            jichiJosei = 0;
            return t;
          }
        })();
      })
    }
  })  
}

// 児発無償化の判断を行う
// 児発無償化のフラグはdAddiction配下にある
// 事業所全体とユーザー単位でしか設定できないため一個でもあったらそれを設定値とする
// 2022/07/17 児発無償化自動設定に対応
const isMusyouka = (schTmp) => {
  const srcKey = '児童発達支援無償化';
  const autoSetKey = '児童発達支援無償化自動設定'; // 自動設定用
  const trgKey = 'musyouka';
  // UID配下のDIDのみ舐める
  Object.keys(schTmp).filter(e=>/^UID[0-9]+/.test(e)).map(e=>{
    const uObj = schTmp[e];
    // // 無償化対象年齢かどうか。3歳児から5歳児
    const isTargetAge = uObj.ageStr.match(/^[3-5]歳児/);
    Object.keys(uObj).filter(f=>/^D2[0-9]+/.test(f)).map(f=>{
      const dObj = schTmp[e][f];
      const trg = comMod.findDeepPath(dObj, ['dAddiction', srcKey]);
      const autoTrg = comMod.findDeepPath(dObj, ['dAddiction', autoSetKey]);
      if (trg){
        uObj[trgKey] = trg;
      }
      if (autoTrg && isTargetAge){
        uObj[trgKey] = autoTrg;
      }
    });
  })
}
// 多子軽減判断
const isTashikeigen = (schTmp) => {
  const srcKey = '多子軽減措置';
  const trgKey = 'tashikeigen';
  // UID配下のDIDのみ舐める
  Object.keys(schTmp).filter(e=>/^UID[0-9]+/.test(e)).map(e=>{
    const uObj = schTmp[e];
    Object.keys(uObj).filter(f=>/^D[0-9]+/.test(f)).map(f=>{
      if (uObj.musyouka) return false; // 無償化のときは対象外
      const dObj = schTmp[e][f];
      const trg = comMod.findDeepPath(dObj, ['dAddiction', srcKey]);
      if (trg){
        uObj[trgKey] = (trg === '第二子軽減')? 2: 3;
      }
    });
  })
}

// 兄弟上限上限月額調整額を入れる
const makeBrosGetsugakutyousei = (schTmp, users) => {
  Object.keys(schTmp).forEach(e => {
    const thisUser = comMod.getUser(e, users);
    if (parseInt(thisUser.brosIndex) === 0) return false;
    const ichiwari = Math.floor(schTmp[e].userSanteiTotal * 0.1);
    const priceLimit = schTmp[e].priceLimit;
    let getsuTyousei = Math.min(parseInt(priceLimit), ichiwari);
    schTmp[e].getsuTyousei = getsuTyousei;
  });
}

// 兄弟上限の上限管理結果と助言管理加算を再調整する
const recalcBrosParams = (schTmp, users, schedule) => {
  // 長男長女のキー
  const firstUsers = Object.keys(schTmp)
  .filter(e=>parseInt(schTmp[e].brosIndex) === 1);
  firstUsers.forEach(e=>{
    // 兄弟上限判定
    if (!isKyoudaiJougen(schTmp, users, e, schedule)){
      return false;
    }
    const limit = parseInt(schTmp[e].priceLimit);
    const bros = comMod.getBrothers(e, users, true);
    const alloc = []; // 兄弟の協力事業所配列をマージする
    let isJougen = false; // この兄弟に上限管理が存在するか
    const jougenSvc = Object.keys(JOUGEN_KANRI).map(e=>JOUGEN_KANRI[e].s);
    bros.forEach(f=>{
      const o = schTmp['UID' + f.uid];
      const k = o.協力事業所;
      // ほか事業所の負担額を取得
      const oo = Array.isArray(k)
      ? k.filter(g=>g.name !== "thisOffice"):[] // ほか事業所のみの配列
      if (Array.isArray(k)) alloc.push(...oo);
      alloc.push({kettei: o.ketteigaku, name: 'thisOffice'}); // 自事業所の負担額を追加
      const itemTotal = o.itemTotal;
      if (itemTotal.find(g=>jougenSvc.includes(g.s))){
        isJougen = true;
      }
    });
    // 総額
    // 決定額が記載されていない事業所を除外する 2022/09/30
    const total = alloc.filter(f=>f.kettei).reduce((v, f)=>(v + f.kettei), 0);
    // 自事業所のみ総額
    const thisOfficeTotal = alloc.filter(f=>f.name === "thisOffice")
    .reduce((v, f)=>(v + f.kettei), 0);
    let kk; // 管理結果を再定義
    if (total < limit){
      kk = 2;
    }
    else if (total === thisOfficeTotal){
      kk = 1;
    }
    else{
      kk = 3;
    }
    // 管理結果と上限管理加算を再設定
    // 上限管理は先に処理済みなのでここでは行わない
    bros.forEach(f=>{
      const o = schTmp['UID' + f.uid];
      if (o.kanriType !== '協力事業所'){
        o.kanriKekka = kk;
      }
    })
  });
}

// 管理結果手動設定を反映させる
const setForthKanriKekka = (schTmp, sch, users) => {
  Object.keys(schTmp).forEach(e => {
    const u = comMod.getUser(e, users);
    // 手動設定をすると管理協力を外しても生き続けるのでそれを抑制
    // 兄弟"0"を検出してしまうので修正
    if (!u.kanri_type && !Number(u.brosIndex)) return;
    const forthJougenKanrikekka = fdp(
      sch, [u.service, e, 'addiction', '上限管理結果']
    );
    if (parseInt(forthJougenKanrikekka) === 4){
      schTmp[e].kanriKekka = '';
    }
    else if (forthJougenKanrikekka === '設定しない'){
      schTmp[e].kanriKekka = '';
    }
    else if (forthJougenKanrikekka){
      schTmp[e].kanriKekka = forthJougenKanrikekka;
    }
  });
}
// 放デイで児発無償化を無効化
// 多子軽減も無効化
const killMusyouka = (dt) => {
  Object.keys(dt).map(e=>{
    const o = dt[e];
    if (o.service.includes(HOUDAY)){
      delete o.musyouka;
      delete o.tashikeigen;
    }
  });
}
// 横浜用の上限管理
const setYokohamaJougen = (schTmp, users, schedule) => {
  Object.keys(schTmp).forEach(e=>{
    const o = schTmp[e];
    const isKyoudaiJ = isKyoudaiJougen(schTmp, users, e, schedule);
    const thisUser = comMod.getUser(e, users);
    const isSeccond = parseInt(thisUser.brosIndex) > 1;
    const isYkhm = isYokohama(thisUser.scity_no);
    if (isKyoudaiJ && isSeccond && isYkhm){
      o.priceLimitBk = o.priceLimit;
      o.priceLimit = 0;
    } 
  })
}
// 横浜用上限管理後処理
// 利用者負担額確定したらpriceLimitを調整する
const setYokohamaAgein = (schTmp, users, schedule) => {
  Object.keys(schTmp).forEach(e=>{
    const o = schTmp[e];
    const isKyoudaiJ = isKyoudaiJougen(schTmp, users, e, schedule);
    const thisUser = comMod.getUser(e, users);
    const isSeccond = parseInt(thisUser.brosIndex) > 1;
    const isYkhm = isYokohama(thisUser.scity_no);
    if (isKyoudaiJ && isSeccond && isYkhm){
      o.priceLimit = o.kanrikekkagaku;
    } 

 });
}

// 送迎加算を算定しない送迎の中身を無効化する
// ['学校','*徒歩'] => ['学校','']
const deleteNoCountTransfer = (schTmp) => {
  Object.keys(schTmp).filter(e=>e.match(/^UID[0-9]/)).forEach(e=>{
    Object.keys(schTmp[e]).filter(f=>f.match(/D2[0-9]{7}/)).forEach(f=>{
      const o = schTmp[e][f].transfer;
      if (!o) return false;
      if (!Array.isArray(o))  return false;
      o.forEach((g, i)=>{
        if (g && g.match(/^\*|\*$/)) o[i] = '';
      });
    })
  });
}

const killInvalidOtherOfficeis = (schTmp, users) => {
  Object.keys(schTmp).forEach(e=>{
    const thisUser = comMod.getUser(e, users);
    if (!thisUser.kanri_type){
      delete schTmp[e].協力事業所;
      delete schTmp[e].管理事業所;
    }
  });
}
// 請求の基準になるschtmpを作成する
const makeSchTmp = (users, schedule, useAdjustetUpperLimit = true) => {
  // Scheduleを要素選択しつつdeep copy
  const schTmp = {};
  const uidsInUsers = users.map(e=>'UID' + e.uid);
  const uidsInSch = Object.keys(schedule).filter(e=>e.indexOf('UID') === 0);
  const uids = Array.from(new Set([...uidsInUsers, ...uidsInSch]));
  // scheduleのキーによるループから予めusersとscheduleから作成したキー配列を使ってループ
  // に変更した もともとはschedule初期化後追加したユーザーがスケジュールの変更なしに
  // 請求処理を回したときに発生するハングアップ対策
  // 多分、これで大丈夫 20220505
  uids.map(e => {
    const adjustetUpperLimit = useAdjustetUpperLimit 
    ? schedule?.adjustetUpperLimit?.[e] || null : null;
    // if (e.indexOf('UID') < 0) return false;
    if (!/UID[0-9]+/.test(e)) return false;
    // userlistが指定されている場合、指定以外はスキップ
    // ここでスキップすると兄弟上限の情報が欠落する。
    // schTmpToArrayでフィルタをかける
    // if (!checkUidFromList(userlist, e)) return false;
    
    const u = comMod.getUser(e, users);
    // ユーザー情報が存在するときのみ実行
    if (Object.keys(u).length){
      if (schedule[e]){
        schTmp[e] = JSON.parse(JSON.stringify(schedule[e]));
      }
      else{
        schTmp[e] = {};
      }
      // 2024/11/05追加
      if (Array.isArray(schTmp[e]) && schTmp[e].length === 0) schTmp[e] = {}; 
      // 親の名前と電話番号を格納。兄弟での上限管理のため。
      schTmp[e].pname = u.pname;
      schTmp[e].pphone = u.pphone;
      schTmp[e].brosIndex = u.brosIndex;
      // サービス名をここに記載。上限管理付与するかどうかの判断に使う 2021/09/13
      schTmp[e].service = u.service;
      schTmp[e].type = u.type;
      schTmp[e].classroom = u.classroom;
      schTmp[e].ageStr = u.ageStr; // 2022/07/17 無償化自動判断のために年齢追加
      // 2022/03/21 口座情報も追加
      schTmp[e].bank_info = comMod.findDeepPath(u, 'etc.bank_info');
      schTmp[e].upperlimit = Number(adjustetUpperLimit || u.priceLimit);
      if (u?.etc?.dokujiJougen){
        schTmp[e].dokujiJougen = u.etc.dokujiJougen;
      }
      // 手動調整済の自治体助成額
      if (schedule?.adjustedJichijosei?.[e]){
        schTmp[e].adjustedJichijosei = schedule.adjustedJichijosei[e];
      }
      // scheduleに管理事業所、協力事業所が書かれていない場合がある？
      // 書かれていなくて正解！
      // if (u.kanri_type === '管理事業所' && u?.etc?.協力事業所 && !schTmp[e].協力事業所){
      //   schTmp[e].協力事業所 = [...u?.etc?.協力事業所]
      // }
      // if (u.kanri_type === '協力事業所' && u?.etc?.管理事業所 && !schTmp[e].管理事業所){
      //   schTmp[e].管理事業所 = [...u?.etc?.管理事業所]
      // }
    }
  });
  // 2022/02/07 didが一個も存在しないスケジュールについてはD20000000を追加
  // 利用が一回もなくても上限管理加算などが追加されるケースがあるため
  Object.keys(schTmp).forEach(e=>{
    const existDid = Object.keys(schTmp[e])
    .filter(f=>f.match(/^D2[0-9]+/)).length > 0;
    if (!existDid){
      schTmp[e].D00000000 = {};
      schTmp[e].D00000000.dAddiction = {};
      schTmp[e].D00000000.absence = true;
    }
  });

  return schTmp;
}

const makeDAddiction = (prms) => {
  // 全ての加算情報を個々のスケジュールデータに集める
  // schTmp[uid][did].dAddinction ←ここにまとめて入れる。
  // 加算じゃないものも全部入れる
  // com[service][classroom]に対応するよ！ 2023/07/06
  
  const {
    schTmp, comAdic, comAdicJH, comAdicHH, comAdicKS, comAdicSS,
    users, schedule, stdDate  
  } = prms;
  Object.keys(schTmp).map(e => {
    // comAddicの取得方法を変更。保訪対応のため　2023/01/09
    // const thisComAdic = (schTmp[e].service === '放課後等デイサービス')
    // ?comAdic: comAdicJH;
    const thisUser = comMod.getUser(e, users);
    const usersClsrm = thisUser.classroom;
    const userHasHohou = thisUser.service.includes(HOHOU);
    Object.keys(schTmp[e]).map(f => {
      // didでない要素はスキップ
      if (!f.match(/^D[0-9]+/)) return false;
      // comAddicの取得
      let thisComAdic;
      const thisService = schTmp[e][f].service ? schTmp[e][f].service: schTmp[e].service;
      if (thisService === HOUDAY) thisComAdic = comAdic;
      if (thisService === JIHATSU) thisComAdic = comAdicJH;
      if (thisService === HOHOU) thisComAdic = comAdicHH;
      if (thisService === KEIKAKU_SOUDAN) thisComAdic = comAdicKS;
      if (thisService === SYOUGAI_SOUDAN) thisComAdic = comAdicSS;
      // 単位名の取得
      let thisClsrm = schTmp[e][f].classroom? schTmp[e][f].classroom: usersClsrm;
      // 単位名にカンマが入っていたら単位名を無視
      thisClsrm = thisClsrm?.includes(',')? '': thisClsrm;
      // クラスごとの加算 uAddictionより先に取得するのでuAddictionが優先される
      let cAddic = thisComAdic?.[thisClsrm];
      cAddic = cAddic? cAddic: {};
      // 日毎の加算要素を追加。nullを追加しても無問題
      const dayAddiction = comMod.findDeepPath(schedule, [schTmp[e].service, f]);
      // classごとの日ごと加算
      const dayAddictionCls = schedule?.[schTmp[e].service]?.[f]?.[thisClsrm] || null;


      // 追加先がnullだとエラーになるので。
      if (!schTmp[e][f].dAddiction) schTmp[e][f].dAddiction = {};
      Object.assign(schTmp[e][f].dAddiction, dayAddiction);
      Object.assign(schTmp[e][f].dAddiction, dayAddictionCls);
      // クラスごとの加算を追加
      schTmp[e][f].dAddiction = {...schTmp[e][f].dAddiction, ...cAddic};
      // ユーザーの加算要素を追加 nullを（ｒｙ
      // ユーザ毎の加算項目の取得方法を変更
      // ユーザステートではなくスケジュールの該当項目より取得を行う
      const u = comMod.getUser(e, users);
      const UID = 'UID' + u.uid;
      // 加算としての保訪の時に方法の利用者別加算が設定されていなかった問題を修正
      const hohouAsKasan = (
        (thisService === HOUDAY || thisService === JIHATSU) &&
        thisUser.service.includes(HOHOU) &&
        schedule[e][f]?.dAddiction?.保育訪問
      )
    
      // const uAddiction = comMod.findDeepPath(
      //   // schedule, [u.service, UID, 'addiction']
      //   schedule, [thisService, UID, 'addiction']
      // );
      // 加算としての保育所等訪問支援に対応
      const uAddiction = {
        ...schedule[thisService]?.[UID]?.addiction || {},
        ...(hohouAsKasan && stdDate <= '2025-06-01' ? {...schedule?.[HOHOU]?.[UID]?.addiction}: {})
      };

      // 上限額加算だけはここでは扱わない
      // 上限管理結果もここでは無視する
      if (uAddiction){
        delete uAddiction.利用者負担上限額管理加算;
        delete uAddiction.上限管理結果;
      }
      // const uAddiction = comMod.findDeepPath(u, 'etc.addiction');
      Object.assign(schTmp[e][f].dAddiction, uAddiction);
      // 事業所の（ｒｙ
      Object.assign(schTmp[e][f].dAddiction, thisComAdic);
      // 非表示アイテムには'-1'が記述されているのでそこはオミットする。
      Object.keys(schTmp[e][f].dAddiction).map(g=>{
        const thisVal = schTmp[e][f].dAddiction[g];
        if (Number(thisVal) === -1) delete schTmp[e][f].dAddiction[g];
      })
    })
  });
}

// 読みが原則ひらがななので半角カタカナに変換する
//　名字と名前の間に入っているスペースも削除する
const convName = (str) => {
  str = str.replace(' ', '');
  str = comMod.convHiraToKata(str);
  str = comMod.zen2han(str);
  return str;
}

const identifyServicecode = (prms) => {
  // schTmpに基本項目「放デイｘｘ」を格納する
  // schTmpに加算項目を追加する
  // 送迎も加算項目として追加する
  // ユーザー情報から必要な情報を集めておく
  const {
    schTmp, comAdic, comAdicJH, users, schedule, setBillingResult,
    ku, stdDate, com, comAdicHH, useAdjustetUpperLimit = true,
  } = prms
  Object.keys(schTmp).map(e => {
    const adjustetUpperLimit = useAdjustetUpperLimit 
    ? schedule?.adjustetUpperLimit?.[e] || null : null;
    const thisUser = comMod.getUser(e, users);
    schTmp[e].hno = thisUser.hno;
    schTmp[e].name = thisUser.name; // 名前は使わないがメッセージ用に
    schTmp[e].pkana = convName(thisUser.pkana);
    schTmp[e].pphone = thisUser.pphone;
    schTmp[e].kana = convName(thisUser.kana);
    schTmp[e].brosIndex = thisUser.brosIndex; // 兄弟設定を追加
    schTmp[e].scityNo = thisUser.scity_no;
    schTmp[e].scity = thisUser.scity;
    schTmp[e].startDate = thisUser.startDate.replace(/\-/g, '');
    // 契約日。入力項目になっていないので後から変更が必要
    schTmp[e].keiyakuDate = thisUser.contractDate.replace(/\-/g, '');
    const endDate = thisUser.endDate.replace(/\-/g, '');
    schTmp[e].endDate = (endDate === '00000000') ? '' : endDate;
    schTmp[e].priceLimit = Number(adjustetUpperLimit || thisUser.priceLimit);
    schTmp[e].adjustetUpperLimit = adjustetUpperLimit;
    schTmp[e].volume = thisUser.volume;
    schTmp[e].kinyuuBangou = thisUser.lineNo; // 保険証記入番号
    schTmp[e].countOfUse = 0; // 利用回数カウント
    schTmp[e].countOfKesseki = 0; // 欠席カウント
    schTmp[e].kanriType = thisUser.kanri_type;
    schTmp[e].sindex = parseInt(thisUser.sindex);
    schTmp[e].serviceSyubetu = serviceSyubetu[thisUser.service];
    // 複数サービス利用者はここを配列にする
    if (svcCnt(thisUser.service)){
      schTmp[e].serviceSyubetu = thisUser.service.split(',').map(f=>(serviceSyubetu[f]))
    }
    // 決定サービスコード 配列じゃなくて文字列としてjoinしたほうが良さそう
    const kSvcCdAry = thisUser.service.split(',').map(f=>{
      const ketteiPrms = {uid: e, users, schedule, service: f}
      return (getKetteiSeriviceCode(ketteiPrms));
    });
    schTmp[e].ketteiScode = kSvcCdAry.join(',');
    const curSchTmp = schTmp[e];
    // 上限管理事業所コード
    let jougenJi = '';
    let jougenJiName = '';
    let jougenJiSname = '';
    if (thisUser.kanri_type === '管理事業所') {
      jougenJi = com.jino;
    }
    else if (thisUser.etc && thisUser.kanri_type === '協力事業所') {
      if (thisUser.etc.管理事業所 && thisUser.etc.管理事業所.length > 0) {
        jougenJi = thisUser.etc.管理事業所[0].no;
        jougenJiName = (thisUser.etc.管理事業所[0].lname)?
          thisUser.etc.管理事業所[0].lname : thisUser.etc.管理事業所[0].name;
        jougenJiSname = thisUser.etc.管理事業所[0].name;

      }
    }
    // 事業所番号等の取得先が2024年10月ぐらいに切り替わっているのを元に戻した。なぜ変わったのかは不明
    // else if (thisUser.etc && thisUser.kanri_type === '協力事業所') {
    //   if (curSchTmp.管理事業所 && curSchTmp.管理事業所.length > 0) {
    //     jougenJi = curSchTmp.管理事業所[0].no;
    //     jougenJiName = (curSchTmp.管理事業所[0].lname)?
    //       curSchTmp.管理事業所[0].lname : curSchTmp.管理事業所[0].name;
    //     jougenJiSname = curSchTmp.管理事業所[0].name;
    //   }
    // }
    schTmp[e].jougenJi = jougenJi;
    schTmp[e].jougenJiName = jougenJiName;
    schTmp[e].jougenJiSname = jougenJiSname;
    schTmp[e].actualCost = 0;
    schTmp[e].actualCostDetail = [];
    // serviceNameBaseを選択
    // 2021/09/25 放デイの処理のため弄ってる
    // 複数サービス対応のため配列化
    const uService = schTmp[e].service;
    // const juuShingata = (uService === '放課後等デイサービス')?
    // comAdic.重症心身型: comAdicJH.重症心身型;
    let t = null;
    if (inService(uService, HOUDAY)) t = comAdic.重症心身型;
    if (inService(uService, JIHATSU)) t = comAdicJH.重症心身型;
    const juuShingata = t;
    const jhCenter = comAdicJH?.児童発達支援センター;
    // typeの設定
    let type;
    if (inService(uService, HOUDAY)){
      type = (juuShingata)? schTmp[e].type: '障害児';
    }
    else if (inService(uService, JIHATSU)){
      if (!juuShingata && !jhCenter){
        type = '障害児';
      }
      else if (juuShingata && jhCenter){
        type = schTmp[e].type;
      }
      else if (juuShingata && !jhCenter){
        type = (schTmp[e].type === '難聴児')? '障害児': schTmp[e].type;
      }
      else type = '障害児'
    }
    // 定員の定義
    t = null;
    // const teiin = (uService === '放課後等デイサービス')
    // ? comAdic.定員: comAdicJH.定員;
    if (inService(uService, HOUDAY)) t = comAdic.定員;
    if (inService(uService, JIHATSU)) t = comAdicJH.定員;
    const teiin = t;

    Object.keys(schTmp[e]).map(f => {
      // didでない要素はスキップz 
      if (!f.match(/^D[0-9]+/)) return false;
      const o = schTmp[e][f];
      // daddictionに医療ケアが含まれていたらnamebaseを切り替える
      
      // 基本項目の追加
      const baseItem = getBaseItem(
        o.dAddiction, o.offSchool, o.absence, uService, o.service, thisUser
      );
      // 加算としての登録されている保訪追加のベースアイテムを追加
      const baseItemHohouAsKAsan = getBaseItemHohouAsKasan(
        o.dAddiction, o.offSchool, o.absence, uService, o.service,
        comAdicHH
      )
      if (o.items === undefined) o.items = [];
      const items = [...o.items];
      // 相談支援の場合、baseItemが配列で返ってくることがある
      if (baseItem && !Array.isArray(baseItem)) items.push(baseItem);
      if (baseItem && Array.isArray(baseItem)) items.push(...baseItem);
      if (baseItemHohouAsKAsan) items.push(baseItemHohouAsKAsan);
      // 令和３年９月３０日までの上乗せ分
      // 保訪は非対応
      const tokubetuItem = (uService === '放課後等デイサービス')?
      houdayKasan.find(e=>e.s === tokubetuItemSc):
      jihatsuKasan.find(e=>e.s === tokubetuItemScJH)
      if (stdDate <= '2021-09-01')  items.push(tokubetuItem);

      // baseitem存在確認したら利用回数をインクリメント
      if (baseItem) schTmp[e].countOfUse++;
      if (baseItem){
        // サービスがdid配下にない場合を想定
        const service = o.service ?? schTmp[e].service.split(',')[0];
        if (!schTmp[e].countOfUseMulti){
          schTmp[e].countOfUseMulti = {};
        }
        if (schTmp[e].countOfUseMulti[service]){
          schTmp[e].countOfUseMulti[service]++
        }
        else{
          schTmp[e].countOfUseMulti[service] = 1;
        }
      }
      if (baseItemHohouAsKAsan){
        if (!schTmp[e].countOfUseMulti){
          schTmp[e].countOfUseMulti = {};
        }
        if (schTmp[e].countOfUseMulti[HOHOU]){
          schTmp[e].countOfUseMulti[HOHOU]++
        }
        else{
          schTmp[e].countOfUseMulti[HOHOU] = 1;
        }

      }
      const getKasanItemPrms = {
        addiction: o.dAddiction,
        offSchool: o.offSchool,
        absence: o.absence,
        uService,
        thisService: o.service,
        user:thisUser, uid: e, did: f,
      }
      // 加算項目の追加
      const kasanItem = getKasanItem(getKasanItemPrms);
      // 欠席に対してもカウントを実施。
      // 複数サービス対応 同じ日に違うサービスの欠席はありえないので
      // ここは一個だけ拾ってサービスごとの欠席を取得
      const kessekiItem = kasanItem.find(e=>KESSEKI_SVC_CODE.indexOf(e.s) > -1);
      if (kessekiItem){
        schTmp[e].countOfKesseki++;
        const svcNm = getSvcNameByCd(kessekiItem.s);
        if (!schTmp[e].countOfKessekiMulti){
          schTmp[e].countOfKessekiMulti = {}
        }
        if (!schTmp[e].countOfKessekiMulti[svcNm]){
          schTmp[e].countOfKessekiMulti[svcNm] = 1;
        }
        else{
          schTmp[e].countOfKessekiMulti[svcNm]++;
        }
      }
      // 欠席の場合の相談支援加算などは欠席でも利用カウント追加
      // 事業所内相談支援加算はカウントされない？
      // if (!baseItem && o.absence){
      //   if (kasanItem.find(e=>SOUDANSIEN_SVC_CODE.indexOf(e.s) > -1)){
      //     schTmp[e].countOfUse++;
      //   }
      //   if (kasanItem.find(e=>KATEI_SVC_CODE.indexOf(e.s) > -1)){
      //     schTmp[e].countOfUse++;
      //   }
      // }
      items.push(...kasanItem);
      let transfer;
      if (inService(uService, HOUDAY)){
        transfer = getTrasferItem(o.transfer, o.absence, o.dAddiction, HOUDAY, thisUser, stdDate);
      }
      else if (inService(uService, JIHATSU)){
        transfer = getTrasferItem(o.transfer, o.absence, o.dAddiction, JIHATSU, thisUser, stdDate);
      }
      if (transfer){
        items.push(...transfer);
      }
      // 管理事業所の場合、上限管理加算をここで入れる
      // 日付オブジェクト配下ではなくitemTotalに直接入れる 2021/09/10
      // if (thisUser.kanri_type === '管理事業所')
      //   items.push(JOUGEN_KANRI);
      // 実費項目の積算
      if (o.actualCost && typeof o.actualCost === 'object'){
        Object.keys(o.actualCost).map(f=>{
          if (o.absence && o.reserve) return false;
          if (o.absence && f && !f.startsWith('+') && !f.endsWith('+')) return false;
          schTmp[e].actualCost += parseInt(o.actualCost[f]);
          // 実費明細作成
          const detail = schTmp[e].actualCostDetail;
          // 2022/01/24 MTU対策
          // 実費自由項目対応
          let i;
          if (o.classroom){
            i = detail.findIndex(g => (
              g.name === f && g.classroom === o.classroom
              && o.actualCost[f] == g.unitPrice
            ));
          }
          else{
            i = detail.findIndex(g => 
              g.name === f && o.actualCost[f] && o.actualCost[f] == g.unitPrice
            );
          }
          // 更新
          if (i >  -1){
            detail[i].count++;
            detail[i].price += parseInt(o.actualCost[f]);
          }
          // 追加
          else{
            detail.push({ 
              name: f, count: 1, 
              price: parseInt(o.actualCost[f]),
              unitPrice: parseInt(o.actualCost[f]),
            });
            // 2022/01/24 MTU対策
            if (o.classroom){
              detail[detail.length - 1].classroom = o.classroom;
            }
          }
        });
      }
      // 実費明細の*を削除
      schTmp[e].actualCostDetail.forEach(e=>{
        if (e.name.endsWith('+')) e.name = e.name.slice(0, -1);
        if (e.name.startsWith('+'))e.name = e.name.slice(1);
      });
      schTmp[e][f].items = [...items];
    });
  });
}
// 加算として設定された保訪のサービスに対して加算アイテムを追加する
// schTmp[UID][DID].itemsに追加される
// 今のところ保訪の加算を取り直すようにする
const addKsanItemsForMixedService = (prms) => {
  const {
    schTmp, comAdic, comAdicJH, comAdicHH, users, schedule, setBillingResult,
    ku, stdDate, com,
  } = prms;
  Object.keys(schTmp).map(e=>{
    const user = comMod.getUser(e, users);
    Object.keys(schTmp[e]).filter(f=>f.match(/^D2\d*/)).map(f=>{
      const its = [...schTmp[e][f].items];
      // itemtotalに記載されているサービスコードから利用されているサービス名の配列を得る
      const svcs = Array.from(new Set(its.map(e=>getSvcNameByCd(e.s))));
      // サービスが一個なら処理を行わない
      if (svcs.length < 2) return false;
      // 今のところこれはありえんが保訪が含まれていなかったら処理は行わない
      if (!svcs.includes(HOHOU)) return false;
      const dAddiction = schTmp[e][f].dAddiction;
      // DADDICTION_HOHOUに定義されている加算項目があったら取得する
      const fromDa = DADDICTION_HOHOU.reduce((v, x)=>{
        if (x in dAddiction){
          v[x] = dAddiction[x]
        }
        return v;
      }, {})
      // 現在のサービスコードの配列を得る
      const svcsCds = Array.from(new Set(its.map(e=>e.s)));
      const getKasanItemPrms = {
        addiction: {...comAdicHH, ...fromDa},
        offSchool: 0,
        teiin: 0,
        kubun: '',
        absence: false,
        uService: user.service,
        thisService: HOHOU,
        type: user.type,
        user, did: f,
      }
      const ksn = getKasanItem(getKasanItemPrms);
      // 現在のアイテムとかぶらないようにする
      const newIts = ksn.filter(e=>!svcsCds.includes(e.s));
      console.log(newIts, 'newIts');
      schTmp[e][f].items = [...its, ...newIts];
    })
  })
}

// モニタリング日の設定
// 相談支援のみで機能する
// モニタリング日は利用支援か継続支援を行った場合のみ設定されるっぽい
const setMonitorDate = (schTmp, stdDate) => {
  // UIDの配列を得る
  const uidArr = Object.keys(schTmp).filter(e=>e.match(/^UID[0-9]+/));
  if (!uidArr.length) return;
  // schTmpの先頭を確認して相談支援意外だったら終了する
  const svc = schTmp[uidArr[0]].service;
  if (![KEIKAKU_SOUDAN, SYOUGAI_SOUDAN].includes(svc)){
    return false;
  }
  
  const SvcCdArr = (()=>{
    if (svc === KEIKAKU_SOUDAN){
      return keikakuSoudanService.map(e=>e.s);
    }
    else if (svc === SYOUGAI_SOUDAN){
      return syougaiSoudanService.map(e=>e.s);
    }
    else return [];
  })();

  uidArr.forEach(uid=>{
    // ユーザー一人分のschTmp
    const o = schTmp[uid];
    // このユーザが算定しているサービスコードを列挙する
    const thisSvcCd = o.itemTotal.map(e=>e.s);
    // ユーザーが算定しているサービスに基本サービスが含まれているか判定
    const isBasicSvc = thisSvcCd.some(svcCode => SvcCdArr.includes(svcCode));
    if (isBasicSvc){
      const firstDid = Object.keys(o).filter(e=>e.match(/^D2[0-9]+/))[0];
      const monDate = comMod.zp(o?.[firstDid]?.dAddiction?.モニタリング日 ?? 1, 2);
      o.monitorDate = stdDate.replace(/-/g, '').slice(0, 6) + monDate;
    }
  })

}
// itemtotalに計上されない処遇改善等が入ることがあるため削除を行う
const removeZeroItemsFromItemTotal = (schTmp) => {
  // UIDの配列を準備
  const uidsAry = Object.keys(schTmp).filter(e=>e.match(/^UID\d+/));
  uidsAry.forEach(uids=>{
    const itemTotal = schTmp[uids].itemTotal;
    const newItemTotal = itemTotal.filter(e=>e.tanniNum);
    schTmp[uids].itemTotal = newItemTotal;
  })
}

// schtmpに算定時間を記載する
const setSanteiJikanToSch = (schTmp) => {
  const uids = Object.keys(schTmp).filter(e=>e.match(/^UID\d+/));
  uids.forEach(uid=>{
    const dids = Object.keys(schTmp[uid]).filter(e=>e.match(didPtn));
    let santeiJikanTotal = 0;
    dids.forEach(did=>{
      const oneDayBdt = schTmp[uid][did];
      if (oneDayBdt.absence) return;
      // 保訪の時に開始終了時間が含まれることあり。
      if (oneDayBdt.service === HOHOU) return;
      let santeiJikan = getSanteciJikanOneDay(oneDayBdt);
      santeiJikan = Math.floor(santeiJikan * 100);
      oneDayBdt.santeiJikan = santeiJikan;
      santeiJikanTotal += santeiJikan;
    });
    schTmp[uid].santeiJikanTotal = santeiJikanTotal;
  })
}
// 通所自立支援加算: 2を分解するため
// 末尾にアンダーバーを付与する
const makeMulltiCode = schTmp => {
  const uidsa = amdcm.getUidsArray(schTmp);
  uidsa.forEach(uids=>{
    const dida = amdcm.getDidArray(schTmp[uids]);
    dida.forEach(did=>{
      const dAddic = schTmp[uids][did]?.dAddiction;
      if (dAddic?.通所自立支援加算 && Number(dAddic?.通所自立支援加算) === 2){
         // アンダーバーを付けて加算項目を二重化
        dAddic.通所自立支援加算 = 1;
        dAddic.通所自立支援加算_ = 1;
      }
    })
  })
}

// 日ごとの設定により個別サポート加算を変更する
const tweekKobetsuSupport = schTmp => {
  const uidsa = amdcm.getUidsArray(schTmp);
  uidsa.forEach(uids=>{
    const dida = amdcm.getDidArray(schTmp[uids]);
    const pair = ['個別サポート加算１', '個別サポートⅠ１設定'];
    const trg = '個別サポート加算１';
    const src = '個別サポートⅠ１設定';
    dida.forEach(did=>{
      const dAddic = schTmp[uids][did]?.dAddiction ?? {};
      const keys = Object.keys(dAddic);
      // ターゲットの個別サポート加算と個別サポート設定が存在するか
      if (pair.every(e=>keys.includes(e))){
        if (Number(dAddic[trg]) <= 2){
          dAddic[trg] = dAddic[src];
        }
      }
    })
  })
}

// 強度行動障害児支援加算を無効化する
const disableKyoudokoudou = (schTmp, schedule, serviceItems) => {
  const existMukouka = (() => {
    let exist = false;
    serviceItems.forEach(svc => {
      if (!schedule[svc]) return;
      const dida = amdcm.getDidArray(schedule[svc]);
      dida.forEach(did => {
        if (schedule[svc][did]?.強度行動障害児支援加算無効化) {
          exist = true;
        }
      });
    });
    return exist;
  })();
  if (!existMukouka) return;
  const uidsa = amdcm.getUidsArray(schTmp);
  uidsa.forEach(uids=>{
    const dida = amdcm.getDidArray(schTmp[uids]);
    dida.forEach(did=>{
      const dAddic = schTmp[uids][did]?.dAddiction ?? {};
      if (dAddic?.強度行動障害児支援加算無効化){
        delete dAddic.強度行動障害児支援加算;
        delete dAddic.強度行動障害児支援加算９０日以内;
      }
    })
  })
}
// 相談支援で発生してしまう余分な加算アイテムを削除する
// 定義された加算アイテムは基本報酬が無いときは削除を行う
const removeExtraItemsSoudan = (schTmp, serviceItems) => {
  if (![SYOUGAI_SOUDAN, KEIKAKU_SOUDAN].some(item => serviceItems.includes(item))) return;
  const toRemove = [
    '主任相談支援専門員配置加算',
    '要医療児者支援体制加算',
    '精神障害者支援体制加算',
    '高次脳機能障害支援体制加算',
    'ピアサポート体制加算',
    '行動障害支援体制加算',
  ];
  const uidsa = amdcm.getUidsArray(schTmp);
  uidsa.forEach(uids=>{
    const dida = amdcm.getDidArray(schTmp[uids]);
    dida.forEach(did=>{
      const items = schTmp[uids][did]?.items ?? [];
      const baseItem = items.find(e=>e.baseItem);
      if (baseItem) return;
      toRemove.forEach(e=>{
        const i = items.findIndex(f=>f.name === e);
        if (i > -1) items.splice(i, 1);
      })
    })
  })
}

const connNanToZeo = (schTmp) => {
  const uidsa = amdcm.getUidsArray(schTmp);
  // ゼロに変換するプロパティ名
  const convZero = ['kanriKekka', 'ketteigaku', 'kanrikekkagaku']
  uidsa.forEach(uids=>{
    const dt = schTmp[uids];
    convZero.forEach(item=>{
      if (dt.hasOwnProperty(item) && isNaN(dt[item])) dt[item] = 0;
    });
  })

}

// 兄弟間で上限管理加算を調整する
// 
// 【目的】上限管理加算のみが存在する請求を回避する
// 
// 【処理概要】
// 1. brosIndex === 1のユーザーを起点に各兄弟グループを処理
// 2. 兄弟内でitemTotalに上限管理加算のみを持つユーザーを検索
// 3. 見つかった場合、他の兄弟で以下の条件を満たす移動先を探す:
//    - 上限管理加算以外のアイテムを持っている
//    - まだ上限管理加算を持っていない（兄弟で一人のみ保持可能）
// 4. 移動先が見つかれば上限管理加算を移動し、元のitemTotalを空配列にする
// 5. 移動先が見つからない場合は何もせず終了
// 2026/01/01 移行は廃止。請求金額が存在しないのに上限管理ファイルだけ作成する必要が発生するため
const adjustJougenkanriKasanBetweenBros = (
  schTmp, users, stdDate, 
  startStdDate = kyoudaiJougen2511,
  endStdDate = kyoudaiJougen2601
) => {
  
  if (stdDate < startStdDate || stdDate >= endStdDate ) return;
  // 上限管理加算のサービスコード一覧を取得
  const jougenSvcCodes = Object.keys(JOUGEN_KANRI).map(e => JOUGEN_KANRI[e].s);
  
  const uidsa = amdcm.getUidsArray(schTmp);
  
  // brosIndex === 1のユーザーのみを処理対象とする
  uidsa.forEach(uids => {
    const thisUser = comMod.getUser(uids, users);
    if (!thisUser || parseInt(thisUser.brosIndex) !== 1) return;
    
    // 兄弟を取得（ユーザーオブジェクトの配列をUID文字列の配列に変換）
    const bros = comMod.getBrothers(uids, users, true).map(e => 'UID' + e.uid);
    if (!bros || bros.length === 0) return;
    
    
    // 上限管理加算のみを持つ兄弟を探す
    let jougenOnlyBro = null;
    let jougenItems = null;
    
    for (const bUids of bros) {
      const bSchTmp = schTmp[bUids];
      if (!bSchTmp || !Array.isArray(bSchTmp.itemTotal) || bSchTmp.itemTotal.length === 0) {
        continue;
      }
      
      const itemTotal = bSchTmp.itemTotal;
      const jougen = itemTotal.filter(item => jougenSvcCodes.includes(item.s));
      // method: "syoguu" は無視して、上限管理加算以外のアイテムを抽出
      const others = itemTotal.filter(item => 
        !jougenSvcCodes.includes(item.s) && item.method !== 'syoguu'
      );
      
      
      // 上限管理加算のみの場合（method: "syoguu"は無視）
      if (jougen.length > 0 && others.length === 0) {
        jougenOnlyBro = bUids;
        jougenItems = jougen;
        break;
      }
    }
    
    // 上限管理加算のみの兄弟が見つかった場合、移動先を探す
    if (jougenOnlyBro && jougenItems) {
      let moved = false;
      
      for (const bUids of bros) {
        if (bUids === jougenOnlyBro) continue;
        
        const bSchTmp = schTmp[bUids];
        if (!bSchTmp || !Array.isArray(bSchTmp.itemTotal)) {
          console.log(`  UID ${bUids}: itemTotalなし`);
          continue;
        }
        
        const itemTotal = bSchTmp.itemTotal;
        // method: "syoguu" は無視して、上限管理加算以外のアイテムを持っているかチェック
        const hasOtherItems = itemTotal.some(item => 
          !jougenSvcCodes.includes(item.s) && item.method !== 'syoguu'
        );
        const hasJougen = itemTotal.some(item => jougenSvcCodes.includes(item.s));
        
        
        // 上限管理加算以外を持ち、まだ上限管理加算を持っていない兄弟に移動
        if (hasOtherItems && !hasJougen) {
          jougenItems.forEach(item => bSchTmp.itemTotal.push({...item}));
          schTmp[jougenOnlyBro].itemTotal = [];
          moved = true;
          break;
        }
      }
      
      if (!moved) {
        // console.log(`  移動先が見つかりませんでした`);
      }
    }
  });
}

// Scheduleオブジェクトをdeep COPYして
// 事業所ごと、日毎、ユーザーごとの加算アイテムをuid.didにまとめる
// 加算で入力設定されたオブジェクトからサービスコードを特定してuid.did.itemsに
// まとめる

export const setBillInfoToSch = (prms, userlist = []) => {
  const { 
    stdDate, schedule, users, com, service, serviceItems, classroom,
    calledBy, useAdjustetUpperLimit = true,
  } = prms;
  if (calledBy){
    console.log(`%c${calledBy}`, 'color: red; background-color: yellow;')
  }

  if (!CALC2024) return [];

  const hasHouday = serviceItems.indexOf('放課後等デイサービス') > -1;
  const hasJihatsu = serviceItems.indexOf('児童発達支援') > -1;
  const hasHohou = serviceItems.indexOf('保育所等訪問支援') > -1;
  const hasKeikakuSoudan = serviceItems.includes(KEIKAKU_SOUDAN);
  const hasSyougaiSoudan = serviceItems.includes(SYOUGAI_SOUDAN);
  // 児発の項目も追加
  const comAdic = (hasHouday)? com.addiction.放課後等デイサービス: {};
  const ku = hasHouday? comAdic?.サービス提供時間区分: '';
  // const teiin = parseInt(comAdic.定員);
  const comAdicJH = (hasJihatsu)? com.addiction.児童発達支援: {};
  const comAdicHH = (hasHohou)? com.addiction.保育所等訪問支援: {};
  const comAdicKS = (hasKeikakuSoudan)? com.addiction[KEIKAKU_SOUDAN]: {};
  const comAdicSS = (hasSyougaiSoudan)? com.addiction[SYOUGAI_SOUDAN]: {};
  const discCommon = 'の請求に必要な情報がありません。設定->加算・請求の項目を見直してください。'
  // 該当サービスの事業所情報オブジェクトが存在しない場合、エラーで終了
  if (hasHouday && !comAdic){
    const errDetail = {
      description: '放課後等デイサービス' + discCommon
    }
    return {billingDt: [], masterRec: {}, result: false, errDetail};
  }
  // 該当サービスの事業所情報オブジェクトが存在しない場合、エラーで終了
  if (hasJihatsu && !comAdicJH){
    const errDetail = {
      description: '児童発達支援' + discCommon
    }
    return {billingDt: [], masterRec: {}, result: false, errDetail};
  }
  if (hasHohou && !comAdicHH){
    const errDetail = {
      description: '保育所等訪問支援' + discCommon
    }
    return {billingDt: [], masterRec: {}, result: false, errDetail};
  }
  if (hasKeikakuSoudan && !comAdicKS){
    const errDetail = {
      description: KEIKAKU_SOUDAN + discCommon
    }
    return {billingDt: [], masterRec: {}, result: false, errDetail};
  }
  if (hasSyougaiSoudan && !comAdicSS){
    const errDetail = {
      description: SYOUGAI_SOUDAN + discCommon
    }
    return {billingDt: [], masterRec: {}, result: false, errDetail};
  }

  // schtmp作成
  const schTmp = makeSchTmp(users, schedule);
  // 算定時間を記載
  setSanteiJikanToSch(schTmp);
  // 算定時間を付与する
  // 加算に関係のない送迎を削除する
  deleteNoCountTransfer(schTmp);
  // 結果セット用のオブジェクト定義
  const setBillingResult = {result: true};
  const cPrms = {
    schTmp, comAdic, comAdicJH, comAdicHH, comAdicKS, comAdicSS, 
    users, schedule, setBillingResult,
    ku, stdDate, com, useAdjustetUpperLimit,
  };
  // dAddiction作成
  makeDAddiction(cPrms);

  // 日ごとの設定により個別サポート加算を変更する
  tweekKobetsuSupport(schTmp);
  // 強度行動障害児支援加算を無効化する
  disableKyoudokoudou(schTmp, schedule, serviceItems);
  // 一つのdAddictionで複数の加算アイテム等を作成するために
  // 通称自立支援の往復を二つのサービスコードに分解するため
  makeMulltiCode(schTmp);

  // サービスコードを特定する
  identifyServicecode(cPrms);

  // 相談支援で発生してしまう余分な加算アイテムを削除する
  removeExtraItemsSoudan(schTmp, serviceItems);

  // 加算として設定された保訪のサービスに対して加算アイテムを追加する
  // schTmp[UID][DID].itemsに追加される
  addKsanItemsForMixedService(cPrms);

  if (!setBillingResult.result){
    return setBillingResult;
  }
  // マスターレコード 単価や各種集計値などを格納する
  // [今月]は実行時の日付から作成する
  // 放デイと児発の単価をそれぞれ求める。
  // 相違がある場合はここにワーニングだけ仕込んでおく。
  // 地域区分についても複数設定されていたらワーニングを仕込む
  // --------　単価
  const unitPriceSet = new Set();
  console.log(unitPrice, 'unitPrice');
  serviceItems.map(e=>{
    const js = (parseInt(com.addiction[e].重症心身型) === 1)? '重心': '';
    unitPriceSet.add(unitPrice[e + js][com.addiction[e].地域区分])  
  });
  const up = Array.from(unitPriceSet)[0];
  const unitPriceWarning = (unitPriceSet.size > 1)
  ?'複数の単価が存在します。':'';
  // 保訪は単価が違う！
  const unitPricies = {};
  serviceItems.forEach(e=>{
    // 重新型は単価が違うのでキーの名前を変える
    const js = (parseInt(com.addiction[e].重症心身型) === 1)? '重心': '';
    const center = (parseInt(com.addiction[e].児童発達支援センター) === 1);
    unitPricies[e] = unitPrice[e + js][com.addiction[e].地域区分];
    if (center){
      unitPricies[e] = unitPrice['児童発達支援センター'][com.addiction[e].地域区分];
    }    
  });
  const chiikiKubunList = serviceItems.map(e=>(
    {[e]: chiikiKubun[com.addiction[e].地域区分]})
  );
  // 地域区分を得る
  const getChiikiKubun = () => {
    if (serviceItems.includes(HOUDAY)) return chiikiKubun[comAdic.地域区分]
    if (serviceItems.includes(JIHATSU)) return chiikiKubun[comAdicJH.地域区分]
    if (serviceItems.includes(HOHOU)) return chiikiKubun[comAdicHH.地域区分]
    // 計画相談支援のみ地域区分が違う
    if (serviceItems.includes(KEIKAKU_SOUDAN)) return chiikiKubunAdult[comAdicKS.地域区分]
    if (serviceItems.includes(SYOUGAI_SOUDAN)) return chiikiKubun[comAdicSS.地域区分]
  }
  const masterRec = { 
    unitPrice: up, unitPriceWarning,
    // 地域区分の取得。児発単体の時地域区分が取得できなかった。
    // 放デイがない時は児発のコードから拾う
    // 2022/06/15
    // 保訪単独の場合もあるので地域区分出力を追加する
    // chiikiKubun: chiikiKubun[comAdic.地域区分?comAdic.地域区分: comAdicJH.地域区分],
    chiikiKubun: getChiikiKubun(),
    jino: com.jino,
    thisMonth: stdDate.substr(0, 7).replace('-', ''), 
    curMonth: comMod.formatDate(new Date(), 'YYYYMM'),
    unitPricies, chiikiKubunList,
  };
  // 単位のリストを作る
  const clsTmp = [];
  users.map(e=>{
    const clr = e.classroom;
    if (!Object.keys(e).length) return false;
    if (Array.isArray(clr)) clsTmp.push(...clr);
    else if (clr.indexOf(',')) clsTmp.push(...clr.split(','));
    else clsTmp.push(clr);
  })
  const classroomList = Array.from(new Set(clsTmp));

  // Object.keys(schTmp).filter(e=>/^UID/.test(e)).forEach(e=>{
  //   Object.keys(schTmp[e]).filter(f=>/^D2/.test(f)).forEach(f=>{
  //     const o = schTmp[e][f];
  //     if (o.offSchool === undefined){
  //       console.log('offschool undef', schTmp[e].name, e, f);
  //     }
  //   })
  // });
  // 登録済みの無効な管理事業所、協力医事業所を削除する
  killInvalidOtherOfficeis(schTmp, users);
  // 児発無償化の判断を行う。
  isMusyouka(schTmp);
  // 多子軽減の判断
  isTashikeigen(schTmp);
  // サービスアイテムなどを集計する
  totalizeItems(schTmp, masterRec, users, schedule, stdDate, );
  // 上限管理加算を兄弟間で調整する。上限管理加算のみの請求を行わないようにする
  adjustJougenkanriKasanBetweenBros(schTmp, users, stdDate);
  // モニタリング日を設定する 相談支援用
  setMonitorDate(schTmp, stdDate);

  // 処遇改善加算などもここで行う
  syoguuKaizenAndSantei(schTmp, masterRec, users, '', undefined, stdDate);
  // MTUが存在するか
  // let svcByUserMax = 0;
  // users.forEach(e => {
  //   const v = amdcm.classroomCount(e);
  //   if (v > svcByUserMax) svcByUserMax = v;
  // });
  const existMtu = amdcm.getExistMtu(users);
  const classrooms = amdcm.getClassrooms(users);
  // mtuが存在したら単位別の売上を求める
  if (classrooms.length > 1 && existMtu){
    classrooms.map(e=>{
      totalizeItems(schTmp, masterRec, users, schedule, stdDate, e);
      syoguuKaizenAndSantei(schTmp, masterRec, users, e, undefined, stdDate);
    })
  }
  // 放デイに残った児発無償化を無効化する
  killMusyouka(schTmp);
  // 横浜市独自のやつ
  setYokohamaJougen(schTmp, users, schedule);
  // 兄弟調整を行う
  makeBrosTyousei(schTmp, com.jino, users, schedule, stdDate);
  // 上限管理を作成する！！！
  makeUpperLimit(schTmp, stdDate, serviceItems);
  // 事業所間上限管理値を決定した上で兄弟の上限値管理結果などを兄弟用のレコードに記載する。
  makeBrosRecord(schTmp, users);
  // 横浜上限菜調整
  setYokohamaAgein(schTmp, users, schedule);
  // 上限月額調整額を入れる。兄弟のみ調整が必要らしい！！！！
  makeBrosGetsugakutyousei(schTmp, users);
  // 兄弟上限のときの上限管理結果と上限管理加算を調整する
  if (stdDate >= kyoudaiAutoTyousei){
    recalcBrosParams(schTmp, users, schedule);
  }
  // 処遇改善再計算
  syoguuKaizenAndSantei(schTmp, masterRec, users, '', true, stdDate);
  // syoguuKaizenAndSantei(schTmp, masterRec, users, classroom, true);
  if (classrooms.length > 1 && existMtu){
    classrooms.map(e=>{
      syoguuKaizenAndSantei(schTmp, masterRec, users, e, true, stdDate);
    })
  }
  // 単位数が計上されないアイテムを削除
  removeZeroItemsFromItemTotal(schTmp);
  // 管理結果手動設定の反映
  setForthKanriKekka(schTmp, schedule, users);
  
  // 自治体助成
  makeJichitaiJosei(schTmp, com, users);
  // 独自上限額がある場合の自治体助成金配分
  // 現状他社との上限管理のみ 兄弟上限がある場合は別途修正が必要
  makeDokujiJougenHaibun(schTmp, com, users);
  // 独自上限の兄弟間配分
  mekeDokujiJougenKyoudaiHaibun(schTmp, com, users);
  // 手動自治体助成金
  makeManualJichiJosei(schTmp, schedule);
  // 助成自治体番号を再調整する
  justfyJoseiNo(schTmp, com, users);
  // 複数サービス利用時の自治体助成額を調整する
  justifyJouseigaku(schTmp, com, users);

  // 市区町村、サービス別の集計をマスターレコードに記載
  totlizeCityAndService(schTmp, masterRec, userlist);
  // 18歳以上の処理を行う
  convNameOver18(schTmp, users);
  // 上限管理の不具合などでkanriKekkaなどにNaNが格納されるのを抑制
  connNanToZeo(schTmp);
  // 市区町村別にソート
  const billingDt = schTmpToArray(schTmp, userlist, stdDate);
  // サービス種別順にもソートが必要
  // 複数サービスの場合ここは機能しないので意味ないかも
  billingDt.sort((a, b)=>(
    a.scityNo+a.serviceSyubetu > b.scityNo+b.serviceSyubetu? 1: -1
  ));
  console.log('schTmp', schTmp);
  console.log('billingDt', billingDt);
  // console.log('masterRec', masterRec);
  // const houdayUniqKasan = Array.from(new Set(houdayKasan.map(e=>e.name)));
  // const jihatsuUniqKasan = Array.from(new Set(jihatsuKasan.map(e=>e.name)));
  // const houdaySvcGensan = houdySirvice.reduce((v, e)=>{
  //   const t = [...v, ...e.c.split('・')];
  //   return Array.from(new Set(t));
  // }, []).filter(e=>!e.includes('放デイ') && e);
  // const jihatsuSvcGensan = jihatsuService.reduce((v, e)=>{
  //   const t = [...v, ...e.c.split('・')];
  //   return Array.from(new Set(t));
  // }, []).filter(e=>!e.includes('児発') && e);
  // console.log(houdayUniqKasan, 'houdayUniqKasan');
  // console.log(jihatsuUniqKasan, 'jihatsuUniqKasan');
  // console.log(houdaySvcGensan, 'houdaySvcGensan');
  // console.log(jihatsuSvcGensan, 'jihatsuSvcGensan');
  console.log('----running 2024');

  return { billingDt, masterRec, result: true, schTmp};
}

const csvHaed = (outputRec, masterRec, syubetu) =>{
  // 1, REC_NO, 0, REC_CNT, 'K11', 0, JI_NO, 0, 1, THIS_MONTH, 0
  outputRec.push([...headRec]);
  erl(outputRec, JI_NO, masterRec.jino);
  erl(outputRec, THIS_MONTH, masterRec.curMonth);
  erl(outputRec, HEAD_SYUBETU, syubetu);

}
// K112基本 市区町村ごと合計行}
// 引数で渡される市区町村番号により処理を行う
// masterrec.totalizedは放デイ児発の複数データが含まれていることがあるのでそれを合算する
// 利用者複数サービス対応について変更は発生しないと思われる
// 複数サービスの場合もこれで合算されるはず 2023/02/18
const billingCsvK112_1 = (outputRec, masterRec, scity) =>{
  // 2, REC_NO, 'K112', 1, THIS_MONTH, SCITY_NO, JI_NO, TOTAL_AMOUNT, TOTAL_COUNT, TOTAL_TANNI, TOTAL_AMOUNT, TOTAL_BILLED, 0, TOTAL_USER_BILLED, 0, 0, 0, 0, 0,
  //   TOTAL_COUNT, TOTAL_TANNI, TOTAL_AMOUNT, TOTAL_BILLED, TOKUBETSU_TAISAKU,
  //   TOTAL_USER_BILLED, 0,
  const matched = masterRec.totalized.filter(e=>e.scityNo===scity);
  const userSanteiTotal = matched.reduce((v, e)=>(v + e.userSanteiTotal), 0);
  const countOfUsers = matched.reduce((v, e)=>(v + e.countOfUsers), 0);
  const tanniTotal = matched.reduce((v, e)=>(v + e.tanniTotal), 0);
  const kanrikekkagaku = matched.reduce((v, e)=>(v + e.kanrikekkagaku), 0);
  const jichiJosei = matched.reduce((v, e)=>(v + Number(e.jichiJosei)), 0);
  outputRec.push([...kihonK112_1]);
  erl(outputRec, THIS_MONTH, masterRec.thisMonth);
  erl(outputRec, SCITY_NO, scity);
  erl(outputRec, JI_NO, masterRec.jino);
  erl(outputRec, TOTAL_AMOUNT, userSanteiTotal);
  erl(outputRec, TOTAL_COUNT, countOfUsers);
  erl(outputRec, TOTAL_TANNI, tanniTotal);
  // 給付請求額 合計からユーザー負担を除算
  erl(outputRec, TOTAL_BILLED, userSanteiTotal - kanrikekkagaku);
  // 請求額に自治体助成を含んだもの
  erl(
    outputRec, TOTAL_BILLED1, 
    userSanteiTotal - kanrikekkagaku + jichiJosei
  );
  // 自治体助成金関連で処理追加
  erl(outputRec, TOTAL_USER_BILLED, kanrikekkagaku - jichiJosei);
  erl(outputRec, JICHITAI_JOSEI, jichiJosei);
}
// K112明細 サービス種別毎の明細。自発と放デイは別レコードになる
// 引数で与えられた市区町村番号でフィルタを掛けて出力する。
// 複数サービス対応 にて変更なしと思われる。masterRec側の変更にて対応済み
const billingCsvK112_2 = (outputRec, masterRec, scity) =>{
  // 2, REC_NO, 'K112', 2, THIS_MONTH, SCITY_NO, JI_NO, 1, S_SYUBETSU,
  // SRVC_COUNT_TOTAL, SRVC_TANNI_TOTAL, SRVC_AMOUNT, SRVC_BILLED, 0,
  // SRVC_USER_BILLED, 0,
  const matched = masterRec.totalized.filter(e=>removeAsterisk(e.scityNo)===scity);
  matched.map(e=>{
    outputRec.push([...meisaiK112_2]);
    erl(outputRec, THIS_MONTH, masterRec.thisMonth);
    erl(outputRec, SCITY_NO, e.scityNo);
    erl(outputRec, JI_NO, masterRec.jino);
    erl(outputRec, S_SYUBETSU, e.serviceSyubetu);
    erl(outputRec, SRVC_COUNT_TOTAL, e.countOfUsers);
    erl(outputRec, SRVC_TANNI_TOTAL, e.tanniTotal);
    erl(outputRec, SRVC_AMOUNT, e.userSanteiTotal);
    // 給付請求額 合計からユーザー負担を除算
    erl(outputRec, SRVC_BILLED, e.userSanteiTotal - e.kanrikekkagaku);
    // 利用者負担額 自治体助成を除算
    erl(outputRec, SRVC_USER_BILLED, e.kanrikekkagaku - Number(e.jichiJosei));
    erl(outputRec, JICHITAI_JOSEI, e.jichiJosei);
    })
}

const billingCsvK122_4 = (outputRec, masterRec, thisDt) => {
  // 2, REC_NO, 'K122', 4, THIS_MONTH, SCITY_NO, 
  // JI_NO, H_NO, S_SYUBETSU,
  // SYUUKEI_BUNRUI,  SRVC_COUNT,
  // USER_TANNI, KYUUFU_TANKA, 0, TOTAL_BILLED, ICHIWARI1, ICHIWARI2, 
  // GETSUGAKU_TYOUSEI,  '', '', TYOUSEIGO_USER_BILLED, 
  // JOUGEN_USER_BILLED, KETTEI_USER_BILLED, KETTEI_TOTAL_BILLED, 
  // 上限値と残高を定義
  
  // 複数サービスの場合の上限額の按分用
  let plLess = parseInt(thisDt.priceLimit); 
  const priceLimit = parseInt(thisDt.priceLimit);
  // 複数サービスの場合の管理結果額按分用
  let kanrikekkaLess = parseInt(thisDt.kanrikekkagaku);

  // 複数サービスを使っているか それそれの単位数に値が存在すればビンゴ
  const isMultiSvc = thisDt.tanniTotalSvc && (Object.keys(thisDt.tanniTotalSvc).length > 1);
  // 利用しているサービスからループすべきサービスコードを取得してソート
  let serviceSyubetuCd;
  if (isMultiSvc){
    serviceSyubetuCd = Object.keys(thisDt.tanniTotalSvc)
    .map(e => serviceSyubetu[e]).sort((a, b)=>(a < b? -1: 1));
  }
  else{
    serviceSyubetuCd = thisDt.serviceSyubetu;
  }
  // サービス種別ごとに複数レコードを出力する。
  serviceSyubetuCd.forEach((e, i)=>{
    const svcName = getSvcNameByCd(e);
    // 単位数が存在しないときは出力しない
    if (thisDt.tanniTotalSvc && !thisDt.tanniTotalSvc[svcName]) return false;
    outputRec.push([...syuukeiK122_4]);
    erl(outputRec, THIS_MONTH, masterRec.thisMonth);
    erl(outputRec, SCITY_NO, thisDt.scityNo);
    erl(outputRec, JI_NO, masterRec.jino);
    erl(outputRec, H_NO, thisDt.hno);
    erl(outputRec, S_SYUBETSU, e); // 配列のエレメントがサービス種別
    let countOfUse, tanniTotal, unitPrice;
    if (isMultiSvc){
      countOfUse = (thisDt?.countOfUseMulti?.[svcName] || 0)
       + comMod.fdp(thisDt, ['countOfKessekiMulti', svcName], 0)
       countOfUse = (thisDt.userSanteiTotal && !countOfUse)? 1: countOfUse;
       tanniTotal = thisDt.tanniTotalSvc[svcName];
      //  unitPrice = masterRec.unitPricies[svcName];
    }
    else{
      // ユーザー算定がされていて利用回数が0なら1にする
      countOfUse = thisDt.countOfUse + thisDt.countOfKesseki;
      countOfUse = (thisDt.userSanteiTotal && !countOfUse)? 1: countOfUse;
      tanniTotal = thisDt.tanniTotal;
      // unitPrice = masterRec.unitPrice;
    }
    // 複数単価があるときは常に複数単価を取得する
    unitPrice = masterRec.unitPricies? masterRec.unitPricies[svcName]: masterRec.unitPrice;

    erl(outputRec, SRVC_COUNT, countOfUse);
    erl(outputRec, USER_TANNI, tanniTotal);
    erl(outputRec, KYUUFU_TANKA, unitPrice * 1000);
  
    const totalBilled = Math.floor(
      (unitPrice*100) * tanniTotal / 100
    );
    erl(outputRec, TOTAL_BILLED, totalBilled);
    const ichiwari = Math.floor(totalBilled * 0.1);
    // 無償化対象の場合、ここは0が入る
    let ichiwari2 = thisDt.musyouka? 0: ichiwari;
    // 多子軽減措置追加
    // ここで多子軽減するのは間違いっぽい 2023/09/08
    // やっぱりここは必要！！！！ 2023/09/27
    if (thisDt.tashikeigen === 2) ichiwari2 = Math.floor(totalBilled * 0.05);
    if (thisDt.tashikeigen === 3) ichiwari2 = 0;

    // 調整後利用者負担額を計算するために合計でのichiwari2を求める
    let ichiwari2Total = thisDt.ichiwari;
    if (isMultiSvc){
      if (thisDt.tashikeigen === 2) ichiwari2Total = Math.floor(totalBilled * 0.05);
      if (thisDt.tashikeigen === 3) ichiwari2Total = 0;
  
    }
    
    erl(outputRec, ICHIWARI1, ichiwari);
    erl(outputRec, ICHIWARI2, ichiwari2);
    // erl(outputRec,GETSUGAKU_TYOUSEI, thisDt.kanrikekkagaku);
    const getugakuTyousei = ichiwari2 < priceLimit ? ichiwari2 : priceLimit;
    erl(outputRec, GETSUGAKU_TYOUSEI, getugakuTyousei);
    let tyouseigoUserBuild = '';
    // 調整後利用者負担額は複数サービスかつ上限額を超えたときに出力する
    if (isMultiSvc && ichiwari2Total > priceLimit){
      tyouseigoUserBuild = plLess < getugakuTyousei? plLess: getugakuTyousei;
      plLess = plLess < getugakuTyousei? 0: plLess - getugakuTyousei;
    }
    // 複数サービスのときはサービスごとに上限額を按分した数値を記述する
    erl(outputRec, TYOUSEIGO_USER_BILLED, tyouseigoUserBuild);
    // 管理結果学をサービスごとに按分
    let kanrikekkagaku = thisDt.kanriKekka ? thisDt.kanriKekka : '';
    const v = typeof tyouseigoUserBuild === 'number'? tyouseigoUserBuild: getugakuTyousei;
    if (kanrikekkaLess > v){
      kanrikekkagaku = v;
      kanrikekkaLess -= v;
    }
    else {
      kanrikekkagaku = kanrikekkaLess;
      kanrikekkaLess = 0;
    }
    erl(
      outputRec,
      JOUGEN_USER_BILLED, thisDt.kanriKekka? kanrikekkagaku: ''
    )
    // 決定利用者負担額
    // この項目は上限管理が存在しなければ設定しない
    // 複数サービスかつ上限管理の場合の処理がまだ曖昧
    // 月額調整額、調整後利用者負担額、上限管理結果後負担額を配列化して最小値を求める
    const a = [getugakuTyousei, tyouseigoUserBuild, kanrikekkagaku]
    kanrikekkagaku = Math.min(
      ...a.filter(e=>typeof e === 'number')
    )
    erl(outputRec, KETTEI_USER_BILLED, kanrikekkagaku);
    const ketteiTotalBilled = totalBilled - kanrikekkagaku;
    erl(
      outputRec, 
      KETTEI_TOTAL_BILLED, ketteiTotalBilled
    );
    erl(outputRec, KOUGAKU_KYUUFU, '');
    erl(outputRec, TOKUBETSU_TAISAKU_K122, '');
    // 2025/01/07 自治助成の複数サービス対応追加
    if (thisDt.jichiJoseiSvc && isMultiSvc){
      erl(outputRec, JICHITAI_JOSEI, zero2blank(thisDt.jichiJoseiSvc[svcName]));
    }
    else{
      erl(outputRec, JICHITAI_JOSEI, zero2blank(thisDt.jichiJosei));
    }
    // erl(outputRec, JICHITAI_JOSEI, zero2blank(thisDt.jichiJosei));
  })

}



// 契約情報レコード
const billingCsvK122_5 = (outputRec, masterRec, thisDt, thisUser) => {
  // 2, REC_NO, 'K122', 5, THIS_MONTH, SCITY_NO, JI_NO, H_NO,
  // KETTEI_SRVC_CODE, // 決定サービスコード
  // KEIYAKU_VOL, // 契約量*100
  // KEIYAKU_DATE, // 契約日
  // KEIYAKU_END, // 契約終了日
  // KINYUU_BANGOU, // 事業者記入欄番号 

  // 単位数が発生しているサービス種別コードの配列を得る
  const serviceSyubetuCd = thisDt.tanniTotalSvc?
  Object.keys(thisDt.tanniTotalSvc)
    .map(e => serviceSyubetu[e]).sort((a, b)=>(a < b? -1: 1))
    :thisDt.serviceSyubetu;

  serviceSyubetuCd.forEach(e=>{
    const svcName = getSvcNameByCd(e);
    let ksCd = thisDt.ketteiScode;
    // 複数格納されている決定サービスコードからここで取得すべきものを求める
    let ketteiScode, mltSvc = false;
    if (ksCd.includes(',')){
      const t = ksCd.split(',');
      // 配列になっている決定サービスコードからサービス種別二桁で始まるコードを取得
      ksCd = t.find(f=>f.indexOf(e + '') === 0);
      mltSvc = true;
    }
    ketteiScode = ksCd;
    let volume, keiyakuDate, endDate, kinyuuBangou;
    if (mltSvc){
      const o = thisUser.etc.multiSvc[svcName]; // サービス別契約情報が記入されている箇所
      volume = o.volume + '00';
      keiyakuDate  = o.contractDate.replace(/\-/g, '');
      endDate = '';
      kinyuuBangou = o.lineNo
    }
    else{
      volume = thisDt.volume + '00';
      keiyakuDate = thisDt.keiyakuDate;
      endDate = '';
      kinyuuBangou = thisDt.kinyuuBangou;
    }

    outputRec.push([...keiyakuK122_5]);
    erl(outputRec, THIS_MONTH, masterRec.thisMonth);
    erl(outputRec, SCITY_NO, thisDt.scityNo);
    erl(outputRec, JI_NO, masterRec.jino);
    erl(outputRec, H_NO, thisDt.hno);
    erl(outputRec, KETTEI_SRVC_CODE, ketteiScode);
    erl(outputRec, KEIYAKU_VOL, volume);
    erl(outputRec, KEIYAKU_DATE, keiyakuDate);
    erl(outputRec, KEIYAKU_END, endDate);
    erl(outputRec, KINYUU_BANGOU, kinyuuBangou);
  })
}

// k122 明細レコード サービスコードを記載
const billingCsvK122_3 = (outputRec, masterRec, thisDt) => {
  // 2, REC_NO, 'K122', 3, THIS_MONTH, SCITY_NO, JI_NO, H_NO, 
  // SRVC_CODE, SRVC_TANNI, SRVC_COUNT, SRVC_SANTEI
  
  if (!thisDt.itemTotal) return false; // 利用実績がない場合
  // ソートしておく -> あらかじめソートしてあるのでここでは不要
  // thisDt.itemTotal.sort((a, b)=>(a.s > b.s)? 1: -1);

  // itemTotalをなめる
  thisDt.itemTotal.map(e=>{
    outputRec.push([...serviceMeisaiK122_3]);
    erl(outputRec, THIS_MONTH, masterRec.thisMonth);
    erl(outputRec, SCITY_NO, thisDt.scityNo);
    erl(outputRec, JI_NO, masterRec.jino);
    erl(outputRec, H_NO, thisDt.hno);
    erl(outputRec, SRVC_CODE, e.s);
    erl(outputRec, SRVC_TANNI, e.v);
    erl(outputRec, SRVC_COUNT, e.count);
    erl(outputRec, SRVC_SANTEI, e.tanniNum);
  })
}

// k122日数情報レコード
const billingCsvK122_2 = (outputRec, masterRec, dt, thisUser) => {
  // 2, REC_NO, 'K122', 2, THIS_MONTH, SCITY_NO, JI_NO, 
  // H_NO, S_SYUBETSU, START_DATE, END_DATE, CNT_USED,
  // 複数レコード対応
  // 開始日付などはサービスごとに出力する必要がある！
  let ary;
  if (comMod.typeOf(dt.serviceSyubetu) === 'array'){
    ary = dt.serviceSyubetu;
  }
  else{
    ary = [dt.serviceSyubetu];
  }
  const isMltSvc = (ary.length > 1);
  const mltSvcObj = isMltSvc? thisUser.etc.multiSvc: {};
  ary.forEach(e => {
    const svc = getSvcNameByCd(e);
    console.log('k122_2', svc, e, dt, thisUser);
    let startDate = isMltSvc? mltSvcObj[svc].startDate: dt.startDate;
    startDate = startDate.replace(/\-/g, '');
    let contractEnd = isMltSvc? mltSvcObj[svc].contractEnd: thisUser.contractEnd;
    contractEnd = (contractEnd === '0000-00-00')? '': contractEnd;
    contractEnd = contractEnd.replace(/\-/g, '');
    // console.log(dt.userSanteiTotalSvc, dt.name, 'dt.userSanteiTotalSvc, dt.name')
    // 提供がないレコードの出力を制御
    if (dt.userSanteiTotalSvc && !dt.userSanteiTotalSvc[svc]) return false;
    outputRec.push([...nissuuK122_2]);
    // 欠席のみの時に対応
    const countOfUse = isMltSvc? dt?.countOfUseMulti?.[svc] || 0 : dt.countOfUse; 
    erl(outputRec, THIS_MONTH, masterRec.thisMonth);
    erl(outputRec, SCITY_NO, dt.scityNo);
    erl(outputRec, JI_NO, masterRec.jino);
    erl(outputRec, H_NO, dt.hno);
    erl(outputRec, S_SYUBETSU, e);
    erl(outputRec, START_DATE, startDate);
    erl(outputRec, END_DATE, '');
    erl(outputRec, CNT_USED, countOfUse);
  })
  // 2022/02/08 利用回数0で算定額がある場合、利用回数を1にする。
  // 2022/03/14 やっぱり今まで通りにする
  // const countOfUse = (!dt.countOfUse && dt.userSanteiTotal)? 1: dt.countOfUse;
}
// // billingDtの中から多子軽減であるかどうかを調べる
// const isTashiKeigen = (dt) => {
//   let r = false;
//   const did = Object.keys(dt).find(e=>e.match(/^D2[0-9]+/));
//   if (!did) return false;
//   r = fdp(dt, [did, 'dAddiction', '多子軽減措置'])
// }

// k122_1 基本レコード
const billingCsvK122_1 = (outputRec, masterRec, dt, kdj) =>{
  // 2, REC_NO, 'K122', 1, THIS_MONTH, SCITY_NO, JI_NO, H_NO, '',
  // PNAME, NAME,
  // CHIKI_CODE, '', JOUGEN, '', '', JOUGEN_JI, JOUGEN_KEKKA, JOUGEN_RES,
  // '', '', USER_TANNI, TOTAL_AMOUNT,
  // JOUGEN_GETSU_TYOUSEI, // 上限月額調整額
  // '', '', '',
  // JOUGEN_TYOUSEIGO, // 上限調整後金額 
  // JOUGEN_KETTEI, // 上限決定後
  // TOTAL_BILLED
  // 上限月額調整 計算用
  // const ichiwari = Math.floor(parseInt(dt.userSanteiTotal) * 0.1);
  // const getsuTyousei = Math.min(ichiwari, dt.priceLimit);
  
  // 横浜で協力事業所で管理結果が未登録の場合は横浜兄弟と判定
  // priceLimitBk を設定
  const yokohama = isYokohama(dt.scityNo);
  const yokohamaKd = (
    yokohama && !dt.kanriKekka && dt.kanriType === '協力事業所'
  );
  if (yokohamaKd){
    dt.priceLimitBk = dt.priceLimit;
    // dt.priceLimit = 0;
    dt.priceLimit = dt.kanrikekkagaku;
    kdj = true; // 兄弟上限フラグも強制オン
  }

  outputRec.push([...kihonK122_1]);
  erl(outputRec, THIS_MONTH, masterRec.thisMonth);
  erl(outputRec, SCITY_NO, dt.scityNo);
  erl(outputRec, JI_NO, masterRec.jino);
  erl(outputRec, H_NO, dt.hno);
  erl(outputRec, PNAME, dt.pkana);
  erl(outputRec, NAME, dt.kana);
  erl(outputRec, CHIKI_CODE, masterRec.chiikiKubun); // 地域区分コード
  // 上限額調整があったらそちらを出力する 2026/01/07
  erl(
    outputRec, JOUGEN, dt.adjustetUpperLimit ?? dt.priceLimit
  );
  // 横浜上限では管理事業所出力も抑制する
  // 管理閣下が未設定の場合も管理事業所を出力しない
  let jougenJi = '';
  jougenJi = dt.kanriKekka > 0 ? dt.jougenJi: '';
  jougenJi = dt.priceLimitBk? '': jougenJi;
  erl(outputRec, JOUGEN_JI, jougenJi); // 上限管理事業所
  erl(outputRec, USER_TANNI, dt.tanniTotal); // 単位合計
  erl(outputRec, TOTAL_AMOUNT, dt.userSanteiTotal); // 請求額合計
  // レコードとしては存在しない値？？
  // 国保連に嘘つかれた。月額調整額は兄弟上限のときのみ、1割または上限額の小さい方
  // 2022/06/06
  // getsuTyousei の値の有無だけでは兄弟上限判定を間違うことがある
  // 引数kdjを見る
  // 明示的にゼロ入力
  let jougenGetsuTyousei = kdj? dt.getsuTyousei: dt.tyouseigaku;
  // 兄弟上限でなおかつ、兄弟であれば設定されるべきgetsuTyouseiが未設定の場合
  // =>これは横浜兄弟の子供の場合に発生しうる
  // 決定額を上限額に入れる
  // 同じコードが通所明細にもあるので変更するときは要注意
  jougenGetsuTyousei = (jougenGetsuTyousei === undefined && kdj)?
  dt.kanrikekkagaku: jougenGetsuTyousei;
  jougenGetsuTyousei = jougenGetsuTyousei? jougenGetsuTyousei: 0;
  // 多子軽減のときは軽減額が月額調整額に入る？
  let ichiwari2;
  if (dt.tashikeigen === 2) ichiwari2 = Math.floor(dt.userSanteiTotal * 0.05);
  else if (dt.tashikeigen === 3) ichiwari2 = 0;
  // ここのelseを外した 2024/08/01
  // else if (dt.tashikeigen > 1 && ichiwari2 < parseInt(dt.priceLimit)){
  if (dt.tashikeigen > 1 && ichiwari2 < parseInt(dt.priceLimit)){
    jougenGetsuTyousei = ichiwari2;
  }
  else ichiwari2 = dt.ichiwari;
  // 複数サービスの場合
  // 月額調整にはそれぞれのサービスの上限値または１割が入る
  // 2023/03/19 無償化の場合は0を入れる
  // 複数サービス再調整 2024/07/08
  const mltSvc = dt.userSanteiTotalSvc && Object.keys(dt.userSanteiTotalSvc).length > 1;
  if (mltSvc){
    let v = 0;
    Object.keys(dt.userSanteiTotalSvc).forEach(e=>{
      let w = dt.userSanteiTotalSvc[e]
      if (!dt.tashikeigen && Math.floor(w * 0.1) > dt.upperlimit) v += dt.upperlimit;
      else if (dt.tashikeigen === 2 && Math.floor(w * 0.05) > dt.upperlimit)  v += dt.upperlimit; 
      else if (dt.tashikeigen === 2 ) v += Math.floor(w * 0.05);
      else if (dt.tashikeigen === 3) v += 0;
      else v += Math.floor(w * 0.1);
    })
    if (dt.musyouka) v = 0;
    jougenGetsuTyousei = v;
  }
  erl(
    outputRec, JOUGEN_GETSU_TYOUSEI, 
    jougenGetsuTyousei
  );
  // 2024/06/07 調整後利用者負担額 上限額を超えるかつ複数サービスの場合に設定
  // 複数サービスの場合このパラメータを設定
  // 2023/03/19 無償化の場合は0を入れる
  if (mltSvc && ichiwari2 > dt.upperlimit){
    let v;
    if (jougenGetsuTyousei > dt.upperlimit) v = dt.upperlimit;
    else v = jougenGetsuTyousei;
    if (dt.musyouka) v = 0;
    erl(outputRec, JOUGEN_TYOUSEIGO1, v);
  }
  else{
    erl(outputRec, JOUGEN_TYOUSEIGO1, '');

  }

  // erl(outputRec, JOUGEN_GETSU_TYOUSEI, getsuTyousei); // 上限月額調整
  // null->0を追加
  erl(outputRec, JOUGEN_KEKKA, dt.kanriKekka? dt.kanriKekka: 0); // 管理結果フラグ
  // 上限管理結果が0（上限管理を行っていない）場合は出力しない
  // erl(outputRec, JOUGEN_RES, ((dt.kanriKekka) ? dt.kanrikekkagaku: ''));
  // 意図的に0出力が必要？ 2022/06/08 -> ''に戻す
  erl(outputRec, JOUGEN_RES, ((dt.kanriKekka) ? dt.kanrikekkagaku: ''));
  // 調整ご利用者負担も同じ処理
  // 意図的に0出力が必要？ 2022/06/08 -> ''に戻す
  erl(outputRec, JOUGEN_TYOUSEIGO,((dt.kanriKekka) ? dt.kanrikekkagaku : ''));
  erl(outputRec, JOUGEN_KETTEI, dt.kanrikekkagaku); // 上限決定額
  // 請求額
  erl(outputRec, TOTAL_BILLED, dt.userSanteiTotal - dt.kanrikekkagaku);
  // 助成自治体番号
  erl(outputRec, JOSEIJICHITAI, dt.joseiNo ? dt.joseiNo: '');
  erl(outputRec, KOUGAKU_KYUUFU, '');
  erl(outputRec, TOKUBETSU_TAISAKU_K122, '');
  erl(outputRec, JICHITAI_JOSEI_SEIKYUU, zero2blank(dt.jichiJosei));
  if (isNaN(dt.kanrikekkagaku)){
    console.log('!!!!!!!!detect NaN!!!!!!!!');
    console.log('dt.kanrikekkagaku', dt.kanrikekkagaku);
    console.log('dt.name', dt.name);
  }
  // // 上限管理の結果の金額。
  // const kanriKekkaPrice = (dt.kanrikekka) ? dt.adjust2 : '';
  // erl(outputRec, JOUGEN_RES, kanriKekkaPrice); // 上限管理結果額
  // // 上限管理がされていたら上限管理前の金額。上限管理されていたら上限管理後の金額
  // const jougenGetuTyousei = (dt.kanrikekka) ? dt.adjust2 : dt.adjust1;
  // erl(outputRec, JOUGEN_GETSU_TYOUSEI, jougenGetuTyousei);
  // // 最終結果。月額管理前の金額と管理後の金額安い方 でいいのか？
  // const jougenFinal = (dt.adjust1 < dt.adjust2) ? dt.adjust1 : dt.adjust2
  // erl(outputRec, JOUGEN_KETTEI, jougenFinal);
  // // 保険給付金 総額からユーザー負担を引く
  // erl(outputRec, TOTAL_BILLED, dt.userSanteiTotal - jougenFinal);
}
// 特定の市区町村に対してk122の出力を行う。
// サービス種別二種類に対してそれぞれの出力を行う
const billingCsvUsers = (
    outputRec, billingDt, allBillingDt, masterRec, scityNo, users, schedule
  ) =>{
  //    ユーザーヘッダ
  //      K122_1
  // サービスヘッダ
  //      K112_2
  //        サービス詳細
  //        k122_3
  //    ユーザーフッタ
  //      k122_4
  //      k122_5
  // 複数サービス対応 サービス種別の指定を排除
  const target = billingDt.filter(f => (removeAsterisk(f.scityNo) === scityNo));
  // 対象となる各ユーザーを処理
  target.map(f=>{
    const kdj = isKyoudaiJougen(allBillingDt, users, f.UID, schedule);
    const thisUser = comMod.getUser(f.UID, users);
    billingCsvK122_1(outputRec, masterRec, f, kdj);
    billingCsvK122_2(outputRec, masterRec, f, thisUser);
    billingCsvK122_3(outputRec, masterRec, f);
    billingCsvK122_4(outputRec, masterRec, f);
    billingCsvK122_5(outputRec, masterRec, f, thisUser);
  });
  
}

const billingCsvScity = (
  outputRec, billingDt, allBillingDt, masterRec, users, schedule
) => {
  // 市区町村ヘッダ
  //    K112_1
  // サービスヘッダ
  //    K112_2
  //    ユーザーヘッダ
  //      K122_1
  //      K122_2
  //        サービス詳細
  //        k122_3
  //    ユーザーフッタ
  //      k122_4
  //      k122_5
  // マスターレコードの集計データが格納されている配列をなめる
  // 自発が入ってくるとここの構造が変わると思われる -> 2021/10/11 変更中
  
  // ユニークな市区町村番号を得る
  // ここで市区町村コードをソートしたり 2023/01/26追加
  // const scitySet = new Set(masterRec.totalized.map(e=>e.scityNo));
  const scityAry = Array.from(
    new Set(masterRec.totalized.map(e=>e.scityNo))
  );
  scityAry.sort((a, b)=> (a < b)? -1: 1);
  scityAry.forEach(e=>{
    billingCsvK112_1(outputRec, masterRec, e);
    billingCsvK112_2(outputRec, masterRec, e);
    billingCsvUsers(
      outputRec, billingDt, allBillingDt, masterRec, e, users, schedule
    );
  })
}
// J312-1（計画相談支援）K311-1（障害児相談支援）のレコードを出力する。
const billingCsvSoudanByCity = (outputRec, masterRec, city, service) => {
  // 2, REC_NO, 'J312', '01', THIS_MONTH, SCITY_NO, JI_NO, 
  // TOTAL_COUNT, // 市区町村ごとの利用者人数
  // CHIKI_CODE, TOTAL_AMOUNT, KYUUFU_TANKA

  const tArry = (()=>{
    if (service === KEIKAKU_SOUDAN) return [...keikakuSoudanSeikyuuJ312_1];
    if (service === SYOUGAI_SOUDAN) return [...syougaiSoudanSeikyuuK311_1];
  })();
  const totalCount = (masterRec?.totalized ?? []).find(e=>e.scityNo === city)?.countOfUsers;
  const userSanteiTotal = (masterRec?.totalized ?? []).find(e=>e.scityNo === city)?.userSanteiTotal;
  if (!userSanteiTotal) return false;
  outputRec.push([...tArry]);
  erl(outputRec, THIS_MONTH, masterRec.thisMonth);
  erl(outputRec, SCITY_NO, city);
  erl(outputRec, JI_NO, masterRec.jino);
  erl(outputRec, TOTAL_COUNT, totalCount);
  erl(outputRec, CHIKI_CODE, masterRec.chiikiKubun);
  erl(outputRec, TOTAL_AMOUNT, userSanteiTotal);
  erl(outputRec, KYUUFU_TANKA, masterRec.unitPrice * 1000);
}
// J312-2, 3（計画相談支援）K311-2, 3（障害児相談支援）のレコードを出力する。
const billingCsvSoudanByUser = (outputRec, masterRec, billingDt, city, service) => {
  // 請求明細 利用者ごとのレコード
  // 2, REC_NO, 'J312', '02', THIS_MONTH, SCITY_NO, JI_NO, 
  // LINE_NO, // 市区町村ごとの利用者通番
  // H_NO, PNAME, NAME, 
  // MONITER_DATE, // 提供月の1日を入力 ex.20230401
  // '520000',
  // TOTAL_TANNI, TOTAL_AMOUNT, KYUUFU_TANKA
  //

  // 雛形配列の準備
  const {tArray_2, tArray_3} = (()=>{
    if (service === KEIKAKU_SOUDAN){
      return {
        tArray_2: [...keikakuSoudanSeikyuuJ312_2], 
        tArray_3: [...keikakuSoudanSeikyuuJ312_3]
      }
    }
    else {
      return {
        tArray_2: [...syougaiSoudanSeikyuuK311_2], 
        tArray_3: [...syougaiSoudanSeikyuuK311_3]
      }
    }
  })();

  billingDt.filter(e=>e.scityNo === city).forEach((bdt, i)=>{
    // 利用がなかったら出力しない
    if (!bdt.userSanteiTotal) return false;
    outputRec.push([...tArray_2]);
    erl(outputRec, THIS_MONTH, masterRec.thisMonth);
    erl(outputRec, SCITY_NO, city);
    erl(outputRec, JI_NO, masterRec.jino);
    erl(outputRec, LINE_NO, i + 1);
    erl(outputRec, H_NO, bdt.hno);
    erl(outputRec, PNAME, bdt.pkana);
    erl(outputRec, NAME, bdt.kana);
    erl(outputRec, MONITER_DATE, bdt.monitorDate ?? '');
    erl(outputRec, TOTAL_TANNI, bdt.tanniTotal);
    erl(outputRec, TOTAL_AMOUNT, bdt.userSanteiTotal);
    erl(outputRec, KYUUFU_TANKA, masterRec.unitPrice * 1000);
    // サービス情報。サービスコードごと
    // 2, REC_NO, 'J312', '03', THIS_MONTH, SCITY_NO, JI_NO, H_NO,
    // SRVC_CODE, SRVC_TANNI, SRVC_COUNT, SRVC_TANNI_TOTAL, 
    // SRVC_TEKIYOU // 特に何も出力しないみたい 最初から''を定義済み
    bdt.itemTotal.forEach(item=>{
      outputRec.push([...tArray_3]);
      erl(outputRec, THIS_MONTH, masterRec.thisMonth);
      erl(outputRec, SCITY_NO, city);
      erl(outputRec, JI_NO, masterRec.jino);
      erl(outputRec, H_NO, bdt.hno);
      erl(outputRec, SRVC_CODE, item.s);
      erl(outputRec, SRVC_COUNT, item.count);
      erl(outputRec, SRVC_TANNI, item.v);
      erl(outputRec, SRVC_TANNI_TOTAL, item.tanniNum);
    });
  })
}

const billingCsvScitySoudan = (
  outputRec, billingDt, allBillingDt, masterRec, users, schedule
) => {
  const scityAry = Array.from(new Set(masterRec.totalized.map(e=>e.scityNo)));
  scityAry.sort((a, b)=> (a < b)? -1: 1);
  const service = users?.[0]?.service;
  scityAry.forEach(city=>{
    billingCsvSoudanByCity(outputRec, masterRec, city, service);
    billingCsvSoudanByUser(outputRec, masterRec, billingDt, city, service);
  })
}
// UserSelectDialog で作成された配列で指定された文字列形式UIDが存在するか
const checkUidFromList = (ary, UID) => {
  if (!ary.length)  return true; // 配列が存在しなければtrue
  const a = ary.filter(e=>e.checked).map(e=>'UID' + e.uid);
  if (a.indexOf(UID) > -1)  return true;
  else return false;
}

// setBillInfoToSchで作成されたオブジェクトを元にcsvのベースになる配列を作成する
// 情報は整理する意味でも渡された引数から取得する
// 足りなきゃ何処かにセットする！
// 兄弟上限判定のためにbillingDtを全件出力するように変更している
// 相談支援対応のためにbillingCsvScityとbillingCsvScitySoudanの条件分岐を行う。
// コール元からserviceが提供されていないためusersから取得する
export const makeBiling = (
  billingDt, allBillingDt, masterRec, schedule, users, userList
)=>{
  // ヘッダレコード出力 K11
  // 市区町村ヘッダ
  //    K112_1
  // サービスヘッダ
  //    K112_2
  //    ユーザーヘッダ
  //      K122_1
  //      K122_2
  //        サービス詳細
  //        k122_3
  //    ユーザーフッタ
  //      k122_4
  //      k122_5
  // エンドレコード出力
  const svc = users?.[0]?.service;
  // 相談支援対応のために識別子を切り替える
  const shikibetushi = (() => {
    if (svc === KEIKAKU_SOUDAN) return 'J31';
    else if (svc === SYOUGAI_SOUDAN) return 'K31';
    else return 'K11';
  })();
  const outputRec = [];
  csvHaed(outputRec, masterRec, shikibetushi);
  // // ここで請求データを選択ユーザーでフィルタリングする
  // const fBilling = billingDt.filter(e=>{
  //   const uid = amdcm.convUid(e.UID).n;
  //   return (userList.find(f => f.uid === uid).checked);
  // })
  if (!soudanServiceName.includes(svc)){
    billingCsvScity(outputRec, billingDt, allBillingDt, masterRec, users, schedule);
  }
  else{
    billingCsvScitySoudan(outputRec, billingDt, allBillingDt, masterRec, users, schedule);
  }
  outputRec.push([...endRecord]); // エンドレコード挿入
  outputRec.map((e, i)=>{
    elmRep(e, REC_NO, i + 1);
  });
  elmRep(outputRec[0], REC_CNT, outputRec.length - 2); // レコード件数記載
  console.log('outputRec', outputRec);
  return outputRec;
}



// 兄弟管理を行った場合、csv出力を行わない 20210613追加
const makeJougenOneUser = (thisUser, masterRec, outputRec, jougenKubun, manualJougenKubun, stdDate) =>{
  // 2022/05/27
  // 単純にbrosindexを見るのではな兄弟上限を行ったフラグを見てデータ作成判断
  // if (parseInt(thisUser.brosIndex)) return false;
  // k411_1
  // 2, REC_NO, 'K411', 1, THIS_MONTH, SAKUSEI_KU, SCITY_NO,
  // JI_NO, H_NO, PNAME, NAME,
  // JOUGEN, JOUGEN_KEKKA, ALL_AMOUNT, ALL_TYOUSEI, ALL_JOUGEN,
  // const jgMeisaiK411_2 = [ // 上限管理明細
  //   2, REC_NO, 'K411', 2, THIS_MONTH, SCITY_NO, JI_NO, H_NO, LINE_NO,
  //   KYO_JI, TOTAL_AMOUNT, JOUGEN_TYOUSEIGO, JOUGEN_KETTEI
  // ]
  const jiGrp = thisUser.協力事業所;
  if (!jiGrp || jiGrp.length === 0) return false;

  const nUid = amdcm.convUid(thisUser.UID).n;
  const thisJougenKubun = jougenKubun && jougenKubun[nUid] ? jougenKubun[nUid] : manualJougenKubun;

  outputRec.push([...jgKihonK411_1]);
  erl(outputRec, THIS_MONTH, masterRec.thisMonth);
  erl(outputRec, SCITY_NO, thisUser.scityNo);
  erl(outputRec, JI_NO, masterRec.jino);
  erl(outputRec, H_NO, thisUser.hno);
  erl(outputRec, PNAME, thisUser.pkana);
  erl(outputRec, NAME, thisUser.kana);
  erl(outputRec, JOUGEN, thisUser.priceLimit);
  erl(outputRec, JOUGEN_KEKKA, thisUser.kanriKekka);
  erl(outputRec, SAKUSEI_KU, thisJougenKubun);

  const [allAmount, allTyousei, allJougen] = jiGrp.reduce(
    (acc, e) => [
      acc[0] + e.amount,
      acc[1] + e.tyouseiGaku,
      acc[2] + e.kettei
    ],
    [0, 0, 0]
  );
  erl(outputRec, ALL_AMOUNT, allAmount);
  erl(outputRec, ALL_TYOUSEI, allTyousei);
  erl(outputRec, ALL_JOUGEN, allJougen);
  // 上限管理明細を作成
  let ln = 1; // 行番号
  const makeJougenMeisai = (o)=>{
    outputRec.push([...jgMeisaiK411_2]);
    erl(outputRec, THIS_MONTH, masterRec.thisMonth);
    erl(outputRec, SCITY_NO, thisUser.scityNo);
    erl(outputRec, JI_NO, masterRec.jino);
    erl(outputRec, H_NO, thisUser.hno);
    erl(outputRec, LINE_NO, ln++);
    // 自社のデータなら自社の事業所番号、他社なら他社の
    const jno = (o.name === 'thisOffice') ? masterRec.jino : o.no;
    erl(outputRec, KYO_JI, jno);
    erl(outputRec, TOTAL_AMOUNT, o.amount);
    erl(outputRec, JOUGEN_TYOUSEIGO, o.tyouseiGaku);
    erl(outputRec, JOUGEN_KETTEI, o.kettei);
  }
  // 自社を最初に処理する
  const thisOffice = jiGrp.find(e=>e.name==='thisOffice');
  makeJougenMeisai(thisOffice);
  jiGrp.map(e=>{
    if (e.name === 'thisOffice')  return false; // 自社は処理済。スキップ
    makeJougenMeisai(e);
  });
}

const makeKDJougenOneUser = (thisUser, masterRec, outputRec, jougenKubun, manualJougenKubun, stdDate, brosDt, users, ) =>{

  const nUid = amdcm.convUid(thisUser.UID).n;
  const thisJougenKubun = jougenKubun && jougenKubun[nUid] ? jougenKubun[nUid] : manualJougenKubun;

  // 多子軽減措置に基づいて負担額を計算する関数
  const calculateIchiwari = (user, amount) => {
    const userTashikeigen = (() => {
      if (user?.etc?.addiction?.多子軽減措置 === "第二子軽減") return 2;
      else if (user?.etc?.addiction?.多子軽減措置 === "第三子軽減") return 3;
      else return 0;
    })();
    
    // 金額がある場合のみ計算
    let ichiwari = false;
    if (amount) {
      if (userTashikeigen === 2) {
        ichiwari = Math.floor(Number(amount) * 0.05);
      } else if (userTashikeigen === 3) {
        ichiwari = 0;
      } else {
        ichiwari = Math.floor(Number(amount) * 0.1);
      }
    }
    return ichiwari;
  };

  const kdjgKihonK421_1 = [ // 兄弟上限管理基本
    2, REC_NO, 'K421', '01', THIS_MONTH, SAKUSEI_KU, SCITY_NO, 
    JI_NO, H_NO, PNAME, NAME,
    JOUGEN, JOUGEN_KEKKA, ALL_AMOUNT, ALL_RIYOUSHA_FUTAN, ALL_KANRIKEKKAGO,
  ];
  const kdjgMeisaiK421_2 = [ // 兄弟上限管理明細
    2, REC_NO, 'K421', '02', THIS_MONTH, SCITY_NO, JI_NO, H_NO, LINE_NO, KYO_JI, 
    TOTAL_AMOUNT, RIYOUSYA_FUTAN, KANRIKEKKAGO, HONNIN_HNO, HONNIN_NAME
  ]
  
  outputRec.push([...kdjgKihonK421_1]);
  
  const brGrp = brosDt.map(e => {
    // const user = users.find(f=>f.hno === e.hno);
    // const ichiwari = calculateIchiwari(user, e.amount);
    
    return {
      brosDt: true,
      name: "thisOffice",
      no: masterRec.jino,
      amount: e.userSanteiTotal || Number(e.amount) || 0,
      kettei: e.ketteigaku || 0,
      ichiwari: e.ichiwari ,
      priceLimit: e.priceLimit || 0,
      tyouseiGaku: e.kdTyousei || 0,
      hno: e.hno ,
      userName: e.name,
      userKana: e.kana,
      brosIndex: Number(e.brosIndex),
      UID: e.UID,
    }
  }).sort((a, b) => a.brosIndex - b.brosIndex);

  const jiGrp = thisUser.協力事業所 || [];
  jiGrp.forEach(e=>{e.priceLimit=Number(thisUser.priceLimit)});
  // 兄弟の協力事業所を配列に格納
  brosDt.forEach(e=>{
    const ky = e.協力事業所;
    if (ky && Array.isArray(ky)){
      ky.forEach(f => {f.hno = e.hno; f.priceLimit = Number(e.priceLimit)});
      jiGrp.push(...ky)
    }
  })
  // 自事業所の事業所番号を取得
  jiGrp.filter(e=>e.name === "thisOffice").forEach(e=>{
    e.no = masterRec.jino;
  })
  jiGrp.forEach(e=>{
    const u = users.find(f=>f.hno===e.hno);
    if (!e.ichiwari) e.ichiwari = calculateIchiwari(u, e.amount);
    if (!e.priceLimit) e.priceLimit = Number(u.priceLimit);
    if (!e.brosIndex) e.brosIndex = Number(u.brosIndex);
  })
  // jiGrpとbrGrpを結合した配列を作成
  // まずjiGrpから重複を除去する
  const uniqueJiGrp = [];
  jiGrp.forEach(item => {
    // no と hno の組み合わせがuniqueJiGrpにまだ存在しない場合のみ追加
    const exists = uniqueJiGrp.some(j => j.no === item.no && j.hno === item.hno);
    if (!exists) {
      uniqueJiGrp.push(item);
    }
  });
  
  const finalGrp = [...uniqueJiGrp];
  
  // brGrpからjiGrpに存在しないno,hnoの組み合わせのデータを追加
  brGrp.forEach(b => {
    const existsInJiGrp = uniqueJiGrp.some(j => j.no === b.no && j.hno === b.hno);
    if (!existsInJiGrp) {
      finalGrp.push(b);
    }
  });

  // thisOfficeのデータを先頭に配置
  finalGrp.sort((a, b) => {
    if (a.name === 'thisOffice' && b.name === 'thisOffice') {
      // どちらもthisOfficeの場合
      // brosIndexの有無でソート
      if (a.brosIndex !== undefined && b.brosIndex === undefined) return -1;
      if (a.brosIndex === undefined && b.brosIndex !== undefined) return 1;
      // 両方brosIndexがある場合、brosIndexの昇順でソート
      if (a.brosIndex !== undefined && b.brosIndex !== undefined) {
        return a.brosIndex - b.brosIndex;
      }
      // どちらもbrosIndexがない場合は元の順序を維持
      return 0;
    }
    // thisOfficeを優先
    if (a.name === 'thisOffice') return -1;
    if (b.name === 'thisOffice') return 1;
    return 0;
  });

  let [allAmount, allTyousei, allJougen] = finalGrp.reduce(
    (acc, e) => [
      acc[0] + e.amount,
      acc[1] + Math.min(e.ichiwari, e.priceLimit),
      acc[2] + e.kettei
    ],
    [0, 0, 0]
  );

  erl(outputRec, THIS_MONTH, masterRec.thisMonth);
  erl(outputRec, SCITY_NO, thisUser.scityNo);
  erl(outputRec, JI_NO, masterRec.jino);
  erl(outputRec, H_NO, thisUser.hno);
  erl(outputRec, PNAME, thisUser.pkana);
  erl(outputRec, NAME, thisUser.kana);
  erl(outputRec, JOUGEN, thisUser.priceLimit);
  erl(outputRec, JOUGEN_KEKKA, thisUser.kanriKekka);
  erl(outputRec, SAKUSEI_KU, thisJougenKubun);
  erl(outputRec, ALL_AMOUNT, allAmount);
  erl(outputRec, ALL_RIYOUSHA_FUTAN, allTyousei);
  erl(outputRec, ALL_KANRIKEKKAGO, allJougen);
  // 上限管理明細を作成
  let ln = 1; // 行番号
  const makeJougenMeisai = (o)=>{
    outputRec.push([...kdjgMeisaiK421_2]);
    erl(outputRec, THIS_MONTH, masterRec.thisMonth);
    erl(outputRec, SCITY_NO, thisUser.scityNo);
    erl(outputRec, JI_NO, masterRec.jino);
    erl(outputRec, H_NO, thisUser?.brosInfo?.firstBrosHno);
    erl(outputRec, LINE_NO, ln++);
    erl(outputRec, KYO_JI, o.no);
    erl(outputRec, TOTAL_AMOUNT, o.amount);
    erl(outputRec, RIYOUSYA_FUTAN, Math.min(o.ichiwari, o.priceLimit));
    erl(outputRec, KANRIKEKKAGO, o.kettei);
    erl(outputRec, HONNIN_HNO, o.hno);
    erl(outputRec, HONNIN_NAME, o.userKana);
  }
  
  
  
  // 金額が存在するデータのみ処理
  finalGrp.forEach(e => {
    makeJougenMeisai(e);
  });
  
  console.log(thisUser.name,finalGrp, 'finalGrp', jiGrp, 'jiGrp', brGrp, 'brGrp');

}


export const isUse = (schedule, uid) => {
  const addicSet = new Set();
  const UID = amdcm.convUid(uid).s;
  const uSch = schedule[UID];
  let r = false;
  // 欠席ではない利用を探す。出席の予定があればおｋ
  Object.keys(uSch).filter(e=>e.match(/^D20/)).forEach(e=>{
    if (!uSch[e].absence){
      r = true;
    }
  })
  if (r) return r;

}

// 兄弟上限かどうかを判定する
// 兄弟間で二人以上が利用か管理事業所として他社の利用があった場合は
// 兄弟管理であると判断する
// judgeJougenkanriKasanからコールされるときはjadgeがtrueでコールされる
export const isKyoudaiJougen = (billingDt, users, uid, schedule, jadge = false) => {
  // billingDt が schTmpでも扱えるようにする
  if (!Array.isArray(billingDt)){
    const t = Object.keys(billingDt).map(e=>{
      return {...billingDt[e], UID: e}
    });
    billingDt = [...t];
  }
  const stdDate = getLS('stdDate');
  const bid = getLS('bid');
  const bros = comMod.getBrothers(uid, users, true); // 自己を含めたuid配列を求める
  const u = comMod.getUser(uid, users);
  let cnt = 0; // 算定か他社利用が存在するかどうか
  bros.forEach(e=>{
    const uid  = (e.uid.indexOf('UID') === 0)? e.uid: 'UID' + e.uid;
    const o = billingDt.find(f=>f.UID === uid);
    // 利用実績があるかどうかを判定
    // 利用判定にuserSanteiTotalを加えるべきかどうか。過去に外した形跡がある？
    // const use = o ? o.countOfUse + o.countOfKesseki : 0;
    // userSanteiTotalがundefinedの場合は兄弟判定間違えることあり
    // 2025-07-09リリースで間違いがあった。7月提供分は間違えたままの評価とする
    // 6月提供分がどうなっているかわからない
    // 08/26修正実施
    const use = (() => {
      if (!o) return 0;
      let santeiTotal = (stdDate === '2025-07-01') ? o.userSanteiTotal : (o.userSanteiTotal || 0);
      // 6月は樽町も旧ロジック
      santeiTotal = (stdDate === '2025-06-01' && bid === 'i2UDCedt') 
        ? o.userSanteiTotal : (o.userSanteiTotal || 0);
      return o.countOfUse + o.countOfKesseki + santeiTotal;
    })();

    if (use){
    // if (o && o.userSanteiTotal){
      cnt++;
      return false;
    }
    const sch = schedule[uid];
    const ky = (sch && Array.isArray(sch.協力事業所))? sch.協力事業所: [];
    ky.forEach(e=>{
      if (parseInt(e.amount)) cnt++;
    });
  });
  if (cnt > 1){
    // console.log(u.name, cnt, 'iskyoudaijougen');
    return true;
  }
  else{
    return false;
  }
}

// 上限管理イメージを作成する
export const makeJugenkanri = (prms) =>{
  const {
    billingDt, masterRec, jougenKubun, manualJougenKubun, 
    users, schedule, stdDate, allBillingDt
  } = prms;
  // const stdDate = billingDt[0].stdDate;
  const outputRec = [];
  csvHaed(outputRec, masterRec, 'K41');
  const fAllBillingDt = allBillingDt.map(e => ({
    ...e,
    協力事業所: e.協力事業所 ? [...e.協力事業所] : undefined
  })).filter(e => {
    if (e.userSanteiTotal) return true;
    // 元の条件チェック
    if (!e.userSanteiTotal && e.協力事業所) {
      // 協力事業所配列に少なくとも1つの正のamount値があるかチェック
      const hasPositiveAmount = Array.isArray(e.協力事業所) && 
        e.協力事業所.some(ji => {
          const amount = isNaN(Number(ji.amount)) ? 0 : Number(ji.amount);
          return amount > 0;
        });
      
      // 協力事業所配列からamountがNaNまたは0のデータを除去
      if (hasPositiveAmount && Array.isArray(e.協力事業所)) {
        e.協力事業所 = e.協力事業所.filter(ji => {
          const amount = Number(ji.amount);
          return !isNaN(amount) && amount > 0;
        });
      }
      
      return hasPositiveAmount;
    }
    return false;
  });
  Object.keys(billingDt).map(e=>{
    const thisUser = billingDt[e];
    const brosIndex = Number(thisUser.brosIndex) || 0;
    const isKd = isKyoudaiJougen(billingDt, users, billingDt[e].UID, schedule);
    const bros = comMod.getBrothers(thisUser.UID, users, true);
    const isKyouryoku = bros.some(e=>e.kanri_type==='協力事業所');
    const makeKDJougen = stdDate >= '2025-04-01' && isKd && brosIndex === 1 && !isKyouryoku;
    const brosDt = [];
    if (makeKDJougen){
      bros.forEach(e=>{
        const v = fAllBillingDt.find(f=>f.UID === 'UID' + e.uid)
        // const user = comMod.getUser(e.uid, users);
        // const sch = schTmp['UID' + e.uid];
        if (v){
          brosDt.push({...v});
        }
        // else if (sch){
        //   brosDt.push({...sch, });
        // }
      });
    }
    // 管理事業所で管理結果が0以上なら上限管理データ作成
    if (thisUser.kanriKekka > 0 && thisUser.kanriType === '管理事業所' && !makeKDJougen && brosIndex <= 1 && stdDate >= '2025-04-01')  
      makeJougenOneUser(thisUser, masterRec, outputRec, jougenKubun, manualJougenKubun, users, stdDate)
    else if (thisUser.kanriKekka > 0 && thisUser.kanriType === '管理事業所' && !isKd && stdDate < '2025-04-01')  
      makeJougenOneUser(thisUser, masterRec, outputRec, jougenKubun, manualJougenKubun, users, stdDate)

    if (thisUser.kanriKekka > 0 && makeKDJougen)
      makeKDJougenOneUser(thisUser, masterRec, outputRec, jougenKubun, manualJougenKubun, stdDate, brosDt, users, )
  });
  outputRec.push([...endRecord]); // エンドレコード挿入
  outputRec.map((e, i) => {
    elmRep(e, REC_NO, i + 1);
  });
  elmRep(outputRec[0], REC_CNT, outputRec.length - 2); // レコード件数記載
  // 2022/02/18 データ件数が0だったら空の配列を返す
  if (outputRec.length > 2){
    return outputRec;
  }
  else{
    return [];
  }
}

// 提供実績イメージ作成 2024版
// 提供実績はカラム数がムダに多いのでカラム位置を定義して配列を扱う
// カラムの位置はCSVの仕様書と合わせるためレコードの作製してから
// 先頭に１カラム挿入する。

// 共用
const C_YEAR_MOMTH = 3; //年月
const C_CITY = 4; //市区
const C_JI = 5; //事業所番号
const C_HNO = 6;  //保険番号
const C_YOUSHIKI = 7; //様式

// 基本レコード
const C_KIHON_SANTEIGOUKEI = 19;//算定時間合計
const C_KIHON_CNT_SOUGEI = 34;//送迎回数片道
const C_KIHON_CNT_SYOKUJI = 45;//食事支援回数:
const C_KIHON_CNT_IRYOU = 117;//医療連携体制加算
const C_KIHON_CNT_KAZOKUSHIEN = 121;//家族支援回数
const C_KIHON_HOIKUIKOUBI = 140; // 保育移行日
const C_KIHON_HOIKUIKOUGO = 141; // 保育移行後算定日
const C_KIHON_SYUUTYUUKAISI = 156; // 集中的支援加算　支援開始日（年月日）
const C_KIHON_CNT_NYUUYOKU = 159; // 入浴支援加算（回）
const C_KIHON_CNT_SENMONCHIEN = 161; // 専門的支援加算（支援実施時）（回）
const C_KIHON_CNT_TUUSYOJIRITSY = 162; // 通所自立支援加算（回）
const C_KIHON_CNT_KOSODATESAPO = 163; // 子育てサポート加算（回）
// const C_KIHON_CNT_HOUMONSHIENTOKUBETSU = 164; // 訪問支援員特別加算（回）
// const C_KIHON_CNT_TASYOKUSYURENKEI = 165; // 多職種連携加算（回）
// const C_KIHON_CNT_KYOUDOKOUDOU = 166; // 強度行動障害（回）
const C_KIHON_CNT_SYUUTYUUSHIEN = 167; // 集中的支援回数
const C_KIHON_CNT_ENCHOUSHIEN = 170; // 延長支援加算（回）
const C_KIHON_CNT_JIRITSUSAPORT = 172; // 自立サポート加算（回）

// 保訪
const C_KIHON_GOUKEISANTEI = 37; // 合計算定回数（日数） 保訪
const C_KIHON_SYOKAI = 113; // 初回加算
const C_KIHON_CNT_HOUMONTOKUBETU = 164; // 訪問支援員特別加算
const C_KIHON_CNT_TASYOKUSYU = 165; // 多職種連携支援加算
const C_KIHON_CNT_KYOUDOKOUDOU = 166; // 強度行動障害児支援加算（支援実施時）（回）

// 明細レコード
const C_MEISAI_DATE = 9;  //日付
const C_MEISAI_START_TIME = 14;  //開始時刻
const C_MEISAI_END_TIME = 15;  //終了時刻
const C_MEISAI_SANTEI_TIME = 16;  //算定時間
const C_MEISAI_PICKUP = 21;  //送迎往路
const C_MEISAI_SEND = 22;  //送迎復路
const C_MEISAI_SYOKUJITEIKYOU = 32; //食事提供加算
const C_MEISAI_TEIKYOUKEITAI = 34; //提供形態
const C_MEISAI_TEIKYOUJOUKYOU = 36;  //提供状況
const C_MEISAI_IRYOURENKEI = 74; // 医療連携体制加算
const C_MEISAI_KAZOKUSHIEN = 78; // 家族連携
const C_MEISAI_NYUUYOKU = 99; // 入浴支援
const C_MEISAI_SENMONSHIEN = 101; // 専門的支援
const C_MEISAI_TUUSYOJIRITSU = 102; // 通所自立支援加算
const C_MEISAI_KOSODATE = 103; // 子育てサポート
const C_MEISAI_SYUUTYUU = 107; // 集中的支援
const C_MEISAI_ENCHOU = 111; // 延長支援
const C_MEISAI_JIRITUSSAPORT = 113; // 自立サポート加算
// 保訪
const C_MEISAI_SANTEINISSUU = 45; // 算定日数
const C_MEISAI_SYOKAI = 70; // 初回加算
const C_MEISAI_HOUMONSHIENTOKUBETSU = 104; // 訪問支援員特別加算
const C_MEISAI_TAKISYURENKEY = 105; // 多職種連携支援加算
const C_MEISAI_KYOUDOKOUDOU = 106; // 強度行動障害児支援加算（支援実施時）



// 削除予定
// const C_KIHON_CNT_HOUMON = 51;//訪問支援特別
// const C_KIHON_CNT_HOUMON_SAN = 52;//訪問支援特別加算算定:
// const C_KIHON_CNT_KATEIREN = 35;//家庭連携回数
// const C_KIHON_CNT_KATEIREN_SAN = 36;//家庭連携算定回数
// const C_MEISAI_KAREN_JIKAN = 23; // 家族連携加算
// const C_MEISAI_KAREN_SANTEI = 24; // 家庭連携算定 


// 提供実績イメージ作成
// 提供実績はカラム数がムダに多いのでカラム位置を定義して配列を扱う
// カラムの位置はCSVの仕様書と合わせるためレコードの作製してから
// 先頭に１カラム挿入する。
// 明細レコード
// const C_MEISAI_DATE = 9;  //日付
// const C_MEISAI_START_TIME = 14;  //開始時刻
// const C_MEISAI_END_TIME = 15;  //終了時刻
// const C_MEISAI_PICKUP = 21;  //送迎往路
// const C_MEISAI_SEND = 22;  //送迎復路
// const C_MEISAI_SYOKUJITEIKYOU = 32; //食事提供加算
// const C_MEISAI_TEIKYOUKEITAI = 34; //提供形態
// const C_MEISAI_TEIKYOUJOUKYOU = 36;  //提供状況
// const C_MEISAI_KAREN_JIKAN = 23; // 家庭連携 時間数 1.5h -> 0150
// const C_MEISAI_KAREN_SANTEI = 24; // 家庭連携算定 
// const C_MAISAI_IRYOURENKEI = 74; // 医療連携体制加算
// const C_MEISAI_SOUDANSHIEN = 78; // 相談支援加算
// const C_MEISAI_SANTEINISSUU = 45; // 算定日数

// 基本レコード
// const C_KIHON_CNT_SOUGEI = 34;//送迎回数片道
// const C_KIHON_CNT_KATEIREN = 35;//家庭連携回数
// const C_KIHON_CNT_KATEIREN_SAN = 36;//家庭連携算定回数
// const C_KIHON_CNT_HOUMON = 51;//訪問支援特別
// const C_KIHON_CNT_HOUMON_SAN = 52;//訪問支援特別加算算定:
// const C_KIHON_CNT_IRYOU = 117;//医療連携体制加算
// const C_KIHON_SOUDAN = 121;//事業所内相談支援回数:
// const C_KIHON_CNT_SYOKUJI = 45;//食事支援回数:
// const C_KIHON_GOUKEISANTEI = 37; // 合計算定回数
// const C_KIHON_SYOKAI = 70;

// 利用実績基本レコードでサービス種別のカウントを行う
const svcCounter = (
  svcSyubetu, svcSyubetuAry, // サービス種別と該当するサービス種別
  name, itemTotal // 加算アイテムのname属性
) => {
  // サービス種別がリストに含まれない場合は処理を終了
  if (!svcSyubetuAry.includes(svcSyubetu)) return false;

  // nameが正規表現オブジェクトの場合と文字列の場合で処理を分岐
  const filteredItems = itemTotal.filter(e => {
    if (e.s.indexOf(svcSyubetu) !== 0) return false
    if (name instanceof RegExp && e.name) {
      // nameが正規表現の場合、matchメソッドを使用
      return e.name.match(name);
    } else {
      // nameが単純な文字列の場合、等価比較を使用
      return e.name === name;
    }
  });

  // アイテム数をカウント
  const itemCount = filteredItems.reduce((acc, item) => acc + (item.count || 0), 0);
  return itemCount;
};

// サービスが提供された最初の日を取得する
const svcFirstDate = (
  svcSyubetu, svcSyubetuAry, // サービス種別と該当するサービス種別
  name, bdt, // 加算アイテムのname属性
) => {
  if (!svcSyubetuAry.includes(svcSyubetu)) return false;
  const dids = Object.keys(bdt).filter(e=>e.match(didPtn)).sort((a, b) => a < b? -1: 1);
  const rt = false;
  dids.forEach(did=>{
    const t = bdt[did].items.find(e=>e.name === name);
    if (t && !rt) rt = did.replace('D', '');
  });
  return rt;
}

// ローマ数字を整数に変換する
const getRomanIndex = (str) => {
  // 全角ローマ数字のリスト
  const romanList = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ', 'Ⅶ', 'Ⅷ', 'Ⅸ', 'Ⅹ'];

  // 文字列から全角ローマ数字を検索
  const romanNumeral = str.match(/[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]/);

  // マッチしたローマ数字のインデックスを見つける
  return romanNumeral ? romanList.indexOf(romanNumeral[0]) + 1 : false;
};


const hasMatch = (target, names) => {
  return names.some(b => {
    if (typeof b === "string") {
      return target.includes(b); // 文字列なら完全一致
    } else if (b instanceof RegExp) {
      return target.some(a => b.test(a)); // 正規表現ならマッチ判定
    }
    return false; // 文字列でも正規表現でもない場合は無視
  });
};

const makeTeikyouJissekiOneUser = (masterRec, bDt, mltSvc ,svcSyubetu, outputRec) =>{
  // 最終レコードを書き換えるだけ
  const er = (target, value)=>{
    if (value === false) return;
    // C_CITYの場合は*を除去
    if (target === C_CITY) {
      value = removeAsterisk(value);
    }
    outputRec[outputRec.length - 1][target] = value;
  }
  // 様式番号
  const youshikiBangou = {
    放課後等デイサービス: '0501',
    児童発達支援: '0301',
    保育所等訪問支援: '0601',
  }
  // 利用回数の存在しないレコードも発生する 利用無しで上限管理ありの場合。
  // その場合、レコードを出力しない
  // 変更 2022/03/14 欠席のみの場合は出力する
  // if (!mltSvc && !bDt.countOfUse && !bDt.countOfKesseki){
  //   // outputRec.push([...kihonK611_1]);
  //   return false;
  // }

  // 2024/11/29 提供実績レコードを出力するかどうかの条件を変更
  // baseItemExistの有無をsvcSyubetuごとに確認するように変更
  const baseItemExist = bDt.itemTotal.find(e=>e.baseItem && e.s.startsWith(String(svcSyubetu)));
  const jissekiSvcNames = [ // 提供実績記録票に記載すべきターゲット名
    '食事提供加算','医療連携体制加算',/^家族支援加算[ⅠⅡ]/,'入浴支援加算','専門的支援実施加算',
    '通所自立支援加算','子育てサポート加算','集中的支援加算','自立サポート加算','延長支援',
    '初回加算','訪問支援員特別加算24','多職種連携支援加算','強度行動障害児支援加算','欠席時対応加算',
  ]
  // 提供実績記録票に記載すべきターゲット名のうち、svcSyubetuごとに存在するものを確認
  const itemNames = bDt.itemTotal.filter(e=>e.name && e.s.startsWith(String(svcSyubetu))).map(e=>e.name);
  const hasTargetSvc = hasMatch(itemNames, jissekiSvcNames ) 
  if (!baseItemExist && !hasTargetSvc){
    return false;
  }

  // サービス種別からサービス名を取得する
  const svcName = serviceSyubetu[svcSyubetu + ''];
  // 保訪の場合は欠席がないので常にゼロにする
  const countOfKesseki = svcSyubetu === 41 ? 0 : bDt.countOfKesseki;
  // マルチサービス用 利用がない場合は出力しない
  if (mltSvc && !bDt.tanniTotalSvc[svcName]){
    return null;
  }
  // 欠席でも計上するサービスコード
  const kessekiSvc = [
    ...KESSEKI_SVC_CODE, 
    ...KAZOKUSHIEN_SVC_CODE,
    // ...SOUDANSIEN_SVC_CODE, 
    // ...KATEI_SVC_CODE
  ];


  // console.log(bDt.countOfUse, 'bDt.countOfUse');
  // 基本情報レコード
  // const kihonK611_1 = Array(155).fill('');
  const kihonK611_1 = Array(173).fill('');
  kihonK611_1[0] = 'REC_NO';
  kihonK611_1[1] = 'K611';
  kihonK611_1[2] = '01';
  outputRec.push([...kihonK611_1]);

  er(C_YEAR_MOMTH, masterRec.thisMonth);
  er(C_CITY, bDt.scityNo);
  er(C_JI, masterRec.jino);
  er(C_HNO, bDt.hno);
  // er(C_YOUSHIKI, (bDt.service==='放課後等デイサービス')? '0501': '0301');
  er(C_YOUSHIKI, youshikiBangou[svcName]);

  // 算定時間合計
  if (svcSyubetu !== 64){
    er(C_KIHON_SANTEIGOUKEI, bDt.santeiJikanTotal);
  }

  //送迎回数片道
  if (svcSyubetu !== 64){
    let sougeiCnt = 0;
    bDt.itemTotal.filter(e=>SOUGEY_SVC_CODE.indexOf(e.s) > -1)
    .map(e=>{sougeiCnt += e.count});
    er(C_KIHON_CNT_SOUGEI, sougeiCnt);
  }

  let result;
  const itemTotal = bDt.itemTotal;
  result = svcCounter(svcSyubetu, [61], '食事提供加算', itemTotal);
  er(C_KIHON_CNT_SYOKUJI, result);

  result = svcCounter(svcSyubetu, [61, 63, ], '医療連携体制加算', itemTotal);
  er(C_KIHON_CNT_IRYOU, result);

  result = svcCounter(svcSyubetu, [61, 63, 64], /^家族支援加算[ⅠⅡ]/, itemTotal);
  er(C_KIHON_CNT_KAZOKUSHIEN, result);

  result = svcFirstDate(svcSyubetu, [61, 63, ], '集中的支援加算', bDt);
  er(C_KIHON_SYUUTYUUKAISI, result);
  
  result = svcCounter(svcSyubetu, [61, 63, ], '入浴支援加算', itemTotal);
  er(C_KIHON_CNT_NYUUYOKU, result);
  
  result = svcCounter(svcSyubetu, [61, 63, ], '専門的支援実施加算', itemTotal);
  er(C_KIHON_CNT_SENMONCHIEN, result);
  
  result = svcCounter(svcSyubetu, [63, ], '通所自立支援加算', itemTotal);
  er(C_KIHON_CNT_TUUSYOJIRITSY, result);
  
  result = svcCounter(svcSyubetu, [61, 63, ], '子育てサポート加算', itemTotal);
  er(C_KIHON_CNT_KOSODATESAPO, result);
  
  result = svcCounter(svcSyubetu, [61, 63, ], '集中的支援加算', itemTotal);
  er(C_KIHON_CNT_SYUUTYUUSHIEN, result);
  
  result = svcCounter(svcSyubetu, [63, ], '自立サポート加算', itemTotal);
  er(C_KIHON_CNT_JIRITSUSAPORT, result);
  
  result = svcCounter(svcSyubetu, [61, 63, ], '延長支援', itemTotal);
  er(C_KIHON_CNT_ENCHOUSHIEN, result);
  
  // 合計算定回数 保訪のみ
  // 保訪単独のときエラーになるのをfix
  if (svcSyubetu === 64){
    er(C_KIHON_GOUKEISANTEI, bDt?.countOfUseMulti?.[svcName] || bDt.countOfUse)
  }
  // 初回算定回数 保訪のみ
  if (svcSyubetu === 64){
    const v = bDt.itemTotal.filter(e => e.name === '初回加算')
    .reduce((v, e)=>(v + e.count), 0);
    er(C_KIHON_SYOKAI, v);
  }
  
  result = svcCounter(svcSyubetu, [64, ], '訪問支援員特別加算24', itemTotal);
  er(C_KIHON_CNT_HOUMONTOKUBETU, result);
  
  result = svcCounter(svcSyubetu, [64, ], '多職種連携支援加算', itemTotal);
  er(C_KIHON_CNT_TASYOKUSYU, result);
  
  result = svcCounter(svcSyubetu, [64, ], '強度行動障害児支援加算', itemTotal);
  er(C_KIHON_CNT_KYOUDOKOUDOU, result);
  


  // 処理終了後、最初のカラムに2を挿入。
  outputRec[outputRec.length - 1].unshift(2);

  // ----------------------------------------------------------- 明細情報レコード
  // const maisaiK611_2 = Array(97).fill('');
  const maisaiK611_2 = Array(114).fill('');
  // 共通項目は予めテンプレにセットしておく
  maisaiK611_2[0] = 'REC_NO';
  maisaiK611_2[1] = 'K611';
  maisaiK611_2[2] = '02';
  maisaiK611_2[C_YEAR_MOMTH] = masterRec.thisMonth;
  maisaiK611_2[C_CITY] = removeAsterisk(bDt.scityNo);
  maisaiK611_2[C_JI] = masterRec.jino;
  maisaiK611_2[C_HNO] = bDt.hno;
  maisaiK611_2[C_YOUSHIKI] = youshikiBangou[svcName];
  // 保訪かどうか
  // 日付オブジェクトのキーを抽出してソートしておく。
  // オブジェクトの検出順が変わることがあるため
  const daysUsed = Object.keys(bDt)
    .filter(e => e.match(/^D2[0-9]/))
    // .filter(e => bDt[e].service === svcName)
    // サービス名のフィルタではなくサービスコードでサービス種別に合致するものがあるかどうか調べる
    .filter(e=>bDt[e].items.find(f=>f.s.indexOf(svcSyubetu) === 0))
    .sort((a, b) => (a > b) ? 1 : -1);
  // userオブジェクトから日付オブジェクトを抽出して舐める
  daysUsed.map(did=>{
    const o = bDt[did];
    // itemsの中身をサービスコードで絞り込んでおく
    const items = o.items.filter(f => f.s && f.s.indexOf(svcSyubetu + '') === 0);
    // 欠席でも計上する加算の検出
    const kesseki = items.find(e => kessekiSvc.indexOf(e.s) > -1);
    // 欠席加算のない「欠席」はスキップ
    if (!kesseki && o.absence)  return false;

    outputRec.push([...maisaiK611_2]);
    // 欠席対応加算があるか
    const kessekiKasan = items.find(e=>KESSEKI_SVC_CODE.indexOf(e.s) > -1);
    // 初回加算あるか
    const syokaiKasan = items.find(e=>SYOKAI_SVC_CODE.indexOf(e.s) > -1);
    // 食事提供あるか
    const syokujiTeikyou = items.find(e=>SYOKUJI_SVC_CODE.indexOf(e.s) > -1);
    // 欠席対応加算だけなら8を設定
    // 2022/09/02　家庭連携加算などあっても8を設定
    // er(C_MEISAI_TEIKYOUJOUKYOU, (kessekiKasan && !karenKasan && !soudanKasan)? 8 : '');
    if (svcSyubetu !== 64){
      er(C_MEISAI_TEIKYOUJOUKYOU, (kessekiKasan)? 8 : '');
    }

    er(C_MEISAI_DATE, parseInt(did.substring(7, 9)));// 日付の日にちだけ キーの下二桁

    // 家族支援
    // 位置を変更。欠席でも記述されることがある 2024追加項目
    const kazokuShienItem = items.filter(e=>e.name).find(e=>e.name.match(/^家族支援加算[ⅠⅡ]/));
    if (kazokuShienItem){
      let v = false;
      if (kazokuShienItem.c.includes('Ⅰ１')) v = 1;
      if (kazokuShienItem.c.includes('Ⅰ２')) v = 2;
      if (kazokuShienItem.c.includes('Ⅰ３')) v = 3;
      if (kazokuShienItem.c.includes('Ⅰ４')) v = 4;
      if (kazokuShienItem.c.includes('Ⅱ１')) v = 5;
      if (kazokuShienItem.c.includes('Ⅱ２')) v = 6;
      er(C_MEISAI_KAZOKUSHIEN, v);
    }
    

    // 欠席の場合、最初のカラム[2]を挿入して終了
    if (kessekiKasan){
      outputRec[outputRec.length - 1].unshift(2);
      return false;
    }
    // 欠席の場合の開始終了時間の出力を抑制
    if (!o.absence){
    // if (!o.absence || svcSyubetu === 64){
      er(C_MEISAI_START_TIME, o.start? o.start.replace(':', ''): '');//開始時刻
      er(C_MEISAI_END_TIME, o.end? o.end.replace(':', ''): '');//終了時刻
    }
    // 送迎ありなし。配列の中身が空白なら送迎なし
    if (!o.absence && o.transfer){
      er(C_MEISAI_PICKUP, (o.transfer[0]) ? 1 : '');
      er(C_MEISAI_SEND, (o.transfer[1]) ? 1 : '');
    }
    // 保訪の場合送迎と開始終了時間を抑制する
    if (svcSyubetu === 64){
      er(C_MEISAI_START_TIME, '');//開始時刻
      er(C_MEISAI_END_TIME, '');//終了時刻
      er(C_MEISAI_PICKUP, '');
      er(C_MEISAI_SEND, '');
    }

    // er(C_MEISAI_TEIKYOUKEITAI, 1); // 利用実績があれば1
    let teikyoukeitai = '';
    if (svcSyubetu === 63){
      teikyoukeitai = o.offSchool? 2 : 1;
    }
    if (o.absence)  teikyoukeitai = ''; // 欠席時は出力しない
    er(C_MEISAI_TEIKYOUKEITAI, teikyoukeitai); // 平日=1、休日=2
    // 算定日数 保訪のみ出力
    if (svcSyubetu === 64 && !o.absence){
      er(C_MEISAI_SANTEINISSUU, 1);
    }
    // 初回加算
    if (syokaiKasan){
      er(C_KIHON_SYOKAI, 1)
    }
    // 食事提供
    if (syokujiTeikyou){
      er(C_MEISAI_SYOKUJITEIKYOU, 1);
    }
    // -------------- ここから2024追加項目！！！
    // 医療連携
    er(C_MEISAI_SANTEI_TIME, o.santeiJikan);
    let targetItem;
    targetItem = items.find(e=>e.name === '医療連携体制加算');
    if (targetItem){
      const v = getRomanIndex(targetItem.value);
      er(C_MEISAI_IRYOURENKEI, v);
    }
    // // 家族支援
    // targetItem = items.filter(e=>e.name).find(e=>e.name.match(/^家族支援加算[ⅠⅡ]/));
    // if (targetItem){
    //   let v = false;
    //   if (targetItem.c.includes('Ⅰ１')) v = 1;
    //   if (targetItem.c.includes('Ⅰ２')) v = 2;
    //   if (targetItem.c.includes('Ⅰ３')) v = 3;
    //   if (targetItem.c.includes('Ⅰ４')) v = 4;
    //   if (targetItem.c.includes('Ⅱ１')) v = 5;
    //   if (targetItem.c.includes('Ⅱ２')) v = 6;
    //   er(C_MEISAI_KAZOKUSHIEN, v);
    // }
    // 延長支援
    targetItem = items.find(e=>e.name === '延長支援');
    if (targetItem){
      const i = parseInt(targetItem.value);
      const v = [3, 1, 2].findIndex(e => e === i) + 1;
      if (!v) v = false;
      er(C_MEISAI_ENCHOU, v);
    }

    // 1を立てるだけの項目 erはtargetValがfalseだとなにもしない
    let targetVal;
    targetVal = items.find(e=>e.name === '入浴支援加算')? 1: false;
    er(C_MEISAI_NYUUYOKU, targetVal);
    targetVal = items.find(e=>e.name === '専門的支援実施加算')? 1: false;
    er(C_MEISAI_SENMONSHIEN, targetVal);
    targetVal = items.filter(e=>e.name === '通所自立支援加算').length;
    if (!targetVal) targetVal = false; // この項目だけ一日二回カウントされることがある
    er(C_MEISAI_TUUSYOJIRITSU, targetVal);
    targetVal = items.find(e=>e.name === '子育てサポート加算')? 1: false;
    er(C_MEISAI_KOSODATE, targetVal);
    targetVal = items.find(e=>e.name === '集中的支援加算')? 1: false;
    er(C_MEISAI_SYUUTYUU, targetVal);
    targetVal = items.find(e=>e.name === '自立サポート加算')? 1: false;
    er(C_MEISAI_JIRITUSSAPORT, targetVal);
    // 保訪の項目
    if (svcSyubetu === 64){
      targetVal = items.find(e=>e.name === '初回加算')? 1: false;
      er(C_MEISAI_SYOKAI, targetVal);
      targetItem = items.find(e=>e.name === '訪問支援員特別加算24');
      if (targetItem){
        er(C_MEISAI_HOUMONSHIENTOKUBETSU, targetItem.value);
      }
      targetVal = items.find(e=>e.name === '多職種連携支援加算')? 1: false;
      er(C_MEISAI_TAKISYURENKEY, targetVal);
      targetVal = items.find(e=>e.name === '強度行動障害児支援加算')? 1: false;
      er(C_MEISAI_KYOUDOKOUDOU, targetVal);

    }
    // 明細レコードは処理終了後、最初のカラムに2を挿入。
    outputRec[outputRec.length - 1].unshift(2);
  });
}

export const makeTeikyouJisseki = (billingDt, masterRec) =>{
  const outputRec = [];
  // ヘッダの作成
  const soudanServiceName = [SYOUGAI_SOUDAN, KEIKAKU_SOUDAN]
  csvHaed(outputRec, masterRec, 'K61');
  // 2024/01/16 相談支援はデータを作成しない
  billingDt.filter(e=>!soudanServiceName.includes(e.service)).forEach(bDt=>{
    const mltSvc = bDt.serviceSyubetu.length > 1;
    bDt.serviceSyubetu.forEach(svcSyubetu => {
      // bdt 一人分の請求データ
      // mltSvc 複数サービスかどうか
      // svcSyubetu サービス種別を記述
      // outputRec 出力用配列
      makeTeikyouJissekiOneUser(masterRec, bDt, mltSvc, svcSyubetu, outputRec);
    });
  });
  outputRec.push([...endRecord]); // エンドレコード挿入
  outputRec.map((e, i) => {
    elmRep(e, REC_NO, i + 1);
  });
  elmRep(outputRec[0], REC_CNT, outputRec.length - 2); // レコード件数記載
  // console.log('outputRec stringify', JSON.stringify(outputRec));
  if (outputRec.length > 2){
    return outputRec;
  }
  else{
    return [];
  }

  return outputRec;
}
