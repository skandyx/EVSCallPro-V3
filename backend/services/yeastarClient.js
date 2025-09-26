// A mock Yeastar API client for the legacy PBX_CONNECTION_MODE.
// This is not the primary mode of operation but is kept for compatibility.

// In a real implementation, this would use a library like 'axios' to make HTTP requests
// to the Yeastar PBX API.

const getClient = async (pbxConfig) => {
    console.log(`[YeastarClient] Creating mock client for PBX at ${pbxConfig.yeastarIp}`);

    // This mock client simulates the API calls needed by the application.
    return {
        /**
         * Simulates originating a call via the Yeastar API.
         * @param {string} agentExtension - The agent's extension to call first.
         * @param {string} destination - The final number to call.
         * @param {string} callerId - The caller ID to present.
         * @returns {Promise<object>} A mock response.
         */
        originate: (agentExtension, destination, callerId) => {
            console.log(`[YeastarClient] MOCK API CALL: Originate from ${agentExtension} to ${destination} with CallerID ${callerId}`);
            
            // In a real scenario, you would make an HTTP POST request here.
            // e.g., to https://<yeastar_ip>/api/v1.1.0/call/originate

            // We simulate a successful response from the API.
            return Promise.resolve({
                status: 'success',
                call_id: `yeastar-call-${Date.now()}`,
                message: 'Originate successfully.',
            });
        },

        // Other potential methods could be added here, like getExtensions, getTrunks, etc.
    };
};

module.exports = {
    getClient,
};
