import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@material-ui/core";
import { useSelector } from "react-redux";
import { getLodingStatus } from "../../commonModule";
import { processDeepBrToLf } from "../../modules/newlineConv";
import { LoadingSpinner } from "../common/commonParts";
import { useFetchAlbDt } from "../common/HashimotoComponents";
import SnackMsg from "../common/SnackMsg";
import { DailyReportLinksTab, getCalendarDate } from "./DailyReportCommon";
import { useLocation } from "react-router-dom";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import SettingsIcon from '@material-ui/icons/Settings';
import { getLS, setLocalStorage } from "../../modules/localStrageOprations";
import SetPrintTitle from "../common/SetPrintTitle";

import {
  scrollOffset, getAddictionListFromSch, getExistActualCost, getDailyReportpropertys,
  getNoticeKeysWithContent, getGoalEvaluationItemSet, getGoalEvaluationFilterLabel
} from "./utils/browseHelpers";
import { makeProcessData, makeProcessDataByDate } from "./utils/browseDataProcessors";
import {
  useStyles, CheckBoxFilter, PrintOptionDialog,
  SidebarDateItem, SidebarUserItem, DateViewSection, UserViewSection
} from "./DailyReportBrowseSubComponents";

const DailyReportBrowseMain = (props) => {
  const { data } = props;
  const classes = useStyles();

  const allState = useSelector(s => s);
  const { users: sUsers, service, classroom, schedule, dateList, stdDate } = allState;
  const users = sUsers.filter(e => e.service.includes(service) && e.classroom.includes(classroom));
  const userMap = useMemo(() => {
    const map = {};
    users.forEach(u => { map[u.uid] = u; });
    return map;
  }, [users]);
  const [userList, setUserList] = useState(
    users.map(e => ({ uid: e.uid, checked: true }))
  );
  const lsIsDateViewLocalStorageKey = 'DAILYREPORTBROWS_IS_DATEVIEW';
  const [isDateView, setIsDateView] = useState(getLS(lsIsDateViewLocalStorageKey) || false);
  const addictionList = getAddictionListFromSch(schedule);
  const existActualCost = getExistActualCost(schedule);
  const noticeKeys = getNoticeKeysWithContent(data, service, classroom);
  const generalNoticeKeys = noticeKeys.filter(key => !key.includes("TrainingNotice"));
  const trainingNoticeKeys = noticeKeys.filter(key => key.includes("TrainingNotice"));
  const hasGeneralNotice = generalNoticeKeys.length > 0;
  const hasTrainingNotice = trainingNoticeKeys.length > 0;
  const goalEvaluationItems = getGoalEvaluationItemSet(data);
  const filterInit = {
    利用時間: true, 送迎: true, 療育記録: true, 活動: true,
  }
  const propertys = getDailyReportpropertys(data);
  if (propertys.includes('hiyariHatto')) filterInit.ヒヤリハット = true;
  addictionList.forEach(e => {
    if (existActualCost) filterInit.実費 = true;
    if (e.includes('欠席')) filterInit.欠席 = true;
    if (e.includes('家族支援')) filterInit.家族支援 = true;
    if (e.includes('子育て')) filterInit.子育て = true;
    if (e.includes('専門的支援実施')) filterInit.専門支援 = true;
    if (e.includes('関係機関連携')) filterInit.関係連携 = true;
    if (e.includes('事業所間連携')) filterInit.事業所間連携 = true;
  });
  ["personalSupport", "senmonShien", "personalSupportHohou"].forEach((item) => {
    if (!goalEvaluationItems.has(item)) return;
    const label = getGoalEvaluationFilterLabel(item);
    if (label) filterInit[label] = true;
  });
  if (isDateView && hasGeneralNotice) filterInit.事業所の記録 = true;
  if (isDateView && hasTrainingNotice) filterInit.法定研修記録 = true;
  const [filters, setFilters] = useState({...filterInit});
  const [specifiedDate, setSpecifiedDate] = useState(false);
  const location = useLocation();

  const processedData = useMemo(() => {
    if (isDateView) {
      const r = makeProcessDataByDate({
        data, userMap, filters, schedule, userList, specifiedDate, 
        classes, users, service, classroom
      });
      console.log('processedData', r, specifiedDate);
      return r;
    } else {
      const r = makeProcessData({
        data, userMap, filters, schedule, userList, classes, users
      });
      console.log('processedData', r, specifiedDate);
      return r;
    }
  }, [filters, userList, isDateView, specifiedDate, userMap, service, classroom]);

  useEffect(()=>{
    console.log(isDateView, 'isDateView updated.');

  }, [isDateView])

  useEffect(()=>{
    console.log(specifiedDate, 'specifiedDate updated.')
  }, [specifiedDate])

  const history = useHistory();
  const [printOption, setPrintOption] = useState('multiple');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(()=>{
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      if (isDateView && hasGeneralNotice) {
        if (typeof newFilters.事業所の記録 !== 'boolean') newFilters.事業所の記録 = true;
      } else {
        delete newFilters.事業所の記録;
      }

      if (isDateView && hasTrainingNotice) {
        if (typeof newFilters.法定研修記録 !== 'boolean') newFilters.法定研修記録 = true;
      } else {
        delete newFilters.法定研修記録;
      }

      return newFilters;
    });
    setLocalStorage(lsIsDateViewLocalStorageKey, isDateView);
  }, [isDateView, hasGeneralNotice, hasTrainingNotice])

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const uniqueIds = isDateView
    ? Object.keys(processedData).filter(e => processedData[e].length).sort((a, b) => (a < b ? -1 : 1))
    : Array.from(new Set(processedData.map((row) => row.uid)));

  const handleScroll = (uid) => {
    const element = document.getElementById(uid);
    if (element) {
      const y = element.offsetTop + scrollOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleDialogOpen = () => {
    if (typeof setDialogOpen === 'function') {
      setDialogOpen(true);
    } else {
      console.error('setDialogOpen is not a function:', setDialogOpen);
    }
  };

  const nameSectionMulti = (printOption === 'multiple') ? classes.nameSectionMulti : '';
  const checkBoxFilterProps = {
    filters, setFilters, userList, setUserList, isDateView, setIsDateView,
    specifiedDate, setSpecifiedDate,
  }
  const sidebarProps = {
    stdDate, processedData, dateList, history, location,
    handleScroll, specifiedDate, setSpecifiedDate, users,
  };
  return (
    <div>
      <CheckBoxFilter {...checkBoxFilterProps}/>
      {uniqueIds.length > 0 &&
        <div className={`${classes.sidebar} ${isDateView ? classes.sidebarDate : ''}`}>
          <div className='settingButton'>
            <Button onClick={handleDialogOpen} startIcon={<SettingsIcon/>}>
              印刷設定
            </Button>
          </div>
          {uniqueIds.map((id, index) => (
            isDateView
              ? <SidebarDateItem key={index} id={id} index={index} {...sidebarProps} />
              : <SidebarUserItem key={index} id={id} index={index} {...sidebarProps} />
          ))}
        </div>
      }
      <div className={`${classes.tableContainer} ${isDateView ? classes.tableContainerDate : ''}`}>
        {isDateView ? (
          <DateViewSection {...{processedData, dateList, stdDate, specifiedDate, classes, nameSectionMulti}} />
        ) : (
          <UserViewSection {...{processedData, uniqueIds, classes, nameSectionMulti}} />
        )}
      </div>
      <PrintOptionDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        printOption={printOption}
        isDateView={isDateView}
        setPrintOption={setPrintOption}
      />
      <SetPrintTitle printTitle={isDateView ? '記録一覧（日付別）' : '記録一覧（利用者別）'} />
    </div>
  );
};

export const DailyReportBrowse = (props) => {
  const classes = useStyles();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const { stdDate, users, schedule, service, classroom, hid, bid, com } = allState;
  const [snack, setSnack] = useState({});
  const [date, setDate] = useState(null);
  const [dailyReportDt] = useFetchAlbDt(
    { "a": "fetchDailyReport", hid, bid, date: stdDate }, ["dailyreport"], false, {}, setSnack
  );
  const lastMonthStdDate = (() => {
    const stdDateParts = stdDate.split("-").map(x => parseInt(x));
    const dateObj = new Date(stdDateParts[0], stdDateParts[1] - 1 - 1, 1);
    return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-01`;
  })();
  const [lastMonthDailyReportDt] = useFetchAlbDt({ "a": "fetchDailyReport", hid, bid, date: lastMonthStdDate }, ["dailyreport"], false, {}, setSnack);
  const [contactBookDt] = useFetchAlbDt({ "a": "fetchContacts", hid, bid, date: stdDate }, ["contacts"], false, {}, setSnack);
  const settingContactBook = com?.etc?.settingContactBook ?? {};

  // ネストされたオブジェクトの改行処理を適用
  const processedDailyReportDt = useMemo(() => {
    return processDeepBrToLf(dailyReportDt);
  }, [dailyReportDt]);

  const processedLastMonthDailyReportDt = useMemo(() => {
    return processDeepBrToLf(lastMonthDailyReportDt);
  }, [lastMonthDailyReportDt]);

  useEffect(() => {
    if (date) sessionStorage.setItem(`schDailyReportDate${stdDate}`, date);
  }, [date]);

  useEffect(() => {
    setDate(getCalendarDate(stdDate));
  }, []);

  if (!(loadingStatus.loaded && date && dailyReportDt && lastMonthDailyReportDt && contactBookDt)) return (
    <>
      <DailyReportLinksTab />
      <LoadingSpinner />
    </>
  );

  const mainTableProps = {
    data: processedDailyReportDt
  };

  return (
    <>
      <DailyReportLinksTab />
      <div className={classes.root}>
        <DailyReportBrowseMain {...mainTableProps} />
      </div>
      <SnackMsg {...snack} />
    </>
  );
};

export default DailyReportBrowse;
