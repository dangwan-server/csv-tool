export type TypeStructInfo = {
    name: string;
    comment: string;
    body: string;
    propertys: MessageStructProperty[];
};

export type MessageStructProperty = {
    name: string;
    type: MessageStructType;
    comment: string;
    typeTarget?: TypeStructInfo;
};

export type MessageStructType = {
    name: string;
    isRecomb: boolean; //复合类型
    son?: string;
};

export type TypeServiceName = {
    comment: string;
    serviceName: string;
    requestName: string;
    replyName: string;
};

export type TypeServiceInfo = {
    name: string;
    c2s: TypeStructInfo;
    s2c: TypeStructInfo;
};
