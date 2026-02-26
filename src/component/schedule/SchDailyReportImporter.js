import axios from 'axios';
import React, {useState, useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { JIHATSU } from '../../modules/contants';
import { endPoint, schLocked, sendPartOfSchedule, setRecentUser } from '../../albCommonModule';
import { makeUrlSearchParams } from '../../commonModule';
import { setSnackMsg, setStore } from '../../Actions';
import { Button, CircularProgress, makeStyles } from '@material-ui/core';
import { teal } from '@material-ui/core/colors';
import SnackMsg from '../common/SnackMsg';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { getJikanKubunAndEnchou } from '../../modules/elapsedTimes';
import { setLocalStorageItemWithTimeStamp } from '../../modules/localStrageOprations';

const MAX_RETRY = 5;
const FETCH_INTERVAL_TIME = 60 * 1000 * 30; // fetchTimeStampsのコール間隔用 30分
const TIMEOUT_TIME = 30 * 1000; // タイムアウト 30秒

/**
 * 予定データ・連絡帳データ・日報データの更新タイムスタンプを取得
 * @param {String} hid 
 * @param {String} bid 
 * @param {String} stdDate 
 * @returns 
 */
const fetchTimeStamps = async(hid, bid, stdDate, setSnack) => {
  let isFailed = false;
  const params = {a: "fetchTimeStamps", hid, bid, date: stdDate};
  for(let retry=1; retry<=MAX_RETRY; retry++){
    try{
      const res = await axios.post(endPoint(), makeUrlSearchParams(params));
      if(res?.data?.result){
        // fetchTimeStamps 成功
        const timestampDt = res?.data?.dt?.[0] ?? {};
        return timestampDt;
      }
      if(retry+1 === MAX_RETRY){
        // 繰り返し制限を超えた場合は、エラーとして返す。
        isFailed = true;
      }
    }catch(error){
      console.error(`Error during attempt ${retry}:`, error);
      if(retry+1 === MAX_RETRY){
        // 繰り返し制限を超えた場合は、エラーとして返す。
        isFailed = true;
      }
    }
  }
  if(isFailed){
    const errorMsg = 'データ通信に失敗しました。\n'
      + 'このメッセージが複数回表示されるときは管理者またはサポートに連絡してください。';
    setSnack({msg: errorMsg, severity:'error', errorId:'DR1610'});
  }
}

const fetchDailyReport = async(hid, bid, stdDate, setSnack) => {
  let isFailed = false;
  const params = {"a": "fetchDailyReport", hid, bid, date: stdDate};
  for(let retry=1; retry<=MAX_RETRY; retry++){
    try{
      const res = await axios.post(endPoint(), makeUrlSearchParams(params));
      if(res?.data?.result){
        // fetchDailyReport 成功
        const dailyReport = res?.data?.dt?.[0]?.dailyreport;
        return checkValueType(dailyReport, 'Object') ?dailyReport :{};
      }
      if(retry+1 === MAX_RETRY){
        // 繰り返し制限を超えた場合は、エラーとして返す。
        isFailed = true;
      }
    }catch(error){
      console.error(`Error during attempt ${retry}:`, error);
      if(retry+1 === MAX_RETRY){
        // 繰り返し制限を超えた場合は、エラーとして返す。
        isFailed = true;
      }
    }
  }
  if(isFailed){
    const errorMsg = 'データ通信に失敗しました。\n'
      + 'このメッセージが複数回表示されるときは管理者またはサポートに連絡してください。';
    setSnack({msg: errorMsg, severity:'error', errorId:'DR1611'});
  }
}

const fetchSchedule = async(hid, bid, stdDate, setSnack) => {
  let isFailed = false;
  const params = {"a": "fetchSchedule", hid, bid, date: stdDate};
  for(let retry=0; retry<MAX_RETRY; retry++){
    try{
      const res = await axios.post(endPoint(), makeUrlSearchParams(params));
      const schedule = res?.data?.dt?.[0]?.schedule;
      if(res?.data?.result && checkValueType(schedule, 'Object') && Object.keys(schedule).length){
        // fetchSchedule成功
        return schedule;
      }
      if(retry+1 === MAX_RETRY){
        // 繰り返し制限を超えた場合は、エラーとして返す。
        isFailed = true;
      }
    }catch(error){
      console.error(`Error during attempt ${retry}:`, error);
      if(retry+1 === MAX_RETRY){
        // 繰り返し制限を超えた場合は、エラーとして返す。
        isFailed = true;
      }
    }
  }
  if(isFailed){
    const errorMsg = 'データ通信に失敗しました。\n'
      + 'このメッセージが複数回表示されるときは管理者またはサポートに連絡してください。';
    setSnack({msg: errorMsg, severity:'error', errorId:'DR1612'});
  }
}

const useScheduleWithDailyReportSyncer = (setSnack, onClose) => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const com = useSelector(state => state.com);
  const dispatch = useDispatch();

  // 予定実績に日報データを同期する処理。
  const syncScheduleWithDailyReport = async() => {
    // 予定実績データを取得
    const schedule = await fetchSchedule(hid, bid, stdDate, setSnack);
    if(!schedule){
      onClose()
      return;
    }
    // 日報データを取得
    const dailyReport = await fetchDailyReport(hid, bid, stdDate, setSnack);
    if(!dailyReport){
      onClose()
      return;
    }

    const updateUids = [];
    const newSchedule = JSON.parse(JSON.stringify(schedule));
    for(const uidStr of Object.keys(newSchedule)){
      // UIDxxx形式でないものは無視
      if(!/^UID[0-9]+$/.test(uidStr)) continue;

      let updated = false;
      for(const dDate of Object.keys(newSchedule[uidStr])){
        // Dyyyymmdd形式のデータ以外は無視
        if(!/^D[0-9]{8}$/.test(dDate)) continue;
        // 予定実績がロックされているデータは無視
        if(schLocked(schedule, users, null, dDate, service, classroom)) continue;

        // 予定データ
        const schDt = newSchedule[uidStr][dDate];
        // 日報データ
        const data = dailyReport?.[uidStr]?.[dDate] ?? {};

        // 日報にデータがない場合は無視
        if(!data) continue;

        let updatedDid = false;
        if(data.start && data.start !== schDt.start){
          // 開始時刻
          schDt.start = data.start;

          const autoSetting = com?.addiction?.[service]?.時間区分延長支援自動設定;
          const jikankubunAuto = parseInt(autoSetting) >= 1;
          const enchouShienAuto = parseInt(autoSetting) >= 2;
          const syncJikanKubun = com?.ext?.schDailyReportSetting?.syncJikanKubun ?? false;
          const syncEnchouShien = com?.ext?.schDailyReportSetting?.syncEnchouShien ?? false;
          const useKubun3 = service === JIHATSU || schDt.offSchool === 1;
          const t = getJikanKubunAndEnchou(data.start, data.end ?? schDt.end, useKubun3);
          if (!schDt.dAddiction) schDt.dAddiction = {};
          if (syncJikanKubun && jikankubunAuto){
            schDt.dAddiction.時間区分 = t.区分;
            schDt.時間区分 = t.区分;
          }
          if (syncEnchouShien && enchouShienAuto && t.延長支援){
            schDt.dAddiction.延長支援 = t.延長支援;
            schDt.延長支援 = t.延長支援;
          }

          updatedDid = true;
        }
        if(data.end && data.end !== schDt.end){
          // 終了時刻
          schDt.end = data.end;
          const autoSetting = com?.addiction?.[service]?.時間区分延長支援自動設定;
          const jikankubunAuto = parseInt(autoSetting) >= 1;
          const enchouShienAuto = parseInt(autoSetting) >= 2;
          const syncJikanKubun = com?.ext?.schDailyReportSetting?.syncJikanKubun ?? false;
          const syncEnchouShien = com?.ext?.schDailyReportSetting?.syncEnchouShien ?? false;
          const useKubun3 = service === JIHATSU || schDt.offSchool === 1;
          const t = getJikanKubunAndEnchou(data.start ?? schDt.start, data.end, useKubun3);
          if (!schDt.dAddiction) schDt.dAddiction = {};
          if (syncJikanKubun && jikankubunAuto){
            schDt.dAddiction.時間区分 = t.区分;
            schDt.時間区分 = t.区分;
          }
          if (syncEnchouShien && enchouShienAuto && t.延長支援){
            schDt.dAddiction.延長支援 = t.延長支援;
            schDt.延長支援 = t.延長支援;
          }

          updatedDid = true;
        }
        if(checkValueType(data.pickupLocation, "String") && data.pickupLocation!==schDt.transfer[0]){
          // 迎え先
          schDt.transfer[0] = data.pickupLocation;
          updatedDid = true;
        }
        if(checkValueType(data.dropoffLocation, "String") && data.dropoffLocation!==schDt.transfer[1]){
          // 送り先
          schDt.transfer[1] = data.dropoffLocation;
          updatedDid = true;
        }
        if(updatedDid){
          updated = true;
          setLocalStorageItemWithTimeStamp(bid + uidStr + dDate, true);
        }
      }
      if(updated){
        updateUids.push(uidStr);
        setRecentUser(uidStr);
      }
    }

    // 送信するスケジュールデータを集める
    const sendDt = updateUids.reduce((dt, uidStr) => {
      dt[uidStr] = newSchedule[uidStr]
      return dt;
    }, {});

    const dailyreportImported = new Date().getTime();
    sendDt.dailyreportImported = dailyreportImported;
    const params = {hid, bid, date: stdDate, partOfSch: sendDt};
    sendPartOfSchedule(params, '', setSnack, '日報と同期しました。', '同期に失敗しました。').then(res => {
      if(res?.data?.result){
        newSchedule.dailyreportImported = dailyreportImported;
        dispatch(setStore({schedule: newSchedule}));
        dispatch(setSnackMsg('日報と同期しました。', '', ''));
        onClose();
      }
    });
  }

  return syncScheduleWithDailyReport;
}

const useStyles = makeStyles({
  schDailyReportImporter: {
    zIndex: 1000,
    '& .background': {
      position: 'fixed',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      zIndex: 9998,
      display: 'flex', flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'center',
      color: '#333',
    }
  },
  updateDialog: {
    position: 'fixed', bottom: 24, left: 24, zIndex: 9999,
    width: 300, backgroundColor: '#fff',
    border: `2px ${teal[800]} solid`, borderRadius: 4,
    '& .header': {
      backgroundColor: teal[800],
      color: '#fff', textAlign: 'center',
      padding: 8
    },
    '& .contents': {
      padding: 8,
      '& .explain': {
        marginBottom: 8,
        lineHeight: 1.5
      },
      '& .buttons': {
        textAlign: 'end'
      },
      '& .updating': {
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        height: 36.5,
      }
    }
  }
});

const UpdateDialog = (props) => {
  const classes = useStyles();
  const {onClose, setSnack} = props;
  const [updating, setUpdating] = useState(false);
  const syncScheduleWithDailyReport = useScheduleWithDailyReportSyncer(setSnack, onClose);

  return(
    <div className={classes.updateDialog}>
      <div className='header'>更新があります</div>
      <div className='contents'>
        <div className='explain'>
          日報の更新があります。<br />
          更新ボタンを押すと、予定実績を更新します。
        </div>
        {!updating &&<div className='buttons'>
          <Button
            variant='contained'
            color='secondary'
            onClick={onClose}
            disabled={updating}
          >
            キャンセル
          </Button>
          <Button
            variant='contained'
            color="primary"
            onClick={() => {
              setUpdating(true);
              syncScheduleWithDailyReport();
            }}
            style={{
              marginLeft: 8,
            }}
            disabled={updating}
          >
            更新
          </Button>
        </div>}
        {updating &&<div className='updating'>
          <div>更新中</div>
          <CircularProgress style={{width: 16, height: 16, marginLeft: 4}}/>
        </div>}
      </div>
    </div>
  )
}

export const SchDailyReportImporter = () => {
  const classes = useStyles();
  const allState = useSelector(state => state);
  const {hid, bid, stdDate, schedule, com} = allState;
  const [snack, setSnack] = useState({});
  const [timestampDt, setTimestampDt] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const handleClose = () => {
    setDialogOpen(false);
  }
  const syncScheduleWithDailyReport = useScheduleWithDailyReportSyncer(setSnack, handleClose);

  const schDailyReportSetting = com?.ext?.schDailyReportSetting ?? {};
  const syncSetting = schDailyReportSetting.sync ?? "check";
  const noneSyncTarget = (
    schDailyReportSetting.pickupLocation === false
    && schDailyReportSetting.pickup === false
    && schDailyReportSetting.start === false
    && schDailyReportSetting.end === false
    && schDailyReportSetting.dropoff === false
    && schDailyReportSetting.dropoffLocation === false
  );

  useEffect(() => {
    let isMounted = true;
    if(!dialogOpen) return;
    // ダイアログ表示後TIMEOUT_TIME秒後、非表示
    const timeoutId = setTimeout(() => {
      if(isMounted) setDialogOpen(false);
    }, TIMEOUT_TIME);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    }
  }, [dialogOpen]);

  useEffect(() => {
    let isMounted = true;

    // 日報同期設定が同期しないになっている場合処理を行わない
    if(syncSetting === "no") return;

    // 同期対象が全て非表示設定の場合は同期しない。
    if(noneSyncTarget) return;

    // 日報にタイムスタンプがない場合処理しない
    const dailyreportTimestamp= timestampDt?.ahddailyreport;
    if(!dailyreportTimestamp) return;

    const dailyreportImportedTimestamp = schedule?.dailyreportImported;
    if(dailyreportImportedTimestamp){
      if(parseInt(dailyreportTimestamp) >= parseInt(dailyreportImportedTimestamp)){
        if(syncSetting === "auto"){
          if(isMounted) syncScheduleWithDailyReport();
          return;
        }
        // 予定と日報のタイムスタンプを比較し、日報の方が新しい場合はダイアログを表示
        setDialogOpen(true);
      }
    }else{
      // dailyreportImportedTimestampがないときは強制的に更新画面
      setDialogOpen(true);
    }
    return () => {
      isMounted = false;
    }
  }, [timestampDt]);

  useEffect(() => {
    let isMounted = true;
    const safeSetSnack = (snack) => {
      if (isMounted) setSnack(snack);
    };
    // FETCH_INTERVAL_TIME秒ごとにtimestampを取得する。
    fetchTimeStamps(hid, bid, stdDate, safeSetSnack).then(data => {
      if(isMounted){
        if(data) setTimestampDt(data);
        else handleClose();
      }
    });
    const fetched = setInterval(() => {
      fetchTimeStamps(hid, bid, stdDate, safeSetSnack).then(data => {
        if(isMounted){
          if(data) setTimestampDt(data);
          else handleClose();
        }
      });
    }, FETCH_INTERVAL_TIME);
    return () => {
      isMounted = false;
      clearInterval(fetched);
    }
  }, []);

  return(
    <>
    {dialogOpen &&(
      <div className={classes.schDailyReportImporter}>
        <div className='background'/>
        <UpdateDialog setSnack={setSnack} onClose={handleClose} />
      </div>
    )}
    <SnackMsg {...snack} />
    </>
  );
}