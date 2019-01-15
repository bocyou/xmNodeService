const mysql = require('../lib/mysql');

module.exports={
    updateUserSpend:function(opt){
        mysql.sql('SELECT * FROM users_spend  WHERE user_id='+opt.user_id, function (err, result) {
            if (err) {
                opt.error(err,'获取用户记录失败');
            } else {
               if(result.length>0){
                   //存在记录更新
                   mysql.sql('update users_spend set spend_money=spend_money+'+opt.money+' WHERE user_id=' + opt.user_id, function (err, result) {
                       if (err) {
                           opt.error(err,'更新用户记录失败');
                       } else {
                           opt.success(result,'更新用户花费信息成功')
                       }
                   })

               }else{
                   //不存在创建
                   mysql.insert_one('users_spend', {
                       spend_money:opt.money,
                       up_time: new Date(),
                       user_id: opt.user_id
                   }, function (result, err) {
                       if (err) {
                           opt.error(err,'新建用户记录失败');
                       } else {
                           opt.success(result,'新建用户记录成功')
                       }
                   });

               }
            }
        })
    }
}