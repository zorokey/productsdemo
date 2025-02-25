sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "productsdemo/util/ExcelExportUtil",
  "sap/m/MessageBox",
  "sap/m/Dialog",
  "sap/m/Button"
], function (Controller,
  JSONModel,
  MessageToast,
  ExcelExportUtil,
  MessageBox, Dialog, Button) {
  "use strict";

  return Controller.extend("productsdemo.controller.ProductList", {

    onInit: function () {


      // 注册路由
      this.getRouter().getRoute("productList").attachPatternMatched(this._onPatternMatched, this);

      // 更好的做法是在视图的声明式设置中添加itemPress事件，
      // 但如果还想在代码中添加，可以这样做：
      var oSmartTable = this.byId("productsSmartTable");
      oSmartTable.attachInitialise(function () {
        var oTable = oSmartTable.getTable();
        oTable.setMode("SingleSelectMaster");

        // 确保移除任何现有的事件处理程序，避免重复添加
        oTable.detachItemPress(this.onProductItemPress, this);
        oTable.attachItemPress(this.onProductItemPress, this);
      }.bind(this));


    },

    onAfterRendering: function () {
      // this._initMap();
    },

    onShowMap: function () {
      // 检查是否已经有地图对话框
      if (!this._mapDialog) {
        // 创建对话框
        this._mapDialog = new Dialog({
          title: "地图",
          contentWidth: "80%",
          contentHeight: "80%",
          content: [
            // 创建一个 HTML 容器用于地图
            new sap.ui.core.HTML({
              content: "<div id='map' style='width:100%; height:400px; background-color:#eee;'></div>"

            })
          ],
          beginButton: new Button({
            text: "关闭",
            press: function () {
              this._mapDialog.close();
            }.bind(this)
          }),
          afterOpen: function () {
            // 对话框打开后初始化地图
            this._initMap();
          }.bind(this),
          afterClose: function () {
            // 可选：清理地图资源
            if (this._map) {
              this._map.setTarget(null);
              this._map = null;
            }
          }.bind(this)
        });

        // 将对话框添加到视图
        this.getView().addDependent(this._mapDialog);
      }

      // 打开对话框
      this._mapDialog.open();
    },

    _initMap: function () {
      // 检查 OpenLayers 是否已加载
      if (typeof ol === 'undefined') {
        console.error("OpenLayers library is not loaded.");
        return;
      }

      //this is the source of the points
      var vectorSource = new ol.source.Vector({
        url: function () {
          return (
            //WFS URL with Basic Parameters
            'https://portal.csdi.gov.hk/server/services/common/landsd_rcd_1648571595120_89752/MapServer/WFSServer?' + 'service=wfs' +
            '&version=2.0.0' + '&request=GetFeature'
            //Find Feature typename from GetCapabilities
            + '&typename=GEO_PLACE_NAME' + '&outputFormat=GeoJSON' + '&srsname=EPSG:4326'
            //Filter on Extent
            + '&bbox=22.262474243164064,114.1035038986206,22.32152575683594,114.25302095794677' + '&count=100'
          );
        },
        //Use relative format class of outputFormat
        format: new ol.format.GeoJSON(),
      });

      //custom styling
      var pointStyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 4,
          fill: new ol.style.Fill({
            color: 'red'
          })
        })
      });

      //Put Vector Source and styling as a Layer
      var vectorLayer = new ol.layer.Vector({
        source: vectorSource,
        style: pointStyle
      });

      //Config layers for Map
      var layers = [
        //Base Map Layer of OSM, api.hkmapservice.gov.hk
        new ol.layer.Tile({
          source: new ol.source.XYZ({
            url: 'https://mapapi.geodata.gov.hk/gs/api/v1.0.0/xyz/basemap/wgs84/{z}/{x}/{y}.png'
          })
        }),
        //Dataset Layer of WFS
        vectorLayer
      ];

      // 创建地图实例并保存引用
      this._map = new ol.Map({
        //Assign Map Area with the Layers
        layers: layers,
        target: 'map', // 使用 ID 而不是 DOM 元素
        //Setting starting view of Map
        view: new ol.View({
          projection: 'EPSG:4326',
          center: [114.180000000, 22.292000000],
          maxZoom: 19,
          zoom: 13,
          dragAndDrop: false,
        }),
      });
    },


    _onPatternMatched: function () {
      // Reset any selections when returning to the list
      var oSmartTable = this.byId("productsSmartTable");
      if (oSmartTable.getTable()) {
        oSmartTable.getTable().removeSelections(true);
      }
    },


    onProductItemPress: function (oEvent) {
      // 使用更可靠的方法获取选中项
      var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
      var oContext = oItem.getBindingContext();

      // 添加日志，帮助调试
      console.log("Product selected:", oContext.getPath());

      var productId = oContext.getProperty("ProductID");

      // 导航到详情页面
      this.getRouter().navTo("productDetail", {
        productId: productId
      });
    },

    onAddProductButtonPress: function () {
      MessageToast.show("Add new product functionality would be implemented here");
    },

    onExportWithVBA: function () {
      try {
        // 创建导出工具实例
        var oExcelExport = new ExcelExportUtil();

        // 获取Smart控件
        var oSmartList = this.byId("productsSmartTable");

        if (!oSmartList) {
          MessageBox.error("找不到Smart List控件");
          return;
        }

        // 执行导出
        oExcelExport.exportToExcel(oSmartList, "产品列表.xlsm", '');

      } catch (oError) {
        MessageBox.error("导出过程中发生错误: " + oError.message);
        jQuery.sap.log.error("导出Excel失败", oError);
      }
    },

    // // 在你的SMART Table控制器中添加导出按钮处理函数
    // onExportWithVBA: function () {
    //   var that = this;

    //   // 获取表格数据
    //   var oTable = this.byId("productsSmartTable").getTable();
    //   var oBinding = oTable.getBinding("rows") || oTable.getBinding("items");
    //   var aData = [];

    //   if (oBinding) {
    //     var oModel = oBinding.getModel();
    //     var oContext = oBinding.getContexts();

    //     // 从绑定上下文中获取数据
    //     if (oContext && oContext.length > 0) {
    //       aData = oContext.map(function (context) {
    //         return context.getObject();
    //       });
    //     }
    //   }

    //   if (aData.length === 0) {
    //     MessageToast.show("没有可导出的数据");
    //     return;
    //   }

    //   // 使用模块中定义的getXLSX方法
    //   XLSXModule.getXLSX().then(function (XLSX) {
    //     try {
    //       // 创建工作表
    //       var worksheet = XLSX.utils.json_to_sheet(aData);

    //       // 创建工作簿
    //       var workbook = XLSX.utils.book_new();
    //       XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    //       // 添加VBA宏代码
    //       if (!workbook.vbaraw) workbook.vbaraw = "";

    //       var vbaCode = 'Attribute VB_Name = "Module1"\r\n' +
    //         'Sub AutoFormat()\r\n' +
    //         '    Cells.Select\r\n' +
    //         '    Cells.EntireColumn.AutoFit\r\n' +
    //         '    Range("A1").Select\r\n' +
    //         'End Sub\r\n';

    //       workbook.vbaraw = vbaCode;

    //       // 导出文件
    //       var sFileName = "ExportWithVBA.xlsm";
    //       XLSX.writeFile(workbook, sFileName);

    //       MessageToast.show("导出成功");
    //     } catch (e) {
    //       MessageBox.error("导出处理异常: " + e.message);
    //       jQuery.sap.log.error("导出处理异常", e);
    //     }
    //   }).catch(function (err) {
    //     MessageBox.error("无法加载XLSX库: " + err.message);
    //     jQuery.sap.log.error("无法加载XLSX库", err);
    //   });
    // },


    getRouter: function () {
      return this.getOwnerComponent().getRouter();
    }
  });
});