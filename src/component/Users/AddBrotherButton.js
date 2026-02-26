import React from 'react';
import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
import { useDispatch, useSelector } from 'react-redux';
import * as Actions from '../../Actions';
import * as comMod from '../../commonModule';

// 兄弟追加ボタンコンポーネント
export const AddBrotherButton = (props) => {
  const { 
    thisUser, handleSubmit, hnoList, brosIndex, setBrosIndex,
    history, setSnack, editOn,
    kanriChk, // 上限管理されているかどうか
  } = props;
  const dispatch = useDispatch();
  const users = useSelector(state => state.users);
  
  // hnoListから最小の欠番を取得する関数
  const getMinAvailableHno = () => {
    if (!hnoList || hnoList === false) return null;
    // hnoListは文字列の配列（例: ['001', '002', '005']）
    // 1から999までをループして、最小の欠番を見つける
    for (let i = 1; i <= 999; i++) {
      const hno = comMod.zp(i, 3); // 3桁の0埋め
      if (!hnoList.includes(hno)) {
        return hno;
      }
    }
    return null;
  };
  
  const handleAddBrother = async (e) => {
    e.preventDefault();
    
    // 編集モードでない場合はボタンを表示しない（新規ユーザーの場合は追加できない）
    if (!editOn) {
      return;
    }
    // brosIndexが数値でない場合は0として扱う
    const currentBrosIndex = parseInt(brosIndex) || 1;
    
    // brosIndexが0の場合はsetBrosIndex(1)を実行
    if (currentBrosIndex === 0) {
      setBrosIndex(1);
    }
    
    // currentBrosIndexが0の場合はnewBrosIndexは2、それ以外は+1
    const newBrosIndex = currentBrosIndex + 1;
    
    // まず現在のユーザーを保存
    const saveCurrentResult = await handleSubmit(e, false, { 
      suppressNavigation: true, brosindex: currentBrosIndex
    });
    if (!saveCurrentResult || !saveCurrentResult.success) {
      setSnack({
        msg: '現在のユーザー情報の保存に失敗しました。',
        severity: 'warning',
        id: new Date().getTime()
      });
      return;
    }
    
    // hnoListから最小の欠番を取得
    const newHno = getMinAvailableHno();
    if (!newHno) {
      setSnack({
        msg: '利用可能な受給者証番号が見つかりませんでした。',
        severity: 'warning',
        id: new Date().getTime()
      });
      return;
    }
    
  
    // 新規ユーザーを作成するためのmodPrmsを設定
    const modPrms = {
      fname: '兄弟',
      kfname: 'きょうだい',
      brosIndex: newBrosIndex.toString(),
      hno: newHno,
      uid: '' // 新規ユーザーのためuidは空
    };
    
    // 新規ユーザーを作成（suppressNavigation: trueで遷移しない）
    const createResult = await handleSubmit(e, false, {
      modPrms: modPrms,
      suppressNavigation: true,
      brotherCreate: true,
    });
    
    if (!createResult || !createResult.success) {
      setSnack({
        msg: '兄弟ユーザーの作成に失敗しました。',
        severity: 'error',
        id: new Date().getTime()
      });
      return;
    }
    
    // uidを取得
    const newUid = createResult.uid;
    if (!newUid) {
      setSnack({
        msg: '兄弟ユーザーは作成されましたが、ユーザーIDの取得に失敗しました。',
        severity: 'warning',
        id: new Date().getTime()
      });
      // uidが取得できなくても、ユーザー一覧に戻る
      history.push('/users?goback=/users');
      return;
    }
    
    // state.usersを更新する処理
    // SET_UID_FROM_HNOが既に実行されている可能性があるが、確実に更新するために
    // hnoで検索してuidを更新する
    const currentUsers = [...users]; // コピーを作成
    const userIndex = currentUsers.findIndex(u => u.hno === newHno && (!u.uid || u.uid === ''));
    
    if (userIndex >= 0) {
      // 既存のユーザー（uidが空文字）を新しいuidで更新
      currentUsers[userIndex].uid = newUid;
      dispatch(Actions.setStore({users: currentUsers}));
      // ソートを実行
      dispatch(Actions.sortUsersAsync());
    } else {
      // 見つからない場合（既にSET_UID_FROM_HNOで更新されているか、何らかの理由で存在しない）
      // 念のため、hnoで検索して確認
      const userIndexByHno = currentUsers.findIndex(u => u.hno === newHno);
      if (userIndexByHno >= 0) {
        // uidが既に設定されている場合でも、念のため更新
        if (currentUsers[userIndexByHno].uid !== newUid) {
          currentUsers[userIndexByHno].uid = newUid;
          dispatch(Actions.setStore({users: currentUsers}));
          dispatch(Actions.sortUsersAsync());
        }
      }
    }
    
    // 新規ユーザーの編集ページに遷移
    history.push(`/users/edit${newUid}?goback=/users`);
  };
  
  // 編集モードでない場合はボタンを表示しない
  if (!editOn) {
    return null;
  }
  // if (Number(brosIndex) === 0) {
  //   return null;
  // }
  
  const button = (
    <Button
      variant="contained"
      startIcon={<SupervisorAccountIcon />}
      onClick={handleAddBrother}
      style={{ marginTop: 0, marginLeft: 8 }}
      disabled={kanriChk}
    >
      兄弟を追加
    </Button>
  );
  
  // kanriChkがtrueのときはTooltipで囲む
  if (kanriChk) {
    return (
      <Tooltip title="上限管理情報が存在するため兄弟の作成は出来ません">
        <span>{button}</span>
      </Tooltip>
    );
  }
  else {
    return button;
  }
  
  return button;
};
