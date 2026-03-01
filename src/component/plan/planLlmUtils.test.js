import { extractLlmContent, safeParseLlmJson, applyConferenceNoteResult } from './planLlmUtils';

describe('extractLlmContent', () => {
  test('response を優先して返す', () => {
    expect(extractLlmContent({ data: { response: 'resp', content: 'cont' } })).toBe('resp');
  });

  test('response がない場合は content を返す', () => {
    expect(extractLlmContent({ data: { content: 'cont' } })).toBe('cont');
  });

  test('どちらもない場合は空文字を返す', () => {
    expect(extractLlmContent({ data: {} })).toBe('');
  });

  test('null を渡しても空文字を返す', () => {
    expect(extractLlmContent(null)).toBe('');
  });

  test('undefined を渡しても空文字を返す', () => {
    expect(extractLlmContent(undefined)).toBe('');
  });
});

describe('safeParseLlmJson', () => {
  test('正常なJSONをパースできる', () => {
    const obj = { a: 1, b: 'hello' };
    expect(safeParseLlmJson(JSON.stringify(obj))).toEqual(obj);
  });

  test('null を渡すと null を返す', () => {
    expect(safeParseLlmJson(null)).toBeNull();
  });

  test('空文字を渡すと null を返す', () => {
    expect(safeParseLlmJson('')).toBeNull();
  });

  test('string 以外を渡すと null を返す', () => {
    expect(safeParseLlmJson(123)).toBeNull();
  });

  test('修復不能なJSONは null を返す', () => {
    expect(safeParseLlmJson('{ broken json !!!')).toBeNull();
  });

  test('スマートクォートを修正してパースできる', () => {
    // \u2018 \u2019 はシングルスマートクォート
    const text = '{"key": "val\u2019ue"}';
    // パース結果が null でなければ修正が効いている
    const result = safeParseLlmJson(text);
    expect(result).not.toBeNull();
  });

  test('```json コードブロックを除去してパースできる', () => {
    const text = '```json\n{"a":1}\n```';
    expect(safeParseLlmJson(text)).toEqual({ a: 1 });
  });

  test('汎用コードブロックを除去してパースできる', () => {
    const text = '```\n{"a":1}\n```';
    expect(safeParseLlmJson(text)).toEqual({ a: 1 });
  });

  test('\\r\\n を \\n に正規化してパースできる', () => {
    const text = '{"a":1,\r\n"b":2}';
    expect(safeParseLlmJson(text)).toEqual({ a: 1, b: 2 });
  });
});

describe('applyConferenceNoteResult', () => {
  test('議事録・修正・課題を setInputs に反映する', () => {
    const obj = { '議事録': 'note', '修正': 'fix', '課題': 'issue' };
    const setInputs = jest.fn(fn => fn({}));
    applyConferenceNoteResult(obj, setInputs);
    expect(setInputs).toHaveBeenCalledTimes(1);
    const result = setInputs.mock.calls[0][0]({});
    expect(result).toEqual({ '議事録': 'note', '修正': 'fix', '課題': 'issue' });
  });

  test('フィールドが undefined のとき空文字にフォールバックする', () => {
    const obj = {};
    const setInputs = jest.fn(fn => fn({}));
    applyConferenceNoteResult(obj, setInputs);
    const result = setInputs.mock.calls[0][0]({});
    expect(result['議事録']).toBe('');
    expect(result['修正']).toBe('');
    expect(result['課題']).toBe('');
  });

  test('既存の他フィールドを保持する', () => {
    const obj = { '議事録': 'new' };
    const setInputs = jest.fn(fn => fn({ otherField: 'keep', '課題': 'old' }));
    applyConferenceNoteResult(obj, setInputs);
    const result = setInputs.mock.calls[0][0]({ otherField: 'keep', '課題': 'old' });
    expect(result.otherField).toBe('keep');
    expect(result['議事録']).toBe('new');
    expect(result['課題']).toBe('');
  });
});
