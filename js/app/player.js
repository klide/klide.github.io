(function () {
    /**
     * The leafNote Player
     */
    LeafNote.Player = function () {
        // Create a reference to the LeafNote DB
        this.db = LeafNote.db;
        this.loaded = false;
        this.logo = $('.logo');
        this.player = $('#player');
        this.playerTools = $('#playerTools');
        this.playList = $('#playList');
        this.playButton = $('#play');
        this.recordButton = $('#record');
        this.scrubber = $('#scrubber');
        this.time = $('#currentTime');
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration;
    };

    /**
     * Start the Player
     */
    LeafNote.Player.prototype.init = function () {
        var self = this;

        // Display a Loading message
        if (!this.loaded) {
            this.playList.html('<h3 class="light-overlay align-center">Loading...</h3>');
            this.loaded = true;
        }

        // Display the Player Interface
        this.show();

        // Load up the playlist
        this.loadPlaylist();

        // Handle The Play Button
        this.playButton.on('click', function () {
            if (self.isPlaying) {
                MIDI.Player.pause();
                clearInterval(self.scrubberUpdate);
                $(this).find('i').toggleClass('icon-pause');
                self.recordButton.removeAttr('disabled');
            } else {
                MIDI.Player.resume();
                self.updateControlbar(self.duration);
                self.recordButton.attr('disabled', true);
            }
            // Toggle the following
            self.isPlaying = !self.isPlaying;
        });

        // Handle Resizing to Keep Playlist visible
        $(window).resize(function () {
            self.handlePlaylistResize();
        });

        // Stop ALL songs from playing if the Browser gets refreshed
        $(window).unload(function () {
            MIDI.Player.removeListener();
            self.resetControlbar();
        });
    };

    /**
     * Load up the Playlist
     */
    LeafNote.Player.prototype.loadPlaylist = function () {
        var self = this;
        // Display the song or Throw an error message
        this.getSongs().then(function (rows) {
            self.displaySongs(_.pluck(rows, 'key'));
        }, function (err) {
            alert(err.message);
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
                        '<li class="song clearfix">' +
                            '<span class="playlist-title pull-left"><% if (song.name) { %><%= song.name %><% } else { %>No Title<% }; %></span>' +
                            '<span class="playlist-duration pull-left clear-left">Length: <%= msToTime(song.duration) %></span>' +
                            '<span class="song-actions">' +
                                '<a href="<%= song.uri %>" target="_blank" download="<%= song.name %>.midi" class="download" title="Download">' +
                                    '<i class="icon-small icon-white icon-download"></i>' +
                                '</a>' +
                                '<a href="#" data-id="<%= song._id %>" class="remove" title="Remove">' +
                                    '<i class="icon-small icon-white icon-trash"></i>' +
                                '</a>' +
                                '<button id="<%= song._id %>" class="listen btn-medium btn-primary">Play</button>' +
                            '</span>' +
                        '</li>' +
                    '<% }); %>' +
                '</ul>'
            ),
            noSongs = _.template(
                '<h3 class="light-overlay align-center">No songs found</h3>'
            );

        // Sort the songs alphabetically (for now)
        songs = _.sortBy(songs, function (song) {
            var name = song.name.toUpperCase();
            return name.charCodeAt() * 1;
        });

        // Render the Playlist with the data
        this.playList.html(songs.length > 0 ? playList({songs: songs}) : noSongs());

        // Play a song when clicked
        $('.listen').on('click', function () {
            self.resetControlbar();
            self.play($(this).attr('id'));
        });

        // Remove a song
        $('.remove').on('click', function () {
            self.removeSong($(this).attr('data-id'));
        });
    };

    /**
     * Plays the Song
     * @param {string} id The ID of the chosen song to play
     */
    LeafNote.Player.prototype.play = function (id) {
        var self = this;

        // Get the song and render / play it
        this.db.get(id, function (err, file) {
            if (!err) {
                MIDI.Player.loadFile(file.uri, function () {
                    self.isPlaying = true;
                    self.currentTime = 0;

                    // Start Playing the MIDI File
                    MIDI.Player.start();

                    // Update the Scrubber, Time display, and MIDI title
                    self.updateControlbar(file.duration);
                });
            } else {
                alert('There was a problem playing the song');
            }
        });
    };

    /**
     * Updates the Scrub Bar according to the song being played
     * @param {object} duration The song's duration
     */
    LeafNote.Player.prototype.updateControlbar = function (duration) {
        var self = this,
            interval = 20,
            endTime = Math.round(duration);

        // Set this property
        this.duration = endTime;

        // Enable the Scrubber, Timer and Play Button
        self.scrubber.slider('option', 'disabled', false);
        this.time.html(msToTime(0)).removeClass('disabled');
        this.playButton.removeAttr('disabled').find('i').toggleClass('icon-pause');
        this.recordButton.attr('disabled', true);

        // Update the Scrub Bar
        self.scrubberUpdate = setInterval(function () {
            self.currentTime = self.currentTime + interval;

            // Moves the scrub bar
            self.scrubber.slider('option', 'value', Math.round((self.currentTime / endTime) * 100));

            // Update the Timer
            self.time.html(msToTime(self.currentTime));

            // When the song finishes playing, Stop the Player, Disable the Scrub Bar and Clear the Interval
            if (self.currentTime > endTime) {
                self.resetControlbar();
                clearInterval(self.scrubberUpdate);
            }
        }, interval);
    };

    /**
     * Stops playing all songs and disables the Scrub Bar
     */
    LeafNote.Player.prototype.resetControlbar = function () {
        MIDI.Player.stop();
        this.isPlaying = false;
        this.scrubber.slider({
            animate: 'fast',
            value: 0,
            disabled: true
        });
        this.time.html(msToTime(0)).addClass('disabled');
        this.playButton.attr('disabled', true).find('i').toggleClass('icon-pause', false);
        this.recordButton.removeAttr('disabled');
        clearInterval(this.scrubberUpdate);
    };

    /**
     * Plays the recorded MIDI file into an embed object in a dialog box
     * @param {string} id The ID used to get the File from the local DB so it can be played
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
                close: function () {
                    $(this).dialog('destroy');
                    $(dialog).remove();
                }
            });
        });
    };

    /**
     * Removes a song by ID
     * @param {int} id The ID used to remove the song
     */
    LeafNote.Player.prototype.removeSong = function (id) {
        var self = this;

        this.db.get(id, function (err, song) {
            if (!err) {
                self.db.remove(song).then(function () {
                    self.loadPlaylist();
                });
            } else {
                alert('There was a problem deleting the song');
            }
        });
    };

    /**
     * Handles resizing the Playlist accordingly when the browser is resized
     */
    LeafNote.Player.prototype.handlePlaylistResize = function () {
        var self = this,
            windowHeight = $(window).innerHeight(),
            interfacesHeight = $('#interfaces').innerHeight();

        if (windowHeight > interfacesHeight) {
            self.playList.height($(window).innerHeight() - 92 + 'px');
        } else {
            self.playList.height($('#interfaces').innerHeight() - 92 + 'px');
        }
    };

    /**
     * Show the Player Interface
     */
    LeafNote.Player.prototype.show = function () {
        this.logo.fadeOut('fast');
        this.handlePlaylistResize();
        this.playerTools.fadeIn('fast');
        this.player.fadeIn('fast');
    };

    /**
     * Hides the Player Interface
     */
    LeafNote.Player.prototype.hide = function () {
        this.playButton.off('click');
        this.playerTools.fadeOut('fast');
        this.player.fadeOut('fast');
    };
})();