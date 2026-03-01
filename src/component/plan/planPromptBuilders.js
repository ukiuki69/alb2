export const normalizeDomainLabel = (label) => {
  if (!label) return '';
  return String(label)
    .replace('言語・コミュニケーション', '言語・コミュ')
    .replace('言語コミュニケーション', '言語・コミュ');
};

export const buildSupportGoalsText = (personalSupport) => {
  const supportGoals = Array.isArray(personalSupport?.['支援目標']) ? personalSupport['支援目標'] : [];
  return supportGoals.map((goal, idx) => {
    const goalText = goal?.['支援目標'] || '';
    const contentText = goal?.['支援内容'] || '';
    return `【支援目標${idx + 1}】${goalText}\n支援内容: ${contentText}`;
  }).join('\n\n');
};

export const buildPlanSummary = (personalSupport) => {
  const supportGoalsText = buildSupportGoalsText(personalSupport);
  return `
【個別支援計画の概要】
長期目標: ${personalSupport?.['長期目標'] || ''}
短期目標: ${personalSupport?.['短期目標'] || ''}
本人の希望: ${personalSupport?.['本人意向'] || ''}
家族の希望: ${personalSupport?.['家族意向'] || ''}

【支援目標と支援内容】
${supportGoalsText || '支援目標が設定されていません'}
`;
};
