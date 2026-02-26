import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { univApiCall } from '../../albCommonModule';

const EXPIRY_ITEMS = ['personalSupport', 'personalSupportHohou', 'senmonShien'];

export const EXPIRY_ITEM_NAMES = {
  personalSupport: '個別支援計画',
  personalSupportHohou: '個別支援計画（保訪）',
  senmonShien: '専門支援計画',
};

// personalSupport の原案チェック（原案=trueは除外対象）
const isPersonalSupportDraft = (e) => {
  if (e.item !== 'personalSupport') return false;
  const c = e.content?.content ?? e.content ?? {};
  return c['原案'] === true || e.isDraft === true;
};

// 開始日 + 有効期限ヶ月 → 終了日
// 例: 2025-02-01 + 6ヶ月 → 2025-07-31  (new Date(y, m+period, d-1))
const calcEndDate = (startDate, periodMonths) => {
  if (!startDate || !periodMonths) return null;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return null;
  const period = parseInt(periodMonths);
  if (!period || period <= 0) return null;
  return new Date(start.getFullYear(), start.getMonth() + period, start.getDate() - 1);
};

export const usePlanExpiry = () => {
  const hid = useSelector(s => s.hid);
  const bid = useSelector(s => s.bid);
  const stdDate = useSelector(s => s.stdDate);
  const [data, setData] = useState({
    currentMonth: [], nextMonth: [], overdue: [],
    currentByUid: {}, nextByUid: {}, overdueByUid: {},
  });

  useEffect(() => {
    if (!hid || !bid || !stdDate) return;
    const stdYM = stdDate.slice(0, 7);
    const nextD = new Date(stdDate);
    nextD.setMonth(nextD.getMonth() + 1);
    const nextYM = `${nextD.getFullYear()}-${String(nextD.getMonth()+1).padStart(2,'0')}`;

    (async () => {
      try {
        const res = await univApiCall(
          { a: 'fetchUsersPlan', hid, bid, lastmonth: stdYM }, 'E_EXPIRY01', ''
        );
        if (!res?.data?.result) return;

        const currentMonth=[], nextMonth=[], overdue=[];
        const currentByUid={}, nextByUid={}, overdueByUid={};

        // 同一 (uid, item) で最新の計画のみを対象にする
        const latestByUidItem = {};
        (res.data.dt ?? [])
          .filter(e => EXPIRY_ITEMS.includes(e.item))
          .filter(e => !isPersonalSupportDraft(e))
          .forEach(e => {
            const key = `${e.uid}::${e.item}`;
            if (!latestByUidItem[key] || e.created > latestByUidItem[key].created) {
              latestByUidItem[key] = e;
            }
          });

        Object.values(latestByUidItem).forEach(e => {
            const c = e.content?.content ?? e.content ?? {};
            const endDate = calcEndDate(c['開始日'], c['有効期限']);
            if (!endDate) return;

            const y = endDate.getFullYear();
            const m = String(endDate.getMonth()+1).padStart(2,'0');
            const d = String(endDate.getDate()).padStart(2,'0');
            const endYM = `${y}-${m}`;
            const endDateStr = `${y}-${m}-${d}`;
            const itemName = EXPIRY_ITEM_NAMES[e.item] || e.item;

            if (endYM < stdYM) {
              // 期限切れ
              overdue.push({ uid: e.uid, itemName, endDate: endDateStr });
              if (!overdueByUid[e.uid]) overdueByUid[e.uid] = [];
              overdueByUid[e.uid].push({ itemName, endDate: endDateStr });
            } else if (endYM === stdYM) {
              currentMonth.push({ uid: e.uid, itemName, endDate: endDateStr });
              if (!currentByUid[e.uid]) currentByUid[e.uid] = [];
              currentByUid[e.uid].push({ itemName, endDate: endDateStr });
            } else if (endYM === nextYM) {
              nextMonth.push({ uid: e.uid, itemName, endDate: endDateStr });
              if (!nextByUid[e.uid]) nextByUid[e.uid] = [];
              nextByUid[e.uid].push({ itemName, endDate: endDateStr });
            }
          });

        setData({ currentMonth, nextMonth, overdue, currentByUid, nextByUid, overdueByUid });
      } catch (err) {
        console.error('usePlanExpiry error:', err);
      }
    })();
  }, [hid, bid, stdDate]);

  return data;
};
