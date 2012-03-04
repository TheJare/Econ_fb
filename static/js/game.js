/*
(C) Copyright by Javier Arevalo in 2012.
	http://www.iguanademos.com/Jare/
	@TheJare on twitter
	https://github.com/TheJare
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

// Misc math and colors
function logobj(a) {console.log(JSON.stringify(a));}
function MakeColor(r,g,b) { return "rgb("+Math.floor(Clamp(r, 0, 255))+","+Math.floor(Clamp(g, 0, 255))+","+Math.floor(Clamp(b, 0, 255))+")"; }
function Pow2(v) { return v*v; }
function Lerp(a,b,t) { return a+(b-a)*t; }
function Clamp(v,a,b) { return Math.max(a,Math.min(v,b)); }
function Wrap(v,a,b) { return v<a? (v+(b-a)) : (v>b? (v-(b-a)) : v); }
function RandomInt(v) { return Math.floor(Math.random()*v); }
function RandomIntRange(a,b) { return Math.floor(Math.random()*(b-a)+a); }
function RandomFloat(v) { return Math.random()*v; }
function RandomFloatRange(a,b) { return Math.random()*(b-a)+a; }
function RandomColor(min, max) { return MakeColor(RandomIntRange(min, max), RandomIntRange(min, max), RandomIntRange(min, max)); }

// http://javascript.info/tutorial/coordinates#the-right-way-elem-getboundingclientrect
function getOffsetRect(elem) {
	// (1)
	var box = elem.getBoundingClientRect()
	
	var body = document.body
	var docElem = document.documentElement
	
	// (2)
	var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop
	var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft
	
	// (3)
	var clientTop = docElem.clientTop || body.clientTop || 0
	var clientLeft = docElem.clientLeft || body.clientLeft || 0
	
	// (4)
	var top  = box.top +  scrollTop - clientTop
	var left = box.left + scrollLeft - clientLeft
	var bottom = box.bottom +  scrollTop - clientTop
	var right = box.right + scrollLeft - clientLeft
	
	return { top: Math.round(top), left: Math.round(left), bottom: Math.round(bottom), right: Math.round(right), width: box.width, height: box.height,  }
}

// Utilities to load templates.
LoadEJSTemplate = function(name, res, cb) {
	res = res || {};
	var v = $.ajax({
		url: 'ejs/ui' + name + '.ejs',
		dataType: 'text',
		type: 'GET',
		success: function(data, textStatus, jqXHR) {
			res['ejs'+name] = new EJS({text:data});
			cb(null, res);
		}
	});
}
LoadEJSTemplateArray = function(templates, cb) {
	var vars = {};
	async.map(templates,
		function(it, callback) { LoadEJSTemplate(it, vars, callback); },
		function(err, res) { cb(err, vars); }
	);
}

// ------------------------------------------------
// Game
// ------------------------------------------------

ServerCommand = function(cmd, body, cb) {
	body = body || {};
	$.ajax({
		url: CONFIG.server_url+'/'+CONFIG.sn_id+'/' + cmd,
		dataType: 'text',
		type: 'POST',
		data: body,
		success: function(data, textStatus, jqXHR) {
			logobj(data);
			if (cb) cb(null, data);
		}
	});
}

EnterGame = function() {
	async.series([
		function(callback) {
			LoadGame(function(err, vars) { CONFIG.vars = vars; callback(err, vars);});
		},
		function(callback) {
			$("#uicontainer").fadeOut('slow', function() { callback(null); });
		}
	], function(err, results) {
		RunGame();
	});
}

LoadGame = function(cb) {
	LoadEJSTemplateArray(['MarketBuySellLine', 'MarketMain'], cb);
}

RunGame = function() {
	ServerCommand('StartGame');
	var uicontainer = document.getElementById('uicontainer');
	CONFIG.vars.MAX_MONEY = 10000;
	CONFIG.vars.MAX_DAYS = 30;
	CONFIG.vars.ejsMarketMain.update(uicontainer, {});

	CONFIG.vars.hasWon = false;

	var ItemDefs = [
		['it0', { min:1, max:5, color:MakeColor(255,0,0) } ],
		['it1', { min:3, max:10, color:MakeColor(255,0,255) } ],
		['it2', { min:5, max:20, color:MakeColor(255,255,255) } ],
		['it3', { min:10, max:35, color:MakeColor(255,255,0) } ],
		['it4', { min:20, max:60, color:MakeColor(0,255,255) } ],
		['it5', { min:35, max:100, color:MakeColor(0,255,0) } ],
		['it6', { min:60, max:150, color:MakeColor(128,128,255) } ],
		['it7', { min:100, max:250, color:MakeColor(128,255,128) } ],
		['it8', { min:150, max:320, color:MakeColor(255,128,128) } ],
		['it9', { min:250, max:450, color:MakeColor(255,128,255) } ],
	];

	var Player = function() {
		this.money = 10;
		this.inventory = {};
	};
	Player.prototype.AddItem = function(market, i, n) {
		if (!this.inventory[i])
			this.inventory[i] = 0;
		var cost = market.exchange[i];
		var totalcost = cost*n;
		if (totalcost > 0) {
			if (totalcost <= this.money && this.inventory[i] < 10) {
				this.money -= totalcost;
				this.inventory[i] += n;
			}
		} else {
			if (this.inventory[i] >= -n) {
				this.money -= totalcost;
				this.inventory[i] += n;
			}
		}
	}

	var Market = function() {
		this.exchange = {};
		this.history = [];
		this.NewTrading();
	};
	Market.prototype.NewTrading = function() {
		this.exchange = {};
		for (var i in ItemDefs) {
			var it = ItemDefs[i][0];
			this.exchange[it] = RandomIntRange(ItemDefs[i][1].min, ItemDefs[i][1].max);
		}		
		this.history.push(this.exchange);
	}
	Market.prototype.NewDay = function() {
		if (this.history.length > 6) {
			this.history.shift();			
		}
		this.NewTrading();
	}

	var player = new Player();
	var market = new Market();
	var days = 1;

	var BuyItemEvent = function(itemIndex, itemName, v) {
		player.AddItem(market, itemName, v);
		if (!CONFIG.vars.hasWon) {
			if (player.money >= CONFIG.vars.MAX_MONEY) {
				CONFIG.vars.hasWon = true;
				$('#winMessage').show();
			}
		}
		$("#itemmarketplayerinv_"+itemIndex).text('('+player.inventory[itemName]+')');
		$("#playermoney").text(player.money);
	}

	var lastHighlightedItem = null;
	var PlotHoverEvent = function (evt, pos, item, percents) {
		if (lastHighlightedItem !== null) {
			lastHighlightedItem.removeClass('itemmarketline_hover');
			lastHighlightedItem = null;
		}
		if (item) {
			lastHighlightedItem = $('#itemmarketline_'+percents[item.seriesIndex].myItemIndex);
			lastHighlightedItem.addClass('itemmarketline_hover');
		}
	}
	var ItemHoverEvent = function (evt, percents, itemIndex) {
		if (itemIndex !== null) {
			var localpercents = [percents[itemIndex]];
			RenderGraph(localpercents, percents);
			$(evt.target.parentNode).addClass('itemmarketline_hover');
		} else {
			RenderGraph(percents, percents);
			$(evt.target.parentNode).removeClass('itemmarketline_hover');
		}
	}

	var RenderGraph = function(percentsToRender, percents) {
		var marketgraph = $("#marketgraph");
		$.plot(marketgraph, percentsToRender, { 
			series: { lines: { show: true }, points: { show: true } },
			xaxis: {min:0, max:6},
			yaxis: {min:0, max:100},
			grid: { hoverable: true }
		});
		marketgraph.off("plothover");
		marketgraph.on("plothover", function(event, pos, item) { PlotHoverEvent(event, pos, item, percents);});
	}

	var ProcessMarket = function(cb) {
		for (var itemIndex in ItemDefs) {
			var itemName = ItemDefs[itemIndex][0];
			var itemDef = ItemDefs[itemIndex][1];
			var playerInv = (player.inventory[itemName] || 0);
			var marketValue = market.exchange[itemName];
			if (cb(itemIndex, itemName, itemDef, playerInv, marketValue) === false)
				break;
		}
	}

	var DisplayUI = function() {
		if (days >= CONFIG.vars.MAX_DAYS)
			$('#nextday').hide();

		var marketdiv = $("#market");
		var summarydiv = $("#summary");
		marketdiv.empty();
		summarydiv.empty();

		var estimatedMoney = player.money;
		ProcessMarket(function(itemIndex, itemName, itemDef, playerInv, marketValue) {
			estimatedMoney += playerInv*marketValue;
		});

		var percents = [];
		var percentsToRender = [];
		ProcessMarket(function(itemIndex, itemName, itemDef, playerInv, marketValue) {
			if (marketValue > estimatedMoney)
				return false;

			var pct = Math.floor((marketValue - itemDef.min) * 100 / (itemDef.max-itemDef.min));
			// Compute history for this item's graph and store in percents[]
			var hist = [];
			for (var j = 0; j < market.history.length; ++j) {
				var val = market.history[j][itemName];
				var valpct = (val - itemDef.min) * 100 / (itemDef.max-itemDef.min);
				hist.push([j, valpct]);
			}
			var graphLine = { color: itemDef.color, data: hist, myItemName: itemName, myItemIndex:itemIndex };
			percents.push(graphLine);

			// If we don't want to render this item, then we're done for this iteration.
			if (playerInv == 0 && itemDef.max*10 < estimatedMoney/20)
				return;

			var d = $(CONFIG.vars.ejsMarketBuySellLine.render({
				color: itemDef.color,
				pct: pct,
				xchg: marketValue,
				n: playerInv,
				itemIndex : itemIndex
			}));

			var dadd = d.find("#add");
			var dsub = d.find("#sub");
			// Function to make a closure bound to the current value of loop variable
			var MakeBuyHandler = function(n) { return function(e) {BuyItemEvent(itemIndex, itemName, n);e.preventDefault();};}
			dadd.on('mousedown', MakeBuyHandler( 1) );
			dsub.on('mousedown', MakeBuyHandler(-1) );
			marketdiv.append(d);
			var MakeHoverHandler = function(itemIndex) { return function(evt) {ItemHoverEvent(evt, percents, itemIndex);};}
			d.on('mouseenter', MakeHoverHandler(itemIndex));
			d.on('mouseleave', MakeHoverHandler(null));

			percentsToRender.push(graphLine);
		});
		var d = '<div><p> Money: <span id="playermoney">' + player.money + '</span> - days: ' + days + '</p></div>';
		summarydiv.append(d);

		lastHighlightedItem = null;
		lastHighlightedGraph = null;
		RenderGraph(percentsToRender, percents);
	}

	var NextDay = function() {
		++days;

		ServerCommand('NextDay');

		market.NewDay();
		DisplayUI();
	}

	// Hook controls, display the game and start!
	$("#nextday").click(NextDay);
	DisplayUI();
	$(uicontainer).show();
	/*var ru = getOffsetRect(uicontainer);
	var rp = getOffsetRect(photo);
	FB.Canvas.setSize({width:ru.width, height:rp.bottom});*/

};

FinishGame = function() {
	ServerCommand('FinishGame');
	EnterMenu();
}

