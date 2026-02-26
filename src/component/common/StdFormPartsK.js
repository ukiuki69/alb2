// 基本的フォームパーツ
import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { connect, useDispatch, useSelector } from 'react-redux';
import * as mui from '../common/materialUi';
import * as comMod from '../../commonModule';
import { getUser, findDeepPath } from '../../commonModule';
import { didPtn } from '../../modules/contants';
import TextField from '@material-ui/core/TextField';
import Input from '@material-ui/core/Input';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import CheckBoxIcon from '@material-ui/icons/CheckBox';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import DeleteIcon from '@material-ui/icons/Delete';
import { blue, common, grey, red, teal } from '@material-ui/core/colors';
import {
  useStyles, sw, selectStyle, ChkBoxGp, SelectGp, TextGP
} from './FormPartsCommon'
import Autocomplete from '@material-ui/lab/Autocomplete';
// import { endPoint } from '../../Rev';
import { HOHOU, HOUDAY, JIHATSU } from '../../modules/contants';
import { deleteSchedule, endPoint, handleSelectInputAuto } from '../../albCommonModule';
import * as Actions from '../../Actions';
import axios from 'axios';

import { Button, IconButton } from '@material-ui/core';
import { faBullseye, faSleigh } from '@fortawesome/free-solid-svg-icons';
import Cookies from 'js-cookie';
import SnackMsg from './SnackMsg';
import { SetUisCookieChkBox } from './commonParts';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ArrowLeftIcon from '@material-ui/icons/ArrowLeft';
import { useGetSchListInputSettingLSItem } from '../schedule/SchListInput/SchListInputSetting';


export const forbiddenPtn = /[\\\'\"`¥]/; // 利用禁止文字の定義

const useStylesLc = makeStyles({
  nameInput: {
    display: 'flex', flexWrap: 'wrap', width: 280,
      '& .nameCnt': {
        width: '100%', textAlign: 'center', paddingBottom: 4,
        '& .l': {fontSize: '.7rem', color: blue[900]},
        '& .MuiIconButton-root' : {padding: 4},
      }
  },

  checkBoxPadding :{ paddingLeft: 8, },
  userInfo: {
    display:'flex', justifyContent: 'center', padding: '8px 0 16px',
    width: '100%', alignItems: 'end', color: teal[800],
    '& >*': {padding: '0 8px'},
    '& .s': {fontSize: '.8rem'},
    '& .m': {fontSize: '1.2rem'},
  },
  removeCookieRoot: {
    display: 'flex',
    '& .chk': {width: '70%'},
    '& .button': {width: '30%'},
    '& .label': {width: '70%' ,paddingTop: 12},

  },
  extraSettingNotice: {padding: '8px 0', lineHeight: '1.5rem'},
  removeSchDisable: {
    padding: 8, background: teal[800], color: '#fff',
    marginTop: 8,
  },
  setUiCookiesRoot:{
    display: 'flex',
    '& .chk': {width: '70%'},
    '& .button': {width: '30%'},
  },
  destItem:{
    '& .smallLabel': {fontSize: 10, marginTop: -4, height: 12, color: grey[600]},
  },
  setTemplateAutoSave:{
    '& .MuiCheckbox-root': {padding: 6,},
    '& .MuiTypography-body1': {fontSize: '.8rem', color: grey[800]},
  },
  hideLabel: {
    '& .MuiFormLabel-root': {display: 'none', height: 0,}
  }
});

// 加算が記述される位置により渡されるオブジェクトの構造が違う
// 想定されるオブジェクトの形に対応しフォームにデフォルト値を返す
const getDef = (obj, name, uid = '', did = '') => {
  uid = (uid === undefined || uid === null) ? '' : uid;
  did = (did === undefined || did === null) ? '' : did;
  if (typeof did === 'object') did = comMod.convDid(did);
  // scheduleから検索する場合
  let rt = comMod.findDeepPath(
    obj, ['value', uid, did, name]
  );
  // templateから検索する場合
  if (rt === null || rt === undefined) {
    rt = comMod.findDeepPath(obj, ['value', name]);
  }
  return rt;
}

// 定員
export const Teiin = (props) => {
  const classes = useStyles();
  const nameJp = '定員';
  let def = getDef(props, nameJp, props.uid, props.did);
  def = (def === null || undefined) ? 0 : def;
  const [val, setval] = useState(def);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');
  const handleBlur = (e) => {
    const han = comMod.convHankaku(e.currentTarget.value);
    setval(han);
    if (isNaN(han)) {
      seterr(true);
      seterrMsg('数値を入力してください。');
    }
    else if (!han) {
      seterr(true);
      seterrMsg('入力必須項目です。');
    }
    else {
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
  const discriptionClick = (e) => {
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
        onChange={(e) => handleChange(e)}
        onBlur={(e) => handleBlur(e)}
        size={props.size}
        disabled={props.disabled}
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
        disabled={!props.disabled}
      />
    </div>
  )
}


// 地域区分
export const ChiikiKubun = (props) => {
  const classes = useStyles();
  const nameJp = '地域区分';
  let def = getDef(props, nameJp, props.uid, props.did);
  def = (def === null || undefined) ? '' : def;
  const [val, setval] = useState(def);
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
        地域区分とは地域間における人件費の差を勘案して、保険費用の配分を調整するために設けられた区分です。指定された区分を選択してください。
      </span>
      <span className="more">
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    '１級地',
    '２級地',
    '３級地',
    '４級地',
    '５級地',
    '６級地',
    '７級地',
    'その他',
  ]
  return (
    <>
      <div className={"aFormPartsWrapper ChiikiKubun " + props.size}>
        <SelectGp
          onChange={e => handleChange(e)}
          nameJp={nameJp}
          value={val}
          size={props.size}
          opts={opts}
          disabled={props.disabled}

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

// 時刻入力
export const TimeInput = (props) => {
  const classes = useStyles();
  let def = getDef(props, props.name, props.uid, props.did);
  def = (def === null || undefined) ? props.def : def;
  def = (def === null || undefined) ? "00:00" : def;
  const [val, setval] = useState(def);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');
  const setUpdated = props.setUpdated;
  // バリデーション
  const handleBlur = (e) => {
    let val = comMod.convHankaku(e.currentTarget.value);
    // 正規表現のパターン定義
    const ptn = '^(0[0-9]|1[0-9]|2[0-3]|[0-9]):[0-5][0-9]$'
    // コロンの確認追加
    if (val.indexOf(':') === -1) {
      val = val.substr(0, val.length - 2) + ':' + val.substr(-2);
    }
    // 長さが短かったら0パディング
    val = (val.length < 5) ? '0' + val : val;
    setval(val);
    if (val.search(ptn) === -1) {
      seterr(true);
      seterrMsg('時刻が不正です。');
    }
    else if (!val) {
      seterr(true);
      seterrMsg('入力必須です。');
    }
    else {
      seterr(false);
      seterrMsg('');
    }
  }
  const handleChange = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setval(e.currentTarget.value);
    if (typeof setUpdated === 'function'){
      setUpdated(true);
    }
  };
  const addStyles = props?.addStyles ?? {};
  return (
    <div className={"aFormPartsWrapper TimeInput " + props.size} style={addStyles}>
      {!props.noLabel &&
        <TimeInputFormParts
          value={val}
          err={err}
          name={props.name}
          label={props.label}
          onChange={(e) => handleChange(e)}
          onBlur={(e) => handleBlur(e)}
          size={props.size}
          disabled={props.disabled}
          required={props.required}
          errMsg={errMsg}
        />
      }
      {props.noLabel &&
        <TimeInputFormPartsNolabel
          value={val}
          err={err}
          name={props.name}
          onChange={(e) => handleChange(e)}
          onBlur={(e) => handleBlur(e)}
          size={props.size}
          disabled={props.disabled}
          required={props.required}
          errMsg={errMsg}
        />
      }
    </div>
  )
}

const TimeInputFormParts = (props) => {
  const classes = useStyles();
  const controleMode = useSelector(state=>state.controleMode);
  // const selectInputAuto = comMod.findDeepPath(
  //   controleMode, 'ui.selectInputAuto'
  // );

  const size = props.size;
  // sizeに応じたクラス名を求める
  const classList = ['tfLargeNum', 'tfMiddleNum'];
  const cls = selectStyle(props.size, classList);
  // const handeleFocus = (e) => {
  //   if (selectInputAuto){
  //     const node = e.currentTarget;
  //     node.select();
  //   }
  // }
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;

  return (
    <div className={classes[cls]}>
      <TextField
        // id="teiinInput"
        name={props.name}
        required={props.required}
        label={(props.label) ? props.label : props.name}
        value={props.value}
        onChange={(e) => props.onChange(e)}
        onBlur={e => props.onBlur(e)}
        onFocus={(e)=>handleSelectInputAuto(e)}
        error={props.err}
        helperText={props.errMsg}
        disabled={props.disabled}
      />
    </div>
  )
}

// 一覧入力実費指定用のチェックボックス
export const ListInputActualCostCheckbox = (props) => {
  const hideOnTabelEdit = useGetSchListInputSettingLSItem();
  const com = useSelector(state=>state.com);
  const config = useSelector(state=>state.config);
  // 実費の初期値を取得
  const actualCostListDef = 
    comMod.findDeepPath(com, 'etc.actualCostList') ?
    comMod.findDeepPath(com, 'etc.actualCostList') : config.actualCostList;

  // リストの初期値をpropsからも設定できるようにする
  // const actualCostListDef = (props.actualCostList)
  //   ? props.actualCostList : actualCostListDef;
  const exName = (props.exName) ? props.exName + '-': '';
  const name = 'actualCost';
  const noLabel = props.noLabel;
  // const size = props.size;
  // const label = '実費';
  // 複数入力対応用に拡張名を設定する
  let def = getDef(props, name, props.uid, props.did);
  // props.scheduleから取得を試みる
  def = (!def) ? getDef(props.value, name, props.uid, props.did): def;
  def = (!def) ? [] : def;


  // 実費項目のオブジェクトを配列化
  // [['おやつ', 100], ['教材費', 100], ['その他', 100],]
  const lst = comMod.objToArray(actualCostListDef);
  // 配列化された項目に対してチェックの有無を格納する
  // [['おやつ', 100, true], ['教材費', 100, false], ['その他', 100, false],]

  const chkBoxLst = lst.map(e => {
    const c = (Object.keys(def).indexOf(e[0]) > -1) ? true : false;
    return ({ name: e[0], price: e[1], checked: c });
  });
  const [val, setval] = useState([...chkBoxLst]);
  // useEffect(() => {
  //   setval([...chkBoxLst])
  // }, [actualCostList]);
  const handleChange = (ev) => {
    const tmp = val.map(e => {
      // exnameが指定されているとフォーム用stateのキーとnameが一致しないので
      // exnameを取り除く
      const nodeName = (ev.target.name.indexOf('-') > -1)?
        ev.target.name.split('-')[1]: ev.target.name;
      return (
        (nodeName === e.name) ? { ...e, checked: ev.target.checked } : e
      )
    });
    setval(tmp);
  };
  const priceTotalFunc = () => {
    let total = 0;
    val.map(_ => {
      if (_.checked) total += parseInt(_.price);
    });
    // 自由実費項目の処理 2022/04/15
    if (props.freeACost) total += parseInt(props.freeACost);
    return total;
  }
  const priceTotal = priceTotalFunc();
  const chkBoxes = val.map((e, i) => {
    if(hideOnTabelEdit?.[e.name] === false) return null;
    const label = (noLabel)? '': e.name;
    return (
      <FormControlLabel
        key={i}
        control={
          <Checkbox
            checked={e.checked}
            onChange={handleChange}
            name={e.name}
            price={e.price}
            color="primary"
            value={exName + name}
          />
        }
        label={label}
      />
    )
  }).filter(x => x);
  const style = {flexWrap: 'wrap'}
  return (<>
    <div style={style} className='aFormPartsWrapper acturalCostCheckBox'>
      {chkBoxes}
      {noLabel !== true &&
        <span className='priceLabel'>{priceTotal} 円</span>
      }
    </div>
  </>);
}

const TimeInputFormPartsNolabel = (props) => {
  const classes = useStyles();
  const controleMode = useSelector(state=>state.controleMode);
  const selectInputAuto = comMod.findDeepPath(
    controleMode, 'ui.selectInputAuto'
  );

  const size = props.size;
  // sizeに応じたクラス名を求める
  const classList = ['tfLargeNum', 'tfMiddleNum', 'tfSmallTime'];
  const cls = selectStyle(props.size, classList);
  const handeleFocus = (e) => {
    if (selectInputAuto){
      const node = e.currentTarget;
      node.select();
    }
  }

  return (
    <div className={classes[cls]}>
      <Input
        name={props.name}
        required={props.required}
        value={props.value}
        onChange={(e) => props.onChange(e)}
        onBlur={e => props.onBlur(e)}
        onFocus={(e)=>handleSelectInputAuto(e)}
        error={props.err}
        disabled={props.disabled}
      />
    </div>
  )
}


export const HolidayOrNot = (props) => {
  let def = getDef(props, props.name, props.uid, props.did);
  // def = (def === null || undefined) ? "" : def;
  def = (def === null || undefined) ? 0 : def;
  const [val, setval] = useState(def);
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const opts = [
    { value: 0, label: '平日利用', class: '' },
    { value: 1, label: '休日利用', class: 'holiday' },
  ];
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;

  return (
    <SelectGp
      onChange={e => handleChange(e)}
      name={props.name}
      label={props.label}
      value={val}
      size={props.size}
      opts={opts}
      disabled={props.disabled}
      hidenull
    />
  )
}

// 実費指定用のボタングループにしてみる
  // export const ActualCostButtonGroupe = (props) => {
  //   // コンフィグからの初期値
  //   const actualCostConfig = useSelector(state => state.config.actualCostList);
  //   // comからも初期値の取得を試みる 見つからなければコンフィグの値
  //   const comEtc = useSelector(staate=>state.com.etc);

  //   const {def, exName, ...others} = props;
  //   // 複数入力対応用に拡張名を設定する
  //   const exName = (exName) ? exName + '-': '';
  //   // def = {おやつ:100}
  //   const [val, setVal] = useState(def);

  // }

// 実費指定用のチェックボックス
export const ActualCostCheckBox = (props) => {
  const hideOnTabelEdit = JSON.parse(localStorage.getItem('hideOnTabelEdit'));
  const com = useSelector(state=>state.com);
  const config = useSelector(state=>state.config);
  // 実費の初期値を取得
  const actualCostListDef = 
    comMod.findDeepPath(com, 'etc.actualCostList') ?
    comMod.findDeepPath(com, 'etc.actualCostList') : config.actualCostList;

  // リストの初期値をpropsからも設定できるようにする
  // const actualCostListDef = (props.actualCostList)
  //   ? props.actualCostList : actualCostListDef;
  const exName = (props.exName) ? props.exName + '-': '';
  const name = 'actualCost';
  const noLabel = props.noLabel;
  // const size = props.size;
  // const label = '実費';
  // 複数入力対応用に拡張名を設定する
  let def = getDef(props, name, props.uid, props.did);
  // props.scheduleから取得を試みる
  def = (!def) ? getDef(props.value, name, props.uid, props.did): def;
  def = (!def) ? [] : def;


  // 実費項目のオブジェクトを配列化
  // [['おやつ', 100], ['教材費', 100], ['その他', 100],]
  const lst = comMod.objToArray(actualCostListDef);
  // 配列化された項目に対してチェックの有無を格納する
  // [['おやつ', 100, true], ['教材費', 100, false], ['その他', 100, false],]

  const chkBoxLst = lst.map(e => {
    const c = (Object.keys(def).indexOf(e[0]) > -1) ? true : false;
    return ({ name: e[0], price: e[1], checked: c });
  });
  const [val, setval] = useState([...chkBoxLst]);
  // useEffect(() => {
  //   setval([...chkBoxLst])
  // }, [actualCostList]);
  const handleChange = (ev) => {
    const tmp = val.map(e => {
      // exnameが指定されているとフォーム用stateのキーとnameが一致しないので
      // exnameを取り除く
      const nodeName = (ev.target.name.indexOf('-') > -1)?
        ev.target.name.split('-')[1]: ev.target.name;
      return (
        (nodeName === e.name) ? { ...e, checked: ev.target.checked } : e
      )
    });
    setval(tmp);
  };
  const priceTotalFunc = () => {
    let total = 0;
    val.map(_ => {
      if (_.checked) total += parseInt(_.price);
    });
    // 自由実費項目の処理 2022/04/15
    if (props.freeACost) total += parseInt(props.freeACost);
    return total;
  }
  const priceTotal = priceTotalFunc();
  const chkBoxes = val.map((e, i) => {
    if(hideOnTabelEdit?.[e.name] === false) return null;
    const label = (noLabel)? '': e.name;
    return (
      <FormControlLabel
        key={i}
        control={
          <Checkbox
            checked={e.checked}
            onChange={handleChange}
            name={e.name}
            price={e.price}
            color="primary"
            value={exName + name}
          />
        }
        label={label}
      />
    )
  }).filter(x => x);
  const style = {flexWrap: 'wrap'}
  return (<>
    <div style={style} className='aFormPartsWrapper acturalCostCheckBox'>
      {chkBoxes}
      {noLabel !== true &&
        <span className='priceLabel'>{priceTotal} 円</span>
      }
    </div>
  </>);
}


// 送迎の入力
export const Transfer = (props) => {
  // const name = props.name;
  // const label = props.label;
  const {name, label, noLabel, ...others} = props;
  let def = getDef(props, 'transfer', props.uid, props.did);
  def = (def === null || def === undefined) ? '' : def;
  // defはこの場合、配列なので処理
  // pickupが含まれていたら配列0番目を返す
  def = (props.name.indexOf('pickup') > -1 && def) ? def[0] : def[1];
  const [val, setval] = useState(def);
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  // オプションのリストをステイトから取得
  const opts = useSelector(state => state.config.transferList);
  // オプションリストをusers etcから取得
  const users = useSelector(state => state.users);
  const thisUser = getUser(props.uid, users);
  // オプションリストを所属から取得
  if (thisUser.belongs1 && opts.indexOf(thisUser.belongs1) === -1) {
    opts.push(thisUser.belongs1);
  }
  if (thisUser.belongs2 && opts.indexOf(thisUser.belongs2) === -1) {
    opts.push(thisUser.belongs2);
  }
  const service = useSelector(state=>state.service);
  const targetService = [HOUDAY, JIHATSU];
  if (!targetService.includes(service)) return null;

  return (
    <>
      <div className={"aFormPartsWrapper transfer " + props.size}>
        <SelectGp
          onChange={e => handleChange(e)}
          name={name} value={val} size={props.size}
          opts={opts}
          disabled={props.disabled}
          label={label} noLabel={noLabel}
          nullLabel='なし' // 空白文字を選択するときのラベル指定
        />
      </div>
    </>
  )
}

export const WeeksChkBox = (props) => {
  const { name, value, ...other } = props;
  const labels = [
    '日', '月', '火', '水', '木', '金', '土',
  ];
  const [check, setcheck] = useState(new Array(7).fill(false));
  const handleChange = (i, e) => {
    const t = Object.assign([], check);
    t[i] = e.target.checked;
    setcheck(t);
  }
  const classes = useStyles();
  const chkbox = labels.map((e, i) => {
    return (
      <FormControlLabel key={i} className={classes.formControlChkBox}
        control={
          <Checkbox
            // style={{ width: '20px', height: '20px' }}
            // icon={<CheckBoxOutlineBlankIcon style={{ fontSize: '20px' }} />}
            // checkedIcon={<CheckBoxIcon style={{ fontSize: '20px' }} />}
            icon={<CheckBoxOutlineBlankIcon />}
            checkedIcon={<CheckBoxIcon />}
            onChange={(e) => handleChange(i, e)}
            // name={name}
            value={name}
            name={e}
            index={i}
            checked={check[i]}
          // color={props.color}
          />
        }
        label={e}
      />
    )
  });
  return (chkbox);
}

// 住所入力
// 郵便番号と住所をセットで提供する
export const PostalAndAddress = (props) => {
  const { defPostal, defAddr1, defAddr2, required } = props;
  const def_Postal = (defPostal) ? defPostal : '';
  const def_city = (defAddr1) ? defAddr1 : '';
  const def_address = (defAddr2) ? defAddr2 : '';
  const [postal, setpostal] = useState(def_Postal);
  const [city, setcity] = useState(def_city);
  const [address, setaddress] = useState(def_address);
  const [errPostal, seterrPostal] = useState(false);
  const [errCity, seterrCity] = useState(false);
  const [erraddress, seterraddress] = useState(false);
  const [errMsgPostal, seterrMsgPostal] = useState(false);
  const [errMsgcity, seterrMsgcity] = useState(false);
  const [errMsgaddress, seterrMsgaddress] = useState(false);
  // useEffect用に確定した郵便番号を用意するハイフン無し
  const [postalfixed, setpostalfixed] = useState('');
  // 郵便番号が書き換えられたかどうかのフラグ
  const [postaledited, setpostaledited] = useState(false);

  // useEffectで発火
  // apiから郵便番号で住所を得る
  async function fetchAddressFromZip() {
    try {
      const url = endPoint() + '?a=zip&postal=' + postalfixed;
      const res = await axios.get(url);
      console.log(res);
      if (res.status === 400) {
        throw res.message;
      }
      else if (res.data.results === null) {
        throw '指定の郵便番号が見つかりません。';
      }
      const r = res.data.results[0];
      if (!r.submsg) {
        setcity(r.address1 + r.address2 + r.address3);
      }
      // 代替検索を行ったとき
      else {
        setcity(r.address1 + r.address2);
        seterrMsgcity(r.submsg);
      }
    }
    catch (e) {
      console.log("postal get error.")
      seterrMsgcity('郵便番号が見つかりませんでした。');
      seterrCity(true);
    }

  }
  useEffect(() => {
    // エラーがなくて値がセットされていて修正されているとき
    if (!errPostal && postalfixed && postaledited) {
      fetchAddressFromZip();
    }
  }, [postalfixed]);

  const handleChange = (e) => {
    if (e.target.name === 'postal') {
      setpostal(e.target.value);
      setpostaledited(true);
    }
    if (e.target.name === 'city') setcity(e.target.value);
    if (e.target.name === 'address') setaddress(e.target.value);
  }

  const handleFocus = (e) => {
    // postalがfocusでeditフラグをオフにする
    if (e.target.name === 'postal') {
      setpostaledited(false);
    }
  }

  const handleBlur = (e) => {
    const target = e.target;
    const value = target.value;
    if (target.name === 'postal') {
      let v = comMod.convHankaku(value);
      v = v.replace('-', '');
      if (isNaN(v) || v.length !== 7) {
        seterrPostal(true);
        seterrMsgPostal('7桁の数値が必要です');
      }
      else {
        seterrPostal(false);
        seterrMsgPostal('');
        setpostal(v.substr(0, 3) + '-' + v.substr(3, 4));
        setpostalfixed(v);
      }
    }
    else {
      const han = comMod.convHankaku(value);
      if (target.name === 'city'){
        setcity(han);
        if (!han){
          seterrCity(true);
          seterrMsgcity('入力必須項目です。');
        }
        else if (han.match(forbiddenPtn)){
          seterrCity(true);
          seterrMsgcity('使用禁止文字があります。');
        }
        else{
          seterrCity(false);
          seterrMsgcity('');
        }
      }
        
      if (target.name === 'address') {
        setaddress(han);
        if (!han){
          seterraddress(true);
          seterrMsgaddress('入力必須項目です。');
        }
        else if (han.match(forbiddenPtn)){
          seterraddress(true);
          seterrMsgaddress('使用禁止文字があります。');
        }
        else{
          seterraddress(false);
          seterrMsgaddress('');
        }
      }
    }
  }

  return (<>
    <div className="sFormaParts postal">
      <TextGP
        name='postal' label='郵便番号'
        value={postal} required={required}
        cls='tfMiddle'
        onChange={(e) => handleChange(e)}
        onBlur={(e) => handleBlur(e)}
        onFocus={(e) => handleFocus(e)}
        err={errPostal} errMsg={errMsgPostal}
      />
    </div>
    <div className="sFormaParts address">
      <TextGP
        name='city' label='住所１'
        cls='tfMiddle4XL'
        value={city} required={required}
        onChange={(e) => handleChange(e)}
        onBlur={(e) => handleBlur(e)}
        err={errCity} errMsg={errMsgcity}
      />
    </div>
    <div className="sFormaParts address">
      <TextGP
        name='address' label='住所２'
        cls='tfMiddle4XL'
        value={address} required={required}
        onChange={(e) => handleChange(e)}
        onBlur={(e) => handleBlur(e)}
        err={erraddress} errMsg={errMsgaddress}
      />
    </div>
  </>)
}

// 名前を入力させる
// kanaはboolen かな入力に限定するかどうか
// 姓と名の2つのフィールドを出力する
export const NameInput = (props) => {
  const {
    nameLname, nameFname, labelLname, labelFname, kana, required, def,
  } = props;
  const def_ = (def) ? def : '';
  const sname = def_.split(' ');
  const [lname, setlname] = useState(sname[0]);
  const [fname, setfname] = useState(sname[1]);
  const [err0, seterr0] = useState(false);
  const [errMsg0, seterrMsg0] = useState('');
  const [err1, seterr1] = useState(false);
  const [errMsg1, seterrMsg1] = useState('');
  const [nameMod, setNameMod] = useState(false);
  const classesLc = useStylesLc();

  const handleChange = (e) => {
    if (e.target.name === nameLname) setlname(e.target.value);
    if (e.target.name === nameFname) setfname(e.target.value);
  }
  // 名字と名前を分割する
  useEffect(()=>{
    if (lname && !fname){
      const l = Math.floor(lname.length / 2);
      const t = lname;
      setfname(t.slice(l));
      setlname(t.slice(0, l));
      setNameMod(true);
    }
  }, []);
  // 姓名を１文字ずつ調節
  const handleNameJustify = (d) => {
    let t = lname;
    let u = fname;
    let l; // 移動する一文字
    if (d > 0 && t.length > 1){
      l = t.slice(t.length - 1)
      t = t.slice(0, t.length - 1);
      u = l + u;
    }
    else if (d < 0 && u.length > 1){
      l = u.slice(0, 1);
      u = u.slice(1);
      t = t + l;
    }
    setlname(t);
    setfname(u);
}

  const handleBlur = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    // 入力フィールドによって関数名にエイリアス
    let seterr, seterrMsg, setval;
    if (name === nameLname) {
      seterr = seterr0;
      seterrMsg = seterrMsg0;
      setval = setlname;
    }
    else {
      seterr = seterr1;
      seterrMsg = seterrMsg1;
      setval = setfname;
    }
    if (value.match(forbiddenPtn)){
      seterr(true);
      seterrMsg('利用できない文字')
    }
    else if (!value && required) {
      seterr(true);
      seterrMsg('入力必須項目です。');
    }
    // かなのチェック
    else if (!comMod.convKanaToHiraAndChk(value).result && kana && value) {
      seterr(true);
      seterrMsg('かなを入力してください。');
    }
    else {
      seterr(false);
      seterrMsg('');
    }
    // かなの変換
    if (comMod.convKanaToHiraAndChk(value).result && kana && value) {
      seterr(false);
      seterrMsg('');
      setval(comMod.convKanaToHiraAndChk(value).str);
    }
  }
  return (
    <div className={classesLc.nameInput}>
      <div className="sFormaParts name">
        <TextGP
          name={nameLname} label={labelLname}
          value={lname} required={required}
          cls='tfMiddle'
          onChange={(e) => handleChange(e)}
          onBlur={(e) => handleBlur(e)}
          err={err0} errMsg={errMsg0}
        />
      </div>
      <div className="sFormaParts name">
        <TextGP
          name={nameFname} label={labelFname}
          cls='tfMiddle'
          value={fname} required={required}
          onChange={(e) => handleChange(e)}
          onBlur={(e) => handleBlur(e)}
          err={err1} errMsg={errMsg1}
        />
      </div>
      {nameMod === true &&
        <div className='nameCnt'>
          <IconButton onClick={()=>handleNameJustify(1)}>
            <ArrowRightIcon/>
          </IconButton>
          <span className='l'>姓名自動分割済</span>
          <IconButton onClick={()=>handleNameJustify(-1)}>
            <ArrowLeftIcon/>
          </IconButton>
        </div>
      }
    </div>
  )
}


// 障害種別
export const UserType = (props) => {
  const { def, ...other } = props;
  const name = 'type';
  const label = '障害児種別';
  const def_ = (def) ? def : '';

  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');

  // 児初と放デイでオプションを変えるため
  // ユーザIDが与えられている場合はユーザの利用するサービスに合わせる
  // 指定されていない場合はステートのサービスを取得してそれで指定する
  const users = useSelector(state=>state.users);
  const sService = useSelector(state=>state.service); // ステート上のサービス
  const thisUser = comMod.getUser(props.uid, users);
  const uService = (Object.keys(thisUser).length)? thisUser.service: sService;
  // サービス名の取得。まずはフォーム上から
  const serviceElm = document.querySelector('select[name="service"');
  // 取得できない場合はユーザー情報またはstateから
  let service = (serviceElm)? serviceElm.vlue: '';
  service = service? service: uService;


  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    const v = e.currentTarget.value;
    if (!v) {
      seterr(true);
      seterrMsg('選択してください。');
    }
    else {
      seterr(false);
      seterrMsg('');
    }
  }

  const opts = (service === '放課後等デイサービス')?
  ['障害児', '重症心身障害児']: ['障害児', '重症心身障害児', '難聴児']
  return (
    <div className="sFormaParts usertype">
      <SelectGp
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        styleUse='tfMiddleL'
        name={name}
        value={val}
        size={'large'}
        opts={opts}
        err={err}
        errMsg={errMsg}
        disabled={props.disabled}
        label={label}
        required hidenull
      />
    </div>
  )
}

// 医療的ケア児設定
export const IryouCareType = (props) => {
  const { def, ...other } = props;
  const name = 'icareType';
  const label = '医療的ケア児設定';
  const def_ = (def) ? def : '';
  const [val, setval] = useState(def_);
  // const [err, seterr] = useState(false);
  // const [errMsg, seterrMsg] = useState('');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    return false;
  }
  const opts = ['医療的ケア3点以上', '医療的ケア16点以上', '医療的ケア32点以上'];
  return (
    <div className="sFormaParts kanriType">
      <SelectGp
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        styleUse='fcMiddleL'
        name={name}
        value={val}
        opts={opts}
        label={label}
        required
      />
    </div>
  )
}

// 18歳以上設定
export const Over18 = (props) => {
  const { def, ...other } = props;
  const name = 'over18';
  const label = '受給者証名義';
  const def_ = (def) ? def : '';
  const [val, setval] = useState(def_);
  // const [err, seterr] = useState(false);
  // const [errMsg, seterrMsg] = useState('');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    return false;
  }
  const opts = ['保護者', '本人', ];
  return (
    <div className="sFormaParts kanriType">
      <SelectGp
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        styleUse='fcMiddle'
        name={name}
        value={val}
        opts={opts}
        label={label}
        nullLabel='自動'
      />
    </div>
  )
}


// サービス種別
// 保育訪問・相談支援対応用に外部stateのsetterを受け付ける
export const ServiceType = (props) => {
  const { def, setService, service, setMultiService,...other } = props;
  const name = 'service';
  const label = 'サービス種別';
  let def_ = (def) ? def : '';
  def_ = def_.includes(',')? '複数サービス': def_;

  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');
  const account = useSelector(state=>state.account);
  const users = useSelector(state=>state.users);
  const hid = account.hid;
  const existHohou = users.map(e=>e.service).some(e=>e.includes(HOHOU));
  const permission = comMod.parsePermission(account)[0][0];
  const handleChange = (e) => {
    setval(e.currentTarget.value);
    if (typeof setService === 'function'){
      setService(e.currentTarget.value);
    }
  }
  const handleBlur = (e) => {
    const v = e.currentTarget.value;
    if (!v) {
      seterr(true);
      seterrMsg('選択してください。');
    }
    else {
      seterr(false);
      seterrMsg('');
    }
  }
  useEffect(()=>{
    if (def && def.includes(',') && service !== '複数サービス'){
      setService('複数サービス')
    }
  }, [])

  const opts = ['放課後等デイサービス', '児童発達支援'];
  const useHohou = comMod.getUisCookie(comMod.uisCookiePos.useHohouService);
  // 保育所等訪問支援追加条件の暫定処置を廃止
  console.log(useHohou, 'useHohou');
  if (useHohou || existHohou){
    opts.push(...['保育所等訪問支援', '複数サービス']);
  }

  return (
    <div className="sFormaParts service">
      <SelectGp
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        styleUse='fcMiddleL'
        name={name}
        value={val}
        size={'large'}
        opts={opts}
        err={err}
        errMsg={errMsg}
        disabled={props.disabled}
        label={label}
        required hidenull
      />
    </div>
  )
}

export const MultiService = (props) => {
  const {def, multiSvcCnt, setMultiSvcCnt} = props;
  const defA = def.split(','); // defはカンマ区切りで入ってくるものとする
  const opts = ['放課後等デイサービス', '児童発達支援', '保育所等訪問支援'];
  // chekboxの値を管理するstate 初期値を求める
  const [chkBoxVals, setChkBoxVals] = useState(
    ()=>{
      return opts.map(e=>{
        if (defA.includes(e)) return true;
        else return false;
      })
    }
  );
  const dispMsgDef = {
    text: 'チェックされたサービスを設定します。', className: 'normal',
    styleName: 'normal'
  }
  const [dispMsg, setDispMsg] = useState(dispMsgDef);
  useEffect(()=>{
    // 選択されているサービスを文字列で格納する
    let s;
    const t = [...chkBoxVals];
    t.forEach((e, i)=>{
      if (e) s += opts[i];
    });
    setMultiSvcCnt(s);
  }, [chkBoxVals])
  useEffect(()=>{
    checkBoxValueChk([...chkBoxVals])
  }, [])
  // チェックボックスの選択が正しいかチェックする
  const checkBoxValueChk = (t) => {
    // 選択されたサービス名を連結する
    let conStr = '';
    t.forEach((e, i)=>{
      if (e) conStr += opts[i];
    });
    // 単一サービスが選択された場合
    if (t.filter(e=>e).length <= 1){
      setDispMsg({
        text: 'サービスを２つ以上設定してください。単一サービスの場合はサービス種別で設定してください。', 
        className: 'multiServiceError', applyStyle: {color: red[800]}
      })
    }
    else if (conStr.includes('放課後等デイサービス') && conStr.includes('児童発達支援')){
      setDispMsg({
        text: '同時設定できないサービスが設定されています', className: 'multiServiceError',
        applyStyle: {color: red[800]}
      })
    }
    else setDispMsg(dispMsgDef)

  }
  const handleChange = (ev, i) => {
    const t = [...chkBoxVals];
    t[i] = ev.target.checked;
    checkBoxValueChk(t);
    setChkBoxVals(t);
  }
  // チェックボックスのネーム属性はmultiService放課後等デイサービス等とする
  const cks = opts.map((e, i)=>{
    return(
      <FormControlLabel key={i}
        control={
          <Checkbox
            checked={chkBoxVals[i]}
            onChange={(ev)=>handleChange(ev, i)}
            name={'multiService' + e}
            color="primary"
          />
        }
        label={e}
      />
    )
  });
  const msgStyle = {
    width: '100%', fontSize:'.8rem', marginTop: -4, ...dispMsg.applyStyle
  }
  const wrapStyle = {marginTop: -2, paddingTop: 0, flexWrap: 'wrap'};
  return(
    <div className='sFormaParts' style={wrapStyle}>
      {cks}
      <div style={msgStyle} className={dispMsg.className}>
        {dispMsg.text}
      </div>
    </div>
  )

}

// 事業所番号
export const JiNumber = (props) => {
  const { def, ...other } = props;
  const name = 'jino';
  const label = '事業所番号';
  const def_ = (def) ? def : '';
  const account = useSelector(state=>state.account);
  const permission = comMod.parsePermission(account);
  const thisDisabled = (permission[0][0] < 100)? true: false;

  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    const han = comMod.convHankaku(e.currentTarget.value);
    setval(han);
    if (isNaN(han)) {
      seterr(true);
      seterrMsg('数値が必要です。');
    }
    else if (!han) {
      seterr(true);
      seterrMsg('入力必須項目です。');
    }
    else if (han.length != 10) {
      seterr(true);
      seterrMsg('番号は10桁です。');
    }
    else {
      seterr(false);
      seterrMsg('');
    }
  }

  return (
    <div className="sFormaParts jino">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={'tfMiddle'}
        name={name}
        value={val}
        err={err}
        errMsg={errMsg}
        label={label}
        required
        disabled={thisDisabled}
      />
    </div>
  )
}

// 事業所名
export const Bname = (props) => {
  const { def, ...other } = props;
  const name = 'bname';
  const label = '事業所名';
  const def_ = (def) ? def : '';

  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    const v = comMod.convHankaku(e.currentTarget.value);
    setval(v);
    if (!v) {
      seterr(true);
      seterrMsg('入力必須項目です。');
    }
    else if (v.length > 30) {
      seterr(true);
      seterrMsg('事業所名は30文字までです');
    }
    else if (v.match(forbiddenPtn)){
      seterr(true);
      seterrMsg('利用できない文字があります');
    }
    else {
      seterr(false);
      seterrMsg('');
    }
  }

  return (
    <div className="sFormaParts bname">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={'tfMiddle4XL'}
        name={name}
        value={val}
        err={err}
        errMsg={errMsg}
        label={label}
        required
      />
    </div>
  )
}

// 事業所名
export const Sbname = (props) => {
  const { def, ...other } = props;
  const name = 'sbname';
  const label = '事業所略称';
  const def_ = (def) ? def : '';

  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    const v = comMod.convHankaku(e.currentTarget.value);
    setval(v);
    if (!v) {
      seterr(true);
      seterrMsg('入力必須項目です。');
    }
    else if (v.match(forbiddenPtn)){
      seterr(true);
      seterrMsg('利用できない文字があります');
    }
    else if (v.length > 10) {
      seterr(true);
      seterrMsg('略称は10文字までです');
    }
    // else if (v.length > 4) {
    //   seterr(false);
    //   seterrMsg('4文字程度がお薦めです');
    // }
    else {
      seterr(false);
      seterrMsg('');
    }
  }

  return (
    <div className="sFormaParts sbname">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={'tfMiddleXL'}
        name={name}
        value={val}
        err={err}
        errMsg={errMsg}
        label={label}
        required
      />
    </div>
  )
}



// 被保険者ナンバー
export const HihokenNo = (props) => {
  const { def, uid, ...other } = props;
  const name = 'hno';
  const label = '受給者証番号 ';
  const def_ = (def) ? def : '';
  const users = useSelector(state => state.users);
  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('仮登録は数字3桁');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    const han = comMod.convHankaku(e.currentTarget.value);
    setval(han);
    // 保険番号重複確認
    let existHno;
    // uid未設定の場合。追加のときは未設定で来るはず
    if (!uid) {
      const c = users.find(f => f.hno === han);
      existHno = c ? true : false;
    }
    // uid設定済み。修正モード
    else {
      const uidn = uid.replace(/[^0-9]/g, '');
      const c = users.find(f => f.hno === han && f.uid !== uidn);
      existHno = c ? true : false;
    }
    if (isNaN(han)) {
      seterr(true);
      seterrMsg('数値が必要です。');
    }
    else if (!han) {
      seterr(true);
      seterrMsg('入力必須項目です。');
    }
    else if (han.length != 10 && han.length != 3) {
      seterr(true);
      seterrMsg('番号は10桁です。');
    }
    else if (existHno) {
      seterr(true);
      seterrMsg('受給者証番号重複');
    }
    else {
      seterr(false);
      seterrMsg('');
      if (han.length === 3) {
        seterrMsg('仮登録します');
      }
    }
  }

  return (
    <div className="sFormaParts hno">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={'tfMiddle'}
        name={name}
        value={val}
        err={err}
        errMsg={errMsg}
        label={label}
        required
      />
    </div>
  )
}

// 契約支給量
export const Volume = (props) => {
  const { def, pName, ...other } = props;
  const name = pName? pName: 'volume';
  const label = '契約支給量';
  const def_ = (def) ? def : '';

  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const defaultMsg = '0入力で原則の日数'
  const [errMsg, seterrMsg] = useState(defaultMsg);
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    const han = comMod.convHankaku(e.currentTarget.value);
    setval(han);
    if (isNaN(han)) {
      seterr(true);
      seterrMsg('数値を入力してください。');
    }
    else if (!han) {
      seterr(true);
      seterrMsg('入力必須項目です。');
    }
    else if (parseInt(han) < 0 || parseInt(han) > 31) {
      seterr(true);
      seterrMsg('無効な数値です。');
    }
    else if (parseInt(han) === 0){
      seterr(false);
      seterrMsg('原則の日数');
    }
    else {
      seterr(false);
      seterrMsg(defaultMsg);
    }
  }
  return (
    <div className="sFormaParts volume">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={'tfMiddle'}
        name={name}
        value={val}
        err={err}
        errMsg={errMsg}
        label={label}
        required
      />
    </div>
  )
}
// ユーザーの口座情報用に作ったが法人の収納口座にも適用する
// 法人口座の場合はthisUserをnull指定する
// 法人口座モードのときはrequiredを設定しない
export const BankInfoFormsParts = (props) => {
  const classes = useStylesLc();
  const {bankInfo, thisUser} = props;
  const [val, setval] = useState(bankInfo);
  // エラーとエラーメッセージはデータオブジェクトのキーを見てその通りに作成する
  const [err, setErr] = useState(()=>{
    const t = {};
    Object.keys(bankInfo).forEach(e=>{
      t[e] = false;
    });
    return t;
  });
  const [errMsg, setErrMsg] = useState(()=>{
    const t = {};
    Object.keys(bankInfo).forEach(e=>{
      t[e] = false;
    });
    return t;
  });
  const required = (thisUser === null)? false: true;
  
  const handleChange = (e) => {
    const target = e.currentTarget;
    const t = {...val};
    t[target.name] = target.value;
    setval(t);
  }
  const handleBlur = (e) => {
    const target = e.currentTarget;
    const value = target.value;
    const name = target.name;
    // 入力必須項目のチェック
    if (target.required && !value){
      const t = {...err}
      const m = {...errMsg}
      err[name] = true;
      errMsg[name] = '入力必須です';
    }
    // 預金種目はそのまま通す
    if (name === '預金種目') return true;
    // 名義はカタカナ変換
    if (name === '口座名義人'){
      const k = comMod.convHiraToKataAndChk(value);
      const kana = k.str;
      const r = !k.result;
      const t = {...err};
      t[name] = r;
      setErr(t);
      const u = {...errMsg};
      u[name] = !r ? '': 'カタカナで入力して下さい';
      setErrMsg(u);
      const v = {...val};
      v[name] = kana;
      setval(v);
      return false;
    }
    let h = comMod.convHankaku(value);
    // 口座名義人: "カワハラカズヒサ" 口座番号: "3582669" 口振初回: "1" 店舗番号: "480"
    // 金融機関番号: "0005" 預金種目: "普通" 顧客コード: "0000010001"
    const keta = {
      口座番号: 7, 店舗番号: 3, 金融機関番号: 4, 顧客コード: 10, 委託者番号: 10
    };
    if (name === '顧客コード' || name === '委託者番号'){
      h = comMod.zp(h, keta[name]);
      const t = {...val};
      t[name] = h;
      setval(t);
    }
    if (name === '口座番号' && h.length === 6){
      h = comMod.zp(h, keta[name]);
      const t = {...val};
      t[name] = h;
      setval(t);
    }
    const match = /^[0-9]+$/.test(h);
    const lChk = h.length === keta[name];
    if (!match || !lChk){
      const t = {...err};
      t[name] = true;
      const u = {...errMsg}
      u[name] = `${keta[name]}桁の数値を入力`;
      setErr(t);
      setErrMsg(u);
    }
    else{
      const t = {...err};
      t[name] = false;
      const u = {...errMsg}
      u[name] = '';
      const v = {...val};
      v[name] = h;
      setErr(t);
      setErrMsg(u);
      setval(v);
    }
  }
  // 口座名義人のときのみ
  // 口座名義人未定義なら保護者の名前
  const handeleFocus = (e) => {
    const target = e.currentTarget;
    const value = target.value;
    const name = target.name;
    if (name !== '口座名義人'){
      return false;
    }
    if (!value && thisUser){
      const v = {...val};
      const pname = thisUser.pkana.replace(/\s/, '');
      v[name] = pname;
      setval(v);
    }
  }
  // const handleClearForm = () => {
  //   setval({
  //     口座名義人: "",
  //     口座番号: "",
  //     店舗番号: "",
  //     金融機関番号: "",
  //     顧客コード: "",
  //   })
  // }
  return (<>
    {thisUser !== null &&
      <div className={classes.userInfo}>
        <div className='s'>保護者名</div>
        <div className='m'>{thisUser.pname}</div>
        <div className='s'>児童名</div>
        <div className='m'>{thisUser.name}</div>
      </div>
    }
    <div className="sFormaParts ">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={'tfMiddle'}
        name={'金融機関番号'}
        value={val.金融機関番号}
        size={'large'}
        err={err.金融機関番号}
        errMsg={errMsg.金融機関番号}
        label={'金融機関番号'}
        required={required} bankInfo
      />
    </div>
    <div className="sFormaParts ">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={'tfMiddle'}
        name={'店舗番号'}
        value={val.店舗番号}
        size={'large'}
        err={err.店舗番号}
        errMsg={errMsg.店舗番号}
        label={'店舗番号'}
        required={required} bankInfo
      />
    </div>
    <div className="sFormaParts ">
      <SelectGp
        nameJp={'預金種目'}
        value={val.預金種目}
        // size='large'
        styleUse='tfMiddle'
        opts={['普通', '当座',]}
        onChange={(ev) => handleChange(ev)}
        hidenull bankInfo
      />

    </div>

    <div className="sFormaParts ">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={'tfMiddle'}
        name={'口座番号'}
        value={val.口座番号}
        size={'large'}
        err={err.口座番号}
        errMsg={errMsg.口座番号}
        label={'口座番号'}
        required={required} bankInfo
      />
    </div>

    <div className="sFormaParts ">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        onFocus={e=>handeleFocus(e)}
        cls={'tfMiddleXXL'}
        name={'口座名義人'}
        value={val.口座名義人}
        size={'large'}
        err={err.口座名義人}
        errMsg={errMsg.口座名義人}
        label={'口座名義人'}
        required={required} bankInfo
      />
    </div>
    {thisUser !== null &&
      <div className="sFormaParts ">
        <TextGP
          onChange={e => handleChange(e)}
          onBlur={e => handleBlur(e)}
          cls={'tfMiddle'}
          name={'顧客コード'}
          value={val.顧客コード}
          size={'large'}
          err={err.顧客コード}
          errMsg={errMsg.顧客コード}
          label={'顧客コード'}
          bankInfo
        />
      </div>
    }
    {thisUser === null &&
      <div className="sFormaParts ">
        <TextGP
          onChange={e => handleChange(e)}
          onBlur={e => handleBlur(e)}
          cls={'tfMiddle'}
          name={'委託者番号'}
          value={val.委託者番号}
          size={'large'}
          err={err.委託者番号}
          errMsg={errMsg.委託者番号}
          label={'委託者番号'}
          bankInfo
        />
      </div>
    }
    {/* <div className='sFormaParts'>
      <Button
        variant='contained'
        onClick={handleClearForm}
      >
        口座情報のクリア
      </Button>
    </div> */}

  </>)

}

// 上限額
export const PriceLimit = (props) => {
  const { def, ...other } = props;
  const name = 'priceLimit';
  const label = '上限額';
  const def_ = (def) ? def : '';

  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    const han = comMod.convHankaku(e.currentTarget.value);
    setval(han);
    if (isNaN(han)) {
      seterr(true);
      seterrMsg('数値を入力してください。');
    }
    else if (!han) {
      seterr(true);
      seterrMsg('入力必須項目です。');
    }
    else if (han === 0 || han > 100000) {
      seterr(true);
      seterrMsg('無効な数値です。');
    }
    else {
      seterr(false);
      seterrMsg('');
    }
  }
  return (
    <div className="sFormaParts priceLimit">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={'tfMiddle'}
        name={name}
        value={val}
        size={'large'}
        err={err}
        errMsg={errMsg}
        label={label}
        required
      />
    </div>
  )
}

// 契約書記入欄番号
export const ContractLineNo = (props) => {
  const { def, pName, ...other } = props;
  const name = pName? pName: 'lineNo';
  const label = '記入欄番号';
  const def_ = (def) ? def : '';

  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    const han = comMod.convHankaku(e.currentTarget.value);
    setval(han);
    if (isNaN(han)) {
      seterr(true);
      seterrMsg('数値を入力してください。');
    }
    else if (!han) {
      seterr(true);
      seterrMsg('入力必須項目です。');
    }
    else if (parseInt(han) === 0 || han > 100000) {
      seterr(true);
      seterrMsg('無効な数値です。');
    }
    else {
      seterr(false);
      seterrMsg('');
    }
  }
  return (
    <div className="sFormaParts priceLimit">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={'tfMiddle'}
        name={name}
        value={val}
        size={'large'}
        err={err}
        errMsg={errMsg}
        label={label}
        required
      />
    </div>
  )
}

// 兄弟設定
export const BrosersIndex = (props) => {
  const { def, ...other } = props;
  const name = 'brosIndex';
  const label = '兄弟設定';
  const def_ = (def) ? def : '';

  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('未設定は0');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    const han = comMod.convHankaku(e.currentTarget.value);
    setval(han);
    if (isNaN(han)) {
      seterr(true);
      seterrMsg('数値を入力してください。');
    }
    else if (!han) {
      seterr(false);
      seterrMsg('兄弟設定無し');
      setval(0);
    }
    else if (han < 0 || han > 20) {
      seterr(true);
      seterrMsg('無効な数値です。');
    }
    else {
      seterr(false);
      seterrMsg('');
    }
  }
  return (
    <div className="sFormaParts priceLimit">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={'tfMiddle'}
        name={name}
        value={val}
        size={'large'}
        err={err}
        errMsg={errMsg}
        label={label}
        required
      />
    </div>
  )
}



// 支給市区町村
// オートコンプリートとテキストフィールドを提供する
// すでに入力されている市区町村は市区町村名で市区町村番号を特定して
// テキストフィールドに出力、readonyにする
// 新規の場合はテキストフィールドに番号を入力する
// defは配列で渡される
export const Scity = (props) => {
  const { label, name, labelNo, nameNo, def, ...other } = props;
  const def_ = (def) ? def : ['', ''];
  const [scity, setscity] = useState(def_[0]);
  const [valText, setValText] = useState('');
  const [valErr, setValErr] = useState(false);

  const [scityNo, setscityNo] = useState(def_[1]);
  const [scityNoErr, setscityNoErr] = useState(false);
  const [scityNoText, setscityNoText] = useState('');
  const [scityNoDisabled, setscityNoDisabled] = useState(true);
  const classes = useStyles();
  // 支給市区町村のリスト
  const users = useSelector(state => state.users);
  const sCityiesSet = new Set();
  users.map(e => {
    sCityiesSet.add(e.scity); // 一意な市区町村名のみ作成する
  });
  // 一意な市区町村名に市区町村番号を付与する
  const scityList = Array.from(sCityiesSet).map(e => {
    const scno = users.find(f => f.scity === e).scity_no;
    return ({ scity: e, scity_no: scno });
  });
  const handleChange = (e) => {
    setscityNo(e.currentTarget.value);
  }

  // チェンジイベントはliに発生するときとテキストフィールドに発生するとき
  // 両方ある。共通の処理をまとめる
  const numberSet = (v) => {
    const f = scityList.filter(e => e.scity === v);
    const num = (f.length) ? f[0].scity_no : '';
    setscityNo(num);  // 取得できた市区町村番号をstateにセット
    // 市区町村番号が取得できたらdisabledにする 
    setscityNoDisabled((num) ? true : false);
    setscityNoErr(false);
    setscityNoText('');
  }

  const handleAcChange = (e) => {
    const value = e.currentTarget.value
    if (value.match(forbiddenPtn)){
      setValErr(true);
      setValText('使用できない文字です')
    }
    else{
      setValErr(false);
      setValText('');
    }

    setscity(value);
    numberSet(value);
  }
  const handleLiChange = (e, v) => {
    numberSet(v);
  }
  const handleTxBlur = (e) => {
    const han = comMod.convHankaku(e.currentTarget.value);
    if (isNaN(han) || han.length != 6) {
      setscityNoErr(true);
      setscityNoText('6桁の数字が必要です。');
    }
    else {
      setscityNoErr(false);
      setscityNoText('');

    }
    setscityNo(han);
  }
  return (<>
    <div className={"sFormaParts scity " + classes.tfMiddleXL}>
      <Autocomplete
        freeSolo
        options={scityList.map(e => e.scity? e.scity: '')}
        value={def_[0]}
        onChange={(e, v) => handleLiChange(e, v)}
        renderInput={(params) => (
          <TextField
            {...params} id='rte98d' label={label} name={name}
            onChange={(e) => handleAcChange(e)}
            error={valErr} helperText={valText}

          />
        )}
      />
    </div>
    <div className={'sFormaParts scity ' + classes.tfMiddle}>
      <TextField
        name={nameNo}
        label={labelNo}
        value={scityNo || ''}
        onChange={(e) => handleChange(e)}
        onBlur={e => handleTxBlur(e)}
        onFocus={e=>handleSelectInputAuto(e)}
        disabled={scityNoDisabled}
        error={scityNoErr}
        helperText={scityNoText}
        required
      />
    </div>
  </>)

}

// 管理区分
export const KanriType = (props) => {
  const { def, ...other } = props;
  const name = 'kanri_type';
  const label = '管理・協力';
  const def_ = (def) ? def : '';
  const [val, setval] = useState(def_);
  // const [err, seterr] = useState(false);
  // const [errMsg, seterrMsg] = useState('');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    // const v = e.currentTarget.value;
    // if (!v) {
    //   seterr(true);
    //   seterrMsg('選択してください。');
    // }
    // else {
    //   seterr(false);
    //   seterrMsg('');
    // }
    return false;
  }


  const opts = ['管理事業所', '協力事業所'];
  return (
    <div className="sFormaParts kanriType">
      <SelectGp
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        styleUse='fcMiddle'
        name={name}
        value={val}
        opts={opts}
        // err={err}
        // errMsg={errMsg}
        label={label}
        required
      />
    </div>
  )
}


// 上限管理結果入力
// 従来は協力事業所のときのみ使用するコンポーネントだったが
// 管理事業所からも使用する
// 管理事業所のときのnull値は自動となる
export const KanriKekka = (props) => {
  const { def, kanri, kyoudai,...other } = props;
  const name = (props.name)? props.name: 'kanriKekka';
  const label = '上限管理結果';
  const def_ = (def) ? def : '';
  const [val, setval] = useState(def_);
  // const [err, seterr] = useState(false);
  // const [errMsg, seterrMsg] = useState('');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    // const v = e.currentTarget.value;
    // if (!v) {
    //   seterr(true);
    //   seterrMsg('選択してください。');
    // }
    // else {
    //   seterr(false);
    //   seterrMsg('');
    // }
    return false;
  }

  // “1”管理事業所で利用者負担額を充当したため、他事業所では発生しない。
  //  協力事業所の場合、他事業所で管理されると1を入れる？
  // “2”利用者負担額の合計額が、負担上限月額以下のため、調整事務は行わない。
  // “3”利用者負担額の合計額が、負担上限月額を超過するため、調整した。 
  let opts;
  let nullLabel = kanri? '自動': false;
  if (kanri){
    nullLabel = '自動'
    opts = ['設定しない'];
  }    
  else if (kyoudai){
    nullLabel = '自動'
    opts = [
      { value: 1, label: '1:管理事業所が充当', class: '' },
      { value: 2, label: '2:上限内調整不要', class: '' },
      { value: 3, label: '3:管理事業所が調整', class: '' },
      '設定しない',
    ]
  }
  else {
    nullLabel = false;
    opts = [
      { value: 1, label: '1:管理事業所が充当', class: '' },
      { value: 2, label: '2:上限内調整不要', class: '' },
      { value: 3, label: '3:管理事業所が調整', class: '' },
      '設定しない',
    ]

  }
  
  return (
    <div className="sFormaParts kanriType">
      <SelectGp
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        styleUse='fcMiddleL'
        name={name}
        value={val}
        opts={opts}
        // err={err}
        // errMsg={errMsg}
        label={label}
        nullLabel={nullLabel}
        required
      />
    </div>
  )
}



// 日付入力
// limitは2021-01-01,2021-01-31みたいな感じで
// 2022/12/18
// 引数　setExtValを追加　上位モジュールのstateをセット　noLabelを追加
// helperTextShort ヘルパーテキストを短く
// disabled追加
export const DateInput = (props) => {
  const { 
    name, label, required, def, cls, wrapperStyle, limit, limitErrMsg,
    id, setExtVal, noLabel, helperTextShort,
    ...other 
  } = props;
  const classesLc = useStylesLc();
  const def_ = (def) ? def : '';
  const cls_ = (cls) ? cls : 'tfMiddleL';
  const limit_ = (limit)? limit.split(','): ['',''];
  const limitErrMsg_ = (limitErrMsg)? limitErrMsg: '日付が正しくありません'
  // .sFormaPartsに追加されるスタイル
  const wStyle = (wrapperStyle) ? wrapperStyle : {};
  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
    if (typeof setExtVal === 'function'){
      setExtVal(e.currentTarget.value)
    }
  }
  const handleBlur = (e) => {
    const r = comMod.parseDate(e.currentTarget.value);
    const v = e.currentTarget.value;
    setval(comMod.convHankaku(e.currentTarget.value));
    if (required && !r.result) {
      seterr(true);
      seterrMsg('日付が必要');
    }
    else if (required && !e.currentTarget.value) {
      seterr(true);
      seterrMsg('入力必須項目');
    }
    // 入力必須ではない未入力
    else if (!v && !required){
      setval('0000-00-00');
      seterrMsg('');
      seterr(false);
    }
    else if (r.result) {
      const zp = comMod.zp;
      seterr(false);
      // 0000-00-00を入力すると変な値が帰ってくるので阻止
      if (r.date.y === 1899 && r.date.m == 11 && r.date.d == 30) {
        setval('0000-00-00');
        seterrMsg('');
      }
      else {
        const d = r.date.y + '-' + zp(r.date.m, 2) + '-' + zp(r.date.d, 2);
        setval(d);
        if (limit_[0] && d < limit_[0]){
          seterr(true);
          seterrMsg(limitErrMsg_);
        }
        else if (limit_[1] && d > limit_[1]){
          seterr(true);
          seterrMsg(limitErrMsg_);
        }
        else{
          if (helperTextShort){
            seterrMsg(r.date.wr.s + r.date.wr.y);
          }
          else{
            seterrMsg('西暦' + r.date.y + '年 ' + r.date.wr.full);
          }
        }
      }
    }
    else{
      seterr(true);
      seterrMsg('日付が不正')
    }
  }
  const labelClass = noLabel? classesLc.hideLabel: '';
  return (
    <div className={"sFormaParts volume " + labelClass} style={wStyle} id={id}>
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={cls_}
        name={name}
        value={val}
        err={err}
        errMsg={errMsg}
        label={label}
        required={required} 
        disabled={props.disabled}
      />
    </div>
  )
  
  // }
  // else{
  //   return (
  //     <div className="sFormaParts volume" style={wStyle} id={id}>
  //       <Input
  //         onChange={e => handleChange(e)}
  //         onBlur={e => handleBlur(e)}
  //         cls={cls_}
  //         name={name}
  //         value={val}
  //         err={err}
  //         errMsg={errMsg}
  //         label={label}
  //         required={required} 
  //       />
  //     </div>
  //   )

  // }

  
}

// メールアドレス入力
export const MailInput = (props) => {
  const { name, label, required, def, ...other } = props;
  const def_ = (def) ? def : '';
  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    const mail = e.currentTarget.value;
    const chk = comMod.isMailAddress(mail);
    setval(comMod.convHankaku(e.currentTarget.value));
    if (!mail && required) {
      seterr(true);
      seterrMsg('入力必須項目です。');
    }
    else if (!chk) {
      seterr(true);
      seterrMsg('メールアドレスが不正です');
    }
    else {
      seterr(false);
      seterrMsg('');
    }
  }
  return (
    <div className="sFormaParts volume">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={'tfMiddleXXL'}
        name={name}
        value={val}
        err={err}
        errMsg={errMsg}
        label={label}
        required={required}
      />
    </div>
  )
}

// 電話番号入力
export const PhoneInput = (props) => {
  const { name, label, required, def, ...other } = props;
  const def_ = (def) ? def : '';
  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    let phone = e.currentTarget.value;
    const rt = comMod.formatTelNum(phone);
    if (!phone && required) {
      seterr(true);
      seterrMsg('入力必須項目です。');
    }
    else if (!rt.result) {
      seterr(true);
      seterrMsg('番号が不正です');
    }
    else {
      seterr(false);
      seterrMsg('');
      setval(rt.format);
    }
  }
  // console.log('err, errMsg, required', err, errMsg, required);
  return (
    <div className="sFormaParts volume">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={'tfMiddle'}
        name={name}
        value={val}
        err={err}
        errMsg={errMsg}
        label={label}
        required={required}
      />
    </div>
  )
}

// 教室
// 所属の入力と一緒だけどオプションリストを
// このコンポーネントから作成する予定
export const ClassRoom = (props) => {
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const clSet = new Set();
  users.map((e) => {
    if (e.classroom) clSet.add(e.classroom);
  });
  const options = Array.from(clSet);

  const { def, ...other } = props;
  const def_ = (def) ? def : '';
  const [val, setval] = useState(def_);
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (ev) => {
    const v = comMod.convHankaku(ev.currentTarget.value);
    setval(v);
  }
  return (
    <div className="sFormaParts volume">
      <Autocomplete
        freeSolo
        options={options.map(e => e)}
        value={val}
        renderInput={(params) => (
          <TextField className={classes.tfMiddle}
            {...params}
            label={'単位'}
            name={'classroom'}
            onChange={e => handleChange(e)}
            onBlur={e => handleBlur(e)}
            value={val}
          />
        )}
      />
    </div>
  )
}


// 所属
export const Belongs = (props) => {
  const classes = useStyles();
  const { name, label, options, def, ...other } = props;
  const def_ = (def) ? def : '';
  const [val, setval] = useState(def_);
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  return (
    <div className="sFormaParts volume">
      <Autocomplete
        freeSolo
        options={options.map(e => e)}
        value={val}
        renderInput={(params) => (
          <TextField className={classes.tfMiddleXL}
            {...params}
            label={label} name={name}
            onChange={e => handleChange(e)}
            value={val}
          />
        )}
      />
    </div>
  )
}

export const TestFreeSolo = (props) => {
  return (
    <div style={{ width: 300 }}>
      <Autocomplete
        id="free-solo-demo"
        freeSolo
        options={props.options}
        renderInput={(params) => (
          <TextField {...params} label="freeSolo" margin="normal" />
        )}
      />
    </div>
  )
}

// 他事業所
// 上限管理等で利用する他事業所の情報を入力する
// オートコンプリートとテキストフィールドを提供する
// すでに入力されている他事業所番号は
// テキストフィールドに出力、readonyにする
// 新規の場合はテキストフィールドに番号を入力する
// defは配列で渡される
export const OtherOffice = (props) => {
  const { 
    label, name, labelNo, nameNo, def,disabled, // updateUpperLimitEnable,
    officeNames, setOfficeNames, ndx, // 上位コンポーネントで使うセッターとインデックス
    ...other 
  } = props;
  const def_ = (def) ? def : ['', '',];
  const [val, setval] = useState(def_[0]);
  const [valText, setValText] = useState('');
  const [valErr, setValErr] = useState(false);
  const [valNo, setvalNo] = useState(def_[1]);
  const [valNoErr, setvalNoErr] = useState(false);
  const [valNoText, setvalNoText] = useState('');
  const [valNoDisabled, setvalNoDisabled] = useState(true);
  const service = useSelector(state=>state.service);
  const classes = useStyles();
  // 他事業所のリスト
  const users = useSelector(state => state.users);
  const officeSet = new Set();
  // ユニークな事業所名のリストを作成する
  // サービスを考慮してリスト作成 2021/12/15
  // f.name が undef等の場合、addしない 2022/05/19
  users.filter(e=>e.service===service || service==="").map(e => {
    if (e.etc) {
      if (e.etc.協力事業所) {
        e.etc.協力事業所.map(f => {
          if (f.name) officeSet.add(f.name);
        });
      }
      if (e.etc.管理事業所) {
        e.etc.管理事業所.map(f => {
          if (f.name) officeSet.add(f.name);
        });
      }
    }
  });
  // 登録されている全ての事業所を配列化
  const tmpOffice = [];
  // 管理事業所配列にnullやundefinedがあったらスキップする
  users.map(e => {
    if (e.etc) {
      if (e.etc.協力事業所) {
        e.etc.協力事業所.map(f => {
          if (f.name && f.no) tmpOffice.push({ name: f.name, no: f.no });
        });
      }
      if (e.etc.管理事業所) {
        e.etc.管理事業所.map(f => {
          if (f.name && f.no) tmpOffice.push({ name: f.name, no: f.no });
        });
      }
    }
  })
  // 事業所名リストから事業所番号を付加して{name, no}の配列を作成する
  const officeList = [];
  Array.from(officeSet).map(e => {
    officeList.push(tmpOffice.find(f => f.name === e));
  });
  const handleChange = (e) => {
    setvalNo(e.currentTarget.value);
    const t = officeNames;
    t[ndx] = (e.currentTarget.value);
    setOfficeNames(t);
  }

  // チェンジイベントはliに発生するときとテキストフィールドに発生するとき
  // 両方ある。共通の処理をまとめる
  const numberSet = (v) => {
    const f = officeList.filter(e => e.name === v);
    const num = (f.length) ? f[0].no : '';
    setvalNo(num);  // 取得できた市区町村番号をstateにセット
    // 市区町村番号が取得できたらdisabledにする 
    setvalNoDisabled((num) ? true : false);
    setvalNoErr(false);
    setvalNoText('');
  }

  const handleAcChange = (e) => {
    const value = e.currentTarget.value;
    if (value.match(forbiddenPtn)){
      setValErr(true);
      setValText('使用できない文字です')
    }
    else{
      setValErr(false);
      setValText('');
    }
    setval(value);
    numberSet(value);
  }
  const handleAcBlur = (e) => {
    const value = e.currentTarget.value
    numberSet(value);
  }
  const handleLiChange = (e, v) => {
    numberSet(v);
  }
  const handleTxBlur = (e) => {
    const han = comMod.convHankaku(e.currentTarget.value);
    if (isNaN(han) || han.length != 10) {
      setvalNoErr(true);
      setvalNoText('10桁の数字が必要です。');
    }
    else {
      setvalNoErr(false);
      setvalNoText('');
    }
    setvalNo(han);
  }
  return (<>
    <div className={"sFormaParts otherOffice name "} style={{width: 300}}>
      <Autocomplete
        freeSolo
        options={officeList.map(e => e.name)}
        value={def_[0]}
        onChange={(e, v) => handleLiChange(e, v)}
        disabled={disabled}
        renderInput={(params) => (
          <TextField
            {...params} id='rte99d' label={label} name={name}
            onChange={(e) => handleAcChange(e)}
            disabled={disabled}
            onBlur={(e) => handleAcBlur(e)}
            error={valErr} helperText={valText}
          />
        )}
      />
    </div>
    <div className={'sFormaParts otherOffice no ' + classes.tfMiddle}>
      <TextField
        name={nameNo}
        label={labelNo}
        value={valNo || ''}
        onChange={(e) => handleChange(e)}
        onBlur={e => handleTxBlur(e)}
        onFocus={e=>handleSelectInputAuto(e)}
        disabled={valNoDisabled || disabled}
        error={valNoErr}
        helperText={valNoText}
        required
      />
    </div>
  </>)
}



// 上限管理の配分種別
export const HaibunSyubetu = (props) => {
  const { def, ...other } = props;
  const name = '上限管理配分種別';
  const label = '上限管理配分種別';
  const def_ = (def) ? def : '';

  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    const v = e.currentTarget.value;
    if (!v) {
      seterr(true);
      seterrMsg('選択してください。');
    }
    else {
      seterr(false);
      seterrMsg('');
    }
  }
  const opts = ['自社最大', '最多利用最大', /*'等分'*/];
  return (
    <div className="sFormaParts usertype">
      <SelectGp
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        styleUse='tfMiddleL'
        name={name}
        value={val}
        size={'large'}
        opts={opts}
        err={err}
        errMsg={errMsg}
        disabled={props.disabled}
        label={label}
        required
        hidenull
      />
    </div>
  )
}

// 数値入力全般
export const NumInputGP = (props) => {
  // def:デフォルト値 name: label: upper:上限 lower:下限 
  // cls:useStyleで使われるクラス名。
  const { 
    def, name, label, upper, lower, cls, required, disabled, ...other 
  } = props;
  const def_ = (def) ? def : '';
  const lower_ = (lower) ? lower : 0;
  const upper_ = (upper) ? upper : 0;
  const cls_ = (cls) ? cls : 'tfMiddle';

  const [val, setval] = useState(def_);
  const [err, seterr] = useState(false);
  const [errMsg, seterrMsg] = useState('');
  const handleChange = (e) => {
    setval(e.currentTarget.value);
  }
  const handleBlur = (e) => {
    let han = comMod.convHankaku(e.currentTarget.value, true);
    setval(han);
    if (isNaN(han)) {
      seterr(true);
      seterrMsg('数値を入力してください。');
    }
    else if (!han && required) {
      seterr(true);
      seterrMsg('入力必須項目です。');
    }
    else if (han < lower_) {
      seterr(true);
      seterrMsg('無効な数値です。');
    }
    else if (han > upper_ && upper_) {
      seterr(true);
      seterrMsg('無効な数値です。');
    }
    else {
      seterr(false);
      seterrMsg('');
    }
  }
  return (
    <div className="sFormaParts volume">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={e => handleBlur(e)}
        cls={cls_}
        name={name}
        value={val}
        err={err}
        errMsg={errMsg}
        label={label}
        disabled={disabled}
        required={required}
      />
    </div>
  )
}

// 稼働率計算方法の設定
export const SetOccupancyCalc = (props) => {
  const name = 'configOccupancyRate';
  const label = '稼働率計算方法';
  const size = (props.size) ? props.size : 'large';
  let etc = useSelector(state => state.com.etc);
  etc = (etc) ? etc : {};
  let def = etc[name];
  def = (def === null || def === undefined) ? '' : def;
  const [val, setval] = useState(def);
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const Discription = () => (
    <span className='discription'>
      <span className="main">
        稼働率計算に休業日、休校日を含めるかどうかを設定します。
      </span>
    </span>
  )


  // オプションのリストをステイトから取得
  const opts = [
    '休業日を含めて稼働率計算',
    '休業・休校を含めず稼働率計算'
  ];
  return (
    <>
      <div className={"aFormPartsWrapper occurate " + size}>
        <SelectGp
          onChange={e => handleChange(e)}
          name={name}
          value={val}
          size={size}
          opts={opts}
          disabled={props.disabled}
          label={label}
          nullLabel='休業日を含めず稼働率計算' // 空白文字を選択するときのラベル指定
        />
        <Discription />
      </div>
    </>
  )
}

export const SetUsersSort = (props) => {
  const name = 'setUsersSort';
  const label = 'ユーザー表示並び順';
  const size = (props.size) ? props.size : 'large';
  const { sortOrder, setsortOrder, ...rest } = props;
  const users = useSelector(state=>state.users);
  const classroomSet = new Set();
  users.filter(e=>e.classroom).map(e=>{classroomSet.add(e)});

  // let etc = useSelector(state => state.com.etc);
  // etc = (etc) ? etc : {};
  // let def = etc[name];
  // def = (def === null || def === undefined) ? 0 : def;
  const handleChange = (e) => {
    setsortOrder(e.currentTarget.value)
  }
  const Discription = () => (
    <span className='discription'>
      <span className="main">
        ユーザーの並び順を設定します。設定した並び順はユーザー一覧や各種帳票など色々な場所に反映されます。
      </span>
    </span>
  )
  const opts = [
    { value: 0, label: '変更なし', class: '' },
    { value: 1, label: '学齢順に並べる', class: '' },
    { value: 2, label: '利用開始順に並べる', class: '' },
    { value: 3, label: '所属・学校順に並べる', class: '' },
    { value: 4, label: '50音順に並べる', class: '' },
  ];
  if (Array.from(classroomSet).length > 1){
    opts.push({ value: 5, label: '教室順に並べる', class: '' });
  }
  return (
    <>
      <div className={"aFormPartsWrapper usersort " + size}>
        <SelectGp
          onChange={e => handleChange(e)}
          name={name}
          value={sortOrder}
          size={size}
          opts={opts}
          disabled={props.disabled}
          label={label}
          hidenull
        // nullLabel='学齢順に並べる' // 空白文字を選択するときのラベル指定
        />
        <Discription />
      </div>
    </>
  )
}

export const SetUsersSvcSort = (props) => {
  const name = 'setUsersSvcSort';
  const label = 'サービスの並び順';
  const serviceItems = useSelector(state=>state.serviceItems);
  const size = (props.size) ? props.size : 'large';
  const { sortSvcOrder, setsortSvcOrder, ...rest } = props;
  // let etc = useSelector(state => state.com.etc);
  // etc = (etc) ? etc : {};
  // let def = etc[name];
  // def = (def === null || def === undefined) ? 0 : def;
  if (serviceItems.length <= 1) return null;
  const handleChange = (e) => {
    setsortSvcOrder(e.currentTarget.value)
  }
  const Discription = () => (
    <span className='discription'>
      <span className="main">
        サービスの並び順を設定します。
      </span>
    </span>
  )
  const opts = [
    { value: 0, label: '変更なし', class: '' },
  ];
  serviceItems.map((e, i)=>{
    opts.push({value: i + 1, label: e, class:''});
  });
  return (
    <>
      <div className={"aFormPartsWrapper usersort " + size}>
        <SelectGp
          onChange={e => handleChange(e)}
          name={name}
          value={sortSvcOrder}
          size={size}
          opts={opts}
          disabled={props.disabled}
          label={label}
          hidenull
        // nullLabel='学齢順に並べる' // 空白文字を選択するときのラベル指定
        />
        <Discription />
      </div>
    </>
  )
}



// 送迎先設定グローバル用
// state.config.transferListにdispatchする用
export const TransferListGlobal = (props) => {
  const classes = useStyles();
  const classesLc = useStylesLc();
  // 引数は親コンポーネントで定義されたstate
  const { destList, setDestList, } = props;
  const [newItem, setNewItem] = useState('');
  const [newItemErr, setNewItemErr] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const config = useSelector(state => state.config);
  // setDestList(config.transferList);
  const handleChange = (ev) => {
    setNewItem(ev.target.value);
  }
  const handleBlur = (ev) => {
    setNewItem(comMod.convHankaku(ev.target.value));

  }
  const handeleAddClick = (ev) => {
    // 未入力チェック
    if (!newItem) {
      setNewItemErr(true);
      setNewItemText('未入力です。');
      return false;
    }
    // 重複チェック
    if (destList.indexOf(newItem) > -1) {
      setNewItemErr(true);
      setNewItemText('登録済みです。');
      return false;
    }
    // 使用禁止文字
    if (newItem.match(forbiddenPtn)){
      setNewItemErr(true);
      setNewItemText('使用禁止文字があります。');
      return false;
    }
    setNewItemErr(false);
    setNewItemText('');

    // const t = [...destList];
    // t.push(newItem);
    setDestList([...destList, newItem]);
    setNewItem('');
  }
  const handleDeleteClick = (ev) => {
    const t = [...destList];
    const name = ev.currentTarget.name;
    const i = t.findIndex(e => e === name);
    t.splice(i, 1);
    setDestList(t);
  }

  const destItemsDisp = destList.map((e, i) => {
    let smallText = '';
    // 末尾か先頭に*があったら加算なし送迎
    if (e.match(/^\*|\*$/)){
      smallText = '送迎加算なし'
    }
    return (
      <div className={classesLc.destItem}  key={i}>
        <div className='destItem' key={i}>
          <span>{e}</span>
          <IconButton className={classes.smallIconButton}
            onClick={(ev) => handleDeleteClick(ev)}
            name={e}
          >
            <DeleteIcon />
          </IconButton>
        </div>
        <div className='smallLabel'>{smallText}</div>
      </div>
    )
  });
  
  return (<>
    <div className='cntRow'>
      {destItemsDisp}
    </div>
    <div style={{height: 8}}></div>
    <div className='cntRow'>
      <div className={"destList " + classes.tfMiddleL}>
        <TextGP
          label={'送迎場所'} name={'dest'}
          onChange={(e) => handleChange(e)}
          err={newItemErr}
          onBlur={(e) => handleBlur(e)}
          value={newItem}
          errMsg={newItemText}
        />
      </div>
      <IconButton
        onClick={handeleAddClick}
      >
        <AddCircleIcon color='primary' />
      </IconButton>
    </div>
  </>)
}


// ファイル名プレフィクス
// ダウンロードするファイル名の先頭文字を指定する
export const FilenamePreFix = (props) => {
  const name = 'fprefix';
  const label = 'ファイル先頭文字';
  const size = (props.size) ? props.size : 'large';
  let def = useSelector(state => state.com.fprefix);
  def = (def === null || def === undefined) ? '' : def;
  const [val, setval] = useState(def);
  const [err, setErr] = useState(false);
  const [errText, setErrText] = useState('');

  const handleChange = (ev) => {
    setval(ev.currentTarget.value)
  }
  // バリデーション
  const handleBlur = (ev) => {
    const v = ev.currentTarget.value;
    if (!v) {
      setErr(true);
      setErrText('入力必須項目');
    }
    else if (!v.match(/^[0-9a-zA-Z]*$/)) {
      setErr(true);
      setErrText('半角英数字のみ');

    }
    else if (v.length > 7) {
      setErr(true);
      setErrText('8文字以内');
    }
    else {
      setErr(false);
      setErrText('');
    }
  }
  const Discription = () => (
    <span className='discription'>
      <span className="main">
        帳票などをダウンロードするための事業所ごとのファイル名先頭文字を設定します。2文字から6文字程度の英数字を
        入力します。ダウンロードしたファイルで事業所をわかりやすくするためです。<br />
        例）横浜事業所→ykhm など。
      </span>
    </span>
  )
  return (
    <>
      <div className={"aFormPartsWrapper filenamePreFix " + size}>
        <TextGP
          label={label} name={name}
          onChange={(e) => handleChange(e)}
          err={err}
          onBlur={(e) => handleBlur(e)}
          value={val}
          errMsg={errText}
        />
        <Discription />
      </div>
    </>
  )
}
// ユーザー別スケジュールの設定。
// // 縦型表示にするかどうか
// SetUisCookieChkBox に統合したのでこのコンポーネントはボツ
// 
// export const SetUsersSchViewCookies = (props) => {
//   const dispatch = useDispatch();
//   const ui = 'ui';
//   const {setVirtical} = props;
//   const ck = (comMod.getCookeis(ui))? comMod.getCookeis(ui): '{}';
//   const cUiVals = JSON.parse(ck);
//   if (!cUiVals || !Object.keys(cUiVals).length){
//     cUiVals.usersSchViewVirtical = '0';
//   }
//   if (cUiVals.usersSchViewVirtical === undefined){
//     cUiVals.usersSchViewVirtical = '0';
//   }
//   const usersSchViewVirtical_init = comMod.getUisCookie(comMod.uisCookiePos.usersSchViewVirtical);
//   const [uiVals, setUiVals] = useState(cUiVals);
//   const [formVals, setFormVals] = useState({usersSchViewVirtical: usersSchViewVirtical_init==='1' ?true :false});
//   // クッキーは文字列化して保存
//   // クッキー用のstateの変化を検出してフォームのstateも変更する
//   // store stateにDispatchも行う  
//   useEffect(()=>{
//     // comMod.setCookeis(ui, JSON.stringify(uiVals));
//     const t = {...uiVals};
//     const u = {...formVals};
//     Object.keys(t).map(e=>{
//       u[e] = (t[e] === '1')
//     });
//     setFormVals(u);
//     setVirtical(uiVals.usersSchViewVirtical === '1');
//     // dispatch(Actions.setStore({controleMode:{ui:uiVals}}));
//   }, [uiVals])
//   // チェンジハンドラ
//   // クッキー用のstateをまず更新する。
//   // フォーム用のステイとはuseeffectで更新を行っている
//   // 変則的かも
//   const handleChange = (ev) => {
//     const name = ev.currentTarget.name;
//     const v = (ev.currentTarget.checked)? '1': '0';
//     setUiVals({...uiVals, [name]: v});
//     comMod.setUisCookie(comMod.uisCookiePos.usersSchViewVirtical, v);
//   }
//   const handleClick = () => {
//     dispatch(Actions.setStore({controleMode:{ui:formVals}}));
//     dispatch(Actions.setSnackMsg('設定しました。'));
//   }
//   return(<>
//     <FormControlLabel
//       control={
//         <Checkbox
//           checked={(formVals.usersSchViewVirtical)}
//           onChange={(ev)=>handleChange(ev)}
//           name='usersSchViewVirtical'
//           color="primary"
//         />
//       }
//       label='縦型表示にする'
//     />
//   </>)
// }

// スケジュール削除
export const DeleteScheduleButton = () => {
  const classes = useStylesLc();
  const allState = useSelector(state=>state);
  const {hid, bid, stdDate, schedule} = allState;
  const [removed, setRemoved] = useState(false);
  const [snack, setSnack] = useState({msg:'', severity: ''});
  const [res, setRes] = useState({});
  let didCnt = 0;
  Object.keys(schedule).filter(e=>e.indexOf('UID') === 0).forEach(e=>{
    didCnt += Object.keys(schedule[e]).filter(f=>f.match(didPtn)).length;
    if (Object.keys(schedule[e]).filter(f=>f.match(didPtn)).length){
      console.log(e, didCnt, 'didCnt');
    }
  });
  useEffect(()=>{
    console.log(res, 'DeleteScheduleButton res');
    if (Object.keys(res).length && res.data.result){
      setRemoved(true);
    }
  }, [res]);

  // if (didCnt){
  //   return (<>
  //     <div className={classes.removeSchDisable}>
  //       スケジュールのリセット
  //     </div>
  //     <div className={classes.extraSettingNotice}>
  //       有効なスケジュールが残っているため、スケジュールのリセットはできません。
  //       前月のスケジュール設定を引き継ぎしたいときなどはこちらからリセットが可能です。
  //     </div>
  //   </>)
  // }
  const handleClick = () => {
    deleteSchedule({hid, bid, date:stdDate}, setRes, setSnack);
  }
  const buttonDisable = didCnt > 0;
  return (<>
    <div className={classes.removeCookieRoot}>
      <div className='label'>当月のスケジュールのリセットを行います。</div>
      <div className='button'>
        {removed === false &&
          <Button
            variant='contained'
            color='primary'
            disabled={buttonDisable}
            onClick={handleClick}
          >
            リセットする
          </Button>
        }
        {removed === true &&
          <a href='./'>
            <Button
              variant='contained'
            >
              再起動する
            </Button>
          </a>
        }
      </div>
      
    </div>
    {didCnt > 0 &&
      <div className={classes.extraSettingNotice}>
        有効なスケジュールが残っているため、スケジュールのリセットはできません。
        前月のスケジュール設定を引き継ぎしたいときなどはこちらからリセットが可能です。
      </div>
    }
    {didCnt === 0 &&
      <div className={classes.extraSettingNotice} >
        前月のスケジュール設定を引き継ぎしたいときなどはこちらから当月のスケジュールの
        リセットが可能です。
      </div>
    }
    <SnackMsg {...snack} />
 
  </>)
}


// Cookieリセット。単純にボタンと説明の出力を行う。
export const RemoveCookieAll = () => {
  const dispatch = useDispatch();
  const classes = useStylesLc();
  const c = Cookies.get();
  const l = Object.keys(c).length;
  const [removed, setRemoved] = useState(false);
  const [snack, setSnack] = useState({msg:'', severity: ''});
  const clickHandler = () => {
    comMod.removeCookieAll();
    setSnack({msg: '削除しました。', severity: ''});
    setRemoved(true);
  }
  return (<>
    <div className={classes.removeCookieRoot}>
      <div className='label' >{l}件のCookieの削除を行います。</div>
      <div className='button'>
        {removed === false &&
          <Button
            variant='contained'
            color='primary'
            onClick={clickHandler}
          >
            削除する
          </Button>
        }
        {removed === true &&
          <a href='./'>
            <Button
              variant='contained'
            >
              再起動する
            </Button>
          </a>
        }
      </div>
    </div>
    <div className={classes.extraSettingNotice} >
      ごくまれにCookieが原因でシステムが不安定になることがあります。
      このボタンを押すとCookieが削除されます。
      ブラウザ全体のCookieではなくアルバトロスが使用しているものを削除するので
      他のサイトの閲覧に影響が出ることはありません。
      ボタンを押したあとは再読み込みをして下さい。
    </div>
    <SnackMsg {...snack} />
  </>)  
}

export const SetUiCookies = () => {
  const dispatch = useDispatch();
  const classes = useStylesLc()
  const ui = 'ui';
  const ck = (comMod.getCookeis(ui))? comMod.getCookeis(ui): '{}';
  const cUiVals = JSON.parse(ck);
  if (!cUiVals || !Object.keys(cUiVals).length){
    cUiVals.selectInputAuto = '0';
  }
  if (cUiVals.selectInputAuto === undefined){
    cUiVals.selectInputAuto = '0';
  }
  const [uiVals, setUiVals] = useState(cUiVals);
  const selectInputAuto_init = comMod.getUisCookie(comMod.uisCookiePos.selectInputAuto);
  const [formVals, setFormVals] = useState({selectInputAuto: selectInputAuto_init==='1' ?true :false});
  // クッキーは文字列化して保存
  // クッキー用のstateの変化を検出してフォームのstateも変更する
  // store stateにDispatchも行う
  useEffect(()=>{
    comMod.setCookeis(ui, JSON.stringify(uiVals));
    const t = {...uiVals};
    const u = {...formVals};
    Object.keys(t).map(e=>{
      u[e] = (t[e] === '1')
    });
    setFormVals(u);
    // dispatch(Actions.setStore({controleMode:{ui:uiVals}}));
  }, [uiVals])
  // チェンジハンドラ
  // クッキー用のstateをまず更新する。
  // フォーム用のステイとはuseeffectで更新を行っている
  // 変則的かも
  const handleChange = (ev) => {
    const name = ev.currentTarget.name;
    const v = (ev.currentTarget.checked)? '1': '0';
    setUiVals({...uiVals, [name]: v});
    comMod.setUisCookie(comMod.uisCookiePos.selectInputAuto, v);
  }
  const handleClick = () => {
    dispatch(Actions.setStore({controleMode:{ui:formVals}}));
    dispatch(Actions.setSnackMsg('設定しました。'));
  }
  return(<>
    <div className={classes.setUiCookiesRoot}>
      <div className='chk'>
        <FormControlLabel
          control={
            <Checkbox
              checked={(formVals.selectInputAuto)}
              onChange={(ev)=>handleChange(ev)}
              name='selectInputAuto'
              color="primary"
            />
          }
          label='文字入力時の自動選択'
        />
      </div>
      <div className='button'>
        <Button
          variant='contained'
          color='primary'
          onClick={handleClick}
        >
          設定する
        </Button>
      </div>
    </div>
    <div className={classes.extraSettingNotice}>
      文字入力するとき、通常はクリック後、入力済みの情報を削除してから入力します。
      こちらのオプションを設定すると削除キーなどを押下しなくても情報の入力が
      出来るようになります。
    </div>
  </>)
}

// テンプレートに自動保存するかどうか
// この値はストアに保存せず利用するたびにクッキーから取得する（本当に良いのか？
// 一時的にデベロッパーのみ表示 -> 排除
// 2022/10/17頃 橋本がsetUisCookieに対応
// ext.userTemplateSettingに対応。
export const SetTemplateAutoSave = (props) => {
  const classes = useStylesLc();
  const account = useSelector(state=>state.account);
  // テンプレートの利用方法設定値取得
  const com = useSelector(state=>state.com);
  let userTemplateSetting = parseInt(com?.ext?.userTemplateSetting);
  userTemplateSetting = isNaN(userTemplateSetting)? 0: userTemplateSetting;
  const {did} = props;
  const toDaysDid = comMod.convDid(new Date());
  let saveConditionTxt = '';
  if (userTemplateSetting === -1){
    saveConditionTxt = '保存されません';
  }
  else if (userTemplateSetting === 1 && did <= toDaysDid){
    saveConditionTxt = '保存されません';
  }
  // const permission = comMod.parsePermission(account)[0][0];
  const ui = 'ui';
  const ck = (comMod.getCookeis(ui))? comMod.getCookeis(ui): '{}';
  const cUiVals = JSON.parse(ck);
  if (!cUiVals || !Object.keys(cUiVals).length){
    cUiVals.templateAutoSave = '0';
  }
  if (cUiVals.templateAutoSave === undefined){
    cUiVals.templateAutoSave = '0';
  }
  const templateAutoSave_init = comMod.getUisCookie(comMod.uisCookiePos.templateAutoSave);
  const [chk, setChk] = useState(templateAutoSave_init === '1' ?true :false);
  // useEffect(()=>{
  //   const t = cUiVals;
  //   t.templateAutoSave = (chk)? '1': '0';
  //   comMod.setCookeis(ui, JSON.stringify(t));
  // }, [chk]);
  const handleChange = (ev) => {
    const v = ev.currentTarget.checked;
    setChk(v);
    const cookie_v = ev.target.checked ?1 :0;
    comMod.setUisCookie(comMod.uisCookiePos.templateAutoSave, cookie_v);
  }
  const SaveConditionTxtNode = () => {
    if (chk){
      return(<>
        <span>雛形自動保存</span>
        <span style={{fontSize: '.6rem'}}>{saveConditionTxt}</span>
      </>)
    }
    else{
        return (<span>雛形自動保存</span>) 
    }
  }
  return (
    <div className={classes.setTemplateAutoSave}>
      <FormControlLabel
        control={
          <Checkbox
            checked={chk}
            onChange={ev => handleChange(ev)}
            name='setTemplateAutoSave'
            color="primary"
          />
        }
        label={<SaveConditionTxtNode/>} 
      />
    </div>
  )
}
// このComponentはコール元からデフォルト値を受け取らず自力で
// stateから取得するものとする
// propsにsetMsg setSeverityがあったらすべての要素がfalseになった時点で
// ワーニングを発行する
export const ServiceItems = (props) => {
  const classes = useStylesLc();
  const {setMsg, setSeverity} = props;
  const name = 'serviceItems';
  const def = useSelector(state=>state.serviceItems);
  const services = ['放課後等デイサービス', '児童発達支援'];
  const tmpVal = {};
  services.map(e=>{
    if (def.findIndex(f=>f===e) > -1)  tmpVal[e] = true;
    else tmpVal[e] = false;
  });
  const [val, setVal] = useState(tmpVal);
  const handleChange = (ev) => {
    const trg = ev.currentTarget;
    const t = {...val};
    // nameはxxx-xxxになっているので後ろ側を取得
    const name = trg.name.split('-')[1];
    t[name] = trg.checked;
    setVal(t);
    let chk = false;
    Object.keys(t).map(e=>{
      if (t[e]) chk = true;
    });
    const existSnack = (
      typeof setMsg === 'function' && typeof setSeverity === 'function'
    );
    // すべてがfalseになっているとき
    if (!chk &&  existSnack){
      setSeverity('warning');
      setMsg('すべてのサービスを未設定にすることは出来ません。');
    }
  };
  const chkBoxes = services.map((e, i) => {
    return (
      <FormControlLabel className={classes.checkBoxPadding}
        key={i}
        control={
          <Checkbox
            checked={val[e]}
            onChange={(ev)=>handleChange(ev)}
            name={name + '-' + e}
            color="primary"
          />
        }
        label={e}
      />
    );
  });
  return chkBoxes
}