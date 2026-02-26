import React, { useState, useEffect } from 'react';
import * as comMod from '../../commonModule'
import { useDispatch, useSelector } from 'react-redux';
import * as Actions from '../../Actions';
import Button from '@material-ui/core/Button';
import { red, teal, grey, blue } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory, useParams } from 'react-router';
import { GoBackButton } from '../common/commonParts';
import { setRecentUser, univApiCall } from '../../albCommonModule';
import SnackMsg from '../common/SnackMsg';
import { BankInfoFormsParts } from '../common/BankInfoFormsParts';
import { escapeSqlQuotes } from '../../modules/escapeSqlQuotes';

const hiddenInput = 'hiddenInput';

const useStyles = makeStyles({
  userEditRoot: {
    '& .outer': {
      marginTop: 96, maxWidth: 800, paddingRight: 8,
      marginLeft: 200, 
    },
    '@media screen and (min-width: 1200px)':{
      '& .outer': {
        marginLeft: 'calc(100vw / 2 - 400px)', 
      },
    },
    '& .editTitle': {
      textAlign: 'center', color: teal[800], fontWeight: '600',
      position: 'relative', borderBottom: '1px solid ' + teal[300], 
      padding: 8, background: teal[50], 
    },
    '& form': {
      minWidth: 600, padding: 4, paddingTop: 0, 
    },
    '& .lastUpdate': {
      position: 'absolute', right: 8, top: 12, fontSize: '.8rem',
      color: blue[900], fontWeight: 400,
    },
  },
  buttonWrapper:{
    textAlign: 'right',
    '& > button': {marginLeft: 8,}
  }
})

export const UserEditBankInfo = (props) => {
  const allState = useSelector(state => state);
  const {
    hid, bid, stdDate, users, nextUsers,
  } = allState;
  const history = useHistory();
  const prms = useParams().p;
  const uids = prms.replace(/[^0-9]/g, '');
  const dispatch = useDispatch();
  const classes = useStyles();
  const locPrms = comMod.locationPrams();
  const goBack = comMod.fdp(locPrms, 'detail.goback');
  
  // uidに従ったuserの情報
  const thisUser = (uids) ? comMod.getUser(uids, users, nextUsers) : {};
  const [snack, setSnack] = useState({msg: '', severity: ''});
  
  // 口座情報用
  // nullが帰ってきたら初期値を設定
  let bi = comMod.fdp(thisUser, 'etc.bank_info', {});
  // 銀行口座項目を配列にしておく
  const bankInfoNames = [
    '口座名義人', '口座番号', '口振初回', '店舗番号', 
    '金融機関番号', '預金種目', '顧客コード',
  ]
  // 銀行口座項目ステイトに書き込む初期値
  const biIni = {};
  bankInfoNames.forEach(e => {biIni[e] = ''});
  const bankInfo = (!Object.keys(bi).length || !bi) ? biIni : bi;
  
  // ユーザーステイト日付から年月を示す文字列を得る
  const lastUpdate = !thisUser.date ? ''
    : thisUser.date.slice(0, 4) + '年' + thisUser.date.slice(5, 7) + '月'
  
  const formId = '#bankInfoForm';
  
  // キーボード制御
  const keyHandler = (e) => {
    if (e.which === 13 && e.shiftKey && e.ctrlKey) {
      cancelSubmit();
    }
    else if (e.which === 13 && e.shiftKey) {
      const forBlur = document.querySelector(`#${hiddenInput}`);
      forBlur.focus();
      e.persist();
      setTimeout(() => {
        handleSubmit(e);
      }, 100);
    }
  }
  
  const handleSubmit = async (e, deleteBankInfo = false) => {
    e.preventDefault();
    
    // 値が必要なエレメント
    const inputs = document.querySelectorAll(formId + ' input');
    const selects = document.querySelectorAll(formId + ' select');
    // エラーメッセージ用のノード
    const errMsgDisp = document.querySelector(formId + ' .errMsg span');
    // エラーメッセージをリセット
    errMsgDisp.textContent = '';
    
    // フォームの値を取得
    const formDatas = comMod.getFormDatas([inputs, selects], true, true);
    
    // 口座情報項目の必須チェック（削除の場合は不要）
    if (!deleteBankInfo) {
      const notFilled = comMod.checkRequireFilled([inputs, selects]);
      if (notFilled.length) {
        const msg = `必要な項目が入力されていません。`;
        errMsgDisp.textContent = msg;
        setSnack({
          msg: '必須項目を入力してください', 
          severity: 'warning',
          id: new Date().getTime()
        });
        return { success: false, errMsg: msg };
      }
    }
    
    // ユーザーデータを準備
    const userDatas = {...thisUser};
    userDatas.etc = userDatas.etc ? userDatas.etc : {};
    userDatas.hid = hid;
    userDatas.bid = bid;
    userDatas.stdDate = stdDate;
    userDatas.date = stdDate;
    
    // 削除が指定された場合は口座情報を削除
    if (deleteBankInfo) {
      if (userDatas.etc.bank_info) {
        delete userDatas.etc.bank_info;
      }
      bankInfoNames.forEach(e => {
        delete userDatas[e];
      });
    } else {
      // 口座情報をetc配下に設定
      if (!userDatas.etc.bank_info || Array.isArray(userDatas.etc.bank_info)) {
        userDatas.etc.bank_info = {};
      }
      bankInfoNames.forEach(e => {
        if (formDatas[e]) {
          userDatas.etc.bank_info[e] = formDatas[e];
        }
      });
    }
    
    // storeの更新用にusers配列を追加
    userDatas.users = users;
    const newUserData = {...thisUser, ...userDatas};
    
    // ストアの更新
    dispatch(Actions.editUser({...newUserData}));
    
    // サーバーに送信するデータを準備
    const sendUserDt = {...newUserData};
    delete sendUserDt.users;
    sendUserDt.etc = JSON.stringify(sendUserDt.etc);
    
    // SQLインジェクション対策：シングルクォートをエスケープ
    const escapedSendUserDt = escapeSqlQuotes(sendUserDt);
    
    let result = null;
    try {
      result = await dispatch(Actions.updateUser({
        ...escapedSendUserDt, 
        a: 'sendUserWithEtc'
      }));
      dispatch(Actions.sortUsersAsync());
      
      setSnack({
        msg: deleteBankInfo ? '口座情報を削除しました' : '口座情報を保存しました', 
        severity: 'success',
        id: new Date().getTime()
      });
    } catch(e) {
      console.log(e);
      setSnack({
        msg: '保存に失敗しました', 
        severity: 'error',
        id: new Date().getTime()
      });
      return { success: false, error: e };
    }
    
    setRecentUser(uids);
    
    // 画面遷移
    if (goBack) {
      history.push(goBack)
    }
    
    if (!result || !result.data || !result.data.result) {
      return { success: false };
    }
    return { success: true };
  }
  
  const cancelSubmit = () => {
    if (goBack) {
      history.push(goBack);
    } else {
      history.goBack();
    }
  }
  
  const lastUpdateStr = lastUpdate ? '最終更新: ' + lastUpdate : '';
  const lustUpdateIsThisMaonthStyle = (thisUser.date === stdDate) ?
    {color: grey[600]} : {};
  
  const errMsgStyle = {
    color: red[700], padding: 8, paddingLeft: 16, lineHight: 1.6,
    textAlign: 'justify',
  };
  const errMsgSpanStyle = {lineHight: 1.6, fontSize: '.95rem',}
  
  // 口座情報が存在するかチェック
  const hasBankInfo = bi && Object.keys(bi).length > 1;
  
  return (<>
    <div className={classes.userEditRoot}>
      <div className='outer'>
        <GoBackButton posX={80} posY={16} url={goBack}/>
        <div className='editTitle'>
          口座情報編集
          <div className='lastUpdate' style={lustUpdateIsThisMaonthStyle}>
            {lastUpdateStr}
          </div>
        </div>
        <form 
          id="bankInfoForm" 
          autoComplete="off"
          onKeyPress={(e) => keyHandler(e)}
          style={{paddingTop: 8}}
        >
          <div className='cntRow' style={{display: 'flex', padding: '0 8px'}}>
            <BankInfoFormsParts bankInfo={bankInfo} thisUser={thisUser} />
          </div>
          
          <div style={{height: 320}}></div>
          
          <div className='errMsg' style={errMsgStyle}>
            <span style={errMsgSpanStyle}></span>
          </div>
        </form>
        
        <div className={classes.buttonWrapper}>
          {hasBankInfo && (
            <Button 
              variant="contained"
              onClick={(e) => handleSubmit(e, true)}
              style={{
                backgroundColor: red[800], 
                color: '#fff',
                '&:hover': {backgroundColor: red[700]}
              }}
            >
              口座情報を削除して保存
            </Button>
          )}
          <Button
            variant="contained"
            color='secondary'
            onClick={() => cancelSubmit()}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            color='primary'
            type="submit"
            onClick={handleSubmit}
          >
            保存
          </Button>
          <button id={hiddenInput} style={{
            tabindex: '-1', width: 0, opacity: 0, marginInlineStart: 0,
          }}></button>
        </div>
      </div>
    </div>
    <SnackMsg {...snack} />
  </>)
}

export default UserEditBankInfo;
