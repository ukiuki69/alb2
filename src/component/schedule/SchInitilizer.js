import { useDispatch, useSelector } from "react-redux";
import React, {useEffect, useState} from 'react';
import { deleteOldLocalStrageValues, getLS, removeLocalStorageItem, setLS } from "../../modules/localStrageOprations";
import { formatDate, getLodingStatus } from "../../commonModule";
import { AddictionConfirming } from "../common/materialUi";
import * as Actions from '../../Actions';
import { prepareNextMonthBackground } from "./schUtility/prepareNextMonthBackground";
import { addUsersAddictionToSch } from "./schUtility/addUsersAddictionToSch";
import { useTobeInit } from "./schUtility/useTobeInit";
import { getSchInitName } from "./schUtility/getSchInitName";

/**
 * 指定された値nに基づいて、以下の条件を満たす四捨五入された整数値を返す。
 * - n <= 10 の場合: 5を返す
 * - n > 10 かつ n < 300 の場合: nに対してなだらかに増減する値を返す
 * - n >= 300 の場合: nの10%を返す
 * @param {number} n - 入力値
 * @return {number} 四捨五入された整数値
 */

const getHighlightNum = n => {
  let value;
  if (n <= 10) {
    value = 5;
  } else if (n >= 300) {
    value = n * 0.1;
  } else {
    const rangeMin = 10;
    const rangeMax = 300;
    const valueMin = 5;
    const valueMax = 30;

    value = valueMin + ((n - rangeMin) / (rangeMax - rangeMin)) * (valueMax - valueMin);
  }

  // 返り値を四捨五入
  return Math.round(value);
};

// 利用者の加算をusersから取得するためのComponent
// また、
export const SchInitilizer = () => {
  // console.log('%cSchInitilizer mounted.', 'background: yellow; color: blue;');
  const getSchCnt = (schedule) =>{
    let schCnt = 0;
    Object.keys(schedule).filter(e=>e.match(/^UID/)).map(e=>{
      if (!schedule[e]){
        console.log('schedule object', e);
        return false;
      }
      schCnt += Object.keys(schedule[e]).filter(f=>f.match(/^D2/)).length
    });
    return schCnt;
  }
  const allstate = useSelector(state=>state);
  const loadingStatus = getLodingStatus(allstate);
  const isLoaded = (loadingStatus.loaded && !loadingStatus.error)
  const dispatch = useDispatch();
  const {
    schedule, controleMode, service, stdDate, dateList, hid, bid,
    users, serviceItems, com, 
  } = allstate;
  const schInitName = getSchInitName(hid, bid);
  // const initDone = controleMode.scheduleInitDone;
  // const sendFlug = controleMode.scheduleInitSendFlug;
  // store stateによる管理からローカルストレージに変更
  const schInitDone = getLS(schInitName)? getLS(schInitName): {};
  const curDate = formatDate(new Date(), 'YYYY-MM-DD');
  
  const tobeInit = useTobeInit(schInitName);
  const cnt = getSchCnt(schedule);
  const [confirmDisp, setConfirmDisp] = useState(tobeInit);
  const ptn = bid ? new RegExp('^' + bid + 'UID[0-9]+D2[0-9]*') : null;
  // ハイライト表示するための数値を変更
  if (ptn) deleteOldLocalStrageValues(ptn, getHighlightNum(cnt));
  useEffect(()=>{
    let isMounted = true;
    if (!isLoaded){
      console.log('schinitilizer not loaded');
      return;
    }
    console.log('schinitilizer loaded');

    // --- 翌月のバックグラウンド作成機能 ---
    const checkAndPrepareNextMonth = async () => {
      // 古いチェックフラグのクリーンアップ（表示月以前のフラグは不要）
      Object.keys(localStorage)
        .filter(key => key.startsWith(`nextMonthPrepared-${hid}-${bid}-`))
        .forEach(key => {
          const datePart = key.split('-').slice(-3).join('-');
          if (datePart <= stdDate) removeLocalStorageItem(key);
        });

      const schReserve = com?.ext?.schReserve;
      if (schReserve?.isReserveAccept) {
        const today = new Date();
        const startDay = parseInt(schReserve.reserveAcceptStartDate ?? 1);
        const curMonthStr = formatDate(today, 'YYYY-MM') + '-01';

        // 条件: 表示月が当月 かつ 今日が受付開始日以降
        if (stdDate === curMonthStr && today.getDate() >= startDay) {
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          const nextMonthStr = formatDate(nextMonth, 'YYYY-MM-DD');
          const nextMonthKey = `nextMonthPrepared-${hid}-${bid}-${nextMonthStr}`;

          // 未作成（または未チェック）の場合のみ実行
          if (!getLS(nextMonthKey)) {
            const p = { 
              newStdDate: nextMonthStr, hid, bid, com, 
              weekDayDefaultSet: allstate.config?.weekDayDefaultSet 
            };
            const res = await prepareNextMonthBackground(p);
            // 作成成功、または既に存在していた場合はフラグを立てて再実行を防ぐ
            if (res === true || res === 'already_exists') {
              setLS(nextMonthKey, true);
              console.log('%cNext month background preparation done.', 'color: green;');
            }
          }
        }
      }
    };
    checkAndPrepareNextMonth();

    // 何故かここでサービス見てるけど？？
    if (isMounted && tobeInit){
    // if (service && isMounted && sendFlug){
      const p = {
        dateList, stdDate, schedule, hid, bid, users, dispatch, 
        forthUpdate: true, serviceItems, com, dateList
      }
      // dispatch(Actions.setStore({controleMode: {
      //   ...controleMode,
      //   scheduleInitSendFlug: false
      // }}));
      addUsersAddictionToSch(p);
      // カレンダー設定を行う
      // setCloseDayToCalender(p);
      // 更新済みフラグをセット
      schInitDone[stdDate] = curDate;
      setLS(schInitName, schInitDone);
      console.log('%cschedule init.', 'background: yellow; color: red;');
    }
    return (()=>{isMounted = false});
  }, []);
  useEffect(()=>{
    let isMounted = true;
    const fabExist = document.querySelector('#floatingActionButtonsExist');
    if (tobeInit && confirmDisp && !fabExist){
      setTimeout(()=>{
        setConfirmDisp(false);
      }, 2000)
    }
    else setConfirmDisp(false);
    return (()=>{isMounted = false});
  }, [])
  if (confirmDisp){
    return (<AddictionConfirming/>)
  }
  return null;
}
