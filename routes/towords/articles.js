const express = require('express');
const request = require('request');
const router = express.Router();
const mysql = require('../../lib/mysql');
const session = require('express-session');
const checkSession = require('../../middlewares/check_session').checkSession;
const crypto = require('crypto');
const tool = require('../../middlewares/tool');
const getUserInfo = tool.getUserInfo;
const getCurrentSession = tool.getCurrentSession;
const Joi = require('joi');


router.get('/', function (req, res) {
    res.render('api', {title: ''});

});

router.post('/add_article', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");

    try {
        const data = req.body;
        let def = {
            share_info: JSON.stringify({}),
            topic_info: JSON.stringify({}),
            create_time: new Date()
        };
        const params = Object.assign(def, data);
        if (params.content_html && params.page_title && params.page_des) {
            mysql.insert_one('towords_article', params, function (result, err) {
                if (err) {
                    res.status(200).send({code: 500, result: false, message: "添加失败"})
                } else {
                    res.status(200).send({code: 200, result: true, message: "添加成功"})
                }
            });
        } else {
            res.status(200).send({code: 500, result: {}, massage: '参数错误'})
        }

    } catch (e) {
        res.status(200).send({code: 500, result: {}, massage: e})
    }
});

router.post('/get_article_list', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    try {
        mysql.sql('select * from towords_article', function (err, result) {

            if (err) {
                res.status(200).send({code: 500, result: [], message: "获取列表失败"})
            } else {
                res.status(200).send({code: 200, result: result, message: "获取列表成功"})
            }
        });
    } catch (e) {
        res.status(200).send({code: 500, result: {}, massage: e})
    }

});

router.post('/find_article', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");

    try {
        const id = req.body.id;
        if (id) {
            mysql.find_one('towords_article', 'id', [id], function (result, err) {
                if (err) {
                    console.log(err);

                    res.status(200).send({code: 500, result: {}, massage: '获取文章失败'})

                } else {
                    let data = result[0];

                    res.status(200).send({code: 200, result: data, massage: '获取文章成功'})
                }

            });
        } else {
            res.status(200).send({code: 500, result: {}, massage: '参数错误'})
        }

    } catch (e) {
        res.status(200).send({code: 500, result: {}, massage: e})
    }

});


router.post('/update_article', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
   // const article_info =req.body;
    const article_info =req.body;

    const schema = Joi.object().keys({
        id: Joi.required()
    });
    Joi.validate({id: article_info.id}, schema, function (err, value) {
        if (err) {
            res.json({result: false, message: err.details[0].message, code: 400});
        } else {
            const params_keys = ['content_html','md','page_title','page_des','share_info','topic_info'];
            let params_obj={};
            params_keys.forEach((item,idx)=>{
                if(article_info[item]){
                    params_obj[item]=article_info[item]
                }

             });
            mysql.updateOne('towords_article', article_info.id,params_obj,(error,result,fields)=>{
                console.log(error);
                if(error){
                    res.json({result: false, message: `error:${error}`, code: 500});
                }else{
                    res.json({result: true, message: `success:更新文章内容`, code: 200});
                }
            });

           /* mysql.sql(`update towords_article set ${params_ary.join(',')},update_time="${new Date().Format('yy-MM-dd HH:mm:ss')}" WHERE id=${article_info.id}`, function (err, result) {
                if (err) {

                    res.json({result: false, message: `error:${err}`, code: 500});
                } else {
                    res.json({result: true, message: `success:更新文章内容`, code: 200});
                }
            })*/
        }

    });

});


router.post('/delete_article', function (req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    const id = req.body.id;

    const schema = Joi.object().keys({
        id: Joi.required()
    });
    Joi.validate({id: id}, schema, function (err, value) {
        if (err) {
            res.json({result: false, message: err.details[0].message, code: 400});
        } else {

            mysql.sql(`DELETE FROM towords_article WHERE id=${id}`, (err, result) => {
                if (err) {
                    res.status(200).send({
                        code: 500,
                        result: false,
                        message: '删除失败'
                    })
                } else {
                    res.status(200).send({
                        code: 200,
                        result: true,
                        message: '删除成功'
                    })

                }
            });
        }

    });

});

module.exports = router;