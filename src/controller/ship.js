const Base = require('./base.js');
const RSS3 = require('rss3').default;
const fs = require('fs');
const createHTML = require('create-html');
const axios = require('axios');
const FormData = require('form-data');

module.exports = class extends Base {
    async indexAction() {
        let pk = this.query("pk");
        let blog = this.post("post");
        let filename = think.uuid('v4');
        let _rss3;
        try {
            _rss3 = new RSS3({
                endpoint: 'https://hub.rss3.io',
                privateKey: pk,
            });
        } catch (err) {
            return this.fail(err);
        }
        var html = createHTML({
            title: blog.current.title,
            body: blog.current.html
        })
        fs.writeFile('temp/' + filename + '.html', html, function (err) {
            if (err) console.log(err)
        });
        var data = new FormData();
        let htmlfile = fs.createReadStream('temp/' + filename + '.html')
        data.append('file', htmlfile)
        let postIpfs = await axios.post("https://ipfs.infura.io:5001/api/v0/add", data, {
            headers: data.getHeaders(),
            auth: {
                username: "1uvdaOinj827yXYp9fIGqaXV759",
                password: "51d876449baaeffb8fcc0d36e1b225e8"
            },
        });
        let postRSS3 = await _rss3.item.post({
            title: blog.current.title,
            tags: [
                'ghost'
            ],
            summary: blog.current.plaintext.substring(0, 280),
            contents: [{
                address: ['https://ipfs.infura.io/ipfs/' + postIpfs.data.Hash],
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
