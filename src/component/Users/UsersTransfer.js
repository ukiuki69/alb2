import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  Button, Checkbox, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  makeStyles,
} from '@material-ui/core';
import { teal, red } from '@material-ui/core/colors';
import { univApiCall } from '../../albCommonModule';
import { formatUserList, shortWord } from '../../commonModule';
import * as Actions from '../../Actions';
import { escapeSqlQuotes } from '../../modules/escapeSqlQuotes';
import { LinksTab } from '../common/commonParts';
import { usersMenu } from './Users';

// AppBar: 47px fixed、LinksTab: top:47 + height:48 = 95px
const HEADER_TOP = 95;
// 列ヘッダー行の高さ分下 (padding 6+6 + lineHeight ~21 + border 1 ≈ 34px)
const GROUP_TOP = HEADER_TOP + 27;

const useStyles = makeStyles({
  root: {
    padding: '120px 24px 80px',
    maxWidth: 900,
    margin: '0 auto',
  },
  title: {
    fontSize: 20,
    color: teal[800],
    marginBottom: 16,
    fontWeight: 'bold',
  },
  table: {
    width: '100%',
    // border-collapse: collapse は sticky と相性が悪いので separate を使用
    borderCollapse: 'separate',
    borderSpacing: 0,
    fontSize: 16,
    '& td': {
      padding: '6px 8px',
      borderBottom: '1px solid #eee',
      verticalAlign: 'middle',
    },
    '& tr:hover td': {
      backgroundColor: '#f5f5f5',
    },
  },
  kana: {
    fontSize: 11,
    color: '#888',
  },
  // 固定ボタンバー: officeSection の右端に合わせる、背景透過、ボーダーなし
  fixedBar: {
    position: 'fixed',
    // maxWidth 900px + padding 24px の右端に合わせる
    right: 'max(calc((100vw - 900px) / 2 + 24px), 24px)',
    bottom: 24,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    zIndex: 100,
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: 12,
    padding: '4px 12px',
    fontSize: 13,
    color: teal[800],
    fontWeight: 'bold',
  },
  executeButton: {
    '&.MuiButton-contained.Mui-disabled': {
      opacity: 1,
      color: '#fff',
      backgroundColor: '#9e9e9e',
    },
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 40,
  },
  noData: {
    marginTop: 40,
    color: '#888',
  },
  stickyThMask: {
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      top: -12,
      height: 12,
      backgroundColor: '#fff',
      pointerEvents: 'none',

    },
  },
});

// 列ヘッダーのインラインスタイル（inline styleで確実に背景不透過を保証）
const colTh = (extra = {}) => ({
  position: 'sticky',
  top: HEADER_TOP,
  zIndex: 12,
  background: teal[50],   // backgroundColorでなくbackground shorthandを使用
  padding: '6px 8px',
  textAlign: 'left',
  fontWeight: 'bold',
  fontSize: 14,
  borderBottom: `1px solid ${teal[200]}`,
  whiteSpace: 'nowrap',
  ...extra,
});

// グループヘッダー(tbody内td)のインラインスタイル
const groupTd = {
  position: 'sticky',
  top: GROUP_TOP,
  zIndex: 11,
  background: teal[100],  // background shorthandで不透過保証
  padding: '8px',
  fontWeight: 'bold',
  fontSize: 14,
  color: teal[800],
  borderBottom: `2px solid ${teal[300]}`,
};

const UsersTransfer = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();

  const allState = useSelector(state => state);
  const { hid, bid, stdDate, accountLst, users } = allState;
  const accountState = Array.isArray(allState.account)
    ? allState.account
    : (Array.isArray(accountLst) ? accountLst : []);

  const [otherOfficeUsers, setOtherOfficeUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // bid → sbname のマップ
  const sbnameMap = {};
  (accountLst || []).forEach(e => { sbnameMap[e.bid] = e.sbname; });

  const fetchOtherOfficeUsers = useCallback(async () => {
    const targetAccounts = (accountLst || []).filter(
      e => e.hid === hid && e.bid !== bid
    );
    if (!targetAccounts.length) return;

    setLoading(true);
    try {
      const results = await Promise.all(
        targetAccounts.map(async (acc) => {
          const res = await univApiCall({ a: 'lu', hid: acc.hid, bid: acc.bid, date: stdDate });
          if (!res?.data?.result || !Array.isArray(res?.data?.dt)) return [];
          const formatted = formatUserList(res, stdDate);
          return (formatted?.data?.dt || []).map(u => ({ ...u, _fromBid: acc.bid }));
        })
      );

      const currentHnoSet = new Set((users || []).map(u => u.hno));
      const seenHno = new Set();
      const filtered = results.flat().filter(u => {
        if (!u.hno) return false;
        if (currentHnoSet.has(u.hno)) return false;
        if (seenHno.has(u.hno)) return false;
        seenHno.add(u.hno);
        return true;
      });

      // bid 単位で50音順
      filtered.sort((a, b) => {
        const bidCmp = String(a._fromBid).localeCompare(String(b._fromBid));
        if (bidCmp !== 0) return bidCmp;
        return String(a.kana || a.name || '').localeCompare(String(b.kana || b.name || ''), 'ja');
      });

      if (isMounted.current) setOtherOfficeUsers(filtered);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [hid, bid, stdDate, accountLst, users]);

  useEffect(() => {
    fetchOtherOfficeUsers();
  }, [fetchOtherOfficeUsers]);

  const handleCheck = (hno) => {
    setChecked(prev => ({ ...prev, [hno]: !prev[hno] }));
  };

  const checkedUsers = otherOfficeUsers.filter(u => checked[u.hno]);

  const handleTransfer = async () => {
    setTransferring(true);
    setConfirmOpen(false);
    const hasAutoSort = !!(allState.com?.ext?.selectedOrder?.order);
    const pi = v => parseInt(v) || 0;
    const currentSindexMax = (users || []).reduce((v, e) => pi(e.sindex) > v ? pi(e.sindex) : v, 0);
    try {
      for (let i = 0; i < checkedUsers.length; i++) {
        const u = checkedUsers[i];
        // 他事業所データをカレントbidへの新規登録として準備
        const sendData = { ...u };
        // bid をカレント事業所に変更（新規登録）
        sendData.bid = bid;
        // 新規レコードなので uid は送信しない
        delete sendData.uid;
        // 不要フィールドの削除
        if (sendData.etc && typeof sendData.etc === 'object') {
          const newEtc = { ...sendData.etc };
          delete newEtc['管理事業所'];
          delete newEtc['協力事業所'];
          sendData.etc = JSON.stringify(newEtc);
        }
        sendData.classroom = '';
        sendData.kanri_type = '';
        sendData.date = stdDate;
        delete sendData._fromBid;
        // ソート設定がない場合は sindex を末尾（最大値+10刻み）に設定
        if (!hasAutoSort) {
          sendData.sindex = currentSindexMax + 10 * (i + 1);
        }
        // 送信: univApiCall を使用（dispatch(Actions.updateUser) は使わない）
        const res = await univApiCall({ a: 'sendUserWithEtc', ...escapeSqlQuotes(sendData) });
        if (!res?.data?.result) throw new Error('コピーに失敗しました: ' + u.hno);
      }
      // 送信完了後: Actions.listUsers でDBから最新の users を取得
      const prms = { a: 'lu', hid, bid, date: stdDate };
      const planPrms = { a: 'fetchUsersPlan', item: 'timetable', hid, bid, lastmonth: stdDate.slice(0, 7) };
      await dispatch(Actions.listUsers(prms, planPrms));
      // ソート設定がある場合はソートを適用してDBに保存
      if (hasAutoSort) {
        dispatch(Actions.sortUsersAsync());
      }
      if (isMounted.current) history.push('/users');
    } finally {
      if (isMounted.current) setTransferring(false);
    }
  };

  // bid ごとにグループ化（順序保持）
  const bidOrder = [];
  const grouped = {};
  otherOfficeUsers.forEach(u => {
    if (!grouped[u._fromBid]) {
      grouped[u._fromBid] = [];
      bidOrder.push(u._fromBid);
    }
    grouped[u._fromBid].push(u);
  });

  const serviceShort = (service) => {
    if (!service) return '';
    const first = service.includes(',') ? service.split(',')[0] : service;
    return shortWord(first);
  };

  const sameHidAccounts = accountState.filter(acc => acc.hid === hid);
  const isNoDisplayOnly =
    accountState.length === 1 && sameHidAccounts.length === 1;

  return (
    <div>
      <LinksTab menu={usersMenu} />
      <div className={classes.root}>
        <div className={classes.title}>他事業所への利用者コピー
        </div>
        {isNoDisplayOnly ? (
          <div className={classes.noData}>表示するデータがありません</div>
        ) : (
          <>
            {loading && (
              <div className={classes.loading}>
                <CircularProgress size={24} />
                <span>他事業所のユーザーを取得中...</span>
              </div>
            )}
            {!loading && otherOfficeUsers.length === 0 && (
              <div className={classes.noData}>コピー可能なユーザーはいません。</div>
            )}
            {!loading && otherOfficeUsers.length > 0 && (
              <table className={classes.table}>
                <thead>
                  <tr>
                    <th className={classes.stickyThMask} style={colTh({ width: 40 })}></th>
                    <th className={classes.stickyThMask} style={colTh({ width: 130 })}>受給者証番号</th>
                    <th className={classes.stickyThMask} style={colTh()}>利用者名</th>
                    <th className={classes.stickyThMask} style={colTh({ width: 60 })}>学齢</th>
                    <th className={classes.stickyThMask} style={colTh({ width: 80 })}>サービス</th>
                    <th className={classes.stickyThMask} style={colTh()}>保護者名</th>
                  </tr>
                </thead>
                <tbody>
                  {bidOrder.map(fromBid => (
                    <React.Fragment key={fromBid}>
                      <tr>
                        <td colSpan={6} style={groupTd}>
                          {sbnameMap[fromBid] || fromBid}
                        </td>
                      </tr>
                      {grouped[fromBid].map(u => (
                        <tr key={u.hno}>
                          <td>
                            <Checkbox
                              size='small'
                              checked={!!checked[u.hno]}
                              onChange={() => handleCheck(u.hno)}
                            />
                          </td>
                          <td style={{ fontFamily: 'monospace' }}>{u.hno}</td>
                          <td>
                            <div>{u.name}</div>
                            <div className={classes.kana}>{u.kana}</div>
                          </td>
                          <td>{u.ageStr}</td>
                          <td>{serviceShort(u.service)}</td>
                          <td>
                            <div>{u.pname}</div>
                            <div className={classes.kana}>{u.pkana}</div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* 固定ボタンバー: officeSection右端揃え、背景透過、ボーダーなし */}
      {!isNoDisplayOnly && (
        <div className={classes.fixedBar}>
          {checkedUsers.length > 0 && (
            <span className={classes.countBadge}>{checkedUsers.length}件選択中</span>
          )}
          <Button variant='contained' color='secondary' onClick={() => history.push('/users')} disabled={transferring}>
            キャンセル
          </Button>
          <Button
            className={classes.executeButton}
            variant='contained'
            color='primary'
            disabled={checkedUsers.length === 0 || transferring || loading}
            onClick={() => setConfirmOpen(true)}
          >
            コピー実行
          </Button>
        </div>
      )}

      {!isNoDisplayOnly && (
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth='xs'>
          <DialogTitle>コピーの確認</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {checkedUsers.length}人のユーザーは当月付にてこの事業所にコピーします、よろしいですか？
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)}>キャンセル</Button>
            <Button
              onClick={handleTransfer}
              style={{ color: red[700] }}
              disabled={transferring}
            >
              コピーする
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export default UsersTransfer;
