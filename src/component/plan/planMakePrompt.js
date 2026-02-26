import { univApiCall,  } from '../../albCommonModule';
import { getUser } from '../../commonModule';
import { llmApiCall } from '../../modules/llmApiCall';
import { inputDefinitions } from './PlanAssessment';
import { getFiveDomainForLabel, deepEqual, getAssessmentChanges, formatAssessmentChanges } from './planCommonPart';

// promptCrypt の個別指定は廃止（llmApiCall内の定数で制御）

// 包括的な個別支援計画を生成する関数
export const generateComprehensivePlan = async (prms) => {
  const { 
    created, hid, bid, uid, users, inputs, setInputs, setSnack, 
    setOverlayOpen, setGenerateConfirmDialogOpen, assessmentDt: externalAssessmentDt, isModify, modifyItems,
    modifyTargets, lockedFields
  } = prms;

  if (!created) {
    setSnack({ msg: '作成日を設定してください', severity: 'warning' });
    return;
  }

  // ここでの確認ダイアログ制御は呼び出し側に委譲するため削除（後方互換のため存在しても使わない）
  // if (setGenerateConfirmDialogOpen && typeof setGenerateConfirmDialogOpen === 'function') {
  //   setGenerateConfirmDialogOpen(true);
  //   return;
  // }

  // オーバーレイを表示
  setOverlayOpen(true);

  // assessmentデータの取得（呼び出し側から渡された場合はそれを使用）
  let assessmentDt = externalAssessmentDt || {};
  if (!externalAssessmentDt) {
    const assessmentRes = await univApiCall({
      a: 'fetchUsersPlan', hid, bid, uid, item: 'assessment'}, 'E23443', '', 
      setSnack, '', '', false
    );
    if (assessmentRes?.data?.result) {
      const dt = assessmentRes.data.dt.filter(item => item.created <= created);
      assessmentDt = dt?.[0]?.content?.content || {};
    }
  }

  // 生成に必要な情報を準備
  const user = getUser(uid, users);
  assessmentDt.本人氏名 = user.name;
  assessmentDt.誕生日 = user.birthday;
  assessmentDt.学齢 = user.ageStr;

  // assessmentの内容を分類して整理（personalityの項目も含まれる）
  const assessmentEntries = Object.entries(assessmentDt)
    .filter(([key, value]) => 
      key !== '作成日' && 
      key !== '担当者' && 
      key !== 'ご家族（ご回答者）' && 
      key !== '本人氏名' &&
      key !== '誕生日' &&
      key !== '学齢' &&
      key !== '生活歴' &&
      value && 
      value.toString().trim() !== ''
    );

  // 五領域ごとにグループ分けする関数
  const groupByFiveDomains = (entries) => {
    const groups = {
      '健康・生活': [],
      '運動・感覚': [],
      '認知・行動': [],
      '言語・コミュニケーション': [],
      '人間関係・社会性': [],
      'その他': []
    };

    entries.forEach(([key, value]) => {
      // inputDefinitionsから該当する設問のグループを取得
      const definition = inputDefinitions.find(def => def.label === key);
      if (definition && definition.group) {
        if (groups[definition.group]) {
          groups[definition.group].push(`${key}: ${value}`);
        } else {
          groups['その他'].push(`${key}: ${value}`);
        }
      } else {
        // グループが定義されていない場合はその他に分類
        groups['その他'].push(`${key}: ${value}`);
      }
    });

    return groups;
  };

  // 本人支援関連の項目を五領域ごとにグループ分け
  const personalSupportEntries = assessmentEntries
    .filter(([key, value]) => 
      !['家族支援', '移行支援', '地域支援', '注意事項'].includes(key)
    );

  const groupedPersonalSupport = groupByFiveDomains(personalSupportEntries);
  
  // グループ分けされた内容を文字列に変換
  const personalSupportItems = Object.entries(groupedPersonalSupport)
    .filter(([group, items]) => items.length > 0)
    .map(([group, items]) => {
      return `【${group}】\n${items.join('\n')}`;
    })
    .join('\n\n');

  // 家族支援関連
  const familySupport = assessmentEntries
    .find(([key, value]) => key === '家族支援');
  const familySupportText = familySupport ? `家族支援: ${familySupport[1]}` : '';

  // 移行支援関連
  const transitionSupport = assessmentEntries
    .find(([key, value]) => key === '移行支援');
  const transitionSupportText = transitionSupport ? `移行支援: ${transitionSupport[1]}` : '';

  // 地域支援関連
  const communitySupport = assessmentEntries
    .find(([key, value]) => key === '地域支援');
  const communitySupportText = communitySupport ? `地域支援: ${communitySupport[1]}` : '';

  // 注意事項（全体に関わる重要な情報）
  const generalNotes = assessmentEntries
    .find(([key, value]) => key === '注意事項');
  const generalNotesText = generalNotes ? `注意事項: ${generalNotes[1]}` : '';

  // 生活歴の処理
  const lifeHistoryText = assessmentDt.生活歴 && Array.isArray(assessmentDt.生活歴) 
    ? assessmentDt.生活歴
        .filter(item => item && item.項目 && item.内容)
        .map(item => `${item.項目}: ${item.内容}`)
        .join('\n')
    : 'なし';

  // ===== isModify 用 追加ユーティリティ =====
  const normalizeDomainLabel = (label) => {
    if (!label) return '';
    const replaced = String(label)
      .replace('言語・コミュニケーション', '言語・コミュ')
      .replace('言語コミュニケーション', '言語・コミュ');
    return replaced;
  };

  const clipText = (text, maxLen) => {
    if (!text && text !== 0) return '';
    const s = String(text).replace(/[\s\u00A0]+/g, ' ').trim();
    if (!maxLen || s.length <= maxLen) return s;
    return s.slice(0, maxLen);
  };

  const buildCurrentPlanForPrompt = (planInputs) => {
    const rawGoals = Array.isArray(planInputs?.['支援目標']) ? planInputs['支援目標'] : [];
    const goals = rawGoals.map((g) => {
      const rawDomains = Array.isArray(g?.['五領域'])
        ? g['五領域']
        : String(g?.['五領域'] || '')
            .split(',')
            .map(v => v.trim())
            .filter(Boolean);
      const dom = rawDomains.map(normalizeDomainLabel).filter(Boolean);
      return {
        '項目': g?.['項目'] || '',
        '支援目標': clipText(g?.['支援目標'], 60),
        '支援内容': clipText(g?.['支援内容'], 300),
        '五領域': dom,
        '達成期間': Number(g?.['達成期間']) || 6,
        '担当者・提供機関': clipText(g?.['担当者・提供機関'], 50),
        '留意事項': clipText(g?.['留意事項'], 200),
        '優先順位': Number(g?.['優先順位']) || 0,
      };
    });

    const doc = {
      長期目標: clipText(planInputs?.['長期目標'], 300),
      短期目標: clipText(planInputs?.['短期目標'], 300),
      支援方針: clipText(planInputs?.['支援方針'], 400),
      本人意向: clipText(planInputs?.['本人意向'], 200),
      家族意向: clipText(planInputs?.['家族意向'], 200),
      支援目標: goals.slice(0, 8),
    };

    // 空キーを除外（支援目標は配列のまま残す）
    Object.keys(doc).forEach((k) => {
      if (k !== '支援目標' && (doc[k] === '' || doc[k] === undefined)) {
        delete doc[k];
      }
    });
    return doc;
  };

  const buildModifyConstraintsText = () => {
    const lines = [
      '- 指示された箇所のみ変更し、不要な箇所は維持してください',
      '- 五領域は1目標で1〜3個、全体では5領域を網羅してください',
      '- 優先順位は重複不可で1..nの連番にしてください',
      '- 達成期間は数値、担当者・提供機関は既存が適切なら維持してください',
      '- 出力は指定のJSONのみ。説明文は含めないでください'
    ];

    // 将来拡張: 変更対象/禁止対象が渡された場合、明記
    if (Array.isArray(lockedFields) && lockedFields.length) {
      lines.push(`- 次のキーは変更しないでください: ${lockedFields.join(', ')}`);
    }
    if (modifyTargets && (modifyTargets.planFields || modifyTargets.goals)) {
      if (Array.isArray(modifyTargets.planFields) && modifyTargets.planFields.length) {
        lines.push(`- 次の直下キーのみ変更対象: ${modifyTargets.planFields.join(', ')}`);
      }
      if (modifyTargets.goals) {
        if (Array.isArray(modifyTargets.goals.indices) && modifyTargets.goals.indices.length) {
          lines.push(`- 支援目標は次のインデックスのみ変更対象: [${modifyTargets.goals.indices.join(', ')}]`);
        }
        if (modifyTargets.goals.filter && modifyTargets.goals.filter.項目) {
          lines.push(`- 支援目標は項目='${modifyTargets.goals.filter.項目}' のみ変更対象`);
        }
      }
    }
    return lines.join('\n');
  };

  const modifyHeader = isModify ? `【修正・改善指示】\n${modifyItems || '既存の内容を基に全体的な改善を行ってください'}\n\n` : '';
  const currentPlanJson = isModify ? JSON.stringify(buildCurrentPlanForPrompt(inputs), null, 2) : '';
  const modifyAppendix = isModify
    ? `【現行の個別支援計画(JSON)】\n${currentPlanJson}\n\n【変更ポリシー】\n${buildModifyConstraintsText()}\n\n`
    : '';

  const prompt = `
あなたは児童発達支援の専門家です。以下の情報を基に、${isModify ? '既存の個別支援計画を修正・改善して' : ''}個別支援計画を作成してください。

${modifyHeader}
${modifyAppendix}
【利用者情報】
${assessmentDt.本人氏名}（${assessmentDt.性別}、${assessmentDt.学齢}）
症状: ${assessmentDt.症状 || 'なし'}
得意: ${assessmentDt.得意 || 'なし'}
${generalNotesText ? `\n【全体注意事項】\n${generalNotesText}` : ''}

【本人の特性・能力】
${personalSupportItems}

【支援方針の参考情報】
${familySupportText ? `\n${familySupportText}` : ''}
${transitionSupportText ? `\n${transitionSupportText}` : ''}
${communitySupportText ? `\n${communitySupportText}` : ''}

【重要：本人の特徴と家族の要望を重視】
1. 本人の症状（アレルギー、発達障害など）を最優先に考慮してください
2. 本人の得意分野を活かした目標設定を行ってください
3. 家族の要望や本人の意向を必ず反映してください
4. 本人の困難な分野に対しては段階的なアプローチを設定してください

【重要：五領域の特性を活用した目標設定】
上記の【本人の特性・能力】で示された五領域ごとの特性を以下のように活用してください：

【健康・生活】の特性を活用：
- 睡眠、食事、排泄、健康管理、身辺処理などの特性を考慮
- アレルギーや服薬などの特別な配慮が必要な場合は最優先で対応
- 安全意識や生活習慣の改善を目標に含める

【運動・感覚】の特性を活用：
- 粗大運動、微細運動、感覚統合の特性を考慮
- 得意な運動能力を活かした活動を目標に含める
- 感覚過敏や鈍麻がある場合は適切な配慮を明記

【認知・行動】の特性を活用：
- 注意力、記憶力、問題解決、行動制御の特性を考慮
- 集中力の持続時間や行動の切り替えの困難さを考慮
- 段階的なアプローチで認知能力の向上を図る

【言語・コミュニケーション】の特性を活用：
- 言葉の理解・表現、会話、非言語コミュニケーションの特性を考慮
- 語彙の豊富さや表現力の特性を活かした目標設定
- コミュニケーションの困難さに対しては具体的な支援方法を明記

【人間関係・社会性】の特性を活用：
- 友達との関係、集団活動への参加、ルール理解の特性を考慮
- 社会性の発達段階に応じた具体的な活動を目標に含める
- 集団での活動が苦手な場合は段階的な参加方法を設定

【重要：必須項目と五領域カバー】
1. 本人支援・家族支援・移行支援は必須項目です（必ず含めてください）
2. 本人支援の目標は必ず3個に限定してください（4個以上は作成しないでください）
3. 本人支援の各目標は五領域のうち1〜3個の領域に関わる具体的な目標にしてください
4. 本人支援の一つの目標で五領域全てをカバーするのは絶対に避けてください（抽象的になりすぎます）
5. 本人支援の3個の目標で五領域全体を必ずカバーしてください：
   - 人間関係・社会性（必ず含める）
   - 運動・感覚（必ず含める）
   - 認知・行動（必ず含める）
   - 言語・コミュニケーション（必ず含める）
   - 健康・生活（必ず含める）

【支援目標の構成規則（厳守）】
- 支援目標配列は次を必ず含む: 「項目":"本人支援" の目標を3件（厳密に3件のみ）、「項目":"家族支援" の目標を1件以上、「項目":"移行支援" の目標を1件以上
- 「家族支援」「移行支援」は、アセスメントの「家族支援」「移行支援」欄の内容を根拠として具体化する（該当欄が空でも、妥当な最小限の支援目標を1件以上作成する）
- 各目標の「項目」は次のいずれかの厳密な文字列のみ: 「本人支援」「家族支援」「移行支援」
- 「優先順位」は1からの連番で重複なし、配列内で昇順に並べる

【重要：支援目標の配列形式について】
- 支援目標は配列形式ですので、同じ項目（本人支援、家族支援、移行支援）を複数作成できます
- 本人支援は必ず3個に限定してください（4個以上は作成しないでください）
- 家族支援、移行支援は各1個以上作成してください
- 各目標は本人の特徴に基づいた具体的で実現可能な内容にしてください

【五領域の具体的な内容】
- 人間関係・社会性：友達との関係、集団活動への参加、ルールの理解など
- 運動・感覚：粗大運動、微細運動、感覚統合、身体の使い方など
- 認知・行動：注意力、記憶力、問題解決、行動の制御など
- 言語・コミュニケーション：言葉の理解・表現、会話、非言語コミュニケーションなど
- 健康・生活：生活習慣、健康管理、身辺処理、安全意識など

【目標設定の基本方針】
- 本人の特性・能力を基に、必ず3個の本人支援目標を設定してください
- 3個の目標で五領域全体を効率的にカバーするよう配慮してください
- 本人の特徴に基づいた具体的で実現可能な目標を重視してください
- 五領域をカバーしつつ、本人のニーズに最も適した目標を選択してください

【生成方針（アセスメント根拠ベース・反復推敲）】
- すべての目標はアセスメントの具体記述（症状・得意・本人意向・家族意向・五領域チェック）に基づいて作成する
- 各目標は作成前に根拠となるアセスメント項目を内的に想起・照合し、汎用例文や定型句に依存しない
- 候補目標を発案→重複・抽象度・実行可能性を内的に検討→最終案に収束させる（出力は最終案のみ）
- 本人支援は必ず3個の目標に絞り、各目標は1〜3領域に絞り、全体として五領域を網羅する

【五領域カバー確認方法】
本人支援の3個の目標を作成後、以下の五領域が全て含まれているか確認してください：
□ 人間関係・社会性
□ 運動・感覚
□ 認知・行動
□ 言語・コミュニケーション
□ 健康・生活

全ての領域がカバーされていない場合は、3個の目標内で不足している領域を含むように目標を調整してください。

【出力形式】
{
  "長期目標": "具体的な長期目標（150文字以内）",
  "短期目標": "具体的な短期目標（150文字以内）", 
  "支援方針": "総合的な支援方針（400文字以内）",
  "支援目標": [
    {
      "項目": "本人支援",
      "支援目標": "本人の特性に基づいた具体的な支援目標(35文字以内)",
      "支援内容": "目標達成のための具体的な支援方法",
      "五領域": ["該当する五領域"],
      "達成期間": 6,
      "担当者・提供機関": "支援員",
      "留意事項": "本人の特性に応じた配慮事項",
      "優先順位": 1
    }
  ]
}
 
 【出力ルール（厳守）】
 - 出力は上記のJSON「のみ」を返してください。前後に説明文・コードブロック・マークダウンを含めないでください
 - すべてのキー名と文字列はダブルクォート(")を使用し、シングルクォート(')は使用しないでください
 - 配列やオブジェクトの末尾カンマは入れないでください
 - 改行や特殊文字はJSONとして正しくエスケープしてください（例: \" \n など）
 - 値は指定の型・文字数・制約を守ってください
 - "五領域" は配列で返してください。要素は次のいずれかのみ: ["人間関係・社会性","運動・感覚","認知・行動","言語・コミュニケーション","健康・生活"]
`;

  try {
    const dateBase = created?.slice(0, 7) || new Date().toISOString().slice(0, 7);
    const firstOfMonth = `${dateBase}-01`;
    const res = await llmApiCall(
      { prompt, max_tokens: 25000, model: 60, hid, bid, date: firstOfMonth, llmItem: 'generateComprehensivePlan' },
      'EGEN23592', '', setSnack
    );

    let contentStr = '';
    if (res?.data?.response) {
      contentStr = res.data.response;
    } else if (res?.data?.content) {
      contentStr = res.data.content;
    }

    // 応答JSONの安全パース（軽微な引用符の不整合を補正）
    const safeParsePlanJson = (text) => {
      if (!text || typeof text !== 'string') return null;
      try { return JSON.parse(text); } catch (_) {}
      let fixed = text;
      // スマートクォートをASCIIに
      fixed = fixed.replace(/[\u2018\u2019]/g, "'");
      // 値末尾が単引用符で閉じられているケース 例: "...": "本文…',\n → ダブルクォートに置換
      fixed = fixed.replace(/(\":\s*\")(.*?)'(?=\s*[\},])/g, '$1$2"');
      // まれにキー/値の内部で改行が混ざる場合の最低限の正規化
      fixed = fixed.replace(/\r\n|\r/g, '\n');
      try { return JSON.parse(fixed); } catch (_) { return null; }
    };
    // 言語・コミュニケーションの表記ゆれを修正
    const normalizeLanguageCommunication = (text) => {
      if (!text || typeof text !== 'string') return text;
      return text.replace(/言語・コミュニケーション/g, '言語・コミュ');
    };

    if (contentStr) {
      const content = safeParsePlanJson(normalizeLanguageCommunication(contentStr));
      if (!content) {
        setSnack({ msg: 'LLM応答のJSON解析に失敗しました', severity: 'error' });
        return;
      }
      const normalizeGoalsForUi = (goals = []) => {
        if (!Array.isArray(goals)) return [];
        return goals.map((g) => {
          // 正規化: 五領域配列→カンマ区切り文字列、表記ゆれ修正
          let domainsArray = [];
          if (Array.isArray(g?.['五領域'])) {
            domainsArray = g['五領域'];
          } else if (typeof g?.['五領域'] === 'string') {
            domainsArray = g['五領域']
              .split(',')
              .map(v => v.trim())
              .filter(Boolean);
          }
          const domainsStr = domainsArray.map(normalizeDomainLabel).join(',');
          return {
            ...g,
            '五領域': domainsStr,
          };
        });
      };

      const normalizedGoals = normalizeGoalsForUi(content['支援目標']);
      const updated = {
        ...inputs,
        '長期目標': content['長期目標'] || '',
        '短期目標': content['短期目標'] || '',
        '支援方針': content['支援方針'] || '',
        '支援目標': normalizedGoals,
      };
      setInputs(updated);
      setSnack({ msg: isModify ? '個別支援計画が修正・改善されました' : '個別支援計画が生成されました', severity: 'success' });
    } else {
      setSnack({ msg: '生成に失敗しました', severity: 'error' });
    }
  } catch (error) {
    console.error('LLM生成エラー:', error);
    setSnack({ msg: '生成中にエラーが発生しました', severity: 'error' });
  } finally {
    setOverlayOpen(false);
  }
};

// 会議議事録向け: アセスメントと個別支援計画原案から議事録/修正/課題を生成
export const generateConferenceNoteFromAssessmentAndDraft = async (prms) => {
  const { uid, users, hid, bid, conferenceCreated, personalSupport, assessment, setSnack } = prms;

  try {
    // prompt 構築: 条件に適合したデータのみを反映
    const user = getUser(uid, users);
    const psCreated = personalSupport?.['作成日'] || '';
    const asCreated = assessment?.['アセスメント実施日'] || '';

    // ユーティリティ
    const isNonEmpty = (v) => v !== undefined && v !== null && String(v).toString().trim() !== '';
    const normalizeDomainLabel = (label) => {
      if (!label) return '';
      return String(label)
        .replace('言語・コミュニケーション', '言語・コミュ')
        .replace('言語コミュニケーション', '言語・コミュ');
    };
    const toArray = (v) => Array.isArray(v) ? v : (typeof v === 'string' && v.trim().startsWith('[')
      ? (()=>{ try { return JSON.parse(v); } catch(_) { return []; } })()
      : []);
    const toDomainsArray = (v) => {
      if (Array.isArray(v)) return v.map(normalizeDomainLabel).filter(Boolean);
      if (typeof v === 'string') return v.split(',').map(s=>normalizeDomainLabel(s.trim())).filter(Boolean);
      return [];
    };

    // 生活歴の整形（配列→行テキスト）
    const formatLifeHistory = (a) => {
      const lh = a?.['生活歴'];
      const arr = Array.isArray(lh) ? lh : (typeof lh === 'string' && lh.trim().startsWith('[')
        ? (()=>{ try { return JSON.parse(lh); } catch(_) { return []; } })()
        : []);
      if (!arr.length) return '';
      return arr
        .filter(it => isNonEmpty(it?.['項目']) && isNonEmpty(it?.['内容']))
        .map(it => `- ${it['項目']}: ${it['内容']}`)
        .join('\n');
    };

    // 支援目標の整形（配列→見出し付きテキスト）
    const formatGoals = (ps) => {
      const raw = ps?.['支援目標'];
      let goals = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw.trim().startsWith('[')
        ? (()=>{ try { return JSON.parse(raw); } catch(_) { return []; } })()
        : []);
      if (!goals.length) return '';
      return goals.map((g, idx) => {
        const item = g?.['項目'] || '';
        const goal = g?.['支援目標'] || '';
        const content = g?.['支援内容'] || '';
        const ds = toDomainsArray(g?.['五領域']);
        const period = g?.['達成期間'];
        const priority = g?.['優先順位'];
        const owner = g?.['担当者・提供機関'];
        const notes = g?.['留意事項'];
        const lines = [
          `#${idx+1}（${item}）`,
          `目標: ${goal}`,
          `内容: ${content}`,
          `五領域: [${ds.join(', ')}]`,
          isNonEmpty(period) ? `達成期間: ${period}` : '',
          isNonEmpty(priority) ? `優先順位: ${priority}` : '',
          isNonEmpty(owner) ? `担当者・提供機関: ${owner}` : '',
          isNonEmpty(notes) ? `留意事項: ${notes}` : '',
        ].filter(Boolean);
        return lines.join('\n');
      }).join('\n\n');
    };

    // 五領域チェック項目（アセスメント内の設問）を自動分類
    const buildFiveDomainChecks = (a) => {
      const five = {
        '健康・生活': [],
        '運動・感覚': [],
        '認知・行動': [],
        '言語・コミュニケーション': [],
        '人間関係・社会性': [],
      };
      const reserved = new Set([
        '作成日', '担当者', 'ご家族（ご回答者）', '本人氏名', '誕生日', '学齢', '生活歴', 
        '注意事項', '本人意向', '家族意向', '症状', '得意', 'アセスメント実施者', 
        'アセスメント実施日', '開始時間', '終了時間', '保護者続柄', '家族構成', 
        '病院名', '医師名', '病院連絡先'
      ]);
      Object.entries(a || {}).forEach(([k,v]) => {
        if (!isNonEmpty(v) || reserved.has(k)) return;
        const domain = getFiveDomainForLabel(k);
        if (domain && five[domain]) five[domain].push(`${k}: ${v}`);
      });
      const parts = Object.entries(five)
        .filter(([, items]) => items.length)
        .map(([g, items]) => `【${g}】\n- ${items.join('\n- ')}`);
      return parts.join('\n\n');
    };

    const majorAssessment = () => {
      const keys = ['症状','得意','注意事項','本人意向','家族意向'];
      return keys
        .filter(k => isNonEmpty(assessment?.[k]))
        .map(k => `${k}: ${assessment[k]}`)
        .join('\n');
    };

    const prompt = `
あなたは児童発達支援の専門家です。以下のアセスメント内容と個別支援計画原案の妥当性を検討し、会議議事録の素案を作成してください。

【利用者】${user?.name || ''}（${user?.ageStr || ''}）
【担当者会議 開催日】${conferenceCreated || ''}
【参照データ】
- 個別支援計画（原案） 作成日: ${psCreated}
- アセスメント 作成日: ${asCreated}

【アセスメント 概要（主要情報）】
${majorAssessment()}

${formatLifeHistory(assessment) ? `【生活歴（抜粋）】\n${formatLifeHistory(assessment)}` : ''}

${buildFiveDomainChecks(assessment) ? `【五領域に従ったチェック項目（自動分類）】\n${buildFiveDomainChecks(assessment)}` : ''}

${formatGoals(personalSupport) ? `【個別支援計画（原案） 支援目標】\n${formatGoals(personalSupport)}` : ''}

【出力要件】
- JSONのみを返してください（説明文、マークダウン、コードブロックは禁止）
- キーは必ず次の3つ: "議事録", "修正", "課題"
- 文章は平文のみ。適切に改行。専門性・簡潔性を両立
- それぞれの目安文字数: 議事録は400〜600字、修正は200〜350字、課題は120〜200字
- 出来るだけ平易な言葉を使用してください。
- 適切に改行を入れて下さい。200文字を目処に句点で改行して下さい。
- 改行や特殊文字はJSONとして正しくエスケープしてください（例: \" \n など）

【作成方針（リンクの妥当性チェックを重視）】
1) 議事録: アセスメントの内容を端的に議事録に反映させて下さい。支援項目とアセスメントの内容を対応させて、議事録を作成してください。短期目標・長期目標がそれぞれ妥当であるかどうかを判定して下さい。
2) 修正: 妥当でない箇所があったら修正を提案してください。修正する目標は目標自体を明記し、その上で修正箇所を示して下さい。修正は1箇所が好ましいですが2箇所を限度とします。
3) 課題: 修正後に留意すべきリスク/観察点/次回会議までの宿題などを列挙 3項目を限度とします。

【出力形式（厳守）】
{"議事録":"...","修正":"...","課題":"..."}
`;

    const logDate = conferenceCreated?.slice(0, 7) || new Date().toISOString().slice(0, 7);
    const res = await llmApiCall(
      {
        prompt,
        max_tokens: 15000,
        model: 50,
        hid,
        bid,
        date: `${logDate}-01`,
        llmItem: 'generateConferenceNoteFromAssessment'
      },
      'EGENCN001',
      '',
      setSnack
    );

    let contentStr = '';
    if (res?.data?.response) contentStr = res.data.response;
    else if (res?.data?.content) contentStr = res.data.content;

    if (!contentStr) {
      if (typeof setSnack === 'function') {
        setSnack({ msg: '生成に失敗しました', severity: 'error' });
      }
      return null;
    }

    // 安全パース
    const safeParse = (text) => {
      try { return JSON.parse(text); } catch (_) {}
      let fixed = String(text);
      fixed = fixed.replace(/```json[\s\S]*?```/g, (m) => m.replace(/```json|```/g, ''));
      fixed = fixed.replace(/\r\n|\r/g, '\n');
      try { return JSON.parse(fixed); } catch (_) { return null; }
    };

    const obj = safeParse(contentStr);
    if (!obj || typeof obj !== 'object') {
      if (typeof setSnack === 'function') {
        setSnack({ msg: 'LLM応答の解析に失敗しました', severity: 'error' });
      }
      return null;
    }

    return {
      '議事録': obj['議事録'] || '',
      '修正': obj['修正'] || '',
      '課題': obj['課題'] || ''
    };
  } catch (error) {
    console.error('generateConferenceNoteFromAssessmentAndDraft error:', error);
    if (typeof setSnack === 'function') {
      setSnack({ msg: '生成処理でエラーが発生しました', severity: 'error' });
    }
    return null;
  }
};

// モニタリング向け: personalSupport目標と[目標達成度][評価]から各考察と総合項目の考察を生成
export const generateMonitoring = async (prms) => {
  const { user, inputs, setInputs, personalSupport, setSnack, specialNote, hid, bid, uid, assessmentChanges = {} } = prms;

  try {
    // 暗号化指定の引数化は廃止（llmApiCall内の定数で制御）

    const goals = Array.isArray(personalSupport?.['支援目標']) ? personalSupport['支援目標'] : [];
    const progress = Array.isArray(inputs?.['支援経過']) ? inputs['支援経過'] : [];

    // アセスメント変更は引数で受け取ったものを使用
    console.log('Using assessment changes from parameter:', assessmentChanges);

    // コンテキスト整形
    const ctxGoals = goals.map((g, i) => {
      const p = progress[i] || {};
      const fields = [
        `#${i + 1}`,
        `目標: ${g?.['支援目標'] || ''}`,
        `内容: ${g?.['支援内容'] || ''}`,
        `留意事項: ${g?.['留意事項'] || ''}`,
        `達成度: ${p?.['目標達成度'] || ''}`,
        `評価: ${p?.['評価'] || ''}`,
      ];
      return fields.join(' / ');
    }).join('\n');

    const longSrc = personalSupport?.['長期目標'] || '';
    const shortSrc = personalSupport?.['短期目標'] || '';
    const personalHopeSrc = personalSupport?.['本人意向'] || personalSupport?.['本人の希望'] || '';
    const familyHopeSrc = personalSupport?.['家族意向'] || personalSupport?.['ご家族の希望'] || '';

    // 変更点のみをプロンプト用のテキストに変換（excludeKeys以外の全ての項目を含める）
    const assessmentContext = Object.keys(assessmentChanges).length > 0 
      ? formatAssessmentChanges(assessmentChanges) 
      : '';

    // JSON一括生成プロンプト
    const prompt = `
あなたは児童発達支援の専門家です。以下の情報に基づき、モニタリング用途の「考察」をJSONのみで返してください。

【利用者】${user?.name || ''}
${specialNote ? `【特記事項】${specialNote}\n` : ''}
${assessmentContext ? `【アセスメント変更点】\n${assessmentContext}\n` : ''}
【元の長期目標】${longSrc}
【元の短期目標】${shortSrc}
【本人の希望(元)】${personalHopeSrc}
【ご家族の希望(元)】${familyHopeSrc}
【支援目標と現状】\n${ctxGoals || '- なし'}

${assessmentContext ? `【重要：アセスメント変更点の考慮について】
上記のアセスメント変更点は、前回のアセスメントから今回のアセスメントへの変更を示しています。
考察を作成する際は、変更後の内容（「に変更になりました」の後の内容）を重視し、
変更前の内容は参考程度に留めてください。
変更後の内容が本人の現在の状況やニーズをより正確に反映しているものとして考察に反映させてください。\n` : ''}

【作成方針】
- まず全ての個別目標に対し、観察と解釈に基づく「考察」を作成する（提案・指示は書かない）
- 次に、その個別考察の傾向（共通点・相違点・偏り）と「達成度」「評価」を踏まえて、
  「長期目標」「短期目標」「本人の希望」「ご家族の希望」の各「考察」を合成する
- 長期/短期/希望の各考察は、支援経過[].考察と矛盾せず、内容的に連動させる（整合性重視）
- 目標文の単なる言い換えは避け、観察可能な事実・整合性・要因仮説に基づく
- 将来の言及（今後、期待 等）は避ける。情報不足は「設定データが不足しています」とする

【出力形式（厳守）】
{
  "長期目標": "長期目標の考察（150字以内 推奨）",
  "短期目標": "短期目標の考察（150字以内 推奨）",
  "本人の希望": "本人希望の考察（80-120字 目安）",
  "ご家族の希望": "家族希望の考察（80-120字 目安）",
  "支援経過": [
    { "index": 0, "考察": "#1の目標に対する考察（120字前後）" }
  ]
}

【出力ルール（厳守）】
- JSONのみを返してください。説明文・コードブロック・マークダウンは禁止
- すべてのキー名と文字列はダブルクォート
- "支援経過"配列の長さは支援目標数と同じ。indexは0始まりの連番
- 各値の文頭に見出し・番号・#・「〜の考察:」等のラベルを付けない（平文のみ）
- 箇条書きや記号の先頭付与（-, ・, * など）も禁止。自然な文章のみ
`;

    const logDate = new Date().toISOString().slice(0, 7);
    const res = await llmApiCall(
      { prompt, max_tokens: 15000, model: 50, hid, bid, date: `${logDate}-01`, llmItem: 'generateMonitoring' },
      'EMONI201',
      '',
      setSnack
    );

    let contentStr = '';
    if (res?.data?.response) contentStr = res.data.response;
    else if (res?.data?.content) contentStr = res.data.content;

    // 安全パース
    const safeParse = (text) => {
      if (!text || typeof text !== 'string') return null;
      try { return JSON.parse(text); } catch (_) {}
      let fixed = String(text);
      fixed = fixed.replace(/```json[\s\S]*?```/g, (m) => m.replace(/```json|```/g, ''));
      fixed = fixed.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''));
      fixed = fixed.replace(/\r\n|\r/g, '\n');
      try { return JSON.parse(fixed); } catch (_) { return null; }
    };

    const obj = safeParse(contentStr);
    if (!obj || typeof obj !== 'object') {
      setSnack && setSnack({ msg: 'LLM応答の解析に失敗しました', severity: 'error' });
      return;
    }

    // 反映
    const stripLeadingLabel = (text) => {
      if (text === undefined || text === null) return '';
      let s = String(text).trim();
      // 代表的なラベルの除去
      s = s.replace(/^\s*(長期目標|短期目標|本人の希望|ご家族の希望)の?考察[:：]\s*/,'');
      s = s.replace(/^\s*#?\d+[^\n]*?考察[:：]\s*/, '');
      s = s.replace(/^\s*(?:[-・*])+\s*/, '');
      s = s.replace(/^\s*【[^】]{1,20}】\s*/, '');
      return s.trim();
    };

    const updates = {};
    updates['長期目標'] = stripLeadingLabel(obj['長期目標']);
    updates['短期目標'] = stripLeadingLabel(obj['短期目標']);
    updates['本人の希望'] = stripLeadingLabel(obj['本人の希望']);
    updates['ご家族の希望'] = stripLeadingLabel(obj['ご家族の希望']);

    const outProgress = Array.isArray(obj['支援経過']) ? obj['支援経過'] : [];
    const neededLen = Math.max(goals.length, progress.length);
    const nextProgress = Array.from({ length: neededLen }).map((_, i) => ({ ...(progress[i] || {}) }));
    outProgress.forEach((item) => {
      const idx = Number(item?.index);
      if (!Number.isInteger(idx) || idx < 0 || idx >= neededLen) return;
      const val = stripLeadingLabel(item?.['考察']);
      nextProgress[idx] = { ...(nextProgress[idx] || {}), '考察': val };
    });
    updates['支援経過'] = nextProgress;

    setInputs(prev => ({ ...prev, ...updates }));
    setSnack && setSnack({ msg: 'モニタリングの考察（JSON）を反映しました', severity: 'success' });
  } catch (error) {
    console.error('generateMonitoring error:', error);
    setSnack && setSnack({ msg: '生成中にエラーが発生しました', severity: 'error' });
  }
};

// 計画見直し提案を生成する関数
export const generatePlanReviewProposal = async (prms) => {
  const { 
    user, inputs, setInputs, personalSupport, assessmentChanges, setSnack, hid, bid, uid
  } = prms;

  try {
    // アセスメント変更点をテキストに変換
    const assessmentChangesText = formatAssessmentChanges(assessmentChanges);
    
    // モニタリングの支援経過を整理
    const progress = Array.isArray(inputs?.['支援経過']) ? inputs['支援経過'] : [];
    const progressText = progress.map((row, idx) => {
      const goal = row?.['目標'] || '';
      const achievement = row?.['目標達成度'] || '';
      const evaluation = row?.['評価'] || '';
      const consideration = row?.['考察'] || '';
      return `【目標${idx + 1}】${goal}\n達成度: ${achievement}\n評価: ${evaluation}\n考察: ${consideration}`;
    }).join('\n\n');

    // 個別支援計画の支援内容を整理
    const supportGoals = Array.isArray(personalSupport?.['支援目標']) ? personalSupport['支援目標'] : [];
    const supportGoalsText = supportGoals.map((goal, idx) => {
      const goalText = goal?.['支援目標'] || '';
      const contentText = goal?.['支援内容'] || '';
      return `【支援目標${idx + 1}】${goalText}\n支援内容: ${contentText}`;
    }).join('\n\n');

    // 個別支援計画の主要項目を整理
    const planSummary = `
【個別支援計画の概要】
長期目標: ${personalSupport?.['長期目標'] || ''}
短期目標: ${personalSupport?.['短期目標'] || ''}
本人の希望: ${personalSupport?.['本人意向'] || ''}
家族の希望: ${personalSupport?.['家族意向'] || ''}

【支援目標と支援内容】
${supportGoalsText || '支援目標が設定されていません'}
`;

    // プロンプトを構築
    const prompt = `
以下の情報を基に、計画の見直し提案を行ってください。

【利用者情報】
氏名: ${user.name}
年齢: ${user.ageStr}

【個別支援計画】
${planSummary}

【アセスメントの変更点】
${assessmentChangesText || '変更点はありません'}

【現在のモニタリング結果】
${progressText}

【作成方針】
1) 議事録: 目標や利用者の特徴などの振り返りや修正点の確認を記載してください。アセスメントの変更点とモニタリング結果を踏まえた総合的な振り返りを行ってください。
2) 修正: 目標の修正案と支援内容の見直し案を具体的に提案してください。アセスメントの変化点やモニタリングの内容に基づいて、修正が必要な目標や支援方法を明記し、その理由と修正内容を記載してください。
3) 課題: 修正後にも残りそうな課題や継続的に取り組むべき点を記載してください。

【出力形式（厳守）】
{"議事録":"...","修正":"...","課題":"..."}

- 各項目は200文字程度で簡潔に記載してください
- 適切に改行を入れて下さい。200文字を目処に句点で改行して下さい
- 改行や特殊文字はJSONとして正しくエスケープしてください（例: \" \n など）
`;

    // LLM APIを呼び出し
    const logDate = new Date().toISOString().slice(0, 7);
    const res = await llmApiCall(
      { prompt, max_tokens: 15000, model: 50, hid, bid, date: `${logDate}-01`, llmItem: 'generatePlanReviewProposal' },
      'EPLANREV001',
      '',
      setSnack
    );

    let contentStr = '';
    if (res?.data?.response) contentStr = res.data.response;
    else if (res?.data?.content) contentStr = res.data.content;

    if (!contentStr) {
      if (typeof setSnack === 'function') {
        setSnack({ msg: '計画見直し提案の生成に失敗しました', severity: 'error' });
      }
      return null;
    }

    // 安全パース
    const safeParse = (text) => {
      try { return JSON.parse(text); } catch (_) {}
      let fixed = String(text);
      fixed = fixed.replace(/```json[\s\S]*?```/g, (m) => m.replace(/```json|```/g, ''));
      fixed = fixed.replace(/\r\n|\r/g, '\n');
      try { return JSON.parse(fixed); } catch (_) { return null; }
    };

    const obj = safeParse(contentStr);
    if (!obj || typeof obj !== 'object') {
      if (typeof setSnack === 'function') {
        setSnack({ msg: 'LLM応答の解析に失敗しました', severity: 'error' });
      }
      return null;
    }

    // 結果を各フィールドに反映
    setInputs(prev => ({
      ...prev,
      '議事録': obj['議事録'] || '',
      '修正': obj['修正'] || '',
      '課題': obj['課題'] || ''
    }));
    
    setSnack({ msg: '計画見直し提案を生成しました', severity: 'success' });
    
    return {
      '議事録': obj['議事録'] || '',
      '修正': obj['修正'] || '',
      '課題': obj['課題'] || ''
    };
  } catch (error) {
    console.error('generatePlanReviewProposal error:', error);
    setSnack({ msg: '計画見直し提案の生成中にエラーが発生しました', severity: 'error' });
  }
};

// 議事録作成用: モニタリングとアセスメント変更点から議事録を生成
export const generateConferenceNoteFromMonitoringAndAssessment = async (prms) => {
  const { 
    user, inputs, setInputs, personalSupport, monitoring, assessmentChanges, 
    isImprovementMode, setSnack, hid, bid, uid
  } = prms;

  try {
    // アセスメント変更点をテキストに変換
    const assessmentChangesText = formatAssessmentChanges(assessmentChanges);
    
    // モニタリングの支援経過を整理（モニタリングが存在しない場合は空文字列）
    const progress = Array.isArray(monitoring?.['支援経過']) ? monitoring['支援経過'] : [];
    const progressText = progress.length > 0 ? progress.map((row, idx) => {
      const goal = row?.['目標'] || '';
      const achievement = row?.['目標達成度'] || '';
      const evaluation = row?.['評価'] || '';
      const consideration = row?.['考察'] || '';
      return `【目標${idx + 1}】${goal}\n達成度: ${achievement}\n評価: ${evaluation}\n考察: ${consideration}`;
    }).join('\n\n') : '';

    // 個別支援計画の支援内容を整理
    const supportGoals = Array.isArray(personalSupport?.['支援目標']) ? personalSupport['支援目標'] : [];
    const supportGoalsText = supportGoals.map((goal, idx) => {
      const goalText = goal?.['支援目標'] || '';
      const contentText = goal?.['支援内容'] || '';
      return `【支援目標${idx + 1}】${goalText}\n支援内容: ${contentText}`;
    }).join('\n\n');

    // 個別支援計画の主要項目を整理
    const planSummary = `
【個別支援計画の概要】
長期目標: ${personalSupport?.['長期目標'] || ''}
短期目標: ${personalSupport?.['短期目標'] || ''}
本人の希望: ${personalSupport?.['本人意向'] || ''}
家族の希望: ${personalSupport?.['家族意向'] || ''}

【支援目標と支援内容】
${supportGoalsText || '支援目標が設定されていません'}
`;

    // モードに応じた作成方針を設定
    const modeDescription = isImprovementMode 
      ? '改善議事録（支援策の改善提案に重点を置く）'
      : '見守り議事録（現在の状況確認と支援策の見守りに重点を置く）';

    const modeInstructions = isImprovementMode 
      ? `1) 議事録: 現在の支援状況を踏まえ、改善が必要な点を中心に記載してください。アセスメントの変更点とモニタリング結果から改善の必要性を総合的に評価してください。
2) 修正: 具体的な改善案を提案してください。アセスメントの変化点やモニタリングの内容に基づいて、改善が必要な支援方法や目標を明記し、その理由と改善内容を記載してください。改善箇所は一箇所から二箇所とします。
3) 課題: 改善後にも残りそうな課題や継続的に取り組むべき点を記載してください。課題は1項目から2項目程度`
      : `1) 議事録: 正気目標、短期目標、モニタリングの内容、アセスメントの内容、アセスメントの変更点などを確認してください。モニタリングは情報が無ければ言及しません。
2) 修正: 支援計画の主な内容を再確認し、継続的に取り組むとする文章を記述します。言及は支援内容一箇所から二箇所とします。
3) 課題: 今後の支援において継続的に注意すべき点や観察すべき点を記載してください。課題は1項目から2項目程度`;

    // プロンプトを構築
    const prompt = `
以下の情報を基に、${modeDescription}を作成してください。

【利用者情報】
氏名: ${user.name}
年齢: ${user.ageStr}

【個別支援計画】
${planSummary}

【アセスメントの変更点】
${assessmentChangesText || '変更点はありません'}

${progressText ? `【現在のモニタリング結果】\n${progressText}` : ''}

【作成方針】
${modeInstructions}

【出力形式（厳守）】
{"議事録":"...","修正":"...","課題":"..."}

- 各項目は200文字程度で簡潔に記載してください
- 適切に改行を入れて下さい。200文字を目処に句点で改行して下さい
- 改行や特殊文字はJSONとして正しくエスケープしてください（例: \" \n など）
`;

    // LLM APIを呼び出し
    const logDate = new Date().toISOString().slice(0, 7);
    const res = await llmApiCall(
      {
        prompt,
        max_tokens: 15000,
        model: 50,
        hid,
        bid,
        date: `${logDate}-01`,
        llmItem: 'generateConferenceNoteFromMonitoring'
      },
      'ECONFNOTE001',
      '',
      setSnack
    );

    let contentStr = '';
    if (res?.data?.response) contentStr = res.data.response;
    else if (res?.data?.content) contentStr = res.data.content;

    if (!contentStr) {
      if (typeof setSnack === 'function') {
        setSnack({ msg: '議事録の生成に失敗しました', severity: 'error' });
      }
      return null;
    }

    // 安全パース
    const safeParse = (text) => {
      try { return JSON.parse(text); } catch (_) {}
      let fixed = String(text);
      fixed = fixed.replace(/```json[\s\S]*?```/g, (m) => m.replace(/```json|```/g, ''));
      fixed = fixed.replace(/\r\n|\r/g, '\n');
      try { return JSON.parse(fixed); } catch (_) { return null; }
    };

    const obj = safeParse(contentStr);
    if (!obj || typeof obj !== 'object') {
      if (typeof setSnack === 'function') {
        setSnack({ msg: 'LLM応答の解析に失敗しました', severity: 'error' });
      }
      return null;
    }

    // 結果を各フィールドに反映
    setInputs(prev => ({
      ...prev,
      '議事録': obj['議事録'] || '',
      '修正': obj['修正'] || '',
      '課題': obj['課題'] || ''
    }));
    
    const modeText = isImprovementMode ? '改善議事録' : '見守り議事録';
    setSnack({ msg: `${modeText}を生成しました`, severity: 'success' });
    
    return {
      '議事録': obj['議事録'] || '',
      '修正': obj['修正'] || '',
      '課題': obj['課題'] || ''
    };
  } catch (error) {
    console.error('generateConferenceNoteFromMonitoringAndAssessment error:', error);
    setSnack({ msg: '議事録の生成中にエラーが発生しました', severity: 'error' });
  }
};
