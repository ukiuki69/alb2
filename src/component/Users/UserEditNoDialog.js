import React, { useState, useEffect, useRef } from 'react';
import * as comMod from '../../commonModule'
import { useDispatch, useSelector } from 'react-redux';
import * as mui from '../common/materialUi';
import * as Actions from '../../Actions';
import Button from '@material-ui/core/Button';
import { blue, green, grey, orange, pink, red, teal, yellow, indigo } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import * as sfp from '../common/StdFormParts';
import { useHistory, useParams } from 'react-router';
import { GoBackButton, } from '../common/commonParts';
import { HOHOU, HOUDAY, JIHATSU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import { setRecentUser, univApiCall } from '../../albCommonModule';
import EmojiPeopleIcon from '@material-ui/icons/EmojiPeople';
import { Checkbox, FormControlLabel } from '@material-ui/core';
import { CheckBox } from '@material-ui/icons';
import { faSleigh, faYenSign } from '@fortawesome/free-solid-svg-icons';
import { fdp } from '../../commonModule';
import SnackMsg from '../common/SnackMsg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { GoToUsersSchButton, GotoUserAddiction, GotoKanriKyouryokuButton } from '../common/GotoButtonsAroundUsers';
import FormChangeListener from '../common/FormChangeListener';
import UnsavedChangesHandler from '../common/UnsavedChangesHandler';
import { parse } from '@fortawesome/fontawesome-svg-core';
import SchLokedDisplay from '../common/SchLockedDisplay';
import { seagull, THIS_MONTH_BIRTHDAY } from '../../modules/contants';
import { BankInfoFormsParts } from '../common/BankInfoFormsParts';
import { GetNextHist } from './Users';
import { llmApiCall } from '../../modules/llmApiCall';
import { UnivCheckbox } from '../common/univFormParts';
import { cleanSpecialCharacters } from '../../modules/cleanSpecialCharacters';
import { escapeSqlQuotes } from '../../modules/escapeSqlQuotes';


const hiddenInput = 'hiddenInput';

const useStyles = makeStyles({
  extSettingDispSw:{
    position: 'absolute', top: 124, left: 80,
  },
  faIcon:{
    padding: 0, fontSize: 20, 
    width: 24, textAlign: 'center', display: 'inline-block',
    height: 20, marginTop: -12
  },

  userAddiction: {
    '&.MuiButtonBase-root': {
      background: orange[800], color: '#fff', transition: '.4s',
      '&:hover': {background: orange[600]},
    },
  },
  stopUseButtonRoot: {
    paddingTop: 18, paddingLeft: 8,
    '& .MuiButton-label' :{color: red[600]}
  },
  stopUseInner:{
    '& .chkBox': {padding: 16, width: 160, paddingTop: 8},
    '& .disc': {padding: 16, flex: 1, color: red[600], lineHight: 1.5}
  },
  links: {
    marginTop: 48,
    '& > a > .MuiButton-text': {
      // margin: theme.spacing(1),
      padding: 0,
      color: '#fff'
    },
  },
  nextUserNotation:{
    flex: 1, display: 'flex', alignItems: 'center',
    paddingLeft: 8,
    '& > div':{
      background: red[900], color:yellow[200],
      fontSize: '.8rem', padding: 8,
    }
  },
  sameNameButton:{
    background: red[800],color: '#fff',
    '&:hover': {background: red[700]}
  },
  userEditRoot: {
    '& .outer': {
      marginTop: 88, maxWidth: 800, paddingRight: 8,
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
    '& .MuiDialog-paperWidthSm': {
      maxWidth: 800,
    },
    '& .MuiDialogContent-root' :{
      margin: 0,
      padding: 0,
      overflowX: 'hidden', // この設定がないと横スクロールバーが出ちゃう
    },
    '& .MuiDialogTitle-root' : {
      padding: 0,
    },
  },
  buttonWrapper:{
    textAlign: 'right',
    '& > button': {marginLeft: 8,}
  }
})

const Links = (props) => {
  const { tab, settab } = props;
  const classes = useStyles();
  return (<>
    <div className={'linksTab ' + classes.links} >
      <a 
        onClick={() => settab(0)} 
        className={(tab === 0) ? 'current' : ''}
      >
        <Button tabIndex={-1}>基本</Button>
      </a>
      {!seagull && 
        <a 
          onClick={() => settab(1)} 
          tabIndex='-1' className={(tab === 1) ? 'current' : ''}
        >
          <Button tabIndex={-1} >口座情報</Button>
        </a>
      }
    </div>
  </>)
}
// ユーザー情報に次の情報があるかどうか
// 次の情報があるときは表示を行う
export const NextUserDisp = (props) => {
  const classes = useStyles();
  const {thisUser} = props;
  const Notation = () => (
    <div className={classes.nextUserNotation}>
      <div>
        変更は{thisUser.next.slice(0, 7)}以降に反映されません。
      </div>
    </div>
  )
  if (thisUser.next && !props.showNextChangeButton)  return <Notation />
  else return null;
}

// 仮入力用に未入力のフィールドの値を作成する
const userDatasFillEmpty = (prms) => {
  const {userDatas, users, checked, label, hnoList} = prms;
  if (!checked) return false;
  if (label !== '仮登録') return false
  const tobeFilled = [
    'lname', 'fname', 'klname', 'kfname', 'birthday', 'hno', 
    'volume', 'priceLimit', 'scity_no', 'scity', 'startDate', 'contractDate', 
    'lineNo', 'plname', 'pfname', 'pklname', 'pkfname', 'brosIndex', 'pphone'
  ];
  const tobeFilledMultiService = [
    '-volume','-startDate', '-contractDate', '-lineNo',
  ]
  if (hnoList === false) return false;
  // ユニークな仮受給者証番号を作成
  let hno;
  for (let i = 1; i <= 999; i++){
    hno = comMod.zp(i, 3);
    if (!hnoList.includes(hno)) break;
  }
  userDatas['hno'] = hno;
  tobeFilled.forEach(e=>{
    // 仮登録では兄弟設定は強制的に解除
    if (e === 'brosIndex'){
      userDatas[e] = '0'
    }
    if (userDatas[e]) return false;
    // 名前として処理
    if (e.includes('name') && !e.includes('k')){
      userDatas[e] = '名無し'
    }
    // かなとして処理
    else if (e.includes('name') && e.includes('k')){
      userDatas[e] = 'ななし'
    }
    else if (e === 'birthday'){
      const t = new Date();
      t.setFullYear(t.getFullYear() - 5);
      t.setMonth(0);
      t.setDate(1);
      userDatas[e] = comMod.formatDate(t, 'YYYY-MM-DD');
    }
    else if (e === 'volume'){
      userDatas[e] = 0;
    }
    else if (e === 'scity_no'){
      if (users.length){
        userDatas[e] = users[0].scity_no;
      }
      else {
        userDatas[e] = '012345'
      }
    }
    else if (e === 'scity'){
      if (users.length){
        userDatas[e] = users[0].scity;
      }
      else {
        userDatas[e] = '架空自治体'
      }
    }
    else if (e === 'contractDate' || e === 'startDate'){
      const t = new Date();
      t.setMonth(0);
      t.setDate(1);
      userDatas[e] = comMod.formatDate(t, 'YYYY-MM-DD');
    }
    else if (e === 'lineNo'){
      userDatas[e] = 1;
    }
    else if (e === 'brosIndex'){
      userDatas[e] = 0;
    }
    else if (e === 'pphone'){
      userDatas[e] = '045-000-0000'
    }
    else if (e === 'priceLimit'){
      userDatas[e] = 4600
    }
  });
  tobeFilledMultiService.forEach(e=>{
    Object.keys(userDatas).filter(f=>f.includes(e)).forEach(f=>{
      if (f.includes('volume')){
        userDatas[f] = '10';
      }
      else if (f.includes('contractDate') || f.includes('startDate')){
        const t = new Date();
        t.setMonth(0);
        t.setDate(1);
        userDatas[f] = comMod.formatDate(t, 'YYYY-MM-DD');
      }
      else if (f.includes('lineNo')){
        userDatas[f] = '1';
      }
    })
  })
}

// 拡張表示を行うためのチェックボックス
const ExtSettingDispSw = (props) => {
  const {extSetting, setExrSetting} = props;
  const classes = useStyles();
  const allState = useSelector(state=>state);
  const permission = comMod.parsePermission(allState.account)[0][0];
  const handleChange = (e) => {
    setExrSetting(e.currentTarget.checked);
  }
  // if (permission !== 100) return null;
  return (
    <div className={classes.extSettingDispSw}>
      <FormControlLabel
        control={
          <Checkbox
            checked={extSetting} onChange={(e) => handleChange(e)}
            color="primary"
          />
        }
        label="拡張設定" labelPlacement="top"
      />
    </div>
  )

}

export const UserEditNoDialog = (props) =>{
  // stateのopenで開く、uidsはuidを持つ
  // editOnで修正モード、uidに従って修正を行う
  // const {editOn,} = props;
  const allState = useSelector(state=>state);
  const {
    hid, bid, stdDate, dateList, users, nextUsers, controleMode,
    serviceItems, schedule, service, classroom, com
  } = allState;
  const history = useHistory();
  const prms = useParams().p;
  const uids = prms.replace(/[^0-9]/g, '');
  const addnew = prms.includes('addnew');
  const dispatch = useDispatch();
  const classes = useStyles();
  // 計画相談のサービス名を定義
  const soudanServiceNames = [KEIKAKU_SOUDAN, SYOUGAI_SOUDAN];
  // スケジュールのロック状態を検出する
  const scheduleLocked = comMod.fdp(allState, 'schedule.locked');

  // const lcClasses = useStyle();
  const [sameName, setSameName] = useState(false); // 同姓同名チェック用
  // 複数サービスを監視
  const [curService, setCurService] = useState(service);
  // 複数サービスの中身を保持
  const [multiSvcCnt, setMultiSvcCnt] = useState('');
  // 未収力項目を仮入力するためのボタン表示制御
  const [tempInput, setTempInput] = useState({
    style: {display: 'none'},
    checked: false, label: '仮登録',
  });
  // 仮登録などで一時的にボタンを送信できなくする
  // const [submitDisable, setSubmitDisable] = useState(false);
  const [hnoList, sethnoList] = useState(null);
  const [names, setNames] = useState({});
  const [snack, setSnack] = useState({msg: '', severity: ''});
  // 所属のユニークなリストを作成する
  const belongs1Set = new Set();
  const belongs2Set = new Set();
  users.map(e=>{
    belongs1Set.add(e.belongs1);
    belongs2Set.add(e.belongs2);
  });
  const belongs1List = Array.from(belongs1Set);
  const belongs2List = Array.from(belongs2Set);
  // 修正モードかどうかはパラメータで判断
  const editOn = uids? true: false;
  const titleStr = (editOn) ? '利用者修正削除' : '利用者追加';
  const locPrms = comMod.locationPrams();
  const goBack = comMod.fdp(locPrms, 'detail.goback');
  // sindexの最大値を作成する 新規追加のときはこれを使う
  // const aryMax = (a, b) => {return Math.max(a, b)};
  // const sindexMax = (users.length) 
  // ? users.map(e=>e.sindex).reduce(aryMax) + 10 : 0;
  const pi = (v) => parseInt(v);
  const sindexMax = users.reduce((v, e)=>(pi(e.sindex) > v? v = pi(e.sindex): v), 0);
  // uidに従ったuserの情報 後からメンバーを見に行くので空のobjで初期化
  const thisUser = (uids)? comMod.getUser(uids, users, nextUsers) : {};
  // 拡張表示を行うためのスイッチ
  const [extSetting, setExrSetting] = useState(()=>{
    if (thisUser?.etc?.dokujiJougen) return true;
    if (thisUser?.etc?.dokujiJougenZero) return true;
    if (thisUser?.etc?.over18) return true;
    if (thisUser?.etc?.sochiseikyuu) return true;
    if (thisUser?.etc?.ageOffset) return true;
    return false;
  })
  const [brosIndex, setBrosIndex] = useState(thisUser.brosIndex);


  // 利用停止のエレメントを開くかどうか。初期値として終了日に今月の日付が入っていること
  const [openStopUse, setOpenStopUse] = useState(
    thisUser.endDate &&
    thisUser.endDate.slice(0, 7) === stdDate.slice(0, 7)
  );
  // 利用停止のチェックボックス用 初期値は上記と同じ値を取る
  const [stopUse, setStopUse] = useState(
    thisUser.endDate &&
    thisUser.endDate.slice(0, 7) === stdDate.slice(0, 7)
  )

  useEffect(()=>{
    const lname = thisUser?.name?.split(' ')?.[0] || '';
    const fname = thisUser?.name?.split(' ')?.[1] || '';
    const klname = thisUser?.kana?.split(' ')?.[0] || '';
    const kfname = thisUser?.kana?.split(' ')?.[1] || '';
    const plname = thisUser?.pname?.split(' ')?.[0] || '';
    const pfname = thisUser?.pname?.split(' ')?.[1] || '';
    const pklname = thisUser?.pkana?.split(' ')?.[0] || '';
    const pkfname = thisUser?.pkana?.split(' ')?.[1] || '';
    if (Object.keys(thisUser).length){
      setNames({lname, fname, klname, kfname, plname, pfname, pklname, pkfname, });
    }
  }, [thisUser]);
  useEffect(()=>{
    // 漢字があるのに読み仮名がない場合のみログを出力
    if ((names.lname && !names.lkana) || 
        (names.fname && !names.fkana) || 
        (names.plname && !names.plkana) || 
        (names.pfname && !names.pkfana)) {
      console.log(names, '読み仮名が設定されていない名前があります');
      
      // 読み仮名がない漢字に対してllmApiCallを実行
      const getMissingKana = async () => {
        const missingKanaMap = {};
        
        if (names.lname && !names.klname) missingKanaMap.klname = names.lname;
        if (names.fname && !names.kfname) missingKanaMap.kfname = names.fname;
        if (names.plname && !names.pklname) missingKanaMap.pklname = names.plname;
        if (names.pfname && !names.pkfname) missingKanaMap.pkfname = names.pfname;
        
        // 各漢字に対して読み仮名を取得
        for (const [kanaKey, kanjiValue] of Object.entries(missingKanaMap)) {
          try {
            setSnack({msg: '読み仮名取得中', severity: ''});
            const response = await llmApiCall(
              { prompt: kanjiValue, systemrole: "日本人の読み仮名を教えてください。最近10年ぐらいで生まれた子どもの名前も考慮して下さい。シンプルに読み仮名だけ答えるようにしてください" },
              'E232298', // エラー識別ID
              '', // setRes（省略可）
              setSnack,
              '読み仮名を取得しました', // 成功メッセージ
              '読み仮名を取得できませんでした', // エラーメッセージ
              false // simpleモード（省略可）
            );
            
            // 応答から読み仮名を取得してnamesに設定
            if (response && response.data && response.data.response) {
              const kana = response.data.response.trim();
              setNames(prev => ({...prev, [kanaKey]: kana}));
            }
          } catch (error) {
            console.error(`${kanjiValue}の読み仮名取得に失敗しました`, error);
          }
        }
      };
      
      getMissingKana();
    }
  }, [names]);

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
  bankInfoNames.forEach(e=>{biIni[e] = ''});
  const bankInfo = (!Object.keys(bi).length || !bi)? biIni: bi;
  // 該当スケジュールが存在するかどうか
  const uSchedule = useSelector(state=>state.schedule['UID' + uids]);
  const existUsch = uSchedule 
  ? Object.keys(uSchedule).filter(e=>e.match(/^D2[0-9]*/)).length : 0;
  // 当月のスケジュールが存在せず当月に作成されたスケジュールであれば削除可能にする
  // ユーザーが一人のときも削除不可 -> 削除可能とする 2022/09/21変更
  const enableDelete = (
    // thisUser.date === stdDate && existUsch === 0 && users.length > 1
    thisUser.date === stdDate && existUsch === 0
  );
  
  // ユーザーステイト日付から年月を示す文字列を得る
  const lastUpdate = !thisUser.date? ''
  : thisUser.date.slice(0, 4) + '年' + thisUser.date.slice(5, 7) + '月'
  // // 送迎先の初期値を設定
  // const destListInit = (comMod.findDeepPath(thisUser, 'etc.destList') === null)?
  //   ['自宅', '学校',] : thisUser.etc.destList;
  // 行き先指定するためのstate
  const [destList, setDestList] = useState([]);
  // 削除ボタン用
  const [deleteConfirm, setDeleteConfirm] = useState(
    {flg: false, label: '削除', buttonClass: ''}
  )
  // dialog内のタブ
  const [tab, setTab] = useState(0);
  // 使われていない受給者証番号を探すための使用済み受給者証番号を取得する
  useEffect(()=>{
    let isMounted = true;
    if (hnoList !== null) return false;
    const t = async () => {
      const p = {hid, bid, a: 'fetchAllHnoFromUsers'}
      const r = await univApiCall(p);
      if (!r.data.result){
        sethnoList(false);
        return false;
      }
      const s = new Set(r.data.dt.map(e=>e.hno).filter(e=>e.length === 3));
      const a = Array.from(s);
      console.log(a, 'fetchAllHnoFromUsers');
      sethnoList(a);
    }
    if (isMounted){
      t();
    }
    return (()=>{isMounted = false})

  }, []);

  
  
  // urlが口座情報を示していたら口座情報修正を開く それ以外なら一般項目
  useEffect(()=>{
    const href = window.location.href;
    if (href.indexOf('bankinfo') > -1){
      setTab(1);
    }
    else{
      setTab(0);
    }
  }, []);
  const isFirstRender = useRef(false)
  useEffect(() => { // このeffectは初回レンダー時のみ呼ばれるeffect
    isFirstRender.current = true
  }, [])

  useEffect(()=>{
    if(isFirstRender.current) { // 初回レンダー判定
      isFirstRender.current = false // もう初回レンダーじゃないよ代入
    }
    else {
      console.log('stdDate moved.')
    }
  }, [stdDate]);

  const formId = '#fgr649hg';
  // キーボード制御
  const keyHandler = (e) =>{
    if (e.which === 13 && e.shiftKey && e.ctrlKey){
      cancelSubmit();
    }
    else if (e.which === 13 && e.shiftKey){
      const forBlur = document.querySelector(`#${hiddenInput}`);
      forBlur.focus();
      e.persist();
      setTimeout(() => {
        handleSubmit(e);
      }, 100);
    }
  }
  const daysOfMonth = dateList.length;
  // 利用停止用に月末の文字列を作成しておく
  const sda = stdDate.split('-');
  const endOfMonthStr = comMod.formatDate(
    comMod.getDateEx(sda[0],sda[1],0).dt, 'YYYY-MM-DD'
  );
  // 上限管理がされているかどうかをチェック
  const kanriChk = (targetUser = thisUser) => {
    // 入力後の値を評価できるよう引数を優先してチェックする
    const baseUser = {
      ...thisUser,
      ...targetUser,
      etc: targetUser?.etc ?? thisUser.etc,
    };
    const strUid = comMod.convUID(baseUser.uid).str;
    const kanri_type = baseUser.kanri_type;
    const kanriJi = comMod.fdp(baseUser, 'etc.管理事業所');
    const kyouJi = comMod.fdp(baseUser, 'etc.協力事業所');
    const schKanriJi = comMod.fdp(schedule, [strUid, '管理事業所'], {})
    const schKyouJi = comMod.fdp(schedule, [strUid, '協力事業所'], {})
    const kanriLen = kanriJi? Object.keys(kanriJi).length: 0;
    const kyouLen = kyouJi? Object.keys(kyouJi).length: 0;
    if (((kanriLen + kyouLen) === 0)){
      return {result: true};
    }
    else if (kanri_type === '管理事業所' && kyouLen){
      return {result: true};
    }
    else if (kanri_type === '協力事業所' && kanriLen){
      return {result: true};
    }
    else {
      return {result: false, kanriJi, kyouJi, schKanriJi, schKyouJi};
    }
  }

  const handleSubmit = async (e, deleteBankInfo, options = {}, ) => {
    e.preventDefault();
    
    if (options.updateFuture) {
      // updateFuture: 1 が渡された場合の処理をここに追加できます
      console.log("updateFutureフラグが有効です");
    }
    
    // 値が必要なエレメント
    const inputs = document.querySelectorAll(formId + ' input');
    const selects = document.querySelectorAll(formId + ' select');
    // エラーメッセージ用のノード
    const errMsgDisp = document.querySelector(formId + ' .errMsg span');
    // エラーメッセージをリセット
    errMsgDisp.textContent = '';
    // 必須項目が入力されているか
    const notFilled = comMod.checkRequireFilled([inputs, selects]);
    // フォームの値を取得 disabledも取得 空白入力も取得
    const userDatas = comMod.getFormDatas([inputs, selects], true, true);
    if (options.brosindex){
      userDatas.brosIndex = options.brosindex;
    }
    // options.modPrmsがあればそれをuserDatasに反映する
    Object.keys(options?.modPrms || {}).forEach(e=>{
      // modPrmsに存在するキーは常にuserDatasに設定する（uid: ''なども含む）
      userDatas[e] = options.modPrms[e];
    });

    userDatas.etc = thisUser.etc? thisUser.etc: {};
    // 相談支援サービスがあるときは、不要項目を補完する
    if (soudanServiceNames.includes(service)){
      const adds = {
        type: '障害児', volume: '0', 
        startDate: '0000-00-00', 
        // contractDate: '0000-00-00',
        // lineNo: 1,
      }
      Object.assign(userDatas, adds);
    }
    
    // スケジュールが存在するとき単位名変更の警告
    const usersSch = schedule['UID' + thisUser.uid];
    const clsChanged = (userDatas.classroom || "") !== (thisUser.classroom || "");
    
    // D2で始まるキーがあるかチェック
    const hasD2Keys = usersSch && Object.keys(usersSch).some(key => key.startsWith('D2'));
    
    if (usersSch && Object.keys(usersSch).length && clsChanged && hasD2Keys){
      const msg = `
        単位名の変更が検出されました。すでに当月の予定実績が設定済みです。
        一度、予定実績を削除してから変更してください。
      `;
      errMsgDisp.textContent = msg;
      // const t = {...tempInput, style:{display: 'inline'}, label: 'それでも変更する'};
      // setTempInput(t);
      if (!tempInput.checked){
        console.log('submit canceled0', tempInput);
        // setSubmitDisable(true);
        setSnack({
          msg:'送信はキャンセルされました。', severity: 'warning',
          id: new Date().getTime()
        })
        return { success: false, errMsg: msg };
      }

    }
    // 基本項目のタブであれば銀行口座情報の未入力は無視する
    if (tab === 0){
      bankInfoNames.forEach(e=>{
        const p = notFilled.findIndex(f=>f === e);
        if (p > -1){
          notFilled.splice(p, 1);
        }
      })
    }
    if (notFilled.length && tab === 0){
      const msg = `
        必要な項目が入力されていません。
        仮登録をするときはチェックをしてから再度送信を行って下さい。
        仮登録を行うと無効な入力は無視され、受給者証番号は3桁の仮番号となります。
      `;
      errMsgDisp.textContent = msg;
      console.log('notFilled', notFilled);
      const t = {...tempInput, style:{display: 'inline'}, label: '仮登録'};
      setTempInput(t);
      if (!tempInput.checked){
        console.log('submit canceled0', tempInput);
        // setSubmitDisable(true);
        setSnack({
          msg:'送信はキャンセルされました。', severity: 'warning',
          id: new Date().getTime()
        })
        return { success: false, errMsg: msg };
      }
    }
    else if (notFilled.length){
      const msg = `必要な項目が入力されていません。`;
      errMsgDisp.textContent = msg;
      return { success: false, errMsg: msg };
    }
    // 複数サービス設定時のエラー
    const multiServiceError = document.querySelector(formId + ' .multiServiceError');
    if (multiServiceError){
      const msg = `
        複数サービスの設定を確認してください。単一サービス利用の場合はサービス種別で
        複数サービスを選択しないでください。
      `;
      errMsgDisp.textContent = msg;
      console.log('submit canceled0', tempInput);
      setTempInput({...tempInput, style:{display: 'none'}})
      // setSubmitDisable(true);
      setSnack({
        msg:'送信はキャンセルされました。', severity: 'warning',
        id: new Date().getTime()
      })

      return { success: false, errMsg: msg };
    }
    // エラーがないか helperテキストエラーのセレクタを定義
    const errOccured = document.querySelectorAll(
      formId + ' .MuiFormHelperText-root.Mui-error'
    );
    if (errOccured.length){
      if (!tempInput.checked){
        const msg = `
          エラーの箇所をご確認下さい。
          仮登録をするときはチェックをしてから再度送信を行って下さい。
          仮登録を行うと無効な入力は無視され、受給者証番号は3桁の仮番号となります。
        `;
        errMsgDisp.textContent = msg;
        const t = {...tempInput, style:{display: 'inline'}, label: '仮登録'};
        // setSubmitDisable(true);
        setSnack({
          msg:'送信はキャンセルされました。', severity: 'warning',
          id: new Date().getTime()
        })

        setTempInput(t);
        return { success: false, errMsg: msg };
      }
    }

    const kanriCheckResult = kanriChk(userDatas);

    // 管理事業所協力事業所が登録されているまま、管理協力を外すとエラーにする
    if (!kanriCheckResult.result && !tempInput.checked){
      const kc = kanriCheckResult;
      const schKanriLen = Object.keys(kc.schKanriJi).length;
      const schKyouLen = Object.keys(kc.schKyouJi).length;
      if (schKanriLen + schKyouLen){
        const msg = `
          管理事業所、協力事業所の変更は上限管理の情報を削除してから変更して下さい。
        `;
        errMsgDisp.textContent = msg;
        const t = {...tempInput, style:{display: 'none'}};
        // setSubmitDisable(true);
        setSnack({
          msg:'送信はキャンセルされました。', severity: 'warning',
          id: new Date().getTime()
        })

        setTempInput(t);
        return { success: false, errMsg: msg };
      }
      else{
        const msg = `
          管理事業所または協力事業所が登録済みです。
          削除する場合はチェックを入れて下さい。
        `;
        errMsgDisp.textContent = msg;
        const t = {...tempInput, style:{display: 'inline'}, label: '削除する'};
        setTempInput(t);
        setSnack({
          msg:'送信はキャンセルされました。', severity: 'warning',
          id: new Date().getTime()
        })
        return { success: false, errMsg: msg };
      }
    }
    // 不要な管理事業所、協力事業所を削除する
    if (!kanriCheckResult.result && tempInput.checked && tempInput.label === '削除する'){
      console.log('hoge');
      if (userDatas.kanri_type === ''){
        if (userDatas.etc.管理事業所){
          delete userDatas.etc.管理事業所;
        }
        if (userDatas.etc.協力事業所){
          delete userDatas.etc.協力事業所;
        }
      }
      else if (userDatas.kanri_type === '協力事業所'){
        if (userDatas.etc.協力事業所){
          delete userDatas.etc.協力事業所;
        }
      }
      else if (userDatas.kanri_type === '管理事業所'){
        if (userDatas.etc.管理事業所){
          delete userDatas.etc.管理事業所;
        }
      }
    }
    // ここまで来たら送信ボタン有効にする
    // setSubmitDisable(false);
    
    // 複数サービス入力時の対応
    if (userDatas.service === '複数サービス'){
      let conSvc = ''
      Object.keys(userDatas).filter(e=>e.includes('multiService')).forEach(e=>{
        if (userDatas[e]){
          conSvc += (e.replace('multiService', '') + ',')
        }
        delete userDatas[e];
      });
      // 末尾のカンマを削除してサービスを書き換え
      userDatas.service = conSvc.replace(/,$/, '')
    }
    // エラーが発生している箇所のname属性を配列化
    // nodelistを配列化、エラー表示エレメントからたどってinput要素のname属性を取得
    const errNames = Array.from(errOccured).map(
      e=>e.parentNode.querySelector('input').name
    )
    // 仮入力のときはエラー発生箇所のデータを削除
    if (tempInput.checked){
      errNames.map(e=>{userDatas[e] = ''});
    }
    // 未入力部分を補完する
    userDatasFillEmpty({
      userDatas, users, checked: tempInput.checked, label: tempInput.label,
      hnoList,
    })
    // 必要なデータ変更を行う 名字と名前の連結 未入力の場合を想定する
    const cn = (a, b) =>{
      a = a.replace(/　/g, '');
      b = b.replace(/　/g, '');
      a = cleanSpecialCharacters(a)
      b = cleanSpecialCharacters(b)
      a = (a) ? a : '';   b = (b) ? b : '';
      return ((a && b) ? a + ' ' + b : a + b)
    }
    userDatas.name = cn(userDatas.lname, userDatas.fname);
    userDatas.pname = cn(userDatas.plname, userDatas.pfname);
    userDatas.kana = cn(userDatas.klname, userDatas.kfname);
    userDatas.pkana = cn(userDatas.pklname, userDatas.pkfname);
    const ages = comMod.getAge(userDatas.birthday, stdDate, userDatas.ageOffset);
    userDatas.age = ages.age;
    userDatas.ageNdx = ages.ageNdx;
    userDatas.ageStr = ages.flx;

    // これだけ半角変換が効かないので
    userDatas.scity_no = comMod.convHankaku(userDatas.scity_no);
    // 法人事業所idの付加
    userDatas.hid = hid;
    userDatas.bid = bid;
    userDatas.stdDate = stdDate;
    // 日付の空白は1989年とかに解釈されるので
    userDatas.contractEnd = (!userDatas.contractEnd)?'0000-00-00':userDatas.contractEnd;
    // 管理タイプ未入力だとエラーになる
    userDatas.kanri_type = (userDatas.kanri_type) ? userDatas.kanri_type: '';
    // 利用停止のステイトを見て利用終了データを作成する
    userDatas.endDate = stopUse ? endOfMonthStr: '0000-00-00';
    
    userDatas.date = stdDate; // 追加 2022/01/03
    // 同姓同名のチェック
    if (!editOn){
      const s = users.find(e=>e.name === userDatas.name);
      if (s){
        const msg = '二重登録しようとしていませんか？';
        errMsgDisp.textContent = msg;
        if (!sameName){
          setSameName(true);
          return { success: false, errMsg: msg };
        }
      }
    }
    // 18歳以上処理
    if (!userDatas.etc) userDatas.etc = {};
    if (userDatas.over18) userDatas.etc.over18 = userDatas.over18;
    if (!userDatas.over18 && userDatas.etc.over18) delete userDatas.etc.over18;
    delete userDatas.over18;

    // 市区町村独自上限額
    if (userDatas.dokujiJougen) userDatas.etc.dokujiJougen = userDatas.dokujiJougen;
    if (!Number(userDatas.dokujiJougen)) delete userDatas.etc.dokujiJougen;
    delete userDatas.dokujiJougen;
    if (userDatas.dokujiJougenZero) userDatas.etc.dokujiJougenZero = userDatas.dokujiJougenZero;
    if (!userDatas.dokujiJougenZero) delete userDatas.etc.dokujiJougenZero;
    delete userDatas.dokujiJougenZero;
    // 国保連に請求しない
    if (userDatas.sochiseikyuu) userDatas.etc.sochiseikyuu = userDatas.sochiseikyuu;
    if (userDatas.hasOwnProperty('ageOffset')) userDatas.etc.ageOffset = userDatas.ageOffset;
    if (!userDatas.ageOffset || userDatas.ageOffset === '0') delete userDatas.etc.ageOffset;
    if (!userDatas.sochiseikyuu) delete userDatas.etc.sochiseikyuu;
    delete userDatas.sochiseikyuu;
    delete userDatas.ageOffset;
    // storeの更新
    // フォームの項目で不足しているパラメータがあるので従来のパラメータに
    // 上書きする
    userDatas.users = users;
    const newUserData = {...thisUser, ...userDatas};
    // 学齢の計算 追加のときは学齢がないので
    if (newUserData.age === undefined){
      newUserData.age = comMod.getAge(newUserData.birthday, stdDate, newUserData.etc?.ageOffset).age;
      newUserData.ageNdx = comMod.getAge(newUserData.birthday, stdDate, newUserData.etc?.ageOffset).ageNdx;
      newUserData.ageStr = comMod.getAge(newUserData.birthday, stdDate, newUserData.etc?.ageOffset).flx;
    }
    // 新規追加はインデックス最大値を使う
    if (!newUserData.sindex)  newUserData.sindex = parseInt(sindexMax) + 10;
    // 指定があったら口座情報は削除する
    if (deleteBankInfo){
      const bi = comMod.fdp(newUserData, 'etc.bank_info');
      if (bi) delete newUserData.etc.bank_info;
      bankInfoNames.forEach(e=>{
        delete newUserData[e];
      });

    }
    // 複数サービスの場合
    if (userDatas.service.includes(',')){
      const netc = newUserData.etc? newUserData.etc: {};
      netc.multiSvc = netc.multiSvc? netc.multiSvc: {};
      userDatas.service.split(',').forEach(e=>{
        // multiSvc.放課後等デイサービスなど
        netc.multiSvc[e] = netc.multiSvc[e]? netc.multiSvc[e]: {};
        Object.keys(newUserData).filter(f=>f.includes(e)).forEach(f=>{
          console.log('mulchservice kyes', f);
          // multiSvc.放課後等デイサービス.volumeなど
          const k = f.split('-')[1];
          netc.multiSvc[e][k] = newUserData[f]
        })
      })
    }
    // 口座情報をetc配下に
    newUserData.etc = newUserData.etc? newUserData.etc: {};
    // bank_infoが配列またはfalseyの場合は空白オブジェクトに設定
    if (!newUserData.etc.bank_info || Array.isArray(newUserData.etc.bank_info)) {
      newUserData.etc.bank_info = {};
    }
    bankInfoNames.forEach(e=>{
      if (newUserData[e]){
        newUserData.etc.bank_info[e] = newUserData[e];
        delete newUserData[e];
      }
    });
    // ストアの更新 必要なん？
    const userForEdit = {...newUserData};
    if (userForEdit.volume === '0'){
      userForEdit.volume = daysOfMonth - 8; // 原則の日数
      userForEdit.volumeStd = true;
    }
    else{
      userForEdit.volumeStd = false;
    }
    // volumeStdが残っていると支給提供量がリセットされるのを訂正
    // if (parseInt(parseInt(userForEdit.volume))) userForEdit.volumeStd = false;
    dispatch(Actions.editUser({...userForEdit}));
    // ここで書き込み送信を行う
    // ここではaパラメータ必須。削除と兼用しているため stdDateも送信する
    // 余分なユーザデータ配列が付与されているので削除
    // updateFutureを追加。次月以降も変更する
    const sendUserDt = {...newUserData, ...options || {}};
    delete sendUserDt.users;
    // 医療ケアタイプはtypeに格納して保存
    if (sendUserDt.icareType){
      sendUserDt.type += ',' + sendUserDt.icareType;
    }
    sendUserDt.date = stdDate;
    sendUserDt.etc = JSON.stringify(sendUserDt.etc);
    // SQLインジェクション対策：シングルクォートをエスケープ
    const escapedSendUserDt = escapeSqlQuotes(sendUserDt);
    let result = null;
    try {
      result = await dispatch(Actions.updateUser({...escapedSendUserDt, a:'sendUserWithEtc'}));
      dispatch(Actions.sortUsersAsync());
    } catch(e) {
      console.log(e);
      // エラー時は失敗を返すが、suppressNavigationがtrueの場合は処理を中断
      // 通常の処理（フォームリセットなど）は実行しない
      if (options.suppressNavigation) {
        return { success: false, error: e };
      }
      // 通常の処理では、エラー時でもフォームをリセットするなどの処理を継続
      result = null;
    }
    // 非同期処理中に画面遷移や再描画でフォームが消える場合があるため
    // reset対象が存在するときだけ実行する
    const formElm = document.querySelector(formId);
    if (formElm?.reset) {
      formElm.reset();
    }
    setRecentUser(uids);
    // 追加のとき、recentuserを保存できないためcontrolemodeにdispatchする
    // timestampを追加して直近のデータのみ扱うようにする
    if (!uids){
      const ts = new Date().getTime();
      const hno = newUserData.hno;
      const t = {...controleMode, appendUser:{hno, ts}};
      dispatch(Actions.setStore({controleMode: t}));
    }
    // suppressNavigationオプションがtrueの場合は画面遷移しない
    if (goBack && !options.suppressNavigation){
      history.push(goBack)
    }
    // else{
    //   history.goBack(); // 戻る
    // }
    
    // 成功時にhnoとuidを含むオブジェクトを返す（GotoUserAddictionやAddBrotherButtonからの呼び出しで使用するため）
    // resultがnullの場合や、result.data.resultがfalseの場合はエラーとして扱う
    if (!result || !result.data || !result.data.result) {
      return { success: false };
    }
    const uid = result.data.uid || null;
    return { success: true, hno: newUserData.hno, uid: uid };
  }


  const cancelSubmit = (goBack)=>{
    // dispatch(Actions.setSnackMsg('変更はキャンセルされました。', ''))
    if (goBack){
      history.push(goBack);
    }
    else{
      history.goBack();
    }
  }
  const deleteUser = ()=>{
    const uid = comMod.convUID(uids).num;
    if (!deleteConfirm.flg){
      setDeleteConfirm({
        flg: true, label: '削除実行', buttonClass: 'buttonStrong'
      });
      const errMsgDisp = document.querySelector(formId + ' .errMsg span');
      const msg = 
        `利用者の削除を行うと当月以降のこの利用者の操作に影響があります。` +
        `充分に注意して削除して下さい。利用停止の場合は利用停止の処理を行って下さい。`;
      errMsgDisp.textContent = msg;
      return false;
    }
    // storeから削除実行
    let prms = {
      uid, users, delete:true,
    }
    dispatch(Actions.editUser(prms));
    // ここではaパラメータ必須。削除と兼用しているため
    prms = {
      hid, bid, uid: uids, a: 'removeUser', date: stdDate,
    }
    dispatch(Actions.updateUser(prms));
  }
  // 管理・協力事業所ボタン用のhandleSubmitラッパー（画面遷移を抑制する）
  const handleSubmitWithoutNavigation = (e) => {
    return handleSubmit(e, false, { suppressNavigation: true });
  };
  // const lastUpdateStyle = {
  //   position: 'absolute',top: 8, right: 8, color: '#222', fontSize: '.8rem'
  // }
  const lastUpdateStr = lastUpdate? '最終更新: ' + lastUpdate: '';
  // 契約終了日は当月の日付のみ許可する
  // コンポーネントに渡すための日付範囲の指定文字列を作成する
  // const monthEnd = comMod.getDateEx(
  //   stdDate.split('-')[0], stdDate.split('-')[1], 0
  // ).dt;
  // const monthEndStr = comMod.formatDate(monthEnd, 'YYYY-MM-DD');
  const contractEndLimit = stdDate + ',2299-12-31'; 
  // フォーム内のパーツをくくるラッパーのスタイル
  // タブによって表示非表示を切り替える。
  // ついでにパデイィングの調整もやってる
  const [formPartsStyle, setFormPartsStyle] = useState({
    main: {display: 'flex', padding: '0 8px'},
    bank: {display: 'none', },
  })
  useEffect(()=>{
    if (tab === 0){
      setFormPartsStyle({
        main: {display: 'flex', padding: '0 8px'},
        bank: {display: 'none', },
      })
    }
    else{
      setFormPartsStyle({
        main: {display: 'none', },
        bank: {display: 'flex', },
      })
    }
  }, [tab]);
  const errMsgStyle={
    color: red[700], padding: 8, paddingLeft: 16, lineHight: 1.6,
    textAlign: 'justify',
  };
  const errMsgSpanStyle={lineHight: 1.6, fontSize: '.95rem',}
  const stopUseChangeHandler = (ev) => {
    setStopUse(ev.target.checked);
  }
  const stopUseComment = () => {
    if (stopUse && !thisUser.next){
      return (
        `利用停止処理が有効になっています。次月以降は表示されません。
        当月の利用や請求は通常通り処理されます。`
      )
    }
    else if (!stopUse && !thisUser.next){
      return (
        `利用停止をチェックして保存すると当月で利用停止処理を行います。次月以降は表示されません。
        当月の利用や請求は通常通り処理されます。`
      )
    }
    else if (stopUse && thisUser.next){
      return (
        `このユーザーの利用停止処理を行いますが当月以降に情報が
        存在するため完全に非表示にはなりません。${thisUser.next.slice(0, 7)}以降の情報を
        確認して下さい。`
      )
    }
    else {
      return (
        `利用停止をチェックして保存するとユーザーの利用停止処理を行いますが当月以降に情報が
        存在するため完全に非表示にはなりません。${thisUser.next.slice(0, 7)}以降の情報を
        確認して下さい。`
      )
    }
  }
  let defService = (serviceItems.length === 1 && addnew)
  ? serviceItems[0]: thisUser.service;
  if (!defService) defService = HOUDAY;
  if (!editOn && service) defService = service;
  // 口座情報削除ボタンスタイル設定
  const bankInfoDeleteButtonStyle = {
    ...formPartsStyle.bank, justifyContent: 'flex-end',
  }
  // 口座情報が存在しない場合は削除ボタンを表示しない
  if (bi && Object.keys(bi).length > 1){
    bankInfoDeleteButtonStyle.display = 'flex';
  }
  else{
    bankInfoDeleteButtonStyle.display = 'none';
  }
  // 日付入力の幅定義
  const dateInputStyle = {width: 150}


  const infoFromEtc = (svc) => {
    if (thisUser?.etc?.multiSvc?.[svc]) return thisUser.etc.multiSvc[svc];
    return {
      volume: thisUser.volume, startDate: thisUser.startDate,
      contractDate: thisUser.contractDate, contractEnd: thisUser.contractEnd,
      lineNo: thisUser.lineNo,
    }
  };

  const svcTitleStyle =  {
    padding: '8px 0 4px 8px', background: teal[50], 
    borderBottom: '1px solid ' + teal[900],
    marginTop: 8, marginLeft: 12,
    fontSize: '.7rem',
  }
  const multiServiceContractInfo = [HOUDAY, JIHATSU, HOHOU].map((svc, i)=>{
    if (multiSvcCnt && !multiSvcCnt.includes(svc)) return null;
    return (
      <div key={i}>
        <div style={svcTitleStyle}>{svc}</div>
        <div className='cntRow' style={formPartsStyle.main}>
          <sfp.Volume def={
              infoFromEtc(svc).volumeStd? '0': infoFromEtc(svc).volume
            }
            pName={svc + '-volume'}
          />
          <sfp.DateInput
            name={svc+'-startDate'} label={'利用開始日'} required
            def={infoFromEtc(svc).startDate} 
            wrapperStyle={dateInputStyle} helperTextShort
          />
          <sfp.DateInput
            name={svc+'-contractDate'} label={'契約日'} required
            def={infoFromEtc(svc).contractDate}
            wrapperStyle={dateInputStyle} helperTextShort
          />
          <sfp.DateInput
            name={svc+'-contractEnd'} label={'受給者証期限'}
            def={infoFromEtc(svc).contractEnd}
            limit={contractEndLimit}
            wrapperStyle={dateInputStyle} helperTextShort
          />
          <sfp.ContractLineNo
            // name={'endDate'} label={'契約終了日'}
            def={infoFromEtc(svc).lineNo} 
            pName={svc + '-lineNo'}

          />
        </div>
      </div>
    )
  });
  // 18歳以上の設定値
  const over18val = fdp(thisUser, 'etc.over18');
  // 口座情報の以外は非表示
  if (tab !== 1)  bankInfoDeleteButtonStyle.display = 'none';
  const lustUpdateIsThisMaonthStyle = (thisUser.date === stdDate)?
  {color: grey[600]}: {};

  // stdDate は 'yyyy-mm-dd' フォーマットの文字列です
  // 今日の日付から先月の初日を算出します（例：今日が10月中なら9月1日）
  const today = new Date();
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const stdDateObj = new Date(stdDate);
  // thisUser.next が存在し、かつ stdDate が先月の初日以降であれば true
  const showNextChangeButton = thisUser.next && (stdDateObj >= lastMonthStart);
  const isSoudan = soudanServiceNames.includes(curService);
  // 自治体の独自上限が存在するか
  const cities = com?.etc?.cities ?? []; // 市区町村定義配列
  const city = cities.find(e=>e.no === thisUser.scity_no); // 該当の市区町村
  const cityDokujiJougen = city?.dokujiJougen; // 該当の市区町村が独自上限額管理を持っているか

  return(<>
    {/* <Links tab={tab} settab={setTab}/> */}
    <div className={classes.userEditRoot}>
      <div className='outer'>
        <GoBackButton posX={80} posY={24} url={goBack}/>
        <div className='editTitle'>
          {titleStr}
          <div className='lastUpdate' style={lustUpdateIsThisMaonthStyle}>
            {lastUpdateStr}
          </div>
        </div>
        <form 
          id="fgr649hg" autoComplete="off"
          onKeyPress={(e)=>keyHandler (e)}
          style={{paddingTop: 8}}
        >
          <div className='cntRow' style={formPartsStyle.main}>
            <sfp.NameInput
              nameLname={'lname'} nameFname={'fname'}
              labelLname={'名字'} labelFname={'名'}
              required
              def={thisUser.name}
              names={names} setNames={setNames}
            />
            <sfp.NameInput
              nameLname={'klname'} nameFname={'kfname'}
              labelLname={'みょうじ'} labelFname={'なまえ'}
              required
              kana
              def={thisUser.kana}
              names={names} setNames={setNames}
            />
            <sfp.DateInput
              name={'birthday'} label={'生年月日'} required
              def={thisUser.birthday}
            />
          </div>

          <div className='cntRow' style={formPartsStyle.main}>
            <sfp.ServiceType 
              def={defService} setService={setCurService} 
              service={curService}
            />
            {!soudanServiceNames.includes(curService) && <>
              <sfp.UserType def={thisUser.type} />
              <sfp.IryouCareType def={thisUser.icareType} />
            </>}
            <sfp.HihokenNo def={thisUser.hno} uid={uids} hnoList={hnoList}/>
          </div>
          {curService === '複数サービス' &&
            <div className='cntRow' style={{...formPartsStyle.main, marginBottom: 12}}>
              <sfp.MultiService 
                def={defService} 
                multiSvcCnt={multiSvcCnt} setMultiSvcCnt={setMultiSvcCnt}
              />
            </div>
          }
          <div className='cntRow' style={formPartsStyle.main}>
            <sfp.PriceLimit def={thisUser.priceLimit} />
            <sfp.Scity
              def={[thisUser.scity, thisUser.scity_no]}
              label={'支給市区町村'} name={'scity'}
              labelNo={'番号'} nameNo={'scity_no'}
            />
            <sfp.KanriType def={thisUser.kanri_type} />
          </div>
          {curService !== '複数サービス' &&
            <div className='cntRow' style={formPartsStyle.main} >
              {/* <sfp.Volume def={
                  'volumeStd' in thisUser? '0': thisUser.volume
              } /> */}
              {!isSoudan && <>
                <sfp.Volume def={
                    thisUser.volumeStd? '0': thisUser.volume
                } />
                <sfp.DateInput
                  name={'startDate'} label={'利用開始日'} required
                  def={thisUser.startDate} 
                  wrapperStyle={dateInputStyle} helperTextShort
                />
              </>}
              <sfp.DateInput
                name={'contractDate'} label={'契約日'} required={!isSoudan}
                def={thisUser.contractDate}
                wrapperStyle={dateInputStyle} helperTextShort
              />
              <sfp.DateInput
                name={'contractEnd'} label={'受給者証期限'}
                def={thisUser.contractEnd}
                limit={contractEndLimit}
                wrapperStyle={dateInputStyle} helperTextShort
              />
              <sfp.ContractLineNo
                def={thisUser.lineNo}
                required={!isSoudan}
              />
            </div>
          }
          {curService === '複数サービス' && tab === 0 &&
            <div style={{marginTop: 32, marginBottom: 32}}>
              {multiServiceContractInfo}
            </div>
          }
          <div className='cntRow' style={formPartsStyle.main}>
            <sfp.NameInput
              nameLname={'plname'} nameFname={'pfname'}
              labelLname={'保護者名字'} labelFname={'保護者名'}
              required
              def={thisUser.pname}
              names={names} setNames={setNames}
            />
            <sfp.NameInput
              nameLname={'pklname'} nameFname={'pkfname'}
              labelLname={'みょうじ'} labelFname={'なまえ'}
              required
              kana
              def={thisUser.pkana}
              names={names} setNames={setNames}
            />
            <sfp.BrosersIndex def={thisUser.brosIndex} setBrosIndex={setBrosIndex} />
          </div>
          <div className='cntRow' style={formPartsStyle.main}>
            <sfp.MailInput
              name={'pmail'} label={'保護者メール'}
              def={thisUser.pmail}
            />
            <sfp.PhoneInput
              name={'pphone'} label={'保護者電話1'} required
              def={thisUser.pphone}
            />
            <sfp.PhoneInput
              name={'pphone1'} label={'保護者電話2'}
              def={thisUser.pphone1}
            />
          </div>

          <div className='cntRow' style={formPartsStyle.main}>
            <sfp.Belongs
              name={'belongs1'} label={'所属1'} options={belongs1List}
              def={thisUser.belongs1}
            />
            <sfp.Belongs
              name={'belongs2'} label={'所属2'} options={belongs2List}
              def={thisUser.belongs2}
            />
            <sfp.ClassRoom def={addnew?classroom: thisUser.classroom} />
            {addnew === false &&
              <div className={classes.stopUseButtonRoot}>
                <Button 
                  variant='contained'
                  onClick={()=>setOpenStopUse(true)}
                  startIcon={<EmojiPeopleIcon/>}
                >
                  利用停止
                </Button>
              </div>
            }
          </div>
          {/* // 拡張設定の表示を行う */}
          {extSetting && tab === 0 && <>
            <div style={{marginTop: 16}}></div>
            <div className='cntRow' style={formPartsStyle.main}>
              <sfp.Over18 def={over18val}/>
              <sfp.DokujiJougen def={thisUser?.etc?.dokujiJougen ?? ''} uid={uids}/>
              {cityDokujiJougen &&
                <UnivCheckbox
                  name={'dokujiJougenZero'} label={'独自上限を0円にする'}
                  def={thisUser?.etc?.dokujiJougenZero}
                />
              }
              <UnivCheckbox
                name={'sochiseikyuu'} label={'措置請求'}
                def={thisUser?.etc?.sochiseikyuu}
              />
              <sfp.NumInputGP
                name={'ageOffset'} label={'年齢調整'}
                def={thisUser?.etc?.ageOffset}
                decimalPlace={0} upper={5} lower={-5}
                wrapperStyle={{width: '90px'}}
              />
            </div>
            {thisUser?.etc?.dokujiJougen &&
              <div style={{paddingLeft: 16, fontSize: '.8rem', color: grey[600]}}>
                独自上限を削除するときは0を入力してから保存してください
              </div>
            }
          </>}
          {/* 利用停止の制御 ここだけコンポーネントで作成されたstateで制御される */}
          {openStopUse === true && tab === 0 &&
            <div className={'cntRow ' + classes.stopUseInner}>
              <div className='chkBox'>
                <FormControlLabel
                  control={<Checkbox
                    checked={stopUse}
                    onChange={(ev)=>stopUseChangeHandler(ev)}
                    color='primary'
                  />}
                  label='利用停止'
                />
              </div>
              <div className='disc'>
                {stopUseComment()}
              </div>
            </div>
          }
          {tab === 1 &&
            <div className='cntRow' style={formPartsStyle.bank}>
              <BankInfoFormsParts bankInfo={bankInfo} thisUser={thisUser} />

            </div>
          }
          <div className='cntRow' style={bankInfoDeleteButtonStyle}>
            <Button onClick={(e)=>handleSubmit(e, true)}>
              <span style={{color: red[800]}}>口座情報を削除して保存</span>
            </Button>
          </div>
          <div style={{...formPartsStyle.bank, height: 320}}></div>
          <div className='errMsg' style={errMsgStyle}>
            <span style={errMsgSpanStyle}></span><br></br>
            {/* 仮登録用のボタン */}
            <FormControlLabel style={tempInput.style}
              control={<Checkbox
                checked={tempInput.checked}
                onChange={(ev)=>{
                  let label = tempInput.label;
                  // if (tempInput.label === '仮登録' && ev.target.checked){
                  //   label = label + 'をする';
                  // }
                  setTempInput({...tempInput, label, checked: ev.target.checked})
                  // setSubmitDisable(!ev.target.checked);
                }}
              />}
              label={tempInput.label}
            />

          </div>
          {/* <sfp.TransferList 
            destList={destList} setDestList={setDestList} 
            uid={uids}
          /> */}
        </form>
        
        <NextUserDisp thisUser={thisUser} showNextChangeButton={showNextChangeButton} />
        <div className={classes.buttonWrapper}>
          
          {editOn && enableDelete &&
            <mui.ButtonGP
              // color='Error'
              addictionclass={classes[deleteConfirm.buttonClass]}
              label={deleteConfirm.label}
              onClick={deleteUser}
              id={'useredit-deleteuser'}
            />
          }
<GotoUserAddiction uid={uids} onBeforeNavigate={handleSubmit}/>
          <GotoKanriKyouryokuButton uid={uids} onBeforeNavigate={handleSubmitWithoutNavigation}/>
          <mui.ButtonGP
            color='secondary'
            label='キャンセル'
            onClick={()=>cancelSubmit(goBack)}
          />
          {sameName === false &&
            <mui.ButtonGP
              color='primary'
              label='保存'
              type="submit"
              disabled={scheduleLocked/* || submitDisable*/}
              onClick={handleSubmit}
            />
          }
          {sameName === true &&
            // <mui.ButtonGP
            //   addictionclass={lcClasses.sameNameButton}
            //   label='同姓同名として書き込み'
            //   type="submit"
            //   onClick={handleSubmit}
            // />
            <Button className={classes.sameNameButton}
              onClick={handleSubmit}
              disabled={scheduleLocked}
            >
              同姓同名の利用者として送信
            </Button>
          }
          { showNextChangeButton && (
            <Button 
              style={{ 
                backgroundColor: indigo[600], color: '#fff' 
              }}
              variant="contained"
              type="submit"
              disabled={scheduleLocked}
              onClick={(e) => handleSubmit(e, undefined, { updateFuture: 1 })}
            >
              次月以降も変更
            </Button>
          )}
          <button id={hiddenInput} style={{
            tabindex: '-1',width: 0,opacity: 0, marginInlineStart: 0,
          }}></button>
          {showNextChangeButton &&
            <div style={{paddingTop: 4, fontSize: '.7rem', color: red[600]}}>
              次月以降も変更をクリックすると、次月の情報も当月の内容で送信されます。利用者別加算などにご注意下さい。
            </div>
          }
          </div>
        </div>
        {/* <KeyListener/> */}
      </div>
    <ExtSettingDispSw extSetting={extSetting} setExrSetting={setExrSetting} />
    <SnackMsg {...snack} />
    <SchLokedDisplay/>
    <GetNextHist />
    {/* まともに動かない */}
    {/* <UnsavedChangesHandler 
      formID={formId.replace(/^#/, '')}
      submit={handleSubmit}
      cancel={cancelSubmit}
    /> */}
  </>)
}
export default UserEditNoDialog;