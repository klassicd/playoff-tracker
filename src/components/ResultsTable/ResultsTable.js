import React, { Component } from 'react';
import ReactTable from 'react-table';

import Loading from '../Loading/Loading';

const SECONDS_IN_GAME = 3600;
const NUM_ADVANCING = 6;
const ACTIVE_TEAMS = [
    '0001',
    '0007',
    '0052',
    '0051',
    '0005',
    '0025',
    '0021',
    '0011',
    '0024',
    '0048',
    '0045',
    '0010',
    '0066',
    '0054',
    '0072',
    '0006',
    '0050',
    '0055'
]

const columns = [
    {
        Header: 'Name',
        accessor: 'name'
    },
    {
        id: 'score',
        Header: 'Score',
        accessor: d => Number.parseFloat(d.score)
    },
    {
        Header: 'Game Seconds Remaining',
        accessor: 'gameSecondsRemaining'
    },
    {
        id: 'projectedScore',
        Header: 'Projected Score',
        accessor: d => Math.round(d.projectedScore * 100) / 100
    },
    {
        id: 'projectedToAdvance',
        Header: 'Projected To Advance',
        Cell: props => <span>{props.value ? 'Yes' : 'No'}</span>,
        accessor: d => d.projectedToAdvance
    }
];

const getTrProps = (state, rowInfo, column) => {
    return {
        className: rowInfo.row.projectedToAdvance ? 'in' : 'out'
    };
};

export default class ResultsTable extends Component {
    getProjectedScore(franchiseId) {
        const { projectedScores, liveScores } = this.props.entities;
        const { players: franchisePlayers } = liveScores[franchiseId];
        const starters = franchisePlayers.player.filter(player => player.status === 'starter');
        return starters.reduce((liveTeamProjection, player) => {
            const score = Number.parseFloat(player.score);
            const gameSecondsRemaining = Number.parseInt(player.gameSecondsRemaining, 10);
            const { score: projectedScore } = projectedScores[player.id];
            const projectionWeight = gameSecondsRemaining / SECONDS_IN_GAME;
            const livePlayerProjection = score + projectionWeight * projectedScore;
            return liveTeamProjection + livePlayerProjection;
        }, 0);
    }

    getTableData() {
        const { franchises, liveScores } = this.props.entities;
        if (franchises) {
            const allProjectedScores = [];
            const tableData = [];
            Object.keys(franchises).forEach(franchiseId => {
                if (ACTIVE_TEAMS.indexOf(franchiseId) > -1) {
                    const { name } = franchises[franchiseId];
                    const { score, gameSecondsRemaining, playersYetToPlay: numPlayersRemaining } = liveScores[franchiseId];
                    const projectedScore = this.getProjectedScore(franchiseId);
                    allProjectedScores.push(projectedScore);
                    const data = { name, score, projectedScore, gameSecondsRemaining, numPlayersRemaining };
                    tableData.push(data);
                }
            });
            allProjectedScores.sort((a, b) => a - b).reverse();
            return tableData.map(data => ({
                ...data,
                projectedToAdvance: data.projectedScore >= allProjectedScores[NUM_ADVANCING - 1]
            }));
        }
        return [];
    }

    render() {
        const tableData = this.getTableData();
        return (
            <div>
                {tableData.length === 0 ? (
                    <Loading />
                ) : (
                    <ReactTable
                        data={tableData}
                        columns={columns}
                        showPagination={false}
                        showPageSizeOptions={false}
                        defaultPageSize={tableData.length}
                        defaultSorted={[{ id: 'projectedScore', desc: true }]}
                        getTrProps={getTrProps}
                    />
                )}
            </div>
        );
    }
}
