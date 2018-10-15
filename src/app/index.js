import React, { Component } from 'react';
import { render } from 'react-dom';
import { geoMercator, geoPath } from 'd3-geo';
import { max, min, range } from 'd3-array';
import { select, selectAll, event } from 'd3-selection';
import { scaleThreshold, scaleLinear, invertExtent } from 'd3-scale';
import { axisBottom } from 'd3-axis';
import { json } from 'd3-fetch';
import { transition } from 'd3-transition';
import { schemePurples, schemeGreens } from 'd3-scale-chromatic';
import * as topojson from "topojson-client";

import './styles/main.scss';

export default class Chloropleth extends Component {
  constructor(props) {
    super(props)
    this.state = {
       h: 600,
       w: 1200,
       countyData: [],
       educationData: [],
       countyStates: [],
       p: 50,
    };
    this.createChloropleth = this.createChloropleth.bind(this);
    this.fetchData = this.fetchData.bind(this);
  }
  componentDidMount() {
    console.log('component mounted!');
    let countyLink = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json';
    let educationLink = 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json';
    this.fetchData(countyLink);
    this.fetchData(educationLink);
    // note that this only updates on refresh
  };

  componentDidUpdate() {
    console.log('component updated!')
    let countyDataStatus = this.state.countyData.length,
        educationDataStatus = this.state.educationData.length;
    // console.log({educationDataStatus});
    if (countyDataStatus && educationDataStatus) {
      this.createChloropleth(this.state.countyData, this.state.countyStates, this.state.educationData)
    }
  };

  fetchData(address) {
    json(address, (error, data) => {
      if (error) throw error;
    })
      .then(data => {
        if (data.hasOwnProperty('type')) {
          this.setState({ 
            countyData: topojson.feature(data, data.objects.counties).features,
            countyStates: topojson.mesh(data, data.objects.states, (a,b) => (
              a.id !== b.id
            ))
          })
        } else this.setState({ educationData: data })
      })
  }

  createChloropleth(countyData, countyStates, educationData) {
    console.log('building ultimateData...');
    console.log({ countyData, countyStates, educationData });
    let fipsArray = [];
    educationData.map(d => fipsArray.push(d.fips));

    let ultimateData = [];
    fipsArray.map(d => {// d here is strictly fips value
      let dFips = d;
      // get index number of id from countyData
      let objFromCountyData = countyData.filter(d => d.id == dFips);
      // that element is the matching object in educationData
      let objFromEducationData = educationData.filter(d => d.fips == dFips);
      // console.log({ id: objFromEducationData[0], fip: objFromCountyData[0] });
      let mergedIdFip = {...objFromEducationData[0], ...objFromCountyData[0]};
      ultimateData = ultimateData.concat(mergedIdFip);
    })
    console.log(ultimateData);

    const node = this.node,
          projection = geoMercator(),
          // path = geoPath().projection(projection),
          path = geoPath(),
          maxEduc = max(educationData.map(d => d.bachelorsOrHigher)),
          minEduc = min(educationData.map(d => d.bachelorsOrHigher));
    
    console.log({ maxEduc, minEduc });
    // console.log('d3.range: ', range(minEduc, maxEduc, (maxEduc - minEduc)/8));
    // console.log('d3.range from fcc: ', range(2.6, 75.1, (75.1 - 2.6) / 8));

    const fillDomain = range(minEduc, maxEduc, (maxEduc - minEduc)/8)    
    const fill = scaleThreshold()
                  .domain(fillDomain)
                  .range(schemePurples[9]);
                  // .range(schemeGreens[9]);

    const tooltip = select('#tooltip');
    const handleMouseover = (d) => {
      tooltip.transition()
        .duration(100)
        .style('opacity', 0.9)
        .style('transform', 'scale(1) translate(-103.5px, -35px)')
        .style('stroke', 'lightslategray')
        .attr('data-education', d.bachelorsOrHigher)
      tooltip.html(`
        ${d.area_name}, ${d.state}: ${d.bachelorsOrHigher}%
      `)
    };
    const handleMouseMove = () => {
      tooltip.style('top', `${event.pageY}`)
        .style('left', event.pageX)
    };
    const handleMouseOut = () => {
      tooltip.transition()
        .duration(50)
        .style('opacity', 0)
        .style('transform', 'scale(0)')
        .style('stroke', 'none')
    };
    
    // rendering counties
    select(node).append('g')
      .attr('class', 'counties')
      .selectAll('path')
      .data(ultimateData)
      .enter().append('path')
          .attr('d', path)
          .attr('id', d => d.id)
          .attr('class', 'county')
          .style('fill', d => fill(d.bachelorsOrHigher))
          .attr('data-fips', d => d.id)
          .attr('data-education', d => d.bachelorsOrHigher)
          .on('mouseover', handleMouseover)
          .on('mousemove', handleMouseMove)
          .on('mouseout', handleMouseOut)
    
    // rendering state borders
    select(node).append('path')
      .datum(countyStates)
      .attr('class', 'states')
      .attr('d', path);
    
    const legendStart = 600; const legendEnd = 1000;
    const xLegend = scaleLinear()
                    .domain([minEduc, maxEduc])
                    .range([legendStart, legendEnd]);

    const xAxis = axisBottom(xLegend)
                    .tickFormat(d => Math.round(d)+'%')
                    .tickValues(fillDomain)
    
    let rangeExtent = []; let legendHeight = 10;
    select(node).append('g')
      .attr('id', 'legend').selectAll('rect')
      // console.log('fill.range()', fill.range())
      .data(fill.range().map(d => {
        rangeExtent = fill.invertExtent(d); 
        // !rangeExtent[0] ? rangeExtent[0] = xLegend.domain()[0] : '';
        !rangeExtent[0] ? rangeExtent[0] = minEduc : '';
        // !rangeExtent[1] ? rangeExtent[1] = xLegend.domain()[1] : '';
        !rangeExtent[1] ? rangeExtent[1] = maxEduc : '';
        // console.log({rangeExtent})
        // returns a two element array [prevStep, nextStep]
        return rangeExtent;
      }))
      .enter().append('rect')
      .attr('height', legendHeight)
        .attr('x', d => xLegend(d[0]))
        .attr('y', -legendHeight)
        .attr('width', (legendEnd - legendStart)/8)
        .attr('fill', d => fill(d[0]))
    
    select('#legend')
      .call(xAxis)
      .style('transform', `translateY(${25}px)`)

  };
  
  render() {
    return (
      <div>
        <h1 id='title'>US Educational Attainment</h1>
        <h3 id='subtitle'>Percentage of adults age 25 and older with bachelor's degree or higher (2010)-(2014)</h3>
        <svg ref={node => this.node = node}
          viewBox={`0 0 ${this.state.w} ${this.state.h}`}
          preserveAspectRatio='xMidYMid meet'>
        </svg>
        <div id='tooltip'></div>
      </div>
    )
  }
}

render(
  <Chloropleth />,
  document.getElementById('root')
);