import React, { Component } from 'react';
import axios from 'axios';
import { normalize, schema } from 'normalizr';

import ResultsTable from './components/ResultsTable/ResultsTable';

import 'react-table/react-table.css';
import './App.css';

const franchise = new schema.Entity('franchises');

const projectedScore = new schema.Entity(
    'projectedScores',
    {},
    {
        processStrategy: projectedScore => ({
            ...projectedScore,
            score: Number.parseFloat(projectedScore.score) || 0
        })
    }
);
const liveScore = new schema.Entity(
    'liveScores',
    {},
    {
        processStrategy: liveScore => ({
            ...liveScore,
            score: Number.parseFloat(liveScore.score),
            gameSecondsRemaining: Number.parseInt(liveScore.gameSecondsRemaining, 10),
            playersYetToPlay: Number.parseInt(liveScore.playersYetToPlay, 10)
        })
    }
);

const dataSchema = new schema.Object({
    league: {
        league: {
            franchises: {
                franchise: new schema.Array(franchise)
            }
        }
    },
    liveScores: {
        liveScoring: {
            matchup: new schema.Array({
                franchise: new schema.Array(liveScore)
            })
        }
    },
    projectedScores: {
        projectedScores: {
            playerScore: new schema.Array(projectedScore)
        }
    }
});

class App extends Component {
    state = {
        entities: {},
        data: {}
    };

    componentDidMount() {
        axios.get('https://mfl-api.herokuapp.com/').then(({ data }) => {
            const { entities, result } = normalize(data, dataSchema);
            this.setState({
                entities,
                data: result
            });
        });
    }

    render() {
        return (
            <div className="app">
                <ResultsTable {...this.state} />
            </div>
        );
    }
}

export default App;
