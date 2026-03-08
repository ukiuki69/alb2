import * as comMod from '../../../commonModule';
import * as Actions from '../../../Actions';
import { setRecentUser, sendPartOfSchedule } from '../../../albCommonModule';
import { cleanSpecialCharacters } from '../../../modules/cleanSpecialCharacters';
import { escapeSqlQuotes } from '../../../modules/escapeSqlQuotes';
import { fillEmptyForTempRegistration, checkRequiredFields } from './userEditDefaults';
import { KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../../modules/contants';

const normalizeScityFields = (scity, scityNo) => {
  const normalizedNo = comMod.convHankaku((scityNo || '').toString().trim());
  const rawScity = (scity || '').toString().trim();
  const pairMatch = rawScity.match(/^(.*?)[\s　]*[（(]\s*([0-9０-９]{6})\s*[)）]\s*$/);

  if (!pairMatch) {
    return { scity: rawScity, scity_no: normalizedNo };
  }

  const parsedScity = (pairMatch[1] || '').trim();
  const parsedNo = comMod.convHankaku(pairMatch[2] || '');
  return {
    scity: parsedScity,
    scity_no: normalizedNo || parsedNo,
  };
};

// etc内の管理/協力配列からkanri_typeを自動決定する
// - 協力事業所配列が有効(length > 0)の場合 -> 管理事業所
// - 管理事業所配列が有効(length > 0)の場合 -> 協力事業所
// - どちらも0件なら未設定
// 両方該当する場合は「協力事業所(length > 0)」を優先する
const deriveKanriTypeFromEtc = (etc = {}) => {
  const kanriArr = etc?.管理事業所;
  const kyouArr = etc?.協力事業所;
  const hasValidKanriArray = Array.isArray(kanriArr) && kanriArr.length > 0;
  const hasValidKyouArray = Array.isArray(kyouArr) && kyouArr.length > 0;

  if (hasValidKyouArray) return '管理事業所';
  if (hasValidKanriArray) return '協力事業所';
  return '';
};

// kanriChk: 上限管理の整合性チェック
export const kanriChk = (targetUser, thisUser, schedule) => {
  const baseUser = {
    ...thisUser,
    ...targetUser,
    etc: targetUser?.etc ?? thisUser.etc,
  };
  const strUid = comMod.convUID(baseUser.uid).str;
  const kanri_type = baseUser.kanri_type;
  const kanriJi = comMod.fdp(baseUser, 'etc.管理事業所');
  const kyouJi = comMod.fdp(baseUser, 'etc.協力事業所');
  const schKanriJi = comMod.fdp(schedule, [strUid, '管理事業所'], {});
  const schKyouJi = comMod.fdp(schedule, [strUid, '協力事業所'], {});
  const kanriLen = kanriJi ? Object.keys(kanriJi).length : 0;
  const kyouLen = kyouJi ? Object.keys(kyouJi).length : 0;

  if ((kanriLen + kyouLen) === 0) {
    return { result: true };
  } else if (kanri_type === '管理事業所' && kyouLen) {
    return { result: true };
  } else if (kanri_type === '協力事業所' && kanriLen) {
    return { result: true };
  }
  return { result: false, kanriJi, kyouJi, schKanriJi, schKyouJi };
};

// メイン submit 処理
export const submitUserEdit = async ({
  formValues, errors, thisUser, users, schedule,
  hid, bid, stdDate, dateList, hnoList,
  editOn, stopUse, endOfMonthStr, sindexMax,
  dispatch, history, goBack, setSnack, setDialog,
  options = {},
}) => {
  const soudanServiceNames = [KEIKAKU_SOUDAN, SYOUGAI_SOUDAN];
  const userDatas = { ...formValues };

  // optionsのmodPrms反映
  if (options.modPrms) {
    Object.keys(options.modPrms).forEach(k => {
      userDatas[k] = options.modPrms[k];
    });
  }
  if (options.brosindex) {
    userDatas.brosIndex = options.brosindex;
  }
  // 「市区町村名（番号）」形式の入力を submit 前に分離して正規化
  const normalizedScity = normalizeScityFields(userDatas.scity, userDatas.scity_no);
  userDatas.scity = normalizedScity.scity;
  userDatas.scity_no = normalizedScity.scity_no;

  userDatas.etc = thisUser.etc ? { ...thisUser.etc } : {};
  if (options.etcOverride && typeof options.etcOverride === 'object') {
    userDatas.etc = { ...userDatas.etc, ...options.etcOverride };
  }

  // addictionOverride の処理
  if (options.addictionOverride && typeof options.addictionOverride === 'object' && Object.keys(options.addictionOverride).length) {
    const addictionData = { ...options.addictionOverride };
    Object.keys(addictionData).forEach(k => {
      if (addictionData[k] === '' || addictionData[k] === null || addictionData[k] === undefined) {
        delete addictionData[k];
      }
    });
    userDatas.etc.addiction = {
      ...(userDatas.etc.addiction || {}),
      ...addictionData,
    };
  }

  // addictionSvcOverride の処理（複数サービスの場合、サービスごとに etc.multiSvc[svc].addiction へ保存）
  if (options.addictionSvcOverride && typeof options.addictionSvcOverride === 'object' && Object.keys(options.addictionSvcOverride).length) {
    const multiSvc = { ...(userDatas.etc.multiSvc || {}) };
    Object.entries(options.addictionSvcOverride).forEach(([svc, svcVals]) => {
      const cleaned = { ...svcVals };
      Object.keys(cleaned).forEach(k => {
        if (cleaned[k] === '' || cleaned[k] === null || cleaned[k] === undefined) delete cleaned[k];
      });
      multiSvc[svc] = { ...(multiSvc[svc] || {}), addiction: cleaned };
    });
    userDatas.etc.multiSvc = multiSvc;
  }

  // 兄弟追加の場合、コピーしないフィールドを削除
  if (options.brotherCreate) {
    delete userDatas.etc.addiction;
    delete userDatas.etc.管理事業所;
    delete userDatas.etc.協力事業所;
  }

  // 管理/協力はUI入力ではなくetcの配列状態から自動決定する
  userDatas.kanri_type = deriveKanriTypeFromEtc(userDatas.etc);

  // 相談支援サービス時の不要項目補完
  if (soudanServiceNames.includes(userDatas.service)) {
    Object.assign(userDatas, {
      type: '障害児', volume: '0',
      startDate: '0000-00-00',
    });
  }

  // スケジュール存在時の単位名変更チェック
  const usersSch = schedule['UID' + thisUser.uid];
  const clsChanged = (userDatas.classroom || '') !== (thisUser.classroom || '');
  const hasD2Keys = usersSch && Object.keys(usersSch).some(key => key.startsWith('D2'));

  if (usersSch && Object.keys(usersSch).length && clsChanged && hasD2Keys) {
    setDialog({ type: 'unitNameChange', data: null });
    setSnack({ msg: '送信はキャンセルされました。', severity: 'warning', id: Date.now() });
    return { success: false };
  }

  // 必須項目チェック
  const notFilled = checkRequiredFields(userDatas);
  // エラー有無チェック
  const hasErrors = Object.values(errors).some(e => e && e.error);

  if ((notFilled.length || hasErrors) && !options.tempRegistration) {
    setDialog({ type: 'tempRegistration', data: null });
    setSnack({ msg: '送信はキャンセルされました。', severity: 'warning', id: Date.now() });
    return { success: false };
  }

  // 複数サービスのエラーチェック
  if (userDatas.service === '複数サービス') {
    const selectedSvcs = Object.keys(userDatas)
      .filter(k => k.startsWith('multiService') && userDatas[k])
      .map(k => k.replace('multiService', ''));
    if (selectedSvcs.length <= 1) {
      setSnack({ msg: '複数サービスの設定を確認してください。', severity: 'warning', id: Date.now() });
      return { success: false };
    }
    // 放デイ+児発同時禁止
    if (selectedSvcs.includes('放課後等デイサービス') && selectedSvcs.includes('児童発達支援')) {
      setSnack({ msg: '同時設定できないサービスが設定されています。', severity: 'warning', id: Date.now() });
      return { success: false };
    }
  }

  // 上限管理チェック
  const kanriResult = kanriChk(userDatas, thisUser, schedule);
  if (!kanriResult.result && !options.kanriDelete) {
    const schKanriLen = Object.keys(kanriResult.schKanriJi || {}).length;
    const schKyouLen = Object.keys(kanriResult.schKyouJi || {}).length;
    if (schKanriLen + schKyouLen) {
      setDialog({ type: 'kanriBlock', data: null });
    } else {
      setDialog({ type: 'kanriDelete', data: null });
    }
    setSnack({ msg: '送信はキャンセルされました。', severity: 'warning', id: Date.now() });
    return { success: false };
  }

  // 管理/協力事業所を削除する
  if (!kanriResult.result && options.kanriDelete) {
    if (userDatas.kanri_type === '') {
      delete userDatas.etc.管理事業所;
      delete userDatas.etc.協力事業所;
    } else if (userDatas.kanri_type === '協力事業所') {
      delete userDatas.etc.協力事業所;
    } else if (userDatas.kanri_type === '管理事業所') {
      delete userDatas.etc.管理事業所;
    }
  }

  // 仮登録時: エラー箇所のデータをクリアして補完
  if (options.tempRegistration) {
    Object.keys(errors).forEach(k => {
      if (errors[k] && errors[k].error) {
        userDatas[k] = '';
      }
    });
    const filled = fillEmptyForTempRegistration(userDatas, users, hnoList);
    if (!filled) {
      setSnack({ msg: '仮登録に失敗しました。', severity: 'error', id: Date.now() });
      return { success: false };
    }
    Object.assign(userDatas, filled);
  }

  // 複数サービスの処理
  if (userDatas.service === '複数サービス') {
    let conSvc = '';
    Object.keys(userDatas).filter(k => k.startsWith('multiService')).forEach(k => {
      if (userDatas[k]) {
        conSvc += k.replace('multiService', '') + ',';
      }
      delete userDatas[k];
    });
    userDatas.service = conSvc.replace(/,$/, '');
  }

  // 名字と名前の連結
  const cn = (a, b) => {
    a = (a || '').replace(/　/g, '');
    b = (b || '').replace(/　/g, '');
    a = cleanSpecialCharacters(a);
    b = cleanSpecialCharacters(b);
    return (a && b) ? a + ' ' + b : a + b;
  };
  userDatas.name = cn(userDatas.lname, userDatas.fname);
  userDatas.pname = cn(userDatas.plname, userDatas.pfname);
  userDatas.kana = cn(userDatas.klname, userDatas.kfname);
  userDatas.pkana = cn(userDatas.pklname, userDatas.pkfname);

  // 年齢計算
  const ages = comMod.getAge(userDatas.birthday, stdDate, userDatas.ageOffset || userDatas.etc?.ageOffset);
  userDatas.age = ages.age;
  userDatas.ageNdx = ages.ageNdx;
  userDatas.ageStr = ages.flx;

  // 半角変換
  userDatas.scity_no = comMod.convHankaku(userDatas.scity_no);

  // ID付加
  userDatas.hid = hid;
  userDatas.bid = bid;
  userDatas.stdDate = stdDate;
  userDatas.contractEnd = userDatas.contractEnd || '0000-00-00';
  userDatas.kanri_type = deriveKanriTypeFromEtc(userDatas.etc);
  userDatas.endDate = stopUse ? endOfMonthStr : '0000-00-00';
  userDatas.date = stdDate;

  // 同姓同名チェック（新規追加時）
  if (!editOn && !options.sameNameConfirmed) {
    const s = users.find(e => e.name === userDatas.name);
    if (s) {
      setDialog({ type: 'sameName', data: null });
      return { success: false };
    }
  }

  // etc配下のフィールド整理
  if (userDatas.over18) userDatas.etc.over18 = userDatas.over18;
  if (!userDatas.over18 && userDatas.etc.over18) delete userDatas.etc.over18;
  delete userDatas.over18;

  if (userDatas.dokujiJougen) userDatas.etc.dokujiJougen = userDatas.dokujiJougen;
  if (!Number(userDatas.dokujiJougen)) delete userDatas.etc.dokujiJougen;
  delete userDatas.dokujiJougen;

  if (userDatas.dokujiJougenZero) userDatas.etc.dokujiJougenZero = userDatas.dokujiJougenZero;
  if (!userDatas.dokujiJougenZero) delete userDatas.etc.dokujiJougenZero;
  delete userDatas.dokujiJougenZero;

  if (userDatas.sochiseikyuu) userDatas.etc.sochiseikyuu = userDatas.sochiseikyuu;
  if (!userDatas.sochiseikyuu) delete userDatas.etc.sochiseikyuu;
  delete userDatas.sochiseikyuu;

  if (userDatas.hasOwnProperty('ageOffset')) userDatas.etc.ageOffset = userDatas.ageOffset;
  if (!userDatas.ageOffset || userDatas.ageOffset === '0') delete userDatas.etc.ageOffset;
  delete userDatas.ageOffset;

  // storeの更新
  const daysOfMonth = dateList.length;
  userDatas.users = users;
  const newUserData = { ...thisUser, ...userDatas };

  if (newUserData.age === undefined) {
    const ageResult = comMod.getAge(newUserData.birthday, stdDate, newUserData.etc?.ageOffset);
    newUserData.age = ageResult.age;
    newUserData.ageNdx = ageResult.ageNdx;
    newUserData.ageStr = ageResult.flx;
  }

  if (!newUserData.sindex) newUserData.sindex = parseInt(sindexMax) + 10;

  // 複数サービスの場合
  if (newUserData.service && newUserData.service.includes(',')) {
    const netc = newUserData.etc || {};
    netc.multiSvc = netc.multiSvc || {};
    newUserData.service.split(',').forEach(svc => {
      netc.multiSvc[svc] = netc.multiSvc[svc] || {};
      Object.keys(newUserData).filter(k => k.includes(svc)).forEach(k => {
        const field = k.split('-')[1];
        netc.multiSvc[svc][field] = newUserData[k];
      });
    });
  }

  // etc初期化
  newUserData.etc = newUserData.etc || {};
  if (!newUserData.etc.bank_info || Array.isArray(newUserData.etc.bank_info)) {
    newUserData.etc.bank_info = {};
  }

  // volumeStd処理
  const userForEdit = { ...newUserData };
  if (userForEdit.volume === '0') {
    userForEdit.volume = daysOfMonth - 8;
    userForEdit.volumeStd = true;
  } else {
    userForEdit.volumeStd = false;
  }

  dispatch(Actions.editUser({ ...userForEdit }));

  // 送信データ準備
  const sendUserDt = { ...newUserData, ...options };
  delete sendUserDt.users;
  delete sendUserDt.tempRegistration;
  delete sendUserDt.kanriDelete;
  delete sendUserDt.sameNameConfirmed;
  delete sendUserDt.suppressNavigation;
  delete sendUserDt.modPrms;
  delete sendUserDt.brosindex;
  delete sendUserDt.etcOverride;
  delete sendUserDt.addictionOverride;
  delete sendUserDt.stateService;
  delete sendUserDt.brotherCreate;

  if (sendUserDt.icareType) {
    sendUserDt.type += ',' + sendUserDt.icareType;
  }
  sendUserDt.date = stdDate;
  sendUserDt.etc = JSON.stringify(sendUserDt.etc);

  const escapedSendUserDt = escapeSqlQuotes(sendUserDt);

  let result = null;
  try {
    result = await dispatch(Actions.updateUser({ ...escapedSendUserDt, a: 'sendUserWithEtc' }));
    dispatch(Actions.sortUsersAsync());
  } catch (e) {
    console.log(e);
    if (options.suppressNavigation) {
      return { success: false, error: e };
    }
    result = null;
  }

  const uids = thisUser.uid;
  setRecentUser(uids);

  if (!uids) {
    const ts = Date.now();
    const hno = newUserData.hno;
    dispatch(Actions.setStore({
      controleMode: { ...options.controleMode, appendUser: { hno, ts } }
    }));
  }

  if (goBack && !options.suppressNavigation) {
    history.push(goBack);
  }

  if (!result || !result.data || !result.data.result) {
    return { success: false };
  }

  // 加算データをスケジュールにも反映
  if (options.addictionOverride && typeof options.addictionOverride === 'object' && Object.keys(options.addictionOverride).length) {
    const addictionData = { ...options.addictionOverride };
    Object.keys(addictionData).forEach(k => {
      if (addictionData[k] === '' || addictionData[k] === null || addictionData[k] === undefined) {
        delete addictionData[k];
      }
    });
    if (Object.keys(addictionData).length) {
      const resolvedUid = result.data.uid || thisUser.uid;
      const uidStr = 'UID' + resolvedUid;
      const svc = newUserData.service && newUserData.service.includes(',')
        ? (options.stateService || newUserData.service.split(',')[0])
        : newUserData.service;
      const existingSch = schedule?.[svc]?.[uidStr] || {};
      const partOfSch = {
        [svc]: {
          [uidStr]: {
            ...existingSch,
            addiction: {
              ...(existingSch.addiction || {}),
              ...addictionData,
            },
          },
        },
      };
      try {
        await sendPartOfSchedule({ hid, bid, date: stdDate, partOfSch });
      } catch (e) {
        console.log('sendPartOfSchedule for addiction failed:', e);
      }

      // Redux storeのscheduleも更新
      const updatedSchedule = { ...schedule };
      if (!updatedSchedule[svc]) updatedSchedule[svc] = {};
      if (!updatedSchedule[svc][uidStr]) updatedSchedule[svc][uidStr] = {};
      updatedSchedule[svc][uidStr] = {
        ...updatedSchedule[svc][uidStr],
        addiction: {
          ...(updatedSchedule[svc][uidStr]?.addiction || {}),
          ...addictionData,
        },
      };
      updatedSchedule.timestamp = Date.now();
      dispatch(Actions.setStore({ schedule: updatedSchedule }));
    }
  }

  const uid = result.data.uid || null;
  return { success: true, hno: newUserData.hno, uid };
};
