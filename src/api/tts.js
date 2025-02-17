const gTTS = require('gtts');

module.exports = async (req, res) => {
    const text = req.query.text;
    if (!text || typeof text !== 'string') {
        return res.status(400)
            .json({
                error: "Provide some text",
                example: "/tts?text=Wow%20so%20cool"
            });
    }
    if (text.length > 512) {
        return res.status(400)
            .json({
                error: "Text is too long"
            });
    }
    let lang = req.query.lang;
    if (!lang || typeof lang !== 'string') {
        lang = 'en';
    }

    let gtts;
    try {
        gtts = new gTTS(text, lang);
    } catch (err) {
        return res.status(400)
            .json({
                error: String(err)
            });
    }

    res.status(200);
    res.setHeader('Content-Type', 'audio/mp3');
    gtts.stream().pipe(res);
};