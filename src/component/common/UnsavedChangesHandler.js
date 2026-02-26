// UnsavedChangesHandler.js
import React, { useState, useEffect } from 'react';
import { Prompt, useHistory } from 'react-router-dom';
import {GenericDialog} from './GenericDialog';

const UnsavedChangesHandler = ({ formID, submit, cancel }) => {
  const [initialFormData, setInitialFormData] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [nextLocation, setNextLocation] = useState(null);

  const history = useHistory();

  const handleBeforeUnload = (location) => {
    const currentFormData = getFormData();

    if (initialFormData !== currentFormData) {
      setIsDialogOpen(true);
      setNextLocation(location);
      return false;
    }

    return true;
  };

  const getFormData = () => {
    const formElement = document.getElementById(formID);
    if (!formElement) return '';

    const formData = new FormData(formElement);
    return JSON.stringify(Array.from(formData.entries()));
  };

  useEffect(() => {
    setInitialFormData(getFormData());
  }, []);

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleConfirm = () => {
    submit();
    setIsDialogOpen(false);
    history.push(nextLocation);
  };

  const handleCancel = () => {
    cancel();
    setIsDialogOpen(false);
  };

  return (
    <>
      <Prompt when={true} message={handleBeforeUnload} />
      <GenericDialog
        open={isDialogOpen}
        handleClose={handleDialogClose}
        title="未保存の変更"
        message="変更が保存されていません。保存してページを離れますか？"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        showCancel={true}
        confirmText="保存"
        cancelText="破棄"
      />
    </>
  );
};

export default UnsavedChangesHandler;
