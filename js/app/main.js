var LeafNote = (function () {

    /**
     * leafNote App
     * Basic methods to initialize and play a note on a click of a button
     */
    var LeafNote = function () {
        this.song;
        this.track;

        // Some Basic Default Settings
        this.volume = 200;
        this.pitch = 0;
        this.currentInstrument = {
            name: 'acoustic_grand_piano',
            id: 0
        };
        this.noteDuration = 700;
        this.recordTimer;
        this.startTime = 3;
        this.recording = false;

        // Create the Local leafNote DB Instance, if none exists
        this.db = PouchDB('leafNote') ? PouchDB('leafNote') : new PouchDB('leafNote');
    };

    /**
     * Initializes the App
     */
    LeafNote.prototype.init = function () {
        var self = this;

        // Some Elements the User will Interact with
        var $keyPads = $('.play'),
            $volumeSlider = $('#volumeSlider'),
            $pitchSlider = $('#pitchSlider'),
            $instrumentSelector = $('#instrumentSelector'),
            $options = $('#options'),
            $record = $('#record'),
            $backToApp = $('#backToApp');

        // Display the leafNote App Container
        $('#leafNoteApp').fadeIn('fast');
        $('#loader').fadeOut('fast');

        /************************/
        /** Event Bindings ******/
        /************************/

        // For any of the keyPads Play a note when mouse is down
        $keyPads.on('mousedown', function () {
            self.playNote(parseInt($(this).attr('data-note'), 10) + self.pitch, $(this));
        });

        // Stops playing a note when mouse is up
        $keyPads.on('mouseup', function () {
            self.stopNote(parseInt($(this).attr('data-note'), 10) + self.pitch, $(this));
        });

        // Handle Key Down Events to play notes (for pressing keyboard keys)
        this.handleKeyDown($keyPads);

        // Dims out all the keyPads when the mouse is up at anytime
        $(document).on('mouseup', function () {
            $keyPads.removeClass('active');
        });

        // Volume Slider
        $volumeSlider.on('change', function () {
            self.volume = parseInt($(this).val(), 10) * 25.5;
        });

        // Pitch Slider
        $pitchSlider.on('change', function () {
            self.pitch = (parseInt($(this).val(), 10) - 3) * 12; // Changes Octaves
            //self.pitch = (parseInt($(this).val(), 10) - 3) * 1; // Changes pitch by 1 step
        });

        // Instrument Selector
        $instrumentSelector.on('click', function () {
            self.getInstrumentOptions();
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

        $backToApp.on('click', function () {
            $('#leafNoteApp').fadeIn('fast');
            $('#loader').fadeOut('fast');
            $('#player').fadeOut('fast');
        });
    };

    /**
     * Plays a Note (whatever the note assigned to the button)
     * Will light up the note being played
     * @param {int}    note    The note to play
     * @param {object} $keyPad The HTML element that is clicked
     */
    LeafNote.prototype.playNote = function (note, $keyPad) {
//        console.log('Note:', note, MIDI.noteToKey[note]);
//        console.log('Playing Note:', note, 'Volume:', this.volume, 'Instrument:', this.currentInstrument.name, 'Current Time:', this.startTime);
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
    LeafNote.prototype.stopNote = function (note, $keyPad) {
        MIDI.noteOff(0, note, 0);
        $keyPad.removeClass('active');
    };

    /**
     * Record the Note
     * @param {string} note The Note to Add to the MIDI track
     */
    LeafNote.prototype.recordNote = function (note) {
        // clock: 100, MIDI channel: 0, note: E5, velocity: 127, duration: 50 clocks
        this.track.addNote(this.startTime, 0, note, 127, 50); // Will need to determine duration
    };

    /**
     * Start the Recording
     */
    LeafNote.prototype.startRecording = function () {
        var self = this;

        this.recording = true;

        // Keep track of the current time / clock
        this.recordTimer = setInterval(function () {
            self.startTime = self.startTime + 1;
        }, 1);

        // Create a MIDI file
        this.song = new JZZ.MidiFile(1, 108);

        // Add MIDI track
        this.track = new JZZ.MidiFile.MTrk;

        // Some Track Metadata (Name, Tempo, etc)
        this.track.addName(0, 'Sample Song');

        // clock: 0, instrument (hex): 0xc0 0x0b - The hex value 0b is the vibraphone number 11
        this.track.addMidi(0, 0xc0, this.getHex(self.currentInstrument.id));
        this.song.push(this.track);
    };

    /**
     * Stop the recording and output the MIDI file
     */
    LeafNote.prototype.stopRecording = function () {
        // Remove keydown and keyup binding, temporarily
        this.unbindKeyDown();

        // Add a few milliseconds to the end of the MIDI track
        this.track.setTime(this.startTime + 100);

        // Reset some values
        this.recording = false;
        this.startTime = 100;
        clearInterval(this.recordTimer);

        // Convert to Base-64 string then create a data URI so it can be downloaded
        var newSong = this.song.dump(),
            b64 = JZZ.MidiFile.toBase64(newSong),
            uri = 'data:audio/midi;base64,' + b64;

        // Prompt to Save the song locally
        this.displaySaveDialog(uri);
    };

    /**
     * Display the Save Dialog so that a name can be entered for the recorded MIDI file
     * @param {string} uri The URI Data to be saved
     */
    LeafNote.prototype.displaySaveDialog = function (uri) {
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
                text: 'OK',
                click: function () {
                    self.saveFile(uri, $('#midiname').val()).then(function (res) {
                        self.outputMidiFile(res.id);
                        $(dialog).dialog('close');
                    }, function (err) {
                        alert(err.message);
                    });
                }
            }],
            close: function () {
                $(dialog).dialog('destroy');
                $(dialog).remove();
                // Re-enable keydown / keyup binding
                self.handleKeyDown($('.play'));
            }
        });
    };

    /**
     * Saves the MIDI file locally
     * @param {string} file The URI data
     * @param {string} name The Name of the MIDI file to store
     */
    LeafNote.prototype.saveFile = function (file, name) {
        var def = $.Deferred();

        this.db.put({_id: name, uri: file}, function (err, res) {
            if (err) {
                def.reject(err);
            } else {
                def.resolve(res);
            }
        });
        return def.promise();
    };

    /**
     * Outputs the recorded MIDI file into an embed object in a dialog box
     * @param {string} fileName The Name of the MIDI File to Output
     */
    LeafNote.prototype.outputMidiFile = function (fileName) {
        // Get the song and render / play it
        this.db.get(fileName, function (err, res) {
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
                title: 'Playing MIDI file: ' + fileName,
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

    /**
     * Gets all the stored MIDI files
     * @TODO - Will use later to display list of recorded MIDI files
     */
    LeafNote.prototype.getAllFiles = function () {
        var def = $.Deferred();
        this.db.allDocs({include_docs: true, attachments: true}, function (err, res) {
            if (err) {
                def.resolve(err);
            } else {
                def.resolve(res);
            }
        });
        return def.promise();
    };

    /**
     * Create the Instrument Dialog and allow for instrument selection
     */
    LeafNote.prototype.getInstrumentOptions = function () {
        var self = this,
            dialogContent = _.template(
                '<select id="instrumentOption" data-number="0">' +
                    '<% _.each(availableInstruments, function (instrument) { %>' +
                        '<option value="<%= instrument.file %>" data-number="<%= instrument.number %>"><%= instrument.name %></option>' +
                    '<% }); %>' +
                '</select>'),
            dialog = $('<div/>', {
                html: dialogContent({availableInstruments: self.availableInstruments})
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
                        self.track.addMidi(self.startTime, 0xc0, self.getHex(self.currentInstrument.id));
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
    LeafNote.prototype.displayOptions = function () {
        var self = this,
            options = [{
                id: 'viewPlaylist',
                name: 'View Playlist'
            }, {
                id: 'changeTheme',
                name: 'Change Theme'
            }],
            dialogContent = _.template(
                '<% _.each(options, function (option) { %>' +
                    '<button id="<%= option.id %>"><%= option.name %></button>' +
                '<% }); %>'
            ),
            dialog = $('<div/>', {
                html: dialogContent({options: options}),
                'class': 'options-dialog'
            });

        // Display the dialog
        $(dialog).dialog({
            title: 'Options',
            modal: true,
            open: function () {
                $.each($(this).find('button'), function (i, button) {
                    $(button).on('click', function () {
                        $(this).attr('id') == 'viewPlaylist' ? self.viewPlayList() : self.displayThemeSelector();
                        $(dialog).dialog('close');
                    });
                });
            },
            close: function () {
                $(this).dialog('destroy');
                $(dialog).remove();
            }
        });
    };

    /**
     * Display the Theme Selector Dialog
     */
    LeafNote.prototype.displayThemeSelector = function () {
        var themes = [{
                id: 'theme1',
                name: 'Theme 1'
            }, {
                id: 'theme2',
                name: 'Theme 2'
            }],
            dialogContent = _.template(
                '<% _.each(themes, function (theme) { %>' +
                    '<button id="<%= theme.id %>"><%= theme.name %></button>' +
                '<% }); %>'
            ),
            dialog = $('<div/>', {
                html: dialogContent({themes: themes}),
                'class': 'options-dialog'
            });

        // Display the dialog
        $(dialog).dialog({
            title: 'Select a Theme',
            modal: true,
            buttons: [{
                text: 'OK',
                click: function () {
                    // @TODO - Save the selected theme into the localDB
                    $(dialog).dialog('close');
                }
            }],
            open: function () {
                $.each($(this).find('button'), function (i, button) {
                    $(button).on('click', function () {
                        $('#currentTheme').attr('class', $(this).attr('id'));
                    });
                });
            },
            close: function () {
                $(this).dialog('destroy');
                $(dialog).remove();
            }
        });
    };

    /**
     * Display the PlayList
     */
    LeafNote.prototype.viewPlayList = function () {
        $('#player').fadeIn('fast');
        $('#leafNoteApp').fadeOut('fast');
    };

    /**
     * Handle the Keydown and Keyup events to allow key binding to play notes
     * @param {array} $keyPads An array of all the buttons
     */
    LeafNote.prototype.handleKeyDown = function ($keyPads) {
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
            $keyDown = self.getKeyPad($keyPads, event.keyCode);
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
            $keyDown = self.getKeyPad($keyPads, event.keyCode);
            if ($keyDown) {
                note = parseInt($keyDown.attr('data-note'), 10) + self.pitch;
                self.stopNote(note, $keyDown);
            }
            return false;
        });
    };

    /**
     * Unbinds ALL the keydown and keyup events
     */
    LeafNote.prototype.unbindKeyDown = function () {
        $(document).off('keydown');
        $(document).off('keyup');
    };

    /**
     * Gets the note from the specified keyPad for the triggered keycode
     * @param  {array} $keyPads An array of all the buttons
     * @param  {int}   keyCode The keycode passed in by the keydown event
     * @return {int}   The keyPad
     */
    LeafNote.prototype.getKeyPad = function ($keyPads, keyCode) {
        var keyPad;
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

    /**
     * Gets the HEX value of the Number / id
     * @return hex value
     */
    LeafNote.prototype.getHex = function (id) {
        var hex = (parseInt(id, 10)).toString(16);
        if (hex.length < 2) {
            hex = '0' + hex;
        }
        return "0x" + hex;
    };

    /**
     * MIDI Loader / Config
     */
    MIDI.loadPlugin({
        USE_XHR: false,
        soundfontUrl: './js/assets/soundfont/',
        // Commented out Instruments for now... Causes bad Lag in FireFox when it tries to preload
        // instruments: ['acoustic_grand_piano', 'accordion', 'acoustic_guitar_nylon', 'acoustic_guitar_steel', 'alto_sax', 'overdriven_guitar', 'music_box', 'synth_strings_1', 'violin'],
        callback: function () {
            // Create a new instance of LeafNote() and call init()
            var leafNote = new LeafNote();
            leafNote.init();
        }
    });

    return LeafNote;
})();