import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector, } from 'react-redux';
import * as Actions from '../../Actions';
import { convUID, sendUserEtcMulti } from '../../commonModule';

const pi = (v) => parseInt(v);

// 非表示のコンポーネント
// ノードの消失を確認してからスケジュールの内容をusersにdispatchして送信を行う
// scheduleからdispatchを行うのでscheduleが更新されている必要がある
// 今のところetcだけの更
// store
export const SchUserDispatcher = (props) => {
  const dispatch = useDispatch();
  const {croneSch} = props;
  const allState = useSelector(state=>state);
  const {users, hid, bid, stdDate, schedule} = allState;
  const makeNewUsers = () => {
    const tUsers = [...users];
    Object.keys(croneSch).filter(e=>e.match(/^UID[0-9]/)).forEach(e=>{
      if (croneSch[e].template){
        const n = convUID(e).num;
        const i = tUsers.findIndex(e=>pi(e.uid) === n);
        if (i >= 0){
          const etc = tUsers[i].etc? tUsers[i].etc: {};
          etc.template = croneSch[e].template;
        }
      }
    });
    return tUsers;
  }
  useEffect(()=>{
    return () =>{
      setTimeout(()=>{
        const closed = !document.querySelector('#userDispatcher2125');
        const t = makeNewUsers();
        if (closed){
          dispatch(Actions.setStore({users: t}));
          const etcs = t.map(e=>({uid: e.uid, etc:e.etc}));
          const prms = {hid, bid, etcs, date: stdDate };
          sendUserEtcMulti(prms, '', dispatch, '', false)
        }
      }, 300)
    }
  }, [schedule])
  return (
    <div id='userDispatcher2125' style={{display: 'none'}}></div>
  )
}
export default SchUserDispatcher; 