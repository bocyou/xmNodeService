/**
 * Created by haoguo on 17/10/16.
 */
var config = require('config-lite');
var mysql = require('mysql');
var connection = mysql.createConnection(config.mysql);

connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }

    console.log('connected as id ' + connection.threadId);
});

module.exports = {
    search: function (req, res, next, kind, callback) {
        //查询
        connection.query('select * from `' + kind + '`', function (err, rows, fields) {
            if (err) throw err;
            callback(rows, fields);

        });
    },
    update: function (req, res, next, callback) {
        //更改状态
        var id = req.body.work_id,
            status = req.body.status;
        var changeStatus = '';
        var auditor = null;
        switch (status) {
            case'pending':
                //待审核改为审核通过
                changeStatus = 'passed';
                break;
            case'yifenfa':
                changeStatus='yilingqu';
                break;
            case 'yilingqu':
                changeStatus='pending';
                break;
            case 'pending':
                changeStatus='passed';
                break;
        }
        console.log(req.body);
        if(req.body.receiver != '' && req.body.receiver != undefined){
            //领取相关
            connection.query('update cleaning_list set receiver="' + req.body.receiver + '" where work_id=' + id, {receiver: ''}, function (err, result) {
                if(result){
                    connection.query('update cleaning_list set status="' + changeStatus + '" where work_id=' + id, {status: status}, function (err, result) {
                        callback(result, err);
                    });
                }else{
                    callback(result, err);
                }
            });
        }else if(req.body.auditor != '' && req.body.auditor != undefined){
            connection.query('update cleaning_list set auditor="' + req.body.auditor + '" where work_id=' + id, {auditor: ''}, function (err, result) {
                if(result){
                    connection.query('update cleaning_list set status="' + changeStatus + '" where work_id=' + id, {status: status}, function (err, result) {
                        callback(result, err);
                    });
                }else{
                    callback(result, err);
                }
            });
        }else{
            connection.query('update cleaning_list set status="' + changeStatus + '" where work_id=' + id, {status: status}, function (err, result) {
                callback(result, err);
            });
        }
    },
    updateData:function(table,who,changed,callback){
        connection.query('update '+table+' set '+changed+' where '+who, function (err, result) {
            callback(result, err);
        });
    },
    test:function(){
        connection.query("UPDATE cleaning_list SET receiver_name= '3333', receiver_id = 13 WHERE work_id = '2'", function(err, result) {
            callback(result, err);
        });
    },
    insertMore: function (req, res, next, callback) {

        var usr = req.body.works;
        for (var i = 0; i < usr.length; i++) {
            usr[i][3] = 'yifenfa';
            usr[i][4] = new Date();
        }

        connection.query("INSERT INTO cleaning_list(`work_id`,`name`, `money`,`status`,`task_time`) VALUES ?", [usr],
            function (err, result) {
                callback(result, err);

            });
    },
    insert_more:function(table,val,callback){
        connection.query("INSERT INTO "+table+" VALUES ?", val,
            function (err, result) {
                callback(result, err);

            });
    },
    insertOne:function(param,callback){
       
        connection.query('insert into users set ?', param, function(err, result) {
            callback(result, err);
        });
    },
     insert_one:function(table,param,callback){
        connection.query('insert into  '+table+' set ?', param, function(err, result) {
            callback(result, err);
        });
    },
    deleteTable: function (req, res, next, callback) {
        connection.query('delete from  cleaning_list', function( result,err) {
            console.log(err);
            callback(result, err);
        });
    },
    findOne:function(openId,callback){
        console.log(openId);
        connection.query(
            {
                sql: 'select * from users where open_id = ?',
                values: [openId], // 作为对象的属性
                timeout: 40000
            },
            function(err, result) {
                callback(result, err);
            }
        );
    },
    findMore:function(table,key,aryVal,callback){
        connection.query('select * from '+table+' where '+key+' in ('+aryVal+')',
            function(err, result) {
                callback(result, err);
            }
        );
    },
    find_one:function(table,key,val,callback){
        connection.query(
            {
                sql: 'select * from '+table+' where '+key+' = ?',
                values: val, // 作为对象的属性
                timeout: 40000
            },
            function(err, result) {
                callback(result, err);
            }
        );
    },
    conditionSearch:function(table,condition,callback){
        //条件搜索
         connection.query('select * from '+table+' where '+condition,
            function(err, result) {
                callback(result, err);
            }
        );
    },
    findMonth:function(table,condition,callback){
          connection.query('SELECT * FROM '+table+' WHERE date_format(create_time,"%Y-%m")=date_format(now(),"%Y-%m") AND '+condition,
            function(err, result) {
                callback(result, err);
            }
        );
    },
    findWeek:function(table,condition,callback){
        connection.query('SELECT * FROM '+table+' WHERE YEARWEEK(create_time)=YEARWEEK(now()) AND '+condition,
            function(err, result) {
                callback(result, err);
            }
        );
    },
    findtest:function(tab1,tab2,custom,callback){
        connection.query('SELECT * FROM '+tab1+' tab1 JOIN '+tab2+' tab2 ON tab1.user_id = tab2.id '+custom,function(err,result){
            callback(err,result)
        });
    },
    findCurrentWeek:function(table,condition,callback){
        connection.query('SELECT * FROM '+table+' WHERE YEARWEEK(create_time) = YEARWEEK(now())'+condition,
            function(err, result) {

                callback(result, err);
            }
        );
    },
    findUserWeekBill:function(sql,callback){
        connection.query(sql, function(err, result) {
                callback(result, err);
            }
        );
    },
    sql:function(sql,callback){
        connection.query(sql, function(err, result) {
                callback(err,result);
            }
        );
    },
    findToday:function(table,condition,callback){
         connection.query('SELECT * FROM '+table+' WHERE to_days(create_time) = to_days(now()) AND '+condition,
            function(err, result) {
                callback(result, err);
            }
        );
    },
    find_today:function(table,callback){
         connection.query('SELECT * FROM '+table+' WHERE to_days(create_time) = to_days(now()) ',
            function(err, result) {
                callback(result, err);
            }
        );
    },
    findMaxTime:function(table,key,callback){
        connection.query('SELECT * FROM '+table+' bi,(SELECT max('+key+') as max_time FROM '+table+') max_bi WHERE bi.create_time = max_bi.max_time AND to_days(create_time) = to_days(now())',
            function(err, result) {
                callback(result, err);
            }
        );
    },
    findMaxTimeCondition:function(table,key,condition,callback){
          connection.query('SELECT * FROM '+table+' bi,(SELECT max('+key+') as max_time FROM '+table+') max_bi WHERE bi.create_time = max_bi.max_time AND '+condition,
            function(err, result) {
                callback(result, err);
            }
        );
    },

    findTodayList:function(table,condition,callback){
        //目前仅check_currentuser_dinner用到
         connection.query('SELECT * FROM '+table+' WHERE '+condition,
            function(err, result) {
                callback(result, err);
            }
        );
    },
   
 
    findSession:function(session_key,callback){
        connection.query(
            {
                sql: 'select * from custom_session where session_key = ?',
                values: [session_key], // 作为对象的属性
                timeout: 40000
            },
            function(err, result) {
                callback(result, err);
            }
        );
    }
};
/*
 var usr={name:'zhangsan',password:'pwdzhangsan',mail:'zhangsan@gmail.com'};
 connection.query('insert into users set ?', usr, function(err, result) {
 if (err) throw err;

 console.log('inserted zhangsan');
 console.log(result);
 console.log('\n');
 });
 */
/*
 var $conf=require('../conf/db.js');
 var $util=require('../util/util.js');
 var $sql=require('./goodsql.js');
 //使用连接池
 var pool  = mysql.createPool($util.extend({}, $conf.mysql));

 // 向前台返回JSON方法的简单封装
 var jsonWrite = function (res, ret) {
 if(typeof ret === 'undefined') {
 res.json({
 code:'1',
 msg: '操作失败'
 });
 } else {
 res.json(ret);
 }
 };

 module.exports = {
 //增加商品
 goodadd: function (req, res, next) {
 pool.getConnection(function(err, connection) {
 // 获取前台页面传过来的参数
 var param = req.query || req.params;

 // 建立连接，向表中插入值
 // 'INSERT INTO user(id, name, age) VALUES(0,?,?)',
 connection.query($sql.goodinsert, [param.name, param.desc,param.price,param.sum], function(err, result) {
 if(result) {
 result = {
 code: 200,
 msg:'增加成功'
 };
 }

 // 以json形式，把操作结果返回给前台页面
 jsonWrite(res, result);

 // 释放连接
 connection.release();
 });
 });
 },
 gooddelete: function (req, res, next) {
 // delete by Id
 pool.getConnection(function(err, connection) {
 var id = +req.query.id;
 connection.query($sql.gooddelete, id, function(err, result) {
 if(result.affectedRows > 0) {
 result = {
 code: 200,
 msg:'删除成功'
 };
 } else {
 result = void 0;
 }
 jsonWrite(res, result);
 connection.release();
 });
 });
 },
 goodupdate: function (req, res, next) {
 // update by id
 // 为了简单，要求同时传name和age两个参数
 pool.getConnection(function(err, connection) {
 // 获取前台页面传过来的参数
 var param = req.query || req.params;

 // 建立连接，向表中插入值
 // 'INSERT INTO user(id, name, age) VALUES(0,?,?)',
 connection.query($sql.goodupdate, [param.name, param.desc,param.price,param.sum,param.id], function(err, result) {
 if(result) {
 result = {
 code: 200,
 msg:'修改成功'
 };
 }

 // 以json形式，把操作结果返回给前台页面
 jsonWrite(res, result);

 // 释放连接
 connection.release();
 });
 });
 },
 //得到所有商品 在路由routes调用本方法，这个方法调用sql语句 ，并返回相应结果jsonwrite
 goodAll: function (req, res, next) {
 pool.getConnection(function(err, connection) {
 connection.query($sql.goodAll, function(err, result) {
 jsonWrite(res, result);
 connection.release();
 });
 });
 },

 goodById: function (req, res, next) {
 var id = +req.query.id; // 为了拼凑正确的sql语句，这里要转下整数
 pool.getConnection(function(err, connection) {
 connection.query($sql.goodById, id, function(err, result) {
 jsonWrite(res, result);
 connection.release();

 });
 });
 },
 };*/
