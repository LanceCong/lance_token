/**时间工具 module
 * Created by Lance on 2016/1/1.
 */
module.exports = {
    /**获取今天零点的时间戳*/
    getToday:function(){
        var today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        return Math.floor(today.getTime()/1000);
    },
    /**获取这个月的第一天时间戳*/
    getThisMonth:function(){
        var today = new Date();
        today.setDate(0);
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        return Math.floor(today.getTime()/1000);
    },
    /**获取实时时间戳*/
    getNowTimestamp:function(){
        return Math.floor(new Date().getTime()/1000);
    },
    /**时间戳转日期格式*/
    timestamp2date:function format(timestamp){
        function add0(m){return m<10?'0'+m:m }
        var time = new Date(timestamp);
        var y = time.getFullYear();
        var m = time.getMonth()+1;
        var d = time.getDate();
        var h = time.getHours();
        var mm = time.getMinutes();
        var s = time.getSeconds();
        return y+'年'+add0(m)+'月'+add0(d)+'日';//+add0(h)+':'+add0(mm)+':'+add0(s);
    }

};