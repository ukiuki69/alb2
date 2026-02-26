import React, { useEffect, useState } from 'react';
import { getLodingStatus } from "../../commonModule";
import EsignList from "../common/EsignList";
import axios from 'axios';
import { useSelector } from 'react-redux';
import { LoadingSpinner } from '../common/commonParts';
import { RepportsLinksTab } from './Reports';
import { makeStyles } from '@material-ui/core';
import { getTeikyouJissekiSchedule } from './TeikyouJisseki2024';

const MAX_RETRY = 5;

const fetchTeikyouJissekiDailySign = async(hid, bid, stdDate, uid) => {
  const url = "https://houday.rbatos.com/api/uploadSignatureImg.php";
  const directory = ["teikyuouJisseki", hid, bid, uid, stdDate];
  const params = new FormData();
  params.append('directory', JSON.stringify(directory));
  params.append('list', 1);
  const headers = {'content-type': 'multipart/form-data'}

  const directoryPath = directory.reduce((prevDirectoryPath, path) => {
    return `${prevDirectoryPath}/${path}`;
  }, "https://houday.rbatos.com/signature");

  let isFailed = false;
  for(let retry=0; retry<MAX_RETRY; retry++){
    try{
      const res = await axios.post(url, params, headers);
      // 成功
      const files = res?.data?.files ?? [];
      const imgUrls = files.map(filePath => `${directoryPath}/${filePath}`);
      return imgUrls;
    }catch(error){
      console.error(`Error during attempt ${retry}:`, error);
      if(retry+1 === MAX_RETRY){
        // 繰り返し制限を超えた場合は、エラーとして返す。
        isFailed = true;
      }
    }
  }
  if(isFailed){
    // 失敗
    throw `FETCH API ERROR`;
  }
}

const useStyles = makeStyles({
  root: {
    margin: "84px 0 84px 61.25px",
    padding: '0 8px'
  }
})


const TeikyouJissekiEsignList = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {users, schedule, com, service, hid, bid, stdDate} = allState;
  const classes = useStyles();
  const [isFetchLoading, setIsFetchLoading] = useState(true);
  const [esignDt, setEsignDt] = useState({});

  useEffect(() => {
    if(!loadingStatus.loaded) return;
    (async() => {
      const targetSchedule = getTeikyouJissekiSchedule(schedule, com, service, users, stdDate);
      const newEsignDt = {};
      for(const user of users){
        const uid = user.uid;
        const esignImgUrls = await fetchTeikyouJissekiDailySign(hid, bid, stdDate, uid);
        const sch = targetSchedule["UID"+uid] ?? {};
        const newUserEsignDt = Object.entries(sch).filter(([did, schDt]) => {
          if(!/^D\d{8}/.test(did)) return false;
          return true;
        }).reduce((prevNewUserEsignDt, [did, schDt]) => {
          const adjustedDid = did.match(/^D(\d{8})/)[0];
          const esignImgUrl = esignImgUrls.find(esignImgUrl => esignImgUrl.includes(adjustedDid));
          prevNewUserEsignDt[adjustedDid] = {esignImgUrl};
          return prevNewUserEsignDt;
        }, {});
        newEsignDt["UID"+uid] = newUserEsignDt;
      }
      setEsignDt(newEsignDt);
      setIsFetchLoading(false)
    })();
  }, [loadingStatus.loaded]);

  if(!loadingStatus.loaded || isFetchLoading) return(
    <LoadingSpinner />
  );

  return (
    <>
    <RepportsLinksTab />
    <div className={classes.root} >
      <EsignList esignDt={esignDt} />
    </div>
    </>
  )
}
export default TeikyouJissekiEsignList;