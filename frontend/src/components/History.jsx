import React, { useState, useEffect } from 'react';
import { getReportHistory, downloadReport, deleteReport } from '../services/api';

const History = ({ isVisible, onClose }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isVisible) {
      fetchHistory();
    }
  }, [isVisible]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReportHistory();
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId, fileName) => {
    try {
      setError(null);
      // Show downloading feedback
      const report = reports.find(r => r.reportId === reportId);
      if (report) {
        // Temporarily update UI to show downloading status
        setReports(prev => prev.map(r => 
          r.reportId === reportId 
            ? { ...r, isDownloading: true }
            : r
        ));
      }
      
      await downloadReport(reportId);
      
      // Show success message briefly
      setError(`✅ Downloaded: ${fileName || 'Report'}`);
      setTimeout(() => setError(null), 3000);
      
      // Refresh history to update download count
      fetchHistory();
    } catch (err) {
      setError(`❌ Download failed: ${err.message}`);
      // Remove downloading state on error
      setReports(prev => prev.map(r => 
        r.reportId === reportId 
          ? { ...r, isDownloading: false }
          : r
      ));
    }
  };

  const handleDelete = async (reportId, carInfo) => {
    const carName = `${carInfo.year} ${carInfo.name} ${carInfo.model}`;
    if (!window.confirm(`Are you sure you want to delete the report for ${carName}?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    try {
      setError(null);
      // Show deleting feedback
      setReports(prev => prev.map(r => 
        r.reportId === reportId 
          ? { ...r, isDeleting: true }
          : r
      ));
      
      await deleteReport(reportId);
      
      // Remove from local state
      setReports(prev => prev.filter(report => report.reportId !== reportId));
      
      // Show success message
      setError(`✅ Deleted report for ${carName}`);
      setTimeout(() => setError(null), 3000);
      
    } catch (err) {
      setError(`❌ Delete failed: ${err.message}`);
      // Remove deleting state on error
      setReports(prev => prev.map(r => 
        r.reportId === reportId 
          ? { ...r, isDeleting: false }
          : r
      ));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Report History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Loading history...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!loading && !error && reports.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No reports found in history.</p>
            </div>
          )}

          {!loading && !error && reports.length > 0 && (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.reportId} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800">
                        {report.carInfo.year} {report.carInfo.name} {report.carInfo.model}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Generated: {formatDate(report.createdAt)}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Detected Parts:</p>
                          <p className="text-sm text-gray-600">
                            {report.detectedParts.map(part => part.name).join(', ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Total Cost:</p>
                          <p className="text-sm text-gray-600">₹{report.totalCost}</p>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Downloads: {report.downloadCount}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleDownload(report.reportId, report.fileName)}
                        disabled={report.isDownloading || report.isDeleting}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          report.isDownloading 
                            ? 'bg-blue-300 cursor-not-allowed' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        } text-white`}
                      >
                        {report.isDownloading ? '⏳ Downloading...' : '📥 Download'}
                      </button>
                      <button
                        onClick={() => handleDelete(report.reportId, report.carInfo)}
                        disabled={report.isDownloading || report.isDeleting}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          report.isDeleting 
                            ? 'bg-red-300 cursor-not-allowed' 
                            : 'bg-red-500 hover:bg-red-600'
                        } text-white`}
                      >
                        {report.isDeleting ? '🗑️ Deleting...' : '🗑️ Delete'}
                      </button>
                    </div>
                  </div>
                  
                  {report.costBreakdown && report.costBreakdown.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Cost Breakdown:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {report.costBreakdown.map((item, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            {item.part}: ₹{item.cost}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={fetchHistory}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-2"
          >
            Refresh
          </button>
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default History;