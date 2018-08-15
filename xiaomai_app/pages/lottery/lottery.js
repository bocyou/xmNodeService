// pages/lottery/lottery.js
//拓词娱乐活动
const util = require('../../utils/util.js');
let socket_timer=null;

Page({
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
        inject_money:0,//注资金额
        is_yan:0
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.createSocket();


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

        util.request({
            url: util.api + '/api/get_user_info', param: {}, complete: function (res) {
                let data = res.data;
               // console.log(data);
                if (data.code == 200) {

                    if(data.result.towords_phone==''||data.result.towords_phone==null){
                        //没有绑定手机号
                        wx.redirectTo({
                            url: '../get_user_phone/get_user_phone'
                        })
                    }else{
                        self.getBetIssue();
                    }

                    if(data.result.user_id==48){
                        self.setData({
                            is_yan:1
                        })
                    }
                } else {
                    wx.showToast({
                        title: '获取用户信息失败',
                        icon: 'none',
                        duration: 2000
                    });
                }
            }
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
        wx.closeSocket();
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
    createSocket:function(){
        const self=this;
        //创建链接
 /*       wx.connectSocket({
            url: 'ws://localhost:8081'
        })*/
        wx.connectSocket({
            url: 'wss://xiaomai.towords.com/wss',
            data:{},
            header:{
                'content-type': 'application/json'
            },
            protocols: ['protocol1'],
            method:"GET",
            complete:function(res){
               // console.log(res);
            }
        })

        wx.onSocketOpen(function (res) {
            //监听WebSocket连接打开事件
           // console.log('WebSocket连接已打开！');
            let num=0;
            wx.sendSocketMessage({
                data:'user_words',
            });
            clearInterval(socket_timer);
            socket_timer=setInterval(function(){
                wx.sendSocketMessage({
                    data:'user_words',
                })
            },2000);


        })

        wx.onSocketMessage(function (res) {
            //监听WebSocket接受到服务器的消息事件
            //console.log(res);

            let data=JSON.parse(res.data);

            if(data.code==200){
                self.setData({word_list: data.result.sort(function(a,b){
                        return b.word-a.word;
                    }).filter(function(item,idx){
                        return item.word>0;
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
                let num2 = lucky_str.substr(lucky_str.length - 2, 2);
                let num1 = lucky_str.substr(0, lucky_str.length - 2);
                self.setData({
                    num1:num1,
                    num2:num2
                });
            }
        })

        wx.onSocketClose(function (res) {
            //监听关闭事件
            clearInterval(socket_timer);
            //console.log('WebSocket连接已关闭！')
        })
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
                        //只更新奖金池
                        self.setData({
                            current_money:data.result.poor_money
                        });
                        self.getCurrentBet();//当前用户的本期记录
                    }else{
                        self.setData({
                            issue_status:data.result.term_info.status,
                            issue:data.result.term_info.issue,
                            current_money:data.result.poor_money
                        });
                        self.getCurrentBet();//当前用户的本期记录

                        self.getLastLuckyUser();
                    }


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
        //保存用户预测信息
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
        //保存用户注资信息
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

    }
})