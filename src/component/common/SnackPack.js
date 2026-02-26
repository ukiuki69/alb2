import React, {useState, useEffect, } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { useDispatch, useSelector, ReactReduxContext } from 'react-redux';
import * as Actions from '../../Actions';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

const useStyles = makeStyles((theme) => ({
  close: {
    padding: theme.spacing(0.5),
  },
}));

export default function SnackPack() {
  const [open, setOpen] = React.useState(false);
  const snackState = useSelector(state => state.snackPack);

  // const handleClick = () => {
  //   setOpen(true);
  // };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };


  useEffect(() => {
    const timeDiffAllowed = 300;
    const justNow = new Date().getTime();
    console.log(justNow, snackState.time, justNow - snackState.time);
    if ((justNow - snackState.time) < timeDiffAllowed) {
      setOpen(true);
    }
  }, [snackState]);

  const classes = useStyles();
  return (
    <div>
      {/* <Button onClick={handleClick}>Open simple snackbar</Button> */}
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message="Note archived"
        action={
          <React.Fragment>
            {/* <Button color="secondary" size="small" onClick={handleClose}>
              UNDO
            </Button> */}
            <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </React.Fragment>
        }
      />
    </div>
  );
}
