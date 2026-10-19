/* ============================================================
   识食 · 应用逻辑
   架构：单文件 PWA，零依赖，数据存 localStorage
   ============================================================ */

/* 构建日期。每次发布改这里 —— 用户能一眼看到自己跑的是哪版，
   省掉「到底是代码问题还是他没更新」这种来回猜。 */
const BUILD="2026-10-19f";

/* ================= 内置数据（中国食物成分表，每100g可食部，约值）
   fb = 膳食纤维 g/100g（缺项按同类保守估） ================= */
const FOODS=[
{n:"鸡胸肉(生)",k:133,p:19.4,f:5.0,c:2.5,fb:0,na:63,sf:1.4,sg:0,cat:"protein"},{n:"鸡蛋(全蛋)",k:144,p:13.3,f:8.8,c:2.8,fb:0,na:131,sf:3.0,sg:0.3,cat:"protein"},
{n:"鸡蛋白",k:60,p:11.6,f:0.1,c:3.1,fb:0,na:166,sf:0,sg:0.3,cat:"protein"},{n:"鸡蛋黄",k:328,p:15.2,f:28.2,c:3.4,fb:0,na:54,sf:8.0,sg:0.5,cat:"protein"},
{n:"鸡腿肉(生)",k:181,p:16.0,f:13.0,c:0,fb:0,na:85,sf:3.6,sg:0,cat:"protein"},{n:"鸡翅(生)",k:194,p:17.4,f:14.1,c:0,fb:0,na:85,sf:4.0,sg:0,cat:"protein"},
{n:"牛肉(瘦,生)",k:106,p:20.2,f:2.3,c:1.2,fb:0,na:53,sf:1.0,sg:0,cat:"protein"},{n:"牛里脊(生)",k:107,p:22.2,f:0.9,c:2.4,fb:0,na:45,sf:0.3,sg:0,cat:"protein"},
{n:"猪肉(里脊,生)",k:155,p:20.2,f:7.9,c:0.7,fb:0,na:43,sf:2.9,sg:0,cat:"protein"},{n:"猪瘦肉(生)",k:143,p:20.3,f:6.2,c:1.5,fb:0,na:58,sf:2.2,sg:0,cat:"protein"},
{n:"三文鱼(生)",k:139,p:17.2,f:7.8,c:0,fb:0,na:59,sf:1.5,sg:0,cat:"protein"},{n:"鳕鱼(生)",k:88,p:20.4,f:0.5,c:0.5,fb:0,na:130,sf:0.1,sg:0,cat:"protein"},
{n:"基围虾(生)",k:93,p:18.6,f:0.8,c:2.8,fb:0,na:165,sf:0.2,sg:0,cat:"protein"},{n:"金枪鱼(水浸罐头)",k:99,p:23.6,f:0.6,c:0,fb:0,na:320,sf:0.2,sg:0,cat:"protein"},
{n:"猪肝(生)",k:129,p:19.3,f:3.5,c:5.0,fb:0,na:68,sf:1.2,sg:0,cat:"protein"},
{n:"牛奶(全脂)",k:54,p:3.0,f:3.2,c:3.4,fb:0,na:44,sf:1.9,sg:3.4,cat:"protein"},{n:"酸奶(无糖)",k:70,p:3.5,f:2.5,c:9.0,fb:0,na:48,sf:1.6,sg:4.5,cat:"protein"},
{n:"豆浆(无糖)",k:31,p:2.9,f:1.6,c:1.1,fb:1.1,na:3,sf:0.2,sg:0.5,cat:"protein"},{n:"豆腐(北)",k:98,p:12.2,f:4.8,c:2.0,fb:0.5,na:7,sf:0.7,sg:0.5,cat:"protein"},
{n:"豆腐(嫩/南)",k:57,p:6.2,f:2.5,c:2.4,fb:0.4,na:7,sf:0.4,sg:0.5,cat:"protein"},{n:"豆腐干",k:140,p:16.2,f:3.6,c:10.7,fb:0.8,na:330,sf:0.5,sg:0.6,cat:"protein"},
{n:"千张(百叶)",k:262,p:24.5,f:16.0,c:5.5,fb:1.0,na:30,sf:2.3,sg:0.5,cat:"protein"},{n:"内酯豆腐",k:49,p:5.0,f:1.9,c:3.3,fb:0.4,na:5,sf:0.3,sg:0.5,cat:"protein"},
{n:"毛豆(鲜)",k:131,p:13.1,f:5.0,c:10.5,fb:4.0,na:4,sf:0.9,sg:2.0,cat:"protein"},{n:"黄豆(干)",k:390,p:35.0,f:16.0,c:34.2,fb:15.5,na:2,sf:2.3,sg:7.0,cat:"protein"},
{n:"鹰嘴豆(熟)",k:164,p:8.9,f:2.6,c:27.4,fb:7.6,na:7,sf:0.3,sg:4.8,cat:"protein"},{n:"扁豆(熟)",k:116,p:9.0,f:0.4,c:20.1,fb:7.9,na:2,sf:0.1,sg:1.8,cat:"protein"},
{n:"希腊酸奶(无糖)",k:59,p:10.0,f:0.4,c:3.6,fb:0,na:36,sf:0.1,sg:3.2,cat:"protein"},{n:"低脂奶酪",k:98,p:11.1,f:3.3,c:3.4,fb:0,na:400,sf:2.1,sg:2.5,cat:"protein"},
{n:"米饭(熟)",k:116,p:2.6,f:0.3,c:25.9,fb:0.3,na:2,sf:0.1,sg:0.1,cat:"staple"},{n:"糙米饭(熟)",k:116,p:2.7,f:0.9,c:24.0,fb:1.6,na:3,sf:0.2,sg:0.2,cat:"staple"},
{n:"馒头",k:223,p:7.0,f:1.1,c:47.0,fb:1.3,na:165,sf:0.3,sg:1.5,cat:"staple"},{n:"面条(熟)",k:110,p:2.7,f:0.2,c:24.3,fb:0.8,na:4,sf:0.1,sg:0.3,cat:"staple"},
{n:"荞麦面(干)",k:340,p:12.0,f:1.5,c:68.0,fb:5.5,na:5,sf:0.3,sg:1.0,cat:"staple"},{n:"全麦面包",k:246,p:8.5,f:1.0,c:44.4,fb:6.0,na:450,sf:0.2,sg:5.0,cat:"staple"},
{n:"白面包/吐司",k:264,p:8.3,f:3.2,c:48.6,fb:2.5,na:480,sf:0.7,sg:6.0,cat:"staple"},{n:"燕麦片(干)",k:377,p:12.1,f:6.7,c:61.6,fb:10.6,na:4,sf:1.2,sg:1.0,cat:"staple"},
{n:"红薯/紫薯(生)",k:86,p:1.1,f:0.2,c:20.1,fb:1.6,na:28,sf:0.1,sg:5.0,cat:"staple"},{n:"玉米(鲜)",k:112,p:4.0,f:1.2,c:22.8,fb:2.9,na:3,sf:0.2,sg:3.0,cat:"staple"},
{n:"土豆(生)",k:77,p:2.0,f:0.2,c:17.5,fb:1.1,na:6,sf:0.1,sg:0.8,cat:"staple"},{n:"山药(生)",k:57,p:1.9,f:0.2,c:12.4,fb:0.8,na:18,sf:0.1,sg:0.5,cat:"staple"},
{n:"藜麦(熟)",k:120,p:4.4,f:1.9,c:21.3,fb:2.8,na:7,sf:0.2,sg:0.9,cat:"staple"},{n:"意面(熟)",k:158,p:5.8,f:0.9,c:30.9,fb:1.8,na:5,sf:0.2,sg:0.6,cat:"staple"},
{n:"紫米/黑米(熟)",k:126,p:3.0,f:0.8,c:27.0,fb:2.0,na:3,sf:0.2,sg:0.3,cat:"staple"},{n:"玉米面(干)",k:350,p:8.1,f:3.3,c:73.5,fb:6.2,na:2,sf:0.5,sg:0.5,cat:"staple"},
{n:"彩椒/甜椒",k:26,p:1.0,f:0.3,c:5.4,fb:1.7,na:3,sf:0,sg:3.0,cat:"veg"},{n:"西兰花",k:36,p:4.1,f:0.6,c:4.3,fb:2.6,na:19,sf:0.1,sg:1.7,cat:"veg"},
{n:"菠菜",k:28,p:2.6,f:0.3,c:4.5,fb:2.2,na:85,sf:0.1,sg:0.4,cat:"veg"},{n:"生菜",k:16,p:1.4,f:0.4,c:2.1,fb:1.3,na:32,sf:0.1,sg:0.8,cat:"veg"},
{n:"黄瓜",k:16,p:0.8,f:0.2,c:2.9,fb:0.5,na:5,sf:0,sg:1.6,cat:"veg"},{n:"西红柿",k:20,p:0.9,f:0.2,c:4.0,fb:1.2,na:5,sf:0,sg:2.6,cat:"veg"},
{n:"胡萝卜",k:39,p:1.0,f:0.2,c:9.0,fb:2.8,na:71,sf:0,sg:4.7,cat:"veg"},{n:"洋葱",k:40,p:1.1,f:0.2,c:9.0,fb:1.7,na:4,sf:0,sg:4.2,cat:"veg"},
{n:"大白菜",k:18,p:1.5,f:0.1,c:3.2,fb:1.0,na:57,sf:0,sg:1.2,cat:"veg"},{n:"冬瓜",k:12,p:0.4,f:0.2,c:2.6,fb:0.7,na:2,sf:0,sg:1.4,cat:"veg"},
{n:"茄子",k:23,p:1.1,f:0.2,c:5.4,fb:3.0,na:6,sf:0,sg:3.0,cat:"veg"},{n:"芹菜(茎)",k:17,p:0.8,f:0.1,c:3.9,fb:1.6,na:159,sf:0,sg:1.3,cat:"veg"},
{n:"芦笋",k:22,p:2.2,f:0.1,c:4.3,fb:2.1,na:3,sf:0,sg:1.3,cat:"veg"},{n:"秋葵",k:37,p:2.5,f:0.1,c:8.7,fb:3.2,na:8,sf:0,sg:1.5,cat:"veg"},
{n:"蘑菇(鲜)",k:24,p:2.7,f:0.1,c:4.1,fb:2.1,na:8,sf:0,sg:2.0,cat:"veg"},{n:"金针菇(鲜)",k:32,p:2.4,f:0.4,c:6.0,fb:2.7,na:4,sf:0,sg:2.0,cat:"veg"},
{n:"海带(鲜)",k:13,p:1.2,f:0.1,c:2.1,fb:1.3,na:107,sf:0,sg:0.6,cat:"veg"},{n:"豆芽(绿豆芽)",k:18,p:2.1,f:0.1,c:2.9,fb:0.8,na:5,sf:0,sg:1.0,cat:"veg"},
{n:"西葫芦",k:19,p:1.2,f:0.2,c:4.2,fb:1.0,na:5,sf:0,sg:2.5,cat:"veg"},{n:"南瓜",k:23,p:0.7,f:0.1,c:5.3,fb:0.8,na:1,sf:0,sg:2.8,cat:"veg"},
{n:"韭菜",k:29,p:2.4,f:0.4,c:4.6,fb:1.4,na:8,sf:0,sg:1.5,cat:"veg"},{n:"青椒(尖椒)",k:27,p:1.4,f:0.3,c:5.8,fb:2.1,na:3,sf:0,sg:3.0,cat:"veg"},
{n:"苦瓜",k:19,p:1.0,f:0.1,c:4.9,fb:1.4,na:2,sf:0,sg:2.0,cat:"veg"},{n:"空心菜",k:20,p:2.2,f:0.3,c:3.6,fb:1.4,na:94,sf:0,sg:1.0,cat:"veg"},
{n:"油麦菜",k:15,p:1.4,f:0.4,c:2.1,fb:1.2,na:80,sf:0,sg:1.0,cat:"veg"},{n:"菜花/花椰菜",k:24,p:2.1,f:0.2,c:4.6,fb:2.7,na:32,sf:0.1,sg:1.9,cat:"veg"},
{n:"莲藕(生)",k:73,p:1.9,f:0.2,c:16.4,fb:2.2,na:44,sf:0,sg:1.5,cat:"veg"},{n:"娃娃菜",k:13,p:1.9,f:0.2,c:2.4,fb:1.0,na:50,sf:0,sg:1.0,cat:"veg"},
{n:"苹果",k:53,p:0.2,f:0.2,c:13.7,fb:1.2,na:1.6,sf:0,sg:10.4,cat:"fruit"},{n:"香蕉",k:93,p:1.4,f:0.2,c:22.0,fb:1.2,na:1,sf:0.1,sg:12.2,cat:"fruit"},
{n:"橙子",k:48,p:0.8,f:0.2,c:11.1,fb:0.6,na:1,sf:0,sg:9.4,cat:"fruit"},{n:"蓝莓",k:57,p:0.7,f:0.3,c:14.5,fb:2.4,na:1,sf:0,sg:10.0,cat:"fruit"},
{n:"猕猴桃",k:61,p:0.8,f:0.6,c:14.5,fb:2.6,na:10,sf:0,sg:9.0,cat:"fruit"},{n:"西瓜",k:31,p:0.5,f:0.2,c:7.5,fb:0.3,na:3,sf:0,sg:6.2,cat:"fruit"},
{n:"草莓",k:32,p:1.0,f:0.2,c:7.7,fb:1.1,na:4,sf:0,sg:4.9,cat:"fruit"},{n:"葡萄",k:45,p:0.5,f:0.2,c:10.3,fb:0.4,na:1.3,sf:0,sg:9.5,cat:"fruit"},
{n:"火龙果",k:55,p:1.1,f:0.2,c:13.3,fb:2.0,na:3,sf:0,sg:9.0,cat:"fruit"},{n:"牛油果",k:171,p:2.0,f:15.3,c:8.6,fb:2.1,na:7,sf:2.1,sg:0.7,cat:"fruit"},
{n:"柚子",k:42,p:0.8,f:0.2,c:9.5,fb:0.4,na:3,sf:0,sg:7.0,cat:"fruit"},{n:"桃子",k:48,p:0.9,f:0.1,c:12.2,fb:1.3,na:6,sf:0,sg:9.5,cat:"fruit"},
{n:"樱桃",k:46,p:1.1,f:0.2,c:10.2,fb:0.3,na:8,sf:0,sg:8.5,cat:"fruit"},{n:"梨",k:51,p:0.3,f:0.1,c:13.3,fb:3.1,na:2,sf:0,sg:9.8,cat:"fruit"},
{n:"火龙果(红心)",k:51,p:1.0,f:0.2,c:13.3,fb:1.6,na:3,sf:0,sg:9.5,cat:"fruit"},{n:"芒果",k:35,p:0.6,f:0.2,c:8.3,fb:1.3,na:2,sf:0,sg:6.5,cat:"fruit"},
{n:"树莓",k:52,p:1.2,f:0.7,c:11.9,fb:6.5,na:1,sf:0,sg:4.4,cat:"fruit"},{n:"圣女果",k:22,p:0.9,f:0.2,c:4.9,fb:1.8,na:5,sf:0,sg:3.5,cat:"fruit"},
{n:"花生(炒)",k:581,p:24.1,f:50.6,c:21.2,fb:7.7,na:4,sf:7.0,sg:4.0,cat:"fat"},{n:"杏仁",k:578,p:22.5,f:45.4,c:21.7,fb:11.8,na:1,sf:3.9,sg:4.4,cat:"fat"},
{n:"核桃",k:646,p:14.9,f:58.8,c:19.1,fb:9.5,na:2,sf:5.5,sg:2.6,cat:"fat"},{n:"腰果",k:553,p:18.0,f:44.0,c:30.0,fb:3.6,na:12,sf:7.8,sg:5.9,cat:"fat"},
{n:"花生酱(无糖)",k:600,p:25.0,f:50.0,c:20.0,fb:6.0,na:17,sf:10.0,sg:9.0,cat:"fat"},{n:"橄榄油",k:899,p:0,f:99.9,c:0,fb:0,na:0,sf:14.0,sg:0,cat:"fat"},
{n:"花生油",k:899,p:0,f:99.9,c:0,fb:0,na:0,sf:17.0,sg:0,cat:"fat"},
{n:"奇亚籽",k:486,p:16.5,f:30.7,c:42.1,fb:34.4,na:16,sf:3.3,sg:0,cat:"fat"},{n:"亚麻籽",k:534,p:18.3,f:42.2,c:28.9,fb:27.3,na:30,sf:3.7,sg:1.6,cat:"fat"},
{n:"南瓜子",k:559,p:30.2,f:49.0,c:10.7,fb:6.0,na:7,sf:8.7,sg:1.4,cat:"fat"},{n:"葵花籽",k:584,p:20.8,f:51.5,c:20.0,fb:8.6,na:9,sf:4.5,sg:2.6,cat:"fat"},
{n:"蜂蜜",k:321,p:0.3,f:1.9,c:82.4,fb:0,na:4,sf:0,sg:82.0,cat:"other"},{n:"乳清蛋白粉",k:375,p:75.0,f:5.0,c:8.0,fb:0,na:300,sf:2.0,sg:3.0,cat:"other"},
{n:"黑巧克力(70%)",k:550,p:7.0,f:40.0,c:45.0,fb:11.0,na:20,sf:24.0,sg:24.0,cat:"other"},{n:"火腿肠",k:212,p:11.3,f:17.0,c:5.0,fb:0,na:1000,sf:6.0,sg:2.0,cat:"other"},
{n:"鸡胸肉肠(低脂)",k:120,p:20.0,f:3.0,c:4.0,fb:0,na:800,sf:1.0,sg:1.5,cat:"other"},
{n:"木耳(干)",k:265,p:12.1,f:1.5,c:65.6,fb:29.9,na:48,sf:0.2,sg:0.5,cat:"other"},{n:"魔芋/蒟蒻",k:12,p:0.1,f:0.1,c:3.0,fb:3.0,na:4,sf:0,sg:0.2,cat:"other"}
];
const CAT_LABEL={protein:"蛋白质类",staple:"主食",veg:"蔬菜",fruit:"水果",fat:"油脂坚果",other:"其他"};
const CAT_ORDER=["protein","staple","veg","fruit","fat","other"];

/* ================= 常见份量 =================
   为什么要有这张表：
     拍照能认出「这是西兰花」，但认不出「这一颗多重」—— 重量取决于
     镜头距离、参照物、切没切，纯视觉估算在研究领域都要靠盘子直径做
     尺度参照，误差仍有 20–30%。而用户自己知道自己拿的是「一颗」还是
     「一小朵」，这个判断比任何模型都准。
   所以重量这一步交给用户，用日常单位表达，再换算成克。

   克数口径：以《中国食物成分表》的常见可食部重量为准，取整到好记的数。
   匹配不到具体食材时，按分类退回通用单位（见 PORT_FALLBACK）。 */
const PORTIONS={
  /* 蔬菜 */
  "西兰花":[["一小朵",25],["半颗",150],["一颗",300]],
  "菜花/花椰菜":[["一小朵",25],["半颗",200],["一颗",400]],
  "菠菜":[["一把",100],["一碟",150]],
  "生菜":[["一片",15],["一颗",200]],
  "黄瓜":[["半根",100],["一根",200]],
  "西红柿":[["半个",75],["一个",150]],
  "胡萝卜":[["半根",50],["一根",100]],
  "洋葱":[["半个",75],["一个",150]],
  "大白菜":[["一片",30],["四分之一颗",250]],
  "娃娃菜":[["一颗",200]],
  "冬瓜":[["一块",200]],
  "茄子":[["一根",200]],
  "芹菜(茎)":[["一根",30],["一把",100]],
  "芦笋":[["一根",15],["一把",100]],
  "秋葵":[["一根",10],["一把",100]],
  "蘑菇(鲜)":[["一个",20],["一盒",200]],
  "金针菇(鲜)":[["一把",100],["一包",200]],
  "海带(鲜)":[["一份",100]],
  "豆芽(绿豆芽)":[["一把",100]],
  "西葫芦":[["一根",250]],
  "南瓜":[["一块",150]],
  "韭菜":[["一把",80]],
  "青椒(尖椒)":[["一个",30]],
  "彩椒/甜椒":[["一个",120]],
  "苦瓜":[["一根",200]],
  "空心菜":[["一把",100]],
  "油麦菜":[["一把",100]],
  "莲藕(生)":[["一节",200]],
  /* 水果 */
  "苹果":[["半个",100],["一个",200]],
  "香蕉":[["一根",100]],
  "橙子":[["一个",200]],
  "柚子":[["两瓣",100]],
  "蓝莓":[["一小盒",125]],
  "树莓":[["一小盒",125]],
  "猕猴桃":[["一个",85]],
  "西瓜":[["一块",200]],
  "草莓":[["5 颗",75],["一小碗",150]],
  "葡萄":[["10 颗",50],["一串",200]],
  "火龙果":[["一个",350]],
  "火龙果(红心)":[["一个",350]],
  "牛油果":[["半个",100],["一个",200]],
  "桃子":[["一个",200]],
  "樱桃":[["10 颗",80]],
  "梨":[["一个",200]],
  "芒果":[["一个",250]],
  "圣女果":[["5 个",60],["10 个",120]],
  /* 肉蛋豆 */
  "鸡胸肉(生)":[["半块",80],["一块",150]],
  "鸡蛋(全蛋)":[["一个",50]],
  "鸡蛋白":[["一个",33]],
  "鸡蛋黄":[["一个",17]],
  "鸡腿肉(生)":[["一个",100]],
  "鸡翅(生)":[["一个",40],["三个",120]],
  "牛肉(瘦,生)":[["一片",100],["一盒",250]],
  "猪瘦肉(生)":[["一片",100]],
  "猪肉(里脊,生)":[["一片",100]],
  "三文鱼(生)":[["一块",120]],
  "鳕鱼(生)":[["一块",120]],
  "基围虾(生)":[["5 只",60],["10 只",120]],
  "金枪鱼(水浸罐头)":[["一罐",150]],
  "猪肝(生)":[["一片",50]],
  "牛奶(全脂)":[["一杯",250]],
  "酸奶(无糖)":[["一杯",150]],
  "希腊酸奶(无糖)":[["一杯",150]],
  "豆浆(无糖)":[["一杯",250]],
  "豆腐(北)":[["半块",100],["一块",200]],
  "豆腐干":[["一块",40],["三块",120]],
  "毛豆(鲜)":[["一把",60]],
  "黄豆(干)":[["一把",30]],
  /* 主食 */
  "米饭(熟)":[["小碗",150],["一碗",200]],
  "糙米饭(熟)":[["一碗",200]],
  "馒头":[["一个",100]],
  "面条(熟)":[["一碗",250]],
  "意面(熟)":[["一份",250]],
  "藜麦(熟)":[["一份",150]],
  "全麦面包":[["一片",35],["两片",70]],
  "白面包/吐司":[["一片",30]],
  "燕麦片(干)":[["一份",40]],
  "红薯/紫薯(生)":[["一个",200]],
  "玉米(鲜)":[["一根",200]],
  "土豆(生)":[["一个",150]],
  "山药(生)":[["一段",200]],
  /* 油脂坚果 */
  "花生(炒)":[["一小把",20]],
  "杏仁":[["10 颗",12],["一小把",25]],
  "核桃":[["一个",8],["三个",24]],
  "腰果":[["10 颗",15]],
  "花生酱(无糖)":[["一勺",15]],
  "橄榄油":[["一茶匙",5],["一汤匙",15]],
  "花生油":[["一汤匙",15]],
  "奇亚籽":[["一勺",12]],
  "亚麻籽":[["一勺",10]],
  "南瓜子":[["一小把",20]],
  "葵花籽":[["一小把",20]],
  /* 其他 */
  "蜂蜜":[["一勺",15]],
  "乳清蛋白粉":[["一勺",30]],
  "黑巧克力(70%)":[["一块",10],["三块",30]],
  "火腿肠":[["一根",45]],
  "鸡胸肉肠(低脂)":[["一根",40]],
  "木耳(干)":[["一小把",10]],
  "魔芋/蒟蒻":[["一份",150]],
};
/** 匹配不到具体食材时的通用单位 —— 按分类给，总比让用户空想一个克数强 */
const PORT_FALLBACK={
  protein:[["一掌心",120],["一块",100],["100 g",100]],
  staple:[["一碗",200],["一拳",100],["100 g",100]],
  veg:[["一把",100],["一碟",150],["100 g",100]],
  fruit:[["一个",150],["半个",80],["100 g",100]],
  fat:[["一勺",10],["一小把",20],["15 g",15]],
  other:[["一份",100],["半份",50],["100 g",100]]
};

/* 运动库：mode 决定输入方式
   dist —— 按「距离 + 时长」算，跑步/骑行/游泳/划船（位移型）
   met  —— 按「时长 × MET」算，力量/球类/操课（非位移型）
   kcalPerKm 优先级高于 met：跑步 1.036×体重×公里，与配速几乎无关（文献结论）
   强度档 intensity: low/mid/high，用于训练日的碳水与蛋白目标分档 */
const EXERCISES=[
{n:"跑步",           mode:"dist", kcalPerKm:1.036, m:9.8,  ic:"run",  grp:"有氧",  intensity:"mid"},
{n:"快走",           mode:"dist", kcalPerKm:0.75,  m:4.3,  ic:"walk", grp:"有氧",  intensity:"low"},
{n:"骑行",           mode:"dist", kcalPerKm:0.32,  m:6.8,  ic:"bike", grp:"有氧",  intensity:"mid"},
{n:"游泳",           mode:"dist", kcalPerKm:2.6,   m:8.0,  ic:"swim", grp:"有氧",  intensity:"high"},
{n:"划船机",         mode:"dist", kcalPerKm:0.5,   m:7.0,  ic:"row",  grp:"有氧",  intensity:"mid"},
{n:"跳绳",           mode:"met",  m:12.0, ic:"rope", grp:"有氧",  intensity:"high"},
{n:"椭圆机",         mode:"met",  m:5.5,  ic:"elli", grp:"有氧",  intensity:"low"},
{n:"爬楼梯",         mode:"met",  m:9.0,  ic:"stair",grp:"有氧",  intensity:"mid"},
{n:"HIIT / 波比跳",  mode:"met",  m:8.0,  ic:"hiit", grp:"混合",  intensity:"high"},
{n:"力量训练",       mode:"met",  m:5.0,  ic:"lift", grp:"力量",  intensity:"mid"},
{n:"力量训练(大重量)",mode:"met", m:6.5,  ic:"lift", grp:"力量",  intensity:"high"},
{n:"瑜伽",           mode:"met",  m:3.0,  ic:"yoga", grp:"柔韧",  intensity:"low"},
{n:"普拉提",         mode:"met",  m:3.5,  ic:"yoga", grp:"柔韧",  intensity:"low"},
{n:"篮球",           mode:"met",  m:6.0,  ic:"ball", grp:"球类",  intensity:"mid"},
{n:"足球",           mode:"met",  m:7.0,  ic:"ball", grp:"球类",  intensity:"high"},
{n:"羽毛球",         mode:"met",  m:5.5,  ic:"ball", grp:"球类",  intensity:"mid"},
{n:"网球",           mode:"met",  m:7.3,  ic:"ball", grp:"球类",  intensity:"high"},
{n:"乒乓球",         mode:"met",  m:4.0,  ic:"ball", grp:"球类",  intensity:"low"},
{n:"拳击 / 搏击",    mode:"met",  m:7.8,  ic:"box",  grp:"格斗",  intensity:"high"},
{n:"舞蹈",           mode:"met",  m:4.8,  ic:"dance",grp:"操课",  intensity:"mid"},
{n:"登山 / 徒步",    mode:"met",  m:6.5,  ic:"hike", grp:"户外",  intensity:"mid"},
{n:"滑雪",           mode:"met",  m:7.0,  ic:"ski",  grp:"户外",  intensity:"high"},
];
const INTENSITY_LABEL={low:"低强度",mid:"中等强度",high:"高强度"};

/* ================= 图标系统 ================= */
const ICON_PATHS={
  pencil:'<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z"/><path d="M13.5 6.5l3 3"/>',
  more:'<circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/>',
  today:'<path d="M3 20h18"/><rect x="5" y="11" width="3.2" height="7" rx="1"/><rect x="10.4" y="7" width="3.2" height="11" rx="1"/><rect x="15.8" y="13" width="3.2" height="5" rx="1"/>',
  stock:'<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M12 11.5 20 7"/><path d="M12 11.5v8.5"/><path d="M12 11.5 4 7"/>',
  scan:'<path d="M3 8.5V6a2 2 0 0 1 2-2h2.5"/><path d="M16.5 4H19a2 2 0 0 1 2 2v2.5"/><path d="M21 15.5V18a2 2 0 0 1-2 2h-2.5"/><path d="M7.5 20H6a2 2 0 0 1-2-2v-2.5"/><circle cx="12" cy="12" r="3.2"/>',
  me:'<circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6"/>',
  plus:'<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  trash:'<path d="M4 7h16"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7"/>',
  search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  check:'<path d="M4.5 12.5l5 5 10-11"/>',
  bolt:'<path d="M13 3 5 13.5h6L11 21l8-10.5h-6z"/>',
  flame:'<path d="M12 2c.4 3.4 5.9 5.6 5.9 11a5.9 5.9 0 0 1-11.8 0c0-2.6 1.6-4.2 2.6-5.7.2.9.7 1.6 1.3 2.1.4-2.8.2-5.3 2-7.4z"/>',
  alert:'<path d="M12 4 3 19h18z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>',
  info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="8" r=".6" fill="currentColor"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
  moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
  box:'<path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z"/><path d="M12 11.5 20 7"/><path d="M12 11.5v8.5"/><path d="M12 11.5 4 7"/>',
  refresh:'<path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.5"/><path d="M20 20v-4.5h-4.5"/>',
  scale:'<path d="M12 4v16"/><path d="M6 8h12"/><path d="M6 8 4 14a3 3 0 0 0 4 0z"/><path d="M18 8l-2 6a3 3 0 0 0 4 0z"/>',
  /* --- Phase D 新增 --- */
  run:'<circle cx="14.5" cy="4.5" r="2.1"/><path d="M13 8.5 9.5 11l1.6 3.3L9 20"/><path d="M10.6 14.3 14.6 13l2.4 2.6L20 17"/><path d="M13 8.5l3.2 1.3 2.1 3"/>',
  walk:'<circle cx="13" cy="4.5" r="2"/><path d="M12.6 8.6 10 12l1.2 3.4L9.4 20"/><path d="M11.2 15.4 14 13.6l1.7 2.6 2.3 1.2"/><path d="M12.6 8.6l3 1.7 1.3 2.6"/>',
  bike:'<circle cx="5.5" cy="17" r="3.2"/><circle cx="18.5" cy="17" r="3.2"/><path d="M5.5 17 10 9h4l4.5 8"/><path d="M10 9h6"/><circle cx="14" cy="5.6" r="1.7"/>',
  swim:'<circle cx="16.5" cy="6" r="2"/><path d="M3 12.5 8 10l4 1.5 3.5-2.5 3.5 2"/><path d="M3 17.5c1.6 0 2.4-1 4-1s2.4 1 4 1 2.4-1 4-1 2.4 1 4 1"/><path d="M3 21c1.6 0 2.4-1 4-1s2.4 1 4 1 2.4-1 4-1 2.4 1 4 1"/>',
  row:'<path d="M3 8h8"/><circle cx="15.5" cy="8" r="2.6"/><circle cx="19.5" cy="8" r="1.4"/><path d="M11 8 20.5 8"/><path d="M4 17h16"/><path d="M7 17v-3M17 17v-3"/>',
  rope:'<path d="M8 4v6M16 4v6"/><path d="M6 10c0 6 2.5 10 6 10s6-4 6-10"/><path d="M4 4h4M16 4h4"/>',
  elli:'<ellipse cx="12" cy="16" rx="3" ry="4"/><path d="M9 13 6 6M15 13l3-7"/><path d="M5 4h14"/><path d="M4 21h16"/>',
  stair:'<path d="M3 20h4v-4h4v-4h4V8h4V4"/><path d="M3 20h18"/>',
  hiit:'<path d="M12 2v5M12 17v5M2 12h5M17 12h5"/><path d="M5.6 5.6 9 9M15 15l3.4 3.4M18.4 5.6 15 9M9 15l-3.4 3.4"/><circle cx="12" cy="12" r="2.6"/>',
  lift:'<path d="M4 9v6M7 7v10M17 7v10M20 9v6"/><path d="M7 12h10"/>',
  yoga:'<circle cx="12" cy="4.6" r="2"/><path d="M12 7.2v5.4"/><path d="M5 12.5l7 2.5 7-2.5"/><path d="M6.5 20 12 14.8 17.5 20"/>',
  ball:'<circle cx="12" cy="12" r="8.5"/><path d="M3.6 10h16.8M3.6 14h16.8"/><path d="M12 3.5v17M8 4.2v15.6M16 4.2v15.6"/>',
  box:'<path d="M14 3.6 9 12h3.5L9.5 20.4 15 11.6h-3.6z"/><path d="M4 5h3M4 9h2M20 5h-3M20 9h-2"/>',
  dance:'<circle cx="13" cy="4.4" r="2.1"/><path d="M13 8 9.5 12l2.5 3.5L10 20"/><path d="M11.6 14.6 15.5 13l3 2.6"/><path d="M13 8l3.4 1.6"/>',
  hike:'<path d="M8.5 4.5 3 20h11z"/><path d="M15 8.5 12 20h9z"/><path d="M8 12h2.6M7 16h3"/>',
  ski:'<circle cx="8" cy="4.6" r="2"/><path d="M8 8v6l-2 5"/><path d="M8 14h5l2 5"/><path d="M3 21h18"/><path d="M13 4v10"/>',
  calendar:'<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17"/><path d="M8 3v4M16 3v4"/><path d="M8 14h2M14 14h2M8 17.5h2M14 17.5h2"/>',
  fork:'<path d="M6 3v6a2.5 2.5 0 0 0 5 0V3"/><path d="M8.5 11v10"/><path d="M17 3c-1.6 1.4-2.2 3.6-2.2 6 0 2 .8 3.2 2.2 3.6V21"/>',
  cart:'<circle cx="9.5" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2.5 3h2.7l2.3 12h11l2-8.5H6"/>',
  target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  clockFast:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.4 2"/>',
  chart:'<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15l3.5-4 3 2.4L19 8"/><circle cx="19" cy="8" r="1.4" fill="currentColor"/>',
  chevL:'<path d="M15 5l-7 7 7 7"/>',
  chevR:'<path d="M9 5l7 7-7 7"/>',
  close:'<path d="M6 6l12 12"/><path d="M18 6L6 18"/>'
};
function ic(name,size=24,extra=''){
  return `<svg class="ic-svg" ${extra} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]||''}</svg>`;
}

/* ================= 状态 ================= */
const KEY="shishi_v2";
let S=load();
function load(){
  // 兼容旧版数据
  try{const old=localStorage.getItem("shishi_v1");
    if(old&&!localStorage.getItem(KEY)){const o=JSON.parse(old);o.api=o.api||{base:"",model:"",key:""};localStorage.setItem(KEY,JSON.stringify(o))}
  }catch(e){}
  try{const s=localStorage.getItem(KEY);if(s){
    const o=JSON.parse(s);
    o.wt=o.wt||{};                       // 体重日志（按日期）
    o.bestStreak=o.bestStreak||0;        // 历史最长连续记录天数
    o.plan=o.plan||{};                   // 训练日程 { "YYYY-MM-DD": {type,name,min,km,intensity,rest:bool} }
    o.myEx=o.myEx||[];                   // 用户自定义运动项目
    o.restKcal=o.restKcal||0;            // 休息日目标调整（kcal，可为负）
    if(typeof o.hideInstall!=="boolean")o.hideInstall=false;   // 是否关掉了首页的「装到桌面」提示
    if(typeof o.useAdaptive!=="boolean")o.useAdaptive=false;   // 是否用自适应 TDEE 替代公式估算
    return o;
  }}catch(e){}
  return {profile:null,inv:[],log:{},ex:{},wt:{},plan:{},myEx:[],restKcal:0,
          bestStreak:0,hideInstall:false,useAdaptive:false,
          api:{base:"https://open.bigmodel.cn/api/paas/v4",model:"glm-4v-flash",key:""},theme:""};
}
function save(){try{norm();localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast("存储空间不足")}}
/** 把关键容器字段兜底成正确类型。外部改坏数据 / 导入残缺备份时不让页面崩。 */
function norm(){
  if(!S||typeof S!=="object")return;
  if(!S.ex||typeof S.ex!=="object"||Array.isArray(S.ex))S.ex={};
  if(!S.plan||typeof S.plan!=="object"||Array.isArray(S.plan))S.plan={};
  if(!S.log||typeof S.log!=="object"||Array.isArray(S.log))S.log={};
  if(!S.wt||typeof S.wt!=="object"||Array.isArray(S.wt))S.wt={};
  if(!Array.isArray(S.inv))S.inv=[];
  if(!Array.isArray(S.myEx))S.myEx=[];
}
function todayStr(){const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);

/** 按食物名猜分类：内置库精确匹配 → 部分匹配 → 关键字规则 */
function guessCat(name){
  const n=(name||"").toLowerCase().trim();
  if(!n)return "other";
  const hit=FOODS.find(f=>f.n.toLowerCase()===n);
  if(hit)return hit.cat;
  const part=FOODS.find(f=>f.n.toLowerCase().includes(n)||n.includes(f.n.toLowerCase()));
  if(part)return part.cat;
  const KW=[
    [/肉|鸡|鸭|牛|猪|羊|鱼|虾|蟹|贝|蛋|奶|乳|豆腐|豆浆|肠|胸|腿|翅|protein/i,"protein"],
    [/米|饭|面|粉|馒|包|饺|糙|荞|麦|燕麦|玉米|薯|土豆|staple|rice|bread|pasta/i,"staple"],
    [/菜|蔬|椒|瓜|茄|葱|姜|蒜|菇|蘑|菠|芹|萝卜|西兰花|生菜|白菜|番茄|veg/i,"veg"],
    [/果|苹|香蕉|橙|橘|柚|葡|桃|梨|莓|荔枝|芒果|猕猴桃|西瓜|fruit/i,"fruit"],
    [/油|坚果|花生|核桃|杏仁|腰果|芝麻|黄油|橄榄|巴旦木|开心果|榛子|碧根果|夏威夷果|瓜子|南瓜子|松子|nut|oil/i,"fat"],
  ];
  for(const [re,c] of KW) if(re.test(n)) return c;
  return "other";
}
const $=id=>document.getElementById(id);
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function toast(m){const t=$("toast");t.textContent=m;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("on"),2200)}
function closeSheet(){$("ovl").classList.remove("on")}
function sheet(html){$("sheet").innerHTML=html;$("ovl").classList.add("on")}

/* ================= 主题 ================= */
function applyTheme(){
  const t=S.theme||(matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light");
  document.documentElement.style.colorScheme=t;
  const b=$("themeBtn");if(b)b.innerHTML=ic(t==="dark"?"sun":"moon",20);
}
function toggleTheme(){S.theme=(S.theme==="dark"||(!S.theme&&matchMedia("(prefers-color-scheme:dark)").matches))?"light":"dark";save();applyTheme()}

/* ================= 装到桌面（PWA 安装） =================

   为什么要有这块：用户第一次在手机浏览器里打开时，不知道要去浏览器菜单里
   找「添加到主屏幕」——这个入口在不同浏览器里叫法、位置都不一样，
   安卓 Chrome 叫「安装应用」、UC/QQ 浏览器叫「添加到桌面」、
   iOS Safari 只能通过分享菜单。所以这里主动把入口摆到应用里：

     · 安卓 Chrome / Edge：捕获 beforeinstallprompt，一键弹系统原生安装框
     · iOS Safari：没有 beforeinstallprompt，只能给图文步骤
     · 其它浏览器：给「去菜单里找」的提示

   已经在桌面版运行（standalone）时整块隐藏，不再打扰。
*/
let deferredPrompt=null;

/** 是否已经作为独立 App 运行（不是浏览器标签页） */
function isStandalone(){
  try{
    if(window.navigator.standalone===true)return true;               // iOS Safari
    if(matchMedia&&matchMedia("(display-mode: standalone)").matches)return true;
    if(matchMedia&&matchMedia("(display-mode: minimal-ui)").matches)return true;
  }catch(e){}
  return false;
}
function isIOS(){
  const ua=navigator.userAgent||"";
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
}
/** 当前环境能不能一键安装（只有捕获到 beforeinstallprompt 才算） */
function canOneTapInstall(){ return !!deferredPrompt }

/** 各平台「怎么装」的步骤文案 */
function installStepsHtml(){
  const ios=isIOS();
  if(canOneTapInstall())
    return `<div class="hint"><span>装到桌面后，点图标就能直接打开，不用每次输网址；<b>断网也能记录</b>。</span></div>
      <button class="btn-g" style="margin-top:12px" onclick="doInstall()">${ic("box",17)}一键添加到桌面</button>`;
  if(ios)
    return `<div class="hint"><span>iPhone 要用 <b>Safari</b> 打开本页，然后：点底部中间的 <b>分享按钮</b>（方框带向上箭头）→ 往下滑 → 选 <b>「添加到主屏幕」</b> → 右上角「添加」。</span></div>
      <div class="hint" style="margin-top:8px"><span style="color:var(--warn)">微信 / QQ 内置浏览器打开的不行，要先在右上角选「用 Safari 打开」。</span></div>`;
  return `<div class="hint"><span>点浏览器右上角的菜单（<b>⋮</b> 或 <b>≡</b>），选 <b>「添加到主屏幕」</b> 或 <b>「安装应用」</b>。</span></div>
    <div class="hint" style="margin-top:8px"><span>找不到的话，换 <b>Chrome</b> 或 <b>Edge</b> 打开本页，菜单里一定有这一项。</span></div>`;
}

/** 「怎么装」抽屉：没法一键装时，把步骤摆出来，而不是让人去翻浏览器菜单 */
function showInstallHelp(){
  sheet(`<h3>${ic("box",18)}装到手机桌面</h3>${installStepsHtml()}
    <button class="btn-o" style="margin-top:16px" onclick="closeSheet()">知道了</button>`);
}

function renderInstall(){
  const home=$("instBox"), me=$("instBoxMe");
  if(!home&&!me)return;
  // 已作为独立 App 运行 → 整块消失，不再打扰
  if(isStandalone()){
    if(home)home.innerHTML="";
    if(me)me.innerHTML="";
    return;
  }
  const oneTap=canOneTapInstall();
  // 今日页：只放一条细横幅，不能把「今日还差」挤出首屏
  if(home)home.innerHTML = S.hideInstall ? "" :
    `<div class="instbar">
      ${ic("box",15)}
      <span class="tx">装到桌面，断网也能记</span>
      <button class="btn-s" onclick="${oneTap?"doInstall()":"showInstallHelp()"}">${oneTap?"去安装":"怎么装"}</button>
      <button class="instx" onclick="hideInstall()" aria-label="不再提示">${ic("close",14)}</button>
    </div>`;
  // 我的页：完整说明，随时想装都能找到
  if(me)me.innerHTML=`<div class="card instcard">
    <h3>${ic("box",18)}装到手机桌面<span class="count">推荐</span></h3>
    ${installStepsHtml()}
  </div>`;
}

/** 触发系统原生安装框 */
function doInstall(){
  if(!deferredPrompt){ renderInstall(); return }
  const p=deferredPrompt;
  deferredPrompt=null;                    // 一个 prompt 只能用一次
  p.prompt();
  if(p.userChoice&&p.userChoice.then){
    p.userChoice.then(r=>{
      if(r&&r.outcome==="accepted")toast("已添加到桌面");
      renderInstall();
    }).catch(()=>renderInstall());
  }else renderInstall();
}
/** 「以后再说」：只关掉今日页那张，我的页仍然保留入口 */
function hideInstall(){
  S.hideInstall=true;save();renderInstall();
  toast("已隐藏，需要时去「我的」页");
}

/* ================= 计算（含边界约束） =================

   ── 训练消耗模型（分两类）──────────────────────────────
   位移型（跑/走/骑/游/划）：热量 ≈ 单位体重单位距离的固定系数 × 体重 × 公里数
     跑步 kcal = 1.036 × 体重(kg) × 距离(km)   ← 与配速几乎无关，这是文献结论
     所以「跑了 5 公里，用时 30 分钟」和「跑了 5 公里，用时 25 分钟」
     消耗几乎一样——这比「按分钟 × MET」更接近事实。
   非位移型（力量/球类/操课）：kcal = MET × 体重 × 小时数
   若用户填了平均心率，可改用 Keytel 等人（2005）心率公式，
   在有氧区间（HR 90–150）通常比 MET 更贴近个体：
     男：(−55.0969 + 0.6309×HR + 0.1988×W + 0.2017×A) / 4.184   kcal/min
     女：(−20.4022 + 0.4472×HR − 0.1263×W + 0.074×A) / 4.184    kcal/min
   最大心率用 Tanaka 公式 208 − 0.7×年龄（比 220−年龄 更准）。

   ── 训练日 vs 休息日 ────────────────────────────────
   是否训练日 = 今天有日程计划（且非休息）或已记录训练。
   训练日：热量目标 = TDEE + 实际训练消耗 + 目标调整
   休息日：热量目标 = TDEE + 目标调整 + 休息日调整（默认 0，可设负值制造缺口）
   蛋白质：训练日按强度上调 0.2–0.4 g/kg；休息日按基础 pk。
   碳水：按 g/kg 分档（休息 3.5 / 中等 5 / 高强度 6.5），但受总热量约束。
   膳食纤维：IOM 基础值（男<50 38g / 男≥50 30g / 女<50 25g / 女≥50 21g），
             训练日 +5g（运动量大、能量摄入高）。
*/

/** 跑步类：距离法。km 与 min 至少给一个 */
function distKcal(w, kcalPerKm, km){
  if(!w||!kcalPerKm||!km||km<=0)return 0;
  return kcalPerKm*w*km;
}
/** Keytel 心率公式：返回 kcal/min，参数不合法或算出负值返回 0
    注意：该公式在低心率下会给出负值（男约 <57bpm、女约 <63bpm 交叉），
    实测正常运动心率区间（90–150）内结果可靠，此处只做负数钳制。 */
function hrKcalPerMin(sex, hr, w, age){
  if(!hr||!w||!age)return 0;
  const v = sex==="m"
    ? (-55.0969 + 0.6309*hr + 0.1988*w + 0.2017*age) / 4.184
    : (-20.4022 + 0.4472*hr - 0.1263*w + 0.074*age)  / 4.184;
  return v>0?v:0;
}
/** Tanaka 最大心率 */
function maxHR(age){ return age?Math.round(208-0.7*age):0 }
/** hr 落在哪个心率区（1–5），用于提示强度 */
function hrZone(hr, age){
  const m=maxHR(age); if(!m||!hr)return 0;
  const r=hr/m;
  if(r<0.6)return 1; if(r<0.7)return 2; if(r<0.8)return 3; if(r<0.9)return 4; return 5;
}
/** 统一入口：算一次训练消耗。ex = {mode,met,kcalPerKm,min,km,hr} */
function exBurn(ex, p){
  if(!p||!p.w)return 0;
  const min=Number(ex.min)||0, km=Number(ex.km)||0, hr=Number(ex.hr)||0;
  if(hr&&min>0){
    const per=hrKcalPerMin(p.sex,hr,p.w,p.age);
    if(per>0)return Math.round(per*min);
  }
  if(ex.mode==="dist"&&km>0)return Math.round(distKcal(p.w,ex.kcalPerKm||1.036,km));
  if(min>0)return Math.round((ex.met||5)*p.w*(min/60));
  return 0;
}
/** 某天的训练记录 */
function exOf(day){ norm(); return S.ex[day||todayStr()]||[] }
/** 某天是否训练日：有计划（非休息）或已记录训练 */
function isTrainDay(day){
  const d=day||todayStr();
  norm();
  const pl=S.plan[d];
  if(pl&&!pl.rest)return true;
  return exOf(d).length>0;
}
/** 当天计划的强度档：high/mid/low（取计划或最高一次训练） */
function dayIntensity(day){
  const d=day||todayStr();
  norm();
  const pl=S.plan[d];
  const order={low:1,mid:2,high:3};
  let best=pl&&pl.intensity?pl.intensity:null;
  exOf(d).forEach(e=>{
    const iv=e.intensity||"mid";
    if(!best||order[iv]>order[best])best=iv;
  });
  return best;
}

/** 膳食纤维目标：IOM 基础值 + 训练日加成 */
function fiberTarget(p, trainDay){
  if(!p||!p.age)return 25;
  let base;
  const older=p.age>=50;
  if(p.sex==="m")base=older?30:38; else base=older?21:25;
  return Math.round(base+(trainDay?5:0));
}
/** 按训练强度给的碳水 g/kg */
const CARB_PK={rest:3.5,low:4.0,mid:5.0,high:6.5};

/* ================= 日期工具 ================= */
function dOf(s){return new Date(s+"T00:00:00")}
function ymd(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function dayDiff(a,b){return Math.round((dOf(a)-dOf(b))/86400000)}
function dayBefore(s,i){const d=dOf(s);d.setDate(d.getDate()-i);return ymd(d)}
function dayRange(endDay,n){const a=[];for(let i=n-1;i>=0;i--)a.push(dayBefore(endDay,i));return a}

/* ================= 自适应 TDEE =================

   原理就是能量守恒：
       摄入 − 消耗 = 身体储存的能量变化
   →  TDEE = 日均摄入 − 日均储存变化
   储存变化 = 趋势体重变化率(kg/天) × 7700 kcal/kg
     （7700 是「脂肪 9400 / 瘦体重 1800」的常用混合近似）

   为什么比公式准：Mifflin-St Jeor 是人群回归，个体 NEAT 与代谢适应差异可达 ±10–15%；
   自适应是拿你自己的数据反推，误差只剩记录误差。

   为什么识食特别适合做这个：它需要「精确摄入」+「连续体重」两个输入。
   多数 App 缺的是前者 —— 搜食物选份量本身误差就大，反推出来自然不准；
   而按克扣库存的记账方式，摄入精度天然高一个量级。

   注意 唯一致命陷阱：漏记整餐会系统性低估 TDEE
      （以为你吃得少 → 推出消耗也低 → 目标越调越低 → 越记越不准）。
      所以必须识别「记录不完整」的日子并剔除，而不是照单全收。

   实现上刻意不调用 calc()，避免相互递归。
*/
const ADAPT={win:14,minValid:10,completeRatio:0.6,kcalPerKg:7700,minSpan:14,minPts:3};

function adaptiveTDEE(){
  const out={ok:false,reason:"",valid:0,excluded:0,exList:[],span:0,pts:0,
             slope:0,avgIntake:0,avgEx:0,base:0,tdee:0,formula:0,diff:0};
  const p=S.profile;
  if(!p||!p.w||!p.h||!p.age){out.reason="先填身体数据";return out}
  const bmr=10*p.w+6.25*p.h-5*p.age+(p.sex==="m"?5:-161);
  const refTdee=bmr*p.act;          // 仅用于判断「这天记录是否完整」，不参与最终结果
  const today=todayStr();

  // ── 1. 体重趋势斜率：最小二乘，x 用「真实天数」而不是序号 ──
  //    用序号是错的：如果你连记一周然后停三周，斜率会被严重扭曲。
  const ws=Object.keys(S.wt||{}).filter(d=>typeof S.wt[d]==="number"&&isFinite(S.wt[d])).sort();
  if(ws.length<ADAPT.minPts){out.pts=ws.length;out.reason="至少记录 3 次体重";return out}
  const last=ws[ws.length-1];
  const use=ws.filter(d=>dayDiff(last,d)<=ADAPT.win+14);
  out.pts=use.length;
  if(use.length<ADAPT.minPts){out.reason="近一个月内体重记录太少";return out}
  const x0=dOf(last).getTime();
  const xs=use.map(d=>(x0-dOf(d).getTime())/86400000);
  const ys=use.map(d=>S.wt[d]);
  const span=Math.max.apply(null,xs)-Math.min.apply(null,xs);
  out.span=Math.round(span);
  if(span<ADAPT.minSpan){out.reason="体重记录跨度不足 "+ADAPT.minSpan+" 天";return out}
  const n=xs.length,mx=xs.reduce((a,b)=>a+b,0)/n,my=ys.reduce((a,b)=>a+b,0)/n;
  let num=0,den=0;
  for(let i=0;i<n;i++){num+=(xs[i]-mx)*(ys[i]-my);den+=(xs[i]-mx)*(xs[i]-mx)}
  if(!den){out.reason="体重没有变化，算不出趋势";return out}
  const slope=-(num/den);            // kg/天，正数 = 在涨
  out.slope=Math.round(slope*1000)/1000;

  // ── 2. 日均摄入：剔除「没记录」与「明显漏记」的日子 ──
  const days=dayRange(today,ADAPT.win);
  let sum=0,valid=0,ex=0;
  days.forEach(function(d){
    const t=dayTotals(d);
    if(!t.k){ex++;out.exList.push({d,why:"没记录"});return}
    if(t.k<refTdee*ADAPT.completeRatio){ex++;out.exList.push({d,why:"可能漏记"});return}
    sum+=t.k;valid++;
  });
  out.valid=valid;out.excluded=ex;
  if(valid<ADAPT.minValid){
    out.reason="有效记录 "+valid+" 天，至少需要 "+ADAPT.minValid+" 天";return out;
  }
  out.avgIntake=Math.round(sum/valid);

  // ── 3. 平均训练消耗 ──
  //    自适应值测的是「总消耗」，里面已经包含了你惯常的训练。
  //    所以要先减掉平均训练量得到「非训练基线」，再把当天的实际训练加回去，
  //    否则规律训练的人会被重复计算一次。
  let exSum=0;
  days.forEach(function(d){
    exSum+=(S.ex[d]||[]).reduce(function(a,x){return a+(Number(x.kcal)||0)},0);
  });
  out.avgEx=Math.round(exSum/days.length);

  // ── 4. 反推 ──
  out.tdee=Math.round(out.avgIntake-slope*ADAPT.kcalPerKg);
  out.base=out.tdee-out.avgEx;
  out.formula=Math.round(refTdee);
  out.diff=out.tdee-out.formula;
  const lo=Math.round(bmr),hi=Math.round(bmr*2.5);
  out.lo=lo;out.hi=hi;
  if(out.tdee<lo||out.tdee>hi){
    out.reason="推算 "+out.tdee+" kcal 超出合理范围（"+lo+"–"+hi+"），多半是记录不全";
    return out;
  }
  out.ok=true;
  return out;
}

function calc(day){
  norm();
  const p=S.profile;if(!p||!p.w||!p.h||!p.age)return null;
  const d=day||todayStr();
  const bmr=10*p.w+6.25*p.h-5*p.age+(p.sex==="m"?5:-161);
  /* 自适应 TDEE：开启且数据够用时，用它替代公式估算的基线。
     注意用的是 adapt.base（已减去平均训练量），当日训练消耗仍会在下面正常叠加，
     这样规律训练的人不会被重复计算。 */
  let tdee=bmr*p.act;
  let adaptUsed=null;
  if(S.useAdaptive){
    const a=adaptiveTDEE();
    if(a.ok){tdee=a.base;adaptUsed={tdee:a.tdee,base:a.base,avgEx:a.avgEx,valid:a.valid,slope:a.slope}}
  }
  const exK=exOf(d).reduce((a,e)=>a+(Number(e.kcal)||0),0);
  const training=isTrainDay(d);
  const intensity=dayIntensity(d);
  const restAdj=Number(S.restKcal)||0;
  // 目标热量下限保护：不低于 BMR 的 1.1 倍，避免极端节食
  const raw=tdee+exK+Number(p.adj)+(training?0:restAdj);
  const floor=bmr*1.1;
  const target=Math.round(Math.max(raw,floor));
  const floorApplied=raw<floor;
  // 蛋白质：训练日按强度上调（低 +0.1 / 中 +0.2 / 高 +0.4 g/kg）
  const boost=training?({low:0.1,mid:0.2,high:0.4}[intensity||"mid"]||0.2):0;
  let pg=Math.round((p.pk+boost)*p.w);
  const pgCap=Math.round(target*0.35/4);
  const pgCapped=pg>pgCap; if(pgCapped)pg=pgCap;

  /* 脂肪：目标 25–30% 热量，下限 0.5g/kg（必需脂肪酸）。
     训练日取 28%（激素合成需要），休息日取 30%（碳水低时补偿能量）。 */
  const fatPct=training?0.28:0.30;
  let fg=Math.round(target*fatPct/9);
  const fgFloor=Math.round(p.w*0.5); if(fg<fgFloor)fg=fgFloor;
  let fgCap=Math.round(target*0.35/9); if(fg>fgCap)fg=fgCap;

  /* 碳水：按 g/kg 分档给出「期望值」，但**取剩余热量**为准——
     这样不会有热量空洞，也不会因为分档系数把脂肪顶到不合理的高度。
     分档的作用体现在：训练日 target 更高 → 剩余热量更多 → 碳水自然更多。
     cg 与 carbTarget 的差值就是「训练带来的碳水增量」，正好用来做文案。 */
  const cKey=training?(intensity==="high"?"high":intensity==="low"?"low":"mid"):"rest";
  const carbTarget=Math.round(CARB_PK[cKey]*p.w);
  const cgRest=Math.max(0,Math.round((target-pg*4-fg*9)/4));
  let cg=cgRest, cgCapped=false;
  // 只在下限方向用 g/kg 兜底：剩余热量算出来比 g/kg 少，说明热量预算太紧
  // 此时不再强行加碳水（那会顶爆热量），只在文案里提示。
  const cgLow=cg<carbTarget*0.75;
  // 纤维
  const fb=fiberTarget(p,training);
  /* ── 限量项（与「目标项」语义相反：目标项要吃到，限量项要压住）
     依据 GB 28050 强制标示的 7 项 + 中国居民膳食指南：
       钠        < 2000 mg   （NRV 2000mg，也是 WHO 推荐上限）
       饱和脂肪  < 总热量的 10%（指南：饱和脂肪酸供能比 <10%）
       糖        < 总热量的 10%，且不超过 50 g（指南：添加糖 <25g 更佳，上限 50g）
     注意：糖这里按「单糖+双糖」算（含乳糖、果糖），所以牛奶水果也会计入 ——
     与国标「糖」的口径一致，不等于「添加糖」。 */
  const naLimit=2000;
  const sfLimit=Math.max(10,Math.round(target*0.10/9));
  const sgLimit=Math.min(50,Math.max(15,Math.round(target*0.10/4)));
  return {bmr:Math.round(bmr),tdee:Math.round(tdee),tdeeFormula:Math.round(bmr*p.act),
          exK:Math.round(exK),target,pg,fg,cg,fb,
          naLimit,sfLimit,sgLimit,adaptUsed,
          floorApplied,pgCapped,cgCapped,fgCapped:false,cgLow,training,intensity,cKey,boost,restAdj,day:d,
          carbTarget};
}
/** 某天的饮食合计（含纤维） */
function dayTotals(day){
  norm();
  const l=S.log[day||todayStr()]||[];
  return l.reduce((a,e)=>{a.k+=e.k||0;a.p+=e.p||0;a.f+=e.f||0;a.c+=e.c||0;a.fb+=e.fb||0;
    a.na+=e.na||0;a.sf+=e.sf||0;a.sg+=e.sg||0;return a},
                  {k:0,p:0,f:0,c:0,fb:0,na:0,sf:0,sg:0});
}
function scale(o,g){const r=(g||0)/100;return {k:(o.k||0)*r,p:(o.p||0)*r,f:(o.f||0)*r,c:(o.c||0)*r,fb:(o.fb||0)*r,
  na:(o.na||0)*r,sf:(o.sf||0)*r,sg:(o.sg||0)*r}}

/* ================= 页面切换 ================= */
function go(id){
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("on"));
  $(id).classList.add("on");
  document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.t===id));
  if(id==="tab-today")renderToday();
  if(id==="tab-train")renderTrain();
  if(id==="tab-stock")renderStock();
  if(id==="tab-me")renderMe();
  window.scrollTo(0,0);
}

/* ================= 今日 ================= */
function renderToday(){
  const c=calc(),t=dayTotals(),d=todayStr();
  let h="";
  if(!S.profile){
    h+=`<div class="card"><div class="empty">${ic("scale",40,'style="color:var(--line-2);margin:0 auto 14px"')}
      <div class="steps">
        <span><b class="stepnum">1</b>去「我的」填身体数据</span>
        <span><b class="stepnum">2</b>去「拍照」或「库存」添加食物</span>
        <span><b class="stepnum">3</b>回来看每天该吃多少、吃了多少</span>
      </div></div></div>`;
    $("todayBox").innerHTML=h;return;
  }
  const pct=c.target?Math.min(100,Math.round(t.k/c.target*100)):0;
  const over=t.k>c.target;
  const kcalLeft=Math.round(c.target-t.k);
  /* 热量主指标：用「条形 + 数字」而不是环形图。
     · NN/g：长度是最准确的视觉编码，角度/面积最差；环形图还挖空，更难读
     · Apple HIG：Activity 圆环保留给「移动/锻炼/站立」，不得挪用
     · 状态用文字说明（还差 / 已达标 / 已超出），不单靠红绿 —— 约 4.5% 的人有色觉障碍 */
  const kcalState = kcalLeft>0 ? `还差 ${kcalLeft} kcal`
    : kcalLeft<0 ? `已超出 ${Math.abs(kcalLeft)} kcal`
    : `正好达标`;
  const mm=(v,tg,col,label,dec)=>{
    const p=tg?Math.min(100,Math.round(v/tg*100)):0;
    const left=tg-v;
    return `<div class="mac"><span class="lbl"><i class="dot" style="background:${col}"></i>${label}</span><div class="bar"><i style="width:${p}%;background:${col}"></i></div>
      <em>${Math.round(v)}<span style="color:var(--line-2)">/${tg}</span></em></div>`;
  };

  // ---- 今日日程徽章 ----
  const pl=S.plan[d];
  const tr=c.training;
  let dayTag="";
  if(tr){
    const iv=c.intensity?INTENSITY_LABEL[c.intensity]:"";
    dayTag=`<span class="chip" style="background:var(--accent-soft)">${ic("flame",12)}训练日${pl&&pl.name?" · "+esc(pl.name):""}${iv?" · "+iv:""}</span>`;
  }else{
    dayTag=`<span class="chip neutral">${ic("yoga",12)}休息日</span>`;
  }

  h+=`<div class="card">
    <div class="daytag">${dayTag}
      <button class="btn-s" style="padding:4px 9px;font-size:11.5px;margin-left:auto" onclick="planSheet('${d}')">${pl?"改日程":"排日程"}</button>
    </div>
    <div class="kcalhero${over?" over":""}" role="group" aria-label="今日热量进度">
      <div class="kh-lab">今日热量</div>
      <div class="kh-num"><b>${Math.round(t.k)}</b><em>/ ${c.target}</em><span class="kh-u">kcal</span></div>
      <div class="kh-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"
           aria-label="热量已完成 ${pct}%，${kcalState}"><i style="width:${pct}%"></i></div>
      <div class="kh-foot"><b>${kcalState}</b><span>已完成 ${pct}%</span></div>
    </div>
    <div class="hint" style="justify-content:center;margin-top:12px"><span>基础代谢 ${c.bmr} ＋ 日常 ${c.tdee-c.bmr} ＋ 训练 ${c.exK}${Number(S.profile.adj)?` ${S.profile.adj>0?"＋":"−"} ${Math.abs(S.profile.adj)} 目标`:""}${!tr&&c.restAdj?` ${c.restAdj>0?"＋":"−"} ${Math.abs(c.restAdj)} 休息日`:""}</span></div>
    ${c.floorApplied?`<div class="hint" style="margin-top:8px;color:var(--warn)">${ic("alert",14)}<span>已应用热量下限保护（不低于基础代谢 1.1 倍），避免过度节食</span></div>`:""}
    ${c.pgCapped?`<div class="hint" style="margin-top:8px">${ic("info",14)}<span>蛋白质目标已限制在总热量 35% 以内</span></div>`:""}
    ${c.cgLow?`<div class="hint" style="margin-top:8px">${ic("info",14)}<span>碳水 ${c.cg}g 低于 ${CARB_PK[c.cKey]} g/kg 的参考值（${c.carbTarget}g）：当前热量预算较紧，可按需放宽目标</span></div>`:""}
    ${mm(t.p,c.pg,"var(--d-protein)","蛋白")}
    ${mm(t.f,c.fg,"var(--d-fat)","脂肪")}
    ${mm(t.c,c.cg,"var(--d-carb)","碳水")}
    ${mm(t.fb,c.fb,"var(--d-fiber)","纤维")}
    <div class="hint" style="margin-top:10px"><span>${tr?`训练日：蛋白 +${Math.round(c.boost*S.profile.w)}g、碳水参考 ${CARB_PK[c.cKey]} g/kg`:`休息日：碳水参考 ${CARB_PK.rest} g/kg，热量未加成训练消耗`} · 脂肪 ${Math.round(c.fg*9/c.target*100)}% · 纤维 ${c.fb}g${tr?"（训练日 +5g）":""}</span></div>
  </div>`;

  // ---- 实时剩余预算（核心：已吃的从目标里扣） ----
  const gap=gapToday();
  const sug=feedSuggest();
  h+=`<div class="card remain">
    <div>
      <div class="hint" style="margin:0"><span>${gap.kcal>0?"今天还能吃":"已超出"}</span></div>
      <div class="rmk" style="color:${gap.kcal>0?"var(--ink)":"var(--warn)"}">${Math.abs(Math.round(c.target-t.k))}<span class="unit">kcal</span></div>
      <div class="hint" style="margin-top:2px"><span>${gap.p>0?`蛋白还差 ${Math.round(gap.p)} g`:"蛋白已达标"} · ${gap.fb>0?`纤维还差 ${Math.round(gap.fb)} g`:"纤维已达标"}</span></div>
    </div>
    <button class="btn-g" style="width:auto;padding:13px 20px" onclick="quickSheet()">${ic("bolt",18)}快速记录</button>
  </div>`;

  // ---- 剩余营养清单：每一项都能看到「还差多少」+ 用库存怎么补 ----
  const rows=[
    ["kcal","热量",c.target-t.k,"","var(--accent)"],
    ["p","蛋白质",c.pg-t.p," g","var(--d-protein)"],
    ["c","碳水",c.cg-t.c," g","var(--d-carb)"],
    ["f","脂肪",c.fg-t.f," g","var(--d-fat)"],
    ["fb","膳食纤维",c.fb-t.fb," g","var(--d-fiber)"],
  ];
  /* 吃超时：保留信息（不该隐藏），但去掉「警告」感。
     CHI 2015 研究显示负面提示（negative nudge）会显著提高弃用率 ——
     用户看到「超标 300」的感受是「我搞砸了」，而不是「我要调整」。
     所以：措辞改中性（已超出），颜色用 amber 而不是危险红。 */
  let anyOver=false;
  h+=`<div class="card"><h3>${ic("target",18)}还差多少<span class="count">实时扣减</span></h3>
    <div class="gaplist">${rows.map(([k,lab,v,unit,col])=>{
      const neg=v<0;
      if(neg)anyOver=true;
      return `<div class="gaprow"><span class="gl"><i style="background:${col}"></i>${lab}</span>
        <b style="color:${neg?"var(--warn)":"var(--ink)"}">${neg?"已超出 "+(k==="kcal"?Math.round(-v):(-v).toFixed(1)):(k==="kcal"?Math.round(v):Math.round(v*10)/10)}${unit||" kcal"}</b></div>`;
    }).join("")}</div>
    ${anyOver?`<div class="hint" style="margin-top:10px"><span>单项超出很常见，看一周的整体趋势比盯单日更有意义。</span></div>`:""}
    ${sug?`<div class="sugg">${ic("bolt",14)}<span>库存里 <b>${sug.need}g ${esc(sug.food.n)}</b> 可补足${sug.label}</span>
      <button class="btn-s" style="margin-left:auto;flex-shrink:0" onclick="eatSheet('${sug.food.id}')">去记录</button></div>`
      :`<div class="sugg" style="background:var(--surface-2);color:var(--ink-3)">${ic("bolt",14)}<span>库存里还没能精准补缺口的食材</span></div>`}
  </div>`;

  // ---- 限量项：钠 / 饱和脂肪 / 糖 ----
  // 语义和上面的「还差多少」相反 —— 那三项是要吃够，这三项是要压住。
  // 依据 GB 28050 强制标示的 7 项 + 《中国居民膳食指南》。
  const lim=[
    ["na","钠",t.na,c.naLimit,"mg","var(--d-sodium)"],
    ["sf","饱和脂肪",t.sf,c.sfLimit,"g","var(--d-satfat)"],
    ["sg","糖",t.sg,c.sgLimit,"g","var(--d-sugar)"],
  ];
  const limOver=lim.filter(x=>x[2]>x[3]);
  h+=`<div class="card"><h3>${ic("alert",18)}今日限量<span class="count">压住，不是吃够</span></h3>
    <div class="limlist">${lim.map(([k,lab,v,cap,unit,col])=>{
      const p=cap?Math.min(100,Math.round(v/cap*100)):0;
      const over=v>cap;
      const fmt=x=>Math.abs(x)>=100?Math.round(x):Math.round(x*10)/10;
      return `<div class="limrow">
        <div class="lh"><span class="gl"><i style="background:${col}"></i>${lab}</span>
          <b style="color:${over?"var(--warn)":"var(--ink)"}">${fmt(v)}<em>/${cap} ${unit}</em></b></div>
        <div class="lbar"><i style="width:${p}%;background:${over?"var(--warn)":col}"></i></div>
        <div class="lf">${over?`已超出 ${fmt(v-cap)} ${unit}`:`还剩 ${fmt(cap-v)} ${unit} 额度`}</div>
      </div>`;
    }).join("")}</div>
    <div class="hint" style="margin-top:10px"><span>GB 28050《预包装食品营养标签通则》把这三项列为强制标示，就是因为「吃多了」比「吃少了」更常见。单项超出很常见，看一周整体趋势更有意义。</span></div>
  </div>`;

  // ---- 今日日程卡 ----
  if(pl){
    h+=`<div class="card" style="padding:14px 16px">
      <h3 style="margin-bottom:10px">${ic("calendar",18)}今日日程<span class="count">${pl.rest?"休息":(pl.min?pl.min+" 分钟":"未设时长")}</span></h3>
      <div class="plrow">
        <span class="pl-ic">${ic(pl.rest?"yoga":(exIcon(pl.type)),20)}</span>
        <div style="flex:1;min-width:0">
          <div class="nm">${pl.rest?"休息日":esc(pl.name||pl.type||"训练")}</div>
          <div class="dt">${pl.rest?"主动恢复，不安排训练":[
            pl.km?pl.km+" km"+(pl.min?" · "+pl.min+" 分钟 · "+paceStr(pl.km,pl.min):""):(pl.min?pl.min+" 分钟":""),
            pl.intensity?INTENSITY_LABEL[pl.intensity]:""
          ].filter(Boolean).join(" · ")}</div>
        </div>
        ${!pl.rest&&(S.ex[d]||[]).length?"":(!pl.rest?`<button class="btn-s" onclick="quickExSheet()">去完成</button>`:"")}
      </div>
      ${!pl.rest&&!pl.km&&pl.min?`<div class="hint" style="margin-top:9px"><span>预计消耗约 ${exBurn({mode:"met",met:(EXERCISES.find(e=>e.n===pl.type)||{}).m||5,min:pl.min},S.profile)} kcal</span></div>`:""}
    </div>`;
  }

  const l=S.log[d]||[];
  h+=`<div class="card"><h3>${ic("stock",18)}今日饮食<span class="count">${l.length} 笔</span></h3>`;
  if(!l.length)h+=`<div class="empty">${ic("stock",32,'style="color:var(--line-2);margin:0 auto 8px"')}还没记录<br>去「库存」点「吃掉」</div>`;
  h+=l.map((e,i)=>`<div class="item"><div><div class="nm">${esc(e.n)}<span class="g">${e.g}g</span>${e.out?`<span class="chip neutral">外食</span>`:""}</div>
     <div class="dt">P ${(e.p||0).toFixed(1)} · F ${(e.f||0).toFixed(1)} · C ${(e.c||0).toFixed(1)} · 纤 ${(e.fb||0).toFixed(1)} g</div></div>
     <div style="display:flex;align-items:center;gap:10px"><span class="tagk">${Math.round(e.k)} kcal</span>
     <button class="btn-r" onclick="delLog(${i})">删</button></div></div>`).join("");
  h+=`</div>`;

  // ---- 库存状态：首页也提醒，形成每日回访钩子 ----
  if(S.inv.length){
    const low=S.inv.filter(it=>it.g<=lowThreshold(it));
    const soon=S.inv.filter(it=>{const dd=daysLeft(it);return dd!=null&&dd<=3&&it.g>lowThreshold(it)});
    if(low.length||soon.length){
      h+=`<div class="card" style="border-color:${low.length?"var(--warn)":"var(--line)"}">
        <h3>${ic("cart",18)}库存提醒${low.length?`<span class="count" style="color:var(--warn)">${low.length} 样需补货</span>`:`<span class="count">${soon.length} 样快见底</span>`}</h3>`;
      if(low.length){
        h+=`<div class="dt" style="margin-bottom:9px">${low.slice(0,4).map(x=>esc(x.n)+" <b style=\"color:var(--warn)\">"+x.g+"g</b>").join(" · ")}${low.length>4?` 等 ${low.length} 样`:""}</div>`;
      }
      if(soon.length){
        h+=`<div class="dt" style="margin-bottom:9px">${soon.slice(0,3).map(x=>esc(x.n)+" 约 "+Math.floor(daysLeft(x))+" 天").join(" · ")}</div>`;
      }
      h+=low.length
        ?`<button class="btn-o" onclick="go('tab-stock')">去处理 · 生成采购清单</button>`
        :`<button class="btn-o" onclick="go('tab-stock')">查看库存</button>`;
      h+=`</div>`;
    }
  }

  const ex=S.ex[d]||[];
  if(ex.length){
    h+=`<div class="card"><h3>${ic("flame",18)}今日训练<span class="count">${ex.length} 项 · −${Math.round(c.exK)} kcal</span></h3>`
      +ex.map((e,i)=>`<div class="item"><div class="nm">${esc(e.n)}<span class="g">${exSub(e)}</span></div>
       <div style="display:flex;align-items:center;gap:10px"><span class="tagk" style="color:var(--accent)">−${Math.round(e.kcal)} kcal</span><button class="btn-r" onclick="delEx(${i})">删</button></div></div>`).join("")
      +`</div>`;
  }
  h+=`<div id="streakBox"></div>`;
  h+=weekChart(c);
  $("todayBox").innerHTML=h;
  renderStreak();
}
/** 训练记录的副标题：跑了 5 km · 30 分钟 · 配速 6'00"/km */
function exSub(e){
  const bits=[];
  if(e.km)bits.push(e.km+" km");
  if(e.min)bits.push(e.min+" 分钟");
  if(e.km&&e.min)bits.push(paceStr(e.km,e.min));
  if(e.hr)bits.push("均心率 "+e.hr);
  return bits.join(" · ")||"";
}
/** 配速字符串：5km/30min → 6'00"/km */
function paceStr(km,min){
  if(!km||!min)return "";
  const sec=min*60/km;
  const m=Math.floor(sec/60), s=Math.round(sec%60);
  return m+"'" + String(s===60?0:s).padStart(2,"0") + '"/km';
}
/** 速度 km/h */
function speedStr(km,min){ if(!km||!min)return ""; return (km/(min/60)).toFixed(1)+" km/h" }
/** 把 e.ex 的图标名取出来（自定义项目也能有图标） */
function exIcon(type){
  const hit=EXERCISES.find(e=>e.n===type)||(S.myEx||[]).find(e=>e.n===type);
  return hit&&hit.ic?hit.ic:"lift";
}
function delLog(i,day){
  const d=day||todayStr();
  const list=S.log[d]||[];
  const e=list[i];
  if(!e){save();if(d===todayStr())renderToday();return}
  if(e.iid){
    const it=S.inv.find(x=>x.id===e.iid);
    if(it)it.g=Math.round((it.g+e.g)*10)/10;
    else if(e.b)S.inv.push({id:e.iid,n:e.n,g:e.g,k:e.b.k,p:e.b.p,f:e.b.f,c:e.b.c,fb:e.b.fb,cat:e.b.cat,low:e.b.low});
  }
  list.splice(i,1);save();
  if(d===todayStr())renderToday();
  if(typeof renderStock==="function"&&$("tab-stock"))renderStock();   // 同步库存视图
  toast(e.iid?"已删除，退回库存":"已删除");
}
function dstr(o){const d=new Date();d.setDate(d.getDate()-o);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}
function weekChart(c){
  const base=c.tdee+Number(S.profile.adj),days=[],td=todayStr();
  for(let i=6;i>=0;i--){const k=dstr(i);days.push({k,v:(S.log[k]||[]).reduce((a,e)=>a+e.k,0),tr:isTrainDay(k)})}
  const mx=Math.max(base,...days.map(x=>x.v))||1;
  const names=["日","一","二","三","四","五","六"];
  return `<div class="card"><h3>${ic("today",18)}近 7 天热量<span class="count">${days.filter(x=>x.tr).length} 天训练</span></h3><div class="wk">`
    +days.map(x=>{
      const dt=new Date(x.k+"T00:00:00");
      return `<div class="wc${x.k===td?' today':''}"><span class="v">${x.v?Math.round(x.v):""}</span>
      <i style="height:${Math.round(x.v/mx*80)}px;background:${x.v>base*1.1?'var(--warn)':'var(--accent)'}"></i>
      <span class="d">${names[dt.getDay()]}${x.tr?"·练":""}</span></div>`}).join("")
    +`</div><div class="hint"><span>日常目标（不含训练）≈ ${Math.round(base)} kcal · 琥珀色 = 超标 · <b>·练</b> = 当天有训练</span></div></div>`;
}
function quickSheet(){
  sheet(`<h3>快速记录</h3><div class="fld"><label>搜索食物（不用先入库存）</label><input id="qq" placeholder="米饭 / 鸡蛋 / 苹果" autocomplete="off"></div><div id="qr"></div><button class="btn-o" onclick="closeSheet()">关闭</button>`);
  $("qq").oninput=function(){
    const v=this.value.trim().toLowerCase();
    $("qr").innerHTML=v?FOODS.map((x,i)=>[x,i]).filter(a=>a[0].n.toLowerCase().includes(v)).slice(0,8)
      .map(a=>`<div class="item" onclick="quickPick(${a[1]})" style="cursor:pointer"><div class="nm">${esc(a[0].n)}</div><span class="tagk" style="color:var(--ink-3)">${a[0].k} kcal/100g</span></div>`).join("")
      :"";
  };
  setTimeout(()=>$("qq").focus(),120);
}
function quickPick(i){
  const x=FOODS[i];
  sheet(`<h3>${esc(x.n)}</h3><div class="fld"><label>吃了多少克</label><input id="qg" type="number" inputmode="decimal" value="100"></div>
    <div class="btnrow"><button class="btn-o" onclick="quickSheet()">返回</button><button class="btn-g" onclick="quickEat(${i})">记录</button></div>`);
  setTimeout(()=>$("qg").select(),120);
}
function quickEat(i){
  const x=FOODS[i],g=parseFloat($("qg").value)||0;
  if(g<=0){toast("克重要大于 0");return}
  const r=scale(x,g),d=todayStr();
  (S.log[d]=S.log[d]||[]).push({n:x.n,g:g,k:r.k,p:r.p,f:r.f,c:r.c,fb:r.fb,na:r.na,sf:r.sf,sg:r.sg,out:true});
  save();closeSheet();renderToday();toast("已记录");
}
function delEx(i){const d=todayStr();S.ex[d].splice(i,1);save();renderToday()}

/* ================= 库存管家 ================= */

/** 库存剩余营养合计 */
function invTotals(){
  let k=0,p=0,f=0,c=0,g=0,fb=0,na=0,sf=0,sg=0;
  S.inv.forEach(it=>{const r=scale(it,it.g);k+=r.k;p+=r.p;f+=r.f;c+=r.c;fb+=r.fb;g+=it.g;
    na+=r.na;sf+=r.sf;sg+=r.sg});
  return {k,p,f,c,fb,g,na,sf,sg};
}

/** 近 N 天某食材的日均消耗（g/天）。返回 null 表示样本不足。 */
function dailyBurn(itemId,days=7){
  let total=0,seen=0;
  for(let i=0;i<days;i++){
    const key=dstr(i);
    const list=S.log[key]||[];
    const hit=list.filter(e=>e.iid===itemId);
    if(hit.length)seen++;
    hit.forEach(e=>total+=e.g);
  }
  // 至少要有 2 天记录才给预测，否则噪声太大
  if(seen<2)return null;
  return total/days;
}

/** 全库日均总消耗（用于算「整仓还能撑几天」） */
function dailyBurnAll(days=7){
  let total=0;
  for(let i=0;i<days;i++){
    const list=S.log[dstr(i)]||[];
    list.forEach(e=>total+=e.g);
  }
  return total/days;
}

/** 预测某食材还能吃几天 */
function daysLeft(it){
  const b=dailyBurn(it.id);
  if(!b||b<=0)return null;
  return it.g/b;
}

/** 近 N 天实际吃掉的营养，用于「缺口分析」 */
function recentIntake(days=7){
  let k=0,p=0,f=0,c=0,fb=0,n=0;
  for(let i=0;i<days;i++){
    const list=S.log[dstr(i)]||[];
    if(list.length)n++;
    list.forEach(e=>{k+=e.k||0;p+=e.p||0;f+=e.f||0;c+=e.c||0;fb+=e.fb||0});
  }
  return {k,p,f,c,fb,days,loggedDays:n};
}

/** 阈值：可自定义，默认 100g。按食材记录低量门限 */
function lowThreshold(it){ return it.low!=null?it.low:100 }

/** 采购清单：低量食材 + 建议补货量（补到够吃 7 天，或至少补一倍现有量） */
function shoppingList(){
  const out=[];
  S.inv.forEach(it=>{
    const th=lowThreshold(it);
    if(it.g>th)return;
    const b=dailyBurn(it.id);
    let suggest;
    if(b&&b>0){
      // 按实际消耗速度补到够吃 7 天
      suggest=Math.max(Math.ceil((b*7-it.g)/50)*50,100);
    }else{
      // 没有消耗数据 → 用一次性合理量
      suggest=it.g>0?Math.max(Math.ceil(it.g*2/100)*100,200):500;
    }
    out.push({id:it.id,n:it.n,g:it.g,suggest,cat:it.cat,urgent:it.g<=th*0.3,burn:b});
  });
  // 急的排前面，其次按剩余百分比
  return out.sort((a,b)=>(b.urgent-a.urgent)||(a.g-b.g));
}

/** 按当前目标反推：今天还缺多少（可为负 = 已超） */
function gapToday(day){
  const d=day||todayStr();
  const c=calc(d); if(!c)return null;
  const t=dayTotals(d);
  return {
    kcal:c.target-t.k,
    p:c.pg-t.p,
    f:c.fg-t.f,
    c:c.cg-t.c,
    fb:c.fb-t.fb,
    _calc:c,_tot:t,
  };
}

/* ============ 训练后 / 日常营养补充推荐 ============
   思路与 fitforge 的「只显示你有的器械」一致：
   只从你库存里真实存在的食材中挑，按「补这个缺口最划算」排序。
   对每个缺口维度打分：
     密度 = 该营养素 / 100g  → 越高越省量
     代价 = 热量 / 该营养素   → 越低越不占预算
   综合分 = 密度 / (1 + 代价/100)，并用「是否为主要功能类目」加权。
   同时给出纤维建议（纤维缺口通常无法靠单一食材补，需要组合）。 */
function feedSuggest(day){
  const g=gapToday(day); if(!g)return null;
  if(!S.inv.length)return null;
  const cands=[];
  S.inv.forEach(it=>{
    const n100=scale(it,100);       // 每 100g 的营养
    cands.push({food:it, r:n100, pD:n100.p, cD:n100.c, fD:n100.f, fbD:n100.fb, kD:n100.k});
  });
  // 每个缺口维度各挑一个最优食材
  const pick=(dim,cat)=>{
    const deficit=g[dim];                       // 该维度还缺多少（g 或 kcal）
    if(!(deficit>2))return null;
    const usable=cands.filter(x=>(x[dim+"D"]||0)>0.5);   // pD/cD/fD/fbD/kD
    if(!usable.length)return null;
    const scored=usable.map(x=>{
      const density=x[dim+"D"];                            // 每 100g 含多少
      const cost=x.kD/Math.max(density,0.01);              // 换取 1 单位该营养素要花多少 kcal
      const catBonus=(cat&&x.food.cat===cat)?0.35:0;       // 同类目加权
      const need=Math.max(5,Math.round(deficit/(density/100)/5)*5);
      const score=density/(1+cost/80)+catBonus*density;
      return {x,density,cost,need,score};
    })
    .filter(s=>s.need>0&&s.need<=3000)
    .sort((a,b)=>b.score-a.score);
    return scored[0]||null;
  };
  const out={
    p:pick("p","protein"),
    c:pick("c","staple"),
    f:pick("f","fat"),
    fb:pick("fb",null),
    kcal:null,
  };
  // 单选一个「主推荐」：优先补蛋白（训练后最关键），其次纤维，其次碳水
  let main=null,label="";
  if(out.p){main=out.p;label="蛋白"}
  else if(out.fb){main=out.fb;label="膳食纤维"}
  else if(out.c){main=out.c;label="碳水"}
  else if(g.kcal>80){
    // 只是热量差 → 挑「最接近一份正餐」的食材
    const m=cands.filter(x=>x.kD>0).map(x=>{
      const need=Math.max(20,Math.round(g.kcal/(x.kD/100)/10)*10);
      return {x,need,score:x.kD};
    }).filter(s=>s.need<=800).sort((a,b)=>b.score-a.score)[0];
    if(m){main=m;out.kcal=m;label="热量"}
  }
  if(!main)return null;
  return {food:main.x.food,need:main.need,label,all:out,gap:g,
          pc:Math.round(main.x.r.p/100*main.need*10)/10};
}
/** 兼容旧名（库存页在用） */
function proteinSuggest(day){
  const fs=feedSuggest(day);
  if(!fs)return null;
  // 只关心蛋白时返回旧结构
  if(fs.label==="蛋白")return {food:fs.food,need:fs.need,pc:fs.pc};
  const g=gapToday(day);
  if(!g||g.p<=1)return null;
  const cands=S.inv.filter(it=>it.cat==="protein"&&it.p>0)
    .map(it=>({it,d:it.p*100/it.k})).sort((a,b)=>b.d-a.d);
  if(!cands.length)return null;
  const best=cands[0].it;
  const need=Math.round(g.p/(best.p/100)/10)*10;
  return {food:best,need,pc:Math.round(best.p/100*g.p*10)/10};
}

/* —— 库存主界面 —— */
let stockView="all";   // all | low | soon

function renderStock(){
  // ---- 顶部概览卡 ----
  const t=invTotals();
  const gap=gapToday();
  const burnAll=dailyBurnAll(7);
  const overallDays=burnAll>0?t.g/burnAll:null;

  let head=`<div class="card invh">
    <div class="invh-top">
      <div>
        <div class="invh-lab">库存总计</div>
        <div class="invh-big">${Math.round(t.g)}<span>g</span></div>
        <div class="invh-sub">${Math.round(t.k)} kcal · 蛋白 ${t.p.toFixed(0)}g</div>
      </div>
      <div class="invh-ring" style="--p:${burnAll>0?Math.min(100,Math.max(4,Math.round(Math.min(overallDays,14)/14*100))):0}">
        <div>
          <b>${overallDays!=null?Math.floor(overallDays):"—"}</b>
          <span>${overallDays!=null?"天":"待记录"}</span>
        </div>
      </div>
    </div>
    <div class="invh-foot">
      <span>${burnAll>0?`按近 7 天速度，日均消耗 ${Math.round(burnAll)}g · 还能吃 ${Math.floor(overallDays)} 天`:"记录几天饮食后，这里会预测还能吃几天"}</span>
    </div>
  </div>
  <div class="hint" style="margin:-4px 0 12px"><span>这一页只管<b>家里还剩什么</b>、该买什么。<b>记录吃了什么不用来这</b>——拍照或手动记就行。</span></div>`;

  // ---- 智能提示 ----
  const low=S.inv.filter(it=>it.g<=lowThreshold(it));
  const urgent=low.filter(it=>it.g<=lowThreshold(it)*0.3);
  if(low.length){
    head+=`<div class="card" style="border-color:var(--warn);background:var(--warn-soft)">
      <div style="display:flex;gap:9px;align-items:flex-start;color:var(--warn)">
        ${ic("alert",18,'style="margin-top:1px;flex-shrink:0"')}
        <div style="flex:1">
          <div style="font-size:13.5px;font-weight:600">${low.length} 样需要补货${urgent.length?` · ${urgent.length} 样告急`:""}</div>
          <div style="font-size:12.5px;margin-top:3px;color:var(--ink-2)">${low.slice(0,3).map(x=>esc(x.n)+" "+x.g+"g").join(" · ")}${low.length>3?` 等 ${low.length} 样`:""}</div>
        </div>
        <button class="btn-s" style="flex-shrink:0;background:transparent;border-color:var(--warn);color:var(--warn)" onclick="showShopping()">采购清单</button>
      </div></div>`;
  }

  // ---- 缺口分析 ----
  if(gap && (gap.kcal>0||gap.p>0)){
    const fs=feedSuggest();
    const opt=[];
    if(gap.kcal>0)opt.push(`<div class="gaprow"><span class="gl"><i style="background:var(--accent)"></i>热量</span><b>${Math.round(gap.kcal)} kcal</b></div>`);
    if(gap.p>1)opt.push(`<div class="gaprow"><span class="gl"><i style="background:var(--d-protein)"></i>蛋白质</span><b>${Math.round(gap.p)} g</b></div>`);
    if(gap.c>1)opt.push(`<div class="gaprow"><span class="gl"><i style="background:var(--d-carb)"></i>碳水</span><b>${Math.round(gap.c)} g</b></div>`);
    if(gap.f>1)opt.push(`<div class="gaprow"><span class="gl"><i style="background:var(--d-fat)"></i>脂肪</span><b>${Math.round(gap.f)} g</b></div>`);
    if(gap.fb>1)opt.push(`<div class="gaprow"><span class="gl"><i style="background:var(--d-fiber)"></i>膳食纤维</span><b>${Math.round(gap.fb)} g</b></div>`);
    head+=`<div class="card">
      <h3>${ic("target",18)}${gap._calc.training?"训练后该补什么":"今日还差"}<span class="count">库存可补</span></h3>
      <div class="gaplist">${opt.join("")}</div>
      ${fs?`<div class="sugg">${ic("bolt",14)}<span>吃 <b>${fs.need}g ${esc(fs.food.n)}</b> 可补足${fs.label}</span>
        <button class="btn-s" style="margin-left:auto;flex-shrink:0" onclick="eatSheet('${fs.food.id}')">去记录</button></div>`
        :`<div class="sugg" style="background:var(--surface-2);color:var(--ink-3)">${ic("bolt",14)}<span>库存里还没有能精准补缺口的食材，先去添加</span></div>`}
    </div>`;
  }

  // ---- 筛选标签 ----
  const soonCount=S.inv.filter(it=>{const d=daysLeft(it);return d!=null&&d<=3}).length;
  let body=`<div class="card">
    <h3>${ic("box",18)}我的库存<span class="count">${S.inv.length} 样</span></h3>`;

  if(!S.inv.length){
    body+=`<div class="empty">${ic("box",32,'style="color:var(--line-2);margin:0 auto 8px"')}库存是空的<br>去超市买完东西，拍照识别后加进来</div>`;
  } else {
    // 筛选器
    const tabs=[["all","全部",S.inv.length],["soon","快见底",soonCount],["low","需补货",low.length]];
    body+=`<div class="ftabs">${tabs.map(([k,lab,n])=>
      `<button class="ftab${stockView===k?" on":""}" onclick="setStockView('${k}')">${lab}${n?`<em>${n}</em>`:""}</button>`).join("")}</div>`;

    let items=S.inv;
    if(stockView==="low")items=S.inv.filter(it=>it.g<=lowThreshold(it));
    if(stockView==="soon")items=S.inv.filter(it=>{const d=daysLeft(it);return d!=null&&d<=3});

    if(!items.length){
      body+=`<div class="empty" style="padding:22px 12px">${
        stockView==="low"?"没有需要补货的食材，库存充足":
        "还没有食材吃出规律<br><span style=\"font-size:12px\">记录几天后，这里会按消耗速度提醒"
      }</div>`;
    } else {
      CAT_ORDER.forEach(cat=>{
        const group=items.filter(it=>it.cat===cat);
        if(!group.length)return;
        body+=`<div class="grp-title">${CAT_LABEL[cat]}<span style="color:var(--line-2)">·</span>${group.length}</div>`;
        body+=group.map(it=>{
          const r=scale(it,it.g);
          const th=lowThreshold(it);
          const lowFlag=it.g<=th;
          const d=daysLeft(it);
          const soonFlag=d!=null&&d<=3;
          const pct=Math.min(100,it.g<=th?Math.max(6,Math.round(it.g/th*100)):100);
          return `<div class="item inv">
            <div style="flex:1;min-width:0">
              <div class="nm">${esc(it.n)}${lowFlag?`<span class="chip warn">需补货</span>`:""}${soonFlag&&!lowFlag?`<span class="chip neutral">${Math.floor(d)}天见底</span>`:""}</div>
              <div class="dt">剩 <b style="color:var(--ink)">${it.g}</b> g · 纤维 ${r.fb.toFixed(1)} g · ${Math.round(r.k)} kcal</div>
              <div class="gbar"><i style="width:${pct}%;background:${lowFlag?"var(--warn)":"var(--accent)"}"></i></div>
            </div>
            <div class="btns">
              <button class="btn-s" style="background:var(--accent-soft);color:var(--accent);border-color:transparent" onclick="eatSheet('${it.id}')">吃掉</button>
              <button class="btn-s" onclick="invMenu('${it.id}')" aria-label="更多操作">${ic("more",15)}</button>
            </div></div>`}).join("");
      });
    }

    if(stockView==="all"&&items.length){
      body+=`<div style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--line-2)">
        <div class="hint" style="margin:0 0 6px"><span>库存剩余营养合计</span></div>
        <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:13.5px;font-variant-numeric:tabular-nums">
          <span><b style="color:var(--accent)">${Math.round(t.k)}</b> <span style="color:var(--ink-3)">kcal</span></span>
          <span><b style="color:var(--d-protein)">${t.p.toFixed(1)}</b> <span style="color:var(--ink-3)">蛋白 g</span></span>
          <span><b style="color:var(--d-fat)">${t.f.toFixed(1)}</b> <span style="color:var(--ink-3)">脂肪 g</span></span>
          <span><b style="color:var(--d-carb)">${t.c.toFixed(1)}</b> <span style="color:var(--ink-3)">碳水 g</span></span>
          <span><b style="color:var(--d-fiber)">${t.fb.toFixed(1)}</b> <span style="color:var(--ink-3)">纤维 g</span></span>
        </div></div>`;
    }
  }
  body+=`</div>`;
  $("stockBox").innerHTML=head+body;

  // ---- 底部批量操作 ----
  const lowList=shoppingList();
  let act="";
  if(S.inv.length){
    act=`<div class="card">
      <h3>${ic("bolt",18)}批量操作</h3>
      <div class="btnrow" style="margin-bottom:8px">
        <button class="btn-s" style="flex:1" onclick="showShopping()">${ic("cart",15)}采购清单${lowList.length?` (${lowList.length})`:""}</button>
        ${lowList.length?`<button class="btn-g" style="flex:1" onclick="restockAllLow()">一键补货</button>`:""}
      </div>
      <button class="btn-r" style="width:100%" onclick="clearInvAsk()">清空全部库存</button>
    </div>`;
  }
  const sa=$("stockActions");
  if(sa)sa.innerHTML=act;
}

function setStockView(v){stockView=v;renderStock()}

/** 采购清单抽屉 */
function showShopping(){
  const list=shoppingList();
  const total=list.reduce((a,x)=>a+x.suggest,0);
  sheet(`<h3>${ic("cart",18)}采购清单<span class="count">${list.length} 样</span></h3>
    ${list.length?`
    <div class="hint" style="margin:0 0 12px"><span>按你近 7 天的实际消耗速度计算，补足后约可吃 7 天</span></div>
    <div class="shoplist">${list.map(x=>`
      <div class="shoprow">
        <div>
          <div class="nm">${esc(x.n)}${x.urgent?`<span class="chip warn">告急</span>`:""}</div>
          <div class="dt">现有 ${x.g} g${x.burn?` · 日均 ${x.burn.toFixed(0)} g`:""}</div>
        </div>
        <b>+${x.suggest} g</b>
      </div>`).join("")}</div>
    <div class="shopfoot">建议采购总量 ${total} g</div>
    <div class="btnrow"><button class="btn-o" onclick="closeSheet()">关闭</button>
      <button class="btn-g" onclick="copyShopping()">复制清单</button></div>`
    :`<div class="empty" style="padding:22px 12px">库存充足<br>没有需要补货的食材</div>
      <button class="btn-o" onclick="closeSheet()">关闭</button>`}`);
}

function copyShopping(){
  const list=shoppingList();
  const txt="采购清单\n"+list.map(x=>`· ${x.n}  +${x.suggest}g`).join("\n");
  const done=()=>toast("清单已复制");
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(done).catch(()=>{toast("复制失败，请长按选择");});
  }else{
    const ta=document.createElement("textarea");
    ta.value=txt;document.body.appendChild(ta);ta.select();
    try{document.execCommand("copy");done()}catch(e){toast("复制失败")}
    document.body.removeChild(ta);
  }
}

/** 单样食材详情：近 14 天消耗曲线 + 预测 */
function detailSheet(id){
  const it=S.inv.find(x=>x.id===id);if(!it)return;
  const th=lowThreshold(it);
  const d=daysLeft(it);
  const b=dailyBurn(it.id);
  // 近 14 天每天吃掉多少
  const series=[];
  for(let i=13;i>=0;i--){
    const key=dstr(i);
    const g=(S.log[key]||[]).filter(e=>e.iid===id).reduce((a,e)=>a+e.g,0);
    series.push({key,g,today:i===0});
  }
  const mx=Math.max(10,...series.map(s=>s.g));
  const total14=series.reduce((a,s)=>a+s.g,0);
  const r=scale(it,it.g);
  sheet(`<h3>${esc(it.n)}</h3>
    <div class="dtl">
      <div><span>剩余</span><b>${it.g} g</b></div>
      <div><span>热量</span><b>${Math.round(r.k)} kcal</b></div>
      <div><span>日均消耗</span><b>${b?b.toFixed(0)+" g":"暂无数据"}</b></div>
      <div><span>预计可吃</span><b style="${d!=null&&d<=3?"color:var(--warn)":""}">${d!=null?(d<1?"不足 1 天":Math.floor(d)+" 天"):"—"}</b></div>
    </div>
    <div class="fld"><label>近 14 天消耗</label>
      <div class="wkc">${series.map(s=>`<div class="wkr${s.today?" today":""}">
        <i style="height:${Math.max(2,Math.round(s.g/mx*100))}%" title="${s.key} ${s.g}g"></i></div>`).join("")}</div>
      <div class="dt" style="text-align:center;margin-top:4px">14 天共吃掉 ${total14} g</div>
    </div>
    <div class="fld"><label>剩余比例</label>
      <div class="gbar" style="height:8px"><i style="width:${Math.min(100,Math.round(it.g/th*100))}%;background:${it.g<=th?"var(--warn)":"var(--accent)"}"></i></div>
      <div class="dt" style="margin-top:5px">低量提醒线：${th} g</div>
    </div>
    <div class="btnrow" style="margin-bottom:10px"><button class="btn-s" style="flex:1" onclick="setLow('${id}')">改提醒线</button></div>
    <div class="btnrow"><button class="btn-o" onclick="closeSheet()">关闭</button><button class="btn-g" onclick="eatSheet('${id}')">吃掉</button></div>`);
}

function setLow(id){
  const it=S.inv.find(x=>x.id===id);if(!it)return;
  const cur=lowThreshold(it);
  const opts=[50,100,200,300,500];
  sheet(`<h3>低量提醒线</h3>
    <div class="hint" style="margin-bottom:12px"><span>剩余低于这个量时提醒你补货（当前 ${cur} g）</span></div>
    <div class="btnrow" style="flex-wrap:wrap;margin-bottom:14px">
      ${opts.map(v=>`<button class="btn-s${v===cur?" on":""}" onclick="doSetLow('${id}',${v})">${v}g</button>`).join("")}
    </div>
    <button class="btn-o" onclick="closeSheet()">取消</button>`);
}
function doSetLow(id,v){
  const it=S.inv.find(x=>x.id===id);if(!it)return;
  it.low=v;save();closeSheet();renderStock();toast("提醒线已设为 "+v+"g");
}

function eatSheet(id){
  const it=S.inv.find(x=>x.id===id);if(!it)return;
  // 快捷按钮给「一份」而不是库存百分比。
  // 以前是 25%/50%/75%/100%：2kg 鸡胸肉 → 500/1000/1500/2000g，
  // 而用户想记的是 150g —— 最近选项 1000g，误差 +850g，按钮等于摆设。
  // 现在直接用份量表（跟拍照识别页同一套单位），认知也统一。
  let quicks=portionsFor(it.n,it.cat)
    .map(([u,g])=>({u,g:Math.round(g)}))
    .filter(x=>x.g>0&&x.g<=it.g)
    .filter((x,i,a)=>a.findIndex(y=>y.g===x.g)===i)
    .slice(0,4);
  // 库存比最小份量还少时，只给「全部」
  if(!quicks.length)quicks=[{u:"全部",g:Math.round(it.g)}];
  sheet(`<h3>吃掉<span class="hl">${esc(it.n)}</span></h3>
    <div class="fld"><label>剩余 ${it.g} g，本次吃多少 (g)</label><input id="eatG" type="number" inputmode="decimal" value="${it.g>=100?100:it.g}"></div>
    <div class="plist" style="margin-bottom:12px">${quicks.map(x=>`<button class="pbtn" onclick="setEat(${x.g})">${esc(x.u)}<span class="pg">${x.g} g</span></button>`).join("")}</div>
    <div class="chip neutral" id="eatPrev" style="margin-bottom:6px"></div>
    <div class="eatleft" id="eatLeft"></div>
    <div class="btnrow" style="margin-top:14px"><button class="btn-o" onclick="closeSheet()">取消</button><button class="btn-g" onclick="doEat('${id}')">确认吃掉</button></div>`);
  const upd=()=>{
    const g=parseFloat($("eatG").value)||0,r=scale(it,g);
    $("eatPrev").textContent=`≈ ${Math.round(r.k)} kcal · 蛋白 ${r.p.toFixed(1)} · 脂肪 ${r.f.toFixed(1)} · 碳水 ${r.c.toFixed(1)} · 纤维 ${r.fb.toFixed(1)} g`;
    const left=Math.max(0,Math.round((it.g-g)*10)/10);
    const th=lowThreshold(it);
    $("eatLeft").innerHTML=(g>0&&g<=it.g)
      ? (left<=0?`<span style="color:var(--warn)">吃完后库存清空</span>`
        : left<=th?`<span style="color:var(--warn)">吃完后仅剩 ${left} g，将触发补货提醒</span>`
        : `吃完后剩余 ${left} g`)
      : "";
  };
  $("eatG").oninput=upd;upd();
  setTimeout(()=>$("eatG").select(),120);
}
function setEat(g){$("eatG").value=g;$("eatG").dispatchEvent(new Event("input"))}
function doEat(id){
  const it=S.inv.find(x=>x.id===id);const g=parseFloat($("eatG").value)||0;
  if(g<=0){toast("克重要大于 0");return}
  if(g>it.g){toast("吃的比剩的多，请先补货");return}
  const r=scale(it,g),d=todayStr();
  S.log[d]=S.log[d]||[];
  S.log[d].push({n:it.n,g:g,k:r.k,p:r.p,f:r.f,c:r.c,fb:r.fb,na:r.na,sf:r.sf,sg:r.sg,iid:it.id,
    b:{k:it.k,p:it.p,f:it.f,c:it.c,fb:it.fb,na:it.na,sf:it.sf,sg:it.sg,cat:it.cat,low:it.low}});
  it.g=Math.round((it.g-g)*10)/10;
  const emptied=it.g<=0;
  if(emptied)S.inv=S.inv.filter(x=>x.id!==id);
  save();closeSheet();renderStock();renderToday();
  toast(emptied?`已记录 · ${it.n} 吃完了，记得补货`:"已记录，库存已扣减");
}
function restockSheet(id){
  const it=S.inv.find(x=>x.id===id);if(!it)return;
  const b=dailyBurn(it.id);
  const quicks=[100,250,500,1000];
  sheet(`<h3>给<span class="hl">${esc(it.n)}</span>补货</h3>
    <div class="fld"><label>当前剩余 ${it.g} g，补多少 (g)</label><input id="rsG" type="number" inputmode="decimal" value="${b?Math.max(100,Math.ceil(b*7/100)*100):500}"></div>
    <div class="btnrow" style="margin-bottom:10px">${quicks.map(g=>`<button class="btn-s" onclick="$('rsG').value=${g}">${g}g</button>`).join("")}</div>
    ${b?`<div class="hint" style="margin-bottom:4px">${ic("clockFast",14)}<span>你日均吃 ${b.toFixed(0)}g，补 7 天量约需 ${Math.max(100,Math.ceil(b*7/100)*100)}g</span></div>`:""}
    <div class="eatleft" id="rsLeft"></div>
    <div class="btnrow" style="margin-top:14px"><button class="btn-o" onclick="closeSheet()">取消</button><button class="btn-g" onclick="doRestock('${id}')">确认补货</button></div>`);
  const upd=()=>{
    const g=parseFloat($("rsG").value)||0;
    $("rsLeft").innerHTML=g>0?`补货后共 ${Math.round((it.g+g)*10)/10} g${b?` · 约够吃 ${Math.floor((it.g+g)/b)} 天`:""}`:"";
  };
  $("rsG").oninput=upd;upd();
  setTimeout(()=>$("rsG").select(),120);
}
function doRestock(id){
  const it=S.inv.find(x=>x.id===id);const g=parseFloat($("rsG").value)||0;
  if(g<=0){toast("克重要大于 0");return}
  it.g=Math.round((it.g+g)*10)/10;save();closeSheet();renderStock();toast("已补货，现有 "+it.g+" g");
}
function delInvAsk(id){
  const it=S.inv.find(x=>x.id===id);if(!it)return;
  const used=(S.log[todayStr()]||[]).some(e=>e.iid===id);
  sheet(`<h3>删除库存？</h3>
    <div class="hint" style="margin-bottom:14px"><span>将从库存移除「${esc(it.n)}」（剩余 ${it.g} g）。已记录的饮食不受影响，历史数据保留。</span></div>
    ${used?`<div class="hint" style="margin-bottom:14px;color:var(--warn)">${ic("info",14)}<span>今天已吃过这项，删除不会撤销今天的记录</span></div>`:""}
    <div class="btnrow"><button class="btn-o" onclick="closeSheet()">取消</button><button class="btn-r" style="flex:1" onclick="doDelInv('${id}')">确认删除</button></div>`);
}
function doDelInv(id){S.inv=S.inv.filter(x=>x.id!==id);save();closeSheet();renderStock();toast("已删除")}

/** 批量：一键清空库存（带二次确认 + 提示可导出） */
function clearInvAsk(){
  if(!S.inv.length){toast("库存已是空的");return}
  sheet(`<h3>清空全部库存？</h3>
    <div class="hint" style="margin-bottom:14px"><span>将移除全部 ${S.inv.length} 样食材。你的饮食记录不受影响。</span></div>
    <div class="hint" style="margin-bottom:14px;color:var(--warn)">${ic("alert",14)}<span>建议先「导出备份」，清空后无法恢复</span></div>
    <div class="btnrow"><button class="btn-o" onclick="closeSheet()">取消</button><button class="btn-r" style="flex:1" onclick="doClearInv()">确认清空</button></div>`);
}
function doClearInv(){S.inv=[];save();closeSheet();renderStock();toast("库存已清空")}

/** 库存项的「更多」菜单：补货 / 看详情 / 删除都是低频操作，
    从每行四个按钮收进这里，一行只留「吃掉」+「⋯」 */
function invMenu(id){
  const it=S.inv.find(x=>x.id===id);if(!it)return;
  sheet(`<h3>${esc(it.n)}</h3>
    <div class="hint" style="margin-bottom:14px"><span>剩 <b>${it.g}</b> g</span></div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="btn-o" style="width:100%" onclick="closeSheet();restockSheet('${id}')">补货</button>
      <button class="btn-o" style="width:100%" onclick="closeSheet();detailSheet('${id}')">看营养详情</button>
      <button class="btn-r" style="width:100%" onclick="closeSheet();delInvAsk('${id}')">从库存删除</button>
    </div>
    <div class="btnrow" style="margin-top:12px"><button class="btn-o" style="flex:1" onclick="closeSheet()">取消</button></div>`);
}

/** 一键把采购清单里的低量项全部补货（按建议量） */
function restockAllLow(){
  const list=shoppingList();
  if(!list.length){toast("没有需要补货的");return}
  sheet(`<h3>一键补货</h3>
    <div class="hint" style="margin-bottom:12px"><span>按建议量给以下 ${list.length} 样补货</span></div>
    <div class="shoplist">${list.map(x=>`<div class="shoprow">
      <div><div class="nm">${esc(x.n)}</div><div class="dt">现有 ${x.g} g</div></div>
      <b>+${x.suggest} g</b></div>`).join("")}</div>
    <div class="btnrow" style="margin-top:14px"><button class="btn-o" onclick="closeSheet()">取消</button><button class="btn-g" onclick="doRestockAllLow()">确认补货</button></div>`);
}
function doRestockAllLow(){
  const list=shoppingList();
  list.forEach(x=>{
    const it=S.inv.find(i=>i.id===x.id);
    if(it)it.g=Math.round((it.g+x.suggest)*10)/10;
  });
  save();closeSheet();renderStock();toast(`已为 ${list.length} 样补货`);
}


/* ================= 搜索添加 ================= */
let pickFood=null;
$("q").addEventListener("input",function(){
  const v=this.value.trim().toLowerCase(),box=$("sug");
  if(!v){box.style.display="none";pickFood=null;return}
  const hits=FOODS.filter(x=>x.n.toLowerCase().includes(v)).slice(0,12);
  if(!hits.length){box.innerHTML=`<div style="color:var(--ink-3)"><span class="sn">没找到「${esc(this.value)}」</span><span class="sv">试试别的词</span></div>`;box.style.display="block";return}
  box.innerHTML=hits.map(x=>`<div onclick="pick(${FOODS.indexOf(x)})"><span class="sn">${esc(x.n)}</span><span class="sv">${x.k} kcal · P${x.p}</span></div>`).join("");
  box.style.display="block";
});
function pick(i){pickFood=FOODS[i];$("q").value=pickFood.n;$("sug").style.display="none";$("addG").focus()}
function addFromDb(){
  if(!pickFood){toast("先搜索并点选一个食物");return}
  const g=parseFloat($("addG").value)||0;
  if(g<=0){toast("填总克重");return}
  S.inv.push({id:uid(),n:pickFood.n,g:g,k:pickFood.k,p:pickFood.p,f:pickFood.f,c:pickFood.c,fb:pickFood.fb,na:pickFood.na,sf:pickFood.sf,sg:pickFood.sg,cat:pickFood.cat});
  save();$("q").value="";$("addG").value="";pickFood=null;$("sug").style.display="none";
  renderStock();toast("已加入库存");
}
document.addEventListener("click",e=>{if(!e.target.closest(".searchbox")){const s=$("sug");if(s)s.style.display="none"}});

/* ================= 拍照识别 ================= */
let curImgs=[];                 // 已选图片（dataURL 数组，支持多张）
let aiNote="";                  // AI 对这张图的一句话判断
let scanItems=[];               // 识别出的条目（一盘可能有好几样）
const MAX_PHOTOS=6;             // 上限：再多会让请求体和识别时间都失控

/* 两个入口共用一套处理：
     photoCam —— 带 capture="environment"，直接开相机（一次一张）
     photoLib —— 不带 capture 且带 multiple，走系统选择器（相册可多选）
   「用已经拍过的照片」走的就是 photoLib 这条路。 */
function bindPhotoInput(id){
  const el=$(id);if(!el)return;
  el.addEventListener("change",function(){
    const files=[].slice.call(this.files||[]);
    // 立刻清空，否则再选同一张图不会触发 change（用户会以为点了没反应）
    this.value="";
    if(!files.length)return;
    if(files.some(f=>!/^image\//.test(f.type||""))){toast("只能选图片文件");return}
    if(files.some(f=>f.size>12*1024*1024)){toast("有图片超过 12MB，换一张");return}
    const room=MAX_PHOTOS-curImgs.length;
    if(room<=0){toast("最多 "+MAX_PHOTOS+" 张，先删掉几张");return}
    const take=files.slice(0,room);
    if(files.length>room)toast("最多 "+MAX_PHOTOS+" 张，只加了前 "+room+" 张");
    // 按下标回填，保证顺序跟用户选的一致（FileReader 完成顺序不保证）
    const got=new Array(take.length);let done=0;
    const finish=()=>{
      const okOnes=got.filter(Boolean);
      curImgs=curImgs.concat(okOnes).slice(0,MAX_PHOTOS);
      renderPrev();
      if(okOnes.length<take.length)toast("有图片读不出来，已跳过");
    };
    take.forEach((f,i)=>{
      const rd=new FileReader();
      rd.onload=e=>{got[i]=e.target.result;if(++done===take.length)finish()};
      rd.onerror=()=>{got[i]=null;if(++done===take.length)finish()};
      rd.readAsDataURL(f);
    });
  });
}
bindPhotoInput("photoCam");
bindPhotoInput("photoLib");

/* ---------- 份量助手 ----------
   模型能认出「这是什么」，但认不出「有多少」—— 重量这一步交给用户，
   用日常单位表达（一颗 / 一把 / 一块），再换算成克和营养。 */
/** 按名称匹配常见份量：精确 → 双向包含（忽略括号后缀）→ 按分类兜底 */
function portionsFor(name,cat){
  const nm=String(name||"").trim();
  // 空名字必须在这里挡掉：下面的包含判断里 "".indexOf 恒为 0，会误命中第一条
  if(!nm)return PORT_FALLBACK[cat]||PORT_FALLBACK.other;
  if(PORTIONS[nm])return PORTIONS[nm];
  const bare=s=>s.replace(/\(.*?\)/g,"").trim();
  for(const k of Object.keys(PORTIONS)){
    const kb=bare(k);
    if(kb&&(nm.indexOf(kb)>=0||kb.indexOf(nm)>=0))return PORTIONS[k];
  }
  return PORT_FALLBACK[cat]||PORT_FALLBACK.other;
}
/* ---------- 识别结果：条目列表 ---------- */
/** 切换「识别结果列表」和「手动输入表单」两种形态 */
function showMode(which){
  const list=$("itemList"),form=$("singleForm"),pb=$("portionBox");
  if(list)list.style.display=which==="list"?"block":"none";
  if(form)form.style.display=which==="form"?"block":"none";
  // 份量按钮只在手填时用；识别结果里每条自己带「改份量」
  if(pb)pb.style.display=which==="form"?"block":"none";
}
/** 渲染识别出的条目：一条一行，能单独改份量、单独删 */
function renderItems(){
  const box=$("itemList");if(!box)return;
  if(!scanItems.length){box.innerHTML="";box.style.display="none";renderAiSummary();return}
  box.style.display="block";
  box.innerHTML=scanItems.map((it,i)=>{
    const fb=Math.round(it.fb*it.g/10)/10,kc=Math.round(it.k*it.g/100);
    const meta=[it.g>0?it.g+" g":"重量待确认"];
    if(it.g>0&&fb>0)meta.push("纤维 "+fb+" g");
    if(it.g>0&&kc>0)meta.push(kc+" kcal");
    return `<div class="itemRow">
      <div class="itemMain">
        <div class="itemName">${esc(it.n)}</div>
        <div class="itemMeta">${meta.join(" · ")}</div>
      </div>
      <button class="itemBtn" onclick="editItem(${i})" aria-label="改份量">${ic("pencil",15)}</button>
      <button class="itemBtn" onclick="delItem(${i})" aria-label="删掉这一条">${ic("trash",15)}</button>
    </div>`;
  }).join("");
  renderAiSummary();
}
/** 删掉第 i 条 */
function delItem(i){
  if(i<0||i>=scanItems.length)return;
  scanItems.splice(i,1);
  if(!scanItems.length){clearScan();toast("都删掉了，重新拍一张吧");return}
  renderItems();
}
/** 改某一条的份量：常见单位 + 手动填 */
function editItem(i){
  const it=scanItems[i];if(!it)return;
  const list=portionsFor(it.n,it.cat);
  sheet(`<h3>${esc(it.n)}</h3>
    <div class="hint" style="margin-bottom:12px"><span>AI 估的是 <b>${it.g>0?it.g+" g":"未知"}</b>，觉得不对就点一个，或直接填克数</span></div>
    <div class="plist" style="margin-bottom:12px">${list.map(([u,g])=>
      `<button class="pbtn" onclick="setItemG(${i},${g})">${esc(u)}<span class="pg">${g} g</span></button>`).join("")}</div>
    <div class="fld"><label>克数 (g)</label><input id="eiG" type="number" inputmode="decimal" value="${it.g>0?it.g:""}"></div>
    <div class="btnrow"><button class="btn-o" onclick="closeSheet()">取消</button>
      <button class="btn-g" onclick="saveItemG(${i})">确定</button></div>`);
}
function setItemG(i,g){const el=$("eiG");if(el)el.value=g}
function saveItemG(i){
  const v=parseFloat(($("eiG")||{}).value)||0;
  if(v<=0){toast("填个克数");return}
  if(scanItems[i])scanItems[i].g=v;
  closeSheet();renderItems();
}
/** 清空识别结果 */
function clearScan(){
  scanItems=[];aiNote="";
  if($("itemList")){$("itemList").innerHTML="";$("itemList").style.display="none"}
  if($("aiSummary"))$("aiSummary").style.display="none";
  if($("scanResult"))$("scanResult").style.display="none";
}
/** 总计卡：先给结论，再让人决定要不要改 */
function renderAiSummary(){
  const box=$("aiSummary");if(!box)return;
  const list=(scanItems&&scanItems.length)?scanItems:[readR()].filter(x=>x.n);
  if(!list.length){box.style.display="none";return}
  const tot=list.reduce((a,x)=>({
    g:a.g+(x.g||0),
    fb:a.fb+(x.fb||0)*(x.g||0)/100,
    p:a.p+(x.p||0)*(x.g||0)/100,
    k:a.k+(x.k||0)*(x.g||0)/100
  }),{g:0,fb:0,p:0,k:0});
  const bits=[];
  if(tot.fb>0.05)bits.push(`膳食纤维 <b>${Math.round(tot.fb*10)/10} g</b>`);
  if(tot.p>0.05)bits.push(`蛋白 <b>${Math.round(tot.p*10)/10} g</b>`);
  if(tot.k>0)bits.push(`<b>${Math.round(tot.k)}</b> kcal`);
  const title=list.length===1?esc(list[0].n):`这一餐 · ${list.length} 样`;
  box.style.display="block";
  box.innerHTML=`<div class="aiCard">
    <div class="aiTop"><span class="aiName">${title}</span>${
      tot.g>0?`<span class="aiG">约 ${Math.round(tot.g)} g</span>`
             :`<span class="aiG warn">重量待确认</span>`}</div>
    ${bits.length?`<div class="aiNums">${bits.join(" · ")}</div>`:""}
    ${aiNote?`<div class="aiNote">${esc(aiNote)}</div>`:""}
  </div>`;
}

/** 渲染份量按钮。识别完成后、或用户改了名称/分类时调用 */
function renderPortions(){
  const box=$("portionBox");if(!box)return;
  const nm=$("rN")?$("rN").value.trim():"";
  const cat=$("rCat")?$("rCat").value:"other";
  const list=portionsFor(nm,cat);
  box.innerHTML=`<div class="plist">${list.map(([u,g])=>
    `<button type="button" class="pbtn" onclick="pickPortion(${g})">${esc(u)}<span class="pg">${g} g</span></button>`
  ).join("")}</div><div class="hint" id="portionTip" style="margin-top:7px"></div>`;
  updatePortionTip();
}
/** 点份量按钮：填克重并刷新换算提示 */
function pickPortion(g){
  const el=$("rG");if(el)el.value=g;
  updatePortionTip();
}
/** 换算提示：这一份多重、含多少膳食纤维、约多少热量 */
function updatePortionTip(){
  const tip=$("portionTip");if(!tip)return;
  const val=id=>{const el=$(id);return el?parseFloat(el.value)||0:0};
  const g=val("rG"),fb=val("rFb"),k=val("rK");
  // 数字已经在上面那张卡片里了，这里只做引导，别重复报一遍
  if(g<=0){tip.innerHTML=`<span>AI 没估出重量，选一个份量或直接填克重</span>`;return}
  tip.innerHTML=`<span>份量不对？点上面换个单位</span>`;
  renderAiSummary();
}
/* 提示要跟着输入走：改名字可能换一套单位，改克重/纤维要立刻重算 */
["rN","rCat"].forEach(id=>{
  const el=$(id);if(!el)return;
  const h=()=>renderPortions();
  el.addEventListener("input",h);el.addEventListener("change",h);
});
["rG","rFb","rK"].forEach(id=>{
  const el=$(id);if(!el)return;
  el.addEventListener("input",updatePortionTip);
});

/** 渲染已选图片：缩略图网格 + 每张可单独删 + 再加一张 */
function renderPrev(){
  const box=$("prevBox");if(!box)return;
  if(!curImgs.length){box.innerHTML="";$("scanResult").style.display="none";return}
  const n=curImgs.length;
  box.innerHTML=`<div class="thumbgrid">${curImgs.map((s,i)=>
    `<div class="thumb"><img src="${s}" alt="第 ${i+1} 张">
      <button class="thumbx" onclick="rmPhoto(${i})" aria-label="删除第 ${i+1} 张">${ic("close",12)}</button>
      ${n>1?`<span class="thumbi">${i+1}</span>`:""}
    </div>`).join("")}</div>
    <button class="btn-g" style="margin-top:10px" id="doScan" onclick="doScan()">${ic("search",18)}开始识别${n>1?"（"+n+" 张）":""}</button>
    <div class="btnrow" style="margin-top:8px">
      <button class="btn-s" onclick="document.getElementById('photoLib').click()">再加一张</button>
      <button class="btn-s" onclick="clearPhoto()">清空</button>
    </div>
    <div class="hint" id="scanMsg" style="margin-top:8px"></div>`;
  $("scanResult").style.display="none";
}
/** 删掉第 i 张 */
function rmPhoto(i){
  if(i<0||i>=curImgs.length)return;
  curImgs.splice(i,1);renderPrev();
}
/** 清空全部已选图片 */
function clearPhoto(){
  curImgs=[];
  const box=$("prevBox");if(box)box.innerHTML="";
  const r=$("scanResult");if(r)r.style.display="none";
}
function openManual(){
  aiNote="";scanItems=[];
  $("scanResult").style.display="block";
  showMode("form");
  renderPortions();
  renderAiSummary();
  $("scanResult").scrollIntoView({behavior:"smooth",block:"center"});
}
function applyPreset(){
  const P={
    // 2026-10 在真浏览器里实测过四家（对照 jsdelivr 确认有网）：
    //   通义   → POST 响应带 Access-Control-Allow-Origin: *，能直连
    //   豆包   → 预检回 CORS 头，但 POST 响应一个都不带，浏览器必拦
    //   智谱   → 预检就不回 CORS 头，浏览器在预检阶段就拦掉
    // 所以「豆包免费又能识图」是真的，但纯前端连不上，必须经 proxy/worker.js 中转。
    // 判断依据不能只看 OPTIONS —— 预检放行不等于实际响应放行，这是两个检查。
    doubao:["https://ark.cn-beijing.volces.com/api/v3","doubao-seed-2-1-lite-260915"],
    zhipu:["https://open.bigmodel.cn/api/paas/v4","glm-4v-flash"],
    qwen:["https://dashscope.aliyuncs.com/compatible-mode/v1","qwen3-vl-plus"],
    openai:["https://api.openai.com/v1","gpt-4o-mini"],
    proxy:["","glm-4v-flash"],
  }[$("apiPreset").value];
  if(P){$("apiBase").value=P[0];$("apiModel").value=P[1]}
  if($("apiPreset").value==="proxy"){
    $("apiBase").focus();
    toast("填你自建代理的地址，Key 留空");
  }
  // 模型会下线换名，提醒用户以控制台为准，而不是照抄这里的默认值
  if($("apiPreset").value==="doubao"){
    toast("豆包不放行跨域，要经「自建代理」中转；模型名以火山方舟控制台为准");
  }
}
/** 从 Key 的形态猜服务商，只在地址还空着的时候自动填 —— 不覆盖用户已经填好的 */
function guessProvider(key){
  const k=(key||"").trim();
  if(!k)return null;
  if(/^sk-/.test(k))return null;               // sk- 开头可能是 OpenAI 也可能是通义，不猜
  if(/^[0-9a-f]{20,}\.[0-9A-Za-z]{8,}$/.test(k))return "zhipu";   // 智谱：id.secret
  if(/^[0-9a-f]{32}$/i.test(k))return "zhipu";
  return null;
}
/** Key 输入框失焦时，如果地址是空的，按 Key 形态自动补上服务商 */
function onKeyBlur(){
  const base=$("apiBase").value.trim();
  if(base)return;                              // 用户已填地址，尊重他的选择
  const p=guessProvider($("apiKey").value);
  if(!p)return;
  const P={zhipu:["https://open.bigmodel.cn/api/paas/v4","glm-4v-flash"]}[p];
  if(!P)return;
  $("apiBase").value=P[0];
  if(!$("apiModel").value.trim())$("apiModel").value=P[1];
  $("apiPreset").value=p;
  toast("已自动识别为智谱，请核对");
}
function saveApi(){
  const base=$("apiBase").value.trim().replace(/\/+$/,"");
  if(!base){toast("请填 API 地址");return}
  S.api={base,model:$("apiModel").value.trim()||"glm-4v-flash",key:$("apiKey").value.trim()};
  save();toast(S.api.key?"设置已保存":"设置已保存（无 Key 模式）");
  $("apiTest").innerHTML="";
}
/** 把各种网络错误翻译成人能看懂的话 */
function apiErrorText(err,res){
  const m=String(err&&err.message||err||"");
  if(/Failed to fetch|NetworkError|Load failed/i.test(m))
    return "连不上这个地址。常见原因：① 地址写错（末尾不要加 /chat/completions）；② 接口不支持浏览器直连（CORS）；③ 网络不通。";
  if(/401|403|Unauthorized|invalid.*key|api key/i.test(m))
    return "Key 不对或没有权限。检查是否复制完整、有没有多余空格。";
  if(/400/.test(m)){
    // 这是最容易被误判成「模型不对/版本旧」的一类错：其实是图没发对
    if(/image length and width|must be larger than/i.test(m))
      return "图片尺寸太小（宽高要大于 10 像素）。不是 Key 的问题，换张正常照片就行。";
    if(/URL does not appear to be valid|InvalidParameter|invalid_parameter/i.test(m))
      return "图片被判格式无效（400）。多半是 HEIC 照片或图太大 —— 用相机重拍一张，或先把图转成 JPG 再选。";
    return "请求被拒绝（400）：" + m.slice(0, 90);
  }
  if(/404/.test(m))return "地址或模型名不对（404）。确认 API 地址只写到版本号那一级（如 /v4、/api/v3），模型名去控制台复制最新的。";
  if(/429/.test(m))return "请求太频繁或额度用完了，等一会儿再试。";
  return m;
}
/** 测试连接：用一张 1×1 的图片发一次最小请求，验证地址+模型+Key 三者都对 */
async function testApi(){
  // 不要用全局 event（只在浏览器事件派发时存在，且在严格模式下是 ReferenceError）
  const btn=$("apiTestBtn");if(btn)btn.disabled=true;
  const out=$("apiTest");
  out.innerHTML=`<div class="hint"><span>测试中…</span></div>`;
  const base=($("apiBase").value.trim()||"").replace(/\/+$/,"");
  const model=$("apiModel").value.trim()||"glm-4v-flash";
  const key=$("apiKey").value.trim();
  if(!base){out.innerHTML=`<div class="hint" style="color:var(--danger)"><span>先填 API 地址</span></div>`;if(btn)btn.disabled=false;return}
  // 64×64 纯色 PNG（136 字节）。**别改回 1×1** —— 通义对宽高有下限，
  // 1×1 会回「height:1 or width:1 must be larger than 10」，
  // 用户看到 400 会以为 Key 或地址填错了，其实只是占位图太小。
  const px="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAT0lEQVR42u3PQQkAAAgEsOtlELuY3gi+hcEKLDX9WgQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQELgse8sDx+HzoIgAAAABJRU5ErkJggg==";
  const t0=Date.now();
  try{
    const res=await fetch(base+"/chat/completions",{
      method:"POST",
      headers:Object.assign({"Content-Type":"application/json"},
        key?{"Authorization":"Bearer "+key}:{}),
      body:JSON.stringify({model,messages:[
        {role:"user",content:[{type:"text",text:"回复 OK 两个字即可"},{type:"image_url",image_url:{url:px}}]}]})
    });
    const txt=await res.text();
    if(!res.ok){
      let msg=txt.slice(0,160);
      try{const j=JSON.parse(txt);msg=(j.error&&(j.error.message||j.error.code))||(j.message)||msg}catch(e){}
      throw new Error("HTTP "+res.status+"："+msg);
    }
    let j;try{j=JSON.parse(txt)}catch(e){throw new Error("返回的不是 JSON："+txt.slice(0,80))}
    const reply=(j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content)||"";
    const ms=Date.now()-t0;
    out.innerHTML=`<div class="hint" style="color:var(--accent)"><span>${ic("check",14)}连接正常（${ms} ms）· 模型 ${esc(model)} 能看图</span></div>
      ${reply?`<div class="hint" style="margin-top:6px"><span>模型回复：${esc(String(reply).slice(0,60))}</span></div>`:""}`;
  }catch(err){
    out.innerHTML=`<div class="hint" style="color:var(--danger)"><span>${ic("alert",14)}${esc(apiErrorText(err))}</span></div>`;
  }
  if(btn)btn.disabled=false;
}
async function doScan(){
  const base=(S.api.base||"").replace(/\/+$/,"");
  const hasKey=!!(S.api.key||"").trim();
  if(!base){toast("先填 API 地址");$("apiBox").open=true;$("apiBox").scrollIntoView({behavior:"smooth"});return}
  if(!curImgs.length){toast("先选一张图");return}
  const mode=$("scanMode").value;
  const sys=mode==="pack"
    ?`你是中文食品营养成分表识别专家。用户可能上传同一包装食品的多张照片（例如第 1 张是配料表、第 2 张是营养成分表，或不同角度）。请综合所有图片的信息，以每100g可食部为基准提取中国国标 GB 28050 的强制标示项：热量(千卡)、蛋白质(g)、脂肪(g)、饱和脂肪(g)、碳水化合物(g)、糖(g)、钠(mg)，另外尽量给出膳食纤维(g)。若表中标注的是每份含量，请根据每份克重换算为每100g。没有标注的项目按同类食品合理估算。grams = 这一份（一包/一瓶/一袋）的可食部总重量，标签上有净含量就按净含量，没有就按常见包装规格估。如果照片里有**不止一种食品**（比如一桌菜、一个便当盒），就分别列成多条；只有一种就一条。note = 一句话说明你看到了什么、怎么判断的（20 字以内，说人话）。只返回JSON，格式：{"items":[{"name":"具体商品名","grams":整份克数,"energy":数值,"protein":数值,"fat":数值,"satfat":数值,"carbs":数值,"sugar":数值,"sodium":数值,"fiber":数值}],"note":"一句话"}`
    :`你是食物营养估算专家。用户可能上传多张食物照片（同一餐的不同菜、或同一食物的不同角度）。请综合所有图片识别出食物，**逐个列出**：盘子里有几样食物就列几条（米饭、炒菜、肉、汤分开算），每种给出可食部每100g的估算值：热量(千卡)、蛋白质(g)、脂肪(g)、饱和脂肪(g)、碳水化合物(g)、糖(g)、钠(mg)、膳食纤维(g)。数值参考《中国食物成分表》。若是熟食/菜肴，请特别注意中餐的隐形油盐（炒菜、勾芡、糖醋会显著抬高脂肪和钠），按常见做法估算。**关键**：每条还要估算这一份**实际的可食部总重量 grams** —— 看盘子/餐盒大小、食物占的面积和堆起来的厚度、跟常见份量比。估不准也要给一个数，别留空。只算能吃的部分，骨头、壳、汤汁不算。再给一个 note：一句话说明整张图（20 字以内，说人话，不要客套）。只返回JSON，格式：{"items":[{"name":"食物名","grams":整份克数,"energy":数值,"protein":数值,"fat":数值,"satfat":数值,"carbs":数值,"sugar":数值,"sodium":数值,"fiber":数值}],"note":"一句话"}`;
  const btn=$("doScan");btn.disabled=true;
  const n=curImgs.length;
  $("scanMsg").innerHTML=`<span>识别中（${n} 张图），请稍候…</span>`;
  try{
    // 多张图一起发：模型能在一次上下文里交叉比对（配料表 + 营养成分表 正是这种用法）
    // 缩图失败的会被 shrink 返回 null，必须滤掉 —— 否则会发一个坏 URL 过去，
    // 上游回一个跟真实原因无关的 400
    const all=await Promise.all(curImgs.map(s=>shrink(s)));
    const shrunk=all.filter(Boolean);
    if(!shrunk.length)throw new Error("这几张图都读不出来（可能是 HEIC 或已损坏），换一张 JPG/PNG 试试");
    const content=[{type:"text",text:shrunk.length>1?`请综合这 ${shrunk.length} 张图片进行识别`:"请识别这张图"}];
    shrunk.forEach(u=>content.push({type:"image_url",image_url:{url:u}}));
    const res=await fetch(base+"/chat/completions",{
      method:"POST",
      // 无 Key 模式（自建代理）时不带 Authorization 头，否则有些代理会拒绝
      headers:Object.assign({"Content-Type":"application/json"},
        hasKey?{"Authorization":"Bearer "+S.api.key}:{}),
      body:JSON.stringify({model:S.api.model,messages:[
        {role:"system",content:sys},
        {role:"user",content:content}]})
    });
    if(!res.ok){const t=await res.text();throw new Error("HTTP "+res.status+"："+t.slice(0,120))}
    const data=await res.json();
    const txt=data.choices[0].message.content;
    const m=txt.match(/\{[\s\S]*\}/);
    if(!m)throw new Error("模型没有返回 JSON："+txt.slice(0,80));
    const j=JSON.parse(m[0]);
    // 兼容两种返回：新的 {items:[...]}，和老的单个对象
    const arr=Array.isArray(j.items)&&j.items.length?j.items:(j.name?[j]:[]);
    const num=v=>{const n=Number(v);return isFinite(n)?n:0};
    scanItems=arr.map(x=>{
      const nm=String(x.name||"").trim();
      return {n:nm,g:num(x.grams),k:num(x.energy),p:num(x.protein),f:num(x.fat),
              c:num(x.carbs),fb:num(x.fiber),na:num(x.sodium),sf:num(x.satfat),sg:num(x.sugar),
              cat:guessCat(nm)};
    }).filter(x=>x.n);
    if(!scanItems.length)throw new Error("模型没认出食物，换一张更清楚的试试");
    aiNote=String(j.note||"").trim();
    $("scanResult").style.display="block";
    showMode("list");
    renderItems();
    $("scanMsg").innerHTML=`<span style="color:var(--accent)">识别成功（用了 ${n} 张图），请核对数值</span>`;
    $("scanResult").scrollIntoView({behavior:"smooth",block:"center"});
  }catch(err){
    $("scanMsg").innerHTML=`<span style="color:var(--danger)">${esc(apiErrorText(err))}</span><br><span style="color:var(--ink-3)">可在下方「识别接口设置」里点「测试连接」排查</span>`;
  }
  btn.disabled=false;
}
function shrink(src,max=1024){
  return new Promise(ok=>{
    const im=new Image();
    im.onload=()=>{
      // 尺寸必须是整数：canvas 宽高是 unsigned long，给小数会被截断，
      // 极端情况下截成 0 就直接抛异常
      const k=Math.min(1,max/Math.max(im.width,im.height));
      const w=Math.round(im.width*k),h=Math.round(im.height*k);
      if(!w||!h){ok(null);return}
      const cv=document.createElement("canvas");
      cv.width=w;cv.height=h;
      cv.getContext("2d").drawImage(im,0,0,w,h);
      let out="";
      try{out=cv.toDataURL("image/jpeg",.82)}catch(e){ok(null);return}
      // 上游只认 data URL。裸 base64 会被判 400「URL 无效」，
      // 所以这里宁可返回 null（上层跳过这张），也不要放个坏 URL 过去
      ok(/^data:image\//.test(out)?out:null);
    };
    // 读不出来就跳过这张 —— 以前这里返回原始 src，手机拍的 HEIC 大图
    // 会以「看起来像 data URL 但上游不认」的形态发出去，最后报一个
    // 跟真实原因无关的 400
    im.onerror=()=>ok(null);
    im.src=src;
  });
}
function readR(){
  const nm=$("rN").value.trim();
  const num=id=>{const el=$(id);return el?parseFloat(el.value)||0:0};
  return {n:nm,k:num("rK"),p:num("rP"),
    f:num("rF"),c:num("rC"),
    fb:num("rFb"),na:num("rNa"),sf:num("rSf"),sg:num("rSg"),
    g:num("rG"),
    cat:$("rCat")?$("rCat").value:guessCat(nm)};
}
function aiToStock(){
  const list=(scanItems&&scanItems.length)?scanItems:[readR()];
  const ok=list.filter(r=>r.n&&r.g>0);
  if(!ok.length){toast("填名称和克重");return}
  ok.forEach(r=>{
    S.inv.push({id:uid(),n:r.n,g:r.g,k:r.k,p:r.p,f:r.f,c:r.c,fb:r.fb,
      na:r.na,sf:r.sf,sg:r.sg,cat:r.cat||guessCat(r.n)});
  });
  save();toast(ok.length>1?`已加入库存 ${ok.length} 条`:"已加入库存");
  clearScan();go("tab-stock");
}
/** 直接记入今日饮食：
    likeStock=true → 从库存里扣（默认）
    likeStock=false → 外食，不动库存（标记 out:true） */
function aiToLog(out){
  const list=(scanItems&&scanItems.length)?scanItems:[readR()];
  const ok=list.filter(r=>r.n&&r.g>0);
  if(!ok.length){toast("先填名称和克重");return}
  const d=todayStr();S.log[d]=S.log[d]||[];
  let hit=0;
  ok.forEach(r=>{
    const nut={k:r.k,p:r.p,f:r.f,c:r.c,fb:r.fb,na:r.na,sf:r.sf,sg:r.sg},sc=scale(nut,r.g);
    const entry={n:r.n,g:r.g,k:sc.k,p:sc.p,f:sc.f,c:sc.c,fb:sc.fb,na:sc.na,sf:sc.sf,sg:sc.sg};
    // 每条各自去库存里找同名食材扣减；找不到就标成外食，不动库存
    const match=!out&&S.inv.find(it=>it.n===r.n&&it.g>=r.g);
    if(match){
      entry.iid=match.id;
      entry.b={k:match.k,p:match.p,f:match.f,c:match.c,fb:match.fb,
        na:match.na,sf:match.sf,sg:match.sg,cat:match.cat,low:match.low};
      match.g=Math.round((match.g-r.g)*10)/10;
      if(match.g<=0)S.inv=S.inv.filter(x=>x.id!==match.id);
      hit++;
    }else{
      entry.out=true;
    }
    S.log[d].push(entry);
  });
  save();
  if(out)toast(`已记入 ${ok.length} 条（不影响库存）`);
  else if(hit===ok.length)toast(ok.length>1?`已记入 ${ok.length} 条，库存都扣了`:"已记入今日，库存已扣减");
  else if(hit>0)toast(`已记入 ${ok.length} 条，其中 ${hit} 条扣了库存`);
  else toast(`已记入 ${ok.length} 条（库存里没有匹配的食材）`);
  clearScan();go("tab-today");
}
/** 全屏外食记录：不拍照也能记 */
function outEatSheet(){
  sheet(`<h3>${ic("fork",18)}在外吃饭</h3>
    <div class="hint" style="margin-bottom:12px"><span>记录外面的餐食，<b>不影响库存</b>。可以拍照识别，也可以手填。</span></div>
    <div class="fld"><label>吃了什么</label><input id="oeN" placeholder="如：牛肉面 / 外卖盖饭 / 咖啡拿铁"></div>
    <div class="grid2">
      <div class="fld"><label>份量克重 (g)</label><input id="oeG" type="number" inputmode="decimal" value="300"></div>
      <div class="fld"><label>热量 kcal</label><input id="oeK" type="number" inputmode="decimal" placeholder="按份估算"></div>
    </div>
    <div class="grid2">
      <div class="fld"><label>蛋白质 g</label><input id="oeP" type="number" inputmode="decimal"></div>
      <div class="fld"><label>碳水 g</label><input id="oeC" type="number" inputmode="decimal"></div>
      <div class="fld"><label>脂肪 g</label><input id="oeF" type="number" inputmode="decimal"></div>
      <div class="fld"><label>纤维 g</label><input id="oeFb" type="number" inputmode="decimal"></div>
      <div class="fld"><label>钠 mg</label><input id="oeNa" type="number" inputmode="decimal" placeholder="选填"></div>
      <div class="fld"><label>饱和脂肪 g</label><input id="oeSf" type="number" inputmode="decimal" placeholder="选填"></div>
      <div class="fld"><label>糖 g</label><input id="oeSg" type="number" inputmode="decimal" placeholder="选填"></div>
    </div>
    <div class="hint" style="margin-bottom:12px"><span>填的是整份的量（不是每 100g）。只想记热量也行，其余留空按 0 计。</span></div>
    <div class="btnrow"><button class="btn-o" onclick="closeSheet()">取消</button>
      <button class="btn-g" onclick="doOutEat()">记入今日</button></div>`);
}
function doOutEat(){
  const n=$("oeN").value.trim();
  if(!n){toast("填吃了什么");return}
  const g=parseFloat($("oeG").value)||0, k=parseFloat($("oeK").value)||0;
  if(g<=0&&k<=0){toast("至少填克重或热量");return}
  const d=todayStr();
  const num=id=>{const el=$(id);return el?parseFloat(el.value)||0:0};
  (S.log[d]=S.log[d]||[]).push({
    n,g:g||0,k,p:num("oeP"),c:num("oeC"),
    f:num("oeF"),fb:num("oeFb"),na:num("oeNa"),sf:num("oeSf"),sg:num("oeSg"),out:true
  });
  save();closeSheet();renderToday();toast("已记入今日（不影响库存）");
}

/* ================= 我的 ================= */
/* ================= 自适应 TDEE 面板 ================= */
function renderAdapt(){
  const el=$("adaptBox");if(!el)return;
  const a=adaptiveTDEE();
  if(!a.ok){
    // 数据不足：告诉用户「差什么、还差多少」，而不是一句「数据不足」
    const need=ADAPT.minValid;
    const pctW=a.span?Math.min(100,Math.round(a.span/ADAPT.minSpan*100)):0;
    const pctD=Math.min(100,Math.round(a.valid/need*100));
    el.innerHTML=`
      <div class="hint" style="margin-bottom:12px"><span>用你自己的数据反推真实消耗，比公式更准。
        需要<b>连续 ${ADAPT.win} 天饮食记录</b> + <b>跨度 ${ADAPT.minSpan} 天以上的体重记录</b>。</span></div>
      <div class="limrow">
        <div class="lh"><span class="gl"><i style="background:var(--d-protein)"></i>饮食记录</span>
          <b>${a.valid}<em>/${need} 天</em></b></div>
        <div class="lbar"><i style="width:${pctD}%;background:var(--d-protein)"></i></div>
      </div>
      <div class="limrow" style="padding-bottom:0">
        <div class="lh"><span class="gl"><i style="background:var(--d-fiber)"></i>体重跨度</span>
          <b>${a.span}<em>/${ADAPT.minSpan} 天</em></b></div>
        <div class="lbar"><i style="width:${pctW}%;background:var(--d-fiber)"></i></div>
      </div>
      <div class="hint" style="margin-top:12px;color:var(--warn)"><span>${ic("info",14)}${esc(a.reason)}</span></div>`;
    return;
  }
  const up=a.slope>0.005, down=a.slope<-0.005;
  const trendTxt=up?`每周 +${Math.round(a.slope*7*100)/100} kg`
    :down?`每周 ${Math.round(a.slope*7*100)/100} kg`:`基本持平`;
  const diffTxt=(a.diff>0?"+":"")+a.diff;
  el.innerHTML=`
    <div class="kcalhero" style="padding-bottom:10px">
      <div class="kh-lab">反推的每日总消耗</div>
      <div class="kh-num"><b>${a.tdee}</b><span class="kh-u">kcal</span></div>
      <div class="kh-foot"><b>基于 ${a.valid} 天饮食 + ${a.pts} 次体重</b><span>趋势 ${trendTxt}</span></div>
    </div>
    <div class="adaptrows">
      <div class="ar"><span>日均摄入</span><b>${a.avgIntake} kcal</b></div>
      <div class="ar"><span>体重趋势</span><b>${a.slope>0?"+":""}${a.slope} kg/天</b></div>
      <div class="ar"><span>平均训练</span><b>${a.avgEx} kcal/天</b></div>
      <div class="ar"><span>公式估算</span><b>${a.formula} kcal</b></div>
      <div class="ar" style="border-bottom:none"><span>两者差</span><b style="color:${Math.abs(a.diff)>200?"var(--warn)":"var(--ink)"}">${diffTxt} kcal</b></div>
    </div>
    ${a.excluded?`<div class="hint" style="margin-top:10px"><span>已剔除 ${a.excluded} 天记录不完整的日子（漏记整餐会让消耗被低估）</span></div>`:""}
    <div class="seg" style="margin-top:14px">
      <button class="${S.useAdaptive?"on":""}" onclick="setAdaptive(true)">用自适应值</button>
      <button class="${S.useAdaptive?"":"on"}" onclick="setAdaptive(false)">用公式估算</button>
    </div>
    <div class="hint" style="margin-top:10px"><span>${S.useAdaptive
      ? "当前用自适应值当基线（已扣除平均训练量，当天训练消耗仍会另加）"
      : "当前用 Mifflin-St Jeor 公式 × 活动系数估算"}</span></div>`;
}
function setAdaptive(on){
  S.useAdaptive=!!on;save();renderAdapt();renderToday();
  toast(on?"已改用自适应消耗":"已改回公式估算");
}

function renderMe(){
  const p=S.profile;
  if(p){$("pSex").value=p.sex;$("pAge").value=p.age;$("pH").value=p.h;$("pW").value=p.w;$("pAct").value=p.act;$("pAdj").value=p.adj;$("pPk").value=p.pk}
  if($("pRest"))$("pRest").value=S.restKcal||0;
  const c=calc();
  // 训练日 / 休息日双目标对比
  $("pResult").innerHTML=c?`<div style="display:flex;gap:8px;flex-wrap:wrap">
    <span class="pill">基础代谢 <b>${c.bmr}</b> kcal</span>
    <span class="pill">全天消耗 <b>${c.tdee+c.exK}</b> kcal</span>
    <span class="pill" style="background:var(--accent-soft);border-color:transparent;color:var(--accent)">今日目标 <b style="color:var(--accent)">${c.target}</b> kcal</span></div>
    ${dualTargetHtml()}
    <div class="hint" style="margin-top:10px"><span>膳食纤维目标 <b>${c.fb}</b> g（训练日比休息日多 5g）</span></div>`
    :`<div class="hint"><span>填好后自动算出每日热量与营养素目标</span></div>`;
  renderExList();
  const a=S.api;$("apiBase").value=a.base;$("apiModel").value=a.model;$("apiKey").value=a.key;
  renderWeightTrend();
  renderRestBudget();
  renderAdapt();
  // 版本号 + 强制更新入口。纯前端 PWA 最难查的就是「他跑的到底是不是新版」，
  // 与其每次都问一遍，不如直接摆在界面上
  if($("buildInfo"))$("buildInfo").innerHTML=
    `<span>版本 <b>${BUILD}</b> · 改了东西看不到？<a href="javascript:forceUpdate()" style="color:var(--accent);text-decoration:underline">强制更新</a>（不会动你的数据）</span>`;
}

/** 注销 Service Worker + 清缓存后重载。只清静态资源缓存，localStorage 里的记录不受影响。 */
async function forceUpdate(){
  try{
    if(window.navigator&&navigator.serviceWorker){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }
    if(window.caches){
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
    }
  }catch(e){}
  location.reload();
}

/** 训练日 vs 休息日目标并排显示，让人一眼看到差多少 */
function dualTargetHtml(){
  const p=S.profile;
  if(!p)return "";
  // 构造一个「今天训练的高强度」场景做对比
  const train={bmr:0};
  const c1=calc();                                    // 今天的真实情况
  // 临时算一个休息日版本
  const savedPlan=S.plan[todayStr()], savedEx=S.ex[todayStr()];
  S.plan=Object.assign({},S.plan);delete S.plan[todayStr()];
  S.ex=Object.assign({},S.ex);delete S.ex[todayStr()];
  const cRest=calc();
  // 临时算一个训练日版本（假设中等强度 60 分钟力量训练）
  const w=p.w;
  S.ex=Object.assign({},S.ex);
  S.ex[todayStr()]=[{n:"力量训练",min:60,hr:0,kcal:Math.round(5*w),intensity:"mid",mode:"met"}];
  S.plan=Object.assign({},S.plan);
  S.plan[todayStr()]={rest:false,type:"力量训练",min:60,intensity:"mid"};
  const cTrain=calc();
  // 还原
  S.plan=Object.assign({},S.plan);
  if(savedPlan)S.plan[todayStr()]=savedPlan; else delete S.plan[todayStr()];
  S.ex=Object.assign({},S.ex);
  if(savedEx)S.ex[todayStr()]=savedEx; else delete S.ex[todayStr()];
  if(!cRest||!cTrain)return "";
  const row=(lab,sub,a,b,unit)=>{
    return `<div class="dual-row">
      <span class="dual-lab">${lab}<em>${sub}</em></span>
      <span class="dual-v">${a}${unit||"g"}</span>
      <span class="dual-arrow">→</span>
      <span class="dual-v hot">${b}${unit||"g"}</span>
    </div>`;
  };
  // 限量项：两天的上限是一样的（钠固定 2000mg；饱和脂肪/糖随热量 10% 浮动）
  const capRow=(lab,sub,a,b,unit)=>
    `<div class="dual-row cap">
      <span class="dual-lab">${lab}<em>${sub}</em></span>
      <span class="dual-v">≤${a}${unit}</span>
      <span class="dual-arrow">→</span>
      <span class="dual-v hot">≤${b}${unit}</span>
    </div>`;
  return `<div class="dual">
    <div class="dual-head">
      <span></span><span class="dual-h">休息日</span><span></span><span class="dual-h hot">训练日</span>
    </div>
    ${row("热量","非训练日 / 训练日",cRest.target,cTrain.target," kcal")}
    ${row("蛋白质","按强度上调",cRest.pg,cTrain.pg)}
    ${row("碳水","按 g/kg 分档",cRest.cg,cTrain.cg)}
    ${row("膳食纤维","训练日 +5g",cRest.fb,cTrain.fb)}
    <div class="dual-sep">限量项（压住，不是吃够）</div>
    ${capRow("钠","国标强制标示",cRest.naLimit,cTrain.naLimit," mg")}
    ${capRow("饱和脂肪","总热量 10%",cRest.sfLimit,cTrain.sfLimit," g")}
    ${capRow("糖","总热量 10%，上限 50g",cRest.sgLimit,cTrain.sgLimit," g")}
  </div>
  <div class="hint" style="margin-top:9px"><span>训练日示例：60 分钟中等强度力量训练。实际以当天日程/记录为准。限量项依据 GB 28050 强制标示项与《中国居民膳食指南》。</span></div>`;
}

function renderExList(){
  const el=$("exList");if(!el)return;
  const d=todayStr(),ex=S.ex[d]||[];
  const pl=S.plan[d];
  let h="";
  if(pl){
    h+=`<div class="plrow mini">
      <span class="pl-ic">${ic(pl.rest?"yoga":exIcon(pl.type),18)}</span>
      <div style="flex:1;min-width:0"><div class="nm">今日日程：${pl.rest?"休息":esc(pl.name||pl.type)}</div>
      ${pl.rest?"":`<div class="dt">${[pl.km?pl.km+" km":"",pl.min?pl.min+" 分钟":"",pl.intensity?INTENSITY_LABEL[pl.intensity]:""].filter(Boolean).join(" · ")}</div>`}</div>
      <button class="btn-s" onclick="planSheet('${d}')">改</button>
    </div>`;
  }else{
    h+=`<button class="btn-o" style="margin-bottom:10px" onclick="planSheet('${d}')">${ic("calendar",16)}安排今日训练</button>`;
  }
  h+=`<button class="btn-g" onclick="exSheet()">${ic("plus",18)}记录一次训练</button>`;
  if(ex.length){
    h+=`<div style="margin-top:12px">`+ex.map((e,i)=>
      `<div class="item"><div class="nm">${esc(e.n)}<span class="g">${exSub(e)}</span></div>
       <div style="display:flex;align-items:center;gap:10px"><span class="tagk" style="color:var(--accent)">−${Math.round(e.kcal)}</span>
       <button class="btn-r" onclick="delEx(${i})">${ic("trash",14)}</button></div></div>`).join("")+`</div>`;
  }else{
    h+=`<div class="hint" style="margin-top:10px"><span>支持自定义项目与距离/配速；填了平均心率会用心率公式算，更贴近你的实际消耗</span></div>`;
  }
  // 自定义项目列表
  if((S.myEx||[]).length){
    h+=`<div class="mylist"><div class="grp-title">我的自定义项目 · ${S.myEx.length}</div>
      ${S.myEx.map((e,i)=>`<div class="item"><div class="nm">${esc(e.n)}<span class="g">MET ${e.m} · ${e.grp||"其他"}</span></div>
      <button class="btn-r" onclick="delMyEx(${i})">${ic("trash",14)}</button></div>`).join("")}</div>`;
  }
  el.innerHTML=h;
}
function delMyEx(i){
  const e=S.myEx[i];if(!e)return;
  S.myEx.splice(i,1);save();renderMe();toast("已删除 "+e.n);
}

/** 休息日热量预算卡片 */
function renderRestBudget(){
  const el=$("restBudget");if(!el)return;
  const v=Number(S.restKcal)||0;
  const p=S.profile;
  if(!p){el.innerHTML="";return}
  const bmr=Math.round(10*p.w+6.25*p.h-5*p.age+(p.sex==="m"?5:-161));
  const tdee=Math.round(bmr*p.act);
  const restTarget=Math.round(Math.max(tdee+v,bmr*1.1));
  el.innerHTML=`<div class="hint" style="margin:0"><span>${v===0?"休息日与平时目标一致。想「练多吃多、不练少吃」就设一个负值":`休息日目标 ≈ <b>${restTarget}</b> kcal（比平时 ${v>0?"多":"少"} ${Math.abs(v)}）`}</span></div>`;
}

function saveProfile(){
  const p={sex:$("pSex").value,age:parseFloat($("pAge").value)||0,h:parseFloat($("pH").value)||0,
    w:parseFloat($("pW").value)||0,act:parseFloat($("pAct").value),adj:parseFloat($("pAdj").value),pk:parseFloat($("pPk").value)};
  if(!p.age||!p.h||!p.w){toast("请填完整");return}
  if(p.age<10||p.age>100){toast("年龄请填 10–100");return}
  if(p.h<100||p.h>250){toast("身高请填 100–250 cm");return}
  if(p.w<25||p.w>300){toast("体重请填 25–300 kg");return}
  const prevW=S.profile?S.profile.w:null;
  S.profile=p;save();
  // 体重变化 → 自动记一笔体重日志（趋势图数据来源）
  if(prevW===null||Math.abs(prevW-p.w)>=0.05) logWeight(p.w);
  renderMe();renderToday();toast("已保存");
}
function saveRest(){
  const v=parseFloat($("pRest").value);
  if(isNaN(v)){toast("填一个数字");return}
  if(v<-1000||v>1000){toast("请填 −1000 ~ 1000 之间");return}
  S.restKcal=Math.round(v);save();renderRestBudget();renderToday();
  toast(v===0?"休息日不再单独调整":"已设置");
}

/* ---------- 连续记录天数 ----------
   只统计「有饮食记录」的天。今天还没记不算断（当天尚未结束），
   从昨天往前连续数；昨天也没记则 streak=0。 */
function streakDays(){
  const has=d=>{const l=S.log[d];return !!(l&&l.length)};
  const back=i=>{const t=new Date();t.setDate(t.getDate()-i);
    return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0")};
  let n=0;
  if(has(back(0))) n++;                 // 今天记了
  for(let i=1;i<=400;i++){              // 往前连续数
    if(has(back(i))) n++;
    else break;
  }
  return n;
}
// 本月记录天数（用于「月度坚持」）
function monthDays(){
  const t=new Date(), pre=t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0");
  return Object.keys(S.log).filter(d=>d.startsWith(pre)&&S.log[d]&&S.log[d].length).length;
}
function renderStreak(){
  const el=$("streakBox");if(!el)return;
  if(!S.profile){el.innerHTML="";return}
  const n=streakDays(), md=monthDays();
  if(!n&&!md){el.innerHTML="";return}
  const best=(S.bestStreak=Math.max(S.bestStreak||0,n));
  const msg=n>=14?"稳定得不像话":n>=7?"已经成习惯了":n>=3?"保持住":"记录满 3 天开始有趋势";
  el.innerHTML=`<div class="card streak">
    <div class="sk-main">
      <span class="sk-flame">${ic("flame",20)}</span>
      <div>
        <div class="sk-num">${n}<span>天</span></div>
        <div class="sk-lab">连续记录 · ${msg}</div>
      </div>
    </div>
    <div class="sk-side">
      <div class="sk-cell"><b>${md}</b><span>本月天数</span></div>
      <div class="sk-cell"><b>${best}</b><span>最长连续</span></div>
    </div>
  </div>`;
}
/* ---------- 体重趋势：单点噪声没有意义，看的是斜率 ---------- */
function logWeight(w){
  const d=todayStr();
  S.wt=S.wt||{};
  S.wt[d]=Math.round(w*10)/10;      // 同一天改多次只留最后一次
  save();
}
// 体重趋势：返回近 n 条 [{d,w}]，按时间升序
function weightSeries(n=30){
  const keys=Object.keys(S.wt||{}).sort();
  return keys.slice(-n).map(d=>({d,w:S.wt[d]}));
}
// 用最小二乘算斜率（kg/周），无足够数据返回 null
// 注意 x 轴必须用「真实天数」而不是数组序号：如果你连记一周然后停三周，
//    用序号会把那三周压成一个点，斜率被严重扭曲。
function weightTrend(){
  const s=weightSeries(30);
  if(s.length<2)return null;
  const x0=dOf(s[s.length-1].d).getTime();
  const pts=s.map(x=>({x:(x0-dOf(x.d).getTime())/86400000,y:x.w}));
  const n=pts.length;
  const mx=pts.reduce((a,p)=>a+p.x,0)/n, my=pts.reduce((a,p)=>a+p.y,0)/n;
  let num=0,den=0;
  pts.forEach(p=>{num+=(p.x-mx)*(p.y-my);den+=(p.x-mx)**2});
  if(!den)return null;
  const perDay=-(num/den);           // 负号：x 是「距今天数」，越大越早
  const first=s[0].w, last=s[s.length-1].w;
  return {
    kgPerWeek:Math.round(perDay*7*100)/100,
    delta:Math.round((last-first)*100)/100,
    first,last,points:n,span:s[0].d+" ~ "+s[s.length-1].d,
  };
}
function renderWeightTrend(){
  const el=$("wtTrend");if(!el)return;
  const s=weightSeries(30), t=weightTrend();
  if(s.length===0){
    el.innerHTML=`<div class="hint"><span>保存身体数据后，这里会记录体重变化趋势</span></div>`;
    return;
  }
  // 折线图：宽 300 高 64 的视口，用 polyline 画
  const W=300,H=64,PAD=6;
  const ws=s.map(x=>x.w), mn=Math.min(...ws), mx=Math.max(...ws), rng=(mx-mn)||1;
  const pts=s.map((x,i)=>{
    const px=s.length===1?W/2:i/(s.length-1)*W;
    const py=H-PAD-((x.w-mn)/rng)*(H-PAD*2);
    return [Math.round(px*10)/10,Math.round(py*10)/10];
  });
  const line=pts.map(p=>p.join(",")).join(" ");
  const dots=pts.map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${i===pts.length-1?3.2:1.8}" fill="var(--accent)"${i===pts.length-1?' stroke="var(--surface)" stroke-width="1.5"':""}/>`).join("");
  const last=s[s.length-1];
  let chg="";
  if(t&&Math.abs(t.delta)>=0.1){
    const up=t.delta>0;
    chg=`<span class="wt-chg" style="color:${up?"var(--danger)":"var(--accent)"}">${up?"+":""}${t.delta} kg / ${t.points}次记录</span>`;
  }
  el.innerHTML=`
    <div class="wt-head">
      <div><span class="wt-cur">${last.w}</span><span class="wt-unit">kg</span></div>
      <div class="wt-side">
        ${chg}
        ${t?`<span class="wt-pace">约 ${t.kgPerWeek>0?"+":""}${t.kgPerWeek} kg/周</span>`:""}
      </div>
    </div>
    <svg class="wt-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <polyline points="${line}" fill="none" stroke="var(--accent)" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
      ${dots}
    </svg>
    <div class="wt-foot"><span>${s.length} 次记录 · ${t?t.span:""}</span>
      <button class="btn-s" style="padding:5px 9px;font-size:11.5px" onclick="logWeightSheet()">记录体重</button></div>`;
}
function logWeightSheet(){
  const cur=S.profile?S.profile.w:60;
  sheet(`<h3>记录今日体重</h3>
    <div class="fld"><label>体重 (kg)</label>
      <input id="wtIn" type="number" inputmode="decimal" step="0.1" value="${cur}" autofocus></div>
    <div class="hint" style="margin:-6px 0 12px"><span>同一天改多次只保留最后一次；趋势看斜率，不看单日波动</span></div>
    <div class="btnrow"><button class="btn-o" onclick="closeSheet()">取消</button>
      <button class="btn-g" style="flex:1" onclick="doLogWeight()">保存</button></div>`);
}
function doLogWeight(){
  const v=parseFloat($("wtIn").value);
  if(!v||v<25||v>300){toast("体重请填 25–300 kg");return}
  const d=todayStr();S.wt=S.wt||{};S.wt[d]=Math.round(v*10)/10;
  if(S.profile){S.profile.w=Math.round(v*10)/10;$("pW").value=v}
  save();closeSheet();renderMe();renderToday();toast("已记录 "+v+" kg");
}
/* ================= 训练与日程 ================= */

/** 全部可选运动 = 内置 + 用户自定义 */
function allEx(){
  return EXERCISES.concat((S.myEx||[]).map(e=>Object.assign({custom:true},e)));
}
function findEx(name){
  return allEx().find(e=>e.n===name)||null;
}

/* ---------- 训练记录抽屉（自由填写） ----------
   位移型：距离 km 必填，时长选填（给了就能算配速）
   非位移型：时长必填
   都可选填平均心率 → 走 Keytel 公式，更贴近个体 */
let exSel=null;
function exSheet(preName){
  const names=allEx();
  exSel=findEx(preName)||names[0];
  drawExSheet();
}
function drawExSheet(){
  const p=S.profile||{w:70};
  const ex=exSel;
  const isDist=ex.mode==="dist";
  // 分组渲染 select
  const grps={};
  allEx().forEach(e=>{ (grps[e.grp||"其他"]=grps[e.grp||"其他"]||[]).push(e) });
  const opts=Object.keys(grps).map(g=>
    `<optgroup label="${esc(g)}">${grps[g].map(e=>
      `<option value="${esc(e.n)}"${e.n===ex.n?" selected":""}>${esc(e.n)}${e.custom?" ·自定义":""}</option>`).join("")}</optgroup>`).join("");
  sheet(`<h3>记录训练</h3>
    <div class="fld"><label>运动项目</label>
      <select id="exN" onchange="pickEx(this.value)">${opts}</select></div>
    <div class="exhint" id="exHint"></div>
    <div class="grid2">
      ${isDist
        ?`<div class="fld"><label>距离 (km) <b style="color:var(--accent)">必填</b></label><input id="exKm" type="number" inputmode="decimal" step="0.01" placeholder="5"></div>
          <div class="fld"><label>用时 (分钟) <span style="color:var(--ink-3)">选填</span></label><input id="exMin" type="number" inputmode="decimal" placeholder="30"></div>`
        :`<div class="fld"><label>时长 (分钟) <b style="color:var(--accent)">必填</b></label><input id="exMin" type="number" inputmode="decimal" placeholder="60"></div>
          <div class="fld"><label>&nbsp;</label><div class="expace" id="exPace">—</div></div>`}
    </div>
    <div class="fld"><label>平均心率 (bpm) <span style="color:var(--ink-3)">选填，填了更准</span></label>
      <input id="exHr" type="number" inputmode="numeric" placeholder="145">
      <div class="hint" style="margin-top:6px" id="exHrHint"></div>
    </div>
    <div class="exprev" id="exPrev"></div>
    <div class="btnrow" style="margin-top:14px">
      <button class="btn-o" onclick="newExSheet()">新建项目</button>
      <button class="btn-g" onclick="doAddEx()">记录</button>
    </div>`);
  ["exKm","exMin","exHr"].forEach(id=>{const el=$(id);if(el)el.oninput=updExPrev});
  updExPrev();
  const f=$(isDist?"exKm":"exMin"); if(f)setTimeout(()=>f.focus(),120);
}
function pickEx(name){ exSel=findEx(name)||exSel; drawExSheet() }
function updExPrev(){
  const ex=exSel;if(!ex)return;
  const p=S.profile||{w:70};
  const km=parseFloat(($("exKm")||{}).value)||0;
  const min=parseFloat(($("exMin")||{}).value)||0;
  const hr=parseFloat(($("exHr")||{}).value)||0;
  // 提示行
  const hn=$("exHint");
  if(hn){
    if(ex.mode==="dist"){
      hn.innerHTML=`${ic("info",13)}<span>位移型：按 <b>${ex.kcalPerKm}</b> kcal/(kg·km) 算，热量与配速几乎无关——所以填距离最关键</span>`;
    }else{
      hn.innerHTML=`${ic("info",13)}<span>按 MET ${ex.m} × 体重 × 时长算</span>`;
    }
  }
  // 配速显示
  const pe=$("exPace");
  if(pe)pe.innerHTML=km&&min
    ?`<span class="pacev">${paceStr(km,min)}</span><span class="paces">${speedStr(km,min)}</span>`
    :`<span style="color:var(--ink-3);font-size:12px">填距离后显示配速</span>`;
  // 心率区提示
  const hh=$("exHrHint");
  if(hh){
    if(hr&&S.profile&&S.profile.age){
      const z=hrZone(hr,S.profile.age),m=maxHR(S.profile.age);
      hh.innerHTML=`最大心率约 ${m} bpm · 心率区 ${z}/5 · 将用 Keytel 公式按心率算`;
    }else if(S.profile&&S.profile.age){
      hh.innerHTML=`你的最大心率约 ${maxHR(S.profile.age)} bpm（Tanaka 公式）`;
    }else{hh.innerHTML=""}
  }
  // 消耗预估
  const burn=exBurn({mode:ex.mode,met:ex.m, kcalPerKm:ex.kcalPerKm, km, min, hr},S.profile||{sex:"m",w:70,age:25});
  const pr=$("exPrev");
  if(pr&&burn>0){
    const how=hr&&min>0?"心率公式":"距离法/时段法";
    pr.innerHTML=`<span class="exk">−${burn}</span><span class="exklab">kcal</span>
      <span class="exhow">${how}</span>`;
  }else if(pr){pr.innerHTML=`<span style="color:var(--ink-3);font-size:12.5px">填完${ex.mode==="dist"?"距离":"时长"}后显示消耗</span>`}
}
function doAddEx(){
  if(!S.profile){toast("先填身体数据");closeSheet();return}
  const ex=exSel;if(!ex){toast("选一个项目");return}
  const km=parseFloat(($("exKm")||{}).value)||0;
  const min=parseFloat(($("exMin")||{}).value)||0;
  const hr=parseFloat(($("exHr")||{}).value)||0;
  if(ex.mode==="dist"&&km<=0){toast("位移型运动要填距离");return}
  if(ex.mode!=="dist"&&min<=0){toast("填时长");return}
  if(km>500){toast("距离请小于 500 km");return}
  if(min>900){toast("单次时长请小于 900 分钟");return}
  if(hr&&(hr<60||hr>230)){toast("心率请填 60–230 bpm");return}
  const kcal=exBurn({mode:ex.mode,met:ex.m,kcalPerKm:ex.kcalPerKm,km,min,hr},S.profile);
  if(kcal<=0){toast("算不出消耗，检查输入");return}
  const d=todayStr();
  (S.ex[d]=S.ex[d]||[]).push({
    n:ex.n,km:km||0,min:min||0,hr:hr||0,kcal,
    intensity:ex.intensity||"mid",icon:ex.ic||"lift",mode:ex.mode
  });
  save();closeSheet();renderToday();renderMe();
  toast(`已记录 −${kcal} kcal，训练日目标已上调`);
}
/** 新建自定义运动项目 */
function newExSheet(){
  const grps=["有氧","力量","球类","柔韧","格斗","户外","操课","混合","其他"];
  sheet(`<h3>新建运动项目</h3>
    <div class="hint" style="margin-bottom:12px"><span>自定义项目按 MET 估算。MET 参考：走路 4 / 慢跑 8 / 快跑 10 / 力量 5 / 跳绳 12</span></div>
    <div class="fld"><label>名称</label><input id="neN" placeholder="如：攀岩 / 划船机 / 遛狗"></div>
    <div class="grid2">
      <div class="fld"><label>强度 (MET)</label><input id="neM" type="number" inputmode="decimal" step="0.1" placeholder="6"></div>
      <div class="fld"><label>归类</label><select id="neG">${grps.map(g=>`<option value="${g}">${g}</option>`).join("")}</select></div>
    </div>
    <div class="fld"><label>强度档（决定训练日营养目标）</label>
      <select id="neI">
        <option value="low">低强度 — 散步、瑜伽</option>
        <option value="mid" selected>中等强度 — 慢跑、力量</option>
        <option value="high">高强度 — 冲刺、大重量、HIIT</option>
      </select></div>
    <div class="btnrow"><button class="btn-o" onclick="exSheet()">返回</button>
      <button class="btn-g" onclick="doNewEx()">保存</button></div>`);
}
function doNewEx(){
  const n=$("neN").value.trim();
  const m=parseFloat($("neM").value)||0;
  if(!n){toast("填名称");return}
  if(m<1||m>25){toast("MET 请填 1–25");return}
  if(findEx(n)){toast("已有同名项目");return}
  S.myEx=S.myEx||[];
  S.myEx.push({n, m, grp:$("neG").value, intensity:$("neI").value, mode:"met", ic:"lift", custom:true});
  save();exSel=findEx(n);drawExSheet();toast("已添加 "+n);
}
function delEx(i){
  const d=todayStr();(S.ex[d]||[]).splice(i,1);save();renderToday();renderMe();
}

/* ================= 训练页 ================= */
function renderTrain(){
  const el=$("trainBox");if(!el)return;
  const today=todayStr();
  const c=calc(),pl=S.plan[today],ex=S.ex[today]||[];
  let h="";

  if(!S.profile){
    el.innerHTML=`<div class="card"><div class="empty">${ic("lift",40,'style="color:var(--line-2);margin:0 auto 14px"')}
      先填身体数据<br><span style="font-size:12px">训练消耗要按体重算，去「我的」补上</span></div></div>`;
    return;
  }

  // ---- 今日状态 ----
  const tr=isTrainDay(today);
  h+=`<div class="card trainhero">
    <div class="th-top">
      <div>
        <div class="th-lab">今日</div>
        <div class="th-big">${tr?"训练日":"休息日"}</div>
        <div class="th-sub">${pl&&!pl.rest?(esc(pl.name||pl.type)+(pl.min?` · ${pl.min} 分钟`:"")):(pl&&pl.rest?"主动恢复":(tr?"已记录训练":"未排课"))}</div>
      </div>
      <div class="th-badge">${ic(tr?"flame":"yoga",26)}</div>
    </div>
    <div class="th-acts">
      <button class="btn-g" onclick="exSheet()">${ic("plus",17)}记录训练</button>
      <button class="btn-o" onclick="planSheet('${today}')">${ic("calendar",17)}排日程</button>
    </div>
  </div>`;

  // ---- 今日训练列表 ----
  if(ex.length){
    h+=`<div class="card"><h3>${ic("flame",18)}今日已完成<span class="count">−${Math.round(c.exK)} kcal</span></h3>`
      +ex.map((e,i)=>`<div class="item"><div style="flex:1;min-width:0">
        <div class="nm">${esc(e.n)}<span class="g">${exSub(e)}</span></div>
        ${e.km&&e.min?`<div class="dt">配速 ${paceStr(e.km,e.min)} · ${speedStr(e.km,e.min)}</div>`:""}
      </div>
      <div style="display:flex;align-items:center;gap:10px"><span class="tagk" style="color:var(--accent)">−${Math.round(e.kcal)}</span>
      <button class="btn-r" onclick="delEx(${i})">${ic("trash",14)}</button></div></div>`).join("")
      +`</div>`;
  }

  // ---- 日历 ----
  h+=`<div class="card"><h3>${ic("calendar",18)}训练日历<span class="count">点日期可排课</span></h3>
    <div id="trainCal"></div></div>`;

  // ---- 周统计 ----
  const wk=[];
  for(let i=6;i>=0;i--){
    const d=dstr(i);
    const ks=(S.ex[d]||[]).reduce((a,e)=>a+(e.kcal||0),0);
    const hasPlan=S.plan[d]&&!S.plan[d].rest;
    wk.push({d,train:isTrainDay(d),kcal:ks,done:(S.ex[d]||[]).length>0,plan:hasPlan});
  }
  const done=wk.filter(x=>x.done).length, planned=wk.filter(x=>x.plan||x.done).length;
  const totalK=wk.reduce((a,x)=>a+x.kcal,0);
  const types={};
  for(let i=6;i>=0;i--){ (S.ex[dstr(i)]||[]).forEach(e=>{types[e.n]=(types[e.n]||0)+1}) }
  const top=Object.keys(types).sort((a,b)=>types[b]-types[a]).slice(0,3);
  h+=`<div class="card"><h3>${ic("chart",18)}近 7 天<span class="count">${done}/${planned||7} 天</span></h3>
    <div class="statrow">
      <div class="statcell"><b>${done}</b><span>完成训练</span></div>
      <div class="statcell"><b>${Math.round(totalK)}</b><span>总消耗 kcal</span></div>
      <div class="statcell"><b>${top.length?esc(top[0]):"—"}</b><span>最常练</span></div>
    </div>
    ${top.length?`<div class="hint" style="margin-top:12px"><span>常练项目：${top.map(t=>esc(t)+" ×"+types[t]).join(" · ")}</span></div>`:""}
  </div>`;

  // ---- 自定义项目 ----
  const my=S.myEx||[];
  h+=`<div class="card"><h3>${ic("plus",18)}我的动作库<span class="count">${allEx().length} 个项目</span></h3>
    <div class="hint" style="margin:0 0 12px"><span>内置 ${EXERCISES.length} 个${my.length?`，你自定义了 ${my.length} 个`:""}。找不到你的运动？新建一个。</span></div>
    <button class="btn-o" onclick="newExSheet()">${ic("plus",16)}新建运动项目</button>
    ${my.length?`<div style="margin-top:12px">${my.map((e,i)=>
      `<div class="item"><div class="nm">${esc(e.n)}<span class="g">MET ${e.m} · ${esc(e.grp||"其他")} · ${INTENSITY_LABEL[e.intensity||"mid"]}</span></div>
      <button class="btn-r" onclick="delMyEx(${i})">${ic("trash",14)}</button></div>`).join("")}</div>`:""}
  </div>`;

  el.innerHTML=h;
  // 日历渲染到训练页容器
  renderCalIntoTrain($("trainCal"));
}

/** 训练页的日历（与抽屉里的日历分开渲染，避免 id 冲突） */
function renderCalIntoTrain(box){
  if(!box)return;
  if(calY==null){const t=new Date();calY=t.getFullYear();calM=t.getMonth()}
  const y=calY,m=calM;
  const first=new Date(y,m,1), startDow=first.getDay();
  const daysInMonth=new Date(y,m+1,0).getDate();
  const td=todayStr(), pad=n=>String(n).padStart(2,"0");
  const cells=[];
  for(let i=0;i<startDow;i++)cells.push(null);
  for(let i=1;i<=daysInMonth;i++)cells.push(`${y}-${pad(m+1)}-${pad(i)}`);
  const names=["日","一","二","三","四","五","六"];
  const monthDone=Object.keys(S.ex).filter(d=>d.startsWith(`${y}-${pad(m+1)}`)&&(S.ex[d]||[]).length).length;
  box.innerHTML=`<div class="calhead">
      <button class="btn-icon" style="padding:5px" onclick="calGoTrain(-1)">${ic("chevL",16)}</button>
      <b>${y} 年 ${m+1} 月<span class="calcount">${monthDone} 天有训练</span></b>
      <button class="btn-icon" style="padding:5px" onclick="calGoTrain(1)">${ic("chevR",16)}</button>
    </div>
    <div class="calgrid">${names.map(n=>`<span class="caldow">${n}</span>`).join("")}
      ${cells.map(d=>{
        if(!d)return `<span class="calcell empty"></span>`;
        const pl=S.plan[d], trained=(S.ex[d]||[]).length>0, isT=d===td;
        let cls="calcell", mark="";
        if(pl&&pl.rest){cls+=" rest";mark=`<i class="mk rest"></i>`}
        else if(pl){cls+=" plan";mark=`<i class="mk plan"></i>`}
        if(trained)mark=`<i class="mk done"></i>`;
        if(isT)cls+=" today";
        return `<span class="${cls}" onclick="calClick('${d}')"><b>${parseInt(d.slice(-2),10)}</b>${mark}</span>`;
      }).join("")}
    </div>
    <div class="callegend">
      <span><i class="mk plan"></i>已排训练</span>
      <span><i class="mk rest"></i>休息日</span>
      <span><i class="mk done"></i>已完成</span>
    </div>`;
}
function calGoTrain(dir){
  let y=calY,m=calM+dir;
  if(m<0){m=11;y--}if(m>11){m=0;y++}
  calY=y;calM=m;renderCalIntoTrain($("trainCal"));
}

let calY=null, calM=null;   // 当前显示的年月
function planSheet(day){
  const today=todayStr();
  const d=day||today;
  const pl=S.plan[d];
  const isRest=!!(pl&&pl.rest);
  const curType=(pl&&pl.type)||"";
  const grps={};
  allEx().forEach(e=>{ (grps[e.grp||"其他"]=grps[e.grp||"其他"]||[]).push(e) });
  const opts=Object.keys(grps).map(g=>
    `<optgroup label="${esc(g)}">${grps[g].map(e=>
      `<option value="${esc(e.n)}"${e.n===curType?" selected":""}>${esc(e.n)}</option>`).join("")}</optgroup>`).join("");
  // 星期表头 + 日历格子
  sheet(`<h3>${ic("calendar",18)}训练日程<span class="count">${d}</span></h3>
    <div class="calwrap" id="calWrap"></div>
    <div class="pl-edit">
      <div class="fld"><label>这一天</label>
        <div class="seg" id="plSeg">
          <button class="${isRest?"":"on"}" onclick="setPlanRest(false)">训练</button>
          <button class="${isRest?"on":""}" onclick="setPlanRest(true)">休息</button>
        </div>
      </div>
      <div id="plTrainBox" style="display:${isRest?"none":"block"}">
        <div class="fld"><label>练什么</label>
          <select id="plN">${opts||`<option value="">先去「记录训练」新建项目</option>`}</select></div>
        <div class="grid2">
          <div class="fld"><label>距离 (km) <span style="color:var(--ink-3)">位移型填</span></label><input id="plKm" type="number" inputmode="decimal" step="0.01" value="${(pl&&pl.km)||""}" placeholder="5"></div>
          <div class="fld"><label>时长 (分钟)</label><input id="plMin" type="number" inputmode="decimal" value="${(pl&&pl.min)||""}" placeholder="45"></div>
        </div>
        <div class="fld"><label>强度档</label>
          <select id="plI">
            <option value="low"${pl&&pl.intensity==="low"?" selected":""}>低强度</option>
            <option value="mid"${!pl||pl.intensity==="mid"?" selected":""}>中等强度</option>
            <option value="high"${pl&&pl.intensity==="high"?" selected":""}>高强度</option>
          </select></div>
      </div>
    </div>
    <div class="btnrow" style="margin-top:6px">
      ${pl?`<button class="btn-r" style="flex:0 0 auto" onclick="delPlan('${d}')">清除</button>`:""}
      <button class="btn-o" onclick="closeSheet()">取消</button>
      <button class="btn-g" onclick="savePlan('${d}')">保存</button>
    </div>`);
  renderCal(calY,calM,d);
  // 选不同类型时自动带出模式
  const sel=$("plN");
  if(sel)sel.onchange=()=>{
    const e=findEx(sel.value);
    if(e){
      $("plI").value=e.intensity||"mid";
      const kmEl=$("plKm");
      if(kmEl)kmEl.placeholder=e.mode==="dist"?"5":"非位移型不用填";
    }
  };
}
let planRestTmp=false;
function setPlanRest(r){
  planRestTmp=r;
  const box=$("plTrainBox");
  if(box)box.style.display=r?"none":"block";
  const seg=$("plSeg");
  if(seg){[...seg.children].forEach((b,i)=>b.classList.toggle("on",(i===1)===r))}
}
function renderCal(y,m,selDay){
  const wrap=$("calWrap");if(!wrap)return;
  if(y==null){const t=new Date();y=calY=t.getFullYear();m=calM=t.getMonth()}
  const first=new Date(y,m,1);
  const startDow=first.getDay();                        // 0=周日
  const daysInMonth=new Date(y,m+1,0).getDate();
  const td=todayStr();
  const pad=n=>String(n).padStart(2,"0");
  const cells=[];
  for(let i=0;i<startDow;i++)cells.push(null);
  for(let i=1;i<=daysInMonth;i++)cells.push(`${y}-${pad(m+1)}-${pad(i)}`);
  const names=["日","一","二","三","四","五","六"];
  wrap.innerHTML=`<div class="calhead">
      <button class="btn-icon" style="padding:5px" onclick="calGo(-1)">${ic("chevL",16)}</button>
      <b>${y} 年 ${m+1} 月</b>
      <button class="btn-icon" style="padding:5px" onclick="calGo(1)">${ic("chevR",16)}</button>
    </div>
    <div class="calgrid">${names.map(n=>`<span class="caldow">${n}</span>`).join("")}
      ${cells.map(d=>{
        if(!d)return `<span class="calcell empty"></span>`;
        const pl=S.plan[d];
        const trained=(S.ex[d]||[]).length>0;
        const isT=d===td, isSel=d===selDay;
        let cls="calcell", mark="";
        if(pl&&pl.rest){cls+=" rest";mark=`<i class="mk rest"></i>`}
        else if(pl){cls+=" plan";mark=`<i class="mk plan"></i>`}
        if(trained)mark=`<i class="mk done"></i>`;
        if(isT)cls+=" today";
        if(isSel)cls+=" sel";
        return `<span class="${cls}" onclick="calClick('${d}')"><b>${parseInt(d.slice(-2),10)}</b>${mark}</span>`;
      }).join("")}
    </div>
    <div class="callegend">
      <span><i class="mk plan"></i>已排训练</span>
      <span><i class="mk rest"></i>休息日</span>
      <span><i class="mk done"></i>已完成</span>
    </div>`;
}
function calGo(dir){
  let y=calY,m=calM+dir;
  if(m<0){m=11;y--}if(m>11){m=0;y++}
  calY=y;calM=m;renderCal(y,m);
}
function calClick(d){ planRestTmp=false; planSheet(d) }

function savePlan(d){
  const isRest=planRestTmp||($("plTrainBox")&&$("plTrainBox").style.display==="none");
  const pl={rest:!!isRest};
  if(!isRest){
    pl.type=$("plN")?$("plN").value:"";
    pl.name=pl.type;
    pl.km=parseFloat($("plKm").value)||0;
    pl.min=parseFloat($("plMin").value)||0;
    pl.intensity=$("plI").value;
    if(pl.km>500||pl.min>900){toast("距离/时长超出范围");return}
  }
  S.plan=S.plan||{};
  S.plan[d]=pl;
  planRestTmp=false;
  save();closeSheet();renderToday();
  toast(isRest?"已设为休息日":"已排课："+pl.name);
}
function delPlan(d){
  if(S.plan)delete S.plan[d];
  planRestTmp=false;
  save();closeSheet();renderToday();toast("已清除日程");
}
/** 一键把今日日程写成一笔训练记录 */
function quickExSheet(){
  const d=todayStr();
  const pl=S.plan[d];
  if(!pl||pl.rest){toast("今天没有排训练");return}
  exSel=findEx(pl.type);
  if(!exSel){toast("找不到这个项目，请手动记录");exSheet();return}
  exSheet(pl.type);
  // 预填计划值
  setTimeout(()=>{
    if($("exKm")&&pl.km)$("exKm").value=pl.km;
    if($("exMin")&&pl.min)$("exMin").value=pl.min;
    updExPrev();
  },60);
}

/* ================= 数据 ================= */
function exportData(){
  const blob=new Blob([JSON.stringify({...S,api:{...S.api,key:""}},null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="shishi-backup-"+todayStr()+".json";
  a.click();
}
function importData(ev){
  const f=ev.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=e=>{
    try{
      const o=JSON.parse(e.target.result);
      o.api=S.api;S=o;save();renderMe();
      toast("导入成功");
    }catch(err){toast("文件格式不对")}
  };
  rd.readAsText(f);
}
function resetAll(){
  sheet(`<h3>清空所有数据？</h3>
    <div class="hint" style="margin-bottom:14px"><span>将删除全部身体数据、库存和饮食记录，<b style="color:var(--danger)">不可恢复</b>。建议先导出备份。</span></div>
    <div class="btnrow"><button class="btn-o" onclick="closeSheet()">取消</button><button class="btn-r" style="flex:1" onclick="doReset()">确认清空</button></div>`);
}
function doReset(){localStorage.removeItem(KEY);location.reload()}

/* ================= 启动 ================= */
(function boot(){
  const names=["日","一","二","三","四","五","六"];
  const d=new Date();
  $("hdDate").textContent=`${todayStr()} 周${names[d.getDay()]} · 拍照识别 · 库存管家 · 训练与营养缺口`;
  // 注入导航图标
  const navIcons={ "tab-today":"today","tab-train":"lift","tab-stock":"stock","tab-scan":"scan","tab-me":"me" };
  document.querySelectorAll("nav button").forEach(b=>{
    const s=b.querySelector(".ic-nav");
    if(s)s.outerHTML=ic(navIcons[b.dataset.t]||"today",22);
  });
  applyTheme();
  go("tab-today");   // 激活默认页（.tab 默认 display:none，必须走 go 才会显示）

  // Key 粘贴完自动猜服务商（只在地址还空着时），少一步手动选择
  const keyEl=$("apiKey");
  if(keyEl)keyEl.addEventListener("blur",onKeyBlur);

  // 装到桌面：先按当前环境渲染一次，等浏览器抛出 beforeinstallprompt 再升级成「一键安装」
  renderInstall();
  window.addEventListener("beforeinstallprompt",e=>{
    e.preventDefault();          // 拦下浏览器自带的迷你提示条，改由应用内按钮触发
    deferredPrompt=e;
    renderInstall();
  });
  window.addEventListener("appinstalled",()=>{
    deferredPrompt=null;
    renderInstall();
    toast("已添加到桌面");
  });

  if("serviceWorker" in navigator&&location.protocol.indexOf("http")===0){
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  }
})();
