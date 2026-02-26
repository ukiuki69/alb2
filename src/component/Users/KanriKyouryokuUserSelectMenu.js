import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { grey, teal } from '@material-ui/core/colors';
import { DispNameWithAttr } from './Users';

const useStyles = makeStyles((theme) => ({
  menuPaper: {
    maxHeight: 400,
    maxWidth: 400,
  },
  userMenuItem: {
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      backgroundColor: teal[50],
    },
  },
  userMenuItemSelected: {
    backgroundColor: grey[200],
    '&:hover': {
      backgroundColor: grey[200],
    },
  },
  subMenuItem: {
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    '&:hover': {
      backgroundColor: teal[50],
    },
  },
  menuItemMain: {
    fontSize: '1rem',
    fontWeight: 500,
  },
  menuItemSub: {
    fontSize: '0.75rem',
    color: teal[700],
    marginTop: 4,
  },
  userNumber: {
    minWidth: 32,
    fontSize: '0.875rem',
    fontWeight: 500,
    marginRight: 12,
    textAlign: 'center',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    '& > *:not(:last-child)': {
      marginRight: 12,
    },
  },
  userName: {
    fontSize: '1rem',
    fontWeight: 500,
  },
  userAgeStr: {
    fontSize: '0.875rem',
    color: teal[700],
  },
  emptyMessage: {
    padding: '16px',
    textAlign: 'center',
    color: '#666',
  },
}));

/**
 * 管理・協力表示用の利用者選択メニュー
 * kanri_type === '' の利用者をリストアップ
 * @param {Object} props
 * @param {Element} props.anchorEl - メニューのアンカー要素（FAB）
 * @param {boolean} props.open - メニューの開閉状態
 * @param {Function} props.onClose - メニューを閉じるハンドラー
 * @param {Function} props.onUserClick - 利用者をクリックした時のハンドラー
 */
const KanriKyouryokuUserSelectMenu = ({ anchorEl, open, onClose, onUserClick }) => {
  const classes = useStyles();
  const history = useHistory();
  const users = useSelector((state) => state.users);
  const [userAttr, setUserAttr] = useState([]);
  const [subMenuAnchorEl, setSubMenuAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // kanri_type === '' の利用者をフィルタリング
  const targetUsers = users.filter((user) => !user.kanri_type || user.kanri_type === '');

  // sindex 順にソート
  const sortedUsers = [...targetUsers].sort((a, b) => {
    return Number(a.sindex || 0) - Number(b.sindex || 0);
  });

  const handleUserClick = (event, user) => {
    event.stopPropagation();
    setSelectedUser(user);
    setSubMenuAnchorEl(event.currentTarget);
  };

  const handleSubMenuClose = () => {
    setSubMenuAnchorEl(null);
    setSelectedUser(null);
  };

  const handleUpperLimitClick = (upperLimitType) => {
    if (!selectedUser) return;
    
    const scrollVal = document.documentElement.scrollTop;
    sessionStorage.setItem("schUpperLimitNoDialogUid", selectedUser.uid);
    sessionStorage.setItem("schUpperLimitNoDialogUpperLimitType", String(upperLimitType));
    sessionStorage.setItem("schUpperLimitNoDialogScrollVal", String(scrollVal));
    sessionStorage.setItem("schUpperLimitNoDialogIdName", "userscroll322");
    sessionStorage.setItem("schUpperLimitNoDialogReferrer", window.location.href);
    
    history.push('/schedule/userUpperLimit');
    handleSubMenuClose();
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        className: classes.menuPaper,
      }}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
    >
      {sortedUsers.length === 0 ? (
        <div className={classes.emptyMessage}>
          対象となる利用者が見つかりません
        </div>
      ) : (
        sortedUsers.map((user, index) => (
          <MenuItem
            key={user.uid}
            className={`${classes.userMenuItem} ${selectedUser?.uid === user.uid ? classes.userMenuItemSelected : ''}`}
            onClick={(e) => handleUserClick(e, user)}
          >
            <span className={classes.userNumber}>{index + 1}</span>
            <div className={classes.userInfo}>
              <DispNameWithAttr {...user} userAttr={userAttr} setUserAttr={setUserAttr} />
              <span className={classes.userAgeStr}>{user.ageStr}</span>
            </div>
          </MenuItem>
        ))
      )}
      {/* サブメニュー: 管理事業所・協力事業所の登録 */}
      <Menu
        anchorEl={subMenuAnchorEl}
        open={Boolean(subMenuAnchorEl)}
        onClose={handleSubMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleUpperLimitClick(0)} className={classes.subMenuItem}>
          <div className={classes.menuItemMain}>協力事業所を登録</div>
          <div className={classes.menuItemSub}>自事業所が上限管理を行います</div>
        </MenuItem>
        <MenuItem onClick={() => handleUpperLimitClick(1)} className={classes.subMenuItem}>
          <div className={classes.menuItemMain}>管理事業所を登録</div>
          <div className={classes.menuItemSub}>他事業所が上限管理を行います</div>
        </MenuItem>
      </Menu>
    </Menu>
  );
};

export default KanriKyouryokuUserSelectMenu;

