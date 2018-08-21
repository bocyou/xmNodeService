var express=require('express');
var router=express.Router();
var request = require('request');
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
router.get('/',function(req,res){
    res.render('table',{title:''});

});
router.post('/upload_table_js', function(req, res, next) {

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
        if (('.js').indexOf(fileExt.toLowerCase()) === -1) {
            var err = new Error('此文件类型不允许上传');
            res.status(200).send({code:200,result:'',message:'此文件类型不允许上传'})
        } else {
            //以当前时间戳对上传文件进行重命名
            var fileName = 'tennis_data' + fileExt;
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
                        var result = yield client.put('mini_program/xiaomai/table_data/'+fileName, fileUrl);
                        /*   var result = yield client.list({
                               'max-keys': 5
                           });*/

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

module.exports=router;