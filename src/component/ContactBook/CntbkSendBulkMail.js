import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { getBrothers, getFirstBros, getLodingStatus, getUisCookie, isMailAddress, uisCookiePos } from '../../commonModule';
import { LoadErr, LoadingSpinner } from '../common/commonParts';
import { getFilteredUsers, sendUser } from '../../albCommonModule';
import { Button, Checkbox, FormHelperText, FormLabel, IconButton, Input, makeStyles, useMediaQuery } from '@material-ui/core';
import MailOutlineIcon from '@material-ui/icons/MailOutline';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import SnackMsg from '../common/SnackMsg';
import { teal } from '@material-ui/core/colors';
import CntbkUsersDispatcher from './CntbkUsersDispatcher';
import { CntbkLinksTab } from './CntbkCommon';
import { useGetHeaderHeight } from '../common/Header';

const SIDEBAR_WIDTH = 61.25;

const useStyles = makeStyles({
  AppPage: {
    width: '95vw',
    margin: `${82+32}px auto`,
    "@media (min-width: 1080px)": {
      maxWidth: 1080 + SIDEBAR_WIDTH,
      paddingLeft: SIDEBAR_WIDTH,
    },
    "@media (min-width: 700px) and (max-width: 1079px)": {
      maxWidth: 1080
    },
    "@media (max-width: 959px)": {

    },
  },
  mailAddressTextField: {
    paddingTop: 4,
    '& .mail': {
      width: '16rem',
      marginRight: 16
    },
    "@media (max-width:699px)": {
      '& .mail': {
        width: '14rem'
      },
    },
  },
  mailSendButtons: {
    display: 'flex', justifyContent: 'center',
    marginBottom: 8,
    '& .MuiSvgIcon-root': {
      fontSize: 56
    },
    '& .fa-google': {
      fontSize: 42
    },
    '& .mail': {
      margin: '0 8px'
    },
    '& .gmail': {
      width: 56, height: 56,
      margin: '0 8px'
    }
  },
  main: {
    '& .note': {
      width: '20rem', margin: '0 auto 32px',
      textAlign: 'center',
      '& .iconRow': {
        display: 'flex', alignItems: 'center',
        marginBottom: 4,
        '& .mailIcon': {
          color: teal[800], marginRight: 4
        },
        '& .gmail': {
          fontSize: 18, padding: 3
        }
      },
      '& .cautionary': {
        lineHeight: '24px', textAlign: 'initial', marginBottom: 4
      }
    },
    '& .AllButtonWrapper': {
      // marginBottom: 8,
      '& .allSelectButton': {
        marginRight: 8
      },
      '& .allSelectButton, .allCancelButton': {
        width: 100
      }
    },
    '& .header': {
      zIndex: "2",
      display: 'inline-flex', alignItems: 'center',
      position: 'sticky',
      marginBottom: 16,
      // padding: '16px 0 4px 0',
      backgroundColor: 'white',  
      borderBottom: `1px ${teal[500]} solid`,
      '& .checkbox': {
        width: 42, marginRight: 16
      },
      '& .pname, .name': {
        marginRight: 32,
      },
      '& .mail': {
        width: 'calc(16rem + 64px)', marginRight: 16,
      }
    },
    '& .brosOneRow': {
      display: 'flex',
      '& .pname, .name': {
        lineHeight: '1.5rem',
        marginRight: 32, paddingTop: 9
      },
    },
    '& .brosOneRow:not(:last-child)': {
      marginBottom: 32
    },
    "@media (min-width:960px)": {
      '& .pname, .name': {
        width: '8rem',
      },
    },
    "@media (max-width:959px)": {
      '& .pname, .name': {
        width: '6rem',
      },
    },
  }
});

const getSameMailaddress = (brosUserDts) => {
  const pmail = brosUserDts.reduce((mail, userDt) => {
    const pmail = userDt?.pmail ?? "";
    if(mail === null) mail = pmail;
    return mail === pmail ?mail :"";
  }, null);

  return pmail;
}


/**
 * メールアドレス更新ボタン
 * ・入力されたメールアドレスと元々のメールアドレスが違う場合ボタンを有効化。
 * 入力されたメールアドレスに問題がある場合ボタンを無効化。
 * ・更新ボタンをクリックすると、データベースに送信。元の利用者データを更新。
 * 
 * @component
 * @param {Object} props - UpdateMailButton コンポーネントのプロパティ。
 * @param {string} props.mailAddress - 更新対象のメールアドレス。
 * @param {boolean} props.mailAddressError - メールアドレスのエラー状態を示すブール値。
 * @param {string} props.originMailaddress - 元のメールアドレス。
 * @param {Function} props.setOriginMailaddress - 元のメールアドレスを更新するためのコールバック関数。
 * @param {Array} props.userDts - ユーザー情報のリスト。
 * @param {Array} props.originUsers - 元のユーザー情報のリスト。
 * @param {Function} props.setOriginUsers - 元のユーザー情報リストを更新するためのコールバック関数。
 * @param {Function} props.setSnack - スナックバーを表示するためのコールバック関数。
 * @param {Function} props.setNotUpdateMailaddress - メールアドレスの更新状態を設定するためのコールバック関数。
 * @returns {JSX.Element}
 */
const UpdateMailButton = (props) => {
  const {
    mailAddress, mailAddressError, originMailaddress, setOriginMailaddress,
    userDts, originUsers, setOriginUsers, setSnack, setNotUpdateMailaddress
  } = props;
  const handleClick = async() => {
    if(mailAddressError) return;
    let noProblem = true;
    const users = JSON.parse(JSON.stringify(originUsers));
    for(const userDt of userDts){
      const params = {"a": "sendUserWithEtc", ...userDt, "pmail": mailAddress};
      const res = await sendUser(params, "", setSnack, 'メールアドレスを更新しました。', 'メールアドレスの更新に失敗しました。');
      if(res?.data?.result){
        const uid = userDt.uid;
        const userIndex = users.findIndex(uDt => uDt.uid === uid);
        if(userIndex !== -1){
          const targetUser = users.find(uDt => uDt.uid === uid);
          users[userIndex] = {...targetUser, pmail: mailAddress};
        }
      }else{
        noProblem = false;
        break;
      }
    }
    if(noProblem){
      setOriginUsers([...users]);
      setOriginMailaddress(mailAddress);
      setNotUpdateMailaddress(false);
    }
  }

  const disabled = (
    mailAddress === originMailaddress
    || mailAddressError
  )

  return(
    <Button
      className="mailButton button"
      variant='contained'
      disabled={disabled}
      color="primary"
      onClick={handleClick}
      style={{height: 38}}
    >
      更新
    </Button>
  )
}

const MailAddressTextField = (props) => {
  const classes = useStyles();
  const {
    mailAddress, setMailAddress, mailAddressError, setMailAddressError,
    setNotUpdateMailaddress, originMailaddress
  } = props;

  const handleChange = (e) => {
    const value = e.target.value;
    const check = isMailAddress(value);
    if(!check || value===""){
      setMailAddressError(true);
    }else{
      setMailAddressError(false);
    }
    setMailAddress(value);
    if(value !== originMailaddress){
      setNotUpdateMailaddress(true);
    }else{
      setNotUpdateMailaddress(false);
    }
  }

  const handleFocus = (e) => {
    if(parseInt(getUisCookie(uisCookiePos.selectInputAuto))){
      e.target.select();
    }
  }

  return(
    <FormLabel
      className={classes.mailAddressTextField}
    >
      <Input
        className='mail'
        error={mailAddressError}
        value={mailAddress}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      <FormHelperText
        style={{color: 'red'}}
      >
        {mailAddressError ?"メールアドレスが不正です" :null}
      </FormHelperText>
    </FormLabel>
  )
}

/**
 * 兄弟でまとめたフォーム
 * ・入力メールアドレスと元々のメールアドレスが違う場合は、編集したとみなして更新ボタンを有効化。
 * notUpdateMailaddressにtrueをセットして、チェックボックスを無効化。
 * ・メールアドレスのチェックは、onChange時に実行。
 * ・UpdateMailButtonをクリックしたら、メールアドレスを更新
 * 
 * @component
 * @param {Object} props - BrosOneRow コンポーネントのプロパティ。
 * @param {Array} props.userDts - 兄弟ごとのユーザー情報のリスト。
 * @param {Array} props.originUsers - 元のユーザー情報のリスト。
 * @param {Function} props.setOriginUsers - 元のユーザー情報リストを更新するためのコールバック関数。
 * @param {Array} props.selectMailList - 選択されたメールアドレスのリスト。
 * @param {Function} props.setSelectMailList - 選択されたメールアドレスリストを更新するためのコールバック関数。
 * @param {Function} props.setNotUpdateMailaddress - メールアドレスの更新状態を設定するためのコールバック関数。
 * @param {Function} props.setSnack - スナックバーを表示するためのコールバック関数。
 * @returns {JSX.Element} BrosOneRow コンポーネントのレンダリング結果。
 */
const BrosOneRow = (props) => {
  const isLimit959px = useMediaQuery("(max-width:699px)");
  const classes = useStyles();
  const {
    userDts, originUsers, setOriginUsers,
    selectMailList, setSelectMailList, setNotUpdateMailaddress,
    setSnack,
  } = props;
  const pmail = getSameMailaddress(userDts);
  const [originMailaddress, setOriginMailaddress] = useState(pmail);
  const [mailAddress, setMailAddress] = useState(pmail);
  const [mailAddressError, setMailAddressError] = useState(false);
  const pname = userDts.reduce((name, userDt) => {
    if(name === "親氏名エラー") return name;
    if(!name) return userDt.pname;
    return name === userDt.pname ?name :"親氏名エラー";
  }, null);
  const nameNodes = userDts.map((userDt, i) => (
    <div
      key={i}
    >
      {userDt.name}
    </div>
  ))
  const disabled = !mailAddress || mailAddress!==originMailaddress;

  const handleClick = () => {
    if(mailAddress!==originMailaddress){
      setSnack({...{
        msg: 'メールアドレスが更新されていません。更新ボタンを押してください。', severity: 'warning',
        id: new Date().getTime()
      }});
    }else if(mailAddress === ""){
      setSnack({...{
        msg: 'メールアドレスが登録されていません。', severity: 'warning',
        id: new Date().getTime()
      }});
    }else{
      setSnack({...{}});
    }
  }

  const handleChange = (e) => {
    if(originMailaddress !== mailAddress){
      setSnack({...{
        msg: 'メールアドレスが更新されていません。更新ボタンを押してください。', severity: 'warning',
        id: new Date().getTime()
      }})
      return;
    }
    if(e.target.checked){
      setSelectMailList([...selectMailList, pmail])
    }else{
      setSelectMailList([...selectMailList.filter(x => x !== pmail)]);
    }
    setSnack({...{}});
  }

  const mailAddressTextFieldProps = {
    mailAddress, setMailAddress, mailAddressError, setMailAddressError, setNotUpdateMailaddress,
    originMailaddress
  };
  const updateMailButtonProps = {
    mailAddress, mailAddressError, originMailaddress, setOriginMailaddress,
    userDts, originUsers, setOriginUsers, setSnack, setNotUpdateMailaddress
  }

  return(
    <div className="brosOneRow" style={isLimit959px ?{display: "block"} :{}}>
      <div style={{display: 'flex'}}>
        <div
          onClick={handleClick}
          style={{marginRight: 16}}
        >
          <Checkbox
            checked={selectMailList.includes(mailAddress)}
            onChange={handleChange}
            name='displayDate'
            color="primary"
            disabled={disabled}
          />
        </div>
        <div className='pname'>{pname}</div>
        <div className='name'>{nameNodes}</div>
      </div>
      <div style={{display: 'flex', justifyContent: 'center'}}>
        <MailAddressTextField {...mailAddressTextFieldProps} />
        <UpdateMailButton {...updateMailButtonProps} />
      </div>
    </div>
  )
}

const SelectAllCheckbox = (props) => {
  const { setSelectMailList, usersPerBros, notUpdateMailaddress } = props;
  const handleChange = (e) => {
    const checked = e.target.checked;
    if(checked){
      const allMailaddress = usersPerBros.map(brosUserDts => (
        getSameMailaddress(brosUserDts)
      )).filter(x => x);
      setSelectMailList([...allMailaddress]);
    }else{
      setSelectMailList([...[]]);
    }
  }

  return(
    <Checkbox
      onChange={handleChange}
      color='primary'
      disabled={notUpdateMailaddress}
      style={{padding: 3, margin: '0 6px'}}
    />
  )
}

/**
 * すべて選択用のチェックボックス
 * ・メールアドレスを変更後更新していない場合はdisabled
 * ・メールアドレスが設定されている利用者のみ選択
 * ・userDtから登録されているすべてのメールアドレスをselectMailListステートにセット
 * ・チェックを外した場合はelectMailListステートにからの配列をセット
 * 
 * @component
 * @param {Object} props - SelectAllButton コンポーネントのプロパティ。
 * @param {Function} props.setSelectMailList - メールリストの選択状態を更新するためのコールバック関数。
 * @param {Array} props.usersPerBros - 兄弟ごとのユーザーのリスト。
 * @param {boolean} props.notUpdateMailaddress - メールアドレスが更新されていないことを示すブール値。
 * @param {Function} props.setSnack - スナックバーを表示するためのコールバック関数。
 * @returns {JSX.Element}
 */
const SelectAllButton = (props) => {
  const {setSelectMailList, usersPerBros, notUpdateMailaddress, setSnack} = props;

  const allActionButtonProps = { setSelectMailList, usersPerBros, notUpdateMailaddress }
  return(
    <div
      className='AllButtonWrapper'
      onClick={() => {
        if(notUpdateMailaddress){
          setSnack({...{
            msg: 'メールアドレスが更新されていません。更新ボタンを押してください。', severity: 'warning',
            id: new Date().getTime()
          }})
        }else{
          setSnack({...{}})
        }
      }}
    >
      <SelectAllCheckbox {...allActionButtonProps} />
    </div>
  )
}

/**
 * メインテーブル
 * 兄弟ごとに分かれた利用者データを回し、兄弟別のフォームを作成
 *
 * @component
 * @param {Object} props - UserMailTable コンポーネントのプロパティ。
 * @param {Array} props.usersPerBros - 兄弟ごとのユーザーのリスト。
 * @param {Array} props.originUsers - 元のユーザーのリスト。
 * @param {Function} props.setOriginUsers - 元のユーザーリストを更新するためのコールバック関数。
 * @param {Array} props.selectMailList - 選択されたメールのリスト。
 * @param {Function} props.setSelectMailList - 選択されたメールリストを更新するためのコールバック関数。
 * @param {Function} props.setNotUpdateMailaddress - メールアドレスの更新状態を設定するためのコールバック関数。
 * @param {Function} props.setSnack - スナックバーを表示するためのコールバック関数。
 * @returns {JSX.Element}
 */
const UserMailTable = (props) => {
  const headerHeight = useGetHeaderHeight();
  const isLimit959px = useMediaQuery("(max-width:699px)");
  const {
    usersPerBros, originUsers, setOriginUsers,
    selectMailList, setSelectMailList, setNotUpdateMailaddress,
    setSnack, notUpdateMailaddress
  } = props;
  const rows = usersPerBros.map((userDts, index) => {
    const brosOneRowProps = {
      userDts, originUsers, setOriginUsers,
      selectMailList, setSelectMailList, setNotUpdateMailaddress,
      setSnack,
    };
    return (<BrosOneRow key={`brosOneRow${index+1}`} {...brosOneRowProps} />);
  })

  return(
    <div style={{width: 'fit-content', margin: '0 auto'}}>
      <div className='header' style={{top: headerHeight + 48}}>
        <div className='checkbox'>
          <SelectAllButton
            setSelectMailList={setSelectMailList}
            usersPerBros={usersPerBros}
            notUpdateMailaddress={notUpdateMailaddress}
            setSnack={setSnack}
          />
        </div>
        <div className='pname'>保護者名</div>
        <div className='name'>利用者名</div>
        {!isLimit959px &&<div className='mail'>メールアドレス</div>}
      </div>
      {rows}
    </div>
  )
}

/**
 * メール作成用のアイコンボタン
 * 1. 各メールアドレスからエイリアスを削除
 * 2. メールアドレスが選択されていない場合disabled
 * 3. disabled時にボタンを押そうとすると、注意メッセージ表示
 * 
 * @param {list} selectMailList - 選択されたメールアドレス一覧
 * @param {object} account - メールの宛先(to)に使うメールアドレスを取得するためのアカウント情報
 * @param {function} setSnack - スナックメッセージ表示用
 * @returns {JSX.Element}
 */
const MailSendButtons = (props) => {
  const classes = useStyles();
  const {selectMailList, account, setSnack} = props;
  //送信先メールアドレスのエイリアスを削除
  const noAiliasBccMailAddress = selectMailList.map(mail => mail.replace(/\+.*@/, '@')).join(',');
  //宛先（to）に使うアカウントメールドレスのエイリアスを削除
  const noAilias = account?.mail ?? "";
  //送信先メールアドレスがない場合、ボタンを押せなくする。
  const disabled = selectMailList.length ?false :true;

  const handleClick = () => {
    if(disabled){
      setSnack({...{
        msg: '送信先を選択してください。', severity: 'warning',
        id: new Date().getTime()
      }});
    }else{
      setSnack({...{}});
    }
  }

  const mailIconColor = teal[800];
  return(
    <div className={classes.mailSendButtons} onClick={handleClick}>
      {/* PCデフォルトのメーラー用 */}
      <IconButton
        className='mail'
        href={`mailto:${noAilias}?bcc=${noAiliasBccMailAddress}`}
        disabled={disabled}
      >
        <MailOutlineIcon style={disabled ?{} :{color: mailIconColor}} />
      </IconButton>
      {/* Gmail用 */}
      <IconButton
        className='gmail'
        href={`https://mail.google.com/mail/?view=cm&fs=1&to=${noAilias}&bcc=${noAiliasBccMailAddress}`}
        target="_blank"
        disabled={disabled}
      >
        <FontAwesomeIcon
          icon={faGoogle}
          style={disabled ?{} :{color: mailIconColor}}
        />
      </IconButton>
    </div>
  )
}

/**
 * 説明・注意書きを表示
 * 幅を20remに固定（最初の一文の長さがこれだから）
 * 1. 一般メーラー用アイコンの説明文
 * 2. Gmailアイコンの説明分
 * 3. 注意書き
 * 
 * @returns {JSX.Element}
 */
const MailButtonDescriptionText = () => (
  <div className='note'>
    <div className='iconRow'>
      <MailOutlineIcon className='mailIcon mail' />クリックするとメールを作成できます。
    </div>
    <div className='iconRow'>
      <FontAwesomeIcon
        icon={faGoogle}
        className='mailIcon gmail'
      />
      Gmailはこちらから作成できます。
    </div>
    <div className='cautionary'>
      メール作成機能はパソコン設定によりご利用になれないことがあります。
    </div>
  </div>
)

export const CntbkSendBulkMail = () => {
  const headerHeight = useGetHeaderHeight();
  const classes = useStyles();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {users, service, classroom, account} = allState;
  const [originUsers, setOriginUsers] = useState(users);
  //チェックボックスで選択されたメールアドレス一覧
  const [selectMailList, setSelectMailList] = useState([]);
  //フォーム入力後、更新していないメールアドレスが存在する時ture
  const [notUpdateMailaddress, setNotUpdateMailaddress] = useState(false);
  const [snack, setSnack] = useState({});
  //利用者一覧を兄弟ごとにまとめた２次元配列。
  const usersPerBros = useMemo(() => {
    const newUsers = JSON.parse(JSON.stringify(originUsers));
    newUsers.sort((a, b) => (parseInt(a.sindex) - parseInt(b.sindex)));
    const filteredUsers = getFilteredUsers(newUsers, service, classroom);
    const list_by_bros = filteredUsers.map(userDt => (
      getFirstBros(userDt.uid, newUsers) ?getBrothers(userDt.uid, newUsers, true) :[userDt]
    ))
    const bros_dtlist = [...new Set(list_by_bros.map(JSON.stringify))].map(JSON.parse).filter(x => x.length!==0);
    return bros_dtlist;
  }, [originUsers]);

  if (loadingStatus.error){
    return (
      <>
      <CntbkLinksTab />
      <LoadErr loadStatus={loadingStatus} errorId={'E4933'} />
      </>
    )
  }
  if(!loadingStatus.loaded){
    return (
      <>
      <CntbkLinksTab />
      <LoadingSpinner/>
      </>
    )
  }

  //メール作成アイコンボタン用のprops
  const mailSendButtonProps = {selectMailList, account, setSnack}
  //すべて選択用のprops
  const allActionButtonProps = { setSelectMailList, usersPerBros, notUpdateMailaddress, setSnack }
  //メインテーブル用のprops
  const userMailTebleProps = {
    usersPerBros, originUsers, setOriginUsers,
    selectMailList, setSelectMailList, setNotUpdateMailaddress,
    setSnack, notUpdateMailaddress
  };

  return(
    <>
    <CntbkLinksTab />
    <div className={classes.AppPage} style={headerHeight ?{marginTop: headerHeight+32} :{}}>
      <div className={classes.main}>
        {/* メール作成アイコンボタン */}
        <MailSendButtons {...mailSendButtonProps}/>
        {/* 説明・注意書き */}
        <MailButtonDescriptionText />
        {/* すべて選択　チェックボックス */}
        {/* <SelectAllButton {...allActionButtonProps} /> */}
        {/* メインテーブル */}
        <UserMailTable {...userMailTebleProps}/>
      </div>
    </div>
    <SnackMsg {...snack} />
    {/* ノードの消失を検知して、現在のusersをディスパッチ */}
    <CntbkUsersDispatcher originUsers={originUsers} id="2126" />
    </>
  )
}