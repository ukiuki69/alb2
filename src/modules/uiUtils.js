import { getCookeis, setCookeis } from './cookies';

/**
 * UI状態管理に関連するユーティリティ
 */

// スナックバー表示やオートセーブを制御するために
// フォームなどが開いていないかどうか確認する
export const isEditElementOpen = () => {
  const formOpen = document.querySelectorAll('form.dialogForm').length;
  let dialogOpen = document.querySelectorAll('.MuiDialog-container .dialogTitle').length;
  dialogOpen += document.querySelectorAll('.MuiDialog-container .MuiDialogTitle-root').length;
  const drowerOpne = document.querySelectorAll('.MuiDrawer-root .drowerMenu').length;
  const printPreview = Array.from(document.querySelectorAll('.AppPage.reports .printPreview'))
    .filter((e) => e.style.display !== 'none').length;

  return formOpen + dialogOpen + drowerOpne + printPreview;
};

// ui関連クッキーの記述位置を定義する
export const uisCookiePos = {
  hidePersonalInfo: 0,
  templateAutoSave: 1,
  usersSchViewVirtical: 2,
  selectInputAuto: 3,
  noUseDayNoDispOnWeeklyTransfer: 4,
  useHohouService: 5,
  useSoudanShienService: 6,
  schDailySorted: 7,
  cntbkFullText: 8,
  reportsUsersCalendarVerticalDisplay: 9,
  useExtraShortCutKey: 10,
  useAddDeleteButtonOnFab: 11,
  useTemplatePaste: 12,
  hintMinimum: 13,
  notDisplayHint: 14,
  notDisplaySchMarker: 15,
  addictionsDisplayLarge: 16,
  displayContOnSchWeekly: 17,
  dailyReportPrint: 18,
  changePerTransferToPerGroupe: 19,
  dailyReportPrintOption1: 20,
  dailyReportPrintOption2: 21,
  dailyReportPrintOption3: 22,
  dailyReportPrintOption4: 23,
  dailyReportPrintOption5: 24,
  dailyReportPrintOption6: 25,
  dailyReportPrintOption7: 26,
  dailyReportPrintOption8: 27,
  usersDispContractEnd: 40,
  displayKobetuSupportOnSchEditDetail: 41,
  displayCitiesHnoOnProseed: 42,
  displaySortCitiesOnProseed: 43,
  addRevNoToSendFineNmae: 44,
  noPrefixUseBid: 45,
  allDowmloadAsZip: 46,
  useKanjiToDownloadFile: 47,
  useOldMethodMakeDownloadFile: 48,
  kbShortCutDisabled: 49,
  byUserAddictionWarning: 50,
  useJdateBirthddayDisp: 51,
  planAiButtonDisplay: 52,
  noOccuRateDispOnPrint: 53,
  userSchNoAbbreviation: 54,
  displayContOnReportsUsersCalendar: 55,
  displayAcCostOnPsDispDetailOfUsers: 56,
  allowDispAllOnScheduleMonthly: 57,
  notDispSochiseikyuuOnProseed: 58,
  notAutoScrollOnProseed: 59,
  useEncryption: 60,
  addDateTimeToFileName: 61,
  useUserEdit2026: 62,
};

// ui関連のクッキーをまとめる
export const setUisCookie = (p, v) => {
  let uis = getCookeis('uis');
  const maxp = 100;
  v = (v + '').slice(0, 1);
  uis = uis ? uis : '';
  uis = (uis.length >= maxp) ? uis : (uis + '0'.repeat(maxp)).slice(0, maxp);
  uis = (uis.length > maxp) ? uis.slice(0, maxp) : uis;
  uis = uis.slice(0, p) + v + uis.slice(p + 1);
  setCookeis('uis', uis);
};

export const getUisCookie = (p) => {
  let uis = getCookeis('uis');
  return uis ? uis.slice(p, p + 1) : null;
};

// intにして返す
export const getUisCookieInt = (p) => parseInt(getUisCookie(p));

/**
 * 全てのstateを受け取ってローディング状態を返す
 */
export const getLodingStatus = (allstate) => {
  const sessionDone = allstate.sessionStatus.done;
  const scheduleDone = allstate.fetchSchedule.done;
  const calenderDone = allstate.fetchCalenderStatus.done;
  const userDone = allstate.userFtc.done;
  const comDone = allstate.comFtc.done;
  const sessionErr = allstate.sessionStatus.err;
  const scheduleErr = allstate.fetchSchedule.err;
  const calenderErr = allstate.fetchCalenderStatus.err;
  const userErr = allstate.userFtc.err;
  const comErr = allstate.comFtc.err;
  const serviceItemsInit = allstate.serviceItemsInit;
  // serviceItemsInit のセットが遅延するケースに備え、userDone を満たしていれば
  // フォールバック的にロード完了とみなす
  const serviceItemsReady = serviceItemsInit || userDone;
  const loaded =
    sessionDone &&
    scheduleDone &&
    calenderDone &&
    userDone &&
    comDone &&
    serviceItemsReady;
  const error =
    sessionErr || scheduleErr || calenderErr || userErr || comErr;
  return {
    loaded,
    error,
    detail: {
      sessionDone,
      scheduleDone,
      calenderDone,
      userDone,
      comDone,
      sessionErr,
      scheduleErr,
      calenderErr,
      userErr,
      comErr,
      serviceItemsInit,
    },
  };
};

/**
 * uriを解釈する
 */
export const locationPrams = () => {
  const href = window.location.href;
  const body = href.split('?')[0];
  const prms = href.split('?')[1] ? href.split('?')[1] : null;
  const detail = {};
  const ary = !prms ? [] : prms.split('&') ? prms.split('&') : [];
  ary.map((e) => {
    detail[e.split('=')[0]] = e.split('=')[1] ? e.split('=')[1] : '';
  });
  return { href, body, prms, detail };
};

/**
 * クリップボードにコピー
 */
export const toClipboard = (text, setSnack, msg = '') => {
  navigator.clipboard.writeText(text).then(
    function () {
      console.log('Async: Copying to clipboard was successful!');
      if (typeof setSnack === 'function') {
        if (!msg) {
          setSnack({ msg: 'コピーしました。', severity: '' });
        } else {
          setSnack({ msg, severity: '' });
        }
      }
    },
    function (err) {
      console.error('Async: Could not copy text: ', err);
    }
  );
};

/**
 * キーボードイベントを受け取る
 * command key または ctrl key が押下されているか判定
 */
export const isCmmdOrCtrl = (ev) => {
  if ((ev.ctrlKey && !ev.metaKey) || (!ev.ctrlKey && ev.metaKey)) {
    return true;
  } else return false;
};

export const qslct = (s) => document.querySelector(s);
export const qslcta = (s) => document.querySelectorAll(s);

