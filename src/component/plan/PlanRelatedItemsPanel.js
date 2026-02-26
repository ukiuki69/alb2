import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles, useMediaQuery, Button, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { univApiCall } from '../../albCommonModule';
import { setLS, getLS } from '../../modules/localStrageOprations';
import { planlsUid } from './planConstants';
import { PlanItemBadge, comparePlanItems, navigateToPlanItem } from './PlanItemShared';
import { navigateToPlanAdd, deepEqual } from './planCommonPart';
import { getUser, shortWord } from '../../commonModule';
import { HOHOU } from '../../modules/contants';
import { grey, teal, blue, brown, orange, cyan, green, lime, purple } from '@material-ui/core/colors';
import DescriptionIcon from '@material-ui/icons/Description';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import RefreshIcon from '@material-ui/icons/Refresh';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import AssessmentIcon from '@material-ui/icons/Assessment';
import PersonIcon from '@material-ui/icons/Person';
import BuildIcon from '@material-ui/icons/Build';
import MeetingRoomIcon from '@material-ui/icons/MeetingRoom';
import TimelineIcon from '@material-ui/icons/Timeline';

const useStyles = makeStyles({
  panel: {
    position: 'fixed',
    left: 'max(calc((100% - 800px) / 2 + 808px), calc(100% - 140px))',
    top: 110,
    width: 128,
    maxHeight: '70vh',
    overflow: 'auto',
    background: '#fff',
    zIndex: 10,
  },
  collapsedPanel: {
    position: 'fixed',
    top: 98,
    right: 16,
    zIndex: 110,
  },
  expandedPanel: {
    position: 'fixed',
    left: 'calc(100% - 140px)',
    top: 98,
    right: 16,
    width: 120,
    maxHeight: '70vh',
    overflow: 'auto',
    background: '#fff',
    zIndex: 120,
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '.9rem',
    fontWeight: 600,
    marginBottom: 8,
    padding: 8,
  },
  collapseButton: {
    fontSize: '.8rem',
    fontWeight: 600,
    padding: '8px',
    textAlign: 'center',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f9f9f9',
    '&:hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8px',
    gap: '8px',
    borderTop: '1px solid #eee',
  },
});

// props: { uid: string, created?: string, createdBase?: string, title?: string, setRelatedItems?: function, originInputs?: object, inputs?: object, currentPlanType?: string }

export const PlanRelatedItemsPanel = (props) => {
  const { 
    uid, created, createdBase, style, title = '', 
    setRelatedItems, originInputs, inputs, currentPlanType 
  } = props;
  const classes = useStyles();
  const history = useHistory();
  const hid = useSelector((s) => s.hid);
  const bid = useSelector((s) => s.bid);
  const stdDate = useSelector((s) => s.stdDate);
  const users = useSelector((s) => s.users);
  const [planItems, setPlanItems] = useState([]);
  const [snack, setSnack] = useState({ msg: '', severity: '' });
  const isMountedRef = useRef(true);

  // コンポーネントのマウント状態を管理するセーフなState更新関数
  const setSnackSafe = useCallback((val) => {
    if (isMountedRef.current) {
      setSnack(val);
    }
  }, []);

  const [isExpanded, setIsExpanded] = useState(false);
  const isSmallScreen = useMediaQuery('(max-width: 1200px)');
  
  // メニュー用の状態
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState(null);
  
  // ユーザー情報を取得
  const user = getUser(uid, users);

  const base = created || createdBase || new Date().toISOString().split('T')[0];
  
  // lastmonthパラメータを取得（URLから優先、なければローカルストレージ、最後にstdDate）
  const getLastmonth = () => {
    // まずURLから取得を試みる
    const searchParams = new URLSearchParams(window.location.search);
    const urlLastmonth = searchParams.get('lastmonth');
    if (urlLastmonth) return urlLastmonth;
    
    // なければローカルストレージから取得
    const savedMonth = getLS('planCurMonth');
    if (savedMonth) return savedMonth;
    
    // 最後はstdDateを使用
    return stdDate;
  };
  
  const lastmonth = getLastmonth();

  // 編集状態の判定（deepEqualを使用）
  const isDirty = useMemo(() => {
    // originInputsとinputsが両方とも存在する場合のみ判定
    if (!originInputs || !inputs) return false;
    return !deepEqual(originInputs, inputs);
  }, [originInputs, inputs]);

  // 共通のアイテムリスト描画関数
  const renderPlanItems = () => {
    const sortedItems = [...planItems].sort((a, b) => comparePlanItems(a, b, { dateOrder: 'asc' }));
    
    return sortedItems.map((item, idx) => {
      let marginBottom = 6; // デフォルトのマージン
      let marginTop = 0; // デフォルトの上マージン
      
      // 前のアイテムとの日付差をチェック（最初のアイテム以外）
      if (idx > 0) {
        const currentDate = new Date(item.created);
        const prevDate = new Date(sortedItems[idx - 1].created);
        const daysDiff = Math.abs((currentDate - prevDate) / (1000 * 60 * 60 * 24));
        
        // 21日以上離れている場合は余分なマージンを追加
        if (daysDiff >= 21) {
          marginTop = 12; // 上に余白を追加
        }
      }
      
      return (
        <PlanItemBadge
          key={`${item.item}-${item.created}-${idx}`}
          item={item}
          onClick={() => {
            setLS(planlsUid, String(item.uid));
            navigateToPlanItem(history, item, lastmonth);
          }}
          style={{ marginBottom, marginTop, padding: '6px 4px' }}
        />
      );
    });
  };

  // 共通のボタン行描画関数
  const renderButtonRow = () => (
    <div className={classes.buttonRow}>
      <IconButton
        size="small"
        onClick={(event) => setAddMenuAnchorEl(event.currentTarget)}
        title={isDirty ? "編集中のため新規作成は無効です" : "新しいプランを作成"}
        disabled={isDirty}
        style={{ 
          color: isDirty ? grey[400] : blue[600]
        }}
      >
        <AddCircleOutlineIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        onClick={fetchItems}
        title="関連書類を更新"
        style={{ color: grey[600] }}
      >
        <RefreshIcon fontSize="small" />
      </IconButton>
    </div>
  );

  // メニューを閉じる
  const handleAddMenuClose = () => {
    setAddMenuAnchorEl(null);
  };

  // 新規追加モードで各コンポーネントを開く共通関数
  const handleNavigateToAdd = (planType) => {
    // ローカルストレージにuidを保存
    setLS(planlsUid, String(uid));
    
    // 新規追加モードで指定されたコンポーネントを開く
    navigateToPlanAdd(history, planType, uid);
    
    // メニューを閉じる
    handleAddMenuClose();
  };


  const fetchItems = useCallback(async () => {
    if (!uid || !base) return;
    
    // baseが正しい日付形式（yyyy-mm-dd）かチェック
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(base)) return;
    
    // 日付として有効かチェック
    const d = new Date(base);
    if (isNaN(d.getTime())) return;
    
    d.setMonth(d.getMonth() + 6);
    const prms = { a: 'fetchUsersPlan', hid, bid, uid, lastmonth };
    const res = await univApiCall(prms, 'E23441', '', setSnackSafe, '', '', false);
    
    if (!isMountedRef.current) return;

    if (res?.data?.result) {
      const items = (res.data?.dt ?? []).map((e) => ({ 
        item: e.item, 
        created: e.created, 
        uid: e.uid,
        content: e.content, // contentプロパティを追加
        isDraft: Boolean(
          (e?.content?.content && (e.content.content['原案'] || e.content.content.原案)) ||
          (e?.content && (e.content['原案'] || e.content.原案)) ||
          e['原案']
        )
      }));
      setPlanItems(items);
      // 上位コンポーネントにplanItemsの内容を渡す
      if (setRelatedItems && typeof setRelatedItems === 'function') {
        setRelatedItems(items);
      }
    }
  }, [uid, hid, bid, base, setRelatedItems]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchItems();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchItems]);

    // 小画面で折りたたまれている場合
  if (isSmallScreen && !isExpanded) {
    // 関連書類がない場合は表示しない
    if (planItems.length === 0) {
      return null;
    }
    
    return (
      <div className={classes.collapsedPanel} style={style || {}}>
        <Button
          variant="contained"
          size="small"
          startIcon={<DescriptionIcon />}
          onClick={() => setIsExpanded(true)}
        >
          関連書類
        </Button>
      </div>
    );
  }

  // 小画面で展開されている場合
  if (isSmallScreen && isExpanded) {
    return (
      <div className={classes.expandedPanel} style={style || {}}>
        <div style={{ padding: '8px' }}>
          <Button
            size="small"
            color="default"
            startIcon={<ExpandMoreIcon />}
            onClick={() => setIsExpanded(false)}
            style={{ 
              // color: teal[800], 
              // borderColor: teal[800],
              // fontSize: '.8rem',
              // fontWeight: 600,
              // width: '100%',
              // marginBottom: '8px',
              // backgroundColor: grey[200],
            }}
          >
            関連書類
          </Button>
          {renderPlanItems()}
          {renderButtonRow()}
        </div>
      </div>
    );
  }

  // 大画面の場合（従来通り）
  return (
    <div className={classes.panel} style={style || {}}>
      {title ? <div className={classes.title}>{title}</div> : null}
      <div>
        {renderPlanItems()}
        {renderButtonRow()}
      </div>
      
      {/* 新規追加メニュー */}
      <Menu
        anchorEl={addMenuAnchorEl}
        keepMounted
        open={Boolean(addMenuAnchorEl) && !isDirty}
        onClose={handleAddMenuClose}
        getContentAnchorEl={null}
        anchorOrigin={{ vertical: 'center', horizontal: 'left' }}
        transformOrigin={{ vertical: 'center', horizontal: 'right' }}
        style={{
          transform: 'translateX(-32px)'
        }}
      >
        <div style={{ 
          padding: '8px 16px', 
          borderBottom: '1px solid #e0e0e0', 
          backgroundColor: '#f5f5f5',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          color: '#333',
          textAlign: 'center',
        }}>
          新規作成
        </div>
        
        {/* アセスメント */}
        <MenuItem onClick={() => handleNavigateToAdd('assessment')}>
          <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: cyan[800] }}>
            <AssessmentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="アセスメント" />
        </MenuItem>
        
        {/* 個別支援計画 */}
        {(() => {
          const userServices = user?.service?.split(',').map(s => s.trim()).filter(Boolean) || [];
          const hasMultipleServices = userServices.length > 1;
          
          if (hasMultipleServices) {
            // 複数サービスの場合は、各サービスごとに個別支援計画メニューを表示
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
            // 単一サービスの場合は通常の個別支援計画メニューを表示
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

        {/* 専門支援計画 */}
        <MenuItem onClick={() => handleNavigateToAdd('senmonShien')}>
          <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: orange[800] }}>
            <BuildIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="専門支援計画" />
        </MenuItem>
        
        {/* 担当者会議 */}
        <MenuItem onClick={() => handleNavigateToAdd('conferenceNote')}>
          <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: lime[900] }}>
            <MeetingRoomIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="担当者会議" />
        </MenuItem>
        
        {/* モニタリング */}
        <MenuItem onClick={() => handleNavigateToAdd('monitoring')}>
          <ListItemIcon style={{ minWidth: 28, marginRight: 8, color: green[800] }}>
            <TimelineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="モニタリング" />
        </MenuItem>
        
        {/* モニタリング（保訪） - HOHOU利用者のみ */}
        {(() => {
          const userServices = user?.service?.split(',').map(s => s.trim()).filter(Boolean) || [];
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
        
        {/* モニタリング（専門） - senmonShienが存在する場合のみ */}
        {(() => {
          const hasSenmonShien = planItems.some(item => item.item === 'senmonShien' && String(item.uid) === String(uid));
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
    </div>
  );
};


