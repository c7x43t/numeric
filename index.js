const precision = 22n;
const precision_int = 22;
const zero = 10n ** BigInt(precision);
const one_scaled = 10n ** BigInt(precision);
const two_scaled = 2n * one_scaled;
const five_scaled = 5n * one_scaled;
const bi = new Array(64).fill(0).map((e, i) => BigInt(i));
const nbi = new Array(64).fill(0).map((e, i) => BigInt(-i));
const zeroes = new Array(32).fill("").map((e, i) => "0".repeat(i));
function fastPadStart0(str, len) {
  return str.length < len ? zeroes[len - str.length] + str : str;
}
class Numeric {
  #number;
  #precision;
  static parseScaled(n) {
    if (!(n instanceof Numeric)) {
      if (typeof n !== "bigint") {
        const sn = n.toString();
        const index = sn.indexOf('e');
        if (index > -1) {
          const base = sn.substring(0, index);
          const exponent_negative = sn[index + 1] === '-';
          const exponent_str = sn.substring(index + 2);
          const exponent = exponent_negative ? nbi[exponent_str] : bi[exponent_str];
          const base_index = base.indexOf('.');
          if (base_index > -1) {
            const integerPart = base.substring(0, base_index);
            const fractionalPart = base.substring(base_index + 1);
            return BigInt(integerPart) * 10n ** (precision + exponent) + BigInt(fractionalPart) * 10n ** (precision + exponent - bi[fractionalPart.length]);
          } else {
            return BigInt(base) * 10n ** (precision + exponent);
          }
        } else {
          const sn_index = sn.indexOf('.');
          if (sn_index > -1) {
            const integerPart = sn.substring(0, sn_index);
            const fractionalPart = sn.substring(sn_index + 1);
            return BigInt(integerPart) * one_scaled + BigInt(fractionalPart) * 10n ** (precision - bi[fractionalPart.length]);
          } else {
            return BigInt(sn) * one_scaled;
          }
        }
      } else {
        return n * one_scaled;
      }
    } else {
      return n.getNumber();
    }
  }
  constructor(n, scale = true) {
    this.#number = !scale ? n : Numeric.parseScaled(n);
  }
  toString() {
    const base = this.#number / one_scaled;
    let frac = this.#number % one_scaled;
    if (frac === 0n) return base.toString();
    if (frac < 0n) frac = -frac;
    let fracStr = fastPadStart0((frac).toString(), precision_int);
    let str = `${base.toString()}.${fracStr}`;
    return str;
  }
  get value() {
    const base = this.#number / one_scaled;
    let frac = this.#number % one_scaled;
    if (frac === 0n) return Number(base); // whole number fast path
    return Number(this.toString()); // unoptimized
  }
  getNumber() {
    return this.#number;
  }
  setNumber(number) {
    return (this.#number = number);
  }
  add(n) {
    const x = Numeric.parseScaled(n);
    const res = this.#number + x;
    return new Numeric(res, false);
  }
  sub(n) {
    const x = Numeric.parseScaled(n);
    const res = this.#number - x;
    return new Numeric(res, false);
  }
  mul(n) {
    const x = Numeric.parseScaled(n);
    const res = (this.#number * x) / one_scaled;
    return new Numeric(res, false);
  }
  div(n) {
    const x = Numeric.parseScaled(n);
    const res = (this.#number * one_scaled) / x;
    return new Numeric(res, false);
  }
  round(n = 0) {
    let x = n instanceof Numeric ? n.floor() / one_scaled : BigInt(n);
    let prec = this.#precision - x;
    let left = this.#number / 10n ** prec;
    const right = this.#number % 10n ** prec;
    const edge = 5n * 10n ** (prec - 1n);
    if (right >= edge) {
      left += 1n;
    }
    return new Numeric(left * 10n ** prec, this.#precision, false);
  }
  abs() {
    return new Numeric(this.#number >= 0n ? this.#number : -this.#number, false);
  }
  floor() {
    return new Numeric(this.#number - (this.#number % one_scaled), false);
  }
  ceil() {
    const right = this.#number % one;
    return new Numeric(this.#number - right + (right === 0n ? 0n : one_scaled), false);
  }
  mod(n) {
    let x = n instanceof Numeric ? n : new Numeric(n, this.#precision);
    const res = this.#number % x.getNumber();
    return new Numeric(res, this.#precision, false);
  }
  static floor(n) {
    return new Numeric(n).floor();
  }
  static ceil(n) {
    return new Numeric(n).ceil();
  }
  static #exp(x) {
    // 1.5s
    x = x instanceof Numeric ? x : new Numeric(x);
    let sum = new Numeric(1); // Initialize sum to 1
    let term = new Numeric(1); // First term is also 1
    let n = 1; // Start with x^1/1!

    // Use a loop to add terms until they are negligibly small
    //let steps=0
    while (true) {
      //steps++
      term = term.mul(x).div(new Numeric(n)); // Each term is x^n/n!
      if (term.getNumber() === 0n) break; // Break if the term does not affect the sum

      sum = sum.add(term); // Add the term to the sum
      n++; // Increment n for the next term
    }
    //console.log({steps})
    return sum;
  }
  static log2BigInt_(n) {
    // slow
    if (n <= 0n) {
      throw new Error("Argument must be positive");
    }
    return BigInt(n.toString(2).length);
  }
  static #log2BigInt(n) {
    if (n <= 0n) {
      throw new Error("Argument must be positive");
    }

    let log2 = 0;
    while (n > 1n) {
      n >>= 1n; // Equivalent to dividing by 2
      log2++;
    }
    return log2;
  }
  static exp(x) {
    x = x instanceof Numeric ? x : new Numeric(x);
    if (x.getNumber() < new Numeric(5).getNumber()) return Numeric.#exp(x);
    // exp(x) = exp(x/n)**n
    const div = Numeric.#log2BigInt(x.getNumber());
    return Numeric.#pow2(Numeric.#exp(x.div(div)), div);
  }
  static expl(x) {
    x = x instanceof Numeric ? x : new Numeric(x);
    if (x.getNumber() < new Numeric(5).getNumber()) return Numeric.#exp(x);
    // exp(x) = exp(x/n)**n
    const div = Numeric.log(2n, x.getNumber()).ceil();
    return Numeric.#pow2(Numeric.#exp(x.div(div)), div);
  }
  static #pow2(base, exponent) {
    // faster pow assuming exponent is a power of 2
    base = base instanceof Numeric ? base : new Numeric(base);
    exponent = exponent instanceof Numeric ? exponent : new Numeric(exponent);
    const zero = new Numeric(0);
    const one = new Numeric(1);
    const two = new Numeric(2);
    let result = new Numeric(1); // Start with the identity element of multiplication
    while (exponent.getNumber() > zero) {
      // If exponent is odd, multiply the result by the base
      if (exponent.mod(two).floor().getNumber() === one.getNumber()) {
        result = result.mul(base);
      }
      // Square the base
      base = base.mul(base);
      // Halve the exponent, assuming it is an integer
      exponent = exponent.div(two).floor();
      // exponent = Numeric.floor(exponent.getNumber() / two.getNumber());
    }
    return result;
  }
  // static powN(base, exponent) { //
  //     let result = new Numeric(1);
  //     for (let i = 0; i < exponent; i++) {
  //         result = result.mul(base);
  //     }
  //     return result;
  // }
  static ln(x) {
    x = x instanceof Numeric ? x : new Numeric(x);
    if (x.getNumber() <= 0n) {
      throw new Error("ln(x) is only defined for x > 0.");
    }

    let sum = new Numeric(0);
    if (x.value < 0.1 || x.value > 10) {
      // For x significantly less than 1 or greater than 1, find a normalization strategy
      let ln2 = new Numeric(Math.log(2)); // Precomputed ln(2)
      let k = new Numeric(0);
      let y = new Numeric(x.value);
      while (y.value < 0.5) {
        y = y.mul(new Numeric(2));
        k = k.sub(new Numeric(1));
      }
      while (y.value > 2) {
        y = y.div(new Numeric(2));
        k = k.add(new Numeric(1));
      }
      // Now y is normalized close to 1, calculate ln(y) using the series directly
      let term = y.sub(new Numeric(1)).div(y.add(new Numeric(1)));
      let termToPower = term;
      let n = 1;
      while (true) {
        let currentTerm = termToPower.div(new Numeric(n));
        if (currentTerm.getNumber() === 0n) break;
        sum = sum.add(currentTerm);
        termToPower = termToPower.mul(term).mul(term);
        n += 2;
      }
      sum = sum.mul(new Numeric(2)).add(k.mul(ln2));
    } else {
      // x is close to 1, use the series directly
      let term = x.sub(new Numeric(1)).div(x.add(new Numeric(1)));
      let termToPower = term;
      let n = 1;
      while (true) {
        let currentTerm = termToPower.div(new Numeric(n));
        if (currentTerm.getNumber() === 0n) break;
        sum = sum.add(currentTerm);
        termToPower = termToPower.mul(term).mul(term);
        n += 2;
      }
      sum = sum.mul(new Numeric(2));
    }
    return sum;
  }
  static log(base, n) {
    // Convert base and n to Numeric if they aren't already
    let b = base instanceof Numeric ? base : new Numeric(base);
    let num = n instanceof Numeric ? n : new Numeric(n);

    // Use the change of base formula
    return Numeric.ln(num).div(Numeric.ln(b));
  }
  static pow(base, n) {
    // Convert base and n to Numeric if they aren't already
    let b = base instanceof Numeric ? base : new Numeric(base);
    let exponent = n instanceof Numeric ? n : new Numeric(n);

    // Calculate base^n using the identity base^n = exp(n * ln(base))
    return Numeric.exp(exponent.mul(Numeric.ln(b)));
  }
  exp() {
    return Numeric.exp(this);
  }
  ln() {
    return Numeric.ln(this);
  }
  pow(n) {
    return Numeric.pow(this, n);
  }
  log(n) {
    return Numeric.log(this, n);
  }
  bankersRound(n) {
    let x = n instanceof Numeric ? n.getNumber() : BigInt(n);
    let prec = this.#precision - x;
    let left = this.#number / 10n ** prec;
    const right = this.#number % 10n ** prec;
    const edge = 5n * 10n ** (prec - 1n);
    if (right > edge || (right === edge && left % 2n === 1n)) {
      left += 1n;
    }
    return new Numeric(left * 10n ** prec);
  }
}
