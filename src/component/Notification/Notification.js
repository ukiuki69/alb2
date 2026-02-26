import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, makeStyles } from "@material-ui/core"
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import { getLodingStatus } from '../../commonModule';
import { initializeApp } from "firebase/app";
import { collection, deleteDoc, getDocs, getFirestore, limit, onSnapshot, orderBy, query, updateDoc, where, startAfter } from "firebase/firestore";
import NotificationsIcon from '@material-ui/icons/Notifications';
import CloseIcon from '@material-ui/icons/Close';
import { blue, grey, indigo, red } from '@material-ui/core/colors';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import SmsIcon from '@material-ui/icons/Sms';
import HelpIcon from '@material-ui/icons/Help';
import PauseIcon from '@material-ui/icons/Pause';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import EditIcon from '@material-ui/icons/Edit';
import { getFilteredUsers } from '../../albCommonModule';
import SnackMsg from '../common/SnackMsg';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';

const INIT_FETCH_TIMES = 10;
const SCROLL_FETCH_TIMES = 10;

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB-Lj2ECjCYup2FqFGCp2r61U9yD5u5luY",
  authDomain: "albatross-432004.firebaseapp.com",
  projectId: "albatross-432004",
  storageBucket: "albatross-432004.appspot.com",
  messagingSenderId: "238548710535",
  appId: "1:238548710535:web:ceb3a1b4513826ee2bb422"
};
const app = initializeApp(FIREBASE_CONFIG, "notificationApp");
export const notificationDB = getFirestore(app, "notification");

/**
 * 通知タイプを表示用の文字列に変換する
 * @param {String} type 
 * @returns {String} 表示用の文字列
 */
const getNotificationsType = (type) => {
  switch(type){
    case "freeMessage": return "フリートーク";
    case "contactbook": return "連絡帳（ご家族からのメッセージ）";
    case "reserve": return "予約申請";
    case "cancelReserve": return "予約キャンセル";
    case "absence": return "欠席申請";
    case "editSchedule": return "予定変更";
    case "authedLine": return "あるふぁみ×LINE認証";
    default: return "その他";
  }
}

/**
 * firestoreからデータを取得する
 * @param {Object} query 
 * @returns {Array} データ
 */
const getNotifications = async(query) => {
  const result = [];
  try{
    const querySnapshot = await getDocs(query);
    if(!querySnapshot.empty){
      querySnapshot.forEach(doc => {
        const data = doc.data();
        result.push({ id: doc.id, ...data, docRef: doc.ref });
      });
    }
  }catch(error){
    console.log(error)
  }
  return result;
}

const chunkArray = (array, size) => {
  const chunked = [];
  let index = 0;
  while (index < array.length) {
    chunked.push(array.slice(index, size + index));
    index += size;
  }
  return chunked;
};

const getEarliestNotifications = async(notificationRef, prevLatestNotification, times, targetUids) => {
  const timestamp = parseInt(prevLatestNotification.timestamp);
  
  const baseConstraints = [
    orderBy('timestamp', "desc"),
    startAfter(timestamp)
  ];

  if (times) {
    baseConstraints.push(limit(times));
  }

  let results = [];

  if(targetUids && targetUids.length > 0){
    const chunks = chunkArray(targetUids, 30);
    const promises = chunks.map(async (chunk) => {
      const constraints = [...baseConstraints, where("uid", "in", chunk)];
      const q = query(notificationRef, ...constraints);
      return await getNotifications(q);
    });
    const chunkResults = await Promise.all(promises);
    results = chunkResults.flat();
  }

  // 結合後、再度ソートしてlimit件数に絞る
  results.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
  if(times && results.length > times){
    results = results.slice(0, times);
  }

  return results;
}

const useGetFireStoreNotificationRef = () => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const ref = useMemo(() => {
    if (!hid || !bid) return null;
    return collection(notificationDB, hid, bid, "notifications");
  }, [hid, bid]);
  return ref;
}

const useNotificationOnSnapshot = (setNotifications, targetUids) => {
  const notificationRef = useGetFireStoreNotificationRef();
  const chunksDataRef = useRef({});

  useEffect(() => {
    const unsubscribes = [];
    chunksDataRef.current = {};

    const updateNotifications = () => {
      const allDocs = Object.values(chunksDataRef.current).flat();
      const uniqueDocsMap = new Map();
      allDocs.forEach(doc => uniqueDocsMap.set(doc.id, doc));
      const uniqueDocs = Array.from(uniqueDocsMap.values());
      
      uniqueDocs.sort((a, b) => parseInt(b.timestamp) - parseInt(a.timestamp));
      setNotifications(uniqueDocs);
    };

    if(notificationRef && targetUids && targetUids.length > 0){
      const chunks = chunkArray(targetUids, 30);
      chunks.forEach((chunk, index) => {
        // ★最新10件だけ（各チャンクごとに取得してしまうが、結合後にソートされる）
        const constraints = [
          orderBy("timestamp", "desc"),
          limit(INIT_FETCH_TIMES),
          where("uid", "in", chunk)
        ];
        const q = query(notificationRef, ...constraints);
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data(), docRef: d.ref }));
          chunksDataRef.current[index] = docs;
          updateNotifications();
        }, (error) => {
          console.log(error);
        });
        unsubscribes.push(unsubscribe);
      });
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationRef, JSON.stringify(targetUids)]);
};

/**
 * スクロール位置が0になった時にfirestoreからデータを取得するカスタムフック
 * messagesステートにある一番古いデータ（messages[0]）より前のデータを５件取得する。
 */
const useScrollActions = (notifications, setNotifications, targetUids) => {
  const notificationRef = useGetFireStoreNotificationRef();
  const isFetching = useRef(false);
  const notificationsRef = useRef(notifications);
  const cleanupRef = useRef(null);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const dialogContentRef = useCallback((node) => {
    if(cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if(!node) return;

    const handleScroll = async() => {
      const scrollTop = node.scrollTop;
      const scrollHeight = node.scrollHeight;
      const clientHeight = node.clientHeight;
      const isBottom = scrollHeight - scrollTop <= clientHeight + 1;
      if(!isBottom) return;
      if(isFetching.current) return;
      
      const currentNotifications = notificationsRef.current;
      // 親コンポーネントで既にソート済みのものが渡される前提なら、そのまま末尾を取得するだけで良い
      const prevLatestNotification = currentNotifications.at(-1);
      if(!prevLatestNotification) return;

      isFetching.current = true;
      if (!notificationRef) return;
      try{
        const newNotifications = await getEarliestNotifications(notificationRef, prevLatestNotification, SCROLL_FETCH_TIMES, targetUids);
        if(!newNotifications.length) return;
        setNotifications(prevNotifications => ([...prevNotifications, ...newNotifications]));
      }catch(error){
        console.error("Error fetching documents: ", error);
      }finally{
        isFetching.current = false;
      }
    }

    node.addEventListener('scroll', handleScroll);
    
    cleanupRef.current = () => {
      node.removeEventListener('scroll', handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationRef, setNotifications, notifications, JSON.stringify(targetUids)]);
  return dialogContentRef;
}

const useStyles = makeStyles({
  NotificationIconButton: {
    position: 'relative',
    '& .icon': {
      padding: 6, color: '#fff'
    },
    '& .uncheckedCnt': {
      position: 'absolute', top: 2, right: 2,
      minWidth: 16,
      height: 16, lineHeight: "16px",
      padding: '0 4px',
      fontSize: 12, textAlign: 'center', color: "#fff",
      backgroundColor: red[800],
      borderRadius: 8,
    },
    "@media (max-width:500px)": {
      marginLeft: -16
    },
  },
  Notification: {

  },
  NotificationsDialog: {
    overflowX: 'hidden',
    '& .closeButton': {
      position: 'absolute', top: 8, right: 8, 
      color: grey[500],
    },
    '& .dialogContent': {
      '& .none': {
        opacity: 0.8
      }
    }
  },
  NotificationCard: {
    padding: "8px 12px",
    marginBottom: 16,
    borderRadius: 4,
    display: 'flex', alignItems: 'center',
    position: 'relative',
    '&:hover': {
      backgroundColor: grey[200],
      cursor: 'pointer'
    },
    '& .checked': {
      opacity: 0.5
    },
    '& .icon': {
      marginRight: 16
    },
    '& .timestamp': {
      position: 'absolute', top: 8, right: 12,
      fontSize: 14
    },
    '& .title': {
      fontSize: 18,
      marginBottom: 8
    },
    '& .content': {
      fontSize: 16,
      lineHeight: '1.5rem',
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "-webkit-box",
      "-webkit-box-orient": "vertical",
      "-webkit-line-clamp": 2, /* 行数を指定 */
      wordBreak: "break-all",
    },
    '& .type': {
      fontSize: 12,
      marginTop: 8
    },
    '& .delete': {
      position: 'absolute', right: 8, bottom: 3,
      zIndex: 100,
      '&:hover': {
        '& .deleteIcon': {
          color: red[800]
        }
      },
      '& .deleteIcon': {
        color: red[600]
      }
    }
  }
});

const NotificationIconButton = (props) => {
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const stdDate = useSelector(state => state.stdDate);
  const {setDialogOpen} = props;
  const [uncheckedNotifications, setUncheckedNotifications] = useState([]);
  const notificationRef = useGetFireStoreNotificationRef();
  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = getFilteredUsers(safeUsers, service || '', classroom || '');
  const targetUids = filteredUsers
    .map(user => user?.uid)
    .filter(uid => uid !== undefined && uid !== null && uid !== '');

  // 未読メッセージ件数を取得
  useEffect(() => {
    const unsubscribes = [];
    const chunksData = {};

    const updateUnchecked = () => {
      const allDocs = Object.values(chunksData).flat();
      const uniqueDocsMap = new Map();
      allDocs.forEach(doc => uniqueDocsMap.set(doc.id, doc));
      const uniqueDocs = Array.from(uniqueDocsMap.values());
      setUncheckedNotifications(uniqueDocs);
    };

    if(notificationRef && targetUids && targetUids.length > 0){
      const chunks = chunkArray(targetUids, 30);
      chunks.forEach((chunk, index) => {
        const q = query(notificationRef, where("checked", "==", false), where("uid", "in", chunk));
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data(), docRef: d.ref }));
          chunksData[index] = docs;
          updateUnchecked();
        }, (error) => {
          console.log(error);
        });
        unsubscribes.push(unsubscribe);
      });
    }
    
    return () => {
      unsubscribes.forEach(u => u());
    };
  }, [notificationRef, JSON.stringify(targetUids)]);

  const handleClick = () => {
    setDialogOpen(true);
  }

  const filteredUncheckedNotifications = uncheckedNotifications.filter(notification => {
    const nUid = notification.uid;
    // 通知データにuidが含まれる時はサービスや単位でフィルタリング
    if(nUid && filteredUsers.every(user => user.uid !== nUid)) return false;
    return true;
  });

  const uncheckedCnt = filteredUncheckedNotifications.length;
  return(
    <div className={classes.NotificationIconButton}>
      <IconButton
        onClick={handleClick}
        className='icon'
      >
        <NotificationsIcon />
      </IconButton>
      {Boolean(uncheckedCnt) &&<div className='uncheckedCnt'>{uncheckedCnt}</div>}
    </div>
  )
}

const NotificationsCardIcon = (props) => {
  const {messageType} = props;
  const style = {fontSize: 32};
  const commonProps = {style, color: props.color}
  switch(messageType){
    case "contactbook": return <MenuBookIcon {...commonProps} />;
    case "freeMessage": return <SmsIcon {...commonProps} />;
    case "reserve": return <PauseIcon {...commonProps} style={{...style, color: blue[600]}} />;
    case "cancelReserve": return <PauseIcon {...commonProps} style={{...style, color: red["A700"]}} />;
    case "absence": return <NotInterestedIcon {...commonProps} style={{...style, color: red["A700"]}} />;
    case "editSchedule": return <EditIcon {...commonProps} style={{...style, color: indigo[600]}} />;
    case "authedLine": return <CheckCircleOutlineIcon {...commonProps} style={{...style, color: 'rgba(0, 185, 0)'}} />;
    default: return <HelpIcon {...commonProps} />;
  }
}

const NotificationCard = (props) => {
  const stdDate = useSelector(state => state.stdDate);
  const classes = useStyles();
  const history = useHistory();
  const {notification, setNotifications, setDialogOpen, setSnack} = props;

  const checked = notification.checked;
  const type = notification.type;
  const content = notification.content;
  const title = notification.title;


  const timestamp = notification.timestamp;
  const newDate = new Date(timestamp);
  const year = newDate.getFullYear();
  const month = String(newDate.getMonth()+1).padStart(2, '0');
  const date = String(newDate.getDate()).padStart(2, '0');
  const hours = String(newDate.getHours()).padStart(2, '0');
  const minutes = String(newDate.getMinutes()).padStart(2, '0');
  const now = new Date();
  const nowYear = now.getFullYear();
  const isToday = now.toDateString() === newDate.toDateString();

  const handleClick = async() => {
    const notifStdDate = notification?.stdDate;
    if(notifStdDate && notifStdDate !== stdDate ){
      setSnack({msg: "月を切り替えてください。", severity: "warning", id: new Date().getTime()});
      return;
    }

    // 未読の場合は既読にする
    if(!notification.checked){
      updateDoc(notification.docRef, {"checked": true});
    }

    const url = notification.url;
    if(url){
      window.open(url, '_blank');
      setDialogOpen(false);
      return;
    }

    const path = notification.path;
    if(path){
      history.push(path);
      setDialogOpen(false);
      return;
    }
  }

  const handleDelete = async(e) => {
    e.stopPropagation();
    const id = notification.id;

    // 楽観的UI更新：サーバーレスポンスを待たずに先にUIから削除
    setNotifications(prevNotifications => prevNotifications.filter(m => m.id !== id));

    try{
      deleteDoc(notification.docRef);
    }catch(error){
      console.error("Error removing document: ", error);
      // エラーが発生した場合、必要であればここでデータを復元する処理などを検討してください
    }
  }

  const checkedClass = checked ?"checked" :"";

  return(
    <>
    <div
      onClick={handleClick}
      className={classes.NotificationCard}
    >
      <div className={`icon ${checkedClass}`}><NotificationsCardIcon messageType={type} color="primary" /></div>
      <div>
        <div className={`timestamp ${checkedClass}`}>{
          isToday
            ?`${hours}:${minutes}`
            :year===nowYear
              ?`${month}/${date} ${hours}:${minutes}`
              :`${year}/${month}/${date} ${hours}:${minutes}`
        }</div>
        <div className={`title ${checkedClass}`}>{title}</div>
        <div className={`content ${checkedClass}`}>{content}</div>
        <div className={`type ${checkedClass}`}>{getNotificationsType(type)}</div>
        <div className='delete' onClick={handleDelete}><DeleteForeverIcon className='deleteIcon' /></div>
      </div>
    </div>
    <SnackMsg />
    </>
  )
}

const NotificationsDialog = (props) => {
  const classes = useStyles();
  const {dialogOpen, setDialogOpen} = props;
  const [snack, setSnack] = useState({});
  const [notifications, setNotifications] = useState([]);
  const users = useSelector(state => state.users);
  const service = useSelector(state => state.service);
  const classroom = useSelector(state => state.classroom);
  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = getFilteredUsers(safeUsers, service || '', classroom || '');
  const targetUids = filteredUsers
    .map(user => user?.uid)
    .filter(uid => uid !== undefined && uid !== null && uid !== '');
  const stdDate = useSelector(state => state.stdDate);

  // データ初期取得監視
  useNotificationOnSnapshot(setNotifications, targetUids);

  // スクロールが最下部になったら古いデータを取得してくる。
  // useScrollActions内部ではなく、ここで一元管理されたsortedNotificationsを使用する
  const sortedNotifications = useMemo(() => {
    return (notifications ?? []).filter(notification => {
      const nUid = notification.uid;
      // 通知データにuidが含まれる時はサービスや単位でフィルタリング
      if(nUid && filteredUsers.every(user => user.uid !== nUid)) return false;
      return true;
    }).sort((a, b) => {
      return parseInt(b.timestamp) - parseInt(a.timestamp);
    });
  }, [notifications, stdDate, filteredUsers]);

  const dialogContentRef = useScrollActions(sortedNotifications, setNotifications, targetUids);

  const handleClose = () => {
    setDialogOpen(false);
  };

  const nodes = sortedNotifications.map(notification => (
    <NotificationCard
      key={`NotificationCard${notification.id}`}
      notification={notification}
      setNotifications={setNotifications}
      setDialogOpen={setDialogOpen}
      setSnack={setSnack}
    />
  ));

  return(
    <>
    <Dialog
      className={classes.NotificationsDialog}
      onClose={handleClose} open={dialogOpen}
      PaperProps={{style: {height: '70vh', width: '90vw', margin: 0}}}
    >
      <DialogTitle onClose={handleClose}>
        <div className='title'>通知</div>
        <IconButton className="closeButton" onClick={handleClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers className='dialogContent' ref={dialogContentRef}>
        {Boolean(nodes.length) &&(nodes)}
        {!Boolean(nodes.length) &&<div className='none'>通知はありません。</div>}
      </DialogContent>
    </Dialog>
    <SnackMsg {...snack} />
    </>
  )
}

export const Notifications = () => {
  const classes = useStyles();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const [dialogOpen, setDialogOpen] = useState(false);

  if(!loadingStatus.loaded) return null;

  const {com, users} = allState;
  const safeUsers = Array.isArray(users) ? users : [];
  // LINE利用事業所か？
  const isEnableLine = com?.ext?.settingContactBook?.line;
  // 連絡帳利用事業所か？
  const isUseContactBook = safeUsers.some(user => user?.faptoken ? true : false);
  if (!isEnableLine && !isUseContactBook) return null;

  const commonProps = {dialogOpen, setDialogOpen};
  return(
    <div className={classes.Notifications}>
      <NotificationIconButton {...commonProps} />
      <NotificationsDialog {...commonProps} />
    </div>
  )
}