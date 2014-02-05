'use strict';

$(window).on('resize', function () {
  d3.selectAll('.d3-chart')
    .attr('height', function () {
      var $el = $(this),
        aspect = $el.attr('width') / $el.attr('height'),
        targetWidth = $el.parent().width();

      return targetWidth / aspect;
    })
    .attr('width', function () {
      return $(this).parent().width();
    });
});