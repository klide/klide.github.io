(function () {
    /**
     * A List of the Available Instruments
     */
    LeafNote.Instruments = function () {
        this.list = [{
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
     * Returns the list of instruments
     * @return instruments
     */
    LeafNote.Instruments.prototype.get = function () {
        return this.list;
    }
})();