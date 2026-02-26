import { Button, IconButton, Input, makeStyles } from '@material-ui/core';
import { grey, teal } from '@material-ui/core/colors';
import React,{useEffect, useState} from 'react';
import * as Actions from '../../Actions';
import { useDispatch, useSelector,  } from 'react-redux';
import { useHistory, useLocation } from 'react-router';
import { convUid, isClassroom, isService, recentUserStyle, setRecentUser, univApiCall } from '../../albCommonModule';
import { convHankaku, findDeepPath, getLodingStatus } from '../../commonModule';
import { LinksTab, LoadErr, LoadingSpinner } from '../common/commonParts';
import { SelectGp } from '../common/FormPartsCommon';
import { DateInput } from '../common/StdFormParts';
import EditIcon from '@material-ui/icons/Edit';
import SnackMsg from '../common/SnackMsg';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import SchLokedDisplay from '../common/SchLockedDisplay';

const useStyle = makeStyles({
  root:{
    margin:'94px auto',minWidth: 1080, maxWidth: 1280, paddingLeft: 64,
    '& .noBorder': {border: 'none'},
    '& .diabledRow': {opacity: .6},
    '& .clickable': {cursor: 'pointer'},
    '& .MuiInputBase-input.Mui-disabled ': {background: grey[100]},
    '& .sFormaParts': {
      padding: 0
    },
    '& .headline': {
      marginBottom: 8,
      textAlign: 'center',
      padding: 8,
      fontWeight: '600',
      color: teal[800],
      backgroundColor: teal[50],
      borderBottom: `1px solid ${teal[300]}`
    },
    '& .flxTitle': {
      justifyContent: 'space-between', position: 'sticky', top: 50, backgroundColor: 'white', zIndex: 100, margin: '0 8px',
    },
    '& .noCell': {width: '2rem', flex: '0 0 2rem'},
    '& .nameCell': {width: '10rem', flex: '0 0 10rem'},
    '& .contCell': {width: '7rem', flex: '0 0 7rem'},
    '& .contEndCell': {width: '7rem', flex: '0 0 7rem'},
    '& .lineNoCell': {width: '3.5rem', flex: '0 0 3.5rem'},
    '& .volumeCell': {width: '3.5rem', flex: '0 0 3.5rem'},
    '& .selectCell': {width: '4rem', flex: '0 0 4rem'},
    '& .preLineNoCell': {width: '3.5rem', flex: '0 0 3.5rem'},
    '& .preVolCell': {width: '3.5rem', flex: '0 0 3.5rem'},
    '& .preContCell': {width: '7rem', flex: '0 0 7rem'},
    '& .preContEndCell': {width: '7rem', flex: '0 0 7rem'},
    '& .preUseCountCell': {width: '3.5rem', flex: '0 0 3.5rem'},
    '& .sendButton': {position: 'fixed', right: 40, bottom: 20}
  },
  userRow: {
    justifyContent: 'space-between', margin: '0 8px',
    '& .valCell': {lineHeight: '32px'},
    '& .nameCell': {
      position: 'relative', textOverflow: 'ellipsis', whiteSpace: 'nowrap',  overflow: 'hidden',
      '& .editIcon': {
        position: 'absolute',
        top: 10,
        right: 16,
        width: 8,
        opacity: 0,
        lineHeight: '32px'
      },
      '&:hover .editIcon': {
        opacity: 1,
      }
    }
  }
});

const UsersDispatcher = ({originUsers}) => {
  const dispatch = useDispatch();
  useEffect(()=>{
    return () =>{
      setTimeout(()=>{
        const closed = !document.querySelector('#userDispatcher2125');
        if (closed){
          dispatch(Actions.setStore({users: originUsers}));
        }
      }, 100)
    }
  }, [originUsers])
  return (
    <div id='userDispatcher2125' style={{display: 'none'}}/>
  )
}

export const UsersContactInfoLinksTab = () => {
  const menu = [
    { link: "/users/contract", label: "入力フォーム" },
    { link: "/users/contractReport", label: "帳票" },
  ];

  return (<LinksTab menu={menu}/>)
}

// 利用者契約情報の編集
export const UsersContractInfoMain = ({allState}) =>{
  const classes = useStyle();
  const history = useHistory();
  const {users, stdDate, controleMode, service, classroom, serviceItems} = allState;
  const serviceKey = service ?service :serviceItems[0];
  const dispatch = useDispatch();
  const [originUsers, setOriginUsers] = useState(JSON.parse(JSON.stringify(users)));
  const [snack, setSnack] = useState({});
  useEffect(()=>{
    // スクロール量を復元
    const prescroll = controleMode.userPaeScroll? controleMode.userPaeScroll: 0;
    if (prescroll){
      document.scrollingElement.scrollTop = prescroll;
    }else{
      window.scrollTo(0, 0)
    }
  },[]);
  const schLocked = allState.schedule.locked;
  const thisMonth = stdDate.slice(0, 7);
  const histry = useHistory();
  // deep copy
  const trgUsers = JSON.parse(JSON.stringify(originUsers)).filter(userDt => {
    if(!(isService(userDt, service) && isClassroom(userDt, classroom))) return false;
    return true
  });
  // 当月に契約日含まれる利用者にフラグ立て
  trgUsers.forEach(e => {
    const isMultiSvc = e.service.split(',').length > 1;
    const data = isMultiSvc ?e?.etc?.multiSvc?.[serviceKey] :{};
    const contractDate = data?.contractDate ?? e.contractDate;
    const contractEnd = data?.contractEnd ?? e.contractEnd;
    e.target = contractDate.includes(thisMonth) || contractEnd.includes(thisMonth);
  });
  // ターゲットユーザーを上位に
  trgUsers.sort((a, b) => (a.target ?-1 :1));
  // 表示行数分の配列になるので初期値を設定しておく
  const formStateInit = {
    select: '', preVol: '', preContDate: '', preEndDate: '', preLineNo: '',
    preUseCount: '',
  };
  
  // フォームの値 有効値の数だけデータオブジェクトを配列化する
  const [val, setVal] = useState(
    trgUsers.reduce((result, userDt) => {
      if(!userDt.target) return result;
      const userContractInfo = findDeepPath(userDt, ['ext', 'userContractInfo', serviceKey]);
      if(userContractInfo && userContractInfo.stdDate === stdDate){
        result.push({...userContractInfo});
      }else{
        result.push({...formStateInit});
      }
      return result;
    }, [])
  );

  const selectOpt = ['変更', '新規', '終了'];
  const handleChange = (e, i, fname, v) => {
    const name = fname? fname: e.target.name;
    const t = [...val];
    t[i][name] = v? v: e.target.value;
    setVal([...t]);
  }
  const handleBlur = (e, i) => {
    const name = e.target.name;
    let v = e.target.value;
    v = convHankaku(v);
    const t = [...val];
    t[i][name] = v;
    setVal(t);
  }
  // 利用者情報の編集
  const handleClick = (uid) => {
    if (schLocked) return false;
    setRecentUser(uid);
    const v = document.scrollingElement.scrollTop;
    const t = JSON.parse(JSON.stringify(controleMode));
    t.userPaeScroll = v;
    dispatch(Actions.setStore({controleMode: t}));
    uid = convUid(uid).n;
    const newLoc = '/users/edit' + uid + '/';
    histry.push(newLoc);
  }

  const clickSendButton = async() => {
    const data = JSON.parse(JSON.stringify(originUsers));
    const preContDate = [...document.querySelectorAll('.flxRow input[name=preContDate]')];
    const preEndDate = [...document.querySelectorAll('.flxRow input[name=preEndDate]')];
    for(const [i, userDt] of trgUsers.entries()){
      if(val.length <= i) break;
      const sendDt = JSON.parse(JSON.stringify(val[i]));
      sendDt["stdDate"] = stdDate;
      sendDt["preContDate"] = preContDate[i].value;
      sendDt["preEndDate"] = preEndDate[i].value;
      const ext = findDeepPath(userDt, ['ext'], {});
      if(!ext['userContractInfo']) ext['userContractInfo'] = {};
      // ext['userContractInfo'] = {};
      ext['userContractInfo'][serviceKey] = sendDt;
      // ext.userContractInfo = sendDt;
      const prms = {
        a: "sendUsersExt",
        hid: userDt.hid,
        bid: userDt.bid,
        uid: userDt.uid,
        ext: JSON.stringify({...ext})
      }
      await univApiCall(prms, '', '', setSnack, '登録しました。', '登録に失敗');
      data[data.findIndex(x => x.uid === userDt.uid)].ext = ext;
    }
    setOriginUsers([...data]);
    dispatch(Actions.setStore({users: [...data]}));
    // backReportsComponent(location, history);
    history.goBack();
  }

  const uList = trgUsers.map((e, i)=>{
    const isMultiSvc = e.service.split(',').length > 1;
    const data = isMultiSvc ?e?.etc?.multiSvc?.[serviceKey] :{};
    const contractDate = data?.contractDate ?? e.contractDate;
    const contractEnd = data?.contractEnd ?? e.contractEnd;
    console.log(e.name, contractDate, contractEnd)
    const volume = data?.volume ?? e.volume;
    const lineNo = data?.lineNo ?? e.lineNo;
    let thisOpts;
    // 契約日等の状態により選択肢を変更する
    if (!contractDate.includes(thisMonth)){
      thisOpts = selectOpt.filter(e=>e !== '新規' && e !== '変更');
    }
    if (!contractEnd.includes(thisMonth)){
      thisOpts = selectOpt.filter(e=>e !== '終了');
    }
    thisOpts = thisOpts? thisOpts: selectOpt;
    const inRange = (i < val.length);
    const disableRow = inRange? '': 'diabledRow';
    const recentStyle = recentUserStyle(e.uid);
    return (
      <div className={`userRow flxRow noBorder ${disableRow} ${classes.userRow}`} key={i}>
        <div className='center noCell valCell' style={recentStyle}>{i + 1}</div>
        <div className='clickable nameCell valCell' onClick={() => handleClick(e.uid)}>
          {e.name}
          <div className="editIcon"><EditIcon /></div>
        </div>
        <div className="contCell valCell">{contractDate}</div>
        <div className='contEndCell valCell'>{contractEnd}</div>
        <div className='center volumeCell valCell'>{!serviceKey.includes("相談支援") ?volume :""}</div>
        <div className='center lineNoCell valCell'>{lineNo}</div>
        <div className='selectCell'>
          {inRange &&
            <SelectGp
              onChange={(e) => handleChange(e, i, 'select')}
              name={'select'} nullLabel='なし'
              value={val[i].select} noLabel opts={thisOpts}
              disabled={!e.target}
            />
          }
        </div>
        <div className='preVolCell'>
          {inRange &&
            <Input
              name='preVol' value={val[i].preVol ?val[i].preVol :""}
              onChange={(e)=> handleChange(e, i)}
              onBlur={e => handleBlur(e, i)}
              disabled={val[i].select !== '変更' || serviceKey.includes("相談支援")} // inputType = 'num'
            />
          }
        </div>
        <div className='preLineNoCell'>
          {inRange &&
            <Input
              name='preLineNo' value={val[i].preLineNo ?val[i].preLineNo :""}
              onChange={(e)=> handleChange(e, i)}
              onBlur={e => handleBlur(e, i)}
              disabled={val[i].select !== '変更'} // inputType = 'num'
            />
          }
        </div>
        <div className='preContCell'>
          {inRange &&
            <DateInput
              name='preContDate' def={val[i].preContDate}
              label = '' noLabel helperTextShort
              disabled={val[i].select !== '変更'}
            />
          }
        </div>
        <div className='preContEndCell'>
          {inRange &&
            <DateInput
              name='preEndDate' def={val[i].preEndDate}
              label = '' noLabel helperTextShort
              disabled={val[i].select !== '変更'}
            />
          }

        </div>
        <div className='preUseCountCell'>
          {inRange &&
            <Input
              name='preUseCount' value={val[i].preUseCount ?val[i].preUseCount :""}
              onChange={(e)=> handleChange(e, i)}
              onBlur={e => handleBlur(e, i)}
              disabled={val[i].select === '' || val[i].select === '新規' || serviceKey.includes("相談支援")} // inputType = 'num'
            />
          }
        </div>
      </div>
    )
  });
  const Titles = () => {
    return(
      <div className='flxTitle'>
        <div className='lower noCell'>No</div>
        <div className='lower nameCell'>利用者名</div>
        <div className='lower contCell'>契約日</div>
        <div className='lower contEndCell'>契約終了日</div>
        <div className='lower volumeCell'>契約<br/>支給量</div>
        <div className='lower lineNoCell'>記入欄<br/>番号</div>
        <div className='lower selectCell'>種別</div>
        <div className='lower preVolCell'>前回<br/>契約<br/>支給量</div>
        <div className='lower preLineNoCell'>前回<br/>記入欄<br/>番号</div>
        <div className='lower preContCell'>前回<br/>契約日</div>
        <div className='lower preContEndCell'>前回<br/>契約終了日</div>
        <div className='lower preUseCountCell'>前回<br />終了時<br/>提供量</div>
      </div>
    )
  }
  return (<>
    <div className={'AppPage ' + classes.root} style={{position: 'relative'}}>
      <div className='headline'>
        <IconButton
          style={{position: 'absolute', fontSize: 16, top: -1, left: 64}}
          // onClick={() => backReportsComponent(location, history)}
          onClick={() => history.goBack()}
        >
          <ArrowBackIosIcon />
          <span>戻る</span>
        </IconButton>
        契約内容報告書登録
      </div>
      <Titles/>
      {uList}
      {!schLocked &&
        <div className='sendButton buttonWrapper'>
          <Button
            variant='contained'
            // onClick={() => backReportsComponent(location, history)}
            onClick={() => history.goBack()}
          >
            キャンセル
          </Button>
          <Button
            color='primary'
            variant='contained'
            onClick={clickSendButton}
          >
            登録
          </Button>
        </div>
      }
    </div>
    <SchLokedDisplay/>
    <SnackMsg {...snack}/>
    <UsersDispatcher originUsers={originUsers}/>
  </>)
}

const UsersContractInfo = () => {
  const allState = useSelector(state=>state);
  const loadingStatus = getLodingStatus(allState);

  if(!loadingStatus.loaded){
    return (<LoadingSpinner />);
  }else if(loadingStatus.error){
    return (<LoadErr loadStatus={loadingStatus} errorId={'E32592'} />);
  }
  return (<UsersContractInfoMain allState={allState}/>);
}
export default UsersContractInfo;
