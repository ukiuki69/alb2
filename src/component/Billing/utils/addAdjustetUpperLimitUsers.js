/**
 * ユーザー情報の priceLimit を調整上限額で上書きし、
 * adjustetUpperLimit フィールドを追加した新しいユーザー配列を返します。
 * 
 * @param {Array} users - ユーザー情報の配列
 * @param {Object} schedule - スケジュールオブジェクト
 * @returns {Array} 修正されたユーザー情報の配列
 */
export const addAdjustetUpperLimitUsers = (users, schedule) => {
  if (!users || !Array.isArray(users)) return [];
  const adjustetUpperLimit = schedule?.adjustetUpperLimit;
  if (!adjustetUpperLimit) return users;

  return users.map(user => {
    const uidKey = 'UID' + user.uid;
    const adjustedValue = adjustetUpperLimit[uidKey];

    // 値が存在する場合（0を含む）に上書き・追加を行う
    if (adjustedValue !== undefined && adjustedValue !== null && adjustedValue !== '') {
      const numValue = Number(adjustedValue);
      return {
        ...user,
        // priceLimit: numValue, // 指示：priceLimitを入れ替える
        adjustetUpperLimit: numValue // 指示：adjustetUpperLimitを追加する
      };
    }
    return user;
  });
};

