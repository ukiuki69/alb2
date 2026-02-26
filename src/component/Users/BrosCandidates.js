import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useSelector, useDispatch } from 'react-redux';
import { teal } from '@material-ui/core/colors';
import * as Actions from '../../Actions';
import { escapeSqlQuotes } from '../../modules/escapeSqlQuotes';

const useStyles = makeStyles({
  container: {
    position: 'relative',
    marginTop: 0,
    marginBottom: 16,
    maxWidth: '100%',
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    color: teal[700],
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  chipList: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: teal[100],
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: teal[200],
    },
  },
});

/**
 * 児発無償化ユーザーかどうかを判定する
 * - users[x].addiction に '児童発達支援無償化' が設定されている場合
 * - com.addiction['児童発達支援'] に '児童発達支援無償化自動設定' があり、かつ3〜5歳児の場合
 */
const isMusyouka = (u, com) => {
  if (u.addiction?.['児童発達支援無償化']) return true;
  const autoSet = com?.addiction?.['児童発達支援']?.['児童発達支援無償化自動設定'];
  if (autoSet && u.ageStr?.match(/^[3-5]歳児/)) return true;
  return false;
};

/**
 * /users/bros 専用の兄弟候補表示コンポーネント
 * 同姓同名の保護者を持つ利用者グループを兄弟候補として表示する
 *
 * 候補グループの条件:
 *   - 同じ pname を持つ利用者が 2 名以上
 *   - グループ内に kanri_type が「協力事業所」の利用者がいない
 *   - グループ内に priceLimit が 0 の利用者がいない（設定不可）
 *   - 児発無償化対象ユーザーを除外した上で 2 名以上残ること
 *   - 除外後のメンバーに brosIndex 未設定（0 または空）の利用者が 1 名以上、
 *     または除外後のメンバー間で pphone が異なる（電話番号違いの未統合兄弟）
 */
const BrosCandidates = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const users = useSelector(state => state.users);
  const com = useSelector(state => state.com);
  const { hid, bid, stdDate } = useSelector(state => state);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // pname でグルーピングし、除外条件を適用して候補グループを抽出
  const candidateGroups = (() => {
    const groups = {};
    users.forEach(u => {
      if (!u.pname) return;
      if (!groups[u.pname]) groups[u.pname] = [];
      groups[u.pname].push(u);
    });

    const result = [];
    Object.values(groups).forEach(group => {
      if (group.length < 2) return;
      if (group.some(u => u.kanri_type === '協力事業所')) return;
      // pricelimit が 0 のユーザがいたらグループ全体を除外
      if (group.some(u => parseInt(u.priceLimit) === 0)) return;
      // 児発無償化ユーザーを除外した上で 2 名以上 + 少なくとも 1 名 brosIndex 未設定
      const eligibleMembers = group.filter(u => !isMusyouka(u, com));
      if (eligibleMembers.length < 2) return;
      const hasUnassigned = eligibleMembers.some(u => !parseInt(u.brosIndex));
      const hasDifferentPhones = new Set(eligibleMembers.map(u => u.pphone)).size > 1;
      if (!hasUnassigned && !hasDifferentPhones) return;
      result.push(eligibleMembers);
    });
    return result;
  })();

  // 「田中 太郎・次郎」形式の表示名を生成
  const formatGroupName = (group) => {
    const lname = (group[0].name || '').split(' ')[0] || '';
    const fnames = group
      .map(u => (u.name || '').split(' ')[1] || u.name)
      .join('・');
    return lname + ' ' + fnames;
  };

  const handleConfirm = async () => {
    if (!selectedGroup || isLoading) return;
    setIsLoading(true);
    try {
      // 誕生日昇順ソート（年長 = 早い誕生日 = brosIndex: 1）
      const sorted = [...selectedGroup].sort((a, b) => {
        const da = a.birthday || '9999-99-99';
        const db = b.birthday || '9999-99-99';
        return da < db ? -1 : da > db ? 1 : 0;
      });
      const oldestPhone = sorted[0].pphone;

      for (let i = 0; i < sorted.length; i++) {
        const u = sorted[i];
        const sendData = {
          ...u,
          brosIndex: String(i + 1),
          pphone: oldestPhone,
          date: stdDate,
          hid,
          bid,
          etc: JSON.stringify(u.etc || {}),
        };
        delete sendData.users;
        await dispatch(Actions.updateUser({ ...escapeSqlQuotes(sendData), a: 'sendUserWithEtc' }));
      }

      // ストアを更新
      const updatedUsers = users.map(u => {
        const idx = sorted.findIndex(s => s.uid === u.uid);
        if (idx >= 0) {
          return { ...u, brosIndex: String(idx + 1), pphone: oldestPhone };
        }
        return u;
      });
      dispatch(Actions.setStore({ users: updatedUsers }));
      dispatch(Actions.sortUsersAsync());
    } finally {
      setIsLoading(false);
      setSelectedGroup(null);
    }
  };

  if (candidateGroups.length === 0) return null;

  const dialogName = selectedGroup ? formatGroupName(selectedGroup) : '';

  return (
    <>
      <div className={classes.container}>
        <div className={classes.title}>兄弟候補</div>
        <div className={classes.chipList}>
          {candidateGroups.map((group, i) => (
            <Chip
              key={i}
              label={formatGroupName(group)}
              className={classes.chip}
              onClick={() => setSelectedGroup(group)}
            />
          ))}
        </div>
      </div>
      <Dialog open={Boolean(selectedGroup)} onClose={() => !isLoading && setSelectedGroup(null)}>
        <DialogTitle>兄弟設定</DialogTitle>
        <DialogContent>
          {dialogName}さんを兄弟に設定します。電話番号は統一されます。
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedGroup(null)} disabled={isLoading}>
            キャンセル
          </Button>
          <Button onClick={handleConfirm} color="primary" disabled={isLoading}>
            {isLoading && <CircularProgress size={16} style={{ marginRight: 8 }} />}
            設定する
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BrosCandidates;
