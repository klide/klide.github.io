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
        for (var i = 0; i < keyPads.length; i++) {
            // Play a note when mouse is down
            keyPads[i].addEventListener('mousedown', function (event) {
                self.playNote(event.target.getAttribute('data-note'));
            });
            // Stops playing a note when mouse is up
            keyPads[i].addEventListener('mouseup', function (event) {
                self.stopNote(event.target.getAttribute('data-note'));
            });
        }

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
     * @param {int} note The note to play
     */
    LeafNote.prototype.playNote = function (note) {
        console.log('Playing Note:', parseInt(note, 10) + this.pitch, 'Volume:', this.volume);
        MIDI.noteOn(0, parseInt(note, 10) + this.pitch, this.volume, 0);
    };

    /**
     * Stops playing a Note (whatever the note assigned to the button)
     * @param {int} note The note to stop playing
     */
    LeafNote.prototype.stopNote = function (note) {
        MIDI.noteOff(0, note, 0);
    };

    /**
     * Create the Dialog and Return it
     */
    LeafNote.prototype.getDialog = function () {
        alert('Coming Soon!');
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