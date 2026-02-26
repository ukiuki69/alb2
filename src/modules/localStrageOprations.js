// ローカルストレージ関連
export const LOCAL_STRAGE_PRINT_TITLE = 'LOCAL_STRAGE_PRINT_TITLE';
// 指定されたキーからLocal Storageに保存されたデータを取得し、経過秒数に基づいて有効期限を検証します。
// 期限切れのデータは削除され、nullが返されます。
export const getLocalStorageItemWithTimeStamp = (key, expirationSeconds) => {
  try {
    const data = localStorage.getItem(key);

    if (!data) {
      return null;
    }

    const parsedData = JSON.parse(data);
    const currentTime = new Date();
    const storedTime = new Date(parsedData.timestamp);
    const timeDifferenceInSeconds = (currentTime - storedTime) / 1000;

    if (timeDifferenceInSeconds > expirationSeconds) {
      removeLocalStorageItem(key);
      return null;
    }

    return parsedData.value;
  } catch (error) {
    console.error(`Error getting key [${key}] from localStorage: ${error}`);
    return null;
  }
};
// 単純なエイリアス
// json parse可能であればparseする。
// export const getLocalStorage = (key) => (JSON.parse(localStorage.getItem(key)));
export const getLocalStorage = (key) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v;
  } catch (error) {
    return localStorage.getItem(key);
  }
};
export const setLocalStorage = (key, value) => {
  if (typeof value === 'object') value = JSON.stringify(value);
  localStorage.setItem(key, value);
};
// 指定されたキーと値をLocal Storageに保存し、現在のタイムスタンプを一緒に記録します。
// これにより、データの有効期限管理が容易になります。
export const setLocalStorageItemWithTimeStamp = (key, value) => {
  try {
    const data = {
      value: value,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error setting key [${key}] in localStorage: ${error}`);
    return false;
  }
};
export const getLS = (key) => (getLocalStorage(key));
export const setLS = (key, value) => (setLocalStorage(key, value));
export const getLSTS = (key, expirationSeconds) => getLocalStorageItemWithTimeStamp(key, expirationSeconds)
export const setLSTS = (key, value) => setLocalStorageItemWithTimeStamp(key, value)

// 以下の deleteOldLocalStrageValues 関数は、指定された正規表現に一致するキーを
// 持つローカルストレージの項目を検索し、タイムスタンプが新しい順にn個を維持し、
// それ以外の項目を削除します。
export const deleteOldLocalStrageValues = (ptn, n) => {
  try {
    const pattern = new RegExp(ptn);
    const matchedItems = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (pattern.test(key)) {
        const dataStr = localStorage.getItem(key);
        const data = JSON.parse(dataStr);
        matchedItems.push({ key, data });
      }
    }

    matchedItems.sort((a, b) => {
      return new Date(b.data.timestamp) - new Date(a.data.timestamp);
    });

    const itemsToDelete = matchedItems.slice(n);
    itemsToDelete.forEach(item => {
      localStorage.removeItem(item.key);
    });

    // console.log(`${itemsToDelete.length} items deleted from localStorage.`);
    return itemsToDelete.length;
  } catch (error) {
    console.error(`Error deleting old localStorage values: ${error}`);
    return 0;
  }
};

// 単純に削除
export const removeLocalStorageItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing key [${key}] from localStorage: ${error}`);
  }
};
// 現在のキーの一覧
export const getAllLocalStorageKeys = () => {
  return Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
};

// ローカルストレージ関連
// 指定されたキーからLocal Storageに保存されたデータを取得し、経過秒数に基づいて有効期限を検証します。
// 期限切れのデータは削除され、nullが返されます。
export const getLsItemWithTs = (key, expirationSeconds) => {
  try {
    const data = localStorage.getItem(key);

    if (!data) {
      return null;
    }

    const parsedData = JSON.parse(data);
    const currentTime = new Date();
    const storedTime = new Date(parsedData.timestamp);
    const timeDifferenceInSeconds = (currentTime - storedTime) / 1000;

    if (timeDifferenceInSeconds > expirationSeconds) {
      removeLocalStorageItem(key);
      return null;
    }

    return parsedData.value;
  } catch (error) {
    console.error(`Error getting key [${key}] from localStorage: ${error}`);
    return null;
  }
};
// 指定されたキーと値をLocal Storageに保存し、現在のタイムスタンプを一緒に記録します。
// これにより、データの有効期限管理が容易になります。
export const setLsItemWithTs = (key, value) => {
  try {
    const data = {
      value: value,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error setting key [${key}] in localStorage: ${error}`);
    return false;
  }
};
/**
 * 正規表現パターンに一致するローカルストレージのキーを削除し、
 * 削除されたキーの数を戻り値として返すJavaScript関数です。
 * キーをチェックし、一致するものを特定して削除することで、
 * ローカルストレージを整理できます。
 */
export const removeLocalStorageItemsByPattern = (pattern, check = false) => {
  const keysToDelete = [];

  // すべてのキーを確認して、一致するものをkeysToDeleteに追加
  Object.keys(localStorage).forEach((key) => {
    if (pattern.test(key)) {
      keysToDelete.push(key);
    }
  });

  if (check){
    console.log('list of localStrage items');
    console.log(keysToDelete);
    console.log(keysToDelete.length + 'items')
    return;
  }

  // 一致したキーを削除
  keysToDelete.forEach((key) => {
    localStorage.removeItem(key);
  });

  // 削除されたキーの数を返す
  console.log(keysToDelete.length + 'items')
  return keysToDelete.length;
};