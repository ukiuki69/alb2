// パーミッション文字列をパースする
// 1000以下の数値は数値にする
// 現在の項目仕様 999-サービス,単位
export const parsePermission = (account) => {
  if (!account || !account.permission) return [[0], [0]];
  const t = account.permission.split('-');
  const u = t.map((e) => e.split(','));
  u.map((e, i) => {
    e.map((f, j) => {
      if (!isNaN(f)) {
        if (parseInt(f) < 1000) u[i][j] = parseInt(f);
      }
    });
  });
  if (u.length < 2) u.push([0]);
  return u;
};

// パーミッションの名前を取得する
export const getPermissionName = (account, permissionNames) => {
  if (!account) return '【権限未設定】';
  const permission = parsePermission(account)[0][0];
  // 権限値が完全に一致するものを優先して検索
  const pmsItem = permissionNames.find((e) => e.value === permission) 
                || permissionNames.find((e) => e.value <= permission);
  if (pmsItem) return pmsItem.name;
  else return '【権限未設定】';
};

