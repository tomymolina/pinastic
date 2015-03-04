'use strict';

(function(chrome, async, _) {
	var _boards,
		_settings,
		_pins;


	var parentMenu;

	function wrapRecentBoards(finish) {
		var recent = _.map(_boards.recent(), function(board) {
			return board.toJSON();
		});
		async.each(recent, function(board, callback) {
			var boardMenuProperties = {
				title: board.name,
				id: board.id + '/recent',
				parentId: parentMenu,
				contexts: ['image']
			};
			chrome.contextMenus.create(boardMenuProperties, callback);
		}, finish);
	}

	function wrapSeparator(finish) {
		var separatorProperties = {
			type: 'separator',
			parentId: parentMenu,
			contexts: ['image']
		};
		chrome.contextMenus.create(separatorProperties, finish);
	}

	function wrapAllBoards(finish) {
		var all = _boards.toJSON();
		async.each(all, function(board, callback) {
			//TODO: collaborative mark
			var boardMenuProperties = {
				title: board.name,
				id: board.id + '/all',
				parentId: parentMenu,
				contexts: ['image']
			};
			chrome.contextMenus.create(boardMenuProperties, callback);
		}, finish);
	}

	function createChildrenMenus(callback) {
		async.parallel([wrapRecentBoards, wrapSeparator, wrapAllBoards], callback);
	}

	function createParentMenu(callback) {
		//TODO: create based on the data
		//create menu
		var topMenuProperties = {
			type: 'normal',
			id: Math.floor(Math.random() * 9e9).toString(),
			title: 'Pin this image with Pinastic',
			contexts: ['image']
		};

		parentMenu = chrome.contextMenus.create(topMenuProperties, function() {
			createChildrenMenus(callback);
		});
	}

	function removeParentMenu(callback) {
		if (parentMenu) {
			chrome.contextMenus.remove(parentMenu, callback);
			parentMenu = null;
		} else throw 'INVALID_PARENT_MENU';
	}

	function updateMenus(callback) {


		callback = function() {
			console.info('finished update contextual menu');
		};

		//TODO: create menu
		if (parentMenu) {
			removeParentMenu(function() {
				createParentMenu(callback);
			});
		} else {
			createParentMenu(callback);
		}
	}

	function onContextClicked(menuInfo, tab) {
		//check if it wasn't the parent menu
		if (menuInfo.menuItemId !== parentMenu) {

			var pin = _pins.add({
				board: menuInfo.menuItemId.match(/([\w]{1,})\/(recent|all)/)[1],
				mediaPage: menuInfo.srcUrl,
				mediaUrl: tab.url,
				//TODO: :create function that gets the description using settings
				description: 'GET_DESCRIPTION',
			});

			console.info('pin', pin);

			pin.publish();
		}
	}

	function init(data) {
		_boards = data.boards;
		_pins = data.pins;
		_settings = data.settings;
		updateMenus();
	}

	chrome.contextMenus.onClicked.addListener(onContextClicked);

	window.contextualMenu = {
		init: init,
		update: updateMenus
	};
	
})(window.chrome, window.async, window._);
