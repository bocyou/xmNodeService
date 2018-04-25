/**
 * Created by haoguo on 17/9/27.
 */
var express=require('express');
var router=express.Router();
var request = require('request');
router.get('/',function(req,res){
    res.render('test',{title:''});

});

router.post('/upload', function (req, res, next) {

  console.log(req.body);

/*    request.post({url:'https://api.weixin.qq.com/cgi-bin/media/upload?access_token=9_ZvaS8m-4eF-lnO_52nL6XBhoEwWeR5UxDXNoesleSHlhcutlh9gcCzqaMVdwLnjnIhiq9Nvx219nb_Lz2o02GWGVOkhRJbOXqHAgLcnSMjhAvz-GDtL9mY51IeZvt2SkDdsfW2na4EqbsIG1VEYfAJAENH&type=image',
        form:JSON.stringify({media:req.body.file})}, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log(body);
            console.log(1);
            if (!error && response.statusCode == 200) {
                console.log('发送成功');
                res.status(200).send('success');
            }
        }
    })*/

});
module.exports=router;