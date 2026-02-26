import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { formatNum, getLodingStatus, null2Zero } from '../../commonModule';
import { LoadingSpinner, LoadErr, LinksTab } from '../common/commonParts';
import { makeStyles } from '@material-ui/core';
import { proseedByUsersDt } from './makeProseedDatas';
import { setBillInfoToSch } from './blMakeData';
import { red, teal } from '@material-ui/core/colors';
import { DispNameWithAttr } from '../Users/Users';
import { 
  TextField, Button, Radio, RadioGroup, FormControlLabel, FormControl 
} from '@material-ui/core';
import { getBillingMenu } from './Billing';
import SnackMsg from '../common/SnackMsg';
import SendIcon from '@material-ui/icons/Send';
import FilterListIcon from '@material-ui/icons/FilterList';
import { 
  univApiCallJson, univApiCall, sendPartOfSchedule, setRecentUser, recentUserStyle
} from '../../albCommonModule';
import * as Actions from '../../Actions';
import { getLS, setLS } from '../../modules/localStrageOprations';
import { getProseedMenu } from './Proseed';
import { JichiJoseiAdjustmentMainJougen } from './JichiJoseiAdjustmentJougen';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: 20,
    marginLeft: 'calc((100vw - 900px + 62px) / 2)',
  },
  header: {
    marginTop: 100,
    marginLeft: 'calc((100vw - 900px + 62px) / 2)',
    display: 'flex',
    alignItems: 'center',
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
    '& .santei': {width: 100, textAlign: 'right'},
    '& .santeiTitle': {width: 100},
    '& .futan': {width: 100, textAlign: 'right'},
    '& .futanTitle': {width: 100},
    '& .josei': {width: 100, textAlign: 'right'},
    '& .joseiTitle': {width: 100},
    '& .adjustment': {
      width: 150,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 16,
    },
  },
  sendButton: {
    position: 'fixed', bottom: 32, left: 'calc((100vw - 900px + 62px) / 2)',
    width: 900, textAlign: 'right',
    zIndex: 30,
  }
}));

const JichiJoseiAdjustmentByUsers = (props) => {
  const classes = useStyles();
  const {
    users, billingDt, adjustments, setAdjustments, com, isFiltered
  } = props;
  
  const userBilling = proseedByUsersDt(users, billingDt, null, null, false);
  
  // フィルタリング: com.etc.citiesの中で、noがusers[x].scity_noと一致するものを探し、そのteiritsuJoseiがtrueであるか
  const filteredUserBilling = userBilling.filter(u => {
    // フィルタが有効な場合、値が設定されているユーザーのみを表示
    if (isFiltered && (!adjustments[u.uid] || adjustments[u.uid] === '')) return false;

    // usersからscity_noを取得（uはproseedByUsersDtの結果で、usersのプロパティを継承しているはず）
    // しかし念のため元のusersから探す
    const originalUser = users.find(user => user.uid === u.uid);
    if (!originalUser || !originalUser.scity_no) return false;
    
    const cities = com.etc?.cities;
    if (!Array.isArray(cities)) return false;
    
    const city = cities.find(c => c.no === originalUser.scity_no);
    if (!city || city.teiritsuJosei !== true) return false;

    // 負担額が0の利用者は表示しない
    return u.userFutan > 0;
  });

  const handleAdjustmentChange = (uid) => (event) => {
    const val = event.target.value;
    setAdjustments(prev => ({
      ...prev,
      [uid]: val
    }));
  };

  const handleAdjustmentClick = (uid, jichiJosei) => {
    if (adjustments[uid] === undefined || adjustments[uid] === '') {
      setAdjustments(prev => ({
        ...prev,
        [uid]: null2Zero(jichiJosei)
      }));
    }
  };

  const handleBlur = (uid, jichiJosei) => (event) => {
    const val = event.target.value;
    // 初期値（null2Zero(jichiJosei)）と同じ場合、または空の場合は削除する
    if (val === '' || Number(val) === Number(null2Zero(jichiJosei))) {
      setAdjustments(prev => {
        const newState = { ...prev };
        delete newState[uid];
        return newState;
      });
    } else {
      // 変更が確定した場合に recentUser を設定
      setRecentUser(uid);
    }
  };

  return (
    <div className={classes.userList}>
      <div className="userRow sticky">
        <div className="noTitle">No.</div>
        <div className="name">利用者名</div>
        <div className="kan">管</div>
        <div className="bros">兄</div>
        <div className="santeiTitle">算定額</div>
        <div className="futanTitle">負担額</div>
        <div className="joseiTitle">助成額</div>
        <div className="adjustment">調整額</div>
      </div>
      {filteredUserBilling.map((uBdt, index) => {
        const ruStyle = recentUserStyle(uBdt.uid);
        const rowStyle = ruStyle.backgroundColor ? { '--bg-color': ruStyle.backgroundColor } : {};
        
        // 自治体助成額の再計算
        let joseiAmount = uBdt.jichiJosei;
        const city = com.etc?.cities?.find(c => c.no === uBdt.scity_no);
        
        if (city && city.teiritsuJosei) {
          const rate = Number(city.teiritsuJoseiRate) || 0;
          const calculatedAmount = uBdt.userFutan * (rate / 100);
          
          switch(city.teiritsuJoseiRound) {
            case 'round':
              joseiAmount = Math.round(calculatedAmount);
              break;
            case 'ceil':
              joseiAmount = Math.ceil(calculatedAmount);
              break;
            case 'floor':
            default:
              joseiAmount = Math.floor(calculatedAmount);
              break;
          }
        }

        return(
          <div key={uBdt.uid} className="userRow" style={rowStyle}>
            <div className="no">{index + 1}</div>
            <div className="name"><DispNameWithAttr {...uBdt}/></div>
            <div className="kan">{uBdt.kanri_type ? uBdt.kanri_type.charAt(0) : ''}</div>
            <div className="bros">{Number(uBdt.brosIndex) !== 0 ? uBdt.brosIndex : ''}</div>
            <div className="santei">{formatNum(uBdt.santei, 1)}</div>
            <div className="futan">{formatNum(uBdt.userFutan, 1)}</div>
            <div className="josei">{formatNum(null2Zero(joseiAmount), 1)}</div>
            <div className="adjustment">
              <TextField
                value={adjustments[uBdt.uid] || ''}
                onChange={handleAdjustmentChange(uBdt.uid)}
                onClick={() => handleAdjustmentClick(uBdt.uid, joseiAmount)}
                onBlur={handleBlur(uBdt.uid, joseiAmount)}
                type="number"
                size="small"
                variant="outlined"
              />
            </div>
          </div>
        )
      })}
    </div>
  );
};

export const JichiJoseiAdjustmentMain = () => {
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const stdDate = useSelector(state => state.stdDate);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const com = useSelector(state => state.com);
  const account = useSelector(state => state.account);
  const schedule = useSelector(state => state.schedule);
  const serviceItems = useSelector(state => state.serviceItems);
  const dispatch = useDispatch();
  
  const [adjustments, setAdjustments] = useState(() => {
    const initialAdjustments = {};
    if (schedule?.adjustedJichijosei) {
      Object.keys(schedule.adjustedJichijosei).forEach(key => {
        const uid = key.replace('UID', '');
        initialAdjustments[uid] = schedule.adjustedJichijosei[key];
      });
    }
    return initialAdjustments;
  });
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const filteredLsName = 'jichiJoseiAdjustmentFilter';
  const [isFiltered, setIsFiltered] = useState(getLS(filteredLsName, false));

  const handleFilter = () => {
    setIsFiltered(!isFiltered);
    setLS(filteredLsName, !isFiltered);
  };

  const handleCancelClick = () => {
    // schedule から初期値を再設定
    const initialAdjustments = {};
    if (schedule?.adjustedJichijosei) {
      Object.keys(schedule.adjustedJichijosei).forEach(key => {
        const uid = key.replace('UID', '');
        initialAdjustments[uid] = schedule.adjustedJichijosei[key];
      });
    }
    setAdjustments(initialAdjustments);
    dispatch(Actions.setSnackMsg('キャンセルしました', 'info'));
  }

  // setBillInfoToSchは重いのでuseMemoでメモ化
  const billingDt = useMemo(() => {
    const userList = users.map(u => ({uid: u.uid, checked: u?.etc?.sochiseikyuu !== true}));
    const {billingDt: result} = setBillInfoToSch({ 
      stdDate, hid, bid, schedule, serviceItems, com, users, calledBy: 'JichiJoseiAdjustment',
    }, userList);
    return result;
  }, [stdDate, hid, bid, schedule, serviceItems, com, users]);


  const handleSendClick = async () => {
    const adjustedJichijosei = {};
    Object.keys(adjustments).forEach(uid => {
      if (adjustments[uid]) {
        adjustedJichijosei['UID' + uid] = adjustments[uid];
      }
    });

    const sendPrms = {
      hid, bid, date: stdDate,
      partOfSch: { adjustedJichijosei }
    }
    const res = await sendPartOfSchedule(
      sendPrms, '', '', '調整額情報を保存しました。', '送信に失敗しました', true
    );

    if (!res?.data?.result) {
      setTimeout(() => {
        dispatch(Actions.setSnackMsg('送信に失敗しました', 'error'));
      }, 300);
      return;
    }

    const newSchedule = { ...schedule };
    if (Object.keys(adjustedJichijosei).length > 0) {
      newSchedule.adjustedJichijosei = adjustedJichijosei;
    } else {
      delete newSchedule.adjustedJichijosei;
    }
    dispatch(Actions.setSchedule(newSchedule));
    
    setTimeout(() => {
      dispatch(Actions.setSnackMsg('調整額情報を保存しました。', 'success'));
    }, 300);
  }

  return (<>
    <div className={classes.root}>
      <JichiJoseiAdjustmentByUsers
        users={users}
        billingDt={billingDt}
        adjustments={adjustments}
        setAdjustments={setAdjustments}
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
    <SnackMsg {...snack} />
  </>);
};

const JichiJoseiAdjustment = () => {
  const allState = useSelector(state => state);
  const classes = useStyles();
  const account = useSelector(state => state.account);
  const com = useSelector(state => state.com);
  const loadingStatus = getLodingStatus(allState);
  const [mode, setMode] = useState('jougen');

  if(!loadingStatus.loaded) return(
    <>
      <LoadingSpinner />
    </>
  )
  else if (loadingStatus.error){
    return (<>
      <LoadErr loadStatus={loadingStatus} errorId={'E923557'} />
    </>)
  }

  return(
    <>
      <LinksTab menu={getProseedMenu(account, com)} />
      <div className={classes.header}>
        <FormControl component="fieldset">
          <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value)}>
            <FormControlLabel value="jougen" control={<Radio color="primary" />} label="上限額調整" />
            <FormControlLabel value="hasuu" control={<Radio color="primary" />} label="端数調整" />
          </RadioGroup>
        </FormControl>
      </div>
      {mode === 'jougen' ? <JichiJoseiAdjustmentMainJougen /> : <JichiJoseiAdjustmentMain />}
    </>
  );
};

export default JichiJoseiAdjustment;
