import { HOHOU, HOUDAY, JIHATSU } from '../modules/contants';
import * as albcm from '../albCommonModule';

// サービス間の編集許可チェック関数
export const isServiceEditAllowed = (schedule, currentService) => {
  // scheduleまたはserviceが存在しない場合は編集許可
  if (!schedule || !schedule.service) {
    return true;
  }
  
  const scheduleService = schedule.service;
  
  // サービスが同じ場合は編集許可
  if (scheduleService === currentService) {
    return true;
  }
  
  // HOHOUとJIHATSU/HOUDAYの組み合わせの場合は編集を許可
  const isHohouCombination = (
    (scheduleService === HOHOU && (currentService === JIHATSU || currentService === HOUDAY)) ||
    ((scheduleService === JIHATSU || scheduleService === HOUDAY) && currentService === HOHOU)
  );
  
  return isHohouCombination;
};
