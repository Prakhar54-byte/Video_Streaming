import React, { useState, useEffect } from 'react';
import { formatTimeAgo } from '../utils/formatTimeAgo'; // Import the function

/**
 * A component that takes an ISO dateString and automatically
 * updates the "time ago" string.
 */

interface LiveTimeAgoProps {
  dateString: string | null | undefined;
}

const LiveTimeAgo = ({ dateString }: LiveTimeAgoProps) => {
  // 1. Calculate the initial time on load
  const [timeAgo, setTimeAgo] = useState(() => formatTimeAgo(dateString));

  useEffect(() => {
    // 2. Set up an interval to update the time every minute
    const intervalId = setInterval(() => {
      const newTimeAgo = formatTimeAgo(dateString);
      setTimeAgo(newTimeAgo);
    }, 60000); // 60,000ms = 1 minute

    // 3. Clean up the interval when the component is unmounted
    return () => clearInterval(intervalId);
    
  }, [dateString]); // Re-run this effect if the dateString prop ever changes

  // Don't render anything if the date was invalid
  if (!timeAgo) {
    return null;
  }

  return (
    <span className="time-ago">{timeAgo}</span>
  );
};

export default LiveTimeAgo;