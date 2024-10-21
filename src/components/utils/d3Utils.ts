import * as d3 from 'd3';

export const calculateCorrelation = (data: any[], key1: string, key2: string): number => {
  const n = data.length;
  let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;

  for (let i = 0; i < n; i++) {
    sum1 += Number(data[i][key1]);
    sum2 += Number(data[i][key2]);
    sum1Sq += Number(data[i][key1]) ** 2;
    sum2Sq += Number(data[i][key2]) ** 2;
    pSum += Number(data[i][key1]) * Number(data[i][key2]);
  }

  const num = pSum - (sum1 * sum2) / n;
  const den = Math.sqrt((sum1Sq - (sum1 ** 2) / n) * (sum2Sq - (sum2 ** 2) / n));

  return num / den;
};

// Example D3 utility for cluster chart
export const createForceDirectedGraph = (
  data: { id: string; group: number }[],
  width: number,
  height: number,
  svgRef: React.RefObject<SVGSVGElement>
) => {
  const svg = d3.select(svgRef.current);
  svg.selectAll('*').remove();

  const simulation = d3.forceSimulation(data as d3.SimulationNodeDatum[])
    .force('link', d3.forceLink().id((d: any) => d.id))
    .force('charge', d3.forceManyBody().strength(-200))
    .force('center', d3.forceCenter(width / 2, height / 2));

  const node = svg.append('g')
    .selectAll('circle')
    .data(data)
    .enter().append('circle')
    .attr('r', 10)
    .attr('fill', (d) => d3.schemeCategory10[d.group]);

  simulation.nodes(data as d3.SimulationNodeDatum[]).on('tick', () => {
    node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
  });
};
