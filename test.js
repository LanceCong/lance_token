/**
 * Created by Lance on 2016/3/19.
 */
var lanceToken = require('./index')({
    app:'test'
});
var token = '';
var refresh_token = '';

lanceToken.gen({uid:'000',remark:'remark'},function(c,info){
    console.log('gen:'+c);
    console.log(info);
    token = info.token;
    refresh_token = info.tokeninfo.refresh_token;

    lanceToken.refresh({uid:'000',token:token,refresh_token:refresh_token},function(c,info){
        console.log('refresh:'+c);
        console.log(info);

        lanceToken.valid({uid:'000',token:token},function(c,info){
            console.log('valid:'+c);
            console.log(info);

            lanceToken.del({uid:'000',token:token},function(c,info){
                console.log('del:'+c);
                console.log(info);

                lanceToken.valid({uid:'000',token:token},function(c,info){
                    console.log('valid:'+c);
                    console.log(info);
                });

            });

        });

    });


});