import React from 'react';
import { makeStyles } from "@material-ui/core";
import { teal } from "@material-ui/core/colors";
import { useSelector } from "react-redux";

const useStyles = makeStyles({
  notJogenUsers: {
    width: 800,
    margin: '8px 16px 16px 32px',
    '& .title': {
      color: teal[800],
      marginBottom: 8
    },
    '& .discription': {
      fontSize: '0.8rem',
    },
    '& .names': {
      display: 'flex', flexWrap: 'wrap',
      '& .name': {
        margin: '16px 16px 8px 0',
        '&:hover': {
          color: teal[600], cursor: 'pointer'
        }
      }
    }
  }
})

export const NotJogenKanriUsers = ({userList, setUserList}) => {
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const filteredUserList = userList.filter(userListDt => {
    const unChekced = !userListDt.checked;
    const user = users.find(uDt => uDt.uid === userListDt.uid);
    const isKanriJigyosyo = user && user.kanri_type === "管理事業所";
    const isFirstBros = user && Number(user.brosIndex) === 1;
    return unChekced && (isKanriJigyosyo || isFirstBros)
  });

  // 全利用者がチェックされている場合は表示しない。
  if(!filteredUserList.length) return null;

  const names = filteredUserList.map(userListDt => {
    const user = users.find(uDt => uDt.uid === userListDt.uid);
    const handleClick = () => {
      setUserList(prevUserList => {
        const u = prevUserList.find(prevUserListDt => prevUserListDt.uid === userListDt.uid);
        u.checked = true;
        return [...prevUserList];
      });
    }
    return(
      <div
        key={user.uid} className='name'
        onClick={handleClick}
      >
        {user.name}
      </div>
    )
  })

  return(
    <div className={classes.notJogenUsers}>
      <div className='title'>今月利用がない児童の管理事業所上限管理</div>
      <div className='discription'>児童名をクリックすることで、今月の管理事業所上限管理対象にできます。</div>
      <div className='names'>{names}</div>
    </div>
  )
}