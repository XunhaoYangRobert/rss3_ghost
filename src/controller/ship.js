const Base = require('./base.js');
const RSS3 = require('rss3').default;


module.exports = class extends Base {
    async indexAction() {
        let pk = this.query("pk");
        let type = this.query("type");
        let blog = this.post("post");
        let _rss3;
        try {
            _rss3 = new RSS3({
                endpoint: 'https://hub.rss3.io',
                privateKey: pk,
            });
        } catch (err) {
            return this.fail(err);
        }
        let postRSS3 = await _rss3.item.post({
            title: blog.current.title,
            tags: [
                'ghost'
            ],
            summary: blog.current.plaintext.substring(0, 280),
            contents: [{
                address: [blog.current.url],
                mime_type: "text/html"
            }]
        });
        if (!postRSS3) {
            this.fail('Gen RSS3 Failed')
        }
        let res = await _rss3.persona.sync();
        if (res) {
            this.success(res);
        }
    }
};
