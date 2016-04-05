/** 一个token认证、管理模块。
 * 1)提供token、refresh_token
 * 2）token默认2小时失效，失效时候使用refresh_token调用刷新方法刷新token，即可延长2小时.刷新方法每天只能调用12次
 * 3）默认连续超过7天不使用token，其对于的refresh_token将会过期，refresh_token过期后，引导用户重新登录。
 * Created by lance on 16-3-18.
 */
var redis = require("redis"),
    client = redis.createClient();
var CS = require('./CS');
var CM = require('./CM');
var date_util = require('./date_util');
var uuid = require('node-uuid');

module.exports = function(config){
    config = config == undefined ? {}:config;
    /** token过期时间，默认2小时 */
    const TOKEN_EXPIRE_IN = (config.token_expire_in == undefined) ? 2*60*60 : config.token_expire_in;
    /** refresh token 过期时间，默认7天 */
    const REFRESH_EXPIRE_IN = (config.refresh_expire_in == undefined) ? 7*24*60*60 : config.refresh_expire_in;
    /** token一天内最大刷新次数 */
    const MAX_REFRESH_TIMES = (config.max_refresh_times == undefined) ? 12 : config.max_refresh_times;
    /** app 的名称，建议英文 */
    const APP_NAME = config.app == undefined ? 'default': config.app;
    
    /**
     * 
     * @param params ->
     * {app:'app的名称'
     * ,uid:'用户的唯一id'
     * ,single:1 单端登录，其他是多端模式
     * ,remark:'备注'
     * }
     * @param callback
     */
    var gen = function(params,callback){
        if(CM.checkNull(params,['uid'],callback)){
            return;
        }
        var app = params.app == undefined ? APP_NAME:params.app;
        var mainkey = app+':'+params.uid;
        var token = uuid.v4().replace(/\-/g,"");
        const mToken = token;
        var refresh_token = uuid.v4().replace(/\-/g,"");
        var currentTime = date_util.getNowTimestamp();
        var today = date_util.getToday();
        var tokenInfo = {
            token_expire_time:currentTime+TOKEN_EXPIRE_IN
            ,refresh_token:refresh_token
            ,refresh_expire_time:currentTime+REFRESH_EXPIRE_IN
            ,refresh_times:0//今天刷新的次数
            ,last_token_timestamp:today//token最新使用时间。记录当天的0点，都是今天用，不用去加refresh_token expire
            ,last_refresh_token_timestamp:today//refresh 使用时间。也是0点.都是今天用，要加1
            ,remark:(params.remark == undefined)?'':params.remark
        };
        var mainvalue = {};
        mainvalue[token] = tokenInfo;
        //
        client.get(mainkey, function (err, reply) {
            if(err){
                callback(CS.UNCONFIRM_ERROR,'redis error');
                return;
            }
            if(reply == null){

                //第一次添加
                client.set(mainkey,JSON.stringify(mainvalue),function(err,reply){
                    if(err){
                        callback(CS.DB_FAIL,'add error');
                    } else{
                        callback(CS.SUCCESS,{
                            token:mToken
                            ,tokeninfo:mainvalue[mToken]
                        });
                    }
                });

            }else{

                //已经申请过

                var jsonOldMainvalue = JSON.parse(reply);//{token1:{},token2:{},token3:{}}

                if(params.single == CS.SINGLE_SIGN_IN){
                    //单点登陆
                    client.set(mainkey,JSON.stringify(mainvalue),function(err,reply){
                        if(err){
                            callback(CS.DB_FAIL,'add error');
                        } else{
                            callback(CS.SUCCESS,{
                                token:mToken
                                ,tokeninfo:mainvalue[mToken]
                            });
                        }
                    });

                }else{
                    //默认多端,追加
                    // 删除过期的token
                    for(var token in jsonOldMainvalue){
                        var tokeninfo = jsonOldMainvalue[token];
                        if(tokeninfo.refresh_expire_time < currentTime){
                            delete jsonOldMainvalue[token];
                        }
                    }
                    jsonOldMainvalue[mToken] = tokenInfo;
                    client.set(mainkey,JSON.stringify(jsonOldMainvalue),function(err,reply){
                        if(err){
                            callback(CS.DB_FAIL,'add error');
                        } else{
                            callback(CS.SUCCESS,{
                                token:mToken
                                ,tokeninfo:mainvalue[mToken]
                            });
                        }
                    });
                }

            }

        });
    };

    /**
     * 刷新token
     * @param params app可选，uid用户唯一id，token，refresh_token
     * @param callback
     */
    var refresh = function(params,callback){
        if(CM.checkNull(params,['uid','token','refresh_token'],callback)){
            return;
        }
        var app = params.app == undefined ? APP_NAME:params.app;
        var mainkey = app+':'+params.uid;
        var currentTime = date_util.getNowTimestamp();
        client.get(mainkey,function(err,reply){
            if(err){
                callback(CS.DB_FAIL,'redis error');
                return;
            }
            if(reply == null){
                callback(CS.INVALID_PARAMS,'appid:uid not exist');
            }else {
                var jsonMainvalue = JSON.parse(reply);//{token1:{},token2:{},token3:{}}
                var tokenInfo = jsonMainvalue[params.token];
                if(tokenInfo == undefined){
                    callback(CS.TOKEN_INCORRECT,'token incorrect');
                }else{
                    if(tokenInfo.refresh_token != params.refresh_token){
                        callback(CS.REFRESHTOKEN_INCORRECT,'refresh_token incorrect');
                    }else {
                        if(tokenInfo.refresh_expire_time < currentTime){
                            callback(CS.REFRESHTOKEN_OVER_TIME,'refresh_token over time');
                        }else {
                            if(tokenInfo.refresh_times >= MAX_REFRESH_TIMES){
                                callback(CS.REQUEST_LIMIT,'refresh over 12 times');
                            }else {
                                //开始刷新
                                var today = date_util.getToday();
                                tokenInfo.token_expire_time = currentTime+TOKEN_EXPIRE_IN;
                                if(tokenInfo.last_refresh_token_timestamp == today){
                                    //今天重复使用，+1
                                    tokenInfo.refresh_times = (tokenInfo.refresh_times+1);
                                }
                                tokenInfo.last_refresh_token_timestamp = today;//今天0点
                                //
                                jsonMainvalue[params.token] = tokenInfo;
                                client.set(mainkey,JSON.stringify(jsonMainvalue),function(err,reply){
                                    if(err){
                                        callback(CS.DB_FAIL,'add error');
                                    } else{
                                        callback(CS.SUCCESS,'');
                                    }
                                });

                            }
                        }
                    }
                }
            }
        });
    };

    /**
     * 校验token
     * @param params
     * @param callback
     */
    var valid = function(params,callback){
        if(CM.checkNull(params,['uid','token'],callback)){
            return;
        }
        var app = params.app == undefined ? APP_NAME:params.app;
        var mainkey = app+':'+params.uid;
        var currentTime = date_util.getNowTimestamp();
        var today = date_util.getToday();

        client.get(mainkey,function(err,reply){
            if(err){
                callback(CS.DB_FAIL,'redis error');
                return;
            }
            if(reply == null){
                callback(CS.INVALID_PARAMS,'appid:uid not exist');
            }else {
                var jsonMainvalue = JSON.parse(reply);//{token1:{},token2:{},token3:{}}
                var tokenInfo = jsonMainvalue[params.token];
                if(tokenInfo == undefined){
                    callback(CS.TOKEN_INCORRECT,'token incorrect');
                }else{
                    if(tokenInfo.token_expire_time < currentTime){
                        callback(CS.TOKEN_OVER_TIME,'token over time');
                    }else{
                        if(tokenInfo.last_token_timestamp != today){
                            //推迟refresh token过期时间
                            tokenInfo.refresh_expire_time = date_util.getNowTimestamp()+REFRESH_EXPIRE_IN;
                            tokenInfo.last_token_timestamp = today;
                        }
                        //校验成功
                        callback(CS.SUCCESS,'');
                    }
                }
            }
        });
    };

    /**
     * 强制无效token
     * @param params
     * @param callback
     */
    var del = function(params,callback){
        if(CM.checkNull(params,['uid','token'],callback)){
            return;
        }
        var app = params.app == undefined ? APP_NAME:params.app;
        var mainkey = app+':'+params.uid;

        client.get(mainkey,function(err,reply){
            if(err){
                callback(CS.DB_FAIL,'redis error');
                return;
            }
            if(reply == null){
                callback(CS.INVALID_PARAMS,'appid:uid not exist');
            }else {
                var jsonMainvalue = JSON.parse(reply);//{token1:{},token2:{},token3:{}}
                var tokenInfo = jsonMainvalue[params.token];
                if(tokenInfo == undefined){
                    callback(CS.TOKEN_INCORRECT,'token incorrect');
                }else{
                    delete jsonMainvalue[params.token];
                    //更新到redis
                    client.set(mainkey,JSON.stringify(jsonMainvalue),function(err,replay){
                        if(err){
                            callback(CS.DB_FAIL,'redis fail');
                        }else {
                            callback(CS.SUCCESS,'del ok');
                        }
                    });
                }
            }
        });
    };

    var lanceToken = {
        gen:gen
        ,refresh:refresh
        ,valid:valid
        ,del:del

    };
    return lanceToken;
};
