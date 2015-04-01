/// <reference path="dashboardHelpers.d.ts" />
declare module Dashboard {
    class RectangleLocation {
        delegate: ng.ILocationService;
        private _path;
        private _hash;
        private _search;
        private uri;
        constructor(delegate: ng.ILocationService, path: string, search: any, hash: string);
        absUrl(): string;
        hash(newHash?: string): any;
        host(): string;
        path(newPath?: string): any;
        port(): number;
        protocol(): number;
        replace(): RectangleLocation;
        search(parametersMap?: any): any;
        url(newValue?: string): any;
    }
}
