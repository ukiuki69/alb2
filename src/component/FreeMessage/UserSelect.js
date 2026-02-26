import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppBar, Button, CircularProgress, Dialog, IconButton, makeStyles, Menu, MenuItem, Slide, Toolbar, Typography, useMediaQuery } from "@material-ui/core"
import { useDispatch, useSelector } from "react-redux";
import { useHistory, useParams } from 'react-router';
import { grey, red, teal, yellow } from '@material-ui/core/colors';
import { FireBaseRefContext, LoadingContext } from './FreeMessage';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import CloseIcon from '@material-ui/icons/Close';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { univApiCall } from '../../albCommonModule';
import { setStore } from '../../Actions';

export const FREETALK_SELECT_USER_SESSIONSTORAGE_KEY = "freetalkSelectUid";

const handleFYAOn = async(uid, users, hid, bid, dispatch) => {
  const newUsers = JSON.parse(JSON.stringify(users));
  const targetUserIndex = newUsers.findIndex(prevUser => prevUser.uid === uid);
  if(!newUsers[targetUserIndex]?.ext) newUsers[targetUserIndex].ext = {};
  const newUserExt = newUsers[targetUserIndex].ext;
  if(!newUserExt.freeMessage) newUserExt.freeMessage = {};
  newUserExt.freeMessage.fya = true;
  const params = {
    a: "sendUsersExt",
    hid, bid, uid,
    ext: JSON.stringify(newUserExt)
  }
  const res = await univApiCall(params);
  if(res?.data?.result){
    dispatch(setStore({users: newUsers}));
    return true;
  }
  return false;
}

const handleFYAOff = async(uid, users, hid, bid, dispatch) => {
  const newUsers = JSON.parse(JSON.stringify(users));
  const targetUserIndex = newUsers.findIndex(prevUser => prevUser.uid === uid);
  if(!newUsers[targetUserIndex]?.ext) newUsers[targetUserIndex].ext = {};
  const newUserExt = newUsers[targetUserIndex].ext;
  if(!newUserExt.freeMessage) newUserExt.freeMessage = {};
  newUserExt.freeMessage.fya = false;
  const params = {
    a: "sendUsersExt",
    hid, bid, uid,
    ext: JSON.stringify(newUserExt)
  }
  const res = await univApiCall(params);
  if(res?.data?.result){
    dispatch(setStore({users: newUsers}));
    return true;
  }
  return false;
}

export const useTargetUser = () => {
  const {uid} = useParams();
  const targetUsers = useFreeMessageUsers();
  const targetUid = uid ?? sessionStorage.getItem(FREETALK_SELECT_USER_SESSIONSTORAGE_KEY) ?? targetUsers?.[0]?.uid;
  const targetUser = targetUsers.find(uDt => uDt.uid == targetUid);
  return targetUser;
}

export const useFreeMessageUsers = () => {
  const service = useSelector(state => state.service);
  const serviceItems = useSelector(state => state.serviceItems);
  const displayService = service ?service :serviceItems[0];
  const classroom = useSelector(state => state.classroom) ?? "";
  const users = useSelector(state => state.users);
  const filteredUsers = users.filter(user => {
    // faptokenがあるか？
    if(!user?.faptoken) return false;
    // LINE利用ユーザーか？
    if(!user?.ext?.line?.id) return false;
    // 表示しているサービスに属しているか？
    if(!(user?.service ?? "").includes(displayService)) return false;
    // 表示しているクラスに属しているか？
    if(!(user?.classroom ?? "").includes(classroom)) return false;
    return true;
  });
  const sortedUsers = filteredUsers.sort((a, b)=>(a.sindex > b.sindex? 1: -1));
  return sortedUsers;
}

const useMakeUserContentDtsStorageKey = () => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const key = hid+bid+"fMsgContentDts";
  return key;
}

const useUserContentDtsWithLocalStorage = () => {
  const isFirstRendering = useRef(true);
  const freeMessageUsers = useFreeMessageUsers();
  const initDts = freeMessageUsers.map(user => ({"uid": user.uid}));
  const key = useMakeUserContentDtsStorageKey();
  const [userContentDts, setUserContentDts] = useState((() => {
    try{
      const item = localStorage.getItem(key);
      const localStorageDts = item ?JSON.parse(item) :[];
      const newUserContentDts = initDts.map(initDt => {
        const uid = initDt.uid;
        const lsDt = localStorageDts.find(dt => dt.uid === uid);
        return lsDt ?? initDt;
      });
      return newUserContentDts;
    }catch(error){
      return initDts;
    }
  }));

  useEffect(() => {
    if(isFirstRendering.current){
      isFirstRendering.current = false;
      return;
    }
    try {
      const serializedValue = JSON.stringify(userContentDts);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.log(error);
    }
  }, [userContentDts]);

  return [userContentDts, setUserContentDts];
}

const useStyles = makeStyles({
  UserSelect: {
    width: "25%", height: '80vh',
    overflowY: 'scroll',
    padding: 8,
    border: `1px solid ${teal[50]}`,
    '&::-webkit-scrollbar': {
      display: "none"
    },
    '& .contents': {
      '&:not(:last-child)': {
        marginBottom: 16
      },
      '& .contentsTitle': {
        fontSize: 14, color: teal[800],
        padding: '4px 8px',
      },
      '& .noneMessage': {
        fontSize: 14, opacity: 0.5,
        padding: 8
      }
    },
    "@media (max-width:959px)": {
      width: '100%'
    },
  },
  UserContent: {
    position: 'relative',
    minHeight: 56,
    padding: 8,
    borderRadius: 8,
    '& .timestamp': {
      fontSize: 10,
    },
    '& .name': {
      display: 'flex', alignItems: 'center',
      '& .fya': {
        fontSize: 10, color: '#fff', fontWeight: 'bold',
        backgroundColor: yellow[900],
        marginLeft: 4,
        padding: '2px 4px',
        borderRadius: 4
      },
    },
    '& .latestMessage': {
      height: 14,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      fontSize: 14, opacity: 0.5
    },
    '& .unreadCnt': {
      minWidth: 18,
      height: 18, lineHeight: "18px",
      padding: '0 4px',
      fontSize: 14, textAlign: 'center', color: "#fff",
      backgroundColor: teal[800],
      borderRadius: 9,
    },
    '& .userTabMenu': {
      display: 'none',
      position: 'absolute',
      top: '50%', right: 0,
      transform: 'translateY(-50%)',

    },
    '&:hover': {
      backgroundColor: grey[100],
      cursor: 'pointer',
      '& .timestamp': {display: 'none'},
      '& .userTabMenu': {display: 'block'},
      '& .unreadCnt': {display: 'none'},
    }
  },
  Title: {
    position: 'relative',
    width: '100%',
    backgroundColor: teal[800],
    color: '#fff',
    textAlign: 'center',
    padding: 8,
    '& .name': {
      minHeight: 16, fontSize: 16,
      marginBottom: 4
    },
    '& .pname': {
      minHeight: 14, fontSize: 14
    },
    '& .honorific': {
      fontSize: 12
    },
  },
  FYAButton: {
    fontSize: 12,
    border: `1px solid`,
    padding: '4px 8px', borderRadius: 16,
    '&.on': {
      color: '#fff', fontWeight: 'bold',
      borderColor: yellow[900],
      backgroundColor: yellow[900],
    },
    '&.off': {
      color: grey[500],
      borderColor: grey[500],
    },
    '&:hover': {
      cursor: 'pointer',
      '&.on': {
        color: '#fff',
        borderColor: yellow[800],
        backgroundColor: yellow[800],
      },
      '&.off': {
        color: grey[400],
        borderColor: grey[400],
      },
    }
  }
});

export const UserFYAButton = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const users = useSelector(state => state.users);
  const {uid} = props;
  const user = users.find(u => u.uid === uid);
  const isFYA = user?.ext?.freeMessage?.fya ?? false;
  
  const handleClick = () => {
    if(isFYA){
      handleFYAOff(uid, users, hid, bid, dispatch);
    }else{
      handleFYAOn(uid, users, hid, bid, dispatch);
    }
  }

  return(
    <div
      className={`${classes.FYAButton} ${isFYA ?"on" :"off"}`}
      onClick={handleClick}
    >
      要対応
    </div>
  )
}

const UserTabMenu = (props) => {
  const disabled = useDispatch();
  const users = useSelector(state => state.users);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const {uid} = props;
  const user = users.find(u => u.uid === uid);
  const isFYA = user?.ext?.freeMessage?.fya ?? false;
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  const handleFYAOn = () => {
    const newUsers = JSON.parse(JSON.stringify(users));
    const targetUserIndex = newUsers.findIndex(prevUser => prevUser.uid === uid);
    if(!newUsers[targetUserIndex]?.ext) newUsers[targetUserIndex].ext = {};
    const newUserExt = newUsers[targetUserIndex].ext;
    if(!newUserExt.freeMessage) newUserExt.freeMessage = {};
    newUserExt.freeMessage.fya = true;
    const params = {
      a: "sendUsersExt",
      hid, bid, uid,
      ext: JSON.stringify(newUserExt)
    }
    univApiCall(params).then(res => {
      if(res?.data?.result){
        disabled(setStore({users: newUsers}));
      }
    });
  }

  const handleFYAOff = () => {
    const newUsers = JSON.parse(JSON.stringify(users));
    const targetUserIndex = newUsers.findIndex(prevUser => prevUser.uid === uid);
    if(!newUsers[targetUserIndex]?.ext) newUsers[targetUserIndex].ext = {};
    const newUserExt = newUsers[targetUserIndex].ext;
    if(!newUserExt.freeMessage) newUserExt.freeMessage = {};
    newUserExt.freeMessage.fya = false;
    const params = {
      a: "sendUsersExt",
      hid, bid, uid,
      ext: JSON.stringify(newUserExt)
    }
    univApiCall(params).then(res => {
      if(res?.data?.result){
        disabled(setStore({users: newUsers}));
      }
    });
  }

  return (
    <div className="userTabMenu" onClick={(e) => e.stopPropagation()}>
      <IconButton
        onClick={handleClick}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          style: {
            maxHeight: 48 * 3,
            width: '20ch',
          },
        }}
      >
        {!isFYA &&(
          <MenuItem key="要対応オン" onClick={handleFYAOn}>
            要対応オン
          </MenuItem>
        )}
        {isFYA &&(
          <MenuItem key="要対応オフ" onClick={handleFYAOff}>
            要対応オフ
          </MenuItem>
        )}
      </Menu>
    </div>
  );
}

const UserContent = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const {uid} = useParams();
  const targetUsers = useFreeMessageUsers();
  const targetUser = useTargetUser() ?? {}
  const selectUid = targetUser.uid;
  const {user, userContentDts, setUserContentDts} = props;
  const targetUid = user.uid;
  const {setMessageBoxLoading} = useContext(LoadingContext);
  const {db} = useContext(FireBaseRefContext);
  const messagesRef = collection(db, hid, bid, String(targetUid), "data", "messages");
  const [initLoading, setInitLoading] = useState(true);
  const isFYA = user?.ext?.freeMessage?.fya ?? false;
  
  const contentDt = userContentDts.find(dt => dt.uid === targetUid);
  const latestData = contentDt.latestData ?? {};
  const unreadCnt = contentDt.unreadCnt ?? 0;

  useEffect(() => {
    const q = latestData.timestamp && latestData.id
      ?query(messagesRef, where("timestamp", ">=", latestData.timestamp), where("id", "!=", latestData.id), orderBy("timestamp", "desc"), limit(1))
      :query(messagesRef, orderBy("timestamp", "desc"), limit(1));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if(!querySnapshot.empty){
        let data = null;
        querySnapshot.forEach(doc => data = doc.data());
        if(data){
          setUserContentDts(prevUserContentDts => {
            const newUserContentDts = [...prevUserContentDts];
            const contentDt = newUserContentDts.find(dt => dt.uid === targetUid);
            contentDt.latestData = data;
            return newUserContentDts;
          });
        }
      }
      setInitLoading(false);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // 未読メッセージ件数を取得
  useEffect(() => {
    // uidで絞る
    const q = query(messagesRef, where("read", "==", false), where("from", "==", "user"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let cnt = 0;
      if(!querySnapshot.empty) querySnapshot.forEach(_ => cnt++);
      setUserContentDts(prevUserContentDts => {
        const newUserContentDts = [...prevUserContentDts];
        const contentDt = newUserContentDts.find(dt => dt.uid === user.uid);
        contentDt.unreadCnt = cnt;
        return newUserContentDts;
      });
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if(initLoading) return(
    <div className={classes.UserContent} style={{position: 'relative'}}>
      <CircularProgress
        color='primary'
        style={{
          width: 20, height: 20,
          position: 'absolute',
          top: 0, right: 0, bottom: 0, left: 0,
          margin: "auto",
        }}
      />
    </div>
  );

  const handleClick = () => {
    const uid = user.uid;
    if(uid === selectUid) return;
    sessionStorage.setItem(FREETALK_SELECT_USER_SESSIONSTORAGE_KEY, uid);
    history.push(`/contactbook/message/${uid}/`);
    setMessageBoxLoading(true);
    if(props.handleClick) props.handleClick();
  }

  const dateObj = new Date(latestData.timestamp);
  const month = String(dateObj.getMonth()+1).padStart(2, '0');
  const date = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const now = new Date();
  const isToday = now.toDateString() === dateObj.toDateString();
  
  const messageType = latestData.type;

  return(
    <div
      className={classes.UserContent}
      style={user.uid===selectUid ?{backgroundColor: grey[200]} :{}}
      onClick={handleClick}
    >
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <div className="name">
          {user.name}
          {isFYA &&<span className="fya">要対応</span>}
        </div>
        {isToday &&<div className="timestamp">{latestData.timestamp ?`${hours}:${minutes}` :""}</div>}
        {!isToday &&<div className="timestamp">{latestData.timestamp ?`${month}/${date}` :""}</div>}
        <UserTabMenu uid={user.uid} />
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4}}>
        {messageType==="system" &&<div className="latestMessage">{latestData.message ?? ""}</div>}
        {messageType==="text" &&<div className="latestMessage">{latestData.message ?? ""}</div>}
        {messageType==="sticker" &&<div className="latestMessage">LINEスタンプ</div>}
        {messageType==="image" &&<div className="latestMessage">画像</div>}
        {Boolean(unreadCnt) &&<div className="unreadCnt">{unreadCnt}</div>}
      </div>
    </div>
  )
}

const UserUnreadContent = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const freeMessageUsers = useFreeMessageUsers();
  const {contentDt} = props;
  const unreadCnt = contentDt.unreadCnt ?? 0;
  const latestData = contentDt.latestData ?? {};
  const user = freeMessageUsers.find(uDt => uDt.uid === contentDt.uid);
  const targetUid = user.uid;
  const {setMessageBoxLoading} = useContext(LoadingContext);
  const {uid} = useParams();
  const targetUsers = useFreeMessageUsers();
  const selectUid = uid ?? targetUsers[0].uid;
  const isFYA = user?.ext?.freeMessage?.fya ?? false;

  if(unreadCnt === 0) return null;

  const dateObj = new Date(latestData.timestamp);
  const month = String(dateObj.getMonth()+1).padStart(2, '0');
  const date = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const now = new Date();
  const isToday = now.toDateString() === dateObj.toDateString();

  const handleClick = () => {
    const uid = user.uid;
    if(uid === selectUid) return;
    sessionStorage.setItem(FREETALK_SELECT_USER_SESSIONSTORAGE_KEY, uid);
    history.push(`/contactbook/message/${uid}/`);
    setMessageBoxLoading(true);
    if(props.handleClick) props.handleClick();
  }

  return(
    <div
      className={classes.UserContent}
      style={user.uid===selectUid ?{backgroundColor: grey[200]} :{}}
      onClick={handleClick}
    >
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <div className="name">
          {user.name}
          {isFYA &&<span className="fya">要対応</span>}
        </div>
        {isToday &&<div className="timestamp">{latestData.timestamp ?`${hours}:${minutes}` :""}</div>}
        {!isToday &&<div className="timestamp">{latestData.timestamp ?`${month}/${date}` :""}</div>}
        <UserTabMenu uid={user.uid} />
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4}}>
        <div className="latestMessage">{latestData.message ?? ""}</div>
        {Boolean(unreadCnt) &&<div className="unreadCnt">{unreadCnt}</div>}
      </div>
    </div>
  )
}

const UserFYAContent = (props) => {
  const classes = useStyles();
  const history = useHistory();
  const freeMessageUsers = useFreeMessageUsers();
  const {contentDt} = props;
  const unreadCnt = contentDt.unreadCnt ?? 0;
  const latestData = contentDt.latestData ?? {};
  const user = freeMessageUsers.find(uDt => uDt.uid === contentDt.uid);
  const targetUid = user.uid;
  const {setMessageBoxLoading} = useContext(LoadingContext);
  const {uid} = useParams();
  const targetUsers = useFreeMessageUsers();
  const selectUid = uid ?? targetUsers[0].uid;
  const isFYA = user?.ext?.freeMessage?.fya ?? false;

  const dateObj = new Date(latestData.timestamp);
  const month = String(dateObj.getMonth()+1).padStart(2, '0');
  const date = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const now = new Date();
  const isToday = now.toDateString() === dateObj.toDateString();

  const handleClick = () => {
    const uid = user.uid;
    if(uid === selectUid) return;
    sessionStorage.setItem(FREETALK_SELECT_USER_SESSIONSTORAGE_KEY, uid);
    history.push(`/contactbook/message/${uid}/`);
    setMessageBoxLoading(true);
    if(props.handleClick) props.handleClick();
  }

  return(
    <div
      className={classes.UserContent}
      style={user.uid===selectUid ?{backgroundColor: grey[200]} :{}}
      onClick={handleClick}
    >
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <div className="name">
          {user.name}
          {isFYA &&<span className="fya">要対応</span>}
        </div>
        {isToday &&<div className="timestamp">{latestData.timestamp ?`${hours}:${minutes}` :""}</div>}
        {!isToday &&<div className="timestamp">{latestData.timestamp ?`${month}/${date}` :""}</div>}
        <UserTabMenu uid={user.uid} />
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4}}>
        <div className="latestMessage">{latestData.message ?? ""}</div>
        {Boolean(unreadCnt) &&<div className="unreadCnt">{unreadCnt}</div>}
      </div>
    </div>
  )
}

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const UserSelect = () => {
  const isLimit959px = useMediaQuery("(max-width:959px)");
  const classes = useStyles();
  const freeMessageUsers = useFreeMessageUsers();
  const [userContentDts, setUserContentDts] = useUserContentDtsWithLocalStorage();
  const [dialogOpen, setDialogOpen] = useState(false);

  const targetUser = useTargetUser() ?? {};

  const contents = freeMessageUsers.map((user, i) => (
    <UserContent
      key={`userContent${user.uid}`}
      user={user}
      userContentDts={userContentDts}
      setUserContentDts={setUserContentDts}
      handleClick={() => setDialogOpen(false)}
    />
  )).filter(x => x);

  const unreadContents = userContentDts.filter(contentDt => {
    return Boolean(contentDt.unreadCnt);
  }).sort((a, b) => {
    return a.latestData?.timestamp < b.latestData?.timestamp ?1 :-1;
  }).map(contentDt => (
    <UserUnreadContent
      key={`userUnreadContent${contentDt.uid}`}
      contentDt={contentDt}
      handleClick={() => setDialogOpen(false)}
    />
  )).filter(x => x);

  const fyaContents = userContentDts.filter(contentDt => {
    const user = freeMessageUsers.find(u => u.uid === contentDt.uid);
    if(!user?.ext?.freeMessage?.fya) return false;
    return true;
  }).map(contentDt => (
    <UserFYAContent
      key={`userFYAContent${contentDt.uid}`}
      contentDt={contentDt}
      handleClick={() => setDialogOpen(false)}
    />
  )).filter(x => x);

  if(isLimit959px){
    return(
      <div>
        <div className={classes.Title}>
          <div style={{position: 'absolute', top: 0, left: 0}}>
            <IconButton onClick={() => setDialogOpen(true)}>
              <AutorenewIcon style={{color: '#fff'}} />
            </IconButton>
          </div>
          <div className='name'>
            {targetUser.name ?targetUser.name :""}
            {Boolean(targetUser.name) &&<span className='honorific'>さま</span>}
          </div>
          <div className='pname'>
            {targetUser.pname ?targetUser.pname :""}
            {Boolean(targetUser.pname) &&<span className='honorific'>さま</span>}
          </div>
          <div style={{position: 'absolute', top: '50%', right: '8px', transform: 'translateY(-50%)'}}>
            <UserFYAButton uid={targetUser?.uid} />
          </div>
        </div>
        <Dialog fullScreen open={dialogOpen} onClose={() => setDialogOpen(false)} TransitionComponent={Transition}>
          <AppBar style={{position: 'relative', marginBottom: 8}}>
            <Toolbar>
              <IconButton edge="start" color="inherit" onClick={() => setDialogOpen(false)} aria-label="close">
                <CloseIcon />
              </IconButton>
              <Typography variant="h6" className={classes.title}>
                トーク選択
              </Typography>
            </Toolbar>
          </AppBar>
          <div className={classes.UserSelect} style={{display: 'contents'}}>
              <div className="contents">
                <div className='contentsTitle'>新着トーク</div>
                {unreadContents.length ?unreadContents :<div className='noneMessage'>新着トークはありません。</div>}
              </div>
              {fyaContents.length &&<div className="contents">
                <div className='contentsTitle'>要対応</div>
                {fyaContents}
              </div>}
              <div className="contents">
                <div className='contentsTitle'>利用者一覧</div>
                {contents.length ?contents :<div className='noneMessage'>利用者がいません。</div>}
              </div>
          </div>
        </Dialog>
      </div>
    )
  }

  return(
    <div className={classes.UserSelect}>
      <div className="contents">
        <div className='contentsTitle'>新着</div>
        {unreadContents.length ?unreadContents :<div className='noneMessage'>新着トークはありません。</div>}
      </div>
      {Boolean(fyaContents.length) &&<div className="contents">
        <div className='contentsTitle'>要対応</div>
        {fyaContents}
      </div>}
      <div className="contents">
        <div className='contentsTitle'>利用者一覧</div>
        {contents.length ?contents :<div className='noneMessage'>利用者がいません。</div>}
      </div>
    </div>
  )
}