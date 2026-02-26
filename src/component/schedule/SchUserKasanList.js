import React, { useState, useEffect } from 'react';
import SchUsersCalendar from "../common/SchUsersCalendar";
import { useDispatch, useSelector } from 'react-redux';
import { convDid, getLodingStatus, shortWord } from '../../commonModule';
import { useDeleteSchDt, useGetScheduleTemplate, useSessionStorageState } from '../common/HashimotoComponents';
import { getFilteredUsers, sendPartOfScheduleCompt, setRecentUser } from '../../albCommonModule';
import { FormControlLabel, RadioGroup, Radio, Tooltip, makeStyles, Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Checkbox } from '@material-ui/core';
import { LinksTab, LoadingSpinner } from '../common/commonParts';
import { countAddictionLimit } from '../Billing/countAddictionLimit';
import { blue, grey, red, teal } from '@material-ui/core/colors';
import RemoveIcon from '@material-ui/icons/Remove';
import { makeSchMenuFilter, menu, extMenu } from './Sch2';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import { kessekiSvc } from '../Billing/blMakeData2024';
import SnackMsg from '../common/SnackMsg';
import { DAY_LIST } from '../../hashimotoCommonModules';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import { setStore } from '../../Actions';
import { setLocalStorageItemWithTimeStamp } from '../../modules/localStrageOprations';
import { getAddictionOption } from '../common/AddictionFormPartsCommon';
import { ChangePageButtons } from './SchUserActualCostList';

// 表示する加算リスト
const KASAN_LIST = ["専門的支援実施加算", "子育てサポート加算", "家族支援加算Ⅰ", "家族支援加算Ⅱ", "医療連携体制加算", "関係機関連携加算"];

/**
 * 予定データから対象の予定データを取得
 * @param {Object} localSchedule 
 * @returns {Object} 
 */
const getFilteredSchedule = (localSchedule={}, selectedKasan, filteredUsers, service, classroom) => {
  const newSchedule = Object.entries(localSchedule || {}).filter(([uidStr, sch]) => {
    // UIDxxx以外は対象外
    if(!/^UID\d+$/.test(uidStr)) return false;
    // 対象利用者に一致しない場合は対象外
    if(!filteredUsers.some(user => "UID"+user.uid === uidStr)) return false;
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
      // サービスに一致しない場合は対象外
      if(service && schDt?.service && !(schDt?.service ?? "").includes(service)) return false;
      // 単位に一致しない場合は対象外
      if(classroom && schDt?.classroom && !(schDt?.classroom ?? "").includes(classroom)) return false;
      // 利用なし対応加算でない加算の場合はabsenceによってフィルタリング
      const isKessekiSvc = kessekiSvc.includes(selectedKasan);
      if(!isKessekiSvc){
        if(schDt.absence) return false;
      }
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
const convDAddictionValueToDisplayValue = (dAddictionKey, dAddictionValue) => {
  switch(dAddictionKey){
    case "専門的支援実施加算": {
      if(dAddictionValue == 1){
        return (
          <FiberManualRecordIcon style={{color: teal[800]}} />
        );
      }
      return dAddictionValue;
    }
    case "子育てサポート加算": {
      if(dAddictionValue == 1){
        return (
          <FiberManualRecordIcon style={{color: teal[800]}} />
        )
      }
    }
    case "家族支援加算Ⅰ": {
      if(dAddictionValue === '居宅1時間以上'){
        return (
          <Tooltip title="居宅1時間以上" arrow>
            <span>居</span>
          </Tooltip>
        );
      }
      if(dAddictionValue === '居宅1時間未満'){
        return (
          <Tooltip title="居宅1時間未満" arrow>
            <span>居</span>
          </Tooltip>
        );
      }
      if(dAddictionValue === '事業所対面'){
        return (
          <Tooltip title="事業所対面" arrow>
            <span>事</span>
          </Tooltip>
        );
      }
      if(dAddictionValue === 'オンライン'){
        return (
          <Tooltip title="オンライン" arrow>
            <span>オ</span>
          </Tooltip>
        );
      }
    }
    case "家族支援加算Ⅱ": {
      if(dAddictionValue === '事業所対面'){
        return (
          <Tooltip title="事業所対面" arrow>
            <span>事</span>
          </Tooltip>
        );
      }
      if(dAddictionValue === 'オンライン'){
        return (
          <Tooltip title="オンライン" arrow>
            <span>オ</span>
          </Tooltip>
        );
      }
    }
    case "医療連携体制加算": {
      if(dAddictionValue === '医療連携体制加算Ⅰ'){
        return (
          <Tooltip title="医療連携体制加算Ⅰ" arrow>
            <span>Ⅰ</span>
          </Tooltip>
        );
      }
      if(dAddictionValue === '医療連携体制加算Ⅱ'){
        return (
          <Tooltip title="医療連携体制加算Ⅱ" arrow>
            <span>Ⅱ</span>
          </Tooltip>
        );
      }
      if(dAddictionValue === '医療連携体制加算Ⅲ'){
        return (
          <Tooltip title="医療連携体制加算Ⅲ" arrow>
            <span>Ⅲ</span>
          </Tooltip>
        );
      }
      if(dAddictionValue === '医療連携体制加算Ⅳ１'){
        return (
          <Tooltip title="医療連携体制加算Ⅳ１" arrow>
            <span>Ⅳ</span>
          </Tooltip>
        );
      }
      if(dAddictionValue === '医療連携体制加算Ⅳ２'){
        return (
          <Tooltip title="医療連携体制加算Ⅳ２" arrow>
            <span>Ⅳ</span>
          </Tooltip>
        );
      }
      if(dAddictionValue === '医療連携体制加算Ⅳ３'){
        return (
          <Tooltip title="医療連携体制加算Ⅳ３" arrow>
            <span>Ⅳ</span>
          </Tooltip>
        );
      }
      if(dAddictionValue === '医療連携体制加算Ⅴ１'){
        return (
          <Tooltip title="医療連携体制加算Ⅴ１" arrow>
            <span>Ⅴ</span>
          </Tooltip>
        );
      }
      if(dAddictionValue === '医療連携体制加算Ⅴ２'){
        return (
          <Tooltip title="医療連携体制加算Ⅴ２" arrow>
            <span>Ⅴ</span>
          </Tooltip>
        );
      }
      if(dAddictionValue === '医療連携体制加算Ⅴ３'){
        return (
          <Tooltip title="医療連携体制加算Ⅴ３" arrow>
            <span>Ⅴ</span>
          </Tooltip>
        );
      }
    }
    case "関係機関連携加算": {
      if(dAddictionValue == 1){
        return <span>Ⅰ</span>;
      }
      if(dAddictionValue == 2){
        return <span>Ⅱ</span>;
      }
      if(dAddictionValue == 3){
        return <span>Ⅲ</span>;
      }
      if(dAddictionValue == 4){
        return <span>Ⅳ</span>;
      }
    }
    default: {
      return dAddictionValue;
    }
  }
}

/**
 * 予定データを新規追加するフック
 * @returns {Function} (uid, did, kasanName) => Promise<void>
 */
const useAddSchedule = () => {
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const dateList = useSelector(state => state.dateList);
  const scheduleTemplate = useSelector(state => state.scheduleTemplate);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);

  const addSchedule = async (uid, did, localSchedule, setLocalSchedule, setSnack) => {
    try{
      const uidStr = "UID" + uid;
      const newSch = JSON.parse(JSON.stringify({...localSchedule?.[uidStr] ?? {}}));
      const schService = service || serviceItems[0];
      const didYear = parseInt(did.slice(1, 5));
      const didMonth = parseInt(did.slice(5, 7));
      const didDate = parseInt(did.slice(7, 9));
      const didDateObj = new Date(didYear, didMonth - 1, didDate);
      const offSchool = dateList.find(dateDt => dateDt.date.getTime() === didDateObj.getTime())?.offSchool;
      // 予定データがない場合は利用なしとして新規予定データを作成
      const templateSchDt = scheduleTemplate?.[schService]?.[offSchool ?"schoolOff" :"weekday"];
      // 新規予定データにテンプレートをコピー
      newSch[did] = {...templateSchDt};
      // 利用なしとして保存
      newSch[did].absence = true;
      newSch[did].noUse = true;
      // 更新タイムスタンプを付与
      newSch[did].timestamp = new Date().getTime();
      const params = {
        hid, bid, date: stdDate,
        uid: uidStr,
        partOfSch: {[uidStr]: newSch, modDid: did}
      };
      const res = await sendPartOfScheduleCompt(params);
      if(!res?.data?.result){
        setSnack({msg: '予定の追加に失敗しました。', severity: 'error', id: new Date().getTime()});
        return false;
      }
      setLocalStorageItemWithTimeStamp(bid + "UID"+uid + did, true);
      setRecentUser(uid);
      // ローカルの予定データにのみ作成されたことを示すフラグを付与（このページ以外では使わないパラメータ）
      newSch[did].createdFrom = 'SchUserKasanList';
      setLocalSchedule({...localSchedule, [uidStr]: newSch});
      setSnack({msg: '予定を追加しました。', severity: 'primary', id: new Date().getTime()});
      return true;
    }catch(error){
      setSnack({msg: '予定の追加に失敗しました。', severity: 'error', id: new Date().getTime()});
      return false;
    }
  }

  return addSchedule;
}

/**
 * 指定した加算を削除するフック
 * @returns {Function} (uid, did, kasanName) => Promise<void>
 */
const useDeleteUserDAddiction = (localSchedule, setLocalSchedule, setSnack) => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);

  const deleteUserDAddiction = async (uid, did, kasanName) => {
    const uidStr = "UID" + uid;

    // 対象の加算がない場合は処理を終了
    if (!localSchedule?.[uidStr]?.[did]?.dAddiction?.[kasanName]){
      setSnack({msg: '対象の加算がありません。', severity: 'warning', id: new Date().getTime()});
      return false;
    }
    
    const newSch = JSON.parse(JSON.stringify(localSchedule?.[uidStr]));
    // 指定加算を削除
    delete newSch[did].dAddiction[kasanName];

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
      setSnack({msg: '加算を削除しました。', severity: 'primary', id: new Date().getTime()});
      return true;
    }else{
      setSnack({msg: '加算の削除に失敗しました。', severity: 'error', id: new Date().getTime()});
      return false;
    }
  };

  return deleteUserDAddiction;
};

// スタイル定義
const useStyles = makeStyles({
  AppPage: {
    padding: '0 8px', margin: "84px 0 84px 61.25px",
    '@media (max-width:959px)': {
      margin: '84px 0',
    },
    '& .kasanCount': {
      fontSize: '0.8rem'
    }
  },
  KasanRadioGroup: {
    
  },
  kasanDisplay: {
    '& span': {
      color: teal[800],
      fontWeight: 600,
    },
    '& .sub span': {
      color: grey[500],
    }
  },
  KasanSelectMenu: {
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
  addSchDtConfirmDialog: {
    '& .name': {fontSize: '1.2rem', color: teal[800], fontWeight: 'bold'},
    '& .month': {fontSize: '1.2rem', marginInlineEnd: 2},
    '& .date': {fontSize: '1.2rem', marginInlineEnd: 2},
    '& .attention': {fontSize: '1.2rem', color: red["A700"], fontWeight: 'bold'},
  },
  OptionsWrapper: {
    position: 'sticky', top: 84, padding: '0 20px',
    backgroundColor: '#fff', zIndex: 2,
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
  }
});

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
        const closed = !document.querySelector('#schUserKasanListDispatcher');
        if (closed){
          dispatch(setStore({schedule: {...schedule, ...newSchedule}}));
        }
      }, 100)
    }
  }, [newSchedule, loadingStatus.loaded]);
  return (
    <div id='schUserKasanListDispatcher' style={{display: 'none'}} />
  )
}

const KasanMenuItem = ({value, label, prevKasanValue, handleSave}) => (
  <MenuItem
    value={value}
    onClick={() => handleSave(value)}
  >
    <ListItemIcon style={{ minWidth: 28, marginRight: 8 }}>
      {prevKasanValue===value &&<RadioButtonCheckedIcon style={{color: teal[800]}} fontSize="small" />}
      {prevKasanValue!==value &&<RadioButtonUncheckedIcon style={{color: teal[800]}} fontSize="small" />}
    </ListItemIcon>
    <ListItemText primary={label} />
  </MenuItem>
);

const AddSchDtConfirmDialog = (props) => {
  const users = useSelector(state => state.users);
  const classes = useStyles();
  const {
    cellDt, localSchedule, setLocalSchedule, selectedKasan, setAddSchDtConfirmSkip,
    setUserMenuAnchorEl, setSnack,
    ...dialogProps
  } = props;
  const {open, onClose} = dialogProps;
  const {uid, did="", anchorEl} = cellDt;

  // このコンポーネント内のみで利用する確認画面省略用state
  const [confirmSkip, setConfirmSkip] = useState(false);

  const addSchedule = useAddSchedule();

  const user = users.find(user => user.uid === uid);
  const didYear = parseInt(did.slice(1, 5));
  const didMonth = parseInt(did.slice(5, 7));
  const didDate = parseInt(did.slice(7, 9));
  const didDateObj = new Date(didYear, didMonth - 1, didDate);
  const day = didDateObj.getDay();

  const handleAddSchedule = async() => {
    const res = await addSchedule(uid, did, localSchedule, setLocalSchedule, setSnack);
    if(res){
      setAddSchDtConfirmSkip(confirmSkip);
      setUserMenuAnchorEl(anchorEl);
    }
    onClose();
  }

  return(
    <Dialog
      open={open}
      onClose={() => {onClose(); setSnack({});}}
      className={classes.addSchDtConfirmDialog}
    >
      <DialogTitle>利用なし予定を追加します。</DialogTitle>
      <DialogContent dividers>
        <DialogContentText>
          <span className='name'>{user?.name || "不明な利用者"}</span>さん <span className='month'>{didMonth}</span>月<span className='date'>{didDate}</span>日({DAY_LIST[day]}) に予定が入力されていません。<br />
          {selectedKasan}を追加するには、予定を新規追加する必要があります。<br />
          追加される予定は<span className='attention'> 利用なしとして保存 </span>されます。
        </DialogContentText>
        <DialogContentText>利用なし予定を追加してよろしいですか？</DialogContentText>
        <div style={{textAlign: 'center'}}>
          <FormControlLabel
            control={<Checkbox color="primary" checked={confirmSkip} onChange={e => setConfirmSkip(e.target.checked)} />}
            label="以降この確認を省略"
          />
        </div>
      </DialogContent>
      <DialogActions >
        <Button
          color="secondary"
          variant="contained"
          onClick={() => {onClose(); setSnack({});}}
        >
          キャンセル
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={handleAddSchedule}
        >
          新規追加
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const KasanSelectMenu = (props) => {
  const users = useSelector(state => state.users);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const service = useSelector(state => state.service);
  const classes = useStyles();
  const {
    selectedKasan,
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

  const deleteSchDt = useDeleteSchDt();
  const templateSchDt = useGetScheduleTemplate(uid, did);
  useEffect(() => {
    // メニューが開いている場合は処理を終了
    if(userMenuAnchorEl) return;
    // セルの情報がない場合は処理を終了
    if(!cellDt.uid || !cellDt.did) return;
    const sch = localSchedule?.[uidStr];
    // 予定データがない場合は処理を終了
    if(!sch) return;
    const schDt = sch?.[did];
    if(!schDt) return;
    // 予定データが作成されたページがこのページでない場合は処理を終了
    if(schDt.createdFrom !== 'SchUserKasanList') return;
    const dAddiction = schDt?.dAddiction ?? {};
    const templateDAddiction = templateSchDt?.dAddiction ?? {};
    // dAddictionとtemplateDAddictionが異なる場合は処理を続行
    if(JSON.stringify(dAddiction) !== JSON.stringify(templateDAddiction)) return;
    deleteSchDt(uid, did, sch).then(({result, newSch}) => {
      if(!result) throw new Error("予定の削除に失敗しました。");
      setLocalSchedule({...localSchedule, [uidStr]: newSch});
      setSnack({msg: '加算未入力のため新規予定を削除しました。', severity: 'warning', id: new Date().getTime()});
    }).catch(error => {
      console.error("KasanSelectMenu useEffect error", error);
      setSnack({msg: '予定の削除に失敗しました。', severity: 'error', id: new Date().getTime()});
    });
  }, [userMenuAnchorEl]);

  const kasanOptions = getAddictionOption(selectedKasan, stdDate, service).map(prevKasan => (
    checkValueType(prevKasan, 'Object') ?prevKasan :{ value: prevKasan, label: prevKasan }
  ));

  const handleClose = () => {
    setUserMenuAnchorEl(null);
    setEditingCell({});
  };

  const handleSave = async(value) => {
    try{
      if(value==="" && !localSchedule?.[uidStr]?.[did]?.dAddiction?.[selectedKasan]){
        // 未選択かつ元々加算がない場合は処理を終了
        setSnack({});
        handleClose();
        return;
      }
      const newSch = JSON.parse(JSON.stringify({...localSchedule?.[uidStr] ?? {}}));
      const newSchDt = newSch[did];
      if(!newSchDt.dAddiction) newSchDt.dAddiction = {};
      if(value){
        // valueがある場合は加算を設定
        newSchDt.dAddiction[selectedKasan] = value;
      }else{
        // valueがない場合は加算を削除
        delete newSchDt.dAddiction[selectedKasan];
      }
      // 新規追加時のフラグを削除
      if(newSchDt.createdFrom === 'SchUserKasanList') delete newSchDt.createdFrom;
      newSchDt.timestamp = new Date().getTime();
      const params = {
        hid, bid, date: stdDate,
        uid: uidStr,
        partOfSch: {[uidStr]: newSch, modDid: did}
      };
      const res = await sendPartOfScheduleCompt(params);
      if(!res?.data?.result) throw new Error("加算の変更に失敗しました。");
      setLocalSchedule({...localSchedule, [uidStr]: newSch});
      setLocalStorageItemWithTimeStamp(bid + "UID"+uid + did, true);
      setRecentUser(uid);
      setSnack({msg: '加算を変更しました。', severity: 'primary', id: new Date().getTime()});
      handleClose();
    }catch(error){
      console.error("handleSave error", error);
      setSnack({msg: '加算の変更に失敗しました。', severity: 'error', id: new Date().getTime()});
    }
  }

  const prevKasanValue = localSchedule?.[uidStr]?.[did]?.dAddiction?.[selectedKasan] ?? "";
  return(
    <Menu
      anchorEl={userMenuAnchorEl}
      keepMounted
      open={Boolean(userMenuAnchorEl)}
      onClose={() => {handleClose(); setSnack({});}}
      getContentAnchorEl={null}
      anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
      transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      className={classes.KasanSelectMenu}
    >
      <div className="userInfo">
        <div>{user?.name || "不明な利用者"}さん</div>
        <div>{didMonth}月{didDate}日({DAY_LIST[day]})</div>
        <div>{shortWord(selectedKasan)}</div>
      </div>
      <KasanMenuItem
        value=""
        label="未選択"
        prevKasanValue={prevKasanValue}
        handleSave={handleSave}
      />
      {kasanOptions.map(({value, label}) => (
        <KasanMenuItem
          key={`menuItem-${uidStr}-${did}-${label}`}
          value={value}
          label={label}
          prevKasanValue={prevKasanValue}
          handleSave={handleSave}
        />
      ))}
    </Menu>
  )
}

const KasanRadioGroup = (props) => {
  const classes = useStyles();
  const {selectedKasan, setSelectedKasan} = props;
  return(
    <div className={classes.KasanRadioGroup}>
      <RadioGroup
        value={selectedKasan}
        onChange={e => setSelectedKasan(e.target.value)}
        row
      >
        {KASAN_LIST.map(prevKasan => (
          <FormControlLabel
            key={prevKasan}
            value={prevKasan}
            control={<Radio color='primary' />}
            label={shortWord(prevKasan)}
          />
        ))}
      </RadioGroup>
    </div>
  )
}

const SchUserKasanList = () => {
  const classes = useStyles();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {schedule, users, service, classroom, dateList} = allState;

  // dispatchを使わないようにするためにstoreのscheduleをlocalScheduleにコピーするためのstate
  const [localSchedule, setLocalSchedule] = useState(null);
  // 選択されている加算のstate
  const [selectedKasan, setSelectedKasan] = useSessionStorageState(KASAN_LIST[0], "SchUserKasanList_kasan");
  const [cellDt, setCellDt] = useState({});
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  // 編集中のセルのstate
  const [editingCell, setEditingCell] = useState({});
  // スナックメッセージのstate
  const [snack, setSnack] = useState({});
  // 新規予定追加確認用のダイアログ関係state
  const [addSchDtConfirmDialogOpen, setAddSchDtConfirmDialogOpen] = useState(false);
  // 新規予定追加時の確認画面をスキップするかどうかのstate
  const [addSchDtConfirmSkip, setAddSchDtConfirmSkip] = useSessionStorageState(false, "SchUserKasanList_addSchDtConfirmSkip");

  // 指定利用者の指定日付の指定加算を削除するフック
  const deleteUserDAddiction = useDeleteUserDAddiction(localSchedule, setLocalSchedule, setSnack);

  // 予定を新規追加する処理
  const addSchedule = useAddSchedule();

  useEffect(()=>{
    if(!loadingStatus.loaded) return;
    // storeデータが読み込み終わったらstoreのscheduleをlocalScheduleにコピー
    setLocalSchedule(schedule);
  }, [loadingStatus.loaded]);

  // ストアデータのロード待ち
  if(!loadingStatus.loaded || !localSchedule) return(<LoadingSpinner />);

  const filteredUsers = getFilteredUsers(users, service, classroom);
  const filteredSchedule = getFilteredSchedule(localSchedule, selectedKasan, filteredUsers, service, classroom);

  // カレンダーへ渡す表示用データ
  const data = filteredUsers.reduce((prevData, user) => {
    const uidStr = `UID${user.uid}`;
    if(!prevData[uidStr]) prevData[uidStr] = {};
    const sch = filteredSchedule[uidStr] ?? {};
    Object.entries(sch).forEach(([did, schDt]) => {
      if(!prevData[uidStr][did]) prevData[uidStr][did] = {};
      const kasanValue = schDt?.dAddiction?.[selectedKasan] ?? "";
      let subSelectedKasan = "", subKasanValue = "";
      if(selectedKasan === "家族支援加算Ⅰ"){
        subSelectedKasan = "家族支援加算Ⅱ";
        subKasanValue = schDt?.dAddiction?.["家族支援加算Ⅱ"] ?? "";
      }else if(selectedKasan === "家族支援加算Ⅱ"){
        subSelectedKasan = "家族支援加算Ⅰ";
        subKasanValue = schDt?.dAddiction?.["家族支援加算Ⅰ"] ?? "";
      }
      if(
        (!kasanValue && !subKasanValue)
        || (schDt.absence && !kessekiSvc.includes(selectedKasan) && !kessekiSvc.includes(subSelectedKasan))
      ){
        // 加算項目がない場合は削除アイコンを表示
        prevData[uidStr][did].cellNode = (<div><RemoveIcon style={{color: grey[500]}} /></div>);
      }else{
        // 加算項目がある場合は値を表示
        const displayValue = convDAddictionValueToDisplayValue(selectedKasan, kasanValue);
        const subDisplayValue = convDAddictionValueToDisplayValue(subSelectedKasan, subKasanValue);
        prevData[uidStr][did].cellNode = (
          <div className={classes.kasanDisplay}>
            {Boolean(kasanValue) &&displayValue}
            {Boolean(subKasanValue) &&(
              <div className='sub' style={{marginTop: displayValue&&subDisplayValue ?4 :0}}>
                {subDisplayValue}
              </div>
            )}
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
    if(!prevUidOption[uidStr]) prevUidOption[uidStr] = {};
    // 利用者ごとの加算の回数関係のデータを取得
    const kasanCount = countAddictionLimit({
      schedule:localSchedule, uid, addictionName: selectedKasan, service, users: filteredUsers
    });
    // 加算回数オーバー判定
    const isLimitOver = kasanCount.limit>0 && kasanCount.count>kasanCount.limit;
    prevUidOption[uidStr].optionNode = (
      <div
        className='kasanCount'
        style={{
          color: isLimitOver ?red["A700"] :null,
          fontWeight: isLimitOver ?'bold' :null
        }}
      >
        {kasanCount.count}
        {Boolean(kasanCount.limit) &&(`/${kasanCount.limit}`)}
      </div>
    );
    return prevUidOption;
  }, {});

  // カレンダーの日毎の加算回数表示用データ
  const didOption = dateList.reduce((prevDidOption, dateDt) => {
    const did = convDid(dateDt.date);
    if(!prevDidOption[did]) prevDidOption[did] = {};
    const kasanCount = Object.values(filteredSchedule).filter(sch => {
      const schDt = sch?.[did];
      if(!schDt) return false;
      // 選択した加算がない場合は対象外
      if(!schDt?.dAddiction?.[selectedKasan]) return false;
      // 欠席かつ選択した加算が欠席時に利用できる加算ではない場合は対象外
      if(schDt.absence && !kessekiSvc.includes(selectedKasan)) return false;
      return true;
    }).length;
    prevDidOption[did].optionNode = (<div className='kasanCount'>{kasanCount}</div>);
    return prevDidOption;
  }, {});

  const handleEdit = async(e, uid, did) => {
    setSnack({});
    const anchorEl = e.currentTarget;
    // セルの情報を格納
    setCellDt({uid, did, anchorEl});
    // 編集中のセル情報を格納
    setEditingCell({uid, did});
    // 利用なし対応加算かつ予定がない場合は新規予定追加確認ダイアログを表示
    if(!filteredSchedule?.["UID"+uid]?.[did]){
      const isKessekiSvc = kessekiSvc.includes(selectedKasan);
      if(!isKessekiSvc){
        // 「予定がない」かつ利用なし対応加算ではない場合はエラーメッセージを表示して処理を終了
        setSnack({msg: '利用予定がないため加算を追加できません。', severity: 'warning', id: new Date().getTime()});
        setEditingCell({});
        return;
      }
      if(!addSchDtConfirmSkip){
        // 予定追加確認画面を表示する。
        setAddSchDtConfirmDialogOpen(true);
        return;
      }
      // 直接予定を追加
      const res = await addSchedule(uid, did, localSchedule, setLocalSchedule, setSnack);
      if(!res){
        setCellDt({});
        setEditingCell({});
        return;
      }
    }
    setUserMenuAnchorEl(anchorEl);
  }

  return (
    <>
    <LinksTab menu={menu} menuFilter={(date)=>makeSchMenuFilter(date)} extMenu={extMenu} />
    <div className={classes.AppPage}>
      <div className={classes.OptionsWrapper}>
        <KasanRadioGroup
          selectedKasan={selectedKasan}
          setSelectedKasan={setSelectedKasan}
        />
        <ChangePageButtons />
      </div>
      <SchUsersCalendar
        data={data}
        uidOption={uidOption}
        didOption={didOption}
        stickyTop={120}
        handleDelete={(e, uid, did) => deleteUserDAddiction(uid, did, selectedKasan, localSchedule)}
        handleEdit={handleEdit}
        editingCell={editingCell}
      />
    </div>
    <KasanSelectMenu
      selectedKasan={selectedKasan}
      localSchedule={localSchedule} setLocalSchedule={setLocalSchedule}
      cellDt={cellDt}
      userMenuAnchorEl={userMenuAnchorEl} setUserMenuAnchorEl={setUserMenuAnchorEl}
      setEditingCell={setEditingCell}
      setSnack={setSnack}
    />
    <AddSchDtConfirmDialog
      open={addSchDtConfirmDialogOpen}
      onClose={() => {setAddSchDtConfirmDialogOpen(false); setEditingCell({});}}
      cellDt={cellDt}
      localSchedule={localSchedule} setLocalSchedule={setLocalSchedule}
      selectedKasan={selectedKasan}
      addSchDtConfirmSkip={addSchDtConfirmSkip} setAddSchDtConfirmSkip={setAddSchDtConfirmSkip}
      setUserMenuAnchorEl={setUserMenuAnchorEl}
      setSnack={setSnack}
    />
    <SnackMsg {...snack} />
    <ScheduleDispatcher newSchedule={localSchedule} />
    </>
  )
}
export default SchUserKasanList;