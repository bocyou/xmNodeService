// pages/clean_manage/clean_manage.js
const util = require('../../utils/util.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    isPost:true,
    workKind: 'taskWork',//用于确定当前的状态
    workData: '',//每种状态对应的数据
    selectList:[],
    pendingData:[],//待审核的任务
    otherData:[]//除去待审核的其它任务
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var self = this;
    var userInfo = wx.getStorageSync('userInfo');
    this.setData({
      userInfo: userInfo
    });

    util.request({
      url: 'http://localhost:3000/api/get_cleaning_list', param: '', complete: function (res) {
  
        var ary = res.data.result.cleaning_list;
        var resultAry = [];
        var other = [];
        for (var i = 0; i < ary.length; i++) {
          if (ary[i].status == 'pending') {
            resultAry.push(ary[i]);
          } else {
            other.push(ary[i]);
          }
        }
        self.setData({
          pendingData: resultAry,
          otherData: other
        });
      }
    });
    wx.request({
      url: 'http://localhost:3000/api/get_clean_list',
      method: 'POST',
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        self.setData({
          workKind: 'taskWork',
          workData: res.data.result.clean_list
        });
    
        self.selectList = res.data.result.clean_list;
        for (var i = 0; i < self.selectList.length;i++){
          self.selectList[i] = [self.selectList[i].work_id, self.selectList[i].name, self.selectList[i].money]
        };
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
  onShareAppMessage: function () {
  
  },
  postWork:function(){
    var self=this;
    
    util.request({
      url: 'http://localhost:3000/api/post_work', param: {works: self.selectList}, complete: function (res) {

      }
    });
  },
  addWork:function(){
    var self=this;

  },
  overWork:function(){
    wx.request({
      url: 'http://localhost:3000/api/finish_work',
      method: 'POST',
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
      }
    })
  },
  checkboxChange:function(e){
    var self=this;
    self.selectList = e.detail.value;
    for (var i = 0; i < self.selectList.length;i++){
      self.selectList[i] = self.selectList[i].split(',');
    }
  },
  passedClick:function(e){
    var self=this;
    var id = e.target.dataset.id;
    var status = e.target.dataset.status;
    var receiver_id = e.target.dataset.receiver_id;
    util.request({
      url: 'http://localhost:3000/api/passed_work_status', param: { work_id: id, status: status, receiver_id: receiver_id }, complete: function (res) {

        var data = res.data;

      }
    });
  }
})