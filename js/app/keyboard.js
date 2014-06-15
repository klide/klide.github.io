(function () {
    /**
     * The LeafNote Keyboard
     */
    LeafNote.Keyboard = function () {
        this.song;
        this.track1;
        this.track2;
        this.track3;

        // Some Basic Default Settings
        this.volume = 200;
        this.pitch = 0;
        this.currentInstrument = {
            name: 'acoustic_grand_piano',
            id: 0
        };
        this.noteDuration = 700;
        this.recordTimer;
        this.startTime = 100;
        this.clockSpeed = 108;
        this.clockToTimeConversion = 525 / this.clockSpeed;
        this.recording = false;

        // Create a reference to the LeafNote DB
        this.db = LeafNote.db;

        // Some key elements
        this.logo = $('.logo');
        this.keyPads = $('.key');
        this.keyboard = $('#keyboard');
        this.keyboardTools = $('#keyboardTools');
        this.optionButton = $('#options');

        // Create an instance of Instruments
        this.instruments = new LeafNote.Instruments();

        // Create an instance of Player
        this.player = new LeafNote.Player();
        this.player.resetControlbar();
    };

    /**
     * Initializes the Keyboard
     */
    LeafNote.Keyboard.prototype.init = function () {
        var self = this;

        // Some Elements the User will Interact with
        var $loader = $('#loader'),
            $keyPads = this.keyPads,
            $instrumentSelector = $('#instrumentSelector'),
            $viewPlaylist = $('#viewPlaylist'),
            $options = this.optionButton,
            $record = $('#record'),
            $backToApp = $('#backToApp'),
            $toolbar = $('.toolbar-content');

        // Apply the current theme
        LeafNote.applyTheme();

        // Create the Sliders
        this.renderSliders();

        // Fade out the Loader and Remove it
        $loader.fadeOut('fast', function () {
            $loader.remove();
        });

        // Display the Keyboard Interface and the Toolbars
        this.show();
        $toolbar.fadeIn('fast');

        // For any of the keyPads Play a note when mouse is down
        $keyPads.on('mousedown', function () {
            self.playNote(parseInt($(this).attr('data-note'), 10) + self.pitch, $(this));
        });

        // Stops playing a note when mouse is up
        $keyPads.on('mouseup', function () {
            self.stopNote(parseInt($(this).attr('data-note'), 10) + self.pitch, $(this));
        });

        // Dims out all the keyPads when the mouse is up at anytime
        $(document).on('mouseup', function () {
            $keyPads.removeClass('active');
        });

        // Instrument Selector
        $instrumentSelector.on('click', function () {
            self.getInstrumentOptions();
        });

        // Playlist Button
        $viewPlaylist.on('click', function () {
            self.viewPlayList();
        });

        // Options
        $options.on('click', function () {
            self.displayOptions();
        });

        // Recording Button
        $record.on('click', function () {
            if ($(this).hasClass('active')) {
                $(this).removeClass('active');
                self.stopRecording();
            } else {
                $(this).addClass('active');
                self.startRecording();
            }
        });

        // Back to App Button
        $backToApp.on('click', function () {
            self.show();
            $loader.fadeOut('fast');
            self.player.hide();
        });
    };

    /**
     * Plays a Note (whatever the note assigned to the button)
     * Will light up the note being played
     * @param {int}    note    The note to play
     * @param {object} $keyPad The HTML element that is clicked
     */
    LeafNote.Keyboard.prototype.playNote = function (note, $keyPad) {
        MIDI.noteOn(0, note, this.volume, 0);
        $keyPad.addClass('active');

        // Record the Note, if recording is on
        if (this.recording && !isNaN(note)) {
            this.recordNote(note);
        }
    };

    /**
     * Stops playing a Note (whatever the note assigned to the button)
     * @param {int}    note    The note to stop playing
     * @param {object} $keyPad The HTML Element / key
     */
    LeafNote.Keyboard.prototype.stopNote = function (note, $keyPad) {
        MIDI.noteOff(0, note, 0);
        $keyPad.removeClass('active');
    };

    /**
     * Record the Note
     * @param {string} note The Note to Add to the MIDI track
     */
    LeafNote.Keyboard.prototype.recordNote = function (note) {
        // clock: 100, MIDI channel: 0, note: E5, velocity: 127, duration: 50 clocks
        this.track3.addNote(this.startTime, 0, note, 127, 50); // Will need to determine duration
    };

    /**
     * Start the Recording
     */
    LeafNote.Keyboard.prototype.startRecording = function () {
        var self = this;

        this.recording = true;

        // Disable the Options Button
        this.optionButton.attr('disabled', true);

        // Keep track of the current time / clock
        this.recordTimer = setInterval(function () {
            self.startTime = self.startTime + 1;
        }, 1);

        // Create a MIDI file
        this.song = new JZZ.MidiFile(1, this.clockSpeed);

        // Add MIDI track
        this.track1 = new JZZ.MidiFile.MTrk; // Name and Tempo
        this.track2 = new JZZ.MidiFile.MTrk; // Lyrics
        this.track3 = new JZZ.MidiFile.MTrk; // Music

        // Push the tracks into the MIDI file
        this.song.push(this.track1);
        this.song.push(this.track2);
        this.song.push(this.track3);

        // Add titles for each track
        this.track2.addName(0,'Words');
        this.track3.addName(0,'Music');

        // clock: 0, instrument (hex): 0xc0 0x0b - The hex value 0b is the vibraphone number 11
        this.track3.addMidi(0, 0xc0, getHex(self.currentInstrument.id));
    };

    /**
     * Stop the recording and output the MIDI file
     */
    LeafNote.Keyboard.prototype.stopRecording = function () {
        // Remove keydown and keyup binding, temporarily
        this.unbindKeyDown();

        // Re-Enable the Options Button
        this.optionButton.removeAttr('disabled');

        // Add a few milliseconds to the end of the MIDI track
        this.track3.setTime(this.startTime + 100);

        // Reset some values
        this.recording = false;
        this.startTime = 100;
        clearInterval(this.recordTimer);

        // Prompt to Save the song locally
        this.displaySaveDialog();
    };

    /**
     * Display the Save Dialog so that a name can be entered for the recorded MIDI file
     */
    LeafNote.Keyboard.prototype.displaySaveDialog = function () {
        var self = this,
            dialogContent = _.template(
                '<label for="midiname">' +
                    'Give it a name:' +
                '</label>' +
                '<input type="text" id="midiname" name="midiName" />'
            ),
            dialog = $('<div/>', {
                html: dialogContent
            });

        // Display the dialog box for Downloading the MIDI file
        $(dialog).dialog({
            title: 'Save MIDI File',
            modal: true,
            buttons: [{
                text: 'Save',
                click: function () {
                    // Get the Song Data (Data URI and Name) then Save it and Play it
                    self.getSongData($('#midiname').val()).then(function (song) {
                        // Save the MIDI file, then play it
                        self.saveFile(song).then(function () {
                            self.displaySaveConfirmation();
                            $(dialog).dialog('close');
                        }, function (err) {
                            alert(err.message);
                            $(dialog).dialog('close');
                        });
                    });
                }
            }, {
                text: 'Discard',
                click: function () {
                    $(dialog).dialog('close');
                }
            }],
            close: function () {
                $(dialog).dialog('destroy');
                $(dialog).remove();
                // Re-enable keydown / keyup binding
                self.bindKeyDown(self.keyPads);
            }
        });
    };

    /**
     * Displays the Save Confirmation Message
     */
    LeafNote.Keyboard.prototype.displaySaveConfirmation = function () {
        var self = this,
            dialog = $('<div/>', {
                html: '<p>Song saved and added to Playlist</p>'
            });

        // Display the dialog box for Downloading the MIDI file
        $(dialog).dialog({
            title: 'Save Success!',
            modal: true,
            buttons: [{
                text: 'OK',
                click: function () {
                    $(dialog).dialog('close');
                }
            }],
            close: function () {
                $(dialog).dialog('destroy');
                $(dialog).remove();
                // Re-enable keydown / keyup binding
                self.bindKeyDown(self.keyPads);
            }
        });
    };

    /**
     * Saves the MIDI file locally
     * @param  {object} song The Song Object to be saved
     * @return {object} Promise
     */
    LeafNote.Keyboard.prototype.saveFile = function (song) {
        var def = $.Deferred(),
            songData = {
                name: song.name,
                duration: song.duration,
                uri: song.uri,
                b64: song.b64,
                type: 'song'
            };
        this.db.post(songData, function (err, res) {
            if (err) {
                def.reject(err);
            } else {
                def.resolve(res);
            }
        });
        return def.promise();
    };

    /**
     * Return the Song Data
     * @param  {string} name The name that will be used as the Track Name
     * @return {object} Promise
     */
    LeafNote.Keyboard.prototype.getSongData = function (name) {
        var def = $.Deferred(),
            trackName = name.charAt(0).toUpperCase() + name.slice(1);

        // Add the Entered Name as the MIDI file name
        this.track1.addName(0, trackName);

        // Create the song data (uri, b64, and name)
        // Then return it in the form of a Promise
        return def.resolve({
            name: trackName,
            duration: this.track3.getTime() * this.clockToTimeConversion,
            uri: 'data:audio/midi;base64,' + JZZ.MidiFile.toBase64(this.song.dump()),
            b64: JZZ.MidiFile.toBase64(this.song.dump())
        }).promise();
    };

    /**
     * Create the Instrument Dialog and allow for instrument selection
     */
    LeafNote.Keyboard.prototype.getInstrumentOptions = function () {
        var self = this,
            dialogContent = _.template(
                '<select id="instrumentOption" data-number="0">' +
                    '<% _.each(availableInstruments, function (instrument) { %>' +
                        '<option <% if (selectedInstrument.name == instrument.file) { %>selected="selected" <% } %>value="<%= instrument.file %>" data-number="<%= instrument.number %>"><%= instrument.name %></option>' +
                    '<% }); %>' +
                '</select>'),
            dialog = $('<div/>', {
                html: dialogContent({
                    availableInstruments: self.instruments.get(),
                    selectedInstrument: self.currentInstrument
                })
            });

        // Display the Dialog to select an instrument from
        $(dialog).dialog({
            title: 'Select an Instrument',
            modal: true,
            open: function () {
                $('#instrumentOption').on('change', function () {
                    self.currentInstrument.name = $(this).val();
                    self.currentInstrument.id = $('#instrumentOption option:selected').attr('data-number');
                });
            },
            buttons: [{
                text: 'OK',
                click: function () {
                    // @TODO - Move this to some function to be called on page load and here
                    // @TODO - If preloader works, we can use MIDI.setInstrument() to switch instruments... oh wells
                    MIDI.loadPlugin({
                        USE_XHR: false,
                        soundfontUrl: './js/assets/soundfont/',
                        instrument: self.currentInstrument.name,
                        callback: function () {
                            // Change the Instrument
                            MIDI.setInstrument(0, self.currentInstrument.id);
                        }
                    });

                    // If recording, switch the recorded instrument
                    if (self.recording) {
                        self.track3.addMidi(self.startTime, 0xc0, getHex(self.currentInstrument.id));
                    }

                    $(this).dialog('destroy');
                }
            }, {
                text: 'Cancel',
                click: function () {
                    $(this).dialog('destroy');
                }
            }],
            close: function () {
                $(this).dialog('destroy');
                $(dialog).remove();
            }
        });
    };

    /**
     * Display the Available Options
     */
    LeafNote.Keyboard.prototype.displayOptions = function () {
        var options = {
                themes: [{
                    id: 'theme1',
                    name: 'Default Theme'
                }, {
                    id: 'theme3',
                    name: 'Double Rainbow'
                }]
            },
            themeContent = _.template(
                '<lable for="theme">Select a Theme</label>' +
                '<select id="themeSelector">' +
                    '<% _.each(themes, function (theme) { %>' +
                        '<option <% if (selectedTheme == theme.id) { %>selected="selected" <% } %>value="<%= theme.id %>"><%= theme.name %></option>' +
                    '<% }); %>' +
                '</select>'
            ),
            dialog = $('<div/>', {
                html: themeContent({
                    themes: options.themes,
                    selectedTheme: LeafNote.currentTheme
                }),
                'class': 'options-dialog'
            });

        // Display the dialog
        $(dialog).dialog({
            title: 'Options',
            modal: true,
            buttons: [{
                text: 'Apply',
                click: function () {
                    LeafNote.applyTheme($('#themeSelector').val());
                    $(this).dialog('close');
                }
            }, {
                text: 'Cancel',
                click: function () {
                    $(this).dialog('close');
                }
            }],
            close: function () {
                $(this).dialog('destroy');
                $(dialog).remove();
            }
        });
    };

    /**
     * Display the PlayList
     */
    LeafNote.Keyboard.prototype.viewPlayList = function () {
        this.player.init();
        this.hide();
    };

    /**
     * Handle the Keydown and Keyup events to allow key binding to play notes
     */
    LeafNote.Keyboard.prototype.bindKeyDown = function () {
        var self = this,
            lastEvent,
            heldKeys = {},
            $keyDown,
            note;

        // Bind keydown events
        // - Plays the note
        $(document).on('keydown', function(event) {
            if (_.has(heldKeys, event.keyCode) || lastEvent && lastEvent.keyCode == event.keyCode) {
                return false;
            }
            $keyDown = self.getKeyPad(event.keyCode);
            if ($keyDown) {
                note = parseInt($keyDown.attr('data-note'), 10) + self.pitch;
                self.playNote(note, $keyDown);
            }
            lastEvent = event;
            heldKeys[event.keyCode] = true;
            return false;
        });

        // Bind keyup events
        // - Stops playing the note
        $(document).on('keyup', function(event) {
            lastEvent = null;
            delete heldKeys[event.keyCode];
            $keyDown = self.getKeyPad(event.keyCode);
            if ($keyDown) {
                note = parseInt($keyDown.attr('data-note'), 10) + self.pitch;
                self.stopNote(note, $keyDown);
            }
            return false;
        });
    };

    /**
     * Create the Sliders (Pitch and Volume)
     */
    LeafNote.Keyboard.prototype.renderSliders = function () {
        var self = this,
            $pitchSlider = $('#pitchSlider'),
            $volumeSlider = $('#volumeSlider');

        // Pitch Slider
        $pitchSlider.slider({
            min: 0,
            max: 6,
            value: 3,
            change: function (e, slider) {
                self.pitch = (parseInt(slider.value, 10) - 3) * 12; // Changes Octaves
                //self.pitch = (parseInt($(this).val(), 10) - 3) * 1; // Changes pitch by 1 step
            }
        });

        // Volume Slider
        $volumeSlider.slider({
            min: 0,
            max: 10,
            value: 5,
            change: function (e, slider) {
                self.volume = parseInt(slider.value, 10) * 25.5;
            }
        });
    };

    /**
     * Unbinds ALL the keydown and keyup events
     */
    LeafNote.Keyboard.prototype.unbindKeyDown = function () {
        $(document).off('keydown');
        $(document).off('keyup');
    };

    /**
     * Displays the Keyboard Interface
     */
    LeafNote.Keyboard.prototype.show = function () {
        this.logo.fadeIn('fast');
        this.bindKeyDown();
        this.keyboard.fadeIn('fast');
        this.keyboardTools.fadeIn('fast');
    };

    /**
     * Hides the Keyboard Interface
     */
    LeafNote.Keyboard.prototype.hide = function () {
        this.unbindKeyDown();
        this.keyboard.fadeOut('fast');
        this.keyboardTools.fadeOut('fast');
    };

    /**
     * Gets the note from the specified keyPad for the triggered keycode
     * @param  {int}   keyCode The keycode passed in by the keydown event
     * @return {int}   The keyPad
     */
    LeafNote.Keyboard.prototype.getKeyPad = function (keyCode) {
        var $keyPads = this.keyPads,
            keyPad;
        switch (keyCode) {
            case 65: // A
                keyPad = $keyPads[5];
                break;
            case 83: // S
                keyPad = $keyPads[6];
                break;
            case 68: // D
                keyPad = $keyPads[7];
                break;
            case 70: // F
                keyPad = $keyPads[8];
                break;
            case 71: // G
                keyPad = $keyPads[9];
                break;
            case 72: // H
                keyPad = $keyPads[10];
                break;
            case 74: // J
                keyPad = $keyPads[11];
                break;
            case 75: // K
                keyPad = $keyPads[12];
                break;
            case 76: // L
                keyPad = $keyPads[13];
                break;
            case 87: // W
                keyPad = $keyPads[0];
                break;
            case 69: // E
                keyPad = $keyPads[1];
                break;
            case 84: // T
                keyPad = $keyPads[2];
                break;
            case 89: // Y
                keyPad = $keyPads[3];
                break;
            case 85: // U
                keyPad = $keyPads[4];
                break;
            default:
                keyPad = undefined;
                break;
        }
        return $(keyPad) || false;
    };
})();