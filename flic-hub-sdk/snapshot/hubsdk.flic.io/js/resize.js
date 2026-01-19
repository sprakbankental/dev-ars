$(function () {

	var isResizingVertical = false;
	var isResizingHorizontal = false;
	var x = 300;
	var y = 300;

	$sliderVertical = $('.slider-vertical');
	$sliderHorizontal = $('.slider-horizontal');
	$sliderHorizontalWrap = $('.slider-horizontal-wrap');

	var updateVertical = function(tx) {
		x = tx;
		if (x < 200) {
			x = 200;
		}

		if (x > $(window).width() - 300) {
			x = $(window).width() - 300
		}

		$sliderVertical.css({left: x-3});

		$('.pane-left-wrap').css({width: x});
		$('.pane-right-wrap').css({paddingLeft: x});
		$('.pane-bottom-wrap').css({paddingLeft: x});
		$('.slider-horizontal-wrap').css({paddingLeft: x});
	}

	var updateHorizontal = function(ty) {
		y = ty;
		
		

		if (y < 37) {
			y = 37;
		}

		if (y > $(window).height() - 200)
		{
			y = $(window).height()	- 200;
		}

		$sliderHorizontalWrap.css({bottom: y-3});

		$('.pane-bottom-wrap').css({height: y-1});

		$('.pane-bottom-wrap .console').css({height: y - 113});

		$('.pane-right-wrap').css({paddingBottom: y});

	}

	
	$sliderVertical.mousedown(function (e) {
		$sliderVertical.addClass('active');
		isResizingVertical = true;
		$('body').css({'user-select': 'none'});
	});

	$sliderHorizontal.mousedown(function (e) {
		$sliderHorizontal.addClass('active');
		isResizingHorizontal = true;
		$('body').css({'user-select': 'none'});
	});


	$(document).mousemove(function (e) {
		if (isResizingVertical) {
			updateVertical(e.originalEvent.pageX);
		}

		if (isResizingHorizontal) {
			updateHorizontal($(window).height() - e.originalEvent.pageY);
		}
	});

	$(document).mouseup(function (e) {
		if (isResizingVertical) {
			updateVertical(e.originalEvent.pageX);
			$sliderVertical.removeClass('active');
			isResizingVertical = false;
		}

		if (isResizingHorizontal) {
			updateHorizontal($(window).height() - e.originalEvent.pageY);
			$sliderHorizontal.removeClass('active');
			isResizingHorizontal = false;
		}

		$('body').css({'user-select': 'auto'});
	});

	$(window).resize(function () {
		updateHorizontal(y);
		updateVertical(x);

		var leftHeight = $('.pane-left').height();

		var filesHeight = $('.pane-left').height() - $('.current-hub').height() - $('.packages').height() - 155;

		$('.files').css({"height": filesHeight + "px"});


	});

});



