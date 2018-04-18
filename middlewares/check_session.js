/**
 * Created by haoguo on 17/6/5.
 */
//后台登陆session检查
module.exports = {
    checkSession: function checkLogin(req, res, next) {
       // next();
        if(req.session.user){
            next();
        }else{
           //res.redirect('http://localhost:4200/login');
            res.send(200,{code:502,result:null,massage:'session异常'});
        }

     /*  if(!req.session.user){
           console.log();
           res.redirect('/signin');
           res.send(302);
           next();
       }else{
           res.send(302,{massage:'session异常'});

       }*/
      /*  if (!req.session.user) {
            //未登录跳转到登录页面
            res.redirect('http://www.baidu.com');
            res.send(302);
            return next();
        }
        next();*/
        //res.redirect('http://google.com');
    },
    checkAppSession:function(req, res, next){

        if(req.headers.sessionkey){
            next();
        }else{
            //res.redirect('http://localhost:4200/login');
            res.send(200,{code:502,result:null,massage:'session异常'});
        }
    }
};