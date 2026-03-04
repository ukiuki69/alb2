import { formatDate } from '../../../modules/dateUtils';
import { zp } from '../../../modules/stringUtils';
import { HOUDAY, JIHATSU, HOHOU } from '../../../modules/contants';

// 必須フィールド定義
export const REQUIRED_FIELDS = [
  'lname', 'fname', 'klname', 'kfname', 'birthday', 'hno',
  'volume', 'priceLimit', 'scity_no', 'scity', 'startDate', 'contractDate',
  'lineNo', 'plname', 'pfname', 'pklname', 'pkfname', 'brosIndex', 'pphone',
];

// 既存ユーザーまたは新規のフォーム初期値を生成
export const buildInitialFormValues = (thisUser, service, addnew, classroom) => {
  const sname = (thisUser.name || '').split(' ');
  const skana = (thisUser.kana || '').split(' ');
  const spname = (thisUser.pname || '').split(' ');
  const spkana = (thisUser.pkana || '').split(' ');

  // サービスのデフォルト値
  let defService = service || thisUser.service || HOUDAY;
  if (defService.includes(',')) defService = '複数サービス';

  const values = {
    lname: sname[0] || '',
    fname: sname[1] || '',
    klname: skana[0] || '',
    kfname: skana[1] || '',
    birthday: thisUser.birthday || '',
    service: defService,
    type: addnew ? '障害児' : (thisUser.type || ''),
    icareType: thisUser.icareType || '',
    hno: thisUser.hno || '',
    priceLimit: thisUser.priceLimit || '',
    scity: thisUser.scity || '',
    scity_no: thisUser.scity_no || '',
    kanri_type: thisUser.kanri_type || '',
    volume: thisUser.volumeStd ? '0' : (thisUser.volume || ''),
    startDate: thisUser.startDate || '',
    contractDate: thisUser.contractDate || '',
    contractEnd: thisUser.contractEnd || '',
    lineNo: thisUser.lineNo || '',
    plname: spname[0] || '',
    pfname: spname[1] || '',
    pklname: spkana[0] || '',
    pkfname: spkana[1] || '',
    pmail: thisUser.pmail || '',
    pphone: thisUser.pphone || '',
    pphone1: thisUser.pphone1 || '',
    belongs1: thisUser.belongs1 || '',
    belongs2: thisUser.belongs2 || '',
    classroom: addnew ? (classroom || '') : (thisUser.classroom || ''),
    brosIndex: thisUser.brosIndex || '0',
    over18: (thisUser.etc && thisUser.etc.over18) || '',
    dokujiJougen: (thisUser.etc && thisUser.etc.dokujiJougen) || '',
    dokujiJougenZero: (thisUser.etc && thisUser.etc.dokujiJougenZero) || '',
    sochiseikyuu: (thisUser.etc && thisUser.etc.sochiseikyuu) || '',
    ageOffset: (thisUser.etc && thisUser.etc.ageOffset) || '',
  };

  // 複数サービスのときは動的キーを追加
  if (thisUser.service && thisUser.service.includes(',')) {
    const svcs = thisUser.service.split(',');
    // multiServiceXXX チェックボックスの初期値を設定（保存時バリデーション用）
    [HOUDAY, JIHATSU, HOHOU].forEach(svc => {
      values['multiService' + svc] = svcs.includes(svc);
    });
    svcs.forEach(svc => {
      const info = (thisUser.etc && thisUser.etc.multiSvc && thisUser.etc.multiSvc[svc]) || {};
      values[svc + '-volume'] = info.volumeStd ? '0' : (info.volume || thisUser.volume || '');
      values[svc + '-startDate'] = info.startDate || thisUser.startDate || '';
      values[svc + '-contractDate'] = info.contractDate || thisUser.contractDate || '';
      values[svc + '-contractEnd'] = info.contractEnd || thisUser.contractEnd || '';
      values[svc + '-lineNo'] = info.lineNo || thisUser.lineNo || '';
    });
  }

  return values;
};

// 仮登録時のダミー値補完
export const fillEmptyForTempRegistration = (formValues, users, hnoList) => {
  if (hnoList === false) return null;

  const filled = { ...formValues };

  // ユニークな仮受給者証番号を作成
  let hno;
  for (let i = 1; i <= 999; i++) {
    hno = zp(i, 3);
    if (!hnoList.includes(hno)) break;
  }
  filled.hno = hno;

  const tobeFilled = [
    'lname', 'fname', 'klname', 'kfname', 'birthday',
    'volume', 'priceLimit', 'scity_no', 'scity', 'startDate', 'contractDate',
    'lineNo', 'plname', 'pfname', 'pklname', 'pkfname', 'brosIndex', 'pphone',
  ];

  tobeFilled.forEach(e => {
    // 仮登録では兄弟設定は強制的に解除
    if (e === 'brosIndex') {
      filled[e] = '0';
      return;
    }
    if (filled[e]) return;

    if (e.includes('name') && !e.includes('k')) {
      filled[e] = '名無し';
    } else if (e.includes('name') && e.includes('k')) {
      filled[e] = 'ななし';
    } else if (e === 'birthday') {
      const t = new Date();
      t.setFullYear(t.getFullYear() - 5);
      t.setMonth(0);
      t.setDate(1);
      filled[e] = formatDate(t, 'YYYY-MM-DD');
    } else if (e === 'volume') {
      filled[e] = '0';
    } else if (e === 'scity_no') {
      filled[e] = users.length ? users[0].scity_no : '012345';
    } else if (e === 'scity') {
      filled[e] = users.length ? users[0].scity : '架空自治体';
    } else if (e === 'contractDate' || e === 'startDate') {
      const t = new Date();
      t.setMonth(0);
      t.setDate(1);
      filled[e] = formatDate(t, 'YYYY-MM-DD');
    } else if (e === 'lineNo') {
      filled[e] = '1';
    } else if (e === 'pphone') {
      filled[e] = '045-000-0000';
    } else if (e === 'priceLimit') {
      filled[e] = '4600';
    }
  });

  // 複数サービスの動的キー補完
  const tobeFilledMultiService = ['-volume', '-startDate', '-contractDate', '-lineNo'];
  tobeFilledMultiService.forEach(suffix => {
    Object.keys(filled).filter(k => k.includes(suffix)).forEach(k => {
      if (filled[k]) return;
      if (k.includes('volume')) {
        filled[k] = '10';
      } else if (k.includes('contractDate') || k.includes('startDate')) {
        const t = new Date();
        t.setMonth(0);
        t.setDate(1);
        filled[k] = formatDate(t, 'YYYY-MM-DD');
      } else if (k.includes('lineNo')) {
        filled[k] = '1';
      }
    });
  });

  return filled;
};

// 必須項目が未入力かチェック（bankInfoNamesは除外可）
export const checkRequiredFields = (formValues, excludeFields = []) => {
  const notFilled = [];
  REQUIRED_FIELDS.forEach(f => {
    if (excludeFields.includes(f)) return;
    if (!formValues[f] && formValues[f] !== 0) {
      notFilled.push(f);
    }
  });
  return notFilled;
};
