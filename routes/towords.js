/**
 * Created by haoguo on 17/9/27.
 */
var express=require('express');
var router=express.Router();
var wordBook = require('../lib/mongoose').wordBook;
var userAnswer = require('../lib/mongoose').userAnswer;
router.post('/get_book_list', function (req, res, next) {
    //获取所有单词
    wordBook.find({},null,{/*limit:20*/},function(error,doc){
        if(doc){
            res.send(200,{code:200,result:doc});
        }else{
            res.send(200, {code: 501, result: doc});
        }
    })
});

router.post('/save_user_answer', function (req, res, next) {

    var answer=req.body.answer;
    userAnswer.findOne({"userId":"12"},function(error,doc){
        if(doc){
            //更新
            userAnswer.update({"userId":"12"},{"answerInfo":answer},function(error,doc){
                if(doc){
                    res.send(200,{code:200,result:{"answerInfo":answer}});
                }else{
                    res.send(200,{code:501,result:error});
                }
            })
        }else{
            //创建
            var obj={"userId":'12',"nickName":"ok","answerInfo":answer};
            userAnswer.create(obj,function(error,doc){
                if(doc){
                    res.send(200,{code:200,result:doc});
                }else{
                    res.send(200,{code:501,result:error});
                }
            });
        }
    });
    //获取所有单词

});
router.post('/get_answer_list', function (req, res, next) {
    //获取所有单词
    userAnswer.find({},null,{/*limit:20*/},function(error,doc){
        if(doc){
            res.send(200,{code:200,result:doc});
        }else{
            res.send(200, {code: 501, result: doc});
        }
    })
});
module.exports=router;