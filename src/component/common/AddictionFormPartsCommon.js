import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core";
import { useGetDef } from "./AddictionFormParts";
import { useSelector } from "react-redux";
import { getUser } from "../../commonModule";
import { SelectGp } from "./FormPartsCommon";
import { NoticeDialog } from "./materialUi";
import { HOHOU, HOUDAY, JIHATSU } from '../../modules/contants';
import { LC2024, LC202406 } from '../../modules/contants';
import { blue, orange, purple, teal } from "@material-ui/core/colors";
import FiberNewIcon from '@material-ui/icons/FiberNew';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import { elapsedMonths } from "../../modules/elapsedTimes";



const useStyles = makeStyles({
  noticeDialog: { // この指定は意味をなしてない Typographyをdiv出力したい
    '& .MuiTypography-root': {
      paragraph: false,
      component:'div',
    },
  },
  checkedIconMiddle: {
    position: 'absolute', top: 2, right: 2,
    '& .MuiSvgIcon-root': {
      width: '1.5rem',
      height: '1.5rem',
    },
  },
  smallIconButton : {
    padding: 8,
  },

});

export const StatusIcon = (props) => {
  const classes = useStyles();
  const {val, size, nameJp,...other} = props;
  // console.log(nameJp, 'nameJp');
  let chkDisp = (val && parseInt(val) !== -1)? true: false;
  let hideDisp = (parseInt(val) === -1) ? true : false;
  // 値ゼロでチェックオフになる値あり。医療的ケア児
  chkDisp = (parseInt(val) === 0)? false: chkDisp; 
  hideDisp = (parseInt(val) === 0)? hideDisp: false; 
  const iconClass = (size.includes('middle')) ? 
    classes.checkedIconMiddle: classes.checkedIcon;
  const IconChk = () => (
    <div className={iconClass + ' checked'}>
      <CheckCircleIcon color='secondary' />
    </div>
  )
  const IconHide = () => (
    <div className={iconClass + ' checked'}>
      <VisibilityOffIcon  />
    </div>
  )
  if (chkDisp)
    return  <IconChk/>;
  else if (hideDisp)
    return <IconHide/>;
  else 
    return null;
}


export const getDispControle = (predef) =>{
  const notDisp = (parseInt(predef) === -1) ? true : false;
  const disabled = (predef) ? true : false;
  return [disabled, notDisp];
}

// largeで表示したときの説明文タイトル
export const DiscriptionTitle = (props) => {
  const {nameJp, dispNewIcon} = props;
  // ここでのサービスはstoreから取得。親コンポーネントのpropsは無視される
  const service = useSelector(state=>state.service);
  const styleBase = {
    fontSize: '1.0rem', display: 'Block', marginBottom: 4,
  }

  let serviceColor;
  if (service === HOUDAY){
    serviceColor = teal[600];
  }
  else if (service === JIHATSU){
    serviceColor = blue[600];
  }
  else if (service === HOHOU){
    serviceColor = purple[600];
  }
  const style = {...styleBase, color: serviceColor};
  return(<>
    <span style={style}>
      {nameJp}
      {dispNewIcon && <FiberNewIcon style={{color: orange[600]}}/>}
    </span>
    
  </>)
}

// 加算設定用セレクタの汎用版
export const KasanSelectorGP = (props) => {
  const {
    uid, did, dLayer, schedule, nameJp, size, dispHide, 
    svcs, // 配列で指定。このコンポーネントを表示するサービス名を指定する
    discriptionText, // 加算項目の説明文
    DiscriptionNode, // 加算項目の説明 nodeで渡せる 
    opts, // セレクトのオプション。配列で。
    monthAdded, // 追加された月 newのアイコンを表示するため
    withClassroom, // 単位ごとの加算
    label,
    setPropsVal, // 上位コンポーネントからのState制御
    propsVal,
  } = props;
  const classes = useStyles();
  const preDef = useGetDef(nameJp, uid, did, dLayer - 1, schedule);
  let def = useGetDef(nameJp, uid, did, dLayer, schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const ssvc = useSelector(state=>state.service); // ステート上のサービス
  const allState = useSelector(s=>s);
  const {users, stdDate, classroom,com} = allState;
  // サービスが未指定ならユーザーのサービスを取得する uidが未指定だったら最初のuserから拾う
  const user = uid? getUser(uid, users): users[0];
  const service = ssvc? ssvc: user.service.split(',')[0];
  if (withClassroom){
    def = com?.addiction?.[service]?.[classroom]?.[nameJp];
  }

  // propsが更新されてもvalが維持される。これで更新される？
  useEffect(() => {
    setval((disabled) ? preDef : def);
  }, [uid, did]);

  useEffect(()=>{
    if (propsVal !== undefined) {
      setval(propsVal)
      if (typeof setPropsVal === 'function'){
        setPropsVal(propsVal);
      }
    }
  }, [propsVal]);
  const handleChange = (e) => {
    setval(e.currentTarget.value);
    if (typeof setPropsVal === 'function'){
      setPropsVal(e.currentTarget.value);
    }
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  const dispNewIcon = (()=>{
    const elpsMonths = monthAdded? elapsedMonths(monthAdded, stdDate): false;
    if (elpsMonths !== false && elpsMonths <= 2){
      return true;
    }
    else return false;
  })();

  if (!svcs.includes(service)) return null;

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={label? label: nameJp} dispNewIcon={dispNewIcon}/>
      <span className="main">
        {/* 相談支援専門員が、計画相談支援の対象障がい者等であって、介護保険法規定する要介護状態・要支援状態のときに適用される減算です。 */}
        {discriptionText}
        {DiscriptionNode && <DiscriptionNode/>}
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShokujiTeikyou " + noOpt + size}>
        <StatusIcon val={val} size={size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          label={label}
          size={size}
          opts={(noOpt) ? [] : opts}
          disabled={disabled || props.disabled}
          dispHide={dispHide}
          hidenull={props.hidenull}
          nullLabel={props.nullLabel}
          noLabel={props.noLabel}
          labelOutside={props.labelOutside}
          setVal={setval}
        />

        <Discription />
        <NoticeDialog
          className={classes.noticeDialog}
          title={nameJp}
          noticeopen={noticeopen}
          setnoticeopen={setnoticeopen}
          Content={Discription}
        />
      </div>
    </>
  )
}

export const getAddictionOption = (nameJp, stdDate = '', service = '') => {
  switch(nameJp) {
    // --- 固定配列（nameJpのみで決定） ---
    case '地域区分':
      return ['一級地','二級地','三級地','四級地','五級地','六級地','七級地','その他'];
    case '障害児状態等区分':
      return ["区分１の１","区分１の２","区分２の１","区分２の２"];
    case '共生型サービス':
      return [{ value: 1, label: "選択" }];
    case '福祉専門職員配置等加算':
      return ["福祉専門職員配置等加算Ⅰ","福祉専門職員配置等加算Ⅱ","福祉専門職員配置等加算Ⅲ"];
    case '児童指導員配置加算':
      return [{ value: 1, label: "選択" }];
    case '看護職員加配加算':
      return ["看護職員加配加算Ⅰ","看護職員加配加算Ⅱ"];
    case '開所時間減算':
      return ["4時間未満","4時間以上6時間未満"];
    case '医療連携体制加算':
      return [
        '医療連携体制加算Ⅰ',
        '医療連携体制加算Ⅱ',
        '医療連携体制加算Ⅲ',
        '医療連携体制加算Ⅳ１',
        '医療連携体制加算Ⅳ２',
        '医療連携体制加算Ⅳ３',
        '医療連携体制加算Ⅴ１',
        '医療連携体制加算Ⅴ２',
        '医療連携体制加算Ⅴ３',
      ];
    case '身体拘束廃止未実施減算':
      return [{ value: 1, label: "選択" }];
    case '共生型サービス体制強化加算':
      return ['児発管かつ保育士又は児童指導員','児発管の場合','保育士又は児童指導員の場合'];
    case '定員超過利用減算':
      return [{ value: 1, label: "選択" }];
    case 'サービス提供職員欠如減算':
      return ["二ヶ月まで", "三ヶ月以上"];
    case '児童発達支援管理責任者欠如減算':
      return ["五ヶ月未満", "五ヶ月以上"];
    case '福祉・介護職員処遇改善特別加算':
      return [{ value: 1, label: "選択" }];
    case '福祉・介護職員等ベースアップ等支援加算':
      return [{ value: 1, label: "選択" }];
    case '延長支援加算':
      return ['1時間未満','1時間以上2時間未満','2時間以上'];
    case '特別支援加算':
      return [{ value: 1, label: "選択" }];
    case '家庭連携加算':
      return ['1時間未満','1時間以上'];
    case '家族支援加算Ⅰ':
      return ['居宅1時間以上', '居宅1時間未満', '事業所対面', 'オンライン'];
    case '家族支援加算Ⅱ':
      return ['事業所対面', 'オンライン'];
    case '訪問支援特別加算':
      return ['1時間未満の場合','1時間以上の場合'];
    case '利用者負担上限額管理加算':
      return [{ value: 0, label: '自動'},{ value: '手動', label: "設定" },{ value: 'off', label: '設定しない'}];
    case '自己評価結果等未公表減算':
      return [{ value: 1, label: "選択" }];
    case '通所支援計画未作成減算':
      return ['3ヶ月未満','3ヶ月以上'];
    case '支援プログラム未公表減算':
      return [{ value: 1, label: "選択" }];
    case '医療ケア児基本報酬区分':
      return [
        { value: '', label: "未選択" },
        { value: 3, label: "医療的ケア児3点以上" },
        { value: 16, label: "医療的ケア児16点以上" },
        { value: 32, label: "医療的ケア児32点以上" },
      ];
    case '個別サポート加算２':
      return [{ value: 1, label: "選択" }];
    case 'サービス提供時間区分':
      return ["区分１", "区分２"];
    case '食事提供加算':
      return ['児発食事提供加算Ⅰ', '児発食事提供加算Ⅱ'];
    case '栄養士配置加算':
      return ['栄養士配置加算Ⅰ', '栄養士配置加算Ⅱ'];
    case '地方公共団体':
      return [{ value: 1, label: "選択" }];
    case '就学区分':
      return [{ value: 1, label: "区分Ⅰ" },{ value: 2, label: "区分Ⅱ" }];
    case '児童発達支援センター':
      return [{ value: 1, label: "選択" }];
    case '重症心身型':
      return [{ value: 1, label: "選択" }];
    case 'サービスごと単位':
      return [{ value: 1, label: "選択" }];
    case '児童発達支援無償化':
      return [{ value: 1, label: "選択" }];
    case '児童発達支援無償化自動設定':
      return [{ value: 1, label: "選択" }];
    case '多子軽減措置':
      return ['第二子軽減', '第三子軽減'];
    case '保育訪問':
      return ['保訪', '複数支援'];
    case '訪問支援員特別加算':
      return [{ value: 1, label: "選択" }];
    case '初回加算':
      return [{ value: 1, label: "選択" }];
    case '特地加算':
      return [{ value: 1, label: "選択" }];
    case '送迎加算Ⅰ一定条件':
      return [{ value: 1, label: "選択" }];
    // KasanSelectorGP経由の固定配列
    case '算定時間設定方法':
      return [{ value: 1, label: "自動" },{ value: 2, label: "半自動" },{ value: 3, label: "手動" }];
    case '虐待防止措置未実施減算':
      return [{ value: 1, label: "選択" }];
    case '業務継続計画未策定減算':
      return [{ value: 1, label: "選択" }];
    case '情報公表未報告減算':
      return [{ value: 1, label: "選択" }];
    case '中核機能強化加算':
      return [{ value: 1, label: "中核機能強化Ⅰ" },{ value: 2, label: "中核機能強化Ⅱ" },{ value: 3, label: "中核機能強化Ⅲ" }];
    case '中核機能強化事業所加算':
      return [{ value: 1, label: "選択" }];
    case '専門的支援体制加算':
      return [{ value: 1, label: "選択" }];
    case '子育てサポート加算':
      return [{ value: 1, label: "選択" }];
    case '専門的支援実施加算':
      return [{ value: 1, label: "選択" }];
    case '視覚聴覚言語機能障害児支援加算':
      return [{ value: 1, label: "選択" }];
    case '入浴支援加算':
      return [{ value: 1, label: "選択" }];
    case '集中的支援加算':
      return [{ value: 1, label: "選択" }];
    case '個別サポート加算３':
      return [{ value: 1, label: "選択" }];
    case '事業所間連携加算':
      return [{value: 1, label: '事業所間連携加算Ⅰ'},{value: 2, label: '事業所間連携加算Ⅱ'}];
    case '自立サポート加算':
      return [{ value: 1, label: "選択" }];
    case '通所自立支援加算':
      return [{ value: 1, label: "片道" },{ value: 2, label: "往復" }];
    case '強度行動障害児支援加算９０日以内':
      return [{ value: 1, label: "選択" }];
    case '多職種連携支援加算':
      return [{ value: 1, label: "選択" }];
    case 'ケアニーズ対応加算':
      return [{ value: 1, label: "選択" }];
    case '訪問支援員特別加算24':
      return [{ value: 1, label: "特別加算Ⅰ" },{ value: 2, label: "特別加算Ⅱ" }];
    case '時間区分延長支援自動設定':
      return [
        { value: 1, label: "時間区分のみ自動で設定する" },
        { value: 2, label: "時間区分と延長支援を自動で設定する" },
        { value: 3, label: "常に自動設定を行う" },
      ];
    case '個別サポートⅠ１設定':
      return [{ value: 1, label: "Ⅰ１標準 90単位" },{ value: 2, label: "Ⅰ１（一定要件） 120単位" }];
    case '特別地域加算':
      return [{ value: 1, label: "選択" }];
    case '医療的ケア児基本報酬':
      return [{ value: 1, label: "選択" }];
    case '医療的ケア児延長支援':
      return [{ value: 1, label: "選択" }];
    case '強度行動障害児支援加算無効化':
      return [{ value: 1, label: "無効化" }];
    case '送迎加算設定':
      return [
        {value: '送迎加算１（一定条件１）', label: '１一定１'},
        {value: '送迎加算１（一定条件１・同一敷地）', label: '１一定１同一'},
        {value: '送迎加算１（一定条件２）', label: '１一定２'},
        {value: '送迎加算１（一定条件２・同一敷地）', label: '１一定２同一'},
        {value: '送迎加算１（同一敷地）', label: '１同一'},
        {value: '送迎加算２', label: '２'},
        {value: '送迎加算２（同一敷地）', label: '２同一'},
        {value: '送迎加算３', label: '３'},
        {value: '送迎加算３（同一敷地）', label: '３同一'},
      ];

    // --- stdDate / service で分岐するもの ---
    case '基準該当':
      if (service === HOUDAY) return [{ value: 1, label: "選択" }];
      if (service === JIHATSU) return ['基準該当児発Ⅰ', '基準該当児発Ⅱ'];
      return [{ value: 1, label: "選択" }];
    case '児童指導員等加配加算':
    case '児童指導員等加配加算（Ⅰ）':
      if (stdDate >= '2024-04-01') {
        return ['常勤専従5年以上','常勤専従5年未満','常勤換算5年以上','常勤換算5年未満','その他'];
      }
      return ["理学療法士等","児童指導員","その他"];
    case '関係機関連携加算':
      if (service === HOHOU) {
        return [{ value: '1', label: "選択" }];
      }
      if (stdDate >= LC2024) {
        return [
          { value: 1, label: "関係連携Ⅰ" },
          { value: 2, label: "関係連携Ⅱ" },
          { value: 3, label: "関係連携Ⅲ" },
          { value: 4, label: "関係連携Ⅳ" },
        ];
      }
      return ['関係機関連携加算Ⅰ', '関係機関連携加算Ⅱ'];
    case '事業所内相談支援加算':
      if (stdDate && stdDate < LC2024) {
        return [
          {value: '事業所内相談支援加算Ⅰ', label: '相談支援Ⅰ'},
          {value: '事業所内相談支援加算Ⅱ', label: '相談支援Ⅱ'},
        ];
      }
      return ['事業所内相談支援加算Ⅰ','事業所内相談支援加算Ⅱ'];
    case '強度行動障害児支援加算': {
      if (stdDate < LC2024) return [{ value: 1, label: "選択" }];
      if (service === HOUDAY) return [{ value: 1, label: "強行支援1" },{ value: 2, label: "強行支援2" }];
      if (service === JIHATSU) return [{ value: 1, label: "選択" }];
      if (service === HOHOU) return [{ value: 1, label: "選択" }];
      return [{ value: 1, label: "選択" }];
    }
    case '保育・教育等移行支援加算':
      if (stdDate < LC2024) return [{ value: 1, label: "選択" }];
      return ['入所中', '退所後'];
    case '欠席時対応加算':
      if (stdDate >= LC2024) return [{ value: 1, label: "選択" }];
      if (service === HOUDAY) return ['欠席時対応加算１', '欠席時対応加算２'];
      return [{ value: 1, label: "選択" }];
    case '人工内耳装用児支援加算':
      if (service === HOUDAY) return [{value: 1, label: '選択'}];
      if (service === JIHATSU) return [{value: 1, label: '人工内耳支援Ⅰ'}, {value: 2, label: '人工内耳支援Ⅱ'}];
      return [{ value: 1, label: "選択" }];
    case '特定処遇改善加算':
      if (service !== HOHOU) return ['特定処遇改善加算Ⅰ','特定処遇改善加算Ⅱ'];
      return [{ value: 1, label: "選択" }];
    case '専門的支援加算':
      if (service === HOUDAY) return [{ value: 1, label: "選択" }];
      return ['理学療法士等', '児童指導員等'];
    case '個別サポート加算１': {
      if (stdDate < LC2024) return [{ value: 1, label: "選択" }];
      if (service === HOUDAY) {
        return [
          { value: 1, label: "Ⅰ１ 標準" },
          { value: 2, label: "Ⅰ１ 一定要件" },
          { value: 3, label: "Ⅰ２ 著しく重度" },
        ];
      }
      if (service === JIHATSU) return [{ value: 1, label: "選択" }];
      return [{ value: 1, label: "選択" }];
    }
    case '福祉・介護職員処遇改善加算': {
      const syoguuStd = [
        {value: 100, label: '処遇改善加算Ⅰ'},
        {value: 200, label: '処遇改善加算Ⅱ'},
        {value: 300, label: '処遇改善加算Ⅲ'},
        {value: 400, label: '処遇改善加算Ⅳ'},
      ];
      const syoguuStdHohou = [
        {value: 100, label: '処遇改善加算Ⅰ'},
        {value: 300, label: '処遇改善加算Ⅲ'},
        {value: 400, label: '処遇改善加算Ⅳ'},
      ];
      const syoguu5 = [
        {value: 501, label: '処遇改善加算Ⅴ１'},
        {value: 502, label: '処遇改善加算Ⅴ２'},
        {value: 503, label: '処遇改善加算Ⅴ３'},
        {value: 504, label: '処遇改善加算Ⅴ４'},
        {value: 505, label: '処遇改善加算Ⅴ５'},
        {value: 506, label: '処遇改善加算Ⅴ６'},
        {value: 507, label: '処遇改善加算Ⅴ７'},
        {value: 508, label: '処遇改善加算Ⅴ８'},
        {value: 509, label: '処遇改善加算Ⅴ９'},
        {value: 510, label: '処遇改善加算Ⅴ１０'},
        {value: 511, label: '処遇改善加算Ⅴ１１'},
        {value: 512, label: '処遇改善加算Ⅴ１２'},
        {value: 513, label: '処遇改善加算Ⅴ１３'},
        {value: 514, label: '処遇改善加算Ⅴ１４'},
      ];
      const syoguu5Hohou = [
        {value: 501, label: '処遇改善加算Ⅴ１'},
        {value: 502, label: '処遇改善加算Ⅴ２'},
        {value: 505, label: '処遇改善加算Ⅴ５'},
        {value: 507, label: '処遇改善加算Ⅴ７'},
        {value: 508, label: '処遇改善加算Ⅴ８'},
        {value: 510, label: '処遇改善加算Ⅴ１０'},
        {value: 511, label: '処遇改善加算Ⅴ１１'},
        {value: 513, label: '処遇改善加算Ⅴ１３'},
        {value: 514, label: '処遇改善加算Ⅴ１４'},
      ];
      const syoguu20251001 = [
        '福祉・介護職員処遇改善加算Ⅰ',
        '福祉・介護職員処遇改善加算Ⅱ',
        '福祉・介護職員処遇改善加算Ⅲ',
      ];
      const syoguuBefore = [
        ...syoguu20251001,
        '福祉・介護職員処遇改善加算Ⅳ','福祉・介護職員処遇改善加算Ⅴ',
      ];
      if (service === HOHOU) {
        if (stdDate <= '2024-05-01') return syoguu20251001;
        else if (stdDate >= '2024-06-01' && stdDate <= '2025-03-01') return [...syoguuStdHohou, ...syoguu5Hohou];
        else return syoguuStdHohou;
      }
      else if (stdDate >= LC202406) {
        if (stdDate <= '2025-03-01') {
          if (service !== HOHOU) return [...syoguuStd, ...syoguu5];
          else return [...syoguuStdHohou, ...syoguu5Hohou];
        }
        else return syoguuStd;
      }
      else if (stdDate >= '2022-10-01') return syoguu20251001;
      else return [syoguu20251001, ...syoguuBefore];
    }

    default:
      return [{ value: 1, label: "選択" }];
  }
}
