import React from 'react';
import { useMediaQuery } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import teal from '@material-ui/core/colors/teal';
import blue from '@material-ui/core/colors/blue';
import grey from '@material-ui/core/colors/grey';
import red from '@material-ui/core/colors/red';
import { purple } from '@material-ui/core/colors';
import * as comMod from '../../commonModule';
import * as Actions from '../../Actions';
import { endPoint } from '../../albCommonModule';
import { LinksTab } from '../common/commonParts';

export const useSettingStyles = makeStyles((theme) => ({
  '@global': {
    // CSS マーカーは overlay で代替するためコメントアウト
  },
  extShortcutText:{
    width: '80%', margin: '-32px auto 0',
    padding:'16px 0 32px 40px',
    '& p': {lineHeight: 1.6}
  },
  linktabRoot: {
    marginTop: 47,
    '& > .MuiButton-text': {
      padding: 0,
    },
  },
  userIndexTfRoot:{
    '& .MuiInputBase-input': {
      padding: 0,
      textAlign: 'right',
    },
  },
  serviceTitle:{
    textAlign:'center', fontSize:'1.4rem', color:teal[800],
    margin:12,
  },
  serviceTitleJIHATSU:{
    textAlign:'center', fontSize:'1.4rem', color:blue[800],
    margin:12,
  },
  serviceTitleHOHOU:{
    textAlign:'center', fontSize:'1.4rem', color:purple[800],
    margin:12,
  },
  innerTitle0 :{
    background: teal[50], borderBottom: "1px solid" + teal[800],
    color: teal[600],
    fontSize: '.8rem', padding:8,
  },
  innerTitle1 :{
    background: blue[50], borderBottom: "1px solid" + blue[800],
    color: blue[600],
    fontSize: '.8rem', padding:8,
  },
  innerTitle2 :{
    background: grey[50], borderBottom: "1px solid" + grey[800],
    color: grey[600],
    fontSize: '.8rem', padding:8,
  },
  innerContent:{padding: 8,},
  bankInfoTitle: {
    padding: 8, paddingBottom:2, borderBottom: teal[200] + '90 1px solid',
    color: teal[600], fontSize: '.8rem',
    cursor: 'pointer',
    '& .delete': {color: red[800], fontSize: '1.0rem'}
  },
  spacer:{height: 16},
  bancInfoDelete: {
    textAlign: 'right',
    '& .MuiButton-root': {color: red[600]},
    '& .MuiButton-startIcon': {color: red[200]},
  },
  clasroomTitle: {
    paddingTop: 8, paddingBottom: 12, 
    textAlign: 'center', color: red[800], fontSize: '1.2rem',
    '& span': {fontSize: '.8rem', color: grey[800], marginInlineEnd: 16}
  },
  hideaddiction: {
    textAlign: 'center',
    '& .MuiSvgIcon-root': {color: teal[600]}
  },
  formMapRoot: {
    position: 'fixed',
    top: 88,
    right: 12,
    width: 180,
    maxHeight: 'calc(100vh - 160px)',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: 6,
    boxShadow: '0 2px 2px rgba(0,0,0,0.12)',
    padding: 6,
    zIndex: 2,
  },
  formMapEmpty: {
    fontSize: '.75rem',
    color: grey[600],
    padding: '8px 4px',
  },
  formMapItem: {
    cursor: 'pointer',
    padding: '6px',
    borderBottom: `1px dashed ${grey[200]}`,
    '&:hover': {background: grey[50]},
  },
  formMapItemRow: {
    fontSize: '.72rem',
    color: grey[700],
    lineHeight: 1.4,
  },
  formMapItemRowActive: {
    color: teal[700],
    fontWeight: 'bold',
  },
  formMapOverlayMarker: {
    position: 'fixed',
    width: 0,
    height: 0,
    borderTop: '30px solid transparent',
    borderBottom: '30px solid transparent',
    borderLeft: `12px solid ${teal[400]}`,
    pointerEvents: 'none',
    zIndex: 3,
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
  },
}));

/**
 * 設定ページ共通のナビゲーションリンクタブ
 */
export const Links = () => {
  const limit500px = useMediaQuery("(max-width:500px)");
  const account = useSelector(state => state.account);
  const permission = comMod.parsePermission(account)[0][0];
  
  if (permission < 90) return null;
  
  const prms = [
    { link: "/setting", label: "基本", hide: limit500px },
    { link: "/setting/schedule", label: "予定実績関連", hide: limit500px },
    { link: "/setting/reg", label: "他事業所・市区町村", hide: limit500px },
    { link: "/setting/addiction", label: "請求・加算", hide: limit500px },
    { link: "/setting/others", label: "その他" },
  ];
  
  return (
    <LinksTab menu={prms} style={{left: 0}} />
  );
};

// Storeのstate usersを更新する
export const updateToSotedUsers = (prms) => {
  const {
    susers, users, dispatch, 
  } = prms;
  // ソート済みユーザーリストからインデックスを取得して
  // ユーザーにセット
  const newUsers = users.map((e, i) => {
    const ndx = susers.findIndex(_ => e.uid === _.uid);
    e.sindex = susers[ndx].sindex;
    return e;
  });
  newUsers.sort((a, b) => (parseInt(a.sindex) - parseInt(b.sindex)));
  dispatch(Actions.updateUsersAll(newUsers));
};

// ユーザーインデックスを更新する
export async function requestUserIndexUpdate (prms){
  const {
    susers, hid, bid, setres
  } = prms;
  
  // dbに送信するための配列作成
  const indexset = susers.map(e=>{
    return [e.uid, e.sindex];
  });
  const jindexset = JSON.stringify(indexset);
  // dbのアップデート
  let res;
  const urlPrms = { 
    hid, bid, indexset: jindexset, a: 'sendUsersIndex'
  };
  try {
    res = await axios.post(endPoint(), comMod.uPrms(urlPrms));
    if (!res.data.resulttrue > 0 || res.data.resultfalse) {
      throw new Error(res);
    }
    setres(res);
  }
  catch {
    setres(res);
  }
}

export const userLstForSort = (users, order = 0, svcOrder = 0) => {
  if (!Array.isArray(users))  return [];
  const tmp = [...users];
  const sOder = parseInt(svcOrder);
  if (parseInt(order) === 0){
    tmp.sort((a, b) => {
      if (a.service > b.service && sOder === 1)  return 1
      if (a.service < b.service && sOder === 1)  return -1
      if (a.service < b.service && sOder === 2)  return 1
      if (a.service > b.service && sOder === 2)  return -1
    });
  }
  if (parseInt(order) === 1){
    tmp.sort((a, b) => {
      if (a.service > b.service && sOder === 1)  return 1
      if (a.service < b.service && sOder === 1)  return -1
      if (a.service < b.service && sOder === 2)  return 1
      if (a.service > b.service && sOder === 2)  return -1
      if (a.ageNdx > b.ageNdx) return 1;  
      if (a.ageNdx < b.ageNdx) return -1;  
      if (a.sindex > b.sindex) return 1;
      if (a.sindex < b.sindex) return -1;
    });
  }
  else if (parseInt(order) === 2){
    tmp.sort((a, b) => {
      if (a.service > b.service && sOder === 1)  return 1
      if (a.service < b.service && sOder === 1)  return -1
      if (a.service < b.service && sOder === 2)  return 1
      if (a.service > b.service && sOder === 2)  return -1
      if (a.startDate > b.startDate) return 1
      if (a.startDate < b.startDate) return -1
      if (a.sindex > b.sindex) return 1;
      if (a.sindex < b.sindex) return -1;
    });
  }
  else if (parseInt(order) === 3){
    tmp.sort((a, b) => {
      if (a.service > b.service && sOder === 1)  return 1
      if (a.service < b.service && sOder === 1)  return -1
      if (a.service < b.service && sOder === 2)  return 1
      if (a.service > b.service && sOder === 2)  return -1
      if (a.belongs1 > b.belongs1) return 1
      if (a.belongs1 < b.belongs1) return -1
      if (a.sindex > b.sindex) return 1;
      if (a.sindex < b.sindex) return -1;
    });
  }
  else if (parseInt(order) === 4){
    tmp.sort((a, b) => {
      if (a.service > b.service && sOder === 1)  return 1
      if (a.service < b.service && sOder === 1)  return -1
      if (a.service < b.service && sOder === 2)  return 1
      if (a.service > b.service && sOder === 2)  return -1
      if (a.kana > b.kana) return 1
      if (a.kana < b.kana) return -1
      if (a.sindex > b.sindex) return 1;
      if (a.sindex < b.sindex) return -1;
    });
  }
  else if (parseInt(order) === 5){
    tmp.sort((a, b) => {
      if (a.service > b.service && sOder === 1)  return 1
      if (a.service < b.service && sOder === 1)  return -1
      if (a.service < b.service && sOder === 2)  return 1
      if (a.service > b.service && sOder === 2)  return -1
      if (a.classroom > b.classroom) return 1
      if (a.classroom < b.classroom) return -1
      if (a.sindex > b.sindex) return 1;
      if (a.sindex < b.sindex) return -1;
    });
  }
  return tmp.map((e, i)=>{
    e.sindex = i * 10 + 100;
    return {
      sindex: e.sindex,
      ageStr: e.ageStr,
      ageNdx: e.ageNdx,
      belongs1: e.belongs1,
      classroom: e.classroom,
      name: e.name,
      kana: e.kana,
      service: e.service,
      uid: e.uid,
      startDate: e.startDate,
    };
  });
};
