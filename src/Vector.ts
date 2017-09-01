import { Seq } from "./Seq";
import { WithEquality} from "./Util";
import { withEqHashCode, withEqEquals } from "./Util";
import { HashMap} from "./HashMap";
const hamt: any = require("hamt_plus");

export class Vector<T> implements Seq<T> {
    
    /*private*/ constructor(private hamt: any, private indexShift: number) {}

    static empty<T>(): Vector<T> {
        return <Vector<T>>emptyVector;
    }

    static ofArray<T>(arr: Array<T & WithEquality>): Vector<T> {
        if (arr.length === 0) {
            return <Vector<T>>emptyVector;
        }
        return new Vector<T>(hamt.empty.mutate(
            (h:any) => arr.forEach((x, i) => h.set(i, x))), 0);
    }

    static of<T>(...arr: Array<T & WithEquality>): Vector<T> {
        return Vector.ofArray(arr);
    }

    toArray(): T[] {
        let r = [];
        for (let i=0;i<this.hamt.size;i++) {
            r.push(this.hamt.get(i));
        }
        return r;
    }

    size(): number {
        return this.hamt.size;
    }

    append(elt: T & WithEquality|null): Vector<T> {
        return new Vector<T>(this.hamt.set(this.hamt.size, elt), this.indexShift);
    }

    forEach(fn: (v:T)=>void): void {
        for (let i=0;i<this.hamt.size;i++) {
            fn(this.hamt.get(i));
        }
    }

    appendAll(elts: Vector<T>): Vector<T> {
        return new Vector<T>(this.hamt.mutate(
            (h:any) => elts.forEach(x => h.set(h.size, x))), this.indexShift);
    }

    groupBy<C>(classifier: (v:T & WithEquality)=>C & WithEquality): HashMap<C,Vector<T>> {
        return this.hamt.fold(
            (acc: HashMap<C,Vector<T>>, v:T & WithEquality, k:number) =>
                acc.putWithMerge(classifier(v), Vector.of(v), (v1,v2)=>v1.appendAll(v2)), HashMap.empty());
    }

    equals(other: Vector<T>): boolean {
        const sz = this.hamt.size;
        if (sz !== other.hamt.size) {
            return false;
        }
        for (let i=0;i<this.hamt.size;i++) {
            const myVal: T & WithEquality|null|undefined = this.hamt.get(i);
            const hisVal: T & WithEquality|null|undefined = other.hamt.get(i);
            if (myVal === undefined !== hisVal === undefined) {
                return false;
            }
            if (myVal === undefined || hisVal === undefined) {
                return true;
            }
            if (!withEqEquals(myVal, hisVal)) {
                return false;
            }
        }
        return true;
    }

    hashCode(): number {
        let hash = 1;
        for (let i=0;i<this.hamt.size;i++) {
            hash = 31 * hash + withEqHashCode(this.hamt.get(i));
        }
        return hash;
    }

    toString(): string {
        let r = "[";
        for (let i=0;i<this.hamt.size;i++) {
            if (i>0) {
                r += ", ";
            }
            r += "" + this.hamt.get(i);
        }
        return r + "]";
    }
}

const emptyVector = new Vector(hamt.make(), 0);
