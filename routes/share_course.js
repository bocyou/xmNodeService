const express=require('express');
const router=express.Router();
const request = require('request');
const mysql = require('../lib/mysql');
const checkSession = require('../middlewares/check_session').checkSession;
const checkAppSession = require('../middlewares/check_session').checkAppSession;
router.get('/',function(req,res){
    res.render('test',{title:''});

});

router.post('/get_share_course', checkAppSession, function (req, res, next) {
    //获取课程列表
    res.header("Access-Control-Allow-Origin", "*");
    mysql.sql('SELECT  user_img,tab1.user_name,start_time,course_name FROM share_course tab1 JOIN users tab2 ON tab1.user_name = tab2.user_name ', function (err, result) {
        if (err) {
            console.log(err)
            res.status(200).send({code: 500, result: [], message: '获取课程信息失败'});
        } else {

            res.status(200).send({code: 200, result: result, message: '获取课程信息成功'});
        }
    })

});



module.exports=router;