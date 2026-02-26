import React, {useEffect, useState} from 'react';
import { HashRouter, Route, Switch, useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom';
import * as Actions  from './Actions'
import Users from './component/Users/Users';
// import Schedule from './component/schedule/Schedule';
import Sch2 from './component/schedule/Sch2';
import SchCalWrapp from './component/schedule/SchCalWrapp';
import Billing, { BilUserBilling } from './component/Billing/Billing';
import Proseed, {ProseedUpperLimit} from './component/Billing/Proseed';
import Reports from './component/reports/Reports';
import 
  Setting, { 
    StandardSettings, AddictionSettings, AddictionSettingsWs,
    ScheduleSettings, ViewSettings, OthesSettings, RegParamsSettings, ExstraSettings,
  } 
  from './component/Setting/Setting';
import Account from './component/account/Account';
import Hoge from './Hoge';
import store from './store';
import * as comMod from './commonModule';
import './index.css';
import { connect, useSelector, useDispatch } from 'react-redux';
import { Provider } from 'react-redux'
import { MuiThemeProvider } from '@material-ui/core/styles'
import { createMuiTheme } from '@material-ui/core/styles'
// import SchFooterNav from './component/schedule/SchFooterNav';
// import SchByUsers from './component/schedule/SchByUser';
import SchByUsers2 from './component/schedule/SchByUser2';
import SchDaySetting from './component/schedule/SchDaySetting';
import SchWeekly from './component/schedule/SchWeekly';
import Login from './component/common/Login';
import { 
  LoadingSpinner, ErrorBoundaryDisplay,LoadErr, CheckOnline, Saikouchiku, InitSetHtml
} from './component/common/commonParts';

import * as mui from './component/common/materialUi';
import Rev from './Rev';
// import SchIntervalSave from './component/schedule/SchIntervalSave';
import SnackMsg from './component/common/SnackMsg';
// import TemporaryDrawer from './DrowerMenu'
import DrowerMenu, {SideToolBar, } from './DrowerMenu';
import Invoice from './component/reports/Invoice';
import {BilUpperLimit} from './component/Billing/Billing';
import {ResetPassWd} from './component/account/Account';
import Header from './component/common/Header';
import FsCon from './component/import/FsCon';
import Custom from "./component/Custom/Custom";
import UserBilling from './component/Billing/UserBilling';
import ProseedOtherOfficeis from './component/Billing/ProseedOtherOfficeis';
import HoudayNews from './component/houdayNews/HoudayNews';
import SchAddictionBulkUpdate from './component/schedule/SchAddictionBulkUpdate';
import UsageFee from './component/reports/UsageFee';
import ChangeConnect from './component/Setting/ChangeConnect';
import CntbkMake from './component/ContactBook/CntbkMake';
import CntbkSetting from './component/ContactBook/CntbkSetting';
import CompLMonthTMonth from './component/Billing/CompLMonthTMonth';
import MakeAccessToken from './component/ContactBook/MakeAccessToken';
import UsersContractInfo from './component/Users/UsersContractInfo';
import WorkShiftMake from './component/workShift/WorkShiftMake';
import WorkShiftStaffSetting from './component/workShift/WorkShiftStaffSetting';
import { SaikouchikuPrintOnly } from '../component/common/commonParts';
// import GridTest from './component/reports/gridtest';

export const theme = createMuiTheme({
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

class Main extends React.Component{
  render() {
    return (
      <Provider store={store}>
        <HashRouter>
          <Header props={this.props} />
          <SideToolBar/>
          {/* <SaikouchikuPrintOnly/> */}
          <Switch>
            {/* {seagull &&
              <Route exact path='/' component={Users} />
            } */}
            <Route exact path='/' component={HoudayNews} />
            {/* <Route exact path='/' component={Users} /> */}
            <Route path='/users/contract' component={UsersContractInfo} />
            <Route path='/users/:p' props={this.props} component={Users} />
            <Route path='/users' props={this.props} component={Users} />
            <Route path='/schedule/weekly/:prms' component={SchWeekly} />
            <Route path='/schedule/weekly/' component={SchWeekly} />
            <Route path='/schedule/calender/' component={SchCalWrapp} />
            <Route path='/schedule/users/:p' component={SchByUsers2} />
            <Route path='/schedule/users/' component={SchByUsers2} />
            <Route path='/schedule/dsetting/bulkupdate/' component={SchAddictionBulkUpdate} />
            <Route path='/schedule/dsetting/' component={SchDaySetting} />
            <Route path='/schedule' component={Sch2} />
            <Route path='/reports/usagefee' component={UsageFee} />
            <Route path='/reports/invoice' component={Invoice} />
            <Route path='/reports' component={Reports} />
            <Route path='/billing/userbilling' component={BilUserBilling} />
            <Route path='/billing/upperlimit' component={BilUpperLimit} />
            <Route path='/billing' component={Billing} />
            <Route path='/proseed/otherOfficeis' component={ProseedOtherOfficeis} />
            <Route path='/proseed/upperlimit' component={ProseedUpperLimit} />
            <Route path='/proseed/cmplmanth' component={CompLMonthTMonth} />
            <Route path='/proseed' component={Proseed} />
            <Route path='/setting/standard' component={StandardSettings} />
            <Route path='/setting/addiction' component={AddictionSettings} />
            <Route path='/setting/view' component={ViewSettings} />
            <Route path='/setting/schedule' component={ScheduleSettings} />
            <Route path='/setting/reg' component={RegParamsSettings} />
            <Route path='/setting/others' component={ExstraSettings} />
            <Route path='/setting' component={Setting} />
            <Route path='/Account/:p' component={Account} />
            <Route path='/Account' component={Account} />
            <Route path='/restpassword' component={ResetPassWd} />
            <Route path='/upload/fscon' component={FsCon} />
            <Route path='/custom' component={Custom} />
            <Route path='/test' component={Hoge} />
            <Route path='/chep' component={ChangeConnect} />
            <Route path='/news' component={HoudayNews} />
            <Route path='/contactbook/token' component={MakeAccessToken} />
            <Route path='/contactbook/setting' component={CntbkSetting} />
            <Route path='/contactbook/:uid/:calenderDate' component={CntbkMake} />
            <Route path='/contactbook' component={CntbkMake} />
            <Route path='/workshift/staffsetting/' component={WorkShiftStaffSetting} />
            <Route path='/workshift/' component={WorkShiftMake} />
          </Switch>
        </HashRouter>
        <SnackMsg storeStateOpen={true} />
      </Provider>
    )
  }
}

// セッションのチェックを行う
// ローディングと認証を確認する
const sessionCheck = (props)=>{
  const st = props.sessionStatus;
  const ss = props.session;
  if (st.loading)  return({done:false,loading:true,err:false})
  if (!st.loading && st.done && Object.keys(ss).length)
    return({done:true,loading:false,err:false})
  if (!st.loading && !st.done && !Object.keys(ss).length)
    return({done:false,loading:false,err:true})
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
          <InitSetHtml />
        </MuiThemeProvider>
      </ErrorBoundary>
    )
  }
}
function mapStateToProps(state){
  return(state);
}
export default connect(mapStateToProps, Actions)(App);
