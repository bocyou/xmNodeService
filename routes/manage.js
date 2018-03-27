/**
 * Created by haoguo on 17/5/31.
 */
var express = require('express');
var request = require('request');
var router = express.Router();
var mysql = require('../lib/mysql');
var session = require('express-session');
var checkSession = require('../middlewares/check_session').checkSession;
var getUserInfo=require('../middlewares/tool').getUserInfo;
router.get('/',function(req,res){
    res.render('index',{title:'首页'});
    //res.send('hello');
  /*  if(req.session.isVisit){
        req.session.isVisit++;
         res.send('<p> 第'+req.session.isVisit+'次来此页面</p>');
       /!* res.render('index',{
            count:'<p> 第'+req.session.isVisit+'次来此页面</p>'
        });*!/
    }else{
        req.session.isVisit=1;
      /!*  res.render('index',{
            count:'welcome'
        })*!/
        res.send('welcome');
    }*/
});

module.exports=router;