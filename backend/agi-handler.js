const db = require('./services/db');
const { executeFlow } = require('./services/ivr-executor.js');

/**
 * Handles an AGI request using the 'asteriskagi' library.
 * This async function receives a context object for the call.
 * @param {object} context The 'asteriskagi' context object.
 */
async function agiHandler(context) {
  try {
    const vars = context.variables;
    await context.answer();
    await context.verbose('AGI Script Started.');

    const dnid = vars.agi_network_script || vars.agi_dnid || 'default';
    await context.verbose(`Call received for DNID: ${dnid}`);

    const ivrFlow = await db.getIvrFlowByDnid(dnid);

    if (ivrFlow) {
      await executeFlow(context, ivrFlow);
    } else {
      await context.verbose('No IVR flow configured for this number.');
      await context.exec('TextToSpeech', '"We are sorry, this service is currently unavailable."');
    }

  } catch (err) {
    console.error('An unhandled error occurred in agiHandler:', err);
    try {
        await context.verbose('An unexpected error occurred.');
    } catch (e) {
        console.error('Could not even send verbose error message to Asterisk', e);
    }
  } finally {
    // Ensure hangup is always called, even if the flow fails
    await context.verbose('AGI Script Finished.');
    await context.hangup();
  }
}

module.exports = agiHandler;