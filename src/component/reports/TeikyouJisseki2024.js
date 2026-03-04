import React, { useEffect, useRef, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useSelector } from 'react-redux';
import { LoadingSpinner} from '../common/commonParts';
import { DAY_LIST } from '../../hashimotoCommonModules';
import { formatDate, formatNum, getDateEx, getLodingStatus, randomStr } from '../../commonModule';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { elapsedHours, elapsedMonths, getSanteciJikanOneDay, getSanteiOneDayWitoutEncho } from '../../modules/elapsedTimes';
import { LC2024 } from '../../modules/contants';
import { CALC2024 } from '../../Rev';
import SetPrintTitle from '../common/SetPrintTitle';
import { getUsersTimeTableInitDateStr, USERS_TIME_TABLE_DAYS } from '../Users/TimeTable/UsersTimeTableCommon';
import axios from 'axios';
import { HOHOU, HOUDAY, JIHATSU } from '../../modules/contants';

const HOUDAY_ITEMS = [
  "サービス提供状況", "提供形態", "開始時間", "終了時間", "算定時間数", "送迎加算",
  "家族支援加算", "医療連携体制加算", "延長支援加算", '集中的支援加算', '専門的支援加算(支援実施時)',
  '入浴支援加算', '子育てサポート加算', '通所自立支援加算',  '自立サポート加算',
];
const JIHATSU_ITEMS = [
  "サービス提供状況", "開始時間", "終了時間", "算定時間数", "送迎加算",
  "食事提供加算", "家族支援加算", "医療連携体制加算", "延長支援加算", '集中的支援加算',
  '専門的支援加算(支援実施時)', '入浴支援加算', '子育てサポート加算'
];
const HOHOU_ITEMS = [
  "算定日数", "家族支援加算", "初回加算", '訪問支援員特別加算', '多職種連携支援加算',
  '強度行動障害児支援加算(支援実施時)'
];
const TOTALING_NOT_APPLICABLE_ITEMS = [
  "サービス提供状況", "提供形態", "開始時間", "終了時間",
];

const ABSENCE_DADDICTION_KEYS = ["家族支援加算Ⅰ", "家族支援加算Ⅱ", '多職種連携支援加算', '欠席時対応加算'];

const makeAnyNumberOfTds = (argumentObj) => {
  const {
    string="", elementsLength=1, colSpan=1, rowSpan=1,
    className="", firstChildClassName="", lastChildClassName="",
    style={}, firstChildStyle={}, lastChildStyle={}, elementKey=null
  } = argumentObj;
  const key = elementKey ?elementKey :randomStr(6);
  const nodes = [...string].map((str, index) => {
    let addStyle = {};
    let marginedClassName = className;
    if(index === 0){
      addStyle = firstChildStyle;
      if(firstChildClassName) marginedClassName += " "+firstChildClassName;
    }
    if(index+1 === string.length){
      addStyle = lastChildStyle;
      if(lastChildClassName) marginedClassName += " "+lastChildClassName;
    }

    return(
      <td colSpan={colSpan} rowSpan={rowSpan} key={key+(index+1)}
        className={`${marginedClassName} anyNumberElement`}
        style={{...style, ...addStyle}}
      >
        {str}
      </td>
    )
  });
  let keyIndex = 10;
  while(nodes.length < elementsLength){
    keyIndex++;
    let addStyle = {};
    let marginedClassName = className;
    if(nodes.length === 0){
      addStyle = lastChildStyle;
      if(lastChildClassName) marginedClassName += " "+lastChildClassName;
    }
    if(nodes.length+1 === elementsLength){
      addStyle = firstChildStyle;
      if(firstChildClassName) marginedClassName += " "+firstChildClassName;
    }

    nodes.unshift(
      <td colSpan={colSpan} rowSpan={rowSpan} key={key+keyIndex}
        className={`${marginedClassName} anyNumberElement`}
        style={{...style, ...addStyle}}
      />
    )
  }

  return nodes
}

const getKessekiKasan = (schDt) => {
  const absence = schDt.absence ?? false;
  if(absence && !schDt.noUse){
    const kessekiKasan = schDt.dAddiction?.["欠席時対応加算"];
    if(kessekiKasan === '1' || kessekiKasan === "欠席時対応加算１"){
      return '欠席';
    }else{
      return '欠';
    }
  }
  return null;
}

const getKasanElementDt = (argumentObj) => {
  const {tableType, item, schDt, prevValue, service, user, com, stdDate, dDate} = argumentObj;
  let className = "", rowSpan = 1, colSpan = 1, adjustedItem=item, value="", value2=null, style={}, currentValue=prevValue, unit="";
  let kessekiKasan = null;
  if(schDt) kessekiKasan = getKessekiKasan(schDt);
  const schDtHantei = checkValueType(schDt, "Object") && Object.keys(schDt).length;
  const dAddiction = schDt?.dAddiction ?? {};
  const absence = schDt?.absence ?? false;
  // 加算項目表示設定
  const displayItems = com?.ext?.reportsSetting?.teikyouJisseki?.displayItems ?? com?.etc?.configReports?.teikyouJisseki?.displayItems ?? {};
  // 加算項目表示設定がすべて有効かどうか
  const isDisplayAllItems = Object.values(displayItems).every(x => x !== false);
  switch(item){
    case "サービス提供状況": {
      className = "status";
      if(tableType === 'header'){
        rowSpan = 2;
      }else if(tableType === 'body'){
        if(kessekiKasan && !schDt.noUse) value = kessekiKasan;
      }
      break;
    }
    case "提供形態": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = `提供\n形態`;
      }else if(tableType === "body"){
        if(!absence){
          const offSchool = schDt.offSchool
          if(offSchool !== undefined) value = offSchool + 1;
        }
      }
      break;
    }
    case "開始時間": {
      className = isDisplayAllItems ?"time" :"time wide";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = `開始時間`;
      }else if(tableType === "body"){
        const start = schDt.start ?? "";
        if(!absence) value = start;
      }
      break;
    }
    case "終了時間": {
      className = isDisplayAllItems ?"time" :"time wide";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = `終了時間`;
      }else if(tableType === "body"){
        const end = schDt.end ?? "";
        if(!absence) value = end;
      }
      break;
    }
    case "算定時間数": {
      className = "kasan";
      const teikyouJisseki2024Checked = com?.ext?.reportsSetting?.teikyouJisseki?.teikyouJisseki2024?.checked ?? com?.etc?.configReports?.teikyouJisseki?.teikyouJisseki2024?.checked ?? stdDate>=LC2024;
      const teikyouJisseki2024Option = com?.ext?.reportsSetting?.teikyouJisseki?.teikyouJisseki2024?.option ?? com?.etc?.configReports?.teikyouJisseki?.teikyouJisseki2024?.option ?? "priorityTimetable";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = `算定\n時間数`
      // }else if(tableType === 'body'){
      }else if(teikyouJisseki2024Checked && tableType === 'body' && dDate && Object.keys(schDt).length){
        if(schDt?.absence) break;
        const timetable = user?.timetable ?? [];
        const initDateStr = getUsersTimeTableInitDateStr(timetable, stdDate);
        const planDt = timetable.find(dt => dt.created === initDateStr)?.content ?? {};
        const day = new Date(parseInt(dDate.slice(1, 5)), parseInt(dDate.slice(5, 7))-1, parseInt(dDate.slice(7, 9))).getDay();
        const dayDt = planDt[USERS_TIME_TABLE_DAYS[day]] ?? {};
        const basisStart = dayDt?.basisStart ?? "";
        const basisEnd = dayDt?.basisEnd ?? "";
        const schStart = schDt.start ?? "";
        const schEnd = schDt.end ?? "";
        let start = null, end = null;
        switch(teikyouJisseki2024Option){
          case "priorityTimetable": {
            if(basisStart && basisEnd){
              start = basisStart;
              end = basisEnd;
            }else{
              value = getSanteciJikanOneDay(schDt).toFixed(2);
            }
            break;
          }
          case "displayTimeTable": {
            start = basisStart;
            end = basisEnd;
            break;
          }
          case "displayScheduleKubunEntyou": {
            value = getSanteciJikanOneDay(schDt).toFixed(2);
            break;
          }
          case "displayScheduleKubun": {
            value = getSanteiOneDayWitoutEncho(schDt);
            break;
          }
          case "displaySchedule": {
            start = schStart;
            end = schEnd;
            break;
          }
          case "blank": {
            start = "";
            end = "";
            break;
          }
        }
        if(!value) value = start && end ?elapsedHours(start, end, 'round', .01) :"";
        if (value) value = Number(value).toFixed(2);
      }else if(teikyouJisseki2024Checked && tableType === "totaling" && dDate && Object.keys(schDt).length){
        style = {textAlign: 'center'};
        if(schDt?.absence) break;
        const timetable = user?.timetable ?? [];
        const initDateStr = getUsersTimeTableInitDateStr(timetable, stdDate);
        const planDt = timetable.find(dt => dt.created === initDateStr)?.content ?? {};
        const day = new Date(parseInt(dDate.slice(1, 5)), parseInt(dDate.slice(5, 7))-1, parseInt(dDate.slice(7, 9))).getDay();
        const dayDt = planDt[USERS_TIME_TABLE_DAYS[day]] ?? {};
        const basisStart = dayDt?.basisStart ?? "";
        const basisEnd = dayDt?.basisEnd ?? "";
        const schStart = schDt.start ?? "";
        const schEnd = schDt.end ?? "";
        let start = null, end = null;
        switch(teikyouJisseki2024Option){
          case "priorityTimetable": {
            if(basisStart && basisEnd){
              start = basisStart;
              end = basisEnd;
            }else{
              value = getSanteciJikanOneDay(schDt);
            }
            break;
          }
          case "displayTimeTable": {
            start = basisStart;
            end = basisEnd;
            break;
          }
          case "displayScheduleKubunEntyou": {
            value = getSanteciJikanOneDay(schDt);
            break;
          }
          case "displayScheduleKubun": {
            value = parseFloat(getSanteiOneDayWitoutEncho(schDt));
            break;
          }
          case "displaySchedule": {
            start = schStart;
            end = schEnd;
            break;
          }
          case "blank": {
            start = "";
            end = "";
            break;
          }
        }
        if(!value) value = start && end ?elapsedHours(start, end) :"";
        const resultValue = parseFloat(currentValue) + (value ?value :0);
        if(resultValue) currentValue = (parseFloat(currentValue) + (value ?value :0)).toFixed(2);
      }
      break;
    }
    case "送迎加算": {
      if(tableType === "header"){
        rowSpan = 1; colSpan = 2;
        style = {fontSize: 10}
      }else if(tableType === "body"){
        className = "transfer"
        if(!absence){
          const transfer = (schDt.transfer ?? ['', '']).map(g => (g && g.match(/^\*|\*$/)) ?"" :g);
          const pickup = transfer[0] ?"1" :"";
          const dropoff = transfer[1] ?"1" :"";
          value = pickup;
          value2 = dropoff;
        }
        if(!value2) value2 = "";
      }else if(tableType === "totaling"){
        colSpan = 2;
        if(schDtHantei && !absence){
          const transfer = (schDt.transfer ?? ['', '']).map(g => (g && g.match(/^\*|\*$/)) ?"" :g);
          const pickup = transfer[0] ?1 :0;
          const dropoff = transfer[1] ?1 :0;
          currentValue += pickup + dropoff;
        }
        unit = "回";
      }
      break;
    }
    case "食事提供加算": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = `食事提供\n加算`;
        style = {fontSize: 10}
      }else if(tableType === 'body'){
        if(schDt?.absence) break;
        if(dAddiction[item] === "児発食事提供加算Ⅰ"){
          value = "1";
        }else if(dAddiction[item] === "児発食事提供加算Ⅱ"){
          value = "1";
        }
      }else if(tableType === "totaling"){
        if(schDt?.absence) break;
        let cnt = 0;
        if(dAddiction[item] === "児発食事提供加算Ⅰ"){
          cnt = 1;
        }else if(dAddiction[item] === "児発食事提供加算Ⅱ"){
          cnt = 1;
        }
        currentValue += cnt;
        unit = "回";
      }
      break;
    }
    case "家族支援加算": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
        if(service !== "保育所等訪問支援"){
          adjustedItem = `家族支援\n加算`;
          style = {fontSize: 10};
        }
      }else if(tableType === 'body'){
        let val1 = "", val2 = "";
        if(dAddiction["家族支援加算Ⅰ"] === "居宅1時間以上") val1 = "1";
        else if(dAddiction["家族支援加算Ⅰ"] === "居宅1時間未満") val1 = "2";
        else if(dAddiction["家族支援加算Ⅰ"] === "事業所対面") val1 = "3";
        else if(dAddiction["家族支援加算Ⅰ"] === "オンライン") val1 = "4";
        if(dAddiction["家族支援加算Ⅱ"] === "事業所対面") val2 = "5";
        else if(dAddiction["家族支援加算Ⅱ"] === "オンライン") val2 = "6";
        value = val1 && val2 ?`${val1}・${val2}` :val1 ?val1 :val2 ?val2 :"";
      }else if(tableType === "totaling"){
        let cnt = 0;
        if(dAddiction["家族支援加算Ⅰ"] === "居宅1時間以上") cnt += 1;
        else if(dAddiction["家族支援加算Ⅰ"] === "居宅1時間未満") cnt += 1;
        else if(dAddiction["家族支援加算Ⅰ"] === "事業所対面") cnt += 1;
        else if(dAddiction["家族支援加算Ⅰ"] === "オンライン") cnt += 1;
        if(dAddiction["家族支援加算Ⅱ"] === "事業所対面") cnt += 1;
        else if(dAddiction["家族支援加算Ⅱ"] === "オンライン") cnt += 1;
        currentValue += cnt;
        unit = "回";
      }
      break;
    }
    case "医療連携体制加算": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = `医療連携\n体制加算`;
        style = {fontSize: 10};
      }else if(tableType === "body"){
        if(schDt?.absence) break;
        const iryouKasan = dAddiction["医療連携体制加算"];
        if(iryouKasan){
          const romanNumerals = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ"];
          const num = romanNumerals.indexOf(iryouKasan.slice(8, 9)) + 1;
          value = num ?num :"";
        }
      }else if(tableType === "totaling"){
        if(schDt?.absence) break;
        if(schDtHantei){
          const iryouKasan = dAddiction["医療連携体制加算"];
          if(iryouKasan) currentValue += 1;
          unit = "回";
        }
      }
      break;
    }
    case "延長支援加算": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = `延長支援\n加算`;
        style = {fontSize: 10};
      }else if(tableType === 'body'){
        if(schDt?.absence) break;
        if(!absence){
          switch(String(dAddiction["延長支援"])){
            case "1": {
              value = "2"
              break;
            }
            case "2": {
              value = "3"
              break;
            }
            case "3": {
              value = "1"
              break;
            }
          }
        }
      }else if(tableType === "totaling"){
        if(schDt?.absence) break;
        if(!absence){
          const cnt = dAddiction["延長支援"] && Number(dAddiction["延長支援"]) > 0   ?1 :0;
          currentValue += cnt;
        }
        unit = "回";
      }
      break;
    }
    case "集中的支援加算": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = `集中的\n支援加算`;
        style = {fontSize: 10};
      }else if(tableType === 'body'){
        if(schDt?.absence) break;
        value = dAddiction[item];
      }else if(tableType === "totaling"){
        const cnt = dAddiction[item] ?1 :0;
        currentValue += cnt;
        unit = "回";
      }
      break;
    }
    case "専門的支援加算(支援実施時)": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = "専門的\n支援加算\n(支援実施時)"
        style = {fontSize: 10}
      }else if(tableType === 'body'){
        if(schDt?.absence) break;
        value = dAddiction["専門的支援実施加算"];
      }else if(tableType === "totaling"){
        if(schDt?.absence) break;
        const cnt = dAddiction["専門的支援実施加算"] ?1 :0;
        currentValue += cnt;
        unit = "回";
      }
      break;
    }
    case "入浴支援加算": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = "入浴支援\n加算";
        style = {fontSize: 10}
      }else if(tableType === 'body'){
        value = dAddiction[item];
      }else if(tableType === "totaling"){
        const cnt = dAddiction[item] ?1 :0;
        currentValue += cnt;
        unit = "回";
      }
      break;
    }
    case "子育てサポート加算": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = "子育て\nサポート\n加算";
        style = {fontSize: 10}
      }else if(tableType === 'body'){
        if(schDt?.absence) break;
        value = dAddiction[item];
      }else if(tableType === "totaling"){
        if(schDt?.absence) break;
        const cnt = dAddiction[item] ?1 :0;
        currentValue += cnt;
        unit = "回";
      }
      break;
    }
    case "通所自立支援加算": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = "通所自立\n支援加算";
        style = {fontSize: 10};
      }else if(tableType === 'body'){
        value = dAddiction[item];
      }else if(tableType === "totaling"){
        const cnt = dAddiction[item] ?1 :0;
        currentValue += cnt;
        unit = "回";
      }
      break;
    }
    case "自立サポート加算": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = "自立\nサポート\n加算";
        style = {fontSize: 10}
      }else if(tableType === 'body'){
        value = dAddiction[item];
      }else if(tableType === "totaling"){
        const cnt = dAddiction[item] ?1 :0;
        currentValue += cnt;
        unit = "回";
      }
      break;
    }
    case "算定日数": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
      }else if(tableType === "body"){
        if(absence) break;
        if(Object.keys(schDt).length) value = "1";
      }else if(tableType === "totaling"){
        if(absence) break;
        if(Object.keys(schDt).length) currentValue += 1;
        unit = "日";
      }
      break;
    }
    case "初回加算": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
      }else if(tableType === "body"){
        if(absence) break;
        const syokaiKasan = dAddiction?.["初回加算"];
        if(syokaiKasan) value = "1";
      }else if(tableType === "totaling"){
        if(absence) break;
        if(schDtHantei){
          const syokaiKasan = dAddiction?.["初回加算"];
          if(syokaiKasan) currentValue += 1;
          unit = "回";
        }
      }
      break;
    }
    case "訪問支援員特別加算": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = "訪問支援員\n特別加算";
      }else if(tableType === 'body'){
        if(absence) break;
        if(dAddiction?.["訪問支援員特別加算24"]){
          value = dAddiction?.["訪問支援員特別加算24"];
        }else if(Object.keys(schDt).length){
          value = com?.addiction?.["保育所等訪問支援"]?.["訪問支援員特別加算24"];
        }
      }else if(tableType === "totaling"){
        if(absence) break;
        if(dAddiction?.["訪問支援員特別加算24"]){
          const cnt = dAddiction?.["訪問支援員特別加算24"] ?1 :0;
          currentValue += cnt;
        }else if(Object.keys(schDt).length){
          const cnt = com?.addiction?.["保育所等訪問支援"]?.["訪問支援員特別加算24"] ?1 :0;
          currentValue += cnt;
        }
        if(unit || currentValue) unit = "回";
      }
      break;
    }
    case "多職種連携支援加算": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = "多職種連携\n支援加算";
      }else if(tableType === 'body'){
        value = dAddiction[item];
      }else if(tableType === "totaling"){
        const cnt = dAddiction[item] ?1 :0;
        currentValue += cnt;
        unit = "回";
      }
      break;
    }
    case "強度行動障害児支援加算(支援実施時)": {
      className = "kasan";
      if(tableType === 'header'){
        rowSpan = 2;
        adjustedItem = "強度行動障害児\n支援加算\n(支援実施時)";
        style = {fontSize: 10}
      }else if(tableType === 'body'){
        if(absence) break;
        if(Object.keys(schDt).length){
          value = user?.etc?.addiction?.["強度行動障害児支援加算"];
        }
      }else if(tableType === "totaling"){
        if(absence) break;
        let cnt = 0;
        if(Object.keys(schDt).length){
          cnt = user?.etc?.addiction?.["強度行動障害児支援加算"] ?1 :0;
        }
        if(cnt || currentValue){
          currentValue += cnt;
          unit = "回";
        }
      }
      break;
    }
  }

  if(tableType === "header") return {className, rowSpan, colSpan, adjustedItem, style};
  if(tableType === "body") return  {className, rowSpan, colSpan, value, value2, style};
  if(tableType === "totaling") return {className, rowSpan, colSpan, style, currentValue, unit, style};
}

export const getTeikyouJissekiSchedule = (scheudle, com, service, users, stdDate) => {
  const displayItems = com?.ext?.reportsSetting?.teikyouJisseki?.displayItems ?? com?.etc?.configReports?.teikyouJisseki?.displayItems ?? {};
  const displayAbsence = com?.ext?.reportsSetting?.teikyouJisseki?.displayAbsence ?? com?.etc?.configReports?.teikyouJisseki?.displayAbsence ?? "0";
  const items = (() => {
    if(service === "放課後等デイサービス") return HOUDAY_ITEMS;
    if(service === "児童発達支援") return JIHATSU_ITEMS;
    if(service === "保育所等訪問支援") return HOHOU_ITEMS;
    return [];
  })().filter(item => {
    if(displayItems[item] === false) return false;
    return true;
  });
  const newSchedule = Object.entries(scheudle).filter(([uidStr, sch]) => {
    if(!/^UID\d+$/.test(uidStr)) return false;
    const user = users.find(prevUser => "UID"+prevUser.uid === uidStr);
    if(!user) return false;
    return true;
  }).reduce((prevNewSchedule, [uidStr, sch]) => {
    const user = users.find(prevUser => "UID"+prevUser.uid === uidStr);
    const newSch = Object.entries(sch).filter(([did, schDt={}]) => {
      // keyがDyyyymmdd形式でないデータは無視
      if(!/^D[0-9]{8}H?$/.test(did)) return false;
      // 予約データは無視
      if(schDt.reserve) return false;
      const onItems = items.some(item => {
        const elementDt = getKasanElementDt({tableType: 'body', item, schDt, user, com, stdDate, dDate: did});
        if(elementDt.value) return true;
        return false;
      });
      if(!onItems) return false;
      const schService = schDt.service;
      if(schService && schService !== service){
        if(!(service==="保育所等訪問支援" && schDt?.dAddiction?.["保育訪問"])) return false;
      }
      const dAddiction = schDt.dAddiction ?? {};
      // 利用なしの場合は計上する加算がない場合は無視
      if(schDt.noUse && !Object.keys(dAddiction).some(key => ABSENCE_DADDICTION_KEYS.includes(key))) return false;
      // 欠席でも計上する加算がない場合は無視
      if(schDt.absence && displayAbsence==="1" && !Object.keys(dAddiction).some(key => ABSENCE_DADDICTION_KEYS.includes(key))) return false;
      return true;
    }).reduce((prevNewSch, [did, schDt]) => {
      prevNewSch[did] = schDt;
      return prevNewSch;
    }, {});
    prevNewSchedule[uidStr] = newSch;
    return prevNewSchedule;
  }, {});
  return newSchedule;
}

const NOMAL_BORDER = '1px solid';
const BOLD_BORDER = "2px solid";
export const useStyles = makeStyles({
  sheets: {
    marginTop: 32,
    '@media print': {
      marginTop: 0,
    },
    '& > div': {
      marginBottom: 120,
      '&:not(:last-child)': {pageBreakAfter: 'always'}
    }
  },
  sheet: {
    '@media print': {
      margin: '4px 0 0 0',
    },
    '& .date, .day': {
      fontSize: 14
    },
    '& .title': {
      textAlign: 'center', fontSize: 18,
      marginBottom: 8
    },
    '& table': {
      marginBottom: 16,
      borderCollapse: 'collapse',
      '& thead': {
        '& th': {
          whiteSpace: 'pre-wrap'
        }
      },
      '& tr': {
        '& th, td': {
          textAlign: 'center',
          padding: 2,
          border: '1px solid', borderCollapse: 'collapse',
          height: 18,
          fontSize: 12,
        },
        '& th': {
          fontWeight: 'normal'
        },
        '& td': {
        },
        '& .startDate, .endDate, .useCount, .hospitalCount': {
          fontSize: '0.6rem'
        },
        '& .wareki': {
          width: 32, fontSize: '0.8rem'
        },
        '& .application': {
          width: 160
        },
        '& .date, .day': {
          width: 20
        },
        '& .conf': {
          width: 48, flex: 0
        },
        '& .kasan': {
          width: 40
        },
        '& .status': {
          width: 48
        },
        '& .time': {
          width: 32, padding: '0 6px',
          '&.wide': {
            width: 48,
          }
        },
        '& .transfer': {
          width: 20
        },
        '& .notice': {
          width: 200
        },
        '& .diagonalLine': {
          width: '100%', height: '100%',
          borderTop: '1px solid',
        }
      }
    },
    '& .border': {border: NOMAL_BORDER},
    '& .borderTop': {borderTop: NOMAL_BORDER},
    '& .borderBottom': {borderBottom: NOMAL_BORDER},
    '& .borderRight': {borderRight: NOMAL_BORDER},
    '& .borderLeft': {borderLeft: NOMAL_BORDER},
    '& .boldBorder': {border: BOLD_BORDER},
    '& .boldBorderTop': {borderTop: BOLD_BORDER},
    '& .boldBorderBottom': {borderBottom: BOLD_BORDER},
    '& .boldBorderRight': {borderRight: BOLD_BORDER},
    '& .boldBorderLeft': {borderLeft: BOLD_BORDER},
    '& .noneBorder': {border: 'none'},
    '& .noneBorderTop': {borderTop: 'none'},
    '& .noneBorderBottom': {borderBottom: 'none'},
    '& .noneBorderRight': {borderRight: 'none'},
    '& .noneBorderLeft': {borderBottom: 'none'},
  },
  userInfoTable: {
    width: "100%"
  },
  mainTable: {
    width: "100%"
  },
  indexTable: {
    marginLeft: 'auto',
    '& th, td': {
      width: 32
    }
  }
});

const UserInfoTable = (props) => {
  const classes = useStyles();
  const com = useSelector(state => state.com);
  const convJido = com?.ext?.reportsSetting?.convJido ?? com?.etc?.configReports?.convJido ?? false;
  const {user, service} = props;

  const hno = user.hno ?? "";
  const jino = com.jino ?? "";
  const bname = com.bname ?? "";
  const pname = user.pname ?? "";
  const name = user.name ?? "";
  const volume = user.service.includes(",") ?user?.etc?.multiSvc?.[service]?.volume :user.volume ?? "　";
  return(
    <table className={`${classes.userInfoTable} boldBorder`}>
      <tbody>
        <tr>
          <th>受給者証番号</th>
          {makeAnyNumberOfTds({string: String(hno), elementsLength: 10, style: {width: 16}})}
          <th>保護者氏名<br />({convJido ?"児童" :"障害者"}氏名)</th>
          <td>{pname}<br /><span style={{fontSize: 16}}>({name})</span></td>
          <th colSpan="1">事業所番号</th>
          {makeAnyNumberOfTds({string: String(jino), elementsLength: 10, style: {width: 16}})}
        </tr>
        <tr>
          <th>契約支給量</th>
          <td colSpan="11">{volume}日</td>
          <th>事業者事業所</th>
          <td colSpan="12">{bname}</td>
        </tr>
      </tbody>
    </table>
  )
}

const MainTableHeader = (props) => {
  const {items, service} = props;
  const com = useSelector(state => state.com);
  const confPerDate = com?.ext?.reportsSetting?.teikyouJisseki?.parentConfirmation?.confPerDate ?? com?.etc?.configReports?.teikyouJisseki?.parentConfirmation?.confPerDate ?? false;

  const itemNodes = items.map((item, i) => {
    const elementDt = getKasanElementDt({tableType: "header", item, service});
    return(
      <th
        key={`item${i}`}
        rowSpan={elementDt.rowSpan} colSpan={elementDt.colSpan}
        className={elementDt.className} style={elementDt.style}
      >
        {elementDt.adjustedItem}
      </th>
    )
  })
  return(
    <>
    <tr>
      <th rowSpan="3" className='date' >日付</th>
      <th rowSpan="3" className='day boldBorderRight' >曜日</th>
      <th colSpan={items.includes("送迎加算") ?items.length+1 :items.length}>サービス提供実績</th>
      {!confPerDate &&<th rowSpan="3" className='conf boldBorderRight boldBorderLeft' >保護者等<br />確認欄</th>}
      <th rowSpan="3" className='notice' >備考欄</th>
    </tr>
    <tr>{itemNodes}</tr>
    <tr>
      {items.includes("送迎加算") &&<>
        <th>往</th>
        <th>復</th>
      </>}
    </tr>
    </>
  )
}

const MainTableBody = (props) => {
  const com = useSelector(state => state.com);
  const stdDate = useSelector(state => state.stdDate);
  const eSignOn = com?.ext?.reportsSetting?.teikyouJisseki?.parentConfirmation?.eSign ?? com?.etc?.configReports?.teikyouJisseki?.parentConfirmation?.eSign ?? false;
  const confPerDate = com?.ext?.reportsSetting?.teikyouJisseki?.parentConfirmation?.confPerDate ?? com?.etc?.configReports?.teikyouJisseki?.parentConfirmation?.confPerDate ?? false;
  const displayOtherUseDate = com?.ext?.reportsSetting?.teikyouJisseki?.displayOtherUseDate ?? com?.etc?.configReports?.teikyouJisseki?.displayOtherUseDate ?? false;
  const {items, dDate, schDt, isLine23Style, selects, user, signUrls, service} = props;
  const line23Style = isLine23Style ?{height: '40px'} :{height: '30px'};

  const date = dDate && !(selects.includes("白紙") && !displayOtherUseDate) ?parseInt(dDate.slice(7, 9)) :"";
  const day = dDate && !(selects.includes("白紙") && !displayOtherUseDate) ?DAY_LIST[new Date(parseInt(dDate.slice(1, 5)), parseInt(dDate.slice(5, 7))-1, date).getDay()] :"";

  // const filename = service==="保育所等訪問支援" ?`dailysign-${dDate}-保育所訪問支援.png` :`dailysign-${dDate}-${service}.png`;
  // const imgUrl = signUrls.find(prevSignUrl => prevSignUrl.includes(filename));
  const imgUrl = signUrls.find(prevSignUrl => prevSignUrl.includes(`dailysign-${dDate}`));
  const itemNodes = items.map((item, i) => {
    const elementDt = getKasanElementDt({tableType: 'body', item, schDt, user, com, stdDate, dDate});
    console.log("dDate", dDate, "item", item, "schDt", schDt, "elementDt", elementDt)
    return(
      <>
      <td
        key={`tdItem${i}`}
        rowSpan={elementDt.rowSpan} colSpan={elementDt.colSpan}
        className={elementDt.className}
        style={line23Style}
      >
        {elementDt.value}
      </td>
      {elementDt.value2!==null &&<td
        key={`tdItem2-${i}`}
        rowSpan={elementDt.rowSpan} colSpan={elementDt.colSpan}
        className={elementDt.className}
        style={line23Style}
      >
        {elementDt.value2}
      </td>}
      </>
    )
  });
  const notice = schDt.notice ?? "";
  return(
    <tr>
      <td style={line23Style}>{date}</td>
      <td style={line23Style} className='boldBorderRight'>{day}</td>
      {itemNodes}
      {!confPerDate &&(
        <td style={line23Style} className='boldBorderRight boldBorderLeft'>
          {(!selects.includes("白紙") && eSignOn && imgUrl) &&<img src={imgUrl} style={{height: '100%'}} />}
        </td>
      )}
      <td style={line23Style}>{notice}</td>
    </tr>
  )
}

const TotalingRow = (props) => {
  const ref = useRef();
  const com = useSelector(state => state.com);
  const stdDate = useSelector(state => state.stdDate);
  const confPerDate = com?.ext?.reportsSetting?.teikyouJisseki?.parentConfirmation?.confPerDate ?? com?.etc?.configReports?.teikyouJisseki?.parentConfirmation?.confPerDate ?? false;
  const {items, schDts, user, dDates} = props;
  const [diagonalLineDt, setDiagonalLineDt] = useState({height: 0, width: 0});
  useEffect(() => {
    const elm = ref.current;
    if(elm){
      setDiagonalLineDt({height: elm.offsetHeight, width: elm.offsetWidth});
    }
  }, [ref.current]);
  const filteredItems = items.filter(item => !TOTALING_NOT_APPLICABLE_ITEMS.includes(item));
  const numOfRemoved = items.length - filteredItems.length;
  const nodes = filteredItems.map((item, i) => {
    let prevValue = 0, elementDt={};
    schDts.forEach((schDt, j) => {
      const dDate = dDates[j];
      elementDt = getKasanElementDt({tableType: 'totaling', item, schDt, prevValue, user, com, stdDate, dDate});
      prevValue = elementDt.currentValue;
    });
    if(!schDts.length){
      elementDt = getKasanElementDt({tableType: 'totaling', item, schDt: {}, prevValue, user, com, stdDate});
      prevValue = elementDt.currentValue;
    }
    return(
      <td
        key={`totalingItem${i}`}
        rowSpan={elementDt.rowSpan} colSpan={elementDt.colSpan}
        className={elementDt.className} style={{textAlign: 'end', ...elementDt.style}}
      >
        {prevValue!==0 &&prevValue}{prevValue!==0 &&elementDt.unit}
      </td>
    );
  });
  return(
    <tr>
      <th colSpan={2+numOfRemoved}>合計</th>
      {nodes}
      {!confPerDate &&<td className='conf boldBorderRight boldBorderLeft' style={{padding: 0}}>
        <div
          ref={ref}
          className='diagonalLine'
          style={{
            transform: `matrix(1, -${diagonalLineDt.height/diagonalLineDt.width}, 0, 1, 0, ${diagonalLineDt.height/2})`
          }}
        />
      </td>}
      <td className='notice' />
    </tr>
  )
}

const MainTable = (props) => {
  const classes = useStyles();
  const com = useSelector(state => state.com);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const dateList = useSelector(state => state.dateList);
  const {sch, service, dDates, selects, user, items} = props;
  const uid = user.uid;
  const displayOtherUseDate = com?.ext?.reportsSetting?.teikyouJisseki?.displayOtherUseDate ?? com?.etc?.configReports?.teikyouJisseki?.displayOtherUseDate ?? false;
  const displayAbsence = com?.ext?.reportsSetting?.teikyouJisseki?.displayAbsence ?? com?.etc?.configReports?.teikyouJisseki?.displayAbsence ?? "0";

  const [signUrls, setSignUrls] = useState([]);
  useEffect(() => {
    const params = new FormData();
    const directory = ["teikyuouJisseki", hid, bid, uid, stdDate];
    params.append('directory', JSON.stringify(directory));
    params.append('list', 1);
    const headers = {'content-type': 'multipart/form-data'}
    const directoryPath = directory.reduce((prevDirectoryPath, path) => {
      return `${prevDirectoryPath}/${path}`;
    }, "https://houday.rbatos.com/signature");
    axios.post('https://houday.rbatos.com/api/uploadSignatureImg.php', params, headers).then(res => {
      const files = res?.data?.files ?? [];
      console.log("signUrls", files)
      setSignUrls(files.map(filePath => `${directoryPath}/${filePath}`));
    });
  }, []);

  const schCnt = Object.keys(sch).reduce((prevCnt, did) => {
    if(!/^D\d{8}H?$/.test(did)) return prevCnt;
    const schDt = sch[did] ?? {};
    const hasDisplayItem = items.some(item => {
      const elementDt = getKasanElementDt({tableType: 'body', item, schDt, user, com, stdDate, dDate: did});
      return Boolean(elementDt?.value || elementDt?.value2);
    });
    // 欠席でも表示される項目がある場合は無条件で1行として扱う
    if(hasDisplayItem) return prevCnt + 1;
    const dAddiction = schDt.dAddiction ?? {};
    const hasAbsenceAddiction = Object.keys(dAddiction).some(key => ABSENCE_DADDICTION_KEYS.includes(key));
    // 「欠席時対応加算がない欠席を表示する」が未チェック時のみ欠席行を除外
    if(displayAbsence !== "1" && schDt.absence && !hasAbsenceAddiction) return prevCnt;
    prevCnt++;
    return prevCnt;
  }, 0);
  const dates = displayOtherUseDate ?dateList :schCnt<=23 ?Array(23).fill({}) :Array(schCnt).fill({});
  const isLine23Style = !Boolean(displayOtherUseDate);
  const tableBodyNodes = dates.map((dt, i) => {
    let dDate = "";
    if(dt.date){
      const dateObj = new Date(dt.date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth()+1).padStart(2, "0");
      const date = String(dateObj.getDate()).padStart(2, "0");
      dDate = `D${year}${month}${date}`;
    }else{
      dDate = dDates[i];
    }
    const schDt = service===HOHOU
      ? sch[dDate+"H"] ?? (sch[dDate]?.service === HOHOU ? sch[dDate] : {})
      : sch[dDate] ?? {};
    const schService = schDt.service;
    if(schService && service && schService !== service){
      if(!(service==="保育所等訪問支援" && schDt?.dAddiction?.["保育訪問"])){
        console.log("dDate", dDate, "schService", schService, "service", service)
        return null;
      }
    }
    const tableBodyProps = {
      items, dDate, schDt, user, isLine23Style, selects, signUrls, service
    }
    return(
      <MainTableBody key={`mainTdNodes${i}`} {...tableBodyProps} />
    )
  });
  const schDts = dDates.map(dDate => sch[dDate] ?? {});
  return(
    <table className={`${classes.mainTable} boldBorder`}>
      <thead className='boldBorder'>
        <MainTableHeader items={items} service={service} />
      </thead>
      <tbody>
        {tableBodyNodes}
      </tbody>
      <tfoot style={{borderTop: '2px double'}}>
        <TotalingRow  items={items} schDts={schDts} user={user} dDates={dDates}/>
      </tfoot>
    </table>
  )
}

const DatingTable = (props) => {
  const {service} = props;

  if(!["放課後等デイサービス", "児童発達支援"].includes(service)) return null;
  return(
    <table className='noneBorder' style={{width: 'fit-content'}}>
      <tbody>
        <tr>
          <th className='boldBorder' style={{width: 160}} >保育・教育等移行支援加算</th>
          <th className='boldBorder' style={{width: 80}} >移行日</th>
          <td className='boldBorder' style={{width: 128}} ></td>
          <th className='boldBorder' style={{width: 80}} >移行後算定日</th>
          <td className='boldBorder' style={{width: 128}} ></td>
        </tr>
        <tr>
          <th className='boldBorder' style={{width: 160}} >集中的支援加算</th>
          <th className='boldBorder' style={{width: 80}} >支援開始日</th>
          <td className='boldBorder' style={{width: 128}} ></td>
        </tr>
      </tbody>
    </table>
  )
}

const ParentConfirmation = ({user, service, reportDateDt}) => {
  const com = useSelector(state => state.com);
  const stdDate = useSelector(state => state.stdDate);
  const parentConfirmation = com?.ext?.reportsSetting?.teikyouJisseki?.parentConfirmation ?? com?.etc?.configReports?.teikyouJisseki?.parentConfirmation ?? {};
  if(!parentConfirmation.checked) return null;
  let year = "", month = "", date = "";
  if(parentConfirmation.printDate){
    const nDate = new Date();
    const jtInit = formatDate(nDate, 'YYYY-MM-DD');
    const jtDate = localStorage.getItem("reportsSettingDate")
      ?JSON.parse(localStorage.getItem("reportsSettingDate"))?.["提供実績記録票"] ?? jtInit
      :jtInit;
    year = jtDate.split("-")[0];
    month = jtDate.split("-")[1];
    date = jtDate.split("-")[2];
  }
  // サイン欄「印」表示設定
  const displayInn = com?.ext?.reportsSetting?.displayInn ?? com?.etc?.configReports?.displayInn ?? true;
  return(
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      margin: '8px 3%', 
    }}>
      <div style={{width: '50%'}}>
        <div>
          {year ?year :<span style={{margin: '2rem'}}/>}年
          {month ?month :<span style={{margin: '1rem'}}/>}月
          {date ?date :<span style={{margin: '1rem'}}/>}日
        </div>
        <div style={{marginTop: 4}}>上記の通り、{service}の提供を受けたことを確認します。</div>
      </div>
      <div>
        <div style={{display: 'inline-block', borderBottom: '1px solid', width: 360, paddingBottom: 2}}>
          <span style={{paddingRight: 16}}>名前</span>
          {parentConfirmation.bottomOfPage &&<span>{user.pname}</span>}
        </div>
        {displayInn &&<span>印</span>}
      </div>
    </div>
  )
}

const IndexTable = (props) => {
  const classes = useStyles();
  const {maxPageIndex="1", pageIndex="1"} = props;

  return(
    <table className={classes.indexTable}>
      <tbody>
        <tr>
          <td>{maxPageIndex}</td>
          <th>枚中</th>
          <td>{pageIndex}</td>
          <th>枚</th>
        </tr>
      </tbody>
    </table>
  )
}

const Sheet = (props) => {
  const classes = useStyles();
  const stdDate = useSelector(state => state.stdDate);
  const com = useSelector(state => state.com);
  const {user, sch, service, selects, reportDateDt} = props;
  const [stdYear, stdMonth] = stdDate.split("-");
  const exDate = getDateEx(stdYear, stdMonth, "01");

  const displayItems = com?.ext?.reportsSetting?.teikyouJisseki?.displayItems ?? com?.etc?.configReports?.teikyouJisseki?.displayItems ?? {};

  const items = (() => {
    if(service === HOUDAY) return HOUDAY_ITEMS;
    if(service === JIHATSU) return JIHATSU_ITEMS;
    if(service === HOHOU) return HOHOU_ITEMS;
    return [];
  })().filter(item => {
    if(displayItems[item] === false) return false;
    return true;
  });

  const teikyouJissekiOpt = com?.ext?.reportsSetting?.teikyouJisseki ?? com?.etc?.configReports?.teikyouJisseki ?? {};
  const displayAbsence = teikyouJissekiOpt.displayAbsence ?? "0";

  const dDates = Object.keys(sch).filter(dDate => {
    // keyがDyyyymmdd形式でないデータは無視
    if(!/^D[0-9]{8}H?$/.test(dDate)) return false;
    const schDt = sch[dDate] ?? {};
    // 予約データは無視
    if(schDt.reserve) return false;
    if(selects.includes("白紙")) return true;
    const onItems = items.some(item => {
      const elementDt = getKasanElementDt({tableType: 'body', item, schDt, user, com, stdDate, dDate});
      if(elementDt.value) return true;
      return false;
    });
    if(!onItems) return false;
    const schService = schDt.service;
    if(schService && schService !== service){
      if(!(service==="保育所等訪問支援" && schDt?.dAddiction?.["保育訪問"])) return false;
    }
    const dAddiction = schDt.dAddiction ?? {};
    // 利用なしの場合は計上する加算がない場合は無視
    if(schDt.noUse && !Object.keys(dAddiction).some(key => ABSENCE_DADDICTION_KEYS.includes(key))) return false;
    // 欠席でも計上する加算がない場合は無視
    if(schDt.absence && displayAbsence==="1" && !Object.keys(dAddiction).some(key => ABSENCE_DADDICTION_KEYS.includes(key))) return false;
    return true;
  });
  // 日付順にソート
  dDates.sort((a, b) => a.slice(1, 9) <= b.slice(1, 9) ?-1 :1);
  if(!selects.includes("白紙（利用なし含む）") && !dDates.length) return null;

  const mainTableProps = {sch, service, dDates, selects, user, items};
  return(
    <div className={classes.sheet}>
      <div className='date'>{exDate.wr.l}{String(exDate.wr.y).padStart(2, '0')}年{exDate.m}月分</div>
      <div className='title'>{service}提供実績記録票</div>
      <UserInfoTable user={user} service={service} />
      <MainTable {...mainTableProps} />
      <DatingTable service={service} />
      <ParentConfirmation user={user} service={service} reportDateDt={reportDateDt} />
      <IndexTable />
    </div>
  )
}

export const TeikyouJisseki2024 = (props) => {
  const classes = useStyles();
  const allState = useSelector(state => state);
  const {users, schedule, service, serviceItems, com, stdDate} = allState;
  const {userList, preview, selects, reportDateDt} = props;
  if(preview !== '提供実績記録票') return null;
  const teikyouJisseki2024Checked = com?.ext?.reportsSetting?.teikyouJisseki?.teikyouJisseki2024?.checked ?? com?.etc?.configReports?.teikyouJisseki?.teikyouJisseki2024?.checked ?? stdDate>=LC2024;
  const displaySelects = teikyouJisseki2024Checked
    ?['通常', '白紙', '白紙（利用なし含む）']
    :['23行【2024年版】', '白紙【2024年版】', '白紙（利用なし含む）【2024年版】'];
  if(!displaySelects.includes(selects))  return null;
  if(!getLodingStatus(allState).loaded){
    return <LoadingSpinner />
  }
  const displayService = service ?? serviceItems[0];
  const sheets = userList.flatMap((dt, i) => {
    if(!dt.checked) return [];
    const user = users.find(uDt => uDt.uid === dt.uid);
    if(!user) return [];
    if(displayService && !new RegExp(displayService).test(user.service)) return [];
    const uidStr = "UID" + dt.uid;
    const sch = (() => {
      const thisSch = schedule[uidStr] ?? {};
      if(selects.includes("白紙")){
        return Object.keys(thisSch).reduce((prevSch, dDate) => {
          prevSch[dDate] = {};
          return prevSch;
        }, {});
      }
      return thisSch;
    })();
    const services = user.service.split(",");
    return services.map((service, j) => {
      if(displayService && displayService !== service) return null;
      const sheetProps = {user, sch, service, selects, reportDateDt};
      return(<Sheet key={`sheet${i}-${j}`} {...sheetProps} />);
    });
  });
  
  return(
    <>
    <div className={classes.sheets}>
      {sheets}
    </div>
    {/* <SetPrintTitle printTitle="提供実績記録表" /> */}
    </>
  )
}