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


//格式化日期：yyyy-MM-dd

//获得上周的开始日期
function getLastWeekStartDate() {
    let weekStartDate = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek - 7);
    return (weekStartDate).Format('yyyy-MM-dd');
}
//获得上周的结束日期

function getLastWeekEndDate() {
    let weekEndDate = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek - 1);
    return (weekEndDate).Format('yyyy-MM-dd');
}

router.get('/',function(req,res){
    //导出上周订餐信息
    mysql.findtest('order_food_user', 'users', 'where tab1.status=1 and YEARWEEK(tab1.create_time,1) = YEARWEEK(DATE_ADD(now(),INTERVAL -1 WEEK),1)', function (err, result) {
        if (err) {
            console.log(err);
           console.log('获取数据失败');
        } else {
            console.log('attachment; filename='+getLastWeekStartDate()+'_'+getLastWeekEndDate()+'.xlsx');

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

                        JSON.parse(ary[j].dinner_list).forEach((item,idx)=>{
                            user_money+=parseInt(item.list.price)*item.num;
                        });
                        /*user_money+=(20+parseInt(ary[j].spread_money));*/
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
router.get('/dinner_info',function(req,res){
    //导出上周订餐详细信息
    mysql.findtest('order_food_user', 'users', 'where tab1.status=1 and YEARWEEK(tab1.create_time,1) = YEARWEEK(DATE_ADD(now(),INTERVAL -1 WEEK),1)', function (err, result) {
        if (err) {
            console.log(err);
            console.log('获取数据失败');
        } else {
            console.log('attachment; filename='+getLastWeekStartDate()+'_'+getLastWeekEndDate()+'.xlsx');

            let data = [['姓名','部门','订餐详情','总价','订餐日期']];
            let ary=result;

            ary.forEach((item,idx)=>{
                let dinner_info=[];
                let all_money=0;
                JSON.parse(item.dinner_list).forEach((item1,idx)=>{
                    dinner_info.push(item1.list.name+'_'+item1.list.price+'元_'+item1.num+'个');
                    all_money+=parseInt(item1.list.price)*item1.num;
                });
                data.push([item.user_name,item.department,dinner_info.join(','),all_money,new Date(item.create_time).Format('yyyy年MM月dd日 HH:mm')])
            })
            let buffer = xlsx.build([{name: "mySheetName", data: data}]); // returns a buffer
            res.type('application/vnd.openxmlformats').set('Content-Disposition', 'attachment; filename='+getLastWeekStartDate()+'_'+getLastWeekEndDate()+'.xlsx');
            res.end(buffer, 'binary');

        }
    })
});


router.post('/test',function(req,res){
    //导出上周订餐信息
   console.log('attachment; filename='+getLastWeekStartDate()+'_'+getLastWeekEndDate()+'.xlsx');


});


module.exports=router;