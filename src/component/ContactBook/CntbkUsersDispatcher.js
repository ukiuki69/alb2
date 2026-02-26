import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import * as Actions from '../../Actions';

const CntbkUsersDispatcher = ({originUsers, id=""}) => {
  const dispatch = useDispatch();
  useEffect(()=>{
    return () =>{
      setTimeout(()=>{
        const closed = !document.querySelector(`#userDispatcher${id}`);
        if (closed){
          dispatch(Actions.setStore({users: originUsers}));
        }
      }, 100)
    }
  }, [originUsers])
  return (
    <div id={`userDispatcher${id}`} style={{display: 'none'}}></div>
  )
}
export default CntbkUsersDispatcher