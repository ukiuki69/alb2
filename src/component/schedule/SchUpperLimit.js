import React, { useEffect, useRef, useState } from 'react';
import * as comMod from '../../commonModule'
import * as albcm from '../../albCommonModule'
import { useDispatch, useSelector } from 'react-redux';
import * as mui from '../common/materialUi';
import * as Actions from '../../Actions';
import * as sfp from '../common/StdFormParts';
import * as afp from '../common/AddictionFormParts';
import { makeStyles } from '@material-ui/core/styles';
import { getPriorityService, setBillInfoToSch, } from '../Billing/blMakeData';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import DeleteIcon from '@material-ui/icons/Delete';
import { Button, FilledInput, IconButton } from '@material-ui/core';
import { blue, teal, red } from '@material-ui/core/colors';
import { EditUserButton } from '../common/commonParts';
import { getLS, getLSTS, setLS, setLSTS } from '../../modules/localStrageOprations';
import CheckIcon from '@material-ui/icons/Check';


// 上限管理の情報を入力する
// 自社が上限管理事業所の場合の他事業所の情報と利用学、負担額を入力する
// 自社が協力事業所の場合もこのコンポーネントを使うことにした
// 指定タイプ specifyType=1の場合、協力事業所として管理事業所を登録、
// 上限額を入力する
// 負担方法 自社優先 自社ができるだけ多く請求する
//          最多額優先 一番多く利用があったところができるだけ多く請求する
//          等分 利用額にあわせて按分する
const useStyles = makeStyles({
  editUserButtonWrap:{paddingTop: 16, paddingLeft: 8},
  brosInKyoudai: {
    display: 'flex',
    '& .name' :{ paddingTop:30, marginLeft:4, marginRight: 8,}
  },
  jiButtonsRoot: {
    marginTop: 12,
    '& .deleteIcon .MuiSvgIcon-root': {
      marginInlineStart: 40,
    },
    '& .trush .MuiSvgIcon-root': {color:red[300]},
    '& button': {padding: 4, marginTop: 4}
  },
  deleteConfirm:{
    width: '100%', paddingLeft: 8,
    '& >span': {fontSize: '.9rem',background: red[50]},
    '& .yes .MuiButton-label': {color: red[800]},
    '& .no .MuiButton-label': {color: teal[800]},
  }, 
  onKyouryokuDelteButton: {
    color: '#fff', backgroundColor: red[800],
    '&:hover' : {backgroundColor: red[600],},

  }
})
const getFormDefFnc = (i, schedule, UID, objKey, users) => {
  // const ts = comMod.findDeepPath(schedule, [UID, objKey]);
  const user = comMod.getUser(UID, users);
  const ts = schedule?.[UID]?.[objKey];
  const schDtFound = ts !== undefined;
  let rts = ts ? ts[i] : null;
  rts = rts? [rts.name, rts.no, rts.amount, rts.kettei]: ['', '', '', ''];

  // const tu = comMod.findDeepPath(users, ['etc', objKey]);
  const tu = user?.etc?.[objKey];
  let rtu = tu ? tu[i] : null;
  rtu = rtu? [rtu.name, rtu.no, '', '']: ['', '', '', ''];

  return schDtFound ? rts : rtu;
};

const KyouryokuFrormParts = ({
  kanrikekka,
  setKanrikekka,
  kanriKekkaDef,
  kanrigoFutan,
  setKangigoFutan,
  schedule,
  UID,
  objKey,
  users,
  officeNames,
  setOfficeNames,
}) => {
  const formDef = getFormDefFnc(0, schedule, UID, objKey, users);
  const def = formDef[3] ? formDef[3]: kanrigoFutan;
  useEffect(()=>{
    console.log('KyouryokuFrormParts', kanrikekka)
  }, [kanrikekka])
  return (
    <>
      <div className="cntRow">
        <sfp.OtherOffice
          label="事業所名"
          name="office1"
          labelNo="番号"
          nameNo="no1"
          def={formDef}
          officeNames={officeNames}
          setOfficeNames={setOfficeNames}
          ndx={0}
        />
      </div>
      <div className="cntRow">
        <sfp.KanriKekka
          def={kanriKekkaDef}
          propsVal={kanrikekka}
          setPropsVal={setKanrikekka}
        />
        <sfp.NumInputGP
          name="kettei"
          label="管理結果後負担額"
          propsVal={kanrigoFutan}
          setPropsVal={setKangigoFutan}
          def={def} upper={1000000}
          cls="tfMiddleL"
        />
      </div>
    </>
  );
};



export const UpperLimitKanri = (props)=>{
  const classes = useStyles();
  const { uid, specifyType, snack, setSnack, billingDt} = props;
  const dispatch = useDispatch();
  const UID = comMod.convUID(uid).str;
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const users = useSelector(state=>state.users);
  const thisUser = comMod.getUser(uid, users);
  const schedule = useSelector(state => state.schedule);
  const service = useSelector(state=>state.service);
  const com = useSelector(state=>state.com);
  const serviceItems = useSelector(state=>state.serviceItems);
  const stdDate = useSelector(state=>state.stdDate);
  const bdt = billingDt.find(e=>e.UID === UID);
  const [sendPrms, setSendPrms] = useState({}); // スケジュール分割送信用
  const lsName = 'kyouryokuKanrikekka'; // ローカルストレージで使用する名前。協力事業所入力用
  const lsNameFutan = 'kyouryokuKanrikekkaFutan'; // ローカルストレージで使用する名前。協力事業所入力用

  // const haibunDef = comMod.findDeepPath(thisUser, 'etc.上限管理配分種別');
  // const kanriDef = comMod.findDeepPath(thisUser, 'etc.上限管理結果');
  // 管理事業所利用者は上限管理結果をschedule[service][uid]以下に記述する
  // 協力時魚利用者は管理事業所配列内に記述されている
  const kanriKekkaDef = (ev, buid) =>{
    const brosIndex = parseInt(thisUser.brosIndex);
    let svc = thisUser.service;
    if (thisUser.kanri_type == '管理事業所' || brosIndex === 1){
      // buid:兄弟のuidが指定されていたらそれで検索する
      let tuid = buid? buid: UID;
      tuid = albcm.convUid(tuid).s;
      if (buid){
        svc = comMod.getUser(buid, users).service;
      }
      const v = comMod.findDeepPath(
        schedule, [svc, tuid, 'addiction', '上限管理結果']
      );
      return v;
    }
    const v = comMod.findDeepPath(schedule, [UID, '管理事業所']);
    console.log('v', v);
    // ここはオブエジェクトで帰ってくるので変な処理
    const w = (v && Object.keys(v).length)? v['0'].kanriKekka : '';
    return (w) ? w : '';
  }
  const getFormDef = i => getFormDefFnc(i, schedule, UID, objKey, users);
  const kanriKekkaDefVal = kanriKekkaDef();
  // kyouryokuformpartsでのみ使用される
  // ローカルストレージで値保持
  const exSec = 2;
  const [kanrikekka, setKanrikekka] = useState(
    getLSTS(lsName, exSec) !== undefined ? getLSTS(lsName, exSec): kanriKekkaDefVal
  );
  const [kanrigoFutan, setKangigoFutan] = useState(
    getLSTS(lsNameFutan, exSec) !== undefined ? getLSTS(lsNameFutan, exSec): getFormDef(0)[3]
  );
  // const kanrikekkaRef = useRef('');
  // // 値をセットする関数
  // const updateKanrikekka = (newValue) => {
  //   kanrikekkaRef.current = newValue;
  //   setKanrikekka(newValue); // 画面更新が必要な場合のみ使用
  // };
  // kyouryokuformpartsでのみ使用される 管理結果後利用者負担額
  // 協力事業所削除用
  // [{ndx: 0, deleted: ture}] deletedがtrueで削除済み falseは削除確認中
  const [deleteJi, setDeleteJi] = useState([]);
  // specifyType=1の場合、協力事業所として操作を行うが
  // その場合の操作対象は管理事業所となる
  const objKey = (specifyType === '1') ? '管理事業所':'協力事業所';
  // 兄弟がいるかどうか 上限管理のキャンセルで使う
  const firstBros = comMod.getFirstBros(uid, users);

  // 協力事業所の時の値管理
  useEffect(()=>{
    setLSTS(lsName, kanrikekka);
    console.log(bdt, 'bdt');
    if (Number(kanrikekka) === 1){
      setKangigoFutan(0);
      setLSTS(lsNameFutan, 0);
    }
    // これを記述するとgetFormdefの値が空白になる なぜ？
    else if (Number(kanrikekka) === 2){
      setKangigoFutan(bdt.ketteigaku);
      setLSTS(lsNameFutan, bdt.ketteigaku);
    }
  }, [kanrikekka]);
  useEffect(()=>{
    if (kanrigoFutan !== ''){
      setLSTS(lsNameFutan, kanrigoFutan);
    }

  }, [kanrigoFutan])
  // sendPartOfSchのみ非同期処理なのでクリーンアップで処理を行う
  useEffect(()=>{
    const sendItems = async (v, jougenDelete = false) => {
      if (jougenDelete){
        delete v.usersSchedule?.[UID]?.管理事業所;
        delete v.usersSchedule?.[UID]?.協力事業所;
      }
      let prms = {
        hid, bid, date: stdDate, 
        partOfSch: {...v.serviceAddic, ...v.usersSchedule}
      }
      const res = {sch: {}, users: {}};
      res.sch = await albcm.sendPartOfSchedule(prms, 'setRes', 'setSnack');
      if (v.newUser ){
        prms = {...v.newUser}
        res.users = await albcm.sendUser(prms, 'setRes', 'setSnack');
        console.log('sendItems', res);
      }
      return res;
    }
    const dispatchItems = (v, res, ) => {
      // console.log('dispatch something.');
      let t = [...users];
      const i = t.findIndex(e=>parseInt(e.uid) === comMod.convUID(uid).num);
      if (v.newUser ){
        t[i] = {...v.newUser};
      }
      const u = {...schedule, ...v.serviceAddic, ...v.usersSchedule};
      const p = {stdDate, schedule:u, users: t, com, service, serviceItems};
      p.calledBy = 'UpperLimitKanri';
      // calledBy対応済み
      const {
        billingDt, masterRec, result, errDetail
      } = setBillInfoToSch(p);
      u.timestamp = new Date().getTime();
      dispatch(Actions.setStore({schedule: u, users: t, masterRec, billingDt}));
      // usersを送信していないパターンが有る
      const userRes = (res.users.data)? res.users.data.result: true;
      const r = res.sch.data.result && userRes;
      const severity = (r) ? '': 'error';
      const msg = (r) ? '情報を登録しました。' : '情報の登録に失敗しました。';
      const errorId  = (r) ? 'E544735': '';
      dispatch(Actions.setSnackMsg(msg, severity, errorId));
    }
    const makeData = () => {
      const {outPuts, fvals} = sendPrms;
      // サービスの取得
      let usersService = (thisUser.service)? thisUser.service: service;
      usersService = getPriorityService(usersService); // 複数サービス対応
      // サービスごとの加算オブジェクト
      schedule[usersService] = schedule[usersService]
      ? schedule[usersService]: {};

      schedule[usersService][UID] = schedule[usersService][UID]
      ? schedule[usersService][UID]: {};
      
      const serviceAddic = {
        [usersService]:{
          ...schedule[usersService],
          [UID]:{
            ...schedule[usersService][UID],
            addiction:{
              ...schedule[usersService][UID].addiction,
              利用者負担上限額管理加算: fvals.利用者負担上限額管理加算,
              上限管理結果: fvals.kanriKekka, // 2022/05/25 上限管理結果手動設定のため
            }
          }
        }
      };
      // 上記のロジックでほかサービスの加算が初期化される？
      const otherService = serviceItems.filter(e => e !== usersService);
      otherService.forEach(e=>{
        if (schedule[e]){
          serviceAddic[e] = {...schedule[e]}
        }
      });
      if (parseInt(specifyType) < 2){
        const usersSchedule = {
          [UID]:{...schedule[UID],[objKey]:[...outPuts],}
        };
        const newUser = {
          ...thisUser,
          etc:{...thisUser.etc, [objKey]: outPuts}
        }
        return {serviceAddic, usersSchedule, newUser};
      }
      else{
        return {serviceAddic, usersSchedule: null, newUser: null};
      }
    };
    // 兄弟ダイアログには他のユーザー情報も書かれているのでそれを
    // schedule[servicce][uid].addictionに配置する
    const makeBrosData = (rt, ) => {
      const {fvals} = sendPrms;
      const {serviceAddic} = rt;
      // 兄弟管理のときは兄弟の管理結果のselectのname属性がkanriKekka-[UID]で示される
      // それを拾ってスケジュールの加算オブジェクトに追加する
      Object.keys(fvals).filter(e=>(e.indexOf('kanriKekka-') === 0)).map(e=>{
        const bUid = 'UID' + e.split('-')[1];
        const bUser = comMod.getUser(bUid, users);
        const bService = bUser.service;
        const sch = {...schedule}
        sch[bService] = sch[bService]? sch[bService]: {};
        sch[bService][bUid] = sch[bService][bUid]? sch[bService][bUid]: {};
        sch[bService][bUid].addiction = 
        sch[bService][bUid].addiction? sch[bService][bUid].addiction: {};
        const t = {...sch[bService][bUid].addiction};
        t.上限管理結果 = fvals[e];
        if (!serviceAddic[bService]) serviceAddic[bService] = {};
        if (!serviceAddic[bService][bUid]) 
          serviceAddic[bService][bUid] = {};
        serviceAddic[bService][bUid].addiction = {
          ...serviceAddic[bService][bUid].addiction , ...t
        };
      });
      rt.serviceAddic = serviceAddic;
    }
    return (()=>{
      setTimeout(()=>{
        // node消失確認
        const closed = !document.querySelector('#nodeExist0743e34');
        const prmsExist = (Object.keys(sendPrms).length > 0);
        if (closed && prmsExist){
          const rt = makeData();
          makeBrosData(rt);
          console.log('UpperLimitKanri cleanup.', rt);
          sendItems(rt, sendPrms.jougenDelete)
          .then(res=>{
            dispatchItems(rt, res, sendPrms.jougenDelete);
          })
        }
      }, 100);
    })
  }, [sendPrms]);
  // submitHandlerより変更
  // データの更新とダイアログのクロースを行う
  // storeへのdispatchと送信はuseeffect cleanupへ移行
  // noJougen = trueで上限管理を行わないで保存する
  const updateClickHandler = (noJougen = false, deleteJougen = false) => {
    // エラーエレメントを取得
    const errFld = document.querySelectorAll('#ttydo55 .Mui-error');
    if (errFld.length){
      setSnack({
        msg: '送信できませんでした。',
        severity: 'warning',
      })
      return false;
    }
    // 値が必要なエレメント
    const inputs = document.querySelectorAll('#ttydo55 input');
    const selects = document.querySelectorAll('#ttydo55 select');

    // フォームの値を取得
    const fvals = comMod.getFormDatas([inputs, selects], true);
    // 兄弟の管理結果を取得のために未設定のデータも取得
    const tmpBrosKanri = comMod.getFormDatas([selects], true, true);
    Object.keys(tmpBrosKanri).forEach(e=>{
      if (e.indexOf('kanriKekka-') === 0){
        fvals[e] = tmpBrosKanri[e];
      }
    });
    // それぞれバラバラのnameタグをグループ化するための配列
    const namesTags = [
      [
        'office1', 'no1', 'amount1', 'kettei', 
        '上限管理配分種別', 'kanriKekka',
      ], 
      ['office2', 'no2', 'amount2'], 
      ['office3', 'no3', 'amount3'], 
      ['office4', 'no4', 'amount4'], 
      ['office5', 'no5', 'amount5'], 
      ['office6', 'no6', 'amount6'], 
      ['office7', 'no7', 'amount7'], 
      ['office8', 'no8', 'amount8'], 
      ['office9', 'no9', 'amount9'], 
    ];
    // dispatch用の配列
    const outPuts = namesTags.map(e=>{
      if (fvals[e[0]]){ // 事業所名に記述がある場合
        return{
          name: fvals[e[0]],
          no: fvals[e[1]],
          amount: fvals[e[2]], // amountというキーをstoreに書き込めない！
          kettei: fvals[e[3]], // 協力事業所のときのみ有効
          haibun: fvals[e[4]], // 協力事業所のときのみ有効
          kanriKekka: fvals[e[5]], // 協力事業所のときのみ有効
        }
      }
    }).filter(e=>e !== undefined);
    // 上限管理結果を無効にするための設定をセットする 利用総額は強制的にゼロにする
    if (noJougen){
      outPuts.forEach(e=>{e.amount = 0})
      fvals.kanriKekka = "設定しない";
      fvals.利用者負担上限額管理加算 = "off";
    }
    // 同一の事業所番号が配列に含まれていないかチェック
    const tmp = outPuts.map(e=>e.no);
    const dup = tmp.filter((e, i, a)=>a.indexOf(e) !== a.lastIndexOf(e));
    if (dup.length){
      setSnack({
        msg: '事業所番号が重複しているため登録できません。',
        severity: 'warning',
      })
      return false;
    };
    // 事業所名記載済み事業所番号未記載の場合はエラー扱い
    const jinoSet = new Set(outPuts.filter(e=>e.no).map(e=>e.no));
    const jiNameSet = new Set(outPuts.filter(e=>e.name).map(e=>e.name));
    if (jinoSet.size !== jiNameSet.size){
      setSnack({
        msg: '事業所名または事業所番号未記載があるため保存できません。',
        severity: 'warning',
      })
      return false;
    }
    // 協力事業所で上限管理結果が入力されているのに決定額が未入力
    const isKekkaNotInputOnKyouryoku = (
      outPuts[0] &&
      outPuts[0].kanriKekka !== undefined &&
      outPuts[0].kettei === undefined &&
      parseInt(specifyType) === 1
    )
    if ( isKekkaNotInputOnKyouryoku ){
      setSnack({
        msg: '管理結果額が未入力です。',
        severity: 'warning',
      })
      return false;
    }
    // 独自助成金の処理. 管理事業所配列の0番目に配置される 2023年9月26日
    if ('dokujiHojo' in fvals) outPuts[0].dokujiHojo = fvals.dokujiHojo;
    if (deleteJougen){
      console.log('deleteJougen', outPuts, fvals, 'outPuts, fvals');
    }
    setSendPrms({outPuts, fvals, jougenDelete: deleteJougen});
    albcm.setRecentUser(uid);
    props.close()
  }
  const canselHandler = ()=>{
    console.log('cancel clicked.')
    props.close();
  }
  // OtherOfficeは子コンポーネント側でstate管理されているがこちらの
  // コンポーネントでも使う必要が出てきたので改めてstateとして定義
  const formDefV = getFormDef(0);
  const [officeNames, setOfficeNames] = useState([
    getFormDef(0)[0],getFormDef(1)[0],getFormDef(2)[0],getFormDef(3)[0],
  ]);

  const jiButtonClick = (ev, func, ndx) => {
    // func: -1=up, 1=down 0=delete
    // 値が入力されているノードを取得
    const names = document.querySelectorAll('#ttydo55 .name input');
    const nos = document.querySelectorAll('#ttydo55 .no input');
    const vols = document.querySelectorAll('#ttydo55 .volume input');
    // ノードの数を取得
    const nodesLen = names.length;
    const namenode = names[ndx];
    const volnode = vols[ndx];
    const nonode = nos[ndx];
    const nameTarget = names[ndx + func]
    const volTarget = vols[ndx + func]
    const noTarget = nos[ndx + func]
    // 最上段でup
    if (func === -1 && ndx === 0){
      return false;
    }
    // 最下段でdawn
    if (func === 1 && ndx === nodesLen){
      return false;
    }
    if (func === 0){
      const t = [...deleteJi];
      const p = t.findIndex(e=>e.ndx === ndx);
      if (p >= 0){
        // t.deleted = true;
        t.splice(p, 1)
      }
      else{
        t.push({ndx, deleted: false})
      }
      setDeleteJi(t);
      return false;
    }
    // 未入力の場合は処理しない
    if (!namenode.value){
      return false;
    }
    // ターゲットが未入力の場合
    if (!nameTarget.value){
      return false;
    }
    // 値を複写
    const current = {
      jiname: namenode.value, 
      jino: nonode.value, 
      vol: volnode.value,
    }
    const target = {
      jiname: nameTarget.value, 
      jino: noTarget.value, 
      vol: volTarget.value,
    }
    // 値をスワップ
    namenode.value = target.jiname;
    nonode.value = target.jino;
    volnode.value = target.vol;
    nameTarget.value = current.jiname;
    volTarget.value = current.vol;
    noTarget.value = current.jino;
  }
  const JiButtons = (props) => {
    const classes = useStyles();
    const {ndx} = props;
    return(
      <div className={classes.jiButtonsRoot}>
        <IconButton 
          onClick={(ev)=>jiButtonClick(ev, -1, ndx)}
          tabIndex={-1} color='primary'
        >
          <ArrowUpwardIcon/>
        </IconButton>
        <IconButton 
          onClick={(ev)=>jiButtonClick(ev, 1, ndx)}
          tabIndex={-1} color='primary'
        >
          <ArrowDownwardIcon/>
        </IconButton>
        <span style={{width: 20, display:'inline-block'}}></span>
        <IconButton 
          className='trush'
          onClick={(ev)=>jiButtonClick(ev, 0, ndx)}
          tabIndex={-1}
        >
          <DeleteIcon/>
        </IconButton>
      </div>
    )
  }
  // 事業所削除のときはdeleteJiに値が入る deleted = falseで削除確認中

  const DeleteConfirm = (props) => {
    const {ndx} = props;
    const t = [...deleteJi];
    const existDeleteJi = t.find(f=>f.ndx === ndx);
    if (!existDeleteJi) return null;
    const handleCleck = (ev, v) => {
      const p = t.findIndex(e=>e.ndx === ndx);
      // はいをクリック
      if (v){
        t[p].deleted = true;
        setDeleteJi(t);
      }
      // いいえ
      else{
        t.splice(p, 1);
        setDeleteJi(t);
      }
    }
    return (
      <div className={classes.deleteConfirm}>
        <span>この事業所を削除しますか？</span>
        <Button 
          onClick={(ev)=>handleCleck(ev, 1)} className='yes'
        >
          はい
        </Button>
        <Button 
          onClick={(ev)=>handleCleck(ev, 0)} className='no'
        >
          いいえ
        </Button>
      </div>
    )
  }
  const KanriFrormParts = () => {
    let p = 0;
    const jigyousyoRow = Array(6).fill(0).map((e, i) => {
      // 該当ノードが削除済みであるかどうか
      const existDeleteJi = deleteJi.find(f=>f.ndx === i);
      if (existDeleteJi && existDeleteJi.deleted)  return null;
      return (
        <div className="cntRow" key={i} >
          <sfp.OtherOffice
            label={'事業所名' + (i + 1)} name={'office' + (i + 1)}
            labelNo={'番号' + (i + 1)} nameNo={'no' + (i + 1)}
            def={getFormDef(i)}
            officeNames={officeNames} setOfficeNames={setOfficeNames} ndx = {i}
          />
          <sfp.NumInputGP 
            name={'amount' + (i + 1)} label={'総費用額' + (i + 1)} 
            def={getFormDef(i)[2]} upper={1000000}
            required={officeNames[i] !== ''}
          />
          <JiButtons ndx={i}/>
          <DeleteConfirm ndx={i} />
        </div>
      )    
    });
    return (<>
      {jigyousyoRow}
      <div className="cntRow">
        {/* <sfp.HaibunSyubetu def={haibunDef }/> */}
        <div style={{paddingTop: 4, paddingLeft: 0,}}>
          <afp.JougenKanri uid={UID} size='middle' dLayer={1} />
        </div>
        <sfp.KanriKekka kanri def={ev=>kanriKekkaDef(ev)} />
        <div className={classes.editUserButtonWrap}>
          <EditUserButton 
            uid={UID} variant='text' 
            label={thisUser.name?.slice(0, 8) + 'さんの情報'} 
          />
        </div>
      </div>
    </>)
  }
  const KyoudaiFormParts = () => {
    const bros = comMod.getBrothers(uid, users);
    bros.sort((a, b)=>(a.brosIndex < b.brosIndex)? -1: 1);
    const brosKanrikekka = bros.map((e, i)=>{
      return (
        <div className={classes.brosInKyoudai} key={i}>
          <div className='name'>{e.name}</div>
          <sfp.KanriKekka kyoudai 
            name={'kanriKekka-' + e.uid} 
            def={ev=>kanriKekkaDef(ev, e.uid)} 
          />
          <div className={classes.editUserButtonWrap}>
            <EditUserButton 
              uid={e.uid} variant='text' 
              label={e.name?.split(' ')[1]?.slice(0, 8) + 'さんの情報'} 
            />
          </div>
          
        </div>
      );
    });
    return (<>
      <div className="cntRow">
        <div style={{paddingTop: 4, paddingLeft: 0,}}>
          <afp.JougenKanri uid={UID} size='middle' dLayer={1} />
        </div>
        <sfp.KanriKekka kyoudai def={ev=>kanriKekkaDef(ev)} />
        <div className={classes.editUserButtonWrap}>
          <EditUserButton 
            uid={UID} variant='text' 
            label={thisUser.name?.split(' ')[1]?.slice(0, 8) + 'さんの情報'} 
          />
        </div>
      </div>
      <div className='cntRow'>
        {brosKanrikekka}
      </div>
    </>)

  }


  const formStyle = {maxWidth: 700};
  // 現状管理事業所が存在するか確認
  const kanriiJigyouso = schedule[UID]?.管理事業所 || [];
  const kyouryokuJigyousyo = schedule[UID]?.協力事業所 || [];
  const existKanrijigyousyo = kanriiJigyouso.length > 0;
  const existKyouryokuJigyousyo = kyouryokuJigyousyo.length > 0;
  const dispDeleteButton = (
    (parseInt(specifyType) === 1 && existKanrijigyousyo) || 
    (parseInt(specifyType) === 0 && existKyouryokuJigyousyo)
  );

  // 削除確認用の状態変数
  const [confirmDelete, setConfirmDelete] = useState(false);

  // OKボタンの DOM を参照するための ref を定義
  const okButtonRef = useRef(null);

  // Shift+Enter キー検知用のハンドラ
  const handleKeyDown = (e) => {
    if (e.shiftKey && e.key === "Enter") {
      e.preventDefault();
      // 現在フォーカス中の入力要素を blur させるため、
      // OKボタンにフォーカスを移し、その後クリックイベントを発火させる
      if (okButtonRef.current) {
        okButtonRef.current.focus();
        setTimeout(() => {
          okButtonRef.current.click();
        }, 0);
      }
    }
  }

  return(<>
    <form id="ttydo55" className="dialogForm" style={formStyle} onKeyDown={handleKeyDown}>
      {parseInt(specifyType) === 0 && <KanriFrormParts />}
      {parseInt(specifyType) === 1 &&
        <KyouryokuFrormParts
          kanrikekka={kanrikekka}
          setKanrikekka={setKanrikekka}
          kanriKekkaDef={kanriKekkaDefVal}
          kanrigoFutan={kanrigoFutan}
          setKangigoFutan={setKangigoFutan}
          schedule={schedule}
          UID={uid}
          objKey={objKey}
          users={users}
          officeNames={officeNames}
          setOfficeNames={setOfficeNames}
        />
      }
      {parseInt(specifyType) === 2 && <KyoudaiFormParts />}
    </form>
    <div className="buttonWrapper">
      {dispDeleteButton &&
        <Button
          className={confirmDelete ? classes.onKyouryokuDelteButton : ''}
          variant="contained"
          color={'default'}
          onClick={(e) => {
            if (confirmDelete) {
              updateClickHandler(false, true);
            } else {
              setConfirmDelete(true);
            }
          }}
        >
          {confirmDelete ? '削除実行' : '削除'}
        </Button>
      }
      {/* 上限管理行わないボタン */}
      {parseInt(specifyType) === 0 && !firstBros &&
        <Button
          variant='contained'
          onClick={()=>updateClickHandler(true, false)}
        >
          上限管理を行わない
        </Button>
      }

      <mui.ButtonCancel onClick={() => canselHandler()} />
      <Button
        ref={okButtonRef}
        variant="contained"
        color="primary"
        onClick={() => updateClickHandler(false, false)}
      >
        <CheckIcon />
        送信
      </Button>
    </div>
    <div id = 'nodeExist0743e34'></div>
  </>)
}