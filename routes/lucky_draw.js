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

//问题刮奖时不能重启服务
var lucjy_base = [0, 0, 1, 2, 2, 8, 6];
var lucky_bj = [];//各地区前20名刮奖数组
var lucky_nj = [];
var lucky_sh = [];

var lucky = {
    check_area: function (area) {
        var self = this;
        switch (area) {
            case 'bj':
                return lucky_bj;
                break;
            case 'nj':
                return lucky_nj;
                break;
            case 'nj':
                return lucky_sh;
                break;
        }
    },
    rest: function (area) {
        var self = this;
        //重置所有地区
        rest(lucky_bj);
        rest(lucky_nj);
        rest(lucky_sh);

        function rest(ary) {
            for (var i = 0; i < 20; i++) {
                if (lucjy_base[i] == undefined) {
                    ary.push(Math.round(Math.random() * 2 + 3));
                } else {
                    ary.push(lucjy_base[i]);
                }

            }
            //乱序(可有可无)
            ary.sort(function () {
                return Math.random() > .5 ? -1 : 1;
            });

        };

    },


    draw: function (area) {
        var self = this;

        function draw(lucky_ary) {

            if (lucky_ary.length == 0) {
                //取3-5中的随机数
                return Math.round(Math.random() * 2 + 3);
            } else {
                //在lucky_ary中随机取一个数并删除
                //1,取随机数0-数组长度

                var idx = Math.round(Math.random() * lucky_ary.length);
                var num = lucky_ary[idx];
                lucky_ary.splice(idx, 1);
                return num;

            }
        }

        return draw(self.check_area(area));


    }
}


router.get('/', function (req, res) {
    res.render('api', {title: ''});

});
/*var getUserInfo=function(session,callback){

    mysql.find_one('custom_session','session_key',[session], function (result) {

        if (result&&result.length>0) {
            var openId=result[0].open_id;
            //根据openid 获取用户信息
            mysql.find_one('users','open_id',[openId], function (result) {
                if(result.length>0){
                    callback(result);
                }else{
                 callback(false);
             }
         });

        }else{
            res.send(200, {code: 501, result: result,massage:'session已过期'})
        }

    });
}*/


//管理列表计算今天获得的钱数(仅北京地区)

router.post('/sum_user_draw_money', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    mysql.findToday('lucky_user_list', 'area="bj"', function (result, err) {
        console.log(err);
        if (result && result.length > 0) {
            var sum_mony = 0;
            result.forEach(function (item, idx) {
                sum_mony += item.money;
            });
            res.send(200, {code: 200, result: sum_mony, message: "获取所有用户刮奖信息成功"})
        } else {
            res.send(200, {code: 200, result: 0, message: "未查找到刮奖用户"})
        }

    })

});


//检查当前用户是否合法


router.post('/check_current_user', function (req, res, next) {
    getUserInfo(req.headers.session_key, function (userInfo) {
        if (userInfo.length > 0) {
            res.send(200, {code: 200, result: true, message: "该用户合法"})
        } else {
            res.send(200, {code: 200, result: false, message: "用户不合法"})
        }
    });

});

//获取所有用户(当天的)刮奖数据并区分当前用户
//如果没有人刮奖则重置lucky_ary
router.post('/get_user_draw_list', function (req, res, next) {

    getCurrentSession(req.headers.session_key, function (user_info) {
        if (user_info && user_info.length > 0) {
            var area = user_info[0].area;
            console.log(user_info);
            //取得用户所在地区

            mysql.findToday('lucky_user_list', 'area="' + area + '"', function (result, err) {
                console.log(err);
                if (result && result.length > 0) {
                    res.send(200, {code: 200, result: result, message: "获取所有用户刮奖信息成功"})
                } else {
                    lucky.rest();
                    res.send(200, {code: 200, result: [], message: "未查找到刮奖用户"})
                }

            })
        }

    }, res);


});

//获取本月，用户地区所有人员的刮卡记录前三名并根据id计算所有人员的总钱数
//返回姓名，钱数，用户头像，地区
router.post('/month_top_list', function (req, res, next) {

    getCurrentSession(req.headers.session_key, function (user_info) {
        if (user_info && user_info.length > 0) {
            var area = user_info[0].area;
            mysql.findMonth('lucky_user_list', 'area="' + area + '"', function (result, err) {
                if (err == null && result.length > 0) {
                    console.log(result);
                    //根据用户id排序
                    var statis_ary = [];
                    result.sort(function (a, b) {
                        return a.user_id - b.user_id
                    });
                    for (var i = 0; i < result.length;) {
                        var count = 0;
                        var all_money = 0;
                        for (var j = i; j < result.length; j++) {
                            if (result[i].user_id == result[j].user_id) {
                                count++;
                                all_money += result[i].money;
                            }
                        }

                        statis_ary.push({
                            user_name: result[i].user_name,
                            user_img: result[i].user_img,
                            sum_money: all_money
                        });
                        i += count;
                    }
                    statis_ary.sort(function (a, b) {
                        return b.sum_money - a.sum_money
                    });


                    res.send(200, {code: 200, result: statis_ary.slice(0, 3), message: "本月前三名数据成功"})
                } else {

                    res.send(200, {code: 200, result: [], message: "本月前三名数据失败"})
                }

            })
        }

    }, res);


});


//获取今日，各地区刮出0，8，6的人员
router.post('/get_user_special_list', function (req, res, next) {

    getCurrentSession(req.headers.session_key, function (user_info) {
        if (user_info && user_info.length > 0) {
            var area = user_info[0].area;
            mysql.findToday('lucky_user_list', 'area="' + area + '"', function (result, err) {
                if (err == null && result.length > 0) {
                    var ary = result.filter(function (item, idx) {
                        return item.money == 0 || item.money == 8 || item.money == 6
                    });

                    res.send(200, {code: 200, result: ary, message: "获取所有特殊奖项信息成功"})
                } else {
                    lucky.rest();
                    res.send(200, {code: 200, result: [], message: "获取所有特殊奖项信息失败"})
                }

            })
        }

    }, res);


});

//检查当前用户是否刮奖
router.post('/check_current_user_draw', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req.headers.session_key, function (user_info) {
        if (user_info) {
            mysql.findToday('lucky_user_list', 'user_id="' + user_info[0].id + '"', function (result, err) {
                if (result && result.length > 0) {
                    res.send(200, {code: 200, result: result[0], message: "该用户已刮奖"})
                } else {
                    res.send(200, {code: 200, result: false, message: "该用户未刮奖"})
                }
            })
        } else {
            res.send(200, {code: 502, result: false, message: "用户不合法"})
        }


    });
})

//保存用户刮奖数据
router.post('/save_user_draw', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req.headers.session_key, function (userInfo) {
        if (userInfo.length > 0) {
            var money = lucky.draw(userInfo[0].area);
            var bar = {
                user_id: userInfo[0].id,
                user_name: userInfo[0].user_name,
                money: money,
                create_time: new Date(),
                area: userInfo[0].area,
                user_img: JSON.parse(userInfo[0].wx_info).avatarUrl
            }
            console.log(bar);
            mysql.insert_one('lucky_user_list', bar, function (result, err) {

                console.log(err);
                if (result) {
                    res.send(200, {code: 200, result: money, message: "保存成功"})
                } else {
                    res.send(200, {code: 500, result: '', message: '保存失败'})
                }
            });

        } else {
            res.send(200, {code: 502, result: false, message: "用户不合法"})
        }
    });

});


module.exports = router;