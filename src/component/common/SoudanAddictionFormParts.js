// 相談支援用加算項目フォームパーツ
// dlayerパラメータで次のことを行う
// フォームの初期値をステイトから取得
// 上位レイヤで値が設定されている場合は表示をdisableにする
// 上位レイヤで非表示に設定されている場合は表示を行わない
// sizeは表示の大きさなどを指定する
// 今のところ、large、middleのみ。追加でsmall など。
// uidとdidをpropsで受け取る。場合によっては未指定のこともある

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import * as mui from '../common/materialUi';
import * as comMod from '../../commonModule';

import {
  useStyles,
  // sw,
  selectStyle,
  // ChkBoxGp,
  SelectGp, 
} 
from './FormPartsCommon'
import { TextGP } from './FormPartsCommon';
import { faSleigh } from '@fortawesome/free-solid-svg-icons';
import { purple, red } from '@material-ui/core/colors';
import { HOHOU, HOUDAY, JIHATSU, KEIKAKU_SOUDAN, SYOUGAI_SOUDAN } from '../../modules/contants';
import { handleSelectInputAuto, isService } from '../../albCommonModule';
import { useGetDef } from './AddictionFormParts';
import { DiscriptionTitle, KasanSelectorGP, getDispControle, StatusIcon, } from './AddictionFormPartsCommon';
import { LC2024 } from '../../modules/contants';


// 相談支援体制
// 計画相談・障害児相談用コンポーネント
export const SoudanShienTaisei = (props) => {
  const classes = useStyles();
  const nameJp = '相談支援体制';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const service = useSelector(state=>state.service); // ステート上のサービス
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  const svcs = ['計画相談支援', '障害児相談支援'];
  if (!svcs.includes(service)) return null;

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        計画相談支援と障害児相談支援にはサービス利用支援と継続サービス利用支援があり
        それぞれに
        強化型支援Ⅰ、強化型支援Ⅱ、強化型支援Ⅲ、強化型支援Ⅳ、支援Ⅰ、支援Ⅱ
        があります。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    '強化型支援Ⅰ','強化型支援Ⅱ','強化型支援Ⅲ','強化型支援Ⅳ','支援Ⅰ','支援Ⅱ',
  ];

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShokujiTeikyou " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}
        />

        <Discription />
        <mui.NoticeDialog
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


// 主任相談支援専門員配置加算
// 計画相談・障害児相談用コンポーネント
export const SyuninHaichi = (props) => {
  const classes = useStyles();
  const nameJp = '主任相談支援専門員配置加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const service = useSelector(state=>state.service); // ステート上のサービス
  const stdDate = useSelector(state=>state.stdDate); // ステート上のサービス
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  const svcs = ['計画相談支援', '障害児相談支援'];
  if (!svcs.includes(service)) return null;

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        相談支援従事者主任研修を修了した常勤かつ専従の主任相談支援専門員を事業所に配置した場合などに算定できる加算です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  // const opts = [{ value: 1, label: "選択" }];
  const opts = (() => {
    if (stdDate < LC2024){
      return ([{ value: 1, label: "選択" }])
    }
    else {
      return ([
        { value: 1, label: "Ⅰ" },
        { value: 2, label: "Ⅱ" }
      ])
    }
  })();
  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShokujiTeikyou " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}
        />

        <Discription />
        <mui.NoticeDialog
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

// 主任相談支援専門員配置加算
// ピアサポート体制加算
export const PeerSupport = (props) => {
  const classes = useStyles();
  const nameJp = 'ピアサポート体制加算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const service = useSelector(state=>state.service); // ステート上のサービス
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  const svcs = ['計画相談支援', '障害児相談支援'];
  if (!svcs.includes(service)) return null;

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        ピアサポート体制加算は、一部の障害福祉サービス事業所で働くピアサポーターが所定の条件を満たす場合に、算定できます。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [{ value: 1, label: "選択" }];

  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShokujiTeikyou " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}
        />

        <Discription />
        <mui.NoticeDialog
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

// 計画相談支援のみ
// 介護保険重複減算
export const ChouhukuGensan = (props) => {
  const classes = useStyles();
  const nameJp = '介護保険重複減算';
  const preDef = useGetDef(nameJp, props.uid, props.did, props.dLayer - 1, props.schedule);
  const def = useGetDef(nameJp, props.uid, props.did, props.dLayer, props.schedule);
  const [disabled, notDisp] = getDispControle(preDef);
  const [val, setval] = useState((disabled) ? preDef : def);
  const noOpt = (props.noOpt) ? "noOpt " : "";
  const service = useSelector(state=>state.service); // ステート上のサービス
  const handleChange = (e) => {
    setval(e.currentTarget.value)
  }
  const [noticeopen, setnoticeopen] = useState(false);
  const discriptionClick = (e) => {
    setnoticeopen(true);
  }
  const svcs = ['計画相談支援', ];
  if (!svcs.includes(service)) return null;

  const Discription = () => (
    <span className='discription' onClick={discriptionClick}>
      <DiscriptionTitle nameJp={nameJp} />
      <span className="main">
        相談支援専門員が、計画相談支援の対象障がい者等であって、介護保険法規定する要介護状態・要支援状態のときに適用される減算です。
      </span>
      <span className='more'>
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
        もっと詳しい説明。もっと詳しい説明。もっと詳しい説明。
      </span>
    </span>
  )
  const opts = [
    '居宅減算Ⅰ','居宅減算Ⅱ','予防減算',
  ];
  const targetService = [KEIKAKU_SOUDAN];
  if (!targetService.includes(service)) return null;


  if (notDisp) return (null);
  else return (
    <>
      <div className={"aFormPartsWrapper ShokujiTeikyou " + noOpt + props.size}>
        <StatusIcon val={val} size={props.size} />
        <SelectGp
          onChange={e => handleChange(e)}
          value={val}
          nameJp={nameJp}
          size={props.size}
          opts={(props.noOpt) ? [] : opts}
          disabled={disabled}
          dispHide={props.dispHide}
        />

        <Discription />
        <mui.NoticeDialog
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

// 入院時情報連携加算
export const NyuuinRenkei = (props) => {
  // nameJp, 
  // svcs, // 配列で指定。このコンポーネントを表示するサービス名を指定する
  // discriptionText, // 加算項目の説明文
  // opts, // セレクトのオプション。配列で。
  const nameJp = '入院時情報連携加算';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `障がい者（児）が入院する際に、病院等の職員に対して、心身の状況や生活環境等の必要な情報を提供した場合に算定できる加算です。`;
  const opts = ['入院時情報連携加算Ⅰ', '入院時情報連携加算Ⅱ'];
  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (
    <KasanSelectorGP {...newProps}/>
  )
}
// 要医療児者支援体制加算
export const YouIryouShien = (props) => {
  // nameJp, 
  // svcs, // 配列で指定。このコンポーネントを表示するサービス名を指定する
  // discriptionText, // 加算項目の説明文
  // opts, // セレクトのオプション。配列で。
  const nameJp = '要医療児者支援体制加算';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `相談支援専門員のうち、地域生活支援事業として行われる研修又はこれに準ずる者として都道府県知事が認める研修の課程を終了し、当該研修の事業を行ったものから当該研修の課程を終了した旨の証明書を受けた者を1名以上配置することにより算定できる加算です。また上記に規定する者を配置している旨を公表することも必要になります。
  `;
  const opts = [{ value: 1, label: "選択" }];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (
    <KasanSelectorGP {...newProps}/>
  )
}
// 精神障害者支援体制加算
export const SeishinShien = (props) => {
  // nameJp, 
  // svcs, // 配列で指定。このコンポーネントを表示するサービス名を指定する
  // discriptionText, // 加算項目の説明文
  // opts, // セレクトのオプション。配列で。
  const nameJp = '精神障害者支援体制加算';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `精神障害者の障害特性や支援技法に関する研修を終了している相談支援専門員を1名以上配置していることにより算定できる加算です。また上記の相談支援専門員を配置していることを公表していることも必要になります。
  `;
  const opts = [{ value: 1, label: "選択" }];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}
// 地域生活支援拠点等相談強化加算
export const ChiikiKyoten = (props) => {
  // nameJp, 
  // svcs, // 配列で指定。このコンポーネントを表示するサービス名を指定する
  // discriptionText, // 加算項目の説明文
  // opts, // セレクトのオプション。配列で。
  const nameJp = '地域生活支援拠点等相談強化加算';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `地域生活支援拠点等相談強化加算は、市町村が地域生活支援拠点等に位置付けた事業所が対象です。この加算は、障害の特性に起因して生じた緊急の事態やその他の緊急に支援が必要な事態が生じた障害児に対して、相談支援事業所が相談援助を行った場合に算定されます。`;
  const opts = [
    { value: 1, label: "1回" },
    { value: 2, label: "2回" },
    { value: 3, label: "3回" },
    { value: 4, label: "4回" },
  ];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}
// 集中支援加算（訪問）
export const SyuuTyuuShienHoumon = (props) => {
  // nameJp, 
  // svcs, // 配列で指定。このコンポーネントを表示するサービス名を指定する
  // discriptionText, // 加算項目の説明文
  // opts, // セレクトのオプション。配列で。
  const nameJp = '集中支援加算（訪問）';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `利用者等の求めに応じ、利用者の居宅等（障害児の場合は居宅に限る。）を訪問し、利用者及び家族との面接を月に２回以上実施した場合に算定できる加算です。`;
  const opts = [{ value: 1, label: "選択" }];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}

// 集中支援加算（会議開催）
export const SyuuTyuuShienKaisai = (props) => {
  // nameJp, 
  // svcs, // 配列で指定。このコンポーネントを表示するサービス名を指定する
  // discriptionText, // 加算項目の説明文
  // opts, // セレクトのオプション。配列で。
  const nameJp = '集中支援加算（会議開催）';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `利用者本人及び障害福祉サービス事業者等が参加するサービス担当者会 議を開催した場合に算定できる加算です。`;
  const opts = [{ value: 1, label: "選択" }];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}

// 集中支援加算（会議参加）
export const SyuuTyuuShienSanka = (props) => {
  // nameJp, 
  // svcs, // 配列で指定。このコンポーネントを表示するサービス名を指定する
  // discriptionText, // 加算項目の説明文
  // opts, // セレクトのオプション。配列で。
  const nameJp = '集中支援加算（会議参加）';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `障害福祉サービスの利用に関連して、病院、企業、保育所、特別支援学校又は地方自治体等からの求めに応じ、当該機関の主催する会議へ参加した場合に算定できる加算です。`;
  const opts = [{ value: 1, label: "選択" }];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}

// サービス利用支援
export const ServiceRiyouShien = (props) => {
  // nameJp, 
  // svcs, // 配列で指定。このコンポーネントを表示するサービス名を指定する
  // discriptionText, // 加算項目の説明文
  // opts, // セレクトのオプション。配列で。
  const nameJp = 'サービス利用支援';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `障がい福祉サービスの申請・変更申請に係る障がい者もしくは障がい児の保護者または地域相談支援の申請に係る障がい者の心身の状況、その置かれている環境、サービスの利用に関する意向その他の事情を勘案し、利用する障がい福祉サービスまたは地域相談支援の種類及び内容等を記載した「サービス等利用計画案」を作成します。`;
  const opts = [{ value: 1, label: "選択" },{ value: 2, label: "超過減算" },];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}

// 継続サービス利用支援
export const KeizokuServiceShien = (props) => {
  const nameJp = '継続サービス利用支援';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `支給決定または地域相談支援給付決定の有効期間内において、当該者に係るサービス等利用計画が適切であるかどうかにつき、モニタリング期間ごとに、障がい福祉サービスまたは地域相談支援の利用状況を検証し、その結果及び心身の状況、その置かれている環境、サービスの利用に関する意向その他の事情を勘案し、「サービス等利用計画」の見直しを行います。`;
  const opts = [{ value: 1, label: "選択" },{ value: 2, label: "超過減算" },];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}

// 居宅介護支援事業所等連携加算（訪問、会議参加）
export const KyotakuRenkei = (props) => {
  const nameJp = '居宅介護支援事業所等連携加算（訪問、会議参加）';
  const svcs = ['計画相談支援', ];
  const discriptionText = `計画相談支援事業所が居宅支援事業所等への情報提供や会議へ参加し、事業所の支援内容の検討に協力した場合などに算定できる加算です。`;
  const opts = [
    { value: 1, label: "1回" },
    { value: 2, label: "2回" },
  ];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}

// 居宅介護支援事業所等連携加算（情報提供）
export const KyotakuRenkeiJouhou = (props) => {
  const nameJp = '居宅介護支援事業所等連携加算（情報提供）';
  const svcs = ['計画相談支援', ];
  const discriptionText = `計画相談支援事業所が居宅支援事業所等への情報提供や会議へ参加し、事業所の支援内容の検討に協力した場合などに算定できる加算です。`;
  const opts = [{ value: 1, label: "選択" }];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}

// 保育教育等移行支援加算（訪問・会議参加）
export const IkouShienSoudan = (props) => {
  const nameJp = '保育教育等移行支援加算（訪問・会議参加）';
  const svcs = [SYOUGAI_SOUDAN, ];
  const discriptionText = `保育・教育等移行支援加算とは、地域において保育、教育等を受けられるよう支援を行ったことにより、算定できる加算です。基本報酬算定月は算定出来ません。`;
  const opts = [
    { value: 1, label: "1回" },
    { value: 2, label: "2回" },
  ];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}

// 保育教育等移行支援加算（情報提供）
export const IkouShienSoudanJouhou = (props) => {
  const nameJp = '保育教育等移行支援加算（情報提供）';
  const svcs = [SYOUGAI_SOUDAN, ];
  const discriptionText = `保育・教育等移行支援加算とは、地域において保育、教育等を受けられるよう支援を行ったことにより、算定できる加算です。基本報酬算定月は算定出来ません。`;
  const opts = [{ value: 1, label: "選択" }];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}

// 機関等連携加算
export const KikanRenkei = (props) => {
  const nameJp = '機関等連携加算';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `機関等連携加算とは、福祉サービスを提供する機関の職員から情報提供を受け、障害児支援利用計画を作成している場合に算定できる加算です。`;
  const opts = [{ value: 1, label: "選択" }];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}


// 担当者会議実施加算
export const TantousyaKaigi = (props) => {
  const nameJp = '担当者会議実施加算';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `サービス担当者会議を実施し、計画の実施状況を説明するとともに、計画の変更やその他必要な便宜について検討を行った場合に算定できる加算です。`;
  const opts = [{ value: 1, label: "選択" }];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}

// モニタリング加算
export const Monitoring = (props) => {
  const nameJp = 'モニタリング加算';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `障害児支援利用計画を作成した利用者のが利用する通所事業所を訪問し、提供状況を記録した場合に算定できる加算です。`;
  const opts = [{ value: 1, label: "選択" }];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}

// 行動障害支援体制加算
export const KoudaouSyougaiShien = (props) => {
  const nameJp = '行動障害支援体制加算';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `各都道府県が実施する強度行動障害支援者養成研修（実践研修）または行動援護従業者養成研修を修了した専門的な知識及び支援技術を持つ常勤の相談支援員を１名以上配置した上で、その旨を公表している場合に加算されます。`;
  // const opts = Array(10).fill(0).map((e, i)=>(
  //   { value: i + 1, label: `${i + 1}回` }
  // ))
  const opts = [{ value: 1, label: "選択" }];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}


// 行動障害支援体制加算
export const ChiikiKyoudou = (props) => {
  const nameJp = '地域体制強化共同支援加算';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `相談支援利用者が受けるサービスの事業者のうち3者以上と共同して文書等により保護者にたいして説明や内容の報告をした場合に算定できる加算です。`;
  const opts = [{ value: 1, label: "選択" }];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}

// 退院退所加算
export const TaiinTaisyo = (props) => {
  const nameJp = '退院退所加算';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `退院・退所時に、医療機関等の多職種からの情報収集や、医療機関等における退院・退所時のカンファレンスへの参加を行ったうえで、障害児支援利用計画を作成した場合に、算定できる換算です。`;
  const opts = [
    { value: 1, label: "1回" },
    { value: 2, label: "2回" },
    { value: 3, label: "3回" },
  ];

  const newProps = {...props, nameJp, svcs, discriptionText, opts};
  return (<KasanSelectorGP {...newProps}/>)
}

// モニタリング日
export const MonitorDate = (props) => {
  const stdDate = useSelector(s=>s.stdDate);
  const nameJp = 'モニタリング日';
  const svcs = ['計画相談支援', '障害児相談支援'];
  const discriptionText = `
    モニタリング日の指定を行います。利用支援を算定する場合は計画書作成日を指定します。継続支援の場合はモニタリング日を指定します。利用支援と継続支援を同月で行った場合もモニタリング日を入力して下さい。
  `;
  const lastDate = ((dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth();

    // 次の月の初日を取得し、1日引く
    const lastDay = new Date(year, month + 1, 0);

    return lastDay.getDate();
  })(stdDate);
  const opts = Array(lastDate).fill(0).map((e, i)=>(
    { value: i + 1, label: `${i + 1}日` }
  ))
  const newProps = {...props, nameJp, svcs, discriptionText, opts, hidenull: true};
  return (<KasanSelectorGP {...newProps}/>)
}
  
// 超汎用コンポーネント
export const UnivAddictionSoudan = (props) => {
  const {
    nameJp, label, 
    optPtn = 'normal',
    start = LC2024,
    end = '2027-03-01',
    svcs = [KEIKAKU_SOUDAN, SYOUGAI_SOUDAN],
    labelOutside = true,
    noLabel = true,
  } = props;
  const allState = useSelector(s=>s);
  const {stdDate, service} = allState;
  const romanOpts = [
    {value: 1, label: 'Ⅰ'},{value: 2, label: 'Ⅱ'},{value: 3, label: 'Ⅲ'},
    {value: 4, label: 'Ⅳ'},{value: 5, label: 'Ⅴ'},{value: 6, label: 'Ⅵ'},
    {value: 7, label: 'Ⅶ'},{value: 8, label: 'Ⅷ'},{value: 9, label: 'Ⅸ'},
    {value: 10, label: 'Ⅹ'},
  ]
  const opts = [];
  if (optPtn === 'normal'){
    opts.push({value: 1, label: '選択'})
  }
  else if (optPtn === 'normalWithGensan'){
    opts.push({value: 1, label: '選択'},{value: 2, label: '超過減算'})
  }
  else if (typeof optPtn === 'string' && optPtn.match(/^num\d+/)){
    const n = parseInt(optPtn.replace('num', ''));
    Array(n).fill(0).forEach((e, i)=>{
      opts.push({value: i + 1, label: `${i + 1}回`})
    })
  }
  else if (typeof optPtn === 'string' && optPtn.match(/^roman\d+/)){
    const n = parseInt(optPtn.replace('roman', ''));
    opts.push(...romanOpts.slice(0, n));
  }
  else if (Array.isArray(optPtn)) opts.push(...optPtn)
  if (stdDate < start) return null;
  if (stdDate > end) return null;
  if (!svcs.includes(service)) return null;
  const newProps = {
    ...props, nameJp, label, svcs, opts, noLabel,
    labelOutside,
  };
  return (<KasanSelectorGP {...newProps}/>)

}