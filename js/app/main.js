(function () {

    /**
     * leafNote App
     * Basic methods to initialize and play a note on a click of a button
     */
    var LeafNote = function () {
        this.buttons = document.getElementsByClassName('play');
        this.instrument = 'acoustic_grand_piano';
        this.noteDuration = 500;
    };

    /**
     * Initializes the App
     */
    LeafNote.prototype.init = function () {
        var self = this;
        // Loops through the buttons and adds a 'click' event to each button
        // so when a button is clicked, this.play() is called
        for (var i = 0; i < this.buttons.length; i++) {
            this.buttons[i].addEventListener('click', function (event) {
                self.play(event.target.getAttribute('data-note'));
            });
        }
    };

    /**
     * Plays a Note (whatever the note assigned to the button)
     * @param {int} note The note to play
     */
    LeafNote.prototype.play = function (note) {
        console.log('Play Note:', note);
        MIDI.noteOn(0, note, 255, 0);

        // Hold the note for the given duration
        setTimeout(function() {
            MIDI.noteOff(0, note, 0);
        }, this.noteDuration);
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