/**
 * Created by haoguo on 17/6/5.
 */
var mysql = require('../lib/mysql');
module.exports = {
    getUserInfo: function(session,callback,res){

    mysql.find_one('custom_session','session_key',[session], function (result) {
         console.log(result);
        if (result&&result.length>0) {
            var openId=result[0].open_id;
            //根据openid 获取用户信息
            mysql.find_one('users','open_id',[openId], function (result) {
                if(result){
                    callback(result);
                }else{
                   callback(false);
                }
            });

        }else{
            res.send(200, {code: 501, result: result,massage:'获取此用户的openid失败'})
        }

    });
},
getCurrentSession:function(session,callback,res){
        mysql.find_one('custom_session','session_key',[session], function (result) {

        if (result) {
           callback(result);

        }else{
            res.send(200, {code: 501, result: result,massage:'获取此用户的openid失败'})
        }

    });
}
 
};
Date.prototype.Format = function (fmt) { //
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};