import AIAssistant from '../components/AIAssistant';

const Thergo: React.FC = () => {
  return (
    <div style={{ backgroundColor: 'transparent' }}>
      <h1>My AI Assistant Page</h1>
      <AIAssistant initialVoice="en-US" onGenerateResponse={(response) => console.log(response)} />
    </div>
  );
};

export default Thergo;