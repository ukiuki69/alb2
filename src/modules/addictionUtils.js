/**
 * addictionUtils.js
 * 加算フォームの表示判定ユーティリティ
 *
 * AddictionFormParts.js のコンポーネント群が内部で行っていた
 * useGetDef（デフォルト値の階層検索）と表示/非表示判定ロジックを
 * 通常のユーティリティ関数として切り出したもの。
 *
 * store.getState() を使用するため、コンポーネントの再レンダリングは
 * 呼び出し側が useSelector 等で制御する必要がある。
 */

import store from '../store';
import { getUser, convDid } from '../commonModule';
import { convUID } from './albUtils';
import { getPriorityService } from '../component/Billing/blMakeData';
import { isService } from '../albCommonModule';
import { HOUDAY, JIHATSU, HOHOU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from './contants';

// ---- #1: getDef ----
// useGetDef と同じ階層検索ロジック（Hook ではない通常関数）
export const getDef = (name, uid = '', did = '', dLyer = 10, pSch) => {
  did = (typeof did === 'object') ? convDid(did) : did;
  if (!isNaN(uid) && uid !== '') uid = 'UID' + uid;

  const state = store.getState();
  const { com, users, classroom } = state;
  const schedule = pSch || state.schedule;
  const stateService = state.service;

  const thisUser = getUser(uid, users);
  const uService = thisUser.service;
  let service = (uService && uService.split(',').length === 1) ? uService : stateService;
  if (!service) {
    service = getPriorityService(uService);
  }

  let rt = null;
  if (dLyer > -1) {
    rt = com?.addiction?.[service]?.[name] ?? null;
  }
  if (dLyer > 0 && !rt) {
    rt = schedule?.[service]?.[uid]?.addiction?.[name] ?? null;
  }
  if (dLyer > 1 && !rt) {
    rt = schedule?.[service]?.[did]?.[name] ?? null;
  }
  if (dLyer > 1 && !rt && classroom) {
    rt = schedule?.[service]?.[did]?.[classroom]?.[name] ?? null;
  }
  if (dLyer > 2 && !rt) {
    rt = schedule?.[uid]?.[did]?.dAddiction?.[name] ?? null;
  }

  // 利用実績の表示設定で非表示に設定されているか
  const hideAddiction = com?.ext?.hideaddiction ?? {};
  if (hideAddiction[name] === 1) {
    rt = -1;
  }
  return rt;
};

// ---- getDispControle（既存のAddictionFormPartsCommonと同一ロジック） ----
export const getDispControle = (predef) => {
  const notDisp = (parseInt(predef) === -1);
  const disabled = !!predef;
  return [disabled, notDisp];
};

// ---- #2: 表示判定関数 ----
// 各加算コンポーネントの表示可否・disabled・デフォルト値を返す
//
// 戻り値: { visible, disabled, defaultValue, preDef, def }
//   visible: false → コンポーネントを描画しない
//   disabled: true → 描画するが編集不可
//   defaultValue: フォームの初期値
//   preDef: 上位レイヤのデフォルト値（そのまま渡す用）
//   def: 自レイヤのデフォルト値

/**
 * 汎用の表示判定
 * @param {string} nameJp - 加算名（日本語）
 * @param {object} params
 * @param {string} params.uid
 * @param {string} params.did
 * @param {number} params.dLayer
 * @param {object} [params.schedule] - カスタムschedule（未指定ならstoreから）
 * @returns {{ visible: boolean, disabled: boolean, defaultValue: any, preDef: any, def: any }}
 */
const baseVisibility = (nameJp, { uid = '', did = '', dLayer = 10, schedule } = {}) => {
  const preDef = getDef(nameJp, uid, did, dLayer - 1, schedule);
  const def = getDef(nameJp, uid, did, dLayer, schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const defaultValue = disabled ? preDef : def;
  return { visible: !notDisp, disabled, defaultValue, preDef, def };
};

// ヘルパー: 現在のサービスを取得
const resolveService = (uid) => {
  const state = store.getState();
  const { users, service: stateService } = state;
  if (uid) {
    const user = getUser(uid, users);
    const uSvc = user.service;
    if (uSvc && uSvc.split(',').length === 1) return uSvc;
  }
  if (stateService) return stateService;
  return '';
};

// ヘルパー: ユーザー情報を取得
const resolveUser = (uid) => {
  const state = store.getState();
  return uid ? getUser(uid, state.users) : {};
};

/**
 * 全加算項目の表示判定定義
 * 各エントリは nameJp と visibility 関数を持つ
 *
 * visibility(params) → baseVisibility の結果を上書きする追加条件
 *   params: { uid, did, dLayer, schedule }
 *   戻り値: null = baseVisibility をそのまま使う
 *           { visible: false } = 非表示にする
 */
const ADDICTION_VISIBILITY_RULES = {
  // --- サービス限定: 放デイ・児発のみ ---
  '定員': {
    services: [HOUDAY, JIHATSU],
  },
  '地域区分': {},
  '障害児状態等区分': {},
  '共生型サービス': {
    services: [HOUDAY, JIHATSU],
  },
  '基準該当': {
    services: [HOUDAY, JIHATSU],
  },
  '福祉専門職員配置等加算': {
    services: [HOUDAY, JIHATSU],
  },
  '児童指導員等加配加算': {
    services: [HOUDAY, JIHATSU],
  },
  '児童指導員配置加算': {},
  '看護職員加配加算': {
    services: [HOUDAY, JIHATSU],
  },
  '開所時間減算': {
    services: [HOUDAY, JIHATSU],
  },
  '医療連携体制加算': {
    services: [HOUDAY, JIHATSU],
  },
  '身体拘束廃止未実施減算': {
    services: [HOUDAY, JIHATSU],
  },
  '共生型サービス体制強化加算': {
    services: [HOUDAY, JIHATSU],
  },
  '定員超過利用減算': {
    services: [HOUDAY, JIHATSU],
  },
  'サービス提供職員欠如減算': {
    services: [HOUDAY, JIHATSU],
  },
  '児童発達支援管理責任者欠如減算': {
    services: [HOUDAY, JIHATSU, HOHOU],
  },

  // --- 日付 + サービス条件 ---
  '福祉・介護職員処遇改善特別加算': {
    services: [HOUDAY, JIHATSU],
    custom: ({ uid }) => {
      const stdDate = store.getState().stdDate;
      if (stdDate >= '2022-10-01') return { visible: false };
      return null;
    },
  },
  '福祉・介護職員等ベースアップ等支援加算': {
    services: [HOUDAY, JIHATSU, HOHOU],
    custom: () => {
      const stdDate = store.getState().stdDate;
      if (stdDate < '2022-10-01' || stdDate >= '2024-06-01') return { visible: false };
      return null;
    },
  },
  '福祉・介護職員処遇改善加算': {
    services: [HOUDAY, JIHATSU, HOHOU],
  },
  '延長支援加算': {
    services: [HOUDAY, JIHATSU],
    custom: () => {
      const stdDate = store.getState().stdDate;
      if (stdDate >= '2024-04-01') return { visible: false };
      return null;
    },
  },
  '特別支援加算': {},
  '家庭連携数': {},
  '家庭連携加算': {},
  '関係機関連携加算': {},
  '事業所内相談支援加算': {},
  '強度行動障害児支援加算': {
    services: [HOUDAY, JIHATSU, HOHOU],
  },
  '保育・教育等移行支援加算': {
    services: [HOUDAY, JIHATSU],
  },
  '欠席時対応加算': {
    services: [HOUDAY, JIHATSU],
  },
  '人工内耳装用児支援加算': {
    custom: ({ uid }) => {
      const state = store.getState();
      const service = resolveService(uid);
      if (service !== JIHATSU || state.stdDate <= '2024-04-01') return { visible: false };
      return null;
    },
  },
  '訪問支援加算': {},
  '利用者負担上限額管理加算': {
    custom: ({ uid }) => {
      const user = resolveUser(uid);
      const kanri = user.kanri_type === '管理事業所';
      const firstBros = parseInt(user.brosIndex) === 1;
      if (!kanri && !firstBros) return { visible: false };
      return null;
    },
  },
  '特定処遇改善加算': {
    services: [HOUDAY, JIHATSU, HOHOU],
    custom: () => {
      const stdDate = store.getState().stdDate;
      if (stdDate >= '2024-06-01') return { visible: false };
      return null;
    },
  },
  '自己評価結果等未公表減算': {
    services: [HOUDAY, JIHATSU],
  },
  '通所支援計画未作成減算': {
    services: [HOUDAY, JIHATSU],
  },
  '支援プログラム未公表減算': {
    services: [HOUDAY, JIHATSU],
    custom: () => {
      const stdDate = store.getState().stdDate;
      if (stdDate < '2025-04-01') return { visible: false };
      return null;
    },
  },
  '医療的ケア児支援加算': {
    custom: ({ uid }) => {
      const user = resolveUser(uid);
      const icareType = user?.icareType || '';
      if (!icareType.includes('医療的ケア')) return { visible: false };
      return null;
    },
  },
  '相談支援加算': {},
  '個別サポート加算１': {
    services: [HOUDAY, JIHATSU],
  },
  '個別サポート加算２': {
    services: [HOUDAY, JIHATSU],
  },
  'サービス提供時間区分': {
    custom: () => {
      const state = store.getState();
      if (state.service !== HOUDAY) return { visible: false };
      if (state.stdDate >= '2024-04-01') return { visible: false };
      return null;
    },
  },
  '専門的支援加算': {
    services: [HOUDAY, JIHATSU],
    custom: () => {
      const stdDate = store.getState().stdDate;
      if (stdDate >= '2024-04-01') return { visible: false };
      return null;
    },
  },
  '食事提供加算': {
    custom: () => {
      const service = store.getState().service;
      if (service !== JIHATSU) return { visible: false };
      return null;
    },
  },
  '栄養士配置加算': {
    services: [HOUDAY, JIHATSU],
  },
  '地方公共団体': {
    custom: () => {
      const service = store.getState().service;
      if (service !== JIHATSU) return { visible: false };
      return null;
    },
  },
  '就学区分': {
    custom: () => {
      const service = store.getState().service;
      if (service !== JIHATSU) return { visible: false };
      return null;
    },
  },
  '児童発達支援センター': {
    custom: () => {
      const service = store.getState().service;
      if (service !== JIHATSU) return { visible: false };
      return null;
    },
  },
  '重症心身型': {
    services: [HOUDAY, JIHATSU],
  },
  'サービスごと単位': {
    services: [HOUDAY, JIHATSU],
  },
  '児童発達支援無償化': {
    services: [JIHATSU, HOHOU],
  },
  '児童発達支援無償化自動設定': {
    services: [JIHATSU, HOHOU],
  },
  '多子軽減措置': {
    services: [JIHATSU, HOHOU],
  },
  '保育訪問': {
    custom: ({ uid }) => {
      const state = store.getState();
      const user = resolveUser(uid);
      const hasHohou = isService(user, HOHOU);
      if (!hasHohou) return { visible: false };
      return null;
    },
  },
  '放課後デイ専門': {
    custom: () => {
      const state = store.getState();
      if (state.service !== HOHOU) return { visible: false };
      if (state.stdDate >= '2024-06-01') return { visible: false };
      return null;
    },
  },
  '初回加算': {
    custom: ({ uid }) => {
      const state = store.getState();
      const user = resolveUser(uid);
      const svcs = [HOHOU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN];
      if (uid) {
        if (!svcs.includes(user.service) && !(user.service || '').includes(HOHOU)) {
          return { visible: false };
        }
      }
      return null;
    },
  },
  '特地加算': {
    custom: () => {
      const service = store.getState().service;
      if (![KEIKAKU_SOUDAN, SYOUGAI_SOUDAN].includes(service)) return { visible: false };
      return null;
    },
  },
  '送迎加算Ⅰ一定条件': {
    services: [HOUDAY, JIHATSU],
    custom: () => {
      const stdDate = store.getState().stdDate;
      if (stdDate >= '2024-04-01') return { visible: false };
      return null;
    },
  },

  // --- 2024-04-01 以降のコンポーネント群 ---
  '算定時間設定方法': {
    dateMin: '2024-04-01',
  },
  '虐待防止措置未実施減算': {
    dateMin: '2024-04-01',
  },
  '業務継続計画未策定減算': {
    dateMin: '2024-04-01',
  },
  '情報公表未報告減算': {
    dateMin: '2024-04-01',
  },
  '中核機能強化加算': {
    dateMin: '2024-04-01',
  },
  '中核機能強化事業所加算': {
    dateMin: '2024-04-01',
  },
  '専門的支援体制加算': {
    dateMin: '2024-04-01',
  },
  '家族支援加算Ⅰ': {
    dateMin: '2024-04-01',
  },
  '家族支援加算Ⅱ': {
    dateMin: '2024-04-01',
  },
  '子育てサポート加算': {
    dateMin: '2024-04-01',
  },
  '専門的支援実施加算': {
    dateMin: '2024-04-01',
  },
  '視覚聴覚言語機能障害児支援加算': {
    dateMin: '2024-04-01',
  },
  '入浴支援加算': {
    dateMin: '2024-04-01',
  },
  '送迎加算設定': {
    dateMin: '2024-04-01',
  },
  '集中的支援加算': {
    dateMin: '2024-04-01',
  },
  '個別サポート加算３': {
    dateMin: '2024-04-01',
  },
  '事業所間連携加算': {
    dateMin: '2024-04-01',
  },
  '自立サポート加算': {
    services: [HOUDAY],
    dateMin: '2024-04-01',
    custom: ({ uid }) => {
      const user = resolveUser(uid);
      const ageStr = user?.ageStr || '';
      const ageNum = parseInt((ageStr).replace('歳', ''));
      const isOver18 = !isNaN(ageNum) && ageNum >= 18;
      if (!['高2', '高3'].includes(ageStr) && !isOver18) return { visible: false };
      return null;
    },
  },
  '通所自立支援加算': {
    services: [HOUDAY],
    dateMin: '2024-04-01',
  },
  '強度行動障害児支援加算９０日以内': {
    dateMin: '2024-04-01',
  },
  '多職種連携支援加算': {
    dateMin: '2024-04-01',
  },
  'ケアニーズ対応加算': {
    dateMin: '2024-04-01',
    custom: ({ uid }) => {
      const user = resolveUser(uid);
      const svcStr = user?.service || '';
      if (!svcStr.includes(HOHOU)) return { visible: false };
      return null;
    },
  },
  '訪問支援員特別加算24': {
    dateMin: '2024-04-01',
  },
  '時間区分延長支援自動設定': {
    dateMin: '2024-04-01',
  },
  '個別サポートⅠ１設定': {
    dateMin: '2024-04-01',
  },
  '特別地域加算': {
    dateMin: '2024-04-01',
  },

  // --- 2024-11-01 以降 ---
  '医療的ケア児基本報酬': {
    services: [HOUDAY, JIHATSU],
    dateMin: '2024-11-01',
    custom: ({ uid }) => {
      const state = store.getState();
      const user = resolveUser(uid);
      const uidStr = convUID(uid).str;
      const uAddiction = state.schedule?.[state.service]?.[uidStr]?.addiction?.医療ケア児基本報酬区分;
      if (!user?.icareType) return { visible: false };
      if (uAddiction) return { visible: false };
      return null;
    },
  },
  '医療的ケア児延長支援': {
    services: [HOUDAY, JIHATSU],
    dateMin: '2024-11-01',
    custom: ({ uid }) => {
      const state = store.getState();
      const user = resolveUser(uid);
      const uidStr = convUID(uid).str;
      const uAddiction = state.schedule?.[state.service]?.[uidStr]?.addiction?.医療ケア児基本報酬区分;
      if (!user?.icareType) return { visible: false };
      if (uAddiction) return { visible: false };
      return null;
    },
  },

  // --- 無条件 ---
  '強度行動障害児支援加算無効化': {
    services: [HOUDAY, JIHATSU],
  },
};

/**
 * 加算項目の表示判定
 *
 * @param {string} nameJp - 加算名（日本語キー）
 * @param {object} params
 * @param {string} [params.uid] - ユーザーID
 * @param {string} [params.did] - 日付ID
 * @param {number} [params.dLayer=10] - 検索レイヤ深度
 * @param {object} [params.schedule] - カスタムschedule
 * @returns {{ visible: boolean, disabled: boolean, defaultValue: any, preDef: any, def: any }}
 */
export const getAddictionVisibility = (nameJp, params = {}) => {
  const { uid = '', did = '', dLayer = 10, schedule } = params;
  const base = baseVisibility(nameJp, { uid, did, dLayer, schedule });

  // notDisp（hideaddiction設定）で非表示
  if (!base.visible) return base;

  const rule = ADDICTION_VISIBILITY_RULES[nameJp];
  if (!rule) {
    // ルール未定義 → baseVisibilityのみで判断
    return base;
  }

  const state = store.getState();
  const service = resolveService(uid);

  // サービスフィルタ
  if (rule.services && rule.services.length > 0) {
    if (!rule.services.includes(service)) {
      return { ...base, visible: false };
    }
  }

  // 日付下限
  if (rule.dateMin) {
    if (state.stdDate < rule.dateMin) {
      return { ...base, visible: false };
    }
  }

  // 日付上限
  if (rule.dateMax) {
    if (state.stdDate >= rule.dateMax) {
      return { ...base, visible: false };
    }
  }

  // カスタム判定
  if (rule.custom) {
    const customResult = rule.custom({ uid, did, dLayer, schedule });
    if (customResult && customResult.visible === false) {
      return { ...base, visible: false };
    }
  }

  return base;
};

/**
 * 全加算項目名の一覧を取得
 * @returns {string[]}
 */
export const getAddictionNames = () => Object.keys(ADDICTION_VISIBILITY_RULES);

/**
 * 指定された加算項目リストに対して一括で表示判定を行う
 *
 * @param {string[]} names - 加算名の配列
 * @param {object} params - getAddictionVisibility に渡すパラメータ
 * @returns {Object.<string, {visible: boolean, disabled: boolean, defaultValue: any}>}
 */
export const getAddictionVisibilityBatch = (names, params = {}) => {
  const result = {};
  names.forEach(name => {
    result[name] = getAddictionVisibility(name, params);
  });
  return result;
};
