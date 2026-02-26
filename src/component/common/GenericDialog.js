// GenericDialog.js
import React from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, makeStyles 
} from '@material-ui/core';
import { grey, teal } from '@material-ui/core/colors';
import ContactSupportOutlinedIcon from '@material-ui/icons/ContactSupportOutlined';
import HelpIcon from '@material-ui/icons/Help';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';

const useStyles = makeStyles({
  root: {
    '& .MuiDialogTitle-root': {
      background: grey[200], color:teal[800], 
      paddingBottom: 8, marginBottom: 16,
      borderBottom: `1px solid ${grey[400]}`,
      '& h2': {
        display: 'flex', alignItems: 'center', 
        '& .MuiSvgIcon-root': {marginInlineEnd: 8, color: teal[600],},
      },
    },
    '& .MuiDialog-paperWidthSm': {minWidth: 360},
    '& .MuiDialogContent-root > p': {
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }
  }
})

const YesNoDialog = (props) => {
  const {open, setOpen, setValue, prms} = props;
  const title = prms?.title? prms.title: '確認';
  const confirmText = prms?.confirmText? prms.confirmText: 'はい';
  const cancelText = prms?.cancelText? prms.cancelText: 'いいえ';
  const message = prms?.message? prms.message: 'よろしいですか？';

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    if(props.handleConfirm) props.handleConfirm();
    if(setValue) setValue(true);
    handleClose();
  };

  const handleCancel = () => {
    if(props.handleCancel) props.handleCancel();
    if(setValue) setValue(false);
    handleClose();
  };
  return (
    <GenericDialog
      open={open}
      handleClose={handleClose}
      title={title}
      message={message}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      showCancel={true}
      confirmText={confirmText}
      cancelText={cancelText}
      icon={<HelpOutlineIcon/>}
    />

  )
}

const GenericDialog = (props) => {
  const classes = useStyles();
  const { open, handleClose, title, message, onConfirm, onCancel, showCancel, 
          confirmText, cancelText, icon
        } = props;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      className={classes.root}
      
    >
      <DialogTitle id="alert-dialog-title">
        {icon && icon}
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description" style={{whiteSpace: 'pre-wrap'}}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {showCancel && (
          <Button onClick={()=>onCancel()} color="secondary" variant='outlined' >
            {cancelText || "いいえ"}
          </Button>
        )}
        <Button onClick={()=>onConfirm()} color="primary" variant='outlined' >
          {confirmText || "はい"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export {GenericDialog, YesNoDialog};
