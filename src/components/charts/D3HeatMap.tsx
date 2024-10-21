import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Heatmap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const data = [
      [80, 90, 70, 85, 95],
      [60, 75, 85, 90, 70],
      [70, 65, 75, 80, 85],
      [90, 85, 80, 95, 70],
      [80, 75, 90, 85, 65],
    ];

    const width = 500;
    const height = 500;
    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const gridSize = Math.floor(width / data[0].length);
    const colors = d3.scaleSequential(d3.interpolateBlues)
      .domain([d3.min(data.flat())!, d3.max(data.flat())!]);

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const rows = svg.selectAll('.row')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'row');

    rows.selectAll('.cell')
      .data(d => d)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', (d, i) => i * gridSize)
      .attr('y', (d, i, j) => (j as any)[0] * gridSize)
      .attr('width', gridSize)
      .attr('height', gridSize)
      .style('fill', d => colors(d) as string)
      .style('stroke', 'white')
      .style('stroke-width', '2px');
  }, []);

  return <svg ref={svgRef}></svg>;
};

export default Heatmap;
