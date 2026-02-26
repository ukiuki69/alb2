import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import { red } from '@material-ui/core/colors';

// ダイアログ共通ラッパー
const ConfirmDialog = ({ open, title, message, onOk, onCancel, okLabel = 'OK', cancelLabel = 'キャンセル', okColor }) => (
  <Dialog open={open} onClose={onCancel} maxWidth='sm'>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText style={{ whiteSpace: 'pre-wrap' }}>
        {message}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>{cancelLabel}</Button>
      <Button onClick={onOk} color='primary' style={okColor ? { color: okColor } : undefined}>
        {okLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

// 仮登録ダイアログ
export const TempRegistrationDialog = ({ open, onOk, onCancel }) => (
  <ConfirmDialog
    open={open}
    title='仮登録'
    message={
      '必要な項目が入力されていません。\n' +
      '仮登録を行うと無効な入力は無視され、受給者証番号は3桁の仮番号となります。\n' +
      '仮登録を実行しますか？'
    }
    onOk={onOk}
    onCancel={onCancel}
    okLabel='仮登録する'
  />
);

// 単位名変更ダイアログ（スケジュール存在時）
export const UnitNameChangeDialog = ({ open, onCancel }) => (
  <ConfirmDialog
    open={open}
    title='単位名の変更'
    message={
      '単位名の変更が検出されました。すでに当月の予定実績が設定済みです。\n' +
      '一度、予定実績を削除してから変更してください。'
    }
    onOk={onCancel}
    onCancel={onCancel}
    okLabel='閉じる'
    cancelLabel='閉じる'
  />
);

// 管理/協力事業所削除ダイアログ（スケジュールなし）
export const KanriDeleteDialog = ({ open, onOk, onCancel }) => (
  <ConfirmDialog
    open={open}
    title='上限管理情報の削除'
    message={
      '管理事業所または協力事業所が登録済みです。\n' +
      '不要な上限管理情報を削除して保存しますか？'
    }
    onOk={onOk}
    onCancel={onCancel}
    okLabel='削除して保存'
    okColor={red[600]}
  />
);

// 管理/協力事業所ブロックダイアログ（スケジュールあり）
export const KanriBlockDialog = ({ open, onCancel }) => (
  <ConfirmDialog
    open={open}
    title='上限管理情報の変更'
    message={
      '管理事業所、協力事業所の変更は上限管理の情報を削除してから変更して下さい。'
    }
    onOk={onCancel}
    onCancel={onCancel}
    okLabel='閉じる'
    cancelLabel='閉じる'
  />
);

// 同姓同名ダイアログ
export const SameNameDialog = ({ open, onOk, onCancel }) => (
  <ConfirmDialog
    open={open}
    title='同姓同名の確認'
    message='同じ名前の利用者が既に登録されています。二重登録ではありませんか？'
    onOk={onOk}
    onCancel={onCancel}
    okLabel='同姓同名として登録'
    okColor={red[600]}
  />
);

// ダイアログコンテナ
export const UserEditDialogs = ({ dialog, setDialog, onDialogOk }) => {
  const close = () => setDialog({ type: null, data: null });

  return (
    <>
      <TempRegistrationDialog
        open={dialog.type === 'tempRegistration'}
        onOk={() => onDialogOk('tempRegistration')}
        onCancel={close}
      />
      <UnitNameChangeDialog
        open={dialog.type === 'unitNameChange'}
        onCancel={close}
      />
      <KanriDeleteDialog
        open={dialog.type === 'kanriDelete'}
        onOk={() => onDialogOk('kanriDelete')}
        onCancel={close}
      />
      <KanriBlockDialog
        open={dialog.type === 'kanriBlock'}
        onCancel={close}
      />
      <SameNameDialog
        open={dialog.type === 'sameName'}
        onOk={() => onDialogOk('sameName')}
        onCancel={close}
      />
    </>
  );
};
