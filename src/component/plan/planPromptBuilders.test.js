import { normalizeDomainLabel, buildSupportGoalsText, buildPlanSummary } from './planPromptBuilders';

describe('normalizeDomainLabel', () => {
  test('言語・コミュニケーション → 言語・コミュ に変換する', () => {
    expect(normalizeDomainLabel('言語・コミュニケーション')).toBe('言語・コミュ');
  });

  test('言語コミュニケーション（中黒なし）→ 言語・コミュ に変換する', () => {
    expect(normalizeDomainLabel('言語コミュニケーション')).toBe('言語・コミュ');
  });

  test('他のラベルは変更しない', () => {
    expect(normalizeDomainLabel('健康・生活')).toBe('健康・生活');
    expect(normalizeDomainLabel('人間関係・社会性')).toBe('人間関係・社会性');
    expect(normalizeDomainLabel('認知・行動')).toBe('認知・行動');
  });

  test('null を渡すと空文字を返す', () => {
    expect(normalizeDomainLabel(null)).toBe('');
  });

  test('undefined を渡すと空文字を返す', () => {
    expect(normalizeDomainLabel(undefined)).toBe('');
  });

  test('空文字を渡すと空文字を返す', () => {
    expect(normalizeDomainLabel('')).toBe('');
  });
});

describe('buildSupportGoalsText', () => {
  test('支援目標配列を整形したテキストに変換する', () => {
    const ps = {
      '支援目標': [
        { '支援目標': '目標A', '支援内容': '内容A' },
        { '支援目標': '目標B', '支援内容': '内容B' },
      ],
    };
    const result = buildSupportGoalsText(ps);
    expect(result).toContain('【支援目標1】目標A');
    expect(result).toContain('支援内容: 内容A');
    expect(result).toContain('【支援目標2】目標B');
    expect(result).toContain('支援内容: 内容B');
  });

  test('空配列のとき空文字を返す', () => {
    expect(buildSupportGoalsText({ '支援目標': [] })).toBe('');
  });

  test('支援目標キーが null のとき空文字を返す', () => {
    expect(buildSupportGoalsText({ '支援目標': null })).toBe('');
  });

  test('personalSupport 自体が null のとき空文字を返す', () => {
    expect(buildSupportGoalsText(null)).toBe('');
  });

  test('フィールドが欠損しているときも動作する', () => {
    const ps = { '支援目標': [{}] };
    const result = buildSupportGoalsText(ps);
    expect(result).toContain('【支援目標1】');
    expect(result).toContain('支援内容: ');
  });
});

describe('buildPlanSummary', () => {
  const ps = {
    '長期目標': '長期A',
    '短期目標': '短期A',
    '本人意向': '本人A',
    '家族意向': '家族A',
    '支援目標': [
      { '支援目標': '目標X', '支援内容': '内容X' },
    ],
  };

  test('全フィールドを含むサマリを生成する', () => {
    const result = buildPlanSummary(ps);
    expect(result).toContain('長期目標: 長期A');
    expect(result).toContain('短期目標: 短期A');
    expect(result).toContain('本人の希望: 本人A');
    expect(result).toContain('家族の希望: 家族A');
    expect(result).toContain('【支援目標1】目標X');
  });

  test('支援目標が空のとき「支援目標が設定されていません」を含む', () => {
    const result = buildPlanSummary({ ...ps, '支援目標': [] });
    expect(result).toContain('支援目標が設定されていません');
  });

  test('旧実装との出力一致（回帰テスト）', () => {
    // 旧実装と同じ出力形式であることを確認
    const supportGoals = ps['支援目標'];
    const supportGoalsText = supportGoals.map((goal, idx) => {
      const goalText = goal?.['支援目標'] || '';
      const contentText = goal?.['支援内容'] || '';
      return `【支援目標${idx + 1}】${goalText}\n支援内容: ${contentText}`;
    }).join('\n\n');
    const expected = `
【個別支援計画の概要】
長期目標: ${ps['長期目標']}
短期目標: ${ps['短期目標']}
本人の希望: ${ps['本人意向']}
家族の希望: ${ps['家族意向']}

【支援目標と支援内容】
${supportGoalsText}
`;
    expect(buildPlanSummary(ps)).toBe(expected);
  });
});
