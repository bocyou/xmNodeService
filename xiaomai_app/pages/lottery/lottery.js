// pages/lottery/lottery.js
const app = getApp();
const util = require('../../utils/util.js');
import NumberAnimate from "../../utils/number_animate";

Page({

    /**
     * 页面的初始数据
     */
    data: {
        screenInfo: {},
        word_list: [],
        user_num: '',
        tip_str: '',//错误提示
        is_disabled: true,
        is_show_bet: false,
        user_bet:[],
        issue:0,//当前期
        issue_status:-1,
        current_lucky_num:'',
        money_poor:0,//余额
        lucky_users:[],
        last_lucky_users:[],
        current_money:0,//当前池金额
        num1:0,
        num2:0,
        is_show_injection:false,
        is_inject_disabled:true,
        inject_tip_str:'',
        inject_money:0//注资金额
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {


    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        let self = this;
        util.getScreen(function (screenInfo) {
            self.setData({
                screenInfo: screenInfo
            })
        });

        util.checkPermission(function (userInfo) {
            //已登陆
           if(userInfo.towords_phone!=undefined&&userInfo.towords_phone!=null&&userInfo.towords_phone!=''){
               self.getBetIssue();
           }else{
              wx.redirectTo({
                   url: '../get_user_phone/get_user_phone'
               })
           }

       /*     let today=new Date().getDay();
            if(today==3||today==5){
                //获取本次幸运数字统计及中人员
                self.setData({
                    is_show_btn:false
                });
            }*/

        });


    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {
//
    },
    getBetUsers:function(){
        let self=this;

        util.request({
            url: util.api + '/lottery/get_users_bet', param: {issue:self.data.issue}, complete: function (res) {
                let data = res.data;
                if (data.code == 200) {
                    self.setData({
                        money_poor:data.result.length
                    });
                } else {
                }
            }
        });

    },
    getBetIssue:function(is_reload){
        let self=this;
        //获取本期详细信息
        util.request({
            url: util.api + '/lottery/get_current_term_info', param: {}, complete: function (res) {
                let data = res.data;

                if (data.code == 200) {
                    if(is_reload){
                        self.setData({
                            current_money:data.result.poor_money
                        });
                    }else{
                        self.setData({
                            issue_status:data.result.term_info.status,
                            issue:data.result.term_info.issue,
                            current_money:data.result.poor_money
                        });
                        self.getUserWord();//所有用户的背单词记录
                        self.getCurrentBet();//当前用户的本期记录

                        self.getLastLuckyUser();
                    }


            /*      if(data.result.term_info.status==1||data.result.term_info.status==2){
                      //==1开始，==2置灰按钮

                      self.getLastLuckyUser();
                  }else{
                      //开结果
                      self.setData({
                          current_lucky_num:data.result.term_info.lucky_num,
                          money_poor:parseFloat(data.result.term_info.begin_poor)+parseFloat(data.result.term_info.current_poor)
                      });
                      //有获用户获取本期中用户
                      if(data.result.term_info.is_win==1){
                          self.getCurrentLuckyUser();
                      }
                     // self.getBetUsers();// 计算本期总

                  }*/
                } else {
                }

            }
        });
    },
    getLastLuckyUser:function(){
        let self=this;

        util.request({
            url: util.api + '/lottery/get_lucky_users', param: {issue:(self.data.issue-1)}, complete: function (res) {
                let data = res.data;
                if (data.code == 200) {
                    self.setData({
                        last_lucky_users:data.result
                    });
                } else {
                }
            }
        });
    },
    getCurrentLuckyUser:function(){
        let self=this;

        util.request({
            url: util.api + '/lottery/get_lucky_users', param: {issue:self.data.issue}, complete: function (res) {
                let data = res.data;
                if (data.code == 200) {
                    self.setData({
                        lucky_users:data.result
                    });
                } else {
                }
            }
        });
    },
    getCurrentBet:function(){
        let self=this;
        util.request({
            url: util.api + '/lottery/get_user_bet', param: {issue:self.data.issue}, complete: function (res) {
                let data = res.data;
                if (data.code == 200) {
                   self.setData({
                       user_bet:data.result
                   });
                } else {
                }
            }
        });

    },
    showBet: function () {
      let self = this;
       self.setData({
            is_show_bet:true,
            user_num: '',
            tip_str: '',//错误提示
            is_disabled: true,
        });

    },
    showInjection:function(){
        let self=this;
        self.setData({
            is_show_injection:true,
            is_inject_disabled:true,
            inject_tip_str:'',
            inject_money:0
        });
    },
    hideBet:function(){
        let self=this;
        self.setData({
            is_show_bet:false
        });
    },
    hideInjection:function(){
        let self=this;
        self.setData({
            is_show_injection:false
        });
    },
    saveBet: function () {
        let self = this;
        util.request({
            url: util.api + '/lottery/save_user_bet', param: {num: self.data.user_num,issue:self.data.issue}, complete: function (res) {
                let data = res.data;
                self.setData({
                    is_show_bet:false
                });
                if (data.code == 200&&data.result==true) {

                    wx.showToast({
                        title: '预测成功',
                        icon: 'none',
                        duration: 2000
                    });
                    self.getBetIssue(true);

                } else {
                    wx.showModal({
                        title: '提示',
                        content: data.message,
                        showCancel:false,
                        success: function(res) {
                            if (res.confirm) {
                            } else if (res.cancel) {
                            }
                        }
                    })
                }
            }
        });
    },
    saveInjection:function(){
        let self=this;

        util.request({
            url: util.api + '/lottery/user_injection_money', param: {inject_money: self.data.inject_money,issue:self.data.issue}, complete: function (res) {
                let data = res.data;
                self.setData({
                    is_show_injection:false
                });
                if (data.code == 200&&data.result==true) {

                    wx.showToast({
                        title: '已成功注资',
                        icon: 'none',
                        duration: 2000
                    });
                    self.getBetIssue(true);

                } else {
                    wx.showModal({
                        title: '提示',
                        content: data.message,
                        showCancel:false,
                        success: function(res) {
                            if (res.confirm) {
                            } else if (res.cancel) {
                            }
                        }
                    })
                }
            }
        });
    },
    stop:function(){
        return false
    },
    getInjectionNum:function(val){
        let self = this;
        let num = val.detail.value;

        if(num==''){
            self.setData({
                inject_tip_str: '警告： 请输入金额',
                is_inject_disabled: true
            })
        }else{
            if(num.toString().search(/\D/ig)!=-1){
                self.setData({
                    inject_tip_str: '警告： 请输入整数',
                    is_inject_disabled: true
                })
            }else{
                if(parseInt(num)<1){
                    self.setData({
                        inject_tip_str: '警告： 1麦粒起',
                        is_inject_disabled: true
                    })
                }else{
                    self.setData({
                        inject_tip_str: '',
                        inject_money:parseInt(num),
                        is_inject_disabled: false
                    })
                }
            }
        }
    },
    getUserNum: function (val) {
        let self = this;
        let str = val.detail.value;
        if (str == '') {
            self.setData({
                tip_str: '警告： 请输入2位数',
                is_disabled: true
            })
        } else {
            if (str.length > 2) {
                self.setData({
                    tip_str: '警告： 超过2位数',
                    is_disabled: true
                })
            } else if (str.length < 2) {
                self.setData({
                    tip_str: '警告： 不足两位数',
                    is_disabled: true
                })
            } else {
                if (str.search(/\D/ig) != -1) {
                    self.setData({
                        tip_str: '警告： 请输入数字',
                        is_disabled: true
                    })
                } else {
                    //通过
                    self.setData({
                        tip_str: '',
                        user_num: str,
                        is_disabled: false
                    })
                }
            }
        }

    },
    test:function(){
        util.request({
            url: util.api + '/lottery/test', param: '', complete: function (res) {
                //获取所有用户的单词量
                var data = res.data;
                if (data.code == 200) {


                } else {

                }

            }
        });
    },
    injection:function(){
        let self=this;

    },
    getUserWord: function () {
        var self = this;

        util.request({
            url: util.api + '/lottery/get_user_words', param: '', complete: function (res) {
                //获取所有用户的单词量
                var data = res.data;
                if (data.code == 200) {

                    self.setData({word_list: data.result.sort(function(a,b){
                        return b.word-a.word;
                        })});
                    let lucky_num = 0;
                    data.result.forEach(function (item, idx) {
                        if(item.word){
                            lucky_num += parseInt(item.word);
                        }

                    });
                    if (lucky_num < 100) {
                        //如果单词总数小于100
                        lucky_num = Math.round(Math.random() * 1000);
                    }
                    let lucky_str=lucky_num.toString();
                    console.log(lucky_str);
                    let num2 = lucky_str.substr(lucky_str.length - 2, 2);
                    let num1 = lucky_str.substr(0, lucky_str.length - 2);
                    self.setData({
                        num1:num1,
                        num2:num2
                    });
                    
               /*     let width = self.data.screenInfo.windowWidth;
                    let ctx1 = wx.createCanvasContext('total-word');
                    let n2 = new NumberAnimate({
                        from: lucky_num,
                        speed: 2600,
                        decimals: 0,
                        refreshTime: 120,
                        onUpdate: () => {
                            let value = n2.tempValue.toString();
                            let num2 = value.substr(value.length - 2, 2);
                            let num1 = value.substr(0, value.length - 2);


                            ctx1.setFillStyle('#000000');
                            ctx1.setFontSize(35);
                            ctx1.setTextAlign('center');
                            ctx1.fillText(num1, Math.round(width / 2) - 46, 50);

                            ctx1.setFontSize(45);
                            ctx1.setTextAlign('center');
                            ctx1.fillText(num2, Math.round(width / 2), 50);
                            /!*
                                            let metrics1 = ctx1.measureText(n2.tempValue.toString()).width;
                                            ctx1.setFontSize(16);
                                            ctx1.fillText('个', 60 + Math.round(metrics1 / 2), 34);*!/
                            ctx1.draw();
                        },
                        onComplete: () => {

                        }
                    });*/

                } else {

                }

            }
        });
    }
})