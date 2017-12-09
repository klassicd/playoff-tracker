import React from 'react';
import { PulseLoader } from 'react-spinners';

import './Loading.css';

export default props => {
    return (
        <div className="loader">
            <PulseLoader size={50} color="#bada55" />
        </div>
    );
};
