//index.js
//获取应用实例
const app = getApp();
const {getScreen} = require('../../utils/util.js');


Page({
  data: {
    screenInfo:false,
      version:-1,
      resultFlag: -1, // -1--刚进入此页面,没有查询; 0--没有查到相关内容; 1--有相关内容
      word: '',  //单词 或者 词组
      wordPron: '',  //音标

      searchType: '', //搜索内容的类型,单词 or 词组
      senseInfo: []  //义项列表
  },
    onShareAppMessage: function () {
//
    },

  onLoad: function () {
    const self=this;
    getScreen(function(screenInfo){
      self.setData({
        screenInfo: screenInfo
      })
    });
    console.log(app.version_status);
    if(app.version_status){
        self.setData({
            version:app.version_status
        });
    }else{
       app.versionStatus=res=>{
        self.setData({
            version:res
        });
       }
    }


  },
    searchWord:function(e){
        var value = e.detail.value;
        var self=this;
        wx.showLoading({
            title: '小麦查词中……'
        })
        wx.request({
            url: 'https://wx.towords.com/wordshero/search_word.do',
            method: 'POST',
            data: {word:value},
            header: {
                'content-type': 'application/x-www-form-urlencoded' // 默认值

            },

            complete:function(res){
                console.log(res);
                wx.hideLoading();
                if (res.data.code == 200 && res.data.result) {
                    var dataRes = res.data.result
                    wx.setStorageSync('word', value);
                    var wordInfoList = []
                    if (dataRes.entryList && dataRes.entryList.length > 0) {
                        wordInfoList = dataRes.entryList
                    } else if (dataRes.phvbList && dataRes.phvbList.length > 0) {
                        wordInfoList = dataRes.phvbList
                    } else {
                        wordInfoList = []
                    }

                    if (wordInfoList.length < 1) { //没有搜索到内容
                        self.setData({
                            resultFlag: 0
                        })
                    } else { //有内容

                        var tmpWord = wordInfoList[0].phvb || wordInfoList[0].word  //单词  or  词组

                        var tmpPron = wordInfoList[0].pron || ''  //音标

                        var tmpMpWord = tmpWord.toLowerCase().trim().replace(/\s+/ig, ' ').replace(/[\s|-]/ig, '_');
                        var tmpMp = 'https://audio.towords.com/sound/' + tmpMpWord + '.mp3' //音频地址

                        var tmpSenseInfo = [] //义项集合

                        wordInfoList.forEach(function (item, idx) {

                            if (item.senseInfoList && item.senseInfoList.length > 0) {
                                tmpSenseInfo = tmpSenseInfo.concat(item.senseInfoList)
                            } else {
                                tmpSenseInfo.push(item)
                            }

                        })

                        self.setData({
                            resultFlag: 1,
                            word: tmpWord,  //单词
                            wordPron: tmpPron,  //音标
                            wordMp: tmpMp,  //音频地址
                            senseInfo: tmpSenseInfo  //义项列表
                        })
                    }

                }

            }
        })
    }

  
})
