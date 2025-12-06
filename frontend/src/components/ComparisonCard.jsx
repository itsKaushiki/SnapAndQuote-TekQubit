import React from 'react';

const ComparisonCard = ({ 
  vehicles,  // Array of vehicle comparison data
  title = "Vehicle Damage Comparison"
}) => {
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">No Vehicles to Compare</h2>
        <p className="text-gray-600">Upload multiple vehicle images to compare damage and pricing.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">{title}</h2>
      
      {/* Vehicle Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {vehicles.map((vehicle, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">
              Vehicle {index + 1}: {vehicle.carInfo?.year} {vehicle.carInfo?.make} {vehicle.carInfo?.model}
            </h3>
            <p className="text-sm text-gray-600">Location: {vehicle.carInfo?.state}</p>
            <p className="text-sm text-gray-600">
              Damaged Parts: {vehicle.damagedParts?.length || 0}
            </p>
            <p className="text-lg font-bold text-blue-600 mt-2">
              Total Cost: ₹{vehicle.totalCost?.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {/* Detailed Pricing Comparison Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
            <tr>
              <th className="border border-gray-300 px-3 py-3 text-left font-bold">Comparison Details</th>
              {vehicles.map((vehicle, index) => (
                <th key={index} className="border border-gray-300 px-3 py-3 text-center font-bold">
                  Vehicle {index + 1}<br/>
                  <span className="text-xs font-normal">
                    {vehicle.carInfo?.year} {vehicle.carInfo?.make} {vehicle.carInfo?.model}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Vehicle Information Rows */}
            <tr className="bg-gray-50">
              <td className="border border-gray-300 px-3 py-2 font-semibold">Location</td>
              {vehicles.map((vehicle, index) => (
                <td key={index} className="border border-gray-300 px-3 py-2 text-center">
                  {vehicle.carInfo?.state || 'N/A'}
                </td>
              ))}
            </tr>

            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">Total Damaged Parts</td>
              {vehicles.map((vehicle, index) => (
                <td key={index} className="border border-gray-300 px-3 py-2 text-center font-bold text-red-600">
                  {vehicle.damagedParts?.length || 0}
                </td>
              ))}
            </tr>

            {/* Damaged Parts Details */}
            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">Damaged Parts List</td>
              {vehicles.map((vehicle, index) => (
                <td key={index} className="border border-gray-300 px-3 py-2">
                  <div className="space-y-1">
                    {vehicle.damagedParts?.map((part, partIndex) => (
                      <div key={partIndex} className="text-xs">
                        <span className="font-medium">{part.part}</span>
                        <span className="text-red-500 ml-1">({part.severity})</span>
                      </div>
                    )) || 'No parts detected'}
                  </div>
                </td>
              ))}
            </tr>

            {/* 3rd Party Pricing Section */}
            <tr className="bg-green-50">
              <td colSpan={vehicles.length + 1} className="border border-gray-300 px-3 py-2 font-bold text-green-800 text-center">
                3rd Party (Aftermarket) Pricing Comparison
              </td>
            </tr>

            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">3rd Party Parts Total</td>
              {vehicles.map((vehicle, index) => {
                const partsTotal = vehicle.costBreakdown?.reduce((sum, item) => 
                  sum + (item.aftermarket || item.cost || 0), 0) || 0;
                return (
                  <td key={index} className="border border-gray-300 px-3 py-2 text-center font-bold text-green-700">
                    ₹{partsTotal.toLocaleString()}
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">3rd Party Labour Total</td>
              {vehicles.map((vehicle, index) => {
                const labourTotal = vehicle.costBreakdown?.reduce((sum, item) => 
                  sum + Math.round((item.aftermarket || item.cost || 0) * 0.25), 0) || 0;
                return (
                  <td key={index} className="border border-gray-300 px-3 py-2 text-center font-bold text-green-600">
                    ₹{labourTotal.toLocaleString()}
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">3rd Party Grand Total</td>
              {vehicles.map((vehicle, index) => {
                const grandTotal = vehicle.costBreakdown?.reduce((sum, item) => {
                  const part = item.aftermarket || item.cost || 0;
                  return sum + part + Math.round(part * 0.25);
                }, 0) || 0;
                return (
                  <td key={index} className="border border-gray-300 px-3 py-2 text-center font-bold text-green-800 text-lg">
                    ₹{grandTotal.toLocaleString()}
                  </td>
                );
              })}
            </tr>

            {/* 1st Party OEM Pricing Section */}
            <tr className="bg-blue-50">
              <td colSpan={vehicles.length + 1} className="border border-gray-300 px-3 py-2 font-bold text-blue-800 text-center">
                1st Party (OEM) Pricing Comparison
              </td>
            </tr>

            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">1st Party OEM Parts Total</td>
              {vehicles.map((vehicle, index) => {
                const oemPartsTotal = vehicle.costBreakdown?.reduce((sum, item) => {
                  const thirdParty = item.aftermarket || item.cost || 0;
                  return sum + (item.oem || Math.round(thirdParty * 1.4));
                }, 0) || 0;
                return (
                  <td key={index} className="border border-gray-300 px-3 py-2 text-center font-bold text-blue-700">
                    ₹{oemPartsTotal.toLocaleString()}
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">1st Party Labour Total</td>
              {vehicles.map((vehicle, index) => {
                const oemLabourTotal = vehicle.costBreakdown?.reduce((sum, item) => {
                  const thirdParty = item.aftermarket || item.cost || 0;
                  const oem = item.oem || Math.round(thirdParty * 1.4);
                  return sum + Math.round(oem * 0.30);
                }, 0) || 0;
                return (
                  <td key={index} className="border border-gray-300 px-3 py-2 text-center font-bold text-blue-600">
                    ₹{oemLabourTotal.toLocaleString()}
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">1st Party Grand Total</td>
              {vehicles.map((vehicle, index) => {
                const oemGrandTotal = vehicle.costBreakdown?.reduce((sum, item) => {
                  const thirdParty = item.aftermarket || item.cost || 0;
                  const oem = item.oem || Math.round(thirdParty * 1.4);
                  const labour = Math.round(oem * 0.30);
                  return sum + oem + labour;
                }, 0) || 0;
                return (
                  <td key={index} className="border border-gray-300 px-3 py-2 text-center font-bold text-blue-800 text-lg">
                    ₹{oemGrandTotal.toLocaleString()}
                  </td>
                );
              })}
            </tr>

            {/* Savings Comparison */}
            <tr className="bg-purple-50">
              <td colSpan={vehicles.length + 1} className="border border-gray-300 px-3 py-2 font-bold text-purple-800 text-center">
                Savings Comparison (3rd Party vs 1st Party)
              </td>
            </tr>

            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">Total Savings (3rd Party vs OEM)</td>
              {vehicles.map((vehicle, index) => {
                const thirdPartyTotal = vehicle.costBreakdown?.reduce((sum, item) => {
                  const part = item.aftermarket || item.cost || 0;
                  return sum + part + Math.round(part * 0.25);
                }, 0) || 0;
                
                const oemTotal = vehicle.costBreakdown?.reduce((sum, item) => {
                  const thirdParty = item.aftermarket || item.cost || 0;
                  const oem = item.oem || Math.round(thirdParty * 1.4);
                  const labour = Math.round(oem * 0.30);
                  return sum + oem + labour;
                }, 0) || 0;
                
                const savings = oemTotal - thirdPartyTotal;
                
                return (
                  <td key={index} className="border border-gray-300 px-3 py-2 text-center font-bold text-purple-600 text-lg">
                    ₹{savings.toLocaleString()}
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="border border-gray-300 px-3 py-2 font-semibold">Savings Percentage</td>
              {vehicles.map((vehicle, index) => {
                const thirdPartyTotal = vehicle.costBreakdown?.reduce((sum, item) => {
                  const part = item.aftermarket || item.cost || 0;
                  return sum + part + Math.round(part * 0.25);
                }, 0) || 0;
                
                const oemTotal = vehicle.costBreakdown?.reduce((sum, item) => {
                  const thirdParty = item.aftermarket || item.cost || 0;
                  const oem = item.oem || Math.round(thirdParty * 1.4);
                  const labour = Math.round(oem * 0.30);
                  return sum + oem + labour;
                }, 0) || 0;
                
                const savingsPercentage = oemTotal > 0 ? Math.round(((oemTotal - thirdPartyTotal) / oemTotal) * 100) : 0;
                
                return (
                  <td key={index} className="border border-gray-300 px-3 py-2 text-center font-bold text-purple-600">
                    {savingsPercentage}%
                  </td>
                );
              })}
            </tr>

            {/* Recommendation Row */}
            <tr className="bg-yellow-50">
              <td className="border border-gray-300 px-3 py-2 font-semibold">Recommendation</td>
              {vehicles.map((vehicle, index) => {
                const damageCount = vehicle.damagedParts?.length || 0;
                const totalCost = vehicle.totalCost || 0;
                
                let recommendation = "3rd Party - Budget Friendly";
                if (damageCount > 3 || totalCost > 50000) {
                  recommendation = "1st Party OEM - Major Damage";
                } else if (totalCost > 25000) {
                  recommendation = "Compare Both Options";
                }
                
                return (
                  <td key={index} className="border border-gray-300 px-3 py-2 text-center text-xs font-medium">
                    {recommendation}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-bold text-green-800 mb-2">Most Affordable Vehicle</h3>
          {(() => {
            let minCost = Infinity;
            let cheapestVehicle = null;
            vehicles.forEach((vehicle, index) => {
              const cost = vehicle.costBreakdown?.reduce((sum, item) => {
                const part = item.aftermarket || item.cost || 0;
                return sum + part + Math.round(part * 0.25);
              }, 0) || 0;
              if (cost < minCost) {
                minCost = cost;
                cheapestVehicle = { ...vehicle, index: index + 1 };
              }
            });
            return cheapestVehicle ? (
              <div>
                <p className="font-semibold">Vehicle {cheapestVehicle.index}</p>
                <p className="text-2xl font-bold text-green-600">₹{minCost.toLocaleString()}</p>
                <p className="text-xs text-green-600">3rd Party Total</p>
              </div>
            ) : 'N/A';
          })()}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-bold text-red-800 mb-2">Most Damaged Vehicle</h3>
          {(() => {
            let maxDamage = 0;
            let mostDamagedVehicle = null;
            vehicles.forEach((vehicle, index) => {
              const damageCount = vehicle.damagedParts?.length || 0;
              if (damageCount > maxDamage) {
                maxDamage = damageCount;
                mostDamagedVehicle = { ...vehicle, index: index + 1 };
              }
            });
            return mostDamagedVehicle ? (
              <div>
                <p className="font-semibold">Vehicle {mostDamagedVehicle.index}</p>
                <p className="text-2xl font-bold text-red-600">{maxDamage} Parts</p>
                <p className="text-xs text-red-600">Damaged Components</p>
              </div>
            ) : 'N/A';
          })()}
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-bold text-purple-800 mb-2">Best Savings Opportunity</h3>
          {(() => {
            let maxSavings = 0;
            let bestSavingsVehicle = null;
            vehicles.forEach((vehicle, index) => {
              const thirdPartyTotal = vehicle.costBreakdown?.reduce((sum, item) => {
                const part = item.aftermarket || item.cost || 0;
                return sum + part + Math.round(part * 0.25);
              }, 0) || 0;
              
              const oemTotal = vehicle.costBreakdown?.reduce((sum, item) => {
                const thirdParty = item.aftermarket || item.cost || 0;
                const oem = item.oem || Math.round(thirdParty * 1.4);
                const labour = Math.round(oem * 0.30);
                return sum + oem + labour;
              }, 0) || 0;
              
              const savings = oemTotal - thirdPartyTotal;
              if (savings > maxSavings) {
                maxSavings = savings;
                bestSavingsVehicle = { ...vehicle, index: index + 1 };
              }
            });
            return bestSavingsVehicle ? (
              <div>
                <p className="font-semibold">Vehicle {bestSavingsVehicle.index}</p>
                <p className="text-2xl font-bold text-purple-600">₹{maxSavings.toLocaleString()}</p>
                <p className="text-xs text-purple-600">Potential Savings</p>
              </div>
            ) : 'N/A';
          })()}
        </div>
      </div>
    </div>
  );
};

export default ComparisonCard;