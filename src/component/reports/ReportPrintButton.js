import React, { useEffect, useState } from 'react';
import { Button, makeStyles } from "@material-ui/core"
import { SelectGp } from "../common/FormPartsCommon";
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from "react-router-dom";
import { findDeepPath, formatDate, parseDate, parsePermission } from '../../commonModule';
import { setStore } from '../../Actions';
import { recentUserStyle, sendPartOfSchedule } from '../../albCommonModule';
import { DateInput } from '../common/StdFormParts';
import { ReportsEsignListButton, ReportsRegisterButtons, ReportsSettingButton } from './ReportsSetting';
import { useLocation } from 'react-router-dom';
import { teal, yellow } from '@material-ui/core/colors';
import StarIcon from '@material-ui/icons/Star';

const useStyles = makeStyles({
  reportPrintRow: {
    maxWidth: 800, height: 64,
    marginBottom: 24,
    display: 'flex',
    margin: '0 auto', padding: '6px 0',
    // '& .label': {paddingLeft: 8, width: 160, marginRight: 4},
    // '& .label': {padding: 8, marginRight: 4},
    '& .label': {paddingLeft: 8, marginRight: 4, display: 'flex', alignItems: 'center'},
    '& .leftContents, .rightContents': {
      display: 'flex', alignItems: 'center',
      '& .options': {
        position: 'absolute',
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', justifyContent: 'center'
      }
    },
    '& .leftContents': {
      flex: '0 0 45%'
    },
    '& .rightContents': {
      flex: '0 0 55%', justifyContent: 'space-between'
    }
  },
  selectWrap: {
    paddingTop: 6, paddingLeft: 12
  },
  reportButtonSelected: {
    width: 160, height: 32, display:'flex', alignItems:'center',
  },
  settingButton: {
    // position: 'absolute', left: '50%', transform: 'translateX(-50%)',
  },
  setDateForm: {
    display:'flex',
    '& .MuiButtonBase-root':{
      height: 32,padding: 8,marginTop: 24,marginLeft:8,
    },
  }
});

const ReportStyleSelect = (props) => {
  const classes = useStyles();
  const { selects, setSelects, seletcName, opts } = props;

  const handleChange = (ev) => {
    const value = ev.target.value;
    setSelects((prevSelects) => ({...prevSelects, [seletcName]: value}));
  }

  return(
    <div className={classes.selectWrap}>
      <SelectGp
        nameJp={seletcName}
        value={selects[seletcName]}
        styleUse='tfMiddleL'
        opts={opts}
        onChange={handleChange}
        hidenull
        noLabel
      />
    </div>
  )
}

const PrintButton = (props) => {
  const classes = useStyles();
  const {setPreview, item} = props;

  const handleClick = () => {
    setPreview(item);
  }

  return(
    <Button className={classes.reportButtonSelected}
      variant='contained'
      color='primary'
      onClick={handleClick}
      disabled={props.disabled}
    >
      印刷用ページへ
    </Button>
  )
}

const SettingButton = (props) => {
  const classes = useStyles();
  const {settingItem} = props;

  return(
    <div className={classes.settingButton} style={{width: 78}}>
      <ReportsSettingButton settingItem={settingItem} />
    </div>
  )
}

const RegisterButton = (props) => {
  const classes = useStyles();
  const {registerItem} = props;

  return(
    <div className={classes.settingButton} style={{width: 78}}>
      <ReportsRegisterButtons registerItem={registerItem} />
    </div>
  )
}

const EsignListButton = (props) => {
  const com = useSelector(state=>state.com);
  const classes = useStyles();
  const {esignListPath} = props;

  // デバッグ用にパーミッションで非表示
  const account = useSelector(state=>state.account);
  const permission = parsePermission(account)[0][0];
  // if(permission < 100) return null;

  // 電子サイン設定が無効の場合は非表示
  const eSignSetting = com?.ext?.reportsSetting?.teikyouJisseki?.parentConfirmation?.eSign ?? com?.etc?.configReports?.teikyouJisseki?.parentConfirmation?.eSign ?? false;
  if(!eSignSetting) return null;
  return(
    <div className={classes.settingButton} style={{width: 128}}>
      <ReportsEsignListButton esignListPath={esignListPath} />
    </div>
  )
}

// このコンポーネントでは代理受領通知の日付の利用者負担額一覧の日付を
// 設定する
// ->変更 ボタン押下でDispatchも行う。
const SetReportDate = (props) => {
  // itemは今のところ代理受領通知日、利用者負担額一覧発行日も追加予定
  const classes = useStyles();
  const stdDate = useSelector(state=>state.stdDate);
  const {formChange, setFormChange, item, setmsg, setReportDateDt} = props;
  const reportsSettingDate = localStorage.getItem("reportsSettingDate")
    ?JSON.parse(localStorage.getItem("reportsSettingDate"))
    :{};
  const tDate = parseDate(stdDate).date.dt;
  let nDate;
  if (item === '代理受領通知日'){
    // 代理受領通知日未設定時の初期値。基準日翌々月の15日
    nDate = new Date(tDate.getFullYear(), tDate.getMonth() + 2, 15);
  }else {
    // その他は今日の日付
    nDate = new Date();
  }
  const jtInit = formatDate(nDate, 'YYYY-MM-DD');
  const jtDef = reportsSettingDate[item] ?? jtInit;

  useEffect(() => {
    // 帳票日付設定の初期値をセット
    setReportDateDt(prevReportDateDt => ({...prevReportDateDt, [item]: jtDef}))
  }, []);

  const handleClick = () => {
    /**
     * reportsSettingDate: {
     *  "請求書受領書": "yyyy-mm-dd",
     *  "代理受領通知日": "yyyy-mm-dd",
     *  [item]: "yyyy-mm-dd"
     * }
     */
    const repotDate = document.querySelector(`#${item} [name=repotDate]`).value;
    reportsSettingDate[item] = repotDate;
    setReportDateDt(prevReportDateDt => ({...prevReportDateDt, [item]: repotDate}));
    localStorage.setItem("reportsSettingDate", JSON.stringify(reportsSettingDate));
    setmsg("日付を登録しました。");
  }
  // フォームの更新検出用
  const handleChange = () => {
    setFormChange({...formChange, [item]: true});
  };
  const wrapperStyle = {paddingLeft: 0, paddingRight: 0}
  return (
    <form
      id={item} className={classes.setDateForm}
      onChange={handleChange}
    >
      <DateInput 
        name='repotDate' 
        label={'日付設定'}
        required
        def = {jtDef}
        wrapperStyle={wrapperStyle}
        cls='tfMiddle'
      />
      <Button 
        variant='contained'
        onClick={handleClick}
      >
        登録
      </Button>
    </form>
  )
}

// /**
//  * 
//  * @param {*} props 
//  * @returns 
//  */
export const ReportPrintButton = (props) => {
  const classes  = useStyles();
  const {filter} = useParams();
  const location = useLocation();
  const searchDt = (decodeURIComponent(location.search ?? "")).replace("?", "").split("&").reduce((dt, x) => {
    const [key, value] = x.split("=");
    dt[key] = value;
    return dt;
  }, {});
  const {
    // 全般
    selects, setSelects, setPreview, label, setReportDateDt, reportDateDt,
    // フィルター関係
    isFilterPermission, permission, permissionFilting,
    isFilterService, service, serviceFilterList=[],
    // 様式選択用
    seletcName, opts=[], reportDateItem,
    // 印刷プレビューアイテム
    previewItem,
    // 設定ボタン関係
    settingItem,
    // 登録関係
    registerItem,
    // 署名リスト関係
    esignListPath,
    // 変更検出用
    formChange, setFormChange,
    // スナックメッセージ関係
    setmsg, setseverity,
    // 特殊な場合用
    specialComponent,
    filterParams,
    notAllowBiilingDt
  } = props;

  // パーミッションによるフィルター
  if(isFilterPermission && permission < permissionFilting) return null;
  // サービスによるフィルター（相談支援など）
  if(isFilterService && serviceFilterList.includes(service)) return null;
  // urlパラメータによるフィルター
  if(filter && !filterParams.includes(filter)) return null;
  // 2024年版未対応の帳票は非表示
  if(notAllowBiilingDt) return null;

  const styleSelectProps = {selects, setSelects, seletcName, opts};
  const printButtonProps = {setPreview, item: previewItem, disabled: props.disabled};
  const reportDateProps = {item: reportDateItem, formChange, setFormChange, setmsg, setseverity, setReportDateDt, reportDateDt}
  return(
    <div className={classes.reportPrintRow}>
      <div className='leftContents'>
        <div className='label'>
          {label}
          {searchDt.highlight===label &&<StarIcon style={{color: yellow[800], marginLeft: 4}}/>}
        </div>
        {opts.length ?<ReportStyleSelect {...styleSelectProps} /> :null}
      </div>
      <div className='rightContents'>
        <div style={{position: 'relative'}}>
          <PrintButton {...printButtonProps} />
          <div className='options'>
            {esignListPath ?<EsignListButton esignListPath={esignListPath} /> :null}
            {registerItem ?<RegisterButton registerItem={registerItem} /> :null}
            {settingItem ?<SettingButton settingItem={settingItem} /> :null}
          </div>
        </div>
        {specialComponent ?specialComponent :null}
        {reportDateItem ?<SetReportDate {...reportDateProps} /> :null}
      </div>
    </div>
  )
}