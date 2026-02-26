import { useSelector } from "react-redux"
import { convDid, getUser, typeOf } from "../commonModule";
import { schLocked } from '../albCommonModule';
import { didPtn } from "./contants";

// useresultを調べる
// dはdid形式, yyyy-mm-dd形式、日付型を受け付ける
// schLockedをコールする
// ｄで与えられたdidが存在しない場合、d以下での最大値で調べる
export const useSchLocked = (d) => {
  const allState = useSelector(state=>state);
  const {schedule, users, classroom, service} = allState;
  if (schedule.locked) return true;
  let did;
  // yyyy-mm-dd形式
  if (d.match(/^\d+\-\d+\-\d+$/)){
    did = 'D' + d.replace(/\D/g, '');
  }
  if (d.match(/^D2[0-9]{7}/)){
    did = d;
  }
  // 日付型の場合
  if (d instanceof Date && !isNaN(d.valueOf())){
    did = convDid(d);
  }
  // scheduleオブジェクトから最大のDIDを取得
  const maxDid = (() => {
    let maxDate = '';
    const uidArr = Object.keys(schedule).filter(e=>e.match(/^UID[0-9]+/));
    uidArr.forEach(key => {
      const didArr = Object.keys(schedule[key] || {}).filter(e=>e.match(didPtn));
      didArr.forEach(e=>{
        if (e > maxDate && e <= d) maxDate = e;
      });
    });
    return maxDate;
  })();
  
  const rt = schLocked(schedule, users, '', maxDid, service, classroom);
  return rt;
}