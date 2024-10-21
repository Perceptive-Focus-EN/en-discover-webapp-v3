import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SimulationNodeDatum } from 'd3';
import { DataPoint } from '../../types/DataTypes';

const ClusterChart: React.FC<{ data: DataPoint[] }> = ({ data }) => {
const chartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();
    // D3.js cluster chart code here
    
    const width = 500;
    const height = 500;

    const simulation = d3.forceSimulation<SimulationNodeDatum>(data.map(d => ({ ...d } as SimulationNodeDatum) as SimulationNodeDatum))
      .force('link', d3.forceLink().id((d: any) => d.id))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const node = svg.append('g')
      .selectAll('circle')
      .data(data)
      .enter().append('circle')
      .attr('r', 10)
      .attr('fill', (d) => d3.schemeCategory10[d.cluster])

    simulation.nodes(data as SimulationNodeDatum[]).on('tick', () => {
      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
    });
  }, [data]);

  return <svg ref={chartRef} width="100%" height="500"></svg>;
};

export default ClusterChart;
