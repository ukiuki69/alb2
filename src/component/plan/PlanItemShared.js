import React from 'react';
import { useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/core';
import { Tooltip } from '@material-ui/core';
import { teal, blue, brown, orange, lime, purple, cyan, green, grey, indigo, red } from '@material-ui/core/colors';

// Planアイテムの種別ごとの表記・色定義
export const getPlanItemAttr = (e) => {
  if (e.item === 'assessment') {
    if (e?.content?.content?.isBlank) return { name: 'アセスメント', short: '白紙', color: grey[400] };
    return { name: 'アセスメント', short: 'アセ', color: cyan[800] };
  }
  if (e.item === 'monitoring') return { name: 'モニタリング', short: 'モニ', color: green[800] };
  if (e.item === 'monitoringHohou') return { 
    name: 'モニタリング（保訪）', short: 'モ保', color: green[800], textColor: '#eee',
    borderLeft: `6px solid ${purple[400]}`
  };
  if (e.item === 'conferenceNote') return { name: '担当者会議', short: '担会', color: lime[900] };
  if (e.item === 'personalSupport') {
    const isDraft =
      e?.content?.content?.['原案'] === true ||
      e?.content?.['原案'] === true ||
      e?.['原案'] === true ||
      e?.isDraft === true;
    if (isDraft) return { name: '個別支援計画原案', short: '原案', color: indigo[800], textColor: '#eee' };
    return { name: '個別支援計画', short: '計画', color: brown[800], textColor: '#eee' };
  }
  if (e.item === 'personalSupportHohou') {
    const isDraft =
      e?.content?.content?.['原案'] === true ||
      e?.content?.['原案'] === true ||
      e?.['原案'] === true ||
      e?.isDraft === true;

    if (isDraft) {
      return {
        name: '個別支援計画原案（保訪）', short: '原保', color: indigo[800], textColor: '#eee', 
        borderLeft: `6px solid ${purple[400]}` 
      };
    }
    return { 
      name: '個別支援計画（保訪）', short: '計保', color: brown[800], textColor: '#eee', 
      borderLeft: `6px solid ${purple[400]}` 
    };
  
  }
  if (e.item === 'timetable') return { name: '計画支援時間', short: '支時', color: blue[400] };
  if (e.item === 'senmonShien') return { name: '専門支援計画', short: '専門', color: orange[800] };
  if (e.item === 'monitoringSenmon') return { 
    name: 'モニタリング（専門）', short: 'モ専', color: green[800], textColor: '#eee',
    borderLeft: `6px solid ${orange[400]}`
  };
  return { name: e.item, short: e.item, color: teal[400] };
};

// 同日表示時のタイプ優先順位（要求どおりの順）
export const planItemTypeOrder = [
  'assessment',
  'personalSupport',
  'personalSupportHohou',
  'senmonShien',
  'conferenceNote',
  'monitoring',
  'monitoringHohou',
  'monitoringSenmon',
  'timetable',
];

// アイテム比較（dateOrder: 'asc' | 'desc'）
export const comparePlanItems = (a, b, { dateOrder = 'asc' } = {}) => {
  const ad = new Date(a.created).getTime();
  const bd = new Date(b.created).getTime();
  if (ad !== bd) return dateOrder === 'asc' ? ad - bd : bd - ad;
  const ai = planItemTypeOrder.indexOf(a.item);
  const bi = planItemTypeOrder.indexOf(b.item);
  const ar = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
  const br = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
  return ar - br;
};

// クリック時の遷移
export const navigateToPlanItem = (history, item, lastmonth) => {
  const { uid } = item;
  let url = '';
  const lastmonthParam = lastmonth ? `&lastmonth=${lastmonth}` : '';
  
  switch (item.item) {
    case 'assessment':
      url = `/plan/assessment?created=${item.created}&uid=${uid}${lastmonthParam}`;
      break;
    case 'personalSupport':
      url = `/plan/personalSupport?created=${item.created}&uid=${uid}${lastmonthParam}`;
      break;
    case 'personalSupportHohou':
      url = `/plan/personalSupport?created=${item.created}&uid=${uid}&hohou=true${lastmonthParam}`;
      break;
    case 'conferenceNote':
      url = `/plan/conferencenote?created=${item.created}&uid=${uid}${lastmonthParam}`;
      break;
    case 'monitoring':
      url = `/plan/monitoring?created=${item.created}&uid=${uid}${lastmonthParam}`;
      break;
    case 'monitoringHohou':
      url = `/plan/monitoringhohou?created=${item.created}&uid=${uid}${lastmonthParam}`;
      break;
    case 'senmonShien':
      url = `/plan/senmonshien?created=${item.created}&uid=${uid}${lastmonthParam}`;
      break;
    case 'monitoringSenmon':
      url = `/plan/monitoringsenmon?created=${item.created}&uid=${uid}${lastmonthParam}`;
      break;
    case 'timetable':
      url = `/users/timetable/edit/${uid}?created=${item.created}${lastmonthParam}`;
      break;
    default:
      return;
  }
  history.push(url);
};

// アイテムの小さなバッジ表示（色・文言は共通定義準拠）
const useStyles = makeStyles({
  badge: {
    borderRadius: 2,
    margin: '2px 4px',
    padding: '2px 4px',
    fontSize: '0.75rem',
    textAlign: 'center',
    boxShadow: '0 0 2px 0 rgba(0,0,0,0.4)',
    cursor: 'pointer',
    boxSizing: 'border-box',
  },
});

export const PlanItemBadge = ({ item, onClick, style }) => {
  const classes = useStyles();
  const attr = (item && item.name && item.short && item.color)
    ? { name: item.name, short: item.short, color: item.color, textColor: item.textColor, borderLeft: item.borderLeft }
    : getPlanItemAttr(item);
  
  return (
    <div
      onClick={onClick}
      className={classes.badge}
      style={{ 
        backgroundColor: attr.color, 
        color: attr.textColor || '#eee',
        borderLeft: attr.borderLeft || 'none',
        ...style 
      }}
    >
      <span style={{ marginInlineStart: attr.borderLeft ? '-6px' : '0px' }}>
        {attr.short} : {item.created.slice(5)}
      </span>
    </div>
  );
};

// 横方向に月ごとに並べる簡易ストリップ（Assessment右側固定用）
export const PlanItemsStrip = ({ months, items, onItemClick }) => {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
      {months.map((m) => {
        const monthItems = items.filter((it) => {
          const d = new Date(it.created);
          return d.getFullYear() === m.year && d.getMonth() + 1 === m.month;
        }).sort((a, b) => new Date(a.created) - new Date(b.created));
        return (
          <div key={`${m.year}-${m.month}`} style={{ minWidth: 120, textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', marginBottom: 4 }}>
              {m.year}年{m.month}月
            </div>
            <div>
              {monthItems.map((it, idx) => (
                <PlanItemBadge key={idx} item={it} onClick={() => onItemClick(it)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const getMonthHeadersBackward = (stdDateStr) => {
  if (!stdDateStr) return [];
  const date = new Date(stdDateStr);
  const months = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(date);
    d.setMonth(d.getMonth() - i);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return months;
};

export const getMonthHeadersForward = (startDateStr) => {
  if (!startDateStr) return [];
  const date = new Date(startDateStr);
  const months = [];
  for (let i = 0; i <= 6; i++) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + i);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return months;
};

const useExpiryBadgeStyles = makeStyles({
  badge: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '50%', minWidth: 18, height: 18,
    fontSize: '0.65rem', color: '#fff', fontWeight: 'bold',
    padding: '0 3px', boxSizing: 'border-box', flexShrink: 0,
    marginLeft: 4, lineHeight: 1,
  },
});

export const PlanUserExpiryBadge = ({ uid, expiryData }) => {
  const classes = useExpiryBadgeStyles();
  const overdueItems  = (expiryData?.overdueByUid  || {})[uid] || [];
  const currentItems  = (expiryData?.currentByUid  || {})[uid] || [];
  const nextItems     = (expiryData?.nextByUid      || {})[uid] || [];

  const redCount = overdueItems.length + currentItems.length;
  const hasRed   = redCount > 0;
  const hasNext  = nextItems.length > 0;
  if (!hasRed && !hasNext) return null;

  const bgColor = hasRed ? red[500] : orange[500];
  const count   = hasRed ? redCount : nextItems.length;

  return (
    <Tooltip title={
      <div>
        {overdueItems.map((it,i) => <div key={`o${i}`}>{it.itemName}：{it.endDate}（期限切れ）</div>)}
        {currentItems.map((it,i) => <div key={i}>{it.itemName}：{it.endDate}（当月）</div>)}
        {nextItems.map((it,i)    => <div key={`n${i}`}>{it.itemName}：{it.endDate}（翌月）</div>)}
      </div>
    }>
      <span className={classes.badge} style={{ backgroundColor: bgColor }}>{count}</span>
    </Tooltip>
  );
};
