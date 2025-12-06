const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class EnhancedChatbot {
    constructor() {
        this.chatbotPath = path.join(__dirname, '../ml_model/enhanced_chatbot.py');
        this.isAvailable = this.checkAvailability();
    }

    checkAvailability() {
        try {
            return fs.existsSync(this.chatbotPath);
        } catch (error) {
            console.warn('Enhanced chatbot not available:', error.message);
            return false;
        }
    }

    async processQuery(userQuestion, contextData) {
        return new Promise((resolve, reject) => {
            if (!this.isAvailable) {
                reject(new Error('Enhanced chatbot not available'));
                return;
            }

            try {
                const contextJson = JSON.stringify(contextData);
                const pythonProcess = spawn('python', [
                    this.chatbotPath,
                    userQuestion,
                    contextJson
                ], {
                    cwd: path.dirname(this.chatbotPath)
                });

                let stdout = '';
                let stderr = '';

                pythonProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                pythonProcess.on('close', (code) => {
                    if (code === 0) {
                        try {
                            const result = JSON.parse(stdout.trim());
                            if (result.success) {
                                resolve({
                                    answer: result.response,
                                    model: result.model || 'gemini-enhanced',
                                    sources: ['Enhanced AutoFix AI Analysis'],
                                    enhanced: true
                                });
                            } else {
                                reject(new Error(result.error || 'Unknown error from enhanced chatbot'));
                            }
                        } catch (parseError) {
                            // If JSON parsing fails, treat stdout as direct response
                            if (stdout.trim()) {
                                resolve({
                                    answer: stdout.trim(),
                                    model: 'gemini-enhanced-fallback',
                                    sources: ['Enhanced AutoFix AI Analysis'],
                                    enhanced: true
                                });
                            } else {
                                reject(new Error(`Enhanced chatbot parse error: ${parseError.message}`));
                            }
                        }
                    } else {
                        reject(new Error(`Enhanced chatbot failed with code ${code}: ${stderr}`));
                    }
                });

                pythonProcess.on('error', (error) => {
                    reject(new Error(`Failed to start enhanced chatbot: ${error.message}`));
                });

                // Set timeout to prevent hanging
                setTimeout(() => {
                    pythonProcess.kill('SIGTERM');
                    reject(new Error('Enhanced chatbot timeout'));
                }, 30000); // 30 second timeout

            } catch (error) {
                reject(new Error(`Enhanced chatbot error: ${error.message}`));
            }
        });
    }

    // Fallback method for simple queries without context
    async processSimpleQuery(userQuestion) {
        const defaultContext = {
            car_model: "General Vehicle",
            state: "India",
            damaged_parts: [],
            total_cost: 0,
            message: "This is a general automotive inquiry without specific damage report context."
        };

        return this.processQuery(userQuestion, defaultContext);
    }

    // Method to format context from AutoFix AI report structure
    formatAutoFixContext(report) {
        try {
            return {
                carInfo: report.carInfo || {},
                detectedParts: report.detectedParts || [],
                repairAnalysis: report.repairAnalysis || [],
                nearestServiceCenters: report.nearestServiceCenters || [],
                totalCost: report.totalCost || 0,
                totalOEMCost: report.totalOEMCost || 0,
                totalAftermarketCost: report.totalAftermarketCost || 0,
                state: report.state || 'Unknown',
                costBreakdown: report.costBreakdown || [],
                estimatedRepairTime: report.estimatedRepairTime || {}
            };
        } catch (error) {
            console.warn('Error formatting AutoFix context:', error.message);
            return report; // Return as-is if formatting fails
        }
    }
}

module.exports = EnhancedChatbot;