import React, { useState, useEffect } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Dialog from '@material-ui/core/Dialog';
import AddBoxIcon from '@material-ui/icons/AddBox';
import IndeterminateCheckBoxIcon from '@material-ui/icons/IndeterminateCheckBox';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import * as comMod from '../../commonModule'
import { useDispatch, useSelector } from 'react-redux';
import { setUseResult } from '../../Actions';
import * as mui from '../common/materialUi';
import * as Actions from '../../Actions';
import CancelIcon from '@material-ui/icons/Cancel';
import PersonIcon from '@material-ui/icons/Person';
import Button from '@material-ui/core/Button';
import Avatar from '@material-ui/core/Avatar';
import AddIcon from '@material-ui/icons/Add';
import Typography from '@material-ui/core/Typography';
import { blue, red, yellow } from '@material-ui/core/colors';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import DoubleArrowIcon from '@material-ui/icons/DoubleArrow';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import * as sfp from '../common/StdFormParts';
import * as afp from '../common/AddictionFormParts';
import { TextGP, useStyles } from '../common/FormPartsCommon';
import { faBullseye, faSleigh } from '@fortawesome/free-solid-svg-icons';
import { Height } from '@material-ui/icons';
import { faLess } from '@fortawesome/free-brands-svg-icons';
import { BankInfoFormsParts } from '../common/BankInfoFormsParts';

const useStyle = makeStyles({
  links: {
    '& > a > .MuiButton-text': {
      // margin: theme.spacing(1),
      padding: 0,
      color: '#fff'
    },
  },
  nextUserNotation:{
    flex: 1, display: 'flex', alignItems: 'center',
    paddingLeft: 8,
    '& > div':{
      background: blue[900], color:yellow[200],
      fontSize: '.8rem', padding: 8,
    }
  },
  sameNameButton:{
    background: red[800],color: '#fff',
    '&:hover': {background: red[700]}
  }
})

const Links = (props) => {
  const { tab, settab } = props;
  const classes = useStyle();
  return (<>
    <div className={'linksTab ' + classes.links} >
      <a 
        onClick={() => settab(0)} 
        className={(tab === 0) ? 'current' : ''}
      >
        <Button tabIndex={-1}>基本</Button>
      </a>
      <a 
        onClick={() => settab(1)} 
        tabIndex='-1' className={(tab === 1) ? 'current' : ''}
      >
        <Button tabIndex={-1} >口座情報</Button>
      </a>
    </div>
  </>)
}
// ユーザー情報に次の情報があるかどうか
// 次の情報があるときは表示を行う
export const NextUserDisp = (props) => {
  const classes = useStyle();
  const {thisUser} = props;
  const Notation = () => (
    <div className={classes.nextUserNotation}>
      <div>
        変更は{thisUser.next.slice(0, 7)}以降に反映されません。
      </div>
    </div>
  )
  if (thisUser.next)  return <Notation />
  else return null;
}

export const UserDialog = (props) =>{
  // stateのopenで開く、uidsはuidを持つ
  // editOnで修正モード、uidに従って修正を行う
  const {open, setopen, editOn, uids, ...other} = props;
  const hid = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const stdDate = useSelector(state => state.stdDate);
  const dateList = useSelector(state => state.dateList);
  const dispatch = useDispatch();
  const titleStr = (editOn) ? '利用者修正削除' : '利用者追加';
  const classes = useStyles();
  const lcClasses = useStyle();
  // 所属のユニークなリストを作成する
  const users = useSelector(state=>state.users);
  const nextUsers = useSelector(state=>state.nextUsers);
  const belongs1Set = new Set();
  const belongs2Set = new Set();
  const [sameName, setSameName] = useState(false); // 同姓同名チェック用
  users.map(e=>{
    belongs1Set.add(e.belongs1);
    belongs2Set.add(e.belongs2);
  });
  const belongs1List = Array.from(belongs1Set);
  const belongs2List = Array.from(belongs2Set);
  // sindexの最大値を作成する 新規追加のときはこれを使う
  // const aryMax = (a, b) => {return Math.max(a, b)};
  // const sindexMax = (users.length) 
  // ? users.map(e=>e.sindex).reduce(aryMax) + 10 : 0;
  const sindexMax = users.reduce((v, e)=>(e.sindex > v? v = e.sindex: v), 0);

  
  // uidに従ったuserの情報 後からメンバーを見に行くので空のobjで初期化
  const thisUser = (uids)? comMod.getUser(uids, users, nextUsers) : {};
  // 口座情報用
  // nullが帰ってきたら初期値を設定
  let bi = comMod.fdp(thisUser, 'etc.bank_info', {});
  // 銀行口座項目を配列にしておく
  const bankInfoNames = [
    '口座名義人', '口座番号', '口振初回', '店舗番号', 
    '金融機関番号', '預金種目', '顧客コード',
  ]
  // 銀行口座項目ステイトに書き込む初期値
  const biIni = {};
  bankInfoNames.forEach(e=>{biIni[e] = ''});
  const bankInfo = (!Object.keys(bi).length || !bi)? biIni: bi;
  // 該当スケジュールが存在するかどうか
  const uSchedule = useSelector(state=>state.schedule['UID' + uids]);
  const existUsch = uSchedule 
  ? Object.keys(uSchedule).filter(e=>e.match(/^D2[0-9]*/)).length : 0;
  // 当月のスケジュールが存在せず当月に作成されたスケジュールであれば削除可能にする
  // ユーザーが一人のときも削除不可
  const enableDelete = (
    thisUser.date === stdDate && existUsch === 0 && users.length > 1
  );
  
  // ユーザーステイト日付から年月を示す文字列を得る
  const lastUpdate = !thisUser.date? ''
  : thisUser.date.slice(0, 4) + '年' + thisUser.date.slice(5, 7) + '月'
  // // 送迎先の初期値を設定
  // const destListInit = (comMod.findDeepPath(thisUser, 'etc.destList') === null)?
  //   ['自宅', '学校',] : thisUser.etc.destList;
  // 行き先指定するためのstate
  const [destList, setDestList] = useState([]);
  // 削除ボタン用
  const [deleteConfirm, setDeleteConfirm] = useState(
    {flg: false, label: '削除', buttonClass: ''}
  )
  // dialog内のタブ
  const [tab, setTab] = useState(0);
  // urlが口座情報を示していたら口座情報修正を開く それ以外なら一般項目
  useEffect(()=>{
    const href = window.location.href;
    if (href.indexOf('bankinfo') > -1){
      setTab(1);
    }
    else{
      setTab(0);
    }
  }, [open])

  const formId = '#fgr649hg';
  const keyHandler = (e) =>{
    if (e.which === 13 && e.shiftKey) handleSubmit(e);
  }
  const daysOfMonth = dateList.length;
  // 口座情報を削除するオプションを追加　2022/12/15
  const handleSubmit = (e, deleteBankInfo)=>{
    e.preventDefault();
    // 値が必要なエレメント
    const inputs = document.querySelectorAll(formId + ' input');
    const selects = document.querySelectorAll(formId + ' select');
    // エラーメッセージ用のノード
    const errMsgDisp = document.querySelector(formId + ' .errMsg');
    errMsgDisp.textContent = '';
    // 必須項目が入力されているか
    const notFilled = comMod.checkRequireFilled([inputs, selects]);
    // 基本項目のタブであれば銀行口座情報の未入力は無視する
    if (tab === 0){
      bankInfoNames.forEach(e=>{
        const p = notFilled.findIndex(f=>f === e);
        if (p > -1){
          notFilled.splice(p, 1);
        }
      })
    }
    if (notFilled.length){
      console.log(notFilled);
      errMsgDisp.textContent = '必要な項目が入力されていません。';
      return false;
    }
    // エラーがないか helperテキストエラーのセレクタを定義
    const errOccured = document.querySelectorAll(
      formId + ' .MuiFormHelperText-root.Mui-error'
    );
    if (errOccured.length){
      console.log(errOccured);
      errMsgDisp.textContent = 'エラーのところがあります。';
      // スナックバー表示でダイアログが閉じる！
      // dispatch(Actions.setSnackMsg(
      //   'エラーが発生している入力項目があります。', 'error'
      // ));
      return false;
    }
    // フォームの値を取得 disabledも取得 空白入力も取得
    const userDatas = comMod.getFormDatas([inputs, selects], true, true);
    // 必要なデータ変更を行う 名字と名前の連結 未入力の場合を想定する
    const cn = (a, b) =>{
      a = (a) ? a : '';   b = (b) ? b : '';
      return ((a && b) ? a + ' ' + b : a + b)
    }
    userDatas.name = cn(userDatas.lname, userDatas.fname);
    userDatas.pname = cn(userDatas.plname, userDatas.pfname);
    userDatas.kana = cn(userDatas.klname, userDatas.kfname);
    userDatas.pkana = cn(userDatas.pklname, userDatas.pkfname);
    const ages = comMod.getAge(userDatas.birthday);
    userDatas.age = ages.age;
    userDatas.ageNdx = ages.ageNdx;
    userDatas.ageStr = ages.flx;

    // これだけ半角変換が効かないので
    userDatas.scity_no = comMod.convHankaku(userDatas.scity_no);
    // 法人事業所idの付加
    userDatas.hid = hid;
    userDatas.bid = bid;
    userDatas.stdDate = stdDate;
    // 日付の空白は1989年とかに解釈されるので
    userDatas.endDate = (!userDatas.endDate)?'0000-00-00':userDatas.endDate;
    // 管理タイプ未入力だとエラーになる
    userDatas.kanri_type = (userDatas.kanri_type) ? userDatas.kanri_type:'';
    
    userDatas.date = stdDate; // 追加 2022/01/03
    // 同姓同名のチェック
    if (!editOn){
      const s = users.find(e=>e.name === userDatas.name);
      if (s){
        errMsgDisp.textContent = '二重登録しようとしていませんか？';
        if (!sameName){
          setSameName(true);
          return false;
        }
      }
    }

    // storeの更新
    // フォームの項目で不足しているパラメータがあるので従来のパラメータに
    // 上書きする
    userDatas.users = users;
    const newUserData = {...thisUser, ...userDatas};
    // 学齢の計算 追加のときは学齢がないので
    if (newUserData.age === undefined){
      newUserData.age = comMod.getAge(newUserData.birthday).age;
      newUserData.ageNdx = comMod.getAge(newUserData.birthday).ageNdx;
      newUserData.ageStr = comMod.getAge(newUserData.birthday).flx;
    }
    // 新規追加はインデックス最大値を使う
    if (!newUserData.sindex)  newUserData.sindex = sindexMax + 10;
    // 指定があったら口座情報は削除する
    if (deleteBankInfo){
      bankInfoNames.forEach(e=>{
        delete newUserData[e];
      })
    }
    // 口座情報をetc配下に
    newUserData.etc = newUserData.etc? newUserData.etc: {};
    newUserData.etc.bank_info 
    = newUserData.etc.bank_info? newUserData.etc.bank_info: {};
    bankInfoNames.forEach(e=>{
      if (newUserData[e]){
        newUserData.etc.bank_info[e] = newUserData[e];
        delete newUserData[e];
      }
    });
    // ストアの更新 必要なん？
    const userForEdit = {...newUserData};
    if (userForEdit.volume === '0'){
      userForEdit.volume = daysOfMonth - 8; // 原則の日数
    }
    dispatch(Actions.editUser({...userForEdit}));
    // ここで書き込み送信を行う
    // ここではaパラメータ必須。削除と兼用しているため stdDateも送信する
    // 余分なユーザデータ配列が付与されているので削除
    const sendUserDt = {...newUserData};
    delete sendUserDt.users;
    sendUserDt.date = stdDate;
    sendUserDt.etc = JSON.stringify(sendUserDt.etc);
    dispatch(Actions.updateUser({...sendUserDt, a:'sendUserWithEtc'}));
    document.querySelector(formId).reset();
  }
  const cancelSubmit = ()=>{
    setDestList([]);
    setopen(false);
    document.querySelector(formId).reset();
  }
  const deleteUser = ()=>{
    const uid = comMod.convUID(uids).num;
    if (!deleteConfirm.flg){
      setDeleteConfirm({
        flg: true, label: '削除実行', buttonClass: 'buttonStrong'
      });
      const errMsgDisp = document.querySelector(formId + ' .errMsg');
      errMsgDisp.textContent = 
        `利用者の削除を行うと当月以降のこの利用者の操作に影響があります。` +
        `充分に注意して削除して下さい。契約終了の場合は契約終了日を設定して下さい。`;
      return false;
    }
    // storeから削除実行
    let prms = {
      uid, users, delete:true,
    }
    dispatch(Actions.editUser(prms));
    // ここではaパラメータ必須。削除と兼用しているため
    prms = {
      hid, bid, uid: uids, a: 'removeUser', date: stdDate,
    }
    dispatch(Actions.updateUser(prms));
  }
  const lastUpdateStyle = {
    position: 'absolute',top: 8, right: 8, color: '#222', fontSize: '.8rem'
  }
  const lastUpdateStr = lastUpdate? '最終更新: ' + lastUpdate: '';
  // 契約終了日は当月の日付のみ許可する
  // コンポーネントに渡すための日付範囲の指定文字列を作成する
  const monthEnd = comMod.getDateEx(
    stdDate.split('-')[0], stdDate.split('-')[1], 0
  ).dt;
  const monthEndStr = comMod.formatDate(monthEnd, 'YYYY-MM-DD');
  const endDateLimit = stdDate + ',' + monthEndStr; // ex 2021-04-01,2021-04-30
  // フォーム内のパーツをくくるラッパーのスタイル
  // タブによって表示非表示を切り替える。
  // ついでにパデイィングの調整もやってる
  const [formPartsStyle, setFormPartsStyle] = useState({
    main: {display: 'flex', padding: '0 8px'},
    bank: {display: 'none', },
  })
  useEffect(()=>{
    if (tab === 0){
      setFormPartsStyle({
        main: {display: 'flex', padding: '0 8px'},
        bank: {display: 'none', },
      })
    }
    else{
      setFormPartsStyle({
        main: {display: 'none', },
        bank: {display: 'flex', },
      })
    }
  }, [tab]);
  return(<>
    <Dialog className={classes.usersDialog}
      open={open}
      onClose={()=>setopen(false)}
    >
      <DialogTitle>
        <div className='formTitle' style={{marginBottom: 0}}>
          {titleStr}
          <div style={lastUpdateStyle}>{lastUpdateStr}</div>
        </div>
      </DialogTitle>
      <DialogContent className={classes.userDialogContentRoot}>
        <Links tab={tab} settab={setTab} />
        <form 
          className="dialogForm users" id="fgr649hg" autoComplete="off"
          onKeyPress={(e)=>keyHandler(e)}
          style={{paddingTop: 8}}
        >
          <div className='cntRow' style={formPartsStyle.main}>
            <sfp.NameInput
              nameLname={'lname'} nameFname={'fname'}
              labelLname={'名字'} labelFname={'名'}
              required
              def={thisUser.name}
            />
            <sfp.NameInput
              nameLname={'klname'} nameFname={'kfname'}
              labelLname={'みょうじ'} labelFname={'なまえ'}
              required
              kana
              def={thisUser.kana}
            />
            <sfp.DateInput
              name={'birthday'} label={'生年月日'} required
              def={thisUser.birthday}
            />
          </div>

          <div className='cntRow' style={formPartsStyle.main}>
            <sfp.ServiceType def={thisUser.service} />
            <sfp.UserType def={thisUser.type} />
            <sfp.HihokenNo def={thisUser.hno} uid={uids}/>
            <sfp.Volume def={thisUser.volume} />
            <sfp.PriceLimit def={thisUser.priceLimit} />
            <sfp.Scity
              def={[thisUser.scity, thisUser.scity_no]}
              label={'支給市区町村'} name={'scity'}
              labelNo={'番号'} nameNo={'scity_no'}
            />
            <sfp.KanriType def={thisUser.kanri_type} />
          </div>

          <div className='cntRow' style={formPartsStyle.main}>
            <sfp.DateInput
              name={'startDate'} label={'利用開始日'} required
              def={thisUser.startDate}
            />
            <sfp.DateInput
              name={'contractDate'} label={'契約日'} required
              def={thisUser.contractDate}
            />
            <sfp.DateInput
              name={'endDate'} label={'契約終了日'}
              def={thisUser.endDate}
              limit={endDateLimit}
              limitErrMsg='当月の日付を入力して下さい。'
            />
            <sfp.ContractLineNo
              name={'endDate'} label={'契約終了日'}
              def={thisUser.lineNo}
            />
          </div>
          <div className='cntRow' style={formPartsStyle.main}>
            <sfp.NameInput
              nameLname={'plname'} nameFname={'pfname'}
              labelLname={'保護者名字'} labelFname={'保護者名'}
              required
              def={thisUser.pname}
            />
            <sfp.NameInput
              nameLname={'pklname'} nameFname={'pkfname'}
              labelLname={'みょうじ'} labelFname={'なまえ'}
              required
              kana
              def={thisUser.pkana}
            />
            <sfp.BrosersIndex def={thisUser.brosIndex} />
          </div>
          <div className='cntRow' style={formPartsStyle.main}>
            <sfp.MailInput
              name={'pmail'} label={'保護者メール'}
              def={thisUser.pmail}
            />
            <sfp.PhoneInput
              name={'pphone'} label={'保護者電話1'} required
              def={thisUser.pphone}
            />
            <sfp.PhoneInput
              name={'pphone1'} label={'保護者電話2'}
              def={thisUser.pphone1}
            />
          </div>

          <div className='cntRow' style={formPartsStyle.main}>
            <sfp.Belongs
              name={'belongs1'} label={'所属1'} options={belongs1List}
              def={thisUser.belongs1}
            />
            <sfp.Belongs
              name={'belongs2'} label={'所属2'} options={belongs2List}
              def={thisUser.belongs2}
            />
            <sfp.ClassRoom def={thisUser.classroom} />
          </div>
          <div className='cntRow' style={formPartsStyle.bank}>
            <BankInfoFormsParts bankInfo={bankInfo} thisUser={thisUser} />
          </div>
          <div style={{...formPartsStyle.bank, height: 320}}></div>
          <div className='errMsg'></div>
          {/* <sfp.TransferList 
            destList={destList} setDestList={setDestList} 
            uid={uids}
          /> */}
        </form>
       
      </DialogContent>
      <DialogActions>
        <NextUserDisp thisUser={thisUser} />
        <div className='buttonWrapper'>
          {editOn && enableDelete &&
            <mui.ButtonGP
              // color='Error'
              addictionclass={classes[deleteConfirm.buttonClass]}
              label={deleteConfirm.label}
              onClick={deleteUser}
            />
          }
          <mui.ButtonGP
            color='secondary'
            label='キャンセル'
            onClick={cancelSubmit}
          />
          {sameName === false &&
            <mui.ButtonGP
              color='primary'
              label='送信'
              type="submit"
              onClick={handleSubmit}
            />
          }
          {sameName === true &&
            // <mui.ButtonGP
            //   addictionclass={lcClasses.sameNameButton}
            //   label='同姓同名として書き込み'
            //   type="submit"
            //   onClick={handleSubmit}
            // />
            <Button className={lcClasses.sameNameButton}
              onClick={handleSubmit}
            >
              同姓同名の利用者として書き込み
            </Button>

          }

        </div>
      </DialogActions>
      
    </Dialog>
    
  </>)
}
export default UserDialog;