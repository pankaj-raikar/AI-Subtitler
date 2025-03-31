'use client';

import { useState, useEffect } from 'react';

interface FormattedDateProps {
  dateString: string | Date; // Accept string or Date object
}

// Helper function to safely format the date
const formatDate = (dateInput: string | Date): string => {
  try {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    // Basic check for valid date
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    // Use a consistent format, or rely on toLocaleString *after* mount
    return date.toLocaleString(); // Or use a library like date-fns for more control
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid Date';
  }
};

export default function FormattedDate({ dateString }: FormattedDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Format the date only after the component has mounted on the client
    setFormattedDate(formatDate(dateString));
  }, [dateString]); // Re-format if the date string changes

  // Render nothing on the server or before mount to avoid mismatch
  if (!isMounted) {
    return null; // Or return a placeholder like '...'
  }

  // Render the client-formatted date
  return <>{formattedDate}</>;
}
