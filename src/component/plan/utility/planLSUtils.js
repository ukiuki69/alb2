import { getLSTS, setLSTS } from '../../../modules/localStrageOprations';

const KEEP_SECONDS = 3 * 60 * 60;
const LS_KEY = 'plan_created_dates';

/**
 * 作成日を履歴としてローカルストレージに保存する（1日間有効）
 * @param {string} createdDate - 保存する日付
 */
export const saveCreatedDateToLS = (createdDate) => {
  if (!createdDate) return;

  // 1日経過したものは取得時に自動で削除される
  const currentList = getLSTS(LS_KEY, KEEP_SECONDS) || [];

  if (!currentList.includes(createdDate)) {
    const newList = [...currentList, createdDate];
    setLSTS(LS_KEY, newList);
  }
};

/**
 * 保存されている作成日の配列を取得する
 * @returns {string[]} 日付の配列
 */
export const getCreatedDatesFromLS = () => {
  return getLSTS(LS_KEY, KEEP_SECONDS) || [];
};
