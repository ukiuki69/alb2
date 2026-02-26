import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { formatNum, getLodingStatus, getUser } from '../../commonModule';
import { LoadingSpinner, LoadErr, LinksTab } from '../common/commonParts';
import { makeStyles } from '@material-ui/core';
import { proseedByUsersDt } from './makeProseedDatas';
import { setBillInfoToSch } from './blMakeData';
import { red, teal } from '@material-ui/core/colors';
import { DispNameWithAttr } from '../Users/Users';
import { Checkbox, Radio, RadioGroup, FormControlLabel, Button } from '@material-ui/core';
import { getBillingMenu } from './Billing';
import SnackMsg from '../common/SnackMsg';
import { faAward } from '@fortawesome/free-solid-svg-icons';
import { univApiCallJson } from '../../albCommonModule';
import SendIcon from '@material-ui/icons/Send';
import SortIcon from '@material-ui/icons/Sort';
import { getLS, setLS } from '../../modules/localStrageOprations';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: 120,
    marginLeft: 'calc((100vw - 800px + 62px) / 2)',
  },
  userList: {
    width: 800,
    '& .userRow': {
      display: 'flex',
      padding: '8px 16px',
      borderBottom: '1px solid #e0e0e0',
      alignItems: 'center',
      '&:hover': {
        backgroundColor: '#f5f5f5'
      }
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
    '& .no': {width: '40px', textAlign: 'center'},
    '& .name': {width: '200px'},
    '& .kan': {width: 40, textAlign: 'center'},
    '& .bros': {width: 40, textAlign: 'center'}, 
    '& .tanni': {width: 100,textAlign: 'right'},
    '& .tanniTitle': {width: 100, },
    '& .seikyu': {width: 120, textAlign: 'right'},
    '& .seikyuTitle': {width: 120, },
    '& .rebilling': {
      width: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      '& .MuiCheckbox-root': {padding: 4,
        '& .MuiSvgIcon-root': {fontSize: 20}
      }
    },
    '& .rebillingType': {
      width: 200,
      minWidth: 200,
      display: 'flex',
      alignItems: 'center',
      '& .MuiRadioGroup-root': {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
      },
      '& .MuiRadio-root': {
        padding: 4,
        '& .MuiSvgIcon-root': {
          fontSize: 20
        }
      },
      '& .MuiFormControlLabel-root': {
        marginRight: 4,
        '& .MuiFormControlLabel-label': {
          fontSize: '0.75rem'
        }
      }
    },
  },
  sendButton: {
    position: 'fixed', bottom: 32, left: 'calc((100vw - 800px + 62px) / 2)',
    width: 800, textAlign: 'right',
    zIndex: 30,
  }
}));

const RebillingByUsers = (props) => {
  const classes = useStyles();
  const {
    users, billingDt, rebillingStates, setRebillingStates,
    jougenKubun, setJougenKubun, isSorted
  } = props;
  const userBilling = proseedByUsersDt(users, billingDt, null, null, false);
  
  // ソートされた配列を生成
  const displayedUserBilling = isSorted ? [...userBilling].sort((a, b) => {
    const aHasRebilling = rebillingStates && rebillingStates[a.uid];
    const bHasRebilling = rebillingStates && rebillingStates[b.uid];
    if (aHasRebilling && !bHasRebilling) return -1;
    if (!aHasRebilling && bHasRebilling) return 1;
    return 0;
  }) : userBilling;

  const handleRebillingChange = (uid) => (event) => {
    const checked = event.target.checked;
    if (checked) {
      setRebillingStates(prev => ({
        ...prev,
        [uid]: true
      }));
      setJougenKubun(prev => ({
        ...prev,
        [uid]: '1'
      }));
    } else {
      setRebillingStates(prev => {
        const newState = { ...prev };
        delete newState[uid];
        return newState;
      });
      setJougenKubun(prev => {
        const newState = { ...prev };
        delete newState[uid];
        return newState;
      });
    }
  };

  const handleJougenKubunChange = (uid) => (event) => {
    setJougenKubun(prev => ({
      ...prev,
      [uid]: event.target.value
    }));
  };

  // チェックされている数を計算
  const rebillingCount = Object.values(rebillingStates).filter(Boolean).length;

  return (
    <div className={classes.userList}>
      <div className="userRow sticky">
        <div className="noTitle">No.</div>
        <div className="name">利用者名</div>
        <div className="kan">管</div>
        <div className="bros">兄</div>
        <div className="tanniTitle">単位数</div>
        <div className="seikyuTitle">国保請求額</div>
        <div className="rebilling">
          再請求{rebillingCount > 0 && <span style={{marginLeft: 4, color: '#1976d2', fontWeight: 'bold'}}>{rebillingCount}</span>}
        </div>
        <div className="rebillingType">上限管理区分</div>
      </div>
      {displayedUserBilling.map((uBdt, index) => {
        const makeJougenKubun = (() => {
          if (uBdt.kanri_type === '管理事業所' && !Number(uBdt.brosIndex)) return true
          if (uBdt.kanri_type === '管理事業所' && Number(uBdt.brosIndex) === 1) return true
          if (uBdt.kanri_type === '管理事業所' && Number(uBdt.brosIndex) > 1) return false
          return false;
        })();
        return(
          <div key={uBdt.uid} className="userRow">
            <div className="no">{index + 1}</div>
            <div className="name"><DispNameWithAttr {...uBdt}/></div>
            <div className="kan">{uBdt.kanri_type ? uBdt.kanri_type.charAt(0) : ''}</div>
            <div className="bros">{Number(uBdt.brosIndex) !== 0 ? uBdt.brosIndex : ''}</div>
            <div className="tanni">{formatNum(uBdt.tanni, 1)}</div>
            <div className="seikyu">{formatNum(uBdt.kokuhoSeikyuu, 1)}</div>
            <div className="rebilling">
              <Checkbox
                checked={rebillingStates[uBdt.uid] || false}
                onChange={handleRebillingChange(uBdt.uid)}
              />
            </div>
            <div className="rebillingType">
              {rebillingStates[uBdt.uid] && makeJougenKubun && (
                <div style={{textAlign: 'center'}}>
                  <RadioGroup
                    row
                    value={jougenKubun[uBdt.uid] || '1'}
                    onChange={handleJougenKubunChange(uBdt.uid)}
                    style={{ gap: '4px' }}
                  >
                    <FormControlLabel value="1" control={<Radio size="small" />} label="新規" />
                    <FormControlLabel value="2" control={<Radio size="small" />} label="修正" />
                    <FormControlLabel value="3" control={<Radio size="small" />} label="削除" />
                  </RadioGroup>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  );
};

export const RebillingMain = () => {
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const stdDate = useSelector(state => state.stdDate);
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const com = useSelector(state => state.com);
  const schedule = useSelector(state => state.schedule);
  const serviceItems = useSelector(state => state.serviceItems);
  const allState = useSelector(state => state);
  const account = allState.account;
  const loadingStatus = getLodingStatus(allState);
  const userList = users.map(u => ({uid: u.uid, checked: u?.etc?.sochiseikyuu !== true}))
  const {billingDt} = setBillInfoToSch({ 
    stdDate, hid, bid, schedule, serviceItems, com, users, calledBy: 'RebillingMain',
  }, userList);

  const [rebillingStates, setRebillingStates] = useState(false);
  const [jougenKubun, setJougenKubun] = useState(false);
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const sortedLsName = 'rebillingSort';
  const [isSorted, setIsSorted] = useState(getLS(sortedLsName, false));

  const handleSort = () => {
    setIsSorted(!isSorted);
    setLS(sortedLsName, !isSorted);
  };
  
  const fetchRebillingState = async () => {
    const prms = {
      date: stdDate, hid, bid,
      item: 'rebilling', a: 'fetchAnyState',
    };
    const res = await univApiCallJson(prms, 'E976233');
    if (res?.data?.dt?.[0]?.state) {
      const { 
        rebillingStates: savedRebillingStates, jougenKubun: savedJougenKubun 
      } = res?.data?.dt?.[0]?.state;
      setRebillingStates(savedRebillingStates || {});
      setJougenKubun(savedJougenKubun || {});
    }
  };

  useEffect(() => {
    if (!rebillingStates) {
      fetchRebillingState();
    }
  }, [stdDate, hid, bid]);

  // 初期値の設定
  useEffect(() => {
    if (loadingStatus.loaded && !rebillingStates) {
      const initialRebillingStates = {};
      const initialJougenKubun = {};
      setRebillingStates(initialRebillingStates);
      setJougenKubun(initialJougenKubun);
    }
  }, [loadingStatus.loaded]);

  // jougenKubunの初期値設定
  useEffect(() => {
    if (loadingStatus.loaded && !jougenKubun) {
      const initialJougenKubun = {};
      setJougenKubun(initialJougenKubun);
    }
  }, [loadingStatus.loaded]);

  const handleSendClick = async () => {
    const sendPrms = {
      date: stdDate, keep: 130, hid, bid,
      item: 'rebilling', state:JSON.stringify({rebillingStates, jougenKubun}),
      a: 'sendAnyState',
    }
    await univApiCallJson(
      sendPrms, 'E976209', '', setSnack, '再請求情報を保存しました。', '送信に失敗しました'
    );
  }

  const handleCancelClick = async () => {
    await fetchRebillingState();
    setSnack({msg: 'キャンセルしました', severity: 'info'});
  }
  if (stdDate < '2024-04-01'){
    return(
      <>
        <LinksTab menu={getBillingMenu(account, com)} />
        <div style={{textAlign: 'center', color: red[800], marginTop: 100}}>
          2024年4月以前はこの機能をご利用になれません。
        </div>
      </>
    )
  }
  return (<>
    <LinksTab menu={getBillingMenu(account, com)} />
    <div className={classes.root}>
      <RebillingByUsers
        users={users}
        billingDt={billingDt}
        rebillingStates={rebillingStates}
        setRebillingStates={setRebillingStates}
        jougenKubun={jougenKubun}
        setJougenKubun={setJougenKubun}
        isSorted={isSorted}
      />
    </div>
    <div style={{height: 80}}></div>
    <div className={classes.sendButton}>
      <Button
        variant="contained"
        onClick={handleSort}
        style={{ marginRight: 16 }}
        startIcon={<SortIcon />}
      >
        表示順切り替え
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
        設定する
      </Button>
    </div>
    <SnackMsg {...snack} />
  </>);
};

const Rebilling = () => {
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);

  if(!loadingStatus.loaded) return(
    <>
      <LoadingSpinner />
    </>
  )
  else if (loadingStatus.error){
    return (<>
      <LoadErr loadStatus={loadingStatus} errorId={'E923556'} />
    </>)
  }

  return(
    <>
      <RebillingMain />
    </>
  );
};

export default Rebilling;