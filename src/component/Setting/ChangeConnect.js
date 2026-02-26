import { Button } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getLodingStatus, parsePermission, setCookeis } from "../../commonModule";
import { LoadingSpinner, PermissionDenied } from "../common/commonParts";
import { KeyListener } from "../common/KeyListener";
import { blue, teal } from "@material-ui/core/colors";
import * as Actions from "../../Actions";

export const ChangeConnect = () => {
  const keyInfoInit = {key: '', shift: false, ctrl: false, meta: false,}
  const [keyInfo, setKeyInfo] = useState(keyInfoInit);
  const [connectName , setConnectName] = useState('');

  const dispatch = useDispatch();
  const allState = useSelector(state=>state);
  const ss = getLodingStatus(allState);
  const {account} = allState;
  
  const apiChHandler = (e) =>{
    const name = e.currentTarget.name;
    setCookeis('endPoint', name);
    setConnectName(name);
    // エンドポイント変更後、ログアウト
    setTimeout(() => {
      dispatch(Actions.clearAcount());
    }, 1000);
  }
  const apiChangeByName = (name) => {
    setCookeis('endPoint', name);
    setConnectName(name);
    // エンドポイント変更後、ログアウト
    setTimeout(() => {
      dispatch(Actions.clearAcount());
    }, 1000);
  }
  useEffect(()=>{
    let isMounted = true;
    const chk = (
      !keyInfo.shift && !keyInfo.ctrl && !keyInfo.meta && isMounted
    )
    if ((keyInfo.key) === '1' && chk){
      apiChangeByName('apixfg');
      setKeyInfo(keyInfoInit);
    }
    if ((keyInfo.key) === '2' && chk){
      apiChangeByName('apidev');
      setKeyInfo(keyInfoInit);
    }
    if ((keyInfo.key) === '3' && chk){
      apiChangeByName('sandbox');
      setKeyInfo(keyInfoInit);
    }
    if ((keyInfo.key) === '4' && chk){
      apiChangeByName('api');
      setKeyInfo(keyInfoInit);
    }
    return (()=>{
      isMounted = false;
    })
    
  }, [keyInfo])
  
  if (!ss.loaded && !ss.error){
    return <LoadingSpinner/>
  }
  else if (ss.error){
    return <div style={{margin:"120px 0 0 120px"}}>error occured.</div>
  }
  const permission = parsePermission(account)[0][0];
  if (permission < 100){
    return <PermissionDenied marginTop='120' />
  }
  return (
    <div style={{margin:"120px 0 0 120px"}}>
      <div style={{padding: 8}}>change endpoint</div>
      <div style={{margin: 8}}>
        <Button
          name = 'apixfg'
          color='primary' 
          variant='outlined'
          style={{width: 400, justifyContent: 'flex-start'}}
          onClick={(e)=>apiChHandler(e)}
        >
          1 apixfg - テストDB接続
        </Button>

      </div>
      <div style={{margin: 8}}>
        <Button
          name = 'apidev'
          color='primary' 
          variant='outlined'
          style={{width: 400, justifyContent: 'flex-start'}}
          onClick={(e)=>apiChHandler(e)}
        >
          2 apidev - api開発用 通常不使用
        </Button>
        
      </div>
      <div style={{margin: 8}}>
        <Button
          name = 'apisandbox'
          color='primary' 
          variant='outlined'
          style={{width: 400, justifyContent: 'flex-start'}}
          onClick={(e)=>apiChHandler(e)}
        >
          3 sandbox - バックアップリストア接続
        </Button>
        
      </div>
      <div style={{margin: 8}}>
        <Button
          name = 'api'
          color='secondary' 
          variant='contained'
          style={{width: 400, justifyContent: 'flex-start'}}
          onClick={(e)=>apiChHandler(e)}
        >
          4 api - 本番DB接続
        </Button>
        
      </div>
      <div style={{fontSize: 20, padding: 8, color: blue[800]}}>
        {connectName}
      </div>
      <KeyListener setKeyInfo={setKeyInfo}/>

    </div>
  )
}
export default ChangeConnect;