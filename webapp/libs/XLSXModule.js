sap.ui.define([], function() {
    "use strict";
    
    // 返回一个已解决的Promise，包含XLSX对象
    return {
        getXLSX: function() {
            return new Promise(function(resolve, reject) {
                // 检查XLSX是否已加载
                if (window.XLSX) {
                    resolve(window.XLSX);
                    return;
                }
                
                // 动态加载脚本
                var script = document.createElement('script');
                // 使用相对路径 - 关键是这里的路径要正确
                script.src = jQuery.sap.getModulePath("libs") + "/xlsx.full.min.js";
                script.onload = function() {
                    if (window.XLSX) {
                        resolve(window.XLSX);
                    } else {
                        reject(new Error("XLSX library loaded but XLSX object not found"));
                    }
                };
                script.onerror = function() {
                    reject(new Error("Failed to load XLSX library"));
                };
                document.head.appendChild(script);
            });
        }
    };
});