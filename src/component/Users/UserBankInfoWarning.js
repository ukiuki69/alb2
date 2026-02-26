import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import { red, orange, teal } from '@material-ui/core/colors';
import WarningIcon from '@material-ui/icons/Warning';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';

const useStyles = makeStyles((theme) => ({
  title: {
    display: 'flex',
    alignItems: 'center',
    color: red[700],
    fontWeight: 'bold',
    '& .MuiSvgIcon-root': {
      marginRight: theme.spacing(1),
    },
  },
  warningItem: {
    borderLeft: `4px solid ${orange[500]}`,
    marginBottom: theme.spacing(1),
    backgroundColor: '#fff9f0',
  },
  bankDetail: {
    fontSize: '0.8rem',
    color: '#666',
  },
  footerActions: {
    justifyContent: 'space-between',
    padding: theme.spacing(1, 2),
  },
  closeButton: {
    backgroundColor: teal[800],
    color: '#fff',
    '&:hover': {
      backgroundColor: teal[700],
    },
  },
}));

const comparisonFields = ['金融機関番号', '店舗番号', '預金種目', '口座番号'];
const SUPPRESS_KEY = 'bankInfoWarningSuppressedUntil';

/**
 * 同一人物（pname, pphone一致）で異なる口座情報を持つユーザーをチェックし、
 * 警告ダイアログを表示するコンポーネント。
 * 警告がない場合、または表示抑制期間中の場合は null を返します。
 */
export const UserBankInfoWarning = (props) => {
  const { uprms } = props;
  const classes = useStyles();
  const users = useSelector(state => state.users);
  const [open, setOpen] = useState(false);
  const [conflictingGroups, setConflictingGroups] = useState([]);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  useEffect(() => {
    // uprms が 'bankinfo' でない場合は表示しない
    if (uprms !== 'bankinfo') {
      setOpen(false);
      return;
    }

    // 表示抑制チェック
    const suppressedUntil = localStorage.getItem(SUPPRESS_KEY);
    if (suppressedUntil && Date.now() < parseInt(suppressedUntil)) {
      setOpen(false);
      return;
    }

    if (!users || !Array.isArray(users) || users.length === 0) return;

    // pname と pphone をキーにしてユーザーをグループ化
    const groups = {};
    users.forEach(user => {
      const pname = (user.pname || '').trim();
      const pphone = (user.pphone || '').trim();
      if (!pname || !pphone) return;
      
      const key = `${pname}_${pphone}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(user);
    });

    const conflicts = [];

    Object.keys(groups).forEach(key => {
      const groupUsers = groups[key];
      if (groupUsers.length < 2) return;

      // 口座情報が有効に登録されているユーザーのみ抽出（番号が必須）
      const usersWithBankInfo = groupUsers.filter(u => {
        const bi = (u.etc && u.etc.bank_info) ? u.etc.bank_info : {};
        return bi['口座番号'];
      });

      // 口座情報を持っている人が2名以上いない場合は比較不要
      if (usersWithBankInfo.length < 2) return;

      const normalizedInfos = usersWithBankInfo.map(u => {
        const bi = u.etc.bank_info;
        const info = {};
        comparisonFields.forEach(f => {
          info[f] = (bi[f] || '').trim();
        });
        return JSON.stringify(info);
      });

      // ユニークな口座情報の数を確認
      const uniqueInfos = [...new Set(normalizedInfos)];
      if (uniqueInfos.length > 1) {
        conflicts.push({
          parentName: groupUsers[0].pname,
          users: usersWithBankInfo.map(u => ({
            name: u.name,
            bankInfo: u.etc.bank_info
          }))
        });
      }
    });

    if (conflicts.length > 0) {
      setConflictingGroups(conflicts);
      setOpen(true);
    } else {
      setConflictingGroups([]);
      setOpen(false);
    }
  }, [users, uprms]);

  const handleClose = () => {
    // 表示抑制期間の設定
    const hours = dontShowAgain ? 7 * 24 : 24;
    const suppressUntil = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem(SUPPRESS_KEY, suppressUntil.toString());
    setOpen(false);
  };

  if (!open || conflictingGroups.length === 0) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle className={classes.title}>
        <WarningIcon /> 同一人物で異なる口座情報が存在します
      </DialogTitle>
      <DialogContent dividers>
        <List>
          {conflictingGroups.map((group, idx) => (
            <React.Fragment key={idx}>
              <ListItem className={classes.warningItem} alignItems="flex-start">
                <ListItemText
                  primary={`保護者名：${group.parentName} さま`}
                  secondary={
                    <div style={{ marginTop: 8 }}>
                      {group.users.map((u, uidx) => (
                        <div key={uidx} style={{ marginBottom: 4 }}>
                          <Typography variant="body2" component="span" style={{ fontWeight: 'bold', color: '#333' }}>
                            ・{u.name}:
                          </Typography>
                          <Typography variant="body2" component="span" className={classes.bankDetail}>
                            {' '}{comparisonFields.map(f => u.bankInfo[f] || '').join('/')}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  }
                />
              </ListItem>
              {idx < conflictingGroups.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </DialogContent>
      <DialogActions className={classes.footerActions}>
        <FormControlLabel
          control={
            <Checkbox
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              color="primary"
            />
          }
          label="7日間再表示しない"
        />
        <Button onClick={handleClose} variant="contained" className={classes.closeButton}>
          閉じる
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserBankInfoWarning;
