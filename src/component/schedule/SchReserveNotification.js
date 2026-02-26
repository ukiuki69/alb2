import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { makeStyles, Box, Typography, Dialog, DialogTitle, DialogContent, IconButton, Menu, MenuItem, Button, Radio, RadioGroup, FormControlLabel, FormControl } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import SettingsIcon from '@material-ui/icons/Settings';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import ListAltIcon from '@material-ui/icons/ListAlt';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import CheckIcon from '@material-ui/icons/Check';
import { didPtn, PERMISSION_DEVELOPER, uidsPtn } from '../../modules/contants';
import { blue, red, teal, orange, grey } from '@material-ui/core/colors';
import * as Actions from '../../Actions';
import { univApiCall, setRecentUser } from '../../albCommonModule';
import { permissionCheckTemporary } from '../../modules/permissionCheck';

const useStyles = makeStyles((theme) => ({
  container: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%) translateY(100px)',
    // zIndex: 100,
    cursor: 'pointer',
    padding: '6px 12px 6px 24px', // 右側のパディングを調整
    textAlign: 'center',
    transition: 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1), background-color 0.3s',
    borderRadius: '4px',  
    boxShadow: theme.shadows[6],
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  barIconButton: {
    padding: '8px',
    color: 'inherit',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  visible: {
    transform: 'translateX(-50%) translateY(0)',
  },
  today: {
    backgroundColor: red[600],
    color: '#ffffff',
  },
  future: {
    backgroundColor: blue[800],
    color: '#ffffff',
  },
  dialogPaper: {
    minWidth: '240px',
    maxWidth: '60vw',
    margin: '12px',
  },
  userSection: {
    paddingBottom: '12px',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minWidth: 'max-content',
    borderBottom: `1px solid rgba(0, 0, 0, 0.06)`, // ヘッダよりさらに控えめな線
    '&:last-child': {
      marginBottom: 0,
      paddingBottom: 0,
      borderBottom: 'none',
    },
  },
  userInfo: {
    flexGrow: 1,
    marginRight: '16px',
  },
  userName: {
    fontSize: '1rem',
    marginBottom: '4px',
  },
  dateList: {
    fontSize: '0.9rem',
    paddingLeft: '0px',
    paddingRight: '24px',
    whiteSpace: 'nowrap',
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  menuIcon: {
    color: teal[500],
    marginRight: theme.spacing(1),
  },
  moreButton: {
    padding: '4px',
    marginTop: '-4px',
  },
  settingDialogContent: {
    padding: theme.spacing(3),
    minWidth: '300px',
  },
  settingsDialogPaper: {
    overflow: 'visible',
    minWidth: '300px',
    position: 'relative',
  },
  settingsCloseButton: {
    position: 'absolute',
    right: -10,
    top: -10,
    backgroundColor: blue[600],
    color: '#ffffff',
    boxShadow: theme.shadows[2],
    '&:hover': {
      backgroundColor: blue[700],
    },
    zIndex: 1501, // ダイアログより上に表示
  },
  noticeList: {
    marginTop: '8px',
    paddingLeft: '12px', // 左側の余白を広げてインデントを強調
    borderLeft: `2px solid ${grey[200]}`,
  },
  noticeItem: {
    fontSize: '0.85rem',
    color: grey[700],
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '2px',
    maxWidth: '400px', // 全体の最大幅
  },
  noticeDay: {
    minWidth: '2.5rem',
    textAlign: 'right',
    flexShrink: 0,
  },
  noticeText: {
    flexGrow: 1,
    wordBreak: 'break-all',
    maxWidth: '300px', // コメントの最大幅
    paddingRight: '24px', // 右側に余白を設けてインデント感を出す
  },
}));

const MAX_DISPLAY_DATES = 9;
const SHORT_DISPLAY_DAYS_COUNT = 7;

const SchReserveNotification = ({ schedule: sch, setSch }) => {
  const classes = useStyles();
  const history = useHistory();
  const dispatch = useDispatch();
  const storeSchedule = useSelector((state) => state.schedule);
  const dateList = useSelector((state) => state.dateList);
  const account = useSelector((state) => state.account);
  const users = useSelector((state) => state.users);
  const hid = useSelector((state) => state.hid);
  const bid = useSelector((state) => state.bid);
  const stdDate = useSelector((state) => state.stdDate);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUser, setMenuUser] = useState(null);
  const [show, setShow] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [notificationInterval, setNotificationInterval] = useState(() => {
    const saved = localStorage.getItem('reserve_notification_interval');
    return saved ? parseInt(saved) : 0;
  });
  const [tempInterval, setTempInterval] = useState(notificationInterval);

  const targetSch = sch || storeSchedule;

  const { reserveData, hasTodayReserve, hasFutureReserve, currentMaxTimestamp } = React.useMemo(() => {
    if (!targetSch || !users) return { reserveData: [], hasTodayReserve: false, hasFutureReserve: false, currentMaxTimestamp: 0 };

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayDid = `D${y}${m}${d}`;

    let hasTodayReserve = false;
    let hasFutureReserve = false;
    let currentMaxTimestamp = 0;
    const reserveData = [];

    // uidsPtnにマッチするキーのみを抽出してループ
    const uids = Object.keys(targetSch).filter(k => uidsPtn.test(k));

    uids.forEach((uidKey) => {
      const userSch = targetSch[uidKey];
      if (!userSch || typeof userSch !== 'object') return;

      const reservedDates = [];
      // didPtnにマッチするキーのみを抽出してソート
      const dids = Object.keys(userSch).filter(k => didPtn.test(k)).sort();

      dids.forEach((did) => {
        const dayData = userSch[did];
        // reserveが真であることを確認
        if (dayData && dayData.reserve) {
          // 最大タイムスタンプの更新
          if (dayData.timestamp && dayData.timestamp > currentMaxTimestamp) {
            currentMaxTimestamp = dayData.timestamp;
          }

          const datePart = did.substring(0, 9); // D20251225
          if (datePart >= todayDid) {
            const formattedDay = parseInt(datePart.substring(7, 9));
            
            // dateListから該当日の情報を取得（自差の影響を受けないよう文字列で比較）
            const dateInfo = dateList?.find(d => {
              const dt = new Date(d.date);
              const y = dt.getFullYear();
              const m = String(dt.getMonth() + 1).padStart(2, '0');
              const dStr = String(dt.getDate()).padStart(2, '0');
              return `D${y}${m}${dStr}` === datePart;
            });

            reservedDates.push({
              day: formattedDay,
              holiday: dateInfo ? dateInfo.holiday : 0,
              userNotice: dayData.userNotice
            });
            
            if (datePart === todayDid) {
              hasTodayReserve = true;
            } else {
              hasFutureReserve = true;
            }
          }
        }
      });

      if (reservedDates.length > 0) {
        const uidStr = uidKey.replace('UID', '');
        const uid = parseInt(uidStr);
        // 型の違いを許容してユーザーを特定
        const user = users.find((u) => u.uid == uid || u.uid == uidStr);
        if (user) {
          reserveData.push({
            uid: uid,
            name: user.name,
            dates: reservedDates,
            sindex: Number(user.sindex || 0),
          });
        }
      }
    });

    // sindex順にソート
    reserveData.sort((a, b) => a.sindex - b.sindex);

    return { reserveData, hasTodayReserve, hasFutureReserve, currentMaxTimestamp };
  }, [targetSch, users, dateList]);

  React.useEffect(() => {
    const lastShown = localStorage.getItem('reserve_notification_last_shown');
    const lastMaxTimestamp = localStorage.getItem('reserve_notification_last_max_timestamp');
    const now = new Date().getTime();
    
    let shouldShow = false;

    // 1. 新着チェック (タイムスタンプ)
    if (currentMaxTimestamp > 0 && (!lastMaxTimestamp || currentMaxTimestamp > parseInt(lastMaxTimestamp))) {
      shouldShow = true;
    }

    // 2. インターバルチェック (新着がない場合のみ)
    if (!shouldShow && notificationInterval > 0) {
      const intervalMs = notificationInterval * 60 * 60 * 1000;
      if (!lastShown || now - parseInt(lastShown) >= intervalMs) {
        shouldShow = true;
      }
    } else if (!shouldShow && notificationInterval === 0) {
      shouldShow = true;
    }

    if (shouldShow) {
      const timer = setTimeout(() => {
        setShow(true);
        localStorage.setItem('reserve_notification_last_shown', new Date().getTime().toString());
        if (currentMaxTimestamp > 0) {
          localStorage.setItem('reserve_notification_last_max_timestamp', currentMaxTimestamp.toString());
        }
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notificationInterval, currentMaxTimestamp]);

  if (!targetSch || !users) return null;

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const todayDid = `D${y}${m}${d}`;

  if (!hasTodayReserve && !hasFutureReserve) {
    return null;
  }

  const handleOpen = () => setOpen(true);
  const handleClose = (e) => {
    if (e) e.stopPropagation();
    setOpen(false);
  };

  const handleMenuClick = (event, data) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuUser(data);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const handleNavigateToListInput = () => {
    if (menuUser) {
      setRecentUser(String(menuUser.uid));
      history.push(`/schedule/listinput/peruser/${menuUser.uid}/`);
      handleMenuClose();
      setOpen(false);
    }
  };

  const handleNavigateToUserSch = () => {
    if (menuUser) {
      setRecentUser(String(menuUser.uid));
      history.push(`/schedule/users/${menuUser.uid}/`);
      handleMenuClose();
      setOpen(false);
    }
  };

  const handleMarkAllAsPresent = async () => {
    if (menuUser) {
      setRecentUser(String(menuUser.uid));
      const uidKey = `UID${menuUser.uid}`;
      const userSch = targetSch[uidKey];
      if (userSch) {
        const newSch = JSON.parse(JSON.stringify(targetSch));
        const dids = Object.keys(userSch).filter(k => didPtn.test(k));
        
        let changed = false;
        const sendData = { [uidKey]: {} };
        const timestamp = new Date().getTime();

        dids.forEach(did => {
          const dayData = userSch[did];
          if (dayData && dayData.reserve) {
            const datePart = did.substring(0, 9);
            if (datePart >= todayDid) {
              const updatedDay = { ...newSch[uidKey][did] };
              
              // プロパティの削除
              delete updatedDay.reserve;
              delete updatedDay.absence;
              
              // タイムスタンプの更新と付与
              updatedDay.timestamp = timestamp;
              updatedDay.reserveFixedTimestamp = timestamp;
              
              newSch[uidKey][did] = updatedDay;
              sendData[uidKey][did] = updatedDay;
              changed = true;
            }
          }
        });

        if (changed) {
          try {
            // API経由でデータ伝送
            const sendParams = {
              a: "sendPartOfData",
              table: "ahdschedule",
              column: "schedule",
              hid, bid, date: stdDate,
              partOfData: JSON.stringify(sendData)
            };
            const res = await univApiCall(sendParams);
            
            if (res?.data?.result) {
              // Storeにdispatch
              // 確実にuidKeyの下に更新データが入るように念のためマージ方法を厳記
              const updatedSchedule = { 
                ...targetSch, 
                [uidKey]: newSch[uidKey] 
              };
              dispatch(Actions.setStore({ schedule: updatedSchedule }));
              // 画面上の編集用データも更新（渡されている場合）
              if (setSch) {
                setSch(updatedSchedule);
              }
            }
          } catch (error) {
            console.error("Failed to update schedule:", error);
          }
        }
      }
      handleMenuClose();
      setOpen(false);
    }
  };
  const handleSettingsClick = (e) => {
    e.stopPropagation();
    setTempInterval(notificationInterval);
    setOpenSettings(true);
  };

  const handleSettingsClose = () => {
    setOpenSettings(false);
  };

  const handleIntervalChange = (event) => {
    setTempInterval(parseInt(event.target.value));
  };

  const handleSaveSettings = () => {
    setNotificationInterval(tempInterval);
    localStorage.setItem('reserve_notification_interval', tempInterval.toString());
    setOpenSettings(false);
  };

  const marks = [
    { value: 0, label: '毎回' },
    { value: 1, label: '1時間' },
    { value: 2, label: '2時間' },
    { value: 4, label: '4時間' },
    { value: 8, label: '8時間' },
    { value: 24, label: '24時間' },
  ];

  const handleCloseBar = (e) => {
    e.stopPropagation();
    setIsClosed(true);
  };

  if (!permissionCheckTemporary(PERMISSION_DEVELOPER, account)) return null;
  if (isClosed) return null;

  return (
    <>
      <Box
        className={`${classes.container} ${hasTodayReserve ? classes.today : classes.future} ${show ? classes.visible : ''}`}
        onClick={handleOpen}
        style={{ cursor: 'pointer', userSelect: 'none' }}
      >
        <Typography variant="body2" style={{ fontSize: '0.8rem' }}>
          予約・キャンセル待ちがあります
        </Typography>
        <div style={{ display: 'flex', marginLeft: 'auto' }}>
          <IconButton className={classes.barIconButton} onClick={handleSettingsClick}>
            <SettingsIcon fontSize="small" />
          </IconButton>
          <IconButton 
            className={classes.barIconButton} onClick={handleCloseBar}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        classes={{ paper: classes.dialogPaper }}
        style={{ zIndex: 1500 }}
        maxWidth={false}
      >
        <DialogTitle>
          予約リスト
          <IconButton className={classes.closeButton} onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {reserveData.map((data, index) => (
            <div key={index} className={classes.userSection}>
              <div className={classes.userInfo}>
                <div className={classes.userName}>{data.name}</div>
                <div className={classes.dateList}>
                  {data.dates.length <= MAX_DISPLAY_DATES ? (
                    data.dates.map((dObj, i) => (
                      <span key={i} style={{ 
                        color: dObj.holiday === 1 ? orange[600] : dObj.holiday === 2 ? grey[400] : teal[600],
                        marginRight: '6px'
                      }}>
                        {dObj.day}
                      </span>
                    ))
                  ) : (
                    <>
                      {data.dates.slice(0, SHORT_DISPLAY_DAYS_COUNT).map((dObj, i) => (
                        <span key={i} style={{ 
                          color: dObj.holiday === 1 ? orange[600] : dObj.holiday === 2 ? grey[400] : teal[600],
                          marginRight: '6px'
                        }}>
                          {dObj.day}
                        </span>
                      ))}
                      {`...全${data.dates.length}件`}
                    </>
                  )}
                </div>
                {data.dates.some(d => d.userNotice) && (
                  <div className={classes.noticeList}>
                    {data.dates.filter(d => d.userNotice).map((dObj, i) => (
                      <div key={i} className={classes.noticeItem}>
                        <span 
                          className={classes.noticeDay}
                          style={{ color: dObj.holiday === 1 ? orange[600] : dObj.holiday === 2 ? grey[400] : teal[600] }}
                        >
                          {dObj.day}日
                        </span>
                        <span className={classes.noticeText}>{dObj.userNotice}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <IconButton 
                className={classes.moreButton}
                onClick={(e) => handleMenuClick(e, data)}
              >
                <MoreHorizIcon />
              </IconButton>
            </div>
          ))}
        </DialogContent>
      </Dialog>

      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        style={{ zIndex: 1600 }}
      >
        <MenuItem onClick={handleNavigateToListInput}>
          <ListAltIcon className={classes.menuIcon} />
          利用者別一覧入力へ
        </MenuItem>
        <MenuItem onClick={handleNavigateToUserSch}>
          <PersonAddIcon className={classes.menuIcon} />
          利用者別予定へ
        </MenuItem>
        <MenuItem onClick={handleMarkAllAsPresent}>
          <CheckIcon className={classes.menuIcon} />
          全て出席にする
        </MenuItem>
      </Menu>

      <Dialog 
        open={openSettings} 
        onClose={handleSettingsClose}
        classes={{ paper: classes.settingsDialogPaper }}
        style={{ zIndex: 1600 }}
      >
        <IconButton 
          className={classes.settingsCloseButton} onClick={handleSettingsClose} size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
        <DialogTitle>通知の設定</DialogTitle>
        <DialogContent className={classes.settingDialogContent}>
          <Typography variant="body2" gutterBottom>
            予約がある時にお知らせを表示する間隔を設定できます。
          </Typography>
          <Typography variant="body2" style={{marginTop: '16px' }}>
            {tempInterval === 0 
              ? "画面を開くたびに、すぐにお知らせします。" 
              : `一度表示した後は、${tempInterval}時間経つまで次のお知らせを表示しません。`}
          </Typography>
          <FormControl component="fieldset" style={{ marginTop: '24px', width: '100%' }}>
            <RadioGroup
              aria-label="notification-interval"
              name="notification-interval"
              value={String(tempInterval)}
              onChange={handleIntervalChange}
              row
            >
              {marks.map((mark) => (
                <FormControlLabel
                  key={mark.value}
                  value={String(mark.value)}
                  control={<Radio color="primary" />}
                  label={mark.label}
                  style={{ marginRight: '16px' }}
                />
              ))}
            </RadioGroup>
          </FormControl>
          <Typography variant="caption" display="block" style={{ marginTop: '16px', color: grey[600] }}>
            ※「毎回」にすると、画面を新しく開くたびに必ず表示されます。<br />
            ※パソコン作業の邪魔になる場合は、時間を長く設定してください。
          </Typography>
          <Box textAlign="right" mt={3}>
            <Button onClick={handleSaveSettings} color="primary" variant="contained">
              設定
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SchReserveNotification;

