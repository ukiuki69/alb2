import { univApiCall } from '../../albCommonModule'
import { CNTBK_INIT_CONTENTS, sendOneMessageOfContact } from "../ContactBook/CntbkCommon";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSnackMsg } from "../../Actions";
import { checkValueType } from "./DailyReportCommon";
import { getLodingStatus } from "../../commonModule";

const VITAL_KEYS = ["temperature", "bloods", "spo2", "sleep", "excretion", "meal", "medication"];

export const useSyncVitalDailyReportAndCntbk = () => {
  const dispatch = useDispatch();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {hid, bid, stdDate, users, schedule} = allState;
  const [stdYear, stdMonth] = stdDate.split("-");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const dDate = 'D' + String(year) + String(month+1).padStart(2, '0') + String(date).padStart(2, '0');

  useEffect(() => {
    if(!loadingStatus.loaded) return;
    // stdDateと現在の日付が合わないときは処理しない。
    if(!(parseInt(stdYear)===year && parseInt(stdMonth)===month+1)) return;
    let isMounted = true;
    if(!isMounted) return;
    (async() => {
      let dailyReportDt = null, cntbkDt = null;
      try{
        const dailyReportFetchParams = {"a": "fetchDailyReport", hid, bid, date: stdDate};
        const dailyReportRes = await univApiCall(dailyReportFetchParams);
        if(!dailyReportRes?.data?.result) return;
        dailyReportDt = dailyReportRes.data?.dt?.[0]?.dailyreport ?? {};
        const cntbkFetchPrams = {a: "fetchContacts", hid, bid, date: stdDate};
        const cntbkRes = await univApiCall(cntbkFetchPrams);
        cntbkDt = cntbkRes.data?.dt?.[0]?.contacts ?? {};
        if(!cntbkRes?.data?.result){
          dispatch(setSnackMsg("同期に失敗しました。"));
          return;
        }
      }catch(error){
        dispatch(setSnackMsg("同期に失敗しました。"));
        return;
      }
      const newDailyReportDt = JSON.parse(JSON.stringify(dailyReportDt));
      const newCntbkDt = JSON.parse(JSON.stringify(cntbkDt));
      let isDailyReportSynced = false;
      for(const user of users){
        let isCntbkSynced = false;
        const uidStr = "UID" + user.uid;
        const schDt = schedule?.[uidStr]?.[dDate];
        // 利用がないときは無視
        if(!checkValueType(schDt, 'Object')) continue;
        // 連絡帳利用者ではない場合無視
        if(!user.faptoken) continue;

        if(!newDailyReportDt?.[uidStr]) newDailyReportDt[uidStr] = {};
        const thisUserDailyReportDt = newDailyReportDt[uidStr];
        if(!newCntbkDt?.[uidStr]) newCntbkDt[uidStr] = {};
        const thisUserCntbkDt = newCntbkDt[uidStr];

        if(!checkValueType(thisUserDailyReportDt[dDate], "Object")) thisUserDailyReportDt[dDate] = {};
        const drDt = thisUserDailyReportDt[dDate];
        if(!thisUserCntbkDt[dDate]) thisUserCntbkDt[dDate] = [...CNTBK_INIT_CONTENTS];
        const contentDts = thisUserCntbkDt[dDate];
        const postMessageDt = contentDts[2];

        for(const vitalKey of VITAL_KEYS){
          const drVital = drDt?.[vitalKey];
          const cbVital = postMessageDt?.vital?.[vitalKey];
          if(drVital && !cbVital && !postMessageDt.sent){
            // 日報にはあるが連絡帳にはデータがない場合
            if(!checkValueType(postMessageDt.vital, 'Object')) postMessageDt.vital = {};
            postMessageDt.vital[vitalKey] = drVital;
            isCntbkSynced = true;
          }else if(!drVital && cbVital && !schDt.useResult){
            // 連絡帳にはあるが日報にはデータがない場合
            drDt[vitalKey] = cbVital;
            isDailyReportSynced = true;
          }
        }
        if(isCntbkSynced){
          // 連絡帳データを送信
          sendOneMessageOfContact(hid, bid, stdDate, uidStr, dDate, 2, postMessageDt);
        }
      }
      if(isDailyReportSynced){
        // 日報データを送信
        try{
          const dailyReportSendParams = {
            a: "sendPartOfDailyReport", hid, bid, date: stdDate,
            partOfRpt: JSON.stringify(newDailyReportDt)
          };
          const dailyReportRes = await univApiCall(dailyReportSendParams);
          if(dailyReportRes?.data?.result){
            dispatch(setSnackMsg("バイタルを同期しました。"));
          }
        }catch(error){
          return;
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [loadingStatus.loaded]);
}