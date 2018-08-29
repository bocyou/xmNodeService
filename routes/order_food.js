/**
 * Created by haoguo on 17/10/16.
 */
var express = require('express');
var request = require('request');
var router = express.Router();
var mysql = require('../lib/mysql');
var session = require('express-session');
var checkSession = require('../middlewares/check_session').checkSession;
var tool = require('../middlewares/tool');
var getUserInfo = tool.getUserInfo;
var getCurrentSession = tool.getCurrentSession;
var formidable = require('formidable');
var path=require('path');
var OSS = require('ali-oss');
var co = require('co');
var fs = require('fs');
var client = new OSS({
    region: 'oss-cn-beijing',
    accessKeyId: 'gaJAG7YTRG6GPJEC',
    accessKeySecret: 'cAwPb0ZxOBNFrqOF55m7nN5UCHvaK2',
    bucket: 'official-web'
});

router.get('/', function(req, res) {
  res.render('api', {
    title: ''
  });

});

//管理部分

//添加菜单
router.post('/add_dinner', checkSession, function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  //获取今日状态为1的所有订餐信息

  var req_data=req.body;
  //种类名字，数字，价格，图片，菜名  name,price,kind,img,merchant
  var add_dinner = {
    name: req_data.name,
    price: req_data.price,
    kind: req_data.kind,
    img: req_data.img,
    merchant: req_data.merchant,
    create_time: new Date()
  }
  try {
    mysql.insert_one('order_food', add_dinner, function(result, err) {
      if (result) {
        res.status(200).send({
          code: 200,
          result: true,
          message: '添加成功'
        })


      } else {
        res.status(200).send({
          code: 200,
          result: false,
          message: '分发失败'
        })
      }
    });

  } catch (err) {
    res.status(200).send({
      code: 504,
      result: false,
      message: err
    })

  }





});


router.post('/upload_dinner_img', checkSession, function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    //获取今日状态为1的所有订餐信息
    var img_type='upload_img';

    var form = new formidable.IncomingForm();   //创建上传表单
    form.encoding = 'utf-8';		//设置编辑
    // form.uploadDir = 'public' + AVATAR_UPLOAD_FOLDER;	 //设置上传目录
    form.keepExtensions = true;	 //保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;   //文件大小
    form.multiples = true;

    form.parse(req, function(err, fields, file) {
        var filePath = '';

        //如果提交文件的form中将上传文件的input名设置为tmpFile，就从tmpFile中取上传文件。否则取for in循环第一个上传的文件。
        if(file.tmpFile){
            filePath = file.tmpFile.path;
        } else {
            for(var key in file){

                if( file[key].path && filePath==='' ){
                    filePath = file[key].path;
                    break;
                }
            }
        }

        //文件移动的目录文件夹，不存在时创建目标文件夹
        var targetDir = path.join(__dirname,'../public/img', img_type);
        if (!fs.existsSync(targetDir)) {
            fs.mkdir(targetDir);
        }

        var fileExt = filePath.substring(filePath.lastIndexOf('.'));
        //判断文件类型是否允许上传
        if (('.jpg.jpeg.png.gif').indexOf(fileExt.toLowerCase()) === -1) {
            var err = new Error('此文件类型不允许上传');
            res.status(200).send({code:200,result:'',message:'此文件类型不允许上传'})
        } else {
            //以当前时间戳对上传文件进行重命名
            var fileName = new Date().getTime() + fileExt;
            var targetFile = path.join(targetDir, fileName);
            //移动文件
            fs.rename(filePath, targetFile, function (err) {
                if (err) {
                    console.info(err);
                    res.status(200).send({code:200,result:'',message:'操作失败'});

                } else {
                    //上传成功，返回文件的相对路径
                    var fileUrl = './public/img/'+img_type+'/' +fileName;
                    co(function* () {
                       // client.useBucket('official-web')
                        var result = yield client.put('mini_program/xiaomai/menu/'+fileName, fileUrl);
                     /*   var result = yield client.list({
                            'max-keys': 5
                        });*/
                        console.log(result);
                        res.status(200).send({code:200,result:result.url.replace(/http:/ig,''),message:'上传成功'});
                        fs.unlinkSync(fileUrl);
                    }).catch(function (err) {
                        console.log(err);
                        res.status(200).send({code:500,message:err});
                    });

                }
            });
        }

    });


});



router.post('/get_dinner_num', checkSession, function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  //获取今日状态为1的所有订餐信息

  //种类名字，数字，价格，图片，菜名  name,price,kind,img,merchant

  try {
    mysql.sql('select * from order_food', function(err, result) {
      if (result) {
        var ary = result;
        var sort_ary = [];
        ary.sort(function(a,b){
          return a.kind-b.kind
        });
        for (var i = 0; i < ary.length;) {
          var count = 0;
          for (var j = i; j < ary.length; j++) {

            if (ary[i].kind == ary[j].kind) {
              count++;
            }
          }

          sort_ary.push({
            name: ary[i].kind,
            num: count
          });
          i += count;
        }
        res.status(200).send({
          code: 200,
          result: sort_ary.length,
          message: '获取成功'
        })



      } else {
        res.status(200).send({
          code: 500,
          result: null,
          message: '获取失败'
        })
      }
    });

  } catch (err) {
    res.status(200).send({
      code: 500,
      result: false,
      message: err
    })

  }





});

//获取今日有效订餐列表
router.post('/get_today_dinner', checkSession, function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  //获取今日状态为1的所有订餐信息


  mysql.sql('SELECT * FROM order_food_user tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE status="1" AND to_days(create_time) = to_days(now())', function(err, result) {

    if (result && result.length > 0) {
      //统计订餐信息
      var dinner_all_list = [];
      result.map(function(item, idx) {
        var dinner_list = {};
        item.dinner_list = JSON.parse(decodeURIComponent(item.dinner_list));
        dinner_list.food_list = item.dinner_list;
        var sum_price = 0;
        dinner_all_list = dinner_all_list.concat(dinner_list.food_list);
        dinner_list.food_list.forEach(function(item2, idx2) {
          sum_price += (item2.list.price * item2.num);
        });
        dinner_list.sum_price = sum_price;
        item.dinner_list = dinner_list;
      });


      var statis_all_list = [];
      dinner_all_list.sort(function(a, b) {
        return a.list.id - b.list.id;
      });


      for (var i = 0; i < dinner_all_list.length;) {
        var repeat_num = 0; //此菜重复的次数用于统计
        var sum_num = 0; //此菜总数量
        for (var j = i; j < dinner_all_list.length; j++) {

          if (dinner_all_list[i].list.id == dinner_all_list[j].list.id) {

            sum_num += dinner_all_list[j].num;
            repeat_num++;

          }
        }

        statis_all_list.push({
          info: dinner_all_list[i].list,
          repeat_num: repeat_num,
          sum_num: sum_num
        });
        i += repeat_num; //比较之后从不同的项后再次开始比较

      }


      res.status(200).send({
        code: 200,
        result: {
          list_all: statis_all_list,
          list_info: result
        },
        message: '获取今日所有订餐人员信息成功'
      });
    } else {
      res.status(200).send({
        code: 200,
        result: {},
        message: '尚无订餐信息'
      });
    }

  })



});

//获取所有菜单order_food
router.post('/all_dinner_list', checkSession, function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");


  mysql.search(req, res, next, 'order_food', function(rows, fields) {
    if (fields) {

      //list1:[],list2[]
      rows.sort(function(a, b) {
        return a.kind - b.kind;
      });
      var resultObj = {};
      var titleAry = [];
      for (var i = 0; i < rows.length;) {
        var count = 0;
        var name = rows[i].kind;
        var merchant = rows[i].merchant;
        var barAry = [];
        for (var j = i; j < rows.length; j++) {
          if (rows[i].kind == rows[j].kind) {
            count++;
            barAry.push(rows[j]);
          }
        }
        titleAry.push({
          key: name,
          name: merchant
        });
        resultObj[name] = barAry;
        resultObj.sum = count;
        i += count;
      }
      mysql.findToday('order_fooding', 'status="start"', function(result, err) {
        if (result && result.length > 0) {
          res.status(200).send({
            code: 200,
            result: {
              "list": rows,
              sort_list: resultObj,
              title_ary: titleAry,
              is_start: 1
            },
            message: '获取所有菜单成功!已经开启订餐'
          })
        } else {
          res.status(200).send({
            code: 200,
            result: {
              "list": rows,
              sort_list: resultObj,
              title_ary: titleAry,
              is_start: 0
            },
            message: '获取所有菜单成功！尚未开启订餐'
          })
        }
      });


    } else {
      res.status(200).send({
        code: 200,
        result: {},
        message: '获取所有菜单信息失败'
      })
    }

  });

});



//给北京地区的用户发送提醒

var postNews = {
  access_token: null,
  getAccessToken: function() {
    var self = this;
    request('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxff898caf09a11846&secret=6f8b1e6559774ab25c0e6ec3b5b1ee26', function(err, response, body) {
      if (err) {
        console.log('获取失败ass');
        // res.status(200).send( {code: 200, result: '获取openid失败'});
      } else {

        self.access_token = JSON.parse(body).access_token;
        self.postMessage();




      }
    });
  },
  postMessage: function() {
    var self = this;
    mysql.sql('SELECT open_id,user_name,user_id,formid,tab1.id FROM user_formid tab1 JOIN users tab2 ON tab1.user_id = tab2.id WHERE status=1 AND area="bj"', function(err, result) {
      console.log(err);
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

        res.forEach(function(item, idx) {
          request.post({
            url: 'https://api.weixin.qq.com/cgi-bin/message/wxopen/template/send?access_token=' + self.access_token,
            form: JSON.stringify({
              "touser": item.open_id,
              "template_id": "0oZ02MXqYUtOJjOee4UF8OJiorTThYFg1WHNyRluwPA",
              "page": "pages/dinner/dinner",
              "form_id": item.form_id[0],
              "data": {
                "keyword1": {
                  "value": new Date().Format('yyyy年MM月dd日 HH:mm'),
                  "color": "#173177"
                },
                "keyword2": {
                  "value": "嗨！" + item.user_name + " 订餐开始了！抓紧时间订餐！不要错过了！",
                  "color": "#173177"
                }
              },
              "emphasis_keyword": "keyword2.value"
            })
          }, function(error, response, body) {
            if (!error && response.statusCode == 200) {


              if (JSON.parse(body).errcode == 0) {
                console.log(item.user_name + ' 发送成功');
                mysql.sql('update user_formid set status=0 where formid="' + item.form_id[0] + '"', function(err, result) {

                  if (err) {
                    console.log('重置formid失败');
                    console.log(err)
                  } else {


                  }
                });
              } else {
                console.log(error);
              }

            }
          })
        })


      } else {
        console.log('获取用户formid失败');
      }

    })

  }
}
router.post('/test_message', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  //手动发送订餐消息
  postNews.getAccessToken();

});




//分发菜单,开启订餐
//同时发送模版消息
router.post('/start_dinner', checkSession, function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  var list_obj = req.body;
  list_obj.create_time = new Date();
  list_obj.status = "start";


  mysql.insert_one('order_fooding', list_obj, function(result, err) {
    if (result) {
      res.status(200).send({
        code: 200,
        result: true,
        message: '分发成功'
      })
      postNews.getAccessToken();

    } else {
      res.status(200).send({
        code: 200,
        result: false,
        message: '分发失败'
      })
    }
  });

});

router.post('/start_dinner_new', checkSession, function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    var list_obj = {};
    list_obj.create_time = new Date();
    list_obj.status = "start";
    var list=JSON.parse(req.body.list).map(function(item,idx){
        item.img=encodeURIComponent(item.img);
        return item;
    });
    list_obj.list=JSON.stringify(list);


    mysql.insert_one('order_fooding', list_obj, function(result, err) {
        if (result) {
            res.status(200).send({
                code: 200,
                result: true,
                message: '分发成功'
            })
            postNews.getAccessToken();

        } else {
            res.status(200).send({
                code: 200,
                result: false,
                message: '分发失败'
            })
        }
    });

});



//结束订餐//更改status为over
router.post('/finish_dinner', checkSession, function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");

  mysql.updateData('order_fooding', 'status="start"', 'status="over",over_time="' + new Date().Format('yy-MM-dd HH:mm:ss') + '"', function(result, err) {
    if (result) {
      res.status(200).send({
        code: 200,
        result: true,
        message: '结束订餐成功'
      });
    } else {
      res.status(200).send({
        code: 501,
        result: err.sqlMessage,
        message: '结束订餐失败'
      });
    }
  })


});


//获取分发的菜单 order_fooding  同时检查用户是否刮卡
router.post('/get_dinner_list', function(req, res, next) {

    var day=new Date().getDay();

  getCurrentSession(req,res, function(user_info) {
    if (user_info && user_info.length > 0) {
      var user_id = user_info[0].user_id;
      if (user_info[0].area == 'bj') {
        //检查用户是否刮卡(除周末)
          if(day==0||day==6){
              mysql.findMaxTime('order_fooding', 'create_time', function(result, err) {
                  if (result && result.length > 0) {
                      res.status(200).send({
                          code: 200,
                          result: result[0],
                          isDraw: 1,
                          message: '获取订餐列表成功！该用户已刮卡'
                      });
                  } else {
                      res.status(200).send({
                          code: 200,
                          result: {},
                          isDraw: 1,
                          message: '订餐尚未开始'
                      });
                  }
              });
          }else{
              mysql.findToday('lucky_user_list', 'user_id="' + user_id + '"', function(result, err) {
                  if (result && result.length > 0) {
                      //获取当天最新的一条菜单
                      mysql.findMaxTime('order_fooding', 'create_time', function(result, err) {
                          if (result && result.length > 0) {
                              res.status(200).send({
                                  code: 200,
                                  result: result[0],
                                  isDraw: 1,
                                  message: '获取订餐列表成功！该用户已刮卡'
                              });
                          } else {
                              res.status(200).send({
                                  code: 200,
                                  result: {},
                                  isDraw: 1,
                                  message: '订餐尚未开始'
                              });
                          }
                      });

                  } else {
                      res.status(200).send({
                          code: 200,
                          result: {},
                          isDraw: 0,
                          message: "该用户未刮奖"
                      })
                  }
              })
          }

      } else {
        res.status(200).send({
          code: 200,
          result: {},
          isDraw: 2,
          message: "该用户不属于北京校区"
        })
      }

    }

  }, res);


});



//保存用客户订餐信息order_food_user
router.post('/save_user_dinnerlist', function(req, res, next) {
  getUserInfo(req,res, function(userInfo) {
    if (userInfo) {
      var dinner_list = req.body.dinner_list;
      var spread_money = req.body.spread_money;

      mysql.sql('SELECT * FROM order_food_user WHERE to_days(create_time) = to_days(now()) AND status = 1 AND user_id=' + userInfo[0].id, function(err, result) {
        if (err) {
          res.status(200).send({
            code: 500,
            result: false,
            message: '获取您的订餐信息失败'
          });
        } else {
          if (result.length == 0) {
            mysql.insert_one('order_food_user', {
              user_id: userInfo[0].id,
              dinner_list: dinner_list,
              create_time: new Date(),
              status: 1,
              spread_money: spread_money
            }, function(result, err) {
              if (result) {
                res.status(200).send({
                  code: 200,
                  result: true,
                  message: '订餐成功'
                })
              } else {
                res.status(200).send({
                  code: 500,
                  result: false,
                  message: '订餐失败!可退出重试'
                })
              }
            });
          } else {
            res.status(200).send({
              code: 500,
              result: [],
              message: '您已订餐！请勿重复点击'
            });
          }
        }
      });
    } else {
      res.status(200).send({
        code: 500,
        result: [],
        message: '获取该用户信息失败'
      });
    }
  });

});

//检查用户是否订餐根据ID查找(查找当日该用户当天最新的记录)
router.post('/check_currentuser_dinner', function(req, res, next) {
  getUserInfo(req,res, function(userInfo) {

    if (userInfo) {
      var user_id = userInfo[0].id;
      mysql.sql('SELECT * FROM order_food_user WHERE to_days(create_time) = to_days(now()) AND status=1 And user_id=' + user_id, function(err, result) {
        if (err == null) {
          if (result.length > 0) {
            res.status(200).send({
              code: 200,
              result: result[0],
              message: '获取订餐列表成功！'
            });
          } else {
            res.status(200).send({
              code: 200,
              result: {},
              message: '订餐尚未开始'
            });
          }
        } else {
          res.status(200).send({
            code: 200,
            result: [],
            message: '获取该用户信息失败'
          });
        }
      })
      /*   mysql.findMaxTimeCondition('order_food_user', 'create_time', 'status=1 AND to_days(create_time) = to_days(now()) AND user_id=' + user_id, function (result, err) {
             console.log(result);
             if (result.length > 0) {
                 res.status(200).send( {code: 200, result: result[0], message: '获取订餐列表成功！'});
             } else {
                 res.status(200).send( {code: 200, result: {}, message: '订餐尚未开始'});
             }
         });*/

    } else {
      res.status(200).send({
        code: 200,
        result: [],
        message: '获取该用户信息失败'
      });
    }
  });
});


//取消该用户订餐
router.post('/cancel_currentuser_dinner', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  getUserInfo(req,res,function(userInfo) {
    if (userInfo) {
      var user_id = userInfo[0].id;
      var menu_id = req.body.menu_id;
      mysql.updateData('order_food_user', 'id="' + menu_id + '"', 'status="0"', function(result, err) {
        if (result) {
          res.status(200).send({
            code: 200,
            result: true,
            message: '取消订餐成功'
          });
        } else {
          res.status(200).send({
            code: 200,
            result: false,
            message: '取消订餐失败'
          });
        }
      })

    } else {
      res.status(200).send({
        code: 200,
        result: [],
        message: '获取该用户信息失败'
      });
    }
  });
});




module.exports = router;
