sap.ui.define([], function() {
    "use strict";
    
    return {
        /**
         * 格式化金额，保留两位小数
         * @param {number} fValue - 需要格式化的金额
         * @returns {string} 格式化后的金额
         */
        formatAmount: function(fValue) {
            if (!fValue) {
                return "0.00";
            }
            
            return parseFloat(fValue).toFixed(2);
        },
        
        /**
         * 格式化状态
         * @param {boolean} bValue - 布尔值状态
         * @returns {sap.ui.core.ValueState} UI5状态
         */
        formatStatus: function(bValue) {
            if (bValue === true) {
                return "Error";
            } else if (bValue === false) {
                return "Success";
            }
            return "None";
        }
    };
});