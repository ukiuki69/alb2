import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import Delete from '@material-ui/icons/Delete';
import { useDispatch, useSelector } from 'react-redux';
import * as Actions from '../../Actions';
import * as comMod from '../../commonModule';
import { univApiCall } from '../../albCommonModule';
import { CheckBrunchUpdate } from '../common/CheckProgress';
import * as mui from '../common/materialUi';
import SnackMsg from '../common/SnackMsg';
import * as sfp from '../common/StdFormParts';
import { PermissionDenied, Saikouchiku } from '../common/commonParts';
import { SelectGp } from '../common/FormPartsCommon';
import { BankInfoFormsParts } from '../common/BankInfoFormsParts';
import { Links, useSettingStyles } from './settingCommon';

export const StandardSettings = () => {
  const dispatch = useDispatch();
  const classes = useSettingStyles();
  const com = useSelector(state=>state.com);
  const bid = useSelector(state => state.bid);
  const hid = useSelector(state => state.hid);
  const stdDate = useSelector(state => state.stdDate);
  const account = useSelector(state=>state.account);
  const permission = comMod.parsePermission(account)[0][0];

  // スナックバー用
  const [snackMsg, setSnackMsg] = useState('');
  const [severity, setSeverity] = useState('');
  // データ維持のみ
  const [dataKeepOnly, setDataKeepOnly] = useState(com?.ext?.dataKeepOnly || com?.etc?.dataKeepOnly || '');
  // 設定済み口座情報用
  let bi = comMod.fdp(com, 'etc.bank_info', {});
  // 収納口座情報入力欄表示
  const [displayBankInfo, setDisplayBankInfo] = useState(()=>{
    let cnt = 0;
    Object.keys(bi).forEach(e=>{
      if (bi[e])  cnt++;
    });
    return (cnt > 1)? true: false;
  });

  // 銀行口座項目を配列にしておく
  const bankInfoNames = [
    '口座名義人', '口座番号', '口振初回', '店舗番号', 
    '金融機関番号', '預金種目', '委託者番号',
  ]

  // 銀行口座項目ステイトに書き込む初期値
  const biIni = {};
  bankInfoNames.forEach(e=>{biIni[e] = ''});
  const bankInfo = (!Object.keys(bi).length || !bi)? biIni: bi;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formId = '#f38fht '
    const inputs = document.querySelectorAll(formId + 'input');
    const selects = document.querySelectorAll(formId + 'select');
    const formDt = comMod.getFormDatas([inputs, selects], true, true);

    // データ維持のみが設定されたとき、sendcomextを使って送信
    if (formDt.dataKeepOnly === '1') {
      const comExt = com.ext ? { ...com.ext } : {};
      comExt.dataKeepOnly = '1';
      const sendComExtParams = {
        a: "sendComExt",
        hid,
        bid,
        ext: JSON.stringify(comExt)
      };
      const res = await univApiCall(sendComExtParams, 'E_SENDCOMEXT');
      if (res?.data?.result) {
        setSnackMsg('データ維持オプションを送信しました');
        setSeverity('success');
      } else {
        setSnackMsg('送信に失敗しました');
        setSeverity('error');
      }
      return;
    }

    formDt.bid = bid;
    formDt.hid = hid;
    formDt.kanri = formDt.kanriL + ' ' + formDt.kanriF;
    console.log('formDt', formDt);
    // エラーがないか helperテキストエラーのセレクタを定義
    const errOccured = document.querySelectorAll(
      formId + '.MuiFormHelperText-root.Mui-error'
    );
    if (errOccured.length){
      console.log(errOccured);
      setSnackMsg('入力内容を確認してください。');
      setSeverity('warning');
      return false;
    }
    // bankinfo を作成
    const bank_info = {};
    const bank_infoChk = [];
    bankInfoNames.forEach(e=>{
      bank_info[e] = formDt[e];
      delete formDt[e];
      if (bank_info[e]) bank_infoChk.push(1);
    });
    const biLength = bank_infoChk.length;
    if (biLength !== 0 && biLength !== 1 && biLength !== 6){
      setSnackMsg('口座情報が不完全です。');
      setSeverity('warning');
      return false;
    }
    // etcに口座情報を追加
    const comEtc = com.etc? com.etc: {};
    comEtc.bank_info = bank_info;

    //適正請求書発行事業所番号 23/09/28橋本
    const tekiseiJino = formDt.tekiseiJino;
    if(tekiseiJino){
      comEtc.tekiseiJino = tekiseiJino.includes("T") ?tekiseiJino :"T" + tekiseiJino;
      delete formDt.tekiseiJino
    }
    // データ維持のみ
    if (formDt.dataKeepOnly){
      comEtc.dataKeepOnly = formDt.dataKeepOnly
    }
    else if (comEtc.dataKeepOnly){
      delete comEtc.dataKeepOnly;
    }
    // 送信パラメータ
    const sendPrms = {
      ...formDt, hid, bid, date: stdDate,
      etc: comEtc, addiction: com.addiction,
    };
    dispatch(Actions.sendBrunch(sendPrms));
  }

  const keyHandler = (e) =>{
    if (e.which === 13 && e.shiftKey) {
      handleSubmit(e);
      return;
    }
    if (e.which === 13) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  const cancelSubmit = (e) => {
    console.log('canceled.');
    dispatch(Actions.resetStore());
  }

  const kNameProps = {
    nameLname: 'kanriL',
    nameFname: 'kanriF',
    labelLname: '管理者 姓',
    labelFname: '管理者 名前',
    kana: false,
    required: true,
    def: com.kanri,
  }
  const defPostal = isNaN(com.postal) 
    ? com.postal : com.postal.substr(0, 3) + '-' + com.postal.substr(3, 4);
  const paProps = {
    defPostal: defPostal,
    defAddr1: com.city,
    defAddr2: com.address,
    required: true,
  }
  const telProps = { 
    name: 'tel',
    label: '電話番号',
    required: true,
    def: com.tel,
  };
  const faxProps = {
    name: 'fax',
    label: 'FAX番号',
    required: false,
    def: com.fax,
  };

  if (permission < 90) return <PermissionDenied marginTop='120' />

  return (<>
    <Links />
    <div className="AppPage setting">
      <CheckBrunchUpdate inline />
      <form id='f38fht' onKeyPress={(e) => keyHandler(e)}>
        <sfp.JiNumber def={com.jino} />
        <sfp.Bname def={com.bname} />
        <sfp.Sbname def={com.sbname} />
        <div className='cntRow'>
          <sfp.NameInput {...kNameProps} />
        </div>
        <sfp.PostalAndAddress {...paProps} />
        <div className='cntRow'>
          <sfp.PhoneInput {...telProps} />
          <sfp.PhoneInput {...faxProps} />
        </div>
        <sfp.TekiseiJiNumber def={com?.etc?.tekiseiJino} stdDate={stdDate}/>
        <div className={classes.bankInfoTitle}
          onClick={()=>{
            setDisplayBankInfo(true);
          }}
        >
          {displayBankInfo === true &&
            <span>
              {'収納口座情報'}
            </span>
          }
          {displayBankInfo === false &&
            <span>
              {'収納口座情報を入力する'}
            </span>
          }
        </div>
        {displayBankInfo === true && <>
          <div className='cntRow'>
            <BankInfoFormsParts bankInfo={bankInfo} thisUser={null} />
          </div>
          <div className={classes.bancInfoDelete}>
            <Button 
              startIcon={<Delete/>}
              onClick={()=>{setDisplayBankInfo(false)}}
              tabIndex='-1'
            >
              口座情報を削除する
            </Button>
          </div>
        </>}
        <div className={classes.spacer}></div>
        <div className='cntRow'>
          <sfp.FilenamePreFix />
        </div>
        {permission === 100 &&
          <SelectGp
            nameJp='dataKeepOnly'
            value={dataKeepOnly}
            size='large'
            label='データ維持のみ'
            onChange={(ev)=>setDataKeepOnly(ev.target.value)}
            opts={[{value: '1', label: '設定'}]}
          />
        }
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
      <div style={{height: 24}}></div>
      {permission === 100 &&
        <Saikouchiku />
      }
    </div>
    <SnackMsg msg={snackMsg} severity={severity} setmsg={setSnackMsg}/>
  </>);
};

export default StandardSettings;
