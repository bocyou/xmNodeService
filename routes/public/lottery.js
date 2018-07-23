var mysql = require('../../lib/mysql');


//1为小麦官方,2为扫码付款，3为个人

module.exports = {
    injection: function(opt){
        //为当期拓词猜猜看注资
        try{
            mysql.sql('SELECT * FROM bet_issue  WHERE is_new=1', function (err, result) {
                if (err) {
                    throw "获取本期信息失败";
                    //res.status(200).send({code: 500, result: {}, message: '获取本期信息失败'});
                } else {
                    var  term_num=result[0].issue;
                    //更新本期的begin_poor
                    mysql.sql('update bet_issue set begin_poor = begin_poor + ' +opt.money+ ' where id in (' +result[0].id + ')', function (err, result) {
                        if (err) {
                            console.log('计入本期赛事失败' + err);
                            throw "计入本期赛事失败";
                            //res.status(200).send({code: 500, result: false, message: '计入本期赛事失败'});
                        } else {
                            console.log('计入本期赛事成功');
                            //添加注资记录
                            //1为小麦官方,2为扫码付款，3为个人
                            mysql.insert_one('injection', {issue:term_num,way:opt.way,money:opt.money,create_time:new Date()}, function (result, err) {
                                if (result && err == null) {

                                    //  res.status(200).send({code: 200, result: true, message: "注资成功"});
                                    opt.success(result)
                                } else {
                                    throw "注资失败";
                                    // res.status(200).send({code: 500, result: false, message: '注资失败'});

                                }


                            });

                        }
                    })

                }
            })
        }catch (e) {
            opt.error(e);

        }

    },
    userInjectionMethod:function(opt){
        try{
            mysql.sql('SELECT * FROM bet_issue  WHERE is_new=1', function (err, result) {
                if (err) {
                    throw "获取本期信息失败";
                    //res.status(200).send({code: 500, result: {}, message: '获取本期信息失败'});
                } else {
                    var  term_num=result[0].issue;
                    console.log(result);

                    //更新本期的begin_poor
                    mysql.sql('update bet_issue set begin_poor = begin_poor + ' +opt.money+ ' where id in (' +result[0].id + ')', function (err, result) {
                        if (err) {
                            console.log(err);
                            console.log('计入本期赛事失败' + err);
                            throw "计入本期赛事失败";
                            //res.status(200).send({code: 500, result: false, message: '计入本期赛事失败'});
                        } else {
                            console.log('计入本期赛事成功');
                            //添加注资记录

                            mysql.insert_one('injection', {issue:term_num,way:opt.way,money:opt.money,user_id:opt.user_id,create_time:new Date()}, function (result, err) {
                                if (result && err == null) {

                                    //  res.status(200).send({code: 200, result: true, message: "注资成功"});
                                    opt.success(result)
                                } else {
                                    throw "注资失败";
                                    // res.status(200).send({code: 500, result: false, message: '注资失败'});

                                }


                            });

                        }
                    })

                }
            })
        }catch (e) {
            opt.error(e);

        }
    },
    shopInjection:function(opt){
        try{
            mysql.sql('SELECT * FROM bet_issue  WHERE is_new=1', function (err, result) {
                if (err) {
                    throw "获取本期信息失败";
                    //res.status(200).send({code: 500, result: {}, message: '获取本期信息失败'});
                } else {
                    var  term_num=result[0].issue;
                    var term_id=result[0].id;
                    //统计本期扫码注入金额超过30则不再注入
                    mysql.sql('SELECT * FROM injection  WHERE way=2 AND issue="'+term_num+'"', function (err, result1) {
                        if (err) {
                            throw "获取本期注入金额失败";
                            //res.status(200).send({code: 500, result: {}, message: '获取本期信息失败'});
                        } else {
                            var injection_money=0;
                            result1.forEach(function(item,idx){
                                injection_money+=parseFloat(item.money)
                            });
                            if(injection_money>=30){
                                opt.error('注入资金已超过30');
                            }else{
                                //更新本期的begin_poor
                                mysql.sql('update bet_issue set begin_poor = begin_poor + ' +opt.money+ ' where id in (' + term_id+ ')', function (err, result) {
                                    if (err) {
                                        console.log('计入本期赛事失败' + err);
                                        throw "计入本期赛事失败";
                                        //res.status(200).send({code: 500, result: false, message: '计入本期赛事失败'});
                                    } else {
                                        console.log('计入本期赛事成功');
                                        //添加注资记录

                                        mysql.insert_one('injection', {user_id:opt.user_id,issue:term_num,way:opt.way,money:opt.money,create_time:new Date()}, function (result, err) {
                                            if (result && err == null) {
                                                console.log('已注资');
                                                //  res.status(200).send({code: 200, result: true, message: "注资成功"});
                                                opt.success(result)
                                            } else {
                                                throw "注资失败";
                                                // res.status(200).send({code: 500, result: false, message: '注资失败'});

                                            }


                                        });

                                    }
                                })
                            }


                        }
                    })



                }
            })
        }catch (e) {
            opt.error(e);

        }
    }

};