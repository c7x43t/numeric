
class Numeric{
	#precision;
	#number;
	constructor(n,precision=20){
		this.#precision = BigInt(precision);
		this.#number = 0n;
		if(n instanceof Numeric){
			this.#number = n.getNumber();
			return;
		}
		if(n===undefined || n===null) return;
		if(typeof n === 'bigint'){
            // big ints are falsely initialized, but calling Numeric in functions below 
            // creates the correct results
			this.#number = n; //*10n**BigInt(precision);
			return;
		}
		// number
		const sn = n.toString();
		// if (/e/i.test(sn)) {
        //     const [base, exponent] = sn.split(/e/i).map((part, index) => index === 0 ? part : parseInt(part, 10));
        //     const [integerPart, fractionalPart = ''] = base.includes('.') ? base.split('.') : [base, ''];
        //     const totalLength = BigInt(integerPart.length + fractionalPart.length);
        //     let adjustedNumber = BigInt(integerPart + fractionalPart);
        //     const totalExponent = BigInt(exponent) + this.#precision - totalLength;
      
        //     if (totalExponent >= 0) {
        //       this.#number = adjustedNumber * 10n ** totalExponent;
        //     } else {
        //       // For negative exponents, more sophisticated handling might be needed depending on the precision and the minimum representable value.
        //       this.#number = 0n;
        //       // throw new Error('Handling of negative exponents with high precision needs more sophisticated logic');
        //     }
        //   } else 
          if(sn.includes('.')){
			const sparts = sn.split('.')
			const parts = sparts.map(BigInt);
			const base = BigInt(parts[0]) * 10n**this.#precision;
			const frac =  BigInt(parts[1]) * 10n**(this.#precision-BigInt(sparts[1].length))
			this.#number = base + (n>=0 ? frac : -frac)
		}else{
			this.#number = BigInt(sn) * 10n**this.#precision;
		}
	}
	toString0(){
		const base = this.#number / 10n**this.#precision;
		let frac = this.#number % 10n**this.#precision;
		if(frac === 0n) return base.toString();
		if(frac<0n) frac = -frac;
		frac = frac.toString();
		const zpos = frac.match(/0+$/)?.index??-1;
		if(zpos>=0){
			frac = frac.slice(0, zpos);
		}
		return `${base}.${frac.toString()}`;
	}
	toString() {
		const base = this.#number / 10n**this.#precision;
		let frac = this.#number % 10n**this.#precision;
		if (frac === 0n) return base.toString();
		if (frac < 0n) frac = -frac;

		// Convert fraction to string with leading zeros preserved
		let fracStr = frac.toString().padStart(Number(this.#precision), '0'); // Ensure leading zeros are preserved

		// Remove trailing zeros from the fraction part
		fracStr = fracStr.replace(/0+$/, '');

		// If all digits are zeros, return the integer part only
		if (fracStr.length === 0) return base.toString();

		return `${base}.${fracStr}`;
	}
	get value(){
		return Number(this.toString());
	}
	getNumber(){
		return this.#number;
	}
    setNumber(number){
        return this.#number = number;
    }
	add(n){
		const x = new Numeric(n);
		const res = this.#number + x.getNumber();
		return new Numeric(res);
	}
	sub(n){
		const x = new Numeric(n);
		const res = this.#number - x.getNumber();
		return new Numeric(res);
	}
	mul(n){
		const x = new Numeric(n);
		const res = (this.#number * x.getNumber())/10n**this.#precision;
		return new Numeric(res);
	}
	div(n){
		const x = new Numeric(n);
		const res = ((this.#number*10n**this.#precision) / x.getNumber());
		return new Numeric(res);
	}
	round(n){
		let x = n instanceof Numeric ? n.getNumber() : BigInt(n);
		let prec = this.#precision - x;
		let left = this.#number / 10n**prec;
		const right = this.#number  % 10n**prec;
		const edge = 5n * 10n**(prec-1n);
		if(right>=edge){
			left+=1n;
		}
		return new Numeric(left*10n**prec);
	}
	abs(){
		return new Numeric(this.#number >= 0n ? this.#number : -this.#number);
	}
    floor(){
        return new Numeric(this.#number - (this.#number % 10n**this.#precision));
    }
    ceil(){
        const right = this.#number % 10n**this.#precision;
        return new Numeric(this.#number - right + (right === 0n ? 0n : 10n**this.#precision))
    }
    mod(n){
		let x = n instanceof Numeric ? n : new Numeric(n,this.#precision);
        const res = this.#number % x.getNumber();
        const num = new Numeric(0n,this.#precision);
        num.setNumber(res);
        return  num;
    }
    static floor(n){
        return new Numeric(n).floor();
    }
    static ceil(n){
        return new Numeric(n).ceil();
    }
    static #exp(x) { // 1.5s
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
    static log2BigInt_(n) {// slow
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
    static exp(x){
        x = x instanceof Numeric ? x : new Numeric(x);
        if(x.getNumber() < new Numeric(5).getNumber()) return Numeric.#exp(x);
        // exp(x) = exp(x/n)**n
        const div = Numeric.#log2BigInt(x.getNumber());
        return Numeric.#pow2(Numeric.#exp(x.div(div)),div)
    }
    static expl(x){
        x = x instanceof Numeric ? x : new Numeric(x);
        if(x.getNumber() < new Numeric(5).getNumber()) return Numeric.#exp(x);
        // exp(x) = exp(x/n)**n
        const div = Numeric.log(2n, x.getNumber()).ceil();
        return Numeric.#pow2(Numeric.#exp(x.div(div)),div)
    }
    static #pow2(base, exponent) { // faster pow assuming exponent is a power of 2
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
	exp(){
		return Numeric.exp(this.#number);
	}
	ln(){
		return Numeric.ln(this.#number);
	}
	pow(n){
		return Numeric.pow(this.#number,n);
	}
	log(n){
		return Numeric.log(this.#number,n);
	}
	bankersRound(n){
		let x = n instanceof Numeric ? n.getNumber() : BigInt(n);
		let prec = this.#precision - x;
		let left = this.#number / 10n**prec;
		const right = this.#number % 10n**prec;
		const edge = 5n * 10n**(prec-1n);
		if (right > edge || (right === edge && (left % 2n === 1n))) {
			left += 1n;
		}
		return new Numeric(left * 10n**prec);
	}
}