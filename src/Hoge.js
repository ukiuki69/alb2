import React, {useEffect, useState, useRef} from 'react';
import Login from './component/common/Login'
import { useDispatch, useSelector } from 'react-redux';
import * as Actions from './Actions'
import { AccordionActions, Checkbox, FormControlLabel, Input, makeStyles, Snackbar, Switch, TextField } from '@material-ui/core';
import SnackMsg from './component/common/SnackMsg';
import UseEffectTest from './component/common/useEffectTest';
import { useHistory } from 'react-router-dom';
import { SideToolBar, } from './DrowerMenu'
import { 
  UserSelectDialog, ServiceNotice, SendBillingToSomeState, 
  ExcahngeTotalizeButton, WanpakuImportButton
} from './component/common/commonParts';
import * as mui from './component/common/materialUi';
// import { useStyles } from './component/common/StdFormParts';
import * as sfp from './component/common/StdFormParts';
import {AccountOfMenbers, AccountRestButton, AddNewAccount} from './component/account/Account';
import Button from '@material-ui/core/Button';
import { Link, useLocation } from 'react-router-dom';
import CheckProgress from './component/common/CheckProgress';
import CheckUsersTemplate from './component/Users/CheckUsersTemplate';
import RegistedParams from './component/Setting/RegistedParams';
import * as comMod from './commonModule';
import * as albcm from './albCommonModule';
import curaddedit from './img/curaddedit.png';
import curaddremove from './img/curaddremove.png';
import SchUserSetting from './component/schedule/SchUserSetting';
import SchUserSettingDialog from './component/schedule/SchUserSettingDialog';
import { PermMedia, ReplyAll, } from '@material-ui/icons';
import axios from 'axios';
import FsCon from './component/import/FsCon';
import UserBilling from './component/Billing/UserBilling';
import { faBullseye } from '@fortawesome/free-solid-svg-icons';
import { setBillInfoToSch } from './component/Billing/blMakeData';
import ProseedOtherOfficeis from './component/Billing/ProseedOtherOfficeis';
import Parser from 'rss-parser';
import SchAddictionBulkUpdate from './component/schedule/SchAddictionBulkUpdate';
import SchSelectMonth from './component/schedule/SchSelectMonth';
import SchServiceUnsetDetector from './component/schedule/SchServiceUnsetDetector';
import { lightBlue, red, teal, yellow } from '@material-ui/core/colors';
import { KeyListener } from './component/common/KeyListener';
import { summarizeTexts } from './modules/summarizeTexts';
import {GenericDialog, YesNoDialog} from './component/common/GenericDialog';
import { getLocalStorage, setLocalStorage } from './modules/localStrageOprations';
import { SchDaySettingNDTarget } from './component/schedule/SchDaySettingNoDialog';
import SchAutoBkRestore from './component/schedule/SchAutoBkRestore';
import ChangeEndpoint from './component/common/ChangeEndpoint';
import { checkDupAddiction } from './component/Billing/checkDupAddiction';
import { CheckBillingEtc } from './component/Billing/CheckBillingEtc';
import { SchFab } from './component/schedule/SchFab';
import GetNationalHolidays from './component/common/GetNationalHolidays';
import { NyuuinRenkei } from './component/common/SoudanAddictionFormParts';
import { useGetUsersService } from './component/Users/useGetUsersService';
import { SetUisCookieSelect } from './component/common/SetUisCookieSelect';
import { CalcDataExport } from './component/Billing/CalcDataExport';
import { getJikanKubunAndEnchou } from './modules/elapsedTimes';
import ManualJosei from './component/Billing/ManualJosei';
import TopPageMessageForm from './component/Setting/TopPageMessageForm';
import DisplayTopPageMessages from './component/Setting/DisplayTopPageMessage';
import { getUsersTimetable } from './modules/getUsersTimetable';
import { llmApiCall } from './modules/llmApiCall';
import Paper from '@material-ui/core/Paper';
import { fetchContacts } from './component/ContactBook/CntbkCommon';
import Rebilling from './component/Billing/Rebilling';
import AnyFileUploadButton from './component/common/AnyFileUploadButton';
import { useLocalStorageState } from './component/common/HashimotoComponents';
import { CountAddictionLimitTest } from './component/Billing/countAddictionLimit';
import DeleteCompanyAndBranch from './component/common/deleteCompanyAndBranch';
import { addNextSch } from './component/schedule/schUtility/addNextSch';
import CleanupNotifications from './component/common/CleanupNotifications';
import { makeCreteria } from './modules/makeCreteria';
import ApiPerformanceTest from './component/common/ApiPerformanceTest';


const useStyles = makeStyles({
  fadeBox: {width:200, height: 40, border: '1px #aaa solid'},
  fade: {
    animation: '$colorchange 4s'
  },
  fadeEnd: {backgroundColor: yellow[100]},
  paused: {animationPlayState: 'paused'},
  '@keyframes colorchange': {
    '0%': {
      backgroundColor: yellow[600]
    },
    '100%': {
      backgroundColor: yellow[100]
    }
  },
  svcClsRoot:{
    padding: 8,
    '& h2': {fontSize: 18, paddingTop: 8, paddingBottom: 8, color: teal[800]},
    '& h3': {fontSize: 12, paddingTop: 4, paddingBottom: 0, color: teal[800]},
    '& .svcs, .clses': {paddingTop: 4} 

  },
})

const suTest0 = {
  uid: 'UID1085',
  hid: 'LE5MMsTF',
  bid: 'p0CxjWNM',
  date: '2021-11-01',
  schedule: {"D20211101":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211103":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211105":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211108":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211110":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211112":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211115":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211117":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211119":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211122":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211124":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211126":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211129":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"}},
  a: 'sendUsersSchedule',
}

const suTest1 = {
  uid: 'UID1083',
  hid: 'LE5MMsTF',
  bid: 'p0CxjWNM',
  date: '2021-11-01',
  schedule: {"D20211102":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211104":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211106":{"start":"10:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["自宅","自宅"],"offSchool":1,"service":"放課後等デイサービス"},"D20211109":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211111":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211113":{"start":"10:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["自宅","自宅"],"offSchool":1,"service":"放課後等デイサービス"},"D20211116":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211118":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211120":{"start":"10:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["自宅","自宅"],"offSchool":1,"service":"放課後等デイサービス"},"D20211123":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211125":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211127":{"start":"10:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["自宅","自宅"],"offSchool":1,"service":"放課後等デイサービス"},"D20211130":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"}},
  a: 'sendUsersSchedule',
}

const suTest2 = {
  uid: 'UID5038',
  hid: 'LE5MMsTF',
  bid: 'p0CxjWNM',
  date: '2021-11-01',
  schedule: {"D20211101":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211102":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211108":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211109":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211115":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211116":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211122":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211123":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211129":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"},"D20211130":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス"}},
  a: 'sendUsersSchedule',
}
// 梅 実績にする
const sptsTest0 = {
  hid: 'LE5MMsTF',
  bid: 'p0CxjWNM',
  date: '2021-11-01',
  partOfSch: {"UID1753":{"D20211101":{"end":"17:00","start":"13:30","service":"放課後等デイサービス","transfer":["学校","自宅"],"offSchool":0,"actualCost":{"おやつ":100},"useResult":true},"D20211103":{"end":"17:00","start":"13:30","service":"放課後等デイサービス","transfer":["学校","自宅"],"offSchool":0,"actualCost":{"おやつ":100},"useResult":true}},"UID1081":{"D20211103":{"end":"17:00","start":"13:30","service":"放課後等デイサービス","transfer":["学校","自宅"],"offSchool":0,"actualCost":{"おやつ":100},"dAddiction":{"児童指導員等加配加算（Ⅰ）":"理学療法士等"},"児童指導員等加配加算（Ⅰ）":"理学療法士等","useResult":true},"D20211106":{"end":"17:00","start":"10:30","service":"放課後等デイサービス","transfer":["自宅","自宅"],"offSchool":1,"actualCost":{"おやつ":100},"useResult":true}},"UID1085":{"D20211101":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211103":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211105":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211108":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211110":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211112":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211115":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211117":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211119":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211122":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211124":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211126":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211129":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true}},"UID1083":{"D20211102":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211104":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211106":{"start":"10:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["自宅","自宅"],"offSchool":1,"service":"放課後等デイサービス","useResult":true},"D20211109":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211111":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211113":{"start":"10:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["自宅","自宅"],"offSchool":1,"service":"放課後等デイサービス","useResult":true},"D20211116":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211118":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211120":{"start":"10:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["自宅","自宅"],"offSchool":1,"service":"放課後等デイサービス","useResult":true},"D20211123":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211125":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211127":{"start":"10:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["自宅","自宅"],"offSchool":1,"service":"放課後等デイサービス","useResult":true},"D20211130":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true}},"UID4891":{},"UID5037":{}},
  a: 'sendPartOfSchedule',
}
// 梅 実績取り消す
const sptsTest1 = {
  hid: 'LE5MMsTF',
  bid: 'p0CxjWNM',
  date: '2021-11-01',
  partOfSch: {"UID1753":{"D20211101":{"end":"17:00","start":"13:30","service":"放課後等デイサービス","transfer":["学校","自宅"],"offSchool":0,"actualCost":{"おやつ":100},"useResult":false},"D20211103":{"end":"17:00","start":"13:30","service":"放課後等デイサービス","transfer":["学校","自宅"],"offSchool":0,"actualCost":{"おやつ":100},"useResult":false}},"UID1081":{"D20211103":{"end":"17:00","start":"13:30","service":"放課後等デイサービス","transfer":["学校","自宅"],"offSchool":0,"actualCost":{"おやつ":100},"dAddiction":{"児童指導員等加配加算（Ⅰ）":"理学療法士等"},"児童指導員等加配加算（Ⅰ）":"理学療法士等","useResult":false},"D20211106":{"end":"17:00","start":"10:30","service":"放課後等デイサービス","transfer":["自宅","自宅"],"offSchool":1,"actualCost":{"おやつ":100},"useResult":false}},"UID1085":{"D20211101":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211103":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211105":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211108":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211110":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211112":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211115":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211117":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211119":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211122":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211124":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211126":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211129":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false}},"UID1083":{"D20211102":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211104":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211106":{"start":"10:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["自宅","自宅"],"offSchool":1,"service":"放課後等デイサービス","useResult":false},"D20211109":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211111":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211113":{"start":"10:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["自宅","自宅"],"offSchool":1,"service":"放課後等デイサービス","useResult":false},"D20211116":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211118":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211120":{"start":"10:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["自宅","自宅"],"offSchool":1,"service":"放課後等デイサービス","useResult":false},"D20211123":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211125":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211127":{"start":"10:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["自宅","自宅"],"offSchool":1,"service":"放課後等デイサービス","useResult":false},"D20211130":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false}},"UID4891":{},"UID5037":{}},
  a: 'sendPartOfSchedule',
}

// 鮭実績
const sptsTest2 = {
  hid: 'LE5MMsTF',
  bid: 'p0CxjWNM',
  date: '2021-11-01',
  partOfSch: {"UID445":{"D20211102":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211103":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211104":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211109":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211110":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211111":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211116":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211117":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211118":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211123":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211124":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211125":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211130":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true}},"UID1082":{"D20211101":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211102":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211108":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211109":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211115":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211116":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211122":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211123":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211129":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211130":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true}},"UID1084":{"D20211104":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211105":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211111":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211112":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211118":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211119":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211125":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true},"D20211126":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":true}}},
  a: 'sendPartOfSchedule',
}
// 鮭取り消す
const sptsTest3 = {
  hid: 'LE5MMsTF',
  bid: 'p0CxjWNM',
  date: '2021-11-01',
  partOfSch: {"UID445":{"D20211102":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211103":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211104":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211109":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211110":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211111":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211116":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211117":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211118":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211123":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211124":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211125":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211130":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false}},"UID1082":{"D20211101":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211102":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211108":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211109":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211115":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211116":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211122":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211123":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211129":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211130":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false}},"UID1084":{"D20211104":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211105":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211111":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211112":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211118":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211119":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211125":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false},"D20211126":{"start":"13:30","end":"17:00","actualCost":{"おやつ":100},"dAddiction":{},"transfer":["学校","自宅"],"offSchool":0,"service":"放課後等デイサービス","useResult":false}}},
  a: 'sendPartOfSchedule',
}

const repeatSendTest = (e) => {
  let repeat = parseInt(e.currentTarget.getAttribute('repeat'));
  if (!repeat)  repeat = 1;
  Array(repeat).fill(0).map(e=>{
    const a = {...suTest0};
    const b = {...suTest1};
    const c = {...suTest2};
    albcm.sendUsersSchedule(a); //
    albcm.sendUsersSchedule(b);
    albcm.sendUsersSchedule(c);
  })
}

const repSndTestJsk = (e) =>{
  let repeat = parseInt(e.currentTarget.getAttribute('repeat'));
  if (!repeat)  repeat = 1;
  Array(repeat).fill(0).map(e=>{
    albcm.sendPartOfSchedule(sptsTest0); // 梅実績
    albcm.sendPartOfSchedule(sptsTest3); // 鮭取り消し
  })
}

const repSndTestJsk1 = (e) =>{
  let repeat = parseInt(e.currentTarget.getAttribute('repeat'));
  if (!repeat)  repeat = 1;
  Array(repeat).fill(0).map(e=>{
    const a = {...sptsTest1};
    const b = {...sptsTest2};
    albcm.sendPartOfSchedule(a); // 梅取り消し
    albcm.sendPartOfSchedule(b); // 鮭実績
  })
}

const repSndTestJskX = (e) =>{
  const a = parseInt(e.currentTarget.getAttribute('a'));
  if (a === 0)
    albcm.sendPartOfSchedule(sptsTest0); // 梅実績
  if (a === 1)
    albcm.sendPartOfSchedule(sptsTest1); // 梅取り消し
  if (a === 2)
    albcm.sendPartOfSchedule(sptsTest2); // 鮭実績
  if (a === 3)
    albcm.sendPartOfSchedule(sptsTest3); // 鮭取り消し
}

export const testTexts = [
  '今日の午<br/>前中の活動は、①じゃんけんバスケットというゲームを行いました。じゃんけんバスケットとは、フルーツバスケットとじゃんけんを組み合わせたゲームで、みんなで輪になって、真ん中に立っているお友だちが鬼となってみんなでじゃんけんをし、負けた人は自分が座っている場所から、違う場所に移動します。<br>何度か繰り返して、あいこの人と勝った人が移動するなど、色々なパターンで楽しみました。②動画で数字探しをした後、紙に数字と平仮名が書かれた紙から、先生から言われた数字や平仮名を探すビジョントレーニングを行いました。 午後からは、今日のプログラム、③昇町親水公園に行って、大きな模造紙に絵具で思い切り絵を描いて楽しみました。',
  '今日の午前中の活動は、最初に自分の名前をみんなの前で発表しました。人数が多かったこともあり緊張していましたが、先生と発表することができました。①じゃんけんバス<br/>ケットというゲームを行いました。じゃんけんバスケットとは、フルーツバスケットとじゃんけんを組み合わせたゲームで、みんなで輪になって、真ん中に立っているお友だちが鬼となってみんなでじゃんけんをし、負けた人は自分が座っている場所から、違う場所に移動します。何度か繰り返して、あいこの人と勝った人が移動するなど、色々なパターンで楽しみました。移動するのがいつなのか、タイミングを掴むことが少し難しかったようですが、最後まで参加することができました^ ^②動画で数字探しをした後、紙に数字と平仮名が書かれた紙から、先生から言われた数字や平仮名を探すビジョントレーニングを行いました。すぐに見つけることもできており、なかなか見つけることが出来なくても頑張って探すことが出来ました☆ 午後からは、今日のプログラム、③昇町親水公園に行って、大きな模造紙に絵具で思い切り絵を描いて楽しみました。手のひらに塗ってたくさん手形をとりました！「まだしたい〜」と言っていた莉菜ちゃん。楽しんでくれて私たちも嬉しかったです！！',
  '今日の午前中の活動は、①じゃんけんバスケットというゲームを行いました。じゃんけんバスケットとは、フルーツバスケットとじゃんけんを組み合わせたゲームなのですが、ひろ君は少しルールが難しかったことと好きなお友達と遊びたかったようで、参加が出来ませんでした。②動画で数字探しをした後、紙に数字と平仮名が書かれた紙から、先生から言われた数字や平仮名を探すビジョントレーニングでは、動画をよく見て答えれていた時もありました！先生から言われた数字や平仮名を探すことも、分かって丸をつけれた平仮名や数字もあり、少しずつ覚えてきているようです(*^^*) 午後からは、今日のプログラム、③昇町親水公園に行って、大きな模造紙に絵具で思い切り絵を描いて楽しみました。ひろ君は、絵具で絵を描くことがとても好きなようで、始めから最後まで公園の遊具で遊ぶことなく、手に絵具をつけて手形アートをしたり絵を描いたりして楽しんでいたひろ君でした。最近はお兄さんのはる君といつも一緒ではなく、自分の好きなことを楽しんでいる姿が多く見られるようになってきています。 昼食のお弁当は少し残しましたが、おやつのフライドポテトは全部食べています。 トイレは、朝トレーニングパンツにかえる時に1回成功、昼食後に2回目はもう濡れてしまっていました。3回目は公園に行く前に成功、公園に帰ってから4回目は濡れてしまっていたので、2回パンツとズボンを水洗いしています。',
  '今日の午前中の活動は、みんなの前で自己紹介をした後、①じゃんけんバスケットというゲームを行いました。じゃんけんバスケットとは、フルーツバスケットとじゃんけんを組み合わせたゲームで、みんなで輪になって、真ん中に立っているお友だちが鬼となってみんなでじゃんけんをし、負けた人は自分が座っている場所から、違う場所に移動します。何度か繰り返して、あいこの人と勝った人が移動するなど、色々なパターンで楽しみました。かんた君は、自己紹介はやらないと言いながらも小さい声で言うことが出来て、①のゲームも始めは少し乗り気ではなかったのですが、後から楽しんで参加することが出来ました。②動画で数字探しをした後、紙に数字と平仮名が書かれた紙から、先生から言われた数字や平仮名を探すビジョントレーニングを行いました。数字探しはかんた君には簡単すぎたようで、出てくる数字を足算したりして答えていました(*^^*)午後からは、今日のプログラム、昇町親水公園に行って大きな模造紙に絵具で絵を描く活動では、かんた君も絵具を使って自由に絵を描いていました。絵をしばらく描いた後は、公園で鬼ごっこをしたりして遊びました。',
];

// const testTexts = [
//   'スケートボードの女子ストリートで東京五輪金メダルの西矢椛が5日、大阪学芸高の入学式に出席後、大阪市内で取材に応じ「楽しみなことは友達をつくること。勉強も競技も頑張りたい」と笑顔を浮かべた。高校入学後もこれまで通り、1日約3時間の練習を週5度行う予定。海外の大会を転戦する中で、英会話のレッスンを週に2度受けており「話せた方がかっこいい。話せるようになりたい」と意欲を示した。',
//   'スケートボードの女子ストリートで東京五輪金メダルの西矢椛が5日、大阪学芸高の入学式に出席後、大阪市内で取材に応じ「楽しみなことは友達をつくること。勉強も競技も頑張りたい」と笑顔を浮かべた。高校入学後もこれまで通り、1日約3時間の練習を週5度行う予定。海外の大会を転戦する中で、英会話のレッスンを週に2度受けており「話せた方がかっこいい。話せるようになりたい」と意欲を示した。',
//   'スケートボードの女子ストリートで東京五輪金メダルの西矢椛が5日、大阪学芸高の入学式に出席後、大阪市内で取材に応じ「楽しみなことは友達をつくること。勉強も競技も頑張りたい」と笑顔を浮かべた。高校入学後もこれまで通り、1日約3時間の練習を週5度行う予定。海外の大会を転戦する中で、英会話のレッスンを週に2度受けており「話せた方がかっこいい。話せるようになりたい」と意欲を示した。',
// ]

// const testTexts = [
//   'NetflixやAmazon プライム・ビデオが台頭する動画配信サービス業界。しかし少し前まで、外資勢を差し置いて圧倒的なシェアを誇っていたサービスがある。NTTドコモとエイベックスが共同出資で設立し、2015年にサービスを開始した「dTV（ディーティービー）」だ',
//   '運営元のドコモは3月上旬、dTVの大規模リニューアルに踏み切ると発表した。4月12日からサービス名を「Lemino（レミノ）」に変更し、月額550円の有料プランのみだったサービス形態を、広告付きの無料配信と月額990円の有料プランの2本柱へと移行する',
//   '注目度の高いスポーツ中継や音楽ライブ等を独占生配信するほか、独占配信作品の最新エピソードやオリジナル作品の一部を広告付きで無料配信する予定だ。感想をシェアしたり、フォローしたユーザーの推奨コンテンツを表示したりする機能も追加し、よりユーザーが関心のあるコンテンツを見つけやすい仕様に刷新する',
// ]

const GenericDialogTest = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    console.log("Confirmed");
    handleClose();
  };

  const handleCancel = () => {
    console.log("Canceled");
    handleClose();
  };
  
  return (
    <div>
      <Button variant="outlined" color="primary" onClick={handleOpen}>
        Open Dialog
      </Button>
      <GenericDialog
        open={open}
        handleClose={handleClose}
        title="確認"
        message="よろしいですか？"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        showCancel={true}
        confirmText="はい"
        cancelText="いいえ"
      />
    </div>
  );
}

const partOfSchTest = (prms) => {
  const {hid, bid, stdDate, schedule, setRes, setSnack} = prms;
  // スケジュールから任意の2つのuidを取得する
  const uids = Object.keys(schedule)
  .filter(e=>/UID[0-9]+/.test(e)).slice(0, 2);
  const partOfSch = {};
  uids.map(e=>{
    partOfSch[e] = schedule[e];
  });
  // ダミーのスケジュール
  const oneSch ={
    "end":"17:11","start":"13:22","service":"放課後等デイサービス",
    "transfer":["学校","学校"],"offSchool":0,"actualCost":{"おやつ":100}
  };
  // ダミーの日付キー
  const dKey = 'D' + stdDate.replace(/\-/g, '');
  // ダミーのスケジュール追加（または置換）
  uids.map(e=>{
    partOfSch[e][dKey] = oneSch;
  });
  const sendPrms = {hid, bid, date: stdDate, partOfSch};
  albcm.sendPartOfSchedule(sendPrms, setRes, setSnack )
}

const TestStateUpdate = (props) => {
  const {testData, setTestData} = props;
  const clickHandler = () => {
    const v = new Date().getSeconds();
    setTestData({v, update: true});
  }
  return(
    <a onClick={clickHandler}><div>click here.</div></a>
  )
}

// etc.configReports.invoice.displayDate:true/false
// etc.configReports.invoice.displayNotice:true/false
const Xxx = () =>{
  const allstate = useSelector(state=>state);
  const {com} = allstate;
  const comEtc = com.etc? com.etc: {};
  const comExt = com.ext? com.ext: {};
  const displayDate = comExt?.reportsSetting?.invoice?.displayDate ?? comEtc?.configReports?.invoice?.displayDate ?? true;
  const displayNotice = comExt?.reportsSetting?.invoice?.displayNotice ?? comEtc?.configReports?.invoice?.displayNotice ?? true;
}

const TestYesNoDialog = () => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(false);
  console.log(value);
  return (<>
    <div style={{padding:16}}>
      <a onClick={()=>setOpen(true)}>
        標準語
      </a>
    </div>
    <YesNoDialog open={open} setOpen={setOpen} setValue={setValue}/>
  </>)
}

const TestYesNoDialogWest = () => {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(false);
  const prms = {
    title: 'いくで', message: 'ええのんか？', 
    confirmText: 'ええで', cancelText: 'あかんわ'
  }
  console.log(value);
  return (<>
    <div style={{padding:16}}>
      <a onClick={()=>setOpen(true)}>
        関西弁
      </a>
    </div>
    <YesNoDialog open={open} setOpen={setOpen} setValue={setValue} prms={prms} />
  </>)
}


const sendAllState = async (prms) => {
  const {allState, setRes, setSnack} = prms;
  // {hid, bid, date, jino, item, state, } 
  const hid = allState.com.hid;
  const bid = allState.com.bid;
  const jino = allState.com.jino;
  const date = allState.stdDate;
  const sendData = {
    schedule: allState.schedule,
    users: allState.users,
    com: allState.com,
    dateList: allState.dateList,
    scheduleTemplate: allState.scheduleTemplate,
    serviceItems: allState.serviceItems,
  };
  const sendPrms = {
    hid, bid, jino, date, item:'allState', state: JSON.stringify(sendData)
  };
  await albcm.sendSomeState(sendPrms, setRes, setSnack, '内部データを送信しました。');
}



const sendHidBid = async (prms) => {
  const {allState, setRes, setSnack} = prms;
  // {hid, bid, date, jino, item, state, } 
  const hid = allState.com.hid;
  const bid = allState.com.bid;
  const jino = allState.com.jino;
  const date = allState.stdDate;
  const sendData = {hid, bid};
  const sendPrms = {
    hid, bid, jino, date, item:'hidbid', state: JSON.stringify(sendData)
  };
  await albcm.sendSomeState(sendPrms, setRes, setSnack, '事業所IDを送信しました。');
}

const ChangePermission = ({account}) => {
  const dispatch = useDispatch();
  const init_permission = account.permission;
  const [perms, setPerms] = useState(init_permission);
  const handleClick = () => {
    dispatch(Actions.setStore({account: {...account, permission: perms}}));
  }
  return(
    <div style={{margin: '16px 0 16px 16px', display: 'flex'}}>
      <TextField
        label="パーミッション設定"
        value={perms}
        onChange={e => setPerms(e.target.value)}
      />
      <div style={{paddingTop: 10, marginLeft: 16}}>
        <Button
          variant='contained'
          style={{marginRight: 8, backgroundColor: init_permission===perms ?null :lightBlue[800], color: init_permission===perms ?null :'#fff'}}
          disabled={init_permission===perms}
          onClick={() => setPerms(init_permission)}
        >
          キャンセル
        </Button>
        <Button
          variant='contained'
          color="primary"
          disabled={init_permission===perms}
          onClick={handleClick}
        >
          書き込み
        </Button>
      </div>
    </div>
  )
}

/**
 * 連絡帳・日報のロック無効化
 */
const DisableCntbkAndDailyReportLock = () => {
  const [checked, setChecked] = useLocalStorageState(false, "DisableCntbkAndDailyReportLock");
  const handleClick = () => {
    setChecked(!checked);
  }
  return (
    <div style={{margin: '16px 0 16px 16px'}}>
      <FormControlLabel
        control={<Checkbox
          checked={checked}
          onChange={handleClick}
          color="primary"
        />}
        label="連絡帳・日報のロック無効化"
      />
    </div>
  )
}


const KeyboardShortcut = () => {
  const [keyInfo, setKeyInfo] = useState({
    keyPressed: '',
    shiftPressed: false,
    controlPressed: false,
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key, shiftKey, ctrlKey } = event;
      // console.log(`Key pressed: ${key}, Shift: ${shiftKey}, Control: ${ctrlKey}`);
      setKeyInfo({
        keyPressed: key,
        shiftPressed: shiftKey,
        controlPressed: ctrlKey,
      });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div>
      <p>Press any key:</p>
      <p>Key pressed: {keyInfo.keyPressed}</p>
      <p>Shift pressed: {keyInfo.shiftPressed.toString()}</p>
      <p>Control pressed: {keyInfo.controlPressed.toString()}</p>
    </div>
  );
};

// サービスとクラスルームを列挙する テストで使うかも
const ServiceAndClassrooms = () => {
  const allState = useSelector(state=>state);
  const {users, serviceItems} = allState;
  const classes = useStyles();
  // classroomの配列を求める。なければ空の配列を返す
  const classrooms = Array.from(new Set(users.map(e=>e.classroom))).filter(e=>e);

  const Main = () => {
    const a =  (Array.isArray(serviceItems))? serviceItems: [];
    const svcs = a.map((e, i) => {
      return (
        <div key={i}>{e}</div>
      )
    });
    const b =  (Array.isArray(classrooms))? classrooms: [];
    const clses = b.map((e, i)=>{
      return (
        <div key={i}>{e}</div>
      )
    });
    return (
      <div className={classes.svcClsRoot + ' serviceAndClassrooms'}>
        <h2>使用しているサービスと単位</h2>
        <h3>サービス</h3>
        <div className='svcs'>
          {svcs}
        </div>
        <h3>単位</h3>
        <div className='clses'>
          {clses}
        </div>
      </div>
    )
  
  }
  if (!serviceItems || !Array.isArray(serviceItems)) return null;
  if (!users || !Array.isArray(users)) return null;
  else return <Main/>
}

const FadeTest = () => {
  const classes = useStyles();
  const handleClick = (e) => {
    const node = e.currentTarget;
    node.classList.remove(classes.fade);
    node.classList.add(classes.fadeEnd);
    setTimeout(()=>{
      node.classList.add(classes.fade);
    },50)
  }
  return (
    <div 
      className={classes.fadeBox}
      onClick={e=>handleClick(e)}
    >
    </div>
  )
}

const SummerrizeText = (props) => {
  const {p, l} = props;
  const {commonPart,uniqPart,} = summarizeTexts(testTexts, p, l);
  const s = {padding: 4}
  return (
    <div style={s}>
      {/* <div style={s}>{commonPart}</div> */}
      <div style={s}>{uniqPart}</div>
    </div>
  )
}
const TestGetUsersTimetable = () => {
  const allState = useSelector(state => state);
  const [uid, setUid] = useState('');
  const [did, setDid] = useState('');
  const [timetable, setTimetable] = useState(null);

  const handleFetchTimetable = () => {
    const result = getUsersTimetable(allState, uid, did);
    setTimetable(result);
  };

  return (
    <div style={{padding: 16}}>
      <h3>Get Users Timetable Test</h3>
      <div>
        <label>
          UID:
          <input type="text" value={uid} onChange={(e) => setUid(e.target.value)} />
        </label>
      </div>
      <div>
        <label>
          DID:
          <input type="text" value={did} onChange={(e) => setDid(e.target.value)} />
        </label>
      </div>
      <button onClick={handleFetchTimetable}>Fetch Timetable</button>
      {timetable && (
        <div>
          <h4>Timetable Result:</h4>
          <pre>{JSON.stringify(timetable, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

const LlmApiCallTest = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackMessage, setSnackMessage] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('');
  // systemrole用のステート追加
  const [systemRole, setSystemRole] = useState('');

  // スナックバーメッセージのセッター関数
  const setSnack = (snackData) => {
    setSnackMessage(snackData.msg || '');
    setSnackSeverity(snackData.severity || 'info');
  };

  // APIを呼び出す関数
  const callLlmApi = async () => {
    if (!prompt.trim()) {
      setSnack({ msg: 'プロンプトを入力してください', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('https://houday.rbatos.com/api/llmapi.php', {
        prompt,
        systemrole: systemRole || null// systemroleパラメータを追加
      });
      setResponse(response);
      setSnackSeverity('success');
      setSnackMessage('APIリクエストが成功しました');
    } catch (error) {
      console.error('API呼び出しエラー:', error);
      setSnackSeverity('error');
      setSnackMessage('APIリクエストが失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
      <h3>LLM API テスト</h3>
      
      <TextField
        label="プロンプト"
        multiline
        rows={4}
        fullWidth
        variant="outlined"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        margin="normal"
      />
      
      <TextField
        label="システムロール"
        fullWidth
        variant="outlined"
        value={systemRole}
        onChange={(e) => setSystemRole(e.target.value)}
        margin="normal"
      />
      
      <Button
        variant="contained"
        color="primary"
        onClick={callLlmApi}
        disabled={loading}
        style={{ marginTop: 16 }}
      >
        {loading ? '処理中...' : '送信'}
      </Button>
      
      {snackMessage && (
        <div style={{ 
          marginTop: 16, 
          padding: 8, 
          backgroundColor: snackSeverity === 'error' ? '#ffebee' : 
                          snackSeverity === 'warning' ? '#fff8e1' : '#e8f5e9',
          borderRadius: 4
        }}>
          {snackMessage}
        </div>
      )}
      
      {response && response.data && (
        <div style={{ marginTop: 16 }}>
          <h4>API レスポンス:</h4>
          <Paper style={{ padding: 16, backgroundColor: '#f5f5f5' }}>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {typeof response.data === 'object' 
                ? JSON.stringify(response.data, null, 2) 
                : response.data}
            </pre>
          </Paper>
        </div>
      )}
    </div>
  );
};

const CntbkApiTest = () => {
  const users = useSelector(state => state.users);
  const targetUsers = users.filter(user => Boolean(user.faptoken));
  const com = useSelector(state => state.com);
  const hid = com.hid, bid = com.bid;
  const stdDate = useSelector(state => state.stdDate);
  const [snack, setSnack] = useState({});
  const [cntbkDt, setCntbkDt] = useState({});
  useEffect(() => {
    if(!hid || !bid || !stdDate) return;
    (async() => {
      const dt = await fetchContacts(hid, bid, stdDate, null, null, setSnack);
      setCntbkDt(dt);
    })();
  }, [hid, bid, stdDate]);
  const [resList, setResList] = useState([]);

  const handleClick = async() => {
    for(const user of targetUsers){
      const uid = user.uid;
      if(uid != 331) continue;
      console.log(cntbkDt)
      const ctoken = cntbkDt?.["UID"+uid]?.ctoken;
      if(!ctoken){
        setResList(prevList => ([...prevList, {msg: "ctokenがありません。", uid}]));
        return;
      }
      const fetchParams2 = {
        a: "fetchPartOfContactJino",
        jino: com.jino, faptaken: user.faptoken, ctoken,
        uid: uid, date: stdDate
      };
      const fetchParams =  {
        "a": "fetchPartOfContactJino",
        "jino": "1452602202",
        "faptaken": "drccjicv",
        "ctoken": "cregq8uv47ifceuc",
        "uid": "331",
        "date": "2025-06-01"
      }

      console.log(fetchParams)
      console.log(fetchParams2)
      for(let apiCallCnt=0; apiCallCnt<5; apiCallCnt++){
        try{
          const res = await axios.post(albcm.endPoint(), comMod.makeUrlSearchParams(fetchParams));
          if(res?.data?.result){
            console.log(res)
            setResList(prevList => ([...prevList, {success: true, uid}]));
            break;
          }
          if(apiCallCnt+1 < 5) continue;
          throw new Error("Error");
        }catch(error){
          if(apiCallCnt+1 < 5) continue;
          setResList(prevList => ([...prevList, {error: true, uid}]));
        }
      }
    }
  };

  return(
    <div>
      <Button onClick={handleClick}>fetchPartOfContactJinoテスト</Button>
      <div>
        {resList.map(res => (
          <div>
            <span style={{marginRight: 16}}>UID{res.uid}</span>
            <span style={{marginRight: 16}}>UID{users.find(user => user.uid === res.uid)?.name ?? "エラー"}</span>
            {res.success &&<span style={{marginRight: 16}}>成功</span>}
            {res.error &&<span style={{color: red["A700"], marginRight: 16}}>失敗</span>}
            {Boolean(res.msg) &&<span style={{color: red["A700"]}}>{res.msg}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}


const TestCriteriaCall = () => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);

  const handleClick = async () => {
    // hid, bid を criteria に入れて暗号化
    // const criteria = makeCreteria({ hid, bid });

    const prms = { 
      criteria: makeCreteria({ hid, bid, a: 'lu', date: stdDate }),
    };

    console.log('Sending params:', prms);
    const rt = await albcm.univApiCall(prms);
    console.log('Response:', rt);
  };

  return (
    <div style={{ padding: 20, border: '1px solid #ccc', margin: '10px 0' }}>
      <h3>Criteria Encryption Test</h3>
      <Button variant="contained" color="primary" onClick={handleClick}>
        univApiCall with Criteria
      </Button>
    </div>
  );
}

const Hoge = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const pathname = useLocation().pathname;
  const users = useSelector(state=>state.users);
  const [msg, setmsg] = useState('');
  const [severity, setseverity] = useState('');
  const [snack, setSnack] = useState({msg: '', severity: ''})
  const [dialogOpen, setDialogOpen] = useState('');
  const [userList, setUserList] = useState(
    users.map(e => ({ uid: e.uid, checked: false }))
  );
  const [res, setRes] = useState({});
  const hid = useSelector(state=>state.hid);
  const bid = useSelector(state=>state.bid);
  const com = useSelector(state=>state.com);
  const schedule = useSelector(state=>state.schedule);
  const stdDate = useSelector(state=>state.stdDate);
  const allState = useSelector(state=>state);
  const account = useSelector(state => state.account);
  const skey = allState.session.key;
  const mail = allState.account.mail;
  const jino = allState.com.jino;
  const permission = comMod.parsePermission(allState.account)[0][0];
  const [file, setFile] = useState(null);
  const clickHandlr = (text, svr='')=>{
    setmsg(text);
    setseverity(svr);
  }
  const dispathcHandler = (text, severity)=>{
    dispatch(Actions.setSnackMsg(text, severity));
  }
  const tx = 'this is dispatch.';
  const loc = '/schedule';
  const [destList, setDestList] = useState(['校門', '裏庭', '駅前',]);
  const [usDialogOpen, setUsDialogOpen] = useState(false);
  const [testData, setTestData] = useState('');
  const sd = new Date(2021,2,31);
  const sds = comMod.formatDate(sd, 'YYYY-MM-DD');
  const [feed, setFeed] = useState({});
  // const addEditStyle = {cursor:`url(${curaddedit})`, padding:4}
  // const addRemoveStyle = {cursor:`url(${curaddremove})`, padding:4}
  const addEditStyle = {cursor:`url(./img/curaddedit.png)`, padding:4}
  const addRemoveStyle = {cursor:`url(${curaddremove})`, padding:4}
  const [fabSch, setFabSch] = useState(0);
  const ls = comMod.getLodingStatus(allState);
  // 加算重複チェック
  useEffect(()=>{
    console.log(res, 'res');
  },[res])
  const handleClick = () => {
    partOfSchTest({hid, bid, stdDate, schedule, setRes, setSnack})
  }
  const handleClickSendAll = async () => {
    const prms = {allState, setRes, setSnack};
    await sendHidBid(prms);
    await sendAllState(prms);
  }
  useEffect(()=>{
    console.log(testData, 'testData');
    return()=>{
      console.log('hoge clean up');
      dispatch(Actions.setStore({test:'test'}));
      const f = async () => {
        setTimeout(()=>{
          const nodes = document.querySelectorAll('.hogehoge');
          // console.log('node length:', nodes.length);
          // console.log('time out working');
        }, 100);
      };
      f();
      setmsg('hoge clean up');
    }
  }, [testData]);
  const LoadingWrapper = () => {
    if (!ls.loaded) return null;
    return (
      <NyuuinRenkei dLayer={0} size='large'/>
    )
  }
  const selectOpt = [
    { value: 0, label: "すべて表示" },
    { value: 1, label: "名前のみ" },
    { value: 2, label: "名前,時間" },
    { value: 3, label: "名前,時間,実費" },
    { value: 4, label: "名前,時間,実費,加算" },
    { value: 5, label: "名前,時間,送迎" },
    { value: 6, label: "名前,時間,送迎,実費" },
    { value: 8, label: "名前,実費,加算" },
  ];

  const JikankubunTest = () => {
    const [val, setVal] = useState();
    const [text, setText] = useState('');
    const [checkd, setChecked] = useState({useKubun3: false, useEnchou1: false})
    useEffect(()=>{
      const v = val;
      const startEnd = v && v.split('-').length > 1? v.split('-'): null;
      const dt = startEnd
        ? getJikanKubunAndEnchou(
          startEnd[0], startEnd[1], checkd.useKubun3, checkd.useEnchou1
        )
        : {};
      if (dt.mins){
        console.log(dt);
        setText(
          `
            分数: ${dt.mins || '--'} 
            時間数: ${dt.hours || '--'} 
            区分: ${dt.区分 || '--'} 
            延長支援: ${dt.延長支援 || '--'}
            テキスト: ${dt.str || '--'}
            算定時間: ${dt.santeiHours || '--'} 
          ` 
        )
      }
      else{
        setText('')
      }

    }, [val, checkd])
    const handleChange = (e) => {
      setVal(e.target.value);
    }
    const handleCheckBokChange = (e) => {
      setChecked({...checkd, [e.target.name]: e.target.checked})
    }
    return (<>
      <div style={{marginLeft: 16, marginTop: 16, marginBottom: 32,}}>
        <TextField
          label='時刻入力' placeholder='hh:mm-hh:mm'
          value={val} onChange={handleChange}
        >
        </TextField>
        <FormControlLabel
          control={
            <Checkbox checked={checkd.useKubun3}
            onChange={handleCheckBokChange} name={'useKubun3'} />
          }
          label='区分3を使用'
        />
        <FormControlLabel
          control={
            <Checkbox checked={checkd.useEnchou1}
            onChange={handleCheckBokChange} name={'useEnchou1'} />
          }
          label='延長1を使用'
        />

        <div style={{marginTop: 4, }}>{text}</div>
      </div>
    </>)
  }
  // const { 
  //   stdDate, schedule, users, com, service, serviceItems, classroom,
  //   calledBy,
  // } = prms;
  const loaded = (ls.loaded && !ls.error);
  const billingDt = loaded ? setBillInfoToSch({
    stdDate, schedule, users, com, 
    service: allState.service, 
    serviceItems: allState.serviceItems,
    classroom: allState.classroom, calledBy: 'hoge',
  }).billingDt: []
  return (
    <div className='AppPage proseed hogehoge' style={{paddingTop:60}}>
      <ChangeEndpoint/>
      {/* <ServiceAndClassrooms /> */}
      <ChangePermission account={account} />    
      <DisableCntbkAndDailyReportLock />

      <LlmApiCallTest/>
      <SideToolBar/>
      <TestStateUpdate testData={testData} setTestData={setTestData} />
      {/* <FsCon /> */}
      {/* <UserBilling /> */}
      {/* <div style={{padding:8}}>
        <ExcahngeTotalizeButton />
      </div> */}
      {/* <div style={{padding:8}}>
        <WanpakuImportButton/>
      </div> */}
      {/* <div style={{padding:8}}>
        <SendBillingToSomeState sendAnyTime={false} displayButton={true}/>
      </div> */}

      {/* 橋本　10/25　送信情報の追加 */}
      {/* <div style={{margin: '16px 8px 8px 8px'}}>送信情報の追加</div> */}
      {/* <CheckBillingEtc/> */}
      {/* <GenericDialogTest />
      <TestYesNoDialog/>
      <TestYesNoDialogWest/>
      <div style={{padding: 16}}>
        <TestSchDaySettingNoDialog day={5}/>
        <TestSchDaySettingNoDialog day={11}/>
        <TestSchDaySettingNoDialog day={25}/>
      </div>
      <SetUisCookieSelect
        p={comMod.uisCookiePos.displayContOnSchWeekly}
        label='表示項目を選択' opt={selectOpt}
      /> */}
      <JikankubunTest/>
      <CalcDataExport/>
      <KeyboardShortcut/>
      {/* <LoadingWrapper/> */}
      {/* <ManualJosei billingDt={billingDt} /> */}
      <a 
        style={{display:'block', margin: 8}}
        onClick={()=>{
          history.push('/stickytable/')
        }}
      >
        テーブルサンプル
      </a>
      <div style={{height: 16}}></div>
      <div style={{margin: 8}}>
        {/* <GoogleColabTest/> */}
      </div>
      <TestGetUsersTimetable/>
      <TopPageMessageForm />
      <DisplayTopPageMessages />
      <div>
        <Button onClick={()=>{
          addNextSch();
        }}>
          次の月の予定を追加
        </Button>
      </div>
      <div style={{margin: 8}}>
        <Button 
          variant="outlined" 
          color="primary"
          onClick={()=>{
            history.push('/billing/compare')
          }}
        >
          billingDt リビジョン比較ツール
        </Button>
      </div>
      
      {/* <CntbkApiTest /> */}
      <AnyFileUploadButton />
      <div style={{height: 32}}></div>
      <CheckUsersTemplate />
      <CountAddictionLimitTest />
      <div style={{height: 32}}></div>
      {/* <div><Rebilling /></div> */}
      <SchServiceUnsetDetector />
      <DeleteCompanyAndBranch />
      <CleanupNotifications />
      <TestCriteriaCall />
      <ApiPerformanceTest />
      <div style={{height: 32}}></div>
    </div>
  )
}

export default Hoge;