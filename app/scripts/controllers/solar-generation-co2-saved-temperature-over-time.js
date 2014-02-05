'use strict';

angular.module('d3App').controller('SolarGenerationCo2SavedTemperatureOverTimeCtrl', function ($scope) {
  $scope.initChart = function () {
    var sharedObject = {
      dispatch: d3.dispatch('nationMouseover'),
      yearData: [],
      flyTo: null
    };

    var startYear = 1800;

    // Various accessors that specify the four dimensions of data to visualize.
    function co2Saved(d) {
      return d.co2Saved;
      // return d.temperature;
    }

    function generation(d) {
      return d.generation;
      // return d.co2Saved;
    }

    function totalGeneration(d) {
      return d.totalGeneration;
      // return d.generation;
    }

    function color(d) {
      return d.region;
    }

    function key(d) {
      return d.name;
    }

    // Chart dimensions.
    var margin = {
      top: 10,
      right: 55,
      bottom: 40,
      left: 80
    },
      width = 960 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    // Create the SVG container and set the origin.
    var svg = d3.select('#solarGenCo2TempOverTimeChart')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    // Add the year label; the value is set on transition.
    var label = svg.append('text')
      .attr('class', 'year label')
      .attr('text-anchor', 'start')
      .attr('y', 28)
      .attr('x', 30)
      .text(startYear);

    var co2Scale = d3.scale.log().range([0, width]),
      generationScale = d3.scale.linear().range([height, 0]),
      averageTemperatureScale = d3.scale.linear().range([height, 0]),
      totalGenerationScale = d3.scale.sqrt().range([0, 40]),
      colorScale = d3.scale.category20c();

    // The co2, generation, and average temperature axes.
    var co2Axis = d3.svg.axis().scale(co2Scale).ticks(12, d3.format(',d')).orient('bottom'),
      generationAxis = d3.svg.axis().scale(generationScale).orient('left'),
      averageTemperatureAxis = d3.svg.axis().scale(averageTemperatureScale).orient('right');

    // Add the co2 saved x-axis.
    svg.append('g')
      .attr('class', 'co2-axis x axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(co2Axis)
      svg.append('text')
      .attr('class', 'co2saved-label x label')
      .attr('text-anchor', 'start')
      .attr('x', 5)
      .attr('y', height - 5)
      .text('co2 saved');

    // Add the generation y-axis.
    svg.append('g')
      .attr('class', 'generation-axis y axis')
      .call(generationAxis)
      .append('text')
      .attr('class', 'generation-label y label')
      .attr('text-anchor', 'end')
      .attr('y', 5)
      .attr('dy', '.75em')
      .attr('transform', 'rotate(-90)')
      .text('generation');

    // Add the temperature y-axis.
    svg.append('g')
      .attr('class', 'average-temperature-axis y axis')
      .attr('transform', 'translate(' + width + ', 0)')
      .call(averageTemperatureAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('class', 'temperature-label y label')
      .attr('y', -15)
      .attr('dy', '.75em')
      .style('text-anchor', 'end')
      .text('temperature');


    // Load the data.
    d3.json('/scripts/solar-gen-co2-savings-data.json', function (error, data) {
      var maxYear = 2009,
        minCo2Saved = d3.min(data, function (d) {
          return d3.min(d.co2Saved, function (c) {
            return c[1];
          });
        }),
        maxCo2Saved = d3.max(data, function (d) {
          return d3.max(d.co2Saved, function (c) {
            return c[1];
          });
        }),
        minGeneration = d3.min(data, function (d) {
          return d3.min(d.generation, function (c) {
            return c[1];
          });
        }),
        maxGeneration = d3.max(data, function (d) {
          return d3.max(d.generation, function (c) {
            return c[1];
          });
        }),
        maxTotalGeneration = d3.max(data, function (d) {
          return getTotalGeneration(d.generation, maxYear);
        }),
        minTemperature = d3.min(data, function (d) {
          return d3.min(d.temperature, function (c) {
            return c[1];
          });
        }),
        maxTemperature = d3.max(data, function (d) {
          return d3.max(d.temperature, function (c) {
            return c[1];
          });
        });

      co2Scale.domain([minCo2Saved, maxCo2Saved]);
      generationScale.domain([minGeneration, maxGeneration]);
      totalGenerationScale.domain([0, maxTotalGeneration]);
      averageTemperatureScale.domain([minTemperature, maxTemperature]);

      //redraw axes
      svg.select('.co2-axis')
        .call(co2Axis);
      svg.select('.generation-axis')
        .call(generationAxis);
      svg.select('.average-temperature-axis')
        .call(averageTemperatureAxis);

      // A bisector since many nation's data is sparsely-defined.
      var bisect = d3.bisector(function (d) {
        return d[0];
      });

      // Positions the dots based on data.
      function position(dot) {
        dot.attr('cx', function (d) {
          return co2Scale(co2Saved(d));
        })
          .attr('cy', function (d) {
            return generationScale(generation(d));
          })
          .attr('r', function (d) {
            return totalGenerationScale(totalGeneration(d));
          });
      }

      // Defines a sort order so that the smallest dots are drawn on top.
      function order(a, b) {
        return totalGeneration(b) - totalGeneration(a);
      }

      function getTotalGeneration(generation, year) {
        var totalGeneration = 0;

        for (var i = 0; i < generation.length && year >= generation[i][0]; ++i) {
          totalGeneration += generation[i][1];
        }

        return totalGeneration;
      }

      function getAverageTemperature(year) {
        return 150000 - year*80;
      }

      // Interpolates the dataset for the given (fractional) year.
      function interpolateData(year) {
        sharedObject.yearData = data.map(function (d) {
          return {
            name: d.name,
            region: d.region,
            temperature: interpolateValues(d.temperature, year),
            generation: interpolateValues(d.generation, year),
            totalGeneration: getTotalGeneration(d.generation, year),
            co2Saved: interpolateValues(d.co2Saved, year),
            lat: d.lat,
            lon: d.lon
          };
        });

        return sharedObject.yearData;
      }

      var averageTemperature = svg.append('rect')
        .attr('class', 'temperature column')
        .style('fill', 'red')
        .attr('x', width - 4)
        .attr('y', averageTemperatureScale(getAverageTemperature(startYear)))
        .attr('height', height - averageTemperatureScale(getAverageTemperature(startYear)))
        .attr('width', 3);

      // Add a dot per nation. Initialize the data at 1800, and set the colors.
      var dot = svg.append('g')
        .attr('class', 'dots')
        .selectAll('.dot')
        .data(interpolateData(startYear))
        .enter().append('circle')
        .attr('class', 'dot')
        .style('fill', function (d) {
          return colorScale(color(d));
        })
        .call(position)
        .sort(order)
        .on('mouseover', function (d) {
          sharedObject.dispatch.nationMouseover(d);
        })
        .on('click', function (d) {
          d = null;
        });

      // Add a title.
      dot.append('title')
        .text(function (d) {
          return d.name;
        });

      // Updates the display to show the specified year.
      function displayYear(year) {
        averageTemperature
          .transition()
          .duration(100)
          .attr('y', averageTemperatureScale(getAverageTemperature(year)))
          .attr('height', height - averageTemperatureScale(getAverageTemperature(year)))

        dot.data(interpolateData(year), key)
          .transition()
          .duration(100)
          .call(position)
          .sort(order);
        label.text(Math.round(year));
      }

      // Finds (and possibly interpolates) the value for the specified year.
      function interpolateValues(values, year) {
        var i = bisect.left(values, year, 0, values.length - 1),
          a = values[i];
        if (i > 0) {
          var b = values[i - 1],
            t = (year - a[0]) / (b[0] - a[0]);
          return a[1] * (1 - t) + b[1] * t;
        }
        return a[1];
      }

      sharedObject.dispatch.on('nationMouseover.d3', function (nationObject) {
        dot.style('fill', function (d) {
          if (typeof nationObject !== 'undefined' && d.name === nationObject.name) {
            return '#00FF00';
          }

          return colorScale(color(d));
        });
      });

      function update() {
        var year = startYear;

        return function () {
          displayYear(year);
          if (year++ === 2009) {
            clearInterval(updater);
          }
        };
      }

      var updater = setInterval(update(), 100);
    });

    $(window).trigger('resize');
  };
  $scope.initChart();
});