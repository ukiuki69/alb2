import React, {useEffect, useState, useRef, forwardRef} from 'react';
import { useSelector } from 'react-redux';
import { getLodingStatus, getUser, shortWord, getCookeis } from '../../commonModule';
import { LoadingSpinner, LoadErr, LinksTab } from '../common/commonParts';
import { HOHOU } from '../../modules/contants';
import { getFilteredUsers, recentUserStyle, univApiCall } from '../../albCommonModule';
import { planMenu, navigateToPlanAdd, PlanOverlay } from './planCommonPart';
import { useAutoScrollToRecentUser } from '../common/useAutoScrollToRecentUser';
import { teal, blue, brown, orange, yellow, cyan, green, lime, purple, grey, red } from '@material-ui/core/colors';
import { Button, colors, makeStyles, Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, Tooltip, IconButton, useMediaQuery } from '@material-ui/core';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import SnackMsgSingle from '../common/SnackMsgSingle';
import { useHistory } from 'react-router-dom';
import { getLS, setLS } from '../../modules/localStrageOprations';
import { planlsUid } from './planConstants';
import { getPlanItemAttr, PlanItemBadge, comparePlanItems, PlanUserExpiryBadge } from './PlanItemShared';
import { usePlanExpiry } from './usePlanExpiry';
import { hideSideToolBar, showSideToolBar } from '../../modules/uiEvents';
import PlanOutsideNotify from './PlanOutsideNotify';
import { DispNameWithAttr } from '../Users/Users';
import AssessmentIcon from '@material-ui/icons/Assessment';
import PersonIcon from '@material-ui/icons/Person';
import BuildIcon from '@material-ui/icons/Build';
import MeetingRoomIcon from '@material-ui/icons/MeetingRoom';
import TimelineIcon from '@material-ui/icons/Timeline';
import AddCircleIcon from '@material-ui/icons/AddCircle';

const useStyles = makeStyles({
  userNameDispWithEdit: {
    position: 'relative',
    '& > a': {
      display: 'flex', position :'absolute', top:0, bottom: 0, left:0, right: 0,
      paddingRight: 8,
      justifyContent: 'right', alignItems: 'center',
      '& .MuiSvgIcon-root':{
        fontSize: 16, opacity: .4, color: grey[600],
        transition: 'all 0.3s ease',
      },
      '&:hover .MuiSvgIcon-root': {
        fontSize: 24, opacity: .8, color: teal[800],
      },
    },
  },
  root: {
    width: 'calc(95vw - 62px)',
    minWidth: 900,
    marginTop: 120,
    marginLeft: 'calc(2.5vw + 62px)',
  },
  userList: {
    width: '100%',
    '& .userRow': {
      display: 'flex',
      borderBottom: '1px solid #e0e0e0',
      alignItems: 'stretch', // ←ここをcenterに戻す
      '&:hover:not(.sticky)': {
        backgroundColor: '#f5f5f5',
        zIndex: -3,
        '& > div': {
          zIndex: 1, // hover時は正の値にして表示されるようにする
        }
      },
      '& > div': {
        padding: '8px 0px',
        zIndex: -1,
      }
    },
    '& .userRow.sticky': {
      padding: '8px 16px',
      position: 'sticky',
      top: 100,
      zIndex: 3,
      background: teal[50],
      borderBottom: `1px solid ${teal[200]}`,
      '& .month-nav-button': {
        position: 'absolute',
        top: '20%',
        transform: 'translateY(-50%)',
        opacity: 0,
        transition: 'opacity 0.3s',
        backgroundColor: blue[700],
        color: '#fff',
        padding: '8px 8px',
        fontSize: '0.7rem',
        minWidth: 'auto',
        zIndex: 5,
        '&:hover': {
            backgroundColor: blue[900],
            opacity: 1,
        }
      },
      '&:hover .month-nav-button': {
        opacity: .4,
      },
      '&::before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        top: -16,
        left: 0,
        width: '100%',
        height: 16,
        background: '#fff',
        zIndex: 3,
      },
      '& .month-nav-button.prev-button-1m': {
        left: '120px',
      },
      '& .month-nav-button.prev-button-3m': {
        left: '256px',
      },
      '& .month-nav-button.next-button-1m': {
        right: '120px',
      },
      '& .month-nav-button.next-button-3m': {
        right: '16px',
      },
    },
    '& .noTitle': {width: '40px'},
    '& .no': {
      width: '40px',
      textAlign: 'center',
      '& .noInner': {
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      // height: '100%',    // ←不要
      // display: 'flex',   // ←不要
      // alignItems: 'center', // ←不要
      // justifyContent: 'center', // ←不要
    },
    '& .name': {width: '200px',
      '& .nameInner': {
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: 8,
      },
    },
    '& .service': {width: '60px',
      '& .serviceInner': {
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: 8,
        fontSize: '0.8rem',
        fontWeight: 'bold',
      },
    },
    '& .monthHeader': {
      flex: 1,
      textAlign: 'center',
    },
    '& .monthCell': {
      flex: 1,
      textAlign: 'center',
      minHeight: '2em',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
    },
  },
  planItem: {
    borderRadius: '2px',
    margin: '2px 4px',
    padding: '2px 4px',
    fontSize: '0.75rem',
    textAlign: 'center',
    boxShadow: '0 0 2px 0 rgba(0, 0, 0, 0.4)',
  },

  // ─── スマホ用スタイル ─────────────────────────────────────────────────────
  spWrapper: {
    width: '100%',
    maxWidth: '100vw',
    marginTop: 64,
    overflowX: 'hidden',
    boxSizing: 'border-box',
    paddingBottom: 24,
  },
  spSectionHeader: {
    position: 'sticky',
    top: 56,
    backgroundColor: teal[50],
    borderBottom: `1px solid ${teal[200]}`,
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
    boxSizing: 'border-box',
  },
  spUserRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: `1px solid ${grey[200]}`,
    cursor: 'pointer',
    boxSizing: 'border-box',
    '&:hover': {
      backgroundColor: grey[50],
    },
  },
  spUserNameArea: {
    flex: 1,
    minWidth: 0,
  },
  spDocItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    borderBottom: `1px solid ${grey[200]}`,
    cursor: 'pointer',
    boxSizing: 'border-box',
    gap: 8,
    '&:hover': {
      backgroundColor: grey[50],
    },
  },
  spDocDate: {
    fontSize: '0.78rem',
    color: grey[500],
    marginLeft: 'auto',
    flexShrink: 0,
  },
});

const normalizeMonth = (value, fallback) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : fallback;
};

const TIMELINE_GAP_THRESHOLD = 12; // この月数以上の空白を省略表示
const TIMELINE_STUB_W = 8; // 省略区間の端に表示するスタブ線のpx幅
const TIMELINE_GAP_PX = 32; // 省略区間に割り当てる固定px幅（スタブ線×2＋空白16px）

const PlanDateRangeNav = ({ dateAria, curMonth, onNavigate }) => {
  if (!dateAria || dateAria.length < 2) return null;

  const sorted = [...new Set(dateAria.map(d => d?.yyyymm ?? String(d).slice(0, 7)))].filter(d => d && d !== '0000-00' && !d.startsWith('0000')).sort();
  if (sorted.length < 2) return null;

  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];

  const toIdx = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    return y * 12 + m;
  };
  const curYM = curMonth?.slice(0, 7) ?? '';

  // 12ヶ月超の空白でクラスターに分割
  const clusters = [];
  let cur = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (toIdx(sorted[i]) - toIdx(sorted[i - 1]) > TIMELINE_GAP_THRESHOLD) {
      clusters.push(cur);
      cur = [sorted[i]];
    } else {
      cur.push(sorted[i]);
    }
  }
  clusters.push(cur);

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 12, overflow: 'visible' }}>
      <span style={{ flexShrink: 0, fontSize: '0.7rem', color: blue[500], whiteSpace: 'nowrap', lineHeight: 1, marginRight: 4 }}>
        {oldest}
      </span>
      {clusters.map((clusterMonths, ci) => {
        const clusterOldestIdx = toIdx(clusterMonths[0]);
        const clusterNewestIdx = toIdx(clusterMonths[clusterMonths.length - 1]);
        const clusterDuration = Math.max(1, clusterNewestIdx - clusterOldestIdx);
        const isLastCluster = ci === clusters.length - 1;
        return (
          <React.Fragment key={`cluster-${ci}`}>
            {/* クラスター: 期間に比例したflex幅、最小10px */}
            <div style={{ flex: clusterDuration, position: 'relative', height: 12, minWidth: 10 }}>
              {/* クラスター内実線 */}
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, background: blue[300], transform: 'translateY(-50%)' }} />
              {/* ドット */}
              {clusterMonths.map((ym) => {
                const pos = clusterMonths.length === 1 ? 0.5 : (toIdx(ym) - clusterOldestIdx) / clusterDuration;
                const isCurrent = ym === curYM;
                return (
                  <Tooltip key={ym} title={ym} placement="top">
                    <div
                      onClick={() => onNavigate(ym)}
                      style={{
                        position: 'absolute',
                        left: `${pos * 100}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 20, height: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', zIndex: 1,
                      }}
                    >
                      <div style={{
                        width: isCurrent ? 12 : 7,
                        height: isCurrent ? 12 : 7,
                        borderRadius: '50%',
                        background: isCurrent ? blue[800] : blue[500],
                        boxShadow: isCurrent ? `0 0 0 3px ${blue[300]}` : 'none',
                        transition: 'background 0.15s',
                      }} />
                    </div>
                  </Tooltip>
                );
              })}
            </div>
            {/* 省略区間: 固定px幅、両端にスタブ線 */}
            {!isLastCluster && (
              <div style={{ flexShrink: 0, width: TIMELINE_GAP_PX, position: 'relative', height: 12 }}>
                <div style={{ position: 'absolute', left: 0, width: TIMELINE_STUB_W, top: '50%', height: 2, background: blue[300], transform: 'translateY(-50%)' }} />
                <div style={{ position: 'absolute', right: 0, width: TIMELINE_STUB_W, top: '50%', height: 2, background: blue[300], transform: 'translateY(-50%)' }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
      <span style={{ flexShrink: 0, fontSize: '0.7rem', color: blue[500], whiteSpace: 'nowrap', lineHeight: 1, marginLeft: 4 }}>
        {newest}
      </span>
    </div>
  );
};

const PlanManegementMain = () => {
  const classes = useStyles();
  const isMobile = useMediaQuery('(max-width:599px)');
  const history = useHistory();
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const classroom = useSelector(state => state.classroom);
  const stdDate = useSelector(state => state.stdDate);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const fetchLimit = users.length * 3
  const [curMonth, setCurMonth] = useState(() => {
    const savedMonth = getLS('planCurMonth');
    return normalizeMonth(savedMonth || stdDate, stdDate);
  });
  const [planItems, setPlanItems] = useState(false);
  const [snack, setSnack] = useState({msg: '', severity: ''})
  const [loading, setLoading] = useState(false);
  const [dateAria, setDateAria] = useState(null);
  const [expiryDialogOpen, setExpiryDialogOpen] = useState(false);
  const expiryData = usePlanExpiry();

  // ダイアログ開閉に連動してサイドバーを隠す/戻す
  useEffect(() => {
    if (expiryDialogOpen) {
      hideSideToolBar();
      return () => showSideToolBar();
    }
  }, [expiryDialogOpen]);
  
  // 自動スクロール（初期表示時、または通知からの月変更時などフラグがある場合のみ）
  useAutoScrollToRecentUser('user-row-', 800, '', [curMonth]);
  
  // ユーザーメニュー用の状態
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // スマホ用：選択中利用者（nullのとき利用者一覧を表示）
  const [selectedMobileUser, setSelectedMobileUser] = useState(null);

  useEffect(() => {
    const handleMonthUpdate = (e) => {
      if (e.detail) {
        const nextMonth = normalizeMonth(e.detail, stdDate);
        setCurMonth(nextMonth);
        setLS('planCurMonth', nextMonth);
      }
    };
    window.addEventListener('planMonthChanged', handleMonthUpdate);
    return () => window.removeEventListener('planMonthChanged', handleMonthUpdate);
  }, []);

  useEffect(()=>{
    const isMounted = { current: true };  // useRefのようにオブジェクトリファレンスとして管理
    const getItemAttr= (e) => getPlanItemAttr(e)
    const fetchData = async () => {
      setLoading(true);
      try {
        // const month = stdDate.slice(0, 7);
        const prms = {a: 'fetchUsersPlan', hid, bid, lastmonth: curMonth};
        const res = await univApiCall(prms, 'E23441', '', );

        // API呼び出し後もコンポーネントがマウントされていることを確認
        if (isMounted.current && res && res?.data?.result) {
          const items = (res.data?.dt ?? []).map(e => {
            const attr = getItemAttr(e);
            return {
              item: e.item, created: e.created, uid: e.uid, content: e.content, ...attr
            }
          });
          setPlanItems(items);
          console.log(items, 'items')
        }
      } catch (error) {
        // エラーハンドリング（必要に応じて）
        if (isMounted.current) {
          console.error('データ取得エラー:', error);
          setSnack({
            msg: 'データ取得に失敗しました', severity: 'error' , errorId: 'EP23442', 
            onErrorDialog: true
          });
        }
      } finally {
        // ここでの setLoading(false) は削除し、planItems の更新をトリガーにレンダリング完了を待つ
      }
    };
    
    // planItemsの有無に関係なくcurMonthが変わったらfetchDataを必ず実行
    fetchData();
    
    return () => {
      isMounted.current = false;  // クリーンアップ時に参照を更新
    };
  }, [curMonth])

  // データ取得後のレンダリング完了を待ってからバックドロップを閉じる
  useEffect(() => {
    if (planItems !== false) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 100); // 100ms 待機してレンダリングの安定を待つ
      return () => clearTimeout(timer);
    }
  }, [planItems]);

  const handleMonthChange = (offset) => {
    const date = new Date(curMonth);
    date.setMonth(date.getMonth() + offset);
    const newMonth = normalizeMonth(date.toISOString(), stdDate);
    setCurMonth(newMonth);
    setLS('planCurMonth', newMonth);
  };

  const handleDateAriaNavigate = (ym) => {
    const newMonth = normalizeMonth(ym + '-01', stdDate);
    setCurMonth(newMonth);
    setLS('planCurMonth', newMonth);
  };

  useEffect(() => {
    if (!hid || !bid) return;
    const isMounted = { current: true };
    const fetch = async () => {
      try {
        const res = await univApiCall({ a: 'fetchUsersPlanDateAria', hid, bid }, 'E_DATEARIA', '');
        if (isMounted.current && res?.data?.result) {
          setDateAria(res.data.dt ?? []);
        }
      } catch (e) {
        console.error('fetchUsersPlanDateAria error:', e);
      }
    };
    fetch();
    return () => { isMounted.current = false; };
  }, [hid, bid]);

  const getMonthHeaders = (stdDateStr) => {
    if (!stdDateStr) return [];
    const date = new Date(stdDateStr);
    const months = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(date);
      d.setMonth(d.getMonth() - i);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
      });
    }
    return months;
  };

  const monthHeaders = getMonthHeaders(curMonth);
  const filteredUsers = getFilteredUsers(users, service, classroom);

  // 期限関連の集計
  const allExpiryUids = new Set([
    ...Object.keys(expiryData.overdueByUid  || {}),
    ...Object.keys(expiryData.currentByUid  || {}),
    ...Object.keys(expiryData.nextByUid     || {}),
  ]);
  const usersWithExpiry = filteredUsers.filter(u => allExpiryUids.has(String(u.uid)));
  const redCount = (expiryData.overdue?.length || 0) + (expiryData.currentMonth?.length || 0);
  const expiryButtonColor = redCount > 0 ? red[500]
    : (expiryData.nextMonth?.length || 0) > 0 ? orange[500] : null;

  // アイテムクリックハンドラー
  const handleItemClick = (item) => {

    // ローカルストレージにuidを保存
    setLS(planlsUid, item.uid);

    // スマホ時: 編集コンポーネントではなく対応するSheetコンポーネント（閲覧用）にリンク
    if (isMobile) {
      const sheetItems = [
        'assessment', 'personalSupport', 'personalSupportHohou',
        'senmonShien', 'conferenceNote',
        'monitoring', 'monitoringHohou', 'monitoringSenmon',
      ];
      if (sheetItems.includes(item.item)) {
        history.push(`/reports/usersplan?item=${item.item}&uid=${item.uid}&created=${item.created}`);
        return;
      }
      // timetable はシートなし → スキップ
      return;
    }

    // PC時: アイテムタイプに応じてURLを決定
    let url = '';
    switch (item.item) {
      case 'assessment':
        url = `/plan/assessment?created=${item.created}&uid=${item.uid}&lastmonth=${curMonth}`;
        break;
      case 'personalSupport':
        url = `/plan/personalSupport?created=${item.created}&uid=${item.uid}&lastmonth=${curMonth}`;
        break;
      case 'personalSupportHohou':
        url = `/plan/personalSupport?created=${item.created}&uid=${item.uid}&hohou=true&lastmonth=${curMonth}`;
        break;
      case 'senmonShien':
        url = `/plan/senmonshien?created=${item.created}&uid=${item.uid}&lastmonth=${curMonth}`;
        break;
      case 'conferenceNote':
        url = `/plan/conferencenote?created=${item.created}&uid=${item.uid}&lastmonth=${curMonth}`;
        break;
      case 'monitoring':
        url = `/plan/monitoring?created=${item.created}&uid=${item.uid}&lastmonth=${curMonth}`;
        break;
      case 'monitoringHohou':
        url = `/plan/monitoringhohou?created=${item.created}&uid=${item.uid}&lastmonth=${curMonth}`;
        break;
      case 'monitoringSenmon':
        url = `/plan/monitoringsenmon?created=${item.created}&uid=${item.uid}&lastmonth=${curMonth}`;
        break;
      case 'timetable':
        url = `/users/timetable/edit/${item.uid}?created=${item.created}&history=plan&lastmonth=${curMonth}`;
        break;
      default:
        return; // その他のアイテムタイプは何もしない
    }

    // 指定されたURLに移動
    history.push(url);
  };

  // ユーザー名クリックハンドラー（メニューを開く）
  const handleUserNameClick = (user, event) => {
    setSelectedUser(user);
    setUserMenuAnchorEl(event.currentTarget);
  };

  // メニューを閉じる
  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
    setSelectedUser(null);
  };

  // 新規追加モードで各コンポーネントを開く共通関数
  const handleNavigateToAdd = (planType) => {
    if (!selectedUser) return;
    
    // ローカルストレージにuidを保存
    setLS(planlsUid, selectedUser.uid);
    
    // 新規追加モードで指定されたコンポーネントを開く
    navigateToPlanAdd(history, planType, selectedUser.uid);
    
    // メニューを閉じる
    handleUserMenuClose();
  };

  // ─── スマホ用共通パーツ（Menu / Dialog）─────────────────────────────────
  const sharedMenuAndDialogs = (
    <>
      <Menu
        anchorEl={userMenuAnchorEl}
        keepMounted
        open={Boolean(userMenuAnchorEl)}
        onClose={handleUserMenuClose}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      >
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f5',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          color: '#333',
          textAlign: 'center',
        }}
        dangerouslySetInnerHTML={{
          __html: selectedUser ?
            `${selectedUser.name.length > 16 ?
              selectedUser.name.substring(0, 16) + '‥' :
              selectedUser.name
            }さん<br/>新規追加` :
            '新規追加'
        }}
        />
        <MenuItem onClick={() => handleNavigateToAdd('assessment')}>
          <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: cyan[800] }}>
            <AssessmentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="アセスメント" />
        </MenuItem>
        {(() => {
          const userServices = selectedUser?.service?.split(',').map(s => s.trim()).filter(Boolean) || [];
          const hasMultipleServices = userServices.length > 1;
          if (userServices.length === 1 && userServices[0] === HOHOU) {
            return (
              <MenuItem onClick={() => handleNavigateToAdd('personalSupportHohou')}>
                <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: purple[800] }}>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="個別支援計画（保育所等訪問支援）" />
              </MenuItem>
            );
          }
          if (hasMultipleServices) {
            return userServices.map((userService, index) => {
              const isHohou = userService === HOHOU;
              const planType = isHohou ? 'personalSupportHohou' : 'personalSupport';
              const iconColor = isHohou ? purple[800] : brown[800];
              const displayName = `個別支援計画（${shortWord(userService)}）`;
              return (
                <MenuItem key={index} onClick={() => handleNavigateToAdd(planType)}>
                  <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: iconColor }}>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={displayName} />
                </MenuItem>
              );
            });
          } else {
            return (
              <MenuItem onClick={() => handleNavigateToAdd('personalSupport')}>
                <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: brown[800] }}>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="個別支援計画" />
              </MenuItem>
            );
          }
        })()}
        <MenuItem onClick={() => handleNavigateToAdd('senmonShien')}>
          <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: orange[800] }}>
            <BuildIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="専門支援計画" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigateToAdd('conferenceNote')}>
          <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: lime[900] }}>
            <MeetingRoomIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="担当者会議" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigateToAdd('monitoring')}>
          <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: green[800] }}>
            <TimelineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="モニタリング" />
        </MenuItem>
        {(() => {
          const userServices = selectedUser?.service?.split(',').map(s => s.trim()).filter(Boolean) || [];
          const hasHohouService = userServices.includes(HOHOU);
          if (hasHohouService) {
            return (
              <MenuItem onClick={() => handleNavigateToAdd('monitoringHohou')}>
                <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: green[800] }}>
                  <TimelineIcon fontSize="small" style={{ borderLeft: `3px solid ${purple[400]}`, paddingLeft: 2 }} />
                </ListItemIcon>
                <ListItemText primary="モニタリング（保訪）" />
              </MenuItem>
            );
          }
          return null;
        })()}
        {(() => {
          const hasSenmonShien = selectedUser && (planItems || []).some(
            item => item.item === 'senmonShien' && String(item.uid) === String(selectedUser.uid)
          );
          if (hasSenmonShien) {
            return (
              <MenuItem onClick={() => handleNavigateToAdd('monitoringSenmon')}>
                <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: green[800] }}>
                  <TimelineIcon fontSize="small" style={{ borderLeft: `3px solid ${orange[400]}`, paddingLeft: 2 }} />
                </ListItemIcon>
                <ListItemText primary="モニタリング（専門）" />
              </MenuItem>
            );
          }
          return null;
        })()}
      </Menu>

      <SnackMsgSingle state={snack} setState={setSnack} />
      <PlanOverlay open={loading} />

      <Dialog
        open={expiryDialogOpen}
        onClose={() => setExpiryDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        style={{ zIndex: 50 }}
        PaperProps={{ style: { alignSelf: 'flex-start', marginTop: 120, maxHeight: 'calc(100vh - 130px)' } }}
      >
        <DialogTitle disableTypography style={{ padding: '10px 16px', borderBottom: '1px solid #e0e0e0' }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>計画期限一覧</span>
        </DialogTitle>
        <DialogContent style={{ padding: '4px 16px 12px' }}>
          {usersWithExpiry.map(user => (
            <div key={user.uid} style={{ display: 'flex', alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.9rem' }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem' }}>
                  {(expiryData.overdueByUid  || {})[user.uid]?.map((it, i) => (
                    <div key={`o${i}`} style={{ color: red[500] }}>{it.itemName}：{it.endDate}（期限切れ）</div>
                  ))}
                  {(expiryData.currentByUid  || {})[user.uid]?.map((it, i) => (
                    <div key={`c${i}`} style={{ color: red[500] }}>{it.itemName}：{it.endDate}（当月）</div>
                  ))}
                  {(expiryData.nextByUid     || {})[user.uid]?.map((it, i) => (
                    <div key={`n${i}`} style={{ color: orange[500] }}>{it.itemName}：{it.endDate}（翌月）</div>
                  ))}
                </div>
              </div>
              <PlanUserExpiryBadge uid={user.uid} expiryData={expiryData} />
              <span
                style={{ cursor: 'pointer', marginLeft: 8, opacity: 0.4, color: grey[600] }}
                onClick={(e) => handleUserNameClick(user, e)}
              >
                <AddCircleIcon fontSize="small" style={{ verticalAlign: 'middle' }} />
              </span>
            </div>
          ))}
        </DialogContent>
      </Dialog>
    </>
  );

  // ─── スマホ表示 ─────────────────────────────────────────────────────────────
  if (isMobile) {
    const userDocs = selectedMobileUser
      ? (planItems || [])
          .filter(item => String(item.uid) === String(selectedMobileUser.uid))
          .sort((a, b) => new Date(b.created) - new Date(a.created))
      : [];

    return (
      <>
        <div className={classes.spWrapper}>

          {/* ── 利用者一覧 ── */}
          {!selectedMobileUser && (
            <>
              {/* 計画期限ボタン */}
              {allExpiryUids.size > 0 && (
                <div style={{ padding: '8px 16px', borderBottom: `1px solid ${grey[200]}` }}>
                  <Button
                    size="small"
                    onClick={() => setExpiryDialogOpen(true)}
                    style={{ color: expiryButtonColor, fontSize: '0.8rem' }}
                  >
                    計画期限
                  </Button>
                </div>
              )}

              {filteredUsers.map((user) => {
                const docCount = (planItems || []).filter(item => String(item.uid) === String(user.uid)).length;
                const ruStyle = recentUserStyle(user.uid);
                return (
                  <div
                    key={user.uid}
                    className={classes.spUserRow}
                    style={ruStyle}
                    onClick={() => setSelectedMobileUser(user)}
                  >
                    <div className={classes.spUserNameArea}>
                      <DispNameWithAttr {...user} />
                      <PlanUserExpiryBadge uid={user.uid} expiryData={expiryData} />
                    </div>
                    {docCount > 0 && (
                      <span style={{ fontSize: '0.75rem', color: grey[500], marginRight: 8 }}>
                        {docCount}件
                      </span>
                    )}
                    <ChevronRightIcon style={{ color: grey[400] }} />
                  </div>
                );
              })}
            </>
          )}

          {/* ── 書類一覧（利用者選択後） ── */}
          {selectedMobileUser && (
            <>
              <div className={classes.spSectionHeader}>
                <IconButton size="small" onClick={() => setSelectedMobileUser(null)} style={{ marginLeft: -8 }}>
                  <ChevronLeftIcon />
                </IconButton>
                <span style={{ fontWeight: 'bold', fontSize: '1rem', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedMobileUser.name}
                </span>
                <PlanUserExpiryBadge uid={selectedMobileUser.uid} expiryData={expiryData} />
                <span
                  style={{ cursor: 'pointer', opacity: 0.6, color: teal[700], marginLeft: 4 }}
                  onClick={(e) => handleUserNameClick(selectedMobileUser, e)}
                >
                  <AddCircleIcon />
                </span>
              </div>

              {userDocs.length === 0 && !loading && (
                <div style={{ padding: 40, textAlign: 'center', color: grey[500], fontSize: '0.9rem' }}>
                  書類がありません
                </div>
              )}

              {userDocs.map((item, idx) => (
                <div key={idx} className={classes.spDocItem} onClick={() => handleItemClick(item)}>
                  <PlanItemBadge item={item} onClick={() => handleItemClick(item)} />
                  <span className={classes.spDocDate}>{item.created?.slice(0, 7)}</span>
                  <ChevronRightIcon style={{ color: grey[400], flexShrink: 0 }} />
                </div>
              ))}
            </>
          )}
        </div>

        <PlanOutsideNotify />
        {sharedMenuAndDialogs}
      </>
    );
  }

  // ─── PC表示 ──────────────────────────────────────────────────────────────
  return(
    <>
      <div className={classes.root}>
        <div className={classes.userList}>
          <div className="userRow sticky" style={{ paddingBottom: 26 }}>
            <div className="noTitle">No.</div>
            <div className="name" style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 8 }}>
              <span>利用者名</span>
              {allExpiryUids.size > 0 && (
                <Button
                  size="small"
                  onClick={() => setExpiryDialogOpen(true)}
                  style={{ fontSize: '0.65rem', minWidth: 'auto', padding: '1px 5px', lineHeight: 1.4, color: expiryButtonColor }}
                >
                  計画期限
                </Button>
              )}
            </div>
            {serviceItems && serviceItems.length > 1 && (
              <div className="service"></div>
            )}
            {monthHeaders.map((h, index) => (
              <div key={`${h.year}-${h.month}`} className="monthHeader">
                {index === 0 || h.month === 1 ? (
                  <>
                    <span style={{ fontSize: '0.7rem' }}>{h.year}年</span>
                    <span>{h.month}月</span>
                  </>
                ) : (
                  `${h.month}月`
                )}
              </div>
            ))}
            <Button 
              className="month-nav-button prev-button prev-button-3m" size="small"
              onClick={() => handleMonthChange(-3)}
              startIcon={
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeftIcon fontSize="small" />
                  <ChevronLeftIcon fontSize="small" style={{ marginLeft: -14 }} />
                </span>
              }
              style={{ left: 240, position: 'absolute', zIndex: 5, marginRight: 0 }}
            >
              三ヶ月前
            </Button>
            <Button 
              className="month-nav-button prev-button prev-button-1m" size="small"
              onClick={() => handleMonthChange(-1)}
              startIcon={<ChevronLeftIcon fontSize="small" />}
              style={{ left: 340, position: 'absolute', zIndex: 5, marginRight: 0 }}
            >
              一ヶ月前
            </Button>
            <Button 
              className="month-nav-button next-button next-button-1m" size="small"
              onClick={() => handleMonthChange(1)}
              endIcon={<ChevronRightIcon fontSize="small" />}
              style={{ right: 120, position: 'absolute', zIndex: 5, marginLeft: 0 }}
            >
              一ヶ月後
            </Button>
            <Button 
              className="month-nav-button next-button next-button-3m" size="small"
              onClick={() => handleMonthChange(3)}
              endIcon={
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRightIcon fontSize="small" />
                  <ChevronRightIcon fontSize="small" style={{ marginLeft: -14 }} />
                </span>
              }
              style={{ right: 20, position: 'absolute', zIndex: 5, marginLeft: 0 }}
            >
              三ヶ月後
            </Button>
            {/* 月日タイムライン */}
            <div style={{ position: 'absolute', bottom: 4, left: 16 + 40 + 200 + (serviceItems && serviceItems.length > 1 ? 60 : 0), right: 16, zIndex: 4 }}>
              <PlanDateRangeNav dateAria={dateAria} curMonth={curMonth} onNavigate={handleDateAriaNavigate} />
            </div>
          </div>
          {filteredUsers.map((user, index) => {
            const ruStyle = recentUserStyle(user.uid);
            return (
              <div key={user.uid} id={'user-row-' + user.uid} className="userRow">
                <div className="no" style={ruStyle}>
                  <div className="noInner">{index + 1}</div>
                </div>
                <div className="name">
                  <div 
                    className={`nameInner ${classes.userNameDispWithEdit}`}
                    onClick={(event) => handleUserNameClick(user, event)}
                    style={{ cursor: 'pointer' }}
                    title="クリック: 新規作成メニューを開く"
                  >
                    <DispNameWithAttr {...user} />
                    <PlanUserExpiryBadge uid={user.uid} expiryData={expiryData} />
                    <a>
                      <AddCircleIcon />
                    </a>
                  </div>
                </div>
                {serviceItems && serviceItems.length > 1 && (
                  <div className="service">
                    <div className="serviceInner">
                      {user.service ? 
                        user.service.split(',').map((service, index) => {
                          const firstChar = service.charAt(0);
                          let color = 'inherit';
                          
                          if (firstChar === '放') color = teal[800];
                          else if (firstChar === '児') color = blue[800];
                          else if (firstChar === '保') color = purple[800];
                          
                          return (
                            <span key={index} style={{ color }}>
                              {firstChar}
                              {index < user.service.split(',').length - 1 && (
                                <span style={{ color: grey[600] }}>・</span>
                              )}
                            </span>
                          );
                        })
                        : ''
                      }
                    </div>
                  </div>
                )}
                {monthHeaders.map(h => {
                  const itemsInCell = (planItems || []).filter(item => {
                    const itemDate = new Date(item.created);
                    return String(item.uid) === String(user.uid) &&
                           itemDate.getFullYear() === h.year &&
                           itemDate.getMonth() + 1 === h.month;
                  });

                  return (
                    <div key={`${h.year}-${h.month}`} className="monthCell">
                      {itemsInCell
                        .sort((a, b) => comparePlanItems(a, b, { dateOrder: 'asc' }))
                        .map((item, itemIndex) => (
                          <PlanItemBadge key={itemIndex} item={item} onClick={() => handleItemClick(item)} />
                        ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 範囲外の日付通知 */}
      <PlanOutsideNotify />

      {sharedMenuAndDialogs}
    </>
  );
};

const PlanManegement = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const isMobile = useMediaQuery('(max-width:599px)');

  if(!loadingStatus.loaded) return(
    <>
      <LoadingSpinner />
    </>
  )
  else if (loadingStatus.error){
    return (<>
      <LoadErr loadStatus={loadingStatus} errorId={'E923556'} />
    </>)
  }

  return(
    <>
      {!isMobile && <LinksTab menu={planMenu} />}
      <PlanManegementMain />
    </>
  );
};

export { PlanManegement };