import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getLodingStatus, getUisCookieInt, parsePermission, uisCookiePos } from '../../commonModule';
import { Button, makeStyles, Menu, MenuItem, Tooltip } from '@material-ui/core';
import * as Actions from '../../Actions'; // Actionsのインポート
import { getLS, removeLocalStorageItem, setLS } from '../../modules/localStrageOprations';
import { KeyListener } from './KeyListener';
import { HOHOU, HOUDAY, JIHATSU } from '../../modules/contants';
import { fetchAll } from '../../modules/thunks';
import { blue, purple, teal } from '@material-ui/core/colors';

const useStyles = makeStyles({
  headButtonRoot: {
    marginTop: 2,
    '& > *': { margin: '1px 4px 0 4px' },
    '& .MuiButton-label': { fontSize: '.7rem' },
    '& .MuiButton-root': { minWidth: 48 },
    "@media (max-width:500px)": {
      marginTop: -8, paddingBottom: 4,
    }
  },
  customTooltip: {
    maxWidth: 300,
    fontSize: 12,
    transition: 'opacity 300ms ease-in-out', // 出現と消滅を滑らかに
    transitionDelay: '300ms', // ホバー後300msの遅延
  },
  customTooltipArrow: {
    transition: 'opacity 300ms ease-in-out',
    transitionDelay: '300ms',
  },
});

const dispAllPaths = [
  '/users', '/proseed', '/users/bankinfo', '/users/belongs',
  '/proseed/upperlimit', '/reports', '/users/bros', '/users/kanri',
  '/reports/setting/all', '/users/addnew', '/schedule/weekly/transfer',
  '/schedule/weekly', '/reports/billing', '/reports/jogenkanri',
  '/schedule/daily',
  '/reports/schedule', '/reports/dearuser', '/reports/etc', '/dailyreport/browse',
  '/contactbook',
  '/contactbook/invoice',
  '/contactbook/list',
  '/contactbook/token','/contactbook/bulkmessage',
  '/contactbook/message/',
  '/contactbook/bulkmail/',
  '/proseed/manualjosei',
  '/plan/assessment','/plan/monitoring','/plan/conferencenote',
  '/plan/manegement','/plan/personalSupport','/reports/usersplan',
  '/plan/senmonshien',
  '/dailyreport/','/dailyreport/browse/', '/dailyreport/print', '/dailyreport/setting',
  '/workshift',
  '/dailyreport'
];

const notDispSeirvicePatterns = [
  /^\/billing/,
  /^\/Account\/ch/,
  /^\/account/,
  /^\/schedule\/userAddiction/,
  /^\/schedule\/userUpperLimit/,
  /^\/schedule\/daysetting\/schbydate/,
  /^\/proseed\/upperlimit/,
  /^\/contactbook\/edit/,
  /^\/workshift\/staffsetting/,
  /^\/setting$/, /^\/setting\/reg/, /^\/setting\/others/,
  /^\/dailyreport\/form/
];

const notDispClassRoomPatterns = [
  /^\/billing/,
  /^\/billing\/upperlimit/,
  /^\/proseed\/upperlimit/,
  /^\/proseed\/otherOfficeis/,
  /^\/schedule\/userAddiction/,
  /^\/schedule\/userUpperLimit/,
  /^\/contactbook\/edit/,
  /^\/workshift\/staffsetting/,
  /^\/setting$/,/^\/setting\/schedule/,/^\/setting\/reg/, /^\/setting\/others/,
  /^\/dailyreport\/form/

];


const fetchSchPathForChangeSvcCls = [
  '/schedule/','/schedule/dsetting/','/schedule/weekly/',
  '/schedule/weekly/transfer/','/schedule/users/',
  '/schedule/daily/','/schedule/useresult/',
  '/schedule/predictive/',
  '/schedule','/schedule/dsetting','/schedule/weekly',
  '/schedule/weekly/transfer','/schedule/users',
  '/schedule/daily','/schedule/useresult',
  '/schedule/predictive',
];

const dispAllPatterns = [/^\/users\/edit[0-9]+/];

const useDispAll = () => {
  const ref = useLocation().pathname.split('?')[0].replace(/\/$/, '');
  return (
    dispAllPaths.includes(ref) || dispAllPatterns.some(pattern => pattern.test(ref))
  );
};

const useNotDispService = () => {
  const refOrg = useLocation().pathname;
  if (refOrg === '/') return true;

  const ref = refOrg.split('?')[0].replace(/\/$/, ''); // クエリを除去し末尾のスラッシュを削除
  const notDispService = notDispSeirvicePatterns.some(pattern => pattern.test(ref));
  
  return notDispService;
};

const useNotDispClassroom = () => {
  const refOrg = useLocation().pathname;
  if (refOrg === '/') return true;
  const ref = refOrg.split('?')[0].replace(/\/$/, '');
  const notDispClassroom = notDispClassRoomPatterns.some(pattern => pattern.test(ref));
  return notDispClassroom;
};



// ChangeServiceNewコンポーネント
// fetchSchPathForChangeSvcClsによる読み込み直しを追加
export const ChangeServiceNew = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const allState = useSelector(s => s);
  const { users, account, service, hid, bid, stdDate, serviceItems } = allState;
  const loc = useLocation().pathname;
  const weekDayDefaultSet = allState.config.weekDayDefaultSet;
  const svcCnt = serviceItems.length;
  const loadingStatus = getLodingStatus(allState);
  const loaded = loadingStatus.loaded && !loadingStatus.error;

  let serviceList = [...new Set(users.flatMap(user => user.service ? user.service.split(',') : []))];
  const notHasHohou = !serviceList.includes(HOHOU) && serviceList.length >= 1;
  if (getUisCookieInt(uisCookiePos.allowDispAllOnScheduleMonthly) && notHasHohou){
    dispAllPaths.push('/schedule');
  }
  const dispAll = useDispAll();
  const permissionAry = parsePermission(account);
  const permissionSvc = permissionAry[1][0];

  serviceList = permissionSvc ? serviceList.filter(svc => svc === permissionSvc) : serviceList;

  if (dispAll && serviceList.length > 1) {
    serviceList.unshift('');
  } else {
    serviceList = serviceList.filter(svc => svc !== '');
  }

  const initSvc = (() => {
    if (service === '') return service;
    if (serviceList.includes(service)) return service;
    // 直前のサービスが選択可能なサービスに含まれていたらそれを選択する
    const selectedServiceLs = getLS('selectedService');
    if (selectedServiceLs && serviceList.includes(selectedServiceLs)) return selectedServiceLs;
    return serviceList[0];
  })();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedService, setSelectedService] = useState(initSvc);
  const buttonRef = useRef(null);

  const handleClick = (event) => {
    if (serviceList.length === 2){
      const v = serviceList.find(e=>e !== selectedService);
      setSelectedService(v);
      setLS('selectedService', v);
      dispatch(Actions.setStore({ service: v }));
      if (fetchSchPathForChangeSvcCls.includes(loc)){
        // fetchAll({stdDate, hid, bid, weekDayDefaultSet, dispatch});
        const sendPrms = {
          date: stdDate,
          stdDate,
          hid,
          bid,
          a: 'fetchSchedule',
        }
        dispatch(Actions.fetchSchedule(sendPrms));
      
      }
    }
    else {
      setAnchorEl(event ? event.currentTarget : buttonRef.current);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (value) => {
    if (dispAll && value === '') {
      setLS('previousService', service);
      setLS('dispAllSvcPossible', 1);
    }
    else {
      removeLocalStorageItem('dispAllSvcPossible')
    }
    setSelectedService(value);
    setLS('selectedService', value);
    dispatch(Actions.setStore({ service: value }));
    handleClose();
    if (fetchSchPathForChangeSvcCls.includes(loc)){
      fetchAll({stdDate, hid, bid, weekDayDefaultSet, dispatch});
    }
  };

  useEffect(() => {
    if (!loaded) return;
    let previousService = getLS('previousService');
    const LSselectedService = getLS('selectedService');
    // 直前のサービスが選択可能なサービスに含まれていなかったらリセットする
    if (previousService && !serviceList.includes(previousService)){
      previousService = '';
      setLS('previousService', '');
    }
    if (!dispAll && service === '') {
      // const newService = serviceList.includes(previousService) ? previousService : LSselectedService ||serviceList[0] || '';
      let newService = '';
      if (LSselectedService && serviceList.includes(LSselectedService)) newService = LSselectedService;
      else if (serviceList.includes(previousService)) newService = previousService;
      else newService = serviceList[0];
      setSelectedService(newService);
      dispatch(Actions.setStore({ service: newService }));
    }
    if (dispAll && service === '' && previousService === ''){
      setSelectedService('');
      dispatch(Actions.setStore({ service: '' }));
    }
    // サービスアイテム数が1の場合は全選択を選択することはない
    if (dispAll && getLS('dispAllSvcPossible') && svcCnt > 1){
      dispatch(Actions.setStore({ service: '' }));
    }
  }, [dispAll, service, dispatch]);
  useEffect(() => {
    if (!loaded) return;
    if (service && selectedService !== service) {
      dispatch(Actions.setStore({ service: selectedService }));
    }
  }, [selectedService]);

  const handleKeyInfo = ({ key, shift, ctrl, meta }) => {
    if (key === '.' && !shift && !ctrl && !meta) {
      handleClick();
    }
  };
  const notDispService = useNotDispService();
  if (notDispService) return null;
  if (serviceList.length <= 1) return null;
  const toolTipText = "クリックしてサービスを選択します。 .キーを押下しても操作可能です。"
  const style = (()=>{
    if (selectedService === HOUDAY) return {color: teal[800], fontWeight: 600}
    if (selectedService === JIHATSU) return {color: blue[800], fontWeight: 600}
    if (selectedService === HOHOU) return {color: purple[800], fontWeight: 600}
    return {};
  })();
  return (
    <div className={classes.headButtonRoot}>
      <KeyListener setKeyInfo={handleKeyInfo} />
      <Tooltip title={toolTipText} classes={{ 
        tooltip: classes.customTooltip ,
        arrow: classes.customTooltipArrow,
      }}>
        <Button ref={buttonRef} onClick={handleClick} variant="contained" style={style}>
          {selectedService === '' ? '全' : selectedService.charAt(0)}
        </Button>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {dispAll && (
          <MenuItem onClick={() => handleSelect('')}>
            全表示
          </MenuItem>
        )}
        {serviceList.map((svc, index) => (
          svc && (
            <MenuItem key={index} onClick={() => handleSelect(svc)}>
              {svc}
            </MenuItem>
          )
        ))}
      </Menu>
    </div>
  );
};

// ChangeClassroomNewコンポーネント
export const ChangeClassroomNew = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const allState = useSelector(s => s);
  const {users, classroom, hid, bid, stdDate, weekDayDefaultSet} = allState;
  const loc = useLocation().pathname;
  const loadingStatus = getLodingStatus(allState);
  const loaded = loadingStatus.loaded && !loadingStatus.error;

  const classroomList = [...new Set(users.flatMap(user => user.classroom.split(',')))];
  classroomList.sort((a, b) => (String(a) < String(b) ? -1: 1))

  const initialClassroom = String(getLS('selectedClassroom')) || '';
  const [selectedClassroom, setSelectedClassroom] = useState(initialClassroom);
  const [anchorEl, setAnchorEl] = useState(null);

  const buttonRef = useRef(null);

  const handleClick = (event) => {
    setAnchorEl(event ? event.currentTarget : buttonRef.current);

  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (value) => {
    setSelectedClassroom(String(value));
    dispatch(Actions.setStore({ classroom: String(value) }));
    setLS('selectedClassroom', String(value));
    handleClose();
    if (fetchSchPathForChangeSvcCls.includes(loc)){
      fetchAll({stdDate, hid, bid, weekDayDefaultSet, dispatch});
    }
  };

  useEffect(() => {
    if (!loaded) return;
    if (!classroomList.includes(String(selectedClassroom)) && selectedClassroom) {
      console.log('useeffect changeclassroom new');
      setLS('selectedClassroom', '');
      setSelectedClassroom('');
      dispatch(Actions.setStore({ classroom: '' }));
    }
    else if (selectedClassroom !== classroom){
      dispatch(Actions.setStore({ classroom: selectedClassroom }));
    }
  }, [users, selectedClassroom, classroomList, dispatch, ]);
  // ローカスストレージからクラスルームが設定されたときに反映されないことがある
  // useEffect(()=>{
  //   if (!classroom && !selectedClassroom && classroom !== selectedClassroom){
  //     dispatch(Actions.setStore({ classroom: selectedClassroom }));
  //   }
  // }, [selectedClassroom])
  const notDispClassRoom = useNotDispClassroom();
  if (notDispClassRoom) return null;
  if (classroomList.length <= 1) return null;
  const handleKeyInfo = ({ key, shift, ctrl, meta }) => {
    if (key === '/' && !shift && !ctrl && !meta) {
      handleClick();
    }
  };
  const toolTipText = "クリックして単位を選択します。 / キーを押下しても操作可能です。"

  return (
    <div className={classes.headButtonRoot}>
      <KeyListener setKeyInfo={handleKeyInfo} />
      <Tooltip title={toolTipText} classes={{ 
        tooltip: classes.customTooltip, 
        arrow: classes.customTooltipArrow 
      }}>
        <Button ref={buttonRef} onClick={handleClick} variant="contained">
          {selectedClassroom === '' ? '全' : selectedClassroom}
        </Button>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleSelect('')}>
          全表示
        </MenuItem>
        {classroomList.map((cls, index) => (
          cls && (
            <MenuItem key={index} onClick={() => handleSelect(cls)}>
              {cls}
            </MenuItem>
          )
        ))}
      </Menu>
    </div>
  );
};
