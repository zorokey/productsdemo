sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, JSONModel, Filter, FilterOperator, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("productsdemo.controller.ProductDetail", {
    onInit: function () {
      // 创建本地视图模型
      var oLocalModel = new JSONModel({
        busy: false,
        editMode: false,
        categoryTree: [],
        selectedCategory: {},
        relatedProducts: []
      });
      this.getView().setModel(oLocalModel, "local");

      // 注册路由
      this.getRouter().getRoute("productDetail").attachPatternMatched(this._onProductMatched, this);
    },

    _onProductMatched: function (oEvent) {
      var sProductId = oEvent.getParameter("arguments").productId;
      
      // 设置视图为busy状态
      this.getView().getModel("local").setProperty("/busy", true);
      
      // 重置编辑模式
      this.getView().getModel("local").setProperty("/editMode", false);
      
      // 绑定产品数据
      this._bindProductData(sProductId);
    },

    _bindProductData: function (sProductId) {
      var that = this;
      var sPath = "/Products(" + sProductId + ")";
      
      // 绑定SmartForm到产品路径
      var oSmartForm = this.byId("productDetailPage");
      
      // 清除现有绑定
      if (oSmartForm.getBindingContext()) {
        oSmartForm.unbindElement();
      }
      
      // 创建新绑定
      oSmartForm.bindElement({
        path: sPath,
        events: {
          dataReceived: function (oData) {
            // 当数据加载完成时
            that.getView().getModel("local").setProperty("/busy", false);
            
            if (oData.getParameter("data")) {
              var oProduct = oData.getParameter("data");
              // 加载产品类别
              that._loadCategoryData(oProduct.CategoryID);
              // 加载相关产品（同类别产品）
              that._loadRelatedProducts(oProduct.CategoryID, oProduct.ProductID);
            } else {
              // 处理产品未找到的情况
              MessageBox.error(that.getResourceBundle().getText("productNotFound"), {
                onClose: function () {
                  that.onNavBack();
                }
              });
            }
          },
          dataRequested: function () {
            that.getView().getModel("local").setProperty("/busy", true);
          }
        }
      });
    },

    _loadCategoryData: function (sCategoryId) {
      var that = this;
      var oModel = this.getView().getModel();
      
      // 读取当前产品的类别
      oModel.read("/Categories(" + sCategoryId + ")", {
        success: function (oCategory) {
          // 设置选中的类别
          that.getView().getModel("local").setProperty("/selectedCategory", oCategory);
          
          // 构建类别层次结构
          that._buildCategoryTree(oCategory);
        },
        error: function () {
          MessageToast.show(that.getResourceBundle().getText("categoryLoadError"));
        }
      });
    },

    _buildCategoryTree: function (oCurrentCategory) {
      var that = this;
      var oModel = this.getView().getModel();
      
      // 读取所有类别
      oModel.read("/Categories", {
        success: function (oData) {
          var aCategories = oData.results;
          var aCategoryTree = [];
          
          // 简单显示，因为Northwind数据库中Categories没有层次关系字段
          // 这里我们只显示当前类别
          aCategoryTree.push({
            CategoryID: oCurrentCategory.CategoryID,
            CategoryName: oCurrentCategory.CategoryName,
            Description: oCurrentCategory.Description,
            hierarchyLevel: 0,
            drillState: "leaf"
          });
          
          // 设置类别树
          that.getView().getModel("local").setProperty("/categoryTree", aCategoryTree);
          
          // 如果API支持类别层次结构，我们可以在这里构建完整的树
          // 以下是示例代码，但由于Northwind没有这样的结构，所以这只是演示
          /*
          // 假设有parentCategoryID属性
          if (aCategories.some(function(c) { return c.ParentCategoryID; })) {
            // 查找顶级类别
            var aRootCategories = aCategories.filter(function(c) {
              return !c.ParentCategoryID;
            });
            
            // 递归构建树
            function buildTree(category, level) {
              var treeNode = {
                CategoryID: category.CategoryID,
                CategoryName: category.CategoryName,
                Description: category.Description,
                hierarchyLevel: level,
                drillState: "collapsed"
              };
              
              // 查找子类别
              var children = aCategories.filter(function(c) {
                return c.ParentCategoryID === category.CategoryID;
              });
              
              if (children.length > 0) {
                treeNode.children = children.map(function(child) {
                  return buildTree(child, level + 1);
                });
              } else {
                treeNode.drillState = "leaf";
              }
              
              return treeNode;
            }
            
            aCategoryTree = aRootCategories.map(function(root) {
              return buildTree(root, 0);
            });
            
            // 找到并展开当前产品所属的类别路径
            that._expandCategoryPath(aCategoryTree, oCurrentCategory.CategoryID);
          }
          */
        },
        error: function () {
          MessageToast.show(that.getResourceBundle().getText("categoriesLoadError"));
        }
      });
    },
    
    /* 
    // 如果API支持类别层次结构，可以使用此方法展开路径
    _expandCategoryPath: function(aCategoryTree, targetCategoryId) {
      // 递归查找和展开目标类别的路径
      function findAndExpand(nodes, targetId, path) {
        for (var i = 0; i < nodes.length; i++) {
          var node = nodes[i];
          var currentPath = path.concat(node);
          
          if (node.CategoryID === targetId) {
            // 找到目标，展开路径
            currentPath.forEach(function(pathNode) {
              pathNode.drillState = "expanded";
            });
            return true;
          }
          
          if (node.children && node.children.length > 0) {
            if (findAndExpand(node.children, targetId, currentPath)) {
              return true;
            }
          }
        }
        return false;
      }
      
      findAndExpand(aCategoryTree, targetCategoryId, []);
    },
    */
    
    _loadRelatedProducts: function (sCategoryId, sCurrentProductId) {
      var that = this;
      var oModel = this.getView().getModel();
      
      // 创建过滤器查找同类别但不包括当前产品的产品
      var aFilters = [
        new Filter("CategoryID", FilterOperator.EQ, sCategoryId),
        new Filter("ProductID", FilterOperator.NE, sCurrentProductId)
      ];
      
      // 读取相关产品
      oModel.read("/Products", {
        filters: aFilters,
        success: function (oData) {
          that.getView().getModel("local").setProperty("/relatedProducts", oData.results);
        },
        error: function () {
          MessageToast.show(that.getResourceBundle().getText("relatedProductsLoadError"));
        }
      });
    },
    
    onEditButtonPress: function () {
      this.getView().getModel("local").setProperty("/editMode", true);
    },
    
    onSaveButtonPress: function () {
      var that = this;
      var oModel = this.getView().getModel();
      var oBindingContext = this.byId("productSmartForm").getBindingContext();
      
      if (!oBindingContext) {
        MessageToast.show(this.getResourceBundle().getText("noChangesToSave"));
        return;
      }
      
      // 设置忙状态
      this.getView().getModel("local").setProperty("/busy", true);
      
      // 提交更改
      oModel.submitChanges({
        success: function () {
          that.getView().getModel("local").setProperty("/busy", false);
          that.getView().getModel("local").setProperty("/editMode", false);
          MessageToast.show(that.getResourceBundle().getText("changesSaved"));
        },
        error: function () {
          that.getView().getModel("local").setProperty("/busy", false);
          MessageBox.error(that.getResourceBundle().getText("errorSavingChanges"));
        }
      });
    },
    
    onCancelButtonPress: function () {
      // 重置模型更改
      this.getView().getModel().resetChanges();
      // 退出编辑模式
      this.getView().getModel("local").setProperty("/editMode", false);
      MessageToast.show(this.getResourceBundle().getText("changesDiscarded"));
    },
    
    onRelatedProductPress: function (oEvent) {
      var oItem = oEvent.getSource();
      var oBindingContext = oItem.getBindingContext("local");
      var sProductId = oBindingContext.getProperty("ProductID");
      
      // 导航到所选相关产品
      this.getRouter().navTo("productDetail", {
        productId: sProductId
      });
    },
    
    onNavBack: function () {
      // 导航回产品列表
      this.getRouter().navTo("productList");
    },
    
    getRouter: function () {
      return this.getOwnerComponent().getRouter();
    },
    
    getResourceBundle: function () {
      return this.getOwnerComponent().getModel("i18n").getResourceBundle();
    }
  });
});