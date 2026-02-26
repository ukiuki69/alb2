import { Button } from '@material-ui/core';
import React, {useEffect, useState, useRef} from 'react';
import { useHistory } from 'react-router-dom';
import { KeyListener } from './KeyListener';


const ChangeEndpoint = () =>{
  const history = useHistory();
  const keyInfoInit = {key: '', shift: false, ctrl: false, meta: false,}
  const [keyInfo, setKeyInfo] = useState(keyInfoInit);
  const handleClick = () => {
    history.push('/chep')
  }
  useEffect(()=>{
    let isMounted = true;
    const chk = (
      !keyInfo.shift && !keyInfo.ctrl && !keyInfo.meta && isMounted
    )
    if ((keyInfo.key).toLowerCase() === 'q' && chk){
      handleClick();
      setKeyInfo(keyInfoInit);
    }
    return (()=>{
      isMounted = false;
    })
    
  }, [keyInfo])
  return (
    <div style={{margin: 8}}>
      <Button
        name = 'api' id='chep'
        color='primary' variant='outlined' 
        onClick={handleClick}
      >
        Q 接続変更
      </Button>
      <KeyListener setKeyInfo={setKeyInfo}/>
    </div>

  )
}
export default ChangeEndpoint;