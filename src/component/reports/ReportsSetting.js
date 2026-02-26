import React, { useState } from 'react';
import SettingsIcon from '@material-ui/icons/Settings';
import { Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, makeStyles, Radio, RadioGroup } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { brtoLf, getLodingStatus, getUisCookie, lfToBr, parsePermission, setUisCookie, uisCookiePos } from '../../commonModule';
import { GoBackButton, LoadErr, LoadingSpinner } from '../common/commonParts';
import { setSnackMsg, setStore } from '../../Actions';
import { useHistory, useLocation, useParams } from 'react-router';
import { grey, red, teal } from '@material-ui/core/colors';
import { UsersContractInfoMain } from './UsersContractInfo';
import { AlbHMuiTextField } from '../common/HashimotoComponents';
import AddIcon from '@material-ui/icons/Add';
import { LC2024 } from '../../modules/contants';
import { univApiCall } from '../../albCommonModule';
import SnackMsg from '../common/SnackMsg';
import ListIcon from '@material-ui/icons/List';

const useStyle = makeStyles({
  settingButton: {
    display: 'flex', alignItems: 'center',
    margin: '0 auto',
    fontSize: 16
  },
  historyButton: {
    position: 'fixed', top: 92, left: 80,
    '& span': {fontSize: 16},
    zIndex: 999
  },
  reportsSetting: {
    maxWidth: 800,
    margin: '100px auto',
    '& .title': {
      marginBottom: 8,
      textAlign: 'center',
      padding: 8,
      fontWeight: '600',
      color: teal[800],
      backgroundColor: teal[50],
      borderBottom: `1px solid ${teal[300]}`
    },
    '& .formParts': {
      padding: 8
    }
  },
  invoice: {
    '& .coment': {width: '100%'},
  },
  jogenKanri: {
    '& .parentConfirmation': {
      display: 'flex', flexDirection: 'column',
      '& .childForm': {
        marginLeft: 8,
        borderLeft: `2px solid ${teal[400]}`
      }
    },
  },
  teikyouJisseki: {
    '& .parentConfirmation': {
      display: 'flex', flexDirection: 'column',
      '& .childForm': {
        marginLeft: 8,
        borderLeft: `2px solid ${teal[400]}`
      }
    },
    '& .subHeader': {
      padding: '8px 4px',
      backgroundColor: teal[50]
    }
  },
  allReportsSetting: {
    '& .hidePersonalInfo':{
      display: 'flex', flexDirection: 'row',
      '& .label': {color: 'black', display: 'flex', alignItems: 'center', marginRight: 16}
    },

  }
});

export const backReportsComponent = (location, history) => {
  const urlParts = location.split('/');
  let newLocation = "";
  for(const part of urlParts){
    newLocation += `${part}/`;
    if(part === "reports") break;
  }
  if(newLocation.slice(-1)==="/") newLocation = newLocation.slice(0, newLocation.length-1);
  history.push(newLocation);
}

export const ReportsSettingButton = (props) => {
  const classes = useStyle();
  const history = useHistory();
  const {settingItem, permission, permissionFilting} = props;
  if(permission < permissionFilting) return null;
  const handleClick = () => {
    const newLocation = `/reports/setting/${settingItem}/`;
    history.push(newLocation);
  }
  return(
    <Button
      className={classes.settingButton}
      onClick={handleClick}
      style={{...(settingItem==="all"?{margin: 0}:{}), ...props.style}}
    >
      {settingItem==="all" ?"その他の印刷設定" :"設定"}
      <SettingsIcon style={{color: grey[600], marginLeft: 4}}/>
    </Button>
  )
}

export const ReportsRegisterButtons = ({registerItem}) => {
  const classes = useStyle();
  const history = useHistory();
  const handleClick = () => {
    const newLocation = `/reports/setting/${registerItem}/`;
    history.push(newLocation);
  }
  return(
    <Button
      className={classes.settingButton}
      onClick={handleClick}
    >
      登録
      <AddIcon style={{color: teal[800], marginLeft: 4}}/>
    </Button>
  )
}

export const ReportsEsignListButton = ({esignListPath}) => {
  const classes = useStyle();
  const history = useHistory();
  const handleClick = () => {
    history.push(esignListPath);
  }
  return(
    <Button
      className={classes.settingButton}
      onClick={handleClick}
    >
      サイン一覧
      <ListIcon style={{color: teal[800], marginLeft: 4}}/>
    </Button>
  )
}

const CancelButton = () => {
  const location = useLocation().pathname;
  const history = useHistory();
  const handleClick = () => {
    // backReportsComponent(location, history);
    history.goBack();
  }

  return(
    <Button
      variant="contained"
      className='canselButton'
      onClick={handleClick}
    >
      キャンセル
    </Button>
  )
}

/*書き込み用ボタン*/
const SendButton = ({handleClick}) => {
  const location = useLocation().pathname;
  const history = useHistory();
  return(
    <Button
      color='primary'
      variant="contained"
      className='sendButton'
      onClick={()=>{
        handleClick();
        // backReportsComponent(location, history);
        history.goBack();
      }}
    >
      送信
    </Button>
  )
}

const ButtonWrapper = ({handleClick}) => {
  return(
    <div className='buttonWrapper'>
      <CancelButton />
      <SendButton handleClick={handleClick}/>
    </div>
  )
}

const InvoiceSetting = ({allState, setSnack}) => {
  const classes = useStyle();
  const dispatch = useDispatch();
  const {com, hid, bid} = allState;
  const comEtc = {...com?.etc};
  const comExt = {...com?.ext};
  const [coment, setComent] = useState(comExt?.reportsSetting?.invoice?.notice ?? comEtc?.reports?.invoice?.notice ?? "");
  const [coment2, setComent2] = useState(comExt?.reportsSetting?.invoice?.notice2 ?? comEtc?.reports?.invoice?.notice2 ?? "");
  const [displayDate, setDisplayDate] = useState(comExt?.reportsSetting?.invoice?.displayDate ?? comEtc?.configReports?.invoice?.displayDate ?? true);
  const [displayNotice, setDisplayNotice] = useState(comExt?.reportsSetting?.invoice?.displayNotice ?? comEtc?.configReports?.invoice?.displayNotice ?? true);
  const [doPrintBilling, setDoPrintBilling] = useState(comExt?.reportsSetting?.invoice?.doPrintBilling ?? comEtc?.configReports?.invoice?.doPrintBilling ?? false);
  const [doPrintSchedule, setDoPrintSchedule] = useState(comExt?.reportsSetting?.invoice?.doPrintSchedule ?? comEtc?.configReports?.invoice?.doPrintSchedule ?? false);

  /*日付表示チェックボックス*/
  const DisplayDate = () => {
    const handleChange = (e) => {
      setDisplayDate(e.target.checked);
    }
    return(
      <FormControlLabel
        control={
          <Checkbox
            checked={displayDate}
            onChange={handleChange}
            name='displayDate'
            color="primary"
          />
        }
        label='日付表示'
        className='displayDate formParts'
      />
    )
  }

  // /*備考表示チェックボックス*/
  const DisplayNotice = () => {
    const handleChange = (e) => {
      setDisplayNotice(e.target.checked);
    }

    return(
      <FormControlLabel
        control={
          <Checkbox
            checked={displayNotice}
            onChange={handleChange}
            name='displayNotice'
            color="primary"
          />
        }
        label='備考表示'
        className='displayNotice formParts'
      />
    )
  }

  const DoPrintBilling = () => {
    const handleChange = (e) => {
      const checked = e.target.checked;
      if(checked === false) setDoPrintSchedule(false);
      setDoPrintBilling(checked);
    }

    return(
      <FormControlLabel
        control={
          <Checkbox
            checked={doPrintBilling}
            onChange={handleChange}
            name='doPrintBilling'
            color="primary"
          />
        }
        label='請求額がない利用者も印刷'
        className='doPrintBilling formParts'
      />
    )
  }

  const DoPrintSchedule = () => {
    const handleChange = (e) => {
      setDoPrintSchedule(e.target.checked);
    }

    return(
      <FormControlLabel
        control={
          <Checkbox
            checked={doPrintSchedule}
            disabled={!doPrintBilling}
            onChange={handleChange}
            name='doPrintSchedule'
            color="primary"
          />
        }
        label='利用がない利用者も印刷'
        className='doPrintSchedule formParts'
      />
    )
  }

  /*書き込みボタンの処理*/
  const clickSendButton = async() => {
    const comExt = {...com?.ext};
    if(!comExt.reportsSetting) comExt.reportsSetting = {};
    if(!comExt.reportsSetting.invoice) comExt.reportsSetting.invoice = {};
    comExt.reportsSetting.invoice["notice"] = lfToBr(coment);
    comExt.reportsSetting.invoice["notice2"] = lfToBr(coment2);
    comExt.reportsSetting.invoice["displayDate"] = displayDate;
    comExt.reportsSetting.invoice["displayNotice"] = displayNotice;
    comExt.reportsSetting.invoice["doPrintBilling"] = doPrintBilling;
    comExt.reportsSetting.invoice["doPrintSchedule"] = doPrintSchedule;
    const params = {
      a: "sendComExt", hid, bid,
      ext: JSON.stringify(comExt)
    }
    const res = await univApiCall(params);
    if(!res?.data?.result){
      setSnack({msg: '保存に失敗しました。', severity: 'warning', id: new Date().getTime()});
      return;
    }
    dispatch(setStore({com: {...com, ext: comExt}}));
    dispatch(setSnackMsg('保存しました。'));
  }

  return(
    <div className={classes.invoice}>
      <div className='formParts'>
        <AlbHMuiTextField
          variant="outlined"
          label="請求書コメント"
          multiline
          minRows={2} rows={2}
          value={brtoLf(coment)}
          width="100%"
          onChange={e => setComent(e.target.value)}
        />
      </div>
      <div className='formParts'>
        <AlbHMuiTextField
          variant="outlined"
          label="受領書・領収書コメント"
          multiline
          minRows={2} rows={2}
          value={brtoLf(coment2)}
          width="100%"
          onChange={e => setComent2(e.target.value)}
        />
      </div>
      <div>
        <DisplayDate />
        <DisplayNotice />
      </div>
      <div>
        <DoPrintBilling />
        <DoPrintSchedule />
      </div>
      <ButtonWrapper handleClick={clickSendButton}/>
    </div>
  )
}

const JogenKanriSetting = ({allState, setSnack}) => {
  const classes = useStyle();
  const dispatch = useDispatch();
  const {com, hid, bid, stdDate} = allState;
  const comEtc = {...com?.etc};
  const comExt = {...com?.ext};
  const [parentConfirmation, setParentConfirmation] = useState(comExt?.reportsSetting?.jogenKanri?.parentConfirmation ?? comEtc?.configReports?.jogenKanri?.parentConfirmation ?? true);
  const [displayName, setDisplayName] = useState(comExt?.reportsSetting?.jogenKanri?.displayName ?? comEtc?.configReports?.jogenKanri?.displayName ?? false);
  const [displayDate, setDisplayDate] = useState(comExt?.reportsSetting?.jogenKanri?.displayDate ?? comEtc?.configReports?.jogenKanri?.displayDate ?? false);

  const ParentConfirmation = () => {
    return(
      <div className='parentConfirmation formParts'>
        <FormControlLabel
          control={
            <Checkbox
              checked={parentConfirmation}
              onChange={(e) => setParentConfirmation(e.target.checked)}
              color="primary"
            />
          }
          label='利用者確認欄をページ下に印刷する'
        />
        <FormControlLabel
          disabled={!parentConfirmation}
          control={
            <Checkbox
              checked={displayName}
              onChange={(e) => setDisplayName(e.target.checked)}
              color="primary"
            />
          }
          label='名前を表示'
          className='childForm'
        />
        <FormControlLabel
          disabled={!parentConfirmation}
          control={
            <Checkbox
              checked={displayDate}
              onChange={(e) => setDisplayDate(e.target.checked)}
              color="primary"
            />
          }
          label='日付を表示'
          className='childForm'
        />
      </div>
    )
  }

  const clickSendButton = async() => {
    const comExt = {...com?.ext};
    if(!comExt.reportsSetting) comExt.reportsSetting = {};
    if(!comExt.reportsSetting.jogenKanri) comExt.reportsSetting["jogenKanri"] = {};
    comExt.reportsSetting.jogenKanri["displayName"] = displayName;
    comExt.reportsSetting.jogenKanri["parentConfirmation"] = parentConfirmation;
    comExt.reportsSetting.jogenKanri["displayDate"] = displayDate;
    const params = {
      a: "sendComExt", hid, bid,
      ext: JSON.stringify(comExt)
    }
    const res = await univApiCall(params);
    if(!res?.data?.result){
      setSnack({msg: '保存に失敗しました。', severity: 'warning', id: new Date().getTime()});
      return;
    }
    dispatch(setStore({com: {...com, ext: comExt}}));
    dispatch(setSnackMsg('保存しました。'));
  }

  return(
    <div className={classes.jogenKanri}>
      <div>
        <ParentConfirmation />
      </div>
      <ButtonWrapper handleClick={clickSendButton}/>
    </div>
  )
}

const TeikyouJissekiSetting = ({allState, setSnack}) => {
  const classes = useStyle();
  const dispatch = useDispatch();
  const account = useSelector(state => state.account);
  const permission = parsePermission(account)[0][0];
  const {com, hid, bid, stdDate} = allState;
  const comEtc = {...com?.etc};
  const comExt = {...com?.ext};
  const [displayAbsence, setDisplayAbsence] = useState(comExt?.reportsSetting?.teikyouJisseki?.displayAbsence ?? comEtc?.configReports?.teikyouJisseki?.displayAbsence ?? "0");
  const [displayItems, setDisplayItems] = useState(comExt?.reportsSetting?.teikyouJisseki?.displayItems ?? comEtc?.configReports?.teikyouJisseki?.displayItems ?? {});
  const [parentConfirmation, setParentConfirmation] = useState(comExt?.reportsSetting?.teikyouJisseki?.parentConfirmation ?? comEtc?.configReports?.teikyouJisseki?.parentConfirmation ?? {});
  const [displayOtherUseDate, setDisplayOtherUseDate] = useState(comExt?.reportsSetting?.teikyouJisseki?.displayOtherUseDate ?? comEtc?.configReports?.teikyouJisseki?.displayOtherUseDate ?? false);
  const [cellHeightChange, setCellHeightChange] = useState(comExt?.reportsSetting?.teikyouJisseki?.cellHeightChange ?? comEtc?.configReports?.teikyouJisseki?.cellHeightChange ?? false);
  const [fontSizeChange, setFontSizeChange] = useState(comExt?.reportsSetting?.teikyouJisseki?.fontSizeChange ?? comEtc?.configReports?.teikyouJisseki?.fontSizeChange ?? false);
  const [teikyouJisseki2024, setTeikyouJisseki2024] = useState(comExt?.reportsSetting?.teikyouJisseki?.teikyouJisseki2024 ?? comEtc?.configReports?.teikyouJisseki?.teikyouJisseki2024 ?? {});

  const itemList = ["自立サポート加算", "通所自立支援加算", "入浴支援加算", "専門的支援加算(支援実施時)", "医療連携体制加算"];
  const DisplayItems = () => {
    const CheckboxItem = ({item}) => {
      const handleChange = (e) => {
        const checked = e.target.checked;
        setDisplayItems(prevDt => ({...prevDt, [item]: checked}));
      }
      return(
        <FormControlLabel
          control={<Checkbox
            color="primary"
            checked={displayItems[item] ?? true}
            onChange={handleChange}
          />}
          label={item} labelPlacement="end"
        />
      )
    }

    return(
      <div style={{padding: '8px'}}>
        <div style={{marginBottom: '8px'}}>
          <FormControl component="fieldset">
            <FormLabel component="legend">表示項目</FormLabel>
            <FormGroup row>
              <FormControlLabel
                control={<Checkbox
                  color="primary"
                  checked={displayAbsence === "0"}
                  onChange={(e) => setDisplayAbsence(e.target.checked ?"0" :"1")}
                />}
                label="欠席時対応加算がない欠席を表示する" labelPlacement="end"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={displayOtherUseDate}
                    onChange={e=>setDisplayOtherUseDate(e.target.checked)}
                    color="primary"
                  />
                }
                label='利用日以外も表示'
              />
            </FormGroup>
          </FormControl>
        </div>
        <div>
          <FormControl component="fieldset">
            <FormLabel component="legend">列表示項目</FormLabel>
            <FormGroup row>
              {itemList.map(item => (
                <CheckboxItem item={item} />
              ))}
            </FormGroup>
          </FormControl>
        </div>
      </div>
    )
  }

  const ParentConfirmation = () => {
    const handleChange = (e) => {
      const data = JSON.parse(JSON.stringify(parentConfirmation));
      if(!e.target.checked){
        data.confPerDate = false;
        data.bottomOfPage = false;
        data.printDate = false;
      }
      data.checked = e.target.checked;
      setParentConfirmation({...data});
    }
    return(
      <div className='parentConfirmation formParts'>
        <FormControlLabel
          control={
            <Checkbox
              checked={parentConfirmation.checked}
              onChange={handleChange}
              name='displayNotice'
              color="primary"
            />
          }
          label='利用者確認欄をページ下に印刷する'
        />
        <FormControlLabel
          disabled={!parentConfirmation.checked}
          control={
            <Checkbox
              checked={parentConfirmation.confPerDate}
              onChange={e=>{
                const newParentConfirmation = {...parentConfirmation, confPerDate: e.target.checked};
                // line利用事業所のみ対象
                if(com?.ext?.settingContactBook?.line && e.target.checked){
                  // 日毎のサイン欄をなくす場合は電子サインを無効にする。
                  newParentConfirmation.eSign = false;
                  newParentConfirmation.eSignUseResult = false;
                  newParentConfirmation.eSignRepeat = false;
                }
                setParentConfirmation(newParentConfirmation);
              }}
              name='displayNotice'
              color="primary"
            />
          }
          label='日ごとの利用者確認欄をなくす'
          className='childForm'
        />
        <FormControlLabel
          disabled={!parentConfirmation.checked}
          control={
            <Checkbox
              checked={parentConfirmation.bottomOfPage}
              onChange={e => setParentConfirmation({...parentConfirmation, bottomOfPage: e.target.checked})}
              name='displayNotice'
              color="primary"
            />
          }
          label='ページ下の利用者確認欄に氏名を印刷する'
          className='childForm'
        />
        <FormControlLabel
          disabled={!parentConfirmation.checked}
          control={
            <Checkbox
              checked={parentConfirmation.printDate}
              onChange={e=>setParentConfirmation({...parentConfirmation, printDate: e.target.checked})}
              name='displayNotice'
              color="primary"
            />
          }
          label='ページ下の利用者確認欄に日付を印刷する'
          className='childForm'
        />
        {com?.ext?.settingContactBook?.line &&(<>
          <FormControlLabel
            disabled={parentConfirmation.confPerDate}
            control={
              <Checkbox
                checked={parentConfirmation.eSign ?? false}
                onChange={(e) => {
                  const newParentConfirmation = {...parentConfirmation, eSign: e.target.checked};
                  if(!e.target.checked){
                    // 電子サインを無効にしたら、子設定を無効にする。
                    newParentConfirmation.eSignUseResult = false;
                    newParentConfirmation.eSignRepeat = false;
                  }
                  setParentConfirmation(newParentConfirmation);
                }}
                name='displayNotice'
                color="primary"
              />
            }
            label='電子サインを有効'
            style={{marginTop: 16}}
          />
          <FormControlLabel
            disabled={!parentConfirmation.eSign}
            control={
              <Checkbox
                checked={parentConfirmation.eSignUseResult ?? false}
                onChange={e=>setParentConfirmation({...parentConfirmation, eSignUseResult: e.target.checked})}
                name='displayNotice'
                color="primary"
              />
            }
            label='実績にした予定のみ有効'
            className='childForm'
          />
          <div
            className='childForm'
            style={{fontSize: 14, paddingLeft: 12, color: red[600], fontWeight: 600, paddingBottom: 8}}
          >
            <span style={{opacity: parentConfirmation.eSign ?"1" :"0.5"}}>
              この設定は当月利用分のみ有効です。前月の利用はサイン可能になります。
            </span>
          </div>
          {(permission===100 || true) &&<FormControlLabel
            disabled={!parentConfirmation.eSign}
            control={
              <Checkbox
                checked={parentConfirmation.eSignRepeat ?? false}
                onChange={e=>setParentConfirmation({...parentConfirmation, eSignRepeat: e.target.checked})}
                name='displayNotice'
                color="primary"
              />
            }
            label='サインの繰り返し使用を許可'
            className='childForm'
          />}
        </>)}
      </div>
    )
  }

  const CellAnySetting = () => {
    return(
      <div className='displayOtherUseDate formParts'>
        <FormControlLabel
          control={
            <Checkbox
              checked={cellHeightChange}
              onChange={e=>setCellHeightChange(e.target.checked)}
              color="primary"
            />
          }
          label='行の高さを抑える'
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={fontSizeChange}
              onChange={e=>setFontSizeChange(e.target.checked)}
              color="primary"
            />
          }
          label='文字を大きめに表示'
        />
      </div>
    )
  }

  const TeikyouJisseki2024Setting = () => {
    const handleChange = (e) => {
      const data = JSON.parse(JSON.stringify(teikyouJisseki2024));
      if(!e.target.checked){
        data.confPerDate = false;
        data.bottomOfPage = false;
        data.printDate = false;
      }
      data.checked = e.target.checked;
      setTeikyouJisseki2024({...data});
    }
    const disabled = !(teikyouJisseki2024.checked ?? stdDate>=LC2024);
    const defaultChecked = teikyouJisseki2024.checked ?? stdDate>=LC2024;
    return(
      <div className='parentConfirmation formParts'>
        <FormControlLabel
          control={
            <Checkbox
              checked={defaultChecked}
              onChange={handleChange}
              name=''
              color="primary"
            />
          }
          label='2024年版を利用する'
        />
        <RadioGroup
          value={teikyouJisseki2024.option ?? "priorityTimetable"}
          onChange={e=>setTeikyouJisseki2024({...teikyouJisseki2024, option: e.target.value})}
        >
          <FormControlLabel className='childForm' value="priorityTimetable" disabled={disabled} control={<Radio color="primary" />} label="計画支援時間を優先して表示する" />
          <FormControlLabel className='childForm' value="displayTimeTable" disabled={disabled} control={<Radio color="primary" />} label="計画支援時間を表示する" />
          <FormControlLabel className='childForm' value="displayScheduleKubunEntyou" disabled={disabled} control={<Radio color="primary" />} label="実績時間と時間区分・延長支援で表示する" />
          <FormControlLabel className='childForm' value="displayScheduleKubun" disabled={disabled} control={<Radio color="primary" />} label="実績時間と時間区分で表示する" />
          <FormControlLabel className='childForm' value="displaySchedule" disabled={disabled} control={<Radio color="primary" />} label="実績時間を表示する" />
          <FormControlLabel className='childForm' value="blank" disabled={disabled} control={<Radio color="primary" />} label="算定時間数を空白にする" />
        </RadioGroup>
      </div>
    )
  }

  const clickSendButton = async() => {
    const comExt = {...com?.ext};
    if(!comExt.reportsSetting) comExt.reportsSetting = {};
    if(!comExt.reportsSetting.teikyouJisseki) comExt.reportsSetting["teikyouJisseki"] = {};
    comExt.reportsSetting.teikyouJisseki["displayAbsence"] = displayAbsence;
    comExt.reportsSetting.teikyouJisseki["displayItems"] = displayItems;
    comExt.reportsSetting.teikyouJisseki["parentConfirmation"] = parentConfirmation;
    comExt.reportsSetting.teikyouJisseki["displayOtherUseDate"] = displayOtherUseDate;
    comExt.reportsSetting.teikyouJisseki["cellHeightChange"] = cellHeightChange;
    comExt.reportsSetting.teikyouJisseki["fontSizeChange"] = fontSizeChange;
    comExt.reportsSetting.teikyouJisseki["teikyouJisseki2024"] = teikyouJisseki2024;
    const params = {
      a: "sendComExt", hid, bid,
      ext: JSON.stringify(comExt)
    }
    const res = await univApiCall(params);
    if(!res?.data?.result){
      setSnack({msg: '保存に失敗しました。', severity: 'warning', id: new Date().getTime()});
      return;
    }
    dispatch(setStore({com: {...com, ext: comExt}}));
    dispatch(setSnackMsg('保存しました。'));
  }

  return(
    <div className={classes.teikyouJisseki}>
      <DisplayItems />
      <ParentConfirmation />
      {/* <DisplayOtherUseDate /> */}
      {stdDate<"2024-01-01" &&<CellAnySetting />}
      <TeikyouJisseki2024Setting />
      <ButtonWrapper handleClick={clickSendButton}/>
    </div>
  )
}

export const CalendarPerUsersSetting = ({allState, setSnack}) => {
  const classes = useStyle();
  const [vertical, setVertical] = useState((() => {
    const state = getUisCookie(uisCookiePos.reportsUsersCalendarVerticalDisplay);
    return state==="1" ?true :false;
  })());
  const DisplayVertical = () => {
    const handleChange = (e) => {
      const value = e.target.checked;
      const cookieVal = value ?"1" :"0";
      setUisCookie(uisCookiePos.reportsUsersCalendarVerticalDisplay, cookieVal);
      setVertical(value);
    }
    
    return(
      <FormControlLabel
        control={
          <Checkbox
            checked={vertical}
            onChange={handleChange}
            name='verticalDisp'
            color="primary"
          />
        }
        label='縦型表示'
      />
    )
  }

  return(
    <div style={{width: 192}}>
      <DisplayVertical />
    </div>
  )
}

const TimetableSetting = ({allState, setSnack}) => {
  const classes = useStyle();
  const dispatch = useDispatch();
  const {com, hid, bid, stdDate} = allState;
  const comEtc = {...com?.etc};
  const comExt = {...com?.ext};
  const [parentConfirmation, setParentConfirmation] = useState(comExt?.reportsSetting?.timetable?.parentConfirmation ?? comEtc?.configReports?.timetable?.parentConfirmation ?? {});

  const ParentConfirmation = () => {
    const handleChange = (e) => {
      const data = JSON.parse(JSON.stringify(parentConfirmation));
      if(!e.target.checked){
        data.printDate = false;
        data.bottomOfPage = false;
      }
      data.checked = e.target.checked;
      setParentConfirmation({...data});
    }
    return(
      <div className='parentConfirmation formParts'>
        <FormControlLabel
          control={
            <Checkbox
              checked={parentConfirmation.checked ?? true}
              onChange={handleChange}
              name='displayNotice'
              color="primary"
            />
          }
          label='利用者確認欄をページ下に印刷する'
        />
        <FormControlLabel
          disabled={parentConfirmation.checked === false}
          control={
            <Checkbox
              checked={parentConfirmation.bottomOfPage}
              onChange={e=>setParentConfirmation({...parentConfirmation, bottomOfPage: e.target.checked})}
              name='displayNotice'
              color="primary"
            />
          }
          label='ページ下の利用者確認欄に氏名を印刷する'
          className='childForm'
        />
        <FormControlLabel
          disabled={parentConfirmation.checked === false}
          control={
            <Checkbox
              checked={parentConfirmation.printDate}
              onChange={e=>setParentConfirmation({...parentConfirmation, printDate: e.target.checked})}
              name='displayNotice'
              color="primary"
            />
          }
          label='ページ下の利用者確認欄に日付を印刷する'
          className='childForm'
        />
      </div>
    )
  }

  const clickSendButton = async() => {
    const comExt = {...com?.ext};
    if(!comExt.reportsSetting) comExt.reportsSetting = {};
    if(!comExt.reportsSetting.timetable) comExt.reportsSetting["timetable"] = {};
    comExt.reportsSetting.timetable["parentConfirmation"] = parentConfirmation;
    const params = {
      a: "sendComExt", hid, bid,
      ext: JSON.stringify(comExt)
    }
    const res = await univApiCall(params);  
    if(!res?.data?.result){
      setSnack({msg: '保存に失敗しました。', severity: 'warning', id: new Date().getTime()});
      return;
    }
    dispatch(setStore({com: {...com, ext: comExt}}));
    dispatch(setSnackMsg('保存しました。'));
  }

  return(
    <div className={classes.teikyouJisseki}>
      <ParentConfirmation />
      <ButtonWrapper handleClick={clickSendButton}/>
    </div>
  )
}

const KeiyakunaiyouSetting = ({allState, setSnack}) => {
  const classes = useStyle();
  const dispatch = useDispatch();
  const {com, hid, bid, stdDate} = allState;
  const comEtc = {...com?.etc};
  const comExt = {...com?.ext};
  const [displayMayor, setDisplayMayor] = useState(comExt?.reportsSetting?.keiyakunaiyou?.displayMayor ?? comEtc?.configReports?.keiyakunaiyou?.displayMayor ?? false);
  const [displayDate, setDisplayDate] = useState(comExt?.reportsSetting?.keiyakunaiyou?.displayDate ?? comEtc?.configReports?.keiyakunaiyou?.displayDate ?? false);

  const DisplayMayor = () => {
    const handleChange = (e) => {
      setDisplayMayor(e.target.checked);
    }
    return(
      <FormControlLabel
        control={
          <Checkbox
            checked={displayMayor}
            onChange={handleChange}
            name='displayName'
            color="primary"
          />
        }
        label='宛先名を表示'
        className='displayName formParts'
      />
    )
  }

  const DisplayDate = () => {
    const handleChange = (e) => {
      setDisplayDate(e.target.checked);
    }
    return(
      <FormControlLabel
        control={
          <Checkbox
            checked={displayDate}
            onChange={handleChange}
            name='displayDate'
            color="primary"
          />
        }
        label='日付を表示'
        className='displayDate formParts'
      />
    )
  }

  const clickSendButton = async() => {
    const comExt = {...com?.ext};
    if(!comExt.reportsSetting) comExt.reportsSetting = {};
    if(!comExt.reportsSetting.keiyakunaiyou) comExt.reportsSetting["keiyakunaiyou"] = {};
    comExt.reportsSetting.keiyakunaiyou["displayMayor"] = displayMayor;
    comExt.reportsSetting.keiyakunaiyou["displayDate"] = displayDate;
    const params = {
      a: "sendComExt", hid, bid,
      ext: JSON.stringify(comExt)
    } 
    const res = await univApiCall(params);
    if(!res?.data?.result){
      setSnack({msg: '保存に失敗しました。', severity: 'warning', id: new Date().getTime()});
      return;
    }
    dispatch(setStore({com: {...com, ext: comExt}}));
    dispatch(setSnackMsg('保存しました。'));
  }

  return(
    <div className={classes.jogenKanri}>
      <div>
        <DisplayMayor />
        <DisplayDate />
      </div>
      <ButtonWrapper handleClick={clickSendButton}/>
    </div>
  )
}

const AllRepoetsSetting = ({allState, setSnack}) => {
  const classes = useStyle();
  const dispatch = useDispatch();
  const {com, hid, bid} = allState;
  const comEtc = {...com?.etc};
  const comExt = {...com?.ext};
  const [hidePersonalInfo, setHidePersonalInfo] = useState(getUisCookie(uisCookiePos.hidePersonalInfo) ?? "2");
  const [convJido, setConvJido] = useState(comExt?.reportsSetting?.convJido ?? comEtc?.configReports?.convJido ?? false);
  const [displayInn, setDiaplayInn] = useState(comExt?.reportsSetting?.displayInn ?? comEtc?.configReports?.displayInn ?? true);

  const HidePersonalInfo = () => {
    const handleChange = (e) => {
      setHidePersonalInfo(e.target.value);
    }
  
    return(
      <FormControl className='hidePersonalInfo formParts'>
        <FormLabel className='label'>個人情報を隠す</FormLabel>
        <RadioGroup
          row
          defaultValue={hidePersonalInfo}
          onChange={handleChange}
        >
          <FormControlLabel value="2" control={<Radio />} label="強く" />
          <FormControlLabel value="1" control={<Radio />} label="弱く" />
          <FormControlLabel value="0" control={<Radio />} label="保護しない"/>
        </RadioGroup>
      </FormControl>
    )
  }

  const ConvertJido = () => {
    const handleChange = (e) => {
      setConvJido(e.target.checked);
    }

    return(
      <FormControlLabel
        control={
          <Checkbox
            checked={convJido}
            onClick={handleChange}
            name='convCheckbox'
            color="primary"
          />
        }
        label='障害児を児童に変換し出力'
        className='convertJido formParts'
      />
    )
  }

  const DisplayInn = () => {
    const handleChange = (e) => {
      setDiaplayInn(e.target.checked);
    }

    return(
      <div>
        <FormControlLabel
          control={
            <Checkbox
              checked={displayInn}
              onClick={handleChange}
              name='displayInn'
              color="primary"
            />
          }
          label='サイン欄に「印」を表示'
          className='convertJido formParts'
        />
      </div>
    )
  }

  const clickSendButton = async() => {
    //個人情報を隠すの値をクッキーに保存
    setUisCookie(uisCookiePos.hidePersonalInfo, hidePersonalInfo);

    const comExt = {...com?.ext};
    if(!comExt.reportsSetting) comExt.reportsSetting = {};
    comExt.reportsSetting.convJido = convJido;
    comExt.reportsSetting.displayInn = displayInn;
    const params = {
      a: "sendComExt", hid, bid,
      ext: JSON.stringify(comExt)
    }
    const res = await univApiCall(params);
    if(!res?.data?.result){
      setSnack({msg: '保存に失敗しました。', severity: 'warning', id: new Date().getTime()});
      return;
    }
    dispatch(setStore({com: {...com, ext: comExt}}));
    dispatch(setSnackMsg('保存しました。'));
  }

  return(
    <div className={classes.allReportsSetting}>
      <HidePersonalInfo />
      <ConvertJido />
      <DisplayInn />
      <ButtonWrapper handleClick={clickSendButton}/>
    </div>
  )
}

const ReportsSetting = () => {
  const classes = useStyle();
  const {settingItem} = useParams();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const [snack, setSnack] = useState({});

  if(!loadingStatus.loaded){
    return (<LoadingSpinner />);
  }else if(loadingStatus.error){
    return (<LoadErr loadStatus={loadingStatus} errorId={'E32592'} />);
  }

  let serviceName = "";
  const mainNode = (() => {
    if(settingItem==="invoice"){
      serviceName = "請求書・受領書";
      return(<InvoiceSetting allState={allState} setSnack={setSnack}/>);
    }else if(settingItem === "jogenKanri"){
      serviceName = "上限管理結果票";
      return(<JogenKanriSetting allState={allState} setSnack={setSnack}/>);
    }else if(settingItem==="teikyouJisseki"){
      serviceName = "提供実績記録票";
      return(<TeikyouJissekiSetting allState={allState} setSnack={setSnack}/>);
    }else if(settingItem==="contractInfo"){
      serviceName = "契約内容報告書"
      return(<UsersContractInfoMain allState={allState} setSnack={setSnack}/>);
    }else if(settingItem==="timetable"){
      serviceName = "計画支援時間"
      return(<TimetableSetting allState={allState} setSnack={setSnack}/>);
    }else if(settingItem==="keiyakunaiyou"){
      serviceName = "契約内容報告書"
      return(<KeiyakunaiyouSetting allState={allState} setSnack={setSnack}/>);
    }else if(settingItem==="all"){
      serviceName = "その他"
      return(<AllRepoetsSetting allState={allState} setSnack={setSnack}/>);
    }else{
      return null
    }
  })();

  //例外
  if(settingItem==="contractInfo"){
    return(
      <>
      {mainNode}
      </>
    )
  }

  return(
    <>
    <GoBackButton posX={90} posY={0} />
    <div className={classes.reportsSetting}>
      <div className='title'>{`${serviceName}の設定`}</div>
      {mainNode}
    </div>
    <SnackMsg {...snack} />
    </>
  )
}
export default ReportsSetting