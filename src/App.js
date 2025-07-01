useEffect(() => {
  console.log('TEST Base ID:', process.env.REACT_APP_AIRTABLE_BASE_ID);
}, []);
import React from 'react';
import TennisChampionship from './components/TennisChampionship';
import './styles/index.css';

function App() {
  return (
    <div className="App">
      <TennisChampionship />
    </div>
  );
}

export default App;
