import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getAllClasrroms } from '../../albCommonModule';
import { formatDate } from '../../commonModule';
// 印刷時に表示する事業所名など
export const DisplayOnPrint = () => {
  const allState = useSelector(state=>state);
  const {com, service, classroom, serviceItems, users, stdDate} = allState;
  const classrooms = getAllClasrroms(users);
  const serviceStr = (service && serviceItems.length > 1)? service: '';
  const classroomStr = (classroom && classrooms.length > 1)? classroom: '';
  const svcAndCls = (serviceStr && classroomStr)
  ? serviceStr + ' / ' + classroomStr: serviceStr + classroomStr;
  const ym = stdDate.slice(0, 4) + '月' + stdDate.slice(5, 7) + '月 ';
  const style = {padding: '8px 0', fontSize: '.8rem'};
  const fomatedDate = formatDate(new Date(), 'YYYY-MM-DD hh:mm');  
  return (
    <div className='printOnly' style={style}>
      {ym + com.hname + ' ' + com.bname + ' ' + svcAndCls + ' ' + fomatedDate}
    </div>
  )
}
