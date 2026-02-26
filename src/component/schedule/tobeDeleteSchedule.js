import React, {useState} from 'react';
import * as Actions from '../../Actions';
import { connect, useDispatch, useSelector } from 'react-redux';
// import SchHeadNav from './SchHeadNav';
import SchTableHead from './SchTableHead';
// import SchTableBody from './SchTableBody';
import * as comMod from '../../commonModule';
import { SnapberAlert, } from '../common/materialUi';
import * as mui from '../common/materialUi';
import {LoadingSpinner, LoadErr, StdErrorDisplay} from '../common/commonParts';
import SimpleModal from '../common/modal.sample';
import SchDailyDialog from './SchDailyDialog';
import SimpleDialogDemo from '../../DrowerMenu'
import SchSaveLater from './SchSaveLater';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { Link, useLocation } from 'react-router-dom';
import {LinksTab} from '../common/commonParts';
const useStyles = makeStyles({
  linktabRoot: {
    marginTop: 47,
    '& > .MuiButton-text': {
      // margin: theme.spacing(1),
      padding: 0,
    },
  },
});
export const menu = [
  { link: "/schedule", label: "月間" },
  { link: "/schedule2", label: "月間β" },
  { link: "/schedule/dsetting", label: "日時設定" },
  { link: "/schedule/weekly", label: "週間" },
  { link: "/schedule/weekly/transfer", label: "送迎" },
  { link: "/schedule/users", label: "利用者別" },
  { link: "/schedule/calender", label: "休校・休日設定" },
]

// export const SchLinks = () => {
//   const classes = useStyles();
//   // react-routerからロケーション取得
//   const ref = useLocation().pathname;
//   const prms = [
//     { link: "/schedule", label: "月間" },
//     { link: "/schedule/weekly", label: "週間" },
//     { link: "/schedule/users", label: "ユーザー別" },
//     { link: "/schedule/calender", label: "休校・休日設定" },
//   ];
//   const linkList = prms.map((e, i) => {
//     let cls = (ref === e.link) ? 'current' : '';
//     return (
//       <Button key={i} >
//         <Link className={cls} to={e.link}>{e.label}</Link>
//       </Button>
//     )
//   });
//   return (<>
//     <div className={'linksTab fixed ' + classes.linktabRoot}>
//       {linkList}
//     </div>
//   </>);
// }


// import * as comMod from '../../commonModule';
// import classes from '*.module.css';

// ComponentFunctionに変更
const ScheduleMain = (props) => {
  // カレンダーとScheduleを送信するためのスイッチ  
  // const [savePromise, setsavePromise] = useState(false);
  // カレンダーとスケジュールをロードする
  const fetchCalenderAndSchedule = () => {
    let prms = {
      date: props.stdDate,
      hid: props.hid,
      bid: props.bid,
      a: 'fetchCalender',
    }
    props.fetchCalender(prms);
    prms = {
      date: props.stdDate,
      hid: props.hid,
      bid: props.bid,
      a: 'fetchSchedule',
    }
    props.fetchSchedule(prms);
  }
  const dispatch = useDispatch();
  const users = props.users;
  const com = props.com;
  const comAdic = com.addiction[props.service];
  // const dispatch = useDispatch();
  // それぞれのフェッチの状態をまとめる。スケジュールとかも追加になる予定
  const done = (
    props.userFtc.done && props.fetchCalenderStatus.done
  );
  const errorOccured = (
    props.userFtc.err || props.fetchCalenderStatus.err
  );
  const loading = (
    props.userFtc.loading || props.fetchCalenderStatus.loading
  )
  // サービスが未指定の場合は指定を行う
  if (!props.service) {
    props.changeService(props.serviceItems[0]);
  }
  if (!users.length){
    return (
      <StdErrorDisplay 
        errorText='利用者が登録されていません。' 
        errorSubText='スケジュール登録は利用者の登録を行ってから実施して下さい。'
        errorId='E144578'
      />
    )
  }
  else if (!comAdic){
    return (
      <StdErrorDisplay 
        errorText='請求情報等が未登録です。' 
        errorSubText={`事業所の定員や地域区分など予定設定に必要な最低限の情報が未登録です。
        設定メニューの請求・加算の項目から設定をお願いします。`}
        errorId='E144579'
      />
    )

  }
  else if (done) return (<>
    <LinksTab menu={menu} />
    <div className='AppPage schedule fixed'>
      {/* <SchHeadNav /> */}
      <SchTableHead />
    </div>
    <div className='AppPage schedule scroll'>
      <SchTableBody />
      <SnapberAlert {...props} />
      <mui.FabSchedule />
    </div>

  </>);
  else if (errorOccured) return (
    <LoadErr loadStatus={'ユーザー取得またはカレンダー取得エラー'} errorId={'E4992'} />
  );
  else if (loading) return (<LoadingSpinner />);
  else return '???';
}


class Schedule extends React.Component{
  render(){
    return(<ScheduleMain {...this.props} />)
  }
}
function mapStateToProps(state) {
  return (state);
}
export default connect(mapStateToProps, Actions)(Schedule);
