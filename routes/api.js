/**
 * Created by haoguo on 17/10/16.
 */
var express = require('express');
var request = require('request');
var router = express.Router();
var mysql = require('../lib/mysql');
var session = require('express-session');
var checkSession = require('../middlewares/check_session').checkSession;
var crypto = require('crypto');
var tool = require('../middlewares/tool');
var getUserInfo = tool.getUserInfo;
var getCurrentSession = tool.getCurrentSession;


router.get('/', function (req, res) {
    res.render('api', {title: ''});

});
//解密获取用户信息
function WXBizDataCrypt(appId, sessionKey) {
    this.appId = appId
    this.sessionKey = sessionKey
}

WXBizDataCrypt.prototype.decryptData = function (encryptedData, iv) {
    // base64 decode
    var sessionKey = new Buffer(this.sessionKey, 'base64')
    encryptedData = new Buffer(encryptedData, 'base64')
    iv = new Buffer(iv, 'base64')

    try {
        // 解密
        var decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv)
        // 设置自动 padding 为 true，删除填充补位
        decipher.setAutoPadding(true)
        var decoded = decipher.update(encryptedData, 'binary', 'utf8')
        decoded += decipher.final('utf8')

        decoded = JSON.parse(decoded)

    } catch (err) {
        throw new Error('Illegal Buffer')
    }

    if (decoded.watermark.appid !== this.appId) {
        throw new Error('Illegal Buffer')
    }

    return decoded
}
/* var getUserInfo=function(session,callback,res){

    mysql.find_one('custom_session','session_key',[session], function (result) {

        if (result.length>0) {
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
//后台管理获取用户信息
router.post('/get_current_userinfo',checkSession, function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");

    res.send(200, {code: 200, result: req.session.user, message: "获取当前用户信息成功"})

});




//检查当前用户是否合法


router.post('/check_current_user', function (req, res, next) {
    getUserInfo(req.headers.sessionkey, function (userInfo) {
        if (userInfo.length > 0) {
            res.send(200, {code: 200, result: true, message: "该用户合法"})
        } else {
            res.send(200, {code: 200, result: false, message: "用户不合法"})
        }
    }, res);

});

/*我start*/

router.post('/get_current_not_pay', function (req, res, next) {

    getUserInfo(req.headers.sessionkey, function (userInfo) {
        if (userInfo.length > 0) {
            res.send(200, {code: 200, result: true, message: "该用户合法"})
        } else {
            res.send(200, {code: 200, result: false, message: "用户不合法"})
        }
    }, res);

});
/*我end*/


//登录成功返回session及用户信息,下次登录
router.post('/user_login', function (req, res, next) {
    var reqData = req.body;
    reqData.userInfo = JSON.parse(reqData.userInfo);
    //获取微信code后获取openid
    if (reqData.wx_code != '') {

        request.post({
            url: 'https://api.weixin.qq.com/sns/jscode2session', formData: {
                js_code: reqData.wx_code,
                appid: "wxff898caf09a11846",
                secret: "6f8b1e6559774ab25c0e6ec3b5b1ee26",
                grant_type: "authorization_code"
            }
        }, function optionalCallback(err, httpResponse, body) {
            if (err) {
                res.send(200, {code: 200, result: '获取openid失败'});
            } else {
                //生成3rd_session
                var wxSession = JSON.parse(body);
                var randomSession = 'se' + new Date().getTime() + reqData.wx_code;//生成随机session

                var userInfo = Object.assign(wxSession, reqData.userInfo);//session和微信基本信息合并

                var expires = new Date(new Date().getTime() + 20 * 24 * 60 * 60 * 1000);//过期时间
                //判断此用户是否注册
                mysql.find_one('users', 'open_id', userInfo.openid, function (result) {
                    if (result && result.length > 0) {
                        //已经注册
                        //存入一条session记录
                        mysql.insert_one('custom_session', {
                            session_key: randomSession,
                            expires: expires,
                            create_time: new Date(),
                            open_id: userInfo.openid,
                            user_id: result[0].id,
                            area: result[0].area,
                        }, function (result, err) {
                            if (result) {
                                //session存入数据库
                                res.send(200, {code: 200, result: true, session: randomSession});

                            } else {
                                res.send(200, {code: 200, result: false, message: '新建session失败'})
                            }
                        });

                    } else {
                        res.send(200, {code: 200, result: -1, message: '该用户尚未注册'});
                    }
                });


            }

        });
    } else {
        res.send(200, {code: 200, result: '参数错误'});
    }

});

//注册
router.post('/user_sign_up', function (req, res, next) {
    var req_data = req.body;

    //先验证邀请码
    var invite_code = req_data.invite;
    mysql.conditionSearch('invite_code', 'code="' + req_data.invite + '" AND status="1"', function (result) {

        if (result && result.length > 0) {

            //邀请码有效,向微信服务器获取openid
            var invite_id = result[0].id;
            request.post({
                url: 'https://api.weixin.qq.com/sns/jscode2session', formData: {
                    js_code: req_data.wx_code,
                    appid: "wxff898caf09a11846",
                    secret: "6f8b1e6559774ab25c0e6ec3b5b1ee26",
                    grant_type: "authorization_code"
                }
            }, function optionalCallback(err, httpResponse, body) {
                if (err) {
                    res.send(200, {code: 200, result: '获取openid失败'});
                } else {

                    //生成randomSession用于和小程序关联信息
                    var wxSession = JSON.parse(body);

                    var randomSession = 'se' + new Date().getTime() + req_data.wx_code;//生成随机session

                    var userInfo = Object.assign(wxSession, req_data.userInfo);//session和微信基本信息合并

                    var expires = new Date(new Date().getTime() + 20 * 24 * 60 * 60 * 1000);//过期时间
                    //存入一条session记录
                    //获取openid后检查此用户是否存在
                    mysql.find_one('users', 'open_id', userInfo.openid, function (result) {
                        if (result && result.lenght > 0) {
                            res.send(200, {code: 200, result: 2, session: randomSession, message: '该用户已存在'})
                        } else {

                            //创建用户
                            var addUser = {
                                wx_name: userInfo.nickName,
                                password: 'xiaomai123',
                                open_id: userInfo.openid,
                                role: 'user',
                                user_name: req_data.user_name,
                                area: req_data.area,
                                wx_info: JSON.stringify(req_data.userInfo)
                            };
                            //将此邀请码更新为不可用
                            mysql.updateData('invite_code', 'id="' + invite_id + '"', 'status="0"', function (result, err) {
                                if (result) {
                                    mysql.insertOne(addUser, function (result, err) {
                                        if (result) {

                                            mysql.insert_one('custom_session', {
                                                session_key: randomSession,
                                                expires: expires,
                                                create_time: new Date(),
                                                open_id: userInfo.openid,
                                                user_id: result.insertId,
                                                area: req_data.area
                                            }, function (result, err) {
                                                if (result) {
                                                    res.send(200, {
                                                        code: 200,
                                                        result: true,
                                                        session: randomSession,
                                                        message: '创建用户成功'
                                                    })


                                                } else {
                                                    res.send(200, {code: 200, result: '', message: '新建session失败'})
                                                }
                                            });

                                        } else {
                                            res.send(200, {code: 200, result: false, message: '创建用户失败'})
                                        }

                                    });
                                } else {
                                    res.send(200, {code: 200, result: false, message: '更改邀请码状态失败'});
                                }
                            })


                        }
                    })


                }

            });

        } else {
            //邀请码无效
            res.send(200, {code: 200, result: 3, message: '您输入的邀请码无效'});
        }
    })


})





router.post('/test', function (req, res, next) {
    var req_data = req.body;


    request.post({
        url: 'https://api.weixin.qq.com/sns/jscode2session', formData: {
            js_code: req_data.code,
            appid: "wx4c30127279046bea",
            secret: "61ba88984991a7de0e92bf40378ef98f",
            grant_type: "authorization_code"
        }
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
            res.send(200, {code: 200, result: '获取openid失败'});
        } else {
            //生成randomSession用于和小程序关联信息
            var wxSession = JSON.parse(body);
            var randomSession = 'se' + new Date().getTime() + req_data.code;//生成随机session

            var userInfo = Object.assign(wxSession, req_data.userInfo);//session和微信基本信息合并

            var expires = new Date(new Date().getTime() + 20 * 24 * 60 * 60 * 1000);//过期时间


            var appId = 'wx4c30127279046bea'
            var sessionKey = userInfo.session_key
            var encryptedData = req_data.encryptedData;
            var iv = req_data.iv;

            var pc = new WXBizDataCrypt(appId, sessionKey)

            var data = pc.decryptData(encryptedData, iv)



            res.send(200, {code: 200, result: data});


        }

    });

})


router.post('/test2', function (req, res, next) {
    var req_data = req.body;


    request.post({
        url: 'https://api.weixin.qq.com/sns/jscode2session', formData: {
            js_code: req_data.code,
            appid: "wx5032de5b5542cd54",
            secret: "f5a921922bf475ff65d343edb0985ca2",
            grant_type: "authorization_code"
        }
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
            res.send(200, {code: 200, result: '获取openid失败'});
        } else {
            //生成randomSession用于和小程序关联信息
            var wxSession = JSON.parse(body);
            var randomSession = 'se' + new Date().getTime() + req_data.code;//生成随机session

            var userInfo = Object.assign(wxSession, req_data.userInfo);//session和微信基本信息合并

            var expires = new Date(new Date().getTime() + 20 * 24 * 60 * 60 * 1000);//过期时间


            var appId = 'wx5032de5b5542cd54'
            var sessionKey = userInfo.session_key
            var encryptedData = req_data.encryptedData;
            var iv = req_data.iv;

            var pc = new WXBizDataCrypt(appId, sessionKey)

            var data = pc.decryptData(encryptedData, iv)



            res.send(200, {code: 200, result: data});


        }

    });

});


router.post('/get_all_user', function (req, res, next) {
    //获取所有用户表
    mysql.search(req, res, next, 'users', function (rows, fields) {
        if (fields) {
            res.send(200, {code: 200, result: {"users": rows}})
        }

    });
});
router.post('/get_current_user', function (req, res, next) {
//获取当前用户信息
    getUserInfo(req.headers.sessionkey, function (userInfo) {
        if (userInfo&&userInfo.length > 0) {
            var user_info={
                wx_name:userInfo[0].wx_name,
                id:userInfo[0].id,
                role:userInfo[0].role,
                user_name:userInfo[0].user_name,
                area:userInfo[0].area,
                wx_img:JSON.parse(userInfo[0].wx_info).avatarUrl
            };
            res.send(200, {code: 200, result: user_info, message: "获取当前用户信息成功"})
        } else {
            res.send(200, {code: 200, result: {}, message: "获取用户信息失败"})
        }
    }, res);
});
//正在执行的任务
router.post('/get_cleaning_list', checkSession, function (req, res, next) {
    mysql.search(req, res, next, 'cleaning_list', function (rows, fields) {
        if (fields) {
            var listStatus = 'undistributed';
            res.send(200, {code: 200, result: {"cleaning_list": rows}})
        }

    });
});
router.post('/get_wx_info', function (req, res, next) {
    res.send(200, {code: 200, result: req.body.session})
});

//获取清洁任务列表(原始列表)
router.post('/get_clean_list', function (req, res, next) {
    mysql.search(req, res, next, 'clean_list', function (rows, fields) {
        if (fields) {
            var listStatus = 'undistributed';
            for (var i = 0; i < rows.length; i++) {
                if (rows[i].status != 'undistributed') {
                    //如果状态里有其他状态则说明已经分发
                    listStatus = 'distributed';
                    break;
                }
            }
            res.send(200, {code: 200, result: {"clean_list": rows, "list_status": listStatus}})
        }

    });
});

router.post('/update_clean_list', function (req, res, next) {
    mysql.update(req, res, next, '', function (result) {
        if (result) {
            res.send(200, {code: 200, result: result})
        }

    });
});


//管理模块
router.post('/finish_work', function (req, res, next) {
    //结束今天所有任务
    mysql.deleteTable(req, res, next, function (result, err) {
        if (result) {
            res.send(200, {code: 200, result: result})
        } else {
            res.send(200, {code: 501, result: err.sqlMessage, message: '删除失败'});
        }
    });


});


router.post('/post_work', checkSession, function (req, res, next) {
//分发任务
    var usr = req.body.works;
    for (var i = 0; i < usr.length; i++) {
        usr[i][3] = 'yifenfa';
        usr[i][4] = new Date();
    }
    mysql.insert_more('cleaning_list(`work_id`,`name`, `money`,`status`,`task_time`)', [usr], function (result, err) {
        if (result) {
            res.send(200, {code: 200, result: result})
        } else {
            res.send(200, {code: 501, result: err.sqlMessage, message: '插入失败'});
        }

    });
});

router.post('/draw_work_status', function (req, res, next) {
    //更改任务状态,领取任务
    var getData = req.body;
    getUserInfo(req.headers.sessionkey, function (result) {
        if (result) {
            var userName = result[0].name;
            var userId = result[0].id;

            //更新任务状态
            mysql.updateData('cleaning_list', 'work_id=' + getData.work_id, 'receiver_name= "' + userName + '", receiver_id = "' + userId + '",status="yilingqu"', function (result, err) {
                if (result) {
                    res.send(200, {code: 200, result: true, message: '更新任务状态成功'});
                } else {
                    res.send(200, {code: 501, result: err.sqlMessage, message: '更新任务状态失败'});
                }
            })
        } else {
            res.send(200, {code: 501, result: '', message: '获取用户信息失败'});
        }
    });
});

router.post('/pending_work_status', function (req, res, next) {
    //更改任务状态,个人完成任务
    var getData = req.body;
    getUserInfo(req.headers.sessionkey, function (result) {
        if (result) {
            var userName = result[0].name;
            var userId = result[0].id;
            //更新任务状态
            mysql.updateData('cleaning_list', 'work_id=' + getData.work_id, 'receiver_name= "' + userName + '", receiver_id = "' + userId + '",status="pending"', function (result, err) {
                if (result) {
                    res.send(200, {code: 200, result: true, message: '更新任务状态成功'});
                } else {
                    res.send(200, {code: 501, result: err.sqlMessage, message: '更新任务状态失败'});
                }
            })
        } else {
            res.send(200, {code: 501, result: '', message: '获取用户信息失败'});
        }
    });
});


router.post('/passed_work_status', function (req, res, next) {
    //更改任务状态,管理员审核通过
    //通过后给领取人加钱
    var getData = req.body;
    getUserInfo(req.headers.sessionkey, function (result) {
        //获取当前用户信息
        if (result) {

            var userName = result[0].name;
            var userId = result[0].id;
            var receiver_id = getData.receiver_id;//工作人员信息
            var oldMoney = (result[0].money == '' ? 0 : parseInt(result[0].money));//本来已经赚到的钱
            //先根据work_id找到此工作
            mysql.find_one('cleaning_list', 'work_id', getData.work_id, function (result) {
                if (result) {
                    var workData = result[0];
                    var newMoney = parseInt(workData.money);
                    var sumMoney = newMoney + oldMoney;
                    //更新任务状态
                    mysql.updateData('cleaning_list', 'work_id=' + getData.work_id, 'auditor= "' + userName + '",status="passed"', function (result, err) {
                        if (result) {
                            //更新用户钱数
                            mysql.updateData('users', 'id=' + receiver_id, 'money= "' + sumMoney + '"', function (result, err) {
                                if (result) {
                                    res.send(200, {code: 200, result: true, message: '更新任务状态成功'});

                                } else {
                                    res.send(200, {code: 501, result: err.sqlMessage, message: '更新领取人钱数失败'});
                                }
                            });

                        } else {
                            res.send(200, {code: 501, result: err.sqlMessage, message: '更新任务状态失败'});
                        }
                    })

                } else {
                    res.send(200, {code: 501, result: false, message: '没有找到此任务'});
                }
            });
            //更新任务状态
            /*  mysql.updateData('cleaning_list','work_id='+getData.work_id, 'auditor= "'+userName+'",status="passed"' ,function (result, err) {
                  if (result) {
                      //更新领取人的钱数
                      res.send(200, {code: 200, result: true, message: '更新任务状态成功'});
                  } else {
                      res.send(200, {code: 501, result: err.sqlMessage, message: '更新任务状态失败'});
                  }
              })*/
        } else {
            res.send(200, {code: 501, result: '', message: '获取用户信息失败'});
        }
    });
});
module.exports = router;