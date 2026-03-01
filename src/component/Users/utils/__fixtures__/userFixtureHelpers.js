import usersJson from '../../../../testData/users.json';

/**
 * name / kana を半角スペースで分割して lname/fname 等を返す
 */
export const splitName = (user) => {
  const [lname = '', fname = ''] = (user.name || '').split(' ');
  const [klname = '', kfname = ''] = (user.kana || '').split(' ');
  const [plname = '', pfname = ''] = (user.pname || '').split(' ');
  const [pklname = '', pkfname = ''] = (user.pkana || '').split(' ');
  return { lname, fname, klname, kfname, plname, pfname, pklname, pkfname };
};

/**
 * uid / hno / name を index で散らす
 * → 全員が別人になり、重複チェックに引っかからなくなる
 */
export const scatterUser = (user, index) => ({
  ...user,
  uid: `TEST${String(index).padStart(3, '0')}`,
  hno: String(index + 1).padStart(10, '0'),
  name: `テスト 花子${index}`,
  kana: `てすと はなこ${index}`,
});

/** 散らし済みの users 配列 */
export const scatteredUsers = usersJson.map(scatterUser);

/** 散らし済みの users から 1 件取り出す */
export const pickUser = (index = 0) => scatteredUsers[index];

/** etc.管理事業所 を持つユーザーを取り出す */
export const pickKanriUser = () =>
  scatteredUsers.find(u => Array.isArray(u.etc?.管理事業所) && u.etc.管理事業所.length > 0);

/** etc.協力事業所 を持つユーザーを取り出す */
export const pickKyouryokuUser = () =>
  scatteredUsers.find(u => Array.isArray(u.etc?.協力事業所) && u.etc.協力事業所.length > 0);

/** 複数サービスのユーザーを取り出す */
export const pickMultiSvcUser = () =>
  scatteredUsers.find(u => u.service && u.service.includes(','));
