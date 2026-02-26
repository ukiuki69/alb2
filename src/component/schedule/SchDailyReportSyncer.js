import axios from 'axios';
import React, {useState, useEffect} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { JIHATSU } from '../../modules/contants';
import { endPoint, schLocked, sendPartOfSchedule, setRecentUser, univApiCall } from '../../albCommonModule';
import { getLodingStatus, makeUrlSearchParams, parsePermission } from '../../commonModule';
import { resetStore, setSnackMsg, setStore } from '../../Actions';
import SnackMsg from '../common/SnackMsg';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { getJikanKubunAndEnchou } from '../../modules/elapsedTimes';
import { setLocalStorageItemWithTimeStamp } from '../../modules/localStrageOprations';
import { useLocation, } from 'react-router-dom';
import AccessTimeIcon from '@material-ui/icons/AccessTime';

const MAX_RETRY = 5;

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
  for(let retry=0; retry<MAX_RETRY; retry++){
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

const SchDailyReportSyncer = () => {
  const pathname = useLocation().pathname;
  const dispatch = useDispatch();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {hid, bid, stdDate, com, users, service, classroom, account} = allState;
  const permission = parsePermission(account)[0][0];
  const [snack, setSnack] = useState({});
  const [syncing, setSyncing] = useState(false); // 追加

  const schDailyReportSetting = com?.ext?.schDailyReportSetting ?? {};
  // 同期設定 auto:同期を行う no:同期を行わない
  const syncSetting = schDailyReportSetting?.sync ?? "auto";

  // 予定実績に日報データを同期する処理。
  const syncScheduleWithDailyReport = async() => {
    try {
      // 予定実績データを取得
      const schedule = await fetchSchedule(hid, bid, stdDate, setSnack);
      if(!schedule) return false;
      // 日報データを取得
      const dailyReport = await fetchDailyReport(hid, bid, stdDate, setSnack);
      if(!dailyReport) return false;
      setSyncing(true); // 同期開始

      const updateUids = [];
      const newSchedule = JSON.parse(JSON.stringify(schedule));
      const newDairlyReport = JSON.parse(JSON.stringify(dailyReport));
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
          // 予定データの型がオブジェクトでない場合は無視
          if(!checkValueType(schDt, 'Object')) continue;
          // 保育訪問の予定は無視
          if(schDt?.service === '保育所等訪問支援') continue;

          // 日報データ
          const dailyReportDt = newDairlyReport?.[uidStr]?.[dDate];
          // 日報にデータがない場合は無視
          if(!checkValueType(dailyReportDt, 'Object')) continue;
          
          // 両方タイムスタンプがない場合は同期処理をしない。
          if(!dailyReportDt?.timestamp && !schDt?.timestamp) continue;

          // 予定実績画面を開いている
          if(pathname.includes("schedule")){
            // 日報データにタイムスタンプがない場合は同期しない。
            if(!dailyReportDt?.timestamp) continue;
            // 日報データより予定データの方が新しい場合は同期しない。
            if(schDt?.timestamp && schDt?.timestamp >= dailyReportDt?.timestamp) continue;

            let updatedDid = false;
            // 開始時刻同期
            if(dailyReportDt.start && dailyReportDt.start !== schDt.start){
              schDt.start = dailyReportDt.start;

              const autoSetting = com?.addiction?.[service]?.時間区分延長支援自動設定;
              const jikankubunAuto = parseInt(autoSetting) >= 1;
              const enchouShienAuto = parseInt(autoSetting) >= 2;
              const syncJikanKubun = com?.ext?.schDailyReportSetting?.syncJikanKubun ?? false;
              const syncEnchouShien = com?.ext?.schDailyReportSetting?.syncEnchouShien ?? false;
              const useKubun3 = service === JIHATSU || schDt.offSchool === 1;
              const t = getJikanKubunAndEnchou(dailyReportDt.start, dailyReportDt.end ?? schDt.end, useKubun3);
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
            // 終了時刻同期
            if(dailyReportDt.end && dailyReportDt.end !== schDt.end){
              schDt.end = dailyReportDt.end;

              const autoSetting = com?.addiction?.[service]?.時間区分延長支援自動設定;
              const jikankubunAuto = parseInt(autoSetting) >= 1;
              const enchouShienAuto = parseInt(autoSetting) >= 2;
              const syncJikanKubun = com?.ext?.schDailyReportSetting?.syncJikanKubun ?? false;
              const syncEnchouShien = com?.ext?.schDailyReportSetting?.syncEnchouShien ?? false;
              const useKubun3 = service === JIHATSU || schDt.offSchool === 1;
              const t = getJikanKubunAndEnchou(dailyReportDt.start ?? schDt.start, dailyReportDt.end, useKubun3);
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
            // 迎え先同期
            if(checkValueType(dailyReportDt.pickupLocation, "String") && dailyReportDt.pickupLocation !== schDt.transfer[0]){
              schDt.transfer[0] = dailyReportDt.pickupLocation;
              updatedDid = true;
            }
            // 送り先同期
            if(checkValueType(dailyReportDt.dropoffLocation, "String") && dailyReportDt.dropoffLocation !== schDt.transfer[1]){
              schDt.transfer[1] = dailyReportDt.dropoffLocation;
              updatedDid = true;
            }

            if(updatedDid){
              updated = true;
              schDt.timestamp = new Date().getTime();
              setLocalStorageItemWithTimeStamp(bid + uidStr + dDate, true);
            }
          }

          // 日報画面を開いている
          if(pathname.includes("dailyreport")){
            if(!schDt?.timestamp) continue;
            if(dailyReportDt?.timestamp && dailyReportDt?.timestamp >= schDt?.timestamp) continue;

            let updatedDid = false;
            // 開始時刻同期
            if(schDt.start && schDt.start !== dailyReportDt.start){
              dailyReportDt.start = schDt.start;
              updatedDid = true;
            }
            // 終了時刻同期
            if(schDt.end && schDt.end !== dailyReportDt.end){
              dailyReportDt.end = schDt.end;
              updatedDid = true;
            }
            // 迎え先同期
            if(checkValueType(schDt.transfer[0], "String") && schDt.transfer[0] !== dailyReportDt.pickupLocation){
              dailyReportDt.pickupLocation = schDt.transfer[0];
              updatedDid = true;
            }
            // 送り先同期
            if(checkValueType(schDt.transfer[1], "String") && schDt.transfer[1] !== dailyReportDt.dropoffLocation){
              dailyReportDt.dropoffLocation = schDt.transfer[1];
              updatedDid = true;
            }

            if(updatedDid){
              updated = true;
              dailyReportDt.timestamp = new Date().getTime();
              setLocalStorageItemWithTimeStamp(bid + uidStr + dDate, true);
            }
          }
        }
        if(updated){
          updateUids.push(uidStr);
          setRecentUser(uidStr);
        }
      }
      // 予定実績データ送信
      if(pathname.includes("schedule") && updateUids.length>=1){
        // 更新した予定実績データを集める
        const sendDt = updateUids.reduce((dt, uidStr) => {
          dt[uidStr] = newSchedule[uidStr];
          return dt;
        }, {});
        const dailyreportImported = new Date().getTime();
        sendDt.dailyreportImported = dailyreportImported;
        const params = {hid, bid, date: stdDate, partOfSch: sendDt};
        const res = await sendPartOfSchedule(params, '', setSnack, '日報と同期しました。', '同期に失敗しました。')
        const anyStatePrms = {
          date: stdDate, keep: 16, hid, bid,
          item: 'SchDailyReportSyncer', state:JSON.stringify({partOfSch: sendDt}),
          a: 'sendAnyState',
        }
        const resAnyState = await univApiCall(anyStatePrms, 'E976211', '', );
        console.log(resAnyState, 'resAnyState');
        if(res?.data?.result && resAnyState?.data?.result){
          newSchedule.dailyreportImported = dailyreportImported;
          dispatch(setStore({schedule: newSchedule}));
          dispatch(setSnackMsg('日報と同期しました。', '', ''));
        }
      }
      // 日報データ送信
      if(pathname.includes("dailyreport") && updateUids.length>=1){
        // 更新した日報データを集める
        const sendDt = updateUids.reduce((dt, uidStr) => {
          dt[uidStr] = newDairlyReport[uidStr];
          return dt;
        }, {});
        const scheduleImported = new Date().getTime();
        sendDt.scheduleImported = scheduleImported;
        const params = {
          a: "sendPartOfDailyReport", hid, bid, date: stdDate,
          partOfRpt: JSON.stringify(sendDt)
        };
        const res = await axios.post(endPoint(), makeUrlSearchParams(params));
        if(res?.data?.result){
          newDairlyReport.scheduleImported = scheduleImported;
          dispatch(resetStore());
          dispatch(setSnackMsg('予定実績と同期しました。', '', ''));
        }else{
          setSnack({msg: '同期に失敗しました。', severity: 'warning', id: new Date().getTime()});
        }
      }
    } finally {
      setSyncing(false); // 同期終了
    }
  }

  useEffect(() => {
    if(!loadingStatus.loaded) return;
    if(!pathname) return;
    // デバッグ用
    // if(permission < 100) return;
    // 同期を行わない設定の場合は処理しない。
    if(syncSetting!=="auto" && syncSetting!=="check") return;
    (async() => {
      const timestamps = await fetchTimeStamps(hid, bid, stdDate, setSnack);
      const scheduleTimestamp = timestamps?.ahdschedule;
      const dailyreportTimestamp= timestamps?.ahddailyreport;
      // タイムスタンプがない場合は処理しない。
      if(!scheduleTimestamp && !dailyreportTimestamp) return;
      // 予定実績画面を表示している場合
      if(pathname.includes("schedule")){
        // 日報タイムスタンプがない場合処理しない
        if(!dailyreportTimestamp) return;
        if(scheduleTimestamp && parseInt(scheduleTimestamp) >= parseInt(dailyreportTimestamp)) return;
        syncScheduleWithDailyReport();
      }
      // 日報画面を表示している場合
      if(pathname.includes("dailyreport")){
        // 予定実績タイムスタンプがない場合処理しない
        if(!scheduleTimestamp) return;
        if(dailyreportTimestamp && parseInt(dailyreportTimestamp) >= parseInt(scheduleTimestamp)) return;
        syncScheduleWithDailyReport();
      }
    })();
  }, [loadingStatus.loaded, pathname]);

  return (
    <>
      {syncing && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#000',
          opacity: 0.5,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: '#fff',
          pointerEvents: 'all',
        }}>
          <AccessTimeIcon style={{ fontSize: 32, marginRight: 8, color: '#fff' }} />
          同期中
        </div>
      )}
      <SnackMsg {...snack} />
    </>
  )
}
export default SchDailyReportSyncer;