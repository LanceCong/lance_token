/** 常量
 * Created by admin on 2015/10/23.
 */
module.exports = {
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




    /**单端登录-排他*/
    ,SINGLE_SIGN_IN:1















}
