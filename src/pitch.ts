import { Interval } from './Interval';
import {
  pitchFromHelmholtzNotation,
  pitchFromScientificNotation,
  pitchToPitchClass,
  pitchToScientificNotation,
} from './notation';
import { PitchClass } from './PitchClass';
import { PitchLike } from './PitchLike';

/** `Pitch` represents musical pitches such as "E4" and "F♯5". It converts
 * between string and instance representations.
 */
export class Pitch implements PitchLike {
  public static fromMidiNumber(midiNumber: number): Pitch {
    return new Pitch(midiNumber);
  }

  public static fromString(name: string): Pitch {
    const midiNumber = (name.match(/\d/)
      ? pitchFromScientificNotation
      : pitchFromHelmholtzNotation)(name);
    return new Pitch(midiNumber, name);
  }

  public readonly name: string;
  constructor(readonly midiNumber: number, name?: string) {
    this.name = name || pitchToScientificNotation(midiNumber);
    this.midiNumber = midiNumber;
  }

  public toString(): string {
    return this.name;
  }

  public add(other: Interval): Pitch {
    return new Pitch(this.midiNumber + other.semitones);
  }

  public asPitch(): Pitch {
    return this;
  }

  public asPitchClass(): PitchClass {
    return PitchClass.fromSemitones(pitchToPitchClass(this.midiNumber));
  }

  public transposeBy(interval: Interval): Pitch {
    return new Pitch(this.midiNumber + interval.semitones);
  }
}

// tslint:disable-next-line variable-name
export const Pitches = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(
  (pitch) => new Pitch(pitch),
);