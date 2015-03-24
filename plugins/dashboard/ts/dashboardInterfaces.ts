module Dashboard {

  export interface SearchMap {
    [name: string]: string;
  }

  export interface DashboardWidget {
    id: string;
    title: string;
    row?: number;
    col?: number;
    size_x?: number;
    size_y?: number;
    path: string;
    include: string;
    search: SearchMap
    routeParams?: string;
  }

  export interface Dashboard {
    id: string;
    title: string;
    group: string;
    widgets: Array<DashboardWidget>;
  }

  export interface DefaultDashboards {
    add: (dashbard:Dashboard) => void;
    remove: (id:string) => Dashboard;
    getAll: () => Array<Dashboard>;
  }

  /**
   * Base interface that dashboard repositories must implement
   *
   * @class DashboardRepository
   */
  export interface DashboardRepository {
    putDashboards: (array:any[], commitMessage:string, fn) => any;
    deleteDashboards: (array:Array<Dashboard>, fn) => any;
    getDashboards: (fn:(dashboards: Array<Dashboard>) => void) => void;
    getDashboard: (id:string, fn: (dashboard: Dashboard) => void) => any;
    createDashboard: (options:any) => any;
    cloneDashboard:(dashboard:any) => any;
    getType:() => string;
  }

}
