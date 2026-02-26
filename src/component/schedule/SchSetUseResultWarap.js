import { makeStyles } from '@material-ui/core';
import React, {useEffect, useState, } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useParams } from 'react-router';
import { getLodingStatus } from '../../commonModule';
import Proseed, { ProseedLinksTab } from '../Billing/Proseed';
import { GoBackButton, LinksTab, LoadErr, LoadingSpinner } from '../common/commonParts';
import SnackMsg from '../common/SnackMsg';
import { makeSchMenuFilter, menu, extMenu } from './Sch2';
import { SetUseResult } from './SchDaySetting';
import SchLokedDisplay from '../common/SchLockedDisplay';

const useStyles = makeStyles({
  root:{marginTop: 80, position: 'relative'}
});

const MainSetUseResultWrap = () => {
  const classes = useStyles();
  const location = useLocation();
  const ref = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const goback = searchParams.get('goback');

  const stdDate = useSelector(state=>state.stdDate);
  const style = {
    position: 'static', marginTop: 120, width: 180, 
    marginLeft: 'calc(50vw - 90px)',
  }
  // 親ページが違うときはlinkstabを切り替える
  const MenuSwitcher = () => {
    const menuFilter = makeSchMenuFilter(stdDate);
    if (ref.includes('schedule')){
      return (<LinksTab menu={menu} menuFilter={menuFilter} extMenu={extMenu} />)
    }
    if (ref.includes('proseed')){
      return (<ProseedLinksTab  />)

    }
      
  }
  return (<>
    {/* {parent === 'schedule' && <LinksTab menu={menu}/>}
    {parent === 'proseed' && <ProseedLinksTab/>} */}
    <MenuSwitcher/>
    <div className={classes.root}>
      <SetUseResult style={style} />
      {goback &&
        <GoBackButton posX={120} posY={0}/>
      }
    </div>
    <SchLokedDisplay/>
  </>)
}

export const SetUseResultWrap = () =>{
  const allstate = useSelector(state=>state);
  const loadingStatus = getLodingStatus(allstate);

  const [snack, setSnack] = useState({msg:'', severity: ''});
  const prms = useParams().prms;
  return(<>
    {(loadingStatus.loaded && !loadingStatus.error) && <>
      <MainSetUseResultWrap
        snack={snack} setSnack={setSnack} 
      />
    </>}
    {loadingStatus.error && 
      <LoadErr loadStatus={loadingStatus} errorId={'E42680'} />
    }
    {!loadingStatus.loaded &&
      <LoadingSpinner />
    }
    <SnackMsg {...snack} />

  </>)
}
export default SetUseResultWrap;
