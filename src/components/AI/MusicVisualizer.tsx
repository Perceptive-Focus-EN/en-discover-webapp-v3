import { ReactP5Wrapper } from 'react-p5-wrapper';
import * as Tone from 'tone';

const MusicVisualizer = () => {
    const sketch = (p5: { setup: () => void; createCanvas: (arg0: number, arg1: number) => void; draw: () => void; background: (arg0: number) => void; beginShape: () => void; map: (arg0: number, arg1: number, arg2: number, arg3: number, arg4: any) => any; width: any; height: any; vertex: (arg0: any, arg1: any) => void; endShape: () => void; }) => {
        let analyzer: Tone.Analyser;

        p5.setup = () => {
            p5.createCanvas(600, 400);
            // Initialize the FFT analyzer
            analyzer = new Tone.Analyser("waveform", 1024);
            Tone.getDestination().connect(analyzer);
        };

        p5.draw = () => {
            p5.background(255);

            // Get the frequency data from the analyzer
            const data = analyzer.getValue();

            // Draw the waveform
            p5.beginShape();
            for (let i = 0; i < data.length; i++) {
                const amplitude = data[i] as number; // waveform value
                const x = p5.map(i, 0, data.length - 1, 0, p5.width);
                const y = p5.map(amplitude, -1, 1, 0, p5.height);
                p5.vertex(x, y);
            }
            p5.endShape();
        };
    };

    return <ReactP5Wrapper sketch={sketch} />;
};

export default MusicVisualizer;
