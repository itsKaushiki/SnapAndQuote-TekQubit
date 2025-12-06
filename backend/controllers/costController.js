const CarCost = require('../models/CarCost');
const Report = require('../models/Report');
const generatePDF = require('../utils/pdfGenerator'); // PDF report utility
const path = require('path');
const fs = require('fs');

// Load enhanced pricing data and service centers
const enhancedPricingPath = path.join(__dirname, '../data/part_cost_enhanced.inr.json');
const serviceCentersPath = path.join(__dirname, '../data/service_centers.json');
let baselinePricing = {};
let serviceCenters = {};

try {
  baselinePricing = JSON.parse(fs.readFileSync(enhancedPricingPath, 'utf8'));
  serviceCenters = JSON.parse(fs.readFileSync(serviceCentersPath, 'utf8'));
} catch (error) {
  console.error('Error loading enhanced pricing or service centers data:', error);
  // Fallback to basic pricing
  try {
    const fallbackPath = path.join(__dirname, '../data/part_cost_baseline.inr.json');
    baselinePricing = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
  } catch (fallbackError) {
    console.error('Error loading fallback pricing data:', fallbackError);
  }
}

exports.estimateCost = async (req, res) => {
  const { carName, carModel, carYear, detectedParts, originalImage, detectionResults, state } = req.body;

  console.log('📊 Enhanced cost estimation called:', { carName, carModel, carYear, detectedParts, state, hasDetectionResults: !!detectionResults });

  try {
    // Get nearest service centers
    const nearestCenters = getNearestServiceCenters(state);
    
    // Use enhanced pricing data with repair vs replace analysis
    const pricingTable = [];
    const repairAnalysis = [];
    let totalOEMCost = 0;
    let totalAftermarketCost = 0;
    let totalRepairCost = 0;
    let totalEstimatedDays = 0;

    // Calculate enhanced pricing for each detected part
    detectedParts.forEach((part) => {
      const partPricing = baselinePricing.parts[part] || baselinePricing.defaults;
      
      const oemPrice = partPricing.oem || partPricing.max;
      const aftermarketPrice = partPricing.aftermarket || partPricing.min;
      
      // Apply state-based multiplier if provided
      const stateMultiplier = getStateMultiplier(state);
      
      // Calculate damage severity and repair recommendation
      const severity = calculateDamageSeverity(detectionResults?.detections, part);
      const repairRecommendation = getRepairRecommendation(part, severity, partPricing);
      const timeEstimate = calculateRepairTime(part, severity, partPricing, repairRecommendation);
      
      // Apply state multiplier to costs
      const finalOEMPrice = Math.round(oemPrice * stateMultiplier);
      const finalAftermarketPrice = Math.round(aftermarketPrice * stateMultiplier);
      const finalRepairCost = Math.round(repairRecommendation.estimatedCost * stateMultiplier);
      
      pricingTable.push({
        part: part.charAt(0).toUpperCase() + part.slice(1),
        oemPrice: finalOEMPrice,
        aftermarketPrice: finalAftermarketPrice,
        repairCost: finalRepairCost,
        savings: Math.round((finalOEMPrice - finalAftermarketPrice)),
        savingsPercent: Math.round(((finalOEMPrice - finalAftermarketPrice) / finalOEMPrice) * 100),
        repairVsReplaceSavings: Math.round(finalAftermarketPrice - finalRepairCost),
        severity: Math.round(severity * 100), // Convert to percentage
        recommendation: repairRecommendation.recommendation,
        recommendationReason: repairRecommendation.reason
      });
      
      repairAnalysis.push({
        part: part.charAt(0).toUpperCase() + part.slice(1),
        severity: Math.round(severity * 100),
        severityLevel: repairRecommendation.severityLevel,
        recommendation: repairRecommendation.recommendation,
        reason: repairRecommendation.reason,
        repairCost: finalRepairCost,
        replaceCost: finalAftermarketPrice,
        costSaving: Math.round(finalAftermarketPrice - finalRepairCost),
        estimatedTime: timeEstimate,
        complexity: partPricing.complexity || 'medium'
      });
      
      totalOEMCost += finalOEMPrice;
      totalAftermarketCost += finalAftermarketPrice;
      totalRepairCost += finalRepairCost;
      totalEstimatedDays = Math.max(totalEstimatedDays, timeEstimate.days);
    });

    // Legacy format for backward compatibility
    const costBreakdown = {};
    pricingTable.forEach(item => {
      costBreakdown[item.part.toLowerCase()] = item.aftermarketPrice; // Use aftermarket as default
    });

    // Generate enhanced PDF report
    const pdfPath = await generatePDF({
      car: { name: carName, model: carModel, year: carYear },
      parts: costBreakdown, // Legacy format
      totalCost: totalAftermarketCost,
      pricingTable,
      totalOEMCost,
      totalAftermarketCost,
      currency: baselinePricing.currency || 'INR',
      state: state || 'Default',
      repairAnalysis,
      nearestServiceCenters: nearestCenters,
      estimatedRepairTime: {
        totalDays: totalEstimatedDays,
        note: "Time may vary based on service center capacity"
      }
    });

    // Save report metadata to database for history
    try {
      const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const fileName = `AutoFix-AI-Report-${reportId}.pdf`;
      
      // Convert detected parts array to format expected by Report model
      const detectedPartsFormatted = Array.isArray(detectedParts) 
        ? detectedParts.map(part => ({ name: part, confidence: 0.8 }))
        : Object.keys(detectedParts).map(part => ({ name: part, confidence: 0.8 }));
      
      // Convert cost breakdown to array format
      const costBreakdownArray = Object.entries(costBreakdown).map(([part, cost]) => ({
        part,
        cost: typeof cost === 'number' ? cost : 0
      }));

      const reportRecord = new Report({
        reportId,
        fileName,
        filePath: pdfPath,
        carInfo: {
          name: carName,
          model: carModel,
          year: parseInt(carYear)
        },
        detectedParts: detectedPartsFormatted,
        costBreakdown: costBreakdownArray,
        totalCost,
        originalImage: originalImage || 'unknown',
        downloadCount: 0
      });

      await reportRecord.save();
      console.log(`Report saved to history: ${reportId}`);
    } catch (historyError) {
      console.error('Failed to save report to history:', historyError);
      // Don't fail the request if history save fails
    }

    // Return enhanced response with all new features
    res.status(200).json({
      // Legacy compatibility
      costBreakdown,
      totalCost: totalAftermarketCost,
      
      // Enhanced pricing data
      pricingTable,
      totalOEMCost,
      totalAftermarketCost,
      totalRepairCost,
      totalSavings: totalOEMCost - totalAftermarketCost,
      totalSavingsPercent: Math.round(((totalOEMCost - totalAftermarketCost) / totalOEMCost) * 100),
      
      // New features
      repairAnalysis,
      nearestServiceCenters: nearestCenters,
      estimatedRepairTime: {
        totalDays: totalEstimatedDays,
        note: "Estimated time may vary based on service center capacity and part availability"
      },
      
      // Metadata
      currency: baselinePricing.currency || 'INR',
      state: state || 'Default',
      reportLink: pdfPath,
      analysisVersion: baselinePricing.version || '2025-10-11-v2-enhanced'
    });

  } catch (err) {
    console.error('Error in estimateCost:', err);
    res.status(500).json({ error: 'Error fetching cost estimation' });
  }
};

// Function to calculate damage severity based on confidence and detection count
function calculateDamageSeverity(detections, part) {
  if (!detections || detections.length === 0) return 0.3; // Default moderate severity
  
  // Find detections for this specific part
  const partDetections = detections.filter(d => d.name === part);
  if (partDetections.length === 0) return 0.3;
  
  // Calculate severity based on confidence and number of detections
  const avgConfidence = partDetections.reduce((sum, d) => sum + d.confidence, 0) / partDetections.length;
  const detectionCount = partDetections.length;
  
  // Higher confidence and more detections indicate more severe damage
  let severity = (avgConfidence * 0.7) + (Math.min(detectionCount / 5, 1) * 0.3);
  
  // Normalize to 0-1 range
  return Math.min(Math.max(severity, 0.1), 0.9);
}

// Function to determine repair vs replace recommendation
function getRepairRecommendation(part, severity, partData) {
  const repairThreshold = partData.repair_threshold || 0.3;
  const repairCost = partData.repair?.general_repair || partData.aftermarket * 0.4;
  const replaceCost = partData.aftermarket;
  
  if (severity <= repairThreshold) {
    return {
      recommendation: 'repair',
      reason: 'Minor damage - cost-effective to repair',
      estimatedCost: Math.round(repairCost),
      costEffective: true,
      severityLevel: 'minor'
    };
  } else if (severity <= 0.6) {
    const repairVsReplace = repairCost / replaceCost;
    if (repairVsReplace < 0.7) {
      return {
        recommendation: 'repair',
        reason: 'Moderate damage - repair is more economical',
        estimatedCost: Math.round(repairCost * 1.2),
        costEffective: true,
        severityLevel: 'moderate'
      };
    } else {
      return {
        recommendation: 'replace',
        reason: 'Moderate damage - replacement offers better value',
        estimatedCost: Math.round(replaceCost),
        costEffective: false,
        severityLevel: 'moderate'
      };
    }
  } else {
    return {
      recommendation: 'replace',
      reason: 'Severe damage - replacement recommended for safety and reliability',
      estimatedCost: Math.round(replaceCost),
      costEffective: false,
      severityLevel: 'severe'
    };
  }
}

// Function to calculate estimated repair time
function calculateRepairTime(part, severity, partData, recommendation) {
  const timeData = partData.repair_time_hours || { minor: 2, moderate: 4, severe: 8 };
  const complexity = partData.complexity || 'medium';
  
  let baseTime;
  if (severity <= 0.3) {
    baseTime = timeData.minor;
  } else if (severity <= 0.6) {
    baseTime = timeData.moderate;
  } else {
    baseTime = timeData.severe;
  }
  
  // Adjust time based on complexity and recommendation
  let multiplier = 1;
  if (complexity === 'high') multiplier = 1.3;
  if (complexity === 'low') multiplier = 0.8;
  if (recommendation.recommendation === 'replace') multiplier *= 0.9; // Replace is often quicker
  
  const totalHours = Math.round(baseTime * multiplier);
  const days = Math.ceil(totalHours / 8); // Assuming 8-hour work day
  
  return {
    hours: totalHours,
    days: Math.max(days, 1),
    complexity: complexity
  };
}

// Function to find nearest service centers (both local mechanics and global companies)
function getNearestServiceCenters(state, limit = 6) {
  try {
    // Load enhanced service centers database
    const enhancedServiceCenters = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/service_centers_enhanced.json'), 'utf8'));
    
    // Find service centers for the specified state
    const stateKey = Object.keys(enhancedServiceCenters.service_centers).find(
      key => key.toLowerCase().includes(state?.toLowerCase()) || state?.toLowerCase().includes(key.toLowerCase())
    );
    
    let stateCenters = [];
    
    if (stateKey && enhancedServiceCenters.service_centers[stateKey]) {
      stateCenters = enhancedServiceCenters.service_centers[stateKey];
    } else {
      // Fallback: return a mix from major cities
      console.log(`State ${state} not found in enhanced database, using fallback centers`);
      Object.keys(enhancedServiceCenters.service_centers).forEach(stateKey => {
        const centers = enhancedServiceCenters.service_centers[stateKey];
        if (centers.length > 0) {
          stateCenters.push(centers[0]); // Add one from each state
        }
      });
      return stateCenters.slice(0, limit);
    }
    
    // Separate local mechanics and global companies for balanced selection
    const localMechanics = stateCenters.filter(center => center.type === 'Local Mechanic');
    const globalCompanies = stateCenters.filter(center => center.type && center.type.includes('Global Company'));
    
    // Create balanced mix: prioritize local mechanics and global companies
    const selectedCenters = [];
    
    // Add top local mechanics (sorted by rating and experience)
    const topLocalMechanics = localMechanics
      .sort((a, b) => {
        const ratingDiff = (b.rating || 4.0) - (a.rating || 4.0);
        if (Math.abs(ratingDiff) > 0.1) return ratingDiff;
        return (b.estimatedWaitDays || 2) - (a.estimatedWaitDays || 2);
      })
      .slice(0, Math.ceil(limit / 2));
    selectedCenters.push(...topLocalMechanics);
    
    // Add top global companies (sorted by rating and certifications)
    const topGlobalCompanies = globalCompanies
      .sort((a, b) => {
        const ratingDiff = (b.rating || 4.0) - (a.rating || 4.0);
        if (Math.abs(ratingDiff) > 0.1) return ratingDiff;
        return (a.estimatedWaitDays || 3) - (b.estimatedWaitDays || 3);
      })
      .slice(0, limit - selectedCenters.length);
    selectedCenters.push(...topGlobalCompanies);
    
    // If we still need more centers, fill with remaining ones
    if (selectedCenters.length < limit) {
      const remaining = stateCenters
        .filter(center => !selectedCenters.includes(center))
        .sort((a, b) => (b.rating || 4.0) - (a.rating || 4.0))
        .slice(0, limit - selectedCenters.length);
      selectedCenters.push(...remaining);
    }
    
    return selectedCenters.slice(0, limit);
      
  } catch (error) {
    console.error('Error loading enhanced service centers:', error);
    // Fallback to old service centers format if available
    const normalizedState = state?.toLowerCase().trim() || 'default';
    const centers = serviceCenters.service_centers?.[normalizedState] || serviceCenters.service_centers?.['default'] || [];
    
    return centers.sort((a, b) => {
      const ratingDiff = (b.rating || 4.0) - (a.rating || 4.0);
      if (Math.abs(ratingDiff) > 0.1) return ratingDiff;
      return (a.estimated_wait_days || 2) - (b.estimated_wait_days || 2);
    }).slice(0, limit);
  }
}

// Function to get state-based pricing multiplier
function getStateMultiplier(state) {
  if (!state) return 1.0;
  
  // State-based pricing multipliers for India
  const stateMultipliers = {
    // Tier 1 cities (Higher costs)
    'delhi': 1.3,
    'mumbai': 1.35,
    'bangalore': 1.25,
    'hyderabad': 1.2,
    'pune': 1.2,
    'chennai': 1.25,
    'kolkata': 1.15,
    'ahmedabad': 1.1,
    'surat': 1.05,
    
    // Tier 2 cities (Moderate costs)
    'jaipur': 1.0,
    'lucknow': 0.95,
    'kanpur': 0.9,
    'nagpur': 0.95,
    'indore': 0.95,
    'thane': 1.25,
    'bhopal': 0.9,
    'visakhapatnam': 0.9,
    'pimpri': 1.15,
    'patna': 0.85,
    
    // Tier 3 cities and rural areas (Lower costs)
    'agra': 0.8,
    'nashik': 0.9,
    'faridabad': 1.1,
    'meerut': 0.85,
    'rajkot': 0.9,
    'kalyan': 1.2,
    'vasai': 1.15,
    'varanasi': 0.8,
    'srinagar': 0.85,
    'aurangabad': 0.85,
    
    // Default for unlisted cities/states
    'default': 1.0
  };
  
  const normalizedState = state.toLowerCase().trim();
  return stateMultipliers[normalizedState] || stateMultipliers['default'];
}
