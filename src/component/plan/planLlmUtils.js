export const extractLlmContent = (res) => {
  if (res?.data?.response) return res.data.response;
  if (res?.data?.content) return res.data.content;
  return '';
};

export const safeParseLlmJson = (text) => {
  if (!text || typeof text !== 'string') return null;
  try { return JSON.parse(text); } catch (_) {}
  let fixed = text;
  fixed = fixed.replace(/[\u2018\u2019]/g, "'");
  fixed = fixed.replace(/(\":\s*\")(.*?)'(?=\s*[\},])/g, '$1$2"');
  fixed = fixed.replace(/```json[\s\S]*?```/g, (m) => m.replace(/```json|```/g, ''));
  fixed = fixed.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''));
  fixed = fixed.replace(/\r\n|\r/g, '\n');
  try { return JSON.parse(fixed); } catch (_) { return null; }
};

export const applyConferenceNoteResult = (obj, setInputs) => {
  setInputs(prev => ({
    ...prev,
    '議事録': obj['議事録'] || '',
    '修正': obj['修正'] || '',
    '課題': obj['課題'] || '',
  }));
};
