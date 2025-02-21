sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/odata/v2/ODataModel"
], function (Controller, JSONModel, Filter, FilterOperator, ODataModel) {
  "use strict";

  return Controller.extend("productsdemo.controller.ProductDetail", {
      onInit: function () {
          // 设置OData模型
          var oDataModel = new ODataModel("https://services.odata.org/V2/Northwind/Northwind.svc/");
          this.getView().setModel(oDataModel);
          
          


          // 获取路由参数
          var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
          oRouter.getRoute("ProductDetail").attachPatternMatched(this._onPatternMatched, this);
          
          // 初始化类别树模型
          this._initCategoryTreeModel();
      },
      
      _onPatternMatched: function (oEvent) {
          var sProductId = oEvent.getParameter("arguments").productId;
          this._loadProductDetails(sProductId);
      },
      
      _loadProductDetails: function (sProductId) {
          var oSmartForm = this.getView().byId("productForm");
          var sPath = "/Products(" + sProductId + ")";
          
          // 绑定SmartForm数据
          oSmartForm.bindElement({
              path: sPath,
              events: {
                  dataReceived: function(oData) {
                      var oProduct = oData.getParameter("data");
                      if (oProduct) {
                          this._highlightCategoryInTree(oProduct.CategoryID);
                      }
                  }.bind(this)
              }
          });
      },
      
      _initCategoryTreeModel: function () {
          var that = this;
          var oTreeTable = this.getView().byId("categoryTree");
          
          // 加载所有类别
          this.getView().getModel().read("/Categories", {
              success: function(oData) {
                  // 处理类别数据，构建层次结构
                  var aCategoryData = oData.results;
                  var oCategoryTreeModel = new JSONModel();
                  
                  // 创建根类别和子类别结构
                  var aRootCategories = aCategoryData.filter(function(oCategory) {
                      return !oCategory.ParentCategoryID;
                  });
                  
                  // 递归构建类别树
                  function buildCategoryTree(oCategory) {
                      var oTreeNode = Object.assign({}, oCategory);
                      
                      // 查找子类别
                      var aChildren = aCategoryData.filter(function(oChild) {
                          return oChild.ParentCategoryID === oCategory.CategoryID;
                      });
                      
                      if (aChildren.length > 0) {
                          oTreeNode.children = aChildren.map(buildCategoryTree);
                      }
                      
                      return oTreeNode;
                  }
                  
                  var aCategoryTree = aRootCategories.map(buildCategoryTree);
                  
                  // 设置树模型
                  oCategoryTreeModel.setData({
                      Categories: aCategoryTree
                  });
                  
                  oTreeTable.setModel(oCategoryTreeModel);
                  oTreeTable.bindRows("/Categories");
              },
              error: function(oError) {
                  // 错误处理
                  jQuery.sap.log.error("加载类别数据失败", oError);
              }
          });
      },
      
      _highlightCategoryInTree: function (sCategoryId) {
          var oTreeTable = this.getView().byId("categoryTree");
          
          // 先展开所有节点以确保可以找到目标类别
          oTreeTable.expandToLevel(99);
          
          // 查找并选择特定类别
          this.getView().getModel().read("/Categories(" + sCategoryId + ")", {
              success: function(oData) {
                  // 查找类别在树中的索引
                  var aRows = oTreeTable.getRows();
                  for (var i = 0; i < aRows.length; i++) {
                      var oContext = aRows[i].getBindingContext();
                      if (oContext && oContext.getObject() && 
                          oContext.getObject().CategoryID === oData.CategoryID) {
                          // 选择该行
                          oTreeTable.setSelectedIndex(i);
                          oTreeTable.setFirstVisibleRow(Math.max(0, i - 2));
                          break;
                      }
                  }
              },
              error: function(oError) {
                  jQuery.sap.log.error("查找类别失败", oError);
              }
          });
      },
      
      onNavBack: function () {
          window.history.go(-1);
      }
  });
});