import React from 'react';

const ResultCard = ({ 
  detections, 
  damagedParts, 
  carInfo, 
  totalCost, 
  costBreakdown,
  repairAnalysis,
  nearestServiceCenters 
}) => {
  return (
    <div className="space-y-6">
      {/* Detection Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Detection Details (conf ≥ 0.25)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {detections?.map((detection, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-800">{detection.class}</div>
              <div className="text-2xl font-bold text-blue-600">{(detection.confidence * 100).toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Vehicle Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-gray-600">Model:</span>
            <span className="ml-2 font-medium">{carInfo?.year} {carInfo?.make} {carInfo?.model}</span>
          </div>
          <div>
            <span className="text-gray-600">Location:</span>
            <span className="ml-2 font-medium">{carInfo?.state}</span>
          </div>
        </div>
      </div>

      {/* Damaged Parts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Damaged Parts Detected</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {damagedParts?.map((part, index) => (
            <div key={index} className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="font-medium text-gray-800">{part.part}</div>
              <div className="text-sm text-red-600">{part.severity} Damage</div>
            </div>
          ))}
        </div>
      </div>

      {/* ENHANCED DUAL PRICING TABLE - 3RD PARTY vs 1ST PARTY */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          💰 Complete Pricing Comparison: 3rd Party vs 1st Party
        </h2>
        
        {/* Pricing Type Legend */}
        <div className="mb-6 flex justify-center space-x-8">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="font-semibold text-green-700">3rd Party (Aftermarket)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span className="font-semibold text-blue-700">1st Party (OEM Original)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border-2 border-gray-400 text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                <th rowSpan="2" className="border-2 border-gray-400 px-4 py-4 text-left font-bold text-gray-800 bg-gray-50">
                  Component/Part
                </th>
                <th colSpan="3" className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-white bg-green-600">
                  🔧 3RD PARTY (AFTERMARKET)
                </th>
                <th colSpan="3" className="border-2 border-gray-400 px-4 py-3 text-center font-bold text-white bg-blue-600">
                  🏭 1ST PARTY (OEM ORIGINAL)
                </th>
                <th rowSpan="2" className="border-2 border-gray-400 px-4 py-4 text-center font-bold text-purple-700 bg-purple-50">
                  💸 Price Difference
                </th>
              </tr>
              <tr className="bg-gray-50">
                <th className="border-2 border-gray-400 px-3 py-2 text-center font-semibold text-green-700">Part Cost</th>
                <th className="border-2 border-gray-400 px-3 py-2 text-center font-semibold text-green-600">Labour</th>
                <th className="border-2 border-gray-400 px-3 py-2 text-center font-semibold text-green-800">Total</th>
                <th className="border-2 border-gray-400 px-3 py-2 text-center font-semibold text-blue-700">Part Cost</th>
                <th className="border-2 border-gray-400 px-3 py-2 text-center font-semibold text-blue-600">Labour</th>
                <th className="border-2 border-gray-400 px-3 py-2 text-center font-semibold text-blue-800">Total</th>
              </tr>
            </thead>

            <tbody>
              {costBreakdown?.map((item, index) => {
                // Calculate detailed pricing breakdown
                const thirdPartyPart = item.aftermarket || item.cost || 0;
                const thirdPartyLabour = Math.round(thirdPartyPart * 0.25); // 25% labour
                const thirdPartyTotal = thirdPartyPart + thirdPartyLabour;
                
                const firstPartyPart = item.oem || Math.round(thirdPartyPart * 1.5); // 50% more expensive
                const firstPartyLabour = Math.round(firstPartyPart * 0.35); // 35% labour (premium)
                const firstPartyTotal = firstPartyPart + firstPartyLabour;
                
                const priceDifference = firstPartyTotal - thirdPartyTotal;
                const savingsPercentage = ((priceDifference / firstPartyTotal) * 100).toFixed(1);

                return (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="border-2 border-gray-400 px-4 py-4 font-bold text-gray-800">
                      <div className="flex flex-col">
                        <span className="text-lg">{item.part}</span>
                        <span className="text-xs text-red-600 mt-1 bg-red-100 px-2 py-1 rounded">
                          {item.severity || 'Moderate'} Damage
                        </span>
                      </div>
                    </td>
                    
                    {/* 3RD PARTY COLUMNS */}
                    <td className="border-2 border-gray-400 px-3 py-4 text-center bg-green-50">
                      <div className="font-bold text-green-700 text-lg">₹{thirdPartyPart.toLocaleString()}</div>
                      <div className="text-xs text-gray-600 mt-1">Aftermarket</div>
                    </td>
                    <td className="border-2 border-gray-400 px-3 py-4 text-center bg-green-50">
                      <div className="font-bold text-green-600 text-lg">₹{thirdPartyLabour.toLocaleString()}</div>
                      <div className="text-xs text-gray-600 mt-1">(25% of part)</div>
                    </td>
                    <td className="border-2 border-gray-400 px-3 py-4 text-center bg-green-100">
                      <div className="font-bold text-green-800 text-xl">₹{thirdPartyTotal.toLocaleString()}</div>
                      <div className="text-xs text-green-700 mt-1 font-semibold">💰 Budget Option</div>
                    </td>
                    
                    {/* 1ST PARTY COLUMNS */}
                    <td className="border-2 border-gray-400 px-3 py-4 text-center bg-blue-50">
                      <div className="font-bold text-blue-700 text-lg">₹{firstPartyPart.toLocaleString()}</div>
                      <div className="text-xs text-gray-600 mt-1">OEM Original</div>
                    </td>
                    <td className="border-2 border-gray-400 px-3 py-4 text-center bg-blue-50">
                      <div className="font-bold text-blue-600 text-lg">₹{firstPartyLabour.toLocaleString()}</div>
                      <div className="text-xs text-gray-600 mt-1">(35% of part)</div>
                    </td>
                    <td className="border-2 border-gray-400 px-3 py-4 text-center bg-blue-100">
                      <div className="font-bold text-blue-800 text-xl">₹{firstPartyTotal.toLocaleString()}</div>
                      <div className="text-xs text-blue-700 mt-1 font-semibold">🏭 Premium Quality</div>
                    </td>
                    
                    {/* PRICE DIFFERENCE COLUMN */}
                    <td className="border-2 border-gray-400 px-3 py-4 text-center bg-purple-50">
                      <div className="font-bold text-purple-700 text-lg">₹{priceDifference.toLocaleString()}</div>
                      <div className="text-xs text-purple-600 mt-1 font-semibold">{savingsPercentage}% savings</div>
                      <div className="text-xs text-gray-500">with 3rd party</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* GRAND TOTAL FOOTER */}
            <tfoot className="bg-gradient-to-r from-gray-200 to-gray-300">
              <tr>
                <td className="border-2 border-gray-400 px-4 py-4 font-bold text-gray-800 text-lg">
                  🔥 GRAND TOTAL
                </td>
                <td className="border-2 border-gray-400 px-3 py-4 text-center font-bold text-green-700 text-lg bg-green-100">
                  ₹{costBreakdown?.reduce((sum, item) => sum + (item.aftermarket || item.cost || 0), 0).toLocaleString()}
                </td>
                <td className="border-2 border-gray-400 px-3 py-4 text-center font-bold text-green-600 text-lg bg-green-100">
                  ₹{costBreakdown?.reduce((sum, item) => sum + Math.round((item.aftermarket || item.cost || 0) * 0.25), 0).toLocaleString()}
                </td>
                <td className="border-2 border-gray-400 px-3 py-4 text-center font-bold text-green-800 text-xl bg-green-200">
                  ₹{costBreakdown?.reduce((sum, item) => {
                    const part = item.aftermarket || item.cost || 0;
                    return sum + part + Math.round(part * 0.25);
                  }, 0).toLocaleString()}
                </td>
                <td className="border-2 border-gray-400 px-3 py-4 text-center font-bold text-blue-700 text-lg bg-blue-100">
                  ₹{costBreakdown?.reduce((sum, item) => {
                    const thirdParty = item.aftermarket || item.cost || 0;
                    return sum + (item.oem || Math.round(thirdParty * 1.5));
                  }, 0).toLocaleString()}
                </td>
                <td className="border-2 border-gray-400 px-3 py-4 text-center font-bold text-blue-600 text-lg bg-blue-100">
                  ₹{costBreakdown?.reduce((sum, item) => {
                    const thirdParty = item.aftermarket || item.cost || 0;
                    const oem = item.oem || Math.round(thirdParty * 1.5);
                    return sum + Math.round(oem * 0.35);
                  }, 0).toLocaleString()}
                </td>
                <td className="border-2 border-gray-400 px-3 py-4 text-center font-bold text-blue-800 text-xl bg-blue-200">
                  ₹{costBreakdown?.reduce((sum, item) => {
                    const thirdParty = item.aftermarket || item.cost || 0;
                    const oem = item.oem || Math.round(thirdParty * 1.5);
                    const labour = Math.round(oem * 0.35);
                    return sum + oem + labour;
                  }, 0).toLocaleString()}
                </td>
                <td className="border-2 border-gray-400 px-3 py-4 text-center font-bold text-purple-700 text-xl bg-purple-100">
                  ₹{costBreakdown?.reduce((sum, item) => {
                    const thirdPartyTotal = (item.aftermarket || item.cost || 0) + Math.round((item.aftermarket || item.cost || 0) * 0.25);
                    const oemPart = (item.oem || Math.round((item.aftermarket || item.cost || 0) * 1.5));
                    const oemTotal = oemPart + Math.round(oemPart * 0.35);
                    return sum + (oemTotal - thirdPartyTotal);
                  }, 0).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ENHANCED COMPARISON CARDS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 3rd Party Card */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6 shadow-lg">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-green-800 mb-3">🔧 3RD PARTY OPTION</h3>
              <div className="text-4xl font-bold text-green-700 mb-4">
                ₹{costBreakdown?.reduce((sum, item) => {
                  const part = item.aftermarket || item.cost || 0;
                  return sum + part + Math.round(part * 0.25);
                }, 0).toLocaleString()}
              </div>
              <div className="space-y-2 text-sm text-green-700">
                <div className="flex items-center justify-center"><span className="mr-2">💰</span> Most Affordable Option</div>
                <div className="flex items-center justify-center"><span className="mr-2">✅</span> Good Quality Aftermarket Parts</div>
                <div className="flex items-center justify-center"><span className="mr-2">⚡</span> Faster Availability</div>
                <div className="flex items-center justify-center"><span className="mr-2">🛡️</span> 6-12 Months Warranty</div>
              </div>
            </div>
          </div>

          {/* 1st Party Card */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-800 mb-3">🏭 1ST PARTY OPTION</h3>
              <div className="text-4xl font-bold text-blue-700 mb-4">
                ₹{costBreakdown?.reduce((sum, item) => {
                  const thirdParty = item.aftermarket || item.cost || 0;
                  const oem = item.oem || Math.round(thirdParty * 1.5);
                  const labour = Math.round(oem * 0.35);
                  return sum + oem + labour;
                }, 0).toLocaleString()}
              </div>
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-center justify-center"><span className="mr-2">🏆</span> Premium OEM Quality</div>
                <div className="flex items-center justify-center"><span className="mr-2">🔒</span> Perfect Fit Guarantee</div>
                <div className="flex items-center justify-center"><span className="mr-2">⭐</span> Authorized Service</div>
                <div className="flex items-center justify-center"><span className="mr-2">🛡️</span> 2-3 Years Warranty</div>
              </div>
            </div>
          </div>
        </div>

        {/* SAVINGS HIGHLIGHT */}
        <div className="mt-6 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-xl p-6 text-center">
          <h3 className="text-2xl font-bold text-purple-800 mb-3">💸 YOUR POTENTIAL SAVINGS</h3>
          <div className="text-5xl font-bold text-purple-700 mb-2">
            ₹{costBreakdown?.reduce((sum, item) => {
              const thirdPartyTotal = (item.aftermarket || item.cost || 0) + Math.round((item.aftermarket || item.cost || 0) * 0.25);
              const oemPart = (item.oem || Math.round((item.aftermarket || item.cost || 0) * 1.5));
              const oemTotal = oemPart + Math.round(oemPart * 0.35);
              return sum + (oemTotal - thirdPartyTotal);
            }, 0).toLocaleString()}
          </div>
          <p className="text-lg text-purple-600 font-semibold">By choosing 3rd Party over 1st Party option</p>
          <p className="text-sm text-gray-600 mt-2">
            Save {((costBreakdown?.reduce((sum, item) => {
              const thirdPartyTotal = (item.aftermarket || item.cost || 0) + Math.round((item.aftermarket || item.cost || 0) * 0.25);
              const oemPart = (item.oem || Math.round((item.aftermarket || item.cost || 0) * 1.5));
              const oemTotal = oemPart + Math.round(oemPart * 0.35);
              return sum + (oemTotal - thirdPartyTotal);
            }, 0) / costBreakdown?.reduce((sum, item) => {
              const oemPart = (item.oem || Math.round((item.aftermarket || item.cost || 0) * 1.5));
              const oemTotal = oemPart + Math.round(oemPart * 0.35);
              return sum + oemTotal;
            }, 0)) * 100).toFixed(1)}% of total repair cost
          </p>
        </div>
      </div>

      {/* ...existing code... */}
      {/* Estimated Total Cost */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Estimated Total Cost</h2>
        <div className="text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">₹{totalCost?.toLocaleString()}</div>
          <p className="text-gray-600 text-sm">*Estimates may vary based on location, parts availability, and labor rates</p>
        </div>
      </div>

      {/* Service Centers */}
      {nearestServiceCenters && nearestServiceCenters.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔧 Recommended Service Centers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearestServiceCenters.map((center, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800">{center.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{center.address}</p>
                <p className="text-sm text-gray-600">📞 {center.phone}</p>
                <div className="flex items-center mt-2">
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-sm text-gray-600 ml-1">{center.rating}/5</span>
                  <span className="text-sm text-gray-500 ml-2">({center.waitTime})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultCard;