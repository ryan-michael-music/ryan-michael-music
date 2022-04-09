function handler(event) {
    console.log(event['request']);
    if (event['request']['uri'] === '/'
        // don't redirect if we're sending a querystring
        && Object.keys(event['request']['querystring']).length === 0) {
        var response = {
            statusCode: 302,
            statusDescription: 'Found',
            headers: {
                'location': { value: 'https://ryanmichaelmusic.live/index.html' }
            }
        };
        return response;
    }
    else {
        return event['request'];
    }
}