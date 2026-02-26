import { TrendingUp } from "@material-ui/icons";

const dt = {
  // 設定
  config: {
    mumOfPhotos: 3, // fapでは使わなくても良いかも
    bitals:{
      temperature: true, // 体温
      bloods:true,//血圧（上下）脈拍
      excretion:true,//排泄（大小のそれぞれ回数
      spo2: true,//血中酸素濃度
      sleep: 0,// 0 指定しない 1 就寝起床時間 2 睡眠時間
    },
    bitalRequired: [false, false, true], // threadの何番目でバイタル入力要求するか
    links: { // 法人情報に含めるかも
      phone: '045-123-1234',
      facebook: 'https://...',
      instagram: 'https://...',
      website: 'https://...',
    },
    com:{...事業所情報}, // パラメータ多数利用するのは一部
  },
  // ユーザー情報 パラメータの数は多いが利用するデータは限定されると思われる
  userInfo:{
    ...利用者情報,
    bros:[ // 兄弟の情報。上位のデータと同じ構造
      ...利用者情報,
      ...利用者情報,
    ],
 },
 // 利用予定
 schedule:{
  D20220801:{start:'10:00', end:'17:00', transfer:['自宅','自宅']},
  D20220802:{start:'10:00', end:'17:00', transfer:['自宅','自宅']},
  Dxxx:{xxx:'xxx'},
 },
 thread:{
  // 0 事業所より
  // 1 家族より
  // 2 事業所より
  D20220801:[
    {timeStamp: 1659417989091, content: `xxxxxx`,}, // contentは改行付き
    {timeStamp: 1659417999999, content: `xxxxxx`,},
    {
      timeStamp: 1659417999999, content: `xxxxxx`,
      photos:[
        'http://aaa/aaa.jpeg','http://aaa/bbb.jpeg','http://aaa/bbb.jpeg'
      ],
      ...bitals
    },
  ]
 }
}