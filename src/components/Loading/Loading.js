import React from 'react';
import { RingLoader } from 'react-spinners';

import './Loading.css';

export default props => {
    return (
        <div className="loader">
            <RingLoader size={200} color="#bada55" />
        </div>
    );
};
