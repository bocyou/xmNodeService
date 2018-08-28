const express=require('express');
const router=express.Router();
const xlsx = require('node-xlsx');
const mysql = require('../lib/mysql');
const checkSession = require('../middlewares/check_session').checkSession;


var now = new Date(); //当前日期
var nowDayOfWeek = now.getDay()-1; //今天本周的第几天
var nowDay = now.getDate(); //当前日
var nowMonth = now.getMonth(); //当前月
var nowYear = now.getYear(); //当前年
nowYear += (nowYear < 2000) ? 1900 : 0; //
var lastMonthDate = new Date(); //上月日期
lastMonthDate.setDate(1);
lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
var lastYear = lastMonthDate.getYear();
var lastMonth = lastMonthDate.getMonth();

//格式化日期：yyyy-MM-dd
function formatDate(date) {
    var myyear = date.getFullYear();
    var mymonth = date.getMonth() + 1;
    var myweekday = date.getDate();
    if (mymonth < 10) {
        mymonth = "0" + mymonth;
    }
    if (myweekday < 10) {
        myweekday = "0" + myweekday;
    }
    return (myyear + "-" + mymonth + "-" + myweekday);
}
//获得上周的开始日期
function getLastWeekStartDate() {
    let weekStartDate = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek - 7);
    return formatDate(weekStartDate);
}
//获得上周的结束日期
function getLastWeekEndDate() {
    let weekEndDate = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek - 1);
    return formatDate(weekEndDate);
}
router.get('/',function(req,res){
    //导出上周订餐信息
    mysql.findtest('order_food_user', 'users', 'where YEARWEEK(tab1.create_time,1) = YEARWEEK(DATE_ADD(now(),INTERVAL -1 WEEK),1)', function (err, result) {
        if (err) {
            console.log(err);
           console.log('获取数据失败');
        } else {
            let data = [['姓名','部门','金额','订餐次数']];
            let ary=result;
            ary.sort((a,b)=>{
                return a.user_id-b.user_id;
            });
            for (let i = 0; i < ary.length;) {
                let count = 0;//订餐次数
                let user_money=0;//用户花费
                for (let j = i; j < ary.length; j++) {
                    if (ary[i].user_id == ary[j].user_id) {
                        user_money+=(20+parseInt(ary[j].spread_money));
                        count++;
                    }
                }
                let user=ary[i];
                data.push([user.user_name,user.department,user_money,count]);
                i += count;
            }
            let buffer = xlsx.build([{name: "mySheetName", data: data}]); // returns a buffer
            res.type('application/vnd.openxmlformats').set('Content-Disposition', 'attachment; filename='+getLastWeekStartDate()+'_'+getLastWeekEndDate()+'.xlsx');
            res.end(buffer, 'binary');
        }
    })


});

module.exports=router;