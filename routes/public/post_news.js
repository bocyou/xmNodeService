var mysql = require('../../lib/mysql');
//小程序发送消息模块
var postNews={
    getToken:function(callback){
        var self=this;
        request('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxff898caf09a11846&secret=6f8b1e6559774ab25c0e6ec3b5b1ee26', function(err, response, body) {
            if (err) {
                console.log('获取失败ass');
                // res.status(200).send( {code: 200, result: '获取openid失败'});
            } else {

                var access_token = JSON.parse(body).access_token;
                callback(access_token);
            }
        });

    },
    getUsers:function(callback){
        mysql.sql('SELECT open_id,user_name,user_id,formid,tab1.id FROM user_formid tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE status=1 AND area="bj"', function(err, result) {

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

                callback(res);


            } else {
                console.log('获取用户formid失败');
            }

        })
    }
}
module.exports = {
    postUsersNews:function(opt){
       //给所有人发送消息
        try{
            postNews.getToken(function(token){
                postNews.getUsers(function(users){
                    users.forEach(function(item, idx) {
                        request.post({
                            url: 'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=' + token,
                            form: JSON.stringify({
                                "touser": item.open_id,
                                "template_id": opt.template_id,
                                "page": opt.page,
                                "form_id": item.form_id[0],
                                "data": opt.data,
                                "emphasis_keyword": "keyword2.value"
                            })
                        }, function(error, response, body) {
                            if (!error && response.statusCode == 200) {


                                if (JSON.parse(body).errcode == 0) {
                                    console.log(item.user_name + ' 发送成功');
                                    mysql.sql('delete from user_formid where formid="' + item.form_id[0] + '"', function (err, result) {

                                        if (result && err == null) {
                                            console.log('删除formid成功');

                                        } else {
                                            console.log('删除formid失败');
                                            // res.status(200).send({code: 500, result: result, message: '删除formid失败'});
                                        }
                                    });
                                } else {
                                    console.log(error);
                                }

                            }
                        })
                    })
                });
            });
        }catch (e) {
            console.log(e);
        }


   }

};