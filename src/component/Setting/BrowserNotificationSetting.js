

import React, { useState, useEffect } from 'react';
import {Checkbox, FormControlLabel} from '@material-ui/core';
import SnackMsg from '../common/SnackMsg';
import { useSelector } from 'react-redux';
import { deleteDoc, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getLodingStatus, parsePermission } from '../../commonModule';
import { red } from '@material-ui/core/colors';

// VAPID キーを設定（サーバーから取得する必要があります）
const vapidPublicKey = 'BLjvjzI2zvR38tYGyckndzfvSMF4HZP2J7Lc8FPbUJH2ufx6KBmI6OIJKJ3aPr7jaVAC2LGvPjUffrVmAPcBAqc';
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB-Lj2ECjCYup2FqFGCp2r61U9yD5u5luY",
  authDomain: "albatross-432004.firebaseapp.com",
  projectId: "albatross-432004",
  storageBucket: "albatross-432004.appspot.com",
  messagingSenderId: "238548710535",
  appId: "1:238548710535:web:ceb3a1b4513826ee2bb422"
};

// Base64 エンコードされた VAPID キーを Uint8Array に変換
function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function sha256Hex(str) {
  const data = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const getOrInitFirebaseApp = () => {
  return (getApps && getApps().length) ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
}

export const initializeNotificationSubscribe = async(hid, bid) => {
  console.log('通知購読を初期化開始します。');
  try{
    // 機能サポート確認
    if(!('Notification' in window)){
      console.log('このブラウザは Notification API をサポートしていません。');
      return;
    }
    if(!('serviceWorker' in navigator)){
      console.log('このブラウザは Service Worker をサポートしていません。');
      return;
    }
    if(!('PushManager' in window)){
      console.log('このブラウザは Push API をサポートしていません。');
      return;
    }

    // 通知が未許可の場合は処理を行わない。
    if(Notification.permission === 'default'){
      return "default";
    }

    // firestoreに接続
    const app = getOrInitFirebaseApp();
    const db = getFirestore(app, 'notification-subscriptions');

    // 既存のサービスワーカーを取得
    const prevRegistration = await navigator.serviceWorker.getRegistration();

    if(Notification.permission === 'denied'){
      // 拒否されている場合は登録を解除
      if(prevRegistration){
        const subscription = await prevRegistration.pushManager.getSubscription();
        if(subscription){
          const endpointHash = await sha256Hex(subscription.endpoint);
          await deleteDoc(doc(db, hid, bid, 'subscriptions', endpointHash));
          try { await subscription.unsubscribe(); } catch {};
        }
        await prevRegistration.unregister();
      }
      return "denied";
    }

    // ない場合は新規登録
    if(!prevRegistration){
      await navigator.serviceWorker.register('/sw.js');
      console.log('サービスワーカー: 新規登録');
    }

    // サービスワーカーが準備できたら購読を取得
    const readyRegistration = await navigator.serviceWorker.ready;

    // 既存購読の取得
    let subscription = await readyRegistration.pushManager.getSubscription();

    // 無ければ新規購読
    if(!subscription){
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      console.log('購読: 新規発行');
    }

    const endpoint = subscription.endpoint;
    const endpointHash = await sha256Hex(endpoint);
    const docRef = doc(db, hid, bid, 'subscriptions', endpointHash);
    const snap = await getDoc(docRef);
    if(!snap.exists()){
      await setDoc(docRef, subscription.toJSON(), { merge: true });
      console.log('購読情報: 新規保存');
    }

    return "granted";
  }catch (err){
    console.error('通知購読初期化でエラー: ', err);
  }
};


const NotificationPermissionRequestCheckbox = (props) => {
  const {notificationPermission, setNotificationPermission, setSnack} = props;
  const handleChange = async() => {
    if(notificationPermission === "default"){
      // 通知許可未設定の場合は、通知権限を要求
      try {
        const result = await Notification.requestPermission();
        setNotificationPermission(result);
      } catch (error) {
        console.error('通知権限の要求に失敗しました:', error);
        throw error;
      }
    }else{
      setSnack({msg: 'ブラウザ設定から変更してください。', severity: 'warning', id: new Date().getTime()});
    }
  }
  return(
    <div>
      <FormControlLabel
        control={
          <Checkbox
            color='primary'
            checked={notificationPermission === "granted"}
            onChange={handleChange}
          />
        }
        label='この端末で通知を受け取る'
      />
    </div>
  )
}

/**
 * 通知の使用例を示すコンポーネント
 */
export const BrowserNotificationSetting = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {hid, bid, account} = allState;
  const albPermission = parsePermission(account)[0][0];
  const [snack, setSnack] = useState({});
  const [isSupported, setIsSupported] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);

  useEffect(() => {
    if(!window.location.href.includes("webpushtest")) return;
    if(albPermission < 100) return;
    setIsSupported('Notification' in window && navigator.serviceWorker && 'PushManager' in window);
    if(!loadingStatus.loaded) return;
    initializeNotificationSubscribe(hid, bid);
  }, [loadingStatus.loaded, notificationPermission]);

  if(!window.location.href.includes("webpushtest")) return null;
  if(albPermission < 100) return null;

  if(!isSupported) return(
    <div>このブラウザでは通知を受け取ることはできません。</div>
  )

  return(
    <>
    <div>
      <div>
        <NotificationPermissionRequestCheckbox
          notificationPermission={notificationPermission}
          setNotificationPermission={setNotificationPermission}
          setSnack={setSnack}
        />
      </div>
      <div style={{lineHeight: 1.5}}>
        この端末で通知を受け取ることができます。<br/>
        {notificationPermission==="denied" &&(
          "通知を受け取りたい場合は、ブラウザの通知設定を変更してください。"
        )}
        {notificationPermission==="granted" &&(
          "通知を受け取らない場合は、ブラウザの通知設定を変更してください。"
        )}
        {notificationPermission==="granted" &&(
          <div style={{color: red["A700"], fontSize: 12}}>
            ※通知を受け取れない場合は、OSの通知設定をご確認してください。
          </div>
        )}
      </div>
    </div>
    <SnackMsg {...snack} />
    </>
  )
};
export default BrowserNotificationSetting;