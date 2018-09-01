import { ChordClass } from './ChordClass';
import { Interval } from './Interval';
import { Pitch } from './Pitch';
import { PitchClass } from './PitchClass';
import { PitchLike } from './PitchLike';
import { rotateArray } from './utils';

const chordNameRegex = /^([a-gA-G],*'*[#b♯♭𝄪𝄫]*(?:\d*))\s*(.*)$/;

const inversionNames = ['a', 'c', 'd'];

export class Chord<T extends PitchLike> {
  /** Return either a `Chord` or a `ChordClass`, depending on whether `name`
   * specifies a pitch or pitch class (e.g. "E Major" or "E7 Major"), or just a
   * chord class (e.g. "Major").
   */
  public static fromString(
    name: string,
  ): Chord<Pitch> | Chord<PitchClass> | ChordClass {
    const match = name.match(chordNameRegex);
    if (!match) {
      throw new Error(`“${name}” is not a chord name`);
    }
    const rootName = match[1];
    const className = match[2];
    const chordClass = ChordClass.fromString(className || 'Major');
    return rootName ? chordClass.at(Pitch.fromString(rootName)) : chordClass;
  }

  /** Return the Chord that matches a set of pitches. The first pitch should be
   * the root.
   */
  public static fromPitches<T extends PitchLike>(pitches: T[]): Chord<T> {
    const root = pitches[0];
    const intervals = pitches.map((pitch) => Interval.between(root, pitch));
    return ChordClass.fromIntervals(intervals).at(root);
  }

  /** The preferred abbreviation. */
  public readonly abbr: string;
  public readonly abbrs: string[];
  public readonly intervals: Interval[];
  public readonly pitches: T[];
  constructor(
    readonly chordClass: ChordClass,
    readonly root: T,
    readonly inversion = 0,
  ) {
    this.abbrs = this.chordClass.abbrs.map((abbr: string) =>
      `${this.root.toString()} ${abbr}`.replace(/\s+$/, ''),
    );
    this.abbr = this.abbrs[0];
    this.intervals = this.chordClass.intervals;
    this.pitches = this.chordClass.intervals.map((interval: Interval) =>
      this.root.transposeBy(interval),
    ) as T[];

    // degrees = (1 + 2 * pitchClass.semitones for pitchClass in [0..@pitchClasses.length])
    // degrees[1] = {'Sus2':2, 'Sus4':4}[@name] || degrees[1]
    // degrees[3] = 6 if @name.match /6/

    if (this.inversion) {
      this.intervals = rotateArray(this.intervals, this.inversion);
      this.pitches = rotateArray(this.pitches, this.inversion);
    }
  }

  get name() {
    return `${this.root.toString()} ${this.chordClass.name}`;
  }

  get fullName() {
    return `${this.root.toString()} ${this.chordClass.fullName}`;
  }

  // @pitchClasses = rotateArray(@pitchClasses, @inversion)

  // @components = for interval, index in intervals
  //   semitones = interval.semitones
  //   name = IntervalNames[semitones]
  //   degree = degrees[index]
  //   if semitones == 0
  //     name = 'R'
  //   else unless Number(name.match(/\d+/)?[0]) == degree
  //     name = "A#{degree}" if Number(IntervalNames[semitones - 1].match(/\d+/)?[0]) == degree
  //     name = "d#{degree}" if Number(IntervalNames[semitones + 1].match(/\d+/)?[0]) == degree
  //   name

  // at: (root) ->
  //   @_clone root: root

  // degreeName: (degreeIndex) ->
  //   @components[degreeIndex]

  // enharmonicizeTo: (scale) ->
  //   @_clone root: @root.enharmonicizeTo(scale)

  public invert(inversionKey: number | string): Chord<T> {
    let inversion: number;
    if (typeof inversionKey === 'string') {
      const ix = inversionNames.indexOf(inversionKey);
      if (ix < 0) {
        throw new Error(`Unknown inversion “${inversionKey}”`);
      }
      inversion = 1 + ix;
    } else {
      inversion = inversionKey;
    }
    return new Chord(this.chordClass, this.root, inversion);
  }
}

class ChordClassAccessor extends ChordClass {
  public static addChord(chordClass: ChordClass) {
    const pitchKey = chordClass.intervals.map((i) => i.semitones).join(',');
    [
      chordClass.name,
      chordClass.fullName,
      ...chordClass.abbrs,
      pitchKey,
    ].forEach((key) => {
      if (key) {
        ChordClass.chordMap.set(key, chordClass);
      }
    });
  }
}

const chordClassArray: ChordClass[] = [
  { name: 'Major', abbrs: ['', 'M'], intervals: '047' },
  { name: 'Minor', abbrs: ['m'], intervals: '037' },
  { name: 'Augmented', abbrs: ['+', 'aug'], intervals: '048' },
  { name: 'Diminished', abbrs: ['°', 'dim'], intervals: '036' },
  { name: 'Sus2', abbrs: ['sus2'], intervals: '027' },
  { name: 'Sus4', abbrs: ['sus4'], intervals: '057' },
  { name: 'Dominant 7th', abbrs: ['7', 'dom7'], intervals: '047t' },
  { name: 'Augmented 7th', abbrs: ['+7', '7aug'], intervals: '048t' },
  { name: 'Diminished 7th', abbrs: ['°7', 'dim7'], intervals: '0369' },
  { name: 'Major 7th', abbrs: ['maj7'], intervals: '047e' },
  { name: 'Minor 7th', abbrs: ['min7'], intervals: '037t' },
  { name: 'Dominant 7b5', abbrs: ['7b5'], intervals: '046t' },
  // following is also half-diminished 7th
  { name: 'Minor 7th b5', abbrs: ['ø', 'Ø', 'm7b5'], intervals: '036t' },
  { name: 'Diminished Maj 7th', abbrs: ['°Maj7'], intervals: '036e' },
  {
    abbrs: ['min/maj7', 'min(maj7)'],
    intervals: '037e',
    name: 'Minor-Major 7th',
  },
  { name: '6th', abbrs: ['6', 'M6', 'M6', 'maj6'], intervals: '0479' },
  { name: 'Minor 6th', abbrs: ['m6', 'min6'], intervals: '0379' },
].map(({ name, abbrs, intervals }) => {
  const fullName = name;
  name = name
    .replace(/Major(?!$)/, 'Maj')
    .replace(/Minor(?!$)/, 'Min')
    .replace('Dominant', 'Dom')
    .replace('Diminished', 'Dim');
  const toneNames: { [_: string]: number } = { t: 10, e: 11 };
  const intervalInstances = intervals.match(/./g)!.map((c: string) => {
    const left = toneNames[c];
    const semitones = left != null ? left : Number(c);
    return Interval.fromSemitones(semitones);
  });
  return new ChordClass({
    abbrs,
    fullName,
    intervals: intervalInstances,
    name,
  });
});

chordClassArray.forEach(ChordClassAccessor.addChord);