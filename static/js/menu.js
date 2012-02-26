
// ------------------------------------------------
// Menu
// ------------------------------------------------
EnterMenu = function() {
	async.series([
		function(callback) {
			LoadMenu(function(err, vars) { CONFIG.vars = vars; callback(err, vars);});
		},
		function(callback) {
			FB.api('/'+CONFIG.me.id+'/picture', function(pic) { CONFIG.me_pic = pic; callback(null, pic);});
		},
		function(callback) {
			$("#uicontainer").fadeOut('slow', function() { callback(null); });
		}
	], function(err, results) {
		RunMenu();
	});
}

LoadMenu = function(cb) {
	LoadEJSTemplateArray(['MainMenu'], cb);
}

RunMenu = function() {
	var uicontainer = document.getElementById('uicontainer');
	CONFIG.vars.ejsMainMenu.update(uicontainer, {
		name: CONFIG.me.first_name,
		num_sessions: CONFIG.num_sessions,
		pic_url: CONFIG.me_pic
	});
	FB.Canvas.setAutoGrow(false);
	$(uicontainer).show();
	/*var ru = getOffsetRect(uicontainer);
	var rp = getOffsetRect(photo);
	FB.Canvas.setSize({width:ru.width, height:rp.bottom});*/
	FB.Canvas.setDoneLoading();
};
