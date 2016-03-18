# lance_token

###USAGE
> Firstly you should have a redis in your machine.

##### STEP 1: install
```
npm install lance_token
```
##### STEP 2: config
```js
var lanceToken = require('lance_token')({
   max_refresh_times:15
   ,token_expire_in:7200
   ,refresh_expire_in:7*24*60*60
});

```

##### sample
```js
var lanceToken = require('lance_token')({
   max_refresh_times:15
});
var token = '';
var refresh_token = '';

lanceToken.gen('test','000',0,'',function(c,info){
	console.log('gen:'+c);
	console.log(info);
	token = info.token;
	refresh_token = info.tokeninfo.refresh_token;


	lanceToken.refresh('test','000',token,refresh_token,function(c,info){
		console.log('refresh:'+c);
		console.log(info);

		lanceToken.valid('test','000',token,function(c,info){
			console.log('valid:'+c);
			console.log(info);

			lanceToken.del('test','000',token,function(c,info){
				console.log('del:'+c);
				console.log(info);

			lanceToken.valid('test','000',token,function(c,info){
				console.log('valid:'+c);
				console.log(info);
			});

			});

		});

	});


});


```

### API

* config
```js
// max_refresh_times:The max times of refresh the token in a day.
 //  token_expire_in:Token will expire after this numbers of seconds pass
//   refresh_expire_in:Refresh token will expire after this numbers of seconds pass

```

* gen(app,uid,isInit,remark,callback(code,info))
* refresh(app,uid,token,refresh_token,callback(code,info))
* valid(app,uid,token,callback(code,info))
* del(app,uid,token,callback(code,info))

```js
// app: application name
// uid: user's id
// isInit: 1:clear all old token;others:add a new token
// remark: token's remake
//callback(code,info)

//all code
var CS = {
 /** 成功 */
    SUCCESS: 0
    /** 未知错误 */
    ,UNCONFIRM_ERROR: -1000
    /** 请求ua异常，请求失败 */
    ,UA_REQUEST_FAIL: -1001
    /** 请求缺少参数 */
    ,MISS_PARAMS: -1002
    /** 请求签名验证失败 */
    ,SIGN_REQUEST_FAIL: -1003
    /** 请求超时 */
    ,REQUEST_OVER_TIME: -1004
    /** 请求内容不正常 */
    ,REQUEST_CONTENT_ERROR: -1005
    /** token不正确 */
    ,TOKEN_INCORRECT: -1006
    /** token超时 */
    ,TOKEN_OVER_TIME: -1007
    /** refresh token 不正确 */
    ,REFRESHTOKEN_INCORRECT: -1008
    /** refresh token 超时 */
    ,REFRESHTOKEN_OVER_TIME: -1009
    /** 数据库错误 */
    ,DB_FAIL: -1010
    /**请求的受到限制*/
    ,REQUEST_LIMIT:-1011
    /** 重复 */
    ,REPEAT: -1111
    /**无效错误*/
    ,INVALID_PARAMS: -1212
}
```

#### Apologize for my poor English...I will optimize the readme.md as soon