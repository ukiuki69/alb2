import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import { teal, grey } from '@material-ui/core/colors';
import { TextGP, SelectGp } from './FormPartsCommon'; // 必須コンポーネントのインポート
import { convHankaku, convHiraToKataAndChk, forbiddenPtn, zp } from '../../commonModule'; // 必要なパターンのインポート
import { useSelector } from 'react-redux';

const useStylesLc = makeStyles({
  nameInput: {
    display: 'flex',
    flexWrap: 'wrap',
    width: 280,
    '& .nameCnt': {
      width: '100%',
      textAlign: 'center',
      paddingBottom: 4,
      '& .l': { fontSize: '.7rem', color: teal[800] },
      '& .MuiIconButton-root': { padding: 4 },
    },
  },
  checkBoxPadding: { paddingLeft: 8 },
  userInfo: {
    display: 'flex',
    justifyContent: 'center',
    padding: '8px 0 16px',
    width: '100%',
    alignItems: 'end',
    color: teal[800],
    '& > *': { padding: '0 8px' },
    '& .s': { fontSize: '.8rem' },
    '& .m': { fontSize: '1.2rem' },
  },
  extraSettingNotice: { padding: '8px 0', lineHeight: '1.5rem' },
});

// ユーザーの口座情報用に作ったが法人の収納口座にも適用する
// 法人口座の場合はthisUserをnull指定する
// 法人口座モードのときはrequiredを設定しない
export const BankInfoFormsParts = (props) => {
  const classes = useStylesLc();
  const {bankInfo, thisUser} = props;
  const [val, setval] = useState(bankInfo);
  const [gotFocus, setGotFocus] = useState('');
  const [buttonsDisp, setButtonsDisp] = useState('');
  const bankNames = useSelector(s=>s.com?.ext?.bankNames)
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
  useEffect(()=>{
    if (gotFocus === '金融機関番号') setButtonsDisp('金融機関番号')
    if (gotFocus === '店舗番号') setButtonsDisp('店舗番号')
  }, [gotFocus]);
  // 金融機関名と支店名を取得する
  useEffect(() => {
    let isMounted = true; // マウント状態を追跡するフラグ
  
    const nameIsReady = (val.金融機関番号 && bankNames?.[val.金融機関番号] && !err.金融機関番号);
    const t = { ...errMsg };
    if (nameIsReady) {
      t.金融機関番号 = bankNames[val.金融機関番号].name || '';
      if (isMounted) setErrMsg(t); // マウントされている場合のみ更新
    }
    const branchIsReady = nameIsReady && val.店舗番号 && bankNames[val.金融機関番号]?.[val.店舗番号] && !err.店舗番号;
    if (branchIsReady) {
      t.店舗番号 = bankNames[val.金融機関番号][val.店舗番号].name || '';
      if (isMounted) setErrMsg(t); // マウントされている場合のみ更新
    }
  
    return () => {
      isMounted = false; // クリーンアップ時にフラグを解除
    };
  }, [val]);
  

  const handleChange = (e) => {
    const target = e.currentTarget;
    const t = {...val};
    t[target.name] = target.value;
    setval(t);
  }

  const handleBlur = (e, prmsTarget) => {
    e.persist();
    const target = prmsTarget? prmsTarget: e.currentTarget;
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
      const k = convHiraToKataAndChk(value);
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
    let h = convHankaku(value);
    // 口座名義人: "カワハラカズヒサ" 口座番号: "3582669" 口振初回: "1" 店舗番号: "480"
    // 金融機関番号: "0005" 預金種目: "普通" 顧客コード: "0000010001"
    const keta = {
      口座番号: 7, 店舗番号: 3, 金融機関番号: 4, 顧客コード: 10, 委託者番号: 10
    };
    if (name === '顧客コード' || name === '委託者番号'){
      h = zp(h, keta[name]);
      const t = {...val};
      t[name] = h;
      setval(t);
    }
    if (name === '口座番号' && h.length === 6){
      h = zp(h, keta[name]);
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
      if (name !== '金融機関番号' && name !== '店舗番号'){
        u[name] = '';
      }
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
    setGotFocus(name);
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
  
  const BankButtons = () => {
    if (buttonsDisp !== '金融機関番号') return null;
    const nextElm = document.querySelector('form input[name=店舗番号]')
    return (
      <div style={{width: '100%'}}>
        {Object.keys(bankNames || {}).filter(e => !isNaN(e)).map(bankCode => {
          return (
            <Button
              key={bankCode} color='primary'
              onClick={() => {
                setval((prev) => {
                  const newState = { ...prev, 金融機関番号: bankCode, 店舗番号: '' };
                  return newState;
                });
                setTimeout(() => {
                  setButtonsDisp('');
                  nextElm.focus(); 
                }, 100); // 状態更新後にボタンを非表示にする
              }}
            >
              {bankNames[bankCode].name === '不明' ? bankCode : bankNames[bankCode].name}
            </Button>
          );
        })}
      </div>
    );
  };
  const BranchButtons = () => {
    if (buttonsDisp !== '店舗番号') return null;
    const bankCode = val.金融機関番号;
    const nextElm = document.querySelector('form select[name=預金種目]')

    return (
      <div style={{width: '100%'}}>
        {Object.keys(bankNames?.[bankCode] || {}).filter(e => !isNaN(e)).map(branchCode => {
          return (
            <Button
              key={branchCode}  color='secondaryelap'
              onClick={() => {
                setval((prev) => {
                  const newState = { ...prev, 店舗番号: branchCode };
                  return newState;
                });
                setTimeout(() => {
                  setButtonsDisp('');
                  nextElm.focus();
                }, 100); // 状態更新後にボタンを非表示にする
              }}
            >
              {bankNames[bankCode][branchCode].name === '不明' ? branchCode : bankNames[bankCode][branchCode].name}
            </Button>
          );
        })}
      </div>
    );
  }
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
        onBlur={(e) => {
          const target = e.target; // 必要な値を保存
          setTimeout(() => {
            handleBlur(e, target); // 保存した値を渡す
          }, 200);
        }}
        cls={'tfMiddle'}
        name={'金融機関番号'}
        value={val.金融機関番号}
        size={'large'}
        err={err.金融機関番号}
        errMsg={errMsg.金融機関番号}
        label={'金融機関番号'}
        onFocus={handeleFocus}
        required={required} bankInfo
      />
    </div>
    <div className="sFormaParts ">
      <TextGP
        onChange={e => handleChange(e)}
        onBlur={(e) => {
          const { name, value } = e.target; // 必要な値を保存
          setTimeout(() => {
            handleBlur(e, name, value); // 保存した値を渡す
          }, 200);
        }}
        cls={'tfMiddle'}
        name={'店舗番号'}
        value={val.店舗番号}
        size={'large'}
        err={err.店舗番号}
        errMsg={errMsg.店舗番号}
        label={'店舗番号'}
        onFocus={handeleFocus}
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

    <BankButtons/>
    <BranchButtons/>

  </>)

}
