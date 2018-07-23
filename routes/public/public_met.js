var mysql = require('../../lib/mysql');

//用户消费，所有用户的消费，都会更新添加到users_spend，
//还账时都会减users_spend,同时生成一条还款记录存入user_bill

//在所有消费接口添加addspend


module.exports = {
    addSpend: function(opt){
        //用户消费计入账单
        try{
            mysql.sql('SELECT * FROM users_spend  WHERE user_id="'+opt.user_id+'"', function (err, result) {
                if (err) {
                    throw "获取用户花费数据失败";
                    //res.status(200).send({code: 500, result: {}, message: '获取本期信息失败'});
                } else {
                    if(result.length>0){
                        //说明该用户有数据（更新）
                        mysql.sql('update users_spend set up_time="'+new Date()+'", spend_money = spend_money + ' +opt.spend_money + ' where user_id in (' + opt.user_id + ')', function (err, result) {
                            if (err) {
                              throw ('计入用户钱包失败' + err);
                            } else {
                                opt.success(result)

                            }
                        })

                    }else{
                        //说明该用户没有数据（创建）
                        mysql.insert_one('users_spend', {spend_money:opt.spend_money,user_id:opt.user_id,up_time:new Date()}, function (result, err) {
                            if (result && err == null) {

                                //  res.status(200).send({code: 200, result: true, message: "注资成功"});
                                opt.success(result)
                            } else {
                                throw "创建用户消费信息失败";
                                // res.status(200).send({code: 500, result: false, message: '注资失败'});

                            }


                        });
                    }
                }
            })
        }catch (e) {
            opt.error(e);

        }

    },
    downSpend:function (opt) {
        //用户还款
        try{
            mysql.sql('update users_spend set up_time="'+new Date()+'", spend_money = spend_money - ' +opt.repay_money + ' where user_id in (' + opt.user_id + ')', function (err, result) {
                if (err) {
                    throw ('还款失败' + err);
                } else {
                    //存入一条还款记录
                    mysql.insert_one('repay_list', {repay_money:opt.repay_money,user_id:opt.user_id,create_time:new Date()}, function (result, err) {
                        if (result && err == null) {

                            //  res.status(200).send({code: 200, result: true, message: "注资成功"});
                            opt.success(result)
                        } else {
                            throw "创建用户消费信息失败";
                            // res.status(200).send({code: 500, result: false, message: '注资失败'});

                        }


                    });


                }
            })
        }catch (e) {
            opt.error(e);

        }

    }

};