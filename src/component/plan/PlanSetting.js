import React, { useState, useEffect } from 'react';
import { Checkbox, FormControlLabel, makeStyles, Button } from '@material-ui/core';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { LinksTab, LoadingSpinner, LoadErr } from '../common/commonParts';
import SnackMsgSingle from '../common/SnackMsgSingle';
import { planMenu } from './planCommonPart';
import { univApiCall } from '../../albCommonModule';
import { getLodingStatus } from '../../commonModule';
import { permissionCheckTemporary } from '../../modules/permissionCheck';
import { PERMISSION_DEVELOPER } from '../../modules/contants';
import { setStore, setSnackMsg } from '../../Actions';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: 16,
    width: 900,
    margin: `${82+32}px auto`,
    marginLeft: 'calc((100% - 62px - 900px) / 2 + 62px)',
  },
  checkBoxWrap: {
    marginBottom: theme.spacing(1),
  },
  btnWrap: {
    right: 24,
    bottom: 16,
    position: 'fixed',
    textAlign: 'right',
  },
  btn: {
    margin: theme.spacing(0, 1),
  },
}));

const PlanSettingMain = () => {
  const classes = useStyles();
  const history = useHistory();
  const dispatch = useDispatch();
  const { hid, bid, account, com } = useSelector((state) => state);
  const isCntBokLine = com?.ext?.settingContactBook?.line ?? false;
  const signRequireFromExt = com?.ext?.usersPlanSettings?.signRequire;
  const planItemFreeSoloFromExt = com?.ext?.usersPlanSettings?.planItemFreeSolo;
  const useSubCreatorFromExt = com?.ext?.usersPlanSettings?.useSubCreator;
  const [values, setValues] = useState({
    signRequire: signRequireFromExt ?? false,
    planItemFreeSolo: planItemFreeSoloFromExt ?? false,
    useSubCreator: useSubCreatorFromExt ?? false,
  });
  const [snack, setSnack] = useState({ msg: '', severity: '', errorId: '' });

  useEffect(() => {
    setValues({
      signRequire: signRequireFromExt ?? false,
      planItemFreeSolo: planItemFreeSoloFromExt ?? false,
      useSubCreator: useSubCreatorFromExt ?? false,
    });
  }, [signRequireFromExt, planItemFreeSoloFromExt, useSubCreatorFromExt]);

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.checked });
  };

  const handleSave = async () => {
    const comExt = { ...com?.ext };
    if (!comExt.usersPlanSettings) comExt.usersPlanSettings = {};
    comExt.usersPlanSettings.signRequire = values.signRequire;
    comExt.usersPlanSettings.planItemFreeSolo = values.planItemFreeSolo;
    comExt.usersPlanSettings.useSubCreator = values.useSubCreator;
    const params = {
      a: 'sendComExt',
      hid,
      bid,
      ext: JSON.stringify(comExt),
    };
    const res = await univApiCall(params, 'PS3323');
    if (!res?.data?.result) {
      setSnack({ msg: '保存に失敗しました。', severity: 'warning', id: new Date().getTime() });
      return;
    }
    dispatch(setStore({ com: { ...com, ext: comExt } }));
    dispatch(setSnackMsg('設定を保存しました。'));
  };
  const isDev = permissionCheckTemporary(PERMISSION_DEVELOPER, account);
  // if (!isDev) {
  //   return (
  //     <>
  //       <LinksTab menu={planMenu} />
  //       <div className={classes.root} style={{ textAlign: 'center' }}>
  //         ただいま準備中です
  //       </div>
  //     </>
  //   );
  // }
  return (
    <>
      <LinksTab menu={planMenu} />
      <div className={classes.root}>
        <div className={classes.checkBoxWrap}>
          <FormControlLabel
            control={
              <Checkbox
                checked={values.planItemFreeSolo}
                onChange={handleChange}
                name="planItemFreeSolo"
                color="primary"
              />
            }
            label="個別支援計画の「支援目標及び具体的な支援内容」の「項目」に自由記述できるようにする"
          />
        </div>
        <div className={classes.checkBoxWrap}>
          <FormControlLabel
            control={
              <Checkbox
                checked={values.useSubCreator}
                onChange={handleChange}
                name="useSubCreator"
                color="primary"
              />
            }
            label="計画作成時に補助作成者を設定する"
          />
        </div>
        {isCntBokLine ? (
          <div className={classes.checkBoxWrap}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.signRequire}
                  onChange={handleChange}
                  name="signRequire"
                  color="primary"
                />
              }
              label="個別支援計画書に対する電子サイン依頼を有効にする"
            />
          </div>
        ) : null}
        <SnackMsgSingle state={snack} setState={setSnack} />
        <div className={classes.btnWrap}>
          <Button
            variant="contained"
            color="secondary"
            className={classes.btn}
            onClick={() => history.goBack()}
          >
            キャンセル
          </Button>
          <Button
            variant="contained"
            color="primary"
            className={classes.btn}
            onClick={handleSave}
          >
            保存
          </Button>
        </div>
      </div>
    </>
  );
};

export const PlanSetting = () => {
  const allstate = useSelector((state) => state);
  const ls = getLodingStatus(allstate);

  if (ls.loaded && !ls.error) {
    return <PlanSettingMain />;
  } else if (!ls.loaded) {
    return <LoadingSpinner />;
  } else {
    return <LoadErr loadStatus={ls} errorId={'PS3325'} />;
  }
};

export default PlanSetting;
