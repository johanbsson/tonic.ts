import { Chord, ChordClass } from './chord';
import { Pitch } from './pitch';
import { Scale } from './scale';

const chordRomanNumerals = 'I II III IV V VI VII'.split(/\s+/);

// tslint:disable object-literal-sort-keys quotemark
const romanNumeralModifiers: { [_: string]: string } = {
  "+": "aug",
  "°": "dim",
  "6": "maj6",
  "7": "dom7",
  "+7": "+7",
  "°7": "°7",
  "ø7": "ø7",
};
// tslint:enable

export function chordFromRomanNumeral(name: string, scale: Scale): Chord {
  const match = name.match(/^(♭?)(i+v?|vi*)(.*?)([acd]?)$/i);
  if (!match) {
    throw new Error(`“${name}” is not a chord roman numeral`);
  }
  if (scale.tonic == null) {
    throw new Error('requires a scale with a tonic');
  }
  // FIXME: use `accidental`
  // tslint:disable-next-line no-dead-store
  const [accidental, romanNumeral, modifiers, inversion] = match.slice(1);
  const degree = chordRomanNumerals.indexOf(romanNumeral.toUpperCase());
  if (!(degree >= 0)) {
    throw new Error('Not a chord name');
  }
  let chordType = (() => {
    switch (false) {
      case romanNumeral !== romanNumeral.toUpperCase():
        return 'Major';
      case romanNumeral !== romanNumeral.toLowerCase():
        return 'Minor';
      default:
        throw new Error(
          `Roman numeral chords can't be mixed case in “${romanNumeral}”`,
        );
    }
  })();
  if (modifiers) {
    // throw new Error("Unimplemented: mixing minor chords with chord modifiers") unless chordType == 'Major'
    chordType = romanNumeralModifiers[modifiers];
    if (!chordType) {
      throw new Error(`unknown chord modifier “${modifiers}”`);
    }
  }
  // TODO: 9, 13, sharp, natural
  // FIXME: remove the cast
  let chord = ChordClass.fromString(chordType).at(scale.pitches![
    degree
  ] as Pitch);
  if (inversion) {
    chord = chord.invert(inversion);
  }
  return chord;
}
