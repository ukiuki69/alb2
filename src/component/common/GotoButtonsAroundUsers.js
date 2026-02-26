import React, { useEffect, useImperativeHandle, useState } from 'react';
import { Button, makeStyles, Menu, MenuItem } from "@material-ui/core";
import { useHistory, useLocation } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faYenSign } from '@fortawesome/free-solid-svg-icons';
import { faHandshake } from '@fortawesome/free-regular-svg-icons';
import { indigo, lime, teal } from '@material-ui/core/colors';
import { convUid } from '../../albCommonModule';
import { useDispatch, useSelector } from 'react-redux';
import { getUser } from '../../commonModule';
import { getPriorityService } from '../Billing/blMakeData';
import * as Actions from '../../Actions';


const useStyles = makeStyles({
  faIcon:{
    height: 8, marginTop: -16,
    '& .svg-inline--fa.fa-w-20': {
      marginTop: -8, width: 20,
    }
  },

  editUserRoot:{
    display: 'inline-block',
    '& .MuiButton-root': {backgroundColor: indigo[700], color:'#fff'},  
  },
  // goToUsersSch:{
  //   display: 'inline-block',
  //   // '& .MuiButton-root': {backgroundColor: lime[900], color:'#fff'},  
  // },
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
});

// 利用者別加算で利用するfrompartsがstate上のサービスに依存するためページ遷移する前に
// dispatchする必要がある
export const GotoUserAddiction = (props) => {
  const dispatch = useDispatch();
  const allState = useSelector(s=>s);
  const {service, users} = allState;
  const classes = useStyles();
  const history = useHistory();
  const {uid, onBeforeNavigate} = props;
  const user = getUser(uid, users);
  const usersSvc = getPriorityService(user.service);
  const uidn = convUid(uid).n;
  const editUserAddiction = async () => {
    let targetUid = uidn;
    
    // onBeforeNavigateが提供されている場合は実行
    if (onBeforeNavigate) {
      const e = { preventDefault: () => {} };
      const result = await onBeforeNavigate(e);
      // handleSubmitがfalseを返した場合、またはエラーが発生した場合は遷移しない
      if (result === false || !result || !result.success) {
        return;
      }
      
      // result.hnoが提供されている場合、usersからuidを取得
      if (result && result.hno) {
        const userFromHno = users.find(u => u.hno === result.hno);
        if (userFromHno) {
          targetUid = userFromHno.uid;
        }
      }
    }
    
    if (!service){
      dispatch(Actions.setStore({service: usersSvc}));
    }
    sessionStorage.setItem("byUserAddictionNoDialogUid", String(targetUid));
    history.push(`/schedule/userAddiction/`);
  }

  return (
    <Button
      className={classes.userAddiction}
      onClick={editUserAddiction}
      variant='contained'
      startIcon={
        <div className={classes.faIcon} >
          <FontAwesomeIcon icon={faYenSign} />
        </div>
      }
    >
      加算設定
    </Button>
  )

}

export const GoToUsersSchButton = (props) => {
  const classes = useStyles();
  const hist = useHistory();
  const {uid} = props;
  const uidn = convUid(uid).n;
  const newLoc = `/schedule/users/${uidn}/`;
  const handleClick = () => {
    hist.push(newLoc);
  }
  return (
    <Button
      variant='contained'
      startIcon={
        <div className={classes.faIcon} >
          <FontAwesomeIcon icon={faCalendarAlt} />
        </div>
      }
      onClick={handleClick}
    >
      利用者別予定
    </Button>

  )
}

export const GotoKanriKyouryokuButton = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const users = useSelector((state) => state.users);
  const {uid, onBeforeNavigate} = props;
  const [anchorEl, setAnchorEl] = useState(null);

  // 現在の利用者を取得
  const user = getUser(uid, users);
  const kanriType = user?.kanri_type || '';

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUpperLimitClick = async (upperLimitType) => {
    // サブメニュー選択時にonBeforeNavigateを実行
    let targetUid = uid;
    if (onBeforeNavigate) {
      const e = { preventDefault: () => {} };
      const result = await onBeforeNavigate(e);
      // handleSubmitがfalseを返した場合、またはエラーが発生した場合は遷移しない
      if (result === false || !result || !result.success) {
        return;
      }
      
      // result.hnoが提供されている場合、usersからuidを取得
      if (result && result.hno) {
        const userFromHno = users.find(u => u.hno === result.hno);
        if (userFromHno) {
          targetUid = userFromHno.uid;
        }
      }
    }
    
    const scrollVal = document.documentElement.scrollTop;
    sessionStorage.setItem("schUpperLimitNoDialogUid", String(targetUid));
    sessionStorage.setItem("schUpperLimitNoDialogUpperLimitType", String(upperLimitType));
    sessionStorage.setItem("schUpperLimitNoDialogScrollVal", String(scrollVal));
    sessionStorage.setItem("schUpperLimitNoDialogIdName", "userscroll322");
    sessionStorage.setItem("schUpperLimitNoDialogReferrer", window.location.href);
    
    history.push('/schedule/userUpperLimit');
    handleMenuClose();
  };

  // kanri_typeに応じて表示するメニューを決定
  const showKyoryoku = kanriType !== '協力事業所'; // 協力事業所以外なら協力事業所を登録を表示
  const showKanri = kanriType !== '管理事業所'; // 管理事業所以外なら管理事業所を登録を表示

  return (
    <>
      <Button
        variant='contained'
        onClick={handleMenuOpen}
        startIcon={
          <span className={classes.faIcon} >
            <FontAwesomeIcon icon={faHandshake} />
          </span>
        }
      >
        管理・協力事業所
      </Button>
      {/* サブメニュー: 管理事業所・協力事業所の登録 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {showKyoryoku && (
          <MenuItem onClick={() => handleUpperLimitClick(0)} className={classes.subMenuItem}>
            <div className={classes.menuItemMain}>協力事業所を登録</div>
            <div className={classes.menuItemSub}>自事業所が上限管理を行います</div>
          </MenuItem>
        )}
        {showKanri && (
          <MenuItem onClick={() => handleUpperLimitClick(1)} className={classes.subMenuItem}>
            <div className={classes.menuItemMain}>管理事業所を登録</div>
            <div className={classes.menuItemSub}>他事業所が上限管理を行います</div>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};