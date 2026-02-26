import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { getLodingStatus, randomStr } from "../../commonModule";
import { addDoc, collection, getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";

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

const usePushApiTest = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {hid, bid} = allState;

  useEffect(() => {
    (async () => {
      if(!loadingStatus.loaded) return;
      if(loadingStatus.error) return;
      if(Notification.permission !== 'granted'){
        console.log('通知APIがサポートされていません。');
        return;
      }
      if(!navigator.serviceWorker){
        console.log('ServiceWorkerがサポートされていません。');
        return;
      }
      // 既存のサービスワーカーを取得
      const prevRegistration = await navigator.serviceWorker.getRegistration('./serviceWorkerTest.js');
      if(!prevRegistration){
        const newRegistration = await navigator.serviceWorker.register('./serviceWorkerTest.js');
        if(!newRegistration){
          console.log('Service Workerの登録に失敗しました');
          return;
        }
        const prevSubscription = await newRegistration.pushManager.getSubscription();
        if(!prevSubscription){
          const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
          // 新規でユーザがプッシュサービスに加入し、subscriptionオブジェクトを取得
          const newSubscription = await newRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          });
          console.log("newSubscription", newSubscription);
          const app = initializeApp(FIREBASE_CONFIG);
          const db = getFirestore(app, "notification-subscriptions");
          const subscriptionsRef = collection(db, hid, bid, "subscriptions");
          await addDoc(subscriptionsRef, newSubscription.toJSON());
        }
      }
    })();
  }, [loadingStatus.loaded]);

};
export default usePushApiTest;