// 加算請求項目共有用フォームパーツ
// dlayerパラメータで次のことを行う
// フォームの初期値をステイトから取得
// 上位レイヤで値が設定されている場合は表示をdisableにする
// 上位レイヤで非表示に設定されている場合は表示を行わない
// sizeは表示の大きさなどを指定する
// 今のところ、large、middleのみ。追加でsmall など。
// uidとdidをpropsで受け取る。場合によっては未指定のこともある

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { connect, useDispatch, useSelector } from 'react-redux';
import * as mui from '../common/materialUi';
import * as comMod from '../../commonModule';
import TextField from '@material-ui/core/TextField';
// import InputLabel from '@material-ui/core/InputLabel';
// import FormControl from '@material-ui/core/FormControl';
// import Select from '@material-ui/core/Select';
// import FormGroup from '@material-ui/core/FormGroup';
// import FormControlLabel from '@material-ui/core/FormControlLabel';
// import Checkbox from '@material-ui/core/Checkbox';
// import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
// import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
// import Favorite from '@material-ui/icons/Favorite';
// import FavoriteBorder from '@material-ui/icons/FavoriteBorder';
// import { common } from '@material-ui/core/colors';
// import { Tune } from '@material-ui/icons';
// import classes from '*.module.css';
import {
  useStyles,
  // sw,
  selectStyle,
  // ChkBoxGp,
  SelectGp,
} 
from './FormPartsCommon'

const StatusIcon = (props) => {
  const classes = useStyles();
  const {val, size, ...other} = props;
  const chkDisp = (val && parseInt(val) !== -1)? true: false;
  const hideDisp = (parseInt(val) === -1) ? true : false;
  const iconClass = (size === 'middle') ? 
    classes.checkedIconMiddle: classes.checkedIcon;
  const IconChk = () => (
    <div className={iconClass + ' checked'}>
      <CheckCircleIcon color='secondary' />
    </div>
  )
  const IconHide = () => (
    <div className={iconClass + ' checked'}>
      <VisibilityOffIcon  />
    </div>
  )
  if (chkDisp)
    return  <IconChk/>;
  else if (hideDisp)
    return <IconHide/>;
  else 
    return null;
}

// 加算が記述される位置により渡されるオブジェクトの構造が違う
// 想定されるオブジェクトの形に対応しフォームにデフォルト値を返す
const getDef = (obj, name, uid='', did='') =>{
  uid = (uid === undefined || uid === null) ? '' : uid;
  did = (did === undefined || did === null) ? '' : did;
  if (typeof did === 'object')  did = comMod.convDid(did);
  // state.comに記述がある場合
  let rt = comMod.findDeepPath(
    obj, 'value.addiction.放課後等デイサービス.' + name
  );
  // state.schedule.didに記述がある場合
  if (rt === null || rt === undefined){
    rt = comMod.findDeepPath(
      obj, ['value', '放課後等デイサービス', did, name]
    );
  }
  // uidを利用する場合
  if (rt === null || rt === undefined) {
    rt = comMod.findDeepPath(
      obj, ['value', uid, 'addiction', name]
    );
  }
  // state.schedule.uid.did.aAddictionにある場合
  if (rt === null || rt === undefined) {
    rt = comMod.findDeepPath(
      obj, ['value', uid, did, 'dAddiction',name]
    );
  }

  return rt;
}

// stateのdefは次の箇所から順番に探す
// com.addiction[service]
// users[x].etc.addiction
// schedule[service][did]
// schedule[uid][did].dAddiction
// 引数のint dLayerでどこまで探すか決める
// dlayerに達する前にデータがみつかった場合、
// 非表示やdisableなどの処置を決める
// カスタムフック使ってみる！
const useGetDef = (name, uid='', did='', dLyer=10, service='')=>{
  service = (!service)?'放課後等デイサービス':service;
  did = (typeof did === 'object') ? comMod.convDid(did) : did;
  if (!isNaN(uid)) uid = 'UID' + uid;
  const com = useSelector(state => state.com);
  const users = useSelector(state => state.users);
  const schedule = useSelector(state => state.schedule);
  const user = comMod.getUser(uid, users);
  let rt = null;
  if (dLyer > -1){
    rt = comMod.findDeepPath(com, ['addiction', service, name]);
  }
  if (dLyer > 0 && !rt){
    rt = comMod.findDeepPath(user, ['etc', 'addiction', name]);
  }
  if (dLyer > 1 && !rt) {
    rt = comMod.findDeepPath(schedule, [service, did, name]);
  }
  if (dLyer > 2 && !rt) {
    rt = comMod.findDeepPath(schedule, [uid, did, 'dAddiction', name]);
  }
  return (rt)
}

// 定員
export const Teiin = (props) => {
  const classes = useStyles();
  const nameJp = '定員';
  let def = useGetDef(nameJp, props.uid, props.did);
  def = (def === null || undefined) ? 0 : def;
  const [val, setval] = useState(def);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');
  const handleBlur = (e)=>{
    const han = comMod.convHankaku(e.currentTarget.value);
    setval(han);
    if (isNaN(han)){
      seterr(true);
      seterrMsg('数値を入力してください。');
    }
    else if (!han){
      seterr(true);
      seterrMsg('入力必須項目です。');
    }
    else{
      seterr(false);
      seterrMsg('');
    }
  }
  const handleChange = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setval(e.currentTarget.value);
  };

  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e)=>{
    setnoticeopen(true);
  }
  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        定員は10人以下、11人以上20人以下、21人以上で請求できる単位数が変わります。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  return (
    <div className={"aFormPartsWrapper Teiin " + props.size}>
      <TeiinFormParts 
        value={val} 
        err={err}
        errMsg={errMsg}
        nameJp={nameJp}
        onChange={(e)=>handleChange(e)} 
        onBlur={(e) => handleBlur(e)} 
        size={props.size}
        disabled={props.disabled}
      />
      <Discription/>
      <mui.NoticeDialog
        className={classes.noticeDialog}
        title={nameJp}
        noticeopen={noticeopen}
        setnoticeopen={setnoticeopen}
        Content={Discription}
      />
    </div>

  )
}

const TeiinFormParts = (props) => {
  const classes = useStyles();
  const size = props.size;
  // sizeに応じたクラス名を求める
  const classList = ['tfLargeNum', 'tfMiddleNum'];
  const cls = selectStyle(props.size, classList);

  return (
    <div className={classes[cls]}>
      <TextField 
        id="teiinInput"
        name={props.nameJp}
        required
        label={props.nameJp}
        value={props.value}
        onChange={(e) => props.onChange(e)}
        onBlur={e => props.onBlur(e)}
        error={props.err}
        helpertext={props.errMsg}
        disabled={props.disabled}
      />
    </div>
  )
}


// 地域区分
export const ChiikiKubun = (props) => {

  const classes = useStyles();
  const nameJp = '地域区分';
  // dlayer -1 で値取得。ここで値が戻ったら上位モジュールで値決定済み
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  // 自身のレイヤで値取得。設定済みならデフォルト値に。
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  // disabled と 非表示の設置知取得
  const [disabled, notDisp] = getDispControle(preDef);
  // disabledなら上位レイヤでの値を初期値にする
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = ()=>(
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        地域区分とは地域間における人件費の差を勘案して、保険費用の配分を調整するために設けられた区分です。指定された区分を選択してください。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    '一級地',
    '二級地',
    '三級地',
    '四級地',
    '五級地',
    '六級地',
    '七級地',
    'その他',
  ]
  if (notDisp) return (null);
  else return (
    <>
    <div className={"aFormPartsWrapper ChiikiKubun " + noOpt + props.size}>
      <StatusIcon val={val} size={props.size} />
      <SelectGp 
        onChange={e=>handleChange(e)}
        nameJp={nameJp}
        value={val}
        size={props.size}
        opts={(props.noOpt) ? [] : opts}
        disabled={disabled}

      />
      <Discription />
      <mui.NoticeDialog
        className={classes.noticeDialog}
        title={nameJp}
        noticeopen={noticeopen}
        setnoticeopen={setnoticeopen}
        Content={Discription}

      />
    </div>
    </>

  )
}

// 障害児状態等区分
export const JoutaiKubun = (props) => {

  const classes = useStyles();
  const nameJp = '障害児状態等区分';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription =()=>(
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        中重度の障害児の割合、営業時間などによる状態区分を選択します。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    "区分１の１",
    "区分１の２",
    "区分２の１",
    "区分２の２",
  ]

  if (notDisp) return (null);
  else return (
    <>
    <div className={"aFormPartsWrapper JoutaiKubun " + noOpt + props.size}>
      <StatusIcon val={val} size={props.size}/>
      <SelectGp
        onChange={e=>handleChange(e)}
        value={val}
        nameJp={nameJp}
        size={props.size}
        opts={(props.noOpt) ? [] : opts}
        disabled={disabled}

      />
      <Discription/>
      <mui.NoticeDialog
        className={classes.noticeDialog}
        title={nameJp}
        noticeopen={noticeopen}
        setnoticeopen={setnoticeopen}
        Content={Discription}
      />
    </div>
    </>

  )
}


// 共生型サービス
export const KyouseiService = (props) => {

  const classes = useStyles();
  const nameJp = '共生型サービス';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        介護保険の指定を受けている通所介護事業所等が障害福祉サービスの共生型事業所としての指定を受けて、サービスを提供する場合の加算を申請します。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    { value: 1, label: "選択" }
  ]

  if (notDisp) return (null);
  else return (
    <>
    <div className={"aFormPartsWrapper KyouseiService " + noOpt + props.size}>
      <StatusIcon val={val} size={props.size} />
      <SelectGp
        onChange={e => handleChange(e)}
        value={val}
        nameJp={nameJp}
        size={props.size}
        opts={(props.noOpt) ? [] : opts}
        disabled={disabled}
        dispHide={props.dispHide}
      />

      <Discription />
      <mui.NoticeDialog
        className={classes.noticeDialog}
        title={nameJp}
        noticeopen={noticeopen}
        setnoticeopen={setnoticeopen}
        Content={Discription}
      />

    </div>
    </>
  )
}

//福祉専門職員配置等加算
export const FukushiSenmonHaichi = (props) => {
  const classes = useStyles();
  const nameJp = '福祉専門職員配置等加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        福祉の専門職を配置することにより、サービスの質を向上させる取組を行っている事業所を評価する加算です。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    "福祉専門職員配置等加算Ⅰ",
    "福祉専門職員配置等加算Ⅱ",
    "福祉専門職員配置等加算Ⅲ",
  ]
  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper FukushiSenmonHaichi " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>

  )
}

const getDispControle = (predef) =>{
  const notDisp = (parseInt(predef) === -1) ? true : false;
  const disabled = (predef) ? true : false;
  return [disabled, notDisp];
}

// 児童指導員等加配加算（Ⅰ）
// 作り変え
// stateのdefは次の箇所から順番に探す
// com.addiction[service]
// users[x].etc.addiction
// schedule[service][did]
// schedule[uid][did].dAddiction
// 引数のint dLayerでどこまで探すか決める
// dlayerに達する前にデータがみつかった場合、
// 非表示やdisableなどの処置を決める
export const JiShidouKaHai1 = (props) => {
  const classes = useStyles();
  const nameJp = '児童指導員等加配加算（Ⅰ）';
  // dlayer -1 で値取得。ここで値が戻ったら上位モジュールで値決定済み
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  // 自身のレイヤで値取得。設定済みならデフォルト値に。
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  // disabled と 非表示の設置知取得
  const [disabled, notDisp] = getDispControle(preDef);
  // disabledなら上位レイヤでの値を初期値にする
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        人員配置基準以上に専門的な知識を持つ者を配置し、十分な人員によりサービス提供することを評価する加算です。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    "理学療法士等",
    "児童指導員等",
    "その他の従業者",
  ];

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper JiShidouKaHai1 " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />

      </div>
    </>

  )
}

// 児童指導員等加配加算（Ⅱ）
export const JiShidouKaHai2 = (props) => {
  const classes = useStyles();
  const nameJp = '児童指導員等加配加算（Ⅱ）';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        児童指導員等加配加算（Ⅰ）に加えさらに人員配置を行ったときに請求できます。基本報酬で区分（1）を算定している必要があります。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    "理学療法士等",
    "児童指導員等",
    "その他の従業者",
  ];


  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper JiShidouKaHai2 " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />

      </div>
    </>

  )
}

// 児童指導員配置加算
export const JidouShidouHaichi = (props) => {
  const classes = useStyles();
  const nameJp = '児童指導員配置加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        児童指導員、保育士、強度行動障害支援者養成研修等の修了者が１名以上配置されていることが必要です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    {value: 1, label:"選択"}
  ]
  console.log(val);
  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper JidouShidouHaichi " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size}/>       
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}
        />

        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}

// 看護職員加配加算
export const KangoKahai = (props) => {
  const classes = useStyles();
  const nameJp = '看護職員加配加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        医療的ケアが必要な児童を受け入れるための体制を確保し、ニーズに応じて必要な支援を受けることができるよう、看護職員を加配した事業所を評価する加算になります。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    "看護職員加配加算Ⅰ",
    "看護職員加配加算Ⅱ",
    "看護職員加配加算Ⅲ",
  ];


  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper KangoKahai " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />

      </div>
    </>

  )
}

// 開所時間減算
export const KaisyoGensan = (props) => {
  const classes = useStyles();
  const nameJp = '開所時間減算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        利用時間が一定時間未満の事業所に対して、報酬に差がないことは不均衡である事から、営業時間の実態に合わせて基本報酬が減算となります。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    "4時間未満",
    "4時間以上6時間未満",
  ];
  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper KaisyoGensan " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />

      </div>
    </>

  )
}

// 医療連携体制加算
export const IryouRenkei = (props) => {
  const classes = useStyles();
  const nameJp = '医療連携体制加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        医療機関等から看護職員が放課後等デイサービスに訪問し、看護の提供や認定特定行為業務従事者に対して喀痰吸引等の指導を行う取り組みを評価する加算です。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    "医療連携体制加算Ⅰ",
    "医療連携体制加算Ⅱ",
    "医療連携体制加算Ⅲ",
    "医療連携体制加算Ⅳ",
    "医療連携体制加算Ⅴ",
    "医療連携体制加算Ⅵ",
  ];

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper IryouRenkei " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>

  )
}

// 身体拘束廃止未実施減算
export const ShinTaikousoku = (props) => {

  const classes = useStyles();
  const nameJp = '身体拘束廃止未実施減算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        指定基準に基づき求められる身体拘束等にかかわる記録が行われていない場合、身体拘束廃止未実施減算として所定単位が減算となります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    { value: 1, label: "選択" }
  ]

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShinTaikousoku " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />

        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}


// 共生型サービス体制強化加算
export const KyouseiKyouka = (props) => {
  const classes = useStyles();
  const nameJp = '共生型サービス体制強化加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        共生型サービス認定を受けている事業所がその体制を強化することによって評価される加算です。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    '児発管かつ保育士又は児童指導員の場合',
    '児発管の場合',
    '保育士又は児童指導員の場合',
  ]

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper KyouseiKyouka " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />

        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />

      </div>
    </>

  )
}

// 定員超過利用減算
export const TeiinChouka = (props) => {

  const classes = useStyles();
  const nameJp = '定員超過利用減算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        やむを得ない事情がある場合、例外的に定員を超過した児童の受け入れが認められています。例外的な定員超過の受け入れが一定の人数を超えた場合、定員超過利用減算として所定単位が減算となります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    { value: 1, label: "選択" }
  ]

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper TeiinChouka " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />

        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}

// サービス提供職員欠如減算
export const ShokuinKetujo = (props) => {

  const classes = useStyles();
  const nameJp = 'サービス提供職員欠如減算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        営業時間中に配置するべき人員基準を満たしていない状況でサービスを提供した場合、人員欠如の状況と期間に応じて所定単位数から減算となります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    "二ヶ月まで", "三ヶ月以上",
  ];

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShokuinKetujo " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          value={val}
          onChange={e => handleChange(e)}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}

// 児童発達支援管理責任者欠如減算
export const JihatsuKetsujo = (props) => {

  const classes = useStyles();
  const nameJp = '児童発達支援管理責任者欠如減算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        原則1名配置しなければならない「児童発達支援管理責任者」が不在のとなった場合、減算の対象となります。児童発達支援管理責任者が退職し、後任の有資格者が確保できない場合などが該当します。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )

  const opts = [
    "五ヶ月未満", "五ヶ月以上",
  ];

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper JihatsuKetsujo " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          value={val}
          onChange={e => handleChange(e)}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}

// 福祉・介護職員処遇改善特別加算
export const ShoguuTokubetsu = (props) => {

  const classes = useStyles();
  const nameJp = '福祉・介護職員処遇改善特別加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        障害福祉サービスの特性を踏まえ、福祉・介護職員処遇改善加算の要件を緩和した加算となります。事務職や医療職等の福祉・介護職以外の従業者も含みます。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    { value: 1, label: "選択" }
  ]

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShoguuTokubetsu " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />

        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />

      </div>
    </>
  )
}


// 福祉・介護職員処遇改善加算
export const ShoguuKaizen = (props) => {

  const classes = useStyles();
  const nameJp = '福祉・介護職員処遇改善加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        福祉・介護人材の賃金面を含めた待遇改善を目的として、事業所における取組を評価する加算となります。事業所における取組の内容に応じて、（Ⅰ）から（Ⅴ）までの１つを算定できます。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    '福祉・介護職員処遇改善加算Ⅰ',
    '福祉・介護職員処遇改善加算Ⅱ',
    '福祉・介護職員処遇改善加算Ⅲ',
    '福祉・介護職員処遇改善加算Ⅳ',
    '福祉・介護職員処遇改善加算Ⅴ',
  ]
  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShoguuKaizen " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          value={val}
          onChange={e => handleChange(e)}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}

// 延長支援加算
export const EnchouShien = (props) => {

  const classes = useStyles();
  const nameJp = '延長支援加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        放課後等デイサービスが、運営規定に定められている営業時間の前後で、就学児に対して、放課後等デイサービス計画に基づき、サービスの提供をした場合に加算を算定することができます。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    '1時間未満',
    '1時間以上2時間未満',
    '2時間以上',
  ]
  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper EnchouShien " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          value={val}
          onChange={e => handleChange(e)}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}

// 特別支援加算
export const TokubetsuShien = (props) => {

  const classes = useStyles();
  const nameJp = '特別支援加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        放課後等デイサービスが、運営規定に定められている営業時間の前後で、就学児に対して、放課後等デイサービス計画に基づき、サービスの提供をした場合に加算を算定することができます。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    { value: 1, label: "選択" }
  ]

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper TokubetsuShien " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />

        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}
// 家庭連携加算
export const KateiRenkei = (props) => {
  const classes = useStyles();
  const nameJp = '家庭連携加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        障害児の保護者に対して放課後等デイサービスの従業者が居宅を訪問して、障害児が健全に成長できるよう育成をサポートするために相談支援を行ったときに算定できる加算です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    '1時間未満',
    '1時間以上',
  ]
  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper KateiRenkei " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          value={val}
          onChange={e => handleChange(e)}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}

// 関係機関連携加算
export const KankeiRenkei = (props) => {
  const classes = useStyles();
  const nameJp = '関係機関連携加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";;
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        関係機関連携加算とは、児童の関係者と連携し、情報を共有することにより児童に対する理解を深め、サービスの質を高めていく取組を評価する加算となります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    '関係機関連携加算Ⅰ',
    '関係機関連携加算Ⅱ',
  ]
  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper KankeiRenkei " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          value={val}
          onChange={e => handleChange(e)}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}
        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}
// 事業所内相談支援加算
export const JigyousyoSoudan = (props) => {

  const classes = useStyles();
  const nameJp = '事業所内相談支援加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        放課後等デイサービスのサービス提供を行う事業所が、障害児の支援について保護者に対して相談支援を行った時に算定できる加算です。
        月一回のみ算定が可能です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = ['1時間未満','1時間以上'];

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper JigyousyoSoudan " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />

        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}

// 強度行動障害児支援加算
export const KyoudoKoudou = (props) => {

  const classes = useStyles();
  const nameJp = '強度行動障害児支援加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
      強度行動障害支援者養成研修（実践研修）を修了した職員を配置し、強度行動障害を有する児童（児基準２０点以上）に対して、支援計画を作成し当該計画に基づき支援を行った場合に算定できる加算です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    { value: 1, label: "選択" }
  ]

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper KyoudoKoudou " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />

        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}

//  保育・教育等移行支援加算
export const HoikuKyouiku = (props) => {

  const classes = useStyles();
  const nameJp = '保育・教育等移行支援加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        放課後等デイサービスのサービス提供を行う事業所が、障害児の支援について保護者に対して相談支援を行った時に算定できる加算です。
        月一回のみ算定が可能です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    { value: 1, label: "選択" }
  ]

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper HoikuKyouiku " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />

        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}

// 欠席時対応加算
export const KessekiTaiou = (props) => {

  const classes = useStyles();
  const nameJp = '欠席時対応加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        放課後等デイサービスのサービス提供を行う事業所が、障害児の支援について保護者に対して相談支援を行った時に算定できる加算です。
        月一回のみ算定が可能です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    { value: 1, label: "選択" }
  ]

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper KessekiTaiou " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />

        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}
// 訪問支援特別加算
export const HoumonShien = (props) => {

  const classes = useStyles();
  const nameJp = '訪問支援特別加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        児童の安定的な日常生活の確保する観点から、一定期間利用がない児童の家庭を訪問し、家庭状況の確認や支援を行った場合に算定できる加算となります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    '1時間未満の場合',
    '1時間以上の場合',
  ]
  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper HoumonShien " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          value={val}
          onChange={e => handleChange(e)}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}
// 利用者負担上限額管理加算
export const JougenKanri = (props) => {

  const classes = useStyles();
  const nameJp = '利用者負担上限額管理加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        複数の障害福祉サービスを利用している利用者の負担上限額を管理する事務処理等を評価する加算です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    { value: 1, label: "選択" }
  ]

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper JougenKanri " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />

        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}

// 特定処遇改善加算
export const TokuteiSyoguu = (props) => {
  const classes = useStyles();
  const nameJp = '特定処遇改善加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        福祉・介護職員等特定処遇改善加算とは、福祉・介護業界の人材不足や他産業との賃金格差を背景に、経験ある福祉・介護職員に対する賃金面を含めた待遇改善の取り組みを評価する加算です。福祉・介護職員処遇改善加算のいずれかを取得している必要があります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    '特定処遇改善加算Ⅰ',
    '特定処遇改善加算Ⅱ',
  ]
  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper TokuteiSyoguu " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          value={val}
          onChange={e => handleChange(e)}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}

// 自己評価結果等未公表減算
export const Jikohyouka = (props) => {

  const classes = useStyles();
  const nameJp = '自己評価結果等未公表減算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        自己評価結果を公表していない事業所は所定単位が減算となります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    { value: 1, label: "選択" }
  ]

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper Jikohyouka " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />

        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}

// 通所支援計画未作成減算
export const KeikakuMisakusei = (props) => {

  const classes = useStyles();
  const nameJp = '通所支援計画未作成減算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <span className="main">
        通所支援計画を作成せずに通所支援サービスを提供した場合、減算となります。      
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    '3ヶ月未満',
    '3ヶ月以上',
  ]
  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper HoumonShien " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          value={val}
          onChange={e => handleChange(e)}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}

        />
        <Discription />
        <mui.NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}
