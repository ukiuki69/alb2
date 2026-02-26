import React, { useState, useEffect } from 'react';
import SchUsersCalendar from "../common/SchUsersCalendar";
import { useDispatch, useSelector } from 'react-redux';
import { convDid, getLodingStatus, shortWord } from '../../commonModule';
import { useSessionStorageState } from '../common/HashimotoComponents';
import { getFilteredUsers, sendPartOfScheduleCompt, setRecentUser } from '../../albCommonModule';
import { FormControlLabel, RadioGroup, Radio, makeStyles, Menu, MenuItem, ListItemIcon, ListItemText, Button, ButtonGroup } from '@material-ui/core';
import { LinksTab, LoadingSpinner } from '../common/commonParts';
import { blue, grey, red, teal } from '@material-ui/core/colors';
import RemoveIcon from '@material-ui/icons/Remove';
import { makeSchMenuFilter, menu, extMenu } from './Sch2';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import SnackMsg from '../common/SnackMsg';
import { DAY_LIST } from '../../hashimotoCommonModules';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import { setStore } from '../../Actions';
import { setLocalStorageItemWithTimeStamp } from '../../modules/localStrageOprations';
import { useLocation, useHistory } from 'react-router-dom';

/**
 * 予定データから対象の予定データを取得
 * @param {Object} localSchedule 
 * @returns {Object} 
 */
const getFilteredSchedule = (localSchedule={}) => {
  const newSchedule = Object.entries(localSchedule || {}).filter(([uidStr, sch]) => {
    // UIDxxx以外は対象外
    if(!/^UID\d+$/.test(uidStr)) return false;
    // 利用者予定がない場合は対象外
    if(!checkValueType(sch, 'Object')) return false;
    return true;
  }).reduce((prevSchedule, [uidStr, sch]) => {
    const newSch = Object.entries(sch).filter(([did, schDt]) => {
      // Dyyyymmdd以外のデータは対象外
      if(!/^D\d{8}$/.test(did)) return false;
      // 日毎予定データがない場合は対象外
      if(!checkValueType(schDt, 'Object')) return false;
      // 予約データは対象外
      if(schDt?.reserve) return false;
      return true;
    });
    prevSchedule[uidStr] = Object.fromEntries(newSch);
    return prevSchedule;
  }, {});
  return newSchedule;
}

/**
 * 加算値から表示名に変換
 * @param {String} dAddictionKey 加算キー
 * @param {String} dAddictionValue 加算値
 * @returns {String} 表示名
 */
const convActualCostValueToDisplayValue = (actualCostKey, actualCostValue) => {
  if(actualCostValue || actualCostValue === 0){
    return (
      <span style={{fontSize: '0.7rem'}}>{actualCostValue}</span>
    );
  }
  // switch(actualCostKey){
  //   default: {
  //     return (
  //       <FiberManualRecordIcon style={{color: teal[800]}} />
  //     );
  //   }
  // }
}

/**
 * 指定した加算を削除するフック
 * @returns {Function} (uid, did, kasanName) => Promise<void>
 */
const useDeleteUserActualCost = (localSchedule, setLocalSchedule, setSnack) => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);

  const deleteUserActualCost = async (uid, did, actualCost) => {
    const uidStr = "UID" + uid;

    // 対象の加算がない場合は処理を終了
    if (!localSchedule?.[uidStr]?.[did]?.actualCost?.[actualCost]){
      setSnack({msg: '対象の実費がありません。', severity: 'warning', id: new Date().getTime()});
      return false;
    }
    
    const newSch = JSON.parse(JSON.stringify(localSchedule?.[uidStr]));
    // 指定実費を削除
    delete newSch[did].actualCost[actualCost];

    const params = {
      hid, bid, date: stdDate,
      uid: uidStr,
      partOfSch: {[uidStr]: newSch, modDid: did}
    };

    const res = await sendPartOfScheduleCompt(params);
    if(res?.data?.result){
      setLocalSchedule({...localSchedule, [uidStr]: newSch});
      setLocalStorageItemWithTimeStamp(bid + "UID"+uid + did, true);
      setRecentUser(uid);
      setSnack({msg: '実費を削除しました。', severity: 'primary', id: new Date().getTime()});
      return true;
    }else{
      setSnack({msg: '実費の削除に失敗しました。', severity: 'error', id: new Date().getTime()});
      return false;
    }
  };

  return deleteUserActualCost;
};

// スタイル定義
const useStyles = makeStyles({
  AppPage: {
    padding: '0 8px', margin: "84px 0 84px 61.25px",
    '@media (max-width:959px)': {
      margin: '84px 0',
    },
    '& .actualCostCount': {
      fontSize: '0.8rem'
    }
  },
  ActualCostRadioGroup: {
    position: 'sticky', top: 84,
    padding: '0 20px',
    backgroundColor: '#fff',
    zIndex: 2,
  },
  actualCostDisplay: {
    '& span': {
      color: teal[800],
      fontWeight: 600,
    },
    '& .sub span': {
      color: grey[500],
    }
  },
  ActualCostSelectMenu: {
    '& .saveButton': {
      backgroundColor: teal[800], color: '#fff'
    },
    '& .cancelButton': {
      backgroundColor: blue[800], color: '#fff'
    },
    '& .userInfo': {
      padding: '8px 16px', 
      borderBottom: '1px solid #e0e0e0', 
      backgroundColor: '#f5f5f5',
      fontWeight: 'bold',
      fontSize: '0.9rem',
      color: '#333',
      textAlign: 'center',
      '& > div:not(:last-child)': {
        marginBottom: 2
      },
    }
  },
  addActualCostConfirmDialog: {
    '& .name': {fontSize: '1.2rem', color: teal[800], fontWeight: 'bold'},
    '& .month': {fontSize: '1.2rem', marginInlineEnd: 2},
    '& .date': {fontSize: '1.2rem', marginInlineEnd: 2},
    '& .attention': {fontSize: '1.2rem', color: red["A700"], fontWeight: 'bold'},
  },
  ChangePageButtonsWrapper: {
    height: 42,
    display: 'flex',
    alignItems: 'center',
    '& .button': {
      width: 96, fontSize: 12, padding: '3px 12px'
    }
  },
  OptionsWrapper: {
    position: 'sticky', top: 84, padding: '0 20px',
    backgroundColor: '#fff', zIndex: 2,
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
  }
});

const KASAN_PATH = "/schedule/list/kasan";
const ACTUALCOST_PATH = "/schedule/list/actualcost";
export const ChangePageButtons = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const history = useHistory();
  const classes = useStyles();

  const handleClick = (newPath) => {
    if(newPath === pathname) return;
    history.push(newPath);
  }

  return(
    <div className={classes.ChangePageButtonsWrapper}>
    <ButtonGroup color="primary" >
      <Button
        variant={pathname===KASAN_PATH ?'contained' :'outlined'}
        onClick={() => handleClick(KASAN_PATH)}
        className="button"
      >
        加算
      </Button>
      <Button
        variant={pathname===ACTUALCOST_PATH ?'contained' :'outlined'}
        onClick={() => handleClick(ACTUALCOST_PATH)}
        className="button"
      >
        実費
      </Button>
    </ButtonGroup>
    </div>
  )
}

const ScheduleDispatcher = ({newSchedule}) => {
  const dispatch = useDispatch();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {schedule} = allState;
  useEffect(()=>{
    if(!loadingStatus.loaded) return;
    if(!newSchedule) return;
    return () =>{
      setTimeout(()=>{
        const closed = !document.querySelector('#schUserActualCostListDispatcher');
        if (closed){
          dispatch(setStore({schedule: {...schedule, ...newSchedule}}));
        }
      }, 100)
    }
  }, [newSchedule, loadingStatus.loaded]);
  return (
    <div id='schUserActualCostListDispatcher' style={{display: 'none'}} />
  )
}

const ActualCostMenuItem = ({value, label, prevActualCostValue, handleSave}) => (
  <MenuItem
    value={value}
    onClick={() => handleSave(value)}
  >
    <ListItemIcon style={{ minWidth: 28, marginRight: 8 }}>
      {prevActualCostValue===value &&<RadioButtonCheckedIcon style={{color: teal[800]}} fontSize="small" />}
      {prevActualCostValue!==value &&<RadioButtonUncheckedIcon style={{color: teal[800]}} fontSize="small" />}
    </ListItemIcon>
    <ListItemText primary={label} />
  </MenuItem>
);

const ActualCostSelectMenu = (props) => {
  const users = useSelector(state => state.users);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const com = useSelector(state => state.com);
  const config = useSelector(state => state.config);
  const actualCostList = com?.etc?.actualCostList ?? config.actualCostList ?? {};
  const classes = useStyles();
  const {
    selectedActualCost,
    localSchedule, setLocalSchedule,
    cellDt,
    userMenuAnchorEl, setUserMenuAnchorEl,
    setEditingCell,
    setSnack,
  } = props;
  const {uid, did=""} = cellDt;
  const uidStr = "UID" + uid;
  const user = users.find(user => user.uid === uid);
  const didYear = parseInt(did.slice(1, 5));
  const didMonth = parseInt(did.slice(5, 7));
  const didDate = parseInt(did.slice(7, 9));
  const didDateObj = new Date(didYear, didMonth - 1, didDate);
  const day = didDateObj.getDay();

  const handleClose = () => {
    setUserMenuAnchorEl(null);
    setEditingCell({});
  };

  const handleSave = async(value) => {
    try{
      if(value==="" && !localSchedule?.[uidStr]?.[did]?.actualCost?.[selectedActualCost]){
        // 未選択かつ元々実費がない場合は処理を終了
        setSnack({});
        handleClose();
        return;
      }
      const newSch = JSON.parse(JSON.stringify({...localSchedule?.[uidStr] ?? {}}));
      const newSchDt = newSch[did];
      if(!checkValueType(newSchDt.actualCost, "Object")) newSchDt.actualCost = {};
      if(value){
        // valueがある場合は実費を設定
        newSchDt.actualCost[selectedActualCost] = actualCostList[selectedActualCost];
      }else{
        // valueがない場合は実費を削除
        delete newSchDt.actualCost[selectedActualCost];
      }
      newSchDt.timestamp = new Date().getTime();
      console.log(newSchDt, 'newSchDt');
      const params = {
        hid, bid, date: stdDate,
        uid: uidStr,
        partOfSch: {[uidStr]: newSch, modDid: did}
      };
      const res = await sendPartOfScheduleCompt(params);
      if(!res?.data?.result) throw new Error("実費の変更に失敗しました。");
      setLocalSchedule({...localSchedule, [uidStr]: newSch});
      setLocalStorageItemWithTimeStamp(bid + "UID"+uid + did, true);
      setRecentUser(uid);
      setSnack({msg: '実費を変更しました。', severity: 'primary', id: new Date().getTime()});
      handleClose();
    }catch(error){
      console.error("handleSave error", error);
      setSnack({msg: '実費の変更に失敗しました。', severity: 'error', id: new Date().getTime()});
    }
  }

  const actualCostOptions = [{ label: "選択", value: actualCostList[selectedActualCost] }];
  const prevActualCostValue = localSchedule?.[uidStr]?.[did]?.actualCost?.[selectedActualCost] ?? "";
  return(
    <Menu
      anchorEl={userMenuAnchorEl}
      keepMounted
      open={Boolean(userMenuAnchorEl)}
      onClose={() => {handleClose(); setSnack({});}}
      getContentAnchorEl={null}
      anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
      transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      className={classes.ActualCostSelectMenu}
    >
      <div className="userInfo">
        <div>{user?.name || "不明な利用者"}さん</div>
        <div>{didMonth}月{didDate}日({DAY_LIST[day]})</div>
        <div>{shortWord(selectedActualCost)}</div>
      </div>
      <ActualCostMenuItem
        value=""
        label="未選択"
        prevActualCostValue={prevActualCostValue}
        handleSave={handleSave}
      />
      {actualCostOptions.map(({label, value}) => (
        <ActualCostMenuItem
          key={`menuItem-${uidStr}-${did}-${label}`}
          value={value}
          label={label}
          prevActualCostValue={prevActualCostValue}
          handleSave={handleSave}
        />
      ))}
    </Menu>
  )
}

const ActualCostRadioGroup = (props) => {
  const com = useSelector(state => state.com);
  const config = useSelector(state => state.config);
  const actualCostList = com?.etc?.actualCostList ?? config.actualCostList ?? {};
  const classes = useStyles();
  const {selectedActualCost, setSelectedActualCost} = props;
  return(
    <div className={classes.ActualCostRadioGroup}>
      <RadioGroup
        value={selectedActualCost}
        onChange={e => setSelectedActualCost(e.target.value)}
        row
      >
        {Object.keys(actualCostList || {}).map(actualCost => (
          <FormControlLabel
            key={actualCost}
            value={actualCost}
            control={<Radio color='primary' />}
            label={shortWord(actualCost)}
          />
        ))}
      </RadioGroup>
    </div>
  )
}

const SchUserActualCostList = () => {
  const classes = useStyles();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {schedule, users, service, classroom, dateList, com, config} = allState;
  const actualCostList = com?.etc?.actualCostList ?? config.actualCostList ?? {};

  // dispatchを使わないようにするためにstoreのscheduleをlocalScheduleにコピーするためのstate
  const [localSchedule, setLocalSchedule] = useState(null);
  // 選択されている実費のstate
  const [selectedActualCost, setSelectedActualCost] = useSessionStorageState("", "SchUserActualCostList_actualCost");
  const [cellDt, setCellDt] = useState({});
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  // 編集中のセルのstate
  const [editingCell, setEditingCell] = useState({});
  // スナックメッセージのstate
  const [snack, setSnack] = useState({});

  // 指定利用者の指定日付の指定加算を削除するフック
  const deleteUserActualCost = useDeleteUserActualCost(localSchedule, setLocalSchedule, setSnack);

  useEffect(()=>{
    if(!loadingStatus.loaded) return;
    // storeデータが読み込み終わったらstoreのscheduleをlocalScheduleにコピー
    setLocalSchedule(schedule);
    if(!selectedActualCost || !Object.keys(actualCostList || {}).includes(selectedActualCost)){
      setSelectedActualCost(Object.keys(actualCostList || {})?.[0] ?? "");
    }
  }, [loadingStatus.loaded]);

  // ストアデータのロード待ち
  if(!loadingStatus.loaded || !localSchedule) return(<LoadingSpinner />);

  const filteredSchedule = getFilteredSchedule(localSchedule, selectedActualCost);
  const filteredUsers = getFilteredUsers(users, service, classroom);

  // カレンダーへ渡す表示用データ
  const data = filteredUsers.reduce((prevData, user) => {
    const uidStr = `UID${user.uid}`;
    if(!prevData[uidStr]) prevData[uidStr] = {};
    const sch = filteredSchedule[uidStr] ?? {};
    Object.entries(sch).forEach(([did, schDt]) => {
      if(!prevData[uidStr][did]) prevData[uidStr][did] = {};
      const actualCostValue = schDt?.actualCost?.[selectedActualCost] ?? "";
      if(!actualCostValue){
        // 実費項目がない場合は削除アイコンを表示
        prevData[uidStr][did].cellNode = (<div><RemoveIcon style={{color: grey[500]}} /></div>);
      }else{
        // 加算項目がある場合は値を表示
        const displayValue = convActualCostValueToDisplayValue(selectedActualCost, actualCostValue);
        prevData[uidStr][did].cellNode = (
          <div className={classes.actualCostDisplay}>
            {Boolean(actualCostValue) &&displayValue}
          </div>
        );
      }
    });
    return prevData;
  }, {});

  // カレンダーの利用者ごとの加算回数表示用データ
  const uidOption = filteredUsers.reduce((prevUidOption, user) => {
    const uid = user.uid;
    const uidStr = `UID${uid}`;
    const sch = filteredSchedule[uidStr] ?? {};
    const actualCostCount = Object.entries(sch).filter(([did, schDt]) => {
      if(!/^D\d{8}/.test(did)) return false;
      if(!checkValueType(schDt, 'Object')) return false;
      // 予約データは対象外
      if(schDt?.reserve) return false;
      if(!schDt?.actualCost?.[selectedActualCost]) return false;
      return true;
    }).length;
    if(!prevUidOption[uidStr]) prevUidOption[uidStr] = {};
    prevUidOption[uidStr].optionNode = (<div className='actualCostCount'>{actualCostCount}</div>);
    return prevUidOption;
  }, {});

  // カレンダーの日毎の加算回数表示用データ
  const didOption = dateList.reduce((prevDidOption, dateDt) => {
    const did = convDid(dateDt.date);
    const actualCostCount = Object.entries(filteredSchedule).filter(([uidStr, sch]) => {
      if(!/^UID\d+$/.test(uidStr)) return false;  
      if(!checkValueType(sch, 'Object')) return false;
      const schDt = sch?.[did];
      if(!checkValueType(schDt, 'Object')) return false;
      if(schDt?.reserve) return false;
      if(!schDt?.actualCost?.[selectedActualCost]) return false;
      return true;
    }).length;
    if(!prevDidOption[did]) prevDidOption[did] = {};
    prevDidOption[did].optionNode = (<div className='actualCostCount'>{actualCostCount}</div>);
    return prevDidOption;
  }, {});

  const handleEdit = async(e, uid, did) => {
    setSnack({});
    // 予定がない場合はエラーメッセージを表示して処理を終了
    if(!filteredSchedule?.["UID"+uid]?.[did]){
      setSnack({msg: '予定がないため編集できません。', severity: 'warning', id: new Date().getTime()});
      return;
    }
    const anchorEl = e.currentTarget;
    // セルの情報を格納
    setCellDt({uid, did, anchorEl});
    // 編集中のセル情報を格納
    setEditingCell({uid, did});
    setUserMenuAnchorEl(anchorEl);
  }

  return (
    <>
    <LinksTab menu={menu} menuFilter={(date)=>makeSchMenuFilter(date)} extMenu={extMenu} />
    <div className={classes.AppPage}>
      <div className={classes.OptionsWrapper}>
        <ActualCostRadioGroup selectedActualCost={selectedActualCost} setSelectedActualCost={setSelectedActualCost}/>
        <ChangePageButtons />
      </div>
      <SchUsersCalendar
        data={data}
        uidOption={uidOption}
        didOption={didOption}
        stickyTop={120}
        handleDelete={(e, uid, did) => deleteUserActualCost(uid, did, selectedActualCost, localSchedule)}
        handleEdit={handleEdit}
        editingCell={editingCell}
      />
    </div>
    <ActualCostSelectMenu
      selectedActualCost={selectedActualCost}
      localSchedule={localSchedule} setLocalSchedule={setLocalSchedule}
      cellDt={cellDt}
      userMenuAnchorEl={userMenuAnchorEl} setUserMenuAnchorEl={setUserMenuAnchorEl}
      setEditingCell={setEditingCell}
      setSnack={setSnack}
    />
    <SnackMsg {...snack} />
    <ScheduleDispatcher newSchedule={localSchedule} />
    </>
  )
}
export default SchUserActualCostList;