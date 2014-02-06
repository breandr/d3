(function () {
  'use strict';

  var numSchools = 150,
    co2Coefficient = 5.13,
    minKwhGen = 4,
    maxKwhGen = 20,
    minConsumption = 5,
    maxConsumption = 25,
    minPopulation = 300,
    maxPopulation = 5000,
    minTemperature = 20,
    maxTemperature = 35;
  window.schools = [];

  function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  for (var i = 0; i < numSchools; ++i) {
    var school = {
      name: 'School' + i,
      state: Math.round(random(1, 7)),
      population: Math.round(random(minPopulation, maxPopulation)),
      data: []
    },
      endDate = moment().date(0), //get last day of last month
      date = moment(randomDate(new Date('2012-01-01'), endDate.toDate())); //get date between 01 Jan 2012 and last day of last month

    for (; date < endDate; date.add('days', 1)) {
      var kwhGen = parseFloat(random(minKwhGen, maxKwhGen).toFixed(3)),
        co2Saved = parseFloat((kwhGen / co2Coefficient).toFixed(3)),
        temperature = parseFloat(random(minTemperature, maxTemperature).toFixed(3)),
        consumption = parseFloat(random(minConsumption, maxConsumption).toFixed(3)),
        dateString = date.format('YYMMDD');

      school.data.push({
        date: dateString,
        gen: kwhGen,
        con: consumption,
        co2: co2Saved,
        tmp: temperature
      });
    }

    window.schools.push(school);
  }
}());