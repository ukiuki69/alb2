import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { formatNum, null2Zero } from '../../commonModule';
import { makeStyles } from '@material-ui/core';
import { proseedByUsersDt } from './makeProseedDatas';
import { setBillInfoToSch } from './blMakeData';
import { red, teal } from '@material-ui/core/colors';
import { DispNameWithAttr } from '../Users/Users';
import { TextField, Button } from '@material-ui/core';
import FilterListIcon from '@material-ui/icons/FilterList';
import SendIcon from '@material-ui/icons/Send';
import { setRecentUser, recentUserStyle, univApiCall } from '../../albCommonModule';
import { getLS, setLS } from '../../modules/localStrageOprations';
import * as Actions from '../../Actions';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: 20,
    marginLeft: 'calc((100vw - 900px + 62px) / 2)',
  },
  userList: {
    width: 900,
    '& .userRow': {
      position: 'relative',
      display: 'flex',
      padding: '8px 16px',
      borderBottom: '1px solid #e0e0e0',
      alignItems: 'center',
      '&:hover': {
        backgroundColor: '#f5f5f5'
      },
      '&::before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: 8,
        width: 44,
        backgroundColor: 'var(--bg-color, transparent)',
        zIndex: 0,
      },
    },
    '& .userRow.sticky': {
      position: 'sticky',
      top: 100,
      zIndex: 2,
      background: teal[50],
      borderBottom: `1px solid ${teal[200]}`,
      '&::before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        top: -16,
        left: 0,
        width: '100%',
        height: 16,
        background: '#fff',
        zIndex: 3,
      },
    },
    '& .noTitle': {width: '40px'},
    '& .no': {
      width: '40px', 
      textAlign: 'center',
      position: 'relative',
      zIndex: 1,
    },
    '& .name': {width: '200px', marginLeft: 4},
    '& .kan': {width: 40, textAlign: 'center'},
    '& .bros': {width: 40, textAlign: 'center'}, 
    '& .result': {width: 40, textAlign: 'center'},
    '& .santei': {width: 80, textAlign: 'right'},
    '& .santeiTitle': {width: 80},
    '& .futan': {width: 80, textAlign: 'right'},
    '& .futanTitle': {width: 80},
    '& .upperLimit': {width: 100, textAlign: 'right'},
    '& .upperLimitTitle': {width: 100},
    '& .adjustment': {
      width: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 16,
      // type="number" の矢印を非表示にする
      '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
        '-webkit-appearance': 'none',
        margin: 0,
      },
      '& input[type=number]': {
        '-moz-appearance': 'textfield',
      },
    },
  },
  sendButton: {
    position: 'fixed', bottom: 32, left: 'calc((100vw - 900px + 62px) / 2)',
    width: 900, textAlign: 'right',
    zIndex: 30,
  }
}));

const JichiJoseiAdjustmentByUsersJougen = (props) => {
  const classes = useStyles();
  const {
    users, billingDt, adjustetUpperLimit, setAdjustetUpperLimit, com, isFiltered
   } = props;
  
  const userBilling = proseedByUsersDt(users, billingDt, null, null, false);
  
  const filteredUserBilling = userBilling.filter(u => {
    const uidKey = isNaN(u.uid) ? u.uid : 'UID' + u.uid;
    if (isFiltered && (!adjustetUpperLimit[uidKey] || adjustetUpperLimit[uidKey] === '')) return false;

    const originalUser = users.find(user => user.uid === u.uid);
    if (!originalUser || !originalUser.scity_no) return false;
    
    const cities = com.etc?.cities;
    if (!Array.isArray(cities)) return false;
    
    const city = cities.find(c => c.no === originalUser.scity_no);
    if (!city || city.teiritsuJosei !== true) return false;

    return true;
  });

  const handleUpperLimitChange = (uid) => (event) => {
    const val = event.target.value;
    const uidKey = isNaN(uid) ? uid : 'UID' + uid;
    setAdjustetUpperLimit(prev => ({
      ...prev,
      [uidKey]: val
    }));
    setRecentUser(uid);
  };

  const handleBlur = (uid) => (event) => {
    // 簡略化：ブラウザのtype="number"に任せ、ここでは追加のバリデーションを行わない
  };

  return (
    <div className={classes.userList}>
      <div className="userRow sticky">
        <div className="noTitle">No.</div>
        <div className="name">利用者名</div>
        <div className="kan">管</div>
        <div className="bros">兄</div>
        <div className="result">結</div>
        <div className="santeiTitle">算定額</div>
        <div className="futanTitle">負担額</div>
        <div className="upperLimitTitle">上限額</div>
        <div className="adjustment">調整上限額</div>
      </div>
      {filteredUserBilling.map((uBdt, index) => {
        const ruStyle = recentUserStyle(uBdt.uid);
        const rowStyle = ruStyle.backgroundColor ? { '--bg-color': ruStyle.backgroundColor } : {};
        
        const uidKey = isNaN(uBdt.uid) ? uBdt.uid : 'UID' + uBdt.uid;

        const originalUser = users.find(user => user.uid === uBdt.uid);
        const defaultUpperLimit = originalUser?.priceLimit || 0;

        return(
          <div key={uBdt.uid} className="userRow" style={rowStyle}>
            <div className="no">{index + 1}</div>
            <div className="name"><DispNameWithAttr {...uBdt}/></div>
            <div className="kan">{uBdt.kanri_type ? uBdt.kanri_type.charAt(0) : ''}</div>
            <div className="bros">{Number(uBdt.brosIndex) !== 0 ? uBdt.brosIndex : ''}</div>
            <div className="result">{uBdt.kanriKekka ? uBdt.kanriKekka : ''}</div>
            <div className="santei">{formatNum(uBdt.santei, 1)}</div>
            <div className="futan">{formatNum(uBdt.userFutan, 1)}</div>
            <div className="upperLimit">{formatNum(defaultUpperLimit, 1)}</div>
            <div className="adjustment">
              <TextField
                value={adjustetUpperLimit[uidKey] || ''}
                onChange={handleUpperLimitChange(uBdt.uid)}
                onBlur={handleBlur(uBdt.uid)}
                size="small"
                type="number"
              />
            </div>
          </div>
        )
      })}
    </div>
  );
};

export const JichiJoseiAdjustmentMainJougen = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const users = useSelector(state => state.users);
  const stdDate = useSelector(state => state.stdDate);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const com = useSelector(state => state.com);
  const schedule = useSelector(state => state.schedule);
  const serviceItems = useSelector(state => state.serviceItems);
  
  const [adjustetUpperLimit, setAdjustetUpperLimit] = useState({});
  const filteredLsName = 'jichiJoseiUpperLimitFilter';
  const [isFiltered, setIsFiltered] = useState(getLS(filteredLsName, false));

  // ロード時にスケジュールから該当する値を取得
  useEffect(() => {
    if (schedule?.adjustetUpperLimit) {
      setAdjustetUpperLimit(schedule.adjustetUpperLimit);
    }
  }, [schedule?.adjustetUpperLimit]);

  const handleFilter = () => {
    setIsFiltered(!isFiltered);
    setLS(filteredLsName, !isFiltered);
  };

  const handleCancelClick = () => {
    setAdjustetUpperLimit(schedule?.adjustetUpperLimit || {});
    dispatch(Actions.setSnackMsg('キャンセルしました', 'info'));
  };

  const handleSendClick = async () => {
    const sendData = { adjustetUpperLimit };
    const sendParams = {
      a: "sendPartOfData",
      table: "ahdschedule", column: "schedule",
      hid, bid, date: stdDate, partOfData: JSON.stringify(sendData)
    };
    
    const sendRes = await univApiCall(sendParams);
    if (sendRes?.data?.result) {
      // 送信したデータはスケジュールにキーを追加する形でdispatch
      // 既にキーがあるときは上書き
      const newSchedule = { 
        ...schedule, 
        adjustetUpperLimit: {
          ...(schedule.adjustetUpperLimit || {}),
          ...adjustetUpperLimit
        }
      };
      dispatch(Actions.setSchedule(newSchedule));
      dispatch(Actions.setSnackMsg('上限額調整情報を保存しました', 'success'));
    } else {
      dispatch(Actions.setSnackMsg('保存に失敗しました', 'error'));
    }
  };

  const billingDt = useMemo(() => {
    const userList = users.map(u => ({uid: u.uid, checked: u?.etc?.sochiseikyuu !== true}));
    const {billingDt: result} = setBillInfoToSch({ 
      stdDate, hid, bid, schedule, serviceItems, com, users, calledBy: 'JichiJoseiAdjustment',
    }, userList);
    return result;
  }, [stdDate, hid, bid, schedule, serviceItems, com, users]);

  return (<>
    <div className={classes.root}>
      <JichiJoseiAdjustmentByUsersJougen
        users={users}
        billingDt={billingDt}
        adjustetUpperLimit={adjustetUpperLimit}
        setAdjustetUpperLimit={setAdjustetUpperLimit}
        com={com}
        isFiltered={isFiltered}
      />
    </div>
    <div style={{height: 80}}></div>
    <div className={classes.sendButton}>
      <Button
        variant='contained'
        onClick={handleFilter}
        style={{ marginRight: 16, backgroundColor: isFiltered ? red[100] : teal[100] }}
        startIcon={<FilterListIcon />}
      >
        {isFiltered ? '全表示' : '入力済みのみ表示'}
      </Button>
      <Button 
        variant="contained" 
        color="secondary" 
        onClick={handleCancelClick}
        style={{marginRight: 16}}
      >
        キャンセル
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={handleSendClick}
        startIcon={<SendIcon />}
      >
        保存する
      </Button>
    </div>
  </>);
};

