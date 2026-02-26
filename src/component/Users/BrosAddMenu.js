import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useSelector, useDispatch } from 'react-redux';
import { grey, teal } from '@material-ui/core/colors';
import { DispNameWithAttr } from './Users';
import * as comMod from '../../commonModule';
import { univApiCall } from '../../albCommonModule';
import { escapeSqlQuotes } from '../../modules/escapeSqlQuotes';
import * as Actions from '../../Actions';

const useStyles = makeStyles({
  menuPaper: {
    maxHeight: 400,
    maxWidth: 400,
  },
  userMenuItem: {
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    '&:hover': { backgroundColor: teal[50] },
  },
  userMenuItemSelected: {
    backgroundColor: grey[200],
    '&:hover': { backgroundColor: grey[200] },
  },
  userNumber: {
    minWidth: 32,
    fontSize: '0.875rem',
    fontWeight: 500,
    marginRight: 12,
    textAlign: 'center',
  },
  brosIndex: {
    minWidth: 28,
    fontSize: '0.875rem',
    color: teal[700],
    marginLeft: 8,
    textAlign: 'right',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
  },
  emptyMessage: {
    padding: '16px',
    textAlign: 'center',
    color: '#666',
  },
});

/**
 * /users/bros 専用の兄弟追加メニュー
 * 全利用者を表示し、クリックで「兄弟を追加」「キャンセル」サブメニューを出す
 * @param {Object} props
 * @param {Element} props.anchorEl - メニューのアンカー要素（FAB）
 * @param {boolean} props.open - メニューの開閉状態
 * @param {Function} props.onClose - メニューを閉じるハンドラー
 */
const BrosAddMenu = ({ anchorEl, open, onClose }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { hid, bid, stdDate } = useSelector(state => state);
  const users = useSelector(state => state.users);
  const [userAttr, setUserAttr] = useState([]);
  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // フィルタリングなしで全ユーザを sindex 順にソート
  const sortedUsers = [...users].sort((a, b) => Number(a.sindex || 0) - Number(b.sindex || 0));

  const handleUserClick = (event, user) => {
    event.stopPropagation();
    setSelectedUser(user);
    setSubMenuAnchorEl(event.currentTarget);
  };

  const handleSubMenuClose = () => {
    setSubMenuAnchorEl(null);
    setSelectedUser(null);
  };

  const handleAddBrother = async () => {
    if (!selectedUser || isLoading) return;
    setIsLoading(true);
    try {
      // 使用可能な受給者証番号を取得
      const hnoResult = await univApiCall({ hid, bid, a: 'fetchAllHnoFromUsers' });
      if (!hnoResult?.data?.result) return;
      const hnoList = Array.from(
        new Set(hnoResult.data.dt.map(e => e.hno).filter(e => e.length === 3))
      );

      // 最小の欠番を探す
      let newHno = null;
      for (let i = 1; i <= 999; i++) {
        const hno = comMod.zp(i, 3);
        if (!hnoList.includes(hno)) { newHno = hno; break; }
      }
      if (!newHno) return;

      const currentBrosIndex = parseInt(selectedUser.brosIndex) || 1;
      const newBrosIndex = currentBrosIndex + 1;

      // 既存ユーザーの brosIndex が 0 のとき 1 に更新する
      if (!parseInt(selectedUser.brosIndex)) {
        const updUser = {
          ...selectedUser,
          brosIndex: '1',
          date: stdDate,
          hid, bid,
          etc: JSON.stringify(selectedUser.etc || {}),
        };
        delete updUser.users;
        await dispatch(Actions.updateUser({ ...escapeSqlQuotes(updUser), a: 'sendUserWithEtc' }));
      }

      // 新規兄弟ユーザーの sindex を計算（既存最大値 + 10）
      const sindexMax = users.reduce((v, e) => Math.max(v, parseInt(e.sindex) || 0), 0);

      // 名前の分割（姓 + 「兄弟」）
      const lname = (selectedUser.name || '').split(' ')[0] || '';
      const klname = (selectedUser.kana || '').split(' ')[0] || '';

      // 新規兄弟ユーザーを作成
      const newUser = {
        ...selectedUser,
        name: lname ? lname + ' 兄弟' : '兄弟',
        kana: klname ? klname + ' きょうだい' : 'きょうだい',
        brosIndex: newBrosIndex.toString(),
        hno: newHno,
        uid: '',
        date: stdDate,
        endDate: '0000-00-00',
        sindex: sindexMax + 10,
        hid, bid,
        etc: JSON.stringify(selectedUser.etc || {}),
      };
      delete newUser.users;

      const result = await dispatch(
        Actions.updateUser({ ...escapeSqlQuotes(newUser), a: 'sendUserWithEtc' })
      );

      const newUid = result?.data?.uid;

      // ストアを更新して /users/bros の表示に反映する
      const currentUsers = users.map(u => {
        // 既存ユーザーの brosIndex を 0→1 に更新
        if (!parseInt(selectedUser.brosIndex) && u.uid === selectedUser.uid) {
          return { ...u, brosIndex: '1' };
        }
        return u;
      });
      // 新規兄弟ユーザーをストアに追加（etc はオブジェクトのまま）
      const newUserForStore = {
        ...selectedUser,
        name: lname ? lname + ' 兄弟' : '兄弟',
        kana: klname ? klname + ' きょうだい' : 'きょうだい',
        brosIndex: newBrosIndex.toString(),
        hno: newHno,
        uid: newUid || '',
        date: stdDate,
        endDate: '0000-00-00',
        sindex: sindexMax + 10,
      };
      dispatch(Actions.setStore({ users: [...currentUsers, newUserForStore] }));
      dispatch(Actions.sortUsersAsync());
    } finally {
      setIsLoading(false);
      handleSubMenuClose();
      onClose();
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{ className: classes.menuPaper }}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      {sortedUsers.length === 0 ? (
        <div className={classes.emptyMessage}>利用者が見つかりません</div>
      ) : (
        sortedUsers.map((user, index) => {
          const brosIndexDisp = parseInt(user.brosIndex) ? user.brosIndex : '-';
          return (
            <MenuItem
              key={user.uid}
              className={`${classes.userMenuItem} ${selectedUser?.uid === user.uid ? classes.userMenuItemSelected : ''}`}
              onClick={(e) => handleUserClick(e, user)}
            >
              <span className={classes.userNumber}>{index + 1}</span>
              <div className={classes.userInfo}>
                <DispNameWithAttr {...user} userAttr={userAttr} setUserAttr={setUserAttr} />
              </div>
              <span className={classes.brosIndex}>{brosIndexDisp}</span>
            </MenuItem>
          );
        })
      )}
      {/* サブメニュー: 兄弟を追加・キャンセル */}
      <Menu
        anchorEl={subMenuAnchorEl}
        open={Boolean(subMenuAnchorEl)}
        onClose={handleSubMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleAddBrother} disabled={isLoading}>
          {isLoading && <CircularProgress size={16} style={{ marginRight: 8 }} />}
          兄弟の追加
        </MenuItem>
        <MenuItem onClick={handleSubMenuClose} disabled={isLoading}>
          キャンセル
        </MenuItem>
      </Menu>
    </Menu>
  );
};

export default BrosAddMenu;
