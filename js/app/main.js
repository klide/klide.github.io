(function () {

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

        // @TODO - Move this somewhere configurable
        this.availableInstruments = [{
            file: 'acoustic_grand_piano',
            name: 'Acoustic Grand Piano',
            number: 0
        }, {
            file: 'accordion',
            name: 'Accordion',
            number: 21
        }, {
            file: 'acoustic_bass',
            name: 'Acoustic Bass',
            number: 32
        }, {
            file: 'acoustic_guitar_nylon',
            name: 'Acoustic Guitar Nylon',
            number: 24
        }, {
            file: 'acoustic_guitar_steel',
            name: 'Acoustic Guitar Steel',
            number: 25
        }, {
            file: 'alto_sax',
            name: 'Alto Sax',
            number: 65
        }, {
            file: 'breath_noise',
            name: 'Breath Noise',
            number: 121
        }, {
            file: 'choir_aahs',
            name: 'Choir Aahs',
            number: 52
        }, {
            file: 'clarinet',
            name: 'Clarinet',
            number: 71
        }, {
            file: 'electric_guitar_clean',
            name: 'Electric Guitar Clean',
            number: 27
        }, {
            file: 'electric_guitar_muted',
            name: 'Electric Guitar Muted',
            number: 28
        }, {
            file: 'flute',
            name: 'Flute',
            number: 73
        }, {
            file: 'music_box',
            name: 'Music Box',
            number: 10
        }, {
            file: 'ocarina',
            name: 'Ocarina',
            number: 79
        }, {
            file: 'overdriven_guitar',
            name: 'Overdriven Guitar',
            number: 29
        }, {
            file: 'pad_4_choir',
            name: 'Pad 4 (Choir)',
            number: 91
        }, {
            file: 'pan_flute',
            name: 'Pan Flute',
            number: 75
        }, {
            file: 'shanai',
            name: 'Shanai',
            number: 111
        }, {
            file: 'steel_drums',
            name: 'Steel Drums',
            number: 114
        }, {
            file: 'string_ensemble_1',
            name: 'String Ensemble 1',
            number: 48
        }, {
            file: 'synth_strings_1',
            name: 'Synth Strings 1',
            number: 50
        }, {
            file: 'taiko_drum',
            name: 'Taiko Drum',
            number: 116
        }, {
            file: 'tenor_sax',
            name: 'Tenor Sax',
            number: 66
        }, {
            file: 'violin',
            name: 'Violin',
            number: 40
        }, {
            file: 'xylophone',
            name: 'Xylophone',
            number: 13
        }];
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
            $record = $('#record');

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
//            self.pitch = (parseInt($(this).val(), 10) - 3) * 1; // Changes pitch by 1 step
        });

        // Instrument Selector
        $instrumentSelector.on('click', function () {
            self.getInstrumentOptions();
        });

        // Options
        $options.on('click', function () {
            alert('Coming soon!');
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
        if (this.recording) {
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
     * Start the recording
     */
    LeafNote.prototype.startRecording = function () {
        var self = this;

        this.recording = true;

        // Keep track of the current time / clock
        this.recordTimer = setInterval(function () {
            self.startTime = self.startTime + 1;
        }, 1);

        // Create a MIDI file
        this.song = new JZZ.MidiFile(1, 100);

        // Add MIDI track
        this.track = new JZZ.MidiFile.MTrk;

        // Some Track Metadata (Name, Tempo, etc)
        this.track.addName(0, 'Sample Song');

        // clock: 0, instrument (hex): 0xc0 0x0b - The hex value 0b is the vibraphone number 11
        this.track.addMidi(0, 0xc0, this.getHex(self.currentInstrument.id));
        this.song.push(this.track);
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
     * Stop the recording and output the MIDI file
     */
    LeafNote.prototype.stopRecording = function () {
        // Add a few milliseconds to the end of the MIDI track
        this.track.setTime(this.startTime + 100);

        // Reset some values
        this.recording = false;
        this.startTime = 100;
        clearInterval(this.recordTimer);

        // Convert to Base-64 string then create a data URI so it can be downloaded
        var newSong = this.song.dump(),
            b64 = JZZ.MidiFile.toBase64(newSong),
            uri = 'data:audio/midi;base64,' + b64,
            dialogContent = _.template(
                '<h4>' +
                    '<embed class="midi-embed" src=' + uri + ' autostart=false>' +
                    '<a class="midi-download" target="_blank" href=' + uri + '>Download File</a>' +
                '</h4>'
            ),
            dialog = $('<div/>', {
                html: dialogContent({uri: uri})
            });

        // Display the dialog box for Downloading the MIDI file
        $(dialog).dialog({
            title: 'MIDI file',
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

})();