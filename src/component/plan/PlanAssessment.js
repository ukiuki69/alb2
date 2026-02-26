import React, {useEffect, useState, useRef, useImperativeHandle, useMemo} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, makeStyles, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, FormLabel, RadioGroup, Radio, FormControlLabel } from '@material-ui/core';
import { convUID, getLodingStatus, getUisCookie, getUser, uisCookiePos } from '../../commonModule';
import { blue, red, teal, grey, yellow, orange, purple, indigo, green } from '@material-ui/core/colors';
import DeleteIcon from '@material-ui/icons/Delete';
import CreateIcon from '@material-ui/icons/Create';
import { Autocomplete } from '@material-ui/lab';
import { SideSectionUserSelect } from '../schedule/SchByUser2';
import { DateInput, NumInputGP } from '../common/StdFormParts';
import { AlbHTimeInput } from '../common/HashimotoComponents';
import { LinksTab, LoadErr, LoadingSpinner, StdErrorDisplay, GoBackButton } from '../common/commonParts';
import { HOHOU } from '../../modules/contants';
import { setRecentUser, univApiCall, getFilteredUsers } from '../../albCommonModule';
import { AddCircleOutline, AddIcCallOutlined, ArrowDropUp, ArrowDropDown, SwapVert, Close } from '@material-ui/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { combineReducers } from 'redux';
import DateRangeIcon from '@material-ui/icons/DateRange';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import SchoolIcon from '@material-ui/icons/School';
import { planMenu } from './planCommonPart';
import { PlanRelatedItemsPanel } from './PlanRelatedItemsPanel';
import { saveCreatedDateToLS } from './utility/planLSUtils';
import { planlsUid, PLAN_ADD_MODE_KEY, PLAN_ADD_MODE_ITEM } from './planConstants';
import { PlanPrintButton, UserInfoDisplay, PlanDateChangeCopy, isPlanAddMode, resetPlanAddMode, FieldRender, deepEqual } from './planCommonPart';
import { llmApiCall } from '../../modules/llmApiCall';
import { getLS, setLS } from '../../modules/localStrageOprations';
import { cleanSpecialCharacters } from '../../modules/cleanSpecialCharacters';
import { processDeepLfToBr, processDeepBrToLf } from '../../modules/newlineConv';
import SnackMsgSingle from '../common/SnackMsgSingle';


const useStyles = makeStyles({
  planFormRoot: {
    width: 800,
    marginLeft: 'calc((100% - 800px) / 2)',
    '& .fpRow': { display: 'flex', padding: 8, flexWrap: 'wrap' },
    '& .fpRow.multi': {
      '& > div': { marginRight: 8 },
    },
    '& .btnWrap': {
      textAlign: 'right',
      position: 'fixed',
      bottom: 16,
      right: 24,
      '& .MuiButtonBase-root': { marginInlineStart: 8 },
    },
    '& .title': {
      textAlign: 'center',
      marginTop: -16,
      marginBottom: 8,
      position: 'sticky',
      top: 80,
      zIndex: 100,
      paddingTop: 32,
      backgroundColor: '#fff',
      '& .main': {
        fontSize: '1.1rem',
        padding: 8,
        marginBottom: 8,
        color: teal[800],
        backgroundColor: teal[50],
        borderBottom: `1px solid ${teal[200]}`,
      },
      '& .user': { fontSize: '.9rem' },
      '& .user .name': { fontSize: '1.2rem', marginInlineEnd: 8 },
      '& .user .attr': { marginInlineStart: 16 , fontSize: '.9rem'},
    },
  },
  // related panel styles moved to shared component
  user: {
    display: 'flex',
    alignItems: 'center',
  },
  userLeft: {
    width: 240,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    '& .name': { fontSize: '1.2rem', padding: 4},
    '& .attr': { fontSize: '.9rem', padding: 4},
  },
  userRight: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.4s',
    '&:hover': {
      '& .icon': { color: teal[800] },
      '& .icon .size': { fontSize: 40 },
    },
    '& .postal': { fontSize: '.9rem', padding: 4 },
    '& .address': { fontSize: '.9rem', padding: 4 },
    '& .icon': {
      color: grey[400],
      opacity: 0.8,
      position: 'absolute',
      right: 8,
      top: '50%',
      transform: 'translateY(-50%)',
      transition: '0.4s',
      '& .size': { 
        fontSize: 20,
        transition: 'font-size 0.8s',
      },
    },
  },
  deleteConfirmTrue: {
    backgroundColor: red[800],
    color: "#fff",
    '&:hover': { backgroundColor: red[900] },
  },
});

// 入力項目の定数定義（設定情報）
export const inputDefinitions = [
  // { label: '実施回数', type: 'NumInputGP', required: true, defaultValue: 0 },
  { label: 'アセスメント実施者', type: 'freesolo', required: true, souce: [], 
    style: { width: 160, marginTop: 8 }, longLabel: '面談実施者' },
  { label: 'アセスメント実施日', type: 'DateInput', required: true, 
    style: { width: 160 }, longLabel: '面談実施日' },
  { label: '開始時間', type: 'AlbHTimeInput' },
  { label: '終了時間', type: 'AlbHTimeInput' },
  { label: '相談支援事業所', type: 'freesolo', souce: [], style: { width: 240 } },
  { label: '性別', type: 'select', souce: ['男性', '女性', 'その他'], 
    style: { width: 120 }, longLabel: '本人性別' },
  { label: '保護者続柄', type: 'freesolo', souce: ['父', '母', '祖母', '祖父'], 
    style: { width: 120 } },
  { label: '実施対象者', type: 'text', style: { width: 240 }, 
    longLabel: '保護者以外が対象者の場合' },
  { label: '対象者続柄', type: 'freesolo', souce: ['父', '母', '祖母', '祖父'], 
    style: { width: 120 } },
  { label: '家族構成', type: 'text', style: { width: '80%' } },
  { label: 'アレルギー', type: 'text', style: { width: '100%' } },
  { label: '症状', type: 'text', style: { width: '100%' }, multiline: true, 
    placeholder: 'ASP / ADHD / ASPなど' },
  { label: '得意', type: 'text', style: { width: '100%' }, 
    longLabel: '得意なこと・好きなこと', multiline: true },
  { label: '注意事項', type: 'text', style: { width: '100%' }, 
    longLabel: '気をつけてほしいこと', multiline: true },
  { label: '本人意向', type: 'text', style: { width: '100%' }, multiline: true },
  { label: '家族意向', type: 'text', style: { width: '100%' }, multiline: true },
  { label: '病院名', type: 'text', style: { width: '31%' } },
  { label: '医師名', type: 'text', style: { width: '31%' } },
  { label: '病院連絡先', type: 'text', style: { width: '31%' } },
  { 
    label: '生活歴', 
    type: 'group', 
    fields: [
      { label: '項目', type: 'text', style: { width: '30%' } },
      { label: '内容', type: 'text', style: { width: '70%' }, longLabel: '支援内容・留意事項', multiline: true},
    ]
  },
  
  /* --------------- 健康・生活 --------------- */
  { 
    group: '健康・生活', label: '睡眠は毎日安定していますか？', 
    type: 'radio', required: false, value: '', 
    options: ['安定している', 'やや不規則', '不規則', '非常に不規則'], targetAge: '' 
  },
  { 
    group: '健康・生活', label: '食事は自分で適切にとれますか？', 
    type: 'radio', required: false, value: '', 
    options: ['自立している', '一部介助が必要', '介助が必要', '全面的に介助'], targetAge: '' 
  },
  { 
    group: '健康・生活', label: '排泄は一人でできますか？', 
    type: 'radio', required: false, value: '', 
    options: ['完全に自立', '見守りが必要', '失敗が多い', '自立していない'], targetAge: '' 
  },
  { 
    group: '健康・生活', label: 'アレルギーや服薬など、健康上の特別な配慮は必要ですか？', 
    type: 'radio', required: false, value: '', 
    options: ['はい', 'いいえ'], targetAge: '' 
  },
  { 
    group: '健康・生活', label: '昼寝が必要ですか？', 
    type: 'radio', required: false, value: '', 
    options: ['必要', '時々必要', '不要'], targetAge: '未就学児' 
  },
  { 
    group: '健康・生活', label: '着替え・洗面・歯磨きなどの生活習慣は身についていますか？',   
    type: 'radio', required: false, value: '', options: ['ほぼ自立', '一部見守り', '多くの介助が必要'], 
    targetAge: '未就学児' 
  },
  { 
    group: '健康・生活', label: '学校への持ち物を自分で準備できますか？', 
    type: 'radio', required: false, 
    value: '', options: ['毎回できる', '時々忘れる', 'ほとんどできない'], targetAge: '小学生' 
  },
  { 
    group: '健康・生活', label: '体調不良を言葉で伝えられますか？', 
    type: 'radio', required: false, value: '', 
    options: ['自分から伝えられる', '促せば伝えられる', '難しい'], targetAge: '小学生' 
  },
  { 
    group: '健康・生活', label: '通学・外出の身支度は自立していますか？', 
    type: 'radio', required: false, 
    value: '', options: ['完全自立', '一部支援', '支援が必要'], targetAge: '中学生以上' 
  },
  { 
    group: '健康・生活', label: '月経・服薬・体調管理を自分で行えますか？', 
    type: 'radio', required: false, value: '', 
    options: ['自立', '見守り', '介助', '非該当'], targetAge: '中学生以上' 
  },
  { 
    group: '運動・感覚', label: '走る・跳ぶなどの動きは年齢相応にできますか？', 
    type: 'radio', required: false, value: '', options: ['十分できる', 'やや不器用', '不器用', '著しく困難'], 
    targetAge: '' 
  },
  { 
    group: '運動・感覚', label: '大きな音・光などに敏感ですか？', 
    type: 'radio', required: false, value: '', 
    options: ['非常に敏感', '少し敏感', '気にならない'], targetAge: '' 
  },
  { 
    group: '運動・感覚', label: '強い刺激を求めることがありますか？', 
    type: 'radio', required: false, 
    value: '', options: ['よくある', '時々ある', 'ほとんどない'], targetAge: '' 
  },
  { 
    group: '運動・感覚', label: 'ハサミやクレヨンなど運筆動作はどうですか？', 
    type: 'radio', required: false, value: '', 
    options: ['年齢相応', 'やや不器用', 'とても苦手'], targetAge: '未就学児' 
  },
  { 
    group: '運動・感覚', label: '箸・鉛筆の持ち方や筆圧は適切ですか？', 
    type: 'radio', required: false, 
    value: '', options: ['適切', 'やや不適切', '不適切'], targetAge: '小学生' 
  },
  { 
    group: '運動・感覚', label: '体育や遊びでのボール操作はどうですか？', 
    type: 'radio', required: false, value: '', 
    options: ['得意', '普通', '苦手'], targetAge: '小学生' 
  },
  { 
    group: '運動・感覚', label: '文字を書く際の筆圧や文字の整然性はどうですか？', 
    type: 'radio', required: false, 
    value: '', options: ['適切', 'やや不適切', '不適切'], targetAge: '中学生以上' 
  },
  { 
    group: '運動・感覚', label: '細かい作業（裁縫、工作、実験器具操作など）はどうですか？', 
    type: 'radio', required: false, 
    value: '', options: ['問題ない', '時々困難', 'とても困難'], targetAge: '中学生以上' 
  },
  { 
    group: '運動・感覚', label: 'スポーツでの協調運動はどうですか？', 
    type: 'radio', required: false, 
    value: '', options: ['問題ない', '時々苦手', '苦手'], targetAge: '中学生以上' 
  },
  { 
    group: '運動・感覚', label: '長時間のスマホ／PC使用で問題が出ますか？', 
    type: 'radio', required: false, value: '', 
    options: ['出ない', 'ときどき出る', 'よく出る'], targetAge: '中学生以上' 
  },
  { 
    group: '認知・行動', label: '好きな活動に集中できますか？', 
    type: 'radio', required: false, value: '', 
    options: ['15分以上', '5〜15分', 'すぐ切れる'], targetAge: '' 
  },
  { 
    group: '認知・行動', label: '急な予定変更に柔軟に対応できますか？', 
    type: 'radio', required: false, 
    value: '', options: ['問題ない', 'やや戸惑う', 'とても苦手'], targetAge: '' 
  },
  { 
    group: '認知・行動', label: '怒りや不安を切り替えられますか？', 
    type: 'radio', required: false, 
    value: '', options: ['自分で調整', '支援が必要', 'ほとんどできない'], targetAge: '' 
  },
  { 
    group: '認知・行動', label: 'ごっこ遊びなど想像遊びをしますか？', 
    type: 'radio', required: false, 
    value: '', options: ['よくする', '時々する', 'ほとんどしない'], targetAge: '未就学児' 
  },
  { 
    group: '認知・行動', label: '色・形・数などの概念理解はどうですか？', 
    type: 'radio', required: false, 
    value: '', options: ['年齢以上', '相応', '遅れ'], targetAge: '未就学児' 
  },
  { 
    group: '認知・行動', label: '教室で座っていられる時間は？', 
    type: 'radio', required: false, value: '', 
    options: ['授業中ずっと', '時々立ち歩く', 'ほとんど立ち歩く'], targetAge: '小学生' 
  },
  { 
    group: '認知・行動', label: '宿題や課題を期限までに提出できますか？', 
    type: 'radio', required: false, 
    value: '', options: ['できる', '時々遅れる', 'ほとんどできない'], targetAge: '小学生' 
  },
  { 
    group: '認知・行動', label: '読み書き・計算に困難がありますか？', 
    type: 'radio', required: false, 
    value: '', options: ['明らかにある', '少しある', 'ない'], targetAge: '小学生' 
  },
  { 
    group: '認知・行動', label: '課題やテスト勉強を計画的に進められますか？', 
    type: 'radio', required: false, value: '', 
    options: ['自立', '一部支援', '支援が必要'], targetAge: '中学生以上' 
  },
  { 
    group: '認知・行動', label: 'スマホやゲームの利用時間を自己管理できますか？', 
    type: 'radio', required: false, value: '', 
    options: ['できる', '時々難しい', 'ほとんどできない'], targetAge: '中学生以上' 
  },
  { 
    group: '認知・行動', label: '将来や進路について考える意欲はありますか？', 
    type: 'radio', required: false, value: '', 
    options: ['高い', '普通', '低い'], targetAge: '中学生以上' 
  },
  { 
    group: '言語・コミュニケーション', label: '話しかけられた内容を理解できますか？', 
    type: 'radio', required: false, value: '', 
    options: ['問題なく理解', '一部困難', 'ほとんど理解できない'], targetAge: '' 
  },
  { 
    group: '言語・コミュニケーション', label: '自分の思いを言葉で表現できますか？', 
    type: 'radio', required: false, value: '', 
    options: ['十分できる', '限られた語彙', 'ほとんどできない'], targetAge: '' 
  },
  { 
    group: '言語・コミュニケーション', label: '会話のやりとりが成立しますか？', 
    type: 'radio', required: false, value: '', 
    options: ['成立する', '成立しにくい', '成立しない'], targetAge: '' 
  },
  { 
    group: '言語・コミュニケーション', label: '指差し・身振りなど非言語コミュニケーションは使えますか？', 
    type: 'radio', required: false, value: '', 
    options: ['十分使う', '一部使う', 'ほとんど使わない'], targetAge: '未就学児' 
  },
  { 
    group: '言語・コミュニケーション', label: '授業中の発表や音読はスムーズですか？', 
    type: 'radio', required: false, value: '', 
    options: ['スムーズ', 'やや苦手', '苦手'], targetAge: '小学生' 
  },
  { 
    group: '言語・コミュニケーション', label: '冗談や比喩を理解できますか？', 
    type: 'radio', required: false, value: '', 
    options: ['理解する', '一部理解', 'ほとんど理解しない'], targetAge: '小学生' 
  },
  { 
    group: '言語・コミュニケーション', label: 'LINE等のSNSで適切にやりとりできますか？', 
    type: 'radio', required: false, value: '', 
    options: ['適切', '時々誤解', '誤解が多い', 'ほとんどできない', '使っていない'], targetAge: '中学生以上' 
  },
  { 
    group: '言語・コミュニケーション', label: '相手の立場や空気を読んで話題を変えられますか？', 
    type: 'radio', required: false, value: '', 
    options: ['できる', '時々難しい', '難しい'], targetAge: '中学生以上' 
  },
  { 
    group: '人間関係・社会性', label: '他児への興味はありますか？', 
    type: 'radio', required: false, value: '', 
    options: ['積極的', '時々', 'あまりない', 'ない'], targetAge: '' 
  },
  { 
    group: '人間関係・社会性', label: '順番待ちや物の貸し借りができますか？', 
    type: 'radio', required: false, 
    value: '', options: ['できる', '時々難しい', 'ほとんどできない'], targetAge: '' 
  },
  { 
    group: '人間関係・社会性', label: '困ったときに助けを求めることができますか？', 
    type: 'radio', required: false, value: '', 
    options: ['自分から', '促せば', 'できない'], targetAge: '' 
  },
  { 
    group: '人間関係・社会性', label: 'あいさつや「ありがとう」が言えますか？', 
    type: 'radio', required: false, 
    value: '', options: ['自発的', '促せば', 'できない'], targetAge: '未就学児' 
  },
  { 
    group: '人間関係・社会性', label: '他児とのトラブルはありますか？', 
    type: 'radio', required: false, 
    value: '', options: ['よくある', '時々ある', 'ほとんどない'], targetAge: '未就学児' 
  },
  { 
    group: '人間関係・社会性', label: 'ルールのある遊びや班活動に参加できますか？', 
    type: 'radio', required: false, value: '', 
    options: ['問題なく参加', '促せば参加', '参加が難しい'], targetAge: '小学生' 
  },
  { 
    group: '人間関係・社会性', label: 'いじめやからかいにどう対応しますか？', 
    type: 'radio', required: false, 
    value: '', options: ['自分で対処', '支援が必要', '対処できない'], targetAge: '小学生' 
  },
  { 
    group: '人間関係・社会性', label: 'クラブ活動や委員会で協力的に行動できますか？', 
    type: 'radio', required: false, value: '', options: ['積極的', '普通', '消極的'], targetAge: '中学生以上' 
  },
  { 
    group: '人間関係・社会性', label: '対人トラブル時に話し合いで解決を図れますか？', 
    type: 'radio', required: false, value: '', 
    options: ['できる', '時々難しい', 'できない'], targetAge: '中学生以上' 
  },
  
  /* --------------- 保育所等訪問支援用 --------------- */
  // ＝＝ 訪問先情報 ＝＝
  { 
    group: '保育所等訪問支援用', label: '訪問先種別', type: 'checkboxes',
    style: { width: '100%' },
    souce: ['保育園','幼稚園','認定こども園','小学校','中学校','高等学校','特別支援学校']
  },
  {
    group: '保育所等訪問支援用', label: '在籍区分', type: 'checkboxes',
    style: { width: '100%' },
    souce: ['通常学級', '通級による指導', '特別支援学級', ],
  },
  // ＝＝ 対象場面（シーン） ＝＝
  { 
    group: '保育所等訪問支援用', label: '主な支援場面', type: 'checkboxes', 
    souce: ['登下校/登降園','授業','自由遊び/休み時間','給食','清掃','行事'], style: { width: '100%' },
  },
  { group: '保育所等訪問支援用', label: '時間割/日課の要点', type: 'text', style: { width: '100%' }, multiline: true, placeholder: '例：2校時国語→業間→3校時算数→給食…' },
  { group: '保育所等訪問支援用', label: '合理的配慮/環境調整案', type: 'text', style: { width: '100%' }, multiline: true, placeholder: '座席配置、掲示、視覚支援、騒音・照明配慮 等' },
  // ＝＝ 直接/間接の設計 ＝＝
  { group: '保育所等訪問支援用', label: '訪問頻度', type: 'select', souce: ['月1回','月2回','月3回','週1回','それ以上'], style: { width: 180 } },
  { group: '保育所等訪問支援用', label: '直接と間接の配分', type: 'select', souce: ['直接重視','半々','間接重視','直接のみ','間接のみ'], style: { width: 200, marginLeft: 16 } },
  
  /* --------------- 全般 --------------- */
  { 
    group: '全般',
    question: '支援を行う上で特に注意すべき点は何ですか？' , 
    label: '支援での注意事項', type: 'text', style: { width: '100%' } , multiline: true, 
  },
  { 
    group: '全般',
    question: '家族支援についてご希望はありますか？' , 
    label: '家族支援', type: 'text', style: { width: '100%' } , multiline: true, 
  },
  { 
    group: '全般',
    question: '移行支援について配慮すべきポイントは？' , 
    label: '移行支援', type: 'text', style: { width: '100%' } , multiline: true, 
  },
  { 
    group: '全般',
    question: '地域支援についてのご希望はありますか？ 連携すべき学校や介護医療機関などはありますか？' , 
    label: '地域支援', type: 'text', style: { width: '100%' } , multiline: true, 
  },
  { label: '備考', type: 'text', style: { width: '100%' } ,multiline: true},

];

// 年齢区分判定関数
const getAgeCategory = (ageStr) => {
  if (!ageStr) return '';
  if (ageStr.includes('歳')) return '未就学児';
  if (ageStr.startsWith('小')) return '小学生';
  if (ageStr.startsWith('中') || ageStr.startsWith('高')) return '中学生以上';
  return '';
};

// 生活歴の基本項目を定義（共有用）
const lifeTermBase = [
  '出生時・新生児期',
  '乳児期',
  '幼児期',
  '未就学期',
  '小学校低学年',
  '小学校中学年',
  '小学校高学年',
  '中学校',
  '高校',
];

// 生活歴の項目を取得（年齢に応じて調整）
const getLifeTermOptions = (user) => {
  if (!user?.ageStr) return lifeTermBase;
  
  const ageStr = user.ageStr;
  
  // 年齢に応じて項目を調整
  if (/^[0-2]歳児$/.test(ageStr)) {
    return lifeTermBase.slice(0, 3); // 出生時・新生児期, 乳児期, 幼児期
  } else if (/^[3-6]歳児$/.test(ageStr)) {
    return lifeTermBase.slice(0, 4); // 出生時・新生児期, 乳児期, 幼児期, 未就学期
  } else if (/^小[1-2]$/.test(ageStr)) {
    return lifeTermBase.slice(0, 5); // 小学校低学年まで
  } else if (/^小[3-4]$/.test(ageStr)) {
    return lifeTermBase.slice(0, 6); // 小学校中学年まで
  } else if (/^小[5-6]$/.test(ageStr)) {
    return lifeTermBase.slice(0, 7); // 小学校高学年まで
  } else if (/^中[1-3]$/.test(ageStr)) {
    return lifeTermBase.slice(0, 8); // 中学校まで
  } else if (/^高[1-3]$/.test(ageStr)) {
    return lifeTermBase; // 全項目
  } else if (/^1[8-9]歳$|^2[0-2]歳$/.test(ageStr)) {
    return lifeTermBase; // 全項目
  }
  
  return lifeTermBase; // デフォルト
};

// 白紙印刷時の高さ設定（px）
// 項目を増やしたい場合は、ここに入力項目の「label」名と高さを追加してください。
export const BLANK_HEIGHT_CONFIG = {
  '症状': 60,
  '得意': 60,
  '気をつけてほしいこと': 60,
  '支援を行う上で特に注意すべき点は何ですか？': 60,
  '家族支援についてご希望はありますか？': 60,
  '移行支援について配慮すべきポイントは？': 60,
  '備考': 60,
};

// 白紙登録用の値を生成する関数
const createBlankValues = (defs, user) => {
  const blankValues = {};
  
  defs.forEach(def => {
    if (def.type === 'group' && def.fields) {
      // 生活歴の場合は、年齢に応じた項目を準備
      if (def.label === '生活歴') {
        const lifeTermOptions = getLifeTermOptions(user);
        
        blankValues[def.label] = lifeTermOptions.map(term => ({
          '項目': term,
          '内容': ''
        }));
      } else {
        // その他のグループは1行分の初期オブジェクトを作成
        const groupInitial = {};
        def.fields.forEach(field => {
          groupInitial[field.label] = '';
        });
        blankValues[def.label] = [groupInitial];
      }
    } else if (def.type === 'DateInput') {
      // 日付型フィールドは現在の日付を設定
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      blankValues[def.label] = `${year}-${month}-${day}`;
    } else if (def.type === 'radio') {
      // ラジオボタンは選択肢全てを・でjoin
      if (def.options && def.options.length > 0) {
        blankValues[def.label] = def.options.join('・');
      } else {
        blankValues[def.label] = '';
      }
    } else if (def.type === 'text' || def.type === 'freesolo' || def.type === 'select') {
      // テキスト入力項目は空文字
      blankValues[def.label] = '';
    } else if (def.group && def.type === 'text') {
      // グループ付きのテキスト項目も明示的に処理
      blankValues[def.label] = '';
    } else {
      blankValues[def.label] = '';
    }
  });
  blankValues.isBlank = true;
  return blankValues;
};

// 設問フィルタ関数
const filterQuestionsByAge = (defs, ageCategory) => {
  return defs.filter(def => {
    if (!def.targetAge) return true;
    if (def.targetAge === ageCategory) return true;
    return false;
  });
};

// 初期値は文字列として設定する例
const getInitialValues = (defs = inputDefinitions) => {
  const init = {};
  defs.forEach(def => {
    if (def.type === 'group' && def.fields) {
      // グループの場合は、1行分の初期オブジェクトを作成
      const groupInitial = {};
      def.fields.forEach(field => {
        // 日付フィールドの場合は特別処理
        if (field.type === 'DateInput') {
          groupInitial[field.label] = field.defaultValue !== undefined ? String(field.defaultValue) : '';
        } else {
          groupInitial[field.label] = field.defaultValue !== undefined ? field.defaultValue : '';
        }
      });
      // 初期行として1つのオブジェクトを配列にセットする
      init[def.label] = [groupInitial];
    } else if (def.type === 'DateInput') {
      // 日付型フィールドは文字列として初期化
      init[def.label] = def.defaultValue !== undefined ? String(def.defaultValue) : '';
    } else if (def.type === 'radio') {
      // ラジオボタンは空文字で初期化
      init[def.label] = def.value !== undefined ? def.value : '';
    } else {
      init[def.label] = def.defaultValue !== undefined ? def.defaultValue : '';
    }
  });
  return init;
};

// PlanAssessmentDetail コンポーネント内で LineRender を定義する
const LineRender = React.forwardRef((props, ref) => {
  const { rowIndex, groupLabel, inputs, handleGroupChange, handleBlur, findInputByLabel, user, onRemove, sortMode, onSwapUp, onSwapDown } = props;
  
  // forceSync用のローカル状態
  const [localInputs, setLocalInputs] = useState({});
  
  // 親コンポーネントからアクセスできるメソッドを公開
  useImperativeHandle(ref, () => ({
    forceSync: () => {
      // ローカル状態を親に同期
      Object.keys(localInputs).forEach(field => {
        handleGroupChange(groupLabel, rowIndex, field, localInputs[field]);
      });
    }
  }));
  
  // 入力変更ハンドラ
  const handleLocalChange = (field, value) => {
    // 日付型の処理
    const fieldDef = findInputByLabel(field);
    let valueToStore = value;
    
    if (fieldDef?.type === 'DateInput') {
      valueToStore = typeof value === 'object' && value !== null ? (value.value || '') : value;
    }
    
    setLocalInputs(prev => ({
      ...prev,
      [field]: valueToStore
    }));
    
    // 親コンポーネントにも変更を通知
    handleGroupChange(groupLabel, rowIndex, field, valueToStore);
  };
  const lifeTermOptions = getLifeTermOptions(user);
  
  // レンダリング
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div className="生活歴-row" style={{ display: 'flex', width: '100%', alignItems: 'flex-end' }}>
        {/* 生活歴のフィールド */}
        <Autocomplete
          freeSolo
          options={lifeTermOptions}
          value={(inputs[groupLabel] && inputs[groupLabel][rowIndex] && inputs[groupLabel][rowIndex]['項目']) || ''}
          onChange={(event, newValue) => handleLocalChange('項目', newValue || '')}
          onBlur={(e) => handleBlur('項目', e.target.value)}
          style={{ width: '35%', marginRight: '8px' }}
          disabled={sortMode}
          renderInput={(params) => (
            <TextField
              {...params}
              label="時期"
              variant="standard"
              disabled={sortMode}
            />
          )}
        />
        <TextField
          label="支援内容・留意事項"
          value={(inputs[groupLabel] && inputs[groupLabel][rowIndex] && inputs[groupLabel][rowIndex]['内容']) || ''}
          onChange={(e) => handleLocalChange('内容', e.target.value)}
          onBlur={(e) => handleBlur('内容', e.target.value)}
          variant="standard"
          multiline
          style={{ width: '65%' }}
          disabled={sortMode}
        />
      </div>
      {inputs[groupLabel].length > 1 && (
        <IconButton 
          size="small" 
          onClick={() => onRemove(rowIndex, groupLabel)}
          style={{ 
            position: 'absolute', 
            right: '-20px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: red[700] 
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
      {sortMode && (
        <div style={{ 
          position: 'absolute', 
          right: '-60px', 
          top: '50%', 
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          {rowIndex > 0 && (
            <IconButton
              size="medium"
              onClick={() => onSwapUp(rowIndex, groupLabel)}
              style={{ color: teal[600] }}
            >
              <ArrowDropUp fontSize="large" />
            </IconButton>
          )}
          {rowIndex < inputs[groupLabel].length - 1 && (
            <IconButton
              size="medium"
              onClick={() => onSwapDown(rowIndex, groupLabel)}
              style={{ color: teal[600] }}
            >
              <ArrowDropDown fontSize="large" />
            </IconButton>
          )}
        </div>
      )}
    </div>
  );
});


// callLLM関数を修正
// const callLLM = async ({inputs, uid, hid, bid, setSnack, setResponseContent, setResponseDialogOpen}) => {
//   const fetchHistory = async () => {
//     const prms = {a: 'fetchUsersPlan', hid, bid, item: 'conferenceNote', limit: 1,};
//     prms.lastmonth = inputs['アセスメント実施日'].slice(0, 7);
//     const resConf = await univApiCall(prms, 'E23443', '', setSnack, '', '', false);
//     console.log(resConf);
//     prms.item = 'monitoring';
//     const resMon = await univApiCall(prms, 'E23443', '', setSnack, '', '', false);
//     console.log(resMon);
//     return {resConf, resMon};
//   };
//   const history = await fetchHistory();
//   const conf = history.resConf?.data?.dt?.[0]?.content?.content;
//   const mon = history.resMon?.data?.dt?.[0]?.content?.content;
  
//   // 支援経過の考察を取得
//   const supportProgress = mon?.支援経過 || [];
//   const considerations = supportProgress.map(item => item.考察).filter(Boolean).join("\n");
  
//   const prompt = `
//     該当利用者の設定を確認します。
//     情報に従って誤りのあるもののみ指摘して下さい。指摘が無ければ「変更は認められませんでした」と回答して下さい。
//     曖昧な情報に基づいた指摘は害悪です。
//     # 情報
//     議事録：${conf?.議事録}
//     修正：${conf?.修正}
//     課題：${conf?.課題}
//     ご家族の希望：${mon?.ご家族の希望}
//     本人の希望：${mon?.本人の希望}
//     短期目標：${mon?.短期目標}
//     長期目標：${mon?.長期目標}
//     支援経過の考察：${considerations}
//     # 見直すべき設定
//     アレルギー: ${inputs?.アレルギー}
//     症状: ${inputs?.症状}
//     得意: ${inputs?.得意}
//     注意事項: ${inputs?.注意事項}
//     備考: ${inputs?.備考}
//   `;
//   const res = await llmApiCall(
//     {prompt}, 'E23444', '', setSnack, '確認が終わりました', '', false
//   );
//   console.log(res);
  
//   // レスポンスを表示するためのダイアログを開く
//   if (res && res.data && res.data.response) {
//     setResponseContent(res.data.response);
//     setResponseDialogOpen(true);
//   }
// }

const PlanAssessmentDetail = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const allState = useSelector(s => s);
  const { hid, bid, users, stdDate } = allState;
  const { uid, suid, allAssessments, setAllAssessments, snack, setSnack, inputDefinitions: propInputDefinitions, withSideSection } = props;
  const history = useHistory();
  const location = useLocation();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [yesNoDialogOpen, setYesNoDialogOpen] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  // 削除とソート機能用の状態
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ rowIndex: null, groupLabel: null });
  const [sortMode, setSortMode] = useState(false);
  // 白紙登録完了ダイアログ用の状態
  const [blankRegistrationDialogOpen, setBlankRegistrationDialogOpen] = useState(false);
  // URLパラメータからuidを取得し、確実に定義されたuidを使用
  const urlUid = new URLSearchParams(location.search).get('uid');
  const effectiveUid = urlUid || uid || suid;
  
  // 自由実費項目 open/close 用
  const user = getUser(effectiveUid, users);
  const uids = convUID(uid).str;
  const required = true;
  
  // フィルタリングされたinputDefinitionsを使用
  const effectiveInputDefinitions = propInputDefinitions || inputDefinitions;
  const initialValues = useMemo(() => getInitialValues(effectiveInputDefinitions), [effectiveInputDefinitions]);
  
  const [originInputs, setOriginInputs] = useState(initialValues);
  const [inputs, setInputs] = useState(initialValues);
  const [dateDisabled, setDateDisabled] = useState(false);
  const planAiButtonDisplay = getUisCookie(uisCookiePos.planAiButtonDisplay) !== '0';
  // 日付変更／コピーは共通コンポーネントへ移行

  // バリデーション用エラー状態
  const [errors, setErrors] = useState({});

  // 親コンポーネントの中で、グループ行の各 LineRender 用の ref を管理
  const lineRenderRefs = useRef([]);

  // 新規追加モードの判定
  const isAddMode = useMemo(() => {
    return isPlanAddMode(location, 'assessment');
  }, [location.search]);

  // 右側固定のプランアイテム表示は共有コンポーネントへ移譲
  const createdBase = originInputs?.['アセスメント実施日'] || inputs?.['アセスメント実施日'] || stdDate;

  // 編集状態の判定はPlanRelatedItemsPanelに移譲

  // URLからcreatedParamを取得
  const urlParams = new URLSearchParams(location.search);
  const createdParam = urlParams.get('created');

  // 編集中フラグを管理するref（LineRender内の編集も考慮）
  const isEditingRef = useRef(false);

  useEffect(() => {
    // 編集中フラグが立っている場合はスキップ（保存処理中を保護）
    if (isEditingRef.current) {
      return;
    }
    
    // 編集中（未保存の変更がある）場合はuseEffectをスキップ
    // 保存後にallAssessmentsが更新されても、編集内容を上書きしない
    const hasUnsavedChanges = !deepEqual(originInputs, inputs);
    if (hasUnsavedChanges) {
      return;
    }
    
    // 新規追加モードの場合は初期値を設定（最優先）
    if (isAddMode) {
      setOriginInputs(initialValues);
      setInputs(initialValues);
      setDateDisabled(false);
      setErrors({});
      return;
    }
    
    // createdParamが指定されている場合は、その日付のデータを特定
    let t;
    if (createdParam) {
      t = allAssessments.find(item => 
        item.uid === uid && 
        item.content && 
        item.content['アセスメント実施日'] === createdParam
      );
    } else {
      // createdParamが指定されていない場合は、uidのみで検索
      t = allAssessments.find(item => item.uid === uid);
    }
    
    if (t) {
      setOriginInputs(t.content)
      setInputs(t.content);
      setDateDisabled(true); // アセスメント実施日は変更不可にする
    } else {
      setOriginInputs(initialValues)
      setInputs(initialValues);
      setDateDisabled(false);
    }
    setErrors({}); // ユーザー切り替え時にエラーリセット
  }, [uid, allAssessments, isAddMode, createdParam]);

  // 処理は PlanDateChangeCopy に集約

  const handleDelete = async () => {
    if (!deleteConfirm){
      setDeleteConfirm(true);
    } else {
      const prms = {
        a: 'deleteUsersPlan',hid, bid, uid: effectiveUid, item: 'assessment', 
        created: inputs['アセスメント実施日']
      };
      const res = await univApiCall(
        prms, 'E23441', '', setSnack, '削除されました', '削除に失敗しました', false
      );
      if (res && res.data && res.data.result) {
        // 削除成功後、inputsを初期状態に戻す
        setInputs(initialValues);
        setDeleteConfirm(false);
        // アセスメントリストから該当項目を削除
        let updatedAssessments;
        
        if (createdParam) {
          updatedAssessments = allAssessments.filter(item => 
            !(item.uid === uid && 
              item.content && 
              item.content['アセスメント実施日'] === createdParam)
          );
        } else {
          updatedAssessments = allAssessments.filter(item => item.uid !== uid);
        }
        setAllAssessments(updatedAssessments);
      }
    }
  }
  const handleCancel = () => {
    // createdParamが指定されている場合は、その日付のデータを特定
    let t;
    if (createdParam) {
      t = allAssessments.find(item => 
        item.uid === uid && 
        item.content && 
        item.content['アセスメント実施日'] === createdParam
      );
    } else {
      // createdParamが指定されていない場合は、uidのみで検索
      t = allAssessments.find(item => item.uid === uid);
    }
    
    if (t) {
      setInputs(t.content || []);  // contentプロパティにアクセス
    } else {
      setInputs(initialValues);
    }
  };
  const handleSubmit = async () => {
    // 編集中フラグを立てる（useEffectでの上書きを防ぐ）
    isEditingRef.current = true;
    
    // 送信前に各LineRenderの内容を強制的に同期
    if (lineRenderRefs.current) {
      lineRenderRefs.current.forEach(ref => {
        if (ref && ref.forceSync) {
          ref.forceSync();
        }
      });
    }

    // 同期完了を待つ（Reactのstate更新が反映されるまで）
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 必須項目のバリデーション
    const newErrors = {};
    inputDefinitions.forEach(def => {
      if (def.required && (!inputs[def.label] || inputs[def.label].toString().trim() === '')) {
        newErrors[def.label] = true;
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      // アセスメント実施日フィールドのエラーがある場合は特別なメッセージを表示
      if (newErrors['アセスメント実施日'] && inputs['アセスメント実施日']) {
        setSnack({ msg: '日付が不正または重複があります', severity: 'warning' });
      } else {
        setSnack({ msg: '必須項目が未入力です', severity: 'warning' });
      }
      isEditingRef.current = false; // エラー時もフラグを下ろす
      return; // 送信中断
    }

    try {

      // データ処理前のバックアップ
      const originalInputs = { ...inputs };

      // データ処理を安全に行う
      let processedContent;
      try {
        processedContent = processDeepLfToBr(cleanSpecialCharacters(inputs));
      } catch (processingError) {
        console.error('データ処理エラー:', processingError);
        isEditingRef.current = false; // エラー時もフラグを下ろす
        setSnack({ msg: 'データの処理中にエラーが発生しました。入力内容を確認してください。', severity: 'error' });
        return;
      }

      const prms = {
        a: 'sendUsersPlan',
        hid,
        bid,
        uid: effectiveUid,
        item: 'assessment',
        created: inputs['アセスメント実施日'],
        content: { uid: effectiveUid, content: processedContent },
      };

      const res = await univApiCall(prms, 'E23442', '', setSnack, '', '', false);
      
      if (res && res.data && res.data.result) {
        // 新規追加モードの場合、先にURL変更を行う（useEffectの競合を防ぐため）
        if (isAddMode) {
          resetPlanAddMode(history, inputs['アセスメント実施日']);
        }
        
        // API呼び出し成功後の処理
        const newAllAssessments = [...allAssessments];
        
        // createdParamが指定されている場合は、その日付のデータを特定して更新
        let existingIndex;
        if (createdParam) {
          existingIndex = newAllAssessments.findIndex(item => 
            item.uid === effectiveUid && 
            item.content && 
            item.content['アセスメント実施日'] === createdParam
          );
        } else {
          existingIndex = newAllAssessments.findIndex(item => item.uid === effectiveUid);
        }

        if (existingIndex !== -1) {
          newAllAssessments[existingIndex] = { uid: effectiveUid, content: inputs };
        } else {
          newAllAssessments.push({ uid: effectiveUid, content: inputs });
        }
        setAllAssessments(newAllAssessments);
        
        // 保存成功後、originInputsを現在のinputsの値で更新
        // これにより次のuseEffect実行時に hasUnsavedChanges = false となり、正常に動作する
        setOriginInputs({ ...inputs });
        
        // 少し待ってからフラグを下ろす（state更新が完了するまで）
        setTimeout(() => {
          isEditingRef.current = false;
        }, 50);
        
        setSnack({ msg: 'アセスメントが保存されました', severity: 'success' });
        
        // 作成日をローカルストレージの履歴に保存
        saveCreatedDateToLS(inputs['アセスメント実施日']);
      } else {
        // API呼び出し失敗時の処理
        console.error('API呼び出し失敗:', res);
        isEditingRef.current = false; // 失敗時もフラグを下ろす
        setSnack({ msg: '保存に失敗しました。再度お試しください。', severity: 'error' });
      }
      
      // LLMに状態確認をさせる
      // if (planAiButtonDisplay) {
      //   await callLLM({
      //     inputs, uid, hid, bid, setSnack, 
      //     setResponseContent, 
      //     setResponseDialogOpen
      //   });
      // }
    } catch (error) {
      console.error('handleSubmit エラー:', error);
      isEditingRef.current = false; // エラー時もフラグを下ろす
      setSnack({ msg: '予期しないエラーが発生しました。入力内容を確認して再度お試しください。', severity: 'error' });
    }
  };

  // ラベルで項目を検索するヘルパー関数
  const findInputByLabel = (label) => {
    if (!effectiveInputDefinitions || !Array.isArray(effectiveInputDefinitions)) return undefined;
    return effectiveInputDefinitions.find(item => item.label === label);
  };

  // ラベルからインデックスを取得するヘルパー関数
  const findInputIndexByLabel = (label) => {
    return inputs.findIndex(item => item.label === label);
  };

  // 生活歴グループのフィールド定義を取得
  const getArrayItemDefinitions = (groupLabel) => {
    if (groupLabel) {
      const group = inputDefinitions.find(def => def.label === groupLabel && def.type === 'group');
      return group ? group.fields : [];
    } else {
      // グループ名を指定しなかった場合は、すべてのグループフィールドをまとめて返す
      let fields = [];
      inputDefinitions.forEach(def => {
        if (def.type === 'group' && Array.isArray(def.fields)) {
          fields = fields.concat(def.fields);
        }
      });
      return fields;
    }
  };

  // 指定した生活歴内のフィールド定義を取得する
  const findArrayItemDefinitionByLabel = (fieldLabel) => {
    const items = getArrayItemDefinitions();
    return items.find(item => item.label === fieldLabel);
  };

  // 削除確認処理
  const handleRowDelete = (rowIndex, groupLabel) => {
    setDeleteTarget({ rowIndex, groupLabel });
    setDeleteDialogOpen(true);
  };

  // 削除実行処理
  const confirmDelete = () => {
    if (deleteTarget.rowIndex !== null && deleteTarget.groupLabel) {
      removeGroupRow(deleteTarget.rowIndex, deleteTarget.groupLabel);
    }
    setDeleteDialogOpen(false);
  };

  // 行削除処理
  const removeGroupRow = (rowIndex, groupLabel) => {
    setInputs(prev => {
      const groupData = prev[groupLabel] ? [...prev[groupLabel]] : [];
      groupData.splice(rowIndex, 1);
      return {
        ...prev,
        [groupLabel]: groupData,
      };
    });
  };

  // 行入れ替え処理
  const swapGroupRows = (groupLabel, fromIndex, toIndex) => {
    setInputs(prev => {
      const groupData = prev[groupLabel] ? [...prev[groupLabel]] : [];
      if (fromIndex >= 0 && fromIndex < groupData.length && 
          toIndex >= 0 && toIndex < groupData.length) {
        const temp = groupData[fromIndex];
        groupData[fromIndex] = groupData[toIndex];
        groupData[toIndex] = temp;
        return {
          ...prev,
          [groupLabel]: groupData,
        };
      }
      return prev;
    });
  };

  // 通常項目の変更ハンドラー
  const handleInputChange = (label, newValue) => {
    setInputs(prev => ({
      ...prev,
      [label]: newValue
    }));
  };


  // onBlurでバリデーション
  const handleBlur = (label, value) => {
    const inputDef = findInputByLabel(label);
    if (inputDef && inputDef.required && (!value || value.toString().trim() === '')) {
      setErrors(prev => ({ ...prev, [label]: true }));
    } else {
      setErrors(prev => {
        const newErr = { ...prev };
        delete newErr[label];
        return newErr;
      });
    }
    
    // アセスメント実施日の場合は重複チェック
    if (label === 'アセスメント実施日' && value) {
      const existingData = allAssessments.find(item => 
        item.uid === uid && item.content && item.content['アセスメント実施日'] === value
      );
      if (existingData) {
        setSnack({ msg: 'すでに存在している日付は指定できません', severity: 'warning' });
        setErrors(prev => ({ ...prev, [label]: true }));
      } else {
        setErrors(prev => {
          const newErr = { ...prev };
          delete newErr[label];
          return newErr;
        });
      }
    }
  };

  const getInputProps = (label) => {
    const def = findInputByLabel(label);
    const value = initialValues[label];
    return { ...def, value };
  };

  // 指定したラベルに該当する設定情報を返す
  const getInputDefinition = (label) => {
    return effectiveInputDefinitions.find(def => def.label === label);
  };

  // allAssessmentsから指定したフィールドのユニークな値を取得する関数
  const getUniqueOptionsFromAssessments = (fieldName) => {
    const values = allAssessments
      .map(item => item.content && item.content[fieldName])
      .filter(value => value && value.toString().trim() !== '')
      .map(value => value.toString().trim());
    
    // 重複を除去してソート
    return [...new Set(values)].sort();
  };

  // FieldRender用のヘルパー関数
  const handleSelectInputAuto = (e) => {
    if (e && e.target) {
      e.target.select();
    }
  };

  // FieldRender用のデータ（allAssessmentsのエイリアス）
  const allPersonalData = allAssessments;

  // 同様にインデックスを取得する場合
  const getInputDefinitionIndex = (label) => {
    return effectiveInputDefinitions.findIndex(def => def.label === label);
  };

  // 生活歴項目として管理している状態（例）
  const arrayItems = inputs['生活歴'] || [];

  const getInputStyle = (label) => {
    const def = effectiveInputDefinitions.find(item => item.label === label);
    if (!def) return {};
    // styleプロパティをそのまま返す
    return def.style || {};
  };

  const getInputLabelProps = (label) => ({
    shrink: Boolean(inputs[label] && inputs[label].toString().trim() !== '')
  });

  // ラジオボタン用レンダラー
  const RadioField = ({ def }) => (
    <FormControl component="fieldset" style={def.style || {}} required={def.required}>
      <FormLabel component="legend">{def.label}</FormLabel>
      <RadioGroup
        value={inputs[def.label] || ''}
        onChange={e => handleInputChange(def.label, e.target.value)}
        onBlur={e => handleBlur(def.label, e.target.value)}
        row
      >
        {def.options.map(option => (
          <FormControlLabel
            key={option}
            value={option}
            control={<Radio color="primary" />}
            label={option}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );

  // groupRender 内で LineRender をレンダリングする際に、ref を設定します。
  // 例:
  // const renderGroupRows = (groupLabel) => {
  //   return (inputs[groupLabel] || []).map((row, idx) => (
  //     <LineRender
  //       key={idx}
  //       ref={el => lineRenderRefs.current[idx] = el}
  //       rowIndex={idx}
  //       groupLabel={groupLabel}
  //       inputs={inputs}
  //       handleGroupChange={handleGroupChange}
  //       handleBlur={handleBlur}
  //       findInputByLabel={findInputByLabel}
  //     />
  //   ));
  // };

  // 行追加ボタン用の関数（forceSync を行ってから addGroupRow を呼び出す）
  const addGroupRowWithSync = (groupLabel) => {
    // 子コンポーネントの最新状態を強制同期
    if (lineRenderRefs.current) {
      lineRenderRefs.current.forEach(ref => {
        if (ref && ref.forceSync) {
          ref.forceSync();
        }
      });
    }
    // 同期が完了することを期待して、少し待ってから行追加処理へ
    setTimeout(() => {
      addGroupRow(groupLabel);
    }, 50);
  };

  // 子（LineRender）から呼ばれて、指定の項目を更新する関数
  const handleGroupChange = (groupLabel, rowIndex, field, value) => {
    setInputs(prevState => {
      const updated = { ...prevState };
      if (!updated[groupLabel]) {
        updated[groupLabel] = [];
      }
      
      // 既存の行データを取得
      const currentRow = updated[groupLabel][rowIndex] || {};
      
      // フィールド定義を取得
      const fieldDef = findInputByLabel(field);
      
      // 日付型の場合の特別処理
      let valueToStore = value;
      if (fieldDef?.type === 'DateInput') {
        valueToStore = typeof value === 'object' && value !== null ? (value.value || '') : value;
      }
      
      updated[groupLabel][rowIndex] = { ...currentRow, [field]: valueToStore };
      return updated;
    });
  };

  // 新規行を追加する関数
  const addGroupRow = (groupLabel) => {
    setInputs(prevState => {
      const updated = { ...prevState };
      if (!updated[groupLabel]) {
        updated[groupLabel] = [];
      }
      // 新規行として空のオブジェクトを追加
      updated[groupLabel] = [...updated[groupLabel], {}];
      return updated;
    });
  };

  return (
    <div 
      className={classes.planFormRoot}
      style={withSideSection ? { marginLeft: 'max(196px, calc((100% - 800px) / 2))' } : {}}
    >
      {/* 右側固定パネル：関連アイテム（共有コンポーネント） */}
      <PlanRelatedItemsPanel 
        uid={effectiveUid} 
        created={createdBase} 
        originInputs={originInputs}
        inputs={inputs}
        currentPlanType="assessment"
      />
      <form id='ed95rbb77'>
        <div className='title'>
          <div className='main'>アセスメント登録</div>
          <UserInfoDisplay user={user} uid={effectiveUid} />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Button
              startIcon={<AddCircleOutline />}
              style={{ color: indigo[500] }}
              onClick={() => {
                // URLにmode=addパラメータを追加
                const params = new URLSearchParams(location.search);
                params.set('mode', 'add');
                history.replace({
                  pathname: location.pathname,
                  search: params.toString()
                });
                // LocalStorageも設定（バックアップ）
                setLS(PLAN_ADD_MODE_KEY, 'true');
                setLS(PLAN_ADD_MODE_ITEM, 'assessment');
                // 初期値にリセット
                setInputs(initialValues);
                setOriginInputs(initialValues);
                setDateDisabled(false);
                setErrors({});
              }}
            >
              新規
            </Button>
            {inputs?.isBlank ? (
              <Button
                startIcon={<FileCopyIcon />}
                style={{ color: red[500] }}
                onClick={() => {
                  // 白紙登録を解除（isBlank フラグを除去）
                  const { isBlank: _, ...rest } = inputs;
                  setInputs(rest);
                }}
              >
                白紙登録解除
              </Button>
            ) : (
              <Button
                startIcon={<FileCopyIcon />}
                style={{ color: orange[500] }}
                onClick={() => {
                  // 白紙登録機能
                  const blankValues = createBlankValues(effectiveInputDefinitions, user);
                  setInputs(blankValues);
                  setOriginInputs(blankValues);
                  setDateDisabled(false);
                  setErrors({});
                  // ダイアログを表示
                  setBlankRegistrationDialogOpen(true);
                }}
              >
                白紙登録
              </Button>
            )}
            <PlanDateChangeCopy
              hid={hid}
              bid={bid}
              uid={effectiveUid}
              item="assessment"
              created={originInputs?.['アセスメント実施日']}
              inputs={inputs}
              setInputs={setInputs}
              originInputs={originInputs}
              setOriginInputs={setOriginInputs}
              setSnack={setSnack}
              createdField="アセスメント実施日"
              allPersonalData={allAssessments}
              setAllPersonalData={setAllAssessments}
            />
            {/* <Button
              startIcon={<SchoolIcon />}
              onClick={() => callLLM({inputs, uid: effectiveUid, hid, bid, setSnack, setResponseContent, setResponseDialogOpen})}
              style={{ color: orange[800] }}
            >
              生成
            </Button> */}
          
            <PlanPrintButton 
              item="assessment" 
              created={originInputs?.['アセスメント実施日']} 
              uid={effectiveUid}
              originInputs={originInputs} 
              inputs={inputs}
            />
          </div>
        </div>
        {/* 日付変更／コピー用のボタン群 */}
        
        {/* アセスメント基本情報 - 1行目 */}
        <div className="fpRow multi">
          {/* <NumInputGP
            label={findInputByLabel('実施回数')?.longLabel || findInputByLabel('実施回数')?.label}
            def={inputs['実施回数']}
            setPropsVal={(val) => handleInputChange('実施回数', val)}
            required={findInputByLabel('実施回数')?.required}
          /> */}
          <DateInput
            label={findInputByLabel('アセスメント実施日')?.longLabel || findInputByLabel('アセスメント実施日')?.label}
            def={inputs['アセスメント実施日']}
            setExtVal={(val) => handleInputChange('アセスメント実施日', val)}
            onBlur={(e) => handleBlur('アセスメント実施日', e.target.value)}
            required={findInputByLabel('アセスメント実施日')?.required}
            cls='tfMiddleL'
            disabled={dateDisabled}
            wrapperStyle={{marginLeft: -8, marginRight: 0}}
          />
          <Autocomplete
            freeSolo
            options={getUniqueOptionsFromAssessments('アセスメント実施者')}
            getOptionLabel={(option) => option || ""}
            inputValue={
              typeof inputs['アセスメント実施者'] === 'object'
                ? inputs['アセスメント実施者'].value
                : inputs['アセスメント実施者'] || ''
            }
            onInputChange={(event, newInputValue) =>
              handleInputChange('アセスメント実施者', newInputValue)
            }
            style={getInputStyle('アセスメント実施者')}
            onChange={(event, newValue) =>
              handleInputChange('アセスメント実施者', newValue || '')
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={
                  getInputDefinition('アセスメント実施者')?.longLabel ||
                  getInputDefinition('アセスメント実施者')?.label
                }
                variant="standard"
                onBlur={(e) => handleBlur('アセスメント実施者', e.target.value)}
                required={getInputDefinition('アセスメント実施者')?.required}
                error={!!errors['アセスメント実施者']}
                helperText={errors['アセスメント実施者'] ? '必須項目です' : ''}
              />
            )}
          />
          <AlbHTimeInput
            label={findInputByLabel('開始時間')?.longLabel || findInputByLabel('開始時間')?.label}
            time={inputs['開始時間']}
            setTime={(val) => handleInputChange('開始時間', val)}
            width={100}
            style={{marginTop: 8}}
            required={findInputByLabel('開始時間')?.required}
          />
          <AlbHTimeInput
            label={findInputByLabel('終了時間')?.longLabel || findInputByLabel('終了時間')?.label}
            time={inputs['終了時間']}
            setTime={(val) => handleInputChange('終了時間', val)}
            width={100}
            style={{marginTop: 8}}
            required={findInputByLabel('終了時間')?.required}
          />
        </div>

        {/* 時間情報 - 2行目 */}
        <div className="fpRow multi">
          <FormControl style={getInputStyle('性別')}>
            <InputLabel>
              {findInputByLabel('性別')?.longLabel || findInputByLabel('性別')?.label}
            </InputLabel>
            <Select
              value={inputs['性別'] || ''}
              onChange={(e) => handleInputChange('性別', e.target.value)}
            >
              {(findInputByLabel('性別')?.souce || []).map((option, optIndex) => (
                <MenuItem key={`option-${optIndex}`} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Autocomplete
            freeSolo
            options={getUniqueOptionsFromAssessments('相談支援事業所')}
            getOptionLabel={(option) => option || ""}
            value={inputs['相談支援事業所'] || ''}
            onInputChange={(event, newInputValue) =>
              handleInputChange('相談支援事業所', newInputValue)
            }
            style={getInputStyle('相談支援事業所')}
            onChange={(e, newValue) => handleInputChange('相談支援事業所', newValue || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label={findInputByLabel('相談支援事業所')?.longLabel || findInputByLabel('相談支援事業所')?.label}
                variant="standard"
              />
            )}
          />
        </div>

        {/* 個人情報 - 3行目 */}
        <div className="fpRow multi">
          <Autocomplete
            freeSolo
            options={findInputByLabel('保護者続柄')?.souce || []}
            getOptionLabel={(option) => option || ""}
            value={inputs['保護者続柄'] || ''}
            onInputChange={(event, newInputValue) =>
              handleInputChange('保護者続柄', newInputValue)
            }
            style={getInputStyle('保護者続柄')}
            onChange={(e, newValue) => handleInputChange('保護者続柄', newValue || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label={findInputByLabel('保護者続柄')?.longLabel || findInputByLabel('保護者続柄')?.label}
                variant="standard"
                onBlur={(e) => handleBlur('保護者続柄', e.target.value)}
                required={findInputByLabel('保護者続柄')?.required}
                error={!!errors['保護者続柄']}
                helperText={errors['保護者続柄'] ? '必須項目です' : ''}
              />
            )}
          />
          {FieldRender('実施対象者', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
          {FieldRender('対象者続柄', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
        </div>

        <div className="fpRow">
          {FieldRender('家族構成', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
        </div>

        {/* アレルギー情報 - 5行目 */}
        <div className="fpRow">
          {FieldRender('アレルギー', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
        </div>
        <div className='fpRow'>
          {FieldRender('症状', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
        </div>

        {/* 得意なこと - 6行目 */}
        <div className="fpRow">
          {FieldRender('得意', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
        </div>

        {/* 注意事項 - 7行目 */}
        <div className="fpRow">
          {FieldRender('注意事項', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
        </div>

        <div className="fpRow">
          {FieldRender('本人意向', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
        </div>
        <div className="fpRow">
          {FieldRender('家族意向', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
        </div>

        {/* 医療情報 - 8-10行目 */}
        <div className="fpRow" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {FieldRender('病院名', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
          {FieldRender('医師名', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
          {FieldRender('病院連絡先', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
        </div>

        {/* 生活歴セクション */}
        <div className="fpRow">
          <div
            style={{
              padding: 8,
              fontSize: '.8rem',
              color: blue[600],
              backgroundColor: blue[50],
              borderBottom: `1px solid ${blue[200]}`,
              width: '100%'
            }}
          >
            <span>生活歴</span><br></br>
            <span style={{fontSize: '.7rem'}}>出生時、幼少期〜現在の生活歴を記入してください。</span>
          </div>
          
          {arrayItems.length > 0 ? (
            arrayItems.map((row, index) => (
              <div key={`array-item-row-${index}`} style={{ width: '100%', marginBottom: '16px' }}>
                <div className="fpRow multi" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <div
                    style={{
                      width: 20,
                      textAlign: 'center',
                      marginRight: '8px',
                      marginTop: 18,
                      color: blue[600],
                      fontWeight: 'bold'
                    }}
                  >
                    {index + 1}
                  </div>
                  <LineRender
                    ref={el => lineRenderRefs.current[index] = el}
                    rowIndex={index}
                    groupLabel="生活歴"
                    inputs={inputs}
                    handleGroupChange={handleGroupChange}
                    handleBlur={handleBlur}
                    findInputByLabel={findInputByLabel}
                    user={user}
                    onRemove={handleRowDelete}
                    sortMode={sortMode}
                    onSwapUp={(rowIndex, groupLabel) => swapGroupRows(groupLabel, rowIndex, rowIndex - 1)}
                    onSwapDown={(rowIndex, groupLabel) => swapGroupRows(groupLabel, rowIndex, rowIndex + 1)}
                  />
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
              生活歴の項目がありません。「項目追加」を押して追加してください。
            </div>
          )}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <Button
              color="primary"
              size="small"
              startIcon={<AddCircleOutline />}
              onClick={() => addGroupRowWithSync('生活歴')}
            >
              項目追加
            </Button>
            <Button
              color={sortMode ? "secondary" : "primary"}
              onClick={() => setSortMode(!sortMode)}
              style={{ marginLeft: '8px' }}
              startIcon={sortMode ? <Close /> : <SwapVert />}
            >
              {sortMode ? '入れ替えを完了する' : '項目を入れ替える'}
            </Button>
          </div>
        </div>


        {/* ラジオボタン項目 */}
        {(() => {
          // グループごとにまとめて表示
          const groupedDefs = [];
          let lastGroup = null;
          effectiveInputDefinitions.forEach(def => {
            if (def.type === 'radio') {
              if (def.group !== lastGroup) {
                groupedDefs.push({ type: 'groupTitle', group: def.group });
                lastGroup = def.group;
              }
              groupedDefs.push(def);
            }
          });

          return groupedDefs.map((item, idx) => {
            if (item.type === 'groupTitle' && item.group) {
              return (
                <div key={idx} style={{
                  marginTop: 16, marginBottom: 8, padding: 8, marginBottom: 8,
                  fontWeight: 300, fontSize: '.9rem',
                  color: green[800],
                  backgroundColor: green[50], 
                  borderBottom: `1px solid ${green[200]}`
                }}>
                  {idx === 0 && <>
                    <span style={{fontWeight: 600, lineHeight: 1.5, marginBottom: 8}}>
                      五領域支援チェック項目
                    </span>
                    <br></br>
                  </>}
                  {item.group}
                </div>
              );
            } else if (item.label && item.type === 'radio') {
              return (
                <div className="fpRow" key={item.label}>
                  <RadioField def={item} />
                </div>
              );
            } else {
              return null;
            }
          });
        })()}

        {/* 保育所等訪問支援用セクション */}
        {user.service && user.service.includes(HOHOU) && (() => {
          const hohouDefs = effectiveInputDefinitions.filter(def => 
            def.group === '保育所等訪問支援用'
          );

          if (hohouDefs.length === 0) return null;

          return (
            <>
              {/* 保育所等訪問支援用グループタイトル */}
              <div style={{
                marginTop: 16, marginBottom: 8, padding: 8,
                fontWeight: 300, fontSize: '.9rem',
                color: purple[800],
                backgroundColor: purple[50], 
                borderBottom: `1px solid ${purple[200]}`
              }}>
                保育所等訪問支援用
              </div>
              
              {/* 各項目のレンダリング */}
              <div className="fpRow">
                {FieldRender('訪問先種別', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
              </div>
              <div className="fpRow">
                {FieldRender('在籍区分', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
              </div>
              <div className="fpRow">
                {FieldRender('主な支援場面', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
              </div>
              <div className="fpRow">
                {FieldRender('時間割/日課の要点', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
              </div>
              <div className="fpRow">
                {FieldRender('合理的配慮/環境調整案', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
              </div>
              <div className="fpRow">
                {FieldRender('訪問頻度', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
                {FieldRender('直接と間接の配分', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
              </div>
            </>
          );
        })()}

        {/* 全般グループのテキスト項目 */}
        {(() => {
          // 全般グループのテキスト項目を取得
          const generalTextDefs = effectiveInputDefinitions.filter(def => 
            def.group === '全般' && def.type === 'text'
          );

          if (generalTextDefs.length === 0) return null;

          return (
            <>
              {/* 全般グループタイトル */}
              <div style={{
                marginTop: 16, marginBottom: 8, padding: 8, marginBottom: 8,
                fontWeight: 300, fontSize: '.9rem',
                color: '#1976D2',
                backgroundColor: '#E3F2FD', 
                borderBottom: '1px solid #90CAF9'
              }}>
                全般
              </div>
              
              {/* テキスト項目 */}
              {generalTextDefs.map((def, idx) => (
                <div className="fpRow" key={def.label}>
                  <TextField
                    label={def.question || def.label}
                    value={inputs[def.label] || ''}
                    variant="standard"
                    style={def.style || { width: '100%' }}
                    InputLabelProps={getInputLabelProps(def.label)}
                    multiline={def.multiline}
                    maxRows={def.multiline ? 4 : 1}
                    onChange={(e) => handleInputChange(def.label, e.target.value)}
                    onBlur={(e) => handleBlur(def.label, e.target.value)}
                    required={def.required}
                    error={!!errors[def.label]}
                    helperText={errors[def.label] ? '必須項目です' : ''}
                  />
                </div>
              ))}
            </>
          );
        })()}
        {/* 備考 */}
        <div className="fpRow">
          {FieldRender('備考', inputDefinitions, inputs, handleInputChange, handleBlur, errors, false, handleSelectInputAuto, allPersonalData)}
        </div>

      </form>
      <div style={{height: 48}}></div>
      <div className='btnWrap'>
        <Button
          className={deleteConfirm? classes.deleteConfirmTrue: ''}
          variant='contained' 
          onClick={handleDelete}
          startIcon={<DeleteIcon/>}
        >
          {deleteConfirm? '削除実行': '削除'}
        </Button>
        <Button
          variant='contained' color='secondary'
          onClick={handleCancel}
        >
          キャンセル
        </Button>
        <Button
          variant='contained' color='primary'
          onClick={handleSubmit}
        >
          書き込み
        </Button>
      </div>
      {/* 日付変更／コピーは PlanDateChangeCopy 内に集約 */}
      <Dialog
        open={responseDialogOpen}
        onClose={() => setResponseDialogOpen(false)}
        aria-labelledby="llm-response-dialog-title"
        aria-describedby="llm-response-dialog-description"
      >
        <DialogTitle id="llm-response-dialog-title">AIによる設定確認結果</DialogTitle>
        <DialogContent>
          <DialogContentText id="llm-response-dialog-description" style={{whiteSpace: 'pre-wrap'}}>
            {responseContent}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialogOpen(false)} color="primary" variant="contained">
            閉じる
          </Button>
        </DialogActions>
      </Dialog>
      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>行の削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            この行を削除してもよろしいですか？この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            キャンセル
          </Button>
          <Button onClick={confirmDelete} color="primary" autoFocus>
            削除する
          </Button>
        </DialogActions>
      </Dialog>
      {/* 白紙登録完了ダイアログ */}
      <Dialog
        open={blankRegistrationDialogOpen}
        onClose={() => setBlankRegistrationDialogOpen(false)}
      >
        <DialogTitle>白紙アセスメント作成完了</DialogTitle>
        <DialogContent>
          <DialogContentText>
            白紙のアセスメントを作成しました。<br />
            印刷するには「書き込み」ボタンを押して保存してください。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlankRegistrationDialogOpen(false)} color="primary" variant="contained" autoFocus>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export const PlanAssessment = () => {
  const allState = useSelector(s=>s);
  const {users, hid, bid, stdDate, service, classroom} = allState;
  const loadingStatus = getLodingStatus(allState);
  const location = useLocation();
  const history = useHistory();
  const isMountedRef = useRef(true);
  
  // URLパラメータからcreated、mode、uid、lastmonthを取得
  const urlParams = new URLSearchParams(location.search);
  const createdParam = urlParams.get('created');
  const modeParam = urlParams.get('mode');
  const uidParam = urlParams.get('uid');
  const lastmonthParam = urlParams.get('lastmonth');
  
  // uidの優先順位: URLパラメータ > ローカルストレージ > 最初のユーザー
  let defUid = uidParam || getLS(planlsUid);
  const filterdUsers = getFilteredUsers(users, service, classroom);
  const found = filterdUsers.find(item => item.uid === String(defUid));
  if (!found) {
    defUid = filterdUsers?.[0]?.uid;
  }

  // 新規追加モードの場合、LocalStorageに設定
  useEffect(() => {
    if (modeParam === 'add') {
      setLS(PLAN_ADD_MODE_KEY, 'true');
      setLS(PLAN_ADD_MODE_ITEM, 'assessment');
    }
  }, [modeParam]);
  
  // URLパラメータでuidが指定された場合、ローカルストレージに保存
  useEffect(() => {
    if (uidParam && filterdUsers.find(item => item.uid === String(uidParam))) {
      setLS(planlsUid, String(uidParam));
    }
  }, [uidParam, filterdUsers]);

  const [suid, setSuid] = useState(String(defUid));
  const [userAttr, setUserAttr] = useState([]);
  const [allAssessments, setAllAssessments] = useState([]);
  const [snack, setSnack] = useState({msg: '', severity: ''});
  const appPageSStyle = {marginTop: 80}
  const limit = users.length + 50;
  
  useEffect(() => {
    isMountedRef.current = true;
    
    const fetchData = async () => {
      try {
        // const month = stdDate.slice(0, 7);
        const prms = {a: 'fetchUsersPlan', hid, bid, item: 'assessment', limit};
        
        // lastmonthパラメータが指定されている場合は追加
        if (lastmonthParam) {
          prms.lastmonth = lastmonthParam;
          delete prms.limit; // lastmonthが指定されている場合はlimitを削除
        }
        
        const res = await univApiCall(prms, 'E23441', '', '');
        
        // API呼び出し後もコンポーネントがマウントされていることを確認
        if (isMountedRef.current && res && res?.data?.result) {
          const assessments = (res.data?.dt ?? []).map(item => ({
            ...item.content ? processDeepBrToLf(item.content) : {}
          }));
          setAllAssessments(assessments);
        } else if (isMountedRef.current && res && !res?.data?.result) {
          // エラーレスポンスの場合のみスナックメッセージを表示
          setSnack({
            msg: 'データ取得に失敗しました', severity: 'error', errorId: 'EP23442', 
            onErrorDialog: true
          });
        }
      } catch (error) {
        // エラーハンドリング（必要に応じて）
        if (isMountedRef.current) {
          console.error('データ取得エラー:', error);
          setSnack({
            msg: 'データ取得に失敗しました', severity: 'error' , errorId: 'EP23442', 
            onErrorDialog: true
          });
        }
      }
    };
    
    // mode=addの場合はデータ取得をスキップ
    if (modeParam === 'add') {
      return;
    }
    
    // データがまだロードされており、allAssessmentsが空配列の場合のみ実行
    if (loadingStatus.loaded && (!allAssessments || allAssessments.length === 0)){
      fetchData();
    }
    
    return () => {
      isMountedRef.current = false;  // クリーンアップ時に参照を更新
    };
  }, [loadingStatus.loaded, stdDate, hid, bid, location.search, lastmonthParam, modeParam]);  // modeParamを依存配列に追加

  useEffect(() => {
    if (suid) {
      setLS(planlsUid, String(suid));
      setRecentUser(suid);
    }
  }, [suid]);

  // ユーザー変更時の処理
  const handleUserChange = (newUid) => {
    setSuid(newUid);
  };

  if (loadingStatus === 'loading'){
    return <LoadingSpinner/>
  }
  else if (loadingStatus.error){
    return (
      <LoadErr loadStatus={loadingStatus} errorId={'E49822'} />
    )
  }
  else if (loadingStatus.loaded && !users.length){
    console.log('E49413');
    return(
      <StdErrorDisplay 
        errorText = '利用者が未登録です。'
        errorSubText = {`利用者の登録をしてからの登録を行って下さい。`}
        errorId = 'E49413'
      />
    )
  }


  // 年齢区分取得とフィルタリング
  const user = getUser(suid, users);
  const ageCategory = getAgeCategory(user?.ageStr);
  const filteredDefs = filterQuestionsByAge(inputDefinitions, ageCategory);

  return (<>
    <LinksTab menu={planMenu} />
    <div className='AppPage' style={appPageSStyle}>
      {createdParam || modeParam === 'add' ? (
        <GoBackButton url="/plan/manegement" style={{top: 96, left: 60, position: 'fixed'}} />
      ) : (
        <SideSectionUserSelect 
          suid={suid} setSuid={handleUserChange} 
          userAttr={userAttr} setUserAttr={setUserAttr} allowAnyService
        />
      )}
        <PlanAssessmentDetail 
          uid={uidParam || suid} 
          suid={suid}
          allAssessments={allAssessments} setAllAssessments={setAllAssessments}
          snack={snack} setSnack={setSnack}
          inputDefinitions={filteredDefs}
          withSideSection={!createdParam}
        />
      <SnackMsgSingle state={snack} setState={setSnack} />
    </div>
  </>)
}