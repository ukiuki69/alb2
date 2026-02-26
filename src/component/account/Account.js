import React, { createRef, useEffect, useState, memo, useCallback, useMemo } from 'react';
import * as mui from '../common/materialUi'
import * as Actions from '../../Actions';
import * as comMod from '../../commonModule';
import { useDispatch, useSelector, ReactReduxContext } from 'react-redux';
import { common, yellow } from '@material-ui/core/colors';
import Button from '@material-ui/core/Button';
import ButtonBase from '@material-ui/core/ButtonBase';
import axios from 'axios';
import { Block, CheckBox, DialerSip, PartyModeSharp, RepeatRounded, TrendingUp } from '@material-ui/icons';
import SnackMsg from '../common/SnackMsg';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { useHistory, useLocation, useParams } from 'react-router';
import red from '@material-ui/core/colors/red';
import blue from '@material-ui/core/colors/blue';
import teal from '@material-ui/core/colors/teal';
import indigo from '@material-ui/core/colors/indigo';
import grey from '@material-ui/core/colors/grey';
import { faWindows } from '@fortawesome/free-brands-svg-icons';
import { LoadingSpinner,LoadErr,BrowserCheck, GoBackButton } from '../common/commonParts';
import { clearRecentUsers, fetchAccountsByBid, getMinMaxOfMonnth } from '../../albCommonModule';
import { endPoint, univApiCall } from '../../modules/api';
import { fetchAll } from '../../modules/thunks';
// import {endPoint} from '../../Rev';
import * as fpc from '../common/FormPartsCommon';
import { Checkbox, IconButton } from '@material-ui/core';
import ReplayIcon from '@material-ui/icons/Replay';
import { faBullseye } from '@fortawesome/free-solid-svg-icons';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import Cookies from 'js-cookie';
import { deleteOldLocalStrageValues, getLocalStorage, setLocalStorage, setLocalStorageItemWithTimeStamp } from '../../modules/localStrageOprations';
import SchSelectMonth from '../schedule/SchSelectMonth';
import { useGetHeaderHeight } from '../common/Header';
import { getAdjustedStdDate } from './acountUtls';
import { SchInitilizer } from '../schedule/SchInitilizer';

axios.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";

export const recentHidAndBidCount = 5;
const dispShorAccountListCount = 30;
export const recentHidAndBidName = 'recentHidAndBid';
export const recentHidCount = 5;
export const recentHidName = 'recentHid';

const useStyles = makeStyles({
  newAccountForm :{
    '& .name' :{
      width: '12ch',
      margin: 8,
    },
    '& .mail' :{
      width: '25ch',
      margin: 8,
    },
    '& .buttonWrap':{
      textAlign: 'right', paddingTop: 16,
    },
  },
  accoutNoticeRoot:{
    margin: '6vh auto 0',
    width:'50%',
    maxWidth: '580px',
    minWidth: '310px',
    '& > div': {
      padding:'8px 0',
    },
    '& .main':{
      fontSize: '1.2rem',
      '& .l':{fontSize: '1.3rem', color:teal[800]},
      '& .mail':{padding:'16px 0'},
      '& .small':{fontSize: '.7rem',},
    },
    '& .detail':{
      fontSize: '1.0rem', lineHeight: 1.4,
      '& .l':{fontSize: '1.3rem', color:teal[800]},
    },
    '& .strong':{fontSize: '1.0rem',color:red[800], lineHeight: 1.6},
    '& .error':{fontSize: '1.0rem',color:red[800], lineHeight: 1.6},
  },
  resetform :{
    margin: '16px auto',
    width:'50%',
    maxWidth: '580px',
    minWidth: '310px',
    '& .MuiTextField-root': {
      width: '100%',
      maxWidth: '30ch',
      padding: '8px 0'
    },
  },
  hidden :{
    display:'none',
  },
  buttonWrapper: {
    padding: '8px 0',
    width:'60%',
    maxWidth: '580px',
    minWidth: '310px',
    margin: '0 auto',
    textAlign: 'center',
    '& .MuiButtonBase-root':{
      margin: '0 4%',
    },
  },
  mainImg:{
    width:'30%',
    maxWidth: '380px',
    minWidth: '210px',
    margin: '16px auto 0',
  },
  acDiv:{
    marginBottom: 24,
    ' & h5': {
      backgroundColor: teal[50],
      padding: 8,
      paddingLeft: 16,
      paddingTop: 12,
      borderBottom: '1px solid ' + teal[200],
      color: teal[900],
      marginBottom: 16,
      '& > div': {
        color:'#333', fontSize:'.7rem',fontWeight:'normal',lineHeight: 1.4,
      },
    },
    '& .conpWrap':{
      display: 'flex', width: '100%', margin: '0 auto',
      '& .text': {flex: 1, padding: 8,},
      '& .button': {width: 300,},
    },
    '& .accountChWrap': {
      maxWidth: 600,
      margin: '0 auto',
      '& .selectAccountRoot':{
        '& > a':{
          display: 'Block',
          padding: 8,
        },
      },
      '& .selectAccountRoot:nth-of-type(odd)':{
        backgroundColor: grey[100],
      },
    },
    "@media (max-width:500px)": {
      width: '95%',
      margin: '0 auto'
    },
  },
  selectAccountRoot: {
    padding: 4
  },
  saggestPassWd: {
    display: 'flex', justifyContent: 'center', alignItems: 'end', padding: 8,
    '& >div': {margin:'0 8px'},
    '& .small': {fontSize: '1.2rem', color: grey[700]},
    '& .pass': {fontSize: '1.6rem', fontWeight: 600, color: blue[800]},

  },
  checkBoxRoot:{
    '& .MuiCheckbox-root': {padding: 2},
  },
  accountCntRoot: {
    '& .vCenter': {display: 'flex', alignItems: 'center'},
    '& .button .MuiButtonBase-root':{width: 150},
  },
  editAccountRoot:{
    width: 580, margin: '0 auto', position: 'relative',
    '& h5': {
      backgroundColor: teal[50], padding: 8,
      paddingLeft: 16, paddingTop: 12,
      borderBottom: '1px solid ' + teal[200],
      color: teal[900], marginBottom: 16,
    },
  },
  nodata: {
    textAlign: 'center', padding: 8
  },
  accountHoge: {
    "@media (max-width:500px)": {
      width: '100% !important',
      minWidth: '0 !important',
    },
  }
});
// 既存のアカウントに対するパスワードリセットキーの付与
// パスワードリセットメールの送信リクエスト
const sendAccountKeyAndMail = async (params, setResponse, setSnack) => {
  let response;
  const id = new Date().getTime();
  try{
    // リセットキーをDBにセット
    params.a = 'resetAccountPass';
    response = await axios.post(endPoint(), comMod.uPrms(params));
    if (response.status !== 200)  throw response;
    if (!response.data) throw response;
    // メール送信のリクエスト
    params.a = 'sendAccountMail';
    params.mode = 'reset';
    response = await axios.post(endPoint(), comMod.uPrms(params));
    if ((typeof setResponse) === 'function'){
      setResponse(response);
    }
    if ((typeof setSnack) === 'function'){
      setSnack({msg: 'リセットメールを送信しました。', severity: '', id})
    }
  }
  catch(e){
    console.log(e);
    response.data = false;
    if ((typeof setResponse) === 'function'){
      setResponse(response);
    }
    if ((typeof setSnack) === 'function'){
      setSnack({
        msg: 'リセットメールを送信できませんでした。', severity: 'warning', id
      })
    }
  }
}

// 既存のアカウントに対するパスワードリセットキーの付与
// パスワードリセットメールの送信リクエスト
const sendNewAccountKeyAndMail = async (params, setResponse) => {
  let response;
  try{
    // リセットキーをDBにセット
    params.a = 'addAccount';
    response = await axios.post(endPoint(), comMod.uPrms(params));
    if (response.status !== 200)  throw response;
    if (!response.data) throw response;
    if (!response.data.result){
      // ここでのエラーはほぼメールアドレス重複
      response.duplicateMail = true;
      throw response;
    }
    // // パスワードリセットも送信追加。2022/02/16 -> やっぱだめっぽい
    // // 新規アカウントを同時に発行すると同一メール、同一パスワードの原則が崩れるため
    // const params = {a: 'updatePasswordsAll', passwd, mail, resetkey};
    // response = await axios.post(endPoint(), comMod.uPrms(params));
    // if (response.status !== 200)  throw response;
    // if (!response.data) throw response;
    // if (!response.data.result)  throw response;

    // メール送信のリクエスト
    params.a = 'sendAccountMail';
    // 既存のアカウントかどうか
    const mode = (response.data.mailCount === 0)? 'new' : 'notNew';
    params.mode = mode;
    // 空白があるとget通信できないので空白を削除する
    Object.keys(params).map(e=>{
      params[e] = params[e].replace(/\s/g, '');
    });
    response = await axios.post(endPoint(), comMod.uPrms(params));
    setResponse(response);
  }
  catch(e){
    console.log(e);
    response.data.result = false;
    setResponse(response);
  }
}
// リセットキーによるアカウントリストを取得する
const getAccountByKey = async (resetkey, setResponse) => {
  let response;
  try{
    const params = {a: 'getAccountByRestkey', resetkey};
    response = await axios.post(endPoint(), comMod.uPrms(params));
    if (response.status !== 200)  throw response;
    if (!response.data) throw response;
    if (!response.data.result)  throw response;
    console.log('getAccountByKey running.')
    setResponse(response);
  }
  catch (e) {
    console.log(e);
    response.data.result = false;
    setResponse(response);
  }
}

const sendNewPassWd = async (mail, passwd, resetkey, setResponse) => {
  let response;
  try{
    const params = {a: 'updatePasswordsAll', passwd, mail, resetkey};
    response = await axios.post(endPoint(), comMod.uPrms(params));
    if (response.status !== 200)  throw response;
    if (!response.data) throw response;
    if (!response.data.result)  throw response;
    console.log('getAccountByKey running.')
    setResponse(response);

  }
  catch(e){
    console.log(response);
    setResponse(response);
  }
}


// アカウントを新規追加する
// メールアドレスと氏名を入力する
// アカウントレコードの登録 キーの登録、メール送信のリクエストを行う
// 修正モードを追加して名前も変更
export const AddEditAccount = (props) =>{
  const {edit} = props; // 修正モード
  const classes = useStyles();
  const dispatch = useDispatch();
  const account = useSelector(state=>state.account);
  const users = useSelector(state=>state.users);
  const serviceItems = useSelector(state=>state.serviceItems);
  const controleMode = useSelector(state=>state.controleMode);
  const history = useHistory();
  const [response, setResponse] = useState({});
  // スナックバー用
  const [snackBar, setSnackBar] = useState({text: '', severity: ''});
  const saccount = useSelector(state=>state.account);
  // フォーム状態管理
  const [formStatus, setFormStatus] = useState(()=>{
    if (!edit){
      return({
        mail:{value:'', error: false, helperText: ''},
        lname:{value:'', error: false, helperText: ''},
        fname:{value:'', error: false, helperText: ''},
        service:{value:'', error: false, helperText: ''},
        classroom:{value:'', error: false, helperText: ''},
        permission:{value:'', error: false, helperText: ''},
      })
    }
    else{
      const info = controleMode.editAccount;
      if (!info){
        return {};
      }
      const permission = comMod.parsePermission(info)[0][0];
      const service = comMod.parsePermission(info)[1][0]
      ?comMod.parsePermission(info)[1][0]: '';
      const classroom = comMod.parsePermission(info)[1][1]
      ?comMod.parsePermission(info)[1][1]: '';
      return({
        mail:{value:info.mail, error: false, helperText: ''},
        lname:{value:info.lname, error: false, helperText: ''},
        fname:{value:info.fname, error: false, helperText: ''},
        service:{value:service, error: false, helperText: ''},
        classroom:{value:classroom, error: false, helperText: ''},
        permission:{value:permission, error: false, helperText: ''},
      })
    }
  });
  // スナックバーに渡す用 なんでこんなことに
  const setSnackMsg = (v) => {
    setSnackBar({...snackBar, text: v});
  }
  const setSnackSeverity = (v) => {
    setSnackBar({...snackBar, severity: v});
  }
  // classroomの設定済み配列を取得
  const classroomSet = new Set(users.map(e=>e.classroom).filter(e=>e));
  // 先頭に空白（未選択を入れて配列化
  const classrooms = Array.from(classroomSet);

  // 現在のパーミッションを取得してオプションリストを作成
  // 自分のパーミッションを上回るオプションを表示しない
  const permission = comMod.parsePermission(account)[0][0];
  const pmsOpt = comMod.PERMISSION_NAMES.filter(e=>e.value<=permission).map(e=>{
    if (permission !== 95 || e.value !== 95){
      return ({value: e.value, label: e.name});
    }
  }).filter(e=>e);
  // 現在のパーミッションをフォーム用stateにセット
  // バリデーション
  const handleBlur = (ev) => {
    const node = ev.currentTarget;
    if (node.required && !node.value){
      const t = {...formStatus};
      t[node.name].error = true;
      t[node.name].helperText = '入力必須項目です。';
      setFormStatus(t);
    }
    else if (node.name === 'mail'){
      if (!comMod.isMailAddress(node.value)){
        const t = {...formStatus};
        t[node.name].error = true;
        t[node.name].helperText = 'メールアドレスが正しくありません。';
        setFormStatus(t);
      }
      else{
        const t = {...formStatus};
        t[node.name].error = false;
        t[node.name].helperText = '';
        setFormStatus(t);  
      }
    }
    else {
      const t = {...formStatus};
      t[node.name].error = false;
      t[node.name].helperText = '';
      setFormStatus(t);
    }
  }
  // チェンジハンドラ
  const handeleChange = (ev) => {
    const node = ev.currentTarget;
    const t = {...formStatus};
    const v = node.value;
    t[node.name].value = v;
    // パーミッション定義リストからコメントを取得。ヘルパーテキストにセット
    if (node.name === 'permission'){
      const o = comMod.PERMISSION_NAMES.find(e=>e.value<=parseInt(v));
      if (o){
        t.permission.helperText = o.comment;
      }
      else{
        t.permission.helperText = '';
      }
    }
    setFormStatus(t);
  }
  const clickHandler = async () => {
    const resetkey = comMod.randomStr(30, 0);
    const hid = saccount.hid;
    const bid = saccount.bid;
    const hname = saccount.hname;
    const bname = saccount.bname;
    if (!formStatus.permission.value){
      setSnackMsg('操作権限を入力してください。');
      return false;
    }
    if (!formStatus.mail.value){
      setSnackMsg('メールアドレスを入力してください。');
      return false;
    }
    if (!formStatus.lname.value){
      setSnackMsg('名前を入力してください。');
      return false;
    }
    if (!formStatus.fname.value){
      setSnackMsg('名字を入力してください。');
      return false;
    }
    let errChk = false;
    Object.keys(formStatus).forEach(e=>{
      if (formStatus[e].error){
        errChk = true;
      }
    })
    if (errChk){
      setSnackMsg('入力エラーを確認してください。');
      return false;

    }
    const permission = 
    formStatus.permission.value + '-' + 
    formStatus.service.value + ',' + formStatus.classroom.value;
    const prms = {
      hid, bid, resetkey, hname, bname,
      mail:formStatus.mail.value, 
      lname:formStatus.lname.value, 
      fname:formStatus.fname.value, 
      permission: permission,
    };
    if (!edit){
      sendNewAccountKeyAndMail(prms, setResponse);
      setFormStatus({
        mail:{value:'', error: false, helperText: ''},
        lname:{value:'', error: false, helperText: ''},
        fname:{value:'', error: false, helperText: ''},  
        service:{value:'', error: false, helperText: ''},  
        classroom:{value:'', error: false, helperText: ''}, 
        permission:{value:permission, error: false, helperText: ''},  
      });
    }
    else{
      prms.a = 'editAccount';
      await univApiCall(prms, '', setResponse);
      dispatch(Actions.setSnackMsg(
        'アカウント変更を送信しました。',''
      ));
      history.push('/account')
    }
  }
  const cancelHandler = () => {
    if (edit){
      history.push('/account')
    }
    else{
      setFormStatus({
        mail:{value:'', error: false, helperText: ''},
        lname:{value:'', error: false, helperText: ''},
        fname:{value:'', error: false, helperText: ''},  
        service:{value:'', error: false, helperText: ''},  
        classroom:{value:'', error: false, helperText: ''},  
        permission:{value:permission, error: false, helperText: ''},  
      });
    }
  }
  const handleBack = () => {
    history.push('/account')
  }
  useEffect(()=>{
    if (edit){
      console.log('is this first rendring?');
      const tobeFocus = document.querySelector('#setFocus9983');
      if (tobeFocus) tobeFocus.focus();
    }
  }, []);
  useEffect(()=>{
    console.log('useEffect', response);
    if (response.status === 200){
      if (response.data.result){
        setSnackBar({text: '送信完了', severity: ''})
      }
      else if (response.duplicateMail){
        setSnackBar(
          {text: 'このメールアドレスは登録できません。', severity: 'warning'}
        );
      }
      else{
        setSnackBar({text: '送信エラー', severity: 'error'})
      }

    }
    else if (response.status){
      setSnackBar({text: '送信エラー', severity: 'error'})
    }
  }, [response]);
  if (edit && !controleMode.editAccount){
    return (
      <div className={classes.nodata}>
        <Button variant='contained' onClick={handleBack} >
          戻る
        </Button>
        <div style={{marginTop: 16}}>先に変更するアカウントを指定してから実行して下さい。</div>
      </div>
    )
  }
  const hiddenButtonStyle = {height:0, width:0, border: 0};
  return (<>
    {/* フォームの値にstateを使わないサンプル。エラーチェックとかのみstateを使ってる */}
    <form className={classes.newAccountForm} id = 'tynj44'>
      <button style={hiddenButtonStyle} id='setFocus9983'/>
      <div>
        <TextField className='mail' name='mail' label='mail' required 
          value={formStatus.mail.value}
          onBlur={(ev)=>{handleBlur(ev)}}
          onChange={(ev)=>handeleChange(ev)}
          error={formStatus.mail.error}
          // エディットモード時は編集不可
          disabled={edit}
          helperText={formStatus.mail.helperText}
        />
      </div>
      <div>
        <TextField className="name" label='名字' required name='lname' 
          value={formStatus.lname.value}
          onBlur={(ev)=>{handleBlur(ev)}}
          onChange={(ev)=>handeleChange(ev)}
          error={formStatus.lname.error}
          helperText={formStatus.lname.helperText}
        />
        <TextField className="name" label='名前' required name='fname' 
          value={formStatus.fname.value}
          onBlur={(ev)=>{handleBlur(ev)}}
          onChange={(ev)=>handeleChange(ev)}
          error={formStatus.fname.error}
          helperText={formStatus.fname.helperText}
        />
        <fpc.SelectGp label='操作権限' required name='permission'
          value={formStatus.permission.value}
          onChange={(ev)=>handeleChange(ev)}
          opts={pmsOpt}
          styleUse='fcLarge'
          errMsg={formStatus.permission.helperText}
        />
      </div>
      <div style={{display:'flex'}}>
        <fpc.SelectGp label='サービス限定' required name='service'
          value={formStatus.service.value}
          onChange={(ev)=>handeleChange(ev)}
          nullLabel='限定なし'
          opts={serviceItems}
          styleUse='fcLarge' size='large'
          errMsg={formStatus.service.helperText}
        />
        <div style={{marginTop:8, marginLeft: 8}}>
          <fpc.SelectGp label='単位限定' required name='classroom'
            value={formStatus.classroom.value}
            onChange={(ev)=>handeleChange(ev)}
            nullLabel='限定なし'
            opts={classrooms}
            styleUse='fcMiddle'
            errMsg={formStatus.classroom.helperText}
          />
        </div>
      </div>
      <div className='buttonWrap'>
        <Button 
          variant='contained'
          color='secondary'
          onClick={cancelHandler}
          style={{marginInlineEnd: 8}}
        >
          キャンセル
        </Button>
        <Button 
          variant='contained'
          color='primary'
          onClick={clickHandler}
        >
          送信
        </Button>
      </div>
    </form>
    <SnackMsg 
      msg={snackBar.text} severity={snackBar.severity} setmsg={setSnackMsg} 
    />
  </>)
}

// アカウントパスワードリセットのメールを送信する
export const AccountRestButton = () =>{
  const [response, setResponse] = useState({});
  // 送信メッセージ結果表示
  const [sendResult, setSendResult] = useState({result:undefined, text:''});
  // スナックバー用
  const [snackBar, setSnackBar] = useState({text: '', severity: ''});
  const setSnackMsg = (v) => {
    setSnackBar({...snackBar, text: v});
  }

  const saccount = useSelector(state=>state.account);
  const clickHandler = (e) =>{
    if (sendResult.result){
      setSnackBar({text: '送信済みです。', severity:''});
      return false;
    }
    const prms = {
      fname: saccount.fname,
      lname: saccount.lname,
      hname: saccount.hname,
      bname: saccount.bname,
      mail: saccount.mail,
      resetkey: comMod.randomStr(30, 0),
    }
    sendAccountKeyAndMail(prms, setResponse)
  }
  useEffect(()=>{
    console.log('useEffect', response);
    if (response.status === 200){
      if (response.data.result){
        setSendResult({result:true, text:'送信完了'})
        setSnackBar({text: '送信完了', severity: ''})
      }
      else{
        setSendResult({result:false, text:'送信エラー'})
        setSnackBar({text: '送信エラー', severity: 'error'})
      }
    }
    else if (response.status){
      setSendResult({result:false, text:'送信エラー'})
      setSnackBar({text: '送信エラー', severity: 'error'})
    }
  }, [response]);
  const buttonColor = (sendResult.result === undefined)? 'primary': 'default';
  return (<>
    <Button
      variant="contained"
      color={buttonColor}
      onClick={clickHandler}
    >
      {sendResult.result === undefined && 'パスワードリセット送信'}
      {sendResult.result !== undefined && sendResult.text}
    </Button>
    <SnackMsg 
      msg={snackBar.text} severity={snackBar.severity} setmsg={setSnackMsg}
    />
  </>)
}
// 強制的にログアウトしてリロードする
// リロードはuseDispatchにより自動で行われるはず
const ForthLogOut = () =>{
  const loginInfo = useSelector(state=>state.account);
  const dispatch = useDispatch();
  const classes = useStyles();
  const isLogin = Object.keys(loginInfo).length;
  // Cookieに保存されているセッション情報を削除
  Cookies.remove('hjkeg5gd8h');
  useEffect(()=>{
    if (isLogin){
      setTimeout(() => {
        dispatch(Actions.clearAcount());
      }, 3000);  
    }
  }, []);
  if (isLogin){
    return (
      <div className={classes.accoutNoticeRoot}>
        <div className='main'>
          ログアウトしています。
        </div>
      </div>
    )
  }
  else{
    return null;
  }
}

const OneOffice = memo(({ e, i, noHighlite, handleClick, recentHidAndBid, accountLstLength, permission }) => {
  // ローカルストレージに記録された事業所と法人のコードを取得。最近利用された事業所と
  // 法人のセットであれば、ハイライトの色を設定するようにした。
  const style = {};
  recentHidAndBid.forEach((item, idx) => {
    const hid = item.split(',')[0];
    const bid = item.split(',')[1];
    if (hid !== e.hid || bid !== e.bid) return false;
    if (idx === 0) style.backgroundColor = yellow[400];
    if (idx === 1) style.backgroundColor = yellow[300];
    if (idx === 2) style.backgroundColor = yellow[200];
    if (idx === 3) style.backgroundColor = yellow[100];
    if (idx === 4) style.backgroundColor = yellow[50];
  })
  // アカウントリストの長さが短い時は、ハイライト表示を行わない
  if (accountLstLength <= dispShorAccountListCount) delete style.backgroundColor;
  // ハイライトを表示を行わない。オプションが指定された場合
  if (noHighlite) delete style.backgroundColor;
  const hidbid = permission === 100 ? `${e.hid}-${e.bid}` : '';
  return (
    <div className='selectAccountRoot' key={i} style={style}>
      <ButtonBase
        component="div"
        onClick={() => handleClick(e)}
        style={{ display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer' }}
      >
        <div style={{ padding: 8 }}>
          {e.shname} {e.sbname} {e.lname} {e.fname} さん
          <span style={{ fontSize: '.7rem', color: grey[500], marginLeft: 16 }}>{hidbid}</span>
        </div>
      </ButtonBase>
    </div>
  );
});

export const ChangeAccount = () => {
  const dispatch = useDispatch();
  const accountLst = useSelector(state => state.accountLst);
  const allstate = useSelector(state => state);
  const { stdDate } = allstate;
  const weekDayDefaultSet = allstate.config.weekDayDefaultSet;
  const loadingStatus = comMod.getLodingStatus(allstate);
  const accountChanging = useSelector(state => state.accountChanging);
  const account = useSelector(state => state.account);
  const permission = comMod.parsePermission(account)[0][0];
  const [snack, setSnack] = useState({ msg: '', severity: '' })

  const handleClick = useCallback(async (selectedAccount) => {
    const { bid, hid } = selectedAccount;
    // 不必要なCookieの削除
    comMod.setCookeis('defClass', '');
    comMod.setCookeis('defService', '');

    const newStdDate = await getAdjustedStdDate({ stdDate, hid, bid, setSnack: '' });
    comMod.setCookeis('stdDate', newStdDate);
    // 不必要なstateもリセット
    dispatch(Actions.setStore({
      stdDate: comMod.formatDate(new Date().setDate(1), 'YYYY-MM-DD'),
      classroom: '',
      service: '',
      com: {},
      users: [],
      schedule: {},
      dateList: [],
    }));
    // アカウントだけ切り替わらないので単独でDispatch
    dispatch(Actions.setStore({ account: selectedAccount }));
    // これも個別に対応が必用と思われ アカウントも変更をセット
    dispatch(Actions.setStore({ bid, hid, accountChanging: true }));
    // ログイン動作のモジュールを実行
    fetchAll({ hid, bid, weekDayDefaultSet, stdDate: newStdDate, dispatch });
    // recentUserのクリア
    clearRecentUsers();
    // hidbidのセットを記録 (最新5件、重複排除)
    let recentHidAndBid = getLocalStorage(recentHidAndBidName) ?? [];
    const currentPair = `${hid},${bid}`;
    recentHidAndBid = [currentPair, ...recentHidAndBid.filter(item => item !== currentPair)];
    recentHidAndBid.splice(recentHidAndBidCount);
    setLocalStorage(recentHidAndBidName, recentHidAndBid);

    // hidのみを記録 (最新5件、重複排除)
    let recentHid = getLocalStorage(recentHidName) ?? [];
    recentHid = [hid, ...recentHid.filter(item => item !== hid)];
    recentHid.splice(recentHidCount);
    setLocalStorage(recentHidName, recentHid);
  }, [stdDate, weekDayDefaultSet, dispatch]);

  // ローディング状態を見て認証キーの入れ替えを行う
  useEffect(() => {
    const ls = loadingStatus;
    if (ls.loaded && !ls.error && accountChanging) {
      dispatch(Actions.setStore({ accountChanging: false }));
      const prms = {
        hid: account.hid,
        bid: account.bid,
        mail: account.mail,
        key: comMod.randomStr(8),
      }
      dispatch(Actions.sendNewKey(prms));
    };
  }, [loadingStatus, accountChanging, account, dispatch]);

  // アカウントリストがダブってしまうので整理
  useEffect(() => {
    // hid,bidをペアにしてユニーク
    const hidBid = new Set(accountLst.map(e => (e.hid + ',' + e.bid)));
    // 重複が認められた場合
    if (accountLst.length > Array.from(hidBid).length) {
      const newList = Array.from(hidBid).map(e => (
        accountLst.find(
          f => f.hid === e.split(',')[0] && f.bid === e.split(',')[1]
        )
      ));
      dispatch(Actions.setStore({ accountLst: newList }));
    }
  }, [accountLst, dispatch])

  const recentHidAndBid = getLocalStorage(recentHidAndBidName) ?? [];
  const recentHid = getLocalStorage(recentHidName) ?? [];
  const [filterHid, setFilterHid] = useState(null);

  // recentHid から表示用のリスト（hid と shname のペア）を作成
  const recentHidList = useMemo(() => {
    return recentHid.map(h => {
      const acc = accountLst.find(a => a.hid === h);
      return acc ? { hid: h, shname: acc.shname } : null;
    }).filter(Boolean);
  }, [recentHid, accountLst]);

  // 法人ボタンクリック時の処理
  const handleHidFilter = (hid) => {
    setFilterHid(prev => prev === hid ? null : hid);
  };

  // テスト用の法人だけ先に表示
  const sortedLst = [...accountLst].sort((a, b) => {
    if (a.hid === 'LE5MMsTF' && b.hid !== 'LE5MMsTF') return -1;
    if (a.hid !== 'LE5MMsTF' && b.hid === 'LE5MMsTF') return 1;
    return 0;
  });

  const lst = sortedLst
    .filter(e => !filterHid || e.hid === filterHid)
    .map((e, i) => {
      return (
        <OneOffice
          e={e}
          i={i}
          key={i}
          handleClick={handleClick}
          recentHidAndBid={recentHidAndBid}
          accountLstLength={accountLst.length}
          permission={permission}
        />
      )
    });

  // 直近の事業所のみ 事業所のノード配列を返す
  const short = sortedLst.map((e, i) => {
    const s = `${e.hid},${e.bid}`;
    const match = recentHidAndBid.includes(s);
    if (!match) return null;
    return (
      <OneOffice
        e={e}
        i={i}
        key={`short-${i}`}
        handleClick={handleClick}
        recentHidAndBid={recentHidAndBid}
        accountLstLength={accountLst.length}
        permission={permission}
      />
    )
  })

  return (<>
    {accountLst.length > dispShorAccountListCount && <>
      {short}
      <div style={{ height: 24 }}></div>
    </>}

    {/* 最近選択した法人の選択ボタン */}
    {recentHidList.length > 0 && accountLst.length > dispShorAccountListCount && <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0 16px' }}>
        {recentHidList.map((item) => (
          <Button
            key={item.hid}
            variant={filterHid === item.hid ? 'contained' : 'outlined'}
            color="primary"
            size="small"
            onClick={() => handleHidFilter(item.hid)}
            style={{ textTransform: 'none' }}
          >
            {item.shname}
          </Button>
        ))}
        {filterHid && (
          <Button size="small" onClick={() => setFilterHid(null)} style={{ color: grey[600] }}>
            解除
          </Button>
        )}
      </div>
      <div style={{ height: 24 }}></div>
    </>}

    {lst}
    <SnackMsg {...snack} />
  </>)
}

const SaggestPassWd = (props) => {
  const {setPasswsForms, saggest} = props;
  const [snack, setSnack] = useState({msg:'', severity: ''});
  const classes = useStyles();
  const t = {
    passwd1: {value:'', error: false, helperText: ''},
    passwd2: {value:'', error: false, helperText: ''},
  }
  const handleClick = () => {
    t.passwd1.value = saggest;
    t.passwd2.value = saggest;
    t.passwd1.helperText = '安全なパスワードです。';
    t.passwd2.helperText = 'チェックOKです。';
    comMod.toClipboard(saggest, setSnack, 'パスワードをクリップボードにコピーしました。');
    setPasswsForms(t);
  }
  return (<>
    <div className={classes.saggestPassWd}>
      <div className='small'>自動パスワード</div>
      <div className='pass'>{saggest}</div>
      <div>
        <Button
          variant='contained'
          color='primary'
          onClick={handleClick}
        >
          セットとコピー
        </Button>
      </div>
    </div>
    <SnackMsg {...snack}/>
  </>)
}

// アカウントリセットによりルーターからコールされる場面
// 単独の画面として提供されログイン状態に依存しない。
// 訂正ー>ログイン状態でも非ログイン状態でもどっちでも表示できる
// 2021/08/09
// getAccountByKeyの仕様を変えたのでこのままでは動かない。別途dateの設定が必要
// 現状、このComponentは表示されることがない。
export const ResetPassWd = () => {
  const classes = useStyles();
  const history = useHistory();
  const locationPrams = comMod.locationPrams();
  const loginInfo = useSelector(state=>state.account);
  const isLogin = Object.keys(loginInfo).length;
  const account = useSelector(state=>state.saccount);
  const dispatch = useDispatch();
  
  // アカウント情報取得用state
  const [response, setReseponse] = useState(false);
  // 送信用レスポンス
  const [sendResponse, setSendResponse] = useState(false);
  // パスワード入力フォーム用state
  const [passwdForms, setPasswsForms] = useState({
    passwd1: {value:'', error: false, helperText: ''},
    passwd2: {value:'', error: false, helperText: ''},
  });
  const [saggest, setSaggest] = useState(comMod.makePassWd(9));
  // 表示非表示を切り替えるためのクラス設定
  const [dispCont, setDispCont] = useState({
    resetform: classes.resetform, 
    notice: classes.accoutNoticeRoot,
    buttonWrapper: classes.buttonWrapper,
    mainImg: classes.mainImg,
  });
  useEffect(()=>{
    getAccountByKey(locationPrams.detail.key, setReseponse);
  }, []);
  // 送信後に発火 あと、ロード直後にログイン情報を確認する
  useEffect(()=>{
    console.log('sendResponse', sendResponse);
    let t = {...dispCont};
    // フォーム、通知エリアの表示非表示を切り替える
    if (sendResponse || isLogin) {
      t = {...t,
        resetform: classes.hidden,
        notice: classes.hidden,
        buttonWrapper: classes.hidden,
      }
    }
    else if (isLogin){
      t = {...t,
        resetform: classes.hidden,
        notice: classes.hidden,
        buttonWrapper: classes.hidden,
        mainImg: classes.hidden,
      }
    }
    setDispCont(t);
    
  }, [sendResponse])

  // 通知エリア
  const AccountNotice = () =>{
    const NotFound = () => (
      <div className={dispCont.notice}>
        <div className='strong'>
          パスワード変更にアクセスできません。変更用のリンクが無効です。
          発行から24時間以内のアクセスが必要です。
        </div>
      </div>
    );
    
    if (!comMod.findDeepPath(response, ['data', 'result'])) return null;
    if (!response.data.dt.length) return <NotFound/>;
    const thisAccount = response.data.dt[0];  // アカウントリストの最初の要素を取得
    const accountCount = response.data.dt.length;
    // アカウントが一件の場合と複数件の場合でメッセージを変える
    const chMsg = (accountCount > 1)? '更新': '登録';
    return(
      <div className={dispCont.notice}>
        <BrowserCheck/>

        <div className='main'>
          <span className='l'>{thisAccount.lname} {thisAccount.fname} </span>
          さんのパスワードを{chMsg}します。
          <div className='mail'>
            <span className='small'>メールアドレス：</span>
            <span className='l'>{thisAccount.mail}</span>
          </div>
        </div>
        {/* 更新時のみ表示 */}
        {accountCount > 1 && <>
          <div className='detail'>
            同じメールアドレスで登録されている
            <span className='l'>{response.data.dt.length}</span>
            件の事業所のアカントが変更になります。
          </div>
          <div className='detail'>
            自動ログインの情報も消去されますのでご注意下さい。
          </div>
          <div className='detail'>
            パスワードには8文字以上でお願いします。アルファベットの大文字、小文字、数字、記号をそれぞれ1文字以上使用して下さい。
          </div>
        </>}
        <div className='strong'>
          他サイトでご利用になっているパスワードの流用はお勧めしません。
          パスワード流出の原因になります。
        </div>
        <div className='strong'>
          パスワードの設定はアルファベットの大文字小文字、数字記号の全てを利用して8文字以上でお願い致します。
        </div>
      </div>
    );
  }
  const handleChange = (ev) => {
    const node = ev.currentTarget;
    const t = {...passwdForms};
    t[node.name].value = node.value;
    if (node.name === 'passwd1'){
      const rt = comMod.chkPasword(node.value);
      t.passwd1.error = (rt.result)? false: true;
      t.passwd1.helperText = rt.msg;
      t.passwd2.value = ''; // 確認用パスワード消去
    }
    // 入力相違チェック
    if (node.name === 'passwd2' && node.value !== t.passwd1.value){
      t.passwd2.error = true;
      t.passwd2.helperText = '確認用パスワードが違います。';
    }
    // 入力相違エラー解除
    if (node.name === 'passwd2' && node.value === t.passwd1.value){
      t.passwd2.error = false;
      t.passwd2.helperText = 'パスワード確認OKです。';    
    }
    setPasswsForms(t);
  }
  const handleBlur = (ev) => {
    const node = ev.currentTarget;
    const t = {...passwdForms}
    if (!node.value && node.required){
      t[node.name].helperText = '入力必須項目です。';
      t[node.name].error = true;
    }
    // 入力必須のエラーのみ解除。パスワードチェックでエラーにすることもあるので
    if (node.value && t[node.name].helperText === '入力必須項目です。'){
      t[node.name].helperText = '';
      t[node.name].error = false;
    }
    setPasswsForms(t);
  }
  const handleSubmit = () => {
    console.log('submit!');
    const mail = response.data.dt[0].mail;
    const passwd = passwdForms.passwd1.value;
    const resetkey = locationPrams.detail.key;
    // ログインしていたらログアウトする
    sendNewPassWd(mail, passwd, resetkey,setSendResponse); 
  }
  // ルーターのヒストリーを使ってapplicationのルートに飛ぶ
  // ログインしていない前提なのでログイン画面に飛ぶはず
  const handleGotoLogin = (mail) =>{
    if (mail){
      history.push(`/?mail=${mail}`);
    }
    else{
      history.push('/');
    }
  }
  const handleReload = () => {
    window.location.reload();
  }

  // 送信後の画面表示
  const AfterSubmit = (props) => {
    const {mail} = props;
    const classes = useStyles();
    const ButtonReload = () => (
      <Button
        variant='contained'
        color='secondary'
        onClick={handleReload}
      >
        再読み込み
      </Button>
    )
    const ButtonGotoLogin = () => (
      <Button
        variant='contained'
        color='primary'
        onClick={handleGotoLogin(mail)}
      >
        ログイン画面へ
      </Button>

    )
    if (!sendResponse) return null;
    if (sendResponse.status !== 200){
      return(<>
        <div className={classes.accoutNoticeRoot}>
          <div className='error'>
            送信エラーが発生しました。
          </div>
        </div>
        <div className={classes.buttonWrapper}>
          <ButtonReload />
          <ButtonGotoLogin/>
        </div>
      </>)
    }
    const resDt = sendResponse.data;
    return (
      <div>
        {resDt.result === false &&
          <div>
            <div className={classes.accoutNoticeRoot}>
              <div className='error'>
                更新エラーが発生しました。
              </div>
  1          </div>
            <div className={classes.buttonWrapper}>
              <ButtonReload />
              <ButtonGotoLogin/>
            </div>
          </div>
        }
        {(resDt.result === true && resDt.affected_rows > 0) &&
          <div className={classes.accoutNoticeRoot}>
            <div className='main'>
              {resDt.affected_rows}件のパスワードを変更しました。
            </div>
            <div className={classes.buttonWrapper}>
              <ButtonGotoLogin/>
            </div>


          </div>
        }
        {(resDt.result === true && resDt.affected_rows === 0) &&
          <div className={classes.accoutNoticeRoot}>
            <div className='error'>
              更新データが見つかりません。
            </div>
            <div className='detail'>
              変更前と変更後のパスワードが一緒だった、更新期限を過ぎてしまった、などの原因が考えられませす。
            </div>
            <div className={classes.buttonWrapper}>
              <ButtonReload />
              <ButtonGotoLogin/>
            </div>


          </div>
        }
      </div>
    )
  }
  
  // フォームにエラーがないこと、確認用パスワードが入力されていることで
  // サブミットボタンのenableとする
  const submitButtonDisable = (
    passwdForms.passwd1.error || passwdForms.passwd2.error
    || !passwdForms.passwd2.value
  )
  const loginMail = (response && response.data[0])? response.data.dt[0].mail: '';

  return(<>
    <div className={dispCont.mainImg}>
      <img src='../../img/logob.teal.svg'></img>
    </div>
    <ForthLogOut />
    <AccountNotice />
    {response.data && response.data.dt.length && <>
      <form className={dispCont.resetform} id='rrty55'>
        <SaggestPassWd setPasswsForms={setPasswsForms} saggest={saggest}/>
        <TextField
          name='passwd1'
          required type="password" autoComplete='off'
          label='パスワード'
          value={passwdForms.passwd1.value}
          onChange={ev=>handleChange(ev)}
          onBlur={ev=>handleBlur(ev)}
          error={passwdForms.passwd1.error}
          helperText={passwdForms.passwd1.helperText}
        />
        <TextField
          name='passwd2'
          required type="password" autoComplete='off'
          label='パスワード確認用'
          value={passwdForms.passwd2.value}
          onChange={ev=>handleChange(ev)}
          onBlur={ev=>handleBlur(ev)}
          error={passwdForms.passwd2.error}
          helperText={passwdForms.passwd2.helperText}
        />

      </form>
      <div className={dispCont.buttonWrapper}>
        <Button
          variant='contained'
          color='primary'
          onClick={handleSubmit}
          disabled={submitButtonDisable}
        >
          パスワード更新
        </Button>
      </div>
      <AfterSubmit mail={loginMail}/>
  
    </>}
  </>)
}

export const AccountOfMenbers = () => {
  const classes = useStyles();
  const allState = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allState);
  const history = useHistory();
  const dispatch = useDispatch();
  const {hid, bid, account, session} = allState;
  const {mail, hname, bname} = account;
  const {key } = session;
  const permission = comMod.parsePermission({...account})[0][0];
  const [menbers, setMenbers] = useState([]);
  const [res, setRes] = useState(false);
  const [func, setFunc] = useState('');
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const controleMode = useSelector(state=>state.controleMode);
  const funcs = ['パスワードリセット', 'アカウント編集', 'アカウント削除'];
  useEffect(()=>{
    let abortCtrl = new AbortController();
    const prms = {hid, bid, key, mail, permission};
    const f1 = async () => {
      await fetchAccountsByBid(prms, setRes);
    }
    const f2 = async () => {
      const filteredDt = res.data.dt.filter(e => {
        const p = comMod.parsePermission(e)[0][0];
        // 自分より低い権限レベルのみを表示（同等レベルは表示しない）
        // 自分自身（mailが一致）は後でunshiftするのでここでは除外しておく
        return p < permission && e.mail !== mail;
      }).map(e => ({ ...e, checked: false }));

      const a = { ...account, checked: false };
      filteredDt.unshift(a);
      setMenbers(filteredDt);
    }
    if (!res && loadingStatus.loaded){
      f1();
    }
    if (res && res.data && res.data.result && !menbers.length){
      f2();
    }
    return () => {
      abortCtrl.abort()
    }
  }, [res, menbers]);
  // 機能の変更。selectgpに渡す
  const funcChange = (ev) => {
    setFunc(ev.currentTarget.value);
  }
  const handeleCbChange = (ev, i) => {
    const t = [...menbers];
    // 一旦チェックをすべて外す
    t.forEach(e=>{e.checked = false})
    const checked = ev.currentTarget.checked;
    t[parseInt(i)].checked = checked;
    setMenbers(t);
  }
  const chkBoxStyle = {padding: '6px 4px'};
  const eachMenber = menbers.map((e, i)=>{
    const permissionName = comMod.getPermissionName(e);
    const p = comMod.parsePermission(e);
    let existPw = e.passwd? '設定済み': '未設定';
    // 先頭には常に自分のアカウントが入る パスワード状態は表示しない
    if (i === 0)  existPw = ''; 
    let service = '', classroom = '';
    if (p.length > 1){
      service = p[1][0]? p[1][0]: '';
      classroom = p[1][1]? p[1][1]: '';
    }
    const buttonVariant = (e.checked && func)? 'contained': 'text';
    const buttonColor = (e.checked && func)? 'primary': 'default';
    // ボタンのラベル パスワードリセットは長すぎるので
    const buttonLabel = (e.checked && func)
    ? func.replace('パスワード', ''): '・・・';
    const handleClick = () => {
      if (!e.checked){
        setSnack({
          ...snack, msg: 'チェックをオンにしてからクリックして下さい。',
          id: new Date().getTime()
        });
        return false;
      }
      if (!func){
        setSnack({
          ...snack, msg: '機能選択を行って下さい。',
          id: new Date().getTime()
        });
        return false;
      }
      if (func === 'パスワードリセット'){
        const prms = {
          fname: e.fname, lname: e.lname,
          hname, bname, mail: e.mail,
          resetkey: comMod.randomStr(30, 0),
        }
        sendAccountKeyAndMail(prms, '', setSnack);
      }
      if (func === 'アカウント削除'){
        if (i === 0){
          setSnack({msg: '自分のアカウントは削除できません。', severity: 'warning'});
          return false;
        }
        const prms = {
          a:'deleteAccount', hid, bid, mail: e.mail,
        }
        univApiCall(
          prms, 'ED4908', '', setSnack, '削除しました。', '削除できませんでした。'
        );
        // 削除メンバーをstateから削除
        const t = menbers.filter(e=>!e.checked);
        setMenbers(t);
        return true;
      }
      if (func === 'アカウント編集'){
        // 編集するメンバーをストアに保存
        const t = {...controleMode};
        t.editAccount = e;
        dispatch(Actions.setStore({controleMode: t}));
        setTimeout(()=>{
          history.push(`/account/edit/`)
        }, [300])
      }
      // メンバーのチェックを外す
      const t = [...menbers];
      t.forEach(e=>{e.checked = false})
      setMenbers(t);

      console.log('clicked');
    }
    return (
      <div key = {i} className={'flxRow ' + classes.accountCntRoot}>
        <div className='wmin center'>{i + 1}</div>
        <div className='w20'>
          <div>{e.lname} {e.fname}</div>
          <div className='textEclips'>{e.mail}</div>
        </div>
        <div className={'wzen3 ' + classes.checkBoxRoot} style={chkBoxStyle}>
          <Checkbox
            checked={e.checked} onChange={ev=>handeleCbChange(ev, i)}
          />
        </div>
        <div className='w15 textEclips vCenter'>{permissionName}</div>
        <div className='w10 textEclips vCenter'>{service}</div>
        <div className='w10 textEclips vCenter'>{classroom}</div>
        <div className='w10 textEclips vCenter'>{existPw}</div>
        <div className='wzen10 button '>
          <Button
            variant={buttonVariant}
            color={buttonColor}
            onClick={handleClick}
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    )
  });
  const Header = () => (
    <div className='flxTitle' style={{marginTop: 16}}>
      <div className='wmin lower'>No</div>
      <div className='w20'>
        <div>名前</div>
        <div style={{fontSize:'.8rem'}}>メール/ログインアカウント</div>
      </div>
      <div className='wzen3 lower'>確認</div>
      <div className='w15 lower'>権限</div>
      <div className='w10 lower'>サービス</div>
      <div className='w10 lower'>単位</div>
      <div className='w10 lower'>パスワード</div>
      <div className='wzen10 lower'>実行ボタン</div>
    </div>
  )
  if (menbers === null) return null;
  if (!loadingStatus.loaded || loadingStatus.error) return null;
  else{
    return (<>
      <div>
        <fpc.SelectGp 
          onChange={e => funcChange(e)}
          nameJp={'機能選択'}
          value={func}
          size={'large'}
          opts={funcs}
        />
        <Header />
        {eachMenber}
      </div>
      <SnackMsg {...snack}/>
    </>)
  }
} 

const EditAccount = () => {
  const classes = useStyles()
  return (
    <div className={classes.editAccountRoot}>
      <h5>アカウント編集</h5>
      <AddEditAccount edit />
      <GoBackButton/>
    </div>
  )
}

// アカウントリストを再読み込みする独立したボタンコンポーネント
export const ReloadAccountListButton = () => {
  const dispatch = useDispatch();
  const stdDate = useSelector(state => state.stdDate);

  const reloadAccountList = async () => {
    const mail = comMod.getCookeis("mail");
    const key = comMod.getCookeis('hjkeg5gd8h'); // SKEY
    const params = { a: 'getAccountByKey', mail, key, date: stdDate };
    try {
      const res = await axios.post(endPoint(), comMod.uPrms(params));
      if (res.data && res.data.accountlist) {
        const accountLst = res.data.accountlist.dt;
        accountLst.map(_ => {
          delete _.passwd;
          delete _.skey;
          delete _.resetkey;
          delete _.resetkeyts;
        });
        dispatch(Actions.setStore({ accountLst }));
        dispatch(Actions.setSnackMsg('アカウントリストを更新しました。', ''));
      }
    } catch (e) {
      console.log(e);
      dispatch(Actions.setSnackMsg('アカウントリストの更新に失敗しました。', 'error'));
    }
  };

  return (
    <Button onClick={reloadAccountList} style={{ padding: '4px 8px', textTransform: 'none', color: grey[700] }} endIcon={<ReplayIcon />}>
      事業所リスト更新
    </Button>
  );
};


const AccountMain = () => {
  const headerHeight = useGetHeaderHeight();
  const classes = useStyles();
  const saccount = useSelector(state => state.account);
  const permission = comMod.parsePermission(saccount)[0][0];
  const prms = useParams().p;

  const AddAccount = () => (
    <div className={classes.acDiv}>
      <h5>アカウント追加</h5>
      <div className='conpWrap'>
        <div className='form'>
          <AddEditAccount />
        </div>
        <div className='text'>
          アカウントを新規追加するためのメールを送信します。
        </div>
      </div>
    </div>
  )
  const ManageAccount = () => {
    const [reloadKey, setReloadKey] = useState(0);
    return (
      <div className={classes.acDiv}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: teal[50], borderBottom: '1px solid ' + teal[200], marginBottom: 16 }}>
          <h5 style={{ borderBottom: 0, marginBottom: 0, flex: 1 }}>アカウント管理</h5>
          <div style={{ paddingInlineEnd: 8 }}>
            <Button
              onClick={() => setReloadKey(k => k + 1)}
              style={{ padding: '4px 8px', textTransform: 'none', color: grey[700] }}
              endIcon={<ReplayIcon />}
            >
              メンバー更新
            </Button>
          </div>
        </div>
        <AccountOfMenbers key={reloadKey} />
      </div>
    )
  }
  const ChangeAccountOuter = () => (
    <div className={classes.acDiv} style={prms === 'ch' ? { maxWidth: 600, margin: '0 auto' } : {}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: teal[50], borderBottom: '1px solid ' + teal[200], marginBottom: 16 }}>
        <h5 style={{ borderBottom: 0, marginBottom: 0, flex: 1 }}>
          事業所切替
          {permission === 100 &&
            <span style={{ marginInlineStart: 16, fontSize: '.7rem', color: '#666' }}>
              {`${saccount.hid}, ${saccount.bid}`}
            </span>
          }
        </h5>
        <div style={{ paddingInlineEnd: 8 }}>
          <ReloadAccountListButton />
        </div>
      </div>
      <div className='accountChWrap'>
        <ChangeAccount />
      </div>
    </div>

  )
  return (
    <div className={`AppPage account ${classes.accountHoge}`} style={{marginTop: headerHeight ?headerHeight :50}}>
      {/* {prms !== 'ch' && <PasswdReset />} */}
      {prms === undefined && <AddAccount />}
      {prms === undefined && <ManageAccount />}
      {prms !== 'edit' && prms !== undefined && 
        <SchSelectMonth />
      }
      {prms !== 'edit' && <ChangeAccountOuter />}
      {prms === 'edit' && <EditAccount />}
    </div>
  )

}

const Account = () => {
  const allstate = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allstate);
  if (loadingStatus.loaded){
    return (<AccountMain />)
  }
  else if (loadingStatus.error){
    return (
      <LoadErr loadStatus={loadingStatus} errorId={'E4933'} />
    )
  }
  else{
    return <LoadingSpinner/>
  }

}

export default Account;
