/**
 * Load the MIDI Plugin and Create a Load up the Application
 */
MIDI.loadPlugin({
    USE_XHR: false,
    soundfontUrl: './js/assets/soundfont/',
    // Commented out Instruments for now... Causes bad Lag in FireFox when it tries to preload
    // instruments: ['acoustic_grand_piano', 'accordion', 'acoustic_guitar_nylon', 'acoustic_guitar_steel', 'alto_sax', 'overdriven_guitar', 'music_box', 'synth_strings_1', 'violin'],
    callback: function () {
        // Create a new instance of LeafNote() and call init()
        var keyboard = new LeafNote.Keyboard();
        keyboard.init();
    }
});