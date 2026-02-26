import { Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, makeStyles } from "@material-ui/core";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { brtoLf, getLodingStatus, lfToBr } from "../../commonModule";
import { LoadingSpinner } from "../common/commonParts";
import { CntbkCancelButton, CntbkSendButton } from "../ContactBook/CntbkCommon";
import { HOHOU } from '../../modules/contants';
import { univApiCall } from '../../albCommonModule';
import { setSnackMsg, setStore } from "../../Actions";
import SnackMsg from "../common/SnackMsg";
import { teal } from "@material-ui/core/colors";
import { DailyReportLinksTab } from "./DailyReportCommon";
import { AlbHMuiTextField, AlbHMuiTextField2 } from "../common/HashimotoComponents";
import { useGetHeaderHeight } from "../common/Header";

const SIDEBAR_WIDTH = 61.25;

// 警告用最低送迎時間の初期値
export const MINTRANSFERTIME_INIT = "5";

const useStyles = makeStyles({
  AppPage: {
    width: '95vw',
    margin: `${82+32}px auto`,
    paddingBottom: 80,
    "@media (min-width: 1080px)": {
      maxWidth: 640 + SIDEBAR_WIDTH,
      paddingLeft: SIDEBAR_WIDTH,
    },
  },
  settingTitle: {
    width: '100%',
    padding: '12px 16px 8px', marginBottom: 8,
    borderBottom: `1px solid ${teal[800]}`,
    backgroundColor: teal[50]
  },
  formParts: {
    marginBottom: 16,
    '& .content': {
      marginTop: 16,
      '& .subTitle': {
        paddingLeft: 16
      }
    }
  },
  buttons: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    textAlign: 'end',
    paddingBottom: 16,
    boxSizing: 'border-box',
    "@media (min-width: 1080px)": {
      left: '50%',
      transform: 'translateX(-50%)',
      maxWidth: 640 + SIDEBAR_WIDTH,
      paddingLeft: SIDEBAR_WIDTH + 16,
      '& .sendButton': {
        marginLeft: 12
      }
    },
    '& .sendButton': {
      marginLeft: 8
    }
  },
  TemplateTextField: {
    '&:not(:last-child)': {
      marginBottom: 16
    } 
  }
});

const SettingTitle = (props) => {
  const classes = useStyles();
  const {title=""} = props;

  return(
    <div className={classes.settingTitle}>
      {title}
    </div>
  )
}

const DailyReportSetingCheckbox = (props) => {
  const com = useSelector(state => state.com);
  const schDailyReportSetting = com?.ext?.schDailyReportSetting ?? {};
  const {label, dtKey, reset} = props;
  const [checked, setChecked] = useState(schDailyReportSetting[dtKey] ?? true);

  useEffect(() => {
    setChecked(schDailyReportSetting[dtKey] ?? true);
  }, [reset]);

  const handleChange = (e) => {
    setChecked(e.target.checked);
  }

  return(
    <FormControlLabel
      control={
        <Checkbox
          color="primary"
          checked={checked}
          onChange={handleChange}
          name={dtKey}
        />
      }
      label={label}
      style={{margin: 4}}
    />
  )
}

const DailyReportSetingSelect = (props) => {
  const com = useSelector(state => state.com);
  const schDailyReportSetting = com?.ext?.schDailyReportSetting ?? {};
  const {label, dtKey, items=[], displayNames=[], reset, width, style, ...selectProps} = props;
  const [value, setValue] = useState(schDailyReportSetting?.[dtKey] ?? "時間");

  useEffect(() => {
    setValue(schDailyReportSetting[dtKey] ?? "時間");
  }, [reset]);

  const handleChange = (e) => {
    setValue(e.target.value);
  }

  const menuItems = items.map((item, i) => (
    <MenuItem key={dtKey+item} value={item}>{displayNames[i] ?? item}</MenuItem>
  ));

  console.log("value", value);

  return(
    <FormControl style={{margin: '-8px 16px 0'}}>
      <InputLabel>{label}</InputLabel>
      <Select
        name={dtKey}
        value={value}
        onChange={handleChange}
        style={{width: width, ...style}}
        {...selectProps}
      >
        {menuItems}
      </Select>
    </FormControl>
  )
}

const DailyReportSetingTextField = (props) => {
  const com = useSelector(state => state.com);
  const schDailyReportSetting = com?.ext?.schDailyReportSetting ?? {};
  const {label, dtKey, reset, initValue=""} = props;
  const [value, setValue] = useState(schDailyReportSetting?.[dtKey] ?? initValue);

  useEffect(() => {
    setValue(schDailyReportSetting?.[dtKey] ?? initValue);
  }, [reset]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    if(!/^\d+$/.test(newValue)) return;
    setValue(newValue);
  }

  return(
    <div style={{margin: 4, width: 208, padding: '0 8px'}}>
      <AlbHMuiTextField2
        label={label} name={dtKey}
        value={value}
        onChange={handleChange}
      />
    </div>
  )
}

const DisplayItemSetting = (props) => {
  const classes = useStyles();
  const {reset} = props;
  
  const commonProps = {reset};
  return(
    <div className={classes.formParts}>
      <SettingTitle title="日報に表示する項目" />
      <div className="content">
        <div className="subTitle">迎え</div>
        <DailyReportSetingCheckbox label="場所（お迎え場所）" dtKey="pickupLocation" {...commonProps} />
        <DailyReportSetingCheckbox label="車両" dtKey="pickupCar" {...commonProps} />
        <DailyReportSetingCheckbox label="担当者" dtKey="pickupStaff" {...commonProps} />
        <DailyReportSetingCheckbox label="時間（お迎え時間）" dtKey="pickup" {...commonProps} />
        <DailyReportSetingCheckbox label="開始時間（サービス開始）" dtKey="start" {...commonProps} />
      </div>
      <div className="content">
        <div className="subTitle">送り</div>
        <DailyReportSetingCheckbox label="場所（お送り場所）" dtKey="dropoffLocation" {...commonProps} />
        <DailyReportSetingCheckbox label="車両" dtKey="dropoffCar" {...commonProps} />
        <DailyReportSetingCheckbox label="担当者" dtKey="dropoffStaff" {...commonProps} />
        <DailyReportSetingCheckbox label="時間（送り届け時間）" dtKey="dropoff" {...commonProps} />
        <DailyReportSetingCheckbox label="終了時間（サービス終了）" dtKey="end" {...commonProps} />
      </div>
      <div className="content">
        <div className="subTitle">活動・記録</div>
        <DailyReportSetingCheckbox label="活動内容" dtKey="activities" {...commonProps} />
        <DailyReportSetingCheckbox label="記録" dtKey="notice" {...commonProps} />
      </div>
      <div className="content">
        <div className="subTitle">バイタル</div>
        <DailyReportSetingCheckbox label="体温" dtKey="vital" {...commonProps} />
        <DailyReportSetingCheckbox label="血圧・脈拍" dtKey="bloods" {...commonProps} />
        <DailyReportSetingCheckbox label="排泄" dtKey="excretion" {...commonProps} />
        <DailyReportSetingCheckbox label="血中酸素濃度" dtKey="spo2" {...commonProps} />
        <DailyReportSetingCheckbox label="食事" dtKey="meal" {...commonProps} />
        <DailyReportSetingCheckbox label="服薬" dtKey="medication" {...commonProps} />
        <DailyReportSetingSelect label="睡眠" dtKey="sleep" items={["非表示", "時間", "就寝・起床"]} width="112px" {...commonProps} />
      </div>
    </div>
  )
}

const BasisSetting = (props) => {
  const classes = useStyles();
  const {reset} = props;

  const commonProps = {reset};
  return(
    <div className={classes.formParts}>
      <SettingTitle title="基本設定" />
      <DailyReportSetingCheckbox label="開始時間を送迎時間として扱う" dtKey="letStartBePickup" {...commonProps} />
      <DailyReportSetingTextField
        label="警告用最低送迎時間（分）" dtKey="minTransferTime" initValue={MINTRANSFERTIME_INIT}
        {...commonProps}
      />
    </div>
  )
}

const SyncSetting = (props) => {
  const classes = useStyles();
  const {reset} = props;
  const com = useSelector(state => state.com);
  const schDailyReportSetting = com?.ext?.schDailyReportSetting ?? {};
  const [value, setValue] = useState(schDailyReportSetting?.sync==="check" ?"auto" :schDailyReportSetting?.sync ?? "auto");
  const [syncJikanKubun, setSyncJikanKubun] = useState(schDailyReportSetting?.syncJikanKubun ?? false);
  const [syncEnchouShien, setSyncEnchouShien] = useState(schDailyReportSetting?.syncEnchouShien ?? false);

  useEffect(() => {
    setValue(schDailyReportSetting?.sync==="check" ?"auto" :schDailyReportSetting?.sync ?? "auto");
  }, [reset]);

  const handleChange = (e) => {
    setValue(e.target.value);
  }

  const service = useSelector(state => state.service);
  const autoSetting = com?.addiction?.[service]?.時間区分延長支援自動設定;
  return(
    <div className={classes.formParts}>
      <SettingTitle title="同期設定" />
      <div style={{margin: 4, padding: 9}}>
        <FormControl style={{width: 208}}>
          <InputLabel id="sync-sch-dailyReport">予定実績同期設定</InputLabel>
          <Select
            labelId="sync-sch-dailyReport"
            value={value}
            onChange={handleChange}
            name="sync"
          >
            <MenuItem value="auto">自動で同期を行う</MenuItem>
            <MenuItem value="no">同期を行わない</MenuItem>
          </Select>
        </FormControl>
        <div style={{marginTop: '16px'}}>
          {(parseInt(autoSetting) >= 1) &&<FormControlLabel
            control={<Checkbox
              checked={syncJikanKubun} onChange={(e) => setSyncJikanKubun(e.target.checked)} 
              name="syncJikanKubun"
              color="primary"
            />}
            label="時間区分も同期"
          />}
          {(parseInt(autoSetting) >= 2) &&<FormControlLabel
            control={<Checkbox
              checked={syncEnchouShien} onChange={(e) => setSyncEnchouShien(e.target.checked)}
              name="syncEnchouShien"
              color="primary"
            />}
            label="延長支援も同期"
          />}
        </div>
      </div>
    </div>
  )
}


const TemplateTextField = (props) => {
  const classes = useStyles();
  const com = useSelector(state => state.com);
  const dailyReportDefaultTemplate = useSelector(state => state.dailyReportDefaultTemplate);
  const {label, dtKey} = props;
  const [value, setValue] = useState(brtoLf(com?.ext?.dailyReportTemplate?.[dtKey] ?? ""));

  const handleFocus = (e) => {
    const val = e.target.value;
    if(val) return;
    const initValue = dailyReportDefaultTemplate?.[dtKey] ?? "";
    setValue(initValue);
  }

  const handleChange = (e) => {
    const val = e.target.value;
    setValue(val);
  }

  return(
    <div className={classes.TemplateTextField}>
      <AlbHMuiTextField
        id={dtKey}
        label={label}
        value={value}
        onFocus={handleFocus}
        onChange={handleChange}
        variant="outlined"
        multiline
        minRows="3" rows="3"
        width="100%"
      />
    </div>
  )
}

const LogTemplateSetting = () => {
  const stdDate = useSelector(state => state.stdDate);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const classes = useStyles();

  const isHohou = service===HOHOU || (!service && serviceItems.includes(HOHOU));
  const isAfter202511 = stdDate >= '2025-11-01';
  return(
    <div className={classes.formParts}>
      <SettingTitle title="記録ひな形設定" />
      <div style={{margin: 4, padding: 9}}>
        <TemplateTextField label="事業所全体の記録" dtKey="officeNotice" />
        <TemplateTextField label="法定研修記録" dtKey="officeTrainingNotice" />
        <TemplateTextField label="利用者ごとの記録" dtKey="userNotice" />
        {(isHohou && isAfter202511) &&<TemplateTextField label="保育所等訪問支援の記録" dtKey="userHohouNotice" />}
        <TemplateTextField label="欠席時対応加算の記録" dtKey="kesseki" />
        <TemplateTextField label="家族支援加算の記録" dtKey="kazokuShien" />
        <TemplateTextField label="子育てサポート加算の記録" dtKey="kosodate" />
        <TemplateTextField label="関係機関連携加算の記録" dtKey="kankeiKikan" />
        <TemplateTextField label="医療連携体制加算の記録" dtKey="iryouKasan" />
        <TemplateTextField label="事業所間連携加算の記録" dtKey="jigyosyoKan" />
        <TemplateTextField label="専門的支援実施加算の記録" dtKey="senmonShien" />
        <TemplateTextField label="ヒヤリハット" dtKey="hiyariHatto" />
      </div>
    </div>
  )
}

const Buttons = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const com = useSelector(state => state.com);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const {formRef, setReset} = props;
  const [snack, setSnack] = useState({});

  const handleCansel = () => {
    setReset(prevReset => !prevReset);
  }

  const handleSubmit = async() => {
    const schDailyReportSetting = {};
    const newDailyReportTemplate = {};
    const formElements = formRef.current.elements;
    for (let i = 0; i < formElements.length; i++) {
      const element = formElements[i];
      if(element.tagName === 'INPUT'){
        const name = element.name;
        const checked = element.checked;
        const value = element.value;
        if(element.type === "checkbox") schDailyReportSetting[name] = checked;
        else if(value) schDailyReportSetting[name] = value;
      }else if(element.tagName === 'TEXTAREA'){
        const value = element.value;
        const id = element.id;
        if(!(value && id)) continue;
        newDailyReportTemplate[id] = lfToBr(value);
      }
    }
    const comExt = JSON.parse(JSON.stringify(com?.ext ?? {}));
    comExt.schDailyReportSetting = schDailyReportSetting;
    comExt.dailyReportTemplate = newDailyReportTemplate;
    const sendComExtParams = {
      a: "sendComExt", hid, bid,
      ext: JSON.stringify(comExt)
    }
    const sendExtRes = await univApiCall(sendComExtParams, "", "", setSnack, "保存しました。", "保存に失敗しました。");
    if(sendExtRes?.data?.result){
      dispatch(setStore({com: {...com, date:stdDate, ext: comExt}}));
    }
    dispatch(setSnackMsg('保存しました。', '', ''));
  }

  return(
    <>
    <div className={classes.buttons}>
      <CntbkCancelButton handleClick={handleCansel} />
      <CntbkSendButton label="保存" handleClick={handleSubmit} />
    </div>
    <SnackMsg {...snack} />
    </>
  )
}

export const DailyReportSetting = () => {
  const headerHeight = useGetHeaderHeight();
  const classes = useStyles();
  const formRef = useRef(null);
  const allState = useSelector(state => state);
  const [reset, setReset] = useState(false);
  if(!getLodingStatus(allState).loaded) return (<LoadingSpinner />);

  return(
    <>
    <DailyReportLinksTab />
    <div className={classes.AppPage} style={headerHeight ?{marginTop: headerHeight+32} :{}}>
      <form ref={formRef}>
        <BasisSetting reset={reset} />
        <SyncSetting reset={reset} />
        <DisplayItemSetting reset={reset} />
        <LogTemplateSetting />
        <Buttons formRef={formRef} setReset={setReset} />
      </form>
    </div>
    </>
  )
}