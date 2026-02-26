import React, { useEffect, useState } from 'react';
import { MainProseedOtherOfficeis } from './ProseedOtherOfficeis';
import { LoadErr, LoadingSpinner, PermissionDenied } from '../common/commonParts';
import { useSelector } from 'react-redux';
import { getLodingStatus, parsePermission } from '../../commonModule';

// 年間の売り上げを表示する
// MainProseedOtherOfficeisをコールする
const ProseedOneYear = ()=>{
  const allstate = useSelector(state=>state);
  const loadingStatus = getLodingStatus(allstate);
  const account = useSelector(state => state.account);
  const permission = parsePermission(account)[0][0];

  if (loadingStatus.loaded && permission >= 90){
    return(<>
      <MainProseedOtherOfficeis mode={'year'}/>
    </>)
  }
  else if (loadingStatus.error){
    return (<>
      <LoadErr loadStatus={loadingStatus} errorId={'E5967'} />
    </>)
  }
  else if (permission < 90) return <PermissionDenied marginTop='90'/>
  else{
    return(<>
     <LoadingSpinner/>
    </>)
  }
}
export default ProseedOneYear;