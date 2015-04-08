// Client-side code
/* jshint browser: true, jquery: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */

function shorten() {
	"use strict";
	var input_url, output_url;
	$("#generate").on("click", function() {
		input_url = $("#url").val();
		$.post("/shorten", {input_url: input_url})		
		.done(function(res) {
		    $("#result").empty();
		    output_url = $("<p>").text(res);
		    $("#result").append(output_url);
		});
	});
}

function view() {
	"use strict";
	var list, link, tag;
	$("#popular").on("click", function() {
		list = $("<ol>");
		$("#top10").empty();
		$.getJSON("/top10", function(res) {
			for (var i = 0; i < res.length; i = i+2) {
				link = $("<li>");
				tag = $("<a>");
				tag.attr("href", res[i]);
				tag.text(res[i]);
				link.append(tag);
				list.append(link.append(" : " + res[i+1]));
			}
			$("#top10").append(list);
		});
	});
}

var main = function() {
	"use strict";
	shorten();
	view();
};


$(document).ready(main);