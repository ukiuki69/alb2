import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { Button, makeStyles } from '@material-ui/core';
import { teal } from '@material-ui/core/colors';
import { getFormDatas } from '../../commonModule';
import { PostalAndAddress } from '../common/StdFormParts';
import SnackMsg from '../common/SnackMsg';
import { GoBackButton, LinksTab } from '../common/commonParts';
import { usersMenu } from './Users';
import { setStore } from '../../Actions';
import { sendUser, setRecentUser } from '../../albCommonModule';

const BACK_HISTORY_PATH = "/users/belongs/";

const useStyles = makeStyles({
  usersCityAddressForm: {
    width: 400,
    margin: '120px auto', paddingLeft: 61.25,
    '& .title': {
      textAlign: 'center', fontSize: 24, color: teal[800],
      marginBottom: 16
    },
    '& .names': {
      display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
      marginBottom: 12,
      '& .nameContent': {
        margin: '4px 8px',
        '& .name': {
          fontSize: 18,
        },
        '& .sama': {
          fontSize: 14,
          marginLeft: 4
        }
      }
    },
    '& .form': {
      '& .buttons': {
        textAlign: 'end', marginTop: 24,
        '& .button': {
          width: 104,
          '&:not(:last-child)': {
            marginRight: 12
          }
        }
      }
    }
  },

});

const Buttons = (props) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const users = useSelector(state => state.users) ?? [];
  const {user, siblingUsers, setSnack} = props;

  const handleCancel = () => {
    history.push(BACK_HISTORY_PATH);
  }

  const handleSubmit = async(e) => {
    e.preventDefault();
    const formId = '#f38fht '
    const inputs = document.querySelectorAll(formId + 'input');
    const selects = document.querySelectorAll(formId + 'select');
    const formDt = getFormDatas([inputs, selects], true, true);
    console.log('formDt', formDt);

    let sendError = false;
    const sendUsers = JSON.parse(JSON.stringify([user, ...siblingUsers]));
    const newUsers = JSON.parse(JSON.stringify(users));
    for(const sendUserDt of sendUsers){
      sendUserDt.postal = formDt.postal ?? "";
      sendUserDt.city = formDt.city ?? "";
      sendUserDt.address = formDt.address ?? "";
      sendUserDt.etc = JSON.stringify(sendUserDt.etc ?? {});
      const params = {"a": "sendUserWithEtc", ...sendUserDt};
      const res = await sendUser(params, "", setSnack, '更新しました。', '更新に失敗しました。再度お試しください。');
      if(res?.data?.result){
        const newUser = newUsers.find(uDt => uDt.uid === sendUserDt.uid);
        newUser.postal = formDt.postal ?? "";
        newUser.city = formDt.city ?? "";
        newUser.address = formDt.address ?? "";
      }else{
        sendError = true;
        break;
      }
    }

    if(!sendError){
      sendUsers.forEach(uDt => setRecentUser(uDt.uid));
      dispatch(setStore({users: newUsers}));
      history.push(BACK_HISTORY_PATH);
    }
  }

  return(
    <div className='buttons'>
      <Button
        variant="contained"
        color='secondary'
        className='button'
        onClick={handleCancel}
      >
        キャンセル
      </Button>
      <Button
        variant="contained"
        color='primary'
        className='button'
        onClick={handleSubmit}
      >
        送信
      </Button>
    </div>
  )
}

const MainForm = (props) => {
  const {user, siblingUsers, setSnack} = props;

  const paProps = { defPostal: user.postal, defAddr1: user.city, defAddr2: user.address };
  const buttonsProps = {user, siblingUsers, setSnack};
  return(
    <div className='form'>
      <form id="f38fht">
        <PostalAndAddress {...paProps} />
        <Buttons {...buttonsProps} />
      </form>
    </div>
  )
}

const UserName = ({user}) => {
  const name = user.name ?? "";

  return(
    <div className='nameContent'>
      <span className='name'>{name}</span>
      <span className='sama'>さま</span>
    </div>
  )
}

export const UsersCityAddressForm = () => {
  const classes = useStyles();
  const history = useHistory();
  const {uid} = useParams();
  const [snack, setSnack] = useState({});
  const users = useSelector(state => state.users) ?? [];
  const user = users.find(uDt => uDt.uid === uid);
  if(!user){
    history.push(BACK_HISTORY_PATH);
    return null;
  }
  const siblingUsers = users.filter(uDt => {
    if(uDt.uid === uid) return false;
    if(uDt.pname !== user.pname) return false;
    if((uDt?.pphone ?? "").replace(/[^0-9]/g, '') !== (user?.pphone ?? "").replace(/[^0-9]/g, '')) return false;
    if(uDt.postal !== user.postal) return false;
    if(uDt.city !== user.city) return false;
    if(uDt.address !== user.address) return false;
    return true;
  });

  const formProps = {user, siblingUsers, setSnack};
  return(
    <>
    <LinksTab menu={usersMenu} />
    <GoBackButton posX={90} posY={0} url={BACK_HISTORY_PATH} />
    <div className={classes.usersCityAddressForm}>
      <div className='title'>利用者住所登録</div>
      <div className='names'>
        <UserName user={user} />
        {siblingUsers.map(uDt => (<UserName key={`userName${uDt.uid}`} user={uDt}/>))}
      </div>
      <MainForm {...formProps} />
    </div>
    <SnackMsg {...snack} />
    </>
  )
}