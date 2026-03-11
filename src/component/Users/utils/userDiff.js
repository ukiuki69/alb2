/**
 * 2つのユーザーオブジェクトを再帰的に比較し、変更点のリストを返す。
 * etc 配下のネストされたオブジェクトも再帰的に調べる。
 *
 * @param {Object} prev - 比較元データ
 * @param {Object} next - 比較先データ
 * @param {string} prefix - 再帰呼び出し時のキープレフィックス
 * @returns {Array<{key: string, prev: any, next: any}>}
 */
export const userDiff = (prev, next, prefix = '') => {
  const changes = [];
  const allKeys = new Set([
    ...Object.keys(prev ?? {}),
    ...Object.keys(next ?? {}),
  ]);

  for (const key of allKeys) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const p = (prev ?? {})[key];
    const n = (next ?? {})[key];

    // どちらか一方でもオブジェクト（非配列）なら再帰（null/undefined は {} として扱う）
    const pIsObj = p !== null && p !== undefined && typeof p === 'object' && !Array.isArray(p);
    const nIsObj = n !== null && n !== undefined && typeof n === 'object' && !Array.isArray(n);
    if (pIsObj || nIsObj) {
      changes.push(...userDiff(pIsObj ? p : {}, nIsObj ? n : {}, fullKey));
    } else {
      // JSON文字列で比較（型の違いも捉える）
      if (JSON.stringify(p) !== JSON.stringify(n)) {
        changes.push({ key: fullKey, prev: p, next: n });
      }
    }
  }
  return changes;
};
