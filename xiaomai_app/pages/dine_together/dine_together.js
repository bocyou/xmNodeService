// pages/pay/pay.js
import NumberAnimate from "../../utils/number_animate";

const {customDate,ws_api,requestAuth} = require('../../utils/util.js');

Page({

    /**
     * 页面的初始数据
     */
    data: {
        user_pay: 0,
        err_tip:'',
        user_dinner_list:[],
        all_money:0,
        show_pay:false

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.error=0;
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
       // wx.closeSocket();
    },
    showBet(){
        const self=this;
        self.setData({
            show_pay:true,
            user_pay: 0,
            err_tip:''
        });
    },
    hidePay(){
        const self=this;
        self.setData({
            show_pay:false
        });
    },
    disabled(){
        return false;
    },
    createSocket: function () {
        const self = this;
        //创建链接
        /*       wx.connectSocket({
                   url: 'ws://localhost:8081'
               })*/
        let userInfo = wx.getStorageSync('userInfo');
        self.session=userInfo.session;
        if(userInfo){
            self.socket=wx.connectSocket({
                url: ws_api,
                data: {},
                header: {
                    'content-type': 'application/json',
                    'sessionkey': userInfo.session,
                },
                protocols: ['protocol1'],
                method: "GET",
                complete: function (res) {
                }
            })
            self.socket.onError(res=>{
                self.error=1;
                self.postGetInfo();
             
            })
            wx.onSocketOpen(function (res) {
                //监听WebSocket连接打开事件
                wx.sendSocketMessage({
                    data: JSON.stringify({type:'dinner_together_info'})
                });
           


            })

            wx.onSocketMessage(function (res) {
                //监听WebSocket接受到服务器的消息事件

                let data = JSON.parse(res.data);
                switch (data.type) {
                    case 'pay':
                        wx.showToast({
                            title:data.message,
                            icon:'success'
                        });
                        break;
                    case 'dinner_info':
                     self.render_info(data.result);
                        break;
                }

            })

            wx.onSocketClose(function (res) {
                //监听关闭事件

            })
        }

    },
    postGetInfo(){
        const self=this;
        requestAuth({
            url: '/dinner_together/get_term_info',
            tip: '获取用户信息失败',
            success: (res) => {
               self.render_info(res);
            }
          });
    },
    render_info(data){
        const self=this;
        let all_money=0;
        const info=data.map(function (item, idx) {
            item.create_time = customDate(item.create_time);
            all_money+=item.money;
            return item
        })
        self.setData({
            user_dinner_list:info.sort((a,b)=>{
                return new Date(b.create_time).getTime()-new Date(a.create_time).getTime()
            })

        });
       let n =new NumberAnimate({
            from: all_money,
            speed: 1000,
            decimals: 0,
            refreshTime: 100,
            onUpdate: () => {
              self.setData({
                  all_money:n.tempValue
              });
            },
            onComplete: () => {

            }
        });
    },

    getUserPay(e) {
        this.setData({
            user_pay: e.detail.value
        });
    },
    pay() {
        const self = this;

        if(self.data.user_pay==''||self.data.user_pay<=0){
            self.setData({err_tip:'请输入大于0的数字'});
        }else{
            if((/\d/ig).test(self.data.user_pay)){
                let money=parseInt(self.data.user_pay);
                self.setData({err_tip:''});
                wx.showModal({
                    title: '支付提示',
                    content: '您将支付'+money+'元',
                    success: function(res) {
                        if (res.confirm) {
                            if(self.error===0){
                                wx.sendSocketMessage({
                                    data: JSON.stringify({
                                        type:'dinner_together_pay',
                                        session:self.session,
                                        money:money
                                    })
                                });
                            }else{
                                requestAuth({
                                    url: '/dinner_together/save_user_pay',
                                    tip: '付款失败',
                                    params:{money:money},
                                    success: (res) => {
                                       self.postGetInfo();
                                    }
                                  });
                            }
                         
                        } else if (res.cancel) {
                        }
                        self.setData({
                            show_pay:false
                        });
                    }
                })
            }else{
                self.setData({err_tip:'请输入整数'})
            }
        }



    }
})