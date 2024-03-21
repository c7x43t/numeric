const safeDigits = Math.floor(Math.log10(Math.sqrt(Number.MAX_SAFE_INTEGER)));
const safeEdge = 10**safeDigits;
class BInt{ // experimental BigInt 
    int;
    constructor(n, init=true){
        if(!init) {
            this.int = 0;
            return;
        }
   
        if(n>=safeEdge){
            this.int=[];
            let rest = 0;
            while(n>safeEdge){
                const safeCell = n % safeEdge;
                rest  = (n-safeCell) / safeEdge;
                this.int.push(safeCell);
                n=rest;
            }
            if(n>0){
                this.int.push(rest);
            }
        }else{
            this.int = [n];
        }
    }
    add(n){
        const x = new BInt(n);
        let res_int=[], carry=0;
        let max_base = this.int.length >= x.int.length ? this.int.length : x.int.length;
        for(let i=0;i<max_base;i++){
            const cell = carry + (this.int[i]  ?? 0) + (x.int[i]   ?? 0)
            if(cell>=safeEdge){
                const safeCell = cell % safeEdge;
                carry  = (cell-safeCell) / safeEdge;
                res_int.push(safeCell)
            }else{
                carry=0;
                res_int.push(cell)
            }
        }
        if(carry>0){
            res_int.push(carry);
        }
        x.int = res_int;
        return x;
    }
    toString(){
        let result = '';
        for(let i=this.int.length-1;i>=0;i--){
            result+=this.int[i];
        }
        return result;
    }
    toInt(){
        let sum = 0;
        for(let i = 0;i<this.int.length;i++){
            sum+=this.int[i]*10**(safeDigits*i);
        }
        return sum;
    }
}