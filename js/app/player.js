(function () {
    /**
     * The leafNote Player
     */
    LeafNote.Player = function () {
        // Create a reference to the LeafNote DB
        this.db = LeafNote.db;
        this.loaded = false;
        this.player = $('#player');
        this.playerTools = $('#playerTools');
        this.playList = $('#playList');
    };

    /**
     * Start the Player
     */
    LeafNote.Player.prototype.init = function () {
        var self = this;

        // Display a Loading message
        if (!this.loaded) {
            this.playList.html('<h2>Loading...</h2>');
            this.loaded = true;
        }

        // Display the Player Interface
        this.show();

        // Get the list of recorded songs and
        // Display the song or Throw an error message
        this.getSongs().then(function (rows) {
            self.displaySongs(_.pluck(rows, 'key'));
        }, function (err) {
            alert(err.message);
        });

        // Handle Resizing to Keep Playlist visible
        $(window).resize(function () {
            self.handlePlaylistResize();
        });
    };

    /**
     * Get All the Songs
     * @return {object} Promise
     */
    LeafNote.Player.prototype.getSongs = function () {
        var def = $.Deferred(),
            getSongs = function (doc) {
                if (doc.type == 'song') {
                    emit(doc);
                }
            }
        this.db.query({map: getSongs}, {reduce: false, descending: false}, function (err, res) {
            if (err) {
                err.message = 'Unable to retrieve songs';
                def.reject(err);
            } else {
                def.resolve(res.rows);
            }
        });
        return def.promise();
    };

    /**
     * Display the Songs
     * @param {object} songs The list of songs to display
     */
    LeafNote.Player.prototype.displaySongs = function (songs) {
        var self = this,
            playList = _.template(
                '<ul>' +
                    '<% _.each(songs, function (song) { %>' +
                        '<li class="song" id="<%= song._id %>">' +
                            '<i class="icon-arrow-right"></i> <%= song.name %>' +
                        '</li>' +
                    '<% }); %>' +
                '</ul>'
            ),
            noSongs = _.template(
                '<h3 class="light-overlay align-center">No songs found</h3>'
            );

        this.playList.html(songs.length > 0 ? playList({songs: songs}) : noSongs());

        // Play a song when clicked
        $('.song').on('click', function () {
            self.playSong($(this).attr('id'));
        });
    };

    /**
     * Plays the recorded MIDI file into an embed object in a dialog box
     * @param {string} fileName The Name of the MIDI File to Output
     */
    LeafNote.Player.prototype.playSong = function (id) {
        // Get the song and render / play it
        this.db.get(id, function (err, res) {
            var midiURL = res.uri,
                dialogContent = _.template(
                    '<h4>' +
                        '<embed class="midi-embed" src=' + midiURL + ' autostart=false>' +
                        '<a class="midi-download" target="_blank" href=' + midiURL + '>Download File</a>' +
                    '</h4>'
                ),
                dialog = $('<div/>', {
                    html: dialogContent({midiURL: midiURL})
                });

            $(dialog).dialog({
                title: 'Playing MIDI file: ' + res.name,
                modal: true,
                buttons: [{
                    text: 'OK',
                    click: function () {
                        $(this).dialog('destroy');
                    }
                }],
                open: function () {
                    // Clear the song
                    this.song = '';
                },
                close: function () {
                    $(this).dialog('destroy');
                    $(dialog).remove();
                }
            });
        });
    };

    LeafNote.Player.prototype.handlePlaylistResize = function () {
        var self = this,
            windowHeight = $(window).innerHeight(),
            interfacesHeight = $('#interfaces').innerHeight();

        if (windowHeight > interfacesHeight) {
            self.playList.height($(window).innerHeight() - 151 + 'px');
        } else {
            self.playList.height($('#interfaces').innerHeight() - 151 + 'px');
        }
    };

    LeafNote.Player.prototype.show = function () {
        this.handlePlaylistResize();
        this.playerTools.fadeIn('fast');
        this.player.fadeIn('fast');
    };

    LeafNote.Player.prototype.hide = function () {
        this.playerTools.fadeOut('fast');
        this.player.fadeOut('fast');
    };
})();