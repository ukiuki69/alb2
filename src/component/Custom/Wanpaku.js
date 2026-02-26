import { makeStyles } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { WanpakuImportButton } from '../common/commonParts';

const useStyle = makeStyles({
  wanpakuRoot: {
    display: 'flex', width: 700, margin: '180px auto',
    '& .button': {width: 200},
    '& .text': {width: 500, lineHeight: 1.5,},
  }
});

export const Wanpaku = () => {
  const classes = useStyle();
  return (
    <div className={classes.wanpakuRoot}>
      <div className='button'>
        <WanpakuImportButton/>
      </div>
      <div className='text'>
        療育事務のデータを取り込みます。クリックすると専用のgoogle formが起動します。
        既定のファイルをアップロードして下さい。
        処理が完了するとログインされたメールアドレスに完了通知が送付されます。
      </div>
    </div>
  )

}
export default Wanpaku;