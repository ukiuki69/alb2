import { makeStyles, TextField, Button } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { jihatsuKasan } from "./BlCalcData2021";
import { convHankaku, formatNum, getLodingStatus, getUisCookie, getUser, uisCookiePos } from "../../commonModule";
import { manualJichiJosei } from '../../modules/contants';
import { isClassroom, isService, sendPartOfSchedule } from '../../albCommonModule';
import * as Actions from '../../Actions';
import SnackMsg from "../common/SnackMsg";
import { teal } from "@material-ui/core/colors";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { setBillInfoToSch } from "./blMakeData";
import { GoBackButton } from "../common/commonParts";

const useStyles = makeStyles({
  root: {position: 'relative'},
  title: {
    width: 544, margin: '16px auto 8px',
    padding: 8, color: teal[900], paddingTop: 12,
    background: teal[50], borderBottom: `1px ${teal[300]} solid`,
  },
  inlineAnc: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    padding: 8,
  },
  table: {
    width: 544,
    borderCollapse: 'collapse',
    margin: '0 auto'
  },
  th: {
    borderBottom: '1px solid #ccc', padding: '8px', textAlign: 'left',
    fontWeight: 300, color: teal[800],
  },
  td: {borderBottom: 'none',padding: '8px',},
  no: {width: '24px', textAlign: 'center',},
  name: {width: '200px',},
  userSanteiTotal: {width: '80px',textAlign: 'right',},
  priceLimit: {width: '80px',textAlign: 'right',},
  jichiJosei: {width: '160px',textAlign: 'right',
    '& .MuiInputBase-input ': {fontSize: '1.1rem'}
  },
  input: {width: '100%',},
  buttonContainer: {
    width: 544,textAlign: 'right',
    margin: '0 auto', marginTop: 24,
    '& .MuiButtonBase-root': {
      marginInlineStart: 16
    }
  }
});

const ManualJosei = ({ billingDt, displayInline}) => {
  const dispatch = useDispatch();
  const classes = useStyles();
  const history  = useHistory();
  const allState = useSelector(s => s);
  const { users, com, schedule, hid, bid, stdDate,service, classroom } = allState;
  const cities = com?.etc?.cities || [];
  // 対象の自治体番号
  const targetCities = cities.filter(e => e.manualJosei).map(e => e.no);
  // 対象のユーザー
  const tUser = users.filter(e => {
    const uids = 'UID' + e.uid;
    const user = getUser(uids, users);
    if (!isService(user, service)) return false;
    if (!isClassroom(user, classroom)) return false;
    const bdt = (billingDt || []).find(x => x.UID === uids);
    return (
      targetCities.includes(e.scity_no)
      && bdt?.kanrikekkagaku
    )
  });
  const [vals, setVals] = useState(tUser.map(e => {
    const uids = 'UID' + e.uid;
    const v = schedule?.[manualJichiJosei]?.[uids];
    return {...e, jichiJosei: v || 0}
  }));
  const [inputErr, setInputErr] = useState(tUser.map(e=>{
    return {error: false, msg: ''}
  }))
  const [snack, setSnack] = useState({ msg: '', severity: '' });

  // scheduleから処理対象データを取得
  useEffect(() => {
    const t = [...vals];
    t.forEach((e, i) => {
      const uids = 'UID' + e.uid;
      const userBdt = billingDt.find(x => x.UID === uids);
      t[i].value = schedule?.[manualJichiJosei]?.['UID' + e.uid] || 0;
      t[i].userSanteiTotal = userBdt?.userSanteiTotal || 0;
      t[i].kanrikekkagaku = userBdt?.kanrikekkagaku || 0;
    });
    setVals(t);
  }, []);

  // node消失でdispatch
  useEffect(()=>{
    return (()=>{
      setTimeout(()=>{
        // node消失確認
        const closed = !document.querySelector('#nodExist25245');
        // dispatch条件追加。値が存在しないときは実行しない
        if (closed && !displayInline && vals.length){
          const newJichiJosei = schedule?.[manualJichiJosei] || {};
          vals.forEach(e => {
            newJichiJosei['UID' + e.uid] = e.value;
          });
          const newSch = { ...schedule, [manualJichiJosei]: newJichiJosei };
          dispatch(Actions.setStore({ schedule: newSch }));
        }
      }, 100);
    })

  }, [])
  const handleInputChange = (index, value) => {
    const newVals = [...vals];
    newVals[index].value = value;
    setVals(newVals);
  };

  const handleSave = async () => {
    const newJichiJosei = schedule?.[manualJichiJosei] || {};
    vals.forEach(e => {
      newJichiJosei['UID' + e.uid] = e.value;
    });

    const prms = { hid, bid, date: stdDate, partOfSch: {[manualJichiJosei]: newJichiJosei} };
    sendPartOfSchedule(prms, '', setSnack, '送信しました', '送信に失敗しました', true);
  };

  const handleCancel = () => {
    dispatch(Actions.resetStore());
    history.goBack();
  };

  if (!billingDt || !Array.isArray(billingDt)) {
    return null;
  }
  const fn = v => formatNum(v, 1);
  const selectInputAuto = getUisCookie(uisCookiePos.selectInputAuto);
  const handeleFocus = (e) => {
    if (selectInputAuto){
      const node = e.currentTarget;
      node.select();
    }
  }
  const handleBlur = (index, value) => {
    value = convHankaku(value);
    const t = [...inputErr];
    const v = [...vals];
    v[index].value = value;
    setVals(v);
    const priceLimit = vals[index].priceLimit;
    const userSanteiTotal = vals[index].userSanteiTotal;
    const limit = Math.min(priceLimit, userSanteiTotal)
    if (isNaN(value)){
      t[index] = {error: true, msg: '数値を入力'}
    }
    else if (value > limit)(
      t[index] = {error: true, msg: '値が不正'}
    )
    else {
      t[index] = {error: false, msg: ''}
    }
    setInputErr(t);
  }
  const hasErrors = inputErr.some(err => err.error);
  // if (vals.length === 0 && !displayInline){
  //   return (
  //     <div className={classes.root} style={{textAlign: 'center'}}>
  //       <GoBackButton posY={0} posX={60} />
  //       処理対象利用者がいません。
  //     </div>
  //   )
  // };
  if (!vals.length) return null;
  if (displayInline){
    return (<>
      <a className={classes.inlineAnc} onClick={()=>{history.push('/proseed/manualjosei')}}>
        {`自治体助成額の手動設定が必要な利用者が${vals.length}名います`}
        <Button color="primary">設定へ</Button>
      </a>
    </>)
  }
  return (
    <div className={classes.root}>
      <GoBackButton posY={0} posX={60} />
      <div className={classes.title}>
        自治体助成額手動設定
      </div>
      <form >
        <table className={classes.table}>
          <thead>
            <tr>
              <th className={`${classes.th} ${classes.no}`}>No</th>
              <th className={`${classes.th} ${classes.name}`}>名前</th>
              <th className={classes.th}>算定額</th>
              <th className={classes.th}>上限額</th>
              <th className={classes.th}>負担額</th>
              <th className={classes.th}>自治体<br></br>助成額</th>
            </tr>
          </thead>
          <tbody>
            {vals.map((val, index) => (
              <tr key={val.uid}>
                <td className={`${classes.td} ${classes.no}`}>{index + 1}</td>
                <td className={`${classes.td} ${classes.name}`}>
                  {val.name}<br></br>
                  <span style={{fontSize: '.7rem'}}>{val.ageStr} {val.scity}</span>
                </td>
                <td className={`${classes.td} ${classes.userSanteiTotal}`}>{fn(val.userSanteiTotal)}</td>
                <td className={`${classes.td} ${classes.priceLimit}`}>{fn(val.priceLimit)}</td>
                <td className={`${classes.td} ${classes.priceLimit}`}>{fn(val.kanrikekkagaku)}</td>
                <td className={`${classes.td} ${classes.jichiJosei}`}>
                  <TextField
                    className={classes.input}
                    onFocus={handeleFocus}
                    onBlur={e => handleBlur(index, e.target.value)}
                    value={val.value}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    error={inputErr[index].error}
                    helperText={inputErr[index].msg}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={classes.buttonContainer}>
          <Button variant="contained" color="secondary" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button 
            variant="contained" color="primary" onClick={handleSave}
            disabled={hasErrors}
          >
            書き込み
          </Button>
        </div>
        <SnackMsg {...snack} />
        <div id = 'nodExist25245'></div>
        <div style={{height: 48}}></div>
      </form>
    </div>
  );
}
export const ManualJoseiOuter = () => {
  const allState = useSelector(s=>s);
  const ls = getLodingStatus(allState);
  const loaded = (ls.loaded && !ls.error);
  if (!loaded) return null;
  const {
    stdDate, schedule, users, com, service, serviceItems,classroom,
  } = allState
  const billingDt = loaded ? setBillInfoToSch({
    stdDate, schedule, users, com, 
    service,serviceItems,classroom, calledBy: 'ManualJoseiOuter',
  }).billingDt: [];
  return (
    <div style={{marginTop: 120}}>
      <ManualJosei billingDt={billingDt} />

    </div>
  )

}

export default ManualJosei;
