import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector, } from 'react-redux';
import { HashRouter, Route, Switch, useLocation } from 'react-router-dom'
import * as Actions  from '../../Actions';
import * as comMod from '../../commonModule';
import * as mui from '../common/materialUi';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';
import InputLabel from '@material-ui/core/InputLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import NativeSelect from '@material-ui/core/NativeSelect';
import SnackMsg from './SnackMsg';
import {ResetPassWd, recentHidAndBidCount, recentHidAndBidName} from '../../component/account/Account';
import teal from '@material-ui/core/colors/teal';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import { faLess } from '@fortawesome/free-brands-svg-icons';
import { recentUserStyle } from '../../albCommonModule';
import { univApiCall } from '../../modules/api';
import { fetchAll } from '../../modules/thunks';
import { ShoguuKaizen } from './AddictionFormParts';
import { getLocalStorage, setLocalStorage } from '../../modules/localStrageOprations';
import { seagull } from '../../modules/contants';
import FileUploadPage from './FileUploadPage';

const useStyles = makeStyles((theme) => ({
  root: {
    '& .MuiTextField-root': {
      margin: theme.spacing(1),
      width: '40ch',
      "@media (max-width:599px)": {
        width: '95%'
      },
    },
    '& .MuiSelect-root' : {
      width: '40ch',
      "@media (max-width:599px)": {
        width: '95%'
      },
    },
    '& .displayOff' :{
      display:'none',
    }
  },
  formControl: {
    margin: theme.spacing(1),
    "@media (max-width:599px)": {
      width: '95%'
    },
  },
  certificating: {
    paddingTop: '10vh',fontSize: '1.4rem',color: teal[500], textAlign:'center',
  },
  chkBox: {width: 240, marginBottom: 16, margin: '0 auto',},
}));

// const attemptLimit = 10;
const attemptLimit = 5;
const rockIntervalMin = 5;
// const rockInterval = 1000 * 60 * rockIntervalMin; // 10分

// グローバルフラグ：複数回マウントされても API コールは1回のみ
let fetchAttemptCalled = false;
let autoLoginCalled = false;

const fetchAttempt = async(setAttemptCount, mountedRef = { current: true })=>{
  if (fetchAttemptCalled) return;
  fetchAttemptCalled = true;
  
  const prms = {
    a:'getCountAttempts',interval_minutes: rockIntervalMin,
  }
  const res = await univApiCall(prms);
  if (res.data.result && res.data.dt.length && res.data.dt[0].count){
    const count = Number(res.data.dt[0].count);
    if (mountedRef.current){
      setAttemptCount(count);
    }
  }
  else{
    if (mountedRef.current){
      setAttemptCount(0);
    }
  }
}

const LoginMain = ()=>{
  const [pass, setpass] = useState('');
  const [selectAcount, setselectAcount] = useState();
  const [disabledation, setdisabledation] = useState({
    mail:false, mailHelperText:'',
  });
  const locPrams = comMod.locationPrams();
  const urlPrmsMail = comMod.fdp(locPrams, 'detail.mail', '');
  const [mail, setmail] = useState(urlPrmsMail);
  // クッキー取得により自動ログインするかどうか
  let cookieAutoLogin = comMod.getCookeis('autoLogin');
  if (cookieAutoLogin === '1')  cookieAutoLogin = true;
  else if (cookieAutoLogin === undefined)  cookieAutoLogin = false;
  else if (cookieAutoLogin === '0')  cookieAutoLogin = false;
  const [autoLogin, setAutoLogin] = useState(cookieAutoLogin);
  const [showPasswd, setShouwPasswd] = useState(false);

  const classes = useStyles();
  const dispatch = useDispatch();
  const accountLst = useSelector(state => state.accountLst);
  // stateのアカウント監視用
  const saccount = useSelector(state => state.account);
  // const saccount = useSelector(state => state.account);
  const fetchAccountStatus = useSelector(state => state.fetchAccountStatus);
  const sessionStatus = useSelector(state => state.sessionStatus);
  const [attemptLimitRock, setAttemptLimitRock] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const mountedRef = useRef(true);
  // const session = useSelector(state => state.session);
  // const comFtc = useSelector(state => state.comFtc);

  // 試行回数取得はマウント時1回のみ（グローバルフラグで制御）
  useEffect(() => {
    fetchAttempt(setAttemptCount, mountedRef);
  }, []);

  // 自動ログインもマウント時1回のみ実行（グローバルフラグで制御）
  useEffect(() => {
    if (autoLogin && !autoLoginCalled){
      autoLoginCalled = true;
      dispatch(Actions.makeAcountByKey());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // マウント時のみ実行

  // ログイン失敗時のエラー表示のみを監視
  useEffect(()=>{
    if (fetchAccountStatus.loginResult === false){
      const attemptCount = fetchAccountStatus.attemptCount;
      let attemptLimitText = '';
      if (fetchAccountStatus.attemptCount >= attemptLimit){
        setAttemptLimitRock(true);
      }
      if (attemptCount > attemptLimit - 4){
        attemptLimitText = `残り${attemptLimit - attemptCount}回`;
      }
      else if (attemptCount){
        attemptLimitText = `${attemptCount}回`;
      }
      setdisabledation({
        mail:true, 
        mailHelperText:`メールアドレスまたはパスワードが違います。${attemptLimitText}`,
      });
    }
  }, [fetchAccountStatus.loginResult, fetchAccountStatus.attemptCount]);

  useEffect(()=>{
    if (attemptCount >= attemptLimit){
      setAttemptLimitRock(true);
    }
  }, [attemptCount])

  // アカウントリストが取得されたら、履歴のトップをデフォルト値に設定する
  useEffect(() => {
    if (accountLst.length > 0 && (selectAcount === undefined || selectAcount === '')) {
      const recentPairs = getLocalStorage(recentHidAndBidName) ?? [];
      if (recentPairs.length > 0) {
        const [hid, bid] = recentPairs[0].split(',');
        const index = accountLst.findIndex(e => e.hid === hid && e.bid === bid);
        if (index !== -1) {
          setselectAcount(index.toString());
        } else {
          setselectAcount("0");
        }
      } else {
        setselectAcount("0");
      }
    }
  }, [accountLst]);

  const SelectAcountOpt = ()=>{
    const lst = accountLst.map((e, i)=>{
      return (
        <option key={i} value={i}>
          {e.sbname + ' ' + e.lname + ' ' + e.fname + 'さん'}
        </option>
      );
    });
    return lst;
  }
  
  const handleFormChenage =()=>{
    const form = document.getElementById('dghrt573');
    const elms = form.elements;
    setmail(elms['sometext'].value);
    setpass(elms['passinput'].value);
    setselectAcount(elms['selectAcount'].value);
  }
  // バリデーションはblurで
  // 関数は一括して発火元のname属性で処理を判断する
  const handlBlur=(e)=>{
    const target = e.currentTarget;
    const elmId = target.getAttribute('id');
    if (elmId === 'loginMail'){
      setdisabledation({
        mail: !comMod.isMailAddress(mail),
        mailHelperText: comMod.isMailAddress(mail)? '': 'メールアドレスが正しくありません。',
      });
    }
  }

  // ログインクリック
  const logInClick=()=>{
    const prms = {
      a:'getAccountByPw',
      mail:mail,
      passwd:pass,
    }
    dispatch(Actions.fetchAccount(prms));
  }
  // ログインキャンセル
  const cancelLogin =()=>{
    setmail('');
    setpass('');
    // あとから法人情報などのクリアも実施すること
    dispatch(Actions.clearAcount());
  }
  // アカウント選択クリック
  const selectedClick =()=>{
    const elms = document.getElementById('dghrt573').elements;
    const selected = elms['selectAcount'].value;
    const key = new Date().getTime();

    if (selected === ''){
      dispatch(Actions.setSnackMsg(
        '事業所を選択して下さい。', 'warning'
      ))
      return false;
    }
    // ステイトのアカウントに値をセット
    const account = accountLst[parseInt(selected)];
    // アカウントリストからアカウントにセット
    dispatch(Actions.setAcount(account));
    // セッションを作成。認証キーを送信。
    const prms = {
      hid: account.hid,
      bid: account.bid,
      mail: account.mail,
      key: comMod.randomStr(8),
    }
    dispatch(Actions.sendNewKey(prms));

    const cookeiStdDate = comMod.getCookeis('stdDate');
    const t = new Date();
    t.setDate(1);
    const stdDate = (cookeiStdDate)? 
    cookeiStdDate : comMod.formatDate(t, 'YYYY-MM-DD');
    dispatch(Actions.setStdDate(stdDate));

    // 色々と取得
    fetchAll({stdDate, hid: account.hid, bid: account.bid, dispatch, account});
    const recentHidAndBid = getLocalStorage(recentHidAndBidName) ?? [];
    recentHidAndBid.unshift(`${account.hid},${account.bid}`);
    recentHidAndBid.splice(recentHidAndBidCount);
    setLocalStorage(recentHidAndBidName, recentHidAndBid);

  }

  // ログインと事業所選択で表示を切り替える
  const beforeLoginDisp = 
    (fetchAccountStatus.loginResult === true)?'displayOff':'';
  const afterLoginDisp = 
    (fetchAccountStatus.loginResult !== true)?'displayOff':'';

  useEffect(()=>{
    const v = autoLogin? 1: 0;
    comMod.setCookeis('autoLogin', v);
    // return (()=>{
    //   })
  }, [autoLogin])
  const handleChkChange = (ev) => {
    if (autoLogin){
      setAutoLogin(false);
    }
    else{
      setAutoLogin(true);
    }
  }

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (attemptLimitRock){
    return(
      <div className={classes.root + ' loginFrom'}>
        <img src={`/img/errlogoRed.svg`}/>
        <div style={{marginTop: 24, lineHeight: 1.5}}>
          ログイン試行回数が上限に達しました。
          {`${rockIntervalMin}分後に再試行できます。`}
        </div>
        <div style={{marginTop: 24, textAlign: 'center'}}>
          <mui.ButtonGP
            color='primary'
            label='再試行'
            onClick={()=>{
              window.location.reload();
            }}
          />
        </div>
      </div>
    )
  }
  return(
    <>
    <form 
      className={classes.root + ' loginFrom'} /*nodisabledate */
      id = "dghrt573"
      autoComplete="off"
    >
      {!seagull && <img src={`/img/logoMarkW800.png`}/>}
      {Boolean(seagull) && 
        <img 
          src={`/img/aitsubasa-teal-v.svg`}
          style={{width: 200, marginTop: '16vh', marginBottom: '2vh'}} 
        />
      }

      <div className={beforeLoginDisp}>
          
        {fetchAccountStatus.loading === true &&
          <div className={classes.certificating}>アカウント確認中</div>
        }
        {fetchAccountStatus.loading === false && <>
          <TextField 
            required
            id="loginMail"
            name="sometext"
            label="メールアドレス"
            value={mail}
            autoComplete="off"
            onBlur={(e)=>handlBlur(e)}
            onChange={handleFormChenage}
            error={disabledation.mail}
            helperText={disabledation.mailHelperText}
          />
          <TextField 
            required 
            // type="password"
            type={showPasswd? 'text': 'password'}    
            id="loginPass" 
            name="passinput"
            label="パスワード"
            value={pass}
            autoComplete="off"
            error={disabledation.mail}
            onChange={handleFormChenage}
          />
        </>}
        
      </div>
            
      {fetchAccountStatus.loading === false && <>
        <div 
          className={beforeLoginDisp + ' ' + classes.chkBox}
          style={{marginBottom: 0}}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={(autoLogin)}
                onChange={(ev)=>handleChkChange(ev)}
                name='autoLogin'
                color="primary"
              />
            }
            label='ログイン状態を維持する'
          />

        </div>

        <div className={beforeLoginDisp + ' ' + classes.chkBox}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showPasswd}
                onChange={(ev)=>{setShouwPasswd(ev.target.checked)}}
                name='showpasswd'
                color="primary"
              />
            }
            label='パスワードを表示する'
          />

        </div>

        <div className={beforeLoginDisp + ' buttonWrapper'}>
          <mui.ButtonGP
            color='secondary'
            label='キャンセル'
            name='cancel'
            onClick={cancelLogin}
          />
          <mui.ButtonGP
            color='primary'
            label='ログイン'
            name='login'
            onClick={logInClick}
          />
        </div>

        <div className={"acountSelectWrapper " + afterLoginDisp}>
        <FormControl className={classes.formControl}>
          <InputLabel shrink htmlFor="age-native-label-placeholder">
            事業所を選択して下さい。
          </InputLabel>
          <Select
            name='selectAcount'
            native 
            value = {selectAcount}
            label = ''
            onChange = {handleFormChenage}
          >
            {/* <option value="">未選択</option> */}
            <SelectAcountOpt/>
          </Select>
        </FormControl>
      </div>
      <div className={afterLoginDisp + ' buttonWrapper'}>
        <mui.ButtonGP
          color='secondary'
          label='キャンセル'
          onClick={cancelLogin}
        />
        <mui.ButtonGP
          color='primary'
          label='アカウント選択'
          onClick={selectedClick}
        />
      </div>
    
      </>}
    </form>
    <SnackMsg storeStateOpen={true}/>
    </>
  )
}

const Login = () => {
  return(
    <HashRouter>
      <Switch>
        <Route path = '/restpassword' render={(props) => <ResetPassWd {...props} />} />
        <Route path = '/fileupload' render={(props) => <FileUploadPage {...props} />} />
        <Route path = '/' render={(props) => <LoginMain {...props} />} />
      </Switch>
    </HashRouter>
  )

}

export default Login;
