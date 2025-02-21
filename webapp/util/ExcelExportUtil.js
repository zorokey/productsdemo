sap.ui.define([
    "sap/ui/base/Object",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
  ], function(Object, MessageToast, MessageBox) {
    "use strict";
    
    return Object.extend("productsdemo.util.ExcelExportUtil", {
      
      constructor: function() {
        Object.apply(this, arguments);
      },
      
      /**
       * 检查XLSX库是否已加载
       */
      isXLSXLoaded: function() {
        return typeof XLSX !== "undefined";
      },
      
      /**
       * 从Smart Table/List获取数据
       * @param {object} oSmartControl - Smart控件实例
       * @returns {array} 数据数组
       */
      getDataFromSmartControl: function(oSmartControl) {
        var aData = [];
        
        try {
          // 获取表格或列表的内部控件
          var oInnerControl = oSmartControl.getTable ? oSmartControl.getTable() : 
                             (oSmartControl.getList ? oSmartControl.getList() : null);
          
          if (!oInnerControl) {
            throw new Error("无法获取Smart控件的内部表格或列表");
          }
          
          // 获取绑定信息
          var oBinding = oInnerControl.getBinding("items") || oInnerControl.getBinding("rows");
          if (!oBinding) {
            throw new Error("无法获取数据绑定");
          }
          
          // 收集所有数据
          var aContexts = oBinding.getContexts(0, oBinding.getLength());
          aData = aContexts.map(function(oContext) {
            return oContext.getObject();
          });
          
          // 应用过滤器（如果有）
          var aFilters = oBinding.aFilters || [];
          if (aFilters.length > 0) {
            // 如果有过滤器，使用当前显示的数据
            aData = oBinding.getCurrentContexts().map(function(oContext) {
              return oContext.getObject();
            });
          }
          
        } catch (oError) {
          MessageBox.error("获取数据失败: " + oError.message);
          jQuery.sap.log.error("获取数据失败", oError);
          return [];
        }
        
        return aData;
      },
      
      /**
       * 获取列信息
       * @param {object} oSmartControl - Smart控件实例
       * @returns {array} 列信息数组
       */
      getColumnsInfo: function(oSmartControl) {
        var aColumns = [];
        
        try {
          // 从Smart表格或列表获取列信息
          if (oSmartControl.getTable) {
            var oTable = oSmartControl.getTable();
            aColumns = oTable.getColumns().map(function(oColumn) {
              return {
                key: oColumn.getBinding("text") ? 
                    oColumn.getBinding("text").getPath().replace("/#", "") : 
                    oColumn.getProperty("name"),
                label: oColumn.getHeader().getText()
              };
            });
          } else if (oSmartControl.getList) {
            // 从Smart列表获取字段信息比较复杂，通常需要从元数据中提取
            var oMetadata = oSmartControl.getEntitySet ? 
                           oSmartControl.getModel().getMetaModel().getODataEntitySet(oSmartControl.getEntitySet()) : 
                           null;
            
            if (oMetadata && oMetadata.entityType) {
              var oEntityType = oSmartControl.getModel().getMetaModel().getODataEntityType(oMetadata.entityType);
              aColumns = oEntityType.property.map(function(oProp) {
                return {
                  key: oProp.name,
                  label: oProp["sap:label"] || oProp.name
                };
              });
            }
          }
        } catch (oError) {
          jQuery.sap.log.error("获取列信息失败", oError);
        }
        
        return aColumns;
      },
      
      /**
       * 导出Excel文件，包含VBA脚本
       * @param {object} oSmartControl - Smart控件实例
       * @param {string} sFileName - 文件名，默认为"Export.xlsm"
       * @param {string} vbaScript - 自定义VBA脚本，如果未提供则使用默认脚本
       */
      exportToExcel: function(oSmartControl, sFileName, vbaScript) {
        if (!this.isXLSXLoaded()) {
          MessageBox.error("XLSX库未加载，无法导出");
          return;
        }
        
        try {
          // 获取数据
          var aData = this.getDataFromSmartControl(oSmartControl);
          if (!aData || aData.length === 0) {
            MessageBox.warning("没有可导出的数据");
            return;
          }
          
          // 获取列信息
          var aColumns = this.getColumnsInfo(oSmartControl);
          
          // 处理数据格式，确保只导出需要的字段
          var aProcessedData = [];
          if (aColumns && aColumns.length > 0) {
            aProcessedData = aData.map(function(oItem) {
              var oProcessedItem = {};
              aColumns.forEach(function(oColumn) {
                oProcessedItem[oColumn.label] = oItem[oColumn.key];
              });
              return oProcessedItem;
            });
          } else {
            // 如果无法获取列信息，直接使用原始数据
            aProcessedData = aData;
          }
          
          // 创建工作表
          var worksheet = XLSX.utils.json_to_sheet(aProcessedData);
          
          // 创建工作簿
          var workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "数据");
          
          // 设置默认VBA脚本（如果未提供）
          if (!vbaScript) {
            vbaScript = 'Attribute VB_Name = "Module1"\r\n' +
              'Sub AutoFormat()\r\n' +
              '    On Error Resume Next\r\n' +
              '    Cells.Select\r\n' +
              '    Cells.EntireColumn.AutoFit\r\n' +
              '    With ActiveSheet.UsedRange\r\n' +
              '        .Borders.LineStyle = xlContinuous\r\n' +
              '        .Borders.Weight = xlThin\r\n' +
              '        With .Rows(1)\r\n' +
              '            .Font.Bold = True\r\n' +
              '            .Interior.ColorIndex = 15\r\n' +
              '        End With\r\n' +
              '    End With\r\n' +
              '    Range("A1").Select\r\n' +
              '    Application.OnTime Now + TimeValue("00:00:01"), "RunAutoOpen"\r\n' +
              'End Sub\r\n' +
              '\r\n' +
              'Sub RunAutoOpen()\r\n' +
              '    On Error Resume Next\r\n' +
              '    Application.Run "AutoFormat"\r\n' +
              'End Sub\r\n' +
              '\r\n' +
              'Sub Auto_Open()\r\n' +
              '    On Error Resume Next\r\n' +
              '    Application.Run "AutoFormat"\r\n' +
              'End Sub\r\n';
          }
          
          // 添加VBA脚本
          workbook.vbaraw = vbaScript;
          
          // 设置导出选项
          var wopts = {
            bookType: 'xlsm',
            bookVBA: true
          };
          
          // 设置文件名
          sFileName = sFileName || "Export.xlsm";
          if (!sFileName.endsWith(".xlsm")) {
            sFileName += ".xlsm";
          }
          
          // 导出文件
          XLSX.writeFile(workbook, sFileName, wopts);
          MessageToast.show("导出成功");
        } catch (oError) {
          MessageBox.error("导出失败: " + oError.message);
          jQuery.sap.log.error("导出Excel失败", oError);
        }
      }
    });
  });