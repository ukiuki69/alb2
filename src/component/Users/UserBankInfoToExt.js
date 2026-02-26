import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getLodingStatus } from '../../commonModule';
import { univApiCall } from '../../albCommonModule';


const UserBankInfoToExt = () => {
  const allState = useSelector(state => state);
  const {hid, bid, users} = allState;
  const loadingStatus = getLodingStatus(allState);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!loadingStatus.loaded || loadingStatus.error || hasInitialized.current) return;
    
    hasInitialized.current = true;
    
  }, [users, loadingStatus, hid, bid]);


  return (<div>UserBankInfoToExt</div>);
};

export default UserBankInfoToExt;