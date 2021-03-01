import { ObservebleInterface, SubscribeAbleFunction } from "../types/obserbe.d";

const map = (inputObservable: any) => {
    return function (tranformFn: Function) {
        return createObservable(function (outputObjservable: any) {
            inputObservable.subscribe({
                next(v: any) {
                    const newVal = tranformFn(v);
                    outputObjservable.next(newVal);
                },
                error(err: any) {
                    outputObjservable.error(err);
                },
                complete(v: any) {
                    outputObjservable.complete && outputObjservable.complete(v);
                },
            });
        });
    };
};

const filter = (inputObservable: any) => {
    return function (conditionFn: Function) {
        return createObservable(function (outputObjservable: any) {
            inputObservable.subscribe({
                next(v: any) {
                    if (conditionFn(v)) {
                        outputObjservable.next(v);
                    }
                },
                error(err: any) {
                    outputObjservable.error(err);
                },
                complete(v: any) {
                    outputObjservable.complete && outputObjservable.complete(v);
                },
            });
        });
    };
};

const nextObserve = (inputObservable: any) => {
    return (outputObjservable: any) => {
        return createObservable((b) => {
            inputObservable.subscribe({
                next(v: any) {
                    outputObjservable.subscribe({
                        next(v: any) {
                            b.next(v);
                        },
                        error(err: any) {
                            b.error(err);
                        },
                        complete(v: any) {
                            b.complete && outputObjservable.complete(v);
                        },
                    });
                },
                error(err: any) {
                    b.error(err);
                },
                complete(v: any) {
                    b.complete && outputObjservable.complete(v);
                },
            });
        });
    };
};

export const createObservable = function (subscribe: SubscribeAbleFunction): ObservebleInterface {
    let canObserveable: any = {
        subscribe,
    };
    canObserveable.map = map(canObserveable);
    canObserveable.filter = filter(canObserveable);
    canObserveable.nextObserve = nextObserve(canObserveable);

    return canObserveable;
};
