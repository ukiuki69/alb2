import React, {useEffect, useState, Suspense} from 'react';
import { HashRouter, Route, Switch, useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom';
import * as Actions  from './Actions'
import Users from './component/Users/Users';
// import Schedule from './component/schedule/Schedule';
import Sch2 from './component/schedule/Sch2';
import SchCalWrapp from './component/schedule/SchCalWrapp';
import Reports from './component/reports/Reports';
import 
  Setting, { 
    StandardSettings, AddictionSettings,
    OthesSettings, RegParamsSettings, ExstraSettings,
  } 
  from './component/Setting/Setting';
import { ScheduleSettings } from './component/Setting/ScheduleSettings';
import AlfamiReserveSetting from './component/Setting/AlfamiReserveSetting';
import Account from './component/account/Account';
import Hoge from './Hoge';
import store from './store';
import * as comMod from './commonModule';
import './index.css';
import { connect, useSelector, useDispatch } from 'react-redux';
import { Provider } from 'react-redux'
import { MuiThemeProvider } from '@material-ui/core/styles'
import { createTheme } from '@material-ui/core/styles'
// import SchFooterNav from './component/schedule/SchFooterNav';
// import SchByUsers from './component/schedule/SchByUser';
import SchByUsers2 from './component/schedule/SchByUser2';
import SchDaySetting from './component/schedule/SchDaySetting';
import SchWeekly from './component/schedule/SchWeekly';
import Login from './component/common/Login';
import { 
  LoadingSpinner, ErrorBoundaryDisplay,LoadErr, CheckOnline, Saikouchiku
} from './component/common/commonParts';

import * as mui from './component/common/materialUi';
// import SchIntervalSave from './component/schedule/SchIntervalSave';
import SnackMsg from './component/common/SnackMsg';
// import TemporaryDrawer from './DrowerMenu'
import DrowerMenu, {SideToolBar, } from './DrowerMenu';
import Invoice from './component/reports/Invoice';
import {ResetPassWd} from './component/account/Account';
import Header from './component/common/Header';
// import FsCon from './component/import/FsCon';
import Custom from "./component/Custom/Custom";
import HoudayNews from './component/houdayNews/HoudayNews';
import SchAddictionBulkUpdate from './component/schedule/SchAddictionBulkUpdate';
import UsageFee from './component/reports/UsageFee';
import ChangeConnect from './component/Setting/ChangeConnect';
import { CntbkMake } from './component/ContactBook/CntbkMake';
import ContbkUserEdit from './component/ContactBook/ContbkUserEdit';
import CntbkSetting from './component/ContactBook/CntbkSetting';
import MakeAccessToken from './component/ContactBook/MakeAccessToken';
import ReportsSetting from './component/reports/ReportsSetting';
import { PrintSettings } from './component/reports/PrintSettings';
import SetUseResultWrap from './component/schedule/SchSetUseResultWarap';
import { defaultTitle } from './albCommonModule';
import ByUserAddictionNoDialog from './component/schedule/ByUserAddictionNoDialog';
import SchUpperLimitNoDialog from './component/schedule/SchUpperLimitNoDialog';
import SchDaily from './component/schedule/SchDaily';
import SchPredictiveInput from './component/schedule/NewSchPredictiveInput';
// import SchPredictiveInput from './component/schedule/SchPredictiveInput';
import SchDaySettingNoDialog from './component/schedule/SchDaySettingNoDialog';
import NoActivityDetector from './component/common/NoActivityDetector';
import SetUserTemplateConfig from './component/Setting/SetUserTemplateConfig';
import { CntbkSendBulkMail } from './component/ContactBook/CntbkSendBulkMail';
import { DailyReport } from './component/dailyReport/DailyReport';
import { DailyReportSetting } from './component/dailyReport/DailyReportSetting';
import { DailyReportForm } from './component/dailyReport/DailyReportForm';
import { DailyReportPrint } from './component/dailyReport/DailyReportPrint';
import { CntbkListPerUser } from './component/ContactBook/CntbkListPerUser';
import { DailyReportListPerUser } from './component/dailyReport/DailyReportListPerUser';
import { UsersCityAddressForm } from './component/Users/UsersCityAddressForm';
import { AddictionHideSetting } from './component/Setting/AddictionHideSetting';
import StickyTable from './component/common/StickyTable';
import { FreeMessage } from './component/FreeMessage/FreeMessage';
import { DailyReportBrowse } from './component/dailyReport/DailyReportBrowse';
import { SchListInputPerDate } from './component/schedule/SchListInput/SchListInputPerDate';
import { SchListInputPerDateMult } from './component/schedule/SchListInput/SchListInputPerDateMult';
import { SchListInputPerUser } from './component/schedule/SchListInput/SchListInputPerUser';
import { SchListInputSetting } from './component/schedule/SchListInput/SchListInputSetting';
import CntbkBulkMessage from './component/ContactBook/CntbkBulkMessage';
import UsersTimeTable from './component/Users/TimeTable/UsersTimeTable';
import UsersTimeTableEditOld from './component/Users/TimeTable/UsersTimeTableEditOld';
import UsersTimeTableBatchEditOld from './component/Users/TimeTable/UsersTimeTableBatchEditOld';
import UsersTimeTableEdit from './component/Users/TimeTable/UsersTimeTableEdit';
import UsersTimeTableBatchEdit from './component/Users/TimeTable/UsersTimeTableBatchEdit';
import SettingSortOrder from './component/Setting/SettingSortoder';
import SchReserveRecp from './component/schedule/ReserveRecp/SchReserveRecp';
import { SaikouchikuPrintOnly } from './component/common/commonParts';
import CntbkSendReports from './component/ContactBook/CntbkSendReports';
import SoudanShienCycleManager from './component/schedule/SoudanShienCycleManager';
import TeikyouJissekiEsignList from './component/reports/TeikyouJissekiEsignList';
import SchUserKasanList from './component/schedule/SchUserKasanList';
import FileUploadPage from './component/common/FileUploadPage';
import SchUserActualCostList from './component/schedule/SchUserActualCostList';
import { KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from './modules/contants';

const Billing = React.lazy(() => import('./component/Billing/Billing'));
const BilUserBilling = React.lazy(() =>
  import('./component/Billing/Billing').then((module) => ({ default: module.BilUserBilling }))
);
const BilUpperLimit = React.lazy(() =>
  import('./component/Billing/Billing').then((module) => ({ default: module.BilUpperLimit }))
);

const Proseed = React.lazy(() => import('./component/Billing/Proseed'));
const ProseedUpperLimit = React.lazy(() =>
  import('./component/Billing/Proseed').then((module) => ({ default: module.ProseedUpperLimit }))
);
const ProseedOtherOfficeis = React.lazy(() => import('./component/Billing/ProseedOtherOfficeis'));
const ProseedOneYear = React.lazy(() => import('./component/Billing/ProseedHistory'));
const ManualJoseiOuter = React.lazy(() =>
  import('./component/Billing/ManualJosei').then((module) => ({ default: module.ManualJoseiOuter }))
);
const CompLMonthTMonth = React.lazy(() => import('./component/Billing/CompLMonthTMonth'));
const Rebilling = React.lazy(() => import('./component/Billing/Rebilling'));
const JichiJoseiAdjustment = React.lazy(() => import('./component/Billing/JichiJoseiAdjustment'));
const BillingDtCompare = React.lazy(() => import('./component/Billing/BillingDtCompare'));

const WorkShiftMake = React.lazy(() => import('./component/workShift/WorkShiftMake'));
const WorkShiftStaffSetting = React.lazy(() => import('./component/workShift/WorkShiftStaffSetting'));
const WorkShiftTemplateSetting = React.lazy(() => import('./component/workShift/WorkShiftTemplateSetting'));
const WorkShiftSetting = React.lazy(() => import('./component/workShift/WorkShiftSetting'));
const WorkShiftMakeDaily = React.lazy(() => import('./component/workShift/WorkShiftMakeDaily'));

const PlanAssessment = React.lazy(() =>
  import('./component/plan/PlanAssessment').then((module) => ({ default: module.PlanAssessment }))
);
const PlanConferenceNote = React.lazy(() =>
  import('./component/plan/PlanConferenceNote').then((module) => ({ default: module.PlanConferenceNote }))
);
const PlanMonitoring = React.lazy(() =>
  import('./component/plan/PlanMonitoring').then((module) => ({ default: module.PlanMonitoring }))
);
const PlanManegement = React.lazy(() =>
  import('./component/plan/PlanManegement').then((module) => ({ default: module.PlanManegement }))
);
const PlanSetting = React.lazy(() => import('./component/plan/PlanSetting'));
const PlanSenmonShien = React.lazy(() =>
  import('./component/plan/PlanSenmonShien').then((module) => ({ default: module.PlanSenmonShien }))
);
const PlanPersonalSupportRouter = React.lazy(() =>
  import('./component/plan/PlanPersonalSupportRouter').then((module) => ({ default: module.PlanPersonalSupportRouter }))
);
const PlanPersonalSupportHohou = React.lazy(() =>
  import('./component/plan/PlanPersonalSupportHohou').then((module) => ({ default: module.PlanPersonalSupportHohou }))
);
const PlanMonitoringHohou = React.lazy(() =>
  import('./component/plan/PlanMonitoringHohou').then((module) => ({ default: module.PlanMonitoringHohou }))
);
const PlanMonitoringSenmon = React.lazy(() =>
  import('./component/plan/PlanMonitoringSenmon').then((module) => ({ default: module.PlanMonitoringSenmon }))
);

export const theme = createTheme({
  palette: {
    // default:{
    //   light: '#eceff1',
    //   main: '#cfd8dc',
    //   dark: '#90a4ae',
    //   contrastText: '#000000',
    // },
    cancel: {
      light: '#eceff1',
      main: '#cfd8dc',
      dark: '#90a4ae',
      contrastText: '#000000',
    },
    primary: {
      light: '#26a69a',
      main: '#00695c',
      dark: '#004d40',
      contrastText: '#ffffff',
    },
    secondary: {
      light: '#039be5',
      main: '#0277bd',
      dark: '#01579b',
      contrastText: '#ffffff',
    },
  },
});

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch(error, info) {
    // Display fallback UI
    this.setState({ hasError: true });
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, info);
    console.log('--------- error occurred ---------')
    console.log('ErrorBoundary', error, info);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      // return <h1>Something went wrong.</h1>;
      ErrorBoundaryDisplay();
    }
    return this.props.children;
  }
}

const LazyRoute = ({ component: Component, fallback = <LoadingSpinner />, ...rest }) => (
  <Route
    {...rest}
    render={(props) => (
      <Suspense fallback={fallback}>
        <Component {...props} />
      </Suspense>
    )}
  />
);

const SoudanAwareScheduleRoot = () => {
  const sService = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const service = sService || (serviceItems.length > 0 ? serviceItems[0] : '');
  const isSoudan = (service === KEIKAKU_SOUDAN || service === SYOUGAI_SOUDAN);
  if (isSoudan) return <SoudanShienCycleManager />;
  return <Sch2 />;
};

class Main extends React.Component{
  render() {
    return (
      <Provider store={store}>
        <HashRouter>
          <Header props={this.props} />
          <Switch>
            {/* {seagull &&
              <Route exact path='/' component={Users} />
            } */}
            <Route exact path='/' component={HoudayNews} />
            <Route path='/users/timetable/old/edit/batch/:uid/' component={UsersTimeTableBatchEditOld} />
            <Route path='/users/timetable/old/edit/:uid/' component={UsersTimeTableEditOld} />
            <Route path='/users/timetable/edit/batch/:uid/' component={UsersTimeTableBatchEdit} />
            <Route path='/users/timetable/edit/:uid/' component={UsersTimeTableEdit} />
            <Route path='/users/timetable/' component={UsersTimeTable} />
            <Route path='/users/belongs/edit/:uid/' component={UsersCityAddressForm} />
            <Route path='/users/:p' props={this.props} component={Users} />
            <Route path='/users' props={this.props} component={Users} />
            <Route path='/schedule/cycle' component={Sch2} />
            <Route path='/schedule/reserve' component={SchReserveRecp} />
            <Route path='/schedule/weekly/:prms' component={SchWeekly} />
            <Route path='/schedule/daily/' component={SchDaily} />
            <Route path='/schedule/weekly/' component={SchWeekly} />
            <Route path='/schedule/calender/' component={SchCalWrapp} />
            <Route path='/schedule/users/:p' component={SchByUsers2} />
            <Route path='/schedule/users/' component={SchByUsers2} />
            <Route path='/schedule/dsetting/bulkupdate/' component={SchAddictionBulkUpdate} />
            <Route path='/schedule/dsetting/' component={SchDaySetting} />
            <Route path='/schedule/daysetting' component={SchDaySettingNoDialog} />
            <Route path='/schedule/useresult/' component={SetUseResultWrap} />
            <Route path='/schedule/userUpperLimit' component={SchUpperLimitNoDialog} />
            <Route path='/schedule/userAddiction' component={ByUserAddictionNoDialog} />
            <Route path='/schedule/predictive' component={SchPredictiveInput} />
            <Route path='/schedule/listinput/setting/' component={SchListInputSetting} />
            <Route path='/schedule/listinput/perdate/mult/:formType/:date/:uids/' component={SchListInputPerDateMult} />
            <Route path='/schedule/listinput/perdate/:date/' component={SchListInputPerDate} />
            <Route path='/schedule/listinput/peruser/:uid/' component={SchListInputPerUser} />
            <Route path='/schedule/list/kasan' component={SchUserKasanList} />
            <Route path='/schedule/list/actualcost' component={SchUserActualCostList} />
            <Route path='/schedule/setting' component={ScheduleSettings} />
            <Route path='/schedule' component={SoudanAwareScheduleRoot} />
            <Route path='/reports/teikyoujisseki/esignlist' component={TeikyouJissekiEsignList} />
            <Route path='/reports/usagefee' component={UsageFee} />
            <Route path='/reports/invoice' component={Invoice} />
            <Route path='/reports/setting/:settingItem' component={ReportsSetting} />
            <Route path='/reports/printsettings' component={PrintSettings} />
            <Route path='/reports/:filter' component={Reports} />
            <Route path='/reports/' component={Reports} />
            <LazyRoute path='/billing/userbilling' component={BilUserBilling} />
            <LazyRoute path='/billing/upperlimit' component={BilUpperLimit} />
            <LazyRoute path='/billing/rebilling' component={Rebilling} />
            <LazyRoute path='/billing/jichijoseiadjustment' component={JichiJoseiAdjustment} />
            <LazyRoute path='/billing/compare' component={BillingDtCompare} />
            <LazyRoute path='/billing' component={Billing} />
            <LazyRoute path='/proseed/otherOfficeis' component={ProseedOtherOfficeis} />
            <LazyRoute path='/proseed/oneyear' component={ProseedOneYear} />
            <LazyRoute path='/proseed/upperlimit' component={ProseedUpperLimit} />
            <Route path='/proseed/useresult/' component={SetUseResultWrap} />
            <LazyRoute path='/proseed/cmplmanth' component={CompLMonthTMonth} />
            <LazyRoute path='/proseed/manualjosei' component={ManualJoseiOuter} />
            <LazyRoute path='/proseed' component={Proseed} />
            <Route path='/setting/sortorder' component={SettingSortOrder} />
            <Route path='/setting/standard' component={StandardSettings} />
            <Route path='/setting/hideaddiction/' component={AddictionHideSetting} />
            <Route path='/setting/addiction' component={AddictionSettings} />
            <Route path='/setting/schedule/alfami' component={AlfamiReserveSetting} />
            <Route path='/setting/schedule' component={ScheduleSettings} />
            <Route path='/setting/reg' component={RegParamsSettings} />
            <Route path='/setting/others' component={ExstraSettings} />
            <Route path='/setting/schtmltconfig' component={SetUserTemplateConfig} />
            <Route path='/setting' component={Setting} />
            <Route path='/Account/:p' component={Account} />
            <Route path='/Account' component={Account} />
            <Route path='/restpassword' component={ResetPassWd} />
            {/* <Route path='/upload/fscon' component={FsCon} /> */}
            <Route path='/custom' component={Custom} />
            <Route path='/test' component={Hoge} />
            <Route path='/chep' component={ChangeConnect} />
            <Route path='/news' component={HoudayNews} />
            <Route path='/contactbook/message/:uid/' component={FreeMessage} />
            <Route path='/contactbook/message/' component={FreeMessage} />
            <Route path='/contactbook/token/' component={MakeAccessToken} />
            <Route path='/contactbook/setting/' component={CntbkSetting} />
            <Route path='/contactbook/invoice/' component={CntbkSendReports} />
            <Route path='/contactbook/edit/:uid/:calenderDate/' component={ContbkUserEdit} />
            <Route path='/contactbook/:uid/:calenderDate/' component={CntbkMake} />
            <Route path='/contactbook/bulkmail/' component={CntbkSendBulkMail} />
            <Route path='/contactbook/bulkmessage/' component={CntbkBulkMessage} />
            <Route path='/contactbook/list/' component={CntbkListPerUser} />
            <Route path='/contactbook/' component={CntbkMake} />
            <LazyRoute path='/workshift/setting/' component={WorkShiftSetting} />
            <LazyRoute path='/workshift/templatesetting/' component={WorkShiftTemplateSetting} />
            <LazyRoute path='/workshift/staffsetting/' component={WorkShiftStaffSetting} />
            <LazyRoute path='/workshift/daily/:date/' component={WorkShiftMakeDaily} />
            <LazyRoute path='/workshift/' component={WorkShiftMake} />
            <Route path='/dailyreport/form/:uids/:date/:formType/' component={DailyReportForm} />
            <Route path='/dailyreport/print' component={DailyReportPrint} />
            <Route path='/dailyreport/setting' component={DailyReportSetting} />
            <Route path='/dailyreport/list/' component={DailyReportListPerUser} />
            <Route path='/dailyreport/browse/' component={DailyReportBrowse} />
            <Route path='/dailyreport/' component={DailyReport} />
            <Route path='/stickytable' component={StickyTable} />
            <LazyRoute path='/plan/assessment' component={PlanAssessment} />
            <LazyRoute path='/plan/personalsupport' component={PlanPersonalSupportRouter} />
            <LazyRoute path='/plan/personalsupporthohou' component={PlanPersonalSupportHohou} />
            <LazyRoute path='/plan/senmonshien' component={PlanSenmonShien} />
            <LazyRoute path='/plan/conferencenote' component={PlanConferenceNote} />
            <LazyRoute path='/plan/monitoring' component={PlanMonitoring} />
            <LazyRoute path='/plan/monitoringhohou' component={PlanMonitoringHohou} />
            <LazyRoute path='/plan/monitoringsenmon' component={PlanMonitoringSenmon} />
            <LazyRoute path='/plan/manegement' component={PlanManegement} />
            <Route path='/plan/timetable/old/edit/batch/:uid/' component={UsersTimeTableBatchEditOld} />
            <Route path='/plan/timetable/old/edit/:uid/' component={UsersTimeTableEditOld} />
            <Route path='/plan/timetable/edit/batch/:uid/' component={UsersTimeTableBatchEdit} />
            <Route path='/plan/timetable/edit/:uid/' component={UsersTimeTableEdit} />
            <Route path='/plan/timetable/' component={UsersTimeTable} />
            <LazyRoute path='/plan/setting' component={PlanSetting} />
            <Route path='/fileupload' component={FileUploadPage} />
          </Switch>
        </HashRouter>
        <SnackMsg storeStateOpen={true} />
      </Provider>
    )
  }
}


const loadStatus = (props) => {
  const sessionDone = props.sessionStatus.done;
  const scheduleDone = props.fetchSchedule.done;
  const clenderDone = props.fetchCalenderStatus.done;
  const userDone = props.userFtc.done;
  const comDone = props.comFtc.done;
  const sessionErr = props.sessionStatus.err;
  const scheduleErr = props.fetchSchedule.err;
  const clenderErr = props.fetchCalenderStatus.err;
  const userErr = props.userFtc.err;
  const comErr = props.comFtc.erre;
  const done = (
    sessionDone && scheduleDone && clenderDone && userDone && comDone
  );
  const error = (
    sessionErr || scheduleErr || clenderErr || userErr || comErr
  );
  return { allLoad: done, someError: error };
}

const ErroeOccured = ()=>{
  return(<div>なんかダメみたいです。</div>)
}

const FirstLoading = () => {
  return (<div>最初のローディング中だよ</div>)
}


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      firstLoad :true
    };
  }
  setfirstLoad = (v)=>{
    this.setState({firstLoad: v});
  }

  render(){
    const ls = loadStatus(this.props);
    const Rtn = ()=>{
      // アカウント存在確認
      if (Object.keys(this.props.account).length){
        // 読み込めたらメイン firstLoadを外す
        if (ls.done){
          this.setfirstLoad(false);
          return(<Main {...this.props}/>)
        }
        // 一旦は読めたのでmainを表示
        else if (!this.firstLoad){
          return (<Main {...this.props} />)
        }
        // エラーだったらしょうがないね
        else if (ls.err){
          return <ErroeOccured/>
        }
        else if (ls.firstLoad){
          return <FirstLoading/>
        }
      }
      else{
        return <Login/>
      }
    }
    return (
      <ErrorBoundary>
        <MuiThemeProvider theme={theme}>
          <Rtn/>
          <mui.SnapberAlert/>
          <CheckOnline/>
          <SaikouchikuPrintOnly/>
        </MuiThemeProvider>
      </ErrorBoundary>
    )
  }
}
function mapStateToProps(state){
  return(state);
}
export default connect(mapStateToProps, Actions)(App);
