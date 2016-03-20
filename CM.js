/**
 * Created by Lance on 2016/3/20.
 */
var CS = require('./CS');

module.exports = {
    //是否为空
    isNullOrEmpty: function(parms) {
        return (parms == undefined || parms == null || parms == '') == true ? true:false;
    },
    //检查非空
    checkNull:function(params,fileds,callback){
        for(var i = 0; i< fileds.length; i++ ){
            if(this.isNullOrEmpty(params[fileds[i]])){
                callback(CS.MISS_PARAMS,fileds[i]);
                return true;
            }
        }
        return false;
    }

};