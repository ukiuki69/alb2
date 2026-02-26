import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, FormControl, FormGroup, FormControlLabel, Checkbox, IconButton, makeStyles } from '@material-ui/core';
import { deepPurple, yellow, red } from '@material-ui/core/colors';
import { Group as GroupIcon, Close as CloseIcon } from '@material-ui/icons';
import { useSelector } from 'react-redux';
import { defaultTitle, isClassroom, isService, recentUserStyle } from '../../albCommonModule';
import { getUser } from '../../commonModule';
import { getLS, getLSTS, setLS, setLSTS } from '../../modules/localStrageOprations';
import { DispNameWithAttr } from '../Users/Users';

const useStyles = makeStyles({
  '@keyframes vibrate': {
    '0%': { transform: 'translateY(0)' },
    '2%': { transform: 'translateY(-12px)' },
    '4%': { transform: 'translateY(12px)' },
    '6%': { transform: 'translateY(-6px)' },
    '8%': { transform: 'translateY(6px)' },
    '10%': { transform: 'translateY(0)' },
    '100%': { transform: 'translateY(0)' },
  },
  userLabelRoot:{
    display: 'inline-flex', alignItems: 'center',
    // '& >*': {},
    '& .num': {width: 32, textAlign: 'center'},
      '& .name': {maxWidth: 200, },
    '& .age': {marginInlineStart: 8},
  },
  oneUserInUserSelectDialog:{
    paddingLeft: 16,
  },
  userSelectDialog:{
    padding: 4,
    borderRadius: 2,
  },
  dialogTitle:{
    padding: 0,
    paddingLeft: 26,
  },
  closeButton: {
    // position:'relative',
    // top: 0,
    // right: 0,
  },
  scrollBody: {
    padding: '8px 8px 16px 0px',
  },
  cheeckBoxRoot: {
    padding: 8,
    paddingLeft: 16,
    maxHeight: '75vh',
    '& .MuiCheckbox-root': {
      padding: 4,
    },
  },
  dialogOpenButtonRoot:{
    position: 'fixed',
    top: 80, right: 20, width: 180, paddingTop: 10,
    '& .MuiButton-root': {width: '100%'},
    '& .buttonText':{display: 'flex',},
    '& .buttonText soan':{display: 'block',},
    '& .buttonText span:nth-of-type(1)' :{
      fontSize: '.6rem',
      margin: '.7rem 2px 0',
      marginLeft: '.6rem',
    },
    '& .buttonText span:nth-of-type(2)': {
      fontSize: '1.2rem',
      margin: '0 2px 0'
    },
    '& .buttonText span:nth-of-type(3)': {
      fontSize: '.6rem',
      margin: '.7rem 2px 0'
    },
    '& .scheduleCount' : {
      padding: 6,
      textAlign: 'center',
      '& span' :{
        color:'#00695c',
        fontWeight: 'bold',
      }
    },
  },
  notAllSelectedButton: {
    color: yellow[200],
    animation: '$vibrate 4s infinite',
    '& .MuiSvgIcon-root': {
      color: yellow[200],
    }
  },
  noneSelectedButton: {
    color: red[200],
    animation: '$vibrate 4s infinite',
    '& .MuiSvgIcon-root': {
      color: red[200],
    }
  },
  formControl:{},


})

// ドキュメント印刷などのときにユーザーの選択を行う
// ユーザーのリストはチェックボックスやラジオボタンに利用する
// boolenの値を持ったstateを受け取る
// [{uid:xxx, checked:true/false}, ...]
// ダイアログ自体を提供する
// open closeは親コンポーネントのstateで制御される
// type = 0 : チェックボックス 1 : ラジオボタン
// ラジオボタンはまだ作ってない
// props.displayLimit: 表示制限の配列。falsy なら従来通り全表示。
//   次の要素名のみ指定可能（配列内は任意組み合わせ）：
//   [
//     'Heavy',              // 重症心身障害児アイコン「重」
//     'Medical',            // 医療的ケア児アイコン「医」
//     'GoodBy',             // 当月利用停止アイコン
//     'ThisMonthWarning',   // 受給者証期限 当月警告
//     'NextMonthWarning',   // 受給者証期限 次月警告
//     'BirthdayDisp',       // 今月誕生日アイコン 🎁
//     'BirthdayDispNext',   // 来月誕生日アイコン 🍬
//     'SochiseikyuuDisp',   // 措置請求（国保連に請求しない）🛡️
//   ]
//   備考: 'UidDisp' は displayLimit の影響を受けません（常時表示）。

// ユーザーの選択を行うダイアログ
// UserSelectDialogWithButton を使用してください。
export const UserSelectDialog = (props) => {
  const classes = useStyles();
  const {
    open, setOpen, userList, setUserList, type, 
    dispAll, // サービス、単位にかかわらず全て表示するかどうか
    lsName:propsLsName, // ローカルストレージに保存する名前のprefix
    localStrageExSecs, // ローカルストレージの有効期限
    displayLimit, // 表示制限の配列

  } = props;
  const nodeType = (type)? type : 0;
  // checkAllの初期値を決める userListに一個でもfalseがあったらfalse
  let chk = true;
  userList.map(e=>{if (!e.checked) chk = false;});
  const [checkAll, setCheckAll] = useState(chk);
  const {users, classroom, service, stdDate, hid, bid} = useSelector(s=>(
    {
      users: s.users, classroom: s.classroom, service: s.service, stdDate: s.stdDate,
      hid: s.hid, bid: s.bid,
    }
  ));
  const MakeUserLabel = (props) => {
    const {uid, num} = props;
    const r = getUser(uid, users);
    return (
      <span className={classes.userLabelRoot}>
        <span className='num'>{num + 1}</span>
        <span className='name'>
          {/* <DispNameWithAttr {...r} displayLimit={['SochiseikyuuDisp']}/> */}
          <DispNameWithAttr {...r} displayLimit={displayLimit} />
        </span>
        <span className='age'>{r.ageStr}</span>
      </span>
    );
  }
  // propsで与えられた名前を元にローカルストレージの名前を決定する
  const lsName = (() => {
    if (!propsLsName) return false;
    if (dispAll) return `userSelect-${hid}-${bid}-${stdDate}-${propsLsName}`;
    else return `userSelect-${hid}-${bid}-${stdDate}-${service}${classroom}-${propsLsName}`
  })();
  useEffect(()=>{
    const tUserList = [...userList];
    const lsUserList = getLSTS(lsName, localStrageExSecs);
    console.log('loaded' ,lsName, lsUserList)
    if (lsUserList && Array.isArray(lsUserList)){
      lsUserList.forEach(e=>{
        const n = tUserList.findIndex(f=>f.uid === e.uid);
        if (n >= 0){
          tUserList[n].checked = e.checked;
        }
      });
    }
    // まずdispAllのチェックを行う
    tUserList.forEach((e, i)=>{
      const user = getUser(e.uid, users);
      // 該当ユーザーでない場合はチェックをオフにしておく
      if (!dispAll && (!isClassroom(user, classroom) || !isService(user, service))){
        tUserList[i].checked = false;
      }
    })
    // ローカルストレージに値が無いときは、dispAllのチェック後に全てtrue
    if (!lsUserList) tUserList.forEach(e=>e.checked = true)
    console.log('tUserList before setUserList:', tUserList);
    console.log('userList before setUserList:', userList);
    setUserList([...tUserList]);
  }, [])
  const handleChange = (ev) => {
    const euid=ev.currentTarget.getAttribute('name');
    console.log('euid', euid);
    const i = userList.findIndex(_=>_.uid === euid);
    const t = [...userList];
    const c = t[i].checked ? false : true;
    t[i] = {...t[i], checked:c};
    setUserList(t);
  }
  const handleChangeAll = (ev) => {
    const c = checkAll ? false: true;
    setCheckAll(c);
    const t = [...userList];
    t.map(e=>{
      e.checked = c;
    });
    setUserList(t);
  }
  
  let userNum = 0;
  const nodesChekBox = userList.map((e, i)=>{
    const ruStyle = recentUserStyle(e.uid);
    const user = getUser(e.uid, users);
    // console.log(isClassroom(user, classroom), 'isClassroom(user, classroom)')
    // console.log(isService(user, service), 'isService(user, service)')
    // 該当ユーザーでない場合は表示しない
    if (!dispAll && (!isClassroom(user, classroom) || !isService(user, service))){
      return null;
    }
    return(
      <div key={e.uid} style={ruStyle} className={classes.oneUserInUserSelectDialog} >
        <FormControlLabel key={i}
          control={
            <Checkbox checked={e.checked}
            onChange={(e)=>handleChange(e)} name={e.uid} />
          }
          label={<MakeUserLabel uid={e.uid} num={userNum++}/>}
        />
      </div>
    )
  }).filter(e=>e);
  const handleClose = () => {
    setOpen(false);
    // ローカルストレージに現在の状態を保持する
    if (lsName){
      console.log('saved', lsName, userList)
      setLSTS(lsName, userList);
    }
  }
  return (<>
    <Dialog className={classes.userSelectDialog}
      open={open}
      onClose={handleClose}
    >
      <DialogTitle className={classes.dialogTitle}>
        <FormControlLabel
          control={
            <Checkbox checked={checkAll}
              onChange={(e) => handleChangeAll(e)} name='all' />
          }
          label='すべて選択'
        />
        <IconButton
          color="primary" className={classes.closeButton}
          onClick={handleClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers={true} className={classes.scrollBody}>
        <div className={classes.cheeckBoxRoot}>
          <FormControl component="fieldset" className={classes.formControl}>
            <FormGroup>
              {nodesChekBox}
            </FormGroup>
          </FormControl>
        </div>
      </DialogContent>
    </Dialog>
  </>)
}


const UserSelectDialogWithButton = (props) => {
  const { 
    userList, style, dispAll = true, localStrageExSecs = 60 * 24, // 1日に変更
    displayLimit,
    open: propsOpen, setOpen: propsSetOpen, // 外部制御用
    children, // ボタンの下に表示する要素（対象件数など）
  } = props;
  const classes = useStyles();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const userSelectOpen = propsOpen !== undefined ? propsOpen : internalOpen;
  const setUserSelectOpen = propsSetOpen !== undefined ? propsSetOpen : setInternalOpen;
  
  // 全選択されているかどうかを判定
  const isAllSelected = userList.length > 0 && userList.every(e => e.checked);
  const selectedCount = userList.filter(e => e.checked).length;
  
  const buttonClass = (() => {
    if (selectedCount === 0) return classes.noneSelectedButton;
    if (!isAllSelected) return classes.notAllSelectedButton;
    return '';
  })();

  return (
    <div className={classes.dialogOpenButtonRoot + ' noprint'} id='wrrty45' style={style}>
      <Button
        onClick={() => setUserSelectOpen(true)}
        color='secondary'
        className={buttonClass}
        variant='contained'
      >
        <GroupIcon fontSize='large' />
        <div className='buttonText'>
          <span>設定済み</span>
          <span>{selectedCount}</span>
          <span>人</span>
        </div>
     </Button>
     {children}
     <UserSelectDialog {...props} open={userSelectOpen} setOpen={setUserSelectOpen} />

    </div>
  );
};

export default UserSelectDialogWithButton;