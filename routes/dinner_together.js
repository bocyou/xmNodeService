var express = require('express');
var request = require('request');
var router = express.Router();
var mysql = require('../lib/mysql');
var session = require('express-session');

var schedule = require('node-schedule');
var postUsersNews = require('../routes/public/post_news').postUsersNews;
var WebSocketServer = require('websocket').server;
var http = require('http');
router.get('/', function (req, res) {
    res.render('index', {title: 'logs'});

});

//websoket获取用户信息
function getUserInfo(session,callback){
    mysql.sql( 'SELECT * FROM custom_session tab1 JOIN users tab2 ON tab1.open_id = tab2.open_id WHERE session_key = "'+session+'"', function (err, result) {
        if(result&&result.length>0){
            callback(result);

        }else{
            console.log(err);

        }

    })
}
//获取最新一期信息
function getNewTerm(callback){
    mysql.sql( 'SELECT * FROM dinner_together  WHERE is_new = 1', function (err, result) {
        if(result&&result.length>0){
            callback(result);

        }else{
            console.log(err);

        }

    })
}

//获取当期注资信息

function getDinnerInfo(term,callback){
    mysql.sql( 'SELECT money,tab1.create_time,user_name,user_img  FROM dinner_together_info tab1 JOIN users tab2 ON tab1.user_id=tab2.id  WHERE term = '+term, function (err, result) {
        if(result&&result.length>0){
          callback(result);

        }else{
            console.log(err);

        }

    })
}

const work={
    pay(connection,data){
        const self=this;
        getUserInfo(data.session, function (userInfo) {
            console.log(userInfo[0].id);
            getNewTerm((term_info)=>{
                console.log(term_info);
                mysql.insert_one('dinner_together_info', {
                    user_id: userInfo[0].id,
                    money: data.money,
                    create_time: new Date(),
                    term:term_info[0].term
                }, function (result, err) {
                    if(err){
                        connection.sendUTF(JSON.stringify({result: [], type:'pay',code: 500, message: "注资失败"}))
                    }else{
                        connection.sendUTF(JSON.stringify({result: [],type:'pay', code: 200, message: "注资成功"}))
                        self.getDinnerInfo(connection)
                    }

                    console.log(err);
                });
            })


        });
    },
    getDinnerInfo (connection,clients){
        getNewTerm((term_info)=>{
            const term=term_info[0].term;
            getDinnerInfo(term,(dinner_info)=>{
                // 广播消息
                clients.forEach(function(ws1){
                    connection.sendUTF(JSON.stringify({result:dinner_info ,type:'dinner_info', code: 200, message: `获取${term}期数据成功`}))
                })

            });
        })
    }
};



//管理部分
router.post('/manage/get_current_term', function (req, res, next) {
    mysql.sql( 'SELECT * FROM dinner_together  WHERE is_new = 1', function (err, result) {
        if(result&&result.length>0){
            res.status(200).send({code: 200, result: result[0], message: '获取本期信息成功'});

        }else{
            res.status(200).send({code: 500, result: [], message: '获取本期信息失败'});

        }

    })
})

router.post('/manage/over', function (req, res, next) {

    mysql.sql( 'SELECT * FROM dinner_together  WHERE is_new = 1', function (err, result) {
        if(result&&result.length>0){
           const term=result[0].term;
           console.log(term);
           if(parseInt(result[0].status)===1){
               //结束本期
               mysql.updateData('dinner_together', 'term="' + term + '"', 'status="0",over_time="' + new Date().Format('yy-MM-dd HH:mm:ss') + '"', function (result, err) {
                   if (err) {
                       res.status(200).send({code: 500, result: [], message: '结束失败'});
                   } else {
                       res.status(200).send({code: 200, result: [], message: '已结束'});
                   }
               })

           }else{
               //开启新一期
               mysql.sql('update dinner_together set is_new =0 WHERE term ="' + term + '"', function (err, result) {
                   if (err) {
                       console.log(err);
                   } else {
                       mysql.insert_one('dinner_together', {
                           term: parseInt(term)+1,
                           create_time: new Date(),
                           status:1,
                           over_time:'',
                           is_new:1
                       }, function (result, err) {
                           console.log(err);
                           if(err){
                               res.status(200).send({code: 500, result: [], message: '开启失败'});
                           }else{
                               res.status(200).send({code: 200, result: [], message: '已开启'});
                           }

                       });
                   }
               })

           }


        }else{
            res.status(200).send({code: 500, result: [], message: '获取本期信息失败'});

        }

    })
})
module.exports = {
    router:router,
    pay:work.pay,
    getDinnerInfo: work.getDinnerInfo
};