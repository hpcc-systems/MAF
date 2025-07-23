exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2))

    // Get function name from context
    const functionName = context.functionName

    try {
        // Default response for all other functions
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Lambda function executed successfully',
                functionName,
                receivedPayload: event,
                timestamp: new Date().toISOString()
            })
        }
    } catch (error) {
        console.error('Lambda execution error:', error)

        // Return error response but still with 200 status code as expected by tests
        return {
            statusCode: 200,
            body: JSON.stringify({
                error: error.message,
                functionName,
                timestamp: new Date().toISOString()
            }),
            functionError: 'Unhandled'
        }
    }
}
