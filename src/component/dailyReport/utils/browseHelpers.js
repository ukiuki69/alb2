import { deepOrange, green, grey, indigo, purple, teal } from "@material-ui/core/colors";
import { didPtn } from '../../../modules/contants';

export const scrollOffset = 12; // Appバーの高さに合わせて調整

export const getWdStyle = (holiday) => {
  if (holiday === 0) return {};
  if (holiday === 1) return {color: deepOrange[600]};
  if (holiday === 2) return {color: grey[400]};
};

export const formatDate = (dateString) => {
  const dateParts = dateString.match(/D(\d{4})(\d{2})(\d{2})/);
  if (dateParts) {
    const month = dateParts[2];
    const day = dateParts[3];
    return `${month}/${day}`;
  }
  return dateString;
};

export const renderTransferItemsGeneral = (entry, classes, type) => {
  if (type === 'pickup') {
    return `<span class="${classes.transferItems}">` +
           `<span>迎え</span>` +
           (entry.pickup && entry.start ? `<span>${entry.pickup} - ${entry.start}</span>` : '') +
           (entry.pickupStaff ? `<span>担当:${entry.pickupStaff}</span>` : '') +
           (entry.pickupCar ? `<span>車両:${entry.pickupCar}</span>` : '') +
           (entry.pickupLocation ? `<span>迎え先:${entry.pickupLocation}</span>` : '') +
           `</span>`;
  } else if (type === 'dropoff') {
    return `<span class="${classes.transferItems}">` +
           `<span>送り</span>` +
           (entry.end && entry.dropoff ? `<span>${entry.end} - ${entry.dropoff}</span>` : '') +
           (entry.dropoffStaff ? `<span>担当:${entry.dropoffStaff}</span>` : '') +
           (entry.dropoffCar ? `<span>車両:${entry.dropoffCar}</span>` : '') +
           (entry.dropoffLocation ? `<span>送り先:${entry.dropoffLocation}</span>` : '') +
           `</span>`;
  }
  return '';
};

export const formatActualCostContent = (actualCost) => {
  if (!actualCost) return null;

  const entries = [];

  const addEntry = (label, value) => {
    if (value === null || value === undefined) return;
    const formattedValue = typeof value === 'string' ? value.trim() : value;
    if (formattedValue === '' || formattedValue === null || formattedValue === undefined) return;

    const numericValue = Number(formattedValue);
    entries.push({
      display: label ? `${label}: ${formattedValue}` : `${formattedValue}`,
      numeric: Number.isFinite(numericValue) ? numericValue : null,
    });
  };

  if (Array.isArray(actualCost)) {
    if (!actualCost.length) return null;
    actualCost.forEach(item => {
      if (!item) return;
      if (typeof item === 'object' && !Array.isArray(item)) {
        Object.entries(item).forEach(([key, value]) => addEntry(key, value));
      } else {
        addEntry('', item);
      }
    });
  } else if (typeof actualCost === 'object') {
    Object.entries(actualCost).forEach(([key, value]) => addEntry(key, value));
  } else {
    addEntry('', actualCost);
  }

  if (!entries.length) return null;

  const content = entries.map(entry => entry.display).join('　');
  const numericEntries = entries.filter(entry => entry.numeric !== null);

  if (entries.length > 1 && numericEntries.length) {
    const total = numericEntries.reduce((sum, entry) => sum + entry.numeric, 0);
    return `${content}　合計: ${total}`;
  }

  return content;
};

// Noticeを含むキー名を取得し、serviceとclassroomで絞り込み
export const getNoticeKeys = (data, service, classroom) => {
  const allKeys = Object.keys(data);
  const noticeKeys = allKeys.filter(key => key.includes('Notice'));
  
  // jNotice, jTrainingNoticeは全体の「記録」として常に含める
  const filteredKeys = ['jNotice', 'jTrainingNotice'];
  
  // その他のNoticeキーをserviceとclassroomで絞り込み
  noticeKeys.forEach(key => {
    if (key === 'jNotice' || key === 'jTrainingNotice') return;
    
    let shouldInclude = true;
    if (service && service.trim() !== '') {
      shouldInclude = shouldInclude && key.includes(service);
    }
    if (classroom && classroom.trim() !== '') {
      shouldInclude = shouldInclude && key.includes(classroom);
    }
    if (shouldInclude) {
      filteredKeys.push(key);
    }
  });
  
  return filteredKeys;
};

// Noticeキー群の中に、実際に表示すべき内容が1件でもあるかを判定
export const hasNoticeContent = (data, keys) => {
  if (!data || !Array.isArray(keys) || !keys.length) return false;

  return keys.some((key) => {
    const keyData = data[key];
    if (!keyData || typeof keyData !== 'object') return false;

    const didEntries = Object.entries(keyData).filter(([did]) => didPtn.test(did));
    if (!didEntries.length) return false;

    return didEntries.some(([, value]) => {
      if (typeof value === 'string') {
        // <br>や改行のみの見かけ上空データを除外
        const normalized = value
          .replace(/<br\s*\/?>/gi, '')
          .replace(/\s/g, '');
        return normalized !== '';
      }
      if (value === null || value === undefined) return false;
      return String(value).trim() !== '';
    });
  });
};

export const getNoticeKeysWithContent = (data, service, classroom) => {
  const candidateKeys = getNoticeKeys(data, service, classroom);
  return candidateKeys.filter((key) => hasNoticeContent(data, [key]));
};

// 指定されたNoticeキーの日付ごとのコンテンツを結合してdateGroupedDataに追加
export const appendNoticeData = (noticeKeys, data, dateGroupedData, itemName) => {
  const allDates = new Set();
  noticeKeys.forEach(noticeKey => {
    const noticeData = data[noticeKey] || {};
    Object.keys(noticeData).forEach(did => allDates.add(did));
  });
  allDates.forEach(did => {
    const date = formatDate(did);
    if (!dateGroupedData[date]) dateGroupedData[date] = [];
    const allNoticeContents = noticeKeys.map(key => {
      const keyData = data[key] || {};
      return keyData[did] || '';
    }).filter(content => content.trim() !== '');
    if (allNoticeContents.length > 0) {
      const combinedContent = allNoticeContents.join('\n\n');
      dateGroupedData[date].push({
        date,
        name: itemName,
        item: itemName,
        content: combinedContent.replace(/\n/g, '<br>'),
      });
    }
  });
};

export const getAddictionListFromSch = (sch) => {
  const uids = Object.keys(sch).filter(e => e.startsWith('UID'));
  const addictionList = [];
  uids.forEach(uid => {
    const dids = Object.keys(sch[uid]).filter(e => e.match(didPtn));
    dids.forEach(did => {
      const dAddiction = sch[uid][did].dAddiction;
      if (dAddiction) {
        addictionList.push(...Object.keys(dAddiction));
      }
    });
  });
  return Array.from(new Set(addictionList));
};

export const getExistActualCost = (sch) => {
  if (!sch || typeof sch !== 'object') return false;
  const uids = Object.keys(sch).filter(e => e.startsWith('UID'));
  for (const uid of uids) {
    const dids = Object.keys(sch[uid] || {}).filter(e => e.startsWith('D2'));
    for (const did of dids) {
      const actualCostContent = formatActualCostContent(sch[uid]?.[did]?.actualCost);
      if (actualCostContent) {
        return true;
      }
    }
  }
  return false;
};

export const getDailyReportpropertys = (data) => {
  // UIDで始まるキーのみ抽出
  const uidKeys = Object.keys(data).filter(key => key.startsWith('UID'));
  const propSet = new Set();
  uidKeys.forEach(uid => {
    const didObjs = data[uid];
    if (typeof didObjs !== 'object' || didObjs === null) return;
    Object.keys(didObjs).forEach(did => {
      // D2で始まるキーのみ処理
      if (!didPtn.test(did)) return;
      const entry = didObjs[did];
              if (typeof entry === 'object' && entry !== null) {
          Object.keys(entry).forEach(prop => {
            const value = entry[prop];
            // 値が存在し、空でない場合のみ追加
            if (value !== null && value !== undefined && value !== '' && 
                !(Array.isArray(value) && value.length === 0)) {
              propSet.add(prop);
            }
          });
        }
    });
  });
  // ユニークなプロパティ名の配列を返す
  return Array.from(propSet);
};

// colSpan で表示する項目（項目列を省略して内容を広く表示）
export const COLSPAN_ITEMS = ['利用時間', '事業所の記録', '法定研修記録'];

const GOAL_EVALUATION_ITEM_LABELS = {
  personalSupport: "個別支援評価",
  senmonShien: "専門支援評価",
  personalSupportHohou: "保訪支援評価",
};

export const getGoalEvaluationFilterLabel = (item) => GOAL_EVALUATION_ITEM_LABELS[item] || null;

const toShortDomainName = (name) => {
  const map = {
    "人間関係・社会性": "社会性",
    "運動・感覚": "運動",
    "認知・行動": "認知",
    "言語・コミュ": "言語",
    "健康・生活": "生活",
  };
  return map[name] || name;
};

// GoalEvaluationForm.js と同じ色定義
const getDomainColorSet = (name) => {
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

const toInlineStyleString = (styleObj) => {
  return Object.entries(styleObj).map(([key, value]) => {
    const kebabKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
    return `${kebabKey}:${String(value)}`;
  }).join(";");
};

const toGoalDomainsArray = (value) => {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value.split(",").map(v => v.trim()).filter(Boolean);
  }
  return [];
};

const stripLineBreaks = (value) => String(value || "")
  .replace(/<br\s*\/?>/gi, "")
  .replace(/\r?\n/g, "")
  .trim();

const truncateChars = (value, maxChars) => {
  const chars = Array.from(String(value || ""));
  if (chars.length <= maxChars) return chars.join("");
  return `${chars.slice(0, maxChars).join("")}…`;
};

export const formatGoalEvaluationItemLabel = (item) => {
  const label = getGoalEvaluationFilterLabel(item);
  if (!label) return null;
  return formatTwoCharsWithBr(label);
};

export const formatTwoCharsWithBr = (text) => {
  const source = String(text || "").trim();
  if (!source) return "";
  const chars = Array.from(source);
  const lines = [];
  for (let i = 0; i < chars.length; i += 2) {
    lines.push(chars.slice(i, i + 2).join(""));
  }
  return lines.join("<br>");
};

export const getGoalEvaluationId = (evaluation) => {
  return String(evaluation?.goalId || evaluation?.goalKey || "").trim();
};

const hasEvaluationContent = (evaluation) => {
  if (!evaluation || typeof evaluation !== "object") return false;
  const score = evaluation.score;
  const comment = String(evaluation.comment || "").trim();
  return (score !== null && score !== undefined && !Number.isNaN(score)) || comment !== "";
};

export const getGoalEvaluationItemSet = (data) => {
  const itemSet = new Set();
  if (!data || typeof data !== "object") return itemSet;

  const uidKeys = Object.keys(data).filter((key) => key.startsWith("UID"));
  uidKeys.forEach((uidKey) => {
    const byDate = data[uidKey];
    if (!byDate || typeof byDate !== "object") return;

    Object.keys(byDate).forEach((did) => {
      if (!didPtn.test(did)) return;
      const entry = byDate[did];
      const evaluations = Array.isArray(entry?.goalEvaluations) ? entry.goalEvaluations : [];
      evaluations.forEach((ev) => {
        if (!hasEvaluationContent(ev)) return;
        const label = getGoalEvaluationFilterLabel(ev?.item);
        if (label) itemSet.add(ev.item);
      });
    });
  });

  return itemSet;
};

export const formatGoalEvaluationContent = (goalEvaluations, targetItem) => {
  if (!Array.isArray(goalEvaluations) || !targetItem) return null;
  const matched = goalEvaluations.filter((ev) => ev?.item === targetItem && hasEvaluationContent(ev));
  if (!matched.length) return null;

  const blocks = matched.map((ev) => {
    const target = truncateChars(stripLineBreaks(ev?.target), 25);
    const score = ev?.score;
    const domains = toGoalDomainsArray(ev?.domains);
    const comment = stripLineBreaks(ev?.comment);
    const pieces = [];
    if (target) {
      pieces.push(`<span>${target}</span>`);
    }
    if (score !== null && score !== undefined && !Number.isNaN(score)) {
      pieces.push(`<span>${score} / 10</span>`);
    }
    if (domains.length) {
      const domainHtml = domains.map((name) => {
        const colors = getDomainColorSet(name);
        const label = toShortDomainName(name);
        const style = toInlineStyleString({
          fontSize: "11px",
          lineHeight: "1.2",
          border: `1px solid ${colors.border}`,
          borderRadius: "3px",
          padding: "2px 6px",
          color: colors.text,
          backgroundColor: colors.bg,
          display: "inline-block",
          marginRight: "4px",
          whiteSpace: "nowrap",
          verticalAlign: "middle",
        });
        return `<span style="${style}">${label}</span>`;
      }).join("");
      pieces.push(`<span>${domainHtml}</span>`);
    }
    const inlineLine = pieces.join("　");
    if (comment) {
      return `${inlineLine}<br><span style="font-size:12px;display:inline-block;padding-left:1em;">${comment}</span>`;
    }
    return inlineLine;
  }).filter((text) => text !== "");

  return blocks.length ? blocks.join("<br>") : null;
};
