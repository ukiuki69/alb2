import React from 'react';
import { useSelector } from 'react-redux';
import { fdp } from '../../commonModule';
import { grey } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core';
import BlockIcon from '@material-ui/icons/Block';

const useStyles = makeStyles({
  root: {
    color: '#fff', background: grey[900], opacity: .6,
    position: 'fixed', right: 32, bottom: 32, padding: 16,
    borderRadius: 2, boxShadow: '0 2px 8px #333',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    whiteSpace: 'nowrap'
  }
})

// schedule編集無効化を示す固定表示。
export const SchEditDisabledDisplay = () => {
  const classes = useStyles();
  const allState = useSelector(state=>state);
  
  return(
    <div className={`${classes.root} noprint`}>
      <BlockIcon />
      全表示時には編集出来ません
    </div>
  )
}
export default SchEditDisabledDisplay;
