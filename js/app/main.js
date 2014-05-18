(function () {

    /**
     * leafNote App
     * Basic methods to initialize and play a note on a click of a button
     */
    var LeafNote = function () {
        // Some Basic Default Settings
        this.volume = 200;
        this.pitch = 0;
        this.instrument = 'acoustic_grand_piano';
        this.noteDuration = 700;
    };

    /**
     * Initializes the App
     */
    LeafNote.prototype.init = function () {
        var self = this;

        // Some Elements the User will Interact with
        var keyPads = document.getElementsByClassName('play'),
            volumeSlider = document.getElementById('volumeSlider'),
            pitchSlider = document.getElementById('pitchSlider'),
            instrumentSelector = document.getElementById('instrumentSelector');

        // Loops through the buttons and handle each of the following events
        // @TODO - Might move this into a separate method
        for (var i = 0; i < keyPads.length; i++) {

            // Play a note when mouse is down
            keyPads[i].addEventListener('mousedown', function (event) {
                self.playNote(parseInt(event.target.getAttribute('data-note'), 10) + self.pitch, event.target);
            });

            // Stops playing a note when mouse is up
            keyPads[i].addEventListener('mouseup', function (event) {
                self.stopNote(parseInt(event.target.getAttribute('data-note'), 10) + self.pitch, event.target);
            });
        }

        // Handle Key Down Events to play notes (for pressing keyboard keys)
        this.handleKeyDown(keyPads);

        // Dims out all the keyPads when the mouse is up at anytime
        // @TODO - Might move this into a separate method
        document.addEventListener('mouseup', function (event) {
            for (var i = 0; i < keyPads.length; i++) {
                keyPads[i].className = keyPads[i].className.replace(' active', '');
            }
        });

        // Listener for Volume Slider
        volumeSlider.addEventListener('change', function (event) {
            self.volume = event.target.value * 25.5;
        });

        // Listener for Pitch Slider
        pitchSlider.addEventListener('change', function (event) {
            self.pitch = (event.target.value - 3) * 12;
        });

        // Listener for Instrument Selector
        instrumentSelector.addEventListener('click', function () {
            self.getDialog();
        });
    };

    /**
     * Plays a Note (whatever the note assigned to the button)
     * Will light up the note being played
     * @param {int} note The note to play
     */
    LeafNote.prototype.playNote = function (note, keyPad) {
        console.log('Playing Note:', note, 'Volume:', this.volume);
        MIDI.noteOn(0, note, this.volume, 0);
        keyPad.className = keyPad ? keyPad.className + ' active' : keyPad.className;
    };

    /**
     * Stops playing a Note (whatever the note assigned to the button)
     * @param {int} note The note to stop playing
     */
    LeafNote.prototype.stopNote = function (note, keyPad) {
        MIDI.noteOff(0, note, 0);
        keyPad.className = keyPad ? keyPad.className.replace(' active', '') : keyPad.className;
    };

    /**
     * Create the Dialog and Return it
     */
    LeafNote.prototype.getDialog = function () {
        alert('Coming Soon!');
    };

    /**
     * Handle the Keydown and Keyup events to allow key binding to play notes
     * @param {array} keyPads An array of all the buttons
     */
    LeafNote.prototype.handleKeyDown = function (keyPads) {
        var self = this,
            lastEvent,
            heldKeys = {},
            keyDown,
            note;

        // Bind keydown events
        // - Plays the note
        document.onkeydown = function(event) {
            if (_.has(heldKeys, event.keyCode) || lastEvent && lastEvent.keyCode == event.keyCode) {
                return false;
            }
            keyDown = self.getKeyPad(keyPads, event.keyCode);
            if (keyDown) {
                note = parseInt(keyDown.getAttribute('data-note'), 10) + self.pitch;
                self.playNote(note, keyDown);
            }
            lastEvent = event;
            heldKeys[event.keyCode] = true;
            return false;
        };

        // Bind keyup events
        // - Stops playing the note
        document.onkeyup = function(event) {
            lastEvent = null;
            delete heldKeys[event.keyCode];
            keyDown = self.getKeyPad(keyPads, event.keyCode);
            if (keyDown) {
                note = parseInt(keyDown.getAttribute('data-note'), 10) + self.pitch;
                self.stopNote(note, keyDown);
            }
            return false;
        };
    };

    /**
     * Gets the note from the specified keyPad for the triggered keycode
     * @param  {array} keyPads An array of all the buttons
     * @param  {int}   keyCode The keycode passed in by the keydown event
     * @return {int}   The keyPad
     */
    LeafNote.prototype.getKeyPad = function (keyPads, keyCode) {
        var keyPad;
        switch (keyCode) {
            case 65: // A
                keyPad = keyPads[5];
                break;
            case 83: // S
                keyPad = keyPads[6];
                break;
            case 68: // D
                keyPad = keyPads[7];
                break;
            case 70: // F
                keyPad = keyPads[8];
                break;
            case 71: // G
                keyPad = keyPads[9];
                break;
            case 72: // H
                keyPad = keyPads[10];
                break;
            case 74: // J
                keyPad = keyPads[11];
                break;
            case 75: // K
                keyPad = keyPads[12];
                break;
            case 76: // L
                keyPad = keyPads[13];
                break;
            case 87: // W
                keyPad = keyPads[0];
                break;
            case 69: // E
                keyPad = keyPads[1];
                break;
            case 84: // T
                keyPad = keyPads[2];
                break;
            case 89: // Y
                keyPad = keyPads[3];
                break;
            case 85: // U
                keyPad = keyPads[4];
                break;
            default:
                keyPad = undefined;
                break;
        }
        return keyPad || false;
    };

    /**
     * MIDI Loader / Config
     */
    MIDI.loadPlugin({
        USE_XHR: false,
        soundfontUrl: './js/assets/soundfont/',
        callback: function () {
            // Create a new instance of LeafNote() and call init()
            var leafNote = new LeafNote();
            leafNote.init();
        }
    });

})();