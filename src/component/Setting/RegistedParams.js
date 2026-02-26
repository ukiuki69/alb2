import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector } from 'react-redux';
import * as mui from '../common/materialUi';
import * as afp from '../common/AddictionFormParts'; 
import * as sfp from '../common/StdFormParts'; 
import * as Actions from '../../Actions';
import * as comMod from '../../commonModule';
import { LoadingSpinner, LoadErr} from '../common/commonParts';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { red, teal } from '@material-ui/core/colors';
import { KANRI_JIGYOUSYO, KYOURYOKU_JIGYOUSYO } from '../../modules/contants';
import { handleSelectInputAuto } from '../../albCommonModule';
import { fetchAll } from '../../modules/thunks';
import ReplayIcon from '@material-ui/icons/Replay';
import { otherOfficeisFromUsers, otherOfficeNotMatch } from '../Billing/ServiceCountNotice';
import { CheckBox, TrendingUp } from '@material-ui/icons';
import { faBullseye } from '@fortawesome/free-solid-svg-icons';
import { faLess } from '@fortawesome/free-brands-svg-icons';
import SnackMsg from '../common/SnackMsg';
import EditCities from './EditCities';
import SchLokedDisplay from '../common/SchLockedDisplay';

const useStyles = makeStyles({
  officesEditForm:{
    width:'100%',
    maxWidth: 650,
    '& .oneOffice': {
      display:'flex', padding: 8, flexWrap: 'wrap', margin: '16px 0 24px',
      '& > div': {margin : '0 8px'},
      '& .officeHead':{paddingTop: 8, fontSize: '.8rem', lineHeight: 1.6},
      '& .name ':{width: '18ch'},
      '& .newNo ':{width: '11ch'},
      '& .lname ':{width: '100%', marginTop: 12, marginLeft: 8},
    },
  },
  cityForm: {
    width:'100%',
    maxWidth: 650,
    marginBottom: 16,
    '& .oneCity':{
      '& .row':{
        display:'flex', padding: 8, margin: '8px 0',justifyContent:'center',
      },
      '& .name ':{width: '16ch'},
      '& .no' : {paddingTop: 10, marginRight: 16},
      '& .button': {marginLeft: 24, marginTop: 16, height: 36},
      '& .joseiNo': {width: '11ch'},
      '& .josei':{'& .MuiCheckbox-root': {padding: 0},},
    }
  },
  bottomSpacer:{marginBottom: 24,},
  checkboxFormLabel: {
    marginInlineStart: 24,
  },
  deleteWarning: {padding: '8px 0 8px 16px', color:red[700], fontSize: '.8rem'},
  fetchAllButton: {},
  warningWrap: {
    display: 'flex', padding: '16px 16px 8px', alignItems: 'center',
    '& .text' : {
      flex: 1, paddingRight: 16, color: red[800], fontSize: '.8rem',
      lineHeight: 1.6,
    },
    '& .button' : {'& .MuiButtonBase-root': {width: 180}},
  },
  nomatchOuter: {},
  chkBoxWrap: {
    padding: 8, display: 'flex', justifyContent: 'center', flexWrap: 'wrap',
    '& .comment': {
      width: '100%', color: red[800], fontSize: '.8rem', textAlign: 'center'
    },
  },
});

const formIdOfficeEdit = 'wiyy5649';

const FetchAllButton = () => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const hid = useSelector(state=>state.hid);
  const bid = useSelector(state=>state.bid);
  const stdDate = useSelector(state=>state.stdDate);
  const weekDayDefaultSet = 
  useSelector(state => state.config.weekDayDefaultSet);
  const clickHandler = () =>{
    fetchAll({stdDate, hid, bid, weekDayDefaultSet, dispatch});
  }
  return (
    <div className={classes.fetchAllButton}>
      <Button
        variant="contained"
        className={classes.button}
        startIcon={<ReplayIcon />}
        onClick={()=>clickHandler()}
      >
        再読み込み
      </Button>
    </div>
  )
}

// 自動登録されたパラメータを表示して編集する。
// 現在上限管理で利用されている他事業所の情報と、市区町村名、番号が該当する
// 複数箇所に複数登録されているので全部置き換える
// スケジュール以外の情報はデータベース送信まで行う
// スケジュールに登録されているものは送信予約を行う


// 管理事業所、協力事業所を持つユーザーの配列を求める
const relatedUsers = (users) => {
  const t1 = [];  // まずは単純配列で取得する
  users.filter(e=>e.etc).filter(e=>e.etc.協力事業所).map(e=>{
    e.etc.協力事業所.filter(f=>f.name).map(f=>{
      t1.push({
        name: f.name, no: f.no, lname: (f.lname)? f.lname: '', 
      });
    });
  });
  users.filter(e=>e.etc).filter(e=>e.etc.管理事業所).map(e=>{
    e.etc.管理事業所.filter(f=>f.name).map(f=>{
      t1.push({
        name: f.name, no: f.no, lname: (f.lname)? f.lname: '', 
      });
    });
  });
  return t1;
}

// export const CorrectOfficeNo = (props) => {
//   const dispatch = useDispatch();
//   const classes = useStyles()
//   const allstate = useSelector(s=>s);
//   const {users, schedule} = allstate;
//   const noMatchOfficeis = otherOfficeNotMatch(users, schedule);
//   const clickHandler = () => {
//     // ユーザーからユニークな事業所名と事業所番号を取得
//     const ooUser = otherOfficeisFromUsers(users);
//     const ooUnqNames = Array.from(new Set(ooUser.map(e=>e.name)));
//     const ooUnq = ooUnqNames.map(e=>{
//       const t = ooUser.find(f=>f.name === e);
//       return t;
//     });
//     const items = [KANRI_JIGYOUSYO, KYOURYOKU_JIGYOUSYO]
//     // 送信用の配列とオブジェクトを作成
//     const sendEtc = [];
//     const sendSch = {};
//     // dispath用のオブジェクト作成
//     const tmpUsers = JSON.parse(JSON.stringify(users));
//     const tmpSch = JSON.parse(JSON.stringify(schedule));
//     items.forEach(item=>{
//       tmpUsers.filter(e=>e.etc).filter(e=>e.etc[item]).forEach(e=>{
//         e.etc[item].forEach((f, i)=>{
//           const n = f.name;
//           const o = ooUnq.find(g=>g.name === n);
//           e.etc[item][i].no = o.no;
//         });
//         sendEtc.push({uid: e.uid, etc:e.etc});
//       });
//       Object.keys(tmpSch).filter(e=>e.match(/UID[0-9]+/)).
//     })
//   }
//   if (!noMatchOfficeis.length) return null;
//   const noMatchNames = noMatchOfficeis.map((e, i)=>{
//     return (
//       <div className='list' key={i}>{e}</div>
//     )
//   });
//   return (<>
//     <div className={classes.nomatchOuter}>
//       <div className='text'>
//         以下の事業所で事業所番号の不正が見つかっています。
//         事業所番号の変更を当月以前に行うと不整合が発生する可能性があります。
//         ボタンをクリックすると修正を行います。
//       </div>
//       <div className='button'>
//         <Button variant='contained' onClick={clickHandler}>
//           修正する
//         </Button>
//       </div>
//     </div>
//   </>)
// }

// 他のオフィスを users stateから取得する
export const getOtherOffices = (users) => {
  const t1 = relatedUsers(users);
  // 他事業所のnoをユニークにする
  const officeNumbers = new Set();
  t1.map(e=>officeNumbers.add(e.no));
  // ユニークにした番号からオフィス名などを付加した配列にする
  const uOffices = Array.from(officeNumbers).map(e=>({
    no: e, newNo: '',
    name: t1.find(f=>f.no === e).name,
    lname: t1.find(f=>f.no === e).lname,
  }));
  uOffices.sort((a, b)=> (a.name < b.name ? -1: 1));
  return (uOffices);
}

const EachOfficeFormParts = (p) => {
  const classes = useStyles();
  const {n, offices, setOffices, forthUpdate, setForthUpdate} = p;
  // フォーム用のstateを一旦作成する
  // 親コンポーネントのstateを更新するとこのコンポーネントは再レンダーされる
  const [val, setVal] = useState(offices[n]);
  const [chk, setChk] = useState({
    name:{error:false, helperText:'', disabled: false},
    lname:{error:false, helperText:'', disabled: false},
    newNo:{error:false, helperText:'', disabled: false},
    delete:{disabled: false},
  });
  // const [deleteCheckBox, setDeleteCheckBox] = useState(
  //   val.delete? val.delete: false
  // );
  // forthupdateが有効なときは編集を行えない
  useEffect(()=>{
    if (forthUpdate.checked && !forthUpdate.changedByEachOffice){
      const t = {...chk};
      t.name.disabled = true;
      t.lname.disabled = true;
      t.newNo.disabled = true;
      t.delete.disabled = true;
      setChk(t);
    }
    else if (!forthUpdate.changedByEachOffice){
      const t = {...chk};
      t.name.disabled = false;
      t.lname.disabled = false;
      t.newNo.disabled = false;
      t.delete.disabled = false;
      setChk(t);
    }
  }, [forthUpdate])
  const handleChange = (ev) => {
    const name = ev.currentTarget.name;
    const v = ev.currentTarget.value;
    const t = {...val};
    const u = {...chk};
    if (name === 'name'){
      u.newNo.disabled = true;
      u.newNo.helperText = '変更不可';
      setChk(u);
    }
    else if (name === 'newNo'){
      u.name.disabled = true;
      u.name.helperText = '変更不可';
      setChk(u);
    }
    t[name] = v;
    setVal(t);
    // 強制上書きは不可にする
    setForthUpdate({checked: false, edited: true, changedByEachOffice: true})
  }
  // 他の項目はblurで上位stateを更新しているが
  // チェックボックスはここで更新する
  const handeleCheckBoxChange = (ev) => {
    const t = {...val};
    t.delete = ev.currentTarget.checked;
    setVal(t);
    const u = [...offices];
    u[n].delete = ev.currentTarget.checked;
    setOffices(u);
    setForthUpdate({checked: false, edited: true});
  }
  // ブラーで親コンポーネントのstateを更新する
  const handleBlur = (ev) => {
    const elm = ev.currentTarget;
    const name = elm.name;
    const nameChk = name.match(/name/);
    // 数値入力は10桁の番号
    const value = nameChk ? elm.value: comMod.convHankaku(elm.value);
    const v = {...val};
    v[name] = value;
    setVal(v);
    const u = {...chk};
    const w = [...offices];
    w.splice(n, 1); // 自分自身の行を削除
    // 事業所番号の重複チェック
    const chkDupNo = (name === 'newNo')? w.find(e => e.no === value) : false;
    // 事業所名の重複チェック
    const chkDupName = (name === 'name')? w.find(e => e.name === value): false;
    
    if (elm.required && !value){
      u[name].error = true;
      u[name].helperText = '入力必須項目です。';
    }
    // 使用禁止文字
    else if (value.match(sfp.forbiddenPtn) && nameChk){
      u[name].error = true;
      u[name].helperText = '使用禁止文字があります。';
    }
    // 変更事業所番号のチェック
    else if (!value.match(/[0-9]{10}/) && name === 'newNo' && value){
      u[name].error = true;
      u[name].helperText = '10桁の番号が必要';
    }
    else if (value && chkDupNo){
      u[name].error = true;
      u[name].helperText = '番号が重複してます';
    }
    else if (value && chkDupName){
      u[name].error = true;
      u[name].helperText = '名前が重複してます';
    }
    else{
      u[name].error = false;
      u[name].helperText = '';
    }
    setChk(u);
    const t = [...offices];
    t[n][name] = value;
    setOffices(t);
  }
  // 事業所正式名称にフォーカスあたったら略称をコピー
  const handleFocus = (e) => {
    const t = {...val};
    if (!t.lname) t.lname = t.name;
    setVal(t);
    handleSelectInputAuto(e)

  }

  return(<>
    <div className='oneOffice'>
      <TextField 
        className='name'
        name='name'
        label='事業所略称'
        value={val.name}
        required
        helperText={chk.name.helperText}
        onFocus={e=>handleSelectInputAuto(e)}
        error={chk.name.error}
        disabled={chk.name.disabled}
        onChange={(ev)=>handleChange(ev)}
        onBlur={(ev)=>handleBlur(ev)}
      />
      <div className='officeHead'>
        事業所番号<br></br>{val.no}
      </div>
      <TextField 
        className='newNo'
        name='newNo'
        label='番号変更'
        value={val.newNo}
        helperText={chk.newNo.helperText}
        error={chk.newNo.error}
        disabled={chk.newNo.disabled}
        onChange={(ev)=>handleChange(ev)}
        onFocus={e=>handleSelectInputAuto(e)}
        onBlur={(ev)=>handleBlur(ev)}
      />
      <FormControlLabel className={classes.checkboxFormLabel}
        control={
          <Checkbox 
            checked={val.delete? val.delete: false} 
            disabled={chk.delete.disabled}
            onChange={(ev) => handeleCheckBoxChange(ev)} name="delete"
          />
        }
        label="削除"
      />

      <TextField 
        className='lname'
        name='lname'
        label='事業所正式名称'
        value={val.lname}
        helperText={chk.lname.helperText}
        error={chk.lname.error}
        disabled={chk.lname.disabled}
        onChange={(ev)=>handleChange(ev)}
        onBlur={(ev)=>handleBlur(ev)}
        onFocus={e=>handleFocus(e)}
      />
    </div>
  </>)
}

export const ReloadWarning = () => {
  const classes = useStyles();
  return (
  <div className={classes.warningWrap}>
    <div className='text'>
      この操作を行うときは他の端末で予定の編集などを行っていないことを確認して下さい。
      また、操作を行う直前にクラウド上のデータを再読込して下さい。
    </div>
    <div className='button'>
      <FetchAllButton/>
    </div>
  </div>

  )
}


const EditOtherOffice = (props) => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const path = useLocation().pathname;
  const {otherOffices, ...others} = props;
  const [offices, setOffices] = useState(otherOffices);
  const [sendDt, setSendDt] = useState(false);
  // 強制変更用
  const [forthUpdate, setForthUpdate] = useState({checked: false, edited: false});
  const [snack, setSnack] = useState({msg: '', severity: ''})
  const users = useSelector(state=>state.users);
  const schedule = useSelector(state=>state.schedule);
  const hid = useSelector(state=>state.hid);
  const bid = useSelector(state=>state.bid);
  const dateList = useSelector(state=>state.dateList);
  const stdDate = useSelector(state=>state.stdDate);

  // 編集結果監視用
  const [respons, setResponse] = useState({});
  useEffect(()=>{
    //ここは機能してない！
    console.log(respons, 'respons')
  }, [respons]);
  // -------データ送信用
  useEffect(()=>{
    let isMounted = true;
    const {tmpSch, tmpUsers, etcs} = sendDt;
    if (sendDt && isMounted){
      // スケジュール即時送信
      comMod.callDisptchForSendSchedule(
        { dateList, stdDate, schedule, hid, bid, dispatch }
      );

      // db送信 コール先でdisptchを実行
      comMod.sendUserEtcMulti(
        {hid, bid, etcs,date: stdDate }, setResponse, dispatch
      );
      // スケジュールstateの更新
      tmpSch.timestamp = new Date().getTime();
      dispatch(Actions.setStore({schedule:tmpSch}));
      // ユーザーstateの更新
      dispatch(Actions.setStore({users:tmpUsers}));
      setSendDt(false);
    }
    return (()=>{
      isMounted = false;
    });
  }, [sendDt])
  // stateの書き換え
  // usersとscheduleの書き換えになると思われ
  const handleSubmit = () => {
    // ユーザーからユニークな事業所名と事業所番号を取得
    const ooUser = otherOfficeisFromUsers(users);
    const ooUnqNames = Array.from(new Set(ooUser.map(e=>e.name)));
    const ooUnq = ooUnqNames.map(e=>{
      const t = ooUser.find(f=>f.name === e);
      return t;
    });
    // ユーザーの更新
    const tmpUsers = [...users];
    const etcs = []; // db送信用の配列を作成する
    // エラーの検出
    const errFld = comMod.qslcta(`#${formIdOfficeEdit} .Mui-error`);
    if (errFld.length){
      setSnack({msg: 'エラーがあるので確認して下さい', severity: 'warning'});
      return false;
    }
    
    // usersのstateから管理事業所、協力事業所のキーを持っているデータを
    // 検索、フォームに入力された値と置き換える
    ['管理事業所','協力事業所'].map(d=>{
      tmpUsers.filter(e=>e.etc).filter(e=>e.etc[d]).map(e=>{
        e.etc[d].filter(f=>f.name).map(f=>{
          const edited = offices.find(g=>g.no === f.no);
          if (edited && !forthUpdate.checked){
            f.name = edited.name;
            f.lname = edited.lname;
            // 追加 2023/02/07 20/09forthupdate対応
            if (edited.newNo) f.no = edited.newNo;
            if (edited.delete)  f.delete = edited.delete;
            etcs.push({uid: e.uid, etc:e.etc});
          }
          else if (forthUpdate.checked){
            const o = ooUnq.find(h => h.name === f.name);
            if (o){
              const newNo = o.no;
              f.no = newNo;
              etcs.push({uid: e.uid, etc:e.etc});
            }
          }
          else{
            // これは表示されないはず
            console.log('user state update err.');
          }
        });
        const t = e.etc[d].filter(f=>f.name && !f.delete).map(f=>f);
        e.etc[d] = t;
      });
    })

    // ---- スケジュール更新
    const tmpSch = {...schedule};
    // 協力事業所/管理事業所を持つキーを作成
    ['管理事業所','協力事業所'].map(d=>{
      const uidsk = Object.keys(tmpSch).filter(e=>(tmpSch[e][d]));
      uidsk.map(e=>{
        tmpSch[e][d].map(f=>{
          const edited = offices.find(g=>g.no === f.no);
          if (edited && !forthUpdate.checked){
            f.name = edited.name;
            f.lname = edited.lname;
            // 追加 2023/02/07
            if (edited.newNo) f.no = edited.newNo;
            if (edited.delete)  f.delete = edited.delete;
            etcs.push({uid: e.uid, etc:e.etc});
          }
          else if (forthUpdate.checked){
            const o = ooUnq.find(h => h.name === f.name);
            if (o){
              const newNo = o.no;
              f.no = newNo;
              etcs.push({uid: e.uid, etc:e.etc});
  
            }
          }
          else{
            // これは表示されないはず
            console.log('user state update err.');
          }
        });
        const t = tmpSch[e][d].filter(f=>f.name && !f.delete).map(f=>f);
        tmpSch[e][d] = t;
      });
    });
    // 送信とdispatchはuseeffectに移動
    // // スケジュールstateの更新
    // dispatch(Actions.setStore({schedule:tmpSch}));
    // // スケジュール即時送信
    // comMod.callDisptchForSendSchedule(
    //   { dateList, stdDate, schedule, hid, bid, dispatch }
    // );

    // // ユーザーstateの更新
    // dispatch(Actions.setStore({users:tmpUsers}));
    // // db送信 コール先でdisptchを実行
    // comMod.sendUserEtcMulti(ｚ
    //   {hid, bid, etcs,date: stdDate }, setResponse, dispatch
    // );
    setSendDt({tmpSch:{...tmpSch}, tmpUsers:[...tmpUsers], etcs: [...etcs]});
  }

  const handleCancel = () =>{
    dispatch(Actions.resetStore());
  }

  const officeFormParts = offices.map((e, i)=>{
    const p = {n: i, offices:[...offices], setOffices, forthUpdate, setForthUpdate}
    return(<EachOfficeFormParts {...p} key={i}/>)
  });
  // 削除チェックされているかどうかのフラグ
  const deleteCheked = offices.filter(e=>e.delete).length > 0;
  const scheduleLocked = schedule.locked ?true :false;
  return(<>
    <div className='H'>
      協力事業所・管理事業所編集
      <div className='small'>
        登録されている管理事業所・協力事業所を編集します。
        正式名称を登録すると帳票などに反映されます。
      </div>
    </div>
    <ReloadWarning />
    <form className={classes.officesEditForm} id={formIdOfficeEdit}>
      {officeFormParts}
    </form>
    {deleteCheked === true &&
      <div className={classes.deleteWarning}>
        削除がチェックされています。
        更新すると対象の事業所と上限管理情報はすべて削除されます。
      </div>
    }
    <div className={classes.chkBoxWrap}>
      <FormControlLabel
        control={
          <Checkbox
            checked={forthUpdate.checked}
            onClick={(e)=>{
              setForthUpdate({...forthUpdate, checked: e.target.checked})
            }}
            color="primary" disabled={forthUpdate.edited}
          />
        }
        label="強制的に事業所番号を揃える"
      />
      {forthUpdate.edited === true &&
        <div className='comment'>
          事業所名、事業所番号などが変更されたため「強制的に揃える」は無効です。
        </div>
      }
    </div>
    <div className={classes.bottomSpacer + ' buttonWrapper'}>
      <Button 
        variant='contained' color='secondary'
        onClick={handleCancel}
      >
        キャンセル
      </Button>

      <Button 
        variant='contained' color='primary'
        disabled={scheduleLocked}
        onClick={handleSubmit}
      >
        更新
      </Button>

    </div>
    <SnackMsg {...snack} />
  </>)
}
// 市区町村情報の編集
// 市区町村情報はusersの情報を基本とするが自治体助成金の絡みで管理するパラメータが増えた
// 請求にも影響するため月ごとに管理が可能なbrunchのetcにも情報を格納する
// state上では
const OneCity = (props) => {
  const {no, name, /*scities, setScities*/} = props;
  const dispatch = useDispatch();
  const users = useSelector(state=>state.users);
  const hid = useSelector(state=>state.hid);
  const bid = useSelector(state=>state.bid);
  const com = useSelector(state=>state.com);
  const stdDate = useSelector(state=>state.stdDate);
  // comに記述されている市区町村情報を取得
  const cities = com.etc.cities;
  let thisCitiy = (cities)
  ? cities.find(e=>e.no === no): {no, joseiNo:no, josei:false};
  thisCitiy = thisCitiy ? thisCitiy: {no, joseiNo:no, josei:false};
  // フォーム用ステイト
  const [val, setVal] = useState({
    name,
    joseiNo: thisCitiy.joseiNo,
    josei: thisCitiy.josei,
  });
  const [err, setErr] = useState({
    name: {err: false, msg: ''},
    joseiNo: {err: false, msg: ''},
  });
  const [existError, setExistError] = useState(true);
  
  const handleChange = (ev) =>{
    const targetName = ev.currentTarget.name;
    const type = ev.currentTarget.type;
    const targetVal = (type === 'checkbox')
    ? ev.currentTarget.checked: ev.currentTarget.value;
    const tVal = {...val};
    tVal[targetName] = targetVal;
    setVal(tVal);
  }
  // バリデーション
  const handleBlur = (ev) => {
    const targetName = ev.currentTarget.name;
    const targetVal = ev.currentTarget.value;
    const tErr = {...err};
    if (targetName === 'name'){
      if (!targetVal){
        tErr[targetName].err = true;
        tErr[targetName].msg = '入力必須項目';
      }
      else if (targetVal.length > 16){
        tErr[targetName].err = true;
        tErr[targetName].msg = '16文字以内';
      }
      else if (targetVal.match(sfp.forbiddenPtn)){
        tErr[targetName].err = true;
        tErr[targetName].msg = '使用禁止文字あり';
      }
      else{
        tErr[targetName].err = false;
        tErr[targetName].msg = '';
      }
    }
    if (targetName === 'joseiNo'){
      if (!targetVal){
        tErr[targetName].err = true;
        tErr[targetName].msg = '入力必須項目';
      }
      else if (!/^[0-9]{6}$/.test(targetVal)){
        tErr[targetName].err = true;
        tErr[targetName].msg = '6桁の数字';
      }
      else{
        tErr[targetName].err = false;
        tErr[targetName].msg = '';
      }
    }
    setErr(tErr);
  }
  const handleSubmit = () => {
    // ユーザーstateのセットと書き換え
    const tmpUsers = [...users];
    tmpUsers.filter(e=>e.scity_no === no).map(e=>{
      e.scity = val.name;
    });
    dispatch(Actions.setStore({users: tmpUsers}));
    const p = {hid, bid, scity: val.name, scity_no: no};
    comMod.sendUsersCity(p, ()=>null, dispatch);
    // state.comの書き換え
    const newCiteis = (cities)? cities: []; // 未構築なら空の配列
    const cityNdx = newCiteis.findIndex(e=>e.no===no);
    if (cityNdx < 0){ // 見つからないときは追加
      newCiteis.push({no, ...val});
    }
    else{ // 見つかったら更新
      newCiteis[cityNdx] = {no, ...val};
    }
    // ストア更新
    dispatch(Actions.setStore(
      {com: {...com, date:stdDate, etc:{...com.etc, cities:newCiteis}}}
    ));
    // db上の事業所更新
    dispatch(Actions.sendBrunch(
      { ...com, hid, bid, date:stdDate, etc: {...com.etc, cities:newCiteis}}
    ));

  }
  // サブミットボタンの有効無効を切り替えるためにエラーのステイトを確認する
  useEffect(()=>{
    let t = false;
    Object.keys(err).map(e=>{
      if (err[e].err) t = true;
    });
    setExistError(t);
  }, [err]);
  return(
    <div className='oneCity'>
      <div className='row'>
        <div className='no'>{no}</div>
        <TextField
          name='name'
          value={val.name}
          onChange={(ev)=>handleChange(ev)}
          className='name'
          onBlur={(ev)=>handleBlur(ev)}
          onFocus={e=>handleSelectInputAuto(e)}
          label='市区町村名'
          error={err.name.err}
          helperText={err.name.msg}
        />
        <FormControlLabel
          className='josei'
          control={
            <Checkbox
              checked={val.josei}
              onChange={(ev)=>handleChange(ev)}
              name='josei'
              color="primary"
            />
          }
          labelPlacement="bottom"
          label='自治体助成'
        />
        <TextField
          name='joseiNo'
          value={val.joseiNo}
          onChange={(ev)=>handleChange(ev)}
          className='joseiNo'
          onBlur={(ev)=>handleBlur(ev)}
          onFocus={e=>handleSelectInputAuto(e)}
          label='助成自治体番号'
          error={err.joseiNo.err}
          helperText={err.joseiNo.msg}
        />

        <Button
          variant='contained' color='primary'
          onClick={handleSubmit}
          className='button'
          disabled={existError}
        >
          更新
        </Button>
      </div>
    </div>
  )
}

// 市区町村の編集
// const EditCties = () =>{
//   const classes = useStyles();
//   const users = useSelector(state=>state.users);
//   // 市区町村番号と市区町村名のユニークなセットを作成
//   const scityNoSet = new Set();
//   users.map(e=>{scityNoSet.add(e.scity_no)});
//   const cities = Array.from(scityNoSet).map(e=>{
//     const name = users.find(f=>f.scity_no === e).scity;
//     return {no: e, name};
//   });
//   cities.sort((a, b)=>(a.no > b.no)? 1: -1);
//   // const [scities, setScities] = useState(cities);
//   const earchCity = cities.map((e, i)=>{
//     return(
//       <OneCity {...e} key={i}/>
//     )
//   });
//   return (<>
//     <div className='H'>
//       市区町村名編集
//       <div className='small'>
//         登録されている市区町村名称や自治体助成の有無などを登録します。
//       </div>
//     </div>
//     <ReloadWarning />
//     <form className={classes.cityForm}>
//       {earchCity}
//     </form>
//   </>);
// }

const RegParamsMain = () => {
  const users = useSelector(state=>state.users);
  const otherOffices = getOtherOffices(users);
  return(<>
    <EditOtherOffice otherOffices={otherOffices} />
    {/* <EditCties /> */}
    <EditCities />
    <SchLokedDisplay />
  </>);
  
} 


export const RegistedParams = () => {
  const allstate = useSelector(state=>state);
  const loadingStatus = comMod.getLodingStatus(allstate);
  if (loadingStatus.loaded){
    return (<RegParamsMain />)
  }
  else if (loadingStatus.error){
    return (
      <LoadErr loadStatus={loadingStatus} errorId={'E4946'} />
    )
  }
  else{
    return <LoadingSpinner/>
  }

}
export default RegistedParams;