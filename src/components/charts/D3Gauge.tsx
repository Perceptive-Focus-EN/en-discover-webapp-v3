import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface GaugeProps {
  value: number;
  minValue?: number;
  maxValue?: number;
  width?: number;
  height?: number;
  arcWidth?: number;
  arcPadding?: number;
  colors?: [string, string];
}

const Gauge: React.FC<GaugeProps> = ({
  value,
  minValue = 0,
  maxValue = 100,
  width = 300,
  height = 200,
  arcWidth = 40,
  arcPadding = 0.02,
  colors = ['#d3e5ff', '#4a90e2'],
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear any existing content in the SVG

    const radius = Math.min(width, height) / 2;
    const arcGenerator = d3.arc()
      .innerRadius(radius - arcWidth)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    const scale = d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([-Math.PI / 2, Math.PI / 2]);

    const backgroundArc = svg.append('path')
      .datum({ endAngle: Math.PI / 2 })
      .style('fill', colors[0])
      .attr('d', arcGenerator as any)
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const valueArc = svg.append('path')
      .datum({ endAngle: scale(value) })
      .style('fill', colors[1])
      .attr('d', arcGenerator as any)
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    svg.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('x', width / 2)
      .attr('y', height / 2 + arcWidth / 2)
      .style('font-size', '24px')
      .text(`${Math.round(value)}%`);
  }, [value, minValue, maxValue, width, height, arcWidth, colors]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
};

export default Gauge;
