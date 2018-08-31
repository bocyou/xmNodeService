/**
 * Created by haoguo on 17/6/5.
 */
var mysql = require('../lib/mysql');
module.exports = {
    getUserInfo: function(req,res,callback){
        var session=req.headers.sessionkey;

        mysql.sql( 'SELECT * FROM custom_session tab1 JOIN users tab2 ON tab1.open_id = tab2.open_id WHERE session_key = "'+session+'"', function (err, result) {
            if(result&&result.length>0){
                callback(result);
            }else{
                console.log('11222');
                console.log(err);
                res.status(200).send( {code: 502, result: result,massage:'session失效'})
            }

        })

},
getCurrentSession:function(req,res,callback){
    var session=req.headers.sessionkey;
        mysql.find_one('custom_session','session_key',[session], function (result) {

        if (result) {
           callback(result);

        }else{
            res.status(200).send( {code: 502, result: result,massage:'session失效'})
        }

    });
},
    saveLogs:function(user_id,err_info){

        mysql.insert_one('xiaomai_logs', {
            user_id: user_id,
            err_info: JSON.stringify(err_info),
            create_time: new Date()
        }, function (result, err) {
            if (result&&err==null) {

                console.log('保存日志成功');

            } else {
                console.log('保存日志-失败：'+err);
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