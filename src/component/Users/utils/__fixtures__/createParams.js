import { scatteredUsers, pickUser } from './userFixtureHelpers';
import { buildInitialFormValues } from '../userEditDefaults';

const defaultUser = pickUser(0);

/**
 * submitUserEdit に渡すパラメータのベースを返す
 * overrides で各テストが必要な部分だけ上書きする
 */
export const createParams = (overrides = {}) => {
  const thisUser = overrides.thisUser || defaultUser;

  const mockDispatch = jest.fn().mockResolvedValue({
    data: { result: true, uid: thisUser.uid },
  });

  // buildInitialFormValues を使って必須フィールドを漏れなく構築
  const baseFormValues = buildInitialFormValues(
    thisUser,
    thisUser.service,
    false,            // addnew
    thisUser.classroom
  );

  const base = {
    formValues:    baseFormValues,
    errors:        {},
    thisUser,
    users:         scatteredUsers,
    schedule:      {},
    hid:           thisUser.hid || 'H001',
    bid:           thisUser.bid || 'B001',
    stdDate:       '2026-02-01',
    dateList:      Array(28).fill(null),
    hnoList:       scatteredUsers.map(u => u.hno),
    editOn:        true,
    stopUse:       false,
    endOfMonthStr: '2026-02-28',
    sindexMax:     100,
    dispatch:      mockDispatch,
    history:       { push: jest.fn() },
    goBack:        '/users',
    setSnack:      jest.fn(),
    setDialog:     jest.fn(),
  };

  return { ...base, ...overrides };
};
