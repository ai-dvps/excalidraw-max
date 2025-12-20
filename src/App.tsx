import { ExcalidrawCanvas } from './components/ExcalidrawCanvas';
import { SaveStateProvider } from './components/SaveStateContext';
import './App.css';

function App() {
  return (
    <SaveStateProvider>
      <ExcalidrawCanvas />
    </SaveStateProvider>
  );
}

export default App;
