/// <reference path="dashboardHelpers.ts"/>
/**
 * @module Dashboard
 */
module Dashboard {

  /**
   * Implements the ng.ILocationService interface and is used by the dashboard to supply
   * controllers with a saved URL location
   *
   * @class RectangleLocation
   */
  export class RectangleLocation { // TODO implements ng.ILocationService {
    private _path: string;
    private _hash: string;
    private _search: any;
    private uri:URI;

    constructor(public delegate:ng.ILocationService, path:string, search, hash:string) {
      this._path = path;
      this._search = search;
      this._hash = hash;
      this.uri = new URI(path);
      this.uri.search((query) => {
        return this._search;
      });
    }

    absUrl() {
      return this.protocol() + this.host() + ":" + this.port() + this.path() + this.search();
    }

    hash(newHash:string = null):any {
      if (newHash) {
        this.uri.search(newHash);
        return this;
      }
      return this._hash;
    }

    host():string {
      return this.delegate.host();
    }

    path(newPath:string = null):any {
      if (newPath) {
        this.uri.path(newPath);
        return this;
      }
      return this._path;
    }

    port():number {
      return this.delegate.port();
    }

    protocol() {
      return this.delegate.port();
    }

    replace() {
      // TODO
      return this;
    }

    search(parametersMap:any = null):any {
      if (parametersMap) {
        this.uri.search(parametersMap);
        return this;
      }
      return this._search;
    }

    url(newValue: string = null):any {
      if (newValue) {
        this.uri = new URI(newValue);
        return this;
      }
      return this.absUrl();
    }

  }
}
