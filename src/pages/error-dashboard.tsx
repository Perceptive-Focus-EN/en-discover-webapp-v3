// pages/error-dashboard.tsx
import { useState, useEffect } from 'react';
import { NextPage } from 'next';

interface ErrorEntry {
  message: string;
  args: any[];
  timestamp: string;
}

// Mock function to simulate fetching errors from an API
async function fetchErrorsFromAPI(): Promise<ErrorEntry[]> {
  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  // Return mock data
  return [
    {
      message: 'Error 1',
      args: ['arg1', 'arg2'],
      timestamp: new Date().toISOString(),
    },
    {
      message: 'Error 2',
      args: ['arg3', 'arg4'],
      timestamp: new Date().toISOString(),
    },
  ];
}

const ErrorDashboard: NextPage = () => {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);

  useEffect(() => {
    async function fetchErrors() {
      const errorData = await fetchErrorsFromAPI();
      setErrors(errorData);
    }

    fetchErrors();
    const interval = setInterval(fetchErrors, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Error Tracking Dashboard</h1>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Timestamp</th>
            <th className="border border-gray-300 p-2">Message</th>
            <th className="border border-gray-300 p-2">Arguments</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((error, index) => (
            <tr key={index}>
              <td className="border border-gray-300 p-2">{error.timestamp}</td>
              <td className="border border-gray-300 p-2">{error.message}</td>
              <td className="border border-gray-300 p-2">{JSON.stringify(error.args)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ErrorDashboard;