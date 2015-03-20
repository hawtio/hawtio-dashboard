/// <reference path="../../includes.ts"/>
/// <reference path="dashboardInterfaces.ts"/>
/**
 * @module Dashboard
 */
module Dashboard {

  export var log:Logging.Logger = Logger.get('Dashboard');

  /**
   * Returns the cleaned up version of the dashboard data without any UI selection state
   * @method cleanDashboardData
   * @static
   * @for Dashboard
   * @param {any} item
   * @return {any}
   */
  export function cleanDashboardData(item) {
    var cleanItem = {};
    angular.forEach(item, (value, key) => {
      if (!angular.isString(key) || (!key.startsWith("$") && !key.startsWith("_"))) {
        cleanItem[key] = value;
      }
    });
    return cleanItem;
  }

  /**
   * Runs decodeURIComponent() on each value in the object
   * @method decodeURIComponentProperties
   * @static
   * @for Dashboard
   * @param {any} hash
   * @return {any}
   */
  export function decodeURIComponentProperties(hash) {
    if (!hash) {
      return hash;
    }
    var decodeHash = {};
    angular.forEach(hash, (value, key) => {
      decodeHash[key] = value ? decodeURIComponent(value) : value;
    });
    return decodeHash;
  }

  export function onOperationComplete(result) {
    console.log("Completed adding the dashboard with response " + JSON.stringify(result));
  }
}
