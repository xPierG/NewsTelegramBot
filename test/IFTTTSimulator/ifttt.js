var requestify = require('requestify');

requestify.post('http://localhost:1234/sendMessage', {
    type: 'official',
    text: 'official: prova di testo ufficiale'
})
.then(function(response) {
    // Get the response body (JSON parsed or jQuery object for XMLs)
    response.getBody();
});