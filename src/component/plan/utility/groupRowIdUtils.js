import { formatDate, parseDate } from '../../../modules/dateUtils';

const toYyyymmdd = (dateValue) => {
  if (dateValue === null || dateValue === undefined) return '';

  if (typeof dateValue === 'object' && !isNaN(dateValue.getDate?.())) {
    return formatDate(dateValue, 'YYYYMMDD');
  }

  const raw = String(dateValue).trim();
  if (!raw) return '';

  const parsed = parseDate(raw);
  if (parsed?.result && parsed?.date?.dt) {
    return formatDate(parsed.date.dt, 'YYYYMMDD');
  }

  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 8) {
    return digits.slice(0, 8);
  }
  return raw;
};

const toTwoDigits = (value) => String(value).padStart(2, '0');

const parseLineId = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number.parseInt(String(value), 10);
  return Number.isNaN(num) ? null : num;
};

const shallowRowEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
};

// グループ行IDを整形する共通ヘルパー。
// - LineID は初回採番後に不変
// - LineNo は現在の並び順に応じて再計算
// - ID は UID-created-start-lineNo-lineID 形式で付与
export const syncGroupRowStableIds = ({
  rows,
  uid,
  createdDate,
  startDate,
  idField = 'ID',
  lineIdField = 'LineID',
  lineNoField = 'LineNo',
}) => {
  const list = Array.isArray(rows) ? rows : [];
  const created = toYyyymmdd(createdDate);
  const start = toYyyymmdd(startDate);

  const usedLineIds = new Set();
  list.forEach((row) => {
    const parsed = parseLineId(row?.[lineIdField]);
    if (parsed !== null) usedLineIds.add(parsed);
  });

  const nextAvailableLineId = () => {
    let candidate = 1;
    while (usedLineIds.has(candidate)) {
      candidate += 1;
    }
    usedLineIds.add(candidate);
    return candidate;
  };

  let changed = false;
  const nextRows = list.map((row, index) => {
    const sourceRow = row || {};
    const existingLineId = parseLineId(sourceRow[lineIdField]);
    const lineIdNum = existingLineId !== null ? existingLineId : nextAvailableLineId();

    const lineNo = toTwoDigits(index + 1);
    const lineId = toTwoDigits(lineIdNum);
    const nextId = `${uid || ''}-${created}-${start}-${lineNo}-${lineId}`;

    const nextRow = {
      ...sourceRow,
      [lineIdField]: lineId,
      [lineNoField]: lineNo,
      [idField]: nextId,
    };

    if (!shallowRowEqual(sourceRow, nextRow)) {
      changed = true;
    }
    return nextRow;
  });

  return { rows: nextRows, changed };
};
