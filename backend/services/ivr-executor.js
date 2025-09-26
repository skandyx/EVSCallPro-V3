/**
 * Executes an IVR flow using the provided AGI context from 'asteriskagi'.
 * @param {object} context The 'asteriskagi' context object.
 * @param {object} flow The IVR flow object from the database.
 */
async function executeFlow(context, flow) {
    let currentNode = flow.nodes.find(n => n.type === 'start');
    if (!currentNode) {
        await context.verbose('IVR Flow has no start node. Hanging up.');
        return;
    }

    await context.verbose(`Starting IVR Flow: ${flow.name}`);

    while (currentNode) {
        await context.verbose(`Executing node: ${currentNode.name} (Type: ${currentNode.type}, ID: ${currentNode.id})`);
        let nextNodeId = null;

        try {
            switch (currentNode.type) {
                case 'start':
                    const startConnection = flow.connections.find(c => c.fromNodeId === currentNode.id);
                    nextNodeId = startConnection ? startConnection.toNodeId : null;
                    break;
                
                case 'media':
                    // In a real app, 'prompt' would be a filename. We'll use verbose for simulation.
                    await context.verbose(`Streaming media: ${currentNode.content.prompt}`);
                    // await context.streamFile(currentNode.content.prompt); // Uncomment when audio files exist
                    // Use TextToSpeech for now, ensuring the prompt is quoted for Asterisk.
                    await context.exec('TextToSpeech', `"${currentNode.content.prompt.replace(/"/g, '\\"')}"`);
                    const mediaConnection = flow.connections.find(c => c.fromNodeId === currentNode.id && c.fromPortId === 'out');
                    nextNodeId = mediaConnection ? mediaConnection.toNodeId : null;
                    break;

                case 'menu':
                    await context.verbose(`Menu prompt: ${currentNode.content.prompt}`);
                    // AGI's getData is better for menus than sayText + waitForDigit
                    const digit = await context.getData(currentNode.content.prompt, 5000, 1); // 5s timeout, 1 digit
                    let menuConnection;
                    if (digit) {
                         menuConnection = flow.connections.find(c => {
                             const fromNode = flow.nodes.find(n => n.id === c.fromNodeId);
                             if (fromNode && fromNode.type === 'menu') {
                                 const option = fromNode.content.options.find(opt => opt.portId === c.fromPortId);
                                 return option && option.key === digit;
                             }
                             return false;
                         });
                    } else {
                        // Timeout
                        menuConnection = flow.connections.find(c => c.fromNodeId === currentNode.id && c.fromPortId === 'out-timeout');
                    }
                    nextNodeId = menuConnection ? menuConnection.toNodeId : null;
                    if (!nextNodeId) {
                        await context.verbose(`No route for digit '${digit || 'timeout'}'.`);
                    }
                    break;

                case 'transfer':
                    await context.verbose(`Transferring call to: ${currentNode.content.number}`);
                    // Using Dial is more robust for transfers
                    await context.exec('Dial', `SIP/${currentNode.content.number}`);
                    const dialStatus = await context.getVariable('DIALSTATUS');
                    await context.verbose(`Dial status: ${dialStatus}`);
                    // If the call fails, we can route to the 'failure' port
                    if (dialStatus !== 'ANSWER') {
                        const failureConnection = flow.connections.find(c => c.fromNodeId === currentNode.id && c.fromPortId === 'out');
                        nextNodeId = failureConnection ? failureConnection.toNodeId : null;
                    } else {
                        // If answered, the call is bridged, and our script ends here.
                        nextNodeId = null; 
                    }
                    break;
                
                case 'calendar':
                    // This is a simplified simulation. A real implementation would be more complex.
                    await context.verbose(`Checking calendar rules...`);
                    const now = new Date();
                    // For now, let's just assume it's "open" and take the first event path.
                    // In a real scenario, you'd iterate through events, check days, times, dates.
                    const defaultConnection = flow.connections.find(c => c.fromNodeId === currentNode.id && c.fromPortId === 'out-default');
                    nextNodeId = defaultConnection ? defaultConnection.toNodeId : null;
                    await context.verbose(`Calendar result: Following default path.`);
                    break;

                case 'voicemail':
                    await context.verbose(`Sending to voicemail: ${currentNode.content.prompt}`);
                    await context.exec('TextToSpeech', `"${currentNode.content.prompt.replace(/"/g, '\\"')}"`);
                    // await context.exec('VoiceMail', '1234@default'); // Example voicemail box
                    nextNodeId = null; // Voicemail is usually a terminal action
                    break;

                case 'hangup':
                    await context.verbose('Hanging up call.');
                    nextNodeId = null; // This will terminate the loop
                    break;

                default:
                    await context.verbose(`Unknown node type: ${currentNode.type}`);
                    nextNodeId = null;
                    break;
            }
        } catch (error) {
            console.error(`Error executing node ${currentNode.id}:`, error);
            await context.verbose(`An error occurred. Ending call.`);
            nextNodeId = null;
        }

        if (nextNodeId) {
            currentNode = flow.nodes.find(n => n.id === nextNodeId);
            if (!currentNode) {
                 await context.verbose(`Next node ID '${nextNodeId}' not found in flow.`);
            }
        } else {
            currentNode = null;
        }
    }

    await context.verbose('IVR Flow finished.');
}

module.exports = { executeFlow };