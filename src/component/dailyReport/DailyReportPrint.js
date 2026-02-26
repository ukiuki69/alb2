import React, { useEffect, useState } from "react";
import { Button, FormControl, FormLabel, makeStyles } from "@material-ui/core";
import { brtoLf, getLodingStatus, getUisCookie, makeUrlSearchParams, randomStr, uisCookiePos } from "../../commonModule";
import AssignmentReturnedIcon from '@material-ui/icons/AssignmentReturned';
import GridOnIcon from '@material-ui/icons/GridOn';
import { useSelector } from "react-redux";
import axios from "axios";
import { endPoint, getFilteredUsers, univApiCall } from '../../albCommonModule';
import { teal } from "@material-ui/core/colors";
import { LoadingSpinner, SetUisCookieChkBox, SetUisCookieRadioButtons } from "../common/commonParts";
import { SchDaySettingMenuTitle } from "../schedule/SchDaySettingNoDialog";
import { DailyReportLinksTab, checkValueType, getCalendarDate, useGetInitDate } from "./DailyReportCommon";
import { useGetHeaderHeight } from "../common/Header";
import { useSessionStorageState } from "../common/HashimotoComponents";
import SnackMsg from "../common/SnackMsg";

const SIDEBAR_WIDTH = 61.25;

const DOWNLOAD_TIME_LIMIT = 10 * 1000;

const RADIO_BUTTON_LABEL = [
  "全表示",
  "送迎なし",
  "活動内容なし",
  "バイタルなし",
  "送迎なし＋活動内容なし",
  "送迎なし＋バイタルなし",
  "活動内容なし＋バイタルなし",
  "送迎なし＋活動内容なし＋バイタルなし",
]

const requestReport = async(params, setExcelFile) => {
  let res = {};
  const axsObj = axios.create();
  axsObj.defaults.timeout = 30 * 1000;
  try{
    params.a = 'sendDocument';
    res = await axsObj.post(endPoint(), makeUrlSearchParams(params));
    if (!res.data.result){
      throw 'res';
    }
    params.a = 'excelgen';
    // params.prefix = 'brtest_';
    res = await axsObj.post(endPoint(), makeUrlSearchParams(params));
    if (!res.data.result) {
      throw 'res';
    }
    res.result = true;
    setExcelFile(res);
  }catch{
    // timeoutのときはresに何も入ってこない
    // そのときはtimeoutとして判断する。
    if (!Object.keys(res).length){
      res.timeout = true;
    }
    setExcelFile(res);
  }
}

const useStyles = makeStyles({
  AppPage: {
    width: '95vw',
    margin: `${82+32}px auto`,
    "@media (min-width: 1080px)": {
      maxWidth: 1080 + SIDEBAR_WIDTH,
      paddingLeft: SIDEBAR_WIDTH,
    },
  },
  printPage: {
    maxWidth: 880,
    margin: '0 auto',
    '& .downloadButton': {
      width: 'fit-content', margin: '0 auto'
    },
    "@media (min-width: 960px)": {
      '& .menu': {
        display: 'flex', justifyContent: 'space-between',
      },
    },
    "@media (max-width: 959px)": {
      '& .menu': {
        maxWidth: 432, margin: '0 auto',
        '& >div': {
          marginBottom: 32
        }
      }
    },
  },
  checkboxForm: {
    "@media (max-width: px)": {
      
    },
  },
  creating: {
    width: 144, height: 36.5,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: teal[300],
  },
  downloadButton: {
    width: 144,
    '& .button': {
      width: '100%'
    }
  }
});

export const ExcelDownloadButton = (props) => {
  const classes = useStyles();
  const {excelTemplate, makeExcelTemplate, dstName, content, makeContent, changedState, selectDate} = props;
  const [creating, setCreating] = useState(false);
  const [excelFile, setExcelFile] = useState({});
  const allState = useSelector(state => state);
  const {com, hid, bid, stdDate, service, serviceItems, classroom} = allState;
  let serviceE = service;
  if (service === '放課後等デイサービス') serviceE = 'HD';
  if (service === '児童発達支援') serviceE = 'JH';
  if (service === '保育所等訪問支援') serviceE = 'HH';
  if (serviceItems?.length < 2) serviceE = '';
  const classroomE = encodeURI(classroom).replace(/%/g, '').slice(0, 12);
  let serviceClassE = (serviceE && classroomE) ?serviceE + '-' + classroomE :serviceE + classroomE;
  serviceClassE = (serviceClassE) ?'-'+serviceClassE :'';

  useEffect(() => {
    setCreating(false);
    if(!Object.keys(excelFile).length) return;
    const intervalId = setInterval(() => {
      setExcelFile({});
    }, DOWNLOAD_TIME_LIMIT);
    return () => {
      clearInterval(intervalId);
    }
  }, [excelFile]);

  useEffect(() => {
    setCreating(false);
    setExcelFile({});
  }, [changedState])

  const makeExcelFile = async() => {
    let newExcelTepmlate = excelTemplate;
    if(makeExcelTemplate) newExcelTepmlate = makeExcelTemplate();
    let newContent = content;
    if(makeContent) newContent = await makeContent(newExcelTepmlate);
    // 記録・備考から改行をエクセル対応コードに変換
    
    const timestamp = new Date().getTime();
    const fprefix = (com.fprefix.length > 3 ?com.fprefix.slice(0, 3) :com.fprefix).toUpperCase();
    const dstFile = `${fprefix}-${selectDate}-${dstName}${serviceClassE}.xlsx`;
    const templateDir = randomStr(20);
    const dst = `/${templateDir}/${dstFile}`;
    const params = {hid, bid, stamp: timestamp, template: newExcelTepmlate,  dst, content: JSON.stringify(newContent)};

    setCreating(true);
    requestReport(params, setExcelFile);
  }

  if(creating){
    return(
      <div className={classes.creating}>
        作成中
      </div>
    )
  }
  if(excelFile?.data?.dstPath){
    return(
      <div className={classes.downloadButton}>
        <Button
          variant='contained'
          color='secondary'
          startIcon={<AssignmentReturnedIcon/>}
          href={`https://rbatosdata.com/docs${excelFile.data.dstPath}`}
          className="button"
        >
          ダウンロード
        </Button>
      </div>
    )
  }
  return(
    <div className={classes.downloadButton}>
      <Button
        color={'primary'}
        variant='contained'
        onClick={makeExcelFile}
        startIcon={<GridOnIcon />}
        disabled={!((excelTemplate || makeExcelTemplate) && dstName && (content || makeContent)) || props.disabled}
        className="button"
      >
        Excel作成
      </Button>
    </div>
  )
}

const CheckboxForm = (props) => {
  const classes = useStyles();
  const {setOption} = props;
  const helperTexts = [
    "送迎なし：「送迎の場所」「車両」「担当者」「時間」項目を非表示にします。",
    "活動内容なし：「活動内容」項目を非表示にします。",
    "バイタルなし：「体温」項目を非表示にします。"
  ];
  return(
    <div className={classes.checkboxForm}>
      <div className="form">
        <SetUisCookieRadioButtons
          p={uisCookiePos.dailyReportPrint}
          formLabel={"印刷形式"}
          radioLabels={RADIO_BUTTON_LABEL}
          setState={setOption}
          helperTexts={helperTexts}
          disabled={props.disabled}
        />
      </div>
    </div>
  )
}

const PrintOptionCheckboxes = (props) => {
  const classes = useStyles();
  const {disabled} = props;

  const checkboxStyle = {margin: '0', padding: 0, width: '100%'};
  return(
    <div className={classes.checkboxForm}>
      <div className="form">
        <FormControl disabled={disabled}>
          <FormLabel>印刷オプション</FormLabel>
          <SetUisCookieChkBox
            p={uisCookiePos.dailyReportPrintOption1}
            label='活動内容の欄に実費項目を記載する'
            style={checkboxStyle}
          />
          <SetUisCookieChkBox
            p={uisCookiePos.dailyReportPrintOption2}
            label='活動内容の欄に加算項目を記載する'
            style={checkboxStyle}
          />
          <SetUisCookieChkBox
            p={uisCookiePos.dailyReportPrintOption3}
            label='活動内容の欄に備考（加算説明等）を記載する'
            style={checkboxStyle}
          />
          <SetUisCookieChkBox
            p={uisCookiePos.dailyReportPrintOption4}
            label='活動内容の欄にメモ（事業所内連絡）を記載する'
            style={checkboxStyle}
          />
          <SetUisCookieChkBox
            p={uisCookiePos.dailyReportPrintOption5}
            label='療育記録の欄に実費項目を記載する'
            style={checkboxStyle}
          />
          <SetUisCookieChkBox
            p={uisCookiePos.dailyReportPrintOption6}
            label='療育記録の欄に加算項目を記載する'
            style={checkboxStyle}
          />
          <SetUisCookieChkBox
            p={uisCookiePos.dailyReportPrintOption7}
            label='療育記録の欄に備考（加算説明等）を記載する'
            style={checkboxStyle}
          />
          <SetUisCookieChkBox
            p={uisCookiePos.dailyReportPrintOption8}
            label='療育記録の欄にメモ（事業所内連絡）を記載する'
            style={checkboxStyle}
          />
        </FormControl>
      </div>
    </div>
  )
}

const makeActivitiesContentTitle = () => {
  let result = "活動内容";
  if(getUisCookie(uisCookiePos.dailyReportPrintOption1) === "1") result += "・実費";
  if(getUisCookie(uisCookiePos.dailyReportPrintOption2) === "1") result += "・加算";
  if(getUisCookie(uisCookiePos.dailyReportPrintOption3) === "1") result += "・備考";
  if(getUisCookie(uisCookiePos.dailyReportPrintOption4) === "1") result += "・メモ";
  return result;
}

const makeActivitiesContent = (activities, actualCost, dAddiction, addiction, schNotice, schMemo) => {
  let result = "";
  if(activities && activities.length) result += activities.join("　");
  if(getUisCookie(uisCookiePos.dailyReportPrintOption1)==="1" && actualCost && Object.keys(actualCost).length){
    if(result) result += "\n";
    Object.keys(actualCost).forEach((key, i) => {
      if(i === 0) result += "●";
      result += `${key}: ${actualCost[key]}円`
      if(Object.keys(actualCost).length > i+1) result += "　";
    });
  }
  if(getUisCookie(uisCookiePos.dailyReportPrintOption2)==="1" && dAddiction && Object.keys(dAddiction).length){
    if(result) result += "\n";
    Object.keys(dAddiction).forEach((key, i) => {
      if(i === 0) result += "●";
      result += key
      if(Object.keys(dAddiction).length > i+1) result += "　";
    });
  }
  if(getUisCookie(uisCookiePos.dailyReportPrintOption2)==="1" && addiction && Object.keys(addiction).length){
    if(dAddiction && Object.keys(dAddiction).length) result += "　"
    else if(result) result += "\n";
    Object.keys(addiction).forEach((key, i) => {
      if(i === 0 && !(dAddiction && Object.keys(dAddiction).length)) result += "●";
      result += key
      if(Object.keys(addiction).length > i+1) result += "　";
    });
  }
  if(getUisCookie(uisCookiePos.dailyReportPrintOption3)==="1" && schNotice){
    if(result) result += "\n";
    result += "●"+schNotice;
  }
  if(getUisCookie(uisCookiePos.dailyReportPrintOption4)==="1" && schMemo){
    if(result) result += "\n";
    result += "●"+schMemo;
  }
  return result;
}

const makeNoticeContentTitle = () => {
  let result = "記録";
  if(getUisCookie(uisCookiePos.dailyReportPrintOption5) === "1") result += "・実費";
  if(getUisCookie(uisCookiePos.dailyReportPrintOption6) === "1") result += "・加算";
  if(getUisCookie(uisCookiePos.dailyReportPrintOption7) === "1") result += "・備考";
  if(getUisCookie(uisCookiePos.dailyReportPrintOption8) === "1") result += "・メモ";
  return result;
}

const makeNoticeContent = (dailyReportNotice, actualCost, dAddiction, addiction, schNotice, schMemo) => {
  let result = "";
  if(dailyReportNotice) result += dailyReportNotice;
  if(getUisCookie(uisCookiePos.dailyReportPrintOption5)==="1" && actualCost && Object.keys(actualCost).length){
    if(result) result += "\n";
    Object.keys(actualCost).forEach((key, i) => {
      if(i === 0) result += "●";
      result += `${key}: ${actualCost[key]}円`
      if(Object.keys(actualCost).length > i+1) result += "　";
    });
  }
  if(getUisCookie(uisCookiePos.dailyReportPrintOption6)==="1" && dAddiction && Object.keys(dAddiction).length){
    if(result) result += "\n";
    Object.keys(dAddiction).forEach((key, i) => {
      if(i === 0) result += "●";
      result += key
      if(Object.keys(dAddiction).length > i+1) result += "　";
    });
  }
  if(getUisCookie(uisCookiePos.dailyReportPrintOption6)==="1" && addiction && Object.keys(addiction).length){
    if(dAddiction && Object.keys(dAddiction).length) result += "　"
    else if(result) result += "\n";
    Object.keys(addiction).forEach((key, i) => {
      if(i === 0 && !(dAddiction && Object.keys(dAddiction).length)) result += "●";
      result += key
      if(Object.keys(addiction).length > i+1) result += "　";
    });
  }
  if(getUisCookie(uisCookiePos.dailyReportPrintOption7)==="1" && schNotice){
    if(result) result += "\n";
    result += "●"+schNotice;
  }
  if(getUisCookie(uisCookiePos.dailyReportPrintOption8)==="1" && schMemo){
    if(result) result += "\n";
    result += "●"+schMemo;
  }
  return result;
}

export const DailyReportPrint = () => {
  const headerHeight = useGetHeaderHeight();
  const classes = useStyles();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {hid, bid, stdDate, schedule, com, users, service, serviceItems, classroom} = allState;
  const displayService = service || serviceItems[0];
  const classrooms = users.filter(user => {
    if(!(user?.service ?? "").includes(displayService)) return false;
    if(!user?.classroom) return false;
    return true;
  }).reduce((prevClassrooms, user) => {
    const thisClassrooms = user.classroom.split(",");
    thisClassrooms.forEach(thisClassroom => {
      if(!prevClassrooms.includes(thisClassroom)) prevClassrooms.push(thisClassroom);
    });
    return prevClassrooms;
  }, []);
  const schDailyReportSetting = com?.ext?.schDailyReportSetting ?? {};
  const initDate = useGetInitDate();
  const [selectDate, setSelectDate] = useSessionStorageState(initDate, `schDailyReportDate${stdDate}`);
  const [option, setOption] = useState(getUisCookie(uisCookiePos.dailyReportPrint) ?? "0");
  const [snack, setSnack] = useState({});

  if(!(loadingStatus.loaded && selectDate)) return(
    <>
    <DailyReportLinksTab />
    <LoadingSpinner />
    </>
  )

  const makeExcelTemplate = () => {
    const radioButtonValue = getUisCookie(uisCookiePos.dailyReportPrint);
    const label = RADIO_BUTTON_LABEL[parseInt(radioButtonValue)];
    let excelTemplate = "dailyreport2";
    if(label.includes("送迎なし")){
      excelTemplate += "-nottransfer";
    }
    if(label.includes("活動内容なし")){
      excelTemplate += "-notactivities";
    }
    if(label.includes("バイタルなし")){
      excelTemplate += "-notvital";
    }
    return excelTemplate + ".xlsx";
  }

  const dDate = "D"+selectDate.replace(/-/g, "");
  const filteredUsers = (() => {
    const serviceClassroomUsers = getFilteredUsers(users, service, classroom);
    const thisScheduleUsers = serviceClassroomUsers.filter(user => schedule?.["UID"+user.uid]?.[dDate]);
    return thisScheduleUsers;
  })();

  const makeContent = async(excelTemplate) => {
    try{
      const params = {"a": "fetchDailyReport", hid, bid, date: stdDate};
      const res = await univApiCall(params);
      if(!res?.data?.result){
        setSnack({msg: 'データ取得失敗。時間をおいて再度お試しください。', severity: 'error', errorId: "DR002"});
        return;
      }
      const dailyReportDt = res?.data?.dt?.[0]?.dailyreport ?? {};

      let deleteKeys = [];
      if(excelTemplate.includes("nottransfer")){
        deleteKeys = [
          ...deleteKeys,
          "pickupLocation", "pickupCar", "pickupStaff", "pickup",
          "dropoff", "dropoffLocation", "dropoffCar", "dropoffStaff",
        ];
      }
      if(excelTemplate.includes("notactivities")){
        deleteKeys = [...deleteKeys, "activities"];
      }
      if(excelTemplate.includes("notvital")){
        deleteKeys = [...deleteKeys, "temperature"]
      }
      const tableKeys = [
        "index", "name", "temperature",
        "pickupLocation", "pickupCar", "pickupStaff", "pickup", "start",
        "end", "dropoff", "dropoffLocation", "dropoffCar", "dropoffStaff",
        "activities", "notice"
      ]
      const deletedTableKeys = tableKeys.filter(key => !deleteKeys.includes(key));

      const letStartBePickup = schDailyReportSetting?.letStartBePickup ?? true;
      const data = filteredUsers.map((user, i) => {
        const sch = schedule?.["UID"+user.uid]?.[dDate] ?? {};
        const userDaikyReportDt = dailyReportDt?.["UID"+user.uid]?.[dDate] ?? {};
        const actualCost = checkValueType(sch.actualCost, 'Object') ?sch.actualCost :{};
        const dAddiction = checkValueType(sch.dAddiction, 'Object') ?sch.dAddiction :{};
        const addiction = checkValueType(user?.etc?.addiction, 'Object') ?user.etc.addiction :{};
        const schNotice = sch.notice ?? "";
        const schMemo = sch.memo ?? "";
        const pickupLocation = userDaikyReportDt.pickupLocation ?? "";
        const noPickup = !pickupLocation || pickupLocation.startsWith("*") || pickupLocation.endsWith("*");
        const dropoffLocation = userDaikyReportDt.dropoffLocation ?? "";
        const noDropoff = !dropoffLocation || dropoffLocation.startsWith("*") || dropoffLocation.endsWith("*");
        return deletedTableKeys.map(key => {
          if(key === "index") return i+1;
          if(userDaikyReportDt[key] !== undefined){
            if(key === "activities"){
              return brtoLf(makeActivitiesContent(userDaikyReportDt.activities, actualCost, dAddiction, addiction, schNotice, schMemo));
            }
            if(key === "notice"){
              return brtoLf(makeNoticeContent(userDaikyReportDt?.notice, actualCost, dAddiction, addiction, schNotice, schMemo));
            }
            if(key === "name"){
              const absence = sch?.absence ?? false;
              return (user.name ?? "") + (absence ?"（欠席）" :"");
            }
            if(!sch.transfer?.[0]){
              // 迎えがない場合
              if(key === "pickup") return "";
              if(key === "pickupStaff") return "";
              if(key === "pickupCar") return "";
              if(key === "pickupLocation") return "送迎なし";
            }
            if(!sch.transfer?.[1]){
              // 迎えがない場合
              if(key === "dropoff") return "";
              if(key === "dropoffStaff") return "";
              if(key === "dropoffCar") return "";
              if(key === "dropoffLocation") return "送迎なし";
            }
            if(noPickup){
              // 迎えがない場合
              if(key === "pickup") return "";
              if(key === "pickupStaff") return "";
              if(key === "pickupCar") return "";
              if(key === "pickupLocation" && !userDaikyReportDt[key]) return "送迎なし";
            }
            if(noDropoff){
              // 送りがない場合
              if(key === "dropoff") return "";
              if(key === "dropoffStaff") return "";
              if(key === "dropoffCar") return "";
              if(key === "dropoffLocation" && !userDaikyReportDt[key]) return "送迎なし";
            }
            if(key==="pickupStaff" && userDaikyReportDt.pickupSubStaff){
              return brtoLf(`${userDaikyReportDt?.pickupStaff ?? ""}\n${userDaikyReportDt?.pickupSubStaff ?? ""}`);
            }
            if(key==="dropoffStaff" && userDaikyReportDt.dropoffSubStaff){
              return brtoLf(`${userDaikyReportDt?.dropoffStaff ?? ""}\n${userDaikyReportDt?.dropoffSubStaff ?? ""}`);
            }
            return userDaikyReportDt[key];
          }
          switch(key){
            case "name": {
              const absence = sch?.absence ?? false;
              return (user.name ?? "") + (absence ?"（欠席）" :"");
            }
            case "pickup": {
              return letStartBePickup && sch.transfer?.[0] ?sch.start :"";
            }
            case "start": {
              return letStartBePickup && sch.transfer?.[0] ?"" :sch.start;
            }
            case "end": {
              return sch.end ?? "";
            }
            case "pickupLocation": {
              return sch.transfer?.[0] ?sch.transfer?.[0] :"送迎なし";
            }
            case "dropoffLocation": {
              return sch.transfer?.[1] ?sch.transfer?.[1] :"送迎なし";
            }
            case "activities": {
              return brtoLf(makeActivitiesContent(null, actualCost, dAddiction, addiction, schNotice, schMemo));
            }
            case "notice": {
              return brtoLf(makeNoticeContent(null, actualCost, dAddiction, addiction, schNotice, schMemo));
            }
            default: {
              return ""
            }
          }
        });
      });
      const year = dDate.slice(1, 5);
      const month = dDate.slice(5, 7);
      const date = dDate.slice(7, 9);
      let overallNotice = "";
      if(dailyReportDt?.jNotice?.[dDate]){
        // 事業所全体の記録がある場合
        overallNotice += "■事業所全体の記録\n"
          + `${dailyReportDt?.jNotice?.[dDate]}\n`
          + "\n";
      }
      if(dailyReportDt?.[`${displayService}Notice`]?.[dDate]){
        // サービス別の全体の記録がある場合
        overallNotice += `■${displayService}全体の記録\n`
          + `${dailyReportDt?.[`${displayService}Notice`]?.[dDate]}\n`
          + "\n";
      }
      if(classroom === ""){
        // 全単位選択時
        classrooms.forEach(prevClassroom => {
          if(dailyReportDt?.[`${displayService}${prevClassroom}Notice`]?.[dDate]){
            overallNotice += `■${displayService}・${prevClassroom}全体の記録\n`
              + `${dailyReportDt?.[`${displayService}${prevClassroom}Notice`]?.[dDate]}\n`
              + "\n";
          }
          if(dailyReportDt?.[`${prevClassroom}Notice`]?.[dDate]){
            overallNotice += `■${prevClassroom}全体の記録\n`
              + `${dailyReportDt?.[`${prevClassroom}Notice`]?.[dDate]}\n`
              + "\n";
          }
        });
      }else{
        if(dailyReportDt?.[`${displayService}${classroom}Notice`]?.[dDate]){
          overallNotice += `■${displayService}・${classroom}全体の記録\n`
            + `${dailyReportDt?.[`${displayService}${classroom}Notice`]?.[dDate]}\n`
            + "\n";
        }
        if(dailyReportDt?.[`${classroom}Notice`]?.[dDate]){
          overallNotice += `■${classroom}全体の記録\n`
            + `${dailyReportDt?.[`${classroom}Notice`]?.[dDate]}\n`
            + "\n";
        }
      }
      return {
        data, hideEmpRows: 'data',
        service: com.service, date: `${year}年${month}月${date}日`, yearmonth: `${year}年${month}月`, bname: com.bname,
        // jNotice: dailyReportDt?.jNotice?.[dDate] ?brtoLf(dailyReportDt?.jNotice?.[dDate]) :"",
        jNotice: brtoLf(overallNotice),
        activitiesTitle: makeActivitiesContentTitle(), noticeTitle: makeNoticeContentTitle(),
      };
    }catch(error){
      setSnack({msg: "Excelの生成に失敗しました。時間をおいて再度お試しください。", severity: 'error', errorId: "DR004"})
    }
  }

  const disabled = !filteredUsers.some(user => schedule?.["UID"+user.uid]?.[dDate] ?true :false);

  return(
    <>
    <DailyReportLinksTab />
    <div className={classes.AppPage} style={headerHeight ?{marginTop: headerHeight+32} :{}}>
      <SchDaySettingMenuTitle title="日報" targetDate={selectDate} setTargetDate={setSelectDate} />
      <div className={classes.printPage}>
        <div className="menu">
          <CheckboxForm setOption={setOption} disabled={disabled} />
          <PrintOptionCheckboxes disabled={disabled} />
        </div>
        <div className="downloadButton">
          <ExcelDownloadButton
            makeExcelTemplate={makeExcelTemplate}
            dstName={"NIPPOU"}
            makeContent={makeContent}
            changedState={option}
            selectDate={selectDate}
            disabled={disabled}
          />
        </div>
      </div>  
    </div>
    <SnackMsg {...snack} />
    </>
  )
}