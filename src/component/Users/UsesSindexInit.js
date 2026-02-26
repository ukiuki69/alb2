import React,{useState, useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Actions from '../../Actions';
import { univApiCall } from '../../albCommonModule';
import SnackMsg from '../common/SnackMsg';
import { requestUserIndexUpdate } from './UserSortDialog';
import { orange } from '@material-ui/core/colors';
// usersのsindexの異常値を検出して、異常が検出されたら初期化を行うためのものです。
// 異常が検出されたらデータベースに送信を行いリダックスのストアを更新します

// sindexの異常値。これを超えたら初期化を行う
const sindexLimit = 100000;
export const UsersSindexInit = () => {
  const allState = useSelector(s=>s);
  const {hid, bid, users} = allState;
  const dispatch = useDispatch();
  const [res, setres] = useState({data:{}});
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const [errDisp, setErrDisp] = useState(false);
  // とりあえずresの確認
  useEffect(()=>{
    // ここのuseEfectが機能していない。エラーの確認ができない状態。 
    let result = null;
    if (res?.data?.resultfalse ?? 0 > 0){
      console.log(res);
      result = false;
    }
    else if (res?.data?.resulttrue ?? 0 > 0){
      result = true;
    }
    if (result === false){
      setErrDisp(true);
    }
    if (result === true){
      setErrDisp(true);
    }
  }, [res])
  // useEffect(()=>{
  //   // dbの更新とstoreの更新
  //   const f = async (tUsers) => {
  //     // dbに送信するための配列作成
  //     const prms = {
  //       hid, bid, susers: tUsers, dispatch: null , setres
  //     };
  //     // apiをコールしてdbの更新を行う
  //     await requestUserIndexUpdate(prms);
  //     dispatch(Actions.setStore({users: tUsers}))
  //   }
  //   // 現在のsindexの最大値を求める
  //   const sindexMax = users.reduce((max, user) => Math.max(max, parseInt(user.sindex)), 0);
  //   const tUsers = users.slice();
  //   if (sindexMax > sindexLimit){
  //     let i = 100;
  //     tUsers.forEach(e => {e.sindex = i += 10});
  //     f(tUsers);
  //   }
  // },[users])
  useEffect(() => {
    let isMounted = true;  // マウント状態を追跡するフラグ
    let timerId
    const f = async (tUsers) => {
      const prms = {
        hid, bid, susers: tUsers, dispatch: null , setres
      };
      
      if (isMounted) {
        await requestUserIndexUpdate(prms);
        timerId = setTimeout(() => {
          dispatch(Actions.setStore({users: tUsers}));
        }, 500);  // 500ミリ秒遅延（必要に応じて調整）
      }
    }
  
    // 現在のsindexの最大値を求める
    const sindexMax = users.reduce((max, user) => Math.max(max, parseInt(user.sindex)), 0);
    const tUsers = users.slice();
  
    if (sindexMax > sindexLimit) {
      let i = 100;
      tUsers.forEach(e => {e.sindex = i += 10});
      f(tUsers);
    }
  
    return () => {
      isMounted = false;  // コンポーネントがアンマウントされたらフラグをfalseに
      clearTimeout(timerId)
    };
  }, [users]);
  
  const errDispStyle = {
    position: 'fixed', left: '10vw', right: '90vw', padding: 8,
    backgroundColor: orange[800], color: '#eee'
  }
  if (errDisp){
    return (
      <div style={errDispStyle}>
        並び順の正規化に失敗しました。再起動しても同じメッセージが出るときはサポートに連絡して下さい。
      </div>
    )
  }
  return null;
}