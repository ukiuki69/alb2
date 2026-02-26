import React, { createContext, useEffect, useMemo, useState } from 'react';
import { makeStyles, useMediaQuery } from "@material-ui/core"
import { UserSelect } from "./UserSelect";
import { MessageBox } from "./MessageBox";
import { useSelector } from 'react-redux';
import { getLodingStatus } from '../../commonModule';
import { LoadingSpinner } from '../common/commonParts';
import { initializeApp } from "firebase/app";
import { collection, getFirestore } from "firebase/firestore";
import SnackMsg from '../common/SnackMsg';
import { CntbkLinksTab } from '../ContactBook/CntbkCommon';
import { useGetHeaderHeight } from '../common/Header';

const SIDEBAR_WIDTH = 61.25;

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB-Lj2ECjCYup2FqFGCp2r61U9yD5u5luY",
  authDomain: "albatross-432004.firebaseapp.com",
  projectId: "albatross-432004",
  storageBucket: "albatross-432004.appspot.com",
  messagingSenderId: "238548710535",
  appId: "1:238548710535:web:ceb3a1b4513826ee2bb422"
};
const app = initializeApp(FIREBASE_CONFIG, "messageApp");
const db = getFirestore(app, "message");

export const SnackMsgContext = createContext();
export const FireBaseRefContext = createContext();
export const LoadingContext = createContext();

export const useGetFireStoreMessagesRef = (db, uid) => {
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const ref = useMemo(() => collection(db, hid, bid, String(uid), "data", "messages"), [uid]);
  return ref;
}

const useStyles = makeStyles({
  AppPage: {
    "@media (min-width: 1080px)": {
      width: '90vw', maxWidth: 1080 + SIDEBAR_WIDTH,
      margin: '104px auto 0',
      paddingLeft: SIDEBAR_WIDTH,
      '& .mainContents': {
        display: 'flex',
      },
    },
    "@media (min-width: 960px) and (max-width: 1079px)": {
      width: '95vw',
      margin: '104px auto 0',
      '& .mainContents': {
        display: 'flex',
      },
    },
    "@media (min-width: 501px) and (max-width: 959px)": {
      height: 'calc(100dvh - 82px)',
      width: '100vw', marginTop: 82,
      '& .mainContents': {
        height: '100%'
      },
    },
    "@media (max-width: 500px)": {
      '& .mainContents': {
        height: '100%'
      },
    }
  }
});

export const FreeMessage = () => {
  const classes = useStyles();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const [snack, setSnack] = useState({});
  const [messageBoxLoading, setMessageBoxLoading] = useState(true);
  const headerHeight = useGetHeaderHeight();

  if(!loadingStatus.loaded) return(
    <>
    <CntbkLinksTab />
    <LoadingSpinner />
    </>
  );

  const appPageStyle = headerHeight
    ?{height: `calc(100dvh - ${headerHeight}px - 48px)`, marginTop: headerHeight} : {}; 

  return(
    <>
    <CntbkLinksTab />
    <div className={classes.AppPage} style={{...appPageStyle}}>
      <div className='mainContents'>
        <SnackMsgContext.Provider value={{setSnack}}>
        <FireBaseRefContext.Provider value={{db}}>
        <LoadingContext.Provider value={{messageBoxLoading, setMessageBoxLoading}}>
          <UserSelect />
          <MessageBox />
        </LoadingContext.Provider>
        </FireBaseRefContext.Provider>
        </SnackMsgContext.Provider>
      </div>
      <SnackMsg {...snack} />
    </div>
    </>
  )
}