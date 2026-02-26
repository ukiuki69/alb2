import React from 'react';
// カレンダーラッパー
// ボタンとか付けて呼び出すだけ
// stateのloadingを確認していないのでエラーになりがち
import SchCalender from './SchCalender';
import { makeSchMenuFilter, menu, extMenu } from './Sch2';
import { LinksTab } from '../common/commonParts';
import { useSelector } from 'react-redux';

export const SchCalWrapp = () => {
  const stdDate = useSelector(state=>state.stdDate);
  const menuFilter = makeSchMenuFilter(stdDate);
  return(<>
    <LinksTab menu={menu} menuFilter={menuFilter} extMenu={extMenu}/>
    <div className="AppPage schedule calWrapp">
      {/* <SchHeadNav/>     */}
      <SchCalender />
    </div>
  </>)
}

export default SchCalWrapp;