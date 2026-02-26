import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Actions from '../../Actions';

const SingleServiceDispatcher = () => {
  const dispatch = useDispatch();
  const service = useSelector((s) => s.service);
  const serviceItems = useSelector((s) => s.serviceItems);
  useEffect(() => {
    if (serviceItems.length === 1 && !service) {
      dispatch(Actions.setStore({ service: serviceItems[0] }));
    }
  }, [serviceItems, service]);
  return null;
};

export default SingleServiceDispatcher;

