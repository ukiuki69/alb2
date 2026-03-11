import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button,
} from '@material-ui/core';
import { blue, grey } from '@material-ui/core/colors';
import { univApiCall } from '../../albCommonModule';
import { userDiff } from './utils/userDiff';

// 表示する最大件数（+1件は差分計算用に取得するが表示しない）
const MAX_ITEMS = 7;

// フィールドキー → 表示ラベルのマッピング（null は非表示）
const FIELD_LABEL = {
  date: null,
  sindex: null,
  faptoken: 'LINE認証番号',
  uid: null,
  bid: null,
  hid: null,
  hno: '受給者証番号',
  type: '種別',
  service: 'サービス',
  classroom: '教室名',
  volume: '契約支給量',
  priceLimit: '上限額',
  brosIndex: '兄弟設定順番',
  name: '名前',
  kana: '名前カナ',
  scity: '支給市町村',
  scity_no: '市町村番号',
  birthday: '誕生日',
  kanri_type: '管理・協力',
  startDate: '利用開始日',
  endDate: '利用終了日',
  contractDate: '契約日',
  contractEnd: '契約終了日',
  lineNo: '契約書記入欄番号',
  postal: '郵便番号',
  city: '住所 県市区町村町名',
  address: '住所 それ以降',
  pname: '保護者名',
  pkana: '保護者名カナ',
  pmail: '保護者メール',
  pphone: '保護者電話番号',
  pphone1: '保護者電話番号サブ',
  belongs1: '所属1',
  belongs2: '所属2',
  updated_at: '更新日時',
};

// etc.bank_info で表示するキー
const BANK_INFO_SHOW_KEYS = ['口座名義人', '店舗番号', '金融機関番号'];

/**
 * 差分エントリのキーから表示ラベルと表示可否を決定する
 * @returns {{ visible: boolean, label: string }}
 */
const resolveDiffKey = (key) => {
  // etc.addiction.XXX → addictionキー名を表示
  if (key.startsWith('etc.addiction.')) {
    const subKey = key.slice('etc.addiction.'.length);
    return { visible: true, label: `加算 ${subKey}` };
  }
  // etc.bank_info.XXX → 特定キーのみ表示
  if (key.startsWith('etc.bank_info.')) {
    const subKey = key.slice('etc.bank_info.'.length);
    if (BANK_INFO_SHOW_KEYS.includes(subKey)) {
      return { visible: true, label: `口座 ${subKey}` };
    }
    return { visible: false, label: '' };
  }
  // その他の etc.XXX は非表示
  if (key.startsWith('etc.')) {
    return { visible: false, label: '' };
  }
  // トップレベルキー
  if (key in FIELD_LABEL) {
    const label = FIELD_LABEL[key];
    if (label === null) return { visible: false, label: '' };
    const hideValue = key === 'faptoken';
    return { visible: true, label, hideValue };
  }
  // 未定義キーは非表示
  return { visible: false, label: '' };
};

// 年月を `YYYY/MM` 形式に変換
const fmtYM = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `${y}/${m}`;
};

/**
 * 利用者の更新履歴を年月テキストで横並び表示するコンポーネント。
 * 最大7件を最新順で表示し、現在の stdDate を強調する。
 * クリックで前バージョンとの差分ダイアログを表示。
 */
const UserHistNav = ({ uid, stdDate }) => {
  const { hid, bid } = useSelector(state => state);
  const [allRecords, setAllRecords] = useState([]);
  const [diffDialog, setDiffDialog] = useState({ open: false, changes: [], ym: '', isFirst: false, name: '' });

  useEffect(() => {
    if (!uid || !hid || !bid) return;
    let cancelled = false;
    univApiCall({ a: 'fetchUsersHist', hid, bid, uid })
      .then(res => {
        if (cancelled) return;
        if (!res?.data?.result || !Array.isArray(res?.data?.dt)) return;
        const sorted = res.data.dt
          .filter(r => r.date)
          .slice()
          .sort((a, b) => b.date.localeCompare(a.date)); // 降順
setAllRecords(sorted);
      });
    return () => { cancelled = true; };
  }, [uid, hid, bid]);

  // 表示する7件を決定（stdDateのレコードを含む）
  const stdYM = stdDate ? stdDate.slice(0, 7) : '';
  const top8 = allRecords.slice(0, MAX_ITEMS + 1); // diff計算用に1件余分に取得
  let display7 = top8.slice(0, MAX_ITEMS);

  // stdDateのレコードが表示7件に含まれていない場合は末尾に追加
  const stdInDisplay = display7.some(r => r.date.slice(0, 7) === stdYM);
  if (!stdInDisplay) {
    const stdRecord = allRecords.find(r => r.date.slice(0, 7) === stdYM);
    if (stdRecord) {
      display7 = [...display7.slice(0, MAX_ITEMS - 1), stdRecord];
    }
  }

  const handleItemClick = (record, displayIdx) => {
    // display7は降順なので prevはdisplayIdxより大きいindex（より古い）
    // まず allRecords から前のレコードを探す
    const recordIdx = allRecords.findIndex(r => r.date === record.date);
    const prevRecord = recordIdx >= 0 && recordIdx < allRecords.length - 1
      ? allRecords[recordIdx + 1]
      : null;
    const isFirst = prevRecord === null;
    const parseEtc = (r) => {
      if (!r) return r;
      const parsed = { ...r };
      if (typeof parsed.etc === 'string') {
        try { parsed.etc = JSON.parse(parsed.etc); } catch (e) {}
      }
      return parsed;
    };
    const changes = prevRecord ? userDiff(parseEtc(prevRecord), parseEtc(record)) : [];
    setDiffDialog({
      open: true,
      changes,
      ym: record.date.slice(0, 7),
      isFirst,
      name: record.name || '',
    });
  };

  if (!uid || display7.length === 0) return null;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap', gap: 0 }}>
        {display7.map((record, idx) => {
          const ym = record.date.slice(0, 7);
          const isCurrent = ym === stdYM;
          const isLast = idx === display7.length - 1;
          return (
            <React.Fragment key={ym}>
              <span
                onClick={() => handleItemClick(record, idx)}
                style={{
                  fontSize: isCurrent ? 14 : 12,
                  fontWeight: isCurrent ? 'bold' : 'normal',
                  color: isCurrent ? blue[700] : grey[600],
                  // background: isCurrent ? blue[50] : 'transparent',
                  // border: isCurrent ? `1px solid ${blue[300]}` : '1px solid transparent',
                  // borderRadius: 4,
                  padding: '2px 5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.4,
                  display: 'inline-block',
                }}
              >
                {fmtYM(ym)}
              </span>
              {!isLast && (
                <span
                  style={{
                    fontSize: 10,
                    color: grey[400],
                    padding: '0 1px',
                    lineHeight: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    position: 'relative',
                    top: -5,
                  }}
                >
                  ◀
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <Dialog
        open={diffDialog.open}
        onClose={() => setDiffDialog(d => ({ ...d, open: false }))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <span>{diffDialog.name}</span>
          <span style={{ fontSize: '0.75em', fontWeight: 'normal' }}> さん </span>
          <span>{diffDialog.ym ? `${diffDialog.ym.slice(0, 4)}年${diffDialog.ym.slice(5, 7)}月` : ''}</span>
          <span style={{ fontSize: '0.75em', fontWeight: 'normal' }}>の変更点</span>
        </DialogTitle>
        <DialogContent>
          {(() => {
            if (diffDialog.isFirst) {
              return <div style={{ color: grey[600], fontSize: 14 }}>初回登録</div>;
            }
            const renderVal = v => (v === null || v === undefined || v === '' || (typeof v === 'string' && v.trim() === '')) ? '' : String(v);
            const visibleChanges = diffDialog.changes
              .map(entry => ({ ...entry, ...resolveDiffKey(entry.key) }))
              .filter(entry => entry.visible)
              .filter(({ prev, next }) => renderVal(prev) !== '' || renderVal(next) !== '');
            if (visibleChanges.length === 0) {
              return <div style={{ color: grey[600], fontSize: 14 }}>変更なし</div>;
            }
            return visibleChanges.map(({ key, label, hideValue, prev, next }) => (
                <div key={key} style={{ marginBottom: 8, fontSize: 14 }}>
                  <span style={{ fontWeight: 'bold', color: grey[700] }}>{label}</span>:{' '}
                  {hideValue ? (
                    <span style={{ color: blue[700] }}>
                      {!prev && next ? '新設' : '変更'}
                    </span>
                  ) : (
                    <>
                      <span style={{ color: grey[500], textDecoration: 'line-through' }}>
                        {prev === undefined || prev === null ? '(なし)' : String(prev)}
                      </span>
                      {' → '}
                      <span style={{ color: blue[800] }}>
                        {next === undefined || next === null ? '(なし)' : String(next)}
                      </span>
                    </>
                  )}
                </div>
              ));
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDiffDialog(d => ({ ...d, open: false }))}>閉じる</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserHistNav;
