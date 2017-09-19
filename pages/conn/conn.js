/**
 * 连接设备。获取数据
 */
Page({
  data: {
    deviceId: '',
    name: '',
    serviceId: '',
    services: [],
    charId: '',
    chars: [],
    writeResponseFlag: false,
    feedback: 'Waiting for Command',
    buttonStatus: 'Send Unlock Command',
    buttonState: false
  },

  // start of onLoad 
  onLoad: function (opt) {
    var that = this;
    //console.log("connectui page onLoad");
    //console.log('deviceId=' + opt.deviceId);
    //console.log('name=' + opt.name);
    that.setData({ deviceId: opt.deviceId, name: opt.name });

    /**
     * 监听设备的连接状态
     */
    wx.onBLEConnectionStateChanged(function (res) {
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
    })

    /**
     * 连接设备
     */
    wx.createBLEConnection({
      deviceId: that.data.deviceId,
      success: function (res) {
        // success
        // console.log(res);
        /**
         * 连接成功，后开始获取设备的服务列表
         */
        wx.getBLEDeviceServices({
          deviceId: that.data.deviceId,
          success: function (res) {

            console.log('---get-device-services---');
            that.setData({ services: res.services });
            console.log('device services:', res.services)

            that.setData({ serviceId: that.data.services[0].uuid });
            console.log('device serviceId:', that.data.services[0].uuid);
            /**
             * 延迟3秒，根据服务UUID获取特征 
             */
            setTimeout(function () {
              wx.getBLEDeviceCharacteristics({
                deviceId: that.data.deviceId,
                serviceId: that.data.serviceId,

                success: function (res) {

                  console.log('---get-device-characteristics---');
                  that.setData({ chars: res.characteristics });
                  console.log('device chars:', res.characteristics);

                  that.setData({ charId: that.data.chars[0].uuid });
                  console.log('device charId:', that.data.charId);

                  /**
                   * 使能设备特征值的notification
                   */
                  wx.notifyBLECharacteristicValueChanged({
                    deviceId: that.data.deviceId,
                    serviceId: that.data.serviceId,
                    characteristicId: that.data.charId,
                    state: true,
                    success: function (res) {
                      // success
                      console.log('---enable-notification---');                      
                      console.log('notification enabled', res);
                    },
                    fail: function (res) {
                      // fail
                    },
                    complete: function (res) {
                      // complete
                    }
                  })

                  /**
                   * 设备发过来的数据
                   */
                  wx.onBLECharacteristicValueChange(function (res) {

                    var statusFeedback = that.hex2buf(res.value);

                    if (that.data.writeResponseFlag == true) {
                      console.log('---write-response-notification-received---');
                      that.setData({ writeResponseFlag: false });
                    }else {
                      console.log('---status-feedback-received---');
                      that.setData({ feedback: 'Bike Locked' });
                      that.setData({ buttonStatus: 'Send Unlock Command'})
                      that.setData({ buttonState: false })                      
                      console.log('charId is:', res.characteristicId, 'status code is :', statusFeedback);
                    }
                  })
                },
                fail: function (res) {
                  //console.log(res);
                }
              })
            }, 1000);
          }
        })
      },
      fail: function (res) {
        // fail
      },
      complete: function (res) {
        // complete
      }
    })
  }, // end of onLoad

  /**
   * 发送数据到设备中
   */
  bindViewTap: function () {
    console.log('---push-button-to-send-command---'); 
    
    var that = this;
    that.setData({buttonStatus: 'Wait Locked Status'})
    that.setData({ buttonState: true })    
    var charString = '0000000001'
    var typedArray = new Uint8Array(charString.match(/[\da-f]{2}/gi).map(function (h) {
      return parseInt(h, 16)
    }))
    console.log('---convert-text-to-typed-array---'); 
    console.log('typed array is:', typedArray);

    console.log('---convert-typed-array-to-hex---');
    var arrayBuffer = typedArray.buffer
    //console.log('array buffer is:', arrayBuffer);

    console.log('---send-unlock-command---'); 
    // disable write response notification
    that.setData({ writeResponseFlag: true });

    wx.writeBLECharacteristicValue({
      deviceId: that.data.deviceId,
      serviceId: that.data.serviceId,
      characteristicId: that.data.charId,
      value: arrayBuffer,
      success: function (res) {
        // success
        that.setData({ feedback: 'Bike in Riding' });
        console.log("sent unlock command success");
      },
      fail: function (res) {
        // fail
        //console.log(res);
      },
      complete: function (res) {
        // complete
      }
    })
  },

  hex2buf: function (hex) {
    return Array.prototype.map.call(new Uint8Array(hex), x => ('00' + x.toString(16)).slice(-2)).join('');
  }
})