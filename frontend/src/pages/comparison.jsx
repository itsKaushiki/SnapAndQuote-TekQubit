import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ComparisonCard from '../components/ComparisonCard';

const Comparison = () => {
  const [vehicles, setVehicles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Get stored vehicle reports from localStorage
    const storedReports = JSON.parse(localStorage.getItem('vehicleReports') || '[]');
    setVehicles(storedReports);
  }, []);

  const clearComparison = () => {
    localStorage.removeItem('vehicleReports');
    setVehicles([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Vehicle Damage Comparison</h1>
          <p className="text-gray-600">Compare pricing and damage analysis across multiple vehicles</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Vehicle
          </button>
          <button 
            onClick={clearComparison}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Clear All Comparisons
          </button>
        </div>

        {/* Comparison Component */}
        <ComparisonCard vehicles={vehicles} />
      </div>
    </div>
  );
};

export default Comparison;