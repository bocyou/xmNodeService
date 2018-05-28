/**
 * Created by haoguo on 17/5/31.
 */
//词库的解析入库
var express = require('express');
var router = express.Router();
var fs = require('fs');
var parseString = require('xml2js').parseString;
var xlsx = require('node-xlsx');//解析xlsx
var wordBook = require('../lib/mongoose').wordBook;
var xml = '';
var myObj = '';
router.get('/', function (req, res) {
    res.render('xmlRender');
});


router.post('/resolveXls', function (req, res, next) {
    fs.readFile('./xml/tall_ledder.xlsx', function (err, buffer) {
        if (err) {
            res.send({code: 501, result: '读取失败'});
        } else {
            var obj = xlsx.parse(buffer);
            var excelObj = obj[0].data;
            var resultAry = [];
            for (var i = 0; i < excelObj.length; i++) {
                var wordObj = {};
                wordObj.caseId = Number(excelObj[i][1]);
                wordObj.def = excelObj[i][6];
                wordObj.groupId = Number(excelObj[i][2]);
                wordObj.id = Number(excelObj[i][0]);
                wordObj.mixUpItems = excelObj[i][10];
                wordObj.posp = excelObj[i][5];
                wordObj.pron = excelObj[i][4];
                wordObj.title = excelObj[i][3];
                wordObj.tran = excelObj[i][7];
                wordObj.createTime = new Date();
                resultAry.push(wordObj);
            }
            wordBook.create(resultAry, function (error, doc) {
                if (doc) {
                    res.status(200).send( {code: 200, result: doc});
                    //console.log(doc);
                } else {
                    res.status(200).send( {code: 501, result: doc});
                }
            });
        }
    });
});


module.exports = router;