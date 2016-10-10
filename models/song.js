function Song( title, artist, cover, url, preview_url) {
    this.artist = artist;
    this.title = title;
    this.url = url;
    this.preview_url = preview_url;
    this.cover = cover;
}

module.exports = Song;