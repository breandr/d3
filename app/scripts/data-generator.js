'use strict';

var numSchools = 1500,
  co2Coefficient = 5.13,
  minKwhGen = 4,
  maxKwhGen = 20,
  schools = [],
  i, l;

for (i = 0; i < numSchools; ++i) {
  var school = {
    name: 'School name',
    co2: [],
    gen: [],
    tmp: []
  },
    date = startDate = moment('2012-01-01'),
    endDate = moment('2014-01-01');

  for (date < endDate) {
    var kwhGeneration = Math.floor(Math.rand(minKwhGen, maxKwhGen) * 1000) / 1000,
      co2Saved = kwhGen / co2Coefficient,
      temperature = Math.floor(Math.rand(minTemperature, maxTemperature) * 100) / 100;

    school.co2.push([date, co2Saved]);
    school.gen.push([date, kwhGeneration]);
    school.tmp.push([date, temperature]);
    date.add('days', 1);
  }

  schools.push(school)
}