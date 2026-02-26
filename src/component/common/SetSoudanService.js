import React,{useState, useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import * as Actions from '../../Actions';

// 計画相談支援・障害児相談支援の場合はserviceに値をセットする
// nullのコンポーネント
export const SetSoudanService = () => {
  const dispatch = useDispatch();
  const users = useSelector(s=>s.users);
  useEffect(()=>{
    if (!users) return;
    if (!users.length) return;
    const svcAry = users.reduce((svc, user) => {
      if (!user.service) return svc;
      svc.push(...user.service.split(','));
      return svc;
    }, []);
  
    const svcs = Array.from(new Set(svcAry));

    const isSoudanSvc = (
      svcs.length === 1 && 
      (svcs[0] === KEIKAKU_SOUDAN || svcs[0] === SYOUGAI_SOUDAN)
    )
    if (isSoudanSvc){
      dispatch(Actions.setStore({service: svcs[0]}))
    }
  }, [users]);
  return null;
}