import React, { Component } from 'react';
import axios from 'axios';
import { normalize, schema } from 'normalizr';

import logo from './logo.svg';
import './App.css';

const franchise = new schema.Entity('franchises');

const dataSchema = new schema.Object({
    league: {
        league: {
            franchises: {
                franchise: new schema.Array(franchise)
            }
        }
    }
})

class App extends Component {
    componentDidMount() {
        axios.get('https://mfl-api.herokuapp.com/').then(({ data }) => {
            console.log(data);
            const normalizedData = normalize(data, dataSchema);
            console.log(normalizedData);
        });
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo" />
                    <h1 className="App-title">Welcome to React</h1>
                </header>
                <p className="App-intro">
                    To get started, edit <code>src/App.js</code> and save to reload.
                </p>
            </div>
        );
    }
}

export default App;
