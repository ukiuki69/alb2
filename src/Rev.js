import React from 'react';
export const rev = '3440';
export const Rev = (props)=>{
  const {short} = props;
  const l = short? 'r.': 'rev';
  return (<span>{l + rev}</span>)
}
export const CALC2024 = true;

export default Rev;

