import React, { useEffect, useRef, useState } from 'react';
import red from '@material-ui/core/colors/red';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector } from 'react-redux';
import * as Actions from '../../Actions';
import * as comMod from '../../commonModule';
import { CheckBrunchUpdate } from '../common/CheckProgress';
import * as mui from '../common/materialUi';
import SnackMsg from '../common/SnackMsg';
import * as sfp from '../common/StdFormParts';
import {GoBackButton, LoadingSpinner, PermissionDenied, SendBillingToSomeState, ServiceNotice, SetUisCookieChkBox, StdErrorDisplay} from '../common/commonParts';
import teal from '@material-ui/core/colors/teal';
import blue from '@material-ui/core/colors/blue';
import grey from '@material-ui/core/colors/grey';
import { purple } from '@material-ui/core/colors';
import { Links } from './Setting';
import { Button, Checkbox, FormControlLabel, TextField, FormControl, InputLabel, MenuItem, Select, FormLabel, FormGroup } from '@material-ui/core';
import { didPtn, PERMISSION_DEVELOPER, PERMISSION_MANAGER, PERMISSION_STAFF } from '../../modules/contants';
import IconButton from '@material-ui/core/IconButton';
import Delete from '@material-ui/icons/Delete';

import AddCircleIcon from '@material-ui/icons/AddCircle';
import { HOHOU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import { handleSelectInputAuto, sendPartOfSchedule, sendUser, univApiCall } from '../../albCommonModule';
import { useHistory, useLocation } from 'react-router';
import { useParams } from 'react-router';
import { ReloadWarning } from './RegistedParams';
import { setDeepPath } from '../../modules/handleDeepPath';
import CheckIcon from '@material-ui/icons/Check';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import { getSchInitName } from '../schedule/schUtility/getSchInitName';
import { LC2024 } from '../../modules/contants';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { BorderLeft } from '@material-ui/icons';
import { HoikuHoumn } from '../common/AddictionFormParts';
import { fetchAnySchedule } from '../../modules/fetchAnySchedule';
import { permissionCheck, permissionCheckTemporary } from '../../modules/permissionCheck';
import { LinksTab } from '../common/commonParts';
import { extMenu as scheduleExtMenu, makeSchMenuFilter, menu as scheduleMenu } from '../schedule/Sch2';

const useStyles = makeStyles((theme) => ({
  checkBoxNested: {
    '& .MuiFormControlLabel-root': {marginLeft: 8, }
  },
  serviceTitle:{
    textAlign:'center', fontSize:'1.4rem', color:teal[800],
    margin:12,
  },
  innerTitle0 :{
    background: teal[50], borderBottom: "1px solid" + teal[800],
    color: teal[600],
    fontSize: '.8rem', padding:8,
  },
  innerTitle1 :{
    background: blue[50], borderBottom: "1px solid" + blue[800],
    color: blue[600],
    fontSize: '.8rem', padding:8,
  },
  innerContent:{
    padding: 8,
    '& .deleteTmplateText': {
      lineHeight: 1.6, marginTop: 8, marginBottom: 8, textAlign: 'justify',
    },
    '& .deleteTemplateButton': {
      marginBottom: 8, textAlign: 'right',
    },
    '& .text': {
      lineHeight: 1.6, marginTop: 8, marginBottom: 8, textAlign: 'justify',
    },
    '& .buttonWrap': {
      marginBottom: 8, textAlign: 'right',

    }

  },
  actualCostListRoot:{
    display: 'flex',
    '& .MuiFormControl-root': {
      width: 150,
      marginTop: 8,
    },
    '& .MuiIconButton-root': {
      padding: 8,
      marginRight: 16,
      // color: '#ef5350',
      color: red[200],
    },
  },
  actualCostAddRoot:{
    display: 'flex',
    paddingTop: 8,
    '& .MuiFormControl-root': {
      width: 150,
      marginRight: 16,
      marginTop: 8,
    },
    '& .MuiButtonBase-root': {
      padding: 8,
      marginTop: 16,
    },
  },
  deleteTemplateRoot: {
    width: 600, marginTop: 120, marginLeft: 'calc((100vw - 600px - 80px) / 2)',
    position: 'relative',
    '& .text': {
      padding: '0 24px', lineHeight: 1.5, textAlign: 'justify',marginTop: 16,
    }

  },
  setfavsch: {
    width: 600, marginTop: 120, marginLeft: 'calc((100vw - 600px - 80px) / 2)',
    position: 'relative',
    '& .text': {
      paddingLeft: 96, lineHeight: 1.5, textAlign: 'justify',marginTop: 8,
    }
  },
  setCloseDay: {
    width: 600, marginTop: 120, marginLeft: 'calc((100vw - 600px - 80px) / 2)',
    position: 'relative',
    '& .text': {
      paddingLeft: 96, lineHeight: 1.5, textAlign: 'justify',marginTop: 8,
    },
    '& .checkBoxes': {
      paddingLeft: 96, margin: '16px 0',
      '& .MuiFormControlLabel-root': {display: 'block', margin: '4px 0'},
    },
    '& .buttonWrap' : {
      paddingLeft: 96, textAlign: 'right', margin:'8px 0',
      '& .MuiButton-root': {marginLeft: 8}, 
    }

  },
  kubun: {
    padding: 4, marginBottom: 8,
    '& .select': {width: 120}
  }
}));
// 実費データを更新する
const FncUpdateActualCostOnSch = (schedule, users, acListS) => {
  const checkActualCostType = (value) => {
    if (value === null) return 'null';
    if (typeof value !== 'object') return typeof value;
    if (Array.isArray(value)) return 'Array';
    return 'Object';
  };
  const tSch = JSON.parse(JSON.stringify(schedule));
  const newSch = Object.keys(tSch)
    .filter(key => key.startsWith('UID'))
    .reduce((obj, key) => {
      obj[key] = tSch[key];
      return obj;
    }, {});
  const uids = Object.keys(newSch);
  uids.forEach(uid=>{
    const uSch = newSch[uid];
    const dids = Object.keys(uSch).filter(e=>e.match(didPtn));
    dids.forEach(did=>{
      const dSch = uSch[did];
      const actualCostType = checkActualCostType(dSch.actualCost);
      if (actualCostType === 'Object'){
        Object.keys(acListS).forEach(ac=>{
          if (dSch.actualCost[ac]){
            dSch.actualCost[ac] = acListS[ac];
          }
        });
      }
    });
  });
  const newUsers = JSON.parse(JSON.stringify(users));
  newUsers.forEach(e=>{
    if (e.etc && e.etc.template){
      ['weekday', 'schoolOff'].forEach(dayType=>{
        const actualCost = e.etc.template[dayType]?.actualCost;
        const actualCostType = checkActualCostType(actualCost);
        if (actualCostType === 'Object'){
          Object.keys(acListS).forEach(ac=>{
            if (actualCost[ac]){
              actualCost[ac] = acListS[ac];
            }
          });
        }
      })
    }
  });
  return {newSch, newUsers};
}

export const KubunSelect = (props) => {
  const classes = useStyles();
  const {data, noLabel=false} = props;
  const opts = [
    { value: 1, label: "区分１" },
    { value: 2, label: "区分２" },
    { value: 3, label: "区分３" },
  ];

  return(
    <div className={classes.kubun}>
      <FormControl className='select' disabled={props.disabled ?? false}>
        {!noLabel &&<InputLabel>時間区分</InputLabel>}
        <Select
          name="時間区分"
          defaultValue={data?.dAddiction?.["時間区分"] ?? 1}
        >
          {opts.map(opt => (
            <MenuItem value={opt.value}>{opt.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  )
}

export const EnchouSelect = (props) => {
  const classes = useStyles();
  const {data, noLabel=false} = props;
  const opts = [
    { value: 1, label: "１〜２時間" },
    { value: 2, label: "２時間以上" },
    { value: 3, label: "１時間未満" },
  ];

  return(
    <div className={classes.kubun} style={props.style ?? {}}>
      <FormControl className='select' disabled={props.disabled ?? false}>
        {!noLabel &&<InputLabel shrink>延長支援</InputLabel>}
        <Select
          name="延長支援"
          defaultValue={data?.dAddiction?.["延長支援"] ?? ""}
          displayEmpty
          inputProps={{ 'aria-label': 'Without label' }}
        >
          <MenuItem value="">未選択</MenuItem>
          {opts.map(opt => (
            <MenuItem value={opt.value}>{opt.label}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  )
}

const HoikuHoumnSelect = (props) => {
  const classes = useStyles();
  const {data, noLabel=false} = props;
  const opts = ['保訪', '複数支援'];
  return(
    <div className={classes.kubun} style={props.style ?? {}}>
      <FormControl className='select' disabled={props.disabled ?? false}>
        {!noLabel &&<InputLabel shrink>訪問種別</InputLabel>}
        <Select
          name="保育訪問"
          defaultValue={data?.dAddiction?.["保育訪問"] ?? ""}
          displayEmpty
          inputProps={{ 'aria-label': 'Without label' }}
        >
          {opts.map(opt => (
            <MenuItem value={opt}>{opt}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  )
  
}

// スケジュール用のfabを設定する
const SetFabSchButtons = () => {
  const classes = useStyles();
  return (
    <div className={classes.setfavsch}>
      <GoBackButton/>
      <SetUisCookieChkBox 
        p={comMod.uisCookiePos.useAddDeleteButtonOnFab}
        label='追加削除ボタンを利用する'
      />
      <div className='text'>
        予定実績‐月間などで表示される右下のボタンを設定します。「追加削除」ボタンにするか「削除」ボタンにするかを選択できます。
      </div>
      <SetUisCookieChkBox 
        p={comMod.uisCookiePos.useTemplatePaste}
        label='雛形複写ボタンを利用する'
      />
      <div className='text'>
        予定実績‐月間などで雛形複写ボタンを表示します。既存のスケジュールを雛形に置き換えます。
      </div>
    </div>
  )
}

// 休業日の設定を行います。
const SetCloseDay = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const history = useHistory();
  const allState = useSelector(s=>s);
  const {com, hid, bid} = allState;
  const ls = comMod.getLodingStatus(allState);
  // tureならその日は休業日にする
  const closeDaySetting = com?.ext?.closeDaySetting ?? {
    saturday: false, sunday: true, nationalHoliday: false, 
  }
  const [formVals, setFormVals] = useState(closeDaySetting);
  const [res, setRes] = useState({});
  useEffect(() =>{
    console.log(res, 'res');
  }, [res])
  const handleClick = async () => {
    const ext = {...com?.ext ?? {}, closeDaySetting: formVals}
    const prms = {
      a: "sendComExt",
      hid: com.hid,
      bid: com.bid,
      ext: JSON.stringify({...ext})
    }
    const r = await univApiCall(prms, 'E34176', setRes);
    if (r?.data?.result){
      dispatch(Actions.setSnackMsg('送信しました'))
      dispatch(Actions.setStore({com:{...com, ext: {...ext}}}))
      // schinitilizerを起動するため 該当ローカルストレージを削除する
      const schInitName = getSchInitName(hid, bid);
      localStorage.removeItem(schInitName);
    }
    else {
      dispatch(Actions.setSnackMsg('通信エラーが発生しました', 'warning'))

    }
  }

  if (!ls.loaded || ls.error) return null;
  return (
    <div className={classes.setCloseDay}>
      <GoBackButton/>
      <div className='text'>
        カレンダーの設定で土曜日・日曜日・祭日などを休業日にするかどうかを設定します。予定が設定されている月には反映されません。
      </div>
      <div className='checkBoxes'>
        <FormControlLabel
          control={
            <Checkbox
              checked={formVals.saturday}
              onChange={
                e => setFormVals({...formVals, saturday: e.target.checked})
              }
              color="primary"
            />
          }
          label="土曜日を休業日にする"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={formVals.sunday}
              onChange={
                e => setFormVals({...formVals, sunday: e.target.checked})
              }
              color="primary"
            />
          }
          label="日曜日を休業日にする"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={formVals.nationalHoliday}
              onChange={
                e => setFormVals({...formVals, nationalHoliday: e.target.checked})
              }
              color="primary"
            />
          }
          label="祭日を休業日にする"
        />

      </div>
      <div className='buttonWrap'>
        {res?.data?.result &&
          <span>
            <CheckIcon/>送信完了
          </span>
        }
        <Button
          variant='contained' color='secondary'
          onClick={()=>history.goBack()}
        >
          キャンセル
        </Button>
        <Button
          variant='contained' color='primary'
          onClick={()=>handleClick()}
        >
          書き込み
        </Button>
      </div>
    </div>
  )
}


const DleteUsersTemplate = ()  => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const allState = useSelector(state=>state);
  const {schedule, users, hid, bid, stdDate} = allState;
  const uidsList = getUidsWhoHasTemplate(users, schedule);
  const [res, setRes] = useState();
  const [resa, setResa] = useState([]);
  const [counts, setCounts] = useState(null);
  const history = useHistory();

  useEffect(()=>{
    // if (!counts) return false;
    const schEdited = resa.filter(e=>e && e.item==='schedule');
    const userEdited = resa.filter(e=>e && e.item==='user');
    console.log(schEdited, userEdited, 'schEdited, userEdited');
  }, [resa]);

  useEffect(()=>{
    const t = [...resa];
    t.push(res);
    setResa(t);
  }, [res])
  const handleClick = () => {
    // レスポンスバッファの初期化
    setResa([]);
    // usersの送信
    const sendUsersFunc = async (e, i) => {
      // 何故かイミュータブルが確保されていないのでここでオブジェクトのコピーを渡す
      const r = await sendUser({...e});
      r.item = 'user'; r.uid = e.uid; r.name = e.name;
      setRes(r);
    }
    // scheduleの送信
    const sendScheduleFunc = async (e) => {
      const r = await sendPartOfSchedule({...e})
      r.item = 'schedule';
      setRes(r);
    }
    const newSch = {};
    const newUsers = JSON.parse(JSON.stringify(users));
    let schEditCnt = 0, userEditCnt = 0;
    Object.keys(schedule).forEach(e=>{
      if (schedule[e].template){
        newSch[e] = JSON.parse(JSON.stringify(schedule[e]))
        delete newSch[e].template;
        schEditCnt = 1;
      }
    });
    sendScheduleFunc({hid, bid, date: stdDate, partOfSch: newSch})

    newUsers.forEach(e=>{
      if (e.etc && e.etc.template){
        delete e.etc.template;
        sendUsersFunc(e);
        userEditCnt++;
      }
    });
    setCounts({user: userEditCnt, schedule: schEditCnt});
    console.log(newUsers, newSch, 'newUsers, newSch,');
    const t = {...schedule, ...newSch};
    t.timestamp = new Date().getTime();
    dispatch(Actions.setStore({schedule: t, users: newUsers}));
    history.goBack();
  }
  if (!uidsList.length){
    return (<>
      <div className={classes.deleteTemplateRoot} style={{paddingTop: 20}}>
        <GoBackButton/>
        処理するユーザーがいません。
      </div>
    </>
    )
  }

  return(
    <div className={classes.deleteTemplateRoot}>
      <GoBackButton/>
      <ReloadWarning/>
      <div className='text'>
        {
          `予定実績登録で利用される${uidsList.length}人分の利用者別雛形を削除します。
          下記のボタンをクリックすると復活できませんのでご注意下さい。削除されるのは雛形だけです。
          実際の予定実績を削除するものではありません。`
        }
      </div>
      <div style={{marginTop: 40, textAlign: 'center'}}>
        <Button
          onClick={handleClick}
          variant='contained'
          color='secondary'
        >
          利用者別雛形を削除
        </Button>
      </div>
    </div>
  )
}

/**
 * スケジュールデータから実費項目のキーを抽出する関数。
 * 
 * @param {Object} schedule - 現在のスケジュールデータ。
 * @param {Object} nextSchedule - 次のスケジュールデータ。
 * @returns {Array} - 現在と次のスケジュールに含まれる全ての実費項目のキーの配列。
 * 
 * この関数は、`schedule` と `nextSchedule` の両方のデータから実費項目のキーを抽出し、
 * 重複を排除した上で全てのキーを配列として返します。
 * 
 * 内部で使用される `extractKeys` 関数は、与えられたデータオブジェクトから
 * UIDとDIDの形式に一致するキーを持つ実費項目を探索し、キーをセットに追加します。
 */
const getActualCostKeys = (schedule, nextSchedule) => {
  const extractKeys = (data) => {
    const keys = new Set();
    if (!data) return keys;
    if (typeof data !== 'object') return keys;
    Object.keys(data).filter(uid => /^UID\d+$/.test(uid)).forEach(uid => {
      Object.keys(data[uid]).filter(did => /^D\d+/.test(did)).forEach(did => {
        const actualCost = data[uid][did].actualCost;
        if (actualCost && typeof actualCost === 'object' && !Array.isArray(actualCost)) {
          Object.keys(actualCost).forEach(key => keys.add(key));
        }
      });
    });
    return keys;
  };

  const scheduleKeys = extractKeys(schedule);
  const nextScheduleKeys = extractKeys(nextSchedule);

  return Array.from(new Set([...scheduleKeys, ...nextScheduleKeys]));
};

const ActtualCostFormParts = (props) =>{
  const classses = useStyles();
  const actualConstNameInput = useRef(null);
  // const acList = useSelector(state => state.config.actualCostList);
  // const { acListS, setAclistS, newItem, setNewItem } = props;
  const { 
    acListS, setAclistS, acListS_Err, setAclistS_Err,
    acListS_Text, setAclistS_Text, setSnack, nextSchedule, schedule
  } = props;
  // // 実費設定入力用ステイト
  // const [acListS, setAclistS] = useState(acList);
  // // 新規要素用のステイト
  const [newItem, setNewItem] = useState({ name: '', value: '' })
  const [newItemErr, setNewItemErr] = useState({ name: false, value: false })
  const [newItemText, setNewItemText] = useState({ name: '', value: '' })
  const existActualCostKeys = getActualCostKeys(schedule, nextSchedule);
  // チェンジイベントハンドラ
  const handleChange = (ev) => {
    const name = ev.currentTarget.getAttribute('name');
    let val = ev.currentTarget.value;
    const t = { ...acListS };
    t[name] = val;
    setAclistS(t);
  }
  // ブラーイベントと入力確認
  const handleBlur = (ev) => {
    const name = ev.currentTarget.getAttribute('name');
    let val = ev.currentTarget.value;
    val = comMod.convHankaku(val);
    // 禁止文字の判定
    setAclistS({...acListS, [name]: val});
    if (isNaN(val)){
      setAclistS_Err({ ...acListS_Err, [name]: true })
      setAclistS_Text({ ...acListS_Text, [name]: '数値を入力してください。'})
    }
    else{
      setAclistS_Err({ ...acListS_Err, [name]: false })
      setAclistS_Text({ ...acListS_Text, [name]: '' })
    }
  }
  // クリックイベントハンドラ
  const handleClick = (ev) => {
    let name = ev.currentTarget.getAttribute('name');
    name = name.split('-')[1];
    if (existActualCostKeys.includes(name)){
      setSnack({msg: '使用済みの実費項目は削除できません。', severity: 'warning'});
      return false;
    }
    else {
      setSnack({msg: '', severity: ''});
    }
    const t = {...acListS}
    if (Object.keys(t).length === 1){
      setSnack({msg: '最後の一つは削除できません。', severity: 'warning'});
      return false;
    }
    delete t[name];
    setAclistS(t)
  }
  // 追加アイテムチェンジハンドラ
  const handleNewItemChange = (ev) =>{
    const key = ev.currentTarget.getAttribute('name');
    const v = ev.currentTarget.value;
    const t = {...newItem, [key]: v};
    setNewItem(t);

  }
  const handleNewItemBlur = (ev) => {
    const key = ev.currentTarget.getAttribute('name');
    let v = ev.currentTarget.value;
    if (key === 'value'){
      v = comMod.convHankaku(v);
      if (isNaN(v)){
        setNewItemErr({...newItemErr, [key]: true});
        setNewItemText({...newItemText, [key]: '数値を入力してください。'} )
      }
      else{
        setNewItemErr({...newItemErr, [key]: false});
        setNewItemText({...newItemText, [key]: ''} );
        setNewItem({...newItem, [key]: v});
      }
    }
    else{
      // 先頭/末尾の全角や類似プラス記号を半角+に正規化し、前後の全角/半角スペースをトリム
      const normalizeEdgePlus = (str) => {
        if (typeof str !== 'string') return '';
        let s = str.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');
        const plusClass = '[\\+＋﹢⁺➕✚∔]';
        s = s.replace(new RegExp('^' + plusClass + '+'), '+');
        s = s.replace(new RegExp(plusClass + '+$'), '+');
        return s;
      }
      const normalized = normalizeEdgePlus(v);
      if (normalized.match(sfp.forbiddenPtn)){
        setNewItemErr({ ...acListS_Err, [key]: true })
        setNewItemText({ ...acListS_Text, [key]: '利用できない文字です。'})
      }
      else{
        setNewItemErr({ ...acListS_Err, [key]: false })
        setNewItemText({ ...acListS_Text, [key]: ''})
        setNewItem({...newItem, [key]: normalized});
      }
    }
  }
  // 新規実費項目の追加
  // 実費項目選択用のステイトを追加して新規追加用のステイトを初期化する
  const handleAddClick = (ev) => {
    if (!newItem.name){
      setNewItemErr({ ...newItemErr, name: true });
      setNewItemText({ ...newItemText, name: '名前を入力してください' });
      return false;
    }
    else{
      setNewItemErr({ ...newItemErr, name: false });
      setNewItemText({ ...newItemText, name: '' });
    }
    if (!newItem.value) {
      setNewItemErr({ ...newItemErr, value: true });
      setNewItemText({ ...newItemText, value: '金額を入力してください' });
      return false;
    }
    else {
      setNewItemErr({ ...newItemErr, name: false });
      setNewItemText({ ...newItemText, name: '' });
    }
    if (newItemErr.name || newItemErr.value){
      return false;
    }
    setAclistS({...acListS, [newItem.name]: newItem.value});
    setNewItem({name:'', value:''});
    if (actualConstNameInput.current) {
      actualConstNameInput.current.focus();
    }  
  }
  
  const acctualCostListFP = Object.keys(acListS).map((e, i) => {
    return (
      <div className={classses.actualCostListRoot} key={i}>
        <TextField key={i}
          label={e}
          name={e}
          value={acListS[e]}
          onChange={(e) => handleChange(e)}
          onFocus={e=>handleSelectInputAuto(e)}
          onBlur={(e)=>handleBlur(e)}
          error={acListS_Err[e]}
          helperText={acListS_Text[e]}
        />
        <IconButton 
          name={'delete-' + e}
          onClick={(e)=>handleClick(e)}
          color={'primary'}
        >
          <Delete />
        </IconButton>
      </div>
    )
  });
  // これを関数コンポーネントにすると変更するたびに再レンダリングが発生する
  // 単純にノードを返す変数にすればok
  // イベントもステイトも外部に保有しているからだと思われる
  const acctualCostAddFP = (
    <div className={classses.actualCostAddRoot}>
      <TextField key='name'
        label='名前'
        name='name'
        value={newItem.name}
        onChange={(e) => handleNewItemChange(e)}
        onBlur={(e)=>handleNewItemBlur(e)}
        onFocus={e=>handleSelectInputAuto(e)}
        error={newItemErr.name}
        helperText={newItemText.name}
        inputRef={actualConstNameInput}
      />
      <TextField key='value'
        label='金額'
        name='value'
        value={newItem.value}
        onChange={(e) => handleNewItemChange(e)}
        onBlur={(e) => handleNewItemBlur(e)}
        onFocus={e=>handleSelectInputAuto(e)}
        error={newItemErr.value}
        helperText={newItemText.value}
      />
      <IconButton
        name='add'
        onClick={(e) => handleAddClick(e)}
        color='primary'
      >
        <AddCircleIcon />
      </IconButton>

    </div>
  )
  return (<>
    <div className='acctualCosts'>
      {acctualCostListFP}
    </div>
    <div className='acctualCosts'>
      {acctualCostAddFP}
    </div>
  </>)
}
// スケジュールテンプレートを保有するuidを格納する
const getUidsWhoHasTemplate = (users, schedule) => {
  const tmpUids = [];
  Object.keys(schedule).forEach(e=>{
    // 数値のみ格納
    if (schedule[e].template) tmpUids.push(e.replace(/[^0-9]/g, ''));
  });
  users.forEach(e=>{
    if (e.etc && e.etc.template) tmpUids.push(e.uid);
  });
  const templateUsers = Array.from(new Set(tmpUids)).map(e=>{
    return (
      {uid: e, name: comMod.getUser(e, users).name}
    )
  });
  return templateUsers;
}

// テンプレートに格納されているテンプレートの数を確認しテンプレート削除画面へのリンクを
// 提供する
// テンプレートはusersとscheduleにそれぞれ格納されているので個別に確認する。
const LinkScheduleTemplateDelete = () => {
  const users = useSelector(state=>state.users);
  const schedule = useSelector(state=>state.schedule);
  const histry = useHistory()
  // スケジュールテンプレートを保有するuidを格納する
  const templateUsers = getUidsWhoHasTemplate(users, schedule);
  const dispLen = 10;
  let usersStr = '';
  templateUsers.slice(0, dispLen).forEach(e=>{
    usersStr += e.name + ', ';
  });
  if (!usersStr){
    usersStr = '利用者別雛形が設定されている利用者はいません'
  }
  else{
    usersStr = usersStr.replace(/\,\s$/, '');
    if (templateUsers.length > dispLen){
      usersStr = usersStr + `など${templateUsers.length}人の雛形が設定済みです。(敬称略)`;
    }
    else{
      usersStr = usersStr + ` ${templateUsers.length}人の雛形が設定済みです。(敬称略)`;
    }
  }

  return (<>
    <div className='deleteTmplateText'>{usersStr}</div>
    <div className='deleteTemplateButton'>
      <Button
        onClick={()=>{histry.push('/setting/schedule/deletetemplate')}}
        variant='contained'
      >
        一括削除へ
      </Button>
    </div>
  </>);
}
export const ScheduleSettings = () => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const allState = useSelector(state=>state);
  const {
    service, serviceItems, config, com, stdDate, users, account, hid, bid, schedule
  } = allState;
  const template = useSelector(state => state.scheduleTemplate);
  const thisServeice = (service) ? service : serviceItems[0];
  const configAcList = useSelector(state => state.config.actualCostList);
  const comAcList = useSelector(state => state.com?.etc?.actualCostList);
  const ls = comMod.getLodingStatus(allState);
  const location = useLocation().pathname;
  const [snack, setSnack] = useState({msg: '', severity: ''})
  const [nextSchedule, setNextSchedule] = useState(null);
  const histry = useHistory();
  const isFromScheduleRoute = location.startsWith('/schedule/');
  const scheduleMenuFilter = makeSchMenuFilter(stdDate);
  // 相談支援の場合のフラグ
  const soudanService = [SYOUGAI_SOUDAN, KEIKAKU_SOUDAN];
  const isSoudan = soudanService.includes(service);
  // テンプレートの初期値読み込み
  const wd = comMod.findDeepPath(
    template, [thisServeice, 'weekday']
  );
  const so = comMod.findDeepPath(
    template, [thisServeice, 'schoolOff']
  );
  
  // 実費設定入力用ステイト
  const [acListS, setAclistS] = useState(comAcList || configAcList);
  // エラーステイト
  let tmp = {};
  Object.keys(tmp).map(_ =>{
    tmp._ = false;
  });
  // テキストステイト
  const [acListS_Err, setAclistS_Err] = useState(tmp);
  Object.keys(tmp).map(_ => {
    tmp._ = '';
  });
  const [acListS_Text, setAclistS_Text] = useState(tmp);

  // 入力用のステイト
  const [wdTemplate, setWdTemplate] = useState(wd);
  const [soTemplate, setSoTemplate] = useState(so);
  
  // 送迎先用のstate
  const [destList, setDestList] = useState(com?.etc?.transferList || config.transferList);

  // 計画支援時間関係ステート
  const [timetableTemp, setTimetableTemp] = useState(com?.ext?.timetableTemplate ?? false);
  const [useUsersPlanAsTemplate, setUseUsersPlanAsTemplate] = useState(com?.ext?.useUsersPlanAsTemplate ?? false);
  const [usersPlanFindOtherDay, setUsersPlanFindOtherDay] = useState(com?.ext?.usersPlanFindOtherDay ?? false);
  const [updateActualCostOnSch, setUpdateActualCostOnSch] = useState(false);

  useEffect(() => {
    const fetchNextSchedule = async () => {
      const date = new Date(stdDate);
      date.setMonth(date.getMonth() + 1);
      const nextMonthDate = date.toISOString().slice(0, 7) + '-01';
      const nextSch = await fetchAnySchedule({ date: nextMonthDate, hid, bid });
      if (nextSch && Object.keys(nextSch).some(key => /^UID\d+$/.test(key))) {
        return;
      }
      setNextSchedule(nextSch);
    };
    if (ls.loaded && !ls.error){
      fetchNextSchedule();
    }
  }, [stdDate, hid, bid]);

  const handleSubmit = async(e) =>{
    e.preventDefault();
    // 平日のデータと休日のデータをそれぞれ取得
    const inputsWd = document.querySelectorAll('#uio908 .schTmpWd input');
    const inputsSo = document.querySelectorAll('#uio908 .schTmpSo input');
    const selectsWd = document.querySelectorAll('#uio908 .schTmpWd select');
    const selectsSo = document.querySelectorAll('#uio908 .schTmpSo select');
    const fdWd = comMod.getFormDatas([inputsWd, selectsWd], false, true);
    const fdSo = comMod.getFormDatas([inputsSo, selectsSo], false, true);
    // 実費項目
    [fdWd, fdSo].map(formsVal=>{
      if (!Object.keys(formsVal).length) return null;
      Object.keys(formsVal.actualCost).map(e => {
        if (formsVal.actualCost[e]) {
          formsVal.actualCost[e] = acListS[e];
        }
        else {
          delete formsVal.actualCost[e];
        }
      });
    });
    // 送迎が配列になっているので処理を追加
    [fdWd, fdSo].map(formsVal => {
      formsVal.transfer = [];
      formsVal.transfer[0] =
        (formsVal.pickup !== undefined) ? formsVal.pickup : '';
      formsVal.transfer[1] =
        (formsVal.send !== undefined) ? formsVal.send : '';
      delete formsVal.pickup; delete formsVal.send;
    });
    // 足りない項目を追加
    [fdWd, fdSo].map(formsVal => {
      formsVal.service = thisServeice;
    });
    fdWd.offSchool = 0;
    fdSo.offSchool = 1;
    if(!checkValueType(fdWd.dAddiction, "Object")) fdWd.dAddiction = {};
    fdWd.dAddiction["時間区分"] = fdWd["時間区分"];
    if(!fdWd.dAddiction["時間区分"]) delete fdWd.dAddiction["時間区分"];
    delete fdWd["時間区分"];
    fdWd.dAddiction["延長支援"] = fdWd["延長支援"];
    if(!fdWd.dAddiction["延長支援"]) delete fdWd.dAddiction["延長支援"];
    delete fdWd["延長支援"];
    if(!checkValueType(fdSo.dAddiction, "Object")) fdSo.dAddiction = {};
    fdSo.dAddiction["時間区分"] = fdSo["時間区分"];
    if(!fdSo.dAddiction["時間区分"]) delete fdSo.dAddiction["時間区分"];
    delete fdSo["時間区分"];
    fdSo.dAddiction["延長支援"] = fdSo["延長支援"];
    if(!fdSo.dAddiction["延長支援"]) delete fdSo.dAddiction["延長支援"];
    delete fdSo["延長支援"];
    fdWd.dAddiction["保育訪問"] = fdWd["保育訪問"];
    if(!fdWd.dAddiction["保育訪問"]) delete fdWd.dAddiction["保育訪問"];
    delete fdWd["保育訪問"];


    const tmp = {...template}
    console.log('dist', { scheduleTemplate: { ...tmp } });
    // console.log("fdWd", fdWd);
    // console.log("fdSo", fdSo);
    tmp[thisServeice] = { ...tmp[thisServeice], weekday: { ...fdWd } };
    tmp[thisServeice] = { ...tmp[thisServeice], schoolOff: { ...fdSo } };
    const tmp1 = { scheduleTemplate: { ...tmp } }
    // テンプレートの更新
    dispatch(Actions.setStore({...tmp1}));
    // com.etcに記述する内容
    const etcSelects = document.querySelectorAll('#uio908 .comEtc select');
    const comEtc = comMod.getFormDatas([etcSelects], false, true);
    const newComExt = {...(com?.ext ?? {})};
    newComExt.timetableTemplate = timetableTemp;
    newComExt.useUsersPlanAsTemplate = useUsersPlanAsTemplate;
    newComExt.usersPlanFindOtherDay = usersPlanFindOtherDay;
    const sendComExtParams = {a: "sendComExt", hid, bid, ext: JSON.stringify(newComExt)};
    const sendComExtRes = await univApiCall(sendComExtParams);
    if(!sendComExtRes?.data?.result) {
      setSnack({msg: "通信エラーが発生しました", severity: 'error'})
    };
    const defaultEtc = {...com.etc}; // 追加 2023/04/08
    // comの更新とconfigの更新
    const tmp2 = { 
      ...com, 
      etc: { 
        ...defaultEtc,
        ...tmp1, ...comEtc, 
        actualCostList: acListS, 
        transferList: destList,
      },
      ext: newComExt
    };
    // stateに追加されていない送迎場所を取得する
    const newDest = document.querySelector('input[name=dest]')?.value;
    const tmp3 = {...tmp2}; // 参照渡しでstringfyされてしまうので一旦退避
    const tmp4 = {
      ...config,
      actualCostList: acListS,
      transferList: [...destList]
    }
    // 追加ボタンが押されていない新しい送迎先の処理
    if (newDest){
      tmp4.transferList.push(newDest);
      tmp3.etc.transferList.push(newDest);
    }
    // --- ここまでが送信内容の構築
    dispatch(Actions.setStore({ com: tmp2 , config: tmp4}));
    // dbに送信
    const tmp5 = {...tmp3, date: stdDate}
    dispatch(Actions.sendBrunch(tmp5));
    if (updateActualCostOnSch){
      const {newSch, newUsers} = FncUpdateActualCostOnSch(schedule, users, acListS);
      const resSch = await univApiCall({
        a: 'sendPartOfSchedule', hid, bid, date:stdDate, partOfSch: newSch
      });
      if (!resSch?.data?.result){
        setSnack({msg: "実費項目 予定実績情報更新に失敗しました E34390", severity: 'error'})
      }
      const etcs = newUsers.map(e=>({uid: e.uid, etc:e.etc}));
      const userEtcParams = {hid, bid, etcs, date: stdDate };
      const resUsersEtc = await comMod.sendUserEtcMulti(userEtcParams);
      if (resUsersEtc?.data?.resultfalse){
        setSnack({msg: "実費項目 利用者情報更新に失敗しました E34391", severity: 'error'})
      }

      dispatch(Actions.setStore({
        schedule: {...schedule, ...newSch},
        users: newUsers,
      }))
    }
  }
  const cancelSubmit = (e) =>{
    e.preventDefault();
    console.log('canceled');
    dispatch(Actions.resetStore());
  }
  const serviceTitle = (thisServeice === '放課後等デイサービス')?
  classes.innerTitle0: classes.innerTitle1;
  if (!ls.loaded){
    return <LoadingSpinner/>
  }
  else if (ls.error){
    const errPrms = {
      errorText: `ロード中にエラーが発生しました。`,
      errorSubText: '', errorId: 'E55608', errorDetail:ls.detail,
    }
    return (
      <div className="AppPage setting">
        <StdErrorDisplay {...errPrms} />
      </div>
    )
  }
  if (!users.length){
    const errPrms = {
      errorText: `ユーザーが一人も登録されていません。
                  こちらの設定は一人以上のユーザーを登録してから実施して下さい。`, 
      errorSubText: '', errorId: 'E55609', errorDetail:''
    }
    return (
      <div className="AppPage setting">
        <StdErrorDisplay {...errPrms} />
      </div>
      
    )
  }
  if (location.includes('deletetemplate')){
    return (<DleteUsersTemplate/>)
  }
  if (location.includes('setfabschbuttons')){
    return (<SetFabSchButtons/>)
  }
  if (location.includes('setcloseday')){
    return (<SetCloseDay/>)
  }
  const permission = comMod.parsePermission(account)[0][0];
  const closeDaySetting = com?.ext?.closeDaySetting ?? {};
  const closeDayStr = Object.keys(closeDaySetting).reduce((str, e)=>{
    if (e === 'nationalHoliday' && closeDaySetting.nationalHoliday){
      str += '祭日 : 休業日 / ';
    }
    if (e === 'nationalHoliday' && !closeDaySetting.nationalHoliday){
      str += '祭日 : 稼働日 / ';
    }
    if (e === 'sunday' && closeDaySetting.sunday){
      str += '日曜 : 休業日 / ';
    }
    if (e === 'sunday' && !closeDaySetting.sunday){
      str += '日曜 : 稼働日 / ';
    }
    if (e === 'saturday' && closeDaySetting.saturday){
      str += '土曜 : 休業日 / ';
    }
    if (e === 'saturday' && !closeDaySetting.saturday){
      str += '土曜 : 稼働日 / ';
    }
    return str;
  }, '');
  // 相談支援用
  if (isSoudan){
    return (<>
      {isFromScheduleRoute ? (
        <LinksTab
          menu={scheduleMenu}
          menuFilter={scheduleMenuFilter}
          extMenu={scheduleExtMenu}
        />
      ) : (
        <Links />
      )}
      <div className="AppPage setting">
        <CheckBrunchUpdate inline/>
        <div style={{height: 16}}></div>
        <form id="uio908">
          <div className={serviceTitle}>
            実費雛形・{thisServeice}
          </div>
          <div className='templatewrappInnner'>

            <div className='cntRow schTmpWd'>
              <sfp.ActualCostCheckBox
                  key={0} value={wdTemplate} actualCostList={acListS}required size='middle'
              />
            </div>
          </div>
          <div className={classes.innerTitle0}>
            実費項目
          </div>
          <div className={classes.innerContent}>

            <ActtualCostFormParts 
              acListS={acListS} setAclistS={setAclistS}
              acListS_Err={acListS_Err} setAclistS_Err={setAclistS_Err}
              acListS_Text={acListS_Text} setAclistS_Text={setAclistS_Text}
              setSnack={setSnack} nextSchedule={nextSchedule} schedule={schedule}
              // newItem={newItem} setNewItem={setNewItem}
            />
            <div style={{height:16}}></div>
          </div>

        </form>
        <div className='buttonWrapper'>
          <mui.ButtonGP
            color='secondary' label='キャンセル' onClick={cancelSubmit}
          />
          <mui.ButtonGP
            color='primary' label='送信' type="submit" onClick={handleSubmit}
          />
        </div>
      </div>
      <SnackMsg {...snack}/>
    </>)
    

  }
  return (<>
    {isFromScheduleRoute ? (
      <LinksTab
        menu={scheduleMenu}
        menuFilter={scheduleMenuFilter}
        extMenu={scheduleExtMenu}
      />
    ) : (
      <Links />
    )}
    <div className="AppPage setting">
      <CheckBrunchUpdate inline/>
      <div style={{height: 16}}></div>
      <form id="uio908">
        <div className='templateWrappOuter'>
          <div className={serviceTitle}>
            予定雛形・平日・{thisServeice}
          </div>
          <div className='templatewrappInnner'>
            <div className='cntRow schTmpWd'>
              <sfp.TimeInput
                name='start' label='開始'
                value={wdTemplate}
                required size='middle'
              />
              <sfp.TimeInput
                name='end' label='終了'
                value={wdTemplate}
                required size='middle'
              />
              <sfp.Transfer
                name='pickup' label='迎え'
                value={wdTemplate}
                required size='middle'
              />
              <sfp.Transfer
                name='send' label='送り'
                value={wdTemplate}
                required size='middle'
              />
            </div>
            <div className='cntRow schTmpWd'>
              {service !== HOHOU && <>
                <KubunSelect data={wdTemplate} />
                <EnchouSelect data={wdTemplate} />
              </>}
              {service === HOHOU && <>
                <HoikuHoumnSelect data={wdTemplate} />
              </>}
            </div>
            <div className='cntRow schTmpWd'>
              <sfp.ActualCostCheckBox
                key={0}
                value={wdTemplate}
                actualCostList={acListS}
                required size='middle'
              />
            </div>
          </div>
          {service !== HOHOU && <>
            <div className={serviceTitle}>
              休校日
            </div>
            <div className='templatewrappInnner'>
              <div className='cntRow schTmpSo'>
                <sfp.TimeInput
                  name='start' label='開始'
                  value={soTemplate}
                  required size='middle'
                />
                <sfp.TimeInput
                  name='end' label='終了'
                  value={soTemplate}
                  required size='middle'
                />
                <sfp.Transfer
                  name='pickup' label='迎え'
                  value={soTemplate}
                  required size='middle'
                />
                <sfp.Transfer
                  name='send' label='送り'
                  value={soTemplate}
                  required size='middle'
                />
              </div>
              <div className='cntRow schTmpSo'>
                <KubunSelect data={soTemplate} />
                <EnchouSelect data={soTemplate} />
              </div>
              <div className='cntRow schTmpSo'>
                <sfp.ActualCostCheckBox
                  key={1}
                  value={soTemplate}
                  actualCostList={acListS}
                  required size='middle'
                />
              </div>
            </div>
          </>}
          
          {/* {stdDate >= LC2024 && <>
            <div className={serviceTitle}>
              ひな形優先度
            </div>
            <div className='templatewrappInnner'>
              <div className='cntRow schTmpWd'>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={timetableTemp}
                      color='primary'
                      onChange={e => {setTimetableTemp(e.target.checked)}}
                    />
                  }
                  label="計画支援時間より利用者別ひな形を優先する"
                />
              </div>
              <div style={{fontSize: '.8rem', color: red[600]}}>
                この設定は現段階で有効ではありません。
              </div>

            </div>
          
          </>} */}


        </div>

        
        <div className={classes.innerTitle0}>
          休業日設定
        </div>
        <div className={classes.innerContent}>
          <div className='text'>
            カレンダーの設定で土曜日・日曜日・祭日などを休業日にするかどうかを設定します。予定が設定されている月には反映されません。
          </div>
          <div className='text'>
            現在の設定  {
              closeDayStr.replace(/\s\/\s$/, '') || '設定がありません'
          }</div>
          <div className='buttonWrap'>
            <Button
              onClick={()=>{histry.push('/setting/schedule/setcloseday/')}}
              variant='contained'
            >
              休業日設定へ
            </Button>

          </div>
        </div>


        <div className={classes.innerTitle0}>
          利用者別予定雛形
        </div>
        <div className={classes.innerContent}>
          <LinkScheduleTemplateDelete/>
          <div style={{height:16}}></div>
          <div className='deleteTmplateText'>
            利用者別雛形の利用方法を設定できます。
          </div>
          <div className='deleteTemplateButton'>
            <Button
              onClick={()=>{histry.push('/setting/schtmltconfig')}}
              variant='contained'
            >
              雛形設定
            </Button>
          </div>

        </div>
        {stdDate >= LC2024 && <>
          <div className={serviceTitle}>
            計画支援時間のひな形利用
          </div>
          <div className='templatewrappInnner'>
            <div className=' schTmpWd'>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={useUsersPlanAsTemplate}
                    color='primary'
                    onChange={e => {setUseUsersPlanAsTemplate(e.target.checked)}}
                  />
                }
                label="計画支援時間をひな形として利用する"
              />
              <div className={classes.checkBoxNested}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={usersPlanFindOtherDay}
                      color='primary'
                      onChange={e => {setUsersPlanFindOtherDay(e.target.checked)}}
                    />
                  }
                  label="該当する曜日が存在しないときは別の曜日から支援時間を設定する"
                  disabled={!useUsersPlanAsTemplate}
                />
              </div>

            </div>
            <div style={{marginTop: 8, fontSize: '.8rem', color: red[600]}}>
              この設定はベータ提供中です。
            </div>

          </div>
        
        </>}
        <div className={classes.innerTitle0}>
          予定実績ページでのボタン設定
        </div>
        <div className={classes.innerContent}>
          <div className='text'>
            予定実績で利用するボタンの設定を行います。
          </div>
          <div className='buttonWrap'>
            <Button
              onClick={()=>{histry.push('/setting/schedule/setfabschbuttons')}}
              variant='contained'
            >
              ボタン設定へ
            </Button>

          </div>
        </div>

        <div className={classes.innerTitle0}>
          計算方法
        </div>
        <div className={classes.innerContent}>
          <sfp.SetOccupancyCalc />
        </div>
        <div className={classes.innerTitle0}>
          実費項目
        </div>
        <div style={{padding: 8, fontSize: 12, color: grey[800], lineHeight: 1.5}}>
          名前の先頭または末尾に+が付いている項目は欠席時も計上されます。<br></br>
          例）「手帳代+」、「+おやつキャンセル」など。
        </div>
        <div className={classes.innerContent}>

          <ActtualCostFormParts 
            acListS={acListS} setAclistS={setAclistS}
            acListS_Err={acListS_Err} setAclistS_Err={setAclistS_Err}
            acListS_Text={acListS_Text} setAclistS_Text={setAclistS_Text}
            setSnack={setSnack}
            setNextSchedule={setNextSchedule} schedule={schedule}
            // newItem={newItem} setNewItem={setNewItem}
          />
          <div className={classes.innerContent}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={updateActualCostOnSch}
                  color='primary'
                  onChange={e => {setUpdateActualCostOnSch(e.target.checked)}}
                />
              }
              label="実費項目の金額変更を予定実績に反映させる"
            />
          </div>

          {updateActualCostOnSch && <>
            <div style={{
              marginTop: -8, color: red[800], fontSize: '0.8rem', paddingLeft: 40,
              lineHeight: 1.5
            }}>
              実費項目の変更を予定実績に反映させると、予定実績全体の更新になります。<br></br>
              他端末の同時操作への影響があります。また、売上・利用者請求額が変更になります。<br></br>
              反映は慎重に行ってください。
            </div>
          </>}
          <div style={{height:16}}></div>
        </div>
        <div className={classes.innerTitle0}>
          送迎先
        </div>
        <div style={{padding: 8, fontSize: 12, color: grey[800], lineHeight: 1.5}}>
          名前の先頭または末尾に*（アスタリスク）が付いている送迎先は送迎加算が算定されません。<br></br>
          例）「徒歩*」、「*家族送迎」など。
        </div>
        <div className={classes.innerContent}>
          <sfp.TransferListGlobal 
            destList={destList} setDestList={setDestList} 
          />
        </div>
        <div style={{height: 16}}></div>
        {permissionCheck(PERMISSION_MANAGER, account) && <>
          <div className={classes.innerTitle0}>
            あるふぁみ予約
          </div>
          <div className={classes.innerContent}>
            <div className='text'>
              あるふぁみマイページでの予約設定を行います。
            </div>
            <div className='buttonWrap'>
              <Button
                onClick={()=>{histry.push('/setting/schedule/alfami')}}
                variant='contained'
              >
                あるふぁみ予約設定へ
              </Button>
            </div>
          </div>
        </>}
      </form>
      <div className='buttonWrapper'>
        <mui.ButtonGP
          color='secondary'
          label='キャンセル'
          onClick={cancelSubmit}
        />
        <mui.ButtonGP
          color='primary'
          label='送信'
          type="submit"
          onClick={handleSubmit}
        />
      </div>
      <ServiceNotice />
    </div>
    <SnackMsg {...snack}/>

  </>);
}