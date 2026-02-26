// 加算請求項目共有用フォームパーツ
// dlayerパラメータで次のことを行う
// フォームの初期値をステイトから取得
// 上位レイヤで値が設定されている場合は表示をdisableにする
// 上位レイヤで非表示に設定されている場合は表示を行わない
// sizeは表示の大きさなどを指定する
// 今のところ、large、middleのみ。追加でsmall など。
// uidとdidをpropsで受け取る。場合によっては未指定のこともある

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import * as mui from '../common/materialUi';
import * as comMod from '../../commonModule';
import TextField from '@material-ui/core/TextField';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import teal from '@material-ui/core/colors/teal';
import blue from '@material-ui/core/colors/blue';
import SnackMsg from './SnackMsg';
import { getPriorityService } from "../Billing/blMakeData";
import FiberNewIcon from '@material-ui/icons/FiberNew';
import {
  useStyles,
  // sw,
  selectStyle,
  // ChkBoxGp,
  SelectGp,
} 
from './FormPartsCommon'
import { TextGP } from './FormPartsCommon';
import { orange, purple, red } from '@material-ui/core/colors';
import { HOHOU, HOUDAY, JIHATSU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import { handleSelectInputAuto, isService } from '../../albCommonModule';
import { DiscriptionTitle, KasanSelectorGP, StatusIcon, getDispControle, getAddictionOption } from './AddictionFormPartsCommon';
import { LC2024, LC202406 } from '../../modules/contants';
import { DateInput } from './StdFormParts';

// stateのdefは次の箇所から順番に探す
// com.addiction[service]
// users[x].etc.addiction
// schedule[service][did]
// schedule[uid].addiction
// schedule[uid][did].dAddiction
// 引数のint dLayerでどこまで探すか決める
// dlayerに達する前にデータがみつかった場合、
// 非表示やdisableなどの処置を決める
// カスタムフック使ってみる！
// 2021/07/14
// データレイヤを一個追加する
export const useGetDef = (name, uid='', did='', dLyer=10, pSch)=>{
  // service = (!service)?'放課後等デイサービス':service;
  did = (typeof did === 'object') ? comMod.convDid(did) : did;
  if (!isNaN(uid)) uid = 'UID' + uid;
  const com = useSelector(state => state.com);
  const users = useSelector(state => state.users);
  const sSch = useSelector(state => state.schedule);
  const classtoom = useSelector(state=>state.classroom);
  const schedule = pSch? pSch: sSch;
  // ユーザーよりサービスを取得する。取得できなかったらstateから取得
  // ユーザーよりサービスを取得できないことはありえない、のと複数サービスがあるので
  const stateService = useSelector(state=>state.service);
  const thisUser = comMod.getUser(uid, users);
  const uServise = thisUser.service;
  // 複数サービスを検出したらstateのサービスを使用する
  let service = (uServise && uServise.split(',').length === 1)? uServise: stateService;
  // それでもサービスを取得できない場合。放デイ、児発などを取得する
  if (!service){
    service = getPriorityService(uServise);
  }
  // const user = comMod.getUser(uid, users);
  let rt = null;
  if (dLyer > -1){
    rt = comMod.findDeepPath(com, ['addiction', service, name]);
  }
  if (dLyer > 0 && !rt){
    rt = comMod.findDeepPath(schedule, [service ,uid, 'addiction', name]);
  }
  if (dLyer > 1 && !rt) {
    rt = comMod.findDeepPath(schedule, [service, did, name]);
  }
  if (dLyer > 1 && !rt && classtoom) {
    rt = comMod.findDeepPath(schedule, [service, did, classtoom, name]);
  }
  // // dlayer 追加！！！
  // if (dLyer > 2 && !rt) {
  //   rt = comMod.findDeepPath(schedule, [uid, 'addiction', name]);
  // }
  if (dLyer > 2 && !rt) {
    rt = comMod.findDeepPath(schedule, [uid, did, 'dAddiction', name]);
  }

  // if (dLyer > 2 && !rt) {
  //   rt = comMod.findDeepPath(schedule, [uid, did, 'dAddiction', name]);
  // }

  // 利用実績の表示設定で非表示に設定されているか？
  const hideAddiction = com?.ext?.hideaddiction ?? {};
  if(hideAddiction[name] === 1){
    rt = -1
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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        定員は10人以下、11人以上20人以下、21人以上で請求できる単位数が変わります。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;
  
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
        onFocus={e=>handleSelectInputAuto(e)}
        error={props.err}
        helperText={props.errMsg}
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
      <DiscriptionTitle nameJp={nameJp} />

      <span className="main">
        地域区分とは地域間における人件費の差を勘案して、保険費用の配分を調整するために設けられた区分です。指定された区分を選択してください。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
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

// 障害児状態等区分 2021廃止
export const JoutaiKubun = (props) => {

  const classes = useStyles();
  const nameJp = '障害児状態等区分';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.target.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription =()=>(
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        中重度の障害児の割合、営業時間などによる状態区分を選択します。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);

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
  // const serviceItems = useSelector(state=>state.serviceItems);
  const service = useSelector(state=>state.service);
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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        介護保険の指定を受けている通所介護事業所等が障害福祉サービスの共生型事業所としての指定を受けて、サービスを提供する場合の加算を申請します。
        （テスト中）
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);

  if (notDisp) return (null);
  if (service && ![HOUDAY, JIHATSU].includes(service)) return null;

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

// 基準該当
export const KijunGaitou = (props) => {

  const classes = useStyles();
  const nameJp = '基準該当';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const service = useSelector(state=>state.service);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  // const service = useSelector(state=>state.service);
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        基準該当デイサービス・基準該当児童発達支援は、介護保険の基準を満たさないが一定の要件をクリアした事業所が提供するサービスです。
        （テスト中）
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp, '', service);

  if (notDisp) return (null);
  if (service && ![HOUDAY, JIHATSU].includes(service)) return null;
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
  const {uid, did, schedule, dLayer} = props;
  const allState = useSelector(state=>state);
  const {service, classroom, com} = allState;
  const preDef = useGetDef(nameJp, uid, did, dLayer - 1, schedule);
  let def = useGetDef(nameJp, uid, did, dLayer, schedule);
  if (props.withClassroom){
    def = com?.addiction?.[service]?.[classroom]?.[nameJp];
  }

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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        福祉の専門職を配置することにより、サービスの質を向上させる取組を行っている事業所を評価する加算です。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;
  
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
// 法改正でname属性も変更している
export const JiShidouKaHai1 = (props) => {
  const classes = useStyles();
  // const nameJp = '児童指導員等加配加算（Ⅰ）';
  // const nameJp = '児童指導員等加配加算';
  const allState = useSelector(state=>state);
  const {service, classroom, com, stdDate} = allState;
  const nameJp = stdDate >= '2024-04-01' ? '児童指導員等加配加算': '児童指導員等加配加算（Ⅰ）';
  // dlayer -1 で値取得。ここで値が戻ったら上位モジュールで値決定済み
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  // 自身のレイヤで値取得。設定済みならデフォルト値に。
  let def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  if (props.withClassroom){
    def = com?.addiction?.[service]?.[classroom]?.[nameJp];
  }
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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        人員配置基準以上に専門的な知識を持つ者を配置し、十分な人員によりサービス提供することを評価する加算です。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp, stdDate);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;

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
// 2021 廃止
// export const JiShidouKaHai2 = (props) => {
//   const classes = useStyles();
//   const nameJp = '児童指導員等加配加算（Ⅱ）';
//   const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
//   const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
//   const [disabled, notDisp] = getDispControle(preDef);
//   const [val, setval] = useState((disabled) ? preDef : def);
//   const noOpt = (props.noOpt) ? "noOpt " : "";
//   const handleChange = (e) => {
//     setval(e.currentTarget.value)
//   }
//   const [noticeopen, setnoticeopen] = useState(false);
//   const discriptionClick = (e) => {
//     setnoticeopen(true);
//   }

//   const Discription = () => (
//     <span className='discription' onClick={discriptionClick}>
//       <span className="main">
//         児童指導員等加配加算（Ⅰ）に加えさらに人員配置を行ったときに請求できます。基本報酬で区分（1）を算定している必要があります。
//       </span>
//       <span className="more">
//         もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
//         もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
//       </span>
//     </span>
//   )
//   const opts = [
//     "理学療法士等",
//     "児童指導員等",
//     "その他の従業者",
//   ];


//   if (notDisp) return (null);
//   else return (
//     <>
//       <div className={"aFormPartsWrapper JiShidouKaHai2 " + noOpt + props.size}>
//         <StatusIcon val={val} size={props.size} />
//         <SelectGp
//           onChange={e => handleChange(e)}
//           value={val}
//           nameJp={nameJp}
//           size={props.size}
//           opts={(props.noOpt) ? [] : opts}
//           disabled={disabled}
//           dispHide={props.dispHide}

//         />
//         <Discription />
//         <mui.NoticeDialog
//           className={classes.noticeDialog}
//           title={nameJp}
//           noticeopen={noticeopen}
//           setnoticeopen={setnoticeopen}
//           Content={Discription}
//         />

//       </div>
//     </>

//   )
// }

// 児童指導員配置加算 2021廃止
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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        児童指導員、保育士、強度行動障害支援者養成研修等の修了者が１名以上配置されていることが必要です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
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
// 放デイの場合、重心にしか適用されない
// 重心専用の施設じゃないとＮＧ？
// 児発も重心のみ
export const KangoKahai = (props) => {
  const classes = useStyles();
  const nameJp = '看護職員加配加算';
  const allState = useSelector(state=>state);
  const {service, classroom, com} = allState;
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  let def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  if (props.withClassroom){
    def = com?.addiction?.[service]?.[classroom]?.[nameJp];
  }
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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        医療的ケアが必要な児童を受け入れるための体制を確保し、ニーズに応じて必要な支援を受けることができるよう、看護職員を加配した事業所を評価する加算になります。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;


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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        利用時間が一定時間未満の事業所に対して、報酬に差がないことは不均衡である事から、営業時間の実態に合わせて基本報酬が減算となります。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;

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
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
    if(props.setPropsVal) props.setPropsVal(e.currentTarget.value);
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        医療機関等から看護職員が放課後等デイサービスに訪問し、看護の提供や認定特定行為業務従事者に対して喀痰吸引等の指導を行う取り組みを評価する加算です。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper IryouRenkei " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} nameJp={nameJp}/>
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled || props.disabled}
          dispHide={props.dispHide}
          noLabel={props.noLabel ?? false}
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
// サービスコードを特定するパラメータから独立した減算項目に変更になった2021
// どう扱うか要検討
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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        指定基準に基づき求められる身体拘束等にかかわる記録が行われていない場合、身体拘束廃止未実施減算として所定単位が減算となります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;


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
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        共生型サービス認定を受けている事業所がその体制を強化することによって評価される加算です。
        （テスト中）
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);

  if (notDisp) return (null);
  if (!targetService.includes(service)) return null;
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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        やむを得ない事情がある場合、例外的に定員を超過した児童の受け入れが認められています。
        例外的な定員超過の受け入れが一定の人数を超えた場合、
        定員超過利用減算として所定単位が減算となります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;


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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        営業時間中に配置するべき人員基準を満たしていない状況でサービスを提供した場合、人員欠如の状況と期間に応じて所定単位数から減算となります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;

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
  const service = useSelector(s=>s.service);

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        原則1名配置しなければならない「児童発達支援管理責任者」が不在のとなった場合、減算の対象となります。児童発達支援管理責任者が退職し、後任の有資格者が確保できない場合などが該当します。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )

  const opts = getAddictionOption(nameJp);
  const targetService = [HOUDAY, JIHATSU, HOHOU];
  if (!targetService.includes(service)) return null;


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
  const stdDate = useSelector(state=>state.stdDate)
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  const Haishi = () => {
    if (stdDate >= '2022-10-01'){
      return (
        <span style={{color: red[800]}}>
          この加算は2022年10月提供分以降は廃止になります。設定を解除して下さい。
        </span>
     )
    }
    else return null;
  }
  
  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        障害福祉サービスの特性を踏まえ、福祉・介護職員処遇改善加算の要件を緩和した加算となります。
        事務職や医療職等の福祉・介護職以外の従業者も含みます。
        <Haishi/>
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;

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

// 福祉・介護職員処遇改善特別加算
// 2024-06以降非表示
export const BaseUpKasan = (props) => {
  const classes = useStyles();
  const nameJp = '福祉・介護職員等ベースアップ等支援加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const stdDate = useSelector(state=>state.stdDate);
  const service = useSelector(s=>s.service);

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  
  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        令和4年10月の介護報酬改定（臨時改定）を経て創設される新たな加算です。
        介護職員に対して3％程度（月額 9,000 円相当）引き上げるための措置とされています。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  if (stdDate < '2022-10-01') return null;
  if (stdDate >= '2024-06-01') return null;
  if (notDisp) return (null);
  const targetService = [HOUDAY, JIHATSU, HOHOU];
  if (!targetService.includes(service)) return null;

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
          label={'ベースアップ等支援加算'}
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
  const [disabled, notDisp] = getDispControle(preDef);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const stdDate = useSelector(state=>state.stdDate)
  const service = useSelector(s=>s.service);
  const com = useSelector(s=>s.com);
  const classroom = useSelector(s=>s.classroom);
  let def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  if (props.withClassroom){
    def = com?.addiction?.[service]?.[classroom]?.[nameJp];
  }
  const [val, setval] = useState((disabled) ? preDef : def);

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Henkou = () => {
    if (stdDate >= '2022-10-01' && stdDate <= '2023-03-01'){
      return (
        <span style={{color: red[800]}}>
          この加算は2022年10月提供分以降はⅣとⅤが廃止になります。
          必要な場合は、設定の変更をお願いします。
        </span>
      )
    }
    else return null;
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        福祉・介護人材の賃金面を含めた待遇改善を目的として、事業所における取組を評価する加算となります。
        事業所における取組の内容に応じて、（Ⅰ）から（Ⅴ）までの１つを算定できます。
        <Henkou/>
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
    
  const opts = getAddictionOption(nameJp, stdDate, service);


  const targetService = [HOUDAY, JIHATSU, HOHOU];
  if (!targetService.includes(service)) return null;

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
// 法改正後の延長支援加算は配置箇所が違うため別コンポーネントとする
export const EnchouShien = (props) => {

  const classes = useStyles();
  const nameJp = '延長支援加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const stdDate = useSelector(s=>s.stdDate)
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        運営規定に定められている営業時間の前後で、就学児に対して、放課後等デイサービス計画に基づき、サービスの提供をした場合に加算を算定することができます。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;
  if (stdDate >= LC2024) return null;
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
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const stdDate = useSelector(s=>s.stdDate);
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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        特別支援加算とは、理学療法士、作業療法士、言語聴覚士、心理指導担当職員、看護職員などの人員を配置し、作成した特別支援計画に基づき支援をした場合に、所定単位数に加算できるものです。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;
  // 24年度以降は表示しない
  if (stdDate >= '2024-04-01') return null;


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

// 家庭連携加算 数値入力版
export const KateiRenkeiNum = (props) => {
  const classes = useStyles();
  const nameJp = '家庭連携加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const [err, setErr] = useState({value: false, msg: ''});
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const classList = ['tfLargeNum', 'tfMiddleNum'];
  const cls = selectStyle(props.size, classList);
  const service = useSelector(s=>s.service);
  const stdDate = useSelector(s=>s.stdDate);


  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const handleBlur = (e) =>{
    const v = comMod.convHankaku(e.target.value);
    setval(v);
    if (!v){
      setErr({value: false, msg: ''});
    }
    else if (isNaN(v)) {
      setErr({value: true, msg: '数値を入力してください'});
    }
    else if (v < 1 || v > 600){
      setErr({value: true, msg: '値が不正です'});
    }
    else{
      setErr({value: false, msg: ''});

    }
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        障害児の保護者に対して従業者が居宅を訪問して、障害児が健全に成長できるよう育成をサポートするために相談支援を行ったときに算定できる加算です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const targetService = [HOUDAY, JIHATSU, HOHOU];
  if (!targetService.includes(service)) return null;
  // 24年度以降は表示しない
  if (stdDate >= '2024-04-01') return null;

  if (notDisp) return (null);
  return (
    <>
      <div 
        className={classes[cls] + " aFormPartsWrapper KateiRenkei " + noOpt + props.size}
      >
        <StatusIcon val={val} size={props.size} />
        <TextGP
          name={nameJp} label='家庭内連携'
          value={val} 
          placeholder='分数を入力'
          shrink={true}
          onChange={(e) => handleChange(e)}
          onBlur={(e) => handleBlur(e)}
          err={err.value} errMsg={err.msg}
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
  const service = useSelector(s=>s.service);

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        障害児の保護者に対して放課後等デイサービスの従業者が居宅を訪問して、障害児が健全に成長できるよう育成をサポートするために相談支援を行ったときに算定できる加算です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const targetService = [HOUDAY, JIHATSU, HOHOU];
  if (!targetService.includes(service)) return null;

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
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";;
  const stdDate = useSelector(s=>s.stdDate);
  const handleChange = (e) => {
    setval(e.currentTarget.value);
    if(props.setPropsVal) props.setPropsVal(e.currentTarget.value);
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  const toNum = v => Number(v) || v;
  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        関係機関連携加算とは、児童の関係者と連携し、情報を共有することにより児童に対する理解を深め、サービスの質を高めていく取組を評価する加算となります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU, HOHOU];
  const opts = getAddictionOption(nameJp, stdDate, service);
  if (!targetService.includes(service)) return null;

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
          noLabel={props.noLabel ?? false}
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
// 2021/08/18 児童発達支援対応済み->取り消し
// 2021/12/04 間違い訂正
export const JigyousyoSoudan = (props) => {
  const classes = useStyles();
  const nameJp = '事業所内相談支援加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const stdDate = useSelector(s=>s.stdDate);

  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス

  const thisUser = comMod.getUser(props.uid, users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: service;

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;
  if (stdDate >= LC2024) return null;


  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
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
  // const opts = (service === '放課後等デイサービス')?
  // [{ value: 1, label: "選択" }]: ['事業所内相談支援加算Ⅰ', '事業所内相談支援加算Ⅱ'];
  // const opts = ['1時間未満','1時間以上'];
  // const opts = ['事業所内相談支援加算Ⅰ', '事業所内相談支援加算Ⅱ'];
  const opts = getAddictionOption(nameJp, stdDate, service);
  // 24年度以降は表示しない
  if (stdDate >= '2024-04-01') return null;

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
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const service = useSelector(state=>state.service);
  const stdDate = useSelector(s=>s.stdDate);

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        事業所が、障害児の支援について保護者に対して相談支援を行った時に算定できる加算です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp, stdDate, service);

  const targetService = [HOUDAY, JIHATSU, HOHOU];
  if (!targetService.includes(service)) return null;

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
  const stdDate = useSelector(s=>s.stdDate);
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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        サービス提供を行う事業所が、退所前や退所後に地域の保育教育等を受けられるように支援を行った場合に算定できる加算です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp, stdDate);
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;


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
// 2021/08/18 児童発達支援対応
// 2021/11/08 欠席を選択することによりスナック通知
export const KessekiTaiou = (props) => {
  const classes = useStyles();
  const nameJp = '欠席時対応加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const stdDate = useSelector(s=>s.stdDate);

  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス
  // const thisUser = comMod.getUser(props.uid, users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: sService;

  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  useEffect(()=>{
    if (val && parseInt(val) !== -1){
      setSnack({
        msg: '欠席対応加算設定済みです。この予定は欠席扱いとして保存されます。',
        severity: 'warning',
      });
    }
  },[val]);
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;


  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        欠席時対応加算とは、児童発達支援・放課後等デイサービスにおいて、あらかじめ事業所の利用を予定した日に、
        急病等によりその利用を中止した場合において、従業者が、お子さまや保護者さまと連絡調整、
        その他の相談援助を行うとともに、該当のお子さまの状況、相談援助の内容等を記録した場合に、
        1ヶ月に月4回を限度として、加算できるものです。
      </span>
      <span className='more'>
        欠席時対応加算の算定要件<br></br>
        利用日の前々日、前日、当日（営業日換算）までに欠席の連絡を通所給付決定保護者にもらうこと<br></br>
        その場でお子さまか保護者さまに相談援助をすること<br></br>
        相談援助の内容を記録すること<br></br>
      </span>
    </span>
  )
  
  // const opts = (service === '放課後等デイサービス')?
  // ['欠席時対応加算１', '欠席時対応加算２']: [{ value: 1, label: "選択" }];
  const opts = getAddictionOption(nameJp, stdDate, service);


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
      <SnackMsg {...snack} />
    </>
  )
}

// 人工内耳装用児支援加算
// 2021/08/18 児童発達支援のみ
export const JinkouNaiji = (props) => {

  const classes = useStyles();
  const nameJp = '人工内耳装用児支援加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const stdDate = useSelector(s=>s.stdDate);
  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス
  const thisUser = comMod.getUser(props.uid, users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: sService;

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        人工内耳をつけている子どもには、手術前だけでなく手術後の支援体制を整えることも大切です。
        人工内耳を装用した子どもが日常生活を支障なく送れるように、医療機関や家族だけではなく、
        児童発達支援センターも連携体制をとる必要があります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  if (service !== '児童発達支援' || stdDate <= LC2024) return null;
  const opts = getAddictionOption(nameJp, stdDate, service);

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
// 2021廃止
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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        児童の安定的な日常生活の確保する観点から、一定期間利用がない児童の家庭を訪問し、家庭状況の確認や支援を行った場合に算定できる加算となります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
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
  const users = useSelector(state=>state.users);
  const thisUser = (props.uid) ? comMod.getUser(props.uid, users): {};
  
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  // 長兄は上限管理加算を計上できるようにする
  const kanri = thisUser.kanri_type === '管理事業所';
  const firstBros = parseInt(thisUser.brosIndex) === 1
  if (!kanri && !firstBros) return null;
  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        複数の障害福祉サービスを利用している利用者の負担上限額を管理する事務処理等を評価する加算です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);

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
          hidenull
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
  let def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const stdDate = useSelector(s=>s.stdDate);
  const com = useSelector(s=>s.com);
  const classroom = useSelector(s=>s.classroom);
  const service = useSelector(state=>state.service);

  if (props.withClassroom){
    def = com?.addiction?.[service]?.[classroom]?.[nameJp];
  }
  const [val, setval] = useState((disabled) ? preDef : def);

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        福祉・介護職員等特定処遇改善加算とは、福祉・介護業界の人材不足や他産業との賃金格差を背景に、経験ある福祉・介護職員に対する賃金面を含めた待遇改善の取り組みを評価する加算です。福祉・介護職員処遇改善加算のいずれかを取得している必要があります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  
  // 保訪はオプションがない
  const opts = getAddictionOption(nameJp, stdDate, service);
  const targetService = [HOUDAY, JIHATSU, HOHOU];
  if (!targetService.includes(service)) return null;
  if (stdDate >= LC202406) return null;

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
  const stdDate = useSelector(s=>s.stdDate);

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        自己評価結果を公表していない事業所は所定単位が減算となります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;

  if (notDisp) return (null);
  // if (stdDate >= LC2024) return null;

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
  const service = useSelector(s=>s.service);

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        通所支援計画を作成せずに通所支援サービスを提供した場合、減算となります。      
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;


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

// 自己評価結果等未公表減算
export const ShienPrgGensan = (props) => {
  const classes = useStyles();
  const nameJp = '支援プログラム未公表減算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const stdDate = useSelector(s=>s.stdDate);

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        この支援プログラムを作成・公表しなかった場合や、都道府県への届出をしなかった場合に基本報酬が減算されるものです。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;

  if (notDisp) return (null);
  if (stdDate < "2025-04-01") return null;

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


// 2021法規改正
// 医療ケア
// 2023/04/13
// 利用者のサービスに医療的ケア児が設定されていない場合は表示しない
export const IryouCareJi = (props) => {
  const classes = useStyles();
  const nameJp = '医療ケア児基本報酬区分';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const users = useSelector(state=>state.users);
  const {uid} = props;
  const thisUser = comMod.getUser(uid, users);
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        医療的ケア児の新判定スコアの点数に応じて段階的に基本報酬が設定されます。      
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  if (notDisp) return (null);
  // 医療的ケア児に設定されていない場合は表示しない
  const icareType = thisUser.icareType? thisUser.icareType: '';
  if (!icareType.includes('医療的ケア')) return null;
  else return (
    <>
      <div className={"aFormPartsWrapper IryouCareJi " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          value={val}
          onChange={e => handleChange(e)}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}
          hidenull={!props.noOpt}
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
export const SoudanShien = (props) => {
  const classes = useStyles();
  const nameJp = '事業所内相談支援加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const stdDate = useSelector(s=>s.stdDate);

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        事業所内相談支援加算とは、児童発達支援・放課後等デイサービスにおいて、
        個別支援計画に基づき、あらかじめ保護者さまの同意を得て、
        お子さまとその保護者さまに相談援助を行い、その記録を残した場合に加算できるものです。   
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
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

// 個別サポート加算
// export const KobetsuSuport = (props) => {
//   const classes = useStyles();
//   const {uid, did, dLayer, size, dispHide, } = props;
//   const nameJp = '個別サポート加算';
//   const preDef = useGetDef(nameJp, uid, did, dLayer - 1);
//   const def = useGetDef(nameJp, uid, did, dLayer);
//   const [disabled, notDisp] = getDispControle(preDef);
//   const [val, setval] = useState((disabled) ? preDef : def);
//   const noOpt = (props.noOpt) ? "noOpt " : "";
//   const handleChange = (e) => {
//     setval(e.currentTarget.value)
//   }
//   const [noticeopen, setnoticeopen] = useState(false);
//   const discriptionClick = (e) => {
//     setnoticeopen(true);
//   }

//   const Discription = () => (
//     <span className='discription' onClick={discriptionClick}>
//       <DiscriptionTitle nameJp={nameJp} />
//       <span className="main">
//         ケアニーズの高い児童（著しく重度および行動上の課題のある児童）への支援、
//         虐待等の要保護児童等への支援について評価する加算になります。
//       </span>
//       <span className='more'>
//         もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
//         もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
//       </span>
//     </span>
//   )
//   const opts = [
//     '個別サポート加算Ⅰ','個別サポート加算Ⅱ',
//   ]
//   const service = useSelector(state=>state.service);
//   const targetService = [HOUDAY, JIHATSU];
//   if (!targetService.includes(service)) return null;

//   if (notDisp) return (null);
//   else return (
//     <>
//       <div className={"aFormPartsWrapper HoumonShien " + noOpt + size}>
//         <StatusIcon val={val} size={size} />
//         <SelectGp
//           value={val}
//           onChange={e => handleChange(e)}
//           nameJp={nameJp}
//           size={size}
//           opts={(noOpt) ? [] : opts}
//           disabled={disabled}
//           dispHide={dispHide}

//         />
//         <Discription />
//         <mui.NoticeDialog
//           className={classes.noticeDialog}
//           title={nameJp}
//           noticeopen={noticeopen}
//           setnoticeopen={setnoticeopen}
//           Content={Discription}
//         />
//       </div>
//     </>
//   )
// }

// 個別サポート加算１
export const KobetsuSuport1 = (props) => {
  const classes = useStyles();
  const {uid, did, dLayer, size, dispHide, } = props;
  const nameJp = '個別サポート加算１';
  const preDef = useGetDef(nameJp, uid, did, dLayer - 1);
  const def = useGetDef(nameJp, uid, did, dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const service = useSelector(s=>s.service);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  const stdDate = useSelector(s=>s.stdDate);

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        個別サポート加算Iは、放課後等デイサービス・児童発達支援・医療型児童発達支援において、
        ケアニーズが高い障害児に支援を行ったときに加算されるものです。
      </span>
      <span className='more'>
        【対象要件】(放課後等デイサービス)<br></br>
        以下の(1)または(2)に該当すること。<br></br>
        (1)食事、排せつ、入浴および移動のうち3つ以上の日常生活動作について全介助を
        必要とするもの。<br></br>
        (2)指標判定の票の項目の点数の合計が13点以上であるもの。<br></br>
        (児童発達支援)<br></br>
        3歳未満の場合<br></br>
        食事、排せつ、入浴および移動の項目で、全介助または一部解除である項目が2つ以上あること。
        以下の(1)および(2)に該当すること。<br></br>
        (1)食事、排せつ、入浴および移動の項目で、全介助または一部介助である項目が
        1つ以上ある。<br></br>
        (2)食事、排せつ、入浴および移動以外の項目（行動障害および精神症状の各項目）で、
        ほぼ毎日（週5日以上）ある、または週に1回以上ある項目が1つ以上ある。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp, stdDate, service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;
  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper HoumonShien " + noOpt + size}>
        <StatusIcon val={val} size={size} />
        <SelectGp
          value={val}
          onChange={e => handleChange(e)}
          nameJp={nameJp}
          size={size}
          opts={(noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={dispHide}

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

// 個別サポート加算２
export const KobetsuSuport2 = (props) => {
  const classes = useStyles();
  const {uid, did, dLayer, size, dispHide, } = props;
  const nameJp = '個別サポート加算２';
  const preDef = useGetDef(nameJp, uid, did, dLayer - 1);
  const def = useGetDef(nameJp, uid, did, dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const service = useSelector(s=>s.service);

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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        要保護（児童福祉法第6条の3第8項に規定する要保護児童をいう。）又は
        要支援児童（同法同条第5項に規定する要支援児童をいう。）を受け入れた
        場合に、児童相談所その他の公的機関又は当該児童若しくはその保護者の
        主治医と連携し、児童発達支援等を行う必要のあるものに対し、指定児童
        発達支援事業所等において、支援を行った場合に評価する加算です。
      </span>
      <span className='more'>
        対象児童を受け入れている事業所においては、加算の算定にあたって子
        ども福祉課への届出は不要ですが、報酬告示において保護者の同意を得る
        ことが求められているため、同意を得た記録を整備しておいてください
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper HoumonShien " + noOpt + size}>
        <StatusIcon val={val} size={size} />
        <SelectGp
          value={val}
          onChange={e => handleChange(e)}
          nameJp={nameJp}
          size={size}
          opts={(noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={dispHide}

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


// 放デイ専用のComponent
export const TeikyoujikanKubun = (props) => {
  const classes = useStyles();
  const nameJp = 'サービス提供時間区分';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス
  const thisUser = comMod.getUser(props.uid, users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: sService;
  const stdDate = useSelector(state=>state.stdDate);

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  if (service !== '放課後等デイサービス') return null;
  const Discription =()=>(
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        放課後等に実施するサービスの提供時間の区分を設定します。
        重症心身障害児型の施設の場合、この設定は請求に反映されません。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);

  if (notDisp) return (null);
  if (stdDate >= LC2024) return null;

  else return (
    <>
    <div 
      className={
        "aFormPartsWrapper TeikyoujikanKubun " + noOpt + props.size
      }
    >
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

// 専門的支援加算
// サンプルケースとしてこのコンポーネントを児発と放デイで切り替える
// uidが指定されいたらuidに従った処理を行う
// 指定されていない場合stateのサービスに準拠する
// どちらも指定されていない場合はどうするよ？ -> 想定しないｗ
// 2021/08/18 児童発達支援対応済み 動作確認済

export const SenmonShien = (props) => {
  const classes = useStyles();
  const nameJp = '専門的支援加算';
  const allState = useSelector(state=>state);
  const {service, classroom, com, stdDate} = allState;

  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  let def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  if (props.withClassroom){
    def = com?.addiction?.[service]?.[classroom]?.[nameJp];
  }
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";

  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  // const users = useSelector(state=>state.users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: sService;
  const handleChange = (e) => {
    setval(e.currentTarget.value)
    if(props.setPropsVal) props.setPropsVal(e.currentTarget.value);
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;
  // 24年度以降は表示しない
  if (stdDate >= '2024-04-01') return null;


  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        専門的支援を必要とする児童のため専門職の配置を評価する加算です。
        理学療法士、作業療法士、言語聴覚士、心理指導担当職員、視覚障害学科履修者などを
        常勤換算で一人以上配置した場合が対象になります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp, stdDate, service);

  if (notDisp) return (null);
  if (stdDate >= LC2024) return null;

  else return (
    <>
      <div className={"aFormPartsWrapper SenmonShien " + noOpt + props.size}>
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


// 食事提供加算
// 児童発達支援のみに利用されるコンポーネントとする
export const ShokujiTeikyou = (props) => {
  const classes = useStyles();
  const nameJp = '食事提供加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  // const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス
  // const thisUser = comMod.getUser(props.uid, users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: sService;
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  if (service !== '児童発達支援') return null;
  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        低所得者又は中間所得者の食費の経済的負担を減らすための設けられた加算となります。
        児童発達支援事業所内の調理室を使用して提供されていること、
        事業所が自ら調理を行い、または最終的責任の下で第三者に委託し、提供していることが
        必要になります。

      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShokujiTeikyou " + noOpt + props.size}>
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


// 栄養士配置加算
// 児童発達支援のみに利用されるコンポーネントとする
export const EiyoushiHaichi = (props) => {
  const classes = useStyles();
  const nameJp = '栄養士配置加算';
  const allState = useSelector(state=>state);
  const {service, classroom, com} = allState;
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  let def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  if (props.withClassroom){
    def = com?.addiction?.[service]?.[classroom]?.[nameJp];
  }
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);

  useEffect(() => {
    setval((disabled) ? preDef : def);
  }, [classroom, props.uid, props.did]);

  const noOpt = (props.noOpt) ? "noOpt " : "";
  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  // const users = useSelector(state=>state.users);
  // const thisUser = comMod.getUser(props.uid, users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: sService;
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;
  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        児童発達支援事業所における栄養士配置加算とは、人員配置基準に配置が義務付けられていない管理栄養士等を配置するなど要件を満たし、児童の食事状況を把握し、適切な食事管理をする取り組みを評価する加算です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShokujiTeikyou " + noOpt + props.size}>
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


// 地方公共団体
// 児童発達支援のみに利用されるコンポーネントとする
export const Chikoutai = (props) => {
  const classes = useStyles();
  const nameJp = '地方公共団体';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  // const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス
  // const thisUser = comMod.getUser(props.uid, users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: sService;
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  if (service !== '児童発達支援') return null;
  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        地方公共団体が設置する施設かどうかを指定します。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )

  const opts = getAddictionOption(nameJp);

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShokujiTeikyou " + noOpt + props.size}>
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
// 就学区分
// 児童発達支援のみに利用されるコンポーネントとする
export const SyuugakuKubun = (props) => {
  const classes = useStyles();
  const nameJp = '就学区分';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  // const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス
  // const thisUser = comMod.getUser(props.uid, users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: sService;
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  if (service !== '児童発達支援') return null;
  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        主に未就学児が通う施設かどうかを指定します。<br></br>
        区分１:未就学児の延べ利用人数を、全障がい児の延べ利用人数で除した得た数が７０％以上<br></br>
        区分２:未就学児の延べ利用人数を、全障がい児の延べ利用人数で除した得た数が７０％未満<br></br>
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShokujiTeikyou " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}
          nullLabel='非該当'
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

// 施設区分
// 児童発達支援のみに利用されるコンポーネントとする
export const ShisetsuKubun = (props) => {
  const classes = useStyles();
  const nameJp = '児童発達支援センター';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  // const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス
  // const thisUser = comMod.getUser(props.uid, users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: sService;
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  if (service !== '児童発達支援') return null;
  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        児童発達支援センターは発達障害のあるなしにかかわらず、育ちに支援を必要とする
        児童や家族の相談をお受けし、お子さんの発達状況に応じて、さまざまな支援
        を行う地域の療育の拠点です。
        該当するかどうかを指定します。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShokujiTeikyou " + noOpt + props.size}>
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

// 重症心身型
export const Juushingata = (props) => {
  const classes = useStyles();
  const nameJp = '重症心身型';
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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
      放課後等デイサービス、児童発達支援には、「重症心身型」と「重症心身外」の２つの分け方があり、
      重症心新型のサービス提供の指定を受けているかどうかを設定します。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;


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

// サービスごと単位
export const ServiceAsTanni = (props) => {
  const classes = useStyles();
  const nameJp = 'サービスごと単位';
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
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        サービスごとに単位を保有しているかどうかを選択します。
        多機能型施設において定員10人の場合、放課後等デイサービス、児童発達支援それぞれに10人の定員になるか、合計で10人の定員になるかを指定して下さい。
        通常は未選択で問題ありません。
        設定する場合は放課後等デイサービス、児童発達支援両方で設定して下さい。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;

  if (notDisp) return (null);
  else return (
    <>
      <div className={
        "aFormPartsWrapper serviceAsTAnni " + noOpt + props.size}
      >
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
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


// 無償化
// 児童発達支援のみに利用されるコンポーネントとする
export const Musyouka = (props) => {
  const classes = useStyles();
  const nameJp = '児童発達支援無償化';
  // let preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  // 例外的に他のname属性でロックをかける。上位では自動設定となっているため
  const preDef = useGetDef(
    '児童発達支援無償化自動設定', props.uid, props.did, props.dLayer - 1
  );
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  // const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス
  // const thisUser = comMod.getUser(props.uid, users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: sService;
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  // const targetSvc
  // if (service === '放課後等デイサービス') return null;
  const targetSvc = [HOHOU, JIHATSU]
  // 児童発達支援以外は表示しないで終了する
  if (!targetSvc.includes(service)) return null;

  // // 相談支援では非表示に
  // if ([KEIKAKU_SOUDAN,SYOUGAI_SOUDAN].includes(service)) return null;
  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
         児発無償化を手動で設定する場合は「選択」にして下さい。児発無償化自動設定が有効な場合、この設定項目は無効になります。ここでの表示に関わらず誕生日により児発無償化が判断されます。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShokujiTeikyou " + noOpt + props.size}>
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
// 無償化
// 児童発達支援のみに利用されるコンポーネントとする
export const MusyoukaAuto = (props) => {
  const classes = useStyles();
  const nameJp = '児童発達支援無償化自動設定';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  // const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス
  // const thisUser = comMod.getUser(props.uid, users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: sService;
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  if (service === '放課後等デイサービス') return null;
  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        ３歳から５歳までの障害のある子どもたちのための児童発達支援等の利用者負担が
        無償化されます。
        こちらの設定を有効化するとご利用者の年齢により自動で無償化の判断を行います。
        この設定を利用するときはご利用者の誕生日が正確に設定済みで
        年齢（＊歳児）が正しく表示されていることをご確認下さい。
        この設定を利用しないときは利用者一人ひとりに対して個別に設定して下さい。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const targetSvc = [JIHATSU, HOHOU];
  if (!targetSvc.includes(service)) return null;

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShokujiTeikyou " + noOpt + props.size}>
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

// 多子軽減措置
export const TashiKeigen = (props) => {
  const classes = useStyles();
  const nameJp = '多子軽減措置';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  // const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス
  // const thisUser = comMod.getUser(props.uid, users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: sService;

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        就学前の障害児通所支援利用児童について、
        条件によって利用者負担額の引き下げを行うものです。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const targetSvc = [HOHOU, JIHATSU]
  // 児童発達支援以外は表示しないで終了する
  if (!targetSvc.includes(service)) return null;

  const opts = getAddictionOption(nameJp);

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

// 保訪保育訪問
export const HoikuHoumn = (props) => {
  const classes = useStyles();
  const nameJp = '保育訪問';
  // const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const {uid, inAddiction, schedule, did} = props;
  const nomalDef = useGetDef(nameJp, props.uid, props.did, props.dLayer, schedule)
  const def = (inAddiction) ? nomalDef: comMod.fdp(schedule, [uid, did, 'dAddiction', nameJp])
  // const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState(def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス
  const sService = useSelector(state=>state.service);
  const thisUser = comMod.getUser(uid, users);
  const hasHohou = isService(thisUser, HOHOU);

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        保育所等に通う障害のある児童について、通い先の施設等を訪問し、
        障害のある児童及び保育所等のスタッフに対し、
        集団生活に適応するための専門的な支援や支援方法等の指導等を行います。
      </span>
      <span className='more'>
      </span>
    </span>
  )
  const dispOrNot = () => {
    // 加算として取得するときは表示する
    if (!hasHohou) return false;  
    if (!inAddiction && sService !== HOHOU) return false;
    if (inAddiction && sService === HOHOU) return false;
    else return true;
  }
  if (!dispOrNot()) return null;
  // 保訪を利用するかどうかクッキーの値を見る
  // const useHohou = comMod.getUisCookie(comMod.uisCookiePos.useHohouService);
  // if (!useHohou) return null;

  const opts = getAddictionOption(nameJp);

  // if (notDisp) return (null);
  return (
    <>
      <div className={"aFormPartsWrapper JigyousyoSoudan " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp} label='保育訪問'
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          // disabled={disabled}
          dispHide={props.dispHide}
          hidenull = {!inAddiction}
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

// 訪問支援員特別加算
export const HohouSenmon = (props) => {
  const classes = useStyles();
  const nameJp = '訪問支援員特別加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const stdDate = useSelector(s=>s.stdDate)

  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  // const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス
  // const thisUser = comMod.getUser(props.uid, users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: sService;

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  const Haishi = () => {
    if (stdDate >= LC2024){
      return (
        <span style={{color: red[800]}}>
          この設定は基本報酬から単独の加算に切り替わりました。2024年4月以降、ここでの設定は未選択にして下さい。
        </span>
     )
    }
    else return null;
  }


  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        作業療法士や理学療法士、言語聴覚士、保育士、看護職員等の専門性の高い職員を配置した場合の加算です。
        <Haishi/>
      </span>
      <span className='more'>
      </span>
    </span>
  )
  // 保育訪問以外は表示しないで終了する
  if (service !== HOHOU) return null;
  // 保訪を利用するかどうかクッキーの値を見る
  // const useHohou = comMod.getUisCookie(comMod.uisCookiePos.useHohouService);
  // if (!useHohou) return null;

  const opts = getAddictionOption(nameJp);

  if (stdDate >= LC202406) return null;
  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper JigyousyoSoudan " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp} label='専門職員'
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}
          // hidenull
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

// 初回加算
// 保育所等訪問支援で表示を行う
// svcsStrにサービス名を指定するとそのサービスで表示を行うことが出来る
// 相談支援に対応するためsvcsStrを設定した
export const SyokaiKasan = (props) => {
  const classes = useStyles();
  const nameJp = '初回加算';
  const {uid, did, dLayer, schedule, label, svcsStr} = props;
  const preDef = useGetDef(nameJp, uid, did, dLayer - 1, schedule);
  const def = useGetDef(nameJp, uid, did, dLayer, schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス
  const user = comMod.getUser(props.uid, users);
  const svcs = svcsStr? svcsStr.split(','): [];
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        児童発達支援管理責任者が、初回訪問又は初回訪問の同月に保育所等の訪問先との事前調整や
        アセスメントに同行した場合に請求できる加算です。
      </span>
      <span className='more'>
      </span>
    </span>
  )
  // 保育訪問以外は表示しないで終了する
  // if (service !== HOHOU) return null;
  // 保訪を持ってなかったら非表示
  // 計画相談支援用にsvcsStrを設定する。計画相談支援でも表示を行う
  if (svcsStr){
    if (!svcs.includes(user.service)) return null;
  }
  else {
    if (!user.service.includes(HOHOU)) return null;
  }
  const opts = getAddictionOption(nameJp);

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
          label={label}
          // hidenull
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

// 特地加算
export const Tokuchi = (props) => {
  const classes = useStyles();
  const nameJp = '特地加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";

  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  // const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service); // ステート上のサービス
  // const thisUser = comMod.getUser(props.uid, users);
  // const service = (Object.keys(thisUser).length)? thisUser.service: sService;

  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        豪雪地帯、特別豪雪地帯、辺地、過疎地域等であって、人口密度が希薄、交通が不便等の理由によりサービスの確保が著しく困難な地域に対してサービスを提供した場合に算定できる加算です。
      </span>
      <span className='more'>
      </span>
    </span>
  )
  // 相談支援以外は表示しない
  // 保訪も追加する
  if (![KEIKAKU_SOUDAN, SYOUGAI_SOUDAN, ].includes(service)) return null;
  // 保訪を利用するかどうかクッキーの値を見る
  // const useHohou = comMod.getUisCookie(comMod.uisCookiePos.useHohouService);
  // if (!useHohou) return null;

  const opts = getAddictionOption(nameJp);

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper JigyousyoSoudan " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp} label='特地加算'
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}
          // hidenull
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

// 送迎加算１一定条件
export const SougeiItteiJouken = (props) => {
  const classes = useStyles();
  const {uid, did, dLayer, size, dispHide, } = props;
  const nameJp = '送迎加算Ⅰ一定条件';
  const preDef = useGetDef(nameJp, uid, did, dLayer - 1);
  const def = useGetDef(nameJp, uid, did, dLayer);
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
  const stdDate = useSelector(s=>s.stdDate);

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        次の条件を満たすときに算定できます。
        送迎加算Ⅰを算定していること。
        喀痰吸引等が必要な児童に対して送迎であること。
        看護職員が送迎すること。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = getAddictionOption(nameJp);
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;
  if (stdDate >= LC2024) return null;

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper HoumonShien " + noOpt + size}>
        <StatusIcon val={val} size={size} />
        <SelectGp
          value={val}
          onChange={e => handleChange(e)}
          nameJp={nameJp}
          size={size}
          opts={(noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={dispHide}
          label={'送迎一定条件'}
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


// 算定時間設定方法
export const SanteiJikanCalcMethod = (props) => {
  const nameJp = '算定時間設定方法';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = ``;
  const DiscriptionNode = () => (
    <span>
      開始終了時間により算定時間を自動計算するかどうかを指定します。<br></br>
      <b>自動:</b> <br></br>
      すべて自動で計算します<br></br>
      <b>半自動:</b> <br></br>
      自動で計算しますが手動で設定も可能です<br></br>
      <b>手動:</b> <br></br>
      すべて手入力を行います<br></br>
      この項目は必ず設定してください。
    </span>
  )
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, DiscriptionNode, opts, monthAdded: '2024-04-01'
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)
}

export const JikanKubun = (props) => {
  const nameJp = '時間区分';
  const svcs = [HOUDAY, JIHATSU];
  const allState = useSelector(s=>s);
  const {service, stdDate, com, users} = allState;
  const juushingata = com?.addiction?.[service]?.重症心身型 === '1';
  const kijunGaitou = com?.addiction?.[service]?.基準該当放 === '1';
  const kyouseiService = com?.addiction?.[service]?.共生型サービス === '1';
  const user = comMod.getUser(props.uid, users);
  const isJuushin = (user?.type || '').includes('重症心身障害児');
  const discriptionText = ``;
  const {offSchool} = props;
  const [opts, setOpts] = useState([]);

  const setting = com?.addiction?.[service]?.時間区分延長支援自動設定;
  const nullLabel = (parseInt(setting) >= 1)? '自動': null;

  useEffect(()=>{
    const t = [
      { value: 1, label: "区分１" },{ value: 2, label: "区分２" },{ value: 3, label: "区分３" },
    ];
    if (Number(offSchool) === 0 && service === HOUDAY){
      setOpts(t.filter(e=>e.value <= 2));
    }
    else{
      setOpts(t);
    }
  }, [offSchool])
  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    nullLabel,
  };
  // 時間区分常に自動設定
  if (Number(setting) >= 3) newProps.propsVal = null;
  // 重心が他施設で重症心身障害児は表示しない
  if (isJuushin && juushingata) return null;
  // 基準該当放は表示しない
  if (kijunGaitou) return null;
  // 共生型サービスは表示しない
  if (kyouseiService) return null;
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)
  
}

export const EnchouShien2024 = (props) => {
  const nameJp = '延長支援';
  const svcs = [HOUDAY, JIHATSU];
  const allState = useSelector(s=>s);
  const {service, stdDate, com, users} = allState;
  const juushingata = com?.addiction?.[service]?.重症心身型 === '1';
  const kijunGaitou = com?.addiction?.[service]?.基準該当放 === '1';
  const kyouseiService = com?.addiction?.[service]?.共生型サービス === '1';

  const user = comMod.getUser(props.uid, users);
  const isJuushin = (user?.type || '').includes('重症心身障害児');

  const discriptionText = ``;
  const opts = [
    { value: 3, label: "1.1時間未満" },
    { value: 1, label: "2.1〜2時間" },
    { value: 2, label: "3.2時間以上" },
  ];
  const setting = com?.addiction?.[service]?.時間区分延長支援自動設定;
  let nullLabel;
  if (parseInt(setting) >= 2){
    nullLabel = '自動';
    opts.push({value: -1, label: "未設定"})
  }

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-06-01',
    nullLabel
  };
  if (Number(setting) >= 3) newProps.propsVal = null;

  // 重心が他施設で重症心身障害児は表示しない
  if (isJuushin && juushingata) return null;
  // 基準該当放は表示しない
  if (kijunGaitou) return null;
  // 共生型サービスは表示しない
  if (kyouseiService) return null;

  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}

export const GyakutaiGensan = (props) => {
  const nameJp = '虐待防止措置未実施減算';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    次の基準を満たしていない場合に、所定単位数の１％を減算します。① 虐待防止委員会を定期的に開催するとともに、その結果について従業者に周知徹底を図ること② 従業者に対し、虐待の防止のための研修を定期的に実施すること③ 上記措置を適切に実施するための担当者を置くこと
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-06-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}

export const GyoumuGensan = (props) => {
  const nameJp = '業務継続計画未策定減算';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    以下の基準に適応していない場合、所定単位数を減算します。①感染症や非常災害の発生時において、利用者に対するサービスの提供を継続的に実施するための、及び非常時の体制で早期の業務再開を図るための計画（業務継続計画）を策定すること②当該業務継続計画に従い必要な措置を講ずること
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}

export const JouhouKouhyouGensan = (props) => {
  const nameJp = '情報公表未報告減算';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    障害者総合支援法第76条の3の規定に基づく情報公表に係る報告がされて いない場合、所定単位数を減算されます。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}


export const TyuukakuKyouka = (props) => {
  const nameJp = '中核機能強化加算';
  const svcs = [JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    市町村が地域の障害児支援の中核拠点として位置付ける児童発達支援センターにおいて、専門人材を配置して、自治体や地域の障害児支援事業所・保 育所等を含む関係機関等との連携体制を確保しながら、こどもと家族に対 する専門的な支援・包括的な支援の提供に取り組んだ場合に評価される加算です。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}

export const TyuukakuKyoukaJigyousyo = (props) => {
  const nameJp = '中核機能強化事業所加算';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    市町村が地域の障害児支援の中核拠点として位置付ける事業所において、専門人材を配置して、自治体や地域の障害児支援事業所・保育 所等を含む関係機関等との連携体制を確保しながら、こどもと家族に対す る専門的な支援・包括的な支援の提供に取り組んだ場合に算定される加算です。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}

export const SenmonTaisei = (props) => {
  const nameJp = '専門的支援体制加算';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    専門的支援加算及び特別支援加算について、専門人材の活用とニーズを 踏まえた計画的な専門的支援の実施を進める観点から、両加算を統合し、 専門的な支援を提供する体制と、専門人材による個別・集中的な支援の計 画的な実施について、評価される加算です。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}

export const KazokuShien1 = (props) => {
  const nameJp = '家族支援加算Ⅰ';
  const svcs = [HOUDAY, JIHATSU, HOHOU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    家族支援加算とは、児童発達支援・放課後等デイサービスを利用する児童の保護者に対して、職員が児童の保護者やきょうだいに対して、育成をサポートするための相談援助を個別で行うことを評価する加算です。
  `;
  const opts = getAddictionOption(nameJp, stdDate);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}
export const KazokuShien2 = (props) => {
  const nameJp = '家族支援加算Ⅱ';
  const svcs = [HOUDAY, JIHATSU, HOHOU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    家族支援加算とは、児童発達支援・放課後等デイサービスを利用する児童の保護者に対して、職員が児童の保護者やきょうだいに対して、育成をサポートするための相談援助をグループで行うことを評価する加算です。
  `;
  const opts = getAddictionOption(nameJp, stdDate);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}

export const Kosodate = (props) => {
  const nameJp = '子育てサポート加算';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    保護者に支援場面の観察や参加等の機会を提供した上で、こどもの特性や、特性を踏まえたこどもへの関わり方等に関して相談援助等を行った場合に算定できます。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}

export const SenmonJisshi = (props) => {
  const nameJp = '専門的支援実施加算';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    専門的な支援の強化を図るため、基準の人員に加えて理学療法士等を配置していること。理学療法士等により、個別・集中的な専門的支援を計画的に行った場合に算定できます。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}

export const ShikakuTyoukaku = (props) => {
  const nameJp = '視覚聴覚言語機能障害児支援加算';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    視覚又は聴覚若しくは言語機能に重度の障害のある児に対して、意思疎通に関して専門性を有する人材を配置して、支援を行った場合に算定ができる加算です。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)
}

export const NyuuyokuShien = (props) => {
  const nameJp = '入浴支援加算';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    こどもの発達や日常生活、家族を支える観点から、医療的ケア児や重症心身障害児に、発達支援とあわせて入浴支援を行った場合に算定できる加算です。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)
}

export const SougeiKasanSettei = (props) => {
  const nameJp = '送迎加算設定';
  const svcs = [HOUDAY, JIHATSU];
  const {uid} = props;
  const stdDate = useSelector(s=>s.stdDate);
  const ssvc = useSelector(state=>state.service); // ステート上のサービス
  const users = useSelector(s=>s.users);
  // サービスが未指定ならユーザーのサービスを取得する uidが未指定だったら最初のuserから拾う
  const user = uid? comMod.getUser(uid, users): users[0];
  const service = ssvc? ssvc: user.service.split(',')[0];

  const discriptionText = `
    該当する送迎加算に対する設定を行います。医療的ケア児・重症心身障害児などの場合は加算が追加になる場合があります。また同一敷地内の送迎がある場合はこちらで設定します。
  `;
  // const opts = [
  //   { value: 1, label: "選択" }
  // ];

  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    nullLabel: '通常',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}

export const SyuutyuuShien = (props) => {
  const nameJp = '集中的支援加算';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    状態が悪化した強度行動障害を有する児者に対し、高度な専門性により地域を支援する広域的支援人材が、事業所等を集中的に訪問等（情報通信機器を用いた地域外からの指導助言も含む）し、適切なアセスメントと有効な支援方法の整理をともに行い、環境調整を進めることを評価する加算です。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}

export const KobetsuSuport3 = (props) => {
  const nameJp = '個別サポート加算３';
  const svcs = [HOUDAY];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    不登校の状態にある障害児に対して、学校との連携の下、家族への相談援助等を含め、支援を行った場合に算定できる加算です。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}

export const JigyousyoRenkei = (props) => {
  const nameJp = '事業所間連携加算';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    障害児支援の適切なコーディネートを進める観点から、セルフプランで複数事業所を併用する児について、事業所間で連携し、こどもの状態や支援状況の共有等の情報連携を行った場合に算定できる加算です。中核となる事業所として会議を開催するなどした場合は１、会議に参加するなどした場合は２を算定できます。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}

export const JiritsuSupport = (props) => {
  const nameJp = '自立サポート加算';
  const svcs = [HOUDAY, ];
  const stdDate = useSelector(s=>s.stdDate);
  const users = useSelector(s=>s.users);
  const user = comMod.getUser(props.uid, users);
  const ageStr = user?.ageStr;
  const discriptionText = `
    高校２年生・３年生について、学校卒業後の生活に向けて、学校や地域の企業等と連携しながら、相談援助や体験等の支援を計画的に行った場合に算定できる加算です。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  const ageNum = parseInt((ageStr || '').replace('歳', ''));
  const isOver18 = !isNaN(ageNum) && ageNum >= 18;
  if (!['高2', '高3'].includes(ageStr) && !isOver18) return null;
  return (<KasanSelectorGP {...newProps}/>)
}

export const TuusyoJiritsu = (props) => {
  const nameJp = '通所自立支援加算';
  const svcs = [HOUDAY, ];
  const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    学校・居宅等と事業所間の移動について、自立して通所が可能となるよう、職員が付き添って計画的に支援を行った場合に算定できます。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}
// 11月以降は日付入
export const KyoudoKoudou90 = (props) => {
  const nameJp = '強度行動障害児支援加算９０日以内';
  const svcs = [HOUDAY];
  // const stdDate = useSelector(s=>s.stdDate);
  // const account = useSelector(s=>s.account);
  const {stdDate, account, com} = useSelector(s=>({
    stdDate: s.stdDate,
    account: s.account,
    com: s.com,
    service: s.service,
  }));


  const permission = comMod.parsePermission(account)[0][0];
  const discriptionText = `
    強度行動障害児支援加算を算定開始後から９０日以内は追加で算定出来ることがあります。
  `;
  const opts = getAddictionOption(nameJp);
  const def = useGetDef(nameJp, props.uid, props.dLayer);
  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  if (stdDate >= "2024-11-01"){
    if (Number(def) === -1) return null;
    // 日付の制限をstdDateとstdDate120日後から得る
    const startDate = new Date(stdDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 130);
    const limit = comMod.formatDate(startDate) + ',' + comMod.formatDate(endDate)
    const wrapperStyle = {padding: 4, marginBottom: 8}
    const dateInputProps = {
      name: nameJp, label: comMod.shortWord(nameJp) + '終了日', limit, def,
      wrapperStyle, emptyVal: '',
    }
    return (
      <DateInput {...dateInputProps}/>
    )
  }
  else{
    return (<KasanSelectorGP {...newProps}/>)
  }

}

export const TasyokusyuRenkei = (props) => {
  const nameJp = '多職種連携支援加算';
  const svcs = [HOHOU];
  const stdDate = useSelector(s=>s.stdDate);
  const users = useSelector(s=>s.users);
  const user = comMod.getUser(props.uid, users);
  const uSvc = (user?.service || '').split(',');
  if (uSvc.includes(HOHOU)) svcs.push(...uSvc);
  const discriptionText = `
  障害特性やこどもの状態に応じた適切な支援を行う観点から、職種の異なる複数人のチームでの多職種連携による支援についての評価を行う加算です。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)

}

export const CareNeeds = (props) => {
  const nameJp = 'ケアニーズ対応加算';
  const svcs = [HOHOU, HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const {uid} = props;
  const users = useSelector(s=>s.users);
  const user = comMod.getUser(uid, users);
  const svcStr = user?.service;

  const discriptionText = `
  訪問支援員特別加算の対象となる職員を配置し、重症心身障害児等の著しく重度の障害児や医療的ケア児に対して支援を行った場合に算定できる加算です
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  // 利用者のサービスに保訪が含まれていなかったら
  if (!svcStr.includes(HOHOU)) return null;
  return (<KasanSelectorGP {...newProps}/>)
}


export const HoumonShienTokubetsu = (props) => {
  const nameJp = '訪問支援員特別加算24';
  const svcs = [HOHOU];
  const stdDate = useSelector(s=>s.stdDate);
  const sSvc = useSelector(s=>s.service);
  const users = useSelector(s=>s.users);
  const user = comMod.getUser(props.uid, users);
  if (isService(user, HOHOU)){
    svcs.push(sSvc)
  }

  const discriptionText = `
    作業療法士や理学療法士、言語聴覚士、保育士、看護職員等の専門性の高い職員を配置した場合の加算です。
    24年度以降はこちらを使用して下さい。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
    label: '訪問支援員特別加算',
    // disabled: true,
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)
}

// 時間区分と延長支援を自動で設定するかどうかを決めますschedit
export const JikanKubunEnchoAuto = (props) => {
  const nameJp = '時間区分延長支援自動設定';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  // const account = useSelector(s=>s.account);
  // const permission = comMod.parsePermission(account)[0][0];
  const discriptionText = `
    開始時間と終了時間により時間区分と延長支援を自動で設定するかどうかを決めます
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)
}

// 時間区分と延長支援を自動で設定するかどうかを決めますschedit
export const KobetsuSuport1Settei = (props) => {
  const nameJp = '個別サポートⅠ１設定';
  const svcs = [HOUDAY];
  const stdDate = useSelector(s=>s.stdDate);
  // const account = useSelector(s=>s.account);
  // const permission = comMod.parsePermission(account)[0][0];
  const discriptionText = `
    該当日付の個別サポート加算1を変更します。Ⅰ１標準またはⅠ１（一定要件）に設定されているものをこの日だけ統一します。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)
}

// 時間区分と延長支援を自動で設定するかどうかを決めますschedit
export const HohouTokuchi = (props) => {
  const nameJp = '特別地域加算';
  const svcs = [HOHOU];
  const stdDate = useSelector(s=>s.stdDate);
  // const account = useSelector(s=>s.account);
  // const permission = comMod.parsePermission(account)[0][0];
  const discriptionText = `
    厚生労働大臣が定める特定農山村法や山村振興法、離島振興法などの地域に居住する利用者に対して、
    基本報酬に15%を加算する報酬算定制度です。
  `;
  const opts = getAddictionOption(nameJp);

  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-04-01',
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-04-01') return null;
  return (<KasanSelectorGP {...newProps}/>)
}

// 医療的児基本報酬を設定する
// 利用者が重心である場合は表示しない
export const IryouCareKihon = (props) => {
  const nameJp = '医療的ケア児基本報酬';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const users = useSelector(s=>s.users);
  const user = comMod.getUser(props.uid, users);
  const service = useSelector(s=>s.service);
  const schedule = useSelector(s=>s.schedule);
  const uidStr = comMod.convUID(props.uid).str;
  const uAddiction = schedule?.[service]?.[uidStr]?.addiction?.医療ケア児基本報酬区分;
  const isJuushin = (user?.type || '').includes('重症心身障害児');
  const icareType = user?.icareType;
  const discriptionText = `医療的ケア児基本報酬を設定します。`;
  const opts = getAddictionOption(nameJp);
  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-11-01',
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-11-01') return null;
  // if (isJuushin) return null;
  if (!icareType) return null;
  if (uAddiction) return null;
  return (<KasanSelectorGP {...newProps}/>)
}

export const IryouCareEnchou = (props) => {
  const nameJp = '医療的ケア児延長支援';
  const svcs = [HOUDAY, JIHATSU];
  const stdDate = useSelector(s=>s.stdDate);
  const users = useSelector(s=>s.users);
  const user = comMod.getUser(props.uid, users);
  const service = useSelector(s=>s.service);
  const schedule = useSelector(s=>s.schedule);
  const uidStr = comMod.convUID(props.uid).str;
  const uAddiction = schedule?.[service]?.[uidStr]?.addiction?.医療ケア児基本報酬区分;
  const isJuushin = (user?.type || '').includes('重症心身障害児');
  const icareType = user?.icareType;
  const opts = getAddictionOption(nameJp);
  const discriptionText = `医療的ケア児の延長支援加算を設定します。`;
  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2024-11-01',
  };
  // 2024以降のコンポーネント
  if (stdDate < '2024-11-01') return null;
  // if (isJuushin) return null;
  if (!icareType) return null;
  if (uAddiction) return null;
  return (<KasanSelectorGP {...newProps}/>)
}

export const KyoudokoudouDisable = (props) => {
  const nameJp = '強度行動障害児支援加算無効化';
  const svcs = [HOUDAY, JIHATSU];
  // const stdDate = useSelector(s=>s.stdDate);
  const discriptionText = `
    強度行動障害児支援加算を無効化します。人員配置が基準に満たない場合は無効化を選択して下さい。
  `;
  const opts = getAddictionOption(nameJp);
  const newProps = {
    ...props, nameJp, svcs, discriptionText, opts, monthAdded: '2025-11-01',
    nullLabel: '自動',
  };
  return (<KasanSelectorGP {...newProps}/>)
}