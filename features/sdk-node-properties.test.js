/* eslint-disable no-new */
const { SpecificationPoint } = require('./sdk-node-properties');

describe('SpecificationPoint', () => {
  describe('constructor', () => {
    [
      // real examples from the spec
      'RSC7d6b',
      'RSA4d1',
      'RTN13',
      'RTE6a',
      'TG7',
      'TS12n',

      // allowed though not from the spec
      'A1',
      'A23',
      'AA1',
      'AA45',
      'AAA1',
      'AAA67',

      // deepest supported
      'A1b2c3',
      'AAA1234567890b1234567890c1234567890',

      // potential accidental inputs that, unfortunately, are accepted by the simplistic RegExp
      'RTE6aa',
      'RTE6aa1',
    ].forEach((validString) => {
      it(`succeeds if the supplied string is correctly formatted: "${validString}"`, () => {
        const specificationPoint = new SpecificationPoint(validString);
        expect(specificationPoint.toString()).toBe(validString);
      });
    });

    [
      // clearly invalid
      '',
      ' ',
      'Hello',

      // spaces around
      ' RSC7d6b',
      ' RSA4d1',
      ' RTN13',
      ' RTE6a',
      ' TG7',
      ' TS12n',
      'RSC7d6b ',
      'RSA4d1 ',
      'RTN13 ',
      'RTE6a ',
      'TG7 ',
      'TS12n ',

      // incorrect casing
      'rsc7d6b',
      'rSA4d1',
      'Rtn13',
      'RtE6a',
      'tg7',
      'Ts12n',
      'RSC7d6B',
      'RSA4D1',
      'RTE6A',
      'TS12N',

      // too many initial capital letters
      'ABCD1',
      'ABCD1e2f',

      // any numbers with preceding zeros
      'A01',
      'AAA01',
      'AAA001',
      'A1b02',
      'A1b2c03',

      // deeper than needed
      'A1b2c3d',

      // other potential accidental inputs
      'RSAd1',
    ].forEach((invalidString) => {
      it(`fails if the supplied string is incorrectly formatted: "${invalidString}"`, () => {
        expect(() => {
          new SpecificationPoint(invalidString);
        }).toThrow();
      });
    });
  });
});
