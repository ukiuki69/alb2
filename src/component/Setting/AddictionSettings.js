import React, { useEffect, useRef, useState } from 'react';
import Button from '@material-ui/core/Button';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import * as Actions from '../../Actions';
import * as comMod from '../../commonModule';
import { HOHOU, HOUDAY, JIHATSU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import * as afp from '../common/AddictionFormParts';
import { CheckBrunchUpdate } from '../common/CheckProgress';
import * as mui from '../common/materialUi';
import SnackMsg from '../common/SnackMsg';
import { LoadingSpinner, StdErrorDisplay } from '../common/commonParts';
import { setDeepPath } from '../../modules/handleDeepPath';
import SchLokedDisplay from '../common/SchLockedDisplay';
import { SoudanShienTaisei, UnivAddictionSoudan } from '../common/SoudanAddictionFormParts';
import { Links, useSettingStyles } from './settingCommon';

export const AddictionSettings = () => {
  const dispatch = useDispatch();
  const classes = useSettingStyles();
  const hid  = useSelector(state => state.hid);
  const bid = useSelector(state => state.bid);
  const com = useSelector(state=>state.com);
  const account = useSelector(state=>state.account);
  const stdDate = useSelector(state=>state.stdDate);
  const users = useSelector(state=>state.users);
  const service = useSelector(state=>state.service);
  const classroom = useSelector(state=>state.classroom);
  const serviceItems = useSelector(state=>state.serviceItems);
  const dispService = (serviceItems.length > 1)? service: '';
  const allState = useSelector(state=>state);
  const scheduleLocked = allState.schedule.locked;
  const history = useHistory();
  const [snack, setSnack] = useState({text: '', severity: ''});
  const writeButtonId = 'writeButtonId445';
  const ls = comMod.getLodingStatus(allState);
  const permission = comMod.parsePermission(account)[0][0];
  // formMap は React state を使わず DOM 直接操作で実装（再レンダリング防止）
  const formMapRootRef = useRef(null);
  const mapUpdateTimerRef = useRef(null);
  const lastMarkedRef = useRef(null);
  const markedEntryNamesRef = useRef(null);
  const markerOverlayRef = useRef(null);
  const markerTargetRef = useRef(null);
  const markerHostRef = useRef(null);
  const markerOverlayRafRef = useRef(null);
  const markerOverlayTimeoutRef = useRef(null);
  const scrollEndTimeoutRef = useRef(null);
  const overlayDelayMs = 300;
  const isMarkerActiveRef = useRef(false);

  useEffect(() => {
    const writeButton = document.getElementById(writeButtonId);
    if (!writeButton) return;

    const formElement = document.getElementById('f37fht');
    if (!formElement) return;

    const observerCallback = (mutationsList, observer) => {
      const errorElements = document.querySelectorAll('#f37fht .Mui-error');
      if (errorElements.length > 0) {
        writeButton.disabled = true;
      } else {
        writeButton.disabled = false;
      }
    };

    const observer = new MutationObserver(observerCallback);
    observer.observe(formElement, { attributes: true, childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const hideOverlayMarker = () => {
    const markerEl = markerOverlayRef.current;
    if (markerEl) {
      markerEl.style.opacity = '0';
      setTimeout(() => {
        markerEl.style.display = 'none';
      }, 300);
    }
    isMarkerActiveRef.current = false;
    if (lastMarkedRef.current) {
      lastMarkedRef.current.removeAttribute('data-form-map-marker');
    }
    lastMarkedRef.current = null;
    markerTargetRef.current = null;
    markerHostRef.current = null;
    markedEntryNamesRef.current = null;
  };

  const resolveMarkerTargetByNames = () => {
    const names = markedEntryNamesRef.current;
    if (!names || !names.length) return null;
    const formElement = document.getElementById('f37fht');
    if (!formElement) return null;
    const wrappers = Array.from(formElement.querySelectorAll('.aFormPartsWrapper'));
    const target = wrappers.find(wrapper => {
      const style = window.getComputedStyle(wrapper);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      if (wrapper.offsetParent === null) return false;
      const fieldNames = Array.from(
        wrapper.querySelectorAll('input[name], select[name], textarea[name]')
      ).map(field => field.getAttribute('name')).filter(Boolean);
      if (!fieldNames.length) return false;
      return names.every(name => fieldNames.includes(name));
    });
    if (!target) return null;
    markerTargetRef.current = target;
    markerHostRef.current = target.closest('.MuiPaper-root') || target;
    return target;
  };

  const updateOverlayMarker = () => {
    const markerEl = markerOverlayRef.current;
    let target = markerHostRef.current || markerTargetRef.current;
    if (!markerEl) return;
    if (!isMarkerActiveRef.current) {
      markerEl.style.opacity = '0';
      markerEl.style.display = 'none';
      return;
    }
    if (!target || !target.isConnected) {
      target = resolveMarkerTargetByNames();
    }
    if (!target) {
      markerEl.style.opacity = '0';
      markerEl.style.display = 'none';
      return;
    }
    let rect = target.getBoundingClientRect();
    if (rect.height === 0 || rect.width === 0) {
      const fallback = target.querySelector('.MuiInputBase-root, .MuiFormControl-root, input, select, textarea');
      if (fallback) {
        const fbRect = fallback.getBoundingClientRect();
        if (fbRect.height > 0 && fbRect.width > 0) {
          target = fallback;
          rect = fbRect;
        }
      }
    }
    if (rect.height === 0 || rect.width === 0) {
      markerEl.style.opacity = '0';
      markerEl.style.display = 'none';
      return;
    }
    const top = rect.top + rect.height / 2 - 30;
    const left = rect.left - 20;
    markerEl.style.top = `${top}px`;
    markerEl.style.left = `${left}px`;
    markerEl.style.display = 'block';
    requestAnimationFrame(() => {
      markerEl.style.opacity = '1';
    });
  };

  const requestOverlayMarkerUpdate = () => {
    if (markerOverlayRafRef.current) return;
    markerOverlayRafRef.current = requestAnimationFrame(() => {
      markerOverlayRafRef.current = null;
      updateOverlayMarker();
    });
  };

  const scheduleOverlayAfterScrollEnd = () => {
    if (scrollEndTimeoutRef.current) {
      clearTimeout(scrollEndTimeoutRef.current);
    }
    scrollEndTimeoutRef.current = setTimeout(() => {
      requestOverlayMarkerUpdate();
    }, overlayDelayMs);
  };

  useEffect(() => {
    const handleScroll = () => {
      scheduleOverlayAfterScrollEnd();
    };
    const handleResize = () => {
      requestOverlayMarkerUpdate();
    };
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      if (markerOverlayRafRef.current) {
        cancelAnimationFrame(markerOverlayRafRef.current);
      }
      if (markerOverlayTimeoutRef.current) {
        clearTimeout(markerOverlayTimeoutRef.current);
      }
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
    };
  }, []);

  const applyMarkerByNames = (names, wrappers) => {
    if (!names || !names.length) return;
    if (!isMarkerActiveRef.current) return;
    const formElement = document.getElementById('f37fht');
    if (!formElement) return;
    const list = wrappers || Array.from(formElement.querySelectorAll('.aFormPartsWrapper'));
    const target = list.find(wrapper => {
      const style = window.getComputedStyle(wrapper);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      if (wrapper.offsetParent === null) return false;
      const fieldNames = Array.from(
        wrapper.querySelectorAll('input[name], select[name], textarea[name]')
      ).map(field => field.getAttribute('name')).filter(Boolean);
      if (!fieldNames.length) return false;
      return names.every(name => fieldNames.includes(name));
    });
    if (!target) {
      hideOverlayMarker();
      return;
    }
    const markerHost = target.closest('.MuiPaper-root') || target;
    if (lastMarkedRef.current && lastMarkedRef.current !== markerHost) {
      lastMarkedRef.current.removeAttribute('data-form-map-marker');
    }
    markerHost.style.overflow = 'visible';
    if (markerHost.style.position === '' || markerHost.style.position === 'static') {
      markerHost.style.position = 'relative';
    }
    markerHost.setAttribute('data-form-map-marker', '1');
    if (markerHost.getAttribute('data-form-map-marker') !== '1') {
      return;
    }
    lastMarkedRef.current = markerHost;
    markerTargetRef.current = target;
    markerHostRef.current = markerHost;
    return markerHost;
  };

  // formMap のアイテムデータを保持（イベント委譲用）
  const formMapItemsDataRef = useRef([]);
  // scrollToFormMapItem の最新参照を保持
  const scrollToFormMapItemRef = useRef(null);
  
  // イベント委譲用のクリックハンドラを一度だけ設定
  // mousedown を使用（click だとフォーカス移動で1クリック消費される問題を回避）
  useEffect(() => {
    const formMapRoot = formMapRootRef.current;
    if (!formMapRoot) return;
    
    const handleMouseDown = (e) => {
      const target = e.target.closest('[data-form-map-idx]');
      if (!target) return;
      e.preventDefault(); // フォーカス移動を防ぐ
      const idx = parseInt(target.getAttribute('data-form-map-idx'), 10);
      const item = formMapItemsDataRef.current[idx];
      if (item && scrollToFormMapItemRef.current) {
        scrollToFormMapItemRef.current(item);
      }
    };
    
    formMapRoot.addEventListener('mousedown', handleMouseDown);
    return () => {
      formMapRoot.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // DOM 直接操作で formMap を更新（React state を使わない）
  const buildFormMapItems = () => {
    const formMapRoot = formMapRootRef.current;
    if (!formMapRoot) return;
    
    const formElement = document.getElementById('f37fht');
    if (!formElement) {
      formMapRoot.innerHTML = `<div class="${classes.formMapEmpty}">表示中の入力がありません。</div>`;
      formMapItemsDataRef.current = [];
      return;
    }
    const wrappers = Array.from(
      formElement.querySelectorAll('.aFormPartsWrapper')
    );
    let index = 0;
    const items = wrappers.map(wrapper => {
      const style = window.getComputedStyle(wrapper);
      if (style.display === 'none' || style.visibility === 'hidden') return null;
      if (wrapper.offsetParent === null) return null;
      const fields = Array.from(
        wrapper.querySelectorAll('input[name], select[name], textarea[name]')
      );
      if (!fields.length) return null;
      const entries = fields.map(field => {
        const name = field.getAttribute('name') || field.getAttribute('id');
        if (!name) return null;
        let value = field.value;
        if (field.type === 'checkbox') {
          value = field.checked ? '1' : '';
        }
        else if (field.type === 'radio') {
          if (!field.checked) return null;
          value = field.value;
        }
        return { name, value };
      }).filter(Boolean);
      if (!entries.length) return null;
      const classList = Array.from(wrapper.classList);
      const titleClass = classList.find(c =>
        c !== 'aFormPartsWrapper' &&
        !c.startsWith('Mui') &&
        !['large', 'middle', 'small'].includes(c)
      );
      return {
        id: `formMapItem-${index++}`,
        title: titleClass || entries[0].name,
        entries,
        wrapper,
      };
    }).filter(Boolean);
    applyMarkerByNames(markedEntryNamesRef.current, wrappers);
    
    // データを ref に保存（イベント委譲で使用）
    formMapItemsDataRef.current = items;
    
    // DOM を直接更新（React 再レンダリングなし）
    if (items.length === 0) {
      formMapRoot.innerHTML = `<div class="${classes.formMapEmpty}">表示中の入力がありません。</div>`;
    } else {
      formMapRoot.innerHTML = items.map((item, idx) => `
        <div class="${classes.formMapItem}" data-form-map-idx="${idx}">
          ${item.entries.map(entry => `
            <div class="${entry.value ? `${classes.formMapItemRow} ${classes.formMapItemRowActive}` : classes.formMapItemRow}">
              ${entry.name}
            </div>
          `).join('')}
        </div>
      `).join('');
    }
  };

  const scheduleMapUpdate = () => {
    if (mapUpdateTimerRef.current) {
      clearTimeout(mapUpdateTimerRef.current);
    }
    mapUpdateTimerRef.current = setTimeout(() => {
      buildFormMapItems();
    }, 120);
  };

  useEffect(() => {
    const formElement = document.getElementById('f37fht');
    if (!formElement) {
      // DOM 直接操作で空表示
      if (formMapRootRef.current) {
        formMapRootRef.current.innerHTML = `<div class="${classes.formMapEmpty}">表示中の入力がありません。</div>`;
      }
      return;
    }
    hideOverlayMarker();
    scheduleMapUpdate();
    const handleInputEvent = () => {
      scheduleMapUpdate();
    };
    formElement.addEventListener('input', handleInputEvent, true);
    formElement.addEventListener('change', handleInputEvent, true);
    formElement.addEventListener('blur', handleInputEvent, true);
    return () => {
      formElement.removeEventListener('input', handleInputEvent, true);
      formElement.removeEventListener('change', handleInputEvent, true);
      formElement.removeEventListener('blur', handleInputEvent, true);
      if (mapUpdateTimerRef.current) {
        clearTimeout(mapUpdateTimerRef.current);
      }
    };
  }, [service, classroom, stdDate]);

  const handleSubmit = (e)=>{
    e.preventDefault();
    const inputs = document.querySelectorAll('#f37fht input');
    const selects = document.querySelectorAll('#f37fht select');
    const errFld = document.querySelectorAll('#f37fht .Mui-error')

    const outPutObj = {...com.addiction};
    const formDatas = comMod.getFormDatas([inputs, selects]);

    if (errFld.length){
      setSnack({
        text: 'エラーの確認をしてください。',
        severity: 'warning',
        id: new Date().getTime()
      })
      return false;
    }

    if (!classroom){
      outPutObj[service] = formDatas;
    }
    else{
      const t = setDeepPath(
        outPutObj, [service, classroom], formDatas
      );
      outPutObj[service] = t[service];
    }
    dispatch(Actions.setAddictionSettingCom(outPutObj));
    dispatch(Actions.sendBrunch(
      { ...com, hid, bid, date:stdDate, addiction: outPutObj }
    ));
  }

  const keyHandler = (e) =>{
    if (e.which === 13 && e.shiftKey) handleSubmit(e);
  }

  const cancelSubmit = (e)=>{
    dispatch(Actions.resetStore());
  }

  const scrollToFormMapItem = (item) => {
    const formElement = document.getElementById('f37fht');
    if (!formElement) return;
    const wrappers = Array.from(formElement.querySelectorAll('.aFormPartsWrapper'));
    const targetNames = item.entries.map(entry => entry.name);
    markedEntryNamesRef.current = targetNames;
    const target = wrappers.find(wrapper => {
      const style = window.getComputedStyle(wrapper);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      if (wrapper.offsetParent === null) return false;
      const names = Array.from(
        wrapper.querySelectorAll('input[name], select[name], textarea[name]')
      ).map(field => field.getAttribute('name')).filter(Boolean);
      if (!names.length) return false;
      return targetNames.every(name => names.includes(name));
    });
    if (!target) {
      hideOverlayMarker();
      return;
    }
    hideOverlayMarker();
    isMarkerActiveRef.current = true;
    markedEntryNamesRef.current = targetNames;
    const markerHost = applyMarkerByNames(targetNames, wrappers);
    const rect = target.getBoundingClientRect();
    const scrollElement = document.scrollingElement || document.documentElement;
    const top = rect.top + scrollElement.scrollTop
      - (window.innerHeight / 2 - rect.height / 2);
    const startTop = scrollElement.scrollTop;
    const delta = top - startTop;
    const duration = 120;
    const startTime = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      scrollElement.scrollTop = startTop + delta * eased;
      if (t < 1) requestAnimationFrame(step);
      else scheduleOverlayAfterScrollEnd();
    };
    requestAnimationFrame(step);
    if (markerOverlayTimeoutRef.current) {
      clearTimeout(markerOverlayTimeoutRef.current);
    }
    markerOverlayTimeoutRef.current = setTimeout(() => {
      scheduleOverlayAfterScrollEnd();
    }, duration + overlayDelayMs);
    const focusTarget = target.querySelector('input, select, textarea');
    if (focusTarget) focusTarget.focus({ preventScroll: true });
  };
  // 常に最新の関数を ref に保存
  scrollToFormMapItemRef.current = scrollToFormMapItem;

  let serviceTitleClass;
  if (service === HOUDAY){
    serviceTitleClass = classes.serviceTitle;
  }
  else if (service === JIHATSU){
    serviceTitleClass = classes.serviceTitleJIHATSU;
  }
  else if (service === HOHOU){
    serviceTitleClass = classes.serviceTitleHOHOU;
  }

  if (!ls.loaded){
    return <LoadingSpinner />
  }
  else if (ls.error){
    const errPrms = {
      errorText: `ロードエラーが発生しました。`,
      errorSubText: '', errorId: 'E55619', errorDetail:ls.detail
    }
    return (
      <div className="AppPage setting">
        <StdErrorDisplay {...errPrms} />
      </div>
    )
  }
  if (!users.length){
    const errPrms = {
      errorText: `ユーザーが一人も登録されていません。
                  こちらの設定は一人以上のユーザーを登録してから実施して下さい。`, 
      errorSubText: '', errorId: 'E55611', errorDetail:''
    }
    return (
      <div className="AppPage setting">
        <StdErrorDisplay {...errPrms} />
      </div>
    )
  }

  // 単位設定されている場合の出力
  const ByClassroomFormParts = () => {
    return (<>
      <afp.JiShidouKaHai1 dLayer={1} size='large' withClassroom/>
      <afp.FukushiSenmonHaichi dLayer={1} size='large' withClassroom/>
      <afp.SenmonShien dLayer={1} size='large' withClassroom/>
      <afp.KangoKahai dLayer={1} size='large' withClassroom/>
      <afp.SenmonTaisei dLayer={1} size='large' withClassroom/>
      <afp.EiyoushiHaichi dLayer={1} size='large' withClassroom/>
    </>)
  }

  const LC2024SoudanParts = () => {
    const keikakuMon = ['計画作成月', 'モニタリング月'];
    const tokuchiDispliction = '豪雪地帯、特別豪雪地帯、辺地、過疎地域等であって、人口密度が希薄、交通が不便等の理由によりサービスの確保が著しく困難な地域に対してサービスを提供した場合に算定できる加算です。';
    const peerSupportTxt = 'ピアサポート体制加算は、一部の障害福祉サービス事業所で働くピアサポーターが所定の条件を満たす場合に、算定できます。'
    const syuninTxt = '相談支援従事者主任研修を修了した常勤かつ専従の主任相談支援専門員を事業所に配置した場合などに算定できる加算です。'
    const koudouTxt = '行動障害支援体制加算は、行動障害のある知的障害者や精神障害者、障害児に対する適切な支援を評価する仕組みです。この加算制度は、特定の基準を満たした相談支援事業所が利用者1人あたり月ごとに単位数を得られるもので、事業所の運営体制の質を向上させる重要な役割を果たします。';
    const youisyouTxt = '医療的ケアが必要な障害児者に適切な支援を提供する体制を整備した事業所に支給される加算制度です。この制度の目的は、医療的ケア児等への支援の質を高めることにあります。この加算制度を活用することで、利用者に安心かつ適切な福祉サービスを提供する環境を整えることが期待されています。';
    const seishinTxt = '精神障害を持つ方々への支援を強化するために設けられた加算制度です。これは、支援が適切に提供されるような体制が整っている事業所に対して支給されます。特に精神障害者が地域で自立して生活できるようにするための支援が求められており、この加算はその体制整備を奨励することを目的としています。';
    const koujyouTxt = '高次脳機能障害に関する研修を受講した常勤の相談支援専門員を配置していることなどを評価する加算です。';

    const eachPrms = [
      {nameJp: '主任相談支援専門員配置加算', optPtn: 'roman2', discriptionText: syuninTxt},
      {nameJp: '行動障害支援体制加算', optPtn: 'roman2', discriptionText: koudouTxt},
      {nameJp: '要医療児者支援体制加算', optPtn: 'roman2', discriptionText: youisyouTxt},
      {nameJp: '精神障害者支援体制加算', optPtn: 'roman2', discriptionText: seishinTxt},
      {nameJp: '高次脳機能障害支援体制加算', optPtn: 'roman2', discriptionText: koujyouTxt},
      {nameJp: 'ピアサポート体制加算', discriptionText: peerSupportTxt},
    ]
    const style = {display: 'flex', justifyContent: 'center'}
    if (![KEIKAKU_SOUDAN, SYOUGAI_SOUDAN].includes(service)) return null;
    const elms = eachPrms.map((e, i)=>{
      const addStyle = {}
      return (
        <div key={i} style={{...style, ...addStyle}}>
          <UnivAddictionSoudan
            size='large' dLayer={0} 
            nameJp={e.nameJp} svcs={e.svcs} optPtn={e.optPtn}
            labelOutside={false} discriptionText={e.discriptionText}
            noLabel={false}
          />
        </div>
      )
    })
    return elms;
  }

  const isSoudan = (service === KEIKAKU_SOUDAN || service === SYOUGAI_SOUDAN)

  // 単位設定されていない通常の出力
  const NormalFormParts = () => {
    return (<>
      <afp.TeikyoujikanKubun dLayer={0} size='large'/>
      <afp.ChiikiKubun dLayer={0} size='large'/>
      <afp.Teiin dLayer={0} size='large' />
      <afp.JikanKubunEnchoAuto dLayer={0} size='large' />  
      <afp.JiShidouKaHai1 dLayer={0} size='large' />
      <afp.FukushiSenmonHaichi dLayer={0} dispHide size='large' />
      <afp.ShoguuKaizen dLayer={0} size='large' />
      <afp.SenmonTaisei dLayer={0} size='large' />  
      
      {/* 相談支援専用 */}
      <SoudanShienTaisei dLayer={0} size='large' />
      <LC2024SoudanParts/>
      {/* 児発専用 */}
      <afp.ShisetsuKubun dLayer={0} size='large' />
      <afp.Chikoutai dLayer={0} size='large' />
      <afp.SyuugakuKubun dLayer={0} size='large' />
      <afp.MusyoukaAuto dLayer={0} size='large' />
      <afp.EiyoushiHaichi dLayer={0} size='large' />
      {/* 児発専用ここまで */}
      <afp.SenmonShien dLayer={0} size='large' />
      <afp.KangoKahai dLayer={0} size='large' />
      <afp.BaseUpKasan dLayer={0} size='large' />
      <afp.KyouseiService dLayer={0} size='large' />
      <afp.KyouseiKyouka dLayer={0} size='large' />
      <afp.KijunGaitou dLayer={0} size='large' />
      <afp.TokuteiSyoguu dLayer={0} size='large' />
      <afp.HohouSenmon dLayer={0} size='large' />  

      <afp.TyuukakuKyouka dLayer={0} size='large' />  
      <afp.TyuukakuKyoukaJigyousyo dLayer={0} size='large' />  

      <afp.Juushingata dLayer={0} size='large' />
      <afp.ServiceAsTanni dLayer={0} size='large' />
      <afp.TokubetsuShien dLayer={0} size='large' />
      <afp.HoumonShienTokubetsu dLayer={0} size='large' />
      <afp.ShokuinKetujo dLayer={0} size='large' />
      <afp.JihatsuKetsujo dLayer={0} size='large' />
      <afp.KeikakuMisakusei dLayer={0} size='large' />
      <afp.Jikohyouka dLayer={0} size='large' />
      <afp.KaisyoGensan dLayer={0} size='large' />
      <afp.ShinTaikousoku dLayer={0} size='large' />
      <afp.GyakutaiGensan dLayer={0} size='large' />
      <afp.GyoumuGensan dLayer={0} size='large' />
      <afp.JouhouKouhyouGensan dLayer={0} size='large' />
      <afp.ShienPrgGensan dLayer={0} size='large' />
      
      <afp.TeiinChouka dLayer={0} size='large' />

      {!isSoudan &&
        <div className="formTextWrapper">
          <div className="text">
            以下の項目は全体の事業所全体の請求設定ではありません。
            ここでは利用者ごと、日付ごとのなどの加算減算設定で表示非表示を切り替えるために設定します。
          </div>
          <div className='text' style={{color:'#c62828'}}>
            こちらでの表示設定は廃止になりました。従来の設定が残っており不具合が発生する場合はサポートにご連絡ください。
            <Button 
              onClick={()=>{history.push('/setting/hideaddiction/')}}
              color='primary'
            >
              非表示設定
            </Button>
            で設定を行って下さい。
          </div>
        </div>
      }
      {permission === 100 && <>
        {/* 児発専用 */}
        <afp.ShokujiTeikyou dLayer={0} noOpt dispHide size='large' />
        {/* 児発専用ここまで */}

        <afp.KobetsuSuport1 dLayer={0} noOpt dispHide size='large' />
        <afp.KobetsuSuport2 dLayer={0} noOpt dispHide size='large' />
        <afp.KobetsuSuport3 dLayer={0} noOpt dispHide size='large' />
        <afp.IryouRenkei dLayer={0} noOpt dispHide size='large' />
        <afp.IryouCareJi dLayer={0} noOpt dispHide size='large' />
        <afp.SougeiItteiJouken dLayer={0} noOpt dispHide size='large' />

        <afp.EnchouShien dLayer={0} noOpt dispHide size='large' />
        <afp.KateiRenkei dLayer={0} noOpt dispHide size='large' />
        <afp.KankeiRenkei dLayer={0} noOpt dispHide size='large' />
        <afp.HoikuKyouiku dLayer={0} noOpt dispHide size='large' />
        <afp.SougeiKasanSettei dLayer={0} noOpt dispHide size='large' />

        <afp.JiritsuSupport dLayer={0} noOpt dispHide size='large' />
        <afp.SyuutyuuShien dLayer={0} noOpt dispHide size='large' />
        <afp.JigyousyoRenkei dLayer={0} noOpt dispHide size='large' />
        <afp.TuusyoJiritsu dLayer={0} noOpt dispHide size='large' />
        <afp.NyuuyokuShien dLayer={0} noOpt dispHide size='large' />
        <afp.ShikakuTyoukaku dLayer={0} noOpt dispHide size='large' />

        <afp.JougenKanri dLayer={0} dispHide size='large' />
        <afp.HoumonShien dLayer={0} noOpt dispHide size='large' />
        <afp.KessekiTaiou dLayer={0} noOpt dispHide size='large' />
      </>}
    </>)
  }

  const dispClassroom = classroom? ' 単位名' + classroom + ' ': '';

  return (<>
    <Links />
    <div className="AppPage setting">
      <CheckBrunchUpdate inline />
      <div ref={markerOverlayRef} className={classes.formMapOverlayMarker} />
      <div ref={formMapRootRef} className={classes.formMapRoot}>
        <div className={classes.formMapEmpty}>表示中の入力がありません。</div>
      </div>
      {dispService !== '' &&
        <div className={serviceTitleClass}>{dispService}</div>
      }
      {classroom !== '' &&
        <div className={classes.clasroomTitle}>
          <span>単位名</span>{classroom}
        </div>
      }
      <div className={classes.hideaddiction}>
        <Button
          onClick={()=>{history.push('/setting/hideaddiction/')}}
          color='primary'
          startIcon={<VisibilityOffIcon/>}
        >
          加算項目の非表示設定はこちらから
        </Button>
      </div>
      {/* 単位別加算に対応 */}
      <form 
        id='f37fht' onKeyPress={(e) => keyHandler(e)}
        style={{width: 550, margin: '0 auto'}}
      >
        {classroom === '' && <NormalFormParts/>}
        {classroom !== '' && <ByClassroomFormParts/>}
      </form>
      {scheduleLocked !== true &&
        <div className='buttonWrapper fixed'>
          <mui.ButtonGP
            color='secondary'
            label='キャンセル'
            onClick={cancelSubmit}
          />
          <Button
            color='primary'
            type="submit"
            onClick={handleSubmit}
            variant='contained'
            id={writeButtonId}
          >
            {comMod.shortWord(dispService) + dispClassroom + '書き込み'}          
          </Button>
        </div>
      }
      <SchLokedDisplay/>
      <SnackMsg {...snack} />
    </div>
  </>)
};

export default AddictionSettings;
