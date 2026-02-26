import React from 'react';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  tooltipContainer: {
    position: 'relative',
    display: 'inline-block'
  },
  customTooltip: {
    visibility: 'hidden',
    position: 'absolute',
    backgroundColor: '#555',
    color: '#fff',
    textAlign: 'center',
    padding: '5px',
    borderRadius: '6px',
    fontSize: '16px',
    zIndex: 1,
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    opacity: 0,
    transition: 'opacity 0.3s'
  },
  hovered: {
    '&:hover $customTooltip': {
      visibility: 'visible',
      opacity: 1
    }
  }
});

const Tooltip = (props) => {
  const classes = useStyles();
  return (
    <div className={`${classes.tooltipContainer} ${classes.hovered}`}>
      {props.children}
      <div className={classes.customTooltip}>{props.text}</div>
    </div>
  );
}

export default Tooltip;
