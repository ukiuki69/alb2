import React, { Profiler, useEffect, useRef, useState } from 'react';
import { makeStyles } from '@material-ui/core';
import { grey, teal } from '@material-ui/core/colors';
import { LoadingSpinner } from '../common/commonParts';
import logo from './alb_blog_logo.png';
import axios from 'axios';
import { getLodingStatus } from '../../commonModule';
import { checkValueType } from '../dailyReport/DailyReportCommon';
import { useSelector } from 'react-redux';
import { onRenderCallback } from '../../albCommonModule';
import { getLS, getLSTS, removeLocalStorageItem, setLS, setLSTS } from '../../modules/localStrageOprations';
import { endPoint, uPrms } from '../../modules/api';
import { SchInitilizer } from '../schedule/SchInitilizer';
import { seagull } from '../../modules/contants';

const DISPLAY_BLOGS_NUM = 3;
const EXCLUSION_IMG_LIST = ["https://rbatos.com/lp/wp-content/uploads/2022/04/a0518a0858b94b2e984274a68b9c39b9-1024x211.jpg"];

const useStyles = makeStyles({
  blogContainer: {
    display: 'flex',
    flexDirection: 'column',
    margin: '10px auto',
    maxWidth: '904px',
    overflow: 'hidden',
    marginBottom: 32,
    "@media (max-width:599px)": {
      width: '95%'
    },
  },
  blogCard: {
    border: '1px',
    marginBottom: '56px',
    padding: '8px',
    textDecoration: 'none',
    '& .blogCardContainer':{
      display: 'flex',
      '& .img': {
        width:112, height:112,
        "@media (max-width:599px)": {
          width: 92, height: 92
        },
      },
      '& .main':{
        display: 'flex',
        flexDirection: 'column',
        paddingLeft: '16px',
        '& .text':{
          display: 'flex',
          flexDirection: 'column',
          '& .title': {
            marginBottom: '16px',
            fontSize: '18px',
            fontWeight: '500',
            "@media (max-width:599px)": {
              fontSize: 16
            },
          },
          '& .about': {
            fontSize: '14px',
            color: grey[800],
            lineHeight: '1.6',
            display: "-webkit-box",
            "-webkit-line-clamp": "2",
            "-webkit-box-orient": "vertical",
            overflow: "hidden",
            "@media (max-width: 620px)": {
              display: 'none',
            }
          }
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
      }
    },
    '&:hover .title':{
      textDecoration: 'underline',
    },
  },
  feedHeader:{
    padding: 8, marginTop: 0, marginBottom: 16, 
    fontSize: 16, fontWeight: 200,
    color: teal[800], 
    borderBottom: '1px solid ' + teal[600],
    borderLeft: '2px solid ' + teal[600],
  }
})

const FeedRender = ({onLoadComplete}) => {
  const lsName = 'feedDtListLs';
  const classes = useStyles();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  // feedをローカルより取得
  const [feedDtList, setFeedDtList] = useState(getLSTS(lsName, 60 * 60) || {});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!loadingStatus.loaded) return;
  
    const controller = new AbortController(); // AbortController を作成
    const signal = controller.signal;
  
    const { update, help, management } = feedDtList;
  
    // データがそろっている場合は読み込み不要
    if ((update || []).length && (help || []).length && (management || []).length) {
      setLoading(false);
      if (onLoadComplete) onLoadComplete();
      return;
    }
  
    // if (getLS(lsLoading)) return;
  
    const f = async () => {
      try {
        const res = await axios.post(endPoint(), uPrms({
          a: 'fetchAnyState',
          hid: '',
          bid: '',
          date: '0000-00-00',
          item: 'rss_feed_data'
        }), { signal });
        const feedDtList = res?.data?.dt?.[0]?.state || {};
        if (res?.status === 200) {
          setFeedDtList({ ...feedDtList });
          setLoading(false);
          setLSTS(lsName, {...feedDtList})
          if (onLoadComplete) onLoadComplete();
        }
      } catch (error) {
        if (signal.aborted) {
          console.log("Fetch aborted due to timeout or component unmount.");
        } else {
          console.error("API fetch failed:", error);
        }
      }
    };
  
    // タイムアウト処理とリクエストの中断を結合
    const timeoutId = setTimeout(() => {
      f();
    }, 1000 * 1); // x秒後に実行
  
    signal.addEventListener("abort", () => {
      clearTimeout(timeoutId); // タイムアウトのキャンセル
    });
  
    return () => {
      controller.abort(); // リクエストとタイムアウトの両方をキャンセル
    };
  }, [loadingStatus.loaded, feedDtList, onLoadComplete]);
  

  if(!loadingStatus.loaded || loading) return(
    <>
    <LoadingSpinner />
    </>
  );
  const feed_nodes = Object.keys(feedDtList).reduce((result, key) => {
    if(!checkValueType(feedDtList[key], "Array")) return result;
    const filteredDtList = feedDtList[key].slice(0, DISPLAY_BLOGS_NUM);
    const nodes = filteredDtList.map((feedDt, i) => {
      const img = (feedDt?.img || []).length >= 2 && EXCLUSION_IMG_LIST.includes(feedDt?.img?.[0]) ?feedDt?.img?.[1] :feedDt?.img?.[0];
      return(
        <a href={feedDt.link} className={classes.blogCard} target='_blank' key={`${key}FeedNodes${i+1}`}>
          <div className='blogCardContainer'>
            <div style={{width: 92}}>
              <img src={img || logo} width="92" height="92" style={{margin: '0 auto', objectFit: 'cover'}}/>
            </div>
            <div className='main'>
              <div className='text'>
                <div className='title'>{feedDt?.title || "タイトル"}</div>
                <div className='about'>{feedDt?.text || "説明文"}</div>
              </div>
              <div className='sub'>
                <img src={logo} alt="ロゴ" width={16} height={16}/>
                <div className={"name"}>アルバトロスブログ</div>
              </div>
            </div>
          </div>
        </a>
      )
    })
    result[key] = nodes;
    return result
  }, {});
  if (seagull) return null;
  return(
    <>
    <div className={classes.blogContainer}>
      <h2 className={classes.feedHeader}>更新情報</h2>
      {checkValueType(feed_nodes.update, "Array")
        ? feed_nodes.update
        : <div>
            ブログ情報の取得に失敗しました。ページを再読込しても
            表示されない場合、しばらく時間を空けて再度お試しください。
          </div>
      }
    </div>
    <div className={classes.blogContainer}>
      <h2 className={classes.feedHeader}>新着ヘルプ</h2>
      {checkValueType(feed_nodes.help, "Array")
        ? feed_nodes.help
        : <div>
            ヘルプ情報の取得に失敗しました。ネットワーク環境や
            ブラウザのリロードをお試しください。
          </div>
      }
    </div>
    <div className={classes.blogContainer}>
      <h2 className={classes.feedHeader}>運営・ノウハウ</h2>
      {checkValueType(feed_nodes.management, "Array")
        ? feed_nodes.management
        : <div>
            運営・ノウハウ情報が取得できませんでした。しばらく
            待ってから再度アクセスしてください。
          </div>
      }
    </div>
    {/* <SchInitilizer /> */}
    </>
  )
}
export default FeedRender;