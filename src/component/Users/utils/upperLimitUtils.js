import { blue, grey, teal } from '@material-ui/core/colors';
import * as comMod from '../../../commonModule';
import { forbiddenPtn } from '../../common/StdFormParts';

export const UPPER_LIMIT_TYPES = {
  KANRI: '管理事業所',
  KYOURYOKU: '協力事業所',
};

export const createOfficeRow = (src = {}) => ({
  name: src?.name || '',
  no: src?.no || '',
  kanriKekka: src?.kanriKekka || '',
  kettei: src?.kettei || '',
  noDisabled: true,
});

export const getInitialUpperLimitEtc = (user = {}) => ({
  [UPPER_LIMIT_TYPES.KANRI]: Array.isArray(user?.etc?.[UPPER_LIMIT_TYPES.KANRI])
    ? user.etc[UPPER_LIMIT_TYPES.KANRI].map(e => createOfficeRow(e))
    : [],
  [UPPER_LIMIT_TYPES.KYOURYOKU]: Array.isArray(user?.etc?.[UPPER_LIMIT_TYPES.KYOURYOKU])
    ? user.etc[UPPER_LIMIT_TYPES.KYOURYOKU].map(e => createOfficeRow(e))
    : [],
});

export const collectOfficeCandidates = (users = []) => {
  const result = [];
  users.forEach(userDt => {
    if (!userDt?.etc) return;
    [UPPER_LIMIT_TYPES.KYOURYOKU, UPPER_LIMIT_TYPES.KANRI].forEach(type => {
      const list = userDt.etc?.[type];
      if (!Array.isArray(list)) return;
      list.forEach(x => {
        const name = (x?.name || '').toString().trim();
        const no = comMod.convHankaku((x?.no || '').toString().trim());
        if (!name) return;
        if (!result.some(y => y.name === name)) {
          result.push({ name, no });
        }
      });
    });
  });
  return result;
};

export const resolveUpperLimitRole = (upperLimitEtc = {}) => {
  const kyoryokuLen = Array.isArray(upperLimitEtc?.[UPPER_LIMIT_TYPES.KYOURYOKU])
    ? upperLimitEtc[UPPER_LIMIT_TYPES.KYOURYOKU].length
    : 0;
  const kanriLen = Array.isArray(upperLimitEtc?.[UPPER_LIMIT_TYPES.KANRI])
    ? upperLimitEtc[UPPER_LIMIT_TYPES.KANRI].length
    : 0;
  if (kyoryokuLen > 0) return UPPER_LIMIT_TYPES.KANRI;
  if (kanriLen > 0) return UPPER_LIMIT_TYPES.KYOURYOKU;
  return '';
};

export const getUpperLimitButtonLabel = (upperLimitEtc = {}) => {
  const kanriLen = Array.isArray(upperLimitEtc?.[UPPER_LIMIT_TYPES.KANRI])
    ? upperLimitEtc[UPPER_LIMIT_TYPES.KANRI].length
    : 0;
  const kyoryokuLen = Array.isArray(upperLimitEtc?.[UPPER_LIMIT_TYPES.KYOURYOKU])
    ? upperLimitEtc[UPPER_LIMIT_TYPES.KYOURYOKU].length
    : 0;
  if (kanriLen > 0) return UPPER_LIMIT_TYPES.KANRI;
  if (kyoryokuLen > 0) return UPPER_LIMIT_TYPES.KYOURYOKU;
  return '管理・協力事業所';
};

export const getUpperLimitTextColor = (role) => {
  if (role === UPPER_LIMIT_TYPES.KANRI) return teal[800];
  if (role === UPPER_LIMIT_TYPES.KYOURYOKU) return blue[800];
  return grey[700];
};

export const getUpperLimitDisplayList = (upperLimitEtc = {}) => {
  const kanri = Array.isArray(upperLimitEtc?.[UPPER_LIMIT_TYPES.KANRI]) ? upperLimitEtc[UPPER_LIMIT_TYPES.KANRI] : [];
  const kyoryoku = Array.isArray(upperLimitEtc?.[UPPER_LIMIT_TYPES.KYOURYOKU]) ? upperLimitEtc[UPPER_LIMIT_TYPES.KYOURYOKU] : [];
  return [...kanri, ...kyoryoku]
    .filter(e => e?.name)
    .map(e => `${e.name}（${e.no || ''}）`);
};

export const normalizeOfficeNameForDup = (name = '') => (
  (name || '')
    .toString()
    .normalize('NFKC')
    .replace(/[　\s]+/g, ' ')
    .trim()
    .toLowerCase()
);

export const createUpperLimitRowError = () => ({ name: '', no: '' });

export const normalizeUpperLimitEtcForSnapshot = (upperLimitEtc = {}) => {
  const normalizeRows = (rows) => (
    Array.isArray(rows)
      ? rows.map((row) => ({
        name: row?.name || '',
        no: row?.no || '',
        kanriKekka: row?.kanriKekka || '',
        kettei: row?.kettei || '',
      }))
      : []
  );
  return {
    [UPPER_LIMIT_TYPES.KANRI]: normalizeRows(upperLimitEtc?.[UPPER_LIMIT_TYPES.KANRI]),
    [UPPER_LIMIT_TYPES.KYOURYOKU]: normalizeRows(upperLimitEtc?.[UPPER_LIMIT_TYPES.KYOURYOKU]),
  };
};

export const buildUnsavedSnapshot = (formValues, upperLimitEtc, stopUse, addictionValues = {}) => JSON.stringify({
  formValues,
  upperLimitEtc: normalizeUpperLimitEtcForSnapshot(upperLimitEtc),
  stopUse: !!stopUse,
  addictionValues,
});

export const validateUpperLimitDialogRows = (rows = []) => {
  const normalizedRows = rows.map((row) => {
    const name = (row?.name || '').toString().trim();
    const no = comMod.convHankaku((row?.no || '').toString().trim());
    const normalizedName = normalizeOfficeNameForDup(name);
    return { name, no, normalizedName };
  });

  const nameCount = {};
  const noCount = {};
  const pairCount = {};
  normalizedRows.forEach(({ name, no, normalizedName }) => {
    if (!name && !no) return;
    if (name) nameCount[normalizedName] = (nameCount[normalizedName] || 0) + 1;
    if (no) noCount[no] = (noCount[no] || 0) + 1;
    if (name && no) {
      const pairKey = `${normalizedName}::${no}`;
      pairCount[pairKey] = (pairCount[pairKey] || 0) + 1;
    }
  });

  return normalizedRows.map(({ name, no, normalizedName }) => {
    const errors = createUpperLimitRowError();
    if (!name && !no) return errors;

    if (!name) errors.name = '事業所名を入力してください。';
    if (!no) errors.no = '事業所番号を入力してください。';

    if (name && forbiddenPtn.test(name)) {
      errors.name = '利用できない文字があります';
    }
    if (no && !/^[0-9]{10}$/.test(no)) {
      errors.no = '10桁の数字が必要です。';
    }

    const pairKey = `${normalizedName}::${no}`;
    if (name && no && pairCount[pairKey] > 1) {
      errors.name = '同じ事業所は登録できません。';
      errors.no = '同じ事業所は登録できません。';
      return errors;
    }
    if (name && nameCount[normalizedName] > 1 && !errors.name) {
      errors.name = '事業所名が重複しています。';
    }
    if (no && noCount[no] > 1 && !errors.no) {
      errors.no = '事業所番号が重複しています。';
    }
    return errors;
  });
};
