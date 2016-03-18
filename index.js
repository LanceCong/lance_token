/** A token pool module.Support sso.mso.single sing on.multi sing on.
 * Created by lance on 16-3-18.
 */
var redis = require("redis"),
    client = redis.createClient();
var CS = require('./CS');
var date_util = require('./date_util');
var uuid = require('node-uuid');

module.exports = function(config){
    /**token expire in.Unit:seconds.default in 7200 = 2hours*/
    const TOKEN_EXPIRE_IN = typeof config.token_expire_in == "number" ? config.token_expire_in :2*60*60;
    /**refresh token expire in.Unit:seconds.default in 7days*/
    const REFRESH_EXPIRE_IN = typeof config.refresh_expire_in == "number" ? config.token_expire_in :7*24*60*60;
    /**max refresh times in a day*/
    const MAX_REFRESH_TIMES = typeof config.max_refresh_times == "number" ? config.max_refresh_times :12;

    /**
     * 生成token
     * @param app
     * @param uid
     * @param sso
     * @param callback
     */
    var gen = function(app,uid,sso,remark,callback){
        var mainkey = app+':'+uid;
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
            ,remark:(remark == null || remark == undefined)?'':remark
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

                if(sso == 1){
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
     * @param app
     * @param uid
     * @param token
     * @param refresh_token
     * @param callback
     */
    var refresh = function(app,uid,token,refresh_token,callback){
        var mainkey = app+':'+uid;
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
                var tokenInfo = jsonMainvalue[token];
                if(tokenInfo == undefined){
                    callback(CS.TOKEN_INCORRECT,'token incorrect');
                }else{
                    if(tokenInfo.refresh_token != refresh_token){
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
                                jsonMainvalue[token] = tokenInfo;
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

    /***
     * 校验token
     * @param app
     * @param uid
     * @param token
     * @param callback
     */
    var valid = function(app,uid,token,callback){
        var mainkey = app+':'+uid;
        var token = token;
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
                var tokenInfo = jsonMainvalue[token];
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

    /***
     * 强制无效token
     * @param app
     * @param uid
     * @param token
     * @param callback
     */
    var del = function(app,uid,token,callback){
        var mainkey = app+':'+uid;

        client.get(mainkey,function(err,reply){
            if(err){
                callback(CS.DB_FAIL,'redis error');
                return;
            }
            if(reply == null){
                callback(CS.INVALID_PARAMS,'appid:uid not exist');
            }else {
                var jsonMainvalue = JSON.parse(reply);//{token1:{},token2:{},token3:{}}
                var tokenInfo = jsonMainvalue[token];
                if(tokenInfo == undefined){
                    callback(CS.TOKEN_INCORRECT,'token incorrect');
                }else{
                    delete jsonMainvalue[token];
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
