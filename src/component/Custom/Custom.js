import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { getLodingStatus, parsePermission } from '../../commonModule';
import { LoadErr, LoadingSpinner, PermissionDenied } from '../common/commonParts';
import Wanpaku from "./Wanpaku";

// hidとコンポーネントを定義するオブジェクト
export const customList = [
  {hid: 'HvzyOPVT', name: '発達ワンパク会', component: <Wanpaku/>, p: 90},
]
// dropmenuで使うための配列にして返す
export const hidsForCustom = customList.map(e=>e.hid);

const MainCustom = () => {
  const allstate = useSelector(state=>state);
  const {account} = allstate;
  const {hid} = account;
  const permission = parsePermission(account)[0][0];
  const thisNode = customList.find(e=>e.hid === hid);
  const styleUndef = {maginTop: 180, left: 120}
  if (!thisNode){
    return (
      <div style={styleUndef}>
        定義された機能が見つかりません。
      </div>
    )
  }
  else if (thisNode.p > permission){
    return <PermissionDenied/>
  }
  else {
    return thisNode.component;
  }
}

export const Custom = () => {
  const allstate = useSelector(state=>state);
  const loadingStatus = getLodingStatus(allstate);
  const account = useSelector(state => state.account);
  const permission = parsePermission(account)[0][0];

  if (loadingStatus.loaded){
    return(<>
      <MainCustom />
    </>)
  }
  else if (loadingStatus.error){
    return (<>
      <LoadErr loadStatus={loadingStatus} errorId={'E34577'} />
    </>)
  }
  else{
    return(<>
     <LoadingSpinner/>
    </>)
  }

}
export default Custom;