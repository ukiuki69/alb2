import React, { useEffect, useState } from 'react';
import { Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel } from "@material-ui/core";
import { useDispatch, useSelector } from 'react-redux';
import { getLodingStatus } from '../../commonModule';
import { LoadingSpinner } from '../common/commonParts';
import { useHistory } from 'react-router-dom';
import { setSnackMsg, setStore } from '../../Actions';
import SnackMsg from '../common/SnackMsg';
import { univApiCall } from '../../albCommonModule';
import { NumInputGP } from '../common/StdFormParts';
import { teal } from '@material-ui/core/colors';

const INIT_RESERVE_ACCEPT_START_DATE = "20";

const INIT_RESERVE_ITEMS = {
  start: true, end: true,
  pickupLocation: true, dropoffLocation: true,
  notice: true
}

const AlfamiReserveSetting = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const allState = useSelector(state => state);
  const loadingStatus = getLodingStatus(allState);
  const {com, hid, bid} = allState;
  const schReserve = com?.ext?.schReserve ?? {};

  // 予約受付設定
  const [isReserveAccept, setIsReserveAccept] = useState(schReserve?.isReserveAccept ?? false);
  // 予約受付開始日
  const [reserveAcceptStartDate, setReserveAcceptStartDate] = useState(schReserve?.reserveAcceptStartDate ?? INIT_RESERVE_ACCEPT_START_DATE);
  // 予約時入力項目
  const [reserveItems, setReserveItems] = useState(schReserve?.reserveItems ?? INIT_RESERVE_ITEMS);
  const [snack, setSnack] = useState({});

  useEffect(() => {
    if(!loadingStatus.loaded) return;
    setIsReserveAccept(schReserve?.isReserveAccept ?? false);
    setReserveAcceptStartDate(schReserve?.reserveAcceptStartDate ?? INIT_RESERVE_ACCEPT_START_DATE);
    setReserveItems(schReserve?.reserveItems ?? INIT_RESERVE_ITEMS);
  }, [loadingStatus.loaded])

  if(!loadingStatus.loaded) return <LoadingSpinner />;

  const handleSave = async() => {
    try{
      const newComExt = {...(com?.ext ?? {})};
      newComExt.schReserve = {
        isReserveAccept: isReserveAccept,
        reserveAcceptStartDate: reserveAcceptStartDate,
        reserveItems: reserveItems
      }
      const params = {
        a: "sendComExt",
        hid, bid,
        ext: JSON.stringify(newComExt)
      }
      const res = await univApiCall(params, 'E924390');
      if (!res?.data?.result) {
        setSnack({msg: "書き込みに失敗しました。", severity: 'error'});
        return;
      }
      dispatch(setStore({com: {...com, ext: newComExt}}));
      dispatch(setSnackMsg('書き込みました。'));
      history.goBack();
    }catch(error){
      setSnack({msg: "予期せぬエラーが発生しました。", severity: 'error', errorId: 'E924391'});
    }
  }

  const disabled = !isReserveAccept;
  return (
    <>
    <div style={{maxWidth: '640px', margin: '128px auto'}}>
      <div style={{marginBottom: 16}}>
        <FormControlLabel
          control={<Checkbox
            checked={isReserveAccept}
            onChange={(e) => setIsReserveAccept(e.target.checked)}
            color='primary'
          />}
          label="あるふぁみマイページで予約受付・予定の共有を行う"
        />
      </div>
      <div style={{color: disabled ? 'rgba(0, 0, 0, 0.38)' : 'inherit'}}>
        <div style={{marginBottom: 32}}>
          <NumInputGP
            label="予約受付開始日"
            propsVal={reserveAcceptStartDate}
            def={reserveAcceptStartDate}
            setPropsVal={setReserveAcceptStartDate}
            disabled={disabled}
            lower={1}
            upper={31}
            wrapperStyle={{ 
              display: 'inline-block', verticalAlign: 'middle' ,padding: 0,
              marginLeft: -8,
            }}
            style={{ width: 140, margin: '0 8px' }}
          />
        </div>
        <div style={{color: teal[600], fontSize: '.8rem', marginBottom: 16, lineHeight: 1.5}}>
          予約受付開始日を設定すると、その日付に自動で「翌月」が作成されます。<br></br>
          月末近くに設定すると自動作成が出来ないこともありますのでご注意ください。
        </div>
        <FormControl style={{marginBottom: 16}}>
          <FormLabel>予約時入力項目</FormLabel>
          <FormGroup row>
            <FormControlLabel
              control={<Checkbox
                checked={reserveItems.start}
                onChange={(e) => setReserveItems(prevItems => ({...prevItems, "start": e.target.checked}))}
                color='primary'
                disabled={disabled}
              />}
              label="開始時間"
            />
            <FormControlLabel
              control={<Checkbox
                checked={reserveItems.end}
                onChange={(e) => setReserveItems(prevItems => ({...prevItems, "end": e.target.checked}))}
                color='primary'
                disabled={disabled}
              />}
              label="終了時間"
            />
            <FormControlLabel
              control={<Checkbox
                checked={reserveItems.pickupLocation}
                onChange={(e) => setReserveItems(prevItems => ({...prevItems, "pickupLocation": e.target.checked}))}
                color='primary'
                disabled={disabled}
              />}
              label="迎え場所"
            />
            <FormControlLabel
              control={<Checkbox
                checked={reserveItems.dropoffLocation}
                onChange={(e) => setReserveItems(prevItems => ({...prevItems, "dropoffLocation": e.target.checked}))}
                color='primary'
                disabled={disabled}
              />}
              label="送り場所"
            />
            <FormControlLabel
              control={<Checkbox
                checked={reserveItems.notice}
                onChange={(e) => setReserveItems(prevItems => ({...prevItems, "notice": e.target.checked}))}
                color='primary'
                disabled={disabled}
              />}
              label="備考"
            />
          </FormGroup>
        </FormControl>
      </div>
      <div style={{textAlign: 'end', marginTop: 16}}>
        <Button
          variant='contained'
          color='secondary'
          onClick={() => history.goBack()}
          style={{marginRight: 12}}
        >
          キャンセル
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={handleSave}
        >
          書き込み
        </Button>
      </div>
    </div>
    <SnackMsg {...snack} />
    </>
  )
}
export default AlfamiReserveSetting;