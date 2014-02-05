'use strict';

angular.module('d3App').controller('SolarGenerationCo2SavedTemperatureOverTimeCtrl', function ($scope) {
  $scope.initChart = function () {
    var sharedObject = {
      dispatch: d3.dispatch('nationMouseover'),
      yearData: [],
      flyTo: null
    };

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
      return d.state;
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

    // Add the date label; the value is set on transition.
    var label = svg.append('text')
      .attr('class', 'date label')
      .attr('text-anchor', 'start')
      .attr('y', 10)
      .attr('x', 30);

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
      .call(co2Axis);
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
    d3.json('/scripts/data.json', function (error, data) {
      //convert date from string to date
      for (var i = 0, l = data.length; i < l; ++i) {
        for (var i2 = 0, l2 = data[i].data.length; i2 < l2; ++i2) {
          var dateArray = data[i].data[i2].date.match(/\d{2}/g),
            year = '20' + dateArray[0],
            month = dateArray[1] - 1,
            day = daeArray[2] - 1;

          data[i].data[i2].date = new Date(year, month, day);
        }
      }

      var minDate = d3.min(data, function (d) {
        return d.data[0].date;
      }),
        maxDate = d3.max(data, function (d) {
          return d.data[0].date;
        }),
        minCo2Saved = d3.min(data, function (d) {
          return d3.min(d.data, function (d2) {
            return d2.co2;
          });
        }),
        maxCo2Saved = d3.max(data, function (d) {
          return d3.max(d.data, function (d2) {
            return d2.co2;
          });
        }),
        minGeneration = d3.min(data, function (d) {
          return d3.min(d.data, function (d2) {
            return d2.gen;
          });
        }),
        maxGeneration = d3.max(data, function (d) {
          return d3.max(d.data, function (d2) {
            return d2.gen;
          });
        }),
        maxTotalGeneration = d3.max(data, function (d) {
          return getTotalGeneration(d, maxDate);
        }),
        minTemperature = d3.min(data, function (d) {
          return d3.min(d.data, function (d2) {
            return d2.tmp;
          });
        }),
        maxTemperature = d3.max(data, function (d) {
          return d3.min(d.data, function (d2) {
            return d2.tmp;
          });
        });

      console.log(minDate, maxDate);

      co2Scale.domain([minCo2Saved, maxCo2Saved]);
      generationScale.domain([minGeneration, maxGeneration]);
      totalGenerationScale.domain([0, maxTotalGeneration]);
      averageTemperatureScale.domain([minTemperature, maxTemperature]);

      //add date label
      svg.select('.date.label')
        .text(moment(minDate).format('Do MMM YYYY'));

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

      // updateBubbles the bubbles based on data.
      function updateBubble(bubble) {
        bubble.attr('cx', function (d) {
          return co2Scale(co2Saved(d));
        })
          .attr('cy', function (d) {
            return generationScale(generation(d));
          })
          .attr('r', function (d) {
            return totalGenerationScale(totalGeneration(d));
          });
      }

      // Defines a sort order so that the smallest bubbles are drawn on top.
      function order(a, b) {
        return totalGeneration(b) - totalGeneration(a);
      }

      function getTotalGeneration(generation, date) {
        var totalGeneration = 0;

        for (var i = 0; i < generation.length && date >= generation[i][0]; ++i) {
          totalGeneration += generation[i][1];
        }

        return totalGeneration;
      }

      function getAverageTemperature(date) {
        return 150000 - date * 50;
      }

      // Interpolates the dataset for the given (fractional) date.
      function interpolateData(date) {
        sharedObject.yearData = data.map(function (d) {
          return {
            name: d.name,
            state: d.state,
            temperature: interpolateValues(d.tmp, date),
            generation: interpolateValues(d.gen, date),
            totalGeneration: getTotalGeneration(d.gen, date),
            co2Saved: interpolateValues(d.co2, date)
          };
        });

        return sharedObject.yearData;
      }

      var averageTemperature = svg.append('rect')
        .attr('class', 'temperature column')
        .style('fill', 'red')
        .attr('x', width - 4)
        .attr('y', averageTemperatureScale(getAverageTemperature(minDate)))
        .attr('height', height - averageTemperatureScale(getAverageTemperature(minDate)))
        .attr('width', 3);

      // Add a bubble per nation. Initialize the data at 1800, and set the colors.
      var bubble = svg.append('g')
        .attr('class', 'bubbles')
        .selectAll('.bubble')
        .data(interpolateData(minDate))
        .enter().append('circle')
        .attr('class', 'bubble')
        .style('fill', function (d) {
          return colorScale(color(d));
        })
        .call(updateBubble)
        .sort(order)
        .on('mouseover', function (d) {
          sharedObject.dispatch.nationMouseover(d);
        })
        .on('click', function (d) {
          d = null;
        });

      // Add a title.
      bubble.append('title')
        .text(function (d) {
          return d.name;
        });

      // Updates the display to show the specified date.
      function displayYear(date) {
        averageTemperature
          .transition()
          .duration(100)
          .attr('y', averageTemperatureScale(getAverageTemperature(date)))
          .attr('height', height - averageTemperatureScale(getAverageTemperature(date)));

        bubble.data(interpolateData(date), key)
          .transition()
          .duration(100)
          .call(updateBubble)
          .sort(order);
        label.text(Math.round(date));
      }

      // Finds (and possibly interpolates) the value for the specified date.
      function interpolateValues(values, date) {
        var i = bisect.left(values, date, 0, values.length - 1),
          a = values[i];
        if (i > 0) {
          var b = values[i - 1],
            t = (date - a[0]) / (b[0] - a[0]);
          return a[1] * (1 - t) + b[1] * t;
        }
        return a[1];
      }

      sharedObject.dispatch.on('nationMouseover.d3', function (nationObject) {
        bubble.style('fill', function (d) {
          if (typeof nationObject !== 'undefined' && d.name === nationObject.name) {
            return '#00FF00';
          }

          return colorScale(color(d));
        });
      });

      function update() {
        var date = minDate;

        return function () {
          displayYear(date);
          if (date++ === 2009) {
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