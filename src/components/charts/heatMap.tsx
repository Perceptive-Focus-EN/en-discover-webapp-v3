import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Box, Typography } from '@mui/material';

type HeatmapProps = {
  data: number[][];
  width: number;
  height: number;
  xLabels: string[];
  yLabels: string[];
  valueFormatter?: (value: number) => string;
};

const Heatmap: React.FC<HeatmapProps> = ({ data, width, height, xLabels, yLabels, valueFormatter }) => {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (ref.current && data && data.length > 0 && data[0].length > 0) {
      const svg = d3.select(ref.current);
      const colorScale = d3.scaleSequential(d3.interpolateCool).domain([0, d3.max(data.flat()) || 1]);

      svg.selectAll('*').remove();

      const cellWidth = width / data[0].length;
      const cellHeight = height / data.length;

      svg.selectAll('rect')
        .data(data.flat())
        .enter()
        .append('rect')
        .attr('x', (d, i) => (i % data[0].length) * cellWidth)
        .attr('y', (d, i) => Math.floor(i / data[0].length) * cellHeight)
        .attr('width', cellWidth)
        .attr('height', cellHeight)
        .attr('fill', (d) => colorScale(d));

      svg
        .selectAll('text.xLabel')
        .data(xLabels)
        .enter()
        .append('text')
        .attr('class', 'xLabel')
        .text((d) => d)
        .attr('x', (d, i) => i * cellWidth + cellWidth / 2)
        .attr('y', height + 15)
        .style('text-anchor', 'middle');

      svg
        .selectAll('text.yLabel')
        .data(yLabels)
        .enter()
        .append('text')
        .attr('class', 'yLabel')
        .text((d) => d)
        .attr('x', -10)
        .attr('y', (d, i) => i * cellHeight + cellHeight / 2)
        .style('text-anchor', 'end')
        .attr('dy', '.35em');

      svg
        .selectAll('text.value')
        .data(data.flat())
        .enter()
        .append('text')
        .attr('class', 'value')
        .text((d) => (valueFormatter ? valueFormatter(d) : d))
        .attr('x', (d, i) => (i % data[0].length) * cellWidth + cellWidth / 2)
        .attr('y', (d, i) => Math.floor(i / data[0].length) * cellHeight + cellHeight / 2)
        .style('text-anchor', 'middle')
        .style('dominant-baseline', 'central');
    }
  }, [data, width, height, xLabels, yLabels, valueFormatter]);

  if (!data || data.length === 0 || data[0].length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          No Data Available for Heatmap
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Heatmap Analysis
      </Typography>
      <svg ref={ref} width={width} height={height} />
    </Box>
  );
};

export default Heatmap;

