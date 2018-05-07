/**
 * Created by haoguo on 17/10/16.
 */
var express = require('express');
var request = require('request');
var router = express.Router();
var mysql = require('../lib/mysql');
var session = require('express-session');
var checkSession = require('../middlewares/check_session').checkSession;
var tool = require('../middlewares/tool');
var getUserInfo = tool.getUserInfo;
var getCurrentSession = tool.getCurrentSession;

router.get('/', function (req, res) {
    res.render('api', {title: ''});

});

//管理部分

//获取今日有效订餐列表
router.post('/get_today_dinner',checkSession, function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    //获取今日状态为1的所有订餐信息



    mysql.sql( 'SELECT * FROM custom_session tab1 JOIN users tab2 ON tab1.open_id = tab2.open_id WHERE session_key = "'+session+'"', function (err, result) {
        if (result && result.length > 0) {
            //统计订餐信息
            var dinner_all_list = [];
            result.map(function (item, idx) {
                var dinner_list = {};
                item.dinner_list = JSON.parse(decodeURIComponent(item.dinner_list));
                dinner_list.food_list = item.dinner_list;
                var sum_price = 0;
                dinner_all_list = dinner_all_list.concat(dinner_list.food_list);
                dinner_list.food_list.forEach(function (item2, idx2) {
                    sum_price += (item2.list.price * item2.num);
                });
                dinner_list.sum_price = sum_price;
                item.dinner_list = dinner_list;
            });


            var statis_all_list = [];
            dinner_all_list.sort(function (a, b) {
                return a.list.id - b.list.id;
            });


            for (var i = 0; i < dinner_all_list.length;) {
                var repeat_num = 0;//此菜重复的次数用于统计
                var sum_num = 0;//此菜总数量
                for (var j = i; j < dinner_all_list.length; j++) {

                    if (dinner_all_list[i].list.id == dinner_all_list[j].list.id) {

                        sum_num += dinner_all_list[j].num;
                        repeat_num++;

                    }
                }

                statis_all_list.push({info: dinner_all_list[i].list, repeat_num: repeat_num, sum_num: sum_num});
                i += repeat_num;//比较之后从不同的项后再次开始比较

            }


            res.send(200, {
                code: 200,
                result: {list_all: statis_all_list, list_info: result},
                message: '获取今日所有订餐人员信息成功'
            });
        } else {
            res.send(200, {code: 200, result: {}, message: '尚无订餐信息'});
        }

    })



});

//获取所有菜单order_food
router.post('/all_dinner_list',checkSession, function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");


    mysql.search(req, res, next, 'order_food', function (rows, fields) {
        if (fields) {

            //list1:[],list2[]
            rows.sort(function (a, b) {
                return a.kind - b.kind;
            });
            var resultObj = {};
            var titleAry = [];
            for (var i = 0; i < rows.length;) {
                var count = 0;
                var name = rows[i].kind;
                var barAry = [];
                for (var j = i; j < rows.length; j++) {
                    if (rows[i].kind == rows[j].kind) {
                        count++;
                        barAry.push(rows[j]);
                    }
                }
                titleAry.push(name);
                resultObj[name] = barAry;
                resultObj.sum = count;
                i += count;
            }
            mysql.findToday('order_fooding', 'status="start"', function (result, err) {
                if (result && result.length > 0) {
                    res.send(200, {
                        code: 200,
                        result: {"list": rows, sort_list: resultObj, titleAry: titleAry, is_start: 1},
                        message: '获取所有菜单成功!已经开启订餐'
                    })
                } else {
                    res.send(200, {
                        code: 200,
                        result: {"list": rows, sort_list: resultObj, titleAry: titleAry, is_start: 0},
                        message: '获取所有菜单成功！尚未开启订餐'
                    })
                }
            });


        } else {
            res.send(200, {code: 200, result: {}, message: '获取所有菜单信息失败'})
        }

    });

});





//分发菜单,开启订餐
router.post('/start_dinner',checkSession, function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    var list_obj = req.body;
    list_obj.create_time = new Date();
    list_obj.status = "start";


    mysql.insert_one('order_fooding', list_obj, function (result, err) {
        if (result) {
            res.send(200, {code: 200, result: true, message: '分发成功'})
        } else {
            res.send(200, {code: 200, result: false, message: '分发失败'})
        }
    });

});

//结束订餐//更改status为over
router.post('/finish_dinner',checkSession, function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");

    mysql.updateData('order_fooding', 'status="start"', 'status="over",over_time="' + new Date().Format('yy-MM-dd HH:mm:ss') + '"', function (result, err) {
        if (result) {
            res.send(200, {code: 200, result: true, message: '结束订餐成功'});
        } else {
            res.send(200, {code: 501, result: err.sqlMessage, message: '结束订餐失败'});
        }
    })


});


//获取分发的菜单 order_fooding  同时检查用户是否刮卡
router.post('/get_dinner_list', function (req, res, next) {
    /*  getUserInfo(req.headers.sessionkey,function(userInfo){
          console.log(userInfo);
        });*/


    getCurrentSession(req.headers.sessionkey, function (user_info) {
        if (user_info && user_info.length > 0) {
            var user_id = user_info[0].user_id;
            if (user_info[0].area == 'bj') {
                //检查用户是否刮卡
                mysql.findToday('lucky_user_list', 'user_id="' + user_id + '"', function (result, err) {
                    if (result && result.length > 0) {
                        //获取当天最新的一条菜单
                        mysql.findMaxTime('order_fooding', 'create_time', function (result, err) {
                            if (result && result.length > 0) {
                                res.send(200, {code: 200, result: result[0], isDraw: 1, message: '获取订餐列表成功！该用户已刮卡'});
                            } else {
                                res.send(200, {code: 200, result: {}, isDraw: 1, message: '订餐尚未开始'});
                            }
                        });

                    } else {
                        res.send(200, {code: 200, result: {}, isDraw: 0, message: "该用户未刮奖"})
                    }
                })
            } else {
                res.send(200, {code: 200, result: {}, isDraw: 2, message: "该用户不属于北京校区"})
            }

        }

    }, res);


});



//保存用客户订餐信息order_food_user
router.post('/save_user_dinnerlist', function (req, res, next) {
    getUserInfo(req.headers.sessionkey, function (userInfo) {
        if (userInfo) {
            var dinner_list = req.body.dinner_list;
            var spread_money=req.body.spread_money;

            mysql.sql('SELECT * FROM order_food_user WHERE to_days(create_time) = to_days(now()) AND status = 1 AND user_id='+userInfo[0].id,function(err,result){
               if(err){
                   res.status(200).send({code: 500, result: false, message: '获取您的订餐信息失败'});
               }else{
                   if(result.length==0){
                       mysql.insert_one('order_food_user', {
                           user_id: userInfo[0].id,
                           dinner_list: dinner_list,
                           create_time: new Date(),
                           status: 1,
                           spread_money:spread_money
                       }, function (result, err) {
                           if (result) {
                               res.status(200).send( {code: 200, result: true, message: '订餐成功'})
                           } else {
                               res.status(200).send( {code:500, result: false, message: '订餐失败!可退出重试'})
                           }
                       });
                   }else{
                       res.status(200).send({code:500, result: [], message: '您已订餐！请勿重复点击'});
                   }
               }
            });
        } else {
            res.status(200).send({code:500, result: [], message: '获取该用户信息失败'});
        }
    });

});

//检查用户是否订餐根据ID查找(查找当日该用户当天最新的记录)
router.post('/check_currentuser_dinner', function (req, res, next) {
    getUserInfo(req.headers.sessionkey, function (userInfo) {

        if (userInfo) {
            var user_id = userInfo[0].id;
            mysql.sql('SELECT * FROM order_food_user WHERE to_days(create_time) = to_days(now()) AND status=1 And user_id='+ user_id,function(err,result){
                if(err==null){
                    if (result.length > 0) {
                        res.send(200, {code: 200, result: result[0], message: '获取订餐列表成功！'});
                    } else {
                        res.send(200, {code: 200, result: {}, message: '订餐尚未开始'});
                    }
                }else{
                    res.send(200, {code: 200, result: [], message: '获取该用户信息失败'});
                }
            })
         /*   mysql.findMaxTimeCondition('order_food_user', 'create_time', 'status=1 AND to_days(create_time) = to_days(now()) AND user_id=' + user_id, function (result, err) {
                console.log(result);
                if (result.length > 0) {
                    res.send(200, {code: 200, result: result[0], message: '获取订餐列表成功！'});
                } else {
                    res.send(200, {code: 200, result: {}, message: '订餐尚未开始'});
                }
            });*/

        } else {
            res.send(200, {code: 200, result: [], message: '获取该用户信息失败'});
        }
    });
});


//取消该用户订餐
router.post('/cancel_currentuser_dinner', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req.headers.sessionkey, function (userInfo) {
        if (userInfo) {
            var user_id = userInfo[0].id;
            var menu_id = req.body.menu_id;
            mysql.updateData('order_food_user', 'id="' + menu_id + '"', 'status="0"', function (result, err) {
                if (result) {
                    res.send(200, {code: 200, result: true, message: '取消订餐成功'});
                } else {
                    res.send(200, {code: 200, result: false, message: '取消订餐失败'});
                }
            })

        } else {
            res.send(200, {code: 200, result: [], message: '获取该用户信息失败'});
        }
    });
});




module.exports = router;