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
app.use(express.static(path.join(__dirname, 'public')));//设置静态文件路径
app.use(session({
    secret: config.session.secret,// 通过设置 secret 来计算 hash 值并放在 cookie 中，使产生的 signedCookie 防篡改 建议使用 128 个字符的随机字符串
    resave: true,// 强制更新 session
    saveUninitialized: false,// 设置为 false，强制创建一个 session，即使用户未登录
    cookie: { maxAge: config.session.maxAge},// 过期时间，过期后 cookie 中的 session id 自动删除 //时长
    store: new store(config.mysql)
}));


app.use('/',require('./routes/index'));
app.use('/api',require('./routes/api'));
app.use('/order_food',require('./routes/order_food'));
app.use('/lucky_draw',require('./routes/lucky_draw'));
app.use('/invite',require('./routes/invite'));
app.use('/angular/login',require('./routes/login'));



app.listen(config.part,function(){
	console.log('已启动'+new Date());
});
