/**
 * フォーム操作に関連するユーティリティ
 */

// オブジェクトから特定の値を持つ要素を削除する (内部用)
const removeFromObj = (obj, value) => {
  const rt = { ...obj };
  Object.entries(obj).forEach(([key, val]) => {
    if (val === value) delete rt[key];
  });
  return rt;
};

// フォームの中のノードの値を取得
export const getFormDatas = (selecters, disabled = false, sp = false) => {
  const rt = {};
  selecters.forEach((slct) => {
    Array.from(slct).forEach((e) => {
      const type = e.getAttribute('type');
      const name = e.getAttribute('name');
      if (!name) return;
      
      const nodeDisabled = e.getAttribute('disabled');
      let value = type === 'checkbox' ? e.checked : e.value;
      value = nodeDisabled !== null && !disabled ? '' : value;
      
      if (type === 'checkbox' && e.value) {
        if (rt[e.value] === undefined) rt[e.value] = {};
        rt[e.value][e.name] = value;
      } else {
        rt[name] = value;
      }
    });
  });
  return sp ? rt : removeFromObj(rt, '');
};

// フォームの中のrequireされているノードで値を持たないノードがないか確認
export const checkRequireFilled = (selecters) => {
  const rt = [];
  selecters.forEach((slct) => {
    Array.from(slct).forEach((e) => {
      const name = e.name;
      const nodeRequired = e.required;
      if (nodeRequired && !e.value) {
        rt.push(name);
        if (e.parentNode.classList.contains('MuiInput-root')) {
          e.parentNode.classList.add('Mui-error');
        }
      }
    });
  });
  return rt;
};

// メールアドレスの確認を行う
export const isMailAddress = (mail) => {
  if (!mail) return true;
  if (/\s/.test(mail)) return false;
  const mail_regex1 = new RegExp(
    '(?:[-!#-\'*+/-9=?A-Z^-~]+\.?(?:\.[-!#-\'*+/-9=?A-Z^-~]+)*|"(?:[!#-\[\]-~]|\\\\[\x09 -~])*")@[-!#-\'*+/-9=?A-Z^-~]+(?:\.[-!#-\'*+/-9=?A-Z^-~]+)*'
  );
  const mail_regex2 = new RegExp('^[^@]+@[^@]+$');
  if (mail.match(mail_regex1) && mail.match(mail_regex2)) {
    if (mail.match(/[^a-zA-Z0-9!"#$%&'()=~|^-`\\@\[;:\]\,.\/\\<>?_`{+*} \-]/)) {
      return false;
    }
    if (!mail.match(/\.[a-z]+$/)) {
      return false;
    }
    return true;
  } else {
    return false;
  }
};

// イベントから諸々取得する
export const getInputInfo = (e) => {
  const target = e.currentTarget;
  const name = target.name;
  const value = target.value;
  const checked = target.checked;
  return { target, name, value, checked };
};

