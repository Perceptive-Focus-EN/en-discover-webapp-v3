import AIAssistant from '../components/AIAssistant';

const Thergo: React.FC = () => {
  return (
    <div style={{ backgroundColor: 'transparent' }}>
      <h1>My AI Assistant Page</h1>
      <AIAssistant
        onMessage={(message) => {
          console.log(message);
        }}
      />
    </div>
  );
};

export default Thergo;