/**
 * 汎用的なユーティリティ
 */

// オブジェクトの型を返す
export const typeOf = (v) => {
  const toString = Object.prototype.toString;
  let rtn = toString.call(v).slice(8, -1).toLowerCase();
  rtn = (rtn === 'number' && isNaN(v)) ? 'NaN' : rtn;
  return rtn;
};

// オブジェクトから特定の値を持つ要素を削除する
export const removeFromObj = (obj, value) => {
  let rt = Object.assign({}, obj);
  const toRemove = Object.entries(obj).map(([key, val]) => {
    if (val === value) return key;
    return null;
  }).filter(e => e !== null);
  toRemove.forEach((e) => {
    delete rt[e];
  });
  return rt;
};

// オブジェクトを配列にする
export const objToArray = (obj) => {
  const rt = [];
  if (obj === undefined) return rt;
  for (let k of Object.keys(obj)) {
    rt.push([k, obj[k]]);
  }
  return rt;
};

// オブジェクトを配列にする キーは無視される
export const objToArrayIgnoreKey = (obj) => {
  if (!obj) return [];
  return Object.keys(obj).map((e) => obj[e]);
};

// オブジェクトを配列にする キーはオブジェクトに組み込まれる
export const objToArrayWithKey = (obj) => {
  if (!obj) return [];
  return Object.keys(obj).map((e) => ({ ...obj[e], key: e }));
};

// オブジェクトからパスの深いところを探す
export const findDeepPath = (obj, path, notFound = null) => {
  if (typeof path === 'string') {
    path = path.split('.');
  }
  let current = obj;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return notFound;
    }
  }
  return current === undefined ? notFound : current;
};

// 求められた値がfalseの時にも対応したバージョン
export const findDeepPath1 = (obj, path, notFound = null) => {
  const res = findDeepPath(obj, path, undefined);
  return (res !== undefined) ? res : notFound;
};

// エイリアス
export const fdp = (obj, path, notFound = null) => findDeepPath(obj, path, notFound);

// 配列の比較を行う 差分の配列を返す
export const compareArrays = (a1, a2) => {
  const diff1 = a1.filter((e) => a2.indexOf(e) === -1);
  const diff2 = a2.filter((e) => a1.indexOf(e) === -1);
  return [...diff1, ...diff2];
};

export const asyncSleep = async (s) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 1000 * s);
  });
};

export const toClipboard = (text, setSnack, msg = '') => {
  navigator.clipboard.writeText(text).then(
    () => {
      if (typeof setSnack === 'function') {
        setSnack({ msg: msg || 'コピーしました。', severity: '' });
      }
    },
    (err) => {
      console.error('Async: Could not copy text: ', err);
    }
  );
};

// uriを解釈する
export const locationPrams = () => {
  const href = window.location.href;
  const parts = href.split('?');
  const body = parts[0];
  const prms = parts[1] || null;
  const detail = {};
  if (prms) {
    prms.split('&').forEach((e) => {
      const kv = e.split('=');
      detail[kv[0]] = kv[1] || '';
    });
  }
  return { href, body, prms, detail };
};

// キーボードイベントを受け取る
export const isCmmdOrCtrl = (ev) => {
  return (ev.ctrlKey && !ev.metaKey) || (!ev.ctrlKey && ev.metaKey);
};

// \nを<br>に変換する
export const lfToBr = (str) => {
  if (typeof str === 'string') {
    return str.replace(/(\\n|\n)/g, '<br>');
  }
  return str;
};

// <br>を\nに変換する
export const brtoLf = (str) => {
  if (typeof str === 'string') {
    return str.replace(/<br[\s/]*>/gi, '\n');
  }
  return str;
};

