import React, { useEffect, useState } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Dialog from '@material-ui/core/Dialog';
import * as comMod from '../../commonModule'
import { HOHOU, HOUDAY, JIHATSU } from '../../modules/contants';
import * as albcm from '../../albCommonModule'
import { useDispatch, useSelector } from 'react-redux';
import * as mui from '../common/materialUi';
import * as Actions from '../../Actions';
import CancelIcon from '@material-ui/icons/Cancel';
import PersonIcon from '@material-ui/icons/Person';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import Typography from '@material-ui/core/Typography';
import { blue } from '@material-ui/core/colors';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import * as sfp from '../common/StdFormParts';
import * as afp from '../common/AddictionFormParts';
import red from '@material-ui/core/colors/red';
import indigo from '@material-ui/core/colors/indigo';
import { useLocation, useHistory } from 'react-router-dom';
import BlockRoundedIcon from '@material-ui/icons/BlockRounded';
import PeopleAltIcon from '@material-ui/icons/PeopleAlt';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import SchTableBody2 from './SchTableBody2';
import IconButton from '@material-ui/core/IconButton';
import ArrowForwardIosRoundedIcon from '@material-ui/icons/ArrowForwardIosRounded';
import ArrowBackIosRoundedIcon from '@material-ui/icons/ArrowBackIosRounded';
import teal from '@material-ui/core/colors/teal';
import { AddCircle, CenterFocusStrong, Edit } from '@material-ui/icons';
import { TextGP, useStyles } from '../common/FormPartsCommon';
import { faSleigh } from '@fortawesome/free-solid-svg-icons';
import { setLocalStorageItemWithTimeStamp } from '../../modules/localStrageOprations';
import { EditUserButton } from '../common/commonParts';
import { timeDifferenceInMinutes } from '../../modules/timeDifferenceInMinutes';
import { getJikanKubunAndEnchou } from '../../modules/elapsedTimes';
import { Menu, MenuItem, colors } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import PauseIcon from '@material-ui/icons/Pause';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { jihatsuKasan } from '../Billing/BlCalcData2021';

const hiddenInput = 'hiddenInput';
const formId = 'dkkjug53' 

const useStyle = makeStyles((theme)=>({
  root :{
    ' & .MuiDialog-paperWidthSm':{
      // minWidth:100,
      width: 700,
      maxWidth: 700,
    }
  },
  menuItemWrap: {
    // flexWrap: 'wrap',
    maxWidth: 480,
    display: 'block',
    '& .inner': {display: 'flex'},
    '& .text': {fontSize: '.6rem',whiteSpace: 'normal', wordBreak: 'break-all',
    },
    // '& .MuiPaper-root': {maxWidth: 400}
  },
  absenceButton: {
    backgroundColor: red[500],
    color: "#fff",
    '&:hover' : {
      backgroundColor: red[600],
    },
  },
  allSubmitButton: {
    backgroundColor: indigo[700],
    color: "#fff",
    '&:hover': {
      backgroundColor: indigo[800],
    },
  },
  holidayInputRoot:{
    '& .MuiSelect-root':{
      paddingTop: 10,
    },
  },
  userScheduleLinkButton:{
    padding: 12,
    paddingTop: 16,
    paddingBottom: 0,
  },
  editUserButtonWrap: {
    paddingTop: 16,
  },
  thisBttonWrap:{
    display:'flex',
    justifyContent: 'flex-end',
    padding: 8,
    '& button': {
      marginTop: 20,
    },
    '& .allSubmitOuter': {
      backgroundColor: indigo[50],
      borderRadius: 4,
      '& button': {
        marginTop: 0,
      },
      '& .small':{
        fontSize:'.8rem',
        paddingBottom: 2,
        paddingTop: 4,
        lineHeight: '14px',
        textAlign: 'center',
      },
    },
  },
  textAreaWrap:{
    width:'48%',margin:'0 1%',
    '& textarea': {
      padding:4, backgroundColor:'#eee', border: 'none', width: '100%'
    },
    '& .title': {
      fontSize: '.8rem', padding:0, transition: '.4s', padding: '0 4px'
    },
  },
  subTitle : {
    '& .titleSmall': {fontSize:'.7rem'},
    '& .titleLarge': {fontSize:'1.2rem'},
  },
  autoTemplateSave: {
    position: 'absolute', top:-6, left: 8,
  },
  preBackButtonsRoot:{
    display: 'flex',
    marginTop: -32,
    justifyContent: 'space-between',
    '& .MuiIconButton-root':{display: 'block', padding: 4, color: teal[500],},
  },
  freeAcostInputAnc:{
    display: 'flex', alignItems: 'center', padding: 8, marginLeft: -17,
    '& >div': {paddingLeft: 8, },
    '& .text': {paddingBottom: 4},
    '& .MuiSvgIcon-root': {color: teal[800]},
  },
  freeAcostInputCnt:{
    display: 'flex', alignItems: 'center', padding: '0 0 16px 0',
    width: '100%', flexWrap: 'wrap',
  }

}));


const CommentInput = (props) => {
  const classes = useStyle();
  const {placeholder, name, title, initVal} = props;
  const [val, setVal] = useState(initVal);
  const [titleStyle, setTitleStyle] = useState({height:0, opacity: 0});
  useEffect(()=>{
    if (val)  setTitleStyle({height:16, opacity: 1});
    else      setTitleStyle({height:0, opacity: 0});
  }, [val]);
  return (
    <div className={classes.textAreaWrap}>
      <div className='title' style={titleStyle}>{title}</div>
      <TextareaAutosize
        placeholder={placeholder} name={name} value={val || ''}
        onChange={(e)=>setVal(e.currentTarget.value)}
      />
    </div>
  )
}
// // 実費の自由入力を行う。自由入力項目は一個だけとする
export const FreeActualCost = (props) => {
  const {freeACostOpen, setFreeAconstOpen, schedule, uid, did} = props;
  const classes = useStyle();
  const actualCostList = useSelector(
    state => state.config.actualCostList
  )
  const thisSch = schedule?.[uid]?.[did] ?? {};
  const actualCost = comMod.findDeepPath(thisSch, 'actualCost', {});
  // 設定済みの自由入力項目を検出 stateにセット
  const [freeACost, setFreeAconst] = useState(()=>{
    const t = {...actualCost};
    Object.keys(t).forEach(e=>{
      if (Object.keys(actualCostList).indexOf(e) > -1){
        delete t[e];
      }
    });
    if (Object.keys(t).length){
      return {
        name: Object.keys(t)[0], value: t[Object.keys(t)[0]],
        nameError: false, nameHelperText: '',
        valueError: false, valueHelperText: ''
      }
    }
    else return ({
      name: '', value: 0, 
      nameError: false, nameHelperText: '',
      valueError: false, valueHelperText: ''
    });
  });
  
  // すでに自由項目が設定されていたら強制オープン
  useEffect(()=>{
    if (freeACost.name){
      const t = {...freeACostOpen};
      t.open = true;
      t.value = freeACost.value;
      setFreeAconstOpen(t);
    }
    else{
      const t = {...freeACostOpen};
      t.open = false;
      t.value = 0;
      setFreeAconstOpen(t);

    }
  }, [freeACost])
  const handleChange = (e) => {
    const v = comMod.getInputInfo(e);
    const t = {...freeACost}
    const u = {...freeACostOpen}
    if (v.name === 'freeACostName'){
      t['name'] = v.value;
    }
    else if (v.name === 'freeACostValue'){
      t['value'] = v.value;
      u['value'] = v.value;
    }
    setFreeAconst(t);
    setFreeAconstOpen(u);
  }
  const handleClick = () => {
    const t = {...freeACostOpen}
    if (freeACostOpen.open){
      setFreeAconst({name: '', value: 0});
      t.open = false;
      t.value = 0;
      setFreeAconstOpen(t);
    }
    else{
      const t = {...freeACostOpen}
      t.open = true;
      setFreeAconstOpen(t);
    }
  }
  const OpenCloseButton = () => {
    return (
      <div onClick={handleClick} className={classes.freeAcostInputAnc}>
        <div className='button'>
          {freeACostOpen.open === false &&
            <a><AddCircle /></a>
          }
          {freeACostOpen.open === true &&
            <a><CancelIcon /></a>
          }
        </div>
        <div className='text'>追加項目</div>
      </div>
    )
  }
  // 既存の項目は追加できないようにする
  const handleBlur = (ev) => {
    const target = ev.currentTarget;
    const value = target.value;
    if (target.name == 'freeACostName'){
      // 先頭/末尾の全角や類似プラス記号を半角+に正規化し、前後の全角/半角スペースをトリム
      const normalizeEdgePlus = (str) => {
        if (typeof str !== 'string') return '';
        let s = str.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');
        const plusClass = '[\\+＋﹢⁺➕✚∔]';
        s = s.replace(new RegExp('^' + plusClass + '+'), '+');
        s = s.replace(new RegExp(plusClass + '+$'), '+');
        return s;
      }
      const normalized = normalizeEdgePlus(value);
      // 既存の項目は入力不可にする（正規化後の値で判定）
      const t = {...freeACost, name: normalized};
      if (actualCostList[normalized]){
        t.nameError = true;
        t.nameHelperText = '既存の項目は追加できません'
      }
      else {
        t.nameError = false;
        t.nameHelperText = ''
      }
      setFreeAconst(t);
    }
  }
  return (
    <>
      <OpenCloseButton />
      {freeACostOpen.open === true && <>
        <div className={classes.freeAcostInputCnt}>
          <div style={{fontSize: '.8rem', color: red[900], marginTop: 8, width: '100%', opacity: .9}}>
            末尾か先頭に+をつけると欠席時も計上されます。
          </div>
          <TextGP 
            name='freeACostName' label='項目名'
            value={freeACost.name} 
            onChange={(e) => handleChange(e)}
            onBlur={(e) => handleBlur(e)}
            errMsg={freeACost.nameHelperText}
            err={freeACost.nameError}
          />
          <sfp.NumInputGP 
            name='freeACostValue' label='金額'
            cls='tfSmallNum'
            def={freeACost.value} 
            lower={-10000}
            onChange={(e) => handleChange(e)}
          />
        </div>
      </>}
    </>
  )
}
// メニュー化してある欠席ボタンを別コンポーネント化
const AbsenceButtonWithMenu = ({ 
  btnText, submitAbsence, submitNoUse, submitReserve, 
  submitAbsenceWithAddition, thisAbsenced, submitPresent,
  service
}) => {
  const account = useSelector(s=>s.account);
  const classes = useStyle()
  const [absenceMenuAnchor, setAbsenceMenuAnchor] = useState(null);
  const permission = comMod.parsePermission(account)[0][0];
  const isDev = permission === 100;
  const menuItemIconStyle = {color: red[600], marginInlineEnd: 8}
  const pauseIconStyle = {...menuItemIconStyle, color: blue[600]}
  const handleAbcenseClick = (event) => {
    setAbsenceMenuAnchor(event.currentTarget);
  };

  const handleAbsenceMenuClose = () => {
    setAbsenceMenuAnchor(null);
  };
  const isExistKessekikasanService = [HOUDAY, JIHATSU].includes(service);
  return (
    <>
      <Button
        className={classes.absenceButton}
        variant="contained"
        startIcon={<BlockRoundedIcon />}
        onClick={handleAbcenseClick}
      >
        {btnText}
      </Button>

      <Menu
        anchorEl={absenceMenuAnchor}
        keepMounted
        open={Boolean(absenceMenuAnchor)}
        onClose={handleAbsenceMenuClose}
      >
        {thisAbsenced && (
          <MenuItem onClick={submitPresent} className={classes.menuItemWrap}>
            <div className='inner'>
              <CheckCircleIcon style={{ color: blue[600], marginInlineEnd: 8 }} /> 出席として保存
            </div>
            <div className='text'>欠席状態を解除し、出席として保存します。</div>
          </MenuItem>
        )}
        {isExistKessekikasanService && (
          <MenuItem onClick={submitAbsenceWithAddition} className={classes.menuItemWrap}>
            <div className='inner'>
              <BlockRoundedIcon style={pauseIconStyle}/> 欠席時対応加算として保存
            </div>
            <div className='text'>欠席時対応加算付きで欠席として保存されます。</div>
          </MenuItem>
        )}
        <MenuItem onClick={submitAbsence} className={classes.menuItemWrap}>
          <div className='inner'>
            <BlockRoundedIcon style={menuItemIconStyle}/> 欠席として保存
          </div>
          <div className='text'>提供実績記録などに表示されます。家族支援・関係機関連携など特定加算のみ算定します。実費もキャンセルされます</div>
        </MenuItem>
        <MenuItem onClick={submitNoUse} className={classes.menuItemWrap}>
          <div className='inner'>
            <CloseIcon style={menuItemIconStyle}/> 利用なしとして保存

          </div>
          <div className='text'>提供実績記録などに表示されません。その他は「欠席として保存」と一緒です。加算だけ取りたいときはこちらを選択するのがお勧めです。</div>
        </MenuItem>
        <MenuItem onClick={submitReserve} className={classes.menuItemWrap}>
          <div className='inner'>
            <PauseIcon style={pauseIconStyle}/> 予約・キャンセル待ちとして保存
          </div>
          <div className='text'>提供実績記録表などに非表示。加算は一切計上しません。</div>
        </MenuItem>
      </Menu>
    </>
  );
};

// 月間予定のユーザーごとコンポーネント化SchTableBody2に合わせて
// store stateからではなくpropsから受けた情報を編集できるようにする
// スケジュールデータそのものもpropsから受けるようにする
// スケジュールデータはuidごとに渡すようにする
// スケジュールデータはsfpに渡せるように整えなければならない
const SchEditDetailDialog = (props)=> {
  const dispatch = useDispatch();
  const classes = useStyle();
  const path = useLocation().pathname;
  const hist = useHistory();
  const {setSnack } = props;

  // 必要な情報の取得
  const stdDate = useSelector(state=>state.stdDate);
  const actualCostList = useSelector(
    state => state.config.actualCostList
  )
  const users = useSelector(state => state.users);
  const sService = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const classroom = useSelector(state => state.classroom);
  const bid = useSelector(state => state.bid);
  const hid = useSelector(state => state.hid);
  const com = useSelector(state => state.com);
  const dateList = useSelector(state => state.dateList);
  const [absenceMenuAnchor, setAbsenceMenuAnchor] = useState(null);
  const [absenceButtonMode, setAbsenceButtonMode] = useState(0);

  // テンプレート保存設定の取得
  let userTemplateSetting = parseInt(com?.ext?.userTemplateSetting);
  userTemplateSetting = userTemplateSetting? userTemplateSetting: 0;
  const toDaysDid = comMod.convDid(new Date());

  // 自由実費項目 open close 値保持用
  const [freeACostOpen, setFreeAconstOpen] = useState({open:false, value:0});
  // propsからopenさせる
  let stateOpen = props.stateOpen;
  
  const storeStateOpen =useSelector(
    state => state.controleMode.openSchEditDetailDialog
  )

  // storeからopenさせる
  if (stateOpen === undefined){
    stateOpen = storeStateOpen?
    storeStateOpen :{ open: false, uid: '', did: '' }
  }
  
  const UID = stateOpen.uid;
  const did = stateOpen.did;
  const thisUser = comMod.getUser(UID, users);
  // サービスが指定されていないことがある
  const service = sService? sService: thisUser.service?.split(',')?.[0] ?? "";
  const classroomCount = albcm.classroomCount(thisUser);
  const propsOpen = (props.stateOpen)? true: false; // propからopenしたことを示す
  // スケジュールはプロップスを見てstoreから取得
  const storeSch = useSelector(state=>state.schedule);
  const schedule = (propsOpen)? {[UID]: stateOpen.usch}: storeSch

  // 開始終了時間のチェック用
  const [startEnd, setStartEnd] = useState(null);
  // const [jikankubunval, setJikankubunval] = useState();
  // const [enchoushienval, setEnchoushienval] = useState();
  const [offSchool, setOffschool] = useState('');
  
  useEffect(()=>{
    if (!startEnd && schedule?.[UID]?.[did]?.start && stateOpen.open){
      setStartEnd({
        start: schedule?.[UID]?.[did]?.start ?? '', 
        end: schedule?.[UID]?.[did]?.end ?? '',
      })
    }
    else if (!stateOpen.open){
      setStartEnd(null);
    }
    if (schedule?.[UID]?.[did]?.offSchool && stateOpen.open){
      setOffschool(schedule?.[UID]?.[did]?.offSchool);
    }
  }, [schedule, UID, did, stateOpen.open])

  const handleClose = () => {
    // ストアによるオープンの場合
    if (!propsOpen){
      comMod.setOpenSchEditDetailDialog(
        dispatch, { open: false, uid: '', did: '' }
      );
      comMod.setSchedleLastUpdate(dispatch, path);
    }
    // propsによるopen
    else{
      const t = stateOpen;
      // // startendが前の値を保持し続けるバグをfix ここでいったんnullにする
      // setStartEnd(null);
      props.setStateOpen({...t, open: false});
    }
  }

  // handlesubmit handleAbSenseがほぼ同じ動作になるので
  // 別関数として再定義
  // addprmsはサブミットのときに追加される
  // deleteKeysはそれらのキーが削除される
  // 20210303追加 didsに値があるときは全てのdidに対してdispatchする
  const doSubmit =( addPrms = {}, deleteKeys=[], dids=[], didMove=0 )=>{
    // これ以外の要素は加算項目として扱う
    const mainPrms = [
      'start', 'end', 'offSchool', 'actualCost', 'pickup', 'send',
      'notice', 'memo', 'freeACostName', 'freeACostValue', 'transfer',
      // 'groupe', 'teachers',
    ];
    const templatePrms = [
      'start', 'end', 'offSchool', 'actualCost', 'transfer', 'service',
    ]
    // daddictionｎ格納されている項目もテンプレートに含める
    const templatePrmsDAddiction = ['時間区分', '延長支援',]
    // formsvalにはないが保持するパラメータ
    const keepKeys = ['groupe', 'teachers'];

    const addVal = (obj, name, val) => {
      if (mainPrms.indexOf(name) > -1)
        // 数値だったらint化
        formsVal[name] = (isNaN(val)) ? val : parseInt(val);
      else {
        if (obj.dAddiction === undefined) obj.dAddiction = {};
        if (val)
          obj.dAddiction[name] = val;
      }
    }
    // エラーの箇所を検出
    const errInputs = document.querySelectorAll(`#${formId} .Mui-error`);
    if (errInputs.length){
      setSnack({
        msg: '入力を再確認してください。', severity:'warning',
        id: new Date().getTime(),
      });
      return false;
    }

    // 値が必要なエレメントを用意しておく
    const inputs = document.querySelectorAll(`#${formId} input`);
    const selects = document.querySelectorAll(`#${formId} select`);
    const textareas = document.querySelectorAll(`#${formId} textarea`);
    const formsVal = comMod.getFormDatas([inputs, selects, textareas])
    // 欠席時対応加算が付与されているとき利用なしは無効
    if (formsVal.欠席時対応加算){
      if (addPrms.noUse){
        delete addPrms.noUse;
      }
    }

    // テンプレートを保存するかどうか
    // <option value="0">常に利用する</option>
    // <option value="-1">常に利用しない</option>
    // <option value="1">予定入力時のみ保存する</option>

    let templateAutoSave = formsVal.setTemplateAutoSave;
    if (userTemplateSetting === -1){
      templateAutoSave = false;
    }
    else if (userTemplateSetting === 1 && did <= toDaysDid ){
      templateAutoSave = false;
    }
    if (service === HOHOU){
      templateAutoSave = false;
    }

    delete formsVal.setTemplateAutoSave;

    // 実費項目
    Object.keys(formsVal.actualCost).map(e => {
      if (formsVal.actualCost[e]) {
        formsVal.actualCost[e] = actualCostList[e];
      }
      else {
        delete formsVal.actualCost[e];
      }
    });
    // 実費項目に自由項目を追加
    if (formsVal.freeACostName){
      formsVal.actualCost = {
        ...formsVal.actualCost, 
        [formsVal.freeACostName]: formsVal.freeACostValue
      }
      delete formsVal.freeACostName;
    }

    // 送迎だけ配列になっているので処理を追加
    formsVal.transfer = [];
    formsVal.transfer[0] =
      (formsVal.pickup !== undefined) ? formsVal.pickup : '';
    formsVal.transfer[1] =
      (formsVal.send !== undefined) ? formsVal.send : '';
    delete formsVal.pickup; delete formsVal.send;


    // 加算項目をdaddictionとしてひとまとめにする
    Object.keys(formsVal).forEach(e => {
      addVal(formsVal, e, formsVal[e])
      // formsVal[e.getAttribute('name')] = e.value;
    });

    // formデータにサービスが含まれていないため追加する
    formsVal.service = service;

    // 時間区分延長支援の設定
    if (formsVal.start){
      const autoSetting = com?.addiction?.[service]?.時間区分延長支援自動設定;
      const jikankubunAuto = parseInt(autoSetting) >= 1;
      const enchouShienAuto = parseInt(autoSetting) >= 2;
      let jikankubun = formsVal.時間区分? parseInt(formsVal.時間区分): 0;
      let enchouShien = formsVal.延長支援? parseInt(formsVal.延長支援): 0;
      const useKubun3 = service === JIHATSU || formsVal.offSchool === 1;
      const t = getJikanKubunAndEnchou(formsVal.start, formsVal.end, useKubun3);
      if (!formsVal.dAddiction) formsVal.dAddiction = {};
      if (!jikankubun && jikankubunAuto){
        formsVal.dAddiction.時間区分 = t.区分;
        formsVal.時間区分 = t.区分;
      }
      if (enchouShien === 0 && enchouShienAuto && t.延長支援){
        formsVal.dAddiction.延長支援 = t.延長支援;
        formsVal.延長支援 = t.延長支援;
      }
      // 自動にした後、延長支援が該当なければ自動に設定
      else if (enchouShien === 0 && enchouShienAuto && t.延長支援 === undefined){
        formsVal.dAddiction.延長支援 = -1;
        formsVal.延長支援 = -1;

      }
      else if (enchouShien === -1 && enchouShienAuto && formsVal.dAddiction.延長支援){
        // delete formsVal.dAddiction.延長支援
        delete formsVal.延長支援
      }
    }
    // 重心の時間区分延長支援を削除
    if (thisUser.type === '重症心身障害児' && Number(com?.addiction?.[service]?.重症心身型) === 1){
      delete formsVal.dAddiction.時間区分;
      delete formsVal.時間区分;
      delete formsVal.dAddiction.延長支援;
      delete formsVal.延長支援;
    }

    // 個別テンプレートのオブジェクトを作成
    const itemName = (parseInt(formsVal.offSchool) === 0)? 'weekday': 'schoolOff';
    const templateObj =  {[itemName]: {},};
    // 保育所等訪問支援ではテンプレートを保存しない
    const isHoho = service === HOHOU;
    if (templateAutoSave && !isHoho){
      Object.keys(formsVal).forEach(e=>{
        if (templatePrms.includes(e)){
          templateObj[itemName][e] = formsVal[e];
        }
        // daddictionｎ格納されている項目もテンプレートに含める
        if (templatePrmsDAddiction.includes(e)){
          if (!templateObj[itemName].dAddiction) templateObj[itemName].dAddiction = {};
          templateObj[itemName].dAddiction[e] = formsVal[e];
        }
      });
    }
  
    // Replace shallow assignment with one-level deep merge
    for (const key in addPrms) {
      if (Object.prototype.hasOwnProperty.call(addPrms, key)) {
        if (formsVal[key] && typeof formsVal[key] === 'object' && typeof addPrms[key] === 'object') {
          formsVal[key] = { ...formsVal[key], ...addPrms[key] };
        } else {
          formsVal[key] = addPrms[key];
        }
      }
    }

    // deleteKeysの削除
    deleteKeys.forEach(elm=>{
      if (elm.includes('.')){
        const key1 = elm.split('.')[0];
        const key2 = elm.split('.')[1];
        // formsVal[key1]が存在し、オブジェクトであることを確認してから削除
        if (formsVal[key1] && typeof formsVal[key1] === 'object') {
          delete formsVal[key1][key2];
        }
      }
      else{
        delete formsVal[elm];
      }
    })
    // 一日のスケジュール
    const dSch = stateOpen?.usch[did] ?? {};
    // 保持するべきパラメータをformsvalに入れる
    keepKeys.forEach(key => {
      if (!(key in formsVal) && key in dSch) {
        formsVal[key] = dSch[key];
      }
    });

    // 欠席時対応加算があったら欠席予定として追加を行う
    if (comMod.findDeepPath(formsVal, 'dAddiction.欠席時対応加算')){
      formsVal.absence = true;
    }
    const isMtu = classroomCount > 1;
    // mtuならクラスルームを付与。これしないと消えるっぽい
    if (isMtu && classroom){
      formsVal.classroom = classroom;
    }

    // 多数同時更新
    if (dids.length){
      // memoとnoticeは複数書き込みしない
      const formsVal_ = {...formsVal};
      delete formsVal_.notice;
      delete formsVal_.memo;
      if (!propsOpen){
        dids.map(_=>{
          dispatch(Actions.replaceSchedule(UID, _, formsVal_));
        });  
      }
      else{ // ユーザーごとのステイと管理の場合
        const t = {...stateOpen};
        dids.map(_=>{
          t.usch[_] = {...formsVal_};
        });
        props.setStateOpen(t);
      }
    }
    // 通常
    if (!propsOpen){
      dispatch(Actions.replaceSchedule(UID, did, formsVal));
      comMod.setSchedleLastUpdate(dispatch, path);
      handleClose();
    }
    else { // ユーザーごとのステイト管理の場合
      const t = stateOpen;
      const newTemplate = templateAutoSave
      ? {template: {...t.usch.template, ...templateObj}}: {};
      formsVal.timestamp = new Date().getTime();
      formsVal.service = service;
      const reserved = t.usch[did].reserve;
      if (reserved && !formsVal.reserve) {
        formsVal.reserveFixedTimestamp = new Date().getTime();
      }
      const u = {...t.usch, [did]:formsVal, ...newTemplate};
      const v = {...t, usch: u};
      // sendPartOfScheduleCompt対応 modDidを'D2'にして送信モジュール側でデータを保持する
      // '^D2'として解釈されフィルタリングする正規表現として扱われる
      if (dids.length){
        u.modDid = 'D2';
      }
      else u.modDid = did;
      // スケジュールオブジェクトからdidを抽出してソート
      const ds = Object.keys(u).filter(e=>e.indexOf('D2') === 0);
      ds.sort((a, b)=>a > b? 1: -1);
      // didMoveは廃止
      // if (didMove === 0){
      props.setStateOpen({...t, usch: u, open: false});
    }
    albcm.setRecentUser(UID);
    setLocalStorageItemWithTimeStamp(bid + UID + did, true);
  }

  // 全て変更するときのDIDリストを作成
  // UIDが確定しているときのみ
  const getDidsForEdit = () =>{
    const pi = v => parseInt(v);
    if (UID){
      const tmpDids = comMod.setOfUidDid(schedule, UID);
      // --- 現在の放課後休日を取得
      const thisOffSchool = schedule[UID][did].offSchool;
      // 現在の放課後休日フラグと一致していないdidは削除
      // 利用実績があるdidも削除
      // 現在のdid未満も削除
      const dids = tmpDids
      .filter(_ => 
        pi(schedule[UID][_].offSchool) === pi(thisOffSchool) &&
        _ >= did &&
        schedule[UID][_].useResult !== true &&
        schedule[UID][_].absence !== true
      );
      return dids;
    }
    else{
      return [];
    }
  }
  const keyHandler = (e) => {
    if (e.key === "Enter" && e.shiftKey) {
      const forBlur = document.querySelector(`#${hiddenInput}`);
      forBlur.focus();
      e.persist();
      setTimeout(() => {
        handleSubmit(e);
      }, 300);
    } else if (e.key === "Escape") {
      handleClose();
    }
  }
  const dids = getDidsForEdit();
  const didLength = dids.length;
  // 一括変更
  const handleAllSubmit = (e) => {
    e.preventDefault();
    doSubmit({}, [], dids);  // 追加オブジェクトなし 削除なし 複数更新
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    doSubmit({}, ['absence']);  // 追加オブジェクトなし abSenceを削除
  }
  // 欠席扱いにする
  // scheduleの日付オブジェクト配下にabsence:trueを挿入して
  // ダイアログを閉じる
  const handleAbcense =(e)=>{
    e.preventDefault();
    doSubmit({ absence:true }, []);  // absenceを追加
  }
  const handleAbcenseClick = (e) => {
    setAbsenceMenuAnchor(e.currentTarget)
  }
  const submitAbsence = e => {
    e.preventDefault();
    setAbsenceMenuAnchor(null);
    doSubmit({ absence:true }, ['dAddiction.欠席時対応加算']);  // absenceを追加
  }
  const submitAbsenceWithAddition = e => {
    e.preventDefault();
    setAbsenceMenuAnchor(null);
    doSubmit({ absence:true ,dAddiction:{欠席時対応加算:"1"}}, []);  // absenceを追加
  }
  const submitNoUse = e => {
    e.preventDefault();
    setAbsenceMenuAnchor(null);
    doSubmit({ absence:true, noUse: true }, []);  // absenceを追加
  }
  const submitreserve = e => {
    e.preventDefault();
    setAbsenceMenuAnchor(null);
    doSubmit({ absence:true, reserve: true }, []);  // absenceを追加
  }

  const handleAbsenceMenuClose = (val) => {
    if (val) {
      setAbsenceButtonMode(val);
    }
    setAbsenceMenuAnchor(null);
  };

  // Scheduleオブジェクトの値を読み取ってボタンテキストを制御
  const thisAbsenced = comMod.findDeepPath(schedule, [UID, did, 'absence']);
  const thisNoUse = comMod.findDeepPath(schedule, [UID, did, 'noUse']);
  // const submitBtnText = (thisAbsenced) ? '出席にする' : '書き込み';
  // const absenceBtnText = (thisAbsenced) ? '欠席として保存' : '欠席にする';
  const absenceBtnText = (() => {
    if (thisAbsenced && thisNoUse) return '利用無しで登録済';
    if (thisAbsenced && !thisNoUse) return '欠席登録済';
    return '欠席・利用無し登録'
  })();
  // ユーザー別スケジュールページから開かれたらユーザーリンクは表示しない
  const userScheduleLinkButton = (path.indexOf('users') > -1) ?
    {display:'none'}: {display:'block'};

  // noticeとmemoの初期値をstateから取得
  const thisNotice = comMod.findDeepPath(schedule, [UID, did, 'notice']);
  const thisMemo = comMod.findDeepPath(schedule, [UID, did, 'memo']);
  const nextPreButtonStyle = {paddingLeft: 4, paddingRight: 4}
  const timeInputStyle = service === HOHOU? {}: {width: 90};
  const dispKobetuSupport = comMod.getUisCookie(comMod.uisCookiePos.displayKobetuSupportOnSchEditDetail);

  const submitPresent = e => {
    e.preventDefault();
    setAbsenceMenuAnchor(null);
    doSubmit({}, ['absence', 'dAddiction.欠席時対応加算', 'noUse', 'reserve']); // 欠席解除
  }

  return (<>
    <Dialog 
      open={stateOpen.open}
      onClose={handleClose}
      className={classes.root}
      onKeyDown={keyHandler}
    >
      <form 
        className="dialogForm" 
        id={formId}
      >
        <div className='formTitle'>
          利用予定実績詳細設定
          <div className={classes.autoTemplateSave}>
            <sfp.SetTemplateAutoSave did={did}/>
          </div>
        </div>
        
        <div className={"formSubTitle " + classes.subTitle}>
          <div className='date'>
            {/* <span className='titlesmall'>{did.substr(1, 4) + ' / '}</span> */}
            <span className='titlelarge'>{did.substr(5, 2)}</span>
            <span className='titlesmall'>{' / '}</span>
            <span className='titlelarge'>{did.substr(7, 2)}</span>
          </div>
          <div className="user ">
            <span className='titleLarge'>{thisUser.name}</span>
            <span className='titlesmall'>{' 様'}</span>

          </div>
          <div className="age" style={{paddingTop: 8}}>
            <span className='titlesmall'>{thisUser.ageStr}</span>
          </div>
          <div className="belongs" style={{paddingTop: 8}}>
            <span className='titlesmall'>{thisUser.belongs1}</span>
          </div>

        </div>
        <div className='cntRow'>
          <sfp.TimeInput 
            name='start' label='開始' 
            value={schedule} uid={UID} did={did}
            required size='middle' 
            key={did + 'start'}
            setStartEnd={setStartEnd}
            startEnd={startEnd}
            addStyles={timeInputStyle}
          />
          <sfp.TimeInput
            name='end' label='終了'
            value={schedule} uid={UID} did={did}
            required size='middle'
            key={did + 'end'}
            setStartEnd={setStartEnd}
            startEnd={startEnd}
            addStyles={timeInputStyle}
          />
          <div className={classes.holidayInputRoot}>
            <sfp.HolidayOrNot
              name='offSchool' label='平日/休日'
              value={schedule} uid={UID} did={did}
              required size='middle'
              key={did}
              setOffschool={setOffschool}
            />
          </div>
          <sfp.SanteiJikan 
            value={schedule} uid={UID} did={did}
            required size='middle'
            key={did + 'santeijikan'}
            startEnd={startEnd}
          />

          <afp.HoikuHoumn 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'aa0'} schedule={schedule}
          />
          {/* ユーザー別スケジュールページから開かれたときは非表示
          スタイルで設定を行う */}
          <div 
            className={classes.userScheduleLinkButton} 
            style={userScheduleLinkButton}
          >
            <Button
              variant='outlined'
              color='primary'
              onClick={() => {
                hist.push('/schedule/users/' + thisUser.uid + '/');
                handleClose();
              }}
            >
              利用者別予定
            </Button>
          </div>
          <div className={classes.editUserButtonWrap} >
            <EditUserButton uid={thisUser.uid}/>
          </div>
        </div>
        <div className='cntRow'>
          <afp.JikanKubun
            schedule={schedule} uid={UID} did={did}
            required size='middle'
            key={did + 'jikankubun'}
            startEnd={startEnd} dLayer={3}
            offSchool={offSchool}

          />
          <afp.EnchouShien2024
            schedule={schedule} uid={UID} did={did}
            required size='middle'
            key={did + 'enchoushien2024'}
            startEnd={startEnd} dLayer={3}
          />

          <sfp.Transfer
            name='pickup' label='迎え'
            value={schedule} uid={UID} did={did}
            required size='middle'
            key={did + 'pu'}
          />
          <sfp.Transfer
            name='send' label='送り'
            value={schedule} uid={UID} did={did}
            required size='middle'
            key={did  + 'snd'}
          />

        </div>
        <div className='cntRow'>
          <sfp.ActualCostCheckBox
            value={schedule} uid={UID} did={did}
            required size='middle'
            key={did + 'acb'}
            freeACost={freeACostOpen.value}

          />
          <FreeActualCost 
            uid={UID} did={did} schedule={schedule} 
            freeACostOpen={freeACostOpen} setFreeAconstOpen={setFreeAconstOpen}
          />
        </div>
        <div className='cntRow'>
          <afp.KessekiTaiou 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'a5'} schedule={schedule}
          />
          {/* <afp.JiShidouKaHai1 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'a0'} schedule={schedule}
          /> */}


          <afp.KazokuShien1 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'a21'} schedule={schedule}
          />
          <afp.KazokuShien2 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'a22'} schedule={schedule}
          />
          <afp.Kosodate 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'a23'} schedule={schedule}
          />
          <afp.SenmonJisshi 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'a24'} schedule={schedule}
          />
          <afp.NyuuyokuShien 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'a2a'} schedule={schedule}
          />

          <afp.EnchouShien 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'a2b'} schedule={schedule}
          />
          <afp.TokubetsuShien 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'a3'} schedule={schedule}
          />
          <afp.KateiRenkeiNum
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'a4'} schedule={schedule}
          />
          <afp.IryouCareKihon
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'a7b'} schedule={schedule}
          />
          <afp.IryouCareEnchou
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'a7a'} schedule={schedule}
          />
          {stdDate < '2024-11-01' &&
            <afp.IryouCareJi
              uid={UID} did={did} size='middle' dLayer={3} key={did + 'a7'} schedule={schedule}
            />
          }
          <afp.IryouRenkei 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'a7a'} schedule={schedule}
          />
          <afp.JigyousyoSoudan 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'a8'} schedule={schedule}
          />
          <afp.ShokujiTeikyou 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'ab'} schedule={schedule}
          />
          <afp.EiyoushiHaichi
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'ac'} schedule={schedule}
          />
          <afp.SenmonShien 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'ba'} schedule={schedule}
          />
          <afp.KankeiRenkei
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'ba1'} schedule={schedule}
          />
          <afp.SougeiKasanSettei
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'ba2'} schedule={schedule}
          />
          <afp.JigyousyoRenkei
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'ba3'} schedule={schedule}
          />
          <afp.SyuutyuuShien
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'ba4'} schedule={schedule}
          />
          <afp.JiritsuSupport
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'ba5'} schedule={schedule}
          />
          <afp.TuusyoJiritsu
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'ba6'} schedule={schedule}
          />
          
          <afp.HoikuHoumn
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'bc'} schedule={schedule}
            inAddiction
          />
          <afp.SyokaiKasan 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'bd1'} schedule={schedule}
          />
          {stdDate < '2024-09-01' &&
            <afp.KobetsuSuport1 
              uid={UID} did={did} size='middle' dLayer={3} key={did + 'be2'} schedule={schedule}
            />
          }
          {(stdDate >= '2024-09-01' && dispKobetuSupport === '1') && <>
            <afp.KobetsuSuport1 
              uid={UID} did={did} size='middle' dLayer={3} key={did + 'be3'} schedule={schedule}
              />
              <afp.KobetsuSuport2
                uid={UID} did={did} size='middle' dLayer={3} key={did + 'be4'} schedule={schedule}
              />
              <afp.KobetsuSuport3 
                uid={UID} did={did} size='middle' dLayer={3} key={did + 'be5'} schedule={schedule}
              />
          </>}

          {/* <afp.KyoudoKoudou90 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'bd3'} schedule={schedule}
          /> */}
          <afp.TasyokusyuRenkei 
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'bd4'} schedule={schedule}
          />
          <afp.HoumonShienTokubetsu
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'bd5'} schedule={schedule}
          />
          <afp.CareNeeds
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'bd6'} schedule={schedule}
          />
          {/* <afp.TasyokusyuRenkei
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'cd6'} schedule={schedule}
          /> */}
          <afp.HoikuKyouiku
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'cd7'} schedule={schedule}
          />
          <afp.JiritsuSupport
            uid={UID} did={did} size='middle' dLayer={3} key={did + 'ba7'} schedule={schedule}
          />
        </div>
        <div className='cntRow'>
          <CommentInput 
            name='notice' initVal={thisNotice}
            placeholder='提供実績記録票の備考欄記載' title='備考（加算説明等）' 
            key={did + 'ab'}
          />
          <CommentInput 
            name='memo' initVal={thisMemo}
            placeholder='事業所内の連絡事項' title='メモ（事業所内連絡）' 
            key={did + 'ac'}
          />
        </div>
      </form>
      <div className={'buttonWrapper ' + classes.thisBttonWrap}>
        <button id={hiddenInput} style={{
          tabindex: '-1',
          width: 0,
          opacity: 0,  
          // visibility:'hidden'
        }}></button>

        {/* 複数単位所有ユーザは一括変更しない */}
        {classroomCount < 2 &&
          <div className={'allSubmitOuter'}>
          <div className='small'>
            {
              (
                did.substr(5, 2) + "月" + 
                did.substr(7, 2) + "日").replace(/0/g, ''
              )
            }以降
          </div>
          <div>
            <Button
              className={classes.allSubmitButton}
              variant="contained"
              startIcon={<PeopleAltIcon />}
              onClick={handleAllSubmit}
            >
              一括変更<span>{didLength}</span>件
            </Button>
          </div>
          </div>
        }

        <AbsenceButtonWithMenu
          service={service}
          thisAbsenced={thisAbsenced}
          btnText={absenceBtnText}
          submitAbsence={submitAbsence}
          submitNoUse={submitNoUse}
          submitReserve={submitreserve}
          submitAbsenceWithAddition={submitAbsenceWithAddition}
          submitPresent={submitPresent}
        />


        <mui.ButtonGP
          color='secondary'
          label='キャンセル'
          onClick={handleClose}
        />
        <mui.ButtonGP
          color='primary'
          label={'書き込み'}
          type="submit"
          onClick={handleSubmit}
        />
      </div>

    </Dialog>
  </>);
}

export default SchEditDetailDialog;