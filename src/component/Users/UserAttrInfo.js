import React,{useState, useEffect} from 'react';
import { Button, Dialog, DialogTitle, makeStyles } from "@material-ui/core";
import { END_OF_CONTRACT, END_OF_CONTRACT_NEXT, END_OF_USE, ICARE, JUUSHIN, SOCHISEIKYUU, THIS_MONTH_BIRTHDAY } from '../../modules/contants';
import { blue, grey, orange, pink, red, teal } from '@material-ui/core/colors';
import EmojiPeopleIcon from '@material-ui/icons/EmojiPeople';
import PriorityHighIcon from '@material-ui/icons/PriorityHigh';
import { useSelector } from 'react-redux';
import { formatDate } from '../../commonModule';
import { isClassroom, isService } from '../../albCommonModule';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import EditIcon from '@material-ui/icons/Edit';
import MailOutlineIcon from '@material-ui/icons/MailOutline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faYahoo } from '@fortawesome/free-brands-svg-icons';
import Tooltip from '../common/Tooltip';


const useStyles = makeStyles({
  userAttrInfo: {paddingTop: 4, paddingBottom: 4},
  nameWithAttr: {
    display: 'flex', alignItems: 'center', minHeight: 32,
    '@media print': {
      display: 'none'
    },
    '& .heavy, .medical': {
      fontWeight: 300, 
      // fontSize: '.8rem', padding: '.1rem .2rem', 
      marginInlineEnd: '.6rem',
      color: '#fff', position: 'relative',

    },
    '& .heavy': {background: teal[500]},
    '& .medical': {background: blue[500]},
    '& .text': {fontSize: '.8rem'}
  },
  goodby:{fontSize: 16, color: red[600], marginInlineEnd: 9,},
  emoji: {fontSize: 12, marginInlineEnd: 9,},
  dialogInnerRoot: {
    padding: 8,
    '& .userRow': {
      display: 'flex', padding: '0px 4px',
      '& >div, >a>div': {padding: '8px 4px'},
      '& a': {},
      '& .username': {
        width: 180, position: 'relative',
        '& .MuiSvgIcon-root': { 
          position: 'absolute',
          right: 8,
          top: '50%',
          width: 20,
          height: 20,
          transform: 'translateY(-50%)',
          transition: 'width 0.4s, height 0.4s, transform 0.4s',
          color: grey[300]
        },
        '&:hover .MuiSvgIcon-root': { 
          width: 28,
          height: 28,
          transform: 'translateY(-50%) translateX(-4px)', // こちらを修正
          color: teal[800] + ' !important',  // !important を追加
        }

      },
      '& .cEndTitle': {width: 120, },
      '& .cEnd': {width: 120, color: orange[800]},
      '& .cEndStrong': {width: 120, color: red[800]},
      '& .tel': {width: 140},
      '& .tel2': {fontSize: '.7rem'},
      '& .mail': {
        display: 'flex',
        '& .MuiSvgIcon-root': {color: teal[800],},
        '& .svg-inline--fa': {color: teal[800],},
        '& .icon': {marginTop: -4, padding: '0 4px'},
        '& .faIcon': {padding: '0 4px'},
      }, 
      // '& .mail .MuiSvgIcon-root': {color: teal[800],},
      '& .noMail .MuiSvgIcon-root': {color: grey[800], marginTop: -4, marginLeft: 4},
    },
  },
  dialogTitle: {
    textAlign: 'center',
    '& .titleSmall': {fontSize: '.7rem', textAlign: 'center'},
  },
  dialogButton: {
    textAlign: 'center', marginTop: 8, padding: 8,
  },
  iconNotice: {
    padding: '0 12px',
    '& p':{
      display: 'flex', alignItems: 'center', height: 24, 
      '& .MuiSvgIcon-root, .svg-inline--fa': {
        display: 'inlineBlock', width: 32, textAlign: 'center', 
        color: teal[800],
      }
    },
    '& .small': {fontSize: '.7rem', lineHeight: 1.6, marginLeft: 8},
  }
});

// 契約切れ、または契約切れ間近のユーザーを表示する
const DispUsersContractEnd = ({open, setOpen}) => {
  const classes = useStyles();
  const allState = useSelector(state=>state);
  const history = useHistory();
  const {users, stdDate, classroom, service} = allState;
  const date = new Date(stdDate);
  // 今月の月末と来月の月末を得る
  const endOfMonthObj = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const endOfNextMonthObj = new Date(date.getFullYear(), date.getMonth() + 2, 0);
  const endOfMonth = formatDate(endOfMonthObj, 'YYYY-MM-DD');
  const endOfNextMonth = formatDate(endOfNextMonthObj, 'YYYY-MM-DD');
  // 条件に適合するユーザーを作成する。
  const fUsers = users.reduce((v, user)=>{
    if (!isClassroom(user, classroom)) return v;
    if (!isService(user, service)) return v;
    if (user.contractEnd === '0000-00-00') return v;
    if (user.contractEnd <= endOfNextMonth) v.push(user);
    return v;
  }, []).sort((a, b) => (a.contractEnd < b.contractEnd? -1: 1))
  const usersDisp = fUsers.map((user, i)=>{
    const cEndClassname = user.contractEnd <= endOfMonth ? 'cEndStrong': 'cEnd';
    // エイリアスの除去
    const noAilias = user.pmail? user.pmail.replace(/\+.*@/, '@'): "";
    return (
      <div className='userRow' key={i}>
        <a onClick={()=>{history.push(`users/edit${user.uid}?goback=/users`)}}>
          <div className='username'>
            {user.name}
            <EditIcon/>
          </div>
        </a>
        <div className={cEndClassname}>{user.contractEnd}</div>
        <div className='tel'>
          {user.pphone}
          {user.pphone1 && <div className='tel2'>{user.pphone1}</div>}
        </div>
        {user.pmail && 
          <div className='mail'>
            <a href={`mailto:${noAilias}`}>
              <div className='icon'><MailOutlineIcon/></div>
            </a>
            <a 
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${noAilias}`} 
              target="_blank" rel="noopener noreferrer">
              <div className='faIcon'>
                <FontAwesomeIcon icon={faGoogle} />
              </div>
            </a>
            
            {/* <a 
              href={`https://compose.mail.yahoo.com/?to=${noAilias}`} 
              target="_blank" rel="noopener noreferrer">
              <div className='faIcon'>
                <FontAwesomeIcon icon={faYahoo} />
              </div>
            </a> */}
          </div>
        }
        {!user.pmail &&
          <div className='noMail'></div>
        }

      </div>
    )
  })
  return (
    <Dialog open={open} onClose={()=>setOpen(false)} >
      <DialogTitle className={classes.dialogTitle}>
        契約終了日
        <div className='titleSmall'>確認して下さい</div>
      </DialogTitle>
      <div className={classes.dialogInnerRoot}>
        <div className='userRow'>
          <div className='username'>利用者名</div>
          <div className='cEndTitle'>契約終了日</div>
          <div className='tel'>電話番号</div>
          <div className='mail'>メール</div>
        </div>
        {usersDisp}
      </div>
      <div className={classes.iconNotice}>
        <p><MailOutlineIcon/>クリックするとメールを作成できます。</p>
        <p><FontAwesomeIcon icon={faGoogle} />Gmailはこちらから作成できます。</p>
        <div className='small'>
          メール作成機能はパソコン設定によりご利用になれないことがあります。
        </div>
      </div>
      <div className={classes.dialogButton}>
        <Button onClick={()=>setOpen(false)} variant='contained'>
          閉じる
        </Button>
      </div>
    </Dialog>
  )
}

export const UserAttrInfo = ({ userAttr }) => {
  const [delayedUserAttr, setDelayedUserAttr] = useState(userAttr);
  const classes = useStyles();
  const [warnUserDispm, setwarnUserDisp] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDelayedUserAttr(userAttr);
    }, 100); // 100ミリ秒の遅延

    return () => clearTimeout(timer); // クリーンアップ
  }, [userAttr]);

  const t = Array.isArray(delayedUserAttr) ? delayedUserAttr : [];

  const Iryoucare = () => {
    if (t.includes(ICARE)){
      return (
        <div className={classes.nameWithAttr}>
          <span className='medical'>医</span>
          <span className='text'>
            医療的ケア児の設定がされています。医療的ケア児の請求を行うためには別途設定が必要です。設定なしで請求することも可能です。
          </span>
        </div>
      )
    }
    else return null;
  }

  const Juushin = () => {
    if (t.includes(JUUSHIN)){
      return (
        <div className={classes.nameWithAttr}>
          <span className='heavy'>重</span>
          <span className='text'>
            重症心身障害児の設定がされています。対応施設でなければ重心向けの請求はされません。通常施設でもこのまま請求可能です。
          </span>
        </div>
      )
    }
    else return null;
  }

  const EndOfUse = () => {
    if (t.includes(END_OF_USE)){
      return (
        <div className={classes.nameWithAttr}>
          <EmojiPeopleIcon className={classes.goodby}/>
          <span className='text'>
            当月で利用停止の処理が行われています。当月の請求は通常通り行われますが来月以降は原則として利用者リストから消えます。
          </span>
        </div>
      )
    }
    else return null;
  }

  const ContractEnd = () => {
    const style = {color: pink[300]}
    if (t.includes(END_OF_CONTRACT)){
      return (
        <div className={classes.nameWithAttr}>
          <PriorityHighIcon className={classes.goodby} style={style}/>
          <span className='text'>
            受給者証期限が当月または当月以前に設定されています。確認してください。
          </span>
        </div>
      )
    }
    else return null;
  }

  const ContractEndNext = () => {
    const style = {color: orange[300]}
    if (t.includes(END_OF_CONTRACT_NEXT)){
      return (
        <div className={classes.nameWithAttr}>
          <PriorityHighIcon className={classes.goodby} style={style}/>
          <span className='text'>
            契約終了日が次月に設定されています。確認してください。
          </span>
        </div>
      )
    }
    else return null;
  }
  const ContractEndButton = () => {
    if (t.includes(END_OF_CONTRACT_NEXT) || t.includes(END_OF_CONTRACT)){
      return (
        <div className={classes.nameWithAttr} style={{marginTop: 16}}>
          <Button onClick={()=>setwarnUserDisp(true)} variant='contained'>
            契約期限詳細
          </Button>
        </div>
      )
    }
    else return null;
  }
  const BirthDay = () => {
    if (t.includes(THIS_MONTH_BIRTHDAY)){
      return (
        <div className={classes.nameWithAttr}>
          <span className={classes.emoji}>🎁</span>
          <span className='text'>
            今月がお誕生日です。
          </span>
        </div>
      )
    }
    else return null;
  }
  const Sochiseikyuu = () => {
    if (t.includes(SOCHISEIKYUU)){
      return (
        <div className={classes.nameWithAttr}>
          <span className={classes.emoji}>🛡️</span>
          <span className='text'>
            国保連に請求を行わない「措置請求」の利用者です。
          </span>
        </div>
      )
    }
    else return null;
  }
  const BirthDayNext = () => {
    if (t.includes(THIS_MONTH_BIRTHDAY)){
      return (
        <div className={classes.nameWithAttr}>
          <span className={classes.emoji}>🍬</span>
          <span className='text'>
            来月がお誕生日です。
          </span>
        </div>
      )
    }
    else return null;
  }
  return (
    <>
      {/* <div className={classes.userAttrInfo}><Juushin /></div>
      <div className={classes.userAttrInfo}><Iryoucare /></div>
      <div className={classes.userAttrInfo}><EndOfUse /></div>
      <div className={classes.userAttrInfo}><ContractEnd /></div>
      <div className={classes.userAttrInfo}><ContractEndNext /></div> */}
      <Juushin />
      <Iryoucare />
      <EndOfUse />
      <ContractEnd />
      <ContractEndNext />
      <BirthDay />
      <BirthDayNext />
      <Sochiseikyuu />
      {/* <ContractEndButton/> */}
      {/* <DispUsersContractEnd open={warnUserDispm} setOpen={setwarnUserDisp}/> */}

    </>
  );
}
