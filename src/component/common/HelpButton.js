import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import * as comMod from '../../commonModule';
import { makeStyles } from '@material-ui/core/styles';
import { IconButton } from "@material-ui/core";
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { useLocation } from 'react-router-dom';
import { seagull } from '../../modules/contants';

const useStyle = makeStyles({
  helpButton:{padding: 6, }
})

const HELP_LINKS = {
  "/proseed/upperlimit": "https://rbatos.com/lp/2022/06/14/jougenbasicsetting/",
  "/schedule": "https://rbatos.com/lp/2022/05/09/schedule-monthly/",
  "/schedule/weekly/": "https://rbatos.com/lp/2022/05/30/scheduleweek/",
  '/schedule/users/': 'https://rbatos.com/lp/2022/05/17/schedulebyuser/',
  '/schedule/calender/': 'https://rbatos.com/lp/2022/07/16/holidayssetting/',
  '/reports': 'https://rbatos.com/lp/2022/05/08/reports/',
  '/users': 'https://rbatos.com/lp/2022/07/16/helpindexofusers/',
  '/users/belongs': 'https://rbatos.com/lp/2022/07/16/helpindexofusers/',
  '/users/bankinfo': 'https://rbatos.com/lp/2022/07/16/helpindexofusers/',
  '/schedule/weekly/transfer/': 'https://rbatos.com/lp/2022/06/10/pickupanddropoff/',
}

const helpLinks = [
  {
    urlPtn: /^\/$/, 
    link: 'https://rbatos.com/lp/2024/09/12/%e3%83%98%e3%83%ab%e3%83%97%e3%82%a4%e3%83%b3%e3%83%87%e3%83%83%e3%82%af%e3%82%b9/',
  },
  {
    urlPtn: /^\/schedule/,
    link: 'https://rbatos.com/lp/2024/09/12/%e3%83%98%e3%83%ab%e3%83%97%e3%82%a4%e3%83%b3%e3%83%87%e3%83%83%e3%82%af%e3%82%b9/#%E4%BA%88%E5%AE%9A%E5%AE%9F%E7%B8%BE%E7%99%BB%E9%8C%B2',
  },
  {
    urlPtn: /^\/users/,
    link: 'https://rbatos.com/lp/2024/09/12/%e3%83%98%e3%83%ab%e3%83%97%e3%82%a4%e3%83%b3%e3%83%87%e3%83%83%e3%82%af%e3%82%b9/#%E5%88%A9%E7%94%A8%E8%80%85%E6%83%85%E5%A0%B1',
  },
  {
    urlPtn: /^\/dailyreport/,
    link: 'https://rbatos.com/lp/2024/09/12/%e3%83%98%e3%83%ab%e3%83%97%e3%82%a4%e3%83%b3%e3%83%87%e3%83%83%e3%82%af%e3%82%b9/#%E6%97%A5%E5%A0%B1',
  },
  {
    urlPtn: /^\/contactbook/,
    link: 'https://rbatos.com/lp/2024/09/12/%e3%83%98%e3%83%ab%e3%83%97%e3%82%a4%e3%83%b3%e3%83%87%e3%83%83%e3%82%af%e3%82%b9/#%E9%80%A3%E7%B5%A1%E5%B8%B3',
  },
  {
    urlPtn: /^\/billing\/userbilling/,
    link: 'https://rbatos.com/lp/2024/09/12/%e3%83%98%e3%83%ab%e3%83%97%e3%82%a4%e3%83%b3%e3%83%87%e3%83%83%e3%82%af%e3%82%b9/#%E5%8F%A3%E5%BA%A7%E6%8C%AF%E6%9B%BF',
  },
  {
    urlPtn: /^\/billing/,
    link: 'https://rbatos.com/lp/2024/09/12/%e3%83%98%e3%83%ab%e3%83%97%e3%82%a4%e3%83%b3%e3%83%87%e3%83%83%e3%82%af%e3%82%b9/#%E8%AB%8B%E6%B1%82%E5%87%A6%E7%90%86',
  },
  {
    urlPtn: /^\/account/,
    link: 'https://rbatos.com/lp/2024/09/12/%e3%83%98%e3%83%ab%e3%83%97%e3%82%a4%e3%83%b3%e3%83%87%e3%83%83%e3%82%af%e3%82%b9/#%E3%82%A2%E3%82%AB%E3%82%A6%E3%83%B3%E3%83%88',
  },
  {
    urlPtn: /^\/workshift/,
    link: 'https://rbatos.com/lp/2024/09/12/%e3%83%98%e3%83%ab%e3%83%97%e3%82%a4%e3%83%b3%e3%83%87%e3%83%83%e3%82%af%e3%82%b9/#%E3%82%B7%E3%83%95%E3%83%88%E4%BD%9C%E6%88%90',
  },
  {
    urlPtn: /^\/proseed/,
    link: 'https://rbatos.com/lp/2024/09/12/%e3%83%98%e3%83%ab%e3%83%97%e3%82%a4%e3%83%b3%e3%83%87%e3%83%83%e3%82%af%e3%82%b9/#%E5%A3%B2%E4%B8%8A%E7%AE%A1%E7%90%86',
  },
  {
    urlPtn: /^\/reports/,
    link: 'https://rbatos.com/lp/2024/09/12/%e3%83%98%e3%83%ab%e3%83%97%e3%82%a4%e3%83%b3%e3%83%87%e3%83%83%e3%82%af%e3%82%b9/#%E5%B8%B3%E7%A5%A8',
  },
  
]

const HelpButton = () => {
  const classes = useStyle();
  const account = useSelector(state => state.account);
  // const permission = comMod.parsePermission(account)[0][0];
  
  const ref = useLocation().pathname;
  // const help_url = Object.keys(HELP_LINKS).includes(ref) ?HELP_LINKS[ref] :null;
  const helpUrl = helpLinks.find(e=>ref.match(e.urlPtn))
  const handleClick = () => {
    if(!helpUrl) return;
    window.open(helpUrl.link, "_blank");
  }
  
  // if (permission !== 100) return null;
  if (seagull) return null;
  const buttonStyle = {color: "#eee", fontSize: 22, marginTop: -2}
  if(helpUrl){
    return(
      <IconButton type="button" className={classes.helpButton} onClick={handleClick}>
        <HelpOutlineIcon style={buttonStyle}/>
      </IconButton>
    )
  }else{
    return null
  }
}
export default HelpButton