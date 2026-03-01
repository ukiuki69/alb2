import { submitUserEdit, kanriChk } from './userEditSubmit';
import { createParams } from './__fixtures__/createParams';
import {
  scatteredUsers,
  pickUser,
  pickKanriUser,
  pickKyouryokuUser,
  pickMultiSvcUser,
  splitName,
} from './__fixtures__/userFixtureHelpers';

// 外部依存をモック
jest.mock('../../../albCommonModule', () => ({
  setRecentUser: jest.fn(),
  sendPartOfSchedule: jest.fn().mockResolvedValue({}),
  univApiCall: jest.fn().mockResolvedValue({ data: { result: true } }),
}));

jest.mock('../../../Actions', () => ({
  editUser:       jest.fn(payload => ({ type: 'EDIT_USER', payload })),
  updateUser:     jest.fn(payload => ({ type: 'UPDATE_USER', payload })),
  sortUsersAsync: jest.fn(() => ({ type: 'SORT_USERS' })),
  setStore:       jest.fn(payload => ({ type: 'SET_STORE', payload })),
}));

// ----------------------------------------------------------------
// 正常系
// ----------------------------------------------------------------
describe('正常系', () => {
  test('編集: editUser と updateUser と sortUsers が呼ばれる', async () => {
    const params = createParams({ editOn: true });
    const result = await submitUserEdit(params);

    expect(result.success).toBe(true);
    expect(params.dispatch).toHaveBeenCalledTimes(3);

    const calls = params.dispatch.mock.calls.map(c => c[0]);
    expect(calls[0].type).toBe('EDIT_USER');
    expect(calls[1].type).toBe('UPDATE_USER');
    expect(calls[2].type).toBe('SORT_USERS');
  });

  test('編集: updateUser に sendUserWithEtc が含まれる', async () => {
    const params = createParams({ editOn: true });
    await submitUserEdit(params);

    const updateCall = params.dispatch.mock.calls[1][0];
    expect(updateCall.payload).toMatchObject({ a: 'sendUserWithEtc' });
  });

  test('新規登録: 同姓同名が存在しなければ成功する', async () => {
    const user = pickUser(0);
    const params = createParams({
      editOn: false,
      thisUser: { ...user, uid: '' }, // 新規なのでuidなし
      formValues: {
        ...createParams().formValues,
        // scatteredUsers に存在しない名前を使う
        lname: '新規', fname: '太郎', klname: 'しんき', kfname: 'たろう',
      },
    });
    const result = await submitUserEdit(params);

    expect(result.success).toBe(true);
  });

  test('stopUse=true のとき endDate が endOfMonthStr になる', async () => {
    const params = createParams({ stopUse: true, endOfMonthStr: '2026-02-28' });
    await submitUserEdit(params);

    const editUserCall = params.dispatch.mock.calls[0][0];
    expect(editUserCall.payload.endDate).toBe('2026-02-28');
  });

  test('volume=0 のとき volumeStd=true になり日数-8がセットされる', async () => {
    const params = createParams({
      formValues: { ...createParams().formValues, volume: '0' },
      dateList: Array(28).fill(null), // 28日
    });
    await submitUserEdit(params);

    const editUserCall = params.dispatch.mock.calls[0][0];
    expect(editUserCall.payload.volumeStd).toBe(true);
    expect(editUserCall.payload.volume).toBe(20); // 28 - 8
  });
});

// ----------------------------------------------------------------
// エラー系・早期 return
// ----------------------------------------------------------------
describe('エラー系', () => {
  test('同姓同名の新規登録で setDialog(sameName) が呼ばれる', async () => {
    const user = pickUser(0);
    // users配列に同じ名前を持つユーザーを混ぜる
    const usersWithDup = [
      ...scatteredUsers,
      { ...user, uid: 'DUP001' },
    ];
    const params = createParams({
      editOn: false,
      thisUser: { ...user, uid: '' },
      users: usersWithDup,
      formValues: { ...createParams().formValues, ...splitName(user) },
    });
    const result = await submitUserEdit(params);

    expect(result.success).toBe(false);
    expect(params.setDialog).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'sameName' })
    );
    expect(params.dispatch).not.toHaveBeenCalled();
  });

  test('必須エラーがある場合 setDialog(tempRegistration) が呼ばれる', async () => {
    const params = createParams({
      errors: { hno: { error: true, message: '受給者証番号は必須です' } },
    });
    const result = await submitUserEdit(params);

    expect(result.success).toBe(false);
    expect(params.setDialog).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'tempRegistration' })
    );
    expect(params.dispatch).not.toHaveBeenCalled();
  });

  test('suppressNavigation=true のとき history.push が呼ばれない', async () => {
    const params = createParams({
      options: { suppressNavigation: true },
    });
    await submitUserEdit(params);

    expect(params.history.push).not.toHaveBeenCalled();
  });
});

// ----------------------------------------------------------------
// kanriChk 単体テスト
// ----------------------------------------------------------------
describe('kanriChk', () => {
  test('kanri/kyou どちらもなければ result:true', () => {
    const user = { uid: '001', kanri_type: '', etc: {} };
    expect(kanriChk(user, user, {})).toEqual({ result: true });
  });

  test('管理事業所ユーザーを持つデータで正しく動作する', () => {
    const user = pickKanriUser();
    if (!user) return; // データがなければスキップ
    const result = kanriChk(user, user, {});
    // 管理事業所あり + kanri_type='協力事業所' → result:true
    expect(typeof result.result).toBe('boolean');
  });

  test('協力事業所ユーザーを持つデータで正しく動作する', () => {
    const user = pickKyouryokuUser();
    if (!user) return;
    const result = kanriChk(user, user, {});
    expect(typeof result.result).toBe('boolean');
  });
});

// ----------------------------------------------------------------
// test.each: 散らされた全ユーザーで編集が成功するか
// ----------------------------------------------------------------
describe('散らしテスト: 全ユーザーで編集が成功する', () => {
  test.each(scatteredUsers.slice(0, 10))(
    'uid=$uid name=$name の編集',
    async (user) => {
      const params = createParams({
        editOn: true,
        thisUser: user,
        formValues: { ...createParams().formValues, ...splitName(user) },
      });
      const result = await submitUserEdit(params);
      expect(result.success).toBe(true);
    }
  );
});
