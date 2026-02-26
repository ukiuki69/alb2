import React, { Profiler, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, } from 'react-router-dom';
import { makeStyles, useMediaQuery } from '@material-ui/core';
import { grey, teal } from '@material-ui/core/colors';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt } from "@fortawesome/free-regular-svg-icons";

import * as comMod from '../../commonModule'; 
import { menuItems } from '../../DrowerMenu';
import FeedRender from './FeedRender';
import SchSelectMonth from "../schedule/SchSelectMonth";
import { DisplayHintGroups } from "../common/DisplayHintGroupes";
import { faPenSquare, faUserEdit } from "@fortawesome/free-solid-svg-icons";
import { onRenderCallback } from '../../albCommonModule';
import DisplayTopPageMessages from '../Setting/DisplayTopPageMessage';
import { seagull } from '../../modules/contants';
import AnyFileUploadButton from '../common/AnyFileUploadButton';

const useStyles = makeStyles({
  headerMenu: {
    marginBottom: 16,
    display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
    position: 'sticky', top: 50, backgroundColor: "#fff",
    zIndex: 10,
    '& .icon':{
      width: 48,
      minWidth: 0,
      maxWidth: 80,
      transition: 'width 0.3s',
      overflow: 'visible',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      whiteSpace: 'nowrap',
      textOverflow: 'visible',
      color: teal[500],
      margin: 10,
      position: 'relative',
      '& .MuiSvgIcon-root':{
        fontSize: 36,
      },
      '& .short-label': {
        opacity: 1,
        transition: 'opacity 0.2s',
        marginTop: 12,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'visible',
        fontSize: 16,
        color: '#111',
      },
      '& .full-label': {
        opacity: 0,
        transition: 'opacity 0.2s',
        marginTop: 12,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        overflow: 'visible',
        fontSize: 16,
        color: teal[800],
        backgroundColor: teal[50],
        padding: '4px 8px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 10,
        position: 'absolute',
        bottom: -4,
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: 0,
      },
      '&:hover': {
        width: 48,
      },
      '&:hover .short-label': {
        opacity: 0,
      },
      '&:hover .full-label': {
        opacity: 1,
      },
    },
    '& .is-empty':{
      '@media (max-width: 1220px)':{
        width: '100px',
        margin: 4,
      },
      width: 0,
      height: 0,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      marginBottom: 0,
    }
  },
  headerMenuTest:{
    width: '100%',
    marginBottom: "32px",
    '& .iconContents':{
      width: '80%',
      margin: '0 auto',
      display: 'flex',
      flexWrap: 'wrap',
      '& .icon':{
        minWidth: 100,
        width: '10%',
        textAlign: 'center',
        color: teal[500],
        margin: '4px 0',
        '& .MuiSvgIcon-root':{
          fontSize: 36,
        }
      },
    },
  },
  houdayNewsContents:{
    margin: '10px auto',
    maxWidth: '904px',
    "@media (max-width:599px)": {
      width: '95%'
    },
    '& .card': {
      "@media (max-width: 620px)": {
        height: '100px',
      },
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '56px',
      padding: '8px',
      textDecoration: 'none',
      color: '#111',
      '& .main': {
        height: '90%',        
        display: 'flex',
        justifyContent: 'space-between',
        '& .text': {
          display: 'flex',
          flexDirection: 'column',
          paddingRight: '5px',
          '& .title': {
            marginBottom: '16px',
            fontSize: '18px',
            "@media (max-width: 620px)": {
              fontSize: '16px',
            },
            fontWeight: '500',
          },
          '& .about': {
            fontSize: '14px',
            color: grey[800],
            lineHeight: '1.6',
            "@media (max-width: 620px)": {
              display: 'none',
            }
          },
        },
        '& .img': {
          height: '112px',
          width: '112px',
          margin: '0 auto',
          "@media (max-width: 620px)": {
            width: '15%',
            height: 'auto',
          }
        },
      },

      '& .sub': {
        display: 'flex',
        fontSize: '12px',
        paddingTop: '16px',
        color: grey[600],
        alignItems: 'center',
        '& img': {
          marginRight: '5px',
        },
        '& div': {
          marginRight: '5px',
        },
      },
    },
    '& a:hover .title':{
      textDecoration: 'underline',
    },
  },
  home: {
    marginTop: 72,
    "@media (max-width:599px)": {
      width: '100%',
      minWidth: 0,
      margin: 0,
      marginTop: 120
    },
  }
})


const HaderMenu = () => {
  const classes = useStyles();
  const hist = useHistory();
  const account = useSelector(state=>state.account);
  const [permission, setPermission] = useState(0);
  useEffect(()=>{
    setPermission(comMod.parsePermission(account)[0][0]);
  },[account]);
  // menuItemsにhidStrを追加したため変更　2023/01/05　吉村
  const {hid} = account;
  const fMenuItems = menuItems.filter(e=>e.p<=permission)
  .filter(e=>(!e.hidStr || e.hidStr.split(',').includes(hid)));
  // const icon_link = menuItems.filter(e=>e.p<=permission).map((item, index) => {
  const icon_link = fMenuItems.map((item, index) => {
    // フォントオーサムを使うところ追加 2024/01/24 吉村
    const fontawesomeIconLabel = ['予定実績登録', '日報', '支援計画', '支援計画BETA'];
    const fontawesomeIconName = {
      予定実績登録: faCalendarAlt, 日報: faPenSquare, 
      支援計画: faUserEdit, '支援計画BETA': faUserEdit
    }
    if (item.hids && !item.hids.includes(account.hid)) return null;
    if(fontawesomeIconLabel.includes(item.label)){
      const fontAwesomeIconStyle = { fontSize: 30, padding: '3 4.875', marginBottom: 2};
      const iconName = fontawesomeIconName[item.label];
      return(
        <a className='icon ' onClick={e => hist.push(item.link)} key={"menu"+String(index)}>
          <FontAwesomeIcon icon={iconName} style={fontAwesomeIconStyle} />
          <p className="short-label">{item.shortLabel || item.label}</p>
          <p className="full-label">{item.label}</p>
        </a>
      )
    }
    return(
      <a className='icon ' onClick={e => hist.push(item.link)} key={"menu"+String(index)}>
        {item.icon}
        <p className="short-label">{item.shortLabel || item.label}</p>
        <p className="full-label">{item.label}</p>
      </a>
    )
  })

  return(
    <div className={classes.headerMenu}>
      {icon_link}
      {/* <CallDispHint/> */}
    </div>
  )
}

const HoudayNews = () => {
  const classes = useStyles();
  const limit599px = useMediaQuery("(max-width:599px)");
  const account = useSelector(state=>state.account);
  const permission = comMod.parsePermission(account)[0][0];
  const [feedRenderComplete, setFeedRenderComplete] = useState(false);

  return (
    <div className={`AppPage houdayNews ${classes.home}`}>
      {!limit599px &&<HaderMenu />}
      <SchSelectMonth />
      {!seagull &&
        <div style={ 
          limit599px ? {width: '90vw', margin: '0 auto'} : {width: 904, margin: '0 auto'}}
        >
          <DisplayTopPageMessages />
        </div>
      }
      <FeedRender onLoadComplete={() => setFeedRenderComplete(true)} />
      {feedRenderComplete && (
        <div style={{textAlign: 'center'}}>
          <AnyFileUploadButton />
        </div>
      )}
    </div>
  )
}
export default HoudayNews;