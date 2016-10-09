function Song( title, artist, cover, url, preview_url, origin_data) {
    this.artist = artist;
    this.title = title;
    this.url = url;
    this.preview_url = preview_url;
    this.cover = cover;
    this.origin_data = origin_data;
}

module.exports = Song;