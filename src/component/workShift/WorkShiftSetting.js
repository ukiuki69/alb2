import React, { useRef, useState } from 'react';
import SnackMsg from "../common/SnackMsg";
import { LICENSE_LIST, WORK_SHIFT_END_TIME, WORK_SHIFT_START_TIME, WorkShiftLinksTab } from "./WorkShiftCommon";
import { Checkbox, FormControlLabel, makeStyles } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { getLodingStatus } from '../../commonModule';
import { LoadingSpinner } from '../common/commonParts';
import { CntbkCancelButton, CntbkSendButton } from '../ContactBook/CntbkCommon';
import { resetStore, setSnackMsg, setStore } from '../../Actions';
import { teal } from '@material-ui/core/colors';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { univApiCall } from '../../albCommonModule';
import { TimePickers } from '../common/HashimotoComponents';

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
    '& .settingForm': {
      '& .header': {
        width: '100%',
        padding: '12px 16px 8px',
        borderBottom: `1px solid ${teal[900]}`,
        backgroundColor: teal[50]
      },
      '& .body': {
        padding: '12px 16px 8px',
        '& .content': {
          display: 'flex', alignItems: 'flex-satrt',
          '& .subTitle': {
            width: '196px',
            marginTop: '23.5px', marginRight: '16px'
          }
        }
      },
    }
  },
});

const HoudayBasicSettings = () => {
  const com = useSelector(state => state.com);
  const setting = com?.ext?.workShift?.setting ?? {};
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const serviceHours = setting.serviceHours?.[displayService] ?? {};
  const businessHours = setting.businessHours?.[displayService] ?? {};
  return(
    <div id="basic" className='settingForm'>
      <div className='header'>営業時間等設定</div>
      <div className='body'>
        <div className='content'>
          <div className='subTitle'><span style={{marginRight: '4px'}}>(平日)</span>営業時間</div>
          <TimePickers rootName="businessHours" defaultStart={businessHours.start ?? WORK_SHIFT_START_TIME} defaultEnd={businessHours.end ?? WORK_SHIFT_END_TIME} />
        </div>
        <div className='content'>
          <div className='subTitle'><span style={{marginRight: '4px'}}>(平日)</span>サービス提供時間</div>
          <TimePickers rootName="serviceHours" defaultStart={serviceHours.start ?? WORK_SHIFT_START_TIME} defaultEnd={serviceHours.end ?? WORK_SHIFT_END_TIME} />
        </div>
        <div className='content'>
          <div className='subTitle'><span style={{marginRight: '4px'}}>(休日)</span>営業時間</div>
          <TimePickers rootName="holidayBusinessHours" defaultStart={businessHours.holidayStart ?? WORK_SHIFT_START_TIME} defaultEnd={businessHours.holidayEnd ?? WORK_SHIFT_END_TIME} />
        </div>
        <div className='content'>
          <div className='subTitle'><span style={{marginRight: '4px'}}>(休日)</span>サービス提供時間</div>
          <TimePickers rootName="holidayServiceHours" defaultStart={serviceHours.holidayStart ?? WORK_SHIFT_START_TIME} defaultEnd={serviceHours.holidayEnd ?? WORK_SHIFT_END_TIME} />
        </div>
      </div>
    </div>
  )
}

const JihathuBasicSettings = () => {
  const com = useSelector(state => state.com);
  const setting = com?.ext?.workShift?.setting ?? {};
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];
  const serviceHours = setting.serviceHours?.[displayService] ?? {};
  const businessHours = setting.businessHours?.[displayService] ?? {};
  return(
    <div id="basic" className='settingForm'>
      <div className='header'>基本設定</div>
      <div className='body'>
        <div className='content'>
          <div className='subTitle'>営業時間</div>
          <TimePickers rootName="businessHours" defaultStart={businessHours.start} defaultEnd={businessHours.end} />
        </div>
        <div className='content'>
          <div className='subTitle'>サービス提供時間</div>
          <TimePickers rootName="serviceHours" defaultStart={serviceHours.start} defaultEnd={serviceHours.end} />
        </div>
      </div>
    </div>
  )
}

const DisplayLicenseSetting = () => {
  const com = useSelector(state => state.com);
  const displayLicense = com?.ext?.workShift?.setting?.displayLicense ?? {};

  const checkboxes = LICENSE_LIST.map(license => (
    <FormControlLabel
      control={
        <Checkbox
          defaultChecked={displayLicense[license] ?? true}
          name={license}
          color='primary'
          className='displayLicense'
        />
      }
      label={license}
      key={license}
    />
  ))

  return(
    <div id="displayLicense" className='settingForm'>
      <div className='header'>有資格者等配置表示設定</div>
      <div className='body'>
        {checkboxes}
      </div>
    </div>
  )
}

const Buttons = ({formRef, setSnack}) => {
  const dispatch = useDispatch();
  const com = useSelector(state => state.com);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];

  const handleSubmit = async() => {
    if(!formRef.current) return;
    const settingFormNodes = formRef.current.getElementsByClassName("settingForm");
    const setting = com?.ext?.workShift?.setting ?? {};
    for(const settingForm of settingFormNodes){
      switch(settingForm.getAttribute("id")){
        case "basic": {
          // （平日）サービス提供時間
          const serviceHoursDt = setting?.serviceHours?.[displayService] ?? {};
          const serviceHours = settingForm.querySelector("[name='serviceHours']");
          if(serviceHours){
            const inputs = serviceHours.getElementsByTagName("input");
            for(const input of inputs){
              const name = input.getAttribute("name");
              serviceHoursDt[name] = input.value;
            }
          }
          // （休日）サービス提供時間
          const holidayServiceHours = settingForm.querySelector("[name='holidayServiceHours']");
          if(holidayServiceHours){
            const inputs = holidayServiceHours.getElementsByTagName("input");
            for(const input of inputs){
              let name = input.getAttribute("name");
              if(name === "start") name = "holidayStart";
              if(name === "end") name = "holidayEnd";
              serviceHoursDt[name] = input.value;
            }
          }
          if(!setting.serviceHours) setting.serviceHours = {};
          setting.serviceHours[displayService] = serviceHoursDt;
          // （平日）営業時間
          const businessHourDt = setting?.businessHours?.[displayService] ?? {};
          const businessHours = settingForm.querySelector("[name='businessHours']");
          if(businessHours){
            const inputs = businessHours.getElementsByTagName("input");
            for(const input of inputs){
              const name = input.getAttribute("name");
              businessHourDt[name] = input.value;
            }
          }
          // （休日）営業時間
          const holidayBusinessHours = settingForm.querySelector("[name='holidayBusinessHours']");
          if(holidayBusinessHours){
            const inputs = holidayBusinessHours.getElementsByTagName("input");
            for(const input of inputs){
              let name = input.getAttribute("name");
              if(name === "start") name = "holidayStart";
              if(name === "end") name = "holidayEnd";
              businessHourDt[name] = input.value;
            }
          }
          if(!setting.businessHours) setting.businessHours = {};
          setting.businessHours[displayService] = businessHourDt;
          break;
        }
        case "displayLicense": {
          const displayLicense = {};
          const displayLicenseNodes = settingForm.getElementsByClassName("displayLicense");
          for(const node of displayLicenseNodes){
            const checkbox = node.getElementsByTagName("input")[0];
            displayLicense[checkbox.name] = checkbox.checked;
          }
          setting.displayLicense = displayLicense;
          break;
        }
      }
    }
    const comExt = checkValueType(com?.ext, "Object") ?com.ext :{};
    if(!checkValueType(comExt.workShift, "Object")) comExt.workShift = {};
    comExt.workShift.setting = setting;
    const params = {
      a: "sendComExt", hid, bid,
      ext: JSON.stringify(comExt)
    }
    const res = await univApiCall(params);
    if(res?.data?.result){
      dispatch(setStore({com: {...com, ext: comExt}}));
      dispatch(setSnackMsg("保存しました。"));
    }else{
      setSnack({msg: "保存に失敗しました。", severity: 'warning'})
    }
  }

  return(
    <div style={{textAlign: 'end'}}>
      <CntbkCancelButton handleClick={() => dispatch(resetStore())}/>
      <CntbkSendButton label="保存" handleClick={handleSubmit} style={{marginLeft: 12}} />
    </div>
  )
}

const WorkShiftSetting = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const formRef = useRef(null);
  const classes = useStyles();
  const [snack, setSnack] = useState({});
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service || serviceItems[0];

  if(!loadingStatus.loaded) return(
    <>
    <WorkShiftLinksTab />
    <LoadingSpinner />
    </>
  )

  return(
    <>
    <WorkShiftLinksTab />
    <div className={classes.AppPage}>
      <form ref={formRef}>
        {displayService==="放課後等デイサービス" &&<HoudayBasicSettings />}
        {displayService==="児童発達支援" &&<JihathuBasicSettings />}
        <DisplayLicenseSetting />
        <Buttons formRef={formRef} setSnack={setSnack} />
      </form>
    </div>
    <SnackMsg {...snack}/>
    </>
  )
}
export default WorkShiftSetting;