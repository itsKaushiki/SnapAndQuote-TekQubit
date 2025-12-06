import React, { useState } from 'react';
import { uploadCarImage, detectDamage, estimateCost } from "../services/api";
import { useNavigate } from 'react-router-dom';

const UploadForm = () => {
  // Mock navigate function for demo purposes
const navigate = useNavigate();


  const [formData, setFormData] = useState({
    carImage: null,
    carName: '',
    model: '',
    year: '',
    state: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);

  // Camera functionality
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setErrors(prev => ({
        ...prev,
        camera: 'Unable to access camera. Please check permissions.'
      }));
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    const video = document.getElementById('cameraVideo');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    
    canvas.toBlob(blob => {
      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      setFormData(prev => ({
        ...prev,
        carImage: file
      }));
      stopCamera();
    });
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'carImage') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.carImage) {
      newErrors.carImage = 'Please select a car image';
    }
    
    if (!formData.carName.trim()) {
      newErrors.carName = 'Car name is required';
    }
    
    if (!formData.model.trim()) {
      newErrors.model = 'Car model is required';
    }
    
    if (!formData.year.trim()) {
      newErrors.year = 'Car year is required';
    } else if (!/^\d{4}$/.test(formData.year)) {
      newErrors.year = 'Please enter a valid 4-digit year';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const submitData = new FormData();
      submitData.append('carImage', formData.carImage);
      submitData.append('carName', formData.carName);
      submitData.append('model', formData.model);
      submitData.append('year', formData.year);
      
      // Mock API call for demo purposes
      console.log('Sending data to /api/upload:', {
        carName: formData.carName,
        model: formData.model,
        year: formData.year,
        imageFile: formData.carImage?.name
      });
      
      // Simulate API response
     // Prepare the FormData
const realFormData = new FormData();
realFormData.append('image', formData.carImage);
realFormData.append('name', formData.carName);
realFormData.append('model', formData.model);
realFormData.append('year', formData.year);
if (formData.state) {
  realFormData.append('state', formData.state);
}

// 1️⃣ Upload the image first
const uploadResponse = await uploadCarImage(realFormData);
const { filename, carInfo } = uploadResponse;

// 2️⃣ Detect damage in the uploaded image
const detectionResponse = await detectDamage(filename);
const detectedParts = detectionResponse.parts;
const detections = detectionResponse.detections || [];

if (!detectedParts || detectedParts.length === 0) {
  alert('❌ No damage detected in the image.');
  return;
}

// 3️⃣ Get cost estimation with state-based pricing
const costResponse = await estimateCost({
  carName: carInfo.name,
  carModel: carInfo.model,
  carYear: carInfo.year,
  detectedParts: detectedParts,
  state: formData.state
});

// 4️⃣ Navigate to results page with all data including dual pricing and repair analysis
navigate('/result', { 
  state: { 
    carInfo: carInfo,
    detectedParts: detectedParts,
    detections: detections,
    confidenceUsed: detectionResponse.confidence_used,
    costBreakdown: costResponse.costBreakdown,
    totalCost: costResponse.totalCost,
    pricingTable: costResponse.pricingTable,
    totalOEMCost: costResponse.totalOEMCost,
    totalAftermarketCost: costResponse.totalAftermarketCost,
    currency: costResponse.currency,
    state: formData.state,
    provider: costResponse.provider,
    attempts: costResponse.attempts,
    reportUrl: costResponse.reportUrl,
    repairAnalysis: costResponse.repairAnalysis,
    nearestServiceCenters: costResponse.nearestServiceCenters,
    estimatedRepairTime: costResponse.estimatedRepairTime
  } 
});

    } catch (error) {
      console.error('❌ Analysis flow error:', error);

      let errorMessage = 'An error occurred while analyzing the image. Please try again.';
      const resp = error.response?.data;

      if (resp?.message) {
        errorMessage = resp.message;
        // Append minimal debug context if available from detection
        if (resp.exitCode !== undefined) {
          errorMessage += ` (code ${resp.exitCode})`;
        }
        if (resp.stderr) {
          errorMessage += '\nDetails: ' + (Array.isArray(resp.stderr) ? resp.stderr.join(' | ') : resp.stderr).toString().slice(0,300);
        }
        if (resp.jsonLine) {
          errorMessage += '\nRaw JSON: ' + resp.jsonLine;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setIsLoading(false);
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
      
      {/* Main Content */}
      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full mb-6 shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              AutoFix AI
            </h1>
            <p className="text-xl text-gray-300 max-w-md mx-auto leading-relaxed">
              Advanced AI-powered car damage analysis in seconds
            </p>
            <div className="flex items-center justify-center mt-4 space-x-4 text-sm text-gray-400">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span>99.9% Accurate</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
                <span>Instant Results</span>
              </div>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 transform hover:scale-[1.02] transition-all duration-300">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* File Upload Section */}
              <div className="space-y-3">
                <label className="block text-lg font-semibold text-white mb-4">
                  📸 Upload Car Image
                </label>
               <div
  className="relative cursor-pointer"
  onClick={() => document.getElementById("carImage").click()}
>
  <div className="flex justify-center px-6 pt-8 pb-8 border-2 border-dashed border-cyan-400/50 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:border-cyan-400 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300">
    <div className="space-y-2 text-center">
      {formData.carImage ? (
        <div className="space-y-3">
          <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-300 font-medium text-lg">
            ✓ {formData.carImage.name}
          </p>
          <p className="text-gray-400 text-sm">Click to change image</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-xl font-semibold text-cyan-300">
            Click anywhere to upload or drag and drop
          </p>
          <p className="text-gray-400">PNG, JPG, GIF up to 10MB</p>
        </div>
      )}
      <input
        id="carImage"
        name="carImage"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleInputChange}
      />
    </div>
  </div>

                  {errors.carImage && (
                    <p className="mt-3 text-red-400 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.carImage}
                    </p>
                  )}

                  {/* Camera Option */}
                  <div className="mt-4">
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        📱 Use Camera
                      </button>
                    </div>
                    {errors.camera && (
                      <p className="mt-2 text-red-400 text-sm text-center">{errors.camera}</p>
                    )}
                  </div>
                </div>

                {/* Camera Modal */}
                {showCamera && (
                  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-white mb-2">📷 Take a Photo</h3>
                        <p className="text-gray-300 text-sm">Position your car in the frame and capture</p>
                      </div>
                      
                      <video
                        id="cameraVideo"
                        autoPlay
                        playsInline
                        ref={(video) => {
                          if (video && stream) {
                            video.srcObject = stream;
                          }
                        }}
                        className="w-full rounded-xl mb-4"
                      />
                      
                      <div className="flex justify-center space-x-4">
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                        >
                          📸 Capture
                        </button>
                        <button
                          type="button"
                          onClick={stopCamera}
                          className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                        >
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Car Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Car Name */}
                <div className="space-y-3">
                  <label htmlFor="carName" className="block text-lg font-semibold text-white">
                    🚗 Car Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="carName"
                      name="carName"
                      value={formData.carName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-4 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-300 ${
                        errors.carName ? 'border-red-400 ring-2 ring-red-400' : 'border-white/30 hover:border-white/50'
                      }`}
                      placeholder="Honda Civic"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  {errors.carName && (
                    <p className="text-red-400 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.carName}
                    </p>
                  )}
                </div>

                {/* Model */}
                <div className="space-y-3">
                  <label htmlFor="model" className="block text-lg font-semibold text-white">
                    ⚙️ Model
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-4 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 ${
                        errors.model ? 'border-red-400 ring-2 ring-red-400' : 'border-white/30 hover:border-white/50'
                      }`}
                      placeholder="EX-L"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  {errors.model && (
                    <p className="text-red-400 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.model}
                    </p>
                  )}
                </div>

                {/* Year */}
                <div className="space-y-3">
                  <label htmlFor="year" className="block text-lg font-semibold text-white">
                    📅 Year
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="year"
                      name="year"
                      value={formData.year}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-4 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all duration-300 ${
                        errors.year ? 'border-red-400 ring-2 ring-red-400' : 'border-white/30 hover:border-white/50'
                      }`}
                      placeholder="2020"
                      maxLength="4"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  {errors.year && (
                    <p className="text-red-400 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.year}
                    </p>
                  )}
                </div>

                {/* State/Location */}
                <div className="space-y-3">
                  <label htmlFor="state" className="block text-lg font-semibold text-white">
                    📍 Location
                  </label>
                  <div className="relative">
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-4 bg-white/10 backdrop-blur-sm border border-white/30 hover:border-white/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
                    >
                      <option value="" className="bg-gray-800 text-white">Select Location</option>
                      <optgroup label="Tier 1 Cities" className="bg-gray-800 text-white">
                        <option value="delhi" className="bg-gray-800 text-white">Delhi</option>
                        <option value="mumbai" className="bg-gray-800 text-white">Mumbai</option>
                        <option value="bangalore" className="bg-gray-800 text-white">Bangalore</option>
                        <option value="hyderabad" className="bg-gray-800 text-white">Hyderabad</option>
                        <option value="pune" className="bg-gray-800 text-white">Pune</option>
                        <option value="chennai" className="bg-gray-800 text-white">Chennai</option>
                        <option value="kolkata" className="bg-gray-800 text-white">Kolkata</option>
                        <option value="ahmedabad" className="bg-gray-800 text-white">Ahmedabad</option>
                      </optgroup>
                      <optgroup label="Tier 2 Cities" className="bg-gray-800 text-white">
                        <option value="jaipur" className="bg-gray-800 text-white">Jaipur</option>
                        <option value="lucknow" className="bg-gray-800 text-white">Lucknow</option>
                        <option value="kanpur" className="bg-gray-800 text-white">Kanpur</option>
                        <option value="nagpur" className="bg-gray-800 text-white">Nagpur</option>
                        <option value="indore" className="bg-gray-800 text-white">Indore</option>
                        <option value="bhopal" className="bg-gray-800 text-white">Bhopal</option>
                        <option value="patna" className="bg-gray-800 text-white">Patna</option>
                      </optgroup>
                      <optgroup label="Other Cities" className="bg-gray-800 text-white">
                        <option value="surat" className="bg-gray-800 text-white">Surat</option>
                        <option value="agra" className="bg-gray-800 text-white">Agra</option>
                        <option value="nashik" className="bg-gray-800 text-white">Nashik</option>
                        <option value="rajkot" className="bg-gray-800 text-white">Rajkot</option>
                        <option value="varanasi" className="bg-gray-800 text-white">Varanasi</option>
                        <option value="default" className="bg-gray-800 text-white">Other</option>
                      </optgroup>
                    </select>
                    <div className="absolute inset-y-0 right-8 flex items-center pr-3 pointer-events-none">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs">Affects local pricing estimates</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full relative overflow-hidden rounded-2xl py-5 px-8 text-lg font-bold text-white transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-cyan-400/50 ${
                    isLoading
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400 shadow-2xl hover:shadow-cyan-500/25'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    {isLoading ? (
                      <>
                        <div className="flex items-center space-x-3">
                          <svg
                            className="animate-spin h-6 w-6 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <span>🔍 Analyzing Vehicle Damage...</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <span>🚀 Analyze Damage</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Animated background effect */}
                  {!isLoading && (
                    <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
                  )}
                </button>
              </div>
            </form>
          </div>
          
          {/* Footer */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></div>
                <span>🔒 Secure Analysis</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full animate-pulse"></div>
                <span>⚡ Lightning Fast</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse"></div>
                <span>🤖 AI Powered</span>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-4">
              © 2024 AutoFix AI. Advanced Computer Vision Technology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadForm;