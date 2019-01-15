var express = require('express');
var request = require('request');
var router = express.Router();
var mysql = require('../lib/mysql');
var checkSession = require('../middlewares/check_session').checkSession;
var checkAppSession = require('../middlewares/check_session').checkAppSession;
var tool = require('../middlewares/tool');
var getUserInfo = tool.getUserInfo;
var xmManageInjection = require('../routes/public/lottery').xmManageInjection;
var usersInjection = require('../routes/public/lottery').usersInjection;
var schedule = require('node-schedule');
var postUsersNews = require('../routes/public/post_news').postUsersNews;



router.get('/', function (req, res) {

    res.status(200).send('彩票')

});

const getUsersTowords = (opt) => {
    let self = this;
    //获取所有人本周背单词情况
    try {
        mysql.sql('SELECT area,id,user_name,user_img,towords_phone FROM users  WHERE area="bj" AND towords_phone is not null', function (err, result) {
            if (err) {
                throw '查询用户失败users'
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

                    let towords_data = JSON.parse(body);
                    if (towords_data.code == 200) {
                        //获取
                        users = users.map(function (item, idx) {
                            if (towords_data.result[item.towords_phone]) {
                                item.word = towords_data.result[item.towords_phone];
                            } else {
                                item.word = 0
                            }

                            return item;
                        });
                        opt.success(users);
                    } else {

                        throw '从拓词获取数据失败'
                    }

                });
            }
        })
    } catch (e) {
        opt.error(e)

    }

}


//每周三，周五 10点开奖  获取一次数据，计算中奖用户存入表lucky_num

const work = {


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
                            let towords_data = JSON.parse(body);
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

                                }
                                word_sum = Math.round(Math.random() * 1000);
                                let lucky_num = word_sum.toString().substr(word_sum.toString().length - 2, 2);//中奖号码


                                //获取当前是第几期
                                mysql.sql('SELECT * FROM bet_issue  WHERE is_new=1', function (err, result) {
                                    if (err) {
                                        console.log('获取期数失败');
                                    } else {
                                        var current_term = result[0];
                                        var issue = result[0].issue;
                                        var term_id = result[0].id;
                                        var begin_poor = parseInt(result[0].begin_poor);
                                        var lucky_names = [];
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
                                                                                    self.startBet(1, issue, 0, lucky_num);

                                                                                    postUsersNews({
                                                                                        data: {
                                                                                            "keyword1": {
                                                                                                "value": "拓词猜猜看",
                                                                                                "color": "#173177"
                                                                                            },
                                                                                            "keyword2": {
                                                                                                "value": share_money,
                                                                                                "color": "#173177"
                                                                                            },
                                                                                            "keyword3": {
                                                                                                "value": lucky_names.join(','),
                                                                                                "color": "#173177"
                                                                                            }
                                                                                        },
                                                                                        template_id: 'AfGclvsdQslwt1CgTMUS5LeVFfwrgkmcIqkHBGHAeRA',
                                                                                        page: 'pages/lottery/lottery'
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
                                                            var xm_get_money = parseInt(last_all_money * 0.2);//小麦分成20%；
                                                            mysql.insert_one('xm_get_lottery', {
                                                                money: xm_get_money,
                                                                way: 1,
                                                                issue: issue,
                                                                create_time: new Date()
                                                            }, function (result, err) {
                                                                if (err) {
                                                                    console.log('插入小麦收入记录失败' + err);
                                                                } else {
                                                                    self.startBet(0, issue, last_all_money - xm_get_money, lucky_num);
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
    addFreeBet: function (user_id, issue, kind, dsc, chance) {
        const self = this;
        //给当前期用户添加免费机会
        let list_dsc = '';
        if (dsc) {
            list_dsc = dsc;
        }
        //1表示第一名，2表示第二名，3表示第三名，4表示狗屎运，5表示最后两位数
        let free_param = {
            user_id: user_id,
            issue: issue,
            dsc: list_dsc,
            kind: kind,
            create_time: new Date(),
            chance: chance
        };
        console.log(free_param);
        mysql.insert_one('bet_free', free_param, function (result, err) {
            if (err) {
                console.log(err);
                console.log('添加免费机会失败');
            } else {
                //更新用户用次数
                mysql.sql('update user_wallet set bet_free_chance =bet_free_chance + ' + chance + ' WHERE user_id ="' + user_id + '"', function (err, result) {
                    if (err) {
                        console.log(err);
                        console.log('更新用户免费机会失败');
                    } else {
                        console.log('添加免费机会成功');
                    }
                })

            }
        });
    },
    createSpecialLucky: function (issue, lucky_num) {
        const self = this;
        try {
            //创建之前先把当前用户次数update=0;
            getUsersTowords({
                success: function (users) {

                    mysql.sql('update user_wallet set bet_free_chance = 0', function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('更新用户免费机会失败');
                        } else {
                            let towords_users = users.filter((item, idx) => {
                                return parseInt(item.word) > 0;
                            });
                            towords_users = towords_users.sort((a, b) => {
                                return parseInt(b.word) - parseInt(a.word);
                            });


                            if (towords_users[0]) {
                                //拓词数第一名5次机会
                                self.addFreeBet(towords_users[0].id, issue, 1, '第一名', 1);

                            }
                            if (towords_users[1]) {
                                //拓词数第二名3次机会
                                self.addFreeBet(towords_users[1].id, issue, 2, '第二名', 1);
                            }
                       /*     if (towords_users[2]) {
                                //拓词数第三名1次机会
                                self.addFreeBet(towords_users[2].id, issue, 3, '第三名', 1);
                            }*/


                            //最后两位数相同用户
                            towords_users.forEach((item, idx) => {
                                if (parseInt(item.word) > 10) {
                                    let str = item.word.toString();
                                    let user_num = parseInt(str.substr(str.length - 2, 1));
                                    if (user_num == lucky_num) {
                                        console.log(item.id);//存入一条免费记录
                                        self.addFreeBet(item.id, issue, 5, '最后两位数和中奖号码相同', 1);
                                    }

                                }
                            });
//选出狗屎运（除了前三名）
                            try {
                                let new_ary=JSON.parse(JSON.stringify(towords_users));
                                if(new_ary.length>2){

                                    let idx = Math.round(Math.random() * ( new_ary.length) + 2);//产生狗屎运用户

                                    self.addFreeBet(new_ary[idx].id, issue, 4, '狗屎运', 1);//给狗屎运获得者添加一次免费押注机会
                                }
                            } catch (e) {
                                console.log(e);
                            }

                        }
                    })
                }, error: function (err) {
                    console.log('获取拓词列表失败' + err);
                }
            });
        } catch (e) {
            console.log(e);
        }

    },
    startBet: function (is_win, issue, begin_money, lucky_num) {
        const self = this;
        try {

            let term = {
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
                    self.createSpecialLucky(term.issue, lucky_num);

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
    postBetNews: function () {
        const self = this;
        postUsersNews({
            data: {
                "keyword1": {
                    "value": "小麦-拓词猜猜看",
                    "color": "#173177"
                },
                "keyword2": {
                    "value": "今晚0点",
                    "color": "#173177"
                },
                "keyword3": {
                    "value": "拓词猜猜看将于今晚0点停止预测，点击参与即有机会瓜分麦粒",
                    "color": "#173177"
                }
            },
            template_id: '-luQWpwuTIKETJlH3FujmICZ59LJIFp1Lf000H3S0EY',
            page: 'pages/lottery/lottery'
        });

    }

};
router.post('/test', function (req, res, next) {
    //获取所有用户统计手机号(仅北京地区)
    res.header("Access-Control-Allow-Origin", "*");
    mysql.sql('SELECT * FROM order_fooding  where YEARWEEK(create_time,1) = YEARWEEK(DATE_ADD(now(),INTERVAL -1 WEEK),1)', function (err, result) {
        if (err) {
            console.log(err);
        } else {
            result.forEach((item, idx) => {
                let list = JSON.parse(item.list);
                console.log(list);
                list.forEach((item2, idx2) => {
                    mysql.insert_one('order_food', {
                        id: item2.id,
                        name: item2.name,
                        price: item2.price,
                        kind: item2.kind,
                        img: decodeURIComponent(item2.img),
                        merchant: item2.merchant,
                        create_time: new Date()
                    }, (err, result) => {
                        console.log(err);
                    })
                })

            });

        }
    })

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
//周二，周四下午6：30（发送押注提醒）
var post_bet_message = new schedule.RecurrenceRule();
post_bet_message.dayOfWeek = [2, 4];
post_bet_message.hour = 18;
post_bet_message.minute = 30;

var post_bet_message_work = schedule.scheduleJob(post_bet_message, function () {
    work.postBetNews();

});


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
router.post('/post_news', function (req, res, next) {
    //获取所有用户统计手机号(仅北京地区)
    res.header("Access-Control-Allow-Origin", "*");
    work.postBetNews();
});


router.post('/get_user_words', checkAppSession, function (req, res, next) {
    //获取所有用户统计手机号(仅北京地区)
    res.header("Access-Control-Allow-Origin", "*");
    getUsersTowords({
        success: function (users) {
            res.status(200).send({code: 200, result: users, message: '获取用户单词数成功'});
        }, error: function (err) {
            res.status(200).send({code: 500, result: [], message: err});
        }
    });

});


router.post('/get_all_lucky_num', checkAppSession, function (req, res, next) {
    //获取历史中奖号码
    res.header("Access-Control-Allow-Origin", "*");
    mysql.sql('SELECT issue,lucky_num FROM  bet_issue WHERE is_new!=1', function (err, result) {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取历史中奖号码失败'});
        } else {
            res.status(200).send({code: 200, result: result, message: '获取历史中奖号码成功'});
        }
    })


});


router.post('/save_user_bet', checkAppSession, function (req, res, next) {
    //保存用户押注数据同时检查是否存在相同押注

    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req, res, function (userInfo) {
        if (userInfo) {
            //获取当前期
            mysql.sql('SELECT * FROM bet_issue  WHERE is_new=1', function (err, result) {
                if (err) {
                    console.log('获取期数失败');
                } else {
                    var issue = result[0].issue;
                    var term_id = result[0].id;
                    var term_status = result[0].status;
                    if (term_status == 1) {
                        //当期正在进行中
                        //获取用户本期的押注情况
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

                                        //获取该用户的免费机会
                                        mysql.sql('SELECT * FROM user_wallet  WHERE user_id="' + userInfo[0].id + '"', function (err, free_chance) {
                                            if (err) {
                                                res.status(200).send({code: 500, result: 0, message: '获取用户免费次数失败'});
                                            } else {
                                                //res.status(200).send({code: 200, result: result.length, message: '获取用户免费次数成功'});
                                                console.log(free_chance[0]);
                                                if (free_chance[0].bet_free_chance > 0) {
                                                    //有免费机会将账目记到小麦
                                                    let xm_param = {
                                                        user_id: userInfo[0].id,
                                                        create_time: new Date(),
                                                        money: 1,
                                                        issue: req.body.issue
                                                    };
                                                    let user_param = {
                                                        user_id: userInfo[0].id,
                                                        create_time: new Date(),
                                                        num: req.body.num,
                                                        pay_money: 0,
                                                        issue: req.body.issue
                                                    };
                                                    mysql.insert_one('user_bet', user_param, function (result, err) {
                                                        console.log(err);
                                                        if (result && err == null) {

                                                            mysql.insert_one('xm_for_user_bet', xm_param, function (result, err) {
                                                                if (result && err == null) {
                                                                    //减去用户机会
                                                                    mysql.sql('update user_wallet set bet_free_chance = bet_free_chance-1 where user_id="' + userInfo[0].id + '"', function (err, result) {
                                                                        if (err) {
                                                                            res.status(200).send({
                                                                                code: 500,
                                                                                result: false,
                                                                                message: '更新剩余机会失败！'
                                                                            });
                                                                        } else {
                                                                            res.status(200).send({
                                                                                code: 200,
                                                                                result: true,
                                                                                message: "保存成功"
                                                                            });

                                                                        }
                                                                    });

                                                                } else {
                                                                    res.status(200).send({
                                                                        code: 500,
                                                                        result: false,
                                                                        message: '计入小麦账单失败'
                                                                    });

                                                                }
                                                            });

                                                        } else {

                                                            res.status(200).send({
                                                                code: 500,
                                                                result: false,
                                                                message: '保存失败'
                                                            });

                                                        }
                                                    });

                                                } else {
                                                    //没有免费机会
                                                    let param = {
                                                        user_id: userInfo[0].id,
                                                        create_time: new Date(),
                                                        num: req.body.num,
                                                        pay_money: 1,
                                                        issue: req.body.issue
                                                    };

                                                    mysql.insert_one('user_bet', param, function (result, err) {
                                                        console.log(err);
                                                        if (result && err == null) {
                                                            res.status(200).send({
                                                                code: 200,
                                                                result: true,
                                                                message: "保存成功"
                                                            });

                                                        } else {
                                                            res.status(200).send({
                                                                code: 500,
                                                                result: false,
                                                                message: '保存失败'
                                                            });

                                                        }
                                                    });

                                                }


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
    getUserInfo(req, res, function (userInfo) {
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
    getUserInfo(req, res, function (userInfo) {
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
    getUserInfo(req, res, function (userInfo) {
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

//获取本期该用户的免费押注机会
router.post('/get_current_free_chance', checkAppSession, function (req, res, next) {

    res.header("Access-Control-Allow-Origin", "*");
    getUserInfo(req, res, function (userInfo) {
        if (userInfo) {
            mysql.sql('SELECT * FROM user_wallet  WHERE user_id="' + userInfo[0].id + '"', function (err, result) {
                if (err) {
                    res.status(200).send({code: 500, result: 0, message: '获取用户免费次数失败'});
                } else {
                    res.status(200).send({code: 200, result: result[0], message: '获取用户免费次数成功'});


                }
            });

        } else {
            res.status(200).send({code: 502, result: false, message: "用户不合法"})
        }
    });


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

    var issue = req.body.issue;

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

router.post('/xm_issue_info', checkSession, function (req, res, next) {
    //获取本期信息
    res.header("Access-Control-Allow-Origin", "*");

    mysql.sql('SELECT * FROM bet_issue where is_new=1', function (err, result) {
        if (err) {
            console.log(err)
            res.status(200).send({code: 500, result: {}, message: '获取小麦收益失败'});
        } else {

            res.status(200).send({code: 200, result: result[0], message: '获取小麦收益成功'});
        }
    })

});

router.post('/xm_san_code_money', checkSession, function (req, res, next) {
    //获取扫码注资信息
    res.header("Access-Control-Allow-Origin", "*");
    var issue = req.body.issue;
    mysql.sql('SELECT  user_img,user_name,money,tab1.create_time,issue FROM scan_injection tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE issue="' + (issue) + '"', function (err, result) {
        if (err) {
            console.log(err)
            res.status(200).send({code: 500, result: [], message: '获取小麦收益失败'});
        } else {

            res.status(200).send({code: 200, result: result, message: '获取小麦收益成功'});
        }
    })

});

router.post('/xm_injection_info', checkSession, function (req, res, next) {
    //小麦后台注资信息
    res.header("Access-Control-Allow-Origin", "*");

    mysql.sql('select * from xm_injection', function (err, result) {
        if (err) {
            console.log(err)
            res.status(200).send({code: 500, result: [], message: '获取小麦后台注资信息失败'});
        } else {

            res.status(200).send({code: 200, result: result, message: '获取小麦后台注资信息成功'});
        }
    })

});
router.post('/user_injection_info', checkSession, function (req, res, next) {
    //获取用户注资信息
    res.header("Access-Control-Allow-Origin", "*");
    var issue = req.body.issue;
    mysql.sql('SELECT  user_img,user_name,money,tab1.create_time,issue FROM injection tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE issue="' + (issue) + '"', function (err, result) {
        if (err) {
            console.log(err)
            res.status(200).send({code: 500, result: [], message: '获取小麦收益失败'});
        } else {

            res.status(200).send({code: 200, result: result, message: '获取小麦收益成功'});
        }
    })

});

try {
   /* const httpServer = http.createServer((request, response) => {
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
    });*/

   /* wsServer.on('connect', connection => {
        connection.on('message', message => {
            if (message.type === 'utf8') {
                /!* console.log('>> message content from client: ' + message.utf8Data)*!/

                switch (message.utf8Data) {
                    case 'user_words':

                        getUsersTowords({
                            success: function (users) {
                                //console.log(users);
                                //获取本期免费机会的所有用户
                                mysql.sql('SELECT  * FROM bet_issue  WHERE is_new=1', function (err, result) {
                                    if (err) {
                                        console.log(err);
                                        connection.sendUTF({result: [], code: 500, message: "查询本期信息失败"})

                                    } else {
                                        let issue = result[0].issue;
                                        mysql.sql('SELECT  * FROM bet_free  WHERE issue="' + issue + '"', function (err, result) {
                                            if (err) {
                                                console.log(err);
                                                connection.sendUTF({result: [], code: 500, message: "查询本期免费次数信息失败"})

                                            } else {
                                                let ary = result;
                                                let free_users = {};
                                                ary.sort((a, b) => {
                                                    return parseInt(a.user_id) - parseInt(b.user_id);
                                                });
                                                for (let i = 0; i < ary.length;) {
                                                    let count = 0;
                                                    let kind = [];
                                                    let chance = 0;
                                                    for (let j = i; j < ary.length; j++) {
                                                        if (ary[i].user_id == ary[j].user_id) {
                                                            count++;
                                                            kind.push(ary[j].dsc);
                                                            chance += parseInt(ary[j].chance);
                                                        }
                                                    }
                                                    free_users[ary[i].user_id] = {kind: kind, chance: chance};
                                                    i += count;
                                                }

                                                users = users.map((item, idx) => {
                                                    item.free_bet_info = {};
                                                    if (free_users[item.id] != undefined) {
                                                        item.free_bet_info = free_users[item.id]
                                                    }
                                                    return item;
                                                    //  console.log(item.id)
                                                });


                                                connection.sendUTF(JSON.stringify({result: users, code: 200}))

                                            }
                                        })

                                    }
                                })

                            }, error: function (err) {
                                connection.sendUTF({result: [], code: 500})
                            }
                        });
                        break;
                    case 'dinner_together':
                        console.log(123);
                        break;
                }

            }
        }).on('close', (reasonCode, description) => {
            console.log('[' + new Date() + '] Peer ' + connection.remoteAddress + ' disconnected.')
        })
    });*/


} catch (e) {
    console.log(e);
}


module.exports = {
    router,
    userWords:function(connection){
        getUsersTowords({
            success: function (users) {
                //console.log(users);
                //获取本期免费机会的所有用户
                mysql.sql('SELECT  * FROM bet_issue  WHERE is_new=1', function (err, result) {
                    if (err) {
                        console.log(err);
                        connection.sendUTF({result: [], code: 500, message: "查询本期信息失败"})

                    } else {
                        let issue = result[0].issue;
                        mysql.sql('SELECT  * FROM bet_free  WHERE issue="' + issue + '"', function (err, result) {
                            if (err) {
                                console.log(err);
                                connection.sendUTF({result: [], code: 500, message: "查询本期免费次数信息失败"})

                            } else {
                                let ary = result;
                                let free_users = {};
                                ary.sort((a, b) => {
                                    return parseInt(a.user_id) - parseInt(b.user_id);
                                });
                                for (let i = 0; i < ary.length;) {
                                    let count = 0;
                                    let kind = [];
                                    let chance = 0;
                                    for (let j = i; j < ary.length; j++) {
                                        if (ary[i].user_id == ary[j].user_id) {
                                            count++;
                                            kind.push(ary[j].dsc);
                                            chance += parseInt(ary[j].chance);
                                        }
                                    }
                                    free_users[ary[i].user_id] = {kind: kind, chance: chance};
                                    i += count;
                                }

                                users = users.map((item, idx) => {
                                    item.free_bet_info = {};
                                    if (free_users[item.id] != undefined) {
                                        item.free_bet_info = free_users[item.id]
                                    }
                                    return item;
                                    //  console.log(item.id)
                                });


                                connection.sendUTF(JSON.stringify({result: users, code: 200}))

                            }
                        })

                    }
                })

            }, error: function (err) {
                connection.sendUTF({result: [], code: 500})
            }
        })
    }
};