import React, { useEffect, useState , useRef} from 'react';
import { useSelector } from 'react-redux';
import { fdp, parsePermission } from '../../commonModule';
import { useHistory } from 'react-router-dom';
import { grey } from '@material-ui/core/colors';
import { Button, makeStyles } from '@material-ui/core';
import { defaultTitle } from '../../albCommonModule';
import UseResultIconButton from './UseResultIconButton';

const useStyles = makeStyles({
  root: {
    color: '#fff', background: grey[900], opacity: .6,
    position: 'fixed', right: 32, bottom: 32, padding: 16,
    borderRadius: 2, boxShadow: '0 2px 8px #333',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    whiteSpace: 'nowrap',
    '& .MuiButton-root': {color : '#eee', },
    '& .MuiButton-text': {padding: '0px 8px'}
  }
})

// scheduleロック済みを示す固定表示。
export const SchLokedDisplay = () => {
  const classes = useStyles();
  const allState = useSelector(state=>state);
  const scheduleLocked = fdp(allState, 'schedule.locked');
  const {account} = allState;
  const permission = parsePermission(account)[0][0];
  const history = useHistory();
  const style = {
    color: '#fff', background: grey[900], opacity: .6,
    position: 'fixed', right: 32, bottom: 32, padding: 16,
    borderRadius: 2, boxShadow: '0 2px 8px #333'
  }
  if (scheduleLocked){
    return(
      <div className={`${classes.root} noprint`}>
        今月のデータはロックされています。
        {permission >= 90 &&
          // <Button
          //   onClick={()=>history.push('/schedule/useresult/?goback=1')}
          // >
          //   解除へ
          // </Button>
          <UseResultIconButton label='解除へ' />
        }
      </div>
    )
  }
  else return null;
}
export default SchLokedDisplay;
