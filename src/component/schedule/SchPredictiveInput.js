import { Button, FormControl, InputLabel, makeStyles, MenuItem, Radio, Select } from '@material-ui/core';
import { teal } from '@material-ui/core/colors';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSnackMsg, setStore } from '../../Actions';
import { getTemplate, recentUserStyle, sendPartOfSchedule, univApiCall } from '../../albCommonModule';
import { getLodingStatus } from '../../commonModule';
import { LinksTab, LoadingSpinner } from '../common/commonParts';
import SnackMsg from '../common/SnackMsg';
import { makeSchMenuFilter, menu, extMenu } from './Sch2';

const YEARS_TO_FETCH = 4; //４か月分スケジュールデータ取得（例：4月に推定入力する場合、12月〜3月が対象）
const SPECIFIED_PERCENTAGE = [0, 40, 60]; //[off, 多い, 普通]
// const SPECIFIED_PERCENTAGE = [0, 30, 50, 60]; //[off, 弱い, 標準, 強い]

const useStyles = makeStyles({
  predictiveInput: {
    margin: '126px 0',
    '& .title': {
      textAlign: 'center', fontSize: '1.5rem', color: teal[800],
      marginBottom: 16
    },
    '& .mainForm': {
      '& .discription': {
        paddingBottom: 12, textAlign: 'justify', fontSize: '.9rem',
        lineHeight: 1.6, width: 752,
      },
      width: 'fit-content', margin: '0 auto',
      '& .row': {
        display: 'flex', alignItems: 'center',
        '& > *:not(.radio)': {margin: '0 4px'},
        '& .index': {width: '2.5rem', textAlign: 'center'},
        '& .ageStr': {width: '3rem'},
        '& .name': {width: '11rem'},
        '& .num': {width: '2rem', textAlign: 'center', marginLeft: 8},
        // '& .num': {width: '2rem', textAlign: 'center'},
        '& .note': {width: '15rem', marginLeft: 8},
        // '& .note': {width: '15rem'},
        '& .strong': {},
        '& .standard': {},
        '& .weak': {},
        '& .off': {},
        // '& .radioWrapper': {width: '3rem', textAlign: 'center'}
      },
      '& .header': {
        width: 'fit-content', borderBottom: `1px solid ${teal[800]}`,
        backgroundColor: 'white', position: 'sticky', top: 76, zIndex: 100,
        padding: '16px 0 8px',
        // '& .index, .ageStr, .name': {margin: 4},
        '& .radio': {width: '3rem', textAlign: 'center', margin: '0 4px'},
      }
    },
    '& .buttonWrapper': {position: 'fixed', bottom: 32, right: 64}
  },
  userSchPredictiveInput: {
    margin: '4px 0',
    '& .index, .ageStr, .name': {minHeight: 40,  display: 'flex', alignItems: 'center'},
    '& .index': {justifyContent: 'center'},
    '& .radio': {margin: '0 calc((3rem + 8px - 42px) / 2)'},
    // '& .MuiRadio-root': {margin: '0 calc((3rem-42px)/2)'}
  },
  batchDataInputForm: {
    width: 'fit-content', margin: '0 auto 24px',
    display: 'flex', alignItems: 'flex-end',
    '& .select': {width: 128},
    '& .button': {marginLeft: 16}
  }
});

const adjustDt = (scores, formDt) => {
  const result = JSON.parse(JSON.stringify(scores));
  Object.keys(scores).forEach(uidStr => {
    const uid = uidStr.replace("UID", "");
    scores[uidStr].forEach((oneWeek, i) => {
      oneWeek.forEach((day, j) => {
        day.forEach((score, k) => {
          const percentage = score / YEARS_TO_FETCH * 100;
          result[uidStr][i][j][k] = SPECIFIED_PERCENTAGE[formDt[uid]] <= percentage;
        })
      })
    })
  });

  /*週４利用がある場合は毎週あると判断*/
  Object.keys(result).forEach(uidStr => {
    const everyWeekList = JSON.parse(JSON.stringify(Array(7).fill(Array(5).fill(Array(3).fill(false)))));
    result[uidStr].forEach((oneWeek, i) => {
      oneWeek.forEach((day, j) => {
        everyWeekList[j][i] = day;
      })
    })
    const hoge = everyWeekList.map((dayList, z) => {
      const fuga = JSON.parse(JSON.stringify(Array(3).fill(0)));
      dayList.forEach(week => {
        week.forEach((score, i) => {
          if(score) fuga[i] += 1;
        })
      })
      fuga.forEach((score, i) => {
        if(score >= 4){
          result[uidStr].forEach((oneWeek, j) => {
            result[uidStr][j][z][i] = true;
          })
        }
      })
    })
  })
  return result
}

/*スコアデータに調整を入れる*/
const adjustScoreDt = (scoreDt, selectedValue, pParam) => {
  const result = JSON.parse(JSON.stringify(scoreDt));
  result.forEach((oneWeek, i) => {
    oneWeek.forEach((day, j) => {
      day.forEach((score, k) => {
        const p = pParam[i][j][k];
        const percentage = p===0 ?0 :score / p * 100;
        // const percentage = pParam===0 ?0 :score / pParam * 100;
        result[i][j][k] = SPECIFIED_PERCENTAGE[selectedValue] <= percentage;
      });
    });
  });

  const everyWeekList = JSON.parse(JSON.stringify(Array(7).fill(Array(5).fill(Array(3).fill(false)))));
  result.forEach((oneWeek, i) => {
    oneWeek.forEach((day, j) => {
      everyWeekList[j][i] = day;
    })
  })
  everyWeekList.forEach((dayList, z) => {
    const fuga = JSON.parse(JSON.stringify(Array(3).fill(0)));
    dayList.forEach(week => {
      week.forEach((score, i) => {
        if(score) fuga[i] += 1;
      })
    })
    fuga.forEach((score, i) => {
      if(score >= 4){
        result.forEach((oneWeek, j) => {
          result[j][z][i] = true;
        })
      }
    })
  })

  return result;
}

/*スコアデータからアルバトロススケジュールを作成*/
const makeThisMonSchedule = (scoreDt, selectedValue, uid, allState, pParam) => {
  if(selectedValue==="0") return {};
  const adjustedDt = adjustScoreDt(scoreDt, selectedValue, pParam);
  const {stdDate, dateList, schedule} = allState;
  const displayDateList = stdDate.split("-");
  const firstDate = new Date(parseInt(displayDateList[0]), parseInt(displayDateList[1])-1, 1);
  const hoge = adjustedDt.reduce((result, dayScoreList, i) => {
    dayScoreList.forEach((scoreList, j) => {
      let date = j - firstDate.getDay() + 1;
      if(date <= 0) date += 7;
      date += 7 * i;
      const newDateObj = new Date(parseInt(displayDateList[0]), parseInt(displayDateList[1])-1, date);
      const holiday = getHolidayValue(parseInt(displayDateList[0]), parseInt(displayDateList[1])-1, date, dateList);
      if(scoreList[holiday] && newDateObj.getMonth()+1===parseInt(displayDateList[1])){
        const dDate = `D${displayDateList[0]}${displayDateList[1]}${String(date).padStart(2, '0')}`;
        const temp = getTemplate(allState, schedule["UID"+uid], uid);
        result[dDate] = holiday===0 ?temp.weekday :temp.schoolOff;
      }
    })
    return result;
  }, {});
  return hoge
}

const UserSchPredictiveInput = (props) => {
  const classes = useStyles();
  const {userDt, index, formDt, setFormDt, reset, setReset, batchDt, setBatchDt, schedule, scoreDt, allState, pParam} = props;
  const [selectedValue, setSelectedValue] = useState("0");
  const [scheduleNum, setScheduleNum] = useState(0);
  const uid = userDt.uid;
  const [disabled, setDisabled] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let ignore = false;
    const checkDisabled = () => {
      const hasSchedule = schedule["UID"+uid] ?Object.keys(schedule["UID"+uid]).some(key => /^D2[0-9]{7}$/.test(key)) :false;
      if(hasSchedule){
        setDisabled(true);
        setNote("今月の予定は既に登録済みです。");
        return;
      }
      const checkSchedule = scoreDt ?scoreDt.some(week => (
        week.some(day => day.some(score => score))
      )) :false;
      if(!checkSchedule){
        setDisabled(true);
        setNote("利用がないため実行できません。");
        return;
      }
    }
    if(!ignore) checkDisabled();
    return () => {ignore = true};
  }, []);

  useEffect(() => {
    const newScheduleDt = makeThisMonSchedule(scoreDt, selectedValue, userDt.uid, allState, pParam);
    setScheduleNum(Object.keys(newScheduleDt).length);
  }, [selectedValue]);

  useEffect(() => {
    if(reset){
      setSelectedValue("0");
      setFormDt({...formDt, [userDt.uid]: "0"});
      setReset(false);
    }else if(batchDt){
      if(!disabled) setSelectedValue(batchDt);
    }
  }, [reset, batchDt]);

  const recentStyle = recentUserStyle(userDt.uid);

  const handleChange = (e) => {
    setSelectedValue(e.target.value);
    setFormDt({...formDt, [userDt.uid]: e.target.value});
  }


  return(
    <div className={`${classes.userSchPredictiveInput} row`}>
      <div className='index' style={recentStyle}>{index+1}</div>
      <div className='ageStr'>{userDt.ageStr}</div>
      <div className='name'>{userDt.name}</div>
      {/* <div className='radioWrapper'> */}
        {/* <Radio
          className='strong radio'
          checked={selectedValue === "3"}
          // style={{margin: '0 calc((3rem - 42px) / 2)'}}
          onChange={handleChange}
          value="3"
          disabled={disabled}
        /> */}
      {/* </div> */}
      {/* <div className='radioWrapper'> */}
        <Radio
          className='standard radio'
          checked={selectedValue === "2"}
          onChange={handleChange}
          value="2"
          disabled={disabled}
        />
      {/* </div> */}
      {/* <div className='radioWrapper'> */}
        <Radio
          className='weak radio'
          checked={selectedValue === "1"}
          onChange={handleChange}
          value="1"
          disabled={disabled}
        />
      {/* </div> */}
      {/* <div className='radioWrapper'> */}
        <Radio
          className='off radio'
          checked={selectedValue === "0"}
          onChange={handleChange}
          value="0"
          disabled={disabled}
        />
      {/* </div> */}
      <div className='num'>{scheduleNum}</div>
      <div className='note'>{note}</div>
    </div>
  )
}

const BatchDataInputForm = (props) => {
  const classes = useStyles();
  const {users, batchDt, setFormDt, setBatchDt, scores, schedule} = props;
  const [value, setValue] = useState("");

  const handleChange = (e) => {
    setValue(e.target.value);
    const formDt = users.reduce((result, uDt) => {
      const uidStr = "UID" + uDt.uid;
      const hasSchedule = schedule[uidStr]
        ?Object.keys(schedule[uidStr]).some(key => /^D2[0-9]{7}$/.test(key))
        :false;
      const scoreDt = scores[uidStr];
      const checkSchedule = scoreDt ?scoreDt.some(week => (
        week.some(day => day.some(score => score))
      )) :false;
      if(!hasSchedule && checkSchedule) result[uDt.uid] = e.target.value;
      return result
    }, {});
    setFormDt({...formDt});
    setBatchDt(e.target.value);
  }

  // const handleClick = () => {
  //   const formDt = users.reduce((result, uDt) => {
  //     const uidStr = "UID" + uDt.uid;
  //     const hasSchedule = schedule[uidStr]
  //       ?Object.keys(schedule[uidStr]).some(key => /^D2[0-9]{7}$/.test(key))
  //       :false;
  //     const scoreDt = scores[uidStr];
  //     const checkSchedule = scoreDt ?scoreDt.some(week => (
  //       week.some(day => day.some(score => score))
  //     )) :false;
  //     if(!hasSchedule && checkSchedule) result[uDt.uid] = value;
  //     return result
  //   }, {});
  //   setFormDt({...formDt});
  //   setBatchDt(value);
  // }

  return(
    <div className={classes.batchDataInputForm}>
      <FormControl className='select'>
        <InputLabel>一括選択</InputLabel>
        <Select
          value={value}
          label="一括選択"
          onChange={handleChange}
        >
          <MenuItem value={"0"}>OFF</MenuItem>
          <MenuItem value={"1"}>多め</MenuItem>
          <MenuItem value={"2"}>標準</MenuItem>
          {/* <MenuItem value={"3"}>強い</MenuItem> */}
        </Select>
      </FormControl>
      {/* <Button
        variant='contained' color='primary'
        className='button'
        onClick={handleClick}
      >
        選択
      </Button> */}
    </div>
  )
}

const getHolidayValue = (year, month, date, dateList) => {
  const tDateObj = new Date(year, month, date);
  const finded = dateList.find(dDt => {
    const sDateObj = new Date(dDt.date);
    return (
      sDateObj.getFullYear() === tDateObj.getFullYear() &&
      sDateObj.getMonth() === tDateObj.getMonth() &&
      sDateObj.getDate() === tDateObj.getDate()
    )
  });
  return parseInt(finded ?finded.holiday :0);
}

// const checkHoliday = (year, month, date, dateList, offSchool=null) => {
//   if(offSchool)
//   const dateObj = new Date(year, month, date);
//   const searched = dateList.find(dDt => (
//     dDt.date.getFullYear() === dateObj.getFullYear &&
//     dDt.date.getMonth() === dateObj.getMonth() &&
//     dDt.date.getDate() === dateObj.getDate()
//   ));
//   return searched ?searched.holiday ?true :false :false;
// }

// const adjustDt = (scores, formDt) => {
//   const result = JSON.parse(JSON.stringify(scores));
//   Object.keys(scores).forEach(uidStr => {
//     const uid = uidStr.replace("UID", "");
//     scores[uidStr].forEach((oneWeek, i) => {
//       oneWeek.forEach((day, j) => {
//         day.forEach((score, k) => {
//           const percentage = score / YEARS_TO_FETCH * 100;
//           result[uidStr][i][j][k] = SPECIFIED_PERCENTAGE[formDt[uid]] <= percentage;
//         })
//       })
//     })
//   });

//   /*週４利用がある場合は毎週あると判断*/
//   Object.keys(result).forEach(uidStr => {
//     const everyWeekList = JSON.parse(JSON.stringify(Array(7).fill(Array(5).fill(Array(3).fill(false)))));
//     result[uidStr].forEach((oneWeek, i) => {
//       oneWeek.forEach((day, j) => {
//         everyWeekList[j][i] = day;
//         // day.forEach((scores, k) => {
//         //   everyWeekList[j][i][k] = scores;
//         // })
//       })
//     })
//     const hoge = everyWeekList.map((dayList, z) => {
//       const fuga = JSON.parse(JSON.stringify(Array(3).fill(0)));
//       dayList.forEach(week => {
//         week.forEach((score, i) => {
//           if(score) fuga[i] += 1;
//         })
//       })
//       fuga.forEach((score, i) => {
//         if(score >= 4){
//           result[uidStr].forEach((oneWeek, j) => {
//             result[uidStr][j][z][i] = true;
//           })
//         }
//       })
//     })
//   })
//   return result
// }

const RunButton = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {allState, formDt, scores, setSnack, pParamDt} = props;
  const {stdDate, hid, bid, schedule, dateList} = allState;
  const handleClick = () => {
    // const scores = previousSchDt.reduce((result, schDt) => {
    //   for(const uidStr of Object.keys(schDt)){
    //     if(!/^UID[0-9]+?$/.test(uidStr)) continue;
    //     if(!result[uidStr]) result[uidStr] = JSON.parse(JSON.stringify(
    //       Array(5).fill(Array(7).fill([0,0,0]))
    //     ));
    //     for(const dDate of Object.keys(schDt[uidStr])){
    //       if(!/D2[0-9]{7}$/.test(dDate)) continue;
    //       const year = parseInt(dDate.slice(1, 5));
    //       const month = parseInt(dDate.slice(5, 7))-1;
    //       const date = parseInt(dDate.slice(7, 9));
    //       const dateObj = new Date(year, month, date);
    //       const dayOfNum = Math.floor(date/7);
    //       const day = dateObj.getDay();
    //       const holiday = getHolidayValue(year, month, date, previousDateList);
    //       result[uidStr][dayOfNum][day][holiday] += 1;
    //     }
    //   }
    //   return result
    // }, {});

    // const scores = Object.keys(formDt).reduce((result, uid) => {
    //   if(!formDt[uid] || formDt[uid]==="0") return result;
    //   const uidStr = "UID" + uid;
    //   for(const schDt of previousSchDt){
    //     if(!schDt[uidStr]) continue;
    //     if(!result[uidStr]) result[uidStr] = JSON.parse(JSON.stringify(
    //       Array(5).fill(Array(7).fill([0,0,0]))
    //     ));
    //     for(const dDate of Object.keys(schDt[uidStr])){
    //       if(!/D2[0-9]{7}$/.test(dDate)) continue;
    //       const year = parseInt(dDate.slice(1, 5));
    //       const month = parseInt(dDate.slice(5, 7))-1;
    //       const date = parseInt(dDate.slice(7, 9));
    //       const dateObj = new Date(year, month, date);
    //       const dayOfNum = date%7===0 ?date/7-1 :Math.floor(date/7);
    //       const day = dateObj.getDay();
    //       const holiday = getHolidayValue(year, month, date, previousDateList);
    //       result[uidStr][dayOfNum][day][holiday] += 1;
    //     }
    //   }
    //   return result;
    // }, {});

    /*
      scoresに入っている値
      ５週分の１週間単位のスコア配列を格納
      {
        UIDXX1:[
          [
            [holiday0, holiday1, holiday2],
            [] *6
          ],
          ,[] * 4
        ],
        UIDXX2:[],
      }
    */

    const newSchedule = Object.keys(formDt).reduce((result, uid) => {
      if(formDt[uid] === "0") return result;
      const scheDt = makeThisMonSchedule(scores["UID"+uid], formDt[uid], uid, allState, pParamDt["UID"+uid]);
      if(Object.keys(scheDt).length) result["UID"+uid] = scheDt;
      return result;
    }, {});
    // const newSchedule = Object.keys(formDt).reduce((result, uid) => {
    //   if(!formDt[uid] || formDt[uid]==="0") return result;
    //   if(!result["UID"+uid]) result["UID"+uid] = {...schedule["UID"+uid]};
    //   const weekScoreLists = scores["UID"+uid];
    //   weekScoreLists.forEach((dayScores, i) => {
    //     dayScores.forEach((scoreList, j) => {
    //       let date = j - firstDate.getDay() + 1;
    //       if(date <= 0) date += 7;
    //       date += 7 * i;
    //       const newDateObj = new Date(parseInt(displayDateList[0]), parseInt(displayDateList[1])-1, date);
    //       const holiday = getHolidayValue(parseInt(displayDateList[0]), parseInt(displayDateList[1])-1, date, dateList);
    //       const percentage = scoreList[holiday] / YEARS_TO_FETCH * 100;
    //       if(SPECIFIED_PERCENTAGE[formDt[uid]] <= percentage && newDateObj.getMonth()+1===parseInt(displayDateList[1])){
    //         const dDate = `D${displayDateList[0]}${displayDateList[1]}${String(date).padStart(2, '0')}`;
    //         if(!result["UID"+uid][dDate]) {
    //           const temp = getTemplate(allState, schedule["UID"+uid], uid);
    //           result["UID"+uid][dDate] = holiday===0 ?temp.weekday :temp.schoolOff;
    //         }
    //       }
    //     })
    //   })
    //   return result
    // }, {});

    // let scheNum = 0;
    // const newSchedule = Object.keys(formDt).reduce((result, uid) => {
    //   if(!formDt[uid] || formDt[uid]==="0") return result;
    //   if(!result["UID"+uid]) result["UID"+uid] = {...schedule["UID"+uid]};
    //   const weekScoreLists = adjustedDt["UID"+uid];
    //   weekScoreLists.forEach((dayScores, i) => {
    //     dayScores.forEach((scoreList, j) => {
    //       let date = j - firstDate.getDay() + 1;
    //       if(date <= 0) date += 7;
    //       date += 7 * i;
    //       const newDateObj = new Date(parseInt(displayDateList[0]), parseInt(displayDateList[1])-1, date);
    //       const holiday = getHolidayValue(parseInt(displayDateList[0]), parseInt(displayDateList[1])-1, date, dateList);
    //       // const percentage = scoreList[holiday] / YEARS_TO_FETCH * 100;
    //       if(scoreList[holiday] && newDateObj.getMonth()+1===parseInt(displayDateList[1])){
    //         const dDate = `D${displayDateList[0]}${displayDateList[1]}${String(date).padStart(2, '0')}`;
    //         if(!result["UID"+uid][dDate]) {
    //           const temp = getTemplate(allState, schedule["UID"+uid], uid);
    //           result["UID"+uid][dDate] = holiday===0 ?temp.weekday :temp.schoolOff;
    //           scheNum++;
    //         }
    //       }
    //     })
    //   })
    //   return result
    // }, {});

    const params = {
      hid, bid, date: stdDate,
      partOfSch: newSchedule,
    }
    sendPartOfSchedule(params, '', setSnack).then(res => {
      let msg = ""
      let severity = '';
      let errorId  = '';
      if(res.data.result){
        const newStoreSchedule = {...schedule, ...newSchedule};
        newStoreSchedule.timestamp = new Date().getTime();
        dispatch(setStore({schedule: newStoreSchedule}));
        msg = `${Object.keys(newSchedule).length}人分の予定を追加しました。`;
      }else{
        msg = "予定追加に失敗しました。";
        severity = 'error';
      }
      dispatch(setSnackMsg(msg, severity, errorId));
    });
  }

  return(
    <Button
      variant='contained' color='primary'
      onClick={handleClick}
    >
      実行
    </Button>
  )
}

const SchPredictiveInput = () => {
  const classes = useStyles();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  // 利用者ごとの推定強度用フォームデータ
  const [formDt, setFormDt] = useState({});
  // フォーム内容リセット用ステート
  const [reset, setReset] = useState(false);
  // 一括選択用ステート
  const [batchDt, setBatchDt] = useState("");
  // スナックメッセージ用ステート
  const [snack, setSnack] = useState({});
  // 推定に使用するスコアステート
  const [scores, setScores] = useState({});
  const [pParamDt, setPParamDt] = useState({});
  const [noneDt, setNoneDt] = useState(false);
  const {users, service, classroom, schedule, stdDate, hid, bid} = allState;

  useEffect(() => {
    let ignore = false;
    const getScores = (async() => {
      const displayDateList = stdDate.split("-");
      const resultSchDt = [];
      let redultDateList = [];
      for(let i=0; i<YEARS_TO_FETCH; i++){
        const newDate = new Date(
          parseInt(displayDateList[0]),
          parseInt(displayDateList[1])-(i+1+1), 1
        );
        const year = String(newDate.getFullYear());
        const month = String(newDate.getMonth()+1).padStart(2, '0');
        const date = `${year}-${month}-01`;
        if(month === "08") continue;
        const schRes = await univApiCall({a: 'fetchSchedule', hid, bid, date});
        const dt = schRes.data
          ?schRes.data.dt
            ?schRes.data.dt[0]
              ?schRes.data.dt[0].schedule
                ?schRes.data.dt[0]
          :null :null :null :null;
          
        const calendarRes = await univApiCall({a: "fetchCalender", hid, bid, date});
        const list = calendarRes.data
          ?calendarRes.data.dt
            ?calendarRes.data.dt[0]
              ?calendarRes.data.dt[0].dateList
          :null :null :null;
        if(dt && list){
          resultSchDt.push(dt);
          redultDateList = redultDateList.concat(list);
        }
      }
      if(!(resultSchDt.length && redultDateList.length)){
        setNoneDt(true);
        return;
      }
      const pParamResult = {};
      const scoresRes = users.reduce((result, uDt) => {
        const uidStr = "UID" + uDt.uid;
        let pParam = JSON.parse(JSON.stringify(Array(5).fill(Array(7).fill(Array(3).fill(0)))));
        for(const schDtObj of resultSchDt){
          const schDt = {...schDtObj.schedule};
          if(!schDt[uidStr]) continue;
          if(!result[uidStr]) result[uidStr] = JSON.parse(JSON.stringify(
            Array(5).fill(Array(7).fill([0,0,0]))
          ));
          for(const dDate of Object.keys(schDt[uidStr])){
            if(!/D2[0-9]{7}$/.test(dDate)) continue;
            const year = parseInt(dDate.slice(1, 5));
            const month = parseInt(dDate.slice(5, 7))-1;
            const date = parseInt(dDate.slice(7, 9));
            const dateObj = new Date(year, month, date);
            const dayOfNum = date%7===0 ?date/7-1 :Math.floor(date/7);
            const day = dateObj.getDay();
            const holiday = getHolidayValue(year, month, date, redultDateList);
            result[uidStr][dayOfNum][day][holiday] += 1;
          }
          const hogeDateList = schDtObj.date.split("-");
          pParam = redultDateList.reduce((result, dObj) => {
            const dList = dObj.date.split("-");
            if(hogeDateList[1] !== dList[1]) return result;
            const year = parseInt(dList[0]);
            const month = parseInt(dList[1])-1;
            const date = parseInt(dList[2]);
            const dayOfNum = date%7===0 ?date/7-1 :Math.floor(date/7);
            const thisDate = new Date(year, month, date);
            const holiday = dObj.holiday;
            result[dayOfNum][thisDate.getDay()][holiday] += 1;
            return result;
          }, JSON.parse(JSON.stringify(pParam)));
        }
        pParamResult[uidStr] = JSON.parse(JSON.stringify(pParam));
        return result;
      }, {});
      if(!ignore){
        setScores({...scoresRes});
        setPParamDt({...pParamResult});
      }
    });
    getScores();
    return () => {ignore = true};
  }, []);

  const menuFilter = makeSchMenuFilter(stdDate);
  if(!(loadingStatus.loaded && Object.keys(scores).length)) return(
    <>
    <LinksTab menu={menu} menuFilter={menuFilter} extMenu={extMenu}/>
    <LoadingSpinner />
    </>
  );
  if(noneDt) return(
    <>
    <LinksTab menu={menu} menuFilter={menuFilter} extMenu={extMenu}/>
    <div className='AppPage' style={{textAlign: 'center', marginTop: 250}}>
      過去４ヶ月に予定がないため、予定推定入力は利用できません。
    </div>
    </>
  )

  const filteredUsers = users.filter(uDt => (
    (!service || uDt.service===service) && (!classroom || uDt.classroom===classroom)
  ));
  const mainForm = filteredUsers.map((uDt, i) => {
    const scoreDt = scores["UID"+uDt.uid];
    const pParam = pParamDt["UID"+uDt.uid];
    const params = {userDt: uDt, index: i, formDt, setFormDt, reset, setReset, batchDt, setBatchDt, schedule, scoreDt, allState, pParam};
    return (<UserSchPredictiveInput {...params} key={i}/>)
  });

  const batchFormParams = {users: filteredUsers, setFormDt, batchDt, setBatchDt, scores, schedule};
  const runButtonParams = {allState, formDt, batchDt, setSnack, scores, pParamDt};
  return(
    <>
    <LinksTab menu={menu} menuFilter={menuFilter} extMenu={extMenu}/>
    <div className='AppPage'>
      <div className={classes.predictiveInput}>
        <div className='title'>予定推定入力</div>
        <BatchDataInputForm {...batchFormParams}/>
        <div className='mainForm'>
          <div className='discription'>
            過去の予定から推定して今月の予定を自動で入力します。標準または多めを選択すると入力する予定数が表示されます。実行をクリックすると実際に予定が登録されるので「予定実績-月間」などの画面でご確認下さい。登録される時刻などは利用者別の雛形から設定されます。利用者別の雛形が存在しない場合は「設定-スケジュール関連」で設定されている雛形が適用されます。
          </div>
          <div className='header row'>
            <div className='index'></div>
            <div className='ageStr'></div>
            <div className='name'></div>
            <div className='radio'>標準</div>
            <div className='radio'>多め</div>
            <div className='radio'>OFF</div>
            <div className='num'>件数</div>
            <div className='note'>備考</div>
          </div>
          {mainForm}
        </div>
        <div className='buttonWrapper'>
          <Button variant='contained' color='secondary' onClick={()=>setReset(true)}>
            キャンセル
          </Button>
          <RunButton {...runButtonParams}/>
        </div>
      </div>
    </div>
    <SnackMsg {...snack}/>
    </>
  )
}
export default SchPredictiveInput;