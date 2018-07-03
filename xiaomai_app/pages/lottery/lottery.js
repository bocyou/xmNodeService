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
        money_poor:0,//奖金池余额
        lucky_users:[]
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
           console.log(userInfo);
           if(userInfo.towords_phone!=undefined&&userInfo.towords_phone!=null&&userInfo.towords_phone!=''){
               self.getBetIssue();
           }else{
             /*  wx.redirectTo({
                   url: '../get_user_phone/get_user_phone'
               })*/
           }

       /*     let today=new Date().getDay();
            if(today==3||today==5){
                //获取本次幸运数字统计及中奖人员
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
   //押注时，奖金池=本期所有用户的押注金额+上期遗留，
        //开奖时=bet——issue
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
    getBetIssue:function(){
        let self=this;
        //获取本期详细信息
        util.request({
            url: util.api + '/lottery/get_bet_issue', param: {}, complete: function (res) {
                let data = res.data;

                if (data.code == 200) {
                    console.log(data);

                    self.setData({
                        issue_status:data.result.status,
                        issue:data.result.issue
                    });
                    self.getCurrentBet();//当前用户的本期押注记录

                  if(data.result.status==1){
                      //开始押注
                      self.getUserWord();//所有用户的背单词记录

                  }else{
                      //开奖结果
                      self.setData({
                          current_lucky_num:data.result.lucky_num,
                          money_poor:parseFloat(data.result.begin_poor)+parseFloat(data.result.current_poor)
                      });
                      //有获奖用户获取本期中奖用户
                      if(data.result.is_win==1){
                          self.getCurrentLuckyUser();
                      }
                     // self.getBetUsers();// 计算本期总金额

                  }
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
    hideBet:function(){
        let self=this;
        self.setData({
            is_show_bet:false
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
                        title: '押注成功',
                        icon: 'none',
                        duration: 2000
                    });
                    self.getCurrentBet();

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
    getUserWord: function () {
        var self = this;

        util.request({
            url: util.api + '/lottery/get_user_words', param: '', complete: function (res) {
                //获取所有用户的单词量
                var data = res.data;
                if (data.code == 200) {

                    self.setData({word_list: data.result});
                    let lucky_num = 0;
                    data.result.forEach(function (item, idx) {
                        lucky_num += parseInt(item.word);
                    });
                    if (lucky_num < 100) {
                        //如果单词总数小于100
                        lucky_num = Math.round(Math.random() * 1000);
                    }
                    let width = self.data.screenInfo.windowWidth;
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
                            /*
                                            let metrics1 = ctx1.measureText(n2.tempValue.toString()).width;
                                            ctx1.setFontSize(16);
                                            ctx1.fillText('个', 60 + Math.round(metrics1 / 2), 34);*/
                            ctx1.draw();
                        },
                        onComplete: () => {

                        }
                    });

                } else {

                }

            }
        });
    }
})