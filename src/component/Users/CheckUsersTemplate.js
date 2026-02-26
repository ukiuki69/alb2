import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import SearchIcon from '@material-ui/icons/Search';

const CheckUsersTemplate = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const users = useSelector(state => state.users);

  const handleCheckTemplate = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // ユーザーのテンプレートをチェックする関数
  const checkUsersTemplateService = () => {
    const problemUsers = [];
    
    users.forEach(user => {
      const template = user?.etc?.template;
      
      if (template && typeof template === 'object') {
        const templateKeys = Object.keys(template);
        const keysWithoutService = [];
        
        templateKeys.forEach(key => {
          const templateData = template[key];
          // template.weekday, template.schoolOff などの配下にserviceがあるかチェック
          if (templateData && typeof templateData === 'object' && !templateData.service) {
            keysWithoutService.push(key);
          }
        });
        
        // serviceが存在しないキーがある場合のみ結果に追加
        if (keysWithoutService.length > 0) {
          problemUsers.push({
            uid: user.uid,
            name: user.name,
            keysWithoutService,
            template
          });
        }
      }
    });
    
    return problemUsers;
  };

  const problemUsers = checkUsersTemplateService();

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<SearchIcon />}
        onClick={handleCheckTemplate}
      >
        ユーザーテンプレートのサービス確認
      </Button>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          テンプレートにサービスが設定されていないユーザー
        </DialogTitle>
        <DialogContent>
          {problemUsers.length === 0 ? (
            <Typography variant="body1" style={{ textAlign: 'center', padding: 20 }}>
              ✅ 全てのユーザーのテンプレートにサービスが正しく設定されています
            </Typography>
          ) : (
            <>
              <Typography variant="h6" color="error" gutterBottom>
                ⚠️ サービスが設定されていないテンプレート（{problemUsers.length}人）
              </Typography>
              <List dense>
                {problemUsers.map(user => (
                  <ListItem key={user.uid}>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary={user.name}
                      secondary={`UID: ${user.uid} | サービス未設定: ${user.keysWithoutService.join(', ')}`}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CheckUsersTemplate;
