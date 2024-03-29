const {
  format,
  oneHourAgo,
} = require("../../service/date")

// components/activity-comp/activity-com.js
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
    activities: [{
      name: "AD药剂"
    }, {
      name: "洗澡澡"
    }, {
      name: "游泳"
    },{
      name: "剪指甲"
    },{
      name: "听儿歌"
    },{
      name: "做排气操"
    }],
    activity: "",
    selectIndex: -1,

    startTime: oneHourAgo(),
    startTimeFormat: format(oneHourAgo()),
    endTime: Date.now(),
    endTimeFormat: format(Date.now()),

    content: "",
    imgSrc: "",
  },

  lifetimes: {
    attached() {
      let record = this.data.record;
      let confirmText = (record.recordId ? "修改" : "保存")
      this.setData({
        startTime: oneHourAgo(),
        endTime: Date.now(),
        ...record,
        confirmText,
      })
    },
  },


  observers: {
    'startTime': function (data) {
      this.setData({
        startTimeFormat: format(data),
      })
    },
    'endTime': function (data) {
      this.setData({
        endTimeFormat: format(data),
      })
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    bindreset() {
      this.triggerEvent('cancel')
    },
    bindsubmit(e) {
      if (this.data.selectIndex === -1) {
        wx.showToast({
          title: '未选中活动',
          icon: "none"
        })
        return
      }

      if (this.data.endTime < this.data.startTime) {
        wx.showToast({
          title: '结束时间小于开始时间',
          icon: "none"
        })
        return
      }

      this.triggerEvent('submit', {
        ...this.data,

        activity: this.data.activities[this.data.selectIndex],
        date: format(this.data.endTime, 'YYYY-MM-DD'),
        time: format(this.data.endTime, "HH:mm"),
      })
    },

    onChange(e) {
      let index = e.detail.index;
      let data = e.detail.data;
      this.setData({
        selectIndex: index,
        activity: data,
      })
    },
    onItemsChanged(e) {
      let data = e.detail;
      this.setData({
        activities: data,
      })
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
  }
})