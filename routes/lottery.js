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
var xmManageInjection = require('../routes/public/lottery').xmManageInjection;
var usersInjection = require('../routes/public/lottery').usersInjection;
var schedule = require('node-schedule');
var postUsersNews=require('../routes/public/post_news').postUsersNews;

router.get('/', function (req, res) {

    res.status(200).send('彩票')

});
var postNews={
    postNews:function(name,money){
        var self=this;
        request('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxff898caf09a11846&secret=6f8b1e6559774ab25c0e6ec3b5b1ee26', function(err, response, body) {
            if (err) {
                console.log('获取失败ass');
                // res.status(200).send( {code: 200, result: '获取openid失败'});
            } else {

               var access_token = JSON.parse(body).access_token;

                mysql.sql('SELECT open_id,user_name,user_id,formid,tab1.id FROM user_formid tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE status=1 AND area="bj"', function(err, result) {
                    console.log(err);
                    if (result && result.length > 0) {

                        var ary = result;
                        var res = [];
                        ary.sort(function(a, b) {
                            return a.user_id - b.user_id;
                        });

                        for (var i = 0; i < ary.length;) {
                            var count = 0;
                            var form_ary = [];
                            for (var j = i; j < ary.length; j++) {
                                if (ary[i].user_id == ary[j].user_id) {
                                    count++;
                                    form_ary.push(ary[j].formid)
                                }
                            }
                            res.push({
                                open_id: ary[i].open_id,
                                user_name: ary[i].user_name,
                                form_id: form_ary
                            });
                            i += count;
                        }

                        res.forEach(function(item, idx) {
                            request.post({
                                url: 'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=' + self.access_token,
                                form: JSON.stringify({
                                    "touser": item.open_id,
                                    "template_id": "AfGclvsdQslwt1CgTMUS5LeVFfwrgkmcIqkHBGHAeRA",
                                    "page": "pages/lottery/lottery",
                                    "form_id": item.form_id[0],
                                    "data": {
                                        "keyword1": {
                                            "value": "拓词猜猜看",
                                            "color": "#173177"
                                        },
                                        "keyword2": {
                                            "value": money,
                                            "color": "#173177"
                                        },
                                        "keyword3": {
                                            "value":name ,
                                            "color": "#173177"
                                        }
                                    },
                                    "emphasis_keyword": "keyword2.value"
                                })
                            }, function(error, response, body) {
                                if (!error && response.statusCode == 200) {


                                    if (JSON.parse(body).errcode == 0) {
                                        console.log(item.user_name + ' 发送成功');
                                        mysql.sql('update user_formid set status=0 where formid="' + item.form_id[0] + '"', function(err, result) {

                                            if (err) {
                                                console.log('重置formid失败');
                                                console.log(err)
                                            } else {


                                            }
                                        });
                                    } else {
                                        console.log(error);
                                    }

                                }
                            })
                        })


                    } else {
                        console.log('获取用户formid失败');
                    }

                })



            }
        });

    }
}

//每周三，周五 10点开奖  获取一次数据，计算中奖用户存入表lucky_num

var work = {

    closeBet: function () {
        var self = this;
        try {
            //获取绑定拓词账号的人员
            mysql.sql('SELECT area,id,user_name,user_img,towords_phone FROM users  WHERE area="bj" AND towords_phone is not null', function (err, result) {
                if (err) {

                    throw {err: err, message: '查询拓词数量失败'};
                } else {
                    var users = result;
                    var phone_ary = [];
                    users.forEach(function (item, idx) {
                        phone_ary.push(item.towords_phone);
                    });
                    /*查询本周背诵情况*/
                    request.post({
                        url: 'http://preapi.towords.com/fun/count_user_word_week_data.do', formData: {
                            mobile_phone_list: phone_ary
                        }
                    }, function optionalCallback(err, httpResponse, body) {
                        if (err) {
                            //res.status(200).send({code: 500, result: [],message:'与拓词服务器交互失败'});
                            throw {err: err, message: '与拓词服务器交互失败'};
                        } else {
                            var towords_data = JSON.parse(body);
                            if (towords_data.code == 200) {


                                //计算单词总数
                                var word_sum = 0;

                                for (var item in towords_data.result) {

                                    var words = towords_data.result[item];
                                    if (words.toString().search(/\D/ig) == -1) {
                                        word_sum += parseInt(towords_data.result[item]);
                                    }
                                }
                                if (word_sum < 100) {
                                    word_sum = Math.round(Math.random() * 1000);
                                }
                                var lucky_num = word_sum.toString().substr(word_sum.toString().length - 2, 2);
                                console.log(lucky_num);

                                //获取当前是第几期
                                mysql.sql('SELECT * FROM bet_issue  WHERE is_new=1', function (err, result) {
                                    if (err) {
                                        console.log('获取期数失败');
                                    } else {
                                        var current_term = result[0];
                                        var issue = result[0].issue;
                                        var term_id = result[0].id;
                                        var begin_poor = parseInt(result[0].begin_poor);
                                        var lucky_names=[];
                                        //查询本期押注情况
                                        mysql.sql('SELECT * FROM user_bet tab1 JOIN users tab2  ON tab1.user_id = tab2.id WHERE issue="' + issue + '"', function (err, result) {
                                            if (err) {
                                                //res.status(200).send({code: 500, result: [],message:'查询失败'});
                                                console.log('查询本期押注情况失败' + err);
                                            } else {
                                                var val = [];
                                                var users = [];
                                                var i = 0;//中奖人员数量
                                                var current_money = 0;//当期押注总金额
                                                result.forEach(function (item, idx) {
                                                    current_money += parseFloat(item.pay_money);
                                                    if (item.num == lucky_num) {
                                                        lucky_names.push(item.user_name);
                                                        //中奖人员
                                                        val[i] = [];
                                                        val[i][0] = lucky_num;
                                                        val[i][1] = new Date();
                                                        val[i][2] = issue;
                                                        val[i][3] = item.user_id;
                                                        users.push(item.user_id);
                                                        i++;

                                                    }
                                                    //发送中奖消息
                                                });

                                                var last_all_money = current_money + begin_poor;//上一期总金额

                                                if (val.length > 0) {
                                                    //有中奖人员
                                                    //存入本期中奖人员20%抽入到小卖部

                                                    var share_money = parseInt(last_all_money * 0.8 / i);//平均每个人所得钱数
                                                    var shop_get_money = last_all_money - share_money * i;
                                                    for (var j = 0; j < val.length; j++) {
                                                        val[j].push(share_money);
                                                    }
                                                    mysql.sql('update bet_issue set is_new="0", status="0",lucky_num="' + word_sum + '",close_time="' + new Date().Format('yy-MM-dd HH:mm:ss') + '",is_win="1",current_poor="' + current_money + '"  where id="' + term_id + '"', function (err, result) {
                                                        if (err) {
                                                            console.log(err);
                                                            console.log('更新本期状态失败' + err);
                                                        } else {
                                                            //插入一条小麦收入记录,1代表拓词猜猜看
                                                            mysql.insert_one('xm_get_lottery', {
                                                                money: shop_get_money,
                                                                way: 1,
                                                                issue: issue,
                                                                create_time: new Date()
                                                            }, function (result, err) {
                                                                if (err) {
                                                                    console.log('插入小麦收入记录失败' + err);

                                                                } else {
                                                                    //存入中奖人员
                                                                    mysql.insert_more('lucky_num(`lucky_num`, `create_time`,`issue`,`user_id`,`get_money`)', [val], function (result, err) {
                                                                        if (result) {


                                                                            mysql.sql('update user_wallet set money = money + ' + share_money + ' where user_id in (' + users.join(',') + ')', function (err, result) {
                                                                                if (err) {
                                                                                    console.log('计入用户钱包失败' + err);
                                                                                } else {
                                                                                    console.log('已计入用户钱包');
                                                                                    self.startBet(1, issue, 0);

                                                                                        postUsersNews({
                                                                                            data:{
                                                                                                "keyword1": {
                                                                                                    "value": "拓词猜猜看",
                                                                                                    "color": "#173177"
                                                                                                },
                                                                                                "keyword2": {
                                                                                                    "value": share_money,
                                                                                                    "color": "#173177"
                                                                                                },
                                                                                                "keyword3": {
                                                                                                    "value":lucky_names.join(',') ,
                                                                                                    "color": "#173177"
                                                                                                }
                                                                                            },
                                                                                            template_id:'AfGclvsdQslwt1CgTMUS5LeVFfwrgkmcIqkHBGHAeRA',
                                                                                            page:'pages/lottery/lottery'
                                                                                        });



                                                                                }
                                                                            })

                                                                        } else {
                                                                            console.log('开奖失败，存入数据库时失败' + err);
                                                                            // res.status(200).send( {code: 200, result: 0,message:'生成失败'})
                                                                        }

                                                                    });

                                                                }
                                                            });


                                                        }
                                                    });

                                                } else {
                                                    //无中奖人员
                                                    console.log(word_sum);
                                                    //更新当前期记录
                                                    mysql.sql('update bet_issue set is_new="0", status="0",lucky_num="' + word_sum + '",close_time="' + new Date().Format('yy-MM-dd HH:mm:ss') + '",is_win="0",current_poor="' + current_money + '" where id="' + term_id + '"', function (err, result) {
                                                        if (err) {
                                                            console.log('更新本期状态失败' + err);
                                                        } else {
                                                            //插入一条小麦收入记录,1代表拓词猜猜看
                                                            var xm_get_money = parseFloat(last_all_money * 0.1);//小麦分成10%；
                                                            mysql.insert_one('xm_get_lottery', {
                                                                money: xm_get_money,
                                                                way: 1,
                                                                issue: issue,
                                                                create_time: new Date()
                                                            }, function (result, err) {
                                                                if (err) {
                                                                    console.log('插入小麦收入记录失败' + err);
                                                                } else {
                                                                    self.startBet(0, issue, last_all_money - xm_get_money);
                                                                    console.log('本期无中奖人员');

                                                                }
                                                            });


                                                        }
                                                    });

                                                }


                                            }
                                        })
                                    }
                                });


                            } else {
                                //res.status(200).send({code: 500, result: [],message:'拓词服务器返回值不为200'});
                                console.log('拓词服务器返回值不为200');
                            }
                        }
                    });
                }
            })
        } catch (err) {
            console.log(err);

        }


    },
    startBet: function (is_win, issue, begin_money) {
        var self = this;
        try {

            var term = {
                status: 1,
                create_time: new Date(),
                issue: parseInt(issue) + 1,
                lucky_num: '',
                current_poor: '',
                is_win: '',
                begin_poor: 0,
                is_new: 1
            };


            if (is_win == 0) {
                //没有人中奖
                term.begin_poor = begin_money;
            }


            mysql.insert_one('bet_issue', term, function (result, err) {
                if (err) {
                    console.log('开始下一期失败' + err);

                } else {
                    console.log('成功开启下一期');


                }
            });


        } catch (err) {
            console.log(err);
        }


    },
    disableBet: function () {
        try {
            //获取当前是第几期
            mysql.sql('SELECT * FROM bet_issue  WHERE is_new=1', function (err, result) {
                if (err) {
                    console.log('获取期数失败');
                } else {
                    var issue = result[0].issue;
                    var term_id = result[0].id;
                    mysql.sql('update bet_issue set status="2" where id="' + term_id + '"', function (err, result) {
                        if (err) {
                            console.log('更新本期状态失败' + err);
                        } else {
                            console.log('第' + issue + '期已禁止押注' + new Date());


                        }
                    });
                }
            });
        } catch (err) {
            console.log(err);

        }
    },
    renderWallet: function () {
        var self = this;
        //为所有用户创建钱包
        mysql.sql('SELECT * FROM  users ', function (err, result) {
            if (err) {
                //res.status(200).send({code: 500, result: [], message: '查询失败'});
            } else {
                var val = [];
                result.forEach(function (item, idx) {
                    val[idx] = [];
                    val[idx][0] = 0;
                    val[idx][1] = item.id;

                });

                mysql.insert_more('user_wallet(`money`, `user_id`)', [val], function (result, err) {
                    if (result) {
                        // res.status(200).send( {code: 200, result: 1,message:""})
                        console.log('创建钱包成功' + new Date().Format('yyyy/MM/dd HH:mm:ss'));

                    } else {
                        console.log('创建钱包失败' + err);
                        // res.status(200).send( {code: 200, result: 0,message:'生成失败'})
                    }

                });
            }
        })

    },
    postBetNews:function(){
        var self=this;
        postUsersNews({
            data:{
                "keyword1": {
                    "value": "小麦-拓词猜猜看",
                    "color": "#173177"
                },
                "keyword2": {
                    "value": "今晚0点",
                    "color": "#173177"
                },
                "keyword3": {
                    "value":"拓词猜猜看将于今晚0点停止预测，点击参与即有机会瓜分麦粒",
                    "color": "#173177"
                }
            },
            template_id:'-luQWpwuTIKETJlH3FujmICZ59LJIFp1Lf000H3S0EY',
            page:'pages/lottery/lottery'
        });

    }

};
router.post('/test', function (req, res, next) {
    //获取所有用户统计手机号(仅北京地区)
    res.header("Access-Control-Allow-Origin", "*");
    work.closeBet();
});
//周三，周五00:00，结束押注(结束当前期)
var disable_bet = new schedule.RecurrenceRule();
disable_bet.dayOfWeek = [3, 5];
disable_bet.hour = 00;
disable_bet.minute = 00;


var disable_bet_work = schedule.scheduleJob(disable_bet, function () {
    work.disableBet();

});


//周三，周五10:00 (结束当前期并开始下一期)

var begin_bet = new schedule.RecurrenceRule();
begin_bet.dayOfWeek = [3, 5];
begin_bet.hour = 10;
begin_bet.minute = 00;

var begin_bet_work = schedule.scheduleJob(begin_bet, function () {
    work.closeBet();

});
//周二，周四下午6：00（发送押注提醒）
var post_bet_message = new schedule.RecurrenceRule();
post_bet_message.dayOfWeek = [2, 4];
post_bet_message.hour = 18;
post_bet_message.minute = 00;

schedule.scheduleJob(post_bet_message, function () {
    work.postBetNews();

});

/*var close_bet = new schedule.RecurrenceRule();
close_bet.dayOfWeek = [4, 6];
close_bet.hour = 00;
close_bet.minute = 00;
var close_bet_work = schedule.scheduleJob(close_bet, function () {

    work.startBet();

});*/

router.post('/close', function (req, res, next) {
    //获取所有用户统计手机号(仅北京地区)
    res.header("Access-Control-Allow-Origin", "*");
    work.closeBet();
});
router.post('/disable', function (req, res, next) {
    //获取所有用户统计手机号(仅北京地区)
    res.header("Access-Control-Allow-Origin", "*");
    work.disableBet();
});

router.post('/get_user_words', checkAppSession, function (req, res, next) {
    //获取所有用户统计手机号(仅北京地区)
    res.header("Access-Control-Allow-Origin", "*");
    mysql.sql('SELECT area,id,user_name,user_img,towords_phone FROM users  WHERE area="bj" AND towords_phone is not null', function (err, result) {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '查询失败'});
        } else {
            var users = result;
            var phone_ary = [];
            users.forEach(function (item, idx) {
                phone_ary.push(item.towords_phone);
            })
            request.post({
                url: 'http://preapi.towords.com/fun/count_user_word_week_data.do', formData: {
                    mobile_phone_list: phone_ary
                }
            }, function optionalCallback(err, httpResponse, body) {
                if (err) {
                    res.status(200).send({code: 500, result: [], message: '获取用户单词数失败'});
                } else {
                    var towords_data = JSON.parse(body);
                    if (towords_data.code == 200) {


                        users = users.map(function (item, idx) {
                            if (towords_data.result[item.towords_phone]) {
                                item.word = towords_data.result[item.towords_phone];
                            } else {
                                item.word = 0
                            }

                            return item;
                        });
                        res.status(200).send({code: 200, result: users, message: '获取用户单词数成功'});

                    } else {
                        res.status(200).send({code: 500, result: [], message: '获取数据失败'});
                    }
                }
            });
        }
    })
});


router.post('/save_user_bet', checkAppSession, function (req, res, next) {
    //保存用户押注数据同时检查是否存在相同押注

    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req,res,function (userInfo) {
        if (userInfo) {
            //获取当前期的状态
            if (userInfo[0].id == 48) {
                console.log('延姐押注');


                mysql.sql('SELECT * FROM bet_issue  WHERE is_new=1', function (err, result) {
                    if (err) {
                        console.log('获取期数失败');
                    } else {
                        var issue = result[0].issue;
                        var term_id = result[0].id;
                        var term_status = result[0].status;
                        if (term_status == 1) {
                            mysql.sql('SELECT * FROM  user_bet WHERE user_id="' + userInfo[0].id + '" AND issue="' + req.body.issue + '"', function (err, result) {
                                if (err) {
                                    res.status(200).send({code: 500, result: [], message: '查询数据库时失败'});
                                } else {
                                    var user_num = req.body.num;

                                    function isRepeat(ary) {
                                        for (var i = 0; i < ary.length; i++) {
                                            if (ary[i].num == user_num) {
                                                //说明存在重复号码
                                                return true
                                            }
                                        }
                                        return false
                                    }

                                    if (result.length >= 0 && result.length < 10) {
                                        //保存

                                        if (isRepeat(result)) {
                                            //重复
                                            res.status(200).send({code: 500, result: [], message: '您已押注过此数字！'});
                                        } else {
                                            var param = {
                                                user_id: userInfo[0].id,
                                                create_time: new Date(),
                                                num: req.body.num,
                                                pay_money: 1,
                                                issue: req.body.issue
                                            };
                                            if (result.length <= 1) {
                                                param.pay_money = 0;
                                            }


                                            mysql.insert_one('user_bet', param, function (result, err) {
                                                console.log(err);
                                                if (result && err == null) {
                                                    res.status(200).send({code: 200, result: true, message: "保存成功"});

                                                } else {
                                                    res.status(200).send({code: 500, result: false, message: '保存失败'});

                                                }
                                            });
                                        }


                                    } else if (result.length >= 10) {
                                        res.status(200).send({code: 500, result: [], message: '每期押注不能超过10个'});
                                    } else {
                                        res.status(200).send({code: 500, result: [], message: '您已押注过此数字！'});
                                    }
                                }
                            });
                        } else if (term_status == 2) {
                            res.status(200).send({code: 500, result: [], message: '本期已停止押注'});
                        } else {
                            res.status(200).send({code: 500, result: [], message: '本期已结束'});
                        }

                    }
                });


            } else {
                mysql.sql('SELECT * FROM bet_issue  WHERE is_new=1', function (err, result) {
                    if (err) {
                        console.log('获取期数失败');
                    } else {
                        var issue = result[0].issue;
                        var term_id = result[0].id;
                        var term_status = result[0].status;
                        if (term_status == 1) {
                            mysql.sql('SELECT * FROM  user_bet WHERE user_id="' + userInfo[0].id + '" AND issue="' + req.body.issue + '"', function (err, result) {
                                if (err) {
                                    res.status(200).send({code: 500, result: [], message: '查询数据库时失败'});
                                } else {
                                    var user_num = req.body.num;

                                    function isRepeat(ary) {
                                        for (var i = 0; i < ary.length; i++) {
                                            if (ary[i].num == user_num) {
                                                //说明存在重复号码
                                                return true
                                            }
                                        }
                                        return false
                                    }

                                    if (result.length >= 0 && result.length < 10) {
                                        //保存

                                        if (isRepeat(result)) {
                                            //重复
                                            res.status(200).send({code: 500, result: [], message: '您已押注过此数字！'});
                                        } else {
                                            var param = {
                                                user_id: userInfo[0].id,
                                                create_time: new Date(),
                                                num: req.body.num,
                                                pay_money: 1,
                                                issue: req.body.issue
                                            };

                                            mysql.insert_one('user_bet', param, function (result, err) {
                                                console.log(err);
                                                if (result && err == null) {
                                                    res.status(200).send({code: 200, result: true, message: "保存成功"});

                                                } else {
                                                    res.status(200).send({code: 500, result: false, message: '保存失败'});

                                                }
                                            });
                                        }


                                    } else if (result.length >= 10) {
                                        res.status(200).send({code: 500, result: [], message: '每期押注不能超过10个'});
                                    } else {
                                        res.status(200).send({code: 500, result: [], message: '您已押注过此数字！'});
                                    }
                                }
                            });
                        } else if (term_status == 2) {
                            res.status(200).send({code: 500, result: [], message: '本期已停止押注'});
                        } else {
                            res.status(200).send({code: 500, result: [], message: '本期已结束'});
                        }

                    }
                });
            }


        } else {
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }
    });

});


router.post('/get_lucky_users', checkAppSession, function (req, res, next) {
    //获取本期中奖人员
    res.header("Access-Control-Allow-Origin", "*");

    mysql.sql('SELECT lucky_num, user_img,user_name,get_money FROM lucky_num tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE issue="' + req.body.issue + '"', function (err, result) {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取本期中奖用户失败'});
        } else {
            res.status(200).send({code: 200, result: result, message: '获取本期中奖用户成功'});
        }
    })


});

router.post('/get_user_bet', checkAppSession, function (req, res, next) {
    //获取本人押注号码
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req,res, function (userInfo) {
        if (userInfo) {
            mysql.sql('SELECT * FROM  user_bet WHERE user_id="' + userInfo[0].id + '" AND issue="' + req.body.issue + '"', function (err, result) {
                if (err) {
                    res.status(200).send({code: 500, result: [], message: '查询失败'});
                } else {
                    res.status(200).send({code: 200, result: result, message: '获取用户押注号码成功'});
                }
            })

        } else {
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }
    });

});

router.post('/get_users_bet', checkAppSession, function (req, res, next) {
    //获取所有人押注号码
    res.header("Access-Control-Allow-Origin", "*");

    mysql.sql('SELECT * FROM  user_bet WHERE  issue="' + req.body.issue + '"', function (err, result) {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取本期所有押注记录失败'});
        } else {
            res.status(200).send({code: 200, result: result, message: '获取本期所有押注记录成功'});
        }
    })


});

router.post('/get_bet_issue', checkAppSession, function (req, res, next) {
    //获取期数
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req,res,function (userInfo) {
        if (userInfo) {
            mysql.sql('SELECT * FROM bet_issue bi,(SELECT max(create_time) as max_time FROM bet_issue) max_bi WHERE bi.create_time = max_bi.max_time', function (err, result) {
                if (err) {
                    res.status(200).send({code: 500, result: [], message: '获取本期彩票数据失败'});
                } else {
                    res.status(200).send({code: 200, result: result[0], message: '获取本期彩票数据成功'});
                }
            })

        } else {
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }
    });

});

router.post('/get_custom_bet_issue', checkAppSession, function (req, res, next) {
    //获取期数
    res.header("Access-Control-Allow-Origin", "*");

    mysql.sql('SELECT * FROM bet_issue  WHERE issue="' + req.body.issue + '"', function (err, result) {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取本期彩票数据失败'});
        } else {
            res.status(200).send({code: 200, result: result[0], message: '获取本期彩票数据成功'});
        }
    })


});
router.post('/user_injection_money', checkAppSession, function (req, res, next) {
    //
    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req,res, function (userInfo) {
        if (userInfo) {

            usersInjection({
                way: 3,
                user_id: userInfo[0].id,
                money: req.body.inject_money,
                success: function (data) {
                    res.status(200).send({code: 200, result: true, message: "注资成功"});
                }, error: function (data) {
                    res.status(200).send({code: 500, result: false, message: '注资失败' + data});
                }
            });

        } else {
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }
    });


});

//实时获取当前期奖金池及本期信息
router.post('/get_current_term_info', checkAppSession, function (req, res, next) {
    //获取期数
    res.header("Access-Control-Allow-Origin", "*");

    mysql.sql('SELECT * FROM bet_issue  WHERE is_new=1', function (err, result) {
        if (err) {
            res.status(200).send({code: 500, result: {}, message: '获取本期信息失败'});
        } else {
            var term_num = result[0].issue;
            //通过期数找到当前押注情况
            mysql.sql('SELECT * FROM user_bet  WHERE issue="' + term_num + '"', function (err, result1) {
                if (err) {
                    es.status(200).send({code: 500, result: {}, message: '获取本期信息失败'});
                } else {

                    var term_num = result[0].issue;
                    //通过期数找到当前押注情况
                    var poor_money = result[0].begin_poor;

                    result1.forEach(function (item, idx) {
                        poor_money += parseFloat(item.pay_money);
                    });


                    res.status(200).send({
                        code: 200,
                        result: {poor_money: poor_money, term_info: result[0]},
                        message: '获取本期详细信息成功'
                    });
                }
            })


        }
    })


});
//管理部分

router.post('/injection_money', checkSession, function (req, res, next) {
    //后台注入资金
    res.header("Access-Control-Allow-Origin", "*");
    xmManageInjection({
        way: 1,
        money: req.body.money,
        success: function (data) {
            res.status(200).send({code: 200, result: true, message: "注资成功"});
        }, error: function (data) {
            res.status(200).send({code: 500, result: false, message: '注资失败' + data});
        }
    });
    /*    mysql.sql('SELECT * FROM bet_issue  WHERE is_new=1', function (err, result) {
            if (err) {
                res.status(200).send({code: 500, result: {}, message: '获取本期信息失败'});
            } else {
                var  term_num=result[0].issue;
                //更新本期的begin_poor
                mysql.sql('update bet_issue set begin_poor = begin_poor + ' + req.body.money + ' where id in (' +result[0].id + ')', function (err, result) {
                    if (err) {
                        console.log('计入本期赛事失败' + err);
                        res.status(200).send({code: 500, result: false, message: '计入本期赛事失败'});
                    } else {
                        console.log('计入本期赛事成功');
                        //添加注资记录
                        //1为小麦官方
                        mysql.insert_one('injection', {issue:term_num,way:1,money:req.body.money,create_time:new Date()}, function (result, err) {
                            console.log(err);
                            if (result && err == null) {
                                res.status(200).send({code: 200, result: true, message: "注资成功"});

                            } else {
                                res.status(200).send({code: 500, result: false, message: '注资失败'});

                            }
                        });

                    }
                })



            }
        })*/
});


router.post('/injection_info', checkSession, function (req, res, next) {
    //获取本期注资金额
    res.header("Access-Control-Allow-Origin", "*");
    mysql.sql('SELECT * FROM bet_issue  WHERE is_new=1', function (err, result) {
        if (err) {
            console.log('获取期数失败');
        } else {
            var issue = result[0].issue;
            var term_id = result[0].id;
            mysql.sql('SELECT way, user_img,user_name,money,tab1.create_time,issue FROM injection tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE issue="' + issue + '"', function (err, result) {
                if (err) {
                    console.log(err)
                    res.status(200).send({code: 500, result: [], message: '获取本期注资失败'});
                } else {

                    res.status(200).send({code: 200, result: result, message: '获取本期注资信息成功'});
                }
            })
        }
    });

});


router.post('/current_user_bet', checkSession, function (req, res, next) {
    //获取本期押注信息
    res.header("Access-Control-Allow-Origin", "*");
    mysql.sql('SELECT * FROM bet_issue  WHERE is_new=1', function (err, result) {
        if (err) {
            console.log('获取期数失败');
        } else {
            var issue = result[0].issue;
            var term_id = result[0].id;
            mysql.sql('SELECT  user_img,user_name,num,tab1.create_time,issue,tab1.user_id FROM user_bet tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE issue="' + (issue) + '"', function (err, result) {
                if (err) {

                    res.status(200).send({code: 500, result: [], message: '获取本期押注信息失败'});
                } else {

                    var ary = result;
                    var result_ary = [];
                    ary.sort(function (a, b) {
                        return a.user_id - b.user_id;
                    });
                    for (var i = 0; i < ary.length;) {
                        var count = 0;
                        var bet_ary = [];
                        for (var j = i; j < ary.length; j++) {

                            if (ary[i].user_id == ary[j].user_id) {
                                bet_ary.push(ary[j].num);
                                count++;
                            }
                        }
                        result_ary.push({
                            issue: ary[i].issue,
                            user_name: ary[i].user_name,
                            user_img: ary[i].user_img,
                            bet: bet_ary
                        });
                        i += count;
                    }


                    res.status(200).send({code: 200, result: result_ary, message: '获取本期押注信息成功'});
                }
            })
        }
    });

});


router.post('/xm_get_lottery_money', checkSession, function (req, res, next) {
    //获取小麦收益
    res.header("Access-Control-Allow-Origin", "*");
    mysql.sql('SELECT * FROM xm_get_lottery', function (err, result) {
        if (err) {
            console.log(err)
            res.status(200).send({code: 500, result: [], message: '获取小麦收益失败'});
        } else {

            res.status(200).send({code: 200, result: result, message: '获取小麦收益成功'});
        }
    })

});

module.exports = router;