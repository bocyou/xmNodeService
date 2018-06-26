var express = require('express');
var request = require('request');
var router = express.Router();
var mysql = require('../lib/mysql');
var session = require('express-session');
var checkSession = require('../middlewares/check_session').checkSession;
var checkAppSession = require('../middlewares/check_session').checkAppSession;
var crypto = require('crypto');
var tool = require('../middlewares/tool');
var getUserInfo = tool.getUserInfo;
var getCurrentSession = tool.getCurrentSession;
var schedule = require('node-schedule');

router.get('/', function (req, res) {

    res.status(200).send('彩票')

});



router.post('/get_user_words', checkAppSession,function (req, res, next) {
    //获取所有用户统计手机号(仅北京地区)
    res.header("Access-Control-Allow-Origin", "*");
    mysql.sql('SELECT area,id,user_name,user_img,towords_phone FROM users  WHERE area="bj" AND towords_phone is not null', function(err, result) {
        if(err){
            res.status(200).send({code: 500, result: [],message:'查询失败'});
        }else{
            var users=result;
            var phone_ary=[];
            users.forEach(function(item,idx){
                phone_ary.push(item.towords_phone);
            })
            request.post({
                url: 'http://preapi.towords.com/fun/count_user_word_week_data.do', formData: {
                    mobile_phone_list: phone_ary
                }
            }, function optionalCallback(err, httpResponse, body) {
                if (err) {
                    res.status(200).send({code: 500, result: [],message:'获取用户单词数失败'});
                } else {
                    var towords_data=JSON.parse(body);
                    if(towords_data.code==200){

                        users=users.map(function(item,idx){
                            item.word=towords_data.result[item.towords_phone];
                            return item;
                        });
                        res.status(200).send({code: 200,result:users, message: '获取用户单词数成功'});

                    }else{
                        res.status(200).send({code: 500, result: [],message:'获取数据失败'});
                    }

                }

            });
        }


    })

/*    getUserInfo(req.headers.sessionkey, function (userInfo) {
        if (userInfo) {
            mysql.insert_one('shop_money', {
                user_id: userInfo[0].id,
                money: req.body.money,
                create_time: new Date()
            }, function (result, err) {
                if (result&&err==null) {
                    res.status(200).send( {code: 200, result: true, message: '扫码入账成功'})
                } else {
                    res.status(200).send( {code:500, result: false, message: '扫码入账失败'})
                }
            });
        } else {
            res.status(200).send({code:500, result: [], message: '获取该用户信息失败'});
        }
    });*/



});


module.exports=router;