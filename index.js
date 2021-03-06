const express=require('express');
const session = require('express-session');
/*var MongoStore = require('connect-mongo')(session);*/
const store=require('express-mysql-session')(session);
const app=express();
const path=require('path');
const WebSocketServer = require('websocket').server;
const http = require('http');


const bodyParser = require('body-parser');//bodyParser用于解析客户端请求的body中的内容,内部使用JSON编码处理,url编码处理以及对于文件的上传处理.
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
const config = require('config-lite');




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





/*const getUserWords=require('./routes/lottery').userWords;*/
const lottery=require('./routes/dinner_together');
const {getHomeWeibo,overWeibo} =require('./routes/weibo');
const {shakeInfo,updateShakeNum,getCurrentWinUser,shakeRouter} =require('./routes/shake');
//长连接
// 连接池
let clients = [];
const httpServer = http.createServer((request, response) => {
    console.log('[' + new Date + '] Received request for ' + request.url)
    response.writeHead(404)
    response.end()
});


const wsServer = new WebSocketServer({
    httpServer: httpServer,
    autoAcceptConnections: true
});

httpServer.listen(8081, () => {
    console.log('[' + new Date() + '] Serveris listening on port 8081')
});

wsServer.on('connect', connection => {
    clients.push(connection);

    connection.on('message', message => {
        if (message.type === 'utf8') {
            /!* console.log('>> message content from client: ' + message.utf8Data)*!/


            const data=JSON.parse(message.utf8Data);


            switch (data.type){
           /*     case 'user_words':
                    //拓词猜猜看获取单词
                    getUserWords(connection);

                    break;*/
                case 'dinner_together_pay':

                    lottery.pay(connection,data,clients);
                    break;
                case 'dinner_together_info':
                    lottery.getDinnerInfo(connection,clients);
                    break;
                 case 'get_weibo':
                    //检测某人微博更新内容

                   getHomeWeibo(connection,data);
                    break;
                case 'over_weibo':
                    overWeibo(connection);
                    break;
                case 'get_shake_info':
                    shakeInfo(connection);
                    break;
                case 'update_shake_num':
                    updateShakeNum(connection,clients,data);
                    break;
                case 'get_win_user':
                    getCurrentWinUser(connection);
                    break;
            }

        }
    }).on('close', (reasonCode, description) => {
        // 连接关闭时，将其移出连接池
        clients = clients.filter(function(ws1){
            return ws1 !== connection
        });
        connection.user_status=0;

        console.log('[' + new Date() + '] Peer ' + connection.remoteAddress + ' disconnected.')
    })
});




/*静态页面*/
app.use('/',require('./routes/index'));
app.use('/invite_code',require('./routes/invite_code'));
app.use('/table',require('./routes/table'));
app.use('/paycode',require('./routes/pay_code'));
app.use('/shpaycode',require('./routes/pages/sh_pay_code'));
app.use('/weibo',require('./routes/special/weibo'));

/*接口*/
app.use('/xm/api',require('./routes/api'));
app.use('/xm/order_food',require('./routes/order_food'));
app.use('/xm/lucky_draw',require('./routes/lucky_draw'));
app.use('/xm/invite',require('./routes/invite'));
app.use('/xm/angular/login',require('./routes/login'));
app.use('/xm/me',require('./routes/me'));
app.use('/xm/service',require('./routes/service'));
app.use('/xm/logs',require('./routes/logs'));
app.use('/xm/timer',require('./routes/timer'));
app.use('/xm/shop_money',require('./routes/shop_money'));
/*app.use('/xm/lottery',require('./routes/lottery').router);*/
app.use('/xm/share_course',require('./routes/share_course'));
app.use('/xm/users',require('./routes/user_manage'));
app.use('/xm/export',require('./routes/export'));
app.use('/xm/xm_bill',require('./routes/xm_bill'));
app.use('/xm/dinner_together',lottery.router);
app.use('/xm/year',require('./routes/year'));
app.use('/xm/shake',shakeRouter);
app.use('/xm/fight_for_money',require('./routes/fight_for_money'));
app.use('/towords/articles',require('./routes/towords/articles'));
app.use('/towords/word_test',require('./routes/towords/word_test'));

app.use('/api',require('./routes/api'));
app.use('/order_food',require('./routes/order_food'));
app.use('/lucky_draw',require('./routes/lucky_draw'));
app.use('/invite',require('./routes/invite'));
app.use('/angular/login',require('./routes/login'));
app.use('/me',require('./routes/me'));
app.use('/service',require('./routes/service'));
/*app.use('/test',require('./routes/test'));*/
app.use('/logs',require('./routes/logs'));
app.use('/timer',require('./routes/timer'));


app.listen(config.part,function(){
	console.log('已启动'+new Date());
});
