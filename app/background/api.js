'use strict';

(function(chrome, $, _) {

	/**
	 * Constants
	 */
	var PINTEREST_URL = 'http://www.pinterest.com/pin/create/bookmarklet/?extension=true',
		SESSION_SECRET = _.random(0, 2e9);

	window.chrome.webRequest.onHeadersReceived.addListener(
		function(info) {	
			_.remove(info.responseHeaders, function(header) {
				return header.name.toLowerCase() === 'x-frame-options' || header.name.toLowerCase() === 'frame-options';
			});

			return {
				responseHeaders: info.responseHeaders
			};
		}, {
			urls: ['*://*.pinterest.com/*'], // Pattern to match pinterest pages
			types: ['sub_frame']
		}, ['blocking', 'responseHeaders']
	);


	/**
	 * Private methods
	 */

	function loadInIframe(url, callback) {
		if (typeof url !== 'string') {
			throw new Error('Invalid loadInIframe url');
		}

		var $iframe = $('<iframe>', {
			src: url
		});

		if (typeof callback === 'function') {
			$iframe.on('load', function() {
				callback.call($(this), $iframe);

			});
		}

		$('body').append($iframe);

		return $iframe;
	}

	var $iframe;

	function sendAction(action, input, callback) {
		var sendArguments = arguments;

		//TODO: Two sync requests

		if (!$iframe) {
			loadInIframe(PINTEREST_URL, function($ifr) {
				$iframe = $ifr;
				sendAction.apply(this, sendArguments);
			});
		} else {
			var request = {
				action: action,
				data: input,
				SESSION_SECRET: SESSION_SECRET
			};

			chrome.runtime.sendMessage(request, function(res) {
				res = res instanceof Object ? res : {};
				callback(res.error, res.data);
			});
		}
	}

	/**
	 * API methods
	 */


	function getBoards(options, callback) {

		if (typeof options === 'function') {
			callback = options;
			options = null;
		}

		if (typeof callback !== 'function') {
			throw new Error('Invalid callback function');
		}

		if (options instanceof Object && options.reloadIframe === true) {
			if ($iframe) $iframe.remove();
		}

		sendAction('get-boards', null, callback);

	}

	function publishPin(pin, callback) {

		if (pin instanceof Object === false || typeof callback !== 'function') {
			throw new Error('Invalid arguments. Arguments: pin <Object>, callback <Function>');
		}

		if (typeof pin.board !== 'string' || typeof pin.mediaUrl !== 'string') {
			throw new Error('Pin required arguments: board <String>, mediaUrl <String>.');
		}

		if (typeof pin.description !== 'string') {
			pin.description = ' ';
		}

		if (typeof pin.mediaPage !== 'string') {
			pin.mediaPage = pin.mediaUrl;
		}

		sendAction('publish-pin', pin, callback);
	}

	/**
	 * Public interface
	 */
	window.PinterestAPI = {
		publishPin: publishPin,
		getBoards: getBoards,
	};

})(window.chrome, window.$, window._);
