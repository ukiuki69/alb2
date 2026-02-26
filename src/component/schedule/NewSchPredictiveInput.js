import { Button, FormControl, FormControlLabel, FormLabel, InputLabel, makeStyles, MenuItem, Radio, RadioGroup, Select, Tab, Tabs } from '@material-ui/core';
import { red, teal } from '@material-ui/core/colors';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSnackMsg, setStore } from '../../Actions';
import { endPoint, getFilteredUsers, getTemplate, recentUserStyle, sendPartOfSchedule, univApiCall } from '../../albCommonModule';
import { getLodingStatus, makeUrlSearchParams } from '../../commonModule';
import { LinksTab, LoadingSpinner } from '../common/commonParts';
import SnackMsg from '../common/SnackMsg';
import { makeSchMenuFilter, menu, extMenu } from './Sch2';
import axios from 'axios';

const YEARS_TO_FETCH = 4; //４か月分スケジュールデータ取得（例：4月に推定入力する場合、12月〜3月が対象）
const SPECIFIED_PERCENTAGE = [0, 40, 60]; //[off, 多い, 普通]

const MULTINPUT_DISCRIPTION = "過去の予定から推定して今月の予定を自動で入力します。"
  + "標準または多めを選択すると入力する予定数が表示されます。"
  + "実行をクリックすると実際に予定が登録されるので「予定実績-月間」などの画面でご確認下さい。"
  + "登録される時刻などは利用者別の雛形から設定されます。"
  + "利用者別の雛形が存在しない場合は「設定-スケジュール関連」で設定されている雛形が適用されます。";

  const ANYINPUT_DISCRIPTION = "選択した月の予定から推定して今月の予定を自動で入力します。"
  + "ONを選択すると入力する予定数が表示されます。"
  + "実行をクリックすると実際に予定が登録されるので「予定実績-月間」などの画面でご確認下さい。"
  + "登録される時刻などは利用者別の雛形（テンプレート）もしくは、各曜日の最初の予定実績から設定されます。"
  + "利用者別の雛形が存在しない場合は「設定-スケジュール関連」で設定されている雛形が適用されます。";

const filterSchedule = (schedule, service) => {
  const newSchedule = Object.keys(schedule).reduce((prevNewSchedule, uidStr) => {
    if(!/^UID[0-9]+$/.test(uidStr)) return prevNewSchedule;
    const prevNewSch = prevNewSchedule[uidStr] = {};
    const sch = schedule[uidStr];
    for(const [dDate, schDt] of Object.entries(sch)){
      if(!/^D[0-9]{8}$/.test(dDate)) continue;
      if(service && schDt.service !== service) continue;
      prevNewSch[dDate] = schDt;
    }
    return prevNewSchedule;
  }, {});
  return newSchedule;
}

const fetchData = async(stdDate, hid, bid) => {
  const schRes = await univApiCall({a: 'fetchSchedule', hid, bid, date: stdDate});
  const schedule = schRes?.data?.dt?.[0]?.schedule ?? null;
  const calendarRes = await univApiCall({a: "fetchCalender", hid, bid, date: stdDate});
  const dateList = calendarRes?.data?.dt?.[0]?.dateList ?? null;
  if(schedule && dateList) {
    if(Object.keys(schedule).some(uidStr => /^UID[0-9]+$/.test(uidStr))){
      return {schedule, dateList};
    }
  }
}

const checkDisabled = (sch, scoreDt, type) => {
  let disabled = false, note = "";
  const hasSchedule = Object.keys(sch ?? {}).some(key => /^D[0-9]{8}$/.test(key));
  if(!disabled && hasSchedule){
    disabled = true;
    note = "今月の予定は既に登録済みです。";
  }
  if(type === "anyMonth"){
    const checkPreviousSchedule = scoreDt ?scoreDt.some(h => ( Object.values(h).some(x => x) )) :false;
    if(!disabled && !checkPreviousSchedule){
      note = "利用がありません。";
      disabled = true;
    }
  }else{
    const checkPreviousSchedule = scoreDt ?scoreDt.some(week => (
      week.some(day => day.some(score => score))
    )) :false;
    if(!disabled && !checkPreviousSchedule){
      note = "過去数ヶ月に利用がありません。";
      disabled = true;
    }
  }

  return {disabled, note};
}

const getSchScore = (schedule, dateList) => {
  const score = Object.keys(schedule).reduce((result, uidStr) => {
    const scorePerDay = Array(7).fill(null).map(_ => {return {holiday0: 0, holiday1: 0, holiday2: 0}});
    Object.keys(schedule[uidStr]).forEach(dDate => {
      const thisYear = dDate.slice(1, 5);
      const thisMonth = dDate.slice(5, 7);
      const thisDate = dDate.slice(7, 9);
      const dateObj = new Date(parseInt(thisYear), parseInt(thisMonth)-1, parseInt(thisDate));
      const day = dateObj.getDay();
      const holiday = dateList.find(dDt => dDt.date === `${thisYear}-${thisMonth}-${thisDate}`)?.holiday ?? 0;
      scorePerDay[day]["holiday"+holiday] += 1;
    });
    result[uidStr] = scorePerDay;
    return result;
  }, {});
  return score;
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

const sendNewSchedule = async(hid, bid, stdDate, setSnack, newSchedule, schedule, dispatch) => {
  const params = {
    hid, bid, date: stdDate,
    partOfSch: newSchedule,
  }
  const res = await sendPartOfSchedule(params, '', setSnack);
  if(res?.data?.result){
    const newStoreSchedule = {...schedule, ...newSchedule};
    newStoreSchedule.timestamp = new Date().getTime();
    dispatch(setStore({schedule: newStoreSchedule}));
    const msg = `${Object.keys(newSchedule).length}人分の予定を追加しました。`;
    dispatch(setSnackMsg(msg));
  }else{
    setSnack({msg: "予定追加に失敗しました。", severity: 'error'});
  }
}


const determineMakeSchTarget = (scorePerDay) => {
  const result = scorePerDay.map(scoreDt => {
    const resultPerHoliday = Object.keys(scoreDt).reduce((r, holiday) => {
      r[holiday] = scoreDt[holiday] >= 2;
      return r;
    }, {});
    return resultPerHoliday;
  });

  return result;
}

const getNewSchTimes = (createTargetDtPerDay, dateList) => {
  const schTimes = dateList.reduce((result, dt) => {
    const {date, holiday} = dt;
    const day = new Date(date).getDay();
    const createTargetDt = createTargetDtPerDay[day];
    if(createTargetDt[`holiday${holiday}`]) result += 1;
    return result;
  }, 0);
  return schTimes;
}

const getNewSch = (createTargetDtPerDay, dateList, schCopyType, template, copyDt) => {
  const schTimes = dateList.reduce((result, dt) => {
    const {date, holiday} = dt;
    const thisDateObj = new Date(date);
    const thisDay = thisDateObj.getDay();
    const createTargetDt = createTargetDtPerDay[thisDay];
    if(createTargetDt[`holiday${holiday}`]){
      const thisYear = thisDateObj.getFullYear();
      const thisMonth = String(thisDateObj.getMonth()+1).padStart(2, '0');
      const thisDate = String(thisDateObj.getDate()).padStart(2, '0');
      const dDate = `D${thisYear}${thisMonth}${thisDate}`;
      const temp = (() => {
        if(schCopyType === "template"){
          return holiday===0 ?template.weekday :template.schoolOff;
        }
        if(schCopyType === "copy"){
          return copyDt[thisDay];
        }
      })();
      result[dDate] = temp;
    }
    return result;
  }, {});
  return schTimes;
}

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
        '& .note': {width: '15rem', marginLeft: 8},
      },
      '& .header': {
        width: 'fit-content', borderBottom: `1px solid ${teal[800]}`,
        backgroundColor: 'white', position: 'sticky', top: 76, zIndex: 100,
        padding: '16px 0 8px',
        '& .radio': {width: '3rem', textAlign: 'center', margin: '0 4px'},
      }
    },
    '& .buttonWrapper': {position: 'fixed', bottom: 32, right: 64}
  },
  mainForm: {
    width: 'fit-content', margin: '0 auto',
    '& .selectContainer': {
      display: 'flex', justifyContent: 'center',
      '& > div:not(:last-child)': {
        marginRight: 16
      }
    },
    '& .warningMsg': {
      textAlign: 'center', marginTop: 16, color: red[600]
    },
    '& .discription': {
      paddingBottom: 12, textAlign: 'justify', fontSize: '.9rem',
      lineHeight: 1.6, width: 752,
    },
    '& .header, .body': {
      '& .row': {
        display: 'flex', alignItems: 'center',
        '& > *:not(.radio)': {margin: '0 4px'},
        '& .index': {width: '2.5rem', textAlign: 'center'},
        '& .ageStr': {width: '3rem'},
        '& .name': {width: '11rem'},
        '& .num': {width: '2rem', textAlign: 'center', marginLeft: 8},
        '& .note': {width: '15rem', marginLeft: 8, flexGrow: 1},
      }
    },
    '& .header': {
      borderBottom: `1px solid ${teal[800]}`,
      backgroundColor: 'white', position: 'sticky', top: 76, zIndex: 100,
      padding: '16px 0 8px',
      '& .radio': {width: '3rem', textAlign: 'center', margin: '0 4px'},
    },
    '& .body': {
      '& .radio': {margin: '0 calc((3rem + 8px - 42px) / 2)'},
    },
    '& .buttons': {
      textAlign: 'end', marginTop: 16,
      '& .button': {
        width: 112
      }
    }
  },
  userSchPredictiveInput: {
    margin: '4px 0',
    '& .index, .ageStr, .name': {minHeight: 40,  display: 'flex', alignItems: 'center'},
    '& .index': {justifyContent: 'center'},
    '& .radio': {margin: '0 calc((3rem + 8px - 42px) / 2)'},
  },
  batchDataInputForm: {
    '& .select': {width: 128},
  }
});

/**
 * 「過去数ヶ月」「単月」を選択するためのタブ
 * @param {*} props 
 * @returns 
 */
const InputSwitchingTab = (props) => {
  const classes = useStyles();
  const {selectTab, setSelectTab} = props;

  const handleChange = (e, newValue) => {
    // 選択したタブをローカルストレージに保持
    localStorage.setItem("schPredictiveInputSelectTab", String(newValue));
    setSelectTab(newValue);
  }

  return(
    <div className={classes.InputSwitchingTab}>
      <Tabs
        indicatorColor="primary"
        textColor="primary"
        centered
        value={selectTab}
        onChange={handleChange}
        style={{minHeight: "auto"}}
      >
        <Tab label="過去数ヶ月" style={{minHeight: "auto"}} />
        <Tab label="単月" style={{minHeight: "auto"}} />
      </Tabs>
    </div>
  )
}

const BatchInputSelect = (props) => {
  const classes = useStyles();
  const {users, setFormDt, scores, schedule, menuItemDts=[], type} = props;

  const handleChange = (e) => {
    const value = e.target.value;
    const newFormDt = users.reduce((result, user) => {
      const uidStr = "UID" + user.uid;
      const sch = schedule[uidStr];
      const scoreDt = scores[uidStr];
      const disabledDt = checkDisabled(sch, scoreDt, type);
      if(!disabledDt.disabled) result[uidStr] = value;
      return result;
    }, {})
    setFormDt(newFormDt);
  }

  const menuItems = menuItemDts.map((dt, i) => (
    <MenuItem key={`menuItem${i}`} value={dt.value}>{dt.label}</MenuItem>
  ));

  return(
    <div className={classes.batchDataInputForm}>
      <FormControl
        className='select'
        disabled={Object.keys(scores).length === 0}
      >
        <InputLabel>一括選択</InputLabel>
        <Select
          label="一括選択"
          onChange={handleChange}
          defaultValue={""}
        >
          {menuItems}
        </Select>
      </FormControl>
    </div>
  )
}

const Buttons = (props) => {
  const classes = useStyles();
  const {handleCansel, handleRun} = props;

  return(
    <div className='buttons'>
      <Button
        variant='contained' color='secondary'
        onClick={handleCansel}
        className='button'
        style={{marginRight: 12}}
      >
        キャンセル
      </Button>
      <Button
        variant='contained' color='primary'
        onClick={handleRun}
        className='button'
      >
        実行
      </Button>
    </div>
  )
}

const MultMonthInputUserRow = (props) => {
  const classes = useStyles();
  const {
    user, index, formDt, setFormDt, sch, stdDate, hid, bid, scoreDt, pParam, allState
  } = props;
  const uidStr = "UID" + user.uid;
  const [scheduleNum, setScheduleNum] = useState(0);
  const [disabled, setDisabled] = useState(true);
  const [note, setNote] = useState("");

  useEffect(() => {
    const value = formDt[uidStr] ?? "off";
    const newScheduleDt = makeThisMonSchedule(scoreDt, value, user.uid, allState, pParam);
    setScheduleNum(Object.keys(newScheduleDt).length);
  }, [formDt]);

  useEffect(() => {
    let ignore = false;
    if(!ignore){
      const disabledDt = checkDisabled(sch, scoreDt);
      setDisabled(disabledDt.disabled);
      setNote(disabledDt.note);
    }
    return () => {ignore = true};
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setFormDt({...formDt, [uidStr]: value});
  }

  const recentStyle = recentUserStyle(user.uid);
  return(
    <div className={`${classes.userSchPredictiveInput} row`}>
      <div className='index' style={recentStyle}>{index+1}</div>
      <div className='ageStr'>{user.ageStr}</div>
      <div className='name'>{user.name}</div>
      <Radio
        value="2"
        checked={formDt[uidStr]==="2"}
        onChange={handleChange}
        className='standard radio'
        disabled={disabled}
      />
      <Radio
        value="1"
        checked={formDt[uidStr]==="1"}
        onChange={handleChange}
        className='weak radio'
        disabled={disabled}
      />
      <Radio
        value="0"
        checked={!formDt[uidStr] || formDt[uidStr]==="0"}
        onChange={handleChange}
        className='off radio'
        disabled={disabled}
      />
      <div className='num'>{scheduleNum}</div>
      <div className='note'>{note}</div>
    </div>
  )
}

const MultMonthInput = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {filteredUsers, schedule, dateList, stdDate, hid, bid, allState, setSnack, service} = props;
  // 初期ローディング
  const [loading, setLoading] = useState(true);
  // 利用者ごとの推定強度用フォームデータ
  const [formDt, setFormDt] = useState({});
  // フォーム内容リセット用ステート
  const [reset, setReset] = useState(false);
  // 推定に使用するスコアステート
  const [scores, setScores] = useState({});
  const [pParamDt, setPParamDt] = useState({});
  // 対象データがあるか確認
  const [noneDt, setNoneDt] = useState(false);

  useEffect(() => {
    const newFormDt = filteredUsers.reduce((result, user) => {
      const uidStr = "UID" + user.uid;
      const sch = schedule[uidStr];
      const targetDt = scores[uidStr];
      if(!checkDisabled(sch, targetDt).disabled){
        result[uidStr] = "off";
      }
      return result;
    }, {});
    setFormDt(newFormDt);
  }, [reset])

  useEffect(() => {
    let ignore = false;
    const getScores = (async() => {
      const [displayYear, displayMonth] = stdDate.split("-").map(x => parseInt(x));
      const stdDates = [];
      const resultSchDt = [];
      let redultDateList = [];
      for(let i=1; i<=YEARS_TO_FETCH; i++){
        const newDate = new Date(displayYear, displayMonth-1-i, 1)
        const thisYear = String(newDate.getFullYear());
        const thisMonth = String(newDate.getMonth()+1).padStart(2, '0');
        const thisStdDate = `${thisYear}-${thisMonth}-01`;
        // 8月は特異なため無視
        if(thisMonth === "08") continue;
        const data = await fetchData(thisStdDate, hid, bid);
        if(data){
          stdDates.push(thisStdDate);
          resultSchDt.push(filterSchedule(data.schedule, service));
          redultDateList = redultDateList.concat(data.dateList);
        }
      }
      // 対象データがない場合
      if(!(resultSchDt.length && redultDateList.length)){
        setNoneDt(true);
        setLoading(false);
        return;
      }
      const pParamResult = {};
      const scoresRes = filteredUsers.reduce((result, uDt) => {
        const uidStr = "UID" + uDt.uid;
        let pParam = JSON.parse(JSON.stringify(Array(5).fill(Array(7).fill(Array(3).fill(0)))));
        let stdDateIndex = 0;
        for(const schDtObj of resultSchDt){
          const schDt = {...schDtObj};
          if(!schDt[uidStr]) continue;
          if(!result[uidStr]) result[uidStr] = JSON.parse(JSON.stringify(
            Array(5).fill(Array(7).fill([0,0,0]))
          ));
          for(const dDate of Object.keys(schDt[uidStr])){
            if(!/D2[0-9]{7}$/.test(dDate)) continue;
            if(schDt[uidStr][dDate]?.service && schDt[uidStr][dDate].service !== allState.service){
              continue
            }
            const year = parseInt(dDate.slice(1, 5));
            const month = parseInt(dDate.slice(5, 7))-1;
            const date = parseInt(dDate.slice(7, 9));
            const dateObj = new Date(year, month, date);
            const dayOfNum = date%7===0 ?date/7-1 :Math.floor(date/7);
            const day = dateObj.getDay();
            const holiday = getHolidayValue(year, month, date, redultDateList);
            result[uidStr][dayOfNum][day][holiday] += 1;
          }
          const hogeDateList = stdDates[stdDateIndex].split("-");
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
          stdDateIndex++;
        }
        pParamResult[uidStr] = JSON.parse(JSON.stringify(pParam));
        return result;
      }, {});
      if(!ignore){
        setScores({...scoresRes});
        setPParamDt({...pParamResult});
        setLoading(false);
      }
    });
    getScores();
    return () => {ignore = true};
  }, []);

  if(loading) return(<LoadingSpinner />);
  if(noneDt) return(
    <div style={{textAlign: 'center', marginTop: 16, color: red[600]}}>
      データが不足しているため、予定推定入力は利用できません。
    </div>
  )

  const mainForm = filteredUsers.map((user, index) => {
    const uidStr = "UID" + user.uid;
    const scoreDt = scores[uidStr] ?? [];
    const pParam = pParamDt[uidStr];
    const sch = schedule?.[uidStr] ?? {};
    const params = {
      user, index, formDt, setFormDt, 
      sch, stdDate, hid, bid,
      scoreDt, pParam, allState
    };
    return (<MultMonthInputUserRow {...params} key={index} />)
  });

  const handleCansel = () => {
    setReset(!reset);
  }

  const handleRun = async() => {
    const newSchedule = Object.keys(formDt).reduce((result, uidStr) => {
      if(!/^UID[0-9]+$/.test(uidStr)) return result;
      if(formDt[uidStr] === "0") return result;
      const scoreDt = scores[uidStr];
      const pParam = pParamDt[uidStr];
      const scheDt = makeThisMonSchedule(scoreDt, formDt[uidStr], uidStr, allState, pParam);
      if(Object.keys(scheDt).length) result[uidStr] = scheDt;
      return result;
    }, {});
    await sendNewSchedule(hid, bid, stdDate, setSnack, newSchedule, schedule, dispatch);
  }

  const batchFormParams = {
    users: filteredUsers, setFormDt, scores, schedule,
    menuItemDts: [{label: "OFF", value: "0"}, {label: "多め", value: "1"}, {label: "標準", value: "2"}],
  };
  return(
    <div className={classes.mainForm}>
      <div style={{width: 'fit-content', margin: '16px auto'}}>
        <BatchInputSelect {...batchFormParams}/>
      </div>
      <div className='mainForm'>
        <div className='discription'>{MULTINPUT_DISCRIPTION}</div>
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
      <Buttons
        handleCansel={handleCansel}
        handleRun={handleRun}
      />
    </div>
  )
}

// 単月関係
const MonthSelect = (props) => {
  const classes = useStyles();
  const {setSelectStdDate, stdDate, hid, bid} = props;
  const [stdDates, setStdDates] = useState([]);
  const [value, setValue] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async() => {
      const params = {a:'fetchScheduleAria', hid, bid};
      for(let i=0; i<5; i++){
        try{
          const res = await axios.post(endPoint(), makeUrlSearchParams(params));
          if(res?.data?.result){
            // date = yyyy-mm-dd
            const list = res.data.dt.map(e => e.date);
            const displayMonthIndex = list.findIndex(std => std === stdDate);
            const slicedList = list.slice((displayMonthIndex>=12 ?displayMonthIndex-12 :0), displayMonthIndex).reverse();
            if(isMounted) setStdDates(slicedList);
            return;
          }
        }catch{
          continue
        }
      }
    })();
    return (()=>{ isMounted = false });
  }, []);

  const MonthMenuItems = stdDates.map((std, i) => {
    const [thisYear, thisMonth] = std.split("-");
    return(
      <MenuItem key={`monthMenuItem${i}`} value={std}>{`${thisYear}年${thisMonth}月`}</MenuItem>
    )
  });

  const handleChange = (e) => {
    const val = e.target.value;
    setValue(val);
    setSelectStdDate(val);
  }

  return(
    <div>
      <FormControl
        className={classes.formControl}
        disabled={stdDates.length === 0}
        style={{width: 128}}
      >
        <InputLabel>参照月</InputLabel>
        <Select
          value={value}
          onChange={handleChange}
        >
          {MonthMenuItems}
        </Select>
      </FormControl>
    </div>
  )
}

const TemplateCheckbox = (props) => {
  const {schTemplate, setSchTemplate} = props;

  const handleChange = (e) => {
    const value = e.target.value;
    localStorage.setItem("schPredictiveInputTemplate", value);
    setSchTemplate(value);
  }

  return(
    <div style={{textAlign: 'center', marginTop: 24, marginBottom: 12}}>
      <FormControl>
        <FormLabel>コピーソース選択</FormLabel>
        <RadioGroup value={schTemplate} onChange={handleChange} row>
          <FormControlLabel value="template" control={<Radio />} label="テンプレート" />
          <FormControlLabel value="copy" control={<Radio />} label="予定実績" />
        </RadioGroup>
      </FormControl>
    </div>
  )
}

const AnyMonthInputUserRow = (props) => {
  const classes = useStyles();
  const {user, index, sch, createTargetDtPerDay, dateList, formDt, setFormDt, selectStdDate} = props;
  const uidStr = "UID" + user.uid;
  const [schTimes, setSchTimes] = useState(0);
  const [note, setNote] = useState("");
  const [disabled, setDisabled] = useState(false);

  useEffect(() => {
    const formValue = formDt[uidStr];
    if(!formValue) return;
    if(formValue === "on"){
      setSchTimes(getNewSchTimes(createTargetDtPerDay, dateList));
    }else{
      setSchTimes(0);
    }
  }, [formDt]);

  useEffect(() => {
    let ignore = false;
    const checkDisabled = () => {
      const hasSchedule = Object.keys(sch ?? {}).some(dDate => /^D[0-9]{8}$/.test(dDate));
      if(hasSchedule){
        setDisabled(true);
        setNote("今月の予定は既に登録済みです。");
        return;
      }
      if(!selectStdDate){
        setDisabled(true);
        setNote("参照月を選択してください。");
        return;
      }
      if(!createTargetDtPerDay){
        setDisabled(true);
        setNote("利用がありません。");
        return;
      }
      const checkPreviousSchedule = createTargetDtPerDay ?createTargetDtPerDay.some(h => ( Object.values(h).some(x => x) )) :false;
      if(!disabled && !checkPreviousSchedule){
        setDisabled(true);
        setNote("利用がありません。");
        return;
      }
    }
    if(!ignore) checkDisabled();
    return () => {ignore = true};
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    const newFormDt = JSON.parse(JSON.stringify(formDt));
    newFormDt[uidStr] = value;
    setFormDt(newFormDt);
  }

  const recentStyle = recentUserStyle(user.uid);
  return(
    <div className='row'>
      <div className='index' style={recentStyle}>{index+1}</div>
      <div className='ageStr'>{user.ageStr}</div>
      <div className='name'>{user.name}</div>
      <Radio
        value="on"
        checked={formDt[uidStr]==="on"}
        onChange={handleChange}
        className='on radio'
        disabled={disabled}
      />
      <Radio
        value="off"
        checked={!formDt[uidStr] || formDt[uidStr]==="off"}
        onChange={handleChange}
        className='off radio'
        disabled={disabled}
      />
      <div className='num'>{schTimes}</div>
      <div className='note'>{note}</div>
    </div>
  )
}

const AnyMonthInput = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const {stdDate, filteredUsers, schedule, dateList, hid, bid, setSnack, allState, service} = props;
  const [selectStdDate, setSelectStdDate] = useState(null);
  // ローディング
  const [loading, setLoading] = useState(true);
  // 利用者ごとの推定強度用フォームデータ
  const [formDt, setFormDt] = useState({});
  // フォーム内容リセット用ステート
  const [reset, setReset] = useState(false);
  // 推定に使用するスコアステート
  const [createTargetDt, setCreateTargetDt] = useState({});
  const [schCopyDt, setSchCopyDt] = useState({});
  // コピー予定の内容が設定のテンプレートか予定のコピーか選択するためのステート
  const [schCopyType, setSchCopyType] = useState(localStorage.getItem("schPredictiveInputTemplate") ?? "template");
  const [noneDt, setNoneDt] = useState(false);

  useEffect(() => {
    if(!selectStdDate){
      setLoading(false);
      setCreateTargetDt({});
      return;
    }
    // ローディング状態に変更
    setLoading(true);
    fetchData(selectStdDate, hid, bid).then(data => {
      if(!data){
        setLoading(false);
        setNoneDt(true);
        return;
      }
      const schedule = filterSchedule(data.schedule, service);
      const schScore = getSchScore(schedule, data.dateList);
      const schCreateTargetDt = Object.keys(schScore).reduce((result, uidStr) => {
        const schScorePerDay = schScore[uidStr];
        const determineTargetDt = determineMakeSchTarget(schScorePerDay);
        result[uidStr] = determineTargetDt;
        return result;
      }, {});
      const copyDt = Object.keys(schedule).reduce((result, uidStr) => {
        if(!result[uidStr]) result[uidStr] = [];
        const sch = JSON.parse(JSON.stringify(schedule[uidStr]));
        Object.keys(sch).reverse().forEach(dDate => {
          const schDt = sch[dDate];
          if(schDt.service === allState.service){
            const dateObj = new Date(parseInt(dDate.slice(1, 5)), parseInt(dDate.slice(5, 7))-1, parseInt(dDate.slice(7, 9)));
            const thisDay = dateObj.getDay();
            if(!result[uidStr][thisDay]) result[uidStr][thisDay] = schDt;
          }
        });
        return result;
      }, {});
      setSchCopyDt(copyDt);
      setCreateTargetDt(schCreateTargetDt);
      setLoading(false);
      setNoneDt(false);
    });
  }, [selectStdDate]);

  const userRows = filteredUsers.map((user, index) => {
    const uidStr = "UID" + user.uid;
    const createTargetDtPerDay = createTargetDt[uidStr];
    const sch = schedule[uidStr];
    const userRowProps = {
      user, index, sch, createTargetDtPerDay, dateList, formDt, setFormDt,
      selectStdDate
    };
    return(
      <AnyMonthInputUserRow
        key={`anyMonthInputUserRow${index}`}
        {...userRowProps}
      />
    )
  });

  const handleCansel = () => {
    setReset(!reset);
  }

  const handleRun = async() => {
    const sendData = Object.keys(formDt).reduce((result, uidStr) => {
      if(!/^UID[0-9]+$/.test(uidStr)) return result;
      if(formDt[uidStr] === "off") return result;
      const sch = schedule[uidStr]
      const template = getTemplate(allState, sch, uidStr);
      const createTargetDtPerDay = createTargetDt[uidStr];
      const copyDt = schCopyDt[uidStr];
      const newSch = getNewSch(createTargetDtPerDay, dateList, schCopyType, template, copyDt);
      result[uidStr] = newSch;
      return result;
    }, {});
    await sendNewSchedule(hid, bid, stdDate, setSnack, sendData, schedule, dispatch);
  }

  const monthSelectProps = {setSelectStdDate, stdDate, hid, bid};
  const batchProps = {
    users: filteredUsers, setFormDt, scores: createTargetDt, schedule,
    menuItemDts: [{label: 'OFF', value: 'off'}, {label: 'ON', value: 'on'}],
    type: "anyMonth"
  };
  return(
    <div className={classes.mainForm}>
      <div className='selectContainer'>
        <MonthSelect {...monthSelectProps} />
        <BatchInputSelect {...batchProps}/>
      </div>
      {noneDt &&<div className="warningMsg">
        データが不足しているため、予定推定入力は利用できません。
      </div>}
      <TemplateCheckbox schTemplate={schCopyType} setSchTemplate={setSchCopyType} />
      <div className='discription'>{ANYINPUT_DISCRIPTION}</div>
      {loading ?<LoadingSpinner /> :(<><div className='header'>
        <div className='row'>
          <div className='index'></div>
          <div className='ageStr'></div>
          <div className='name'></div>
          <div className='radio'>ON</div>
          <div className='radio'>OFF</div>
          <div className='num'>件数</div>
          <div className='note'>備考</div>
        </div>
      </div>
      <div className='body'>
        {userRows}
      </div>
      <Buttons
        handleCansel={handleCansel}
        handleRun={handleRun}
      /></>)}
    </div>
  )
}

const SchPredictiveInput = () => {
  const classes = useStyles();
  const allState = useSelector(state => state);
  // 「過去数ヶ月」「単月」タブ用のステート
  const [selectTab, setSelectTab] = useState(parseInt(localStorage.getItem("schPredictiveInputSelectTab") ?? 0));
  // スナックメッセージ用ステート
  const [snack, setSnack] = useState({});
  const {users, service, classroom, schedule, dateList, stdDate, hid, bid} = allState;
  const menuFilter = makeSchMenuFilter(stdDate);

  // ストアステートが全て読み込まれるまでローリング画面表示
  if(!getLodingStatus(allState).loaded) return(
    <>
    <LinksTab menu={menu} menuFilter={menuFilter} extMenu={extMenu}/>
    <LoadingSpinner />
    </>
  );

  // サービス・単位でフィルターをかけた利用者
  const filteredUsers = getFilteredUsers(users, service, classroom);

  const monthInputProps = {filteredUsers, schedule, dateList, stdDate, hid, bid, setSnack, allState, service};
  return(
    <>
    <LinksTab menu={menu} menuFilter={menuFilter} extMenu={extMenu}/>
    <div className='AppPage'>
      <div className={classes.predictiveInput}>
        <div className='title'>予定推定入力</div>
        {service==="保育所等訪問支援" &&<div style={{textAlign: 'center'}}>保育所等訪問支援は未対応です。</div>}
        {service!=="保育所等訪問支援" &&<InputSwitchingTab selectTab={selectTab} setSelectTab={setSelectTab} />}
        {/* 過去数ヶ月 */}
        {service!=="保育所等訪問支援" && selectTab===0 &&<MultMonthInput {...monthInputProps} />}
        {/* 単月 */}
        {service!=="保育所等訪問支援" && selectTab===1 &&<AnyMonthInput {...monthInputProps} />}
      </div>
    </div>
    <SnackMsg {...snack}/>
    </>
  )
}
export default SchPredictiveInput;