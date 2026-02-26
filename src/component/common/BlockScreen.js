import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  blockScreen: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    zIndex: 9999,
    display: 'flex', flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#333',
    // 必要に応じて他のスタイリングを追加
    '& >p': {padding: 8, width: '100%'},
    '& > img': {width: 32}
  },
});

const BlockScreen = ({ delay, message }) => {
  const classes = useStyles();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (delay){
      setVisible(true);
    }
    const timer = setTimeout(() => {
      setVisible(false);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <div className={classes.blockScreen} id='blockScreen'>
      {/* <p>{message}</p> */}
      <img src="./img/loading3dRing.png" />
    </div>
  );
}

export default BlockScreen;
