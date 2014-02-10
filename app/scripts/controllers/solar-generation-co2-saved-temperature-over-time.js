'use strict';

angular.module('d3App').controller('SolarGenerationCo2SavedTemperatureOverTimeCtrl', function ($scope) {
    $scope.initChart = function () {
      // Chart dimensions.
      var margin = {
        top: 10,
        right: 55,
        bottom: 40,
        left: 80
      },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom,
        // Scales
        xScale = d3.scale.linear().range([0, width]),
        yScale = d3.scale.linear().range([height, 0]),
        columnScale = d3.scale.linear().range([height, 0]),
        radiusScale = d3.scale.sqrt().range([0, 40]),
        colorScale = d3.scale.category20c(),
        // The co2, generation, and average temperature axes.
        xAxis = d3.svg.axis().scale(xScale).orient('bottom'),
        yAxis = d3.svg.axis().scale(yScale).orient('left'),
        columnAxis = d3.svg.axis().scale(columnScale).orient('right'),
        // Create the SVG container and set the origin.
        svg = d3.select('#solarGenCo2TempOverTimeChart')
          .attr('width', width + margin.left + margin.right)
          .attr('height', height + margin.top + margin.bottom)
          .append('g')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')'),
        // Add the date label; the value is set on transition.
        label = svg.append('text')
          .attr('class', 'date label')
          .attr('text-anchor', 'start')
          .attr('y', 10)
          .attr('x', 30);

      // Add the co2 saved x-axis.
      svg.append('g')
        .attr('class', 'co2-axis x axis')
        .attr('transform', 'translate(0,' + height + ')')
        .call(xAxis);
      svg.append('text')
        .attr('class', 'co2saved-label x label')
        .attr('text-anchor', 'start')
        .attr('x', 5)
        .attr('y', height - 5)
        .text('consumption per capita');

      // Add the generation y-axis.
      svg.append('g')
        .attr('class', 'generation-axis y axis')
        .call(yAxis)
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
        .call(columnAxis)
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('class', 'temperature-label y label')
        .attr('y', -15)
        .attr('dy', '.75em')
        .style('text-anchor', 'end')
        .text('temperature');

      // Load the data.
      d3.json('/scripts/data.json', function (error, data) {
          // Various accessors that specify the four dimensions of data to visualize.
          function x(d) {
            return d.consumption / d.population;
          }

          function y(d) {
            return d.generation;
          }

          function radius(d) {
            return d.totalGeneration;
          }

          function column(date) {
            var totalTemperature = 0,
              numRecords = 0;

            for (var i = 0, l = data.length; i < l; ++i) {
              var school = data[i],
                dateDataIndex = dateBisector.left(school.data, date),
                dateData;

              if (dateDataIndex !== 0) {
                dateData = school.data[dateDataIndex];
                totalTemperature += dateData.tmp;
                ++numRecords;
              }
            }

            return numRecords > 0 ? parseFloat((totalTemperature / numRecords).toFixed(2)) : 0;
          }

          function color(d) {
            return d.state;
          }

          function key(d) {
            return d.name;
          }

          // updateBubbles the bubbles based on data.
          function updateBubble(bubbles) {
            bubbles.attr('cx', function (d) {
              return xScale(x(d));
            })
              .attr('cy', function (d) {
                return yScale(y(d));
              })
              .attr('r', function (d) {
                return radiusScale(radius(d));
              });
          }

          // Defines a sort order so that the smallest bubbles are drawn on top.
          function order(a, b) {
            return radius(b) - radius(a);
          }

          function getTotalGeneration(data, index) {
            var record = data[index],
              prevRecord = index === 0 ? null : data[index - 1],
              totalGeneration = prevRecord === null ? record.gen : record.gen + prevRecord.totalGeneration;

            return parseFloat(totalGeneration.toFixed(3));
          }

          // Interpolates the dataset for the given (fractional) date.
          function interpolateData(date) {
            return data.map(function (d) {
              return {
                name: d.name,
                state: d.state,
                population: d.population,
                generation: interpolateValues(d.data, date, 'gen'),
                consumption: interpolateValues(d.data, date, 'con'),
                co2Saved: interpolateValues(d.data, date, 'co2'),
                temperature: interpolateValues(d.data, date, 'tmp'),
                totalGeneration: interpolateValues(d.data, date, 'totalGeneration')
              };
            });
          }

          // Finds (and possibly interpolates) the value for the specified date.
          function interpolateValues(values, date, property) {
            var index = dateBisector.left(values, date),
              dateData = values[index];

            if (index > 0) {
              var b = values[index - 1],
                t = (date - dateData.date) / (b.date - dateData.date);

              return dateData[property] * (1 - t) + b[property] * t;
            }

            return dateData[property];
          }

          // Updates the display to show the specified date.
          function displayYear(date) {
            averageTemperatureRect
              .transition()
              .duration(updateFrequency)
              .attr('y', columnScale(column(date)))
              .attr('height', height - columnScale(column(date)));

            bubbles.data(interpolateData(date), key)
              .transition()
              .duration(updateFrequency)
              .call(updateBubble)
              .sort(order);

            label.text(moment(date).format('Do MMM YYYY'));
          }

          function update(date) {
            displayYear(date);
            // date = new Date(date.setMonth(date.getMonth() + 1));
            date = new Date(date.setDate(date.getDate() + 1));

            if (date.getTime() < maxDate.getTime()) {
              setTimeout(function () {
                update(date);
              }, updateFrequency);
            }
          }

          //manipulate data from the server
          for (var i = 0, l = data.length; i < l; ++i) {
            var record = data[i];

            for (var i2 = 0, l2 = record.data.length; i2 < l2; ++i2) {
              var dateArray = record.data[i2].date.match(/\d{2}/g),
                year = '20' + dateArray[0],
                month = dateArray[1] - 1,
                day = dateArray[2] - 1,
                dateData = record.data[i2];

              dateData.date = new Date(year, month, day);
              dateData.totalGeneration = getTotalGeneration(record.data, i2);
            }
          }

          var minDate = d3.min(data, function (d) {
            return d.data[0].date;
          }),
            maxDate = d3.max(data, function (d) {
              return d.data[0].date;
            }),
            // minCo2Saved = d3.min(data, function (d) {
            //   return d3.min(d.data, function (d2) {
            //     return d2.co2;
            //   });
            // }),
            // maxCo2Saved = d3.max(data, function (d) {
            //   return d3.max(d.data, function (d2) {
            //     return d2.co2;
            //   });
            // }),
            minConsumptionPerStudent = d3.min(data, function (d) {
              return d3.min(d.data, function (d2) {
                return d2.con / d.population;
              });
            }),
            maxConsumptionPerStudent = d3.max(data, function (d) {
              return d3.max(d.data, function (d2) {
                return d2.con / d.population;
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
              return d3.max(d.data, function (d2) {
                return d2.totalGeneration;
              });
            }),
            minTemperature = d3.min(data, function (d) {
              return d3.min(d.data, function (d2) {
                return d2.tmp;
              });
            }),
            maxTemperature = d3.max(data, function (d) {
              return d3.max(d.data, function (d2) {
                return d2.tmp;
              });
            }),
            updateFrequency = 500;

          xScale.domain([minConsumptionPerStudent, maxConsumptionPerStudent]);
          yScale.domain([minGeneration, maxGeneration]);
          radiusScale.domain([0, maxTotalGeneration]);
          columnScale.domain([minTemperature - 5, maxTemperature]);

          //add date label
          svg.select('.date.label')
            .text(moment(minDate).format('Do MMM YYYY'));

          //redraw axes
          svg.select('.co2-axis')
            .call(xAxis);
          svg.select('.generation-axis')
            .call(yAxis);
          svg.select('.average-temperature-axis')
            .call(columnAxis);

          // A bisector since many nation's data is sparsely-defined.
          var dateBisector = d3.bisector(function (d) {
            return d.date;
          });

          var averageTemperatureRect = svg.append('rect')
            .attr('class', 'temperature column')
            .style('fill', 'red')
            .attr('x', width - 4)
            .attr('y', columnScale(column(minDate)))
            .attr('height', height - columnScale(column(minDate)))
            .attr('width', 3);

          // Add a bubbles per nation. Initialize the data at 1800, and set the colors.
          var bubbles = svg.append('g')
            .attr('class', 'bubbles')
            .selectAll('.bubbles')
            .data(interpolateData(minDate))
            .enter().append('circle')
            .attr('class', 'bubbles')
            .style('fill', function (d) {
              return colorScale(color(d));
            })
            .call(updateBubble)
            .sort(order)
            .on('mouseover', function (d) {
              bubbleMouseOver(d);
            })
            .on('click', function (d) {
              d = null;
            });

          // Add a title.
          bubbles.append('title')
            .text(function (d) {
              return d.name;
            });

          function bubbleMouseOver(bubble) {
            bubbles.style('fill', function (d) {
              if (typeof bubble !== 'undefined' && d.name === bubble.name) {
                return '#00FF00';
              }

              return colorScale(color(d));
            });
          });

        update(minDate);
      });

    $(window).trigger('resize');
  };

  $scope.initChart();
});