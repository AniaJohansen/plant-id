import React from 'react';
import './App.css';
import Navbar from './Components/Navbar/Navbar';
import HomePage from './Components/HomePage/HomePage';
import IDpage from "./Components/IDpage/index";
import ManageTab from "./Components/ManageTab/index";
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import SimpleModalWrapped from './Components/LoginModal/LoginModal';

function App() {
  return (
    <div className="App">
      <Navbar/>
      <BrowserRouter>
        <Switch>
          <Route exact path="/" component={HomePage}/>
          <Route path="/login" component={SimpleModalWrapped}/>
          <Route path="/ID" component={IDpage}/>
          <Route path="/Manage" component={ManageTab}/>
        </Switch>
      </BrowserRouter>
      <SimpleModalWrapped></SimpleModalWrapped>
    </div>
  );
}

export default App;