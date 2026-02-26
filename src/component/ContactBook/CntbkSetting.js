import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Checkbox, FormControlLabel, IconButton, makeStyles, MenuItem, Select } from '@material-ui/core';
import { orange, red, teal } from '@material-ui/core/colors';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import { resetStore, setSnackMsg, setStore } from '../../Actions';
import { formatTelNum, getLodingStatus, isMailAddress, parsePermission } from '../../commonModule';
import { LoadingSpinner } from '../common/commonParts';
import { AlbHMuiTextField } from '../common/HashimotoComponents';
import { CntbkCancelButton, CntbkLinksTab, CntbkSendButton, OFFICIALLINE_GUIDE_URL } from './CntbkCommon';
import { univApiCall } from '../../albCommonModule';
import SnackMsg from '../common/SnackMsg';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { useGetHeaderHeight } from '../common/Header';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import WarningIcon from '@material-ui/icons/Warning';
import SchoolIcon from '@material-ui/icons/School';
import LaunchIcon from '@material-ui/icons/Launch';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';

const SIDEBAR_WIDTH = 61.25;

const useStyles = makeStyles({
  AppPage: {
    width: '95vw',
    margin: `${82+32}px auto`,
    "@media (min-width: 1080px)": {
      position: 'relative',
      maxWidth: (1080 - 358) + SIDEBAR_WIDTH,
      paddingLeft: SIDEBAR_WIDTH,
    },
    "@media (min-width: 960px) and (max-width: 1079px)": {
      position: 'relative',
    },
    "@media (max-width: 959px)": {

    },
  },
  MainForm: {
    paddingBottom: 80,
    '& .header': {
      width: '100%',
      padding: '12px 16px 8px',
      borderBottom: `1px solid ${teal[900]}`,
      backgroundColor: teal[50]
    },
    '& .body': {
      padding: '12px 16px 8px',
    },
    '& .buttons': {
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
        maxWidth: (1080 - 358) + SIDEBAR_WIDTH,
        paddingLeft: SIDEBAR_WIDTH + 16,
      },
      '& .sendButton': {
        marginLeft: 8
      }
    },
    '& .noneFaptoken': {
      display: 'flex', alignItems: 'center',
      padding: '8px 12px', marginBottom: '16px',
      color: red['A700'], lineHeight: '1.5rem',
      backgroundColor: red[50], border: `2px solid ${red['A700']}`,
      '& .icon': {fontSize: '20px', marginRight: '8px'}
    },
    "@media (min-width:1080px)": {
      '& .buttons': {
        '& .sendButton': {
          marginLeft: 12
        }
      },
    },
  },
  formParts: {
    display: 'flex', alignItems: 'center', flexWrap: 'wrap',
    marginBottom: 16,
    '& .label': {
      width: 160,
    }
  },
  vitalTargetSelect: {
    display: 'flex', flexWrap: 'wrap',
    marginBottom: 8,
    '& .label': {
      width: 160, paddingTop: 14
    },
    '& .parts': {
      marginLeft: 10
    }
  }
});

const CntbkSettingTextField = (props) => {
  const classes = useStyles();
  const {label, dtKey, variant="standard", style, ...textFieldProps} = props;
  const [error, setError] = useState(false);
  const [helperText, setHelperText] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    if(props.handleChange){
      props.handleChange({value, error, setError, helperText, setHelperText});
    }
  }

  const handleBlur = (e) => {
    const value = e.target.value;
    if(props.handleBlur){
      props.handleBlur({value, error, setError, helperText, setHelperText});
    }
  }

  return(
    <div className={`${classes.cntbkSettingTextField} ${classes.formParts}`} style={{...style}}>
      {label &&<div className='label'>{label}</div>}
      <AlbHMuiTextField
        name={dtKey}
        variant={variant}
        onChange={handleChange} onBlur={handleBlur}
        helperText={helperText} error={error}
        width={props.width}
        disabled={props.disabled}
        {...textFieldProps}
      />
    </div>
  )
}

const CntbkSettingCheckbox = (props) => {
  const classes = useStyles();
  const {defaultChecked=false, label, dtKey, style} = props;

  return(
    <div
      className={`${classes.cntbkSettingCheckbox} ${classes.formParts}`}
      style={{...style}}
    >
      <div className='label'>{label}</div>
      <Checkbox
        color='primary'
        name={dtKey}
        defaultChecked={defaultChecked}
        onChange={props.onChange}
        disabled={props.disabled}
      />
    </div>
  )
}

const CntbkSettingSelect = (props) => {
  const classes = useStyles();
  const {label, dtKey, items=[], displayNames=[], ...selectProps} = props;

  const menuItems = items.map((item, i) => (
    <MenuItem key={dtKey+item} value={item}>{displayNames[i] ?? item}</MenuItem>
  ));

  return(
    <div className={`${classes.cntbkSettingSelect} ${classes.formParts}`}>
      <div className='label'>{label}</div>
      <Select
        name={dtKey}
        style={{width: props.width}}
        {...selectProps}
      >
        {menuItems}
      </Select>
    </div>
  )
}

const CacheClearButton = () => {
  const dispatch = useDispatch();
  const [hasCache, setHasCache] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);

  const CACHE_CLEAR_LIMIT_KEY = 'cntbk_cache_clear_limit';

  const checkCache = () => {
    const keys = Object.keys(localStorage);
    const hasFmsg = keys.some(key => key.includes('fmsg'));
    setHasCache(hasFmsg);

    const limitDataStr = localStorage.getItem(CACHE_CLEAR_LIMIT_KEY);
    if (limitDataStr) {
      const limitData = JSON.parse(limitDataStr);
      const today = new Date().toLocaleDateString();
      if (limitData.date === today) {
        setIsLimitReached(limitData.count >= 3);
      } else {
        setIsLimitReached(false);
      }
    } else {
      setIsLimitReached(false);
    }
  };

  useEffect(() => {
    checkCache();
  }, []);

  const handleClearCache = () => {
    const limitDataStr = localStorage.getItem(CACHE_CLEAR_LIMIT_KEY);
    const today = new Date().toLocaleDateString();
    let newCount = 1;

    if (limitDataStr) {
      const limitData = JSON.parse(limitDataStr);
      if (limitData.date === today) {
        if (limitData.count >= 3) {
          return;
        }
        newCount = limitData.count + 1;
      }
    }

    Object.keys(localStorage).forEach(key => {
      if(key.includes('fmsg')) localStorage.removeItem(key);
    });

    localStorage.setItem(CACHE_CLEAR_LIMIT_KEY, JSON.stringify({ date: today, count: newCount }));
    
    dispatch(setSnackMsg("キャッシュをクリアしました。"));
    checkCache();
  }

  return(
    <div style={{margin: '8px 0'}}>
      <Button
        variant="outlined"
        onClick={handleClearCache}
        startIcon={<FontAwesomeIcon icon={faBroom} style={{fontSize: 16}} />}
        disabled={!hasCache || isLimitReached}
      >
        キャッシュクリア
      </Button>
      {isLimitReached &&(
        <div style={{color: red['A700'], fontSize: '.8rem', marginTop: 4}}>
          上限回数を超えたため機能が制限されています。
        </div>
      )}
    </div>
  )
}

const BasicSetting = ({settingDtEtc, settingDtExt}) => {
  const account = useSelector(state => state.account);
  const permission = parsePermission(account)[0][0];
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const [line, setLine] = useState(settingDtExt?.line ?? false);
  const [lineNames, setLineNames] = useState([]);
  const [lineDisplayNames, setLineDisplayNames] = useState([]);
  const [lineName, setLineName] = useState(null);
  const [originLineName, setOriginLineName] = useState(null);

  useEffect(() => {
    univApiCall({a: 'fetchLineNames'}).then(res => {
      const dts = res?.data?.dt ?? [];
      const newLineNames = dts.map(dt => dt.lineName);
      setLineNames(newLineNames);
      const newLineDisplayNames = dts.map(dt => dt.displayName);
      setLineDisplayNames(newLineDisplayNames);
    });
    univApiCall({a: "fetchLineAccount", hid, bid}).then(res => {
      const dt = res?.data?.dt?.[0];
      if(dt){
        setLineName(dt.lineName);
        setOriginLineName(dt.lineName);
      }
    });
  }, []);

  const phoneHandleBlur = (args) => {
    const {value, setError, setHelperText} = args;
    if(!value){
      setError(false);
      setHelperText("");
      return;
    }
    const formatedPhone = formatTelNum(value);
    if(formatedPhone.result){
      setError(false);
      setHelperText("");
    }else{
      setError(true);
      setHelperText("番号が不正");
    }
  }

  // const smsPhoneHandleBlur = (args) => {
  //   const {value, setError, setHelperText} = args;
  //   if(!value){
  //     setError(false);
  //     setHelperText("");
  //     return;
  //   }
  //   const formatedPhone = formatTelNum(value);
  //   if(formatedPhone.result){
  //     if(/0[789]0-[0-9]{4}-[0-9]{4}/.test(formatedPhone.format)){
  //       setBasicFormDt({...basicFormDt, "smsPhone": formatedPhone.format});
  //       setError(false);
  //       setHelperText("");
  //     }else{
  //       setError(true);
  //       setHelperText("番号が不正");
  //     }
  //   }else{
  //     setError(true);
  //     setHelperText("番号が不正");
  //   }
  // }
  const lineJpName = originLineName === 'aqua' ?'あるふぁみ あくあ' :'あるふぁみ';
  const lineWrongName = originLineName !== 'aqua' ?'あるふぁみ あくあ' :'あるふぁみ';
  return(
    <div className='settingWrapper'>
      <div className='header'>基本設定</div>
      <div className='body'>
        <CntbkSettingSelect defaultValue={settingDtEtc?.numOfPhotos ?? "3"} label="画像枚数制限" dtKey="numOfPhotos" items={["0", "1", "2", "3", "4", "5", "6"]} width="48px" />
        <CntbkSettingTextField defaultValue={settingDtEtc?.phone ?? ""} label="電話番号" dtKey="links.phone" handleBlur={phoneHandleBlur} width="160px" />
        {/* <CntbkSettingTextField defaultValue={settingDtEtc?.twitter ?? "https://x.com/"} label="X（旧Twitter）" dtKey="links.twitter" width="440px" />
        <CntbkSettingTextField defaultValue={settingDtEtc?.instagram ?? "https://www.instagram.com/"} label="instagram" dtKey="links.instagram" width="440px" />
        <CntbkSettingTextField defaultValue={settingDtEtc?.facebook ?? "https://www.facebook.com/"} label="facebook" dtKey="links.facebook" width="440px" />
        <CntbkSettingTextField defaultValue={settingDtEtc?.website ?? "https://"} label="ホームページ" dtKey="links.website" width="440px" /> */}
        <CntbkSettingCheckbox
          defaultChecked={settingDtExt?.line ?? false}
          label="LINE送信" dtKey="line"
          onChange={(e) => setLine(e.target.checked)}
          disabled={permission!==100}
        />
        {(permission===100 && line) &&<CntbkSettingSelect
          value={lineName ?? "alfami"} label="公式LINE選択" dtKey="lineName"
          items={lineNames} displayNames={lineDisplayNames}
          width="160px"
          disabled={Boolean(originLineName)}
          onChange={(e) => setLineName(e.target.value)}
        />}
        {(permission===100 && line) &&<CntbkSettingCheckbox
          defaultChecked={settingDtExt?.lineAuthedMakeFaptoken ?? false} label="LINE認証後に自動で送受信設定する" dtKey="lineAuthedMakeFaptoken"
        />}
        {/* <CntbkSettingTextField label="LINE用電話番号" dtKey="smsPhone" handleBlur={smsPhoneHandleBlur} width={phoneTextFieldWidth} disabled={!basicFormDt.line} {...formPartsProps} /> */}
        {(permission===100) &&<CntbkSettingCheckbox
          defaultChecked={settingDtExt?.checkMistake ?? false}
          label={<div style={{display: 'flex', alignItems: 'center'}}><SchoolIcon style={{color: orange[800], marginRight: 8}} />誤送信対策</div>}
          dtKey="checkMistake"
        />}
        {line &&<CacheClearButton />}
        {Boolean(line && originLineName) &&(<>
          <div style={{fontSize: '1rem', marginTop: 16}}>
            ご家族にご案内するLINEアカウントは
            <span style={{color: red[600], fontWeight: 600, fontSize: '1.2rem'}}>「{lineJpName}」</span>
            です。
          </div>
          <div style={{fontSize: '.8rem', color: red[600], marginBottom: 16}}>
            「{lineWrongName}」ではないのでご注意ください。
          </div>
        </>)}
        {Boolean(line && originLineName) &&(
          <div style={{marginBottom: 16}}>
            <Button
              variant="outlined"
              href={OFFICIALLINE_GUIDE_URL[lineName ?? "alfami"]} target="_blank"
              rel="noopener noreferrer"
              startIcon={<LaunchIcon />}
            >
              ご家族様への案内はこちら
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

const PreMessageSettings = ({settingDtEtc}) => {
  const com = useSelector(state => state.com);
  const autoMessageEtc = settingDtEtc?.autoMessage;
  return(
    <div className='settingWrapper'>
      <div className='header'>事前送信メッセージ設定</div>
      <div className='body'>
        <CntbkSettingCheckbox defaultChecked={autoMessageEtc?.notSendMail ?? false} label="自動送信を行わない" dtKey="autoMessage.notSendMail" />
        <CntbkSettingCheckbox defaultChecked={autoMessageEtc?.pickupTime ?? false} label="お迎え時間の記載" dtKey="autoMessage.pickupTime" />
        <CntbkSettingCheckbox defaultChecked={autoMessageEtc?.pickupPlace ?? false} label="お迎え場所の記載" dtKey="autoMessage.pickupPlace" />
        <CntbkSettingCheckbox defaultChecked={autoMessageEtc?.sendEvenAbsent ?? false} label="欠席時も送信" dtKey="autoMessage.sendEvenAbsent" />
        <CntbkSettingSelect defaultValue={com?.ext?.familyMessageTimeLimit ?? "10:00"} label="返信時間制限" dtKey="autoMessage.familyMessageTimeLimit" items={["9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "12:00"]} width="80px"/>
      </div>
    </div>
  )
}

const PostMessageSettings = ({settingDtEtc}) => {
  const postMessage = settingDtEtc?.postMessage;
  return(
    <div className='settingWrapper'>
      <div className='header'>ご様子メッセージ設定</div>
      <div className='body'>
        <CntbkSettingCheckbox defaultChecked={postMessage?.inputNextSchedule ?? false} label="次回予定を自動記述" dtKey="postMessage.inputNextSchedule" />
      </div>
    </div>
  )
}

const BulkMessageSettings = ({settingDtEtc}) => {
  const bulkMessage = settingDtEtc?.bulkMessage;
  return(
    <div className='settingWrapper'>
      <div className='header'>一斉連絡設定</div>
      <div className='body'>
        <CntbkSettingCheckbox defaultChecked={bulkMessage?.allowStaff ?? false} label="スタッフにも送信許可" dtKey="bulkMessage.allowStaff" />
      </div>
    </div>
  )
}

const VitalTargetSelect = (props) => {
  const classes = useStyles();
  const {defaultCheckes} = props;

  return(
    <div className={classes.vitalTargetSelect}>
      <div className='label'>バイタル記述</div>
      <div>
        <div className='parts'>
          <FormControlLabel
            control={<Checkbox
              defaultChecked={defaultCheckes?.[1] ?? false}
              name='vital.bitalRequired1'
            />}
            label="ご家族から事業所"
          />
        </div>
        <div className='parts'>
          <FormControlLabel
            control={<Checkbox
              defaultChecked={defaultCheckes?.[2] ?? false}
              name='vital.bitalRequired2'
            />}
            label="事業所からご家族"
          />
        </div>
      </div>
    </div>
  )
}

const VitalSettings = ({settingDtEtc}) => {
  const vital = settingDtEtc.vital;
  return(
    <div className='settingWrapper'>
      <div className='header'>バイタル設定</div>
      <div className='body'>
        <CntbkSettingCheckbox defaultChecked={vital?.temperature ?? false} label="体温" dtKey="vital.temperature" />
        <CntbkSettingCheckbox defaultChecked={vital?.bloods ?? false} label="血圧・脈拍"dtKey="vital.bloods"  />
        <CntbkSettingCheckbox defaultChecked={vital?.spo2 ?? false} label="血中酸素濃度" dtKey="vital.spo2" />
        <CntbkSettingCheckbox defaultChecked={vital?.meal ?? false} label="食事" dtKey="vital.meal" />
        <CntbkSettingCheckbox defaultChecked={vital?.excretion ?? false} label="排泄" dtKey="vital.excretion" />
        <CntbkSettingCheckbox defaultChecked={vital?.medication ?? false} label="服薬" dtKey="vital.medication" />
        <CntbkSettingSelect defaultValue={vital?.sleep ?? "設定なし"} label="睡眠" dtKey="vital.sleep" items={["設定なし", "時間", "就寝・起床"]} width="112px" />
        <VitalTargetSelect defaultCheckes={vital?.bitalRequired ?? [false, false, false]} />
      </div>
    </div>
  )
}

const BccSettings = () => {
  const account = useSelector(state => state.account);
  const permission = parsePermission(account)[0][0];
  const com = useSelector(state => state.com);
  const [bccAddresses, setBccAddresses] = useState(com?.ext?.bccAddresses ?? [""]);

  const bccTextFields = bccAddresses.map((bcc, i) => {
    const handleChange = (args) => {
      const {value} = args;
      setBccAddresses(prevBccAddresses => {
        const newBccAddresses = [...prevBccAddresses];
        newBccAddresses[i] = value;
        return newBccAddresses;
      });
    }
    const handleBlur = (args) => {
      const {value, setError, setHelperText} = args;
      if(isMailAddress(value)){
        setError(false);
        setHelperText("");
      }else{
        setError(true);
        setHelperText("メールアドレスが不正です。");
      }
    }
    const handleDelete = () => {
      setBccAddresses(prevBccAddresses => {
        const newBccAddresses = prevBccAddresses.filter((prevBcc) => {
          return bcc !== prevBcc
        });
        return newBccAddresses;
      });
    }
    const cntbkSettingTextFieldProps = {
      value: bcc,
      dtKey: "bccAddresses.bccAddress"+i,
      variant: "outlined", handleChange, handleBlur, width: "100%",
      placeholder: "mail@example.com",
      style: {marginBottom: 0, flex: 1},
      inputProps: {type: "email"}
    }
    return(
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '16px'}}>
        <CntbkSettingTextField key={"bccAddress"+i} {...cntbkSettingTextFieldProps} />
        <IconButton onClick={handleDelete}>
          <DeleteForeverIcon style={{color: red["A700"]}} />
        </IconButton>
      </div>
    )
  });

  return(
    <div className='settingWrapper'>
      <div className='header'>返信先メールアドレス</div>
      <div className='body'>
        <div style={{marginBottom: '24px'}}>
          <CntbkSettingCheckbox
            label="BCCに設定" style={{marginBottom: 0}}
            defaultChecked={com?.ext?.cntbkAddBcc ?? true} dtKey="bccMail.cntbkAddBcc"
          />
          <div style={{fontSize: '14px'}}>※ご家族様に届いたメールと同じものを受け取ることができます。</div>
        </div>
        {/* <div style={{marginBottom: 16}}>ご家族様が誤ってメールに直接返信された場合、設定されたメールアドレスに届きます。</div> */}
        {bccTextFields}
        <IconButton
          onClick={() => setBccAddresses(prevBccAddresses => [...prevBccAddresses, ""])}
          style={{display: 'block', margin: '0 auto'}}
        >
          <AddCircleOutlineIcon />
        </IconButton>
      </div>
    </div>
  )
}

const Buttons = (props) => {
  const dispatch = useDispatch();
  const com = useSelector(state => state.com);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const {formRef} = props;
  const [snack, setSnack] = useState({});

  const handleCancel = () => {
    dispatch(resetStore());
  }

  const handleSend = async() => {
    if(!formRef.current) return;
    const inputs = formRef.current.querySelectorAll('input');
    const formDt = [...inputs].reduce((prevFormDt, element) => {
      let value = null;
      if(element.type === "text"){
        value = element.value;
      }else if(element.type === "checkbox"){
        value = element.checked;
      }else if(element.type === "email"){
        value = element.value;
      }
      const keys = element.name.split(".");
      if(keys.length === 1) prevFormDt[keys[0]] = value;
      else if(keys.length === 2){
        if(!prevFormDt[keys[0]]) prevFormDt[keys[0]] = {};
        prevFormDt[keys[0]][keys[1]] = value;
      }
      return prevFormDt;
    }, {});
    formDt.vital = {...formDt.vital, bitalRequired: [false, formDt.vital.bitalRequired1, formDt.vital.bitalRequired2]};
    const settingDtEtc = {
      links: formDt.links,
      autoMessage: formDt.autoMessage, postMessage: formDt.postMessage, bulkMessage: formDt.bulkMessage,
      vital: formDt.vital,
      numOfPhotos: formDt.numOfPhotos,
      bitalRequired: formDt.vital.bitalRequired,   
    };
    const comEtc = checkValueType(com?.etc, 'Object') ?{...com.etc} :{};
    comEtc.settingContactBook = settingDtEtc;
    const sendEtcParams = {
      a: 'sendBrunch',
      ...com, hid, bid, date: stdDate,
      addiction: JSON.stringify(com.addiction),
      etc: JSON.stringify(comEtc),
    };
    const sendEtcRes = await univApiCall(sendEtcParams);
    if(!sendEtcRes?.data?.result){
      setSnack({msg: '保存に失敗しました。', severity: 'warning', id: new Date().getTime()});
      return;
    }
    const settingDtExt = {line: formDt.line, checkMistake: formDt.checkMistake};
    if(formDt.line){
      settingDtExt.lineName = formDt.lineName;
      settingDtExt.lineAuthedMakeFaptoken = formDt.lineAuthedMakeFaptoken;
      // line設定がオンの時のみ、officialLine書き込み処理を行う。
      const fetchLineAccountRes = await univApiCall({a: "fetchLineAccount", hid, bid});
      const prevLineName = fetchLineAccountRes?.data?.dt?.[0]?.lineName;
      if(!prevLineName && formDt.lineName){
        const res = await univApiCall({a: "sendNewBrunchForLineAccount", hid, bid, lineName: formDt.lineName});
        if(!res?.data?.result){
          setSnack({msg: '保存に失敗しました。', severity: 'warning', id: new Date().getTime()});
          return;
        }
      }
    }
    const comExt = checkValueType(com?.ext, 'Object') ?{...com.ext} :{};
    comExt.bccAddresses = Object.values(formDt?.bccAddresses || {}).filter(bcc => bcc ?true :false);
    if(!comExt.bccAddresses.length) comExt.bccAddresses = [""];
    comExt.cntbkAddBcc = formDt.bccMail.cntbkAddBcc;
    comExt.familyMessageTimeLimit = formDt.autoMessage.familyMessageTimeLimit;
    comExt.settingContactBook = settingDtExt;
    const sendExtParams = {
      a: "sendComExt", hid, bid,
      ext: JSON.stringify(comExt)
    }
    const sendExtRes = await univApiCall(sendExtParams);
    if(!sendExtRes?.data?.result){
      setSnack({msg: '保存に失敗しました。', severity: 'warning', id: new Date().getTime()});
      return;
    }

    dispatch(setStore({com: {...com, date:stdDate, etc: comEtc, ext: comExt}}));
    dispatch(setSnackMsg('保存しました。', '', ''));
  }

  return(
    <>
    <div className='buttons'>
      <CntbkCancelButton handleClick={handleCancel} />
      <CntbkSendButton label="保存" handleClick={handleSend} />
    </div>
    <SnackMsg {...snack} />
    </>
  )
}

const MainForm = () => {
  const com = useSelector(state => state.com);
  const classes = useStyles();
  const formRef = useRef(null);

  const settingDtEtc = com?.etc?.settingContactBook ?? {};
  const settingDtExt = com?.ext?.settingContactBook ?? {};
  const noneReplayMailAddress = !Boolean((com?.ext?.bccAddresses ?? []).filter(x => Boolean(x)).length);

  const commonProps = {settingDtEtc, settingDtExt};
  return(
    <div className={classes.MainForm}>
      {noneReplayMailAddress &&<div className='noneFaptoken'>
        <WarningIcon className='icon' />
        返信先メールアドレスが未登録です。<br />
        連絡帳やお知らせのメールにご家族様が直接返信されても、受け取ることができません。
      </div>}
      <form ref={formRef}>
        <BasicSetting {...commonProps} />
        <PreMessageSettings {...commonProps} />
        <PostMessageSettings {...commonProps} />
        <BulkMessageSettings {...commonProps} />
        <VitalSettings {...commonProps} />
        <BccSettings {...commonProps} />
        <Buttons formRef={formRef} />
      </form>
    </div>
  )
}

const CntbkSetting = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const classes = useStyles();
  const headerHeight = useGetHeaderHeight();

  if(!loadingStatus.loaded) return(
    <>
    <CntbkLinksTab />
    <LoadingSpinner />
    </>
  );

  return(
    <>
    <CntbkLinksTab />
    <div className={classes.AppPage} style={headerHeight ?{marginTop: headerHeight+32} :{}}>
      <MainForm />
    </div>
    </>
  )
}
export default CntbkSetting