import { useState, useEffect, useRef } from 'react';
import { llmApiCall } from '../../../modules/llmApiCall';

// 名字用: 伝統的な読みを中心に返す
const KANA_SYSTEM_ROLE_SURNAME = "日本語の姓のひらがな読み仮名を返す。一般的・伝統的な読み方を優先する。ひらがなのみ出力する。カタカナは使用しない。";
// 名前用: キラキラネームを含めた現代的な読みも返す
const KANA_SYSTEM_ROLE_GIVEN = "日本語の名前のひらがな読み仮名を返す。一般的な読み方に加え、近年のキラキラネームや創作読みも考慮する。ひらがなのみ出力する。カタカナは使用しない。";

const getKanaSystemRole = (kanaField) =>
  ['klname', 'pklname'].includes(kanaField) ? KANA_SYSTEM_ROLE_SURNAME : KANA_SYSTEM_ROLE_GIVEN;

const MAX_KANA_EXCLUSIONS = 10;
const MAX_KANA_CANDIDATES = 5;
const KANA_FIELDS = ['klname', 'kfname', 'pklname', 'pkfname'];
const KANA_SOURCE_MAP = {
  klname: 'lname',
  kfname: 'fname',
  pklname: 'plname',
  pkfname: 'pfname',
};
export const KANJI_TO_KANA_MAP = {
  lname: 'klname',
  fname: 'kfname',
  plname: 'pklname',
  pfname: 'pkfname',
};

const useKanaInput = ({ formValues, formValuesRef, formDispatch }) => {
  const [kanaLoading, setKanaLoading] = useState({});
  const [kanaActionVisible, setKanaActionVisible] = useState({
    klname: false,
    kfname: false,
    pklname: false,
    pkfname: false,
  });

  const kanaExclusionHistoryRef = useRef({});
  const kanaCandidatesRef = useRef({});
  const kanaCandidateCursorRef = useRef({});
  const kanaActionTimerRef = useRef({});
  const kanaEditedRef = useRef({});
  const kanaInitialFilledRef = useRef({});
  const kanaAutoValueRef = useRef({});
  const kanjiBlurValueRef = useRef({});
  const kanaLoadingRef = useRef(kanaLoading);
  useEffect(() => { kanaLoadingRef.current = kanaLoading; }, [kanaLoading]);

  // 初期状態の記録
  useEffect(() => {
    KANA_FIELDS.forEach((field) => {
      kanaEditedRef.current[field] = false;
      kanaInitialFilledRef.current[field] = !!(formValues[field] || '').toString().trim();
      kanaAutoValueRef.current[field] = (formValues[field] || '').toString().trim();
    });
    Object.keys(KANJI_TO_KANA_MAP).forEach((kanjiField) => {
      kanjiBlurValueRef.current[kanjiField] = (formValues[kanjiField] || '').toString().trim();
    });
  }, []);

  // 読み仮名アクションボタンの表示制御
  useEffect(() => {
    const nextHidden = {};
    KANA_FIELDS.forEach((field) => {
      if (kanaActionTimerRef.current[field]) {
        clearTimeout(kanaActionTimerRef.current[field]);
        kanaActionTimerRef.current[field] = null;
      }

      const sourceField = KANA_SOURCE_MAP[field];
      const hasSource = !!(formValues[sourceField] || '').toString().trim();
      const hasKana = !!(formValues[field] || '').toString().trim();
      const editedByUser = !!kanaEditedRef.current[field];
      const initiallyFilled = !!kanaInitialFilledRef.current[field];
      const loading = !!kanaLoading[field];
      const hasCandidates = (kanaCandidatesRef.current[field] || []).length > 0;

      if (!hasSource || initiallyFilled) {
        nextHidden[field] = false;
        return;
      }
      if (editedByUser && hasKana) {
        nextHidden[field] = false;
        return;
      }
      if (hasKana && hasCandidates) {
        nextHidden[field] = true;
        return;
      }
      if (hasKana || loading) {
        nextHidden[field] = false;
        return;
      }

      nextHidden[field] = false;
      kanaActionTimerRef.current[field] = setTimeout(() => {
        const latestKana = (formValuesRef.current[field] || '').toString().trim();
        const latestSource = (formValuesRef.current[sourceField] || '').toString().trim();
        const latestLoading = !!kanaLoadingRef.current[field];
        if (!latestKana && latestSource && !kanaEditedRef.current[field] && !kanaInitialFilledRef.current[field] && !latestLoading) {
          setKanaActionVisible(prev => ({ ...prev, [field]: true }));
        }
      }, 1000);
    });

    setKanaActionVisible(prev => {
      const next = { ...prev, ...nextHidden };
      const changed = KANA_FIELDS.some(field => prev[field] !== next[field]);
      return changed ? next : prev;
    });

    return () => {
      KANA_FIELDS.forEach((field) => {
        if (kanaActionTimerRef.current[field]) {
          clearTimeout(kanaActionTimerRef.current[field]);
          kanaActionTimerRef.current[field] = null;
        }
      });
    };
  }, [
    formValues.lname, formValues.fname, formValues.plname, formValues.pfname,
    formValues.klname, formValues.kfname, formValues.pklname, formValues.pkfname,
    kanaLoading.klname, kanaLoading.kfname, kanaLoading.pklname, kanaLoading.pkfname,
  ]);

  // マウント時の読み仮名自動取得
  useEffect(() => {
    const getMissingKana = async () => {
      const missingKanaMap = {};
      if (formValues.lname && !formValues.klname) missingKanaMap.klname = formValues.lname;
      if (formValues.fname && !formValues.kfname) missingKanaMap.kfname = formValues.fname;
      if (formValues.plname && !formValues.pklname) missingKanaMap.pklname = formValues.plname;
      if (formValues.pfname && !formValues.pkfname) missingKanaMap.pkfname = formValues.pfname;
      if (!Object.keys(missingKanaMap).length) return;

      for (const [kanaKey, kanjiValue] of Object.entries(missingKanaMap)) {
        setKanaLoading(prev => ({ ...prev, [kanaKey]: true }));
        const isSurname = ['klname', 'pklname'].includes(kanaKey);
        const initPrompt = isSurname
          ? `「${kanjiValue}」の読み仮名を1つ、ひらがなのみで返してください。`
          : `「${kanjiValue}」の読み仮名を1つ、ひらがなのみで返してください。キラキラネームの読みも考慮してください。`;
        try {
          const response = await llmApiCall(
            { prompt: initPrompt, systemrole: getKanaSystemRole(kanaKey) },
            'E232298', '', '', '', '', false
          );
          console.log('[useKanaInput] init response', kanaKey, response?.data);
          if (!response?.data?.success) {
            console.warn('[useKanaInput] init API error', kanaKey, response?.data?.message);
          } else if (response?.data?.response) {
            const kana = response.data.response.trim();
            console.log('[useKanaInput] init kana', kanaKey, kana);
            kanaAutoValueRef.current[kanaKey] = kana;
            kanaEditedRef.current[kanaKey] = false;
            formDispatch({ type: 'SET_FIELD', name: kanaKey, value: kana });
          }
        } catch (error) {
          console.error(`${kanjiValue}の読み仮名取得に失敗しました`, error);
        } finally {
          setKanaLoading(prev => ({ ...prev, [kanaKey]: false }));
        }
      }
    };

    if ((formValues.lname && !formValues.klname) ||
      (formValues.fname && !formValues.kfname) ||
      (formValues.plname && !formValues.pklname) ||
      (formValues.pfname && !formValues.pkfname)) {
      getMissingKana();
    }
  }, []);

  const getKanaExclusionList = (kanaField, extraKana = '') => {
    const history = kanaExclusionHistoryRef.current[kanaField] || [];
    const merged = [...history];
    const extra = (extraKana || '').trim();
    if (extra && !merged.includes(extra)) merged.push(extra);
    return merged.slice(-MAX_KANA_EXCLUSIONS);
  };

  const rememberKanaExclusion = (kanaField, kana) => {
    const nextKana = (kana || '').trim();
    if (!nextKana) return;
    const prev = kanaExclusionHistoryRef.current[kanaField] || [];
    const unique = prev.filter(e => e !== nextKana);
    kanaExclusionHistoryRef.current[kanaField] = [...unique, nextKana].slice(-MAX_KANA_EXCLUSIONS);
  };

  const normalizeKana = (value = '') => (
    value
      .toString()
      .trim()
      .normalize('NFKC')
      .replace(/\s+/g, '')
      .replace(/[・･]/g, '')
  );

  const parseKanaCandidates = (rawText = '') => {
    const text = (rawText || '').trim();
    if (!text) return [];

    const normalizeArray = (arr) => [...new Set(
      (arr || [])
        .map(e => (e || '').toString().trim())
        .filter(Boolean)
    )];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return normalizeArray(parsed);
    } catch (_) {}

    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed)) return normalizeArray(parsed);
      } catch (_) {}
    }

    const fallback = text
      .split(/\n|、|,/)
      .map(e => e.replace(/^\s*\d+[\.\):：\s-]*/, '').trim())
      .filter(Boolean);
    return normalizeArray(fallback);
  };

  const setKanaCandidates = (kanaField, candidates, excludedKanaSet = new Set(), decidedKana = '') => {
    const decided = normalizeKana(decidedKana);
    const unique = [];
    const seen = new Set();
    (candidates || []).forEach(c => {
      const candidate = (c || '').trim();
      const n = normalizeKana(candidate);
      if (!n) return;
      if (excludedKanaSet.has(n)) return;
      if (seen.has(n)) return;
      seen.add(n);
      unique.push(candidate);
    });
    const picked = unique.slice(0, MAX_KANA_CANDIDATES);
    kanaCandidatesRef.current[kanaField] = picked;
    const decidedIndex = picked.findIndex(e => normalizeKana(e) === decided);
    kanaCandidateCursorRef.current[kanaField] = (
      decidedIndex >= 0 && picked.length > 0
        ? (decidedIndex + 1) % picked.length
        : 0
    );
  };

  const popKanaFromCandidates = (kanaField, excludeKanaList = []) => {
    const current = kanaCandidatesRef.current[kanaField] || [];
    if (!current.length) return '';
    const len = current.length;
    let cursor = Number(kanaCandidateCursorRef.current[kanaField] || 0);
    if (cursor < 0 || cursor >= len) cursor = 0;
    const excludedSet = new Set(
      (excludeKanaList || [])
        .map(e => normalizeKana(e))
        .filter(Boolean)
    );
    for (let i = 0; i < len; i++) {
      const idx = (cursor + i) % len;
      const n = normalizeKana(current[idx]);
      if (!n || excludedSet.has(n)) continue;
      kanaCandidateCursorRef.current[kanaField] = (idx + 1) % len;
      return current[idx];
    }
    const fallback = current[cursor] || '';
    kanaCandidateCursorRef.current[kanaField] = (cursor + 1) % len;
    return fallback;
  };

  const resetKanaQueryState = (kanaField) => {
    kanaCandidatesRef.current[kanaField] = [];
    kanaCandidateCursorRef.current[kanaField] = 0;
    kanaExclusionHistoryRef.current[kanaField] = [];
  };

  const fetchKanaForField = async (kanjiValue, kanaField, options = {}) => {
    const { isRetry = false, excludeKanaList = [] } = options;
    const parentKanaMap = { klname: 'pklname' };
    const normalizedExcludeKanaList = [...new Set(
      (excludeKanaList || [])
        .map(e => (e || '').trim())
        .filter(Boolean)
    )].slice(-MAX_KANA_EXCLUSIONS);
    const excludedKanaSet = new Set(
      normalizedExcludeKanaList.map(e => normalizeKana(e)).filter(Boolean)
    );
    setKanaLoading(prev => ({ ...prev, [kanaField]: true }));
    const isSurname = ['klname', 'pklname'].includes(kanaField);
    try {
      const prompt = [
        isSurname
          ? `「${kanjiValue}」のひらがな読み仮名候補を5個、JSON配列のみで返してください。例: ["たなか","やまだ"]`
          : `「${kanjiValue}」のひらがな読み仮名候補を5個、JSON配列のみで返してください。キラキラネームも含めてください。例: ["たろう","じろう"]`,
        normalizedExcludeKanaList.length > 0
          ? `以下の読みは除外してください: ${normalizedExcludeKanaList.join('、')}`
          : '',
      ].filter(Boolean).join('\n');
      const response = await llmApiCall(
        { prompt, systemrole: getKanaSystemRole(kanaField) },
        'E232298', '', '', '', '', false
      );
      console.log('[useKanaInput] fetch response', kanaField, response?.data);
      if (!response?.data?.success) {
        console.warn('[useKanaInput] fetch API error', kanaField, response?.data?.message);
        return;
      }
      const rawResponse = response?.data?.response?.trim();
      console.log('[useKanaInput] rawResponse', kanaField, rawResponse);
      if (!rawResponse) return;

      const candidates = parseKanaCandidates(rawResponse);
      const decidedKana = candidates.find(e => !excludedKanaSet.has(normalizeKana(e))) || '';
      setKanaCandidates(kanaField, candidates, excludedKanaSet, decidedKana);

      if (decidedKana) {
        rememberKanaExclusion(kanaField, decidedKana);
        kanaAutoValueRef.current[kanaField] = decidedKana;
        kanaEditedRef.current[kanaField] = false;
        formDispatch({ type: 'SET_FIELD', name: kanaField, value: decidedKana });
        const parentKanaField = parentKanaMap[kanaField];
        if (parentKanaField && !formValuesRef.current[parentKanaField]) {
          kanaAutoValueRef.current[parentKanaField] = decidedKana;
          kanaEditedRef.current[parentKanaField] = false;
          formDispatch({ type: 'SET_FIELD', name: parentKanaField, value: decidedKana });
        }
      } else if (isRetry) {
        console.warn(`${kanjiValue}の読み仮名再取得で、除外候補以外の候補を取得できませんでした`);
      }
    } catch (error) {
      console.error(`${kanjiValue}の読み仮名取得に失敗しました`, error);
    } finally {
      setKanaLoading(prev => ({ ...prev, [kanaField]: false }));
    }
  };

  const refetchKanaForField = (kanaField) => {
    const sourceMap = { klname: 'lname', kfname: 'fname', pklname: 'plname', pkfname: 'pfname' };
    const kanjiField = sourceMap[kanaField];
    if (!kanjiField) return;
    const kanjiValue = formValuesRef.current[kanjiField];
    if (!kanjiValue) return;
    const currentKana = formValuesRef.current[kanaField];
    const excludeKanaList = getKanaExclusionList(kanaField, currentKana);
    const cachedKana = popKanaFromCandidates(kanaField, excludeKanaList);
    if (cachedKana) {
      const parentKanaMap = { klname: 'pklname' };
      rememberKanaExclusion(kanaField, cachedKana);
      kanaAutoValueRef.current[kanaField] = cachedKana;
      kanaEditedRef.current[kanaField] = false;
      formDispatch({ type: 'SET_FIELD', name: kanaField, value: cachedKana });
      const parentKanaField = parentKanaMap[kanaField];
      if (parentKanaField && !formValuesRef.current[parentKanaField]) {
        kanaAutoValueRef.current[parentKanaField] = cachedKana;
        kanaEditedRef.current[parentKanaField] = false;
        formDispatch({ type: 'SET_FIELD', name: parentKanaField, value: cachedKana });
      }
      return;
    }
    fetchKanaForField(kanjiValue, kanaField, { isRetry: true, excludeKanaList });
  };

  // handleFieldBlur のカナ部分を処理する。戻り値: { didKanjiChangeFetch }
  const handleKanaOnFieldBlur = (name, resultValue) => {
    let didKanjiChangeFetch = false;
    const kanaFieldFromKanji = KANJI_TO_KANA_MAP[name];
    if (kanaFieldFromKanji) {
      const nextKanji = (resultValue || '').toString().trim();
      const prevKanji = (kanjiBlurValueRef.current[name] || '').toString().trim();
      const kanjiChanged = nextKanji !== prevKanji;
      kanjiBlurValueRef.current[name] = nextKanji;
      if (kanjiChanged) {
        resetKanaQueryState(kanaFieldFromKanji);
        kanaInitialFilledRef.current[kanaFieldFromKanji] = false;
        kanaEditedRef.current[kanaFieldFromKanji] = false;
        kanaAutoValueRef.current[kanaFieldFromKanji] = '';
        formDispatch({ type: 'SET_FIELD', name: kanaFieldFromKanji, value: '' });
        setKanaActionVisible(prev => ({ ...prev, [kanaFieldFromKanji]: true }));
        if (nextKanji) {
          fetchKanaForField(nextKanji, kanaFieldFromKanji, { isRetry: true, excludeKanaList: [] });
          didKanjiChangeFetch = true;
        }
      }
    }
    if (KANA_SOURCE_MAP[name]) {
      const nextVal = (resultValue || '').toString().trim();
      const autoVal = (kanaAutoValueRef.current[name] || '').toString().trim();
      if (!nextVal) {
        kanaEditedRef.current[name] = false;
        resetKanaQueryState(name);
      } else if (nextVal !== autoVal) {
        kanaEditedRef.current[name] = true;
        setKanaActionVisible(prev => ({ ...prev, [name]: false }));
      }
    }
    return { didKanjiChangeFetch };
  };

  return {
    kanaLoading,
    kanaActionVisible,
    refetchKanaForField,
    fetchKanaForField,
    handleKanaOnFieldBlur,
  };
};

export default useKanaInput;
