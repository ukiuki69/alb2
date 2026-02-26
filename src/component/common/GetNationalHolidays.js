import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { univApiCall } from '../../albCommonModule';
import * as Actions from '../../Actions';
import { getLodingStatus } from '../../commonModule';

const fetchInterval = 30 * 24 * 60 * 60 * 1000;

export const GetNationalHolidays = () => {
  const dispatch = useDispatch();
  const allState = useSelector(s => s);
  const { com, stdDate } = allState;
  const comExt = com?.ext ?? {};
  const nationalHolidays = comExt?.nationalHolidays ?? { fetched: null };
  const [days, setDays] = useState(nationalHolidays.days);
  const thisYear = parseInt(stdDate.split('-')[0]);
  const ls = getLodingStatus(allState);
  const loadDone = ls.loaded && !ls.error;

  const getHolidays = async () => {
    const p = { a: 'getHolidays', year: thisYear }
    const t = await univApiCall(p, 'E924335');
    if (!t?.data?.result) {
      return { result: false, errorId: t.errorId };
    }
    p.year = thisYear + 1;
    const n = await univApiCall(p, 'E924335');
    if (!n?.data?.result) {
      return { result: false, errorId: n.errorId };
    }
    setDays({ ...t.data.dt, ...n.data.dt, fetched: new Date().toISOString() });
    return true;
  }

  const sendAndDispatch = async () => {
    comExt.nationalHolidays = days;
    const p = {
      a: "sendComExt",
      hid: com.hid,
      bid: com.bid,
      ext: JSON.stringify({ ...comExt })
    }
    const res = await univApiCall(p, 'E924336')
    if (!res?.data?.result) {
      return { result: false, errorId: res.errorId };
    }
    const newCom = { ...com };
    newCom.ext = comExt;
    dispatch(Actions.setStore({ com: newCom }))
  }

  useEffect(() => {
    let isMounted = true;
    let fetchDone = false;
    const fetchData = async () => {
      const now = new Date();
      const tobeFetch = (
        !nationalHolidays.fetched || 
        (now - new Date(nationalHolidays.fetched)) > fetchInterval
      )
      if (tobeFetch && loadDone) {
        await getHolidays();
        console.log('GetNationalHolidays fetched');
      }
    }

    if (isMounted) {
      fetchData();
    }

    return () => {
      isMounted = false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (days && days.fetched && isMounted) {
      sendAndDispatch();
    }

    return () => {
      isMounted = false;
    }
  }, [days]);

  return null;
}
export default GetNationalHolidays;
