// pages/dinner/dinner.js
const { requestAuth, getScreen,checkRepeat } = require('../../utils/util.js');
const app = getApp();
var user_today_id = null;
var snow = {
  ctx: null,
  w_width: 0,
  w_height: 0,
  timer: null,
  init: function (obj) {
    var self = this;
    self.w_width = obj.w_width;
    self.w_height = obj.w_height;
    self.ctx = obj.ctx;
    self.make();
  },
  make: function () {
    var self = this;
    clearInterval(self.timer);
    var ctx = self.ctx;
    var width = 0;
    var height = 0;
    var particles = [];

    var Particle = function () {
      this.x = this.y = this.dx = this.dy = 0;
      this.reset();
    }

    Particle.prototype.reset = function () {
      this.y = Math.random() * height;
      this.x = Math.random() * width;
      this.dx = (Math.random() * 1) - 0.5;
      this.dy = (Math.random() * 0.5) + 0.5;
    }

    function createParticles(count) {
      if (count != particles.length) {
        particles = [];
        for (var i = 0; i < count; i++) {
          particles.push(new Particle());
        }
      }
      console.log(particles);
    }



    function resize() {
      width = self.w_width;
      height = self.w_height;
      createParticles((width * height) / 10000);
    }



    function updateParticles() {
      ctx.clearRect(0, 0, width, height);



      particles.forEach(function (particle) {
        particle.y += particle.dy;
        particle.x += particle.dx;

        if (particle.y > height) {
          particle.y = 0;
        }

        if (particle.x > width) {
          particle.reset();
          particle.y = 0;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 5, 0, Math.PI * 2, false);
        ctx.setFillStyle('#f6f9fa')
        ctx.fill();
      });
      ctx.draw();
      //window.requestAnimationFrame(updateParticles);
    }
    resize();
    updateParticles();
    self.timer = setInterval(function () {
      updateParticles();
    }, 24)

  }


}


Page({

  /**
   * 页面的初始数据
   */

  data: {
    screenInfo: false,
    spread: 0,//订餐时计算差价提醒 
    dinner_list: [],//订餐列表
    sum_data: '',//用于统计订餐信息 
    dinner_status: 'loading',//当前订餐状态默认loading
    have_dinner: [],//已订餐列表
    havedinner_price: 0,//已订餐的差价
    isCancel: true
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self = this;


    getScreen(function (screenInfo) {
      self.setData({
        screenInfo: screenInfo
      })
    });

    requestAuth({
      url: '/me/get_user_bill',
      tip: '获取账单信息失败',
      success: (res) => {
        if (res.length > 0) {
          wx.showModal({
            title: '来自王老师的提示',
            content: '您有尚未支付的账单，点击确定去支付后再来点餐！',
            confirmText: '去付款',
            showCancel: false,
            success: function (res) {
              wx.switchTab({
                url: '../me/me'
              })

            }
          })
        } else {
          wx.showLoading({
            title: '加载中'
          })
          self.checkDinnerStatus();
        }

      }
    });
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
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
    }

    return {
      title: ' 吃饭了',
      path: 'pages/dinner/dinner',
      imageUrl: 'https://official-web.oss-cn-beijing.aliyuncs.com/mini_program/xiaomai/dinner_share.png?v=' + Math.round(Math.random() * 100),
      success: function (res) {
        // 转发成功


      },
      fail: function (res) {
        // 转发失败
      }
    }

  },
  snow: function () {
    var self = this;
    const ctx = wx.createCanvasContext('snow');

  },
  restData: function () {
    var self = this;
    self.setData({
      havedinner_price: 0,
      spread: 0
    })
  },
  checkDinnerStatus: function () {
    const self = this;

    self.restData();
    requestAuth({
      url: '/order_food/get_dinner_list',
      tip: '获取订餐列表失败',
      complete: (res) => {
        const list_data = res;
        self.dinner_list_id=list_data.result.id;
        wx.hideLoading();
        var day = new Date().getDay();
        if (list_data.isDraw == 1 || day == 0 || day == 6) {
          //已刮卡
          if (JSON.stringify(list_data.result) == '{}') {
            //订餐尚未开始
            self.setData({
              dinner_status: "weikaishi"
            });
            snow.init({ ctx: wx.createCanvasContext('snow'), w_height: self.data.screenInfo.windowHeight, w_width: self.data.screenInfo.windowWidth });
          } else if (list_data.result.status == 'over') {
            //订餐已结束
            requestAuth({
              url: '/order_food/check_currentuser_dinner',
              tip: '检查当前用户是否订餐失败',
              params:{dinner_list_id:self.dinner_list_id},
              success: (res) => {
                 var data = res;
                 user_today_id = data.id;
                 if (JSON.stringify(data) == '{}') {
                   //未订餐
                   wx.hideLoading();
                   self.setData({
                     dinner_status: "over"
                   });
                 } else {
                   //已订餐
                   var list = JSON.parse(decodeURIComponent(data.dinner_list));
                   var price = -20;
 
                   for (var i = 0; i < list.length; i++) {
                     price += (list[i].num * list[i].list.price);
                   }
                   if (price < 0) {
                     price = 0;
                   }
                   self.setData({
                     have_dinner: list,
                     dinner_status: "yidingcan",
                     isCancel: false,
                     havedinner_price: price
                   });
                 }
              }
            });

          } else if (list_data.result.status == 'start') {
            //订餐开始
            //先判断有没有订餐
            requestAuth({
              url: '/order_food/check_currentuser_dinner',
              tip: '检查当前用户是否订餐失败',
              params:{dinner_list_id:self.dinner_list_id},
              success: (res) => {
                var data = res;
                user_today_id = data.id;
                if (JSON.stringify(data) == '{}') {
                  //未订餐
                  //显示订餐列表

                  var sum_data = {};

                  var listdata = JSON.parse(decodeURIComponent(list_data.result.list));

                  for (var i = 0; i < listdata.length; i++) {
                    var obj = 'sum' + listdata[i].id;
                    sum_data[obj] = {};
                    sum_data[obj].id = listdata[i].id;
                    sum_data[obj].num = 0;
                    sum_data[obj].price = listdata[i].price;
                  }
                  self.setData({
                    dinner_list: listdata,
                    sum_data: sum_data,
                    dinner_status: 'start'
                  })


                } else {
                  //已订餐
                  var list = JSON.parse(decodeURIComponent(data.dinner_list));
                  var price = -20;

                  for (var i = 0; i < list.length; i++) {
                    price += (list[i].num * list[i].list.price);
                  }
                  if (price < 0) {
                    price = 0;
                  }
                  self.setData({
                    have_dinner: list,
                    dinner_status: "yidingcan",
                    isCancel: true,
                    havedinner_price: price
                  });
                }
              }
            });
         
          }
        } else if (list_data.isDraw == 2) {
          //该用户不属于北京
          self.setData({
            dinner_status: "area_disabled",

          });
        } else {
          //未刮卡
          console.log('为刮卡');
          self.setData({
            dinner_status: "no_draw"
          });
        }
      }
    });

  },
  addDinner: function (e) {
    var self = this;
    var id = e.target.dataset.id;

    var sum_data = self.data.sum_data;
    sum_data['sum' + id].num++;
    self.setData({
      sum_data: sum_data
    });
    self.sumPrice();
  },
  subtractDinner: function (e) {
    var self = this;
    var id = e.target.dataset.id;

    var sum_data = self.data.sum_data;

    if (sum_data['sum' + id].num > 0) {
      sum_data['sum' + id].num--;
      self.setData({
        sum_data: sum_data
      })
      self.sumPrice();
    }

  },
  sumPrice: function () {
    var self = this;
    var data_list = self.data.sum_data;

    var spread = 0;
    for (var item in data_list) {

      spread += (data_list[item].price) * data_list[item].num;
    }
    if (spread > 20) {
      spread -= 20;
    } else {
      spread = 0;
    }
    self.setData({
      spread: spread
    })
  },
  cancelDinner: function () {
    var self = this;
    wx.showModal({
      title: '提示',
      content: '确定取消当前订餐吗？',
      success: function (res) {
        if (res.confirm) {
          requestAuth({
            url: '/order_food/cancel_currentuser_dinner',
            params: { menu_id: user_today_id },
            tip: '取消失败',
            success: (res) => {
               if(res==true){
                self.checkDinnerStatus();
               }
            }
          });
        }
      }
    })
    /* */
  },
  submit: function () {
    //点好了
    var self = this;
    var data_list = self.data.sum_data;

    var result = [];//存有用户已定餐信息
    for (var item in data_list) {
      // console.log(data_list[item]);
      if (data_list[item].num == 0) {
        //没点次菜
      } else {
        //点了
        var idx = checkRepeat(data_list[item].id, self.data.dinner_list, '', 'id');
        if (idx != -1) {

          result.push({ list: self.data.dinner_list[idx], num: data_list[item].num });
        }
      }
    }
    if (result.length > 0) {

      if (self.data.spread > 0) {
        console.log('需要补差价');
        //弹出二维码
      } else {

        console.log('不需要补差价');
      }
      //格式化img链接
      for (var i = 0; i < result.length; i++) {
        result[i].list.img = encodeURIComponent(result[i].list.img);
      }
      requestAuth({
        url: '/order_food/save_user_dinnerlist',
        tip: '订餐失败',
        params: { spread_money: self.data.spread, dinner_list: JSON.stringify(result) },
        success: (res) => {
          self.checkDinnerStatus();
        }
      });


    } else {
      wx.showToast({
        title: '您尚未点餐',
        icon: '',
        duration: 2000
      })
    }
  }
})