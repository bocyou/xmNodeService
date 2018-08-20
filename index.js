var express=require('express');
var session = require('express-session');
/*var MongoStore = require('connect-mongo')(session);*/
var store=require('express-mysql-session')(session);
var app=express();
var path=require('path');




var bodyParser = require('body-parser');//bodyParser用于解析客户端请求的body中的内容,内部使用JSON编码处理,url编码处理以及对于文件的上传处理.

var config = require('config-lite');





app.set('views',path.join(__dirname,'views'));
app.engine("html",require("ejs").__express); // or   app.engine("html",require("ejs").renderFile);

//app.set("view engine","ejs");
app.set('view engine', 'html');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'xiaomai_manage')));//设置静态文件路径
app.use(session({
    secret: config.session.secret,// 通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改 建议使用 128 个字符的随机字符串
    resave: true,// 强制更新 session
    saveUninitialized: false,// 设置为 false，强制创建一个 session，即使用户未登录
    cookie: { maxAge: config.session.maxAge},// 过期时间，过期后 cookie 中的 session id 自动删除 //时长
    store: new store(config.mysql)
}));

/*静态页面*/
app.use('/',require('./routes/index'));
app.use('/invite_code',require('./routes/invite_code'));
app.use('/paycode',require('./routes/pay_code'));
app.use('/shpaycode',require('./routes/pages/sh_pay_code'));

/*接口*/
app.use('/xm/api',require('./routes/api'));
app.use('/xm/order_food',require('./routes/order_food'));
app.use('/xm/lucky_draw',require('./routes/lucky_draw'));
app.use('/xm/invite',require('./routes/invite'));
app.use('/xm/angular/login',require('./routes/login'));
app.use('/xm/me',require('./routes/me'));
app.use('/xm/service',require('./routes/service'));
app.use('/xm/test',require('./routes/test'));
app.use('/xm/logs',require('./routes/logs'));
app.use('/xm/timer',require('./routes/timer'));
app.use('/xm/shop_money',require('./routes/shop_money'));
app.use('/xm/lottery',require('./routes/lottery'));
app.use('/xm/share_course',require('./routes/share_course'));



app.use('/api',require('./routes/api'));
app.use('/order_food',require('./routes/order_food'));
app.use('/lucky_draw',require('./routes/lucky_draw'));
app.use('/invite',require('./routes/invite'));
app.use('/angular/login',require('./routes/login'));
app.use('/me',require('./routes/me'));
app.use('/service',require('./routes/service'));
app.use('/test',require('./routes/test'));
app.use('/logs',require('./routes/logs'));
app.use('/timer',require('./routes/timer'));
app.listen(config.part,function(){
	console.log('已启动'+new Date());
});
