/**
 * Created by haoguo on 17/5/31.
 */
var config = require('config-lite');
var mongoose = require('mongoose');
mongoose.connect(config.mongodb);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    /*  var collinsSchema = mongoose.Schema({
     name: String
     })*/
    //一次打开记录
});

//用户表
var userSchema = new mongoose.Schema({
    nickName: {type: 'string'},//昵称
    email: {type: 'string'},
    userId: {type: 'string'},//用户名
    passWord: {type: 'string'},
    createTime: 'string'
});
exports.user = mongoose.model('user', userSchema);


//获取单词
var wordBookSchema = new mongoose.Schema({
    caseId: Number,
    createTime: Date,
    def: String,
    groupId: Number,
    id: Number,
    mixUpItems: String,
    posp: String,
    pron: String,
    title: String,
    tran: String
});

exports.wordBook = mongoose.model('wordBook',wordBookSchema);

//用户记录
var userAnswerSchema=new mongoose.Schema({
    userId:String,
    nickName:String,
    answerInfo:Number
});
exports.userAnswer = mongoose.model('userAnswer',userAnswerSchema);