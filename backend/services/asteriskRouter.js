const ami = require('./amiClient');

/**
 * Originates a call from an agent's softphone to an external number.
 * @param {string} agentExtension The agent's SIP extension.
 * @param {string} destination The external number to call.
 * @param {string} siteId The ID of the site, used to select the correct trunk.
 * @returns {Promise<object>} The AMI response object.
 */
const originateCall = (agentExtension, destination, siteId) => {
    return new Promise((resolve, reject) => {
        const action = {
            Action: 'Originate',
            Channel: `PJSIP/${agentExtension}`, // Call the agent's softphone
            Context: 'agent-out', // The context in Asterisk dialplan for outbound calls
            Exten: destination, // The number to call after the agent answers
            Priority: 1,
            CallerID: `CRM <${agentExtension}>`,
            Async: 'true',
            // Set variables to pass context to the dialplan
            Variable: {
                // This will be read by the DB() function in the dialplan
                // An action to set this value (e.g., on agent login) would be needed
            }
        };

        ami.action(action, (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
};

/**
 * Originates a "connect to phone" call.
 * First calls the agent's mobile, then connects them to the destination.
 * @param {string} agentMobile The agent's mobile number.
 * @param {string} destination The final external number to call.
 * @param {string} siteId The ID of the site for trunk selection.
 * @param {string} callerId The CallerID to present to the final destination.
 * @param {object} variables Additional variables to set on the channel.
 * @returns {Promise<object>} The AMI response object.
 */
const originateConnectToPhone = (agentMobile, destination, siteId, callerId, variables = {}) => {
     return new Promise((resolve, reject) => {
        const action = {
            Action: 'Originate',
            // Use a Local channel to first call the agent's mobile via the site's trunk
            Channel: `Local/${agentMobile}@mobile-out`,
            // When the agent answers, the call continues in the 'connect-to-phone' context
            Context: 'connect-to-phone',
            Exten: destination, // Pass the final destination as the extension
            Priority: 1,
            CallerID: callerId,
            Async: 'true',
            Variable: {
                // Pass all necessary variables for the second leg of the call
                SITE_ID_VAR: siteId,
                FINAL_DESTINATION: destination,
                FINAL_CALLERID: callerId,
                ...variables,
            }
        };

        ami.action(action, (err, res) => {
            if (err) return reject(err);
            resolve(res);
        });
    });
};


module.exports = {
    originateCall,
    originateConnectToPhone,
};
