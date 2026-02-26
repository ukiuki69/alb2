// setDeepPath: オブジェクトや配列の指定された深いパスに値を設定します。イミュータブルな操作が行われます。
// 引数:
//   - obj: 変更するオブジェクトや配列
//   - path: ドットで区切られた文字列またはキーの配列形式の深いパス
//   - value: 指定されたパスに設定する値
//   - fail: エラーが発生した場合に返される値 (オプション、デフォルトは null)
// 戻り値:
//   更新されたオブジェクトまたはエラー発生時の fail の値

export const setDeepPath = (obj, path, value, fail = null) => {
  if (typeof path === 'string') {
    path = path.split('.');
  }

  // isObject: 値がオブジェクトかどうかをチェックします
  const isObject = (value) => typeof value === 'object' && value !== null;

  if (!isObject(obj)) {
    return fail;
  }

  const updatedObj = Array.isArray(obj) ? [...obj] : { ...obj };

  let current = updatedObj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (key in current) {
      // カレントのプロパティがオブジェクトの場合は、シャローコピーを作成します
      current[key] = isObject(current[key]) ? { ...current[key] } : {};
      current = current[key];
    } else {
      const newObj = {};
      current[key] = newObj;
      current = newObj;
    }
  }

  const lastKey = path[path.length - 1];
  current[lastKey] = value;

  return updatedObj;
}

// findDeepPathN: オブジェクトや配列から指定された深いパスを辿り、値を返します。
// 存在しない場合は指定された notFound の値を返します。
// 引数:
//   - obj: 探索対象のオブジェクトや配列
//   - path: ドットで区切られた文字列またはキーの配列形式の深いパス
//   - notFound: 値が見つからなかった場合に返される値 (オプション、デフォルトは null)
// 戻り値:
//   指定された深いパスに対応する値、もしくは notFound の値

export const findDeepPathN = (obj, path, notFound = null) => {
  if (typeof path === 'string') {
    path = path.split('.');
  }

  let current = obj;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (current && key in current) {
      current = current[key];
    } else {
      return notFound;
    }
  }

  return current;
};

// オブジェクトからパスの深いところを探す
export const findDeepPath = (obj, path, notFound = null) => {
  if (typeof path === 'string') {
    path = path.split('.');
  }

  let a = Object.assign({}, obj);
  let b;
  let rtn;
  for (let i = 0; i < path.length; i++) {
    let e = path[i];
    if (a && e in a) {
      if (typeof a[e] === 'object' && a[e] !== null) b = Object.assign({}, a[e]);
      else {
        rtn = a[e];
        break;
      }
      if (!Object.keys(b).length) {
        rtn = i === path.length - 1 ? a[e] : null;
        break;
      }
      a = Object.assign({}, b);
      rtn = Object.assign({}, b);
    } else {
      rtn = null;
      break;
    }
  }
  const r = rtn ? rtn : notFound;
  return r;
};

// 求められた値がfalseの時にも対応したバージョン
export const findDeepPath1 = (obj, path, notFound = null) => {
  if (typeof path === 'string') {
    path = path.split('.');
  }

  let a = Object.assign({}, obj);
  let b;
  let rtn;
  for (let i = 0; i < path.length; i++) {
    let e = path[i];
    if (a && e in a) {
      if (typeof a[e] === 'object' && a[e] !== null) b = Object.assign({}, a[e]);
      else {
        rtn = a[e];
        break;
      }
      if (!Object.keys(b).length) {
        rtn = i === path.length - 1 ? a[e] : null;
        break;
      }
      a = Object.assign({}, b);
      rtn = Object.assign({}, b);
    } else {
      rtn = null;
      break;
    }
  }
  const r = rtn || rtn === false ? rtn : notFound;
  return r;
};

// エイリアス
export const fdp = (obj, path, notFound = null) => {
  return findDeepPath(obj, path, notFound);
};

export const fdpn = findDeepPathN;
export const sdp = setDeepPath;
