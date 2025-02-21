sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "productsdemo/util/ExcelExportUtil",
  "sap/m/MessageBox"
], function (Controller,
  JSONModel,
  MessageToast,
  ExcelExportUtil,
  MessageBox) {
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