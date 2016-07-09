﻿///////////////////////////////////////////////////////////////////////////////
// Copyright (c) ENikS.  All rights reserved.
//
// Licensed under the Apache License, Version 2.0  ( the  "License" );  you may 
// not use this file except in compliance with the License.  You may  obtain  a 
// copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required  by  applicable  law  or  agreed  to  in  writing,  software 
// distributed under the License is distributed on an "AS  IS"  BASIS,  WITHOUT
// WARRANTIES OR CONDITIONS  OF  ANY  KIND, either express or implied.  See the 
// License for the specific  language  governing  permissions  and  limitations 
// under the License.


import * as Constant from "./utilities";
import * as Iterator from "./iterators";
import * as Generator from "./generators";


//-----------------------------------------------------------------------------
//  Enumerable Implementation
//-----------------------------------------------------------------------------



export class EnumerableImpl<T> implements Enumerable<T>, Iterable<T>, IEnumerable<T> {

    //-------------------------------------------------------------------------
    //  Fields
    //-------------------------------------------------------------------------

    protected _target: Iterable<any>;
    protected _factoryArg: any;
    protected _initialize: Function;


    //-------------------------------------------------------------------------
    //  Constructor
    //-------------------------------------------------------------------------

    constructor(target: Iterable<any> | IEnumerable<any>, factory?: Function, arg?: any) {
        this._target = <Iterable<any>>target;
        this._factoryArg = arg;

        if (factory) {
            this[Symbol.iterator] = () => factory(this._factoryArg);
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    /** Returns JavaScript iterator */
    public [Symbol.iterator](): Iterator<T> {
        return this._target[Symbol.iterator]();
    }

    /** Returns C# style enumerator */
    public GetEnumerator(): IEnumerator<T> {
        return new Iterator.CSharpEnumerator<T>(this[Symbol.iterator]());
    }



    //-------------------------------------------------------------------------
    //  Immediate execution methods                                                                                            
    //-------------------------------------------------------------------------


    public Aggregate<A, B>(func: (A, T) => A, resultSelector: (A) => B): B;
    public Aggregate<A, B>(seed: A, func: (A, T) => A = Constant.selfFn, resultSelector: (A) => B = Constant.selfFn): B {
        let zero, method, selector;
        if (Constant.CONST_FUNCTION === typeof seed) {
            method = seed;
            selector = func;
        } else {
            zero = seed;
            method = func;
            selector = resultSelector;
        }
        let result: A = zero;
        for (let value of this) {
            if (!result) result = Constant.getDefaultVal(typeof(value));
            result = method(result, value);
        }
        return selector(result);
    }


    public All(predicate: (T) => boolean = Constant.trueFn) {
        for (let value of this) {
            if (!predicate(value)) {
                return false;
            }
        }
        return true;
    }


    public Any(predicate?: (T) => boolean) {
        let iterator: Iterator<T>;
        // Check if at least one exist
        if (!predicate && (iterator = this._target[Symbol.iterator]())) {
            return !iterator.next().done;
        }
        // Check if any satisfy the criteria
        for (let value of this) {
            if (predicate(value)) {
                return true;
            }
        }
        return false;
    }


    public Average(func: (T) => number = Constant.selfFn): number {
        let result, sum = 0, count = 0;
        for (let value of this) {
            sum += func(value);
            count++;
        }
        return sum / count;
    }


    public Contains(value: T, equal: (a: T, b: T) => boolean = (a, b) => a === b): boolean {
        for (let item of this) {
            if (equal(item, value)) {
                return true;
            }
        }
        return false;
    }


    public Count(predicate: (T) => boolean): number {
        let count = 0;
        if (predicate) {
            for (let value of this) {
                if (predicate(value)) {
                    count++;
                }
            }
        } else if (undefined != this._target[Constant.CONST_LENGTH]) {
            count = this._target[Constant.CONST_LENGTH];
        } else {
            for (let value of this) {
                count++;
            }
        }
        return count;
    }


    public Max(transform: (T) => number = Constant.selfFn): number {
        let value, max, hasValue = false;
        for (let item of this) {
            value = transform(item);
            if (hasValue) {
                if (max < value) max = value;
            }
            else {
                max = value;
                hasValue = true;
            }
        }
        if (!hasValue) throw Constant.CONST_NO_ELEMENTS;
        return max;
    }


    public Min(transform: (T) => number = Constant.selfFn): number {
        let value, min, hasValue = false;
        for (let item of this) {
            value = transform(item);
            if (hasValue) {
                if (min > value) min = value;
            }
            else {
                min = value;
                hasValue = true;
            }
        }
        if (!hasValue) throw Constant.CONST_NO_ELEMENTS;
        return min;
    }


    public ElementAt(index: number): T {
        if (this._target instanceof Array) {
            if (0 > index || this._target[Constant.CONST_LENGTH] <= index) {
                throw Constant.CONST_OUTOFRANGE;
            }
            return this._target[index];
        }
        let count = 0;
        for (let value of this) {
            if (index > count++) {
                continue;
            }
            return value;
        }
        throw Constant.CONST_OUTOFRANGE;
    }


    public ElementAtOrDefault(index: number): T {
        if (this._target instanceof Array) {
            let length = this._target[Constant.CONST_LENGTH];
            if (0 > index || length <= index) {
                let value = this._target[0];
                return 0 < length ? Constant.getDefaultVal(typeof (value), value)
                                  : undefined;
            }
            return this._target[index];
        }
        let value, count = 0;
        for (let item of this) {
            if (index === count++) {
                return item;
            }
            value = item;
        }
        return Constant.getDefaultVal(typeof value, value); // Last good value
    }


    public First(predicate: (T) => boolean = Constant.trueFn): T {
        for (let value of this) {
            if (predicate(value)) {
                return value;
            }
        }
        throw Constant.CONST_NOTHING_FOUND;
    }


    public FirstOrDefault(predicate: (T) => boolean = Constant.trueFn): T {
        let value;
        for (let item of this) {
            value = item;
            if (predicate(item)) {
                return item;
            }
        }
        return Constant.getDefaultVal(typeof value); // Last good value
    }


    public Last(predicate: (T) => boolean = Constant.trueFn): T {
        let value, found = false;
        for (let item of this) {
            if (predicate(item)) {
                value = item;
                found = true;
            }
        }
        if (!found) {
            throw Constant.CONST_NOTHING_FOUND;
        }
        return value;
    }


    public LastOrDefault(predicate: (T) => boolean = Constant.trueFn): T {
        let value, lastKnown, found = false;
        for (let item of this) {
            if (predicate(item)) {
                value = item;
                found = true;
            }
            lastKnown = item;
        }
        return (found) ? value : Constant.getDefaultVal(typeof lastKnown);
    }


    public SequenceEqual(other: Iterable<T>, equal: (a: T, b: T) => boolean = (a, b) => a === b): boolean {
        let res1, res2;
        let it1 = this[Symbol.iterator]();
        let it2 = other[Symbol.iterator]();
        do {
            res1 = it1.next(); res2 = it2.next();
            if ((res1.done != res2.done) || !equal(res1.value, res2.value)) {
                return false;
            }
        } while (!(res1.done) && !(res2.done));
        return true;
    }


    public Single(predicate: (T) => boolean = Constant.trueFn): T {
        let value, hasValue = false;
        for (let item of this) {
            if (predicate(item)) {
                if (!hasValue) {
                    value = item;
                    hasValue = true;
                }
                else {
                    throw Constant.CONST_TOO_MANY;
                }
            }
        }
        if (hasValue) return value;
        throw Constant.CONST_NOTHING_FOUND;
    }


    public SingleOrDefault<TSource>(predicate: (T) => boolean = Constant.trueFn): T {
        let value, lastKnown, hasValue = false;
        for (let item of this) {
            if (predicate(item)) {
                if (!hasValue) {
                    value = item;
                    hasValue = true;
                }
                else {
                    throw Constant.CONST_TOO_MANY;
                }
            }
            lastKnown = item;
        }
        return (hasValue) ? value : Constant.getDefaultVal(typeof lastKnown);
    }


    public Sum(transform: (T) => number = Constant.selfFn): number {
        let sum: number = 0;
        for (let value of this) {
            sum += transform(value);
        }
        return sum;
    }


    public ToArray(): Array<T> {
        let array = [];
        for (let value of this) {
            array.push(value);
        }
        return array;
    }


    public ToMap<TKey, TElement>(keySelector: (T) => TKey,
        elementSelector: (T) => TElement = Constant.selfFn): Map<TKey, TElement> {
        let dictionary = new Map<TKey, TElement>();
        for (let value of this) {
            dictionary.set(keySelector(value), elementSelector(value));
        }
        return dictionary;
    }


    public ToDictionary<TKey, TElement>(keySelector: (T) => TKey,
        elementSelector: (T) => TElement = Constant.selfFn): Map<TKey, TElement> {
        let dictionary = new Map<TKey, TElement>();
        for (let value of this) {
            dictionary.set(keySelector(value), elementSelector(value));
        }
        return dictionary;
    }



    public Cast<V>(): Enumerable<V> {
        return this as any as Enumerable<V>;    // TODO: Remove any once TypeScript 2.0 out
    }


    //-------------------------------------------------------------------------
    //  Deferred execution methods
    //-------------------------------------------------------------------------



    public DefaultIfEmpty(defaultValue: T = undefined): Enumerable<T> {
        return new EnumerableImpl<T>(Generator.DefaultIfEmpty(this, defaultValue));
    }


    public Concat(second: Iterable<T>): Enumerable<T> {
        this._target = Generator.SelectManyFast([this._target, second])
        return this;
    }


    public Distinct<V>(keySelector?: (T) => V): Enumerable<T> {
        this._target = keySelector ? Generator.Distinct(this._target, keySelector)
                                   : Generator.DistinctFast(this._target)
        return this;
    }


    public Except(other: Iterable<T>): Enumerable<T> {
        let set: Set<T> = new Set<T>();
        for (let value of other) {
            set.add(value);
        }
        this._target = Generator.Intersect(this._target, set, true);
        return this;
    }


    public GroupBy<K, E, R>(selKey: (T) => K, selElement: (T) => E = Constant.selfFn, selResult: (a: K, b: Iterable<E>) => R = Constant.defGrouping): Enumerable<R> {
        let map: Map<K, Array<E>> = Constant.getKeyedMap(this._target, selKey, selElement);
        return new EnumerableImpl<R>(Generator.GroupBy(map, selResult));
    }


    public GroupJoin<I, K, R>(inner: Iterable<I>, oKeySelect: (T) => K, iKeySelect: (I) => K, resultSelector: (a: T, b: Iterable<I>) => R = Constant.defGrouping): Enumerable<R> {
        return new EnumerableImpl<R>(Generator.GroupJoin(this._target, oKeySelect, resultSelector, Constant.getKeyedMapFast(inner, iKeySelect)));
    }


    public Intersect(other: Iterable<T>): Enumerable<T> {
        let set: Set<T> = new Set<T>();
        for (let value of other) {
            set.add(value);
        }
        this._target = Generator.Intersect(this._target, set, false)
        return this;
    }


    public Join<I, K, R>(inner: Iterable<I>, oSelector: (T) => K, iSelector: (I) => K, transform: (T, I) => R): Enumerable<R> {
        this._target = Generator.Join<T, K, R, I>(this._target, oSelector, transform, Constant.getKeyedMapFast(inner, iSelector));
        return this as any as Enumerable<R>;
    }


    public OrderBy<K>(keySelect: (T) => K = Constant.selfFn, equal: (a: K, b: K) => number = (a, b) => <any>a - <any>b): Enumerable<T> {
        return new OrderedLinq<T>(this, (array) => new Iterator.ArrayIterator(array, 0, (i) => i >= array.length),
                                        (a: T, b: T) => equal(keySelect(a), keySelect(b)));
    }


    public OrderByDescending<K>(keySelect: (T) => K = Constant.selfFn, equal: (a: K, b: K) => number = (a, b) => <any>a - <any>b): Enumerable<T> {
        return new OrderedLinq<T>(this,
            (array) => new Iterator.ArrayIterator(array, array.length - 1, (i) => 0 > i, -1),
            (a: T, b: T) => equal(keySelect(a), keySelect(b)));
    }


    public ThenBy<K>(keySelect: (T) => K = Constant.selfFn, equal: (a: K, b: K) => number = (a, b) => <any>a - <any>b): Enumerable<T> {
        if (this instanceof OrderedLinq) {
            let superEqual = (<OrderedLinq<T>><any>this).equal;
            (<OrderedLinq<T>><any>this).equal = (a: T, b: T) => {
                let result: number = superEqual(a, b);
                return (0 != result) ? result : equal(keySelect(a), keySelect(b));
            }
            return this;
        } else {
            return new OrderedLinq<T>(this,
                (array) => new Iterator.ArrayIterator(array, 0, (i) => i >= array.length),
                (a: T, b: T) => equal(keySelect(a), keySelect(b)));
        }
    }


    public ThenByDescending<K>(keySelect: (T) => K = Constant.selfFn, equal: (a: K, b: K) => number = (a, b) => <any>a - <any>b): Enumerable<T> {
        if (this instanceof OrderedLinq) {
            let superEqual = (<OrderedLinq<T>><any>this).equal;
            (<OrderedLinq<T>><any>this).equal = (a: T, b: T) => {
                let result: number = superEqual(a, b);
                return (0 != result) ? result : equal(keySelect(a), keySelect(b));
            }
            return this;
        } else {
            return new OrderedLinq<T>(this,
                (array) => new Iterator.ArrayIterator(array, array.length - 1, (i) => 0 > i, -1),
                (a: T, b: T) => equal(keySelect(a), keySelect(b)));
        }
    }


    public Range(start: number, count: number): Enumerable <number> {
        return new EnumerableImpl<number>(Generator.Range(start, count));
    }


    public Repeat<V>(element: V, count: number): Enumerable<V> {
        return new EnumerableImpl<V>(Generator.Repeat(element, count));
    }


    public Reverse(): Enumerable<T> {
        let array: Array<T> = Array.isArray(this._target) ? <Array<T>>this._target : this.ToArray();
        return new EnumerableImpl<T>(null, () => new Iterator.ArrayIterator(array, array.length - 1, (i) => 0 > i, -1));
    }


    public Select<V>(transform: (T) => V): Enumerable<V>;
    public Select<V>(transform: (T, number) => V): Enumerable<V> {
        this._target = Generator.Select(this._target, transform)
        return this as any as Enumerable<V>;
    }


    public SelectMany<S, V>(selector: (T, number) => Iterable<S> = Constant.selfFn, result: (T, S) => V = (t, s) => s): Enumerable<V> {
        this._target = Generator.SelectMany(this._target, selector, result);
        return this as any as Enumerable<V>;
    }


    public Skip(skip: number): Enumerable<T> {
        this._target = Generator.Skip(this._target, skip)
        return this;
    }


    public SkipWhile(predicate: (T) => boolean): Enumerable<T>;
    public SkipWhile(predicate: (T, number) => boolean): Enumerable<T> {
        this._target = Generator.SkipWhile(this._target, predicate);
        return this;
    }


    public Take(take: number): Enumerable<T> {
        this._target = Generator.TakeWhile(this._target, (a, n) => take > n);
        return this;
    }


    public TakeWhile(predicate: (T, number) => boolean): Enumerable<T> {
        this._target = Generator.TakeWhile(this._target, predicate);
        return this;
    }


    public Union<K>(second: Iterable<T>, keySelector?: (T) => K): Enumerable<T>
    {
        this._target = keySelector ? Generator.Union(this._target, second, keySelector)
                                   : Generator.UnionFast(this._target, second)
        return this;
    }


    public Where(predicate: (T) => Boolean): Enumerable<T>;
    public Where(predicate: (T, number) => Boolean = Constant.trueFn): Enumerable<T> {
        this._target = Generator.Where(this._target, predicate);
        return this;
    }


    public Zip<V, Z>(second: Iterable<V>, func: (T, V) => Z): Enumerable<Z> {
        this._target = Generator.Zip(this._target, second, func);
        return this as any as Enumerable<Z>
    }
}


class OrderedLinq<T> extends EnumerableImpl<T> {

    constructor(target: Iterable<any> | IEnumerable<any>, factory: Function, public equal: Function) {
        super(target, factory);

        this._factoryArg = this.ToArray();
        this._factoryArg.sort(this.equal);
    }
}

