const Benchmark: any = require('benchmark');

import { Vector } from "../src/Vector"
import { Vector2 } from "../src/Vector2"
import { List } from "../src/List"
import * as imm from 'immutable';
const hamt: any = require("hamt_plus");
const hamtBase: any = require("hamt");

const lengths = [200, 10000];

function getPrerequisites(length:number): Prerequisites {
    // https://stackoverflow.com/a/43044960/516188
    const getArray = (length:number) => Array.from({length}, () => Math.floor(Math.random() * length));
    const array = getArray(length);
    const vec = Vector.ofIterable(array);
    const vec2 = Vector2.ofIterable(array);
    const rawhamt = hamt.empty.mutate(
        (h:any) => {
            const iterator = array[Symbol.iterator]();
            let curItem = iterator.next();
            while (!curItem.done) {
                h.set(h.size, curItem.value);
                curItem = iterator.next();
            }
        });
    let rawhamtBase = hamtBase.empty;
    const iterator = array[Symbol.iterator]();
    let curItem = iterator.next();
    while (!curItem.done) {
        rawhamtBase = rawhamtBase.set(rawhamtBase.size, curItem.value);
        curItem = iterator.next();
    }

    const list = List.ofIterable(array);
    const immList = imm.List(array);

    const idxThreeQuarters = array.length*3/4;
    const atThreeQuarters = array[idxThreeQuarters];

    return {vec,vec2,immList,array,list,idxThreeQuarters,rawhamt,rawhamtBase,length};
}

interface Prerequisites {
    vec: Vector<number>;
    vec2: Vector2<number>;
    immList: imm.List<number>;
    array: number[];
    list: List<number>;
    idxThreeQuarters: number;
    rawhamt: any;
    rawhamtBase: any;
    length:number;
}

const preReqs = lengths.map(getPrerequisites);

function _compare(preReqs: Prerequisites, items: Array<[string, (x:Prerequisites)=>any]>) {
    const benchSuite: any = new Benchmark.Suite;
    for (const item of items) {
        benchSuite.add(item[0], () => item[1](preReqs));
    }
    benchSuite.on('cycle', function(event:any) {
        console.log(String(event.target));
    }).on('complete', function(this:any) {
        console.log('Fastest is ' + this.filter('fastest').map('name') + "\n");
    }).run();
}
function compare(...items: Array<[string, (x:Prerequisites)=>any]>) {
    for (let i=0;i<lengths.length;i++) {
        let length = lengths[i];
        console.log("n = " + length);
        _compare(preReqs[i], items);
    }
}

compare(['Vector2.toArray', (p:Prerequisites) => p.vec2.toArray()],
        ['immList.toArray', (p:Prerequisites) => p.immList.toArray()]);

compare(['Vector2.take', (p:Prerequisites) => p.vec2.take(p.idxThreeQuarters)],
        ['Array.slice', (p:Prerequisites) => p.array.slice(0,p.idxThreeQuarters)],
        ['immList.take', (p:Prerequisites) => p.immList.take(p.idxThreeQuarters)],
        ['List.take', (p:Prerequisites) => p.list.take(p.idxThreeQuarters)]);

compare(['Vector.filter', (p:Prerequisites) => p.vec.filter(x => x%2===0)],
        ['Vector2.filter', (p:Prerequisites) => p.vec2.filter(x => x%2===0)],
        ['Array.filter', (p:Prerequisites) => p.array.filter(x => x%2===0)],
        ['immList.filter', (p:Prerequisites) => p.immList.filter(x => x%2===0)],
        ['List.filter', (p:Prerequisites) => p.list.filter(x => x%2===0)]);

compare(['Vector.map', (p:Prerequisites) => p.vec.map(x => x*2)],
        ['Vector2.map', (p:Prerequisites) => p.vec2.map(x => x*2)],
        ['Array.map', (p:Prerequisites) => p.array.map(x => x*2)],
        ['immList.map', (p:Prerequisites) => p.immList.map(x => x*2)],
        ['List.map', (p:Prerequisites) => p.list.map(x => x*2)]);

compare(['Vector.find', (p:Prerequisites) => p.vec.find(x => x===p.idxThreeQuarters)],
        ['Vector2.find', (p:Prerequisites) => p.vec2.find(x => x===p.idxThreeQuarters)],
        ['Array.find', (p:Prerequisites) => p.array.find(x => x===p.idxThreeQuarters)],
        ['immList.find', (p:Prerequisites) => p.immList.find(x => x===p.idxThreeQuarters)],
        ['List.find', (p:Prerequisites) => p.list.find(x => x===p.idxThreeQuarters)]);

compare(['Vector.ofIterable', (p:Prerequisites) => Vector.ofIterable(p.array)],
        ['Vector2.ofIterable', (p:Prerequisites) => Vector2.ofIterable(p.array)],
        ['rawhamt.build from iterable', (p:Prerequisites) => {
            hamt.empty.mutate(
                (h:any) => {
                    const iterator = p.array[Symbol.iterator]();
                    let curItem = iterator.next();
                    while (!curItem.done) {
                        h.set(h.size, curItem.value);
                        curItem = iterator.next();
                    }
                })
        }],
        ['rawhamt.build from array', (p:Prerequisites) => {
            hamt.empty.mutate(
                (h:any) => {
                    for (let i=0;i<p.array.length;i++) {
                        h.set(i, p.array[i]);
                    }
                })
        }],
        ['rawhamtBase.build from iterable', (p:Prerequisites) => {
            let rawhamtBase = hamtBase.empty;
            const iterator = p.array[Symbol.iterator]();
            let curItem = iterator.next();
            while (!curItem.done) {
                rawhamtBase = rawhamtBase.set(rawhamtBase.size, curItem.value);
                curItem = iterator.next();
            }
        }],
        ['List.ofIterable', (p:Prerequisites) => List.ofIterable(p.array)],
        ['immList.ofIterable', (p:Prerequisites) => imm.List(p.array)]);

compare(['Vector.get(i)', (p:Prerequisites) => p.vec.get(p.length/2)],
        ['Vector2.get(i)', (p:Prerequisites) => p.vec2.get(p.length/2)],
        ['rawhamt.get(i)', (p:Prerequisites) => p.rawhamt.get(p.length/2)],
        ['rawhamtBase.get(i)', (p:Prerequisites) => p.rawhamtBase.get(p.length/2)],
        ['List.get(i)', (p:Prerequisites) => p.list.get(p.length/2)],
        ['Array.get(i)', (p:Prerequisites) => p.array[p.length/2]],
        ['immList.get(i)', (p:Prerequisites) => p.immList.get(p.length/2)]);

compare(['Vector.flatMap', (p:Prerequisites) => p.vec.flatMap(x => Vector.of(1,2))],
        ['Vector2.flatMap', (p:Prerequisites) => p.vec2.flatMap(x => Vector2.of(1,2))],
        ['List.flatMap', (p:Prerequisites) => p.list.flatMap(x => List.of(1,2))],
        ['immList.flatMap', (p:Prerequisites) => p.immList.flatMap(x => imm.List([1,2]))]);

compare(['Vector.reverse', (p:Prerequisites) => p.vec.reverse()],
        ['Vector2.reverse', (p:Prerequisites) => p.vec2.reverse()],
        ['Array.reverse', (p:Prerequisites) => p.array.reverse()],
        ['immList.reverse', (p:Prerequisites) => p.immList.reverse()],
        ['List.reverse', (p:Prerequisites) => p.list.reverse()]);

compare(['Vector.groupBy', (p:Prerequisites) => p.vec.groupBy(x => x%2)],
        ['Vector2.groupBy', (p:Prerequisites) => p.vec2.groupBy(x => x%2)],
        ['List.groupBy', (p:Prerequisites) => p.list.groupBy(x => x%2)],
        ['immList.groupBy', (p:Prerequisites) => p.immList.groupBy(x => x%2)]);

compare(['Vector.appendAll', (p:Prerequisites) => p.vec.appendAll(p.vec)],
        ['Vector2.appendAll', (p:Prerequisites) => p.vec2.appendAll(p.vec2)],
        ['Array.appendAll', (p:Prerequisites) => p.array.concat(p.array)],
        ['immList.appendAll', (p:Prerequisites) => p.immList.concat(p.immList)],
        ['List.appendAll', (p:Prerequisites) => p.list.appendAll(p.list)]);

compare(['Vector.prependAll', (p:Prerequisites) => p.vec.prependAll(p.vec)],
        ['Vector2.prependAll', (p:Prerequisites) => p.vec2.prependAll(p.vec2)],
        ['Array.prependAll', (p:Prerequisites) => p.array.concat(p.array)],
        ['List.prependAll', (p:Prerequisites) => p.list.prependAll(p.list)]);

compare(['Vector.foldLeft', (p:Prerequisites) => p.vec.foldLeft(0, (acc,i)=>acc+i)],
        ['Vector2.foldLeft', (p:Prerequisites) => p.vec2.foldLeft(0, (acc,i)=>acc+i)],
        ['Array.foldLeft', (p:Prerequisites) => p.array.reduce((acc,i)=>acc+i)],
        ['immList.foldLeft', (p:Prerequisites) => p.immList.reduce((acc,i)=>acc+i,0)],
        ['List.foldLeft', (p:Prerequisites) => p.vec.foldLeft(0, (acc,i)=>acc+i)]);

compare(['Vector.foldRight', (p:Prerequisites) => p.vec.foldRight(0, (i,acc)=>acc+i)],
        ['Vector2.foldRight', (p:Prerequisites) => p.vec2.foldRight(0, (i,acc)=>acc+i)],
        ['immList.foldRight', (p:Prerequisites) => p.immList.reduceRight((acc,i)=>acc+i,0)],
        ['List.foldRight', (p:Prerequisites) => p.vec.foldRight(0, (i,acc)=>acc+i)]);
