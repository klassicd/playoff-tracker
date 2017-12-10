import React, { Component } from 'react';
import ReactTable from 'react-table';
import Loading from '../Loading/Loading';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';

const SECONDS_IN_GAME = 3600;
const NUM_ADVANCING = 4;
const NUM_ALMOST_ADVANCING = 4;
const ACTIVE_TEAMS = ['0013', '0001', '0007', '0052', '0043', '0020', '0024', '0033', '0048', '0037', '0040', '0006'];
const POSITION_ORDERING = {
    Coach: 0,
    QB: 1,
    RB: 2,
    WR: 3,
    TE: 4,
    PK: 5,
    DE: 6,
    DL: 7,
    LB: 8,
    S: 9,
    CB: 10
};

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
        accessor: d => d.projectedStatus === 'in'
    }
];

const getTrProps = (state, rowInfo, column) => {
    return {
        className: rowInfo.original.projectedStatus
    };
};

const PlayerList = ({ header, players }) => {
    return (
        <div style={{ marginRight: 5 }}>
            <div style={{ padding: '0.1rem 0' }}>
                <strong>{header}:</strong>
            </div>
            <ul style={{ listStyle: 'none' }}>
                {players.map(({ id, name, position, team }) => (
                    <li style={{ padding: '0.1rem 0' }} key={id}>
                        {name} {team} {position}
                    </li>
                ))}
            </ul>
        </div>
    );
};

const SubComponent = row => {
    return (
        <ErrorBoundary>
            <div style={{ margin: 10, fontSize: '0.85rem' }}>
                <div>
                    <strong>Division</strong>: {row.original.division.name}
                </div>
                <div style={{ display: 'flex' }}>
                    <PlayerList header="Remaining Players" players={row.original.playersRemaining} />
                    <PlayerList header="Players Played" players={row.original.playersPlayed} />
                </div>
            </div>
        </ErrorBoundary>
    );
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
        const { entities } = this.props;
        const { franchises, liveScores, players, divisions } = entities;
        if (franchises) {
            const allProjectedScores = [];
            const tableData = [];
            Object.keys(franchises).forEach(franchiseId => {
                if (ACTIVE_TEAMS.indexOf(franchiseId) > -1) {
                    const { name, division: divisionId } = franchises[franchiseId];
                    const {
                        score,
                        gameSecondsRemaining,
                        playersYetToPlay: numPlayersRemaining,
                        players: { player: franchisePlayers }
                    } = liveScores[franchiseId];
                    const projectedScore = this.getProjectedScore(franchiseId);
                    allProjectedScores.push(projectedScore);
                    const playersRemaining = franchisePlayers
                        .slice()
                        .filter(
                            ({ status, gameSecondsRemaining }) =>
                                status === 'starter' && parseInt(gameSecondsRemaining, 10) !== 0
                        )
                        .map(({ id }) => players[id])
                        .sort((a, b) => POSITION_ORDERING[a.position] - POSITION_ORDERING[b.position]);
                    const playersPlayed = franchisePlayers
                        .slice()
                        .filter(
                            ({ status, gameSecondsRemaining }) =>
                                status === 'starter' && parseInt(gameSecondsRemaining, 10) === 0
                        )
                        .map(({ id }) => players[id])
                        .sort((a, b) => POSITION_ORDERING[a.position] - POSITION_ORDERING[b.position]);
                    const division = divisions[divisionId];
                    const data = {
                        franchiseId,
                        name,
                        score,
                        projectedScore,
                        gameSecondsRemaining,
                        numPlayersRemaining,
                        playersRemaining,
                        playersPlayed,
                        division
                    };
                    tableData.push(data);
                }
            });
            allProjectedScores.sort((a, b) => a - b).reverse();
            return tableData.map(data => ({
                ...data,
                projectedStatus:
                    data.projectedScore >= allProjectedScores[NUM_ADVANCING - 1]
                        ? 'in'
                        : data.projectedScore >= allProjectedScores[NUM_ADVANCING + NUM_ALMOST_ADVANCING - 1]
                          ? 'almost-in'
                          : 'out'
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
                        defaultSortDesc={true}
                        getTrProps={getTrProps}
                        SubComponent={SubComponent}
                    />
                )}
            </div>
        );
    }
}
