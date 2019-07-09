/*  背景板,程序驻内存运行 */

/** 调用API */
const requestApi = (message, sendResponse) => {

	let appKey = App.appKey;
	let appSecretKey = App.appSecretKey;

	// UUID 时间戳 => sha256
	let salt = new Date().getTime();
	// 当前时间
	let curtime = Math.round(new Date().getTime() / 1000);

	// 查询
	let query = message.queryWord;
	// 查询,源语言
	let from = 'auto';
	// 查询,目标语言
	let to = 'auto'; //'zh-CHS';
	// 加密-明文
	let str1 = appKey + getInput(query) + salt + curtime + appSecretKey;
	// 加密-密文
	let sign = sha256(str1);
	let data = {
		q: query,
		from: from,
		to: to,
		appKey:appKey,
		salt: salt,
		sign: sign,
		signType:'v3',
		curtime: curtime
	};
	let url = "http://openapi.youdao.com/api";
	// 异步请求
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.onreadystatechange = () => {
		// @TODO 请求失败时响应
		if (xhr.readyState != 4) {
			return;
		}
		// 解析返回结果,返回HTML
		let responseJson = (JSON.parse(xhr.responseText));
		// 返回解析结果
		sendResponse(htmlbuilderFactory(message, responseJson));
	};
	xhr.send(postDataFormat(data));
}

/** 调用API方法:截取输入文本,API要求加密时,查询内容最多输入20字符 */
const getInput = (input) => {
	if (input.length == 0) {
		return null;
	}
	let result;
	let len = input.length;
	if (len <= 20) {
		result = input;
	} else {
		let startStr = input.substring(0, 10);
		let endStr = input.substring(len - 10, len);
		result = startStr + len + endStr;
	}
	return result;
}

/** 将POST请求的数据体格式化,对象类型 */
const postDataFormat = (obj) => {
	let data = new FormData();
	for (let attr in obj) {
		data.append(attr, obj[attr]);
	}
	return data;
}

/* 根据来源,选择不同的渲染函数.如果失败,返回失败情况 */
const htmlbuilderFactory = (message, responseJson) => {
	debugger;
	console.log(responseJson);
	let source = message.source || '';
	let errorCode = responseJson.errorCode || "0";
	
	// @TODO 错误信息,返回错误信息页面
	if(errorCode != "0"){
		return errorHtmlBuilder(responseJson);
	}else if(source === "popup"){
		return popupHtmlBuilder(responseJson);
	}else if(source === "selection"){
		return selectionHtmlBuilder(responseJson);
	}else{
		return '';
	}
}

/** 错误页面 */
const errorHtmlBuilder = (obj) => {
	let errorCode = obj.errorCode;
	let errorValue = Ext.getAppErrorCodeValue(errorCode);
	return AppTemplate.getWordError({wordErrorValue: errorValue}) ;
}

/** 在popup页面中正确的查询结果 */
const popupHtmlBuilder = (obj) => {
	debugger;
	// 渲染
	let popupHtml = '';

	// 单词
	if(Ext.isNotEmpty(obj.query)){
		popupHtml += AppTemplate.getWordQuery({query: obj.query});
	}
	// 音标, 在大段翻译时,不会有音标,但是有发音
	if(Ext.isNotEmpty(obj.basic) && Ext.isNotEmpty(obj.basic['uk-phonetic']) && Ext.isNotEmpty(obj.basic['us-phonetic'])){
		popupHtml += AppTemplate.getWordPhonetic(
		{wordUkPhonetic: obj.basic['uk-phonetic'],
		 wordUkSpeech: obj.basic['uk-speech'],
		 wordUsPhonetic: obj.basic['us-phonetic'],
		 wordUsSpeech: obj.basic['us-speech']
		});
	}
	// 大段翻译,优先级低于词释
	if(Ext.isNotEmpty(obj.translation) && Ext.isEmpty(obj.basic)){
		popupHtml += AppTemplate.getWordTranslation({translation: obj.translation});
	}
	// 词释
	if(Ext.isNotEmpty(obj.basic) && Ext.isNotEmpty(obj.basic.explains)){
		popupHtml += AppTemplate.getWordExplains(obj.basic.explains);
	}
	// 词释扩展,变形
	if(Ext.isNotEmpty(obj.basic) && Ext.isNotEmpty(obj.basic.wfs)){
		popupHtml += AppTemplate.getWordWfs(obj.basic.wfs);
	}
	// 网络词义
	if(Ext.isNotEmpty(obj.web)){
		popupHtml += AppTemplate.getWordWeb(obj.web);
	}
	return popupHtml;
}

/** 在selection页面中正确的查询结果 */
const selectionHtmlBuilder = (obj) => {
	debugger;
	// 渲染
	let popupHtml = '';

	// 单词
	if(Ext.isNotEmpty(obj.query)){
		popupHtml += AppTemplate.getWordQuery({query: obj.query});
	}
	// 音标, 在大段翻译时,不会有音标,但是有发音
	if(Ext.isNotEmpty(obj.basic) && Ext.isNotEmpty(obj.basic['uk-phonetic']) && Ext.isNotEmpty(obj.basic['us-phonetic'])){
		popupHtml += AppTemplate.getWordPhonetic(
		{wordUkPhonetic: obj.basic['uk-phonetic'],
		 wordUkSpeech: obj.basic['uk-speech'],
		 wordUsPhonetic: obj.basic['us-phonetic'],
		 wordUsSpeech: obj.basic['us-speech']
		});
	}
	// 大段翻译,优先级低于词释
	if(Ext.isNotEmpty(obj.translation) && Ext.isEmpty(obj.basic)){
		popupHtml += AppTemplate.getWordTranslation({translation: obj.translation});
	}
	// 词释
	if(Ext.isNotEmpty(obj.basic) && Ext.isNotEmpty(obj.basic.explains)){
		popupHtml += AppTemplate.getWordExplains(obj.basic.explains);
	}
	return popupHtml;
}

/** 监听请求 */
chrome.runtime.onMessage.addListener(

	(message, sender, sendResponse) => {

		// 调用API
		requestApi(message, sendResponse);

		return true;
	}
);
