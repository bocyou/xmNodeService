const express = require('express');

const router = express.Router();
const mysql = require('../lib/mysql');
let shake_users = [];

function checkRepeatSession(session) {
    for (let i = 0; i < shake_users.length; i++) {
        if (session === shake_users[i]) {
            return i
        }
    }
    return -1
}

//websoket获取用户信息
function getUserInfo(session, callback) {
    mysql.sql('SELECT * FROM custom_session tab1 JOIN users tab2 ON tab1.open_id = tab2.open_id WHERE session_key = "' + session + '"', function (err, result) {
        if (result && result.length > 0) {
            callback(result);

        } else {
            console.log(err);

        }

    })
}

//获取最新一期信息
function shakeInfo(connection, callback) {
    mysql.sql('SELECT * FROM shake  WHERE is_use = 1', function (err, result) {
        if (err) {
            connection.sendUTF(JSON.stringify({type: 'error', message: "获取本期信息失败"}))
        } else {
            callback(result);

        }

    })
}

//获取当期注资信息

function getDinnerInfo(term, callback) {
    mysql.sql('SELECT money,tab1.create_time,user_name,user_img  FROM dinner_together_info tab1 JOIN users tab2 ON tab1.user_id=tab2.id  WHERE term = ' + term, function (err, result) {
        if (result && result.length > 0) {
            callback(result);

        } else {
            console.log(err);

        }

    })
}

const work = {
    pay(connection, data, clients) {
        const self = this;
        getUserInfo(data.session, function (userInfo) {
            getNewTerm((term_info) => {
                mysql.insert_one('dinner_together_info', {
                    user_id: userInfo[0].id,
                    money: data.money,
                    create_time: new Date(),
                    term: term_info[0].term
                }, function (result, err) {
                    if (err) {
                        connection.sendUTF(JSON.stringify({result: [], type: 'pay', code: 500, message: "注资失败"}))
                    } else {
                        connection.sendUTF(JSON.stringify({result: [], type: 'pay', code: 200, message: "注资成功"}))
                        self.getDinnerInfo(connection, clients)
                    }

                    console.log(err);
                });
            })


        });
    },
    shakeInfo(connection) {
        shakeInfo(connection, (term_info) => {
            const data = term_info[0];

            connection.sendUTF(JSON.stringify({
                result: data,
                type: 'current_term_info',
                code: 200,
                message: `获取${data.term}期数据成功`
            }))
        })
        if(shake_users.length>0){
            work.getJoinUsers((result)=>{
                connection.sendUTF(JSON.stringify({type: 'up_join_users',result:result, message: "更新本期参与人数成功"}))
            },()=>{

            });
        }
    },
    updateShakeNum(connection, clients, data) {
        //更新时发现新用户广播
        if(work.getCurrentUserShake(data.session)){
            work.getJoinUsers((result)=>{
                clients.forEach(function (ws1) {
                    ws1.sendUTF(JSON.stringify({type: 'up_join_users',result:result, message: "更新本期参与人数成功"}))
                })
            },()=>{

            });
        }
        //更新摇一摇数量
        shakeInfo(connection, (term_info) => {
            const current_term_info = term_info[0];

            if (current_term_info.shake_num > current_term_info.user_shake_num) {
                mysql.sql('update shake set user_shake_num=user_shake_num+1 WHERE is_use=1 AND status=1', function (err, result) {
                    if (err) {
                        connection.sendUTF(JSON.stringify({type: 'error', message: "更新失败"}))
                    } else {
                        current_term_info.user_shake_num++;
                        if (current_term_info.shake_num == current_term_info.user_shake_num) {
                            console.log('公布中奖结果');
                            work.overShake(connection, clients, current_term_info);
                        } else {
                            clients.forEach(function (ws1) {
                                ws1.sendUTF(JSON.stringify({
                                    result: current_term_info,
                                    type: 'current_term_info',
                                    code: 200,
                                    message: `更新数据`
                                }))
                            })
                        }

                    }
                })
            }

        })
    },
    getCurrentUserShake(session) {
        //统计参与过本期摇奖的人数
        if (session) {
            if (checkRepeatSession(session) === -1) {
                shake_users.push(session);
                //有新人加入，通知客户端
                return true
            }
        }
        return false;

    },
    getJoinUsers(success,error){
        const self=this;
        let shake_user_ary=[];
        shake_users.forEach((item,idx)=>{
            shake_user_ary.push('session_key = ' + '"' + item + '"');
        });
        const user_session_str = shake_user_ary.join(' or ');
        mysql.sql('SELECT user_name,user_img FROM custom_session tab1 JOIN users tab2 ON tab1.open_id = tab2.open_id WHERE ' + user_session_str, function (err, result) {
            if (err) {
                console.log(err);
            } else {
                success(result);
            }

        })
    },
    getCurrentWinUser(connection) {
        shakeInfo(connection, (term_info) => {
            const current_term_info = term_info[0];
            mysql.sql('SELECT user_img,user_name FROM  shake_win_user tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE tab1.term =' + current_term_info.term, function (err, result) {
                if (err) {
                    connection.sendUTF(JSON.stringify({type: 'error', message: "获取本期信息失败"}))
                } else {
                    connection.sendUTF(JSON.stringify({type: 'get_win_user', result: result, message: "获取本期获奖人员成功"}))

                }

            })


        })
    },
    overShake(connection, clients, current_term_info) {
        //设置了中奖人数并且至少有一个中奖人数；
        work.pubOverShake(current_term_info, (type,message) => {

            switch (type) {
                case 1:
                    connection.sendUTF(JSON.stringify({type: 'error', message: message}));
                    break;
                case 2:
                    clients.forEach(function (ws1) {
                        ws1.sendUTF(JSON.stringify({type: 'error', message: message}))
                    });
                    break;
            }
        }, (data) => {
            clients.forEach(function (ws1) {
                ws1.sendUTF(JSON.stringify({
                    result: data,
                    type: 'current_term_info',
                    code: 200,
                    message: `本期已结束`
                }))
            })

        });

    },
    pubOverShake(current_term_info, error, success) {
        //设置了中奖人数并且至少有一个中奖人数；
        if (parseInt(current_term_info.win_users) > 0 & shake_users.length > 0) {
            let user_sessions = [];
            for (let i = 0; i < parseInt(current_term_info.win_users); i++) {
                if (shake_users.length > 0) {
                    const idx = Math.floor(Math.random() * shake_users.length);
                    user_sessions.push('session_key = ' + '"' + shake_users[idx] + '"');
                    shake_users.splice(idx, 1);
                }
            }
            const user_session_str = user_sessions.join(' or ');
            mysql.sql('SELECT * FROM custom_session tab1 JOIN users tab2 ON tab1.open_id = tab2.open_id WHERE ' + user_session_str, function (err, result) {
                if (result && result.length > 0) {
                    //插入本期中奖用户
                    let win_users = [];
                    result.forEach((item, idx) => {
                        win_users[idx] = [];
                        win_users[idx][0] = item.user_id;
                        win_users[idx][1] = current_term_info.term;
                        win_users[idx][2] = new Date();
                    });
                    mysql.insert_more('shake_win_user(`user_id`, `term`,`create_time`)', [win_users], function (result, err) {
                        if (err) {
                            error(1,'存储中奖用户失败');
                        } else {
                            mysql.sql('update shake set status=0,over_time="' + new Date().Format('yy-MM-dd HH:mm:ss') + '" WHERE is_use=1', function (err, result) {
                                if (err) {
                                    error(2,'结束失败（更新shake失败）');
                                } else {
                                    current_term_info.status = 0;
                                    success(current_term_info);
                                }
                            })

                        }

                    });

                } else {
                    error(1,'更新中奖用户失败');
                }

            })
        }
    }
};

//连接不上websocket
router.post('/get_shake_info', function (req, res, next) {
    mysql.sql('SELECT * FROM shake  WHERE is_use = 1', function (err, result) {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取当前期失败'})
        } else {
            res.status(200).send({code: 200, result: result[0], message: "获取当前期成功"})
        }
    })
});

router.post('/get_join_users', function (req, res, next) {
    if(shake_users.length>0){
        work.getJoinUsers((result)=>{
            res.status(200).send({code: 200, result: result, message: '获取参加人员信息成功'})
        },()=>{
            res.status(200).send({code: 500, result: [], message: '获取参加人员信息失败'})
        });
    }else{
        res.status(200).send({code: 200, result:[], message: '尚无参加人员'})
    }

});
router.post('/update_shake_num', function (req, res, next) {
    const session = req.headers.sessionkey;
    let is_have_new=0;
    if(work.getCurrentUserShake(session)){
        is_have_new=1;
    }
    mysql.sql('SELECT * FROM shake  WHERE is_use = 1', function (err, result) {
        if (result && result.length > 0) {
            const current_term_info = result[0];
            current_term_info.is_have_new=is_have_new;
            if (current_term_info.shake_num > current_term_info.user_shake_num) {
                mysql.sql('update shake set user_shake_num=user_shake_num+1 WHERE is_use=1 AND status=1', function (err, result) {
                    if (err) {
                        res.status(200).send({code: 500, result: [], message: '更新次数失败'})
                    } else {
                        current_term_info.user_shake_num++;
                        if (current_term_info.shake_num === current_term_info.user_shake_num) {
                            console.log('公布中奖结果');

                            work.pubOverShake(current_term_info,(type,message)=>{
                                res.status(200).send({code: 500, result: {}, message: message});
                            },data=>{
                                res.status(200).send({code: 200, result: data, message: '更新数据成功'});
                            })
                        } else {
                            res.status(200).send({code: 200, result: current_term_info, message: '更新数据成功'});

                        }

                    }
                })
            }

        } else {
            res.status(200).send({code: 500, result: [], message: '获取当前期失败'})

        }

    })
});
router.post('/get_win_users', function (req, res, next) {
    mysql.sql('SELECT * FROM shake  WHERE is_use = 1', function (err, result) {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取当前期失败'})
        } else {
            const current_term_info = result[0];
            mysql.sql('SELECT user_img,user_name FROM  shake_win_user tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE tab1.term =' + current_term_info.term, function (err, result) {
                if (err) {
                    res.status(200).send({code: 500, result: [], message: '获取中奖人员数据失败'})
                } else {
                    res.status(200).send({code: 200, result: result, message: '获取中奖人员数据成功'})

                }

            })
        }
    })
});

//管理部分
router.post('/manage/get_current_term', function (req, res, next) {
    mysql.sql('SELECT * FROM shake  WHERE is_use = 1', function (err, result) {
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取当前期失败'})

        } else {
            res.status(200).send({code: 200, result: result[0], message: "获取当前期成功"})

        }


    })
});
router.post('/manage/shake_start', function (req, res, next) {
    const screen_data = req.body;
    mysql.sql('SELECT * FROM shake  WHERE is_use = 1', function (err, result) {
        if (err) {
            res.status(200).send({code: 200, result: result[0], message: '获取当前期失败'})
        } else {
            const current_info = result[0];
            mysql.sql('update shake set is_use=0 WHERE id=' + current_info.id, function (err, result) {
                if (err) {
                    res.status(200).send({code: 200, result: result[0], message: ' 更新当期状态失败'})
                } else {
                    mysql.insert_one('shake', {
                        term: parseInt(current_info.term) + 1,
                        is_use: 1,
                        create_time: new Date(),
                        over_time: '',
                        shake_num: screen_data.shake_num,
                        user_shake_num: 0,
                        status: 1,
                        win_users: screen_data.win_users
                    }, function (result, err) {
                        if (err) {
                            res.status(200).send({code: 500, result: false, message: '开始失败'})
                        } else {
                            shake_users=[];
                            res.status(200).send({code: 200, result: true, message: '成功开启'})
                        }
                    });


                }
            })


        }


    })
});

router.post('/manage/get_win_users', function (req, res, next) {
    mysql.sql('SELECT user_name,user_img,term FROM shake_win_user tab1 JOIN users tab2 ON tab1.user_id = tab2.id', function (err, result) {
        console.log(err);
        if (err) {
            res.status(200).send({code: 500, result: [], message: '获取得奖用户失败'})

        } else {
            res.status(200).send({code: 200, result: result, message: "获取当前期成功"})

        }


    })
});


module.exports = {
    shakeRouter: router,
    pay: work.pay,
    shakeInfo: work.shakeInfo,
    updateShakeNum: work.updateShakeNum,
    getCurrentWinUser: work.getCurrentWinUser
};