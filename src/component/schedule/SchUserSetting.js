import React, {useState, useEffect,useRef, } from 'react';
import * as Actions from '../../Actions';
import { useSelector, useDispatch } from 'react-redux';
import * as comMod from '../../commonModule';
import {LoadingSpinner, LoadErr} from '../common/commonParts';
import { makeStyles, createMuiTheme } from '@material-ui/core/styles';
import { useHistory, useLocation, useParams, } from 'react-router-dom';
import SchUserSettingDialog from './SchUserSettingDialog';
import teal from '@material-ui/core/colors/teal';
import blue from '@material-ui/core/colors/blue';
import grey from '@material-ui/core/colors/grey';
import { Uaddiction } from '../common/commonParts';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {EachAddiction, } from './SchDaySetting';
import { inService, isClassroom, recentUserStyle } from '../../albCommonModule';
import { Button } from '@material-ui/core';
import { DispNameWithAttr } from '../Users/Users';

const useStyles = makeStyles({
  usersRoot: {
    width: 180, height:'calc(100vh - 200px)', overflowY:'scroll',
    position: 'relative', top: 32,
    '& .userWrap':{
      display:'flex', alignItems:'flex-end' ,cursor:'pointer',
      padding: 8, paddingTop: 4,
      '& .n': {width: 16, textAlign: 'center', fontSize:'.8rem', marginRight: 8},
      '& .name': {
        flex: 1, whiteSpace: 'nowrap',textOverflow: 'ellipsis',
        paddingTop: 12,position: 'relative', overflow:'hidden',
        '& .uaddiction': {
          position: 'absolute', top:0, left: 0, fontSize: '.5rem',
          color: teal[300],
        },
      },
      '& .kanri': {width: 16, fontSize:'.8rem',fontWeight:600},
    },
    '& .detailWrap': {fontSize: '.7rem', paddingLeft: '2rem', paddingBottom: 8,},
    '& .oneUserWrap': {cursor: 'pointer'},
    '& .oneUserWrap:nth-of-type(even)':{backgroundColor: grey[100]},
  },
  showDetailSw: {
    cursor: 'pointer', position: 'absolute', right: 0, top: 0,
    display: 'flex', alignItems: 'center', 
    '& .MuiSvgIcon-root':{display:'Block', fontSize:'2rem', color:teal[500]},
    '& .text': {display:'inline-block', padding:4, fontSize: '.7rem'},
  },
  buttonWrap: {
    position: 'absolute', right: 0, top: -40,
  },

});

const OneUser = (props) => {
  const classes = useStyles();
  const {thisUser, n, riyouCount, showDetail, userAttr, setUserAttr} = props;
  const kan = thisUser.kanri_type.slice(0, 1);
  const schedule = useSelector(state=>state.schedule);
  const service = useSelector(state=>state.service);
  const kanStyle = (kan === '管')? {color: teal[500]}: {color:blue[500]};
  const typeLetter = (thisUser.type === '障害児')? '': 'J';
  // const service = thisUser.service;
  const UID = 'UID' + thisUser.uid;
  const thisUserAddiction = comMod.findDeepPath(
    schedule, [service, UID, 'addiction']
  );
  const showOrHide = showDetail? {display: 'block'}: {display:'none'}
  return (<>
    <div className='userWrap' >
      <div className='n' >{n + 1}</div>
      <div className='name'>
        <DispNameWithAttr {...thisUser} userAttr={userAttr} setUserAttr={setUserAttr} uid={thisUser.uid}/>
        <div className='uaddiction'>
          <Uaddiction {...thisUserAddiction} />
        </div>
      </div>
      <div className='kanri' style={kanStyle}>{kan}</div>
      {/* <div className='riyouCnt'>{riyouCount}</div>
      <div className='age'>{thisUser.ageStr}</div> */}
    </div>
    <div className='detailWrap' style={showOrHide}>
      <EachAddiction thisAdc={thisUserAddiction} />
    </div>
  </>)
}


const MainSchUserSetting = ({userAttr, setUserAttr}) =>{
  const classes = useStyles();
  const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service);
  const classroom = useSelector(state=>state.classroom);
  const schedule = useSelector(state=>state.schedule);
  const account = useSelector(state=>state.account);
  const permission = comMod.parsePermission(account)[0][0];
  const scheduleLocked = schedule.locked;
  const controleMode = useSelector(state=>state.controleMode);
  const history = useHistory();
  const dispatch = useDispatch();

  // ダイアログに渡すためのユーザID
  const [suid, setSuid] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // 柱の中で加算等の詳細情報を表示するかどうか
  const [showDetail, setShowDetail] = useState(true);
  const [snack, setSnack] = useState({msg: '', severity: ''});
  useEffect(()=>{
    // ストアに維持されているスクロール量を取得
    const v = controleMode.dSettingUserAriaScrolltop;
    const scroll = v? v: 0; 
    const elm = document.querySelector('#usersRootScrollCnt');
    elm.scrollTop = scroll;
    // ノード消失時にはスクロールをリセットする
    return (()=>{
      setTimeout(() => {
        if (controleMode.dSettingUserAriaScrolltop){
          const closed = !document.querySelector('#usersRootScrollCnt');
          const t = controleMode;
          t.dSettingUserAriaScrolltop = 0;
          dispatch(Actions.setStore({controleMode: t}));
        }
      }, 100);
    });
  }, [])
  const handleClick = (ev) => {
    const uid = ev.currentTarget.getAttribute('uid');
    setSuid(uid);
    setDialogOpen(true);
  }
  const eachUser = users
  .filter(e=>inService(e.service, service))
  // .filter(e=>e.classroom === classroom || classroom === '')
  .filter(e=>isClassroom(e, classroom))
  .map((e, i)=>{
    const UID = 'UID' + e.uid;
    const r = comMod.getRiyouCountOfUser(schedule[UID]);
    const thisUser=comMod.getUser(UID, users);
    const ruStyle = recentUserStyle(UID);

    return (
      <div className='oneUserWrap' 
        uid={e.uid} key={i} onClick={(ev)=>handleClick(ev)}
        style={ruStyle}
      >
        <OneUser 
          uid={e.uid} key={i} onClick={(ev)=>handleClick(ev)}
          thisUser={thisUser} riyouCount={r.riyou} n={i} 
          showDetail={showDetail}
          userAttr={userAttr} setUserAttr={setUserAttr}
        />
      </div>
    );
  });
  const handleExpandClick = () =>{
    if (showDetail) setShowDetail(false);
    else setShowDetail(true);
  }
  const handleLinkClick = () => {
    setTimeout(() => {
      history.push('/schedule/dsetting/bulkupdate/')
    }, 300);
  }
  const buttonDisabled = scheduleLocked? true: false;
  return (<>
    {permission === 100 &&
      <div className={classes.buttonWrap}>
        <Button 
          variant='contained' color='primary' onClick={handleLinkClick}
          disabled={buttonDisabled}
        >
          利用者別加算一括設定
        </Button>
      </div>
    }
    <div className={classes.showDetailSw} onClick={handleExpandClick}>
      {!showDetail && 
        <><div className='text'>詳細表示</div><ExpandMoreIcon/></>
      }
      {showDetail && 
        <><div className='text'>詳細表示を隠す</div><ExpandLessIcon/></>
      }
    </div>
    {/* ディスパッチのときにスクロールが戻るので制御が必要なエレメント */}
    <div className={classes.usersRoot} id='usersRootScrollCnt'>
      <div className='usersWrap'>
        {eachUser}
      </div>
      <SchUserSettingDialog 
        open={dialogOpen} setOpen={setDialogOpen} uid={suid} 
      />
    </div>
  </>);
}

const ErrSchUserSetting = ()=>{
  return(<div>error occured.</div>)
}

const SchUserSetting = ()=>{
  const userFtc = useSelector(state => state.userFtc);
  const fetchCalenderStatus = useSelector(state => state.fetchCalenderStatus);
  // fetch状態の取得
  const done = (
    userFtc.done && fetchCalenderStatus.done
  );
  const errorOccured = (
    userFtc.err || fetchCalenderStatus.err
  );
  const loading = (
    userFtc.loading || fetchCalenderStatus.loading
  );

  if (done) return (<MainSchUserSetting />);
  else if (loading) return (<LoadingSpinner />);
  else if (errorOccured) return (<ErrSchUserSetting />);
  else return null;
}
export default SchUserSetting;