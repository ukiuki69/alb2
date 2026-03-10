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
import { usersMenu, usersExtMenu } from './Users';

const HEADER_TOP = 95;
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
  fixedBar: {
    position: 'fixed',
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
  dialogOption: {
    marginBottom: 12,
  },
  dialogOptionLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
});

const colTh = (extra = {}) => ({
  position: 'sticky',
  top: HEADER_TOP,
  zIndex: 12,
  background: teal[50],
  padding: '6px 8px',
  textAlign: 'left',
  fontWeight: 'bold',
  fontSize: 14,
  borderBottom: `1px solid ${teal[200]}`,
  whiteSpace: 'nowrap',
  ...extra,
});

const UserRegistrationMonthEditor = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();

  const allState = useSelector(state => state);
  const { hid, bid, stdDate, users } = allState;

  const [futureUsers, setFutureUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchFutureUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await univApiCall({ a: 'fetchUsersHist', hid, bid });
      if (!res?.data?.result || !Array.isArray(res?.data?.dt)) return;

      // formatUserList でageStrなどを付加
      const formatted = formatUserList(res, stdDate);
      const dt = formatted?.data?.dt || res.data.dt;

      // 当月以降のデータのみ・現在の利用者（hno）は除外
      const currentHnoSet = new Set((users || []).map(u => u.hno));
      const seen = new Set();
      const filtered = dt.filter(u => {
        if (!u.date || u.date < stdDate) return false;
        if (currentHnoSet.has(u.hno)) return false;
        // 同じhnoは最初のレコードのみ（dateが早い順）
        if (seen.has(u.hno)) return false;
        seen.add(u.hno);
        return true;
      });

      // 50音順ソート
      filtered.sort((a, b) =>
        String(a.kana || a.name || '').localeCompare(String(b.kana || b.name || ''), 'ja')
      );

      if (isMounted.current) setFutureUsers(filtered);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [hid, bid, stdDate, users]);

  useEffect(() => {
    fetchFutureUsers();
  }, [fetchFutureUsers]);

  const handleCheck = (hno) => {
    setChecked(prev => ({ ...prev, [hno]: !prev[hno] }));
  };

  const checkedUsers = futureUsers.filter(u => checked[u.hno]);

  // mode: 'copy'（複写）| 'change'（登録変更：複写＋原本削除）
  const handleAction = async (mode) => {
    setProcessing(true);
    setConfirmOpen(false);
    const hasAutoSort = !!(allState.com?.ext?.selectedOrder?.order);
    const processedHnos = new Set(checkedUsers.map(u => u.hno));
    try {
      for (const u of checkedUsers) {
        const originalUid = u.uid;
        const originalDate = u.date;

        // 新規レコードとして当月付で登録（sindexはsendUsersIndexで後から設定）
        const sendData = { ...u };
        delete sendData.uid;
        if (sendData.etc && typeof sendData.etc === 'object') {
          sendData.etc = JSON.stringify(sendData.etc);
        }
        sendData.date = stdDate;

        const res = await univApiCall({ a: 'sendUserWithEtc', ...escapeSqlQuotes(sendData) });
        if (!res?.data?.result) throw new Error('登録に失敗しました: ' + u.hno);

        // 登録変更: 元のレコードを削除
        if (mode === 'change') {
          await univApiCall({ a: 'removeUser', hid, bid, uid: originalUid, date: originalDate });
        }
      }

      // 利用者一覧を再取得しsindexを更新
      // インラインthunkでlistUsers後にgetState()で最新usersを参照できる
      const prms = { a: 'lu', hid, bid, date: stdDate };
      const planPrms = { a: 'fetchUsersPlan', item: 'timetable', hid, bid, lastmonth: stdDate.slice(0, 7) };
      await dispatch(async (dispatch, getState) => {
        await dispatch(Actions.listUsers(prms, planPrms));

        if (hasAutoSort) {
          dispatch(Actions.sortUsersAsync());
        } else {
          // 新規登録ユーザーを末尾にしてsendUsersIndexで全ユーザーのsindexを更新
          const updatedUsers = getState().users || [];
          const pi = v => parseInt(v) || 0;
          const existingUsers = updatedUsers.filter(u => !processedHnos.has(u.hno));
          const newUsers = updatedUsers.filter(u => processedHnos.has(u.hno));
          const maxSindex = existingUsers.reduce((v, e) => pi(e.sindex) > v ? pi(e.sindex) : v, 0);
          newUsers.forEach((u, i) => { u.sindex = maxSindex + 10 * (i + 1); });
          const indexset = JSON.stringify(updatedUsers.map(e => [e.uid, e.sindex]));
          await univApiCall({ hid, bid, indexset, a: 'sendUsersIndex' });
        }
      });

      // 処理済み利用者をリストから即時除外
      if (isMounted.current) {
        setFutureUsers(prev => prev.filter(u => !processedHnos.has(u.hno)));
        setChecked({});
      }
    } finally {
      if (isMounted.current) setProcessing(false);
    }
  };

  const serviceShort = (service) => {
    if (!service) return '';
    const first = service.includes(',') ? service.split(',')[0] : service;
    return shortWord(first);
  };

  return (
    <div>
      <LinksTab menu={usersMenu} extMenu={usersExtMenu} />
      <div className={classes.root}>
        <div className={classes.title}>利用者登録月変更</div>
        {loading && (
          <div className={classes.loading}>
            <CircularProgress size={24} />
            <span>利用者データを取得中...</span>
          </div>
        )}
        {!loading && futureUsers.length === 0 && (
          <div className={classes.noData}>対象となる利用者はいません。</div>
        )}
        {!loading && futureUsers.length > 0 && (
          <table className={classes.table}>
            <thead>
              <tr>
                <th className={classes.stickyThMask} style={colTh({ width: 40 })}></th>
                <th className={classes.stickyThMask} style={colTh({ width: 130 })}>受給者証番号</th>
                <th className={classes.stickyThMask} style={colTh()}>利用者名</th>
                <th className={classes.stickyThMask} style={colTh({ width: 60 })}>学齢</th>
                <th className={classes.stickyThMask} style={colTh({ width: 80 })}>サービス</th>
                <th className={classes.stickyThMask} style={colTh()}>保護者名</th>
                <th className={classes.stickyThMask} style={colTh({ width: 90 })}>登録月</th>
              </tr>
            </thead>
            <tbody>
              {futureUsers.map(u => (
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
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {u.date ? u.date.slice(0, 7) : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className={classes.fixedBar}>
        {checkedUsers.length > 0 && (
          <span className={classes.countBadge}>{checkedUsers.length}件選択中</span>
        )}
        <Button
          variant='contained'
          color='secondary'
          onClick={() => history.push('/users')}
          disabled={processing}
        >
          キャンセル
        </Button>
        <Button
          className={classes.executeButton}
          variant='contained'
          color='primary'
          disabled={checkedUsers.length === 0 || processing || loading}
          onClick={() => setConfirmOpen(true)}
        >
          登録変更
        </Button>
      </div>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>登録月の変更方法を選択</DialogTitle>
        <DialogContent>
          <div className={classes.dialogOption}>
            <div className={classes.dialogOptionLabel}>登録変更</div>
            <DialogContentText>
              登録内容に変更する必要がない場合は「登録変更」を選択してください。
              次月登録を当月に変更する場合はこちらを選択します。
              （元のレコードは削除されます）
            </DialogContentText>
          </div>
          <div className={classes.dialogOption}>
            <div className={classes.dialogOptionLabel}>複写</div>
            <DialogContentText>
              登録内容を変更する必要がある場合は「複写」を選択してください。
              遡っての過誤請求などはこちらを選択してください。
              （元のレコードは残ります）
            </DialogContentText>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>キャンセル</Button>
          <Button
            onClick={() => handleAction('copy')}
            disabled={processing}
          >
            複写
          </Button>
          <Button
            onClick={() => handleAction('change')}
            style={{ color: red[700] }}
            disabled={processing}
          >
            登録変更
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserRegistrationMonthEditor;
