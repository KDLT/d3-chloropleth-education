import React, { Component } from 'react';
import { render } from 'react-dom';
import { geoMercator, geoPath } from 'd3-geo';
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
       p: 50,
    };
    this.createChloropleth = this.createChloropleth.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.handleErrors = this.handleErrors.bind(this);
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
    let countyDataStatus = this.state.countyData.hasOwnProperty('objects'),
        educationDataStatus = this.state.educationData.length;
    if (countyDataStatus && educationDataStatus) {
      this.createChloropleth(this.state.countyData, this.state.educationData)
    }
  };

  handleErrors(response) {
    if (!response.ok) throw Error(response.statusText);
    else return response
  }

  fetchData(address) {
    fetch(address)
      .then(this.handleErrors)
      .then(response => response.json())
      .then(data => {
        if (data.hasOwnProperty('type')) {
          this.setState({ countyData: data })
        } else {
          this.setState({ educationData: data })
        }
      })
  }

  createChloropleth(countyData, educationData) {
    console.log('creating chloropleth...');
    console.log({ countyData, educationData });
    const node = this.node;

    const path = geoPath();

    json(countyData, (error, countyData) => {
      if (error) throw error;

      select(node).append('g')
        .attr('class', 'counties')
        .selectAll('path')
        .data(topojson.feature(countyData, countyData.objects.counties).features)
        .enter().append('path')
        .attr('d', path)
        .style('fill', d => fill(path.area(d)));
      
      select(node).append('path')
        .datum(topojson.mesh(countyData, countyData.objects.states, (a,b) => (a.id !== b.id)))
        .attr('class', 'states')
        .attr('d', path);

    })
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

// d3.json("/mbostock/raw/4090846/us.json", function (error, us) {
//   if (error) throw error;

//   svg.append("g")
//     .attr("class", "counties")
//     .selectAll("path")
//     .data(topojson.feature(us, us.objects.counties).features)
//     .enter().append("path")
//     .attr("d", path)
//     .style("fill", function (d) {
//       return fill(path.area(d));
//     });

//   svg.append("path")
//     .datum(topojson.mesh(us, us.objects.states, function (a, b) {
//       return a.id !== b.id;
//     }))
//     .attr("class", "states")
//     .attr("d", path);
// });