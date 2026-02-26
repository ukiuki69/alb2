import { convUid } from '../../../albCommonModule';
import { getBrothers, getUser } from "../../../commonModule";

export const isExistJougen = (billingDt, users) => {
  const tmpArray = [];
  billingDt.forEach(bdt => {
    // 兄弟の場合長兄以外はスキップ
    if (Number(bdt.brosIndex) > 1) return;
    // 協力事業所が存在してて他事業所の利用があればヒット
    if (bdt.協力事業所 && Array.isArray(bdt.協力事業所) && bdt.協力事業所.length > 0) {
      // if (bdt.協力事業所.filter(e => e.amount > 0 && e.name !== 'thisOffice').length > 0) {
      if (bdt.協力事業所.filter(e => e.name !== 'thisOffice').length > 0) {
        tmpArray.push(bdt.UID);
        return;
      }
    }
    if (bdt.管理事業所 && Array.isArray(bdt.管理事業所)) {
      return
    }
    const bros = getBrothers(bdt.UID, users);
    bros.forEach(e => {
      const uids = convUid(e.uid).s;
      const brosBdt = billingDt.find(f => f.UID === uids);
      if (!brosBdt) return;
      if (
        brosBdt.協力事業所 &&
        Array.isArray(brosBdt.協力事業所) &&
        brosBdt.協力事業所.length > 0
      ) {
        if (brosBdt.協力事業所.filter(e => e.amount > 0 && e.name !== 'thisOffice').length > 0) {
          tmpArray.push(bdt.UID);
          return;
        }
      }
      if (brosBdt.userSanteiTotal) {
        tmpArray.push(bdt.UID);
        return;
      }
    });
  });
  const uidsArray = Array.from(new Set(tmpArray));
  const userList = uidsArray.map(uid => {
    const user = getUser(uid, users);
    return {uid: user.uid, name: user.name};
  });
  return {uidsArray, userList};
}