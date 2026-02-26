import React from 'react';
import { useLocation } from 'react-router-dom';
import { PlanPersonalSupport } from './PlanPersonalSupport';
import { PlanPersonalSupportHohou } from './PlanPersonalSupportHohou';

export const PlanPersonalSupportRouter = () => {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const hohouParam = urlParams.get('hohou');
  
  // hohouパラメータがtrueの場合はPlanPersonalSupportHohouを表示
  // それ以外はPlanPersonalSupportを表示
  if (hohouParam === 'true') {
    return <PlanPersonalSupportHohou />;
  } else {
    return <PlanPersonalSupport />;
  }
};
