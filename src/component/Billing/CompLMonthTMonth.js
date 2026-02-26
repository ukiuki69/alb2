import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator  } from "@fortawesome/free-solid-svg-icons";
import { Button, Checkbox, FormControlLabel, makeStyles } from "@material-ui/core";
import { blue, teal, yellow } from "@material-ui/core/colors";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux"
import { defaultTitle, endPoint, getFilteredUsers, getReportTitle } from '../../albCommonModule';
import { findDeepPath1, getLodingStatus, makeUrlSearchParams } from "../../commonModule";
import { DisplayInfoOnPrint, LoadErr, LoadingSpinner } from "../common/commonParts";
import { setBillInfoToSch } from "./blMakeData";
import { ProseedLinksTab } from "./Proseed";

const useStyles = makeStyles({
  root: {
    width: 'fit-content', margin: '104px auto 40px', 
    '@media print': {marginTop: 16},
  },
  main: {
    '& .no': {width: '2rem'},
    '& .name': {width: '8rem'},
    '& .servName': {width: '23rem'},
    '& .tanniVal': {width: '4rem'},
    '& .tanniCnt': {width: '2rem'},
    '& .tanniNum': {width: '5rem'},
    '& .dateCol': {width: 'calc(11rem + 16px)'},
    '& .attnMark': {width: '1rem', fontSize: '0.5rem', color: blue[500]},
    '& .str': {textAlign: 'left'},
    '& .num': {textAlign: 'right'},
    '& .fixedHeader': {
      position: 'sticky',
      backgroundColor: 'white',
      top: 80,
      paddingTop: 16,
      borderBottom: `1px ${teal[800]} solid`,
      '@media print': {position: 'static'}
    },
    '& .dateHeader': {
      display: 'flex',
      textAlign: 'center',
      marginBottom: '16px',
      '& div': {marginRight: '8px'},
    },
    '& .header': {
      display: 'flex',
      textAlign: 'center',
      paddingBottom: '4px',
      '& div': {marginRight: '8px'},
    },
    '& .body': {
      marginTop: '8px',
    }
  },
  // oneUserComp: {
  //   display: 'flex',
  //   flexDirection: 'column',
  //   borderBottom: '1px #aaa solid',
  //   paddingBottom: '4px',
  //   marginBottom: '8px',
  //   '& .oneUserRow': {
  //     display: 'flex',
  //     margin: '4px 0',
  //     height: '1rem',
  //     '& div': {
  //       marginRight: '8px'
  //     },
  //   },
  //   '& .w5': {width: '5%'},
  //   '& .w10': {width: '10%'},
  //   '& .w15': {width: '15%'},
  //   '& .w30': {width: '30%'},
  // }
  oneUserComp: {
    display: 'flex',
    borderBottom: '1px #aaa solid',
    paddingBottom: '4px',
    marginBottom: '8px',
    '& div': {
      marginRight: '8px'
    },
    '& .w5': {width: '5%'},
    '& .w10': {width: '10%'},
    '& .w15': {width: '15%'},
    '& .w30': {width: '30%'},
  }
})

// const OneUserConpDt = (props) => {
//   const classes = useStyles();
//   const {userDt, index, lmonth_bldt, tmonth_bldt, hideNonDt} = props;
//   const l_bldt = lmonth_bldt ?lmonth_bldt :{};
//   const t_bldt = tmonth_bldt ?tmonth_bldt :{};
//   const lastm_itemtotal = l_bldt.itemTotal ?l_bldt.itemTotal :[];
//   const thism_itemtotal = t_bldt.itemTotal ?tmonth_bldt.itemTotal :[];

//   const all_servcode = (() => {
//     const l_servcode = lastm_itemtotal.map(servDt => servDt.s);
//     const t_servcode = thism_itemtotal.map(servDt => servDt.s);
//     const servcode_list = [...new Set([...l_servcode, ...t_servcode])].sort((a,b) => parseInt(a) - parseInt(b));
//     if(!hideNonDt) return servcode_list;
//     const redundant_lcodes = l_servcode.filter(lServCode => t_servcode.includes(lServCode));
//     const redundant_tcodes = t_servcode.filter(tServCode => l_servcode.includes(tServCode));
//     return servcode_list.filter(servcode => !redundant_lcodes.includes(servcode)).filter(servcode => !redundant_tcodes.includes(servcode));
//   })();
//   const service_nodes = all_servcode.map((scode, i) => {
//     let lm_dt = lastm_itemtotal.find(servDt => servDt.s === scode);
//     lm_dt = lm_dt ?lm_dt :{};
//     let tm_dt = thism_itemtotal.find(servDt => servDt.s === scode);
//     tm_dt = tm_dt ?tm_dt :{};
//     const serv_name = ((lm_dt.c || tm_dt.c).slice(-1)==="・"
//         ?(lm_dt.c || tm_dt.c).slice(0,-1) :(lm_dt.c || tm_dt.c)
//       ).replace((lm_dt.baseItem || tm_dt.baseItem) ?"":/^放デイ|児発/, "");
//     const lm_non = !(lm_dt.v || lm_dt.count || lm_dt.tanniNum) ?true :false;
//     const tm_non = !(tm_dt.v || tm_dt.count || tm_dt.tanniNum) ?true :false;
//     const attn_style = {backgroundColor: lm_non ?blue[50] :tm_non ?yellow[100] :null}
//     return(
//       <div key={i} className="oneUserRow">
//         <div className="no num">{i===0 ?index+1 :""}</div>
//         <div className="name str">{i===0 ?userDt.name :""}</div>
//         <div className="servName str">{serv_name}</div>
//         <span style={{display: 'flex', ...(lm_non||tm_non ?attn_style :{})}}>
//           <div className="tanniVal num">{lm_dt.v||lm_dt.v===0 ?lm_dt.v.toLocaleString() :""}</div>
//           <div className="tanniCnt num">{lm_dt.count||lm_dt.count===0 ?lm_dt.count.toLocaleString() :""}</div>
//           <div className="tanniNum num">{lm_dt.tanniNum||lm_dt.tanniNum===0 ?lm_dt.tanniNum.toLocaleString() :""}</div>
//           <div className="tanniVal num">{tm_dt.v||tm_dt.v===0 ?tm_dt.v.toLocaleString() :""}</div>
//           <div className="tanniCnt num">{tm_dt.count||tm_dt.count===0 ?tm_dt.count.toLocaleString() :""}</div>
//           <div className="tanniNum num">{tm_dt.tanniNum||tm_dt.tanniNum===0 ?tm_dt.tanniNum.toLocaleString() :""}</div>
//         </span>
//       </div>
//     )
//   })

//   return <div className={classes.oneUserComp}>{service_nodes}</div>
// }

const OneUserConpDt = (props) => {
  const classes = useStyles();
  const {userDt, index, lmonth_bldt, tmonth_bldt, hideNonDt} = props;
  const l_bldt = lmonth_bldt ?lmonth_bldt :{};
  const t_bldt = tmonth_bldt ?tmonth_bldt :{};
  const lastm_itemtotal = l_bldt.itemTotal ?l_bldt.itemTotal :[];
  const thism_itemtotal = t_bldt.itemTotal ?tmonth_bldt.itemTotal :[];

  const all_servcode = (() => {
    const l_servcode = lastm_itemtotal.map(servDt => servDt.s);
    const t_servcode = thism_itemtotal.map(servDt => servDt.s);
    const servcode_list = [...new Set([...l_servcode, ...t_servcode])].sort((a,b) => parseInt(a) - parseInt(b));
    if(!hideNonDt) return servcode_list;
    const redundant_lcodes = l_servcode.filter(lServCode => t_servcode.includes(lServCode));
    const redundant_tcodes = t_servcode.filter(tServCode => l_servcode.includes(tServCode));
    return servcode_list.filter(servcode => !redundant_lcodes.includes(servcode)).filter(servcode => !redundant_tcodes.includes(servcode));
  })();
  const service_nodes = all_servcode.map((scode, i) => {
    let lm_dt = lastm_itemtotal.find(servDt => servDt.s === scode);
    lm_dt = lm_dt ?lm_dt :{};
    let tm_dt = thism_itemtotal.find(servDt => servDt.s === scode);
    tm_dt = tm_dt ?tm_dt :{};
    const serv_name = ((lm_dt.c || tm_dt.c).slice(-1)==="・"
        ?(lm_dt.c || tm_dt.c).slice(0,-1) :(lm_dt.c || tm_dt.c)
      ).replace((lm_dt.baseItem || tm_dt.baseItem) ?"":/^放デイ|児発/, "");
    const lm_non = !(lm_dt.v || lm_dt.count || lm_dt.tanniNum) ?true :false;
    const tm_non = !(tm_dt.v || tm_dt.count || tm_dt.tanniNum) ?true :false;
    const attn_style = {backgroundColor: lm_non ?blue[50] :tm_non ?yellow[100] :null}
    return(
      <div key={i} style={{display: 'flex', margin: '4px 0'}}>
        <div className="servName str">{serv_name}</div>
        <span style={{display: 'flex', ...(lm_non||tm_non ?attn_style :{})}}>
          <div className="tanniVal num">{lm_dt.v||lm_dt.v===0 ?lm_dt.v.toLocaleString() :""}</div>
          <div className="tanniCnt num">{lm_dt.count||lm_dt.count===0 ?lm_dt.count.toLocaleString() :""}</div>
          <div className="tanniNum num">{lm_dt.tanniNum||lm_dt.tanniNum===0 ?lm_dt.tanniNum.toLocaleString() :""}</div>
          <div className="tanniVal num">{tm_dt.v||tm_dt.v===0 ?tm_dt.v.toLocaleString() :""}</div>
          <div className="tanniCnt num">{tm_dt.count||tm_dt.count===0 ?tm_dt.count.toLocaleString() :""}</div>
          <div className="tanniNum num">{tm_dt.tanniNum||tm_dt.tanniNum===0 ?tm_dt.tanniNum.toLocaleString() :""}</div>
        </span>
      </div>
    )
  })

  return(
    <div className={classes.oneUserComp}>
      <div className="no num" style={{marginTop: 4}}>{index+1}</div>
      <div className="name str" style={{marginTop: 4}}>{userDt.name}</div>
      <div>{service_nodes}</div>
    </div>
  )
}

const CompLMonthTMonthMain = (props) => {
  const classes = useStyles();
  const {users, lastBillingDt, thisBillingDt, lastMonth, thisMonth, fetched,
    hideNonDt, service, classroom} = props;
  if(!fetched) return null;
  if(!(lastBillingDt.length && thisBillingDt.length)) return (
    <div>{`${!lastBillingDt.length ?"先月のデータ":""}${!thisBillingDt.length ?"今月のデータ" :""}がないため比較できません。`}</div>
  )
  const filtered_sc_users = getFilteredUsers(users, service, classroom);
  const filtered_users = filtered_sc_users.filter(userDt => {
    const tbldt = thisBillingDt.find(dt => dt.UID === "UID" + userDt.uid);
    const t_itemtotal = tbldt.itemTotal ?tbldt.itemTotal :[];
    if(!t_itemtotal.some(x => x.v||x.tanniNum ?true :false)) return false;
    if(hideNonDt){
      const lbldt = lastBillingDt.find(dt => dt.UID === "UID" + userDt.uid);
      if(!lbldt) return false;
      const l_itemtotal = lbldt.itemTotal ?lbldt.itemTotal :[];
      const l_servcode = l_itemtotal.map(servDt => servDt.s);
      const t_servcode = t_itemtotal.map(servDt => servDt.s);
      const redundant_lcodes = l_servcode.every(lServCode => t_servcode.includes(lServCode));
      const redundant_tcodes = t_servcode.every(tServCode => l_servcode.includes(tServCode));
      if(redundant_lcodes && redundant_tcodes && l_servcode.length === t_servcode.length) return false;
    }
    return true
  })
  const all_compdt = filtered_users.map((userDt, index) => {
    const uid = "UID" + userDt.uid;
    const lmonth_bldt = lastBillingDt.find(dt => dt.UID === uid);
    const tmonth_bldt = thisBillingDt.find(dt => dt.UID === uid);
    const oneuser_parms = {userDt, index, lmonth_bldt, tmonth_bldt, hideNonDt}
    return <OneUserConpDt key={index} {...oneuser_parms}/>
  });

  return(
    <span className={classes.main}>
      <div className="fixedHeader">
        <div className="dateHeader">
          <div className="no"></div>
          <div className="name"></div>
          <div className="servName"></div>
          <div className="dateCol">{lastMonth}月</div>
          <div className="dateCol">{thisMonth}月</div>
        </div>
        <div className="header">
          <div className="no">No</div>
          <div className="name str">利用者名</div>
          <div className="servName str">サービス名</div>
          <div className="tanniVal">単位</div>
          <div className="tanniCnt">数量</div>
          <div className="tanniNum">単位数</div>
          <div className="tanniVal">単位</div>
          <div className="tanniCnt">数量</div>
          <div className="tanniNum">単位数</div>
        </div>
      </div>
      <div className="body">{all_compdt}</div>
    </span>
  )
}

const CompLMonthTMonth = () => {
  const classes = useStyles();
  const all_state = useSelector(state => state);
  const loadingStatus = getLodingStatus(all_state);
  const {stdDate, schedule, users, com, service, serviceItems,
    jino, hid, bid, classroom} = all_state;
  const [display, setDisplay] = useState(false);
  const [hideNonDt, setHideNonDt] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [fetchErr, setFetchErr] = useState(false);
  const [lastBillingDt, setLastBillingDt] = useState([]);
  const [thisBillingDt, setThisBillingDt] = useState([]);
  const [snack, setSnack] = useState({});

  const date_list = stdDate.split("-").map(strDate => parseInt(strDate));
  const last_month = date_list[1] - 1 === 0 ?12 :date_list[1] - 1;
  const last_year = String(last_month === "12" ?date_list[0] - 1 :date_list[0]);
  const last_date = `${last_year}-${String(last_month).padStart(2, "0")}-01`;

  
  useEffect(() => {
    if(!(loadingStatus.loaded && display)) return;
    if (endPoint() === 'apisandbox') return;
    let isMounted = true;
    (async() => {
      const parms = {a: "fetchSomeState", jino, date: last_date, item: "billingDt", hid, bid};
      await axios.post(endPoint(), makeUrlSearchParams(parms)).then(res => {
        const resResult = findDeepPath1(res, 'data.result');
        if(!resResult){
          setSnack({...{msg: 'データの取得に失敗しました。', severity: 'warning'}});
          setFetchErr(true);
        }else if (isMounted){
          const fetchedBillingDt = res.data.dt
            ?res.data.dt[0]
              ?res.data.dt[0].state
                ?res.data.dt[0].state.billingDt
                  ?res.data.dt[0].state.billingDt
                  :[]
                :[]
              :[]
            :[];
          setLastBillingDt([...fetchedBillingDt]);
        }
      })
      const bdprms = { 
        stdDate, schedule, users, com, service, serviceItems,
        calledBy: 'CompLMonthTMonth',
      };
      bdprms.calledBy = 'CompLMonthTMonth';
      // calledBy対応済み
      const {billingDt} = setBillInfoToSch(bdprms);
      setThisBillingDt(billingDt);
      setFetched(true)
    })();
    return () => {
      isMounted = false
    }
  }, [display]);

  // 2022/12/02　追加。ドキュメントのタイトル設定
  const thisTitle = getReportTitle(all_state, '前月との比較');
  useEffect(()=>{
    const titleSet = () => document.title = thisTitle;
    const titleReset = () => document.title = defaultTitle;
    window.addEventListener('beforeprint', titleSet);
    window.addEventListener('afterprint', titleReset);
    return (()=>{
      window.removeEventListener('beforeprint', titleSet);
      window.removeEventListener('afterprint', titleReset);
    })
  }, [])

  const main_parms = {
    users, lastBillingDt: lastBillingDt, thisBillingDt: thisBillingDt,
    lastMonth: last_month, thisMonth: date_list[1], fetched, hideNonDt,
    service, classroom
  };
  if (loadingStatus.loaded){
    const iconStyle = { padding: 0, fontSize: 18, marginRight: 8 };
    return (
      <>
      <ProseedLinksTab />
      <DisplayInfoOnPrint/>
      <div className={classes.root}>
        <div className='noprint' style={{maxWidth: 952, textAlign: 'center', marginBottom: 8}}>
          <Button onClick={()=>setDisplay(true)} variant='contained' style={{width: 200}}>
            <FontAwesomeIcon icon={faCalculator} style={iconStyle} />
            売上計算する
          </Button>
        </div>
        <div className="noprint" style={{maxWidth: 952, textAlign: 'center', marginBottom: 8}}>
          <FormControlLabel
            control={
              <Checkbox
                checked={hideNonDt}
                onClick={(e) => setHideNonDt(e.target.checked)}
                color="primary"
              />
            }
            label="差異があるサービスのみ表示"
          />
        </div>
        <CompLMonthTMonthMain {...main_parms} />
      </div>
      </>
    )
  }else if (loadingStatus.error){
    return (
      <LoadErr loadStatus={loadingStatus} errorId={'E4933'} />
    )
  }else{
    return (
      <LoadingSpinner/>
    )
  }
}
export default CompLMonthTMonth


//売上計算にするボタンパクる