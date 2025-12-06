import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useLocation, useNavigate } from 'react-router-dom';
import Chatbot from '../components/Chatbot';
import History from '../components/History';

// Enhanced ResultCard component with repair analysis and service centers
const ResultCard = ({ 
  damagedParts, costBreakdown, totalCost, carInfo, pricingTable, 
  totalOEMCost, totalAftermarketCost, currency, state, repairAnalysis, 
  nearestServiceCenters, estimatedRepairTime ,dualBreakdown
}) => {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:scale-[1.01] transition-all duration-300">
      {/* Car Info Section */}
      {carInfo && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Vehicle Information
          </h3>
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl p-4 border border-blue-400/30">
            <p className="text-white text-lg font-semibold">
              {carInfo.year} {carInfo.name} {carInfo.model}
            </p>
          </div>
        </div>
      )}

      {/* Damaged Parts Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          Damaged Parts Detected
        </h3>
        <div className="grid gap-4">
          {damagedParts?.map((part, index) => (
            <div key={index} className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl p-4 border border-red-400/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-white font-semibold">{part.name}</span>
                </div>
                <span className="text-red-300 text-sm font-medium">
                  {part.severity} Damage
                </span>
              </div>
              {part.description && (
                <p className="text-gray-300 text-sm mt-2 ml-6">{part.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Cost Breakdown - Dual Pricing Table */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          Cost Breakdown {state && `(${state})`}
        </h3>
        
        {/* New Dual Pricing Table */}
        {dualBreakdown && dualBreakdown.parts && dualBreakdown.parts.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-white/10 mb-6">
            <table className="min-w-full bg-white/5">
              <thead className="bg-white/10">
                <tr>
                  <th className="text-left text-white px-4 py-3">Part</th>
                  <th className="text-right text-cyan-300 px-4 py-3">3rd-Party</th>
                  <th className="text-right text-pink-300 px-4 py-3">OEM</th>
                </tr>
              </thead>
              <tbody>
                {dualBreakdown.parts.map((item, idx) => (
                  <tr key={idx} className="border-t border-white/10">
                    <td className="px-4 py-3 text-white capitalize">{item.part}</td>
                    <td className="px-4 py-3 text-right text-cyan-200">₹{(item.thirdParty ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-pink-200">₹{(item.oem ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/10">
                <tr>
                  <td className="px-4 py-3 text-white font-semibold">Totals</td>
                  <td className="px-4 py-3 text-right text-cyan-200 font-bold">₹{(dualBreakdown.totalThirdParty ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-pink-200 font-bold">₹{(dualBreakdown.totalOEM ?? 0).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : pricingTable && pricingTable.length > 0 ? (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-500/30 to-cyan-500/30">
                    <th className="text-left p-4 text-white font-semibold">Component</th>
                    <th className="text-center p-4 text-white font-semibold">1st Party (OEM)</th>
                    <th className="text-center p-4 text-white font-semibold">3rd Party (Aftermarket)</th>
                    <th className="text-center p-4 text-white font-semibold">Local Shop</th>
                    <th className="text-center p-4 text-white font-semibold">Best Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {pricingTable.map((item, index) => {
                    const localPrice = item.localPrice || (item.aftermarketPrice * 0.8); // 20% less than aftermarket
                    const maxSavings = Math.max(
                      (item.oemPrice - item.aftermarketPrice),
                      (item.oemPrice - localPrice)
                    );
                    const bestSavingsPercent = ((maxSavings / item.oemPrice) * 100).toFixed(1);
                    
                    return (
                      <tr key={index} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                        <td className="p-4 text-white font-medium">{item.part}</td>
                        <td className="p-4 text-center text-yellow-300 font-semibold">₹{item.oemPrice.toLocaleString()}</td>
                        <td className="p-4 text-center text-green-300 font-semibold">₹{item.aftermarketPrice.toLocaleString()}</td>
                        <td className="p-4 text-center text-orange-300 font-semibold">₹{Math.round(localPrice).toLocaleString()}</td>
                        <td className="p-4 text-center text-cyan-300 font-semibold">₹{maxSavings.toLocaleString()} ({bestSavingsPercent}%)</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Fallback to old format if new format not available
          <div className="space-y-3">
            {costBreakdown?.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                  <span className="text-white">{item.part}</span>
                </div>
                <span className="text-cyan-300 font-semibold">₹{item.cost.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Cost - Dual Display */}
      {dualBreakdown && dualBreakdown.totalOEM && dualBreakdown.totalThirdParty ? (
        <div className="grid md:grid-cols-2 gap-4">
          {/* OEM Total */}
          <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-2xl p-6 border border-pink-400/30">
            <div className="text-center">
              <h4 className="text-lg font-bold text-white mb-2">OEM Parts Total</h4>
              <div className="text-2xl font-bold text-pink-300">
                ₹{dualBreakdown.totalOEM.toLocaleString()}
              </div>
              <p className="text-pink-200 text-sm mt-1">Premium Quality</p>
            </div>
          </div>
          
          {/* Third-Party Total */}
          <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl p-6 border border-cyan-400/30">
            <div className="text-center">
              <h4 className="text-lg font-bold text-white mb-2">3rd-Party Total</h4>
              <div className="text-2xl font-bold text-cyan-300">
                ₹{dualBreakdown.totalThirdParty.toLocaleString()}
              </div>
              <p className="text-cyan-200 text-sm mt-1">Cost Effective</p>
            </div>
          </div>
          
          {/* Savings Summary */}
          <div className="md:col-span-2 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-2xl p-6 border border-green-400/30">
            <div className="text-center">
              <h4 className="text-lg font-bold text-white mb-2">💰 Your Potential Savings</h4>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                ₹{(dualBreakdown.totalOEM - dualBreakdown.totalThirdParty).toLocaleString()}
              </div>
              <p className="text-gray-300 text-sm mt-2">
                Save {Math.round(((dualBreakdown.totalOEM - dualBreakdown.totalThirdParty) / dualBreakdown.totalOEM) * 100)}% by choosing 3rd-party parts
              </p>
            </div>
          </div>
        </div>
      ) : totalOEMCost && totalAftermarketCost ? (
        <div className="grid md:grid-cols-2 gap-4">
          {/* OEM Total */}
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-400/30">
            <div className="text-center">
              <h4 className="text-lg font-bold text-white mb-2">OEM Parts Total</h4>
              <div className="text-2xl font-bold text-yellow-300">
                ₹{totalOEMCost.toLocaleString()}
              </div>
              <p className="text-yellow-200 text-sm mt-1">Premium Quality</p>
            </div>
          </div>
          
          {/* Aftermarket Total */}
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl p-6 border border-green-400/30">
            <div className="text-center">
              <h4 className="text-lg font-bold text-white mb-2">Aftermarket Total</h4>
              <div className="text-2xl font-bold text-green-300">
                ₹{totalAftermarketCost.toLocaleString()}
              </div>
              <p className="text-green-200 text-sm mt-1">Cost Effective</p>
            </div>
          </div>
          
          {/* Savings Summary */}
          <div className="md:col-span-2 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-cyan-400/30">
            <div className="text-center">
              <h4 className="text-lg font-bold text-white mb-2">💰 Your Potential Savings</h4>
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                ₹{(totalOEMCost - totalAftermarketCost).toLocaleString()}
              </div>
              <p className="text-gray-300 text-sm mt-2">
                Save {Math.round(((totalOEMCost - totalAftermarketCost) / totalOEMCost) * 100)}% by choosing aftermarket parts
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Fallback to single total display
        <div className="bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-cyan-400/30">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-white">Estimated Total Cost</h3>
            <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              ₹{(totalCost || 0).toLocaleString()}
            </div>
          </div>
          <p className="text-gray-300 text-sm mt-2">
            *Estimates may vary based on location, parts availability, and labor rates
          </p>
        </div>
      )}

      {/* Repair Analysis Section */}
      {repairAnalysis && repairAnalysis.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Repair Analysis & Recommendations
          </h3>
          
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-500/30 to-red-500/30">
                    <th className="text-left p-4 text-white font-semibold">Part</th>
                    <th className="text-center p-4 text-white font-semibold">Damage Severity</th>
                    <th className="text-center p-4 text-white font-semibold">Recommendation</th>
                    <th className="text-center p-4 text-white font-semibold">Repair Time</th>
                    <th className="text-center p-4 text-white font-semibold">Complexity</th>
                  </tr>
                </thead>
                <tbody>
                  {repairAnalysis.map((item, index) => (
                    <tr key={index} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-white font-medium">{item.part}</td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.severity === 'Minor' ? 'bg-green-500/20 text-green-300' :
                            item.severity === 'Moderate' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {item.severity}
                          </span>
                          <span className="text-gray-400 text-xs mt-1">
                            {item.severityPercentage}%
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          item.recommendation === 'Repair' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-purple-500/20 text-purple-300'
                        }`}>
                          {item.recommendation}
                        </span>
                      </td>
                      <td className="p-4 text-center text-cyan-300 font-medium">
                        {item.estimatedTime}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.complexity === 'Low' ? 'bg-gray-500/20 text-gray-300' :
                          item.complexity === 'Medium' ? 'bg-orange-500/20 text-orange-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {item.complexity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Overall Repair Summary */}
          {estimatedRepairTime && (
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-400/30">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-blue-300 mb-1">
                    {estimatedRepairTime.total || '0'}
                  </div>
                  <div className="text-sm text-gray-300">Total Estimated Time</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-300 mb-1">
                    {repairAnalysis.filter(item => item.recommendation === 'Repair').length}
                  </div>
                  <div className="text-sm text-gray-300">Parts to Repair</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-purple-300 mb-1">
                    {repairAnalysis.filter(item => item.recommendation === 'Replace').length}
                  </div>
                  <div className="text-sm text-gray-300">Parts to Replace</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Service Centers Section */}
      {nearestServiceCenters && nearestServiceCenters.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            Recommended Service Centers in {state}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearestServiceCenters.map((center, index) => (
              <div key={index} className={`rounded-xl border p-6 hover:scale-105 transition-all duration-300 ${
                center.type === 'Local Mechanic' 
                  ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/30' 
                  : 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-400/30'
              }`}>
                
                {/* Header with Name, Type and Rating */}
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-semibold text-white leading-tight">{center.name}</h4>
                    <div className="flex items-center bg-yellow-500/20 rounded-full px-2 py-1">
                      <span className="text-yellow-300 text-sm">★</span>
                      <span className="ml-1 text-yellow-300 text-sm font-semibold">{center.rating}</span>
                    </div>
                  </div>
                  
                  {/* Service Type Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      center.type === 'Local Mechanic' 
                        ? 'bg-green-500/20 text-green-300' 
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {center.type === 'Local Mechanic' ? '🔧 Local Expert' : '🏢 Authorized Center'}
                    </span>
                    {center.priceRange && (
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        center.priceRange === 'Budget-Friendly' ? 'bg-gray-500/20 text-gray-300' :
                        center.priceRange === 'Affordable' ? 'bg-green-600/20 text-green-400' :
                        center.priceRange === 'Mid-Range' ? 'bg-yellow-600/20 text-yellow-400' :
                        'bg-purple-500/20 text-purple-300'
                      }`}>
                        {center.priceRange}
                      </span>
                    )}
                  </div>

                  {/* Owner/Brand Info */}
                  {center.ownerName && (
                    <p className="text-sm text-gray-400">👨‍🔧 Owner: {center.ownerName}</p>
                  )}
                  {center.brand && (
                    <p className="text-sm text-gray-400">🏭 Brand: {center.brand}</p>
                  )}
                  {center.experience && (
                    <p className="text-sm text-gray-400">📅 Experience: {center.experience}</p>
                  )}
                </div>

                {/* Contact Information */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="text-gray-300 text-sm">{center.address}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-cyan-300 font-medium">{center.phone}</span>
                  </div>

                  {center.whatsapp && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.787"/>
                      </svg>
                      <span className="text-green-400 font-medium text-sm">WhatsApp</span>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-orange-300">Wait: {center.estimatedWaitDays} day{center.estimatedWaitDays !== 1 ? 's' : ''}</span>
                  </div>
                  
                  {center.workingHours && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-300 text-sm">{center.workingHours}</span>
                    </div>
                  )}
                </div>

                {/* Languages Spoken */}
                {center.languages && (
                  <div className="mb-3">
                    <span className="text-gray-400 text-xs font-medium block mb-1">Languages:</span>
                    <div className="flex flex-wrap gap-1">
                      {center.languages.map((lang, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialties */}
                {center.specialties && center.specialties.length > 0 && (
                  <div className="mb-3">
                    <span className="text-gray-400 text-xs font-medium block mb-1">Specialties:</span>
                    <div className="flex flex-wrap gap-1">
                      {center.specialties.slice(0, 4).map((specialty, idx) => (
                        <span key={idx} className={`px-2 py-1 text-xs rounded-full ${
                          center.type === 'Local Mechanic' 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {specialty}
                        </span>
                      ))}
                      {center.specialties.length > 4 && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-full">
                          +{center.specialties.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Facilities */}
                {center.facilities && (
                  <div className="mb-3">
                    <span className="text-gray-400 text-xs font-medium block mb-1">Facilities:</span>
                    <div className="flex flex-wrap gap-1">
                      {center.facilities.slice(0, 3).map((facility, idx) => (
                        <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                          {facility}
                        </span>
                      ))}
                      {center.facilities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
                          +{center.facilities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Customer Reviews */}
                {center.customerReviews && (
                  <div className="mt-3 p-2 bg-black/20 rounded-lg">
                    <span className="text-gray-400 text-xs font-medium">Customer Review:</span>
                    <p className="text-gray-300 text-xs mt-1 italic">"{center.customerReviews}"</p>
                  </div>
                )}

                {/* Payment Methods */}
                {center.paymentMethods && (
                  <div className="mt-3 pt-2 border-t border-white/10">
                    <span className="text-gray-400 text-xs font-medium">Accepts: </span>
                    <span className="text-cyan-300 text-xs">
                      {center.paymentMethods.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Local Shops with Specific Pricing */}
      {nearestServiceCenters && nearestServiceCenters.filter(center => center.type === 'Local Mechanic').length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            Local Shop Pricing Comparison
          </h3>

          <div className="grid gap-6">
            {nearestServiceCenters
              .filter(center => center.type === 'Local Mechanic')
              .slice(0, 3)
              .map((shop, index) => (
                <div key={index} className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-2xl p-6 border border-orange-400/30">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2">{shop.name}</h4>
                      <p className="text-orange-300 font-medium">📍 {shop.address}</p>
                      <p className="text-cyan-300 font-medium">📞 {shop.phone}</p>
                      <div className="flex items-center mt-2">
                        <span className="text-yellow-400">⭐ {shop.rating}</span>
                        <span className="text-gray-300 ml-2">• {shop.experience}</span>
                      </div>
                    </div>
                    <div className="bg-green-500/20 px-3 py-2 rounded-xl border border-green-400/30">
                      <span className="text-green-300 font-semibold text-sm">Best Value</span>
                    </div>
                  </div>

                  {/* Pricing Table for this Shop */}
                  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-orange-500/30 to-red-500/30">
                            <th className="text-left p-3 text-white font-semibold text-sm">Part</th>
                            <th className="text-center p-3 text-white font-semibold text-sm">Shop Price</th>
                            <th className="text-center p-3 text-white font-semibold text-sm">OEM Price</th>
                            <th className="text-center p-3 text-white font-semibold text-sm">You Save</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pricingTable && pricingTable.map((item, idx) => {
                            // Calculate shop-specific pricing based on shop characteristics
                            const basePriceMultiplier = shop.rating >= 4.5 ? 0.85 : 0.75; // Higher rated shops charge slightly more
                            const shopPrice = Math.round(item.aftermarketPrice * basePriceMultiplier);
                            const savings = item.oemPrice - shopPrice;
                            const savingsPercent = ((savings / item.oemPrice) * 100).toFixed(1);
                            
                            return (
                              <tr key={idx} className="border-t border-white/10">
                                <td className="p-3 text-white text-sm">{item.part}</td>
                                <td className="p-3 text-center text-green-300 font-semibold text-sm">₹{shopPrice.toLocaleString()}</td>
                                <td className="p-3 text-center text-yellow-300 font-medium text-sm">₹{item.oemPrice.toLocaleString()}</td>
                                <td className="p-3 text-center text-cyan-300 font-semibold text-sm">₹{savings.toLocaleString()} ({savingsPercent}%)</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Additional Shop Info */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                    <div className="flex flex-wrap gap-2">
                      {shop.specialties && shop.specialties.slice(0, 3).map((specialty, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                          {specialty}
                        </span>
                      ))}
                    </div>
                    <div className="text-right">
                      <p className="text-orange-300 text-sm font-medium">
                        Estimated Wait: {shop.estimatedWaitDays} day{shop.estimatedWaitDays !== 1 ? 's' : ''}
                      </p>
                      <p className="text-gray-400 text-xs">{shop.workingHours}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showHistory, setShowHistory] = useState(false);

  // Extract data from location state with new dual pricing structure and repair analysis
  const { 
    carInfo, detectedParts, detections, confidenceUsed, 
    costBreakdown, totalCost, reportUrl, provider, attempts, 
    normalization, baselineVersion, pricingTable, totalOEMCost, 
    totalAftermarketCost, currency, state, repairAnalysis,
    nearestServiceCenters, estimatedRepairTime
  } = location.state || {};
  
  // Map the data to the expected format for the ResultCard component
  const damagedParts = detectedParts?.map(part => ({
    name: part,
    severity: 'Moderate', // Default severity - you can enhance this later
    description: '' // you can customize this if you want
  }));

  // Deduplicate raw detections: keep the highest-confidence entry per part name
  const uniqueDetections = (() => {
    if (!detections || !Array.isArray(detections)) return [];
    const m = new Map();
    for (const d of detections) {
      const key = (d.name || d.class || '').toString().toLowerCase();
      if (!key) continue;
      const existing = m.get(key);
      if (!existing) m.set(key, d);
      else {
        const econf = typeof existing.confidence === 'number' ? existing.confidence : 0;
        const dconf = typeof d.confidence === 'number' ? d.confidence : 0;
        if (dconf > econf) m.set(key, d);
      }
    }
    return Array.from(m.values());
  })();

  // Handle case where no data is available (direct navigation)
  if (!location.state || !detectedParts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">No Data Available</h2>
          <p className="text-gray-300 mb-8">Please upload an image first to see the analysis results.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white font-bold py-3 px-8 rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.02]"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const handleGoBack = () => {
    navigate('/');
  };

  const handleShareReport = async () => {
    const reportData = {
      vehicle: carInfo ? `${carInfo.year} ${carInfo.name} ${carInfo.model}` : 'Vehicle',
      damagedParts: damagedParts?.map(part => part.name).join(', ') || 'None detected',
  totalCost: totalCost ? `₹${(totalCost).toLocaleString()}` : 'Not calculated',
      timestamp: new Date().toLocaleDateString('en-IN')
    };

    const shareText = `🚗 AutoFix AI Damage Report\n\n` +
      `Vehicle: ${reportData.vehicle}\n` +
      `Damaged Parts: ${reportData.damagedParts}\n` +
      `Estimated Cost: ${reportData.totalCost}\n` +
      `Date: ${reportData.timestamp}\n\n` +
      `Generated by AutoFix AI - Professional Vehicle Damage Assessment`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AutoFix AI Damage Report',
          text: shareText,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        fallbackShare(shareText);
      }
    } else {
      fallbackShare(shareText);
    }
  };

  const fallbackShare = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Report copied to clipboard! You can now paste it anywhere.');
      }).catch(() => {
        showReportModal(text);
      });
    } else {
      showReportModal(text);
    }
  };

  const showReportModal = (text) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.8); display: flex; align-items: center; 
      justify-content: center; z-index: 10000;
    `;
    
    modal.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 10px; max-width: 500px; margin: 20px;">
        <h3 style="color: #333; margin-bottom: 15px;">Share Your Report</h3>
        <textarea readonly style="width: 100%; height: 200px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace; font-size: 12px;">${text}</textarea>
        <div style="margin-top: 15px; text-align: right;">
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #6366f1; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  };
const handleDownloadReport = async () => {
    const reportId = `AR-${Date.now().toString(36).toUpperCase()}`;
    const currentDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>AutoFix AI - Vehicle Damage Assessment Report</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body { 
                font-family: 'Inter', Arial, sans-serif; 
                font-size: 11px;
                line-height: 1.3; 
                color: #1a1a1a;
                background: white;
                padding: 15px;
            }
            
            .report-container {
                max-width: 100%;
                background: white;
            }
            
            .header {
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                color: white;
                padding: 15px;
                text-align: center;
                border-radius: 8px;
                margin-bottom: 15px;
            }
            
            .logo {
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 3px;
            }
            
            .tagline {
                font-size: 10px;
                opacity: 0.9;
                margin-bottom: 8px;
            }
            
            .report-id {
                display: inline-block;
                background: rgba(255,255,255,0.2);
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 9px;
                font-weight: 600;
            }
            
            .content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 15px;
            }
            
            .left-column, .right-column {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .section {
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                padding: 10px;
            }
            
            .section-title {
                font-size: 12px;
                font-weight: 700;
                color: #1e3c72;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                border-bottom: 1px solid #e2e8f0;
                padding-bottom: 4px;
            }
            
            .section-icon {
                margin-right: 6px;
                font-size: 10px;
            }
            
            .info-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 3px 0;
                border-bottom: 1px solid #f1f5f9;
            }
            
            .info-row:last-child {
                border-bottom: none;
            }
            
            .info-label {
                font-size: 9px;
                font-weight: 600;
                color: #64748b;
                flex: 1;
            }
            
            .info-value {
                font-size: 10px;
                font-weight: 600;
                color: #1e293b;
                text-align: right;
                flex: 1;
            }
            
            .damage-item {
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 4px;
                padding: 6px 8px;
                margin-bottom: 4px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 9px;
            }
            
            .damage-name {
                font-weight: 600;
                color: #dc2626;
            }
            
            .damage-severity {
                background: #dc2626;
                color: white;
                padding: 2px 6px;
                border-radius: 8px;
                font-size: 8px;
                font-weight: 600;
            }
            
            .cost-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 0;
                border-bottom: 1px solid #e2e8f0;
                font-size: 9px;
            }
            
            .cost-item:last-child {
                border-bottom: none;
            }
            
            .cost-name {
                font-weight: 500;
                color: #374151;
            }
            
            .cost-value {
                font-weight: 700;
                color: #059669;
            }
            
            .total-cost {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                color: white;
                padding: 12px;
                border-radius: 6px;
                text-align: center;
                grid-column: 1 / -1;
            }
            
            .total-label {
                font-size: 10px;
                opacity: 0.9;
                margin-bottom: 4px;
            }
            
            .total-amount {
                font-size: 20px;
                font-weight: 700;
            }
            
            .footer {
                background: #f1f5f9;
                padding: 12px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                text-align: center;
                margin-top: 10px;
            }
            
            .disclaimer {
                font-size: 8px;
                color: #64748b;
                line-height: 1.3;
                margin-bottom: 8px;
            }
            
            .credentials {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-bottom: 6px;
                flex-wrap: wrap;
            }
            
            .credential {
                font-size: 8px;
                color: #475569;
            }
            
            .contact-info {
                font-size: 7px;
                color: #64748b;
                margin-top: 6px;
            }
            
            .compact-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 6px;
            }
            
            .compact-item {
                font-size: 8px;
                padding: 4px;
                background: #f8fafc;
                border-radius: 3px;
                text-align: center;
            }
            
            .compact-label {
                font-weight: 600;
                color: #64748b;
                display: block;
            }
            
            .compact-value {
                font-weight: 600;
                color: #1e293b;
                margin-top: 2px;
            }
        </style>
    </head>
    <body>
        <div class="report-container">
            <div class="header">
                <div class="logo">AutoFix AI</div>
                <div class="tagline">Professional Vehicle Damage Assessment</div>
                <div class="report-id">Report ID: ${reportId}</div>
            </div>
            
            <div class="content">
                <div class="left-column">
                    <div class="section">
                        <h3 class="section-title">
                            <span class="section-icon">📊</span>
                            Report Info
                        </h3>
                        <div class="compact-grid">
                            <div class="compact-item">
                                <span class="compact-label">Date</span>
                                <div class="compact-value">${currentDate}</div>
                            </div>
                            <div class="compact-item">
                                <span class="compact-label">Time</span>
                                <div class="compact-value">${currentTime}</div>
                            </div>
                            <div class="compact-item">
                                <span class="compact-label">Method</span>
                                <div class="compact-value">AI Analysis</div>
                            </div>
                            <div class="compact-item">
                                <span class="compact-label">Status</span>
                                <div class="compact-value">Complete</div>
                            </div>
                        </div>
                    </div>

                    ${carInfo ? `
                    <div class="section">
                        <h3 class="section-title">
                            <span class="section-icon">🚗</span>
                            Vehicle Info
                        </h3>
                        <div class="info-row">
                            <span class="info-label">Vehicle</span>
                            <span class="info-value">${carInfo.year} ${carInfo.name} ${carInfo.model}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Assessment</span>
                            <span class="info-value">External Damage</span>
                        </div>
                    </div>
                    ` : ''}

                    <div class="section">
                        <h3 class="section-title">
                            <span class="section-icon">⚠️</span>
                            Damage Detected
                        </h3>
                        ${damagedParts && damagedParts.length > 0 ? 
                            damagedParts.slice(0, 4).map(part => `
                                <div class="damage-item">
                                    <span class="damage-name">${part.name}</span>
                                    <span class="damage-severity">${part.severity}</span>
                                </div>
                            `).join('') : 
                            '<div class="damage-item"><span class="damage-name">No damage detected</span></div>'
                        }
                        ${damagedParts && damagedParts.length > 4 ? 
                            `<div style="font-size: 8px; text-align: center; color: #64748b; margin-top: 4px;">+${damagedParts.length - 4} more items</div>` : ''}
                    </div>
                </div>

                <div class="right-column">
                    <div class="section">
                        <h3 class="section-title">
                            <span class="section-icon">💰</span>
                            Cost Breakdown
                        </h3>
                        ${costBreakdown && costBreakdown.length > 0 ? 
              costBreakdown.slice(0, 6).map(item => `
                                <div class="cost-item">
                                    <span class="cost-name">${item.part}</span>
                  <span class="cost-value">₹${(item.cost).toLocaleString()}</span>
                                </div>
                            `).join('') : 
                            '<div class="cost-item"><span class="cost-name">No costs calculated</span></div>'
                        }
                        ${costBreakdown && costBreakdown.length > 6 ? 
                            `<div style="font-size: 8px; text-align: center; color: #64748b; margin-top: 4px;">+${costBreakdown.length - 6} more items</div>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="total-cost">
                <div class="total-label">Estimated Total Repair Cost</div>
        <div class="total-amount">₹${((totalCost || 0)).toLocaleString()}</div>
            </div>
            
            <div class="footer">
                <div class="credentials">
                    <span class="credential">✓ AI-Certified</span>
                    <span class="credential">🔒 Secure</span>
                    <span class="credential">📈 Industry Standard</span>
                </div>
                
                <div class="disclaimer">
                    <strong>DISCLAIMER:</strong> AI-generated estimate. Actual costs may vary based on location, labor rates, and hidden damages. Consult certified professionals for final decisions.
                </div>
                
                <div class="contact-info">
                    AutoFix AI | Report: ${reportId} | Generated: ${currentDate} ${currentTime}
                </div>
            </div>
        </div>
    </body>
    </html>`;

    // Create PDF with optimized settings for single page
    const pdf = new jsPDF('p', 'mm', 'a4');
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    element.style.width = '210mm';
    element.style.height = 'auto';
    element.style.overflow = 'hidden';
    document.body.appendChild(element);

    try {
        const canvas = await html2canvas(element, {
            scale: 1.5, // Reduced scale for better fit
            useCORS: true,
            allowTaint: true,
            height: element.scrollHeight,
            windowHeight: element.scrollHeight
        });

        document.body.removeChild(element);

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190; // A4 width minus margins
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // If content is too tall, scale it down to fit
        if (imgHeight > 277) { // A4 height minus margins
            const scaleFactor = 277 / imgHeight;
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth * scaleFactor, 277);
        } else {
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        }

        const blob = pdf.output('blob');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `AutoFix-AI-Report-${reportId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please try again.');
    }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AutoFix AI
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center space-x-2 text-white hover:text-green-300 transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium">History</span>
              </button>
              <button
                onClick={handleGoBack}
                className="flex items-center space-x-2 text-white hover:text-cyan-300 transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium">Back</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-6 shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Damage Report
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            AI analysis complete! Here's your detailed damage assessment and repair cost breakdown.
          </p>
          <div className="flex flex-col items-center justify-center mt-6 space-y-3 text-sm text-gray-400">
            <div className="flex items-center space-x-6">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span>✅ Analysis Complete</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
              <span>🔍 Parts Identified</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
              <span>💰 Costs Calculated</span>
            </div>
            </div>
            {provider && (
              <div className="text-center text-gray-400 text-xs space-y-1">
                <div>
                  Cost Provider: <span className="text-cyan-300 font-semibold uppercase">{provider}</span>
                  {attempts && attempts.length > 1 && (
                    <span className="ml-2 text-gray-500">(Attempts: {attempts.map(a => `${a.provider}:${a.ok ? 'OK' : 'X'}`).join(', ')})</span>
                  )}
                </div>
                {baselineVersion && (
                  <div className="text-[10px] text-gray-500">Baseline v{baselineVersion}</div>
                )}
                {normalization && normalization.length > 0 && (
                  <div className="text-[10px] text-amber-400">Adjusted to market range for {normalization.length} item{normalization.length>1?'s':''}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Detection Details Section (raw detections with confidence) */}
        {uniqueDetections && uniqueDetections.length > 0 && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 2C6.477 2 2 6.486 2 12s4.477 10 10 10 10-4.486 10-10S17.523 2 12 2z" />
                  </svg>
                </div>
                Detection Details (conf ≥ {confidenceUsed})
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {uniqueDetections.map((d,i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                      <span className="text-white font-medium capitalize">{d.name}</span>
                    </div>
                    <div className="text-cyan-300 text-sm font-semibold">{d.confidence ? (d.confidence * 100).toFixed(1) : '—'}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Result Card */}
        <div className="max-w-4xl mx-auto mb-12">
          <ResultCard 
            damagedParts={damagedParts}
            costBreakdown={costBreakdown}
            totalCost={totalCost}
            carInfo={carInfo}
            pricingTable={pricingTable}
            totalOEMCost={totalOEMCost}
            totalAftermarketCost={totalAftermarketCost}
            currency={currency}
            state={state}
            repairAnalysis={repairAnalysis}
            nearestServiceCenters={nearestServiceCenters}
            estimatedRepairTime={estimatedRepairTime}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleGoBack}
            className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-cyan-400/50 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Analyze Another Image</span>
          </button>
          
          <button 
            onClick={handleDownloadReport}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-green-400/50 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download Report</span>
          </button>

          <button 
            onClick={handleShareReport}
            className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-white/10 transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-white/20 flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Share Report</span>
          </button>

    {/* Chatbot (RAG) - pass structured result context so chat can answer from visible analysis */}
    <Chatbot context={{ carInfo, detectedParts, costBreakdown, totalCost }} />
        </div>

        {/* Footer Info */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-6 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
              <span>🤖 AI Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full animate-pulse"></div>
              <span>📊 Detailed Report</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse"></div>
              <span>💰 Cost Estimate</span>
            </div>
          </div>
          <p className="text-gray-500 text-xs mt-4">
            © 2024 AutoFix AI. Professional Vehicle Damage Assessment.
          </p>
        </div>
      </div>

      {/* History Modal */}
      <History 
        isVisible={showHistory} 
        onClose={() => setShowHistory(false)} 
      />
    </div>
  );
};

export default Result;