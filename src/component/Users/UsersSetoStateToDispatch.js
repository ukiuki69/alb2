import React,{useState, useEffect} from 'react';
// import store from './store';
import * as Actions from '../../Actions';
import { connect, useDispatch, useSelector } from 'react-redux';
import * as comMod from '../../commonModule';
import { LoadingSpinner, LoadErr} from '../common/commonParts';
import * as mui from '../common/materialUi'
import * as sfp from '../common/StdFormParts'
import UserDialog from './UserDialog';
import SnackMsg from '../common/SnackMsg';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import IconButton from '@material-ui/core/IconButton';

const UserListTitle =(props)=> {
  // 教室未設定の場合は項目表示しない  
  return(
    <div className = "flxTitle" >
      <div className="wmin lower"><div>No</div></div>
      <div className="w07 lower"><div>年齢<br />学齢</div></div>
      <div className="w20 lower">
        <div>種別/サービス<br />受給者証</div>
      </div>
      <div className="wzen4 lower"><div>提供量</div></div>
      {props.classroomCnt > 0 &&
       <div className="w07 lower"><div>単位</div></div>
      }
      <div className="w10 lower"><div>上限額</div></div>
      <div className="wmin lower"><div>管</div></div>
      <div className="w20 lower"><div>氏名</div></div>
      <div className="w20 lower"><div>保護者</div></div>
      <div className="w30 lower"><div>連絡先</div></div>
    </div >

  )
}

const UserlistElms = (props)=>{
  const dispatch = useDispatch();
  let listElms;
  const service = useSelector(state => state.service);
  const classroom = useSelector(state =>state.classroom);
  const allstate = useSelector(state => state);
  const loadingStatus = comMod.getLodingStatus(allstate);

  const clickHandler = (e, editOn)=>{
    // 修正モードでないときは何もしない
    if (!editOn) return false;
    const uid = e.currentTarget.getAttribute('uid');
    props.setuids(uid);
    props.setopen(true);
  }
  const handleUpDownClick = (ev) =>{
    const uid = ev.currentTarget.getAttribute('uid');
    const dir = ev.currentTarget.getAttribute('dir');
    const tmpU = [...props.users];
    const ndx = tmpU.findIndex(e=>e.uid === uid);
    if (ndx === -1)  return false;
    if (ndx === 0 && dir === 'up') return false;
    if (ndx === tmpU.length - 1 && dir === 'down')  return false;
    if (dir === 'up'){
      const current = {...tmpU[ndx]};
      const target = { ...tmpU[ndx - 1]};
      tmpU.splice(ndx, 1, target);
      tmpU.splice(ndx - 1, 1, current);
      const t = tmpU[ndx].sindex;
      tmpU[ndx].sindex = tmpU[ndx - 1].sindex;
      tmpU[ndx - 1].sindex = t;
    }
    else if (dir === 'down'){
      const current = { ...tmpU[ndx] };
      const target = { ...tmpU[ndx + 1]};
      tmpU.splice(ndx, 1, target);
      tmpU.splice(ndx + 1, 1, current);
      const t = tmpU[ndx].sindex;
      tmpU[ndx].sindex = tmpU[ndx + 1].sindex;
      tmpU[ndx + 1].sindex = t;
    }
    dispatch(Actions.updateUsersAll(tmpU));

  }
  const editonRowClass = (props.editOn) ? 'editOn ' : ' '
  const swaponRowClass = (props.swapOn)? 'swapOn ': ' '
  if (loadingStatus.loaded) {
    let users = props.users.filter(e => {
    if (
      (service === '' || service === e.service) &&
      (classroom === '' || classroom === e.classroom  )
      ) {
        return (e);
      }
    });
    listElms = users.map((e, i) => {
      // 仮保険番号であることを示すクラス設定
      const kariNoClass = (e.hno.length < 10) ? 'kariHno' : '';
      return (
        <div 
          key={e.uid} uid={e.uid} 
          className={'userRow flxRow ' + editonRowClass + swaponRowClass}
          onClick={e=>clickHandler(e, props.editOn)}
        >
          <div className='wmin center'>{i + 1}</div>
          <div className='w07'>{e.ageStr}</div>
          <div className='w20'>
            <div>
              {
                comMod.shortWord(e.type) +
                ' / ' +
                comMod.shortWord(e.service)
              }
            </div>
            <div className={'small ' + kariNoClass}>{e.hno}</div>
          </div>
          <div className='wzen4 right'>{e.volume}</div>
          {/* 教室未設定の場合は項目表示しない */}
          {props.classroomCnt > 0 &&
            <div className='w07'>{e.classroom}</div>
          }
          <div className='w10 right'>
            {comMod.formatNum(e.priceLimit, 1)}
          </div>
          <div className="wmin">{e.kanri_type.substr(0, 1)}</div>
          <div className='w20'>
            <div>{e.name}</div>
            <div className='small'>{e.kana}</div>
          </div>
          <div className='w20'>
            <div>{e.pname}</div>
            <div className='small'>{e.pkana}</div>
          </div>
          <div className='w30'>
            <div>{e.pphone}</div>
            <div className='small'>{e.pmail}</div>
          </div>
          <div className='swapButtons'>
            <IconButton onClick={handleUpDownClick} uid={e.uid} dir='up'>
              <ArrowUpwardIcon />
            </IconButton>
            <IconButton onClick={handleUpDownClick} uid={e.uid} dir='down'>
              <ArrowDownwardIcon />
            </IconButton>
          </div>

        </div>
      );
    });
  }
  else if (loadingStatus.error) {
    listElms = (
      <LoadErr loadStatus={loadingStatus} errorId={'E4936'} />
    )
  }
  else{
    listElms = (<LoadingSpinner />);
  }
  return (
    // <div className='tabelBodyWrapper' onScroll={handleScroll}>
    <div className='tabelBodyWrapper' >
      {listElms}
    </div>
  );
}
// ユーザーリストを表示するエレメントを作成
// storeからユーザーリストの配列を取得して表示
// 放デイ、自発のサービスごとにするか全部出すかを判断する
// stateのserviceが空白なら全表示
// usersからrenderを独立させた
export const Users = ()=>{
  const dispatch = useDispatch();
  // 編集用ダイアログの制御
  // const [open, setopen] = useState(false);
  // const [uids, setuids] = useState('');
  // ローカルstateを廃止してディスパッチに変更してみる
  // const [editOn, seteditOn] = useState(false);
  // const [swapOn, setswapOn] = useState(false);
  const users = useSelector(state => state.users);
  const stdDate = useSelector(state=>state.stdDate);
  const cntMode = useSelector(state=>state.controleMode);
  let editOn = (cntMode.editOn) ? cntMode.editOn : false;
  let swapOn = (cntMode.swapOn) ? cntMode.swapOn : false;
  let open = (cntMode.userDialogOpen) ? cntMode.userDialogOpen : false;
  let uids = (cntMode.uids) ? cntMode.uids : false;
  const setopen = (v) => {
    const p = { userDialogOpen: v };
    dispatch(Actions.setControleMode(p));
  };
  const setuids = (v) => {
    const p = { uids: v };
    dispatch(Actions.setControleMode(p));
  };

  // 設定済み教室のカウント 0ならば一覧に教室を表示しない
  const classroomCnt = users.filter(e=>e.classroom).length;
  const fabClickHandler = (e)=>{
    // useStateのセッター替わりの関数定義
    const seteditOn = (v) => {
      const p = {editOn: v};
      dispatch(Actions.setControleMode(p));
    };
    const setswapOn = (v) => {
      const p = { swapOn: v };
      dispatch(Actions.setControleMode(p));
    };
    const name = e.currentTarget.name;
    if (name === 'edit' && editOn){
      seteditOn(false);
    };
    if (name === 'edit' && !editOn) {
      seteditOn(true);
      setswapOn(false);
    };
    if (name === 'swap' && swapOn) {
      setswapOn(false);
    };
    if (name === 'swap' && !swapOn) {
      setswapOn(true);
      seteditOn(false);
    };
    if (name === 'add') {
      setopen(true); 
      seteditOn(false);
    }
  }

  const nav = (
    <div className='pageNav'>
      <div className='buttonWrapperPN'>
        {/* <mui.ServiceChangeButton allowUnSepcified={true} /> */}
      </div>
      {/* 次月前月 */}
      <div className='buttonWrapperPN'>
        {/* <mui.ButtonMonthNav set={-1} /> */}
        {/* <mui.ButtonMonthNav set={1} /> */}
      </div>
      <div className='month'>
        <span className='small'>
          {stdDate.split('-')[0]}年
          </span><br />
        {stdDate.split('-')[1]}
        <span className='small'>月</span>
      </div>
    </div>
  )
  return (<>
    <div className='AppPage userLst fixed'>
      {/* {nav} */}
      <UserListTitle classroomCnt={classroomCnt} />
    </div>
    <div className='AppPage userLst scroll'>
      <UserlistElms 
        // {...props} 
        users={users} stdDate={stdDate}
        editOn={editOn}
        swapOn={swapOn}
        open={open} setopen={setopen}
        uids={uids} setuids={setuids}
        classroomCnt={classroomCnt}
        // settableBodyScroll = {settableBodyScroll}
        // tableBodyScroll = {tableBodyScroll}
      />
      <mui.FabAddEdit 
        clickHandler={e => fabClickHandler(e)} 
        editOn={editOn}
        swapOn={swapOn}
      />
      <UserDialog 
        open={open} setopen={setopen} 
        uids={uids} setuids={setuids} 
        editOn={editOn}
      />
    </div>
  </>)
}

export default Users;

// class Users extends React.Component{
//   render(){
//     return (<UsersMain {...this.props} />)
//   }
// }
// function mapStateToProps(state) {
//   return (state);
// }

// export default connect(mapStateToProps, Actions)(Users);
