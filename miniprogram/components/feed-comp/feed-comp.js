const {
  format,
  differFormat,
  parseTime
} = require("../../service/date")
let leftIntervalId;
let rightIntervalId;

// components/feed-comp/feed-comp.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    record: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

    dateTime: Date.now(),
    dateTimeFormat: format(Date.now()),

    leftTime: 0,
    rightTime: 0,

    leftTimeFormat: "00:00:00",
    rightTimeFormat: "00:00:00",

    totalTimeFormat: "00:00:00",

    imgSrc: '',
    content: "",
    //容量
    volume: "",

    feedType: "breast_feed_by_self",
    feedTitle: "母乳亲喂",

    leftBreastFeeding: false,
    rightBreastFeeding: false,
    lock: false,
    needUpdateEndTime: false
  },

  observers: {

    'dateTime': function (data) {
      this.setData({
        dateTimeFormat: format(data),
      })
    },

    'leftTime': function (data) {
      this.setData({
        leftTimeFormat: differFormat(data, true),
        totalTimeFormat: differFormat(data + this.data.rightTime, true)
      })
    },
    'rightTime': function (data) {
      this.setData({
        rightTimeFormat: differFormat(data, true),
        totalTimeFormat: differFormat(this.data.leftTime + data, true)
      })
    },


    "volume": function (data) {
      if (data && isNaN(data)) {
        wx.showToast({
          title: '容量输入不合法',
          icon: 'none'
        })
      }
    }
  },

  lifetimes: {
    created() {},
    attached() {
      let record = this.data.record;
      let confirmText = record.recordId ? "修改" : "保存"
      let lock = record.recordId ? true : false;
      this.setData({
        dateTime: Date.now(),
        ...record,
        lock,
        confirmText,
      })

      //是否需要更新到结束时间
      let needUpdateEndTime = wx.getStorageSync('needUpdateEndTime')
      if (!needUpdateEndTime) {
        needUpdateEndTime = false;
      }
      this.setData({
        needUpdateEndTime,
      })

      //恢复计时器状态
      if (this.data.leftBreastFeeding) {
        let diff = Date.now() - this.data.lastTime;
        if (diff > 0) {
          this.setData({
            leftTime: (this.data.leftTime + diff)
          })
        }
        this.startLeftInterval()
      }

      //恢复计时器状态
      if (this.data.rightBreastFeeding) {
        let diff = Date.now() - this.data.lastTime;
        if (diff > 0) {
          this.setData({
            rightTime: (this.data.rightTime + diff)
          })
        }
        this.startRightInterval()
      }
    },
    detached() {
      console.log('detached')
      this.clearTimer();
      this.setData({
        leftBreastFeeding: false
      })
      this.setData({
        rightBreastFeeding: false
      })
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    bindInputLeftTime(data){
      this.data.leftTime=parseTime(data.detail.value);
      if (this.data.leftTime>=0) {
        this.setData({
          totalTimeFormat:differFormat(this.data.leftTime + this.data.rightTime, true)
        })
      }
    },
    bindInputRightTime(data){
      this.data.rightTime=parseTime(data.detail.value);
      if (this.data.rightTime>=0) {
        this.setData({
          totalTimeFormat:differFormat(this.data.leftTime + this.data.rightTime, true)
        })
      }
    },

    oCheckBoxChange(e) {
      let value = e.detail.value;
      wx.setStorageSync("needUpdateEndTime", value)
    },

    bindreset() {
      this.clearTimer()
      this.triggerEvent('cancel')
    },
    bindsubmit(e) {
      //表单数据
      let volume = e.detail.value.volume;
      let content = e.detail.value.content;

      //亲喂的情况下需要校验时长
      if (this.data.feedType == 'breast_feed_by_self') {
        let totalTime = this.data.leftTime + this.data.rightTime;
        if (totalTime == 0 && !this.data.leftBreastFeeding && !this.data.rightBreastFeeding) {
          wx.showToast({
            title: '未点击开始',
            icon: "none"
          })
          return
        }
      } else if (!volume || isNaN(volume)) {
        //瓶喂的情况下需要校验容量
        wx.showToast({
          title: '容量输入不合法',
          icon: "none"
        })
        return
      } else if (volume == 0) {
        wx.showToast({
          title: '容量不能为空',
          icon: "none"
        })
        return
      }
      let now = Date.now();
      let item = {
        ...this.data,
        //重要
        lastTime: now, //记录保存的时间

        date: format(this.data.dateTime, 'YYYY-MM-DD'),
        time: format(this.data.dateTime, 'HH:mm'),

        volume,
        content,
      }

      this.triggerEvent('submit', {
        ...item
      })
    },
    onChange(e) {
      let name = e.detail.name;
      let title = e.detail.title;

      this.setData({
        feedType: name,
        feedTitle: title
      })
    },

    //点击左边
    countLeft() {
      let feeding = !this.data.leftBreastFeeding;
      this.setData({
        leftBreastFeeding: feeding
      })
      if (feeding) {
        this.startLeftInterval()
      } else {
        clearInterval(leftIntervalId);
        //更新到结束时间
        this.updateToEndTime();
      }
    },

    //点击右边
    countRight() {
      let feeding = !this.data.rightBreastFeeding;
      this.setData({
        rightBreastFeeding: feeding
      })
      if (feeding) {
        this.startRightInterval()
      } else {
        clearInterval(rightIntervalId);
        this.updateToEndTime();
      }
    },
    //更新到结束时间
    updateToEndTime() {
      if (this.data.needUpdateEndTime) {
        this.setData({
          dateTime: Date.now(),
        })
      }
    },
    //左定时器
    startLeftInterval() {
      leftIntervalId = setInterval(() => {
        this.setData({
          leftTime: this.data.leftTime + 1000,
        })
      }, 1000)
    },

    //右定时器
    startRightInterval() {
      rightIntervalId = setInterval(() => {
        this.setData({
          rightTime: this.data.rightTime + 1000,
        })
      }, 1000);
    },

    selectImg() {
      // 让用户选择一张图片
      wx.chooseImage({
        count: 1,
        success: chooseResult => {
          this.setData({
            imgSrc: chooseResult.tempFilePaths[0]
          });
        },
        fail: res => {
          console.log(res.errMsg);
        }
      });
    },

    //清空定时器
    clearTimer() {
      if (leftIntervalId) {
        clearInterval(leftIntervalId)
      }
      if (rightIntervalId) {
        clearInterval(rightIntervalId)
      }
    }
  }
})