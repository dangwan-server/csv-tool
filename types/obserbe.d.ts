export interface SubscribeAble {
    next(v: any): void;
    error(err: any): void;
    complete?(v: any): void;
}

export interface ObservebleInterface {
    subscribe: SubscribeAbleFunction;
    map: FunInterface;
    filter: FunInterface;
    nextObserve(o: ObservebleInterface): ObservebleInterface;
}

export interface FunInterface {
    (...v: any): ObservebleInterface;
}

export interface SubscribeAbleFunction {
    (o: SubscribeAble): void;
}

export interface SingleValueFunction {
    (val: string): void;
}
