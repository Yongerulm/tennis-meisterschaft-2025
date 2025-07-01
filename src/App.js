import React from 'react';
import TennisChampionship from './components/TennisChampionship';
import './styles/index.css';

function App() {
useEffect(() => {
  console.log('TEST Base ID:', process.env.REACT_APP_AIRTABLE_BASE_ID);
}, []);  return (
    <div className="App">
      <TennisChampionship />
    </div>
  );
}

export default App;
