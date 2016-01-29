'use strict';

/*
<pagelet id="自定义id" pid="可省略" wraper="默认textarea">
<div></div>
</pagelet>
*/

var REG = /<pagelet((?:\?>|[^>])*)>\s*([\s\S]*?)<\/pagelet>/;
var ATTR_REG = /\s+(id|pid|wraper)=(['"])((?:<\?[\s\S]+\?>|[^\2])+?)\2/g;
var pageletModuleId;

module.exports = function(content, file, conf){
    var o = {};

    content = content.replace(REG, function(all, attrs, content){
        attrs.replace(ATTR_REG, function(all, name, quote, value){
            o[name] = value;
        });

        return content;
    });

    var wraper = (o.wraper || 'textarea').toLowerCase();
    var _id = file.subpathNoExt.replace(/\//g, '_').replace(/^_/, ''), id = o.id || _id;

    if(['script', 'style', 'textarea', 'code'].indexOf(wraper) > -1){
        content = content.replace(new RegExp('<\\/' + wraper + '>', 'ig'), '<\\\/' + wraper + '>');
    }

    var attr;

    if(/script|style/.test(wraper)){
        attr = 'type="text/html"';
    }else{
        attr = 'style="display:none !important;"';
    }

    content = '<' + wraper + ' id="' + id + '" ' + attr + '>\r\n' + content + '</' + wraper + '>';

    var sameCss = feather.file.wrap(file.id.replace(/\.[^\.]+$/, '.css'));
    var sameJs = feather.file.wrap(file.id.replace(/\.[^\.]+$/, '.js'));
    var async = ["'static/pagelet.js'"];

    if(sameCss.exists()){
        async.push("'" + sameCss.id + "'");
        file.addAsyncRequire(sameCss.id);
    }

    if(sameJs.exists()){
        file.addAsyncRequire(sameJs.id);
    }

    var p = _id + '_p', globalPidVar = 'self.__pageletDefaultPid__';

    content += '\r\n<script>\r\n\
(function(){\r\n\
var self = window, pid = ' + globalPidVar + ' || \'' + (o.pid || '') + '\';\r\n\
' + globalPidVar + ' = null;\r\n\
require.async([' + async.join(',') + '], function(PageLet){\r\n\
    pid && PageLet(\'' + id + '\', pid);\
' + (sameJs.exists() ? '\r\n\trequire.async(\'' + sameJs.id + '\')' : '') + ';\r\n});\r\n\
})();\r\n\
</script>';

    return content;
};