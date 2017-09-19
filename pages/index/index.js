//index.js

//获取应用实例
var app = getApp()

Page({

  data: {
    userInfo: {},
    device_buffer: {},
    scanning: false,
    device_list: [],
    tipinfo: ''
  },

  // start of onLoad
  onLoad: function () {

    var that = this

    app.getUserInfo(function(userInfo){
      that.setData({userInfo:userInfo})
    })

    that.resetBLE_Devices();
    console.log('------------------------------')
    console.log('clear BLE device list')

  },//end of onLoad

  // start of onShow
  onShow: function() {

    var that = this

    wx.onBluetoothAdapterStateChange(function (res) {
      console.log("BLE state changed, now is", res)
    })

    wx.onBluetoothDeviceFound(function (res) {
      console.log('------------------------------')
      console.log('find new BLE device')
      //console.log(JSON.stringify(res))

      // on Andriod: 'res' is an object with one device
      if (app.getPlatform() == "android") {
        console.log('platform is android')
        that.updateBLE_Devices(res)
      }

      // on iOS: 'res' is an object with a key "devices", who is an array
      else if (app.getPlatform() == "ios") {
        console.log('platform is ios')
        for (var i in res["devices"])
        { that.updateBLE_Devices(res["devices"][i]) }
      }

      // on Mac devtools: 'res' is an array
      else if (app.getPlatform() == "devtools") {
        console.log('------------------------------')
        console.log('platform is devtools')
        //for (var i in res["devices"])
        //{
          console.log('---callback-founded-device---') 
          var device_array = res["devices"][0]
          console.log(device_array)
          var device = device_array[0]
          that.updateBLE_Devices(device) 
        //}
      }

      //sort for UI display
      var dev_list = []

      for (var k in that.data.device_buffer) {
        dev_list.push(that.data.device_buffer[k])
        //console.log('--------------------------')
        //console.log(dev_list)
      }

      dev_list.sort(function (a, b) {
        if (a["name"] > b["name"]) return 1
        if (a["name"] < b["name"]) return -1
        return 0
      })

      that.setData({ device_list: dev_list })
      console.log('---latest-device-list---')
      console.log(dev_list)
    }) 
  }, // end of onShow

  // // start of onUnload
  // onUnload: function () {
  //   var that = this
  //   this.toggleBLE_Scan(turnOn=false)
  // }, // end of onUnload

  resetBLE_Devices: function () {

    for (var k in this.data.device_buffer) delete this.data.device_buffer[k];

    this.setData({
      device_list: []
    })
  },

  scanBLE: function() {
    var that = this
    that.toggleBLE_Scan()
  },

  toggleBLE_Scan: function(option) {

    var that = this

    if (option == null) {
      that.data.scanning ? turnOffBLE_Scan() : turnOnBLE_Scan()
    } else {
      option ? turnOnBLE_Scan() : turnOffBLE_Scan()
    }

    function turnOnBLE_Scan() {

      wx.openBluetoothAdapter({
        success: function (res) {
          console.log("open ble adapter : success", res)
          startDiscovering()
        },
        fail: function (res) {
          //console.log("open ble adapter : fail", res)
          that.setData({ tipinfo: res["errMsg"] })
        }
      })

      function startDiscovering() {
        wx.startBluetoothDevicesDiscovery({
          success: function (res) { 
            //console.log("start ble scan : success : ", res)

            that.setData({scanning:true, tipinfo:''})
          },
          fail: function (res) { 
            //console.log("start ble scan : fai l: ", res)
            that.setData({tipinfo:res["errMsg"]})
          }
        })
      }
    }

    function turnOffBLE_Scan() {      
      wx.stopBluetoothDevicesDiscovery({
        success: function (res) {
          console.log("---stop-ble-scan---")

          // wx.closeBluetoothAdapter({
          //   success: function (res) {
          //     //console.log("close ble adapter : success:", res)
          //     that.setData({ scanning: false, tipinfo: '' })
          //   },
          //   fail: function (res) {
          //     //console.log("close ble adapter : fail:", res)
          //     that.setData({ tipinfo: res["errMsg"] })
          //   }
          // })
        },
        fail: function (res) { 
          //console.log("stop ble scan : fail : ", res)
          that.setData({tipinfo:res["errMsg"]})
        }
      })
    }
  },

  updateBLE_Devices: function (dev) {

    var ble_dev = this.data.device_buffer
    var devId = dev["deviceId"]
    console.log('---start-updating-device-list---')
    console.log(devId)    

    // find new devices
    if (!ble_dev[devId]) {
      // create a new device object in ble_dev
      ble_dev[devId] = {}

      ble_dev[devId]["deviceId"] = dev["deviceId"]
      ble_dev[devId]["name"] = dev["name"]
      ble_dev[devId]["RSSI"] = dev["RSSI"]
      ble_dev[devId]["advertisData"] = dev["advertisData"]

      ble_dev[devId]["counter"] = 1
    } 
    else {
      ble_dev[devId]["counter"] += 1
      //console.log("--- device existing", ble_dev[devId]["counter"])
      console.log("---device already in the list---")      
    }

    ble_dev[devId]["timestamp"] = Date.now()

    //console.log(ble_dev)

    this.setData({device_buffer:ble_dev})
  },

  connectBLE: function(e){

    var that = this;

    that.toggleBLE_Scan(false);

    var title = e.currentTarget.dataset.title;
    var name = e.currentTarget.dataset.name;

    wx.redirectTo({
      url: '../conn/conn?deviceId=' + title + '&name=' + name,
      success: function (res) {
        // success
        console.log("---connect-to-target-device---")
      },
      fail: function (res) {
        // fail
      },
      complete: function (res) {
        // complete
      }
    })    
  }
})
