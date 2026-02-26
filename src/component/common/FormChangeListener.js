// FormChangeListener.js
import React, { useState, useEffect, useRef } from 'react';
import { Prompt, useHistory } from 'react-router-dom';
import {GenericDialog} from './GenericDialog';

const FormChangeListener = ({ formId }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const isFormChanged = useRef(false);
  const history = useHistory();

  useEffect(() => {
    const formElement = document.getElementById(formId);
    if (formElement) {
      formElement.addEventListener('change', handleFormChange);
    }
    return () => {
      if (formElement) {
        formElement.removeEventListener('change', handleFormChange);
      }
    };
  }, [formId]);

  const handleFormChange = () => {
    isFormChanged.current = true;
  };

  const handleDialogConfirm = () => {
    setOpenDialog(false);
    isFormChanged.current = false;
    history.goBack();
  };

  const handleDialogCancel = () => {
    setOpenDialog(false);
  };

  return (
    <>
      <Prompt
        when={isFormChanged.current}
        message={(location) => {
          setOpenDialog(true);
          return false;
        }}
      />
      <GenericDialog
        open={openDialog}
        handleClose={handleDialogCancel}
        title="フォームの更新を確認"
        message="フォームが更新されました。ページを離れますか？"
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
        showCancel={true}
        confirmText="離れる"
        cancelText="キャンセル"
      />
    </>
  );
};

export default FormChangeListener;
