import React, { Component } from 'react';
import { render } from 'react-dom';
import { geoMercator, geoPath } from 'd3-geo';
import { select } from 'd3-selection';
import { scaleLog } from 'd3-scale';
import { json } from 'd3-fetch';
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
    // this.handleErrors = this.handleErrors.bind(this);
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
    console.log({educationDataStatus});
    if (countyDataStatus && educationDataStatus) {
      this.createChloropleth(this.state.countyData, this.state.countyStates, this.state.educationData)
    }
  };

  // handleErrors(response) {
  //   if (!response.ok) throw Error(response.statusText);
  //   else return response
  // }

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
    console.log('creating chloropleth...');
    console.log({ countyData, countyStates, educationData });
    const node = this.node,
          projection = geoMercator(),
          // path = geoPath().projection(projection),
          path = geoPath();
      
    const fill = scaleLog()
                  .domain([10, 500])
                  .range(['green', 'lightgreen']);
    
    // console.log('path from geoPath: ', path)
    select(node).append('g')
      .attr('class', 'counties')
      .selectAll('path')
      .data(countyData)
      .enter().append('path')
        .attr('d', path)
        .style('fill', d => fill(path.area(d)));
    
    select(node).append('path')
      .datum(countyStates)
      .attr('class', 'states')
      .attr('d', path);
      
  }
  
  render() {
    return (
      <div>
        <svg ref={node => this.node = node}
          viewBox={`0 0 ${this.state.w} ${this.state.h}`}
          preserveAspectRatio='xMidYMid meet'>
        </svg>
      </div>
    )
  }
}

render(
  <Chloropleth />,
  document.getElementById('root')
);