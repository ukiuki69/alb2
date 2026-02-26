import React, { useRef, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Button, makeStyles, useMediaQuery } from "@material-ui/core";
import { GoBackButton, LinksTab, LoadingSpinner } from '../../common/commonParts';
import SnackMsg from '../../common/SnackMsg';
import { useDispatch, useSelector } from 'react-redux';
import { checkSchListInputBasicDt, MediaQueryGoBackButton, SchListInputBasicFormHeaderRow, SchListInputBasicFormRow, SchListInputKasanFormHeaderRow, SchListInputKasanFormRow, updateSchListInputBasicDt, updateSchListInputKasanDt, useGetDid, useSchListInputStyles } from './SchListInputCommon';
import { getFormDatas, getLodingStatus } from '../../../commonModule';
import { makeSchMenuFilter, menu, extMenu } from '../Sch2';
import { SchDaySettingMenuTitle } from '../SchDaySettingNoDialog';
import { setSnackMsg, setStore } from '../../../Actions';
import { sendPartOfSchedule, setRecentUser } from '../../../albCommonModule';
import { SchListInputSettingButton, useGetSchListInputSettingLSItem } from './SchListInputSetting';
import { setLocalStorageItemWithTimeStamp } from '../../../modules/localStrageOprations';

const useGetUids = () => {
  const {uids} = useParams();
  return uids ?uids.split(",") :[];
}

const useStyles = makeStyles({
  AppPage: {
    '& .names': {
      marginBottom: 24,
      display: 'flex', justifyContent: 'center',
      '& .name': {padding: 8},
      '& .sama': {fontSize: 12, marginLeft: 4}
    }
  },
  Buttons: {
    textAlign: 'end',
    margin: '16px 0',
    '& .button': {
      width: 112,
      '&:not(:last-child)': {
        marginRight: 8
      }
    }
  }
})

const FormHeader = () => {
  const {formType} = useParams();

  return(
    <div className='formHeader'>
      <div className='row'>
        {formType==="basic" &&<SchListInputBasicFormHeaderRow />}
        {formType==="kasan" &&<SchListInputKasanFormHeaderRow />}
      </div>
    </div>
  );
}

const FormBody = () => {
  const did = useGetDid();
  const uid = useGetUids()[0];
  const {formType} = useParams();

  return(
    <div className='formBody'>
      <div className='row'>
        {formType==="basic" &&<SchListInputBasicFormRow uid={uid} did={did} />}
        {formType==="kasan" &&<SchListInputKasanFormRow uid={uid} did={did} />}
      </div>
    </div>
  )
}

const CancelButton = () => {
  const history = useHistory();
  const {date} = useParams();

  const handleCancel = () => {
    history.push(`/schedule/listinput/perdate/${date}/`);
  }

  return(
    <Button
      variant='contained'
      color='secondary'
      onClick={handleCancel}
      className='button'
    >
      キャンセル
    </Button>
  )
}

const SendButton = ({formRef}) => {
  const dispatch = useDispatch();
  const schedule = useSelector(state => state.schedule);
  const stdDate = useSelector(state => state.stdDate);
  const service = useSelector(state => state.service);
  const com = useSelector(state => state.com);
  const config = useSelector(state => state.config);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const serviceItems = useSelector(state => state.serviceItems);
  const [snack, setSnack] = useState({});
  const history = useHistory();
  const {formType, date} = useParams();
  const did = useGetDid();
  const uids = useGetUids();
  const hideOnTabelEdit = useGetSchListInputSettingLSItem();

  const handleSubmit = async() => {
    const inputs = formRef.current.querySelectorAll('input');
    const selects = formRef.current.querySelectorAll('select');
    const formDt = getFormDatas([inputs, selects]);
    const dt = Object.entries(formDt).reduce((prevDt, [key, val]) => {
      if(key.includes("-")){
        const newKey = key.split("-")[1];
        prevDt[newKey] = val;
      }else{
        prevDt[key] = val;
      }
      return prevDt;
    }, {});

    // formDtの値を確認。
    if(dt.start && dt.end && !checkSchListInputBasicDt(dt)){
      setSnack({msg: "時刻が不正です。", severity: 'warning', id: new Date().getTime()});
      return;
    }

    const newSch = uids.reduce((prevNewSch, uid) => {
      const uidStr = "UID" + uid;
      const sch = JSON.parse(JSON.stringify(schedule[uidStr] ?? {}));
      if(!sch[did]) sch[did] = {};
      const schDt = sch[did];

      if(formType === "basic") updateSchListInputBasicDt(dt, schDt, com, config, stdDate, service, serviceItems, hideOnTabelEdit);
      if(formType === "kasan") updateSchListInputKasanDt(dt, schDt);

      setRecentUser(uidStr);
      setLocalStorageItemWithTimeStamp(bid + uidStr + did, true);
      prevNewSch[uidStr] = sch;
      return prevNewSch;
    }, {});

    const apiParams = {hid, bid, date: stdDate, partOfSch: newSch};
    const res = await sendPartOfSchedule(apiParams, '', setSnack);
    if(res?.data?.result){
      dispatch(setStore({schedule: {...schedule, ...newSch}}));
      dispatch(setSnackMsg('書き込みました。'));
      history.push(`/schedule/listinput/perdate/${date}/`);
    }else{
      // 書き込み失敗
      setSnack({msg: "書き込みに失敗しました。もう一度お試しください。", severity: 'warning'});
    }
  }

  return(
    <>
    <Button
      variant='contained'
      color='primary'
      onClick={handleSubmit}
      className='button'
    >
      書き込み
    </Button>
    <SnackMsg {...snack} />
    </>
  )
}

const Buttons = ({formRef}) => {
  const classes = useStyles();

  return(
    <div className={classes.Buttons}>
      <CancelButton />
      <SendButton formRef={formRef} />
    </div>
  )
}

const MainForm = () => {
  const classes = useSchListInputStyles();
  const formRef = useRef(null);

  return(
    <div className={classes.MainForm}>
      <form ref={formRef}>
        <FormHeader />
        <FormBody />
        <Buttons formRef={formRef} />
      </form>
    </div>
  )
}

export const SchListInputPerDateMult = () => {
  const isLimit1400px = useMediaQuery("(max-width:1400px)");
  const classes = useStyles();
  const schListInputClasses = useSchListInputStyles();
  const history = useHistory();
  const {date} = useParams();
  const targetUids = useGetUids();
  const allState = useSelector(state => state);
  const {stdDate, users} = allState;

  if(!date){
    history.push("/schedule/");
    return null;
  }
  if(!getLodingStatus(allState).loaded) return(<LoadingSpinner />);

  const [stdYear, stdMonth] = stdDate.split("-");
  const dateStr = String(date).padStart(2, '0');
  const targetDate = `${stdYear}-${stdMonth}-${dateStr}`;
  const targetNames = targetUids.slice(0, 3).map(uid => users.find(uDt => uDt.uid === uid)?.name ?? "名前未登録");

  return(
    <>
    <LinksTab menu={menu} menuFilter={makeSchMenuFilter(stdDate)} extMenu={extMenu} />
    <div className={`${schListInputClasses.AppPage} ${classes.AppPage}`}>
      <MediaQueryGoBackButton maxWidth="1400px" urlPath={`/schedule/listinput/perdate/${date}/`} />
      <SchDaySettingMenuTitle title="日付別一覧入力（一括）" targetDate={targetDate} />
      <div className='names'>
        {targetNames.map(name => (
          <div key={name} className='name'>
            <span>{name}</span>
            <span className='sama'>様</span>
          </div>
        ))}
        {targetUids.slice(3).length > 0 &&<div className='name'>他{targetUids.slice(3).length}名</div>}
      </div>
      <MainForm />
      <SchListInputSettingButton />
    </div>
    {!isLimit1400px &&<GoBackButton posY={0} posX={120} url={`/schedule/listinput/perdate/${date}/`} />}
    </>
  )
}