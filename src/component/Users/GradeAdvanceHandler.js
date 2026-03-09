import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, FormControlLabel, FormLabel, Radio, RadioGroup,
} from '@material-ui/core';
import { teal } from '@material-ui/core/colors';
import { getLS, setLS } from '../../modules/localStrageOprations';
import { getAge } from '../../modules/dateUtils';
import { escapeSqlQuotes } from '../../modules/escapeSqlQuotes';
import { univApiCall } from '../../albCommonModule';
import { getCookeis, getLodingStatus, parsePermission, shortWord } from '../../commonModule';
import * as Actions from '../../Actions';

const JIHATSU = '児童発達支援';
const HODEI = '放課後等デイサービス';
const LS_DONE_KEY = 'gradeAdvanceDone'; // 単一キー、値に年を含める { year, until }

// 進学時に etc.addiction から削除するキー
const ADDICTION_KEYS_TO_DELETE = ['児童発達支援無償化', '個別サポート加算１'];

const getDoneRecord = () => {
  const rec = getLS(LS_DONE_KEY); // getLS は既にJSONパース済みの値を返す
  if (!rec) return null;
  // 旧フォーマット（hid/bidなし）は無効として削除
  if (!rec.hid || !rec.bid) {
    localStorage.removeItem(LS_DONE_KEY);
    return null;
  }
  return rec;
};
const setDoneRecord = (year, until, hid, bid) =>
  setLS(LS_DONE_KEY, { year, until, hid, bid }); // setLS(setLocalStorage)がobjectを自動stringify

// ユーザーから削除されるaddictionキーを返す
const getDeletedAddictionKeys = (u) => {
  if (!u.etc?.addiction || typeof u.etc.addiction !== 'object') return [];
  return ADDICTION_KEYS_TO_DELETE.filter(key => key in u.etc.addiction);
};

// ─── メインダイアログ ─────────────────────────────────────────────────────────
const GradeAdvanceHandler = ({ targetUsers }) => {
  const dispatch = useDispatch();
  const { stdDate, users, hid, bid } = useSelector(state => state);

  const year = stdDate.slice(0, 4);

  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState({});
  const [nextNotify, setNextNotify] = useState('tomorrow');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const rec = getDoneRecord();
    // 同じ年・同じhid/bidのレコードがあれば内容を確認、違えば無視して表示
    if (rec?.year === year && rec?.hid === hid && rec?.bid === bid) {
      if (rec.until === 'never') return;
      if (rec.until && new Date(stdDate) < new Date(rec.until)) return;
    }

    const init = {};
    targetUsers.forEach(u => { init[u.uid] = true; });
    setChecked(init);
    setOpen(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedUsers = targetUsers.filter(u => checked[u.uid]);

  const handleCancel = () => {
    const d = new Date(stdDate);
    if (nextNotify === 'week') {
      d.setDate(d.getDate() + 7);
      setDoneRecord(year, d.toISOString().slice(0, 10), hid, bid);
    } else if (nextNotify === 'never') {
      setDoneRecord(year, 'never', hid, bid);
    } else {
      d.setDate(d.getDate() + 1);
      setDoneRecord(year, d.toISOString().slice(0, 10), hid, bid);
    }
    setOpen(false);
  };

  const handleExecute = async () => {
    setProcessing(true);

    const updatedUsers = users.map(u => ({ ...u }));
    let count = 0;

    for (const user of selectedUsers) {
      // serviceを変換（複数格納対応）
      const newService = user.service.split(',')
        .map(s => s.trim() === JIHATSU ? HODEI : s.trim())
        .join(',');

      // etc.multiSvcのキー名を変更
      const newEtc = { ...(user.etc || {}) };
      if (newEtc.multiSvc && typeof newEtc.multiSvc === 'object' && JIHATSU in newEtc.multiSvc) {
        const { [JIHATSU]: jihatsuData, ...rest } = newEtc.multiSvc;
        newEtc.multiSvc = { ...rest, [HODEI]: jihatsuData };
      }

      // etc.addictionから児発固有の加算キーを削除
      if (newEtc.addiction && typeof newEtc.addiction === 'object') {
        const newAddiction = { ...newEtc.addiction };
        ADDICTION_KEYS_TO_DELETE.forEach(key => { delete newAddiction[key]; });
        newEtc.addiction = newAddiction;
      }

      // ageStr等を再計算
      const ages = getAge(user.birthday, stdDate, user.etc?.ageOffset);

      const sendData = {
        ...user,
        service: newService,
        date: stdDate,
        etc: JSON.stringify(newEtc),
      };

      try {
        const res = await univApiCall({ a: 'sendUserWithEtc', ...escapeSqlQuotes(sendData) });
        if (res?.data?.result) {
          const idx = updatedUsers.findIndex(u => u.uid === user.uid);
          if (idx !== -1) {
            updatedUsers[idx] = {
              ...updatedUsers[idx],
              service: newService,
              etc: newEtc,
              ageStr: ages.flx,
              ageNdx: ages.ageNdx,
              age: ages.age,
            };
          }
          count++;
        }
      } catch (e) {
        console.error('GradeAdvance error:', e);
      }
    }

    dispatch(Actions.setStore({ users: updatedUsers }));
    dispatch(Actions.setSnackMsg(`${count}件の利用者データを変換しました`, 'success'));
    setDoneRecord(year, 'never', hid, bid);
    setProcessing(false);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog open maxWidth="sm" fullWidth>
      <DialogTitle>🌸 進学おめでとうございます</DialogTitle>
      <DialogContent>
        <p style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>
          進学した児童発達支援利用者がいます。放課後等デイサービスに切替を行いますか？
        </p>
        <div style={{
          maxHeight: 240, overflowY: 'auto',
          border: `1px solid ${teal[100]}`, borderRadius: 4, padding: '4px 0',
        }}>
          {targetUsers.map(u => {
            const deletedKeys = getDeletedAddictionKeys(u);
            const labelText = `${u.name}（${u.ageStr}）${u.service.split(',').map(s => shortWord(s.trim())).join('/')}`;
            return (
              <FormControlLabel
                key={u.uid}
                control={
                  <Checkbox
                    checked={!!checked[u.uid]}
                    onChange={() => setChecked(prev => ({ ...prev, [u.uid]: !prev[u.uid] }))}
                    size="small"
                    color="primary"
                  />
                }
                label={
                  <span style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span>{labelText}</span>
                    {deletedKeys.length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#e57373', lineHeight: 1.5 }}>
                        {deletedKeys.map((k, i) => (
                          <span key={i} style={{ display: 'block' }}>削除: {k}</span>
                        ))}
                      </span>
                    )}
                  </span>
                }
                style={{ display: 'flex', padding: '2px 8px', margin: 0 }}
              />
            );
          })}
        </div>
        <FormControl style={{ marginTop: 16 }}>
          <FormLabel style={{ fontSize: '0.8rem', marginBottom: 4 }}>「今はやらない」を押したとき</FormLabel>
          <RadioGroup value={nextNotify} onChange={e => setNextNotify(e.target.value)}>
            <FormControlLabel value="tomorrow" control={<Radio size="small" />} label="明日また教えて" />
            <FormControlLabel value="week" control={<Radio size="small" />} label="一週間後に教えて" />
            <FormControlLabel value="never" control={<Radio size="small" />} label="この表示は不要です" />
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} disabled={processing}>今はやらない</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleExecute}
          disabled={selectedUsers.length === 0 || processing}
        >
          実行（{selectedUsers.length}件）
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Gate Inner: Reduxロード完了後に条件を確認 ────────────────────────────────
const GradeAdvanceHandlerInner = () => {
  const allState = useSelector(state => state);
  if (!getLodingStatus(allState).loaded) return null;

  const { serviceItems, users, account } = allState;
  const permission = parsePermission(account)[0][0];
  if (permission < 90) return null;
  if (!Array.isArray(serviceItems) || !serviceItems.includes(JIHATSU)) return null;

  const targetUsers = (users || []).filter(u =>
    /^小./.test(u.ageStr) && u.service?.includes(JIHATSU)
  );
  if (targetUsers.length === 0) return null;

  return <GradeAdvanceHandler targetUsers={targetUsers} />;
};

// ─── Gate: cookieでstdDateを確認してからInnerをマウント ──────────────────────
const GradeAdvanceHandlerGate = () => {
  const stdDate = getCookeis('stdDate');
  if (stdDate?.slice(5) !== '04-01') return null;
  return <GradeAdvanceHandlerInner />;
};

export default GradeAdvanceHandlerGate;
