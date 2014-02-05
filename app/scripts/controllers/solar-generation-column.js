'use strict';

angular.module('d3App')
  .controller('SolarGenerationCo2SavedTemperatureOverTimeCtrl', function ($scope) {
    $scope.initChart = function () {
      d3.json('/scripts/solar-gen-co2-savings-data.json', function (error, data) {
        var margin = {
          top: 20,
          right: 30,
          bottom: 30,
          left: 40
        },
          outerWidth = 960,
          outerHeight = 500,
          innerWidth = outerWidth - margin.left - margin.right,
          innerHeight = outerHeight - margin.top - margin.bottom;

        var x = d3.scale.ordinal()
          .rangeRoundBands([0, innerWidth], 0.1);

        x.domain(data.map(function (d) {
          return d.date;
        }));

        var y = d3.scale.linear()
          .range([innerHeight, 0]);

        y.domain([
          0, d3.max(data, function (d) {
            return d.generation;
          })
        ]);

        var xAxis = d3.svg.axis()
          .scale(x)
          .orient('bottom');

        var yAxis = d3.svg.axis()
          .scale(y)
          .orient('left');

        var yAxisRight = d3.svg.axis()
          .scale(y)
          .orient('right');

        var chart = d3.select('#solarGenCo2TempOverTimeChart')
          .attr('width', innerWidth + margin.left + margin.right)
          .attr('height', innerHeight + margin.top + margin.bottom)
          .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        chart.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + innerHeight + ')')
          .call(xAxis);

        chart.append('g')
          .attr('class', 'y axis')
          .call(yAxis)
          .append('text')
          .attr('transform', 'rotate(-90)')
          .attr('y', 6)
          .attr('dy', '.71em')
          .style('text-anchor', 'end')
          .text('Temperature');


        chart.append('g')
          .attr('class', 'y axis')
          .attr('transform', 'translate(' + innerWidth + ',0)')
          .call(yAxisRight)
          .append('text')
          .attr('transform', 'rotate(-90)')
          .attr('y', -12)
          .attr('dy', '.71em')
          .style('text-anchor', 'end')
          .text('Temperature2');

        chart.selectAll('.bar')
          .data(data)
          .enter().append('rect')
          .attr('class', 'bar')
          .attr('x', function (d) {
            return x(d.date);
          })
          .attr('y', function (d) {
            return y(d.generation);
          })
          .attr('height', function (d) {
            return innerHeight - y(d.generation);
          })
          .attr('width', x.rangeBand());

        $(window).trigger('resize');
      });
    };

    $scope.initChart();
  });