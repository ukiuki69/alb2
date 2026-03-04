import React from 'react';
import { deepOrange, green, grey, indigo, purple, teal } from '@material-ui/core/colors';

export const toShortDomainName = (name) => {
  const map = {
    "人間関係・社会性": "社会性",
    "運動・感覚": "運動",
    "認知・行動": "認知",
    "言語・コミュ": "言語",
    "健康・生活": "生活",
  };
  return map[name] || name;
};

export const getDomainColorSet = (name) => {
  switch (name) {
    case "人間関係・社会性":
      return { text: teal[700], border: teal[300], bg: teal[50] };
    case "運動・感覚":
      return { text: indigo[700], border: indigo[300], bg: indigo[50] };
    case "認知・行動":
      return { text: deepOrange[700], border: deepOrange[300], bg: deepOrange[50] };
    case "言語・コミュ":
      return { text: purple[700], border: purple[300], bg: purple[50] };
    case "健康・生活":
      return { text: green[700], border: green[300], bg: green[50] };
    default:
      return { text: grey[700], border: grey[400], bg: grey[100] };
  }
};

export const getDomainChipStyle = (name) => {
  const colors = getDomainColorSet(name);
  return {
    display: 'inline-block',
    fontSize: 11,
    lineHeight: 1.2,
    border: `1px solid ${colors.border}`,
    borderRadius: 3,
    padding: "2px 6px",
    color: colors.text,
    backgroundColor: colors.bg,
  };
};

export const toDomainsArray = (value) => {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map(v => v.trim()).filter(Boolean);
  }
  return [];
};

/**
 * 五領域バッジ表示コンポーネント
 * @param {string|string[]} domains - カンマ区切り文字列または配列
 * @param {object} style - 外部から追加するスタイル（wrap用）
 */
export const DomainBadges = ({ domains, style }) => {
  const arr = toDomainsArray(domains);
  if (!arr.length) return null;
  return (
    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4, ...style }}>
      {arr.map((d, idx) => (
        <span key={idx} style={getDomainChipStyle(d)}>
          {toShortDomainName(d)}
        </span>
      ))}
    </span>
  );
};
