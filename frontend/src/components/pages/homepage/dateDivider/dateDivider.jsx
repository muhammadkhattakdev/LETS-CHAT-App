import React from 'react';
import './style.css';

const DateDivider = ({ date }) => {
  return (
    <div className="date-divider">
      <div className="date-divider__line"></div>
      <div className="date-divider__text">
        {date}
      </div>
      <div className="date-divider__line"></div>
    </div>
  );
};

export default DateDivider;